# State/Province Dossier Deployment Plan
## "Operation Sales Force" — Building Siempre's AI-Powered National Sales Org
**April 5, 2026**

---

## WHAT THE RECON FOUND

Four agents just swept Gmail (6 months), Google Drive (1,000+ files), Granola (meeting notes with real FOB pricing), and our three core skills. Here's the intelligence map:

### Data Richness by Market

**We know a LOT about these (Drive + Gmail + Granola + Pricing):**
Colorado, Texas, California, Washington, Kansas, Missouri, Oklahoma, Florida, Ontario, Alberta, BC

**We have email/drive activity but thin meeting intel:**
Oregon, Illinois, New York, Ohio, Michigan, Minnesota, Georgia, North Carolina, Arizona, Mississippi, Pennsylvania

**We have regulatory knowledge only (Canadian agency ops skill):**
Saskatchewan, Manitoba, Quebec

**We have NOTHING (26 states):**
Alaska, Arkansas, Connecticut, Delaware, Hawaii, Idaho, Indiana, Iowa, Kentucky*, Louisiana, Maine, Maryland, Massachusetts*, Nevada, New Hampshire, New Jersey, New Mexico, North Dakota, Rhode Island, South Carolina, South Dakota, Tennessee, Utah, Vermont, Virginia*, West Virginia, Wisconsin*, Wyoming

*Kentucky, Virginia, Wisconsin have some pricing/Granola data but no Drive folders

---

## THE DOSSIER TEMPLATE

Every state/province gets the same document structure. This is what a "State Agent" reads to become an instant expert:

```
STATE DOSSIER: [STATE NAME]
Last Updated: [date]
Market Tier: [1/2/3/4]
Status: [Active | Pipeline | Dormant | Not Entered]

═══════════════════════════════════════════

1. MARKET OVERVIEW
   - Control state vs. open market
   - Population / major metro areas
   - Spirits market size (if known)
   - Competitive landscape (who's strong here)

2. REGULATORY FRAMEWORK
   - Governing body (ABC, LCB, AGLC, etc.)
   - License types required (importer, wholesaler, brand registration)
   - Price posting rules (deadlines, lock periods, change lead times)
   - Labeling exceptions or state-specific requirements
   - Sampling/tasting rules
   - State registration fees and renewal cadence

3. DISTRIBUTION STRUCTURE
   - How the state works: 3-tier, franchise, open, etc.
   - On-premise purchasing path (from distributor? state store?)
   - Off-premise purchasing path
   - Key chain accounts and buying groups
   - DTC laws (if applicable)

4. OUR DISTRIBUTOR
   - Company name
   - Key contacts (name, role, email, phone)
   - Warehouse location(s)
   - Terms (payment terms, margin expectations)
   - Relationship status (hot, warm, cold, silent)
   - Last contact date
   - Open issues or disputes

5. PRICING
   - FOB per SKU (Plata, Repo, Añejo, Supremo, Rebel Cask, Vivo, Muerto, Chismé)
   - SRP targets per SKU
   - Supplier margin %
   - Distributor margin %
   - Retailer margin %
   - DA/SPA structure (if any)
   - Price file submission format and deadline
   - Last pricing update date

6. HISTORICAL CONTEXT
   - How we entered this market (date, circumstances)
   - Granola meeting notes summary
   - Key email thread summaries
   - Past issues or wins
   - Volume history (cases shipped/depleted)

7. OPERATIONS & LOGISTICS
   - Shipping route (origin → port → warehouse → distributor)
   - Landed cost estimate
   - 3PL/warehouse partner (if separate from distributor)
   - Lead time for orders
   - Import/customs notes specific to this state

8. KEY FILES ON OPUS DRIVE
   - [links to all state-specific files]

9. OPEN ITEMS & NEXT ACTIONS
   - [ ] Outstanding decisions
   - [ ] Pending emails
   - [ ] Pricing changes needed
   - [ ] Compliance renewals coming due

10. RISK FLAGS
    - Silent market? Days since last contact
    - Pricing out of date?
    - Compliance renewal approaching?
    - Distributor relationship cooling?
```

---

## DEPLOYMENT STRATEGY: 5 PHASES

### Why NOT 50 agents at once:
1. Each agent needs to search Gmail, Drive, and Granola — hitting all three APIs simultaneously with 50 agents would likely rate-limit or timeout
2. Rich-data states need deep mining; empty states just need web research. Different jobs.
3. We need the foundation layer (shared knowledge) built FIRST so every state agent inherits it instead of each one redundantly figuring out import compliance from scratch.

