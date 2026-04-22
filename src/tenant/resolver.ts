/**
 * Tenant path resolver — TypeScript mirror of CLAUDE BRAIN/tools/tenant/resolver.py.
 *
 * Reads the same layout.json contract (copy lives next to this file; Day 3
 * adds a parity check against the Python SSOT at
 * ``~/CLAUDE BRAIN/tools/tenant/layout.json``).
 *
 * Env vars (identical to Python):
 *   TENANT_ROOT  filesystem root holding every tenant (default: $HOME/tenants)
 *   TENANT_ID    active tenant slug (default: tenant-001 = Siempre)
 *
 * Usage:
 *   import { tenantPath, tenantRoot, tenantId } from "./tenant/resolver";
 *   const swarmDir = tenantPath("swarm");          // $TENANT_ROOT/tenant-001/swarm
 *   const ctxFile  = tenantPath("context_file");   // .../brain/.agents/product-brand-context.md
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_TENANT_ID = "tenant-001";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LAYOUT_PATH = join(__dirname, "layout.json");

export interface TenantLayout {
  directories: Record<string, string>;
  files: Record<string, string>;
}

let _layout: TenantLayout | null = null;

function loadLayout(): TenantLayout {
  if (_layout === null) {
    const raw = readFileSync(LAYOUT_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<TenantLayout>;
    _layout = {
      directories: parsed.directories ?? {},
      files: parsed.files ?? {},
    };
  }
  return _layout;
}

export function tenantId(): string {
  return process.env.TENANT_ID || DEFAULT_TENANT_ID;
}

export function tenantRoot(tenant?: string): string {
  const base = process.env.TENANT_ROOT || join(homedir(), "tenants");
  return join(base, tenant || tenantId());
}

export function tenantPath(key: string, tenant?: string): string {
  const layout = loadLayout();
  const base = tenantRoot(tenant);

  if (key in layout.directories) {
    const rel = layout.directories[key];
    return rel === "." || rel === "" ? base : join(base, rel);
  }
  if (key in layout.files) {
    return join(base, layout.files[key]);
  }

  const valid = [
    ...Object.keys(layout.directories),
    ...Object.keys(layout.files),
  ].sort();
  throw new Error(
    `Unknown tenant-path key: '${key}'. Valid keys: ${valid.join(", ")}`,
  );
}

export function resolveAll(tenant?: string): Record<string, string> {
  const layout = loadLayout();
  const base = tenantRoot(tenant);
  const out: Record<string, string> = {
    _root: base,
    _tenant_id: tenant || tenantId(),
  };
  for (const [k, v] of Object.entries(layout.directories)) {
    out[k] = v === "." || v === "" ? base : join(base, v);
  }
  for (const [k, v] of Object.entries(layout.files)) {
    out[k] = join(base, v);
  }
  return out;
}
