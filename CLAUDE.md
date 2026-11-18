# TravelDeals (traveldeals.shmor.ai)

A Shmor marketplace (shared rules in `../../CLAUDE.md`): its own brand, design and SEO. Compares holiday deals, flights, hotels and city breaks for US, UK and EU travellers. Repo: `Shmorai/shmor-traveldeals` (private until launch). Status: **live**, with TravelUp (CJ) referral links (see "Affiliate partners").

## Where things are
| What | Where |
|---|---|
| Card on shmor.ai, search keywords, **referral links**, offers, SEO defaults | `shmor-site.json` |
| Pages (1 JSON file = 1 Google landing page) | `content/` (`home.json` = homepage, `content/destinations/x.json` → `/destinations/x/`) |
| Design: header, logo, footer | `templates/layout.html` |
| Design: styles | `assets/site.css` (kit defaults at the top; **TravelDeals theme** block at the bottom) |
| Generated output (don't edit by hand) | `index.html`, `*/index.html`, `sitemap.xml`, `robots.txt`, `404.html`, `search/`, `search-index.json` |

## Pages (16)
Home · all-inclusive-holidays · last-minute-holidays · cheap-flights · hotel-deals · city-breaks · package-holidays · family-holidays · destinations · destinations/canary-islands · destinations/orlando · blog (+4 posts).
Top menu = pages with `navOrder` (All-inclusive, Last minute, Flights, Hotels, City breaks, Destinations).

## Design
"Bright metasearch" (redesigned 2026-10-13 at the user's request to look more like trivago.com; style only, no trivago branding): white pages, Inter font, ocean blue #0A6CD6 (buttons, links), coral #FF6B4A (deal badges; matches the shmor.ai card accent), green #12805C ("View deal" buttons), grey bands #F3F5F8. Logo = white map pin with a coral dot in a blue rounded square + "Travel**Deals**" + "by Shmor.ai" pill (links to shmor.ai). Home: centred hero with one big white search card (Destination + "Trip type" select added by `assets/site.js`, folded into `?q=`), quick chips, then the "Start exploring" cards moved up with CSS `order` (HTML order unchanged). Cards have colour-gradient "photo" panels. Inner pages: grey title band with breadcrumbs. Bottom CTA = blue band. Light grey footer. Mobile checked at 375px (search stacks, no horizontal scroll). The previous dark "sunset over the ocean" theme is in git history.
**Photos:** every page has an `"image"` in its content JSON: `{ "src": "https://images.unsplash.com/photo-…", "alt", "credit", "creditUrl" }`. It becomes the page's photo banner (white text over a dark overlay, credit bottom-right), the photo on its "Start exploring"/related card, its search-result thumbnail and its og:image (1200×630). Photos are free-licence Unsplash images (not Unsplash+), hotlinked from their CDN and resized by URL. To change one, swap `src`/`credit`/`creditUrl` and rebuild. New pages should always get an image.

## Blog (/blog/)
Added 2026-10-13 to win Google traffic with timely, original posts (the user asked for "live updated blogs" on popular travel topics; we agreed copying other sites' posts wouldn't help SEO, so we publish our own).
- Index: `content/blog.json` (`"type": "blog"`, menu item "Travel blog"). Posts: `content/blog/<slug>.json` with `"type": "post"`, `"date"`, `"updated"`, `image`, `sections`, `faqs`, optional `"sources": [{title,url}]` (official sources for any rules/fees/dates).
- The build adds BlogPosting JSON-LD, byline + date + reading time, "More travel reads", the RSS feed `/blog/feed.xml`, and the 3 newest posts on the homepage (`"latestPosts": 3` in home.json).
- Posts so far: EES & ETIAS, UK ETA, winter sun, Christmas market city breaks.
- **Linking & routing:** every post is linked from 1–3 relevant pages via their `"related"` list (cards with photos), and its topic terms are added to `shmor-site.json` "keywords" so searches on shmor.ai route here (then sync the master).
- **Weekly automation:** scheduled task "TravelDeals: weekly blog posts" (Mondays ~9:10, runs while the Claude app is open) researches trends, adds 2 posts, links them from older pages, adds routing keywords, re-checks dated facts, rebuilds, syncs, commits and pushes both repos (user approved auto-push). After launch: connect Google Search Console and submit the sitemap, then use its query data to improve titles/descriptions.
- Writing rules: research current facts with web search and confirm on official sites (europa.eu, gov.uk, airport/tourism sites). Write "as of" wording for anything that changes, link the official source, no invented prices/stats/quotes, link to relevant TravelDeals pages, and add a free-licence Unsplash image. Refresh `updated` when a post's facts are re-checked.

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
- **Design brief (original, since replaced, see Design):** own look distinct from shmor.ai but in the family. Dark "sunset over the ocean": the hero has a CSS sun, a dashed flight path and sea lines. The sun was moved aside on mid-size screens so text stays readable. Numbered highlight tiles with a sunset rule. A sunset-gradient search band at the bottom. Mobile checked at 375px (no horizontal scroll).
- **Referral links:** none yet. The user has to be approved by travel programmes (Awin is strongest in the UK/EU, CJ/Impact in the US). Links go in `shmor-site.json`, are rendered as `https://shmor.ai/go/?to=<slug>&src=traveldeals-<page>` with `rel="sponsored nofollow"`, and were tested end to end with a dummy link (since removed).
- **Status:** pre-launch. Backed up to the **private** repo `Shmorai/shmor-traveldeals` (created 2026-10-13, branch `main`). Pages off, not public, no DNS. Push after commits; going public only when the user says launch.
- **Chat setup:** this site has its own pinned chat titled "TravelDeals". The master/network chat is pinned separately.

## Affiliate partners (live)
- **TravelUp** (CJ advertiser 6248437, joined; 2026-11-18). UK travel agent: flights £8–15 per booking, hotels 4%, packages 3%; 45-day cookie; locks after 90 days. Terms: no "TravelUp" in our URLs/slugs (so slugs are `cj6248437-*`), only CJ-supplied images, only programme-issued codes, no "official site" claims, no brand bidding.
- All codes generated in CJ for the **TravelDeals website property (PID 101926854)**. Links in `shmor-site.json`: homepage/flights/hotels/holidays/Florida deep links, evergreen text link, 6 banners (728x90 + 300x250 pairs; images self-hosted in `assets/img/partners/` because CJ's image URLs redirect to http and break in Chrome), Paris (TU30) and Gran Canaria (HOTEL20) offers. Dated items `expires: 2026-12-31` with `then` fallbacks.
- Placements use build tokens `[[link:]]`, `[[button:]]`, `[[banner:]]` in pages and 6 blog posts (see the shmor-network skill, section B2).

- **OVAGO** (CJ advertiser 6880275, joined; added 2026-11-18). US flight search/booking (73% US bookings), prices in $. Per booking: domestic $8, international $13, business $20 (+$5–10 with insurance; tiers rise after 50/month); 45-day cookie. Terms like TravelUp (no brand in our URLs → `cj6880275-*`, CJ images only, programme codes only, expire dated deals, no "official site").
- Codes for TravelDeals (PID 101926854): evergreen/home, search, last-minute, international, Black Friday (expires 2026-11-30 → then home). Banners (self-hosted JPGs): "Cheap Flights" 728x90 + 300x250 (code CHEAPFLIGHTS30), "Last-Minute Flight Deals" 728x90 + 300x250 (LASTMINUTE30). Offers: LASTMINUTE30 (last-minute page), INTERNATIONAL30 (UK ETA + EES/ETIAS posts), BLACKFRIDAY50 (home + cheap-flights, until 30 Nov).
- Placed as the US option next to TravelUp: cards on home, cheap-flights, last-minute, Orlando; last-minute banner + button; links on cheap-flights, city-breaks (US), Orlando, winter-sun / UK ETA / EES posts; cheap-flights banner on the UK ETA post. Partner box heading is now "Search and book with our travel partners".

- **Oojo** (CJ advertiser 6868393, joined; added 2026-11-18). Online flight booking (Traveltech SIA, Latvia; serves US/UK/CA/DE). $15 per booking not cancelled within the month; 45-day cookie; no brand bidding; programme/public codes allowed. Codes for TravelDeals (PID 101926854): `cj6868393-newuser` (US/CAN link 15789169, UK link 15789174 → oojo.com/en-GB), generic, concierge, Italy banner 350x250 (self-hosted). Not used: "Rated 4.8/5" text (unverifiable rating), Black Friday and tall banners.
- Placed: "$50 off your first flight booking" offer card (home, cheap-flights), Italy banner + link + card on /destinations/, links on family-holidays and city-breaks.

## Ideas / next
More travel programmes (HopeGoo, Air India are joined in CJ) · a social share image (1200×630, set `seo.image`) · more destination pages (Tenerife, Lanzarote, Dubai, Cancún, Greece, Turkey) · US "vacation" pages.
