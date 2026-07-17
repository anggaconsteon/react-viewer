import React, { useState, useMemo } from "react";

/**
 * AUTSORZ — Divisi Sales (worker app, gabungan)
 * Dua layar sisi sales dalam satu frame + bottom nav:
 *   • Kunjungan — mulai & lapor kunjungan (visit capture, roaming, tanpa QR)
 *   • Histori   — hasil kunjungan sendiri (hari ini / minggu ini)
 *
 * EVOLUSI v2 (diadopsi dari review, yang murah & stateless saja):
 *   [#4] Start-Visit sebagai GERBANG — tap "Mulai kunjungan" → GPS + foto tiba
 *        dikunci DULUAN, baru field interaksi kebuka. Pola QR-gate cleaning (§25).
 *        Bukti tiba tak bisa di-backfill dari rumah → integritas naik.
 *   [#9] Rename "Lapor" → "Mulai Kunjungan" — mental model operasional, bukan admin.
 *   [#6-lite] Opsi "Tidak bertemu" — visit outcome ringan; kalau tak ada interaksi,
 *        hasil bisnis TIDAK dipaksakan (data bersih). SATU state cabang, bukan dua
 *        sumbu wajib tiap kunjungan (itu pajak input).
 *
 * SENGAJA DITAHAN (north star, bukan V1): prospect-as-entity, mission-first,
 * lifecycle penuh, next-action terjadwal — semua stateful / butuh penugasan (§8/§26).
 *
 * Prinsip yang dijaga:
 *  - Lokasi = GPS otomatis; sales roaming, tidak ada titik ber-QR.
 *  - "Hasil" = KLAIM sales ("dilaporkan"), bukan fakta bank. Tidak pernah
 *    menampilkan "disetujui/approved" — status akun keputusan bank (§15/§25).
 *  - Follow-up = FILTER atas record terkunci, bukan pipeline (V2 stateful).
 *  - Submit tertangkap di perangkat dulu → antrian offline → centang WA (§18).
 *  - Tanpa leaderboard.
 *
 * Palette C / Plus Jakarta Sans + Inter — samakan token bila digabung ke basis kode utama.
 */

/* ================= token bersama ================= */
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
  tertarik: { label: "Tertarik",  tone: "verify", hint: "Prospek minat, belum ajukan" },
  ajukan:   { label: "Ajukan",    tone: "claim",  hint: "Form aplikasi diisi & diajukan" },
  followup: { label: "Follow-up", tone: "accent", hint: "Perlu kunjungan ulang" },
  tolak:    { label: "Tolak",     tone: "danger", hint: "Prospek tidak berminat" },
};
const ORDER = ["tertarik", "ajukan", "followup", "tolak"];
function tone(t) {
  switch (t) {
    case "verify": return { fg: T.verify, bg: T.verifySoft };
    case "claim":  return { fg: T.claim,  bg: T.claimSoft  };
    case "danger": return { fg: T.danger, bg: T.dangerSoft };
    case "warn":   return { fg: T.warn,   bg: T.warnSoft   };
    default:       return { fg: T.accent, bg: T.accentSoft };
  }
}

const PRODUK_BNI = ["Tabungan", "Kartu Kredit", "KTA / Pinjaman", "Payroll", "KPR", "Deposito"];
const ALASAN_TAK_BERTEMU = ["Tempat tutup", "Pemilik tidak ada", "Ditolak masuk", "Lainnya"];

/* template syarat per produk — DIKONFIGURASI (bukan dikoding); tambah produk = tambah baris */
const SYARAT = {
  "Tabungan": ["KTP", "Setoran awal", "Foto form aplikasi"],
  "Kartu Kredit": ["KTP", "Slip gaji", "NPWP", "Foto form aplikasi"],
  "KTA / Pinjaman": ["KTP", "Slip gaji", "Rekening koran", "Foto form aplikasi"],
  "Payroll": ["KTP", "Data perusahaan", "Foto form aplikasi"],
  "KPR": ["KTP", "Slip gaji", "NPWP", "Sertifikat", "Foto form aplikasi"],
  "Deposito": ["KTP", "Dana penempatan", "Foto form aplikasi"],
  _default: ["KTP", "Foto form aplikasi"],
};

