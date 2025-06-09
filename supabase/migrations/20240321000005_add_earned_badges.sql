-- Add earned_badges column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'earned_badges'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN earned_badges TEXT[] DEFAULT '{}'::text[];
    END IF;
END $$;

-- Update any existing rows to have default empty array
UPDATE public.profiles
SET earned_badges = '{}'::text[]
WHERE earned_badges IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 