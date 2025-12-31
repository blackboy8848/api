import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
// Validate that required environment variables are set
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('Warning: AWS credentials not found in environment variables. Make sure to set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'mmbcommunity';

/**
 * Upload a file to S3
 * @param file - File buffer or Uint8Array
 * @param key - S3 object key (path/filename)
 * @param contentType - MIME type of the file
 * @returns Promise with the S3 URL of the uploaded file
 */
export async function uploadToS3(
  file: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      // ACL removed - bucket uses "Bucket owner enforced" mode
      // Public access should be controlled via bucket policies
    });

    await s3Client.send(command);

    // Return the public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
    return url;
  } catch (error: any) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
}

/**
 * Delete a file from S3
 * @param key - S3 object key (path/filename)
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error: any) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
}

/**
 * Generate a presigned URL for temporary access to a private file
 * @param key - S3 object key (path/filename)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Presigned URL
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
}

/**
 * Extract S3 key from a full S3 URL
 * @param url - Full S3 URL
 * @returns S3 key (path/filename)
 */
export function extractKeyFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove leading slash from pathname
    return urlObj.pathname.substring(1);
  } catch {
    // If it's not a full URL, assume it's already a key
    return url;
  }
}

