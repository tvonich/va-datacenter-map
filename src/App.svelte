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
  import IntroOverlay from './components/IntroOverlay.svelte';

  let loading = $state(true);
  let error = $state(null);
  let enrichedCounties = $state(null);
  let sidebarOpen = $state(false);

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
  <IntroOverlay />
  <div class="app-layout">
    <Header />

    <div class="main-content">
      <div class="map-container">
        <Map counties={enrichedCounties} />
        <Tooltip />
        <Legend />
        <button class="mobile-info-btn" onclick={() => sidebarOpen = true} title="Region details">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </button>
      </div>

      <div class="sidebar" class:desktop-sidebar={true}>
        <RegionPanel />
      </div>

      {#if sidebarOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="drawer-backdrop" onclick={() => sidebarOpen = false}></div>
        <div class="drawer">
          <button class="drawer-close" onclick={() => sidebarOpen = false}>&times;</button>
          <RegionPanel />
        </div>
      {/if}
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

  /* Mobile info button — visible only when sidebar is hidden */
  .mobile-info-btn {
    display: none;
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    z-index: 10;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: var(--accent-cyan);
    cursor: pointer;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
    transition: all 0.15s;
    padding: 0;
  }
  .mobile-info-btn:hover {
    border-color: var(--accent-cyan);
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.25);
  }

  /* Drawer (mobile sidebar) */
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 499;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
  .drawer {
    position: fixed;
    right: 0;
    top: 0;
    height: 100%;
    width: 340px;
    max-width: 85vw;
    z-index: 500;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    overflow-y: auto;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.25s ease;
  }
  @keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  .drawer-close {
    position: sticky;
    top: 0;
    right: 0;
    z-index: 1;
    float: right;
    margin: 0.5rem;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .drawer-close:hover {
    background: var(--bg-primary);
    color: var(--text-primary);
  }

  @media (max-width: 900px) {
    .desktop-sidebar {
      display: none;
    }
    .mobile-info-btn {
      display: flex;
    }
    .summary-stats {
      gap: 1rem;
    }
    .stat { min-width: 60px; }
    .stat-value { font-size: 1rem; }
  }

  @media (max-width: 600px) {
    .bottom-bar {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      width: 100%;
    }
    .stat {
      min-width: 0;
    }
    .stat-value { font-size: 0.9rem; }
    .stat-label { font-size: 0.55rem; }
  }
</style>
