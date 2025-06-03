export type EventCategory = 
  | '🌿 Environment'
  | '🏘️ Community'
  | '🤝 Care & Relief'
  | '📚 Youth & Education'
  | '❤️ Health & Animals'
  | '🕊️ Faith-Based';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
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
  dateRange: 'week' | 'month' | 'custom';
  customDateRange?: {
    start: string;
    end: string;
  };
  distance: number; // in miles
  type: 'in-person' | 'virtual' | 'both';
}; 