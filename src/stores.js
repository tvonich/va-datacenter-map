import { writable, derived } from 'svelte/store';

export const selectedYear = writable(2025);
export const hoveredDatacenter = writable(null);
export const hoveredRegion = writable(null);
export const selectedRegion = writable(null);
export const mapLoaded = writable(false);

// Data stores
export const datacenters = writable([]);
export const pricing = writable(null);
export const countyUtilityMap = writable(null);

// Derived: datacenters visible for current year
export const visibleDatacenters = derived(
  [datacenters, selectedYear],
  ([$datacenters, $year]) =>
    $datacenters.filter(dc => dc.year_opened <= $year)
);

// Derived: summary stats for current year
export const summaryStats = derived(
  [visibleDatacenters, pricing, selectedYear],
  ([$visible, $pricing, $year]) => {
    const totalDCs = $visible.length;
    const totalMW = $visible.reduce((sum, dc) => sum + (dc.capacity_mw || 0), 0);
    const operationalCount = $visible.filter(dc => dc.status === 'operational').length;

    let avgPrice = null;
    if ($pricing?.state_average?.data?.[$year]) {
      avgPrice = $pricing.state_average.data[$year].commercial;
    }

    return { totalDCs, totalMW, operationalCount, avgPrice };
  }
);
