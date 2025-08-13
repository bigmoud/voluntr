-- Add test events to demonstrate location filtering
-- Run these SQL statements in your Supabase SQL Editor

INSERT INTO public.events (
  title, description, category, date, time_start, time_end,
  location_address, location_latitude, location_longitude,
  external_url, organization_name, status
) VALUES (
  'Central Park Cleanup',
  'Help clean up Central Park in New York City',
  '🌿 Environment',
  '2025-09-15',
  '09:00',
  '12:00',
  'Central Park, New York, NY 10024',
  40.7829,
  -73.9654,
  'https://example.com/central-park',
  'NYC Parks',
  'active'
);

INSERT INTO public.events (
  title, description, category, date, time_start, time_end,
  location_address, location_latitude, location_longitude,
  external_url, organization_name, status
) VALUES (
  'Downtown LA Food Drive',
  'Collect food donations for local shelters',
  '🤝 Care & Relief',
  '2025-09-20',
  '10:00',
  '14:00',
  '123 Main St, Los Angeles, CA 90012',
  34.0522,
  -118.2437,
  'https://example.com/food-drive',
  'LA Food Bank',
  'active'
);

INSERT INTO public.events (
  title, description, category, date, time_start, time_end,
  location_address, location_latitude, location_longitude,
  external_url, organization_name, status
) VALUES (
  'Miami Beach Restoration',
  'Help restore the natural beach ecosystem',
  '🌿 Environment',
  '2025-09-25',
  '08:00',
  '11:00',
  'Miami Beach, Miami, FL 33139',
  25.7907,
  -80.1300,
  'https://example.com/miami-beach',
  'Miami Beach Conservation',
  'active'
); 