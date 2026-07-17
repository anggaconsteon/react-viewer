# Dev Spec (Flutter) — widget `CUSTOMER_OUTSTANDING_LIST` (lookup outstanding per customer)

**Tanggal:** 2026-07-09
**Buat:** Flutter dev (renderer — widget BARU). Konsumen: Admin/Supervisor/Owner surface "Cek Outstanding Customer". Mockup: `CustomerOutstandingMobile.jsx`.
**Sifat:** widget BARU (beda dari `OUTSTANDING_PANEL` yang priority-action di AdminHome — ini **LOOKUP**: cari customer, liat dia pegang apa aja).
**Dependency:** `asset-cache-lt-denorm-cf-dev-spec.md` (butuh `lt`/`ln` di asset_cache biar `lt◼client` jalan). Deploy CF + reconcile DULU.
**Prinsip:** 100% config-driven, nol hardcode. Semua label token/◆-seg dari config, warna dari theme.

---

## 0. Bentuk (dari mockup)

```
┌─────────────────────────────────────┐
│ Outstanding Customer      178 [total]│  ← title + grand total (Σ semua)
│ Saldo pinjaman per customer  di luar │
│ 🔍 Cari customer — mis. Toko Ahmad   │  ← search by nama
├─────────────────────────────────────┤
│ 7 customer punya outstanding          │
│ ┌─────────────────────────────────┐ │
│ │ Honda Tebet              42      │ │  ← nama + total (gede) pcs pinjam
│ │ Bengkel              pcs pinjam  │ │  ← tipe (stock_location.ty)
│ │ 💧Galon 30  🛢️12kg 12            │ │  ← chip per-item (icon+short+qty)
│ │ ⚠ tertua 47 hari            ›    │ │  ← aging tertua (warn kalo >threshold)
│ └─────────────────────────────────┘ │
│ ┌ Toko Ahmad ················ 26 ┐  │
│ ...                                  │
└─────────────────────────────────────┘
   tap kartu → BOTTOM SHEET detail:
   ┌─────────────────────────────────┐
   │ Toko Ahmad             26        │  ← nama + total pinjam
   │ Toko kelontong                   │
   │ RINCIAN PER JENIS                │
   │ 💧 Aqua Galon   tertua 34 hari  12│  ← per-item: icon·nama·aging·qty
   │ 🛢️ Gas 12kg     tertua 87 hari   8│
   │ 💬 Outstanding = dipinjam belum   │  ← doktrin note
   │    kembali. BUKAN hilang.         │
   │ [ Tutup ]                        │
   └─────────────────────────────────┘
```

## 1. Sumber data + agregasi

**Sumber:** `asset_cache` `lt◼client` (saldo di lokasi customer). `hideZero` skip `qt=0`.

**Agregasi (renderer):**
1. Query asset_cache `lt◼client` (+ qt≠0).
2. **Group by `lv`** (customer) → tiap customer.
3. Dalam customer, **group by `ii`** (item) → **sum `qt`** semua kondisi (`cd` full+empty digabung = total fisik dipinjam per jenis).
4. Per item: **oldest aging** = `max(now − t)` dari doc-doc item itu.
5. Customer **total** = Σ semua item. Customer **oldest** = max aging antar item.
6. **Join** `stock_location` (by lv) → nama (`ln`) + tipe (`ty`). **Join** `item` (by ii) → nama (`in`) + kategori (`ic`).
7. **Sort** customer by total desc. **Search** filter by nama.
8. **Grand total** = Σ semua customer.

## 2. Param (semua generik)

| param | fungsi | contoh |
|---|---|---|
| `type` | `CUSTOMER_OUTSTANDING_LIST` | |
| `vidtable`/`table` | asset_cache | `84214220504259//asset_cache` |
| `search` | filter | `lt◼client` |
| `hideZero` | skip qt 0 | `TRUE` |
| `groupField` | group customer | `lv` |
| `itemField` | group item | `ii` |
| `qtyField` | qty | `qt` |
| `condField` | kondisi (digabung) | `cd` |
| `ageField` | anchor aging (epoch) | `t` |
| `customerTable`/`customerKey`/`nameField`/`typeField` | join customer | `stock_location`/`lv`/`ln`/`ty` |
| `itemTable`/`itemKey`/`itemNameField`/`itemCatField` | join item | `item`/`ii`/`in`/`ic` |
| `itemIconMap` | (opsional) `key◼emoji★…` by `ii` atau `ic`; fallback dot | `returnable◼🛢️★…` |
| `dangerAge`/`warnAge` | ambang aging (hari) → warna theme | `30`/`14` |
| `sortBy` | `total` (desc) | `total` |
| `searchHint` | placeholder search | `Cari customer — mis. Toko Ahmad` |
| `title`/`subtitle` | header | `Outstanding Customer`/`Saldo pinjaman per customer` |
| `text` | label list ◆-seg (index) | lihat §3 |
| `detailText` | label detail sheet ◆-seg | lihat §3 |
| `emptyText` | list kosong / search nihil | `Belum ada outstanding` |
| `doctrineText` | note doktrin di detail | `Outstanding = dipinjam & belum kembali (saldo custody). BUKAN hilang.` |
| `closeText` | tombol tutup sheet | `Tutup` |

