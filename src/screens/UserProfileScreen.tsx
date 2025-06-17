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
  RefreshControl,
  TextInput,
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
import { ProfileHeader } from '../components/ProfileHeader';

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
  console.log('UserProfileScreen mounted');
  const { user } = route.params;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const { getUserPosts } = usePosts();
  const { user: currentUser } = useAuth();
  const { stats: currentUserStats } = useStats();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedByUser, setIsFollowedByUser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const { likePost, unlikePost, addComment } = usePosts();

  const loadUserProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Fetch profile, followers, following, and posts in parallel
      const [profileRes, followersRes, followingRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', user.id),
        supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', user.id),
        supabase.from('posts').select('*').eq('user_id', user.id)
      ]);

      if (profileRes.error) throw profileRes.error;
      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;
      if (postsRes.error) throw postsRes.error;

      // Calculate fresh stats from posts
      const totalHours = postsRes.data?.reduce((sum, post) => sum + (post.hours || 0), 0) || 0;
      const totalEvents = postsRes.data?.length || 0;
      const categoryHours = postsRes.data?.reduce((acc, post) => {
        const category = post.category;
        acc[category] = (acc[category] || 0) + (post.hours || 0);
        return acc;
      }, {} as Record<string, number>) || {};

      // Get top categories based on hours
      const topCategories = Object.entries(categoryHours)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([category]) => category)
        .slice(0, 3);

      let profileData = {
        ...profileRes.data,
        followers_count: followersRes.count,
        following_count: followingRes.count,
        total_hours: totalHours,
        total_events: totalEvents,
        category_breakdown: categoryHours,
        stats: {
          totalHours,
          totalEvents,
          categoryBreakdown: categoryHours,
          topCategories
        }
      };

      // Optionally update badges, but only re-fetch if you know it changed
      await checkAndUpdateBadges(user.id);

      // Fetch just the earned_badges field after badge update
      const { data: badgeProfile, error: badgeError } = await supabase
        .from('profiles')
        .select('earned_badges')
        .eq('id', user.id)
        .single();
      if (badgeError) throw badgeError;

      setProfile({
        ...profileData,
        earned_badges: badgeProfile.earned_badges,
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine if this is the current user's profile
  const isCurrentUser = user.id === currentUser?.id;
  const postsUserId = isCurrentUser ? currentUser?.id : user.id;

  const loadUserPosts = async () => {
    if (!postsUserId) return;
    setLoadingPosts(true);
    try {
      console.log('Fetching posts for userId:', postsUserId);
      const posts = await getUserPosts(postsUserId);
      console.log('Fetched posts:', posts);
      setUserPosts(posts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser?.id || !user?.id || user.id === currentUser.id) {
      setIsFollowing(false);
      setIsFollowedByUser(false);
      return;
    }

    // Check if current user is following the profile user
    const { data: followingData, error: followingError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', currentUser.id)
      .eq('following_id', user.id)
      .single();

    // Check if profile user is following the current user
    const { data: followedByData, error: followedByError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', currentUser.id)
      .single();

    if (followingError && followingError.code !== 'PGRST116') {
      console.error('Error checking following status:', followingError);
    }
    if (followedByError && followedByError.code !== 'PGRST116') {
      console.error('Error checking followed by status:', followedByError);
    }

    setIsFollowing(!!followingData);
    setIsFollowedByUser(!!followedByData);
  };

  useEffect(() => {
    loadUserProfile();
  }, [user?.id]);

  useEffect(() => {
    loadUserPosts();
  }, [user?.id]);

  useEffect(() => {
    checkFollowStatus();
  }, [currentUser?.id, user?.id]);

  const handleFollowPress = async () => {
    if (!currentUser?.id || !user?.id) return;
    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', user.id);
        setIsFollowing(false);
        // Reload profile data to update counts
        await loadUserProfile();
      } else {
        await supabase
          .from('followers')
          .insert([{ follower_id: currentUser.id, following_id: user.id }]);
        setIsFollowing(true);
        // Reload profile data to update counts
        await loadUserProfile();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

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
    .map(([category]) => category)
    .slice(0, 3);

  // If this is the current user's profile, use the stats from the context
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

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadUserProfile(),
        loadUserPosts(),
        checkFollowStatus(),
      ]);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    const post = userPosts.find(p => p.id === postId);
    if (!post) return;
    if (post.likes.includes(currentUser.id)) {
      await unlikePost(postId);
      // Optionally refresh posts
      await loadUserPosts();
    } else {
      await likePost(postId);
      await loadUserPosts();
    }
  };

  const handleComment = async (postId: string) => {
    if (!currentUser || !profile || !commentText.trim()) return;
    try {
      await addComment(postId, {
        postId,
        userId: currentUser.id,
        userName: profile.full_name,
        userProfilePicture: profile.profile_picture || '',
        content: commentText.trim(),
      });
      setCommentText('');
      await loadUserPosts();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#166a5d']}
            tintColor="#166a5d"
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader
          profile={{
            id: filledUser.id,
            username: filledUser.username,
            full_name: filledUser.full_name,
            profile_picture: filledUser.profile_picture,
            bio: filledUser.bio,
            location: filledUser.location,
          }}
          isOwnProfile={isCurrentUser}
          isFollowing={isFollowing}
          isFollowedByUser={isFollowedByUser}
          onFollowPress={handleFollowPress}
          followersCount={filledUser.followers_count}
          followingCount={filledUser.following_count}
          onFollowersPress={() => navigation.navigate('Followers', { userId: filledUser.id, type: 'followers' })}
          onFollowingPress={() => navigation.navigate('Followers', { userId: filledUser.id, type: 'following' })}
        />

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
                  <View style={styles.postHeader}>
                    <Image
                      source={{ uri: item.userProfilePicture || DEFAULT_AVATAR }}
                      style={styles.postProfilePicture}
                    />
                    <View style={styles.postUserInfo}>
                      <Text style={styles.postUserName}>{item.userName}</Text>
                      <Text style={styles.postTimestamp}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</Text>
                    </View>
                  </View>
                  {item.image && (
                    <Image source={{ uri: item.image }} style={styles.postImage} />
                  )}
                  <Text style={styles.postTitle}>{item.title}</Text>
                  <Text style={styles.postCategory}>{item.category} • {item.hours} hours</Text>
                  <Text style={styles.postContent}>{item.content}</Text>
                  <View style={styles.postActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleLike(item.id)}
                    >
                      <Ionicons 
                        name={(item.likes || []).includes(currentUser?.id || '') ? "heart" : "heart-outline"} 
                        size={24} 
                        color={(item.likes || []).includes(currentUser?.id || '') ? "#FF6B6B" : "#666"} 
                      />
                      <Text style={styles.actionText}>{(item.likes || []).length}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => setSelectedPostId(selectedPostId === item.id ? null : item.id)}
                    >
                      <Ionicons name="chatbubble-outline" size={24} color="#666" />
                      <Text style={styles.actionText}>{(item.comments || []).length}</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedPostId === item.id && (
                    <View style={styles.commentsSection}>
                      <View style={styles.commentsList}>
                        {(item.comments || []).map(comment => (
                          <View key={comment.id} style={styles.commentItem}>
                            <Image
                              source={{ uri: comment.userProfilePicture || DEFAULT_AVATAR }}
                              style={styles.commentProfilePicture}
                            />
                            <View style={styles.commentContent}>
                              <Text style={styles.commentUserName}>{comment.userName}</Text>
                              <Text style={styles.commentText}>{comment.content}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                      <View style={styles.commentInputContainer}>
                        <TextInput
                          style={styles.commentInput}
                          value={commentText}
                          onChangeText={setCommentText}
                          placeholder="Write a comment..."
                          multiline
                          maxLength={500}
                          returnKeyType="send"
                          blurOnSubmit={false}
                          onSubmitEditing={() => {
                            if (commentText.trim()) {
                              handleComment(item.id);
                            }
                          }}
                        />
                        <TouchableOpacity 
                          style={[styles.commentButton, !commentText.trim() && styles.commentButtonDisabled]}
                          onPress={() => handleComment(item.id)}
                          disabled={!commentText.trim()}
                        >
                          <Ionicons 
                            name="send" 
                            size={24} 
                            color={commentText.trim() ? "#388E6C" : "#ccc"} 
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  postProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postUserInfo: {
    flexDirection: 'column',
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
  },
  postTimestamp: {
    fontSize: 14,
    color: '#666',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
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
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  commentsSection: {
    marginTop: 16,
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  commentContent: {
    flexDirection: 'column',
  },
  commentUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
  },
  commentText: {
    fontSize: 16,
    color: '#22543D',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6f9ec',
  },
  commentInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  commentButton: {
    padding: 8,
    marginLeft: 4,
  },
  commentButtonDisabled: {
    opacity: 0.5,
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