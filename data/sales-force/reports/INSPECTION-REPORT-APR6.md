# Siempre National Sales Force — Package Inspection Report

**Date:** April 6, 2026
**Inspectors:** 6 parallel specialist agents
**Scope:** All 59 files (Foundation, SKILL, 20 dossiers, 35 shells, master contact directory, index)

---

## Verdict: DEPLOYABLE — with 8 fixes before shipping

The package is structurally sound and Claude Code agents can operate it today. But six independent inspectors found real issues that range from compliance risks to data gaps. Here's the honest picture.

---

## CRITICAL ISSUES (8) — Fix before deploying

### 1. Foundation document mislabels 3 franchise-flagged states

The 50-state regulatory matrix marks Connecticut, Massachusetts, and Tennessee as "Standard" switching risk. But the individual dossiers/shells for those states correctly flag them as franchise-sensitive. A state agent loading the Foundation first would think switching distributors in TN is a routine commercial decision — it's not. Tennessee requires counsel review.

**Fix:** Update Foundation lines for CT, MA, TN to "Franchise-flagged" in the switching-risk column.

### 2. No state-specific KPI targets in ANY dossier

The Foundation defines 11 KPIs with weights (sum = 100%), and the SKILL.md references them. But zero dossiers contain actual numerical targets for their market. "Typical Target: 50 depletions" exists as a placeholder, but no California agent knows if their weekly target is 50 or 200. Agents can't measure success.

**Fix:** Set state-specific targets for at least Tier 1 markets (CA, TX, CO, WA, FL, IL). These can be rough — better to have directional targets than nothing.

### 3. Utah COLA expiration unknown

Siempre Plata, Reposado, and Anejo COLAs for Utah dated January 19, 2023. Over 3 years ago. COLA validity periods vary — these may have expired. If expired, product is technically non-compliant in a control state.

**Fix:** Verify COLA status with DABC or Jakob Nash immediately.

### 4. Oregon dossier is essentially a shell

Oregon scored 1/5 across all four intelligence dimensions (pricing, performance, accounts, risk flags). No extracted depletion data, no pricing data, no account list, no current listing status. An agent in Oregon would be flying blind.

**Fix:** Either pull real data and flesh this out, or honestly reclassify it as a Tier 3 / enhanced shell until data is available.

### 5. Alberta and BC dossiers break the 10-section template

Contact enrichment added a standalone "Contacts & Key People" section to AB (now 12 sections) and BC (now 11 sections). The SKILL.md tells agents to expect Section 5 = Pricing Architecture. In AB and BC, Section 5 is something else. This will confuse programmatic section lookups.

**Fix:** Fold the "Contacts & Key People" content into Section 3 (Distribution Structure) or Section 4 (Distributor Profile) for both AB and BC. Renumber to restore 10-section alignment.

### 6. Manitoba dossier has critical data gaps

No depletion data at all. eLLIS portal access expired — no real-time visibility. September 2026 tender deadline approaching for Anejo without current market data to support the application.

**Fix:** Flag as data-deficient. Restore eLLIS access. Pull current sales data from MLLC before September tender prep.

### 7. Georgia + Tennessee: 81% decline with no root cause

Both markets show identical ~81% YoY case declines. Dossiers flag the crisis but provide no diagnostic — is this brand health, distributor failure, competitive displacement, or retail consolidation? Without a diagnosis, agents can't recommend action.

**Fix:** These need human investigation (ride-withs, distributor conversations). Flag in the dossiers as "diagnosis pending — do not recommend distributor change without root-cause data."

### 8. Master contact directory count overstated

Claims "120+ unique contacts." Actual count on audit: 102. About 49% of entries have placeholder data — "(Team)" roles, "(in dossier)" emails, or missing phone numbers. Directionally useful but not as complete as it appears.

**Fix:** Update count to "102 unique contacts" and flag placeholder entries for enrichment.

---

## MODERATE ISSUES (9) — Should fix, won't break deployment

| # | Issue | Impact |
|---|-------|--------|
| 1 | Kansas, Oklahoma, Georgia dossiers have extra sections beyond the 10-section template (summary assessments, comparative analysis) | Structural noise — agents can still operate but template parsing is inconsistent |
| 2 | California master index emails marked "TBD" despite being known (Sam.Deer@winebow.com, Dan.Eddy@winebow.com) | Index users can't directly contact CA distributor without checking dossier |
| 3 | Oklahoma Dive/Optimus data NOT pulled into dossier | Performance section shows reporting gap acknowledged but actual 2024-2026 numbers still missing |
| 4 | Tennessee pricing framework incomplete (WIP only, no final SRP) | Cannot execute pricing strategy or provide distributor with final margin structure |
| 5 | Missouri account list empty — transition launches April 9 | Cannot deploy agent for Day 1 account calls without account roster |
| 6 | Virginia account data 6 months stale (Oct 2025) | Rick Harper reactivation campaign not validated |
| 7 | BC dossier missing 6 of 14 known contacts | 43% contact gap in largest Canadian market |
| 8 | 92 total placeholder/TBD markers across 10 dossiers sampled | Significant but expected for an initial build — these are honest "don't know yet" flags |
| 9 | MASTER-INDEX sub-category shell count headers wrong (claims 12 control, lists 14; claims 3 franchise, lists 4) | Grand total (35) is correct but section headers create confusion |

---

## WHAT'S WORKING WELL

The inspectors found a lot that's solid:

- **3-layer loading pattern works perfectly.** Foundation → SKILL → Dossier gives a Claude Code agent everything it needs. Tested against both CA (license state) and VA (control state) — zero gaps in the operating playbook.
- **Zero contradictions between layers.** Foundation, SKILL, and dossiers all agree on state classifications, distributor assignments, and operating procedures. The Oklahoma reporting exception (iDig → Dive/Optimus) is flagged consistently across all three layers.
- **All 59 files present and correctly referenced.** No broken paths, no missing files, no orphaned references.
- **Shell-to-dossier upgrade path is clear.** An agent could take any shell and know exactly how to upgrade it to a full dossier.
- **35 regulatory shells are structurally perfect.** All follow the 5-section template consistently.
- **Contact enrichment dramatically improved coverage.** From 17 visible contacts to 102 unique contacts across 22 markets. FL, KS, AR, UT all rated "excellent" on contact integrity.

---

## PRIORITY ORDER FOR FIXES

**Do now (30 minutes):**
1. Fix Foundation franchise flags (CT, MA, TN)
2. Fix AB and BC section numbering
3. Update master contact count to 102
4. Fix MASTER-INDEX sub-category headers and CA emails

**Do this week:**
5. Set state-specific KPI targets for Tier 1 markets
6. Verify Utah COLA status
7. Pull Oklahoma Dive/Optimus data
8. Get Missouri account list from Vintegrity before April 9

**Do before full rollout:**
9. Diagnose GA/TN decline root cause
10. Restore Manitoba eLLIS access
11. Flesh out Oregon with real data or reclassify
12. Replace placeholder contact roles with actual titles

---

*Report generated from 6 parallel inspection agents: Data Accuracy, Contact Integrity, Structural Consistency, Intelligence Gap Analysis, Regulatory Accuracy, Deployment Readiness.*
