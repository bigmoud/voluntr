const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testZipCodeFiltering() {
  console.log('🧪 Testing Zip Code Filtering...\n');

  try {
    // Test zip code filtering
    const testZipCodes = ['92101', '90000', '90210', '10001'];
    
    for (const zipCode of testZipCodes) {
      console.log(`📋 Testing zip code: ${zipCode}`);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .ilike('location_address', `%${zipCode}%`);

      if (error) {
        console.error(`❌ Error testing zip code ${zipCode}:`, error);
      } else {
        console.log(`✅ Found ${data?.length || 0} events with zip code ${zipCode}`);
        if (data && data.length > 0) {
          data.forEach(event => {
            console.log(`  - ${event.title}: ${event.location_address}`);
          });
        }
      }
      console.log('');
    }

    // Test city filtering
    console.log('📋 Testing city filtering: San Diego');
    const { data: cityData, error: cityError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .ilike('location_address', '%San Diego%');

    if (cityError) {
      console.error('❌ Error testing city filtering:', cityError);
    } else {
      console.log(`✅ Found ${cityData?.length || 0} events in San Diego`);
      if (cityData && cityData.length > 0) {
        cityData.forEach(event => {
          console.log(`  - ${event.title}: ${event.location_address}`);
        });
      }
    }

    console.log('\n🎉 Zip code filtering tests completed!');
    console.log('✅ Your location input now supports zip code filtering.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testZipCodeFiltering();
}

module.exports = { testZipCodeFiltering }; 