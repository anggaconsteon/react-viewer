# CUSTODY_COUNT_SUBMIT — buka gudang (`custodyCountSubmitOpening`)

**Status:** LIVE di app (tombol submit cek buka gudang — warehouse O1)
**Dev spec:** ADA — `docs/warehouse-opening-check-o1-dev-spec.md`
**Widget tab:** row 244

## Buat apa

Varian `custodyCountSubmit` untuk **cek buka (opening)** gudang: menyimpan hasil hitung + mencatat event pembukaan (siapa checker, kapan), lalu lanjut. Menuliskan siapa penanggung jawab muat.

## Tampilan

```
[      Konfirmasi Muat (Buka)      ]  ── tap ──▶ catat opening → lanjut
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_COUNT_SUBMIT","mode":"opening","vidtable":"20342033315492","checkTable":"84214220504259//vehicle_check","workforceTable":"84214220504259//workforce","vidField":"vid","nameField":"n","writeCond":"","action":"savesend","gpsPosition":"2","flag":"opening-check","addToEvent":"84214220504259//vehicle_check⭘tablevid◼20342033315492⭘…⭘cty◼opening⭘cst◼loaded","updateEventRow":"","route":"vertikaTeknoLokaciptaVehicleFeed","text":"Konfirmasi Muat","warehouseId":"{warehouseId}"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_COUNT_SUBMIT` | — |
| `mode` | Wajib | `opening` — tahap buka | `opening` |
| `vidtable` / `checkTable` / `workforceTable` | Wajib | ID tenant + sumber cek + pekerja | — |
| `vidField` / `nameField` | Wajib | Field id / nama checker | `vid` / `n` |
| `writeCond` | Opsional | Syarat tulis | `""` |
| `action` / `gpsPosition` / `flag` | Wajib | Aksi kirim / slot GPS / penanda | `savesend` / `2` / `opening-check` |
| `addToEvent` / `updateEventRow` | Wajib (salah satu) | Perintah tulis event buka (DSL) | lihat contoh |
| `route` | Wajib | Halaman tujuan setelah submit | `…VehicleFeed` |
| `text` | Wajib | Label tombol | `Konfirmasi Muat` |
| `warehouseId` | Opsional | Id gudang | `{warehouseId}` |

## Posisi field gabungan

`text` = label tombol (segmen `◆` bila ada).

## Tips & catatan

- Versi driver (per kendaraan) = `custodyCountSubmit` (214); versi tutup = `custodyCountSubmitClosing` (245).
- Spec: `docs/warehouse-opening-check-o1-dev-spec.md`.
