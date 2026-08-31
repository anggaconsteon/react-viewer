/**
 * AUTSORZ — Cleaning Work Flow (Worker) · v4
 * ══════════════════════════════════════════════════════════════════════
 * DUA CATATAN TERPISAH, tiap sisi boleh BANYAK FOTO (1 wajib, maks 5).
 *
 *   Beranda
 *     └─ [Scan QR] ──► FORM 1 · foto awal (1–5) + keterangan → KIRIM, terkunci
 *                            ↓  jeda nyata: 25–40 menit kerja,
 *                               HP masuk saku, app boleh ditutup
 *        kartu beranda ──► FORM 2 · centang + foto akhir (1–5) + keterangan
 *                                                            → KIRIM, terkunci & tutup
 *
 * Kenapa dua form, bukan satu:
 * Foto awal jam 08:14 SUDAH jadi fakta jam 08:14. Menahannya di memori sampai
 * submit jam 08:47 melanggar "tangkap aksi worker apapun kondisinya".
 *
 * Kenapa tidak tiga:
 * Memisah langkah hanya berguna kalau ada JEDA WAKTU nyata di antaranya.
 * Centang dan foto akhir terjadi di menit yang sama.
 *
 * Kenapa jumlah foto tidak simetris (dan itu disengaja):
 * Foto awal = TEMUAN — tiap foto masalah yang beda (lantai banjir, wastafel
 * numpuk, kloset mampet). Foto akhir = KONFIRMASI — satu bidikan agak jauh
 * biasanya cukup. Dua jenis benda yang beda sifat, jadi TIDAK dipasangkan
 * satu-satu dan sistem TIDAK menuntut simetri (3 awal : 1 akhir = sah).
 *
 * Aturan foto:
 * - Foto pertama lewat alur normal; foto ke-2 dst harus lewat tap "+" eksplisit.
 *   Gesekan itu yang mengerem jumlah, bukan angka batasnya. Maks 5 = rambu teknis.
 * - Foto PERTAMA tampil besar: dia yang jadi wajah catatan di timeline & mata
 *   klien, jadi worker sadar mana yang dilihat orang.
 * - Hapus foto HANYA sebelum kirim. Setelah terkunci, tombol hapus tidak ada.
 * - Urutan foto = urutan waktu = bagian dari cerita. Tidak bisa digeser.
 * - Tiap foto bawa jam & GPS-nya sendiri, bukan satu jam untuk segrup.
 * - TIDAK ada slider overlay before/after: dengan jumlah & sudut yang beda,
 *   menumpuk dua gambar bukan komparasi — itu bikin bingung. Pakai tab per sisi.
 *
 * Keputusan lain:
 * - Centang didraft lokal tiap tap. Draft BUKAN fakta — baru terkunci saat kirim.
 * - Kunjungan yang tidak dilanjutkan TIDAK ditutup otomatis. Sistem tidak menebak.
 * - Boleh beberapa kunjungan terbuka sekaligus. Pindah titik = buat baru.
 * - Centang boleh kosong; foto akhir wajib. Sistem tidak punya daftar "seharusnya".
 * - Tingkat bukti jujur: QR = kuat, lokasi diketik = lemah.
 * - Label netral "kondisi awal / akhir" — foto membuktikan worker TIBA,
 *   bukan ruangan BERSIH.
 * - Tidak ada review/approval di alur ini. Kirim = terkunci.
 */

import React, { useMemo, useRef, useState } from "react";

const MAX_FOTO = 5;

/* ══════════════════════════════════════════════════════════════
   TOKENS
   ══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.cw, .cw * { box-sizing:border-box; margin:0; padding:0; }
.cw {
  --blue:#2563EB; --blue-light:#DBEAFE;
  --green:#16A34A; --green-light:#DCFCE7; --green-mid:#86EFAC;
  --amber:#D97706; --amber-light:#FEF3C7; --amber-mid:#FCD34D;
  --red:#DC2626; --red-light:#FEE2E2;
  --g0:#F9FAFB; --g1:#F3F4F6; --g2:#E5E7EB; --g3:#D1D5DB;
  --g4:#9CA3AF; --g5:#6B7280; --g6:#374151; --g7:#1F2937; --g8:#111827;
  --white:#fff;
  --r-sm:8px; --r-md:12px; --r-lg:18px;
  --font:'DM Sans',system-ui,sans-serif; --mono:'DM Mono',monospace;
  font-family:var(--font); -webkit-font-smoothing:antialiased;
}

/* device frame — hapus kalau ditanam di app asli */
.cw-device { width:393px; background:var(--g8); border-radius:52px; padding:14px;
  box-shadow:0 0 0 1px rgba(255,255,255,.06), 0 40px 80px rgba(0,0,0,.55); margin:0 auto; }
.cw-notch { width:120px; height:30px; background:var(--g8); border-radius:0 0 22px 22px; margin:0 auto 4px; }
.cw-screen { background:var(--white); border-radius:40px; overflow:hidden; height:788px;
  display:flex; flex-direction:column; position:relative; }

.cw-status { height:40px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between;
  padding:0 24px; font-family:var(--mono); font-size:12px; font-weight:500; color:var(--g7); }
.cw-status.dark { color:rgba(255,255,255,.9); }
.cw-signal { display:flex; align-items:center; gap:5px; font-size:10px; color:var(--g5); }
.cw-status.dark .cw-signal { color:rgba(255,255,255,.5); }

.cw-body { flex:1; overflow-y:auto; scrollbar-width:none; }
.cw-body::-webkit-scrollbar { display:none; }

/* ── toast ─────────────────────────────────────────────── */
.cw-toast { position:absolute; bottom:18px; left:14px; right:14px; z-index:50;
  background:var(--g8); color:#fff; border-radius:var(--r-md); padding:11px 13px;
  display:flex; gap:9px; align-items:flex-start; box-shadow:0 8px 24px rgba(0,0,0,.28);
  animation:cwIn .2s ease; }
@keyframes cwIn { from { transform:translateY(8px); opacity:0 } to { transform:none; opacity:1 } }
.cw-toast b { font-size:13px; font-weight:600; display:block; }
.cw-toast span { font-size:11.5px; color:rgba(255,255,255,.68); line-height:1.4; }

