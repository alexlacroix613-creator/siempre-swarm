# State Sales Agent Dossier — Maryland (MD)

> **Purpose:** Zero-fog pricing context for the MD market. Ground truth for the MD state agent before any pricing proposal is built or reviewed.
>
> **Agent:** MD Market Agent — reports to Sales Director (Opus)
> **Owner:** Update after every Granola call or market event.
> **Location:** `/Users/alexl/siempre-swarm/data/sales-force/md-dossier.md`
>
> **⚠️ LINKED MARKET:** DC and MD use the same RNDC contacts and same PTR ladder but have OPPOSITE channel pricing rules. Always load this dossier alongside `dc-dossier.md` when building a joint proposal — then apply each market's channel rule separately.

---

## 1. Market Identity

| Field | Value |
|-------|-------|
| State / Province | Maryland |
| Market Code | MD |
| Country | US |
| State Type | `three-tier` (note: Montgomery County is a local control jurisdiction — see Section 2) |
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
| Channel Pricing | **NO — on-premise channel pricing NOT ALLOWED in MD** | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| Free Goods Allowed | NO — not applicable for MD | — |
| Price Posting Requirement | Posted with RNDC; MD and DC pricing filed together (same PTR ladder) | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| Tier Structure | List / 1C / 3C / 5C / 10C (mirror of DC ladder) | RNDC grid |
| DA Cap | $15–20/case max — NO DA until goal program submitted | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| Promotional Mechanics Allowed | NO incentives or meetings until Brittany submits goal program (targeting June 2026). SBAs/billbacks — verify MD rules before proposing. | Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251) |
| State Excise Tax | ~$1.50/gal | pricing_engine.py |
| Retail Margin Standard | 30% |  |
| Special Formula | None — standard three-tier math |  |

### Montgomery County Note
> Maryland is mostly a license state, but **Montgomery County is a local control jurisdiction** with its own rules and execution path. Do NOT finalize any pricing or logistics assumptions for accounts in Montgomery County without verifying the county-specific rules. Escalate to compliance/counsel for any launch, listing, or price plan touching Montgomery County.

---

## 3. Current Pricing — Filed / Active

**Status: REBUILD PENDING — v1.0 rejected 2026-04-10. FOB model was wrong. Blocked on Alex confirming MD FOB. MD and DC likely share the same FOB since pricing is "mirrored."**

| SKU | FOB/Case | List PTR | Bottle to Retailer | Posted SRP | Dist Margin | Supplier Margin | Status |
|-----|----------|----------|--------------------|------------|-------------|-----------------|--------|
| Plata | TBD (mirror of DC FOB — Alex to confirm) | TBD | ~$33.33/bottle (in RNDC system) | TBD | TBD | TBD | PENDING REBUILD |
| Repo | TBD | TBD | ~$37.66/bottle (in RNDC system) | TBD | TBD | TBD | PENDING REBUILD |
| Añejo | TBD | TBD | TBD | TBD | TBD | TBD | PENDING REBUILD |
| Supremo | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Chismé | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

**In-system note:** RNDC pricing is mirrored between DC and MD. Plata ~$33.33/bottle PTR, Repo ~$37.66/bottle PTR in system (Granola Mar 18). Implies FOB ~$135/case Plata. Alex confirmation required before rebuild.

**Last FOB change:** Unknown
**Next allowable change:** Anytime (pending Alex decision)
**Submitted to PBG:** Pending rebuild

---

## 4. Distributor Call Log (from Granola)

### Call: March 18, 2026 — RNDC MD/DC Intro Call
**With:** Brittany Zichelli (RNDC)
**Key pricing context:**
- Current in-system pricing: Plata ~$33.33 | Repo ~$37.66 (per-bottle PTR) — same as DC
- DC and Maryland pricing need to be **mirrored** (same PTR ladder, but channel rules differ)
- Maryland does NOT have on-premise channel pricing (DC does)
- No incentives or sales meetings until Brittany submits goal program to RNDC
- Brittany targeting June 2026 for goal selection (May too tight)
- Brittany to send current account list for MD and DC
- Montgomery County has different local-control rules from rest of MD

**Granola link:** [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251)

---

## 5. Market Nuances — Fog Audit Checklist

> Run every pricing proposal through this checklist before passing to Alex. Do not advance with any unchecked item.

