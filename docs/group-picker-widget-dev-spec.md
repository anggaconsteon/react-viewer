# GROUP_PICKER — Universal Picker Widget (Dev Spec)

Tanggal: 2026-07-21 · Status: PROPOSED (menunggu dev Flutter renderer)
Konsumen pertama: page broadcast (`docs/broadcast-page-dev-spec.md`, cell M7/M8/M9 grant).
Referensi backend broadcast: `../cloud-function/docs/broadcast-op1-handoff.md`.

---

## 1. Kenapa

Kebutuhan broadcast: pilih **level** (Cost Center / Site / Orang) lalu pilih **target** di level itu, kirim `blv`+`bcc` ke CF. Constraint kunci (dikonfirmasi user 2026-07-21): **renderer BELUM punya reaktivitas cross-widget** — satu widget tidak bisa mengubah apa yang ditampilkan widget lain secara live. Jadi reaktivitas level→target **wajib internal di 1 widget** (Flutter widget boleh simpan state internal). Sekalian dibuat generik: sumber data bisa **statik (cell-string)** ATAU **database (Firestore)**, mode **single** ATAU **multi**. Widget ini ke depan bisa mengabsorb kebutuhan `tablePicker` (single-group table = picker biasa).

## 2. Konsep

Satu widget self-contained: punya **toggle group internal** (segmented/dropdown). Tiap group = satu sumber data + satu `key`. User pilih group → widget tampil options group itu → pilih (single/multi) → emit **2 nilai**: `key` group aktif + `value` terpilih. Semua reaktivitas di dalam widget; antar-widget tetap statik (aman dgn renderer sekarang).

## 3. Kontrak field

```json
{
  "type": "GROUP_PICKER",
  "mode": "single | multi",
  "selector": "segmented | dropdown | none",
  "display": "inline | sheet",
  "keyPosition": 18,
  "valuePosition": 19,
  "labelPosition": 20,
  "pairSep": "◆",
  "itemSep": "⭘",
  "title": "Kirim ke",
  "hint": "Pilih level lalu centang target",
  "text": "Cari◆Data tidak ditemukan◆Pilih◆Batal◆{n} dipilih",
  "groups": [ { …group… }, … ]
}
```

| field | isi |
|---|---|
| `mode` | `single` (radio, 1 value) \| `multi` (checkbox, value `pairSep`-join) |
| `selector` | `segmented` (tab bar) \| `dropdown` \| `none` (1 group → toggle disembunyikan) |
| `display` | `inline` (toggle+list langsung di page — rekomendasi broadcast) \| `sheet` (field ringkas di page → tap → bottom-sheet, konsisten tablePicker) |
| `keyPosition` | form position tujuan **key group aktif** (untuk broadcast → `blv`) |
| `valuePosition` | form position tujuan **value terpilih** (id); multi = di-join `pairSep` (untuk broadcast → `bcc`) |
| `labelPosition` | opsional, form position tujuan **label terpilih** (nama, buat konfirmasi/display) |
| `pairSep` / `itemSep` | pemisah parse static string: pasangan `nama◆id`, antar-item `⭘`. Juga separator join output multi. |
| `title` / `hint` / `text` | label UI (config-driven, jangan hardcode di Flutter). `text` = ◆-seg: cariHint◆emptyText◆pilihLabel◆batalLabel◆countTemplate |
| `groups[]` | array group; ≥1. |

### 3.1 Group object
| field | isi |
|---|---|
| `key` | string di-emit ke `keyPosition` saat group aktif (mis. `cc`/`site`/`vid`). Boleh kosong (single-group). |
| `label` | teks di toggle/tab |
| `src` | `static` \| `table` |
| **static:** `options` | string `nama◆id⭘nama◆id…` (parse pakai `pairSep`/`itemSep`). Tampil `nama`, kirim `id`. |
| **table:** `vidtable` `table` `search` | sumber Firestore keyed + WHERE DSL (semantik `search` existing) |
| **table:** `labelField` `subField` `valueField` | field label / baris-2 / value (kosong = doc id). |

Renderer: `src:"table"` → query Firestore (mesin sama `tablePicker`), else parse `options`. Group tanpa data / options kosong → tetap muncul di toggle tapi list kosong (pakai emptyText).

## 4. Contoh resolved

### 4.1 Broadcast — 3 group STATIK, multi (kasus utama)
```json
{"type":"GROUP_PICKER","mode":"multi","selector":"segmented","display":"inline","keyPosition":18,"valuePosition":19,"labelPosition":20,"pairSep":"◆","itemSep":"⭘","title":"Kirim ke","hint":"Pilih level lalu centang target","text":"Cari◆Data tidak ditemukan◆Pilih◆Batal◆{n} dipilih","groups":[{"key":"cc","label":"Cost Center","src":"static","options":"Product Group◆83674161979544⭘Kantor Pusat◆32639062303108"},{"key":"site","label":"Site","src":"static","options":"Product Group◆83674161979544⭘Kantor Pusat◆32639062303108"},{"key":"vid","label":"Orang","src":"static","options":"Agenia◆87544551624342⭘Muhamad Angga◆85924392055168⭘Dirgahayu◆80883888051110"}]}
```
Emit ke posisi: `◁18▷`=`cc|site|vid` (key), `◁19▷`=id `◆`-join (value), `◁20▷`=nama `◆`-join (label). Konsumen (broadcast) wire posisi ini ke prop `notification` tombol kirim (`target:"◁19▷"` dst — lihat `broadcast-page-dev-spec.md` §3), BUKAN ke string addToEvent. Widget sendiri wiring-agnostic: cuma nulis ke posisi.

