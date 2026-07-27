# WORKSPACE_HEADER (`workspaceHeader`)

**Status:** LIVE di app (header halaman kerja generik — dipakai banyak halaman)
**Dev spec:** ADA — `docs/driver-delivery-workspace-p11-dev-spec.md` (WORKSPACE_HEADER)
**Widget tab:** row 226

## Buat apa

Header halaman kerja serba-guna: judul + info konteks dari 1 dokumen (nama + alamat) + tombol kembali. Dipakai di banyak halaman (delivery workspace, titik absensi, invoice, dll.) sebagai header standar.

## Tampilan

```
┌────────────────────────────────────┐
│ ←   Toko Budi                      │  ← titleField + backRoute
│     Jl. Merdeka No. 5              │  ← addressField
└────────────────────────────────────┘
```

## Contoh JSON

(contoh live — halaman titik absensi)

```json
{"type":"WORKSPACE_HEADER","vidtable":"20342033315492","table":"","search":"","idField":"","titleField":"","addressField":"","backRoute":"vertikaTeknoLokaciptaAdminHome","text":"Titik Absensi◆Atur titik & QR"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `WORKSPACE_HEADER` | — |
| `vidtable` | otomatis (baked) | ID koneksi tenant | `20342033315492` |
| `table` / `search` | Opsional (kosong = header statis) | Sumber 1 dokumen konteks | `84214220504259//task` / `tnm◼{taskVid}` |
| `idField` | Opsional | Field id dokumen | `tnm` |
| `titleField` / `addressField` | Opsional | Field judul / alamat yang ditampilkan | `kn` / `al` |
| `backRoute` | Wajib | Halaman tujuan tombol kembali | `…AdminHome` |
| `text` | Wajib | Judul + subjudul statis (dipisah `◆`) | `Titik Absensi◆Atur titik & QR` |

## Posisi field gabungan

`text` dipisah `◆` (judul / subjudul). Kalau `table`/`search` kosong → header pakai `text` saja (statis); kalau diisi → tampilkan `titleField`/`addressField` dari dokumen.

## Tips & catatan

- Serba-guna: kosongkan `table`/`search` untuk header statis, atau isi untuk header terikat data (mis. nama customer di halaman invoice).
- Versi dengan indikator langkah = `workspaceHeaderStep` (252).
- Spec: `docs/driver-delivery-workspace-p11-dev-spec.md`.
