// Website Analysis API - checks HTTP status, SSL, load speed, mobile friendliness
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function analyzeWebsite(url: string) {
  const result = {
    httpStatus: 0,
    isWorking: false,
    loadSpeedMs: 0,
    isMobileFriendly: false,
    hasSSL: false,
    lastUpdated: null as string | null,
    isOutdated: false,
    status: 'NO_WEBSITE' as string,
  };

  if (!url) return result;

  try {
    result.hasSSL = url.startsWith('https://');
    const start = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LeadHunter/1.0)',
      },
    });

    clearTimeout(timeout);
    result.loadSpeedMs = Date.now() - start;
    result.httpStatus = response.status;
    result.isWorking = response.status >= 200 && response.status < 400;

    // Check last modified
    const lastModified = response.headers.get('last-modified');
    if (lastModified) {
      result.lastUpdated = lastModified;
      const lastDate = new Date(lastModified);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      result.isOutdated = lastDate < oneYearAgo;
    }

    // Check for viewport meta (mobile friendliness heuristic)
    if (response.status >= 200 && response.status < 400) {
      try {
        const getRes = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LeadHunter/1.0)',
          },
        });
        const html = await getRes.text();
        const htmlLower = html.toLowerCase();
        
        result.isMobileFriendly = htmlLower.includes('viewport') &&
          (htmlLower.includes('width=device-width') || htmlLower.includes('responsive'));

        // Check for outdated indicators
        const outdatedSignals = [
          'bootstrap@3', 'bootstrap/3', 'jquery/1.',
          'font-awesome/4', 'angular.min.js',
          '<table width=', '<center>', '<font ',
          'marquee', 'flash', '.swf',
        ];
        const hasOutdated = outdatedSignals.some(s => htmlLower.includes(s));
        if (hasOutdated) result.isOutdated = true;

        // Check for parked domains / default hosting pages
        const parkingSignals = [
          'hostinger', // Hostinger default page
          'you are all set to go!', // Hostinger tagline
          'upload your website files', // Hostinger instruction
          'default webpage', // Generic cPanel etc
          'parked domain', // Generic parked
          'this domain is registered', // GoDaddy etc
          'domain is parked',
          'hugedomains.com',
          'buy this domain'
        ];
        const isParked = parkingSignals.some(s => htmlLower.includes(s.toLowerCase()));
        if (isParked) {
          result.isWorking = false; // Treat parked domains as broken/no-website
        }
      } catch {
        // Ignore body fetch errors
      }
    }

    // Determine status
    if (!result.isWorking) {
      result.status = 'BROKEN';
    } else if (!result.hasSSL) {
      result.status = 'NO_SSL';
    } else if (result.loadSpeedMs > 5000) {
      result.status = 'SLOW';
    } else if (result.isOutdated) {
      result.status = 'OUTDATED';
    } else {
      result.status = 'GOOD';
    }
  } catch (error) {
    console.error(`Website analysis failed for ${url}:`, error);
    result.status = 'BROKEN';
    result.isWorking = false;
  }

  return result;
}

// Analyze a single business website
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { websiteAnalysis: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!business.websiteUrl) {
      // No website - ensure analysis exists
      const analysis = await prisma.websiteAnalysis.upsert({
        where: { businessId },
        create: {
          businessId,
          status: 'NO_WEBSITE',
          isWorking: false,
        },
        update: {
          status: 'NO_WEBSITE',
          isWorking: false,
        },
      });
      return NextResponse.json({ analysis });
    }

    const result = await analyzeWebsite(business.websiteUrl);

    const analysis = await prisma.websiteAnalysis.upsert({
      where: { businessId },
      create: {
        businessId,
        httpStatus: result.httpStatus,
        isWorking: result.isWorking,
        loadSpeedMs: result.loadSpeedMs,
        isMobileFriendly: result.isMobileFriendly,
        hasSSL: result.hasSSL,
        lastUpdated: result.lastUpdated,
        isOutdated: result.isOutdated,
        status: result.status,
      },
      update: {
        httpStatus: result.httpStatus,
        isWorking: result.isWorking,
        loadSpeedMs: result.loadSpeedMs,
        isMobileFriendly: result.isMobileFriendly,
        hasSSL: result.hasSSL,
        lastUpdated: result.lastUpdated,
        isOutdated: result.isOutdated,
        status: result.status,
      },
    });

    // Recalculate lead score with updated website status
    const { calculateLeadScore } = await import('@/lib/scoring');
    const scoreResult = calculateLeadScore({
      websiteUrl: business.websiteUrl,
      websiteStatus: result.status,
      rating: business.rating,
      reviewCount: business.reviewCount,
      category: business.category,
      area: business.area,
      photoCount: business.photoCount,
      priceLevel: business.priceLevel,
    });

    await prisma.leadScore.upsert({
      where: { businessId },
      create: {
        businessId,
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

    return NextResponse.json({ analysis, score: scoreResult });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}

// Bulk analyze all businesses with websites
export async function PUT() {
  try {
    const businesses = await prisma.business.findMany({
      where: { websiteUrl: { not: null } },
      select: { id: true, websiteUrl: true },
    });

    let analyzed = 0;
    for (const biz of businesses) {
      if (!biz.websiteUrl) continue;
      try {
        const result = await analyzeWebsite(biz.websiteUrl);
        await prisma.websiteAnalysis.upsert({
          where: { businessId: biz.id },
          create: {
            businessId: biz.id,
            httpStatus: result.httpStatus,
            isWorking: result.isWorking,
            loadSpeedMs: result.loadSpeedMs,
            isMobileFriendly: result.isMobileFriendly,
            hasSSL: result.hasSSL,
            lastUpdated: result.lastUpdated,
            isOutdated: result.isOutdated,
            status: result.status,
          },
          update: {
            httpStatus: result.httpStatus,
            isWorking: result.isWorking,
            loadSpeedMs: result.loadSpeedMs,
            isMobileFriendly: result.isMobileFriendly,
            hasSSL: result.hasSSL,
            lastUpdated: result.lastUpdated,
            isOutdated: result.isOutdated,
            status: result.status,
          },
        });
        analyzed++;
      } catch {
        continue;
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    }

    return NextResponse.json({ analyzed, total: businesses.length });
  } catch (error) {
    console.error('Bulk analyze error:', error);
    return NextResponse.json({ error: 'Bulk analysis failed' }, { status: 500 });
  }
}
