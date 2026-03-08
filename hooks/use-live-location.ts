import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { type Coordinate } from '@/utils/location';

type PermissionState = Location.PermissionStatus | 'undetermined';

export function useLiveLocation() {
  const [location, setLocation] = useState<Coordinate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('undetermined');

  useEffect(() => {
    let mounted = true;
    let subscription: Location.LocationSubscription | null = null;

    async function startWatching() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) {
          return;
        }

        setPermissionStatus(status);

        if (status !== 'granted') {
          setError('Location permission was denied.');
          setIsLoading(false);
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (mounted) {
          setLocation({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
          });
          setError(null);
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 25,
            timeInterval: 5000,
          },
          (nextLocation) => {
            if (!mounted) {
              return;
            }

            setLocation({
              latitude: nextLocation.coords.latitude,
              longitude: nextLocation.coords.longitude,
            });
            setError(null);
          }
        );
      } catch (nextError) {
        if (mounted) {
          setError(
            nextError instanceof Error ? nextError.message : 'Unable to access your current location.'
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void startWatching();

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, []);

  return { location, error, isLoading, permissionStatus };
}
