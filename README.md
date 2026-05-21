# Dominance Redefined — Verstappen 2023

An interactive data-visualization project measuring Max Verstappen's 2023 Formula 1 season — within-season dominance, driver vs. car, F1 history, and cross-sport context.

**Author:** Varun Brahma
**Course:** CS 360, Data Visualization — Final Project
**Live site:** https://varun1421.github.io/Verstappen/

This README doubles as the User Manual.

---

## How to Use the Visualization

Open the live site at **https://varun1421.github.io/Verstappen/** in a modern browser (Chrome, Safari, Firefox, or Edge — current versions). The page is a long-form scroll. A sticky mini-nav appears once you scroll past the hero — use it to jump between sections, or scroll naturally.

**Bar chart race (2023 championship progression).** Plays automatically. Use the ▶ / ⏸ button to pause, and drag the slider to scrub to any race round. Hover a bar for the driver, race name, and cumulative points. A "record tracker" panel below the chart updates as Verstappen breaks each milestone (9 wins streak, 10 wins streak, title clinched at Qatar, 454-point benchmark passed, 18 wins, 19 wins) — click any milestone marker on the timeline (or press Enter / Space when it's focused) to jump straight to that round.

**Verstappen vs Pérez (small multiples + season totals).** Hover any point in the small-multiples grid to synchronize a guideline across both driver rows at the same race round, so you compare the two drivers at the same moment in the season. The toolbar above (Show Both / Highlight Verstappen / Highlight Pérez) dims the other driver in both the small multiples and the season-totals bar chart.

**Parallel coordinates (vs historic F1 seasons).** Each colored line is one historically dominant season, normalized to a shared 0–1 scale across six metrics. Hover a line for the full breakdown; click a line or a legend row to lock focus on it. Multiple seasons can be focused at once.

**ECDF (cross-sport dominance).** Each curve shows the share of events in which the athlete cleared a given sport-relative percentile threshold. The gray dashed band is a "typical elite" reference. Hover any curve for the breakdown at the 90 / 95 / 100 percentile thresholds. Click curves or legend rows to focus a subset.

**Tooltips** appear on hover throughout. **Back-to-top** button appears in the bottom right once you scroll past the hero.

---

## Dependencies

All runtime dependencies are loaded from public CDNs at page load — there is nothing to install.

| Dependency | Version | Source |
|---|---|---|
| D3.js | v7 | `https://d3js.org/d3.v7.min.js` |
| Oswald (Google Font) | 500 / 600 / 700 | `fonts.googleapis.com` |

---

## Data Notes

The 2023 F1 base data is from the publicly available **JDAustralia 2023 F1 Season** dataset on Kaggle. Derived CSVs in `data/` were produced from that source for the bar chart race, the teammate comparison and the small multiples.

Historical F1 seasons in the parallel-coordinates chart (Ascari 1952 → Hamilton 2020) were not part of that Kaggle file. Per-season totals were pulled from public Formula 1 references and compiled into `dominant_seasons.csv`. Cross-sport per-event positions (tennis, soccer, cricket, swimming) were assembled from public records into `ecdf_dominance.csv`.

A large language model was used sparingly during data preparation — primarily to reformat CSV rows, normalize driver and team name spellings across sources, and flag inconsistencies for manual review. Every numeric value used by the visualizations was reviewed against its source before being committed.

The in-page **Data & Methodology** section explains the normalization choices (rate-based metrics, points-capture ceiling per era, and the sport-relative percentile formula used for the ECDF).

---

## For Future Maintainers

Each chart lives in its own file under `js/` and owns its own rendering and interaction state. `main.js` is the single entry point — it loads the CSVs, coerces every numeric column from string to number (D3 reads CSV values as strings by default), and then calls one `draw*()` function per chart. The synchronized driver-focus state between the small multiples and the season-totals bars is wired through two global hooks: `window.setDriverComparisonFocus` and `window.setStatsComparisonFocus`. Adding a new chart means creating a new `js/your-chart.js`, adding a `<script>` tag at the bottom of `index.html`, and dispatching to it from `main.js`.

If you need to run the project locally instead of using the live site, serve the folder over HTTP (e.g. `python3 -m http.server 8000`) and open `http://localhost:8000` — opening `index.html` via `file://` will fail because browsers block `d3.csv()` from loading local files.
