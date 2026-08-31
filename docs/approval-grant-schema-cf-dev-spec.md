# Approval Grant — schema keyed baru + CF policy-lookup query (Dev Spec)

**Tanggal:** 2026-07-29
**Buat:** dev Go (CF — package `internal/approval`)
**Status:** ✅ CF BUILT + PUSHED `1fadc21` 2026-07-29 (branch event-push) — `lookupPolicyLevels` query-based (`ty/cc/ft` +ALL fallback), `queryPolicyNl` (iterator.Done≠error), nl via fsdoc.AsInt64 (Number/string tolerant), test `resolvePolicyNl` (fallback+error-propagate). build+vet+test ijo 15 pkg. **REVISI §5.3: composite index KEMUNGKINAN GAK WAJIB** (query equality-only 3× → Firestore merge single-field index otomatis; composite cuma wajib kalau ada range/orderBy). `firestore.indexes.json` DIHAPUS (repo deploy gcloud, nol firebase.json → file gak kepakai). Kalau runtime `FailedPrecondition` → klik link error (auto-create).
**Konteks / Konsumen pertama:** flow approval cuti/lembur. CF `onTenantWrite` route `request`: pas request dibuat, CF lookup policy (jumlah level) buat stamp `nl`/`cl`/`ak`. Coll `grant` di-push dari sheet `Konfigurasi Approval` + `Otorisasi Approval` lewat `scripts/grant/ApprovalGrant.js`. Data udah LIVE di Firestore (policy + approver) 2026-07-29.
**Referensi:** `docs/approval-flow-keyed-dev-spec.md` (flow induk + kontrak CF §4) · `docs/approval-config-sheet-dev-spec.md` §1 (kontrak grant, updated) · `scripts/grant/ApprovalGrant.js` (push, upsert by `key`) · CF `internal/approval` (branch event-push).

---

## 1. Kenapa

Schema `grant` di-revisi (keputusan user 2026-07-29, terkunci):
- **doc-id deterministik `policy-{cc}-{ft}` / `slot-{uv}` → doc-id AUTO** (native Firestore).
- field di-rename biar kebaca: `gt`→`ty`, `approval-policy`→`policy`, `approval-slot`→`approver`, `uv`→`vid`, `un`→`n`, `slots`→`sc` (scope).
- upsert match by field **`key`** (doc-id auto gak bisa dialamati).

**Konsekuensi CF:** doc-id policy gak deterministik lagi → **`Get("policy-"+av+"-"+rty)` MATI** (selalu NotFound). Kalau CF gak diubah, `lookupPolicyLevels` selalu return 0 → **SEMUA request auto-approve (nl=0) diam-diam = approval bypass total**. Ini bug senyap (gak ada error), jadi wajib.

## 2. Konsep

Coll `grant` = 1 collection, 2 jenis doc dibedain field `ty`:
- `policy` — aturan level per (CC × fitur). **Cuma ini yang dibaca CF.**
- `approver` — slot approver. Dibaca APP (gating), **CF GAK sentuh**.

Perubahan CF = **1 fungsi**: `lookupPolicyLevels(av, rty)` dari direct-`Get` jadi **query** `ty=="policy" AND cc==av AND ft==rty` (+ fallback `cc=="ALL"`). Sisa flow (Created stamp `nl/cl/ak`, Updated advance/finalize, `dv`-trigger, idempotent, anti-self-loop) **TETAP** — gak kesentuh.

## 3. Kontrak field — coll `grant` (doc-id AUTO)

Path: `MobileTable/{db=20342033315492}/tables/{tenantVid}/grant/{autoId}`.

**policy** (dibaca CF):
```json
{ "ty":"policy", "cc":"32639062303108", "ft":"request-leave", "nl":3, "key":"policy-32639062303108-request-leave" }
```
| field | tipe | isi | CF pakai? |
|---|---|---|---|
| `ty` | string | `policy` (diskriminator) | ya — filter query |
| `cc` | string | VID cost center; `ALL` = sentinel all-cost-center | ya — filter query |
| `ft` | string | fitur = `rty` request (`request-leave`, `request-overtime`, …) | ya — filter query |
| `nl` | number (int) | jumlah level approval | ya — nilai yg diambil |
| `key` | string | `policy-{cc}-{ft}` — kunci upsert push | **enggak** (plumbing) |

**approver** (referensi — CF GAK baca):
```json
{ "ty":"approver", "vid":"91234922513369", "n":"Denny D Sambas", "sc":"32639062303108-1|83674161979544-2|84214220504259-3", "key":"approver-91234922513369" }
```

## 4. Contoh resolved (real ids VTL)

