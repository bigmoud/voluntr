import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, Notification } from '../context/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';

const DEFAULT_AVATAR = 'https://randomuser.me/api/portraits/men/1.jpg';

export const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow':
        return 'person-add-outline';
      case 'like':
        return 'heart-outline';
      case 'comment':
        return 'chatbubble-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationText = (notification: Notification) => {
    const fromUser = notification.from_user?.username || 'Someone';
    switch (notification.type) {
      case 'follow':
        return `${fromUser} started following you`;
      case 'like':
        return `${fromUser} liked your post "${notification.post?.title || ''}"`;
      case 'comment':
        return `${fromUser} commented on your post "${notification.post?.title || ''}"`;
      default:
        return 'New notification';
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'follow':
        navigation.navigate('UserProfile', { user: { id: notification.from_user_id } });
        break;
      case 'like':
      case 'comment':
        // Navigate to post details
        break;
    }
  };

  const renderNotification = ({ item: notification }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(notification)}
    >
      <Image
        source={{ uri: notification.from_user?.profile_picture || DEFAULT_AVATAR }}
        style={styles.avatar}
      />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>{getNotificationText(notification)}</Text>
        <Text style={styles.timestamp}>
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(notification.id)}
      >
        <Ionicons name="close-circle-outline" size={24} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22543D',
  },
  markAllRead: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#22543D',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
}); 