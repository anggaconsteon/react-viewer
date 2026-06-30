# Walk-in Counter (POS) — Analisa + Keputusan Tech-Lead

Analisa fitur **Walk-in** (W1–W3) buat unblock build. Inti masalah: walk-in = **point-of-sale** (jual di tempat, berbayar, cetak nota) — butuh **layer data komersial (harga / pembayaran / nota)** yang **BELUM ada di schema galon**. Doc ini ngumpulin keputusan yang harus tech-lead ratify SEBELUM build.

Sumber: mockup `AdminCreateTaskIntegrated2.jsx` (`WalkInIntakeScreen` L2832, `WalkInCounterSuccess`) + `admin-create-task-dev-spec.md` §7/§11.

---

## 1. Flow (dari mockup)
Walk-in 1 page intake (`W1`) → 2 jalur (toggle "Penyelesaian"):
- **Dibawa Langsung (`counter_immediate`)** → selesai di counter → **W3 = Nota Penjualan** (cetak). Jual consumable + refill, bayar LUNAS, stok turun, **tanpa task tanpa custody**.
- **Dikirim (`delivery`)** → jadi **task antar** (W1→P3→P4→P5, reuse create-task). Refill **gak boleh** jalur dikirim (mockup `refillBlocked`).

Item 2 jenis: **consumable** (SALE, qty + **harga**, override per-baris) · **refill** (returnable, waterType ro/isiulang, qty, **harga terpisah/parkir**). `totalRp` = Σ SALE (`harga × qty`); refill gak masuk total (parkir).

Pembeli: counter = opsional ("Umum"); dikirim = nama + alamat.

---

## 2. Gap inti — data komersial belum di schema
Dict galon (`item/stock_location/movement/asset_cache/task/vehicle_check`) **gak punya**: harga, metode bayar, status bayar, nota. Movement = SSOT **stok** (qty doang), gak nyimpen nilai uang. Jadi butuh **layer komersial baru**.

---

## 3. KEPUTUSAN (butuh tech-lead) — tiap ada rekomendasi

### D1. Sumber harga produk
Mockup: harga = **atribut produk** (default dari katalog, read-only), override per-baris boleh.
- **Opsi A (rekomendasi):** field harga di doc `item` (mis. `item.hrg`). Pricelist = atribut item, editor di settings produk (luar fitur). Simpel, 1 koleksi.
- Opsi B: koleksi `pricelist` terpisah (per item, per-tier/tanggal). Lebih fleksibel, lebih berat.
- **DECISION:** A atau B? + nama field harga di `item`.

### D2. `hg` = harga satuan per-baris (FIELD BARU)
Per-baris jual simpen `hg` (harga aktual, default = item price, override boleh). ⚠ **JANGAN `pr`** (`pr`=`plan_refill`, collision). 
- **DECISION:** ratify `hg` di line (`it[]` / nota line) + tambah ke dict book.

### D3. Koleksi `nota` (BARU) — snapshot beku
Counter terbit nota immutable. Usul schema:
```
nota (key nno):
  nno  = nomor nota (generated)
  dt   = tanggal/epoch
  by   = nama pembeli (kosong = "Umum")
  bym  = metode bayar (tunai | transfer)
  st   = status (LUNAS — counter selalu lunas)
  wh   = depo/warehouse (gl counter)
  tot  = total Rp
  ln[] = [ {ii, in, qt, hg, sub}, … ]   # line beku (native array — sama dep custody/task it[])
  cv/cn = kasir (admin)
  t/ts
```
- **DECISION:** ratify koleksi `nota` + field codes. (ln[] = native array → kena blocker native-array-write yang sama dgn task.it[].)

### D4. Pembayaran
Counter = **SELALU LUNAS** (bayar di tempat, tanpa piutang/saldo). Metode tunai/transfer.
- **DECISION:** konfirmasi gak ada kredit/piutang buat counter. Metode bayar cukup tunai+transfer? (QRIS/kartu?)

### D5. Refill harga (parkir)
Mockup: refill walk-in = tukar 1:1 di counter, **harga terpisah** (bukan harga consumable, gak masuk totalRp consumable).
- **DECISION:** refill di-charge gak? Kalau ya, harga refill dari mana (flat per kategori? field `item.hrgRefill`?) + masuk nota line atau terpisah?

### D6. Write counter (W1→W3) — pisah stok vs komersial
Usul: per baris **SALE** → `movement mt=SALE` (`fl={gl counter}`, `tl=null`, `ii`, `qt`, `er=ADMIN`, `t`) = turun stok (CF derive). Refill → `movement mt=REFILL`. **Nilai uang (hg/total/bayar) → doc `nota`, BUKAN movement.** Stok turun via CF, tanpa custody tanpa task.
- **DECISION:** setuju movement = stok-only (no hg), nota = komersial-only? (clean separation) Atau movement bawa hg juga (denorm)?

### D7. Jalur "Dikirim" → task
W1 (dikirim) → synthesize jadi delivery task (P3→P4). Butuh customer: pembeli walk-in (nama+alamat) bukan client tetap.
- **Opsi A:** bikin `stock_location lt=client` baru on-the-fly (transient/un-seeded) dari data pembeli.
- **Opsi B (rekomendasi):** 1 client generik "Walk-in Umum" + alamat kirim di task (`al`), pembeli di field nota/task.
- **DECISION:** A atau B? Gimana harga di jalur dikirim (ditagih saat antar? COD?).

### D8. Render + cetak nota
Nota 80mm thermal (header depo · line qty×harga · TOTAL · metode · cap LUNAS) via **Document Engine** + **`printBluetooth`**.
- **DECISION:** konfirmasi template nota di doc-engine udah ada / perlu dibuat. printBluetooth udah jalan (driver pake)?

### D9. `gl` counter (warehouse asal)
SALE movement `fl` = depo tempat counter. Dari mana?
- **DECISION:** dari session admin (warehouse-nya) atau dipilih? (sama open dgn P4 task `gl`.)

### D10. Widget input harga
Mockup: override harga per-baris (`getMoneyInput`).
- **DECISION:** widget baru `getMoneyInput` (format Rp) atau reuse `textField` numeric / `stepper`?

---

## 4. Build dependency (kalau decisions ke-ratify)
| butuh | jenis | catatan |
|---|---|---|
| `taskItemBuilder` mode `walkin` | EXTEND | consumable(SALE+harga) + refill(water+qty), no drop/pickup; reuse builder + `getMoneyInput` |
| `getMoneyInput` | NEW? | harga override Rp (D10) |
| koleksi `nota` + native-array `ln[]` | NEW + blocker | sama dep native-array-write (task.it[]) |
| movement SALE/REFILL write | ada (DSL) | scalar per-baris; tapi per-line loop = renderer (sama isu movement-emit driver) |
| Document Engine nota template + printBluetooth | reuse | konfirmasi template (D8) |

## 5. Rekomendasi urutan
1. **Tech-lead ratify D1–D9** (terutama: koleksi `nota` D3 + price source D1 + write-split D6) — ini ngeblok semua.
2. Baru build: `nota` + `getMoneyInput` + taskItemBuilder walkin mode + nota doc-engine.
3. Jalur "Dikirim" = paling gampang (reuse create-task P3–P5) — bisa duluan kalau customer-synthesis (D7) kelar.

**Sebelum D1–D9 ke-ratify, build walk-in = ketahan** (data komersial gak ada tempatnya). Core galon (P1–P5) gak kena — walk-in layer komersial terpisah.
