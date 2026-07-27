# TIMELINE (`timeline`)

**Status:** Config siap — cek dev (varian aktif di produksi = `timelinePeriodic` / `timelineLedger`; ini timeline dasar)
**Widget tab:** row 180

## Buat apa

Daftar kejadian berbentuk garis waktu (timeline) yang dibaca dari koleksi data — tiap baris satu kejadian, terurut waktu. Berbeda dengan `textVariant` variant `history` (yang isinya teks jadi di satu field), `TIMELINE` menarik langsung dari tabel.

## Tampilan

```
●  Kejadian terbaru
│  detail…
●  Kejadian sebelumnya
│  detail…
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"TIMELINE","variant":"ledger","flag":"riwayat","vidtable":"20342033315492","table":"84214220504259//event","text":"Riwayat Kegiatan","search":"sv◼{sv}","sort":"t◼desc"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `TIMELINE` | — |
| `variant` | Wajib | Mode tampilan/perilaku timeline | `[?] nilai valid belum terdokumentasi — cek dev (mis. ledger)` |
| `flag` | Wajib | Penanda untuk backend | `riwayat` |
| `vidtable` / `table` | Wajib | Sumber data | `84214220504259//event` |
| `text` | Wajib | Judul/label timeline | `Riwayat Kegiatan` |
| `search` | Wajib | Filter data (DSL) | `sv◼{sv}` |
| `sort` | Wajib | Urutan: `field◼arah` | `t◼desc` |

## Posisi field gabungan

`text` — `[?]` jumlah/urutan segmen belum terdokumentasi di dict; template hanya menampilkan 1 nilai judul. Konfirmasi ke dev kalau butuh multi-segmen.

## Tips & catatan

- Keluarga timeline: `timeline` (180, dasar), `timelinePeriodic` (196, dengan pemilih periode 7h/30h/bulan), `timelineLedger` (280, buku besar mutasi ber-grup). Yang dipakai aktif di halaman patroli = `timelinePeriodic`/`timelineLedger`.
- `[?]` Nilai `variant` yang dikenali renderer belum ada spec tertulis untuk widget dasar ini — konfirmasi ke dev.
