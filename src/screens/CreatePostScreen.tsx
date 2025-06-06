import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePosts } from '../context/PostsContext';
import { useProfile } from '../context/ProfileContext';
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

export const CreatePostScreen = () => {
  const navigation = useNavigation();
  const { addPost } = usePosts();
  const { profile } = useProfile();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [hours, setHours] = useState<number | null>(null);
  const [image, setImage] = useState<string | null>(null);
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

      Alert.alert('Success', 'Post created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#166a5d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity onPress={handleCreatePost}>
            <Text style={styles.postButton}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
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
      </KeyboardAvoidingView>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e6f9ec',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166a5d',
  },
  postButton: {
    color: '#388E6C',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
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
    color: '#166a5d',
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
}); 