- [ ] **State type correctly applied** — MD is three-tier (statewide). Montgomery County exception: local control. Proposals touching MoCo require compliance review.
- [ ] **Channel pricing rule applied** — **NO on-prem channel pricing in MD.** All accounts (on-prem and off-prem) receive the SAME pricing ladder. Do NOT apply the DC on-prem split to any MD proposal.
- [ ] **Free goods rule applied** — NOT APPLICABLE in MD.
- [ ] **Tier structure matches RNDC's grid** — Use List/1C/3C/5C/10C (mirror of DC). Not the WA 9-level model.
- [ ] **SRP targets respected** — Plata target $45–50. At List SRP ~$49.99–52.99. At 10C floor not below $42.99. Flag any 5C SRP below $45.
- [ ] **DA within cap** — $15–20/case max. **NO DA until Brittany submits goal program (targeting June 2026).** DA column must be blank until gate is cleared.
- [ ] **Promotional mechanics verified** — No incentives or rep contests until goal program is live. No SBAs/billbacks without verifying MD trade practice rules.
- [ ] **Retail margin calculation correct** — 30% standard. SRP × 0.70 = PTR.
- [ ] **Framing numbers flagged for Alex** — Investment budget / DA framing not finalized by agent.
- [ ] **Prior commitments checked** — v1.0 REJECTED (wrong FOB model). Do NOT resend or reference v1.0 numbers.
- [ ] **Granola call context applied** — March 18 call: channel pricing = NO for MD, mirrored ladder from DC, goal program gate in effect.

**Market-specific fog points:**
- **HARD RULE:** DC allows on-prem channel pricing. MD does NOT. Same distributor, same contacts, same pricing ladder — but the channel split applies ONLY to DC. Strip it from any MD proposal.
- **Montgomery County:** If any account in MoCo is in scope, escalate to compliance before filing. Do not treat MoCo as standard MD.
- **Goal program gate is a HARD GATE:** No DA, no rep incentive until Brittany submits. Alex must know this gate exists.
- **FOB is FIXED:** One FOB for MD, does not change by tier. v1.0 failure was tiered FOBs instead of discount ladder.
- **Mirroring DC ≠ copying DC wholesale:** Same PTR ladder, but MD version has no on-prem channel pricing tier. The proposals will look different in that column.

---

## 6. Active Commitments & Open Items

| Item | Who Owes | Due | Status |
|------|----------|-----|--------|
| FOB confirmation for MD rebuild | Alex | ASAP | **BLOCKING** |
| Account list for MD | Brittany Zichelli (RNDC) | Outstanding from Mar 18 | Awaiting |
| Goal program submission to RNDC | Brittany Zichelli | June 2026 (target) | In progress |
| Montgomery County compliance check | Compliance/counsel | Before any MoCo account is in scope | Not started |
| Pricing proposal v2 | Siempre → RNDC | After FOB confirmed | Blocked |

---

## 7. Competitive Shelf Context

> Not yet populated. Pull from Wine-Searcher or next Granola call.

| Brand | Plata SRP | Repo SRP | Añejo SRP | Notes |
|-------|-----------|----------|-----------|-------|
| Casamigos | TBD | TBD | TBD | Standard anchor |
| Patrón | TBD | TBD | TBD | Mass-premium anchor |

---

## 8. Agent Initialization Instructions

When this dossier is loaded as context for the MD market agent:

1. Read sections 2 and 5 first — channel pricing is **NO for MD** (unlike DC where it's YES). This is the #1 fog risk for this market.
2. Pull latest Granola call via: `query_granola_meetings("Maryland RNDC Brittany Samantha McKissick pricing")`
3. Check DC dossier (`dc-dossier.md`) alongside this one — the proposals are linked but channel pricing differs.
4. Check FOB status — is Alex's confirmation in? If not, do NOT build a pricing table. Flag as blocked.
5. Check goal program status — has Brittany submitted to RNDC? If not, DA column must be blank.
6. Check if any accounts in scope are in Montgomery County — escalate to compliance before filing.
7. When reviewing a pricing proposal: run section 5 checklist top to bottom. Any unchecked item = reject and return.

---

*Dossier created: 2026-04-11 | Sources: Granola [[26]](https://notes.granola.ai/d/c18254bb-99ec-40fd-8351-b5dd42ce5251), all-market-pricing-rules.md, maryland-md-shell.md*
