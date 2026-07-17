import React, { useState, useMemo } from "react";

/**
 * AUTSORZ — Divisi Sales (kokpit supervisor)
 * Sisi yang dibeli vendor: memonitor sales lapangan, bukan mengoreksi.
 *
 * Prinsip yang dijaga:
 *  - Dua lapis (§14): Lapis 1 = roster sales; Lapis 2 = detail satu sales.
 *  - "Yang bermasalah di atas" — anomali (belum clock-in / belum ada laporan)
 *    disaring ke seksi "Perhatian". Sisanya ditampilkan netral tanpa di-rank-judge.
 *  - Coverage = FAKTA GPS, BUKAN vonis. V1 sales gerak sendiri (belum ada
 *    penugasan) → tidak ada klaim "daerah belum digarap". Rencana-vs-realita
 *    baru muncul saat penugasan masuk (§16).
 *  - "Belum ada kunjungan" = sinyal netral, BUKAN tuduhan ngabur (§19).
 *  - Hasil = "diajukan (dilaporkan)", TIDAK PERNAH "disetujui" — keputusan bank (§15/§25).
 *  - Tingkat bukti jujur (KUAT / GPS lemah), konsisten lintas layar.
 *  - Tanpa leaderboard.
 *
 * Palette C / Plus Jakarta Sans + Inter — samakan token bila digabung ke basis kode utama.
 */

const T = {
  ink: "#16181D", inkSoft: "#606772", inkFaint: "#9AA1AC",
  line: "#E7E9ED", lineSoft: "#F0F2F5", bg: "#F4F5F7", card: "#FFFFFF",
  verify: "#1F7A5C", verifySoft: "#E8F2EE",
  claim: "#B45309", claimSoft: "#FBEFDD",
  accent: "#1F5FB0", accentSoft: "#E8F0FA",
  danger: "#C0392B", dangerSoft: "#FBEAE8",
  warn: "#B7791F", warnSoft: "#FBF3E2",
};
const font = {
  display: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
  body: "'Inter', -apple-system, system-ui, sans-serif",
};
const HASIL_META = {
  tertarik: { label: "Tertarik",  tone: "verify" },
  ajukan:   { label: "Ajukan",    tone: "claim"  },
  followup: { label: "Follow-up", tone: "accent" },
  tolak:    { label: "Tolak",     tone: "danger" },
};
const ORDER = ["tertarik", "ajukan", "followup", "tolak"];
function tone(t) {
  switch (t) {
    case "verify": return { fg: T.verify, bg: T.verifySoft };
    case "claim":  return { fg: T.claim,  bg: T.claimSoft  };
    case "danger": return { fg: T.danger, bg: T.dangerSoft };
    default:       return { fg: T.accent, bg: T.accentSoft };
  }
}

/* ---- data contoh (semua turunan record kunjungan terkunci) ---- */
const SALES = [
  {
    id: "budi", name: "Budi Santoso", ini: "BS", clockIn: "07:45", clockArea: "Pasar Minggu",
    visits: [
      { time: "14:20", place: "Toko Berkah Jaya", area: "Pasar Minggu", produk: ["Tabungan", "Kartu Kredit"], hasil: "followup", evi: "kuat" },
      { time: "13:05", place: "Warung Bu Sri", area: "Pasar Minggu", produk: ["KTA"], hasil: "tolak", evi: "kuat" },
      { time: "11:40", place: "Konter Pulsa Andi", area: "Kalibata", produk: ["Tabungan"], hasil: "ajukan", evi: "kuat" },
      { time: "10:55", place: "Bengkel Motor Jaya", area: "Kalibata", produk: ["Kartu Kredit"], hasil: "tertarik", evi: "kuat" },
      { time: "10:10", place: "Lapak Sayur Pasar", area: "Kalibata", produk: ["Tabungan"], hasil: "followup", evi: "lemah" },
      { time: "09:25", place: "Toko Kelontong Maju", area: "Pancoran", produk: ["KTA", "Tabungan"], hasil: "ajukan", evi: "kuat" },
      { time: "08:50", place: "Kios Rokok Wawan", area: "Pancoran", produk: ["Tabungan"], hasil: "tertarik", evi: "kuat" },
      { time: "08:15", place: "Warteg Sederhana", area: "Pancoran", produk: ["Kartu Kredit"], hasil: "followup", evi: "kuat" },
    ],
  },
  {
    id: "sari", name: "Sari Wulandari", ini: "SW", clockIn: "08:10", clockArea: "Menteng",
    visits: [
      { time: "13:50", place: "Ruko Menteng Raya", area: "Menteng", produk: ["KPR"], hasil: "followup", evi: "kuat" },
      { time: "12:30", place: "Kantor Notaris Dewi", area: "Menteng", produk: ["Payroll"], hasil: "ajukan", evi: "kuat" },
      { time: "11:15", place: "Cafe Tebet Point", area: "Tebet", produk: ["Kartu Kredit"], hasil: "tertarik", evi: "kuat" },
      { time: "10:20", place: "Klinik Gigi Senyum", area: "Tebet", produk: ["Tabungan"], hasil: "tolak", evi: "kuat" },
      { time: "09:30", place: "Toko Buku Tebet", area: "Tebet", produk: ["KTA"], hasil: "followup", evi: "kuat" },
      { time: "08:40", place: "Warkop Menteng", area: "Menteng", produk: ["Tabungan"], hasil: "tertarik", evi: "lemah" },
    ],
  },
  {
    id: "andi", name: "Andi Pratama", ini: "AP", clockIn: "07:55", clockArea: "Cikoko",
    visits: [
      { time: "13:10", place: "Gudang Cikoko Jaya", area: "Cikoko", produk: ["KTA"], hasil: "ajukan", evi: "kuat" },
      { time: "11:50", place: "Toko Besi Kuat", area: "Cikoko", produk: ["Tabungan"], hasil: "tertarik", evi: "kuat" },
      { time: "10:40", place: "Warung Pancoran Asri", area: "Pancoran", produk: ["Kartu Kredit"], hasil: "followup", evi: "kuat" },
      { time: "09:20", place: "Bengkel Pancoran", area: "Pancoran", produk: ["KTA"], hasil: "tolak", evi: "kuat" },
      { time: "08:30", place: "Kios Cikoko", area: "Cikoko", produk: ["Tabungan"], hasil: "followup", evi: "kuat" },
    ],
  },
  {
    id: "rina", name: "Rina Marlina", ini: "RM", clockIn: "08:30", clockArea: "Kalibata", offline: true,
    visits: [
      { time: "09:15", place: "Toko Kalibata Mas", area: "Kalibata", produk: ["Tabungan"], hasil: "followup", evi: "kuat" },
      { time: "08:20", place: "Warung Kalibata", area: "Kalibata", produk: ["KTA"], hasil: "tertarik", evi: "lemah" },
    ],
  },
  { id: "dedi", name: "Dedi Kurniawan", ini: "DK", clockIn: "08:05", clockArea: "Mampang", visits: [] },
  { id: "tono", name: "Tono Hartono", ini: "TH", clockIn: null, clockArea: null, visits: [] },
];

