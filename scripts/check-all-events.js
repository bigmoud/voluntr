const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAllEvents() {
  console.log('🔍 Checking ALL events in the database...\n');

  try {
    // Test 1: Get ALL events (no status filter)
    console.log('📋 Test 1: Getting ALL events (no status filter)...');
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (allEventsError) {
      console.error('❌ Error getting all events:', allEventsError);
      return;
    }

    console.log(`✅ Found ${allEvents?.length || 0} total events in database`);
    if (allEvents && allEvents.length > 0) {
      console.log('📋 All events:');
      allEvents.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.title}`);
        console.log(`     Status: ${event.status}`);
        console.log(`     Location: ${event.location_address}`);
        console.log(`     Date: ${event.date}`);
        console.log(`     Created: ${event.created_at}`);
        console.log('');
      });
    }

    // Test 2: Get events by status
    console.log('📋 Test 2: Getting events by status...');
    const statuses = ['active', 'draft', 'cancelled', 'completed'];
    
    for (const status of statuses) {
      const { data: statusEvents, error: statusError } = await supabase
        .from('events')
        .select('*')
        .eq('status', status);

      if (statusError) {
        console.error(`❌ Error getting ${status} events:`, statusError);
      } else {
        console.log(`✅ Found ${statusEvents?.length || 0} ${status} events`);
        if (statusEvents && statusEvents.length > 0) {
          statusEvents.forEach(event => {
            console.log(`  - ${event.title}: ${event.location_address}`);
          });
        }
      }
    }

    // Test 3: Check for events with different location formats
    console.log('\n📋 Test 3: Checking location address formats...');
    if (allEvents && allEvents.length > 0) {
      const locationFormats = new Set();
      allEvents.forEach(event => {
        if (event.location_address) {
          locationFormats.add(event.location_address);
        }
      });
      
      console.log('📍 Location addresses found:');
      Array.from(locationFormats).forEach(address => {
        console.log(`  - "${address}"`);
      });
    }

    console.log('\n🎉 All events check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
if (require.main === module) {
  checkAllEvents();
}

module.exports = { checkAllEvents }; 