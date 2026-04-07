#!/usr/bin/env python3
"""
Siempre Spirits — Pricing Intelligence Engine

CLI tool for pricing calculations, validation, and state setup.
Embeds all SKU data, validation rules, state intel, and pricing formulas.

Usage:
    python3 pricing_engine.py calculate <sku> --fob <price> [--state <ST>] [--freight <cost>] [--tax <cost>]
    python3 pricing_engine.py validate --fob <price> --cogs <cost> [--sku <sku>] [--srp <price>]
    python3 pricing_engine.py virginia <fob>
    python3 pricing_engine.py tree <sku>
    python3 pricing_engine.py new-state <state> [--type control|three-tier] [--distributor <name>]
    python3 pricing_engine.py compare <sku> --states <ST1,ST2,...>
    python3 pricing_engine.py lookup <query>
    python3 pricing_engine.py skus
    python3 pricing_engine.py states

Add --json for machine-readable output.
"""

import argparse
import json
import math
import sys
from datetime import datetime

# ─────────────────────────────────────────────────
# SKU REFERENCE DATA
# ─────────────────────────────────────────────────

SKUS = {
    "SIEMP-PLT-75": {
        "name": "Siempre Plata",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 45.00, "srp_max": 50.00, "srp_target": 49.99,
        "tier": "Ultra Premium", "category": "Core",
        "nom": "1414", "brand": "Siempre",
    },
    "SIEMP-REP-75": {
        "name": "Siempre Reposado",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 55.00, "srp_max": 55.00, "srp_target": 54.99,
        "tier": "Ultra Premium", "category": "Core",
        "nom": "1414", "brand": "Siempre",
    },
    "SIEMP-ANE-75": {
        "name": "Siempre Añejo",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 90.00, "srp_max": 95.00, "srp_target": 89.99,
        "tier": "Ultra Premium", "category": "Core",
        "nom": "1438", "brand": "Siempre",
    },
    "SIEMP-SUP-75": {
        "name": "Supremo Tahona",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 69.00, "srp_max": 80.00, "srp_target": 79.99,
        "tier": "Ultra Premium", "category": "Ultra",
        "nom": "1137", "brand": "Siempre",
    },
    "SIEMP-REB-75": {
        "name": "Siempre Rebel Cask",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 85.00, "srp_max": 99.00, "srp_target": 84.99,
        "tier": "Ultra Premium", "category": "Ultra Premium",
        "nom": "1414", "brand": "Siempre",
    },
    "SIEMP-VIV-75": {
        "name": "Exclusivo Vivo",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 129.00, "srp_max": 129.00, "srp_target": 129.00,
        "tier": "Prestige", "category": "LTO",
        "nom": "1414", "brand": "Siempre",
    },
    "SIEMP-MUE-75": {
        "name": "Exclusivo Muerto",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 130.00, "srp_max": 130.00, "srp_target": 139.99,
        "tier": "Prestige", "category": "LTO",
        "nom": "1414", "brand": "Siempre",
    },
    "SIEMP-CER-75": {
        "name": "Siempre Ceramico",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 199.99, "srp_max": 199.99, "srp_target": 199.99,
        "tier": "Prestige Plus", "category": "Prestige Plus",
        "nom": "1414", "brand": "Siempre",
    },
    "CHISM-BLA-75": {
        "name": "Chismé Blanco",
        "size_ml": 750, "proof": 80, "case_pack": 6,
        "srp_min": 26.99, "srp_max": 27.99, "srp_target": 26.99,
        "tier": "Value", "category": "Value",
        "nom": "1414", "brand": "Chismé",
        "srp_cad": 40.00,
    },
}

# Short aliases for convenience
SKU_ALIASES = {
    "plata": "SIEMP-PLT-75", "plt": "SIEMP-PLT-75", "blanco": "SIEMP-PLT-75",
    "reposado": "SIEMP-REP-75", "repo": "SIEMP-REP-75", "rep": "SIEMP-REP-75",
    "anejo": "SIEMP-ANE-75", "añejo": "SIEMP-ANE-75", "ane": "SIEMP-ANE-75",
    "supremo": "SIEMP-SUP-75", "tahona": "SIEMP-SUP-75", "sup": "SIEMP-SUP-75",
    "rebel": "SIEMP-REB-75", "rebel cask": "SIEMP-REB-75", "reb": "SIEMP-REB-75",
    "vivo": "SIEMP-VIV-75", "viv": "SIEMP-VIV-75",
    "muerto": "SIEMP-MUE-75", "mue": "SIEMP-MUE-75",
    "ceramico": "SIEMP-CER-75", "cer": "SIEMP-CER-75",
    "chisme": "CHISM-BLA-75", "chismé": "CHISM-BLA-75", "chismeblanco": "CHISM-BLA-75",
}

# ─────────────────────────────────────────────────
# PRICING TIERS
# ─────────────────────────────────────────────────

