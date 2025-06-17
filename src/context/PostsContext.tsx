import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, checkAndUpdateBadges } from '../lib/supabase';
import { useProfile, Profile } from './ProfileContext';
import { useAuth } from './AuthContext';
import { useStats } from './StatsContext';
import { Alert } from 'react-native';

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

export type PostsContextType = {
  posts: Post[];
  loading: boolean;
  fetchPosts: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<Post>;
  editPost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getUserPosts: (userId: string) => Promise<Post[]>;
  refreshPosts: () => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
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
        // First get the list of users being followed
        const { data: followingData, error: followingError } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user?.id);

        if (followingError) {
          throw followingError;
        }

        // Get IDs of users being followed
        const followedUserIds = followingData?.map(f => f.following_id) || [];
        // Include current user's ID
        const userIdsToFetch = [...followedUserIds, user?.id].filter(Boolean);

        // Fetch posts from Supabase for followed users and current user
        const { data: supabasePosts, error: supabaseError } = await supabase
          .from('posts')
          .select('*')
          .in('user_id', userIdsToFetch)
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
          
          // Only sync stats with current user's posts
          const currentUserPosts = transformedPosts.filter((post: Post) => post.userId === user?.id);
          syncStatsWithPosts(currentUserPosts);
        }
      } catch (error) {
        // Fallback to AsyncStorage if Supabase fetch fails
        try {
          const savedPosts = await AsyncStorage.getItem(POSTS_KEY);
          if (savedPosts) {
            const parsedPosts = JSON.parse(savedPosts);
            setPosts(parsedPosts);
            // Only sync stats with current user's posts
            const currentUserPosts = parsedPosts.filter((post: Post) => post.userId === user?.id);
            syncStatsWithPosts(currentUserPosts);
          }
        } catch (storageError) {
          console.error('Error loading posts from AsyncStorage:', storageError);
        }
      }
    };
    loadPosts();
  }, [user?.id]); // Reload when user ID changes

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
      return;
    }

    try {
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_hours, total_events')
        .eq('id', profile.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const newTotalHours = (currentProfile?.total_hours || 0) + hours;
      const newTotalEvents = (currentProfile?.total_events || 0) + 1;

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
        throw updateError;
      }

      // Update local profile state
      const updatedProfile = {
        ...profile,
        total_hours: newTotalHours,
        total_events: newTotalEvents
      };

      await updateProfile(updatedProfile);

      // Update StatsContext if provided
      if (updateStats) {
        updateStats(hours, category);
      }

    } catch (error) {
      // Don't throw the error, just log it
      // This way the post creation can still succeed even if stats update fails
    }
  };

  const addPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    try {
      const newPost: Post = {
        ...post,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
      };

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
        throw supabaseError;
      }

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

          // Check and update badges after post creation
          await checkAndUpdateBadges(profile.id);
          console.log('Successfully checked and updated badges');
        } catch (profileError) {
          console.error('Error updating user profile:', profileError);
          // Don't throw here, as the post was successfully created
        }
      }

      return newPost;
    } catch (error) {
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
        throw error;
      }

      // Update local state
      const updatedPosts = posts.map(post =>
        post.id === id ? { ...post, ...updates } : post
      );
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const updatedPosts = posts.filter(post => post.id !== id);
      setPosts(updatedPosts);
      await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(updatedPosts));
    } catch (error) {
      throw error;
    }
  };

  const getUserPosts = async (userId: string): Promise<Post[]> => {
    try {
      const { data: supabasePosts, error: supabaseError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      if (supabasePosts) {
        // Transform Supabase posts to match our Post type
        return supabasePosts.map(post => ({
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
      }
      return [];
    } catch (error) {
      return [];
    }
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

  const likePost = async (postId: string) => {
    if (!user?.id) return;
    try {
      // Get the current post
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Check if already liked
      if (post.likes.includes(user.id)) {
        return;
      }

      // Optimistically update local state
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, likes: [...p.likes, user.id] }
            : p
        )
      );

      // Update in Supabase
      const { error } = await supabase
        .from('posts')
        .update({
          likes: [...post.likes, user.id]
        })
        .eq('id', postId);

      if (error) {
        // Revert optimistic update on error
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, likes: p.likes.filter(id => id !== user.id) }
              : p
          )
        );
        throw error;
      }

      // Create notification for post owner (if not liking own post)
      if (user.id !== post.userId) {
        try {
          await supabase.from('notifications').insert([
            {
              user_id: post.userId,
              from_user_id: user.id,
              type: 'like',
              post_id: postId,
              read: false,
            },
          ]);
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError);
          // Don't throw here as the like was successful
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post. Please try again.');
      throw error;
    }
  };

  const unlikePost = async (postId: string) => {
    if (!user?.id) return;
    try {
      // Get the current post
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Check if not already liked
      if (!post.likes.includes(user.id)) {
        return;
      }

      // Optimistically update local state
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: p.likes.filter(id => id !== user.id),
            };
          }
          return p;
        })
      );

      // Update in Supabase
      const { error } = await supabase
        .from('posts')
        .update({
          likes: post.likes.filter(id => id !== user.id)
        })
        .eq('id', postId);

      if (error) {
        // Revert optimistic update on error
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, likes: [...p.likes, user.id] }
              : p
          )
        );
        throw error;
      }
    } catch (error) {
      console.error('Error unliking post:', error);
      Alert.alert('Error', 'Failed to unlike post. Please try again.');
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

      // Optimistically update local state
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { ...p, comments: [...p.comments, newComment] }
            : p
        )
      );

      // Update in Supabase
      const { error } = await supabase
        .from('posts')
        .update({
          comments: [...post.comments, newComment]
        })
        .eq('id', postId);

      if (error) {
        // Revert optimistic update on error
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === postId 
              ? { ...p, comments: p.comments.filter(c => c.id !== newComment.id) }
              : p
          )
        );
        throw error;
      }

      // Create notification for post owner (if not commenting on own post)
      if (comment.userId !== post.userId) {
        try {
          await supabase.from('notifications').insert([
            {
              user_id: post.userId,
              from_user_id: comment.userId,
              type: 'comment',
              post_id: postId,
              read: false
            }
          ]);
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError);
          // Don't throw here as the comment was successful
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
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
      throw error;
    }
  };

  const value: PostsContextType = {
    posts,
    loading: false,
    fetchPosts: refreshPosts,
    addPost,
    editPost,
    deletePost,
    getUserPosts,
    refreshPosts,
    likePost,
    unlikePost,
    addComment,
    deleteComment,
  };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts must be used within a PostsProvider');
  return context;
}; 