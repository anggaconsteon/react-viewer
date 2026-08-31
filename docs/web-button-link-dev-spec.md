# Dev Spec — `buttonLink` / ClickAction `OPEN_LINK` (Web)

**Status:** dibuat 2026-08-20 · **SEBAGIAN TERPASANG 2026-08-28** — `href` literal `https://` sudah jalan (Batch E). Dua bentuk penunjuk (`sheet◼…`, `firestore◼…`) **DIBLOKIR** sampai tiga keputusan di §9 no.2 dijawab; kalau ditulis, tombolnya nonaktif + peringatan di console. Jangan dipakai di config mana pun dulu. Perbedaan lain dari implementasi: `newTab` default = tab yang sama, `confirm` menerima boolean maupun string, dan allowlist host ada di `lib/const.global.ts` (`EMBEDDABLE_HOSTS`: drive/docs.google.com, storage.googleapis.com, firebasestorage.googleapis.com, consteon.io).
**Sheet:** VTL Master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` → tab `Web Widget` row 21
**Yang harus dibangun:** 1 ClickAction baru (`OPEN_LINK`) di renderer + 1 tahap resolve `href` di pipeline pageData. Tipe widget tetap `BUTTON` yang sudah ada.

---

## 1. Ringkas

Tombol yang membuka sebuah link. Linknya tidak selalu dihardcode — bisa datang dari cell spreadsheet atau dari Firestore, supaya admin bisa ganti tujuan tanpa deploy.

Scope v1: **satu link per page** (tombol di `topbar`/`bottomBar`). Link per baris tabel TIDAK termasuk — kalau nanti perlu, itu varian `rowAction`, bukan widget ini.

---

## 2. Sumber config

```
Web Widget!J21 (template)  →  Web Screen (page row, isi param)  →  Web Menu!L (pageData)  →  resolve href  →  renderer
```

Template `Web Widget!J21`:

```
{"type":"BUTTON","variant":"[VARIANT]","size":"[SIZE]","icon":"[ICON]","text":"[TEXT]","onClick":{"type":"OPEN_LINK","href":"[HREF]","newTab":"[NEW_TAB]","confirm":[CONFIRM],"onError":{"toast":"[ERROR]"}}}
```

Param di baris Web Screen — kolom sengaja disejajarkan dengan `buttonRunAction`/`buttonSequential`, J dan K dibiarkan kosong:

| Col | Token | Contoh |
|---|---|---|
| G | `[TEXT]` | `="Buka Dashboard"` |
| H | `[HREF]` | `="sheet◼[SRC:config]◼Config!B2"` |
| I | `[ICON]` | `="ExternalLink"` |
| L | `[ERROR]` | `="Link belum diisi"` |
| M | `[VARIANT]` | `="outline"` |
| N | `[SIZE]` | `="default"` |
| O | `[CONFIRM]` | `="false"` (lowercase, raw → boolean JSON) |
| P | `[NEW_TAB]` | `="TRUE"` (uppercase, string JSON) |

`[CONFIRM]` boolean asli, `[NEW_TAB]` string — beda disengaja, sama seperti `seqBySheet` di `buttonSequential`. Cell Sheets berisi boolean di-render `TRUE` uppercase dan itu JSON tidak valid, jadi flag baru selalu dibuat string dan dibandingkan case-insensitive.

---

## 3. `href` — satu field, empat bentuk

Field `href` menerima nilai literal **atau** pointer. Pola ini sudah dipakai di field `src` content SPREADSHEET (menerima URL literal atau token `[SRC:pageKey]`), jadi bukan mekanik baru.

| Isi `href` | Artinya | Di-resolve oleh |
|---|---|---|
| `https://contoh.com/x` | URL literal | — |
| `[SRC:pageKey]` | ambil URL dari tab `Web URL` (SSOT existing) | pipeline sheet, sudah jalan |
| `sheet◼<spreadsheet>◼<Sheet!Cell>` | baca 1 cell | backend |
| `firestore◼<collection/doc>◼<field>` | baca 1 field dokumen | backend |

