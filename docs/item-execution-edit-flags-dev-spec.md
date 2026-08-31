# ITEM_EXECUTION_LIST — 3 saklar edit `editDrop`/`editPickup`/`editConsumable` (Dev Spec)

**Tanggal:** 2026-08-07
**Buat:** dev Flutter (renderer). Config wiring = builder (nyusul, sesudah renderer).
**Status:** PROPOSED — **bangun 3 saklar SEKARANG**. `editConsumable`/`editPickup` boleh dipakai langsung; `editDrop:"FALSE"` nunggu admin-edit strict-mode (§3).
**Konteks / Konsumen pertama:** galon VTL (tenant `20342033315492`). `ITEM_EXECUTION_LIST`@DeliveryWorkspace(683).
**Referensi:** `docs/admin-edit-order-qty-dev-spec.md` §3.1 (saklar edit, induk) — ini POTONG-MAJU-nya. Memory `project_admin_edit_order_strict_mode`.

---

## 1. Kenapa

⚠️ **KOREKSI premis (bukti live 2026-08-07, screenshot DeliveryWorkspace):** consumable **BELUM** editable. Returnable drop/pickup ada stepper `− [n] +`; consumable (Aqua 330ml JUAL) cuma **kotak angka statik "5" — NOL stepper**. Jadi `editConsumable` **BUKAN sekadar toggle lock** — renderer harus **BANGUN stepper consumable (sale `as`/`ps` + buy `ab`/`pb`) dari nol**, sejajar returnable. Config `editConsumable:"TRUE"` udah live tapi di-ignore (renderer belum honor).

User mau consumable **bisa +/-** (driver sesuaikan jumlah jual/beli di lapangan), **dan** bisa di-toggle read-only lewat parameter — biar nanti nyambung ke mekanisme "driver GAK boleh ubah, admin yang ubah order" (strict-mode, flow+desain nyusul, BELUM fix).

**Sekarang: bangun stepper consumable + saklar `editConsumable`.** editDrop + admin-edit-order = nanti (spec induk SHELF).

## 2. Kontrak parameter (renderer) — 3 saklar TERPISAH

`ITEM_EXECUTION_LIST` honor 3 field baru, masing-masing INDEPENDEN (`"TRUE"` = ada +/-, `"FALSE"` = read-only aktual=plan). Semua default **`"TRUE"`** (absent/TRUE = backward-compat, perilaku sekarang):

| field | ngatur | field aktual→plan pas FALSE | default |
|---|---|---|---|
| `editDrop` | **drop** returnable (galon isi ke customer) | `ad` = `pd` | `"TRUE"` |
| `editPickup` | **pickup** returnable (galon kosong dari customer) | `ap` = `pp` | `"TRUE"` |
| `editConsumable` | **consumable** (jual/beli, `ic◼consumable`) | `as`=`ps`, `ab`=`pb` | `"TRUE"` |

- ⚠️ **consumable: stepper BELUM ADA di renderer** (bukti live) → TRUE bukan cuma "biarin +/-", tapi renderer **render kontrol +/- baru** buat sale/buy (skrg statik). FALSE → tetep statik (aktual=plan). drop/pickup steppernya udah ada → TRUE=biarin, FALSE=ilangin.
- FALSE → field aktual read-only + tombol +/- ilang + aktual auto = plan.
- **Dibedain** (user 2026-08-07): drop vs pickup saklar SENDIRI-SENDIRI, jangan digabung.
- **Pickup default TRUE** (jumlah kosong balik cuma tau di tempat → biasanya selalu editable), tapi dibikin **parameter dinamis** juga biar fleksibel.
- **Refill (`ar`)** = tukar galon (returnable exchange, isi keluar + kosong masuk). Sementara **ikut `editDrop`** (sisi kasih isi). Dev confirm kalo mau saklar sendiri.
- Nilai plain-string (bukan token) → aman ditambah ke widget live.

### 2a. Cap consumable JUAL = stok kendaraan — ✅ **SELESAI & TERUJI 2026-08-12**
Stepper consumable sudah dibangun dev, dan cap `saleCap*` sudah jalan (user konfirmasi: jual tidak bisa melebihi stok mobil, `+` disable di angka maks). Config terpasang di `op1Screen!AJ683`–`AM683`.

Riwayat masalah: **dulu belum ada penjagaan sama sekali** di consumable. Driver bisa isi jual > stok yang dibawa → `asset_cache` kendaraan minus + movement tidak cocok. Perilaku yang diminta **persis seperti drop yang sudah benar**: begitu mencapai stok mobil, tombol `+` **disable** dan muncul label maks.

**Kontrak parameter (cerminan `dropCap*` yang sudah jalan):**

