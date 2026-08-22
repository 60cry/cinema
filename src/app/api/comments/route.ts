import { supabaseServer } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Define the error response type
interface ErrorResponse {
  error: {
    status: number;
    message: string;
  };
}

// GET handler to fetch comments
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get('mediaId');
  const mediaType = searchParams.get('mediaType');

  if (!mediaId || !mediaType) {
    return NextResponse.json({ error: 'Missing mediaId or mediaType' }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseServer
      .from('comments')
      .select('id, created_at, name, content')
      .eq('media_id', mediaId)
      .eq('media_type', mediaType)
      .eq('approved', true) // Still respecting the approved flag
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching comments:', error);
      throw error; // Let the generic error handler catch it
    }
    return NextResponse.json(data || []);
  } catch (error: unknown) {
    console.error('Error processing comment:', error);
    return NextResponse.json({
      error: {
        status: 500,
        message: 'An error occurred while processing your comment'
      }
    } as ErrorResponse, { status: 500 });
  }
}

// POST handler to create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, content, mediaId, mediaType, rating, parentId } = body;

    // Basic server-side validation (align with table constraints)
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }
    if (!mediaId || typeof mediaId !== 'string') {
      return NextResponse.json({ error: 'Invalid mediaId' }, { status: 400 });
    }
    if (!mediaType || !['movie', 'tv', 'anime'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid mediaType' }, { status: 400 });
    }
    // Validate rating if provided (should be between 1 and 10)
    if (rating !== null && rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 10) {
        return NextResponse.json({ error: 'Invalid rating. Must be between 1 and 10' }, { status: 400 });
      }
    }
    // Validate parentId if provided (should be a string UUID)
    if (parentId !== null && parentId !== undefined) {
      if (typeof parentId !== 'string' || parentId.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });
      }
    }

    const { data, error } = await supabaseServer
      .from('comments')
      .insert({
        name: name.trim(),
        content: content.trim(),
        media_id: mediaId,
        media_type: mediaType,
        rating: rating !== null && rating !== undefined ? rating : null,
        parent_id: parentId !== null && parentId !== undefined ? parentId : null,
        // 'approved' defaults to true based on your table schema
      })
      .select('id, created_at, name, content, rating, parent_id') // Select the newly created comment
      .single(); // Expecting a single record back

    if (error) {
      console.error('Supabase error creating comment:', error);
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          error: 'جدول التعليقات غير موجود في قاعدة بيانات Supabase بعد. يرجى تشغيل سكربت schema.sql في Supabase SQL Editor.'
        }, { status: 503 });
      }
      if (error.code === '23514') {
        return NextResponse.json({ error: 'التعليق يخالف شروط الطول المسموحة', details: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: error.message || 'حدث خطأ أثناء حفظ التعليق في قاعدة البيانات' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 }); // 201 Created
  } catch (error: unknown) {
    console.error('Error processing comment:', error);
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء معالجة التعليق';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 