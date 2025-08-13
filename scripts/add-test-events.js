const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function addTestEvents() {
  console.log('🧪 Adding test events to demonstrate location filtering...\n');

  const testEvents = [
    {
      title: 'Central Park Cleanup',
      description: 'Help clean up Central Park in New York City',
      category: '🌿 Environment',
      date: '2025-09-15',
      time_start: '09:00',
      time_end: '12:00',
      location_address: 'Central Park, New York, NY 10024',
      location_latitude: 40.7829,
      location_longitude: -73.9654,
      external_url: 'https://example.com/central-park',
      organization_name: 'NYC Parks',
      status: 'active'
    },
    {
      title: 'Downtown LA Food Drive',
      description: 'Collect food donations for local shelters',
      category: '🤝 Care & Relief',
      date: '2025-09-20',
      time_start: '10:00',
      time_end: '14:00',
      location_address: '123 Main St, Los Angeles, CA 90012',
      location_latitude: 34.0522,
      location_longitude: -118.2437,
      external_url: 'https://example.com/food-drive',
      organization_name: 'LA Food Bank',
      status: 'active'
    },
    {
      title: 'Miami Beach Restoration',
      description: 'Help restore the natural beach ecosystem',
      category: '🌿 Environment',
      date: '2025-09-25',
      time_start: '08:00',
      time_end: '11:00',
      location_address: 'Miami Beach, Miami, FL 33139',
      location_latitude: 25.7907,
      location_longitude: -80.1300,
      external_url: 'https://example.com/miami-beach',
      organization_name: 'Miami Beach Conservation',
      status: 'active'
    }
  ];

  try {
    for (const event of testEvents) {
      console.log(`📋 Adding event: ${event.title}`);
      
      const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select();

      if (error) {
        console.error(`❌ Error adding ${event.title}:`, error);
      } else {
        console.log(`✅ Successfully added: ${event.title}`);
      }
    }

    console.log('\n🎉 Test events added!');
    console.log('📊 Now you have events in different locations:');
    console.log('  - Mission Bay Beach Cleanup (San Diego, CA 92101)');
    console.log('  - Central Park Cleanup (New York, NY 10024)');
    console.log('  - Downtown LA Food Drive (Los Angeles, CA 90012)');
    console.log('  - Miami Beach Restoration (Miami, FL 33139)');
    console.log('\n🔍 Test the location filtering with:');
    console.log('  - Zip codes: 92101, 10024, 90012, 33139');
    console.log('  - Cities: San Diego, New York, Los Angeles, Miami');
    console.log('  - States: CA, NY, FL');

  } catch (error) {
    console.error('❌ Failed to add test events:', error);
  }
}

// Run the script
if (require.main === module) {
  addTestEvents();
}

module.exports = { addTestEvents }; 