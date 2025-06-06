import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getProfile, updateProfile, followUser, unfollowUser, getFollowers, getFollowing } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  profile_picture?: string;
  bio?: string;
  total_hours: number;
  total_events: number;
  categories: Record<string, number>;
  followers?: string[];
  following?: string[];
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  updated_at?: string;
};

type ProfileContextType = {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  getFollowers: (userId: string) => Promise<Profile[]>;
  getFollowing: (userId: string) => Promise<Profile[]>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      console.log('Loading profile for user:', user.id);
      
      // First, let's check the raw followers data
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select('*')
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

      // Let's also get a separate count of following
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id);

      console.log('Raw followers data:', followersData);
      console.log('Following data:', followingData);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          followers_count:followers!followers_following_id_fkey(count),
          following_count:followers!followers_follower_id_fkey(count)
        `)
        .eq('id', user.id)
        .single();

      console.log('Profile data with counts:', profile);

      if (error) throw error;

      if (profile) {
        // Calculate actual counts from the raw data
        const actualFollowersCount = followersData?.filter(f => f.following_id === user.id).length || 0;
        const actualFollowingCount = followingData?.length || 0;
        
        console.log('Actual counts:', {
          followers: actualFollowersCount,
          following: actualFollowingCount,
          followingDataLength: followingData?.length
        });

        setProfile({
          ...profile,
          total_hours: profile.total_hours || 0,
          total_events: profile.total_events || 0,
          categories: profile.categories || {},
          followers: [],  // Initialize as empty array, will be populated when needed
          following: [],  // Initialize as empty array, will be populated when needed
          followers_count: actualFollowersCount,
          following_count: actualFollowingCount
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await updateProfile(user.id, updates);
      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleFollowUser = async (userId: string) => {
    if (!user || !profile) {
      console.error('Cannot follow user: No user or profile found');
      throw new Error('No user or profile found');
    }

    try {
      console.log('Attempting to follow user:', { followerId: user.id, followingId: userId });
      const { data, error } = await followUser(user.id, userId);
      
      if (error) {
        const err: any = error;
        console.error('Error following user:', {
          error,
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code
        });
        throw error;
      }

      console.log('Successfully followed user:', data);

      // Reload profile data to get updated following list
      await loadProfile();
    } catch (error) {
      console.error('Error in handleFollowUser:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    if (!user || !profile) {
      console.error('Cannot unfollow user: No user or profile found');
      throw new Error('No user or profile found');
    }

    try {
      console.log('Attempting to unfollow user:', { followerId: user.id, followingId: userId });
      const { error } = await unfollowUser(user.id, userId);
      
      if (error) {
        const err: any = error;
        console.error('Error unfollowing user:', {
          error,
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code
        });
        throw error;
      }

      console.log('Successfully unfollowed user');

      // Reload profile data to get updated following list
      await loadProfile();
    } catch (error) {
      console.error('Error in handleUnfollowUser:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const handleGetFollowers = async (userId: string): Promise<Profile[]> => {
    try {
      const followers = await getFollowers(userId);
      return followers;
    } catch (error) {
      console.error('Error getting followers:', error);
      throw error;
    }
  };

  const handleGetFollowing = async (userId: string): Promise<Profile[]> => {
    try {
      const following = await getFollowing(userId);
      return following;
    } catch (error) {
      console.error('Error getting following:', error);
      throw error;
    }
  };

  const value: ProfileContextType = {
    profile,
    loading,
    updateProfile: handleUpdateProfile,
    followUser: handleFollowUser,
    unfollowUser: handleUnfollowUser,
    getFollowers: handleGetFollowers,
    getFollowing: handleGetFollowing,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}; 