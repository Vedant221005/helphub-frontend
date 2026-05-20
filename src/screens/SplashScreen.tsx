import React, { useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';

export default function SplashScreen() {
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim2 = React.useRef(new Animated.Value(0)).current;
  const loadingAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.sequence([
          Animated.timing(pulseAnim2, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim2, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0],
  });

  const pulseScale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1.25, 2.25],
  });

  const pulseOpacity2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  const loadingTranslate = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.glowBackground} />

        <View style={styles.logoSection}>
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseScale2 }],
                  opacity: pulseOpacity2,
                },
              ]}
            />

            <View style={styles.logoBox}>
              <Image
                source={require('../assets/icons/splash-icon.png')}
                style={{ width: 100, height: 100, resizeMode: 'contain' }}
              />
            </View>
          </View>

          <View style={styles.brandSection}>
            <Text style={styles.brandTitle}>HelpHub</Text>
            <Text style={styles.brandSubtitle}>Helping Communities Connect</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Network Secure</Text>
          </View>

          <View style={styles.loadingBarContainer}>
            <Animated.View
              style={[
                styles.loadingBar,
                {
                  transform: [{ translateX: loadingTranslate }],
                },
              ]}
            >
              <View style={styles.loadingBarGradient} />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowBackground: {
    position: 'absolute',
    width: 320,
    height: 320,
    backgroundColor: 'rgba(255, 85, 69, 0.1)',
    borderRadius: 160,
  },
  logoSection: {
    alignItems: 'center',
    zIndex: 10,
  },
  pulseContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 85, 69, 0.3)',
  },
  logoBox: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(30, 32, 36, 0.8)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#c0000a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  brandSection: {
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#a09a94',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: 8,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  loadingBarContainer: {
    width: 192,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingBar: {
    width: 120,
    height: '100%',
    borderRadius: 4,
  },
  loadingBarGradient: {
    flex: 1,
    backgroundColor: '#ffb4aa',
  },
});
