// API Provider: LocationIQ
import prisma from '@/lib/prisma';

interface LocationIQResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeLocation(
  location: string,
  apiKey: string
): Promise<LocationIQResult | null> {
  try {
    const month = new Date().toISOString().slice(0, 7);
    await prisma.apiUsage.create({
      data: { provider: 'locationiq', endpoint: 'search', month }
    });

    const params = new URLSearchParams({
      key: apiKey,
      q: location,
      format: 'json',
      limit: '1',
    });

    const response = await fetch(`https://us1.locationiq.com/v1/search?${params}`);
    if (!response.ok) throw new Error(`LocationIQ error: ${response.status}`);

    const data = await response.json();
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
  } catch (error) {
    console.error('LocationIQ error:', error);
  }

  return null;
}
