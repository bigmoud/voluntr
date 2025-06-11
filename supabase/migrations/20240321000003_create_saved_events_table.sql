-- Create saved_events table
CREATE TABLE IF NOT EXISTS public.saved_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- Add RLS policies
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own saved events
CREATE POLICY "Users can view their own saved events"
    ON public.saved_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own saved events
CREATE POLICY "Users can insert their own saved events"
    ON public.saved_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own saved events
CREATE POLICY "Users can delete their own saved events"
    ON public.saved_events
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS saved_events_user_id_idx ON public.saved_events(user_id);
CREATE INDEX IF NOT EXISTS saved_events_event_id_idx ON public.saved_events(event_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 