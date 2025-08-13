const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testZipCodeSimple() {
  console.log('🧪 Testing Simple Zip Code Filtering...\n');

  try {
    // Test 1: Get all events
    console.log('📋 Test 1: Getting all events...');
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active');

    if (allError) {
      console.error('❌ Error getting all events:', allError);
      return;
    }

    console.log(`✅ Found ${allEvents?.length || 0} total events`);
    allEvents?.forEach(event => {
      console.log(`  - ${event.title}: ${event.location_address}`);
    });

    // Test 2: Filter by zip code 92101
    console.log('\n📋 Test 2: Filtering by zip code 92101...');
    const { data: zip92101, error: zip92101Error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .ilike('location_address', '%92101%');

    if (zip92101Error) {
      console.error('❌ Error filtering by 92101:', zip92101Error);
    } else {
      console.log(`✅ Found ${zip92101?.length || 0} events with zip 92101`);
      zip92101?.forEach(event => {
        console.log(`  - ${event.title}: ${event.location_address}`);
      });
    }

    // Test 3: Filter by zip code 99999 (should be 0)
    console.log('\n📋 Test 3: Filtering by zip code 99999 (should be 0)...');
    const { data: zip99999, error: zip99999Error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .ilike('location_address', '%99999%');

    if (zip99999Error) {
      console.error('❌ Error filtering by 99999:', zip99999Error);
    } else {
      console.log(`✅ Found ${zip99999?.length || 0} events with zip 99999`);
      zip99999?.forEach(event => {
        console.log(`  - ${event.title}: ${event.location_address}`);
      });
    }

    console.log('\n🎉 Zip code filtering test completed!');
    console.log('📊 Summary:');
    console.log(`  - Total events: ${allEvents?.length || 0}`);
    console.log(`  - Events with zip 92101: ${zip92101?.length || 0}`);
    console.log(`  - Events with zip 99999: ${zip99999?.length || 0}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testZipCodeSimple();
}

module.exports = { testZipCodeSimple }; 