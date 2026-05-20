import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BottomNavigationProps {
  navigation: any;
  activeTab?: 'home' | 'donors' | 'chat' | 'profile';
  onProfilePress?: () => void;
  onSOSPress?: () => void;
  unreadMessageCount?: number;
}

export default function BottomNavigation({
  navigation,
  activeTab = 'home',
  onProfilePress,
  onSOSPress,
  unreadMessageCount = 0,
}: BottomNavigationProps) {
  const unreadLabel = unreadMessageCount > 99 ? '99+' : String(unreadMessageCount);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Home')}
      >
        <MaterialCommunityIcons
          name="home"
          size={24}
          color={activeTab === 'home' ? '#ff3b30' : '#999999'}
        />
        <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Donors')}
      >
        <MaterialCommunityIcons
          name="heart"
          size={24}
          color={activeTab === 'donors' ? '#ff3b30' : '#999999'}
        />
        <Text style={[styles.navLabel, activeTab === 'donors' && styles.navLabelActive]}>
          Donors
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.sosNavButton}
        onPress={onSOSPress}
      >
        <Text style={styles.sosNavText}>SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Chat')}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="chat"
            size={24}
            color={activeTab === 'chat' ? '#ff3b30' : '#999999'}
          />
          {unreadMessageCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadLabel}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.navLabel, activeTab === 'chat' && styles.navLabelActive]}>
          Chat
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={onProfilePress}
      >
        <MaterialCommunityIcons
          name="account"
          size={24}
          color={activeTab === 'profile' ? '#ff3b30' : '#999999'}
        />
        <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15,17,21,0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '600',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#ff3b30',
  },
  sosNavButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  sosNavText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1f2937',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
