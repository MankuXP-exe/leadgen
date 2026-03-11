// Export API - CSV / Excel / PDF
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status') || '';
    const classification = searchParams.get('classification') || '';
    const category = searchParams.get('category') || '';

    const where: Record<string, unknown> = {};
    if (status) where.websiteAnalysis = { status };
    if (classification) where.leadScore = { classification };
    if (category) where.category = { contains: category };

    const businesses = await prisma.business.findMany({
      where,
      include: { websiteAnalysis: true, leadScore: true },
      orderBy: { leadScore: { score: 'desc' } },
    });

    const rows = businesses.map(b => ({
      'Category': b.category,
      'Business Name': b.name,
      'Rating': b.rating || '-',
      'Reviews': b.reviewCount || 0,
      'Phone Numbers': b.phoneNumbers || '-',
      'Email': b.email || '-',
      'Website': b.websiteUrl || 'No Website',
      'Website Status': b.websiteAnalysis?.status || 'NO_WEBSITE',
      'Lead Score': b.leadScore?.score || 0,
      'Classification': b.leadScore?.classification || 'LOW',
      'Address': b.address || '-',
      'City': b.city || '-',
      'Area': b.area || '-',
      'Google Maps': b.googleMapsLink || '-',
      'Source': b.source || '-',
    }));

    if (format === 'csv') {
      const headers = Object.keys(rows[0] || {});
      const csvLines = [headers.join(',')];
      for (const row of rows) {
        const values = headers.map(h => {
          const val = String((row as Record<string, unknown>)[h] || '');
          return `"${val.replace(/"/g, '""')}"`;
        });
        csvLines.push(values.join(','));
      }
      const csv = csvLines.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=leads.csv',
        },
      });
    }

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Leads');

      // Style column widths
      ws['!cols'] = [
        { wch: 15 }, { wch: 30 }, { wch: 8 }, { wch: 8 },
        { wch: 35 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
        { wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 15 },
        { wch: 15 }, { wch: 40 }, { wch: 20 },
      ];

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename=leads.xlsx',
        },
      });
    }

    if (format === 'whatsapp') {
      // Format for WhatsApp outreach
      const lines = businesses
        .filter(b => b.phoneNumbers)
        .map(b => {
          const phones = (b.phoneNumbers || '').split(' / ');
          return phones.map(p => `${b.name} | ${b.category} | ${p.trim()}`).join('\n');
        });

      return new NextResponse(lines.join('\n'), {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename=whatsapp_leads.txt',
        },
      });
    }

    if (format === 'calling') {
      // Bulk calling list
      const lines = businesses
        .filter(b => b.phoneNumbers)
        .map(b => `${b.name}\t${b.phoneNumbers}\t${b.category}\t${b.leadScore?.classification || 'LOW'}`);

      return new NextResponse(['Name\tPhone Numbers\tCategory\tPriority', ...lines].join('\n'), {
        headers: {
          'Content-Type': 'text/tab-separated-values',
          'Content-Disposition': 'attachment; filename=calling_list.tsv',
        },
      });
    }

    if (format === 'email') {
      // Cold email export
      const lines = businesses
        .filter(b => b.email)
        .map(b => `${b.email},${b.name},${b.category}`);

      return new NextResponse(['Email,Business Name,Category', ...lines].join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=email_list.csv',
        },
      });
    }

    // Default: JSON
    return NextResponse.json({ businesses: rows });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
