# Virginia Datacenter Map — Session Continuity

## Recent Changes

### Session 1 (2026-02-08/09) — Initial Build + Feature Polish
- Scaffolded Svelte 5 + Vite project with MapLibre GL JS
- Compiled 113-facility datacenter dataset, EIA pricing data (4 utilities, 2010-2025), VA county GeoJSON
- Built interactive map: county boundaries colored by utility region, datacenter markers clustered at low zoom, hover tooltips, clickable utility regions with sidebar detail panel
- Implemented year-range timeline slider (2010-2025) with play/pause button and cumulative DC spark area
- Added marker animation: new facilities fade in when scrubbing timeline
- Added marker clustering with click-to-zoom on clusters (cluster counts auto-calculate)
- Created intro overlay card (dismissible) explaining Virginia's datacenter dominance
- Implemented dual-axis sparkline chart: electricity rate + DC count per year per utility region
- Added marker spread algorithm: coordinates <0.002° apart pushed away to prevent overlap at high zoom
- Deployed to GitHub Pages at https://tvonich.github.io/va-datacenter-map/ with CI/CD from main branch

**Commits:**
- `ad6505b` — Initial build: VA datacenter map visualization
- `e192213` — Fix data fetch paths for GitHub Pages base URL
- `f1bdcce` — Add auto-play button and cumulative DC spark area to timeline
- `4786185` — Add marker clustering and timeline animation
- `15398ad` — Add intro overlay, dual-axis trend chart, and marker spread

## Branch State

- **Main**: `15398ad` (Add intro overlay, dual-axis trend chart, and marker spread)
- **Live site**: https://tvonich.github.io/va-datacenter-map/ (deployed from main)

## Active Work

None — session complete.

## Known Limitations / Future Work

- Bundle size warning: 1.1 MB uncompressed (~315 KB gzip). Could optimize with dynamic imports if needed.
- No mobile-specific layout tweaks yet (sidebar hidden on <900px, but map interactions are desktop-optimized).
- Coordinate jitter algorithm is O(n²) but acceptable for n≈113 facilities.
- Pricing data currently static (2010-2025); could integrate live EIA API for updates.

## Notes

- Intro overlay uses Svelte 5 runes (`$state`); initial visibility controlled by local state, not a store (dismissal is session-only, not persisted).
- Dual-axis chart scales independently: left axis (¢/kWh) auto-scales to price range, right axis (DC count) scales to max for region.
- Marker spread runs on data load, modifying original coordinates slightly — all adjustments <0.001° to keep markers recognizable.
- GitHub Pages deployment via Actions workflow: pushes to main trigger auto-build + deploy to `https://tvonich.github.io/va-datacenter-map/`.
