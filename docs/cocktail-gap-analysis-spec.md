# Cocktail Gap Analysis — Spec
> Identify on-premise accounts with tequila cocktail programs where Siempre has no current listing.
> Version: 1.0 | Status: SPEC | Author: Claude (Solace) | Date: 2026-04-12

---

## What a "Cocktail Gap" Is

A cocktail gap is an on-premise account that:
1. Has an active cocktail program (confirmed tequila cocktails on menu or at back bar)
2. Does NOT currently carry Siempre or Chisme
3. Is in a market where we are active and have distributor coverage

Gaps are priority Hunting targets because category acceptance is already proven — these accounts buy tequila. We're not making a development sell; we're making a displacement sell.

**Gap priority tiers:**

| Gap Tier | Definition | Action |
|---|---|---|
| **Critical Gap** | A-tier account + competitor premium tequila (Casamigos, Patrón, 1800 Cristalino, Don Julio) listed | Immediate hunting target — these accounts know our price point and already believe in premium agave |
| **High Gap** | A-tier account + any tequila cocktails, no Siempre | First-pass hunting target |
| **Medium Gap** | B-tier account + tequila program, no Siempre | Second-pass hunting target |
| **Monitored Gap** | C-tier account + any tequila, no Siempre | Track but don't prioritize rep time |
| **No Gap** | Account has no tequila cocktail program | Requires a development sell — not a gap account |

---

## Data Sources

### Mode 1 — Rep-Submitted Intel (Available Now)

Rep intel is the primary gap identification method until menu scraping is operational. Reps visit accounts weekly and have direct knowledge of what's on the back bar and cocktail menu.

**Submission format:** Nick and Rick submit gap sightings via a structured note to the Hunting Coordinator. Format:

```
GAP SIGHTING
Account: [Name]
Address: [City, State]
Tier: [A / B / C]
Competitor on rail: [Brand] — [SKU if known]
Tequila cocktails on menu: [Y/N] — [cocktail names if seen]
Decision-maker contact: [Name, role if known]
Rep who owns this account: [Distributor rep name]
```

These can be submitted via:
- Slack → routed to Intel Desk → classified → written to gap report
- Direct to the weekly sales brief (if Nick/Rick adopt that flow)

The Hunting Coordinator is responsible for ingesting rep-submitted gap sightings and adding them to the gap table.

---

### Mode 2 — Automated Menu Scraping (Future State)

When `menu_url` is populated in the master contacts DB and Firecrawl is wired into the agent pipeline, the gap analysis can run automatically:

```
For each on-premise account in master_contacts where menu_url != null:
  → Firecrawl scrape menu_url
  → LLM extract: {has_tequila_cocktail: bool, brands_mentioned: string[], cocktail_names: string[]}
  → Cross-reference brands_mentioned vs siempre_sku_names
  → If no siempre match → classify gap tier → write to gap table
```

**Status:** Not yet operational. `menu_url` field is not in current master contacts DB. This is a Phase 3 capability.

Prerequisites for Mode 2:
1. `menu_url` backfill in master contacts DB (rep-assisted or scraped from Google Maps/Yelp)
2. Firecrawl integration confirmed working for menu pages (rate limits, DOM variability)
3. LLM brand extraction prompt validated on a sample of 20 menus

---

### Mode 3 — VIP iDig Account Cross-Reference (Partial Automation Available)

VIP iDig contains account-level depletion data for US markets. We can identify on-premise accounts that buy tequila but have NO Siempre depletion record.

```
Query siempre.db:
  SELECT accounts where category = 'tequila' AND account_type = 'on-premise'
  LEFT JOIN market_sales on account_id
  WHERE market_sales.sku IS NULL OR market_sales.cases_sold = 0
  → These accounts buy tequila from other brands but not from us
```

**Limitations:** VIP iDig coverage is US markets only. Account-type field may be incomplete. This gives a volume-qualified gap list, not a cocktail-program-confirmed list. Use as a filter, not as ground truth.

---

## Gap Analysis Output Schema

