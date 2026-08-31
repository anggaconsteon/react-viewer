# Dev Spec — `buttonSequential` (Web)

**Status:** READY FOR DEV · dibuat 2026-08-20
**Sheet:** VTL Master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY` → tab `Web Widget` row 20
**Yang harus dibangun:** 1 perilaku renderer baru (`seqBySheet`) + 1 handler action di backend. Tipe widget BUKAN barang baru — tetap `BUTTON` + `onClick.type = "RUN_ACTION"` yang sudah ada.

---

## 1. Ringkas

Tombol yang menjalankan Apps Script *sequential* di sebuah spreadsheet. Browser **tidak pernah** menyentuh service Apps Script — browser hanya POST ke `/api/actions` milik kita, backend yang meneruskan ke service.

Satu spreadsheet bisa punya banyak sequential (satu per sheet/tab). Config menyimpan semuanya sebagai `◆`-list; renderer memilih satu sesuai tab yang sedang dibuka user.

```
browser ──POST /api/actions {action, payload}──> backend ──HTTPS──> Apps Script service
```

---

## 2. Sumber config

Semua config berasal dari spreadsheet, bukan hardcode di kode:

```
Web Widget!J20 (template)  →  Web Screen (page row, isi param)  →  Web Menu!L (pageData static)  →  renderer
```

Template `Web Widget!J20`:

```
{"type":"BUTTON","variant":"[VARIANT]","size":"[SIZE]","text":"[TEXT]","onClick":{"type":"RUN_ACTION","action":"[ACTION]","confirm":[CONFIRM],"seqBySheet":"[SEQ_BY_SHEET]","payload":[PAYLOAD],"onSuccess":{"toast":"[SUCCESS]","then":"[THEN]"},"onError":{"toast":"[ERROR]"}}}
```

Param di baris Web Screen — G–O sengaja identik dengan `buttonRunAction`, yang baru hanya P:

| Col | Token | Contoh |
|---|---|---|
| G | `[TEXT]` | `="Jalankan Sequential"` |
| H | `[ACTION]` | `="RUN_SEQUENTIAL"` |
| I | `[PAYLOAD]` | objek JSON mentah (lihat §3) |
| J | `[SUCCESS]` | `="Sequential dijalankan"` |
| K | `[THEN]` | `="REFRESH_CONTENT"` |
| L | `[ERROR]` | `="Gagal menjalankan sequential"` |
| M | `[VARIANT]` | `="default"` |
| N | `[SIZE]` | `="default"` |
| O | `[CONFIRM]` | `="true"` (lowercase, raw → boolean JSON) |
| P | `[SEQ_BY_SHEET]` | `="TRUE"` (uppercase, string JSON) |

`[CONFIRM]` boolean asli, `[SEQ_BY_SHEET]` string — beda disengaja. Cell Sheets yang berisi boolean di-render `TRUE` uppercase dan itu JSON tidak valid, jadi flag baru dibuat string dan renderer membandingkannya case-insensitive.

---

## 3. `payload` — bentuknya bebas, ditentukan per page

`[PAYLOAD]` adalah **raw-inject**: apa pun yang ditulis di kolom I masuk apa adanya sebagai objek JSON. Widget TIDAK mematok key-nya, karena tiap sequential butuh field berbeda.

Yang renderer pedulikan hanya satu key, dan hanya kalau `seqBySheet` menyala:

| Key | Dibaca oleh | Wajib? |
|---|---|---|
| `seq` | **renderer** (di-split `◆`, dipilih per tab) | wajib kalau `seqBySheet="TRUE"` |
| sisanya (`ssid`, `encoding`, apa pun) | **backend** | sesuai kebutuhan action |

Contoh isi kolom I untuk kasus pertama:

```json
{"ssid":"1LnZsETajZ6Ut4rxgyTIyWpYW9HKC1bsXTn4Lqw50LzY","seq":"SequentialDailyM0◆SequentialDailyM1◆SequentialDailyM2","encoding":"queryParams"}
```

`encoding` = cara **backend** memanggil service (`queryParams` atau `json`). Bukan urusan browser. Sengaja ditaruh di dalam `payload` karena `RUN_ACTION` hanya mengirim `action` + `payload` ke backend — apa pun di luar `payload` tidak akan sampai ke server.

---

## 4. JSON hasil resolve (yang benar-benar diterima renderer)

Tombol:

```json
{
  "type": "BUTTON",
  "variant": "default",
  "size": "default",
  "text": "Jalankan Sequential",
  "onClick": {
    "type": "RUN_ACTION",
    "action": "RUN_SEQUENTIAL",
    "confirm": true,
    "seqBySheet": "TRUE",
    "payload": {
      "ssid": "1LnZsETajZ6Ut4rxgyTIyWpYW9HKC1bsXTn4Lqw50LzY",
      "seq": "SequentialDailyM0◆SequentialDailyM1◆SequentialDailyM2",
      "encoding": "queryParams"
    },
    "onSuccess": { "toast": "Sequential dijalankan", "then": "REFRESH_CONTENT" },
    "onError": { "toast": "Gagal menjalankan sequential" }
  }
}
```

Page utuh — perhatikan urutan `visibleSheets` sejajar dengan urutan `seq`:

```json
{
  "title": "Sequential",
  "description": "",
  "topbar": { "alignment": "", "children": [] },
  "content": [
    {
      "type": "SPREADSHEET",
      "id": "sequentialContent",
      "src": "https://docs.google.com/spreadsheets/d/1LnZsETajZ6Ut4rxgyTIyWpYW9HKC1bsXTn4Lqw50LzY/edit",
      "permission": "C◆U",
      "visibleSheets": "Daily M0◼2☆3◆Daily M1◼2☆3◆Daily M2◼2☆3",
      "sheetName": "Daily M0",
      "rowHeader": 2,
      "rowStartData": 3
    }
  ],
  "bottomBar": {
    "alignment": "",
    "children": [
      {
        "type": "BUTTON",
        "variant": "default",
        "size": "default",
        "text": "Jalankan Sequential",
        "onClick": {
          "type": "RUN_ACTION",
          "action": "RUN_SEQUENTIAL",
          "confirm": true,
          "seqBySheet": "TRUE",
          "payload": {
            "ssid": "1LnZsETajZ6Ut4rxgyTIyWpYW9HKC1bsXTn4Lqw50LzY",
            "seq": "SequentialDailyM0◆SequentialDailyM1◆SequentialDailyM2",
            "encoding": "queryParams"
          },
          "onSuccess": { "toast": "Sequential dijalankan", "then": "REFRESH_CONTENT" },
          "onError": { "toast": "Gagal menjalankan sequential" }
        }
      }
    ]
  }
}
```

Pemetaan index:

| index | `visibleSheets` | `seq` |
|---|---|---|
| 0 | `Daily M0` | `SequentialDailyM0` |
| 1 | `Daily M1` | `SequentialDailyM1` |
| 2 | `Daily M2` | `SequentialDailyM2` |

Matching **by index, bukan by nama**. Ini idiom yang sudah dipakai di tempat lain: `dropdown.cell` = `"Patroli!C4◆Patroli1!C4◆Rutin!C4"` sejajar `visibleSheets` = `"Patroli◼8☆9◆Patroli1◼8☆9◆Rutin◼8☆9"` (lihat page `laporanPekerjaan` yang sudah live). Jangan bikin DSL pairing baru.

---

## 5. Kerja renderer

Satu-satunya hal baru: resolve `payload.seq` sebelum kirim.

```js
function onSequentialClick(btn, page) {
  const cfg = btn.onClick;
  const payload = structuredClone(cfg.payload ?? {});

  if (String(cfg.seqBySheet ?? "").toUpperCase() === "TRUE") {
    const list = String(payload.seq ?? "")
      .split("◆")
      .map(s => s.trim())
      .filter(Boolean);

    if (list.length === 0) return fail(cfg, "seq kosong");

    if (list.length === 1) {
      payload.seq = list[0];                       // satu-satunya, pakai itu
    } else {
      const sheets = parseVisibleSheets(page);     // "Nama◼h☆s" → ["Daily M0", ...]
      const idx = sheets.indexOf(activeSheetName(page));
      if (idx < 0 || idx >= list.length) {
        return fail(cfg, "sheet aktif tidak punya sequential");   // JANGAN kirim
      }
      payload.seq = list[idx];
    }
  }

  if (cfg.confirm && !(await confirmDialog(btn.text))) return;

  const res = await post("/api/actions", { action: cfg.action, payload });
  res.ok ? success(cfg) : fail(cfg, res.error);
}

