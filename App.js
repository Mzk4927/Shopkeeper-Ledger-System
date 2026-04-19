import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from './src/screens/DashboardScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import { getCurrentSessionUser, initDB, signOutShopkeeper } from './src/database/db';

const Stack = createNativeStackNavigator();

LogBox.ignoreLogs([
  'Method writeAsStringAsync imported from "expo-file-system" is deprecated.',
  'Method readAsStringAsync imported from "expo-file-system" is deprecated.',
]);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const bootstrapAuth = async () => {
      await initDB();
      const user = await getCurrentSessionUser();
      setCurrentUser(user);
      setIsLoading(false);
    };

    bootstrapAuth();
  }, []);

  const handleSignedIn = (user) => {
    setCurrentUser(user);
  };

  const handleSignOut = async () => {
    await signOutShopkeeper();
    setCurrentUser(null);
  };

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      {currentUser ? (
        <Stack.Navigator>
          <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
            {(props) => (
              <DashboardScreen
                {...props}
                currentUser={currentUser}
                onLogout={handleSignOut}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SignIn">
            {(props) => <SignInScreen {...props} onSignedIn={handleSignedIn} />}
          </Stack.Screen>
          <Stack.Screen name="SignUp">
            {(props) => <SignUpScreen {...props} onSignedUp={handleSignedIn} />}
          </Stack.Screen>
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

