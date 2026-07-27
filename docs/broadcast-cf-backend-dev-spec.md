# BROADCAST CF — Backend Dev Spec (event-push fanout)

Tanggal: 2026-07-22 · Status: PROPOSED (menunggu dev Cloud Function)
Konsumen: event doc yang ditulis app dari `GROUP_PICKER` + `notification` prop (broadcast).
Sisi app: `otonomiq` — `GROUP_PICKER` widget (dibangun 2026-07-21/22), `event-push-v3` notification-prop, `addToEvent`.
Referensi app: `docs/firestore/add_to_event.md`, `.claude/plans/event-push-v3-notification-prop.md`.

> **Grounding:** kontrak INPUT (bentuk event doc) di §2 pasti — diverifikasi dari kode app. Internal CF (§3.2 resolusi penerima, §3.4 registry FCM token) ditandai **[VERIFY]** — samakan dengan CF asli sebelum implement.

---

## 1. Kenapa

`GROUP_PICKER` (page "Kirim Pengumuman") menulis satu **event doc** ke Firestore berisi: **level** broadcast (`blv` = cost-center / site / orang) + **target** di level itu (`bcc` = daftar id) + isi notif (`ntf`/`nm`/`dp`). CF `onEventCreated` harus trigger di doc itu, resolve target jadi daftar penerima, lalu **fanout FCM** ke tiap penerima.

**3 delta yang memaksa spec ini** (keputusan app-side 2026-07-21/22):

1. **`bcc` sekarang dipisah `|` (pipe), BUKAN `◆`.** `◆` (`◆`) ada di `forbiddenCharacter` app → `stringCleanUp` mengubahnya jadi SPASI sebelum tulis Firestore → `◆`-join korup jadi satu token tak-terpisah. App pakai field `joinSep:"|"` (surviving char). **CF WAJIB split `bcc` pada `|`.**
2. **Token `◁N▷` app off-by-one** (konvensi: `◁N▷` → form position `N-1`). Authoring page sudah dikoreksi (`blv◼◁19▷`, `target:◁20▷`, `message:◁4▷`) — CF **tak terpengaruh** (baca field hasil, bukan token), tapi dicatat biar konteks jelas.
3. **`blv` = level** (`cc`/`site`/`vid`) menentukan cara CF menafsirkan `bcc`.

---

## 2. Kontrak INPUT — Event Doc (SSOT, pasti)

### 2.1 Lokasi & trigger
- **Path:** `MobileTable/{tableVid}/tables/{tid}/event/{eid}`
  - `tableVid` = dari field `tablevid` event (contoh `20342033315492`) — routing, tak disimpan di doc.
  - `tid` = segмен pertama `addToEvent` sebelum `//` (contoh `84214220504259`); subcollection `event`.
- **Trigger:** `onEventCreated` (Firestore create) pada path di atas. Branch `event-push` (per `event-push-v3` plan: *belum deployed* — konfirmasi status). **[VERIFY]**
- **Gate:** proses HANYA jika field `ntf` ada. `ntf` absen → CF diam (byte-identical no-op).

### 2.2 Field event doc (yang ditulis app)
| Field | Isi | Sumber | Catatan |
|---|---|---|---|
| `ntf` | `broadcast` \| `single` | notification.mode | **GATE**. `broadcast` = fanout ke `bcc`. |
| `nm` | judul notif (mis. "Pengumuman") | notification.title | kosong → CF fallback ke `cn`. |
| `dp` | isi pesan (mis. "Halo {nama}, …") | notification.message | kosong → CF fallback (default). Bisa mengandung `{nama}` (§3.3). |
| `bcc` | **daftar id, dipisah `|`** | notification.target (◁20▷) | HANYA saat `broadcast`. Interpretasi tergantung `blv` (§3.2). |
| `blv` | `cc` \| `site` \| `vid` | addToEvent `blv◼◁19▷` (key grup aktif) | **level** broadcast. |
| `cv` / `cn` | vid / nama pengirim | addToEvent | `cn` = fallback judul. otorisasi/audit. |
| `sv` / `sn` | site vid / nama | addToEvent | konteks pengirim. |
| `av` / `an` | area vid / nama | addToEvent | konteks pengirim. |
| `ty` | tipe event (mis. `announcement`) | addToEvent | routing/kategori push. |
| `t` / `ts` | timestamp (epoch / terformat) | addToEvent `◀2▶` | waktu event. |
| `r` | kode (mis. `4320`, coerced int) | addToEvent | role/route code. |
| `et` / `p` / `ev` | auto (Time / Route / Data blob) | buildEventDoc | selalu ada. `p` = route halaman. |

> Semua id numerik (`cv`,`bcc` entries,`sv`,…) = **String** (jaga presisi; jangan `parseInt`). `r` = int kalau parse bersih.

