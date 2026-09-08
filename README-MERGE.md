# HomeQuest integration overlay

Copy these files into the root of `HomeQuestApp`, preserving the folders shown here. Keep the existing `app.json`, `index.ts`, `.env`, and Expo configuration.

## Required image placement

Place the existing SMAC-beta image files directly inside `HomeQuestApp/Screens/`:

- `Ali.png`
- `Ayesha.png`
- `dad.png`
- `mom.png`
- `door.png`
- `fridge.png`
- `fridge_open.png`
- `picture.png`
- `room_background.jpg`
- `table.png`

The screen code deliberately uses literal relative `require()` paths so Expo Metro can bundle these files reliably.

## Environment

Copy `.env.example` to `.env`, then configure the backend variables:

- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_GEMINI_MODEL` (optional; defaults to `gemini-2.5-flash`)
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

Then run `npm install`, `npm run typecheck`, and `npx expo start` from `HomeQuestApp`.
