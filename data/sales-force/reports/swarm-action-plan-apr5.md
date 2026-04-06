# Siempre Swarm Action Plan — April 5, 2026
**The OS upgrade: from one-thread Claude to a structured organization**

---

## THE ORG CHART

This is the architecture Alex described — modeled after how Diageo, Pernod Ricard, and Brown-Forman structure their sales organizations. Each division has clear ownership, its own knowledge base, and doesn't bleed into other divisions.

```
                         ┌─────────────┐
                         │    ALEX     │
                         │  CEO / ECD  │
                         └──────┬──────┘
                                │
            ┌───────────┬───────┼───────┬────────────┐
            │           │       │       │            │
     ┌──────┴──────┐ ┌──┴───┐ ┌┴────┐ ┌┴──────┐ ┌───┴────┐
     │  NATIONAL   │ │CREAT-│ │ OPS │ │ SIDE  │ │INTERNAL│
     │   SALES     │ │ IVE  │ │     │ │BUILDS │ │  OPS   │
     └──────┬──────┘ └──┬───┘ └┬────┘ └┬──────┘ └───┬────┘
            │           │      │       │            │
    ┌───────┼────┐      │      │       │            │
    │       │    │      │      │       │            │
  STATE   STATE STATE   │      │       │            │
  AGENTS  AGENTS ...    │      │       │            │
```

---

## DIVISION 1: NATIONAL SALES — State/Province Agent Network

**What Alex said:** "One agent should be entirely in charge of one state so there's no cross-contamination. It should resemble the org chart of a sales force at Diageo."

**Architecture:**
Each state/province gets a dedicated agent (implemented as a skill + scheduled task) that owns:
- Regulatory framework (posting rules, compliance, license types)
- Distributor details (contacts, rep names, warehouse locations)
- Channel pricing (on-premise vs off-premise, how they purchase)
- Historical context (Granola meeting notes, email threads, pricing history)
- FOB/SRP/margin structure for that market

**Org structure within National Sales:**
- **Regional Directors** (aggregate agents that roll up state reports):
  - West Region: WA, OR, CA, CO, NV, AZ
  - Central Region: TX, OK, NE, KS, MO, WI, MN, IL
  - South Region: MS, LA, GA, FL, SC, NC
  - Northeast Region: NY, NJ, CT, MA
  - Canada: AB, BC, ON, SK
- **State Agents** (one per active market): Each wakes up knowing their state cold
- **VP National Sales** (orchestrator): Rolls up all regional reports, identifies cross-market patterns, flags stale markets

**Immediate actions:**
1. Build the State Agent skill template (one template, parameterized per state)
2. Seed the first 5 states with existing data: Mississippi, Oklahoma, Washington, Wisconsin, Missouri/Kansas
3. Mine Gmail + Granola for distributor contacts and meeting notes per state
4. Reconcile with existing Pricing Portfolio Review and multi-state pricing tracker
5. Store each state's knowledge base on Opus Google Drive in structured folders

**Existing work that feeds in:**
- Mississippi reset session → Mississippi agent knowledge
- Oklahoma pricing laws → Oklahoma agent knowledge
- Pricing portfolio review → Master pricing board
- Multi-state pricing tracker → 38-state reconciliation data
- Pricing intelligence skill → Core pricing methodology

---

## DIVISION 2: CREATIVE AGENCY

**What Alex said:** "Run the 60 carousel posts through Thanks Tim, then design team uses Nano Banana Pro to produce everything for review."

**Architecture:**
- **Thanks Tim Creative Engine** (strategy + concepting)
- **Design Team** (execution via Nano Banana Pro + design-taste scoring)
- **Image Vectorization API** (when needed for print-ready assets)
- **Siempre Bottle Library** (real product shots for compositing)

**Pipeline:** Brief → Thanks Tim teams pitch → CD review → Design team executes → Nano Banana Pro generates → Design taste scores → Alex reviews

**Active projects:**
1. **60 Carousel Posts** — 10 done, 50 remaining. Run all through Thanks Tim for creative refinement, then design swarm produces final assets.
2. **Chismé LCBO Sell Sheet** — Built, needs deployment to shareable link. Alex reviewing now.
3. **RTD Coffee Project** — Ongoing across multiple sessions. CHUPÁ naming done, Hero Copper design selected. NOT archiving — active product development.

**Quick win for Alex:**
The Chismé sell sheet HTML exists at the old session path. I need to pull it into this workspace and deploy it (likely via Netlify) to give Alex a shareable link.

---

## DIVISION 3: OPERATIONS

**What Alex said:** "Calculate true COGS for Chismé... it lives in an entire universe we need to create for operations."

**Architecture:**
- **COGS / Financial Ops** — Product costing, freight analysis, margin modeling
- **Inventory & Supply Chain** — Plata credits, PO tracking, warehouse
- **HR Agent** — Daily monitoring of connected systems, tracks leave/sick/happiness, maintains own HRMD
- **Legal/Compliance Archive** — Gary's agreement, AGLC docs, Charlie documentation