Contoh:

```
sheet◼[SRC:config]◼Config!B2
sheet◼https://docs.google.com/spreadsheets/d/1LnZsET…/edit◼Config!B2
firestore◼web_links/dashboard◼url
```

Segmen dipisah `◼`, konsisten dengan DSL lain di workbook (`visibleSheets`, `search`). Menambah sumber baru nanti = menambah satu scheme, bukan menambah widget.

---

## 4. Kapan resolve terjadi

**Saat pageData disajikan ke user, BUKAN saat tombol diklik.**

Pipeline sudah punya tahap resolve per-user (di situ `[CC_LIST]` dan `[SRC:pageKey]` dibereskan). Resolve `href` menempel di tahap yang sama. Yang sampai ke browser sudah berupa URL `https://` final.

Alasan memilih ini daripada endpoint resolve saat klik:

- Endpoint `GET /api/resolve-link?href=…` berarti client boleh menyuruh server membaca cell atau dokumen mana pun yang bisa diakses service account. Itu read-primitive baru yang harus dijaga ownership check-nya. Resolve di serve-time tidak membuka permukaan itu sama sekali.
- Tidak ada endpoint baru, tidak ada cache baru.

Konsekuensi yang diterima: link adalah snapshot saat page dimuat. Admin ganti cell → user perlu reload. Untuk link yang jarang berubah ini cukup. Kalau nanti butuh fresh saat klik, lihat §8.

Kalau resolve gagal (cell kosong, doc tidak ada, scheme ditolak), backend mengirim `"href": ""`. Tombol tetap tampil, dan klik memunculkan `onError.toast`.

---

## 5. JSON hasil resolve (yang benar-benar diterima renderer)

Tombol:

```json
{
  "type": "BUTTON",
  "variant": "outline",
  "size": "default",
  "icon": "ExternalLink",
  "text": "Buka Dashboard",
  "onClick": {
    "type": "OPEN_LINK",
    "href": "https://lookerstudio.google.com/reporting/abc123",
    "newTab": "TRUE",
    "confirm": false,
    "onError": { "toast": "Link belum diisi" }
  }
}
```

Page utuh:

```json
{
  "title": "Dashboard",
  "description": "",
  "topbar": { "alignment": "", "children": [] },
  "content": [
    {
      "type": "SPREADSHEET",
      "id": "dashboardContent",
      "src": "[SRC:dashboard]",
      "permission": "C◆U◆D",
      "visibleSheets": "",
      "sheetName": "",
      "rowHeader": 1,
      "rowStartData": 2
    }
  ],
  "bottomBar": {
    "alignment": "",
    "children": [
      {
        "type": "BUTTON",
        "variant": "outline",
        "size": "default",
        "icon": "ExternalLink",
        "text": "Buka Dashboard",
        "onClick": {
          "type": "OPEN_LINK",
          "href": "https://lookerstudio.google.com/reporting/abc123",
          "newTab": "TRUE",
          "confirm": false,
          "onError": { "toast": "Link belum diisi" }
        }
      }
    ]
  }
}
```

---

## 6. Kerja renderer

```js
function onLinkClick(btn) {
  const cfg = btn.onClick;
  const href = String(cfg.href ?? "").trim();

  if (!href || !href.startsWith("https://")) {
    return toast(cfg.onError?.toast ?? "Link tidak tersedia");
  }

  if (cfg.confirm && !(await confirmDialog(btn.text))) return;

  if (String(cfg.newTab ?? "").toUpperCase() === "TRUE") {
    window.open(href, "_blank", "noopener,noreferrer");
  } else {
    window.location.assign(href);
  }
}
```

Aturan:

- Renderer **tidak melakukan resolve apa pun**. Kalau `href` masih berisi `sheet◼…` / `firestore◼…` / `[SRC:…]`, itu bug pipeline — perlakukan seperti link kosong, jangan coba tebak.
- Cek `https://` tetap dilakukan di renderer walaupun backend juga mengeceknya. Dua lapis, karena yang dibuka adalah navigasi.
- `newTab` selain `"TRUE"` → navigasi di tab yang sama.
- `confirm: true` → dialog dulu, pakai komponen konfirmasi yang sama dengan `buttonRunAction`.

