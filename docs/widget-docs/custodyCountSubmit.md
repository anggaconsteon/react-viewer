# CUSTODY_COUNT_SUBMIT (`custodyCountSubmit`)

**Status:** LIVE di app (tombol simpan hasil hitung custody — driver runtime P6)
**Dev spec:** ADA — `docs/driver-custody-count-p6-dev-spec.md`
**Widget tab:** row 214

## Buat apa

Tombol untuk menyimpan hasil hitung custody (dari `custodyCountList`) lalu lanjut ke halaman berikutnya (reveal selisih). Menulis angka hitung ke field yang ditentukan.

## Tampilan

```
[         Simpan Hitungan         ]  ── tap ──▶ simpan → reveal
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_COUNT_SUBMIT","vidtable":"20342033315492","table":"84214220504259//vehicle_check","search":"vv◼{vehicleId}⭘cty◼opening","writeField":"ac","route":"vertikaTeknoLokaciptaCustodyReveal","text":"Simpan Hitungan"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_COUNT_SUBMIT` | — |
| `vidtable` / `table` / `search` | Wajib | Sasaran tulis custody | `vv◼{vehicleId}⭘cty◼opening` |
| `writeField` | Wajib | Field tempat menyimpan hasil hitung | `ac` |
| `route` | Wajib | Halaman tujuan setelah simpan | `…CustodyReveal` |
| `text` | Wajib | Label tombol | `Simpan Hitungan` |

## Posisi field gabungan

Tidak ada.

## Tips & catatan

- Menyimpan hasil dari `custodyCountList` (210) ke `writeField` → lanjut `custodyReveal` (213).
- Versi gudang buka/tutup = `custodyCountSubmitOpening` (244) / `custodyCountSubmitClosing` (245).
