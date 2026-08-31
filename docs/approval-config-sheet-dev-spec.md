# Approval Config Sheets — Builder Spec (untuk session spreadsheet)

**Tanggal:** 2026-07-28
**Buat:** builder sheet (VTL master `14kDPqAw5FWoBLx52YBz0_xCQAYhvGzm-ZRLIS2aVECY`)
**Status:** ✅ BUILT 2026-07-28 — all-cost-center LIVE di kedua sheet, layout final v3.
**NAMA FINAL (user 2026-07-28): `Konfigurasi Approval` (eks `Approval Policy`) + `Otorisasi Approval` (eks `Approval Slot`)** — rename manual user, URUTAN: bebasin nama dulu (tab lama `Otorisasi Approval`→`…OLD` SEBELUM tab baru dipakein nama itu). Semua mention "Approval Policy"/"Approval Slot" di doc ini = nama final tsb.
- `Approval Policy`: `A=# | B=cc (auto) | C=Cost Center | D=Fitur | E=nl | F=warn (auto)` + `Z=Push (auto, hide)`. Cabang all-cc di **B2**.
- `Approval Slot`: `A=# | B=uv (auto) | C=Nama - NIP (manual) | D=Status (auto) | E:N=Level 1-10 | Y=slots | Z=Push` (Y:Z hide). Cabang all-cc per term di **Y2**. uv = VLOOKUP Nama→`D!$C:$D`; Status = VLOOKUP uv→`Pegawai!$B$3:$K` idx 2 (header-spill B2/D2 — mirror rumus per-row tab lama). Input user cuma Nama + Level.
- **Dropdown list = `'_Helper Approval'!G2`** spill `={"all-cost-center";FILTER('Cost Center'!D3:D;'Cost Center'!F3:F="active")}` (CC active-only + all-cc; udah ada dari sesi CF) — validation KEDUA tab nunjuk `'_Helper Approval'!$G$2:$G`. **`_Helper Approval` SELAIN kolom G gak disentuh** (keputusan user 2026-07-28: rollback safety — kalau migrasi fitur baru gak lancar, pipeline lama masih utuh; H2 sempet di-repoint ke band baru → DI-REVERT balik `COUNTA('Otorisasi Approval'!$E$2:$ZM$2)`, ref auto-follow pas tab lama di-rename OLD). H2 gak dikonsumsi flow baru mana pun. Tab GAK di-rename OLD (kolom G dipakai validation flow baru); kolom lama A:E+H dibersihin/repoint pas cutover BERES.
- Verified live: test row all-cc → slots `*-1|32639062303108-2` + `cc◼ALL` persis §9; regression 6 approver + 4 policy nol perubahan.
**Konteks:** 2 sheet config ini nge-push ke Firebase collection `grant`. Di-baca: **CF** `internal/approval` (policy) + **app approver** (slot). Spec induk: `docs/approval-flow-keyed-dev-spec.md`. Sheet lama (Konfigurasi Modul / Otorisasi / _Helper / Approval) PENSIUN, rename `…OLD` manual.

---

## 1. Yang di-hasilkan (KONTRAK — ini yang keras, layout boleh beda)

**REVISI 2026-07-29 (user): doc-id = AUTO (native Firestore), field di-rename biar jelas, upsert match by field `key`.**

2 jenis record ke collection `grant` (dibedain field `ty`):

**policy** (per CC×fitur → jumlah level):
```
ty◼policy⭘cc◼{cc}⭘ft◼{fitur}⭘nl◼{level}⭘key◼policy-{cc}-{ft}
```
doc-id **AUTO**. Contoh `key`: `policy-32639062303108-request-leave`.

**approver** (per approver → scope yang dia pegang):
```
ty◼approver⭘vid◼{vid}⭘n◼{nama}⭘sc◼{sc}⭘key◼approver-{vid}
```
doc-id **AUTO**. `sc` (scope) = `{ccVID}-{level}` di-`|`-join (`*-N` = all-cost-center). Contoh: `*-1|83674161979544-2`. `sc` kosong = **revoke**.

**Rename lama→baru:** `gt`→`ty` · `approval-policy`→`policy` · `approval-slot`→`approver` · `uv`→`vid` · `un`→`n` · `slots`→`sc` (scope). Field **`key` BARU** = kunci logis upsert (doc-id auto gak bisa dialamati langsung).