/* ---- window auto-verifikasi (dapat diatur per vendor) ---- */
const AUTO_DAYS = 2;

/* ---- antrean pengajuan (hasil "ajukan") untuk diverifikasi supervisor ---- */
const SUBMISSIONS = [
  {
    id: "s1", sales: "Budi Santoso", ini: "BS", tempat: "Konter Pulsa Andi", area: "Kalibata", time: "11:40", date: "Hari ini", evi: "kuat",
    status: "pending", daysLeft: 2,
    produk: [
      { name: "Tabungan", ref: "TBG-4471", items: [
        { label: "KTP", status: "ok", foto: true },
        { label: "Setoran awal", status: "ok", foto: false },
        { label: "Foto form aplikasi", status: "ok", foto: true },
      ] },
    ],
  },
  {
    id: "s2", sales: "Budi Santoso", ini: "BS", tempat: "Toko Kelontong Maju", area: "Pancoran", time: "09:25", date: "Hari ini", evi: "kuat",
    status: "pending", daysLeft: 2,
    produk: [
      { name: "KTA / Pinjaman", ref: "KTA-8820", items: [
        { label: "KTP", status: "ok", foto: true },
        { label: "Slip gaji", status: "ok", foto: false },
        { label: "Rekening koran", status: "na", foto: false },
        { label: "Foto form aplikasi", status: "ok", foto: true },
      ] },
      { name: "Tabungan", ref: "TBG-8821", items: [
        { label: "KTP", status: "ok", foto: false },
        { label: "Setoran awal", status: "ok", foto: false },
        { label: "Foto form aplikasi", status: "ok", foto: true },
      ] },
    ],
  },
  {
    id: "s3", sales: "Sari Wulandari", ini: "SW", tempat: "Kantor Notaris Dewi", area: "Menteng", time: "12:30", date: "Kemarin", evi: "kuat",
    status: "verified", verifiedBy: "Pak Rian", verifiedAt: "Kemarin 16:10",
    produk: [
      { name: "Payroll", ref: "PYR-3310", items: [
        { label: "KTP", status: "ok", foto: true },
        { label: "Data perusahaan", status: "ok", foto: true },
        { label: "Foto form aplikasi", status: "ok", foto: true },
      ] },
    ],
  },
  {
    id: "s4", sales: "Andi Pratama", ini: "AP", tempat: "Gudang Cikoko Jaya", area: "Cikoko", time: "13:10", date: "3 hari lalu", evi: "kuat",
    status: "auto",
    produk: [
      { name: "KTA / Pinjaman", ref: "KTA-2204", items: [
        { label: "KTP", status: "ok", foto: false },
        { label: "Slip gaji", status: "ok", foto: false },
        { label: "Rekening koran", status: "ok", foto: false },
        { label: "Foto form aplikasi", status: "na", foto: false },
      ] },
    ],
  },
];
function ckSummary(sub) {
  let done = 0, total = 0, foto = 0;
  sub.produk.forEach((p) => p.items.forEach((it) => { total++; if (it.status === "ok" || it.status === "na") done++; if (it.foto) foto++; }));
  return { done, total, foto };
}

/* ---- Task List: definisi task + assign per-orang (N instance) ----
   Checklist aksi STANDAR (fix) melekat otomatis — SM tak meracik.
   Reuse pola Fate: kokpit + "+baru"; buang overtime/konfirmasi brand. */
const PRODUK_LIST = ["Tabungan", "Kartu Kredit", "KTA / Pinjaman", "Payroll", "KPR", "Deposito"];
const AKSI_STANDAR = ["Jelaskan produk ke prospek", "Berikan brosur", "Catat keluhan / masukan", "Foto bukti pertemuan"];
const TASK_PH = {
  assigned: { label: "Belum diterima", tone: "accent" },
  diterima: { label: "Dikerjakan", tone: "warn" },
  selesai: { label: "Selesai", tone: "verify" },
};
const TASKS_SEED = [
  { id: "k1", judul: "Promosi KTA — Ruko Blok M", lokasi: "Ruko Blok M Square", area: "Kebayoran Baru", prospek: null, produk: "KTA / Pinjaman", tanggal: "Hari ini", jam: "10:00–12:00", instruksi: "Nyisir pemilik ruko; tawarkan KTA, jelaskan bunga & syarat.",
    assignees: [{ name: "Budi Santoso", ini: "BS", phase: "diterima" }, { name: "Andi Pratama", ini: "AP", phase: "assigned" }] },
  { id: "k2", judul: "Kunjungan Nasabah Prioritas", lokasi: "Perumahan Bintaro Sektor 7", area: "Bintaro", prospek: "Pak Hartono", produk: "KPR", tanggal: "Hari ini", jam: "13:00–15:00", instruksi: "Follow-up nasabah existing untuk KPR; bawa simulasi cicilan.",
    assignees: [{ name: "Sari Wulandari", ini: "SW", phase: "selesai", doneAt: "11:20" }] },
  { id: "k3", judul: "Promosi Tabungan — Pasar Mayestik", lokasi: "Pasar Mayestik", area: "Kebayoran Baru", prospek: null, produk: "Tabungan", tanggal: "Kemarin", jam: "09:00–11:00", instruksi: "Ajak pedagang pasar buka rekening tabungan.", endedPast: true,
    assignees: [{ name: "Rina Marlina", ini: "RM", phase: "assigned" }] },
];
function taskStat(t) {
  const c = { assigned: 0, diterima: 0, selesai: 0 };
  t.assignees.forEach((a) => c[a.phase]++);
  return c;
}
function taskAnomali(t) {
  return t.assignees.filter((a) => a.phase === "assigned" && t.endedPast).length;
}

