import { scaleSqrt } from 'd3';

// Utility region base colors (distinct hues)
export const REGION_COLORS = {
  dominion: { base: '#3b82f6', light: '#60a5fa', dark: '#1e3a5f', label: 'Dominion Energy' },
  apco: { base: '#8b5cf6', light: '#a78bfa', dark: '#3b1f6e', label: 'Appalachian Power' },
  cooperatives: { base: '#10b981', light: '#34d399', dark: '#0a3d2e', label: 'Electric Cooperatives' },
  municipal: { base: '#f59e0b', light: '#fbbf24', dark: '#5c3d0a', label: 'Municipal Utilities' },
};

// Get fill opacity based on price (higher price = more opaque)
export function getRegionOpacity(price, minPrice = 5, maxPrice = 12) {
  if (!price) return 0.2;
  const t = Math.min(1, Math.max(0, (price - minPrice) / (maxPrice - minPrice)));
  return 0.2 + t * 0.45;
}

// Datacenter marker size scale (MW to pixel radius)
export function createSizeScale() {
  return scaleSqrt().domain([1, 200]).range([4, 20]).clamp(true);
}
