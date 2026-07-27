# Walk-in Counter (POS) — Design v2

**v2 2026-07-07** (supersede v1 2026-06-30 — brainstorm ulang, keputusan final user). Scope v1 ship: **counter only, SALE only, tanpa tab, 1 depo, sampai CETAK NOTA.**
Dev spec per role: `walkin-flutter-dev-spec.md` (renderer) + `walkin-nota-cf-dev-spec.md` (Go).

**Prinsip tetap:** stok via `movement`→CF→`asset_cache` (jalur existing). Nota = layer komersial (harga/total/bayar) di atas movement, cross-runtime (walkin sekarang, driver delivery nanti).

---

## 0. Keputusan v2 (final, hasil brainstorm 2026-07-07)

| topik | keputusan |
|---|---|
| Fulfillment | **Counter only** — tab Dibawa/Dikirim DIHAPUS, langsung form. "Dikirim" nanti = mode. |
| Tx types | **SALE only** v1. Refill nyusul (`txTypes` tambahan, schema siap). |
| Harga | **`item.hrg` master = default + kasir override per line.** Jangka panjang: pricelist per-customer jadi lapisan default — form gak berubah. |
| Depo `gl` | **Bake literal 1 depo** di config. Multi-depo nanti = ganti literal → picker (schema `nota.gl` udah ada). |
| Nota write | **Native widget** (`NOTA_CREATE_SUBMIT`, pola TASK_CREATE_SUBMIT) — `li[]` array gak bisa lewat addToEvent (limitasi DSL). Kontrol sheet tetap: flag/route/chain/GPS/addToEvent evidence = param. |
| Movement | **Mekanisme A: CF `OnNotaCreated`** — app nulis 1 doc nota; CF loop `li[]` → SALE movement per line. Renderer NOL urusan movement. |
| `nno` | Counter backend `NOTA-{{YYYY}}-{{COUNTER(vtl.nota,6)}}` via `run generate_number` riding savesend (proven di tnm). Namespace SENDIRI. |
| Cetak | **PRN existing di-extend: variant `keyed`** — mesin template utuh (TEXT/FEED/HR/ROW/LOOP/QRCODE/CUT); yang baru cuma data-binding: (1) `{{field}}` skalar dari doc, (2) `<LOOP source='li'>` array dalam doc. |
| Pembeli | Nama bebas (kosong = "Umum"), TANPA stock_location. `kl` optional (kosong di counter). |
| Status | `st:"LUNAS"` selalu (counter). Field ada biar nanti bisa piutang. |

## 1. Flow + halaman

```
AdminHome ─▶ W1 vertikaTeknoLokaciptaWalkIn (REBUILD total, ganti mock lama)
             1 workspaceHeader        "Walk-in · Counter"
             2 selectableGrid pos 1   PEMBAYARAN: Tunai◆Transfer            → bym
             3 textField pos 12       Pembeli (kosong = Umum)               → by
             4 taskItemBuilder        mode walkin: item+qty+harga(hrg default, override)+subtotal → draft li[]
             5 autoNumber (NUMBER)    pos 17 · "No. Nota: [DIBUAT OTOMATIS]" · template NOTA-{{YYYY}}-{{COUNTER(vtl.nota,6)}} · executable generate_number (pola tnm CreateTaskSummary)
             6 NOTA_CREATE_SUBMIT     TOTAL Rp + [Buat Nota] · run 17:generate_number → tulis nota native + nno → route W3 bawa {nno}
                    │
                    ▼  CF OnNotaCreated: loop li[] → movement SALE per line (fl=depo, nref=nno)
                       → asset_cache depo turun (OnMovementCreated existing)

           W3 vertikaTeknoLokaciptaWalkInNota (BARU)
             1 workspaceHeader        "Nota Penjualan"
             2 TXT ringkas            "{nno} tersimpan · LUNAS"
             3 PRN variant keyed      template 80mm (header depo · meta · lines · total · QRCODE nno) → CETAK
             4 rbtCta                 "Transaksi Baru" → W1
```

Widget baru/extend: `taskItemBuilder mode walkin` (extend) · `NOTA_CREATE_SUBMIT` (baru, clone pola) · `PRN keyed` (extend). RECEIPT_DOC layar (v1 2026-06-30) **DITUNDA** — PRN template udah jadi bentuk nota; layar cukup ringkas.

## 2. Schema `nota` (koleksi BARU, doc auto-id)

```
nno    "NOTA-2026-000001"   counter vtl.nota
src    "walkin"             (driver nanti: "delivery")
ref    ""                   (driver nanti: tnm)
kl     ""                   optional — counter Umum kosong
by     "" | nama pembeli
bym    "tunai" | "transfer"
st     "LUNAS"
gl     "F621558e33b612"     depo (bake v1)
tot    45000                Number
li[]   [{ii,in,qt,hg,sub}]  NATIVE array — snapshot BEKU (harga saat transaksi)
cv/cn  kasir (session) · t epoch Number · ts formatted
search "nno★NOTA-2026-000001"
```

`li[]` snapshot beku = nota lama gak berubah walau harga master berubah. Master `item` +field **`hrg`** (harga default, Number) — kolom baru Master_Item + seed.

## 3. Movement (CF, spec terpisah)

`OnNotaCreated` (mirror OnVehicleOpening): trigger `nota` created → per line `li[]` qt>0 → movement `{mt:SALE, fl:gl, ii, qt, er:ADMIN, nref:nno, d:"walkin sale", t, ts}` — TANPA `tl` (keluar sistem) → depo −qt. `mid = sale-{nno}-{ii}` (deterministik, idempotent; gak tabrakan sama `sale-{tnm}-{ii}` delivery).

## 4. Build order

1. **Gue (sekarang):** Master_Item +`hrg` + seeder · dictionary (`nota` tab, flag `admin-walkin-sale`, CF/mid registry, counter `vtl.nota`) · 2 dev spec.
2. **CF dev:** `OnNotaCreated` (independen, bisa duluan).
3. **Flutter:** builder mode walkin → NOTA_CREATE_SUBMIT → PRN keyed.
4. **Gue:** page W1/W3 + template PRN di-flip LIVE **bareng build renderer** (aturan ship config-ahead-of-renderer).
5. Test end-to-end: W1 jual 2 item (1 harga override) → nota kebentuk (`nno` urut, `li[]` beku, `tot` bener) → stok depo turun sejumlah qty → W3 cetak nota thermal kebaca.

## 5. Nanti (SUDAH disiapin schema-nya, JANGAN dibangun sekarang)

Refill (`txTypes`+harga jasa) · multi-depo (picker `gl`) · pricelist per-customer (lapisan default `hrg`) · piutang (`st`) · nota driver (`src:delivery, ref:tnm, kl` keisi — reuse PRN keyed + schema, nol rombak) · RECEIPT_DOC layar.
