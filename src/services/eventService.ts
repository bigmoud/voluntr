import { Event, EventCategory } from '../types/event';
import { EVENTS } from '../data/events';

export const eventService = {
  getEvents: async (categories?: EventCategory[]) => {
    let filtered = EVENTS;
    if (categories && categories.length > 0) {
      filtered = EVENTS.filter(e => categories.includes(e.category));
    }
    return filtered;
  },
}; 