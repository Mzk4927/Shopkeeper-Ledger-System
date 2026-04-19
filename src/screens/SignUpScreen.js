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
      <View style={styles.bgAccentTop} />
      <View style={styles.bgAccentBottom} />
      <View style={styles.card}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>KH</Text>
        </View>
        <View style={styles.headerBlock}>
          <Text style={styles.kicker}>Account setup</Text>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Add your name, email, and password to start using the app.
          </Text>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            autoComplete="name"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Email</Text>
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
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            secureTextEntry
            autoComplete="password-new"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? 'Creating...' : 'Create account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
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
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
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
    backgroundColor: '#16a34a',
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
