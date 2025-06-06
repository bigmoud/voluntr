-- Add categories column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'categories'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN categories JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Update any existing rows to have default empty object
UPDATE public.profiles
SET categories = '{}'::jsonb
WHERE categories IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 