| field | isi | catatan |
|---|---|---|
| `saleCapTable` | `84214220504259//asset_cache` | sama dengan dropCapTable |
| `saleCapSearch` | `lv◼{vehicleId}⭘cd◼<?>` | ⚠️ nilai `cd` untuk item consumable **perlu dikonfirmasi** — `dropCapSearch` memakai `cd◼full` (khusus galon isi). Kalau consumable disimpan tanpa `cd`, pakai `lv◼{vehicleId}` saja |
| `saleCapKey` | `ii` | join per item |
| `saleCapField` | `qt` | jumlah stok |
| `saleCapLabel` | `Maks <max> — stok mobil` | boleh pakai ulang `capLabel` kalau dev lebih suka satu label |

Perilaku: `as` (jual) tidak boleh melebihi `qt` item itu di kendaraan → `+` disable di angka maks + label.

**Acuan implementasi:** logikanya identik dengan `dropCap*` yang sudah bekerja di widget yang sama — bukan mekanisme baru, hanya diterapkan ke baris consumable.

### 2a-lama. Catatan awal (2026-08-07)
Consumable JUAL (`as`) = jual dari stok mobil → **gak boleh > stok item itu di kendaraan**, persis mekanisme `dropCap` di returnable drop (`capLabel:"Maks <max> — stok mobil"`, baca `asset_cache`).
- **JUAL (`as`)** → cap = qty consumable item di asset_cache mobil. Stepper `+` mentok di `<max>`. Mirror `dropCap*` param tapi **kategori consumable** (bukan `cd◼full` — returnable full doang). Dev tentuin bentuk param (mis. `saleCapSearch` sendiri) atau derive dari kategori item; RULE = sumber cap = stok item di mobil.
- **BELI (`ab`)** → naik ke mobil (nambah stok) → **gak di-cap** (kecuali batasin kapasitas mobil, di luar scope).
- **REFILL (`ar`)** → sisi kasih isi = keluar dari mobil → di-cap kaya drop (stok isi mobil). Sisi kosong masuk = nambah, gak di-cap.
- Tanpa cap → driver bisa jual 10 padahal bawa 5 → asset_cache mobil minus / movement ngaco. Cap = jaga integritas stok, sama alasan drop di-cap.

## 3. Bangun 3 saklar SEKARANG — tapi USAGE `editDrop:"FALSE"` nunggu admin-edit
- **Renderer bangun 3-tiganya sekarang** (`editDrop`/`editPickup`/`editConsumable`) — capability-nya sama (toggle read-only per kategori). Murah, sekali kerja.
- **PENTING — kapan boleh di-FALSE-in di prod:**
  - `editConsumable:"FALSE"` + `editPickup:"FALSE"` → **boleh dipakai sekarang** (gak butuh flow lain).
  - `editDrop:"FALSE"` → **JANGAN dipakai di prod** sampai **admin-edit-order strict-mode** jadi (`admin-edit-order-qty-dev-spec.md`: admin edit order + audit + surat-jalan 2-kolom). Kalo drop dikunci tanpa jalan admin-edit → driver mentok pas customer minta beda. Param-nya boleh ada (default TRUE = aman), cuma jangan di-FALSE-in dulu.

## 4. Config (builder — SESUDAH renderer jadi)
Tambah param ke `ITEM_EXECUTION_LIST`@DeliveryWorkspace(683), default `"TRUE"` (= sekarang). Flip `"FALSE"` per-tenant sesuai kebutuhan (inget batasan §3 buat editDrop). **Jangan tambah param sebelum renderer honor** (biar gak no-op / config-ahead).

## 5. Deliverable
| Bagian | Siapa | Status |
|---|---|---|
| `ITEM_EXECUTION_LIST` honor `editDrop`/`editPickup`/`editConsumable` (FALSE→lock kategori, aktual=plan) | dev Flutter | ⬜ |
| Config 3 param `="TRUE"` @DeliveryWorkspace(683) | builder (nyusul) | ⬜ |

## 6. Not Doing (sekarang)
- **PAKAI** `editDrop:"FALSE"` di prod — nunggu admin-edit strict-mode (param-nya dibangun, tapi jangan di-FALSE-in dulu).
- Admin-edit-order + audit + surat-jalan 2-kolom — SHELF (`admin-edit-order-qty-dev-spec.md`).
- Ubah flow delivery existing — TIDAK, cuma tambah saklar.

## 7. Acceptance
- [ ] Ketiga flag absent / `"TRUE"` → drop/pickup/consumable +/- jalan (perilaku sekarang, backward-compat).
- [ ] `editDrop:"FALSE"` → drop aktual read-only, `ad`=`pd`, no +/- (returnable drop doang).
- [ ] `editPickup:"FALSE"` → pickup aktual read-only, `ap`=`pp`, no +/-.
- [ ] `editConsumable:"FALSE"` → consumable aktual read-only, `as`=`ps`/`ab`=`pb`, no +/-.
- [ ] Ketiga saklar INDEPENDEN — nyalain 1, yang lain gak kepengaruh.

---

**Referensi:** `admin-edit-order-qty-dev-spec.md` §3.1 (induk saklar edit) · ITEM_EXECUTION_LIST@DeliveryWorkspace(683) `saleField:ps`/`actualSaleField:as` · memory `project_admin_edit_order_strict_mode`.
