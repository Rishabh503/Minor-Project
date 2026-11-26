"""Re-format the Ascent report HTML to match the college reference report layout
(Times New Roman, black text, 12pt body, MAIT cover/certificate, bordered tables,
plain centred page numbers) and print it to PDF with headless Chrome.

Usage:  python scratch/format-report.py
Input:  output/report/Ascent_Minor_Project_Report.html
Output: output/report/Ascent_Minor_Project_Report_Formatted.html
        output/pdf/Ascent_Minor_Project_Report_Formatted.pdf
"""
import base64, copy, re, subprocess, sys, tempfile
from pathlib import Path

import pymupdf
from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "output/report/Ascent_Minor_Project_Report.html"
LOGO = ROOT / "output/report/mait-logo.png"
OUT_HTML = ROOT / "output/report/Ascent_Minor_Project_Report_Formatted.html"
OUT_PDF = ROOT / "output/pdf/Ascent_Minor_Project_Report_Formatted.pdf"
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

TITLE = "ASCENT: ROLE-BASED SMART EMPLOYEE ONBOARDING AND WORK SIMULATION PLATFORM"
TITLE_QUOTED = "Ascent: Role-Based Smart Employee Onboarding and Work Simulation Platform"
STUDENTS = ["Rishabh Tripathi (03414812723)", "Niyati Chugh (03214812723)", "Piyush Kar (02314812723)"]
GUIDE, GUIDE_DESIG = "Ms. Sakshi Goel", "(Assistant Professor, CST, MAIT)"
HOD, HOD_DESIG = "Prof. (Dr.) Pooja Gupta", "(Professor &amp; HOD, CST)"

# Project schedule from the approved synopsis (weeks in which each activity runs).
GANTT = [
    ("Requirement Analysis", {1}),
    ("System Design &amp; Database", {2}),
    ("UI/UX Design", {2, 3}),
    ("Backend Development", {3, 4}),
    ("Frontend Development", {4, 5}),
    ("Role-Based Task &amp; Scheduling Module", {5, 6}),
    ("AI Chatbot &amp; Doubt Analysis", {5, 6, 7}),
    ("Integration &amp; Testing", {7, 8}),
    ("Deployment &amp; Final Improvements", {8, 9}),
    ("Documentation &amp; Presentation", {9}),
]


def flow_svg(steps):
    """Snake-layout flow chart (4 boxes per row) drawn in black for print."""
    w, h, gx, gy, per = 190, 56, 60, 50, 4
    rows = (len(steps) + per - 1) // per
    W, H = per * w + (per - 1) * gx + 20, rows * h + (rows - 1) * gy + 20
    parts = [f'<svg role="img" aria-label="Overall development flow" viewBox="0 0 {W} {H}">'
             '<defs><marker id="garrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">'
             '<path d="M0,0 L0,6 L9,3 z" fill="#000"/></marker></defs>']
    pos = []
    for i, s in enumerate(steps):
        r, c = divmod(i, per)
        if r % 2:
            c = per - 1 - c
        x, y = 10 + c * (w + gx), 10 + r * (h + gy)
        pos.append((x, y))
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#fff" stroke="#000" stroke-width="1.5"/>'
                     f'<text x="{x + w / 2}" y="{y + h / 2 + 6}" text-anchor="middle" font-family="Times New Roman" font-size="17" font-weight="700">{s}</text>')
    line = 'stroke="#000" stroke-width="1.5" marker-end="url(#garrow)"'
    for (x1, y1), (x2, y2) in zip(pos, pos[1:]):
        if y1 == y2:
            a, b = (x1 + w, x2) if x2 > x1 else (x1, x2 + w)
            parts.append(f'<line x1="{a}" y1="{y1 + h / 2}" x2="{b - 4 if x2 > x1 else b + 4}" y2="{y1 + h / 2}" {line}/>')
        else:
            parts.append(f'<line x1="{x1 + w / 2}" y1="{y1 + h}" x2="{x2 + w / 2}" y2="{y2 - 4}" {line}/>')
    return "".join(parts) + "</svg>"