function parseVisibleSheets(page) {
  const c = page.content.find(x => x.type === "SPREADSHEET");
  return String(c?.visibleSheets ?? "")
    .split("◆")
    .map(s => s.split("◼")[0].trim())
    .filter(Boolean);
}
```

Aturan yang tidak boleh dilanggar:

- `seqBySheet` selain `"TRUE"` (termasuk `"FALSE"`, kosong, absen) → **kirim `payload` apa adanya**, `seq` tetap `◆`-string utuh. Backend yang urus.
- Index tidak ketemu → **batalkan, tampilkan `onError.toast`**. Jangan fallback ke index 0, jangan kirim ◆-string. Menjalankan sequential yang salah di spreadsheet produksi tidak bisa di-undo.
- `payload` selain `seq` **tidak boleh disentuh** renderer.
- `confirm: true` → dialog konfirmasi dulu, sama seperti `buttonRunAction` sekarang.
- `onSuccess.then` mengikuti vocab yang sudah ada (`REFRESH_CONTENT`, `RESET_FORM`, kosong).

---

## 6. Kerja backend

### Request

```
POST /api/actions
{
  "action": "RUN_SEQUENTIAL",
  "payload": {
    "ssid": "1LnZsETajZ6Ut4rxgyTIyWpYW9HKC1bsXTn4Lqw50LzY",
    "seq": "SequentialDailyM1",
    "encoding": "queryParams"
  }
}
```

### Registry per action (server-side, tidak dari client)

```go
type SequentialAction struct {
    DownstreamURL   string   // URL service Apps Script /exec
    AllowedSsids    []string // allowlist spreadsheet
    DefaultEncoding string   // "queryParams" | "json"
    Timeout         time.Duration
}
```

### Urutan validasi

1. Session valid + user punya menu yang memuat action ini (pola authorize existing: menu-possession check di proxy).
2. `action` terdaftar di registry. Tidak ada → `404`.
3. **`payload.ssid` harus ada di `AllowedSsids`.** Tidak ada → `403`, jangan diteruskan. Client mengirim `ssid`, jadi tanpa allowlist ini siapa pun yang bisa buka DevTools dapat menyuruh backend menembak spreadsheet mana pun yang bisa diakses service account. Ini gerbang keamanan utama fitur ini.
4. `payload.seq` tidak kosong. Kosong → `400`.
5. `encoding` di-whitelist ke `queryParams|json`; nilai lain → pakai `DefaultEncoding`.

### Panggilan ke service

| `encoding` | Cara |
|---|---|
| `queryParams` | `GET {DownstreamURL}?ssid={ssid}&seq={seq}` — nilai wajib URL-encoded |
| `json` | `POST {DownstreamURL}` body `{"ssid":"…","seq":"…"}`, `Content-Type: application/json` |

Kalau `seq` yang masuk masih mengandung `◆` (artinya `seqBySheet` mati), split dan jalankan berurutan satu per satu, lalu laporkan status per item. Jangan kirim `◆`-string mentah ke service.

### Response

Ikut kontrak `/api/actions` yang sudah ada: `requestId` idempotency (doc id di `action_logs`, replay → `replayed: true`), log per step, error dipetakan ke `onError.toast`. Tidak perlu format baru.

---

## 7. Test case

| # | Kondisi | Harapan |
|---|---|---|
| 1 | `seqBySheet="TRUE"`, tab aktif `Daily M1` | kirim `seq="SequentialDailyM1"` |
| 2 | `seqBySheet="TRUE"`, tab aktif `Daily M0` | kirim `seq="SequentialDailyM0"` |
| 3 | `seqBySheet="TRUE"`, `seq` isi 1 item, tab mana pun | kirim item itu |
| 4 | `seqBySheet="TRUE"`, `visibleSheets` 3 tab tapi `seq` 2 item, tab aktif index 2 | **tidak ada request**, toast error |
| 5 | `seqBySheet="FALSE"` | kirim `seq` ◆-string utuh, backend jalankan berurutan |
| 6 | `seqBySheet` absen | sama seperti #5 |
| 7 | `payload` punya key ekstra | diteruskan apa adanya, renderer tidak mengubah |
| 8 | `ssid` di luar allowlist | backend `403`, service tidak dipanggil |
| 9 | `confirm=true`, user batal di dialog | tidak ada request |
| 10 | service balas error | `onError.toast` muncul, `then` tidak dijalankan |
| 11 | klik dobel cepat | idempotency `requestId` — 1 eksekusi |

---

## 8. Yang masih terbuka

1. URL service Apps Script + cara autentikasinya (token? deployment "anyone"?) — belum ada, isi ke registry.
2. Page-nya belum dibuat. Butuh dari sisi sheet: menu key, parent, `src` spreadsheet, `visibleSheets`, dan urutan `seq` per sheet.
3. Kalau satu page punya lebih dari satu content `SPREADSHEET`, renderer v1 memakai yang pertama. Kalau ternyata perlu, tambahkan `target: "<content id>"` di `onClick` — jangan tebak-tebakan.
4. Perlu progress per item saat `seqBySheet="FALSE"` menjalankan N sequential? Kalau ya, pakai polling `/api/actions/status` yang sudah ada.
