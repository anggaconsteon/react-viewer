from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

# ── Output path ──────────────────────────────────────────────────────────────
import os, sys
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "location_developer_instruction.pdf")

# ── Colour palette ────────────────────────────────────────────────────────────
C_DARK   = colors.HexColor("#1A1A2E")
C_ACCENT = colors.HexColor("#E94560")
C_BLUE   = colors.HexColor("#0F3460")
C_LIGHT  = colors.HexColor("#F5F5F5")
C_BORDER = colors.HexColor("#CCCCCC")
C_WARN   = colors.HexColor("#FFF3CD")
C_WARN_B = colors.HexColor("#856404")
C_CODE   = colors.HexColor("#F8F9FA")
C_CODE_B = colors.HexColor("#6C757D")

# ── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, **kw)

TITLE_STYLE = S("DocTitle",
    fontSize=20, textColor=colors.white, fontName="Helvetica-Bold",
    spaceAfter=4, leading=26)
SUBTITLE_STYLE = S("DocSubtitle",
    fontSize=11, textColor=colors.HexColor("#CCDDFF"),
    fontName="Helvetica", spaceAfter=2)
META_STYLE = S("DocMeta",
    fontSize=9, textColor=colors.HexColor("#AABBCC"),
    fontName="Helvetica")

SECTION_STYLE = S("SectionHead",
    fontSize=13, textColor=C_DARK, fontName="Helvetica-Bold",
    spaceBefore=14, spaceAfter=6, borderPad=4)
SUBSEC_STYLE = S("SubSec",
    fontSize=11, textColor=C_BLUE, fontName="Helvetica-Bold",
    spaceBefore=8, spaceAfter=4)

BODY = S("Body",
    fontSize=9.5, fontName="Helvetica", leading=14,
    textColor=colors.HexColor("#222222"), spaceAfter=4,
    alignment=TA_JUSTIFY)
BODY_B = S("BodyBold",
    fontSize=9.5, fontName="Helvetica-Bold", leading=14,
    textColor=colors.HexColor("#111111"), spaceAfter=4)
BULLET = S("Bullet",
    fontSize=9.5, fontName="Helvetica", leading=14,
    textColor=colors.HexColor("#222222"), spaceAfter=3,
    leftIndent=16, bulletIndent=0)
BULLET2 = S("Bullet2",
    fontSize=9.5, fontName="Helvetica", leading=14,
    textColor=colors.HexColor("#444444"), spaceAfter=3,
    leftIndent=32, bulletIndent=16)
CODE_STYLE = S("Code",
    fontSize=8.5, fontName="Courier", leading=13,
    textColor=colors.HexColor("#333333"), spaceAfter=2,
    leftIndent=12)
WARN_STYLE = S("Warn",
    fontSize=9, fontName="Helvetica-BoldOblique", leading=13,
    textColor=C_WARN_B, spaceAfter=3)
LABEL_STYLE = S("Label",
    fontSize=8, fontName="Helvetica-Bold",
    textColor=colors.white)

# ── Helpers ───────────────────────────────────────────────────────────────────
def rule(color=C_BORDER, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color, spaceAfter=6, spaceBefore=2)

