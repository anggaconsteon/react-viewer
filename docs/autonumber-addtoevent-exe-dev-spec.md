# Dev Spec — autoNumber/exe (`run: generate_number`) + `addToEvent` = write DROP silent

**Tanggal:** 2026-07-06
**Buat:** Flutter dev (renderer — RBT savesend / exe-button pipeline).
**Bug:** Tombol submit yang bawa elemen exe (`run` + `position:251` + NUMBER `generate_number`) DAN `addToEvent` → **nol write ke Firestore, tanpa error** (dialog "Terkirim" tetap muncul). Kombinasi lama exe+`addToTable` jalan; kombinasi baru exe+`addToEvent` mati.

---

## 0. Isolasi (test ladder 2026-07-06, page NewCustomer admin)

| test | perubahan | hasil |
|---|---|---|
| Original | exe + addToEvent + `com:auz` + `cv◼{userVid}` | ❌ nol write |
| A | buang `"com":"auz"` | ❌ nol write |
| B | `cv`/`cn` di-bake literal (bukan token) | ❌ nol write |
| **C** | **buang `position:251` + `run` + styling, tambah `"addToTable":""`, `lv` literal** | ✅ **doc stock_location KETULIS** |

→ `com` bukan penyebab, token `{userVid}` bukan penyebab. **Penyebab di antara elemen exe: `position:251` / `run:"…17:generate_number…"` / referensi `◁17▷` ke NUMBER widget** (belum di-narrow satu-satu; kemungkinan besar jalur exe-button legacy — yang dipakai `SendButtonGpsExeConsteon` — cuma nyambung ke `addToTable`, field `addToEvent` diabaikan).

