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
- `<LOOP source='li'>…{{item.xxx}}…</LOOP>` = ulang per elemen array `li[]`. ⚠️ **Pakai `source='…'`**, sama persis kaya `PRN`. Versi awal doc ini nulis `<LOOP li>` (tanpa `source=`) — **salah**, dibetulin 2026-08-27 dari config live `DeliveryInvoice` (op1Screen 892).
- **Gak ada penjumlahan.** Engine cuma substitusi + pengulangan. Total rupiah harus udah jadi field di doc (mis. `nota.tot`); array tanpa `tot` gak bisa dijumlah dari template.
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

## 6b-2. FASE-2 konfirmasi order — rincian barang + harga (2026-08-27) ✅ LIVE 2026-08-28

Fase-2 yang di §6b ditunda ("item order di pesan konfirmasi = fase-2"): pesan konfirmasi nampilin **rincian barang + harga satuan**, bukan cuma kalimat generik.

> ### ✅ TERPASANG 2026-08-28 — dev udah ship `routeParams`, sheet udah disambung
>
> `TASK_CREATE_SUBMIT` sekarang `route:OrderConfirm` + `routeParams:taskVid◼{tnm}`, kepasang di **dua tab** baris 728. Alurnya jalan penuh:
>
> ```
> CreateTaskSummary → [Buat Tugas] → OrderConfirm(taskVid) → [Kirim Rincian] → WhatsApp
> ```
>
> Perubahan sisi sheet yang ikut: `receiptDoc` ditambahin ke `OrderConfirm` (visual nota), `whatsappSendKeyed` pakai `phoneTable`/`phoneSearch`, dan tombol WA lama di `CreateTaskSummary`@727 **dimatiin** (`F727=FALSE`) biar pelanggan gak dapet dua pesan. Rinciannya §6b-2.0b.

**LOOP-nya bukan masalah** — `<LOOP source='it'>` udah didukung sejak 2026-07-21, nol perubahan renderer buat bagian itu. Yang ngeblokir: **halamannya**, bukan template-nya. Baca §6b-2.0 → §6b-2.0b berurutan.

> ⚠️ **Percobaan pertama di `CreateTaskSummary`@727 GAGAL dan udah di-ROLLBACK** (§6b-2.0). Baris 727 sekarang balik ke versi lama yang jalan. Jangan ambil config dari sini buat halaman itu.

Template yang dituju (sekarang kepasang di halaman baru `OrderConfirm`, §6b-2.0b):
```
*KONFIRMASI ORDER {{tnm}}*\n{{kn}}\n\nBarang yang dijadwalkan:\n<LOOP source='it'>• {{item.in}} x{{item.pd}} @ {{item.hg|idr}}\n</LOOP>\n⚠️ *HARGA BELUM FINAL*\nRincian di atas masih sementara. Jumlah bisa berubah kalau ada tambahan barang atau tukar tabung di lokasi.\n\n*Mohon jangan transfer dulu* — nota resmi kami kirim setelah barang diterima.\n\nTerima kasih 🙏
```

**Kenapa TANPA total (keputusan, bukan keterbatasan awal).** Angka total di bawah daftar barang kebaca sebagai **tagihan** — dan harga di tahap ini belum final, jadi risikonya pelanggan keburu transfer nominal yang salah. Rincian per barang tanpa angka akhir lebih jujur nyampein "belum final". Blok peringatan ditulis dua lapis: judul tegas + larangan eksplisit *"mohon jangan transfer dulu"*, karena rincian harga tanpa larangan tetap kebaca sebagai tagihan.

### 6b-2.0 ⚠️ KOREKSI 2026-08-27 — tombol WA GAK BISA di `CreateTaskSummary`

Config §6b-2 sempat dipasang di `CreateTaskSummary` (baris 727) lalu **di-ROLLBACK hari yang sama**. Sebabnya bukan sintaks — **posisinya yang mustahil**:

1. Tap WA **sebelum** submit → doc `task` belum lahir → `messageSearch:"tnm◼{tnm}"` gak nemu → semua `{{…}}` kosong → **pesan kosong**.
2. Tap WA **sesudah** submit → gak bisa. `TASK_CREATE_SUBMIT` punya `"route":"vertikaTeknoLokaciptaAdminHome"` + chain dialog Ok→AdminHome, jadi **halaman langsung ditinggalin**. Tombolnya gak pernah kesentuh pas task-nya ada.

