<script>
  import { REGION_COLORS } from '../utils/colors.js';

  const regions = Object.entries(REGION_COLORS);
</script>

<div class="legend">
  <div class="legend-section">
    <h4>Utility Regions</h4>
    {#each regions as [key, color]}
      <div class="legend-item">
        <span class="legend-swatch" style="background: {color.base};"></span>
        <span class="legend-label">{color.label}</span>
      </div>
    {/each}
  </div>

  <div class="legend-section">
    <h4>Data Centers</h4>
    <div class="legend-item">
      <span class="dc-dot dc-small"></span>
      <span class="legend-label">&lt; 20 MW</span>
    </div>
    <div class="legend-item">
      <span class="dc-dot dc-medium"></span>
      <span class="legend-label">20–80 MW</span>
    </div>
    <div class="legend-item">
      <span class="dc-dot dc-large"></span>
      <span class="legend-label">&gt; 80 MW</span>
    </div>
  </div>

  <div class="legend-section">
    <h4>Region Opacity</h4>
    <div class="opacity-bar">
      <span class="opacity-label">Low rate</span>
      <div class="opacity-gradient"></div>
      <span class="opacity-label">High rate</span>
    </div>
  </div>
</div>

<style>
  .legend {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    background: var(--bg-glass);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 0.6rem 0.75rem;
    font-size: 0.7rem;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .legend-section h4 {
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    margin-bottom: 0.3rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.15rem;
  }

  .legend-swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .legend-label {
    color: var(--text-secondary);
    font-size: 0.68rem;
  }

  .dc-dot {
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
  }
  .dc-small { width: 6px; height: 6px; }
  .dc-medium { width: 11px; height: 11px; }
  .dc-large { width: 17px; height: 17px; }

  .opacity-bar {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .opacity-gradient {
    width: 60px;
    height: 8px;
    border-radius: 2px;
    background: linear-gradient(90deg, rgba(59,130,246,0.15), rgba(59,130,246,0.6));
  }

  .opacity-label {
    font-size: 0.58rem;
    color: var(--text-muted);
  }
</style>
