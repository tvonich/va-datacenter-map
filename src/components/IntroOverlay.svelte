<script>
  let visible = $state(true);

  function dismiss() {
    visible = false;
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="overlay" onclick={dismiss}>
    <div class="card" onclick={(e) => e.stopPropagation()}>
      <h2>Virginia's Datacenter Boom</h2>
      <p>
        Virginia hosts more datacenter capacity than any other state — over 100 facilities
        concentrated in Northern Virginia's "Data Center Alley." The state's electricity
        demand is projected to rise 183% by 2040, driven almost entirely by AI and cloud
        infrastructure growth.
      </p>
      <p>
        This visualization maps every major facility from 2010 to present alongside
        electricity pricing by utility region, showing how infrastructure growth is
        reshaping Virginia's energy landscape.
      </p>
      <div class="actions">
        <button onclick={dismiss}>Explore the map</button>
      </div>
      <span class="hint">or click anywhere to dismiss</span>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .card {
    max-width: 480px;
    margin: 1.5rem;
    padding: 2rem 2.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 0 60px rgba(34, 211, 238, 0.08), 0 25px 50px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: center;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  h2 {
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.65;
    margin-bottom: 0.75rem;
  }

  .actions {
    margin-top: 1.25rem;
  }

  button {
    padding: 0.6rem 1.5rem;
    background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
    color: var(--bg-primary);
    border: none;
    border-radius: 6px;
    font-family: var(--font-sans);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
  }

  .hint {
    display: block;
    margin-top: 0.6rem;
    font-size: 0.65rem;
    color: var(--text-muted);
  }

  @media (max-width: 600px) {
    .card {
      padding: 1.5rem 1.25rem;
      margin: 1rem;
    }
    h2 { font-size: 1.15rem; }
    p { font-size: 0.8rem; }
  }
</style>
