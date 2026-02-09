<script>
  import { selectedRegion, selectedYear, pricing, datacenters, visibleDatacenters, countyUtilityMap } from '../stores.js';
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

  const MIN_YEAR = 2010;
  const MAX_YEAR = 2025;
  const CHART_W = 280;
  const CHART_H = 100;
  const PAD = { top: 8, right: 32, bottom: 4, left: 4 };

  // Build sparkline data for the selected region — price + DC count per year
  let sparklineData = $derived.by(() => {
    const key = $selectedRegion || 'dominion';
    const p = $pricing;
    const allDCs = $datacenters;
    const utilMap = $countyUtilityMap;
    if (!p?.utilities?.[key]?.data) return [];

    const years = [];
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const price = p.utilities[key].data[y]?.commercial ?? null;
      const regionStats = (allDCs.length && utilMap) ? countByRegion(allDCs, utilMap, y) : null;
      years.push({
        year: y,
        price,
        dcCount: regionStats?.counts?.[key] ?? 0,
      });
    }
    return years;
  });

  // Scales shared across path builders
  let scales = $derived.by(() => {
    if (!sparklineData.length) return null;
    const prices = sparklineData.map(d => d.price).filter(p => p != null);
    const counts = sparklineData.map(d => d.dcCount);
    const minP = Math.min(...prices) - 0.5;
    const maxP = Math.max(...prices) + 0.5;
    const maxC = Math.max(...counts, 1);
    const plotW = CHART_W - PAD.left - PAD.right;
    const plotH = CHART_H - PAD.top - PAD.bottom;

    return {
      x: (i) => PAD.left + (i / (sparklineData.length - 1)) * plotW,
      yPrice: (p) => PAD.top + plotH - ((p - minP) / (maxP - minP)) * plotH,
      yCount: (c) => PAD.top + plotH - (c / maxC) * plotH,
      minP, maxP, maxC, plotH, plotW,
    };
  });

  let pricePath = $derived.by(() => {
    if (!scales) return { line: '', area: '' };
    const pts = sparklineData
      .map((d, i) => d.price != null ? { x: scales.x(i), y: scales.yPrice(d.price) } : null)
      .filter(Boolean);
    if (!pts.length) return { line: '', area: '' };
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${CHART_H - PAD.bottom} L ${pts[0].x.toFixed(1)} ${CHART_H - PAD.bottom} Z`;
    return { line, area };
  });

  let dcCountPath = $derived.by(() => {
    if (!scales) return { line: '', area: '' };
    const pts = sparklineData.map((d, i) => ({ x: scales.x(i), y: scales.yCount(d.dcCount) }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${CHART_H - PAD.bottom} L ${pts[0].x.toFixed(1)} ${CHART_H - PAD.bottom} Z`;
    return { line, area };
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
      <div class="chart-header">
        <h4>Rate vs. Datacenter Growth</h4>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-swatch" style="background: {regionData.region?.base || '#3b82f6'}"></span>¢/kWh</span>
          <span class="legend-item"><span class="legend-swatch" style="background: var(--accent-cyan)"></span>DCs</span>
        </div>
      </div>
      <div class="sparkline-container" bind:this={chartContainer}>
        <svg viewBox="0 0 {CHART_W} {CHART_H}" class="sparkline-svg">
          {#if scales}
            <!-- DC count area + line (behind price) -->
            <path d={dcCountPath.area} fill="var(--accent-cyan)" opacity="0.08" />
            <path d={dcCountPath.line} fill="none" stroke="var(--accent-cyan)" stroke-width="1.5" opacity="0.5" stroke-dasharray="3 2" />

            <!-- Price area + line -->
            <path d={pricePath.area} fill={regionData.region?.base || '#3b82f6'} opacity="0.15" />
            <path d={pricePath.line} fill="none" stroke={regionData.region?.base || '#3b82f6'} stroke-width="2" />

            <!-- Current year indicators -->
            {#each sparklineData as d, i}
              {#if d.year === $selectedYear}
                {#if d.price != null}
                  <circle cx={scales.x(i)} cy={scales.yPrice(d.price)} r="4"
                    fill={regionData.region?.base || '#3b82f6'} stroke="white" stroke-width="1.5" />
                {/if}
                <circle cx={scales.x(i)} cy={scales.yCount(d.dcCount)} r="3"
                  fill="var(--accent-cyan)" stroke="white" stroke-width="1" />
              {/if}
            {/each}

            <!-- Right axis labels for DC count -->
            <text x={CHART_W - 2} y={PAD.top + 3} text-anchor="end" class="axis-label" fill="var(--accent-cyan)">{scales.maxC}</text>
            <text x={CHART_W - 2} y={CHART_H - PAD.bottom - 2} text-anchor="end" class="axis-label" fill="var(--accent-cyan)">0</text>
          {/if}
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

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .chart-header h4 {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .chart-legend {
    display: flex;
    gap: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.55rem;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .legend-swatch {
    width: 8px;
    height: 3px;
    border-radius: 1px;
  }

  .axis-label {
    font-size: 7px;
    font-family: var(--font-mono);
    opacity: 0.7;
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
