import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const IntroVideoScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const videoRef = useRef<Video>(null);
  const { profile } = useProfile();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [showControls, setShowControls] = React.useState(false);

  const handleEnd = () => {
    console.log('IntroVideo - handleEnd called');
    console.log('User state:', user ? 'Authenticated' : 'Not authenticated');
    console.log('Profile state:', profile ? 'Profile exists' : 'No profile');
    
    if (!user) {
      console.log('Navigating to Login - User not authenticated');
      navigation.navigate('Login');
    } else if (!profile) {
      console.log('Navigating to CreateProfile - No profile found');
      navigation.navigate('CreateProfile');
    } else {
      console.log('Navigating to MainTabs - User authenticated and has profile');
      navigation.navigate('MainTabs');
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePress = () => {
    setShowControls(!showControls);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handlePress}
        activeOpacity={1}
      >
        <Video
          ref={videoRef}
          source={require('../../assets/intro.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          rate={1.5}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) handleEnd();
          }}
        />
        {showControls && (
          <View style={styles.controls}>
            <TouchableOpacity onPress={togglePlayPause}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={40}
                color="white"
              />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height,
    alignSelf: 'center',
  },
  controls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
}); 