### 2.3 Contoh event doc broadcast (resolved, dari JSON asli)
```jsonc
{
  "ntf": "broadcast",
  "nm": "Pengumuman",
  "dp": "<isi TXF posisi 3>",                 // dari ◁4▷; boleh {nama}
  "blv": "vid",                                // tab "Orang" aktif saat kirim
  "bcc": "97445540976699|34079207578683|60181816889090|…",  // id join '|'  (dari ◁20▷)
  "cv": "85924392055168", "cn": "Muhamad Angga",
  "sv": "83674161979544", "sn": "Product Group",
  "av": "83674161979544", "an": "Product Group",
  "ty": "announcement", "r": 4320,
  "t": "…", "ts": "…", "et": 1721600000000, "p": "vertikaTeknoLokacipta"
}
```

---

## 3. Perubahan inti (yang harus CF lakukan)

### 3.1 Parse `bcc` — split pada `|`  ★ (perubahan utama)
```
ids = bcc.split('|').map(trim).filter(nonEmpty)   // dedup
```
- **Toleran (disarankan):** `bcc.split(/[|◆,]/)` — terima `|` (baru/kanonik), `◆` (legacy, praktis tak pernah sampai), `,` (fallback sanitize app untuk literal list). Trim + buang kosong + **dedup**.
- **Kenapa bukan `◆`:** dijelaskan §1.1 — `◆` mati di `stringCleanUp` app. `|` dipilih karena BUKAN anggota `forbiddenCharacter` (yang isinya semua Unicode eksotik: diamond/circle/square/star/circled-number). ASCII `|`/`,`/`;` selamat.
- **Guard:** `bcc` kosong / cuma pemisah → 0 penerima → CF **log WARN "broadcast without recipients"** dan berhenti (bukan error). (Sesuai keputusan app: bcc kosong tetap ditulis biar CF bisa log.)

### 3.2 Resolusi `blv` → daftar penerima (vid)  **[VERIFY field names]**
`bcc` berisi id **pada level `blv`**. CF ekspansi ke vid orang:

| `blv` | `bcc` isi | Resolusi penerima |
|---|---|---|
| `vid` | vid orang | **langsung** — `bcc` sudah daftar penerima. |
| `cc` | id cost-center | ekspansi: semua workforce yang `cc` ∈ `bcc`. |
| `site` | id site | ekspansi: semua workforce yang `site`/`sv` ∈ `bcc`. |

- **Sumber lookup:** tabel workforce `MobileTable/{tableVid}/tables/{tid}/workforce` (sibling `event`). Field workforce yang diketahui app: `vid`, `n` (nama), `ps` (posisi), `sv` (site vid). Field untuk `cc` (cost-center) **[VERIFY]** — nama field cost-center di workforce belum dikonfirmasi; samakan dgn skema asli / grant script.
- **Dedup** hasil ekspansi (satu orang bisa kena >1 cc/site).
- **Catatan grant:** picker sudah **membatasi** (grant script hanya push cc/site/vid yang boleh dikirim admin — handoff §6). Maka CF **percaya** `bcc`, TIDAK re-check izin (§3.6). Ekspansi cc/site tetap perlu resolve ke orang, tapi tanpa filter izin tambahan.
- **[OPEN]** apakah ekspansi `cc`/`site` sudah ada di CF, atau baru. v1 broadcast app = level `vid` (langsung) cukup untuk E2E; `cc`/`site` bisa fase-2 kalau ekspansi belum ada. Konfirmasi.

### 3.3 Personalisasi `{nama}` (dan `{field}` lain)
- `nm`/`dp` bisa mengandung `{nama}` — app **sengaja biarkan literal** (skip `resolveDriverCurlyTokens`). CF substitusi **per penerima** saat kirim.
- Token minimal: `{nama}` → nama penerima. **[VERIFY]** daftar token lain yang didukung (mis. `{site}`, `{posisi}`) — definisikan whitelist; token tak dikenal → biarkan literal atau kosongkan (putuskan).
- Substitusi dilakukan **setelah** resolve penerima, **per** penerima (bukan sekali untuk semua).

### 3.4 Fanout FCM  **[VERIFY registry]**
- Tiap vid penerima → FCM token(s). **[VERIFY]** lokasi registry token (per-vid tokens doc / field `fcmToken` di workforce / koleksi terpisah). Sisi app pakai pola **FCM DATA-only** (lih. patrol-report supervisor push bridge) — samakan.
- **Payload (DATA-only disarankan** biar handler app konsisten**):**
  ```jsonc
  data: {
    "type": "<ty>",            // announcement
    "title": "<nm resolved>",  // fallback cn
    "body":  "<dp personalized>",
    "eventId": "<eid>",
    "route": "<p>",            // deep-link target (opsional)
    "cv": "<cv>", "cn": "<cn>"
  }
  ```
- **Batching:** FCM multicast max 500/panggilan → chunk daftar penerima. Kumpulkan token gagal/kadaluarsa → bersihkan registry. **[VERIFY]** kebijakan cleanup token invalid (`messaging/registration-token-not-registered`).
- **Multi-device:** satu vid bisa punya >1 token → kirim ke semua.

