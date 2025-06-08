import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { EVENTS } from '../data/events';
import { groupEventsByCategory } from '../types/event';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { Event } from '../types/event';
import { useStats } from '../context/StatsContext';
import { useProfile } from '../context/ProfileContext';

type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

// Inspirational quotes
const QUOTES = [
  {
    text: "The best way to find yourself is to lose yourself in the service of others.",
    author: "Mahatma Gandhi",
  },
  {
    text: "We make a living by what we get, but we make a life by what we give.",
    author: "Winston Churchill",
  },
  {
    text: "The smallest act of kindness is worth more than the grandest intention.",
    author: "Oscar Wilde",
  },
];

// Get random quote
const getRandomQuote = () => {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const quote = getRandomQuote();
  const { savedEvents, isLoading, unsaveEvent } = useSavedEvents();
  const EVENTS_TO_SHOW = 5;
  const hasMoreEvents = savedEvents.length > EVENTS_TO_SHOW;
  const { stats } = useStats();
  const { profile } = useProfile();

  // Sort saved events by date
  const sortedEvents = [...savedEvents].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Get upcoming saved events
  const upcomingEvents = sortedEvents.slice(0, EVENTS_TO_SHOW);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome back, {profile ? profile.full_name : ''}!
          </Text>
          <Text style={styles.subtitle}>Ready to make a difference today?</Text>
        </View>

        {/* Impact Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={24} color="#4A90E2" />
              <Text style={styles.statValue}>{stats.totalHours}</Text>
              <Text style={styles.statLabel}>Hours Served</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={24} color="#4A90E2" />
              <Text style={styles.statValue}>{stats.totalEvents}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
        </View>

        {/* Inspirational Quote */}
        <View style={styles.quoteContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#4A90E2" />
          <Text style={styles.quoteText}>{quote.text}</Text>
          <Text style={styles.quoteAuthor}>— {quote.author}</Text>
        </View>

        {/* Upcoming Events */}
        <View style={styles.eventsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            {hasMoreEvents && (
              <TouchableOpacity onPress={() => navigation.navigate('My Events')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            )}
          </View>
          {upcomingEvents.length === 0 ? (
            <Text style={{ color: '#666', fontSize: 16, textAlign: 'center', marginTop: 16 }}>
              You haven't saved any events yet. Browse and save events to see them here!
            </Text>
          ) : (
            upcomingEvents.map(event => (
              <View key={event.id} style={styles.eventCardMyEvents}>
                <View style={styles.eventHeaderMyEvents}>
                  <Text style={styles.eventCategoryMyEvents}>{event.category}</Text>
                  <Text style={styles.eventTimeMyEvents}>{event.time}</Text>
                </View>
                <Text style={styles.eventTitleMyEvents}>{event.title}</Text>
                <Text style={styles.eventDateMyEvents}>{event.date}</Text>
                <View style={styles.eventLocationMyEvents}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationTextMyEvents}>{event.location.address}</Text>
                </View>
                <View style={styles.eventActionsMyEvents}>
                  <TouchableOpacity 
                    style={styles.actionButtonMyEvents}
                    onPress={() => handleUnsaveEvent(event.id)}
                  >
                    <Ionicons name="bookmark" size={20} color="#4A90E2" />
                    <Text style={styles.actionTextMyEvents}>Remove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionButtonMyEvents}
                    onPress={() => handleShareEvent(event)}
                  >
                    <Ionicons name="share-outline" size={20} color="#4A90E2" />
                    <Text style={styles.actionTextMyEvents}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.learnMoreButtonMyEvents}
                    onPress={() => event.url && Linking.openURL(event.url)}
                  >
                    <Text style={styles.learnMoreTextMyEvents}>Learn More</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f9ec',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22543D',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#22543D',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  quoteContainer: {
    margin: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteText: {
    fontSize: 18,
    color: '#22543D',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 26,
  },
  quoteAuthor: {
    fontSize: 16,
    color: '#666',
  },
  eventsContainer: {
    margin: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  eventCardMyEvents: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeaderMyEvents: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventCategoryMyEvents: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  eventTimeMyEvents: {
    fontSize: 14,
    color: '#666',
  },
  eventTitleMyEvents: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22543D',
    marginBottom: 8,
  },
  eventDateMyEvents: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  eventLocationMyEvents: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTextMyEvents: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  eventActionsMyEvents: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtonMyEvents: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionTextMyEvents: {
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 4,
  },
  learnMoreButtonMyEvents: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 8,
  },
  learnMoreTextMyEvents: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
}); 