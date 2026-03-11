// Main Scan API - orchestrates data collection from all providers
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { searchSerpAPI } from '@/lib/providers/serpapi';
import { searchFoursquare } from '@/lib/providers/foursquare';
import { searchGeoapify } from '@/lib/providers/geoapify';
import { geocodeLocation } from '@/lib/providers/locationiq';
import { searchApifyGoogleMaps } from '@/lib/providers/apify';
import { calculateLeadScore } from '@/lib/scoring';
import { mergePhoneNumbers } from '@/lib/utils';

async function getApiKey(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  let value = setting?.value;
  
  if (!value) {
    // Fallback to env variables
    const envMap: Record<string, string> = {
      'serpapi_key': process.env.SERPAPI_KEY || '',
      'foursquare_key': process.env.FOURSQUARE_KEY || '',
      'geoapify_key': process.env.GEOAPIFY_KEY || '',
      'locationiq_key': process.env.LOCATIONIQ_KEY || '',
      'apify_key': process.env.APIFY_KEY || '',
    };
    value = envMap[key] || '';
  }

  // Support multiple comma-separated keys for load balancing
  if (value) {
    const keys = value.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) {
      // Pick a random key from the array
      return keys[Math.floor(Math.random() * keys.length)];
    }
  }

  return '';
}

async function checkSearchCache(location: string, category: string): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const cached = await prisma.searchHistory.findFirst({
    where: {
      location: { contains: location },
      category: { contains: category },
      searchedAt: { gte: twentyFourHoursAgo },
    },
  });
  return !!cached;
}

interface RawBusiness {
  name: string;
  category: string;
  address: string;
  city: string;
  area: string;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  website: string | null;
  googleMapsLink?: string | null;
  googlePlaceId?: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours?: string | null;
  priceLevel?: string | null;
  photoCount?: number | null;
  source: string;
}

async function findDuplicate(biz: RawBusiness) {
  // Check by Google Place ID
  if (biz.googlePlaceId) {
    const existing = await prisma.business.findFirst({
      where: { googlePlaceId: biz.googlePlaceId },
    });
    if (existing) return existing;
  }

  // Check by phone number
  if (biz.phone) {
    const cleanPhone = biz.phone.replace(/[\s\-\(\)]/g, '').replace(/^\+91/, '');
    if (cleanPhone.length >= 10) {
      const existing = await prisma.business.findFirst({
        where: { phoneNumbers: { contains: cleanPhone } },
      });
      if (existing) return existing;
    }
  }

  // Check by name similarity + city
  if (biz.name) {
    const existing = await prisma.business.findFirst({
      where: {
        name: { equals: biz.name },
        city: biz.city ? { contains: biz.city } : undefined,
      },
    });
    if (existing) return existing;
  }

  return null;
}

