# CHECKLIST_DYNAMIC — Bug distribusi per-slot (renderer Flutter)

Tanggal: 2026-08-21 · Untuk: dev Flutter (renderer `CHECKLIST_DYNAMIC`) · Status: BUG dari device test

Sisi sheet (config) **sudah benar & tidak perlu diubah** — dokumen ini murni soal renderer.

---

## 1. Ringkas

`CHECKLIST_DYNAMIC` sekarang menaruh **seluruh task sebagai satu string gabungan di slot pertama** (posisi `position`), dan mengisi slot sisa dengan `*`. Harusnya **1 task = 1 slot**, disebar ke `position, position+1, position+2, …`.

## 2. Observed (device test — visit `CLN-2026-000536`, template Pantry, 5 task)

```
ck1 = "Bersihkan sink & keran|Selesai~Cuci & rapikan peralatan|Selesai~Bersihkan…|…"   ← SEMUA task numpuk (join "~", task↔status "|")
ck2 = "*"
ck3 = "*"
ck4 = "*"
ck5 = "*"
ck6 = "*"
```

## 3. Expected (Pantry = 5 task)

```
ck1 = "Bersihkan sink & keran | Selesai"
ck2 = "Cuci & rapikan peralatan | Selesai"
ck3 = "<task ord 3> | <status>"
ck4 = "<task ord 4> | <status>"
ck5 = "<task ord 5> | <status>"
ck6 = "*"        ← slot sisa (Pantry cuma 5 task, slot ke-6 kosong)
```

- Pemisah task↔status = `" | "` (**spasi-pipe-spasi**), bukan `|` rapat.
- Tidak ada join `~` — tiap task berdiri sendiri di slot masing-masing.

## 4. Kontrak / mekanisme yang diharapkan

Komponen menempati blok posisi **`position` … `position + slots − 1`** (di page ini `position:12`, `slots:6` → posisi **12..17**).

1. Query `table` where `search` (template), sort `sortField` (`ord`).
2. Task ke-`k` (k = 1..N, urut `ord`) → **ditaruh di posisi `position + (k−1)`** → nilai form-slot posisi itu = `"<task> | <status>"`.
3. Slot sisa (`k` dari `N+1` s/d `slots`) → dikosongkan (lihat §6 soal nilai `*` vs `""`).
4. Kalau `N > slots` → tampilkan baris peringatan (kapasitas terlampaui), task berlebih tidak muat.

Tombol tutup meng-capture tiap slot posisi ke field-nya: `ck1◼◁12▷ ck2◼◁13▷ … ck6◼◁17▷`. Jadi kalau renderer menaruh task-k di posisi `12+(k−1)`, field `ck<k>` otomatis berisi task-k.

## 5. Sudah OK vs Belum

| Bagian | Status |
|---|---|
| Baca N task dari DB + render N baris | ✅ (task kebaca, worker bisa isi) |
| `slots`/`position` kebaca (slot sisa jadi `*`) | ✅ (renderer sudah kenal `slots`) |
| Capture per-field di tombol (ck1..ck6 kebentuk) | ✅ (sisi sheet) |
| **Distribusi 1 task 1 slot** | ❌ **INI YANG BUG** — masih dump gabungan di slot pertama |

Jadi tinggal 1 hal: **sebar hasil per-task ke posisi slot-nya masing-masing**, jangan gabung ke slot pertama.

## 6. Perlu dikonfirmasi

- **Nilai slot kosong** sekarang `"*"`. Ini intentional (marker) atau harusnya `""` (kosong)? Kalau `*` cuma sisa placeholder, mohon jadikan `""` biar report bersih.

## 7. Acceptance

- Template Pantry (5 task) → `ck1..ck5` masing-masing 1 task `"task | status"`, `ck6` kosong.
- Template Restroom (6 task) → `ck1..ck6` terisi semua (pas kapasitas).
- Template Work Area (4 task) → `ck1..ck4` isi, `ck5,ck6` kosong.
- Tidak ada lagi string gabungan `~` di field mana pun.

## 8. Referensi config sheet (sudah benar — JANGAN diubah)

Page `vertikaTeknoLokaciptaCleaningDynamic`:
- `CHECKLIST_DYNAMIC`: `"position":12, "slots":6, "search":"tmp◼{template}", "sortField":"ord", "taskField":"tsk"`
- Tombol tutup `updateEventRow`: `…⭘ck1◼◁12▷⭘ck2◼◁13▷⭘ck3◼◁14▷⭘ck4◼◁15▷⭘ck5◼◁16▷⭘ck6◼◁17▷`
- `slots:6` = jumlah task terbanyak antar template (Restroom = 6).
