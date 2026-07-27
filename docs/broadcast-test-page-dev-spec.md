# Dev Spec — Page Testing "Kirim Pengumuman" (broadcast supervisor)

**Status:** SIAP DIBANGUN · backend (CF `onEventCreated` v2) selesai, menunggu page ini untuk test E2E broadcast
**Builder:** sesi/agent dengan MCP gsheets + skill `op1screen-genericize-widget` (WAJIB ikuti aturannya: generic name+SUBSTITUTE, semua data di-parameterize, helper string sebagai `="value"`, verifikasi resolved col D)
**Target:** proxy spreadsheet `18v3w5YJ6QuTaFOkIYoPE6fNRXbyq6GQm3Bdytfagaxg`, tab `op1Screen`
**Referensi backend:** `cloud-function/event_push_trigger.go` + `cloud-function/docs/event-push-flutter-dev-spec.md`
**Tanggal:** 2026-07-17

---

## 1. Tujuan

Satu page sederhana untuk SUPERVISOR mengirim pengumuman broadcast: ketik teks →
tekan kirim → CF push FCM ke semua workforce se-site. Ini page TESTING —
fungsional dulu, estetika belakangan.

## 2. Cara kerja (kontrak dengan backend — jangan diubah)

Button menulis SATU doc event via addToEvent. CF `onEventCreated` membaca:

| Field event | Nilai | Catatan |
|---|---|---|
| `ntf` | `broadcast` | **wajib persis ini** — gate + mode |
| `cv` / `cn` | vid/nama pengirim (Settings) | CF menolak kalau `cv` ≠ `spv` site target (log `broadcast rejected`) |
| `sv` / `sn` | vid/nama site target | penerima = semua `workforce` ber-`sv` sama, pengirim di-skip |
| `nm` | judul thread inbox | mis. `Pengumuman - <nama pengirim>` |
| `dp` | isi pengumuman = **input user** | boleh berisi `{nama}`, `{field-workforce-apapun}` → CF ganti per penerima |
| `ty` | `announcement` | bebas, ikut payload dt |
| `av`/`an` | opsional | tidak dibaca jalur broadcast |

## 3. Komposisi page (3 widget row + name row)

Reuse generic yang sudah ada — JANGAN bikin template baked baru:

1. **Judul** — base-lib `text` (@~903), G=`="medium"`, H=`="Kirim Pengumuman"`.
2. **Input teks pengumuman** — reuse widget input teks generic yang sudah ada di
   Widget tab (multiline lebih baik; pilih yang field-set-nya cocok — diff dulu
   sesuai skill). Nilai input ini yang nanti dirujuk token `◁N▷` di addToEvent.
3. **Tombol kirim** — reuse widget tombol savesend ber-addToEvent (pola
   `sendButtonGpsWithEvent` @192 atau varian yang dipakai page report). Semua
   param (label, action, addToEvent, dst) via helper col sesuai aturan skill.

## 4. Formula helper addToEvent (inti spec ini)

Meniru pola rumus report-patrol yang sudah live, diganti bagian ntf/ty/nm/dp:

```
=""&auzSettings!$J$31&"⭘r◼4320⭘tablevid◼20342033315492⭘ty◼announcement⭘t◼◀2▶⭘ts◼◀2|T"&System!$B$3&"|Ddd MMM yyyy HH:mm:ss▶⭘cv◼"&Settings!$B$1&"⭘cn◼"&Settings!$B$2&"⭘sv◼"&'op1'!K7&"⭘sn◼"&'op1'!L7&"⭘ntf◼broadcast⭘nm◼Pengumuman - "&Settings!$B$2&"⭘dp◼◁N▷"
```

- `◁N▷` = token input widget #2 — **builder WAJIB sesuaikan N** dengan posisi
  widget input di page final (salah nomor = dp kosong/keisi nilai lain).
- `sv`/`sn` ikut site aktif dari `'op1'!K7`/`L7` (konsisten dengan rumus patrol,
  tanpa hardcode). Kalau mau test site tertentu, ganti dua sel referensi itu saja.
- TANPA `av◼`/`an◼` — tidak dibutuhkan broadcast (boleh ada, diabaikan CF).

## 5. Prasyarat data sebelum test (di luar sheet)

1. Site target (yang `sv`-nya dipakai) harus punya kolom **`spv` = vid akun
   yang dipakai login test** — kalau tidak, CF menolak (`broadcast rejected`).
2. Minimal 1 akun workforce lain se-site pernah login di device (punya token
   `f` di `msg_DEV2`).
3. CF v2 sudah deploy (`bash deploy.sh onEventCreated` di repo cloud-function).

## 6. Acceptance criteria

- [ ] Resolved col D setiap widget row: JSON valid, tanpa `#N/A`, tanpa `[TOKEN]` sisa.
- [ ] Submit dari device supervisor → doc event baru berisi `ntf: "broadcast"` + `dp` = teks yang diketik.
- [ ] Log CF: `OK [push] event ... broadcast sv=...: sent=N skipped=M failed=K` dengan N ≥ 1.
- [ ] HP workforce se-site dapat banner + thread inbox "Pengumuman - <nama>"; **pengirim TIDAK dapat**.
- [ ] Test personalisasi: kirim `Halo {nama}, ini test` → tiap penerima melihat namanya sendiri.
- [ ] Test penolakan: login akun non-spv, kirim → tidak ada push, log `WARN ... broadcast rejected`.
