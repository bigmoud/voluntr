import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post } from './PostsContext';
import { useAuth } from './AuthContext';

export type Stats = {
  totalHours: number;
  totalEvents: number;
  topCategories: string[];
  categoryHours: Record<string, number>;
  categoryBreakdown: Array<{
    category: string;
    hours: number;
    percentage: number;
  }>;
};

type StatsContextType = {
  stats: Stats;
  updateStats: (hours: number, category: string) => void;
  resetStats: () => void;
  syncStatsWithPosts: (posts: Post[]) => void;
};

const DEFAULT_STATS: Stats = {
  totalHours: 0,
  totalEvents: 0,
  topCategories: [],
  categoryHours: {},
  categoryBreakdown: [],
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const { user } = useAuth();

  // Load stats from AsyncStorage on mount
  useEffect(() => {
    if (user) {
      loadStats();
    } else {
      setStats(DEFAULT_STATS);
      saveStats(DEFAULT_STATS);
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('volunteerStats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveStats = async (newStats: Stats) => {
    try {
      await AsyncStorage.setItem('volunteerStats', JSON.stringify(newStats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const updateStats = (hours: number, category: string) => {
    setStats(prevStats => {
      const newCategoryHours = {
        ...prevStats.categoryHours,
        [category]: (prevStats.categoryHours[category] || 0) + hours,
      };

      // Calculate top categories based on hours
      const topCategories = Object.entries(newCategoryHours)
        .sort(([, a], [, b]) => b - a)
        .map(([cat]) => cat)
        .slice(0, 3);

      // Calculate category breakdown with percentages
      const totalHours = prevStats.totalHours + hours;
      const categoryBreakdown = Object.entries(newCategoryHours).map(([cat, catHours]) => ({
        category: cat,
        hours: catHours,
        percentage: Math.round((catHours / (totalHours || 1)) * 100)
      }));

      const newStats = {
        totalHours,
        totalEvents: prevStats.totalEvents + 1,
        topCategories,
        categoryHours: newCategoryHours,
        categoryBreakdown
      };

      saveStats(newStats);
      return newStats;
    });
  };

  const resetStats = () => {
    setStats(DEFAULT_STATS);
    saveStats(DEFAULT_STATS);
  };

  // Sync stats with all posts
  const syncStatsWithPosts = (posts: Post[]) => {
    // Reset stats before calculating new ones
    let totalHours = 0;
    let totalEvents = 0;
    const categoryHours: { [key: string]: number } = {};
    const categoryEvents: { [key: string]: number } = {};

    posts.forEach(post => {
      const hours = Number(post.hours) || 0;
      totalHours += hours;
      totalEvents += 1;
      const cat = post.category;
      if (cat) {
        categoryHours[cat] = (categoryHours[cat] || 0) + hours;
        categoryEvents[cat] = (categoryEvents[cat] || 0) + 1;
      }
    });

    // Calculate top categories based on hours
    const topCategories = Object.entries(categoryHours)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat)
      .slice(0, 3);

    const newStats = {
      totalHours,
      totalEvents,
      topCategories,
      categoryHours,
      categoryBreakdown: [],
    };

    setStats(newStats);
    saveStats(newStats);
  };

  return (
    <StatsContext.Provider value={{ stats, updateStats, resetStats, syncStatsWithPosts }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}; 