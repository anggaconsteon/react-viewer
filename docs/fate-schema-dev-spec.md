# Fate — Firestore Schema (v2, incl. koreksi + no-show) — DEV SPEC

> Source of truth = `Fate_ops_app_terbaru.jsx`. 3 collection KEYED (addToEvent/updateEventRow, NOT addToTable). Path nested `MobileTable/{tenant}/tables/{tv}/{coll}/{doc}`.
> Prinsip: **fakta mentah model IMMUTABLE**; Fate cuma nambah **lapisan koreksi berjejak** (raw kekunci, corr = additive + alasan wajib + siapa/kapan). Jam efektif + selisih = DERIVED (gak disimpen).

---

## 1. `project/{pv}`
```json
{
  "pv": "PRJ-20260702-001",
  "br": "Bloom Jewelry", "ti": "Editorial — Fine Line",
  "ve": "Studio Nine, SCBD", "d8": "2026-07-02", "s1": "11:00", "e1": "19:00",
  "av": "AG-01", "an": "Fate", "cat": 1751000000000,
  "mv": ["Kirana", "Rani"]
}
```
`mv` = native array model vid (CF fan-out → assign). **`vgeo` {lat,lng} = DEFERRED** (geo nanti).

---

## 2. `assign/{pv}_{vid}` — edge (model × project)
```json
{
  "pv": "PRJ-...", "vid": "Kirana", "mn": "Kirana", "ext": false,

  "br": "Bloom Jewelry", "ti": "Editorial — Fine Line",
  "ve": "Studio Nine, SCBD", "d8": "2026-07-02", "s1": "11:00", "e1": "19:00",

  "st": "awaiting",

  "ar": "10:48", "co": "20:35",
  "ai": "evidence/..arr.jpg", "ci": "evidence/..done.jpg",

  "arc": null, "arcr": null, "arca": null,
  "coc": "19:00", "cocr": "brand konfirmasi kelar 19:00; lapor dari rumah", "coca": 1751030000000,

  "ss": null, "cft": null,
  "nst": null, "nn": null, "nat": null
}
```

| grup | field | tipe | arti |
|---|---|---|---|
| id | `pv`/`vid`/`mn` | String | project vid / model vid / nama denorm |
| flag | `ext` | Bool | model luar roster (ad-hoc, `vid` bisa name-only) |
| snapshot | `br/ti/ve/d8/s1/e1` | String | copy project (Model Home render tanpa baca project) |
| state | `st` | String | assigned·scheduled·ready·present·awaiting·closed·**noshow** |
| **raw** (IMMUTABLE) | `ar`/`co` | String HH:MM | hadir/selesai dilaporkan model |
| | `ai`/`ci` | String | selfie url |
| **koreksi Fate** | `arc`/`coc` | String HH:MM | jam efektif ditetapkan Fate (arrival/completion) |
| | `arcr`/`cocr` | String | alasan koreksi (WAJIB kalo corr diisi) |
| | `arca`/`coca` | Number epoch | kapan dikoreksi |
| selisih | `ss` | String\|null | confirmed·disputed |
| | `cft` | Number epoch | kapan diproses |
| no-show | `nst` | String\|null | tidak_hadir·batal |
| | `nn` | String | catatan |
| | `nat` | Number epoch | kapan ditandai |

**DERIVED (JANGAN simpen):**
```
effArr  = arc || ar
effComp = coc || co
selisih = max(0, hm(effComp) − hm(e1))     # dari EFEKTIF, bukan raw
fateSet = coc != null                        # "jam dasar ditetapkan Fate"
```

---

## 3. `event` — ledger (append-only)
`ty` ∈ `project-create` · `assign-ack` · `arrival` · `done` · **`koreksi`** · `selisih-confirm` · `selisih-dispute` · **`noshow`**. Field: r/tablevid/ty/t/ts/pv/cv/cn/d/i.

---

## 4. Write actions → DSL
KEYED family. Search assign compound `pv★{pv}☆vid★{vid}`.

```
# KOREKSI (baru) — set corr + recompute st, + ledger audit
updateEventRow: {t}//assign⭘…⭘search◼pv★{pv}☆vid★{vid}⭘coc◼◁1▷⭘cocr◼◁2▷⭘coca◼◀2▶⭘st◼{recompute}
addToEvent:     {t}//event⭘…⭘ty◼koreksi⭘pv◼{pv}⭘cv◼{userVid}⭘cn◼{userName}⭘d◼◁2▷
# st recompute: effComp>e1 → awaiting ; else closed (+ reset ss)

# NO-SHOW (baru)
updateEventRow: …⭘st◼noshow⭘nst◼{tidak_hadir|batal}⭘nn◼◁1▷⭘nat◼◀2▶
addToEvent:     …⭘ty◼noshow⭘d◼◁1▷…

# SELISIH (ada)  …⭘st◼closed⭘ss◼{confirmed|disputed}⭘cft◼◀2▶
# CREATE/ACK/ARRIVAL/DONE (ada) — lihat fate-flutter/cf specs
```

---

## 5. Type contract (canonical-on-write [[project_runtime_type_contract]])
- **String**: pv, vid, mn, br, ti, ve, d8, s1, e1, ar, co, arc, coc, arcr, cocr, ss, st, nst, nn, ai, ci
- **Number (epoch)**: cat, arca, coca, cft, nat, `t`
- **Bool**: ext
- **Array<String>**: mv

---

## 6. Delta vs v1
Nambah: `ext`, koreksi (`arc/arcr/arca/coc/cocr/coca`), no-show (`nst/nn/nat`), st `noshow`. Derived effArr/effComp/selisih pakai koreksi. Geo (`vgeo`) DEFER. CF onProjectCreate (fan-out mv[]) TAK berubah.
