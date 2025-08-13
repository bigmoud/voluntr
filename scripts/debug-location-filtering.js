const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function debugLocationFiltering() {
  console.log('🔍 Debugging Location Filtering...\n');

  try {
    // Test 1: Get all events first
    console.log('📋 Test 1: Getting all events...');
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active');

    if (allEventsError) {
      console.error('❌ Error getting all events:', allEventsError);
      return;
    }

    console.log(`✅ Found ${allEvents?.length || 0} total events`);
    if (allEvents && allEvents.length > 0) {
      allEvents.forEach(event => {
        console.log(`  - ${event.title}: ${event.location_address}`);
      });
    }

    // Test 2: Test with a zip code that should NOT match
    console.log('\n📋 Test 2: Testing with zip code 99999 (should find 0 events)...');
    const { data: noMatchEvents, error: noMatchError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .ilike('location_address', '%99999%');

    if (noMatchError) {
      console.error('❌ Error testing no-match zip code:', noMatchError);
    } else {
      console.log(`✅ Found ${noMatchEvents?.length || 0} events with zip code 99999`);
      if (noMatchEvents && noMatchEvents.length > 0) {
        noMatchEvents.forEach(event => {
          console.log(`  - ${event.title}: ${event.location_address}`);
        });
      }
    }

    // Test 3: Test with the correct zip code
    console.log('\n📋 Test 3: Testing with zip code 92101 (should find 1 event)...');
    const { data: matchEvents, error: matchError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .ilike('location_address', '%92101%');

    if (matchError) {
      console.error('❌ Error testing matching zip code:', matchError);
    } else {
      console.log(`✅ Found ${matchEvents?.length || 0} events with zip code 92101`);
      if (matchEvents && matchEvents.length > 0) {
        matchEvents.forEach(event => {
          console.log(`  - ${event.title}: ${event.location_address}`);
        });
      }
    }

    // Test 4: Test with a city that should NOT match
    console.log('\n📋 Test 4: Testing with city "New York" (should find 0 events)...');
    const { data: noCityEvents, error: noCityError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .ilike('location_address', '%New York%');

    if (noCityError) {
      console.error('❌ Error testing no-match city:', noCityError);
    } else {
      console.log(`✅ Found ${noCityEvents?.length || 0} events in New York`);
      if (noCityEvents && noCityEvents.length > 0) {
        noCityEvents.forEach(event => {
          console.log(`  - ${event.title}: ${event.location_address}`);
        });
      }
    }

    // Test 5: Test with empty location filter (should return all events)
    console.log('\n📋 Test 5: Testing with no location filter...');
    const { data: allEventsNoFilter, error: allEventsNoFilterError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active');

    if (allEventsNoFilterError) {
      console.error('❌ Error testing no filter:', allEventsNoFilterError);
    } else {
      console.log(`✅ Found ${allEventsNoFilter?.length || 0} events with no filter`);
    }

    console.log('\n🎉 Debug tests completed!');
    console.log('📊 Summary:');
    console.log(`  - Total events in database: ${allEvents?.length || 0}`);
    console.log(`  - Events with zip 99999: ${noMatchEvents?.length || 0}`);
    console.log(`  - Events with zip 92101: ${matchEvents?.length || 0}`);
    console.log(`  - Events in New York: ${noCityEvents?.length || 0}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
if (require.main === module) {
  debugLocationFiltering();
}

module.exports = { debugLocationFiltering }; 