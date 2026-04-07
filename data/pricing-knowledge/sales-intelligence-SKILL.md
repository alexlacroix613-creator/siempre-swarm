---
name: siempre-sales-intelligence
description: "Unified sales and depletion data skill for Siempre Tequila. Merges VIP iDig (US depletions), Winebow DiverPort (CA/regional), Provincial portals (Canadian sales + Oklahoma), Prestige NWOW (shipments/revenue via Gmail), and Zoho Books (invoicing via Maton API) into a single comprehensive market intelligence workflow. Produces the monthly Market Health Briefing with RED/YELLOW/GREEN scoring across all 53 markets. Use when: (1) Monthly orchestration on business days 3-22, (2) Alex or Nick requests fresh depletion data, reconciliation check, or market rundown, (3) Need US/CA market performance metrics, (4) Interpreting depletion, shipment, or revenue data, (5) Understanding distributor dynamics or market scoring."
---

# Siempre Sales Intelligence

This is the master skill for all Siempre Tequila sales and depletion data. It unifies five distinct data sources into a single cohesive workflow to produce the monthly Market Health Briefing. It covers all 53 markets (28 US states + 7 Canadian provinces + others) and provides a complete picture of shipments, depletions, inventory, revenue, and distributor health.

---

## Company Context

**Siempre Spirits Limited** is a Canadian-Mexican tequila company. Two founders (Alex and Monica), 53 markets (28 US + 7 Canadian provinces), approximately $3.5M USD revenue, approximately 20,000 cases annually, +22% YoY. Two brands: Siempre Tequila (primary) and Tequila Chisme. Production: El Ranchito (NOM 1414), Arandas, Jalisco. 100% Blue Weber agave, additive-free.

### Three-Tier Distribution (US)

```
TIER 1: SUPPLIER (Siempre) -> TIER 2: DISTRIBUTOR -> TIER 3: RETAILER/ON-PREMISE -> CONSUMER
```

| Term | Definition |
|------|-----------|
| **Shipment** | Cases Tier 1 -> Tier 2. Tracked by Prestige. |
| **Depletion** | Cases Tier 2 -> Tier 3. Tracked by VIP iDig. **This is what matters.** |
| **Ship-Depl Gap** | Healthy: 0.8x-1.2x. Above 2x = warehouse problem. |
| **Reorder Rate** | % accounts ordering 2+ times in 90 days. Heartbeat of a market. |
| **DA** | Depletion Allowance: incentive per case depleted. |
| **Brand Dev** | Marketing spend through distributor (tastings, POS, programming). |
| **Control State** | Government IS the distributor (VA, NC, NH, OH). Different dynamics. |

**Canada**: No three-tier. Provincial liquor boards (LCBO, BCLDB, AGLC, SAQ, NSLC, MLCC, SLGA). Data lags 60-90 days. VIP iDig is US-only.

### Data Flow

```
Distributors -> eoStar (ERP) -> VIP SRS -> iDig reports
Prestige -> monthly NWOW reconciliation -> Gmail
Monica -> manual invoice entry -> Zoho Books (state-tagged)
Provincial boards -> individual portals -> browser automation
Winebow -> DiverPort BI portal -> browser automation
```

### Key Distributors (2026)

Florida: switching to **Maverick** (March 15, 2026). Georgia: United. California: Winebow. Arizona: JB Maverick. Virginia/NC: Control states. Minnesota: Johnson Brothers. US Importer: Prestige Beverage Group (PBG).

### Product Line

| SKU | Role | Typical SRP | Core? |
|-----|------|-------------|-------|
| Siempre Plata | Entry point, the door opener | $35-45 | Yes |
| Siempre Reposado | Trade-up, where the margin lives | $40-55 | Yes |
| Siempre Anejo | Statement bottle, gift/occasion | $55-75 | Yes |
| Siempre Supremo | Ultra-premium limited | $90+ | No |
| Siempre Rebel Cask | Innovation/limited | $65-85 | No |
| Siempre Exclusivo | Super-premium | $100+ | No |
| Siempre Variety Pack | Sampler | Varies | No |

**The brand pyramid matters.** Healthy markets sell Plata > Repo > Anejo (in that order by volume). If Anejo or non-core SKUs are outselling Plata, the brand is being sold as a specialty, not a bar staple.

**Target SKU split for 2026:** Plata 56%, Repo 30%, Anejo 8%, everything else 6%.

### 2026 Targets

**20,310 total depletion cases** (+22.3% over 2025).

| Tier | Markets | YoY Growth |
|------|---------|-----------|
| **A (6)** | Ontario 2,716 / Georgia 1,853 / Alberta 1,746 / NC 1,520 / California 1,100 / Florida 899 | +17% |
| **B (12)** | AZ, BC, CT, HI, IN, MI, MN, NY, OK, SC, TX, VA | +41.6% |
| **C (35)** | All others | +4% |

---

## When to Trigger

- **Monthly Orchestration:** Run sequentially between business days 3 and 22.
- **On Demand:** When Alex or Nick requests fresh depletion data, a reconciliation check, or a market rundown ("how are we doing").

## Orchestration Sequence

The workflow must be executed in this exact order, as each step feeds the next:

| Business Day | Source / Action | Output |
|--------------|-----------------|--------|
| 3-5 | **VIP iDig** (US Depletions) | `./data/vipidig/{YYYY-MM}/` (18+ Excel reports) |
| 5-10 | **Winebow DiverPort** (CA/Regional) | `./data/diveport/{YYYY-MM}/` |
| 12-18 | **Prestige NWOW** (Shipments/Revenue) | `./data/prestige/{YYYY-MM}/prestige_parsed.json` |
| 15-20 | **Provincial Portals** (Canada/OK) | `./data/provincial/{YYYY-MM}/` |
| ANY | **LCBO Monitor** (Ontario live shelf inventory) | `python3 "/Users/alexl/CLAUDE BRAIN/market-reports/lcbo_monitor.py" --json-only` — runs independently, no auth, real-time data. See `lcbo-monitor` skill. |
| 18-20 | **Zoho Books** (Invoicing) | `./data/zoho/{YYYY-MM}/zoho_revenue.json` |
| 19-22 | **Market Sales Briefing** (Merge & Report) | `./output/Siempre_Market_Briefing_{YYYY-MM}.md` + `.xlsx` |

If a source is not available, the briefing degrades gracefully: produce what you can, note what is missing.

