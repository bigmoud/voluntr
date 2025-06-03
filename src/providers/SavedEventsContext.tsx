import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../types/event';
import { EVENTS } from '../data/events';
import { useAuth } from '../context/AuthContext';

const SAVED_EVENTS_KEY = 'SAVED_EVENT_IDS';

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
    setIsLoading(true);
    try {
      const ids = await AsyncStorage.getItem(SAVED_EVENTS_KEY);
      let savedIds: Set<string> = new Set();
      if (ids) savedIds = new Set(JSON.parse(ids));
      setSavedEvents(EVENTS.filter(e => savedIds.has(e.id)));
    } catch (e) {
      console.error('Error loading saved events:', e);
      setSavedEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSavedEvents();
    } else {
      setSavedEvents([]);
      setIsLoading(false);
    }
  }, [user]);

  const saveEvent = async (eventId: string) => {
    try {
      const ids = await AsyncStorage.getItem(SAVED_EVENTS_KEY);
      let savedIds: Set<string> = new Set();
      if (ids) savedIds = new Set(JSON.parse(ids));
      savedIds.add(eventId);
      await AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(Array.from(savedIds)));
      setSavedEvents(EVENTS.filter(e => savedIds.has(e.id)));
    } catch (e) {
      console.error('Error saving event:', e);
    }
  };

  const unsaveEvent = async (eventId: string) => {
    try {
      const ids = await AsyncStorage.getItem(SAVED_EVENTS_KEY);
      let savedIds: Set<string> = new Set();
      if (ids) savedIds = new Set(JSON.parse(ids));
      savedIds.delete(eventId);
      await AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(Array.from(savedIds)));
      setSavedEvents(EVENTS.filter(e => savedIds.has(e.id)));
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