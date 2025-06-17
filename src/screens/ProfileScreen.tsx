import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Switch,
  Modal,
  TextInput,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { MainTabParamList } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { useStats } from '../context/StatsContext';
import { useProfile } from '../context/ProfileContext';
import * as Notifications from 'expo-notifications';
import { useSavedEvents } from '../hooks/useSavedEvents';
import { BADGES, Badge } from '../constants/badges';
import { usePosts, Post } from '../context/PostsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { createProfile, getProfile, updateProfile as updateProfileApi, uploadProfilePicture, deleteAccount, exportUserData, checkAndUpdateBadges } from '../lib/supabase';
import { TOP_CATEGORIES, Category } from '../constants/categories';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '../lib/supabase';
import * as Print from 'expo-print';
import { useNotifications, Notification } from '../context/NotificationsContext';
import { followUser, unfollowUser } from '../lib/supabase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { ProfileHeader } from '../components/ProfileHeader';

// Types
type SettingItem = {
  id: string;
  title: string;
  icon: string;
  type?: 'switch';
  destructive?: boolean;
};

type SettingSection = {
  title: string;
  items: SettingItem[];
};

type Settings = {
  [key: string]: boolean;
};

// Add local Profile and Notification types for type safety

type Profile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  bio?: string;
  profile_picture?: string;
  preferred_categories?: string[];
  stats?: {
    totalHours: number;
    totalEvents: number;
    topCategories: string[];
    categoryHours: { [key: string]: number };
    categoryBreakdown: any[];
  };
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
  }>;
  earnedBadges?: string[];
  activities?: any[];
};

// Mock data for user profile
const USER_PROFILE = {
  name: 'Sarah Johnson',
  bio: 'Passionate about community service and environmental conservation. Love helping others and making a difference!',
  location: 'Los Angeles, CA',
  profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
  email: 'sarah.johnson@example.com',
  stats: {
    totalHours: 127,
    totalEvents: 23,
    topCategories: ['Environment', 'Animal Care', 'Community'],
    categoryHours: {
      Environment: 50,
      'Animal Care': 30,
      Community: 47,
    },
    categoryBreakdown: [
      { category: 'Environment', hours: 50, percentage: 40 },
      { category: 'Animal Care', hours: 30, percentage: 30 },
      { category: 'Community', hours: 47, percentage: 30 },
    ],
  },
  badges: [
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
  ] as Badge[],
  activities: [
    { date: '2023-01-15', title: 'Environmental Cleanup', category: 'Environment', hours: 3, description: 'Helped clean up a local park' },
    { date: '2023-01-20', title: 'Animal Care', category: 'Animal Care', hours: 2, description: 'Volunteered at the local animal shelter' },
    { date: '2023-01-25', title: 'Community Service', category: 'Community', hours: 4, description: 'Participated in a community cleanup event' },
    { date: '2023-02-01', title: 'Youth Mentoring', category: 'Youth & Education', hours: 2, description: 'Helped mentor local youth' },
    { date: '2023-02-05', title: 'Relief Event', category: 'Care & Relief', hours: 3, description: 'Volunteered at a local relief event' },
    { date: '2023-02-10', title: 'Faith-Based Event', category: 'Faith-Based', hours: 2, description: 'Participated in a faith-based community service event' },
  ],
};

// Add at the top, after USER_PROFILE:
const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';
const DEFAULT_STATS = {
  totalHours: 42,
  totalEvents: 7,
  topCategories: ['Environment', 'Community'],
};
const DEFAULT_BADGES = USER_PROFILE.badges;

