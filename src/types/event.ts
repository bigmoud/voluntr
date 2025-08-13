export type EventCategory = 
  | '🌿 Environment'
  | '🏘️ Community'
  | '🤝 Care & Relief'
  | '📚 Youth & Education'
  | '❤️ Health & Animals'
  | '🕊️ Faith-Based';

// Database Event type (matches simplified Supabase schema)
export interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO date string
  time_start: string; // HH:MM format
  time_end: string; // HH:MM format
  location_address: string;
  location_latitude: number | null;
  location_longitude: number | null;
  external_url: string | null;
  organization_name: string | null;
  status: 'active' | 'cancelled' | 'completed' | 'draft';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend Event type (for compatibility with existing code)
export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // Formatted date string
  time: string; // Formatted time range
  location: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  link?: string;
  image?: string;
  url?: string;
  // Additional fields for enhanced functionality
  organization_name?: string;
  status?: string;
  created_by?: string;
}

// Event creation type
export interface CreateEventData {
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time_start: string;
  time_end: string;
  location_address: string;
  location_latitude?: number;
  location_longitude?: number;
  external_url?: string;
  organization_name?: string;
}

// Event update type
export interface UpdateEventData extends Partial<CreateEventData> {
  status?: 'active' | 'cancelled' | 'completed' | 'draft';
}

// Event categories
export const EVENT_CATEGORIES = {
  ENVIRONMENT: '🌿 Environment',
  COMMUNITY: '🏘️ Community',
  CARE_RELIEF: '🤝 Care & Relief',
  YOUTH_EDUCATION: '📚 Youth & Education',
  HEALTH_ANIMALS: '❤️ Health & Animals',
  FAITH_BASED: '🕊️ Faith-Based',
} as const;

// Convert DatabaseEvent to Event (for frontend compatibility)
export const convertDatabaseEventToEvent = (dbEvent: DatabaseEvent): Event => {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    description: dbEvent.description,
    category: dbEvent.category,
    date: new Date(dbEvent.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: `${dbEvent.time_start} – ${dbEvent.time_end}`,
    location: {
      address: dbEvent.location_address,
      coordinates: {
        latitude: dbEvent.location_latitude || 0,
        longitude: dbEvent.location_longitude || 0
      }
    },
    url: dbEvent.external_url || undefined,
    organization_name: dbEvent.organization_name || undefined,
    status: dbEvent.status,
    created_by: dbEvent.created_by || undefined
  };
};

// Group events by category
export const groupEventsByCategory = (events: Event[]) => {
  return events.reduce((acc, event) => {
    const category = event.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(event);
    return acc;
  }, {} as Record<EventCategory, Event[]>);
};

export type EventFilters = {
  categories: EventCategory[];
  dateRange: 'week' | 'month' | 'all';
  customDateRange?: {
    start: string;
    end: string;
  };
  distance: number; // in miles
  type: 'in-person' | 'virtual' | 'both';
  includeExpired?: boolean; // Include expired events in results
  location?: {
    zipCode?: string;
    region?: string;
    city?: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
};

 