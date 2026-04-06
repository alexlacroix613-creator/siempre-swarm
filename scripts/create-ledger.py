#!/usr/bin/env python3
"""
Create a market ledger .docx file for Google Drive.
Opens natively as a Google Doc when accessed through Drive.

Usage:
  python3 create-ledger.py --market "Georgia" --code "GA" --output "/path/to/drive/Sales Force/Georgia/"
"""

import argparse
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from datetime import datetime
import os


def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    return h


def add_entry_header(doc, date, source, title):
    """Add a timestamped entry header."""
    p = doc.add_paragraph()
    run = p.add_run(f"{'─' * 60}")
    run.font.color.rgb = RGBColor(200, 200, 200)

    h = doc.add_heading(f"{date}  |  {source}  |  {title}", level=2)
    return h


def add_status_badge(doc, status, text):
    """Add a status line with color."""
    p = doc.add_paragraph()
    colors = {
        'RED': RGBColor(220, 38, 38),
        'YELLOW': RGBColor(202, 138, 4),
        'GREEN': RGBColor(22, 163, 74),
    }
    run = p.add_run(f"STATUS: {status}")
    run.bold = True
    run.font.color.rgb = colors.get(status, RGBColor(0, 0, 0))
    p.add_run(f" — {text}")


def add_table(doc, headers, rows):
    """Add a formatted table."""
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = 'Light Grid Accent 1'

    # Headers
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True

    # Rows
    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            table.rows[r_idx + 1].cells[c_idx].text = str(val)

    return table


def add_draft_block(doc, subject, body):
    """Add a draft email block with visual distinction."""
    p = doc.add_paragraph()
    run = p.add_run("📧 DRAFT — REQUIRES ALEX APPROVAL BEFORE SENDING")
    run.bold = True
    run.font.color.rgb = RGBColor(220, 38, 38)

    doc.add_paragraph(f"Subject: {subject}").runs[0].bold = True

    for line in body.split('\n'):
        p = doc.add_paragraph(line)
        p.paragraph_format.left_indent = Inches(0.5)
        for run in p.runs:
            run.font.color.rgb = RGBColor(80, 80, 80)


