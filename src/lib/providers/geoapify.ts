// API Provider: Geoapify Places API
import prisma from '@/lib/prisma';

interface GeoapifyResult {
  name: string;
  category: string;
  address: string;
  city: string;
  area: string;
  phone: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
  openingHours: string | null;
}

const CATEGORY_MAP: Record<string, string> = {
  'gym': 'sport.fitness',
  'coaching institute': 'education.school',
  'school': 'education.school',
  'academy': 'education',
  'hospital': 'healthcare.hospital',
  'clinic': 'healthcare.clinic_or_praxis',
  'dentist': 'healthcare.dentist',
  'diagnostic lab': 'healthcare',
  'restaurant': 'catering.restaurant',
  'cafe': 'catering.cafe',
  'hotel': 'accommodation.hotel',
  'banquet hall': 'entertainment.culture',
  'real estate': 'office.estate_agent',
  'interior designer': 'office',
  'builder': 'building',
  'car showroom': 'commercial.vehicle',
  'salon': 'service.beauty.hairdresser',
  'luxury spa': 'service.beauty.spa',
  'event planner': 'entertainment',
};

export async function searchGeoapify(
  query: string,
  location: string,
  apiKey: string,
  lat: number = 28.4595,
  lon: number = 77.0266,
  radiusKm: number = 10
): Promise<GeoapifyResult[]> {
  const results: GeoapifyResult[] = [];

  try {
    const month = new Date().toISOString().slice(0, 7);
    await prisma.apiUsage.create({
      data: { provider: 'geoapify', endpoint: 'places', month }
    });

    const category = CATEGORY_MAP[query.toLowerCase()] || 'commercial';
    const params = new URLSearchParams({
      categories: category,
      filter: `circle:${lon},${lat},${radiusKm * 1000}`,
      limit: '50',
      apiKey,
    });

    const response = await fetch(`https://api.geoapify.com/v2/places?${params}`);
    if (!response.ok) throw new Error(`Geoapify error: ${response.status}`);

    const data = await response.json();
    const features = data.features || [];

    for (const feature of features) {
      const props = feature.properties || {};
      results.push({
        name: props.name || '',
        category: query,
        address: props.formatted || props.address_line1 || '',
        city: props.city || '',
        area: props.suburb || props.district || '',
        phone: props.contact?.phone || null,
        website: props.website || null,
        latitude: props.lat || 0,
        longitude: props.lon || 0,
        openingHours: props.opening_hours || null,
      });
    }
  } catch (error) {
    console.error('Geoapify error:', error);
  }

  return results;
}
