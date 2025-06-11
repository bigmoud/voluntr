import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event } from '../types/event';
import { EVENTS } from '../data/events';
import { useAuth } from '../context/AuthContext';
import { checkAndUpdateBadges } from '../lib/supabase';
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

      const savedIds = new Set(data.map(item => item.event_id));
      setSavedEvents(EVENTS.filter(e => savedIds.has(e.id)));
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

      if (error) throw error;

      setSavedEvents(prev => [...prev, EVENTS.find(e => e.id === eventId)!]);

      // Check and update badges after saving an event
      await checkAndUpdateBadges(user.id);
    } catch (e) {
      console.error('Error saving event:', e);
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