async function saveBusiness(biz: RawBusiness) {
  const existing = await findDuplicate(biz);
  const phones = biz.phone ? [biz.phone] : [];

  if (existing) {
    // Merge data - update with new info, merge phones, merge sources
    const mergedPhones = mergePhoneNumbers(existing.phoneNumbers, phones);
    const existingSources = existing.source || '';
    const mergedSource = existingSources.includes(biz.source)
      ? existingSources
      : `${existingSources} / ${biz.source}`.replace(/^ \/ /, '');

    const updated = await prisma.business.update({
      where: { id: existing.id },
      data: {
        phoneNumbers: mergedPhones || existing.phoneNumbers,
        email: biz.website ? existing.email : existing.email,
        websiteUrl: biz.website || existing.websiteUrl,
        googleMapsLink: biz.googleMapsLink || existing.googleMapsLink,
        googlePlaceId: biz.googlePlaceId || existing.googlePlaceId,
        rating: biz.rating || existing.rating,
        reviewCount: biz.reviewCount && (existing.reviewCount || 0) < biz.reviewCount
          ? biz.reviewCount : existing.reviewCount,
        source: mergedSource,
        latitude: biz.latitude || existing.latitude,
        longitude: biz.longitude || existing.longitude,
        openingHours: biz.openingHours || existing.openingHours,
        priceLevel: biz.priceLevel || existing.priceLevel,
        photoCount: Math.max(biz.photoCount || 0, existing.photoCount || 0),
      },
    });
    return { business: updated, isNew: false };
  } else {
    const created = await prisma.business.create({
      data: {
        name: biz.name,
        category: biz.category,
        address: biz.address,
        city: biz.city,
        area: biz.area,
        rating: biz.rating,
        reviewCount: biz.reviewCount,
        phoneNumbers: mergePhoneNumbers(null, phones),
        websiteUrl: biz.website,
        googleMapsLink: biz.googleMapsLink || null,
        googlePlaceId: biz.googlePlaceId || null,
        latitude: biz.latitude,
        longitude: biz.longitude,
        openingHours: biz.openingHours || null,
        priceLevel: biz.priceLevel || null,
        photoCount: biz.photoCount || 0,
        source: biz.source,
      },
    });
    return { business: created, isNew: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, radius, categories, providers, lat: clientLat, lon: clientLon } = body;
    const radiusNum = radius ? parseInt(radius) : 10;

    if (!location || !categories?.length) {
      return NextResponse.json({ error: 'Location and categories are required' }, { status: 400 });
    }

    // Check cache
    for (const cat of categories) {
      const isCached = await checkSearchCache(location, cat);
      if (isCached) {
        // Return cached results
        const cached = await prisma.business.findMany({
          where: {
            category: { contains: cat },
            OR: [
              { city: { contains: location } },
              { area: { contains: location } },
              { address: { contains: location } },
            ],
          },
          include: { websiteAnalysis: true, leadScore: true },
        });
        if (cached.length > 0) {
          return NextResponse.json({
            results: cached,
            cached: true,
            message: `Loaded ${cached.length} cached results for ${cat} in ${location}`,
          });
        }
      }
    }

    // Get API keys
    const serpKey = await getApiKey('serpapi_key');
    const fsqKey = await getApiKey('foursquare_key');
    const geoKey = await getApiKey('geoapify_key');
    const liqKey = await getApiKey('locationiq_key');
    const apifyKey = await getApiKey('apify_key');

    // Geocode location for coordinate-based APIs
    let lat = clientLat || 28.4595, lon = clientLon || 77.0266;
    if (!clientLat || !clientLon) {
      if (liqKey && location !== 'Current Location') {
        const geo = await geocodeLocation(location, liqKey);
        if (geo) {
          lat = geo.latitude;
          lon = geo.longitude;
        }
      }
    }

    const allRawBusinesses: RawBusiness[] = [];
    const enabledProviders = providers || ['serpapi', 'geoapify', 'foursquare'];

    for (const category of categories) {
      // Add delay between categories
      await new Promise(resolve => setTimeout(resolve, 1000));

      // SerpAPI (Google Maps)
      if (enabledProviders.includes('serpapi') && serpKey) {
        const apiQuery = radiusNum ? `${category} within ${radiusNum}km` : category;
        const searchLoc = location === 'Current Location' ? 'nearby' : location;
        const results = await searchSerpAPI(apiQuery, searchLoc, serpKey, lat, lon);
        for (const r of results) {
          allRawBusinesses.push({ ...r, source: 'Google Maps (SerpAPI)' });
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Geoapify
      if (enabledProviders.includes('geoapify') && geoKey) {
        const results = await searchGeoapify(category, location, geoKey, lat, lon, radiusNum);
        for (const r of results) {
          allRawBusinesses.push({
            ...r,
            rating: null,
            reviewCount: null,
            googleMapsLink: null,
            googlePlaceId: null,
            photoCount: 0,
            priceLevel: null,
            source: 'Geoapify',
          });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Foursquare
      if (enabledProviders.includes('foursquare') && fsqKey) {
        const results = await searchFoursquare(category, location, fsqKey, lat, lon, radiusNum);
        for (const r of results) {
          allRawBusinesses.push({
            ...r,
            reviewCount: null,
            googleMapsLink: null,
            googlePlaceId: null,
            openingHours: null,
            priceLevel: null,
            photoCount: 0,
            source: 'Foursquare',
          });
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Apify
      if (enabledProviders.includes('apify') && apifyKey) {
        const apiQuery = radiusNum ? `${category} within ${radiusNum}km` : category;
        const searchLoc = location === 'Current Location' ? 'nearby' : location;
        const results = await searchApifyGoogleMaps(apiQuery, searchLoc, apifyKey);
        for (const r of results) {
          allRawBusinesses.push({ ...r, source: 'Apify Google Maps' });
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Save businesses with deduplication
    let newCount = 0;
    let mergedCount = 0;
    const savedIds: string[] = [];

    for (const biz of allRawBusinesses) {
      if (!biz.name) continue;
      const { business, isNew } = await saveBusiness(biz);
      savedIds.push(business.id);
      if (isNew) newCount++;
      else mergedCount++;

      // Calculate lead score
      const websiteStatus = !biz.website ? 'NO_WEBSITE' : 'GOOD';
      const scoreResult = calculateLeadScore({
        websiteUrl: biz.website || null,
        websiteStatus,
        rating: biz.rating,
        reviewCount: biz.reviewCount,
        category: biz.category,
        area: biz.area,
        photoCount: biz.photoCount || null,
        priceLevel: biz.priceLevel || null,
      });

      await prisma.leadScore.upsert({
        where: { businessId: business.id },
        create: {
          businessId: business.id,
          score: scoreResult.score,
          classification: scoreResult.classification,
          factors: JSON.stringify(scoreResult.factors),
        },
        update: {
          score: scoreResult.score,
          classification: scoreResult.classification,
          factors: JSON.stringify(scoreResult.factors),
        },
      });

      // Create website analysis placeholder
      await prisma.websiteAnalysis.upsert({
        where: { businessId: business.id },
        create: {
          businessId: business.id,
          status: websiteStatus,
          isWorking: !!biz.website,
        },
        update: {},
      });
    }

    // Record search history
    for (const cat of categories) {
      await prisma.searchHistory.create({
        data: {
          location,
          category: cat,
          resultCount: allRawBusinesses.filter(b => b.category.toLowerCase().includes(cat.toLowerCase())).length,
        },
      });
    }

    // Return results
    const results = await prisma.business.findMany({
      where: { id: { in: savedIds } },
      include: { websiteAnalysis: true, leadScore: true },
      orderBy: { leadScore: { score: 'desc' } },
    });

    return NextResponse.json({
      results,
      stats: {
        total: allRawBusinesses.length,
        new: newCount,
        merged: mergedCount,
        unique: savedIds.length,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}
