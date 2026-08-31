# Reward — doc STATS global tenant (CF delta kecil)

**Tanggal:** 2026-07-28
**Buat:** dev Go (CF `internal/postclaim`)
**Status:** ⛔ REVERTED `927e113` 2026-07-28 — PAYOUT_LIST renderer LANDED (self-aggregate total rupiah Σbt×rate + worker count di header widget sendiri) → doc stats upw/upb REDUNDAN buat payout, nol konsumen lain (Review-page count belum digarap). YAGNI: dihapus, bangun ulang kalau Review count beneran butuh (field beda rvc dst). ~~BUILT+PUSHED 9111937~~ di-revert. **Sheet cleanup PENDING: STAT_CARD_ROW @1027 nampilin fallback "Belum ada data payout" selamanya → copot dari page payout (builder op1Screen).**
**Konteks:** Payout butuh angka "berapa worker belum dibayar" = hitungan LINTAS doc `reward_cache` (per-worker). STAT_CARD_ROW by-design nol agregasi (keyed 1 doc) → CF yang nyediain 1 doc agregat. Ini juga ngebuka stat global yang kemarin di-DEFER (Review page counts — field nyusul, sparse).

## 1. Delta

Maintain **1 doc stats global** di koleksi `84214220504259//reward_cache`:

| Field | Isi |
|---|---|
| `sk` | `"stats"` — marker + search key (`sk◼stats`). Doc per-worker GAK punya `sk` → gak ketarik query payout `rd◼1`, dan doc stats gak punya `rd` → dua arah aman |
| `upw` | count doc reward_cache dengan `rd=="1"` |
| `upb` | Σ `bt` semua doc `rd=="1"` |

- **Kapan update:** di akhir tiap `Recompute` per-cv (approve/reject/payout/submit) — best-effort, idempotent. Firestore aggregation query (`count()` / manual scan tenant ini kecil) terserah implementasi.
- Doc-id bebas (saran: `stats`) — yang dikontrak SEARCH-nya: `sk◼stats`.
- **Nominal TIDAK dihitung CF** (aturan baku: CF gak nyentuh uang) — rate ada di config sheet.
- Extensible: field count lain (antrian review `rvc`, approved hari ini, dst) tinggal nambah field di doc yang sama — sparse, nol perubahan kontrak.

## 2. Konsumen (sheet SUDAH live, config-ahead)

statCardRow @ op1Screen RewardPayout (row 1027):
```json
{"type":"STAT_CARD_ROW","vidtable":"20342033315492","table":"84214220504259//reward_cache","search":"sk◼stats","cards":"Belum dibayar◼upw◼warn★Batch nunggak◼upb◼accent","highlight":"upw","text":"Belum ada data payout"}
```
Sebelum CF deploy: doc gak ketemu → card nampilin text fallback. Setelah deploy: angka hidup.

## 3. Acceptance

- [ ] Approve worker ke-10 (rd 0→1) → `upw`+1, `upb`+bt.
- [ ] Tandai Lunas → rd balik "0" → `upw`/`upb` turun.
- [ ] Doc stats GAK muncul di PAYOUT_LIST (`rd◼1`) dan doc per-worker GAK kebaca statCardRow (`sk◼stats`).
- [ ] Recompute replay → nilai sama (idempotent).

**Referensi:** `docs/sales-freelance-reward-dev-spec.md` · dict `1_XHmo5…` tab `reward_cache` rows 11-14 (sk/upw/upb terdaftar).