def add_missing_sections(main):
    """Add the sections the college format requires that the source report lacks:
    project schedule (Gantt chart), hardware/software requirements, societal impact."""
    def frag(html):
        return BeautifulSoup(html, "html.parser")

    # --- 3.14 Project Schedule, inserted before the Chapter 3 summary (renumbered 3.15) ---
    summary = main.find("h3", id="3-14-chapter-summary")
    summary.string = "3.15 Chapter Summary"
    summary["id"] = "3-15-chapter-summary"
    head = "".join(f"<th>W{i}</th>" for i in range(1, 10))
    body = "".join("<tr><td>" + a + "</td>" + "".join(f'<td class="wk">{"✓" if i in wk else ""}</td>' for i in range(1, 10)) + "</tr>"
                   for a, wk in GANTT)
    steps = ["Requirement Analysis", "System Design", "UI/UX", "Backend &amp; Database",
             "Frontend", "Core Modules", "AI Integration", "Testing", "Deployment", "Documentation"]
    summary.insert_before(frag(
        '<h3 id="3-14-project-schedule-gantt-chart">3.14 Project Schedule (Gantt Chart)</h3>'
        "<p>The project was planned over nine weeks. Table 3.4 shows the Gantt chart of the activities and the weeks in "
        "which each one was carried out. Design work overlapped with the start of development, and the AI assistant and "
        "doubt-analysis features were developed alongside the role-based task and scheduling module so that they could be "
        "integrated and tested together in weeks 7 and 8.</p>"
        f'<div class="table-wrap gantt"><table><thead><tr><th>Activity</th>{head}</tr></thead><tbody>{body}</tbody></table></div>'
        "<p>Figure 3.4 shows the order in which the development phases were completed, from requirement analysis to the "
        "final documentation and presentation.</p>"
        f'<figure class="diagram">{flow_svg(steps)}<figcaption>Figure 3.4. Overall development flow.</figcaption></figure>'))

    # --- 4.2.1 / 4.2.2 hardware and software requirements, after Table 4.1 ---
    stack = main.find("h2", id="4-2-technology-stack").find_next_sibling("div", class_="table-wrap")
    stack.insert_after(frag(
        '<h3 id="4-2-1-hardware-requirements">4.2.1 Hardware Requirements</h3>'
        "<ul><li>Laptop or desktop computer for development and testing.</li>"
        "<li>Minimum 8 GB RAM.</li>"
        "<li>Stable internet connection, needed for the hosted database, authentication, and Gemini API.</li>"
        "<li>Cloud server and storage for deployment (Neon PostgreSQL for the database).</li></ul>"
        '<h3 id="4-2-2-software-requirements">4.2.2 Software Requirements</h3>'
        "<ul><li>Operating system: Windows or Linux.</li>"
        "<li>Runtime: Node.js with npm.</li>"
        "<li>Code editor: Visual Studio Code.</li>"
        "<li>Browser: Google Chrome or Microsoft Edge.</li>"
        "<li>Version control: Git and GitHub.</li>"
        "<li>Services: Clerk account, Neon PostgreSQL database, and Gemini API key.</li></ul>"))

    # --- 6.8 Societal contribution, at the end of Chapter 6 ---
    ch7 = main.find("h1", id="chapter-7-references")
    ch7.insert_before(frag(
        '<h3 id="6-8-societal-contribution-and-impact-of-the-project">6.8 Societal Contribution and Impact of the Project</h3>'
        "<p>The project aims to make the move into a new workplace easier by giving new employees a structured and "
        "accessible onboarding environment. Each employee can see the tasks, training, meetings, and assessments expected "
        "of them in one place, which reduces the confusion and dependence on informal communication that new joiners often face.</p>"
        "<p>Practical tasks and assessments let trainees learn the kind of work their role involves before handling real "
        "company work. The discussion forum and the company-specific AI assistant give them a way to get answers from company "
        "material without waiting for a manager, while AI summaries of recurring questions help organizations see where their "
        "onboarding material is unclear and improve it.</p>"
        "<p>The platform can therefore support skill development, workplace preparedness, more open communication between "
        "trainees and managers, and more consistent and efficient organizational practices. These benefits depend on the "
        "quality of the company's own content and on continued human review of AI output.</p>"))
