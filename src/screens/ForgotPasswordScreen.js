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
      <View style={styles.bgAccentTop} />
      <View style={styles.bgAccentBottom} />
      <View style={styles.card}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>KH</Text>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.kicker}>Account recovery</Text>
          <Text style={styles.title}>Reset your password</Text>
          <Text style={styles.subtitle}>
            Enter your registered email and choose a new password.
          </Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Registered email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a new password"
            secureTextEntry
            autoComplete="password-new"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? 'Updating...' : 'Update password'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  bgAccentTop: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    top: -70,
    right: -90,
  },
  bgAccentBottom: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    bottom: -60,
    left: -70,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignSelf: 'center',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  headerBlock: {
    marginBottom: 20,
  },
  kicker: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#4f46e5',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
  },
  fieldBlock: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#ea580c',
    borderRadius: 14,
    paddingVertical: 13,
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
    marginTop: 16,
    fontWeight: '600',
  },
});
