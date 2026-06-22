# Firestore Schema — Consteon Platform

> **Stack**: Flutter + Firebase Firestore (NoSQL)
> **Arsitektur**: Multi-tenant SaaS, single deployment, multiple tenants
> **Prinsip utama**: Movement Ledger adalah source of truth. STOCK_CACHE adalah derived state — tidak pernah ditulis langsung oleh aplikasi.

---

## Daftar Collection

| Collection | Tipe | Keterangan |
|---|---|---|
| `tenants` | core | Root isolation boundary per tenant |
| `users` | core | Semua actor operasional |
| `items` | core | Definisi produk/aset |
| `stock_locations` | core | Semua titik stok: gudang, vehicle, client |
| `movements` | append-only | Ledger utama — source of truth |
| `stock_cache` | derived | Stok terkini per titik, ditulis Cloud Function |
| `tasks` | core | Siklus eksekusi pengiriman/pickup |
| `vehicle_checks` | append-only | Opening & closing check kendaraan |
| `investigations` | core | Investigasi & resolusi discrepancy |
| `evidence` | append-only | Foto, GPS, tanda tangan, catatan |

---

## TENANTS

Root isolation boundary. Semua collection lain scope ke `tenant_id` ini.

```
tenant_id        string    PK
name             string
status           string    active | suspended | trial
created_at       timestamp
```

---

## USERS

Semua actor operasional platform. Satu user = satu role = satu runtime.

```
user_id          string    PK  (Firebase UID)
tenant_id        string    FK → tenants
name             string
role             string    driver | checker | admin | supervisor
active           boolean
```

> **Aturan**: satu role tidak boleh lintas runtime. Driver tidak bisa akses Admin Runtime, dst.

---

## ITEMS

Definisi produk yang bergerak di platform. Hanya `returnable` yang punya outstanding tracking.

```
item_id              string    PK  e.g. galon | tabung_12kg | tabung_3kg
tenant_id            string    FK → tenants
name                 string    e.g. Galon Air 19L
category             string    returnable | consumable
trackable_conditions string[]  e.g. ["full", "empty"]
unit                 string    pcs | kg
active               boolean
```

> **Aturan**: `trackable_conditions` menentukan apakah stock_cache di-split per kondisi. Item tanpa kondisi (consumable) cukup satu entry.

---

## STOCK_LOCATIONS

**Collection kunci arsitektur.** Gudang, vehicle, dan client bukan tiga collection terpisah — semuanya adalah `stock_location` dengan `location_type` berbeda. Ini yang memungkinkan query "semua stok galon di seluruh titik" dalam satu Firestore query.

```
location_id           string    PK  e.g. WH-bintaro | VEH-B1234XY | CLT-honda-bintaro
tenant_id             string    FK → tenants
location_type         string    warehouse | vehicle | client
name                  string    e.g. Gudang Bintaro | B-1234-XY | Honda Bintaro
address               string?   warehouse dan client; null untuk vehicle
geo                   GeoPoint? koordinat GPS
home_warehouse_id     string?   vehicle only — opsional karena vehicle bisa lintas gudang
current_driver_id     string?   vehicle only — driver aktif hari ini
status                string    active | inactive
```

> **Aturan**: `client` di sini adalah titik stok fisik (tempat barang berada), bukan entitas bisnis. Outstanding client = stok yang ada di tangan client tersebut.

---

## MOVEMENTS

**Append-only ledger. Source of truth platform.** Tidak pernah diupdate atau dihapus. Koreksi hanya via dokumen `ADJUSTMENT` baru oleh Supervisor.

```
movement_id           string    PK  (auto-ID Firestore)
tenant_id             string    FK → tenants
from_location_id      string?   FK → stock_locations  — null untuk GENESIS
to_location_id        string?   FK → stock_locations  — null untuk LOSS/DAMAGE
item_id               string    FK → items
condition             string    full | empty
movement_type         string    GENESIS | DROP | PICKUP | INTERNAL |
                                SALE | DAMAGE | LOST | ADJUSTMENT
qty                   number    selalu positif; arah ditentukan movement_type
driver_id             string?   FK → users
task_id               string?   FK → tasks — null untuk GENESIS/ADJUSTMENT
occurred_at           timestamp ⚠️ set di device saat event terjadi (kebenaran kronologis)
synchronized_at       timestamp set server saat dokumen masuk Firestore
emitter_runtime       string    DRIVER | VEHICLE | SUPERVISOR
notes                 string?   catatan lapangan opsional
```

