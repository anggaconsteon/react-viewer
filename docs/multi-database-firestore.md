# Multi-Database Firestore: Login Terpisah dari Data

## Apa yang mau kita capai

Kita mau satu tempat login dipakai bersama, lalu data dipisah per region (Indonesia, India, Amerika). Alasannya dua: data tiap region sebaiknya tinggal di server region itu (residency), dan tiap tenant tidak boleh bisa baca data tenant lain.

Awalnya kita kira caranya adalah bikin project Firestore terpisah: `otq-01` buat login, `authenium-01` buat data. Ternyata jalan itu yang bikin macet. Dokumen ini menjelaskan kenapa macet, dan jalan mana yang sebenarnya lebih sederhana.

## Yang berubah: satu project boleh punya banyak database

Dulu memang satu project Firestore cuma punya satu database `(default)`. Sekarang tidak. Multi-database per project sudah resmi (GA) sejak pertengahan 2024. Satu project bisa punya banyak database, default sampai sekitar 100, bisa minta naik.

Tiap database punya:
- location sendiri (region fisik, dipilih sekali, tidak bisa diganti)
- rules sendiri
- data yang terisolasi dari database lain di project yang sama

Yang penting: token login satu project berlaku ke semua database di project itu. Jadi login sekali, akses banyak database, tanpa tukar token apa pun.

## Desain yang dipakai

Satu project (`otq-01`), dipakai buat login sekaligus data. Datanya dipisah per region pakai database berbeda di dalam project yang sama.

```
otq-01  (1 project)
│
├─ Auth                       login, satu tempat
│
├─ database "indonesia"       location asia-southeast2 (Jakarta)
├─ database "india"           location asia-south1 (Mumbai)
└─ database "america"         location nam5 (US)
```

Residency beres karena tiap database punya location sendiri. Data Indonesia tinggal di Jakarta, data India di Mumbai. Tidak perlu project terpisah cuma buat itu.

Buang `authenium-01`. Dia tidak memberi keuntungan apa-apa untuk kasus ini, cuma nambah kerjaan (token lintas project, dobel login, satu titik tukar token yang rawan).

## Isolasi tenant (bagian keamanan)

Aturan tenant ditegakkan di rules tiap database. Tapi rules cuma bisa baca `tenant_id` kalau nilai itu ada di dalam token, sebagai custom claim. Kalau `tenant_id` cuma disimpan di koleksi `users`, rules tidak melihatnya.

Set custom claim sekali waktu user dibuat atau dipindah-tugaskan, lewat Admin SDK (atau Cloud Function):

```js
await admin.auth().setCustomUserClaims(uid, { tenant_id: 'ABC', region: 'ID' });
```

Setelah itu user logout-login, claim ikut di token. Rules tiap database tinggal mencocokkan:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{col}/{id} {
      allow read, write: if request.auth != null
        && request.auth.token.tenant_id == resource.data.tenant_id;
    }
  }
}
```

Rules tiap database dipasang di `firebase.json`, dideploy per database:

```json
{
  "firestore": [
    { "database": "indonesia", "rules": "rules/indonesia.rules" },
    { "database": "india",     "rules": "rules/india.rules" },
    { "database": "america",   "rules": "rules/america.rules" }
  ]
}
```

```bash
firebase deploy --only firestore:indonesia,firestore:india,firestore:america
```

Soal keamanan, perlu diluruskan satu hal: pisah project tidak bikin auth lebih kuat. Password user tidak pernah ada di Firestore kita, itu dikelola Firebase Auth (Google). Kekuatan isolasi tenant datang dari custom claim + rules + IAM, dan ketiganya jalan penuh di satu project. Pisah project cuma beli pemisahan hak admin (siapa boleh kelola user vs siapa boleh kelola data bisnis), dan itu bisa dicapai lewat IAM tanpa memecah project.

## Langkah implementasi

1. Di console `otq-01`, buka Firestore, klik dropdown `(default)` di samping judul Database, pilih Create database. Buat `indonesia`, `india`, `america`, masing-masing dengan location region yang benar (location tidak bisa diganti nanti).
2. Pasang rules tiap database di `firebase.json`. Pakai `if request.auth != null` dulu biar bisa tes koneksi.
3. Naikkan paket: `cloud_firestore: ^5.4.0`, `firebase_core: ^3.6.0`. Tambah `Db` dan `dbForRegion` di client.
4. Tes: tulis satu dokumen ke database `indonesia`, cek dia muncul di database itu, bukan di `(default)`. Kalau muncul, multi-database sudah jalan.
5. Set custom claim `tenant_id` (Admin SDK) waktu provisioning user.
6. Perketat rules jadi `request.auth.token.tenant_id == resource.data.tenant_id`, deploy ulang.

Tambah region baru nanti = bikin satu database baru + satu entry di `dbForRegion` + deploy rules database itu. Tidak menyentuh project, tidak menyentuh login.
