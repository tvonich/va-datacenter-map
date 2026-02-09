<script>
  import { onMount } from 'svelte';
  import { selectedRegion, selectedYear, pricing, visibleDatacenters, countyUtilityMap } from '../stores.js';
  import { REGION_COLORS } from '../utils/colors.js';
  import { getUtilityPrice, countByRegion } from '../utils/data.js';

  let chartContainer;

  let regionData = $derived.by(() => {
    const key = $selectedRegion || 'dominion';
    const p = $pricing;
    const year = $selectedYear;
    const region = REGION_COLORS[key];

    const price = getUtilityPrice(p, key, year, 'commercial');
    const industrialPrice = getUtilityPrice(p, key, year, 'industrial');
    const residentialPrice = getUtilityPrice(p, key, year, 'residential');

    // Count DCs in this region
    let dcCount = 0;
    let totalMW = 0;
    const dcs = $visibleDatacenters;
    const utilMap = $countyUtilityMap;
    if (dcs && utilMap) {
      const regionStats = countByRegion(dcs, utilMap, year);
      dcCount = regionStats.counts[key] || 0;
      totalMW = regionStats.mw[key] || 0;
    }

    return { key, region, price, industrialPrice, residentialPrice, dcCount, totalMW };
  });

  // Build sparkline data for the selected region
  let sparklineData = $derived.by(() => {
    const key = $selectedRegion || 'dominion';
    const p = $pricing;
    if (!p?.utilities?.[key]?.data) return [];

    return Object.entries(p.utilities[key].data)
      .map(([year, vals]) => ({ year: Number(year), price: vals.commercial }))
      .sort((a, b) => a.year - b.year);
  });

  let sparklinePath = $derived.by(() => {
    if (!sparklineData.length) return '';
    const width = 280;
    const height = 80;
    const pad = 4;
    const prices = sparklineData.map(d => d.price);
    const minP = Math.min(...prices) - 0.5;
    const maxP = Math.max(...prices) + 0.5;
    const xScale = (i) => pad + (i / (sparklineData.length - 1)) * (width - 2 * pad);
    const yScale = (p) => height - pad - ((p - minP) / (maxP - minP)) * (height - 2 * pad);

    return sparklineData.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.price).toFixed(1)}`
    ).join(' ');
  });

  let sparklineArea = $derived.by(() => {
    if (!sparklineData.length) return '';
    const width = 280;
    const height = 80;
    const pad = 4;
    const prices = sparklineData.map(d => d.price);
    const minP = Math.min(...prices) - 0.5;
    const maxP = Math.max(...prices) + 0.5;
    const xScale = (i) => pad + (i / (sparklineData.length - 1)) * (width - 2 * pad);
    const yScale = (p) => height - pad - ((p - minP) / (maxP - minP)) * (height - 2 * pad);

    const linePart = sparklineData.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.price).toFixed(1)}`
    ).join(' ');
    return `${linePart} L ${xScale(sparklineData.length - 1).toFixed(1)} ${height - pad} L ${pad} ${height - pad} Z`;
  });

  function selectRegion(key) {
    selectedRegion.set(key);
  }
</script>

<div class="panel">
  <div class="region-tabs">
    {#each Object.entries(REGION_COLORS) as [key, color]}
      <button
        class="region-tab"
        class:active={($selectedRegion || 'dominion') === key}
        style="--tab-color: {color.base}"
        onclick={() => selectRegion(key)}
      >
        <span class="tab-dot" style="background: {color.base}"></span>
        <span class="tab-label">{color.label}</span>
      </button>
    {/each}
  </div>

  <div class="region-detail">
    <div class="region-header">
      <span class="region-dot" style="background: {regionData.region?.base}"></span>
      <h3>{regionData.region?.label || 'Unknown'}</h3>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{regionData.price ? regionData.price.toFixed(1) + '¢' : '—'}</span>
        <span class="stat-label">Commercial ¢/kWh</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{regionData.industrialPrice ? regionData.industrialPrice.toFixed(1) + '¢' : '—'}</span>
        <span class="stat-label">Industrial ¢/kWh</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{regionData.dcCount}</span>
        <span class="stat-label">Data Centers</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{regionData.totalMW.toLocaleString()}</span>
        <span class="stat-label">Total MW</span>
      </div>
    </div>

    <div class="chart-section">
      <h4>Commercial Rate Trend</h4>
      <div class="sparkline-container" bind:this={chartContainer}>
        <svg viewBox="0 0 280 80" class="sparkline-svg">
          {#if sparklineArea}
            <path d={sparklineArea} fill={regionData.region?.base || '#3b82f6'} opacity="0.15" />
            <path d={sparklinePath} fill="none" stroke={regionData.region?.base || '#3b82f6'} stroke-width="2" />
          {/if}
          {#each sparklineData as d, i}
            {#if d.year === $selectedYear}
              <circle
                cx={4 + (i / (sparklineData.length - 1)) * 272}
                cy={(() => {
                  const prices = sparklineData.map(s => s.price);
                  const minP = Math.min(...prices) - 0.5;
                  const maxP = Math.max(...prices) + 0.5;
                  return 80 - 4 - ((d.price - minP) / (maxP - minP)) * 72;
                })()}
                r="4"
                fill={regionData.region?.base || '#3b82f6'}
                stroke="white"
                stroke-width="1.5"
              />
            {/if}
          {/each}
        </svg>
        <div class="sparkline-labels">
          <span>2010</span>
          <span>2025</span>
        </div>
      </div>
    </div>

    <div class="info-note">
      <p>
        {#if regionData.key === 'dominion'}
          Dominion Energy serves ~70% of Virginia, including all major datacenter clusters in Northern Virginia. PJM capacity auction prices spiked 833% for 2025-26 delivery year.
        {:else if regionData.key === 'apco'}
          Appalachian Power serves western Virginia. Limited datacenter presence due to distance from major internet exchange points.
        {:else if regionData.key === 'cooperatives'}
          Rural electric cooperatives serve less densely populated areas. Some co-ops (NOVEC) serve areas adjacent to datacenter clusters.
        {:else}
          Municipal utilities serve small cities with their own power distribution. Most operate independently from the larger grid operators.
        {/if}
      </p>
    </div>
  </div>
</div>

<style>
  .panel {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .region-tabs {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: var(--border-color);
  }

  .region-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1rem;
    background: var(--bg-secondary);
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    transition: all 0.15s;
    text-align: left;
  }

  .region-tab:hover {
    background: var(--bg-tertiary);
  }

  .region-tab.active {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border-left: 3px solid var(--tab-color);
  }

  .tab-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tab-label {
    font-weight: 500;
  }

  .region-detail {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }

  .region-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .region-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .region-header h3 {
    font-size: 1rem;
    font-weight: 600;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
  }

  .stat-card .stat-value {
    font-family: var(--font-mono);
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--accent-cyan);
  }

  .stat-card .stat-label {
    font-size: 0.6rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-top: 0.15rem;
  }

  .chart-section {
    margin-bottom: 1rem;
  }

  .chart-section h4 {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    margin-bottom: 0.4rem;
  }

  .sparkline-container {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 0.5rem;
  }

  .sparkline-svg {
    width: 100%;
    height: auto;
  }

  .sparkline-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
    padding: 0.15rem 0.25rem 0;
  }

  .info-note {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 0.6rem 0.75rem;
  }

  .info-note p {
    font-size: 0.72rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
</style>