Warna aging (Kritis/Perhatian/Normal) = **theme** (3-tier, [[feedback_status_3tier_relabel]]) by dangerAge/warnAge. Warna item chip = theme kategori / itemIconMap, BUKAN config hex.

## 3. Label ◆-seg (renderer baca by index)

`text` (list): `total di luar◆pcs pinjam◆customer punya outstanding◆tertua◆hari`
- 0 grand-total label · 1 unit total per-customer · 2 count list · 3 prefix aging · 4 unit hari

`detailText` (sheet): `Rincian per jenis◆nyangkut◆total pinjam◆pcs`
- 0 header rincian · 1 suffix aging per-item · 2 label total · 3 unit qty

## 4. Resolved JSON (siap pasang di op1Screen — SETELAH renderer + lt denorm)

```json
{"type":"CUSTOMER_OUTSTANDING_LIST","vidtable":"20342033315492","table":"84214220504259//asset_cache","search":"lt◼client","hideZero":"TRUE","groupField":"lv","itemField":"ii","qtyField":"qt","condField":"cd","ageField":"t","customerTable":"84214220504259//stock_location","customerKey":"lv","nameField":"ln","typeField":"ty","itemTable":"84214220504259//item","itemKey":"ii","itemNameField":"in","itemCatField":"ic","dangerAge":30,"warnAge":14,"sortBy":"total","searchHint":"Cari customer — mis. Toko Ahmad","title":"Outstanding Customer","subtitle":"Saldo pinjaman per customer","text":"total di luar◆pcs pinjam◆customer punya outstanding◆tertua◆hari","detailText":"Rincian per jenis◆nyangkut◆total pinjam◆pcs","emptyText":"Belum ada customer dengan outstanding","doctrineText":"Outstanding = aset dipinjam & belum kembali (saldo custody). BUKAN hilang — status hilang cuma lewat investigasi & keputusan Supervisor.","closeText":"Tutup"}
```

## 5. Interaksi

- **Tap kartu → bottom sheet** (in-page overlay, BUKAN route) — per-item breakdown + doktrin + Tutup. Renderer handle sheet sendiri (config kasih label).
- Search live-filter by nama (client-side, data udah ke-load).

## 6. Data siap + GAP

| Butuh | Ada? | Catatan |
|---|---|---|
| customer + saldo + per-item + qty | ✅ (abis lt denorm) | asset_cache client + join |
| nama + tipe customer | ✅ | stock_location `ln`/`ty` (ty = Korporat/HoReCa/Retail/Rumah) |
| item name + kategori | ✅ | item `in`/`ic` |
| aging tertua | ✅ aproksimasi | `t` (movement terakhir). Presisi = field `since` (opsional, lihat lt-denorm spec §4) |
| **discrepancyCount per customer** | ❌ **DI-DROP v1** | `dp` sekarang per custody-check, bukan per-customer. Butuh agregasi investigation by customer — tambah nanti kalo perlu |

## 7. Acceptance

1. Widget nampil list customer yg punya outstanding (asset_cache client), sort by total desc.
2. Tiap kartu: nama · tipe · total pcs · chip per-item (nama+qty) · aging tertua (warna theme by ambang).
3. Search by nama → filter.
4. Tap → bottom sheet: rincian per-item (nama · aging · qty) + doktrin note + Tutup.
5. Grand total = Σ semua customer.
6. `hideZero` → customer/item saldo 0 gak nongol.
7. Nol string/warna baked — semua dari config/theme. Ganti `table`+field = reusable buat balance-per-location lain.
8. (v1) discrepancy di-drop; aging pake `t`.

---

**Referensi:** `CustomerOutstandingMobile.jsx` (mockup), `asset-cache-lt-denorm-cf-dev-spec.md` (dependency lt/ln), `OUTSTANDING_PANEL` (AdminHome — sibling priority-action, sumber sama), stock_location `ty`/`ln`, item `in`/`ic`. Page op1Screen (launcher + page) nyusul pas renderer ready — GUE pegang (config-ahead: jangan pasang sebelum renderer).
