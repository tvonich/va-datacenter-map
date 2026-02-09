const BASE = import.meta.env.BASE_URL;

export async function loadAllData() {
  const [counties, dcs, pricingData, utilityMap] = await Promise.all([
    fetch(`${BASE}data/virginia-counties.geojson`).then(r => r.json()),
    fetch(`${BASE}data/datacenters.json`).then(r => r.json()),
    fetch(`${BASE}data/pricing-by-utility.json`).then(r => r.json()),
    fetch(`${BASE}data/county-to-utility.json`).then(r => r.json()),
  ]);

  return { counties, datacenters: dcs, pricing: pricingData, countyUtilityMap: utilityMap };
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