// Settings sections
const SETTINGS_SECTIONS: SettingSection[] = [
  {
    title: 'Profile Settings',
    items: [
      { id: 'edit-profile', title: 'Edit Profile Info', icon: 'person-outline' },
      { id: 'change-email', title: 'Change Email', icon: 'mail-outline' },
      { id: 'change-password', title: 'Change Password', icon: 'lock-closed-outline' },
    ],
  },
  {
    title: 'Notifications',
    items: [
      { id: 'event-reminders-popup', title: 'Push Notifications', icon: 'notifications-outline', type: 'switch' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { id: 'data-export', title: 'Export Data', icon: 'download-outline' },
      { id: 'delete-account', title: 'Delete Account', icon: 'trash-outline', destructive: true },
      { id: 'logout', title: 'Log Out', icon: 'log-out-outline', destructive: true },
    ],
  },
  {
    title: 'Help & Support',
    items: [
      { id: 'contact', title: 'Contact Support', icon: 'mail-outline' },
      { id: 'report-bug', title: 'Report a Bug', icon: 'bug-outline' },
    ],
  },
];

const CATEGORIES = [
  'Environment',
  'Community',
  'Care & Relief',
  'Youth & Education',
  'Health & Animals',
  'Faith-Based',
];

const NOTIFICATIONS_KEY = 'userNotifications';
const NOTIFICATION_SETTINGS_KEY = 'notificationSettings';

// Update the Post type to include timestamp
type ExtendedPost = Post & {
  timestamp?: string;
};

// Add a basic EditPostModal component (at the bottom or in a separate file if you prefer)
type EditPostModalProps = {
  post: Post;
  onClose: () => void;
  onSave: (post: Post) => void;
  onDelete: (postId: string) => void;
};
const EditPostModal = ({ post, onClose, onSave, onDelete }: EditPostModalProps) => {
  const HOURS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState(post.category);
  const [hours, setHours] = useState<number | null>(post.hours || null);
  const [image, setImage] = useState<string | null>(post.image || null);
  const [showStatsInfo, setShowStatsInfo] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim() || !category || !hours) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    onSave({ ...post, title: title.trim(), content: content.trim(), category, hours, image: image || undefined });
  };

  return (
    <Modal visible={!!post} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxHeight: '90%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#166a5d" />
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Edit Post</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={{ color: '#166a5d', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginBottom: 8 }}>Title</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e6f9ec', borderRadius: 8, padding: 12, fontSize: 16, color: '#333', backgroundColor: '#f9f9f9' }}
                value={title}
                onChangeText={setTitle}
                placeholder="Give your post a title"
                maxLength={100}
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginBottom: 8 }}>Content</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: '#e6f9ec', borderRadius: 8, padding: 12, fontSize: 16, color: '#333', backgroundColor: '#f9f9f9', height: 120, textAlignVertical: 'top' }}
                value={content}
                onChangeText={setContent}
                placeholder="Share your volunteering experience..."
                multiline
                numberOfLines={6}
              />
            </View>
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginRight: 8 }}>Category</Text>
                <TouchableOpacity onPress={() => setShowStatsInfo(true)}>
                  <Ionicons name="information-circle-outline" size={20} color="#166a5d" />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
                {TOP_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={{
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#e6f9ec',
                      borderRadius: 8,
                      marginRight: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: category === cat.id ? cat.color : '#fff',
                    }}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={{ fontSize: 20, marginRight: 8 }}>{cat.emoji}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: category === cat.id ? '#fff' : '#166a5d' }}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginBottom: 8 }}>Hours</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {HOURS_OPTIONS.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={{
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#e6f9ec',
                      borderRadius: 8,
                      minWidth: 60,
                      alignItems: 'center',
                      backgroundColor: hours === hour ? '#388E6C' : '#fff',
                    }}
                    onPress={() => setHours(hour)}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: hours === hour ? '#fff' : '#166a5d' }}>{hour}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginBottom: 8 }}>Add Photo (Optional)</Text>
              <TouchableOpacity style={{ width: '100%', height: 200, borderRadius: 8, overflow: 'hidden' }} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e6f9ec', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="camera" size={24} color="#166a5d" />
                    <Text style={{ marginTop: 8, color: '#166a5d', fontSize: 16 }}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => onDelete(post.id)} style={{ backgroundColor: '#e74c3c', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Delete Post</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const ProfileScreen = () => {
  console.log('ProfileScreen mounted');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Profile'>>();
  const { user: currentUser, signOut } = useAuth();
  const { profile, setProfile } = useProfile();
  const { stats } = useStats();
  const { notifications, markAllAsRead } = useNotifications();
  const { editPost, deletePost, getUserPosts } = usePosts();
  const user = route.params?.user;
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStatsInfo, setShowStatsInfo] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const isOwnProfile = !user || (profile && profile.id === user.id);

  // Always provide stats for displayProfile
  const displayProfile = isOwnProfile
    ? {
        ...profile,
        stats: {
          totalHours: stats.totalHours,
          totalEvents: stats.totalEvents,
          topCategories: stats.topCategories,
          categoryHours: stats.categoryHours,
          categoryBreakdown: stats.categoryBreakdown,
        },
        earned_badges: profile?.earned_badges || [],
        bio: profile?.bio || '',
        location: profile?.location || '',
      }
    : {
        ...user,
        stats: {
          totalHours: user?.stats?.totalHours || 0,
          totalEvents: user?.stats?.totalEvents || 0,
          topCategories: user?.stats?.topCategories || [],
          categoryHours: user?.stats?.categoryHours || {},
          categoryBreakdown: user?.stats?.categoryBreakdown || [],
        },
        earned_badges: user?.earned_badges || [],
        bio: user?.bio || '',
        location: user?.location || '',
      };

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPostDetails, setShowPostDetails] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [imageError, setImageError] = useState(false);
  const [editImageError, setEditImageError] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'posts'>('stats');
  const [emailFields, setEmailFields] = useState({ current: '', new: '' });
  const [passwordFields, setPasswordFields] = useState({ current: '', new: '', confirm: '' });
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editFields, setEditFields] = useState({ title: '', content: '', category: '', hours: '' });
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>({
    'event-reminders-popup': false,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load followed users when profile changes
  useEffect(() => {
    const loadFollowedUsers = async () => {
      if (!currentUser?.id) return;
      try {
        const { data: following, error } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', currentUser.id);

        if (error) throw error;
        setFollowedUsers(following.map(f => f.following_id));
      } catch (error) {
        console.error('Error loading followed users:', error);
      }
    };

    loadFollowedUsers();
  }, [currentUser?.id]);

  const { savedEvents } = useSavedEvents();

  // Add local state for edit modal fields
  const [editProfileFields, setEditProfileFields] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    profilePicture: '',
    top_category: '',
  });

  // Add state for email/password modals
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // When opening the modal, initialize local state with current profile
  useEffect(() => {
    if (showEditProfile && profile) {
      setEditProfileFields({
        full_name: profile.full_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: (profile as any).location || '',
        profilePicture: profile.profile_picture || '',
        top_category: (profile as any).top_category || '',
      });
    }
  }, [showEditProfile, profile]);

  // For badge display
  const allBadges = BADGES;
  const earnedBadges = allBadges.filter(b => profile?.earned_badges?.includes(b.id));
  const lockedBadges = allBadges.filter(b => !profile?.earned_badges?.includes(b.id));

  // Count unread notifications
  const unreadCount = notifications.filter((n: any) => n && n.read === false).length;

  // Update the follow button section
  const isFollowing = user ? followedUsers.includes(user.id) : false;

  const handleFollowPress = async () => {
    if (!currentUser?.id || !user?.id) return;
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.id, user.id);
        // Update local state immediately
        setFollowedUsers(prev => prev.filter(id => id !== user.id));
        // Update profile state
        if (profile) {
          setProfile({
            ...profile,
            following_count: profile.following_count - 1
          });
        }
      } else {
        await followUser(currentUser.id, user.id);
        // Update local state immediately
        setFollowedUsers(prev => [...prev, user.id]);
        // Update profile state
        if (profile) {
          setProfile({
            ...profile,
            following_count: profile.following_count + 1
          });
        }
      }
      // Reload profile data to update counts
      await loadProfile();
      // Reload followed users list
      await loadFollowedUsers();
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to follow/unfollow user');
    }
  };

  // Format timestamp helper
  const formatTimestamp = (timestamp: string | number | null | undefined) => {
    if (!timestamp) return '';
    let date;
    if (typeof timestamp === 'number' || (/^\d+$/.test(String(timestamp)))) {
      date = new Date(Number(timestamp));
    } else {
      date = new Date(timestamp);
    }
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle setting toggle
  const handleSettingToggle = async (id: string) => {
    if (id === 'event-reminders-popup') {
      // Request permissions when enabling notifications
      if (!settings[id]) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive event reminders.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
    }

    setSettings(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle setting press
  const handleSettingPress = (id: string) => {
    switch (id) {
      case 'edit-profile':
        setShowEditProfile(true);
        break;
      case 'change-email':
        setShowChangeEmail(true);
        break;
      case 'change-password':
        setShowChangePassword(true);
        break;
      case 'contact':
      case 'report-bug':
        Alert.alert(
          'Contact Us',
          'Please email us at thevoluntrapp@gmail.com',
          [{ text: 'OK' }]
        );
        break;
      case 'data-export':
        Alert.alert(
          'Export Data',
          'Would you like to export your volunteer activity report?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Export',
              onPress: async () => {
                try {
                  const { data: { user: currentUser } } = await supabase.auth.getUser();
                  if (!currentUser) {
                    throw new Error('No user found');
                  }

                  // Get user data
                  const { data: userData, error } = await exportUserData(currentUser.id);
                  if (error) throw error;
                  if (!userData) throw new Error('No data found');

                  // Create HTML content
                  const htmlContent = formatActivityReport(userData);

                  // Generate PDF
                  const { uri } = await Print.printToFileAsync({
                    html: htmlContent,
                    width: 612, // US Letter width in points
                    height: 792, // US Letter height in points
                  });

                  // Share file
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                      mimeType: 'application/pdf',
                      dialogTitle: 'Your Volunteer Activity Report',
                    });
                  } else {
                    Alert.alert('Error', 'Sharing is not available on this device');
                  }
                } catch (error) {
                  console.error('Error exporting data:', error);
                  Alert.alert('Error', 'Failed to export data. Please try again.');
                }
              },
            },
          ]
        );
        break;
      case 'delete-account':
        Alert.alert(
          'Delete Account',
          'Are you sure you want to delete your account? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  if (!currentUser?.id) {
                    throw new Error('No user ID found');
                  }
                  const { error } = await deleteAccount(currentUser.id);
                  if (error) throw error;
                  await handleLogout();
                  Alert.alert('Account Deleted', 'Your account has been successfully deleted.');
                } catch (error) {
                  console.error('Error deleting account:', error);
                  Alert.alert('Error', 'Failed to delete account. Please try again.');
                }
              },
            },
          ]
        );
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      // Clear profile state
      setProfile(null);
      
      // Reset navigation state and navigate to Login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  // Handle save edit
  const handleSaveEdit = async (updatedPost: Post) => {
    try {
      await editPost(updatedPost.id, {
        title: updatedPost.title,
        content: updatedPost.content,
        category: updatedPost.category,
        hours: updatedPost.hours,
        image: updatedPost.image
      });
      // Only sync stats with current user's posts
      // const userPosts = await getUserPosts(profile?.id || '');
      // syncStatsWithPosts(userPosts);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post');
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      // Only sync stats with current user's posts
      // const userPosts = await getUserPosts(profile?.id || '');
      // syncStatsWithPosts(userPosts);
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

  // Render posts
  const renderPosts = () => {
    if (loadingPosts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#166a5d" />
        </View>
      );
    }

    if (!userPosts || userPosts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No posts yet</Text>
        </View>
      );
    }

    const displayedPosts = userPosts;

    return (
      <View>
        <FlatList
          data={displayedPosts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.postsList}
          scrollEnabled={false}
        />
      </View>
    );
  };

  // Format activity report
  const formatActivityReport = (data: any) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Voluntr Activity Report</title>
          <style>
            @page {
              margin: 20px;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #2C3E50;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #2E7D32;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #2E7D32;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              color: #2E7D32;
              font-size: 24px;
              margin-bottom: 15px;
              border-bottom: 1px solid #E8F5E9;
              padding-bottom: 10px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 20px;
            }
            .stat-box {
              background: #F5F5F5;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #E0E0E0;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #2E7D32;
            }
            .stat-label {
              color: #546E7A;
              font-size: 14px;
            }
            .category-list {
              list-style: none;
              padding: 0;
            }
            .category-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #E0E0E0;
            }
            .activity {
              margin-bottom: 20px;
              padding: 15px;
              background: #F5F5F5;
              border-radius: 8px;
              border: 1px solid #E0E0E0;
            }
            .activity-date {
              color: #546E7A;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .activity-title {
              font-size: 18px;
              font-weight: bold;
              color: #2C3E50;
              margin-bottom: 5px;
            }
            .activity-category {
              color: #2E7D32;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .activity-hours {
              color: #1B5E20;
              font-weight: bold;
            }
            .activity-description {
              margin-top: 10px;
              color: #546E7A;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #546E7A;
              font-size: 12px;
              border-top: 1px solid #E0E0E0;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Voluntr Activity Report</h1>
            <p>Generated for ${data.user.name} (@${data.user.username})</p>
            <p>Generated on ${data.exportDate}</p>
          </div>

          <div class="section">
            <h2 class="section-title">📊 Volunteer Statistics</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${data.stats.totalHours}</div>
                <div class="stat-label">Total Hours</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${data.stats.totalEvents}</div>
                <div class="stat-label">Total Events</div>
              </div>
            </div>

            <h3>Category Breakdown</h3>
            <ul class="category-list">
              ${data.stats.categoryBreakdown.map((cat: any) => `
                <li class="category-item">
                  <span>${cat.category}</span>
                  <span>${cat.hours} hours (${cat.percentage}%)</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="section">
            <h2 class="section-title">📝 Activity History</h2>
            ${data.activities.map((activity: any) => `
              <div class="activity">
                <div class="activity-date">${activity.date}</div>
                <div class="activity-title">${activity.title}</div>
                <div class="activity-category">${activity.category}</div>
                <div class="activity-hours">${activity.hours} hours</div>
                <div class="activity-description">${activity.description}</div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>Generated by Voluntr - Making a difference, one hour at a time</p>
          </div>
        </body>
      </html>
    `;

    return html;
  };

  // Render post
  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => {
        setSelectedPost(item);
        setShowPostDetails(true);
      }}
    >
      <View style={styles.postHeader}>
        <View style={styles.postUserInfo}>
          <Image
            source={{ uri: item.userProfilePicture || DEFAULT_AVATAR }}
            style={styles.postAvatar}
          />
          <View>
            <Text style={styles.postUsername}>{item.userName || 'Anonymous'}</Text>
            <Text style={styles.postTimestamp}>{formatTimestamp(item.createdAt)}</Text>
          </View>
        </View>
        {profile && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setEditingPost(item);
            }}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={20} color="#166a5d" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>{item.content}</Text>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <View style={styles.postStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.likes?.length || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.statText}>{item.comments?.length || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAllAsRead(); // Use markAllAsRead instead of markAsRead
    }
    setShowNotifications(false);
    if (notification.type === 'follow') {
      navigation.navigate('UserProfile', { user: {
        id: notification.from_user_id,
        email: '',
        full_name: '',
        username: '',
        bio: '',
        profile_picture: '',
        location: '',
        following: [],
        followers: [],
        following_count: 0,
        followers_count: 0,
        earned_badges: [],
        total_hours: 0,
        total_events: 0,
        category_breakdown: {},
        created_at: '',
        updated_at: '',
      }});
    } else if (notification.type === 'like' || notification.type === 'comment') {
      // Fetch the latest post from Supabase before showing the modal
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', notification.post_id)
        .single();
      if (post) {
        setSelectedPost({
          id: post.id,
          title: post.title,
          content: post.content,
          category: post.category,
          hours: post.hours,
          userEmail: post.user_email,
          userName: post.user_name,
          userProfilePicture: post.user_profile_picture,
          userId: post.user_id,
          image: post.image,
          createdAt: post.created_at,
          likes: post.likes || [],
          comments: post.comments || []
        });
        setShowPostDetails(true);
      } else {
        Alert.alert('Post not found');
      }
    }
  };

  // Render badge modal
  const renderBadgeModal = () => (
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
  );

  // Render edit profile modal
  const renderEditProfileModal = () => (
    <Modal
      visible={showEditProfile}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEditProfile(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editProfileModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Ionicons name="close" size={24} color="#166a5d" />
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.editProfileContent}
              contentContainerStyle={{ paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity style={styles.profilePictureEdit} onPress={pickImage}>
                <Image
                  source={{
                    uri:
                      !editImageError && editProfileFields.profilePicture
                        ? editProfileFields.profilePicture
                        : !editImageError && profile?.profile_picture
                        ? profile.profile_picture
                        : DEFAULT_AVATAR,
                  }}
                  style={styles.profilePictureEdit}
                  onError={() => setEditImageError(true)}
                />
                <View style={styles.editOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editProfileFields.full_name}
                  onChangeText={text => setEditProfileFields(prev => ({ ...prev, full_name: text }))}
                  placeholder="Your full name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={editProfileFields.username}
                  onChangeText={text => setEditProfileFields(prev => ({ ...prev, username: text }))}
                  placeholder="Username"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editProfileFields.bio}
                  onChangeText={text => setEditProfileFields(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={4}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={editProfileFields.location}
                  onChangeText={text => setEditProfileFields(prev => ({ ...prev, location: text }))}
                  placeholder="Your location"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Top Category</Text>
                <View style={styles.categoriesContainer}>
                  {TOP_CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryButton,
                        editProfileFields.top_category === category.id && {
                          backgroundColor: category.color,
                          borderColor: category.color,
                        },
                      ]}
                      onPress={() => setEditProfileFields(prev => ({ ...prev, top_category: category.id }))}
                    >
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                      <Text style={styles.categoryLabel}>{category.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={editLoading}>
                <Text style={styles.saveButtonText}>{editLoading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );

  // Render change email modal
  const renderChangeEmailModal = () => (
    <Modal
      visible={showChangeEmail}
      transparent
      animationType="slide"
      onRequestClose={() => setShowChangeEmail(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowChangeEmail(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Email</Text>
                <TouchableOpacity onPress={() => setShowChangeEmail(false)}>
                  <Ionicons name="close" size={24} color="#166a5d" />
                </TouchableOpacity>
              </View>
              <View style={{ width: '100%' }}>
                <Text style={styles.inputLabel}>Current Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                  value={profile?.email || ''}
                  editable={false}
                />
                <Text style={styles.inputLabel}>New Email</Text>
                <TextInput
                  style={styles.input}
                  value={emailFields.new}
                  onChangeText={text => setEmailFields(f => ({ ...f, new: text }))}
                  placeholder="Enter new email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={emailFields.current}
                  onChangeText={text => setEmailFields(f => ({ ...f, current: text }))}
                  placeholder="Enter current password"
                  secureTextEntry
                />
                {emailError ? <Text style={{ color: '#e74c3c', marginTop: 4 }}>{emailError}</Text> : null}
                <TouchableOpacity
                  style={[styles.saveButton, { marginTop: 16 }]} 
                  onPress={async () => {
                    setEmailError('');
                    if (!emailFields.new || !emailFields.current) {
                      setEmailError('Please fill in all fields');
                      return;
                    }
                    if (!profile) {
                      setEmailError('No profile found');
                      return;
                    }
                    try {
                      // Re-authenticate
                      const { error: signInError } = await useAuth().signIn(profile.email, emailFields.current);
                      if (signInError) {
                        setEmailError('Incorrect password.');
                        return;
                      }
                      // Update email
                      const { error: updateError } = await import('../lib/supabase').then(m => m.supabase.auth.updateUser({ email: emailFields.new }));
                      if (updateError) {
                        setEmailError(updateError.message || 'Failed to update email');
                        return;
                      }
                      setShowChangeEmail(false);
                      setEmailFields({ current: '', new: '' });
                      Alert.alert('Success', 'Email updated! Please check your new email to confirm.');
                    } catch (err: any) {
                      setEmailError(err.message || 'Failed to update email');
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Update Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Render change password modal
  const renderChangePasswordModal = () => (
    <Modal
      visible={showChangePassword}
      transparent
      animationType="slide"
      onRequestClose={() => setShowChangePassword(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowChangePassword(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                  <Ionicons name="close" size={24} color="#166a5d" />
                </TouchableOpacity>
              </View>
              <View style={{ width: '100%' }}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordFields.current}
                  onChangeText={text => setPasswordFields(f => ({ ...f, current: text }))}
                  placeholder="Enter current password"
                  secureTextEntry
                />
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordFields.new}
                  onChangeText={text => setPasswordFields(f => ({ ...f, new: text }))}
                  placeholder="Enter new password"
                  secureTextEntry
                />
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={passwordFields.confirm}
                  onChangeText={text => setPasswordFields(f => ({ ...f, confirm: text }))}
                  placeholder="Confirm new password"
                  secureTextEntry
                />
                {passwordError ? <Text style={{ color: '#e74c3c', marginTop: 4 }}>{passwordError}</Text> : null}
                <TouchableOpacity
                  style={[styles.saveButton, { marginTop: 16 }]} 
                  onPress={async () => {
                    setPasswordError('');
                    if (!passwordFields.current || !passwordFields.new || !passwordFields.confirm) {
                      setPasswordError('Please fill in all fields');
                      return;
                    }
                    if (passwordFields.new !== passwordFields.confirm) {
                      setPasswordError('New passwords do not match');
                      return;
                    }
                    if (passwordFields.new.length < 6) {
                      setPasswordError('Password must be at least 6 characters');
                      return;
                    }
                    if (!profile) {
                      setPasswordError('No profile found');
                      return;
                    }
                    try {
                      // Re-authenticate
                      const { error: signInError } = await useAuth().signIn(profile.email, passwordFields.current);
                      if (signInError) {
                        setPasswordError('Incorrect current password.');
                        return;
                      }
                      // Update password
                      const { error: updateError } = await import('../lib/supabase').then(m => m.supabase.auth.updateUser({ password: passwordFields.new }));
                      if (updateError) {
                        setPasswordError(updateError.message || 'Failed to update password');
                        return;
                      }
                      setShowChangePassword(false);
                      setPasswordFields({ current: '', new: '', confirm: '' });
                      Alert.alert('Success', 'Password updated!');
                    } catch (err: any) {
                      setPasswordError(err.message || 'Failed to update password');
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Pick image helper
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setEditProfileFields(prev => ({ ...prev, profilePicture: result.assets[0].uri }));
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!profile) return;
    setEditLoading(true);
    try {
      let uploadedUrl = editProfileFields.profilePicture;
      // Only upload if a new image is selected and it's a local file (not already a Supabase URL)
      if (editProfileFields.profilePicture && !editProfileFields.profilePicture.startsWith('https://')) {
        try {
          const result = await uploadProfilePicture(editProfileFields.profilePicture);
          uploadedUrl = result || '';
        } catch (uploadError) {
          throw uploadError;
        }
      }
      // Always upsert the profile row
      const { data, error } = await updateProfileApi(profile.id, {
        full_name: editProfileFields.full_name,
        username: editProfileFields.username,
        bio: editProfileFields.bio,
        profile_picture: uploadedUrl,
        // @ts-ignore
        location: editProfileFields.location,
        top_category: editProfileFields.top_category,
      });
      if (error) {
        if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
          Alert.alert('Error', 'That username is already taken. Please choose another.');
          return;
        }
        throw error;
      }
      if (data) {
        // Update the profile in context
        setProfile(data);
        // Update local state
        setEditProfileFields(prev => ({
          ...prev,
          profilePicture: data.profile_picture || '',
        }));
        // Force a re-render by updating the imageError state
        setImageError(false);
        Alert.alert('Success', 'Profile updated successfully');
        setShowEditProfile(false);
      }
    } catch (error) {
      if (error && typeof error === 'object') {
        const err = error as any;
        Alert.alert('Error', err.message || 'Failed to update profile');
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      markAllAsRead();
    }
  }, [showNotifications]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadProfile(),
        loadUserPosts(),
        loadFollowedUsers(),
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadProfile = async () => {
    if (!currentUser?.id) return;
    try {
      // Get followers and following counts
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('followers')
          .select('id', { count: 'exact' })
          .eq('following_id', currentUser.id),
        supabase
          .from('followers')
          .select('id', { count: 'exact' })
          .eq('follower_id', currentUser.id)
      ]);

      if (followersRes.error) throw followersRes.error;
      if (followingRes.error) throw followingRes.error;

      // Get profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;
      if (profile) {
        setProfile({
          ...profile,
          followers_count: followersRes.count || 0,
          following_count: followingRes.count || 0
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserPosts = async () => {
    // Use currentUser?.id for your own profile
    const userIdToFetch = currentUser?.id;
    if (!userIdToFetch) return;
    setLoadingPosts(true);
    try {
      console.log('ProfileScreen: Fetching posts for userId:', userIdToFetch);
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userIdToFetch)
        .order('created_at', { ascending: false });
      if (error) throw error;
      console.log('ProfileScreen: Fetched posts:', posts);
      setUserPosts(posts || []);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadFollowedUsers = async () => {
    if (!currentUser?.id) return;
    try {
      const { data: following, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      if (error) throw error;
      setFollowedUsers(following.map(f => f.following_id));
    } catch (error) {
      console.error('Error loading followed users:', error);
    }
  };

  const handleProfilePictureUpdate = async (uri: string) => {
    try {
      setEditLoading(true);
      const uploadedUrl = await uploadProfilePicture(uri);
      if (!uploadedUrl) {
        throw new Error('Failed to upload profile picture');
      }
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: uploadedUrl })
        .eq('id', currentUser?.id)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setEditLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // if (notifications) {
      //   setNotifications(notifications);
      // }
    } catch (error) {
      Alert.alert('Error', 'Failed to load notifications');
    }
  };

  const uploadProfilePicture = async (uri: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const fileName = `${currentUser?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${currentUser?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      Alert.alert('Error', 'Failed to upload profile picture');
      return null;
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserPosts();
    }, [currentUser?.id])
  );

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
        {/* Unified Profile Header */}
        <ProfileHeader
          profile={{
            id: displayProfile.id,
            username: displayProfile.username,
            full_name: displayProfile.full_name,
            profile_picture: displayProfile.profile_picture,
            bio: displayProfile.bio,
            location: displayProfile.location,
          }}
          isOwnProfile={true}
          followersCount={profile?.followers_count || 0}
          followingCount={profile?.following_count || 0}
          onFollowersPress={() => navigation.navigate('Followers', { userId: displayProfile.id, type: 'followers' })}
          onFollowingPress={() => navigation.navigate('Followers', { userId: displayProfile.id, type: 'following' })}
          onNotificationsPress={() => setShowNotifications(true)}
          showNotificationsIcon={true}
          unreadNotifications={unreadCount}
        />

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <TouchableOpacity onPress={() => setShowStatsInfo(true)}>
              <Ionicons name="information-circle-outline" size={24} color="#166a5d" />
            </TouchableOpacity>
          </View>
          <View style={styles.statsBubblesRow}>
            <View style={styles.statBubble}>
              <Ionicons name="time-outline" size={22} color="#166a5d" />
              <Text style={styles.statValueBubbly}>{stats.totalHours}</Text>
              <Text style={styles.statLabelBubbly}>Hours</Text>
            </View>
            <View style={styles.statBubble}>
              <Ionicons name="calendar-outline" size={22} color="#166a5d" />
              <Text style={styles.statValueBubbly}>{stats.totalEvents}</Text>
              <Text style={styles.statLabelBubbly}>Events</Text>
            </View>
            <View style={styles.statBubble}>
              <Ionicons name="leaf-outline" size={22} color="#166a5d" />
              <Text style={styles.statValueBubbly}>{Object.keys(stats.categoryHours).length}</Text>
              <Text style={styles.statLabelBubbly}>Categories</Text>
            </View>
          </View>
        </View>

        {/* Stats Info Modal */}
        <Modal
          visible={showStatsInfo}
          transparent
          animationType="fade"
          onRequestClose={() => setShowStatsInfo(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowStatsInfo(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>How Stats Work</Text>
                    <TouchableOpacity onPress={() => setShowStatsInfo(false)}>
                      <Ionicons name="close" size={24} color="#166a5d" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.statsInfoContent}>
                    <Text style={styles.statsInfoText}>
                      Your stats are automatically updated when you create posts about your volunteering activities:
                    </Text>
                    <View style={styles.statsInfoItem}>
                      <Ionicons name="time-outline" size={20} color="#166a5d" />
                      <Text style={styles.statsInfoText}>Hours: Total hours volunteered from all your posts</Text>
                    </View>
                    <View style={styles.statsInfoItem}>
                      <Ionicons name="calendar-outline" size={20} color="#166a5d" />
                      <Text style={styles.statsInfoText}>Events: Number of volunteering activities you've posted about</Text>
                    </View>
                    <View style={styles.statsInfoItem}>
                      <Ionicons name="leaf-outline" size={20} color="#166a5d" />
                      <Text style={styles.statsInfoText}>Categories: Your top volunteering categories based on hours</Text>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Top Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Category</Text>
          <View style={styles.categoriesContainer}>
            {(() => {
              const cat = TOP_CATEGORIES.find(
                c => c.id === (profile ? (profile as any).top_category : '')
              );
              return cat ? (
                <View style={[styles.categoryTag, { backgroundColor: cat.color, flexDirection: 'row', alignItems: 'center' }]}> 
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                </View>
              ) : null;
            })()}
          </View>
        </View>

        {/* Badges Section */}
        {isOwnProfile ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earned Badges</Text>
              <View style={styles.badgesBubblyRow}>
                {earnedBadges.length === 0 ? (
                  <Text style={{ color: '#666', textAlign: 'center' }}>No badges earned yet.</Text>
                ) : (
                  earnedBadges.map((badge: Badge) => (
                    <TouchableOpacity
                      key={badge.id}
                      style={styles.badgeBubble}
                      onPress={() => setSelectedBadge(badge)}
                    >
                      <Text style={styles.badgeIconBubbly}>{badge.icon}</Text>
                      <Text style={styles.badgeNameBubbly}>{badge.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Locked Badges</Text>
              <View style={styles.badgesBubblyRow}>
                {lockedBadges.length === 0 ? (
                  <Text style={{ color: '#666', textAlign: 'center' }}>All badges earned!</Text>
                ) : (
                  lockedBadges.map((badge: Badge) => (
                    <TouchableOpacity
                      key={badge.id}
                      style={[styles.badgeBubble, { opacity: 0.4 }]}
                      onPress={() => setSelectedBadge(badge)}
                    >
                      <Text style={styles.badgeIconBubbly}>{badge.icon}</Text>
                      <Text style={styles.badgeNameBubbly}>{badge.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesBubblyRow}>
              {earnedBadges.length === 0 ? (
                <Text style={{ color: '#666', textAlign: 'center' }}>No badges earned yet.</Text>
              ) : (
                earnedBadges.map((badge: Badge) => (
                  <TouchableOpacity
                    key={badge.id}
                    style={styles.badgeBubble}
                    onPress={() => setSelectedBadge(badge)}
                  >
                    <Text style={styles.badgeIconBubbly}>{badge.icon}</Text>
                    <Text style={styles.badgeNameBubbly}>{badge.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}

        {/* Posts Section */}
        <View style={styles.userPostsContainer}>
          <Text style={styles.userPostsTitle}>Posts</Text>
          {renderPosts()}
        </View>

        {/* Settings Sections */}
        {isOwnProfile && SETTINGS_SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                onPress={() => {
                  if (item.type === 'switch') {
                    handleSettingToggle(item.id);
                  } else {
                    handleSettingPress(item.id);
                  }
                }}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={item.destructive ? '#ff3b30' : '#22543D'}
                  />
                  <Text
                    style={[
                      styles.settingText,
                      item.destructive && styles.destructiveText,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                {item.type === 'switch' ? (
                  <Switch
                    value={settings[item.id]}
                    onValueChange={() => handleSettingToggle(item.id)}
                    trackColor={{ false: '#767577', true: '#4A90E2' }}
                    thumbColor={settings[item.id] ? '#fff' : '#f4f3f4'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Post Details Modal */}
        <Modal
          visible={showPostDetails}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPostDetails(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowPostDetails(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { height: '80%' }]}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowPostDetails(false)}>
                      <Ionicons name="close" size={24} color="#166a5d" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Post Details</Text>
                    <View style={{ width: 24 }} />
                  </View>
                  <ScrollView style={styles.modalScroll} contentContainerStyle={{ flexGrow: 1 }}>
                    {selectedPost && (
                      <>
                        {selectedPost.image && (
                          <Image source={{ uri: selectedPost.image }} style={styles.modalPostImage} />
                        )}
                        <Text style={styles.modalPostTitle}>{selectedPost.title}</Text>
                        <Text style={styles.modalPostCategory}>
                          {TOP_CATEGORIES.find((cat: Category) => cat.id === selectedPost.category)?.emoji} {TOP_CATEGORIES.find((cat: Category) => cat.id === selectedPost.category)?.label} • {selectedPost.hours} hours
                        </Text>
                        <Text style={styles.modalPostContent}>{selectedPost.content}</Text>
                        <Text style={styles.modalPostTimestamp}>{formatTimestamp(selectedPost.createdAt)}</Text>

                        {/* Likes Section */}
                        <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Likes ({selectedPost.likes.length})</Text>
                          {selectedPost.likes.length === 0 ? (
                            <Text style={styles.modalEmptyText}>No likes yet</Text>
                          ) : (
                            <Text style={styles.modalEmptyText}>Liked by {selectedPost.likes.length} people</Text>
                          )}
                        </View>

                        {/* Comments Section */}
                        <View style={styles.modalSection}>
                          <Text style={styles.modalSectionTitle}>Comments ({selectedPost.comments.length})</Text>
                          {selectedPost.comments.length === 0 ? (
                            <Text style={styles.modalEmptyText}>No comments yet</Text>
                          ) : (
                            selectedPost.comments.map(comment => (
                              <View key={comment.id} style={styles.modalComment}>
                                <Image
                                  source={{ uri: comment.userProfilePicture || 'https://randomuser.me/api/portraits/men/1.jpg' }}
                                  style={styles.modalCommentAvatar}
                                />
                                <View style={styles.modalCommentContent}>
                                  <Text style={styles.modalCommentName}>{comment.userName}</Text>
                                  <Text style={styles.modalCommentText}>{comment.content}</Text>
                                </View>
                              </View>
                            ))
                          )}
                        </View>
                      </>
                    )}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ScrollView>

      {/* Keep all the modals */}
      {renderBadgeModal()}
      {renderEditProfileModal()}
      {renderChangeEmailModal()}
      {renderChangePasswordModal()}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSaveEdit}
          onDelete={handleDeletePost}
        />
      )}
      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#166a5d" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={[styles.notificationItem, !item.read && styles.unreadNotification]}
                    onPress={() => handleNotificationPress(item)}
                  >
                    <Image
                      source={{ uri: item.from_user?.profile_picture || DEFAULT_AVATAR }}
                      style={styles.notificationAvatar}
                    />
                    <View>
                      <Text style={styles.notificationText}>
                        {item.type === 'follow' && `${item.from_user?.username || 'Someone'} started following you`}
                        {item.type === 'like' && `${item.from_user?.username || 'Someone'} liked your post`}
                        {item.type === 'comment' && `${item.from_user?.username || 'Someone'} commented on your post`}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatTimestamp(item.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyNotifications}>
                  <Ionicons name="notifications-off-outline" size={48} color="#666" />
                  <Text style={styles.emptyNotificationsText}>No notifications yet</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f9ec',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#f0f0f0',
  },
  profileText: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166a5d',
    marginBottom: 4,
  },
  fullName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  followButton: {
    backgroundColor: '#166a5d',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#166a5d',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#166a5d',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
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
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#e6f9ec',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: '#22543D',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#22543D',
    marginLeft: 12,
  },
  destructiveText: {
    color: '#ff3b30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  editProfileModal: {
    backgroundColor: '#fff',
    borderRadius: 28,
    width: '98%',
    maxWidth: 700,
    minHeight: '80%',
    height: '90%',
    maxHeight: '98%',
    margin: 0,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  editProfileContent: {
    flex: 1,
    padding: 8,
  },
  profilePictureEdit: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 24,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#e6f9ec',
  },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#22543D',
    backgroundColor: '#f9f9f9',
    marginBottom: 4,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userPostsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
  },
  userPostsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166a5d',
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
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166a5d',
    marginBottom: 8,
  },
  postCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 12,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e6f9ec',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  noPosts: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  followCountBubbly: {
    fontSize: 15,
    color: '#166a5d',
    fontWeight: '700',
    marginHorizontal: 2,
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  categoryEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  statsInfoContent: {
    padding: 16,
    paddingRight: 24,
  },
  statsInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  statsInfoText: {
    fontSize: 16,
    color: '#22543D',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  categoryButton: {
    backgroundColor: '#e6f9ec',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  followersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 20,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
  },
  followerProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  followerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166a5d',
  },
  followerBio: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  seeMoreButton: {
    backgroundColor: '#166a5d',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  seeMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  postsList: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalPostTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166a5d',
    marginBottom: 8,
  },
  modalPostCategory: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  modalPostContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
  modalPostTimestamp: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  modalSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e6f9ec',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166a5d',
    marginBottom: 12,
  },
  modalEmptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  modalComment: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  modalCommentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalCommentContent: {
    flex: 1,
  },
  modalCommentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166a5d',
    marginBottom: 4,
  },
  modalCommentText: {
    fontSize: 14,
    color: '#333',
  },
  postsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationText: {
    fontSize: 14,
    color: '#22543D',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyNotifications: {
    padding: 32,
    alignItems: 'center',
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  modalScroll: {
    flex: 1,
    width: '100%',
    padding: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
}); 