const fs = require("node:fs");
const pages = fs.readFileSync("scratch/final-pdf-text.txt", "utf8").split("\f").filter((page) => page.trim());
for (let i = 0; i < pages.length; i++) {
  const lines = pages[i].split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  console.log(`${String(i + 1).padStart(2)} | lines=${String(lines.length).padStart(3)} | ${lines.slice(0, 2).join(" / ").slice(0, 110)} | END ${lines.slice(-2).join(" / ").slice(0, 90)}`);
}
