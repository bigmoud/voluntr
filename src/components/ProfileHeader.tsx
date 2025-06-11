import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export type ProfileHeaderProps = {
  profile: {
    id: string;
    username: string;
    full_name: string;
    profile_picture?: string;
    bio?: string;
    location?: string;
  };
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollowPress?: () => void;
  followersCount?: number;
  followingCount?: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onNotificationsPress?: () => void;
  showNotificationsIcon?: boolean;
  unreadNotifications?: number;
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile,
  isFollowing = false,
  onFollowPress,
  followersCount = 0,
  followingCount = 0,
  onFollowersPress,
  onFollowingPress,
  onNotificationsPress,
  showNotificationsIcon = false,
  unreadNotifications = 0,
}) => {
  return (
    <LinearGradient
      colors={["#e6f9ec", "#b2f2d7", "#4A90E2"]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top row: notification bell */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }} />
        {showNotificationsIcon && (
          <TouchableOpacity onPress={onNotificationsPress} style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={28} color="#166a5d" />
            {unreadNotifications > 0 && (
              <View style={styles.unreadDot} />
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.centeredHeader}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: profile.profile_picture || 'https://randomuser.me/api/portraits/men/1.jpg' }}
            style={styles.profilePicture}
          />
        </View>
        <Text style={styles.username}>{profile.username}</Text>
        <Text style={styles.fullName}>{profile.full_name}</Text>
        {/* Follower/Following counts */}
        <View style={styles.countsRow}>
          <TouchableOpacity onPress={onFollowersPress} style={styles.countItem}>
            <Text style={styles.countNumber}>{followersCount}</Text>
            <Text style={styles.countLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onFollowingPress} style={styles.countItem}>
            <Text style={styles.countNumber}>{followingCount}</Text>
            <Text style={styles.countLabel}>Following</Text>
          </TouchableOpacity>
        </View>
        {profile.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#166a5d" style={{ marginRight: 4 }} />
            <Text style={styles.locationText}>{profile.location}</Text>
          </View>
        ) : null}
        {profile.bio ? (
          <Text style={styles.bio}>{profile.bio}</Text>
        ) : null}
        {!isOwnProfile && onFollowPress && (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={onFollowPress}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    minHeight: 32,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  bellButton: {
    padding: 4,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
    borderWidth: 1,
    borderColor: '#fff',
  },
  centeredHeader: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#fff',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166a5d',
    marginTop: 8,
  },
  fullName: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
    fontWeight: '600',
  },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
    gap: 32,
  },
  countItem: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
  countNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166a5d',
  },
  countLabel: {
    fontSize: 13,
    color: '#666',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    color: '#166a5d',
    fontSize: 14,
  },
  bio: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  followButton: {
    backgroundColor: '#166a5d',
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 12,
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#166a5d',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  followingButtonText: {
    color: '#166a5d',
  },
}); 