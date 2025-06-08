-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment')),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy for viewing notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for inserting notifications
CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

-- Policy for marking notifications as read
CREATE POLICY "Users can mark their notifications as read"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for deleting notifications
CREATE POLICY "Users can delete their notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to handle follow notifications
CREATE OR REPLACE FUNCTION handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, from_user_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for follow notifications
CREATE TRIGGER on_follow
    AFTER INSERT ON public.followers
    FOR EACH ROW
    EXECUTE FUNCTION handle_follow_notification();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema'; 