### Contoh movement

**DROP — driver antar 5 galon isi ke Honda Bintaro:**
```
from_location_id : VEH-B1234XY
to_location_id   : CLT-honda-bintaro
item_id          : galon
condition        : full
movement_type    : DROP
qty              : 5
```

**PICKUP — driver ambil 5 galon kosong dari Honda Bintaro:**
```
from_location_id : CLT-honda-bintaro
to_location_id   : VEH-B1234XY
item_id          : galon
condition        : empty
movement_type    : PICKUP
qty              : 5
```

**INTERNAL — transfer galon isi dari Gudang Bintaro ke Vehicle:**
```
from_location_id : WH-bintaro
to_location_id   : VEH-B1234XY
item_id          : galon
condition        : full
movement_type    : INTERNAL
qty              : 30
```

### Aturan kritis

- `occurred_at` **wajib diset di device** saat event terjadi, bukan saat sync.
- Offline movement tetap valid selama `occurred_at` benar.
- `occurred_at` ≠ `synchronized_at` — jangan pernah disamakan.
- Dokumen ini **tidak boleh diupdate atau dihapus** oleh runtime apapun.
- Koreksi hanya via movement baru dengan `movement_type: ADJUSTMENT` oleh Supervisor.

---

## STOCK_CACHE

**Derived state. Cloud Function write only.** Tidak ada runtime Flutter yang boleh write ke collection ini. Setiap movement baru masuk → Cloud Function trigger → update `qty` di `from_location` (kurang) dan `to_location` (tambah).

```
cache_id              string    PK  composite: {tenant_id}__{location_id}__{item_id}__{condition}
tenant_id             string    FK → tenants
location_id           string    FK → stock_locations
location_type         string    warehouse | vehicle | client  (denormalized untuk filter cepat)
item_id               string    FK → items
condition             string    full | empty
qty                   number    stok terkini di titik ini untuk kombinasi item + kondisi ini
last_movement_id      string    movement terakhir yang trigger update ini
last_movement_at      timestamp occurred_at dari movement terakhir
last_computed_at      timestamp kapan Cloud Function terakhir update dokumen ini
```

### Query patterns

**Semua stok galon di seluruh titik (untuk dashboard supervisor):**
```
where('tenant_id', '==', tenantId)
.where('item_id', '==', 'galon')
```
Hasilnya: semua baris per (location × condition). Grouping di Flutter.

**Stok di semua warehouse saja:**
```
where('tenant_id', '==', tenantId)
.where('item_id', '==', 'galon')
.where('location_type', '==', 'warehouse')
```

**Outstanding satu client:**
```
where('tenant_id', '==', tenantId)
.where('location_id', '==', 'CLT-honda-bintaro')
.where('item_id', '==', 'galon')
```
Hasilnya: dua dokumen — `condition: full` dan `condition: empty`.

### Aturan kritis

- `qty` untuk `location_type = client` adalah **outstanding** — berapa unit ada di tangan client yang belum dikembalikan.
- Cache ini **tidak pernah null** setelah hydration awal — tampilkan stale, jangan kosong.
- Tidak ada Flutter app yang write ke sini langsung, termasuk Admin Runtime.

---

## TASKS

Siklus eksekusi pengiriman dan pickup. `completed` ≠ `validated` — task bisa selesai tapi rekonsiliasi belum tuntas.

```
task_id               string    PK  e.g. TASK-20240612-001
tenant_id             string    FK → tenants
client_location_id    string    FK → stock_locations (location_type = client)
origin_warehouse_id   string    FK → stock_locations (location_type = warehouse)
vehicle_id            string    FK → stock_locations (location_type = vehicle)
driver_id             string    FK → users
task_type             string    delivery | pickup_return
execution_state       string    draft | assigned | ready | on_delivery |
                                completed | validated | closed
items                 array     [{item_id, condition, planned_qty, actual_qty}]
scheduled_date        string    YYYY-MM-DD
created_by            string    FK → users (admin)
created_at            timestamp
completed_at          timestamp? set saat driver submit
```

---

## VEHICLE_CHECKS

Append-only. Opening & closing check kendaraan. `items_expected` selalu server-computed — client hanya submit aktual fisik.

