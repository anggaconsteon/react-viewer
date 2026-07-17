# Dev Spec (Flutter) — Walk-in Counter POS: builder walkin + NOTA_CREATE_SUBMIT + PRN keyed

**Tanggal:** 2026-07-07
**Buat:** Flutter dev (renderer). Design: `walkin-counter-pos-design.md` v2. Pasangan CF: `walkin-nota-cf-dev-spec.md`.
**Scope v1:** counter only · SALE only · 1 depo · sampai cetak nota. 3 kerjaan, urut.

---

## 1. `TASK_ITEM_BUILDER` mode `walkin` (EXTEND builder existing P2)

Builder yang sama dgn admin create-task (draft-based), mode baru:

```json
{"type":"TASK_ITEM_BUILDER","vidtable":"20342033315492","mode":"walkin","wizardKey":"walkin_pos","itemTable":"84214220504259//item","itemIdField":"ii","itemNameField":"in","priceSourceField":"hrg","qtyField":"qt","priceField":"hg","searchHint":"Cari produk…","text":"Item Penjualan◆+ Produk◆Qty◆Harga◆Subtotal◆Hapus"}
```

- Pilih item dari master `item` → line `{ii, in, qt, hg, sub}` masuk **draft wizard `walkin_pos`**.
- `hg` default = `item.hrg` (field BARU di master, Number, sudah di-seed) → **kasir boleh override per line** (input harga manual). `hrg` kosong/0 → hg wajib diisi manual.
- `sub = qt × hg` (renderer hitung). Multi-line, hapus line, qty ≥ 1.
- SALE only — gak ada pilihan tx (jangan render tombol Jual/Beli/Refill; mode walkin = semua line sale).

## 2. `NOTA_CREATE_SUBMIT` (BARU — clone pola `TASK_CREATE_SUBMIT` yang udah jalan)

```json
{"type":"NOTA_CREATE_SUBMIT","vidtable":"20342033315492","table":"84214220504259//nota","wizardKey":"walkin_pos","gl":"F621558e33b612","src":"walkin","paymentPosition":1,"buyerPosition":12,"action":"savesend","flag":"admin-walkin-sale","delay":5,"gpsPosition":2,"run":"17:generate_number","numberPos":"17","route":"vertikaTeknoLokaciptaWalkInNota","text":"Buat Nota◆TOTAL◆Lengkapi item dulu◆Gagal membuat nota","chain":{"type":"DO_DIALOG","title":"Nota Dibuat","children":[{"type":"TXT","data":"Tersimpan · LUNAS"},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaWalkInNota"}]}]}}
```

Perilaku (division of labor SAMA persis TASK_CREATE_SUBMIT — savesend = pipeline doang, write = native widget):

1. Render **TOTAL Rp** (Σ `sub` draft) di atas tombol.
2. Tap → `run 17:generate_number` → NUMBER widget (position 17, template `NOTA-{{YYYY}}-{{COUNTER(vtl.nota,6)}}`) keisi → `nno`.
3. **Write NATIVE 1 doc `nota` (auto-id):** `nno` + `src` (param) + `ref:""` + `kl:""` + `by` (◁12▷, kosong = "") + `bym` (◁1▷ Tunai→"tunai"/Transfer→"transfer") + `st:"LUNAS"` + `gl` (param) + `tot` (Number) + `li[]` (draft, NATIVE array `{ii,in,qt,hg,sub}`) + `cv/cn` (session) + `t` (epoch **Number**) + `ts` (formatted) + `search:"nno★{nno}"`.
4. **NO movement dari renderer** — CF `OnNotaCreated` yang emit (jangan dobel).
5. Savesend pipeline: flag/GPS/chain/addToEvent dari param (kalau param addToEvent diisi belakangan, jalanin — sekarang kosong).
6. Route ke W3 + **inject token `{nno}`** buat page tujuan (pola `{activeTaskVid}`).
7. Reset draft `walkin_pos` setelah sukses.

Kanon tipe: `tot`/`qt`/`hg`/`sub`/`t` **Number**; sisanya String. `li[]` field PRESENT semua (jangan omit).

## 3. `PRN` variant `keyed` (EXTEND — data-binding baru, mesin template UTUH)

PRN existing baca tabel POSISIONAL proxy (`{{master1_do[1][3]}}`). Tambah variant `keyed` — **2 mode binding**:

