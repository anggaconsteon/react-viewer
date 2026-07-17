# Dev Spec — `location` widget: opMode baru `qr-selfie`

**Status:** READY FOR DEV
**Tanggal:** 2026-07-06
**Referensi live:** op1Screen row 146 (`clockIn`), spreadsheet `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`

---

## 1. Ringkasan

Mode absensi baru untuk widget `type:"location"` (engine attendance): **QR dulu, lalu selfie**, satu aksi, satu write.

- User tap icon → geofence check → scan QR → kalau QR valid → kamera selfie → upload foto → **baru** catat absensi.
- Ini **BUKAN** widget `checker`/`checkerQRPhoto` (itu engine patrol checklist, beda: punya `table`/`interval`/`buffer`, tanpa `timeClockOut1/2`/`actionLast`/addToEvent absensi). Yang di-extend: `type:"location"`.

**Zero field JSON baru.** Perubahan cuma:
1. Nilai enum baru `opMode: "qr-selfie"` → renderer (Flutter) implement state machine baru.
2. Segmen `text` ◆ tambahan (append di ekor, index existing tidak bergeser).

Semua field lain ke-reuse dari config existing: `locList`+`tolerance` (geofence), `folder`/`filename`/`imgHeight`/`imgWidth` (upload selfie — sudah ada bahkan di mode `qr-single`), `fakeGpsAllowed`/`outPositionAllowed`, `flag`, `addToEvent`/`updateEventRow`.

---

## 2. Keputusan produk (LOCKED — jangan didesain ulang)

| # | Keputusan | Nilai |
|---|-----------|-------|
| D1 | Timing geofence | **Cek di step QR saja (awal).** Lolos di QR = dianggap lolos untuk selfie. TIDAK ada re-check lokasi di step selfie. |
| D2 | Atomicity write | **Absensi tercatat HANYA setelah selfie sukses ter-upload.** QR valid + selfie batal/gagal = TIDAK ada write sama sekali (no partial addToEvent/updateEventRow). |

---

## 3. State machine renderer (opMode = `qr-selfie`)

```
TAP icon
 │
 ├─ 1. Geofence check (locList + tolerance)
 │     • fakeGpsAllowed="FALSE" & fake GPS terdeteksi → dialog text[22]/text[23] → SELESAI, no write
 │     • outPositionAllowed="FALSE" & di luar area   → dialog text[24]/text[25] → SELESAI, no write
 │
 ├─ 2. Scan QR (displayMode full-screen)
 │     • QR salah  → dialog text[9]/text[10], tombol text[11] "Scan Lagi" (loop) / text[1] "Batal" → SELESAI, no write
 │     • user batal → SELESAI, no write
 │     • QR valid  → lanjut step 3 (JANGAN write dulu — beda dgn qr-single)
 │
 ├─ 3. Prompt + kamera selfie
 │     • dialog sukses-QR: text[26] (judul) / text[27] (body), tombol text[28] "Ambil Selfie"
 │     • user batal / tutup kamera / foto gagal → SELESAI, NO WRITE (D2)
 │     • foto ok → upload ke Firebase Storage: folder + filename (konvensi existing {uservid}-{timestamp})
 │     • upload gagal → tawari retry; tetap gagal → SELESAI, no write
 │
 └─ 4. Upload sukses → fire addToEvent + updateEventRow SEKALI
       • token gambar ◀13▶ di addToEvent (`i◼◀13▶`) terisi URL selfie hasil upload
       • dialog sukses: text[29], tombol text[8] "OK"
```

Perbedaan inti vs mode existing:
- vs `qr-single`: write dipindah dari "setelah QR valid" ke "setelah selfie ter-upload".
- vs `selfie`: ada gate QR valid sebelum kamera; geofence tetap di awal.

---

## 4. Segmen `text` ◆ — index map

Existing (mode qr, check-in), index 0-based, **tidak berubah**:

| Idx | Isi | Pemakaian |
|-----|-----|-----------|
| 0 | QR | label icon |
| 1 | Batal | tombol cancel |
| 2–6 | Absensi berhasil … pending persetujuan | pesan status clock |
| 7 | ✔️ Check IN dg QR berhasil | sukses qr-single |
| 8 | OK | tombol |
| 9–11 | QR salah / …coba scan lagi / Scan Lagi | QR invalid |
| 12–14 | Anda perlu Selfie / QR yang anda scan salah… / Foto Selfie | **jalur fallback QR-salah → selfie. JANGAN di-reuse untuk jalur sukses — beda makna** |
| 15–18 | Perlu informasi lebih lanjut … Lembur | overtime/lupa checkout |
| 19–21 | Anda tidak di lokasi … Foto Selfie | fallback luar lokasi |
| 22–23 | Lokasi tidak valid / Nonaktifkan Fake GPS | fake GPS |
| 24–25 | Diluar Area Absensi / Silahkan menuju lokasi… | luar area |

**BARU — append (dipakai hanya oleh `qr-selfie`):**

| Idx | Isi (usulan, owner boleh reword via sheet) | Pemakaian |
|-----|--------------------------------------------|-----------|
| 26 | QR Berhasil | judul dialog sukses-QR |
| 27 | QR valid. Lanjutkan foto wajah (selfie) untuk mencatat absensi | body dialog |
| 28 | Ambil Selfie | tombol buka kamera |
| 29 | ✔️ Check IN dg QR + Selfie berhasil | dialog sukses akhir |

