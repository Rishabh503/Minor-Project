const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const builderPath = path.join(__dirname, "build-report.cjs");
const expansionPath = path.join(__dirname, "main-chapter-expansion.md");
let builder = fs.readFileSync(builderPath, "utf8");
const expansion = fs.readFileSync(expansionPath, "utf8");

const appendixStart = builder.indexOf("\n## Appendix E:");
const bodyEnd = builder.indexOf("\n`;\n\nfunction escapeHtml", appendixStart);
if (appendixStart < 0 || bodyEnd < 0) throw new Error("Could not locate the added appendix block.");
builder = builder.slice(0, appendixStart) + builder.slice(bodyEnd);

function section(start, end) {
  const from = expansion.indexOf(start);
  const to = end ? expansion.indexOf(end, from + start.length) : expansion.length;
  if (from < 0 || (end && to < 0)) throw new Error(`Missing expansion section: ${start}`);
  return expansion.slice(from, to).trim();
}

const inserts = [
  ["\n# Chapter 2: Literature Survey", section("## 1.7 Stakeholders", "## 2.7 Comparison")],
  ["\n# Chapter 3: Research Methodology and System Analysis", section("## 2.7 Comparison", "## 3.8 Requirements")],
  ["\n# Chapter 4: System Design and Implementation", section("## 3.8 Requirements", "## 4.14 Request Lifecycle")],
  ["\n# Chapter 5: Results and Discussion", section("## 4.14 Request Lifecycle", "## 5.8 Test Design")],
  ["\n# Chapter 6: Conclusion, Summary and Future Scope", section("## 5.8 Test Design", "## 6.6 Recommended")],
  ["\n# Chapter 7: References", section("## 6.6 Recommended")],
];

for (const [marker, content] of inserts) {
  const at = builder.indexOf(marker);
  if (at < 0) throw new Error(`Could not find report chapter marker: ${marker}`);
  builder = builder.slice(0, at) + "\n\n" + content + "\n" + builder.slice(at);
}

const appendixMarker = "\n# Appendices";
const appendixAt = builder.indexOf(appendixMarker);
if (appendixAt < 0) throw new Error("Could not find appendices marker.");
builder = builder.slice(0, appendixAt) +
  "\n10. J. M. Bauer et al., ‘Effectiveness of formal onboarding for facilitating organizational socialization: A systematic review’, 2023. Available: https://pmc.ncbi.nlm.nih.gov/articles/PMC9934447/\n" +
  builder.slice(appendixAt);

// Keep the report builder reproducible by writing the assembled body back to the working builder.
fs.writeFileSync(builderPath, builder, "utf8");
console.log("Assembled detailed chapter content into", path.relative(root, builderPath));
