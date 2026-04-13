# On-Premise Framework
> Account taxonomy, qualification logic, and pitch strategy for on-premise sales.
> Version: 1.0 | Status: SPEC | Author: Claude (Solace) | Date: 2026-04-12

---

## What On-Premise Means for Siempre

On-premise accounts are bars, restaurants, hotels, clubs, and event venues where Siempre is sold by the glass. They are structurally different from retail:

| Dimension | Off-Premise (Retail) | On-Premise (Bars/Restaurants) |
|---|---|---|
| Buyer | Buyer/purchasing manager | Bar manager or owner |
| Purchase unit | Case/pallet | Case (sometimes mixed) |
| Re-order trigger | Shelf velocity | Velocity by the glass + cocktail menu cycle |
| Brand impact | Label visibility at shelf | Bartender recommendation + cocktail menu presence |
| Sales cycle | Distributor push → shelf | Distributor push → back-bar → menu → pour |
| Siempre advantage | Premium shelf position, clean label | Story, origin, additive-free — bartenders care |

On-premise accounts are higher-friction to land but deliver outsized brand equity. A placement at a marquee cocktail bar in a priority market creates pull. A 12-bottle/month back-bar in a dark corridor of a chain restaurant does not.

---

## Account Tier Definitions

Every on-premise account in the master contacts DB must have a tier. Tiers drive qualification scoring in the Hunting Layer and trigger thresholds in the Farming Layer.

### Tier A — Flagship
High-volume, high-visibility venues where a Siempre placement is a brand moment.

**Criteria (ALL three must be true):**
- Average weekly covers ≥500 OR dedicated cocktail/spirits program
- On-premise tequila volume ≥8 cases/month (any brand)
- Known to the industry: a new listing here gets talked about, shared, or emulated

**Examples:**
- Premium cocktail bars, speakeasies, craft cocktail programs
- High-volume hotel bars and rooftop venues
- Michelin-adjacent or press-covered restaurants
- Official program bars (e.g. Edmonton Oilers arena bar — Siempre already here)

**Hunting priority:** First-pass targets in every market. These require Sonnet-tier (Stratum II) outreach — buyer negotiation often involves menu placement fees, cocktail development, or staff training asks.

**Farming threshold:** Trigger `LISTING_AT_RISK` after 1 zero-depletion month (not 2). These accounts require faster intervention.

---

### Tier B — Quality
Solid on-premise accounts with consistent volume and an audience that fits the Siempre drinker profile.

**Criteria:**
- Average weekly covers 100–499
- Tequila-adjacent cocktail program (margaritas, palomas, agave-forward drinks on menu)
- Good relationship with distributor rep

**Examples:**
- Mid-scale cocktail bars, neighborhood spirits bars
- Casual fine dining with active cocktail program
- Popular brunch spots with tequila cocktail offerings

**Hunting priority:** Second pass. Standard Haiku qualification.

**Farming threshold:** Standard — `LISTING_AT_RISK` after 2 consecutive zero-depletion months.

---

### Tier C — Volume
Accounts that move product at acceptable volume but don't contribute brand equity.

**Criteria:**
- Any on-premise account not meeting Tier A or B threshold
- Typically: dive bars, casual chains, event venues with generic well programs

**Hunting priority:** Only in high-density market sweeps where rep can batch-pitch easily.

**Farming threshold:** Standard — but if volume is only 1–2 cases/month and account is C-tier, allow account to lapse rather than investing rep time in recovery.

---

### Tier X — Chain/Franchise
National or regional chains where the listing decision is made centrally (not by local bar manager).

**Examples:** TGI Friday's, Marriott, Hard Rock, Dave & Buster's

**Handling:** Chain accounts are NOT handled by Hunt Window Agents directly. They route to the Hunting Coordinator → Sales Director → Alex for chain buyer outreach. Tag as `type: "chain"` in master contacts DB, not `"on-prem"`.

---

## SKU Recommendation by Venue Type

| Venue Type | Lead SKU | Upsell SKU | Notes |
|---|---|---|---|
| Craft cocktail bar | Plata | Reposado | Plata is the bartender SKU — clean, mixable, story to tell |
| Premium hotel bar | Reposado | Añejo | Sippers + Old Fashioned riffs. Push Late Checkout positioning |
| High-volume nightclub | Plata | Exclusivo (LTO) | Speed + visual. Chisme Blanco if adjacent program exists |
| Michelin/fine dining | Añejo | Exclusivo LTO | Position as a sipping category, not well |
| Mexican restaurant | Plata + Repo | Chisme Blanco | Chisme is purpose-built for this channel |
| Casual bar/gastropub | Plata | Chisme Blanco | Chisme ~$27 USD fits casual well programs |
| Sports bar | Chisme Blanco | Plata | Volume play. Keep Siempre off the well but Chisme ON it |

**Brand separation rule:** Siempre and Chisme are separate brands with separate positioning. Never pitch them together as a bundle unless explicitly selling "two-brand coverage" to a multi-outlet buyer. See CLAUDE.md brand separation rule.

---

## Qualification Scoring (Hunting Layer Integration)

The Hunting Layer's Stage 2 qualification uses a 0–10 score per factor. For on-premise accounts, apply these weightings:

| Factor | Weight | How to Score On-Prem |
|---|---|---|
| Volume potential | 0–10 | A-tier=9-10, B-tier=5-8, C-tier=1-4 |
| Competitive presence | 0–10 | Competitor premium tequila listed = 8-10 (category acceptance proven). No tequila program = 2-4 (development sell needed) |
| Rep relationship | 0–10 | Rep has direct contact with buyer = 8-10, has visited account = 5-7, account is cold to rep = 1-3 |
| Account tier | 0–10 | A=10, B=6-7, C=2-4 |

