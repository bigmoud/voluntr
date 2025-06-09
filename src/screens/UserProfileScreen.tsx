import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useProfile, Profile } from '../context/ProfileContext';
import { usePosts, Post } from '../context/PostsContext';
import { checkAndUpdateBadges, supabase } from '../lib/supabase';
import { BADGES } from '../constants/badges';
import { TOP_CATEGORIES, Category } from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../context/StatsContext';

type UserProfileScreenProps = {
  route: RouteProp<RootStackParamList, 'UserProfile'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;
};

type UIUser = Profile & {
  stats: {
    totalHours: number;
    totalEvents: number;
    categoryBreakdown: Record<string, number>;
    topCategories: string[];
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
  location: string;
};

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';
const DEFAULT_STATS = {
  totalHours: 0,
  totalEvents: 0,
  categoryBreakdown: {},
  topCategories: []
};
const DEFAULT_BADGES: UIUser['badges'] = [];

export const UserProfileScreen = ({ route, navigation }: UserProfileScreenProps) => {
  const { user } = route.params;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const { getUserPosts } = usePosts();
  const { user: currentUser } = useAuth();
  const { stats: currentUserStats } = useStats();

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // First get the profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Then check and update badges
        await checkAndUpdateBadges(user.id);

        // Finally reload the profile to get updated badges
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (updateError) throw updateError;
        setProfile(updatedProfile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user?.id]);

  useEffect(() => {
    const loadUserPosts = async () => {
      if (!user?.id) return;
      setLoadingPosts(true);
      try {
        const posts = await getUserPosts(user.id);
        setUserPosts(posts);
      } catch (error) {
        console.error('Error loading user posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadUserPosts();
  }, [user?.id]);

  // For badge display
  const allBadges = BADGES;
  const earnedBadges = allBadges.filter(b => profile?.earned_badges?.includes(b.id));
  const lockedBadges = allBadges.filter(b => !profile?.earned_badges?.includes(b.id));

  // Calculate stats from profile data
  const totalHours = profile?.total_hours || 0;
  const totalEvents = profile?.total_events || 0;
  const categoryHours = profile?.category_breakdown || {};
  const topCategories = Object.entries(categoryHours)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([category]) => category);

  // If this is the current user's profile, use the stats from the context
  const isCurrentUser = user.id === currentUser?.id;

  const filledUser: UIUser = {
    ...profile as UIUser,
    profile_picture: profile?.profile_picture || DEFAULT_AVATAR,
    stats: isCurrentUser ? {
      totalHours: currentUserStats.totalHours,
      totalEvents: currentUserStats.totalEvents,
      categoryBreakdown: currentUserStats.categoryHours,
      topCategories: currentUserStats.topCategories
    } : {
      totalHours,
      totalEvents,
      categoryBreakdown: categoryHours,
      topCategories
    },
    badges: earnedBadges,
    location: profile?.location ?? '',
  };

  // Add guard for undefined user
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Profile Header */}
        <View style={styles.profileHeaderBubbly}>
          <LinearGradient
            colors={["#e6f9ec", "#b2f2d7", "#4A90E2"]}
            style={styles.profileHeaderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarBubble}>
              <Image
                source={{ uri: filledUser.profile_picture }}
                style={styles.profilePictureBubbly}
              />
            </View>
            <Text style={styles.nameBubbly}>{filledUser.full_name}</Text>
            <Text style={styles.usernameBubbly}>@{filledUser.username}</Text>
            <Text style={styles.bioBubbly}>{filledUser.bio}</Text>
            <View style={styles.locationContainerBubbly}>
              <Ionicons name="location-outline" size={16} color="#166a5d" />
              <Text style={styles.locationBubbly}>{filledUser.location}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Stats</Text>
          </View>
          <View style={styles.statsBubblesRow}>
            <View style={styles.statBubble}>
              <Ionicons name="time-outline" size={22} color="#166a5d" />
              <Text style={styles.statValueBubbly}>{filledUser.stats.totalHours}</Text>
              <Text style={styles.statLabelBubbly}>Hours</Text>
            </View>
            <View style={styles.statBubble}>
              <Ionicons name="calendar-outline" size={22} color="#166a5d" />
              <Text style={styles.statValueBubbly}>{filledUser.stats.totalEvents}</Text>
              <Text style={styles.statLabelBubbly}>Events</Text>
            </View>
            <View style={styles.statBubble}>
              <Ionicons name="leaf-outline" size={22} color="#166a5d" />
              <Text style={styles.statValueBubbly}>{filledUser.stats.topCategories.length}</Text>
              <Text style={styles.statLabelBubbly}>Categories</Text>
            </View>
          </View>
        </View>

        {/* Top Categories Section */}
        {filledUser.stats.topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoriesGrid}>
              {filledUser.stats.topCategories.map((category, index) => (
                <View key={category} style={styles.categoryBubble}>
                  <Text style={styles.categoryIcon}>
                    {TOP_CATEGORIES.find((c: Category) => c.id === category)?.emoji || '🌟'}
                  </Text>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryHours}>
                    {filledUser.stats.categoryBreakdown[category] || 0} hours
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned Badges</Text>
          <View style={styles.badgesBubblyRow}>
            {earnedBadges.length === 0 ? (
              <Text style={{ color: '#666', textAlign: 'center' }}>No badges earned yet.</Text>
            ) : (
              earnedBadges.map((badge) => (
                <TouchableOpacity
                  key={badge.id}
                  style={styles.badgeBubble}
                >
                  <Text style={styles.badgeIconBubbly}>{badge.icon}</Text>
                  <Text style={styles.badgeNameBubbly}>{badge.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Posts</Text>
          {loadingPosts ? (
            <ActivityIndicator size="large" color="#166a5d" />
          ) : userPosts.length === 0 ? (
            <Text style={styles.emptyText}>No posts yet</Text>
          ) : (
            <FlatList
              data={showAllPosts ? userPosts : userPosts.slice(0, 3)}
              renderItem={({ item }) => (
                <View style={styles.postCard}>
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postCategory}>{item.category}</Text>
                  <Text style={styles.postContent}>{item.content}</Text>
                </View>
              )}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          )}
          {userPosts.length > 3 && !showAllPosts && (
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => setShowAllPosts(true)}
            >
              <Text style={styles.seeAllButtonText}>See All Posts</Text>
            </TouchableOpacity>
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
  profileHeaderBubbly: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingBottom: 24,
    paddingTop: 0,
  },
  profileHeaderGradient: {
    width: '100%',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  avatarBubble: {
    backgroundColor: '#fff',
    borderRadius: 80,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  profilePictureBubbly: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#b2f2d7',
  },
  nameBubbly: {
    fontSize: 26,
    fontWeight: '800',
    color: '#166a5d',
    marginBottom: 4,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  usernameBubbly: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'System',
  },
  bioBubbly: {
    fontSize: 16,
    color: '#388e6c',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'System',
    lineHeight: 22,
  },
  locationContainerBubbly: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationBubbly: {
    fontSize: 14,
    color: '#388e6c',
    marginLeft: 4,
    fontWeight: '600',
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsBubblesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBubble: {
    backgroundColor: '#e6f9ec',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 80,
  },
  statValueBubbly: {
    fontSize: 22,
    fontWeight: '800',
    color: '#22543D',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabelBubbly: {
    fontSize: 14,
    color: '#388E6C',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryBubble: {
    backgroundColor: '#e6f9ec',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryHours: {
    fontSize: 14,
    color: '#388E6C',
    fontWeight: '500',
  },
  badgesBubblyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
  badgeBubble: {
    backgroundColor: '#b2f2d7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    margin: 4,
    minWidth: 70,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIconBubbly: {
    fontSize: 22,
    marginBottom: 2,
  },
  badgeNameBubbly: {
    fontSize: 13,
    color: '#22543D',
    fontWeight: '700',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 8,
  },
  postCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#22543D',
  },
  seeAllButton: {
    backgroundColor: '#166a5d',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  seeAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#22543D',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 