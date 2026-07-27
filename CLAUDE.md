# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

A static single-page app showing 50 places to visit around Planfoy (Loire, France) on an
interactive map, for a family trip on August 1-9, 2026. Deployed to GitHub Pages at
https://quentinlebras.github.io/Planfoy/ — public, no login, no backend, no API key.

React 19 + TypeScript + Vite + MapLibre GL. No CSS framework, no state library, no router: one
stylesheet (`src/index.css`) and plain React state in `src/App.tsx`.

## Commands

```bash
npm install
npm run dev      # dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint, expected to be silent
npm test         # Commons API contract (node:test, type-stripped TS)
npm run preview  # serve dist/

# Headless browser smoke test. Playwright is deliberately NOT a dependency:
# its postinstall downloads browsers, which would slow every CI run.
npm i --no-save playwright
npm run preview & npm run smoke   # writes screenshots/
```

## Layout

```
src/
  App.tsx                    # all app state: filters, selection, view, dialogs
  index.css                  # every style, organized by section with comments
  types.ts                   # Place, Photo, Group, CategoryMeta
  data/
    recommandations.json     # SOURCE DATA — edit this to change places
    places.ts                # normalizes the JSON into typed Place objects
    taxonomy.ts              # 6 universes + 42 categories -> label, icon, color
    home.ts                  # rental address, trip dates, fallback pin
  lib/
    filters.ts               # Filters type, defaults, matches() predicate
    geo.ts                   # haversine, directions URLs, coordinate parsing
    images.ts                # Wikimedia Commons client
    mapStyles.ts             # the three raster basemaps
    useHome.ts               # routing origin + pin geocoding + manual override
    usePhotos.ts             # lazy photo loading per place
  components/
    MapView.tsx              # MapLibre wrapper, HTML markers
    Carousel.tsx             # bottom strip, two-way synced with the map
    ListView.tsx  FilterBar.tsx  PlaceCard.tsx  PlaceCover.tsx
    PlaceDetail.tsx          # full-screen sheet
    Lightbox.tsx  OriginDialog.tsx  InfoDialog.tsx
scripts/
  photos.test.mjs            # npm test
  smoke.mjs                  # npm run smoke
```

## Invariants that are easy to break

These each cost a debugging cycle. Do not undo them without reading why.

**MapLibre owns the marker root's `transform`.** It writes `transform: translate(...)` inline on
each `Marker` element to position it, which overrides any CSS `transform`. Every scale (hover,
active, zoom-based sizing) therefore lives on the inner `.pin__scale` wrapper, never on `.pin`.

**`.map` needs `isolation: isolate`.** Markers carry large inline z-indexes so southern pins stack
above northern ones. Without an isolating stacking context on the map container, those z-indexes
compete in the root context and markers paint straight over the full-screen sheet and the modals.

**The Commons API must be called with `formatversion=2`.** Version 1 returns `query.pages` as an
object keyed by page id rather than an array, so the parser throws, `Promise.allSettled` swallows
it, and every place silently falls back to a tinted cover with nothing in the console. `npm test`
fails if this regresses.

**Title-filter words need `\b` anchors.** `EXCLUDED_TITLE` in `images.ts` drops maps, coats of arms
and signage. An unanchored `sign` also matches `design`, which excluded every Cité du design photo.

**Vite `base` must match the repository name, including case.** It is `/Planfoy/`. GitHub Pages
serves the repo name case-sensitively; a mismatch gives a blank page with 404s on every asset.

**GitHub Pages has to be enabled by hand, once.** Settings › Pages › Source → GitHub Actions. The
workflow token cannot create the Pages site (`Resource not accessible by integration`), only deploy
to an existing one. `actions/configure-pages` with `enablement: true` does not work here.

**Carousel/map sync needs its suppression window.** `Carousel.tsx` centers a card programmatically
when the selection changes elsewhere, and reads the centered card when the user scrolls. Without
`suppressUntil` and the `selfReported` ref those two feed each other into a loop.

## Data

To add, edit or remove a place, edit `src/data/recommandations.json`. Then:

- A new `category` value must be added to `CATEGORIES` in `taxonomy.ts`, or it silently falls back
  to "Autre" in the culture universe.
- `audience` is prose, and `isKidFriendly()` in `places.ts` derives the kid filter from it with a
  regex. Check that function when adding audiences worded differently.
- `gps.precision` of `"site"` means a precise point; anything else is shown as an approximate
  landmark in the sheet. Keep that honest — several of these are not parking entrances.
- `verification_status` not starting with `verified` shows a "recheck before you go" notice.

Opening hours and seasonal events in the dataset should be rechecked 24-48 hours before the trip;
the app says so in the info dialog rather than pretending the data is live.

## Photos

The dataset's `curated_image_links` are used first. For places without a curated set,
`lib/images.ts` queries Wikimedia Commons from the browser, two ways in parallel: free-text search
on the place name, and geosearch around its coordinates (which is what covers unnamed natural
sites). Commons results are cached in `localStorage` under `planfoy:photos:v3:<id>` for 14 days —
bump the prefix when changing the shape of what is cached. Places with no photo get a tinted cover
plus external search links.

## Itineraries

Routing links use the rental's postal address string from `data/home.ts`, not coordinates, so Google
and Apple resolve the exact building. The map pin still needs a point: `useHome.ts` geocodes the
address once per browser via Nominatim, caches it for 90 days, and falls back to the village center
labeled as approximate. To drop that lookup entirely, set `FALLBACK_PIN` to the exact coordinates.
The 🧭 button lets a visitor start from somewhere else; that override is per browser.

## Conventions

- UI copy is French, because the data and the audience are French. Code, comments, commit messages
  and docs are US English.
- Conventional Commits.
- No emoji in code identifiers; emoji in UI strings and marker icons is intentional (it avoids
  needing a sprite sheet or a glyph server, which is also why there is no marker clustering — that
  would require `text-field`, hence a glyphs endpoint).
- Keep `npm run lint` silent and `npm test` green; both gate the deploy.
