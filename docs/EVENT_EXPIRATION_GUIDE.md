# Event Expiration System Guide

This guide explains how the automatic event expiration system works in your Voluntr app.

## 🕒 **How Event Expiration Works**

### **Automatic Status Updates**

The system automatically handles expired events in two ways:

1. **Database Trigger**: When events are inserted or updated, a trigger checks if the event date has passed and automatically changes the status from `'active'` to `'completed'`

2. **Manual Cleanup**: Functions are available to manually update expired events and clean up old events

### **Event Lifecycle**

```
📝 Draft → ✅ Active → ✅ Completed (automatic when date passes)
                ↓
            ❌ Cancelled (manual)
```

## 🛠 **Database Functions**

### **1. `update_expired_events()`**
- **Purpose**: Updates all expired events from `'active'` to `'completed'`
- **Returns**: Number of events updated
- **Usage**: Can be called manually or scheduled

### **2. `cleanup_expired_events(days_to_keep)`**
- **Purpose**: Deletes old completed/cancelled events older than specified days
- **Parameters**: `days_to_keep` (default: 30)
- **Returns**: Number of events deleted
- **Usage**: Cleanup old events to save database space

### **3. `handle_event_expiration()`**
- **Purpose**: Trigger function that automatically updates status when events expire
- **Triggered**: On INSERT or UPDATE of events table
- **Action**: Changes status from `'active'` to `'completed'` if date has passed

## 📊 **Available Functions**

### **JavaScript/TypeScript Functions**

```typescript
import { 
  updateExpiredEvents, 
  cleanupExpiredEvents, 
  getExpiredEvents, 
  getCompletedEvents 
} from '../lib/supabase';

// Update all expired events to 'completed'
const { data, error } = await updateExpiredEvents();

// Clean up old events (older than 30 days)
const { data, error } = await cleanupExpiredEvents(30);

// Get events that have expired but are still marked as 'active'
const { data, error } = await getExpiredEvents();

// Get completed events
const { data, error } = await getCompletedEvents(10); // Limit to 10
```

### **Command Line Scripts**

```bash
# Check and update expired events
node scripts/manage-event-expiration.js

# Show event statistics
node scripts/manage-event-expiration.js stats

# Clean up old events (default: 30 days)
node scripts/cleanup-old-events.js

# Clean up old events (custom: 60 days)
node scripts/cleanup-old-events.js 60
```

## 🔄 **Automatic Behavior**

### **When Creating Events**
- Events with past dates are automatically set to `'completed'` status
- Events with future dates are set to `'active'` status

### **When Updating Events**
- If an event date is changed to a past date, status automatically becomes `'completed'`
- If an event date is changed to a future date, status remains as set

### **When Querying Events**
- By default, only `'active'` events are returned
- Use `includeExpired: true` filter to include completed events

## 📅 **Event Status Flow**

```
1. 📝 Draft: Event is being prepared
   ↓ (manual update)
2. ✅ Active: Event is live and accepting volunteers
   ↓ (automatic when date passes)
3. ✅ Completed: Event has finished
   ↓ (optional cleanup after 30 days)
4. 🗑️ Deleted: Event removed from database
```

## 🧹 **Cleanup Strategy**

### **Recommended Cleanup Schedule**

1. **Daily**: Run `updateExpiredEvents()` to mark expired events as completed
2. **Weekly**: Run `cleanupExpiredEvents(30)` to remove old completed/cancelled events
3. **Monthly**: Review event statistics and adjust cleanup parameters

### **Cleanup Parameters**

- **30 days**: Good balance between keeping history and saving space
- **60 days**: Keep more historical data
- **7 days**: Aggressive cleanup for high-volume systems

## 📈 **Monitoring and Statistics**

### **Event Statistics**

```bash
node scripts/manage-event-expiration.js stats
```

This shows:
- Active Events count
- Completed Events count
- Cancelled Events count
- Draft Events count
- Expired Events (still active) count
- Total Events count

### **Manual Monitoring**

```typescript
// Check for expired events
const { data: expiredEvents } = await getExpiredEvents();
if (expiredEvents && expiredEvents.length > 0) {
  console.log(`Found ${expiredEvents.length} expired events`);
}

// Get recent completed events
const { data: completedEvents } = await getCompletedEvents(5);
```

## ⚙️ **Configuration**

### **Database Setup**

The expiration system requires these database objects:

1. **Trigger**: `event_expiration_trigger`
2. **Function**: `handle_event_expiration()`
3. **Function**: `update_expired_events()`
4. **Function**: `cleanup_expired_events()`

### **Scheduled Jobs (Optional)**

If you have pg_cron enabled in Supabase, you can set up automatic daily updates:

```sql
SELECT cron.schedule(
    'update-expired-events',
    '0 2 * * *', -- Run at 2 AM daily
    'SELECT update_expired_events();'
);
```

## 🚨 **Important Notes**

### **Data Retention**
- Completed events are kept for 30 days by default
- Cancelled events are kept for 30 days by default
- Active and draft events are never automatically deleted
- Manual deletion is always available

### **Performance**
- The trigger runs on every INSERT/UPDATE but is very lightweight
- Cleanup functions should be run during low-traffic periods
- Large cleanup operations can be batched

### **Recovery**
- Deleted events cannot be recovered
- Consider backing up events before major cleanup operations
- Use soft deletes (status = 'deleted') if recovery is important

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Events not updating automatically**
   - Check if the trigger is properly installed
   - Verify the function `handle_event_expiration()` exists

2. **Cleanup not working**
   - Ensure you have proper permissions
   - Check if the function `cleanup_expired_events()` exists

3. **Performance issues**
   - Run cleanup during off-peak hours
   - Consider batching large cleanup operations

### **Manual Override**

If automatic expiration isn't working, you can manually update events:

```sql
-- Update specific expired event
UPDATE events 
SET status = 'completed', updated_at = NOW() 
WHERE id = 'your-event-id' AND date < CURRENT_DATE;

-- Update all expired events
SELECT update_expired_events();
```

This system ensures your events are always up-to-date and your database stays clean! 🎉 