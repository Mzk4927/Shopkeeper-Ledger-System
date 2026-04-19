import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { resetPasswordByEmail } from '../database/db';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Missing Info', 'Email aur dono password fields required hain.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password kam az kam 6 characters ka hona chahiye.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password aur confirm password same nahi hain.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordByEmail(email, newPassword);
      if (!result.ok) {
        Alert.alert('Reset Failed', result.error || 'Password reset nahi hua.');
        return;
      }

      Alert.alert('Password Updated', 'Aapka password successfully update ho gaya.');
      navigation.navigate('SignIn');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Password reset mein masla aya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Registered Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? 'Updating...' : 'Update Password'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.link}>Back to Sign In</Text>
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
    backgroundColor: '#ea580c',
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
