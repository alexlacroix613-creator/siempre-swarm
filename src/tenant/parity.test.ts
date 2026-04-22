/**
 * Parity test: asserts TS layout.json is byte-equal to the Python SSOT at
 * ~/CLAUDE BRAIN/tools/tenant/layout.json. Run with `npx tsx`.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TS_PATH = join(__dirname, "layout.json");
const PY_PATH = join(homedir(), "CLAUDE BRAIN", "tools", "tenant", "layout.json");

const ts = readFileSync(TS_PATH);
const py = readFileSync(PY_PATH);

if (ts.equals(py)) {
  console.log("✓ layout.json parity OK");
  console.log(`  Size: ${ts.byteLength} bytes`);
  console.log(`  TS:   ${TS_PATH}`);
  console.log(`  PY:   ${PY_PATH}`);
  process.exit(0);
}

console.error("✗ layout.json DRIFT between TS and Python SSOT");
console.error(`  TS size: ${ts.byteLength}  PY size: ${py.byteLength}`);
console.error(`  TS: ${TS_PATH}`);
console.error(`  PY: ${PY_PATH}`);
process.exit(1);
