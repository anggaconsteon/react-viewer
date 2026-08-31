# Reorder Signal Doctrine

**Document Type:** Doctrine Increment
**Status:** Draft — for review
**Scope Class:** Derived projection + coordination signal. Subordinate to canonical docs.
**Supersedes:** Nothing. Adds one projection and one optional event.

---

## 0. Status & Anti-Drift Preamble

Dokumen ini adalah **increment**, bukan redesign. Ia tunduk pada seluruh canonical docs; bila terjadi konflik, **canonical docs menang**. Referensi utama yang mengikat increment ini:

- **Core Product Philosophy** — khususnya klausa *"Not a business intelligence or analytics platform."*
- **Projection Query Layer Architecture** — pola projection, freshness, runtime visibility scope.
- **State Derivation Engine Specification** — khususnya §3.3 Customer Outstanding Projection (pola paralel yang diikuti increment ini).
- **Task & Investigation Lifecycle** — untuk follow-up sebagai task.
- **Operational Responsibility Matrix / Runtime Identity** — batas wewenang runtime.
- **Movement Ledger Architecture** — DROP sebagai sumber `occurred_at`.

Satu kalimat yang mengunci increment ini pada jati diri platform:

> **Reorder Signal bukan analytics. Ia adalah operational signal — obligation-at-risk yang memicu aksi koordinasi, bukan angka untuk dipandangi.**

Jika di kemudian hari increment ini mulai melahirkan grafik tren, funnel retensi, atau dashboard KPI, itu adalah **drift** dan harus ditolak. Increment ini berhenti tepat di titik "sinyal yang memicu follow-up task".

---

## 1. Motivasi

Consteon menjual dua nilai, bukan satu:

1. **Loss avoidance** (sudah ada) — minimize kehilangan aset returnable. Ini *pain avoidance*.
2. **Revenue protection** (increment ini) — deteksi customer yang berhenti reorder sebelum mereka hilang diam-diam. Ini *gain protection*.

Nilai kedua adalah *revenue leak yang invisible*: customer yang biasanya order rutin lalu berhenti, dan owner tidak pernah melihat angkanya sampai terlambat. Sinyalnya sudah ada di ledger — setiap DROP tercatat dengan `occurred_at`. Yang kurang hanyalah **satu proyeksi turunan** yang menghitung jeda sejak DROP terakhir dan membandingkannya dengan cadence customer.

Ini konsisten dengan prinsip arsitektur inti: **State = proyeksi dari Movement.** "Customer belum reorder" bukan data baru — ia interpretasi baru dari DROP yang sudah ada.

---

## 2. Prinsip Doktrin Baru

### 2.1 Reorder Signal ≠ Outstanding

Keduanya berbeda pertanyaan, berbeda domain, tidak boleh dicampur:

| | Outstanding | Reorder Signal |
|---|---|---|
| **Pertanyaan** | "Customer pegang berapa aset kita?" | "Customer sudah berapa lama tidak order?" |
| **Basis** | ΣDROP − ΣPICKUP (kuantitas custody) | now − last_DROP (jeda waktu) |
| **Concern** | Aset kita berisiko hilang | Revenue kita berisiko hilang |
| **Aksi** | Pickup task | Follow-up task |

Customer bisa punya outstanding 0 (semua galon sudah balik) tapi tetap memicu Reorder Signal (sudah 3 minggu tidak beli lagi). Sebaliknya, customer dengan outstanding tinggi tapi baru order kemarin **tidak** memicu Reorder Signal. Dua sinyal independen.

### 2.2 Cadence adalah ekspektasi, bukan aturan

Reorder Signal bukan penalti dan bukan vonis "customer hilang". Ia sinyal *obligation-at-risk*: "biasanya customer ini order tiap N hari; sekarang sudah lewat; mungkin perlu disapa." Interpretasi akhir tetap milik manusia (Admin). Sistem tidak pernah menyimpulkan "customer churned" secara otomatis.

Ini paralel dengan **Discrepancy ≠ Lost**: sinyal memicu perhatian, bukan kesimpulan.

### 2.3 Cadence di-derive, override adalah event

