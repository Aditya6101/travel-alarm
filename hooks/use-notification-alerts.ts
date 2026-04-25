import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { formatDistance } from '@/utils/location';

let notificationHandlerRegistered = false;
type NotificationsModule = typeof import('expo-notifications');

type AlertPayload = {
  distanceKm: number;
  distanceMeters: number;
};

export function useNotificationAlerts() {
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const isAndroidExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';
  const notificationsModuleRef = useRef<NotificationsModule | null>(null);

  useEffect(() => {
    let mounted = true;

    async function requestPermission() {
      if (isAndroidExpoGo) {
        if (mounted) {
          setNotificationsGranted(false);
        }
        return;
      }

      const Notifications = await import('expo-notifications');
      notificationsModuleRef.current = Notifications;

      if (!notificationHandlerRegistered) {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        notificationHandlerRegistered = true;
      }

      try {
        const settings = await Notifications.requestPermissionsAsync();
        if (mounted) {
          setNotificationsGranted(settings.status === 'granted');
        }
      } catch {
        if (mounted) {
          setNotificationsGranted(false);
        }
      }
    }

    void requestPermission();

    return () => {
      mounted = false;
    };
  }, [isAndroidExpoGo]);

  const sendDestinationAlert = useCallback(async ({ distanceKm, distanceMeters }: AlertPayload) => {
    if (!notificationsGranted || isAndroidExpoGo || !notificationsModuleRef.current) {
      return;
    }

    await notificationsModuleRef.current.scheduleNotificationAsync({
      content: {
        title: 'Approaching your stop',
        body: `You are ${formatDistance(distanceMeters)} away. Your ${distanceKm} km alarm is active.`,
        sound: true,
      },
      trigger: null,
    });
  }, [isAndroidExpoGo, notificationsGranted]);

  return { notificationsGranted, sendDestinationAlert };
}
