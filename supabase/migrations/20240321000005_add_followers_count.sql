-- Add followers_count and following_count columns to profiles table
ALTER TABLE profiles
ADD COLUMN followers_count INTEGER DEFAULT 0,
ADD COLUMN following_count INTEGER DEFAULT 0;

-- Update existing profiles to have correct followers count
UPDATE profiles
SET followers_count = (
  SELECT COUNT(*)
  FROM followers
  WHERE followed_id = profiles.id
);

-- Update existing profiles to have correct following count
UPDATE profiles
SET following_count = (
  SELECT COUNT(*)
  FROM followers
  WHERE follower_id = profiles.id
); 