/* ── beranda ───────────────────────────────────────────── */
.cw-hero { background:var(--g8); padding:2px 18px 18px; flex-shrink:0; }
.cw-hello { font-size:12.5px; color:var(--g4); }
.cw-name { font-size:21px; font-weight:600; color:#fff; line-height:1.2; margin-top:1px; }
.cw-herometa { font-size:11.5px; color:var(--g4); font-family:var(--mono); margin-top:3px; }

.cw-cta { margin:14px 16px 4px; width:calc(100% - 32px); padding:16px; border-radius:var(--r-md);
  border:none; background:var(--blue); color:#fff; font-family:var(--font); font-size:15.5px;
  font-weight:600; display:flex; align-items:center; justify-content:center; gap:9px; cursor:pointer; }
.cw-cta:active { transform:scale(.985); }

.cw-sect { font-size:11px; font-weight:700; color:var(--g4); letter-spacing:.08em;
  text-transform:uppercase; padding:18px 16px 8px; }

.cw-vcard { margin:0 16px 10px; border:1px solid var(--g2); border-radius:var(--r-md);
  padding:12px; cursor:pointer; background:var(--white); text-align:left; width:calc(100% - 32px);
  font-family:var(--font); display:block; }
.cw-vcard:active { background:var(--g0); }
.cw-vcard.stale { border-color:var(--amber-mid); background:#FFFCF3; }
.cw-vcard.done { background:var(--g0); }
.cw-vtop { display:flex; align-items:flex-start; gap:10px; }
.cw-vico { width:34px; height:34px; border-radius:var(--r-sm); background:var(--g1);
  display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
.cw-vroom { font-size:14.5px; font-weight:600; color:var(--g8); line-height:1.25; }
.cw-vmeta { font-size:11.5px; color:var(--g5); margin-top:2px; }
.cw-vchip { font-size:10px; font-weight:700; padding:3px 7px; border-radius:20px; flex-shrink:0;
  letter-spacing:.02em; }
.cw-vchip.next { background:var(--blue-light); color:var(--blue); }
.cw-vchip.ok { background:var(--green-light); color:var(--green); }

.cw-steps { display:flex; align-items:center; gap:0; margin-top:11px; }
.cw-dot { width:9px; height:9px; border-radius:50%; background:var(--g2); flex-shrink:0; }
.cw-dot.on { background:var(--green); }
.cw-dot.now { background:var(--blue); box-shadow:0 0 0 3px var(--blue-light); }
.cw-seg { height:2px; flex:1; background:var(--g2); }
.cw-seg.on { background:var(--green); }
.cw-steplbl { display:flex; justify-content:space-between; margin-top:5px; }
.cw-steplbl span { font-size:9.5px; color:var(--g4); font-weight:500; }

.cw-vfoot { display:flex; align-items:center; justify-content:space-between; gap:8px;
  margin-top:10px; padding-top:9px; border-top:1px solid var(--g1); }
.cw-sync { font-size:10.5px; color:var(--g4); font-family:var(--mono); }
.cw-go { font-size:12.5px; font-weight:600; color:var(--blue); }
.cw-warn { margin-top:9px; font-size:11px; color:#92400E; line-height:1.45;
  background:var(--amber-light); border-radius:6px; padding:7px 9px; }
.cw-draftchip { margin-top:9px; font-size:11px; color:var(--blue); line-height:1.45;
  background:var(--blue-light); border-radius:6px; padding:7px 9px; }
.cw-weakchip { font-size:9.5px; font-weight:700; color:var(--amber); background:var(--amber-light);
  padding:2px 6px; border-radius:4px; margin-left:6px; }

.cw-empty { margin:8px 16px; border:1.5px dashed var(--g2); border-radius:var(--r-md);
  padding:26px 18px; text-align:center; }
.cw-empty p { font-size:12.5px; color:var(--g5); line-height:1.55; }

/* ── header form ───────────────────────────────────────── */
.cw-nav { flex-shrink:0; padding:2px 16px 10px; display:flex; align-items:center; gap:10px; }
.cw-iconbtn { width:34px; height:34px; border:none; background:var(--g1); border-radius:var(--r-sm);
  font-size:16px; color:var(--g7); cursor:pointer; flex-shrink:0; }
.cw-nav h1 { font-size:16.5px; font-weight:600; color:var(--g8); line-height:1.2; }
.cw-nav p { font-size:11.5px; color:var(--g5); margin-top:1px; }
.cw-prev { flex-shrink:0; margin:0 16px 12px; font-size:11.5px; color:var(--g5);
  display:flex; align-items:flex-start; gap:7px; line-height:1.45; }
.cw-prev b { font-family:var(--mono); font-weight:500; color:var(--g6); }
.cw-remind { margin:0 16px 12px; background:var(--amber-light); border:1px solid var(--amber-mid);
  border-radius:var(--r-sm); padding:8px 11px; font-size:11.5px; color:#92400E; line-height:1.45; }

/* ── gerbang ───────────────────────────────────────────── */
.cw-gate { margin:0 16px 16px; border:2px dashed var(--g3); border-radius:var(--r-lg);
  padding:22px 18px; text-align:center; background:var(--g0); }
.cw-gate-icon { font-size:34px; line-height:1; }
.cw-gate h2 { font-size:16px; font-weight:600; color:var(--g8); margin:10px 0 4px; }
.cw-gate p { font-size:12.5px; color:var(--g5); line-height:1.5; max-width:270px; margin:0 auto 16px; }
.cw-gate-done { margin:0 16px 4px; border-radius:var(--r-md); padding:12px 14px; border:1px solid; }
.cw-gate-strong { background:var(--green-light); border-color:var(--green-mid); }
.cw-gate-weak { background:var(--amber-light); border-color:var(--amber-mid); }
.cw-gate-room { font-size:15px; font-weight:600; color:var(--g8); }
.cw-gate-meta { font-size:11.5px; color:var(--g6); margin-top:2px; }
.cw-gate-note { font-size:11px; color:#92400E; line-height:1.45; margin-top:8px;
  border-top:1px dashed var(--amber-mid); padding-top:8px; }
.cw-manual { text-align:left; border-top:1px solid var(--g2); margin-top:16px; padding-top:14px; }
.cw-manual label { display:block; font-size:11px; font-weight:600; letter-spacing:.06em;
  text-transform:uppercase; color:var(--g4); margin-bottom:6px; }
.cw-chips { display:flex; flex-wrap:wrap; gap:6px; }
.cw-chip { padding:7px 12px; border-radius:20px; font-size:12.5px; font-weight:500; font-family:var(--font);
  border:1.5px solid var(--g2); background:var(--white); color:var(--g6); cursor:pointer; }
.cw-chip.on { border-color:var(--blue); background:var(--blue-light); color:var(--blue); font-weight:600; }

/* ── seksi ─────────────────────────────────────────────── */
.cw-sec { padding:0 16px 16px; }
.cw-sec.locked { opacity:.36; pointer-events:none; filter:grayscale(.4); }
.cw-sec-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
.cw-sec-title { font-size:14px; font-weight:600; color:var(--g8); }
.cw-req { font-size:10px; font-weight:700; color:var(--red); background:var(--red-light);
  padding:2px 6px; border-radius:4px; letter-spacing:.03em; }
.cw-opt { font-size:10px; font-weight:600; color:var(--g5); background:var(--g1);
  padding:2px 6px; border-radius:4px; letter-spacing:.03em; }

/* ── foto: kotak kosong ────────────────────────────────── */
.cw-photo { width:100%; min-height:172px; border-radius:var(--r-md); border:2px dashed var(--g3);
  background:var(--g0); display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:6px; cursor:pointer; position:relative; overflow:hidden; font-family:var(--font); }
.cw-photo:active { border-color:var(--blue); background:var(--blue-light); }
.cw-photo.wajib { border-color:var(--amber-mid); background:#FFFDF6; }
.cw-photo-ico { font-size:30px; }
.cw-photo-hint { font-size:13.5px; font-weight:600; color:var(--g6); }
.cw-photo-sub { font-size:11px; color:var(--g4); }

/* ── foto: yang utama (pertama) ────────────────────────── */
.cw-main { width:100%; height:200px; border-radius:var(--r-md); overflow:hidden; position:relative;
  border:1px solid var(--g2); cursor:pointer; }
.cw-main img { width:100%; height:100%; object-fit:cover; display:block; }
.cw-main .fake { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:44px; }
.cw-pill { position:absolute; top:8px; left:8px; font-size:9.5px; font-weight:700; letter-spacing:.05em;
  padding:3px 7px; border-radius:4px; color:#fff; }
.cw-utama { position:absolute; top:8px; right:8px; font-size:9px; font-weight:700; letter-spacing:.04em;
  padding:3px 7px; border-radius:4px; background:rgba(0,0,0,.55); color:#fff; }
.cw-stamp { position:absolute; bottom:0; left:0; right:0; padding:8px 10px; display:flex;
  align-items:center; justify-content:space-between; gap:8px;
  background:linear-gradient(transparent, rgba(0,0,0,.72)); }
.cw-stamp span { font-family:var(--mono); font-size:10.5px; color:#fff; }
.cw-hapus { border:none; background:rgba(255,255,255,.92); color:var(--red); font-family:var(--font);
  font-size:11px; font-weight:600; padding:5px 10px; border-radius:6px; cursor:pointer; }

/* ── foto: strip thumbnail ─────────────────────────────── */
.cw-strip { display:flex; gap:8px; align-items:center; margin-top:8px; }
.cw-thumb { width:56px; height:56px; border-radius:var(--r-sm); overflow:hidden; position:relative;
  flex-shrink:0; border:1px solid var(--g2); }
.cw-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.cw-thumb .fake { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:22px; }
.cw-thumb-n { position:absolute; bottom:2px; left:3px; font-family:var(--mono); font-size:9px;
  color:#fff; text-shadow:0 1px 2px rgba(0,0,0,.8); }
.cw-x { position:absolute; top:2px; right:2px; width:17px; height:17px; border-radius:50%;
  background:rgba(0,0,0,.62); color:#fff; font-size:10px; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center; padding:0; }
.cw-add { width:56px; height:56px; border-radius:var(--r-sm); border:1.5px dashed var(--g3);
  background:var(--g0); color:var(--g5); font-size:20px; flex-shrink:0; cursor:pointer;
  display:flex; align-items:center; justify-content:center; font-family:var(--font); }
.cw-count { font-family:var(--mono); font-size:11px; color:var(--g4); margin-left:auto; flex-shrink:0; }
.cw-maks { font-size:10.5px; color:var(--g4); line-height:1.35; max-width:120px; }
.cw-sample { display:block; margin:8px auto 0; background:none; border:none; font-family:var(--font);
  font-size:11px; color:var(--blue); text-decoration:underline; cursor:pointer; }

.cw-note { width:100%; margin-top:10px; border:1px solid var(--g2); border-radius:var(--r-sm);
  padding:11px 12px; font-family:var(--font); font-size:13.5px; color:var(--g7);
  resize:none; height:66px; background:var(--white); }
.cw-note:focus { outline:none; border-color:var(--blue); }

/* ── checklist ─────────────────────────────────────────── */
.cw-prog { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
.cw-prog b { font-family:var(--mono); font-size:12px; font-weight:500; color:var(--g5); }
.cw-track { height:6px; background:var(--g1); border-radius:3px; overflow:hidden; display:flex; }
.cw-fill { height:100%; transition:width .25s ease; }
.cw-legend { font-size:10.5px; color:var(--g4); margin-top:6px; line-height:1.4; }
.cw-list { border:1px solid var(--g2); border-radius:var(--r-md); overflow:hidden; margin-top:12px; }
.cw-item { display:flex; align-items:flex-start; gap:11px; padding:13px 12px; border-bottom:1px solid var(--g1); }
.cw-item:last-child { border-bottom:none; }
.cw-box { width:24px; height:24px; border-radius:7px; border:2px solid var(--g3); background:var(--white);
  flex-shrink:0; cursor:pointer; display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:700; color:#fff; padding:0; }
.cw-box.done { background:var(--green); border-color:var(--green); }
.cw-box.na { background:var(--g4); border-color:var(--g4); font-size:9px; letter-spacing:-.02em; }
.cw-box.skip { background:var(--amber); border-color:var(--amber); }
.cw-item-txt { flex:1; min-width:0; }
.cw-item-name { font-size:13.5px; font-weight:500; color:var(--g8); line-height:1.35; }
.cw-item-name.muted { color:var(--g4); text-decoration:line-through; }
.cw-item-hint { font-size:11px; color:var(--g4); margin-top:2px; }
.cw-tag { font-size:10px; font-weight:700; padding:1px 5px; border-radius:3px; margin-left:6px;
  vertical-align:1px; text-decoration:none; display:inline-block; }
.cw-more { border:none; background:none; color:var(--g3); font-size:17px; cursor:pointer;
  padding:0 2px; flex-shrink:0; line-height:1; }
.cw-opts { display:flex; gap:6px; padding:0 12px 12px 47px; }
.cw-opt-btn { flex:1; padding:8px 4px; border-radius:var(--r-sm); border:1px solid var(--g2);
  background:var(--white); font-family:var(--font); font-size:11.5px; font-weight:600;
  color:var(--g6); cursor:pointer; }
.cw-draft { font-size:10.5px; color:var(--g4); text-align:center; margin-top:10px; font-family:var(--mono); }

/* ── tombol & bar ──────────────────────────────────────── */
.cw-btn { width:100%; padding:14px; border-radius:var(--r-md); border:none; cursor:pointer;
  font-family:var(--font); font-size:15px; font-weight:600; display:flex; align-items:center;
  justify-content:center; gap:8px; }
.cw-btn:active { transform:scale(.985); }
.cw-btn:disabled { cursor:not-allowed; }
.cw-primary { background:var(--blue); color:#fff; }
.cw-success { background:var(--green); color:#fff; }
.cw-btn.off { background:var(--g2); color:var(--g4); }
.cw-ghost { background:none; border:none; color:var(--blue); font-family:var(--font);
  font-size:12.5px; font-weight:600; cursor:pointer; padding:10px; width:100%; }
.cw-bar { flex-shrink:0; padding:11px 16px 20px; border-top:1px solid var(--g1); background:var(--white); }
.cw-why { font-size:11px; color:var(--g4); text-align:center; margin-top:7px; line-height:1.45; }

/* ── ringkasan ─────────────────────────────────────────── */
.cw-lock-hero { text-align:center; padding:24px 20px 18px; }
.cw-lock-ico { width:56px; height:56px; border-radius:50%; background:var(--green-light);
  display:flex; align-items:center; justify-content:center; font-size:26px; margin:0 auto 12px; }
.cw-lock-hero h2 { font-size:19px; font-weight:600; color:var(--g8); }
.cw-lock-hero p { font-size:12.5px; color:var(--g5); margin-top:4px; line-height:1.5; }
.cw-card { margin:0 16px 12px; border:1px solid var(--g2); border-radius:var(--r-md); overflow:hidden; }
.cw-row { display:flex; justify-content:space-between; gap:12px; padding:10px 12px; border-bottom:1px solid var(--g1); }
.cw-row:last-child { border-bottom:none; }
.cw-k { font-size:12px; color:var(--g5); flex-shrink:0; }
.cw-v { font-size:12px; font-weight:500; color:var(--g8); text-align:right; }
.cw-pair { display:flex; gap:8px; padding:12px; }
.cw-stack { flex:1; position:relative; border-radius:var(--r-sm); overflow:hidden; height:104px;
  cursor:pointer; border:1px solid var(--g2); }
.cw-stack img { width:100%; height:100%; object-fit:cover; display:block; }
.cw-stack .fake { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:32px; }
.cw-badge { position:absolute; bottom:6px; right:6px; background:rgba(0,0,0,.72); color:#fff;
  font-size:10px; font-weight:700; padding:3px 8px; border-radius:20px; }
.cw-tapall { text-align:center; font-size:10.5px; color:var(--g4); padding:0 12px 10px; }

.cw-jejak { margin:0 16px 12px; }
.cw-jrow { display:flex; gap:10px; align-items:flex-start; }
.cw-jline { display:flex; flex-direction:column; align-items:center; width:16px; flex-shrink:0; }
.cw-jdot { width:9px; height:9px; border-radius:50%; background:var(--green); margin-top:4px; }
.cw-jbar { width:2px; flex:1; background:var(--g2); min-height:18px; margin:2px 0; }
.cw-jt { font-family:var(--mono); font-size:10.5px; color:var(--g4); }
.cw-jl { font-size:12.5px; color:var(--g7); font-weight:500; }
.cw-immutable { margin:0 16px 18px; font-size:11px; color:var(--g4); line-height:1.55; text-align:center; }

/* ── viewer layar penuh ────────────────────────────────── */
.cw-viewer { position:absolute; inset:0; z-index:90; background:#0B1220;
  display:flex; flex-direction:column; border-radius:40px; overflow:hidden; }
.cw-vhead { display:flex; gap:6px; padding:14px 14px 10px; align-items:center; }
.cw-vtab { flex:1; padding:8px 6px; border-radius:20px; border:1px solid rgba(255,255,255,.16);
  background:rgba(255,255,255,.06); color:rgba(255,255,255,.72); font-size:12px; font-weight:600;
  font-family:var(--font); cursor:pointer; }
.cw-vtab.on { background:#fff; color:var(--g8); border-color:#fff; }
.cw-vclose { width:34px; height:34px; border-radius:50%; border:1px solid rgba(255,255,255,.16);
  background:rgba(255,255,255,.06); color:#fff; font-size:15px; cursor:pointer; flex-shrink:0; }
.cw-vstage { flex:1; display:flex; align-items:center; justify-content:center;
  padding:4px 14px 8px; min-height:0; }
.cw-vstage img { max-width:100%; max-height:100%; object-fit:contain; border-radius:var(--r-md); }
.cw-vfake { width:100%; height:100%; border-radius:var(--r-md); display:flex;
  align-items:center; justify-content:center; font-size:88px; }
.cw-vwfoot { padding:12px 14px 22px; display:block; }
.cw-vnav { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.cw-varr { width:42px; height:42px; border-radius:50%; border:1px solid rgba(255,255,255,.18);
  background:rgba(255,255,255,.08); color:#fff; font-size:17px; cursor:pointer; flex-shrink:0; }
.cw-varr:disabled { opacity:.28; cursor:not-allowed; }
.cw-vwmeta { text-align:center; flex:1; min-width:0; }
.cw-vwmeta b { display:block; font-size:12.5px; font-weight:600; color:#fff; }
.cw-vwmeta span { font-family:var(--mono); font-size:10.5px; color:rgba(255,255,255,.55); }
.cw-vdots { display:flex; gap:5px; justify-content:center; margin-top:12px; }
.cw-vdot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,.25); }
.cw-vdot.on { background:#fff; }

/* ── strip demo (buang di produksi) ───────────────────── */
.cw-demo { width:393px; margin:12px auto 0; display:flex; align-items:center; gap:8px;
  padding:9px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
  border-radius:10px; }
.cw-demo span { font-family:var(--mono); font-size:10px; color:rgba(255,255,255,.45);
  letter-spacing:.08em; flex-shrink:0; }
.cw-demo button { flex:1; padding:6px; border-radius:6px; border:1px solid rgba(255,255,255,.14);
  background:rgba(255,255,255,.06); color:rgba(255,255,255,.75); font-family:var(--font);
  font-size:11px; font-weight:600; cursor:pointer; }
.cw-demo button.on { background:var(--amber); border-color:var(--amber); color:#fff; }
`;

/* ══════════════════════════════════════════════════════════════
   TEMPLATE CHECKLIST — menempel ke KATEGORI, bukan ruangan.
   ══════════════════════════════════════════════════════════════ */
const KATEGORI = [
    {
        id: "restroom", label: "Restroom", icon: "🚽", samples: ["🚿", "🚰", "🧻"], items: [
            { id: "r1", name: "Sapu & pel lantai", hint: "Pakai cairan disinfektan" },
            { id: "r2", name: "Sikat kloset & urinoir", hint: "Lanjut tablet biru" },
            { id: "r3", name: "Bersihkan wastafel & cermin", hint: "Lap kering biar tidak belang" },
            { id: "r4", name: "Isi ulang sabun & tisu", hint: "Stok dari gudang B-12" },
            { id: "r5", name: "Buang sampah & ganti liner", hint: "" },
            { id: "r6", name: "Semprot pengharum ruangan", hint: "" }]
    },
    {
        id: "pantry", label: "Pantry", icon: "🍽️", samples: ["🍽️", "🥤", "🗑️"], items: [
            { id: "p1", name: "Lap meja & kursi", hint: "" },
            { id: "p2", name: "Cuci & rapikan peralatan", hint: "" },
            { id: "p3", name: "Bersihkan sink & keran", hint: "" },
            { id: "p4", name: "Lap pintu kulkas & dispenser", hint: "" },
            { id: "p5", name: "Buang sampah & ganti liner", hint: "" }]
    },
    {
        id: "public", label: "Public area", icon: "🏢", samples: ["🏢", "🛗", "🛋️"], items: [
            { id: "u1", name: "Sapu & pel lantai lobi", hint: "" },
            { id: "u2", name: "Lap meja resepsionis", hint: "" },
            { id: "u3", name: "Bersihkan kaca pintu & lift", hint: "Hati-hati bekas jari" },
            { id: "u4", name: "Rapikan sofa & majalah", hint: "" },
            { id: "u5", name: "Buang sampah", hint: "" }]
    },
    {
        id: "work", label: "Work area", icon: "🖥️", samples: ["🖥️", "🪑", "🗑️"], items: [
            { id: "w1", name: "Sapu & pel area kerja", hint: "" },
            { id: "w2", name: "Lap meja & partisi", hint: "" },
            { id: "w3", name: "Kosongkan tempat sampah", hint: "" },
            { id: "w4", name: "Bersihkan kaca dalam", hint: "" }]
    },
    {
        id: "outdoor", label: "Outdoor", icon: "🌳", samples: ["🌳", "🅿️", "🚮"], items: [
            { id: "o1", name: "Sapu halaman & area parkir", hint: "" },
            { id: "o2", name: "Bersihkan saluran air", hint: "" },
            { id: "o3", name: "Angkut sampah ke TPS", hint: "" },
            { id: "o4", name: "Siram tanaman", hint: "" }]
    },
];

const kat = (id) => KATEGORI.find((k) => k.id === id);

const QR_PAYLOAD = {
    room: "Toilet Pria — Lt. 5",
    categoryId: "restroom",
    site: "Gedung Jamsostek · Blok B",
    code: "AZ-JMS-R05-02",
};
const GPS = { lat: -6.2251, lng: 106.8283, acc: 8 };
const STALE_MIN = 45; // ambang "belum dilanjutkan" — tampilan saja, bukan penutupan

/* ══════════════════════════════════════════════════════════════
   UTIL
   ══════════════════════════════════════════════════════════════ */
const jam = (d) =>
    d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "—";

const menitLalu = (d) => Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));

const rentang = (a, b) => {
    if (!a || !b) return "—";
    const m = Math.max(0, Math.round((b - a) / 60000));
    return m < 60 ? `${m} menit` : `${Math.floor(m / 60)} jam ${m % 60} menit`;
};

const lamanya = (m) => (m < 60 ? `${m} menit` : `${Math.floor(m / 60)} jam ${m % 60} mnt`);

const hitung = (marks, items) => {
    let done = 0, na = 0, skip = 0;
    items.forEach((i) => {
        if (marks[i.id] === "done") done++;
        else if (marks[i.id] === "na") na++;
        else if (marks[i.id] === "skip") skip++;
    });
    return { done, na, skip, handled: done + na, total: items.length };
};

/* gambar satu foto — pakai <img> kalau ada, kalau demo pakai gradien + emoji */
const Gambar = ({ foto, isBefore, kelas = "fake" }) =>
    foto.url ? (
        <img src={foto.url} alt="" />
    ) : (
        <div className={kelas} style={{
            background: isBefore
                ? "linear-gradient(135deg,#e0e7ef,#bcc8d9)"
                : "linear-gradient(135deg,#d1fae5,#a7f3d0)"
        }}>{foto.fake}</div>
    );

/* ══════════════════════════════════════════════════════════════
   GRUP FOTO — foto pertama besar, sisanya strip thumbnail
   ══════════════════════════════════════════════════════════════ */
function PhotoGroup({ slot, samples = [], photos, setPhotos, sorot }) {
    const inputRef = useRef(null);
    const isBefore = slot === "before";
    const tone = isBefore ? "#6B7280" : "#16A34A";
    const label = isBefore ? "KONDISI AWAL" : "KONDISI AKHIR";
    const penuh = photos.length >= MAX_FOTO;

    const pick = (e) => {
        const files = Array.from(e.target.files || []);
        e.target.value = "";
        if (!files.length) return;
        const sisa = MAX_FOTO - photos.length;
        setPhotos([
            ...photos,
            ...files.slice(0, sisa).map((f) => ({ url: URL.createObjectURL(f), at: new Date(), fake: null })),
        ]);
    };

    const contoh = () => {
        if (penuh) return;
        const bank = isBefore ? (samples.length ? samples : ["🚿"]) : ["✨", "🧼", "🪣"];
        setPhotos([...photos, { url: null, at: new Date(), fake: bank[photos.length % bank.length] }]);
    };

    const hapus = (i) => setPhotos(photos.filter((_, j) => j !== i));

    return (
        <div>
            <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple
                style={{ display: "none" }} onChange={pick} />

            {photos.length === 0 ? (
                <>
                    <div className={`cw-photo${sorot ? " wajib" : ""}`} onClick={() => inputRef.current?.click()}
                        role="button" aria-label={`Ambil ${label.toLowerCase()}`}>
                        <div className="cw-pill" style={{ background: tone }}>{label}</div>
                        <div className="cw-photo-ico">📷</div>
                        <div className="cw-photo-hint">
                            {isBefore ? "Foto sebelum dikerjakan" : "Foto setelah dikerjakan"}
                        </div>
                        <div className="cw-photo-sub">Wajib · jam & GPS ikut terekam</div>
                    </div>
                    <button className="cw-sample" onClick={contoh}>pakai foto contoh (demo)</button>
                </>
            ) : (
                <>
                    <div className="cw-main" onClick={() => !penuh && inputRef.current?.click()}>
                        <Gambar foto={photos[0]} isBefore={isBefore} />
                        <div className="cw-pill" style={{ background: tone }}>{label}</div>
                        <div className="cw-utama">FOTO UTAMA</div>
                        <div className="cw-stamp">
                            <span>{jam(photos[0].at)} · GPS {GPS.lat}, {GPS.lng}</span>
                            <button className="cw-hapus"
                                onClick={(e) => { e.stopPropagation(); hapus(0); }}>Hapus</button>
                        </div>
                    </div>

                    <div className="cw-strip">
                        {photos.slice(1).map((f, i) => (
                            <div className="cw-thumb" key={i}>
                                <Gambar foto={f} isBefore={isBefore} />
                                <span className="cw-thumb-n">{jam(f.at)}</span>
                                <button className="cw-x" aria-label="Hapus foto"
                                    onClick={() => hapus(i + 1)}>✕</button>
                            </div>
                        ))}
                        {!penuh ? (
                            <button className="cw-add" aria-label="Tambah foto"
                                onClick={() => inputRef.current?.click()}>＋</button>
                        ) : (
                            <span className="cw-maks">Maksimal {MAX_FOTO} foto</span>
                        )}
                        <span className="cw-count">{photos.length}/{MAX_FOTO}</span>
                    </div>

                    {!penuh && <button className="cw-sample" onClick={contoh}>+ foto contoh (demo)</button>}
                </>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   VIEWER LAYAR PENUH — tab per sisi, geser antar foto dalam sisi
   ══════════════════════════════════════════════════════════════ */
function Viewer({ visit, sisi, setSisi, idx, setIdx, onClose }) {
    const daftar = sisi === "awal" ? visit.awal.photos : visit.akhir.photos;
    const foto = daftar[Math.min(idx, daftar.length - 1)];
    const isBefore = sisi === "awal";
    const ket = sisi === "awal" ? visit.awal.note : visit.akhir.note;

    const pindah = (s) => { setSisi(s); setIdx(0); };

    return (
        <div className="cw-viewer">
            <div className="cw-vhead">
                <button className={`cw-vtab${sisi === "awal" ? " on" : ""}`} onClick={() => pindah("awal")}>
                    AWAL {visit.awal.photos.length}
                </button>
                <button className={`cw-vtab${sisi === "akhir" ? " on" : ""}`} onClick={() => pindah("akhir")}>
                    AKHIR {visit.akhir.photos.length}
                </button>
                <button className="cw-vclose" onClick={onClose} aria-label="Tutup">✕</button>
            </div>

            <div className="cw-vstage">
                {foto.url ? <img src={foto.url} alt="" /> : (
                    <div className="cw-vfake" style={{
                        background: isBefore
                            ? "linear-gradient(135deg,#e0e7ef,#bcc8d9)"
                            : "linear-gradient(135deg,#d1fae5,#a7f3d0)"
                    }}>{foto.fake}</div>
                )}
            </div>

            <div className="cw-vwfoot">
                <div className="cw-vnav">
                    <button className="cw-varr" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹</button>
                    <div className="cw-vwmeta">
                        <b>Foto {idx + 1} dari {daftar.length} · {isBefore ? "kondisi awal" : "kondisi akhir"}</b>
                        <span>{jam(foto.at)} · GPS {GPS.lat}, {GPS.lng} · ±{GPS.acc} m</span>
                    </div>
                    <button className="cw-varr" disabled={idx >= daftar.length - 1}
                        onClick={() => setIdx(idx + 1)}>›</button>
                </div>
                <div className="cw-vdots">
                    {daftar.map((_, i) => <div key={i} className={`cw-vdot${i === idx ? " on" : ""}`} />)}
                </div>
                {ket && (
                    <p style={{
                        marginTop: 12, textAlign: "center", fontSize: 11.5,
                        color: "rgba(255,255,255,.6)", lineHeight: 1.45
                    }}>
                        Keterangan {isBefore ? "awal" : "akhir"}: “{ket}”
                    </p>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   FORM 1 — gerbang + foto awal
   ══════════════════════════════════════════════════════════════ */
function FormAwal({ onBack, onSubmit, offline }) {
    const [gate, setGate] = useState(null);
    const [manualOpen, setManualOpen] = useState(false);
    const [room, setRoom] = useState("");
    const [cat, setCat] = useState("");
    const [photos, setPhotos] = useState([]);
    const [note, setNote] = useState("");
    const k = gate ? kat(gate.categoryId) : null;
    const weak = gate?.mode === "manual";

    return (
        <>
            <div className="cw-nav">
                <button className="cw-iconbtn" onClick={onBack} aria-label="Kembali">‹</button>
                <div><h1>Mulai pekerjaan</h1><p>Form 1 dari 2 · kondisi awal</p></div>
            </div>

            <div className="cw-body">
                {!gate ? (
                    <div className="cw-gate">
                        <div className="cw-gate-icon">🔳</div>
                        <h2>Scan QR ruangan</h2>
                        <p>QR menentukan ruangan dan checklist yang muncul nanti.</p>
                        <button className="cw-btn cw-primary"
                            onClick={() => setGate({ ...QR_PAYLOAD, mode: "qr", at: new Date() })}>
                            📷 Buka pemindai
                        </button>
                        <button className="cw-ghost" onClick={() => setManualOpen((v) => !v)}>
                            QR rusak atau tidak kebaca?
                        </button>

                        {manualOpen && (
                            <div className="cw-manual">
                                <label>Tulis lokasi kamu</label>
                                <input className="cw-note" style={{ height: 44, marginTop: 0 }}
                                    placeholder="Contoh: Toilet wanita lantai 3, dekat lift"
                                    value={room} onChange={(e) => setRoom(e.target.value)} />
                                <label style={{ marginTop: 14 }}>Jenis area</label>
                                <div className="cw-chips">
                                    {KATEGORI.map((c) => (
                                        <button key={c.id} className={`cw-chip${cat === c.id ? " on" : ""}`}
                                            onClick={() => setCat(c.id)}>{c.icon} {c.label}</button>
                                    ))}
                                </div>
                                <p style={{ fontSize: 11, color: "var(--g5)", lineHeight: 1.5, margin: "10px 0 12px" }}>
                                    Lokasi GPS tetap ikut terkirim. Catatan ini ditandai <b>bukti lemah</b> karena
                                    lokasinya diketik sendiri, bukan hasil scan.
                                </p>
                                <button className={`cw-btn ${room.trim() && cat ? "cw-primary" : "off"}`}
                                    disabled={!room.trim() || !cat}
                                    onClick={() => setGate({
                                        mode: "manual", room: room.trim(), categoryId: cat,
                                        site: "Gedung Jamsostek · Blok B", code: null, at: new Date()
                                    })}>
                                    Lanjut tanpa QR
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`cw-gate-done ${weak ? "cw-gate-weak" : "cw-gate-strong"}`}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                            <span style={{ fontSize: 20, lineHeight: 1.1 }}>{k?.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="cw-gate-room">{gate.room}</div>
                                <div className="cw-gate-meta">{k?.label} · {gate.site}</div>
                                <div className="cw-gate-meta" style={{ fontFamily: "var(--mono)", fontSize: 11, marginTop: 3 }}>
                                    {weak ? "diketik manual" : gate.code} · {jam(gate.at)} · GPS ±{GPS.acc} m
                                </div>
                            </div>
                            <button className="cw-ghost" style={{ padding: 0, fontSize: 11.5, width: "auto" }}
                                onClick={() => { setGate(null); setManualOpen(false); }}>Ganti</button>
                        </div>
                        {weak && (
                            <div className="cw-gate-note">
                                ⚠️ Bukti lemah — lokasi diketik, bukan hasil scan. Catatan ini ditandai
                                berbeda untuk supervisor dan klien.
                            </div>
                        )}
                    </div>
                )}

                <div className={`cw-sec${gate ? "" : " locked"}`} style={{ paddingTop: 16 }}>
                    <div className="cw-sec-head">
                        <div className="cw-sec-title">Kondisi awal</div>
                        <span className="cw-req">1 WAJIB</span>
                        <span className="cw-opt">MAKS {MAX_FOTO}</span>
                    </div>
                    <PhotoGroup slot="before" samples={k?.samples} photos={photos} setPhotos={setPhotos} />
                    <textarea className="cw-note" placeholder="Keterangan (boleh dikosongkan)"
                        value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
            </div>

            <div className="cw-bar">
                <button className={`cw-btn ${gate && photos.length ? "cw-primary" : "off"}`}
                    disabled={!gate || !photos.length}
                    onClick={() => onSubmit({ ...gate, photos, note })}>
                    {offline ? "Simpan & mulai kerja" : "Kirim & mulai kerja"}
                </button>
                <div className="cw-why">
                    {!gate ? "Scan QR dulu untuk membuka form."
                        : !photos.length ? "Minimal satu foto kondisi awal."
                            : `${photos.length} foto akan terkunci. Setelah dikirim, foto tidak bisa dihapus.`}
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════════════════════
   FORM 2 — centang → foto akhir → keterangan
   ══════════════════════════════════════════════════════════════ */
function FormAkhir({ visit, draft, setDraft, onBack, onSubmit, offline }) {
    const [openOpts, setOpenOpts] = useState(null);
    const k = kat(visit.categoryId);
    const marks = draft.marks || {};
    const photos = draft.photos || [];
    const t = hitung(marks, k.items);
    const adaDraft = Object.values(marks).filter(Boolean).length > 0 || draft.note || photos.length;

    const mark = (id, s) => {
        setDraft({ ...draft, marks: { ...marks, [id]: marks[id] === s ? undefined : s } });
        setOpenOpts(null);
    };

    return (
        <>
            <div className="cw-nav">
                <button className="cw-iconbtn" onClick={onBack} aria-label="Kembali">‹</button>
                <div style={{ minWidth: 0 }}>
                    <h1>{visit.room}</h1>
                    <p>Form 2 dari 2 · {k.label} · pekerjaan & kondisi akhir</p>
                </div>
            </div>
            <div className="cw-prev">
                <span>🔒</span>
                <span>
                    {visit.awal.photos.length} foto awal <b>{jam(visit.awal.at)}</b> sudah terkunci
                    {visit.awal.note ? ` · “${visit.awal.note}”` : ""}
                </span>
            </div>
            {!photos.length && (
                <div className="cw-remind">
                    Foto kondisi akhir wajib — letaknya di bawah checklist. Kirim belum bisa sebelum itu diambil.
                </div>
            )}

            <div className="cw-body">
                <div className="cw-sec">
                    <div className="cw-sec-head">
                        <div className="cw-sec-title">Pekerjaan yang dikerjakan</div>
                        <span className="cw-opt">BOLEH KOSONG</span>
                    </div>
                    <div className="cw-prog">
                        <span style={{ fontSize: 12.5, color: "var(--g6)", fontWeight: 500 }}>Ditangani</span>
                        <b>{t.handled} / {t.total}</b>
                    </div>
                    <div className="cw-track">
                        <div className="cw-fill" style={{ width: `${(t.done / t.total) * 100}%`, background: "var(--green)" }} />
                        <div className="cw-fill" style={{ width: `${(t.na / t.total) * 100}%`, background: "var(--g4)" }} />
                    </div>
                    <div className="cw-legend">
                        Tap kotak = selesai. Tombol ⋯ untuk N/A (barangnya tidak ada) atau lewati.
                    </div>

                    <div className="cw-list">
                        {k.items.map((it) => {
                            const s = marks[it.id];
                            return (
                                <div key={it.id}>
                                    <div className="cw-item">
                                        <button className={`cw-box${s ? " " + s : ""}`} onClick={() => mark(it.id, "done")}
                                            aria-label={`Tandai selesai: ${it.name}`}>
                                            {s === "done" ? "✓" : s === "na" ? "N/A" : s === "skip" ? "→" : ""}
                                        </button>
                                        <div className="cw-item-txt">
                                            <div className={`cw-item-name${s && s !== "done" ? " muted" : ""}`}>
                                                {it.name}
                                                {s === "na" && <span className="cw-tag" style={{ background: "var(--g1)", color: "var(--g5)" }}>N/A</span>}
                                                {s === "skip" && <span className="cw-tag" style={{ background: "var(--amber-light)", color: "var(--amber)" }}>DILEWAT</span>}
                                            </div>
                                            {it.hint && <div className="cw-item-hint">{it.hint}</div>}
                                        </div>
                                        <button className="cw-more" aria-label="Pilihan lain"
                                            onClick={() => setOpenOpts(openOpts === it.id ? null : it.id)}>⋯</button>
                                    </div>
                                    {openOpts === it.id && (
                                        <div className="cw-opts">
                                            <button className="cw-opt-btn" onClick={() => mark(it.id, "na")}>Tidak ada barangnya</button>
                                            <button className="cw-opt-btn" onClick={() => mark(it.id, "skip")}>Lewati dulu</button>
                                            <button className="cw-opt-btn" onClick={() => mark(it.id, undefined)}>Kosongkan</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {adaDraft ? (
                        <div className="cw-draft">draft tersimpan di HP · belum jadi catatan sampai dikirim</div>
                    ) : null}
                </div>

                <div className="cw-sec">
                    <div className="cw-sec-head">
                        <div className="cw-sec-title">Kondisi akhir</div>
                        <span className="cw-req">1 WAJIB</span>
                        <span className="cw-opt">MAKS {MAX_FOTO}</span>
                    </div>
                    <PhotoGroup slot="after" photos={photos} sorot={!photos.length}
                        setPhotos={(p) => setDraft({ ...draft, photos: p })} />
                    <textarea className="cw-note" placeholder="Keterangan (boleh dikosongkan)"
                        value={draft.note || ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
                </div>
            </div>

            <div className="cw-bar">
                <button className={`cw-btn ${photos.length ? "cw-success" : "off"}`} disabled={!photos.length}
                    onClick={() => onSubmit({ marks, photos, note: draft.note || "" })}>
                    {offline ? "Simpan & tutup pekerjaan" : "Kirim & tutup pekerjaan"}
                </button>
                <div className="cw-why">
                    {!photos.length ? "Minimal satu foto kondisi akhir."
                        : t.handled < t.total
                            ? `Boleh dikirim di centang ${t.handled}/${t.total} — yang belum ditangani tercatat apa adanya.`
                            : "Setelah dikirim, pekerjaan ditutup dan tidak bisa diubah."}
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════════════════════
   RINGKASAN — dua kolom tumpukan + viewer
   ══════════════════════════════════════════════════════════════ */
function Ringkasan({ visit, onBack }) {
    const [viewer, setViewer] = useState(null); // {sisi, idx}
    const k = kat(visit.categoryId);
    const t = hitung(visit.akhir.marks, k.items);
    const weak = visit.mode === "manual";
    const nA = visit.awal.photos.length;
    const nB = visit.akhir.photos.length;

    return (
        <>
            <div className="cw-body">
                <div className="cw-lock-hero">
                    <div className="cw-lock-ico">🔒</div>
                    <h2>Pekerjaan ditutup</h2>
                    <p>Dua catatan terkunci di jamnya masing-masing.<br />
                        Perbaikan hanya lewat catatan tambahan bertanggal.</p>
                </div>

                <div className="cw-card">
                    <div className="cw-pair">
                        <div className="cw-stack" onClick={() => setViewer({ sisi: "awal", idx: 0 })}>
                            <Gambar foto={visit.awal.photos[0]} isBefore kelas="fake" />
                            <div className="cw-pill" style={{ background: "#6B7280" }}>AWAL</div>
                            {nA > 1 && <div className="cw-badge">+{nA - 1}</div>}
                        </div>
                        <div className="cw-stack" onClick={() => setViewer({ sisi: "akhir", idx: 0 })}>
                            <Gambar foto={visit.akhir.photos[0]} isBefore={false} kelas="fake" />
                            <div className="cw-pill" style={{ background: "#16A34A" }}>AKHIR</div>
                            {nB > 1 && <div className="cw-badge">+{nB - 1}</div>}
                        </div>
                    </div>
                    <div className="cw-tapall">Tap untuk lihat semua foto</div>
                    <div className="cw-row"><span className="cw-k">Ruangan</span><span className="cw-v">{visit.room}</span></div>
                    <div className="cw-row"><span className="cw-k">Kategori</span><span className="cw-v">{k.label}</span></div>
                    <div className="cw-row">
                        <span className="cw-k">Foto</span>
                        <span className="cw-v">{nA} foto awal · {nB} foto akhir</span>
                    </div>
                    <div className="cw-row">
                        <span className="cw-k">Tingkat bukti</span>
                        <span className="cw-v" style={{ color: weak ? "#B45309" : "#16A34A" }}>
                            {weak ? "Lemah · lokasi diketik + GPS" : "Kuat · QR + GPS + foto"}
                        </span>
                    </div>
                    <div className="cw-row"><span className="cw-k">Rentang kerja</span>
                        <span className="cw-v">{rentang(visit.awal.at, visit.akhir.at)}</span></div>
                    <div className="cw-row">
                        <span className="cw-k">Centang</span>
                        <span className="cw-v">
                            {t.handled === 0 ? (
                                <span style={{ color: "var(--amber)" }}>tidak diisi</span>
                            ) : (
                                <>{t.handled}/{t.total} ditangani{" "}
                                    <span style={{ color: "var(--g4)", fontWeight: 400 }}>
                                        ({t.done} selesai · {t.na} N/A{t.skip ? ` · ${t.skip} dilewat` : ""})
                                    </span></>
                            )}
                        </span>
                    </div>
                </div>

                <div className="cw-sect" style={{ paddingTop: 4 }}>Jejak catatan</div>
                <div className="cw-jejak">
                    {[
                        { t: visit.awal.at, l: `${nA} foto awal + keterangan`, s: visit.awal.sync },
                        { t: visit.akhir.at, l: `Centang + ${nB} foto akhir — pekerjaan ditutup`, s: visit.akhir.sync },
                    ].map((n, i, arr) => (
                        <div className="cw-jrow" key={i}>
                            <div className="cw-jline">
                                <div className="cw-jdot" />
                                {i < arr.length - 1 && <div className="cw-jbar" />}
                            </div>
                            <div style={{ paddingBottom: 12 }}>
                                <div className="cw-jt">{jam(n.t)}</div>
                                <div className="cw-jl">{n.l}</div>
                                <div className="cw-jt" style={{ color: "var(--g4)" }}>
                                    {n.s === "sent" ? "✓✓ terkirim" : "✓ tertangkap di perangkat"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="cw-immutable">
                    Tidak ada persetujuan yang perlu ditunggu.<br />
                    Kalau supervisor menilai hasilnya kurang, permintaan ulang muncul<br />
                    sebagai catatan baru — dua catatan ini tetap utuh.
                </p>
            </div>

            <div className="cw-bar">
                <button className="cw-btn cw-primary" onClick={onBack}>Kembali ke beranda</button>
            </div>

            {viewer && (
                <Viewer visit={visit} sisi={viewer.sisi} idx={viewer.idx}
                    setSisi={(s) => setViewer((v) => ({ ...v, sisi: s }))}
                    setIdx={(i) => setViewer((v) => ({ ...v, idx: i }))}
                    onClose={() => setViewer(null)} />
            )}
        </>
    );
}

/* ══════════════════════════════════════════════════════════════
   BERANDA
   ══════════════════════════════════════════════════════════════ */
function Beranda({ visits, drafts, onNew, onOpen, onLihat }) {
    const jalan = visits.filter((v) => !v.closedAt);
    const kelar = visits.filter((v) => v.closedAt);
    const tgl = new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });

    const Kartu = (v) => {
        const k = kat(v.categoryId);
        const stale = !v.closedAt && menitLalu(v.awal.at) > STALE_MIN;
        const d = drafts[v.id];
        const nDraft = d ? Object.values(d.marks || {}).filter(Boolean).length : 0;
        const nFotoDraft = d?.photos?.length || 0;
        const t = v.akhir ? hitung(v.akhir.marks, k.items) : null;
        return (
            <button key={v.id} className={`cw-vcard${v.closedAt ? " done" : stale ? " stale" : ""}`}
                onClick={() => (v.closedAt ? onLihat(v.id) : onOpen(v.id))}>
                <div className="cw-vtop">
                    <div className="cw-vico">{k.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cw-vroom">
                            {v.room}
                            {v.mode === "manual" && <span className="cw-weakchip">BUKTI LEMAH</span>}
                        </div>
                        <div className="cw-vmeta">
                            {k.label} · mulai {jam(v.awal.at)} · {v.awal.photos.length} foto awal
                            {v.closedAt && ` · ${v.akhir.photos.length} foto akhir`}
                        </div>
                    </div>
                    <span className={`cw-vchip ${v.closedAt ? "ok" : "next"}`}>
                        {v.closedAt ? "DITUTUP" : "FORM 2"}
                    </span>
                </div>

                <div className="cw-steps">
                    <div className="cw-dot on" />
                    <div className={`cw-seg ${v.closedAt ? "on" : ""}`} />
                    <div className={`cw-dot ${v.closedAt ? "on" : "now"}`} />
                </div>
                <div className="cw-steplbl">
                    <span>foto awal</span>
                    <span>{t ? `centang ${t.handled}/${t.total} + foto akhir` : "centang + foto akhir"}</span>
                </div>

                {stale && (
                    <div className="cw-warn">
                        Belum dilanjutkan sejak {jam(v.awal.at)} ({lamanya(menitLalu(v.awal.at))} lalu).
                        Catatan awal tetap tersimpan apa adanya.
                    </div>
                )}
                {!v.closedAt && (nDraft > 0 || nFotoDraft > 0) && (
                    <div className="cw-draftchip">
                        Draft: {nDraft} centang{nFotoDraft ? ` · ${nFotoDraft} foto` : ""} tersimpan di HP, belum dikirim.
                    </div>
                )}

                <div className="cw-vfoot">
                    <span className="cw-sync">{v.awal.sync === "sent" ? "✓✓ terkirim" : "✓ di perangkat"}</span>
                    <span className="cw-go">{v.closedAt ? "Lihat catatan ›" : "Lanjut ke form 2 ›"}</span>
                </div>
            </button>
        );
    };

    return (
        <>
            <div className="cw-hero">
                <div className="cw-hello">Selamat pagi,</div>
                <div className="cw-name">Siti Rahayu</div>
                <div className="cw-herometa">{tgl} · Gedung Jamsostek · Blok B</div>
            </div>

            <div className="cw-body">
                <button className="cw-cta" onClick={onNew}>🔳 Scan QR — mulai pekerjaan</button>

                <div className="cw-sect">Sedang berjalan ({jalan.length})</div>
                {jalan.length ? jalan.map(Kartu) : (
                    <div className="cw-empty">
                        <p>Belum ada pekerjaan berjalan.<br />Scan QR ruangan untuk mulai.</p>
                    </div>
                )}

                {kelar.length > 0 && (
                    <>
                        <div className="cw-sect">Ditutup hari ini ({kelar.length})</div>
                        {kelar.map(Kartu)}
                    </>
                )}
                <div style={{ height: 20 }} />
            </div>
        </>
    );
}

/* ══════════════════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════════════════ */
const seed = () => {
    const t0 = new Date(Date.now() - 74 * 60000);
    const t1 = new Date(Date.now() - 72 * 60000);
    const t2 = new Date(Date.now() - 71 * 60000);
    return [
        {
            id: "v-seed",
            room: "Pantry — Lt. 2",
            categoryId: "pantry",
            site: "Gedung Jamsostek · Blok B",
            code: "AZ-JMS-P02-01",
            mode: "qr",
            startedAt: t0,
            awal: {
                photos: [
                    { url: null, at: t0, fake: "🍽️" },
                    { url: null, at: t1, fake: "🥤" },
                    { url: null, at: t2, fake: "🗑️" },
                ],
                note: "Wastafel penuh gelas kotor, tempat sampah luber.",
                at: t2, sync: "sent",
            },
            akhir: null,
            closedAt: null,
        },
    ];
};

export default function CleaningWorkFlow() {
    const [visits, setVisits] = useState(seed);
    const [drafts, setDrafts] = useState({});      // simulasi penyimpanan lokal HP
    const [route, setRoute] = useState({ name: "home" });
    const [offline, setOffline] = useState(false);
    const [toast, setToast] = useState(null);

    const visit = useMemo(() => visits.find((v) => v.id === route.id) || null, [visits, route]);

    const pop = (judul, isi) => {
        setToast({ judul, isi });
        setTimeout(() => setToast(null), 3200);
    };

    const tandaiTerkirim = (id, key) => {
        if (offline) return;
        setTimeout(() => {
            setVisits((vs) => vs.map((v) => (v.id === id ? { ...v, [key]: { ...v[key], sync: "sent" } } : v)));
        }, 1700);
    };

    const kirimAwal = (d) => {
        const id = "v-" + Math.random().toString(36).slice(2, 8);
        const at = new Date();
        setVisits((vs) => [
            {
                id, room: d.room, categoryId: d.categoryId, site: d.site, code: d.code, mode: d.mode,
                startedAt: at,
                awal: { photos: d.photos, note: d.note, at, sync: "device" },
                akhir: null, closedAt: null
            },
            ...vs,
        ]);
        setRoute({ name: "home" });
        pop(offline ? `${d.photos.length} foto awal aman di HP ✓` : `${d.photos.length} foto awal terkunci ✓`,
            offline ? "Belum ada sinyal — dikirim otomatis nanti. Boleh tutup aplikasi."
                : "Sedang dikirim di belakang layar. Boleh tutup aplikasi.");
        tandaiTerkirim(id, "awal");
    };

    const kirimAkhir = (id, d) => {
        const at = new Date();
        setVisits((vs) => vs.map((v) => (v.id === id
            ? { ...v, akhir: { marks: d.marks, photos: d.photos, note: d.note, at, sync: "device" }, closedAt: at }
            : v)));
        setDrafts((ds) => { const n = { ...ds }; delete n[id]; return n; });
        setRoute({ name: "ringkasan", id });
        tandaiTerkirim(id, "akhir");
    };

    let layar;
    if (route.name === "home")
        layar = <Beranda visits={visits} drafts={drafts} onNew={() => setRoute({ name: "form1" })}
            onOpen={(id) => setRoute({ name: "form2", id })}
            onLihat={(id) => setRoute({ name: "ringkasan", id })} />;
    else if (route.name === "form1")
        layar = <FormAwal offline={offline} onBack={() => setRoute({ name: "home" })} onSubmit={kirimAwal} />;
    else if (route.name === "form2")
        layar = <FormAkhir visit={visit} offline={offline}
            draft={drafts[visit.id] || { marks: {}, note: "", photos: [] }}
            setDraft={(d) => setDrafts((ds) => ({ ...ds, [visit.id]: d }))}
            onBack={() => setRoute({ name: "home" })}
            onSubmit={(d) => kirimAkhir(visit.id, d)} />;
    else layar = <Ringkasan visit={visit} onBack={() => setRoute({ name: "home" })} />;

    const dark = route.name === "home";

    return (
        <div className="cw">
            <style>{CSS}</style>
            <div className="cw-device">
                <div className="cw-notch" />
                <div className="cw-screen">
                    <div className={`cw-status${dark ? " dark" : ""}`}
                        style={dark ? { background: "#111827" } : undefined}>
                        <span>{jam(new Date())}</span>
                        <span className="cw-signal">{offline ? "✈︎ tanpa sinyal" : "▂▄ 2 bar"} · 🔋</span>
                    </div>
                    {toast && (
                        <div className="cw-toast">
                            <span style={{ fontSize: 15, lineHeight: 1.1 }}>{offline ? "📥" : "🔒"}</span>
                            <div><b>{toast.judul}</b><span>{toast.isi}</span></div>
                        </div>
                    )}
                    {layar}
                </div>
            </div>

            {/* strip demo — hapus saat ditanam ke aplikasi */}
            <div className="cw-demo">
                <span>DEMO</span>
                <button className={offline ? "on" : ""} onClick={() => setOffline((v) => !v)}>
                    {offline ? "Sinyal: mati" : "Sinyal: ada"}
                </button>
                <button onClick={() => { setVisits(seed()); setDrafts({}); setRoute({ name: "home" }); }}>
                    Ulang dari awal
                </button>
            </div>
        </div>
    );
}