TIERS = [
    {"name": "Prestige Plus", "min": 200.00, "max": None},
    {"name": "Prestige",      "min": 100.00, "max": 199.99},
    {"name": "Ultra Premium",  "min": 45.00,  "max": 99.99},
    {"name": "Value",          "min": None,   "max": 44.99},
]

# ─────────────────────────────────────────────────
# VALIDATION RULES
# ─────────────────────────────────────────────────

RULES = {
    "margin_floor": 0.30,
    "fob_lead_days": 60,
    "wa_variance_threshold": 0.05,
    "discount_max_weeks": 8,
    "trade_roi_min": 1.50,
    "payback_days": 90,
}

# ─────────────────────────────────────────────────
# STATE INTELLIGENCE
# ─────────────────────────────────────────────────

STATES = {
    "AL": {"name": "Alabama", "type": "three-tier", "distributor": "United Distributors",
           "excise_per_gal": 0.00, "notes": "Plata SRP $39.99. Vendor form in progress."},
    "AZ": {"name": "Arizona", "type": "three-tier", "distributor": "Maverick/Johnson Brothers",
           "excise_per_gal": 3.00, "notes": ""},
    "CA": {"name": "California", "type": "three-tier", "distributor": "Winebow",
           "excise_per_gal": 3.30, "notes": "Complex discount structures. Free goods issues noted."},
    "CO": {"name": "Colorado", "type": "three-tier", "distributor": "Maverick",
           "excise_per_gal": 2.28, "notes": "Transitioning from RNDC. 209 cases / 25 accounts historically."},
    "CT": {"name": "Connecticut", "type": "three-tier", "distributor": "",
           "excise_per_gal": 5.40, "notes": ""},
    "FL": {"name": "Florida", "type": "three-tier", "distributor": "Maverick",
           "excise_per_gal": 6.50, "notes": "Unblocked Feb 27. Transition effective March 15."},
    "GA": {"name": "Georgia", "type": "three-tier", "distributor": "",
           "excise_per_gal": 3.79, "notes": "Price fix needed. Flagged for correction March 1, 2026."},
    "IL": {"name": "Illinois", "type": "three-tier", "distributor": "",
           "excise_per_gal": 8.55, "notes": ""},
    "KY": {"name": "Kentucky", "type": "three-tier", "distributor": "",
           "excise_per_gal": 1.92, "notes": ""},
    "LA": {"name": "Louisiana", "type": "three-tier", "distributor": "",
           "excise_per_gal": 2.50, "notes": ""},
    "MA": {"name": "Massachusetts", "type": "three-tier", "distributor": "",
           "excise_per_gal": 4.05, "notes": ""},
    "MD": {"name": "Maryland", "type": "three-tier", "distributor": "",
           "excise_per_gal": 1.50, "notes": ""},
    "MI": {"name": "Michigan", "type": "control", "distributor": "",
           "excise_per_gal": 0.00, "notes": "Barrel opportunities identified."},
    "MN": {"name": "Minnesota", "type": "three-tier", "distributor": "",
           "excise_per_gal": 5.03, "notes": ""},
    "MO": {"name": "Missouri", "type": "three-tier", "distributor": "",
           "excise_per_gal": 2.00, "notes": ""},
    "NJ": {"name": "New Jersey", "type": "three-tier", "distributor": "",
           "excise_per_gal": 5.50, "notes": ""},
    "NV": {"name": "Nevada", "type": "three-tier", "distributor": "",
           "excise_per_gal": 3.60, "notes": ""},
    "NY": {"name": "New York", "type": "three-tier", "distributor": "Blueprint Spirits (Union Beer)",
           "excise_per_gal": 6.44, "notes": "40/60 On/Off-premise mix."},
    "OH": {"name": "Ohio", "type": "control", "distributor": "",
           "excise_per_gal": 0.00, "notes": ""},
    "OK": {"name": "Oklahoma", "type": "three-tier", "distributor": "",
           "excise_per_gal": 5.56, "notes": ""},
    "OR": {"name": "Oregon", "type": "control", "distributor": "",
           "excise_per_gal": 0.00, "notes": ""},
    "PA": {"name": "Pennsylvania", "type": "control", "distributor": "",
           "excise_per_gal": 0.00, "notes": ""},
    "SC": {"name": "South Carolina", "type": "three-tier", "distributor": "Curated Wine Group",
           "excise_per_gal": 5.36, "notes": ""},
    "TN": {"name": "Tennessee", "type": "three-tier", "distributor": "",
           "excise_per_gal": 4.40, "notes": ""},
    "TX": {"name": "Texas", "type": "three-tier", "distributor": "Maverick/Johnson Brothers",
           "excise_per_gal": 2.40, "notes": ""},
    "VA": {"name": "Virginia", "type": "control",
           "distributor": "VA ABC", "excise_per_gal": 0.00,
           "abc_markup": 0.69, "excise_pct": 0.20, "case_handling": 2.00,
           "notes": "Control state. ABC formula pricing."},
    "WA": {"name": "Washington", "type": "control", "distributor": "",
           "excise_per_gal": 0.00,
           "notes": "Control state. Pricing fixed Feb 25 (Anejo FOB, Level 7 & 8, Consumer Price)."},
    "WI": {"name": "Wisconsin", "type": "three-tier", "distributor": "",
           "excise_per_gal": 3.25, "notes": ""},
    "WY": {"name": "Wyoming", "type": "three-tier", "distributor": "",
           "excise_per_gal": 0.00,
           "notes": "Pricing submitted Feb 27. Price increase + 6-month DA calendar."},
    # Canadian provinces
    "ON": {"name": "Ontario", "type": "control", "distributor": "LCBO",
           "excise_per_gal": 0.00, "notes": "Provincial liquor board.", "country": "CA"},
    "BC": {"name": "British Columbia", "type": "control", "distributor": "BCLDB",
           "excise_per_gal": 0.00, "notes": "Provincial liquor board.", "country": "CA"},
    "AB": {"name": "Alberta", "type": "three-tier", "distributor": "AGLC",
           "excise_per_gal": 0.00, "notes": "Oilers partnership territory.", "country": "CA"},
    "QC": {"name": "Quebec", "type": "control", "distributor": "SAQ",
           "excise_per_gal": 0.00, "notes": "Provincial liquor board.", "country": "CA"},
    "NS": {"name": "Nova Scotia", "type": "control", "distributor": "NSLC",
           "excise_per_gal": 0.00, "notes": "Provincial liquor board.", "country": "CA"},
    "MB": {"name": "Manitoba", "type": "control", "distributor": "MLCC",
           "excise_per_gal": 0.00, "notes": "Provincial liquor board.", "country": "CA"},
    "SK": {"name": "Saskatchewan", "type": "control", "distributor": "SLGA",
           "excise_per_gal": 0.00, "notes": "Provincial liquor board.", "country": "CA"},
}


