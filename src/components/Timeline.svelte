<script>
  import { selectedYear } from '../stores.js';

  const MIN_YEAR = 2010;
  const MAX_YEAR = 2025;

  function handleInput(e) {
    selectedYear.set(Number(e.target.value));
  }
</script>

<div class="timeline">
  <span class="year-label">{MIN_YEAR}</span>
  <div class="slider-container">
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
    gap: 0.75rem;
    flex: 1;
    min-width: 200px;
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
    height: 24px;
    display: flex;
    align-items: center;
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
