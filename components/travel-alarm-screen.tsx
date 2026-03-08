import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppPalette } from '@/constants/app-palette';
import { TravelMap } from '@/components/travel-map';
import { useLiveLocation } from '@/hooks/use-live-location';
import { useNotificationAlerts } from '@/hooks/use-notification-alerts';
import {
  type Coordinate,
  calculateDistanceMeters,
  formatCoordinates,
  formatDistance,
} from '@/utils/location';

const DISTANCE_OPTIONS = [2, 3, 5, 10, 15, 20];
const ALERT_COOLDOWN_MS = 30000;
const PAUSE_DURATION_MS = 5 * 60 * 1000;

export function TravelAlarmScreen() {
  const { location, error: locationError, permissionStatus, isLoading } = useLiveLocation();
  const { notificationsGranted, sendDestinationAlert } = useNotificationAlerts();

  const [destination, setDestination] = useState<Coordinate | null>(null);
  const [selectedDistanceKm, setSelectedDistanceKm] = useState(5);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [lastAlertAt, setLastAlertAt] = useState(0);
  const [pauseUntil, setPauseUntil] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const hasShownPermissionError = useRef(false);

  useEffect(() => {
    if (!location || !destination) {
      setDistanceMeters(null);
      return;
    }

    const nextDistance = calculateDistanceMeters(location, destination);
    setDistanceMeters(nextDistance);

    const isNear = nextDistance <= selectedDistanceKm * 1000;
    const now = Date.now();
    const alertsPaused = now < pauseUntil;

    if (
      isNear &&
      notificationsEnabled &&
      notificationsGranted &&
      !alertsPaused &&
      now - lastAlertAt >= ALERT_COOLDOWN_MS
    ) {
      void sendDestinationAlert({
        distanceKm: selectedDistanceKm,
        distanceMeters: nextDistance,
      });
      setLastAlertAt(now);
    }
  }, [
    destination,
    lastAlertAt,
    location,
    notificationsEnabled,
    notificationsGranted,
    pauseUntil,
    selectedDistanceKm,
    sendDestinationAlert,
  ]);

  useEffect(() => {
    if (pauseUntil <= Date.now()) {
      setCountdownSeconds(0);
      return;
    }

    const intervalId = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((pauseUntil - Date.now()) / 1000));
      setCountdownSeconds(remaining);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [pauseUntil]);

  useEffect(() => {
    if (
      permissionStatus === 'denied' &&
      !hasShownPermissionError.current &&
      Platform.OS !== 'web'
    ) {
      hasShownPermissionError.current = true;
      Alert.alert(
        'Location access needed',
        'Enable location permission so Travel Alarm can track your route and alert you before your stop.'
      );
    }
  }, [permissionStatus]);

  const isNearDestination =
    distanceMeters !== null && distanceMeters <= selectedDistanceKm * 1000;
  const alertsPaused = pauseUntil > Date.now();

  async function handleSearch() {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchError('Enter a place, address, or landmark to search.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await Location.geocodeAsync(trimmed);
      if (!results.length) {
        setSearchError('No match found. Try a clearer address or use the map to drop a pin.');
        return;
      }

      const firstResult = results[0];
      setDestination({
        latitude: firstResult.latitude,
        longitude: firstResult.longitude,
      });
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : 'Search failed. Please try again in a moment.'
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleDestinationSelect(nextDestination: Coordinate) {
    setDestination(nextDestination);
    setSearchError(null);
  }

  function handleReset() {
    setDestination(null);
    setDistanceMeters(null);
    setLastAlertAt(0);
    setPauseUntil(0);
    setSearchError(null);
  }

  function handlePauseAlerts() {
    setPauseUntil(Date.now() + PAUSE_DURATION_MS);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', default: undefined })}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Travel Alarm</Text>
            <Text style={styles.heroTitle}>Wake up before your stop, not after it.</Text>
            <Text style={styles.heroSubtitle}>
              Pick a destination, keep the app open during travel, and get nudged when you are
              getting close.
            </Text>
            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Alert radius</Text>
                <Text style={styles.statValue}>{selectedDistanceKm} km</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={styles.statValue}>
                  {alertsPaused ? `Paused ${countdownSeconds}s` : notificationsEnabled ? 'Armed' : 'Muted'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Destination</Text>
            <Text style={styles.sectionCopy}>
              Search for a place first, then fine-tune by tapping on the map.
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => void handleSearch()}
                placeholder="Search for a stop, station, or address"
                placeholderTextColor={AppPalette.muted}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
              <Pressable
                onPress={() => void handleSearch()}
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.buttonPressed,
                  isSearching && styles.buttonDisabled,
                ]}
                disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator color={AppPalette.surface} />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </Pressable>
            </View>
            {searchError ? <Text style={styles.inlineError}>{searchError}</Text> : null}
            {destination ? (
              <View style={styles.destinationCard}>
                <Text style={styles.destinationLabel}>Pinned destination</Text>
                <Text style={styles.destinationValue}>{formatCoordinates(destination)}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>No destination set yet.</Text>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Alert distance</Text>
            <View style={styles.chipRow}>
              {DISTANCE_OPTIONS.map((option) => {
                const active = option === selectedDistanceKm;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setSelectedDistanceKm(option)}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.buttonPressed,
                    ]}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{option} km</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => setNotificationsEnabled((current) => !current)}
              style={({ pressed }) => [
                styles.actionButton,
                notificationsEnabled ? styles.actionButtonPrimary : styles.actionButtonMuted,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.actionButtonText}>
                {notificationsEnabled ? 'Alerts on' : 'Alerts off'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.actionButton, styles.actionButtonGhost, pressed && styles.buttonPressed]}>
              <Text style={styles.actionButtonGhostText}>Reset</Text>
            </Pressable>
          </View>

          {destination && notificationsEnabled ? (
            <Pressable
              onPress={handlePauseAlerts}
              style={({ pressed }) => [
                styles.pauseButton,
                alertsPaused && styles.pauseButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              disabled={alertsPaused}>
              <Text style={styles.pauseButtonText}>
                {alertsPaused ? `Alerts paused for ${countdownSeconds}s` : "I'm awake for 5 minutes"}
              </Text>
            </Pressable>
          ) : null}

          {locationError ? <Text style={styles.inlineError}>{locationError}</Text> : null}
          {!notificationsGranted ? (
            <Text style={styles.helperText}>
              Notifications are unavailable right now, so the app can still track distance but will
              not raise alarms.
            </Text>
          ) : null}
          {permissionStatus !== 'granted' && !isLoading ? (
            <Text style={styles.helperText}>
              Location permission is required for live tracking. Open your device settings if you
              denied it earlier.
            </Text>
          ) : null}

          <TravelMap
            destination={destination}
            isNearDestination={isNearDestination}
            onSelectDestination={handleDestinationSelect}
            selectedDistanceKm={selectedDistanceKm}
            userLocation={location}
          />

          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Trip status</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current location</Text>
              <Text style={styles.summaryValue}>
                {location ? formatCoordinates(location) : isLoading ? 'Finding you...' : 'Unavailable'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Distance remaining</Text>
              <Text
                style={[
                  styles.summaryValue,
                  isNearDestination ? styles.summaryValueNear : undefined,
                ]}>
                {destination ? (distanceMeters !== null ? formatDistance(distanceMeters) : 'Calculating...') : 'Set a destination'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Alarm window</Text>
              <Text style={styles.summaryValue}>
                {destination ? `Triggers within ${selectedDistanceKm} km` : 'Waiting for destination'}
              </Text>
            </View>
            {isNearDestination ? (
              <View style={styles.nearbyBanner}>
                <Text style={styles.nearbyBannerText}>
                  You are inside the alert zone. Keep the app open and stay ready to get off.
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppPalette.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: AppPalette.hero,
    borderRadius: 28,
    padding: 22,
    gap: 12,
  },
  eyebrow: {
    color: AppPalette.heroAccent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: AppPalette.surface,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  heroSubtitle: {
    color: AppPalette.heroSoft,
    fontSize: 15,
    lineHeight: 22,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statPill: {
    flex: 1,
    backgroundColor: AppPalette.heroPanel,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  statLabel: {
    color: AppPalette.heroSoft,
    fontSize: 12,
  },
  statValue: {
    color: AppPalette.surface,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: AppPalette.surface,
    borderColor: AppPalette.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  sectionTitle: {
    color: AppPalette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCopy: {
    color: AppPalette.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: AppPalette.input,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppPalette.inputBorder,
    color: AppPalette.text,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: AppPalette.accent,
    borderRadius: 16,
    justifyContent: 'center',
    minWidth: 88,
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: AppPalette.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  destinationCard: {
    backgroundColor: AppPalette.input,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  destinationLabel: {
    color: AppPalette.secondaryText,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  destinationValue: {
    color: AppPalette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    color: AppPalette.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineError: {
    color: AppPalette.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: AppPalette.input,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppPalette.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: AppPalette.accentSoft,
    borderColor: AppPalette.accent,
  },
  chipText: {
    color: AppPalette.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: AppPalette.accent,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    paddingVertical: 16,
  },
  actionButtonPrimary: {
    backgroundColor: AppPalette.success,
  },
  actionButtonMuted: {
    backgroundColor: AppPalette.text,
  },
  actionButtonGhost: {
    backgroundColor: AppPalette.surface,
    borderColor: AppPalette.border,
    borderWidth: 1,
  },
  actionButtonText: {
    color: AppPalette.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  actionButtonGhostText: {
    color: AppPalette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  pauseButton: {
    alignItems: 'center',
    backgroundColor: AppPalette.warning,
    borderRadius: 18,
    paddingVertical: 16,
  },
  pauseButtonDisabled: {
    backgroundColor: AppPalette.warningSoft,
  },
  pauseButtonText: {
    color: AppPalette.text,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: AppPalette.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppPalette.border,
    padding: 18,
    gap: 14,
  },
  summaryRow: {
    gap: 6,
  },
  summaryLabel: {
    color: AppPalette.secondaryText,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: AppPalette.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  summaryValueNear: {
    color: AppPalette.danger,
  },
  nearbyBanner: {
    backgroundColor: AppPalette.dangerSoft,
    borderRadius: 18,
    padding: 14,
  },
  nearbyBannerText: {
    color: AppPalette.danger,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  buttonPressed: {
    opacity: 0.84,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
