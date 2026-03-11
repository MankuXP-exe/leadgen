'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Flame, Star, Phone, Globe, Copy, MapPin,
  ExternalLink, ChevronLeft, ChevronRight, Sparkles,
  MessageSquare, TrendingUp
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
  source: string | null;
  websiteAnalysis: { status: string } | null;
  leadScore: { score: number; classification: string } | null;
}

export default function HotLeadsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(70);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        minScore: minScore.toString(),
        sortBy: 'score',
        sortOrder: 'desc',
      });

      const res = await fetch(`/api/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch hot leads:', err);
    }
    setLoading(false);
  }, [page, minScore]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Flame className="w-8 h-8 text-red-500" />
            Hot Leads
          </h1>
          <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
            Top {total} businesses most likely to buy a website
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[rgb(var(--muted-foreground))]">Min Score:</span>
          <div className="flex gap-1">
            {[90, 70, 50, 0].map(score => (
              <button
                key={score}
                onClick={() => { setMinScore(score); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${minScore === score
                    ? 'gradient-primary text-white shadow-md'
                    : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--primary)/0.15)]'
                  }`}
              >
                {score}+
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Recommendation</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))]">
              These businesses have the highest probability of buying a website based on rating, reviews, category, and web presence analysis.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
          ))}
        </div>
      ) : (
        <>
          {/* Lead Cards */}
          <div className="space-y-3">
            {businesses.map((biz, index) => (
              <Link
                key={biz.id}
                href={`/leads/${biz.id}`}
                className="block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-5 hover:border-[rgb(var(--primary)/0.5)] transition-all stat-card"
              >
                <div className="flex items-start gap-4">
                  {/* Rank */}
                  <div className="hidden sm:flex w-10 h-10 rounded-xl gradient-primary items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    #{(page - 1) * 20 + index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
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
                        </div>
                      </div>
                      {/* Score */}
                      <div className="text-center flex-shrink-0">
                        <p className={`text-2xl font-black ${
                          (biz.leadScore?.score || 0) >= 90 ? 'text-red-500' :
                          (biz.leadScore?.score || 0) >= 70 ? 'text-orange-500' : 'text-yellow-500'
                        }`}>
                          {biz.leadScore?.score || 0}
                        </p>
                        <p className="text-[10px] font-bold text-[rgb(var(--muted-foreground))]">
                          {biz.leadScore?.classification === 'HOT' ? '🔥 HOT' : biz.leadScore?.classification}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {biz.rating && (
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          {biz.rating} ({biz.reviewCount})
                        </span>
                      )}
                      {!biz.websiteUrl && (
                        <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-xs font-medium">
                          No Website
                        </span>
                      )}
                      {biz.websiteUrl && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {biz.websiteAnalysis?.status || 'GOOD'}
                        </span>
                      )}
                      {biz.phoneNumbers && (
                        <span className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
                          <Phone className="w-3 h-3" /> {biz.phoneNumbers.split(' / ')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions (desktop) */}
                  <div className="hidden md:flex items-center gap-1 flex-shrink-0" onClick={e => e.preventDefault()}>
                    {biz.phoneNumbers && (
                      <>
                        <a
                          href={`tel:${biz.phoneNumbers.split(' / ')[0]}`}
                          className="p-2 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)] transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://wa.me/91${biz.phoneNumbers.split(' / ')[0].replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener"
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(biz.phoneNumbers || '')}
                          className="p-2 rounded-lg bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted)/0.8)] transition-colors"
                          title="Copy Phone"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {biz.googleMapsLink && (
                      <a
                        href={biz.googleMapsLink}
                        target="_blank"
                        rel="noopener"
                        className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
                        title="Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Mobile Quick Actions */}
                <div className="flex gap-2 mt-3 md:hidden" onClick={e => e.preventDefault()}>
                  {biz.phoneNumbers && (
                    <>
                      <a href={`tel:${biz.phoneNumbers.split(' / ')[0]}`}
                        className="flex-1 text-center py-2 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                        📞 Call
                      </a>
                      <a href={`https://wa.me/91${biz.phoneNumbers.split(' / ')[0].replace(/\D/g, '')}`}
                        target="_blank" rel="noopener"
                        className="flex-1 text-center py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                        💬 WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {businesses.length === 0 && (
            <div className="text-center py-16">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--muted-foreground))] opacity-50" />
              <p className="text-lg font-medium">No hot leads found</p>
              <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">Run a scan to discover businesses</p>
              <Link href="/search" className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl gradient-primary text-white text-sm font-medium">
                Start Scanning
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
