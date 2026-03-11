'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Map as MapIcon, Filter, Phone, Star, Globe,
  ExternalLink, Copy, Loader2, MapPin
} from 'lucide-react';

// Dynamic import for Leaflet (SSR incompatible)
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);

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
  latitude: number | null;
  longitude: number | null;
  websiteAnalysis: { status: string } | null;
  leadScore: { score: number; classification: string } | null;
}

export default function MapPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [icons, setIcons] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // Load Leaflet CSS and create icons client-side only
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    import('leaflet').then((L) => {
      const createIcon = (color: string) =>
        new L.Icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

      setIcons({
        red: createIcon('red'),
        green: createIcon('green'),
        yellow: createIcon('orange'),
        blue: createIcon('blue'),
      });
      setMapReady(true);
    });
  }, []);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '500',
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/businesses?${params}`);
      const data = await res.json();
      setBusinesses((data.businesses || []).filter(
        (b: Business) => b.latitude && b.longitude
      ));
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  function getMarkerIcon(status: string) {
    if (!icons) return undefined;
    switch (status) {
      case 'NO_WEBSITE': return icons.red;
      case 'BROKEN': return icons.red;
      case 'OUTDATED': return icons.yellow;
      case 'SLOW': return icons.yellow;
      case 'GOOD': return icons.green;
      default: return icons.blue;
    }
  }

  const filters = [
    { id: '', label: 'All', color: 'bg-blue-500' },
    { id: 'NO_WEBSITE', label: 'No Website', color: 'bg-red-500' },
    { id: 'BROKEN', label: 'Broken', color: 'bg-orange-500' },
    { id: 'OUTDATED', label: 'Outdated', color: 'bg-yellow-500' },
    { id: 'GOOD', label: 'Good', color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapIcon className="w-7 h-7 text-[rgb(var(--primary))]" />
            Map View
          </h1>
          <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
            {businesses.length} businesses with location data
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${statusFilter === f.id
                ? 'bg-[rgb(var(--primary))] text-white shadow-md'
                : 'bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]'
              }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${f.color}`} />
            {f.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[rgb(var(--muted-foreground))]">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> No Website / Broken</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> Outdated</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Good Website</span>
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-[rgb(var(--border))] overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
        {loading || !mapReady ? (
          <div className="h-full flex items-center justify-center bg-[rgb(var(--card))]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[rgb(var(--primary))]" />
              <p className="text-sm text-[rgb(var(--muted-foreground))]">Loading map...</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[28.4595, 77.0266]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {businesses.map(biz => (
              biz.latitude && biz.longitude ? (
                <Marker
                  key={biz.id}
                  position={[biz.latitude, biz.longitude]}
                  icon={getMarkerIcon(biz.websiteAnalysis?.status || 'NO_WEBSITE') as L.Icon}
                >
                  <Popup>
                    <div className="min-w-[200px] p-1">
                      <h3 className="font-bold text-sm mb-1">{biz.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">{biz.category}</p>
                      {biz.rating && (
                        <p className="text-xs mb-1 flex items-center gap-1">
                          ⭐ {biz.rating} ({biz.reviewCount} reviews)
                        </p>
                      )}
                      {biz.phoneNumbers && (
                        <p className="text-xs mb-1">📞 {biz.phoneNumbers}</p>
                      )}
                      {biz.address && (
                        <p className="text-xs text-gray-400 mb-2">📍 {biz.address}</p>
                      )}
                      <div className="flex gap-1 mt-2">
                        {biz.phoneNumbers && (
                          <a href={`tel:${biz.phoneNumbers.split(' / ')[0]}`}
                            className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
                            Call
                          </a>
                        )}
                        {biz.googleMapsLink && (
                          <a href={biz.googleMapsLink} target="_blank" rel="noopener"
                            className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs font-medium">
                            Maps
                          </a>
                        )}
                        <a href={`/leads/${biz.id}`}
                          className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs font-medium">
                          Details
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