**HR Agent spec (new build):**
- Wakes up daily, checks connected systems (Google Calendar, Gmail, Slack)
- Tracks: sick days, vacation days, absences, communication patterns
- Maintains its own HRMD (HR Memory Document) that persists across sessions
- Flags: someone hasn't been seen in X days, unusual patterns, compliance issues
- Does NOT depend on Humi — works with what's connected

**File storage decisions:**
- Chismé COGS work → Opus Google Drive (operations folder)
- Gary's tequila brand agreement (30+ page forensic report) → Opus / Legal
- AGLC agency analysis → Opus / Legal (same universe as Gary/Charlie docs)
- Plata inventory credit emails → Opus / Operations

---

## DIVISION 4: SIDE BUILDS & PERSONAL PROJECTS

**What Alex said:** "The beat-making software is not finished. Bridger — are we working on that thing or what, bro?"

**These are Alex's passion projects that keep getting buried by ops work. The solve: a Side Projects Tracker agent that surfaces them weekly.**

**Active projects:**
1. **ACID.AI** (beat maker) — v4 done (2,876 lines), feature-complete but Alex wants to keep iterating. Personal creative project.
2. **Bridger** (unified video meeting app) — Full 24-file scaffold built, 3-sprint roadmap ready. Needs Sprint 1 kickoff.
3. **RTD Coffee (CHUPÁ)** — Cross-session project. Naming done, design sim done (Hero Copper). Active product development.
4. **FieldKit** (white-label sales assistant) — Running in Claude Code. Needs real Siempre data backfilled. Currently hallucinating products (Supremo Extra Añejo, Cristalino). UI/UX needs iteration.
5. **GAWD** — Active development. Two production fixes shipped. Void UI redesign in progress (2001 aesthetic). Multiple tracks active.

**Agent spec:** Weekly reminder agent that surfaces these projects, shows last-touched date, and asks "which one do you want to pick up?"

---

## DIVISION 5: INTERNAL OPS & FILE SYSTEM

**What Alex said:** "We should have a repository or an index at the top of that Opus hard drive that any agent can refer to, to know where every file is."

**Architecture:**
- **Opus Drive Master Index** — A single document at the root of the Opus shared drive that catalogs every file, its purpose, and its location. Any agent can read this first instead of searching.
- **Cowork Project Organizer** — Sub-agent that sorts sessions into projects without disrupting running agents. Runs at end of day or on demand.
- **Disk/File Hygiene** — Leverages existing cleanup strategy (13.5GB script) + project command centre work that never got used.

