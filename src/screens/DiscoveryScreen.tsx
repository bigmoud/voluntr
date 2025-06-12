import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { supabase } from '../lib/supabase';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { usePosts, Post, Comment } from '../context/PostsContext';
import * as ImagePicker from 'expo-image-picker';

const TOP_CATEGORIES = [
  { id: 'environment', label: 'Environment', emoji: '🌿', color: '#A3E635' },
  { id: 'community', label: 'Community', emoji: '👥', color: '#60A5FA' },
  { id: 'relief', label: 'Care & Relief', emoji: '🆘', color: '#F87171' },
  { id: 'youth', label: 'Youth & Education', emoji: '👶', color: '#FBBF24' },
  { id: 'health', label: 'Health & Animals', emoji: '🐾', color: '#34D399' },
  { id: 'faith', label: 'Faith-Based', emoji: '🙏', color: '#A78BFA' },
];

const HOURS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

type User = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
};

type DiscoveryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DiscoveryScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<DiscoveryScreenNavigationProp>();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { posts, addPost, likePost, unlikePost, addComment, loading: postsLoading, fetchPosts } = usePosts();
  const [commentText, setCommentText] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Post creation state
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [hours, setHours] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [showStatsInfo, setShowStatsInfo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim() || !category || !hours) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!profile) {
      Alert.alert('Error', 'No profile found');
      return;
    }

    try {
      await addPost({
        title: title.trim(),
        content: content.trim(),
        category,
        hours,
        userEmail: profile.email,
        userName: profile.full_name,
        userProfilePicture: profile.profile_picture || '',
        userId: profile.id,
        image: image || undefined,
      });

      // Reset form and close modal
      setTitle('');
      setContent('');
      setCategory('');
      setHours(null);
      setImage(null);
      setShowCreatePost(false);

      Alert.alert('Success', 'Post created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, username, profile_picture, bio')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', user?.id) // Exclude current user
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.likes.includes(user.id)) {
      await unlikePost(postId);
    } else {
      await likePost(postId);
    }
  };

  const handleComment = async (postId: string) => {
    if (!user || !profile || !commentText.trim()) return;

    try {
      await addComment(postId, {
        postId,
        userId: user.id,
        userName: profile.full_name,
        userProfilePicture: profile.profile_picture || '',
        content: commentText.trim(),
      });
      setCommentText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

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

  const handleUserPress = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !profile) {
        Alert.alert('Error', 'Could not load user profile');
        return;
      }
      navigation.navigate('UserProfile', { user: profile });
    } catch (e) {
      Alert.alert('Error', 'Could not load user profile');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserPress(item.id)}
    >
      <Image
        source={{ uri: item.profile_picture || 'https://randomuser.me/api/portraits/men/1.jpg' }}
        style={styles.profilePicture}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
        {item.bio && <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image
          source={{ uri: item.userProfilePicture || 'https://randomuser.me/api/portraits/men/1.jpg' }}
          style={styles.postProfilePicture}
        />
        <View style={styles.postUserInfo}>
          <Text style={styles.postUserName}>{item.userName}</Text>
          <Text style={styles.postTimestamp}>{formatTimestamp(item.createdAt)}</Text>
        </View>
      </View>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postCategory}>
        {TOP_CATEGORIES.find(cat => cat.id === item.category)?.emoji} {TOP_CATEGORIES.find(cat => cat.id === item.category)?.label} • {item.hours} hours
      </Text>
      <Text style={styles.postContent}>{item.content}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons 
            name={(item.likes || []).includes(user?.id || '') ? "heart" : "heart-outline"} 
            size={24} 
            color={(item.likes || []).includes(user?.id || '') ? "#FF6B6B" : "#666"} 
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
                  source={{ uri: comment.userProfilePicture || 'https://randomuser.me/api/portraits/men/1.jpg' }}
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
            />
            <TouchableOpacity 
              style={styles.commentButton}
              onPress={() => handleComment(item.id)}
            >
              <Ionicons name="send" size={24} color="#388E6C" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const renderCreatePostModal = () => (
    <Modal
      visible={showCreatePost}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreatePost(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowCreatePost(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                  <Ionicons name="close" size={24} color="#166a5d" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Create Post</Text>
                <TouchableOpacity onPress={handleCreatePost}>
                  <Text style={styles.postButton}>Post</Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalScroll}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Title</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Give your post a title"
                    maxLength={100}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Content</Text>
                  <TextInput
                    style={[styles.input, styles.contentInput]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Share your volunteering experience..."
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.label}>Category</Text>
                    <TouchableOpacity onPress={() => setShowStatsInfo(true)}>
                      <Ionicons name="information-circle-outline" size={20} color="#166a5d" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
                    {TOP_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryButton,
                          category === cat.id && { backgroundColor: cat.color, borderColor: cat.color },
                        ]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                        <Text
                          style={[
                            styles.categoryButtonText,
                            category === cat.id && styles.selectedCategoryText,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hours</Text>
                  <View style={styles.hoursContainer}>
                    {HOURS_OPTIONS.map((hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.hourButton,
                          hours === hour && styles.selectedHourButton,
                        ]}
                        onPress={() => setHours(hour)}
                      >
                        <Text
                          style={[
                            styles.hourButtonText,
                            hours === hour && styles.selectedHourButtonText,
                          ]}
                        >
                          {hour}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Add Photo (Optional)</Text>
                  <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.selectedImage} />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="camera" size={24} color="#166a5d" />
                        <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
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
              <View style={[styles.modalContent, { height: 'auto', maxHeight: '80%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>How Posts Impact Stats</Text>
                  <TouchableOpacity onPress={() => setShowStatsInfo(false)}>
                    <Ionicons name="close" size={24} color="#166a5d" />
                  </TouchableOpacity>
                </View>
                <View style={styles.statsInfoContent}>
                  <Text style={styles.statsInfoText}>
                    Your posts directly impact your volunteering stats:
                  </Text>
                  <View style={styles.statsInfoItem}>
                    <Ionicons name="time-outline" size={20} color="#166a5d" />
                    <Text style={styles.statsInfoText}>Hours: Added to your total hours volunteered</Text>
                  </View>
                  <View style={styles.statsInfoItem}>
                    <Ionicons name="calendar-outline" size={20} color="#166a5d" />
                    <Text style={styles.statsInfoText}>Events: Counts as a new volunteering activity</Text>
                  </View>
                  <View style={styles.statsInfoItem}>
                    <Ionicons name="leaf-outline" size={20} color="#166a5d" />
                    <Text style={styles.statsInfoText}>Categories: Updates your top volunteering categories</Text>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {searchQuery ? (
        loading ? (
          <ActivityIndicator style={styles.loader} color="#166a5d" />
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.noResults}>No users found</Text>
            }
          />
        )
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.noResults}>No posts yet. Be the first to share your volunteering experience!</Text>
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreatePost(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {renderCreatePostModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f9ec',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166a5d',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: '#666',
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  searchPrompt: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#388E6C',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '90%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166a5d',
  },
  postButton: {
    color: '#388E6C',
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166a5d',
    marginRight: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 8,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166a5d',
  },
  selectedCategoryText: {
    color: '#fff',
  },
  hoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedHourButton: {
    backgroundColor: '#388E6C',
    borderColor: '#388E6C',
  },
  hourButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166a5d',
  },
  selectedHourButtonText: {
    color: '#fff',
  },
  imageButton: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e6f9ec',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#166a5d',
    fontSize: 16,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    color: '#166a5d',
    lineHeight: 24,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postProfilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postUserInfo: {
    marginLeft: 12,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166a5d',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    marginBottom: 12,
  },
  postActions: {
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
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e6f9ec',
  },
  commentsList: {
    maxHeight: 200,
  },
  commentItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  commentProfilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166a5d',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  commentButton: {
    padding: 8,
  },
}); 