## 1. Config GAGAL (original, resolved live)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"position":251,"text":"Buat Customer","run":"11:disable◆12:disable◆13:disable◆14:disable◆15:disable◆17:generate_number◆251:disable","action":"savesend", "com":"auz","width":"full", "height":64, "buttonColor":"grey","textColor":"","route":"vertikaTeknoLokaciptaCreateTaskCustomer","delay":5,"gpsPosition":2,"flag":"admin-new-customer","addToEvent":"84214220504259//stock_location⭘r◼4320⭘tablevid◼20342033315492⭘lt◼client⭘c◼◁11▷⭘ln◼◁12▷⭘al◼◁13▷⭘npic◼◁14▷⭘hpic◼◁15▷⭘ty◼admin-new-customer⭘lv◼◁17▷⭘lst◼active⭘cv◼{userVid}⭘cn◼{userName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶","chain":{"type":"DO_DIALOG","title":"Customer dibuat","children":[{"type":"TXT","data":"Terkirim"},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaCreateTaskCustomer"}]}]}}]}
```

Pasangannya di page: widget `NUMBER` `{"type":"NUMBER","text":"No. Customer:◆[DIBUAT OTOMATIS]","template":"CUSTOMER-{{YYYY}}-{{COUNTER(vtl.request,6)}}","executable":"execute1,generate_number","position":17}` — pola persis RequestLeave (`REQ-{{YYYY}}-{{COUNTER}}` + `SendButtonGpsExeConsteon`+`addToTable`, yang JALAN).

## 2. Config JALAN (Test C — beda cuma elemen exe dibuang)

```json
{"type":"RBT","alignment":"spaceevenly","children":[{"text":"Buat Customer","action":"savesend","route":"vertikaTeknoLokaciptaCreateTaskCustomer","delay":5,"gpsPosition":2,"flag":"admin-new-customer","addToTable":"", "addToEvent":"84214220504259//stock_location⭘r◼4320⭘tablevid◼20342033315492⭘lt◼client⭘ty◼◁11▷⭘ln◼◁12▷⭘al◼◁13▷⭘pic◼◁14▷⭘hpic◼◁15▷⭘lv◼TESTCUST999⭘lst◼active⭘cv◼85924392055168⭘cn◼Muhamad Angga⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶","chain":{"type":"DO_DIALOG","title":"Customer dibuat","children":[{"type":"TXT","data":"Terkirim"},{"type":"RBT","alignment":"center","children":[{"text":"Ok","route":"vertikaTeknoLokaciptaCreateTaskCustomer"}]}]}}]}
```

Referensi shape yang sama & kebukti jalan tiap hari: RejectTask driver (RBT savesend + `addToTable:""` + addToEvent + updateEventRow).

## 3. Fix yang diminta

1. **Support `addToEvent` (dan `updateEventRow`) di jalur exe-button**: `run` (`N:generate_number`, `N:disable`) dieksekusi dulu → NUMBER widget position N keisi nomor final → BARU resolve `◁N▷` di addToEvent → write. Sama seperti urutan yang sekarang jalan buat addToTable.
2. **Jangan silent**: kalau ada field submit (addToEvent/addToTable/updateEventRow) yang gak di-handle di suatu jalur, log error — jangan telan. (Kelas bug sama dgn `updateeventrow-star-search-type-dev-spec.md` Fix B.)

## 4. Acceptance

- Config §1 (tanpa `com`, `c`→dibuang, `npic`→`pic`, `ty◼◁11▷`) → submit → doc `stock_location` baru: `lv:"CUSTOMER-2026-000123"` (dari NUMBER), `lt:client`, `ln/al/pic/hpic` dari form, `ty` = pilihan grid, `lst:active`, `t` Number.
- Nomor di layar berubah `[DIBUAT OTOMATIS]` → `CUSTOMER-2026-000123` dan SAMA dgn yang ketulis di `lv`.
- Counter increment (submit ke-2 = 000124, no dupes).
- Regresi: RequestLeave (exe+addToTable) tetap jalan; RejectTask (savesend+addToEvent tanpa exe) tetap jalan.

## 5. Interim yang di-ship sekarang (biar flow jalan tanpa nunggu fix)

Button NewCustomer diganti shape Test C + `lv◼CUST-◀2▶` (epoch-ms, unique). Live di op1Screen master (Widget!J255 `SendButtonGpsExeConsteonEvent` + param N808):

```
addToEvent: 84214220504259//stock_location⭘r◼4320⭘tablevid◼20342033315492⭘lt◼client⭘ty◼◁11▷⭘ln◼◁12▷⭘al◼◁13▷⭘pic◼◁14▷⭘hpic◼◁15▷⭘lv◼CUST-◀2▶⭘lst◼active⭘cv◼{userVid}⭘cn◼{userName}⭘t◼◀2▶⭘ts◼◀2|T7|Ddd MMM yyyy HH:mm:ss▶
```

Setelah fix §3 landing → balikin `run`/`position:251` + `lv◼◁17▷` + counter (ganti namespace ke `vtl.customer` biar gak selang-seling sama REQ/TASK).

## 6. Catatan / belum ke-verify

- `lv◼CUST-◀2▶` = concat literal+token di value addToEvent — kebukti di addToTable (RequestLeave `<30>`), **belum di-test di addToEvent**. Kalau hasilnya literal `CUST-◀2▶` / gagal → fallback `lv◼◀2▶`.
- `cv◼{userVid}⭘cn◼{userName}` = token generic yang di-spec di `customer-namelist-and-creator-token-dev-spec.md` — belum kebukti resolve (Test B & C pakai baked). Kalau doc ketulis tapi `cv`/`cn` kosong/literal `{userVid}` → token itu belum dibangun, refer spec tsb.
- `hpic` (kontak PIC) belum ada di dictionary stock_location — kalau mau kanon, daftarin (dict punya `pic` #10).

---

**Referensi:** `admin-create-task-dev-spec.md` (flow admin yg sama), `customer-namelist-and-creator-token-dev-spec.md` ({userVid}/{userName}), RequestLeave live (`Copy of op1Screen baruu` row 655/660/673 — pola exe+addToTable yang jalan), RejectTask live (op1Screen D695 — savesend+addToEvent yang jalan).
