/**
 * Tenant resolver CLI — prints all resolved paths for the active tenant.
 * Run with `npx tsx src/tenant/cli.ts`.
 */
import { existsSync } from "node:fs";
import { resolveAll, tenantRoot, tenantId } from "./resolver.js";

const all = resolveAll();
console.log(`tenant-id:   ${tenantId()}`);
console.log(`tenant-root: ${tenantRoot()}`);
console.log("─".repeat(80));

for (const [key, path] of Object.entries(all)) {
  if (key.startsWith("_")) continue;
  const mark = existsSync(path) ? "✓" : "·";
  console.log(`${mark} ${key.padEnd(16)} ${path}`);
}
