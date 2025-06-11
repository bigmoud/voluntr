import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { Calendar, CalendarProps, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { eventService } from '../services/eventService';
import { Event } from '../types/event';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DayComponentProps = {
  date?: DateData;
  state?: string;
  marking?: any;
  onPress?: (date?: DateData) => void;
  events: Event[];
};

// Utility to robustly normalize event date to 'YYYY-MM-DD' from 'Month Day, Year'
function normalizeDate(dateStr: string): string {
  // Try to parse 'Month Day, Year' (e.g., 'June 23, 2024')
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const match = dateStr.match(/^(\w+) (\d{1,2}), (\d{4})$/i);
  if (match) {
    const monthIdx = months.indexOf(match[1].toLowerCase());
    if (monthIdx !== -1) {
      const year = match[3];
      const month = (monthIdx + 1).toString().padStart(2, '0');
      const day = match[2].padStart(2, '0');
      const normalized = `${year}-${month}-${day}`;
      return normalized;
    }
  }
  // Fallback to Date constructor for other formats
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return '';
  }
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const normalized = `${year}-${month}-${day}`;
  return normalized;
}

// Custom day component to show event titles
const DayComponent: React.FC<DayComponentProps> = ({ date, state, marking = {}, onPress, events }) => {
  const dayString = date?.dateString;
  const dayEvents = events.filter(event => normalizeDate(event.date) === dayString);
  const isSelected = marking.selected;
  const hasEvents = marking.marked;
  const eventsCount = marking.eventsCount || dayEvents.length;

  return (
    <TouchableWithoutFeedback onPress={() => onPress?.(date)}>
      <View
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDayContainer,
          hasEvents && styles.hasEventDayContainer,
        ]}
      >
        <Text
          style={[
            styles.dayText,
            state === 'disabled' && styles.disabledText,
            state === 'today' && styles.todayText,
            isSelected && styles.selectedDayText,
            hasEvents && styles.hasEventDayText,
          ]}
        >
          {date?.day}
        </Text>
        {hasEvents && (
          <View style={styles.eventBadge}>
            <Text style={styles.eventBadgeText}>{eventsCount}</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export const MyEventsScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDateFormatted, setSelectedDateFormatted] = useState('');
  const [showCalendar, setShowCalendar] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipEvents, setTooltipEvents] = useState<Event[]>([]);
  const { savedEvents, isLoading, unsaveEvent, saveEvent } = useSavedEvents();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // Convert saved events to calendar marked dates
  const getMarkedDates = (events: Event[], selectedDate: string) => {
    const marked: { [key: string]: any } = {};
    events.forEach(event => {
      const normDate = normalizeDate(event.date);
      if (!normDate) return;
      if (!marked[normDate]) {
        marked[normDate] = {
          dots: [{ color: '#166a5d', key: 'event-dot' }],
          marked: true,
        };
      }
    });
    if (selectedDate) {
      if (!marked[selectedDate]) {
        marked[selectedDate] = {};
      }
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = '#4A90E2';
      marked[selectedDate].selectedTextColor = '#fff';
    }
    return marked;
  };

  const handleDayPress = (day: DateData) => {
    const [year, month, dayNum] = day.dateString.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const formattedDate = `${months[parseInt(month, 10) - 1]} ${dayNum}, ${year}`;
    setSelectedDate(day.dateString);
    setSelectedDateFormatted(formattedDate);
  };

  const handleUnsaveEvent = async (eventId: string) => {
    try {
      await unsaveEvent(eventId);
    } catch (e) {
      Alert.alert('Error', 'Failed to remove event');
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

  const filteredEvents = selectedDate
    ? savedEvents.filter(event => normalizeDate(event.date) === selectedDate)
    : savedEvents;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Ionicons
            name={showCalendar ? 'calendar' : 'list'}
            size={24}
            color="#4A90E2"
          />
        </TouchableOpacity>
      </View>

      {/* Calendar and selected date section only if showCalendar is true */}
      {showCalendar && (
        <>
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={getMarkedDates(savedEvents, selectedDate)}
              theme={{
                todayTextColor: '#388E6C',
                selectedDayBackgroundColor: '#388E6C',
                selectedDayTextColor: '#fff',
                dotColor: '#22543D',
                arrowColor: '#388E6C',
                monthTextColor: '#22543D',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                dotStyle: {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginTop: 2,
                  backgroundColor: '#166a5d'
                }
              }}
              markingType="multi-dot"
            />
          </View>
          {selectedDate && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginBottom: 8 }}>
                {(() => {
                  // Parse selectedDate as YYYY-MM-DD without timezone shift
                  const [year, month, day] = selectedDate.split('-').map(Number);
                  const localDate = new Date(year, month - 1, day);
                  return `Events on ${localDate.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                  })}`;
                })()}
              </Text>
              {filteredEvents.length === 0 ? (
                <Text style={{ color: '#666', fontSize: 15 }}>No events for this day.</Text>
              ) : (
                filteredEvents.map(event => (
                  <View key={event.id} style={[styles.eventCard, { marginBottom: 12 }]}> 
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventCategory}>{event.category}</Text>
                      <Text style={styles.eventTime}>{event.time}</Text>
                    </View>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                    <View style={styles.eventLocation}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.locationText}>{event.location.address}</Text>
                    </View>
                    <View style={styles.eventActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          if (savedEvents.some(e => e.id === event.id)) {
                            unsaveEvent(event.id);
                          } else {
                            saveEvent(event.id);
                          }
                        }}
                      >
                        <Ionicons name={savedEvents.some(e => e.id === event.id) ? 'bookmark' : 'bookmark-outline'} size={20} color="#4A90E2" />
                        <Text style={styles.actionText}>{savedEvents.some(e => e.id === event.id) ? 'Saved' : 'Save'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleShareEvent(event)}
                      >
                        <Ionicons name="share-outline" size={20} color="#4A90E2" />
                        <Text style={styles.actionText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.learnMoreButton}
                        onPress={() => event.url && Linking.openURL(event.url)}
                      >
                        <Text style={styles.learnMoreText}>Learn More</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </>
      )}

      {/* Event List (always shown) */}
      <ScrollView style={styles.eventsList}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading events...</Text>
        ) : savedEvents.length === 0 ? (
          <Text style={styles.noEventsText}>You haven't saved any events yet. Browse and save events to see them here!</Text>
        ) : (
          savedEvents.map(event => (
            <TouchableOpacity key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventCategory}>{event.category}</Text>
                <Text style={styles.eventTime}>{event.time}</Text>
              </View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{event.date}</Text>
              <View style={styles.eventLocation}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.locationText}>{event.location.address}</Text>
              </View>
              <View style={styles.eventActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    if (savedEvents.some(e => e.id === event.id)) {
                      unsaveEvent(event.id);
                    } else {
                      saveEvent(event.id);
                    }
                  }}
                >
                  <Ionicons name={savedEvents.some(e => e.id === event.id) ? 'bookmark' : 'bookmark-outline'} size={20} color="#4A90E2" />
                  <Text style={styles.actionText}>{savedEvents.some(e => e.id === event.id) ? 'Saved' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShareEvent(event)}
                >
                  <Ionicons name="share-outline" size={20} color="#4A90E2" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.learnMoreButton}
                  onPress={() => event.url && Linking.openURL(event.url)}
                >
                  <Text style={styles.learnMoreText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f9ec',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166a5d',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: '#166a5d',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    padding: 8,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  dayContainer: {
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    margin: 2,
    backgroundColor: '#fff',
  },
  selectedDayContainer: {
    borderWidth: 2,
    borderColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    backgroundColor: '#e6f9ec',
  },
  hasEventDayContainer: {
    backgroundColor: '#4A90E2',
  },
  dayText: {
    fontSize: 16,
    color: '#22543D',
    fontWeight: '500',
  },
  disabledText: {
    color: '#d9e1e8',
  },
  todayText: {
    color: '#388E6C',
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: '#22543D',
    fontWeight: 'bold',
  },
  hasEventDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  eventDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#166a5d',
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  eventsList: {
    flex: 1,
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCategory: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166a5d',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#e6f9ec',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 16,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22543D',
  },
  tooltipContent: {
    maxHeight: 300,
  },
  tooltipEvent: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  tooltipEventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tooltipEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 4,
  },
  tooltipEventCategory: {
    fontSize: 14,
    color: '#4A90E2',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  noEventsText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  learnMoreButton: {
    marginLeft: 'auto',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  learnMoreText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  eventBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  eventBadgeText: {
    color: '#4A90E2',
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#166a5d',
    marginTop: 2
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
}); 