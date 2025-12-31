# AWS S3 Setup Guide

This guide will help you configure AWS S3 for file storage in this application.

## Prerequisites

1. An AWS account
2. An S3 bucket created in your AWS account
3. AWS Access Key ID and Secret Access Key with S3 permissions

## Step 1: Create S3 Bucket

1. Log in to the [AWS Console](https://console.aws.amazon.com/)
2. Navigate to **S3** service
3. Click **Create bucket**
4. Configure your bucket:
   - **Bucket name**: `mmbcommunity` (or your preferred name)
   - **Region**: `Asia Pacific (Mumbai) ap-south-1` (or your preferred region)
   - **Block Public Access settings**: Uncheck "Block all public access" if you want public file access
   - Click **Create bucket**

## Step 2: Configure Bucket Permissions

**Important:** If your bucket uses "Bucket owner enforced" mode (recommended for security), you **must** use bucket policies for public access. ACLs are disabled in this mode.

1. Go to your bucket → **Permissions** tab
2. Check **Object Ownership** - if it shows "Bucket owner enforced", you're using the recommended security mode
3. Under **Bucket policy**, add the following policy (replace `mmbcommunity` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mmbcommunity/*"
    }
  ]
}
```

**Note:** This bucket policy makes all objects publicly readable. If you need private files, remove this policy or modify it to restrict access.

3. Under **CORS configuration**, add:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## Step 3: Create IAM User with S3 Access

1. Navigate to **IAM** service in AWS Console
2. Click **Users** → **Create user**
3. Enter username (e.g., `s3-upload-user`)
4. Select **Provide user access to the AWS Management Console** → **I want to create an IAM user**
5. Click **Next**
6. Under **Set permissions**, select **Attach policies directly**
7. Search for and select **AmazonS3FullAccess** (or create a custom policy with only necessary permissions)
8. Click **Next** → **Create user**

## Step 4: Create Access Keys

1. Click on the created IAM user
2. Go to **Security credentials** tab
3. Scroll to **Access keys** section
4. Click **Create access key**
5. Select **Application running outside AWS**
6. Click **Next** → **Create access key**
7. **IMPORTANT**: Copy both:
   - **Access key ID** (e.g., `AKIAXXXXXXXXXXXXXXXX`)
   - **Secret access key** (e.g., `your_secret_access_key_here`)
   - ⚠️ The secret key is shown only once - save it securely!

## Step 5: Configure Environment Variables

Create or update your `.env.local` file with:

```env
# AWS S3 Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_S3_BUCKET_NAME=mmbcommunity
```

**Replace the values with your actual credentials!**

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the upload endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/upload \
     -F "file=@/path/to/test-image.jpg" \
     -F "folder=test"
   ```

3. Check your S3 bucket to verify the file was uploaded

## Security Best Practices

1. **Never commit `.env.local` to version control** - it's already in `.gitignore`
2. **Use IAM roles with least privilege** - only grant S3 permissions needed
3. **Rotate access keys regularly** - update them every 90 days
4. **Use bucket policies** - restrict access to specific IPs if needed
5. **Enable versioning** - useful for file recovery
6. **Set up lifecycle policies** - automatically delete old files if needed

## Troubleshooting

### Error: "The bucket does not allow ACLs" or "ACL is not supported"
**Cause:** Your bucket uses "Bucket owner enforced" mode (recommended security setting), which disables ACLs.

**Solution:** ✅ **Already fixed!** The code no longer uses ACLs. If you still see this error:
- Make sure you've restarted your development server after the code update
- Verify you're using the latest version of `lib/s3.ts` (should not have `ACL: 'public-read'`)

**For public access:** Use a bucket policy instead (see Step 2 above).

### Error: "The authorization header is malformed; a non-empty Access Key (AKID) must be provided"
**Cause:** AWS credentials are missing or not properly loaded from environment variables.

**Solutions:**
1. **Check `.env.local` exists** in the project root (not in a subdirectory)
2. **Verify credentials are set:**
   ```env
   AWS_ACCESS_KEY_ID=your_access_key_id_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   ```
3. **No quotes needed** - don't wrap values in quotes:
   ```env
   ❌ Wrong: AWS_ACCESS_KEY_ID="your_access_key_id_here"
   ✅ Correct: AWS_ACCESS_KEY_ID=your_access_key_id_here
   ```
4. **Restart your dev server** after updating `.env.local`:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```
5. **Check for typos** - ensure variable names match exactly:
   - `AWS_ACCESS_KEY_ID` (not `AWS_ACCESS_KEY`)
   - `AWS_SECRET_ACCESS_KEY` (not `AWS_SECRET_KEY`)

### Error: "Access Denied"
- Check that your IAM user has S3 permissions
- Verify the bucket name is correct
- Ensure the bucket policy allows public read access (if needed)

### Error: "Bucket does not exist"
- Verify the bucket name in `.env.local` matches your S3 bucket
- Check that the bucket is in the correct region

### Error: "Invalid credentials"
- Double-check your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Ensure there are no extra spaces or quotes in `.env.local`
- Verify the access key hasn't been deleted or rotated in AWS IAM

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [S3 Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)

