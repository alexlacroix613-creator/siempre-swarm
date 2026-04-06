#!/usr/bin/env python3
"""Build Texas .docx files for the Sales Force Google Drive folder."""

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

BASE = "/Users/alexl/Library/CloudStorage/GoogleDrive-alex@siempretequila.com/Shared drives/Optimus/Sales Force/Texas"


def style_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    return h


def add_field(doc, label, value):
    p = doc.add_paragraph()
    run_label = p.add_run(f"{label}: ")
    run_label.bold = True
    p.add_run(value)
    return p


def add_bullet(doc, text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    if bold_prefix:
        r = p.add_run(bold_prefix)
        r.bold = True
        p.add_run(text)
    else:
        p.add_run(text)
    return p


def simple_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    # Header row
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True
                run.font.size = Pt(9)
    # Data rows
    for r_idx, row_data in enumerate(rows):
        for c_idx, val in enumerate(row_data):
            cell = table.rows[r_idx + 1].cells[c_idx]
            cell.text = str(val)
            for paragraph in cell.paragraphs:
                for run in paragraph.runs:
                    run.font.size = Pt(9)
    return table


# ============================================================
# 1. PRICING
# ============================================================
def build_pricing():
    doc = Document()
    style_heading(doc, "TX Pricing — Current & Historical")
    doc.add_paragraph("Texas pricing reference for Siempre Tequila. Source: 2025 Pricing Programmer via RNDC.")

    style_heading(doc, "2025 Pricing Programmer Overview", level=2)
    add_field(doc, "Source File", "2025 Pricing Programmer (36 columns x 77 rows)")
    add_field(doc, "Deal Types", "LIST, ED (Early Discount), MQTY (Multi-Quantity), EXEC (Executive)")
    add_field(doc, "Channel Coverage", "BOTH, OFF (Off-Premise)")
    add_field(doc, "Price Range", "$218 – $265 (varies by SKU, deal type, and volume)")
    add_field(doc, "Chain Focus", "Specs and Total Wine — per RNDC VP David Slocum's direction via CAMs")

    style_heading(doc, "FOB Status", level=2)
    doc.add_paragraph(
        "Current FOBs may already be set (Texas was NOT included in the April 1, 2026 FOB update batch). "
        "Verify current FOBs with MHW before any pricing changes."
    )

    style_heading(doc, "2026 Pricing File", level=2)
    p = doc.add_paragraph()
    r = p.add_run("STATUS: MISSING")
    r.bold = True
    r.font.color.rgb = RGBColor(0xCC, 0, 0)
    doc.add_paragraph(
        "No 2026 pricing file has been received or created for Texas. "
        "This needs to be built once FOBs are confirmed and any margin adjustments are finalized."
    )

    style_heading(doc, "Pricing Structure Summary", level=2)
    headers = ["Deal Type", "Channel", "Typical Range", "Notes"]
    rows = [
        ["LIST", "BOTH", "$250 – $265", "Standard list price across all channels"],
        ["ED", "OFF", "$240 – $255", "Early discount for off-premise"],
        ["MQTY", "OFF", "$225 – $245", "Multi-quantity discount tiers"],
        ["EXEC", "BOTH", "$218 – $235", "Executive/volume pricing for key accounts"],
    ]
    simple_table(doc, headers, rows)

    style_heading(doc, "Key Chain Pricing Notes", level=2)
    add_bullet(doc, "Specs: Primary chain target per David Slocum. Pricing through CAMs.")
    add_bullet(doc, "Total Wine: Secondary chain focus. Competitive pricing required to maintain shelf space.")
    add_bullet(doc, "On-premise pricing not broken out separately in programmer — uses BOTH channel rates.")

    doc.save(os.path.join(BASE, "Pricing", "TX Pricing — Current & Historical.docx"))
    print("  [OK] Pricing")


# ============================================================
# 2. CONTACTS
# ============================================================
def build_contacts():
    doc = Document()
    style_heading(doc, "TX Contacts — RNDC + RAM")
    doc.add_paragraph("Key contacts for Texas market operations. Updated April 2026.")

    style_heading(doc, "RNDC — Republic National Distributing Company", level=2)
    headers = ["Name", "Role", "Email", "Phone", "Notes"]
    rows = [
        ["Jason Haynes", "Portfolio Manager", "Jason.Haynes@rndc-usa.com", "—", "Day-to-day portfolio contact"],
        ["Raymond Helmick", "Division Manager, On-Premise SA", "Raymond.Helmick@rndc-usa.com", "210-875-6155", "San Antonio on-premise; GSM education Apr 10"],
        ["Lee Blilie", "Division Manager, On-Premise Houston", "Lee.Blilie@rndc-usa.com", "281-382-6073", "Houston on-premise; GSM education Apr 10"],
        ["Rachelle Ray", "Operations", "—", "—", "Ops coordination"],
        ["David Slocum", "VP Spirits", "—", "—", "Strategic direction; advised Specs + Total Wine focus"],
        ["Craig Green", "—", "—", "—", "Involved in ops / logistics"],
    ]
    simple_table(doc, headers, rows)

    style_heading(doc, "MHW — Compliance & Billing", level=2)
    headers2 = ["Name", "Role", "Email", "Account Info"]
    rows2 = [
        ["Suraj Baboolall", "Billbacks Contact", "billbacks@mhwltd.com", "Acct 1100161601 / TXR"],
    ]
    simple_table(doc, headers2, rows2)

    style_heading(doc, "RAM — Retail Account Management", level=2)
    p = doc.add_paragraph()
    r = p.add_run("DATA GAP: PRIMARY CONTACT NOT IDENTIFIED")
    r.bold = True
    r.font.color.rgb = RGBColor(0xCC, 0, 0)
    doc.add_paragraph(
        "RAM is a critical partner for Texas retail execution. No primary contact has been identified. "
        "This is a significant gap for a Tier 1 market and must be resolved."
    )

    style_heading(doc, "DiningOut — Event Partner", level=2)
    headers3 = ["Name", "Role", "Email", "Phone"]
    rows3 = [
        ["Catie Naman", "Event Coordinator", "cnaman@diningout.com", "251-303-6437"],
    ]
    simple_table(doc, headers3, rows3)
    doc.add_paragraph("Note: 5+ emails unanswered since January 17, 2026. Follow-up or decline decision needed.")

    doc.save(os.path.join(BASE, "Contacts", "TX Contacts — RNDC + RAM.docx"))
    print("  [OK] Contacts")


# ============================================================
# 3. PROGRAMS
# ============================================================
def build_programs():
    doc = Document()
    style_heading(doc, "TX Programs — Active & Planned")
    doc.add_paragraph("Active and planned programs for Texas. Updated April 2026.")

    style_heading(doc, "GSM Education Sessions — April 10, 2026", level=2)
    p = doc.add_paragraph()
    r = p.add_run("STATUS: CONFIRMED — CRITICAL FIRST TOUCHPOINTS")
    r.bold = True
    r.font.color.rgb = RGBColor(0, 0x80, 0)

    headers = ["Market", "Time", "Contact", "Format", "Duration"]
    rows = [
        ["Houston", "9:30 AM CT", "Lee Blilie", "Virtual", "20–45 min"],
        ["San Antonio", "10:00 AM CT", "Raymond Helmick", "Virtual", "20–45 min"],
    ]
    simple_table(doc, headers, rows)
    doc.add_paragraph(
        "These are the first direct education touchpoints with RNDC on-premise division managers. "
        "Confirmed via email threads April 1–2, 2026."
    )

    style_heading(doc, "Hawk DVMs", level=2)
    add_field(doc, "Markets", "Dallas, Houston, Austin")
    add_field(doc, "Status", "Active — Hawk Division Managers deployed in key metros")
    doc.add_paragraph("Hawk DVMs provide additional coverage in high-volume metro areas.")

    style_heading(doc, "DiningOut Events", level=2)
    p2 = doc.add_paragraph()
    r2 = p2.add_run("STATUS: UNANSWERED — 5+ EMAILS SINCE JAN 17")
    r2.bold = True
    r2.font.color.rgb = RGBColor(0xCC, 0, 0)

    headers2 = ["Event", "Timing", "Status"]
    rows2 = [
        ["Top Taco", "Fall 2026 (date TBD)", "Unanswered — fall dates still open"],
        ["RARE", "Fall 2026 (date TBD)", "Unanswered — fall dates still open"],
        ["Chicken Fight", "Fall 2026 (date TBD)", "Unanswered — fall dates still open"],
    ]
    simple_table(doc, headers2, rows2)
    doc.add_paragraph("Decision required: commit to fall events or formally decline. Cannot leave unanswered.")

    style_heading(doc, "Maverick Exploration", level=2)
    add_field(doc, "Status", "ON HOLD — compliance issues blocking")
    doc.add_paragraph(
        "Maverick was explored as a potential alternative or supplement to RNDC following RNDC's loss of the "
        "Proximal portfolio and subsequent restructuring/layoffs. However, compliance issues have blocked any "
        "transition. Revisit if compliance landscape changes."
    )

    doc.save(os.path.join(BASE, "Programs", "TX Programs — Active & Planned.docx"))
    print("  [OK] Programs")


# ============================================================
# 4. REPORTS
# ============================================================
def build_reports():
    doc = Document()
    style_heading(doc, "TX Market Performance Report")
    doc.add_paragraph("Texas market performance analysis. Data through Q1 2026.")

    style_heading(doc, "6-Year Summary", level=2)
    add_field(doc, "Total Cases (6 years)", "2,197")
    add_field(doc, "Total Did-Buys", "268 accounts")
    add_field(doc, "Year 6 Growth", "148 → 1,291 cases = 3.9x increase (explosive growth year)")

    style_heading(doc, "Q1 2026 Performance vs Target", level=2)
    headers = ["Metric", "Actual", "Target", "Variance"]
    rows = [
        ["Q1 Cases", "42.5", "84", "-49.4%"],
    ]
    simple_table(doc, headers, rows)

    p = doc.add_paragraph()
    r = p.add_run("Q1 at 49.4% to target — but trajectory is IMPROVING")
    r.bold = True

    style_heading(doc, "Monthly Trend — Q1 2026", level=2)
    headers2 = ["Month", "Variance to Target", "Trend"]
    rows2 = [
        ["January", "-70%", "Worst month"],
        ["February", "-48%", "Improving"],
        ["March", "-29%", "Significant improvement"],
    ]
    simple_table(doc, headers2, rows2)
    doc.add_paragraph("Clear improving trajectory: -70% → -48% → -29%. If this trend continues, Q2 could approach target.")

    style_heading(doc, "SKU Performance — March 2026", level=2)
    headers3 = ["SKU", "March Performance", "Notes"]
    rows3 = [
        ["Repo", "+50%", "BRIGHT SPOT — above target in March"],
        ["Plata", "-61.5%", "CRITICAL — #1 SKU severely lagging, biggest drag on total performance"],
    ]
    simple_table(doc, headers3, rows3)

    style_heading(doc, "On-Premise Performance", level=2)
    add_field(doc, "Status", "WEAK")
    add_field(doc, "Max Volume (Top Accounts)", "3.5 cases")
    doc.add_paragraph(
        "On-premise channel is underperforming significantly. Even the best on-premise accounts are only "
        "moving 3.5 cases. GSM education sessions on April 10 are the first step to addressing this."
    )

    style_heading(doc, "Full-Year Outlook", level=2)
    add_field(doc, "December 2026 Target", "411 cases")
    p2 = doc.add_paragraph()
    r2 = p2.add_run("WARNING: ")
    r2.bold = True
    r2.font.color.rgb = RGBColor(0xCC, 0, 0)
    p2.add_run(
        "411-case December target appears unrealistic at current run rate. "
        "Would require massive acceleration in H2. Monitor Q2 closely before adjusting targets."
    )

    doc.save(os.path.join(BASE, "Reports", "TX Market Performance Report.docx"))
    print("  [OK] Reports")


# ============================================================
# 5. COMPLIANCE
# ============================================================
def build_compliance():
    doc = Document()
    style_heading(doc, "TX Regulatory Reference")
    doc.add_paragraph("Regulatory and compliance reference for Texas operations.")

    style_heading(doc, "State Structure", level=2)
    add_field(doc, "Type", "License State")
    add_field(doc, "Regulatory Body", "TABC — Texas Alcoholic Beverage Commission")

    style_heading(doc, "Permit Requirements", level=2)
    add_field(doc, "Required Permit", "Nonresident Seller's Permit (TABC)")
    p = doc.add_paragraph()
    r = p.add_run("PERMIT STATUS: UNKNOWN — AUDIT REQUIRED")
    r.bold = True
    r.font.color.rgb = RGBColor(0xCC, 0, 0)
    doc.add_paragraph(
        "Current permit status needs to be verified. Check with MHW compliance team for "
        "Siempre Spirits' Nonresident Seller's Permit status and expiration date."
    )

    style_heading(doc, "Distribution Agreement", level=2)
    add_field(doc, "Distributor", "RNDC — Republic National Distributing Company")
    add_field(doc, "Agreement Expiration", "2031")
    doc.add_paragraph("Long-term agreement in place. No near-term renewal pressure.")

    style_heading(doc, "Tied-House Compliance", level=2)
    doc.add_paragraph(
        "Texas tied-house laws restrict supplier interactions with on-premise accounts. "
        "All on-premise activations, sampling events, and promotional activities must be reviewed "
        "for tied-house compliance before execution. Coordinate with MHW compliance."
    )

    style_heading(doc, "Key Compliance Notes", level=2)
    add_bullet(doc, "All pricing changes must go through RNDC and comply with TABC posting requirements")
    add_bullet(doc, "Sampling and tasting events require proper permits and advance notice")
    add_bullet(doc, "Label registrations must be current with TABC for all active SKUs")
    add_bullet(doc, "Maverick transition exploration was blocked by compliance issues — document before revisiting")

    doc.save(os.path.join(BASE, "Compliance", "TX Regulatory Reference.docx"))
    print("  [OK] Compliance")


# ============================================================
# 6. CORRESPONDENCE
# ============================================================
def build_correspondence():
    doc = Document()
    style_heading(doc, "TX Key Email Threads")
    doc.add_paragraph("Summary of key email threads related to Texas market operations.")

    style_heading(doc, "GSM Education Confirmation", level=2)
    add_field(doc, "Thread Count", "2 threads")
    add_field(doc, "Date Range", "April 1–2, 2026")
    add_field(doc, "Status", "CONFIRMED")
    doc.add_paragraph(
        "Two email threads confirming GSM education sessions for April 10, 2026. "
        "Houston session at 9:30 AM with Lee Blilie, San Antonio session at 10:00 AM with Raymond Helmick. "
        "Both virtual, 20–45 minutes."
    )

    style_heading(doc, "DiningOut Texas — Unanswered", level=2)
    add_field(doc, "Emails Sent", "5+ since January 17, 2026")
    p = doc.add_paragraph()
    r = p.add_run("STATUS: UNANSWERED — NO RESPONSE FROM SIEMPRE")
    r.bold = True
    r.font.color.rgb = RGBColor(0xCC, 0, 0)
    doc.add_paragraph(
        "Catie Naman (cnaman@diningout.com) has sent 5+ emails since January 17 regarding fall event "
        "participation (Top Taco, RARE, Chicken Fight). None have been answered. "
        "This requires an immediate decision: commit to events or formally decline."
    )

    style_heading(doc, "RNDC AR Statement", level=2)
    add_field(doc, "Date", "March 31, 2026")
    add_field(doc, "Source", "MHW")
    add_field(doc, "Status", "Payment status requested")
    doc.add_paragraph(
        "Accounts receivable statement received from RNDC via MHW on March 31. "
        "Payment status has been requested — follow up to confirm resolution."
    )

    doc.save(os.path.join(BASE, "Correspondence", "TX Key Email Threads.docx"))
    print("  [OK] Correspondence")


# ============================================================
# 7. MEETING NOTES
# ============================================================
def build_meeting_notes():
    doc = Document()
    style_heading(doc, "TX Meeting Notes — Granola")
    doc.add_paragraph("Key meeting intelligence from Granola transcripts related to Texas.")

    style_heading(doc, "RNDC Portfolio Changes & Restructuring", level=2)
    add_bullet(doc, "RNDC lost the Proximal portfolio — significant disruption to their spirits division")
    add_bullet(doc, "Restructuring and layoffs followed the Proximal loss")
    add_bullet(doc, "Impact on Siempre coverage is unclear but should be monitored")

    style_heading(doc, "Maverick Exploration", level=2)
    add_bullet(doc, "Maverick was explored as a potential alternative distributor or supplement to RNDC")
    add_bullet(doc, "Motivation: RNDC instability post-Proximal loss")
    add_bullet(doc, "Outcome: Compliance issues are blocking any transition")
    add_bullet(doc, "Current status: On hold pending compliance resolution")

    style_heading(doc, "Strategic Direction — David Slocum", level=2)
    add_bullet(doc, "David Slocum (RNDC VP Spirits) advised focusing on Specs and Total Wine")
    add_bullet(doc, "Execution to go through CAMs (Chain Account Managers)")
    add_bullet(doc, "This represents a shift toward chain-focused strategy in Texas")

    style_heading(doc, "On-Premise Performance Discussion", level=2)
    add_bullet(doc, "On-premise channel acknowledged as underperforming")
    add_bullet(doc, "Top accounts only moving 3.5 cases — well below expectations for a Tier 1 market")
    add_bullet(doc, "GSM education sessions (Apr 10) are intended to address this gap")

    style_heading(doc, "Ops & Logistics", level=2)
    add_bullet(doc, "Craig Green involved in operational and logistics coordination")
    add_bullet(doc, "Rachelle Ray handles ops at RNDC")

    style_heading(doc, "Open Questions from Meetings", level=2)
    add_bullet(doc, "What is the actual impact of RNDC restructuring on Siempre's rep coverage?")
    add_bullet(doc, "Will Maverick compliance issues resolve, or should we commit fully to RNDC?")
    add_bullet(doc, "Can chain strategy (Specs/TW) compensate for weak on-premise?")

    doc.save(os.path.join(BASE, "Meeting Notes", "TX Meeting Notes — Granola.docx"))
    print("  [OK] Meeting Notes")


# ============================================================
# 8. UPDATE LEDGER
# ============================================================
def build_ledger():
    doc = Document()
    style_heading(doc, "Texas (TX) — Market Ledger")
    doc.add_paragraph("Running log for the Texas market. Agent writes updates, Alex reads and responds.")

    # Market metadata
    style_heading(doc, "Market Profile", level=2)
    add_field(doc, "Human Owner", "Nick")
    add_field(doc, "Distributor", "RNDC + RAM")
    add_field(doc, "Market Tier", "Tier 1")
    add_field(doc, "State Structure", "License")

    # Status
    style_heading(doc, "Current Status", level=2)
    p = doc.add_paragraph()
    r = p.add_run("STATUS: RED")
    r.bold = True
    r.font.color.rgb = RGBColor(0xCC, 0, 0)
    doc.add_paragraph("Q1 at 49.4% to target, but improving trend (Jan -70% → Feb -48% → Mar -29%).")

    # Upcoming
    style_heading(doc, "Upcoming", level=2)
    p2 = doc.add_paragraph()
    r2 = p2.add_run("GSM Education — April 10, 2026")
    r2.bold = True
    doc.add_paragraph("Houston 9:30 AM (Lee Blilie) + San Antonio 10:00 AM (Raymond Helmick). CRITICAL first touchpoints with RNDC on-premise division managers.")

    # Flags
    style_heading(doc, "Active Flags", level=2)

    flags = [
        ("FLAG: ", "RAM primary contact NOT IDENTIFIED — gap for Tier 1 market"),
        ("FLAG: ", "DiningOut Texas UNANSWERED 5+ emails — decide on fall events or decline"),
        ("FLAG: ", "Maverick transition explored but compliance issues blocking"),
        ("FLAG: ", "Plata -61.5% in March — #1 SKU severely lagging"),
    ]
    for prefix, text in flags:
        p = doc.add_paragraph()
        r = p.add_run(prefix)
        r.bold = True
        r.font.color.rgb = RGBColor(0xCC, 0, 0)
        p.add_run(text)

    # Bright spot
    style_heading(doc, "Bright Spots", level=2)
    p3 = doc.add_paragraph()
    r3 = p3.add_run("BRIGHT SPOT: ")
    r3.bold = True
    r3.font.color.rgb = RGBColor(0, 0x80, 0)
    p3.add_run("Improving trajectory Jan→Feb→Mar, Repo +50% in March")

    doc.save(os.path.join(BASE, "TX Ledger.docx"))
    print("  [OK] Ledger")


# ============================================================
# RUN ALL
# ============================================================
if __name__ == "__main__":
    print("Building Texas .docx files...")
    build_pricing()
    build_contacts()
    build_programs()
    build_reports()
    build_compliance()
    build_correspondence()
    build_meeting_notes()
    build_ledger()
    print("Done. All 8 files written.")
