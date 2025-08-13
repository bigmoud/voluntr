const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testCurrentState() {
  console.log('🔍 Testing Current State...\n');

  try {
    // Test 1: Check if there are more events with different statuses
    console.log('📋 Test 1: Checking all events regardless of status...');
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('*');

    if (allError) {
      console.error('❌ Error getting all events:', allError);
      return;
    }

    console.log(`✅ Found ${allEvents?.length || 0} total events in database`);
    allEvents?.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.title}`);
      console.log(`     Status: ${event.status}`);
      console.log(`     Location: ${event.location_address}`);
      console.log(`     Date: ${event.date}`);
      console.log('');
    });

    // Test 2: Check if there are events with different zip codes
    console.log('📋 Test 2: Checking for events with different zip codes...');
    const zipCodes = ['92101', '10024', '90012', '33139', '90210', '10001'];
    
    for (const zipCode of zipCodes) {
      const { data: zipEvents, error: zipError } = await supabase
        .from('events')
        .select('*')
        .ilike('location_address', `%${zipCode}%`);

      if (zipError) {
        console.error(`❌ Error checking zip ${zipCode}:`, zipError);
      } else {
        console.log(`✅ Zip ${zipCode}: ${zipEvents?.length || 0} events`);
        if (zipEvents && zipEvents.length > 0) {
          zipEvents.forEach(event => {
            console.log(`  - ${event.title}: ${event.location_address}`);
          });
        }
      }
    }

    console.log('\n🎉 Current state test completed!');
    console.log('💡 If you only see 1 event, that explains why location filtering seems to not work.');
    console.log('💡 The filtering IS working, but you only have 1 event in your database.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testCurrentState();
}

module.exports = { testCurrentState }; 