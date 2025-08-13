# Events System Setup Guide

This guide will help you set up the events system in your Voluntr app using Supabase.

## Database Schema

The events system uses the following Supabase table structure:

### Events Table (`events`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Event title |
| `description` | TEXT | Event description |
| `category` | TEXT | Event category (with emoji) |
| `date` | DATE | Event date |
| `time_start` | TIME | Start time (HH:MM) |
| `time_end` | TIME | End time (HH:MM) |
| `location_address` | TEXT | Full address |
| `location_latitude` | DECIMAL | Latitude coordinate |
| `location_longitude` | DECIMAL | Longitude coordinate |
| `image_url` | TEXT | Event image URL |
| `external_url` | TEXT | External registration link |
| `organization_name` | TEXT | Hosting organization |
| `contact_email` | TEXT | Contact email |
| `contact_phone` | TEXT | Contact phone |
| `max_volunteers` | INTEGER | Maximum volunteers needed |
| `current_volunteers` | INTEGER | Current volunteer count |
| `is_virtual` | BOOLEAN | Whether event is virtual |
| `is_featured` | BOOLEAN | Whether event is featured |
| `status` | TEXT | Event status (active/cancelled/completed/draft) |
| `created_by` | UUID | User who created the event |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Saved Events Table (`saved_events`)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User who saved the event |
| `event_id` | TEXT | ID of the saved event |
| `created_at` | TIMESTAMP | When the event was saved |

## Setup Instructions

### 1. Run Database Migration

First, apply the database migration to create the events table:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration file:
# supabase/migrations/20240321000006_create_events_table.sql
```

### 2. Migrate Existing Events

Run the migration script to populate the database with your existing events:

```bash
# Install ts-node if not already installed
npm install -g ts-node

# Run the migration script
npx ts-node scripts/migrate-events-to-supabase.ts
```

### 3. Update Your App Code

The following files have been updated to support the new events system:

- `src/types/event.ts` - Updated Event types and interfaces
- `src/lib/supabase.ts` - Added event CRUD functions
- `scripts/migrate-events-to-supabase.ts` - Migration script

## Available Functions

### Event Management

```typescript
import { 
  createEvent, 
  getEvents, 
  getEventById, 
  updateEvent, 
  deleteEvent,
  getUserEvents,
  searchEvents,
  getEventsByLocation 
} from '../lib/supabase';

// Create a new event
const { data, error } = await createEvent({
  title: 'Beach Cleanup',
  description: 'Help clean up the beach',
  category: '🌿 Environment',
  date: '2025-01-15',
  time_start: '09:00',
  time_end: '12:00',
  location_address: '123 Beach St, Los Angeles, CA',
  location_latitude: 34.0522,
  location_longitude: -118.2437,
  organization_name: 'Ocean Conservation',
  max_volunteers: 50
});

// Get events with filters
const { data, error } = await getEvents({
  categories: ['🌿 Environment', '🏘️ Community'],
  dateRange: 'week',
  isVirtual: false,
  isFeatured: true,
  limit: 20
});

// Search events
const { data, error } = await searchEvents('beach cleanup', {
  categories: ['🌿 Environment'],
  dateRange: 'month'
});

// Get events by location
const { data, error } = await getEventsByLocation(34.0522, -118.2437, 25);
```

### Event Categories

The system supports these event categories:

- 🌿 Environment
- 🏘️ Community  
- 🤝 Care & Relief
- 📚 Youth & Education
- ❤️ Health & Animals
- 🕊️ Faith-Based

## Row Level Security (RLS)

The events table has the following RLS policies:

- **View**: Anyone can view active events
- **Create**: Authenticated users can create events
- **Update**: Event creators can update their own events
- **Delete**: Event creators can delete their own events

## Event Status

Events can have the following statuses:

- `active` - Event is live and accepting volunteers
- `cancelled` - Event has been cancelled
- `completed` - Event has finished
- `draft` - Event is being prepared (only visible to creator)

## Best Practices

### 1. Event Creation

- Always provide accurate location coordinates for map functionality
- Use descriptive titles and detailed descriptions
- Set appropriate volunteer limits
- Include contact information for organizers

### 2. Event Management

- Update event status when appropriate
- Monitor volunteer counts
- Respond to user inquiries promptly

### 3. Performance

- Use pagination for large event lists
- Implement proper filtering and search
- Cache frequently accessed events

## Integration with Existing Features

The events system integrates with:

- **Saved Events**: Users can save events they're interested in
- **User Profiles**: Track events created by users
- **Badges**: Events contribute to user achievement badges
- **Posts**: Users can create posts about events they attended

## Troubleshooting

### Common Issues

1. **Migration fails**: Ensure Supabase connection is properly configured
2. **RLS errors**: Check that user is authenticated and has proper permissions
3. **Date format errors**: Ensure dates are in ISO format (YYYY-MM-DD)
4. **Time format errors**: Ensure times are in 24-hour format (HH:MM)

### Debugging

Enable Supabase logging to debug issues:

```typescript
// In your supabase client configuration
const supabase = createClient(url, key, {
  auth: {
    // ... auth config
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'voluntr-app'
    }
  }
});
```

## Next Steps

1. Test the migration script with a small subset of events
2. Update your UI components to use the new database functions
3. Implement real-time updates using Supabase subscriptions
4. Add event analytics and reporting features
5. Consider implementing event registration/RSVP functionality 