# State Sales Agent Dossier — Mississippi (MS)

> **Purpose:** Zero-fog pricing context for the MS market. Ground truth for the MS state agent before any pricing proposal is built or reviewed.
>
> **Agent:** MS Market Agent — reports to Sales Director (Opus)
> **Owner:** Update after every Granola call or market event.
> **Location:** `/Users/alexl/siempre-swarm/data/sales-force/ms-dossier.md`

---

## 1. Market Identity

| Field | Value |
|-------|-------|
| State / Province | Mississippi |
| Market Code | MS |
| Country | US |
| State Type | `control` — MS ABC is the ONLY wholesaler. No private distributor in the chain. |
| Distributor | **There is no private distributor.** MS ABC handles wholesale. |
| Broker | **Larry Leggett** — UDI Mississippi (broker only, NOT distributor) — lleggett@udimiss.com |
| Fulfillment/Shipping | Prestige Beverage Group (fulfillment/shipping vendor only — NOT the distributor) |
| Secondary Contact | Hunter Nichols — hnichols@udimiss.com |
| Human Owner | Alex |
| Market Tier | C |
| 2026 Case Target | TBD |
| Current Status | Active — pricing alignment in progress. All SKUs on SPECIAL ORDER. Game plan due ~Apr 15, 2026. |

---

## 2. Pricing Rules — This Market

