# SIEMPRE SPIRITS — SALES FORCE FOUNDATION DOCUMENT

> Shared context for all 56 market agents. Every agent loads this before operating.
> Last updated: 2026-04-13

---

## 1. COMPANY IDENTITY

**Siempre Spirits** — Independent tequila brand. Founded by Alex Lacroix (CEO) and Monica Sanita (COO/Co-Founder).

- **Origin:** NOM 1414, Arandas, Jalisco
- **Positioning:** Premium/Ultra-premium. Scrappy indie brand with Diageo-level market discipline.
- **Distribution model:** Direct supplier → distributor (no broker intermediary since Sep 2025). PBG relationship ended.

**Core Team:**
| Person | Role | Email |
|--------|------|-------|
| Alex Lacroix | CEO/Founder — pricing, key accounts, direct distributor relationships | alex@siempretequila.com |
| Monica Sanita | COO/Co-Founder — operations, finance, logistics | monica@siempretequila.com |
| Nick Henry | National Sales — FL, TX, CA, NY, CT primary | nick@siempretequila.com |
| Rick Harper | Canadian Operations — Canada + OK, VA, IN, KS, MO | rick@siempretequila.com |
| Anna-Karen (AK) | Operations | ak@siempretequila.com |

---

## 2. PRODUCT LINE & SKUs

| Product | SKU | COGS/case | Standard FOB | SRP Target |
|---------|-----|-----------|--------------|------------|
| Siempre Plata | 6x750ml | $73.22 | ~$128–135 | $45–$50 |
| Siempre Reposado | 6x750ml | $81.50 | ~$148–155 | $54–$58 |
| Siempre Añejo | 6x750ml | $128.68 | ~$270–280 | $90–$95 |
| Siempre Exclusivo | 6x750ml | TBD | TBD | LTO/limited |
| Chisme | 6x750ml | TBD | TBD | Single SKU |

**Case normalization:** Always normalize to 9-liter equivalents (6x750ml = 0.5 x 9L case).

---

## 3. MARKET TIER DEFINITIONS

| Tier | Count | Description | Scoring Model |
|------|-------|-------------|---------------|
| Tier 1 | 8 | Highest priority — active distribution, deepest dossiers | 5-factor (100-pt scorecard) |
| Tier 2 | 15 | Active or transitioning — full dossiers | 3-factor scoring |
| Phase 3 | 33 | No active distribution — regulatory shells | 1-factor + dark market alert |

**Tier 1:** CA, TX, CO, WA, FL, IL, ON
**Tier 2:** KS, OK, TN, GA, AR, MO, VA, UT, WY, SC, AB, SK, MB, BC, QC
**Phase 3:** AL, ID, IA, ME, MI, MS, MT, NH, NC, OH, PA, VT, WV + CT, MA, NJ, WI + AK, MD, MN, SD + AZ, DE, HI, IN, KY, LA, NE, NV, NM, NY, ND, RI

---

## 4. STATE REGULATORY CLASSIFICATIONS

### Control States (Tier 3 / Phase 3 unless active)
State controls wholesale distribution. Supplier sells to state warehouse, state sells to retailers.
> AL, ID, IA, ME, MI, MS, MT, NH, NC, OH, PA, VT, WV

### Franchise-Flagged Markets ⚠️
**These states have franchise/tied-house laws that restrict or complicate distributor termination.
Never recommend a distributor change in these markets without legal review.**

| State | Code | Current Tier | Franchise Risk Note |
|-------|------|-------------|---------------------|
| Connecticut | CT | Phase 3 | Strong franchise protections. Termination requires cause + notice period. |
| Massachusetts | MA | Phase 3 | Among strongest franchise laws in US. Distributor has significant legal standing. |
| New Jersey | NJ | Phase 3 | NJ franchise act applies. Change requires documented cause. |
| Tennessee | TN | **Tier 2 — ACTIVE** | Franchise-flagged despite active status. Any distributor conversation requires legal pre-clearance. No distributor change recommended (see Section 10 risk flag). |
| Wisconsin | WI | Phase 3 | WI franchise law applies. Historically complex for supplier terminations. |

