'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Star, Phone, Globe, MapPin,
  Copy, ExternalLink, Clock, Shield, Smartphone,
  Zap, AlertTriangle, CheckCircle, FileText, Calendar,
  Send, Trash2, Plus, MessageSquare
} from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

interface Business {
  id: string;
  name: string;
  category: string;
  address: string | null;
  city: string | null;
  area: string | null;
  rating: number | null;
  reviewCount: number | null;
  phoneNumbers: string | null;
  email: string | null;
  websiteUrl: string | null;
  googleMapsLink: string | null;
  openingHours: string | null;
  priceLevel: string | null;
  source: string | null;
  latitude: number | null;
  longitude: number | null;
  photoCount: number | null;
  createdAt: string;
  websiteAnalysis: {
    httpStatus: number | null;
    isWorking: boolean;
    loadSpeedMs: number | null;
    isMobileFriendly: boolean;
    hasSSL: boolean;
    lastUpdated: string | null;
    isOutdated: boolean;
    status: string;
  } | null;
  leadScore: {
    score: number;
    classification: string;
    factors: string;
  } | null;
  notes: { id: string; content: string; createdAt: string }[];
  followUps: { id: string; date: string; status: string; notes: string | null }[];
}

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetchBusiness();
  }, [resolvedParams.id]);

  async function fetchBusiness() {
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${resolvedParams.id}`);
      const data = await res.json();
      setBusiness(data.business);
    } catch (err) {
      console.error('Failed to fetch business:', err);
    }
    setLoading(false);
  }

  async function analyzeWebsite() {
    if (!business) return;
    setAnalyzing(true);
    try {
      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id }),
      });
      await fetchBusiness();
    } catch (err) {
      console.error('Analysis failed:', err);
    }
    setAnalyzing(false);
  }

  async function addNote() {
    if (!business || !newNote.trim()) return;
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, content: newNote }),
      });
      setNewNote('');
      await fetchBusiness();
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  }

  async function deleteNote(noteId: string) {
    try {
      await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
      await fetchBusiness();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  }

  async function addFollowUp() {
    if (!business || !followUpDate) return;
    try {
      await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          date: followUpDate,
          notes: followUpNotes,
        }),
      });
      setFollowUpDate('');
      setFollowUpNotes('');
      await fetchBusiness();
    } catch (err) {
      console.error('Failed to add follow-up:', err);
    }
  }

  async function updateFollowUp(id: string, status: string) {
    try {
      await fetch('/api/followups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      await fetchBusiness();
    } catch (err) {
      console.error('Failed to update follow-up:', err);
    }
  }

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-[rgb(var(--muted))] rounded-lg animate-pulse" />
        <div className="h-64 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
          <div className="h-48 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--muted-foreground))] opacity-50" />
        <p className="text-lg font-medium">Business not found</p>
        <Link href="/leads" className="text-sm text-[rgb(var(--primary))] mt-2 hover:underline">
          Back to leads
        </Link>
      </div>
    );
  }

  const factors = business.leadScore?.factors ? JSON.parse(business.leadScore.factors) : {};
  const scoreColor = {
    HOT: 'text-red-500',
    HIGH: 'text-orange-500',
    MEDIUM: 'text-yellow-500',
    LOW: 'text-gray-400',
  }[business.leadScore?.classification || 'LOW'];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <Link
          href="/leads"
          className="flex items-center gap-2 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
      </div>

      {/* Business Header Card */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{business.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] text-xs font-medium">
                    {business.category}
                  </span>
                  {business.source && (
                    <span className="text-xs text-[rgb(var(--muted-foreground))]">via {business.source}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {business.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-[rgb(var(--muted-foreground))] mt-0.5 flex-shrink-0" />
                  <span>{business.address}</span>
                </div>
              )}
              {business.rating && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{business.rating}</span>
                  <span className="text-[rgb(var(--muted-foreground))]">({business.reviewCount} reviews)</span>
                </div>
              )}
              {business.phoneNumbers && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                  <span className="flex-1 truncate">{business.phoneNumbers}</span>
                  <button
                    onClick={() => copyText(business.phoneNumbers || '', 'phone')}
                    className="p-1 rounded hover:bg-[rgb(var(--muted))] transition-colors"
                  >
                    <Copy className={`w-3.5 h-3.5 ${copied === 'phone' ? 'text-emerald-500' : 'text-[rgb(var(--muted-foreground))]'}`} />
                  </button>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Send className="w-4 h-4 text-[rgb(var(--muted-foreground))]" />
                  <a href={`mailto:${business.email}`} className="text-[rgb(var(--primary))] hover:underline">
                    {business.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Score */}
          {business.leadScore && (
            <div className="text-center px-6 py-4 rounded-2xl bg-[rgb(var(--muted)/0.5)]">
              <p className={`text-4xl font-black ${scoreColor}`}>{business.leadScore.score}</p>
              <p className="text-xs font-bold mt-1">
                {business.leadScore.classification === 'HOT' ? '🔥 HOT LEAD' : business.leadScore.classification}
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-[rgb(var(--border))]">
          {business.phoneNumbers && (
            <>
              <a
                href={`tel:${business.phoneNumbers.split(' / ')[0]}`}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[rgb(var(--primary)/0.1)] text-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/0.2)] transition-colors"
              >
                <Phone className="w-4 h-4" /> Call
              </a>
              <a
                href={`https://wa.me/91${business.phoneNumbers.split(' / ')[0].replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>
            </>
          )}
          {business.googleMapsLink && (
            <a
              href={business.googleMapsLink}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Google Maps
            </a>
          )}
          {business.websiteUrl && (
            <a
              href={business.websiteUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
            >
              <Globe className="w-4 h-4" /> Visit Website
            </a>
          )}
          <button
            onClick={analyzeWebsite}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> {analyzing ? 'Analyzing...' : 'Analyze Website'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Website Analysis */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[rgb(var(--primary))]" />
            Website Analysis
          </h2>

          {business.websiteAnalysis ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)]">
                <span className="text-sm">Status</span>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(business.websiteAnalysis.status)}`}>
                  {getStatusLabel(business.websiteAnalysis.status)}
                </span>
              </div>
              {business.websiteAnalysis.httpStatus ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)]">
                  <span className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" /> HTTP Status
                  </span>
                  <span className={`text-sm font-bold ${business.websiteAnalysis.httpStatus < 400 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {business.websiteAnalysis.httpStatus}
                  </span>
                </div>
              ) : null}
              {business.websiteAnalysis.loadSpeedMs ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)]">
                  <span className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Load Speed
                  </span>
                  <span className={`text-sm font-bold ${business.websiteAnalysis.loadSpeedMs < 2000 ? 'text-emerald-500' : business.websiteAnalysis.loadSpeedMs < 5000 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {business.websiteAnalysis.loadSpeedMs}ms
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)]">
                <span className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" /> SSL Certificate
                </span>
                {business.websiteAnalysis.hasSSL ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)]">
                <span className="text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Mobile Friendly
                </span>
                {business.websiteAnalysis.isMobileFriendly ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[rgb(var(--muted-foreground))]">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {business.websiteUrl ? 'Click "Analyze Website" to check' : 'No website found'}
              </p>
            </div>
          )}
        </div>

        {/* Lead Score Breakdown */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[rgb(var(--primary))]" />
            Score Breakdown
          </h2>

          {Object.keys(factors).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(factors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)]">
                  <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className={`text-sm font-bold ${(value as number) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {(value as number) > 0 ? '+' : ''}{value as number}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--primary)/0.1)] mt-3">
                <span className="text-sm font-bold">Total Score</span>
                <span className={`text-lg font-black ${scoreColor}`}>
                  {business.leadScore?.score || 0}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-[rgb(var(--muted-foreground))]">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scoring data yet</p>
            </div>
          )}
        </div>

        {/* CRM Notes */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[rgb(var(--primary))]" />
            Notes
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 px-3 py-2 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button
              onClick={addNote}
              disabled={!newNote.trim()}
              className="px-3 py-2 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {business.notes.length > 0 ? business.notes.map(note => (
              <div key={note.id} className="flex items-start justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)] group">
                <div className="flex-1">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            )) : (
              <p className="text-center text-sm text-[rgb(var(--muted-foreground))] py-4">No notes yet</p>
            )}
          </div>
        </div>

        {/* Follow-ups */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[rgb(var(--primary))]" />
            Follow-ups
          </h2>

          <div className="space-y-2 mb-4">
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Follow-up notes..."
                className="flex-1 px-3 py-2 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
              />
              <button
                onClick={addFollowUp}
                disabled={!followUpDate}
                className="px-3 py-2 rounded-xl gradient-primary text-white text-sm font-medium disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {business.followUps.length > 0 ? business.followUps.map(fu => (
              <div key={fu.id} className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)]">
                <div className="flex-1">
                  <p className="text-sm font-medium">{new Date(fu.date).toLocaleDateString()}</p>
                  {fu.notes && <p className="text-xs text-[rgb(var(--muted-foreground))]">{fu.notes}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {fu.status === 'PENDING' ? (
                    <button
                      onClick={() => updateFollowUp(fu.id, 'COMPLETED')}
                      className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-medium hover:bg-emerald-500/20"
                    >
                      Complete
                    </button>
                  ) : (
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      ✓ Done
                    </span>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-center text-sm text-[rgb(var(--muted-foreground))] py-4">No follow-ups scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
