import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { createProfile, getProfile, updateProfile as updateProfileApi, uploadProfilePicture } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { id: 'environment', label: 'Environment', emoji: '🌿' },
  { id: 'community', label: 'Community', emoji: '👥' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'health', label: 'Health', emoji: '🏥' },
  { id: 'animals', label: 'Animals', emoji: '🐾' },
  { id: 'youth', label: 'Youth', emoji: '👶' },
  { id: 'seniors', label: 'Seniors', emoji: '👴' },
  { id: 'disability', label: 'Disability', emoji: '♿' },
  { id: 'faith', label: 'Faith', emoji: '🙏' },
  { id: 'relief', label: 'Relief', emoji: '🆘' },
];

const TOP_CATEGORIES = [
  { id: 'environment', label: 'Environment', emoji: '🌿', color: '#A3E635' },
  { id: 'community', label: 'Community', emoji: '👥', color: '#60A5FA' },
  { id: 'relief', label: 'Care & Relief', emoji: '🆘', color: '#F87171' },
  { id: 'youth', label: 'Youth & Education', emoji: '👶', color: '#FBBF24' },
  { id: 'health', label: 'Health & Animals', emoji: '🐾', color: '#34D399' },
  { id: 'faith', label: 'Faith-Based', emoji: '🙏', color: '#A78BFA' },
];

type CreateProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateProfile'>;

export const CreateProfileScreen = () => {
  const navigation = useNavigation<CreateProfileScreenNavigationProp>();
  const { user } = useAuth();
  const { updateProfile } = useProfile();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [zipcode, setZipcode] = useState('');
  const [city, setCity] = useState('');
  const [topCategory, setTopCategory] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleZipcodeChange = async (zip: string) => {
    setZipcode(zip);
    if (zip.length === 5) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!res.ok) throw new Error('Invalid zipcode');
        const data = await res.json();
        const cityName = data.places[0]['place name'];
        setCity(cityName);
        setBio(`From ${cityName}`);
      } catch (e) {
        setCity('');
        // Optionally show error
      }
    } else {
      setCity('');
    }
  };

  const handleCreateProfile = async () => {
    if (!user) return;

    if (!fullName.trim() || !username.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Check if username is taken
      const { data: existing, error: existingError } = await getProfileByUsername(username.trim());
      if (existing) {
        Alert.alert('Error', 'That username is already taken. Please choose another.');
        setLoading(false);
        return;
      }
      let uploadedUrl = undefined;
      if (profilePicture) {
        // Only upload if a new image is selected
        uploadedUrl = await uploadProfilePicture(user.id, profilePicture);
      }
      const { data, error } = await createProfile({
        id: user.id,
        email: user.email!,
        full_name: fullName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        profile_picture: uploadedUrl || undefined,
        top_category: topCategory,
      });
      if (error) {
        if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
          Alert.alert('Error', 'That username is already taken. Please choose another.');
          return;
        }
        throw error;
      }
      // Update local profile state
      updateProfile(data);
      // Navigation: Remove manual navigation to 'MainTabs' since the app conditionally renders tabs when profile exists
      // navigation.replace('MainTabs');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Your Profile</Text>
            <Text style={styles.subtitle}>Tell us about yourself</Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity style={styles.profilePictureContainer} onPress={pickImage}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Text style={styles.profilePicturePlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Username *"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Zipcode"
              value={zipcode}
              onChangeText={handleZipcodeChange}
              keyboardType="numeric"
              maxLength={5}
            />

            <TextInput
              style={styles.input}
              placeholder="City (auto-filled)"
              value={city}
              editable={false}
            />

            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Bio (optional)"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Top Category</Text>
            <View style={styles.categoriesContainer}>
              {TOP_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    topCategory === category.id && {
                      backgroundColor: category.color,
                      borderColor: category.color,
                    },
                  ]}
                  onPress={() => setTopCategory(category.id)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Preferred Categories</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategories.includes(category.id) && styles.categoryButtonSelected,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.createButtonDisabled]}
              onPress={handleCreateProfile}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating Profile...' : 'Create Profile'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#166a5d',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  profilePictureContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  profilePicturePlaceholderText: {
    color: '#666',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: '#e6f7f4',
    borderColor: '#166a5d',
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#166a5d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Helper to check for existing username
const getProfileByUsername = async (username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();
  return { data, error };
}; 