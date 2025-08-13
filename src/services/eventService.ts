import { Event, EventCategory, convertDatabaseEventToEvent } from '../types/event';
import { getEvents, getEventById } from '../lib/supabase';

export const eventService = {
  getEvents: async (filters?: {
    categories?: EventCategory[];
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
  }) => {
    try {
      console.log('🔍 eventService.getEvents called with filters:', filters);
      const { data, error } = await getEvents({
        categories: filters?.categories || [],
        includeExpired: false,
        location: filters?.location
      });
      
      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }
      
      console.log('📋 Raw data from Supabase:', data?.length || 0, 'events');
      // Convert database events to frontend events
      return (data || []).map(convertDatabaseEventToEvent);
    } catch (error) {
      console.error('Error in eventService.getEvents:', error);
      return [];
    }
  },

  getEventById: async (eventId: string) => {
    try {
      const { data, error } = await getEventById(eventId);
      
      if (error) {
        console.error('Error fetching event:', error);
        return null;
      }
      
      return data ? convertDatabaseEventToEvent(data) : null;
    } catch (error) {
      console.error('Error in eventService.getEventById:', error);
      return null;
    }
  },

  getEventsByCategory: async (category: EventCategory) => {
    try {
      const { data, error } = await getEvents({
        categories: [category],
        includeExpired: false
      });
      
      if (error) {
        console.error('Error fetching events by category:', error);
        return [];
      }
      
      // Convert database events to frontend events
      return (data || []).map(convertDatabaseEventToEvent);
    } catch (error) {
      console.error('Error in eventService.getEventsByCategory:', error);
      return [];
    }
  },

  getEventsByLocation: async (location: {
    zipCode?: string;
    region?: string;
    city?: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }) => {
    try {
      const { data, error } = await getEvents({
        includeExpired: false,
        location
      });
      
      if (error) {
        console.error('Error fetching events by location:', error);
        return [];
      }
      
      // Convert database events to frontend events
      return (data || []).map(convertDatabaseEventToEvent);
    } catch (error) {
      console.error('Error in eventService.getEventsByLocation:', error);
      return [];
    }
  }
}; 