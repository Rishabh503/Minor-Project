const fs = require("node:fs");
const textPages = fs.readFileSync("scratch/final-pdf-text.txt", "utf8").split("\f");
const html = fs.readFileSync("output/report/Ascent_Minor_Project_Report.html", "utf8");
const normalize = (value) => value.replace(/\s+/g, " ").toLowerCase().trim();
const regex = /<h([12]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
let match;
const entries = [];
while ((match = regex.exec(html))) {
  const title = match[3].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  const specialPages = {
    "list-of-tables": 7,
    "list-of-figures": 8,
    "symbols-abbreviations-and-nomenclature": 9,
  };
  const found = specialPages[match[2]]
    ? specialPages[match[2]] - 1
    : textPages.findIndex((page, index) => index >= 9 && normalize(page).includes(normalize(title)));
  entries.push({ id: match[2], title, level: Number(match[1]), currentPage: found + 1 });
}
const map = Object.fromEntries(entries.map(({ id, currentPage }) => [id, currentPage]));
fs.writeFileSync("scratch/toc-page-map.json", JSON.stringify(map, null, 2));
console.log(JSON.stringify(map, null, 2));
