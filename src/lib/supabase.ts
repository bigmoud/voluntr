import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Profile helper functions
export const createProfile = async (profile: {
  id: string;
  email: string;
  full_name: string;
  username: string;
  bio?: string;
  profile_picture?: string;
  preferred_categories?: string[];
  top_category?: string;
}) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select()
    .single();
  return { data, error };
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateProfile = async (userId: string, updates: Partial<{
  full_name: string;
  username: string;
  bio: string;
  profile_picture: string;
  preferred_categories: string[];
  top_category: string;
  location: string;
}>) => {
  try {
    console.log('Starting profile update in supabase.ts...');
    console.log('User ID:', userId);
    console.log('Updates:', updates);

    // First check if the profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Existing profile check:', { existingProfile, checkError });

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', checkError);
      throw checkError;
    }

    let result;
    if (!existingProfile) {
      console.log('Profile does not exist, creating new profile...');
      result = await supabase
        .from('profiles')
        .insert([{ id: userId, ...updates }])
        .select()
        .single();
    } else {
      console.log('Profile exists, updating...');
      result = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
    }

    console.log('Update/Insert response:', result);

    if (result.error) {
      console.error('Update/Insert error:', result.error);
      throw result.error;
    }

    return result;
  } catch (error) {
    console.error('Error in updateProfile:', error);
    throw error;
  }
};

// Followers helper functions
export const followUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('followers')
    .insert([{ follower_id: followerId, following_id: followingId }])
    .select()
    .single();
  return { data, error };
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  return { error };
};

export const getFollowers = async (userId: string) => {
  const { data, error } = await supabase
    .from('followers')
    .select(`
      follower:profiles!followers_follower_id_fkey(*)
    `)
    .eq('following_id', userId);
  return { data, error };
};

export const getFollowing = async (userId: string) => {
  const { data, error } = await supabase
    .from('followers')
    .select(`
      following:profiles!followers_following_id_fkey(*)
    `)
    .eq('follower_id', userId);
  return { data, error };
};

// Upload an image to Supabase Storage and return the public URL
export const uploadProfilePicture = async (userId: string, uri: string) => {
  try {
    console.log('Starting profile picture upload...');
    console.log('User ID:', userId);
    
    // Get the file extension
    const ext = uri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${ext}`;
    
    console.log('File name:', fileName);

    // Fetch the image as a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    console.log('Blob created, size:', blob.size);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type,
      });
      
    console.log('Upload response:', { data, error });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);
      
    console.log('Public URL:', publicUrlData.publicUrl);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    throw error;
  }
};