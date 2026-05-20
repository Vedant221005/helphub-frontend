import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavigation from '../components/BottomNavigation';
import ProfileModal from './ProfileModal';
import { useProfile } from '../context/ProfileContext';
import { useEmergencies } from '../context/EmergenciesContext';
import { API_BASE_URL } from '../constants/api';
import axios from 'axios';
import LiveMap from '../components/LiveMap';
import { useSocket } from '../context/SocketContext';

const formatEmergencyTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const formatActualTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const period = date.getHours() >= 12 ? 'pm' : 'am';
  const displayHours = date.getHours() % 12 || 12;
  return `${displayHours}:${minutes}:${seconds} ${period}`;
};

const getGreetingMessage = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  }

  if (hour >= 17 && hour < 21) {
    return 'Good Evening';
  }

  return 'Welcome Back';
};

export default function HomeScreen({ setIsLoggedIn, navigation }: any) {
  const [userName, setUserName] = React.useState('Vedant');
  const [location] = React.useState('Pune, Maharashtra');
  const [greeting, setGreeting] = React.useState(getGreetingMessage());
  const { showProfile, setShowProfile, userData, setUserData } = useProfile();
  const { totalUnreadCount } = useSocket();
  const { emergencies, notificationCount } = useEmergencies();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const recentEmergenciesYRef = React.useRef(0);
  const [sosActive, setSosActive] = React.useState(false);
  const [sosCountdown, setSosCountdown] = React.useState(0);
  const [userLocation, setUserLocation] = React.useState<any>(null);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [statsData, setStatsData] = React.useState({
    activeEmergencies: 0,
    donorsAvailable: 0,
    volunteersOnline: 0,
  });
  const [donors, setDonors] = React.useState<any[]>([]);
  const [mapLoading, setMapLoading] = React.useState(false);

  React.useEffect(() => {
    loadUserData();
    requestLocationPermission();
  }, []);

  React.useEffect(() => {
    const updateGreeting = () => setGreeting(getGreetingMessage());

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    fetchStatsData();
    const statsInterval = setInterval(fetchStatsData, 5000);
    return () => clearInterval(statsInterval);
  }, [userLocation]);

  React.useEffect(() => {
    if (userLocation) {
      fetchDonorsForMap();
    }
  }, [userLocation]);

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('userData');
      console.log('📦 Stored User Data:', storedUserData);
      if (storedUserData) {
        const user = JSON.parse(storedUserData);
        console.log('👤 Parsed User Object:', user);
        setUserData(user);
        setUserName(user.fullName || 'User');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required"
        );
        return;
      }

      const locationEnabled = await Location.hasServicesEnabledAsync();

      if (!locationEnabled) {
        Alert.alert(
          "Location Disabled",
          "Please enable device location services"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      console.log("Location:", location);

      setUserLocation(location.coords);

      // Update user's location in database
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          await axios.put(
            `${API_BASE_URL}/auth/profile`,
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('✅ Location synced to database');
        }
      } catch (locError) {
        console.warn('⚠️ Failed to sync location:', locError);
      }
    } catch (error) {
      console.log("Location Error:", error);
      Alert.alert("Error", "Unable to fetch location");
    }
  };

  const fetchStatsData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const url = `${API_BASE_URL}/stats`;
      console.log('📊 Fetching stats from:', url);
      console.log('🔑 Token available:', !!token);

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        },
      });

      console.log('📊 Stats response:', response.data);
      if (response.data.success) {
        setStatsData({
          activeEmergencies: response.data.stats?.activeEmergencies ?? emergencies.length,
          donorsAvailable: response.data.stats?.donorsAvailable ?? 0,
          volunteersOnline: response.data.stats?.volunteersOnline ?? 0,
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching stats:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
        console.error('   URL:', error.config?.url);
      }
      setStatsData({
        activeEmergencies: emergencies.length,
        donorsAvailable: 0,
        volunteersOnline: 0,
      });
    }
  };

  const fetchDonorsForMap = async () => {
    try {
      setMapLoading(true);
      const response = await axios.get(`${API_BASE_URL}/donors`, {
        params: {
          latitude: userLocation?.latitude,
          longitude: userLocation?.longitude,
        },
      });

      if (response.data.success) {
        const donorsWithDistance = response.data.donors.map((donor: any) => {
          const distance = calculateDistance(
            userLocation!.latitude,
            userLocation!.longitude,
            donor.latitude,
            donor.longitude
          );
          return {
            ...donor,
            realDistance: distance.toFixed(1),
          };
        });

        setDonors(donorsWithDistance);
      }
    } catch (error: any) {
      console.error('❌ Error fetching donors for map:', error);
    } finally {
      setMapLoading(false);
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSOSPress = () => {
    setSosActive(true);
    setSosCountdown(0);

    const sosInterval = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev >= 5) {
          clearInterval(sosInterval);
          setSosActive(false);
          triggerSOS();
          return prev;
        }
        return prev + 0.1;
      });
    }, 100);
  };

  const handleSOSRelease = () => {
    if (sosCountdown < 5) {
      setSosActive(false);
      setSosCountdown(0);
    }
  };

  const handleEmergencyHelpPress = () => {
    scrollViewRef.current?.scrollTo({
      y: recentEmergenciesYRef.current,
      animated: true,
    });
  };

  const triggerSOS = async () => {
    try {
      console.log('🆘 SOS triggered');
      const token = await AsyncStorage.getItem('userToken');
      console.log('🔑 Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔑 Token length:', token?.length);

      if (!token || !userData) {
        console.error('❌ Not authenticated - Token:', !!token, 'UserData:', !!userData);
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      console.log('📍 Current location:', userLocation);

      if (!userLocation) {
        Alert.alert(
          'Location Unavailable',
          'SOS will be sent without location information. Enable location services for better emergency response.'
        );
      }

      console.log('📤 Sending SOS to API...');
      const sosData = {
        type: 'sos',
        message: `${userData.fullName} is requesting immediate help!`,
        latitude: userLocation?.latitude || null,
        longitude: userLocation?.longitude || null,
      };
      console.log('📦 SOS Payload:', sosData);
      console.log('📋 Authorization header:', `Bearer ${token.substring(0, 20)}...`);

      const response = await axios.post(
        `${API_BASE_URL}/emergencies`,
        sosData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ SOS API Response:', response.data);

      Alert.alert(
        'SOS Sent!',
        'Emergency alert sent to all users. Help is on the way!'
      );
    } catch (error: any) {
      console.error('❌ SOS Error Status:', error.response?.status);
      console.error('❌ SOS Error Data:', error.response?.data);
      console.error('❌ SOS Error Message:', error.message);
      Alert.alert('Error', error.response?.data?.message || error.response?.data?.error || 'Failed to send SOS');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* <TouchableOpacity>
              <MaterialCommunityIcons name="menu" size={28} color="#ffffff" />
            </TouchableOpacity> */}
            <View style={styles.headerTitle}>
              <Text style={styles.greeting}>
                {greeting}, {userName} 👋
              </Text>
              <View style={styles.location}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={12}
                  color="#ff3b30"
                />
                <Text style={styles.locationText}>{location}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={() => setShowNotifications(true)}
            >
              <MaterialCommunityIcons
                name="bell"
                size={24}
                color="#e0e0e0"
              />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{Math.min(notificationCount, 9)}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowProfile(true)}>
              <View style={styles.profileImageContainer}>
                <MaterialCommunityIcons
                  name="account-circle"
                  size={40}
                  color="#ffb4aa"
                />
                <View style={styles.onlineDot} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SOS Card */}
        <View style={styles.sosCard}>
          <View style={styles.sosContent}>
            <Text style={styles.sosTitle}>Need Immediate Help?</Text>
            <Text style={styles.sosSubtitle}>
              Press and hold SOS for 5 seconds
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sosButton,
              sosActive && styles.sosButtonActive,
            ]}
            onPressIn={handleSOSPress}
            onPressOut={handleSOSRelease}
          >
            <MaterialCommunityIcons
              name="phone"
              size={32}
              color="#1f2937"
            />
            <Text style={styles.sosButtonText}>SOS</Text>
            {sosActive && (
              <Text style={styles.sosCountdown}>
                {sosCountdown.toFixed(1)}s
              </Text>
            )}
            <Text style={styles.sosButtonSubtext}>EMERGENCY</Text>
          </TouchableOpacity>
        </View>

        {/* Action Grid */}
        <View style={styles.gridContainer}>
          {/* Blood Donors */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Donors')}
          >
            <View style={styles.cardIconContainer1}>
              <MaterialCommunityIcons name="heart" size={28} color="#ff3b30" />
            </View>
            <Text style={styles.cardTitle}>Blood Donors</Text>
            <Text style={styles.cardSubtitle}>Find nearby donors</Text>
            <View style={styles.cardArrow1}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#ffffff"
              />
            </View>
          </TouchableOpacity>

          {/* Emergency Help */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={handleEmergencyHelpPress}
          >
            <View style={styles.cardIconContainer2}>
              <MaterialCommunityIcons
                name="shield-check"
                size={28}
                color="#6366f1"
              />
            </View>
            <Text style={styles.cardTitle}>Emergency Help</Text>
            <Text style={styles.cardSubtitle}>View active emergencies</Text>
            <View style={styles.cardArrow2}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#ffffff"
              />
            </View>
          </TouchableOpacity>

          {/* Volunteer Help */}
          <TouchableOpacity style={styles.gridCard}>
            <View style={styles.cardIconContainer3}>
              <MaterialCommunityIcons
                name="account-multiple"
                size={28}
                color="#10b981"
              />
            </View>
            <Text style={styles.cardTitle}>Volunteer Help</Text>
            <Text style={styles.cardSubtitle}>Join community activities</Text>
            <View style={styles.cardArrow3}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#ffffff"
              />
            </View>
          </TouchableOpacity>

          {/* Community Chat */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigation.navigate('Chat')}
          >
            <View style={styles.cardIconContainer4}>
              <MaterialCommunityIcons
                name="comment-multiple"
                size={28}
                color="#a855f7"
              />
            </View>
            <Text style={styles.cardTitle}>Community Chat</Text>
            <Text style={styles.cardSubtitle}>Chat with people</Text>
            <View style={styles.cardArrow4}>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#ffffff"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Help Around You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Donors')}>
              <Text style={styles.viewMapLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mapPlaceholder}>
            <LiveMap
              userLocation={userLocation}
              donors={donors}
              emergencies={emergencies}
              isLoading={mapLoading}
              onDonorPress={(donor) => {
                navigation.navigate('Donors', { selectedDonorId: donor.id });
              }}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer1}>
              <MaterialCommunityIcons
                name="clock-alert"
                size={24}
                color="#ff3b30"
              />
            </View>
            <Text style={styles.statNumber}>{statsData.activeEmergencies}</Text>
            <Text style={styles.statLabel}>Active Emergencies</Text>
            <Text style={styles.statSublabel}>Nearby</Text>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statIconContainer2}>
              <MaterialCommunityIcons
                name="heart-multiple"
                size={24}
                color="#10b981"
              />
            </View>
            <Text style={styles.statNumber}>{statsData.donorsAvailable}</Text>
            <Text style={styles.statLabel}>Donors Available</Text>
            <Text style={styles.statSublabel}>Near You</Text>
          </View>
        </View>

        {/* Recent Emergencies */}
        <View
          style={styles.emergencySection}
          onLayout={(event) => {
            recentEmergenciesYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.emergencyHeader}>
            <Text style={styles.emergencyTitle}>Recent Emergencies</Text>
            {emergencies.length > 0 && (
              <TouchableOpacity>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {emergencies.length === 0 ? (
            <View style={styles.noEmergenciesContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={48}
                color="rgba(255,255,255,0.2)"
              />
              <Text style={styles.noEmergenciesText}>No active emergencies</Text>
            </View>
          ) : (
            emergencies.slice(0, 3).map((emergency) => (
              <View key={emergency.id} style={styles.emergencyCard}>
                <View style={styles.emergencyIcon1}>
                  <MaterialCommunityIcons
                    name={emergency.type === 'sos' ? 'account-circle' : 'heart'}
                    size={28}
                    color="#ff3b30"
                  />
                </View>
                <View style={styles.emergencyInfo}>
                  <View style={styles.emergencyTitleRow}>
                    <Text style={styles.emergencyItemTitle}>{emergency.message}</Text>
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  </View>
                  <Text style={styles.emergencyItemSubtitle}>{emergency.userName}</Text>
                  <View style={styles.distanceInfo}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={12}
                      color="#ff3b30"
                    />
                    <Text style={styles.distanceText}>
                      {userLocation && emergency.latitude != null && emergency.longitude != null
                        ? `${calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            emergency.latitude,
                            emergency.longitude
                          ).toFixed(1)} km away`
                        : 'Location unavailable'}
                    </Text>
                  </View>
                </View>
                <View style={styles.emergencyTime}>
                  <Text style={styles.timeText}>
                    {formatActualTime(emergency.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <BottomNavigation
        navigation={navigation}
        activeTab="home"
        onProfilePress={() => setShowProfile(true)}
        unreadMessageCount={totalUnreadCount}
        onSOSPress={handleSOSPress}
      />

      {/* Profile Modal */}
      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        userData={userData}
        onLogout={() => setIsLoggedIn(false)}
      />

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.notificationModalContainer}>
          <View style={styles.notificationModal}>
            {/* Header */}
            <View style={styles.notificationModalHeader}>
              <Text style={styles.notificationModalTitle}>
                Active Emergencies ({emergencies.length})
              </Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#ffffff"
                />
              </TouchableOpacity>
            </View>

            {/* Emergencies List */}
            <FlatList
              data={emergencies}
              keyExtractor={(item) => item.id}
              renderItem={({ item: emergency }) => (
                <View style={styles.notificationItem}>
                  <View style={styles.notificationIconContainer}>
                    <MaterialCommunityIcons
                      name={emergency.type === 'sos' ? 'account-circle' : 'heart'}
                      size={24}
                      color="#ff3b30"
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationUserName}>
                      {emergency.userName}
                    </Text>
                    <Text style={styles.notificationMessage}>
                      {emergency.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatActualTime(emergency.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.notificationAction}>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color="#ff3b30"
                    />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyNotifications}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={48}
                    color="rgba(255,255,255,0.2)"
                  />
                  <Text style={styles.emptyNotificationsText}>
                    No active emergencies
                  </Text>
                </View>
              }
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileImageContainer: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#0F1115',
  },
  sosCard: {
    backgroundColor: 'rgba(120, 0, 0, 0.22)',
    borderRadius: 28,
    padding: 22,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.22)',
  },
  sosContent: {
    flex: 1,
  },
  sosTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  sosSubtitle: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  sosButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  sosButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1f2937',
    marginTop: 2,
  },
  sosButtonSubtext: {
    fontSize: 8,
    fontWeight: '600',
    color: '#1f2937',
  },
  sosButtonActive: {
    backgroundColor: '#ff1744',
    transform: [{ scale: 1.1 }],
  },
  sosCountdown: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: 'rgba(30, 32, 36, 0.75)',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 175,
    marginBottom: 14,
    position: 'relative',
  },
  cardIconContainer1: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer2: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer3: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer4: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  cardArrow1: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArrow2: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArrow3: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardArrow4: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapSection: {
    marginBottom: 20,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewMapLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff3b30',
  },
  mapPlaceholder: {
    backgroundColor: 'rgba(30, 32, 36, 0.75)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 280,
  },
  mapPlaceholderText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 28,
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(30, 32, 36, 0.75)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statIconContainer1: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContainer2: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContainer3: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  statSublabel: {
    fontSize: 12,
    color: '#666666',
  },
  emergencySection: {
    marginBottom: 20,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff3b30',
  },
  noEmergenciesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEmergenciesText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
  emergencyCard: {
    backgroundColor: 'rgba(30, 32, 36, 0.75)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emergencyIcon1: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emergencyIcon2: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  emergencyItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  urgentBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#f97316',
    textTransform: 'uppercase',
  },
  urgentBadge2: {
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText2: {
    fontSize: 7,
    fontWeight: '700',
    color: '#f97316',
    textTransform: 'uppercase',
  },
  emergencyItemSubtitle: {
    fontSize: 11,
    color: '#999999',
    marginBottom: 4,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 10,
    color: '#ff3b30',
    fontWeight: '600',
  },
  emergencyTime: {
    marginLeft: 8,
  },
  timeText: {
    fontSize: 10,
    color: '#666666',
  },
  bottomSpacing: {
    height: 20,
  },
  notificationModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  notificationModal: {
    backgroundColor: '#0F1115',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  notificationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  notificationModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  notificationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 10,
    color: '#666666',
  },
  notificationAction: {
    marginLeft: 8,
  },
  emptyNotifications: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyNotificationsText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },
});