function statusOf(s) {
  if (!s.clockIn) return "belum-clockin";
  if (s.visits.length === 0) return "belum-gerak";
  return "aktif";
}
function countsOf(visits) {
  const c = { tertarik: 0, ajukan: 0, followup: 0, tolak: 0 };
  visits.forEach((v) => c[v.hasil]++);
  return c;
}
function lastOf(s) { return s.visits.length ? s.visits[0].time : null; }

/* ---- waktu sekarang (acuan mockup) + pulse ---- */
const NOW_MIN = 14 * 60 + 35; // 14:35
const STALE_MIN = 150;        // > 2,5 jam sejak lapor terakhir = perlu dilihat
function toMin(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function gapLabel(mins) {
  if (mins < 60) return `${mins} mnt lalu`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m ? `${h}j ${m}m lalu` : `${h} jam lalu`;
}
function lastGap(s) { return s.visits.length ? NOW_MIN - toMin(s.visits[0].time) : null; }
function pulseOf(s) {
  if (!s.clockIn) return "red";                 // belum mulai
  if (s.visits.length === 0) return "amber";    // belum ada laporan
  if (s.offline) return "amber";                // offline / data belum sinkron
  if (lastGap(s) > STALE_MIN) return "amber";   // lama tak lapor
  return "green";                               // aktif & terkini
}

export default function SalesSupervisor() {
  const [view, setView] = useState("tim"); // tim | daerah | pengajuan
  const [selected, setSelected] = useState(null); // sales id | null
  const [selSub, setSelSub] = useState(null); // submission id | null
  const [verified, setVerified] = useState({}); // id -> {by, at}
  const [tasks, setTasks] = useState(TASKS_SEED);
  const [selTask, setSelTask] = useState(null); // task id | null
  const [creatingTask, setCreatingTask] = useState(false);

  const createTask = (data) => {
    const id = "k" + Date.now();
    const assignees = data.sales.map((s) => ({ name: s.name, ini: s.ini, phase: "assigned" }));
    setTasks((ts) => [{ id, ...data, assignees }, ...ts]);
    setCreatingTask(false);
  };
  const taskOpen = selTask ? tasks.find((t) => t.id === selTask) : null;

  const effStatus = (sub) => (verified[sub.id] ? "verified" : sub.status);
  const doVerify = (id) => setVerified((v) => ({ ...v, [id]: { by: "Anda (Supervisor)", at: "14:40" } }));
  const subStat = useMemo(() => {
    const c = { pending: 0, verified: 0, auto: 0 };
    SUBMISSIONS.forEach((s) => { c[verified[s.id] ? "verified" : s.status]++; });
    return c;
  }, [verified]);

  const team = useMemo(() => {
    const clockedIn = SALES.filter((s) => s.clockIn).length;
    const totalVisits = SALES.reduce((n, s) => n + s.visits.length, 0);
    const breakdown = { tertarik: 0, ajukan: 0, followup: 0, tolak: 0 };
    const areaSet = new Set();
    SALES.forEach((s) => s.visits.forEach((v) => { breakdown[v.hasil]++; areaSet.add(v.area); }));
    const anomali = SALES.filter((s) => statusOf(s) !== "aktif");
    return { clockedIn, totalVisits, breakdown, areaCount: areaSet.size, anomali };
  }, []);

  const coverage = useMemo(() => {
    const map = {};
    SALES.forEach((s) => s.visits.forEach((v) => {
      if (!map[v.area]) map[v.area] = { area: v.area, sales: new Set(), visits: 0, counts: { tertarik: 0, ajukan: 0, followup: 0, tolak: 0 } };
      map[v.area].sales.add(s.id); map[v.area].visits++; map[v.area].counts[v.hasil]++;
    }));
    return Object.values(map).sort((a, b) => b.visits - a.visits);
  }, []);

  const anomali = team.anomali;
  const aktif = SALES.filter((s) => statusOf(s) === "aktif");

  const pulse = useMemo(() => {
    const p = { green: 0, amber: 0, red: 0 };
    SALES.forEach((s) => { p[pulseOf(s)]++; });
    return p;
  }, []);

  const sel = selected ? SALES.find((s) => s.id === selected) : null;
  const subSel = selSub ? SUBMISSIONS.find((x) => x.id === selSub) : null;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", fontFamily: font.body, padding: "24px 0" }}>
      <div style={{ width: 390, height: 780, background: T.card, borderRadius: 28, overflow: "hidden", boxShadow: "0 24px 60px rgba(20,24,30,0.14)", display: "flex", flexDirection: "column" }}>

        {creatingTask ? (
          <TaskCreate roster={SALES} onBack={() => setCreatingTask(false)} onCreate={createTask} />
        ) : taskOpen ? (
          <TaskMonitorDetail task={taskOpen} onBack={() => setSelTask(null)} />
        ) : subSel ? (
          <SubmissionDetail sub={subSel} status={effStatus(subSel)} verInfo={verified[subSel.id]} onVerify={() => doVerify(subSel.id)} onBack={() => setSelSub(null)} />
        ) : sel ? (
          <DetailSales s={sel} onBack={() => setSelected(null)} />
        ) : (
          <>
            {/* header kokpit */}
            <div style={{ padding: "18px 20px 14px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: T.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 800, fontSize: 15 }}>A</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: T.ink, letterSpacing: -0.2 }}>Kokpit Sales</div>
                  <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 1 }}>Supervisor Wilayah Selatan · Kamis, 3 Jul</div>
                </div>
              </div>

              {/* Operational Pulse — status kesehatan tim SAAT INI */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginTop: 14 }}>
                <PulseCell tone="green" n={pulse.green} label="Aktif" />
                <PulseCell tone="amber" n={pulse.amber} label="Perlu dilihat" />
                <PulseCell tone="red" n={pulse.red} label="Belum mulai" />
              </div>
              <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 8, textAlign: "center" }}>
                {team.totalVisits} kunjungan · {team.areaCount} daerah disisir hari ini
              </div>
            </div>

            {/* toggle view */}
            <div style={{ padding: "0 20px 4px", flexShrink: 0 }}>
              <div style={{ display: "flex", background: T.lineSoft, borderRadius: 12, padding: 3 }}>
                {[["tim", "Sales"], ["daerah", "Daerah"], ["pengajuan", "Pengajuan"], ["tugas", "Tugas"]].map(([id, label]) => {
                  const on = view === id;
                  const badge = id === "pengajuan" ? subStat.pending : id === "tugas" ? tasks.reduce((n, t) => n + taskAnomali(t), 0) : 0;
                  return (
                    <button key={id} onClick={() => setView(id)}
                      style={{ flex: 1, border: "none", background: on ? "#fff" : "transparent", color: on ? T.ink : T.inkSoft, fontWeight: on ? 700 : 500, fontSize: 12, fontFamily: font.display, padding: "8px 0", borderRadius: 10, cursor: "pointer", boxShadow: on ? "0 1px 3px rgba(20,24,30,0.10)" : "none", transition: "all .12s", position: "relative" }}>
                      {label}
                      {badge > 0 && (
                        <span style={{ position: "absolute", top: 2, right: 6, width: 14, height: 14, borderRadius: 7, background: T.warn, color: "#fff", fontSize: 8.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 24px" }}>
              {view === "tim" ? (
                <>
                  {/* anomali — yang bermasalah di atas */}
                  {anomali.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <SectionTitle text="Perlu perhatian" count={anomali.length} />
                      {anomali.map((s) => <AnomaliCard key={s.id} s={s} onTap={() => setSelected(s.id)} />)}
                      <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 8, lineHeight: 1.45, display: "flex", gap: 6 }}>
                        <InfoDot color={T.warn} />
                        <span>Sinyal, bukan tuduhan. "Belum ada laporan" bisa berarti sedang kerja belum sempat lapor — konfirmasi dulu.</span>
                      </div>
                    </div>
                  )}

                  {/* roster aktif */}
                  <SectionTitle text="Sales aktif" count={aktif.length} />
                  {aktif.map((s) => <SalesCard key={s.id} s={s} onTap={() => setSelected(s.id)} />)}

                  <div style={{ fontSize: 11, color: T.claim, marginTop: 14, lineHeight: 1.45, display: "flex", gap: 6, background: T.claimSoft, borderRadius: 10, padding: "9px 11px" }}>
                    <InfoDot color={T.claim} />
                    <span>Angka <b>Ajukan</b> = dilaporkan sales, bukan disetujui bank. Konfirmasi status akun di luar sistem.</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 10, lineHeight: 1.45, textAlign: "center" }}>
                    Status "sedang berkunjung" real-time menyusul — saat aplikasi mengirim penanda mulai-kunjungan langsung ke pusat.
                  </div>
                </>
              ) : view === "daerah" ? (
                <>
                  <SectionTitle text="Coverage hari ini" count={coverage.length} sub="area" />
                  {coverage.map((c) => <CoverageRow key={c.area} c={c} />)}
                  <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 14, lineHeight: 1.5, display: "flex", gap: 6 }}>
                    <InfoDot color={T.inkFaint} />
                    <span>Sistem menyajikan fakta lokasi dari GPS. Belum ada target daerah — sales gerak sendiri. Perbandingan rencana-vs-realita menyusul saat penugasan aktif.</span>
                  </div>
                </>
              ) : view === "pengajuan" ? (
                <>
                  {/* PENGAJUAN — antrean verifikasi */}
                  {subStat.pending > 0 && (
                    <>
                      <SectionTitle text="Menunggu verifikasi" count={subStat.pending} />
                      {SUBMISSIONS.filter((s) => effStatus(s) === "pending").map((s) => (
                        <SubmissionCard key={s.id} sub={s} status="pending" onTap={() => setSelSub(s.id)} />
                      ))}
                    </>
                  )}
                  <div style={{ marginTop: subStat.pending > 0 ? 18 : 0 }}>
                    <SectionTitle text="Sudah selesai" count={subStat.verified + subStat.auto} />
                    {SUBMISSIONS.filter((s) => effStatus(s) !== "pending").map((s) => (
                      <SubmissionCard key={s.id} sub={s} status={effStatus(s)} verInfo={verified[s.id]} onTap={() => setSelSub(s.id)} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: T.claim, marginTop: 14, lineHeight: 1.45, display: "flex", gap: 6, background: T.claimSoft, borderRadius: 10, padding: "9px 11px" }}>
                    <InfoDot color={T.claim} />
                    <span>Verifikasi = sales mengumpulkan syarat dengan benar (catatan vendor). <b>Bukan</b> persetujuan aplikasi — kelayakan tetap keputusan BNI.</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: T.inkFaint, marginTop: 10, lineHeight: 1.45, textAlign: "center" }}>
                    Tanpa ditinjau, pengajuan otomatis diterima setelah {AUTO_DAYS} hari (dapat diatur per vendor).
                  </div>
                </>
              ) : (
                <>
                  {/* TUGAS — authoring + pantau */}
                  <button onClick={() => setCreatingTask(true)}
                    style={{ width: "100%", border: `1.5px dashed ${T.accent}`, background: T.accentSoft, borderRadius: 14, padding: "13px 0", fontSize: 14, fontWeight: 700, fontFamily: font.display, color: T.accent, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                    <PlusIcon /> Tugas baru
                  </button>
                  <SectionTitle text="Tugas tim" count={tasks.length} />
                  {tasks.map((t) => <TaskTeamCard key={t.id} t={t} onTap={() => setSelTask(t.id)} />)}
                  <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 12, lineHeight: 1.45, textAlign: "center" }}>
                    Assign ke beberapa sales = tugas tercatat per orang; tiap sales punya checklist & bukti sendiri.
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- kartu roster ---------- */
function PulseCell({ tone, n, label }) {
  const map = { green: [T.verify, T.verifySoft], amber: [T.warn, T.warnSoft], red: [T.danger, T.dangerSoft] };
  const [fg, bg] = map[tone];
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "10px 4px", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: 9, background: fg }} />
        <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 19, color: fg, lineHeight: 1 }}>{n}</span>
      </div>
      <div style={{ fontSize: 10, color: fg, fontWeight: 600, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function Avatar({ ini, tone: tn }) {
  const c = tn || { fg: T.accent, bg: T.accentSoft };
  return (
    <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, color: c.fg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{ini}</div>
  );
}

function SalesCard({ s, onTap }) {
  const counts = countsOf(s.visits);
  const areas = [...new Set(s.visits.map((v) => v.area))];
  const weakCount = s.visits.filter((v) => v.evi === "lemah").length;
  const p = pulseOf(s);
  const dot = p === "green" ? T.verify : T.warn;
  const gap = lastGap(s);
  let statusTxt, statusColor;
  if (s.offline) { statusTxt = "Offline · menunggu sinkron"; statusColor = T.warn; }
  else { statusTxt = `Terakhir lapor ${gapLabel(gap)}`; statusColor = p === "amber" ? T.warn : T.inkSoft; }
  return (
    <button onClick={onTap}
      style={{ width: "100%", border: `1px solid ${T.line}`, background: "#fff", borderRadius: 15, padding: "13px 14px", marginBottom: 10, cursor: "pointer", fontFamily: font.body, textAlign: "left", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar ini={s.ini} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{s.name}</span>
            <span style={{ width: 7, height: 7, borderRadius: 7, background: dot }} />
          </div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>Clock-in {s.clockIn} · {s.clockArea}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: T.ink, lineHeight: 1 }}>{s.visits.length}</div>
          <div style={{ fontSize: 10, color: T.inkFaint }}>kunjungan</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 11, height: 5, borderRadius: 4, overflow: "hidden" }}>
        {ORDER.map((k) => counts[k] ? <div key={k} style={{ flex: counts[k], background: tone(HASIL_META[k].tone).fg, opacity: 0.85 }} /> : null)}
      </div>
      <div style={{ display: "flex", alignItems: "center", marginTop: 9, gap: 8 }}>
        <span style={{ fontSize: 11.5, color: statusColor, fontWeight: s.offline || p === "amber" ? 600 : 400, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{statusTxt}</span>
        {weakCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: T.warn, display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: 6, background: T.warn }} />{weakCount} GPS lemah
          </span>
        )}
      </div>
    </button>
  );
}

