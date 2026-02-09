<script>
  import { onDestroy } from 'svelte';
  import { selectedYear, datacenters } from '../stores.js';

  const MIN_YEAR = 2010;
  const MAX_YEAR = 2025;
  const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);

  let playing = $state(false);
  let interval = null;

  // Compute cumulative DC counts per year for the spark area
  let cumulativeCounts = $derived.by(() => {
    const dcs = $datacenters;
    return YEARS.map(y => dcs.filter(dc => dc.year_opened <= y).length);
  });

  // Build SVG area path from cumulative counts
  let sparkPath = $derived.by(() => {
    const counts = cumulativeCounts;
    if (!counts.length) return { area: '', line: '' };
    const maxCount = Math.max(...counts, 1);
    const w = 100; // viewBox width percentage
    const h = 100; // viewBox height percentage
    const points = counts.map((c, i) => ({
      x: (i / (YEARS.length - 1)) * w,
      y: h - (c / maxCount) * h * 0.85, // leave 15% top padding
    }));

    const line = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    ).join(' ');

    const area = `${line} L ${w} ${h} L 0 ${h} Z`;
    return { area, line };
  });

  function handleInput(e) {
    if (playing) stopPlay();
    selectedYear.set(Number(e.target.value));
  }

  function togglePlay() {
    if (playing) {
      stopPlay();
    } else {
      startPlay();
    }
  }

  function startPlay() {
    // If at the end, restart from beginning
    if ($selectedYear >= MAX_YEAR) {
      selectedYear.set(MIN_YEAR);
    }
    playing = true;
    interval = setInterval(() => {
      selectedYear.update(y => {
        if (y >= MAX_YEAR) {
          stopPlay();
          return MAX_YEAR;
        }
        return y + 1;
      });
    }, 800);
  }

  function stopPlay() {
    playing = false;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div class="timeline">
  <button class="play-btn" onclick={togglePlay} title={playing ? 'Pause' : 'Play timeline'}>
    {#if playing}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    {/if}
  </button>

  <span class="year-label">{MIN_YEAR}</span>

  <div class="slider-container">
    <!-- Spark area chart behind the slider -->
    <svg class="spark-area" viewBox="0 0 100 100" preserveAspectRatio="none">
      {#if sparkPath.area}
        <path d={sparkPath.area} class="spark-fill" />
        <path d={sparkPath.line} class="spark-line" />
      {/if}
    </svg>

    <input
      type="range"
      min={MIN_YEAR}
      max={MAX_YEAR}
      step={1}
      value={$selectedYear}
      oninput={handleInput}
      class="slider"
    />
    <div class="track-fill" style="width: {(($selectedYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100}%"></div>
  </div>

  <span class="year-label">{MAX_YEAR}</span>
</div>

<style>
  .timeline {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1;
    min-width: 200px;
  }

  .play-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--bg-tertiary);
    color: var(--accent-cyan);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
    padding: 0;
  }

  .play-btn:hover {
    background: var(--bg-primary);
    border-color: var(--accent-cyan);
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.25);
  }

  .year-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .slider-container {
    position: relative;
    flex: 1;
    height: 40px;
    display: flex;
    align-items: center;
  }

  .spark-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  .spark-fill {
    fill: rgba(34, 211, 238, 0.08);
  }

  .spark-line {
    fill: none;
    stroke: rgba(34, 211, 238, 0.2);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: var(--border-color);
    border-radius: 2px;
    outline: none;
    position: relative;
    z-index: 2;
    cursor: pointer;
  }

  .track-fill {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 4px;
    background: linear-gradient(90deg, var(--accent-blue), var(--accent-cyan));
    border-radius: 2px;
    pointer-events: none;
    z-index: 1;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: var(--accent-cyan);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
    transition: box-shadow 0.2s;
  }

  .slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 16px rgba(34, 211, 238, 0.6);
  }

  .slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: var(--accent-cyan);
    border-radius: 50%;
    cursor: grab;
    border: none;
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
  }

  .slider::-moz-range-track {
    background: transparent;
  }
</style>
