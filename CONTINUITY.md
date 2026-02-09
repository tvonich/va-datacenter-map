# Virginia Datacenter Map — Session Continuity

## Recent Changes

### Session 2 (2026-02-09) — Cloudflare Migration + Mobile Responsiveness + Social Metadata
- Migrated hosting from GitHub Pages to Cloudflare Pages (removes GitHub username from URL)
- Set up GitHub Actions auto-deploy to Cloudflare Pages on push to main
- Fixed Vite `base` path from `/va-datacenter-map/` to `/` for Cloudflare root serving
- Added mobile responsiveness: slide-out sidebar drawer (≤900px), bottom bar vertical stacking (≤600px), collapsible legend, viewport-clamped tooltips with touch support, tap-to-view on map markers
- Added Open Graph + Twitter Card meta tags with generated OG preview image (1200x630 PNG)
- Disabled GitHub Pages on the repo

**Commits:**
- `cefb762` — Switch deploy from GitHub Pages to Cloudflare Pages
- `886cc63` — Fix base path for Cloudflare Pages
- `e0a47a8` — Add mobile responsiveness
- `92008ec` — Add Open Graph and Twitter Card meta tags

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

- **Main**: `92008ec` (Add Open Graph and Twitter Card meta tags)
- **Live site**: https://va-datacenter-map.pages.dev/ (Cloudflare Pages, deployed from main via GitHub Actions)

## Active Work

None — session complete.

## Known Limitations / Future Work

- Bundle size warning: 1.1 MB uncompressed (~315 KB gzip). Could optimize with dynamic imports if needed.
- Coordinate jitter algorithm is O(n²) but acceptable for n≈113 facilities.
- Pricing data currently static (2010-2025); could integrate live EIA API for updates.

## Notes

- Intro overlay uses Svelte 5 runes (`$state`); initial visibility controlled by local state, not a store (dismissal is session-only, not persisted).
- Dual-axis chart scales independently: left axis (¢/kWh) auto-scales to price range, right axis (DC count) scales to max for region.
- Marker spread runs on data load, modifying original coordinates slightly — all adjustments <0.001° to keep markers recognizable.
- Cloudflare Pages deployment via GitHub Actions: pushes to main trigger build + `wrangler pages deploy` to `https://va-datacenter-map.pages.dev/`.
- Cloudflare API token stored as GitHub secret `CLOUDFLARE_API_TOKEN`; account ID as `CLOUDFLARE_ACCOUNT_ID`.
- OG image generated with Pillow (not hand-designed); replace `public/og-image.png` with a screenshot for better social previews.