# ─────────────────────────────────────────────────
# UTILITY FUNCTIONS
# ─────────────────────────────────────────────────

def fmt(amount):
    """Format as currency."""
    return f"${amount:,.2f}"


def fmt_pct(pct):
    """Format as percentage."""
    return f"{pct * 100:.1f}%"


def resolve_sku(query):
    """Resolve a SKU code or alias to its canonical code."""
    q = query.strip().upper()
    if q in SKUS:
        return q
    q_lower = query.strip().lower()
    if q_lower in SKU_ALIASES:
        return SKU_ALIASES[q_lower]
    # Fuzzy: check if query is substring of any SKU name
    for code, info in SKUS.items():
        if q_lower in info["name"].lower():
            return code
    return None


def excise_per_case(state_code, sku_code):
    """Calculate state excise tax per case for a given SKU in a given state."""
    state = STATES.get(state_code)
    sku = SKUS.get(sku_code)
    if not state or not sku:
        return 0.0
    rate_per_gal = state.get("excise_per_gal", 0.0)
    if rate_per_gal == 0.0:
        return 0.0
    # 750ml * case_pack bottles = total ml; convert to gallons (1 gal = 3785.41 ml)
    total_ml = sku["size_ml"] * sku["case_pack"]
    gallons = total_ml / 3785.41
    return round(rate_per_gal * gallons, 2)


# ─────────────────────────────────────────────────
# PRICING FORMULAS
# ─────────────────────────────────────────────────

def virginia_abc(fob_per_case, case_pack=6):
    """
    Virginia ABC control state pricing formula.
    Returns retail price per BOTTLE.

    Formula: CEILING(((FOB_per_case / case_pack + case_handling_per_bottle) * 1.69) * 1.20, 0.09)
    Where case_handling_per_bottle = $2.00 / case_pack
    """
    fob_per_bottle = fob_per_case / case_pack
    case_handling_per_bottle = 2.00 / case_pack
    subtotal = (fob_per_bottle + case_handling_per_bottle) * 1.69
    with_excise = subtotal * 1.20
    # Round UP to nearest $0.09
    retail = math.ceil(with_excise / 0.09) * 0.09
    return round(retail, 2)


def price_tree(fob, state_tax=0.0, freight=3.00, case_pack=6,
               dist_margin=0.25, retail_margin=0.25):
    """
    Standard three-tier price tree calculation.
    All values per CASE unless noted.

    Returns dict with full breakdown.
    """
    sales_cost = fob + state_tax + freight
    # Distributor sells to retailer at list price (distributor takes their margin)
    list_price = sales_cost / (1.0 - dist_margin)
    net_case_cost = list_price  # before any retailer discounts
    net_bottle_cost = net_case_cost / case_pack
    # Retailer sells to consumer at SRP (retailer takes their margin)
    srp_per_bottle = net_bottle_cost / (1.0 - retail_margin)
    srp_per_bottle = round(srp_per_bottle, 2)

    # Siempre's profit
    profit_per_case = fob - state_tax - freight  # simplified: profit = FOB minus costs
    # More accurate: profit is revenue (FOB) minus COGS, but COGS not always known here
    # So we show the margin on the FOB itself
    margin = (fob - sales_cost + fob) / fob if fob > 0 else 0
    # Actually, Siempre's margin = (FOB - production_cost) / FOB
    # Since we don't always have COGS, show the full tree and let user assess

    return {
        "fob_per_case": round(fob, 2),
        "state_tax_per_case": round(state_tax, 2),
        "freight_per_case": round(freight, 2),
        "sales_cost_per_case": round(sales_cost, 2),
        "dist_margin": dist_margin,
        "list_price_per_case": round(list_price, 2),
        "net_bottle_cost": round(net_bottle_cost, 2),
        "retail_margin": retail_margin,
        "srp_per_bottle": srp_per_bottle,
        "srp_at_25": round(net_bottle_cost / (1 - 0.25), 2),
        "srp_at_28": round(net_bottle_cost / (1 - 0.28), 2),
        "srp_at_30": round(net_bottle_cost / (1 - 0.30), 2),
        "srp_at_35": round(net_bottle_cost / (1 - 0.35), 2),
        "srp_at_37": round(net_bottle_cost / (1 - 0.37), 2),
    }


