# Dev Spec — CF Approval Sync `//submission.st` (best-effort)

**Status: PROPOSED 2026-09-02**
**Repo: `consteon/cloud-function` · file: `internal/approval/approval.go` (satu file, nol route baru)**
**Terkait: `docs/approval-flow-keyed-dev-spec.md` · feed Kiriman Saya (`//submission` head coll)**

---

## 1. Masalah

Feed "Kiriman Saya" baca koleksi `//submission` (proyeksi status tipis, key `nm` sama dengan `//request.nm`). Saat ini `submission.st` di-sync dari **tombol** approval (blok `◆` di `updateEventRow`, 4 jalur di page Approval). Dua gap:

| Gap | Detail |
|---|---|
| **A — multi-level bohong** | Tombol nulis `st◼approved` tiap Setujui dipencet. CF baru finalize `//request.st◼approved` pas level TERAKHIR (`approval.go` `advance()`). Level tengah: request masih `pending`, badge feed udah hijau. Aman selama semua policy `nl=1` (kondisi live sekarang), salah begitu policy `nl≥2` masuk. |
| **B — auto-approve gak ke-sync** | `Created` tanpa policy → CF langsung `st◼approved` di request, **tanpa `dv`** → tombol gak pernah kepencet → submission nyangkut `waiting` selamanya. |

Akar: yang **memutuskan** status final itu CF, bukan tombol. Penulis status harusnya yang mutusin.

## 2. Desain

CF jadi **satu-satunya penulis `submission.st`** untuk request family. Sync dipanggil dari handler approval yang udah ada — **nol route baru** di `tenant_write_trigger.go` (koleksi `submission` tetap unrouted).

### 2.1 Aturan best-effort (KEPUTUSAN OWNER 2026-09-02 — WAJIB)

> "kalo submission nya gak nemu maka lanjut aja gitu jangan di buat error … kalo ada ya proses kalo gak ada ya abaikan"

- Doc submission **gak ketemu** (belum di-setup / request lama pra-rollout / tenant belum pakai feed) → **log INFO, return nil**. Approval jalan terus normal.
- Diperluas satu tingkat (usulan gua, konsisten sama alasan owner): **error transient pun jangan gagalin approval** — log WARN, return nil. Kalau sync error dipropagate, event retry → gate `Updated` udah drop (dv kebersihan) → retry percuma, approval-nya sendiri malah kena noise. Preseden persis di repo: `reorder.OnActivity` best-effort ("a projection hiccup never fails/retries the router", `tenant_write_trigger.go` route reorder).
- Konsekuensi diterima: crash di antara stamp request dan sync submission → badge feed basi (redelivery ke-ACK gate). Proyeksi, bukan ledger — bisa dikoreksi manual / next decision.

### 2.2 Mapping status

| Momen (handler existing) | `//request` (udah ada, jangan ubah) | `//submission.st` (BARU) |
|---|---|---|
| `Created`, ada policy → routed L1 | `nl/cl/ak` stamp | — (writer form udah nulis `waiting`) |
| `Created`, **tanpa policy** → auto-approve | `st◼approved` | `approved` |
| `Updated`, approve level tengah (`cl<nl`) | geser `cl/ak` | `processing` |
| `Updated`, approve level akhir (`cl==nl`) | `st◼approved` | `approved` |
| `Updated`, reject (level mana pun) | `st◼rejected` | `rejected` |

`processing` udah ada di badgeMap feed (5 status: waiting/processing/approved/done/rejected) → level tengah jadi "Diproses", bonus UX gratis. Kalau dev mau lean, baris itu boleh di-drop — sisanya wajib.

`rr` (alasan tolak) TIDAK dicopy — detail Kiriman Saya udah baca `//request` langsung (detailCard hybrid, search `nm◼{nm}`).

### 2.3 Match mekanisme

Submission ditulis app via `addToEvent` (doc-id AUTO) dengan field `nm` = nomor request (`REQ-YYYY-NNNNNN`). Jadi match by **query field `nm`, limit 1** — pola persis `queryPolicyNl`:

> ⚠️ **KOREKSI 2026-09-02 (implementasi).** Draft spec ini bilang `nm` "sama dengan `docID` request di CF" — **SALAH**. `//request` juga ditulis via `addToEvent`, jadi doc-id-nya auto-id Firestore, bukan `REQ-…` (`approval-flow-keyed-dev-spec.md` §"Identitas"; itu sebabnya tombol approval alamatin request pakai `search◼nm★{nm}`, bukan by path). Kalau `docID` dipakai sebagai kunci query, `Where("nm","==",<auto-id>)` gak akan pernah match → tiap approval cuma log `no submission doc` dan **fitur ini diam-diam mati**. Kunci WAJIB dibaca dari field: `fsdoc.AsString(doc["nm"])`. Ditambah guard `nm == ""` → skip, karena equality ke `""` bisa nyantol ke kartu orang lain yang `nm`-nya kosong.

```go
// Collections owned/read by this domain. (tambah 1 const)
submissionCollection = "submission" // feed Kiriman Saya — proyeksi status, best-effort
```