DATE = "DEC 2026"

# Tables named in the report's own List of Tables, matched by their header row.
TABLE_CAPTIONS = [
    (("Actor", "Main responsibilities"), "3.1"),
    (("ID", "Requirement", "Implemented behavior"), "3.2"),
    (("Category", "Requirement and design response"), "3.3"),
    (("Layer", "Technology", "Use in Ascent"), "4.1"),
    (("Entity group", "Representative models", "Purpose"), "4.2"),
    (("Feature", "AI output", "Human control"), "4.3"),
    (("Activity",) + tuple(f"W{i}" for i in range(1, 10)), "3.4"),
    (("Measure", "Result"), "5.1"),
    (("Project statement requirement", "Status", "Evidence in current implementation"), "5.2"),
]

CSS = r"""
@page{size:A4;margin:25pt 25pt 54pt 35pt;
  @bottom-center{content:counter(page);font:10.8pt Calibri,Carlito,Arial,sans-serif;color:#000;vertical-align:top;padding-top:6pt}}
@page:first{@bottom-center{content:none}}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#fff;color:#000}
body{font:12pt/1.725 "Times New Roman",Times,serif}
a{color:#000;text-decoration:none}
strong,b{color:#000;font-weight:700}
p{margin:0 0 8pt;text-align:justify;orphans:2;widows:2}
code{font:inherit;background:none;padding:0}
ul{margin:0 0 8pt;padding-left:40pt}
ol{margin:0 0 8pt;padding-left:20pt}
li{margin:0 0 8pt;text-align:justify;padding-left:4pt}
h1,h2,h3{font-family:"Times New Roman",Times,serif;color:#000;break-after:avoid;page-break-after:avoid}
.page{break-after:page;page-break-after:always;position:relative}
/* front matter titles: ABSTRACT, TABLE OF CONTENTS, LIST OF TABLES ... */
.front-title{font-size:18pt;font-weight:700;text-align:center;text-transform:uppercase;line-height:1.15;margin:30pt 0 16pt}
/* chapters */
h1.chapter{font-size:16.2pt;font-weight:700;text-align:center;text-transform:uppercase;line-height:1.15;margin:0 0 52pt;break-before:page;page-break-before:always}
h2{font-size:13.8pt;font-weight:700;line-height:1.15;margin:34pt 0 14pt;text-align:center}
/* gantt chart */
.gantt{break-inside:avoid;page-break-inside:avoid}
.gantt th,.gantt td.wk{text-align:center;width:38pt}
.gantt th:first-child{text-align:left;width:auto}
h1.chapter + h2{margin-top:0}
h3{font-size:12pt;font-weight:400;line-height:1.725;margin:4pt 0 6pt}
/* tables */
.table-caption{text-align:left;margin:14pt 0 8pt;break-after:avoid;page-break-after:avoid}
.table-wrap{margin:0 0 16pt}
table{border-collapse:collapse;width:100%;font-size:12pt;line-height:1.5;color:#000}
thead{display:table-header-group}
tr{break-inside:avoid;page-break-inside:avoid}
th,td{border:.75pt solid #000;padding:4pt 5pt;text-align:left;vertical-align:top;font-weight:400;background:none;color:#000}
tbody tr:nth-child(even){background:none}
/* contents / lists of tables & figures */
table.toc th{font-weight:700;padding:3pt 5pt}
table.toc td,table.toc th{line-height:1.15;padding-top:4.5pt;padding-bottom:4.5pt}
table.toc .n{width:50pt}
table.toc .pg{width:70pt;text-align:center}
table.toc tr.chap td{text-transform:uppercase}
table.lists td,table.lists th{line-height:1.2;padding-top:3pt;padding-bottom:3pt}
table.lists .n{width:85pt}
td.nw{white-space:nowrap}
table.lists .pg{width:75pt;text-align:center;white-space:nowrap}
table.symbols .n{width:175pt}
/* figures */
figure{margin:12pt 0 16pt;text-align:center;break-inside:avoid;page-break-inside:avoid}
figure.diagram svg{display:block;width:92%;height:auto;margin:0 auto;background:none;border:0;padding:0}
figcaption{font:italic 12pt/1.3 Calibri,Carlito,Arial,sans-serif;color:#000;text-align:center;margin-top:6pt}
.result-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6pt;width:92%;margin:0 auto}
.result-grid div{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70pt;border:.75pt solid #000;background:none;border-radius:0;padding:6pt}
.result-grid strong{font:700 22pt "Times New Roman",serif;color:#000}
.result-grid span{font-size:11pt;text-align:center;color:#000}
/* code: plain text like the reference */
.code-figure{margin:4pt 0 12pt;break-inside:avoid;page-break-inside:avoid;text-align:left}
.code-figure pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;background:none;border:0;padding:0;font:12pt/1.8 "Times New Roman",Times,serif;color:#000}
/* cover */
.cover{height:760pt;overflow:hidden;text-align:center}
.cover .ln{position:absolute;left:0;right:0;line-height:1.15}
.b{font-weight:700}
/* certificate */
.cert{height:763pt}
.cert .ln{position:absolute;left:0;right:0;text-align:center;line-height:1.15}
.cert .body{position:absolute;left:6pt;right:0;top:312pt;font-size:13.8pt;line-height:1.75;text-align:center}
.cert .body p{text-align:center;margin:0}
.cert .approve{position:absolute;left:0;top:417pt;font-size:13.8pt}
.sig{position:absolute;top:500pt;font-size:13.8pt;line-height:1.15}
.sig div{margin-bottom:17pt}
.sig .name{display:inline-block;border-bottom:.75pt solid #ee0000;padding-bottom:2pt}
.sig.left{left:0}.sig.right{right:0;text-align:right}
/* acknowledgement */
.ack-sign{display:flex;justify-content:space-between;margin-top:46pt}
.ack-sign .r{text-align:right}
.ack-sign div div{margin-bottom:8pt}
"""


