<script>
</script>

<header class="header">
  <div class="header-left">
    <h1>Virginia's Datacenter Boom</h1>
    <p class="subtitle">& the Cost of Power</p>
  </div>
  <div class="header-right">
    <span class="attribution">
      Data: EIA, JLARC, public records | 2010 — Present
    </span>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 1.05rem;
    font-weight: 300;
    color: var(--text-secondary);
  }

  .attribution {
    font-size: 0.7rem;
    color: var(--text-muted);
    letter-spacing: 0.03em;
  }

  @media (max-width: 700px) {
    .header { flex-direction: column; gap: 0.25rem; }
    h1 { font-size: 1.05rem; }
    .subtitle { font-size: 0.85rem; }
  }
</style>