### 3.5 Fallback isi
- `nm` kosong/absen → judul = `cn` (nama pengirim).
- `dp` kosong/absen → body = default (mis. "Ada pengumuman baru") **[VERIFY teks default]**.

### 3.6 Model kepercayaan (otorisasi)
- CF **percaya** `blv`/`bcc` apa adanya — picker + grant script sudah scope ke izin pengirim (handoff §6). **TIDAK** re-check izin per penerima.
- Tetap **validasi bentuk** (blv ∈ {cc,site,vid}; bcc parseable) dan **log** pengirim (`cv`/`cn`) + jumlah target untuk audit.

### 3.7 Idempotency (WAJIB)
- `onEventCreated` bisa fire **>1×** (retry/at-least-once). Tanpa guard → notifikasi dobel.
- **Guard (pilih satu):** (a) transaksi set field `pushProcessed:true` di event doc, proses hanya jika belum; atau (b) sent-ledger `event/{eid}/sent/{vid}`; atau (c) dedup key `eid` di koleksi terpisah dgn TTL. **[DECIDE]**.

### 3.8 Mode `single` (kelengkapan)
- `ntf:"single"` → kirim ke SATU target (path v3 single existing — mis. supervisor). `bcc` absen. Di luar fokus broadcast tapi handler yang sama; jangan regres.

---

## 4. Alur ringkas (broadcast)
```
onEventCreated(doc)
  └─ ntf absent?            → return (no-op)
  └─ ntf == 'single'        → path single (existing)
  └─ ntf == 'broadcast':
       ids   = split bcc on '|' (toleran [◆|,]), trim, dedup
       ids   == []          → log WARN, return
       vids  = resolve(blv, ids)         // vid=langsung; cc/site=ekspansi workforce
       vids  = dedup(vids)
       for each vid:
          name   = lookup(vid).nama
          title  = nm || cn
          body   = personalize(dp, {nama: name, …})
          tokens = registry(vid)         // ≥1
          enqueue FCM DATA-only(tokens, title, body, {type:ty, eventId:eid, route:p})
       send multicast (chunk 500), cleanup invalid tokens
       mark processed (idempotency)
       log { sender: cv, blv, targetCount: ids.length, recipientCount: vids.length, sent, failed }
```

---

## 5. Acceptance
- [ ] `bcc` `|`-split benar (3 id → 3 penerima); toleran `,`; `◆` tak muncul (sudah spasi dari app — kalau ketemu spasi, itu tanda app kirim `◆`, bukan `|` → bug authoring).
- [ ] `blv:"vid"` → kirim langsung ke tiap vid di `bcc`.
- [ ] `blv:"cc"`/`"site"` → ekspansi ke workforce anggota level itu (kalau in-scope).
- [ ] `{nama}` tersubstitusi **per penerima** (2 penerima beda nama → body beda).
- [ ] `nm` kosong → judul = `cn`; `dp` kosong → body default.
- [ ] Idempotent: doc yang sama tak kirim dobel walau trigger 2×.
- [ ] `bcc` kosong → log WARN, tanpa crash, `sent==0`.
- [ ] E2E: kirim dari page → `sent ≥ 1`, notif nyampai di device penerima.
- [ ] Token invalid dibersihkan dari registry.

---

## 6. Open questions / [VERIFY] (samakan dgn CF asli sebelum koding)
1. Status branch `event-push` / `onEventCreated` — sudah ada & deployed, atau greenfield?
2. Field cost-center (`cc`) di tabel workforce — nama field? (site diketahui `sv`.)
3. Registry FCM token — lokasi & bentuk (per-vid doc? field di workforce? koleksi khusus?).
4. Apakah ekspansi `cc`/`site`→orang sudah ada, atau `vid`-only dulu (v1)?
5. Daftar token personalisasi selain `{nama}`.
6. Strategi idempotency yang dipilih (§3.7).
7. Teks default `dp` kosong (§3.5).
8. DATA-only vs FCM `notification` payload (samakan dgn handler app).

---

## 7. Urutan rilis (jangan dibalik)
1. **App** (Flutter) — `GROUP_PICKER` + `selectAll` + `joinSep` + `notification` prop: SUDAH (uncommitted `dev`, perlu commit + build).
2. **Authoring** — op1Screen page "Kirim Pengumuman": tambah `"selectAll":true,"joinSep":"|"` di GROUP_PICKER; koreksi token `blv◼◁19▷` / `target:◁20▷` / `message:◁4▷`; grant script push M7/M8/M9 scoped.
3. **CF** — deploy handler broadcast ini (`bash deploy.sh` — shared code, deploy semua fungsi per event-push-v3 §8).
4. **E2E** — kirim, cek `sent ≥ 1`, notif nyampai.

Dibalik = push mati / broadcast tak sampai.