```typescript
interface CocktailGap {
  gap_id: string;              // "{market_code}-{account_id}-{date_detected}"
  market_code: string;
  account_id: string;
  account_name: string;
  account_address: string;
  account_tier: "A" | "B" | "C";
  gap_tier: "critical" | "high" | "medium" | "monitored";
  detection_mode: "rep_intel" | "menu_scrape" | "vip_idig_cross_ref";
  competitor_brands: string[];  // e.g. ["Casamigos Blanco", "Don Julio 1942"]
  cocktail_menu_confirmed: boolean;
  cocktail_names?: string[];   // e.g. ["Tommy's Margarita", "Mezcal Negroni"]
  distributor_rep: string;     // who owns this account
  recommended_sku: string;     // from on-premise-framework.md SKU table
  date_detected: string;       // ISO date
  hunting_status: "not_started" | "rep_briefed" | "outreached" | "confirmed" | "lost";
  notes: string;
}
```

**Output file:** `data/sales-force/gap-analysis/cocktail-gaps.json` — append-only, updated on each analysis run.

**Gap report (human-readable):** `data/sales-force/gap-analysis/gap-report-{YYYY-MM-DD}.md` — generated weekly by Hunting Coordinator or on-demand by Alex.

---

## Gap Report Format

```markdown
# Cocktail Gap Report — {Date}
**Markets covered:** {list}
**Detection mode:** {rep_intel | vip_idig | menu_scrape | mixed}
**Total gaps identified:** {n}

## Critical Gaps (A-tier, competitor premium tequila)
| Account | Market | Competitor on Rail | Recommended SKU | Rep | Hunting Status |
|---------|--------|-------------------|-----------------|-----|----------------|
| ...     |        |                   |                 |     |                |

## High Gaps (A-tier, tequila program, no Siempre)
| Account | Market | Cocktail Menu? | Recommended SKU | Rep |
|---------|--------|----------------|-----------------|-----|

## Medium Gaps (B-tier)
...

## Priority Actions
1. [Account Name] — [Gap Tier] — [Market] — [Next action]
...
```

---

## Integration Points

### Hunting Layer (Primary Consumer)
- Gap report feeds Stage 1 (Lead Source) of Hunt Window Agents
- Critical and High gaps skip the standard lead-sourcing step — they're pre-qualified targets
- Hunting Coordinator should check the gap table when instantiating Hunt Window Agents for a market
- `hunting_status` field in CocktailGap is updated by the Hunting Layer as the gap moves through the pipeline

### On-Premise Framework (Job 11)
- Account tier definitions come from `on-premise-framework.md`
- SKU recommendations come from the venue-type table in that doc
- Do not re-derive these — import/reference from Job 11

### Ownership Group Research (Job 24)
- Any gap account owned by an ownership group with ≥3 A-tier gaps across their portfolio becomes a Job 24 target
- Pitch the group instead of individual accounts — one decision closes multiple gaps

### Master Contacts DB
- Write: add `cocktail_program_confirmed`, `competitor_listings`, `gap_tier` fields
- Read: account type, tier, distributor rep assignment

---

## Implementation Plan

### Phase A — Rep Intel Mode (Build Now)
1. Define the GAP SIGHTING submission format (done — above)
2. Add gap sighting intake to the Intel Desk flow (classify as `GAP_SIGHTING`, route to Hunting Coordinator)
3. Hunting Coordinator writes incoming gap sightings to `cocktail-gaps.json`
4. Weekly gap report generated on Monday alongside hunt cycle kick-off

**Effort:** ~1 day of agent work. No new scrapers. No new APIs.

### Phase B — VIP iDig Cross-Reference (Medium Term)
1. Run Mode 3 query against siempre.db: on-premise accounts with tequila + no Siempre depletion
2. Output as a second pass filter on the rep-intel gap list
3. Flag accounts where VIP iDig confirms tequila volume ≥4 cases/month — these are worth pursuing even without rep intel confirmation

**Effort:** ~half day SQL work. Query already has all the pieces (market_sales, account_type, sku).

### Phase C — Menu Scraping (Future)
See Mode 2 prerequisites above. Not in scope until `menu_url` is in the contacts DB.

---

## Open Questions

1. **Who submits gap sightings in the interim?** Nick (US markets) and Rick (Canada + OK/VA/IN/KS/MO) are the field intel sources. Do we add this as an explicit ask in the next Rick/Nick briefing?
2. **VIP iDig account_type field** — is "on-premise" reliably tagged in our current data? Query needed to check coverage before relying on Mode 3.
3. **Chisme gaps vs. Siempre gaps** — should we run separate gap analyses for each brand? Chisme's target venue (high-volume, casual on-prem, cocktail-forward) is a different account list than Siempre's.