Semua label dari config `text` (renderer baca per index) — tidak ada string hardcode di Flutter.

---

## 5. JSON resolved contoh (clockIn, mode qr-selfie)

Basis = child `location` pertama di op1Screen row 146 live; delta cuma `opMode` + 4 segmen text di ekor:

```json
{"type":"location","url":"https://firebasestorage.googleapis.com/v0/b/otq-01-ase2/o/c%2Fautsorz%2Ficon2%2Ficon-190120-qr-scan-90x90.png?alt=media&token=da753564-7c75-4073-a750-bf2e9c1826c1","text":"QR + Selfie◆Batal◆Absensi berhasil◆Clock in berhasil◆Clock out berhasil◆Clock out overtime sudah dicatat. Silakan lanjut clock in◆Clock out sudah dicatat, pending persetujuan. Silakan lanjut clock in.◆✔️ Check IN dg QR berhasil◆OK◆QR salah◆QR yang anda scan salah, coba scan lagi.◆Scan Lagi◆Anda perlu Selfie◆QR yang anda scan salah. Lakukan foto wajah anda (selfie)◆Foto Selfie◆Perlu informasi lebih lanjut◆Anda clock out overtime atau lupa clock out?◆Lupa check-out◆Lembur◆Anda tidak di lokasi◆Anda tidak berada di lokasi yang ditentukan, silahkan Selfie◆Foto Selfie◆Lokasi tidak valid◆Nonaktifkan Fake GPS◆Diluar Area Absensi◆Silahkan menuju lokasi yang ditentukan◆QR Berhasil◆QR valid. Lanjutkan foto wajah (selfie) untuk mencatat absensi◆Ambil Selfie◆✔️ Check IN dg QR + Selfie berhasil","imgHeight":600,"imgWidth":600,"folder":"id/2022/vtl/attendance-selfie/agenia-demo-7","filename":"87544551624342-2026-07-06-13-23-12","locList":[[-6.31607,106.64483],[-6.3162557,106.644882],[-6.89609,107.58163],[-8.8291404,115.1586866],[-6.252338,106.617278],[-6.9202713,107.5923769],[-6.1896892,106.761209]],"width":100,"timeClockOut1":1598429395771,"timeClockOut2":1598454595771,"actionLast":"check-in","flag":"attendance-check-in","route":"vertikaTeknoLokacipta","opMode":"qr-selfie","tolerance":80,"displayMode":"full-screen","fakeGpsAllowed":"FALSE","outPositionAllowed":"TRUE","addToTable":"","updateTableRow":"","addToEvent":"84214220504259//event⭘r◼4320⭘ty◼clock-in⭘p◼vertikaTeknoLokaciptaHome⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm▶⭘cv◼87544551624342⭘cn◼Agenia Demo-7⭘av◼83674161979544⭘an◼Product Group⭘sv◼83674161979544⭘sn◼Product Group⭘ln◼◀10▶⭘lq◼◀12▶⭘i◼◀13▶⭘d◼Clock in","updateEventRow":"84214220504259//workforce⭘search◼vid★87544551624342☆sv★83674161979544⭘ci◼◀2▶⭘is◼◀2|T7|Ddd MMM yyyy HH:mm▶⭘st◼on⭘os◼⭘co◼-1"}
```

Catatan:
- `addToEvent`/`updateEventRow` string **identik** dgn qr-single existing — yang berubah cuma KAPAN di-fire (setelah upload selfie) dan ◀13▶ pasti terisi.
- Icon `url`: sementara pakai icon QR existing; icon gabungan QR+selfie = keputusan owner, tinggal ganti URL di sheet.
- Label icon (text[0]) diganti "QR + Selfie" — dari config, bukan hardcode.

---

## 6. Urutan deploy (PENTING)

1. **Renderer dulu** — release Flutter yang mengenali `opMode:"qr-selfie"`.
2. **Baru flip sheet** — ganti `opMode` di op1Screen row 146 (atau row target lain).

Alasan: renderer sekarang men-DROP seluruh widget kalau ketemu config yang tidak dikenali (kejadian J219 `dropCap*`, 2026-06-26). Jangan pre-stage `qr-selfie` di sheet live.

Sekalian (kalau murah): renderer baru sebaiknya fallback graceful untuk `opMode` tak dikenal (render icon disabled / skip child, jangan drop seluruh HORIZONTAL_ICON) — mencegah kelas bug ini ke depan.

---

## 7. Checklist QA

- [ ] QR valid + selfie sukses → 1 doc event `ty◼clock-in`, `i` terisi URL foto; workforce `st◼on` terupdate.
- [ ] QR valid + batal di kamera selfie → TIDAK ada write (cek event ledger kosong).
- [ ] QR valid + upload gagal (airplane mode setelah foto) → tidak ada write; retry berfungsi.
- [ ] QR salah → loop Scan Lagi, tidak pernah sampai kamera.
- [ ] Di luar geofence (`outPositionAllowed:"FALSE"`) → berhenti sebelum QR.
- [ ] Fake GPS (`fakeGpsAllowed:"FALSE"`) → berhenti sebelum QR.
- [ ] Tidak ada re-check lokasi di step selfie (D1) — pindah lokasi setelah QR valid tetap boleh selfie.
- [ ] Mode existing `qr-single`/`selfie`/`gps-single` tidak berubah perilaku (regression).
