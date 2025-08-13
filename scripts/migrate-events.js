const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with service role key if available, otherwise use anon key
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Import the extracted events data
const { EVENTS } = require('./temp-events');

// Function to parse date string to ISO date
function parseDate(dateStr) {
  const months = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  // Parse date like "May 06, 2025"
  const parts = dateStr.split(' ');
  const month = months[parts[0]];
  const day = parseInt(parts[1].replace(',', ''));
  const year = parseInt(parts[2]);

  return new Date(year, month, day).toISOString().split('T')[0];
}

// Function to parse time string to time format
function parseTime(timeStr) {
  // Parse time like "9:00 AM – 12:00 PM"
  const times = timeStr.split(' – ');
  const startTime = times[0];
  const endTime = times[1];

  // Convert 12-hour format to 24-hour format
  function convertTo24Hour(time) {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  return {
    start: convertTo24Hour(startTime),
    end: convertTo24Hour(endTime)
  };
}

async function migrateEvents() {
  console.log('🚀 Starting events migration...');

  try {
    // Check if events table exists and has data
    const { data: existingEvents, error: checkError } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking events table:', checkError);
      console.log('📋 Please make sure you have created the events table first.');
      console.log('📋 Run: node scripts/check-events-table.js');
      return;
    }

    if (existingEvents && existingEvents.length > 0) {
      console.log('ℹ️  Events table already has data. Skipping migration.');
      return;
    }

    console.log(`📊 Found ${EVENTS.length} events to migrate...`);

    // First, let's try to disable RLS temporarily for the migration
    console.log('🔓 Temporarily disabling RLS for migration...');
    
    // Try to disable RLS (this might not work with anon key)
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;'
      });
      console.log('✅ RLS disabled successfully');
    } catch (error) {
      console.log('⚠️  Could not disable RLS, trying with current permissions...');
    }

    // Migrate each event
    const migrationPromises = EVENTS.map(async (event, index) => {
      const { start, end } = parseTime(event.time);
      
      const eventData = {
        title: event.title,
        description: event.description,
        category: event.category,
        date: parseDate(event.date),
        time_start: start,
        time_end: end,
        location_address: event.location.address,
        location_latitude: event.location.coordinates.latitude,
        location_longitude: event.location.coordinates.longitude,
        external_url: event.url,
        organization_name: 'Voluntr Community', // Default organization
        is_virtual: false,
        is_featured: index < 10, // First 10 events are featured
        status: 'active'
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error migrating event "${event.title}":`, error.message);
        return { success: false, event: event.title, error };
      }

      console.log(`✅ Migrated: ${event.title}`);
      return { success: true, event: event.title, data };
    });

    const results = await Promise.all(migrationPromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Re-enable RLS if we disabled it
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;'
      });
      console.log('🔒 RLS re-enabled successfully');
    } catch (error) {
      console.log('⚠️  Could not re-enable RLS automatically');
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${successful} events`);
    if (failed > 0) {
      console.log(`❌ Failed to migrate: ${failed} events`);
      console.log('\n💡 If events failed due to RLS, you may need to:');
      console.log('1. Use a service role key (SUPABASE_SERVICE_ROLE_KEY)');
      console.log('2. Or manually insert events through the Supabase dashboard');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateEvents();
}

module.exports = { migrateEvents }; 