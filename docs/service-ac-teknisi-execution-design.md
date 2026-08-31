# Service AC — Teknisi Execution (tap tugas → ngapain) — Design

**Tanggal:** 2026-08-05
**Sumber:** `src/component/TeknisiRuntimeMaintenance.jsx` (layar `JobExecution` + 7 sheet)
**Konteks:** ServiceTeknisiHome (list `tv◼{userVid}`) → tap 1 job → layar eksekusi. Ini rancangan FAITHFUL ke mockup + map ke SDUI + apa yang udah dibangun vs gap.

---

## 1. Yang teknisi lakuin (mockup, urut)

Layar detail job = **1 state machine**. Teknisi jalan step-by-step:

```
Mulai kerja → Konfirmasi Unit → Foto Awal → [Kerja: Parts / Temuan / Parts-kurang / Minta-ganti]
   → Selesaikan (Foto akhir + TTD customer + Bayar) → Cetak nota
```

## 2. Yang SELALU tampil di layar detail

| Blok | Isi (mockup) | SDUI |
|---|---|---|
| Header | kode job + badge status | WORKSPACE_HEADER ✅ (built) |
| Customer card | nama (+URGENT), **alamat→tap maps**, jam, **phone** | header cn/ca ✅; phone+maps-link = GAP |
| Spec | jenis · unit (snowflake) | STAT_CARD_ROW ✅ (built) |
| Keluhan | box keluhan | GAP — butuh widget teks doc-bound (`<kl>`) |
| Unit dikerjakan | kartu asset yang di-link (label, merk/pk, servis terakhir) | GAP — LIST_CARD //asset by ie[] |
| **Progress stepper** | Mulai→Unit→Foto awal→Kerja→Foto akhir→TTD (dot done/active) | GAP — widget stepper baru (derive dari field WO) |
| Evidence/notes | banner: parts kepakai · temuan terkirim · hold · minta-ganti | GAP — noticeBar gated per-flag |
| Kronologi | timeline event | timelineLedger ✅ (built) |

## 3. State machine — tombol kontekstual per status

| Status WO | Tombol yang muncul | Built? |
|---|---|---|
| `assigned` (belum mulai) | **Mulai Kerja** | ✅ |
| `in_progress` + belum ada unit (`ie` kosong) | **Konfirmasi Unit** | ❌ |
| `in_progress` + unit + belum foto awal (`fb` kosong) | **Foto Kondisi Awal** (wajib) | ❌ (sekarang foto cuma di completion) |
| `in_progress` + unit + foto awal | **Parts** · **Temuan** · **Parts Kurang** · **Minta Ganti** · **Selesaikan** | Temuan ✅ + Selesaikan ✅; Parts/Parts-kurang/Minta-ganti ❌ |
| `hold_parts` | **Part tersedia · Lanjut** | ❌ |
| `completed` | **Cetak Surat Selesai** / **Cetak Invoice** (printPolicy) | ❌ |

Gate = `search:"st◼X"` di tombol (pola workflow*Btn). Foto-awal/unit-gate butuh sub-field (`fb`/`ie`) di search.

## 4. Tiap aksi — sheet/route + write + widget

| Aksi | Input (mockup sheet) | Write ke work_order + event | Widget SDUI |
|---|---|---|---|
| **Mulai** | — | `st◼in_progress` + event started | workflowEventBtnFlat gated `st◼assigned` ✅ |
| **Konfirmasi Unit** | pilih asset customer (checkbox multi) + tambah unit baru | `ie◼[assetIds]` + event unit-linked | tablePicker multi //asset `search:cust◼{cn}` + route "Tambah Unit" |
| **Foto Awal** | GET_IMAGES (wajib) | `fb◼1` + event foto-awal | route/sheet GET_IMAGES → workflowEventBtnFlat |
| **Parts** | katalog part + qty per part (TANPA harga) | `parts◼[…]` + event parts | tablePicker/selectable + stepper qty → **catat jenis+qty doang** |
| **Temuan (scope)** | desc (min 10) + parts-needed + **foto wajib** | event `workorder-scope` + `sc◼1` | ✅ (Lapor Temuan, bottom-sheet) — TAMBAH foto wajib |
| **Parts Kurang** | pilih 1 part | `st◼hold_parts` + `hp◼{part}` + event | selectableVertical + workflowEventBtnFlat gated |
| **Minta Ganti** | alasan (Butuh senior/Kondisi berat/Butuh 2 orang/Berhalangan) + note | event reassign-req + `rr◼1` | selectableVertical + 3LineBorderForm + submit |
| **Selesaikan** | foto akhir + **TTD (signaturePad)** + bayar (tunai/transfer/belum) | `st◼completed` `fa◼◁▷` `td◼◁▷` `by◼◁▷` + event | ✅ (ServiceComplete: GET_IMAGES + signaturePad + selectable) |
| **Resume (hold)** | — | `st◼in_progress` `hp◼""` + event | workflowEventBtnFlat gated `st◼hold_parts` |
| **Cetak** | slip (tanpa harga) / invoice (frozen, printPolicy) | — (baca doc) | PRN keyed (share-pdf/bluetooth), gated `st◼completed` |

