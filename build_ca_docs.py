"""
Build California Sales Force .docx files for Google Drive.
Overwrites placeholder files with real content.
"""

from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os
from datetime import datetime

BASE = "/Users/alexl/Library/CloudStorage/GoogleDrive-alex@siempretequila.com/Shared drives/Optimus/Sales Force/California"

def add_title(doc, title):
    p = doc.add_heading(title, level=0)
    return p

def add_section(doc, heading, level=1):
    doc.add_heading(heading, level=level)

def add_para(doc, text, bold=False):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = bold
    return p

def add_bullet(doc, text, level=0):
    p = doc.add_paragraph(text, style='List Bullet')
    if level > 0:
        p.paragraph_format.left_indent = Inches(0.5 * level)
    return p

def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    # Header row
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for paragraph in cell.paragraphs:
            for run in paragraph.runs:
                run.bold = True
    # Data rows
    for r_idx, row in enumerate(rows):
        for c_idx, val in enumerate(row):
            table.rows[r_idx + 1].cells[c_idx].text = str(val)
    return table

def add_footer(doc):
    doc.add_paragraph("")
    p = doc.add_paragraph()
    run = p.add_run(f"Generated {datetime.now().strftime('%Y-%m-%d')} | Siempre Spirits | Confidential")
    run.italic = True
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(128, 128, 128)


