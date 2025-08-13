-- Function to handle event expiration
CREATE OR REPLACE FUNCTION handle_event_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the event date has passed and status is still 'active'
    IF NEW.date < CURRENT_DATE AND NEW.status = 'active' THEN
        NEW.status = 'completed';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update status when event expires
CREATE TRIGGER event_expiration_trigger
    BEFORE INSERT OR UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_expiration();

-- Function to clean up expired events (optional - for automatic deletion)
CREATE OR REPLACE FUNCTION cleanup_expired_events(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete events that are older than specified days and have status 'completed' or 'cancelled'
    DELETE FROM public.events 
    WHERE date < (CURRENT_DATE - INTERVAL '1 day' * days_to_keep)
    AND status IN ('completed', 'cancelled');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to update all expired events to 'completed' status
CREATE OR REPLACE FUNCTION update_expired_events()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Update all events that have passed their date and are still 'active'
    UPDATE public.events 
    SET status = 'completed', updated_at = timezone('utc'::text, now())
    WHERE date < CURRENT_DATE 
    AND status = 'active';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$ language 'plpgsql';

-- Create a scheduled job to run daily (if using pg_cron extension)
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- Uncomment the following lines if you have pg_cron enabled:
/*
SELECT cron.schedule(
    'update-expired-events',
    '0 2 * * *', -- Run at 2 AM daily
    'SELECT update_expired_events();'
);
*/

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 