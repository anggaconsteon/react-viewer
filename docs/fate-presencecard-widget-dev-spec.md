# Fate — `presenceCard` (NEW widget) — DEV SPEC

> **Type:** `PRESENCE_CARD` · **Owner:** Flutter renderer (widget baru) · **Pakai di:** ModelTrack page.
> **Kenapa NEW:** nampilin presence **jujur berjejak** — raw model (kekunci, dicoret kalo dikoreksi) + lapisan "ditetapkan Fate" (efektif + alasan + kapan) — gak ada widget existing yg render dual-layer ini. Sisanya (aksi) = `workflowButtonSheet` existing.

---

## 1. Fungsi
1 model (1 doc `assign`) → render:
- **Hadir** & **Selesai**, masing-masing 2 lapis: raw `ar`/`co` (strikethrough kalo ada corr) + efektif `arc`/`coc` ("ditetapkan Fate" + alasan `arcr`/`cocr` + `arca`/`coca`).
- **Selisih** = `max(0, effComp − e1)`; box amber kalo >0, + flag "jam dasar ditetapkan Fate" kalo `coc` ada.
- **Badge status** dari `st`. Status selisih (`ss`) + no-show (`nst/nn/nat`) kalo ada.
- Tombol aksi = BUKAN di sini (pakai `workflowButtonSheet` sibling, gated `search` per-`st`).

## 2. Config (resolved JSON)
```json
{
  "type": "PRESENCE_CARD",
  "vidtable": "FATEVID",
  "table": "FATETENANT//assign",
  "search": "pv◼{pv}⭘vid◼{vid}",
  "nameField": "mn",
  "statusField": "st",
  "endField": "e1",
  "rawArrField": "ar",  "corrArrField": "arc",  "corrArrReasonField": "arcr", "corrArrAtField": "arca",
  "rawCompField": "co",  "corrCompField": "coc",  "corrCompReasonField": "cocr", "corrCompAtField": "coca",
  "selisihField": "ss",
  "noshowStatusField": "nst", "noshowNoteField": "nn", "noshowAtField": "nat",
  "text": "Hadir◆Selesai◆Dilaporkan model◆selfie◆Efektif◆ditetapkan Fate◆Belum dilaporkan◆Selesai {diff} lewat jadwal◆Jam dasar ditetapkan Fate.◆Fakta terkunci — belum dihitung lembur.◆Selisih menunggu◆Sedang berjalan◆Terjadwal◆Belum konfirmasi◆Tidak hadir◆Batal◆✓ Dikonfirmasi brand◆Brand keberatan"
}
```
Semua label dari `text` ◆-segment [[feedback_config_driven_labels]] — renderer baca by index, JANGAN hardcode.

## 3. Logika render (Flutter)
```
eff(raw,corr) = corr ?? raw
Hadir:  raw ada → "Dilaporkan model {ar} · selfie" (coret kalo arc ada)
        arc ada → "Efektif {arc}" +chip "ditetapkan Fate" + "{arcr} · {fmt(arca)}"
        raw&corr kosong → "Belum dilaporkan"
Selesai: idem pakai co/coc/cocr/coca
selisih = max(0, hm(coc??co) − hm(e1)); >0 → box amber "{diff} lewat jadwal" + (coc? "Jam dasar ditetapkan Fate":"Fakta terkunci…")
badge = map(st): assigned→Belum konfirmasi, scheduled→Terjadwal, present→Sedang berjalan, awaiting→Selisih menunggu, closed→Selesai, noshow→(nst=batal?Batal:Tidak hadir)
ss=confirmed→"✓ Dikonfirmasi brand"; ss=disputed→"Brand keberatan"
nst → box merah (nn + fmt(nat))
```

## 4. Type contract
Raw/corr time = String "HH:MM"; `arca/coca/nat` = Number epoch; `ss/st/nst` = String. Lihat [[project_runtime_type_contract]] + fate-schema-dev-spec.md §5.

## 5. Acceptance
1. `ar` ada, `arc` null → "Dilaporkan model 10:48" normal (gak dicoret), no efektif line.
2. `co`+`coc` → raw dicoret + "Efektif {coc}" + chip + alasan. selisih dari `coc`.
3. `coc` bikin selisih 0 → no box amber, badge closed.
4. `st=noshow` → box merah, `nst` label bener (batal vs tidak_hadir).
5. Semua label dari `text` (ganti sheet → ganti tampilan, no redeploy).

## 6. Staging op1Screen
Renderer BELUM ada → di op1Screen taruh row `presenceCard` dengan **F(Displayed)=FALSE** (ke-exclude dari assembly, app gak liat, no crash [[feedback_config_ahead_of_renderer]]). Flip TRUE pas Flutter build.