# ============================================================
# 1. PRICING
# ============================================================
def build_pricing():
    doc = Document()
    add_title(doc, "CA Pricing -- Current & Historical")
    add_para(doc, "California | Distributor: Winebow | Updated April 2026", bold=True)

    add_section(doc, "Current Price Files")
    add_bullet(doc, "Format: .xlsm workbooks per SKU (Plata, Reposado, Anejo, Supremo)")
    add_bullet(doc, "Location: Winebow internal systems + Siempre shared drive")
    add_bullet(doc, "Digital price book: winebow.cld.bz/Winebow-CA")

    add_section(doc, "Pricing Restructuring (Jan 2026 -- Present)")
    add_para(doc, "A pricing restructuring has been in progress since January 2026. Key details:")
    add_bullet(doc, "Legacy accounts grandfathered at previous pricing with 30-day transition window")
    add_bullet(doc, "New accounts onboarded at restructured pricing immediately")
    add_bullet(doc, "Discrepancies found between quotes from Sam Deer vs. Austin -- governance not yet formalized")
    add_bullet(doc, "Goal: single source of truth for all CA pricing by end of Q2 2026")

    add_section(doc, "Chain-Specific Pricing")
    add_table(doc,
        ["Chain / Account", "Notes"],
        [
            ["Costco", "Sunnyvale HQ controls all CA locations. Rebel Cask program active. Dedicated rep: George Canham."],
            ["Albertsons", "Ops based in CA. Chain pricing negotiated at HQ level."],
            ["Pavilion", "Chain pricing in effect."],
            ["Vons", "Chain pricing in effect (Albertsons subsidiary)."],
        ])

    add_section(doc, "Historical Context")
    add_para(doc, "California is Siempre's largest US market historically (6,288 cases over 6 years, 2,142 purchases). Pricing stability is critical to maintaining this position.")

    add_footer(doc)
    path = os.path.join(BASE, "Pricing", "CA Pricing \u2014 Current & Historical.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# 2. CONTACTS
# ============================================================
def build_contacts():
    doc = Document()
    add_title(doc, "CA Contacts -- Winebow")
    add_para(doc, "California Distributor Contact Directory | Updated April 2026", bold=True)

    add_section(doc, "Primary Contacts")
    add_table(doc,
        ["Name", "Role", "Email", "Phone"],
        [
            ["Sam Deer", "Brand Manager", "Sam.Deer@winebow.com", "415.378.7792"],
            ["Dan Eddy", "Spirits Director", "Dan.Eddy@winebow.com", "707.564.0838"],
        ])

    add_section(doc, "LA Team")
    add_table(doc,
        ["Name", "Role / Notes", "Phone"],
        [
            ["Christina Fava", "LA Rep", ""],
            ["Katie Hein", "LA Rep (60+ target accounts)", "805.895.9983"],
            ["Kyle Quintero", "LA Rep (45 target accounts)", "310.892.0104"],
            ["Blanca Sanchez", "LA Rep", ""],
            ["Casey Chandler", "LA Rep", ""],
            ["Ian Prichard", "LA Rep", ""],
        ])

    add_section(doc, "Key Account Reps")
    add_table(doc,
        ["Name", "Account / Role", "Notes"],
        [
            ["George Canham", "Costco", "Dedicated Costco rep"],
            ["Joyce Rickenbaker", "Mollie Stone's", "Specialty grocery opportunity"],
        ])

    add_section(doc, "PBG (Prestige Beverage Group)")
    add_table(doc,
        ["Name", "Role"],
        [
            ["Brandon Chicone", "PBG Contact"],
            ["Kelsie Johnson", "PBG Contact"],
            ["Michelle Nelson", "PBG Contact"],
        ])

    add_section(doc, "Accounts Receivable")
    add_para(doc, "AR / Billbacks: ARBillbacks@winebow.com")

    add_footer(doc)
    path = os.path.join(BASE, "Contacts", "CA Contacts \u2014 Winebow.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# 3. PROGRAMS
# ============================================================
def build_programs():
    doc = Document()
    add_title(doc, "CA Programs -- Active & Planned")
    add_para(doc, "California Market Programs | Updated April 2026", bold=True)

    add_section(doc, "LA Market Blitz -- April 15-17, 2026")
    add_para(doc, "Status: CONFIRMED", bold=True)
    add_bullet(doc, "Participants: Nick + Alex (in-market)")
    add_bullet(doc, "30+ accounts contacted via email blast (April 6)")
    add_bullet(doc, "2 appointments confirmed as of April 6")
    add_bullet(doc, "Target lists: Katie Hein (60+ accounts), Kyle Quintero (45 accounts, provided as Excel)")
    add_bullet(doc, "Focus: on-premise activations, tastings, relationship building")

    add_section(doc, "Bartender Battle")
    add_para(doc, "Status: PLANNING", bold=True)
    add_bullet(doc, "Concept in development for LA market")
    add_bullet(doc, "Details TBD -- coordinating with Winebow LA team")

    add_section(doc, "Costco Rebel Cask Program")
    add_para(doc, "Status: ACTIVE", bold=True)
    add_bullet(doc, "Program live in Costco locations via George Canham")
    add_bullet(doc, "Rebel Cask SKU positioned as exclusive/limited offering")

    add_section(doc, "VIP Daily File Integration")
    add_para(doc, "Status: LIVE -- WITH ISSUES", bold=True)
    add_bullet(doc, "VIP daily file feed is technically live")
    add_bullet(doc, "CA data not showing reliably -- flagged by Monica on April 6")
    add_bullet(doc, "All 2026 forecast actuals showing NULL due to broken feed")
    add_bullet(doc, "Requires Winebow/VIP coordination to resolve")

    add_section(doc, "POS Materials Distribution")
    add_bullet(doc, "Materials distributed March 23, 2026")
    add_bullet(doc, "Coordinated with Winebow LA reps for account placement")

    add_section(doc, "Monthly Billback Program")
    add_para(doc, "Status: ACTIVE", bold=True)
    add_bullet(doc, "Ongoing monthly billback submissions through Winebow")
    add_bullet(doc, "AR contact: ARBillbacks@winebow.com")
    add_bullet(doc, "Latest invoices processed April 2, 2026")

    add_footer(doc)
    path = os.path.join(BASE, "Programs", "CA Programs \u2014 Active & Planned.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# 4. REPORTS
# ============================================================
def build_reports():
    doc = Document()
    add_title(doc, "CA Market Performance Report")
    add_para(doc, "California | Siempre Tequila | Updated April 2026", bold=True)

    add_section(doc, "Market Summary")
    add_para(doc, "LARGEST US MARKET", bold=True)
    add_table(doc,
        ["Metric", "Value"],
        [
            ["6-Year Total Cases", "6,288"],
            ["6-Year Total Purchases", "2,142"],
            ["Distributor", "Winebow"],
            ["Warehouse", "DiverPort"],
        ])

    add_section(doc, "DiverPort Warehouse Inventory")
    add_table(doc,
        ["SKU", "Cases On Hand", "On Order"],
        [
            ["Plata", "33.50", "--"],
            ["Reposado", "32.67", "--"],
            ["Anejo", "19.00", "20.00"],
            ["TOTAL", "102.67", "20.00"],
        ])
    add_para(doc, "Note: 102.67 total cases on hand. 20 cases of Anejo on order.")

    add_section(doc, "2026 Forecast vs. Actuals")
    add_para(doc, "WARNING: All 2026 actuals are NULL. VIP/Winebow data feed is broken. CA forecast tracking is currently blind.", bold=True)
    add_table(doc,
        ["Month", "Target (Cases)", "Actual (Cases)", "Variance"],
        [
            ["January", "82", "NULL", "N/A"],
            ["February", "77", "NULL", "N/A"],
            ["March", "105", "NULL", "N/A"],
            ["April", "104", "NULL", "N/A"],
            ["May", "TBD", "NULL", "N/A"],
            ["June", "TBD", "NULL", "N/A"],
        ])

    add_section(doc, "Monthly Targets (2026)")
    add_bullet(doc, "January: 82 cases")
    add_bullet(doc, "February: 77 cases")
    add_bullet(doc, "March: 105 cases")
    add_bullet(doc, "April: 104 cases")

    add_section(doc, "Data Quality Issues")
    add_bullet(doc, "VIP daily file integration is live but CA data not flowing reliably")
    add_bullet(doc, "Monica flagged CA as ongoing issue on April 6, 2026")
    add_bullet(doc, "Until resolved, all 2026 performance tracking is compromised")

    add_footer(doc)
    path = os.path.join(BASE, "Reports", "CA Market Performance Report.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# 5. COMPLIANCE
# ============================================================
def build_compliance():
    doc = Document()
    add_title(doc, "CA Regulatory Reference")
    add_para(doc, "California Compliance & Regulatory Notes | Updated April 2026", bold=True)

    add_section(doc, "State Classification")
    add_bullet(doc, "California is a LICENSE state (not control/monopoly)")
    add_bullet(doc, "Three-tier system enforced: supplier -> distributor -> retailer")

    add_section(doc, "Supplier Registration")
    add_bullet(doc, "Supplier registration with ABC (Alcoholic Beverage Control) required")
    add_bullet(doc, "Out-of-state suppliers must register and maintain active status")
    add_bullet(doc, "Siempre registered through Winebow as distributor of record")

    add_section(doc, "Price Posting")
    add_bullet(doc, "Price posting IS required in California")
    add_bullet(doc, "Posted prices must be maintained -- no selling below posted price")
    add_bullet(doc, "Changes require proper notice period")

    add_section(doc, "County & City Variance")
    add_para(doc, "California has significant county-by-county and city-by-city regulatory variance:")
    add_bullet(doc, "Local licensing requirements vary by jurisdiction")
    add_bullet(doc, "Hours of sale restrictions differ by municipality")
    add_bullet(doc, "Some counties have additional permit requirements")
    add_bullet(doc, "Always verify local requirements for new account activations")

    add_section(doc, "Chain HQ Locations")
    add_table(doc,
        ["Chain", "HQ / Decision Point", "Notes"],
        [
            ["Costco", "Sunnyvale, CA", "All CA locations controlled from Sunnyvale HQ"],
            ["Albertsons", "Operations in CA", "Chain ops based in California; includes Vons, Pavilion"],
        ])

    add_section(doc, "Key Regulatory Contacts")
    add_para(doc, "California ABC: www.abc.ca.gov")
    add_para(doc, "For compliance questions, consult legal counsel before taking action.")

    add_footer(doc)
    path = os.path.join(BASE, "Compliance", "CA Regulatory Reference.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# 6. CORRESPONDENCE
# ============================================================
def build_correspondence():
    doc = Document()
    add_title(doc, "CA Key Email Threads")
    add_para(doc, "California Correspondence Log | Updated April 2026", bold=True)

    add_section(doc, "April 6, 2026 -- VIP Reporting Issues")
    add_bullet(doc, "Monica flagged that CA data is not showing reliably in VIP reporting")
    add_bullet(doc, "Ongoing issue -- CA is one of several markets affected")
    add_bullet(doc, "Impact: All 2026 forecast actuals showing NULL")

    add_section(doc, "April 6, 2026 -- LA Outreach Blast")
    add_bullet(doc, "30+ emails sent to LA on-premise accounts")
    add_bullet(doc, "Purpose: Set appointments for LA Market Blitz (April 15-17)")
    add_bullet(doc, "2 confirmed responses as of send date")
    add_bullet(doc, "Follow-up planned through Winebow LA reps")

    add_section(doc, "April 2, 2026 -- VIP Setup Form")
    add_bullet(doc, "VIP daily file setup form submitted/processed")
    add_bullet(doc, "Integration configured but data quality issues emerged")

    add_section(doc, "April 2, 2026 -- Winebow Billback Invoices")
    add_bullet(doc, "Monthly billback invoices processed")
    add_bullet(doc, "Submitted to ARBillbacks@winebow.com")

    add_section(doc, "March 31, 2026 -- LA Target Account Lists")
    add_bullet(doc, "Katie Hein provided list of 60+ target accounts")
    add_bullet(doc, "Kyle Quintero provided list of 45 accounts (Excel format)")
    add_bullet(doc, "Lists used to build LA Market Blitz outreach plan")

    add_section(doc, "March 24, 2026 -- Mollie Stone's Opportunity")
    add_bullet(doc, "Opportunity flagged at Mollie Stone's (specialty grocery)")
    add_bullet(doc, "Contact: Joyce Rickenbaker")
    add_bullet(doc, "Follow-up in progress")

    add_section(doc, "March 23, 2026 -- POS Materials Distribution")
    add_bullet(doc, "POS materials shipped/distributed to Winebow LA team")
    add_bullet(doc, "For placement at target on-premise accounts")

    add_footer(doc)
    path = os.path.join(BASE, "Correspondence", "CA Key Email Threads.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# 7. MEETING NOTES
# ============================================================
def build_meeting_notes():
    doc = Document()
    add_title(doc, "CA Meeting Notes -- Granola")
    add_para(doc, "California Meeting Notes Archive | Updated April 2026", bold=True)

    add_section(doc, "Winebow Pricing Crisis Resolution")
    add_para(doc, "Context: Pricing discrepancies discovered between what Sam Deer was quoting to accounts vs. what Austin was receiving/expecting. Required intervention to align.")
    add_section(doc, "Key Decisions", level=2)
    add_bullet(doc, "Grandfathered legacy accounts at their existing pricing")
    add_bullet(doc, "30-day transition window for legacy accounts to adjust to new pricing")
    add_bullet(doc, "New accounts onboarded at restructured pricing immediately")
    add_bullet(doc, "Pricing governance needs formalization -- single source of truth required")

    add_section(doc, "Pricing Discrepancies")
    add_bullet(doc, "Sam Deer was quoting lower prices to some accounts than Austin was seeing in the system")
    add_bullet(doc, "Root cause: lack of centralized pricing authority and communication gaps")
    add_bullet(doc, "Resolution: all pricing changes must flow through approved channels")

    add_section(doc, "Communication Delays")
    add_bullet(doc, "Recurring delays in responses from Sam Deer and Dan Eddy")
    add_bullet(doc, "Winebow reps initially hesitant to engage on Siempre")
    add_bullet(doc, "After direct outreach and market visits, reps became more engaged")
    add_bullet(doc, "Ongoing relationship management needed to maintain momentum")

    add_section(doc, "Opici Exploration")
    add_bullet(doc, "Opici explored as alternative distributor for California")
    add_bullet(doc, "Evaluated as potential replacement or supplementary option")
    add_bullet(doc, "Decision: continue with Winebow but monitor performance")
    add_bullet(doc, "Opici remains a viable fallback if Winebow engagement drops")

    add_section(doc, "Winebow Rep Engagement")
    add_bullet(doc, "Initial hesitation from Winebow field reps to push Siempre")
    add_bullet(doc, "LA Market Blitz and direct outreach helped build rep buy-in")
    add_bullet(doc, "POS materials distribution (Mar 23) gave reps tools to work with")
    add_bullet(doc, "Continued in-market presence critical to sustaining engagement")

    add_footer(doc)
    path = os.path.join(BASE, "Meeting Notes", "CA Meeting Notes \u2014 Granola.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# 8. UPDATE LEDGER
# ============================================================
def build_ledger():
    doc = Document()
    add_title(doc, "CA Ledger")
    add_para(doc, "California Market Ledger | Siempre Tequila | Updated April 6, 2026", bold=True)

    add_section(doc, "Market Overview")
    add_table(doc,
        ["Field", "Value"],
        [
            ["State", "California"],
            ["Distributor", "Winebow"],
            ["Market Type", "License State"],
            ["Status", "YELLOW"],
            ["6-Year Cases", "6,288"],
            ["6-Year Purchases", "2,142"],
            ["Warehouse Inventory", "102.67 cases (DiverPort)"],
        ])

    add_section(doc, "Status: YELLOW")
    add_para(doc, "VIP data feed is broken. Flying blind on 2026 actuals. All forecast tracking compromised until Winebow/VIP integration is restored.", bold=True)

    add_section(doc, "Upcoming")
    add_bullet(doc, "LA Market Blitz: April 15-17 with Nick (2 appointments confirmed, 30+ pending)")

    add_section(doc, "Flags")
    add_bullet(doc, "FLAG: All 2026 forecast actuals are NULL -- VIP/Winebow data not flowing")
    add_bullet(doc, "FLAG: Pricing governance not formalized -- discrepancies found between quotes from Sam Deer vs. Austin")

    add_section(doc, "Bright Spots")
    add_bullet(doc, "Largest historical US market: 6,288 cases over 6 years")
    add_bullet(doc, "102.67 cases currently in Winebow warehouse (DiverPort)")
    add_bullet(doc, "Costco Rebel Cask program active")
    add_bullet(doc, "LA team engaged with target lists (105+ accounts identified)")

    add_section(doc, "Key Contacts")
    add_table(doc,
        ["Name", "Role", "Contact"],
        [
            ["Sam Deer", "Brand Manager", "Sam.Deer@winebow.com / 415.378.7792"],
            ["Dan Eddy", "Spirits Director", "Dan.Eddy@winebow.com / 707.564.0838"],
            ["Katie Hein", "LA Rep", "805.895.9983"],
            ["Kyle Quintero", "LA Rep", "310.892.0104"],
        ])

    add_section(doc, "Active Programs")
    add_bullet(doc, "LA Market Blitz (Apr 15-17)")
    add_bullet(doc, "Costco Rebel Cask -- ACTIVE")
    add_bullet(doc, "VIP Daily File -- LIVE (broken)")
    add_bullet(doc, "Monthly Billback Program -- ACTIVE")
    add_bullet(doc, "Bartender Battle -- PLANNING")

    add_section(doc, "Next Actions")
    add_bullet(doc, "Resolve VIP data feed for CA (coordinate with Monica + Winebow)")
    add_bullet(doc, "Finalize LA Market Blitz appointments (30+ pending)")
    add_bullet(doc, "Formalize pricing governance -- single source of truth")
    add_bullet(doc, "Follow up on Mollie Stone's opportunity (Joyce Rickenbaker)")

    add_footer(doc)
    path = os.path.join(BASE, "CA Ledger.docx")
    doc.save(path)
    print(f"  Saved: {path}")


# ============================================================
# RUN ALL
# ============================================================
if __name__ == "__main__":
    print("Building California .docx files...")
    build_pricing()
    build_contacts()
    build_programs()
    build_reports()
    build_compliance()
    build_correspondence()
    build_meeting_notes()
    build_ledger()
    print("\nDone. 7 files + ledger updated.")
