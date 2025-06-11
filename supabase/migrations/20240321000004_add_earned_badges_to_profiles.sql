-- Add earned_badges column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS earned_badges TEXT[] DEFAULT '{}';

-- Add category_breakdown column if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS category_breakdown JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have default values
UPDATE public.profiles
SET 
    earned_badges = COALESCE(earned_badges, '{}'),
    category_breakdown = COALESCE(category_breakdown, '{}'::jsonb)
WHERE 
    earned_badges IS NULL 
    OR category_breakdown IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 