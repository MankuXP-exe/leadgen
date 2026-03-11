'use client';

import { useEffect, useState } from 'react';
import {
  Settings, Key, Save, Loader2, CheckCircle2,
  AlertTriangle, Eye, EyeOff
} from 'lucide-react';

interface SettingsData {
  [key: string]: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    serpapi_key: '',
    foursquare_key: '',
    geoapify_key: '',
    locationiq_key: '',
    apify_key: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [success, setSuccess] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(prev => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
    setLoading(false);
  }

  async function saveSetting(key: string, value: string) {
    if (!value || value.includes('****')) return; // Don't save masked keys

    setSaving(key);
    setSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        setSuccess(key);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Failed to save setting:', err);
    }
    setSaving('');
  }

  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleShow = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const apiConfigs = [
    {
      id: 'serpapi_key',
      name: 'SerpAPI Key',
      description: 'Used for scraping Google Maps data. Get it from serpapi.com',
      link: 'https://serpapi.com/manage-api-key',
    },
    {
      id: 'apify_key',
      name: 'Apify API Token',
      description: 'Used for Google Maps Scraper and JustDial actors. Get it from apify.com',
      link: 'https://console.apify.com/account/integrations',
    },
    {
      id: 'foursquare_key',
      name: 'Foursquare Places API Key',
      description: 'Provides additional business details and alternative data source.',
      link: 'https://location.foursquare.com/developer/',
    },
    {
      id: 'geoapify_key',
      name: 'Geoapify API Key',
      description: 'Used for place search using coordinates.',
      link: 'https://myprojects.geoapify.com/',
    },
    {
      id: 'locationiq_key',
      name: 'LocationIQ API Key',
      description: 'Used for geocoding city/area names into coordinates.',
      link: 'https://my.locationiq.com/dashboard',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-[rgb(var(--muted))] rounded-lg animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-[rgb(var(--card))] rounded-2xl animate-pulse border border-[rgb(var(--border))]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-[rgb(var(--primary))]" />
          Settings
        </h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
          Configure API keys for data providers. Keys are stored securely in the local database.
        </p>
      </div>

      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-yellow-600 dark:text-yellow-500">API Free Limits Warning</p>
          <p className="text-yellow-600/80 dark:text-yellow-500/80 mt-1">
            Ensure you use free tier limits carefully. The system automatically balances requests, but heavy scanning may exhaust free credits on platforms like SerpAPI (100 req/mo free).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b border-[rgb(var(--border))]">
          <Key className="w-5 h-5 text-[rgb(var(--primary))]" />
          API Configuration
        </h2>

        {apiConfigs.map(config => (
          <div key={config.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 transition-all focus-within:border-[rgb(var(--primary)/0.5)] focus-within:shadow-md">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <label className="font-semibold text-sm">{config.name}</label>
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                  {config.description}{' '}
                  <a href={config.link} target="_blank" rel="noopener" className="text-[rgb(var(--primary))] hover:underline">
                    Get key →
                  </a>
                </p>
                <p className="text-[11px] font-medium text-[rgb(var(--primary))] mt-2 bg-[rgb(var(--primary)/0.1)] inline-block px-2 py-0.5 rounded">
                  Tip: You can enter multiple keys separated by commas.
                </p>
              </div>
              <div className="w-full sm:w-auto flex-1 max-w-md">
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKeys[config.id] ? 'text' : 'password'}
                      value={settings[config.id] || ''}
                      onChange={(e) => handleInputChange(config.id, e.target.value)}
                      placeholder={settings[config.id]?.includes('****') ? settings[config.id] : 'Key1, Key2, Key3...'}
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShow(config.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
                    >
                      {showKeys[config.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => saveSetting(config.id, settings[config.id])}
                    disabled={!settings[config.id] || settings[config.id].includes('****') || saving === config.id}
                    className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl gradient-primary text-white disabled:opacity-50 disabled:grayscale transition-all"
                  >
                    {saving === config.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : success === config.id ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