---

## SECTION 1: VIP iDig (US Depletions)

**Coverage:** 28 US states (excluding CA). Primary source for cases sold, placements, and inventory.

### Authentication

| Field | Value |
|-------|-------|
| URL | `https://reports.vtinfo.com` |
| Login | `vip@siempretequila.com` |
| Password | `12345vip` |
| Auth type | ADFS OAuth2 with form-based login |
| MFA | None |
| Brand Code | `226536` |
| Customer ID | `PWS` (Prestige Wine & Spirits) |

Navigate to `https://reports.vtinfo.com` and let the browser follow the ADFS redirect naturally. Do NOT hardcode OAuth URLs; state/nonce values are session-specific.

### Anti-Detection Settings

- Viewport: 1920x1080
- Delays: 2-5 seconds between actions (randomized)
- Frequency: Maximum once per day
- User-agent: Standard Chrome string

### VIP iDig Navigation Structure

Top navigation bar has 5 sections:

| Section | Purpose | Priority |
|---------|---------|----------|
| **Dashboard** | Interactive widgets: state sales comparison, days of inventory, SKU comparison | HIGHEST |
| **TeamBoards** | Shared boards: Sales Board with cases sold, SKU breakdown, full product line | HIGH |
| **Report Builder** | Run and export saved custom reports (CHRIS REPORT, NICK reports, etc.) | HIGH |
| **View Reports** | View previously run reports | LOW |
| **GeoView** | Geographic visualization | LOW |

### Iframe Handling

iDig uses nested iframes. The left panel (Favorites/TeamFavorites tree) is in the main frame. Report output is in a child iframe. Use `page.frame_locator()` or equivalent to reach report elements inside iframes.

### SECTION 1A: Dashboard (HIGHEST PRIORITY)

Click "Dashboard" in top nav. Dashboard contains multiple widgets, each with its own export button.

**Widget 1: Distributor State Sales Comparison**
- Has a dropdown selector (e.g., "Brand Placements", "Cases Sold")
- Shows 1-year comparison with YoY change (absolute and %)
- Each state shows current period bar vs prior period bar (green = growth, red = decline)
- **KNOWN BUG:** The dropdown changes the chart visual, but the Excel export ALWAYS outputs Brand Placements data regardless of dropdown selection. Both exports come out identical.
- **Therefore:** Only export the Brand Placements view from Dashboard. For Cases Sold data, use **TeamBoards** (see Section 1B).
- Export: Click the download icon (arrow) on the widget -> Export dialog appears
- Export dialog options: Excel, PDF, PDF (Landscape), Raw Data -> **Select Excel**
- Check "Include Last Complete Day of Sales" checkbox
- Save as: `Dashboard_State_Sales_BrandPlacements_{YYYY-MM}.xlsx`

**Widget 2: Days of Inventory**
- Shows by state: Current On Hand (Units), Projected Daily Rate of Sales, Projected Days on Hand, 90-day Units Sold
- Has dropdown for "Units" view
- Export same way via download icon -> Excel
- Save as: `Dashboard_Days_of_Inventory_{YYYY-MM}.xlsx`

**Widget 3: SKU Sales Comparison**
- Has dropdown: "Cases Sold"
- Shows 1-month SKU comparison with YoY change
- SKUs: Siempre Plata, Siempre Reposado, Siempre Anejo, Siempre Variety Pack, Siempre Supremo, Siempre Rebel Cask, Siempre Exclusivo
- Export via download icon -> Excel
- Save as: `Dashboard_SKU_Sales_{YYYY-MM}.xlsx`

**Dashboard Export Process (per widget):**
1. Locate the download icon (small arrow/download button) on the widget header
2. Click it -> Export Report dialog appears
3. Select "Excel" radio button
4. Check "Include Last Complete Day of Sales"
5. Click "Export" button
6. Wait for download to complete
7. Rename file appropriately

### SECTION 1B: TeamBoards (HIGH PRIORITY)

Click "TeamBoards" in top nav. Shows "Sales Board" tab and "Board Management" tab.

**Widget 1: Distributor State Sales Comparison (Cases Sold)**
- Title: "1 Year Distributor State Sales Comparison in Cases Sold"
- This is the CASES SOLD view, different from Dashboard's Brand Placements default
- Shows all active states with current cases and YoY change
- **This is likely the most accurate total depletion number.** Reconcile against CHRIS REPORT.
- Export via download icon -> Excel
- Save as: `TeamBoard_State_Sales_CasesSold_{YYYY-MM}.xlsx`

**Widget 2: SKU Sales Comparison (Cases Sold)**
- Full product line breakdown including: Plata, Reposado, Anejo, Variety Pack, Supremo, Rebel Cask, Exclusivo
- Export via download icon -> Excel
- Save as: `TeamBoard_SKU_Sales_{YYYY-MM}.xlsx`

TeamBoards also has a top-level "Export" button that may export the entire board.

### SECTION 1C: Report Builder (HIGH PRIORITY)

Click "Report Builder" in top nav.

**Navigation Sequence:**
1. Wait for left panel to load (Favorites + TeamFavorites trees)
2. For EACH report: expand tree section, click report name (the `<span>`, NOT checkbox), wait for params to load (60s), click "Run Report", wait for render (up to 120s), export as Excel, rename, pause 3-5s

**Date Range (CRITICAL):**
- CHRIS REPORT auto-defaults to "last day of month, 1 month(s) ago"
- **Verify the date range covers the FULL calendar month** (e.g., Jan 1-31, 2026)
- If the default clips data, manually adjust the date parameters before running

**Favorites > REPORTS (9 reports):**

| # | Report Name | What It Contains | Used For |
|---|-------------|------------------|----------|
| 1 | CHRIS REPORT | Depletions by state x sub-brand (bottles + cases). Auto-defaults to last month | % to target, SKU mix, market-level depletions |
| 2 | NICK ABC Overview | Account-level detail | Account penetration |
| 3 | NICK INVENTORY REPORT | Distributor inventory by SKU by state | Pipeline coverage, low-stock alerts |
| 4 | Nick Key Account Sales | Top account performance | Anchor account tracking |
| 5 | Nick Last Month's Accounts Sold | Accounts that ordered last month | Active account count |
| 6 | NICK Specs Overview | Spec/programming placements | Brand placement health |
| 7 | NICK TW Overview | This-week activity snapshot | Weekly pulse (Phase 2) |
| 8 | NICK YTD | Year-to-date depletions by market | Annual trajectory tracking |
| 9 | NICK YTD REORDER RATE | Accounts with 2+ orders in rolling window | Reorder rate metric |

