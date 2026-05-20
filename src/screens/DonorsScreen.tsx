import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BottomNavigation from '../components/BottomNavigation';
import ProfileModal from './ProfileModal';
import LiveMap from '../components/LiveMap';
import { useProfile } from '../context/ProfileContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../constants/api';

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DISTANCE_OPTIONS = ['Within 5 km', 'Within 10 km', 'Within 25 km', 'Any distance'];

export default function DonorsScreen({ navigation, setIsLoggedIn }: any) {
  const [searchText, setSearchText] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All');
  const [selectedDistance, setSelectedDistance] = useState('Within 5 km');
  const [showDistanceDropdown, setShowDistanceDropdown] = useState(false);
  const [donors, setDonors] = useState<any[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { setShowProfile, showProfile, userData } = useProfile();
  const { totalUnreadCount } = useSocket();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      fetchDonors();
    }
  }, [selectedBloodGroup, currentLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

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
            console.log('✅ Location updated for current user');
          }
        } catch (locError) {
          console.warn('⚠️ Failed to update location:', locError);
        }
      }
    } catch (err) {
      console.error('Error getting location:', err);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
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

  const fetchDonors = async () => {
    try {
      setLoading(true);
      setError('');

      let params: any = {};
      if (selectedBloodGroup !== 'All') {
        params.bloodGroup = selectedBloodGroup;
      }
      if (searchText.trim()) {
        params.search = searchText;
      }

      const response = await axios.get(`${API_BASE_URL}/donors`, { params });

      if (response.data.success) {
        console.log('📍 Raw donor data from API:', response.data.donors);
        let donorsWithDistance = response.data.donors.map((donor: any) => {
          let realDistance = 'N/A';

          if (currentLocation && donor.latitude && donor.longitude) {
            realDistance = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              donor.latitude,
              donor.longitude
            ).toFixed(1);
          }

          return {
            ...donor,
            realDistance,
          };
        });

        console.log('✅ Donors with distance:', donorsWithDistance);
        setDonors(donorsWithDistance);
        setFilteredDonors(donorsWithDistance);
      }
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setError('Failed to load donors');
      Alert.alert('Error', 'Failed to load donors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    filterDonors(text, selectedBloodGroup);
  };

  const handleBloodGroupFilter = (group: string) => {
    setSelectedBloodGroup(group);
  };

  const filterDonors = (search: string, bloodGroup: string) => {
    let filtered = donors;

    if (bloodGroup !== 'All') {
      filtered = filtered.filter((donor) => donor.bloodGroup === bloodGroup);
    }

    if (search.trim()) {
      filtered = filtered.filter((donor) =>
        donor.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredDonors(filtered);
  };

  const getBloodGroupColor = (bloodGroup: string) => {
    const colors: { [key: string]: string } = {
      'O+': '#ff3b30',
      'O-': '#ff3b30',
      'A+': '#ff9500',
      'A-': '#ff9500',
      'B+': '#34c759',
      'B-': '#34c759',
      'AB+': '#6366f1',
      'AB-': '#6366f1',
    };
    return colors[bloodGroup] || '#ff3b30';
  };

  const renderDonorCard = ({ item }: any) => (
    <View style={styles.donorCard}>
      <View style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons
              name="account-circle"
              size={60}
              color="#ffb4aa"
            />
          </View>
          <View
            style={[
              styles.onlineBadge,
              { backgroundColor: item.online ? '#34c759' : '#999999' },
            ]}
          >
            <View style={styles.onlineDot} />
          </View>
          <View
            style={[
              styles.bloodBadge,
              { backgroundColor: getBloodGroupColor(item.bloodGroup) },
            ]}
          >
            <Text style={styles.bloodText}>{item.bloodGroup}</Text>
          </View>
        </View>

        <View style={styles.donorInfo}>
          <Text style={styles.donorName}>{item.name}</Text>
          <View style={styles.distanceRow}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color="#ff3b30"
            />
            <Text style={styles.distance}>{item.realDistance} km away</Text>
          </View>
          {item.latitude && item.longitude && (
            <Text style={styles.coordinates}>
              📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
          )}
          <Text style={styles.status}>{item.status}</Text>
          <Text style={styles.availability}>{item.availability}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => navigation.navigate('ChatScreen', { otherUser: item })}
        >
          <MaterialCommunityIcons
            name="message"
            size={18}
            color="#ffffff"
          />
          <Text style={styles.buttonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.callButton}>
          <MaterialCommunityIcons
            name="phone"
            size={18}
            color="#999999"
          />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blood Donors</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <MaterialCommunityIcons
              name="view-list"
              size={20}
              color={viewMode === 'list' ? '#ffffff' : '#6b7280'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
            onPress={() => setViewMode('map')}
          >
            <MaterialCommunityIcons
              name="map"
              size={20}
              color={viewMode === 'map' ? '#ffffff' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {currentLocation ? (
            <LiveMap
              userLocation={currentLocation}
              donors={filteredDonors}
              isLoading={loading}
              onDonorPress={(donor) => {
                setViewMode('list');
              }}
            />
          ) : (
            <View style={styles.mapLoadingContainer}>
              <MaterialCommunityIcons
                name="map-search"
                size={48}
                color="rgba(255,255,255,0.3)"
              />
              <Text style={styles.mapLoadingText}>Getting your location...</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color="#6b7280"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, location or blood group..."
              placeholderTextColor="#6b7280"
              value={searchText}
              onChangeText={handleSearch}
            />
            <TouchableOpacity>
              <MaterialCommunityIcons
                name="tune"
                size={20}
                color="#ff8c42"
              />
            </TouchableOpacity>
          </View>

          {/* Blood Group Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {BLOOD_GROUPS.map((group) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.filterChip,
                  selectedBloodGroup === group && styles.filterChipActive,
                ]}
                onPress={() => handleBloodGroupFilter(group)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedBloodGroup === group && styles.filterChipTextActive,
                  ]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Location and Online Status */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.distanceDropdown}
              onPress={() => setShowDistanceDropdown(!showDistanceDropdown)}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#ffffff"
              />
              <Text style={styles.distanceText}>{selectedDistance}</Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={16}
                color="#ffffff"
              />
            </TouchableOpacity>

            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot2} />
              <Text style={styles.onlineText}>{filteredDonors.length} Donors</Text>
            </View>
          </View>

          {/* Loading State */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff8c42" />
              <Text style={styles.loadingText}>Loading donors...</Text>
            </View>
          ) : filteredDonors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="heart-broken"
                size={48}
                color="rgba(255, 255, 255, 0.3)"
              />
              <Text style={styles.emptyText}>No donors found</Text>
            </View>
          ) : (
            /* Donors List */
            <FlatList
              data={filteredDonors}
              renderItem={renderDonorCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </ScrollView>
      )}

      <BottomNavigation
        navigation={navigation}
        activeTab="donors"
        onProfilePress={() => setShowProfile(true)}
        unreadMessageCount={totalUnreadCount}
      />

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        userData={userData}
        onLogout={() => setIsLoggedIn(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
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
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ff3b30',
  },
  mapContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 32, 36, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  filterScroll: {
    marginTop: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#ff3b30',
    borderColor: '#ff3b30',
  },
  filterChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  distanceDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 139, 66, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 139, 66, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  distanceText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot2: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  onlineText: {
    color: '#ff3b30',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  donorCard: {
    backgroundColor: 'rgba(30, 32, 36, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    gap: 12,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 70,
  },
  avatar: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0F1115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F1115',
  },
  bloodBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F1115',
  },
  bloodText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  donorInfo: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  donorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  distance: {
    fontSize: 12,
    color: '#9ca3af',
  },
  coordinates: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  status: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  availability: {
    fontSize: 11,
    color: '#6b7280',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  callButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    marginTop: 12,
  },
});
