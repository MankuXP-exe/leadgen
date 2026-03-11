import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumbers(phones: string[]): string {
  const cleaned = phones
    .map(p => p.replace(/[\s\-\(\)]/g, '').replace(/^\+91/, ''))
    .filter(p => /^\d{10,}$/.test(p));
  const unique = [...new Set(cleaned)];
  return unique.join(' / ');
}

export function mergePhoneNumbers(existing: string | null, newPhones: string[]): string {
  const existingList = existing ? existing.split(' / ').map(p => p.trim()) : [];
  const allPhones = [...existingList, ...newPhones];
  return formatPhoneNumbers(allPhones);
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-red-500';
  if (score >= 70) return 'text-orange-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-gray-400';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'HOT LEAD 🔥';
  if (score >= 70) return 'HIGH POTENTIAL';
  if (score >= 50) return 'MEDIUM';
  return 'LOW PRIORITY';
}

export function getClassification(score: number): string {
  if (score >= 90) return 'HOT';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'NO_WEBSITE': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'BROKEN': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'OUTDATED': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'SLOW': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'NO_SSL': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'GOOD': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'NO_WEBSITE': return 'No Website';
    case 'BROKEN': return 'Broken';
    case 'OUTDATED': return 'Outdated';
    case 'SLOW': return 'Slow';
    case 'NO_SSL': return 'No SSL';
    case 'GOOD': return 'Good';
    default: return status;
  }
}

export const PREMIUM_CATEGORIES = [
  'gym', 'coaching', 'school', 'academy', 'hospital', 'clinic', 'dentist',
  'diagnostic', 'restaurant', 'cafe', 'hotel', 'banquet', 'real estate',
  'interior', 'builder', 'car showroom', 'salon', 'spa', 'event planner',
  'wedding', 'fitness', 'yoga', 'physiotherapy', 'pharmacy', 'optical',
  'jeweller', 'boutique', 'furniture'
];

export const DEFAULT_LOCATIONS = [
  'Chandu, Gurgaon',
  'Farrukhnagar, Gurgaon',
  'Khera Khurampur, Gurgaon',
  'Sultanpur, Gurgaon',
  'Alimuddin, Gurgaon',
  'Gurgaon Rural'
];

export const BUSINESS_CATEGORIES = [
  'Gym', 'Coaching Institute', 'School', 'Academy', 'Hospital', 'Clinic',
  'Dentist', 'Diagnostic Lab', 'Restaurant', 'Cafe', 'Hotel', 'Banquet Hall',
  'Real Estate', 'Interior Designer', 'Builder', 'Car Showroom', 'Salon',
  'Luxury Spa', 'Event Planner', 'Fitness Center', 'Yoga Studio',
  'Physiotherapy', 'Pharmacy', 'Optical Store', 'Jeweller', 'Boutique',
  'Furniture Store'
];
