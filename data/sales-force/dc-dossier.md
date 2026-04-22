# State Sales Agent Dossier — Washington DC (DC)

> **Purpose:** Zero-fog pricing context for the DC market. Ground truth for the DC state agent before any pricing proposal is built or reviewed.
>
> **Agent:** DC Market Agent — reports to Sales Director (Opus)
> **Owner:** Update after every Granola call or market event.
> **Location:** `/Users/alexl/siempre-swarm/data/sales-force/dc-dossier.md`

---

## 1. Market Identity

| Field | Value |
|-------|-------|
| State / Province | Washington DC |
| Market Code | DC |
| Country | US |
| State Type | `three-tier` |
| Distributor | RNDC (Republic National Distributing Company) — Reyes acquisition in progress |
| Key Contact | Brittany Zichelli — Brittany.Zichelli@rndc-usa.com |
| Secondary Contact | Samantha McKissick — samantha.mckissick@rndc-usa.com |
| Human Owner | Alex |
| Market Tier | B |
| 2026 Case Target | TBD |
| Current Status | Active — pricing rebuild in progress (v1.0 rejected 2026-04-10) |

---

## 2. Pricing Rules — This Market

| Rule | Value | Source |
|------|-------|--------|
| Channel Pricing | **YES — on-premise channel pricing ALLOWED** in DC | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| Free Goods Allowed | NO — not applicable for DC | — |
| Price Posting Requirement | Posted with RNDC; DC and MD pricing filed together (same PTR ladder) | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| Tier Structure | List / 1C / 3C / 5C / 10C | RNDC grid (from v1.0 context) |
| DA Cap | $15–20/case max — NO DA until goal program submitted | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| Promotional Mechanics Allowed | SBAs/billbacks — verify DC rules before proposing. NO incentives or meetings until Brittany submits goal program (targeting June 2026). | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| State Excise Tax | ~$1.50/gal → low relative to other markets | pricing_engine.py |
| Retail Margin Standard | 30% |  |
| Special Formula | None — standard three-tier math |  |

> **CRITICAL FOG POINT — DC vs. MD:** DC and MD are filed under the same RNDC contacts and use the same PTR ladder. **However, their channel pricing rules are opposite.** DC CAN do on-prem channel pricing. MD CANNOT. Never apply DC's on-prem split to an MD proposal, and never strip DC's on-prem split because of MD's restriction.

---

## 3. Current Pricing — Filed / Active

**Status: REBUILD PENDING — v1.0 rejected 2026-04-10. FOB model was wrong (tiered FOBs instead of single FOB + discount ladder). Blocked on Alex confirming DC FOB.**

| SKU | FOB/Case | List PTR | Bottle to Retailer | Posted SRP | Dist Margin | Supplier Margin | Status |
|-----|----------|----------|--------------------|------------|-------------|-----------------|--------|
| Plata | TBD (Alex to confirm ~$135?) | TBD | ~$33.33/bottle (in RNDC system) | TBD | TBD | TBD | PENDING REBUILD |
| Repo | TBD | TBD | ~$37.66/bottle (in RNDC system) | TBD | TBD | TBD | PENDING REBUILD |
| Añejo | TBD | TBD | TBD | TBD | TBD | TBD | PENDING REBUILD |
| Supremo | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Chismé | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

**In-system note (Granola Mar 18):** RNDC has Plata at ~$33.33 and Repo at ~$37.66 — interpreted as per-bottle PTR to retailer. Implies Plata FOB ~$135/case. Alex must confirm before rebuild.

**Last FOB change:** Unknown
**Next allowable change:** Anytime (pending Alex decision)
**Submitted to PBG:** Pending rebuild

---

## 4. Distributor Call Log (from Granola)

### Call: March 18, 2026 — RNDC MD/DC Intro Call
**With:** Brittany Zichelli (RNDC)
**Key pricing context:**
- Current in-system pricing: Plata ~$33.33 | Repo ~$37.66 (per-bottle PTR)
- DC and Maryland pricing need to be **mirrored** (same PTR ladder)
- DC has on-premise channel pricing available; Maryland does NOT
- Siempre has been outside RNDC sales team goals since Prestige's departure — no incentives or sales meetings allowed until Brittany submits a goal program
- Brittany targeting June 2026 as the realistic start for goal selection (May too tight)
- Brittany to send current account list for both MD and DC
- Exploring whether direct DM contact for account support is possible

**Granola link:** [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251)

---