/* ================= shell + nav ================= */
export default function SalesWorkerApp() {
  const [tab, setTab] = useState("lapor"); // lapor | histori
  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", fontFamily: font.body, padding: "24px 0" }}>
      <div style={{ width: 390, height: 780, background: T.card, borderRadius: 28, overflow: "hidden", boxShadow: "0 24px 60px rgba(20,24,30,0.14)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {tab === "lapor" ? <KunjunganScreen /> : tab === "tugas" ? <TugasScreen /> : <HistoriScreen />}
        </div>
        <NavBar tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}

function NavBar({ tab, setTab }) {
  const items = [
    { id: "lapor", label: "Kunjungan", icon: (a) => <RouteIcon color={a} /> },
    { id: "tugas", label: "Tugas", icon: (a) => <TaskIcon color={a} /> },
    { id: "histori", label: "Histori", icon: (a) => <HistoryIcon color={a} /> },
  ];
  return (
    <div style={{ borderTop: `1px solid ${T.line}`, display: "flex", background: "#fff", padding: "8px 0 10px" }}>
      {items.map((it) => {
        const on = tab === it.id;
        const c = on ? T.accent : T.inkFaint;
        return (
          <button key={it.id} onClick={() => setTab(it.id)}
            style={{ flex: 1, border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 0", fontFamily: font.body }}>
            {it.icon(c)}
            <span style={{ fontSize: 11, fontWeight: on ? 700 : 500, color: c }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Header({ title, sub }) {
  return (
    <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: T.ink, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: font.display, fontWeight: 800, fontSize: 15 }}>A</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: T.ink, letterSpacing: -0.2 }}>{title}</div>
        <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 1 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 12, color: T.inkSoft, textAlign: "right", lineHeight: 1.3 }}>
        <div style={{ fontWeight: 600, color: T.ink }}>Budi S.</div>
        <div style={{ color: T.inkFaint }}>Clock-in 07:45</div>
      </div>
    </div>
  );
}

/* ================= LAYAR: KUNJUNGAN ================= */
function KunjunganScreen() {
  // phase: form | sending | sent  (gerbang "started" ada di dalam fase form, satu halaman)
  const [phase, setPhase] = useState("form");
  const [started, setStarted] = useState(false);
  const [capturing, setCapturing] = useState(false); // kamera foto tiba terbuka
  const [startedAt, setStartedAt] = useState(null);

  const [tempat, setTempat] = useState("");
  const [kontak, setKontak] = useState("");
  const [bertemu, setBertemu] = useState(true); // default: ketemu (kasus umum, tanpa tap ekstra)
  const [alasan, setAlasan] = useState(null);
  const [produk, setProduk] = useState([]);
  const [hasil, setHasil] = useState(null);
  const [ajukanProduk, setAjukanProduk] = useState([]); // produk yang diajukan (subset dari produk)
  const [checklist, setChecklist] = useState({});       // `${produk}|${item}` -> {status:'belum'|'ok'|'na', foto:bool}
  const [refs, setRefs] = useState({});                 // no. ref per produk
  const [keterangan, setKeterangan] = useState("");
  const [delivery, setDelivery] = useState("device");

  const toggleProduk = (p) => setProduk((c) => (c.includes(p) ? c.filter((x) => x !== p) : [...c, p]));
  const toggleAjukan = (p) => setAjukanProduk((c) => (c.includes(p) ? c.filter((x) => x !== p) : [...c, p]));
  const ckKey = (p, it) => `${p}|${it}`;
  const ckOf = (p, it) => checklist[ckKey(p, it)] || { status: "belum", foto: false };
  const setCkStatus = (p, it, st) => setChecklist((c) => { const k = ckKey(p, it); const cur = c[k] || { status: "belum", foto: false }; return { ...c, [k]: { ...cur, status: cur.status === st ? "belum" : st } }; });
  const toggleCkFoto = (p, it) => setChecklist((c) => { const k = ckKey(p, it); const cur = c[k] || { status: "belum", foto: false }; return { ...c, [k]: { ...cur, foto: !cur.foto } }; });

  const canSubmit =
    started &&
    tempat.trim() &&
    (bertemu ? (produk.length > 0 && hasil && (hasil !== "ajukan" || ajukanProduk.length > 0)) : !!alasan);

  const openCamera = () => setCapturing(true); // GPS masih live; foto = aksi gerbang
  const shutter = () => {
    // momen capture: foto + GPS + waktu dibekukan barengan
    setCapturing(false); setStarted(true); setStartedAt("07:52");
  };
  const submit = () => {
    if (!canSubmit) return;
    setPhase("sending");
    setTimeout(() => { setPhase("sent"); setDelivery("device"); setTimeout(() => setDelivery("server"), 1600); }, 900);
  };
  const nextVisit = () => {
    setPhase("form"); setStarted(false); setCapturing(false); setStartedAt(null);
    setTempat(""); setKontak(""); setBertemu(true); setAlasan(null);
    setProduk([]); setHasil(null); setAjukanProduk([]); setChecklist({}); setRefs({}); setKeterangan("");
    setDelivery("device");
  };

  const headerTitle = phase === "sent" ? "Kunjungan selesai" : started ? "Kunjungan berjalan" : "Mulai Kunjungan";

  /* ---- fase SENT ---- */
  if (phase === "sent") {
    return (
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Header title={headerTitle} sub="Divisi Sales · BNI" />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <SentScreen delivery={delivery} tempat={tempat} bertemu={bertemu} alasan={alasan} produk={produk} hasil={hasil} onNext={nextVisit} />
        </div>
      </div>
    );
  }

  const ketNo = bertemu ? "5" : "4";
  const lockStyle = { opacity: started ? 1 : 0.4, pointerEvents: started ? "auto" : "none", transition: "opacity .25s" };

  /* ---- fase FORM: SATU HALAMAN, gerbang di atas (§25) ---- */
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Header title={headerTitle} sub="Divisi Sales · BNI" />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px", opacity: phase === "sending" ? 0.55 : 1, pointerEvents: phase === "sending" ? "none" : "auto", transition: "opacity .2s" }}>

        {/* GERBANG di atas — GPS live → jepret foto (aksi gerbang) → semua beku bareng */}
        {started ? (
          <div style={{ background: T.verifySoft, border: `1px solid ${T.verify}22`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
            {/* thumbnail foto tiba */}
            <div style={{ width: 42, height: 42, borderRadius: 9, background: "linear-gradient(135deg,#C7D8CF,#8FB3A3)", position: "relative", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <svg width="42" height="26" viewBox="0 0 42 26" fill="none" style={{ display: "block" }}><path d="M0 26L11 12l6 6 8-11 17 19z" fill="#6E9384"/></svg>
              <div style={{ position: "absolute", top: 3, right: 3, width: 14, height: 14, borderRadius: 7, background: T.verify, display: "flex", alignItems: "center", justifyContent: "center" }}><CheckIcon color="#fff" /></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>Kunjungan dimulai · {startedAt}</div>
              <div style={{ fontSize: 11.5, color: T.verify, marginTop: 1, fontWeight: 500 }}>Foto tiba + GPS terkunci di detik yang sama</div>
            </div>
            <div style={{ fontSize: 10.5, color: T.verify, background: "#fff", borderRadius: 20, padding: "3px 9px", fontWeight: 700, border: `1px solid ${T.verify}33` }}>KUAT</div>
          </div>
        ) : capturing ? (
          /* viewfinder kamera — di sinilah foto diambil */
          <div style={{ borderRadius: 16, overflow: "hidden", background: "#1B1E24" }}>
            <div style={{ position: "relative", height: 190, background: "linear-gradient(160deg,#2A2E36 0%,#1B1E24 100%)" }}>
              <div style={{ position: "absolute", inset: 14, border: "2px solid #ffffff33", borderRadius: 10 }} />
              {["tl", "tr", "bl", "br"].map((k) => (
                <div key={k} style={{ position: "absolute", width: 18, height: 18, borderColor: "#fff", borderStyle: "solid",
                  borderWidth: k === "tl" ? "2px 0 0 2px" : k === "tr" ? "2px 2px 0 0" : k === "bl" ? "0 0 2px 2px" : "0 2px 2px 0",
                  top: k[0] === "t" ? 22 : "auto", bottom: k[0] === "b" ? 22 : "auto", left: k[1] === "l" ? 22 : "auto", right: k[1] === "r" ? 22 : "auto" }} />
              ))}
              <div style={{ position: "absolute", top: 12, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 11.5, fontWeight: 600, opacity: 0.9 }}>Arahkan ke tempat / lapak prospek</div>
              <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, color: "#fff", fontSize: 10.5, opacity: 0.8 }}>
                <PinTinyWhite /> Pasar Minggu · GPS ±8 m · 07:52
              </div>
            </div>
            <div style={{ padding: "12px 0 8px", display: "flex", justifyContent: "center", background: "#15171C" }}>
              <button onClick={shutter} aria-label="Ambil foto"
                style={{ width: 58, height: 58, borderRadius: 29, background: "#fff", border: "4px solid #4A4F57", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: 21, background: "#fff", border: "1px solid #C6CAD1" }} />
              </button>
            </div>
            <div style={{ textAlign: "center", fontSize: 11, color: "#C6CAD1", padding: "0 12px 12px", background: "#15171C" }}>Tekan untuk ambil foto tiba — kamera langsung, bukan dari galeri.</div>
          </div>
        ) : (
          <div style={{ background: T.verifySoft, border: `1px solid ${T.verify}22`, borderRadius: 16, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <PinIcon />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>Pasar Minggu, Jakarta Selatan</div>
                <div style={{ fontSize: 11.5, color: T.verify, marginTop: 2, fontWeight: 500 }}>GPS aktif · akurasi ±8 m · belum dibekukan</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <GateChip icon={<PinTiny />} text="GPS otomatis" />
              <GateChip icon={<CamTiny />} text="Foto tiba wajib" />
            </div>
            <button onClick={openCamera}
              style={{ width: "100%", marginTop: 14, border: "none", borderRadius: 13, padding: "13px 0", fontSize: 14.5, fontWeight: 700, fontFamily: font.display, letterSpacing: 0.2, cursor: "pointer", color: "#fff", background: T.verify, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CamTinyWhite /> Ambil foto tiba & mulai
            </button>
            <div style={{ fontSize: 11, color: T.verify, textAlign: "center", marginTop: 9, lineHeight: 1.4, opacity: 0.9 }}>
              Foto diambil lewat kamera saat ini juga. GPS & waktu ikut terkunci di momen jepret.
            </div>
          </div>
        )}

        {!started && (
          <div style={{ fontSize: 11.5, color: T.inkFaint, textAlign: "center", margin: "12px 0 2px", lineHeight: 1.4 }}>
            Isian hasil kebuka setelah kunjungan dimulai.
          </div>
        )}

        {/* SEKSI ISIAN — terlihat tapi redup & terkunci sampai mulai (§25) */}
        <div style={lockStyle}>
          {/* 1. Tempat & prospek */}
          <SectionLabel n="1" text="Tempat & prospek" />
          <Field value={tempat} onChange={setTempat} placeholder="Nama toko / usaha / prospek" />
          <div style={{ height: 8 }} />
          <Field value={kontak} onChange={setKontak} placeholder="Nama kontak (opsional)" />

          {/* 2. Status kunjungan */}
          <SectionLabel n="2" text="Status kunjungan" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatusBtn active={bertemu} onClick={() => setBertemu(true)} tone="verify" label="Bertemu prospek" sub="Ada interaksi" />
            <StatusBtn active={!bertemu} onClick={() => setBertemu(false)} tone="warn" label="Tidak bertemu" sub="Tutup / tak ada" />
          </div>

          {bertemu ? (
            <>
              {/* 3. Produk */}
              <SectionLabel n="3" text="Produk yang ditawarkan" note="bisa lebih dari satu" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRODUK_BNI.map((p) => {
                  const on = produk.includes(p);
                  return (
                    <button key={p} onClick={() => toggleProduk(p)}
                      style={{ border: `1.5px solid ${on ? T.accent : T.line}`, background: on ? T.accentSoft : "#fff", color: on ? T.accent : T.inkSoft, fontWeight: on ? 600 : 500, fontSize: 13, padding: "8px 13px", borderRadius: 22, cursor: "pointer", fontFamily: font.body, transition: "all .12s" }}>
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* 4. Hasil */}
              <SectionLabel n="4" text="Hasil kunjungan" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {ORDER.map((id) => {
                  const h = HASIL_META[id];
                  const on = hasil === id;
                  const c = tone(h.tone);
                  return (
                    <button key={id} onClick={() => { setHasil(id); if (id === "ajukan" && ajukanProduk.length === 0) setAjukanProduk([...produk]); }}
                      style={{ textAlign: "left", border: `1.5px solid ${on ? c.fg : T.line}`, background: on ? c.bg : "#fff", borderRadius: 14, padding: "11px 12px", cursor: "pointer", fontFamily: font.body, transition: "all .12s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 9, background: on ? c.fg : T.line, display: "inline-block" }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: on ? c.fg : T.ink }}>{h.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: on ? c.fg : T.inkFaint, marginTop: 4, lineHeight: 1.3, opacity: on ? 0.85 : 1 }}>{h.hint}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 7, marginTop: 10, background: T.claimSoft, borderRadius: 11, padding: "9px 11px" }}>
                <InfoDot />
                <div style={{ fontSize: 11.5, color: T.claim, lineHeight: 1.4 }}>
                  Tercatat sebagai <b>hasil yang kamu laporkan</b>. Bukti kunjungan (foto, GPS, waktu) tetap terkunci — status akun tetap keputusan bank.
                </div>
              </div>

              {hasil === "ajukan" && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.claim, marginBottom: 10, letterSpacing: 0.2 }}>PENGAJUAN — SYARAT DIKUMPULKAN</div>

                  {/* pilih produk yang diajukan bila menawarkan lebih dari satu */}
                  {produk.length > 1 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 7 }}>Produk yang diajukan:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {produk.map((p) => {
                          const on = ajukanProduk.includes(p);
                          return (
                            <button key={p} onClick={() => toggleAjukan(p)}
                              style={{ border: `1.5px solid ${on ? T.claim : T.line}`, background: on ? T.claimSoft : "#fff", color: on ? T.claim : T.inkSoft, fontWeight: on ? 700 : 500, fontSize: 13, padding: "7px 13px", borderRadius: 22, cursor: "pointer", fontFamily: font.body }}>
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {ajukanProduk.length === 0 ? (
                    <div style={{ fontSize: 12, color: T.inkFaint, fontStyle: "italic", padding: "4px 0" }}>Pilih produk yang diajukan di atas.</div>
                  ) : (
                    ajukanProduk.map((p) => (
                      <ChecklistCard key={p} product={p} items={SYARAT[p] || SYARAT._default}
                        ckOf={ckOf} setCkStatus={setCkStatus} toggleCkFoto={toggleCkFoto}
                        refVal={refs[p] || ""} onRef={(v) => setRefs((r) => ({ ...r, [p]: v }))} />
                    ))
                  )}

                  <div style={{ display: "flex", gap: 7, marginTop: 4, background: T.claimSoft, borderRadius: 11, padding: "9px 11px" }}>
                    <InfoDot />
                    <div style={{ fontSize: 11.5, color: T.claim, lineHeight: 1.4 }}>
                      Checklist ini = <b>dikumpulkan sales</b>, bukan verifikasi keaslian dokumen. Kelayakan & persetujuan tetap keputusan BNI.
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 3'. Alasan tidak bertemu */}
              <SectionLabel n="3" text="Alasan tidak bertemu" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALASAN_TAK_BERTEMU.map((a) => {
                  const on = alasan === a;
                  const c = tone("warn");
                  return (
                    <button key={a} onClick={() => setAlasan(a)}
                      style={{ border: `1.5px solid ${on ? c.fg : T.line}`, background: on ? c.bg : "#fff", color: on ? c.fg : T.inkSoft, fontWeight: on ? 600 : 500, fontSize: 13, padding: "8px 13px", borderRadius: 22, cursor: "pointer", fontFamily: font.body, transition: "all .12s" }}>
                      {a}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 10, background: T.warnSoft, borderRadius: 11, padding: "9px 11px" }}>
                <InfoDot color={T.warn} />
                <div style={{ fontSize: 11.5, color: T.warn, lineHeight: 1.4 }}>
                  Kunjungan tetap tercatat sebagai bukti kamu <b>datang ke lokasi</b>. Tanpa interaksi, hasil bisnis tidak diisi — biar data jujur.
                </div>
              </div>
            </>
          )}

          {/* Keterangan */}
          <SectionLabel n={ketNo} text="Keterangan" note="opsional" />
          <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Catatan singkat kunjungan…" rows={3}
            style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${T.line}`, borderRadius: 14, padding: "11px 13px", fontSize: 14, color: T.ink, fontFamily: font.body, resize: "none", outline: "none", background: "#fff" }} />
        </div>
      </div>

      {/* submit bar */}
      <div style={{ flexShrink: 0, padding: "12px 20px 14px", borderTop: `1px solid ${T.lineSoft}`, background: "#fff" }}>
        <button onClick={submit} disabled={!canSubmit || phase === "sending"}
          style={{ width: "100%", border: "none", borderRadius: 15, padding: "15px 0", fontSize: 15, fontWeight: 700, fontFamily: font.display, letterSpacing: 0.2, cursor: canSubmit && phase !== "sending" ? "pointer" : "not-allowed", color: "#fff", background: canSubmit ? T.ink : "#C6CAD1", transition: "background .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
          {phase === "sending" ? (<><Spinner /> Memproses…</>) : "Selesaikan kunjungan"}
        </button>
        <div style={{ textAlign: "center", fontSize: 11, color: T.inkFaint, marginTop: 8 }}>{started ? "Tersimpan di HP dulu, terkirim saat sinyal ada." : "Mulai kunjungan dulu untuk mengisi hasil."}</div>
      </div>
    </div>
  );
}

/* ================= LAYAR: HISTORI ================= */
const VISITS = [
  { day: "Kam", date: "Hari ini", time: "14:20", place: "Toko Berkah Jaya", area: "Pasar Minggu", produk: ["Tabungan", "Kartu Kredit"], hasil: "followup", evi: "kuat" },
  { day: "Kam", date: "Hari ini", time: "13:05", place: "Warung Bu Sri", area: "Pasar Minggu", produk: ["KTA"], hasil: "tolak", evi: "kuat" },
  { day: "Kam", date: "Hari ini", time: "11:40", place: "Konter Pulsa Andi", area: "Kalibata", produk: ["Tabungan"], hasil: "ajukan", evi: "kuat" },
  { day: "Kam", date: "Hari ini", time: "10:55", place: "Bengkel Motor Jaya", area: "Kalibata", produk: ["Kartu Kredit"], hasil: "tertarik", evi: "kuat" },
  { day: "Kam", date: "Hari ini", time: "10:10", place: "Lapak Sayur Pasar", area: "Kalibata", produk: ["Tabungan"], hasil: "followup", evi: "lemah" },
  { day: "Kam", date: "Hari ini", time: "09:25", place: "Toko Kelontong Maju", area: "Pancoran", produk: ["KTA", "Tabungan"], hasil: "ajukan", evi: "kuat" },
  { day: "Kam", date: "Hari ini", time: "08:50", place: "Kios Rokok Wawan", area: "Pancoran", produk: ["Tabungan"], hasil: "tertarik", evi: "kuat" },
  { day: "Kam", date: "Hari ini", time: "08:15", place: "Warteg Sederhana", area: "Pancoran", produk: ["Kartu Kredit"], hasil: "followup", evi: "kuat" },
  { day: "Rab", date: "Rab, 2 Jul", time: "15:30", place: "Toko Bangunan Sinar", area: "Tebet", produk: ["KTA"], hasil: "followup", evi: "kuat" },
  { day: "Rab", date: "Rab, 2 Jul", time: "14:00", place: "Apotek Sehat", area: "Tebet", produk: ["Tabungan"], hasil: "tolak", evi: "kuat" },
  { day: "Rab", date: "Rab, 2 Jul", time: "12:20", place: "Laundry Kilat", area: "Tebet", produk: ["Kartu Kredit"], hasil: "ajukan", evi: "kuat" },
  { day: "Rab", date: "Rab, 2 Jul", time: "11:00", place: "Warung Kopi Mampang", area: "Mampang", produk: ["Tabungan"], hasil: "tertarik", evi: "kuat" },
  { day: "Rab", date: "Rab, 2 Jul", time: "09:40", place: "Kios HP Mampang", area: "Mampang", produk: ["KTA"], hasil: "followup", evi: "lemah" },
  { day: "Rab", date: "Rab, 2 Jul", time: "08:30", place: "Toko Sembako Rejeki", area: "Mampang", produk: ["Tabungan"], hasil: "followup", evi: "kuat" },
  { day: "Sel", date: "Sel, 1 Jul", time: "14:10", place: "Percetakan Jaya", area: "Cikoko", produk: ["Kartu Kredit"], hasil: "ajukan", evi: "kuat" },
  { day: "Sel", date: "Sel, 1 Jul", time: "12:30", place: "Warnet Global", area: "Cikoko", produk: ["Tabungan"], hasil: "tolak", evi: "kuat" },
  { day: "Sel", date: "Sel, 1 Jul", time: "10:50", place: "Salon Cantik", area: "Tebet", produk: ["KTA"], hasil: "followup", evi: "kuat" },
  { day: "Sel", date: "Sel, 1 Jul", time: "09:20", place: "Toko Kue Manis", area: "Tebet", produk: ["Tabungan"], hasil: "tertarik", evi: "kuat" },
  { day: "Sel", date: "Sel, 1 Jul", time: "08:40", place: "Bengkel Las Cikoko", area: "Cikoko", produk: ["KTA"], hasil: "followup", evi: "kuat" },
  { day: "Sen", date: "Sen, 30 Jun", time: "15:00", place: "Toko Grosir Hemat", area: "Pasar Minggu", produk: ["Tabungan"], hasil: "tolak", evi: "kuat" },
  { day: "Sen", date: "Sen, 30 Jun", time: "13:15", place: "Depot Air Segar", area: "Pasar Minggu", produk: ["Kartu Kredit"], hasil: "ajukan", evi: "kuat" },
  { day: "Sen", date: "Sen, 30 Jun", time: "11:30", place: "Warung Nasi Padang", area: "Kalibata", produk: ["Tabungan"], hasil: "tertarik", evi: "kuat" },
  { day: "Sen", date: "Sen, 30 Jun", time: "10:00", place: "Toko Plastik Murah", area: "Kalibata", produk: ["KTA"], hasil: "followup", evi: "kuat" },
  { day: "Sen", date: "Sen, 30 Jun", time: "08:20", place: "Kios Buah Segar", area: "Kalibata", produk: ["Tabungan"], hasil: "followup", evi: "lemah" },
];
const DAY_ORDER = ["Kam", "Rab", "Sel", "Sen"];
const DAY_FULL = { Kam: "Kamis", Rab: "Rabu", Sel: "Selasa", Sen: "Senin" };

function HistoriScreen() {
  const [period, setPeriod] = useState("today");
  const [followupOnly, setFollowupOnly] = useState(false);
  const [sel, setSel] = useState(null); // kunjungan terpilih untuk detail

  const scoped = useMemo(() => (period === "today" ? VISITS.filter((v) => v.day === "Kam") : VISITS), [period]);
  const stats = useMemo(() => { const c = { tertarik: 0, ajukan: 0, followup: 0, tolak: 0 }; scoped.forEach((v) => c[v.hasil]++); return c; }, [scoped]);
  const areas = useMemo(() => [...new Set(scoped.map((v) => v.area))], [scoped]);
  const followupList = useMemo(() => scoped.filter((v) => v.hasil === "followup"), [scoped]);
  const byDay = useMemo(() => {
    const map = {};
    scoped.forEach((v) => {
      if (!map[v.day]) map[v.day] = { day: v.day, date: v.date, visits: [], counts: { tertarik: 0, ajukan: 0, followup: 0, tolak: 0 }, areas: new Set() };
      map[v.day].visits.push(v); map[v.day].counts[v.hasil]++; map[v.day].areas.add(v.area);
    });
    return DAY_ORDER.filter((d) => map[d]).map((d) => map[d]);
  }, [scoped]);

  if (sel) return <VisitDetailWorker v={sel} onBack={() => setSel(null)} />;

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Header title="Histori saya" sub="Budi S. · Divisi Sales" />

      <div style={{ padding: "12px 20px 4px", flexShrink: 0 }}>
        <div style={{ display: "flex", background: T.lineSoft, borderRadius: 12, padding: 3 }}>
          {[["today", "Hari ini"], ["week", "Minggu ini"]].map(([id, label]) => {
            const on = period === id;
            return (
              <button key={id} onClick={() => setPeriod(id)}
                style={{ flex: 1, border: "none", background: on ? "#fff" : "transparent", color: on ? T.ink : T.inkSoft, fontWeight: on ? 700 : 500, fontSize: 13.5, fontFamily: font.display, padding: "8px 0", borderRadius: 10, cursor: "pointer", boxShadow: on ? "0 1px 3px rgba(20,24,30,0.10)" : "none", transition: "all .12s" }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 24px" }}>
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 18, padding: "18px 18px 16px", background: "linear-gradient(180deg,#FCFCFD 0%,#fff 100%)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 44, lineHeight: 0.95, color: T.ink, letterSpacing: -1.5 }}>{scoped.length}</div>
            <div style={{ paddingBottom: 5 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>kunjungan</div>
              <div style={{ fontSize: 12, color: T.inkFaint }}>{period === "today" ? "hari ini" : "minggu ini"}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {ORDER.map((k) => {
              const c = tone(HASIL_META[k].tone);
              return (
                <div key={k} style={{ background: c.bg, borderRadius: 11, padding: "9px 4px", textAlign: "center" }}>
                  <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 19, color: c.fg }}>{stats[k]}</div>
                  <div style={{ fontSize: 10.5, color: c.fg, fontWeight: 600, marginTop: 1 }}>{HASIL_META[k].label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "flex-start" }}>
            <InfoDot />
            <div style={{ fontSize: 11, color: T.claim, lineHeight: 1.4 }}>
              Angka <b>Ajukan</b> = yang kamu laporkan diajukan. Status disetujui/tidaknya keputusan bank — tidak dihitung di sini.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <RowHead icon={<PinMini />} title="Daerah disisir" right={`${areas.length} area`} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
            {areas.map((a) => (
              <span key={a} style={{ fontSize: 12.5, color: T.verify, background: T.verifySoft, border: `1px solid ${T.verify}22`, padding: "6px 11px", borderRadius: 20, fontWeight: 600 }}>{a}</span>
            ))}
          </div>
        </div>

        <button onClick={() => setFollowupOnly((v) => !v)}
          style={{ width: "100%", marginTop: 18, border: `1.5px solid ${followupOnly ? T.accent : T.line}`, background: followupOnly ? T.accentSoft : "#fff", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer", fontFamily: font.body, textAlign: "left" }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: followupOnly ? T.accent : T.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <BackIcon color={followupOnly ? "#fff" : T.accent} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: followupOnly ? T.accent : T.ink }}>Perlu follow-up</div>
            <div style={{ fontSize: 11.5, color: followupOnly ? T.accent : T.inkFaint, marginTop: 1 }}>
              {followupList.length} kunjungan {period === "today" ? "hari ini" : "minggu ini"} · ketuk untuk {followupOnly ? "tutup" : "lihat"}
            </div>
          </div>
          <Chevron open={followupOnly} />
        </button>

        <div style={{ marginTop: 18 }}>
          {followupOnly ? (
            <>
              <SectionTitle text="Daftar follow-up" />
              {followupList.map((v, i) => <VisitRow key={i} v={v} showDay={period === "week"} onTap={() => setSel(v)} />)}
            </>
          ) : period === "today" ? (
            <>
              <SectionTitle text="Kunjungan hari ini" />
              {scoped.map((v, i) => <VisitRow key={i} v={v} onTap={() => setSel(v)} />)}
            </>
          ) : (
            <>
              <SectionTitle text="Per hari" />
              {byDay.map((d) => <DayRow key={d.day} d={d} />)}
            </>
          )}
        </div>

        <div style={{ fontSize: 11, color: T.inkFaint, textAlign: "center", marginTop: 18, lineHeight: 1.5, padding: "0 10px" }}>
          Catatan terkunci sejak dibuat. Hasil tercatat sebagai laporan kamu — konfirmasi status akun tetap di pihak bank.
        </div>
      </div>
    </div>
  );
}

/* ================= LAYAR: TUGAS (Task List) ================= */
/* Task di-assign SM (web) → muncul di sini. Assign ke tim = N instance
   per-orang; tiap instance punya checklist & bukti sendiri.
   Reuse: lifecycle assignment (diterima → dikerjakan → selesai) pola Fate.
   Graft: eksekusi = gerbang capture + checklist FOTO WAJIB (UR client). */
const TUGAS = [
  { id: "t1", title: "Promosi KTA — Ruko Blok M", lokasi: "Ruko Blok M Square", area: "Kebayoran Baru", prospek: null, produk: "KTA / Pinjaman", tanggal: "Hari ini", jam: "10:00–12:00", instruksi: "Nyisir pemilik ruko; tawarkan KTA, jelaskan bunga, plafon, dan syarat pengajuan.", phase: "assigned" },
  { id: "t2", title: "Kunjungan Nasabah Prioritas", lokasi: "Perumahan Bintaro Sektor 7", area: "Bintaro", prospek: "Pak Hartono", produk: "KPR", tanggal: "Hari ini", jam: "13:00–15:00", instruksi: "Follow-up nasabah existing untuk produk KPR; bawa simulasi cicilan.", phase: "diterima" },
  { id: "t3", title: "Promosi Tabungan — Pasar Mayestik", lokasi: "Pasar Mayestik", area: "Kebayoran Baru", prospek: null, produk: "Tabungan", tanggal: "Kemarin", jam: "09:00–11:00", instruksi: "Ajak pedagang pasar buka rekening tabungan.", phase: "selesai", doneAt: "Kemarin 10:40" },
];
/* checklist aksi STANDAR untuk semua tugas (dikonfigurasi sekali, bukan per-task) */
const AKSI_CHECKLIST = ["Jelaskan produk ke prospek", "Berikan brosur", "Catat keluhan / masukan", "Foto bukti pertemuan"];
const TASK_PHASE = {
  assigned: { label: "Belum diterima", tone: "accent" },
  diterima: { label: "Siap dikerjakan", tone: "warn" },
  selesai: { label: "Selesai", tone: "verify" },
};

function TugasScreen() {
  const [tugas, setTugas] = useState(TUGAS);
  const [selId, setSelId] = useState(null);
  const sel = selId ? tugas.find((t) => t.id === selId) : null;
  const ack = (id) => setTugas((ts) => ts.map((t) => (t.id === id ? { ...t, phase: "diterima" } : t)));
  const complete = (id, at) => setTugas((ts) => ts.map((t) => (t.id === id ? { ...t, phase: "selesai", doneAt: at } : t)));

  if (sel) return <TaskDetail task={sel} onBack={() => setSelId(null)} onAck={() => ack(sel.id)} onComplete={(at) => complete(sel.id, at)} />;

  const aktif = tugas.filter((t) => t.phase !== "selesai");
  const selesai = tugas.filter((t) => t.phase === "selesai");
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Header title="Tugas saya" sub="Budi S. · Divisi Sales" />
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px" }}>
        {aktif.length > 0 && (
          <>
            <SectionTitle text="Perlu dikerjakan" />
            {aktif.map((t) => <TaskCard key={t.id} t={t} onTap={() => setSelId(t.id)} />)}
          </>
        )}
        {selesai.length > 0 && (
          <div style={{ marginTop: aktif.length ? 18 : 0 }}>
            <SectionTitle text="Selesai" />
            {selesai.map((t) => <TaskCard key={t.id} t={t} onTap={() => setSelId(t.id)} />)}
          </div>
        )}
        <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 16, lineHeight: 1.5, textAlign: "center" }}>
          Tugas ditetapkan oleh manajer. Kerjakan di lokasi — tiap langkah wajib foto langsung.
        </div>
      </div>
    </div>
  );
}

function TaskCard({ t, onTap }) {
  const ph = TASK_PHASE[t.phase];
  const c = tone(ph.tone);
  return (
    <button onClick={onTap}
      style={{ width: "100%", border: `1px solid ${t.phase === "assigned" ? T.accent + "44" : T.line}`, background: "#fff", borderRadius: 15, padding: "13px 14px", marginBottom: 10, cursor: "pointer", fontFamily: font.body, textAlign: "left", display: "block" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{t.title}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 3 }}>{t.lokasi} · {t.area}</div>
          {t.prospek && <div style={{ fontSize: 12, color: T.accent, fontWeight: 600, marginTop: 3 }}>Ketemu: {t.prospek}</div>}
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: c.fg, background: c.bg, padding: "3px 9px", borderRadius: 12, flexShrink: 0 }}>{ph.label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: T.accent, background: T.accentSoft, padding: "3px 9px", borderRadius: 12 }}>{t.produk}</span>
        <span style={{ fontSize: 11.5, color: T.inkSoft, flex: 1, textAlign: "right" }}>{t.tanggal} · {t.jam}</span>
      </div>
    </button>
  );
}

function TaskDetail({ task, onBack, onAck, onComplete }) {
  const [started, setStarted] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [checks, setChecks] = useState({}); // idx -> {done, na}
  const isDone = task.phase === "selesai";

  const itemState = (i) => checks[i] || { done: false, na: false };
  const shootItem = (i) => setChecks((c) => ({ ...c, [i]: { done: true, na: false } }));
  const naItem = (i) => setChecks((c) => { const cur = c[i] || { done: false, na: false }; return { ...c, [i]: { done: false, na: !cur.na } }; });
  const handled = AKSI_CHECKLIST.filter((_, i) => { const s = itemState(i); return s.done || s.na; }).length;
  const allHandled = handled === AKSI_CHECKLIST.length;

  const shutter = () => { setCapturing(false); setStarted(true); };

  const c = tone(TASK_PHASE[task.phase].tone);
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: "none", background: T.lineSoft, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><ArrowLeft2 /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15.5, color: T.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>{task.tanggal} · {task.jam}</div>
        </div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: c.fg, background: c.bg, padding: "3px 9px", borderRadius: 12, flexShrink: 0 }}>{TASK_PHASE[task.phase].label}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 20px" }}>
        {/* info tugas */}
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
          <RowKV k="Lokasi" v={task.lokasi} />
          <RowKV k="Area" v={task.area} />
          {task.prospek && <RowKV k="Ketemu" v={task.prospek} />}
          <RowKV k="Produk fokus" v={task.produk} />
        </div>
        <div style={{ marginTop: 10, background: T.accentSoft, borderRadius: 12, padding: "11px 13px", display: "flex", gap: 8 }}>
          <InfoDot color={T.accent} />
          <div style={{ fontSize: 12, color: T.accent, lineHeight: 1.45 }}>{task.instruksi}</div>
        </div>

        {isDone ? (
          <div style={{ marginTop: 18, border: `1px solid ${T.verify}33`, background: T.verifySoft, borderRadius: 14, padding: "16px 15px", display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 17, background: T.verify, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckIcon color="#fff" /></div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Tugas selesai</div>
              <div style={{ fontSize: 12, color: T.verify, marginTop: 1 }}>{task.doneAt} · checklist & bukti terkunci</div>
            </div>
          </div>
        ) : task.phase === "assigned" ? (
          <div style={{ marginTop: 18 }}>
            <button onClick={onAck}
              style={{ width: "100%", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, fontFamily: font.display, color: "#fff", background: T.ink, cursor: "pointer" }}>
              Terima tugas
            </button>
            <div style={{ fontSize: 11, color: T.inkFaint, textAlign: "center", marginTop: 8 }}>Konfirmasi kamu akan mengerjakan tugas ini.</div>
          </div>
        ) : !started ? (
          capturing ? (
            <div style={{ marginTop: 16, borderRadius: 16, overflow: "hidden", background: "#1B1E24" }}>
              <div style={{ position: "relative", height: 180, background: "linear-gradient(160deg,#2A2E36 0%,#1B1E24 100%)" }}>
                <div style={{ position: "absolute", inset: 14, border: "2px solid #ffffff33", borderRadius: 10 }} />
                <div style={{ position: "absolute", top: 12, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 11.5, fontWeight: 600, opacity: 0.9 }}>Arahkan ke lokasi tugas</div>
                <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 10.5, opacity: 0.8 }}>{task.area} · GPS ±8 m</div>
              </div>
              <div style={{ padding: "12px 0 8px", display: "flex", justifyContent: "center", background: "#15171C" }}>
                <button onClick={shutter} aria-label="foto" style={{ width: 56, height: 56, borderRadius: 28, background: "#fff", border: "4px solid #4A4F57", cursor: "pointer" }} />
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: "#C6CAD1", padding: "0 12px 12px", background: "#15171C" }}>Kamera langsung — bukan dari galeri.</div>
            </div>
          ) : (
            <div style={{ marginTop: 18 }}>
              <button onClick={() => setCapturing(true)}
                style={{ width: "100%", border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, fontFamily: font.display, color: "#fff", background: T.verify, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <CamTinyWhite /> Mulai di lokasi
              </button>
              <div style={{ fontSize: 11, color: T.inkFaint, textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>GPS & foto tiba dikunci saat mulai. Checklist kebuka setelahnya.</div>
            </div>
          )
        ) : (
          <>
            {/* strip mulai */}
            <div style={{ marginTop: 16, background: T.verifySoft, border: `1px solid ${T.verify}22`, borderRadius: 12, padding: "10px 13px", display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: T.verify, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckIcon color="#fff" /></div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: T.verify }}>Tiba di lokasi · GPS + foto terkunci</div>
            </div>

            {/* checklist foto wajib */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "18px 0 8px" }}>
              <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, color: T.ink }}>Checklist tugas</span>
              <span style={{ fontSize: 11.5, color: T.inkFaint }}>{handled}/{AKSI_CHECKLIST.length} · foto wajib</span>
            </div>
            {AKSI_CHECKLIST.map((label, i) => {
              const s = itemState(i);
              return <TaskCheckItem key={i} label={label} done={s.done} na={s.na} onShoot={() => shootItem(i)} onNA={() => naItem(i)} />;
            })}

            <button onClick={() => onComplete("Baru saja")} disabled={!allHandled}
              style={{ width: "100%", marginTop: 16, border: "none", borderRadius: 14, padding: "14px 0", fontSize: 15, fontWeight: 700, fontFamily: font.display, color: "#fff", background: allHandled ? T.verify : "#C6CAD1", cursor: allHandled ? "pointer" : "not-allowed" }}>
              Selesaikan tugas
            </button>
            <div style={{ fontSize: 11, color: T.inkFaint, textAlign: "center", marginTop: 8 }}>Foto & centang terkunci sejak diambil.</div>
          </>
        )}
      </div>
    </div>
  );
}

function TaskCheckItem({ label, done, na, onShoot, onNA }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", border: `1px solid ${done ? T.verify + "44" : T.line}`, background: done ? T.verifySoft : "#fff", borderRadius: 12, marginBottom: 8 }}>
      {/* thumbnail / status */}
      <div style={{ width: 40, height: 40, borderRadius: 9, flexShrink: 0, position: "relative", overflow: "hidden", background: done ? "linear-gradient(135deg,#C7D8CF,#8FB3A3)" : na ? T.lineSoft : "#F1F3F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {done ? (
          <div style={{ position: "absolute", top: 3, right: 3, width: 15, height: 15, borderRadius: 8, background: T.verify, display: "flex", alignItems: "center", justifyContent: "center" }}><CheckIcon color="#fff" /></div>
        ) : na ? (
          <span style={{ width: 12, height: 2, background: T.inkFaint, borderRadius: 2 }} />
        ) : (
          <CamTinyC color={T.inkFaint} />
        )}
      </div>
      <span style={{ flex: 1, fontSize: 13.5, color: na ? T.inkFaint : T.ink, textDecoration: na ? "line-through" : "none" }}>{label}</span>
      {done ? (
        <span style={{ fontSize: 10.5, fontWeight: 700, color: T.verify }}>berfoto</span>
      ) : na ? (
        <button onClick={onNA} style={{ fontSize: 11, fontWeight: 700, color: T.warn, background: T.warnSoft, border: `1.4px solid ${T.warn}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer" }}>N/A</button>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onShoot} style={{ fontSize: 11.5, fontWeight: 700, color: "#fff", background: T.verify, border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}><CamTinyWhiteSm /> Foto</button>
          <button onClick={onNA} style={{ fontSize: 11, fontWeight: 700, color: T.inkFaint, background: "#fff", border: `1.4px solid ${T.line}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer" }}>N/A</button>
        </div>
      )}
    </div>
  );
}
function ArrowLeft2() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function TaskIcon({ color }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="17" rx="2.5" stroke={color} strokeWidth="1.8"/><path d="M9 3.5h6v2.2H9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><path d="M8.5 11l2 2 4-4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.5 16.5h7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></svg>);
}
function CamTinyWhiteSm() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="3" stroke="#fff" strokeWidth="1.9"/><circle cx="12" cy="13.5" r="3" stroke="#fff" strokeWidth="1.9"/></svg>);
}

/* ================= sub-komponen bersama ================= */
function SectionLabel({ n, text, note, first }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: first ? "2px 0 10px" : "22px 0 10px" }}>
      <span style={{ fontFamily: font.display, fontWeight: 800, fontSize: 11, color: T.inkFaint, letterSpacing: 1 }}>{n}</span>
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, color: T.ink, letterSpacing: -0.2 }}>{text}</span>
      {note && <span style={{ fontSize: 11, color: T.inkFaint, marginLeft: "auto" }}>{note}</span>}
    </div>
  );
}
function StatusBtn({ active, onClick, tone: tn, label, sub }) {
  const c = tone(tn);
  return (
    <button onClick={onClick}
      style={{ textAlign: "left", border: `1.5px solid ${active ? c.fg : T.line}`, background: active ? c.bg : "#fff", borderRadius: 14, padding: "11px 13px", cursor: "pointer", fontFamily: font.body, transition: "all .12s" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: active ? c.fg : T.ink }}>{label}</div>
      <div style={{ fontSize: 11, color: active ? c.fg : T.inkFaint, marginTop: 3, opacity: active ? 0.85 : 1 }}>{sub}</div>
    </button>
  );
}
function GateChip({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: `1px solid ${T.verify}22`, borderRadius: 20, padding: "6px 11px" }}>
      {icon}
      <span style={{ fontSize: 11.5, color: T.verify, fontWeight: 600 }}>{text}</span>
    </div>
  );
}
function Field({ value, onChange, placeholder }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${T.line}`, borderRadius: 13, padding: "12px 13px", fontSize: 14, color: T.ink, fontFamily: font.body, outline: "none", background: "#fff" }} />
  );
}
function ChecklistCard({ product, items, ckOf, setCkStatus, toggleCkFoto, refVal, onRef }) {
  const done = items.filter((it) => { const st = ckOf(product, it).status; return st === "ok" || st === "na"; }).length;
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: 13, background: "#fff", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{product}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: done === items.length ? T.verify : T.inkFaint, background: done === items.length ? T.verifySoft : T.lineSoft, padding: "3px 9px", borderRadius: 12 }}>{done}/{items.length} ditangani</div>
      </div>
      {items.map((it) => {
        const st = ckOf(product, it);
        return <ItemRow key={it} label={it} state={st} onOk={() => setCkStatus(product, it, "ok")} onNA={() => setCkStatus(product, it, "na")} onFoto={() => toggleCkFoto(product, it)} />;
      })}
      <input value={refVal} onChange={(e) => onRef(e.target.value)} placeholder="No. referensi aplikasi (opsional)"
        style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${T.line}`, borderRadius: 11, padding: "10px 12px", fontSize: 13, color: T.ink, fontFamily: font.body, outline: "none", background: "#FBFBFC", marginTop: 6 }} />
    </div>
  );
}
function ItemRow({ label, state, onOk, onNA, onFoto }) {
  const ok = state.status === "ok", na = state.status === "na";
  const boxBg = ok ? T.verify : na ? T.lineSoft : "#fff";
  const boxBorder = ok ? T.verify : T.line;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.lineSoft}` }}>
      <button onClick={onOk} aria-label="tandai"
        style={{ width: 24, height: 24, borderRadius: 7, border: `1.6px solid ${boxBorder}`, background: boxBg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}>
        {ok && <CheckIcon color="#fff" />}
        {na && <span style={{ width: 10, height: 2, background: T.inkFaint, borderRadius: 2 }} />}
      </button>
      <span style={{ flex: 1, fontSize: 13.5, color: na ? T.inkFaint : T.ink, textDecoration: na ? "line-through" : "none" }}>{label}</span>
      {/* foto opsional */}
      <button onClick={onFoto} aria-label="foto"
        style={{ width: 30, height: 30, borderRadius: 8, border: `1.4px solid ${state.foto ? T.verify : T.line}`, background: state.foto ? T.verifySoft : "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, padding: 0 }}>
        <CamTinyC color={state.foto ? T.verify : T.inkFaint} />
      </button>
      {/* N/A */}
      <button onClick={onNA}
        style={{ fontSize: 11, fontWeight: 700, color: na ? T.warn : T.inkFaint, background: na ? T.warnSoft : "#fff", border: `1.4px solid ${na ? T.warn : T.line}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", flexShrink: 0 }}>
        N/A
      </button>
    </div>
  );
}
function CamTinyC({ color }) {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="3" stroke={color} strokeWidth="1.7"/><circle cx="12" cy="13.5" r="3" stroke={color} strokeWidth="1.7"/><path d="M8.5 7l1.2-2h4.6l1.2 2" stroke={color} strokeWidth="1.7" strokeLinejoin="round"/></svg>);
}
function PhotoTile({ filled, onTap, label, sub, compact }) {
  return (
    <button onClick={onTap}
      style={{ width: "100%", border: `1.5px ${filled ? "solid" : "dashed"} ${filled ? T.verify : T.line}`, background: filled ? T.verifySoft : "#FBFBFC", borderRadius: 13, padding: compact ? "11px 13px" : "13px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: font.body, textAlign: "left" }}>
      <div style={{ width: compact ? 34 : 40, height: compact ? 34 : 40, borderRadius: 10, background: filled ? T.verify : T.lineSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {filled ? <CheckIcon color="#fff" /> : <CamIcon />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: filled ? T.verify : T.ink }}>{filled ? "Foto tersimpan" : label}</div>
        <div style={{ fontSize: 11.5, color: filled ? T.verify : T.inkFaint, marginTop: 1 }}>{filled ? "Ketuk untuk ganti" : sub}</div>
      </div>
    </button>
  );
}
function SentScreen({ delivery, tempat, bertemu, alasan, produk, hasil, onNext }) {
  const h = HASIL_META[hasil];
  const c = h ? tone(h.tone) : tone("accent");
  return (
    <div style={{ padding: "36px 24px 28px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ width: 68, height: 68, borderRadius: 34, background: T.verifySoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: T.verify, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckIcon color="#fff" big />
          </div>
        </div>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 20, color: T.ink, letterSpacing: -0.4 }}>Kunjungan tersimpan</div>
        <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 5, display: "flex", alignItems: "center", gap: 7 }}>
          <WaTicks two={delivery === "server"} />
          {delivery === "server" ? "Terkirim ke pusat" : "Tersimpan di perangkat"}
        </div>
      </div>
      <div style={{ marginTop: 26, border: `1px solid ${T.line}`, borderRadius: 16, overflow: "hidden" }}>
        <RowKV k="Lokasi" v="Pasar Minggu, Jaksel" badge="terkunci" />
        <RowKV k="Tempat" v={tempat || "—"} />
        {bertemu ? (
          <>
            <RowKV k="Produk" v={produk.length ? produk.join(", ") : "—"} />
            <div style={{ padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: T.inkSoft }}>Hasil</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.fg, background: c.bg, padding: "4px 11px", borderRadius: 20 }}>{h ? h.label : "—"} · dilaporkan</span>
            </div>
          </>
        ) : (
          <div style={{ padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12.5, color: T.inkSoft }}>Status</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.warn, background: T.warnSoft, padding: "4px 11px", borderRadius: 20 }}>Tidak bertemu · {alasan}</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: T.inkFaint, textAlign: "center", marginTop: 14, lineHeight: 1.5, padding: "0 8px" }}>
        {bertemu
          ? "Catatan terkunci sejak dibuat. Hasil tercatat sebagai laporan sales — status akun keputusan bank."
          : "Bukti kamu datang ke lokasi tetap terkunci, walau tidak ada interaksi."}
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={onNext}
        style={{ width: "100%", border: "none", background: T.ink, borderRadius: 15, padding: "15px 0", fontSize: 14.5, fontWeight: 700, fontFamily: font.display, color: "#fff", cursor: "pointer", marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <PlayIcon /> Kunjungan berikutnya
      </button>
    </div>
  );
}
function RowKV({ k, v, badge }) {
  return (
    <div style={{ padding: "13px 15px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 12.5, color: T.inkSoft, flexShrink: 0 }}>{k}</span>
      <span style={{ fontSize: 13, color: T.ink, fontWeight: 600, textAlign: "right", display: "flex", alignItems: "center", gap: 7 }}>
        {v}
        {badge && <span style={{ fontSize: 10, color: T.verify, background: T.verifySoft, padding: "2px 7px", borderRadius: 12, fontWeight: 700 }}>{badge}</span>}
      </span>
    </div>
  );
}
function VisitRow({ v, showDay, onTap }) {
  const meta = HASIL_META[v.hasil];
  const c = tone(meta.tone);
  return (
    <button onClick={onTap} disabled={!onTap}
      style={{ width: "100%", display: "flex", gap: 12, padding: "12px 0", background: "transparent", border: "none", borderBottom: `1px solid ${T.lineSoft}`, cursor: onTap ? "pointer" : "default", fontFamily: font.body, textAlign: "left", alignItems: "center" }}>
      <div style={{ width: 46, flexShrink: 0, textAlign: "right" }}>
        {showDay && <div style={{ fontSize: 10.5, color: T.inkFaint, fontWeight: 600 }}>{v.day}</div>}
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
      {onTap && <ChevRight />}
    </button>
  );
}
function DayRow({ d }) {
  const total = d.visits.length;
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, padding: "13px 15px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: T.ink }}>{DAY_FULL[d.day]}</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>{d.date} · {[...d.areas].join(", ")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 22, color: T.ink, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 10.5, color: T.inkFaint }}>kunjungan</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 11, height: 6, borderRadius: 4, overflow: "hidden" }}>
        {ORDER.map((k) => { const n = d.counts[k]; if (!n) return null; const c = tone(HASIL_META[k].tone); return <div key={k} style={{ flex: n, background: c.fg, opacity: 0.85 }} />; })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 9, flexWrap: "wrap" }}>
        {ORDER.map((k) => d.counts[k] ? (
          <span key={k} style={{ fontSize: 11.5, color: T.inkSoft, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 7, background: tone(HASIL_META[k].tone).fg }} />
            {HASIL_META[k].label} {d.counts[k]}
          </span>
        ) : null)}
      </div>
    </div>
  );
}
function SectionTitle({ text }) {
  return <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13.5, color: T.ink, marginBottom: 4, letterSpacing: -0.2 }}>{text}</div>;
}
function RowHead({ icon, title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon}
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13.5, color: T.ink }}>{title}</span>
      {right && <span style={{ marginLeft: "auto", fontSize: 11.5, color: T.inkFaint }}>{right}</span>}
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
function ChevRight() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" stroke={T.inkFaint} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}

const KET_SAMPLE = {
  tertarik: "Pemilik minat, minta waktu pikir-pikir dulu.",
  ajukan: "Form aplikasi diisi, dokumen dilampirkan.",
  followup: "Minta dihubungi lagi, pemilik sedang sibuk.",
  tolak: "Pemilik sudah pakai bank lain, belum berminat.",
};

function VisitDetailWorker({ v, onBack }) {
  const meta = HASIL_META[v.hasil];
  const c = tone(meta.tone);
  const kuat = v.evi === "kuat";
  const ket = KET_SAMPLE[v.hasil];
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${T.lineSoft}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ border: "none", background: T.lineSoft, borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <ArrowLeft />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: T.ink }}>Detail kunjungan</div>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 1 }}>{v.date} · {v.time}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px" }}>
        {/* bukti: foto tiba + GPS + waktu, terkunci bersama */}
        <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${T.line}` }}>
          <div style={{ height: 150, background: "linear-gradient(135deg,#C7D8CF,#8FB3A3)", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <svg width="100%" height="70" viewBox="0 0 390 70" preserveAspectRatio="none" fill="none" style={{ display: "block" }}><path d="M0 70L90 34l50 18 70 -30 80 26 100 -20V70z" fill="#6E9384"/></svg>
            <div style={{ position: "absolute", top: 10, left: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", borderRadius: 20, padding: "4px 10px" }}>
              <span style={{ width: 6, height: 6, borderRadius: 6, background: "#fff" }} />
              <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 600 }}>Foto tiba</span>
            </div>
            <div style={{ position: "absolute", top: 10, right: 12, fontSize: 10.5, color: "#fff", background: kuat ? T.verify : T.warn, borderRadius: 20, padding: "4px 10px", fontWeight: 700 }}>{kuat ? "KUAT" : "GPS lemah"}</div>
          </div>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <PinMini />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: T.ink }}>{v.area}</div>
              <div style={{ fontSize: 11.5, color: kuat ? T.verify : T.warn, marginTop: 1, fontWeight: 500 }}>
                {kuat ? "GPS terkunci · akurasi ±8 m" : "GPS terkunci · akurasi rendah ±140 m"} · {v.time}
              </div>
            </div>
          </div>
        </div>
        {!kuat && (
          <div style={{ fontSize: 11, color: T.warn, marginTop: 8, lineHeight: 1.45, display: "flex", gap: 6 }}>
            <InfoDot color={T.warn} />
            <span>Foto tiba tetap tersimpan, tapi lokasi kurang presisi (sinyal lemah saat jepret). Ditandai apa adanya.</span>
          </div>
        )}

        {/* tempat & prospek */}
        <SectionLabel n="1" text="Tempat & prospek" />
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
          <RowKV k="Tempat" v={v.place} />
          <RowKV k="Area" v={v.area} />
          <div style={{ padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12.5, color: T.inkSoft }}>Kontak</span>
            <span style={{ fontSize: 13, color: T.inkFaint, fontWeight: 600 }}>—</span>
          </div>
        </div>

        {/* hasil */}
        <SectionLabel n="2" text="Produk & hasil" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {v.produk.map((p) => (
            <span key={p} style={{ fontSize: 12.5, color: T.accent, background: T.accentSoft, border: `1px solid ${T.accent}22`, padding: "6px 11px", borderRadius: 20, fontWeight: 600 }}>{p}</span>
          ))}
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${T.line}`, borderRadius: 14, padding: "12px 14px" }}>
          <span style={{ fontSize: 12.5, color: T.inkSoft }}>Hasil</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.fg, background: c.bg, padding: "4px 11px", borderRadius: 20 }}>{meta.label} · dilaporkan</span>
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 10, background: T.claimSoft, borderRadius: 11, padding: "9px 11px" }}>
          <InfoDot />
          <div style={{ fontSize: 11.5, color: T.claim, lineHeight: 1.4 }}>
            Hasil ini kamu yang laporkan. Status akun (disetujui/tidak) keputusan bank — tidak dicatat di sini.
          </div>
        </div>

        {/* keterangan */}
        <SectionLabel n="3" text="Keterangan" />
        <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, background: "#FBFBFC", border: `1px solid ${T.line}`, borderRadius: 14, padding: "12px 14px" }}>{ket}</div>

        {/* status kirim */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: T.inkSoft, fontSize: 12.5 }}>
          <WaTicks two={true} /> Terkirim ke pusat
        </div>

        {/* terkunci */}
        <div style={{ marginTop: 16, background: T.lineSoft, borderRadius: 12, padding: "11px 13px", display: "flex", gap: 8 }}>
          <LockIcon />
          <div style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.45 }}>
            Catatan terkunci sejak dibuat, <b>tidak bisa diubah</b>. Kalau ada yang keliru, minta koreksi ke supervisor — perubahannya berjejak.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ikon ================= */
function PinIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" stroke={T.verify} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.5" fill={T.verify}/></svg>);
}
function ArrowLeft() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function LockIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><rect x="5" y="11" width="14" height="9" rx="2" stroke={T.inkSoft} strokeWidth="1.8"/><path d="M8 11V8a4 4 0 018 0v3" stroke={T.inkSoft} strokeWidth="1.8" strokeLinecap="round"/></svg>);
}
function PinMini() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" stroke={T.verify} strokeWidth="1.9" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.4" fill={T.verify}/></svg>);
}
function PinTiny() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" stroke={T.verify} strokeWidth="2" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.4" fill={T.verify}/></svg>);
}
function CamIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="3" stroke={T.inkFaint} strokeWidth="1.7"/><circle cx="12" cy="13.5" r="3.2" stroke={T.inkFaint} strokeWidth="1.7"/><path d="M8.5 7l1.2-2h4.6l1.2 2" stroke={T.inkFaint} strokeWidth="1.7" strokeLinejoin="round"/></svg>);
}
function CamTiny() {
  return (<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="3" stroke={T.verify} strokeWidth="1.9"/><circle cx="12" cy="13.5" r="3" stroke={T.verify} strokeWidth="1.9"/></svg>);
}
function CamTinyWhite() {
  return (<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="3" stroke="#fff" strokeWidth="1.9"/><circle cx="12" cy="13.5" r="3.2" stroke="#fff" strokeWidth="1.9"/><path d="M8.5 7l1.2-2h4.6l1.2 2" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round"/></svg>);
}
function PinTinyWhite() {
  return (<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.4" fill="#fff"/></svg>);
}
function CheckIcon({ color = "#fff", big }) {
  const s = big ? 24 : 18;
  return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function InfoDot({ color }) {
  const c = color || T.claim;
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/><path d="M12 11v5" stroke={c} strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="7.6" r="1.1" fill={c}/></svg>);
}
function Spinner({ color = "#fff" }) {
  return (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.7s linear infinite" }}><circle cx="12" cy="12" r="9" stroke={`${color}44`} strokeWidth="2.6"/><path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="2.6" strokeLinecap="round"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>);
}
function WaTicks({ two }) {
  return (<svg width="18" height="14" viewBox="0 0 22 14" fill="none"><path d="M1 7.5l3 3L11 3" stroke={two ? T.accent : T.inkFaint} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>{two && <path d="M8 7.5l3 3L18 3" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>}</svg>);
}
function BackIcon({ color }) {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5L4 10l5 5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 10h10a6 6 0 016 6v2" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function Chevron({ open }) {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }}><path d="M7 10l5 5 5-5" stroke={T.inkFaint} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function RouteIcon({ color }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="6" r="2.4" stroke={color} strokeWidth="1.8"/><circle cx="18" cy="18" r="2.4" stroke={color} strokeWidth="1.8"/><path d="M8.4 6H14a3 3 0 013 3v0a3 3 0 01-3 3h-4a3 3 0 00-3 3v0a3 3 0 003 3h1.6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></svg>);
}
function HistoryIcon({ color }) {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 108-8 8 8 0 00-6.5 3.3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><path d="M4 4v3.5H7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8v4l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
}
function PlayIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 5l12 7-12 7V5z" fill="#fff"/></svg>);
}
