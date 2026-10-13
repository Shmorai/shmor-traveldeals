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

## History & decisions (from the setup chat "Shmor: master site & network setup", 2026-10-13)
- **Why this site exists:** first marketplace of the Shmor network. Shmor.ai is the master hub. Each marketplace is its **own marketable brand on a subdomain prefix** (`<brand>.shmor.ai`; the user first suggested `www.traveldeals/shmor.ai`, which isn't a valid web address, so we agreed on `traveldeals.shmor.ai`). It replaced the planned "Shmor Travel" (`travel.shmor.ai`) entry.
- **SEO is the priority:** the user wants TravelDeals to be **self-marketable on Google** with its own keywords, pages and tags. Google treats a subdomain largely as its own site, so it must earn rankings through its own landing pages, content and links. Hence one JSON file = one keyword landing page, static HTML (not JS-rendered), unique titles/descriptions, JSON-LD (WebSite, Organization, BreadcrumbList, FAQPage), sitemap and robots, noindex search page. Meta keywords tags are deliberately not used (Google ignores them).
- **Markets:** US, UK and Europe. Copy uses both "holiday" and "vacation" and covers consumer protection in each (ATOL / UK Package Travel Regulations, EU Package Travel Directive, US = provider terms + insurance) and flight rights (UK261/EU261, US DOT refunds).
- **Content rules:** factual, evergreen, no invented prices/deals/stats/reviews. No year in titles.
- **Design brief:** own look distinct from shmor.ai but in the family. Dark "sunset over the ocean": the hero has a CSS sun, a dashed flight path and sea lines. The sun was moved aside on mid-size screens so text stays readable. Numbered highlight tiles with a sunset rule. A sunset-gradient search band at the bottom. Mobile checked at 375px (no horizontal scroll).
- **Referral links:** none yet. The user has to be approved by travel programmes (Awin is strongest in the UK/EU, CJ/Impact in the US). Links go in `shmor-site.json`, are rendered as `https://shmor.ai/go/?to=<slug>&src=traveldeals-<page>` with `rel="sponsored nofollow"`, and were tested end to end with a dummy link (since removed).
- **Status:** pre-launch. The repo isn't on GitHub yet (offer to create the **private** repo `Shmorai/shmor-traveldeals` via the user's Chrome and push as a backup, only with the user's OK). Not public, no DNS.
- **Chat setup:** this site has its own pinned chat titled "TravelDeals". The master/network chat is pinned separately.

## Ideas / next
Referral links from travel programmes · a social share image (1200×630, set `seo.image`) · more destination pages (Tenerife, Lanzarote, Dubai, Cancún, Greece, Turkey) · US "vacation" pages.