### Standard License States
Private three-tier system, no state control, no franchise complications.
> Most US states including CA, TX, FL, CO, WA, etc.

### Jurisdiction-Sensitive
Special rules, import complexities, or unusual regulatory environments.
> AK (remote logistics), MD (pending pricing), MN (complex markup rules), SD

---

## 5. PRICING PRINCIPLES

1. **FOB is fixed per market** — does not change across volume tiers. Volume discounts come from case price, not FOB.
2. **Work backward from shelf** — Alex thinks in .99 ladders. Pick SRP first, reverse-engineer FOB.
3. **Distributor floor: 25% at max volume.** Never compress below this.
4. **Retail margin target: 30%.**
5. **Always show full 9-level price tree** — never truncate to 4 levels.
6. **DAs are market-specific** — only use where legally permitted AND strategically warranted.
7. **Never invent promotional mechanics** (SBAs, billbacks, TPRs) without verification. Control states don't support three-tier promo structures.

---

## 6. KPI SCORECARD (Tier 1: 5-Factor, 100 Points)

| Factor | Weight | Description |
|--------|--------|-------------|
| % to depletion target | 30 pts | Actual depletions vs. market goal |
| Reorder rate | 20 pts | % of PODs reordering in 90-day window |
| Pipeline coverage | 20 pts | Weeks of distributor inventory on hand |
| Core SKU mix | 15 pts | Plata + Repo in same POD (brand pyramid) |
| Spend per case | 15 pts | Distributor marketing investment per 9L case |

**Score thresholds:** GREEN ≥ 75 | YELLOW 50–74 | RED < 50

**Tier 2 (3-factor, 60 points):** % to target (30) + reorder rate (20) + pipeline (10)

**Phase 3 (1-factor):** Dark market alert — any distribution attempt, compliance event, or COLA expiration.

---

## 7. DATA SOURCES BY REGION

| Region | Source | Lag | Notes |
|--------|--------|-----|-------|
| US (most states) | VIP iDig | 30-60 days | Primary US depletion data |
| Oklahoma | Dive → Optimus | varies | VIP iDig unreliable for OK |
| California | VIP iDig | 30-60 days | Live integration confirmed |
| Ontario | LCBO portal | 60-90 days | Monthly reporting cycle |
| Alberta | AGLC portal | 60-90 days | Quarterly tends |
| Saskatchewan | SLGA portal | 60-90 days | |
| Manitoba | eLLIS tender system | varies | **CRITICAL: eLLIS access must be restored — see MB dossier** |
| British Columbia | BCLDB / Bcl.com | 60-90 days | |
| Quebec | SAQ portal | 60-90 days | eLLIS tender for listing applications |
| PA warehouse | PA PLCB | real-time | US inventory control point |

---

## 8. SUPPLY CHAIN FLOW

**US:** Mexico (NOM 1414) → PA warehouse (control point) → distributor warehouse → retail/on-premise
**Canada:** Mexico → LCBO/provincial system (Ontario lead) or direct provincial import

Key: PA warehouse is the US inventory control point. All US shipments flow through here.

---

## 9. COMMS PROTOCOL

**OUTBOUND FIREWALL:** All market agents have zero authority to contact external parties.
Any recommended external action must flow: Market Agent → Sales Director → Solace (Claude) → Alex/Nick/Rick/Monica/AK.

**Distributor email tone:** Warm, grateful, service-oriented. Make yes easy. Numbers in attachments, story in the body. Name the pain. Give the rep a physical action. No math hedging.

---

## 10. BRAND ASSETS

- **BrandBay:** app.brandbay.io/brand/siempre-tequila — sell sheets, bottle images, rep kits. Share with distributors on intro.
- **Distillery photos:** NOM 1414 Arandas visual library — 91 files, 10 categories.

---

*This document is the shared foundation for all 56 market agents. Per-market detail lives in individual dossiers.*
