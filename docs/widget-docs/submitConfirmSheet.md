# SUBMIT_CONFIRM_SHEET (`submitConfirmSheet`)

**Status:** LIVE di app (lembar konfirmasi submit pengiriman — driver runtime P11)
**Dev spec:** ADA — `docs/driver-submit-confirm-sheet-dev-spec.md`
**Widget tab:** row 222

## Buat apa

Lembar konfirmasi sebelum mencatat hasil pengiriman: merangkum total drop/pickup dari form, menjelaskan konsekuensi (clean / partial / opportunistic), lalu tombol "Konfirmasi & Catat Movement". Membaca data dari form yang sedang diisi (`source:"{FORM}"`).

## Tampilan

```
┌─ Konfirmasi Pengiriman ────────────┐
│ Total Drop 12 · Total Pickup 4     │
│ Clean execution. Semua item sesuai │
│ [ Cek Lagi ]  [ Konfirmasi & Catat]│
└────────────────────────────────────┘
```

## Contoh JSON

(resolved live — dari template Widget row 222)

```json
{"type":"SUBMIT_CONFIRM_SHEET","source":"{FORM}","confirmEvent":"","text":"Konfirmasi Pengiriman◆Konfirmasi & Catat Movement◆Cek Lagi◆Total Drop◆Total Pickup◆Clean execution. Semua item sesuai rencana. Movement DROP/PICKUP akan dicatat.◆Partial execution akan dicatat. Sisa item yang kurang akan trigger follow-up coordination dengan admin.◆Clean + opportunistic pickup. Drop sesuai plan. Customer balikin lebih banyak — outstanding berkurang lebih banyak.◆Tanda tangan◆Catatan◆Foto◆Partial◆0◆Opportunistic◆extra"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `SUBMIT_CONFIRM_SHEET` | — |
| `source` | Wajib | Sumber data ringkasan — `{FORM}` = baca dari form aktif | `{FORM}` |
| `confirmEvent` | Opsional | Event tambahan saat konfirmasi | `""` |
| `text` | Wajib | Semua label + narasi kondisi (banyak segmen `◆`) | lihat tabel posisi |

## Posisi field gabungan

`text` — segmen `◆` (dari contoh live): judul / tombol konfirmasi / tombol cek-lagi / label Total Drop / label Total Pickup / narasi clean / narasi partial / narasi opportunistic / label tanda-tangan / label catatan / label foto / label Partial / angka default / label Opportunistic / label extra. Nol string hardcode di aplikasi — semua dari `text`.

## Tips & catatan

- Meringkas otomatis dari form yang sedang diisi (`source:"{FORM}"`) — driver tinggal cek.
- Narasi berubah sesuai kondisi eksekusi (clean/partial/opportunistic).
- Spec: `docs/driver-submit-confirm-sheet-dev-spec.md`.
