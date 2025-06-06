-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    hours INTEGER,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_profile_picture TEXT,
    user_id TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    likes TEXT[] DEFAULT '{}',
    comments JSONB[] DEFAULT '{}'
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read posts
CREATE POLICY "Allow public read access" ON public.posts
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert their own posts
CREATE POLICY "Allow authenticated users to insert their own posts" ON public.posts
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Create policy to allow users to update their own posts
CREATE POLICY "Allow users to update their own posts" ON public.posts
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Create policy to allow users to delete their own posts
CREATE POLICY "Allow users to delete their own posts" ON public.posts
    FOR DELETE
    USING (auth.uid()::text = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS posts_category_idx ON public.posts(category); 