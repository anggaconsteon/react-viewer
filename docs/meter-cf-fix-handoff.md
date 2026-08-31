# Handoff perbaikan CF — Baca Meter (dari data live)

**Tanggal:** 2026-08-19
**Buat:** dev Go (CF)
**Status:** bug terkonfirmasi dari data Firestore live, bukan dugaan
**Induk:** `docs/meter-data-cf-dev-spec.md` v3 — dokumen ini cuma **delta**, bukan pengganti

---

## 0. Kabar baiknya dulu

CF-nya **jalan**. Event `ty:"meter-point-surveyed"` masuk → doc di `//meter` kebentuk, dan koersi tipe udah benar:

```
event   sd: "67"    (String)
meter   pv: 67      (Number)   ✅ CF yang koersi — ini sudah benar
        pt: 1787129546205 (Number) ✅
```

Bentuk doc-nya juga sudah CF-shape (`li`/`lk`/`mc`/`mo`/`mst`/`pt`/`pv`/`sv`). Yang kurang cuma 3 field, dan semuanya bikin app-nya mati.

---

## 1. 🔴 `dg` dan `msn` tidak disalin dari event

**Data live:**

| | event | meter |
|---|---|---|
| `dg` | `"5"` ✅ ada | ❌ **tidak ada** |
| `msn` | `"20123466"` ✅ ada | ❌ **tidak ada** |

**Akibat:** `DIGIT_PAD` di halaman `MeterRead` baca `digitsField:"dg"` dari doc `meter`. Tidak ada `dg` → jumlah kotak tidak terdefinisi → **widget tidak dirender sama sekali** (ini perilaku yang spec widget §7.2 perintahkan: "dua-duanya kosong → jangan render"). Jadi halaman pembacaan bulanan kosong melompong, dan tidak ada error apa pun.

**Kenapa ini kelewat:** spec induk §3.2 nulis `dg`/`msn` "ditulis app". Itu **tidak bisa dijalankan** — `addToTable` tidak bisa menentukan doc-id `lk`, jadi app tidak punya cara menulis ke doc yang tepat. Config sudah diubah: **kedua field naik lewat event**, dan CF yang menyalinnya.

**Perbaikan:** pada cabang `ty == "meter-point-surveyed"`, salin dari event ke doc `meter`:
```
dg   → Number   (event kirim String "5" → simpan 5)
msn  → String   (apa adanya)
```
**Jangan pernah menimpanya di cabang `meter-reading-recorded`** — dua field itu lahir sekali di pendataan awal dan tidak berubah tiap bulan.

## 2. 🔴 `due` tidak diset

Doc `meter` live **tidak punya `due`**.

**Akibat:** `MeterRound` mencari `sv◼{site}⭘due◼202608`. Tanpa `due`, titik itu **tidak akan pernah muncul di daftar petugas** — selamanya, bukan cuma bulan ini.

**Kemungkinan penyebabnya sudah hilang:** event lama mengirim `prd:"*"` (bug config di sisi kami — format stream `yyyyMM` ternyata tidak didukung renderer, cuma `Ddd MMM yyyy HH:mm` yang jalan). CF wajar tidak bisa menghitung periode dari `"*"`.

**Sudah diperbaiki di config** — `prd` sekarang literal, contoh nyata dari sheet hari ini: `prd◼202608`.

**Yang perlu dipastikan CF:** `due` diset sesuai §5.4 spec induk:
```
due kosong (doc baru)      →  closed = event.prd
event.prd − due == 1 bulan →  closed = due          // telat sync
selain itu                 →  closed = event.prd    // bolong / normal
due = closed + 1 bulan
```
Dan `due` disimpan **String** `"YYYYMM"` (§3.0) — jangan sampai jadi Number, `search` akan 0 row diam-diam.

**Tambahan guard:** kalau `prd` tidak cocok pola `^\d{6}$`, **jangan tulis `due` sama sekali dan catat log** — jangan menebak. Lebih baik titiknya tidak muncul di daftar (kelihatan) daripada `due` salah (diam).

## 3. 🟠 `ln` tidak diset

