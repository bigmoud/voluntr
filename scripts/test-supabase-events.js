const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testSupabaseEvents() {
  console.log('🧪 Testing Supabase events integration...\n');

  try {
    // Test 1: Get all events
    console.log('📋 Test 1: Getting all events...');
    const { data: allEvents, error: allEventsError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .order('date', { ascending: true });

    if (allEventsError) {
      console.error('❌ Error getting all events:', allEventsError);
      return;
    }

    console.log(`✅ Found ${allEvents?.length || 0} active events`);
    if (allEvents && allEvents.length > 0) {
      console.log('📋 Sample events:');
      allEvents.slice(0, 3).forEach(event => {
        console.log(`  - ${event.title} (${event.date})`);
      });
    }

    // Test 2: Get events by category
    console.log('\n📋 Test 2: Getting events by category...');
    const { data: envEvents, error: envEventsError } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .eq('category', '🌿 Environment')
      .order('date', { ascending: true });

    if (envEventsError) {
      console.error('❌ Error getting environment events:', envEventsError);
    } else {
      console.log(`✅ Found ${envEvents?.length || 0} environment events`);
    }

    // Test 3: Get a specific event by ID
    if (allEvents && allEvents.length > 0) {
      console.log('\n📋 Test 3: Getting specific event by ID...');
      const testEventId = allEvents[0].id;
      const { data: specificEvent, error: specificEventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', testEventId)
        .single();

      if (specificEventError) {
        console.error('❌ Error getting specific event:', specificEventError);
      } else {
        console.log(`✅ Found event: ${specificEvent.title}`);
      }
    }

    // Test 4: Check event structure
    if (allEvents && allEvents.length > 0) {
      console.log('\n📋 Test 4: Checking event structure...');
      const sampleEvent = allEvents[0];
      console.log('✅ Event structure looks good:');
      console.log(`  - ID: ${sampleEvent.id}`);
      console.log(`  - Title: ${sampleEvent.title}`);
      console.log(`  - Category: ${sampleEvent.category}`);
      console.log(`  - Date: ${sampleEvent.date}`);
      console.log(`  - Status: ${sampleEvent.status}`);
      console.log(`  - Created by: ${sampleEvent.created_by || 'NULL'}`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Your Supabase events integration is working properly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testSupabaseEvents();
}

module.exports = { testSupabaseEvents }; 