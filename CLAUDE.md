# TravelDeals (traveldeals.shmor.ai)

A Shmor marketplace (shared rules in `../../CLAUDE.md`): its own brand, design and SEO. Compares holiday deals, flights, hotels and city breaks for US, UK and EU travellers. Repo: `Shmorai/shmor-traveldeals` (private until launch). Status: **building**, with no referral links yet.

## Where things are
| What | Where |
|---|---|
| Card on shmor.ai, search keywords, **referral links**, offers, SEO defaults | `shmor-site.json` |
| Pages (1 JSON file = 1 Google landing page) | `content/` (`home.json` = homepage, `content/destinations/x.json` → `/destinations/x/`) |
| Design: header, logo, footer | `templates/layout.html` |
| Design: styles | `assets/site.css` (kit defaults at the top; **TravelDeals theme** block at the bottom) |
| Generated output (don't edit by hand) | `index.html`, `*/index.html`, `sitemap.xml`, `robots.txt`, `404.html`, `search/`, `search-index.json` |

## Pages (11)
Home · all-inclusive-holidays · last-minute-holidays · cheap-flights · hotel-deals · city-breaks · package-holidays · family-holidays · destinations · destinations/canary-islands · destinations/orlando.
Top menu = pages with `navOrder` (All-inclusive, Last minute, Flights, Hotels, City breaks, Destinations).

## Design
"Sunset over the ocean": navy #07111C, surface #0D1B2A, coral #FF6B4A (buttons, "Deals"), lagoon teal #2EC4B6 (links), sun #FFC15E. Fonts Outfit + Inter. Logo = sun over sea lines in a rounded square + "Travel**Deals**" + "by Shmor.ai" tag. The home hero has a sun, a dashed flight path and sea lines (CSS only).

## Commands (run here)
```bash
node tools/build.js           # rebuild all pages after ANY change to content/, templates/ or shmor-site.json
node tools/build.js --check   # validate only
node tools/serve.js 4001      # preview http://localhost:4001  (preview config "traveldeals")
```
After changing `shmor-site.json` (links, keywords, card), also run `node tools/sync-network.js` in `../../shmor-ai`.

## Adding referral links
1. Add to `shmor-site.json` → `"links"`: `"slug": { "merchant", "network": "awin|cj|…", "url": "https://…" }` (or `"url": { "us", "uk", "eu" }`).
2. Show it on pages: add the slug to a page's `"partners": [...]`, or add an `"offers"` entry (`"pages": ["slug"]` to limit where it shows).
3. `node tools/build.js`, then sync the master, then commit both repos.

## Ideas / next
Referral links from travel programmes · a social share image (1200×630, set `seo.image`) · more destination pages (Tenerife, Lanzarote, Dubai, Cancún, Greece, Turkey) · US "vacation" pages.
