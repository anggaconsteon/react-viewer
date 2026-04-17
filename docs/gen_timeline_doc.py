import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT

OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "timeline_developer_instruction.pdf")

# ── Palette ───────────────────────────────────────────────────────────────────
C_DARK    = colors.HexColor("#1A1A2E")
C_ACCENT  = colors.HexColor("#16213E")
C_TEAL    = colors.HexColor("#0F7B6C")
C_BLUE    = colors.HexColor("#1565C0")
C_PURPLE  = colors.HexColor("#6A0DAD")
C_LIGHT   = colors.HexColor("#F5F7FA")
C_BORDER  = colors.HexColor("#CCCCCC")
C_WARN_B  = colors.HexColor("#7D4E00")
C_WARN_BG = colors.HexColor("#FFF8E1")
C_CODE_BG = colors.HexColor("#F0F4F8")
C_CODE_BD = colors.HexColor("#90A4AE")
C_GREEN   = colors.HexColor("#2E7D32")
C_RED     = colors.HexColor("#C62828")
C_ORANGE  = colors.HexColor("#E65100")
C_GREY    = colors.HexColor("#546E7A")

def S(name, **kw):
    return ParagraphStyle(name, **kw)

TITLE   = S("T", fontSize=22, textColor=colors.white, fontName="Helvetica-Bold", leading=28, spaceAfter=3)
SUBT    = S("St", fontSize=11, textColor=colors.HexColor("#B0C4DE"), fontName="Helvetica", spaceAfter=2)
META    = S("Me", fontSize=8.5, textColor=colors.HexColor("#7FA8CC"), fontName="Helvetica")
SECHEAD = S("Sh", fontSize=13, textColor=C_DARK, fontName="Helvetica-Bold", spaceBefore=12, spaceAfter=5)
SUBHEAD = S("Sub", fontSize=10.5, textColor=C_BLUE, fontName="Helvetica-Bold", spaceBefore=8, spaceAfter=4)
BODY    = S("Bo", fontSize=9.5, fontName="Helvetica", leading=14, textColor=colors.HexColor("#222"), spaceAfter=3, alignment=TA_JUSTIFY)
BODYB   = S("Bb", fontSize=9.5, fontName="Helvetica-Bold", leading=14, textColor=colors.HexColor("#111"), spaceAfter=3)
BULL    = S("Bl", fontSize=9.5, fontName="Helvetica", leading=14, textColor=colors.HexColor("#222"), spaceAfter=3, leftIndent=16)
BULL2   = S("B2", fontSize=9, fontName="Helvetica", leading=13, textColor=colors.HexColor("#444"), spaceAfter=2, leftIndent=32)
CODE    = S("Co", fontSize=8.5, fontName="Courier", leading=13, textColor=colors.HexColor("#1A237E"), spaceAfter=1)
CODEG   = S("Cg", fontSize=8, fontName="Courier", leading=12, textColor=C_GREY, spaceAfter=1)
WARN    = S("Wa", fontSize=9, fontName="Helvetica-Bold", leading=13, textColor=C_WARN_B, spaceAfter=2)
LBSTYLE = S("Lb", fontSize=8, fontName="Helvetica-Bold", textColor=colors.white)
CELL    = S("Ce", fontSize=9, fontName="Helvetica", leading=13, textColor=colors.HexColor("#222"), spaceAfter=0)
CELLB   = S("Cb", fontSize=9, fontName="Helvetica-Bold", leading=13, textColor=colors.HexColor("#111"), spaceAfter=0)
CELLC   = S("Cc", fontSize=8.5, fontName="Courier", leading=12, textColor=colors.HexColor("#1A237E"), spaceAfter=0)
CELLH   = S("Ch", fontSize=9, fontName="Helvetica-Bold", leading=13, textColor=colors.white, spaceAfter=0)

def rule(c=C_BORDER, t=0.5):
    return HRFlowable(width="100%", thickness=t, color=c, spaceAfter=5, spaceBefore=2)

