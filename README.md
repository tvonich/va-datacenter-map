# Virginia's Datacenter Boom & the Cost of Power

Interactive map visualization exploring the explosive growth of data centers in Virginia (2010–present) and its relationship to electricity pricing across utility regions.

**[View Live](https://tvonich.github.io/va-datacenter-map/)**

## What This Shows

Virginia hosts more data center capacity than any other state — and the build-out is accelerating. This visualization lets you scrub through time to watch the boom unfold, county by county, while tracking how commercial electricity rates have shifted across the state's four utility territories.

**Key interactions:**
- **Timeline scrubber** — drag or auto-play through 2010–2025 to watch facilities appear
- **Hover** on a data center marker for operator, capacity (MW), and status
- **Hover** on a county to see its utility region and commercial rate
- **Click** a county or region tab to explore rate trends (commercial, industrial, residential)
- **Cluster zoom** — click grouped markers to zoom into dense areas (Northern Virginia)

**What you'll notice:**
- Northern Virginia dominates — Loudoun and Prince William counties alone account for the majority of capacity
- The post-2020 acceleration is stark, with dozens of facilities breaking ground simultaneously
- Dominion Energy's commercial rates have climbed as infrastructure demands grow
- The gap between utility regions tells a story about who bears the cost

## Data Sources

| Source | What it provides |
|--------|-----------------|
| [EIA Form 861](https://www.eia.gov/electricity/data/eia861/) | Electricity pricing by utility (2010–2025) |
| [JLARC](https://jlarc.virginia.gov/) | Data center inventory and policy analysis |
| Public filings & news | Facility locations, operators, capacities, opening dates |

The dataset currently tracks **113 facilities** across Virginia, including operational, under-construction, and planned sites.

## Tech Stack

- **[Svelte 5](https://svelte.dev/)** — reactive UI with runes
- **[MapLibre GL JS](https://maplibre.org/)** — open-source vector map rendering
- **[D3.js](https://d3js.org/)** — scales, color utilities, data transforms
- **[Vite](https://vite.dev/)** — build tooling
- **GitHub Pages** — hosting via GitHub Actions

## Running Locally

```bash
git clone https://github.com/tvonich/va-datacenter-map.git
cd va-datacenter-map
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Project Structure

```
src/
  App.svelte              # Root layout + data loading
  stores.js               # Reactive state (year, selections, derived stats)
  components/
    Map.svelte            # MapLibre map with clustered DC markers + county fill
    Timeline.svelte       # Year slider with auto-play + cumulative sparkline
    RegionPanel.svelte    # Sidebar: utility region rates + trends
    Header.svelte         # Title bar + data attribution
    Tooltip.svelte        # Mouse-tracking hover tooltip
    Legend.svelte          # Map legend (regions, sizes, opacity scale)
  utils/
    colors.js             # Region color palette, opacity/size scaling
    data.js               # Data loading, enrichment, aggregation

public/data/
  datacenters.json        # 113 facilities with location, capacity, status
  pricing-by-utility.json # Commercial/industrial/residential rates by year
  county-to-utility.json  # FIPS code to utility region mapping
  virginia-counties.geojson  # County boundary polygons
```

## License

MIT
