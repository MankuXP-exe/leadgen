'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Globe, Clock, Shield, Zap,
  Phone, MapPin, ExternalLink, ChevronLeft, ChevronRight,
  RefreshCw, Copy, Star, Loader2
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  area: string;
  rating: number | null;
  reviewCount: number | null;
  phoneNumbers: string | null;
  websiteUrl: string | null;
  googleMapsLink: string | null;
  websiteAnalysis: {
    status: string;
    httpStatus: number | null;
    loadSpeedMs: number | null;
    hasSSL: boolean;
    isMobileFriendly: boolean;
  } | null;
  leadScore: { score: number; classification: string } | null;
}

const statusFilters = [
  { id: 'NO_WEBSITE', label: 'No Website', icon: Globe, color: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'BROKEN', label: 'Broken', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { id: 'OUTDATED', label: 'Outdated', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'SLOW', label: 'Slow', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'NO_SSL', label: 'No SSL', icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

export default function BrokenWebsitesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeStatus, setActiveStatus] = useState('NO_WEBSITE');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: activeStatus,
        sortBy: 'score',
        sortOrder: 'desc',
      });

      const res = await fetch(`/api/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
    setLoading(false);
  }, [page, activeStatus]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  async function bulkAnalyze() {
    setAnalyzing(true);
    try {
      await fetch('/api/analyze', { method: 'PUT' });
      await fetchBusinesses();
    } catch (err) {
      console.error('Bulk analysis failed:', err);
    }
    setAnalyzing(false);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-500" />
            Website Issues
          </h1>
          <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
            {total} businesses with website problems
          </p>
        </div>
        <button
          onClick={bulkAnalyze}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium gradient-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {analyzing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> Re-analyze All</>
          )}
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(sf => (
          <button
            key={sf.id}
            onClick={() => { setActiveStatus(sf.id); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeStatus === sf.id
                ? 'bg-[rgb(var(--primary))] text-white shadow-lg'
                : `${sf.bg} ${sf.color} border border-transparent hover:border-[rgb(var(--border))]`
              }`}
          >
            <sf.icon className={`w-4 h-4 ${activeStatus === sf.id ? 'text-white' : ''}`} />
            {sf.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
          ))}
        </div>
      ) : (
        <>
          {/* Results */}
          <div className="space-y-3">
            {businesses.map(biz => (
              <Link
                key={biz.id}
                href={`/leads/${biz.id}`}
                className="block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-5 hover:border-[rgb(var(--primary)/0.5)] transition-all stat-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{biz.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                        {biz.category}
                      </span>
                      <span className="text-xs text-[rgb(var(--muted-foreground))] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {biz.area || biz.city}
                      </span>
                      {biz.rating && (
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {biz.rating}
                        </span>
                      )}
                    </div>

                    {/* Website Issues Details */}
                    {biz.websiteUrl && biz.websiteAnalysis && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {biz.websiteAnalysis.httpStatus && biz.websiteAnalysis.httpStatus >= 400 && (
                          <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-xs">
                            HTTP {biz.websiteAnalysis.httpStatus}
                          </span>
                        )}
                        {biz.websiteAnalysis.loadSpeedMs && biz.websiteAnalysis.loadSpeedMs > 5000 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs">
                            {biz.websiteAnalysis.loadSpeedMs}ms load
                          </span>
                        )}
                        {!biz.websiteAnalysis.hasSSL && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-xs">
                            No SSL
                          </span>
                        )}
                        {!biz.websiteAnalysis.isMobileFriendly && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs">
                            Not Mobile-Friendly
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.preventDefault()}>
                    {biz.phoneNumbers && (
                      <>
                        <a href={`tel:${biz.phoneNumbers.split(' / ')[0]}`}
                          className="p-2 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)]">
                          <Phone className="w-4 h-4" />
                        </a>
                        <button onClick={() => navigator.clipboard.writeText(biz.phoneNumbers || '')}
                          className="p-2 rounded-lg bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted)/0.8)]">
                          <Copy className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {biz.websiteUrl && (
                      <a href={biz.websiteUrl} target="_blank" rel="noopener"
                        className="p-2 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {businesses.length === 0 && (
            <div className="text-center py-16">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--muted-foreground))] opacity-50" />
              <p className="text-lg font-medium">No businesses found with this status</p>
              <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">Run a scan to discover businesses</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