**TeamFavorites > CHAIN REPORTS (5 reports):**

| # | Report Name | Used For |
|---|-------------|----------|
| 10 | Chain Comparison Report | Chain vs independent performance |
| 11 | Chain Rolling Periods (3mo) | 3-month chain velocity |
| 12 | Chain Rolling Periods (6mo) | 6-month chain velocity |
| 13 | YTD Chain Accounts | Chain door count |
| 14 | YTD Chain Depletions | Cases through chain accounts |

**TeamFavorites > END OF MONTH (3 reports):**

| # | Report Name | Used For |
|---|-------------|----------|
| 15 | Last Month's Accounts Sold | Total active accounts |
| 16 | Last Month's Comparison | Month-over-month comparison |
| 17 | Last Month's Depletions | Depletion detail with comparisons |

**TeamFavorites > END OF QUARTER (1+ reports):**

| # | Report Name | Used For |
|---|-------------|----------|
| 18 | Account Universe (ON &...) | Full account universe |

### Data Priority & Reliability

| Data Need | Primary Source | Backup Source | Notes |
|-----------|---------------|---------------|-------|
| Cases Sold by state (single month) | CHRIS REPORT | TeamBoards | CHRIS REPORT has explicit date control |
| Cases Sold by state (YTD) | TeamBoards | -- | Best YTD cases sold view |
| Brand Placements by state | Dashboard | -- | Only reliable source for placements |
| SKU breakdown | TeamBoards | Dashboard | Both should match |
| Days of Inventory | Dashboard | -- | Unique to Dashboard, not available elsewhere |
| YoY comparison | TeamBoards | Dashboard | TeamBoards shows cases, Dashboard shows placements |

**TeamBoards is the primary source for Cases Sold.** Dashboard export has a known bug where Cases Sold exports as Brand Placements.

### Cross-Reconciliation (iDig Internal)

After downloading all data, reconcile these sources:

1. **CHRIS REPORT (Jan only) + TeamBoards (YTD):** Subtract CHRIS REPORT from TeamBoards YTD to get implied current-month-to-date cases. This should be reasonable (e.g., ~200 cases for half a month).
2. **Dashboard SKU vs TeamBoards SKU:** 1-month SKU totals should match across both sources.
3. **Dashboard Brand Placements:** Use as a separate metric; placements are not the same as cases sold.

**If totals don't match:** Report all numbers and flag the discrepancy with the likely cause (date range, metric type, or export bug).

### Alternative: XHR Interception

If Export button is unreliable, intercept data requests via `page.on('response')`. iDig fetches JSON/XML before rendering HTML tables. Capture raw data directly, which is often more reliable than clicking Export.

### Error Handling (iDig)

| Error | Action |
|-------|--------|
| Login failure | Retry 2x with 10s delay. Alert: "VIP iDig login failed" |
| Report not found | Search by partial name. Alert with details |
| Empty results | Data may not be loaded yet. Retry next day |
| Session timeout | Re-authenticate, continue from last un-downloaded report |
| Download timeout (>120s) | Skip, note as failed, retry at end |
| Widget export fails | Try XHR interception as fallback |
| Dashboard not loading | Refresh page, wait 30s, retry |

### VIP Support Contact

Phone: (800) 655-2093. Email: Keith Loving, keith.loving@vtinfo.com. Reference: Brand Code 226536, Customer ID PWS.

### Output (iDig)

All files to: `./data/vipidig/{YYYY-MM}/` with descriptive names:
- Report Builder: `{REPORT_NAME}_{YYYY-MM}.xlsx`
- Dashboard: `Dashboard_{WIDGET_NAME}_{YYYY-MM}.xlsx`
- TeamBoards: `TeamBoard_{WIDGET_NAME}_{YYYY-MM}.xlsx`

After completion, output a JSON manifest with pull_date, period, reports_downloaded (by section), reports_failed, discrepancies found, and file list.

---

## SECTION 2: Winebow DiverPort (California & Regional)

**Coverage:** California (Primary) + NW, MW, NE, CT, MidAtl/FL, GA (Validation).

### Authentication

| Field | Value |
|-------|-------|
| URL | `https://bi.winebow.com/supplier-diveport` |
| Username | `nick@siempretequila.com` |
| Password | `@?ynjY?KesqY7aG#` |
| Platform | Dimensional Insight (DI) |
| Session | Cookie-based, persists across navigation |

**CRITICAL:** Always use the browser tool to access DiverPort. Never use shell-level `curl` or Python `requests`. The Winebow BI server drops SSL connections from cloud/datacenter IP ranges. The browser tool routes through a different network path and connects successfully.

| Symptom | Cause | Fix |
|---------|-------|-----|
| `curl` returns SSL EOF / connection reset | Datacenter IP block on Winebow's end | Use browser tool only |
| Browser returns ERR_CONNECTION_CLOSED | Sandbox browser not yet started | Retry browser navigation once |
| Login page not loading | Session expired | Navigate to URL again |

### Home Page Sections

Five clickable tiles on the home page:

| Tile | Link Target | Element Type |
|------|-------------|-------------|
| Dashboard | KPI comparison view | `div[role="link"]` |
| Inventory | Warehouse stock levels | `div[role="link"]` |
| Winebow Monthly Depletions | Regional depletion reports | `div[role="link"]` |
| Divebook | Product catalog | `div[role="link"]` |
| Password Reset Request | Self-service password change | `div[role="link"]` |

### Dashboard Controls

| Control | Element ID Pattern | Input Method |
|---------|-------------------|-------------|
| CURRENT Start | Text input, accepts `YYYY-MM-DD` | Direct text entry |
| CURRENT End | Text input, accepts `YYYY-MM-DD` | Direct text entry |
| PRIOR Start | Text input, accepts `YYYY-MM-DD` | Direct text entry |
| PRIOR End | Text input, accepts `YYYY-MM-DD` | Direct text entry |
| State Code | Dropdown | Select option |
| Assigned Market | Dropdown (11 values) | Select option |
| Market Type | Dropdown (2 values: Chain/Independent) | Select option |
| TWG Premise | Dropdown (2 values: On/Off) | Select option |
| TWG Channel | Dropdown (4 values) | Select option |
| Item Desc3 | Dropdown (5 SKUs) | Select option |

