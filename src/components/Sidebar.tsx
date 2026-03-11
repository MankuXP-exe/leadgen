'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';
import {
  LayoutDashboard, Search, Users, Flame, AlertTriangle,
  Download, Settings, Map, Moon, Sun, Menu, X,
  Crosshair, TrendingUp, ChevronLeft
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search Leads', icon: Search },
  { href: '/leads', label: 'Lead Lists', icon: Users },
  { href: '/hot-leads', label: 'Hot Leads', icon: Flame },
  { href: '/broken', label: 'Broken Websites', icon: AlertTriangle },
  { href: '/map', label: 'Map View', icon: Map },
  { href: '/export', label: 'Export Data', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass"
        id="mobile-menu-toggle"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-all duration-300 ease-in-out
          bg-[rgb(var(--card))] border-r border-[rgb(var(--border))]
          ${collapsed ? 'w-[72px]' : 'w-[var(--sidebar-width)]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border))]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Crosshair className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight">LeadHunter</h1>
                <p className="text-[10px] text-[rgb(var(--muted-foreground))]">AI Lead Generation</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center mx-auto">
              <Crosshair className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-[rgb(var(--muted))]"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse on desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:block p-1 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'bg-[rgb(var(--primary))] text-white shadow-lg shadow-[rgb(var(--primary)/0.3)]'
                    : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]'
                  }
                  ${collapsed ? 'justify-center px-2' : ''}
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-[rgb(var(--border))]">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`
              flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
              text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]
              hover:bg-[rgb(var(--muted))] transition-all duration-200
              ${collapsed ? 'justify-center px-2' : ''}
            `}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Version badge */}
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 mt-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-[rgb(var(--muted-foreground))]">v1.0 • Pro</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