def validate_pricing(fob, cogs=None, sku_code=None, srp=None):
    """
    Run validation rules against pricing data.
    Returns list of findings (passes and flags).
    """
    findings = []

    # Margin floor check
    if cogs is not None and fob > 0:
        margin = (fob - cogs) / fob
        passes = margin >= RULES["margin_floor"]
        findings.append({
            "rule": "Margin Floor (30%)",
            "status": "PASS" if passes else "FAIL",
            "value": fmt_pct(margin),
            "threshold": fmt_pct(RULES["margin_floor"]),
            "detail": f"FOB {fmt(fob)} - COGS {fmt(cogs)} = {fmt_pct(margin)} margin"
                      + ("" if passes else " *** BELOW 30% FLOOR ***"),
        })

    # SRP target check
    if srp is not None and sku_code:
        sku = SKUS.get(sku_code)
        if sku:
            in_range = sku["srp_min"] <= srp <= sku["srp_max"]
            findings.append({
                "rule": "SRP Target Range",
                "status": "PASS" if in_range else "WARN",
                "value": fmt(srp),
                "threshold": f"{fmt(sku['srp_min'])}–{fmt(sku['srp_max'])}",
                "detail": f"{sku['name']} SRP {fmt(srp)} vs target {fmt(sku['srp_min'])}–{fmt(sku['srp_max'])}"
                          + ("" if in_range else " *** OUTSIDE TARGET RANGE ***"),
            })

    # FOB sanity check (must be positive, reasonable range)
    if fob <= 0:
        findings.append({
            "rule": "FOB Positive",
            "status": "FAIL",
            "value": fmt(fob),
            "threshold": "> $0.00",
            "detail": "FOB must be positive",
        })
    elif fob > 500:
        findings.append({
            "rule": "FOB Sanity",
            "status": "WARN",
            "value": fmt(fob),
            "threshold": "< $500.00",
            "detail": f"FOB {fmt(fob)} unusually high — verify",
        })

    # 90-day payback reminder
    findings.append({
        "rule": "90-Day Payback",
        "status": "INFO",
        "value": f"{RULES['payback_days']} days",
        "threshold": "All pricing adjustments",
        "detail": "Ensure clear path to payback within 90 days. No desperation discounting.",
    })

    # FOB change lead time reminder
    findings.append({
        "rule": "FOB Lead Time",
        "status": "INFO",
        "value": f"{RULES['fob_lead_days']} days",
        "threshold": "Required",
        "detail": "60-day lead for FOB changes. Submit to pricing@prestigebevgroup.com.",
    })

    return findings


# ─────────────────────────────────────────────────
# COMMAND HANDLERS
# ─────────────────────────────────────────────────

