'use client';

import { useEffect, useState } from 'react';
import {
  Building2, Globe, AlertTriangle, Flame, TrendingUp,
  Search, ArrowUpRight, RefreshCw, Zap, BarChart3
} from 'lucide-react';

interface Stats {
  totalBusinesses: number;
  noWebsite: number;
  brokenWebsites: number;
  outdatedWebsites: number;
  goodWebsites: number;
  hotLeads: number;
  highLeads: number;
  mediumLeads: number;
  lowLeads: number;
}

interface ApiUsageItem {
  provider: string;
  used: number;
  limit: number;
  percentage: number;
}

interface CategoryItem {
  category: string;
  count: number;
}

interface ScoreDistItem {
  label: string;
  value: number;
  color: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsageItem[]>([]);
  const [topCategories, setTopCategories] = useState<CategoryItem[]>([]);
  const [scoreDist, setScoreDist] = useState<ScoreDistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data.stats);
      setApiUsage(data.apiUsage || []);
      setTopCategories(data.topCategories || []);
      setScoreDist(data.scoreDistribution || []);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
    setLoading(false);
  }

  const statCards = stats ? [
    {
      label: 'Total Businesses',
      value: stats.totalBusinesses,
      icon: Building2,
      gradient: 'gradient-primary',
      change: '+' + stats.totalBusinesses,
    },
    {
      label: 'No Website',
      value: stats.noWebsite,
      icon: Globe,
      gradient: 'gradient-danger',
      change: 'Opportunities',
    },
    {
      label: 'Broken Websites',
      value: stats.brokenWebsites,
      icon: AlertTriangle,
      gradient: 'gradient-warning',
      change: 'Need fix',
    },
    {
      label: 'Hot Leads 🔥',
      value: stats.hotLeads,
      icon: Flame,
      gradient: 'gradient-danger',
      change: 'Score 90+',
    },
    {
      label: 'High Potential',
      value: stats.highLeads,
      icon: TrendingUp,
      gradient: 'gradient-info',
      change: 'Score 70-89',
    },
    {
      label: 'Outdated Sites',
      value: stats.outdatedWebsites,
      icon: Zap,
      gradient: 'gradient-success',
      change: 'Redesign needed',
    },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-[rgb(var(--muted))] rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-[rgb(var(--muted))] rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
            AI-powered lead generation overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                       bg-[rgb(var(--muted))] hover:bg-[rgb(var(--muted)/0.8)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <a
            href="/search"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                       gradient-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-[rgb(var(--primary)/0.3)]"
          >
            <Search className="w-4 h-4" />
            New Scan
          </a>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            className="stat-card relative overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--muted-foreground))] font-medium">{card.label}</p>
                <p className="text-3xl font-bold mt-2">{card.value.toLocaleString()}</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  {card.change}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${card.gradient}`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 opacity-30">
              <div className={`h-full ${card.gradient}`} style={{ width: '100%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Score Distribution */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[rgb(var(--primary))]" />
            <h2 className="text-lg font-semibold">Lead Score Distribution</h2>
          </div>
          <div className="space-y-4">
            {scoreDist.map((item, i) => {
              const total = scoreDist.reduce((a, b) => a + b.value, 0) || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[rgb(var(--muted-foreground))]">{item.value} leads ({pct}%)</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[rgb(var(--muted))] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
            {scoreDist.length === 0 && (
              <div className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No data yet. Run your first scan!</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Categories */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-[rgb(var(--primary))]" />
            <h2 className="text-lg font-semibold">Top Categories</h2>
          </div>
          <div className="space-y-3">
            {topCategories.map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--muted)/0.5)] hover:bg-[rgb(var(--muted))] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg gradient-primary text-white text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{cat.category}</span>
                </div>
                <span className="text-sm font-bold text-[rgb(var(--primary))]">{cat.count}</span>
              </div>
            ))}
            {topCategories.length === 0 && (
              <div className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No categories yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Usage */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-5 h-5 text-[rgb(var(--primary))]" />
          <h2 className="text-lg font-semibold">API Usage This Month</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {apiUsage.map((api, i) => (
            <div key={i} className="p-4 rounded-xl bg-[rgb(var(--muted)/0.5)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold capitalize">{api.provider}</span>
                <span className={`text-xs font-bold ${api.percentage > 80 ? 'text-red-500' : api.percentage > 50 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {api.percentage}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[rgb(var(--muted))] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${api.percentage > 80 ? 'bg-red-500' : api.percentage > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(api.percentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">
                {api.used} / {api.limit.toLocaleString()} requests
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
