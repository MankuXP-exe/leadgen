// API Provider: SerpAPI (Google Maps Search)
import prisma from '@/lib/prisma';

interface SerpAPIResult {
  name: string;
  category: string;
  address: string;
  city: string;
  area: string;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  googleMapsLink: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: string | null;
  priceLevel: string | null;
  photoCount: number | null;
}

export async function searchSerpAPI(
  query: string,
  location: string,
  apiKey: string,
  lat?: number,
  lon?: number
): Promise<SerpAPIResult[]> {
  const results: SerpAPIResult[] = [];

  try {
    // Track API usage
    const month = new Date().toISOString().slice(0, 7);
    await prisma.apiUsage.create({
      data: { provider: 'serpapi', endpoint: 'google_maps', month }
    });

    const queryStr = location === 'nearby' ? query : `${query} in ${location}`;
    const params = new URLSearchParams({
      engine: 'google_maps',
      q: queryStr,
      api_key: apiKey,
      type: 'search',
      ll: lat && lon ? `@${lat},${lon},12z` : '@28.4595,77.0266,12z', // Wider zoom to cover nearby areas and radius
    });

    const response = await fetch(`https://serpapi.com/search?${params}`);
    if (!response.ok) throw new Error(`SerpAPI error: ${response.status}`);

    const data = await response.json();
    const places = data.local_results || [];

    for (const place of places) {
      results.push({
        name: place.title || '',
        category: place.type || query,
        address: place.address || '',
        city: extractCity(place.address || ''),
        area: extractArea(place.address || '', location),
        rating: place.rating || null,
        reviewCount: place.reviews || null,
        phone: place.phone || null,
        website: place.website || null,
        googleMapsLink: place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : null,
        googlePlaceId: place.place_id || null,
        latitude: place.gps_coordinates?.latitude || null,
        longitude: place.gps_coordinates?.longitude || null,
        openingHours: place.operating_hours ? JSON.stringify(place.operating_hours) : null,
        priceLevel: place.price || null,
        photoCount: place.thumbnail ? 1 : 0,
      });
    }
  } catch (error) {
    console.error('SerpAPI error:', error);
  }

  return results;
}

function extractCity(address: string): string {
  const parts = address.split(',').map(s => s.trim());
  return parts.length >= 2 ? parts[parts.length - 2] : '';
}

function extractArea(address: string, fallback: string): string {
  const parts = address.split(',').map(s => s.trim());
  return parts.length >= 3 ? parts[0] : fallback;
}
