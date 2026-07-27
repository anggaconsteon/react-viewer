# Dev Spec (Flutter) — Tier "Perlu Invoice" di COORDINATION_SIGNAL_LIST (AdminHome)

**Tanggal:** 2026-07-17
**Buat:** dev Flutter (renderer — EXTEND widget existing `COORDINATION_SIGNAL_LIST`, NOL widget baru).
**Konteks:** setelah driver selesai antar, admin butuh notif di AdminHome (kaya notif warehouse) → tombol **Cetak Invoice** → page `DeliveryInvoice`. Ini tier ke-N di widget koordinasi yang udah ada.
**Sibling spec:** `whatsapp-invoice-delivery-dev-spec.md` (fitur invoice+WA lengkap; ini pecahan §4-nya). CF `OnTaskCompleted` bikin nota `src:delivery` **SUDAH BUILT** (`internal/movement/delivery_invoice.go`); page `DeliveryInvoice`/`DeliveryInvoiceList` + `WHATSAPP_SEND` config **SUDAH LIVE** (config-ahead).

---

## 0. Kenapa EXTEND, bukan config-ahead

`COORDINATION_SIGNAL_LIST` LIVE di AdminHome (baca task/vehicle_check/stock_location; tier: belum-assign / dikembalikan / belum-executor / opening-belum-kelar). Nambah tier baru = **param baru bertoken** (`invoiceGate:"tst◼completed⭘iv◼"`). **JANGAN di-config-ahead** — renderer lama bakal DROP SELURUH widget koordinasi (Killer config-ahead-of-renderer), matiin notif warehouse yang udah jalan. Dev tambah param + render barengan.

## 1. Tier baru: "N selesai — perlu invoice"

**Gate:** task `tst◼completed ⭘ iv◼`(kosong) → task delivery yang udah selesai tapi belum di-invoice/kirim. (`iv` = field baru di `task`, dict addendum 2026-07-17: `''`/`sent`.)

**Kenapa `iv` kosong = belum:** WHATSAPP_SEND set `task.iv◼sent` pas admin buka WhatsApp (logField). Jadi begitu invoice terkirim → tier ini otomatis berkurang. Sinyal ini "to-do", bukan riwayat.

**Tombol:** "Invoice" → route `DeliveryInvoice`, bawa `taskVid◼{tnm}` (+ `nno`/`gl` kalau bisa; lihat §3).

**Bentuk kartu = MIRROR kartu warehouse** (screenshot user 2026-07-20): kartu penuh + judul "N belum di-invoice" + tombol full-width. Beda cuma warna aksen: warehouse "Tunjuk di Gudang" = **oranye/warn** (butuh aksi loading); invoice = **HIJAU/ok** (delivery udah kelar, tinggal tagih). Icon tombol `receipt`/`receipt_long`. Badge tier kanan = hijau (bukan warn). Susunan identik: `[icon] JUDUL  <umur>` · subtitle · `[🧾 Invoice]` full-width hijau.

## 2. Param BARU (semua opsional — kosong = tier gak muncul, NOL regresi)

| param | nilai (resolved) | fungsi |
|---|---|---|
| `invoiceGate` | `tst◼completed⭘iv◼⭘tty◼delivery` | filter task: selesai + belum invoice (iv kosong) + hanya delivery (§5 — pickup_return murni gak ada nota) |
| `invoiceRoute` | `vertikaTeknoLokaciptaDeliveryInvoice` | tujuan tombol |
| `invoiceRouteParams` | `taskVid◼{tnm}` | bawa task id (lihat §3 soal nno/gl) |
| `text` +2 segmen | `…◆{n} selesai — perlu invoice◆Cetak Invoice` | label tier + tombol (pola segmen existing) |

Config existing (tier lain) TIDAK berubah. Tier "perlu invoice" muncul cuma kalau `invoiceGate` diisi.

## 3. Resolusi nno/gl buat tombol (keputusan dev)

Page `DeliveryInvoice` baca nota by `nno◼{nno}` + header gudang `lv◼{gl}` (config LIVE). Tapi coordination signal baca **task** (bukan nota). Nota delivery: `nno = INV-{tnm-tanpa-TASK-}`, `gl = task.gl`. Dua opsi:

- **(A, rekomendasi) Route bawa `taskVid◼{tnm}` doang**, lalu page `DeliveryInvoice` cari nota by `ref◼{taskVid}` (nota punya `ref=tnm`). → butuh ubah 3 search di page dari `nno◼{nno}`→`ref◼{taskVid}` (kecil, config gue yang urus). Paling simpel — signal gak perlu derive nno.
- **(B) Signal derive `nno`** dari tnm (`"INV-"+tnm.replace("TASK-","")`) + `gl` dari task.gl, push `nno◼{nno}⭘gl◼{gl}`. Page gak berubah. Tapi signal jadi tau format nno (kopling).

**Rekomendasi A.** Kalau dev pilih A, kabarin — gue repoint search di `DeliveryInvoice` (RECEIPT_DOC/PRN/WHATSAPP_SEND) + `DeliveryInvoiceList` routeParams ke `ref`/`taskVid`. Kalau B, config sekarang udah cocok (page pakai nno).

## 4. Acceptance

1. Task delivery `tst=completed` + `iv` kosong → AdminHome muncul tier "N selesai — perlu invoice" (N = jumlah task match).
2. Tap "Cetak Invoice" → buka `DeliveryInvoice` nota yang bener (via A: ref◼tnm / via B: nno).
3. Admin buka WhatsApp (WHATSAPP_SEND) → `task.iv◼sent` → reload AdminHome, N berkurang 1.
4. `invoiceGate` kosong / task belum ada yang completed-tanpa-invoice → tier gak nongol; tier lain (warehouse dll) TETAP jalan (nol regresi).
5. Task non-delivery (pickup_return murni, gak ada nota) → gak masuk tier (gate `tst◼completed` + tapi CF gak bikin nota buat itu; kalau perlu, tambah gate `tty◼delivery`).

---

**Referensi:** `whatsapp-invoice-delivery-dev-spec.md` (fitur lengkap: WHATSAPP_SEND §3, CF §2), `COORDINATION_SIGNAL_LIST` config LIVE (AdminHome — gate existing unassignedGate/returnedGate/noExecutorGate/blockedGate = pola param yang di-mirror), dict `task.iv` (addendum), CF `internal/movement/delivery_invoice.go` (BUILT — bikin nota src:delivery, `nno=INV-{tnm}`).
