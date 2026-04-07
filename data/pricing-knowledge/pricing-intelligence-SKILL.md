---
name: pricing-intelligence
description: "Pricing calculations, validation, state setup, and SKU reference for Siempre Spirits across 35 markets. Use for ANY request involving pricing, margins, FOBs, SRPs, SKU data, state excise taxes, the Virginia ABC formula, distributor pricing proposals, new market setup, or pricing comparisons. Triggers: 'what's our margin on', 'price tree for', 'FOB', 'SRP', 'pricing for [state]', 'new state setup', 'Virginia ABC', 'validate pricing', 'compare pricing across', 'what do we charge', 'pricing proposal', 'state pricing', 'margin floor'."
---

# Pricing Intelligence — Siempre Spirits

## Bootstrap

The pricing engine ships with this skill. On first invocation, copy it to the working directory:

```bash
SKILL_DIR="$(dirname "$(find /sessions -path '*pricing-intelligence/pricing_engine.py' 2>/dev/null | head -1)")"
cp "$SKILL_DIR/pricing_engine.py" ./pricing_engine.py 2>/dev/null
python3 pricing_engine.py skus
```

If the skill directory isn't found (e.g., in Claude Code), extract the engine from the embedded source at the bottom of this file.

## Operations Reference

| Operation | Command | Use Case |
|-----------|---------|----------|
| **Calculate** | `python3 pricing_engine.py calculate <sku> --fob <price> --state <ST>` | Full price tree from FOB to SRP |
| **Validate** | `python3 pricing_engine.py validate --fob <price> --cogs <cost> --sku <sku> --srp <price>` | Check margin floor, SRP range, rules |
| **Virginia ABC** | `python3 pricing_engine.py virginia <fob>` | VA control state formula |
| **SKU Info** | `python3 pricing_engine.py tree <sku>` | SKU details and tier |
| **New State** | `python3 pricing_engine.py new-state <ST> --type <control|three-tier>` | Generate pricing template for new market |
| **Compare** | `python3 pricing_engine.py compare <sku> --states <ST1,ST2,...>` | Side-by-side pricing across states |
| **Lookup** | `python3 pricing_engine.py lookup <query>` | Quick reference (SKU, state, or tier) |
| **List SKUs** | `python3 pricing_engine.py skus` | All 9 SKUs with targets |
| **List States** | `python3 pricing_engine.py states` | All 35 markets with intel |

Add `--json` for machine-readable output.

### SKU Aliases

Use short names: `plata`, `repo`, `anejo`, `supremo`, `rebel`, `vivo`, `muerto`, `ceramico`, `chisme`

## Pricing Philosophy: "Margin = Oxygen"

These rules are NON-NEGOTIABLE. Flag violations prominently.

1. **30% margin floor** — HARD STOP. No exceptions.
2. **No desperation discounting** — never discount to hit short-term volume at the expense of margin.
3. **90-day payback** — every pricing/promo investment must show payback within 90 days.
4. **Floor pricing** — establish and defend price floors in every market.
5. **Trade ROI** — every $1 must return >= $1.50 gross profit within 120 days.
6. **FOB changes** — 60-day lead time, team-approved, submit to pricing@prestigebevgroup.com.

## SRP Targets (USD)

| SKU | Target |
|-----|--------|
| Plata | $45–50 |
| Reposado | $55 |
| Anejo | $90–95 |
| Supremo | $69–80 |
| Rebel Cask | $85–99 |
| Vivo | $129 |
| Muerto | $130 |
| Ceramico | $199.99 |
| Chisme | ~$27 USD / ~$40 CAD |

## Cross-Referencing Data Sources

For live depletion, inventory, and market performance data, use the **siempre-sales-intelligence** skill. It handles the full data pipeline across all 53 markets.

