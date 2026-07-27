# Dev Spec — Invoice Pengiriman + Kirim WhatsApp (delivery → invoice → WA)

**Tanggal:** 2026-07-17
**Buat:** dev Go (CF — branch baru di `OnTaskCompleted`) + dev Flutter (1 widget BARU `WHATSAPP_SEND` + 1 tier baru di `COORDINATION_SIGNAL_LIST`; sisanya reuse RECEIPT_DOC/PRN/LIST_CARD).
**Fitur:** driver selesai antar → admin dapet notif "perlu invoice" → cetak invoice (kembar walk-in) → kirim ke customer via WhatsApp.
**Keputusan user (2026-07-17):** wa.me deep link teks (nol backend/biaya); invoice ADA harga (`item.hrg × qty`) lewat nota `src:delivery`; editor WA = **bottom-sheet on-demand**; setelah buka WA set marker → sinyal ilang.

---

## 0. Flow

```
Driver submit stop terakhir → task.tst=completed (+tce)
   └─ CF OnTaskCompleted (branch BARU): selain emit movement (udah ada),
      BIKIN nota src:delivery (li[] priced dari item.hrg × qty terkirim)
         ↓
AdminHome · COORDINATION_SIGNAL_LIST → tier BARU "N selesai — perlu invoice"
      gate: tst◼completed ⭘ iv◼(kosong)   → tombol "Cetak Invoice"
         ↓ routeParams nno◼{nno}⭘ref◼{tnm}
DeliveryInvoice page (kembar WalkInNota): RECEIPT_DOC + PRN + [Kirim WhatsApp]
         ↓ tap Kirim WhatsApp → BOTTOM SHEET (nomor+pesan editable) → Buka WhatsApp
      wa.me/<nomor>?text=<pesan> → WA kebuka → admin tekan Send
         ↓ (saat Buka WhatsApp ditekan) set task.iv◼sent
      sinyal "perlu invoice" ilang + badge "✅ Terkirim WA"
```

Entry ke-2 (buat test tanpa nunggu coordination tier): launcher AdminHome "Invoice Kirim" → **DeliveryInvoiceList** (LIST_CARD nota src:delivery) → tap → DeliveryInvoice. Dua-duanya route ke page invoice yang sama.

## 1. Schema (dict book — SUDAH ditambah 2026-07-17)

Cuma **2 field baru** (sisanya reuse; nota dict udah pre-anticipate delivery):
- **`task.iv`** (`''`/`sent`) — marker invoiced/terkirim. Diset pas admin buka WA. Gate tier = `tst◼completed⭘iv◼`(kosong). BUKAN pas selesai.
- **`nota.hpic`** — no HP customer, denorm dari `stock_location.hpic` saat CF bikin nota delivery. Dibaca WHATSAPP_SEND buat nomor wa.me. Walk-in kosong.

Delivery nota **reuse field existing**: `by`=customer name (task.kn), `kl`=FK customer (task.kl), `ref`=task tnm, `src`=`delivery`, `li[]`{ii,in,qt,hg,sub} (`hg`=item.hrg, `sub`=hg×qty), `tot`=Σsub, `gl`,`cv`,`cn`,`t`,`ts`.

## 2. CF — `OnTaskCompleted` branch baru: bikin nota delivery

Pas task jadi `completed`, SELAIN emit movement (udah ada), **create 1 nota `src:delivery`** (idempotent by deterministic id, mis. `nota` doc-id `dnota-{tnm}` atau nno deterministik):

- `nno` = `INV-{YYYY}-{counter}` (counter namespace `vtl.nota`, atau sub-namespace `vtl.invoice` — dev pilih; walk-in pakai NOTA-, delivery pakai **INV-** biar beda).
- `src`=`delivery`, `ref`=`tnm`, `kl`=task.kl, `by`=task.kn, `gl`=task.gl, `cv`=task.cv, `cn`=task.cn.
- **`hpic`** = lookup `stock_location[task.kl].hpic` (denorm; "" kalau gak ada).
- `li[]` = per baris task.it[] yang **terjual/terkirim** (tx `deliver` ATAU `sale`; skip `purchase`/`refill` — keputusan user): `{ii, in, qt: (ad|as), hg: item.hrg, sub: qt×hg}`. qty = aktual (`ad` buat deliver, `as` buat sale). Skip qty≤0.
- `tot` = Σ sub. `t`/`ts` = waktu completed. `st` = `LUNAS` (atau kosong — delivery bisa piutang; v1 ikut walk-in `LUNAS`, dev boleh reserve).
- **Idempotent**: deterministic id → re-fire OnTaskCompleted gak bikin nota dobel (AlreadyExists = skip). Task yang gak punya line deliver/sale (mis. pure pickup_return) → SKIP bikin nota (gak ada yg di-invoice).

