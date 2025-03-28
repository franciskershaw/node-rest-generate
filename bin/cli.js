#!/usr/bin/env node

import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// This is the entry point for the CLI
// It imports and runs the compiled JS code from the dist directory
async function main() {
  try {
    // Import the compiled JS file
    const { run } = await import("../dist/index.js");
    await run();
  } catch (error) {
    console.error("Error running the CLI:", error);
    process.exit(1);
  }
}

main();