Konsisten dengan *"a projection is not directly editable"*: angka cadence yang dipakai sistem **tidak boleh** disimpan sebagai field yang di-edit langsung di projection. Ketika Admin meng-override cadence sebuah customer, itu **event** yang masuk ledger (`COORDINATION.reorder_cadence_set`), dan projection men-derive dari event tersebut. Dengan begitu cadence tetap auditable, replayable, dan tidak melanggar immutability projection.

---

## 3. Expected Cadence — Tangga Tiga Tingkat (Graceful Degradation)

`expected_cadence_days` untuk tiap customer di-resolve dengan **precedence tiga tingkat yang selalu menghasilkan jawaban**:

```
Tingkat 1 — ADMIN OVERRIDE  (otoritas tertinggi)
  Jika ada COORDINATION.reorder_cadence_set terakhir untuk customer:
    expected_cadence_days = event.cadence_days
    cadence_source = "admin_set"

Tingkat 2 — AUTO-LEARNED  (jika histori cukup)
  Else jika customer punya >= MIN_DROPS_FOR_LEARNING (default 3) DROP:
    avg_gap = rata-rata jeda antar DROP berturut-turut (dalam hari)
    expected_cadence_days = round(avg_gap)
    cadence_source = "learned"

Tingkat 3 — DEFAULT GLOBAL  (selalu tersedia)
  Else:
    expected_cadence_days = DEFAULT_CADENCE_DAYS   (default 14)
    cadence_source = "default"
```

Sistem **tidak pernah** kekurangan angka. Ini paralel dengan *"projeksi tidak pernah null — sajikan yang ada."*

### 3.1 Auto-learned bukan machine learning

`avg_gap` adalah aritmatika biasa dari ledger: ambil deretan `occurred_at` semua DROP customer, hitung selisih antar DROP berurutan, ambil rata-ratanya. Tidak ada model, tidak ada training. Ini murni derivation, sama kelasnya dengan cara Outstanding menghitung ΣDROP − ΣPICKUP.

### 3.2 Urutan implementasi yang disarankan

Ketiga tingkat menghasilkan field yang **sama** (`expected_cadence_days`), jadi konsumen sinyal tidak peduli angkanya dari tingkat mana. Konsekuensinya, implementasi boleh bertahap tanpa mengubah kontrak:

1. **MVP (Loka Air):** Tingkat 3 (default 14) + Tingkat 1 (admin override). Cukup dan tidak overengineered.
2. **Nanti:** Tambah Tingkat 2 (auto-learned) — tidak mengubah event, projection consumer, maupun UI. Hanya menambah cabang resolusi di derivation.

### 3.3 Konstanta (parameter tingkat sistem)

| Konstanta | Default | Keterangan |
|---|---|---|
| `DEFAULT_CADENCE_DAYS` | 14 | Cadence fallback untuk customer tanpa histori/override |
| `MIN_DROPS_FOR_LEARNING` | 3 | Minimum DROP sebelum auto-learned aktif |
| `OVERDUE_MULTIPLIER` | 1.0 | `overdue` saat `days_since_last_drop > cadence × multiplier` (lihat §5) |
| `ATTENTION_LEAD_FRACTION` | 0.8 | `attention` mulai saat mendekati cadence (lihat §5) |

Nilai default dipilih konservatif untuk depot air kecil. Semua bisa dituning per-tenant tanpa mengubah doktrin.

---

## 4. Reorder Signal Projection

Mengikuti pola **Customer Outstanding Projection** (State Derivation Engine §3.3) sedekat mungkin, agar konsisten dan mudah dirawat.

```
ReorderSignalProjection {
  customer_id:            string

  last_drop_at:           timestamp | null   // occurred_at DROP terakhir; null jika belum pernah
  last_drop_event_id:     string | null

  expected_cadence_days:  integer            // hasil resolusi §3
  cadence_source:         "admin_set" | "learned" | "default"

  days_since_last_drop:   integer | null     // today − last_drop_at (hari); null jika belum pernah DROP

  status: "fresh" | "approaching" | "overdue" | "dormant" | "never_ordered"
  // derivation di §5

  followup_state:         "none" | "task_open" | "recently_contacted"
  // menghindari sinyal berulang untuk follow-up yang sudah jalan (lihat §6)

  derived_at:             timestamp
}
```

