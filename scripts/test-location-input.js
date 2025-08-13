const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Simulate the eventService.getEvents function
async function getEvents(filters = {}) {
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .order('date', { ascending: true });

  // Apply location filters
  if (filters.location) {
    const { location } = filters;
    console.log('🔍 Applying location filters:', location);
    
    if (location.zipCode) {
      console.log('🔍 Filtering by zip code:', location.zipCode);
      query = query.ilike('location_address', `%${location.zipCode}%`);
    }
    
    if (location.city) {
      console.log('🔍 Filtering by city:', location.city);
      query = query.ilike('location_address', `%${location.city}%`);
    }
    
    if (location.state) {
      console.log('🔍 Filtering by state:', location.state);
      query = query.ilike('location_address', `%${location.state}%`);
    }
  }

  const { data, error } = await query;
  console.log('📋 Query results:', data?.length || 0, 'events found');
  if (data && data.length > 0) {
    console.log('📋 Sample event:', data[0].title, '-', data[0].location_address);
  }
  return { data, error };
}

async function testLocationInput() {
  console.log('🧪 Testing Location Input Behavior...\n');

  try {
    // Test 1: No location filter (should show all events)
    console.log('📋 Test 1: No location filter');
    const { data: allEvents } = await getEvents();
    console.log(`✅ Found ${allEvents?.length || 0} events\n`);

    // Test 2: Zip code that matches (92101)
    console.log('📋 Test 2: Zip code 92101 (should match)');
    const { data: matchEvents } = await getEvents({ 
      location: { zipCode: '92101' } 
    });
    console.log(`✅ Found ${matchEvents?.length || 0} events\n`);

    // Test 3: Zip code that doesn't match (99999)
    console.log('📋 Test 3: Zip code 99999 (should not match)');
    const { data: noMatchEvents } = await getEvents({ 
      location: { zipCode: '99999' } 
    });
    console.log(`✅ Found ${noMatchEvents?.length || 0} events\n`);

    // Test 4: City that matches (San Diego)
    console.log('📋 Test 4: City San Diego (should match)');
    const { data: cityEvents } = await getEvents({ 
      location: { city: 'San Diego' } 
    });
    console.log(`✅ Found ${cityEvents?.length || 0} events\n`);

    // Test 5: City that doesn't match (New York)
    console.log('📋 Test 5: City New York (should not match)');
    const { data: noCityEvents } = await getEvents({ 
      location: { city: 'New York' } 
    });
    console.log(`✅ Found ${noCityEvents?.length || 0} events\n`);

    console.log('🎉 Location input tests completed!');
    console.log('📊 Summary:');
    console.log(`  - All events: ${allEvents?.length || 0}`);
    console.log(`  - Zip 92101: ${matchEvents?.length || 0}`);
    console.log(`  - Zip 99999: ${noMatchEvents?.length || 0}`);
    console.log(`  - City San Diego: ${cityEvents?.length || 0}`);
    console.log(`  - City New York: ${noCityEvents?.length || 0}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testLocationInput();
}

module.exports = { testLocationInput }; 