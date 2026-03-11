// API Provider: Apify (Google Maps + JustDial scrapers)
import prisma from '@/lib/prisma';

interface ApifyResult {
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
  photoCount: number | null;
}

export async function searchApifyGoogleMaps(
  query: string,
  location: string,
  apiKey: string
): Promise<ApifyResult[]> {
  const results: ApifyResult[] = [];

  try {
    const month = new Date().toISOString().slice(0, 7);
    await prisma.apiUsage.create({
      data: { provider: 'apify', endpoint: 'google_maps', month }
    });

    // Start the Apify actor for Google Maps
    const input = {
      searchStringsArray: [`${query} in ${location}`],
      maxCrawledPlacesPerSearch: 50,
      language: 'en',
      maxReviews: 0,
    };

    const response = await fetch(
      `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) throw new Error(`Apify error: ${response.status}`);

    const data = await response.json();

    for (const place of data) {
      results.push({
        name: place.title || place.name || '',
        category: place.categoryName || query,
        address: place.address || place.street || '',
        city: place.city || '',
        area: place.neighborhood || '',
        rating: place.totalScore || place.rating || null,
        reviewCount: place.reviewsCount || null,
        phone: place.phone || null,
        website: place.website || null,
        googleMapsLink: place.url || null,
        googlePlaceId: place.placeId || null,
        latitude: place.location?.lat || null,
        longitude: place.location?.lng || null,
        openingHours: place.openingHours ? JSON.stringify(place.openingHours) : null,
        photoCount: place.imageUrls?.length || 0,
      });
    }
  } catch (error) {
    console.error('Apify Google Maps error:', error);
  }

  return results;
}

export async function searchApifyJustDial(
  query: string,
  location: string,
  apiKey: string
): Promise<ApifyResult[]> {
  const results: ApifyResult[] = [];

  try {
    const month = new Date().toISOString().slice(0, 7);
    await prisma.apiUsage.create({
      data: { provider: 'apify', endpoint: 'justdial', month }
    });

    const input = {
      search: `${query} in ${location}`,
      maxItems: 50,
    };

    const response = await fetch(
      `https://api.apify.com/v2/acts/curious_coder~justdial-scraper/run-sync-get-dataset-items?token=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }
    );

    if (!response.ok) throw new Error(`Apify JustDial error: ${response.status}`);

    const data = await response.json();

    for (const place of data) {
      results.push({
        name: place.name || place.title || '',
        category: query,
        address: place.address || '',
        city: place.city || location,
        area: place.locality || '',
        rating: place.rating ? parseFloat(place.rating) : null,
        reviewCount: place.votes ? parseInt(place.votes) : null,
        phone: place.phone || place.contact || null,
        website: place.website || null,
        googleMapsLink: null,
        googlePlaceId: null,
        latitude: place.latitude ? parseFloat(place.latitude) : null,
        longitude: place.longitude ? parseFloat(place.longitude) : null,
        openingHours: null,
        photoCount: 0,
      });
    }
  } catch (error) {
    console.error('Apify JustDial error:', error);
  }

  return results;
}