**CF BERUBAH** (dulu direct `Get(policy-{cc}-{ft})` by doc-id): doc-id auto → CF **query** `where ty=="policy" AND cc=={av} AND ft=={rty}` (+ fallback `cc=="ALL"`) + butuh **composite index** (ty,cc,ft). App approver baca `vid`/`n`/`sc`. Push = `scripts/grant/ApprovalGrant.js` (upsert by `key`; parse kolom Push). `un` di-strip NIP (dropdown "Nama - NIP") di formula Push → `n` = nama bersih.

## 2. Sheet `Approval Policy`

**Kolom** (manual kiri, auto kanan — formula HANYA di header, ARRAYFORMULA spill):
| Kol | Isi | Manual/Auto |
|---|---|---|
| Cost Center | NAMA CC (dropdown) atau `all-cost-center` | manual |
| Fitur | `request-leave` / `request-overtime` / … | manual |
| nl | jumlah level | manual |
| cc | VID CC (auto dari nama) | auto |
| Push | record grant | auto |
| warn | `DUP!` kalau (CC,Fitur) dobel | auto |

**Formula `cc`** (tambah cabang all-cost-center):
```
=IF(<Cost Center>="all-cost-center"; "ALL"; VLOOKUP(<Cost Center>; {'Cost Center'!$D$3:$D\'Cost Center'!$B$3:$B}; 2; FALSE))
```
- all-cost-center → `ALL` (sentinel, gak butuh VID).
- CC nyata → VLOOKUP nama→VID (tab `Cost Center`, kolom D=nama B=VID; array `{D\B}` biar bisa lookup ke kiri; **locale in_ID → separator `;`, array-col `\`**).
- typo nama → `#N/A` (atau bungkus IFNA → `CC?`).

**Formula `Push`**: `="gt◼approval-policy⭘cc◼"&<cc>&"⭘ft◼"&<Fitur>&"⭘nl◼"&<nl>`

## 3. Sheet `Approval Slot`

**Kolom**:
| Kol | Isi | Manual/Auto |
|---|---|---|
| uv | VID approver | manual |
| Nama | nama approver | manual |
| Status | `active` / non-active | manual |
| Level 1 … Level N (BAND) | NAMA CC atau `all-cost-center` per level (dropdown) | manual |
| slots | rantai slot (auto) | auto |
| Push | record grant (auto) | auto |

**Formula `slots`** = gabung tiap Level (tambah cabang all-cost-center), `|`-join, buang `|` depan. Tiap term (contoh Level 1 di kolom D):
```
IF(D3="all-cost-center"; "|*-1";
   IF(D3<>""; "|"&VLOOKUP(D3; {'Cost Center'!$D$3:$D\'Cost Center'!$B$3:$B}; 2; FALSE)&"-1"; ""))
```
Ulang per level (`-2`, `-3`, …), sambung, lalu `MID(…; 2; 9^9)` buang `|` pertama.
- all-cost-center → `*-{lvl}` (wildcard, gak butuh VID).
- CC nyata → `{vid}-{lvl}`.
- kosong → skip.

**Revoke**: `Status ≠ active` → `slots` di-KOSONGIN (Push tetap keluar `slots◼` kosong → overwrite doc jadi nol slot = approver dicabut).

**Formula `Push`**: `="gt◼approval-slot⭘uv◼"&<uv>&"⭘un◼"&<Nama>&"⭘slots◼"&<slots>`

## 4. all-cost-center — INTI update spec ini

**Konsep**: wildcard "CC apa pun".
- **Policy** `all-cost-center` = aturan level berlaku ke SEMUA CC (default). → `cc◼ALL`.
- **Slot** `all-cost-center` di level N = approver ini lihat SEMUA request di level N (CC mana pun). → slot `*-N`.

**VID kosong bukan masalah** — buat all-cost-center kita **gak butuh VID**, cabang IF langsung tulis sentinel (`ALL` / `*`), skip VLOOKUP.

**Yang baca (info buat builder, bukan kerjaan sheet):**
- CF: `policy-{cc-pemohon}-{ft}` dulu → NotFound → fallback `policy-ALL-{ft}`. (delta CF ~5 baris — kabarin dev.)
- App: slot `*-N` → gating `cl`-only (buang syarat CC). (renderer [VERIFY])

⚠ **Pakai label dropdown PERSIS** — kalau option-nya bukan string `all-cost-center` (mis. `All Cost Center`), samain di formula IF.

## 5. Strategi tumbuh-level (kekhawatiran user: nanti Level 4,5,…)

**Band Level di TENGAH, `slots`/`Push` SETELAH band** — jangan `slots` nyempil pas abis Level terakhir (nanti Level+1 nabrak).
- Cadangkan band Level 1..N (mis. 1..6 atau 1..10 ikut konvensi Otorisasi lama).
- Nambah level = **insert kolom DALAM band** + tambah 1 term di formula `slots`. `slots`/`Push` gak geser.
- (Alternatif normalisasi tall/1-baris-per-level DITOLAK: butuh agregasi MAP/ARRAYFORMULA yang dihindari; wide-band lebih cocok gaya formula tenant.)

## 6. Master CC (name→VID)

Tab **`Cost Center`** (open-range): nama kolom **D**, VID kolom **B**. Lookup pakai array `{'Cost Center'!$D$3:$D\'Cost Center'!$B$3:$B}` (2-col virtual [nama,VID], VLOOKUP index 2). CC baru = auto kebaca (open-range). **[VERIFY kolom D/B persis di tab Cost Center.]**

## 7. Locale

Spreadsheet `in_ID` → **pemisah argumen fungsi `;`** (bukan `,`), **array-col `\`**. Formula `&`-concat murni aman pakai apa aja. (Ke-catch dari #ERROR pas pakai `,`.)

## 8. Push plumbing → Firebase

Mekanisme sama `notification_grant` (kolom Push → record → sync ke coll `grant`). **[VERIFY jalur sync-nya masih sama.]** Tiap baris = 1 doc; doc-id `policy-{cc}-{ft}` / `slot-{uv}`.

## 9. Contoh data (dari data asli + all-cost-center)

**Policy**:
```
policy-32639062303108-request-leave  → gt◼approval-policy⭘cc◼32639062303108⭘ft◼request-leave⭘nl◼3
policy-ALL-request-overtime          → gt◼approval-policy⭘cc◼ALL⭘ft◼request-overtime⭘nl◼2   (all-cc)
```
**Slot**:
```
slot-91234922513369 (Denny, L1=all-cc, L2=PG, L3=Induk)
  → gt◼approval-slot⭘uv◼91234922513369⭘un◼Denny D Sambas⭘slots◼*-1|83674161979544-2|84214220504259-3
slot-41999994632117 (Marita, L2=KP)
  → gt◼approval-slot⭘uv◼41999994632117⭘un◼Marita Rosiani⭘slots◼32639062303108-2
slot-72333032338989 (Autsorz, non-active → REVOKE)
  → gt◼approval-slot⭘uv◼72333032338989⭘un◼Autsorz ID⭘slots◼
```

## 10. Open / [VERIFY]

- [x] Label dropdown = **`all-cost-center`** persis — dibake di formula B2/Y2; list = `'_Helper Approval'!$G$2:$G`.
- [x] Tab `Cost Center` kolom D=nama, B=VID — verified live.
- [x] Band level = **10** (E:N, mirror Otorisasi Approval lama); insert-in-band saat tumbuh + tambah term Y2.
- [ ] Push plumbing grant masih pakai jalur notification_grant? → dev.
- [x] ~~Delta CF fallback `policy-ALL-{ft}`~~ **DONE 2026-07-28** (`internal/approval` lookupPolicyLevels: `policy-{av}-{ft}` NotFound → `policy-ALL-{ft}` → else nl=0; build+vet+test ijo, uncommitted branch event-push).
- [ ] **Renderer gating slot `*-N` (cl-only, buang syarat CC)** → [VERIFY] dev app.
- [ ] Data: slot `(Kantor Pusat, level 3)` KOSONG → request KP-leave 3-level nyangkut. Isi approver (KP,3) / pakai all-cost-center / turunin nl policy KP-leave. → owner.
- [ ] Konfigurasi bentrok (CC,Fitur) dobel → `warn=DUP!` udah jagain, tentuin 1 (doc-id tabrakan). → owner.

**Referensi:** `docs/approval-flow-keyed-dev-spec.md` (skema request + kontrak CF) · CF `internal/approval` (branch event-push) · pola `notification_grant` push.