def sec(num, title, color=C_TEAL):
    badge = Table([[Paragraph(str(num), LBSTYLE)]], colWidths=[0.6*cm], rowHeights=[0.6*cm])
    badge.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,-1), color),
        ("ALIGN",       (0,0),(-1,-1), "CENTER"),
        ("VALIGN",      (0,0),(-1,-1), "MIDDLE"),
    ]))
    row = Table([[badge, Paragraph(title, SECHEAD)]], colWidths=[0.9*cm, None])
    row.setStyle(TableStyle([
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
        ("LEFTPADDING",  (1,0),(1,0),   6),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))
    return [row, rule(color, 1)]

def code_block(lines, lang="json"):
    rows = [[Paragraph(l, CODE)] for l in lines]
    t = Table(rows, colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), C_CODE_BG),
        ("BOX",           (0,0),(-1,-1), 0.5, C_CODE_BD),
        ("TOPPADDING",    (0,0),(-1,-1), 3),
        ("BOTTOMPADDING", (0,0),(-1,-1), 3),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("RIGHTPADDING",  (0,0),(-1,-1), 10),
    ]))
    return [t, Spacer(1, 4)]

def warn_box(text):
    t = Table([[Paragraph("&#9888;  " + text, WARN)]], colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), C_WARN_BG),
        ("BOX",           (0,0),(-1,-1), 1, C_WARN_B),
        ("TOPPADDING",    (0,0),(-1,-1), 7),
        ("BOTTOMPADDING", (0,0),(-1,-1), 7),
        ("LEFTPADDING",   (0,0),(-1,-1), 12),
    ]))
    return [t, Spacer(1, 6)]

def info_box(text, bg=colors.HexColor("#E3F2FD"), bd=C_BLUE):
    t = Table([[Paragraph("&#9432;  " + text,
        S("Ib", fontSize=9, fontName="Helvetica", leading=13,
          textColor=colors.HexColor("#0D47A1"), spaceAfter=0))]], colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), bg),
        ("BOX",           (0,0),(-1,-1), 0.8, bd),
        ("TOPPADDING",    (0,0),(-1,-1), 6),
        ("BOTTOMPADDING", (0,0),(-1,-1), 6),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
    ]))
    return [t, Spacer(1, 5)]

def color_chip(hex_val, label):
    try:
        chip_color = colors.HexColor(hex_val if hex_val.startswith("#") else "#"+hex_val)
    except Exception:
        chip_color = colors.grey
    # Single-table row with colored left border using a nested approach
    row = Table([[Paragraph(f"<b>{hex_val}</b> — {label}", CELL)]], colWidths=[None])
    row.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), chip_color),
        ("LEFTPADDING",   (0,0),(-1,-1), 10),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("BOX",           (0,0),(-1,-1), 0.3, C_BORDER),
        ("TEXTCOLOR",     (0,0),(-1,-1), colors.white),
    ]))
    return row

