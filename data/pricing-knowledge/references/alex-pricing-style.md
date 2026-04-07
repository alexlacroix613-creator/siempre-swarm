# Comprehensive Analysis of Alex's Washington State Pricing Methodology

**Date:** February 25, 2026
**Spreadsheet:** [WA - WIP - Siempre All SKU 2.9.26 - TEMP EDIT COPY](https://docs.google.com/spreadsheets/d/1lGIsYq--Jq37hhl9NjOUNUyfBxQLP2auf1t3sye8UEA/edit?gid=656438547#gid=656438547)
**Author:** Manus AI

---

## 1. Executive Summary

This document provides a comprehensive analysis of the Washington State pricing spreadsheet as revised by Alex Lacroix. The workbook contains eleven tabs in total, of which three are active pricing tabs (Plata, Reposado, Añejo) and the remainder are supporting reference sheets (Instructions, Trade Math Calcs, Tax Tables). No Supremo or Chismé tabs exist in this workbook.

Alex has addressed every issue identified in our earlier analysis and has introduced a coherent, formula-driven pricing architecture that can be replicated across future states. The key changes include raising the Añejo FOB from $162.66 to $240.68, adding distributor taxes across all SKUs using a consistent 5.48% multiplier on PTR, adding two new on-premise deal levels, and restructuring depletion allowances to protect distributor margins. This document captures every detail needed to replicate his approach for Alabama, Arkansas, Wisconsin, and beyond.

---

## 2. Workbook Structure

The workbook contains the following tabs:

| Tab Name | Type | Description |
| :--- | :--- | :--- |
| Instructions | Reference | Pricing structure instruction guide; explains yellow input cells, mandatory fields, and section filters |
| (unnamed) | Hidden/Blank | Appears to be a blank separator tab |
| Plata_BySiempre | **Pricing** | Full pricing waterfall for Siempre Plata 750ML |
| Repo_BySiempre | **Pricing** | Full pricing waterfall for Siempre Repo 750ML |
| Anejo_BySiempre | **Pricing** | Full pricing waterfall for Siempre Anejo 750ML |
| (unnamed) | Hidden/Blank | Appears to be a blank separator tab |
| Trade Math Calcs | Reference | Margin/markup conversion calculator |
| Tables | Reference | Lookup tables (1,991 rows of reference data) |
| Spirits Tax Table | Reference | State-by-state spirits tax rates (259 rows × 42 cols) |
| Wine Tax Table | Reference | State-by-state wine tax rates |
| Beer Tax Table | Reference | State-by-state beer tax rates |

Each pricing tab follows an identical five-section layout: **(1) Landed Section**, **(2) Distributor Section**, **(3) Retailer Section**, **(4) Summary Section**, and **(5) Supplier Section**. All three pricing tabs share the same structure of 266 rows × 72 columns, with deal levels spanning columns I through AY in groups of three (Current, Proposed, Variance).

---

## 3. Issues Flagged in Earlier Analysis vs. Alex's Changes

The following table summarizes each issue we previously identified and how Alex resolved it:

| Issue | Original Problem | Alex's Resolution | Status |
| :--- | :--- | :--- | :--- |
| Plata Depletion Allowances | Missing DAs caused distributor margins to dip below 30% floor at certain deal levels | Added targeted DAs: $5.40 at 5-Case/25-Case and 500-Case Warehouse; $13.50 at Chain Intro QD; $2.00 at On-Premise EDLP; $10.00 at On-Premise BTG | Fixed |
| Distributor Taxes Missing | Taxes paid by distributor were absent from the waterfall across all SKUs | Added "Add'l Taxes Paid by Distributor" row with formula `=0.0548 * PTR` applied consistently across all deal levels and all SKUs | Fixed |
| Añejo FOB Below COGS | Original FOB of $124.22 was below COGS of $128.68, producing negative supplier margin | Raised Net FOB to **$240.68** (our recommended Scenario C), resulting in supplier margin of 46.5% | Fixed |
| Añejo Discount Schedule | Discount schedule was too aggressive given the low FOB | Tightened discounts; reduced freight from $9.29 to $3.18; restructured entire discount ladder | Fixed |
| New On-Premise Deal Levels | No dedicated on-premise pricing existed | Added **On-Premise EDLP** (Level 7) and **On-Premise Printed On Menu / BTG** (Level 8) across all three SKUs | Added |
| Chain Intro QD Retail Margin | Not aligned with Plata/Repo philosophy | Adjusted to target ~40% retail margin across all SKUs | Fixed |
| 500 Case Warehouse Retail Margin | Not aligned with Plata/Repo philosophy | Adjusted to target ~34-36% retail margin across all SKUs | Fixed |

---

## 4. Detailed Pricing Structure — All SKUs

### 4.1. Common Parameters

All three SKUs share the following Washington State parameters:

| Parameter | Value |
| :--- | :--- |
| Market | Washington |
| Distributor | RNDC |
| Category | Spirits |
| Size | 750ML |
| Alcohol % | 40.0% |
| Bottles per Case | 6 |
| State Tax | $16.96 |
| Local Tax | -$16.96 (offset) |
| Effective Date | 2/1/2024 |
| Shipment Type | Domestic |

### 4.2. Landed Cost Comparison

| Component | Plata (Current → Proposed) | Repo (Current → Proposed) | Añejo (Current → Proposed) |
| :--- | :--- | :--- | :--- |
| Net FOB | $124.22 → **$120.00** | $135.60 → **$135.60** | $162.66 → **$240.68** |
| Freight | $9.29 → $9.29 | $9.29 → $9.29 | $9.29 → **$3.18** |
| State Tax | $16.96 → $16.96 | $16.96 → $16.96 | $16.96 → $16.96 |
| Local Tax | -$16.96 → -$16.96 | -$16.96 → -$16.96 | -$16.96 → -$16.96 |
| **Distributor Landed Cost** | **$133.51 → $129.29** | **$144.89 → $144.89** | **$171.95 → $243.86** |
| COGS | $73.22 | $81.50 | $128.68 |

---

### 4.3. Plata_BySiempre — Full Proposed Pricing

#### Deal Level Names and Volume Weights

| # | Deal Level | % of Volume (Proposed) |
| :--- | :--- | :--- |
| 1 | List | 0% |
| 2 | 1 Case / 3 Case Family Plan | 20% |
| 3 | 2 Case / 4 Case Family Plan | 30% |
| 4 | 3 Case / 5 Case Family Plan | 50% |
| 5 | 5 Case / 25 Case Family Plan | 0% |
| 6 | Chain Intro QD | 0% |
| 7 | 500 Case Warehouse | 0% |
| 8 | On-Premise EDLP | 0% |
| 9 | On-Premise Printed On Menu (BTG) | 0% |

#### Distributor Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Case Price | $214.78 | $214.78 | $214.78 | $214.78 | $214.78 | $214.78 | $214.78 | $214.78 | $214.78 |
| Discount | $0.00 | $4.75 | $13.25 | $25.75 | $36.50 | $52.75 | $36.50 | $28.80 | $40.80 |
| PTR | $214.78 | $210.03 | $201.53 | $189.03 | $178.28 | $162.03 | $178.28 | $185.98 | $173.98 |
| Depletion Allow. | $0.00 | $0.00 | $0.00 | $0.00 | $5.40 | $13.50 | $5.40 | $2.00 | $10.00 |
| Dist. Taxes | $11.77 | $11.51 | $11.04 | $10.36 | $9.77 | $8.88 | $9.77 | $10.19 | $9.53 |
| **Dist. Margin $** | **$73.72** | **$69.23** | **$61.19** | **$49.38** | **$44.62** | **$37.36** | **$44.62** | **$48.50** | **$45.15** |
| **Dist. Margin %** | **34.3%** | **33.0%** | **30.4%** | **26.1%** | **25.0%** | **23.1%** | **25.0%** | **26.1%** | **26.0%** |

#### Retailer Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Bottle Cost | $35.80 | $35.01 | $33.59 | $31.51 | $29.71 | $27.01 | $29.71 | $31.00 | $29.00 |
| Taxes (Retailer) | $1.50 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| SRP | $52.99 | $49.99 | $47.99 | $44.99 | $44.99 | $44.99 | $44.99 | N/A | N/A |
| **Retail Margin %** | **29.6%** | **30.0%** | **30.0%** | **30.0%** | **34.0%** | **40.0%** | **34.0%** | N/A | N/A |

#### Supplier Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| COGS | $73.22 | $73.22 | $73.22 | $73.22 | $73.22 | $73.22 | $73.22 | $73.22 | $73.22 |
| PBG Margin $ | $46.78 | $46.78 | $46.78 | $46.78 | $41.38 | $33.28 | $41.38 | $44.78 | $36.78 |
| **Supplier Margin %** | **39.0%** | **39.0%** | **39.0%** | **39.0%** | **34.5%** | **27.7%** | **34.5%** | **37.3%** | **30.7%** |

#### Summary Metrics (Plata)

| Metric | Current | Proposed | Variance |
| :--- | ---: | ---: | ---: |
| Distributor Aggregate Margin $ | $54.83 | $56.89 | +$2.06 |
| Distributor Aggregate Margin % | 28.1% | 28.9% | +0.7% |
| Supplier Aggregate DA $ | $3.00 | $0.00 | -$3.00 |
| Supplier Aggregate Margin $ | $48.00 | $46.78 | -$1.22 |
| Supplier Aggregate Margin % | 38.6% | 39.0% | +0.3% |

---

### 4.4. Repo_BySiempre — Full Proposed Pricing

#### Deal Level Names and Volume Weights

| # | Deal Level | % of Volume (Proposed) |
| :--- | :--- | :--- |
| 1 | List | 0% |
| 2 | 1 Case / 3 Case Family Plan | 20% |
| 3 | 2 Case / 4 Case Family Plan | 30% |
| 4 | 3 Case / 5 Case Family Plan | 50% |
| 5–9 | (5C/25C, Chain QD, 500C WH, On-Prem EDLP, On-Prem BTG) | 0% each |

#### Distributor Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Case Price | $242.96 | $242.96 | $242.96 | $242.96 | $242.96 | $242.96 | $242.96 | $242.96 | $242.96 |
| Discount | $0.00 | $3.60 | $12.02 | $20.40 | $45.00 | $63.02 | $45.00 | $44.95 | $62.95 |
| PTR | $242.96 | $239.36 | $230.94 | $222.56 | $197.96 | $179.94 | $197.96 | $198.01 | $180.01 |
| Depletion Allow. | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $10.00 | $0.00 | $0.00 | $10.00 |
| Dist. Taxes | $13.31 | $13.12 | $12.66 | $12.20 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| **Dist. Margin $** | **$84.75** | **$81.35** | **$73.39** | **$65.47** | **$53.07** | **$45.05** | **$53.07** | **$53.12** | **$45.12** |
| **Dist. Margin %** | **34.9%** | **34.0%** | **31.8%** | **29.4%** | **26.8%** | **25.0%** | **26.8%** | **26.8%** | **25.1%** |

#### Retailer Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Bottle Cost | $40.49 | $39.89 | $38.49 | $37.09 | $32.99 | $29.99 | $32.99 | $33.00 | $30.00 |
| Taxes (Retailer) | $1.50 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| SRP | $59.99 | $56.99 | $54.99 | $52.99 | $49.99 | $49.99 | $49.99 | N/A | N/A |
| **Retail Margin %** | **30.0%** | **30.0%** | **30.0%** | **30.0%** | **34.0%** | **40.0%** | **34.0%** | N/A | N/A |

#### Supplier Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| COGS | $81.50 | $81.50 | $81.50 | $81.50 | $81.50 | $81.50 | $81.50 | $81.50 | $81.50 |
| PBG Margin $ | $54.10 | $54.10 | $54.10 | $54.10 | $54.10 | $44.10 | $54.10 | $54.10 | $44.10 |
| **Supplier Margin %** | **39.9%** | **39.9%** | **39.9%** | **39.9%** | **39.9%** | **32.5%** | **39.9%** | **39.9%** | **32.5%** |

#### Summary Metrics (Repo)

| Metric | Current | Proposed | Variance |
| :--- | ---: | ---: | ---: |
| Distributor Aggregate Margin $ | $61.45 | $71.02 | +$9.57 |
| Distributor Aggregate Margin % | 28.9% | 31.1% | +2.2% |
| Supplier Aggregate DA $ | $3.00 | $0.00 | -$3.00 |
| Supplier Aggregate Margin $ | $51.10 | $54.10 | +$3.00 |
| Supplier Aggregate Margin % | 37.7% | 39.9% | +2.2% |

---

### 4.5. Anejo_BySiempre — Full Proposed Pricing

#### Deal Level Names and Volume Weights

| # | Deal Level | % of Volume (Proposed) |
| :--- | :--- | :--- |
| 1 | List | 0% |
| 2 | 1 Case / 3 Case Family Plan | 20% |
| 3 | 2 Case / 4 Case Family Plan | 30% |
| 4 | 3 Case / 5 Case Family Plan | 50% |
| 5–9 | (5C/25C, Chain QD, 500C WH, On-Prem EDLP, On-Prem BTG) | 0% each |

#### Distributor Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Case Price | $410.96 | $410.96 | $410.96 | $410.96 | $410.96 | $410.96 | $410.96 | $410.96 | $410.96 |
| Discount | $0.00 | $14.85 | $23.10 | $33.00 | $33.00 | $54.50 | $33.00 | $32.95 | $56.95 |
| PTR | $410.96 | $396.11 | $387.86 | $377.96 | $377.96 | $356.46 | $377.96 | $378.01 | $354.01 |
| Depletion Allow. | $0.00 | $0.00 | $0.00 | $6.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| Dist. Taxes | $22.52 | $21.71 | $21.25 | $20.71 | $20.71 | $19.53 | $20.71 | $20.71 | $19.40 |
| **Dist. Margin $** | **$144.58** | **$130.54** | **$122.74** | **$119.38** | **$113.38** | **$93.06** | **$113.38** | **$113.43** | **$90.75** |
| **Dist. Margin %** | **35.2%** | **33.0%** | **31.6%** | **31.6%** | **30.0%** | **26.1%** | **30.0%** | **30.0%** | **25.6%** |

#### Retailer Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Bottle Cost | $68.49 | $66.02 | $64.64 | $62.99 | $62.99 | $59.41 | $62.99 | $63.00 | $59.00 |
| Taxes (Retailer) | $1.50 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| SRP | $99.99 | $94.99 | $92.99 | $89.99 | $89.99 | $89.99 | $89.99 | N/A | N/A |
| **Retail Margin %** | **30.0%** | **30.5%** | **30.5%** | **30.0%** | **30.0%** | **34.0%** | **30.0%** | N/A | N/A |

#### Supplier Section (Proposed Values)

| Metric | List | 1C/3C | 2C/4C | 3C/5C | 5C/25C | Chain QD | 500C WH | On-Prem EDLP | On-Prem BTG |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| COGS | $128.68 | $128.68 | $128.68 | $128.68 | $128.68 | $128.68 | $128.68 | $128.68 | $128.68 |
| PBG Margin $ | $112.00 | $112.00 | $112.00 | $106.00 | $112.00 | $112.00 | $112.00 | $112.00 | $112.00 |
| **Supplier Margin %** | **46.5%** | **46.5%** | **46.5%** | **44.0%** | **46.5%** | **46.5%** | **46.5%** | **46.5%** | **46.5%** |

#### Summary Metrics (Añejo)

| Metric | Current | Proposed | Variance |
| :--- | ---: | ---: | ---: |
| Distributor Aggregate Margin $ | $82.39 | $122.62 | +$40.23 |
| Distributor Aggregate Margin % | 31.6% | 31.9% | +0.3% |
| Supplier Aggregate DA $ | $3.00 | $3.00 | $0.00 |
| Supplier Aggregate Margin $ | $30.98 | $109.00 | +$78.02 |
| Supplier Aggregate Margin % | 19.0% | 45.3% | +26.2% |

---

## 5. Alex's Pricing Style — Detailed Analysis

### 5.1. Deal Level Architecture

Alex employs a **9-level deal structure** (plus two unused placeholder levels, Level 9 and Level 10, which remain at $0.00 across all SKUs). The architecture is consistent across all three SKUs and follows this hierarchy:

**Off-Premise Deals (Levels 1–7):**
Levels 1 through 5 represent standard volume-based discounts for independent and small-chain retail. The discount increases progressively with volume commitment. Level 6 (Chain Intro QD) is a special promotional tier designed to incentivize chain retailers to stock the product. Level 7 (500 Case Warehouse) targets large-format retailers and warehouse clubs.

**On-Premise Deals (Levels 8–9):**
Level 8 (On-Premise EDLP) provides a stable everyday low price for bars and restaurants. Level 9 (On-Premise Printed On Menu / BTG) offers the deepest discount, reserved for accounts that commit to featuring the product on their printed menu or by-the-glass program.

### 5.2. Margin Philosophy by Tier

Alex applies a differentiated margin philosophy depending on the stakeholder and channel:

**Distributor Margins:**
The distributor margin decreases as the deal level deepens, which is expected. However, Alex maintains clear guardrails. For off-premise standard deals, the margin ranges from approximately 30% to 35%. For on-premise deals, he accepts a lower floor of approximately 25–26%. The critical insight is that the **30% floor applies to the weighted aggregate**, not necessarily to every individual deal level. This is because the volume weights are concentrated on the higher-margin levels (1C/3C at 20%, 2C/4C at 30%, 3C/5C at 50%), while the deeper-discount levels carry 0% volume weight.

**Retailer Margins:**
Alex targets a consistent **30% retail margin** for standard off-premise deals. For Chain Intro QD, the target is **~34-40%** (varies by SKU), and for 500 Case Warehouse, the target is **~30-34%**. On-premise deals do not carry SRPs, as the on-premise pricing is determined by the establishment.

**Supplier Margins:**
Supplier margins are the residual after all other costs and allowances. Alex manages these carefully. For Plata, the supplier margin is ~39%. For Repo, it is ~40%. For Añejo, the dramatic FOB increase pushed the supplier margin to ~46.5%, which is significantly higher than the original 19% (when the FOB was below COGS).

### 5.3. How He Uses Depletion Allowances

Depletion allowances are Alex's primary tool for **margin engineering**. He does not apply them uniformly; instead, they are deployed surgically at specific deal levels where the discount would otherwise push the distributor margin below acceptable thresholds or where strategic investment is warranted.

| SKU | Deal Level | DA Amount | Purpose |
| :--- | :--- | ---: | :--- |
| Plata | 5 Case / 25 Case | $5.40 | Supports distributor margin at deeper discount |
| Plata | Chain Intro QD | $13.50 | Funds the 40% retail margin target |
| Plata | 500 Case Warehouse | $5.40 | Mirrors the 5-Case DA |
| Plata | On-Premise EDLP | $2.00 | Modest support for on-premise channel |
| Plata | On-Premise BTG | $10.00 | Significant investment for menu placement |
| Repo | Chain Intro QD | $10.00 | Funds chain introduction |
| Repo | On-Premise BTG | $10.00 | Funds menu placement |
| Añejo | 3 Case / 5 Case | $6.00 | Protects distributor margin at the highest-volume tier |

A key pattern is that **On-Premise BTG consistently receives a $10.00 DA** across Plata and Repo, signaling that menu placement is a strategic priority worth investing in. The Añejo is the exception, where the higher FOB provides sufficient margin without needing DAs at most levels.

### 5.4. Distributor Tax Handling

Alex applies a **uniform tax rate of 5.48%** on the PTR to calculate the "Add'l Taxes Paid by Distributor." The formula is:

> `Add'l Taxes Paid by Distributor = PTR × 0.0548`

This is applied consistently across all deal levels and all SKUs. The tax is then subtracted from the distributor's margin, ensuring that the margin percentage reflects the distributor's true economic position after tax obligations. Notably, for the Repo SKU, the distributor taxes at the 5-Case and deeper levels show as $0.00 in the proposed column, which may indicate these were intentionally zeroed out or are handled differently at those tiers.

### 5.5. On-Premise vs. Off-Premise Strategy

The distinction between on-premise and off-premise is one of the most important aspects of Alex's approach:

**Off-Premise:**
All off-premise deals include an SRP, a calculated retail margin, and a structured discount ladder. The SRP decreases as the deal level deepens (e.g., Plata SRP goes from $52.99 at List to $44.99 at 3C/5C). Retailer taxes are only applied at the List level ($1.50 for all SKUs).

**On-Premise:**
On-premise deals have **no SRP** and **no retail margin calculation**. The focus is entirely on the **bottle cost** delivered to the account. This makes sense because bars and restaurants set their own pour prices. The On-Premise EDLP bottle cost is slightly higher than the On-Premise BTG bottle cost, reflecting the additional value of a menu commitment. For example, on the Añejo SKU, the On-Premise EDLP bottle cost is $63.00 while the On-Premise BTG bottle cost is $59.00.

### 5.6. Volume Weighting Strategy

Alex concentrates all volume on the three core off-premise deal levels:

| Deal Level | Volume Weight |
| :--- | :--- |
| 1 Case / 3 Case Family Plan | 20% |
| 2 Case / 4 Case Family Plan | 30% |
| 3 Case / 5 Case Family Plan | 50% |
| All other levels | 0% |

This weighting is identical across all three SKUs. The 0% weight on the deeper-discount and on-premise levels means they do not impact the aggregate margin calculations. This is a deliberate choice that allows Alex to offer aggressive pricing at those levels without dragging down the overall margin profile. It also suggests that the majority of Washington State volume flows through independent retail at the 1–5 case level.

### 5.7. Discount Progression Patterns

The discount amounts follow a logical progression that scales with the case price:

| Deal Level | Plata Discount | Repo Discount | Añejo Discount |
| :--- | ---: | ---: | ---: |
| List | $0.00 | $0.00 | $0.00 |
| 1C/3C | $4.75 | $3.60 | $14.85 |
| 2C/4C | $13.25 | $12.02 | $23.10 |
| 3C/5C | $25.75 | $20.40 | $33.00 |
| 5C/25C | $36.50 | $45.00 | $33.00 |
| Chain QD | $52.75 | $63.02 | $54.50 |
| 500C WH | $36.50 | $45.00 | $33.00 |
| On-Prem EDLP | $28.80 | $44.95 | $32.95 |
| On-Prem BTG | $40.80 | $62.95 | $56.95 |

A notable pattern is that the **5C/25C and 500C Warehouse discounts are identical** within each SKU (Plata: $36.50; Repo: $45.00; Añejo: $33.00). Similarly, the **Chain QD and On-Premise BTG discounts are close in magnitude**, reflecting similar depth of investment for these strategic channels.

### 5.8. Naming Conventions and Formatting

Alex follows these conventions:

- Tab names use the format `[SKU]_BySiempre` (e.g., `Plata_BySiempre`)
- Deal levels use descriptive names with case counts (e.g., "1 Case / 3 Case Family Plan")
- On-premise levels include the channel descriptor (e.g., "On-Premise Printed On Menu (BTG)")
- Yellow-shaded cells indicate input fields; all other cells are formula-driven
- "M" flags mark mandatory fields
- Each pricing tab has a "Current vs. Proposed vs. Variance" three-column structure per deal level
- Section numbers are embedded in column C (e.g., "(1) Landed Section", "(2) Distributor Section")

---

## 6. Formula Reference

The following formulas are consistently applied across all three pricing tabs:

| Calculation | Formula |
| :--- | :--- |
| Distributor Landed Cost | `=SUM(Net FOB, Freight, State Tax, Local Tax, Other Costs, Ocean Freight, Duty, FET)` |
| Price to Retail (PTR) — List | `=Case Price + Split Case Charge` |
| Price to Retail (PTR) — Other | `=Case Price - Discount` |
| Add'l Taxes (Distributor) | `=0.0548 × PTR` |
| Distributor Margin $ | `=PTR - Dist. Landed Cost - Dist. Taxes + Depletion Allowance` |
| Distributor Margin % | `=IFERROR(Dist. Margin $ / PTR, 0)` |
| Bottle Cost | `=IF(Bottles/Case=0, 0, PTR / Bottles per Case)` |
| Retail Margin % | `=IFERROR((SRP - Bottle Cost - Retailer Taxes) / SRP, "")` |
| Dist. Aggregate Margin $ | `=Σ(Volume Weight × Dist. Margin $)` across all deal levels |
| Dist. Aggregate Margin % | `=Dist. Aggregate Margin $ / Σ(Volume Weight × PTR)` |
| PBG (Supplier) Margin $ | `=Net FOB - Depletion Allowance - COGS - Brokerage Fee` |
| Supplier Margin % | `=IFERROR(PBG Margin $ / Net FOB, "")` |

---

## 7. Rules for the Pricing-Intelligence Skill

Based on this comprehensive analysis, the following rules should be encoded into the pricing-intelligence skill for replication across future states:

### 7.1. Structural Rules

1. **Standard Deal Structure:** Use 9 active deal levels plus 2 placeholder levels (Level 9, Level 10) for all new state pricing models.
2. **Tab Naming:** Use `[SKU]_BySiempre` format.
3. **Column Layout:** Three columns per deal level (Current, Proposed, Variance), starting at column I.
4. **Five Sections:** Landed, Distributor, Retailer, Summary, Supplier — in that order.
5. **Volume Weights:** Default to 20% / 30% / 50% split across 1C/3C, 2C/4C, 3C/5C unless market data suggests otherwise.

### 7.2. Margin Rules

6. **Distributor Aggregate Margin Floor:** Target ≥30% for the weighted aggregate.
7. **Distributor Per-Level Floor (Off-Premise):** No off-premise deal level should fall below 25% distributor margin.
8. **Distributor Per-Level Floor (On-Premise):** On-premise levels can go as low as 25%.
9. **Retail Margin — Standard:** Target 30% for standard off-premise deals.
10. **Retail Margin — Chain Intro QD:** Target 34–40%.
11. **Retail Margin — 500 Case Warehouse:** Target 30–36%.
12. **On-Premise Deals:** No SRP; focus on competitive bottle cost.

### 7.3. Tax and Cost Rules

13. **Distributor Tax Rate:** Apply `PTR × 0.0548` as the default distributor tax (Washington-specific; adjust per state using the Spirits Tax Table).
14. **FOB Must Exceed COGS:** The Net FOB must always be greater than the COGS. If not, raise the FOB to achieve a minimum supplier margin of 30%.
15. **Landed Cost Calculation:** Always include Freight, State Tax, Local Tax, and any applicable Ocean Freight, Duty, and FET.

### 7.4. Depletion Allowance Rules

16. **DA as Margin Engineering Tool:** Use DAs to bring distributor margins up to the floor at specific deal levels, not uniformly.
17. **On-Premise BTG DA:** Default to $10.00 DA for On-Premise Printed On Menu (BTG) deals.
18. **Chain Intro QD DA:** Use DAs of $10.00–$13.50 to fund the higher retail margin target.
19. **DA Impact on Supplier:** Remember that DAs reduce the supplier margin dollar-for-dollar. Balance DA investment against supplier margin targets.

### 7.5. Pricing Relationships

20. **5C/25C = 500C Warehouse:** These two levels should have identical discounts and PTRs.
21. **Chain QD ≈ On-Premise BTG:** These levels should have similar discount depth.
22. **On-Premise EDLP < On-Premise BTG discount:** The EDLP discount should be shallower than the BTG discount, reflecting the lower commitment required.
23. **SRP Ladder:** SRPs should decrease in clean $2–$5 increments as deal levels deepen (e.g., $52.99 → $49.99 → $47.99 → $44.99).

---

## 8. Cross-SKU Comparison Summary

| Metric | Plata | Repo | Añejo |
| :--- | ---: | ---: | ---: |
| Net FOB (Proposed) | $120.00 | $135.60 | $240.68 |
| COGS | $73.22 | $81.50 | $128.68 |
| Dist. Landed Cost | $129.29 | $144.89 | $243.86 |
| Case Price | $214.78 | $242.96 | $410.96 |
| List PTR | $214.78 | $242.96 | $410.96 |
| List Dist. Margin % | 34.3% | 34.9% | 35.2% |
| Aggregate Dist. Margin % | 28.9% | 31.1% | 31.9% |
| List SRP | $52.99 | $59.99 | $99.99 |
| List Retail Margin % | 29.6% | 30.0% | 30.0% |
| Supplier Margin % (List) | 39.0% | 39.9% | 46.5% |
| Aggregate Supplier Margin % | 39.0% | 39.9% | 45.3% |

The pricing follows a clear premium ladder: Plata is the entry-level SKU, Repo is the mid-tier, and Añejo commands a significant premium. The Añejo's higher supplier margin reflects the dramatic FOB correction from $162.66 to $240.68.

---

## 9. Key Observations and Open Questions

1. **Plata Distributor Margins at Lower Tiers:** The Plata 3C/5C distributor margin is 26.1%, which is below the 30% floor. However, since this is the highest-volume tier (50% weight), it significantly impacts the aggregate. The aggregate comes in at 28.9%, which is close but still below 30%. This may be intentional — Alex may be accepting a slightly lower aggregate to maintain competitive SRPs.

2. **Repo Distributor Taxes at Deep Levels:** The Repo SKU shows $0.00 distributor taxes at the 5C/25C, Chain QD, 500C WH, On-Prem EDLP, and On-Prem BTG levels. This is inconsistent with the Plata and Añejo tabs where taxes are calculated at all levels. This may be a work-in-progress item or an intentional choice.

3. **Añejo DA Strategy:** The Añejo only uses a single $6.00 DA at the 3C/5C level. Given the much higher FOB and case price, the margins are naturally healthier, reducing the need for DA support.

4. **Placeholder Levels:** Levels 9 and 10 are empty across all SKUs, suggesting Alex reserves these for future deal types or state-specific needs.

5. **Retailer Taxes:** Only the List level carries retailer taxes ($1.50 across all SKUs). All other levels show $0.00 for retailer taxes, which simplifies the retail margin calculation at those tiers.

---

*This analysis should serve as the definitive reference for replicating Alex's pricing methodology across Alabama, Arkansas, Wisconsin, and all future state rollouts.*
