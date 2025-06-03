import { useContext } from 'react';
import { SavedEventsContext } from '../providers/SavedEventsContext';

export function useSavedEvents() {
  return useContext(SavedEventsContext);
} 