```
check_id              string    PK  e.g. CHK-VEH-B1234XY-20240612
tenant_id             string    FK → tenants
vehicle_location_id   string    FK → stock_locations (location_type = vehicle)
warehouse_location_id string    FK → stock_locations (location_type = warehouse)
checker_id            string    FK → users (role = checker)
check_type            string    opening | closing
check_date            string    YYYY-MM-DD
items_physical        array     [{item_id, condition, qty_physical}]
items_expected        array?    closing only — server-computed dari movement history
reconciliation_state  string?   closing only: matched | discrepancy_detected
discrepancies         array?    [{item_id, condition, expected, actual, delta}]
occurred_at           timestamp waktu pengecekan fisik
```

> **Aturan**: `warehouse_location_id` wajib diisi karena vehicle bisa balik ke gudang berbeda dari tempat dia load. Tanpa ini stock_cache gudang tidak bisa diupdate dengan benar.

---

## INVESTIGATIONS

Dibuka oleh Vehicle Runtime saat `reconciliation_state = discrepancy_detected`. Diselesaikan hanya oleh Supervisor Runtime.

```
investigation_id      string    PK
tenant_id             string    FK → tenants
source_check_id       string?   FK → vehicle_checks
source_movement_id    string?   FK → movements
investigation_state   string    pending_review | under_investigation |
                                clarification_requested | resolved | closed
resolution_type       string?   clean | with_adjustment |
                                damage_confirmed | loss_confirmed
supervisor_id         string    FK → users (role = supervisor)
opened_at             timestamp
resolved_at           timestamp?
```

> **Aturan**: discrepancy ≠ lost. Status tidak boleh langsung jump ke `loss_confirmed` tanpa supervisor resolution. Subcollection `/investigations/{id}/events` untuk audit trail per investigasi.

---

## EVIDENCE

Append-only. Foto, GPS, tanda tangan, dan catatan yang melekat pada movement, task, atau investigasi.

```
evidence_id           string    PK
tenant_id             string    FK → tenants
movement_id           string?   FK → movements
task_id               string?   FK → tasks
investigation_id      string?   FK → investigations
evidence_type         string    photo | gps | signature | notes
storage_path          string?   Firebase Storage path (untuk photo/signature)
location              GeoPoint? untuk GPS evidence
content               string?   untuk notes evidence
uploaded_by           string    FK → users
occurred_at           timestamp
```

---

## Ringkasan relasi

```
TENANTS ──────────────────── semua collection (tenant isolation)

STOCK_LOCATIONS ◄──── MOVEMENTS        (from_location_id + to_location_id)
                ◄──── TASKS            (client_location_id + origin_warehouse_id + vehicle_id)
                ◄──── VEHICLE_CHECKS   (vehicle_location_id + warehouse_location_id)
                ◄──── STOCK_CACHE      (location_id)

MOVEMENTS ──────────► STOCK_CACHE      (via Cloud Function, triggered on write)
MOVEMENTS ◄────────── TASKS            (task produces movements)
MOVEMENTS ◄────────── EVIDENCE         (movement has evidence)

VEHICLE_CHECKS ─────► INVESTIGATIONS   (discrepancy triggers investigation)
MOVEMENTS ──────────► INVESTIGATIONS   (movement triggers investigation)
INVESTIGATIONS ◄───── EVIDENCE         (investigation gathers evidence)
```

---

## Aturan global

| # | Aturan |
|---|---|
| 1 | Setiap dokumen wajib punya `tenant_id`. Firestore Security Rules enforce query harus include `where tenant_id == currentUser.tenantId`. |
| 2 | `movements` dan `vehicle_checks` dan `evidence` adalah append-only. Tidak ada update, tidak ada delete. |
| 3 | `stock_cache` hanya ditulis oleh Cloud Function. Tidak ada runtime Flutter yang write langsung. |
| 4 | `occurred_at` selalu diset di device saat event terjadi. Bukan saat sync. |
| 5 | `occurred_at` ≠ `synchronized_at`. Offline movement tetap valid. |
| 6 | Outstanding stok = `qty` di `stock_cache` untuk `location_type = client`. Tidak ada field outstanding yang disimpan manual. |
| 7 | Koreksi movement hanya via dokumen `ADJUSTMENT` baru oleh Supervisor. Tidak ada edit dokumen lama. |
| 8 | `items_expected` di `vehicle_checks` selalu server-computed. Client hanya submit aktual fisik. |