def cmd_calculate(args):
    """Calculate full price tree for a SKU."""
    sku_code = resolve_sku(args.sku)
    if not sku_code:
        print(f"ERROR: Unknown SKU '{args.sku}'. Use 'skus' command to list.", file=sys.stderr)
        sys.exit(1)

    sku = SKUS[sku_code]
    state_code = args.state.upper() if args.state else None
    state = STATES.get(state_code) if state_code else None

    fob = args.fob if args.fob else 125.00
    freight = args.freight if args.freight is not None else 3.00
    tax = args.tax if args.tax is not None else (
        excise_per_case(state_code, sku_code) if state_code else 4.81
    )

    # Virginia ABC special case
    if state_code == "VA":
        va_retail = virginia_abc(fob, sku["case_pack"])
        tree = price_tree(fob, tax, freight, sku["case_pack"])
        result = {
            "sku": sku_code,
            "sku_name": sku["name"],
            "state": state_code,
            "state_name": state["name"] if state else "",
            "market_type": "control" if state else "unknown",
            "formula": "Virginia ABC",
            "fob_per_case": fob,
            "case_pack": sku["case_pack"],
            "virginia_abc_retail": va_retail,
            "srp_target_min": sku["srp_min"],
            "srp_target_max": sku["srp_max"],
            "srp_in_range": sku["srp_min"] <= va_retail <= sku["srp_max"],
            "tree": tree,
        }
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"\n{'='*55}")
            print(f"  PRICING: {sku['name']} → Virginia (ABC Control State)")
            print(f"{'='*55}")
            print(f"  FOB/case:              {fmt(fob)}")
            print(f"  Case pack:             {sku['case_pack']}")
            print(f"  FOB/bottle:            {fmt(fob / sku['case_pack'])}")
            print(f"  Case handling:         {fmt(2.00)} ({fmt(2.00 / sku['case_pack'])}/btl)")
            print(f"  ABC Markup:            69%")
            print(f"  Excise Tax:            20%")
            print(f"  ─────────────────────────────────")
            print(f"  VA ABC Retail/bottle:  {fmt(va_retail)}")
            print(f"  SRP Target:            {fmt(sku['srp_min'])}–{fmt(sku['srp_max'])}")
            status = "✓ IN RANGE" if result["srp_in_range"] else "✗ OUT OF RANGE"
            print(f"  Status:                {status}")
            print()
        return

    # Standard three-tier calculation
    tree = price_tree(fob, tax, freight, sku["case_pack"])
    result = {
        "sku": sku_code,
        "sku_name": sku["name"],
        "state": state_code or "N/A",
        "state_name": state["name"] if state else "Generic",
        "market_type": state["type"] if state else "three-tier",
        "formula": "Three-Tier Standard",
        "input": {"fob": fob, "freight": freight, "tax": tax},
        "tree": tree,
        "srp_target_min": sku["srp_min"],
        "srp_target_max": sku["srp_max"],
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        label = f"{sku['name']} → {state['name'] if state else 'Generic Market'}"
        print(f"\n{'='*55}")
        print(f"  PRICE TREE: {label}")
        print(f"{'='*55}")
        print(f"  FOB/case:              {fmt(fob)}")
        print(f"  State excise/case:     {fmt(tax)}")
        print(f"  Freight/case:          {fmt(freight)}")
        print(f"  ─────────────────────────────────")
        print(f"  Sales cost/case:       {fmt(tree['sales_cost_per_case'])}")
        print(f"  Dist margin:           {fmt_pct(tree['dist_margin'])}")
        print(f"  List price/case:       {fmt(tree['list_price_per_case'])}")
        print(f"  Net bottle cost:       {fmt(tree['net_bottle_cost'])}")
        print(f"  ─────────────────────────────────")
        print(f"  SRP @ 25% margin:      {fmt(tree['srp_at_25'])}")
        print(f"  SRP @ 28% margin:      {fmt(tree['srp_at_28'])}")
        print(f"  SRP @ 30% margin:      {fmt(tree['srp_at_30'])}")
        print(f"  SRP @ 35% margin:      {fmt(tree['srp_at_35'])}")
        print(f"  SRP @ 37% margin:      {fmt(tree['srp_at_37'])}")
        print(f"  ─────────────────────────────────")
        print(f"  SRP Target:            {fmt(sku['srp_min'])}–{fmt(sku['srp_max'])}")
        if state_code:
            print(f"  Market type:           {state['type']}")
            if state.get("distributor"):
                print(f"  Distributor:           {state['distributor']}")
            if state.get("notes"):
                print(f"  Intel:                 {state['notes']}")
        print()


def cmd_validate(args):
    """Validate pricing against business rules."""
    sku_code = resolve_sku(args.sku) if args.sku else None
    findings = validate_pricing(
        fob=args.fob,
        cogs=args.cogs,
        sku_code=sku_code,
        srp=args.srp,
    )

    if args.json:
        print(json.dumps({"findings": findings, "sku": sku_code, "fob": args.fob}, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"  PRICING VALIDATION")
        if sku_code:
            print(f"  SKU: {SKUS[sku_code]['name']} ({sku_code})")
        print(f"  FOB: {fmt(args.fob)}" + (f"  COGS: {fmt(args.cogs)}" if args.cogs else ""))
        print(f"{'='*60}")
        for f in findings:
            icon = {"PASS": "✓", "FAIL": "✗", "WARN": "⚠", "INFO": "ℹ"}.get(f["status"], "?")
            print(f"  {icon} [{f['status']}] {f['rule']}")
            print(f"    {f['detail']}")
        print()

        fails = [f for f in findings if f["status"] == "FAIL"]
        warns = [f for f in findings if f["status"] == "WARN"]
        if fails:
            print(f"  *** {len(fails)} FAILURE(S) — pricing does not meet requirements ***")
        elif warns:
            print(f"  {len(warns)} warning(s) — review recommended")
        else:
            print(f"  All checks passed.")
        print()


def cmd_virginia(args):
    """Virginia ABC formula calculator."""
    fob = args.fob
    case_pack = args.case_pack if args.case_pack else 6
    retail = virginia_abc(fob, case_pack)

    result = {
        "formula": "Virginia ABC",
        "fob_per_case": fob,
        "case_pack": case_pack,
        "fob_per_bottle": round(fob / case_pack, 2),
        "case_handling": 2.00,
        "abc_markup": "69%",
        "excise_tax": "20%",
        "rounding": "UP to nearest $0.09",
        "retail_per_bottle": retail,
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"  VIRGINIA ABC PRICING FORMULA")
        print(f"{'='*50}")
        print(f"  FOB/case:            {fmt(fob)}")
        print(f"  Case pack:           {case_pack}")
        print(f"  FOB/bottle:          {fmt(fob / case_pack)}")
        print(f"  + Case handling:     {fmt(2.00)} ({fmt(2.00 / case_pack)}/btl)")
        print(f"  × ABC Markup:        69%")
        print(f"  × Excise Tax:        20%")
        print(f"  → Round UP to $0.09")
        print(f"  ─────────────────────────────")
        print(f"  RETAIL/bottle:       {fmt(retail)}")
        print()
        print(f"  Formula: CEILING(((FOB/btl + handling/btl) × 1.69) × 1.20, $0.09)")
        print()


def cmd_tree(args):
    """Display full SKU info and pricing tier."""
    sku_code = resolve_sku(args.sku)
    if not sku_code:
        print(f"ERROR: Unknown SKU '{args.sku}'. Use 'skus' command to list.", file=sys.stderr)
        sys.exit(1)

    sku = SKUS[sku_code]

    if args.json:
        print(json.dumps({"code": sku_code, **sku}, indent=2))
    else:
        print(f"\n{'='*50}")
        print(f"  SKU: {sku['name']}")
        print(f"{'='*50}")
        print(f"  Code:        {sku_code}")
        print(f"  Brand:       {sku['brand']}")
        print(f"  Size:        {sku['size_ml']}ml")
        print(f"  Proof:       {sku['proof']}")
        print(f"  Case Pack:   {sku['case_pack']}")
        print(f"  NOM:         {sku['nom']}")
        print(f"  Tier:        {sku['tier']}")
        print(f"  Category:    {sku['category']}")
        print(f"  SRP Target:  {fmt(sku['srp_min'])}–{fmt(sku['srp_max'])}")
        if "srp_cad" in sku:
            print(f"  SRP (CAD):   ~${sku['srp_cad']:.2f}")
        print()


def cmd_new_state(args):
    """Generate pricing template for a new state."""
    state_code = args.state.upper()

    # Check if state exists in our intel
    state = STATES.get(state_code, {
        "name": state_code,
        "type": args.type or "three-tier",
        "distributor": args.distributor or "TBD",
        "excise_per_gal": 0.0,
        "notes": "New market — data needed.",
    })

    market_type = args.type or state.get("type", "three-tier")
    distributor = args.distributor or state.get("distributor", "TBD")

    # Core SKUs for new state
    core_skus = ["SIEMP-PLT-75", "SIEMP-REP-75", "SIEMP-ANE-75", "CHISM-BLA-75"]
    if args.include_supremo:
        core_skus.insert(3, "SIEMP-SUP-75")

    rows = []
    for code in core_skus:
        sku = SKUS[code]
        tax = excise_per_case(state_code, code) if state_code in STATES else 0.0
        tree = price_tree(125.00, tax, 3.00, sku["case_pack"])  # Default FOB
        rows.append({
            "sku": code,
            "name": sku["name"],
            "fob": 125.00,
            "tax": tax,
            "freight": 3.00,
            "sales_cost": tree["sales_cost_per_case"],
            "srp_30": tree["srp_at_30"],
            "srp_target": f"{fmt(sku['srp_min'])}–{fmt(sku['srp_max'])}",
            "posting_status": "pending",
        })

    result = {
        "state": state_code,
        "state_name": state.get("name", state_code),
        "market_type": market_type,
        "distributor": distributor,
        "generated": datetime.now().isoformat(),
        "skus": rows,
        "checklist": [
            "☐ Identify market type (control vs three-tier)",
            "☐ Verify distributor assignment",
            "☐ Calculate state-specific excise taxes",
            "☐ Set FOBs from Master Pricing Model",
            "☐ Ensure 30% margin floor on all SKUs",
            "☐ Align SRPs with target ranges",
            "☐ Set posting_status = pending",
            "☐ Document market-specific rules",
            f"☐ Submit to pricing@prestigebevgroup.com (60-day lead)",
        ],
    }

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"\n{'='*65}")
        print(f"  NEW STATE PRICING TEMPLATE: {state.get('name', state_code)} ({state_code})")
        print(f"{'='*65}")
        print(f"  Market Type:    {market_type}")
        print(f"  Distributor:    {distributor}")
        print(f"  Generated:      {datetime.now().strftime('%Y-%m-%d')}")
        print()
        # Table header
        print(f"  {'SKU':<14} {'Name':<20} {'FOB':>8} {'Tax':>6} {'SRP@30':>8} {'Target':>14} {'Status'}")
        print(f"  {'─'*14} {'─'*20} {'─'*8} {'─'*6} {'─'*8} {'─'*14} {'─'*8}")
        for r in rows:
            print(f"  {r['sku']:<14} {r['name']:<20} {fmt(r['fob']):>8} {fmt(r['tax']):>6} "
                  f"{fmt(r['srp_30']):>8} {r['srp_target']:>14} {r['posting_status']}")
        print()
        print("  SETUP CHECKLIST:")
        for item in result["checklist"]:
            print(f"    {item}")
        print()


def cmd_compare(args):
    """Compare pricing for a SKU across multiple states."""
    sku_code = resolve_sku(args.sku)
    if not sku_code:
        print(f"ERROR: Unknown SKU '{args.sku}'.", file=sys.stderr)
        sys.exit(1)

    sku = SKUS[sku_code]
    state_codes = [s.strip().upper() for s in args.states.split(",")]

    fob = args.fob if args.fob else 125.00
    rows = []
    for sc in state_codes:
        state = STATES.get(sc)
        if not state:
            rows.append({"state": sc, "error": "Unknown state"})
            continue

        tax = excise_per_case(sc, sku_code)
        if sc == "VA":
            va_retail = virginia_abc(fob, sku["case_pack"])
            rows.append({
                "state": sc, "name": state["name"], "type": state["type"],
                "tax": tax, "srp": va_retail, "formula": "VA ABC",
                "distributor": state.get("distributor", ""),
            })
        else:
            tree = price_tree(fob, tax, 3.00, sku["case_pack"])
            rows.append({
                "state": sc, "name": state["name"], "type": state["type"],
                "tax": tax, "srp": tree["srp_at_30"], "formula": "Three-Tier @30%",
                "distributor": state.get("distributor", ""),
            })

    result = {"sku": sku_code, "sku_name": sku["name"], "fob": fob, "states": rows}

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"\n{'='*70}")
        print(f"  COMPARE: {sku['name']} ({sku_code}) @ FOB {fmt(fob)}")
        print(f"{'='*70}")
        print(f"  {'State':<5} {'Name':<15} {'Type':<12} {'Tax':>7} {'SRP':>8} {'Formula':<18} {'Distributor'}")
        print(f"  {'─'*5} {'─'*15} {'─'*12} {'─'*7} {'─'*8} {'─'*18} {'─'*20}")
        for r in rows:
            if "error" in r:
                print(f"  {r['state']:<5} {r['error']}")
                continue
            print(f"  {r['state']:<5} {r['name']:<15} {r['type']:<12} {fmt(r['tax']):>7} "
                  f"{fmt(r['srp']):>8} {r['formula']:<18} {r.get('distributor', '')}")
        print(f"\n  SRP Target: {fmt(sku['srp_min'])}–{fmt(sku['srp_max'])}")
        print()


