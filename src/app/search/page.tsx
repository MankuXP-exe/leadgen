'use client';

import { useState, useEffect } from 'react';
import {
  Search, MapPin, Filter, Loader2, CheckCircle2,
  Building2, Star, Phone, Globe, ExternalLink, ArrowRight, Navigation
} from 'lucide-react';
import { DEFAULT_LOCATIONS, BUSINESS_CATEGORIES } from '@/lib/utils';

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

export default function SearchPage() {
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lon: number} | null>(null);
  const [radius, setRadius] = useState('10');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['serpapi', 'geoapify', 'foursquare']);
  const [results, setResults] = useState<Business[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanStats, setScanStats] = useState<{ total: number; new: number; merged: number } | null>(null);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; currentCategory: string } | null>(null);

  const providers = [
    { id: 'serpapi', label: 'SerpAPI (Google Maps)', color: 'bg-blue-500' },
    { id: 'foursquare', label: 'Foursquare', color: 'bg-purple-500' },
    { id: 'geoapify', label: 'Geoapify', color: 'bg-green-500' },
    { id: 'apify', label: 'Apify', color: 'bg-orange-500' },
  ];

  useEffect(() => {
    // Try to auto-locate on page load if permitted
    if (navigator.geolocation && !location && !coordinates) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation('Current Location');
        setCoordinates({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }, () => {
        // Silently fail if they don't allow it
      });
    }
  }, []);

  function toggleCategory(cat: string) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  function toggleProvider(prov: string) {
    setSelectedProviders(prev =>
      prev.includes(prov) ? prev.filter(p => p !== prov) : [...prev, prov]
    );
  }

  function selectAllCategories() {
    setSelectedCategories(BUSINESS_CATEGORIES);
  }

  async function startScan() {
    if (!location || selectedCategories.length === 0) return;
    setScanning(true);
    setScanStats(null);
    setResults([]);

    let accumulatedResults: Business[] = [];
    let totalStats = { total: 0, new: 0, merged: 0 };

    for (let i = 0; i < selectedCategories.length; i++) {
      const category = selectedCategories[i];
      setScanProgress({ current: i + 1, total: selectedCategories.length, currentCategory: category });

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location,
            radius,
            lat: coordinates?.lat,
            lon: coordinates?.lon,
            categories: [category],
            providers: selectedProviders,
          }),
        });
        const data = await res.json();
        
        if (data.results) {
          accumulatedResults = [...accumulatedResults, ...data.results];
          const uniqueResults = Array.from(new Map(accumulatedResults.map(item => [item.id, item])).values());
          uniqueResults.sort((a, b) => (b.leadScore?.score || 0) - (a.leadScore?.score || 0));
          setResults(uniqueResults);
        }
        
        if (data.stats) {
          totalStats.total += data.stats.total || 0;
          totalStats.new += data.stats.new || 0;
          totalStats.merged += data.stats.merged || 0;
          setScanStats({ ...totalStats });
        }
      } catch (err) {
        console.error(`Scan error for ${category}:`, err);
      }
    }
    
    setScanProgress(null);
    setScanning(false);
  }

  function getScoreBadge(score: number, classification: string) {
    const colors: Record<string, string> = {
      HOT: 'bg-red-500/20 text-red-400 border-red-500/30',
      HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      LOW: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${colors[classification] || colors.LOW}`}>
        {score} • {classification === 'HOT' ? '🔥 HOT' : classification}
      </span>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Search Leads</h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
          Scan businesses across multiple data sources
        </p>
      </div>

      {/* Search Controls */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 space-y-6">
        {/* Location */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-3">
            <MapPin className="w-4 h-4 text-[rgb(var(--primary))]" />
            Location & Radius
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setCoordinates(null);
              }}
              placeholder="Enter city, area, or let us find you..."
              className="flex-1 px-4 py-3 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))]
                         text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all"
              id="location-input"
            />
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setLocation('Current Location');
                    setCoordinates({ lat: pos.coords.latitude, lon: pos.coords.longitude });
                  });
                } else {
                  alert('Geolocation is not supported by this browser.');
                }
              }}
              className="px-4 py-3 rounded-xl bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] font-medium
                         hover:bg-[rgb(var(--primary)/0.2)] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              title="Use my current location"
            >
              <Navigation className="w-4 h-4" />
              Near Me
            </button>
            <select
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="px-4 py-3 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))]
                         text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))] transition-all sm:w-[150px]"
            >
              <option value="5">5 km radius</option>
              <option value="10">10 km radius</option>
              <option value="20">20 km radius</option>
              <option value="50">50 km radius</option>
              <option value="100">100 km radius</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {DEFAULT_LOCATIONS.map(loc => (
              <button
                key={loc}
                onClick={() => {
                  setLocation(loc);
                  setCoordinates(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${location === loc
                    ? 'bg-[rgb(var(--primary))] text-white'
                    : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--primary)/0.15)]'
                  }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="w-4 h-4 text-[rgb(var(--primary))]" />
              Business Categories
            </label>
            <button
              onClick={selectAllCategories}
              className="text-xs text-[rgb(var(--primary))] hover:underline font-medium"
            >
              Select All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${selectedCategories.includes(cat)
                    ? 'bg-[rgb(var(--primary))] text-white shadow-md'
                    : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--primary)/0.15)]'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Providers */}
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Search className="w-4 h-4 text-[rgb(var(--primary))]" />
            Data Sources
          </label>
          <div className="flex flex-wrap gap-3">
            {providers.map(p => (
              <button
                key={p.id}
                onClick={() => toggleProvider(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${selectedProviders.includes(p.id)
                    ? 'bg-[rgb(var(--primary))] text-white shadow-md'
                    : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--primary)/0.15)]'
                  }`}
              >
                <div className={`w-2 h-2 rounded-full ${p.color}`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scan Button */}
        <button
          onClick={startScan}
          disabled={scanning || !location || selectedCategories.length === 0}
          className="w-full sm:w-auto flex flex-col items-center justify-center gap-1 px-8 py-3 rounded-xl text-sm font-bold
                     gradient-primary text-white hover:opacity-90 transition-all shadow-lg shadow-[rgb(var(--primary)/0.3)]
                     disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
          id="start-scan-btn"
        >
          {scanning ? (
            <>
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Scanning {scanProgress?.currentCategory}...</span>
              </div>
              {scanProgress && (
                <span className="text-[10px] font-medium opacity-80">
                  Category {scanProgress.current} of {scanProgress.total}
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span>Start Scan</span>
            </div>
          )}
        </button>
      </div>

      {/* Scan Stats */}
      {scanStats && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex flex-wrap items-center gap-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-sm font-medium">
            Scan complete: <strong>{scanStats.total}</strong> found,
            <strong className="text-emerald-400"> {scanStats.new}</strong> new,
            <strong className="text-yellow-400"> {scanStats.merged}</strong> merged
          </span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[rgb(var(--primary))]" />
            Results ({results.length})
          </h2>

          {/* Desktop Table */}
          <div className="hidden md:block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--muted)/0.5)]">
                    <th className="text-left p-4 font-semibold">Business</th>
                    <th className="text-left p-4 font-semibold">Category</th>
                    <th className="text-left p-4 font-semibold">Rating</th>
                    <th className="text-left p-4 font-semibold">Phone</th>
                    <th className="text-left p-4 font-semibold">Website</th>
                    <th className="text-left p-4 font-semibold">Score</th>
                    <th className="text-left p-4 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(biz => (
                    <tr key={biz.id} className="table-row border-b border-[rgb(var(--border)/0.5)]">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{biz.name}</p>
                          <p className="text-xs text-[rgb(var(--muted-foreground))]">{biz.address}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                          {biz.category}
                        </span>
                      </td>
                      <td className="p-4">
                        {biz.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {biz.rating} <span className="text-[rgb(var(--muted-foreground))]">({biz.reviewCount})</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {biz.phoneNumbers && (
                          <button
                            onClick={() => navigator.clipboard.writeText(biz.phoneNumbers || '')}
                            className="flex items-center gap-1 text-xs hover:text-[rgb(var(--primary))] transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            {biz.phoneNumbers?.split(' / ')[0]}
                            {biz.phoneNumbers && biz.phoneNumbers.includes(' / ') && (
                              <span className="text-[rgb(var(--muted-foreground))]">+{biz.phoneNumbers.split(' / ').length - 1}</span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        {biz.websiteUrl ? (
                          <a href={biz.websiteUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-emerald-500 text-xs hover:underline">
                            <Globe className="w-3 h-3" />
                            {biz.websiteAnalysis?.status || 'GOOD'}
                          </a>
                        ) : (
                          <span className="text-red-400 text-xs font-medium">No Website</span>
                        )}
                      </td>
                      <td className="p-4">
                        {biz.leadScore && getScoreBadge(biz.leadScore.score, biz.leadScore.classification)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[rgb(var(--muted-foreground))]">{biz.source}</span>
                          {biz.googleMapsLink && (
                            <a href={biz.googleMapsLink} target="_blank" rel="noopener">
                              <ExternalLink className="w-3 h-3 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--primary))]" />
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
            {results.map(biz => (
              <div key={biz.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{biz.name}</p>
                    <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">{biz.area || biz.city}</p>
                  </div>
                  {biz.leadScore && getScoreBadge(biz.leadScore.score, biz.leadScore.classification)}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                    {biz.category}
                  </span>
                  {biz.rating && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs">
                      <Star className="w-3 h-3 fill-yellow-500" /> {biz.rating} ({biz.reviewCount})
                    </span>
                  )}
                  {biz.websiteUrl ? (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">Has Website</span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs">No Website</span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-[rgb(var(--border)/0.5)]">
                  {biz.phoneNumbers && (
                    <a href={`tel:${biz.phoneNumbers.split(' / ')[0]}`} className="flex items-center gap-1 text-xs text-[rgb(var(--primary))]">
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  )}
                  {biz.googleMapsLink && (
                    <a href={biz.googleMapsLink} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
                      <MapPin className="w-3 h-3" /> Maps
                    </a>
                  )}
                  <a href={`/leads`} className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))] ml-auto">
                    Details <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
