const fs = require("node:fs");
const html = fs.readFileSync("output/report/Ascent_Minor_Project_Report.html", "utf8");
for (const name of ["figure-architecture", "figure-rag", "figure-demo", "figure-data", "figure-results"]) {
  console.log(`${name}: ${html.includes(`id="${name}"`)}`);
}
console.log(`Unreplaced figure markers: ${/!\[[^\]]+\]\(#figure-[^)]+\)/.test(html)}`);
console.log(`Chapter headings: ${(html.match(/Chapter [1-7]:/g) || []).length}`);
console.log(`Tables: ${(html.match(/<table>/g) || []).length}`);
