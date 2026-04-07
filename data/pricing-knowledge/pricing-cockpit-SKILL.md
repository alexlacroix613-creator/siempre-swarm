---
name: pricing-cockpit
description: |
  Daily pricing workflow engine for Siempre Spirits. Runs the full pricing project lifecycle: scan emails across 3 inboxes (Alex, Rick, Nimpha), reconcile with master tracker, surface 2-3 priority tasks, build pricing sheets, draft distributor emails, and monitor for confirmations. Use this skill ANY time Alex says 'pricing cockpit', 'pricing workflow', 'daily pricing', 'what pricing needs doing', 'pricing pulse', 'run pricing', 'pricing tasks', 'tackle pricing', 'pricing follow-ups', 'distributor pricing', 'what states need pricing', 'pricing check-in', or any request to work through the state pricing queue. Also triggers on: 'what did distributors say', 'any pricing replies', 'build a pricing sheet for [state]', 'draft the pricing email for [state]', 'where are we on pricing', 'pricing accountability', 'pricing status'. This is the daily driver — it knows the full state of every market and pushes Alex through 2-3 tasks per session.
---

# Pricing Cockpit — Daily Pricing Workflow Engine

## Purpose

This skill is the daily accountability system for Siempre's pricing project across 38 markets. It runs an interactive workflow that walks Alex through 2-3 pricing tasks per session, from email triage through pricing sheet delivery and distributor communication.

## Dependencies

This skill relies on:
- **pricing-intelligence** — Calculations, validation, SKU reference, margin rules
- **maton-gateway** — Gmail (3 inboxes), Google Drive, Google Sheets, Zoho Books
- **ceo-os** — Memory files, morning briefing integration


## MANDATORY EMAIL RULES — READ BEFORE ANY EMAIL ACTION

**CRITICAL: Every session that drafts or sends emails MUST follow these rules. No exceptions.**

1. **NEVER send an email without Alex's explicit approval.** Draft it, present the FULL text in chat, wait for "send it" or edits.
2. **NEVER use generic templates verbatim.** Every email must be personalized with real context from thread history.
3. **Read the full email thread history** before drafting a reply. Reference specific details from recent interactions.
4. **Two versions for outreach:** Rep Version (ammo for accounts, FaceTime tasting offer) vs Manager Version (strategic, team support).
5. **Always CC:** monica@siempretequila.com, nimpha@siempretequila.com
6. **Alex's tone:** Personal, direct, casual-professional. "Hey [First Name]!" — short paragraphs, genuine warmth, concrete offers.
7. **Sign as Alex personally** — never "the Siempre team."

See `CLAUDE BRAIN/memory/feedback_email_process.md` for full style guide.

The workflow below is DRAFT → SHOW ALEX → WAIT FOR APPROVAL → SEND. If Alex is not in the chat (e.g., scheduled task running overnight), CREATE DRAFTS IN GMAIL and flag them for morning review. Do NOT auto-send.

## Memory File

The pricing cockpit maintains state in: `CLAUDE BRAIN/memory/pricing-tracker.json`

This file tracks every market's pricing status, last activity, owner, and next action. It is updated every time the cockpit runs.
## Workflow — The 13-Step Daily Loop

### PHASE 1: SCAN & RECONCILE (Steps 1-3)

**Step 1 — Scan Emails (3 inboxes)**

Search all three inboxes for pricing-related threads since last scan:

```
Alex inbox: subject:(pricing OR FOB OR "price change" OR SRP OR "pricing proposal") after:{last_scan_date}
Rick inbox: same query via RICK_KEY
Nimpha: from:nimpha@siempretequila.com (pricing OR distributor OR FOB) after:{last_scan_date}
```

Also scan for distributor replies to pending proposals:
- PBG/Prestige (partnerships@prestigebevgroup.com, schylerwood@, jashton@, whester@)
- Each state's distributor contact (from tracker)

**Maton API Keys:**
```
ALEX_KEY = "FltHv_SepU2bFZ9RZbgurdBBVqc18z32b9nZNluAAj2UaO9DYEmmOrbYH255y0nOiLxhiEuXtKXsfTc6lI1mMDGa1UVfsENG2fV0svAHCQ"
RICK_KEY = "a8a0haeSz7CBUAKvFgNaFTBkw9zLQeZIrutb7sWHNE2ylcft6-_ILI2REbSU_qawu_M-Vx-fGI7Wz-4YAMUbH4N4qT5Ocx3N2L9MhEP3SA"
```

**Step 2 — Check Nimpha's Distributor Tracker**

