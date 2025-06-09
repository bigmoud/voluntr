import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import type { Profile } from '../context/ProfileContext';
import { TOP_CATEGORIES } from '../constants/categories';

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
  email: string;
  full_name: string;
  username: string;
  bio: string;
  profile_picture: string;
  preferred_categories: string[];
  top_category: string;
  location: string;
}>) => {
  // Always upsert (insert or update) the profile row
  const { data, error } = await supabase
    .from('profiles')
    .upsert([{ id: userId, ...updates }], { onConflict: ['id'] })
    .select()
    .single();
  return { data, error };
};

// Followers helper functions
export const followUser = async (followerId: string, followingId: string) => {
  try {
    console.log('Inserting follow relationship:', { followerId, followingId });
    
    // First check if the relationship already exists
    const { data: existing, error: checkError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing follow relationship:', checkError);
      throw checkError;
    }

    if (existing) {
      console.log('Follow relationship already exists');
      return { data: existing, error: null };
    }

    // Insert the new follow relationship
  const { data, error } = await supabase
    .from('followers')
    .insert([{ follower_id: followerId, following_id: followingId }])
    .select()
    .single();

    if (error) {
      console.error('Error inserting follow relationship:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Successfully inserted follow relationship:', data);
    return { data, error: null };
  } catch (error) {
    console.error('Error in followUser:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { data: null, error };
  }
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  try {
    console.log('Deleting follow relationship:', { followerId, followingId });
    
  const { error } = await supabase
    .from('followers')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

    if (error) {
      console.error('Error deleting follow relationship:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Successfully deleted follow relationship');
    return { error: null };
  } catch (error) {
    console.error('Error in unfollowUser:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  return { error };
  }
};

type JoinedProfile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  profile_picture: string;
  bio: string;
};

type FollowingJoin = {
  following_id: string;
  profiles: JoinedProfile;
};

type FollowerJoin = {
  follower_id: string;
  profiles: JoinedProfile;
};

export const getFollowing = async (userId: string): Promise<Profile[]> => {
  try {
    console.log('Getting following for user:', userId);
  const { data, error } = await supabase
    .from('followers')
    .select(`
        following_id,
        profiles:following_id (
          id,
          email,
          full_name,
          username,
          profile_picture,
          bio
        )
      `)
      .eq('follower_id', userId)
      .returns<FollowingJoin[]>();

    console.log('Raw Supabase response:', JSON.stringify({ data, error }, null, 2));

    if (error) throw error;
    if (!data?.length) return [];

    // Map the joined data to Profile type
    const profiles = data.map(item => {
      console.log('Processing item:', JSON.stringify(item, null, 2));
      return {
        id: item.profiles.id,
        email: item.profiles.email,
        full_name: item.profiles.full_name,
        username: item.profiles.username,
        profile_picture: item.profiles.profile_picture,
        bio: item.profiles.bio,
        total_hours: 0,
        total_events: 0,
        categories: {}
      };
    });
    console.log('Mapped profiles:', JSON.stringify(profiles, null, 2));
    return profiles;
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
};

export const getFollowers = async (userId: string): Promise<Profile[]> => {
  try {
    console.log('Getting followers for user:', userId);
  const { data, error } = await supabase
    .from('followers')
    .select(`
        follower_id,
        profiles:follower_id (
          id,
          email,
          full_name,
          username,
          profile_picture,
          bio
        )
    `)
      .eq('following_id', userId)
      .returns<FollowerJoin[]>();

    console.log('Raw Supabase response:', JSON.stringify({ data, error }, null, 2));

    if (error) throw error;
    if (!data?.length) return [];

    // Map the joined data to Profile type
    const profiles = data.map(item => {
      console.log('Processing item:', JSON.stringify(item, null, 2));
      return {
        id: item.profiles.id,
        email: item.profiles.email,
        full_name: item.profiles.full_name,
        username: item.profiles.username,
        profile_picture: item.profiles.profile_picture,
        bio: item.profiles.bio,
        total_hours: 0,
        total_events: 0,
        categories: {}
      };
    });
    console.log('Mapped profiles:', JSON.stringify(profiles, null, 2));
    return profiles;
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
};

// Upload an image to Supabase Storage and return the public URL
export const uploadProfilePicture = async (userId: string, uri: string) => {
  try {
    console.log('Starting profile picture upload...');
    console.log('User ID:', userId);
    console.log('Image URI:', uri);
    
    // Get the file extension
    const ext = uri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${ext}`;
    
    console.log('File name:', fileName);

    // Fetch the image as a blob
    console.log('Fetching image as blob...');
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Convert to blob with explicit type
    const blob = await response.blob();
    console.log('Blob created, size:', blob.size, 'type:', blob.type);
    
    if (blob.size === 0) {
      throw new Error('Blob size is 0, image data is empty');
    }

    // Convert blob to base64
    console.log('Converting blob to base64...');
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    const base64Data = await base64Promise;
    console.log('Base64 conversion complete, length:', base64Data.length);

    // Upload to Supabase Storage
    console.log('Uploading to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, decode(base64Data), {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      });
      
    console.log('Upload response:', { data, error });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // Wait a moment for the upload to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the upload by getting a signed URL
    console.log('Verifying upload with signed URL...');
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('profile-pictures')
      .createSignedUrl(fileName, 60); // URL valid for 60 seconds
      
    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw signedUrlError;
    }

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to get signed URL for verification');
    }

    // Try to fetch the file using the signed URL
    console.log('Fetching file with signed URL...');
    const verifyResponse = await fetch(signedUrlData.signedUrl);
    if (!verifyResponse.ok) {
      throw new Error(`File verification failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    const verifyBlob = await verifyResponse.blob();
    console.log('Verification blob size:', verifyBlob.size);

    if (verifyBlob.size === 0) {
      throw new Error('Verified file is empty');
    }

    // Get the public URL
    console.log('Getting public URL...');
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

// Helper function to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const deleteAccount = async (userId: string) => {
  try {
    // Delete user's posts
    const { error: postsError } = await supabase
      .from('posts')
      .delete()
      .eq('user_id', userId);
    
    if (postsError) throw postsError;

    // Delete user's comments
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('user_id', userId);
    
    if (commentsError) throw commentsError;

    // Delete user's likes
    const { error: likesError } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId);
    
    if (likesError) throw likesError;

    // Delete user's followers relationships
    const { error: followersError } = await supabase
      .from('followers')
      .delete()
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`);
    
    if (followersError) throw followersError;

    // Delete user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) throw profileError;

    // Delete the user's auth account
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) throw authError;

    return { error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { error };
  }
};

export const exportUserData = async (userId: string) => {
  try {
    // Get user profile for name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;

    // Get user's posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (postsError) throw postsError;

    // Calculate stats
    const totalHours = posts?.reduce((sum, post) => sum + (post.hours || 0), 0) || 0;
    const totalEvents = posts?.length || 0;
    const categoryHours = posts?.reduce((acc, post) => {
      const category = post.category;
      acc[category] = (acc[category] || 0) + (post.hours || 0);
      return acc;
    }, {} as Record<string, number>) || {};

    // Format the data nicely
    const userData = {
      title: "Voluntr Activity Report",
      user: {
        name: profile?.full_name,
        username: profile?.username,
      },
      stats: {
        totalHours,
        totalEvents,
        categoryBreakdown: Object.entries(categoryHours).map(([category, hours]) => {
          const categoryInfo = TOP_CATEGORIES.find(cat => cat.id === category);
          return {
            category: categoryInfo?.label || category,
            hours,
            percentage: Math.round((hours / totalHours) * 100)
          };
        })
      },
      activities: posts?.map(post => {
        const categoryInfo = TOP_CATEGORIES.find(cat => cat.id === post.category);
        return {
          date: new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          title: post.title,
          category: categoryInfo?.label || post.category,
          hours: post.hours,
          description: post.content
        };
      }) || [],
      exportDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    return { data: userData, error: null };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { data: null, error };
  }
};

export const checkAndUpdateBadges = async (userId: string) => {
  try {
    console.log('Checking badges for user:', userId);
    
    // Get user's posts and stats
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId);

    if (postsError) throw postsError;
    console.log('Found posts:', posts?.length);

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    console.log('Current profile:', profile);

    // Calculate stats
    const totalHours = posts?.reduce((sum, post) => sum + (Number(post.hours) || 0), 0) || 0;
    const totalEvents = posts?.length || 0;
    const categoryCounts = posts?.reduce((acc, post) => {
      const category = post.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    console.log('Stats:', { totalHours, totalEvents, categoryCounts });

    // Check which badges should be earned
    const earnedBadges: string[] = [];

    // First Timer
    if (totalEvents > 0) {
      earnedBadges.push('first-timer');
    }

    // Category-based badges
    Object.entries(categoryCounts).forEach(([category, count]) => {
      if (count >= 5) {
        switch (category) {
          case 'Environment':
            earnedBadges.push('environment-hero');
            break;
          case 'Community':
            earnedBadges.push('community-builder');
            break;
          case 'Care & Relief':
            earnedBadges.push('relief-responder');
            break;
          case 'Youth & Education':
            earnedBadges.push('youth-mentor');
            break;
          case 'Health & Animals':
            earnedBadges.push('animal-advocate');
            break;
          case 'Faith-Based':
            earnedBadges.push('faithful-volunteer');
            break;
        }
      }
    });

    // Hours-based badges
    if (totalHours >= 25) {
      earnedBadges.push('25-hours');
    }
    if (totalHours >= 100) {
      earnedBadges.push('100-hours');
    }

    // Storyteller badge
    if (posts?.length >= 5) {
      earnedBadges.push('storyteller');
    }

    // Community Star badge
    if (totalEvents >= 10) {
      earnedBadges.push('community-star');
    }

    console.log('Earned badges:', earnedBadges);

    // Update profile with earned badges
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        earned_badges: earnedBadges,
        total_hours: totalHours,
        total_events: totalEvents,
        category_breakdown: categoryCounts
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating badges:', updateError);
      throw updateError;
    }

    console.log('Successfully updated badges');
    return { earnedBadges, totalHours, totalEvents };
  } catch (error) {
    console.error('Error checking badges:', error);
    throw error;
  }
};