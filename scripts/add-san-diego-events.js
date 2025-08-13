const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function addSanDiegoEvents() {
  console.log('🌊 Adding San Diego Events to Database...\n');

  const sanDiegoEvents = [
    {
      title: 'Balboa Park Cleanup',
      description: 'Help maintain the beauty of Balboa Park by participating in our monthly cleanup event. We\'ll be removing litter and maintaining the gardens.',
      category: '🌿 Environment',
      date: '2025-09-20',
      time_start: '09:00',
      time_end: '12:00',
      location_address: '1549 El Prado, San Diego, CA 92101',
      location_latitude: 32.7313,
      location_longitude: -117.1507,
      external_url: 'https://example.com/balboa-park-cleanup',
      organization_name: 'Balboa Park Conservancy',
      status: 'active'
    },
    {
      title: 'La Jolla Beach Cleanup',
      description: 'Join us for a beach cleanup at La Jolla Cove. Help protect marine life by removing plastic and debris from our beautiful coastline.',
      category: '🌿 Environment',
      date: '2025-09-25',
      time_start: '08:00',
      time_end: '11:00',
      location_address: '1100 Coast Blvd, La Jolla, CA 92037',
      location_latitude: 32.8328,
      location_longitude: -117.2713,
      external_url: 'https://example.com/la-jolla-cleanup',
      organization_name: 'Surfrider Foundation',
      status: 'active'
    },
    {
      title: 'Downtown San Diego Food Drive',
      description: 'Help collect food donations for local families in need. We\'ll be stationed at various locations throughout downtown.',
      category: '🤝 Community',
      date: '2025-09-28',
      time_start: '10:00',
      time_end: '16:00',
      location_address: '400 B St, San Diego, CA 92101',
      location_latitude: 32.7157,
      location_longitude: -117.1611,
      external_url: 'https://example.com/food-drive',
      organization_name: 'San Diego Food Bank',
      status: 'active'
    },
    {
      title: 'Mission Bay Park Restoration',
      description: 'Help restore native plants and remove invasive species at Mission Bay Park. Learn about local ecology while making a difference.',
      category: '🌿 Environment',
      date: '2025-10-05',
      time_start: '09:30',
      time_end: '13:30',
      location_address: '2688 E Mission Bay Dr, San Diego, CA 92109',
      location_latitude: 32.7834,
      location_longitude: -117.2047,
      external_url: 'https://example.com/mission-bay-restoration',
      organization_name: 'San Diego Parks Foundation',
      status: 'active'
    },
    {
      title: 'North Park Community Garden',
      description: 'Volunteer at the North Park Community Garden. Help with planting, watering, and maintaining the garden that provides fresh produce to local families.',
      category: '🌱 Food & Agriculture',
      date: '2025-10-12',
      time_start: '08:00',
      time_end: '12:00',
      location_address: '3077 University Ave, San Diego, CA 92104',
      location_latitude: 32.7489,
      location_longitude: -117.1297,
      external_url: 'https://example.com/north-park-garden',
      organization_name: 'North Park Community Garden',
      status: 'active'
    },
    {
      title: 'Coronado Beach Cleanup',
      description: 'Join us for a cleanup at Coronado Beach. Help keep our beaches clean and safe for everyone to enjoy.',
      category: '🌿 Environment',
      date: '2025-10-18',
      time_start: '07:30',
      time_end: '10:30',
      location_address: '1000 Ocean Blvd, Coronado, CA 92118',
      location_latitude: 32.6869,
      location_longitude: -117.1831,
      external_url: 'https://example.com/coronado-cleanup',
      organization_name: 'Coronado Beach Coalition',
      status: 'active'
    },
    {
      title: 'Gaslamp Quarter Historical Tour',
      description: 'Volunteer as a tour guide for the Gaslamp Quarter Historical Foundation. Share the rich history of San Diego with visitors.',
      category: '🎨 Arts & Culture',
      date: '2025-10-25',
      time_start: '14:00',
      time_end: '17:00',
      location_address: '410 Island Ave, San Diego, CA 92101',
      location_latitude: 32.7105,
      location_longitude: -117.1605,
      external_url: 'https://example.com/gaslamp-tour',
      organization_name: 'Gaslamp Quarter Historical Foundation',
      status: 'active'
    }
  ];

  console.log(`📝 Attempting to add ${sanDiegoEvents.length} San Diego events...\n`);

  for (let i = 0; i < sanDiegoEvents.length; i++) {
    const event = sanDiegoEvents[i];
    console.log(`Adding event ${i + 1}/${sanDiegoEvents.length}: ${event.title}`);
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([event]);

      if (error) {
        console.error(`❌ Error adding ${event.title}:`, error.message);
      } else {
        console.log(`✅ Successfully added: ${event.title}`);
      }
    } catch (err) {
      console.error(`❌ Exception adding ${event.title}:`, err.message);
    }
    
    console.log('');
  }

  console.log('🎉 San Diego events addition completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Check your Supabase dashboard to verify the events were added');
  console.log('2. Test the location filtering in your app with zip code 91941');
  console.log('3. You should now see 8 events within 50 miles of Pine Valley!');
}

// Run the function
if (require.main === module) {
  addSanDiegoEvents();
}

module.exports = { addSanDiegoEvents }; 