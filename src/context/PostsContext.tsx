import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from './StatsContext';
import type { Profile } from './ProfileContext';
import { useAuth } from './AuthContext';

export type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  hours: number;
  timestamp: number;
  userId: string;
  userEmail: string;
  userName: string;
  userProfilePicture: string;
  image?: string;
};

type PostsContextType = {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'timestamp'>) => void;
  editPost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  getUserPosts: (email: string) => Post[];
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

const POSTS_KEY = 'voluntrPosts';

export const PostsProvider: React.FC<{ 
  children: React.ReactNode;
  profile: Profile | null;
}> = ({ children, profile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { syncStatsWithPosts } = useStats();
  const { user } = useAuth();

  useEffect(() => {
    if (user && profile) {
      loadPosts();
    } else {
      setPosts([]);
      savePosts([]);
      syncStatsWithPosts([]);
    }
  }, [user, profile]);

  const loadPosts = async () => {
    try {
      const savedPosts = await AsyncStorage.getItem(POSTS_KEY);
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const savePosts = async (newPosts: Post[]) => {
    try {
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(newPosts));
    } catch (error) {
      console.error('Error saving posts:', error);
    }
  };

  const addPost = (post: Omit<Post, 'id' | 'timestamp'>) => {
    if (!profile) return;
    
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setPosts(prev => {
      const newPosts = [newPost, ...prev];
      savePosts(newPosts);
      syncStatsWithPosts(newPosts);
      return newPosts;
    });
  };

  const editPost = (id: string, updates: Partial<Post>) => {
    setPosts(prev => {
      const newPosts = prev.map(post => 
        post.id === id ? { ...post, ...updates } : post
      );
      savePosts(newPosts);
      syncStatsWithPosts(newPosts);
      return newPosts;
    });
  };

  const deletePost = (id: string) => {
    setPosts(prev => {
      const newPosts = prev.filter(post => post.id !== id);
      savePosts(newPosts);
      syncStatsWithPosts(newPosts);
      return newPosts;
    });
  };

  const getUserPosts = (email: string) => {
    return posts.filter(post => post.userEmail === email);
  };

  return (
    <PostsContext.Provider value={{ posts, addPost, editPost, deletePost, getUserPosts }}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts must be used within a PostsProvider');
  return context;
}; 