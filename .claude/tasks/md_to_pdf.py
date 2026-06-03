"""Convert realestate-flow-addToTable.md to PDF."""
import re
import sys
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Preformatted,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.lib.enums import TA_LEFT


SRC = Path(r"C:\Users\FCT\Documents\Development\consteon\widget-claude\.claude\tasks\realestate-flow-addToTable.md")
OUT = SRC.with_suffix(".pdf")


def make_styles():
    base = getSampleStyleSheet()
    styles = {
        "h1": ParagraphStyle(
            "H1", parent=base["Heading1"],
            fontName="Helvetica-Bold", fontSize=20, leading=24,
            spaceBefore=18, spaceAfter=12, textColor=colors.HexColor("#1a1a1a"),
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"],
            fontName="Helvetica-Bold", fontSize=15, leading=19,
            spaceBefore=14, spaceAfter=8, textColor=colors.HexColor("#0d47a1"),
        ),
        "h3": ParagraphStyle(
            "H3", parent=base["Heading3"],
            fontName="Helvetica-Bold", fontSize=12, leading=15,
            spaceBefore=10, spaceAfter=6, textColor=colors.HexColor("#1565c0"),
        ),
        "h4": ParagraphStyle(
            "H4", parent=base["Heading4"],
            fontName="Helvetica-Bold", fontSize=10, leading=13,
            spaceBefore=6, spaceAfter=3, textColor=colors.HexColor("#37474f"),
        ),
        "body": ParagraphStyle(
            "Body", parent=base["BodyText"],
            fontName="Helvetica", fontSize=9, leading=13,
            spaceAfter=4, alignment=TA_LEFT,
        ),
        "code": ParagraphStyle(
            "Code", parent=base["Code"],
            fontName="Courier", fontSize=7.5, leading=9,
            leftIndent=8, rightIndent=4,
            backColor=colors.HexColor("#f5f5f5"),
            borderPadding=4, borderColor=colors.HexColor("#cccccc"), borderWidth=0.5,
            spaceAfter=6, spaceBefore=4,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["BodyText"],
            fontName="Helvetica", fontSize=9, leading=12,
            leftIndent=14, bulletIndent=4,
            spaceAfter=2,
        ),
        "tablecell": ParagraphStyle(
            "TblCell", fontName="Helvetica", fontSize=7.5, leading=9, alignment=TA_LEFT,
        ),
        "tablehead": ParagraphStyle(
            "TblHead", fontName="Helvetica-Bold", fontSize=8, leading=10, alignment=TA_LEFT,
            textColor=colors.white,
        ),
    }
    return styles


def escape_inline(text):
    """Escape XML special chars then re-apply markdown inline formatting."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"\*\*([^\*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<!\*)\*([^\*\n]+)\*(?!\*)", r"<i>\1</i>", text)
    text = re.sub(r"`([^`]+)`", r'<font face="Courier" size="8" backColor="#f0f0f0">\1</font>', text)
    text = re.sub(r"\[([^\]]+)\]\(([^\)]+)\)", r'<link href="\2" color="#1565c0">\1</link>', text)
    return text


def parse_table(lines, i):
    """Parse markdown pipe table starting at lines[i]. Return (Table flowable, next i)."""
    rows = []
    while i < len(lines) and lines[i].lstrip().startswith("|"):
        row = lines[i].strip()
        cells = [c.strip() for c in row.strip("|").split("|")]
        rows.append(cells)
        i += 1
    if len(rows) < 2:
        return None, i
    header = rows[0]
    body = rows[2:]  # skip separator row
    styles = make_styles()
    table_data = [[Paragraph(escape_inline(c), styles["tablehead"]) for c in header]]
    for r in body:
        while len(r) < len(header):
            r.append("")
        r = r[:len(header)]
        table_data.append([Paragraph(escape_inline(c), styles["tablecell"]) for c in r])
    n_cols = len(header)
    page_w = A4[0] - 30 * mm
    col_w = page_w / n_cols
    tbl = Table(table_data, colWidths=[col_w] * n_cols, repeatRows=1)
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0d47a1")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#bbbbbb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    return tbl, i


def md_to_story(md_text):
    styles = make_styles()
    story = []
    lines = md_text.splitlines()
    i = 0
    in_code = False
    code_buf = []
    while i < len(lines):
        line = lines[i]
        # Code fence
        if line.lstrip().startswith("```"):
            if in_code:
                code_text = "\n".join(code_buf)
                # Truncate very long lines for fit
                code_text = "\n".join(
                    (ln if len(ln) <= 120 else ln[:117] + "...") for ln in code_text.split("\n")
                )
                story.append(Preformatted(code_text, styles["code"]))
                code_buf = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue
        # Table
        if line.lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|[\s\-:|]+\|\s*$", lines[i + 1]):
            tbl, i = parse_table(lines, i)
            if tbl is not None:
                story.append(tbl)
                story.append(Spacer(1, 4))
            continue
        # Headings
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            level = len(m.group(1))
            text = escape_inline(m.group(2))
            key = f"h{level}"
            story.append(Paragraph(text, styles[key]))
            i += 1
            continue
        # Horizontal rule
        if line.strip() == "---":
            story.append(Spacer(1, 6))
            tbl = Table([[""]], colWidths=[A4[0] - 30 * mm], rowHeights=[0.5])
            tbl.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.6, colors.HexColor("#888888"))]))
            story.append(tbl)
            story.append(Spacer(1, 6))
            i += 1
            continue
        # Bullet list
        m = re.match(r"^(\s*)[-*]\s+(.*)$", line)
        if m:
            indent = len(m.group(1)) // 2
            text = escape_inline(m.group(2))
            bullet_style = ParagraphStyle(
                f"bul{indent}", parent=styles["bullet"], leftIndent=14 + indent * 14
            )
            story.append(Paragraph(text, bullet_style, bulletText="•"))
            i += 1
            continue
        # Numbered list
        m = re.match(r"^(\s*)(\d+)\.\s+(.*)$", line)
        if m:
            indent = len(m.group(1)) // 2
            num = m.group(2)
            text = escape_inline(m.group(3))
            num_style = ParagraphStyle(
                f"num{indent}", parent=styles["bullet"], leftIndent=18 + indent * 14
            )
            story.append(Paragraph(text, num_style, bulletText=f"{num}."))
            i += 1
            continue
        # Empty line
        if not line.strip():
            story.append(Spacer(1, 3))
            i += 1
            continue
        # Body paragraph
        story.append(Paragraph(escape_inline(line), styles["body"]))
        i += 1
    return story


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#888888"))
    canvas.drawRightString(A4[0] - 15 * mm, 10 * mm, f"Page {doc.page}")
    canvas.drawString(15 * mm, 10 * mm, "Real Estate Flow — addToTable / updateTableRow Design")
    canvas.restoreState()


def main():
    if not SRC.exists():
        print(f"Source not found: {SRC}")
        sys.exit(1)
    md_text = SRC.read_text(encoding="utf-8")
    story = md_to_story(md_text)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=15 * mm, rightMargin=15 * mm,
        topMargin=15 * mm, bottomMargin=18 * mm,
        title="Real Estate Flow — addToTable / updateTableRow Design",
        author="Consteon Widget Claude",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"PDF written: {OUT}")
    print(f"Size: {OUT.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