**Threshold:** Score ≥24 (out of 40) advances to Rep Briefing. Below 24 → `deferred`.

**Override rule:** Any A-tier account with a competitor listing ≥6 cases/month auto-qualifies regardless of score. These are high-priority competitive displacements.

---

## The On-Premise Pitch Framework

### For Bartenders / Bar Managers (the executors)
Lead with: **the liquid and the story**

> "Siempre Plata is additive-free, cristalino-style finish without the filtration trade-off. It's the bartender's tequila — you can build a proper Paloma or a Tommy's Margarita and the spirit doesn't disappear in the glass. We're the official tequila of the Edmonton Oilers. Forbes has covered us. This isn't a brand looking for validation — it's one looking for the right home."

Key angles:
- Additive-free — differentiated from most bar rails and Patron
- Story works: $9,000 → 35 markets, Forbes, Oilers. Bartenders love an underdog brand with a real story
- Give them something to say: "A Canadian-Mexican tequila that went from $9,000 to the NHL" is a four-second sell to a curious customer

What NOT to do:
- Don't lead with price. Price is for the buyer conversation, not the bartender conversation.
- Don't compare to Casamigos or Patron directly — "we're not X" is weak positioning
- Don't pitch all 9 expressions on first meeting. Lead with one, earn the right to the rest.

### For Buyers / Purchasing Managers (the decision-makers)
Lead with: **velocity and margin**

> "On your current tequila program you're seeing __ cases/month. Siempre Plata at [SRP] generates [PTR] for you and moves because bartenders ask for it by name. We'll support the placement with rep training and leave-behinds. You're not taking a risk on an unknown — this is a Forbes-covered brand, official Oilers tequila, and the reps know the story."

Key angles:
- Show the PTR explicitly (buyers speak in PTR and margin %)
- Trade ROI framing: Siempre's GP hard floor is 30% on our end — communicate the value of a clean program
- Offer rep training: takes 20 minutes, dramatically increases pour velocity

What NOT to do:
- Don't invent promotional mechanics (SBAs, TPRs, billbacks) unless you've verified them. See `feedback_no_hallucinated_mechanics.md`
- Don't promise volume guarantees you can't back

---

## On-Premise KPIs

These KPIs are used by both the Hunting Coordinator (conversion tracking) and the Farming Coordinator (health monitoring).

| KPI | Definition | Target |
|---|---|---|
| **On-prem conversion rate** | % of qualified on-prem leads that become confirmed listings | Track by market — benchmark at 15% year 1 |
| **Menu placement rate** | % of confirmed on-prem accounts with Siempre on the cocktail menu (vs. back-bar only) | ≥40% of A/B-tier accounts |
| **By-the-glass velocity** | Estimated cases/month per account based on depletion data | A-tier: ≥4 cases/mo, B-tier: ≥1.5 cases/mo |
| **Re-order rate (on-prem)** | % of on-prem accounts that placed a second order within 60 days | Target: ≥65% |
| **Bartender advocacy index** | Qualitative: # of accounts where rep reports spontaneous bartender mentions | Track directionally |
| **Cocktail menu inclusions** | Count of cocktail menus featuring a Siempre recipe | Track per market |

---

## Integration Points

### Hunting Layer
- Stage 2 Qualification: use tier definitions and scoring above
- Stage 3 Rep Briefing: include venue tier, SKU recommendation, and pitch angle in briefing doc
- Stage 4 Outreach Draft: use pitch framework above, tailored to buyer vs. bartender audience
- Stage 5 Cadence: on-prem specific — `D+7` follow-up if no rep response

### Farming Layer
- A-tier trigger threshold: `LISTING_AT_RISK` fires after **1** zero-depletion month (not 2)
- On-prem re-engagement: rep contact is always primary channel; skip direct brand outreach unless `REP_UNRESPONSIVE` is active (per farming-layer-spec.md Open Question #3 — resolved here: yes, skip direct for on-prem)
- C-tier on-prem: allow natural lapse if <1.5 cases/month and rep recovery cost is high

### Cocktail Gap Analysis (Job 12)
This framework's tier definitions are the input to the gap analysis. Gap priority is directly tied to account tier: A-tier accounts with a competitor listing and no Siempre = highest priority cocktail gaps.

### Ownership Group Research (Job 24)
Multi-location ownership groups (restaurant groups, hotel chains, club operators) that own ≥3 A-tier accounts in a market are the target of Job 24's pitch packages. Identify via master contacts DB `ownership_group` field (if populated) or rep intel.

---

## Data Requirements

For the framework to run operationally, the master contacts DB needs these fields per on-premise account:

| Field | Source | Current State |
|---|---|---|
| `account_tier` | A/B/C/X | NOT currently tagged — requires backfill by rep or agent |
| `avg_weekly_covers` | Estimate from rep intel | NOT currently in DB |
| `cocktail_program_score` | 1-5 subjective | NOT currently in DB |
| `competitor_listings` | Rep reported or scraped | Partial — some accounts in VIP iDig |
| `menu_url` | Web scrape | NOT currently in DB — needed for Job 12 |
| `ownership_group` | Rep intel | NOT currently in DB |

**Priority backfill:** A-tier accounts in priority markets (US-total, ON, AB, NC) should be tagged first. Rick + Nick can populate via rep intel; Hunting Coordinator can assist with competitive scraping (Job 12).
