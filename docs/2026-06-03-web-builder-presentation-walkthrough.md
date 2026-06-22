# Vertika Web Builder — Walkthrough Presentasi

> Tujuan: panduan presentasi step-by-step ke user, dari menyusun komponen di **Web Builder** sampai menghasilkan **Web JSON** per-user yang dirender app.
> Spreadsheet: VTL Master (`14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`).

---

## Konsep besar (yang harus nempel duluan)

```
   DEFINE SEKALI (user-agnostic)            RESOLVE PER USER (otomatis)
┌──────────────────────────────┐         ┌──────────────────────────────┐
│ Web Widget  → template [X]    │         │ Web JSON loop tiap email:     │
│ Web Screen  → susun page      │  token  │   - FILTER hak akses (RBAC)   │
│ Web Menu    → pohon menu      │ ──────► │   - isi [CC_LIST] / [SRC]     │
│ Web Theme   → tema tenant     │ [CC_LIST]│   → N baris JSON, 1 per user │
└──────────────────────────────┘         └──────────────────────────────┘
        1 template                                N output JSON
              (yang beda cuma: cost center milik user + menu yang dia boleh)
```

Inti: **page ditulis SEKALI** sebagai template. Beda antar-user (cost center, menu yang terlihat, tema) di-resolve otomatis oleh formula di `Web JSON`. Admin **tidak pernah** menulis page per-user satu per satu.

---

## Peran tiap tab

| Tab | Peran |
|---|---|
| `Web Widget` | Gudang template komponen (DROPDOWN, DATE, BUTTON, SPREADSHEET, dst) ber-token `[X]`. Ditulis sekali, dipakai semua page. |
| `Web Screen` | Definisi page: 1 baris header (Menu Key) + N baris widget. Isi parameter; biarkan `[CC_LIST]`/`[SRC]` utuh. |
| `Web URL` | Sumber routing per-cost-center (mode ROUTED) — file spreadsheet berbeda per CC. |
| `Web Menu` | Pohon menu/navigasi. Tempat page dipasang. |
| `Otorisasi Cost Center` | Matrix izin: user × cost center (TRUE/FALSE). |
| `Otorisasi Menu Web` | Matrix izin: user × menu (TRUE/FALSE). |
| `Web Theme` | Tema visual per-tenant (warna, font, radius). |
| `Web JSON` | OUTPUT akhir, 1 baris per user. Kolom C = MENU JSON, Kolom D = Theme JSON. |

---

## Langkah presentasi

### Babak 1 — Setup page (sekali, oleh admin)

1. **`Web Widget`** — pastikan komponen yang dibutuhkan sudah tersedia (dropdown, date, button, spreadsheet content).
2. **`Web Screen`** — buat page: tulis baris header (isi Menu Key) lalu baris-baris widget di bawahnya. Isi parameter di kolom kanan tiap widget. **Biarkan `[CC_LIST]` dan `[SRC]` apa adanya** — itu akan diisi otomatis per-user nanti.
3. **`Web URL`** *(hanya jika page-nya beda data per cost center / mode ROUTED)* — daftarkan file spreadsheet per cost center.
4. **`Web Menu`** — daftarkan page di pohon menu (di bawah grup yang sesuai).

### Babak 2 — Hak akses & output (per-user)

5. **`Otorisasi Cost Center`** — centang cost center mana yang boleh diakses tiap email.
6. **`Otorisasi Menu Web`** — centang menu mana yang terlihat untuk tiap email.
7. **`Web Theme`** → set **`Web Screen!B7`** ke nama tema aktif (berlaku untuk semua user tenant).
8. **`Web JSON`** — tidak ada langkah manual: formula resolver mengisi tiap baris email secara otomatis. Kolom C = menu, Kolom D = tema. **Ini hasil final.**

### Babak 3 — Jalan di aplikasi

9. User login → app mengambil baris `Web JSON` sesuai email → merender menu + page + tema **sesuai cost center & izin user itu**.
10. User memilih cost center dari dropdown saat aplikasi berjalan:
    - **FILTER** → nilai ditulis ke cell, sheet menyaring ulang.
    - **ROUTED** → tukar file spreadsheet sesuai cost center.
    - Cost center aktif **tidak** disimpan kembali ke sheet.

---

## Catatan jujur soal kemudahan

Pisahkan dua peran saat presentasi supaya ekspektasi pas:

- **Operator (harian) — mudah / self-serve:** mengisi parameter widget yang sudah ada, mencentang TRUE/FALSE di matrix otorisasi, memilih nama tema, menambah user (baris `Web JSON` terisi otomatis).
- **Builder (komponen/page baru) — butuh orang teknis:** membuat tipe widget baru (menulis template + resolver formula) atau page baru (formula assembler + alignment kolom A/E) bersifat dev-level dan rawan error formula. **Jangan dijanjikan "tinggal klik".**

---

## Checklist sebelum demo

- [ ] Sembunyikan/rapikan tab kerja dari tab scratch (`Web Screen 2`, `Web Menu3 ` (ada spasi di akhir), `Copy of Web URL`, `Otorisasi Cost Center33`, `JSON`, `Filter`, `D`) supaya user tidak bingung.
- [ ] Konfirmasi tab menu yang live (`Web Menu`) — pastikan satu sumber, bukan ganda.
- [ ] Siapkan 1-2 user contoh dengan cost center berbeda untuk demonstrasi "1 template, beda hasil per-user".
- [ ] (Opsional) Tambah kolom probe "JSON valid?" untuk verifikasi cepat saat live.
- [ ] Pastikan buffer baris `Web JSON` cukup untuk jumlah user yang didemokan.
