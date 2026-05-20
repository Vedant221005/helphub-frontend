import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SplashScreen from './src/screens/SplashScreen';
import DonorsScreen from './src/screens/DonorsScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import { AuthProvider } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { EmergenciesProvider } from './src/context/EmergenciesContext';
import { SocketProvider } from './src/context/SocketContext';
import { APP_CONFIG } from './src/constants/api';

const Stack = createNativeStackNavigator();

function AppNavigator({ isLoggedIn, setIsLoggedIn }: any) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          <Stack.Screen
            name="Home"
            options={{ headerShown: false }}
          >
            {(props) => <HomeScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
          <Stack.Screen
            name="Donors"
            options={{ headerShown: false }}
          >
            {(props) => <DonorsScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
          <Stack.Screen
            name="Chat"
            options={{ headerShown: false }}
            component={ChatListScreen}
          />
          <Stack.Screen
            name="ChatScreen"
            options={{ headerShown: false }}
            component={ChatScreen}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
          </Stack.Screen>
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // Check auth status on app startup
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const token =
          (await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN)) ||
          (await AsyncStorage.getItem('userToken'));
        
        if (token) {
          console.log('✅ User token found, restoring login state');
          setIsLoggedIn(true);
        } else {
          console.log('❌ No user token found, showing login');
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
      }
    };

    restoreAuth();
  }, []);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Show splash screen while auth state is being restored
  if (showSplash || isLoggedIn === null) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <EmergenciesProvider>
        <ProfileProvider>
          <SocketProvider>
            <NavigationContainer>
              <AppNavigator isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
            </NavigationContainer>
          </SocketProvider>
        </ProfileProvider>
      </EmergenciesProvider>
    </AuthProvider>
  );
}