Dashboard updates automatically when date fields change; no "Go" button needed.

### Monthly Depletions Navigation

Report tree structure:

```
Winebow Monthly Depletions
  -> Current Month Depletions
  -> Current Month Account Sold
  -> California
  |    -> California Depletions
  |    -> California Accounts
  -> NorthWest
  |    -> NorthWest Depletions
  |    -> NorthWest Accounts
  -> MidWest
  |    -> MidWest Depletions
  |    -> MidWest Accounts
  -> NorthEast
  |    -> NorthEast Depletions
  |    -> NorthEast Accounts
  -> Connecticut
  |    -> Connecticut Depletions
  |    -> Connecticut Accounts
  -> MidAtlantic and Florida
  |    -> MidAtlantic and Florida Depletions
  |    -> MidAtlantic and Florida Accounts
  -> Georgia
       -> Georgia Depletions
       -> Georgia Accounts
```

### Depletion Report Controls

| Control | Element ID Pattern | Notes |
|---------|-------------------|-------|
| Month Selector | `dip_marker_{session}_quickview_1` | Options: `2025-09` through latest |
| Location Code | `dip_marker_{session}_quickview_2` | e.g., `CA1` |
| Vendor Parent | `dip_marker_{session}_quickview_3` | `SIEMPRE TEQUILA` |
| Go Button | `dip_marker_{session}_gobutton` | **Must click after dropdown change** |

The `{session}` is a UUID that changes each login. Use partial ID matching.

### Report Image Handling

Reports render as server-side PNG images, not HTML tables.

| Aspect | Detail |
|--------|--------|
| Image element | `img.dvp_canvas_cell_image` inside `div[id*="dvp_canvas"]` |
| Image URL pattern | `/instance-direct/{session}/page-image.png?hpage=0&vpage=0&cellid=m0_0&_nocache={token}` |
| Scrolling | Report container scrolls horizontally to reveal right-side columns |
| Caching | Aggressive. `_nocache` param does not always bust cache. Navigate away and back for reliable refresh |
| Export | Use **Print** button -> Print to PDF for reliable full-report capture |

### Scrolling to See All Columns

The depletion report is wider than the viewport:

| Scroll Position | Visible Columns |
|----------------|----------------|
| Left (default) | Product Category, Winery Name, Vendor Number, Item Number, Item Desc3, Vintage, BPC, Size, Vendor |
| Right (scroll) | Starting Inventory, Open PO Cases, Purchases/Adjustments, Cases NoCa, Cases SoCa, Ending Inventory |

Scroll the container element (not the page) using the horizontal scrollbar at the bottom of the report area.

### Inventory Section

The Inventory page uses an interactive HTML table (not an image), making it the easiest section to extract data from programmatically.

| Control | Element ID | Notes |
|---------|-----------|-------|
| Vendor Parent filter | `quickview_VendorParent` | Default: All Values |
| Location Code filter | `quickview_LocationCode` | Default: All Values |
| Brand filter | `quickview_Brand` | Default: All Values |
| Reset button | Input type button | Clears all filters |

Table data is in standard `<td>` elements with corresponding `div` elements containing the text values.

### Print/Export

| Method | Steps | Output |
|--------|-------|--------|
| Print to PDF | Click **Print** -> Select "Print to PDF" -> Download | PDF of current report view |
| Print to Excel | Click **Print** -> Select "Print to Excel" (if available) | Excel workbook |

The Print button is in the top-right toolbar: `div[id="dvp_simplifiedbar_exportpage"]`.

### DiverPort Pull Workflow

| Step | Action | Notes |
|------|--------|-------|
| 1 | Navigate to portal, log in | Cookie-based session |
| 2 | Go to **Dashboard** | Set CURRENT dates to target month, PRIOR to same month prior year |
| 3 | Record KPIs | Cases 9LE, Accts Sold, Avg Spend, SKUs Sold, PODs |
| 4 | Go to **Winebow Monthly Depletions -> California Depletions** | Select target month from dropdown, click Go |
| 5 | Scroll right to capture depletion columns | Cases NoCa, Cases SoCa, Starting/Ending Inventory |
| 6 | Go to **California Accounts** | Capture account-level detail, paginate through all pages |
| 7 | Go to **Inventory** | Record current warehouse stock by SKU |
| 8 | **Print to PDF** each report | Most reliable export method |
| 9 | Repeat steps 4-6 for other regions if needed | NW, MW, NE, CT, MidAtl/FL, GA |

### Known Issues (DiverPort)

| Issue | Workaround |
|-------|-----------|
| Report image caching | Navigate Home -> back to report after changing month |
| Dropdown selection not sticking | Use JavaScript: set `.value` property, dispatch `change` event, then click Go |
| Share/Print disabled with pending selections | Click Go first to apply selections before attempting export |
| Maintenance windows | System goes down periodically (e.g., Feb 27 - Mar 2, 2026). Check notice on home page |

### Output (DiverPort)

All files to: `./data/diveport/{YYYY-MM}/`

---

## SECTION 3: Provincial Portals (Canada & Oklahoma)

**Coverage:** ON, MB, SK, BC, AB, OK.

**Primary Contact:** Rick Harper is the business owner of Canadian operations data. Direct questions about portal access, data interpretation, or discrepancies to him.

**Data Lag Notice:** Canadian provincial sources have a **60-90 day data lag**. Unlike US data (available within a few business days), Canadian data is subject to longer processing and reporting cycles. Factor this into any analysis.

### Authentication & Portals

