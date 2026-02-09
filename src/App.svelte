<script>
  import { onMount } from 'svelte';
  import { loadAllData, enrichCountiesWithUtility } from './utils/data.js';
  import { datacenters, pricing, countyUtilityMap, selectedYear, summaryStats, mapLoaded, selectedRegion } from './stores.js';
  import Map from './components/Map.svelte';
  import Timeline from './components/Timeline.svelte';
  import Tooltip from './components/Tooltip.svelte';
  import RegionPanel from './components/RegionPanel.svelte';
  import Header from './components/Header.svelte';
  import Legend from './components/Legend.svelte';

  let loading = $state(true);
  let error = $state(null);
  let enrichedCounties = $state(null);

  onMount(async () => {
    try {
      const data = await loadAllData();
      datacenters.set(data.datacenters);
      pricing.set(data.pricing);
      countyUtilityMap.set(data.countyUtilityMap);
      enrichedCounties = enrichCountiesWithUtility(data.counties, data.countyUtilityMap);
      loading = false;
    } catch (e) {
      console.error('Failed to load data:', e);
      error = e.message;
      loading = false;
    }
  });
</script>

{#if loading}
  <div class="loading-screen">
    <div class="loading-content">
      <div class="spinner"></div>
      <h2>Loading Virginia Datacenter Map</h2>
      <p>Fetching geographic and energy data...</p>
    </div>
  </div>
{:else if error}
  <div class="loading-screen">
    <div class="loading-content">
      <h2>Error loading data</h2>
      <p>{error}</p>
    </div>
  </div>
{:else}
  <div class="app-layout">
    <Header />

    <div class="main-content">
      <div class="map-container">
        <Map counties={enrichedCounties} />
        <Tooltip />
        <Legend />
      </div>

      <div class="sidebar">
        <RegionPanel />
      </div>
    </div>

    <div class="bottom-bar">
      <Timeline />

      <div class="summary-stats">
        <div class="stat">
          <span class="stat-value">{$summaryStats.totalDCs}</span>
          <span class="stat-label">Data Centers</span>
        </div>
        <div class="stat">
          <span class="stat-value">{$summaryStats.totalMW.toLocaleString()}</span>
          <span class="stat-label">Total MW</span>
        </div>
        <div class="stat">
          <span class="stat-value">
            {$summaryStats.avgPrice ? $summaryStats.avgPrice.toFixed(1) + '¢' : '—'}
          </span>
          <span class="stat-label">Avg Commercial Rate/kWh</span>
        </div>
        <div class="stat">
          <span class="stat-value">{$selectedYear}</span>
          <span class="stat-label">Year</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: var(--bg-primary);
  }
  .loading-content {
    text-align: center;
  }
  .loading-content h2 {
    font-size: 1.4rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  .loading-content p {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top-color: var(--accent-blue);
    border-radius: 50%;
    margin: 0 auto 1.5rem;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bg-primary);
  }

  .main-content {
    display: flex;
    flex: 1;
    min-height: 0;
    position: relative;
  }

  .map-container {
    flex: 1;
    position: relative;
    min-width: 0;
  }

  .sidebar {
    width: 340px;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    overflow-y: auto;
    flex-shrink: 0;
  }

  .bottom-bar {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding: 0.75rem 1.5rem;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
  }

  .summary-stats {
    display: flex;
    gap: 1.5rem;
    flex-shrink: 0;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
  }

  .stat-value {
    font-family: var(--font-mono);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--accent-cyan);
  }

  .stat-label {
    font-size: 0.65rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 2px;
  }

  @media (max-width: 900px) {
    .sidebar {
      display: none;
    }
    .summary-stats {
      gap: 1rem;
    }
    .stat { min-width: 60px; }
    .stat-value { font-size: 1rem; }
  }
</style>
