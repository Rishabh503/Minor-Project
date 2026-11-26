"""Build a Word (.docx) version of the formatted Ascent report.

Usage:  python scratch/format-report.py      (first, so the HTML is current)
        python scratch/report-to-docx.py
Input:  output/report/Ascent_Minor_Project_Report_Formatted.html
Output: output/docx/Ascent_Minor_Project_Report.docx

Diagrams are rendered to PNG with headless Chrome. The table of contents and the
lists of tables/figures are Word fields; scratch/update-docx-fields.ps1 then opens
the file in Word, fills them in, and saves a preview PDF.
"""
import importlib.util, re, subprocess, tempfile
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Inches, RGBColor
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("fmt", ROOT / "scratch/format-report.py")
fmt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fmt)

SRC = fmt.OUT_HTML
OUT = ROOT / "output/docx/Ascent_Minor_Project_Report.docx"
FONT = "Times New Roman"
TEXT_W = Inches(6.27)  # A4 width minus 1" margins


# ---------------------------------------------------------------- helpers
def set_cell_borders(table):
    tbl = table._tbl
    pr = tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{side}")
        e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "6"); e.set(qn("w:color"), "000000")
        b.append(e)
    pr.append(b)


def no_borders(table):
    pr = table._tbl.tblPr
    b = OxmlElement("w:tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{side}"); e.set(qn("w:val"), "nil"); b.append(e)
    pr.append(b)


def repeat_header(row):
    trPr = row._tr.get_or_add_trPr()
    e = OxmlElement("w:tblHeader"); e.set(qn("w:val"), "true"); trPr.append(e)


def cant_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(OxmlElement("w:cantSplit"))


def add_field(par, instr, placeholder=""):
    """Insert a complex field (TOC, PAGE ...) into a paragraph."""
    def fc(t):
        r = par.add_run(); e = OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"), t); r._r.append(e)
    fc("begin")
    r = par.add_run(); it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = instr; r._r.append(it)
    fc("separate")
    par.add_run(placeholder)
    fc("end")


def fmt_par(p, align=None, before=0, after=8, line=1.5, keep_next=False, first_indent=None, left=None):
    pf = p.paragraph_format
    if align is not None:
        pf.alignment = align
    pf.space_before, pf.space_after, pf.line_spacing = Pt(before), Pt(after), line
    pf.keep_with_next = keep_next
    if first_indent is not None:
        pf.first_line_indent = first_indent
    if left is not None:
        pf.left_indent = left
    return p


def run(p, text, size=None, bold=None, italic=None, underline=None):
    r = p.add_run(text)
    if size: r.font.size = Pt(size)
    if bold is not None: r.bold = bold
    if italic is not None: r.italic = italic
    if underline is not None: r.underline = underline
    return r


def inline(p, node, bold=False, italic=False, size=None):
    """Copy inline HTML (text, strong, em, code, a, br) into paragraph runs."""
    for c in node.children:
        if isinstance(c, NavigableString):
            t = re.sub(r"\s+", " ", str(c))
            if t:
                run(p, t, size=size, bold=bold or None, italic=italic or None)
        elif c.name == "br":
            p.add_run().add_break()
        elif c.name in ("strong", "b"):
            inline(p, c, True, italic, size)
        elif c.name in ("em", "i"):
            inline(p, c, bold, True, size)
        else:
            inline(p, c, bold, italic, size)
    # trim leading/trailing spaces
    if p.runs:
        p.runs[0].text = p.runs[0].text.lstrip()
        p.runs[-1].text = p.runs[-1].text.rstrip()


def page_break(doc):
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


