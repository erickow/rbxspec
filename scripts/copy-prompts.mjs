import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/templates/prompts");
const destDir = path.resolve("dist/templates/prompts");

fs.mkdirSync(destDir, { recursive: true });
for (const entry of fs.readdirSync(srcDir)) {
  if (entry.endsWith(".md")) {
    fs.copyFileSync(path.join(srcDir, entry), path.join(destDir, entry));
  }
}
console.log(`Copied prompts to ${destDir}`);
