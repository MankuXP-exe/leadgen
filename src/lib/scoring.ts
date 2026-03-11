// Lead Scoring Algorithm (0-100)
// Factors: no website, rating, reviews, premium category, area, photos

import { PREMIUM_CATEGORIES } from './utils';

interface ScoreInput {
  websiteUrl: string | null;
  websiteStatus: string;
  rating: number | null;
  reviewCount: number | null;
  category: string;
  area: string | null;
  photoCount: number | null;
  priceLevel: string | null;
}

interface ScoreResult {
  score: number;
  classification: string;
  factors: Record<string, number>;
}

const DEVELOPED_AREAS = [
  'gurgaon', 'gurugram', 'sector', 'dlf', 'sohna', 'manesar',
  'faridabad', 'noida', 'delhi', 'new delhi'
];

export function calculateLeadScore(input: ScoreInput): ScoreResult {
  const factors: Record<string, number> = {};
  let score = 0;

  // No website = huge opportunity (+30)
  if (!input.websiteUrl || input.websiteStatus === 'NO_WEBSITE') {
    factors['no_website'] = 30;
    score += 30;
  } else if (input.websiteStatus === 'BROKEN') {
    factors['broken_website'] = 25;
    score += 25;
  } else if (input.websiteStatus === 'OUTDATED') {
    factors['outdated_website'] = 20;
    score += 20;
  } else if (input.websiteStatus === 'NO_SSL') {
    factors['no_ssl'] = 15;
    score += 15;
  } else if (input.websiteStatus === 'SLOW') {
    factors['slow_website'] = 10;
    score += 10;
  }

  // Rating above 4.2 (+15)
  if (input.rating && input.rating >= 4.2) {
    factors['high_rating'] = 15;
    score += 15;
  } else if (input.rating && input.rating >= 3.5) {
    factors['decent_rating'] = 8;
    score += 8;
  } else if (input.rating && input.rating < 3.0) {
    factors['poor_rating'] = -5;
    score -= 5;
  }

  // Reviews above 50 (+15)
  if (input.reviewCount && input.reviewCount >= 100) {
    factors['very_popular'] = 15;
    score += 15;
  } else if (input.reviewCount && input.reviewCount >= 50) {
    factors['popular'] = 12;
    score += 12;
  } else if (input.reviewCount && input.reviewCount >= 20) {
    factors['some_reviews'] = 6;
    score += 6;
  } else if (input.reviewCount !== null && input.reviewCount < 5) {
    factors['very_few_reviews'] = -5;
    score -= 5;
  }

  // Premium category (+10)
  const catLower = input.category.toLowerCase();
  if (PREMIUM_CATEGORIES.some(pc => catLower.includes(pc))) {
    factors['premium_category'] = 10;
    score += 10;
  }

  // Developed area (+10)
  if (input.area) {
    const areaLower = input.area.toLowerCase();
    if (DEVELOPED_AREAS.some(da => areaLower.includes(da))) {
      factors['developed_area'] = 10;
      score += 10;
    }
  }

  // Photos indicate established business (+10)
  if (input.photoCount && input.photoCount >= 10) {
    factors['many_photos'] = 10;
    score += 10;
  } else if (input.photoCount && input.photoCount >= 5) {
    factors['some_photos'] = 5;
    score += 5;
  }

  // Price level indicator (+5)
  if (input.priceLevel && ['expensive', 'very_expensive', '3', '4'].includes(input.priceLevel)) {
    factors['high_price'] = 5;
    score += 5;
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  let classification = 'LOW';
  if (score >= 90) classification = 'HOT';
  else if (score >= 70) classification = 'HIGH';
  else if (score >= 50) classification = 'MEDIUM';

  return { score, classification, factors };
}