# ---------------------------------------------------------------- figures
def render_figures(soup, css, tmp):
    """Screenshot each diagram figure (SVG or HTML grid) to a trimmed PNG."""
    pngs = {}
    chrome = fmt.chrome()
    for i, fig in enumerate(soup.select("main figure.diagram")):
        f = BeautifulSoup(str(fig), "html.parser").figure
        if f.figcaption:
            f.figcaption.decompose()
        svg = f.find("svg")
        width = 1100
        if svg is not None and svg.get("viewbox") or (svg is not None and svg.get("viewBox")):
            vb = (svg.get("viewbox") or svg.get("viewBox")).split()
            height = int(width * 0.92 * float(vb[3]) / float(vb[2])) + 80
        else:
            height = 400
        html = tmp / f"fig{i}.html"
        html.write_text(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}'
                        f'body{{margin:0;padding:20px;width:{width - 40}px}} figure{{margin:0}}</style></head>'
                        f"<body>{f}</body></html>", encoding="utf-8")
        png = tmp / f"fig{i}.png"
        with tempfile.TemporaryDirectory() as prof:
            subprocess.run([chrome, "--headless=new", "--disable-gpu", f"--user-data-dir={prof}", "--hide-scrollbars",
                            "--force-device-scale-factor=2", f"--window-size={width},{height}",
                            f"--screenshot={png}", html.as_uri()], check=True, capture_output=True, timeout=120)
        im = Image.open(png).convert("RGB")
        bbox = ImageChops.difference(im, Image.new("RGB", im.size, "white")).getbbox()
        if bbox:
            im = im.crop((max(bbox[0] - 10, 0), max(bbox[1] - 10, 0), min(bbox[2] + 10, im.width), min(bbox[3] + 10, im.height)))
        im.save(png)
        pngs[id(fig)] = png
    return pngs


# ---------------------------------------------------------------- styles
def setup_styles(doc):
    st = doc.styles
    normal = st["Normal"]
    normal.font.name = FONT; normal.font.size = Pt(12); normal.font.color.rgb = RGBColor(0, 0, 0)
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    pf = normal.paragraph_format
    pf.space_after, pf.line_spacing = Pt(8), 1.5
    pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    def heading(name, size, bold, align, before, after, upper=False, page_before=False):
        s = st[name]
        s.font.name = FONT; s.font.size = Pt(size); s.font.bold = bold; s.font.italic = False
        s.font.color.rgb = RGBColor(0, 0, 0); s.font.all_caps = upper
        rpr = s.element.get_or_add_rPr()
        rf = rpr.find(qn("w:rFonts"))
        if rf is None:
            rf = OxmlElement("w:rFonts"); rpr.append(rf)
        for a in ("w:ascii", "w:hAnsi", "w:eastAsia", "w:cs"):
            rf.set(qn(a), FONT)
        for a in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
            if rf.get(qn(a)) is not None:
                del rf.attrib[qn(a)]
        p = s.paragraph_format
        p.alignment = align; p.space_before = Pt(before); p.space_after = Pt(after)
        p.keep_with_next = True; p.line_spacing = 1.15; p.page_break_before = page_before

    heading("Heading 1", 16, True, WD_ALIGN_PARAGRAPH.CENTER, 0, 36, upper=True, page_before=True)
    heading("Heading 2", 14, True, WD_ALIGN_PARAGRAPH.CENTER, 24, 12)
    heading("Heading 3", 12, True, WD_ALIGN_PARAGRAPH.LEFT, 8, 6)

    def pstyle(name, size=12, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, before=0, after=8, outline=None):
        s = st.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
        s.base_style = normal
        s.font.size = Pt(size); s.font.bold = bold; s.font.italic = italic
        p = s.paragraph_format
        p.alignment = align; p.space_before = Pt(before); p.space_after = Pt(after); p.line_spacing = 1.15
        if outline is not None:
            o = OxmlElement("w:outlineLvl"); o.set(qn("w:val"), str(outline))
            s.element.get_or_add_pPr().append(o)
        return s

    pstyle("Front Title", 18, True, align=WD_ALIGN_PARAGRAPH.CENTER, before=0, after=16, outline=0).font.all_caps = True
    st["Front Title"].paragraph_format.keep_with_next = True
    pstyle("Table Caption", before=10, after=6).paragraph_format.keep_with_next = True
    pstyle("Figure Caption", italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, before=4, after=14)
    pstyle("Table Text", size=12, after=0)
    code = pstyle("Code Text", size=11, after=0)
    code.font.name = FONT


# ---------------------------------------------------------------- tables
def add_table(doc, tbl_el, widths=None, center_cols=()):
    rows = tbl_el.find_all("tr")
    ncols = max(len(r.find_all(["td", "th"])) for r in rows)
    t = doc.add_table(rows=0, cols=ncols)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = widths is None
    set_cell_borders(t)
    for ri, tr in enumerate(rows):
        cells = tr.find_all(["td", "th"])
        row = t.add_row()
        cant_split(row)
        if tr.find_parent("thead") is not None:
            repeat_header(row)
        for ci, cell in enumerate(cells):
            c = row.cells[ci]
            p = c.paragraphs[0]
            p.style = doc.styles["Table Text"]
            if ci in center_cols:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            inline(p, cell, bold=cell.name == "th" and "toc" not in (tbl_el.get("class") or []) and False)
            if cell.name == "th":
                for r_ in p.runs:
                    r_.bold = True
    if len(rows) <= 15:  # keep short tables on one page
        for row in t.rows[:-1]:
            for c in row.cells:
                for p in c.paragraphs:
                    p.paragraph_format.keep_with_next = True
    if widths:
        for row in t.rows:
            for c, w in zip(row.cells, widths):
                c.width = w
    doc.add_paragraph().paragraph_format.space_after = Pt(4)
    return t