| Province / State | Portal Name | URL | Username | Password | Notes |
|---|---|---|---|---|---|
| **Ontario** | Analyticsmart (Tableau) | `https://tableau.analyticsmart.com/#/site/RivalHouse/projects/519` | `rick@siempretequila.com` | `Rick@2026!` | Tableau-based dashboard reporting |
| **Manitoba** | eLIIS | `https://eliis.mbll.ca/liis/login/loginProxy.jsp` | `A554897` | `Welcome1` | Electronic Liquor Information System |
| **Saskatchewan** | Deposco (WMS) | `https://stb.deposco.com/deposco/login/home` | `Rharper` | `Prince01!` | Warehouse inventory data, not direct sales |
| **Saskatchewan** | ELLIS (SLGA) | `https://drive.slga.com` | `SLGAWEB\rharper` | `$picyGlass351#` | **ACCOUNT LOCKED OUT.** Rick is resolving |
| **British Columbia** | Containerworld | `https://www.containerworld.com/CWFS/WEB_CAS/CAS_REPORT_INV_RSR_FILTER?p_online_tool_id=81` | `1024761` | `68lmXV` | 3PL/Logistics provider portal |
| **British Columbia** | Liquify | `https://liquify.ca/login` | `accounting@siempretequila.com` | `J$dCbH!dLMdcyT7&` | B2B marketplace and ordering platform |
| **Alberta** | Liquify | `https://liquify.ca/login` | `rick_harper` | `r0ckH888VN2117Prince01!` | Same platform as BC, separate account |
| **Oklahoma (US)** | DSDLink | `https://dsdlink.com/Home?DashboardID=100008` | `rick@siempretequila.com` | `Y!JdQ#qrYkbTm89i` | US state managed by Rick Harper |

### Portal Navigation Summary

| Portal | Key Data Source | Export Format | Primary Navigation Path |
|---|---|---|---|
| **Ontario (Analyticsmart)** | Tableau Dashboards | Excel/Crosstab | Login -> Navigate to Project 519 -> Select Dashboard -> Export View |
| **Manitoba (eLIIS)** | Monthly Provincial Sales | ZIP (containing CSV/TXT) | Login -> Click 'Downloads' -> Select 'Monthly Provincial Sales' -> Download |
| **Saskatchewan (Deposco)** | Inventory Reports | Excel/CSV | Login -> Reports Module -> Search for Inventory/Shipment Reports -> Export |
| **Saskatchewan (ELLIS)** | LION (webFOCUS) Reports | Excel/CSV | **[ON HOLD]** Login -> Navigate to LION -> Run pre-defined reports |
| **BC (Containerworld)** | Inventory / RSR Reports | Excel/CSV | Login -> Navigate to Report ID 81 -> Set Filters -> Run & Export |
| **BC (Liquify)** | Sales Analytics Dashboard | Excel/CSV | Login -> Analytics/Reports Section -> Select Date Range -> Export |
| **Alberta (Liquify)** | Sales Analytics Dashboard | Excel/CSV | Login -> Analytics/Reports Section -> Select Date Range -> Export |
| **Oklahoma (DSDLink)** | Dashboard Widgets | Excel/CSV | Login -> Dashboard ID 100008 -> Export individual widgets |

### Data Schemas by Portal

**Ontario (Analyticsmart):**

| Column | Type | Description |
|---|---|---|
| `date` | date | Sale date |
| `province` | string | Province (e.g., "Ontario") |
| `sku` | string | Product SKU |
| `product_name` | string | Product Name |
| `cases_sold` | number | Number of cases sold |
| `units_sold` | number | Number of units sold |
| `sales_dollars` | number | Total sales value |

**Manitoba (eLIIS):**

| Column | Type | Description |
|---|---|---|
| `period` | string | Reporting period (e.g., "2026-01") |
| `sku` | string | Product SKU |
| `description` | string | Product Description |
| `cases` | number | Cases sold in the period |
| `inventory_cases` | number | Cases in inventory at month-end |

### Monthly Pull Calendar

| Portal | Recommended Pull Day | Notes |
|---|---|---|
| Ontario (Analyticsmart) | 15th - 20th | Data typically available mid-month for prior month |
| Manitoba (eLIIS) | 15th - 20th | Similar lag to Ontario |
| Saskatchewan (Deposco) | 15th - 20th | Aligns with other provincial pulls |
| Saskatchewan (ELLIS) | 15th - 20th | **[ON HOLD]** |
| BC (Containerworld) | 15th - 20th | -- |
| BC (Liquify) | 15th - 20th | -- |
| Alberta (Liquify) | 15th - 20th | -- |
| Oklahoma (DSDLink) | 5th - 7th | US data has less lag; align with vipidig-reports schedule |

### Cross-Reconciliation (Provincial)

1. **BC (Containerworld vs. Liquify):** Containerworld provides warehouse/inventory data, while Liquify provides sales data. The change in inventory levels in Containerworld should roughly correlate with sales data from Liquify, accounting for direct shipments.
2. **Saskatchewan (Deposco vs. ELLIS):** Deposco shows warehouse inventory. Once the ELLIS account is active, its sales data can be reconciled against inventory changes in Deposco.
3. **General Principle:** Always prioritize the official liquor board data (e.g., eLIIS, ELLIS) as the primary source of truth for depletions. Use 3PL/WMS data (Deposco, Containerworld) for inventory validation.

### Output (Provincial)

- **Directory:** `./data/provincial/{YYYY-MM}/`
- **File Naming:** `{PROVINCE}_{PORTAL}_{REPORT_NAME}_{YYYY-MM}.{ext}` (e.g., `ON_Analyticsmart_RivalHouse_Sales_2026-01.xlsx`)
- **Manifest:** `manifest.json` in the output directory

### Error Handling (Provincial)

| Error | Action |
|---|---|
| Login Failure | Retry 3x with 15s delay. Log error, skip portal, continue. Alert Rick Harper |
| Report Not Found | Log failure, take screenshot, save for manual review. Skip and continue |
| Export Fails / Timeout | Retry once. Navigate away and back before final attempt |
| Session Timeout | Re-authenticate and resume from last successful step |
| Account Lockout (SK ELLIS) | Log as reason for failure. Do not attempt further logins for that portal |

---

## SECTION 4: Prestige NWOW (Shipments & Revenue)

**Coverage:** US Importer shipments, revenue, COGS, brand dev spend, and depletion allowances.

### Email Search Patterns

**Monthly NWOW Reconciliation (PRIMARY):**

| Field | Pattern |
|-------|---------|
| From | `partnerships@prestigebevgroup.com` |
| Subject | `RE: Siempre Reconciliation - {Month} {Year}` |
| Attachment | `Siempre NWOW Reconciliation - {MM}_{YYYY}.xlsx` |

**Gmail search query:** `from:partnerships@prestigebevgroup.com subject:"Siempre Reconciliation" has:attachment newer_than:45d`

**Weekly Reports (SUPPLEMENTARY):**

**Gmail search query:** `from:prestigebevgroup.com subject:Siempre has:attachment newer_than:14d`

### Parsing the NWOW Workbook

The workbook has 14 sheets. Only 4 matter for the report card:

