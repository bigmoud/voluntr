import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { useProfile } from '../context/ProfileContext';
import type { Profile } from '../context/ProfileContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';

type RouteParams = {
  userId: string;
  type: 'followers' | 'following';
};

type FollowersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Followers'>;

export const FollowersScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Followers'>>();
  const navigation = useNavigation<FollowersScreenNavigationProp>();
  const { getFollowers, getFollowing, followUser, unfollowUser } = useProfile();
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, type } = route.params;

  useEffect(() => {
    loadUsers();
  }, [userId, type]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const users = type === 'followers' 
        ? await getFollowers(userId)
        : await getFollowing(userId);
      setUsers(users || []);
    } catch (error) {
      console.error('Error in loadUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (profileId: string) => {
    try {
      await followUser(profileId);
      loadUsers();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const renderUser = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { user: item })}
    >
      <Image
        source={{ uri: item.profile_picture || DEFAULT_AVATAR }}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullName}>{item.full_name}</Text>
      </View>
      {type === 'followers' && item.id !== user?.id && !item.following && (
        <TouchableOpacity
          style={styles.followButton}
          onPress={() => handleFollow(item.id)}
        >
          <Text style={styles.followButtonText}>Follow Back</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#166a5d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{type === 'followers' ? 'Followers' : 'Following'}</Text>
        <View style={{ width: 32 }} />
      </View>
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 90 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No {type === 'followers' ? 'followers' : 'following'} yet
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f9ec',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingTop: 48,
    paddingBottom: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 48,
    padding: 8,
    zIndex: 11,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#166a5d',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#166a5d',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166a5d',
  },
  fullName: {
    fontSize: 14,
    color: '#388E6C',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#166a5d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#666',
  },
}); 