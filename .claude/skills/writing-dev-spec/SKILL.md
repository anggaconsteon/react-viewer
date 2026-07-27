---
name: writing-dev-spec
description: Use when writing a Consteon/VTL dev-spec doc (docs/*-dev-spec.md) for a new widget, page, Cloud Function, or feature — from a mockup, notes, or a verbal description. Triggers include "buat dev spec", "bikin spec", "tulis spec untuk widget X", "spec buat dev Flutter/Go".
---

# Writing a Consteon Dev Spec

## Overview

A dev-spec hands a feature to the **renderer dev (Flutter)**, **CF dev (Go)**, or **op1Screen/Web builder** with zero ambiguity. Consteon specs are terse Indonesian, config-driven, and split work by *who does what*. This skill captures the house format and style — copy the skeleton, fill from the mockup/notes.

Written output goes to `docs/<kebab-name>-dev-spec.md`.

## Ask first (3 things, before writing)

1. **Buat siapa?** dev Flutter (renderer) · dev Go (CF) · builder op1Screen/Web · campur. Determines section mix.
2. **Konsumen pertama?** the concrete page/feature that first uses this (grounds every example in real ids, not placeholders).
3. **Status?** PROPOSED (nunggu dev) · APPROVED · LIVE. Stamp it.

If a mockup image/code exists, extract the UI states and the field list from it — never invent fields.

## Section skeleton (house order)

```markdown
# [NAMA] — [ringkas 1 baris] (Dev Spec)     ← or: # Dev Spec (Flutter) — widget X

**Tanggal:** YYYY-MM-DD
**Buat:** dev Flutter (renderer) / dev Go (CF) / builder op1Screen
**Status:** PROPOSED | APPROVED | LIVE
**Konteks / Konsumen pertama:** <page/feature + cell/route>
**Referensi:** <spec sibling>, dict book, handoff

---

## 1. Kenapa            ← problem + constraint kunci + keputusan user (cap tanggal)
## 2. Konsep           ← model mental, 1 paragraf
## 3. Kontrak field    ← JSON skeleton + tabel | field | isi |
   ### 3.1 sub-object  ← if nested
## 4. Contoh resolved  ← JSON KONKRET (real ids, bukan [PLACEHOLDER])
## 4b. UI / Layout     ← ASCII mockup per state (empty→loading→selected)
## 5. Kontrak output   ← format nilai keluaran (mis. anti-locale "lat,long") — if any
## 6. Sheet-side       ← generic+SUBSTITUTE, resolve dari cell, ikut op1screen-genericize-widget
## 7. Deliverable dev  ← numbered, per-dev
## 8. Dictionary       ← field baru: tab, tipe, default, 1-line makna
## 9. Ringkasan kerjaan ← tabel | Bagian | Siapa | Status |
## 10. v1 scope & deferred  /  Not Doing (dan kenapa)
## 11. Acceptance      ← - [ ] checklist, testable
## 12. Asumsi & risiko ← - [ ] surfaced, belum divalidasi

**Referensi:** <links footer>
```

Drop sections that don't apply (CF-only spec skips UI/Layout; pure-renderer skips Sheet-side). Number what remains.

## Style rules (non-negotiable — this is what makes it "yours")

- **Config-driven, nol hardcode.** Every UI label comes from `text` (◆-segmen) / `label`, never baked in Flutter. State this explicitly in the field table and Acceptance ("Nol string hardcode di Flutter").
- **Keputusan user di-cap tanggal.** "dikonfirmasi user 2026-07-21", "keputusan user, terkunci" — locks scope, prevents re-litigation.
- **DSL tokens exact:** `◁N▷` form input · `◀N▶` system stream · `◼` eq/pair · `⭘` AND/item-sep · `◆` segment-sep · `★N`/`☆` keyed. Don't invent tokens; trace each to the dict book.
- **Split by "Siapa".** Ringkasan kerjaan tabel = `Bagian | Siapa (dev Flutter/Go/builder) | Status`. Each dev reads their rows only.
- **Surface uncertainty, don't paper over it.** `## Asumsi & risiko` lists unvalidated assumptions as `- [ ]`. Ground every field in the dict/mockup — flag what you couldn't.
- **Not Doing (dan kenapa).** Explicitly list what's out of scope + the reason. Kills scope creep.
- **Lazy notes welcome.** "1 URL, bukan arsitektur", "Opsi malas: …, rekomendasi tetap …" — mark the cheap path and its ceiling.
- **Referensi footer** links sibling specs, dict book, patterns — the reader's next hops.

## Example specs to mirror

Don't inline a template — open a real one and match its shape:
- Widget (form-field family): `docs/map-point-picker-widget-dev-spec.md`
- Widget (universal/config-heavy): `docs/group-picker-widget-dev-spec.md`
- Split renderer + CF + dict: `docs/task-item-picker-search-sort-dev-spec.md`

## Common mistakes

- Placeholder ids in "Contoh resolved" → always resolve to the konsumen-pertama's real ids.
- Inventing a field not in the mockup/dict → stop, ask, or list under Asumsi.
- Config-ahead for a NEW widget type → renderer lands first, config nyusul (say so). Config-ahead OK only for existing types.
- Forgetting the per-dev split → dev doesn't know which lines are theirs.
