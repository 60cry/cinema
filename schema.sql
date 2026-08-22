-- ==========================================================
-- Cinema Alrab - Complete Supabase Database Schema
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yvewuhqsmbomfxujzanv/sql/new
-- ==========================================================

-- 1. Create Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  media_id VARCHAR(255) NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv', 'anime')),
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_comments_media ON public.comments(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_comments_approved ON public.comments(approved);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_rating ON public.comments(rating) WHERE rating IS NOT NULL;

-- 2. Create Comment Upvotes Table
CREATE TABLE IF NOT EXISTS public.comment_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(comment_id, user_identifier)
);

CREATE INDEX IF NOT EXISTS idx_comment_upvotes_comment_id ON public.comment_upvotes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_upvotes_user ON public.comment_upvotes(user_identifier);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_upvotes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for Comments
DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.comments;
CREATE POLICY "Anyone can read approved comments"
  ON public.comments FOR SELECT
  USING (approved = true);

DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
CREATE POLICY "Anyone can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (true);

-- 5. RLS Policies for Comment Upvotes
DROP POLICY IF EXISTS "Anyone can read upvotes" ON public.comment_upvotes;
CREATE POLICY "Anyone can read upvotes"
  ON public.comment_upvotes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert upvotes" ON public.comment_upvotes;
CREATE POLICY "Anyone can insert upvotes"
  ON public.comment_upvotes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete upvotes" ON public.comment_upvotes;
CREATE POLICY "Anyone can delete upvotes"
  ON public.comment_upvotes FOR DELETE
  USING (true);

-- Done!
