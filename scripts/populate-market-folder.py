#!/usr/bin/env python3
"""
Populate a market folder on Google Drive with organized intel.
Searches Gmail (via MCP), Granola, Drive, and Vault for market-specific data.

Usage:
  python3 populate-market-folder.py --market "California" --code "CA" --distributor "Winebow"

This script creates the subfolder structure and document templates.
The actual content population is done by the market agent (via Claude Code Agent tool)
which searches all sources and fills in the docs.
"""

import argparse
import os
import json
from docx import Document
from docx.shared import RGBColor, Pt

DRIVE_BASE = "/Users/alexl/Library/CloudStorage/GoogleDrive-alex@siempretequila.com/Shared drives/Optimus/Sales Force"

SUBFOLDERS = [
    "Pricing",
    "Correspondence",
    "Invoices",
    "Programs",
    "Meeting Notes",
    "Reports",
    "Contacts",
    "Compliance",
]

# Market metadata
MARKETS = {
    # Tier 1
    'CA': {'name': 'California', 'distributor': 'Winebow', 'tier': 1, 'owner': 'Nick', 'structure': 'License'},
    'TX': {'name': 'Texas', 'distributor': 'RNDC + RAM', 'tier': 1, 'owner': 'Nick', 'structure': 'License'},
    'CO': {'name': 'Colorado', 'distributor': 'Johnson Brothers Maverick', 'tier': 1, 'owner': 'Alex', 'structure': 'License'},
    'WA': {'name': 'Washington', 'distributor': 'RNDC', 'tier': 1, 'owner': 'Alex', 'structure': 'License'},
    'OR': {'name': 'Oregon', 'distributor': 'RNDC NW', 'tier': 1, 'owner': 'Alex', 'structure': 'Control (OLCC)'},
    'FL': {'name': 'Florida', 'distributor': 'Maverick + RNDC', 'tier': 1, 'owner': 'Nick', 'structure': 'License'},
    'IL': {'name': 'Illinois', 'distributor': 'Breakthru Beverage', 'tier': 1, 'owner': 'Alex', 'structure': 'License'},
    'ON': {'name': 'Ontario', 'distributor': 'LCBO + Dandurand', 'tier': 1, 'owner': 'Rick', 'structure': 'Provincial (LCBO)'},
    # Tier 2
    'KS': {'name': 'Kansas', 'distributor': 'Vintegrity Kansas', 'tier': 2, 'owner': 'Rick', 'structure': 'License'},
    'OK': {'name': 'Oklahoma', 'distributor': 'Artisan Fine Wine', 'tier': 2, 'owner': 'Rick', 'structure': 'License'},
    'TN': {'name': 'Tennessee', 'distributor': 'ADC Tennessee', 'tier': 2, 'owner': 'Alex', 'structure': 'Franchise-flagged'},
    'GA': {'name': 'Georgia', 'distributor': 'United Distributors (UDIGA)', 'tier': 2, 'owner': 'Alex', 'structure': 'License'},
    'AR': {'name': 'Arkansas', 'distributor': 'Central Distributors', 'tier': 2, 'owner': 'Alex', 'structure': 'License'},
    'MO': {'name': 'Missouri', 'distributor': 'Smart → Vintegrity', 'tier': 2, 'owner': 'Rick', 'structure': 'License'},
    'VA': {'name': 'Virginia', 'distributor': 'Johnson Brothers', 'tier': 2, 'owner': 'Rick', 'structure': 'Control (VA ABC)'},
    'UT': {'name': 'Utah', 'distributor': 'RNDC NW', 'tier': 2, 'owner': 'Alex', 'structure': 'Control'},
    'AB': {'name': 'Alberta', 'distributor': 'BevCo', 'tier': 2, 'owner': 'Rick', 'structure': 'Provincial (AGLC)'},
    'SK': {'name': 'Saskatchewan', 'distributor': 'BevCo', 'tier': 2, 'owner': 'Rick', 'structure': 'Provincial (SLGA)'},
    'MB': {'name': 'Manitoba', 'distributor': 'BevCo', 'tier': 2, 'owner': 'Rick', 'structure': 'Provincial (MLLC)'},
    'BC': {'name': 'British Columbia', 'distributor': 'BevCo', 'tier': 2, 'owner': 'Rick', 'structure': 'Provincial (BCLDB)'},
}


def create_subfolder_structure(market_path):
    """Create all subfolders for a market."""
    for folder in SUBFOLDERS:
        os.makedirs(os.path.join(market_path, folder), exist_ok=True)