Doc `meter` live tidak punya `ln`. `MeterRound` pakai `ln` sebagai judul kartu — tanpa itu kartunya tanpa nama.

Penyebabnya kemungkinan besar sudah hilang juga: `lq` di event lama berisi literal `"{li}"` (token tidak resolve — bug config kami, sudah diperbaiki jadi `lq◼◁1▷`), jadi CF mencari `location` dengan `li="{li}"` dan tidak ketemu.

**Yang perlu dipastikan:** CF melakukan denorm `ln` dari doc `location` saat membuat doc `meter` (§5.1). **Dan kalau `location` tidak ketemu, jangan diam** — tulis log, karena itu berarti `lq` yang masuk tidak valid.

Sebagai jaring pengaman, config sekarang **juga mengirim `ln` di event** (`ln◼◁11▷`, diisi dari `locationNamePosition` field scan). Silakan pakai itu sebagai fallback kalau lookup `location` gagal.

## 4. 🧹 Hapus doc sampah

```
84214220504259/meter/{li}-83674161979544
```
`lk`-nya terbentuk dari token yang tidak resolve. Tidak akan pernah cocok dengan titik mana pun. Hapus.

---

## 5. Yang SUDAH diperbaiki di sisi config (biar tidak dicari-cari)

| Bug | Sebelum | Sesudah |
|---|---|---|
| Token tidak resolve | `lq◼{li}` → tertulis literal `"{li}"` | `lq◼◁1▷` — nilai dari field scan `lqrTextField1` di halaman |
| Format periode | `prd◼◀2\|T7\|yyyyMM▶` → `"*"` | `prd◼202608` — literal dihitung sheet |
| Nama titik | tidak dikirim | `ln◼◁11▷` |

**Penyebab akar `{li}`:** widget `scanner` tidak punya `routeParams`, jadi hasil scan tidak terbawa ke halaman tujuan. Diakali dengan memindahkan scan ke dalam halaman (`lqrTextField1` inline) sehingga nilainya jadi `◁N▷` biasa. Itu cukup untuk `MeterSurvey`, **tapi belum untuk `MeterRead`** — lihat §6.

---

## 6. Yang masih perlu dev Flutter (bukan CF)

**`scanner` perlu `routeParams`.** `MeterRead` butuh identitas titik **saat halaman load** — `detailCard` dan `DIGIT_PAD` membaca doc `meter` lewat `search`, dan `search` tidak bisa memakai `◁N▷` yang baru terisi di tengah halaman.

Sekarang `MeterRead` cuma bisa dimasuki lewat **tap kartu di `MeterRound`** (jalur itu mengirim `routeParams:"lk◼{lk}⭘li◼{li}"` secara eksplisit dan sudah benar). Jalur scan-langsung ke `MeterRead` menunggu ini.

Sekalian dipastikan: hasil decode QR versi `0` (`0l<sha1hex>`) keluar **dengan atau tanpa `0` di depan** — `location.li` menyimpannya **dengan** `0`.

---

## 7. Acceptance

- [ ] Event `meter-point-surveyed` → doc `meter` punya `dg` (**Number**), `msn` (String), `due` (**String** `YYYYMM`), `ln`.
- [ ] `dg`/`msn` **tidak berubah** setelah 3 event `meter-reading-recorded` menyusul.
- [ ] `prd` tidak cocok `^\d{6}$` → `due` **tidak ditulis**, ada log.
- [ ] Doc `location` tidak ketemu dari `lq` → ada log, dan `ln` diambil dari event.
- [ ] `search` `sv◼83674161979544⭘due◼202608` mengembalikan titik yang baru didata.
- [ ] Doc `{li}-83674161979544` sudah tidak ada.

---

**Referensi:** `docs/meter-data-cf-dev-spec.md` v3 (§3.0 tipe · §5 langkah CF · §5.4 aturan `closed`) · `docs/digit-pad-widget-dev-spec.md` §7.2 (kenapa widget tidak render tanpa `dg`) · `docs/meter-data-cf-REVIEW.md` (ronde 1–3).