| Sheet | Extract | Maps To |
|-------|---------|---------|
| **Ships Details** | State (BU column), cases shipped, ship date | cases_shipped by market |
| **By Item by BU** | State, SKU, revenue, quantity | revenue by SKU by market |
| **Brand Development** | State, spend amount, category | market_spend |
| **Depl Allowance** | State, DA amount | depletion_allowance |

**BU Code Mapping:** The BU column contains codes like "PBG - GA", "PBG - NC". Strip the "PBG - " prefix to get the 2-letter state code.

### Sheet Schemas

**Sheet 1: "Ships Details"**

| Extract | Column Pattern | Maps To |
|---------|----------------|---------|
| State | "BU" column (e.g., "PBG - GA") | market_code (strip "PBG - " prefix) |
| Cases shipped | Cases or quantity column | fact_monthly_metrics.cases_shipped |
| Ship date | Date column | Filter to target month |
| Item number | Item/SKU column | Join to dim_skus for product detail |

**Sheet 2: "By Item by BU"**

| Extract | Column Pattern | Maps To |
|---------|----------------|---------|
| BU (state) | Same as above | market_code |
| Item | SKU identifier | dim_skus.item_number |
| Revenue | Dollar amount | fact_monthly_metrics.revenue |
| Quantity | Cases/bottles | Cross-validate against Ships Details |

**Sheet 3: "Brand Development"**

| Extract | Column Pattern | Maps To |
|---------|----------------|---------|
| BU (state) | Same as above | market_code |
| Spend amount | Dollar column | fact_monthly_metrics.market_spend |
| Category | Type of spend | For qualitative notes |

**Sheet 4: "Depl Allowance"**

| Extract | Column Pattern | Maps To |
|---------|----------------|---------|
| BU (state) | Same as above | market_code |
| DA amount | Dollar column | fact_monthly_metrics.depletion_allowance |

### Output JSON Schema (Prestige)

```json
{
  "source": "Prestige NWOW Reconciliation",
  "period": "2026-01",
  "pull_date": "2026-02-21",
  "markets": {
    "GA": {
      "cases_shipped": 145,
      "revenue": 28500.00,
      "cogs": 18200.00,
      "brand_dev_spend": 1200.00,
      "depletion_allowance": 850.00,
      "gross_profit": 10300.00,
      "revenue_per_case": 196.55,
      "skus": {
        "Siempre Plata": {"cases": 65, "revenue": 12350.00},
        "Siempre Reposado": {"cases": 50, "revenue": 10500.00},
        "Siempre Anejo": {"cases": 30, "revenue": 5650.00}
      }
    }
  }
}
```

### Sanity Checks (Prestige)

| Check | Logic | If Failed |
|-------|-------|-----------|
| Revenue per case | < $50 or > $400 = flag | Likely BU mapping error |
| Ship vs depletion gap | shipped > 3x depleted per state | Inventory build flag |
| Missing states | VIP depletions but no Prestige shipments | BU code mismatch or lag |
| Negative values | Any negative revenue or cases | Data entry error, flag for Monica |

### Output (Prestige)

- Raw file: `./data/prestige/{YYYY-MM}/Siempre_NWOW_{YYYY-MM}.xlsx`
- Parsed data: `./data/prestige/{YYYY-MM}/prestige_parsed.json`
- Weekly reports: `./data/prestige/weekly/{filename}` (metadata only, no auto-parse)

### Error Handling (Prestige)

| Error | Action |
|-------|--------|
| No matching emails | Check timing. Alert: "Prestige NWOW for {month} not yet received" |
| Wrong attachment format | Skip. Alert: "Unexpected format from Prestige" |
| Sheet names changed | Alert with actual sheet names found |
| Unrecognized BU code | Log codes. Ask Alex/Monica to map |
| Duplicate emails | Use most recent (latest email date) |

---

## SECTION 5: Zoho Books (Invoicing)

**Coverage:** State-level revenue and unpaid invoices.

### Authentication

| Field | Value |
|-------|-------|
| Bridge | Maton API |
| API Key | `FltHv_SepU2bFZ9RZbgurdBBVqc18z32b9nZNluAAj2UaO9DYEmmOrbYH255y0nOiLxhiEuXtKXsfTc6lI1mMDGa1UVfsENG2fV0svAHCQ` |
| Status | ACTIVE |

Maton is already authenticated with Zoho. No direct Zoho OAuth credentials needed. Include the Maton API key in all requests:
```
Authorization: Bearer FltHv_SepU2bFZ9RZbgurdBBVqc18z32b9nZNluAAj2UaO9DYEmmOrbYH255y0nOiLxhiEuXtKXsfTc6lI1mMDGa1UVfsENG2fV0svAHCQ
```