```json
{"type":"PRN","variant":"keyed","vidtable":"20342033315492","table":"84214220504259//nota","search":"nno◼{nno}","paperSize":"80mm","icon":"print","buttonColor":"blue","textColor":"white","width":"full","text":"Cetak Nota◆<status texts sama kayak PRN lama>","template":"<TEXT align='center' bold='true'>DEPO GALON BINTARO</TEXT>;<TEXT align='center'>Jl. Raya Serpong No.10, Bintaro</TEXT>;<TEXT bold='true' align='center'>=== NOTA PENJUALAN ===</TEXT>;<FEED/>;No: {{nno}};Tanggal: {{ts}};Pembeli: {{by}};Bayar: {{bym}};<HR/>;<LOOP source='li'>;{{item.in}};<ROW><COL width=8>{{item.qt}}x {{item.hg}}</COL><COL width=4 align='right'>{{item.sub}}</COL></ROW>;</LOOP>;<HR/>;<ROW><COL width=8 bold='true'>TOTAL</COL><COL width=4 align='right' bold='true'>{{tot}}</COL></ROW>;<TEXT align='center' bold='true'>{{st}}</TEXT>;<FEED/>;<TEXT align='center'>Terima kasih</TEXT>;<QRCODE data='{{nno}}' align='center'/>;<CUT/>;"}

**Item = 2 baris (gaya struk Alfamart):** baris-1 = `{{item.in}}` (nama, kiri) · baris-2 = `<ROW>` `{{item.qt}}x {{item.hg}}` (kiri) + `{{item.sub}}` (kanan). `;` = pemisah baris di template engine. `<LOOP source='li'>` ulang 2 baris ini per elemen `li[]`.

### 3b. Format rupiah (BUTUH renderer — sekarang print angka mentah)
Live-test: PRN print angka RAW (`20000`, `45000`) tanpa pemisah ribuan. Minta:
- **Angka moneter di-format id-locale (pemisah ribuan `.`)**: `20000`→`20.000`, `71000`→`71.000`. Berlaku di `{{item.hg}}`, `{{item.sub}}`, `{{tot}}`.
- **"Rp" HANYA di total** (per-item tanpa Rp — cuma grouping). Template sudah kasih literal `Rp{{tot}}` → hasil sekarang `Rp71000`, target `Rp71.000`.
- **Cara implement (pilih 1):** (a) template filter `{{field|money}}` yang engine format grouping (paling generic, reusable), atau (b) engine auto-format field numeric di keyed-mode. Kalau (a): JANGAN aktifin sebelum engine support — sekarang template sengaja pakai `{{tot}}` polos (bukan `{{tot|money}}`) biar print gak break; begitu filter ke-build, sheet-template diganti ke `|money`.
- Konsisten dengan RECEIPT_DOC on-screen (`money:"id"` = grouping sama).

Acceptance format: `Amidis Galon 19 Liter` / `1x 21.000    21.000` · `TOTAL    Rp71.000`.
```

1. **Mode doc-skalar:** `table`+`search` → 1 doc → `{{namaField}}` = nilai field doc (`{{nno}}`, `{{by}}`, `{{tot}}`, `{{st}}`, `{{ts}}`).
2. **Mode array-dalam-doc:** `<LOOP source='li'>` → iterate array field `li` → `{{item.namaField}}` per elemen (`{{item.in}}`, `{{item.qt}}`, `{{item.sub}}`).
- Tag template lama (TEXT/FEED/HR/ROW/COL/GROUP_BY/QRCODE/CUT + status flow bluetooth) **JANGAN diubah** — cuma resolver data.
- Angka rupiah: format ribuan boleh di renderer (`45000` → `45.000`), opsional v1.
- Variant lama (positional) tetep jalan — GasPink DO jangan regress.

## 4. Acceptance

1. W1: pilih 2 item (1 pake harga default `hrg`, 1 di-override) → TOTAL bener → Buat Nota → doc `nota` kebentuk: `nno` `NOTA-2026-000001` (urut di submit ke-2), `li[]` 2 line lengkap `{ii,in,qt,hg,sub}`, `tot` Number, `bym`/`by` sesuai form, `st:LUNAS`.
2. Movement `sale-{nno}-{ii}` muncul per line (CF) + `asset_cache` depo −qt. (Renderer GAK nulis movement.)
3. W3: ringkas nampil `{nno}` + PRN connect printer thermal 80mm → nota kecetak: header, lines rapi, TOTAL, LUNAS, QR kebaca.
4. Pembeli kosong → `by:""`, nota cetak "Umum" (fallback text) — gak error.
5. Draft reset — transaksi baru mulai bersih.
6. Cetak ULANG: buka W3 lagi (nno sama) → PRN baca doc yang sama → hasil identik.

---

**Referensi:** `walkin-counter-pos-design.md` v2 (schema §2) · TASK_CREATE_SUBMIT live (pola native+savesend+numberPos — op1Screen CreateTaskSummary) · PRN GasPink live (template engine, contoh di design) · `walkin-nota-cf-dev-spec.md` (movement). Page W1/W3 op1Screen di-set dari sheet BARENG rilis build (config-ahead-of-renderer rule) — kabarin build ready.