function AnomaliCard({ s, onTap }) {
  const belumClockIn = !s.clockIn;
  const c = belumClockIn ? { fg: T.danger, bg: T.dangerSoft } : { fg: T.warn, bg: T.warnSoft };
  const [acted, setActed] = useState(false);
  const actionLabel = belumClockIn ? "Hubungi" : "Konfirmasi aktivitas";
  const actedLabel = belumClockIn ? "Menghubungi\u2026" : "Menunggu konfirmasi";
  return (
    <div style={{ border: `1px solid ${c.fg}33`, background: c.bg, borderRadius: 15, padding: "12px 14px", marginBottom: 9 }}>
      <div onClick={onTap} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <Avatar ini={s.ini} tone={c} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{s.name}</div>
          <div style={{ fontSize: 11.5, color: c.fg, marginTop: 2, fontWeight: 600 }}>
            {belumClockIn ? "Belum clock-in hari ini" : `Clock-in ${s.clockIn} · belum ada laporan kunjungan`}
          </div>
        </div>
        <Chevron />
      </div>
      <button onClick={(e) => { e.stopPropagation(); setActed(true); }} disabled={acted}
        style={{ width: "100%", marginTop: 11, border: `1.5px solid ${acted ? T.line : c.fg}`, background: acted ? "#fff" : "#fff", color: acted ? T.inkSoft : c.fg, borderRadius: 11, padding: "9px 0", fontSize: 13, fontWeight: 700, fontFamily: font.body, cursor: acted ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
        {acted ? actedLabel : (<>{belumClockIn ? <PhoneIcon color={c.fg} /> : <ChatIcon color={c.fg} />} {actionLabel}</>)}
      </button>
    </div>
  );
}

function statusPill(status) {
  if (status === "verified") return { txt: "Diverifikasi", fg: T.verify, bg: T.verifySoft };
  if (status === "auto") return { txt: "Otomatis", fg: T.warn, bg: T.warnSoft };
  return { txt: "Menunggu", fg: T.warn, bg: T.warnSoft };
}
function SubmissionCard({ sub, status, verInfo, onTap }) {
  const sum = ckSummary(sub);
  const pill = statusPill(status);
  let statusLine;
  if (status === "verified") statusLine = `Diverifikasi · ${verInfo ? verInfo.by : sub.verifiedBy}`;
  else if (status === "auto") statusLine = "Otomatis diterima · tidak ditinjau";
  else statusLine = `Otomatis diterima dalam ${sub.daysLeft} hari`;
  return (
    <button onClick={onTap}
      style={{ width: "100%", border: `1px solid ${status === "pending" ? T.warn + "44" : T.line}`, background: "#fff", borderRadius: 15, padding: "13px 14px", marginBottom: 10, cursor: "pointer", fontFamily: font.body, textAlign: "left", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <Avatar ini={sub.ini} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{sub.tempat}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>{sub.sales} · {sub.time} · {sub.date}</div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: pill.fg, background: pill.bg, padding: "3px 9px", borderRadius: 12 }}>{pill.txt}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {sub.produk.map((p) => (
          <span key={p.name} style={{ fontSize: 11.5, fontWeight: 600, color: T.accent, background: T.accentSoft, padding: "3px 9px", borderRadius: 12 }}>{p.name}</span>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9 }}>
        <span style={{ fontSize: 11.5, color: T.inkSoft, flex: 1 }}>{sum.done}/{sum.total} syarat · {sum.foto} berfoto</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: status === "verified" ? T.verify : T.warn }}>{statusLine}</span>
      </div>
    </button>
  );
}
function CkViewRow({ it }) {
  const ok = it.status === "ok", na = it.status === "na";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: ok ? T.verify : na ? T.lineSoft : "#fff", border: `1.5px solid ${ok ? T.verify : T.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {ok && <CheckIcon color="#fff" />}
        {na && <span style={{ width: 9, height: 2, background: T.inkFaint, borderRadius: 2 }} />}
      </div>
      <span style={{ flex: 1, fontSize: 13.5, color: na ? T.inkFaint : T.ink, textDecoration: na ? "line-through" : "none" }}>{it.label}</span>
      {it.foto ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: T.verify, background: T.verifySoft, padding: "3px 8px", borderRadius: 10 }}>berfoto</span>
      ) : (
        <span style={{ fontSize: 10, fontWeight: 600, color: T.inkFaint }}>klaim</span>
      )}
    </div>
  );
}
function SubmissionDetail({ sub, status, verInfo, onVerify, onBack }) {
  const kuat = sub.evi === "kuat";
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: "none", background: T.lineSoft, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><ArrowLeft /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: T.ink }}>Pengajuan</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>{sub.sales} · {sub.tempat}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px" }}>
        {/* bukti kunjungan */}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
          <PinMini />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{sub.area} · {sub.time}</div>
            <div style={{ fontSize: 11.5, color: kuat ? T.verify : T.warn, marginTop: 1, fontWeight: 500 }}>{kuat ? "Foto tiba + GPS terkunci" : "Foto tiba ada · GPS kurang presisi"}</div>
          </div>
          <span style={{ fontSize: 10, color: kuat ? T.verify : T.warn, background: kuat ? T.verifySoft : T.warnSoft, padding: "3px 9px", borderRadius: 12, fontWeight: 700 }}>{kuat ? "KUAT" : "GPS lemah"}</span>
        </div>

        {/* checklist per produk */}
        {sub.produk.map((p) => (
          <div key={p.name} style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: T.ink }}>{p.name}</span>
              <span style={{ fontSize: 11.5, color: T.inkFaint }}>Ref: {p.ref}</span>
            </div>
            <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: "4px 14px 8px" }}>
              {p.items.map((it) => <CkViewRow key={it.label} it={it} />)}
            </div>
          </div>
        ))}

        {/* status verifikasi */}
        <div style={{ marginTop: 18 }}>
          {status === "pending" ? (
            <>
              <div style={{ background: T.warnSoft, borderRadius: 12, padding: "11px 13px", display: "flex", gap: 8, marginBottom: 12 }}>
                <InfoDot color={T.warn} />
                <div style={{ fontSize: 11.5, color: T.warn, lineHeight: 1.4 }}>
                  Belum ditinjau. Otomatis diterima dalam <b>{sub.daysLeft} hari</b> bila tidak diverifikasi (dapat diatur per vendor).
                </div>
              </div>
              <button onClick={onVerify}
                style={{ width: "100%", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, fontFamily: font.display, color: "#fff", background: T.verify, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <CheckIcon color="#fff" /> Verifikasi pengajuan
              </button>
            </>
          ) : status === "verified" ? (
            <div style={{ background: T.verifySoft, border: `1px solid ${T.verify}33`, borderRadius: 14, padding: "14px 15px", display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 34, height: 34, borderRadius: 17, background: T.verify, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckIcon color="#fff" /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Diverifikasi</div>
                <div style={{ fontSize: 12, color: T.verify, marginTop: 1 }}>{verInfo ? `${verInfo.by} · ${verInfo.at}` : `${sub.verifiedBy} · ${sub.verifiedAt}`}</div>
              </div>
            </div>
          ) : (
            <div style={{ background: T.warnSoft, border: `1px solid ${T.warn}33`, borderRadius: 14, padding: "14px 15px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Otomatis diterima</div>
              <div style={{ fontSize: 12, color: T.warn, marginTop: 2 }}>Lewat {AUTO_DAYS} hari tanpa ditinjau · tidak diverifikasi supervisor</div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: T.inkFaint, textAlign: "center", marginTop: 16, lineHeight: 1.5, padding: "0 6px" }}>
          Checklist = dikumpulkan sales, bukan verifikasi keaslian dokumen. Verifikasi supervisor menandai pengajuan sah untuk catatan vendor — persetujuan aplikasi tetap di BNI.
        </div>
      </div>
    </div>
  );
}
function TaskTeamCard({ t, onTap }) {
  const st = taskStat(t);
  const anom = taskAnomali(t);
  return (
    <button onClick={onTap}
      style={{ width: "100%", border: `1px solid ${anom > 0 ? T.danger + "44" : T.line}`, background: "#fff", borderRadius: 15, padding: "13px 14px", marginBottom: 10, cursor: "pointer", fontFamily: font.body, textAlign: "left", display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{t.judul}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 3 }}>{t.lokasi}{t.prospek ? ` · ${t.prospek}` : ""}</div>
        </div>
        <span style={{ fontSize: 11, color: T.inkSoft, flexShrink: 0 }}>{t.tanggal}</span>
      </div>
      {/* avatar assignees + status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 11, flexWrap: "wrap" }}>
        {t.assignees.map((a) => {
          const c = tone(TASK_PH[a.phase].tone);
          return (
            <span key={a.name} style={{ display: "flex", alignItems: "center", gap: 5, background: c.bg, borderRadius: 20, padding: "3px 9px 3px 4px" }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: c.fg, color: "#fff", fontSize: 8.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{a.ini}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: c.fg }}>{TASK_PH[a.phase].label}</span>
            </span>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: anom > 0 ? T.danger : T.inkFaint, marginTop: 9, fontWeight: anom > 0 ? 600 : 400 }}>
        {anom > 0 ? `${anom} belum mulai · jadwal lewat` : `${st.selesai} selesai · ${st.diterima} dikerjakan · ${st.assigned} belum diterima`}
      </div>
    </button>
  );
}
function TaskMonitorDetail({ task, onBack }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: "none", background: T.lineSoft, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><ArrowLeft /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15.5, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.judul}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>{task.tanggal} · {task.jam}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px" }}>
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
          <RowKV k="Lokasi" v={task.lokasi} />
          <RowKV k="Area" v={task.area} />
          {task.prospek && <RowKV k="Ketemu" v={task.prospek} />}
          <RowKV k="Produk fokus" v={task.produk} />
        </div>
        <div style={{ marginTop: 10, background: T.accentSoft, borderRadius: 12, padding: "11px 13px", fontSize: 12, color: T.accent, lineHeight: 1.45 }}>{task.instruksi}</div>

        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: T.ink, margin: "18px 0 8px" }}>Status per sales</div>
        {task.assignees.map((a) => {
          const c = tone(TASK_PH[a.phase].tone);
          return (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", border: `1px solid ${T.line}`, borderRadius: 12, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: c.bg, color: c.fg, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.ini}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{a.name}</div>
                <div style={{ fontSize: 11, color: c.fg, marginTop: 1, fontWeight: 600 }}>{TASK_PH[a.phase].label}{a.doneAt ? ` · ${a.doneAt}` : ""}</div>
              </div>
              {a.phase === "selesai" && <span style={{ fontSize: 10, color: T.verify, background: T.verifySoft, padding: "3px 8px", borderRadius: 10, fontWeight: 700 }}>checklist lengkap</span>}
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: T.inkFaint, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
          Pantauan saja. Checklist aksi standar melekat otomatis; hasil terkunci di sisi sales.
        </div>
      </div>
    </div>
  );
}
function TaskCreate({ roster, onBack, onCreate }) {
  const [judul, setJudul] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [area, setArea] = useState("");
  const [prospek, setProspek] = useState("");
  const [produk, setProduk] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jam, setJam] = useState("");
  const [instruksi, setInstruksi] = useState("");
  const [sales, setSales] = useState([]);
  const [showProduk, setShowProduk] = useState(false);

  const toggleSales = (s) => setSales((cur) => (cur.find((x) => x.name === s.name) ? cur.filter((x) => x.name !== s.name) : [...cur, { name: s.name, ini: s.ini }]));
  const valid = judul.trim() && lokasi.trim() && produk && tanggal.trim() && sales.length > 0;

  const fld = (label, val, set, ph, opsional) => (
    <div style={{ marginBottom: 13 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>{label} {opsional && <span style={{ color: T.inkFaint, fontWeight: 500 }}>· opsional</span>}</div>
      <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
        style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 12, border: `1px solid ${T.line}`, fontSize: 14.5, color: T.ink, fontFamily: font.body, background: "#fff", outline: "none" }} />
    </div>
  );

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: "none", background: T.lineSoft, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><ArrowLeft /></button>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: T.ink }}>Tugas baru</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>
        {fld("Judul tugas", judul, setJudul, "mis. Promosi KTA — Ruko Blok M")}
        {fld("Lokasi", lokasi, setLokasi, "mis. Ruko Blok M Square")}
        {fld("Area", area, setArea, "mis. Kebayoran Baru")}
        {fld("Prospek / nasabah dituju", prospek, setProspek, "mis. Pak Hartono", true)}

        {/* produk picker */}
        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Produk fokus</div>
          <button onClick={() => setShowProduk((v) => !v)} style={{ width: "100%", textAlign: "left", padding: "12px 13px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#fff", cursor: "pointer", fontFamily: font.body, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14.5, fontWeight: produk ? 700 : 500, color: produk ? T.ink : T.inkFaint }}>{produk || "Pilih produk"}</span>
            <span style={{ fontSize: 12, color: T.inkSoft }}>▾</span>
          </button>
          {showProduk && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8 }}>
              {PRODUK_LIST.map((p) => (
                <button key={p} onClick={() => { setProduk(p); setShowProduk(false); }}
                  style={{ border: `1.5px solid ${produk === p ? T.accent : T.line}`, background: produk === p ? T.accentSoft : "#fff", color: produk === p ? T.accent : T.inkSoft, fontWeight: 600, fontSize: 13, padding: "7px 12px", borderRadius: 20, cursor: "pointer", fontFamily: font.body }}>{p}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>{fld("Tanggal", tanggal, setTanggal, "mis. Hari ini")}</div>
          <div style={{ flex: 1 }}>{fld("Jam", jam, setJam, "10:00–12:00")}</div>
        </div>

        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Instruksi</div>
          <textarea value={instruksi} onChange={(e) => setInstruksi(e.target.value)} placeholder="Arahan singkat untuk sales…" rows={2}
            style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 12, border: `1px solid ${T.line}`, fontSize: 14, color: T.ink, fontFamily: font.body, background: "#fff", outline: "none", resize: "none" }} />
        </div>

        {/* assign sales multi */}
        <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 8 }}>Tetapkan ke sales <span style={{ color: T.inkFaint, fontWeight: 500 }}>· bisa lebih dari satu</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {roster.filter((s) => s.clockIn !== undefined).map((s) => {
            const on = !!sales.find((x) => x.name === s.name);
            return (
              <button key={s.id} onClick={() => toggleSales(s)}
                style={{ display: "flex", alignItems: "center", gap: 6, border: `1.5px solid ${on ? T.accent : T.line}`, background: on ? T.accentSoft : "#fff", borderRadius: 22, padding: "6px 12px 6px 6px", cursor: "pointer", fontFamily: font.body }}>
                <span style={{ width: 22, height: 22, borderRadius: 11, background: on ? T.accent : T.lineSoft, color: on ? "#fff" : T.inkSoft, fontSize: 9.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.ini}</span>
                <span style={{ fontSize: 13, fontWeight: on ? 700 : 500, color: on ? T.accent : T.inkSoft }}>{s.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 14, background: T.verifySoft, borderRadius: 12, padding: "10px 13px", display: "flex", gap: 8 }}>
          <InfoDot color={T.verify} />
          <div style={{ fontSize: 11.5, color: T.verify, lineHeight: 1.45 }}>
            Checklist aksi standar melekat otomatis: {AKSI_STANDAR.join(", ")}. Foto wajib per langkah.
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "12px 20px 14px", borderTop: `1px solid ${T.lineSoft}`, background: "#fff" }}>
        <button onClick={() => valid && onCreate({ judul, lokasi, area, prospek: prospek.trim() || null, produk, tanggal, jam, instruksi, sales })} disabled={!valid}
          style={{ width: "100%", border: "none", borderRadius: 14, padding: "15px 0", fontSize: 15, fontWeight: 700, fontFamily: font.display, color: "#fff", background: valid ? T.ink : "#C6CAD1", cursor: valid ? "pointer" : "not-allowed" }}>
          Buat & tetapkan{sales.length > 1 ? ` (${sales.length} sales)` : ""}
        </button>
      </div>
    </div>
  );
}
function PlusIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={T.accent} strokeWidth="2" strokeLinecap="round"/></svg>);
}
function RowKV({ k, v }) {
  return (
    <div style={{ padding: "12px 15px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: T.inkSoft, flexShrink: 0 }}>{k}</span>
      <span style={{ fontSize: 13, color: T.ink, fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}
function CoverageRow({ c }) {
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: "13px 15px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <PinMini />
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: T.ink }}>{c.area}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: T.ink, lineHeight: 1 }}>{c.visits}</div>
          <div style={{ fontSize: 10, color: T.inkFaint }}>kunjungan</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 11, height: 5, borderRadius: 4, overflow: "hidden" }}>
        {ORDER.map((k) => c.counts[k] ? <div key={k} style={{ flex: c.counts[k], background: tone(HASIL_META[k].tone).fg, opacity: 0.85 }} /> : null)}
      </div>
      <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 9 }}>{c.sales.size} sales menyisir</div>
    </div>
  );
}

/* ---------- lapis 2: detail sales ---------- */
function DetailSales({ s, onBack }) {
  const counts = countsOf(s.visits);
  const areas = [...new Set(s.visits.map((v) => v.area))];
  const status = statusOf(s);
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: "none", background: T.lineSoft, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <ArrowLeft />
        </button>
        <Avatar ini={s.ini} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: T.ink }}>{s.name}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>Divisi Sales · Wilayah Selatan</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px" }}>
        {/* absensi */}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: "13px 15px", display: "flex", alignItems: "center", gap: 11 }}>
          {s.clockIn ? <PinMini /> : <span style={{ width: 16, height: 16, borderRadius: 8, background: T.dangerSoft, display: "inline-block" }} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{s.clockIn ? `Clock-in ${s.clockIn}` : "Belum clock-in"}</div>
            <div style={{ fontSize: 11.5, color: s.clockIn ? T.verify : T.danger, marginTop: 1, fontWeight: 500 }}>{s.clockIn ? `${s.clockArea} · GPS terkunci` : "Belum ada aktivitas hari ini"}</div>
          </div>
          {s.clockIn && <span style={{ fontSize: 10, color: T.verify, background: T.verifySoft, padding: "3px 9px", borderRadius: 14, fontWeight: 700 }}>KUAT</span>}
        </div>

        {status === "belum-gerak" || status === "belum-clockin" ? (
          <div style={{ marginTop: 18, border: `1px dashed ${T.line}`, borderRadius: 14, padding: "26px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Belum ada kunjungan dilaporkan</div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 6, lineHeight: 1.5 }}>
              {status === "belum-clockin" ? "Sales belum mulai hari ini." : "Sudah clock-in tapi belum ada laporan pemasaran. Bisa jadi sedang kerja — konfirmasi dulu, sistem tidak menuduh."}
            </div>
          </div>
        ) : (
          <>
            {/* ringkasan */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 18 }}>
              <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 34, lineHeight: 0.95, color: T.ink, letterSpacing: -1 }}>{s.visits.length}</div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>kunjungan hari ini</div>
                <div style={{ fontSize: 11.5, color: T.inkFaint }}>{areas.join(" · ")}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
              {ORDER.map((k) => {
                const c = tone(HASIL_META[k].tone);
                return (
                  <div key={k} style={{ background: c.bg, borderRadius: 11, padding: "9px 4px", textAlign: "center" }}>
                    <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 18, color: c.fg }}>{counts[k]}</div>
                    <div style={{ fontSize: 10, color: c.fg, fontWeight: 600, marginTop: 1 }}>{HASIL_META[k].label}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13.5, color: T.ink, margin: "20px 0 4px" }}>Timeline kunjungan</div>
            {s.visits.map((v, i) => <VisitRow key={i} v={v} />)}
          </>
        )}

        <div style={{ fontSize: 11, color: T.inkFaint, textAlign: "center", marginTop: 18, lineHeight: 1.5, padding: "0 8px" }}>
          Catatan terkunci sejak dibuat. Hasil = laporan sales; status akun keputusan bank.
        </div>
      </div>
    </div>
  );
}

/* ---------- kecil ---------- */
function SectionTitle({ text, count, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: T.ink, letterSpacing: -0.2 }}>{text}</span>
      {count != null && <span style={{ fontSize: 12, color: T.inkFaint }}>{count} {sub || ""}</span>}
    </div>
  );
}
function VisitRow({ v }) {
  const meta = HASIL_META[v.hasil];
  const c = tone(meta.tone);
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
      <div style={{ width: 42, flexShrink: 0, textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: font.display }}>{v.time}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.place}</div>
        <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{v.area} · {v.produk.join(", ")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: c.fg, background: c.bg, padding: "3px 9px", borderRadius: 14 }}>{meta.label}</span>
          <EviTag kuat={v.evi === "kuat"} />
        </div>
      </div>
    </div>
  );
}
function EviTag({ kuat }) {
  return kuat ? (
    <span style={{ fontSize: 10, fontWeight: 700, color: T.verify, display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ width: 6, height: 6, borderRadius: 6, background: T.verify }} /> KUAT
    </span>
  ) : (
    <span style={{ fontSize: 10, fontWeight: 700, color: T.warn, display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ width: 6, height: 6, borderRadius: 6, background: T.warn }} /> GPS lemah
    </span>
  );
}

/* ---------- ikon ---------- */
function PinMini() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" stroke={T.verify} strokeWidth="1.9" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.4" fill={T.verify}/></svg>);
}
function InfoDot({ color }) {
  const c = color || T.claim;
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/><path d="M12 11v5" stroke={c} strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7.6" r="1.1" fill={c}/></svg>);
}
function Chevron() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" stroke={T.inkFaint} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function ArrowLeft() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function CheckIcon({ color = "#fff" }) {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function PhoneIcon({ color }) {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6.5 4h3l1.4 3.5-2 1.5a11 11 0 005 5l1.5-2 3.5 1.4v3a1.5 1.5 0 01-1.6 1.5A15 15 0 015 6.6 1.5 1.5 0 016.5 4z" stroke={color} strokeWidth="1.7" strokeLinejoin="round"/></svg>);
}
function ChatIcon({ color }) {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 5h14a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 3V6a1 1 0 011-1z" stroke={color} strokeWidth="1.7" strokeLinejoin="round"/></svg>);
}
