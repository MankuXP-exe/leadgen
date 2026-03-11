'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, Search, Globe, AlertTriangle, Clock, CheckCircle,
  Star, Phone, ExternalLink, Copy, MapPin, ChevronLeft, ChevronRight
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

const tabs = [
  { id: '', label: 'All', icon: Users, color: 'text-[rgb(var(--primary))]' },
  { id: 'NO_WEBSITE', label: 'No Website', icon: Globe, color: 'text-red-400' },
  { id: 'BROKEN', label: 'Broken', icon: AlertTriangle, color: 'text-orange-400' },
  { id: 'OUTDATED', label: 'Outdated', icon: Clock, color: 'text-yellow-400' },
  { id: 'GOOD', label: 'Good Website', icon: CheckCircle, color: 'text-emerald-400' },
];

export default function LeadsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: activeTab,
        sortBy: 'score',
        sortOrder: 'desc',
      });

      const res = await fetch(`/api/businesses?${params}`);
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
    setLoading(false);
  }, [page, search, activeTab]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      NO_WEBSITE: 'bg-red-500/20 text-red-400 border-red-500/30',
      BROKEN: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      OUTDATED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      GOOD: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    const labels: Record<string, string> = {
      NO_WEBSITE: 'No Website',
      BROKEN: 'Broken',
      OUTDATED: 'Outdated',
      GOOD: 'Good',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${styles[status] || styles.NO_WEBSITE}`}>
        {labels[status] || status}
      </span>
    );
  }

  function getScoreBadge(score: number, classification: string) {
    const colors: Record<string, string> = {
      HOT: 'bg-red-500/20 text-red-400',
      HIGH: 'bg-orange-500/20 text-orange-400',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400',
      LOW: 'bg-gray-500/20 text-gray-400',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${colors[classification] || colors.LOW}`}>
        {score} {classification === 'HOT' ? '🔥' : ''}
      </span>
    );
  }

  async function copyPhones(phones: string) {
    await navigator.clipboard.writeText(phones);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Lead Lists</h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
          {total} businesses found • Sorted by lead score
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-[rgb(var(--primary))] text-white shadow-lg'
                : 'bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]'
              }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--muted-foreground))]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, address, phone..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))]
                     text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all"
          id="search-leads-input"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.5)]">
                    <th className="text-left p-4 font-semibold">Business</th>
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Rating</th>
                    <th className="text-left p-4 font-semibold">Phone Numbers</th>
                    <th className="text-left p-4 font-semibold">Website</th>
                    <th className="text-left p-4 font-semibold">Score</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map(biz => (
                    <tr key={biz.id} className="table-row border-b border-[rgb(var(--border)/0.5)]">
                      <td className="p-4">
                        <p className="font-medium">{biz.name}</p>
                        <p className="text-xs text-[rgb(var(--muted-foreground))] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {biz.area || biz.city}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                          {biz.category}
                        </span>
                      </td>
                      <td className="p-4">
                        {biz.rating ? (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{biz.rating}</span>
                            <span className="text-[rgb(var(--muted-foreground))] text-xs">({biz.reviewCount})</span>
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        {biz.phoneNumbers ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[rgb(var(--muted-foreground))]" />
                            <span className="text-xs max-w-[200px] truncate">{biz.phoneNumbers}</span>
                            <button onClick={() => copyPhones(biz.phoneNumbers || '')} className="p-1 rounded hover:bg-[rgb(var(--muted))]">
                              <Copy className="w-3 h-3 text-[rgb(var(--muted-foreground))]" />
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(biz.websiteAnalysis?.status || 'NO_WEBSITE')}
                      </td>
                      <td className="p-4">
                        {biz.leadScore && getScoreBadge(biz.leadScore.score, biz.leadScore.classification)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {biz.phoneNumbers && (
                            <a href={`https://wa.me/${biz.phoneNumbers.split(' / ')[0].replace(/\D/g, '')}`}
                               target="_blank" rel="noopener"
                               className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all">
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {biz.googleMapsLink && (
                            <a href={biz.googleMapsLink} target="_blank" rel="noopener"
                               className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {businesses.map(biz => (
              <div key={biz.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{biz.name}</p>
                    <p className="text-xs text-[rgb(var(--muted-foreground))]">{biz.area || biz.city}</p>
                  </div>
                  {biz.leadScore && getScoreBadge(biz.leadScore.score, biz.leadScore.classification)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                    {biz.category}
                  </span>
                  {getStatusBadge(biz.websiteAnalysis?.status || 'NO_WEBSITE')}
                  {biz.rating && (
                    <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-xs flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-500" /> {biz.rating}
                    </span>
                  )}
                </div>
                {biz.phoneNumbers && (
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-3 h-3 text-[rgb(var(--muted-foreground))]" />
                    <span className="flex-1 truncate">{biz.phoneNumbers}</span>
                    <button onClick={() => copyPhones(biz.phoneNumbers || '')} className="p-1 rounded hover:bg-[rgb(var(--muted))]">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-[rgb(var(--border)/0.5)]">
                  {biz.phoneNumbers && (
                    <>
                      <a href={`tel:${biz.phoneNumbers.split(' / ')[0]}`}
                         className="flex-1 text-center py-2 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                        📞 Call
                      </a>
                      <a href={`https://wa.me/${biz.phoneNumbers.split(' / ')[0].replace(/\D/g, '')}`}
                         target="_blank" rel="noopener"
                         className="flex-1 text-center py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium">
                        💬 WhatsApp
                      </a>
                    </>
                  )}
                  {biz.googleMapsLink && (
                    <a href={biz.googleMapsLink} target="_blank" rel="noopener"
                       className="flex-1 text-center py-2 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium">
                      📍 Maps
                    </a>
                  )}
                </div>
              </div>
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
              <span className="px-4 py-2 text-sm font-medium">
                Page {page} of {totalPages}
              </span>
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
              <Users className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--muted-foreground))] opacity-50" />
              <p className="text-lg font-medium">No leads found</p>
              <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">Run a scan to find businesses</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