### PHASE 1: FOUNDATION (1 agent, runs first)
**What:** Build the shared knowledge base that EVERY state inherits
**Sources:** US Import License skill, Canadian Agency Ops skill, Pricing Intelligence skill, operations docs
**Output:** A `FOUNDATION.md` file containing:
- Federal import compliance baseline (TTB, COLA, customs, FET)
- COGS locked per SKU
- SRP methodology (5% above market average)
- Margin floors (30% supplier minimum)
- Standard DA/SPA structures
- Shipping/logistics baseline
- Product master list (all SKUs with correct names — no "Supremo Extra Añejo" hallucinations)
- Comms firewall rules (what never crosses state boundaries)

**Time:** ~5 minutes. One agent.

### PHASE 2: TIER 1 ACTIVE MARKETS (8 agents, parallel)
**What:** Deep dossier build for our most active markets
**States:** Colorado, Texas, California, Washington, Oregon, Florida, Illinois, Ontario
**Per-agent job:**
1. Read FOUNDATION.md
2. Search Gmail for all threads mentioning this state + its distributor (last 12 months)
3. Search Google Drive for all files in this state's folder
4. Search Granola for meeting notes mentioning this state
5. Web research: state regulatory body, posting rules, license requirements
6. Compile into full dossier template
7. Save to Opus Drive under `/Sales/[State]/DOSSIER.md`

**Time:** ~15-20 minutes for all 8 running in parallel. One batch.

### PHASE 3: TIER 2 ACTIVE MARKETS (12 agents, 2 batches of 6)
**What:** Same deep build for secondary markets
**States batch A (6):** New York, Ohio, Michigan, Minnesota, Missouri, Kansas
**States batch B (6):** Oklahoma, Georgia, North Carolina, Arizona, Mississippi, Pennsylvania
**Same job as Phase 2.** These have less data but still have real distributor activity.

**Time:** ~30 minutes (two sequential batches of 6 parallel agents)

### PHASE 4: CANADIAN PROVINCES (5 agents, parallel)
**What:** Deep build for Canadian markets with extra regulatory depth
**Provinces:** Alberta, British Columbia, Saskatchewan, Manitoba, Quebec
**Extra sources:** Canadian Agency Ops skill, AGLC/AGCO/LCBO specifics
**Same template** but with Canadian regulatory sections (LOA/LOU, consignment, provincial agency registration)

**Time:** ~10 minutes. One batch.

### PHASE 5: REGULATORY SHELLS (26 states, 4-5 batches of 6)
**What:** Web-research-only dossiers for states we haven't entered yet
**States:** All 26 inactive states
**Per-agent job:**
1. Read FOUNDATION.md
2. Web research: state liquor control authority, license requirements, price posting rules
3. Research: control state vs open market, 3-tier structure, franchise laws
4. Fill regulatory sections of template only
5. Leave distributor/pricing/history sections as "NOT ENTERED — NO DATA"

**Why bother:** When Alex decides to enter Nebraska or Kentucky, the agent already knows the rules. No scrambling.

**Time:** ~40 minutes total (4 batches of 6, sequential)

---

## TOTAL DEPLOYMENT

| Phase | Markets | Agents | Batches | Est. Time |
|-------|---------|--------|---------|-----------|
| 1. Foundation | Shared | 1 | 1 | 5 min |
| 2. Tier 1 | 8 | 8 | 1 | 15 min |
| 3. Tier 2 | 12 | 12 | 2 | 30 min |
| 4. Canada | 5 | 5 | 1 | 10 min |
| 5. Shells | 26 | 26 | 5 | 40 min |
| **TOTAL** | **51+5 provinces** | **52** | **10** | **~100 min** |

Plus one final agent to build the **Master Index** on Opus Drive.

---

## WHAT THIS PRODUCES

When it's done, you have:
1. **56 state/province dossiers** on Opus Google Drive, each following identical structure
2. **FOUNDATION.md** — shared knowledge every agent inherits
3. **MASTER_INDEX.md** — at the root of Opus Drive, cataloging every file and its location
4. A **state-agent skill template** that Claude Code can use to instantly become an expert on any market

When you sit down in Claude Code and say "let's work on Kansas pricing," Claude reads the Kansas dossier, knows the distributor is Vintegrity, knows the 33% margin lock, knows Prestige is filing with ATC, knows the last email was April 2 — and doesn't confuse any of it with Washington or Alberta.

That's the empire builder.

---

## RECOMMENDED EXECUTION SEQUENCE

**Today (Easter Sunday):**
- Approve the plan
- I run Phase 1 (Foundation) + Phase 2 (Tier 1 states) = 9 agents, ~20 minutes

**Tomorrow (Monday):**
- Phase 3 (Tier 2 states) = 12 agents across 2 batches
- Phase 4 (Canada) = 5 agents
- Start Phase 5 (first batch of regulatory shells)

**By Wednesday:**
- All 56 dossiers complete
- Master Index built
- State Agent skill template ready for Claude Code

**By end of week:**
- Pricing portfolio reconciled against all dossiers
- First state agent test run in Claude Code (suggested: Kansas or Colorado)
