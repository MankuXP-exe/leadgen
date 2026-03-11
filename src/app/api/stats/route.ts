// Dashboard stats API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalBusinesses,
      noWebsite,
      brokenWebsites,
      outdatedWebsites,
      goodWebsites,
      hotLeads,
      highLeads,
      mediumLeads,
      lowLeads,
      recentSearches,
      apiUsage,
    ] = await Promise.all([
      prisma.business.count(),
      prisma.websiteAnalysis.count({ where: { status: 'NO_WEBSITE' } }),
      prisma.websiteAnalysis.count({ where: { status: 'BROKEN' } }),
      prisma.websiteAnalysis.count({ where: { status: 'OUTDATED' } }),
      prisma.websiteAnalysis.count({ where: { status: 'GOOD' } }),
      prisma.leadScore.count({ where: { classification: 'HOT' } }),
      prisma.leadScore.count({ where: { classification: 'HIGH' } }),
      prisma.leadScore.count({ where: { classification: 'MEDIUM' } }),
      prisma.leadScore.count({ where: { classification: 'LOW' } }),
      prisma.searchHistory.findMany({
        orderBy: { searchedAt: 'desc' },
        take: 10,
      }),
      prisma.apiUsage.groupBy({
        by: ['provider', 'month'],
        _count: true,
        where: {
          month: new Date().toISOString().slice(0, 7),
        },
      }),
    ]);

    // Top categories
    const topCategories = await prisma.business.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    });

    // Score distribution
    const scoreDistribution = [
      { label: 'HOT (90-100)', value: hotLeads, color: '#ef4444' },
      { label: 'HIGH (70-89)', value: highLeads, color: '#f97316' },
      { label: 'MEDIUM (50-69)', value: mediumLeads, color: '#eab308' },
      { label: 'LOW (0-49)', value: lowLeads, color: '#6b7280' },
    ];

    // API usage with limits
    const apiLimits: Record<string, number> = {
      serpapi: 100,
      foursquare: 950,
      geoapify: 3000,
      locationiq: 5000,
      apify: 50,
    };

    const apiUsageFormatted = Object.entries(apiLimits).map(([provider, limit]) => {
      const usage = apiUsage.find(u => u.provider === provider);
      return {
        provider,
        used: usage?._count || 0,
        limit,
        percentage: usage ? Math.round((usage._count / limit) * 100) : 0,
      };
    });

    return NextResponse.json({
      stats: {
        totalBusinesses,
        noWebsite,
        brokenWebsites,
        outdatedWebsites,
        goodWebsites,
        hotLeads,
        highLeads,
        mediumLeads,
        lowLeads,
      },
      scoreDistribution,
      topCategories: topCategories.map(c => ({
        category: c.category,
        count: c._count,
      })),
      recentSearches,
      apiUsage: apiUsageFormatted,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
