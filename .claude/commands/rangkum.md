---
description: Rangkum kerjaan hari ini per-case, tulis santai ke daily note di Obsidian vault
allowed-tools: Bash, Read, Write, Edit
---

Tugas: bikin rangkuman kerjaan HARI INI, lalu tulis ke daily note di Obsidian vault.

## Vault & file
- Vault: `C:\Users\FCT\Documents\ObsidianVault`
- File daily note: `C:\Users\FCT\Documents\ObsidianVault\<YYYY-MM-DD>.md` (tanggal hari ini)
- Kalau file BELUM ada → bikin baru, mulai dengan heading `# <YYYY-MM-DD>`.
- Kalau file SUDAH ada → JANGAN timpa. Append di bawah, kasih pemisah `---` dulu, lalu sub-heading waktu update `## Update jam HH:mm`.

Ambil tanggal & jam pakai PowerShell: `Get-Date -Format "yyyy-MM-dd"` dan `Get-Date -Format "HH:mm"`.

## Ambil bahan rangkuman (urut prioritas)
1. **Git hari ini** — di repo aktif jalanin:
   `git log --since="midnight" --pretty=format:"%h %s" --stat` dan `git status --short`.
   Kalau kosong, jangan maksa — lanjut ke sumber lain.
2. **Apa yang dibahas/dikerjain di sesi chat ini** — keputusan, file yang diubah/dibuat, masalah yang dipecahin, hal baru yang dipelajari.
3. Kalau user kasih argumen ($ARGUMENTS), itu konteks tambahan / poin yang dia mau dimasukin.

## Cara nulis (PENTING)
- **Per-case.** Pecah kerjaan hari itu jadi beberapa case/topik terpisah. Tiap case dijelasin sendiri — jangan dicampur jadi satu list panjang.
- **Gaya santai, kayak manusia cerita ke temen.** Bukan bahasa baku/laporan kaku. Jelas, gampang dipahami, to-the-point. Boleh pakai "gue/lu" kalau pas, tapi yang penting natural.
- Tiap case ceritain: ngerjain apa, kenapa, hasil/keputusannya gimana.
- Kalau ada **knowledge baru** atau **pelajaran** dari case itu, sebut langsung di dalam case-nya (jangan dijadiin section terpisah yang generik) — biar nyambung konteksnya.
- Singkat tapi padat. Skip basa-basi. Jangan ngarang — kalau ga yakin suatu hal kejadian, jangan ditulis.

## Format tiap case
```markdown
## <Nama case singkat>
<2-5 kalimat santai: ngerjain apa, kenapa, hasilnya.>
**Yang dipelajari:** <kalau ada hal baru; skip baris ini kalau ga ada.>
```

## Langkah
1. Ambil tanggal + jam.
2. Cek file daily note udah ada belum (Read; kalau gagal = belum ada).
3. Kumpulin bahan (git + sesi + $ARGUMENTS).
4. Susun per-case, gaya santai.
5. Tulis/append ke file vault.
6. Lapor ke user: file path-nya + ringkasan 1 baris ada berapa case.