Alur di §6b ("bikin task → tap Kirim WA") **gak pernah mungkin** dengan config halaman itu. Baris 727 udah dibalikin ke versi lama (baca `stock_location`, pesan generik, jalan) di **dua tab**.

**Pelajaran:** kalau tombol gantung ke doc yang lahir dari submit di halaman yang sama, cek dulu submit-nya navigate ke mana. Widget yang butuh `taskVid` harus ada di halaman **sesudah** task jadi.

### 6b-2.0b Halaman `OrderConfirm` — ✅ LIVE dua tab (2026-08-28)

Halaman tujuan sesudah submit. **`op1Screen` 1622-1628** dan **`op1Screen Driver` 944-950** (2 baris buffer di ekor masing-masing):

| # | Widget | Isi |
|---|---|---|
| *header* | — | `vertikaTeknoLokaciptaOrderConfirm` |
| 1 | `workspaceHeader` | `task` by `tnm◼{taskVid}` · title `kn` · address `al` · back AdminHome · text `Order Dibuat◆Kirim rincian ke pelanggan` |
| 2 | `receiptDoc` | **baru 08-28** — `task` by `tnm◼{taskVid}`, baris dari `it[]` (`in`/`pd`/`hg`/`sub`), total `tot`, judul `RINCIAN ORDER` |
| 3 | `whatsappSendKeyed` | `messageTable:task` · `messageSearch:tnm◼{taskVid}` · `phoneTable:stock_location` · `phoneSearch:lv◼{kl}` · template LOOP `it[]` + blok peringatan |
| 4 | `rbtCta` | `Selesai` → AdminHome |

Nomor baris beda antar tab (1622 vs 944) — gak masalah, route resolve dari **kolom A**, bukan nomor baris. `Plug` gak perlu diisi.

**Kenapa `receiptDoc` di sini.** Sebelumnya halaman ini cuma header + tombol — gak ada yang bisa dilihat admin sebelum kirim. Sekarang nampilin nota visual yang sama gayanya kaya `WalkInNota`/`DeliveryInvoice`, jadi admin bisa **cek rincian sebelum nge-WA**. Widget `receiptDoc` dipakai apa adanya (semua field-nya emang param) — cuma diarahin ke `//task` + `it[]` gantinya `//nota` + `li[]`.

> ⚠️ **Total di layar ≠ total di WA — disengaja.** `receiptDoc` nampilin `tot` ke **admin** (labelnya `PERKIRAAN TOTAL`, footer `Harga belum final — nota resmi menyusul`). Pesan WA ke **pelanggan** tetap TANPA total (§6b-2 alinea "Kenapa TANPA total"). Admin butuh angka buat ngecek; pelanggan jangan dikasih angka yang belum final.

**✅ `routeParams` udah landing.** `TASK_CREATE_SUBMIT` di baris 728 (dua tab) sekarang:
```
"route":"vertikaTeknoLokaciptaOrderConfirm",
"routeParams":"taskVid◼{tnm}"
```

**⚠️ Dialog konfirmasi dibuang.** Widget `taskCreateSubmit`@Widget255 punya `chain` DO_DIALOG yang Ok-nya balik ke AdminHome — itu bakal **ninggalin halaman sebelum `route` sempat jalan**, persis penyakit §6b-2.0. `chain`-nya dicabut dari template, `routeParams` ditambahin. Aman diubah di tempat: `taskCreateSubmit` **cuma punya 1 konsumen** (baris 728) — dikonfirmasi lewat sisir kolom B dua tab. Param dialog lama (`R`/`S`/`T` = DIALOGTITLE/DIALOGTEXT/OKROUTE) dikosongin jadi `=""`. Dialognya emang gak diperluin lagi — `OrderConfirm` sendiri yang jadi layar konfirmasi, dan buat user gaptek satu tap lebih sedikit.

