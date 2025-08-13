import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import type { Profile } from '../context/ProfileContext';
import { TOP_CATEGORIES } from '../constants/categories';

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);

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
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'voluntr://reset-password',
  });
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
  // Create a new object with the correct types
  const profileUpdate = {
    id: userId,
    ...updates,
    preferred_categories: updates.preferred_categories || null
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert([profileUpdate])
    .select()
    .single();

  return { data, error };
};

// Followers helper functions
export const followUser = async (followerId: string, followingId: string) => {
  try {
    // First check if the relationship already exists
    const { data: existing, error: checkError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError;
    }

    if (existing) {
      return { data: existing, error: null };
    }

    // Insert the new follow relationship
  const { data, error } = await supabase
    .from('followers')
    .insert([{ follower_id: followerId, following_id: followingId }])
    .select()
    .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  try {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
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
  location?: string;
  created_at?: string;
  updated_at?: string;
  earned_badges?: string[];
  total_hours?: number;
  total_events?: number;
  category_breakdown?: Record<string, number>;
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
          bio,
          location,
          earned_badges,
          total_hours,
          total_events,
          category_breakdown
        )
      `)
      .eq('follower_id', userId)
      .returns<FollowingJoin[]>();

    if (error) throw error;
    if (!data?.length) return [];

    // Map the joined data to Profile type
    const profiles = data.map(item => {
      const p = item.profiles;
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        username: p.username,
        profile_picture: p.profile_picture,
        bio: p.bio,
        location: p.location || '',
        created_at: p.created_at || '',
        updated_at: p.updated_at || '',
        following: [],
        followers: [],
        following_count: 0,
        followers_count: 0,
        earned_badges: p.earned_badges || [],
        total_hours: p.total_hours || 0,
        total_events: p.total_events || 0,
        category_breakdown: p.category_breakdown || {},
      };
    });
    return profiles;
  } catch (error) {
    return [];
  }
};

export const getFollowers = async (userId: string): Promise<Profile[]> => {
  try {
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
          bio,
          location,
          earned_badges,
          total_hours,
          total_events,
          category_breakdown
        )
      `)
      .eq('following_id', userId)
      .returns<FollowerJoin[]>();

    if (error) throw error;
    if (!data?.length) return [];

    // Map the joined data to Profile type
    const profiles = data.map(item => {
      const p = item.profiles;
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        username: p.username,
        profile_picture: p.profile_picture,
        bio: p.bio,
        location: p.location || '',
        created_at: p.created_at || '',
        updated_at: p.updated_at || '',
        following: [],
        followers: [],
        following_count: 0,
        followers_count: 0,
        earned_badges: p.earned_badges || [],
        total_hours: p.total_hours || 0,
        total_events: p.total_events || 0,
        category_breakdown: p.category_breakdown || {},
      };
    });
    return profiles;
  } catch (error) {
    return [];
  }
};

// Upload an image to Supabase Storage and return the public URL
export const uploadProfilePicture = async (userId: string, uri: string) => {
  try {
    // Get the file extension
    const ext = uri.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${ext}`;
    
    // Fetch the image as a blob
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Convert to blob with explicit type
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Blob size is 0, image data is empty');
    }

    // Convert blob to base64
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

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, decode(base64Data), {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      });
      
    if (error) {
      throw error;
    }

    // Wait a moment for the upload to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify the upload by getting a signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('profile-pictures')
      .createSignedUrl(fileName, 60); // URL valid for 60 seconds
      
    if (signedUrlError) {
      throw signedUrlError;
    }

    if (!signedUrlData?.signedUrl) {
      throw new Error('Failed to get signed URL for verification');
    }

    // Try to fetch the file using the signed URL
    const verifyResponse = await fetch(signedUrlData.signedUrl);
    if (!verifyResponse.ok) {
      throw new Error(`File verification failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
    }

    const verifyBlob = await verifyResponse.blob();

    if (verifyBlob.size === 0) {
      throw new Error('Verified file is empty');
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  } catch (error) {
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
            hours: Number(hours) || 0,
            percentage: Math.round((Number(hours) / (totalHours || 1)) * 100)
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
    return { data: null, error };
  }
};