# ---------------------------------------------------------------- main build
def build():
    soup = BeautifulSoup(SRC.read_text(encoding="utf-8"), "html.parser")
    css = soup.style.get_text()
    sections = soup.body.find_all("section", recursive=False)
    abstract_sec, ack_sec = sections[2], sections[3]
    main = soup.find("main")

    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.27), Inches(11.69)
    sec.left_margin = sec.right_margin = sec.top_margin = sec.bottom_margin = Inches(1)
    sec.different_first_page_header_footer = True
    fp = sec.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_field(fp, "PAGE", "1")
    setup_styles(doc)

    # ---------- cover ----------
    def line(text, size, bold=False, before=0, after=4):
        p = fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER, before, after, 1.15)
        run(p, text, size, bold)
        return p
    line(fmt.TITLE, 18, True, 0, 30)
    line("A", 14); line("MINOR PROJECT REPORT", 16, after=24)
    line("Submitted by", 12, after=6)
    for s in fmt.STUDENTS:
        line(s, 14, True)
    line("BACHELOR OF TECHNOLOGY", 14, before=24); line("IN", 14); line("COMPUTER SCIENCE AND TECHNOLOGY", 14, True, after=12)
    line("Under the Guidance", 12); line("of", 12)
    line(fmt.GUIDE, 14, True, after=0); line(fmt.GUIDE_DESIG, 14, True, after=14)
    p = fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER, 0, 30, 1.0)
    p.add_run().add_picture(str(fmt.LOGO), width=Inches(1.3))
    line("Department of Computer Science and Technology", 14, after=8)
    line("Maharaja Agrasen Institute of Technology,", 14, after=8)
    line("PSP area, Sector – 22, Rohini, New Delhi – 110085", 14, after=8)
    line("(Affiliated to Guru Gobind Singh Indraprastha University, New Delhi)", 14, after=8)
    line(fmt.DATE, 14)

    # ---------- certificate ----------
    line("MAHARAJA AGRASEN INSTITUTE OF TECHNOLOGY", 18, True, 0, 4).paragraph_format.page_break_before = True
    line("Department of Computer Science and Technology", 18, after=30)
    p = fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER, 0, 30, 1.0)
    p.add_run().add_picture(str(fmt.LOGO), width=Inches(1.5))
    line("CERTIFICATE", 18, True, after=24)
    p = fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER, 0, 24, 1.75)
    run(p, f"This is to certify that this MINOR project report “{fmt.TITLE_QUOTED}” is submitted by "
           f"“{', '.join(fmt.STUDENTS)}” who carried out the project work under my/our supervision.", 14)
    p = fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.LEFT, 0, 60, 1.15)
    run(p, "I/We approve this MINOR project for submission.", 14)
    t = doc.add_table(rows=1, cols=2); no_borders(t)
    hod_desig = fmt.HOD_DESIG.replace("&amp;", "&")
    for cell, lines, al in ((t.cell(0, 0), [fmt.HOD, hod_desig], WD_ALIGN_PARAGRAPH.LEFT),
                            (t.cell(0, 1), [fmt.GUIDE, fmt.GUIDE_DESIG, "(Project Guide)"], WD_ALIGN_PARAGRAPH.RIGHT)):
        for i, txt in enumerate(lines):
            p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
            fmt_par(p, al, 0, 12, 1.15)
            run(p, txt, 14, underline=(i == 0))

    # ---------- abstract ----------
    p = doc.add_paragraph("Abstract", style="Front Title"); p.paragraph_format.page_break_before = True
    for el in abstract_sec.find_all("p"):
        inline(doc.add_paragraph(), el)

    # ---------- acknowledgement ----------
    p = doc.add_paragraph("Acknowledgement", style="Front Title"); p.paragraph_format.page_break_before = True
    for el in ack_sec.find_all("p"):
        inline(doc.add_paragraph(), el)
    doc.add_paragraph()
    t = doc.add_table(rows=1, cols=2); no_borders(t)
    for i, txt in enumerate(["Place: Delhi", "Date:"]):
        p = t.cell(0, 0).paragraphs[0] if i == 0 else t.cell(0, 0).add_paragraph()
        fmt_par(p, WD_ALIGN_PARAGRAPH.LEFT, 0, 8, 1.15).add_run(txt)
    for i, txt in enumerate(fmt.STUDENTS):
        p = t.cell(0, 1).paragraphs[0] if i == 0 else t.cell(0, 1).add_paragraph()
        fmt_par(p, WD_ALIGN_PARAGRAPH.RIGHT, 0, 8, 1.15).add_run(txt)

    # ---------- table of contents (Word field) ----------
    p = doc.add_paragraph("Table of Contents", style="Front Title"); p.paragraph_format.page_break_before = True
    add_field(fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.LEFT), 'TOC \\o "1-2" \\h \\z \\u',
              "Right-click here and choose Update Field to build the table of contents.")

    # ---------- main content ----------
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        pngs = render_figures(soup, css, tmp)
        for el in main.children:
            if not getattr(el, "name", None):
                continue
            emit(doc, el, pngs)
        OUT.parent.mkdir(parents=True, exist_ok=True)
        doc.save(OUT)
    print(OUT)


