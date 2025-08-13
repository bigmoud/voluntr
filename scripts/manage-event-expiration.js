const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function manageEventExpiration() {
  console.log('🕒 Managing event expiration...\n');

  try {
    // Check for expired events that are still active
    console.log('📋 Checking for expired events...');
    const { data: expiredEvents, error: expiredError } = await supabase
      .from('events')
      .select('*')
      .lt('date', new Date().toISOString().split('T')[0])
      .eq('status', 'active')
      .order('date', { ascending: false });

    if (expiredError) {
      console.error('❌ Error checking expired events:', expiredError);
      return;
    }

    if (expiredEvents && expiredEvents.length > 0) {
      console.log(`⚠️  Found ${expiredEvents.length} expired events that are still active:`);
      expiredEvents.forEach(event => {
        console.log(`  - ${event.title} (${event.date})`);
      });
      console.log('');

      // Update expired events to 'completed' status
      console.log('🔄 Updating expired events to "completed" status...');
      const { data: updateResult, error: updateError } = await supabase.rpc('update_expired_events');
      
      if (updateError) {
        console.error('❌ Error updating expired events:', updateError);
      } else {
        console.log(`✅ Successfully updated ${updateResult} expired events to "completed" status`);
      }
    } else {
      console.log('✅ No expired events found');
    }

    console.log('');

    // Check for old completed/cancelled events that could be cleaned up
    console.log('🧹 Checking for old events that could be cleaned up...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: oldEvents, error: oldError } = await supabase
      .from('events')
      .select('*')
      .lt('date', thirtyDaysAgo.toISOString().split('T')[0])
      .in('status', ['completed', 'cancelled'])
      .order('date', { ascending: false });

    if (oldError) {
      console.error('❌ Error checking old events:', oldError);
      return;
    }

    if (oldEvents && oldEvents.length > 0) {
      console.log(`📋 Found ${oldEvents.length} old completed/cancelled events (older than 30 days):`);
      oldEvents.slice(0, 5).forEach(event => {
        console.log(`  - ${event.title} (${event.date}) - ${event.status}`);
      });
      if (oldEvents.length > 5) {
        console.log(`  ... and ${oldEvents.length - 5} more`);
      }
      console.log('');

      // Ask if user wants to clean up old events
      console.log('💡 To clean up old events, run:');
      console.log('   node scripts/cleanup-old-events.js');
    } else {
      console.log('✅ No old events found for cleanup');
    }

    console.log('');
    console.log('🎉 Event expiration management completed!');

  } catch (error) {
    console.error('❌ Error managing event expiration:', error);
  }
}

// Function to clean up old events
async function cleanupOldEvents(daysToKeep = 30) {
  console.log(`🧹 Cleaning up events older than ${daysToKeep} days...\n`);

  try {
    const { data: result, error } = await supabase.rpc('cleanup_expired_events', { days_to_keep: daysToKeep });
    
    if (error) {
      console.error('❌ Error cleaning up old events:', error);
      return;
    }

    console.log(`✅ Successfully cleaned up ${result} old events`);
    console.log(`📋 Events older than ${daysToKeep} days with status 'completed' or 'cancelled' have been removed`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Function to show event statistics
async function showEventStats() {
  console.log('📊 Event Statistics:\n');

  try {
    // Get counts by status
    const { data: activeEvents, error: activeError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    const { data: completedEvents, error: completedError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('status', 'completed');

    const { data: cancelledEvents, error: cancelledError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('status', 'cancelled');

    const { data: draftEvents, error: draftError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('status', 'draft');

    if (activeError || completedError || cancelledError || draftError) {
      console.error('❌ Error getting event statistics');
      return;
    }

    console.log(`📅 Active Events: ${activeEvents?.length || 0}`);
    console.log(`✅ Completed Events: ${completedEvents?.length || 0}`);
    console.log(`❌ Cancelled Events: ${cancelledEvents?.length || 0}`);
    console.log(`📝 Draft Events: ${draftEvents?.length || 0}`);
    console.log(`📊 Total Events: ${(activeEvents?.length || 0) + (completedEvents?.length || 0) + (cancelledEvents?.length || 0) + (draftEvents?.length || 0)}`);

    // Check for expired events
    const { data: expiredEvents, error: expiredError } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .lt('date', new Date().toISOString().split('T')[0])
      .eq('status', 'active');

    if (!expiredError && expiredEvents && expiredEvents.length > 0) {
      console.log(`⚠️  Expired Events (still active): ${expiredEvents.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run based on command line arguments
const command = process.argv[2];

if (require.main === module) {
  switch (command) {
    case 'cleanup':
      const daysToKeep = parseInt(process.argv[3]) || 30;
      cleanupOldEvents(daysToKeep);
      break;
    case 'stats':
      showEventStats();
      break;
    default:
      manageEventExpiration();
      break;
  }
}

module.exports = { manageEventExpiration, cleanupOldEvents, showEventStats }; 