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

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';

type RouteParams = {
  userId: string;
  type: 'followers' | 'following';
};

type FollowersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Followers'>;

export const FollowersScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Followers'>>();
  const navigation = useNavigation<FollowersScreenNavigationProp>();
  const { getFollowers, getFollowing } = useProfile();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId, type } = route.params;

  useEffect(() => {
    loadUsers();
  }, [userId, type]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users for userId:', userId, 'type:', type);
      const users = type === 'followers' 
        ? await getFollowers(userId)
        : await getFollowing(userId);
      console.log('Users loaded:', JSON.stringify(users, null, 2));
      setUsers(users || []);
    } catch (error) {
      console.error('Error in loadUsers:', error);
    } finally {
      setLoading(false);
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
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22543D',
  },
  fullName: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#666',
  },
}); 