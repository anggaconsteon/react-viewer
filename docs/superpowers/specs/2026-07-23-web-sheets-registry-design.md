# Web Sheets Registry — Tab-List SSOT untuk Web Screen

**Tanggal:** 2026-07-23
**Spreadsheet:** VTL Master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`
**Status:** IMPLEMENTED + VERIFIED (pilot `laporanPekerjaan`), tab `Web Sheets` sheetId 1812814631, layout v3 (formula di header, data row polos)

## 1. Masalah

Page multi-tab di `Web Screen` (contoh `laporanPekerjaan`) mengulang daftar tab
spreadsheet laporan (`Patroli`/`Patroli1`/`Rutin`) sebagai literal di 6 cell param
(M22/M24/H25/H26/L29/N29) + J29/K29 (rowHeader/rowStart, duplikat `◼8☆9` di L29).
Tambah/rename tab = edit 6+ tempat manual → risiko mismatch antar widget.

Literal lama (rollback record): M22 `Patroli!C4◆Patroli1!C4◆Rutin!C4` · M24 `…F5…` ·
H25 `…C5…` · H26 `…C6…` · L29 `Patroli◼8☆9◆Patroli1◼8☆9◆Rutin◼8☆9` · N29 `Patroli` ·
J29 `8` · K29 `9`.

## 2. Keputusan desain (urutan evolusi interview)

1. Tab list sama untuk semua CC → SSOT per page. Pilot laporanPekerjaan.
2. Checkbox per page×tab (idiom `Otorisasi Cost Center`).
3. 1 tab registry; master nama tab = header kolom checkbox (2-sheet master vertikal
   ditolak: insert-tengah menggeser header derived, checkbox positional diam → mis-map).
4. Staging kelihatan (data dirakit di Web Sheets), `Web Screen` tinggal VLOOKUP.
5. Field-row model (1 row per field) ditolak — kepanjangan. Final **1 row = 1 page**.
6. **Formula ditaruh di HEADER row 2** (array-literal `={"label";FORMULA}` spill ke
   bawah) → row data murni ketik + ceklis, zero copy formula per page baru.

## 3. Layout final `Web Sheets` (LIVE)

Layout per restrukturisasi user 2026-07-23 (kolom `#`, header `Parameter`/`Output`):

```
Col: A B        C  D  E        F         G             H–M           N–S        T…Y      Z
     # Page Key RH RS Tab List SheetName VisibleSheets Parameter 1-6 Output 1-6 checkbox (end)
Row2 ↑ header + FORMULA spill (E,F,G,N–S)                            Patroli Patroli1 Rutin …
Row3 1 laporanPekerjaan 8 9 (auto)(auto)(auto) C4 F5 C5 C6 · ·  (auto ×6)     ✓ ✓ ✓
```

- **Kolom auto (formula di header row 2):** E TabList, F SheetName, G VisibleSheets,
  N–S Output 1-6. Row data TIDAK pernah diisi formula.
- **Kolom input:** A nomor (bebas), B pageKey (match `Web Screen` col A), C RowHeader,
  D RowStart, H–M Parameter (data polos), T–Y checkbox (W–Y spare), Z = `(end)`.
- **Ref 2 mode** (dideteksi via ada-tidaknya `!`): `C4` = semua tab pakai ref sama;
  deviasi = tulis FULL literal `Patroli!C9◆Patroli1!C9◆Rutin!C40` (passthrough
  apa-adanya; rename tab TIDAK auto-update cell deviasi — rare case, escape hatch).
- Master nama tab = header U2:Z2, harus sama persis nama tab spreadsheet laporan.
- Urutan kolom checkbox = urutan concat; terkiri diceklis = SheetName.
- Row tanpa pageKey di-guard → semua kolom auto kosong (ceklis nyasar tak berefek).

### Formula header (row 2; in_ID, separator `;`) — TANPA MAP/LAMBDA (user pref)

Semua formula standar: IF / SUBSTITUTE / MID / FIND / ARRAYFORMULA.

```
E2: ={"Tab List";ARRAYFORMULA(IF($B$3:$B="";"";MID(
      IF($T$3:$T=TRUE;"◆"&$T$2;"")&IF($U$3:$U=TRUE;"◆"&$U$2;"")&
      IF($V$3:$V=TRUE;"◆"&$V$2;"")&IF($W$3:$W=TRUE;"◆"&$W$2;"")&
      IF($X$3:$X=TRUE;"◆"&$X$2;"")&IF($Y$3:$Y=TRUE;"◆"&$Y$2;"");2;9^9)))}
    (1 term IF per kolom tab T–Y; MID(...;2;...) buang "◆" depan)
F2: ={"Sheet Name";ARRAYFORMULA(IF($E$3:$E="";"";IFERROR(LEFT($E$3:$E;FIND("◆";$E$3:$E&"◆")-1);"")))}
G2: ={"Visible Sheets";ARRAYFORMULA(IF(($E$3:$E="")+($C$3:$C="");"";
      SUBSTITUTE($E$3:$E;"◆";"◼"&$C$3:$C&"☆"&$D$3:$D&"◆")&"◼"&$C$3:$C&"☆"&$D$3:$D))}
N2 (pola Output N; O2..S2 ganti $H→$I..$M):
    ={"Output 1";ARRAYFORMULA(IF(($E$3:$E="")+($H$3:$H="");"";
      IF(ISERROR(FIND("!";$H$3:$H));
        SUBSTITUTE($E$3:$E;"◆";"!"&$H$3:$H&"◆")&"!"&$H$3:$H;
        $H$3:$H)))}
    (ref tanpa "!" → sisipkan ke tiap tab via SUBSTITUTE; ref ber-"!" → passthrough deviasi)
```

