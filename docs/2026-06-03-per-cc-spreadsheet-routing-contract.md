# Per-Cost-Center Spreadsheet Routing — Kontrak Frontend / Backend

> Status: draft kontrak (2026-06-03). Dipakai FE & BE untuk fitur "satu menu, spreadsheet beda per cost center".
> Catatan: contoh JSON di sini di-pretty-print biar kebaca. Output produksi tetap minified seperti biasa.

---

## 1. Ringkasan

Sebuah menu (mis. **Dashboard**, **# Admin**, dll) sekarang bisa nampilin spreadsheet **berbeda tergantung cost center**. Tiap cost center punya **file spreadsheet sendiri** (file ID beda, bukan cuma tab/gid beda).

Akses cost center mengikuti RBAC per-user:

- User akses **1 cost center** → langsung lihat spreadsheet itu.
- User akses **>1 cost center** → muncul **dropdown cost center**; pilih cost center → spreadsheet diganti.

---

## 2. Dua mode menu

| Mode | Peran cost center | Aksi saat dipilih | File spreadsheet |
|---|---|---|---|
| **FILTER** (existing, tidak berubah) | dimensi filter | tulis ke cell → re-filter | **tetap** (1 file agregat) |
| **ROUTED** (baru) | pemilih file | swap `src` content → load file | **ganti** per cost center |

> Mode FILTER = perilaku sekarang, **tidak ada perubahan**. Dokumen ini hanya soal **ROUTED**.

**Pembeda FILTER vs ROUTED = field di DROPDOWN, BUKAN key.** Key itu unique ID per widget (jadi id di website) → tidak boleh dibebani semantik mode.

| Field dropdown | Mode | Arti value |
|---|---|---|
| punya `cell` | **FILTER** | value ditulis ke cell itu, file tetap |
| punya `target` (tanpa `cell`) | **ROUTED** | value = URL; swap `src` dari content yang `id`-nya = `target` |

Dimensi filter lain (tanggal / site / karyawan) tetap pakai mekanisme tulis-cell (punya `cell`) — tidak berubah. Satu page bisa campur: dropdown ROUTED (CC) + dropdown FILTER/DATE dalam satu topbar, di-submit oleh satu button.

---

## 3. Yang berubah untuk Frontend (ROUTED saja)

1. **DROPDOWN ROUTED** dikenali dari field `target` (tanpa `cell`). `options` berformat **`label▶value`** (value = URL spreadsheet), bukan label polos.
2. **Routing 100% client-side** — TIDAK ada call ke backend. Saat dipilih + submit, FE swap `src` content yang `id`-nya = `target`, lalu refetch content itu.
3. **Button-triggered, bukan on-select.** Pilih dropdown = cuma rekam pending swap (di store). Swap baru di-apply saat button di-klik — biar bisa di-batch dengan dropdown lain (mis. date) dalam satu submit.
4. Backend `/api/spreadsheet` **tidak berubah** dan tidak terlibat untuk routing. Hanya FILTER (key ber-`cell`) yang POST ke sana.

---

## 4. Format opsi DROPDOWN

```
<label CC>▶<url spreadsheet>◆<label CC>▶<url spreadsheet>◆...
```

- `▶` (U+25B6) = pemisah **label vs value**.
- `◆` (U+25C6) = pemisah **antar-opsi**.
- Sisi kiri `▶` = label yang ditampilkan ke user.
- Sisi kanan `▶` = value yang dikirim saat submit (URL spreadsheet).
- Kedua simbol dijamin **tidak pernah muncul** di nama cost center maupun URL (URL hanya ASCII), jadi aman dipakai sebagai delimiter.

Parsing FE:
```
opsi = options.split("◆")
untuk tiap opsi: [label, value] = opsi.split("▶")
```

---

## 5. Contoh JSON final

### 5a. ROUTED — user akses banyak cost center (Induk + Kantor Pusat + Product Group)

Muncul dropdown; `content[0].src` = URL cost center **pertama** (initial load).

```json
{
  "label": "Dashboard",
  "key": "dashboard",
  "pageData": {
    "title": "Dashboard",
    "topbar": {
      "alignment": "start",
      "children": [
        {
          "type": "DROPDOWN",
          "key": "costCenterSrc",
          "target": "mainContent",
          "placeholder": "Pilih cost center",
          "variant": "outline",
          "options": "Induk▶https://docs.google.com/spreadsheets/d/1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A/edit?gid=815108501◆Kantor Pusat▶https://docs.google.com/spreadsheets/d/1XTomLvk.../edit?gid=<gidKP>◆Product Group▶https://docs.google.com/spreadsheets/d/1yhRupdq.../edit?gid=<gidPG>"
        },
        {
          "type": "BUTTON",
          "text": "Tampilkan",
          "icon": "FilterIcon",
          "variant": "outline",
          "size": "icon",
          "data": "costCenterSrc",
          "onClick": {
            "type": "SUBMIT",
            "url": "https://autsorz.consteon.ai/api/spreadsheet",
            "method": "POST",
            "onSuccess": { "then": "REFRESH_CONTENT" },
            "onError": { "toast": "Gagal memuat data." }
          }
        }
      ]
    },
    "content": [
      {
        "type": "SPREADSHEET",
        "id": "mainContent",
        "src": "https://docs.google.com/spreadsheets/d/1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A/edit?gid=815108501",
        "permission": "C◆U◆D",
        "visibleSheets": "",
        "sheetName": "",
        "rowHeader": 1,
        "rowStartData": 2
      }
    ],
    "bottomBar": { "alignment": "end", "children": [] }
  }
}
```

### 5b. ROUTED — user akses 1 cost center (Induk saja)

Tidak ada dropdown. `src` langsung file cost center itu → identik perilaku lama.

```json
{
  "label": "Dashboard",
  "key": "dashboard",
  "pageData": {
    "title": "Dashboard",
    "topbar": { "alignment": "start", "children": [] },
    "content": [
      {
        "type": "SPREADSHEET",
        "id": "mainContent",
        "src": "https://docs.google.com/spreadsheets/d/1FTaIACxtt0KEfj5ycXH50s_MhpmK9eDgibju5K7Hb4A/edit?gid=815108501",
        "permission": "C◆U◆D",
        "visibleSheets": "",
        "sheetName": "",
        "rowHeader": 1,
        "rowStartData": 2
      }
    ],
    "bottomBar": { "alignment": "end", "children": [] }
  }
}
```

### 5c. FILTER (existing — TIDAK berubah, referensi saja)

Cost center = filter di dalam **satu file**. Dropdown value = **nama cost center**, ditulis ke cell, file tetap.

```json
{
  "type": "DROPDOWN",
  "key": "costCenter",
  "cell": "Patroli!F5",
  "placeholder": "Pilih cost center",
  "options": "Induk◆Kantor Pusat◆Product Group",
  "variant": "outline"
}
```

> **Diskriminator = field, BUKAN key.** FILTER punya `cell` (di atas), ROUTED punya `target` (§5a). Key (`costCenterSrc`/`costCenter`) cuma unique id widget — boleh apa aja, jangan dipakai bedain mode.

---

## 6. Alur interaksi (ROUTED — pure client, button-triggered)

1. User buka page → spreadsheet awal ter-load dari `content[0].src` (FE render langsung, tanpa call).
2. User pilih cost center dari dropdown → FE **rekam** pending swap di store (`routes[key] = { target, src=URL }`). **Belum** swap apa-apa. (Boleh juga pilih dropdown lain mis. date di langkah ini.)
3. User klik **Tampilkan (buttonSubmit)** → FE:
   a. **Apply routes dulu**: untuk tiap key yang punya route, `setSrcOverride(target, src)` → content dengan `id=target` ganti `src` → refetch otomatis.
   b. Kalau ADA key ber-`cell` (mis. date) → recompute `spreadsheetId` dari src yang BARU di-swap, lalu POST cell-write ke backend (lihat §7). Urutan ini penting: swap dulu, baru cell-write nyangkut ke file yang benar.
   c. Kalau TIDAK ada cell-write (pure ROUTED) → src swap di (a) sudah trigger refresh → **selesai, tidak ada POST**.

**Implementasi store:** swap pakai `srcOverrides` map di page store; `content[].src` efektif = `srcOverrides[id] ?? src`. Refetch jalan saat `src` efektif berubah.

### Kenapa button-triggered (bukan on-select)
Kalau swap saat dropdown dipilih, kombinasi dengan dropdown lain (mis. date) jadi kacau: swap ke-trigger sebelum user sempat pilih date. Dengan rekam-dulu / apply-saat-button, satu klik nge-batch semua pilihan.

---

## 7. Perilaku Backend — TIDAK BERUBAH

ROUTED **tidak menyentuh backend sama sekali** (pure client src swap). Endpoint `/api/spreadsheet` cuma dipakai FILTER cell-write, kontraknya tetap:

```
POST https://autsorz.consteon.ai/api/spreadsheet
Content-Type: application/json

{
  "spreadsheetId": "<id file aktif (hasil swap kalau ROUTED+FILTER campur)>",
  "data": [ { "cell": "Sheet!A1", "value": "..." } ]
}
```

- Payload FE **hanya** memuat key yang punya `cell`. Key ROUTED (tanpa `cell`) di-exclude dari `data`.
- DTO `data[].cell` wajib format `Sheet!A1` — karena key ROUTED dibuang, regex tidak pernah kena URL.
- `spreadsheetId` di-resolve FE dari `src` content aktif. Kalau page campur ROUTED+date, src sudah ke-swap dulu (§6.3a) → cell-write nyangkut ke file CC yang benar. Backend tetap "tulis cell ke spreadsheetId yang dikasih", tidak tahu-menahu soal routing.

**Kesimpulan untuk BE:** tidak ada perubahan di `app/api/spreadsheet/route.ts`, `actions/spreadsheet.action.ts`, maupun `dto/spreadsheet.dto.ts`.

---

## 8. Edge cases

| Kasus | Hasil |
|---|---|
| User akses 1 cost center | Tanpa dropdown, `src` static (lihat §5b). |
| User akses >1 cost center | Dropdown muncul, `src` awal = cost center pertama (§5a). |
| User akses 0 cost center untuk page ini | `content` kosong / `src` kosong → FE tampilkan empty state. |
| gid tiap cost center berbeda | URL di tiap opsi sudah lengkap (file + gid per cost center) — FE tidak perlu hitung gid. |

---

## 9. Referensi simbol DSL

| Simbol | Unicode | Fungsi |
|---|---|---|
| `◆` | U+25C6 | join list / array (mis. `C◆U◆D`) |
| `▶` | U+25B6 | pasangan key→value (mis. `label▶url`) |

---

## 10. File FE yang diubah (branch `CON-10-google-sheets`)

3 file, no backend change:

| File | Perubahan |
|---|---|
| `lib/stores/bar/bar-values.store.ts` | Tambah map `routes: Record<string, {target, src}>` + action `setRoute`. Simpan pending swap, `resetValues` ikut clear `routes`. |
| `components/bar/bar-dropdown.tsx` | Drop `usePageStore`/`setSrcOverride`. `handleSelect` cuma `setRoute(key, target, srcUrl)` kalau option punya `srcUrl` && `item.target` — rekam, gak swap. |
| `components/bar/bar-button.tsx` | Payload POST difilter ke key ber-`cell` saja. `handleAction`: apply routes (`setSrcOverride`) dulu → recompute link via `usePageStore.getState().srcOverrides` → POST hanya kalau ada cell-write; pure ROUTED return tanpa POST. |

## 11. Sisa konfirmasi FE/BE

- Empty state untuk user 0 cost center (options kosong → src kosong).
- Behavior kalau user pencet button tanpa pilih dropdown (pakai src awal).
