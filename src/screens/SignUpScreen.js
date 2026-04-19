import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { registerShopkeeper } from '../database/db';

export default function SignUpScreen({ navigation, onSignedUp }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Info', 'Sab fields required hain.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password kam az kam 6 characters ka hona chahiye.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Password aur confirm password same nahi hain.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerShopkeeper(name, email, password);
      if (!result.ok) {
        Alert.alert('Sign Up Failed', result.error || 'Registration failed.');
        return;
      }

      onSignedUp(result.user);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Sign up mein masla aya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shopkeeper Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Shopkeeper Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.link}>Already have account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  link: {
    textAlign: 'center',
    color: '#1d4ed8',
    marginTop: 12,
    fontWeight: '600',
  },
});
