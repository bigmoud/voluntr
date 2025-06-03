import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useProfile } from '../context/ProfileContext';
import { useStats } from '../context/StatsContext';
import { usePosts } from '../context/PostsContext';
import * as ImagePicker from 'expo-image-picker';

// Mock data for friends' posts
const FRIENDS_POSTS = [
  {
    id: 'f1',
    userName: 'Emma Wilson',
    userProfilePicture: 'https://i.pravatar.cc/150?img=3',
    userEmail: 'emma@example.com',
    title: 'Tree Planting Success',
    content: 'Planted 20 trees today with the team! 🌳',
    category: 'Environment',
    hours: 2,
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    image: null,
    likes: 3,
    likedBy: ['Sarah Johnson', 'David Kim', 'Michael Chen'],
    comments: [
      { name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=1', text: 'Amazing work Emma!' },
      { name: 'David Kim', avatar: 'https://i.pravatar.cc/150?img=4', text: 'Keep it up!' },
    ],
  },
  {
    id: 'f2',
    userName: 'Michael Chen',
    userProfilePicture: 'https://i.pravatar.cc/150?img=2',
    userEmail: 'michael@example.com',
    title: 'Food Bank Volunteering',
    content: 'Helped sort food donations for families in need.',
    category: 'Community',
    hours: 3,
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    image: null,
    likes: 2,
    likedBy: ['Emma Wilson', 'Sarah Johnson'],
    comments: [
      { name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?img=3', text: 'You rock Michael!' },
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

// Category emoji and color mapping
const CATEGORY_META = {
  'Environment': { emoji: '🌿', color: '#388E6C' },
  'Community': { emoji: '🏨', color: '#4A90E2' },
  'Care & Relief': { emoji: '🤝', color: '#F5A623' },
  'Youth & Education': { emoji: '📚', color: '#9B51E0' },
  'Health & Animals': { emoji: '❤️', color: '#E74C3C' },
  'Faith-Based': { emoji: '🕊️', color: '#2D9CDB' },
} as const;
type CategoryKey = keyof typeof CATEGORY_META;
function getCategoryMeta(category: string) {
  return CATEGORY_META[category as CategoryKey] || { emoji: '', color: '#166a5d' };
}

// Add a mock user profile for search testing
const MOCK_USER_PROFILE = {
  id: 'mock1',
  userName: 'Test User',
  userProfilePicture: 'https://randomuser.me/api/portraits/men/99.jpg',
  userEmail: 'testuser@example.com',
  title: 'Mock Post',
  content: 'This is a mock post for search testing.',
  category: 'Community',
  hours: 2,
  timestamp: Date.now() - 1000 * 60 * 60 * 1,
  image: null,
  likes: 0,
  likedBy: [],
  comments: [],
  username: 'searchme',
};

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';

// Add a new component for profile search results
const ProfileSearchResult = ({ user, onPress }: { user: any; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.profileSearchResult} 
    onPress={onPress}
  >
    <Image 
      source={{ uri: user.userProfilePicture || DEFAULT_AVATAR }} 
      style={styles.profileSearchAvatar} 
    />
    <View style={styles.profileSearchInfo}>
      <Text style={styles.profileSearchName}>{user.userName}</Text>
      <Text style={styles.profileSearchUsername}>@{user.username || user.userName.toLowerCase().replace(/\s+/g, '')}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#166a5d" />
  </TouchableOpacity>
);

export const DiscoverScreen = () => {
  const [likes, setLikes] = useState<{ [postId: string]: boolean }>({});
  const [comments, setComments] = useState<{ [postId: string]: { name: string; avatar: string; text: string }[] }>(() => {
    // Initialize with friends' comments
    const initial: any = {};
    FRIENDS_POSTS.forEach(post => {
      initial[post.id] = post.comments || [];
    });
    return initial;
  });
  const [commentModal, setCommentModal] = useState<{ visible: boolean; postId: string | null }>({ visible: false, postId: null });
  const [newComment, setNewComment] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hours, setHours] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useProfile();
  const { updateStats } = useStats();
  const { posts, addPost } = usePosts();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showStatsInfo, setShowStatsInfo] = useState(false);

  // Image picker for post
  const pickPostImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission needed to access photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      setNewPostImage(result.assets[0].uri);
    }
  };

  // Like toggle handler
  const handleLike = (postId: string) => {
    setLikes(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Open comment modal
  const handleOpenComments = (postId: string) => {
    setCommentModal({ visible: true, postId });
    setNewComment('');
  };

  // Add comment
  const handleAddComment = () => {
    if (!commentModal.postId || !newComment.trim() || !profile) return;
    setComments(prev => ({
      ...prev,
      [commentModal.postId!]: [
        ...(prev[commentModal.postId!] || []),
        { name: profile.full_name, avatar: profile.profile_picture || DEFAULT_AVATAR, text: newComment.trim() },
      ],
    }));
    setNewComment('');
  };

  // Create post
  const handleCreatePost = () => {
    if (!profile || !newPostContent.trim() || !newPostTitle.trim() || !selectedCategory || !hours) {
      alert('Please fill in all fields');
      return;
    }
    addPost({
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      category: selectedCategory,
      hours: parseInt(hours, 10),
      userId: profile.email,
      userEmail: profile.email,
      userName: profile.full_name,
      userProfilePicture: profile.profile_picture || DEFAULT_AVATAR,
      ...(newPostImage ? { image: newPostImage } : {}),
    });
    updateStats(parseInt(hours, 10), selectedCategory);
    setShowCreatePost(false);
    setNewPostContent('');
    setNewPostTitle('');
    setSelectedCategory('');
    setHours('');
    setNewPostImage(null);
  };

  // Merge posts: mock friends' posts + user's posts
  const allPosts = [
    MOCK_USER_PROFILE,
    ...FRIENDS_POSTS.map(post => ({ ...post, username: '' })),
    ...posts.map(post => ({
      ...post,
      likes: 0,
      likedBy: [],
      comments: comments[post.id] || [],
      username: profile?.username || '',
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  // Filter by username
  const filteredProfiles = allPosts
    .filter(post => {
      const searchTarget = post.username || post.userName || '';
      return searchTarget.toLowerCase().includes((searchQuery || '').toLowerCase());
    })
    .reduce((unique: any[], post) => {
      // Only add unique users based on email
      if (!unique.find(p => p.userEmail === post.userEmail)) {
        unique.push(post);
      }
      return unique;
    }, []);

  // Comment modal component
  const renderCommentModal = () => {
    if (!commentModal.visible || !commentModal.postId) return null;
    const postComments = comments[commentModal.postId] || [];
    return (
      <Modal
        visible={commentModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentModal({ visible: false, postId: null })}
      >
        <TouchableWithoutFeedback onPress={() => setCommentModal({ visible: false, postId: null })}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { maxHeight: 400 }]}> 
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Comments</Text>
                  <TouchableOpacity onPress={() => setCommentModal({ visible: false, postId: null })}>
                    <Ionicons name="close" size={24} color="#166a5d" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 200, marginBottom: 12 }}>
                  {postComments.length === 0 ? (
                    <Text style={{ color: '#666', textAlign: 'center' }}>No comments yet.</Text>
                  ) : (
                    postComments.map((c, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { user: { name: c.name, profilePicture: c.avatar } })}>
                          <Image source={{ uri: c.avatar }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { user: { name: c.name, profilePicture: c.avatar } })}>
                          <Text style={{ color: '#166a5d', fontWeight: '700' }}>{c.name}</Text>
                        </TouchableOpacity>
                        <View>
                          <Text style={{ color: '#166a5d', marginLeft: 8 }}>{c.text}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
                <TextInput
                  style={[styles.postInput, { minHeight: 40, height: 40, marginBottom: 8 }]
                  }
                  placeholder="Add a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <TouchableOpacity
                  style={styles.postButton}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Text style={styles.postButtonText}>Comment</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Create post modal
  const renderCreatePostModal = () => (
    <Modal
      visible={showCreatePost}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCreatePost(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.centeredModalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={styles.centeredModalCard}>
              <View style={styles.modalHeaderCentered}>
                <Text style={styles.modalTitleCentered}>Create Post</Text>
                <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                  <Ionicons name="close" size={24} color="#166a5d" />
                </TouchableOpacity>
              </View>
              {/* Image picker */}
              <TouchableOpacity style={{ alignItems: 'center', marginBottom: 20 }} onPress={pickPostImage}>
                {newPostImage ? (
                  <Image source={{ uri: newPostImage }} style={{ width: 120, height: 90, borderRadius: 12 }} />
                ) : (
                  <View style={{ width: 120, height: 90, borderRadius: 12, backgroundColor: '#e6f9ec', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={32} color="#388E6C" />
                    <Text style={{ color: '#388E6C', fontSize: 13 }}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TextInput
                style={[styles.titleInputCentered, { marginBottom: 16 }]}
                placeholder="Title"
                value={newPostTitle}
                onChangeText={setNewPostTitle}
                placeholderTextColor="#666"
              />
              <TextInput
                style={[styles.postInputCentered, { marginBottom: 20 }]}
                placeholder="What's on your mind?"
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                numberOfLines={4}
                placeholderTextColor="#666"
              />
              <View style={[styles.categoryContainerCentered, { marginBottom: 20 }]}> 
                <Text style={styles.categoryLabelCentered}>Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButtonCentered,
                        selectedCategory === category && styles.selectedCategoryCentered,
                        { borderColor: getCategoryMeta(category).color, borderWidth: selectedCategory === category ? 2 : 1, marginRight: 8 }
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonTextCentered,
                          selectedCategory === category && styles.selectedCategoryTextCentered,
                          { color: getCategoryMeta(category).color }
                        ]}
                      >
                        {getCategoryMeta(category).emoji} {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {/* Hours Picker */}
              <View style={{ marginBottom: 24 }}>
                <View style={styles.hoursHeader}>
                  <Text style={styles.categoryLabelCentered}>Hours volunteered:</Text>
                  <TouchableOpacity onPress={() => setShowStatsInfo(true)}>
                    <Ionicons name="information-circle-outline" size={20} color="#166a5d" />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {[...Array(12)].map((_, i) => {
                    const val = (i + 1).toString();
                    const selected = hours === val;
                    return (
                      <TouchableOpacity
                        key={val}
                        style={[
                          { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginRight: 8, backgroundColor: selected ? '#388E6C' : '#f7fafc', borderWidth: selected ? 2 : 1, borderColor: selected ? '#388E6C' : '#e6f9ec' },
                        ]}
                        onPress={() => setHours(val)}
                      >
                        <Text style={{ color: selected ? '#fff' : '#166a5d', fontWeight: '600', fontSize: 16 }}>{val}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <TouchableOpacity
                style={[styles.postButtonCentered, { marginTop: 8 }]}
                onPress={handleCreatePost}
              >
                <Text style={styles.postButtonTextCentered}>Post</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>

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
                  <Text style={styles.modalTitle}>How Posts Impact Stats</Text>
                  <TouchableOpacity onPress={() => setShowStatsInfo(false)}>
                    <Ionicons name="close" size={24} color="#166a5d" />
                  </TouchableOpacity>
                </View>
                <View style={styles.statsInfoContent}>
                  <Text style={styles.statsInfoText}>
                    When you create a post, it automatically updates your stats:
                  </Text>
                  <View style={styles.statsInfoItem}>
                    <Ionicons name="time-outline" size={20} color="#166a5d" />
                    <Text style={styles.statsInfoText}>The hours you enter will be added to your total volunteer hours</Text>
                  </View>
                  <View style={styles.statsInfoItem}>
                    <Ionicons name="calendar-outline" size={20} color="#166a5d" />
                    <Text style={styles.statsInfoText}>Each post counts as one event in your volunteering history</Text>
                  </View>
                  <View style={styles.statsInfoItem}>
                    <Ionicons name="leaf-outline" size={20} color="#166a5d" />
                    <Text style={styles.statsInfoText}>The category you select helps track your top volunteering areas</Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreatePost(true)}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* Search bar for people by username */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#388E6C" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people by username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#388E6C"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#388E6C" />
          </TouchableOpacity>
        )}
      </View>
      {/* Show profile search results or posts feed */}
      <ScrollView style={styles.content}>
        {searchQuery ? (
          filteredProfiles.length > 0 ? (
            filteredProfiles.map(profile => (
              <ProfileSearchResult
                key={profile.userEmail}
                user={profile}
                onPress={() => navigation.navigate('UserProfile', { 
                  user: { 
                    name: profile.userName, 
                    profilePicture: profile.userProfilePicture, 
                    email: profile.userEmail 
                  } 
                })}
              />
            ))
          ) : (
            <Text style={styles.noResultsText}>No users found</Text>
          )
        ) : (
          allPosts.map(post => (
            <View key={post.id} style={styles.profilePostCard}>
              {/* Header: avatar, username, timestamp */}
              <View style={styles.profilePostHeaderRow}>
                <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { user: { name: post.userName, profilePicture: post.userProfilePicture, email: post.userEmail } })}>
                  <Image source={{ uri: post.userProfilePicture }} style={styles.profilePostAvatar} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { user: { name: post.userName, profilePicture: post.userProfilePicture, email: post.userEmail } })}>
                    <Text style={styles.profilePostUserName}>{post.userName}</Text>
                  </TouchableOpacity>
                  <Text style={styles.profilePostTimestamp}>{new Date(post.timestamp).toLocaleString()}</Text>
                </View>
              </View>
              {post.title && (
                <Text style={styles.profilePostTitle}>{post.title}</Text>
              )}
              <Text style={styles.profilePostCategory}>
                {getCategoryMeta(post.category).emoji} {post.category} • {post.hours} hours
              </Text>
              <Text style={styles.profilePostContent}>{post.content}</Text>
              {/* Actions: likes/comments */}
              <View style={styles.profilePostActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
                  <Ionicons name={likes[post.id] ? 'heart' : 'heart-outline'} size={20} color={likes[post.id] ? '#e74c3c' : '#166a5d'} />
                  <Text style={styles.actionText}>{(post.likes || 0) + (likes[post.id] ? 1 : 0)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenComments(post.id)}>
                  <Ionicons name="chatbubble-outline" size={20} color="#166a5d" />
                  <Text style={styles.actionText}>{comments[post.id]?.length ?? 0}</Text>
                </TouchableOpacity>
              </View>
              {/* Optional: post image */}
              {post.image && (
                <Image source={{ uri: post.image }} style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 8 }} resizeMode="cover" />
              )}
            </View>
          ))
        )}
      </ScrollView>
      {renderCommentModal()}
      {renderCreatePostModal()}
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#166a5d',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
    margin: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#22543D',
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profilePostCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  profilePostHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profilePostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f9ec',
  },
  profilePostUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22543D',
  },
  profilePostTimestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  profilePostTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
    marginBottom: 8,
  },
  profilePostCategory: {
    fontSize: 14,
    color: '#666',
  },
  profilePostContent: {
    fontSize: 16,
    color: '#22543D',
    marginTop: 4,
  },
  profilePostActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#166a5d',
    marginLeft: 4,
  },
  createButton: {
    backgroundColor: '#388E6C',
    borderRadius: 18,
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166a5d',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 12,
    padding: 12,
  },
  postButton: {
    backgroundColor: '#388E6C',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  centeredModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalHeaderCentered: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleCentered: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166a5d',
  },
  titleInputCentered: {
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 12,
    padding: 12,
  },
  postInputCentered: {
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 12,
    padding: 12,
  },
  categoryContainerCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabelCentered: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166a5d',
    marginRight: 8,
  },
  categoryButtonCentered: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 8,
  },
  categoryButtonTextCentered: {
    fontSize: 14,
    color: '#166a5d',
  },
  selectedCategoryCentered: {
    backgroundColor: '#388E6C',
  },
  selectedCategoryTextCentered: {
    fontWeight: '700',
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsInfoContent: {
    padding: 16,
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
  postButtonCentered: {
    backgroundColor: '#388E6C',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  postButtonTextCentered: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  profileSearchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  profileSearchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f9ec',
  },
  profileSearchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileSearchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
  },
  profileSearchUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
    fontSize: 16,
  },
}); 