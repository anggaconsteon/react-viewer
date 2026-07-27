# Broadcast Page (op1Screen) — Dev Spec v2

Tanggal: 2026-07-21 · Status: PENDING (butuh renderer `GROUP_PICKER` dulu)
Widget: `docs/group-picker-widget-dev-spec.md` · Backend: `../cloud-function/docs/broadcast-op1-handoff.md`
**SUPERSEDES** `docs/broadcast-test-page-dev-spec.md` (v1 se-site) + page `BroadcastTest@951` (obsolete — tanpa level/target).

---

## 1. Beda dari v1 (yang sudah terlanjur dibangun)
| | v1 `BroadcastTest@951` (obsolete) | v2 (spec ini) |
|---|---|---|
| target | se-site (`sv`/`sn` op1 K7/L7) | **3 level** `blv`=cc/site/vid + `bcc` (id ◆-join) |
| pilih siapa | tidak ada (semua se-site) | GROUP_PICKER discope grant |
| event | `ntf/nm/dp` | +`blv`+`bcc`, TANPA sv/sn |

**REVISI 2026-07-21 (user): Flutter SEKARANG inject via prop `notification`** — handoff §2 ("jangan app-inject, taruh di addToEvent") sudah DIBALIK, prop `notification` jalan & jadi cara resmi. Jadi ntf/nm/dp/bcc TIDAK di string addToEvent — dibawa objek `notification`:

| `notification` field | = field event | isi |
|---|---|---|
| `mode` | `ntf` | `"broadcast"` (gate) |
| `target` | `bcc` | id / `◆`-join (boleh token `◁N▷`) |
| `title` | `nm` | judul notif |
| `message` | `dp` | isi pesan (boleh token `◁N▷` + `{nama}` → CF personalisasi) |

Penting: field `notification` **bisa baca token `◁N▷`** (kelihatan dari `message:"◁10▷"` pada JSON live) → `target` bisa di-feed output GROUP_PICKER. `{nama}` di message = literal, CF ganti per penerima.

**`blv` (level cc/site/vid) — MASUK addToEvent** (keputusan user 2026-07-21): itu inputan pilih level → field event `⭘blv◼◁18▷`. Jadi pembagian: addToEvent = base + `blv`; `notification` = target/title/message (payload push). GROUP_PICKER emit dua output ke DUA tempat: keyPosition(◁18▷)→addToEvent blv, valuePosition(◁19▷)→notification.target.

## 2. Komposisi page (reuse generic, +1 widget baru)
| Row | Widget | Isi |
|---|---|---|
| header | topMain | `BroadcastV2` |
| 1 | `text` | judul "Kirim Pengumuman" (medium) |
| 2 | **`groupPicker`** (BARU) | 3 group cc/site/vid statik dari M7/M8/M9, multi, `selector:"segmented"` + `display:"inline"`. `keyPosition:18`→blv, `valuePosition:19`→bcc |
| 3 | `3LineBorderForm` | input pesan, `position:3` → dp (boleh `{nama}`) |
| 4 | `sendButtonGpsWithEvent` (varian +prop `notification`) | savesend + addToEvent(base) + `notification`{mode/target/title/message} — §3 |

## 3. Tombol Kirim — addToEvent (base) + prop `notification`

RBT savesend. `addToEvent` = base + `blv` (helper formula):
```
=""&auzSettings!$J$31&"⭘r◼4320⭘tablevid◼20342033315492⭘ty◼announcement⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘sv◼"&'op1'!K7&"⭘sn◼"&'op1'!L7&"⭘av◼"&'op1'!K7&"⭘an◼"&'op1'!L7&"⭘blv◼◁18▷"
```
Prop `notification` (di child RBT, sebelah `addToEvent`):
```json
"notification":{"mode":"broadcast","target":"◁19▷","title":"Pengumuman","message":"◁3▷"}
```
- `◁18▷` = GROUP_PICKER keyPosition (key group aktif cc/site/vid) → `blv` di addToEvent
- `◁19▷` = GROUP_PICKER valuePosition (id terpilih `◆`-join) → `target`/`bcc` di notification
- `◁3▷` = input pesan → `message`/`dp`

Contoh JSON live (referensi user 2026-07-21, cc tunggal `target` hardcode):
```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Kirim Pengumuman","action":"savesend","route":"vertikaTeknoLokacipta","delay":5,"gpsPosition":2,"flag":"announcement","addToTable":"","addToEvent":"84214220504259//event⭘r◼4320⭘tablevid◼20342033315492⭘ty◼announcement⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶⭘cv◼85924392055168⭘cn◼Muhamad Angga⭘sv◼83674161979544⭘sn◼Product Group⭘av◼83674161979544⭘an◼Product Group","updateEventRow":"","notification":{"mode":"broadcast","target":"32639062303108","title":"Pengumuman","message":"◁10▷"},"chain":{"type":"DO_DIALOG","title":"Pengumuman","children":[{"type":"TXT","data":"Terkirim — pengumuman dikirim ke semua tim se-site."},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokacipta"}]}]}}]}
```
Produksi: `target` hardcode → ganti `◁19▷` (dari GROUP_PICKER), `message` → `◁3▷` input.

## 4. Data picker (cell M7/M8/M9) — **SUPERSEDED 2026-07-23**

> Jalur cell M7/8/9 MATI. Picker sekarang `src:"doc"` baca Firestore `notification_grant` (doc `gk◼broadcast_◁sessionVid▷`, field cc/site/vid) — lihat `group-picker-src-doc-dev-spec.md`. Terpasang live di TestBroadcast@977. Sisa section ini arsip.
Grant script (Apps Script sisi CF) push per proxy, format `nama◆id⭘nama◆id`:
```
M7 cost center : Product Group◆83674161979544⭘Kantor Pusat◆32639062303108
M8 site        : (pattern sama)
M9 orang       : Agenia◆87544551624342⭘…
```
GROUP_PICKER group cc/site/vid resolve `options` dari `='op1'!$M$7 / $M$8 / $M$9`. Isi cell = sudah discope grant → picker otomatis aman (otorisasi = picker yang membatasi, CF percaya).

## 5. Koordinasi backend
1. `target`/`bcc` = id `◆`-join (mis. `83674161979544◆32639062303108`) — konfirmasi CF split `◆`. GROUP_PICKER `pairSep:"◆"` konsisten.
2. CF baca `blv` dari event doc (cc/site/vid) + `target` dari notification → fanout per level. `blv` = field event standar (di addToEvent), bukan di notification.
3. Flutter: prop `notification` resolve token `◁N▷` di `target` (bukan cuma `message`) — jalan buat message, konfirmasi buat target.

## 6. Urutan build
1. Dev Flutter: renderer `GROUP_PICKER` (spec widget).
2. Setelah live: builder op1Screen tulis page ini (skill genericize) — buat template Widget `groupPicker` 3-slot, page 4 row + wiring §3, verifikasi resolved.
3. Grant script push M7/M8/M9.
4. E2E test (handoff §6): kirim → event `blv`/`bcc` benar → CF `sent≥1`; `{nama}` personalisasi; pengirim di-skip; non-grant tak bisa target (picker kosong).

## 7. Cleanup
Hapus/relabel `BroadcastTest@951` (v1) setelah v2 live — jangan dua page broadcast.