```
policy KP-leave      → {ty:policy, cc:32639062303108, ft:request-leave,     nl:3, key:policy-32639062303108-request-leave}
policy all-cc lembur → {ty:policy, cc:ALL,             ft:request-overtime, nl:2, key:policy-ALL-request-overtime}
```
Alur lookup:
- pemohon CC=KP, rty=request-leave → query `ty=policy ∧ cc=32639062303108 ∧ ft=request-leave` → **nl=3**.
- pemohon CC=PG (83674…), rty=request-overtime, gak ada policy spesifik → fallback `cc=ALL ∧ ft=request-overtime` → **nl=2**.
- gak ada spesifik + gak ada ALL → **nl=0** → auto-approve (`st=approved`, `cl=nl=0`, `ak=""`).

## 5. Deliverable dev (Go)

### 5.1 `lookupPolicyLevels` — query 2-tahap (ganti direct-Get)

```go
const (
    grantTy     = "ty"
    tyPolicy    = "policy"
    allCC       = "ALL"
)

// lookupPolicyLevels: jumlah level approval buat (cost-center av, fitur rty).
// Return (0, nil) kalau gak ada policy sama sekali (→ caller auto-approve).
// Return (_, err) cuma buat error transient (retry) — BUKAN buat "gak ketemu".
func lookupPolicyLevels(ctx context.Context, grant *firestore.CollectionRef, av, rty string) (int, error) {
    // 1) policy spesifik CC pemohon
    if nl, found, err := queryPolicyNl(ctx, grant, av, rty); err != nil {
        return 0, err
    } else if found {
        return nl, nil
    }
    // 2) fallback all-cost-center
    if nl, found, err := queryPolicyNl(ctx, grant, allCC, rty); err != nil {
        return 0, err
    } else if found {
        return nl, nil
    }
    // 3) gak ada policy → no approval
    return 0, nil
}

func queryPolicyNl(ctx context.Context, grant *firestore.CollectionRef, cc, rty string) (nl int, found bool, err error) {
    it := grant.
        Where(grantTy, "==", tyPolicy).
        Where("cc", "==", cc).
        Where("ft", "==", rty).
        Limit(1).
        Documents(ctx)
    defer it.Stop()

    snap, err := it.Next()
    if err == iterator.Done {
        return 0, false, nil // gak ketemu — BUKAN error
    }
    if err != nil {
        return 0, false, err // transient (network/deadline) → propagate → retry
    }
    return policyLevels(snap), true, nil
}
```

**Kunci correctness (jangan sampai kebalik):** `iterator.Done` = "policy gak ada" → `found=false`, aman jatuh ke auto-approve. Error LAIN (network) = `err` → propagate → CF retry. Ini jaga sifat lama: **jangan auto-approve gara-gara Firestore blip**, cuma auto-approve kalau policy beneran gak ada.

### 5.2 `policyLevels` — baca `nl` sebagai int (best practice: `DataTo` struct)

```go
func policyLevels(snap *firestore.DocumentSnapshot) int {
    var p struct {
        Nl int64 `firestore:"nl"`
    }
    if err := snap.DataTo(&p); err != nil {
        return 0
    }
    return int(p.Nl)
}
```
Push script simpen `nl` sebagai **Number** (Firestore `integerValue`) → `DataTo` ke `int64` bener. JANGAN string-parse (dulu mungkin `nl` string).

### 5.3 Composite index (WAJIB — query 3 equality)

`firestore.indexes.json`:
```json
{
  "collectionGroup": "grant",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "ty", "order": "ASCENDING" },
    { "fieldPath": "cc", "order": "ASCENDING" },
    { "fieldPath": "ft", "order": "ASCENDING" }
  ]
}
```
`firebase deploy --only firestore:indexes`. (Atau bikin dari link di pesan error query pertama.) Query bakal error `FailedPrecondition: index required` sampai index selesai build.

### 5.4 Yang GAK berubah (jangan diutak)
- Created: fresh-read gate (`st==pending && cl==0`), stamp `nl/cl◼1/ak◼{av}-1`, no-policy→`st◼approved/nl◼0/ak◼""`, `av` kosong→WARN+coba ALL.
- Updated: fresh-read + re-gate `dv`+`st==pending`, stamp `l{cl}s/by/bn/t`, advance `cl/ak` atau finalize, reject→`st◼rejected`, clear `dv/dvby/dvbn`.
- Router gate `dv ∈ {approve,reject}`, helper `advance()`/`activeKey()`.
- diskriminator VALUE udah `policy` (dulu `approval-policy`) — cukup samain konstanta.

