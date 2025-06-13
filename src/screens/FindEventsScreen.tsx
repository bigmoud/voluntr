import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
  Share,
  Linking,
  Alert,
  Image,
  KeyboardAvoidingView,
  ViewStyle,
  TextStyle,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import { EVENTS } from '../data/events';
import { Event, EventCategory, EVENT_CATEGORIES } from '../types/event';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { eventService } from '../services/eventService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { sleekStyles, SleekGradientBg } from './FindEventsScreen.sleek';

const INITIAL_REGION = {
  latitude: 34.0522,
  longitude: -118.2437,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

type DateFilter = 'all' | 'today' | 'week' | 'month';
type ViewMode = 'map' | 'list';

const CARD_BG = '#fff';
const APP_BG = '#F8FAF7';
const ACCENT_GREEN = '#22543D';
const SECONDARY_TEXT = '#7A7A7A';
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80';

const SAVED_EVENTS_KEY = 'SAVED_EVENT_IDS';

type Styles = {
  container: ViewStyle;
  searchContainer: ViewStyle;
  searchBar: ViewStyle;
  searchIcon: ViewStyle;
  searchInput: TextStyle;
  filterButton: ViewStyle;
  viewModeContainer: ViewStyle;
  viewModeButton: ViewStyle;
  viewModeButtonActive: ViewStyle;
  mapContainer: ViewStyle;
  map: ViewStyle;
  markerContainer: ViewStyle;
  markerText: TextStyle;
  listContainer: ViewStyle;
  eventCardModernNoImage: ViewStyle;
  eventCardHeaderRow: ViewStyle;
  categoryPill: ViewStyle;
  categoryPillText: TextStyle;
  eventCardActionsModern: ViewStyle;
  iconCircle: ViewStyle;
  eventCardContentModern: ViewStyle;
  eventCardTitleModern: TextStyle;
  eventInfoRowModern: ViewStyle;
  eventCardInfoTextModern: TextStyle;
  eventCardDescriptionModern: TextStyle;
  learnMoreButtonModern: ViewStyle;
  learnMoreTextModern: TextStyle;
  filtersContainer: ViewStyle;
  filtersScroll: ViewStyle;
  categoryButton: ViewStyle;
  categoryButtonSelected: ViewStyle;
  categoryText: TextStyle;
  categoryTextSelected: TextStyle;
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalTitle: TextStyle;
  filterSection: ViewStyle;
  filterLabel: TextStyle;
  dateFilterButtons: ViewStyle;
  dateFilterButton: ViewStyle;
  dateFilterButtonSelected: ViewStyle;
  dateFilterText: TextStyle;
  dateFilterTextSelected: TextStyle;
  distanceSlider: ViewStyle;
  distanceText: TextStyle;
  sliderContainer: ViewStyle;
  sliderButton: ViewStyle;
  sliderTrack: ViewStyle;
  sliderFill: ViewStyle;
  applyButton: ViewStyle;
  applyButtonText: TextStyle;
  eventDetailsContainer: ViewStyle;
  eventDetailsHeaderRowFixed: ViewStyle;
  eventDetailsCloseButton: ViewStyle;
  eventDetailsActionsCorner: ViewStyle;
  eventCardScrollContent: ViewStyle;
  eventCardScrollContentInner: ViewStyle;
  eventTitle: TextStyle;
  eventInfo: ViewStyle;
  eventInfoRow: ViewStyle;
  eventInfoText: TextStyle;
  eventDescription: TextStyle;
  registerButton: ViewStyle;
  registerButtonText: TextStyle;
  swiperFlexContainer: ViewStyle;
  swiperCardArea: ViewStyle;
  cardContainer: ViewStyle;
  cardHeaderRow: ViewStyle;
  categoryPillModern: ViewStyle;
  categoryPillTextModern: TextStyle;
  cardActionsModern: ViewStyle;
  iconCircleModern: ViewStyle;
  cardContentModern: ViewStyle;
  cardTitleModern: TextStyle;
  cardInfoRowModern: ViewStyle;
  cardInfoTextModern: TextStyle;
  cardDivider: ViewStyle;
  cardDescriptionScrollModern: ViewStyle;
  cardDescriptionScrollInnerModern: ViewStyle;
  cardDescriptionModern: TextStyle;
  cardLearnMoreButtonModern: ViewStyle;
  cardLearnMoreTextModern: TextStyle;
  swipeButtonsContainerFixed: ViewStyle;
  swipeButton: ViewStyle;
  swipeButtonLeft: ViewStyle;
  swipeButtonRight: ViewStyle;
  categoryFilterGrid: ViewStyle;
  categoryFilterButton: ViewStyle;
  categoryFilterButtonSelected: ViewStyle;
  categoryFilterText: TextStyle;
  categoryFilterTextSelected: TextStyle;
  eventTypeButtons: ViewStyle;
  eventTypeButton: ViewStyle;
  eventTypeButtonSelected: ViewStyle;
  eventTypeText: TextStyle;
  eventTypeTextSelected: TextStyle;
  eventCardDescriptionScroll: ViewStyle;
  eventCardDescriptionScrollInner: ViewStyle;
  input: TextStyle;
  useMyLocationButton: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: APP_BG,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterButton: {
    padding: 5,
  },
  viewModeContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  viewModeButton: {
    padding: 8,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  viewModeButtonActive: {
    backgroundColor: '#4A90E2',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  eventCardModernNoImage: {
    backgroundColor: CARD_BG,
    borderRadius: 28,
    marginHorizontal: 16,
    marginTop: 40,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 340,
    justifyContent: 'flex-start',
  },
  eventCardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  categoryPill: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: ACCENT_GREEN,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    zIndex: 2,
  },
  categoryPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  eventCardActionsModern: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 2,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  iconCircle: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 6,
  },
  eventCardContentModern: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingBottom: 0,
  },
  eventCardTitleModern: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  eventInfoRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventCardInfoTextModern: {
    fontSize: 15,
    color: SECONDARY_TEXT,
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '500',
  },
  eventCardDescriptionModern: {
    fontSize: 15,
    color: SECONDARY_TEXT,
    marginTop: 10,
    marginBottom: 10,
    lineHeight: 22,
    fontWeight: '400',
  },
  learnMoreButtonModern: {
    backgroundColor: ACCENT_GREEN,
    borderRadius: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 8,
    shadowColor: ACCENT_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  learnMoreTextModern: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  filtersContainer: {
    backgroundColor: 'transparent',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  categoryButtonSelected: {
    backgroundColor: '#f0f0f0',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextSelected: {
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#166a5d',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  dateFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dateFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  dateFilterButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  dateFilterText: {
    color: '#666',
    fontSize: 14,
  },
  dateFilterTextSelected: {
    color: '#fff',
  },
  distanceSlider: {
    marginTop: 10,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderButton: {
    padding: 10,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginHorizontal: 10,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  applyButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventDetailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventDetailsHeaderRowFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    width: '100%',
    position: 'relative',
    minHeight: 40,
  },
  eventDetailsCloseButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 3,
  },
  eventDetailsActionsCorner: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 10,
    zIndex: 2,
  },
  eventCardScrollContent: {
    flex: 1,
    width: '100%',
    maxHeight: 220,
    minHeight: 120,
  },
  eventCardScrollContentInner: {
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166a5d',
    marginBottom: 12,
  },
  eventInfo: {
    marginBottom: 16,
  },
  eventInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  swiperFlexContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    marginTop: 0,
    paddingTop: 0,
  },
  swiperCardArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 0,
    paddingTop: 0,
  },
  cardContainer: {
    backgroundColor: CARD_BG,
    borderRadius: 28,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
    alignItems: 'stretch',
    minHeight: 420,
    maxHeight: 420,
    justifyContent: 'flex-start',
  },
  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  categoryPillModern: {
    backgroundColor: ACCENT_GREEN,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  categoryPillTextModern: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cardActionsModern: {
    flexDirection: 'row',
    gap: 10,
    zIndex: 2,
    marginLeft: 8,
  },
  iconCircleModern: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 8,
    padding: 4,
  },
  cardContentModern: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
  },
  cardTitleModern: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  cardInfoRowModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  cardInfoTextModern: {
    fontSize: 15,
    color: SECONDARY_TEXT,
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
  },
  cardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 10,
  },
  cardDescriptionScrollModern: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#F8FAF7',
    overflow: 'hidden',
    paddingHorizontal: 4,
    flex: 1,
    minHeight: 60,
    maxHeight: 100,
  },
  cardDescriptionScrollInnerModern: {
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  cardDescriptionModern: {
    fontSize: 15,
    color: SECONDARY_TEXT,
    lineHeight: 22,
    fontWeight: '400',
  },
  cardLearnMoreButtonModern: {
    backgroundColor: ACCENT_GREEN,
    borderRadius: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 8,
    shadowColor: ACCENT_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLearnMoreTextModern: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  swipeButtonsContainerFixed: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    padding: 20,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  swipeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  swipeButtonLeft: {
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
  swipeButtonRight: {
    borderWidth: 2,
    borderColor: '#22543D',
  },
  categoryFilterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  categoryFilterButtonSelected: {
    backgroundColor: '#f0f0f0',
  },
  categoryFilterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilterTextSelected: {
    fontWeight: '700',
  },
  eventTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  eventTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  eventTypeButtonSelected: {
    backgroundColor: '#4A90E2',
  },
  eventTypeText: {
    color: '#666',
    fontSize: 14,
  },
  eventTypeTextSelected: {
    color: '#fff',
  },
  eventCardDescriptionScroll: {
    width: '100%',
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    paddingHorizontal: 4,
  },
  eventCardDescriptionScrollInner: {
    paddingBottom: 8,
    paddingHorizontal: 2,
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  useMyLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
    alignSelf: 'flex-start',
    backgroundColor: '#e6f9ec',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
});

// Utility to get full saved event objects
export const getSavedEvents = (savedIds: Set<string>) => {
  return EVENTS.filter(event => savedIds.has(event.id));
};

// Utility to load saved event IDs from AsyncStorage
const loadSavedEventIds = async (): Promise<Set<string>> => {
  try {
    const ids = await AsyncStorage.getItem(SAVED_EVENTS_KEY);
    if (ids) {
      return new Set(JSON.parse(ids));
    }
  } catch (e) {
    console.warn('Failed to load saved events', e);
  }
  return new Set();
};

// Utility to save event IDs to AsyncStorage
const persistSavedEventIds = async (ids: Set<string>) => {
  try {
    await AsyncStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.warn('Failed to save events', e);
  }
};

export const FindEventsScreen = () => {
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const swiperRef = useRef<Swiper<Event>>(null);
  const [swiperCards, setSwiperCards] = useState<Event[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { savedEvents, isLoading, saveEvent, unsaveEvent } = useSavedEvents();
  const [locationInput, setLocationInput] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [geocodedLocation, setGeocodedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION);

  // Get user's location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    })();
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Filter events based on all criteria
  const filteredEvents = useMemo(() => {
    let filtered = EVENTS;

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => selectedCategories.includes(event.category));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.address.toLowerCase().includes(query)
      );
    }

    // Date filter
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    filtered = filtered.filter(event => {
      const eventDate = new Date(event.date);
      switch (dateFilter) {
        case 'today':
          return eventDate.toDateString() === today.toDateString();
        case 'week':
          return eventDate >= today && eventDate <= weekFromNow;
        case 'month':
          return eventDate >= today && eventDate <= monthFromNow;
        default:
          return true;
      }
    });

    // Sort by date ascending
    filtered = filtered.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Distance filter
    if (userLocation && maxDistance < 50) {
      filtered = filtered.filter(event => {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          event.location.coordinates.latitude,
          event.location.coordinates.longitude
        );
        return distance <= maxDistance;
      });
    }

    return filtered;
  }, [selectedCategories, searchQuery, dateFilter, userLocation, maxDistance]);

  // Memoize filteredEvents for Swiper stability
  const stableFilteredEvents = useMemo(() => filteredEvents, [filteredEvents]);

  useEffect(() => {
    setSwiperCards(filteredEvents);
  }, [filteredEvents]);

  // Load saved events and filter events on mount and when filters change
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const loadedEvents = await eventService.getEvents(selectedCategories);
        setEvents(loadedEvents);
      } catch (e) {
        console.warn('Failed to load events', e);
      }
    };

    loadEvents();
  }, [selectedCategories]);

  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case '🌿 Environment':
        return '#22543D';
      case '🏘️ Community':
        return '#2196F3';
      case '🤝 Care & Relief':
        return '#FF9800';
      case '📚 Youth & Education':
        return '#9C27B0';
      case '❤️ Health & Animals':
        return '#E91E63';
      case '🕊️ Faith-Based':
        return '#607D8B';
      default:
        return '#666666';
    }
  };

  const getCategoryEmoji = (category: EventCategory) => {
    switch (category) {
      case '🌿 Environment':
        return '🌿';
      case '🏘️ Community':
        return '🏘️';
      case '🤝 Care & Relief':
        return '🤝';
      case '📚 Youth & Education':
        return '📚';
      case '❤️ Health & Animals':
        return '❤️';
      case '🕊️ Faith-Based':
        return '🕊️';
      default:
        return '📍';
    }
  };

  const handleSaveEvent = async (eventId: string) => {
    try {
      if (savedEvents.some(e => e.id === eventId)) {
        await unsaveEvent(eventId);
      } else {
        await saveEvent(eventId);
      }
    } catch (e) {
      console.warn('Failed to update saved status', e);
    }
  };

  const handleShareEvent = async (event: Event) => {
    try {
      const message = `Check out this event: ${event.title}\n\n${event.description}\n\nDate: ${event.date}\nTime: ${event.time}\nLocation: ${event.location.address}${event.url ? `\n\nMore info: ${event.url}` : ''}`;
      
      await Share.share({
        message,
        title: event.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share event');
    }
  };

  const handleOpenLink = async (link: string) => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      } else {
        Alert.alert('Error', 'Cannot open this link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleSwipeLeft = (index: number) => {
    // No alert or notification
  };

  const handleSwipeRight = async (index: number) => {
    const event = events[index];
    try {
      await saveEvent(event.id);
    } catch (e) {
      console.warn('Failed to save event', e);
    }
  };

  // Swipe card: only description is scrollable, fixed height for card and content
  const CARD_HEIGHT = 420;
  const CARD_CONTENT_HEIGHT = 300;
  const DESCRIPTION_HEIGHT = 100;

  const renderEventCard = (event: Event | null | undefined, sleek = false) => {
    if (!event || typeof event !== 'object') {
      return (
        <View style={[sleek ? sleekStyles.cardContainer : styles.cardContainer, { height: CARD_HEIGHT, justifyContent: 'center', alignItems: 'center' }]} pointerEvents="box-none"> 
          <Text style={{ fontSize: 20, color: ACCENT_GREEN, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>No more events</Text>
          <Text style={{ fontSize: 15, color: SECONDARY_TEXT, textAlign: 'center', paddingHorizontal: 24 }}>
            Check back soon or adjust your filters to find more events!
          </Text>
        </View>
      );
    }
    return (
      <View style={[sleek ? sleekStyles.cardContainer : styles.cardContainer, { height: CARD_HEIGHT }]} pointerEvents="box-none"> 
        <View style={styles.cardHeaderRow}>
          <View style={sleek ? sleekStyles.categoryPill : styles.categoryPillModern}>
            <Text style={sleek ? sleekStyles.categoryPillText : styles.categoryPillTextModern}>{getCategoryEmoji(event.category)} {event.category.replace(/^[^ ]+ /, '')}</Text>
          </View>
          <View style={sleek ? sleekStyles.cardActions : styles.cardActionsModern}>
            <TouchableOpacity style={sleek ? sleekStyles.iconCircle : styles.iconCircleModern} onPress={() => handleShareEvent(event)}>
              <Ionicons name="share-outline" size={20} color={ACCENT_GREEN} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.cardContentModern, { height: CARD_CONTENT_HEIGHT, flex: 1 }]}> 
          <Text style={[sleek ? sleekStyles.cardTitle : styles.cardTitleModern, { color: '#22543D' }]} numberOfLines={2} ellipsizeMode="tail">{event.title}</Text>
          <View style={styles.cardInfoRowModern}>
            <Ionicons name="calendar-outline" size={16} color={ACCENT_GREEN} />
            <Text style={[styles.cardInfoTextModern, { color: '#22543D' }]}>{event.date}</Text>
            <Ionicons name="time-outline" size={16} color={ACCENT_GREEN} style={{ marginLeft: 16 }} />
            <Text style={[styles.cardInfoTextModern, { color: '#22543D' }]}>{event.time}</Text>
          </View>
          <View style={styles.cardInfoRowModern}>
            <Ionicons name="location-outline" size={16} color={ACCENT_GREEN} />
            <Text style={[styles.cardInfoTextModern, { color: '#22543D' }]} numberOfLines={1} ellipsizeMode="tail">{event.location.address}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={[styles.cardDescriptionScrollModern, { height: DESCRIPTION_HEIGHT, flex: 1 }]}> 
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardDescriptionScrollInnerModern}>
              <Text style={[styles.cardDescriptionModern, { color: '#22543D' }]}>{event.description}</Text>
            </ScrollView>
          </View>
        </View>
        <TouchableOpacity style={sleek ? sleekStyles.learnMoreButton : styles.cardLearnMoreButtonModern} onPress={() => handleOpenLink(event.url || 'https://example.com')}>
          <Text style={sleek ? sleekStyles.learnMoreText : styles.cardLearnMoreTextModern}>Learn More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Geocode location input using OpenStreetMap Nominatim
  const geocodeLocation = async (address: string) => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.length > 0) {
        setGeocodedLocation({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
      } else {
        setGeocodedLocation(null);
        setLocationError('Location not found.');
      }
    } catch (e) {
      setGeocodedLocation(null);
      setLocationError('Error finding location.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Reverse geocode user's current location to address and set input
  const useMyLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setGeocodedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      // Reverse geocode to get address
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.coords.latitude}&lon=${location.coords.longitude}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.display_name) {
        setLocationInput(data.display_name);
      } else {
        setLocationInput('');
      }
    } catch (e) {
      setLocationError('Could not get your location.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Update map region when geocoded location changes
  useEffect(() => {
    if (geocodedLocation) {
      // Calculate the appropriate zoom level based on the distance
      // 1 degree of latitude is approximately 69 miles
      // We want to show the entire circle plus some padding
      const latitudeDelta = (maxDistance / 69) * 2.5; // Multiply by 2.5 to add padding
      const longitudeDelta = latitudeDelta * 1.5; // Adjust for longitude based on latitude

      setMapRegion({
        latitude: geocodedLocation.latitude,
        longitude: geocodedLocation.longitude,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [geocodedLocation, maxDistance]); // Add maxDistance as a dependency

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.container, { backgroundColor: APP_BG }]}>
        <SleekGradientBg>
          <>
            {/* Search Bar and Filter - Always visible */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <View style={[sleekStyles.searchBarContainer, { flex: 0.8 }]}>
                <Ionicons name="search" size={20} style={sleekStyles.searchIcon} />
                <TextInput
                  style={sleekStyles.searchInput}
                  placeholder="Search events..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#22543D"
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} style={sleekStyles.clearIcon} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={sleekStyles.filterIconButton}
                onPress={() => setShowFilters(true)}
                accessibilityLabel="Show filters"
              >
                <Ionicons name="options" size={22} color="#00C896" />
              </TouchableOpacity>
            </View>

            {/* View Mode Toggle - Always visible */}
            <View style={sleekStyles.viewModeToggleContainer}>
              <TouchableOpacity
                style={[sleekStyles.viewModeButton, viewMode === 'list' && sleekStyles.viewModeButtonActive]}
                onPress={() => setViewMode('list')}
                accessibilityLabel="List view"
              >
                <Ionicons
                  name="list"
                  size={20}
                  color={viewMode === 'list' ? '#fff' : '#00C896'}
                  style={sleekStyles.viewModeIcon}
                />
                <Text style={[sleekStyles.viewModeText, viewMode === 'list' && sleekStyles.viewModeTextActive]}>Cards</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[sleekStyles.viewModeButton, viewMode === 'map' && sleekStyles.viewModeButtonActive]}
                onPress={() => setViewMode('map')}
                accessibilityLabel="Map view"
              >
                <Ionicons
                  name="map"
                  size={20}
                  color={viewMode === 'map' ? '#fff' : '#00C896'}
                  style={sleekStyles.viewModeIcon}
                />
                <Text style={[sleekStyles.viewModeText, viewMode === 'map' && sleekStyles.viewModeTextActive]}>Map</Text>
              </TouchableOpacity>
            </View>

            {/* Content based on view mode */}
            {viewMode === 'list' && (
              <View style={[styles.swiperFlexContainer, { marginTop: -20 }]}>
                <View style={styles.swiperCardArea}>
                  <Swiper
                    ref={swiperRef}
                    cards={Array.isArray(filteredEvents) ? filteredEvents : []}
                    renderCard={event => renderEventCard(event, true)}
                    containerStyle={{ marginTop: 0, paddingTop: 0 }}
                    stackSize={3}
                    stackSeparation={18}
                    onSwipedLeft={handleSwipeLeft}
                    onSwipedRight={handleSwipeRight}
                    backgroundColor={'transparent'}
                    animateOverlayLabelsOpacity
                    animateCardOpacity
                    verticalSwipe={false}
                    swipeAnimationDuration={150}
                    disableTopSwipe={true}
                    disableBottomSwipe={true}
                    overlayLabels={{
                      left: {
                        title: 'SKIP',
                        style: {
                          label: {
                            backgroundColor: '#FF3B30',
                            color: '#fff',
                            fontSize: 24,
                          },
                          wrapper: {
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            justifyContent: 'flex-start',
                            marginTop: 30,
                            marginLeft: -30,
                          },
                        },
                      },
                      right: {
                        title: 'SAVE',
                        style: {
                          label: {
                            backgroundColor: '#22543D',
                            color: '#fff',
                            fontSize: 24,
                          },
                          wrapper: {
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                            marginTop: 30,
                            marginLeft: 30,
                          },
                        },
                      },
                    }}
                  />
                  <View style={{ height: 60 }} />
                </View>
                <View style={styles.swipeButtonsContainerFixed} pointerEvents="box-none">
                  <TouchableOpacity
                    style={[sleekStyles.swipeButton, sleekStyles.swipeButtonLeft]}
                    onPress={() => swiperRef.current?.swipeLeft()}
                  >
                    <Ionicons name="close" size={32} color="#FF3B30" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[sleekStyles.swipeButton, sleekStyles.swipeButtonRight]}
                    onPress={() => swiperRef.current?.swipeRight()}
                  >
                    <Ionicons name="heart" size={32} color="#00C896" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {viewMode === 'map' && (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  region={mapRegion}
                  onRegionChangeComplete={setMapRegion}
                  minZoomLevel={3} // Ensure we can't zoom out too far
                  maxZoomLevel={20} // Allow zooming in close
                >
                  {filteredEvents.map(event => (
                    <Marker
                      key={event.id}
                      coordinate={event.location.coordinates}
                      onPress={() => setSelectedEvent(event)}
                      tracksViewChanges={false} // Optimize marker rendering
                    >
                      <View style={[
                        styles.markerContainer,
                        { backgroundColor: getCategoryColor(event.category) }
                      ]}>
                        <Text style={styles.markerText}>{getCategoryEmoji(event.category)}</Text>
                      </View>
                    </Marker>
                  ))}
                  {geocodedLocation && (
                    <>
                      <Marker
                        coordinate={geocodedLocation}
                        pinColor="#4A90E2"
                        tracksViewChanges={false}
                      />
                      <Circle
                        center={geocodedLocation}
                        radius={maxDistance * 1609.34} // Convert miles to meters
                        strokeColor="rgba(74, 144, 226, 0.5)"
                        fillColor="rgba(74, 144, 226, 0.1)"
                        strokeWidth={2}
                      />
                    </>
                  )}
                </MapView>
              </View>
            )}
          </>
        </SleekGradientBg>

        {/* Filters Modal */}
        <Modal
          visible={showFilters}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filters</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Location Filter (top) */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: '#22543D' }]}>Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter city or address"
                    value={locationInput}
                    onChangeText={setLocationInput}
                    autoCapitalize="words"
                    editable={!locationLoading}
                  />
                  <TouchableOpacity
                    style={styles.useMyLocationButton}
                    onPress={useMyLocation}
                    disabled={locationLoading}
                  >
                    <Ionicons name="locate" size={18} color="#4A90E2" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#4A90E2', fontWeight: '600' }}>Use My Location</Text>
                  </TouchableOpacity>
                  {locationLoading && <Text style={{ color: '#888', marginTop: 4 }}>Finding location...</Text>}
                  {locationError ? <Text style={{ color: 'red', marginTop: 4 }}>{locationError}</Text> : null}
                </View>

                {/* Distance Filter (now directly under location) */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: '#22543D' }]}>Distance</Text>
                  <View style={styles.distanceSlider}>
                    <Text style={styles.distanceText}>{maxDistance} miles</Text>
                    <View style={styles.sliderContainer}>
                      <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={() => setMaxDistance(prev => Math.max(5, prev - 5))}
                      >
                        <Ionicons name="remove" size={20} color="#4A90E2" />
                      </TouchableOpacity>
                      <View style={styles.sliderTrack}>
                        <View 
                          style={[
                            styles.sliderFill,
                            { width: `${(maxDistance / 50) * 100}%` }
                          ]} 
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.sliderButton}
                        onPress={() => setMaxDistance(prev => Math.min(50, prev + 5))}
                      >
                        <Ionicons name="add" size={20} color="#4A90E2" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Category Filter */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: '#22543D' }]}>Categories</Text>
                  <View style={styles.categoryFilterGrid}>
                    {Object.values(EVENT_CATEGORIES).map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.categoryFilterButton,
                          selectedCategories.includes(category as EventCategory) && styles.categoryFilterButtonSelected,
                          { borderColor: getCategoryColor(category as EventCategory) }
                        ]}
                        onPress={() => toggleCategory(category as EventCategory)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.categoryFilterText,
                          selectedCategories.includes(category as EventCategory) && styles.categoryFilterTextSelected,
                          { color: getCategoryColor(category as EventCategory) }
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Date Filter */}
                <View style={styles.filterSection}>
                  <Text style={[styles.filterLabel, { color: '#22543D' }]}>Date</Text>
                  <View style={styles.dateFilterButtons}>
                    {(['all', 'today', 'week', 'month'] as DateFilter[]).map(filter => (
                      <TouchableOpacity
                        key={filter}
                        style={[
                          styles.dateFilterButton,
                          dateFilter === filter && styles.dateFilterButtonSelected
                        ]}
                        onPress={() => setDateFilter(filter)}
                      >
                        <Text style={[
                          styles.dateFilterText,
                          dateFilter === filter && styles.dateFilterTextSelected
                        ]}>
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={[styles.applyButtonText, { color: '#22543D' }]}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Selected Event Details */}
        {selectedEvent && (
          <View style={styles.eventDetailsContainer}>
            <View style={styles.eventDetailsHeaderRowFixed}>
              <TouchableOpacity 
                style={styles.eventDetailsCloseButton}
                onPress={() => setSelectedEvent(null)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <View style={styles.eventDetailsActionsCorner}>
                <TouchableOpacity style={styles.iconCircle} onPress={() => handleSaveEvent(selectedEvent.id)}>
                  <Ionicons name={savedEvents.some(e => e.id === selectedEvent.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={ACCENT_GREEN} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconCircle} onPress={() => handleShareEvent(selectedEvent)}>
                  <Ionicons name="share-outline" size={20} color={ACCENT_GREEN} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.eventTitle}>{selectedEvent.title}</Text>
            <View style={styles.eventInfo}>
              <View style={styles.eventInfoRow}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.eventInfoText}>{selectedEvent.date}</Text>
              </View>
              <View style={styles.eventInfoRow}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.eventInfoText}>{selectedEvent.time}</Text>
              </View>
              <View style={styles.eventInfoRow}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.eventInfoText}>{selectedEvent.location.address}</Text>
              </View>
            </View>
            <Text style={styles.eventDescription}>{selectedEvent.description}</Text>
            <TouchableOpacity style={styles.learnMoreButtonModern} onPress={() => handleOpenLink(selectedEvent.url || 'https://example.com')}>
              <Text style={styles.learnMoreTextModern}>Learn More</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}; 