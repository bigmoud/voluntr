import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SavedEventsProvider } from './src/providers/SavedEventsContext';
import { StatsProvider } from './src/context/StatsContext';
import { ProfileProvider, useProfile } from './src/context/ProfileContext';
import { PostsProvider } from './src/context/PostsContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const AppContent = () => {
  const { profile } = useProfile();
  const { user } = useAuth();
  
  return (
    <PostsProvider profile={profile}>
      <SavedEventsProvider>
        <AppNavigator />
      </SavedEventsProvider>
    </PostsProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatsProvider>
            <ProfileProvider>
              <AppContent />
            </ProfileProvider>
          </StatsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}