def build():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="Developer Instruction – timeline.json",
        author="MA",
    )
    s = []

    # ── Banner ────────────────────────────────────────────────────────────────
    banner_cell = [
        Paragraph("DEVELOPER INSTRUCTION", TITLE),
        Paragraph("timeline.json — Widget Tasklist &amp; Checklist Patrol", SUBT),
        Spacer(1, 6),
        Paragraph("Tanggal: 16 April 2026&nbsp;&nbsp;|&nbsp;&nbsp;Author: MA&nbsp;&nbsp;|&nbsp;&nbsp;Tipe: DEVELOPER_INSTRUCTION", META),
    ]
    banner = Table([[banner_cell]], colWidths=[None])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), C_DARK),
        ("TOPPADDING",    (0,0),(-1,-1), 20),
        ("BOTTOMPADDING", (0,0),(-1,-1), 20),
        ("LEFTPADDING",   (0,0),(-1,-1), 22),
        ("RIGHTPADDING",  (0,0),(-1,-1), 22),
    ]))
    s.append(banner)
    s.append(Spacer(1, 14))

    # ── ATURAN KHUSUS ─────────────────────────────────────────────────────────
    ak_rows = [
        [Paragraph("<b>ATURAN KHUSUS — DEVELOPER_INSTRUCTION</b>",
            S("AKH", fontSize=9, fontName="Helvetica-Bold", textColor=C_BLUE))],
        [Paragraph("• Dokumen bersifat teknis dan to the point.", BULL)],
        [Paragraph("• Wajib header: Tanggal &amp; Author di setiap dokumen.", BULL)],
        [Paragraph("• Fokus: tujuan fitur, flow logic, kebutuhan data, edge case, catatan implementasi.", BULL)],
        [Paragraph("• Tidak menambahkan asumsi di luar konteks sistem.", BULL)],
        [Paragraph("• Semua poin relevan dengan field yang ada di konfigurasi.", BULL)],
    ]
    ak = Table(ak_rows, colWidths=[None])
    ak.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), colors.HexColor("#EEF4FF")),
        ("BOX",           (0,0),(-1,-1), 1, C_BLUE),
        ("LINEBELOW",     (0,0),(0,0),   1, C_BLUE),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 12),
    ]))
    s.append(ak)
    s.append(Spacer(1, 14))

    # ── 1. Overview ───────────────────────────────────────────────────────────
    s += sec("1", "Overview")
    s.append(Paragraph(
        "File <b>timeline.json</b> mendefinisikan konfigurasi widget <b>Tasklist / Checklist</b> "
        "pada platform Autsorz / Adrifa E-Patrol. Widget ini digunakan petugas lapangan untuk "
        "mencatat status penyelesaian tugas-tugas patrol secara real-time. "
        "Setiap task memiliki 5 kemungkinan status, dilengkapi progress bar otomatis dan "
        "opsi pelaporan masalah beserta bukti foto.", BODY))
    s.append(Spacer(1, 4))

    # ── 2. Objective ──────────────────────────────────────────────────────────
    s += sec("2", "Objective")
    for obj in [
        "Menyediakan antarmuka checklist terstruktur per task/tugas patroli di lapangan.",
        "Memungkinkan petugas menandai status tiap task: selesai, tidak tersedia, dilewati, atau ada masalah.",
        "Menampilkan progress penyelesaian secara visual melalui progress bar dinamis.",
        "Menyediakan mekanisme pelaporan masalah disertai foto dan deskripsi teks.",
        "Mengelompokkan task berdasarkan kategori untuk kemudahan navigasi dan pelaporan.",
    ]:
        s.append(Paragraph(f"• {obj}", BULL))
    s.append(Spacer(1, 4))

    # ── 3. Flow / Logic ───────────────────────────────────────────────────────
    s += sec("3", "Flow / Logic")
    s.append(Paragraph("3.1  Alur Penggunaan Widget", SUBHEAD))
    flow = [
        ("Langkah 1", "App load konfigurasi timeline.json dari Firebase/backend."),
        ("Langkah 2", "Widget render header: title (text[0]) + subtitle (text[1]) + status badge + icon."),
        ("Langkah 3", "Progress bar ditampilkan berdasarkan jumlah task completed vs total (children.length)."),
        ("Langkah 4", "Petugas memilih salah satu task dari daftar children."),
        ("Langkah 5", "Muncul action sheet dengan daftar options (done / notAvailable / skipped / issue)."),
        ("Langkah 6",
         "Petugas pilih opsi:<br/>"
         "&nbsp;&nbsp;• <b>done</b> → task ditandai selesai, timestamp [TIME] diisi otomatis.<br/>"
         "&nbsp;&nbsp;• <b>notAvailable</b> → task ditandai tidak tersedia di area ini.<br/>"
         "&nbsp;&nbsp;• <b>skipped</b> → task dilewati untuk ditinjau kembali.<br/>"
         "&nbsp;&nbsp;• <b>issue</b> → muncul extraFields (photoPicker + textArea) untuk laporan masalah."),
        ("Langkah 7", "Setelah status dipilih, teks task pada children berubah sesuai index text (0–4)."),
        ("Langkah 8", "Progress bar diperbarui: [ALREADY_CHECK] bertambah, [PERCENT] dihitung ulang."),
        ("Langkah 9", "Data status task dikirim ke backend saat submit / auto-sync."),
    ]
    for step, desc in flow:
        kv = Table([[Paragraph(f"<b>{step}</b>", CELLB), Paragraph(desc, CELL)]],
                   colWidths=[2.2*cm, None])
        kv.setStyle(TableStyle([
            ("VALIGN",        (0,0),(-1,-1), "TOP"),
            ("TOPPADDING",    (0,0),(-1,-1), 3),
            ("BOTTOMPADDING", (0,0),(-1,-1), 3),
            ("LEFTPADDING",   (0,0),(-1,-1), 4),
            ("BACKGROUND",    (0,0),(0,-1),  colors.HexColor("#F0F4F8")),
        ]))
        s.append(kv)
        s.append(Spacer(1, 2))

    s.append(Spacer(1, 6))
    s.append(Paragraph("3.2  Pemetaan Status ke Text Index", SUBHEAD))
    s += info_box(
        "Field text pada setiap children berisi 5 segmen dipisah karakter ◆. "
        "Index 0 = label default task. Index 1–4 = teks yang tampil sesuai status yang dipilih."
    )
    status_rows = [
        [Paragraph("<b>Index</b>", CELLH), Paragraph("<b>Status ID</b>", CELLH),
         Paragraph("<b>Teks Contoh</b>", CELLH), Paragraph("<b>Keterangan</b>", CELLH)],
        [Paragraph("0", CELLC), Paragraph("— (default)", CELL),
         Paragraph("Clean table surfaces", CELL), Paragraph("Nama/label task, tampil saat belum ada aksi", CELL)],
        [Paragraph("1", CELLC), Paragraph("done", CELL),
         Paragraph("Completed at [TIME]", CELL), Paragraph("[TIME] = timestamp otomatis saat selesai", CELL)],
        [Paragraph("2", CELLC), Paragraph("notAvailable", CELL),
         Paragraph("Not available in this area", CELL), Paragraph("Task tidak tersedia di lokasi saat ini", CELL)],
        [Paragraph("3", CELLC), Paragraph("skipped", CELL),
         Paragraph("Skipped - revisit later", CELL), Paragraph("Dilewati, akan ditinjau kembali", CELL)],
        [Paragraph("4", CELLC), Paragraph("issue", CELL),
         Paragraph("Issue reported - add details below", CELL), Paragraph("Masalah dilaporkan, extraFields aktif", CELL)],
    ]
    st = Table(status_rows, colWidths=[1.4*cm, 3*cm, 5*cm, None])
    st.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), C_TEAL),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0),(-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0),(-1,-1), 5),
        ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ("LEFTPADDING",   (0,0),(-1,-1), 8),
        ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
    ]))
    s.append(st)
    s.append(Spacer(1, 6))

    s.append(Paragraph("3.3  Formula Progress Bar", SUBHEAD))
    s += code_block([
        "// Token yang tersedia di field progressBar.text:",
        "[ALREADY_CHECK]  = jumlah task dengan status done/notAvailable/skipped/issue",
        "[COUNT]          = total jumlah task (children.length)",
        "[PERCENT]        = Math.round((ALREADY_CHECK / COUNT) * 100)",
        "",
        '// Contoh render dari: "[ALREADY_CHECK]◆[COUNT]◆tasks◆[PERCENT]"',
        "// Segmen ke-0 = jumlah selesai, ke-1 = total, ke-2 = label, ke-3 = persentase",
        '// Output: "2◆3◆tasks◆67"  →  ditampilkan sebagai: "2 / 3 tasks  67%"',
    ])

    # ── 4. Data Requirement ───────────────────────────────────────────────────
    s += sec("4", "Data Requirement")

    s.append(Paragraph("4.1  Field Root Level", SUBHEAD))
    root_fields = [
        ("type",        "string",  "tasklist",  "Wajib", "Jenis widget. Nilai harus \"tasklist\"."),
        ("width",       "integer", "100",       "Wajib", "Lebar widget dalam persen (0–100)."),
        ("text",        "string",  "—",         "Wajib", "Dua segmen dipisah ◆: [0]=judul area, [1]=nama lokasi/site."),
        ("iconStatus",  "string",  "checklist", "Wajib", "Nama ikon untuk badge status header widget."),
        ("status",      "string",  "Verified",  "Wajib", "Label status keseluruhan widget (misal: Verified, Pending)."),
        ("progressBar", "object",  "—",         "Wajib", "Konfigurasi progress bar. Lihat 4.2."),
        ("children",    "array",   "[ ]",       "Wajib", "Daftar task item. Minimal 1 item. Lihat 4.3."),
        ("options",     "array",   "[ ]",       "Wajib", "Daftar aksi yang tersedia. Lihat 4.4."),
    ]
    hdr = [Paragraph(f"<b>{h}</b>", CELLH) for h in ["Field", "Tipe", "Default", "Req", "Keterangan"]]
    rows = [hdr] + [
        [Paragraph(f[0], CELLC), Paragraph(f[1], CELL),
         Paragraph(f[2], CELLC), Paragraph(f[3], CELL), Paragraph(f[4], CELL)]
        for f in root_fields
    ]
    rt = Table(rows, colWidths=[2.8*cm, 1.8*cm, 2*cm, 1.2*cm, None])
    rt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), C_TEAL),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0),(-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 7),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    s.append(rt)
    s.append(Spacer(1, 8))

    s.append(Paragraph("4.2  Field progressBar", SUBHEAD))
    pb_fields = [
        ("height",  "integer", "8",                             "Tinggi progress bar dalam pixel."),
        ("color",   "string",  "#21321",                        "Warna fill bar (format hex). Catatan: nilai saat ini tampak typo — seharusnya 6 digit hex (#2E7D32 misalnya)."),
        ("bgColor", "string",  "#0000",                         "Warna background bar. #0000 = transparan."),
        ("text",    "string",  "[ALREADY_CHECK]◆[COUNT]◆tasks◆[PERCENT]", "Template token dipisah ◆. Lihat 3.3 untuk detail token."),
    ]
    hdr2 = [Paragraph(f"<b>{h}</b>", CELLH) for h in ["Field", "Tipe", "Nilai Saat Ini", "Keterangan"]]
    rows2 = [hdr2] + [
        [Paragraph(f[0], CELLC), Paragraph(f[1], CELL),
         Paragraph(f[2], CELLC), Paragraph(f[3], CELL)]
        for f in pb_fields
    ]
    pbt = Table(rows2, colWidths=[2.2*cm, 1.8*cm, 5.5*cm, None])
    pbt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), C_BLUE),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0),(-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 7),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    s.append(pbt)
    s += warn_box(
        "progressBar.color = \"#21321\" hanya 5 digit — format hex tidak valid. "
        "Pastikan nilai warna selalu 6 digit (#RRGGBB) atau 8 digit (#RRGGBBAA)."
    )

    s.append(Paragraph("4.3  Field children (Task Item)", SUBHEAD))
    ch_fields = [
        ("id",       "string", "Wajib", "Unique identifier task. Konvensi: task_001, task_002, dst. Digunakan sebagai key saat menyimpan status ke backend."),
        ("category", "string", "Wajib", "Kategori pengelompokan task (contoh: Cleaning, Waste, Safety). Digunakan untuk filter/group di UI dan laporan."),
        ("text",     "string", "Wajib", "5 segmen dipisah ◆: [0]=nama task, [1]=teks status done, [2]=teks notAvailable, [3]=teks skipped, [4]=teks issue."),
    ]
    hdr3 = [Paragraph(f"<b>{h}</b>", CELLH) for h in ["Field", "Tipe", "Req", "Keterangan"]]
    rows3 = [hdr3] + [
        [Paragraph(f[0], CELLC), Paragraph(f[1], CELL), Paragraph(f[2], CELL), Paragraph(f[3], CELL)]
        for f in ch_fields
    ]
    cht = Table(rows3, colWidths=[2.2*cm, 1.8*cm, 1.2*cm, None])
    cht.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), C_BLUE),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0),(-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 7),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    s.append(cht)
    s.append(Spacer(1, 4))

    s.append(Paragraph("Contoh children task:", BODYB))
    s += code_block([
        '{',
        '  "id": "task_001",',
        '  "category": "Cleaning",',
        '  "text": "Clean table surfaces',
        '           ◆Completed at [TIME]',
        '           ◆Not available in this area',
        '           ◆Skipped - revisit later',
        '           ◆Issue reported - add details below"',
        '}',
    ])

    s.append(Paragraph("4.4  Field options (Action Item)", SUBHEAD))
    opt_fields = [
        ("id",          "string",  "Wajib", "Identifier aksi. Nilai valid: done | notAvailable | skipped | issue."),
        ("text",        "string",  "Wajib", "2 segmen ◆: [0]=label button, [1]=deskripsi singkat aksi."),
        ("icon",        "string",  "Wajib", "Nama ikon button. Nilai saat ini: checklist | x | skipped | warning."),
        ("bgColor",     "string",  "Wajib", "Warna background button (hex). Lihat tabel warna di bawah."),
        ("extraFields", "array",   "Opsional", "Hanya pada option id=issue. Array input tambahan (photoPicker, textArea)."),
    ]
    hdr4 = [Paragraph(f"<b>{h}</b>", CELLH) for h in ["Field", "Tipe", "Req", "Keterangan"]]
    rows4 = [hdr4] + [
        [Paragraph(f[0], CELLC), Paragraph(f[1], CELL), Paragraph(f[2], CELL), Paragraph(f[3], CELL)]
        for f in opt_fields
    ]
    ot = Table(rows4, colWidths=[2.5*cm, 2*cm, 1.8*cm, None])
    ot.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), C_BLUE),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0),(-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 7),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    s.append(ot)
    s.append(Spacer(1, 6))

    s.append(Paragraph("Warna Button Options:", BODYB))
    chips = [
        ("#4CAF50", "done — Hijau, task selesai"),
        ("#9E9E9E", "notAvailable — Abu-abu, tidak tersedia"),
        ("#E6A020", "skipped — Oranye, dilewati"),
        ("#E53935", "issue — Merah, ada masalah"),
    ]
    for hex_val, label in chips:
        s.append(color_chip(hex_val, label))
        s.append(Spacer(1, 2))
    s.append(Spacer(1, 8))

    s.append(Paragraph("4.5  Field extraFields (hanya pada option issue)", SUBHEAD))
    ef_fields = [
        ("type",  "string", "Wajib", "Jenis input. Nilai valid: photoPicker | textArea."),
        ("label", "string", "Wajib", "Label yang ditampilkan di atas field input."),
    ]
    hdr5 = [Paragraph(f"<b>{h}</b>", CELLH) for h in ["Field", "Tipe", "Req", "Keterangan"]]
    rows5 = [hdr5] + [
        [Paragraph(f[0], CELLC), Paragraph(f[1], CELL), Paragraph(f[2], CELL), Paragraph(f[3], CELL)]
        for f in ef_fields
    ]
    eft = Table(rows5, colWidths=[2.2*cm, 1.8*cm, 1.2*cm, None])
    eft.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,0), C_PURPLE),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0),(-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0),(-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0),(-1,-1), 4),
        ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ("LEFTPADDING",   (0,0),(-1,-1), 7),
        ("VALIGN",        (0,0),(-1,-1), "TOP"),
    ]))
    s.append(eft)
    s.append(Spacer(1, 4))
    s += info_box(
        "extraFields hanya aktif saat option issue dipilih. "
        "photoPicker membuka kamera/galeri; textArea memberikan form teks bebas."
    )

    # ── 5. API / Integration ──────────────────────────────────────────────────
    s += sec("5", "API / Integration")
    s.append(Paragraph(
        "Konfigurasi timeline.json di-load dari Firebase Realtime Database atau Firestore. "
        "Status tiap task disimpan ke backend saat petugas memilih opsi.", BODY))
    s.append(Paragraph("Payload yang dikirim saat update status task (high-level):", BODYB))
    s += code_block([
        "{",
        '  "taskId":    "task_001",',
        '  "status":    "done",          // done | notAvailable | skipped | issue',
        '  "timestamp": 1713200000000,   // Unix ms — menggantikan token [TIME]',
        '  "category":  "Cleaning",',
        '  "note":      "...",            // dari textArea (jika issue)',
        '  "photoUrl":  "https://...",   // dari photoPicker (jika issue)',
        '  "widgetId":  "timeline_001",  // identifier parent widget',
        '  "routeId":   "vertika...",    // dari context patrol',
        "}",
    ])
    s.append(Spacer(1, 4))

    # ── 6. Edge Cases ─────────────────────────────────────────────────────────
    s += sec("6", "Edge Cases")
    edges = [
        ("text Kurang dari 5 Segmen",
         "Jika text pada children hanya memiliki < 5 segmen ◆, akses index yang tidak ada akan menghasilkan undefined/null. "
         "UI harus fallback ke string kosong atau teks default."),
        ("children Kosong",
         "Jika children = [] maka progress bar tidak bisa dihitung (division by zero pada [PERCENT]). "
         "Tangani dengan: if COUNT == 0 → [PERCENT] = 0."),
        ("Duplikat id pada children",
         "id task harus unique. Duplikat id akan menyebabkan konflik saat update status ke backend. "
         "Validasi uniqueness saat load konfigurasi."),
        ("photoPicker Gagal / Permission Ditolak",
         "Jika user menolak izin kamera/galeri, extraFields type=photoPicker tidak bisa diisi. "
         "Pastikan issue tetap bisa disubmit tanpa foto (photo opsional dalam payload)."),
        ("Warna Hex Tidak Valid",
         "progressBar.color = \"#21321\" hanya 5 digit. Parser warna akan gagal atau fallback ke warna default. "
         "Validasi format hex sebelum render."),
        ("[TIME] Token Tidak Terganti",
         "Jika sistem tidak menyediakan timestamp saat task selesai, token [TIME] tetap tampil sebagai literal. "
         "Pastikan replace token dilakukan di layer render sebelum display ke user."),
        ("options Tidak Memiliki id issue",
         "Jika option dengan id=issue dihapus dari array, petugas tidak bisa melaporkan masalah. "
         "Validasi: options wajib memiliki minimal satu entry dengan id=issue untuk kebutuhan compliance patrol."),
        ("Perubahan Urutan options",
         "Urutan options mempengaruhi tampilan action sheet. Jangan ubah urutan tanpa koordinasi UX, "
         "karena petugas sudah familiar dengan posisi button."),
    ]
    for ec_title, ec_desc in edges:
        s.append(Paragraph(f"<b>{ec_title}</b>", BODYB))
        s.append(Paragraph(ec_desc, BODY))
        s.append(Spacer(1, 3))

    # ── 7. Notes ──────────────────────────────────────────────────────────────
    s += sec("7", "Notes")
    s += warn_box(
        "CRITICAL: Field text pada children WAJIB memiliki tepat 5 segmen ◆. "
        "Kurang atau lebih akan menyebabkan rendering error atau pesan status salah tampil."
    )
    notes = [
        "Separator <b>◆</b> (U+25C6, BLACK DIAMOND) digunakan konsisten di semua widget platform ini. "
        "Jangan ganti dengan karakter lain (pipe |, comma, dst.).",
        "Token <b>[ALREADY_CHECK]</b> menghitung task yang sudah ada statusnya (bukan hanya done). "
        "Status notAvailable, skipped, dan issue juga dihitung sebagai 'sudah diproses'.",
        "Field <b>category</b> pada children digunakan untuk fitur filter dan summary report. "
        "Gunakan nilai yang konsisten (kapitalisasi seragam, tidak ada variasi spelling).",
        "Option <b>issue</b> satu-satunya yang memiliki extraFields. Struktur extraFields bisa dikembangkan "
        "dengan type baru (misal: dropdown, signature) tanpa mengubah field lain.",
        "Saat menambah task baru di children, pastikan id mengikuti pola task_NNN "
        "dan tidak ada konflik dengan id yang sudah ada di database.",
        "Field <b>status</b> di root level (nilai: Verified) adalah status keseluruhan template/checklist, "
        "bukan status task individual. Dua konsep status ini berbeda dan tidak saling mempengaruhi.",
        "Widget ini dirancang stateless di sisi konfigurasi — tidak ada state yang disimpan di JSON. "
        "Semua state task (done/skipped/dll) disimpan di backend dan di-load saat widget dibuka.",
    ]
    for n in notes:
        s.append(Paragraph(f"• {n}", BULL))
    s.append(Spacer(1, 12))

    # ── Footer ────────────────────────────────────────────────────────────────
    s.append(rule(C_DARK, 1))
    ft = Table([[
        Paragraph("DEVELOPER INSTRUCTION — timeline.json",
            S("F1", fontSize=8, fontName="Helvetica", textColor=C_GREY)),
        Paragraph("Tanggal: 16 April 2026 | Author: MA | Consteon / Autsorz / Adrifa E-Patrol",
            S("F2", fontSize=8, fontName="Helvetica", textColor=C_GREY, alignment=TA_RIGHT)),
    ]], colWidths=[None, None])
    ft.setStyle(TableStyle([
        ("TOPPADDING",    (0,0),(-1,-1), 2),
        ("BOTTOMPADDING", (0,0),(-1,-1), 2),
    ]))
    s.append(ft)

    doc.build(s)
    print(f"PDF generated: {OUTPUT}")

build()
