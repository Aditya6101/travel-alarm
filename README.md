# Travel Alarm

Travel Alarm is a native Expo app that helps a traveler track their live location, set a destination, and get alerted before reaching their stop.

## Stack

- Expo SDK 54
- Expo Router
- React Native
- TypeScript
- `expo-location`
- `expo-notifications`
- `react-native-maps`

## Current Features

- Single-screen native experience
- Live foreground location tracking
- Destination search using geocoding
- Destination pin placement by tapping the map
- Distance calculation between current location and destination
- Preset alert-radius chips
- Local notification alerts when entering the selected radius
- Temporary 5-minute alert pause
- Reset flow for destination and alert state
- Native map support on iOS and Android
- Web fallback placeholder instead of a live map

## Project Structure

```text
travel-alarm/
├── app/
│   ├── _layout.tsx
│   └── index.tsx
├── components/
│   ├── travel-alarm-screen.tsx
│   ├── travel-map.native.tsx
│   └── travel-map.tsx
├── constants/
│   ├── app-palette.ts
│   └── theme.ts
├── hooks/
│   ├── use-live-location.ts
│   ├── use-notification-alerts.ts
│   └── use-color-scheme.ts
├── utils/
│   └── location.ts
├── assets/
│   └── images/
├── app.json
├── package.json
└── README.md
```

## How It Works

### App flow
1. Expo Router loads `app/_layout.tsx`.
2. The app renders `app/index.tsx`.
3. `TravelAlarmScreen` requests location and notification permissions.
4. Live location tracking starts once permission is granted.
5. The user sets a destination by search or by tapping the map.
6. The app calculates distance continuously and sends an alert when the user enters the selected radius.

### Location tracking
- Uses `expo-location`
- Requests foreground permission
- Fetches an initial position
- Starts `Location.watchPositionAsync()` with high accuracy
- Updates the user location while the app remains active

### Destination selection
- Search uses `Location.geocodeAsync()`
- The first geocoding result becomes the active destination
- Tapping the map drops or moves the destination pin

### Alert behavior
A local notification is sent only when:
- a destination exists
- a live user location exists
- notifications are enabled
- notification permission is granted
- alerts are not paused
- the user is inside the selected distance radius
- at least 30 seconds have passed since the previous alert

### Pause mode
- The user can pause alerts for 5 minutes
- A countdown is shown while alerts are paused
- Alerts resume automatically when the timer expires

## Design Direction

- Single focused screen instead of tabs
- Search-first destination workflow
- Warm paper-toned background with a dark hero card
- Compact distance chips for one-handed use
- Clear status sections for trip progress and alert state

## Configuration

### Permissions
Configured in `app.json`:

#### iOS
- `NSLocationWhenInUseUsageDescription`
- `NSUserNotificationsUsageDescription`

#### Android
- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`
- `POST_NOTIFICATIONS`

### Expo plugins
- `expo-router`
- `expo-location`
- `expo-notifications`
- `expo-splash-screen`

## Run Locally

Install dependencies if needed:

```powershell
C:\Program Files\nodejs\npm.cmd install
```

Start the Expo app:

```powershell
.\node_modules\.bin\expo.cmd start
```

## Validation

Completed locally in this workspace:

- `expo lint`
- `tsc --noEmit`



