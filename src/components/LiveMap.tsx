import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Donor {
  id: string;
  name: string;
  bloodGroup: string;
  latitude: number;
  longitude: number;
  realDistance?: number | string;
  online?: boolean;
}

interface Emergency {
  id: string;
  type: string;
  message: string;
  userName: string;
  userEmail: string;
  userId: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface LiveMapProps {
  userLocation: UserLocation | null;
  donors: Donor[];
  emergencies?: Emergency[];
  onDonorPress?: (donor: Donor) => void;
  onEmergencyPress?: (emergency: Emergency) => void;
  isLoading?: boolean;
}

const getBloodGroupColor = (bloodGroup: string): string => {
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

export default function LiveMap({
  userLocation,
  donors,
  emergencies = [],
  onDonorPress,
  onEmergencyPress,
  isLoading,
}: LiveMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (userLocation && mapRef.current) {
      const nearbyCoordinates = [
        ...donors
          .filter((donor) => donor.latitude != null && donor.longitude != null)
          .map((donor) => ({
            latitude: donor.latitude,
            longitude: donor.longitude,
          })),
        ...emergencies
          .filter((emergency) => emergency.latitude != null && emergency.longitude != null)
          .map((emergency) => ({
            latitude: emergency.latitude,
            longitude: emergency.longitude,
          })),
      ];

      const latitudeSpread = nearbyCoordinates.length
        ? Math.max(
            ...nearbyCoordinates.map((coordinate) => Math.abs(coordinate.latitude - userLocation.latitude))
          )
        : 0;
      const longitudeSpread = nearbyCoordinates.length
        ? Math.max(
            ...nearbyCoordinates.map((coordinate) => Math.abs(coordinate.longitude - userLocation.longitude))
          )
        : 0;

      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: Math.max(latitudeSpread * 2.5, 0.05),
          longitudeDelta: Math.max(longitudeSpread * 2.5, 0.05),
        },
        1000
      );
    }
  }, [userLocation, donors.length, emergencies.length]);

  if (!userLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="map-search"
            size={48}
            color="rgba(255,255,255,0.3)"
          />
          <Text style={styles.loadingText}>
            {isLoading ? 'Loading map...' : 'Getting your location...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={mapDarkStyle}
        showsUserLocation={false}
      >
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your Location"
          description="You are here"
        >
          <View style={styles.userMarker} />
        </Marker>

        {donors
          .filter((donor) => donor.latitude && donor.longitude)
          .map((donor) => (
            <Marker
              key={donor.id}
              coordinate={{
                latitude: donor.latitude,
                longitude: donor.longitude,
              }}
              title={donor.name}
              description={`${donor.bloodGroup} • ${donor.realDistance} km away`}
              onPress={() => onDonorPress?.(donor)}
            >
              <View style={styles.donorMarker} />
            </Marker>
          ))}

        {emergencies
          .filter((emergency) => emergency.latitude && emergency.longitude)
          .map((emergency) => (
            <Marker
              key={emergency.id}
              coordinate={{
                latitude: emergency.latitude,
                longitude: emergency.longitude,
              }}
              title={emergency.userName}
              description={emergency.message}
              onPress={() => onEmergencyPress?.(emergency)}
            >
              <View style={styles.emergencyMarker} />
            </Marker>
          ))}
      </MapView>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <MaterialCommunityIcons
              name="map-marker"
              size={14}
              color="#ffffff"
            />
          </View>
          <Text style={styles.statText}>{donors.filter(d => d.latitude && d.longitude).length} donors</Text>
        </View>
      </View>
    </View>
  );
}

const mapDarkStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#212121' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#212121' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#181818' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#2c2c2c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a8a8a' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#373737' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3c3c3c' }],
  },
  {
    featureType: 'road.highway.controlled_access',
    elementType: 'geometry',
    stylers: [{ color: '#4e4e4e' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1622' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
    borderRadius: 24,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 12,
  },
  userMarkerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userMarkerRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bloodGroupText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34c759',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statsBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30, 32, 36, 0.9)',
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  donorMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34c759',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  emergencyMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