Search Google Drive for Nimpha's pricing/distributor tracker:
```
Google Drive search: "distributor" OR "pricing tracker" OR "state pricing" owner:nimpha@siempretequila.com
```
Also check the State Folders (folder ID: `1Pqdl0EbzTvMSiCoYLxUxvZWNaB9pTBsN`) and Rick's States folder (ID: `1HF6mQq2-L47cO33hDuMJaBFD0b3gVK9t`) for recently modified files.

**Step 3 — Reconcile & Prioritize**

Load `pricing-tracker.json`, cross-reference with new email findings and Drive activity. Update statuses. Then rank priorities using this scoring:

| Factor | Weight | Logic |
|--------|--------|-------|
| Days since last activity | 3x | >14 days = RED, >7 = YELLOW |
| Pending response from Alex | 5x | You committed to something — do it |
| Distributor replied waiting on us | 5x | They're engaged — don't lose momentum |
| Market tier (A > B > C) | 2x | Revenue priority |
| Upcoming meeting/event | 4x | Time-sensitive |
| Effective date approaching | 4x | Deadline pressure |

Present the **top 2-3 tasks** to Alex with full context.

### PHASE 2: BUILD (Steps 4-8)

**Step 4 — Alex Confirms Today's Tasks**

Present each task with:
- State, distributor, key contact
- Last email thread summary (quote subject line)
- What needs to happen (build pricing, follow up, resolve issue)
- Time estimate

Alex picks which to tackle. Use AskUserQuestion tool for selection.**Step 5 — Download & Build Pricing Sheet**

For states that need a pricing proposal:

1. Check Google Drive for existing pricing sheet in the state's folder
2. If exists, download and review via Maton Google Drive API
3. If not, generate from scratch using pricing-intelligence engine:
   ```bash
   python3 pricing_engine.py new-state <ST> --type <control|three-tier>
   python3 pricing_engine.py calculate <sku> --fob <price> --state <ST>
   ```
4. Cross-reference with:
   - Granola meeting notes (via Maton Granola API) for any discussed pricing points
   - Email thread history for distributor feedback/requests
   - Market targets from `references/market-targets.md`

5. Build the xlsx using openpyxl following the alex-pricing-style methodology:
   - Washington-style format: FOB → distributor margin → wholesale → retail margin → SRP
   - Include deal tiers (1-case, 3-case, 5-case, 10-case)
   - Color-code per financial model standards (blue = inputs, black = formulas)
   - Validate against margin floor (30% HARD STOP)

**Step 6 — Alex Reviews Pricing Sheet**

Present the pricing sheet with:
- Summary of key numbers (FOB, SRP targets, margin %)
- Any flags (margin below 30%, SRP outside target range)
- Comparison to similar states if available
- Link to the xlsx file
**Step 7 — Implement Approved Changes**

Once Alex approves:
- Finalize the xlsx
- Run validation: `python3 pricing_engine.py validate --fob <price> --cogs <cost> --sku <sku> --srp <price>`

**Step 8 — Save to Drive**

Name the file: `[State] Siempre Pricing [YYYY-MM-DD].xlsx`
Upload to the appropriate state folder in Google Drive via Maton:

```python
# Google Drive upload via Maton gateway
import urllib.request, json
API_KEY = "FltHv_SepU2bFZ9RZbgurdBBVqc18z32b9nZNluAAj2UaO9DYEmmOrbYH255y0nOiLxhiEuXtKXsfTc6lI1mMDGa1UVfsENG2fV0svAHCQ"

# Upload file to specific folder
# Use Google Drive API v3 multipart upload
```

### PHASE 3: COMMUNICATE (Steps 9-11)

**⚠️ APPROVAL GATE: Steps 9-11 require Alex's explicit approval before sending. If running as a scheduled task, save as Gmail draft and surface in morning briefing.**

**Step 9 — Draft Distributor Email**

Build the email with FULL CONTEXT:

1. Read the entire email thread history with this distributor
2. Check Granola for meeting notes with this contact
3. Reference specific conversation points (GSM plans, market visits, programs)
4. Include:   - Greeting referencing last interaction
   - What changed and why (pricing philosophy — not desperation)
   - Attached pricing sheet reference
   - Next steps (call, market visit, timeline)
   - Professional close

Always CC: monica@siempretequila.com, nimpha@siempretequila.com

**Step 10 — Alex Approves Draft**

Show the full email draft in chat. Wait for explicit approval or edits.

**Step 11 — Send**

Send via Maton Gmail API from alex@siempretequila.com:
- If replying to existing thread: use threadId, In-Reply-To, References headers
- If new thread: fresh message
- Always CC Monica and Nimpha
- Attach pricing sheet if applicable