def emit(doc, el, pngs):
    cls = el.get("class") or []
    name = el.name
    if name == "section":  # list of tables / figures / symbols
        title = el.find("h1").get_text().strip()
        p = doc.add_paragraph(title, style="Front Title"); p.paragraph_format.page_break_before = True
        style = {"List of Tables": "Table Caption", "List of Figures": "Figure Caption"}.get(title)
        if style:
            add_field(fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.LEFT), f'TOC \\h \\z \\t "{style},1"',
                      "Right-click here and choose Update Field to build this list.")
        else:
            add_table(doc, el.find("table"), widths=[Inches(2.3), Inches(3.97)])
    elif name == "h1":
        doc.add_paragraph(el.get_text().strip(), style="Heading 1")
    elif name == "h2":
        doc.add_paragraph(el.get_text().strip(), style="Heading 2")
    elif name == "h3":
        doc.add_paragraph(el.get_text().strip(), style="Heading 3")
    elif name == "p" and "table-caption" in cls:
        doc.add_paragraph(el.get_text().strip(), style="Table Caption")
    elif name == "p":
        inline(doc.add_paragraph(), el)
    elif name in ("ul", "ol"):
        for i, li in enumerate(el.find_all("li", recursive=False), 1):
            p = fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.JUSTIFY, 0, 6, 1.5,
                        first_indent=Inches(-0.3), left=Inches(0.55 if name == "ul" else 0.4))
            run(p, ("•" if name == "ul" else f"{i}.") + "\t")
            p.paragraph_format.tab_stops.add_tab_stop(Inches(0.55 if name == "ul" else 0.4))
            inline(p, li)
            if p.runs and p.runs[0].text.strip() == "":
                pass
    elif name == "div" and "table-wrap" in cls:
        tbl = el.find("table")
        if "gantt" in cls:
            add_table(doc, tbl, widths=[Inches(2.4)] + [Inches(0.43)] * 9, center_cols=range(1, 10))
        else:
            add_table(doc, tbl)
    elif name == "figure" and "code-figure" in cls:
        for ln in el.find("pre").get_text().split("\n"):
            p = doc.add_paragraph(style="Code Text")
            p.paragraph_format.keep_with_next = True
            p.add_run(ln.replace("\t", "    ") or " ")
        doc.add_paragraph().paragraph_format.space_after = Pt(4)
    elif name == "figure":
        p = fmt_par(doc.add_paragraph(), WD_ALIGN_PARAGRAPH.CENTER, 8, 4, 1.0, keep_next=True)
        png = pngs[id(el)]
        w, h = Image.open(png).size
        width = min(TEXT_W * 0.95, Inches(6.0 * min(1.0, (w / h) / 1.2) if w / h < 1.2 else 6.0))
        p.add_run().add_picture(str(png), width=int(width))
        cap = el.find("figcaption")
        if cap:
            doc.add_paragraph(cap.get_text().strip(), style="Figure Caption")
    else:
        print("WARNING: unhandled element", name, cls)


if __name__ == "__main__":
    build()
