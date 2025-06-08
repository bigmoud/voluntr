import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, Modal, TouchableWithoutFeedback, ScrollView, TextInput, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '../context/PostsContext';
import { useAuth } from '../context/AuthContext';
import { TOP_CATEGORIES } from '../constants/categories';
import { Category, Post } from '../types';
import * as ImagePicker from 'expo-image-picker';

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';

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

type EditPostModalProps = {
  post: Post;
  onClose: () => void;
  onSave: (post: Post) => void;
  onDelete: (postId: string) => void;
};

const EditPostModal = ({ post, onClose, onSave, onDelete }: EditPostModalProps) => {
  if (!post) return null;
  
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
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TOP_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      category === cat.id && styles.categoryButtonSelected,
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[
                      styles.categoryLabel,
                      category === cat.id && styles.categoryLabelSelected,
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginBottom: 8 }}>Hours</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {HOURS_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.hoursButton,
                      hours === h && styles.hoursButtonSelected,
                    ]}
                    onPress={() => setHours(h)}
                  >
                    <Text style={[
                      styles.hoursButtonText,
                      hours === h && styles.hoursButtonTextSelected,
                    ]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#166a5d', marginBottom: 8 }}>Image</Text>
              {image ? (
                <View style={{ position: 'relative' }}>
                  <Image source={{ uri: image }} style={{ width: '100%', height: 200, borderRadius: 8 }} />
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 }}
                    onPress={() => setImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ borderWidth: 1, borderColor: '#e6f9ec', borderRadius: 8, padding: 12, alignItems: 'center' }}
                  onPress={pickImage}
                >
                  <Ionicons name="image-outline" size={24} color="#166a5d" />
                  <Text style={{ color: '#166a5d', marginTop: 4 }}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={{ backgroundColor: '#ffebee', padding: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={() => onDelete(post.id)}
            >
              <Text style={{ color: '#d32f2f', fontWeight: '600' }}>Delete Post</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const UserPostsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { posts, editPost, deletePost } = usePosts();
  const { user } = useAuth();
  const { userId } = route.params as { userId: string };
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostDetails, setShowPostDetails] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const userPosts = posts.filter(post => post.userId === userId);
  const isOwnProfile = user?.id === userId;

  const handleSaveEdit = async (updatedPost: Post) => {
    try {
      await editPost(updatedPost.id, updatedPost);
      setEditingPost(null);
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setEditingPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post');
    }
  };

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
        {isOwnProfile && (
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#166a5d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Posts</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={userPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.postsList}
        ListEmptyComponent={
          <Text style={styles.noPostsText}>No posts found.</Text>
        }
      />

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSaveEdit}
          onDelete={handleDeletePost}
        />
      )}

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
              <View style={[styles.modalContent, { maxHeight: '80%', height: '80%' }]}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={() => setShowPostDetails(false)}>
                    <Ionicons name="close" size={24} color="#166a5d" />
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>Post Details</Text>
                  <View style={{ width: 24 }} />
                </View>

                <ScrollView style={styles.modalScroll}>
                  {selectedPost && (
                    <>
                      <View style={styles.postHeader}>
                        <View style={styles.postUserInfo}>
                          <Image
                            source={{ uri: selectedPost.userProfilePicture || DEFAULT_AVATAR }}
                            style={styles.postAvatar}
                          />
                          <View>
                            <Text style={styles.postUsername}>{selectedPost.userName || 'Anonymous'}</Text>
                            <Text style={styles.postTimestamp}>{formatTimestamp(selectedPost.createdAt)}</Text>
                          </View>
                        </View>
                      </View>

                      {selectedPost.image && (
                        <Image source={{ uri: selectedPost.image }} style={styles.modalPostImage} />
                      )}

                      <Text style={styles.modalPostTitle}>{selectedPost.title}</Text>
                      <Text style={styles.modalPostCategory}>
                        {TOP_CATEGORIES.find((cat: Category) => cat.id === selectedPost.category)?.emoji} {TOP_CATEGORIES.find((cat: Category) => cat.id === selectedPost.category)?.label} • {selectedPost.hours} hours
                      </Text>
                      <Text style={styles.modalPostContent}>{selectedPost.content}</Text>

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
                          selectedPost.comments.map((comment, index) => (
                            <View key={`${comment.id || index}`} style={styles.modalComment}>
                              <Image
                                source={{ uri: comment.userProfilePicture || DEFAULT_AVATAR }}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166a5d',
  },
  postsList: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  postContent: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScroll: {
    flex: 1,
  },
  modalPostImage: {
    width: '100%',
    height: 300,
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
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e6f9ec',
  },
  categoryButtonSelected: {
    backgroundColor: '#e6f9ec',
    borderColor: '#166a5d',
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
  },
  categoryLabelSelected: {
    color: '#166a5d',
    fontWeight: '600',
  },
  hoursButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6f9ec',
  },
  hoursButtonSelected: {
    backgroundColor: '#e6f9ec',
    borderColor: '#166a5d',
  },
  hoursButtonText: {
    fontSize: 16,
    color: '#666',
  },
  hoursButtonTextSelected: {
    color: '#166a5d',
    fontWeight: '600',
  },
  noPostsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 32,
  },
}); 