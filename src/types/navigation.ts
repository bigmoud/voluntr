import { Event } from './event';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User } from './user';
import type { Profile } from '../context/ProfileContext';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  Profile: undefined;
  UserProfile: { user: Profile };
  EditProfile: undefined;
  Followers: { userId: string; type: 'followers' | 'following' };
  Notifications: undefined;
  Settings: undefined;
  EventDetails: { eventId: string };
  CreateEvent: undefined;
  EditEvent: { eventId: string };
  EventList: undefined;
  CategoryEvents: { category: string };
  Search: undefined;
  Map: undefined;
  Chat: { userId: string };
  ChatList: undefined;
  UserPosts: {
    userId: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Discover: undefined;
  'My Events': undefined;
  Profile: { user?: any };
  EventDetail: { event: Event };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type EventDetailScreenProps = {
  route: {
    params: {
      event: Event;
    };
  };
  navigation: NativeStackNavigationProp<RootStackParamList, 'EventDetail'>;
}; 