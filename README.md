# Train Tracker

A "Where is my Train" style app built with Expo (React Native).

## Features

- **Live train status**: search a train by number or name and see a station-by-station timeline with delays, platforms, and the train's current position. Auto-refreshes every minute, pull to refresh manually.
- **Find trains**: pick origin and destination stations (with autocomplete) and see all direct trains with departure/arrival times, duration, running days, and classes.

## Data source

The app talks to the IRCTC API on RapidAPI (`irctc1.p.rapidapi.com`) when a key is configured.
Without a key it runs fully on bundled sample data (5 real trains with realistic routes and a simulated live position), and shows a "Sample data" banner so you always know which mode you are in.

### Enabling live data

1. Sign up at [RapidAPI](https://rapidapi.com/IRCTCAPI/api/irctc1) and subscribe to the IRCTC API (free tier available).
2. Copy `.env.example` to `.env` and paste your key:

   ```
   EXPO_PUBLIC_RAPIDAPI_KEY=your-key-here
   ```

3. Restart the dev server.

If a live request fails (rate limit, network), the app falls back to sample data instead of breaking.

## Running

```bash
npm install
npm start
```

Then scan the QR code with the Expo Go app on your phone, or press `a` to launch an Android emulator.

## Structure

```
src/
  theme.ts            Design tokens (flat, touch-first transit style)
  api/
    types.ts          Domain types (Station, TrainSummary, LiveStatus, ...)
    client.ts         RapidAPI client with sample-data fallback
    mock.ts           Bundled sample trains + simulated live position
  components/
    shared.tsx        DelayChip, SampleDataBanner, EmptyState
  screens/
    LiveStatusScreen.tsx
    SearchScreen.tsx
App.tsx               Bottom-tab navigation (Live Status / Find Trains)
```