def cmd_lookup(args):
    """Quick lookup for SKUs, states, or tiers."""
    query = args.query.strip().lower()

    # Try SKU lookup
    sku_code = resolve_sku(query)
    if sku_code:
        cmd_tree(argparse.Namespace(sku=sku_code, json=args.json))
        return

    # Try state lookup
    state_code = query.upper()
    if state_code in STATES:
        state = STATES[state_code]
        if args.json:
            print(json.dumps({"code": state_code, **state}, indent=2))
        else:
            print(f"\n  STATE: {state['name']} ({state_code})")
            print(f"  Type:        {state['type']}")
            print(f"  Distributor: {state.get('distributor', 'N/A')}")
            print(f"  Excise/gal:  {fmt(state.get('excise_per_gal', 0))}")
            if state.get("notes"):
                print(f"  Intel:       {state['notes']}")
            print()
        return

    # Try tier lookup
    for tier in TIERS:
        if query in tier["name"].lower():
            matching = [f"{c}: {s['name']}" for c, s in SKUS.items() if s["tier"] == tier["name"]]
            if args.json:
                print(json.dumps({"tier": tier, "skus": matching}, indent=2))
            else:
                lo = fmt(tier["min"]) if tier["min"] else "—"
                hi = fmt(tier["max"]) if tier["max"] else "—"
                print(f"\n  TIER: {tier['name']} ({lo} – {hi})")
                for m in matching:
                    print(f"    • {m}")
                print()
            return

    print(f"No match for '{args.query}'. Try a SKU name, state code, or tier name.", file=sys.stderr)
    sys.exit(1)