def create_ledger(market_path, code, meta):
    """Create the market ledger .docx."""
    doc = Document()
    doc.add_heading(f'{meta["name"]} ({code}) — Market Ledger', level=0)
    doc.add_paragraph(
        f'Running log for the {meta["name"]} market. '
        f'Agent writes updates, Alex reads and responds.'
    )
    doc.add_paragraph('')

    p = doc.add_paragraph()
    p.add_run('Human Owner: ').bold = True
    p.add_run(meta['owner'])
    p = doc.add_paragraph()
    p.add_run('Distributor: ').bold = True
    p.add_run(meta['distributor'])
    p = doc.add_paragraph()
    p.add_run('Market Tier: ').bold = True
    p.add_run(f'Tier {meta["tier"]}')
    p = doc.add_paragraph()
    p.add_run('State Structure: ').bold = True
    p.add_run(meta['structure'])

    doc.add_paragraph('')
    doc.add_heading('Agent: populate this ledger with market status, recommendations, and draft communications.', level=3)
    doc.add_paragraph('Search Gmail, Granola, Drive, and Vault for all intel on this market.')

    filepath = os.path.join(market_path, f'{code} Ledger.docx')
    doc.save(filepath)
    return filepath


def create_placeholder_docs(market_path, code, meta):
    """Create placeholder docs in each subfolder."""
    docs_created = []

    placeholders = {
        'Pricing': f'{code} Pricing — Current & Historical.docx',
        'Contacts': f'{code} Contacts — {meta["distributor"]}.docx',
        'Programs': f'{code} Programs — Active & Planned.docx',
        'Reports': f'{code} Market Performance Report.docx',
        'Compliance': f'{code} Regulatory Reference.docx',
        'Correspondence': f'{code} Key Email Threads.docx',
        'Meeting Notes': f'{code} Meeting Notes — Granola.docx',
    }

    for folder, filename in placeholders.items():
        doc = Document()
        doc.add_heading(f'{meta["name"]} ({code}) — {folder}', level=0)
        doc.add_paragraph(f'Distributor: {meta["distributor"]} | Owner: {meta["owner"]} | Tier: {meta["tier"]}')
        doc.add_paragraph('')
        p = doc.add_paragraph()
        r = p.add_run('AWAITING AGENT POPULATION')
        r.bold = True
        r.font.color.rgb = RGBColor(202, 138, 4)
        doc.add_paragraph('The market agent will search Gmail, Granola, Google Drive, and the Data Vault to populate this document with real intel.')

        filepath = os.path.join(market_path, folder, filename)
        doc.save(filepath)
        docs_created.append(filepath)

    return docs_created


def populate_market(code):
    """Set up a market folder with structure and placeholders."""
    if code not in MARKETS:
        print(f'Unknown market code: {code}')
        return

    meta = MARKETS[code]
    market_path = os.path.join(DRIVE_BASE, meta['name'])

    print(f'Setting up {meta["name"]} ({code})...')

    # Create subfolders
    create_subfolder_structure(market_path)
    print(f'  Subfolders created')

    # Create ledger
    ledger = create_ledger(market_path, code, meta)
    print(f'  Ledger: {os.path.basename(ledger)}')

    # Create placeholder docs
    docs = create_placeholder_docs(market_path, code, meta)
    print(f'  Placeholder docs: {len(docs)}')

    total = len(docs) + 1  # +1 for ledger
    print(f'  ✓ {meta["name"]} ready ({total} files, awaiting agent population)')

    return total


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--code', help='Single market code (e.g., CA)')
    parser.add_argument('--tier', type=int, help='Populate all markets in a tier (1 or 2)')
    parser.add_argument('--all', action='store_true', help='Populate all Tier 1 + 2 markets')
    args = parser.parse_args()

    if args.code:
        populate_market(args.code.upper())
    elif args.tier:
        codes = [c for c, m in MARKETS.items() if m['tier'] == args.tier]
        total = 0
        for code in codes:
            total += populate_market(code) or 0
        print(f'\nTier {args.tier}: {len(codes)} markets, {total} files')
    elif args.all:
        total = 0
        for code in MARKETS:
            if code != 'GA':  # Skip GA, already done
                total += populate_market(code) or 0
        print(f'\nAll markets: {len(MARKETS)-1} markets (excl GA), {total} files')
    else:
        print('Usage: --code CA | --tier 1 | --all')
