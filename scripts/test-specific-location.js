const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSpecificLocation() {
  console.log('🧪 Testing Specific Location Filtering...\n');

  try {
    // Test with the actual event data we have
    const testCases = [
      { type: 'Zip Code', value: '92101', description: 'Testing zip code 92101 (San Diego)' },
      { type: 'City', value: 'San Diego', description: 'Testing city San Diego' },
      { type: 'State', value: 'CA', description: 'Testing state CA' },
      { type: 'Address Part', value: 'Park Blvd', description: 'Testing address part Park Blvd' },
      { type: 'Mission Bay', value: 'Mission Bay', description: 'Testing Mission Bay' },
      { type: 'Beach', value: 'Beach', description: 'Testing Beach' },
    ];

    for (const testCase of testCases) {
      console.log(`📋 ${testCase.description}...`);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .ilike('location_address', `%${testCase.value}%`);

      if (error) {
        console.error(`❌ Error testing ${testCase.type}:`, error);
      } else {
        console.log(`✅ Found ${data?.length || 0} events with ${testCase.type} "${testCase.value}"`);
        if (data && data.length > 0) {
          data.forEach(event => {
            console.log(`  - ${event.title}: ${event.location_address}`);
          });
        }
      }
      console.log('');
    }

    // Test the exact address
    console.log('📋 Testing exact address match...');
    const { data: exactMatch, error: exactError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .eq('location_address', '401 Park Blvd, San Diego, CA 92101');

    if (exactError) {
      console.error('❌ Error with exact match:', exactError);
    } else {
      console.log(`✅ Found ${exactMatch?.length || 0} events with exact address match`);
      if (exactMatch && exactMatch.length > 0) {
        exactMatch.forEach(event => {
          console.log(`  - ${event.title}: ${event.location_address}`);
        });
      }
    }

    console.log('\n🎉 Specific location tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testSpecificLocation();
}

module.exports = { testSpecificLocation }; 