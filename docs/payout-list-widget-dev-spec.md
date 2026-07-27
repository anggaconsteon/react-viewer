# PAYOUT_LIST — multi-select list ber-nominal buat tandai lunas (Dev Spec)

**Tanggal:** 2026-07-24
**Buat:** dev Flutter (renderer — TYPE BARU, renderer duluan, config nyusul)
**Status:** APPROVED — **MASUK PAKET BUILD** (user 2026-07-24: "gua buat payout juga aja"; GROUP_PICKER src:table = interim sampai renderer ini live)
**Konteks / Konsumen pertama:** page `RewardPayout@1026` op1Screen (fitur reward posting, spec induk `docs/sales-freelance-reward-dev-spec.md`). Interim live = `GROUP_PICKER src:"table"` (nama doang, nol nominal).
**Referensi:** mockup `src/component/SalesFreelanceV1.jsx` (PayoutScreen) · dict tab `reward_cache` · `docs/group-picker-widget-dev-spec.md` (engine baca table sama).

---

## 1. Kenapa

Admin akhir bulan milih worker yang mau ditransfer → tandai lunas bulk. Yang dia butuh LIHAT: siapa yang belum dibayar, berapa batch, **berapa rupiah** per orang + total terpilih. GROUP_PICKER cuma bisa nama → salah pilih/salah transfer gampang. List HANYA berisi yang belum dibayar (search `rd◼1`) — yang udah lunas hilang sendiri (CF reset `rd`).

## 2. Konsep

Satu widget self-contained: keyed table read (engine sama LIST_CARD/tablePicker) → render list checkbox + nominal per item (`count × rate`, dihitung renderer) + select-all + ringkasan total → emit value terpilih `|`-join ke form position. Submit tetap tombol RBT existing di bawahnya (widget wiring-agnostic, cuma nulis posisi — pola GROUP_PICKER).

## 3. Kontrak field

```json
{
  "type": "PAYOUT_LIST",
  "vidtable": "20342033315492",
  "table": "84214220504259//reward_cache",
  "search": "rd◼1",
  "labelField": "cn",
  "subField": "hn",
  "countField": "bt",
  "valueField": "cv",
  "rate": "[RATE]",
  "sortField": "cn",
  "sortDir": "asc",
  "position": 18,
  "labelPosition": 19,
  "totalPosition": 20,
  "selectAll": true,
  "joinSep": "|",
  "text": "[TEXT]"
}
```

| field | isi |
|---|---|
| `vidtable`/`table`/`search` | keyed read, semantik search existing (eq-only). Konsumen pertama: `rd◼1` = belum dibayar |
| `labelField`/`subField` | baris-1 (nama) / baris-2 (handle). subField kosong = 1 baris |
| `countField` | field angka satuan (batch siap). Ditampilkan mentah + dipakai hitung nominal |
| `valueField` | yang di-emit (cv). Kosong = doc id |
| `rate` | **rupiah per satuan — STRING dari config sheet** (tarif per tenant, bukan hardcode). Nominal item = `countField × rate`, format `id-ID` di renderer. `rate` kosong/`0` → kolom nominal disembunyikan (widget tetap jalan buat case non-uang) |
| `position` | emit value terpilih `joinSep`-join (buat broadcast `wl◼◁18▷`) |
| `labelPosition` | opsional — nama terpilih `joinSep`-join (buat isi dialog konfirmasi) |
| `totalPosition` | opsional — TOTAL nominal terpilih (angka polos, mis. `5000`) buat ditampilin di konfirmasi/event |
| `selectAll` | **PARAMETER on/off (user 2026-07-24)**: `true` = tampil baris "Pilih semua (N)" (label `text[2]`), `false`/absen = pilih satu-satu doang. Di sheet = placeholder `[SELECTALL]` quote-eat (boolean, bukan string) |
| `sortField`/`sortDir` | urutan list |
| `text` | ◆-segmen §3b — nol string hardcode Flutter |

### 3b. Kontrak `text` (◆-segmen, by index)

| Idx | Isi | Contoh konsumen pertama |
|---|---|---|
| 0 | judul list | `Belum Dibayar` |
| 1 | empty state | `Semua worker sudah ditransfer` |
| 2 | label select-all (`{n}` = jumlah) | `Pilih semua ({n})` |
| 3 | template counter terpilih | `{n} dipilih · {total}` |
| 4 | template baris nominal (`{c}`=count, `{nom}`=nominal) | `{c} batch siap · {nom}` |
| 5 | label ringkasan atas (`{total}`=total semua, `{n}`=jml worker) | `Total belum ditransfer {total} · {n} worker` |