def create_georgia_ledger(output_dir):
    doc = Document()

    # Title
    title = doc.add_heading('Georgia (GA) — Market Ledger', level=0)

    doc.add_paragraph(
        "Running log for the Georgia market. Agent writes updates, Alex reads and responds. "
        "This is the two-way working document between the AI sales force and the human team."
    )

    p = doc.add_paragraph()
    p.add_run("Human Owner: ").bold = True
    p.add_run("Alex Lacroix (CEO)")
    p = doc.add_paragraph()
    p.add_run("Distributor: ").bold = True
    p.add_run("United Distributors Inc (UDIGA)")
    p = doc.add_paragraph()
    p.add_run("Market Grade: ").bold = True
    p.add_run("A (Top 6 market)")
    p = doc.add_paragraph()
    p.add_run("Key Contacts: ").bold = True
    p.add_run("Justin Israel (Sales Mgr), Winfred Westbrook (GM Craft), David Benson (Pricing)")

    doc.add_paragraph("")

    # ── Entry 1: Initial Market Status ──
    add_entry_header(doc, "2026-04-06", "AGENT", "Georgia Market Status — Q1 2026 Review")
    add_status_badge(doc, "RED", "145 cases Q1 vs 442 target (32.8%). Annualized: ~580 vs 1,853 plan.")

    doc.add_heading("Q1 2026 Performance", level=3)
    add_table(doc,
        ["Month", "Target", "Actual", "Pct", "Status"],
        [
            ["January", "130", "43.5", "33.5%", "BEHIND"],
            ["February", "142", "52.5", "37.0%", "BEHIND"],
            ["March", "170", "49.0", "28.8%", "BEHIND"],
            ["Q1 Total", "442", "145.0", "32.8%", "CRITICAL"],
        ]
    )

    doc.add_heading("SKU Mix (Q1 2026)", level=3)
    add_table(doc,
        ["SKU", "Cases", "Mix %", "Target %", "Status"],
        [
            ["Plata", "~60", "41%", "56%", "Under — should lead"],
            ["Reposado", "~70", "48%", "30%", "Over — servicing existing, not opening new"],
            ["Anejo", "~15", "10%", "8%", "Acceptable"],
        ]
    )

    doc.add_heading("Diagnosis", level=3)
    doc.add_paragraph(
        "UDIGA has the team (12+ reps) but no documented recovery plan. "
        "Repo-heavy mix signals retention posture, not growth. "
        "8 of top 10 accounts declined 80-100% in 2025. "
        "Average throughput: 1.6 cases/account/quarter — that's life support, not distribution."
    )

    doc.add_paragraph("")

    # ── Entry 2: Agave Program + Pricing ──
    add_entry_header(doc, "2026-04-06", "AGENT", "New Program & Pricing — Mined from Gmail")
    add_status_badge(doc, "GREEN", "Agave Program LIVE. New pricing confirmed. Promos approved.")

    doc.add_heading("The Agave Program 2026", level=3)
    doc.add_paragraph(
        "16-week program run by UDIGA. Approved March 13 by Alex. "
        "Winfred Westbrook: 'We are excited to have Siempre back on the program. LFG!!' "
        "Duration: April 1 – ~July 22, 2026."
    )

    doc.add_heading("New Everyday Pricing (Effective April 1)", level=3)
    add_table(doc,
        ["SKU", "Channel", "Deal Level", "Price"],
        [
            ["Plata", "On-Premise", "Full List", "$35.99"],
            ["Plata", "On-Premise", "Btl 1", "$28.99"],
            ["Plata", "On-Premise", "Cocktail", "$26.99"],
            ["Plata", "On-Premise", "MNGR Deal", "$25.99"],
            ["Plata", "Off-Premise", "1 case", "$34.38"],
            ["Plata", "Off-Premise", "3 case", "$31.99"],
            ["Reposado", "On-Premise", "Full List", "$43.99"],
            ["Reposado", "On-Premise", "Btl 1", "$33.99"],
            ["Reposado", "On-Premise", "Cocktail", "$30.99"],
            ["Reposado", "On-Premise", "MNGR Deal", "$28.99"],
            ["Reposado", "Off-Premise", "1 case", "$41.59"],
            ["Reposado", "Off-Premise", "3 case", "$35.99"],
        ]
    )

    doc.add_heading("April–May Promotions (100% on Siempre)", level=3)
    doc.add_paragraph("Off-Premise:")
    doc.add_paragraph("• Buy 3 cases, get 2 bottles free", style='List Bullet')
    doc.add_paragraph("• Buy 5 cases, get 1 case free", style='List Bullet')
    doc.add_paragraph("On-Premise:")
    doc.add_paragraph("• Spirit list/cocktail menu: buy 1 case, get 1 bottle free", style='List Bullet')

    doc.add_heading("UDIGA Margins (Confirmed)", level=3)
    doc.add_paragraph(
        "Plata: 35.4% → 26.0% across deal levels. "
        "Reposado: 39.6% → 26.7% across deal levels. "
        "Floor is ~26-27% at deepest deals."
    )

    doc.add_paragraph("")

    # ── Entry 3: Draft Email for Rep Team ──
    add_entry_header(doc, "2026-04-06", "AGENT", "DRAFT: Rep Team Pricing & Program Announcement")

    add_draft_block(doc,
        "Siempre Tequila — New Pricing & Agave Program Now Live | Georgia",
        """Team,

Wanted to make sure everyone has the latest on Siempre Tequila — we've got new pricing and a program in place starting now.

WHAT'S NEW:
• Siempre is back on the Agave Program for 16 weeks (April 1 – late July)
• New everyday pricing is LIVE — see the table below
• April–May promotional deals approved (details below)

PLATA PRICING:
  On-Premise: $35.99 (full list) / $28.99 (bottle) / $26.99 (cocktail) / $25.99 (manager deal)
  Off-Premise: $34.38 (1 case) / $31.99 (3 case)

REPOSADO PRICING:
  On-Premise: $43.99 (full list) / $33.99 (bottle) / $30.99 (cocktail) / $28.99 (manager deal)
  Off-Premise: $41.59 (1 case) / $35.99 (3 case)

APRIL–MAY PROMOS:
  Off-Premise: Buy 3 get 2 bottles free | Buy 5 get 1 case free
  On-Premise: Spirit list/cocktail menu — buy 1 case get 1 bottle free

This pricing was built to move. Plata is the door-opener — lead with it on new accounts. The promos are designed to get us back on shelves and behind bars.

If you have any questions about the pricing or program, reach out to Justin Israel or Winfred Westbrook.

Let's get after it.

Best,
Alex Lacroix
CEO, Siempre Spirits"""
    )

    doc.add_paragraph("")

    # ── Entry 4: Recommended Actions ──
    add_entry_header(doc, "2026-04-06", "AGENT", "Recommended Actions")

    doc.add_paragraph("1. Confirm Justin Israel's team presentation happened (Alex requested March 19)")
    doc.add_paragraph("2. Validate April pricing is on actual invoices by April 14")
    doc.add_paragraph("3. Request Q2 JBP from UDIGA by April 18 — no plan = no path")
    doc.add_paragraph("4. Flip SKU priority to Plata-led for new account openings")
    doc.add_paragraph("5. Identify 10 lapsed accounts for reactivation blitz (5+ cases in 2024, zero now)")

    doc.add_paragraph("")
    doc.add_paragraph("")

    # ── Placeholder for Alex ──
    add_entry_header(doc, "____-__-__", "ALEX", "[Your notes here]")
    doc.add_paragraph(
        "Write your response, notes, or instructions here. "
        "The agent will read this on the next cycle and incorporate your feedback."
    )

    # Save
    filepath = os.path.join(output_dir, "GA Ledger.docx")
    doc.save(filepath)
    print(f"Created: {filepath}")
    print(f"Size: {os.path.getsize(filepath):,} bytes")
    return filepath


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True, help="Output directory")
    args = parser.parse_args()
    create_georgia_ledger(args.output)
