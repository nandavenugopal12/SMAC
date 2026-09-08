# SMAC — Expo Go prototype

Native Expo SDK 57 prototype for cooperative family chores. It includes:

- On-device signup and login
- Name, age, Cook, Driver, Adult, and Anyone roles
- Create a family or join one with a six-character code
- Persistent `expo-sqlite` database
- Family dashboard with active quests, creators, contributors, and progress
- Badge shelf driven by completed subtasks
- Gemini chore-to-subtask planning with a full edit/add/delete review step
- Publish edited quest plans to the family dashboard
- Claim subtasks, track elapsed time, and complete them to update quest progress
- Live driver-task map, Google destination lookup, and automatic arrival completion

## Run with Expo Go

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Add the development Gemini key as `EXPO_PUBLIC_GEMINI_API_KEY`.
4. Add a Google Maps key with the Geocoding API enabled as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
5. Run `npm start`.
6. Scan the QR code from Expo Go while the phone and computer are on the same network.

Run `npm run typecheck` and `npm run doctor` to verify the project.

## Prototype boundaries

SQLite data lives on the device, so family codes currently join accounts stored on that same device. A shared backend is required for families using separate phones.

`EXPO_PUBLIC_*` values are bundled into the mobile app and are not secrets. The direct Gemini integration is appropriate only for this prototype. Before publishing, move authentication, the shared database, and Gemini calls to a server and restrict or rotate the development key.

Drive tracking is foreground-only in Expo Go. Keep the driver screen open (or return to it after using turn-by-turn directions) so arrival can be detected. Background tracking requires a development build and additional platform permissions.
