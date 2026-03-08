import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';

import { formatDistance } from '@/utils/location';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type AlertPayload = {
  distanceKm: number;
  distanceMeters: number;
};

export function useNotificationAlerts() {
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function requestPermission() {
      const settings = await Notifications.requestPermissionsAsync();
      if (mounted) {
        setNotificationsGranted(settings.status === 'granted');
      }
    }

    void requestPermission();

    return () => {
      mounted = false;
    };
  }, []);

  async function sendDestinationAlert({ distanceKm, distanceMeters }: AlertPayload) {
    if (!notificationsGranted) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Approaching your stop',
        body: `You are ${formatDistance(distanceMeters)} away. Your ${distanceKm} km alarm is active.`,
        sound: true,
      },
      trigger: null,
    });
  }

  return { notificationsGranted, sendDestinationAlert };
}
