# Gate fail-closed pas grant KOSONG (non-approver liat antrian) — Dev Spec (Flutter)

**Tanggal:** 2026-07-30 (rev 2026-07-31: root-cause dipersempit — §2c)
**Buat:** **dev Flutter (renderer)** — gate `LIST_ACTION_CARD` (list_card / list_action_card).
**Status:** PROPOSED (BUG masih ada per 2026-07-31 walau dev bilang udah difix). Config gate udah LIVE + bener — ini murni fix renderer.
**Konsumen pertama:** **ApproveLeave** (op1Screen @1050 `LIST_ACTION_CARD`, D1052).
**Referensi:** `docs/approve-leave-gating-and-note-dev-spec.md` §4 (algoritma gate, "doc==null → return []") · §4.0 (sumber vid `{userVid}`→#VID) · §6 (kontrak gate field).

---

## 1. Kenapa (bug)

Live-test 2026-07-30: **Angga** (akun autsorz) = **pemohon**, dan **BUKAN approver sama sekali** (gak punya doc `grant` `ty=approver`, gak pegang slot apa pun — dikonfirmasi user 2026-07-31: 0 dokumen). Approver asli cuma: **Agenia** (PG-1, PG-2), **Dirgahayu** (PG-3).

**Yang terjadi:** di antrian ApproveLeave **autsorz**, **card request MUNCUL** — walau tombol approve/reject udah kehilang.
**Harusnya:** autsorz bukan approver → antrian **KOSONG total** (nol card).

Ini **info leak** (non-approver liat siapa ngajuin apa) + inkonsisten. Gate per-slot buat approver yang PUNYA grant (Agenia/Dirgahayu) udah bener — yang bocor cuma jalur **user tanpa grant**.

## 2. Konsep

Gate udah bener buat user yang PUNYA grant (filter card per-slot `ak ∈ sc`). Yang KURANG: pas fetch grant approver **hasilnya KOSONG** (user bukan approver), renderer **fail-OPEN** (pass-through semua doc) — harusnya **fail-CLOSED** (return list kosong). Spec §4 udah bilang: `doc == null → return []`. Implementasi belum ikut buat card (tombol udah).

**Bukti dua jalur kepisah:**
- Tombol per-card: **hidden** buat autsorz ✓ (cek slot jalan — autsorz no slot → no tombol).
- Filter card: **gak** fail-close pas grant kosong ✗ (card tetep nongol).
→ Samain: no-grant ⇒ no-card, bukan cuma no-tombol.

## 2c. Root cause (dipersempit 2026-07-31) — `null` vs `isEmpty`

Dev bilang udah difix, TAPI **masih bocor**. Data dikonfirmasi user 2026-07-31: **Angga (pemohon) GAK ADA di collection `grant`** — 0 dokumen approver. Jadi `grantFound` **PASTI false**, tapi card tetep nongol.

**Hipotesis (paling mungkin):** guard fail-closed cek **`== null`**, PADAHAL fetch grant balikin **list/collection KOSONG `[]`** (bukan `null`) pas 0 match. `[] == null` → **false** → guard **kelewat** → jatuh ke `return docs` (fail-open).

Ini pitfall Dart klasik: query Firestore `.where(...).get()` balikin `QuerySnapshot` dengan `.docs == []` (empty list), **bukan `null`**. Cek `== null` gak pernah ke-trigger.

**Fix:** guard mesti nyala pas hasil **KOSONG**, bukan cuma null. Tiga kondisi → semua `return []`:
```
grant == null              // gak ada objek
|| grant.isEmpty           // fetch 0 dokumen  ← INI yang kelewat
|| sc == null || sc.isEmpty // grant ada tapi slot kosong (revoke)
```
Pseudo:
```dart
final grant = await fetchApproverGrant(sessionVid); // bisa null ATAU empty list
final gateIntended = widget['gateTable'] != null && widget['gateTable'] != '';
if (gateIntended) {
  if (grant == null || grant.isEmpty) return [];      // ← fail-closed (FIX)
  final sc = grant.first['sc'];
  if (sc == null || sc.isEmpty) return [];            // revoke = kosong
  return docs.where((d) => slotMatch(d, sc)).toList();
}
return docs; // no gate (gateTable kosong) — RewardReview
```

**Bukti mana yang bener** = log `grantFound`:
- `grantFound=false` + card muncul → **KONFIRMASI hipotesis ini** (guard cek null doang).
- `grantFound=true` → beda cerita (autsorz malah punya grant nyasar — tapi user udah cek GAK ADA, jadi harusnya false).

## 3. Kontrak (gate field — SUDAH LIVE, jangan diubah)

`LIST_ACTION_CARD` ApproveLeave @1050 (resolved):
```json
{ "type":"LIST_ACTION_CARD", "gateTable":"grant",
  "gateSearch":"ty◼approver⭘vid◼{userVid}", "gateSlot":"sc◆ak◆cl", … }
```
- `{userVid}` = vid user login (auth #VID, §4.0).
- Gate fetch: `grant` WHERE `ty==approver ∧ vid==sessionVid` → ambil `sc`.
- **Aturan yang kurang:** hasil fetch **0 dokumen** (user bukan approver) → **return `[]`** (list kosong), JANGAN pass-through.

## 4. Contoh (data live)

| User login | punya grant `ty=approver`? | slot | Antrian HARUSNYA | Observed (bug) |
|---|---|---|---|---|
| **autsorz** (pemohon) | **TIDAK** | — | **KOSONG** | ❌ card muncul (tombol hidden) |
| Agenia | ya | PG-1,PG-2,KP-3 | request di slot dia | ✓ bener (per-slot) |
| Dirgahayu | ya | PG-1,PG-3 | request di slot dia | ✓ bener |

## 4b. Truth table (yang diminta)

| gateTable | grant fetch (`ty=approver ∧ vid=me`) | hasil list |
|---|---|---|
| absent/"" | — | NO GATE (semua lewat) — layar non-gated (RewardReview) |
| present | **0 dokumen** (bukan approver) | **`[]` KOSONG (fail-closed)** ← FIX INI |
| present | ada, `sc` non-empty | filter per-slot `ak ∈ concrete(sc) OR cl ∈ wildcardLevels(sc)` (udah jalan) |
| present | ada tapi `sc` kosong (`""` = revoke) | `[]` KOSONG (fail-closed) |

## 7. Deliverable dev (renderer)
1. **Guard fail-closed cek KOSONG, bukan cuma `null`** (§2c — ini akar bug yang masih bocor). Pas `_gateIntended` (gateTable keisi) DAN (`grant == null` **ATAU** `grant.isEmpty` **ATAU** `sc` kosong) → **`return []`**, bukan `return docs`. Fetch Firestore balikin **empty list** pas 0 match — `== null` gak nutup itu.
2. Perlakuan sama kaya slot-mismatch: user tanpa slot yang cocok = **nol card**.
3. Konsisten sama tombol (yang udah bener hide pas no-slot) — card ikut fail-close.
4. **Instrumentasi cek (WAJIB balikin ke builder):** log `sessionVid`, `grantFound (bool)`, `sc`, `visibleCount`. Login Angga (pemohon, no grant) → harusnya `grantFound=false`, `sc` kosong, `visibleCount=0`. Kalau `visibleCount>0` pas `grantFound=false` = bug §2c (guard cek null doang, gak nutup empty list).

## 9. Ringkasan kerjaan
| Bagian | Siapa | Status |
|---|---|---|
| Fail-closed pas grant kosong (card, LIST_ACTION_CARD) | **dev Flutter** | **PENDING (bug)** |
| Filter per-slot (grant ada) | — | ✅ LIVE (bener) |
| Tombol hide pas no-slot | — | ✅ LIVE (bener) |
| Config gate (gateTable/gateSearch/gateSlot) | builder | ✅ LIVE |

## 10. Not Doing (dan kenapa)
- **Ubah config** — gak; config udah bener (`gateTable:grant` dll). Murni renderer.
- **Sentuh tombol** — gak; tombol udah bener. Cuma filter card yang fail-close.
- **Layar non-gated (gateTable kosong)** — gak kena; itu emang sengaja pass-through (RewardReview).

## 11. Acceptance
- [ ] Login **autsorz** (non-approver) → antrian ApproveLeave **KOSONG** (nol card, bukan card-tanpa-tombol).
- [ ] Login **Agenia**/**Dirgahayu** (approver) → tetep nampil request di slot masing-masing (gak regresi).
- [ ] Approver yang grant-nya di-revoke (`sc=""`) → antrian KOSONG.
- [ ] `visibleCount=0` pas `grantFound=false` (log instrumentasi).
- [ ] Layar non-gated (RewardReview, gateTable kosong) → gak berubah (tetep tampil semua).

## 12. Asumsi & risiko
- [x] **Data dikonfirmasi (2026-07-31):** Angga (pemohon) GAK ADA di `grant` → `grantFound` mesti false. Card tetep muncul = bug §2c.
- [ ] Bug persisnya di guard `== null` yang gak nutup empty list (§2c). [VERIFY di `list_card.dart` sekitar `_gateIntended` / filter — dev konfirmasi lewat log `grantFound`.]
- [ ] Fail-closed pas grant kosong gak bikin approver ASLI kehilang (mereka `grantFound=true`, jalur beda).
- [ ] `sc=""` (revoke) diperlakuin sama kaya no-grant (dua-dua → kosong). [VERIFY konsisten.]

---

**Referensi:** `docs/approve-leave-gating-and-note-dev-spec.md` (§4/§4.0/§6) · `docs/list-card-note-field-dev-spec.md` (dikirim bareng) · op1Screen ApproveLeave @1050 / D1052 · grant approver: Agenia `HSD579bu4UX16DJYGxHq`, Dirgahayu `4T43PQJ9zI14bCUDrMQo` (autsorz: TIDAK ADA doc approver).
