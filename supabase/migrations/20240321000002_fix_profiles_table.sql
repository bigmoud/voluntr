-- First, let's check if the columns exist and drop them if they do
DO $$ 
BEGIN
    -- Drop columns if they exist
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_hours;
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_events;
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS categories;
EXCEPTION
    WHEN undefined_column THEN 
        NULL;
END $$;

-- Now add the columns properly
ALTER TABLE public.profiles
ADD COLUMN total_hours INTEGER NOT NULL DEFAULT 0,
ADD COLUMN total_events INTEGER NOT NULL DEFAULT 0;

-- Update any existing rows
UPDATE public.profiles
SET 
    total_hours = 0,
    total_events = 0
WHERE 
    total_hours IS NULL 
    OR total_events IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 