## 4. Contoh resolved (konsumen pertama)

```json
{"type":"PAYOUT_LIST","vidtable":"20342033315492","table":"84214220504259//reward_cache","search":"rd◼1","labelField":"cn","subField":"hn","countField":"bt","valueField":"cv","rate":"1000","sortField":"cn","sortDir":"asc","position":18,"labelPosition":19,"totalPosition":20,"selectAll":true,"joinSep":"|","text":"Belum Dibayar◆Semua worker sudah ditransfer◆Pilih semua ({n})◆{n} dipilih · {total}◆{c} batch siap · {nom}◆Total belum ditransfer {total} · {n} worker"}
```

Centang Ratna (3 batch) + Dedi (5 batch), rate 1000 → `◁18▷`=`85924392055168|60181816889090`, `◁19▷`=`Ratna|Dedi K.`, `◁20▷`=`8000`.

## 4b. UI / Layout (acuan mockup PayoutScreen)

```
┌─ Belum Dibayar ────────────────────────────┐
│ Total belum ditransfer Rp 15.000 · 5 worker│  text[5]
│ ☑ Pilih semua (5)          2 dipilih · Rp 8.000
│ ┌──────────────────────────────────────┐  │
│ │ ☑ Ratna                              │  │  labelField
│ │   @ratna_official22                  │  │  subField
│ │   3 batch siap · Rp 3.000            │  │  text[4]
│ ├──────────────────────────────────────┤  │
│ │ ☑ Dedi K.  · @dedi.bawangjaya        │  │
│ │   5 batch siap · Rp 5.000            │  │
│ ├──────────────────────────────────────┤  │
│ │ ☐ Bilal S. · 1 batch siap · Rp 1.000 │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
[ Tandai Lunas ]   ← RBT existing terpisah, baca ◁18▷/◁19▷/◁20▷
```

## 6. Sheet-side (builder, SETELAH renderer live — jangan config-ahead, type baru)

1. Widget row baru `payoutList` (template semua field placeholder; `rate` dari helper cell config tenant).
2. Swap `RewardPayout@1028`: B `groupPicker`→`payoutList`, D + helper baru. Emit positions SAMA (18/19 udah kepakai) + `totalPosition` 20 → konfirmasi RBT bisa tampilkan `◁20▷`.
3. GROUP_PICKER src:table di page ini pensiun (GROUP_PICKER tetep hidup buat broadcast).

## 7. Deliverable dev (Flutter)

1. Renderer `PAYOUT_LIST` per §3-§4b: keyed read (engine existing), checkbox multi, select-all, nominal `count×rate` format `id-ID`, emit position/labelPosition/totalPosition tiap perubahan seleksi.
2. `rate` kosong → mode non-uang (hidden nominal) — jangan crash.
3. Search 0 doc → empty state text[1].
4. Nol string/angka hardcode — semua dari config.

## 9. Ringkasan kerjaan

| Bagian | Siapa | Status |
|---|---|---|
| Renderer PAYOUT_LIST | dev Flutter | PROPOSED |
| Widget row + swap @1028 | builder | NUNGGU renderer |

## 10. Not Doing

- **Transfer / integrasi pembayaran** — tetap manual di luar app.
- **Hitung nominal di CF** — `rate` config sheet, kali-kalian di renderer; CF gak nyentuh uang.
- **Filter/tab periode** — list = snapshot `rd◼1` sekarang. Riwayat = LIST_CARD log existing.

## 11. Acceptance

- [ ] List cuma isi `rd◼1`; abis payout (CF reset rd) → item hilang setelah refresh.
- [ ] Nominal per item = `bt × rate` format id-ID; total ringkasan + total terpilih bener.
- [ ] Select-all / uncheck per item → `◁18▷` `|`-join update; `◁19▷` nama; `◁20▷` angka total polos.
- [ ] `selectAll:false` → baris pilih-semua hilang, sisanya normal.
- [ ] `rate` kosong → nominal hilang, sisanya normal.
- [ ] Ganti `rate` di sheet → nominal berubah tanpa deploy.

## 12. Asumsi & risiko

- [ ] `bt` di `reward_cache` = Number (dict) — renderer toleran kalau string angka.
- [ ] `totalPosition` angka polos (bukan formatted) biar bisa dipakai di event/DSL tanpa parsing locale.

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` (induk) · dict tab `reward_cache` · mockup SalesFreelanceV1.jsx PayoutScreen.
