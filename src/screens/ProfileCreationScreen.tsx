import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { getCurrentUser } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function ProfileCreationScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateProfile = async () => {
    setLoading(true);
    const { data: userData, error: userError } = await getCurrentUser();
    if (userError || !userData?.user) {
      Alert.alert('Error', 'No authenticated user found.');
      setLoading(false);
      return;
    }
    const user = userData.user;

    // Check if username is taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();
    if (existing) {
      Alert.alert('Username taken', 'Please choose another username.');
      setLoading(false);
      return;
    }

    // Create profile
    const { error } = await supabase.from('users').insert([
      {
        id: user.id,
        email: user.email,
        username,
        name,
      }
    ]);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Profile created!', 'Your profile has been set up.', [
        { text: 'OK', onPress: () => navigation.replace('Home') }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Username (unique)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
      <Button
        title={loading ? 'Creating...' : 'Create Profile'}
        onPress={handleCreateProfile}
        disabled={loading || !username || !name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16 }
}); 