### PHASE 4: MONITOR (Steps 12-13)

**Step 12 — Set Up Reply Monitoring**

After sending, update `pricing-tracker.json` with:
- `status`: "SENT - AWAITING RESPONSE"
- `sent_date`: today
- `thread_id`: Gmail thread ID for monitoring
- `follow_up_date`: today + 3 business days
The daily scheduled task will check for replies and push Alex to follow up if no response by the follow-up date.

**Step 13 — Repeat for Next Task**

Move to the next priority task from Step 3. Repeat the build-send-monitor loop.

## State Status Definitions

| Status | Meaning |
|--------|---------|
| CONFIRMED | Distributor confirmed pricing. Posted or effective date set. DONE. |
| SENT - AWAITING RESPONSE | Proposal sent, waiting for distributor reply |
| IN PROGRESS | Active work — building pricing, negotiating, resolving issues |
| FOLDER ONLY | Drive folder exists but no active pricing work |
| NOT STARTED | No folder, no emails, no activity |
| ACTIVE - REPRICING | Market needs pricing revision (e.g., SK small producer) |

## Email Templates

### New Pricing Proposal
```
Subject: Siempre x [State] | Pricing & Program Alignment

Hey [First Name],

[Reference last interaction — meeting, call, trade show, etc.]

Attached is our pricing proposal for [State]. [1-2 sentences on the approach — why these numbers, what market insight drove them.]

[If deal tiers]: We've built in tiered pricing to make it work at every level — [brief tier summary].
[If programs discussed]: On the programming side, [reference any discussed plans — GSMs, displays, cocktail events].

Would love to get on a call to walk through it together. [Suggest specific times if relevant.]

Best,
Alex

Alexandre M Lacroix
Chief Executive, Co-Founder
Siempre Spirits Limited
613-513-5382
alex@siempretequila.com
```

### Follow-Up (No Response)
```
Subject: Re: [Original subject]

Hey [First Name],

Just circling back on the pricing I sent over [X days ago]. Want to make sure it landed and see if you have any questions or feedback.

Happy to hop on a quick call to walk through the numbers — [suggest times].

Best,
Alex
```

### Confirmation Request```
Subject: Re: [Original subject]

[First Name] — great, glad we're aligned.

Can you confirm the pricing is entered/posted on your end? Just want to make sure we're locked in before [date/event].

Thanks,
Alex
```

## Key Contacts Reference

| State | Distributor | Key Contact | Email |
|-------|------------|-------------|-------|
| GA | UDIGA | David Benson | dbenson@udiga.com |
| NE | Johnson Brothers | Laura Shafer | lshafer@johnsonbrothers.com |
| MN | Johnson Brothers | Tim McClanahan | TMcClanahan@johnsonbrothers.com |
| WA | RNDC | Yogesh Shroff | Yogesh.Shroff@rndc-usa.com |
| KY | Heidelberg | Joe Hayden / Clay Carpenter | Joe.Hayden@heidelbergdistributing.com |
| CT | Curated Selections | Jack Townsend | jack@curatedselections.com |
| IL | Breakthru | Dan Benson | dbenson2@breakthrubev.com |
| AL | UDIGA Alabama | Brian Guilbeau | bguilbeau@udiala.com |
| CA | Winebow | Kimberly Rouse | Kimberly.Rouse@winebow.com |
| FL | JB Maverick | Robert Camacho | Rcamacho@jbmaverick.com |
| TN | ADC | Chase Good | cgood@adctn.com |
| LA | RNDC | Jeffrey Williams | Jeffrey.Williams@rndc-usa.com |
| NJ | Opici | Stephen Marencik | marenciks@opici.com |
| NH | Pine State | Scott E / Tim Babb | scote@pinestatetrading.com || WI | TBD | Dennis | TBD |
| OK | Artisan | TBD | TBD |
| PBG | Prestige Beverage | Justin Ashton / Schyler Wood | jashton@prestigebevgroup.com / schylerwood@prestigebevgroup.com |
| PBG Pricing | Prestige Pricing Team | Partnerships | partnerships@prestigebevgroup.com |
| PBG Control | Will Hester | Control States Dir | whester@prestigebevgroup.com |

## Integration with CEO OS

When the morning briefing runs, it should check `pricing-tracker.json` for:
- Any states where follow-up date has passed with no response
- Any states where Alex committed to building pricing and hasn't
- Any distributor replies that came in overnight

Surface these in the "Pricing" section of the morning briefing.