Maton proxies Zoho Books API v3 endpoints. Refer to Zoho Books API docs (https://www.zoho.com/books/api/v3/) for full parameter details. Rate limit: 100 requests per minute per organization. Use exponential backoff on 429 responses.

### Zoho Data Model

**Invoice Structure:**
- `invoice_number`: Unique identifier
- `customer_name`: Distributor or account name
- `date`: Invoice date
- `due_date`: Payment due date
- `status`: paid, sent, overdue, draft
- `total`: Invoice total amount
- `custom_fields`: Array including "Bulk Reporting Tag" for state assignment
- `line_items`: Array of products sold

**Bulk Reporting Tag:**
Monica tags every invoice with a state code via the "Bulk Reporting Tag" custom field. Example: `{"label": "Bulk Reporting Tag", "value": "GA"}` maps the invoice to Georgia. If an invoice has no Bulk Reporting Tag, it cannot be assigned to a market; flag for Monica.

**Line Item Structure:**
- `item_name`: SKU name (e.g., "Siempre Plata")
- `quantity`: Number of cases
- `rate`: Unit price per case
- `amount`: Line total (quantity x rate)

### Skill Actions

**Action 1: GET REVENUE BY STATE**
Query invoices for the target month. For each invoice, read the "Bulk Reporting Tag" custom field to get the state code. Sum invoice totals grouped by state.

**Action 2: GET REVENUE BY SKU BY STATE**
For each invoice, pull line items: item_name (SKU), quantity (cases), rate (unit price), amount (line revenue). Group by state x SKU.

**Action 3: LIST UNPAID INVOICES**
Query unpaid/overdue invoices. Flag any overdue > 30 days. Output total overdue amount and invoice details.

**Action 4: AUTO-CREATE INVOICES FROM NWOW (Phase 2)**
After Prestige NWOW is parsed by prestige-gmail skill, create draft invoices from parsed NWOW data. **CRITICAL: Always create as "draft" status. Monica must manually approve every invoice.**

### Data Mapping (Zoho)

| Report Card Field | Zoho Source | Calculation |
|-------------------|-------------|-------------|
| revenue_total | Invoice totals by state tag | SUM(invoice.total) WHERE tag = state |
| revenue_per_case | revenue_total / cases_shipped | cases_shipped from prestige-gmail |
| margin_per_case | revenue_per_case - landed_cost | landed_cost from dim_skus |
| overdue_invoices | Unpaid invoices by state | Direct from Action 3 |

### Output JSON Schema (Zoho)

```json
{
  "source": "Zoho Books API",
  "period": "2026-01",
  "pull_date": "2026-02-21",
  "markets": {
    "GA": {
      "revenue_total": 28500.00,
      "invoice_count": 3,
      "skus": {
        "Siempre Plata": {"cases": 65, "revenue": 12350.00, "avg_price_per_case": 190.00}
      }
    }
  },
  "overdue": {
    "total_amount": 4200.00,
    "invoices": [
      {"invoice_number": "INV-2026-0045", "customer": "XYZ Dist", "state": "TX", "amount": 4200.00, "days_overdue": 35}
    ]
  }
}
```

### Output (Zoho)

- Revenue data: `./data/zoho/{YYYY-MM}/zoho_revenue.json`
- Unpaid report: `./data/zoho/{YYYY-MM}/zoho_unpaid.json`

### Error Handling (Zoho)

| Error | Action |
|-------|--------|
| Maton auth failure | Check API key. Alert Alex |
| Missing state tag on invoice | Flag for Monica: "Invoice #{id} has no Bulk Reporting Tag" |
| Zero revenue for active market | Cross-check VIP depletions. Flag data gap |
| Duplicate invoice | Check invoice_number before creating. Skip if duplicate |

---

## SECTION 6: Unified Reporting & Market Health Briefing

### Data Normalization

All sources must normalize to a common schema before merge. See `references/unified-schema.md`.

**9LE Conversion:** Siempre ships 750ml x 6 bottles/case. 1 physical case = 0.5 cases 9LE.

**SKU Standardization:**

| Standard Name | VIP iDig Code | DiverPort Code | DiverPort Item# |
|--------------|---------------|----------------|-----------------|
| Siempre Anejo 750ml | 226536-ANJ | SIEMPRE ANEJO | PEANJN/C |
| Siempre Plata 750ml | 226536-PTA | SIEMPRE PLATA | PEPTAN/C |
| Siempre Rebel Cask Blend 750ml | 226536-RCB | SIEMPRE REBEL CASK BLEND | PERCBN/C |
| Siempre Reposado 750ml | 226536-REP | SIEMPRE REPOSADO | PEREPN/C |
| Siempre Supremo Tahona 750ml | 226536-SPT | SIEMPRE SUPREMO TAHONA | PESPTN/C |

### Overlap & Deduplication

| Region | DiverPort | VIP iDig | Rule |
|--------|-----------|----------|------|
| California | YES | NO | DiverPort only |
| NorthWest, MidWest, etc. | YES | Likely YES | **VIP iDig is primary**; DiverPort for validation |
| Oklahoma | NO | Likely YES | Provincial skill is primary |
| Canadian provinces | NO | NO | Provincial only |

When both sources report the same state, use VIP iDig as primary (more granular). Flag discrepancies > 10% for manual review.

### Market Coverage Map

**United States (29 states):**

| State | Primary Source | Secondary Source | Notes |
|-------|--------------|-----------------|-------|
| AZ | VIP iDig | -- | Johnson Brothers Maverick |
| CA | **DiverPort** | -- | Winebow distribution; NOT in VIP iDig |
| CO | VIP iDig | -- | -- |
| CT | VIP iDig | DiverPort | DiverPort has separate CT region |
| FL | VIP iDig | DiverPort | DiverPort "MidAtlantic and Florida" |
| GA | VIP iDig | DiverPort | DiverPort has separate GA region |
| IL | VIP iDig | DiverPort | DiverPort "MidWest" |
| IN | VIP iDig | DiverPort | DiverPort "MidWest" |
| MA | VIP iDig | DiverPort | DiverPort "NorthEast" |
| MD | VIP iDig | DiverPort | DiverPort "MidAtlantic" |
| MI | VIP iDig | DiverPort | DiverPort "MidWest" |
| MN | VIP iDig | DiverPort | DiverPort "MidWest" |
| NJ | VIP iDig | DiverPort | DiverPort "NorthEast" |
| NY | VIP iDig | DiverPort | DiverPort "NorthEast" |
| OH | VIP iDig | DiverPort | DiverPort "MidWest" |
| OK | Provincial (DSDLink) | -- | US state handled by provincial skill |
| OR | VIP iDig | DiverPort | DiverPort "NorthWest" |
| PA | VIP iDig | DiverPort | DiverPort "NorthEast" |
| TX | VIP iDig | -- | Major market |
| VA | VIP iDig | DiverPort | DiverPort "MidAtlantic" |
| WA | VIP iDig | DiverPort | DiverPort "NorthWest" |
| DC | VIP iDig | DiverPort | DiverPort "MidAtlantic" |
| *Other US states* | VIP iDig | -- | Remaining states in VIP iDig |

**Canada (5 provinces):**

| Province | Primary Source | Portal | Notes |
|----------|--------------|--------|-------|
| ON | Provincial | Analyticsmart (Tableau) | Largest Canadian market |
| MB | Provincial | eLIIS | -- |
| SK | Provincial | Deposco + ELLIS | ELLIS currently locked out |
| BC | Provincial | Containerworld + Liquify | Two portals, cross-reconcile |
| AB | Provincial | Liquify | Separate account from BC |

### Market Health Scoring

**A Markets (6 markets, 5-factor scoring):** Ontario, Georgia, Alberta, NC, California, Florida.

| Factor | GREEN | YELLOW | RED |
|--------|-------|--------|-----|
| % to Target | >= 95% | >= 85% | < 85% |
| Reorder Rate (90d) | >= 50% | >= 40% | < 40% |
| Pipeline Coverage | >= 3.0x | >= 2.0x | < 2.0x |
| Core SKU Mix | >= 80% | >= 70% | < 70% |
| Spend per Case | <= $15 | <= $20 | > $20 |

Score: Count GREEN factors. >=5 = GREEN, >=3 = YELLOW, else RED.

**B Markets (12 markets, 3-factor scoring):** AZ, BC, CT, HI, IN, MI, MN, NY, OK, SC, TX, VA.

| Factor | GREEN | YELLOW | RED |
|--------|-------|--------|-----|
| % to Target | >= 95% | >= 85% | < 85% |
| Reorder Rate (90d) | >= 50% | >= 40% | < 40% |
| Pipeline Coverage | >= 3.0x | >= 2.0x | < 2.0x |

Score: >=3 = GREEN, >=2 = YELLOW, else RED.

**C Markets (35 markets, 1-factor + alert):** All remaining markets.

| Factor | GREEN | YELLOW | RED |
|--------|-------|--------|-----|
| % to Target | >= 95% | >= 70% | < 70% |

**ALERT** if depletions = 0 but prior month had activity (market may have gone dark).

**Definitions:**
- **Pipeline Coverage** = Distributor inventory / monthly depletion rate
- **Core SKU Mix** = (Plata + Repo + Anejo depletions) / total depletions. Should be >= 80%
- **Spend per Case** = (Brand Dev + DA) / cases depleted. Lower is more efficient
- **Reorder Rate** = % of accounts with 2+ orders in rolling 90-day window

### Diagnosis Patterns

When writing commentary for RED/YELLOW markets, follow these patterns:

**Principles:**
1. **Name the distributor.** "United in Georgia isn't depleting" not "Georgia has low depletions."
2. **Lead with the number.** "Georgia: 89 cases vs 154 target (58%)."
3. **Diagnose, don't describe.** "Low reorder rate (32%) suggests trial without repeat, likely no programming support" not "The reorder rate is 32%."
4. **Use three-tier language.** Shipments, depletions, pipeline, specs, programming.
5. **End with a recommendation.** "Action: Call United rep, request spec report, check if Plata is on the well list."

**Common Patterns:**

| Pattern | Diagnosis | Likely Cause | Recommendation |
|---------|-----------|-------------|----------------|
| High Shipments, Low Depletions | Inventory building at distributor | No programming, no rep attention | Request depletion detail from distributor |
| Declining Reorder Rate | Accounts tried but aren't reordering | No follow-up from reps, pricing issue | Pull account-level detail from iDig |
| Zero Depletions After Active Month | Market may have gone dark | Rep change, restructuring, stockout | Immediate call to distributor contact |
| Non-Core SKUs Outselling Core | Brand being sold as specialty | Distributor pushing high-margin SKUs | Realign with distributor on core SKU focus |
| High Spend per Case | Marketing ROI is poor | Heavy DA without proportional lift | Review DA structure |
| Control State Lag | Normal bureaucratic lag | Government purchasing cycles | Look at rolling 3-month trend instead |

**Tone:** Write like a smart VP of Sales emailing the CEO at 7am. Direct, specific, actionable. No hedging. No "data suggests." Say what it IS.

### Briefing Structure

1. **The Number** -- Total cases vs target, one line. Revenue. YoY comparison. One sentence headline story.
2. **Needs Attention (RED)** -- Each RED market gets a diagnosis paragraph with distributor intelligence. Include metric table per market.
3. **Watch List (YELLOW)** -- Concerning trends, tabular.
4. **On Track (GREEN)** -- Highlights, tabular.
5. **Revenue & Profitability** -- Cases, revenue, rev/case, GP, spend/case by market and tier.
6. **SKU Performance** -- Depletion by SKU, % of total, YoY trend.
7. **Distributor Health Flags** -- Ship-depl gaps, zero depletion alerts, reorder drops, overdue invoices.
8. **Data Gaps** -- What's missing and impact.

### Graceful Degradation

| Available Data | What You Can Produce |
|----------------|---------------------|
| VIP iDig only | Depletions, % to target, SKU mix, reorder rates |
| VIP + Prestige | Full US picture with shipments, revenue, spend |
| VIP + Prestige + Zoho | Complete picture with invoice detail and overdue alerts |
| Nothing | "Data Pull Pending" stub with status and ETA |

Always note what data IS and ISN'T included at the top.

### Companion Spreadsheet

Excel workbook with tabs: SUMMARY (color-coded), SKU Breakdown, Revenue Detail, Data Gaps, Raw Data.

### Output (Briefing)

- Briefing: `./output/Siempre_Market_Briefing_{YYYY-MM}.md`
- Spreadsheet: `./output/Siempre_Market_Data_{YYYY-MM}.xlsx`

Execute `scripts/merge_all_markets.py` to generate the unified CSV and base Markdown report.

---

## State Code Mapping

AL=ALABAMA, AZ=ARIZONA, AR=ARKANSAS, CA=CALIFORNIA, CO=COLORADO, CT=CONNECTICUT, DE=DELAWARE, DC=DISTRICT OF COLUMBIA, FL=FLORIDA, GA=GEORGIA, HI=HAWAII, ID=IDAHO, IL=ILLINOIS, IN=INDIANA, IA=IOWA, KS=KANSAS, KY=KENTUCKY, LA=LOUISIANA, ME=MAINE, MD=MARYLAND, MA=MASSACHUSETTS, MI=MICHIGAN, MN=MINNESOTA, MS=MISSISSIPPI, MO=MISSOURI, MT=MONTANA, NE=NEBRASKA, NV=NEVADA, NH=NEW HAMPSHIRE, NJ=NEW JERSEY, NY=NEW YORK, NC=NORTH CAROLINA, ND=NORTH DAKOTA, OH=OHIO, OK=OKLAHOMA, OR=OREGON, RI=RHODE ISLAND, SC=SOUTH CAROLINA, SD=SOUTH DAKOTA, TN=TENNESSEE, TX=TEXAS, VA=VIRGINIA, WA=WASHINGTON, WI=WISCONSIN, WY=WYOMING, AB=ALBERTA, BC=BRITISH COLUMBIA, ON=ONTARIO, QC=QUEBEC, SK=SASKATCHEWAN, MB=MANITOBA, NS=NOVA SCOTIA.

## References

- `references/unified-schema.md` -- Common data schema for all sources
- `references/scoring-rules.md` -- Health scoring methodology for A/B/C markets
- `scripts/merge_all_markets.py` -- Python merge script for unified CSV and report
