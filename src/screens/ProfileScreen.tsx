import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
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
import { createProfile, getProfile, updateProfile as updateProfileApi, uploadProfilePicture } from '../lib/supabase';
import { TOP_CATEGORIES, Category } from '../constants/categories';

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
  };
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
  }>;
  earnedBadges?: string[];
};

type Notification = {
  id: string;
  fromUser: string;
  timestamp: number;
  read: boolean;
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
      { id: 'event-reminders-popup', title: 'Pop-up Notification', icon: 'notifications-outline', type: 'switch' },
      { id: 'event-reminders-email', title: 'Email Reminder', icon: 'mail-outline', type: 'switch' },
      { id: 'event-reminders-text', title: 'Text Reminder', icon: 'chatbubble-outline', type: 'switch' },
    ],
  },
  {
    title: 'Privacy',
    items: [
      { id: 'profile-visibility', title: 'Profile Visibility', icon: 'eye-outline' },
      { id: 'data-export', title: 'Export Data', icon: 'download-outline' },
      { id: 'delete-account', title: 'Delete Account', icon: 'trash-outline', destructive: true },
      { id: 'logout', title: 'Log Out', icon: 'log-out-outline', destructive: true },
    ],
  },
  {
    title: 'Help & Support',
    items: [
      { id: 'faq', title: 'FAQ', icon: 'help-circle-outline' },
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

// Update the Post type to include timestamp
type ExtendedPost = Post & {
  timestamp?: string;
};

export const ProfileScreen = () => {
  const route = useRoute<RouteProp<MainTabParamList, 'Profile'>>();
  const navigation = useNavigation();
  const { profile, updateProfile, followUser, unfollowUser } = useProfile();
  const { stats } = useStats();
  const user = route.params?.user;
  const isOwnProfile = !user || (profile && user.email === profile.email);
  const { signOut } = useAuth();
  const { getUserPosts } = usePosts();
  const [activeTab, setActiveTab] = useState<'stats' | 'posts'>('stats');

  // Add guard for null profile
  if (!profile && isOwnProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Always provide stats for displayProfile
  const displayProfile = isOwnProfile
    ? {
        ...profile,
        stats: {
          totalHours: stats.totalHours,
          totalEvents: stats.totalEvents,
          topCategories: stats.topCategories,
        },
        badges: (profile as any).badges || DEFAULT_BADGES,
      }
    : {
        ...user,
        profilePicture: user.profilePicture || DEFAULT_AVATAR,
        stats: user.stats || DEFAULT_STATS,
        badges: user.badges || DEFAULT_BADGES,
      };
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const isFollowing = followedUsers.includes(displayProfile.email);
  const { posts, editPost, deletePost } = usePosts();
  const userPosts = getUserPosts(displayProfile.id || '');

  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    'location-enabled': true,
    'event-reminders-popup': true,
    'event-reminders-email': false,
    'event-reminders-text': false,
  });

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
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [emailFields, setEmailFields] = useState({ current: '', new: '' });
  const [passwordFields, setPasswordFields] = useState({ current: '', new: '', confirm: '' });
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { savedEvents } = useSavedEvents();

  // State for editing a post
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editFields, setEditFields] = useState({ title: '', content: '', category: '', hours: '' });

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);

  const [editLoading, setEditLoading] = useState(false);

  // State to handle image load error for profile picture
  const [imageError, setImageError] = useState(false);
  // Separate state for edit modal image error
  const [editImageError, setEditImageError] = useState(false);

  const [showStatsInfo, setShowStatsInfo] = useState(false);

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

  useEffect(() => {
    if (editingPost) {
      setEditFields({
        title: editingPost.title,
        content: editingPost.content,
        category: editingPost.category,
        hours: editingPost.hours.toString(),
      });
    }
  }, [editingPost]);

  // Update local state for each field
  const handleEditField = (field: string, value: string) => {
    setEditProfileFields(prev => ({ ...prev, [field]: value }));
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  // Update local state for profile picture
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

  const handleSettingToggle = (id: string) => {
    setSettings(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
      case 'profile-visibility':
        Alert.alert(
          'Profile Visibility',
          'Choose who can see your profile:',
          [
            { text: 'Public', onPress: () => Alert.alert('Success', 'Profile is now public') },
            { text: 'Friends Only', onPress: () => Alert.alert('Success', 'Profile is now friends only') },
            { text: 'Private', onPress: () => Alert.alert('Success', 'Profile is now private') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        break;
      case 'data-export':
        Alert.alert('Data Export', 'Your data will be exported and sent to your email.');
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
              onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.'),
            },
          ]
        );
        break;
      case 'faq':
        Alert.alert('FAQ', 'FAQ content will be displayed here.');
        break;
      case 'contact':
        Alert.alert('Contact Support', 'Support contact information will be displayed here.');
        break;
      case 'report-bug':
        Alert.prompt(
          'Report a Bug',
          'Please describe the issue:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Submit',
              onPress: (description) => {
                if (description) {
                  Alert.alert('Thank You', 'Your bug report has been submitted.');
                }
              },
            },
          ],
          'plain-text'
        );
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  // Add the logout handler
  const handleLogout = async () => {
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;
    editPost(editingPost.id, {
      title: editFields.title,
      content: editFields.content,
      category: editFields.category,
      hours: parseInt(editFields.hours, 10),
    });
    setEditingPost(null);
  };

  // Replace direct deletePost call with a confirmation dialog
  const handleDeletePost = (id: string) => {
    Alert.alert(
      'Delete Post',
      'Deleting this post will update your stats and may affect your badges. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePost(id) },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!profile) {
      Alert.alert('Error', 'No profile found');
      return;
    }
    
    setEditLoading(true);
    try {
      let uploadedUrl = editProfileFields.profilePicture;
      console.log('Initial profile picture URL:', uploadedUrl);
      
      // Only upload if a new image is selected and it's a local file (not already a Supabase URL)
      if (editProfileFields.profilePicture && !editProfileFields.profilePicture.startsWith('https://')) {
        try {
          console.log('Uploading new profile picture...');
          uploadedUrl = await uploadProfilePicture(profile.id, editProfileFields.profilePicture);
          console.log('Upload successful, new URL:', uploadedUrl);
        } catch (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          throw uploadError;
        }
      }
      
      console.log('Updating profile with URL:', uploadedUrl);
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
        console.error('Error updating profile:', error);
        if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
          Alert.alert('Error', 'That username is already taken. Please choose another.');
          return;
        }
        throw error;
      }
      
      if (data) {
        console.log('Profile updated successfully, new data:', data);
        // Update the profile in context
        await updateProfile(data);
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
      console.error('Error in handleSaveProfile:', error);
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

  // Request notification permissions and schedule notifications
  useEffect(() => {
    const setupNotifications = async () => {
      if (settings['event-reminders-popup']) {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') return;
        // Cancel all previous scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
        // Schedule notifications for each saved event
        for (const event of savedEvents) {
          if (!event.date) continue;
          const eventDate = new Date(event.date);
          // 3 days before
          const threeDaysBefore = new Date(eventDate);
          threeDaysBefore.setDate(eventDate.getDate() - 3);
          if (threeDaysBefore > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Upcoming Event Reminder',
                body: `"${event.title}" is in 3 days!`,
                sound: true,
              },
              // TypeScript workaround: Expo types may not recognize this, but it works at runtime
              trigger: { date: threeDaysBefore } as any,
            });
          }
          // 1 day before
          const oneDayBefore = new Date(eventDate);
          oneDayBefore.setDate(eventDate.getDate() - 1);
          if (oneDayBefore > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Upcoming Event Reminder',
                body: `"${event.title}" is tomorrow!`,
                sound: true,
              },
              // TypeScript workaround: Expo types may not recognize this, but it works at runtime
              trigger: { date: oneDayBefore } as any,
            });
          }
        }
      } else {
        // If pop-up reminders are off, cancel all scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
      // Email/SMS: Here you would call your backend to schedule email/SMS reminders
      // if (settings['event-reminders-email'] || settings['event-reminders-text']) {
      //   await sendReminderPreferencesToBackend(savedEvents, settings);
      // }
    };
    setupNotifications();
  }, [settings['event-reminders-popup'], settings['event-reminders-email'], settings['event-reminders-text'], savedEvents]);

  // Fetch notifications when modal is opened
  useEffect(() => {
    if (showNotifications && profile && profile.username) {
      const fetchNotifications = async () => {
        const key = `${NOTIFICATIONS_KEY}:${profile.username}`;
        const saved = await AsyncStorage.getItem(key);
        const notifs = saved ? JSON.parse(saved) : [];
        setNotifications(notifs);
        // Mark all as read
        const updated = notifs.map((n: any) => ({ ...n, read: true }));
        await AsyncStorage.setItem(key, JSON.stringify(updated));
      };
      fetchNotifications();
    }
  }, [showNotifications, profile]);

  // Count unread notifications
  const unreadCount = notifications.filter((n: any) => n && n.read === false).length;

  // For badge display
  const allBadges = BADGES;
  const earnedBadges = allBadges.filter(b => displayProfile.earnedBadges?.includes(b.id));
  const lockedBadges = allBadges.filter(b => !displayProfile.earnedBadges?.includes(b.id));

  // Helper to get user avatar (mocked for now)
  const getUserAvatar = (username: string) => {
    if (profile && username === profile.username) return profile.profile_picture;
    // For demo, use randomuser
    return `https://randomuser.me/api/portraits/men/${Math.abs(username.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 100}.jpg`;
  };

  // Helper to check if following
  const isFollowingUser = (username: string) => (profile && (profile as any).following ? (profile as any).following.includes(username) : false);

  // Reset imageError when profile picture changes
  useEffect(() => {
    setImageError(false);
  }, [displayProfile.profile_picture]);

  // Reset editImageError when editProfileFields.profilePicture changes
  useEffect(() => {
    setEditImageError(false);
  }, [editProfileFields.profilePicture]);

  // Restore modal render functions
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

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postCategory}>
        {TOP_CATEGORIES.find((cat: Category) => cat.id === item.category)?.emoji} {TOP_CATEGORIES.find((cat: Category) => cat.id === item.category)?.label} • {item.hours} hours
      </Text>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <Ionicons name="heart-outline" size={20} color="#666" />
          <Text style={styles.postStatText}>{item.likes.length}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.postStatText}>{item.comments.length}</Text>
        </View>
      </View>
    </View>
  );

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
                source={{ uri: !imageError && displayProfile.profile_picture ? displayProfile.profile_picture : DEFAULT_AVATAR }}
                style={styles.profilePictureBubbly}
                onError={() => setImageError(true)}
              />
            </View>
            <Text style={styles.nameBubbly}>{displayProfile.full_name}</Text>
            {displayProfile.username && (
              <Text style={styles.usernameBubbly}>@{displayProfile.username}</Text>
            )}
            <Text style={styles.bioBubbly}>{displayProfile.bio}</Text>
            <View style={styles.locationContainerBubbly}>
              <Ionicons name="location-outline" size={16} color="#166a5d" />
              <Text style={styles.locationBubbly}>{displayProfile.location}</Text>
            </View>
            {/* Follow/Unfollow button if not own profile */}
            {!isOwnProfile && (
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followingButton]}
                onPress={async () => {
                  try {
                    if (isFollowing) {
                      await unfollowUser(displayProfile.id);
                    } else {
                      await followUser(displayProfile.id);
                    }
                  } catch (error) {
                    console.error('Error toggling follow status:', error);
                    Alert.alert('Error', 'Failed to update follow status');
                  }
                }}
              >
                <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
            <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
              <TouchableOpacity onPress={() => setShowNotifications(true)}>
                <Ionicons name="notifications-outline" size={28} color="#166a5d" />
                {unreadCount > 0 && (
                  <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#e74c3c', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity onPress={() => navigation.navigate('Followers', { userId: displayProfile.id, type: 'followers' })}>
                <Text style={styles.followCountBubbly}>{displayProfile.followers_count || 0} Followers</Text>
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 8, color: '#888' }}>|</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Followers', { userId: displayProfile.id, type: 'following' })}>
                <Text style={styles.followCountBubbly}>{displayProfile.following_count || 0} Following</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

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
              <Text style={styles.statValueBubbly}>{stats.topCategories.length}</Text>
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

        {/* User's Posts */}
        <View style={styles.userPostsContainer}>
          <Text style={styles.userPostsTitle}>Posts</Text>
          {userPosts.length === 0 ? (
            <Text style={styles.noPostsText}>No posts yet.</Text>
          ) : (
            userPosts.map(post => (
              <View key={post.id} style={styles.postCard}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postCategory}>{post.category} • {post.hours} hours</Text>
                <Text style={styles.postContent}>{post.content}</Text>
                <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{new Date(post.timestamp).toLocaleString()}</Text>
                {isOwnProfile && (
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity style={[styles.saveButton, { paddingVertical: 6, paddingHorizontal: 12 }]} onPress={() => setEditingPost(post)}>
                      <Text style={styles.saveButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
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
      </ScrollView>

      {/* Keep all the modals */}
      {renderBadgeModal()}
      {renderEditProfileModal()}
      {renderChangeEmailModal()}
      {renderChangePasswordModal()}
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
    padding: 0,
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
    borderWidth: 0,
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
  followButton: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  followingButton: {
    backgroundColor: '#e6f9ec',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#22543D',
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
    borderTopWidth: 1,
    borderTopColor: '#e6f9ec',
    paddingTop: 12,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  postStatText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
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
}); 