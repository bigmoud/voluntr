import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { DiscoveryScreen } from '../screens/DiscoveryScreen';
import { MyEventsScreen } from '../screens/MyEventsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FindEventsScreen } from '../screens/FindEventsScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { CreateProfileScreen } from '../screens/CreateProfileScreen';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { IntroVideoScreen } from '../screens/IntroVideoScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { FollowersScreen } from '../screens/FollowersScreen';
import { UserPostsScreen } from '../screens/UserPostsScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Discover') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'My Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        headerBackImage: () => <Ionicons name="arrow-back" size={24} color="#166a5d" />,
        headerBackTitleVisible: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={FindEventsScreen} />
      <Tab.Screen name="Discover" component={DiscoveryScreen} />
      <Tab.Screen name="My Events" component={MyEventsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const linking = {
  prefixes: ['voluntr://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      // ...other routes
    },
  },
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="IntroVideo">
        <Stack.Screen name="IntroVideo" component={IntroVideoScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{ 
            headerShown: true, 
            title: ''
          }}
        />
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Followers"
          component={FollowersScreen}
          options={{
            title: 'Followers',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen name="UserPosts" component={UserPostsScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 