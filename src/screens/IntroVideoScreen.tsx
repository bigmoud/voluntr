import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../context/ProfileContext';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export const IntroVideoScreen = () => {
  const navigation = useNavigation();
  const videoRef = useRef<any>(null);
  const { profile } = useProfile();
  const { user } = useAuth();

  const handleEnd = () => {
    if (profile) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' as never }],
      });
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'CreateProfile' as never }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={require('../../assets/intro.mp4')}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isMuted
          shouldPlay
          isLooping={false}
          rate={1.5}
          onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
            if (status.isLoaded && status.didJustFinish) handleEnd();
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#fff',
  },
  video: {
    width: width,
    height: height,
    alignSelf: 'center',
  },
}); 