import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { APP_CONFIG } from '../constants/api';
import { API_BASE_URL } from '../constants/api';

export default function ProfileModal({ visible, onClose, userData, onLogout }: any) {
  const [user, setUser] = useState(userData);
  const [isBloodDonor, setIsBloodDonor] = useState(userData?.isBloodDonor || false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setUser(userData);
    setIsBloodDonor(userData?.isBloodDonor || false);
  }, [userData]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      onClose();
      onLogout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDonorToggle = async () => {
    try {
      setUpdating(true);
      const token =
        (await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN)) ||
        (await AsyncStorage.getItem('userToken'));

      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        { isBloodDonor: !isBloodDonor },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success !== false) {
        setIsBloodDonor(!isBloodDonor);
        setUser({ ...user, isBloodDonor: !isBloodDonor });

        const message = !isBloodDonor
          ? 'You are now visible in the donors list'
          : 'You have been removed from the donors list';
        Alert.alert('Success', message);
      }
    } catch (error: any) {
      console.error('Error updating donor status:', error);
      Alert.alert('Error', 'Failed to update donor status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons
                name="account-circle"
                size={80}
                color="#ffb4aa"
              />
            </View>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>
          </View>

          {/* Profile Details Card */}
          <View style={styles.detailsCard}>
            {/* Full Name */}
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color="#ffb4aa"
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Full Name</Text>
                <Text style={styles.detailValue}>
                  {user?.fullName || 'Not provided'}
                </Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.divider} />
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color="#ffb4aa"
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue}>{user?.email || 'Not provided'}</Text>
              </View>
            </View>

            {/* Blood Group */}
            <View style={styles.divider} />
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons
                  name="blood-bag"
                  size={20}
                  color="#ffb4aa"
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Blood Group</Text>
                <Text style={styles.detailValue}>
                  {user?.bloodGroup || 'Not provided'}
                </Text>
              </View>
            </View>

          {/* Donor Status */}
          <View style={styles.divider} />
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <MaterialCommunityIcons
                name="heart"
                size={20}
                color="#ff3b30"
              />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Show as Blood Donor</Text>
              <Text style={styles.detailValue}>
                {isBloodDonor ? 'Visible in donors list' : 'Not visible'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleSwitch,
                { backgroundColor: isBloodDonor ? '#34c759' : '#6b7280', alignItems: isBloodDonor ? 'flex-end' : 'flex-start' },
              ]}
              onPress={handleDonorToggle}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.toggleThumb} />
              )}
            </TouchableOpacity>
          </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <MaterialCommunityIcons
                name="pencil"
                size={18}
                color="#ffffff"
              />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <MaterialCommunityIcons
                name="logout"
                size={18}
                color="#ffffff"
              />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#999999',
  },
  detailsCard: {
    backgroundColor: 'rgba(30, 32, 36, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 180, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 32,
  },
  editButton: {
    backgroundColor: '#ff8c42',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff3b30',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
});
