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
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

export default function RegisterScreen({
  navigation,
}: any) {
  const [name, setName] =
    useState('');
  const [email, setEmail] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');
  const [bloodGroup, setBloodGroup] =
    useState('');
  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    showBloodGroupPicker,
    setShowBloodGroupPicker,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [isBloodDonor, setIsBloodDonor] =
    useState(false);

  const handleRegister = async () => {
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !bloodGroup
    ) {
      Alert.alert(
        'Error',
        'Please fill in all fields'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Error',
        'Passwords do not match'
      );
      return;
    }

    setLoading(true);

    try {
      await axios.post(
        `${API_BASE_URL}/auth/register`,
        {
          fullName: name,
          email,
          password,
          bloodGroup,
        }
      );

      Alert.alert(
        'Success',
        'Account created successfully'
      );

      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>
            HelpHub
          </Text>

          <Text
            style={styles.welcomeText}
          >
            Create Account
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {/* Left Accent Border */}
          <View
            style={styles.leftBorder}
          />

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <View
              style={styles.inputContainer}
            >
              <MaterialCommunityIcons
                name="account"
                size={20}
                color="#ffb4aa"
                style={styles.icon}
              />

              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Email Address
            </Text>

            <View
              style={styles.inputContainer}
            >
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

            <View
              style={styles.inputContainer}
            >
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
                secureTextEntry={
                  !showPassword
                }
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
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

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Confirm Password
            </Text>

            <View
              style={styles.inputContainer}
            >
              <MaterialCommunityIcons
                name="lock-check"
                size={20}
                color="#ffb4aa"
                style={styles.icon}
              />

              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry={
                  !showConfirmPassword
                }
                value={confirmPassword}
                onChangeText={
                  setConfirmPassword
                }
                editable={!loading}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                <MaterialCommunityIcons
                  name={
                    showConfirmPassword
                      ? 'eye'
                      : 'eye-off'
                  }
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Blood Group */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>
              Blood Group
            </Text>

            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() =>
                setShowBloodGroupPicker(
                  true
                )
              }
            >
              <MaterialCommunityIcons
                name="blood-bag"
                size={20}
                color="#ffb4aa"
                style={styles.icon}
              />

              <Text
                style={[
                  styles.input,
                  {
                    color: bloodGroup
                      ? '#ffffff'
                      : '#6b7280',
                  },
                ]}
              >
                {bloodGroup ||
                  'Select Blood Group'}
              </Text>

              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Blood Donor Checkbox */}
          <TouchableOpacity
            style={styles.donorCheckbox}
            onPress={() => setIsBloodDonor(!isBloodDonor)}
          >
            <View
              style={[
                styles.checkbox,
                isBloodDonor && styles.checkboxChecked,
              ]}
            >
              {isBloodDonor && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color="#ffffff"
                />
              )}
            </View>
            <Text style={styles.donorCheckboxText}>
              I want to be a blood donor
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              loading &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
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
                    styles.registerButtonText
                  }
                >
                  Create Account
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

        {/* Login */}
        <View
          style={styles.loginContainer}
        >
          <Text style={styles.loginText}>
            Already have an account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'Login'
              )
            }
          >
            <Text
              style={styles.loginLink}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={showBloodGroupPicker}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setShowBloodGroupPicker(false)
        }
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View
              style={styles.modalHeader}
            >
              <Text
                style={styles.modalTitle}
              >
                Select Blood Group
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowBloodGroupPicker(
                    false
                  )
                }
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            <FlatList
              data={BLOOD_GROUPS}
              keyExtractor={(item) =>
                item
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bloodGroupOption,
                    bloodGroup === item &&
                      styles.bloodGroupOptionSelected,
                  ]}
                  onPress={() => {
                    setBloodGroup(item);
                    setShowBloodGroupPicker(
                      false
                    );
                  }}
                >
                  <Text
                    style={[
                      styles.bloodGroupOptionText,
                      bloodGroup === item &&
                        styles.bloodGroupOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
  },

  logo: {
    fontSize: 40,
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
      'rgba(30, 32, 36, 0.6)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.1)',
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
    marginBottom: 20,
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
      'rgba(30, 32, 36, 0.8)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
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

  registerButton: {
    backgroundColor: '#ff8c42',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  registerButtonDisabled: {
    opacity: 0.7,
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  registerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },

  loginText: {
    color: '#9ca3af',
    fontSize: 14,
  },

  loginLink: {
    color: '#ffb4aa',
    fontSize: 14,
    fontWeight: '700',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor:
      'rgba(0,0,0,0.7)',
  },

  modalContent: {
    backgroundColor: '#1e2024',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: '70%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  bloodGroupOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor:
      'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.1)',
  },

  bloodGroupOptionSelected: {
    backgroundColor: '#ff8c42',
    borderColor: '#ff8c42',
  },

  bloodGroupOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },

  bloodGroupOptionTextSelected: {
    color: '#1f2937',
  },
  donorCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 180, 170, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ff8c42',
    borderColor: '#ff8c42',
  },
  donorCheckboxText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});