const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createSimplifiedEventsTable() {
  console.log('🚀 Creating simplified events table...');
  
  try {
    // Check if events table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (existingTable) {
      console.log('⚠️  Events table already exists. You need to drop it first.');
      console.log('');
      console.log('📝 Please run this SQL in your Supabase SQL Editor to drop the existing table:');
      console.log('');
      console.log('DROP TABLE IF EXISTS public.events CASCADE;');
      console.log('');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/sql');
      console.log('📋 Copy and paste the SQL above, then click "Run"');
      console.log('');
      console.log('✅ After dropping the table, run this script again.');
      return;
    }

    console.log('📋 Creating simplified events table...');
    console.log('');
    console.log('📝 Please run this SQL in your Supabase SQL Editor:');
    console.log('');
    console.log(`
-- Create simplified events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        '🌿 Environment',
        '🏘️ Community', 
        '🤝 Care & Relief',
        '📚 Youth & Education',
        '❤️ Health & Animals',
        '🕊️ Faith-Based'
    )),
    date DATE NOT NULL,
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    location_address TEXT NOT NULL,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    external_url TEXT,
    organization_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'draft')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active events
CREATE POLICY "Anyone can view active events"
    ON public.events
    FOR SELECT
    USING (status = 'active');

-- Allow event creators to view their own events (including drafts)
CREATE POLICY "Event creators can view their own events"
    ON public.events
    FOR SELECT
    USING (auth.uid() = created_by);

-- Allow event creators to insert events
CREATE POLICY "Event creators can insert events"
    ON public.events
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Allow event creators to update their own events
CREATE POLICY "Event creators can update their own events"
    ON public.events
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Allow event creators to delete their own events
CREATE POLICY "Event creators can delete their own events"
    ON public.events
    FOR DELETE
    USING (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS events_category_idx ON public.events(category);
CREATE INDEX IF NOT EXISTS events_date_idx ON public.events(date);
CREATE INDEX IF NOT EXISTS events_status_idx ON public.events(status);
CREATE INDEX IF NOT EXISTS events_location_idx ON public.events(location_latitude, location_longitude);
CREATE INDEX IF NOT EXISTS events_created_by_idx ON public.events(created_by);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON public.events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/sql');
    console.log('📋 Copy and paste the SQL above, then click "Run"');
    console.log('');
    console.log('✅ After creating the table, run: node scripts/generate-simplified-sql-inserts.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  createSimplifiedEventsTable();
}

module.exports = { createSimplifiedEventsTable }; 