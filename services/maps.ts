export type Coordinates = { latitude: number; longitude: number };

export async function geocodeDestination(address: string): Promise<Coordinates> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key || key === 'your_google_maps_key_here') throw new Error('Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env and restart Expo.');
  let response: Response;
  try {
    response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}`);
  } catch { throw new Error('Could not reach Google Maps. Check your connection.'); }
  const payload = await response.json();
  if (!response.ok || payload.status !== 'OK') throw new Error(payload.error_message || (payload.status === 'ZERO_RESULTS' ? 'Google Maps could not find that destination.' : `Google Maps error: ${payload.status}`));
  const location = payload.results?.[0]?.geometry?.location;
  if (!location) throw new Error('Google Maps returned no destination coordinates.');
  return { latitude: Number(location.lat), longitude: Number(location.lng) };
}

export function distanceInMetres(first: Coordinates, second: Coordinates) {
  const radius = 6371000;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
