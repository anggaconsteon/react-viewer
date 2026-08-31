# Slip Gaji — Backend Mapping (Handoff Dev Web)

**Tanggal:** 2026-08-12
**Sheet sumber:** `Spreadsheet Testing Slip Gaji` (`1FQqc6KIOT1e194_1Dux-6zVR4Ab76bg8l7hxd4GG2mg`) → tab **`Payroll`**
**Tujuan:** backend generate PDF slip per pegawai → upload Firebase Storage → **upsert** metadata ke Firestore collection `slip_gaji`. Metadata ini dipakai app mobile buat nampilin LIST period; PDF-nya di-view dari link.

---

## Alur singkat
```
Per sheet Payroll (1 sheet = 1 period × 1 site/tenant/cost-center):
  1. Baca period (E1,F1) + tipe (G1) + org context (Settings)
  2. Loop tiap baris pegawai:
     a. generate PDF
     b. upload Storage → nama file DETERMINISTIK (OVERWRITE kalau regenerate)
     c. tulis link ke kolom Q sheet
     d. UPSERT 1 doc Firestore slip_gaji (id = sg) — metadata SAJA, tanpa angka gaji
```

---

## 1. Input — struktur sheet `Payroll`

### Row 1 — level-sheet (berlaku ke SEMUA baris)
| Cell | Arti | Contoh |
|------|------|--------|
| `E1` | period **start** | `1-Jul-2026` |
| `F1` | period **end** | `31-Jul-2026` |
| `G1` | **tipe slip** (opsional) | `Makan` → tipe `makan`; **kosong → `gaji`** |

> 1 period bisa punya 2 slip per pegawai (mis. **gaji** + **makan**), dibedakan `G1`.

### Row 2 = header, Row 3+ = data pegawai
| Kolom | Header | Dipakai backend? |
|-------|--------|------------------|
| `B` | VID | ✅ → `vid` |
| `D` | Nama | ✅ → `pn` |
| `F` | Site | ✅ → `sn` (nama site) |
| `I`–`P` | Gaji Pokok, Lembur, Tunjangan, BPJS, Total | ❌ **hanya masuk PDF**, TIDAK ke Firestore |
| `Q` | Link Drive / Slip Link Storage | ✅ backend **tulis** link ke sini → `path` |

### Settings sheet — org context (di-inject backend)
Backend ambil dari sheet `Settings` (bukan dari baris Payroll):
`tv` tenant vid · `tn` tenant name · `sv` site vid · `av` cost center vid · `an` cost center name

---

## 2. Storage — Firebase

- **Bucket:** `otq-01-ase2`
- **Path folder:** `id/{tahun}/vtl/slip-gaji/{tenant-slug}`
- **Nama file (DETERMINISTIK — WAJIB, bukan timestamp):**
  ```
  {vid}_{prds}_{prde}_{ty}.pdf
  contoh: 27148514387654_2026-07-01_2026-07-31_gaji.pdf
          27148514387654_2026-07-01_2026-07-31_makan.pdf
  ```
- **Regenerate = OVERWRITE file yang sama** (nama deterministik → nimpa, bukan bikin baru).

> ⚠️ Jangan pakai timestamp/hash di nama file (beda dari pola foto). Period = nama unik natural → biar bisa upsert & overwrite.

---

## 3. Firestore — collection `slip_gaji`

- **Path:** `MobileTable/{db}/tables/{tid}/slip_gaji/{sg}`
  (`{db}` = database vid, `{tid}` = tenant vid `tv` — dari Settings)
- **Doc ID = `sg`** (deterministik):
  ```
  sg = {vid}_{prds}_{prde}_{ty}
     = 27148514387654_2026-07-01_2026-07-31_gaji
  ```
- **Operasi = UPSERT (set-merge by id `sg`).**
  1 (vid × period × tipe) = **tepat 1 record**. Regenerate → UPDATE doc sama, **JANGAN insert baru**.

### Schema field (METADATA saja — NOL angka gaji)
| Field | Arti | Sumber | Wajib |
|-------|------|--------|-------|
| `sg` | doc key `{vid}_{prds}_{prde}_{ty}` | derived | ✅ |
| `vid` | vid pegawai | Payroll `B` | ✅ |
| `pn` | nama pegawai | Payroll `D` | ✅ |
| `prds` | period start (YYYY-MM-DD) | row1 `E1` | ✅ |
| `prde` | period end (YYYY-MM-DD) | row1 `F1` | ✅ |
| `prd` | period key = `{prds}_{prde}` | derived | ✅ |
| `prdL` | label tampil ("Juli 2026") | derived | ✅ |
| `ty` | tipe: `gaji` / `makan` / … | row1 `G1` (default `gaji`) | ✅ |
| `tyL` | label tipe ("Gaji" / "Uang Makan") | derived | ✅ |
| `tv` | tenant vid | Settings | ✅ |
| `tn` | tenant name | Settings | ✅ |
| `sv` | site vid | Settings | ✅ |
| `sn` | site name | Payroll `F` | ✅ |
| `av` | cost center vid | Settings | ✅ |
| `an` | cost center name | Settings | ✅ |
| `path` | link/URL PDF (= kolom Q) | backend | ✅ |
| `iss` | tgl generate (ISO/epoch) | backend `NOW` | ✅ |
| `st` | status: `active` / `superseded` | backend (default `active`) | ✅ |

> **`tv`/`sv`/`av` wajib** — dipakai app buat scoping list: worker `vid`, HR-site `sv`, HR-cost-center `av`.

---

## 4. Contoh 1 record (row 3 sheet, tipe default gaji)
```json
{
  "sg": "27148514387654_2026-07-01_2026-07-31_gaji",
  "vid": "27148514387654",
  "pn": "Huda Maulana K.",
  "prds": "2026-07-01",
  "prde": "2026-07-31",
  "prd": "2026-07-01_2026-07-31",
  "prdL": "Juli 2026",
  "ty": "gaji",
  "tyL": "Gaji",
  "tv": "<tenant vid dari Settings>",
  "tn": "<tenant name dari Settings>",
  "sv": "<site vid dari Settings>",
  "sn": "Quantumplast Industry",
  "av": "<cost center vid dari Settings>",
  "an": "<cost center name dari Settings>",
  "path": "<link/URL PDF hasil upload>",
  "iss": "2026-08-12",
  "st": "active"
}
```

---

## 5. Aturan wajib (recap)
1. **Upsert** by `sg` — 1 (vid×period×tipe) = 1 record, regenerate = update.
2. **Overwrite** file Storage (nama deterministik, bukan timestamp).
3. **Nol angka gaji** di Firestore — I–P cuma masuk PDF.
4. **Tipe** dari `G1`; kosong → `gaji`.
5. **Org context** (`tv/tn/sv/av/an`) dari `Settings`, sama untuk semua baris 1 sheet.
6. `path` = link yang juga ditulis ke kolom `Q`.

---

## Di luar scope handoff ini (sisi app mobile — dev Flutter)
- Widget `PDF_VIEW` (view PDF dari link + fullscreen).
- Page list (`slip_gaji` grouped) + page detail.
- Local-auth gate (sudah ada).