## 6. Dictionary
Coll `grant` BELUM ada tab di dict book (`1_XHmo5…`) — **bikin tab `grant`** (11-col DSL variant), dokumentasiin: policy (`ty/cc/ft/nl/key`) + approver (`ty/vid/n/sc/key`). Catat `ty` values (`policy`/`approver`), `cc=ALL` sentinel, `sc` format `{ccVID}-{lvl}|…` + `*-N` wildcard, `key` = plumbing upsert.

## 7. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Push formula 2 tab (Konfigurasi/Otorisasi) → DSL baru | builder sheet | ✅ DONE (14kDPqAw; source-tenant `1FTaIAC…` Konfigurasi PENDING user paste) |
| `ApprovalGrant.js` auto-id + upsert by `key` | (done) | ✅ DONE, dry-run + live push OK |
| `lookupPolicyLevels` → query (§5.1) | dev Go | ✅ BUILT 2026-07-29 (uncommitted) |
| `policyLevels` baca int (§5.2) | dev Go | ✅ pakai fsdoc.AsInt64 (lebih toleran dari DataTo — Number+string) |
| composite index (ty,cc,ft) (§5.3) | dev Go | ⚠ KEMUNGKINAN GAK PERLU (equality-only merge single-field). File dihapus (repo gcloud-deploy). Kalau `FailedPrecondition` di runtime → klik link error auto-create |
| tab `grant` di dict book | builder dict | PENDING |
| app approver baca `vid/n/sc` | dev Flutter | PENDING (spec app terpisah) |

## 8. Not Doing (dan kenapa)
- **Logic approver di CF** — approver dibaca APP buat gating, CF gak sentuh. Rename `uv/un/slots→vid/n/sc` cuma ngefek app.
- **Migrasi doc lama** — coll `grant` fresh: policy deterministik lama GAK PERNAH ke-tulis sukses (ke-skip "no key"), approver auto-id udah bener. Kalau ADA sisa doc id `policy-…`/`slot-…` dari test → hapus manual (bukan kerjaan CF).
- **Rename `cc/ft/nl`** — tetap; udah pendek + jelas, dipakai query.
- **Validasi policy dobel di CF** — di-guard di sheet (`warn=DUP!`); CF `Limit(1)` percaya sheet.

## 9. Acceptance
- [ ] Request CC-spesifik yg ADA policy → `nl` ke-stamp bener (mis. 3), BUKAN 0.
- [ ] Request CC gak ada policy tapi ada `cc=ALL` → `nl` dari ALL.
- [ ] Gak ada spesifik + gak ada ALL → `nl=0` → `st=approved` (auto-approve).
- [ ] Firestore error transient (bukan `iterator.Done`) → CF return err → retry, **TIDAK** auto-approve.
- [ ] Composite index ke-deploy; query gak `FailedPrecondition`.
- [ ] `nl` kebaca int64 (request doc `nl` = angka bener, bukan 0 gara-gara parse gagal).
- [ ] Regresi: Updated flow (approve naik level, reject) tetap jalan.
- [ ] Unit test `queryPolicyNl`: (a) ketemu→(nl,true,nil) · (b) `iterator.Done`→(0,false,nil) · (c) error→(_,_,err) di-propagate. + `lookupPolicyLevels` 2-tahap (spesifik hit / fallback ALL hit / dua-dua miss→0).

## 10. Asumsi & risiko (belum divalidasi)
- [ ] `nl` disimpan Number oleh `ApprovalGrant.js` (`NUMBER_FIELDS=['nl']`) → CF baca int64. Kalau ternyata push string → `DataTo` gagal/0; coerce di `policyLevels` (fallback `strconv`).
- [ ] policy `(cc,ft)` dobel di sheet → `Limit(1)` ambil sembarang 1 (nilai nl bisa beda). Sheet `warn=DUP!` guard, CF gak. Risiko: nl salah kalau dobel.
- [ ] `av` (CC pemohon) kosong → query `cc=""` → gak match → fallback ALL. Kalau ALL ada, ke-approve via ALL (mungkin gak diinginkan). Pastiin `sv→CC` resolve di submit ([flow spec §7.1]).
- [ ] Index baru butuh waktu build → query error sampai ready; deploy index DULU sebelum trafik.
- [ ] Firestore query 3-equality tanpa order-by aman (equality only) — tetap butuh composite index; pastiin `queryScope=COLLECTION` (bukan COLLECTION_GROUP) sesuai path per-tenant.

---

**Referensi:** `docs/approval-flow-keyed-dev-spec.md` · `docs/approval-config-sheet-dev-spec.md` §1 · `scripts/grant/ApprovalGrant.js` · dict book `1_XHmo5NaSUXT0Ri6jtf1qvu-wdKZfUS9hSgYJAg2xAw`.
