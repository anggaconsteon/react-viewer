# CUSTODY_COUNT_SUBMIT — tutup gudang (`custodyCountSubmitClosing`)

**Status:** LIVE di app (tombol submit cek tutup gudang — warehouse C1)
**Dev spec:** ADA — `docs/warehouse-closing-check-c1-dev-spec.md`
**Widget tab:** row 245

## Buat apa

Varian `custodyCountSubmit` untuk **cek tutup (closing)** gudang: menyimpan hasil hitung akhir + membandingkan; kalau cocok lanjut ke satu jalur, kalau ada selisih ke jalur investigasi. Menuliskan event tutup.

## Tampilan

```
[     Konfirmasi Kembali (Tutup)    ]  ── tap ──▶ cocok? → selesai / selisih? → investigasi
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"CUSTODY_COUNT_SUBMIT","mode":"closing","vidtable":"20342033315492","checkTable":"84214220504259//vehicle_check","workforceTable":"84214220504259//workforce","vidField":"vid","nameField":"n","investigationTable":"84214220504259//investigation","action":"savesend","gpsPosition":"2","flag":"closing-check","addToEvent":"84214220504259//vehicle_check⭘tablevid◼20342033315492⭘…⭘cty◼closing⭘cst◼returned","matchRoute":"vertikaTeknoLokaciptaVehicleFeed","mismatchRoute":"vertikaTeknoLokaciptaInvestigation","text":"Konfirmasi Kembali","updateEventRow":""}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `CUSTODY_COUNT_SUBMIT` | — |
| `mode` | Wajib | `closing` — tahap tutup | `closing` |
| `vidtable` / `checkTable` / `workforceTable` | Wajib | ID tenant + sumber cek + pekerja | — |
| `vidField` / `nameField` | Wajib | Field id / nama checker | `vid` / `n` |
| `investigationTable` | Opsional | Tabel investigasi (kalau ada selisih) | `84214220504259//investigation` |
| `action` / `gpsPosition` / `flag` | Wajib | Aksi kirim / slot GPS / penanda | `savesend` / `2` / `closing-check` |
| `addToEvent` / `updateEventRow` | Wajib (salah satu) | Perintah tulis event tutup (DSL) | lihat contoh |
| `matchRoute` / `mismatchRoute` | Wajib | Tujuan kalau cocok / ada selisih | `…VehicleFeed` / `…Investigation` |
| `text` | Wajib | Label tombol | `Konfirmasi Kembali` |

## Posisi field gabungan

`text` = label tombol. Dua jalur keluar: cocok → `matchRoute`, selisih → `mismatchRoute` (investigasi).

## Tips & catatan

- Beda dari versi buka (`custodyCountSubmitOpening` 244): tutup punya **percabangan cocok/selisih** + tabel investigasi.
- Spec: `docs/warehouse-closing-check-c1-dev-spec.md`.