def section_header(number, title):
    label_data = [[Paragraph(f"{number}", LABEL_STYLE)]]
    label_tbl = Table(label_data, colWidths=[0.55*cm], rowHeights=[0.55*cm])
    label_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_ACCENT),
        ("ALIGN",      (0,0), (-1,-1), "CENTER"),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ("ROUNDEDCORNERS", [3]),
    ]))
    row = [[label_tbl, Paragraph(title, SECTION_STYLE)]]
    tbl = Table(row, colWidths=[0.8*cm, None])
    tbl.setStyle(TableStyle([
        ("VALIGN",   (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (1,0), (1,0), 6),
        ("TOPPADDING",  (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ]))
    return [tbl, rule(C_ACCENT, 1)]

def kv_row(key, value, key_w=4.5*cm):
    k = Paragraph(f"<b>{key}</b>", BODY_B)
    v = Paragraph(value, BODY)
    t = Table([[k, v]], colWidths=[key_w, None])
    t.setStyle(TableStyle([
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("TOPPADDING",    (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",   (0,0), (-1,-1), 4),
    ]))
    return t

def code_block(lines):
    elems = []
    rows = [[Paragraph(l, CODE_STYLE)] for l in lines]
    t = Table(rows, colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_CODE),
        ("BOX",           (0,0), (-1,-1), 0.5, C_CODE_B),
        ("TOPPADDING",    (0,0), (-1,-1), 3),
        ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    elems.append(t)
    return elems

def warn_box(text):
    row = [[Paragraph("&#9888;  " + text, WARN_STYLE)]]
    t = Table(row, colWidths=[None])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_WARN),
        ("BOX",           (0,0), (-1,-1), 1, C_WARN_B),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
    ]))
    return [t, Spacer(1, 6)]

# ── Document build ────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
        title="Developer Instruction – location.json",
        author="MA",
    )

    story = []

    # ── Cover banner ──────────────────────────────────────────────────────────
    banner_content = [
        [
            Paragraph("DEVELOPER INSTRUCTION", TITLE_STYLE),
            Paragraph("location.json — Validasi Lokasi &amp; Deteksi Fake GPS", SUBTITLE_STYLE),
            Spacer(1, 4),
            Paragraph("Tanggal: 16 April 2026 &nbsp;&nbsp;|&nbsp;&nbsp; Author: MA &nbsp;&nbsp;|&nbsp;&nbsp; Tipe: DEVELOPER_INSTRUCTION", META_STYLE),
        ]
    ]
    banner = Table([[banner_content[0]]], colWidths=[None])
    banner.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), C_DARK),
        ("TOPPADDING",    (0,0), (-1,-1), 18),
        ("BOTTOMPADDING", (0,0), (-1,-1), 18),
        ("LEFTPADDING",   (0,0), (-1,-1), 20),
        ("RIGHTPADDING",  (0,0), (-1,-1), 20),
    ]))
    story.append(banner)
    story.append(Spacer(1, 14))

    # ── ATURAN KHUSUS box ─────────────────────────────────────────────────────
    rule_rows = [
        [Paragraph("<b>ATURAN KHUSUS – DEVELOPER_INSTRUCTION</b>", S("AK",
            fontSize=9, fontName="Helvetica-Bold", textColor=C_BLUE))],
        [Paragraph("• Dokumen ini bersifat teknis dan to the point.", BULLET)],
        [Paragraph("• Wajib diawali header: Tanggal &amp; Author.", BULLET)],
        [Paragraph("• Fokus pada: tujuan fitur, flow logic, kebutuhan data, edge case, dan catatan implementasi.", BULLET)],
        [Paragraph("• Tidak menambahkan asumsi di luar konteks sistem.", BULLET)],
        [Paragraph("• Semua poin relevan dengan instruksi yang diberikan.", BULLET)],
    ]
    rule_tbl = Table(rule_rows, colWidths=[None])
    rule_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#EEF4FF")),
        ("BOX",           (0,0), (-1,-1), 1, C_BLUE),
        ("LINEBELOW",     (0,0), (0,0),   1, C_BLUE),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
    ]))
    story.append(rule_tbl)
    story.append(Spacer(1, 14))

    # ── 1. Overview ───────────────────────────────────────────────────────────
    story += section_header("1", "Overview")
    story.append(Paragraph(
        "Konfigurasi <b>location.json</b> mendefinisikan widget absensi berbasis lokasi "
        "untuk platform Autsorz / Adrifa E-Patrol. File ini mengelola tiga mode check-in: "
        "<b>QR, Selfie,</b> dan <b>GPS</b>. Di setiap mode terdapat dua field kritis yang "
        "mengontrol kebijakan validasi lokasi: <b>fakeGpsAllowed</b> dan <b>outPositionAllowed</b>.",
        BODY))
    story.append(Spacer(1, 4))

    # ── 2. Objective ──────────────────────────────────────────────────────────
    story += section_header("2", "Objective")
    objectives = [
        "Mencegah pengguna melakukan check-in menggunakan aplikasi pemalsuan GPS (fake/mock location).",
        "Membatasi check-in hanya jika pengguna berada di dalam radius koordinat yang telah ditentukan (locList).",
        "Menampilkan pesan error yang jelas dan spesifik sesuai jenis pelanggaran lokasi.",
        "Memastikan konsistensi validasi lokasi di semua tiga mode absensi (QR, Selfie, GPS).",
    ]
    for o in objectives:
        story.append(Paragraph(f"• {o}", BULLET))
    story.append(Spacer(1, 4))

    # ── 3. Flow / Logic ───────────────────────────────────────────────────────
    story += section_header("3", "Flow / Logic")

    story.append(Paragraph("3.1  Alur Validasi saat Check-in", SUBSEC_STYLE))
    flow_steps = [
        ("Langkah 1", "Pengguna membuka widget absensi (QR / Selfie / GPS)."),
        ("Langkah 2", "Sistem membaca nilai <b>fakeGpsAllowed</b> dari konfigurasi."),
        ("Langkah 3",
         "Jika <b>fakeGpsAllowed = false</b> → sistem menjalankan deteksi mock/fake GPS pada perangkat. "
         "Jika terdeteksi, proses check-in <b>dihentikan</b> dan ditampilkan pesan:<br/>"
         "<i>\"Lokasi tidak valid, matikan fake GPS\"</i>"),
        ("Langkah 4",
         "Jika fake GPS tidak terdeteksi (atau <b>fakeGpsAllowed = true</b>), sistem membaca koordinat GPS pengguna saat ini."),
        ("Langkah 5", "Sistem membaca nilai <b>outPositionAllowed</b>."),
        ("Langkah 6",
         "Jika <b>outPositionAllowed = false</b> → sistem menghitung jarak antara koordinat pengguna "
         "dan setiap titik di <b>locList</b> dengan toleransi radius (meter, kolom ke-3 array). "
         "Jika tidak ada titik dalam radius, proses check-in <b>dihentikan</b> dan ditampilkan pesan:<br/>"
         "<i>\"Kamu sedang diluar area absensi\"</i>"),
        ("Langkah 7",
         "Jika semua validasi lolos → proses check-in dilanjutkan (QR scan / selfie / GPS record)."),
    ]
    for step, desc in flow_steps:
        row = kv_row(step, desc, key_w=2.2*cm)
        story.append(row)
    story.append(Spacer(1, 6))

    story.append(Paragraph("3.2  Tabel Kondisi – fakeGpsAllowed", SUBSEC_STYLE))
    tbl_fake = Table(
        [
            [Paragraph("<b>fakeGpsAllowed</b>", BODY_B),
             Paragraph("<b>Kondisi</b>", BODY_B),
             Paragraph("<b>Hasil</b>", BODY_B)],
            [Paragraph("false", CODE_STYLE),
             Paragraph("Fake GPS terdeteksi", BODY),
             Paragraph("BLOKIR — tampilkan: <i>Lokasi tidak valid, matikan fake GPS</i>", BODY)],
            [Paragraph("false", CODE_STYLE),
             Paragraph("Tidak ada fake GPS", BODY),
             Paragraph("LANJUT ke validasi posisi", BODY)],
            [Paragraph("true", CODE_STYLE),
             Paragraph("Fake GPS terdeteksi", BODY),
             Paragraph("LANJUT (tidak diblokir)", BODY)],
        ],
        colWidths=[3.5*cm, 5*cm, None],
    )
    tbl_fake.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C_BLUE),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    story.append(tbl_fake)
    story.append(Spacer(1, 8))

    story.append(Paragraph("3.3  Tabel Kondisi – outPositionAllowed", SUBSEC_STYLE))
    tbl_out = Table(
        [
            [Paragraph("<b>outPositionAllowed</b>", BODY_B),
             Paragraph("<b>Kondisi</b>", BODY_B),
             Paragraph("<b>Hasil</b>", BODY_B)],
            [Paragraph("false", CODE_STYLE),
             Paragraph("Di luar semua radius locList", BODY),
             Paragraph("BLOKIR — tampilkan: <i>Kamu sedang diluar area absensi</i>", BODY)],
            [Paragraph("false", CODE_STYLE),
             Paragraph("Di dalam radius salah satu titik locList", BODY),
             Paragraph("LANJUT ke proses check-in", BODY)],
            [Paragraph("true", CODE_STYLE),
             Paragraph("Di luar area", BODY),
             Paragraph("LANJUT (tidak diblokir)", BODY)],
        ],
        colWidths=[3.8*cm, 5.5*cm, None],
    )
    tbl_out.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C_BLUE),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
    ]))
    story.append(tbl_out)
    story.append(Spacer(1, 4))

    # ── 4. Data Requirement ───────────────────────────────────────────────────
    story += section_header("4", "Data Requirement")

    story.append(Paragraph("4.1  Field Kritis", SUBSEC_STYLE))
    fields = [
        ("fakeGpsAllowed",    "boolean", "false", "Izin penggunaan fake/mock GPS. false = deteksi aktif."),
        ("outPositionAllowed","boolean", "false", "Izin check-in di luar area. false = wajib dalam radius."),
        ("locList",           "array",   "[ ]",   "Daftar koordinat valid: [ [lat, lng, radiusMeters], ... ]"),
        ("tolerance",         "integer", "80",    "Toleransi tambahan jarak (meter) di luar radius locList."),
        ("opMode",            "string",  "—",     "Mode absensi: qr-single | selfie | gps-single"),
        ("text",              "string",  "—",     "Teks UI dipisah ◆. Index ke-22: pesan fake GPS. Index ke-23: pesan out-of-area."),
    ]
    hdr = [Paragraph(f"<b>{h}</b>", BODY_B) for h in ["Field", "Tipe", "Default", "Keterangan"]]
    rows = [hdr] + [
        [Paragraph(f[0], CODE_STYLE), Paragraph(f[1], BODY),
         Paragraph(f[2], CODE_STYLE), Paragraph(f[3], BODY)]
        for f in fields
    ]
    ft = Table(rows, colWidths=[3.8*cm, 2*cm, 1.8*cm, None])
    ft.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C_BLUE),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]))
    story.append(ft)
    story.append(Spacer(1, 8))

    story.append(Paragraph("4.2  Struktur locList", SUBSEC_STYLE))
    story.append(Paragraph(
        "Setiap elemen locList adalah array 3 nilai: <b>[latitude, longitude, radius_meter]</b>. "
        "Contoh dari konfigurasi aktif:", BODY))
    story += code_block([
        '"locList": [',
        '  [ -6.31607,   106.64483,  30  ],   // Titik 1 – radius 30m',
        '  [ -6.3162557, 106.644882, 30  ],   // Titik 2 – radius 30m',
        '  [ -6.89609,   107.58163,  30  ],   // Titik 3 – radius 30m',
        '  [ -8.8291404, 115.1586866,100 ],   // Titik 4 – radius 100m',
        '  [ -6.252338,  106.617278, 30  ],   // Titik 5 – radius 30m',
        '  [ -6.9202713, 107.5923769,200 ],   // Titik 6 – radius 200m',
        '  [ -6.1896892, 106.761209, 200 ]    // Titik 7 – radius 200m',
        ']',
    ])
    story.append(Paragraph(
        "Validasi: pengguna dianggap berada dalam area jika jarak ke <i>salah satu</i> "
        "titik &lt;= radius titik tersebut + tolerance.", BODY))
    story.append(Spacer(1, 4))

    story.append(Paragraph("4.3  Struktur text – Pesan Error Lokasi", SUBSEC_STYLE))
    story.append(Paragraph(
        "Field <b>text</b> berisi serangkaian string yang dipisah karakter <b>◆</b>. "
        "Dua pesan terakhir (index 22 &amp; 23) adalah pesan error validasi lokasi:", BODY))
    msg_rows = [
        [Paragraph("<b>Index</b>", BODY_B), Paragraph("<b>Teks</b>", BODY_B),
         Paragraph("<b>Trigger</b>", BODY_B)],
        [Paragraph("22", CODE_STYLE),
         Paragraph("Lokasi tidak valid, matikan fake GPS", BODY),
         Paragraph("fakeGpsAllowed = false &amp; fake GPS terdeteksi", BODY)],
        [Paragraph("23", CODE_STYLE),
         Paragraph("Kamu sedang diluar area absensi", BODY),
         Paragraph("outPositionAllowed = false &amp; posisi di luar locList", BODY)],
    ]
    mt = Table(msg_rows, colWidths=[1.5*cm, 6*cm, None])
    mt.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), C_BLUE),
        ("TEXTCOLOR",     (0,0), (-1,0), colors.white),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [C_LIGHT, colors.white]),
        ("BOX",           (0,0), (-1,-1), 0.5, C_BORDER),
        ("INNERGRID",     (0,0), (-1,-1), 0.3, C_BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    story.append(mt)
    story.append(Spacer(1, 4))

    # ── 5. API / Integration ──────────────────────────────────────────────────
    story += section_header("5", "API / Integration")
    story.append(Paragraph(
        "Konfigurasi location.json di-load oleh aplikasi mobile/web dari Firebase atau "
        "backend server. Tidak ada API call khusus untuk validasi lokasi — validasi "
        "dilakukan sepenuhnya di sisi client (mobile app) sebelum request check-in dikirim.", BODY))
    story.append(Paragraph("Alur integrasi high-level:", BODY_B))
    api_steps = [
        "App fetch konfigurasi location.json dari Firebase/backend.",
        "App baca fakeGpsAllowed dan outPositionAllowed.",
        "App jalankan validasi lokal (mock GPS detection + geofence check).",
        "Jika lolos: kirim request check-in ke endpoint attendance backend.",
        "Jika gagal: tampilkan pesan error dari field text (index 22 atau 23).",
    ]
    for i, s in enumerate(api_steps, 1):
        story.append(Paragraph(f"{i}. {s}", BULLET))
    story.append(Spacer(1, 4))

    # ── 6. Edge Cases ─────────────────────────────────────────────────────────
    story += section_header("6", "Edge Cases")
    edge_cases = [
        ("GPS Permission Denied",
         "Jika pengguna menolak izin GPS, koordinat tidak tersedia. "
         "outPositionAllowed harus diperlakukan sebagai GAGAL (posisi tidak diketahui = di luar area)."),
        ("Akurasi GPS Rendah",
         "GPS accuracy buruk (misal > 100m) dapat menyebabkan false positive out-of-area. "
         "Pertimbangkan threshold minimum accuracy sebelum evaluasi geofence."),
        ("locList Kosong",
         "Jika locList = [] dan outPositionAllowed = false, semua check-in akan diblokir. "
         "Validasi wajib: jangan simpan konfigurasi dengan locList kosong jika outPositionAllowed = false."),
        ("Kedua Flag = true",
         "Jika fakeGpsAllowed = true DAN outPositionAllowed = true, tidak ada pembatasan lokasi. "
         "Pastikan kondisi ini hanya diizinkan untuk environment dev/testing."),
        ("Mock GPS di iOS",
         "Deteksi mock GPS pada iOS lebih terbatas dibanding Android karena sandboxing sistem. "
         "Implementasi perlu fallback atau metode deteksi tambahan untuk platform iOS."),
        ("Pesan Text Index Bergeser",
         "Jika ada penambahan atau penghapusan elemen pada field text, index pesan error lokasi "
         "(22 dan 23) dapat bergeser. Developer WAJIB memastikan index tetap konsisten."),
    ]
    for ec_title, ec_desc in edge_cases:
        story.append(Paragraph(f"<b>{ec_title}</b>", BODY_B))
        story.append(Paragraph(ec_desc, BODY))
        story.append(Spacer(1, 3))

    # ── 7. Notes ──────────────────────────────────────────────────────────────
    story += section_header("7", "Notes")
    story += warn_box(
        "CRITICAL: fakeGpsAllowed dan outPositionAllowed harus SELALU di-set false "
        "di environment production. Nilai true hanya untuk testing internal."
    )
    notes = [
        "Validasi dilakukan berurutan: <b>fake GPS check dulu</b>, baru posisi check. "
        "Jangan membalik urutan ini agar UX error message konsisten.",
        "Ketiga mode (QR, Selfie, GPS) menggunakan logika validasi lokasi yang <b>identik</b>. "
        "Jika ada perubahan logika, terapkan ke ketiga mode sekaligus.",
        "Field <b>tolerance</b> (nilai: 80) adalah buffer tambahan dalam meter di atas radius locList. "
        "Perubahan nilai ini memengaruhi seluruh titik secara global.",
        "Timestamp <b>timeClockOut1</b> dan <b>timeClockOut2</b> digunakan untuk window overtime. "
        "Tidak berkaitan langsung dengan validasi lokasi.",
        "Selalu sertakan pesan baru di akhir field text saat menambah jenis error baru "
        "agar index yang sudah ada tidak bergeser.",
        "Flag <b>opMode</b> menentukan UI yang ditampilkan, bukan logika validasi lokasi. "
        "Kedua field validasi lokasi berlaku di semua opMode.",
    ]
    for n in notes:
        story.append(Paragraph(f"• {n}", BULLET))
    story.append(Spacer(1, 12))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(rule(C_DARK, 1))
    footer_data = [[
        Paragraph("DEVELOPER INSTRUCTION — location.json", S("F1",
            fontSize=8, fontName="Helvetica", textColor=C_CODE_B)),
        Paragraph("Tanggal: 16 April 2026 | Author: MA | Consteon / Autsorz / Adrifa E-Patrol",
            S("F2", fontSize=8, fontName="Helvetica", textColor=C_CODE_B, alignment=2)),
    ]]
    ft = Table(footer_data, colWidths=[None, None])
    ft.setStyle(TableStyle([("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2)]))
    story.append(ft)

    doc.build(story)
    print(f"PDF generated: {OUTPUT}")

build()