| Rule | Value | Source |
|------|-------|--------|
| Channel Pricing | **NOT APPLICABLE — control state.** One price posted with MS ABC. No on/off-prem splits. | Control state rules |
| Free Goods Allowed | **NO — control state.** MS ABC does not allow private free goods mechanics. | Control state rules |
| Price Posting Requirement | Price filed with MS ABC. Special order pricing posted per SKU. | MS ABC |
| Tier Structure | **NO private tiers.** Quantity-break pricing only via MS ABC's calculator, if available. | Control state rules |
| DA Cap | **NOT APPLICABLE** — no private distributor to pay DA to. | Control state rules |
| Promotional Mechanics Allowed | **VERIFIED ONLY:** TPRs filed with MS ABC, posted promotional calendars, quantity-break pricing via state calculator, state-approved feature/display programs. NO SBAs, NO invoice billbacks, NO per-case chargebacks to a private distributor. | Control state firewall |
| State Excise Tax | TBD — verify via pricing_engine.py | pricing_engine.py |
| Retail Margin Standard | 30% (verify against MS ABC's markup schedule) | |
| Special Formula | MS ABC applies its own markup to the posted price. Verify before filing. | MS ABC |

### Control State Firewall — Mississippi
> **This is a control state. The following mechanics DO NOT EXIST and must NEVER appear in any MS proposal:**
> - SBAs (sales-based allowances) paid to a private distributor
> - Combined invoice / depletion billbacks
> - Per-case chargebacks to a private distributor
> - DA payments to a private distributor
> - On-prem vs. off-prem pricing splits
>
> **Larry Leggett is a BROKER, not a distributor.** He does not take title to product and does not receive DAs. Prestige is a fulfillment/shipping vendor — they move product, they do not set price.
>
> **Allowed tools:** TPRs filed with MS ABC, posted promotional calendars, quantity-break pricing via state calculator, state-approved display/feature programs.

---

## 3. Current Pricing — Filed / Active

**Status: ALL SKUs currently on SPECIAL ORDER (not listed). ~18 cases LTO combo packs in MS ABC bailment warehouse.**

| SKU | Posted FOB | MS ABC Price | Retailer Price | Retail SRP | Dist Margin | Supplier Margin | Status |
|-----|------------|--------------|----------------|------------|-------------|-----------------|--------|
| Plata | TBD (Larry has on file) | TBD | TBD | $45–50 target | N/A | TBD | Special order |
| Repo | TBD (Larry has on file) | TBD | TBD | $55 target | N/A | TBD | Special order |
| Añejo | TBD (Larry has on file) | TBD | TBD | $90–95 target | N/A | TBD | Special order |
| Supremo | TBD | TBD | TBD | $69–80 target | N/A | TBD | TBD |
| Chismé | TBD | TBD | TBD | ~$27 target | N/A | TBD | TBD |

**Larry committed (Apr 1 call):** To send the current price book (special order + bailment pricing) and last price quotes for all Siempre SKUs. **Check Maton for this email — it should have arrived by now.**

**Last FOB change:** Unknown
**Next allowable change:** Verify MS ABC filing calendar
**Submitted to PBG:** Unknown

### Incentive History (for reference — verify mechanism)
- $20/case mixed (Mar/Apr 2025)
- $25/case (Nov/Dec 2024)

> **Note on incentive history:** These dollar amounts were referenced in context of working with Larry (the broker). Verify the actual mechanism — in a control state, these would need to be filed with MS ABC as TPRs, not paid to a private distributor. Do not assume they were off-invoice DAs.

---

## 4. Distributor Call Log (from Granola)

### Call: April 1, 2026 — Larry Leggett Pricing Discussion
**With:** Larry Leggett (UDI Mississippi broker)
**Key pricing context:**
- Larry is Siempre's **broker** in MS (not distributor). Prestige is fulfillment/shipping vendor only.
- All Siempre SKUs are currently on **special order** (not listed with MS ABC).
- Larry has current pricing on file for Plata, Añejo, and Reposado. He committed to send it.
- MS described as "control/open hybrid" — independent stores, pricing varies by location. Likely refers to retail pricing variation; wholesale is still controlled by MS ABC.
- ~18 cases of LTO combo packs sitting in ABC bailment warehouse (not moving).

**Larry's commitments (from that call):**
- Send current price book (special order + bailment) and last price quotes on all Siempre SKUs
- Email MS ABC to request release of combo pack samples for his reps
- Schedule kickoff call with the full United team

**Siempre's commitments:**
- Review FOBs and pricing for all SKUs; assess margin room for broker support
- Send Larry the brand resource package + Siempre AI chat tool
- Return with full game plan (pricing analysis, programming, competitive set) — **2-week timeline = ~Apr 15, 2026**

**Granola link:** [[10]](https://notes.granola.ai/d/a62d1175-ddbc-4de3-99c8-3cc67c422876)

---

## 5. Market Nuances — Fog Audit Checklist

> Run every pricing proposal through this checklist before passing to Alex. Do not advance with any unchecked item.

- [ ] **State type correctly applied** — MS is a control state. MS ABC is the only wholesaler. No private distributor mechanics in this proposal.
- [ ] **Channel pricing rule applied** — NOT APPLICABLE. One posted price. No on/off-prem splits.
- [ ] **Free goods rule applied** — NOT APPLICABLE. No free goods in control states.
- [ ] **Tier structure matches state rules** — NO private tiers. Only quantity-break pricing via MS ABC's calculator, if available. Do not propose 1C/3C/5C ladder as if MS were a three-tier state.
- [ ] **SRP targets respected** — Plata $45–50, Repo $55, Añejo $90–95. Flag if MS ABC's markup structure puts SRP outside target.
- [ ] **DA within cap** — NOT APPLICABLE. No DA to a private distributor.
- [ ] **Promotional mechanics verified** — ONLY use: TPRs filed with MS ABC, posted promotional calendars, quantity-break pricing via state calculator, state-approved display programs. Any other mechanic is PROHIBITED.
- [ ] **Retail margin calculation correct** — Verify against MS ABC's markup schedule, not the standard 30% formula.
- [ ] **Framing numbers flagged for Alex** — Any broker support / incentive structure must be Alex-approved and validated against MS ABC rules.
- [ ] **Prior commitments checked** — Larry's price book email: check Maton. Combo pack sample release: check if MS ABC responded. Kickoff call with United team: has this been scheduled?
- [ ] **Granola call context applied** — Apr 1 call: Larry is broker only, all SKUs on special order, game plan due ~Apr 15. Full game plan = pricing analysis + programming + competitive set.

**Market-specific fog points:**
- **BROKER ≠ DISTRIBUTOR:** Larry Leggett is a broker. He does not take title to product. Prestige moves product. MS ABC sets wholesale price. Never write a proposal as if there's a private distributor receiving DAs.
- **Special order ≠ listed:** All SKUs are on special order, meaning buyers must request them — they don't flow through normal distribution. The listing pathway is a separate conversation.
- **Combo pack bailment:** ~18 cases of LTO combo packs are sitting in MS ABC's bailment warehouse. These need a move plan. Address in the game plan.
- **Control/open hybrid language:** Larry used this phrase — it likely refers to the retail tier (independent stores have pricing flexibility). The wholesale tier is still controlled by MS ABC. Do not interpret "open" as meaning three-tier mechanics apply.
- **Incentive history ambiguity:** The $20–25/case incentive history needs mechanism verification. Filed TPR with ABC? Or some other vehicle? Confirm before proposing anything similar.

---

## 6. Active Commitments & Open Items

| Item | Who Owes | Due | Status |
|------|----------|-----|--------|
| Full game plan (pricing analysis, programming, competitive set) | Siempre → Larry | ~Apr 15, 2026 | **URGENT — in progress** |
| Price book + last price quotes | Larry Leggett → Siempre | After Apr 1 call | Check Maton |
| Brand resource package + AI chat tool | Siempre → Larry | ASAP | Outstanding |
| Combo pack sample release email | Larry → MS ABC | After Apr 1 call | Unknown status |
| Kickoff call with United team | Larry to schedule | TBD | Not confirmed |
| FOB confirmation for MS proposal | Alex | Before game plan is sent | Needed |

---

## 7. Competitive Shelf Context

> Not yet populated. MS is special order market — pull from next Larry call or Wine-Searcher.

| Brand | Plata SRP | Repo SRP | Añejo SRP | Notes |
|-------|-----------|----------|-----------|-------|
| Casamigos | TBD | TBD | TBD | Standard anchor |
| Patrón | TBD | TBD | TBD | Mass-premium anchor |

---

## 8. Agent Initialization Instructions

When this dossier is loaded as context for the MS market agent:

1. Read sections 2 and 5 first — MS is a control state. The control state firewall is the primary rule. No three-tier mechanics.
2. Pull latest Granola call via: `query_granola_meetings("Mississippi Larry Leggett UDI pricing")`
3. Check Maton for Larry's price book email (committed Apr 1). This is the pricing ground truth for MS.
4. Verify: has the combo pack sample release been handled? Is the kickoff call scheduled?
5. Check the game plan deadline — ~Apr 15. If today is past Apr 15, escalate to Alex immediately.
6. When reviewing a pricing proposal: confirm ZERO three-tier mechanics appear anywhere. Control state firewall is non-negotiable.
7. When a call happens: update section 4 with Granola citation.

---

*Dossier created: 2026-04-11 | Sources: Granola [[10]](https://notes.granola.ai/d/a62d1175-ddbc-4de3-99c8-3cc67c422876), all-market-pricing-rules.md, mississippi-ms-shell.md*
