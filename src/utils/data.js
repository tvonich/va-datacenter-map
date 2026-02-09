const BASE = import.meta.env.BASE_URL;

export async function loadAllData() {
  const [counties, dcs, pricingData, utilityMap] = await Promise.all([
    fetch(`${BASE}data/virginia-counties.geojson`).then(r => r.json()),
    fetch(`${BASE}data/datacenters.json`).then(r => r.json()),
    fetch(`${BASE}data/pricing-by-utility.json`).then(r => r.json()),
    fetch(`${BASE}data/county-to-utility.json`).then(r => r.json()),
  ]);

  return { counties, datacenters: spreadOverlappingMarkers(dcs), pricing: pricingData, countyUtilityMap: utilityMap };
}

// Spread markers that are too close together so they don't overlap at high zoom
function spreadOverlappingMarkers(dcs, minDist = 0.002) {
  const result = dcs.map(dc => ({ ...dc }));
  // Group by proximity — O(n²) but n≈113 so fine
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i], b = result[j];
      const dx = a.lng - b.lng;
      const dy = a.lat - b.lat;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist > 0) {
        // Push apart along the vector between them, or a random direction if coincident
        const angle = dist > 0.00001 ? Math.atan2(dy, dx) : (Math.PI * 2 * j) / result.length;
        const push = (minDist - dist) / 2;
        a.lng += Math.cos(angle) * push;
        a.lat += Math.sin(angle) * push;
        b.lng -= Math.cos(angle) * push;
        b.lat -= Math.sin(angle) * push;
      }
    }
  }
  return result;
}

// Enrich GeoJSON counties with utility assignment
export function enrichCountiesWithUtility(counties, utilityMap) {
  return {
    ...counties,
    features: counties.features.map(feature => {
      const fips = feature.id || feature.properties.GEOID || feature.properties.GEO_ID;
      const utility = utilityMap.mapping?.[fips] || 'dominion';
      const countyName = utilityMap.fips_names?.[fips] || feature.properties.NAME || 'Unknown';
      return {
        ...feature,
        properties: {
          ...feature.properties,
          utility,
          county_name: countyName,
          fips,
        },
      };
    }),
  };
}

// Get utility pricing for a given year and sector
export function getUtilityPrice(pricing, utilityKey, year, sector = 'commercial') {
  return pricing?.utilities?.[utilityKey]?.data?.[year]?.[sector] ?? null;
}

// Count datacenters per utility region for a given year
export function countByRegion(datacenters, countyUtilityMap, year) {
  const counts = { dominion: 0, apco: 0, cooperatives: 0, municipal: 0 };
  const mw = { dominion: 0, apco: 0, cooperatives: 0, municipal: 0 };

  const nameToFips = {};
  if (countyUtilityMap?.fips_names) {
    for (const [fips, name] of Object.entries(countyUtilityMap.fips_names)) {
      const clean = name.replace(/ (County|City|city)$/i, '').toLowerCase();
      nameToFips[clean] = fips;
    }
  }

  for (const dc of datacenters) {
    if (dc.year_opened > year) continue;
    const countyClean = (dc.county || '').toLowerCase();
    const fips = nameToFips[countyClean];
    const utility = fips ? (countyUtilityMap.mapping?.[fips] || 'dominion') : 'dominion';
    counts[utility] = (counts[utility] || 0) + 1;
    mw[utility] = (mw[utility] || 0) + (dc.capacity_mw || 0);
  }

  return { counts, mw };
}
