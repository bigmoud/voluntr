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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { useProfile } from '../context/ProfileContext';

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';
const DEFAULT_STATS = {
  totalHours: 42,
  totalEvents: 7,
  topCategories: ['Environment', 'Community'],
};
const DEFAULT_BADGES = [
  { id: '1', name: 'First Timer', icon: '🎯', description: 'Completed your first volunteer event' },
  { id: '2', name: 'Weekend Warrior', icon: '🏆', description: '3 events in one month' },
  { id: '3', name: 'Animal Advocate', icon: '🐾', description: '5 animal care events' },
  { id: '4', name: 'Nature Nurturer', icon: '🌿', description: '5 environmental events' },
  { id: '5', name: 'Community Hero', icon: '🌟', description: '10 community events' },
  { id: '6', name: 'Youth Mentor', icon: '👥', description: '5 youth events' },
  { id: '7', name: 'Relief Responder', icon: '🆘', description: '5 relief events' },
  { id: '8', name: 'Faithful Volunteer', icon: '🙏', description: '5 faith-based events' },
  { id: '9', name: '25 Hours Club', icon: '⏰', description: '25 hours of service' },
  { id: '10', name: 'Consistency King', icon: '👑', description: '3 months of regular volunteering' },
];

export const UserProfileScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'UserProfile'>>();
  const navigation = useNavigation();
  const { followUser, unfollowUser, profile, getFollowing } = useProfile();
  const user = route.params?.user;
  const [followed, setFollowed] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);

  useEffect(() => {
    const checkFollowing = async () => {
      if (profile && user && profile.id !== user.id) {
        setCheckingFollow(true);
        try {
          const following = await getFollowing(profile.id);
          setFollowed(following.some(u => u.id === user.id));
        } catch (e) {
          setFollowed(false);
        } finally {
          setCheckingFollow(false);
        }
      }
    };
    checkFollowing();
  }, [profile, user]);

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

  const filledUser = {
    ...user,
    profile_picture: user.profile_picture || DEFAULT_AVATAR,
    stats: user.stats || DEFAULT_STATS,
    badges: user.badges || DEFAULT_BADGES,
  };
  // Demo: mock posts (in real app, get from global state or backend)
  const [communityPosts] = useState<any[]>([
    {
      id: '1',
      user: {
        name: 'Sarah Johnson',
        avatar: 'https://i.pravatar.cc/150?img=1',
        role: 'Volunteer',
        email: 'sarah.johnson@example.com',
      },
      title: 'Beach Cleanup',
      content: 'Just completed my first beach cleanup! The ocean is looking cleaner already 🌊',
      category: '🌿 Environment',
      hours: '2',
      likes: 24,
      comments: 5,
      timeAgo: '2h ago',
    },
    {
      id: '2',
      user: {
        name: 'Michael Chen',
        avatar: 'https://i.pravatar.cc/150?img=2',
        role: 'Community Leader',
        email: 'michael.chen@example.com',
      },
      title: 'Food Drive',
      content: 'Looking for volunteers for our upcoming food drive. DM if interested! 🥫',
      category: '🏘️ Community',
      hours: '3',
      likes: 18,
      comments: 8,
      timeAgo: '4h ago',
    },
  ]);
  const userPosts = communityPosts.filter(post => post.user.email === filledUser.email);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

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
            <Text style={styles.bioBubbly}>{filledUser.bio}</Text>
            <View style={styles.locationContainerBubbly}>
              <Ionicons name="location-outline" size={16} color="#166a5d" />
              <Text style={styles.locationBubbly}>{filledUser.location}</Text>
            </View>
            {profile && user.id !== profile.id && (
              <TouchableOpacity
                style={[styles.followButton, followed && styles.followingButton]}
                disabled={checkingFollow}
                onPress={async () => {
                  try {
                    if (followed) {
                      await unfollowUser(user.id);
                    } else {
                      await followUser(user.id);
                    }
                    // Re-check follow state after action
                    const following = await getFollowing(profile.id);
                    setFollowed(following.some(u => u.id === user.id));
                  } catch (error) {
                    console.error('Error toggling follow status:', error);
                    Alert.alert('Error', 'Failed to update follow status');
                  }
                }}
              >
                <Text style={[styles.followButtonText, followed && styles.followingButtonText]}>
                  {checkingFollow ? '...' : followed ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
        {/* Stats Section */}
        <View style={styles.statsBubblesRow}>
          <View style={styles.statBubble}>
            <Ionicons name="time-outline" size={22} color="#166a5d" />
            <Text style={styles.statValueBubbly}>{filledUser.stats?.totalHours ?? 0}</Text>
            <Text style={styles.statLabelBubbly}>Hours</Text>
          </View>
          <View style={styles.statBubble}>
            <Ionicons name="calendar-outline" size={22} color="#166a5d" />
            <Text style={styles.statValueBubbly}>{filledUser.stats?.totalEvents ?? 0}</Text>
            <Text style={styles.statLabelBubbly}>Events</Text>
          </View>
          <View style={styles.statBubble}>
            <Ionicons name="leaf-outline" size={22} color="#166a5d" />
            <Text style={styles.statValueBubbly}>{(filledUser.stats?.topCategories || []).length}</Text>
            <Text style={styles.statLabelBubbly}>Categories</Text>
          </View>
        </View>
        {/* Badges Section */}
        <View style={styles.badgesBubblyRow}>
          {(filledUser.badges || []).map((badge: any) => (
            <TouchableOpacity
              key={badge.id}
              style={styles.badgeBubble}
              onPress={() => setSelectedBadge(badge)}
            >
              <Text style={styles.badgeIconBubbly}>{badge.icon}</Text>
              <Text style={styles.badgeNameBubbly}>{badge.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Badge Description Modal */}
        <Modal
          visible={!!selectedBadge}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBadge(null)}
        >
          <TouchableWithoutFeedback onPress={() => setSelectedBadge(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Badge Details</Text>
                    <TouchableOpacity onPress={() => setSelectedBadge(null)}>
                      <Ionicons name="close" size={24} color="#166a5d" />
                    </TouchableOpacity>
                  </View>
                  {selectedBadge && (
                    <>
                      <View style={styles.badgeModalIcon}>
                        <Text style={styles.badgeModalIconText}>{selectedBadge.icon}</Text>
                      </View>
                      <Text style={styles.badgeModalName}>{selectedBadge.name}</Text>
                      <Text style={styles.badgeModalDescription}>{selectedBadge.description}</Text>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* User's Posts */}
        <View style={styles.userPostsContainer}>
          <Text style={styles.userPostsTitle}>Posts</Text>
          {userPosts.length === 0 ? (
            <Text style={styles.noPostsText}>No posts yet.</Text>
          ) : (
            userPosts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postCategory}>{post.category}</Text>
                <Text style={styles.postContent}>{post.content}</Text>
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
  statsBubblesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: -24,
    marginBottom: 16,
    paddingHorizontal: 12,
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
  userPostsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
  },
  userPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 16,
  },
  noPostsText: {
    fontSize: 16,
    color: '#666',
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
  },
  postContent: {
    fontSize: 16,
    color: '#22543D',
  },
  followButton: {
    marginTop: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 22,
    paddingHorizontal: 32,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  followingButton: {
    backgroundColor: '#b2f2d7',
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },
  followingButtonText: {
    color: '#166a5d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22543D',
  },
  badgeModalIcon: {
    backgroundColor: '#e6f9ec',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeModalIconText: {
    fontSize: 40,
  },
  badgeModalName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22543D',
    marginBottom: 12,
    textAlign: 'center',
  },
  badgeModalDescription: {
    fontSize: 16,
    color: '#388E6C',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22543D',
  },
}); 