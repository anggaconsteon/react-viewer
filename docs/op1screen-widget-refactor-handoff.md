# op1Screen Widget Refactor — Handoff (generic + SUBSTITUTE pattern)

**Status:** ✅ DONE (2026-06-24) — semua 10 driver page (op1Screen 1007–1079) full generic+SUBSTITUTE. Reject/Failed reuse-generic + dedicated dihapus. 217/218 orphan (unused) dibiarin. Dikerjain di **session sendiri** (parallel; JANGAN ganggu session driver-testing yang lagi jalan).

**Goal:** konversi widget op1Screen yang masih **fully-baked** → **generic template + nested SUBSTITUTE-from-columns** (gaya `routeProgressHeader`), biar widget **reusable** lintas page. Ini **REFACTOR** — **output ke app WAJIB tetap identik** (cuma rapihin cara nyimpen di sheet, bukan ngubah perilaku).

## Baca dulu
- `docs/consteon-runtime-knowledge-base.md` (konvensi build).
- memory: `feedback_generic_substitute_pattern`, `op1screen_widget_tab_convention`.

## Referensi (udah pattern ini)
- **routeProgressHeader** — Widget `J200` (semua field `[PLACEHOLDER]`) + op1Screen `D1009` (10-level SUBSTITUTE) + kolom `G1009:P1009`.
- **navActionCard** — Widget `J204` + `D1014` + `G1014:P1014` (DONE 2026-06-23, contoh).

## Procedure per-widget (IKUTIN PERSIS)
1. Pilih widget. Cari baris op1Screen-nya: baca **op1Screen col B** buat nama widget. **VERIFY col B = nama widget** sebelum nulis apa pun. (Buffer row punya seq di col A tapi col B KOSONG → risiko off-by-one; navActionCard di 1014 BUKAN 1015.)
2. **Cek single-use:** scan op1Screen col B buat nama widget itu. Kalau dipake >1 page lewat VLOOKUP polos, **SEMUA** usage harus dikonversi (kalau enggak, page lain nampil literal `[TOK]`). Kalau ada varian terpisah (mis. routeProgressHeader vs routeProgressHeaderFull), biarin terpisah.
3. Baca JSON baked-nya sekarang (Widget `G{r}`/`J{r}`).
4. **Genericin Widget `J{r}`:** ganti tiap VALUE field yang parameterizable jadi `[PLACEHOLDER]` (UPPERCASE, no spasi/underscore — gaya routeProgressHeader: `[VARIANT]`,`[TABLE]`,`[SEARCH]`,`[TEXT]`…). `type` tetap baked. **JANGAN sentuh Widget col A/I/G/H** (cuma edit col J).
5. **Isi kolom helper op1Screen** di baris page: `G,H,I,J,K…` (satu per placeholder, urut template) = nilai aktual buat page INI.
6. **Tulis op1Screen `D{r}`** = nested SUBSTITUTE: `=SUBSTITUTE(SUBSTITUTE(…VLOOKUP(B{r},Widget!$A:$G,7,FALSE),"[TOK1]",G{r}),"[TOK2]",H{r})…"[TOKn]",{col})`. Urutan = urutan template, map ke G,H,I…
7. **VERIFY:** baca `D{r}` resolved → harus **IDENTIK** sama baked lama (no `[PLACEHOLDER]` sisa, no `#N/A`). Baca name-row `B{nr}` (assembled) → JSON valid, no `#N/A`. Baru lanjut widget berikut.
8. **Substring collision:** pastiin placeholder gak nyangkut (mis. `[TABLE]` BUKAN substring `[GATETABLE]` → aman; tapi cek kalau ada yang nested, urutin SUBSTITUTE biar yang spesifik gak ketiban).

## Safety rails
- **NEVER tulis Widget col A** (arrayformula spill → proxy-wide `#N/A`). Retrofit = edit Widget col **J** doang.
- op1Screen: tulis **D + kolom G+** doang. JANGAN sentuh **E** (spill) / **F** (flag TRUE).
- Abis TIAP widget: verify resolved identik + no `#N/A` di page itu. JANGAN batch buta.
- Ini refactor → output app gak boleh berubah. Kalau resolved beda dari sebelumnya = lo ngerusak, benerin dulu sebelum lanjut.