### 4.2 Group `vid` dari DATABASE (mode campur static+table)
```json
{"key":"vid","label":"Orang","src":"table","vidtable":"20342033315492","table":"84214220504259//workforce","search":"sv◼{siteVid}","labelField":"n","subField":"ps","valueField":"vid"}
```

### 4.3 Single-group table, single-select (pengganti tablePicker)
```json
{"type":"GROUP_PICKER","mode":"single","selector":"none","display":"inline","valuePosition":16,"labelPosition":26,"title":"Pilih Model","text":"Cari nama◆Data tidak ditemukan◆Pilih◆Batal◆{n} dipilih","groups":[{"key":"","label":"","src":"table","vidtable":"20342033315492","table":"84214220504259//workforce","search":"ps◼model","labelField":"n","valueField":""}]}
```

## 4b. UI / Layout (acuan visual renderer)

Rekomendasi broadcast: **`selector:"segmented"` + `display:"inline"`**. Multi = checkbox, single = radio. Chip terpilih boleh muncul di atas count.

### Broadcast — multi, segmented, inline (kasus utama)
```
┌─ Kirim ke ─────────────────────────────────┐
│ ┌──────────────┐┌──────┐┌───────┐          │  selector:"segmented"
│ │ Cost Center ▉││ Site ││ Orang │          │  tab aktif = terisi
│ └──────────────┘└──────┘└───────┘          │
│  🔍 Cari…                                  │  filter list (opsional)
│  ┌──────────────────────────────────────┐ │
│  │ ☑  Product Group                     │ │  multi = checkbox
│  │ ☑  Kantor Pusat                      │ │  tampil NAMA, kirim id
│  │ ☐  Cabang Bandung                    │ │
│  └──────────────────────────────────────┘ │
│  2 dipilih                                 │  count {n}
└────────────────────────────────────────────┘
```
Tap tab **Orang** → list ganti isi group `vid` (M9). Centang per-group kejaga; submit ambil id ter-centang di group AKTIF (1 event = 1 blv + bcc list level itu).

### Single, selector:"none", inline (pengganti tablePicker)
```
┌─ Pilih Model ──────────────────────────────┐
│  🔍 Cari nama…                             │
│  ○  Agenia                                 │  single = radio
│  ●  Muhamad Angga                          │
│  ○  Dirgahayu                              │
└────────────────────────────────────────────┘
```
1 group + `none` → toggle disembunyikan → picker polos.

### Group `src:"table"` — baris 2-tier (labelField + subField)
```
│  ☑  Muhamad Angga                          │
│      driver · Product Group                │  subField
```
search-box = live-query Firestore (mesin tablePicker), bukan filter list statik.

### Varian toggle & display
```
selector segmented : [Cost Center▉][Site][Orang]   ≤3 grup, langsung terlihat (broadcast)
selector dropdown  : [ Cost Center          ▼]     hemat ruang kalau grup banyak
display  inline    : toggle+list di page            (broadcast — level+target sekaligus)
display  sheet     : [ Kirim ke: 2 cost center  ▸]  field → tap → bottom-sheet (page rapi, konsisten tablePicker)
```

## 5. Sheet-side (generic+SUBSTITUTE, buat builder op1Screen)

- Widget template J = **3-slot** (cukup buat cc/site/vid). Tiap slot punya placeholder `key/label/src/options` + field table. Slot tak terpakai dikosongkan (renderer skip group kosong). Kalau nanti butuh >3 group → bikin variant slot lebih banyak (jangan ubah template live).
- **static `options` di-resolve dari CELL** lewat helper col: `='op1'!$M$7` (cc), `='op1'!$M$8` (site), `='op1'!$M$9` (vid). Isi cell live (`nama◆id⭘…`) masuk apa adanya — `◆`/`⭘` aman di JSON string, tak ada quote. Grant script (Apps Script sisi CF) yang push M7/M8/M9 per proxy.
- Ikuti skill `op1screen-genericize-widget`: semua field parameterize, helper string sebagai `="value"`, verifikasi resolved col D (JSON valid, no `#N/A`, no `[TOKEN]`).

## 6. Otorisasi (dari handoff §3)

Picker **yang membatasi** — CF percaya `blv`/`bcc`, tidak re-check. Maka isi M7/M8/M9 HARUS sudah discope ke grant pengirim (grant script hanya push cost-center yang dicentang admin + site/vid turunannya). Widget hanya menampilkan apa yang ada di cell → otomatis scoped.

## 7. Deliverable dev
1. **Flutter**: renderer `GROUP_PICKER` — toggle internal, parse static + query table, single/multi, emit key+value(+label) ke posisi. Config-driven labels.
2. Sheet page broadcast (`docs/broadcast-page-dev-spec.md`) — dikerjakan builder op1Screen SETELAH renderer live.

## 8. v1 scope & deferred
- v1: 3 group statik (cc/site/vid dari M7/M8/M9), multi, segmented. Cukup untuk E2E broadcast.
- Deferred: cascading (pilih cc → site terfilter), group dari table dengan `search` yang refer pilihan group lain (butuh reaktivitas internal antar-group — mungkin, tapi bukan v1).

## 9. Acceptance
- [ ] Toggle 3 tab; ganti tab → list options ganti sesuai group.
- [ ] Static: tampil nama, multi-select, `◁value▷` = id `◆`-join, `◁key▷` = key group aktif.
- [ ] `src:"table"` group → query Firestore, sama perilaku tablePicker.
- [ ] `mode:"single"` → 1 value; `selector:"none"` + 1 group → toggle hilang.
- [ ] Broadcast submit → event `blv`+`bcc` benar → CF fanout `sent≥1`.