```go
// syncSubmissionSt mirrors a request's outcome onto its Kiriman Saya card.
// BEST-EFFORT BY DESIGN (owner 2026-09-02): the submission doc may simply not
// exist — older requests, tenants that never adopted the feed — and a missing
// or failing projection must never fail (or retry) the approval itself. So:
// not-found → INFO + nil, any error → WARN + nil. The request doc stays the
// source of truth; the card catches up on the next decision or a manual touch.
func syncSubmissionSt(ctx context.Context, client *firestore.Client, base, nm, st string) {
	if nm == "" {
		log.Printf("WARN [approval] request has no nm; submission sync skipped")
		return
	}
	sub := client.Collection(base + "/" + submissionCollection)
	it := sub.Where("nm", "==", nm).Limit(1).Documents(ctx)
	defer it.Stop()

	snap, err := it.Next()
	if err == iterator.Done {
		log.Printf("INFO [approval] %s: no submission doc; skipping sync", nm)
		return
	}
	if err != nil {
		log.Printf("WARN [approval] %s: submission lookup: %v (approval unaffected)", nm, err)
		return
	}
	if _, err := snap.Ref.Set(ctx, map[string]interface{}{FieldSt: st}, firestore.MergeAll); err != nil {
		log.Printf("WARN [approval] %s: submission st=%s write: %v (approval unaffected)", nm, st, err)
	}
}
```

Catatan: `FieldSt` request (`"st"`) kebetulan sama dengan field submission — reuse const. Return type `void` sengaja: gak ada error yang boleh naik.

### 2.4 Call site (3 titik, semua SESUDAH write request sukses)

```go
// Created — cabang auto-approve (skrg ±:100-104), sesudah set() sukses:
if nl <= 0 {
	log.Printf("OK [approval] %s: no policy (cc=%s ft=%s); auto-approved", docID, av, rty)
	if err := set(ctx, ref, map[string]interface{}{
		FieldSt: StApproved, fieldNl: int64(0), fieldCl: int64(0), fieldAk: "",
	}); err != nil {
		return err
	}
	syncSubmissionSt(ctx, client, base, fsdoc.AsString(doc[fieldNm]), StApproved)
	return nil
}
```

```go
// Updated — cabang reject (skrg ±:149-154):
if dv == DvReject {
	stamp[lp+"s"] = StRejected
	stamp[FieldSt] = StRejected
	stamp[fieldAk] = ""
	log.Printf("OK [approval] %s: rejected at level %d", docID, cl)
	if err := set(ctx, ref, stamp); err != nil {
		return err
	}
	syncSubmissionSt(ctx, client, base, nm, StRejected)
	return nil
}

// Updated — cabang approve (skrg ±:157-167):
stamp[lp+"s"] = StApproved
subSt := "processing" // level tengah → feed "Diproses"
if next, final := advance(cl, nl); final {
	stamp[FieldSt] = StApproved
	stamp[fieldAk] = ""
	subSt = StApproved
	log.Printf("OK [approval] %s: approved at final level %d/%d", docID, cl, nl)
} else {
	stamp[fieldCl] = next
	stamp[fieldAk] = activeKey(av, next)
	log.Printf("OK [approval] %s: level %d approved; advanced to %s", docID, cl, activeKey(av, next))
}
if err := set(ctx, ref, stamp); err != nil {
	return err
}
syncSubmissionSt(ctx, client, base, nm, subSt)
return nil
```

`Updated`/`Created` sekarang butuh `db, tid` buat `paths.Base` — signature udah terima dua-duanya. Urutan write: request DULU (SSOT), submission belakangan (proyeksi).

## 3. Idempotency & anti-loop

- Write ke `//submission` → router: coll `submission` **unrouted** → `return nil` early, nol I/O. Nol loop.
- Redelivery `Updated`: gate dv-cleared drop → sync gak dobel. Set MergeAll nilai sama pun harmless.
- `syncSubmissionSt` dipanggil ulang manual (decision berikutnya) = self-healing buat badge basi.

## 4. Test

- Mapping `subSt` (tengah=processing, final=approved, reject=rejected) ke-cover lewat test `advance()` existing + 1 table test kecil kalau mau (pure).
- `syncSubmissionSt` = I/O, gak di-unit-test (konsisten `queryPolicyNl`, butuh emulator). Perilaku not-found/error cuma logging — review by eye.

## 5. Urutan rollout (PENTING — jangan kebalik)

1. **CF deploy dulu** (`onTenantWrite`). Selama tombol `◆` masih kepasang: dobel-penulis nilai SAMA (semua policy `nl=1` → final di L1) = harmless.
2. **Sesudah CF kebukti jalan** → cabut blok `◆…//submission…` dari 4 jalur (IRA `L476`, `R477`, `D471` `updateEventRow1/2` + helper `P471/Q471`) — blok `//request` DIBIARKAN utuh. Wajib sebelum policy `nl≥2` masuk, kalau nggak tombol level-tengah nulis `approved` prematur (Gap A balik).
3. Baru aman re-entry policy multi-level (6 approver + nl=3 dari tab OLD).

Nol index baru (query `nm` equality tunggal = single-field index otomatis). Nol perubahan `deploy.sh`.

## 6. Di luar scope

- `st◼done` (selesai diproses operasional) — vocab udah ada di badge, penulis belum ditentukan.
- Sinkron submission buat incident/complaint — nunggu keyed refactor fitur itu (hybrid decision 2026-09-01: mereka pindah penuh ke `//submission`, gak lewat `//request`).
- Gate test `◆` updateEventRow tetap jalan terpisah — kalau LULUS, langkah 5.2 nunggu; kalau GAGAL, spec ini sekaligus plan B (tombol gak pernah bisa sync → CF satu-satunya jalan).