## 5. Market Nuances — Fog Audit Checklist

> Run every pricing proposal through this checklist before passing to Alex. Do not advance a proposal with any unchecked item.

- [ ] **State type correctly applied** — DC is three-tier. Three-tier mechanics (SBAs, billbacks, per-case DAs) are applicable IF verified against DC trade practice rules.
- [ ] **Channel pricing rule applied** — DC ALLOWS on-prem channel pricing. On-prem accounts should receive a separate (better) deal tier. Off-prem accounts receive standard ladder.
- [ ] **Free goods rule applied** — NOT APPLICABLE in DC. Do not include free goods mechanics.
- [ ] **Tier structure matches RNDC's grid** — Use List/1C/3C/5C/10C. Not the WA 9-level model.
- [ ] **SRP targets respected** — Plata target $45–50. At List SRP should be ~$49.99–52.99. At 10C floor should not go below $42.99. Flag any SRP below $45 at 5C.
- [ ] **DA within cap** — $15–20/case max. **NO DA may be proposed until Brittany submits goal program to RNDC (targeting June 2026).** Flag for Alex — do not include DA in v2 without this gate being cleared.
- [ ] **Promotional mechanics verified** — Incentives and sales meetings are FROZEN until goal program is submitted. Do not propose SBAs or rep contests without confirming goal program is live.
- [ ] **Retail margin calculation correct** — 30% standard. Verify PTR math: SRP × 0.70 = PTR.
- [ ] **Framing numbers flagged for Alex** — Investment budget / DA framing not finalized by agent. Alex dials.
- [ ] **Prior commitments checked** — v1.0 was REJECTED (wrong FOB model). Do NOT resend or reference v1.0 numbers. Rebuild from scratch.
- [ ] **Granola call context applied** — March 18 call with Brittany: goal program gate, June timeline, DC channel pricing OK.

**Market-specific fog points:**
- **HARD RULE:** DC and MD are same contacts, same RNDC, same PTR ladder — but OPPOSITE channel pricing rules. DC = on-prem channel pricing YES. MD = on-prem channel pricing NO. Never apply one market's channel structure to the other.
- **Goal program gate is a HARD GATE:** No DA, no incentive, no rep contest in DC until Brittany submits the goal program to RNDC. Alex must know this gate exists before any DA is proposed.
- **FOB is FIXED:** One FOB for DC, does not change by tier. Volume ladder = discount from Case Price (RNDC's side), not multiple Siempre FOBs. This was the v1.0 failure mode.
- **Reyes acquisition in progress:** RNDC is being acquired by Reyes. Monitor for relationship continuity. Brittany/Samantha may change roles.

---

## 6. Active Commitments & Open Items

| Item | Who Owes | Due | Status |
|------|----------|-----|--------|
| FOB confirmation for DC rebuild | Alex | ASAP | **BLOCKING** — v2 cannot be built until Alex confirms |
| Account list for DC | Brittany Zichelli (RNDC) | Outstanding from Mar 18 | Awaiting |
| Goal program submission to RNDC | Brittany Zichelli | June 2026 (target) | In progress |
| Pricing proposal v2 | Siempre → RNDC | After FOB confirmed | Blocked |

---

## 7. Competitive Shelf Context

> Not yet populated. Pull from Wine-Searcher or next Granola call with Brittany/Samantha.

| Brand | Plata SRP | Repo SRP | Añejo SRP | Notes |
|-------|-----------|----------|-----------|-------|
| Casamigos | TBD | TBD | TBD | Standard anchor comparison |
| Patrón | TBD | TBD | TBD | Mass-premium anchor |

---

## 8. Agent Initialization Instructions

When this dossier is loaded as context for the DC market agent:

1. Read sections 2 and 5 first — channel pricing is YES for DC (unlike MD which is NO). This is the #1 fog risk.
2. Pull latest Granola call via: `query_granola_meetings("DC RNDC Brittany Samantha McKissick pricing")`
3. Check DC FOB status — is Alex's confirmation in? If not, do NOT build a pricing table. Flag as blocked.
4. Check goal program status — has Brittany submitted to RNDC? If not, DA column must be blank in any proposal.
5. When reviewing a pricing proposal: run section 5 checklist top to bottom. Any unchecked item = reject and return to builder.
6. When a call happens: update section 4 immediately with Granola citation.

---

*Dossier created: 2026-04-11 | Sources: Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251), all-market-pricing-rules.md, feedback_pricing_agent_review.md*
