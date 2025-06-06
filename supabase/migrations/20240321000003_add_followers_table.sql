-- Create followers table
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- Add RLS policies
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Policy for viewing followers
CREATE POLICY "Users can view followers"
    ON public.followers
    FOR SELECT
    USING (true);

-- Policy for following others
CREATE POLICY "Users can follow others"
    ON public.followers
    FOR INSERT
    WITH CHECK (
        auth.uid() = follower_id AND
        follower_id != following_id
    );

-- Policy for unfollowing
CREATE POLICY "Users can unfollow"
    ON public.followers
    FOR DELETE
    USING (auth.uid() = follower_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema'; 