**Immediate actions:**
1. Scan Opus Google Drive current structure
2. Build master index document
3. Begin filing completed work into proper folders
4. Set up Cowork project organization (careful sequencing — runs last, doesn't interfere)

---

## DIVISION 6: EVENTS & ACCOUNT MANAGEMENT

**What Alex said:** "Have that sub-agent monitor festivals from an account management level."

**Active accounts:**
1. **Badlands / Blueprint (Nate Sabine)** — Email sent April 3, Nate replied April 4 ("Let's work through it Tuesday"). Next action: Tuesday follow-up. $30K commitment, 128 of 500 forecasted cases sold. Resolution path needed (credit/adjustment/alternative).
2. **BCB Brooklyn / Ana Rose** — Workshop pitch sent, they replied. Needs continuation — what did they say? Next steps?
3. **Bartender Battle (Calgary)** — ACTIVE PROJECT. Needs full reconciliation (see below).

---

## IMMEDIATE EXECUTION QUEUE

These are the things that need to happen NOW or very soon, ordered by urgency:

### TODAY / TOMORROW

| # | Action | Type |
|---|--------|------|
| 1 | **Show Alex the Chismé sell sheet** | Quick win — deploy to viewable link |
| 2 | **Show Alex the shareholder email draft** | Quick win — presented below |
| 3 | **Research programmatic fax sending** for CRA objection | Research — Alex wants to send tomorrow |
| 4 | **Archive 5 stale sessions** | Cleanup |
| 5 | **Rotate exposed Gemini API keys** | Security |

### THIS WEEK

| # | Action | Type |
|---|--------|------|
| 6 | **Bartender Battle reconciliation** — Pull all signups + interested ticket buyers from email syncs, compile report, prep for BevCo/bar handoff | Project |
| 7 | **Badlands Tuesday follow-up prep** — Have context ready for Alex's conversation with Nate | Account mgmt |
| 8 | **BCB Brooklyn / Ana Rose** — Read reply, draft next steps | Account mgmt |
| 9 | **60 carousel posts → Thanks Tim pipeline** | Creative project |
| 10 | **Begin State Agent template design** | Architecture |

### THIS MONTH

| # | Action | Type |
|---|--------|------|
| 11 | **Build Opus Drive master index** | File system |
| 12 | **Seed first 5 state agents** (MS, OK, WA, WI, MO/KS) | National Sales |
| 13 | **Build HR Agent** with own HRMD | Operations |
| 14 | **FieldKit data backfill** with real Siempre products | Side build |
| 15 | **Cowork project organization** | Internal ops |
| 16 | **File legal docs** (Gary, AGLC, Charlie) to Opus | Filing |
| 17 | **File Chismé COGS work** to Opus | Filing |

### ONGOING / RECURRING

| # | Action | Type |
|---|--------|------|
| 18 | **Side Projects weekly surface** (ACID.AI, Bridger, CHUPÁ, FieldKit, GAWD) | Reminder |
| 19 | **Festival account monitoring** (Badlands, future events) | Account mgmt |
| 20 | **Note for Alex: register Bridge Media Group** ($60, business.ontario.ca) | Personal reminder |

---

## SHAREHOLDER EMAIL — READY FOR YOUR REVIEW

**To:** [Shareholder name needed]
**Subject:** Re: Shareholder Letter Feedback

[Name],

Really appreciate you taking the time to go through the update — and the candid notes. That's exactly the kind of feedback that makes us better.

The quarterly YoY view is a great call. We'll build that into the next update for both depletions and revenue so you can see actual growth stripped of seasonality. And you're right — we shouldn't sugarcoat what's not working. Canada is carrying the load right now and the US needs to move at a completely different clip. We know that, and we're on it. Same with Plata — we'll address both head-on next quarter.

Now — on the bottle. You're reading our mind, and I want to share something with you.

We've been developing a ceramic bottle (we call it the Ceramico) for exactly the reason you described — something that commands attention on a back bar the way Clase Azul or Cincoro does, but is unmistakably Siempre. I'll send over the designs so you can see where we're headed.

Here's where it gets interesting: we have Extra Añejo sitting in barrels at the original distillery right now. It's literally the same liquid profile as Cincoro's Extra Añejo — which retails at $1,700 a bottle — except ours has no additives. The plan has always been to release this as a separate line extension, not to dilute the core range, but to give us a true ultra-premium halo SKU.

The operations side and sales team can handle the additional SKU — it slots right in. The constraint is capital on the production side. We're looking at roughly $27 per ceramic bottle, plus another $5–6/unit for print, engraving, and inner packaging. We have a warehouse full of wood boxes ready to go. The unlock is about $200K in production capital, which in turn releases approximately $2M in value from what's already sitting in those barrels. It's on our list and it's real — we just need to free up the capital to make it happen.

One more thing — and I'll be candid about this because I think you'll appreciate it. I actually coded the shareholder portal and app myself. We built a product called Combobulator that generates these reports, and I wanted to share the demo with you: [INSERT DEMO LINK]. One of our lead strategic investors saw it and asked whether their other portfolio companies could beta test it. So there may be something there beyond Siempre.

Thanks again for the transparency note — right back at you. This is exactly how the relationship should work.

Alex

**YOUR ACTION ITEMS:**
1. Insert shareholder's name
2. Insert Combobulator demo link
3. Decide: attach Ceramico design files now or send separately?

---

## BADLANDS CONTEXT (for your records)

**Your email to Nate (April 3, 8:01 PM PDT):**
Sent to nate@thisisblueprint.com, BCC'd Eli Diamond, Monica, Rick Harper. You opened with appreciation for Blueprint's production quality, took responsibility for coming "in hot" on the call, then laid out the business case: $30K committed, 500 cases forecasted, 128 cases actual (74% miss). Framed it as structural failure not festival chaos. Proposed finding a resolution path. Attached Badlands_2025_Partnership_Review.docx.

**Nate's reply (April 4, 7:02 AM PDT):**
Short and warm. Confirmed receipt, genuinely appreciative. Taking a long weekend. Committed to working through it Tuesday morning.

**Next move:** Tuesday follow-up. Have your resolution ask ready (credit, adjustment, or restructured deal for next event).

---

## NOTES ON ARCHIVING DECISIONS

**Archive now:** Badlands sponsorship risk doc, Calgary Bartender Battle design feedback, Bridge Media Group (note: register for $60), Podcast demo for Eli, April Fools announcement (rotate API keys first), 5 stale empty sessions

**Archive but remember location:** RTD coffee naming (CHUPÁ — trademark clear, Class 33), Image vectorization API (design swarm knows about it), Fight CRA claim (KEEP until fax sent, then archive)

**DO NOT archive:** RTD Coffee Design Sim (active project), ACID.AI (active project), Bartender Battle forms (active project), Workshop/Ana Rose BCB (they replied, keep rolling)

**Store to Opus Drive:** Mississippi reset → /Sales/Mississippi/, Oklahoma pricing → /Sales/Oklahoma/, Gary's agreement → /Legal/, AGLC analysis → /Legal/, Chismé COGS → /Operations/
