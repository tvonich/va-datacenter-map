<script>
  import { hoveredDatacenter, hoveredRegion } from '../stores.js';
  import { REGION_COLORS } from '../utils/colors.js';

  let x = $state(0);
  let y = $state(0);

  function handleMouseMove(e) {
    x = e.clientX;
    y = e.clientY;
  }

  // Attach a global listener
  import { onMount, onDestroy } from 'svelte';
  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);
  });
  onDestroy(() => {
    window.removeEventListener('mousemove', handleMouseMove);
  });

  let show = $derived($hoveredDatacenter || $hoveredRegion);
</script>

{#if show}
  <div
    class="tooltip"
    style="left: {x + 14}px; top: {y - 10}px;"
  >
    {#if $hoveredDatacenter}
      <div class="tooltip-header">
        <span class="operator">{$hoveredDatacenter.operator}</span>
      </div>
      <div class="tooltip-name">{$hoveredDatacenter.name}</div>
      <div class="tooltip-details">
        <div class="detail-row">
          <span class="detail-label">County</span>
          <span class="detail-value">{$hoveredDatacenter.county}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Opened</span>
          <span class="detail-value">{$hoveredDatacenter.year_opened}</span>
        </div>
        {#if $hoveredDatacenter.capacity_mw}
          <div class="detail-row">
            <span class="detail-label">Capacity</span>
            <span class="detail-value">{$hoveredDatacenter.capacity_mw} MW</span>
          </div>
        {/if}
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value status-{$hoveredDatacenter.status}">
            {$hoveredDatacenter.status?.replace('_', ' ')}
          </span>
        </div>
      </div>
    {:else if $hoveredRegion}
      <div class="tooltip-header">
        <span
          class="region-dot"
          style="background: {REGION_COLORS[$hoveredRegion.utility]?.base || '#666'}"
        ></span>
        <span class="operator">{REGION_COLORS[$hoveredRegion.utility]?.label || $hoveredRegion.utility}</span>
      </div>
      <div class="tooltip-name">{$hoveredRegion.county_name}</div>
      {#if $hoveredRegion.price}
        <div class="tooltip-details">
          <div class="detail-row">
            <span class="detail-label">Commercial Rate</span>
            <span class="detail-value">{$hoveredRegion.price.toFixed(1)}¢/kWh</span>
          </div>
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .tooltip {
    position: fixed;
    z-index: 1000;
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 0.6rem 0.8rem;
    pointer-events: none;
    max-width: 280px;
    box-shadow: var(--shadow);
  }

  .tooltip-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.15rem;
  }

  .operator {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--accent-cyan);
  }

  .region-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tooltip-name {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.4rem;
    color: var(--text-primary);
  }

  .tooltip-details {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.75rem;
  }

  .detail-label {
    color: var(--text-muted);
  }

  .detail-value {
    font-family: var(--font-mono);
    font-weight: 500;
    color: var(--text-secondary);
  }

  .status-operational { color: var(--accent-green); }
  .status-under_construction { color: var(--accent-amber); }
  .status-planned { color: var(--text-muted); }
</style>