`item.hrg` di-lookup sekali per invocation (koleksi item kecil, pola `itemNames`). Kalau item gak punya hrg → hg=0 (invoice tetep kebentuk, admin bisa koreksi manual nanti — atau flag).

**NOL perubahan movement / asset_cache** — cuma nambah doc nota. Mirror pola `walkin_nota_trigger` / `supplier_nota_trigger` buat struktur nota.

## 3. Widget BARU `WHATSAPP_SEND` (Flutter renderer)

Generic — reusable semua case (invoice, reminder outstanding, konfirmasi order): beda cukup ganti `messageTemplate`+`messageSearch`.

### 3.1 Config

```json
{"type":"WHATSAPP_SEND","vidtable":"20342033315492","phoneField":"[PHONEFIELD]","phoneFallback":"[PHONEFALLBACK]","allowContactPick":"[ALLOWCONTACTPICK]","countryCode":"[COUNTRYCODE]","messageTable":"[MESSAGETABLE]","messageSearch":"[MESSAGESEARCH]","messageTemplate":"[MESSAGETEMPLATE]","logTable":"[LOGTABLE]","logSearch":"[LOGSEARCH]","logField":"[LOGFIELD]","logValue":"[LOGVALUE]","text":"[TEXT]"}
```

| param | fungsi |
|---|---|
| `phoneField` | field di doc (yg di-load `messageSearch`) buat nomor — mis `hpic` |
| `phoneFallback` | token fallback kalau field kosong (mis `{custPhone}`); kosong = skip |
| `allowContactPick` | `TRUE` → tampil tombol pilih kontak HP (reuse `contactPicker`) |
| `countryCode` | normalisasi lokal→intl: `08xx`→`62 8xx`, strip non-digit, buang `+` |
| `messageTable`/`messageSearch` | doc sumber resolve `{{field}}`/`<LOOP>` (mis nota by nno) |
| `messageTemplate` | template pesan (§3.3) |
| `logTable`/`logSearch`/`logField`/`logValue` | pas "Buka WhatsApp" ditekan → updateEventRow set marker (mis task iv=sent). Kosong = skip log |
| `text` | ◆-seg: 0 label tombol utama · 1 label nomor · 2 tombol kontak · 3 label pesan · 4 tombol buka WA · 5 error nomor invalid · 6 badge terkirim |

### 3.2 Perilaku

1. Render **tombol** (label = text[0], mis "Kirim WhatsApp"). Tap → **DO_BOTTOM_SHEET** internal.
2. Sheet: field **Nomor** (prefill dari `phoneField` doc; kalau kosong → `phoneFallback` token; editable) + tombol **pilih kontak** (kalau allowContactPick) + field **Pesan** (prefill hasil resolve `messageTemplate`, editable multiline) + tombol **Buka WhatsApp**.
3. Normalisasi nomor pakai `countryCode` (WAJIB — `08123`→`628123`; kosong/invalid → error text[5], tombol disabled).
4. **Buka WhatsApp** → `https://wa.me/<normalized>?text=<URL-encoded pesan(edited)>`. Buka via url_launcher (external app).
5. Kalau `logField` diisi → begitu tombol ditekan (niat kirim), `updateEventRow logTable⭘search◼logSearch⭘logField◼logValue` (savesend). Habis itu tampil badge text[6] + (opsional) auto-back.

### 3.3 messageTemplate — engine (reuse gaya PRN)

- `{{field}}` = field doc. `{{field|idr}}` = format Rupiah.
- `<LOOP li>…{{item.xxx}}…</LOOP>` = ulang per elemen array `li[]`.
- `\n` = newline (URL-encode jadi `%0A`).
- Contoh invoice:
  `*INVOICE {{nno}}*\n{{by}}\n{{ts}}\n------------------\n<LOOP li>{{item.in}} x{{item.qt}} = {{item.sub|idr}}\n</LOOP>------------------\n*TOTAL: {{tot|idr}}*\nTerima kasih 🙏`

## 4. Tier BARU di `COORDINATION_SIGNAL_LIST` (Flutter)

Widget existing (AdminHome). Nambah 1 tier "siap invoice" — param baru (semua opsional, kosong = tier gak muncul, nol regresi):

