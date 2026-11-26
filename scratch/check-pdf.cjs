const fs = require("node:fs");
const { execFileSync } = require("node:child_process");
const pdf = "output/pdf/Ascent_Minor_Project_Report.pdf";
const bytes = fs.readFileSync(pdf);
const raw = bytes.toString("latin1");
const pageCount = (raw.match(/\/Type\s*\/Page\b/g) || []).length;
const text = fs.readFileSync("scratch/final-pdf-text.txt", "utf8");
const extractedPages = text.split("\f").filter((page) => page.trim()).length;
const extracted = execFileSync(process.execPath, ["scratch/inspect-pdf.cjs", pdf], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
const searchable = text.replace(/\s+/g, " ").toLowerCase();
const checks = [
  "role-based smart employee onboarding",
  "table of contents",
  "chapter 1: introduction",
  "chapter 7: references",
  "appendix d: environment configuration categories",
  "69",
];
console.log(`Bytes: ${bytes.length}`);
console.log(`Pages: ${pageCount}`);
console.log(`Non-empty extracted pages: ${extractedPages}`);
for (const phrase of checks) console.log(`${phrase}: ${searchable.includes(phrase)}`);