---

## 7. Kerja backend (tahap resolve)

Input: string `href` dari pageData. Output: URL `https://` final atau string kosong.

```
resolveHref(raw, user) -> string

  raw kosong                    -> ""
  raw diawali "https://"        -> raw (setelah validasi §7.1)
  raw diawali "sheet◼"          -> segmen: sheet ◼ <spreadsheet> ◼ <Sheet!Cell>
                                   baca cell, validasi, kembalikan
  raw diawali "firestore◼"      -> segmen: firestore ◼ <collection/doc> ◼ <field>
                                   baca field, validasi, kembalikan
  scheme tidak dikenal          -> "" + log warning
```

### 7.1 Validasi wajib sebelum mengembalikan URL

Isi cell spreadsheet bisa diedit siapa pun yang punya akses tulis ke sheet itu, jadi hasil resolve adalah **input tidak tepercaya yang akan menjadi target navigasi user**.

- Hanya scheme `https:` yang lolos. Tolak `http:`, `javascript:`, `data:`, `vbscript:`, `file:`, dan URL relatif.
- Parse dengan URL parser, bukan `startsWith` saja — `https://evil.com@real.com` dan variasi userinfo harus kena.
- Trim whitespace dan karakter kontrol sebelum parsing.
- Kalau nanti ada daftar domain yang boleh dituju, taruh di config server, bukan di sheet.
- Gagal validasi → kembalikan `""`, jangan lempar 500, dan catat di log supaya admin sheet bisa diberi tahu.

### 7.2 Batas baca

- `sheet◼` hanya boleh membaca **satu cell**, bukan range. Pola dengan `:` ditolak.
- `firestore◼` hanya boleh membaca **satu field** dari **satu dokumen**. Tidak ada query koleksi.
- Kegagalan baca satu tombol tidak boleh menggagalkan penyajian page — tombol itu saja yang jadi `href: ""`.

---

## 8. Test case

| # | Kondisi | Harapan |
|---|---|---|
| 1 | `href` literal `https://…` | tombol buka URL itu |
| 2 | `href` = `sheet◼…◼Config!B2`, cell berisi `https://…` | tombol buka isi cell |
| 3 | cell kosong | `href: ""`, klik → toast error, tidak ada navigasi |
| 4 | cell berisi `javascript:alert(1)` | ditolak backend, `href: ""`, tidak ada navigasi |
| 5 | cell berisi `http://…` (bukan https) | ditolak, `href: ""` |
| 6 | cell berisi `https://evil.com@real.com` | ditolak oleh URL parser |
| 7 | `firestore◼web_links/dashboard◼url` ada isinya | tombol buka URL itu |
| 8 | doc Firestore tidak ada | `href: ""`, page lain tetap normal |
| 9 | `newTab="TRUE"` | tab baru, `noopener,noreferrer` terpasang |
| 10 | `newTab="FALSE"` | navigasi di tab yang sama |
| 11 | `confirm=true`, user batal | tidak ada navigasi |
| 12 | `href` sampai ke renderer masih `sheet◼…` | diperlakukan seperti kosong, toast error |

---

## 9. Yang masih terbuka

1. Page pertama yang pakai ini belum dibuat. Butuh: menu key, parent, teks tombol, dan sumber link-nya (cell mana / doc mana).
2. Perlu link yang selalu fresh saat diklik? Kalau ya, tambahkan `GET /api/resolve-link` — tapi endpoint itu **wajib** memverifikasi bahwa pointer yang diminta memang ada di menu config milik user tersebut, bukan menerima pointer bebas dari client. Jangan dibangun sebelum ada kebutuhan nyata.
3. Nama koleksi Firestore untuk link (`web_links`?) belum ditetapkan.
4. Perlu daftar domain yang boleh dituju? Kalau iya, di mana disimpan.
