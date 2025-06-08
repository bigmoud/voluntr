import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useProfile, Profile } from './ProfileContext';
import { useAuth } from './AuthContext';
import { useStats } from './StatsContext';

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  content: string;
  createdAt: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  hours: number;
  userEmail: string;
  userName: string;
  userProfilePicture: string;
  userId: string;
  image?: string;
  createdAt: string;
  likes: string[]; // Array of user IDs who liked the post
  comments: Comment[];
};

type PostsContextType = {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<Post>;
  editPost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getUserPosts: (userId: string) => Post[];
  refreshPosts: () => Promise<void>;
  likePost: (postId: string, userId: string) => Promise<void>;
  unlikePost: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
};

const PostsContext = createContext<PostsContextType | undefined>(undefined);

const POSTS_KEY = 'voluntrPosts';

export const PostsProvider: React.FC<{ 
  children: React.ReactNode;
  profile?: Profile | null;
  updateStats?: (hours: number, category: string) => void;
}> = ({ children, profile, updateStats }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const { updateProfile } = useProfile();
  const { user } = useAuth();
  const { syncStatsWithPosts } = useStats();

  // Load posts from AsyncStorage on mount
  useEffect(() => {
    const loadPosts = async () => {
      try {
        // Fetch posts from Supabase for the current user only
        const { data: supabasePosts, error: supabaseError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user?.id)  // Only get posts for current user
          .order('created_at', { ascending: false });

        if (supabaseError) {
          throw supabaseError;
        }

        if (supabasePosts) {
          // Transform Supabase posts to match our Post type
          const transformedPosts: Post[] = supabasePosts.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            hours: post.hours,
            userEmail: post.user_email,
            userName: post.user_name,
            userProfilePicture: post.user_profile_picture,
            userId: post.user_id,
            image: post.image,
            createdAt: post.created_at,
            likes: post.likes || [],
            comments: post.comments || []
          }));

          setPosts(transformedPosts);
          await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(transformedPosts));
          
          // Sync stats with all posts
          syncStatsWithPosts(transformedPosts);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
        // Fallback to AsyncStorage if Supabase fetch fails
        try {
          const savedPosts = await AsyncStorage.getItem(POSTS_KEY);
          if (savedPosts) {
            const parsedPosts = JSON.parse(savedPosts);
            // Filter saved posts by current user
            const userPosts = parsedPosts.filter((post: Post) => post.userId === user?.id);
            setPosts(userPosts);
            syncStatsWithPosts(userPosts);
          }
        } catch (storageError) {
          console.error('Error loading posts from AsyncStorage:', storageError);
        }
      }
    };
    loadPosts();
  }, []);

  const uploadPostImage = async (uri: string, userId: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Failed to create blob from image');
      }

      const fileExt = uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading post image:', error);
      throw error;
    }
  };

  const updateUserStats = async (hours: number, category: string) => {
    if (!profile) {
      console.log('No profile found, skipping stats update');
      return;
    }

    try {
      console.log('Fetching current profile stats for user:', profile.id);
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_hours, total_events')
        .eq('id', profile.id)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        throw fetchError;
      }

      console.log('Current profile stats:', currentProfile);

      const newTotalHours = (currentProfile?.total_hours || 0) + hours;
      const newTotalEvents = (currentProfile?.total_events || 0) + 1;

      console.log('Updating profile with new stats:', {
        total_hours: newTotalHours,
        total_events: newTotalEvents
      });

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          total_hours: newTotalHours,
          total_events: newTotalEvents
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      console.log('Profile updated successfully:', updateData);

      // Update local profile state
      const updatedProfile = {
        ...profile,
        total_hours: newTotalHours,
        total_events: newTotalEvents
      };

      console.log('Updating local profile state:', updatedProfile);
      await updateProfile(updatedProfile);
      console.log('Local profile state updated successfully');

      // Update StatsContext if provided
      if (updateStats) {
        updateStats(hours, category);
      }

    } catch (error) {
      console.error('Error in updateUserStats:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't throw the error, just log it
      // This way the post creation can still succeed even if stats update fails
    }
  };

  const addPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    try {
      console.log('Starting addPost with data:', post);
      
      const newPost: Post = {
        ...post,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
      };

      console.log('Attempting to insert post into Supabase:', newPost);

      // Store in Supabase
      const { data, error: supabaseError } = await supabase
        .from('posts')
        .insert([{
          id: newPost.id,
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          hours: newPost.hours,
          user_email: newPost.userEmail,
          user_name: newPost.userName,
          user_profile_picture: newPost.userProfilePicture,
          user_id: newPost.userId,
          image: newPost.image,
          created_at: newPost.createdAt,
          likes: newPost.likes,
          comments: newPost.comments
        }])
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase error details:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        });
        throw supabaseError;
      }

      console.log('Successfully inserted post into Supabase:', data);

      // Update local state
      const updatedPosts = [...posts, newPost];
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));

      // Update user stats
      if (profile) {
        try {
        const updatedProfile = {
          ...profile,
          total_hours: (profile.total_hours || 0) + (newPost.hours || 0),
          total_events: (profile.total_events || 0) + 1,
        };
        await updateProfile(updatedProfile);
          console.log('Successfully updated user profile');

          // Update StatsContext if provided
          if (updateStats) {
            updateStats(newPost.hours || 0, newPost.category);
            console.log('Successfully updated stats context');
          }
        } catch (profileError) {
          console.error('Error updating user profile:', profileError);
          // Don't throw here, as the post was successfully created
        }
      }

      return newPost;
    } catch (error) {
      console.error('Error adding post:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const editPost = async (id: string, updates: Partial<Post>) => {
    try {
      // Update in Supabase
      const { data, error } = await supabase
        .from('posts')
        .update({
          title: updates.title,
          content: updates.content,
          category: updates.category,
          hours: updates.hours,
          image: updates.image
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating post in Supabase:', error);
        throw error;
      }

      // Update local state
      const updatedPosts = posts.map(post =>
        post.id === id ? { ...post, ...updates } : post
      );
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Error editing post:', error);
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const updatedPosts = posts.filter(post => post.id !== id);
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  const getUserPosts = (userId: string) => {
    return posts.filter(post => post.userId === userId);
  };

  const refreshPosts = async () => {
    try {
      const savedPosts = await AsyncStorage.getItem(POSTS_KEY);
      if (savedPosts) {
        setPosts(JSON.parse(savedPosts));
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  };

  const likePost = async (postId: string, userId: string) => {
    try {
      // Get the current post
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');

      // Update in Supabase
      const { error: supabaseError } = await supabase
        .from('posts')
        .update({
          likes: [...post.likes, userId]
        })
        .eq('id', postId);

      if (supabaseError) throw supabaseError;

      // Update local state
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: [...post.likes, userId],
          };
        }
        return post;
      });
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  };

  const unlikePost = async (postId: string, userId: string) => {
    try {
      // Get the current post
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');

      // Update in Supabase
      const { error: supabaseError } = await supabase
        .from('posts')
        .update({
          likes: post.likes.filter(id => id !== userId)
        })
        .eq('id', postId);

      if (supabaseError) throw supabaseError;

      // Update local state
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            likes: post.likes.filter(id => id !== userId),
          };
        }
        return post;
      });
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  };

  const addComment = async (postId: string, comment: Omit<Comment, 'id' | 'createdAt'>) => {
    try {
      // Get the current post
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');

      const newComment: Comment = {
        ...comment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      // Update in Supabase
      const { error: supabaseError } = await supabase
        .from('posts')
        .update({
          comments: [...post.comments, newComment]
        })
        .eq('id', postId);

      if (supabaseError) throw supabaseError;

      // Update local state
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      });
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const deleteComment = async (postId: string, commentId: string) => {
    try {
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.filter(comment => comment.id !== commentId),
          };
        }
        return post;
      });
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  return (
    <PostsContext.Provider value={{ 
      posts, 
      addPost, 
      editPost, 
      deletePost, 
      getUserPosts, 
      refreshPosts,
      likePost,
      unlikePost,
      addComment,
      deleteComment,
    }}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts must be used within a PostsProvider');
  return context;
}; 