## 4. Web Screen laporanPekerjaan (LIVE)

Dua lapis (keputusan 07-24: param cell = referensi polos, formula ngumpet di strip;
VLOOKUP by key DIPERTAHANKAN vs ref langsung `='Web Sheets'!$N$3` — ref posisi nyasar
diam-diam kalau registry di-sort, VLOOKUP paling parah #N/A yang kelihatan):

**Lapis 1 — strip lookup kolom V+, sebaris dengan widget-nya** (di luar area param A–T;
VLOOKUP + MATCH nama header, insert-column-proof):

```
V22 =VLOOKUP($A$21;'Web Sheets'!$B:$S;MATCH("Output 1";'Web Sheets'!$B$2:$S$2;0);FALSE)
V24 "Output 2" · V25 "Output 3" · V26 "Output 4"
V29 "Visible Sheets" · W29 "Sheet Name" · X29 "Row Header" · Y29 "Row Start"
(range mulai kolom B = Page Key; kolom A Web Sheets = nomor bebas, di luar lookup)
```

**Lapis 2 — param cell manggil strip sebaris:**

```
M22 ==$V$22 · M24 ==$V$24 · H25 ==$V$25 · H26 ==$V$26
L29 ==$V$29 · N29 ==$W$29 · J29 ==$X$29 · K29 ==$Y$29
```

Page baru: strip V ikut ke-copy bareng page block (ganti `$A$21` → header row page itu).
DITOLAK: panel mirror OFFSET di atas Web Screen (duplikasi data registry, OFFSET
volatile, area meta cuma 11 row, makin banyak page makin numpuk).

## 5. Cara pakai (owner)

| Kebutuhan | Aksi |
|---|---|
| Tambah/lepas tab di page | ceklis/unceklis 1 kotak |
| Tab baru sama sekali | tulis nama di row 2 slot kosong T–AA (8 slot; live 7 kepake: Patroli/Patroli1/Rutin/Reset/New User/Inactive/Mutasi) + ceklis. Slot habis: expand kolom sheet via UI + tambah 1 term `IF(kolomBaru=TRUE;"◆"&header;"")` di rantai E2 — kejadian 07-24: Mutasi (slot 7, kolom Z) gak muncul karena di luar rantai T–Y; fixed extend ke T–AA |
| Rename tab | ganti 1 header row 2 (cell deviasi full-literal TIDAK ikut — cek manual) |
| Field baru (misal site C9) | ketik `C9` di Ref kosong; widget-nya VLOOKUP MATCH("Out N") |
| Ref berubah | edit 1 cell Ref |
| Satu tab nyeleneh (C40) | Ref = full literal `Patroli!C9◆Patroli1!C9◆Rutin!C40` |
| Page baru | ketik 1 row: pageKey + RH/RS + Ref + ceklis. Kolom auto keisi sendiri |
| Param >7 | insert kolom pasangan sebelum U, header `Ref 8` + `Out 8` (copy formula header Out, ganti kolom ref) |

Sekali jalan manual: blok checkbox page rows (U3:Z…) → Insert → Checkbox.

## 6. Constraint

- RH/RS seragam per page; beda per tab belum disupport.
- Mode ref per-tab: jumlah segmen = jumlah tab diceklis, urutan sama.
- JANGAN rename header B2:S2 (`Output 1` dst) — kunci MATCH lookup Web Screen.
  (Sudah kejadian 1×: rename `Out`→`Output` + insert kolom `#` + hapus Ref7/Out7
  barengan → #REF + MATCH putus; di-rebuild 2026-07-23 mengikuti struktur baru.)
- JANGAN hapus kolom yang direfer formula (mis. kolom Parameter) — Output pasangannya
  jadi #REF (delete kolom ≠ insert; referensi ke kolom terhapus mati permanen).
- JANGAN isi formula/nilai manual di kolom auto (E,F,G,N–S) di row data — nabrak spill.
- Uncheck semua tab → param kosong → page rusak; minimal 1 ceklis.
- Master nama tab manual (formula tak bisa list tab spreadsheet eksternal).

## 7. Verifikasi (2026-07-23)

1. ✅ Kolom auto (header spill) = byte-per-byte identik literal lama.
2. ✅ 8 cell Web Screen resolve identik; D29 resolved JSON utuh.
3. ✅ Live click-test by owner: uncheck Patroli+Patroli1 → seluruh chain (TabList,
   VisibleSheets, Out, param Web Screen) ikut jadi Rutin-only; re-check → pulih.
4. ✅ Row ceklis tanpa pageKey → guard, semua kolom auto kosong.

## 8. Out of scope

- Page lain (attendance, rekapAbsensi, …) — nyusul konvensi §5.
- Bug pre-existing `[CC_LIST]` raw token di J24 laporanPekerjaan — terpisah.
- `Web URL` row17 Page Key `IT Admin` vs token `itAdmin` — terpisah.
