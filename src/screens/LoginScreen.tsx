import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/api';

export default function LoginScreen({ navigation, setIsLoggedIn }: any) {
  const { setSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email,
          password,
        }
      );

      if (response.data.token) {
        // Store user data
        console.log('🔐 Login Response User:', response.data.user);
        await AsyncStorage.setItem('userToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        await setSession(response.data.user, response.data.token);
        console.log('✅ User data stored to AsyncStorage');

        // Get and update user location
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            console.log('📍 Got user location:', latitude, longitude);

            // Update user profile with location
            await axios.put(
              `${API_BASE_URL}/auth/profile`,
              {
                latitude,
                longitude,
              },
              {
                headers: {
                  Authorization: `Bearer ${response.data.token}`,
                },
              }
            );
            console.log('✅ Location updated in profile');
          }
        } catch (locError) {
          console.warn('⚠️ Failed to update location:', locError);
          // Continue with login even if location update fails
        }

        setIsLoggedIn(true);
        Alert.alert('Success', 'Logged in successfully');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert(
        'Error',
        error.response?.data?.error ||
          error.message ||
          'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            HelpHub
          </Text>

          <Text style={styles.welcomeText}>
            Welcome Back
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Left Accent Border */}
          <View style={styles.leftBorder} />

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Email Address
            </Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="email"
                size={20}
                color="#ffb4aa"
                style={styles.icon}
              />

              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Password
            </Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock"
                size={20}
                color="#ffb4aa"
                style={styles.icon}
              />

              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(!showPassword)
                }
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name={
                    showPassword
                      ? 'eye'
                      : 'eye-off'
                  }
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          {/* <TouchableOpacity
            style={styles.forgotContainer}
          >
            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>
          </TouchableOpacity> */}

          {/* Login Button */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              loading &&
                styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1f2937" />
            ) : (
              <View
                style={styles.buttonContent}
              >
                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  Login
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="#1f2937"
                />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Up */}
        <View
          style={styles.signupContainer}
        >
          <Text style={styles.signupText}>
            Don't have an account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'Register'
              )
            }
            disabled={loading}
          >
            <Text
              style={styles.signupLink}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logo: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffb4aa',
    marginBottom: 8,
  },

  welcomeText: {
    fontSize: 18,
    color: '#9ca3af',
    fontWeight: '500',
  },

  card: {
    backgroundColor:
      'rgba(30, 32, 36, 0.65)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    marginBottom: 20,
    position: 'relative',
  },

  leftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#ff5545',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },

  fieldGroup: {
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(30, 32, 36, 0.9)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 58,
  },

  icon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },

  passwordInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 2,
  },

  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },

  forgotText: {
    color: '#ffb4aa',
    fontSize: 14,
    fontWeight: '600',
  },

  loginButton: {
    backgroundColor: '#ff8c42',
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.08)',
  },

  dividerText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },

  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  socialButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.15)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  socialButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },

  signupText: {
    color: '#9ca3af',
    fontSize: 14,
  },

  signupLink: {
    color: '#ffb4aa',
    fontSize: 14,
    fontWeight: '700',
  },
});