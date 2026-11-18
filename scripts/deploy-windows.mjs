// Local deploy for Windows + Yarn 1.
//
// `opennextjs-cloudflare deploy` runs `yarn exec wrangler`, which fails on Windows with
// Yarn 1 ("Couldn't find the binary wrangler"). This script does the same steps without
// `yarn exec`. Cloudflare's Git builds run on Linux and keep using `yarn deploy`.
//
// OPEN_NEXT_DEPLOY=true stops wrangler from handing the deploy back to OpenNext.
// This project has no incremental cache or skew protection configured, so a plain
// `wrangler deploy` of the built `.open-next` output is all OpenNext's deploy would do.
//
// wrangler runs without a keyboard (stdin ignored): its yes/no prompts crash in the
// Git Bash (MINGW64) terminal. Non-interactive, wrangler answers "yes" to the
// "local config differs from the dashboard" prompt, so wrangler.jsonc always wins.
import { execSync } from "node:child_process";

const args = process.argv.slice(2).join(" ");

execSync("yarn opennextjs-cloudflare build", { stdio: "inherit" });
execSync(`yarn wrangler deploy ${args}`.trim(), {
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
});