| param baru | nilai | fungsi |
|---|---|---|
| `invoiceGate` | `tst◼completed⭘iv◼` | task selesai + belum di-invoice (iv kosong) |
| `invoiceRoute` | `vertikaTeknoLokaciptaDeliveryInvoice` | tujuan tombol |
| `invoiceRouteParams` | `nno◼{nno}⭘ref◼{tnm}` | ⚠️ butuh nno — tapi signal baca `task`, nota beda doc. Dev: signal join nota by `ref◼{tnm}` ATAU route bawa `tnm` doang → DeliveryInvoice resolve nota by `ref◼{tnm}` (lebih simpel; lihat §5). |
| `text` +segmen | `…◆{n} selesai — perlu invoice◆Cetak Invoice` | label tier + tombol |

**Rekomendasi:** route bawa `tnm` aja (`taskVid◼{tnm}`), DeliveryInvoice cari nota by `ref◼{taskVid}` — signal gak perlu join nota.

⚠️ **JANGAN config-ahead tier ini ke widget LIVE** (token-bearing param baru → app bisa DROP seluruh COORDINATION_SIGNAL_LIST, Killer config-ahead). Dev tambah barengan renderer.

## 5. Page DeliveryInvoice + DeliveryInvoiceList (config-ahead, reuse renderer)

**DeliveryInvoice** — kembar `WalkInNota`:
- `WORKSPACE_HEADER` (back ke DeliveryInvoiceList/AdminHome)
- `RECEIPT_DOC` (baca nota by `ref◼{taskVid}` ATAU `nno◼{nno}` — dev pilih; rekomendasi `ref◼{taskVid}` biar route cukup bawa tnm). Field map = walk-in (headerName gudang, buyerField `by`, lineNameField `in`, lineQtyField `qt`, linePriceField `hg`, lineSubField `sub`, totalField `tot`).
- `PRN variant:keyed` (cetak thermal — template invoice; reuse pola walk-in PRN).
- `WHATSAPP_SEND` (§3): phoneField `hpic`, messageTable nota, messageSearch `ref◼{taskVid}`, logTable task, logSearch `tnm★{taskVid}`, logField `iv`, logValue `sent`.

**DeliveryInvoiceList** — `LIST_CARD` nota `src◼delivery` (title `<nno>`, subtitle `<by>`, meta `<ts>`, trailing `Rp <tot>`, badge iv? → butuh join task; v1 skip badge), route DeliveryInvoice `routeParams taskVid◼{ref}`. Search `nno◆by`.

## 6. Acceptance

1. Task selesai (tx deliver/sale) → CF bikin 1 nota `src:delivery`, `li[]` priced, `tot` bener, `hpic` keisi dari customer. Re-fire = nol dobel. Pure pickup_return → nol nota.
2. AdminHome tier "N selesai — perlu invoice" muncul (gate iv kosong); tap → DeliveryInvoice tampil invoice bener.
3. DeliveryInvoice: RECEIPT_DOC render (nomor/customer/lines/total), PRN cetak jalan.
4. Tap Kirim WhatsApp → sheet: nomor prefill dari hpic (editable + kontak), pesan prefill dari template (LOOP li bener), Buka WhatsApp → WA kebuka dgn teks ke-encode.
5. Setelah Buka WhatsApp → task.iv=sent → tier "perlu invoice" berkurang + badge terkirim.
6. Nomor `08xx` ter-normalisasi `62 8xx`; nomor kosong → error, tombol disabled.
7. WHATSAPP_SEND reusable: ganti messageTemplate+messageSearch → case lain (reminder) jalan tanpa perubahan renderer.
8. Walk-in / supplier / seed flow regresi NOL.

## 6b. Consumer KE-2 — WA konfirmasi order (CreateTaskSummary, user 2026-07-20)

Bukti reusability WHATSAPP_SEND: **setelah admin "Buat Task & Assign"**, kirim WA ke customer buat kabarin order dijadwalkan. Widget SAMA, beda `messageTable`/`messageSearch`/`messageTemplate` — nol renderer tambahan.