**Catatan:** projection ini **read-only** hasil derivation. Tidak ada endpoint yang men-set statusnya langsung — persis seperti Outstanding.

### 4.1 Inputs

- `MOVEMENT.delivery_executed` (DROP) — untuk `last_drop_at` dan auto-learned cadence.
- `COORDINATION.reorder_cadence_set` — untuk admin override cadence (§7).
- `COORDINATION.task_created` / task lifecycle event follow-up — untuk `followup_state` (§6).

**Tidak** mengonsumsi PICKUP. Reorder Signal murni soal *kedatangan order baru* (DROP), bukan pengembalian aset.

### 4.2 SALE dan Reorder Signal

DROP dan SALE dua movement berbeda. Untuk depot air/gas yang model dominannya pinjam (LOAN), Reorder Signal berbasis DROP sudah tepat. Jika sebuah tenant juga menjual (SALE), maka "order terakhir" idealnya menghitung **DROP maupun SALE** sebagai bukti aktivitas beli. Untuk MVP, cukup DROP. Perluasan ke SALE ditandai sebagai *parked* (§9) agar tidak menambah kompleksitas sebelum dibutuhkan.

---

## 5. Status Derivation

```
Misal:
  d = days_since_last_drop
  c = expected_cadence_days

never_ordered:   last_drop_at == null
fresh:           d <= c × ATTENTION_LEAD_FRACTION        // masih dalam ritme normal
approaching:     c × ATTENTION_LEAD_FRACTION < d <= c    // mendekati jatuh tempo order
overdue:         c < d <= c × 3                          // sudah lewat cadence — sinyal follow-up
dormant:         d > c × 3                               // lama sekali tidak order — kandidat "hampir hilang"
```

- **fresh** → silence. Tidak ada kartu, tidak ada gangguan. (Silence is the success state.)
- **approaching** → sinyal halus opsional (bisa disembunyikan di MVP; berguna untuk depot yang mau proaktif).
- **overdue** → sinyal aktif: kartu follow-up muncul di Admin.
- **dormant** → sinyal prioritas lebih tinggi: customer sudah jauh melewati ritme.

`overdue` dan `dormant` adalah dua tingkat urgensi dari sinyal yang sama, paralel dengan `attention`/`critical` pada Outstanding. Warna mengikuti kanon: **amber** untuk urgensi operasional; **tidak pernah merah** (merah dicadangkan untuk kegagalan engineering).

---

## 6. Anti-Nag: followup_state

Sinyal yang berulang tiap hari untuk customer yang sama akan jadi noise dan melanggar "silence communicates stability". Karena itu projection melacak `followup_state`:

| State | Arti | Efek pada sinyal |
|---|---|---|
| `none` | Belum ada tindak lanjut | Sinyal tampil normal |
| `task_open` | Sudah ada follow-up task terbuka untuk customer ini | Sinyal diredam — sudah ditangani, jangan tampilkan lagi sebagai baru |
| `recently_contacted` | Baru saja dikontak/di-follow-up (dalam window `RECENT_CONTACT_DAYS`, mis. 7 hari) | Sinyal diredam sementara; muncul lagi jika tetap tidak order setelah window |

`followup_state` di-derive dari task lifecycle event (follow-up task dibuat/ditutup), **bukan** di-set manual di projection. Ini menjaga konsistensi "projection is derived, not edited".

---

## 7. Event Baru (Opsional): COORDINATION.reorder_cadence_set

Satu-satunya penambahan ke event taxonomy. Diperlukan **hanya** untuk fitur admin override cadence (Tingkat 1). Jika sebuah tenant tidak pernah override, event ini tidak pernah di-emit dan sistem berjalan penuh dengan auto-learned + default.