| Source | What It Provides | Access | Skill |
|--------|-----------------|--------|-------|
| **Zoho Books** | Invoice actuals by distributor ("what we billed") | Maton gateway (`zoho-books`) | `siempre-sales-intelligence` Section 5 |
| **Prestige NWOW** | FOB actuals, billbacks, brand dev spend, DA ("what they charged") | Gmail attachment → parsed JSON | `siempre-sales-intelligence` Section 4 |
| **VIP iDig** | US depletion cases by state/SKU, brand placements, inventory days, reorder rates (28 states, excludes CA) | Browser automation → `reports.vtinfo.com` | `siempre-sales-intelligence` Section 1 |
| **Winebow DiverPort** | CA depletions (NoCa/SoCa split), inventory, accounts sold, regional validation data | Browser automation → `bi.winebow.com` | `siempre-sales-intelligence` Section 2 |
| **Provincial Portals** | Canadian province + OK depletions, inventory (ON/MB/SK/BC/AB/OK across 7 portals) | Browser automation → individual portals | `siempre-sales-intelligence` Section 3 |
| **Wine-Searcher** | Competitor SRP benchmarking | Web scraping (planned) | — |

### How Pricing Uses Sales-Intel Data

When pricing-intelligence needs real-world sell-through data to validate pricing decisions, it pulls from siempre-sales-intelligence outputs:

| Pricing Question | Sales-Intel Data Needed | Source |
|-----------------|------------------------|--------|
| "What's our margin on Plata in Georgia?" | Actual depletion cases + Prestige revenue per case | VIP iDig (cases) + Prestige NWOW (revenue) |
| "Is our FOB too high in Minnesota?" | Depletion velocity, reorder rate, ship-depl gap | VIP iDig + Prestige NWOW |
| "Should we adjust SRP in California?" | CA depletions by SKU, accounts sold, inventory levels | DiverPort |
| "How's Ontario performing at current pricing?" | Provincial depletion cases, revenue in CAD | Analyticsmart (Provincial) |
| "Are we over-spending on DA in Florida?" | Spend per case = (Brand Dev + DA) / cases depleted | Prestige NWOW + VIP iDig |
| "Validate pricing for a new state" | Comparable market performance data, existing state margins | VIP iDig + Zoho Books |

### Data File Locations (from siempre-sales-intelligence)

| Data | Path | Format |
|------|------|--------|
| US Depletions | `./data/vipidig/{YYYY-MM}/` | Excel exports (18+ reports) |
| CA/Regional | `./data/diveport/{YYYY-MM}/` | PDFs, JSON/CSV |
| Canadian/OK | `./data/provincial/{YYYY-MM}/` | Excel/CSV per portal |
| Prestige Shipments | `./data/prestige/{YYYY-MM}/prestige_parsed.json` | JSON |
| Zoho Revenue | `./data/zoho/{YYYY-MM}/zoho_revenue.json` | JSON |
| Unified Merge | `./output/{YYYY-MM}/all_markets_summary_{YYYY-MM}.csv` | CSV (one row per market-SKU-month) |
| Market Health Briefing | `./output/Siempre_Market_Briefing_{YYYY-MM}.md` | Markdown |

## Output Rules

- **Quick answers** (single calculation, lookup): Display results directly in chat.
- **Reports** (multi-SKU comparisons, state templates, validation reports): Generate a formatted file and save to the workspace folder.
- **Spreadsheets**: Use `--json` flag, parse output, write to xlsx/csv.

## Key Contacts

- **FOB changes**: pricing@prestigebevgroup.com (60-day lead)
- **Monica Sanita** (COO): Finance, vendor forms, control state lead
- **Nick Henry**: Market-level pricing coordination
- **Rick Harper**: Canadian operations data (provincial portals)

## Reference Files

| File | Contents |
|------|----------|
| `references/data-dictionary.md` | Master Pricing Model schema |
| `references/pricing-philosophy.md` | Core pricing doctrine |
| `references/pricing-philosophy-full.md` | Extended pricing philosophy with examples |
| `references/alex-pricing-style.md` | How Alex thinks about pricing decisions |
| `references/sku-reference.md` | All SKUs with locked SRPs, COGS, production details |
| `references/state-setup-checklist.md` | Step-by-step new state setup process |
| `references/validation-rules.md` | Complete validation check list |
| `references/product-line.md` | Full product line details |
| `references/market-targets.md` | Market tier scoring and targets |
| `references/distributor-mapping.md` | Zoho customer → state mapping |