- **Taruh:** page `CreateTaskSummary` (@~795), di bawah TASK_CREATE_SUBMIT → tombol ke-2 "Kirim WA ke Customer". Admin: Buat Task & Assign (bikin task) → tap Kirim WA.
- **Sumber nomor+nama:** baca doc CUSTOMER (`stock_location`), bukan task (task belum ada nomor + saat summary masih draft). `messageTable:"84214220504259//stock_location"`, `messageSearch:"lv◼{customerId}"`, `phoneField:"hpic"`.
- **`{customerId}` token:** dari wizard `admin_create_task` (customer dipilih di CreateTaskCustomer via TASK_FEED_LIST idField `lv`). ⚠️ **Dev konfirmasi key token wizard-nya** pas wiring (mungkin `{customerId}`/`{kl}`/wizard-field) — belum di-stage config-ahead krn token belum pasti + renderer WHATSAPP_SEND belum ada.
- **messageTemplate (konfirmasi, no LOOP):** `Halo {{ln}},\nPesanan Anda sudah kami terima & dijadwalkan untuk diantar. Terima kasih 🙏`. `logField` KOSONG (gak perlu marker).
- Config contoh:
  `{"type":"WHATSAPP_SEND","vidtable":"20342033315492","phoneField":"hpic","phoneFallback":"","allowContactPick":"TRUE","countryCode":"62","messageTable":"84214220504259//stock_location","messageSearch":"lv◼{customerId}","messageTemplate":"Halo {{ln}},\\nPesanan Anda sudah kami terima & dijadwalkan untuk diantar. Terima kasih 🙏","logTable":"","logSearch":"","logField":"","logValue":"","text":"Kirim WA ke Customer◆Nomor tujuan◆Pilih Kontak◆Pesan (bisa diedit)◆Buka WhatsApp◆Nomor tidak valid◆✅ Terkirim"}`

Nunjukin WHATSAPP_SEND emang generic: 1 renderer, konsumen = invoice (baca nota, LOOP li) + order-confirm (baca customer, no loop) + reminder outstanding (nanti). Item order di pesan konfirmasi = fase-2 (butuh baca wizard/task it[]; v1 pesan generik cukup).

## 6c. Consumer KE-3 — WA struk walk-in (WalkInNota, user 2026-07-20)

Sama widget, di page `WalkInNota` (existing: RECEIPT_DOC + PRN + "Transaksi Baru"): tombol "Kirim Struk WA" — kirim struk walk-in ke pembeli.
- **Baca nota** langsung (page udah bawa `{nno}`): `messageTable:"84214220504259//nota"`, `messageSearch:"nno◼{nno}"`, message = struk LOOP li (kaya invoice §3.3, ganti "INVOICE"→"STRUK").
- **Nomor:** walk-in `by` = teks bebas (sering "Umum"), TANPA hpic. Jadi `phoneField:""` + `phoneFallback:""` → admin **ketik/pilih kontak** (`allowContactPick:"TRUE"`). WHATSAPP_SEND HARUS handle field kosong = mulai dari input nomor manual (renderer requirement).
- `logField` KOSONG (struk gak perlu marker).
- Config contoh:
  `{"type":"WHATSAPP_SEND","vidtable":"20342033315492","phoneField":"","phoneFallback":"","allowContactPick":"TRUE","countryCode":"62","messageTable":"84214220504259//nota","messageSearch":"nno◼{nno}","messageTemplate":"*STRUK {{nno}}*\\n{{by}}\\n{{ts}}\\n--------------------\\n<LOOP source='li'>{{item.in}} x{{item.qt}} = {{item.sub|idr}}\\n</LOOP>--------------------\\n*TOTAL: {{tot|idr}}*\\nTerima kasih 🙏","logTable":"","logSearch":"","logField":"","logValue":"","text":"Kirim Struk WA◆Nomor tujuan◆Pilih Kontak◆Pesan (bisa diedit)◆Buka WhatsApp◆Nomor tidak valid◆✅ Terkirim"}`

Renderer WHATSAPP_SEND WAJIB support **3 mode nomor**: (a) `phoneField` ada di doc (invoice: hpic), (b) `phoneFallback` token, (c) kosong dua-duanya → admin input manual/kontak (walk-in). Total konsumen v1: 3 (invoice / order-confirm / walk-in-struk) — semua 1 renderer.

## 7. Not doing (v1)
- API gateway / auto-send (biaya+backend) — wa.me manual dulu.
- Lampiran PDF — teks terformat cukup.
- Kirim WA dari driver/gudang — admin only.
- Piutang/kredit invoice (`st` non-LUNAS) — reserved, belum.

---

**Referensi:** `walkin-nota-cf-dev-spec.md` + `supplier-transaction-dev-spec.md` (pola nota→CF, template mirror), `walkin-counter-pos-design.md` (RECEIPT_DOC/PRN), dict book tab `nota`(+hpic)/`task`(+iv) (addendum 2026-07-17), `list-card-universal-dev-spec.md`. Registry nyusul: `flags_functions` (+flag `admin-invoice-wa-sent`, +OnTaskCompleted nota-branch), `event_taxonomy` (opsional).