## Kandidat (driver widgets, Widget rows ~200-237)
**Udah pattern:** 200 routeProgressHeader, 201 preconditionGateCard, 202 inventoryBucketCard, 203 driverStopCard, 204 navActionCard, 205 noticeBar2, 206 vehicleCustodyHeader, 207 taskManifestList, 208 circulationSummary, 209 custodyCountList, 211 custodyStepHeader, 212 custodyReveal, 213 custodyCountSubmit, 214 custodyConfirmedList, 215 custodyDiscrepancyList, 219 itemExecutionList, 220 signaturePad, 223 routeFeedHeader, 224 taskFeedList, 225 workspaceHeader, 227 returnHeader, 228 vehicleCargoSummary. (**SEMUA 10 driver page full generic**: DriverHome 1007 + CustodyNotification 1016 + CustodyCount 1025 + CustodyReveal 1035 + CustodySuccess 1042 + MismatchReport 1050 + MismatchSubmitted 1059 + TaskFeed 1066 + DeliveryWorkspace 1071 + ReturnVehicle 1079.) **Base-lib udah generic / dibiarin (jangan diutak):** 88 3LineBorderForm, 192 sendButtonGpsWithEvent, 199 noticeBar, 134 getImages1 (GET_IMAGES, base-lib multi-use, biarin baked).
**Retrofit candidate (baked):** — KOSONG, semua selesai. (217 routeProgressHeaderFull + 218 driverStopCardFull = UNUSED/orphan, 0 usage di col B → dibiarin baked, gak ada page yang render. 229-234,236,237 dihapus; 235 failedReasonGrid keep.)
Tiap widget: cari page usage-nya lewat scan op1Screen col B; konversi page-by-page.

## PRIORITAS: RejectTask + FailedDelivery — reuse generic, hapus dedicated
User correction (2026-06-23): RejectTask (page op1Screen 1086) + FailedDelivery (1093) **gak boleh** punya widget dedicated. Reuse yang udah ada:
| dedicated (HAPUS) | reuse jadi |
|---|---|
| rejectTaskHeader (229), failedDeliveryHeader (233) | **WORKSPACE_HEADER** (`workspaceHeader` 225) |
| rejectNoticeBar (230), failedDeliveryNotice (234) | **NOTICE_BAR** (`noticeBar` 199 — NOT noticeBar2 205; reject/failed notices = simple variant+icon+text, noticeBar2 punya iconAlign/label/title yang gak ada di reject/failed → shape beda) |
| rejectReasonForm (231), failedNoteForm (236) | **3LineBorderForm** |
| rejectTaskSubmit (232), failedSubmit (237) | **sendButtonGpsWithEvent** (RBT savesend) |
| (keep) failedReasonGrid (235) | SELECTABLE_BTN — distinct, biarin |

Langkah: (1) genericin 4 widget reuse itu (workspaceHeader/noticeBar2/3LineBorderForm/sendButtonGpsWithEvent) ke pola SUBSTITUTE kalau belum; (2) di page reject (1086) + failed (1093), ganti col B jadi nama widget generic + isi kolom G+ dengan param reject/failed (search, text, **DSL updateEventRow/addToEvent** masuk kolom); (3) D{r} = SUBSTITUTE chain; (4) verify resolved = sama persis JSON reject/failed yang sekarang; (5) **hapus** Widget rows 229-234, 236, 237 (clear col I+J — JANGAN col A). Cek dulu 229-237 gak dipake page lain (harusnya cuma reject/failed).
DSL submit yang harus ke-preserve: reject = `updateEventRow tst◼load_rejected` + `addToEvent evidence ety◼notes d◼◁5▷`; failed = `updateEventRow tst◼failed` + `addToEvent evidence ety◼notes ec◼◁7▷ d◼◁5▷`.

