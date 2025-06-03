import { Event } from './event';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  EventDetail: { event: Event };
  Home: undefined;
  FindEvents: undefined;
  MyEvents: undefined;
  UserProfile: { user: any };
  CreateProfile: undefined;
  IntroVideo: undefined;
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