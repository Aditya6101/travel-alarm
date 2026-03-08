import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, type MapPressEvent, type Region } from 'react-native-maps';

import { AppPalette } from '@/constants/app-palette';
import { type Coordinate } from '@/utils/location';

type TravelMapProps = {
  destination: Coordinate | null;
  isNearDestination: boolean;
  onSelectDestination: (coordinate: Coordinate) => void;
  selectedDistanceKm: number;
  userLocation: Coordinate | null;
};

const DEFAULT_REGION: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 12,
  longitudeDelta: 12,
};

export function TravelMap({
  destination,
  isNearDestination,
  onSelectDestination,
  selectedDistanceKm,
  userLocation,
}: TravelMapProps) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const focus = destination ?? userLocation;
    if (!focus || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: focus.latitude,
        longitude: focus.longitude,
        latitudeDelta: destination ? 0.08 : 0.18,
        longitudeDelta: destination ? 0.08 : 0.18,
      },
      450
    );
  }, [destination, userLocation]);

  function handleMapPress(event: MapPressEvent) {
    onSelectDestination(event.nativeEvent.coordinate);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.caption}>Tap anywhere to set or move the destination pin.</Text>
      </View>
      <MapView
        ref={mapRef}
        initialRegion={DEFAULT_REGION}
        onPress={handleMapPress}
        showsCompass
        showsMyLocationButton
        showsUserLocation
        style={styles.map}>
        {userLocation ? (
          <Marker
            coordinate={userLocation}
            pinColor={isNearDestination ? AppPalette.success : AppPalette.accent}
            title="Your location"
          />
        ) : null}
        {destination ? (
          <>
            <Marker
              coordinate={destination}
              pinColor={isNearDestination ? AppPalette.danger : AppPalette.destination}
              title="Destination"
            />
            <Circle
              center={destination}
              fillColor={
                isNearDestination ? 'rgba(194, 50, 0, 0.16)' : 'rgba(26, 91, 255, 0.12)'
              }
              radius={selectedDistanceKm * 1000}
              strokeColor={isNearDestination ? AppPalette.danger : AppPalette.accent}
              strokeWidth={2}
            />
          </>
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: AppPalette.surface,
    borderColor: AppPalette.border,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    gap: 4,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  title: {
    color: AppPalette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  caption: {
    color: AppPalette.secondaryText,
    fontSize: 13,
    lineHeight: 18,
  },
  map: {
    height: 320,
    marginTop: 14,
  },
});
