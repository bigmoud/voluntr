import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Linking } from 'react-native';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { Event } from '../types/event';
import { Ionicons } from '@expo/vector-icons';

const REAL_EVENTS = [
  {
    id: '1',
    title: 'Beach Cleanup at Dockweiler',
    date: 'May 06, 2025',
    time: '9:00 AM – 12:00 PM',
    category: '🌿 Environment',
    description: 'A great opportunity to serve in the environment space and make a meaningful impact.',
    location: {
      address: '123 Main St, Los Angeles, CA 90001',
      coordinates: { latitude: 34.0123, longitude: -118.2734 }
    },
    url: 'https://www.example.com/event'
  },
  {
    id: '2',
    title: 'Tree Planting in Griffith Park',
    date: 'May 07, 2025',
    time: '10:00 AM – 1:00 PM',
    category: '🌿 Environment',
    description: 'A great opportunity to serve in the environment space and make a meaningful impact.',
    location: {
      address: '456 Main St, Los Angeles, CA 90002',
      coordinates: { latitude: 34.0456, longitude: -118.2811 }
    },
    url: 'https://www.example.com/event'
  },
  // ... (all other events, up to id: '60')
  {
    id: '60',
    title: 'Holy Trinity Orthodox Church Care Day',
    date: 'July 4, 2025',
    time: '10:00 AM – 2:00 PM',
    category: '🕊️ Faith-Based',
    description: 'Clean and prepare for a large weekend community meal.',
    location: {
      address: '2300 W 3rd St, Los Angeles, CA 90057',
      coordinates: { latitude: 34.0612, longitude: -118.2761 }
    },
    url: 'https://www.example.com/event'
  }
];

const CATEGORIES = [
  '🌿 Environment',
  '🏘️ Community',
  '🤝 Care & Relief',
  '📚 Youth & Education',
  '❤️ Health & Animals',
  '🕊️ Faith-Based',
];

export const EventsScreen = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interested, setInterested] = useState<string[]>([]);
  const { savedEvents, saveEvent, unsaveEvent } = useSavedEvents();

  // Filter saved events by selected categories
  const filteredEvents = useMemo(() => {
    let events = savedEvents;
    if (selectedCategories.length > 0) {
      events = events.filter((e: Event) => selectedCategories.includes(e.category));
    }
    return events;
  }, [selectedCategories, savedEvents]);

  // Reset index if filter changes
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [filteredEvents.length]);

  const event = filteredEvents[currentIndex] as Event | undefined;

  const isSaved = event ? savedEvents.some(e => e.id === event.id) : false;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1 < filteredEvents.length ? prev + 1 : 0));
  };

  const handleInterested = () => {
    if (event) setInterested((prev) => [...prev, event.id]);
    handleNext();
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSaveToggle = async () => {
    if (!event) return;
    if (isSaved) {
      await unsaveEvent(event.id);
    } else {
      await saveEvent(event.id);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategories.includes(cat) && styles.chipSelected]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={selectedCategories.includes(cat) ? styles.chipTextSelected : styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {/* Event Card */}
      {filteredEvents.length === 0 ? (
        <Text style={styles.noEvents}>You haven't saved any events yet. Browse and save events to see them here!</Text>
      ) : event ? (
        <>
          <View style={styles.card}>
            <Text style={styles.category}>{event.category}</Text>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.date}>{event.date} • {event.time}</Text>
            <Text style={styles.location}>{event.location.address}</Text>
            <Text style={styles.description}>{event.description}</Text>
            <TouchableOpacity onPress={() => event && event.url && Linking.openURL(event.url)}>
              <Text style={styles.learnMoreLink}>Learn More</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveToggle}>
              <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={22} color="#4A90E2" />
              <Text style={styles.saveButtonText}>{isSaved ? 'Remove' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.interestedButton]} onPress={handleInterested}>
              <Text style={[styles.buttonText, styles.interestedButtonText]}>I'm Interested</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.noEvents}>No events found for selected filters.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f9ec', // light green
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  filterSection: {
    flexDirection: 'row',
    marginBottom: 18,
    marginTop: 8,
    width: '100%',
    maxWidth: 380,
  },
  chip: {
    backgroundColor: '#b2e5c2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#4A90E2',
  },
  chipText: {
    color: '#22543D',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  category: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#22543D',
    marginBottom: 6,
  },
  date: {
    fontSize: 15,
    color: '#1a7c6b',
    marginBottom: 4,
  },
  location: {
    fontSize: 15,
    color: '#22543D',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#1a3c34',
    lineHeight: 22,
    marginBottom: 16,
  },
  learnMoreLink: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 380,
  },
  button: {
    flex: 1,
    backgroundColor: '#b2e5c2',
    borderRadius: 10,
    paddingVertical: 14,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#22543D',
    fontWeight: '700',
    fontSize: 16,
  },
  interestedButton: {
    backgroundColor: '#4A90E2',
  },
  interestedButtonText: {
    color: '#fff',
  },
  noEvents: {
    fontSize: 20,
    color: '#22543D',
    textAlign: 'center',
    marginTop: 40,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    alignSelf: 'flex-end',
    backgroundColor: '#e6f9ec',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonText: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 6,
  },
}); 