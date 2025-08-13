import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event } from '../types/event';
import { useAuth } from '../context/AuthContext';
import { checkAndUpdateBadges, getEventById } from '../lib/supabase';
import { convertDatabaseEventToEvent } from '../types/event';
import { supabase } from '../lib/supabase';

interface SavedEventsContextType {
  savedEvents: Event[];
  isLoading: boolean;
  saveEvent: (eventId: string) => Promise<void>;
  unsaveEvent: (eventId: string) => Promise<void>;
}

const defaultContext: SavedEventsContextType = {
  savedEvents: [],
  isLoading: true,
  saveEvent: async () => {},
  unsaveEvent: async () => {},
};

export const SavedEventsContext = createContext<SavedEventsContextType>(defaultContext);

export const SavedEventsProvider = ({ children }: { children: ReactNode }) => {
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadSavedEvents = async () => {
    if (!user) {
      setSavedEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_events')
        .select('event_id')
        .eq('user_id', user.id);

      if (error) throw error;

      // Fetch the actual event data for each saved event ID
      const savedEventsData: Event[] = [];
      for (const item of data) {
        const { data: event, error: eventError } = await getEventById(item.event_id);
        if (event && !eventError) {
          savedEventsData.push(convertDatabaseEventToEvent(event));
        }
      }
      
      setSavedEvents(savedEventsData);
    } catch (e) {
      console.error('Error loading saved events:', e);
      setSavedEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSavedEvents();
  }, [user]);

  const saveEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_events')
        .insert([{ user_id: user.id, event_id: eventId }]);

      if (error) {
        // If it's a duplicate key error, the event is already saved
        if (error.code === '23505') {
          return; // Event is already saved, no need to do anything
        }
        throw error;
      }

      // Fetch the event data and add it to saved events
      const { data: event, error: eventError } = await getEventById(eventId);
      if (event && !eventError) {
        setSavedEvents(prev => [...prev, convertDatabaseEventToEvent(event)]);
      }

      // Check and update badges after saving an event
      await checkAndUpdateBadges(user.id);
    } catch (e) {
      console.error('Error saving event:', e);
      // Don't throw the error, just log it
    }
  };

  const unsaveEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) throw error;

      setSavedEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) {
      console.error('Error unsaving event:', e);
    }
  };

  return (
    <SavedEventsContext.Provider value={{ savedEvents, isLoading, saveEvent, unsaveEvent }}>
      {children}
    </SavedEventsContext.Provider>
  );
}; 