def cmd_skus(args):
    """List all SKUs."""
    if args.json:
        print(json.dumps(SKUS, indent=2))
    else:
        print(f"\n{'='*80}")
        print(f"  SIEMPRE SPIRITS — SKU REFERENCE")
        print(f"{'='*80}")
        print(f"  {'Code':<15} {'Name':<22} {'SRP Target':>14} {'Tier':<16} {'NOM':<6} {'Brand'}")
        print(f"  {'─'*15} {'─'*22} {'─'*14} {'─'*16} {'─'*6} {'─'*10}")
        for code, s in SKUS.items():
            srp = f"{fmt(s['srp_min'])}–{fmt(s['srp_max'])}" if s["srp_min"] != s["srp_max"] else fmt(s["srp_target"])
            print(f"  {code:<15} {s['name']:<22} {srp:>14} {s['tier']:<16} {s['nom']:<6} {s['brand']}")
        print()


def cmd_states(args):
    """List all states with intel."""
    if args.json:
        print(json.dumps(STATES, indent=2))
    else:
        us = {k: v for k, v in STATES.items() if v.get("country", "US") == "US"}
        ca = {k: v for k, v in STATES.items() if v.get("country") == "CA"}

        print(f"\n{'='*75}")
        print(f"  SIEMPRE SPIRITS — MARKET INTEL ({len(STATES)} markets)")
        print(f"{'='*75}")

        print(f"\n  US MARKETS ({len(us)}):")
        print(f"  {'Code':<5} {'State':<15} {'Type':<12} {'Distributor':<30} {'Excise/gal':>10}")
        print(f"  {'─'*5} {'─'*15} {'─'*12} {'─'*30} {'─'*10}")
        for code, s in sorted(us.items()):
            dist = s.get("distributor", "") or "—"
            print(f"  {code:<5} {s['name']:<15} {s['type']:<12} {dist:<30} {fmt(s.get('excise_per_gal', 0)):>10}")

        print(f"\n  CANADIAN MARKETS ({len(ca)}):")
        print(f"  {'Code':<5} {'Province':<20} {'Board':<15}")
        print(f"  {'─'*5} {'─'*20} {'─'*15}")
        for code, s in sorted(ca.items()):
            print(f"  {code:<5} {s['name']:<20} {s.get('distributor', ''):>15}")
        print()


