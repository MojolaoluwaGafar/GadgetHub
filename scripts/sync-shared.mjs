// Copies packages/shared/src/index.ts into each app as src/types/shared.ts.
//
// Each app keeps its own copy, so it builds on its own (Vercel builds
// apps/Client, Render builds apps/Server) without resolving the workspace
// package. packages/shared stays the one place to edit them; `npm run build` and `npm run typecheck` run this first, and
// `npm run sync:shared -- --check` fails if a copy is out of date.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "packages/shared/src/index.ts"), "utf8");
const banner =
  "// GENERATED from packages/shared/src/index.ts by scripts/sync-shared.mjs.\n" +
  "// Don't edit this copy: change the original and run `npm run sync:shared`.\n\n";
const content = banner + source;
const check = process.argv.includes("--check");

let stale = false;
for (const app of ["apps/Client", "apps/Server"]) {
  const target = join(root, app, "src/types/shared.ts");
  const current = existsSync(target) ? readFileSync(target, "utf8") : "";
  if (current === content) continue;
  if (check) {
    console.error(`${app}/src/types/shared.ts is out of date. Run: npm run sync:shared`);
    stale = true;
  } else {
    writeFileSync(target, content);
    console.log(`Updated ${app}/src/types/shared.ts`);
  }
}
if (stale) process.exit(1);
