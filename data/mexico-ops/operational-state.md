# Mexico Operations — Operational State
> Snapshot: 2026-04-06. Mined from WhatsApp, Email, Monday.com, Maton.

## Critical Issues (Action Required NOW)

| # | Issue | Owner | Deadline | Source |
|---|-------|-------|----------|--------|
| 1 | CRT certificate MISSING for US shipment P115775 — container can't depart Altamira | AK | Apr 10 (vessel doc cutoff) | AK Email |
| 2 | LCBO PO acknowledgements not submitted (4 POs: 781473, 785447, 791355, 794279) | Monica/AK | Immediately | Alex Email |
| 3 | Gomsa Logística US$4,411 overdue — credit suspension in 10 business days | Monica | ~Apr 22 | AK Email |
| 4 | Plata master boxes at NEGATIVE inventory (-2,120) | AK | Before next run | Monday.com |
| 5 | LCBO Reposado — 28 bottles left across 15 Ontario stores, no PO since H1 2025 | Alex | This week (plan Apr 8) | WhatsApp |

## Active Shipments

| Ref | Route | Status | Blocker |
|-----|-------|--------|---------|
| P115775 | Altamira→NJ (Prestige) | Cargo ready at HLC, Albatrans has docs | CRT cert missing. Vessels: MSC CANBERRA III ETD Apr 17→ETA May 1, or MSC RESILIENT III ETD Apr 26→ETA May 8 |
| LCBO 781473 | HLC→Ontario (Chismé 400 boxes) | Albatrans picking up Apr 7 | On track |
| IGL SK | Nuevo Laredo→Regina SK | Crossing border Apr 6-7 | 2nd half-payment due on delivery (~$7,106) |
| AB/BC | Mexico→Alberta/BC (BevCollective) | AK owes ETA to Eli | ETA not confirmed |
| LCBO 794279 | HLC→Ontario | Shipper confusion (Tequilera El Charro?) | AK needs to clarify |

## Production State

| SKU | Location | Cases | Status |
|-----|----------|-------|--------|
| Chismé PO-02 | HLC | ~100 | Bottled. Next batch ~150 ETA May 4 |
| LCBO Plata (3 POs) | 1414 | 700 | In bottling |
| Statik Rebel Cask | 1414 | 79 | 73→PBG, 6 kept. TTB+CRT cleared |
| NYNJ Rebel Cask | 1414 | 38 | 36→PBG, labelled, ready |
| Conexiones Rebel Cask | 1414 | 40 | 39→PBG, CRT approved |
| Reposado | Mexico warehouse | 596 | Mixed sticker/charm status |
| Supremo (47%) | Mexico, Lote 01 | 162 | Monica: 100→PBG, 62 stay |
| North Texas Special | Available | ~70 (340L) | Sergio can produce more |

## Barrel Inventory (NOM 1414)

- **34 filled** / 76 empty / 7 sold / 3 dumped = 120 total
- **7,438 total liters** in barrel
- **CRITICAL:** Estibas 5 (980 days, 225L, 43.4%) and 8 (1,158 days, 200L, 43.5%) — Statik owner. Need bottling decision NOW.
- 3 barrels ON HOLD for KEITH (999, 1000, 1001)
- 1 barrel ON HOLD for Co-op (juice pulled Mar 3)
- Conexiones/Doug: 5 barrels (Cognac, Maple, Armagnac) — 359 days
- Muerto batch: Estibas 617, 618, 654, 655 (548 days, 54.69% ABV, 180L each)

### Single Barrel Sales Pipeline
- **Called & Confirmed (3):** High Spirits NYNJ, Off-Premise Chicago Lou Agave, Atlanta Sabor Y Cultura
- **Need to Call (16):** Michael deMahy, High Spirits NJ (Apr 23-25 requested), Doug Price (4+blanco), Astor Wines NY, North Texas Tequila Club, NYC State Pick, LA Tequila Club, Bob's Liquor, Aztec Liquor Chicago, Royals Liquor Chicago, St Elmo Group, Buibbas Shack, Britt Indian Casino, High Proof/Rachel Bennett, + more

## Vendor Health

| Vendor | Status | Flag |
|--------|--------|------|
| Gomsa Logística | US$4,411 overdue, credit suspension warning | CRITICAL |
| EIDEC/Hugo | Outstanding debt, payment plan, new=100% prepay | WATCH |
| 1414/Angie | Barrel tequila pricing months overdue | BLOCKER |
| Motiprint | Good relationship, responsive, best labels | HEALTHY |
| HLC | Functional, won't share invoice until bottling starts | FRUSTRATING |
| Albatrans | Active on 2 shipments, keeps transferring people | FUNCTIONAL |
| IGL | SK shipment crossing, half-payment received | HEALTHY |
| BevCollective | Freight quote for BCL pricing still pending | WAITING |

## Canada Forecast Gap

Rick's April 1 forecast: **2,181 cases net + 600 buffer = 2,781 cases** needed for AB/BC through July.
Monica asked Rick to clarify whether "net production" is on top of existing forecast or inclusive.
**Answer not received yet.** April LTO window is imminent.

## Stuck Projects (Monday.com)

| Project | Duration Stuck | Reason |
|---------|---------------|--------|
| Ceramic Bottle | 6+ months | No supplier for small batches (25-50), cost ≠ sales value |
| Cosmos Project | Months | Sergio tension, yeast R&D in early fermentation pilot |
| Fernando Barrel | Unknown | HIGH priority on AK's board, zero subitems, no visible action |
| Fernando Agave Journey | Months | Stuck in Rebel Cask lifecycle pipeline |

## AK's Current Task List (Monday.com)

### This Week
- Ceramic Bottle — STUCK
- Cosmos Project — STUCK
- Chismé — Working (dictamen CRT, samples Anfora, print-pay-deliver)
- Papel NY NJ — Working (Alejandro)
- Bottling date NJ NY — Working
- Fernando Barrel — HIGH, no action visible
- PO Plata — NOT STARTED
- Canada Shipment — HIGH, 8 subitems all blank (Botella, Tapon, Etiqueta, Pay insurance, ASN, POs, SAQ)

### Next Week
- REV dictamen Mexico — Working

### Future
- Barrel Program, Labels Añejo 1414, Añejo Forecast, Fiesta/House Party, Mixto/Churro, Mexico Sales

## Maton API Access

| Account | Key Env Var | Services |
|---------|------------|----------|
| ana-karen@siempretequila.com | ANA_MATON_KEY (Pepe .env) | Gmail, Calendar, Docs, Sheets, Monday.com, Granola |
| alex@siempretequila.com | MATON_API_KEY (siempre-reports .env) | Gmail, Zoho Books, Calendar, Drive, Monday, +16 more |
| info@siempretequila.com | MATON_INFO_TOKEN | Gmail only |
| rick@siempretequila.com | RICK_MATON_KEY | Gmail, Monday.com |

## Key Email Search Patterns (ANA_MATON_KEY)

| Purpose | Gmail Query |
|---------|------------|
| Supplier quotes | from:angie OR from:cesar subject:cotización OR subject:quote has:attachment |
| CRT correspondence | from:crt.org.mx OR subject:CAET OR subject:certificado |
| Priority1 freight | from:priority1 OR from:robert.connacher subject:shipment |
| Label proofs | from:jamie OR subject:artwork OR subject:label proof has:attachment |
| Distillery scheduling | from:vivamexico OR from:angie subject:bottling OR subject:envasado |
| Export documents | subject:commercial invoice OR subject:packing list has:attachment |
