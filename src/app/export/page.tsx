'use client';

import { useState } from 'react';
import {
  Download, FileText, Table2, FileSpreadsheet,
  Phone, Mail, MessageSquare, Loader2, CheckCircle
} from 'lucide-react';

export default function ExportPage() {
  const [exporting, setExporting] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [success, setSuccess] = useState('');

  async function downloadExport(format: string) {
    setExporting(format);
    setSuccess('');
    try {
      const params = new URLSearchParams({ format });
      if (statusFilter) params.set('status', statusFilter);
      if (classFilter) params.set('classification', classFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/export?${params}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const extensions: Record<string, string> = {
        csv: 'leads.csv',
        excel: 'leads.xlsx',
        whatsapp: 'whatsapp_leads.txt',
        calling: 'calling_list.tsv',
        email: 'email_list.csv',
      };
      a.download = extensions[format] || 'leads.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess(format);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting('');
  }

  const exportFormats = [
    {
      id: 'csv',
      label: 'CSV',
      description: 'Comma-separated values, compatible with any spreadsheet',
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'excel',
      label: 'Excel',
      description: 'Microsoft Excel format with styled columns',
      icon: FileSpreadsheet,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Export',
      description: 'Name | Category | Phone format for WhatsApp outreach',
      icon: MessageSquare,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      id: 'calling',
      label: 'Calling List',
      description: 'Tab-separated list with name, phone, category, priority',
      icon: Phone,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      id: 'email',
      label: 'Email List',
      description: 'CSV with email, business name, and category',
      icon: Mail,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'NO_WEBSITE', label: 'No Website' },
    { value: 'BROKEN', label: 'Broken Website' },
    { value: 'OUTDATED', label: 'Outdated Website' },
    { value: 'GOOD', label: 'Good Website' },
  ];

  const classOptions = [
    { value: '', label: 'All Scores' },
    { value: 'HOT', label: '🔥 Hot Leads (90+)' },
    { value: 'HIGH', label: 'High Potential (70-89)' },
    { value: 'MEDIUM', label: 'Medium (50-69)' },
    { value: 'LOW', label: 'Low Priority (0-49)' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Download className="w-7 h-7 text-[rgb(var(--primary))]" />
          Export Data
        </h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">
          Download your leads in various formats for outreach
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Table2 className="w-4 h-4 text-[rgb(var(--primary))]" />
          Filter Before Export
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-1 block">Website Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-1 block">Lead Score</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            >
              {classOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[rgb(var(--muted-foreground))] mb-1 block">Category</label>
            <input
              type="text"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="e.g., Restaurant, Gym..."
              className="w-full px-3 py-2 rounded-xl bg-[rgb(var(--muted))] border border-[rgb(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
            />
          </div>
        </div>
      </div>

      {/* Export Formats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportFormats.map(fmt => (
          <button
            key={fmt.id}
            onClick={() => downloadExport(fmt.id)}
            disabled={exporting === fmt.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-left
                       hover:border-[rgb(var(--primary)/0.5)] transition-all stat-card group disabled:opacity-50"
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${fmt.bg}`}>
                {exporting === fmt.id ? (
                  <Loader2 className={`w-6 h-6 ${fmt.color} animate-spin`} />
                ) : success === fmt.id ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <fmt.icon className={`w-6 h-6 ${fmt.color}`} />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{fmt.label}</p>
                <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{fmt.description}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[rgb(var(--border)/0.5)]">
              <span className={`text-xs font-medium ${exporting === fmt.id ? 'text-[rgb(var(--muted-foreground))]' : 'text-[rgb(var(--primary))]'} group-hover:underline`}>
                {exporting === fmt.id ? 'Exporting...' : success === fmt.id ? '✓ Downloaded!' : 'Download →'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Export Info */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <h3 className="text-sm font-semibold mb-3">Export Columns</h3>
        <div className="flex flex-wrap gap-2">
          {['Category', 'Business Name', 'Rating', 'Reviews', 'Phone Numbers', 'Email', 'Website',
            'Website Status', 'Lead Score', 'Classification', 'Address', 'City', 'Area', 'Google Maps', 'Source'
          ].map(col => (
            <span key={col} className="px-2 py-1 rounded-lg bg-[rgb(var(--muted))] text-xs font-medium">
              {col}
            </span>
          ))}
        </div>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-3">
          Multiple phone numbers are separated by &quot;/&quot; in the export. WhatsApp export uses the primary phone number.
        </p>
      </div>
    </div>
  );
}
