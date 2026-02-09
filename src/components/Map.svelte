<script>
  import { onMount, onDestroy } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import { selectedYear, visibleDatacenters, pricing, hoveredDatacenter, hoveredRegion, selectedRegion, mapLoaded } from '../stores.js';
  import { REGION_COLORS, getRegionOpacity, createSizeScale } from '../utils/colors.js';
  import { getUtilityPrice } from '../utils/data.js';

  let { counties } = $props();

  let mapContainer;
  let map;
  const sizeScale = createSizeScale();

  // Virginia bounds
  const VA_BOUNDS = [[-83.68, 36.54], [-75.17, 39.47]];
  const VA_CENTER = [-78.85, 37.93];

  onMount(() => {
    map = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [
          {
            id: 'carto-dark-layer',
            type: 'raster',
            source: 'carto-dark',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: VA_CENTER,
      zoom: 7,
      maxBounds: [[-85, 35.5], [-73, 40.5]],
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      addLayers();
      mapLoaded.set(true);
    });

    return () => {
      map?.remove();
    };
  });

  function addLayers() {
    if (!counties || !map) return;

    // County fill layer (utility regions)
    map.addSource('counties', {
      type: 'geojson',
      data: counties,
    });

    map.addLayer({
      id: 'county-fill',
      type: 'fill',
      source: 'counties',
      paint: {
        'fill-color': buildRegionColorExpression(),
        'fill-opacity': 0.3,
      },
    });

    map.addLayer({
      id: 'county-border',
      type: 'line',
      source: 'counties',
      paint: {
        'line-color': 'rgba(255, 255, 255, 0.08)',
        'line-width': 0.5,
      },
    });

    // Region borders (thicker lines between different utility territories)
    map.addLayer({
      id: 'region-border',
      type: 'line',
      source: 'counties',
      paint: {
        'line-color': buildRegionColorExpression(),
        'line-width': 1.5,
        'line-opacity': 0.5,
      },
    });

    // Datacenter markers
    map.addSource('datacenters', {
      type: 'geojson',
      data: buildDatacenterGeoJSON($visibleDatacenters),
    });

    map.addLayer({
      id: 'dc-glow',
      type: 'circle',
      source: 'datacenters',
      paint: {
        'circle-radius': ['*', ['get', 'radius'], 1.8],
        'circle-color': 'rgba(255, 255, 255, 0.06)',
        'circle-blur': 1,
      },
    });

    map.addLayer({
      id: 'dc-markers',
      type: 'circle',
      source: 'datacenters',
      paint: {
        'circle-radius': ['get', 'radius'],
        'circle-color': [
          'match', ['get', 'status'],
          'operational', 'rgba(255, 255, 255, 0.85)',
          'under_construction', 'rgba(245, 158, 11, 0.85)',
          'planned', 'rgba(100, 116, 139, 0.6)',
          'rgba(255, 255, 255, 0.7)',
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': [
          'match', ['get', 'status'],
          'operational', 'rgba(255, 255, 255, 0.4)',
          'under_construction', 'rgba(245, 158, 11, 0.4)',
          'planned', 'rgba(100, 116, 139, 0.3)',
          'rgba(255, 255, 255, 0.3)',
        ],
      },
    });

    // Hover interactions
    map.on('mousemove', 'dc-markers', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features?.length) {
        const props = e.features[0].properties;
        hoveredDatacenter.set({
          name: props.name,
          operator: props.operator,
          county: props.county,
          year_opened: props.year_opened,
          capacity_mw: props.capacity_mw,
          status: props.status,
        });
        hoveredRegion.set(null);
      }
    });

    map.on('mouseleave', 'dc-markers', () => {
      map.getCanvas().style.cursor = '';
      hoveredDatacenter.set(null);
    });

    map.on('mousemove', 'county-fill', (e) => {
      if (e.features?.length && !$hoveredDatacenter) {
        const props = e.features[0].properties;
        const utilityKey = props.utility || 'dominion';
        const price = getUtilityPrice($pricing, utilityKey, $selectedYear, 'commercial');
        hoveredRegion.set({
          utility: utilityKey,
          county_name: props.county_name || props.NAME || 'Unknown',
          price,
        });
      }
    });

    map.on('mouseleave', 'county-fill', () => {
      if (!$hoveredDatacenter) {
        hoveredRegion.set(null);
      }
    });

    map.on('click', 'county-fill', (e) => {
      if (e.features?.length) {
        const props = e.features[0].properties;
        selectedRegion.set(props.utility || 'dominion');
      }
    });
  }

  function buildRegionColorExpression() {
    return [
      'match', ['get', 'utility'],
      'dominion', REGION_COLORS.dominion.base,
      'apco', REGION_COLORS.apco.base,
      'cooperatives', REGION_COLORS.cooperatives.base,
      'municipal', REGION_COLORS.municipal.base,
      REGION_COLORS.dominion.dark,
    ];
  }

  function buildDatacenterGeoJSON(dcs) {
    return {
      type: 'FeatureCollection',
      features: dcs.map(dc => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [dc.lng, dc.lat] },
        properties: {
          ...dc,
          radius: sizeScale(dc.capacity_mw || 5),
        },
      })),
    };
  }

  // React to year changes
  $effect(() => {
    const dcs = $visibleDatacenters;
    if (map?.getSource('datacenters')) {
      map.getSource('datacenters').setData(buildDatacenterGeoJSON(dcs));
    }
  });

  // React to pricing/year changes for region opacity
  $effect(() => {
    const year = $selectedYear;
    const p = $pricing;
    if (!map?.getLayer('county-fill') || !p) return;

    // Build opacity expression based on current year's prices
    const opacities = {};
    for (const key of Object.keys(REGION_COLORS)) {
      const price = getUtilityPrice(p, key, year, 'commercial');
      opacities[key] = getRegionOpacity(price);
    }

    map.setPaintProperty('county-fill', 'fill-opacity', [
      'match', ['get', 'utility'],
      'dominion', opacities.dominion || 0.2,
      'apco', opacities.apco || 0.2,
      'cooperatives', opacities.cooperatives || 0.2,
      'municipal', opacities.municipal || 0.2,
      0.2,
    ]);
  });
</script>

<div class="map-wrapper" bind:this={mapContainer}></div>

<style>
  .map-wrapper {
    width: 100%;
    height: 100%;
  }

  :global(.maplibregl-ctrl-attrib) {
    background: rgba(0, 0, 0, 0.6) !important;
    color: var(--text-muted) !important;
    font-size: 0.6rem !important;
  }
  :global(.maplibregl-ctrl-attrib a) {
    color: var(--text-secondary) !important;
  }
  :global(.maplibregl-ctrl-group) {
    background: var(--bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
  }
  :global(.maplibregl-ctrl-group button) {
    background-color: transparent !important;
    border-bottom-color: var(--border-color) !important;
  }
  :global(.maplibregl-ctrl-group button span) {
    filter: invert(0.8);
  }
</style>