def chrome():
    for c in CHROME_CANDIDATES:
        if Path(c).exists():
            return c
    sys.exit("Chrome/Edge not found")


def print_pdf(html_path: Path, pdf_path: Path):
    with tempfile.TemporaryDirectory() as prof:
        subprocess.run([chrome(), "--headless=new", "--disable-gpu", f"--user-data-dir={prof}",
                        "--no-pdf-header-footer", "--run-all-compositor-stages-before-draw",
                        f"--print-to-pdf={pdf_path}", html_path.as_uri()],
                       check=True, capture_output=True, timeout=180)


def norm(s):
    return re.sub(r"\s+", " ", s).strip().lower()


def build(page_map):
    src = BeautifulSoup(SRC.read_text(encoding="utf-8"), "html.parser")
    old_sections = src.find_all("section")
    abstract_ps = [copy.copy(p) for p in old_sections[2].find_all("p")]
    ack_ps = [copy.copy(p) for p in old_sections[3].find_all("p") if "signature-note" not in (p.get("class") or [])]
    main = src.find("main")

    logo = "data:image/png;base64," + base64.b64encode(LOGO.read_bytes()).decode()
    out = BeautifulSoup(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Ascent Minor Project Report</title><style>{CSS}</style></head><body></body></html>', "html.parser")
    body = out.body

    def add(html):
        frag = BeautifulSoup(html, "html.parser")
        for el in list(frag.contents):
            body.append(el)

    # ---------- cover (positions follow the reference page 1; y measured from top margin) ----------
    def ln(y, text, size, bold=False):
        return f'<div class="ln{" b" if bold else ""}" style="top:{y}pt;font-size:{size}pt">{text}</div>'
    cov = [f'<div class="ln b" style="top:32pt;font-size:18pt;padding:0 14pt;line-height:1.2">{TITLE}</div>',
           ln(108, "A", 13.8), ln(130, "MINOR PROJECT REPORT", 16.2), ln(186, "Submitted by", 12)]
    for i, s in enumerate(STUDENTS):
        cov.append(ln(209 + 25 * i, s, 13.8, True))
    cov += [ln(311, "BACHELOR OF TECHNOLOGY", 13.8), ln(336, "IN", 13.8), ln(362, "COMPUTER SCIENCE AND TECHNOLOGY", 13.8, True),
            ln(387, "Under the Guidance", 12), ln(410, "of", 12), ln(433, GUIDE, 13.8, True), ln(450, GUIDE_DESIG, 13.8, True),
            f'<img src="{logo}" style="position:absolute;top:473pt;left:50%;transform:translateX(-50%);width:93pt;height:97pt" alt="MAIT logo">',
            ln(617, "Department of Computer Science and Technology", 13.8), ln(650, "Maharaja Agrasen Institute of Technology,", 13.8),
            ln(681, "PSP area, Sector – 22, Rohini, New Delhi – 110085", 13.8),
            ln(714, "(Affiliated to Guru Gobind Singh Indraprastha University, New Delhi)", 13.8), ln(744, DATE, 13.8)]
    add('<section class="page cover">' + "".join(cov) + "</section>")

    # ---------- certificate ----------
    names = ", ".join(STUDENTS)
    add(f'''<section class="page cert">
<div class="ln b" style="top:28pt;font-size:18pt">MAHARAJA AGRASEN INSTITUTE OF TECHNOLOGY</div>
<div class="ln" style="top:58pt;font-size:18pt">Department of Computer Science and Technology</div>
<img src="{logo}" style="position:absolute;top:115pt;left:50%;transform:translateX(-50%);width:110pt;height:115pt" alt="MAIT logo">
<div class="ln b" style="top:258pt;font-size:18pt">CERTIFICATE</div>
<div class="body"><p>This is to certify that this MINOR project report “{TITLE_QUOTED}” is submitted by “{names}” who carried out the project work under my/our supervision.</p></div>
<div class="approve">I/We approve this MINOR project for submission.</div>
<div class="sig left"><div><span class="name">{HOD}</span></div><div>{HOD_DESIG}</div></div>
<div class="sig right"><div><span class="name">{GUIDE}</span></div><div>{GUIDE_DESIG}</div><div>(Project Guide)</div></div>
</section>''')

    # ---------- abstract ----------
    sec = BeautifulSoup('<section class="page"><h1 class="front-title">Abstract</h1></section>', "html.parser").section
    for p in abstract_ps:
        p.attrs.pop("class", None)
        sec.append(p)
    body.append(sec)

    # ---------- acknowledgement ----------
    sec = BeautifulSoup('<section class="page"><h1 class="front-title" style="margin-top:0">Acknowledgement</h1></section>', "html.parser").section
    for p in ack_ps:
        for t in p.find_all(string=lambda s: "[Project Guide Name]" in s):
            t.replace_with(t.replace("[Project Guide Name]", f"our project guide {GUIDE} {GUIDE_DESIG}"))
        if "[Student Names]" in p.get_text() or p.get_text(strip=True) == "Project Team":
            continue
        sec.append(p)
    sig = "".join(f"<div>{s}</div>" for s in STUDENTS)
    sec.append(BeautifulSoup(f'<div class="ack-sign"><div><div>Place: Delhi</div><div>Date:</div></div><div class="r">{sig}</div></div>', "html.parser"))
    body.append(sec)

    # ---------- main content transforms ----------
    add_missing_sections(main)
    for fid, num, title in (("list-of-tables", "3.4", "Project schedule (Gantt chart)"),
                            ("list-of-figures", "3.4", "Overall development flow")):
        tbl = main.find("h1", id=fid).find_next("table")
        prev = [tr for tr in tbl.find_all("tr")[1:] if tr.find("td").get_text(strip=True).startswith("3.")][-1]
        prev.insert_after(BeautifulSoup(f"<tr><td>{num}</td><td>{title}</td></tr>", "html.parser"))
    # promote numbered x.y h3 headings to section level
    for h in main.find_all("h3"):
        if re.match(r"^\d+\.\d+\s", h.get_text()):
            h.name = "h2"
    # front lists
    front_ids = {"list-of-tables", "list-of-figures", "symbols-abbreviations-and-nomenclature"}
    for h in main.find_all("h1"):
        if h.get("id") in front_ids:
            h["class"] = ["front-title"]
            if h["id"] == "symbols-abbreviations-and-nomenclature":
                h.string = "List of Symbols, Abbreviations and Nomenclature"
        else:
            h["class"] = ["chapter"]
            m = re.match(r"Chapter\s+(\d+):\s*(.+)", h.get_text())
            if m:
                h.string = f"Chapter {m.group(1)} - {m.group(2)}"
    # wrap each front list in its own page
    for fid in front_ids:
        h = main.find("h1", id=fid)
        wrap = out.new_tag("section", attrs={"class": "page"})
        tbl = h.find_next_sibling("div")
        h.insert_before(wrap)
        wrap.append(h.extract())
        wrap.append(tbl.extract())
    # first chapter page break is provided by the preceding section
    # table captions (from the report's List of Tables)
    lot_titles = {}
    for tr in main.find("h1", id="list-of-tables").find_next("table").find_all("tr")[1:]:
        tds = [td.get_text(strip=True) for td in tr.find_all("td")]
        lot_titles[tds[0]] = tds[1]
    for p in main.find_all("p"):
        if re.match(r"^Table \d+\.\d+\.", p.get_text()):
            p.decompose()
    captioned = set()
    for wrap in main.find_all("div", class_="table-wrap"):
        heads = tuple(th.get_text(strip=True) for th in wrap.find_all("th"))
        for sig_heads, num in TABLE_CAPTIONS:
            if heads == sig_heads and num not in captioned:
                cap = out.new_tag("p", attrs={"class": "table-caption", "id": f"table-{num}"})
                cap.string = f"Table {num}: {lot_titles[num]}"
                wrap.insert_before(cap)
                captioned.add(num)
    for td in main.select("div.table-wrap td:first-child"):
        if len(td.get_text(strip=True)) <= 6:
            td["class"] = ["nw"]
    missing = {n for _, n in TABLE_CAPTIONS} - captioned
    if missing:
        print("WARNING: no table found for captions", missing)
    # figure captions: "Figure 3.1. Title." -> "Figure 3.1 Title"
    for fc in main.find_all("figcaption"):
        t = fc.get_text().strip()
        t = re.sub(r"^(Figure \d+\.\d+)\.\s*", r"\1 ", t).rstrip(".")
        fc.string = t
        num = re.match(r"Figure (\d+\.\d+)", t)
        if num:
            fc["id"] = f"figure-{num.group(1)}"
    # rebuild list tables with page numbers
    def rebuild_list(fid, head, kind):
        old = main.find("h1", id=fid).find_next("table")
        rows = [[td.get_text(strip=True) for td in tr.find_all("td")] for tr in old.find_all("tr")[1:]]
        cls = "lists symbols" if kind == "sym" else "lists"
        html = f'<table class="{cls}"><thead><tr>'
        if kind == "sym":
            html += f'<th class="n">{head[0]}</th><th>{head[1]}</th></tr></thead><tbody>'
            html += "".join(f'<tr><td class="n">{a}</td><td>{b}</td></tr>' for a, b in rows)
        else:
            html += f'<th class="n">{head[0]}</th><th>TITLE</th><th class="pg">PAGE NO.</th></tr></thead><tbody>'
            for a, b in rows:
                pg = page_map.get(f"{kind}-{a}", "")
                html += f'<tr><td class="n">{a}</td><td>{b}</td><td class="pg">{pg}</td></tr>'
        html += "</tbody></table>"
        old.replace_with(BeautifulSoup(html, "html.parser"))
    rebuild_list("list-of-tables", ("TABLE NO.",), "table")
    rebuild_list("list-of-figures", ("FIGURE NO.",), "figure")
    rebuild_list("symbols-abbreviations-and-nomenclature", ("SYMBOL / ABBREVIATION", "DESCRIPTION"), "sym")

    # ---------- table of contents ----------
    rows = [("", "Certificate", 2), ("", "Abstract", 3), ("", "Acknowledgement", 4), ("", "Table of Contents", page_map.get("toc", 5)),
            ("", "List of Tables", page_map.get("list-of-tables", "")), ("", "List of Figures", page_map.get("list-of-figures", "")),
            ("", "List of Symbols, Abbreviations and Nomenclature", page_map.get("symbols-abbreviations-and-nomenclature", ""))]
    toc_rows = ""
    for a, b, c in rows:
        toc_rows += f'<tr><td class="n">{a}</td><td>{b}</td><td class="pg">{c}</td></tr>'
    for h in main.find_all(["h1", "h2"]):
        if "front-title" in (h.get("class") or []):
            continue
        if not h.get("id"):
            h["id"] = re.sub(r"[^a-z0-9]+", "-", h.get_text().lower()).strip("-")
        pg = page_map.get(h["id"], "")
        text = h.get_text().strip()
        if h.name == "h1":
            m = re.match(r"Chapter (\d+) - (.+)", text)
            label = f"CHAPTER {m.group(1)}: {m.group(2)}" if m else text
            toc_rows += f'<tr class="chap"><td class="n"></td><td>{label}</td><td class="pg">{pg}</td></tr>'
        else:
            m = re.match(r"^(\d+\.\d+)\s+(.+)", text)
            num, title = (m.group(1), m.group(2)) if m else ("", text)
            toc_rows += f'<tr><td class="n">{num}</td><td>{title}</td><td class="pg">{pg}</td></tr>'
    add(f'<section class="page" id="toc"><h1 class="front-title" style="margin-top:22pt">Table of Contents</h1>'
        f'<table class="toc"><thead><tr><th class="n">S. NO.</th><th>CONTENTS</th><th class="pg">PAGE NO.</th></tr></thead>'
        f"<tbody>{toc_rows}</tbody></table></section>")

    # strip the source's inline colours from SVG text classes is unnecessary; keep diagrams as figures
    main.attrs = {"class": "content"}
    body.append(main)
    return str(out)


def find_pages(pdf_path, html):
    """Map heading ids / table / figure captions to the PDF page where they appear."""
    soup = BeautifulSoup(html, "html.parser")
    doc = pymupdf.open(pdf_path)
    pages = [[norm(l) for l in p.get_text().splitlines() if l.strip()] for p in doc]
    joined = [" ".join(p) for p in pages]
    result = {}
    toc_start = None
    for i, lines in enumerate(pages):
        if "table of contents" in lines:
            toc_start = i
            break
    result["toc"] = (toc_start or 4) + 1
    start = (toc_start or 0) + 1
    while start < len(pages) and "s. no." in pages[start] and "contents" in pages[start]:
        start += 1  # skip TOC continuation pages
    targets = []
    for h in soup.select("main h1, main h2"):
        targets.append((h["id"], h.get_text()))
    for cap in soup.select("p.table-caption"):
        targets.append(("table-" + cap["id"].split("-", 1)[1], cap.get_text()))
    for fc in soup.select("figcaption[id]"):
        targets.append(("figure-" + fc["id"].split("-", 1)[1], fc.get_text()))
    cursor = start
    for key, text in targets:
        t = norm(text)
        found = None
        for i in range(start, len(pages)):
            if t in pages[i] or (len(t) > 30 and t in joined[i]):
                found = i
                break
        if found is None:  # heading wrapped across lines
            short = t[:40]
            for i in range(start, len(pages)):
                if short in joined[i]:
                    found = i
                    break
        if found is not None:
            result[key] = found + 1
        else:
            print("WARNING: page not found for", key, repr(text))
    return result, len(doc)


def main():
    page_map = {}
    for attempt in range(5):
        html = build(page_map)
        OUT_HTML.write_text(html, encoding="utf-8")
        print_pdf(OUT_HTML, OUT_PDF)
        new_map, n = find_pages(OUT_PDF, html)
        print(f"pass {attempt + 1}: {n} pages")
        if new_map == page_map:
            break
        page_map = new_map
    print(OUT_PDF)


if __name__ == "__main__":
    main()
