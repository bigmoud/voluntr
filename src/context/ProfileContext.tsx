import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getProfile, updateProfile, followUser, unfollowUser, getFollowers, getFollowing } from '../lib/supabase';

export type Profile = {
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
      const { data, error } = await getProfile(user.id);
      if (error) throw error;
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
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
    if (!user || !profile) return;

    try {
      const { error } = await followUser(user.id, userId);
      if (error) throw error;
      // Optionally refresh followers/following lists
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    if (!user || !profile) return;

    try {
      const { error } = await unfollowUser(user.id, userId);
      if (error) throw error;
      // Optionally refresh followers/following lists
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  };

  const handleGetFollowers = async (userId: string): Promise<Profile[]> => {
    try {
      const { data, error } = await getFollowers(userId);
      if (error) throw error;
      if (!data) return [];
      
      return data.map(item => item.follower as unknown as Profile);
    } catch (error) {
      console.error('Error getting followers:', error);
      throw error;
    }
  };

  const handleGetFollowing = async (userId: string): Promise<Profile[]> => {
    try {
      const { data, error } = await getFollowing(userId);
      if (error) throw error;
      if (!data) return [];
      
      return data.map(item => item.following as unknown as Profile);
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