# ─────────────────────────────────────────────────
# CLI ENTRYPOINT
# ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Siempre Spirits — Pricing Intelligence Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s calculate plata --fob 125 --state VA
  %(prog)s validate --fob 125 --cogs 64 --sku plata --srp 49.99
  %(prog)s virginia 125
  %(prog)s tree plata
  %(prog)s new-state WI --type three-tier
  %(prog)s compare plata --states CA,TX,FL,VA
  %(prog)s lookup plata
  %(prog)s skus
  %(prog)s states
        """,
    )
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    subs = parser.add_subparsers(dest="command", help="Command to run")

    # Helper: add --json to every subparser so it works in either position
    def add_json(p):
        p.add_argument("--json", action="store_true", help="Output as JSON")
        return p

    # calculate
    p_calc = add_json(subs.add_parser("calculate", help="Calculate price tree for a SKU"))
    p_calc.add_argument("sku", help="SKU code or alias (e.g., plata, SIEMP-PLT-75)")
    p_calc.add_argument("--fob", type=float, default=125.00, help="FOB per case (default: 125.00)")
    p_calc.add_argument("--state", help="State code (e.g., VA, CA, TX)")
    p_calc.add_argument("--freight", type=float, help="Freight per case (default: 3.00)")
    p_calc.add_argument("--tax", type=float, help="State tax per case (auto-calculated if state given)")

    # validate
    p_val = add_json(subs.add_parser("validate", help="Validate pricing against rules"))
    p_val.add_argument("--fob", type=float, required=True, help="FOB per case")
    p_val.add_argument("--cogs", type=float, help="COGS per case")
    p_val.add_argument("--sku", help="SKU code or alias")
    p_val.add_argument("--srp", type=float, help="Actual SRP to validate")

    # virginia
    p_va = add_json(subs.add_parser("virginia", help="Virginia ABC pricing formula"))
    p_va.add_argument("fob", type=float, help="FOB per case")
    p_va.add_argument("--case-pack", type=int, default=6, help="Bottles per case (default: 6)")

    # tree
    p_tree = add_json(subs.add_parser("tree", help="Display SKU info and tier"))
    p_tree.add_argument("sku", help="SKU code or alias")

    # new-state
    p_ns = add_json(subs.add_parser("new-state", help="Generate new state pricing template"))
    p_ns.add_argument("state", help="State code (e.g., WI, KY)")
    p_ns.add_argument("--type", choices=["control", "three-tier"], help="Market type")
    p_ns.add_argument("--distributor", help="Distributor name")
    p_ns.add_argument("--include-supremo", action="store_true", help="Include Supremo SKU")

    # compare
    p_cmp = add_json(subs.add_parser("compare", help="Compare pricing across states"))
    p_cmp.add_argument("sku", help="SKU code or alias")
    p_cmp.add_argument("--states", required=True, help="Comma-separated state codes")
    p_cmp.add_argument("--fob", type=float, default=125.00, help="FOB per case")

    # lookup
    p_look = add_json(subs.add_parser("lookup", help="Quick reference lookup"))
    p_look.add_argument("query", help="SKU, state code, or tier name")

    # skus
    add_json(subs.add_parser("skus", help="List all SKUs"))

    # states
    add_json(subs.add_parser("states", help="List all states with intel"))

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    handlers = {
        "calculate": cmd_calculate,
        "validate": cmd_validate,
        "virginia": cmd_virginia,
        "tree": cmd_tree,
        "new-state": cmd_new_state,
        "compare": cmd_compare,
        "lookup": cmd_lookup,
        "skus": cmd_skus,
        "states": cmd_states,
    }

    handler = handlers.get(args.command)
    if handler:
        handler(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