// Add type for saved events
interface SavedEvent {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

// Add type for post
interface Post {
  id: string;
  user_id: string;
  category: string;
  hours: number;
  created_at: string;
}

// Add type for profile update
interface ProfileUpdate {
  earned_badges: string[];
  total_hours: number;
  total_events: number;
  category_breakdown: Record<string, number>;
}

// Event helper functions
export const createEvent = async (eventData: {
  title: string;
  description: string;
  category: string;
  date: string;
  time_start: string;
  time_end: string;
  location_address: string;
  location_latitude?: number;
  location_longitude?: number;
  external_url?: string;
  organization_name?: string;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('events')
    .insert([{
      ...eventData,
      created_by: user.id,
      status: 'active'
    }])
    .select()
    .single();

  return { data, error };
};

export const getEvents = async (filters?: {
  categories?: string[];
  dateRange?: 'week' | 'month' | 'all';
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
  location?: {
    zipCode?: string;
    region?: string;
    city?: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}) => {
  let query = supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  // Only show active events by default, unless includeExpired is true
  if (!filters?.includeExpired) {
    query = query.eq('status', 'active');
  }

  if (filters?.categories && filters.categories.length > 0) {
    query = query.in('category', filters.categories);
  }

  // Location filtering
  if (filters?.location) {
    const { location } = filters;
    console.log('🔍 Applying location filters:', location);
    
    // Filter by zip code (assuming zip code is part of the address)
    if (location.zipCode) {
      console.log('🔍 Filtering by zip code:', location.zipCode);
      query = query.ilike('location_address', `%${location.zipCode}%`);
    }
    
    // Filter by city
    if (location.city) {
      console.log('🔍 Filtering by city:', location.city);
      query = query.ilike('location_address', `%${location.city}%`);
    }
    
    // Filter by state
    if (location.state) {
      console.log('🔍 Filtering by state:', location.state);
      query = query.ilike('location_address', `%${location.state}%`);
    }
    
    // Filter by region (broader area)
    if (location.region) {
      console.log('🔍 Filtering by region:', location.region);
      query = query.ilike('location_address', `%${location.region}%`);
    }
    
    // Filter by coordinates and radius (if coordinates provided)
    if (location.coordinates) {
      console.log('🔍 Filtering by coordinates with radius');
      const { latitude, longitude } = location.coordinates;
      const radius = 50; // 50 miles radius
      const latDelta = radius / 69; // roughly 69 miles per degree latitude
      const lngDelta = radius / (69 * Math.cos(latitude * Math.PI / 180));
      
      console.log('🔍 Bounding box:', {
        latMin: latitude - latDelta,
        latMax: latitude + latDelta,
        lngMin: longitude - lngDelta,
        lngMax: longitude + lngDelta
      });
      
      query = query
        .gte('location_latitude', latitude - latDelta)
        .lte('location_latitude', latitude + latDelta)
        .gte('location_longitude', longitude - lngDelta)
        .lte('location_longitude', longitude + lngDelta);
    }
  }

  if (filters?.dateRange && !filters?.includeExpired) {
    const now = new Date();
    let startDate: Date;

    switch (filters.dateRange) {
      case 'week':
        startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      default:
        startDate = now;
    }

    query = query.gte('date', now.toISOString().split('T')[0]);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  console.log('📋 Query results:', data?.length || 0, 'events found');
  if (data && data.length > 0) {
    console.log('📋 Sample event:', data[0].title, '-', data[0].location_address);
  }
  return { data, error };
};

export const getEventById = async (eventId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('status', 'active')
    .single();

  return { data, error };
};

export const updateEvent = async (eventId: string, updates: {
  title?: string;
  description?: string;
  category?: string;
  date?: string;
  time_start?: string;
  time_end?: string;
  location_address?: string;
  location_latitude?: number;
  location_longitude?: number;
  external_url?: string;
  organization_name?: string;
  status?: 'active' | 'cancelled' | 'completed' | 'draft';
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .eq('created_by', user.id)
    .select()
    .single();

  return { data, error };
};

export const deleteEvent = async (eventId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('User not authenticated') };
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('created_by', user.id);

  return { error };
};

export const getUserEvents = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !userId) {
    return { data: null, error: new Error('User not authenticated') };
  }

  const targetUserId = userId || user!.id;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', targetUserId)
    .order('created_at', { ascending: false });

  return { data, error };
};

export const searchEvents = async (searchTerm: string, filters?: {
  categories?: string[];
  dateRange?: 'week' | 'month' | 'all';
}) => {
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,organization_name.ilike.%${searchTerm}%`)
    .order('date', { ascending: true });

  if (filters?.categories && filters.categories.length > 0) {
    query = query.in('category', filters.categories);
  }

  if (filters?.dateRange) {
    const now = new Date();
    let startDate: Date;

    switch (filters.dateRange) {
      case 'week':
        startDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      default:
        startDate = now;
    }

    query = query.gte('date', now.toISOString().split('T')[0]);
  }

  const { data, error } = await query;
  return { data, error };
};

export const getEventsByLocation = async (latitude: number, longitude: number, radiusKm: number = 50) => {
  // Simple distance calculation (you might want to use PostGIS for more accurate results)
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .not('location_latitude', 'is', null)
    .not('location_longitude', 'is', null)
    .order('date', { ascending: true });

  if (error) return { data: null, error };

  // Filter by distance (simple calculation)
  const filteredEvents = data?.filter(event => {
    if (!event.location_latitude || !event.location_longitude) return false;
    
    const distance = calculateDistance(
      latitude,
      longitude,
      event.location_latitude,
      event.location_longitude
    );
    
    return distance <= radiusKm;
  });

  return { data: filteredEvents, error: null };
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Event expiration helper functions
export const updateExpiredEvents = async () => {
  try {
    const { data, error } = await supabase.rpc('update_expired_events');
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const cleanupExpiredEvents = async (daysToKeep: number = 30) => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_events', { days_to_keep: daysToKeep });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getExpiredEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .lt('date', new Date().toISOString().split('T')[0])
      .eq('status', 'active')
      .order('date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getCompletedEvents = async (limit?: number) => {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('status', 'completed')
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const checkAndUpdateBadges = async (userId: string) => {
  try {
    // Get user's posts and stats
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId);

    if (postsError) throw postsError;

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get user's saved events
    const { data: savedEventsRaw, error: savedEventsError } = await supabase
      .from('saved_events')
      .select('*')
      .eq('user_id', userId);

    if (savedEventsError) throw savedEventsError;
    const savedEvents = savedEventsRaw ?? [];

    // Calculate stats
    const totalHours = (posts as Post[] | null)?.reduce((sum, post) => sum + (Number(post.hours) || 0), 0) || 0;
    const totalEvents = posts?.length || 0;
    const categoryCounts = (posts as Post[] | null)?.reduce((acc, post) => {
      const category = post.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

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

    // Super Saver badge
    if ((savedEvents as SavedEvent[]).length >= 10) {
      earnedBadges.push('super-saver');
    }

    // Update profile with earned badges
    const updateData: ProfileUpdate = {
      earned_badges: earnedBadges,
      total_hours: totalHours,
      total_events: totalEvents,
      category_breakdown: categoryCounts
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData as unknown as Partial<Profile>)
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    return { earnedBadges, totalHours, totalEvents };
  } catch (error) {
    throw error;
  }
};