## 5. Doktrin mockup yang WAJIB dijaga (jangan hilang pas SDUI-in)

- **Teknisi NEVER lihat harga** — Parts/scope catat FAKTA (jenis+qty+desc), nol angka. Harga = Admin.
- **Foto = bukti** (awal wajib sebelum kerja, akhir wajib, scope wajib foto).
- **TTD = handshake dua-pihak** di ujung (signaturePad, customer tanda tangan).
- **Offline-canonical** — mode lapangan normal (band "tersimpan lokal, sinkron pas ada sinyal").
- **Silence = success** — selesai = diam, nol perayaan.
- **Non-blocking**: Temuan & Minta-ganti gak nge-block kerja dasar; Parts-kurang = HOLD.

## 6. Schema baru di `work_order` (buat state machine)

| field | isi |
|---|---|
| `fb` | foto awal (url/flag) |
| `fa` | foto akhir |
| `td` | ttd (signature) |
| `by` | cara bayar (tunai/transfer/belum) |
| `ie` | array asset_id yang di-link (unit dikerjakan) |
| `parts` | array {nama, qty} (tanpa harga) |
| `hp` | part yang kurang (saat hold) |
| `sc` | flag temuan terkirim |
| `rr` | flag minta-ganti terkirim |

**Coll baru `asset`** (unit AC customer) — dibutuhin Konfirmasi Unit (pilih unit) + nanti Asset Registry. Field: `as`(id) `al`(label) `cn`(cust) `mk`(merk) `pk` `ls`(last service) `history[]`.

## 7. Gap widget (butuh baru / verify)

1. **Progress stepper** — mockup StepDot (6 step, derive dari fb/fa/td/ie/parts/st). Cek widget `executionStepper`/stepper-variant; kalau gak ada = widget baru (derive-only, nol input).
2. **Keluhan display** (teks doc-bound `<kl>`) — pakai ITEM_CARD_DETAIL (kayak Incident) atau widget teks doc-bound.
3. **Konfirmasi Unit** — tablePicker multi //asset + inline-create (route Tambah Unit).
4. **Parts recorder** (jenis+qty, no harga) — reuse taskItemBuilder mode ringkas / selectable+stepper.
5. **Cetak slip/invoice** — PRN keyed gated (slip tanpa harga; invoice frozen = butuh line-item widget, itu M-Admin).
6. **Customer phone + alamat→maps** — header extend / row tambahan.

## 8. Yang udah LIVE (dari M2)
Mulai ✅ · Temuan (Lapor, bottom-sheet) ✅ · Selesaikan→Complete (foto+TTD+bayar) ✅ · timeline ✅ · assign (ServiceAssign) ✅.

## 9. Urutan build usulan
1. **Konfirmasi Unit** (butuh coll `asset` + link `ie`) — step paling awal yang belum ada.
2. **Foto Awal** sebagai step gated terpisah (+ `fb`).
3. **Parts / Parts-kurang / Minta-ganti** (3 tombol gated + sheet).
4. **Progress stepper** (widget derive — cek existing dulu).
5. **Cetak slip** (PRN gated).
6. Customer phone/maps + keluhan display (polish).

Invoice (line-item) + Cetak Invoice = ranah **Admin** (M-Admin), bukan teknisi.
