// API Provider: Foursquare Places API
import prisma from '@/lib/prisma';

interface FoursquareResult {
  name: string;
  category: string;
  address: string;
  city: string;
  area: string;
  rating: number | null;
  phone: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
}

export async function searchFoursquare(
  query: string,
  location: string,
  apiKey: string,
  lat?: number,
  lon?: number,
  radiusKm: number = 10
): Promise<FoursquareResult[]> {
  const results: FoursquareResult[] = [];

  try {
    const month = new Date().toISOString().slice(0, 7);
    await prisma.apiUsage.create({
      data: { provider: 'foursquare', endpoint: 'places_search', month }
    });

    const params = new URLSearchParams({
      query,
      limit: '50',
    });

    if (lat && lon) {
      params.append('ll', `${lat},${lon}`);
      params.append('radius', (radiusKm * 1000).toString());
    } else {
      params.append('near', location);
    }

    const response = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) throw new Error(`Foursquare error: ${response.status}`);

    const data = await response.json();
    const places = data.results || [];

    for (const place of places) {
      const mainCat = place.categories?.[0]?.name || query;
      results.push({
        name: place.name || '',
        category: mainCat,
        address: place.location?.formatted_address || place.location?.address || '',
        city: place.location?.locality || '',
        area: place.location?.neighborhood?.[0] || place.location?.cross_street || '',
        rating: place.rating ? place.rating / 2 : null,
        phone: place.tel || null,
        website: place.website || null,
        latitude: place.geocodes?.main?.latitude || null,
        longitude: place.geocodes?.main?.longitude || null,
      });
    }
  } catch (error) {
    console.error('Foursquare error:', error);
  }

  return results;
}
