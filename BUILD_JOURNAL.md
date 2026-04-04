# Siempre Swarm — Build Journal

> Forked from [ruvnet/ruflo](https://github.com/ruvnet/ruflo) on 2026-04-04.
> Goal: Take the good ideas, gut the bloat, build something that actually works for Siempre Spirits.

---

## 2026-04-04 — Day 1: Fork, Audit, and Vision

### What Happened

1. **Discovered ruflo** via an influencer recommendation. Installed it in a test directory to evaluate.
2. **Deep audit** of the GitHub repo and installed files revealed:
   - ~10 of 313 MCP tools actually work
   - 106 agent definitions, ~15 functional
   - HNSW vector search is real and solid (`hnsw-lite.ts`, 190 lines)
   - Memory tools have good schemas but silently fail when backend isn't initialized
   - Agent spawn pipeline is broken — creates JSON records but never calls an LLM
   - "Flash Attention", "GNN", "EWC++" are aspirational/not implemented
   - Past security incident: obfuscated preinstall script in v3.5.2 (fixed in v3.5.3)
   - Context bloat: 300K tokens of agent definitions per session (~$4.50 wasted)

3. **Vision conversation with Alex** produced a 6-department agent architecture:
   - **Pricing Dept**: Master + 35 state-specific agents
   - **Sales Intel Dept**: Source-specific agents (VIP, Oklahoma, Canadian provinces, Prestige email) + Manus for headless browsing
   - **R&D Dept**: Context-isolated research agents (Siempre vs tech/startup)
   - **Creative Dept**: Tim as ECD + specialist design teams, proofreaders, account managers, creative directors
   - **Comms Dept**: Audience-specific drafting agents (distributors, partners, legal, PR)
   - **DevOps Dept**: Deploy, verify, monitor agents

4. **Key architectural decisions**:
   - Use OpenRouter API to route simple tasks to free/cheap models, preserve Opus for complex reasoning
   - Build governance layer first: session locking, branch isolation, file-level write guards
   - Hierarchical memory: agents report up to department heads, department heads report to master doc
   - Lazy-load agent definitions (not 300K tokens at startup)
   - Wire agent spawn to Claude Code's native Task tool (not a custom MCP orchestration layer)

### Audit Results — What to Keep vs Gut

#### KEEP (Real, Working Code)
| File | Why |
|------|-----|
| `v3/@claude-flow/memory/src/hnsw-lite.ts` | Real HNSW vector search (cosine, dot, euclidean) |
| `v3/@claude-flow/memory/src/sqlite-backend.ts` | SQLite persistence |
| `v3/@claude-flow/memory/src/hybrid-backend.ts` | Hybrid memory backend |
| `v3/@claude-flow/memory/src/memory-graph.ts` | Graph relationships between memories |
| `v3/@claude-flow/memory/src/agent-memory-scope.ts` | Per-agent memory isolation |
| `v3/mcp/tools/memory-tools.ts` | Good Zod schemas and type definitions |
| `v3/mcp/tools/agent-tools.ts` | Good schemas (spawn, list, terminate, status) |
| `v3/mcp/tools/session-tools.ts` | Session management patterns |

#### GUT (Stubs, Bloat, Non-functional)
- 290+ stub MCP tools that silently return empty data
- 106 agent YAML definitions (replace with 6 department definitions)
- `sona-tools.ts` — mischaracterized routing heuristic
- `federation-tools.ts` — not implemented
- `worker-tools.ts` — stubs
- All v2/ directory (legacy)
- CLAUDE.md (38KB of aspirational documentation)
- Most of `.agents/` directory
- Most of `.claude/` scaffolding (hooks that inject 300K tokens)

#### FIX (Good Idea, Bad Execution)
- Agent spawn → wire to Claude Code Task tool
- Memory fallbacks → fail loudly instead of silently
- Context loading → lazy-load, not dump-everything-at-startup
- Model routing → use OpenRouter, not fake WASM "Agent Booster"

### Phase Plan
1. **Strip & Rebuild** — Remove stubs, keep working memory/search
2. **Routing Layer** — OpenRouter integration for cost-optimized model selection
3. **Six Departments** — Start with Pricing (most structured)
4. **Memory Layer** — Hierarchical reporting, smart context compression
5. **Learning Loop** — Pattern storage with importance scoring
6. **Publish** — Release as a ruflo alternative that actually works

### Red Flags Addressed
- [x] Removed ruflo's unauthorized addition to global `~/.claude/CLAUDE.md`
- [ ] Need to verify no telemetry or data exfiltration in kept code
- [ ] Need to audit npm dependencies
- [ ] Antivirus detection on `.agents/skills/github-multi-repo/SKILL.md` — investigate

---

## Research Results (2026-04-04)

### Memory Layer Decision: Mem0 (self-hosted)
- Best fit for multi-agent memory with agent/user/session scoping
- Open source (MIT), Python, backs onto Qdrant vector DB
- Each department/agent gets isolated memory namespace
- Shared project-level memories accessible across agents
- If Mem0's LLM extraction becomes costly, can drop to raw Qdrant
- Alternatives evaluated: Supermemory (wrong audience), Letta (too opinionated), Zep (cloud-only for good features), ChromaDB (too low-level)

### Model Routing Decision: OpenRouter
- OpenAI-compatible API (drop-in, change base URL + model string)
- Free models: Gemini 2.5 Pro (1M ctx), DeepSeek V3, Llama 3.3 70B, Qwen Coder 32B
- Pattern: Opus orchestrates → spawns Bash subtasks → subtasks call OpenRouter → free/cheap models do grunt work → results flow back
- Estimated 80-95% cost reduction on routine work
- Doesn't eat into Alex's Anthropic usage cap
- Built-in fallback chains: try free → fall back to paid if unavailable
- LiteLLM library available for unified interface with automatic fallbacks

---
