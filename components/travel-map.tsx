import { StyleSheet, Text, View } from 'react-native';

import { AppPalette } from '@/constants/app-palette';
import { type Coordinate } from '@/utils/location';

type TravelMapProps = {
  destination: Coordinate | null;
  isNearDestination: boolean;
  onSelectDestination: (coordinate: Coordinate) => void;
  selectedDistanceKm: number;
  userLocation: Coordinate | null;
};

export function TravelMap(_: TravelMapProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Map preview unavailable on web</Text>
      <Text style={styles.body}>
        This build is optimized for native devices. Run the Expo app on Android or iOS to use live
        maps, GPS tracking, and destination pinning.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: AppPalette.surface,
    borderColor: AppPalette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  title: {
    color: AppPalette.text,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: AppPalette.secondaryText,
    fontSize: 14,
    lineHeight: 20,
  },
});