**`whatsappSend`@Widget300 diperluas, BUKAN dibikin varian.** Tambah `phoneTable`/`phoneSearch`, sekalian `vidtable` yang tadinya ke-bake jadi `[VIDTABLE]`. Template ini dipakai **3 halaman per tab**, jadi ketiganya wajib ikut diperlebar SUBSTITUTE-nya barengan (Killer #8) — kalau nggak, `[PHONETABLE]` kerender literal di halaman lain:

| Halaman | op1Screen | op1Screen Driver | `phoneTable`/`phoneSearch` |
|---|---|---|---|
| `CreateTaskSummary` | 727 | 727 | `=""` (baca dari `messageTable` — perilaku lama) |
| `DeliveryInvoice` | 897 | 887 | `=""` |
| `ReorderCustomer` | 1226 | 921 | `=""` |
| `OrderConfirm` | 1625 | 947 | **diisi** — `stock_location` + `lv◼{kl}` |

Peta param seragam semua baris: `G`=phoneField · `H`=fallback · `I`=allowContactPick · `J`=countryCode · `K`=messageTable · `L`=messageSearch · `M`=messageTemplate · `N`-`Q`=log* · `R`=text · **`S`=phoneTable · `T`=phoneSearch · `U`=vidtable**.

**⚠️ Tombol WA lama di `CreateTaskSummary`@727 dimatiin** (`F727=FALSE`, dua tab). Kalau dibiarin, pelanggan dapet **dua** WA: pesan generik pra-submit + rincian pasca-submit. Config-nya masih utuh di barisnya, tinggal balikin `F727=TRUE` kalau mau dihidupin lagi.

### 6b-2.1 `phoneTable` / `phoneSearch` — param baru `WHATSAPP_SEND` ⬜

**Masalah:** `phoneField` dibaca dari doc yang sama dengan `messageTable`. Begitu `messageTable` nunjuk `task` (biar bisa LOOP `it[]`), nomor HP ilang — `task` gak punya `hpic`, itu adanya di doc pelanggan.

**Ditolak: denorm `hpic` ke task.** Sempat diusulin, lalu dibatalin owner 2026-08-27. Dua alasan:

1. **Denorm selalu bikin rombongan "sebelum diperbaiki".** Persis kejadian `la`/`lo` di spec `customer-coordinate-maps`: task yang dibuat sebelum fix landing, koordinatnya kosong **selamanya**. `hpic` bakal ngulang persis pola itu — semua task existing gak akan pernah punya nomor.
2. **Alasan denorm di sistem ini gak berlaku di sini.** `kn`/`al`/`la`/`lo` didenorm ke `task` karena **sopir sering sinyal jelek** — kartu rute wajib render tanpa query kedua. Kirim WhatsApp itu **aksi admin dan wajib online** (butuh internet buat buka wa.me). Bayar ongkos denorm tanpa dapet manfaatnya.

**Yang diminta — 2 param baru, dua-duanya OPSIONAL (kosong = perilaku sekarang, nol regresi):**

| param | isi | contoh |
|---|---|---|
| `phoneTable` | koleksi tempat nomor tinggal | `84214220504259//stock_location` |
| `phoneSearch` | cara nemuin doc-nya, boleh pakai field dari doc utama | `lv◼{kl}` |

Aturan resolve `phoneField`:
1. `phoneTable`+`phoneSearch` diisi → baca `phoneField` dari doc itu.
2. Kosong → baca `phoneField` dari doc `messageTable` (perilaku sekarang).
3. Tetap kosong → `phoneFallback` → input manual/kontak (`allowContactPick`).

⚠️ `phoneSearch` perlu bisa nunjuk **field dari doc utama** (`{kl}` = FK pelanggan di doc `task`), bukan cuma token route. Ini bagian yang perlu diperhatiin dev.

**Plumbing-nya udah setengah ada:** widget ini udah nge-resolve sepasang `table`+`search` kedua buat `logTable`/`logSearch` (tujuan tulis marker). Yang belum cuma pasangan buat sisi **baca**.

**Kepakai lagi di mana:** doc apa pun yang punya FK ke doc yang punya nomor — `task` (`kl`), `nota` delivery (`kl`), dan kemungkinan besar yang berikutnya.

**BUKAN buat walk-in.** `WalkInNota` `phoneField:""` bukan karena kelupaan — nota walk-in emang **gak punya kaitan ke pelanggan** (`by` cuma teks bebas, sering "Umum"). Di situ admin ketik/pilih kontak manual, dan itu udah bener. Jangan dipaksa.

### 6b-2.2 Yang nyangkut di `TASK_CREATE_SUBMIT`

Semuanya nyentuh handler yang sama:

| # | Minta | Dipakai buat | Status |
|---|---|---|---|
| 1 | Salin `la`/`lo` dari doc pelanggan ke `task` | tombol Lihat Lokasi | ✅ **kelar 2026-08-27** — kebukti di doc `TASK-2026-000555` |
| 2 | ~~Salin `hpic`~~ | prefill nomor WA | ❌ **dicabut** — diganti `phoneTable`/`phoneSearch`, §6b-2.1 |
| 3a | **`hg`** per baris `it[]` (salin harga satuan dari master item) | harga di `receiptDoc` + WA | ✅ **kelar, kebukti 2026-08-31** — `TASK-2026-000567`: `hg:120000` (Gas 5,5 Kg, sesuai `hrg` master). Akarnya dua lapis: config kurang `priceSourceField` (dibenerin 08-28) + renderer mode `order` belum implement (dibenerin dev) |
| 3b | Hitung **`sub`** (`pd × hg`) + **`tot`** (Σ sub) | total di `receiptDoc` | ✅ **kelar, kebukti 2026-08-31** — `sub:240000` (2×120000), `tot:240000` |
| 4 | **`routeParams`** — nurunin id task ke halaman tujuan | nyambungin `OrderConfirm` | ✅ **kelar 2026-08-28**, kepasang §6b-2.0b |
| 5 | **`ts`** di doc `task` keisi string tanggal | baris Tanggal di `receiptDoc` | ✅ **kelar, kebukti 2026-08-31** — `ts:"2026-08-31 09:12"` |
| 6 | **`qt`** per baris `it[]` = qty tertagih (yang dipakai ngitung `sub`) | kolom qty di `receiptDoc` + WA | ⬜ **baru, 2026-08-31** — bukti `TASK-2026-000568`: Crystalline 3300ml `tx:"sale"` `ps:3` `pd:0` → layar nampil "**0x** 43.000" padahal `sub:129000` bener. Qty tinggal di field beda per jenis baris (`pd` antar / `ps` jual / `pr` refill / `pb` beli), widget cuma bisa baca SATU field. `sub` yang bener ngebuktiin dev udah milih qty tepat secara internal — **tinggal disimpen** sebagai `qt`, konsisten sama `li[].qt` nota walk-in. Habis landing: builder ganti 3 sel × 2 tab (`lineQtyField` `pd`→`qt` + WA `{{item.pd}}`→`{{item.qt}}`) |

**No.3 — kenapa gak bisa config doang.** Engine template cuma bisa substitusi (`{{field}}`, `{{field|idr}}`) dan pengulangan (`<LOOP>`) — **gak ada penjumlahan**. Satu-satunya agregat yang pernah kepakai `{{it.count}}` (hitung baris, bukan uang). Polanya udah ada di `NOTA_CREATE_SUBMIT` (bikin `li[]{…,sub}` + `tot` buat nota walk-in) — tinggal ditiru. Catatan tambahan 08-28: bukan cuma `sub`/`tot` — **`hg`-nya sendiri gak ada** di `it[]` order delivery (beda dari walk-in yang builder-nya bawa `priceField:"hg"`), jadi dev juga harus nyalin harga satuan pas submit.

> ✅ **2026-08-31: harga+tanggal DIBALIKIN.** Sempat disembunyiin 08-28 pas semua nilai masih 0 (biar pelanggan gak nerima "@ Rp 0"). Setelah dev landing & kebukti di `TASK-2026-000567` (`hg:120000` · `sub:240000` · `tot:240000` · `ts` string), keenam sel dipulihkan di dua tab proxy: `dateField:"ts"` · `totalField:"tot"` · `linePriceField:"hg"` · `lineSubField:"sub"` · label Tanggal + PERKIRAAN TOTAL balik ke segmen text · ` @ {{item.hg|idr}}` balik ke template WA. **Copy ke prod**: baris `receiptDoc` + `whatsappSend` halaman OrderConfirm.

**Pesan WA tetap TANPA total** walau `tot` ada — itu keputusan, bukan keterbatasan (§6b-2). Yang lihat angka cuma admin di layar.

---

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