## Done log
- [x] routeProgressHeader (native)
- [x] navActionCard (2026-06-23)
- [x] inventoryBucketCard (2026-06-23) — DriverHome @ op1Screen 1012, helpers G1012:P1012, 10 placeholders; resolved byte-identical
- [x] workspaceHeader (2026-06-23) — genericized J225 (8 placeholders [VIDTABLE..TEXT]→G:N); updated 3 usages: DeliveryWorkspace 1072, RejectTask 1087, FailedDelivery 1094
- [x] RejectTask reuse (1086) — PRIORITAS DONE. header→workspaceHeader(1087), notice→noticeBar(1088 G:I), form→3LineBorderForm(1089 G:K), submit→sendButtonGpsWithEvent(1090 H:R). Deleted 229-232.
- [x] FailedDelivery reuse (1093) — PRIORITAS DONE. header→workspaceHeader(1094), notice→noticeBar(1095), form→3LineBorderForm(1097), submit→sendButtonGpsWithEvent(1098). Kept failedReasonGrid(1096). Deleted 233,234,236,237.
- [x] preconditionGateCard (2026-06-23) — DriverHome 1011, 18 placeholders G:X; resolved byte-identical (hideZero "TRUE" preserved)
- [x] driverStopCard (2026-06-23) — DriverHome 1013, 15 placeholders G:U; icon/iconLocked kept as literal helper "[ICON]"/"[ICON_LOCKED]"; resolved byte-identical. DriverHome 1007 now fully generic.
- [x] ReturnVehicle page 1079 (2026-06-23, updated 2026-06-25) — returnHeader(1080, 2 ph G:H) + vehicleCargoSummary(1081, **14 ph G:T** — user redesign +item-join: itemTable/itemKey/nameField/unitField/condField/fullValue/emptyValue) + circulationSummary(1082, **13 ph G:S**, +nameField) + noticeBar(1083, 3 ph G:I, generic 199). **rbtCta(1084) = LITERAL/baked DIBIARIN** — savesend `updateEventRow vehicle_check rt◼returned` + chain DO_DIALOG "Kendaraan Diserahkan"; gak ada generic byte-identik (simple rbtCta=nav-only; sendButtonGpsWithEvent 192 nambah addToEvent/fakeGpsAllowed/outPositionAllowed yang JSON ini gak punya). Single-use unik. Resolved byte-identical.
- [x] DeliveryWorkspace page 1071 (2026-06-23) — itemExecutionList(1073, 15 ph G:U) + signaturePad(1074, 3 ph G:I [POSITION][WRITEFIELD][TEXT], `optional:true` baked). Resolved byte-identical. signaturePad RENDERER udah dibangun di dev (memory "deferred" outdated). getImages1(1076) base-lib, dibiarin.
- [x] TaskFeed page 1066 (2026-06-23) — routeFeedHeader(1067, 17 ph G:W; workforceSearch "VID◼" uppercase preserved) + taskFeedList(1068, 16 ph G:V). Resolved byte-identical.
- [x] custodyStepHeader (2026-06-23) — full-genericized J211 (6 ph: was [TEXT]-only). SHARED 5 custody page; updated semua: CustodyCount 1027, CustodyReveal 1036, CustodySuccess 1043 (awalnya INLINE-style D → DIKONVERSI ke helper-col 2026-06-23 biar konsisten, user minta), MismatchReport 1052, MismatchSubmitted 1060. Map: [TEXT]→G (existing), [VIDTABLE]→H,[VEHICLETABLE]→I,[WORKFORCETABLE]→J,[PLATEFIELD]→K,[NAMEFIELD]→L (5 const ditambah). Semua byte-identical. MismatchSubmitted 1059 = full conform skrg.
- [x] custodyConfirmedList (2026-06-23) — CustodySuccess 1045, 6 ph G:L. Byte-identical. CustodySuccess 1042 full conform (row 1046 TXT hidden F≠TRUE, bukan bagian page).
- [x] CustodyNotification page 1016 (2026-06-23) — noticeBar2(1018, 6 ph G:L, full notice variant w/ label+title+iconAlign — DISTINCT dari noticeBar 199) + vehicleCustodyHeader(1019, 11 ph G:Q) + taskManifestList(1020, 16 ph G:V, `route`=[ROUTE:taskDetail] SRC-token preserved) + circulationSummary(1021, **13 ph G:S** — +nameField, re-genericized 2026-06-25). Byte-identical.
- [x] CustodyCount page 1025 (2026-06-24) — custodyCountList(209) full-genericized (was [FILTER]-only → +10 ph; USED 2× row 1030 returnable + 1032 consumable, keep [FILTER]→G, const H:Q) + custodyCountSubmit(213, 6 ph G:L @1033). Byte-identical.
- [x] CustodyReveal page 1035 (2026-06-24) — custodyReveal(1039, 15 ph G:U; matchRoute/mismatchRoute/recountRoute distinct). Byte-identical.
- [x] MismatchReport page 1050 (2026-06-24) — custodyDiscrepancyList(1054, 6 ph G:L). Byte-identical. **LAST baked driver widget.**
- [x] **REFACTOR COMPLETE** — semua 10 driver page full generic+SUBSTITUTE. 217/218 (routeProgressHeaderFull/driverStopCardFull) UNUSED (0 col-B usage) → dibiarin baked, gak ada yang render.
- ⚠️ **Known baked (rendered, sengaja dibiarin):** ReturnVehicle rbtCta(1084) — complex savesend, no byte-identik generic (lihat done-log ReturnVehicle).
- 📝 **J208 circulationSummary = 13-field** (2026-06-25): `vidtable,table,search,itemsField,nameField,txField,dropField,pickupField,saleField,refillField,buyField,excludeStatus,text`. Dipake 1021 (CustodyNotification) + 1082 (ReturnVehicle), dua-duanya helper G:S. J228 vehicleCargoSummary = 14-field (item-join).

### Submit-reuse deltas (USER-APPROVED, NOT byte-identical)
sendButtonGpsWithEvent (192) template forces: `delay:5` (reject/failed dulu 3), `addToTable:""` ditambah, `addToEvent` SEBELUM `updateEventRow` (dulu kebalik). **Note-gate `gateNotePosition`/`minNoteLength` DIHAPUS** (user 2026-06-23: gak perlu, posisi note diatur via 3LineBorderForm `position` + `◁N▷` di DSL). Semua field lain + DSL (`tst◼load_rejected`/`tst◼failed`, `ec◼◁7▷`, `d◼◁5▷`) byte-identical. gpsPosition tetap unquoted number via `"""[GPS_POSITION]"""` trick.
