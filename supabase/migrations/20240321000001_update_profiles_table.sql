-- Drop existing columns if they exist (to ensure clean state)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS total_hours,
DROP COLUMN IF EXISTS total_events,
DROP COLUMN IF EXISTS categories;

-- Add columns with proper types
ALTER TABLE public.profiles
ADD COLUMN total_hours INTEGER DEFAULT 0,
ADD COLUMN total_events INTEGER DEFAULT 0,
ADD COLUMN categories JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have default values
UPDATE public.profiles
SET 
    total_hours = COALESCE(total_hours, 0),
    total_events = COALESCE(total_events, 0),
    categories = COALESCE(categories, '{}'::jsonb)
WHERE 
    total_hours IS NULL 
    OR total_events IS NULL 
    OR categories IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 