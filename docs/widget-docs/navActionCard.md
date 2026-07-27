# NAV_ACTION_CARD (`navActionCard`)

**Status:** LIVE di app (kartu aksi navigasi bergerbang — driver runtime)
**Dev spec:** ADA — `docs/driverhome-p4-dev-spec.md`
**Widget tab:** row 205

## Buat apa

Kartu tombol besar untuk lanjut ke satu aksi, yang **berubah status "siap / belum"** tergantung prasyarat data. Dipakai di beranda driver sebagai pintu masuk ke tahap berikutnya (mis. "Mulai Rute") yang baru aktif kalau syarat terpenuhi.

## Tampilan

```
┌────────────────────────────────────┐
│ 🚚 Mulai Rute            [ SIAP ]  │  ← ikon berubah saat ready
│    Tap untuk mulai antar            │
└────────────────────────────────────┘
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"NAV_ACTION_CARD","route":"vertikaTeknoLokaciptaTaskFeed","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"dv◼{userVid}","ready":"cst◼custody_confirmed","gateTable":"84214220504259//vehicle_check","gateSearch":"dv◼{userVid}","icon":"navigation","iconReady":"check_circle","text":"Mulai Rute◆Tap untuk mulai antar◆Selesaikan muatan dulu"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `NAV_ACTION_CARD` | — |
| `route` | Wajib | Halaman tujuan saat di-tap | `…TaskFeed` |
| `vidtable` / `table` / `search` | Wajib | Sumber data | `dv◼{userVid}` |
| `ready` | Wajib | Syarat "siap" (mis. status tertentu) | `cst◼custody_confirmed` |
| `gateTable` / `gateSearch` | Opsional | Pengecek gerbang tampil | `dv◼{userVid}` |
| `icon` / `iconReady` | Opsional | Ikon belum-siap / siap | `navigation` / `check_circle` |
| `text` | Wajib | Judul + subjudul siap + subjudul belum (dipisah `◆`) | lihat contoh |

## Posisi field gabungan

`text` dipisah `◆` (judul / teks saat siap / teks saat belum siap — lihat spec).

## Tips & catatan

- Beda dari `driverStopCard` (kartu per titik) — `navActionCard` = 1 tombol aksi bergerbang.
- Kondisi `ready` menentukan tampilan siap/belum + apakah tombol aktif.
- Spec: `docs/driverhome-p4-dev-spec.md`.