| Aspek | Definisi |
|---|---|
| **Class / type** | `COORDINATION.reorder_cadence_set` |
| **Emitting authority** | ADMIN (COORDINATION). Keputusan cadence adalah keputusan komersial/koordinasi, bukan eksekusi. |
| **Payload** | `{ customer_id, cadence_days, reason? }` |
| **Efek** | Menjadi sumber Tingkat 1 pada resolusi cadence customer tersebut. Event terbaru menang (last-write-wins secara kronologis). |
| **Immutability** | Sama seperti semua event — koreksi = event baru, bukan edit. |
| **Runtime** | Admin (dalam mode koordinasi). Tidak pernah Driver. |

**Bukan** movement. Ia coordination event — tidak menyentuh ledger aset, outstanding, atau pool. Ia hanya memengaruhi interpretasi Reorder Signal.

---

## 8. Runtime Visibility & Authority

Konsisten dengan Operational Responsibility Matrix dan aturan bahwa data komersial bukan wilayah Driver:

| Runtime | Akses Reorder Signal |
|---|---|
| **Admin (Coordination)** | **Pemilik utama.** Melihat sinyal overdue/dormant, meng-override cadence, membuat follow-up task. |
| **Owner surface** | Visibilitas ringkas (berapa customer overdue/dormant) sebagai orientasi — tetap sebagai sinyal beraksi, bukan chart. |
| **Supervisor** | Tidak relevan dengan mandat investigasi. Diabaikan kecuali muncul kebutuhan resolusi khusus. |
| **Driver** | **Tidak pernah.** Driver tidak melihat outstanding, apalagi data reorder komersial. |

Follow-up yang dihasilkan adalah **task biasa** lewat Task Lifecycle yang sudah ada — bukan mekanisme baru. Admin membuat follow-up task; eksekusinya (mis. telepon customer, atau jadwalkan DROP baru) mengikuti alur task normal.

---

## 9. Pricing Placement

Reorder Signal jatuh di tier **Operational Intelligence** pada maturity ladder (Run → Coordinate → **Improve**):

- **Run / Coordinate:** loss avoidance, outstanding control, pickup coordination.
- **Improve (Intelligence):** revenue protection — Reorder Signal duduk di sini.

Ia adalah kandidat kuat sebagai **hook upgrade** dari tier Coordinated ke tier Intelligence. Ini keputusan go-to-market, dicatat di sini hanya untuk penempatan; keputusan final ada di dokumen pricing.

---

## 10. Out of Scope / Parked

Ditandai eksplisit agar increment tidak menggelembung:

- **Tren & analytics** — grafik penjualan, funnel retensi, kohort, KPI dashboard. **Ditolak** — ini garis drift ke BI platform.
- **Auto-action** — sistem TIDAK boleh otomatis membuat DROP, mengirim WA promosi, atau menyimpulkan churn tanpa manusia. Sinyal memicu *perhatian*, bukan tindakan otomatis.
- **SALE sebagai bukti order** — perluasan "last activity" agar mencakup SALE selain DROP. *Parked* sampai ada tenant dengan model jual dominan.
- **Auto-learned cadence** — boleh ditunda ke fase setelah MVP; default + override sudah fungsional. Ditandai sebagai increment implementasi, bukan perubahan doktrin.
- **Per-item cadence** — cadence saat ini per-customer, bukan per-kategori-item. Perluasan ke per-item *parked* sampai terbukti perlu.
- **Prediksi tanggal order berikutnya** — memproyeksikan "customer akan order sekitar tanggal X". Menarik tapi bergerak ke wilayah prediktif; *parked*.

---

## 11. Ringkasan Satu Layar

- **Apa:** satu projection turunan (`ReorderSignalProjection`) + satu event opsional (`COORDINATION.reorder_cadence_set`).
- **Dari mana datanya:** DROP `occurred_at` yang sudah ada di ledger. Tidak ada arsitektur baru.
- **Cadence:** tangga tiga tingkat — admin override → auto-learned → default 14 — selalu menghasilkan jawaban.
- **Output:** sinyal `overdue`/`dormant` di Admin yang memicu **follow-up task biasa**.
- **Garis merah:** ini operational signal, bukan analytics. Berhenti di "memicu follow-up". Tidak ada grafik, tidak ada auto-action, tidak ada vonis churn.
- **Nilai jual:** dari "jangan sampai galon hilang" menjadi juga "jangan sampai customer hilang."
