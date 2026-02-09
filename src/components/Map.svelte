<script>
  import { onMount } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import { selectedYear, visibleDatacenters, datacenters, pricing, hoveredDatacenter, hoveredRegion, selectedRegion, mapLoaded } from '../stores.js';
  import { REGION_COLORS, getRegionOpacity, createSizeScale } from '../utils/colors.js';
  import { getUtilityPrice } from '../utils/data.js';

  let { counties } = $props();

  let mapContainer;
  let map;
  const sizeScale = createSizeScale();
  let prevYear = null;

  const VA_CENTER = [-78.85, 37.93];

  onMount(() => {
    map = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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

    // --- County fill layers (utility regions) ---
    map.addSource('counties', { type: 'geojson', data: counties });

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

    // --- Datacenter source with clustering ---
    map.addSource('datacenters', {
      type: 'geojson',
      data: buildDatacenterGeoJSON($visibleDatacenters, $selectedYear),
      cluster: true,
      clusterMaxZoom: 11,
      clusterRadius: 50,
    });

    // Cluster circles
    map.addLayer({
      id: 'dc-clusters',
      type: 'circle',
      source: 'datacenters',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          'rgba(34, 211, 238, 0.6)',   // < 10
          10, 'rgba(34, 211, 238, 0.7)', // 10-29
          30, 'rgba(34, 211, 238, 0.8)', // 30-49
          50, 'rgba(59, 130, 246, 0.85)', // 50+
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          16,    // < 10
          10, 22, // 10-29
          30, 28, // 30-49
          50, 34, // 50+
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(34, 211, 238, 0.25)',
        'circle-opacity-transition': { duration: 300 },
        'circle-radius-transition': { duration: 300 },
      },
    });

    // Cluster count labels
    map.addLayer({
      id: 'dc-cluster-count',
      type: 'symbol',
      source: 'datacenters',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold'],
        'text-size': 12,
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': '#ffffff',
      },
    });

    // Glow layer for unclustered markers
    map.addLayer({
      id: 'dc-glow',
      type: 'circle',
      source: 'datacenters',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': ['*', ['get', 'radius'], 1.8],
        'circle-color': 'rgba(255, 255, 255, 0.06)',
        'circle-blur': 1,
        'circle-opacity': ['case', ['get', 'fresh'], 0, 1],
        'circle-opacity-transition': { duration: 400 },
        'circle-radius-transition': { duration: 400 },
      },
    });

    // Individual datacenter markers (unclustered)
    map.addLayer({
      id: 'dc-markers',
      type: 'circle',
      source: 'datacenters',
      filter: ['!', ['has', 'point_count']],
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
        // Start fresh markers at 0 opacity; they'll animate in
        'circle-opacity': ['case', ['get', 'fresh'], 0, 1],
        'circle-opacity-transition': { duration: 400 },
        'circle-radius-transition': { duration: 400 },
      },
    });

    // --- Hover interactions ---
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

    // Tap on marker (mobile touch support)
    map.on('click', 'dc-markers', (e) => {
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

    // Clear tooltip on map tap outside markers
    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['dc-markers'] });
      if (!features.length) {
        hoveredDatacenter.set(null);
      }
    });

    // Cluster hover
    map.on('mouseenter', 'dc-clusters', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'dc-clusters', () => {
      map.getCanvas().style.cursor = '';
    });

    // Click cluster to zoom in
    map.on('click', 'dc-clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['dc-clusters'] });
      if (!features.length) return;
      const clusterId = features[0].properties.cluster_id;
      map.getSource('datacenters').getClusterExpansionZoom(clusterId).then((zoom) => {
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom + 0.5,
          duration: 500,
        });
      });
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
      if (!$hoveredDatacenter) hoveredRegion.set(null);
    });

    map.on('click', 'county-fill', (e) => {
      if (e.features?.length) {
        selectedRegion.set(e.features[0].properties.utility || 'dominion');
      }
    });

    prevYear = $selectedYear;
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

  function buildDatacenterGeoJSON(dcs, currentYear) {
    return {
      type: 'FeatureCollection',
      features: dcs.map(dc => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [dc.lng, dc.lat] },
        properties: {
          ...dc,
          radius: sizeScale(dc.capacity_mw || 5),
          fresh: prevYear !== null && dc.year_opened > prevYear && dc.year_opened <= currentYear,
        },
      })),
    };
  }

  const STATUS_OPACITY = [
    'match', ['get', 'status'],
    'operational', 0.85,
    'under_construction', 0.85,
    'planned', 0.6,
    0.7,
  ];

  // React to year changes — update source data + animate new markers
  $effect(() => {
    const dcs = $visibleDatacenters;
    const year = $selectedYear;
    if (!map?.getSource('datacenters')) return;

    // Phase 1: set paint to hide fresh markers, then update source data
    // (existing data has no fresh=true features, so this is a no-op until new data lands)
    if (map.getLayer('dc-markers')) {
      map.setPaintProperty('dc-markers', 'circle-opacity',
        ['case', ['==', ['get', 'fresh'], true], 0, STATUS_OPACITY]);
      map.setPaintProperty('dc-glow', 'circle-opacity',
        ['case', ['==', ['get', 'fresh'], true], 0, 1]);
    }

    map.getSource('datacenters').setData(buildDatacenterGeoJSON(dcs, year));

    // Phase 2: next frame, set paint to show all — fresh markers transition from 0 to target
    requestAnimationFrame(() => {
      if (!map?.getLayer('dc-markers')) return;
      map.setPaintProperty('dc-markers', 'circle-opacity', STATUS_OPACITY);
      map.setPaintProperty('dc-glow', 'circle-opacity', 1);
      prevYear = year;
    });
  });

  // React to pricing/year changes for region opacity
  $effect(() => {
    const year = $selectedYear;
    const p = $pricing;
    if (!map?.getLayer('county-fill') || !p) return;

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
