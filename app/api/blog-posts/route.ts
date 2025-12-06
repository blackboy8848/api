import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { BlogPost } from '@/types/database';

// GET all blog posts or single post by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const author = searchParams.get('author');
    const is_published = searchParams.get('is_published');

    if (id) {
      const [rows] = await pool.execute(
        'SELECT * FROM blog_posts WHERE id = ?',
        [id]
      );
      const blogPosts = rows as BlogPost[];
      if (Array.isArray(blogPosts) && blogPosts.length === 0) {
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
      }
      return NextResponse.json(blogPosts[0]);
    }

    let query = 'SELECT * FROM blog_posts WHERE 1=1';
    const params: any[] = [];

    if (author) {
      query += ' AND author = ?';
      params.push(author);
    }

    if (is_published !== null) {
      query += ' AND is_published = ?';
      params.push(is_published === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    const blogPosts = rows as BlogPost[];
    return NextResponse.json(blogPosts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const body: BlogPost = await request.json();
    const { id, author } = body;

    if (!id || !author) {
      return NextResponse.json(
        { error: 'id and author are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO blog_posts (id, title, content, imageUrl, images, author, tags, sections, is_published) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, body.title || null, body.content || null, body.imageUrl || null,
        body.images ? JSON.stringify(body.images) : null, author,
        body.tags ? JSON.stringify(body.tags) : null,
        body.sections ? JSON.stringify(body.sections) : null,
        body.is_published || false
      ]
    );

    return NextResponse.json({ message: 'Blog post created successfully', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update blog post
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<BlogPost> = await request.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const fields = Object.keys(updateFields);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = fields.map(field => {
      if (['images', 'tags', 'sections'].includes(field)) {
        return `${field} = ?`;
      }
      return `${field} = ?`;
    }).join(', ');

    const values = fields.map(field => {
      const value = (updateFields as any)[field];
      if (['images', 'tags', 'sections'].includes(field) && value) {
        return JSON.stringify(value);
      }
      return value;
    });

    const [result] = await pool.execute(
      `UPDATE blog_posts SET ${setClause} WHERE id = ?`,
      [...values, id]
    );

    return NextResponse.json({ message: 'Blog post updated successfully', id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const [result] = await pool.execute('DELETE FROM blog_posts WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

