import React, { useState, useMemo } from "react";

// ====== LAYAR: ONBOARDING OUTSOURCING (AUTSORZ) ======
// ---------------------------------------------------------------------------
// Tenant Provisioning Flow — vertikal OUTSOURCING (security/cleaning/technician).
// Saudara dari ConsteonApp (returnable). Shell di-share; badan step nge-fork.
//
// Mengikuti Tenant_Provisioning_Doctrine.md (ditransplant):
//   §1  Provisioning = capability bounded (wizard menepi setelah selesai)
//   §2  Tiga topi owner (setup · observer · resolusi)
//   §4  Resolusi = authority, default Owner → DI SINI = SUPERVISOR (orkestrator §13/§22 spec AUTSORZ)
//   §10 Gerbang kelengkapan
//   §11 Identitas: HP kunci unik + OAuth (Google/Apple); invite→claim; ID Card ber-QR
//
// FORK skeleton (dikunci di diskusi):
//   0. Vendor (self-register)         ← Daftar
//   1. Klien & Site                   ← tiap site bawa shift + KUOTA per shift (= genesis-analog §24)
//   2. Worker                         ← pilih divisi: security / cleaning / technician
//   3. Supervisor                     ← resolusi-analog; default Owner, delegable
//   4. Aktifkan                       ← gerbang
//
// Beda dari returnable yang sengaja:
//   - Klien & Site = pohon (multi-klien, multi-site/klien) — bukan armada+customer terpisah.
//   - Divisi BUKAN semua-wajib (vendor security-only cukup punya worker security).
//   - Kuota per shift = baseline rekonsiliasi lawan kursi-terisi-scan (§24 anomali dua arah).
// Data dummy = mockup, bukan klaim final.
// ---------------------------------------------------------------------------

// ----- Design tokens (identik ConsteonApp — "berasa satu produk") -----------
const C = {
  brand: "#1D9E75",
  brandDk: "#178A66",
  brandBg: "#E8F6F0",
  ink: "#16201C",
  sub: "#5E6B65",
  faint: "#97A19B",
  line: "#E5EAE7",
  surface: "#FFFFFF",
  bg: "#F4F7F5",
  amber: "#EF9F27",
  amberBg: "#FDF4E4",
  amberInk: "#8A5A12",
  blue: "#2563EB",
  slate: "#1E293B",
  slateBg: "#EEF1F4",
  danger: "#C2410C",
  ok: "#1D9E75",
  okBg: "#E8F6F0",
};
const F = {
  display: "'DM Sans', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// Divisi worker (set tetap — analog roles[] returnable, tapi single-select per worker)
const DIVISI = [
  { v: "security", t: "Security", icon: "🛡️", d: "Patroli, jaga titik, lapor incident", tone: C.slate, toneBg: C.slateBg },
  { v: "cleaning", t: "Cleaning", icon: "🧹", d: "Checklist area, scan QR ruangan", tone: C.brandDk, toneBg: C.brandBg },
  { v: "technician", t: "Technician", icon: "🔧", d: "Inspeksi & servis aset", tone: C.amberInk, toneBg: C.amberBg },
];
const divisiOf = (v) => DIVISI.find((d) => d.v === v);

const STEPS = ["Vendor", "Klien & Site", "Worker", "Supervisor", "Aktifkan"];

// ----- Small primitives (dipinjam identik) ---------------------------------
function Field({ label, value, onChange, placeholder, hint, mono, type = "text" }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", fontFamily: mono ? F.mono : F.body, fontSize: 15, color: C.ink, padding: "13px 14px", border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface, outline: "none" }}
      />
      {hint && <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.faint, marginTop: 5 }}>{hint}</div>}
    </label>
  );
}

function Stepper({ value, onChange, min = 0 }) {
  const btn = { width: 44, height: 44, borderRadius: 11, border: `1px solid ${C.line}`, background: C.surface, fontFamily: F.display, fontSize: 20, fontWeight: 600, color: C.ink, cursor: "pointer", lineHeight: 1 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button style={btn} onClick={() => onChange(Math.max(min, value - 1))}>–</button>
      <div style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 600, color: C.ink, minWidth: 30, textAlign: "center" }}>{value}</div>
      <button style={btn} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

function Sheet({ title, children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(16,20,18,0.42)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 40 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, background: C.surface, borderRadius: "20px 20px 0 0", padding: "10px 18px 20px", maxHeight: "88%", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: C.line, margin: "4px auto 14px" }} />
        {title && <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: C.ink, marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

function Primary({ children, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{ width: "100%", height: 54, borderRadius: 14, border: "none", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#fff", background: disabled ? "#BFC9C4" : C.brand, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

function DashAdd({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", marginTop: 12, padding: "13px", borderRadius: 14, border: `1.5px dashed ${C.line}`, background: "transparent", fontFamily: F.display, fontSize: 14, fontWeight: 600, color: C.sub, cursor: "pointer" }}>
      {children}
    </button>
  );
}

function FauxQR({ seed = "x", size = 104 }) {
  const n = 21;
  const cell = size / n;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = (h * 16777619) >>> 0; }
  const rnd = (i) => { let x = (h ^ (i * 2654435761)) >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1000) / 1000; };
  const rects = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inFinder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    if (inFinder) continue;
    if (rnd(y * n + x) > 0.52) rects.push(<rect key={x + "-" + y} x={x * cell} y={y * cell} width={cell} height={cell} fill={C.ink} />);
  }
  const Finder = ({ fx, fy }) => (
    <g>
      <rect x={fx} y={fy} width={cell * 7} height={cell * 7} fill={C.ink} />
      <rect x={fx + cell} y={fy + cell} width={cell * 5} height={cell * 5} fill="#fff" />
      <rect x={fx + cell * 2} y={fy + cell * 2} width={cell * 3} height={cell * 3} fill={C.ink} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} style={{ borderRadius: 8, flexShrink: 0 }}>
      <rect width={size} height={size} fill="#fff" />
      {rects}
      <Finder fx={0} fy={0} />
      <Finder fx={(n - 7) * cell} fy={0} />
      <Finder fx={0} fy={(n - 7) * cell} />
    </svg>
  );
}

function IDCard({ name, divisi, phone, vendor, site, active }) {
  const d = divisiOf(divisi);
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${C.line}`, background: C.surface }}>
      <div style={{ background: C.brand, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: F.display, fontWeight: 800, color: "#fff", fontSize: 15, letterSpacing: "-0.01em" }}>{vendor || "Vendor"}</span>
        <span style={{ fontFamily: F.body, fontSize: 10.5, color: "#fff", opacity: 0.9 }}>{site || "—"}</span>
      </div>
      <div style={{ display: "flex", gap: 14, padding: "16px" }}>
        <FauxQR seed={(name || "") + (phone || "")} size={104} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 800, color: C.ink }}>{name}</div>
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.sub, marginTop: 2 }}>{d ? d.icon + " " + d.t : "—"}</div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.faint, marginTop: 6 }}>{phone}</div>
          <span style={{ display: "inline-block", marginTop: 10, fontFamily: F.body, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, color: active ? C.brandDk : C.danger, background: active ? C.okBg : C.amberBg }}>
            {active ? "Aktif" : "Belum aktif"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Apple glyph kecil (dipakai berulang)
const AppleMark = ({ size = 18, fill = "#fff" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill}><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"/></svg>
);

// ===========================================================================
function Main() {
  // --- shell state ---
  const [authed, setAuthed] = useState(false);
  const [authMethod, setAuthMethod] = useState(null); // google | apple
  const [biz, setBiz] = useState(null); // null | returnable | outsourcing

  const [step, setStep] = useState(0);

  // Step 0 — Vendor
  const [tenant, setTenant] = useState({ owner: "", vendor: "", phone: "" });
  const goLive = "Hari ini"; // §5 genesis_epoch — kehadiran mulai dihitung dari sini

  // Step 1 — Klien & Site (pohon)
  const [clients, setClients] = useState([]); // {id,name,sites:[{id,name,shifts:[{name,quota}]}]}
  const [clientSheet, setClientSheet] = useState(false);
  const [clientName, setClientName] = useState("");
  const [siteSheet, setSiteSheet] = useState(null); // clientId yg lagi nambah site
  const [siteDraft, setSiteDraft] = useState(null);

  // Step 2 — Worker
  const [workers, setWorkers] = useState([]); // {id,name,phone,divisi,siteId,status,claimer}
  const [wSheet, setWSheet] = useState(false);
  const [wDraft, setWDraft] = useState({ name: "", phone: "", divisi: "", siteId: "" });
  const [cardIdx, setCardIdx] = useState(null);

  // Step 3 — Supervisor (delegasi opsional)
  const [delegates, setDelegates] = useState([]); // {name, phone}
  const [supSheet, setSupSheet] = useState(false);
  const [supDraft, setSupDraft] = useState({ name: "", phone: "" });

  // ---- derived ----
  const allSites = useMemo(() => clients.flatMap((c) => c.sites.map((s) => ({ ...s, clientName: c.name, clientId: c.id }))), [clients]);
  const siteById = (id) => allSites.find((s) => s.id === id);
  const quotaOf = (site) => (site.shifts || []).reduce((a, b) => a + (b.quota || 0), 0);

  const gate = {
    site: allSites.length >= 1,
    worker: workers.length >= 1,
    supervisor: true, // §4/§10 — default Owner, auto-terpenuhi
  };
  const gateReady = gate.site && gate.worker;

  const canNext = useMemo(() => {
    if (step === 0) return tenant.owner.trim() && tenant.vendor.trim() && tenant.phone.trim();
    if (step === 1) return allSites.length >= 1;
    if (step === 2) return workers.length >= 1;
    if (step === 3) return true; // supervisor auto-covered
    return true;
  }, [step, tenant, allSites, workers]);

  // ---- mutators ----
  function addClient() {
    if (!clientName.trim()) return;
    setClients([...clients, { id: "cl_" + Date.now(), name: clientName.trim(), sites: [] }]);
    setClientName("");
    setClientSheet(false);
  }
  function openSite(clientId) {
    setSiteSheet(clientId);
    setSiteDraft({ name: "", shifts: [{ name: "Pagi", quota: 0 }, { name: "Siang", quota: 0 }, { name: "Malam", quota: 0 }] });
  }
  function addSite() {
    if (!siteDraft || !siteDraft.name.trim()) return;
    setClients(clients.map((c) => c.id === siteSheet ? { ...c, sites: [...c.sites, { id: "st_" + Date.now(), name: siteDraft.name.trim(), shifts: siteDraft.shifts }] } : c));
    setSiteSheet(null);
    setSiteDraft(null);
  }
  function removeSite(clientId, siteId) {
    setClients(clients.map((c) => c.id === clientId ? { ...c, sites: c.sites.filter((s) => s.id !== siteId) } : c));
  }
  function addWorker() {
    if (!wDraft.name.trim() || !wDraft.phone.trim() || !wDraft.divisi || !wDraft.siteId) return;
    setWorkers([...workers, { id: "wk_" + Date.now(), ...wDraft, status: "invited", claimer: null }]);
    setWSheet(false);
  }

  // =========================================================================
  // SHELL 1 — AUTH (OAuth-only; HP kunci unik di depan)
  if (!authed) {
    return (
      <Frame>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 26px" }}>
          <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 800, color: C.ink, letterSpacing: "-0.02em" }}>Consteon</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: C.sub, marginTop: 6, marginBottom: 26, lineHeight: 1.5 }}>
            Satu akun untuk operasi lapanganmu — pilih jenis bisnis setelah masuk.
          </div>

          <Field label="No. HP" value={tenant.phone} onChange={(v) => setTenant({ ...tenant, phone: v.replace(/[^\d+]/g, "") })} placeholder="08xx" type="tel" mono hint="Nomor unik kamu — dipakai untuk identitas & akses staf." />

          <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 10 }}>Lalu masuk dengan</div>

          <button onClick={() => { if (tenant.phone.trim()) { setAuthMethod("apple"); setAuthed(true); } }} disabled={!tenant.phone.trim()} style={{ width: "100%", height: 54, borderRadius: 14, border: "none", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, cursor: tenant.phone.trim() ? "pointer" : "not-allowed", opacity: tenant.phone.trim() ? 1 : 0.4, marginBottom: 11 }}>
            <AppleMark />
            <span style={{ fontFamily: F.display, fontSize: 15.5, fontWeight: 700, color: "#fff" }}>Lanjut dengan Apple</span>
          </button>

          <button onClick={() => { if (tenant.phone.trim()) { setAuthMethod("google"); setTenant((t) => ({ ...t, owner: "Budi Santoso" })); setAuthed(true); } }} disabled={!tenant.phone.trim()} style={{ width: "100%", height: 54, borderRadius: 14, border: `1px solid ${C.line}`, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", gap: 11, cursor: tenant.phone.trim() ? "pointer" : "not-allowed", opacity: tenant.phone.trim() ? 1 : 0.4 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: "#fff", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 14, color: "#4285F4" }}>G</span>
            <span style={{ fontFamily: F.display, fontSize: 15.5, fontWeight: 700, color: C.ink }}>Lanjut dengan Google</span>
          </button>

          <div style={{ fontFamily: F.body, fontSize: 11, color: C.faint, textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
            Dengan lanjut, kamu setuju pada ketentuan layanan.
          </div>
        </div>
      </Frame>
    );
  }

  // =========================================================================
  // SHELL 2 — PILIH BISNIS (product_line picker; seam sekarang nyala)
  if (!biz) {
    const Opt = ({ v, name, tag, tagBg, tagInk, desc, icon }) => (
      <button onClick={() => setBiz(v)} style={{ width: "100%", textAlign: "left", display: "flex", gap: 14, alignItems: "center", padding: "18px 16px", borderRadius: 18, border: `1.5px solid ${C.line}`, background: C.surface, cursor: "pointer", marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, background: tagBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: F.display, fontSize: 16.5, fontWeight: 800, color: C.ink }}>{name}</span>
            <span style={{ fontFamily: F.body, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 5, color: tagInk, background: tagBg }}>{tag}</span>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 12.5, color: C.sub, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <span style={{ color: C.faint, fontSize: 20 }}>›</span>
      </button>
    );
    return (
      <Frame>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 22px" }}>
          <h2 style={{ fontFamily: F.display, fontSize: 23, fontWeight: 800, color: C.ink, margin: "0 0 6px", letterSpacing: "-0.01em" }}>Jenis bisnismu</h2>
          <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.sub, lineHeight: 1.5, margin: "0 0 22px" }}>
            Pilih satu. Ini menentukan apa yang kamu siapkan berikutnya. Bisa ganti nanti lewat akun lain.
          </p>
          <Opt v="returnable" name="Returnable Asset" tag="Consteon" tagBg={C.brandBg} tagInk={C.brandDk} icon="💧" desc="Galon, tabung, aset yang dikirim & ditarik balik — kelola selisih & saldo." />
          <Opt v="outsourcing" name="Outsourcing" tag="AUTSORZ" tagBg={C.slateBg} tagInk={C.slate} icon="🛡️" desc="Security, cleaning, teknisi — kelola kehadiran & bukti kerja lintas site klien." />
          <Opt v="agency" name="Model Agency" tag="Consteon Agency" tagBg="#EFEBFD" tagInk="#6D28D9" icon="📸" desc="Model & talent per project brand — kelola assignment, kehadiran, & dispute overtime." />
        </div>
      </Frame>
    );
  }

  // =========================================================================
  // SHELL 3a — RETURNABLE (stub: alur ini sudah ada di ConsteonApp)
  if (biz === "returnable") {
    return (
      <Frame>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 26px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💧</div>
          <h2 style={{ fontFamily: F.display, fontSize: 21, fontWeight: 800, color: C.ink, margin: "0 0 8px" }}>Alur Returnable</h2>
          <p style={{ fontFamily: F.body, fontSize: 13.5, color: C.sub, lineHeight: 1.55, margin: "0 0 22px" }}>
            Ini masuk ke wizard Consteon yang sudah ada (Depo → Produk → Armada → Pegawai → Customer → Aktifkan).
          </p>
          <button onClick={() => setBiz(null)} style={{ width: "100%", height: 50, borderRadius: 14, border: `1px solid ${C.line}`, background: C.surface, fontFamily: F.display, fontSize: 14.5, fontWeight: 700, color: C.ink, cursor: "pointer" }}>
            ‹ Kembali pilih jenis bisnis
          </button>
        </div>
      </Frame>
    );
  }

  // =========================================================================
  // SHELL 3c — AGENCY WIZARD (Consteon Agency)
  if (biz === "agency") {
    return <AgencyWizard tenant={tenant} authMethod={authMethod} onExit={() => setBiz(null)} />;
  }

  // =========================================================================
  // SHELL 3b — OUTSOURCING WIZARD
  return (
    <Frame>
      {/* Header */}
      <div style={{ background: C.surface, padding: "18px 18px 14px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => (step > 0 ? setStep(step - 1) : setBiz(null))}
              style={{ border: "none", background: "transparent", fontSize: 22, color: C.sub, cursor: "pointer", padding: 0, lineHeight: 1 }}
            >‹</button>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: "-0.01em" }}>{tenant.vendor || "AUTSORZ"}</div>
              <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.faint }}>Penyiapan operasi · {STEPS[step]}</div>
            </div>
          </div>
          <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600, color: C.slate, background: C.slateBg, padding: "4px 9px", borderRadius: 7, letterSpacing: "0.02em" }}>
            OUTSOURCING
          </span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? C.brand : C.line }} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>

        {/* ---------- STEP 0 — VENDOR ---------- */}
        {step === 0 && (
          <div>
            <h2 style={hStyle}>Buat akun vendor</h2>
            <p style={pStyle}>
              Akun ini jadi pemilik vendor — dan otomatis pemegang otoritas <b>supervisor</b> (mengorkestrasi operan, memvalidasi kehadiran, menutup kasus). Bisa diserahkan nanti kalau operasi besar.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: authMethod === "google" ? "#fff" : C.ink, border: authMethod === "google" ? `1px solid ${C.line}` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 13, color: authMethod === "google" ? "#4285F4" : "#fff" }}>
                {authMethod === "google" ? "G" : <AppleMark size={15} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 600, color: C.ink }}>Masuk via {authMethod === "google" ? "Google" : "Apple"}</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.faint }}>{tenant.phone}</div>
              </div>
              <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: C.brandDk, background: C.okBg }}>Terverifikasi</span>
            </div>

            <Field label="Nama kamu (pemilik)" value={tenant.owner} onChange={(v) => setTenant({ ...tenant, owner: v })} placeholder="mis. Budi Santoso" hint={authMethod === "google" ? "Terisi dari Google — boleh diubah." : authMethod === "apple" ? "Apple kadang tidak kasih nama — isi manual." : undefined} />
            <Field label="Nama vendor" value={tenant.vendor} onChange={(v) => setTenant({ ...tenant, vendor: v })} placeholder="mis. PT Jab Security" />

            <div style={{ marginTop: 8, padding: "13px 14px", background: C.brandBg, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.brandDk }}>Mulai operasi (go-live)</div>
                <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub, marginTop: 2 }}>Kehadiran & laporan mulai dihitung dari tanggal ini</div>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: C.brandDk }}>{goLive}</div>
            </div>
          </div>
        )}

        {/* ---------- STEP 1 — KLIEN & SITE ---------- */}
        {step === 1 && (
          <div>
            <h2 style={hStyle}>Tambah klien & site</h2>
            <p style={pStyle}>
              Tiap klien punya satu atau lebih site. Tiap site bawa <b>kuota per shift</b> — patokan kontrak yang nanti dibandingkan dengan kehadiran nyata (scan).
            </p>

            {clients.length === 0 && (
              <div style={emptyBox}>Belum ada klien. Tambah klien dulu, lalu site-site di bawahnya.</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {clients.map((c) => (
                <div key={c.id} style={{ border: `1px solid ${C.line}`, borderRadius: 16, background: C.surface, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", background: C.slateBg }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: C.slate, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 14 }}>{c.name.slice(0, 1).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.display, fontSize: 14.5, fontWeight: 700, color: C.ink }}>{c.name}</div>
                      <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub }}>{c.sites.length} site</div>
                    </div>
                  </div>

                  {c.sites.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px", borderTop: `1px solid ${C.line}` }}>
                      <div style={{ fontSize: 16 }}>📍</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.display, fontSize: 13.5, fontWeight: 600, color: C.ink }}>{s.name}</div>
                        <div style={{ fontFamily: F.body, fontSize: 11, color: C.faint }}>
                          {quotaOf(s)} kursi · {s.shifts.map((sh) => `${sh.name} ${sh.quota}`).join(" / ")}
                        </div>
                      </div>
                      <button onClick={() => removeSite(c.id, s.id)} style={{ border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer" }}>×</button>
                    </div>
                  ))}

                  <button onClick={() => openSite(c.id)} style={{ width: "100%", borderTop: `1px solid ${C.line}`, padding: "11px", background: "transparent", fontFamily: F.display, fontSize: 12.5, fontWeight: 700, color: C.brand, cursor: "pointer", border: "none" }}>
                    + Tambah site di {c.name}
                  </button>
                </div>
              ))}
            </div>

            <DashAdd onClick={() => { setClientName(""); setClientSheet(true); }}>+ Tambah klien</DashAdd>
          </div>
        )}

        {/* ---------- STEP 2 — WORKER ---------- */}
        {step === 2 && (
          <div>
            <h2 style={hStyle}>Tambah worker</h2>
            <p style={pStyle}>
              Tiap worker pilih divisinya — security, cleaning, atau technician — lalu ditempatkan di sebuah site.
            </p>

            {allSites.length === 0 && (
              <div style={{ ...emptyBox, color: C.amberInk, background: C.amberBg }}>Belum ada site. Balik ke langkah Klien & Site dulu — worker butuh tempat ditugaskan.</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {workers.map((w, i) => {
                const d = divisiOf(w.divisi);
                const site = siteById(w.siteId);
                return (
                  <div key={w.id} style={{ border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface, overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: d.toneBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{d.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: C.ink }}>{w.name}</div>
                        <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub }}>{d.t}{site ? " · " + site.name : ""}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 11, color: C.faint }}>{w.phone}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, color: w.status === "active" ? C.brandDk : C.amberInk, background: w.status === "active" ? C.okBg : C.amberBg }}>
                          {w.status === "active" ? "Aktif" : "Menunggu"}
                        </span>
                        <button onClick={() => setWorkers(workers.filter((x) => x.id !== w.id))} style={{ border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                      </div>
                    </div>
                    <button onClick={() => setCardIdx(i)} style={{ width: "100%", borderTop: `1px solid ${C.line}`, padding: "10px", background: "transparent", fontFamily: F.display, fontSize: 12.5, fontWeight: 700, color: C.brand, cursor: "pointer", border: "none" }}>
                      {w.status === "active" ? "ID Card" : "ID Card & undangan"}
                    </button>
                  </div>
                );
              })}
            </div>

            <DashAdd onClick={() => { setWDraft({ name: "", phone: "", divisi: "", siteId: "" }); setWSheet(true); }}>+ Tambah worker</DashAdd>
          </div>
        )}

        {/* ---------- STEP 3 — SUPERVISOR ---------- */}
        {step === 3 && (
          <div>
            <h2 style={hStyle}>Otoritas supervisor</h2>
            <p style={pStyle}>
              Supervisor adalah satu-satunya yang mengorkestrasi operan, memvalidasi kehadiran, dan menutup kasus. Default dipegang kamu otomatis.
            </p>

            {/* Owner card — supervisor terkunci (analog Resolusi) */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.slateBg, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: C.slate, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 15 }}>
                {(tenant.owner || "O").slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: C.ink }}>{tenant.owner || "Pemilik"} · Pemilik</div>
                <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub }}>Supervisor (otomatis)</div>
              </div>
              <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: C.slate, background: "#fff" }}>Terkunci</span>
            </div>

            {/* Delegasi opsional */}
            {delegates.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface, marginBottom: 9 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: C.brandBg, color: C.brandDk, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 15 }}>{d.name.slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: C.ink }}>{d.name}</div>
                  <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub }}>Supervisor (didelegasikan)</div>
                </div>
                <button onClick={() => setDelegates(delegates.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer" }}>×</button>
              </div>
            ))}

            <DashAdd onClick={() => { setSupDraft({ name: "", phone: "" }); setSupSheet(true); }}>+ Tunjuk supervisor lain (opsional)</DashAdd>

            <div style={{ marginTop: 14, padding: "12px 14px", background: C.slateBg, borderRadius: 12, fontFamily: F.body, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
              Otoritas supervisor dipegang pemilik secara otomatis — operan & kasus tidak akan menggantung tanpa yang berwenang menutup. Delegasi cuma diperlukan saat operasi besar.
            </div>
          </div>
        )}

        {/* ---------- STEP 4 — AKTIFKAN (gerbang §10) ---------- */}
        {step === 4 && (
          <div>
            <h2 style={hStyle}>Siap dijalankan?</h2>
            <p style={pStyle}>{tenant.vendor || "Vendor"} akan mulai operasi. Cek kelengkapannya dulu.</p>
            {[
              { k: "site", label: "Klien & Site", val: `${allSites.length} site di ${clients.length} klien`, ok: gate.site },
              { k: "worker", label: "Worker", val: `${workers.length} worker`, ok: gate.worker },
              { k: "supervisor", label: "Supervisor", val: `${tenant.owner || "Pemilik"} (otomatis)${delegates.length ? " + " + delegates.length + " delegasi" : ""}`, ok: true },
            ].map((row) => (
              <div key={row.k} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface, marginBottom: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: row.ok ? C.okBg : C.amberBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: row.ok ? C.ok : C.amber, fontWeight: 800, fontSize: 14 }}>{row.ok ? "✓" : "!"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 14.5, fontWeight: 600, color: C.ink }}>{row.label}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: row.ok ? C.sub : C.amberInk }}>{row.val}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: "12px 14px", background: C.slateBg, borderRadius: 12, fontFamily: F.body, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
              Divisi tidak harus lengkap — vendor yang cuma jalan security cukup punya worker security. Yang wajib: minimal satu site, satu worker, dan supervisor (otomatis).
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 18px 18px", borderTop: `1px solid ${C.line}`, background: C.surface }}>
        {step < 4 && <Primary onClick={() => setStep(step + 1)} disabled={!canNext}>{step === 3 ? "Lanjut ke aktivasi" : "Lanjut"}</Primary>}
        {step === 4 && <Primary onClick={() => { try { alert("Operasi diaktifkan — provisioning menepi, runtime mulai."); } catch (e) {} }} disabled={!gateReady}>Aktifkan operasi</Primary>}
      </div>

      {/* ---- Sheets ---- */}
      {clientSheet && (
        <Sheet title="Tambah klien" onClose={() => setClientSheet(false)}>
          <Field label="Nama klien" value={clientName} onChange={setClientName} placeholder="mis. PT Jamsostek / RS PMI" hint="Pemilik gedung/site yang dilayani vendor." />
          <Primary onClick={addClient} disabled={!clientName.trim()}>Tambahkan klien</Primary>
        </Sheet>
      )}

      {siteSheet && siteDraft && (
        <Sheet title="Tambah site" onClose={() => { setSiteSheet(null); setSiteDraft(null); }}>
          <Field label="Nama site" value={siteDraft.name} onChange={(v) => setSiteDraft({ ...siteDraft, name: v })} placeholder="mis. Menara Jamsostek" />
          <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Kuota per shift</div>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.faint, marginBottom: 12, lineHeight: 1.45 }}>
            Berapa kursi kontrak tiap shift. Ini patokan yang dibandingkan dengan kehadiran nyata.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {siteDraft.shifts.map((sh, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                <input
                  value={sh.name}
                  onChange={(e) => setSiteDraft({ ...siteDraft, shifts: siteDraft.shifts.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })}
                  style={{ flex: 1, minWidth: 0, fontFamily: F.display, fontSize: 14, fontWeight: 600, color: C.ink, padding: "9px 11px", border: `1px solid ${C.line}`, borderRadius: 10, background: C.surface, outline: "none" }}
                />
                <Stepper value={sh.quota} onChange={(val) => setSiteDraft({ ...siteDraft, shifts: siteDraft.shifts.map((x, j) => j === i ? { ...x, quota: val } : x) })} />
                {siteDraft.shifts.length > 1 && (
                  <button onClick={() => setSiteDraft({ ...siteDraft, shifts: siteDraft.shifts.filter((_, j) => j !== i) })} style={{ border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer" }}>×</button>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setSiteDraft({ ...siteDraft, shifts: [...siteDraft.shifts, { name: "Shift", quota: 0 }] })} style={{ width: "100%", marginBottom: 14, padding: "10px", borderRadius: 11, border: `1.5px dashed ${C.line}`, background: "transparent", fontFamily: F.display, fontSize: 13, fontWeight: 600, color: C.sub, cursor: "pointer" }}>
            + Shift
          </button>

          <Primary onClick={addSite} disabled={!siteDraft.name.trim()}>Tambahkan site</Primary>
        </Sheet>
      )}

      {wSheet && (
        <Sheet title="Tambah worker" onClose={() => setWSheet(false)}>
          <Field label="Nama" value={wDraft.name} onChange={(v) => setWDraft({ ...wDraft, name: v })} placeholder="mis. Andi" />
          <Field label="No. HP" value={wDraft.phone} onChange={(v) => setWDraft({ ...wDraft, phone: v })} placeholder="08xx" type="tel" mono hint="Dipakai untuk mengirim akses ke app worker." />

          <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 7 }}>Divisi</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 16 }}>
            {DIVISI.map((r) => {
              const on = wDraft.divisi === r.v;
              return (
                <button key={r.v} onClick={() => setWDraft({ ...wDraft, divisi: r.v })} style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", padding: "12px 13px", borderRadius: 13, border: `1.5px solid ${on ? C.brand : C.line}`, background: on ? C.brandBg : C.surface, cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: r.toneBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: on ? C.brandDk : C.ink }}>{r.t}</div>
                    <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub, marginTop: 2 }}>{r.d}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${on ? C.brand : C.line}`, background: on ? C.brand : C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {on && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 7 }}>Ditugaskan ke site</div>
          {allSites.length === 0 ? (
            <div style={{ ...emptyBox, marginBottom: 16 }}>Belum ada site untuk dipilih.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              {allSites.map((s) => {
                const on = wDraft.siteId === s.id;
                return (
                  <button key={s.id} onClick={() => setWDraft({ ...wDraft, siteId: s.id })} style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "11px 13px", borderRadius: 12, border: `1.5px solid ${on ? C.brand : C.line}`, background: on ? C.brandBg : C.surface, cursor: "pointer" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${on ? C.brand : C.line}`, background: on ? C.brand : C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {on && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.display, fontSize: 13.5, fontWeight: 600, color: on ? C.brandDk : C.ink }}>{s.name}</div>
                      <div style={{ fontFamily: F.body, fontSize: 11, color: C.faint }}>{s.clientName}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Primary onClick={addWorker} disabled={!wDraft.name.trim() || !wDraft.phone.trim() || !wDraft.divisi || !wDraft.siteId}>Tambahkan worker</Primary>
        </Sheet>
      )}

      {supSheet && (
        <Sheet title="Tunjuk supervisor" onClose={() => setSupSheet(false)}>
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.sub, marginBottom: 14, lineHeight: 1.45 }}>
            Orang ini akan ikut memegang otoritas supervisor (mengorkestrasi operan, memvalidasi, menutup kasus) di samping kamu.
          </div>
          <Field label="Nama" value={supDraft.name} onChange={(v) => setSupDraft({ ...supDraft, name: v })} placeholder="mis. Pak Rian" />
          <Field label="No. HP" value={supDraft.phone} onChange={(v) => setSupDraft({ ...supDraft, phone: v })} placeholder="08xx" type="tel" mono />
          <Primary onClick={() => { if (supDraft.name.trim()) { setDelegates([...delegates, supDraft]); setSupSheet(false); } }} disabled={!supDraft.name.trim()}>Tunjuk sebagai supervisor</Primary>
        </Sheet>
      )}

      {cardIdx !== null && workers[cardIdx] && (
        <Sheet title={"ID Card — " + workers[cardIdx].name} onClose={() => setCardIdx(null)}>
          <div style={{ marginBottom: 14 }}>
            <IDCard name={workers[cardIdx].name} divisi={workers[cardIdx].divisi} phone={workers[cardIdx].phone} vendor={tenant.vendor} site={(siteById(workers[cardIdx].siteId) || {}).name} active={workers[cardIdx].status === "active"} />
          </div>
          <button onClick={() => { try { alert("Menyiapkan ID Card untuk dicetak…"); } catch (e) {} }} style={{ width: "100%", height: 50, borderRadius: 14, border: `1px solid ${C.line}`, background: C.surface, fontFamily: F.display, fontSize: 14.5, fontWeight: 700, color: C.ink, cursor: "pointer", marginBottom: 10 }}>
            Cetak / simpan kartu
          </button>

          {workers[cardIdx].status === "invited" ? (
            <div>
              <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub, lineHeight: 1.5, margin: "4px 2px 12px" }}>
                Kartu siap dicetak sekarang — aktif otomatis setelah worker gabung. Bagikan undangan ke {workers[cardIdx].phone}; worker masuk dengan Google/Apple sendiri.
              </div>
              <button onClick={() => { try { window.open("https://wa.me/?text=" + encodeURIComponent("Undangan gabung " + (tenant.vendor || "AUTSORZ") + ": app.autsorz.id/join/" + ("AB12CD" + cardIdx).slice(0, 6)), "_blank"); } catch (e) {} }} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "#25D366", color: "#fff", fontFamily: F.display, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
                Bagikan undangan via WhatsApp
              </button>
              <button onClick={() => { setWorkers(workers.map((w, j) => j === cardIdx ? { ...w, status: "active", claimer: "Google · " + w.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com" } : w)); setCardIdx(null); }} style={{ width: "100%", padding: "10px", borderRadius: 12, border: `1px dashed ${C.line}`, background: "transparent", fontFamily: F.body, fontSize: 11.5, color: C.faint, cursor: "pointer" }}>
                (demo) Simulasikan worker gabung
              </button>
            </div>
          ) : (
            <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.faint, textAlign: "center", lineHeight: 1.5, marginTop: 2 }}>
              Scan kartu ini = masuk session worker. Hilang? Cabut & cetak ulang dari Pengaturan.
            </div>
          )}
        </Sheet>
      )}
    </Frame>
  );
}

// ----- shared styles & frame -----------------------------------------------
const hStyle = { fontFamily: F.display, fontSize: 22, fontWeight: 800, color: C.ink, margin: "4px 0 6px", letterSpacing: "-0.01em" };
const pStyle = { fontFamily: F.body, fontSize: 13.5, color: C.sub, lineHeight: 1.5, margin: "0 0 16px" };
const emptyBox = { padding: "14px", borderRadius: 12, border: `1.5px dashed ${C.line}`, fontFamily: F.body, fontSize: 12.5, color: C.faint, lineHeight: 1.5, textAlign: "center", marginBottom: 4 };

function Frame({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#DDE4E0", display: "flex", justifyContent: "center", padding: "24px 0", fontFamily: F.body }}>
      <div style={{ position: "relative", width: 390, height: 800, maxHeight: "calc(100dvh - 48px)", background: C.bg, borderRadius: 30, overflow: "hidden", boxShadow: "0 24px 60px rgba(16,20,18,0.22)", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// ===========================================================================
// AGENCY WIZARD (Consteon Agency) — vertikal ke-3
// Fork dari AUTSORZ, sengaja lebih RINGAN: genesis per-project (bukan
// site+shift+kuota), jadi brand & model SKIPPABLE — bisa ditambah di ops.
//   0. Agency (daftar)      ← analog Vendor
//   1. Brand (flat)         ← analog Klien, TANPA site/shift/kuota
//   2. Model (roster)       ← analog Worker, TANPA divisi/assign; bulk-paste
//   3. Tim ops              ← analog Supervisor; Fate ops = orkestrator
//   4. Aktifkan             ← gerbang RINGAN: cukup agency-nya
// ===========================================================================
const STEPS_A = ["Agency", "Brand", "Model", "Tim ops", "Aktifkan"];
const AG = { bg: "#EFEBFD", ink: "#6D28D9", solid: "#7A5AF0" };

// Parse tempel-massal: tiap baris "Nama, 08xxx" (pisah koma/tab/;). HP wajib.
function parseBulkModels(text) {
  return text.split("\n").map((l) => {
    const parts = l.split(/[,\t;]/).map((s) => s.trim());
    return { name: parts[0] || "", phone: (parts[1] || "").replace(/[^\d+]/g, "") };
  }).filter((r) => r.name);
}

// Dummy kontak HP (mewakili contact picker native). Sengaja campur: ada model,
// ada noise (bengkel/kos/ojek) — makanya picker multi-select + bisa ditinjau dulu.
const MOCK_CONTACTS = [
  { name: "Kirana", phone: "081234550001" },
  { name: "Dara Ayu", phone: "081234550002" },
  { name: "Sasha M", phone: "081234550003" },
  { name: "Bengkel Motor Pak Har", phone: "081234559911" },
  { name: "Nadia", phone: "081234550004" },
  { name: "Ayu Lestari", phone: "081234550005" },
  { name: "Ibu Kos", phone: "081234559912" },
  { name: "Rani", phone: "081234550006" },
  { name: "Tari", phone: "081234550007" },
  { name: "Gojek Langganan", phone: "081234559913" },
  { name: "Vina", phone: "081234550008" },
  { name: "Bella", phone: "081234550009" },
];

function AgencyWizard({ tenant, authMethod, onExit }) {
  const [step, setStep] = useState(0);
  const [owner, setOwner] = useState(tenant.owner || "");
  const [agency, setAgency] = useState(tenant.vendor || "");

  const [brands, setBrands] = useState([]);
  const [brandSheet, setBrandSheet] = useState(false);
  const [brandName, setBrandName] = useState("");

  const [models, setModels] = useState([]); // {id,name,phone}
  const [modelSheet, setModelSheet] = useState(false);
  const [mDraft, setMDraft] = useState({ name: "", phone: "" });
  const [bulkText, setBulkText] = useState("");

  const [delegates, setDelegates] = useState([]);
  const [opsSheet, setOpsSheet] = useState(false);
  const [opsDraft, setOpsDraft] = useState({ name: "", phone: "" });

  const [contactSheet, setContactSheet] = useState(false);
  const [pickedC, setPickedC] = useState([]); // phone[]
  const [cq, setCq] = useState("");
  const [inviteIdx, setInviteIdx] = useState(null);
  const [contactTarget, setContactTarget] = useState("models"); // "models" | "ops"

  const canNext = step === 0 ? owner.trim() && agency.trim() : true; // brand/model/ops skippable
  const gateReady = !!agency.trim(); // gerbang ringan

  function addBrand() { const n = brandName.trim(); if (n) { setBrands((p) => p.includes(n) ? p : [...p, n]); setBrandName(""); setBrandSheet(false); } }
  function addModel() { if (mDraft.name.trim() && mDraft.phone.trim()) { setModels((p) => [...p, { id: "md_" + Date.now(), name: mDraft.name.trim(), phone: mDraft.phone.trim(), status: "invited" }]); setMDraft({ name: "", phone: "" }); setModelSheet(false); } }
  function addBulk() {
    const valid = parseBulkModels(bulkText).filter((r) => r.phone);
    if (valid.length) { setModels((p) => [...p, ...valid.map((r, i) => ({ id: "md_" + Date.now() + "_" + i, name: r.name, phone: r.phone, status: "invited" }))]); setBulkText(""); setModelSheet(false); }
  }
  function addContacts() {
    const chosen = MOCK_CONTACTS.filter((c) => pickedC.includes(c.phone));
    if (chosen.length) {
      if (contactTarget === "ops") {
        setDelegates((p) => {
          const have = new Set(p.map((d) => d.phone));
          return [...p, ...chosen.filter((c) => !have.has(c.phone)).map((c) => ({ name: c.name, phone: c.phone }))];
        });
      } else {
        setModels((p) => {
          const have = new Set(p.map((m) => m.phone));
          const add = chosen.filter((c) => !have.has(c.phone)).map((c, i) => ({ id: "md_" + Date.now() + "_" + i, name: c.name, phone: c.phone, status: "invited" }));
          return [...p, ...add];
        });
      }
    }
    setPickedC([]); setCq(""); setContactSheet(false); setModelSheet(false); setOpsSheet(false);
  }

  return (
    <Frame>
      {/* Header */}
      <div style={{ background: C.surface, padding: "18px 18px 14px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => (step > 0 ? setStep(step - 1) : onExit())} style={{ border: "none", background: "transparent", fontSize: 22, color: C.sub, cursor: "pointer", padding: 0, lineHeight: 1 }}>‹</button>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: "-0.01em" }}>{agency || "Consteon Agency"}</div>
              <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.faint }}>Penyiapan agency · {STEPS_A[step]}</div>
            </div>
          </div>
          <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600, color: AG.ink, background: AG.bg, padding: "4px 9px", borderRadius: 7, letterSpacing: "0.02em" }}>AGENCY</span>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {STEPS_A.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? AG.solid : C.line }} />
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>

        {/* STEP 0 — AGENCY */}
        {step === 0 && (
          <div>
            <h2 style={hStyle}>Buat akun agency</h2>
            <p style={pStyle}>Akun ini pemilik agency — dan otomatis pemegang <b>orkestrator ops</b> (bikin project, konfirmasi selisih, koreksi jam, tandai no-show). Bisa diserahkan nanti.</p>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: authMethod === "google" ? "#fff" : C.ink, border: authMethod === "google" ? `1px solid ${C.line}` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 13, color: authMethod === "google" ? "#4285F4" : "#fff" }}>
                {authMethod === "google" ? "G" : <AppleMark size={15} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 600, color: C.ink }}>Masuk via {authMethod === "google" ? "Google" : "Apple"}</div>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.faint }}>{tenant.phone}</div>
              </div>
              <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: C.brandDk, background: C.okBg }}>Terverifikasi</span>
            </div>

            <Field label="Nama kamu (pemilik)" value={owner} onChange={setOwner} placeholder="mis. Sarah" hint={authMethod === "google" ? "Terisi dari Google — boleh diubah." : "Apple kadang tidak kasih nama — isi manual."} />
            <Field label="Nama agency" value={agency} onChange={setAgency} placeholder="mis. Fate Talent" />

            <div style={{ marginTop: 8, padding: "13px 14px", background: AG.bg, borderRadius: 12, fontFamily: F.body, fontSize: 12, color: AG.ink, lineHeight: 1.5 }}>
              Beda dari outsourcing: kehadiran dihitung <b>per project</b>, bukan dari satu tanggal go-live. Jadi kamu tak perlu menyiapkan site/shift — cukup daftar brand & model, lalu project dibuat kapan saja di kokpit.
            </div>
          </div>
        )}

        {/* STEP 1 — BRAND */}
        {step === 1 && (
          <div>
            <h2 style={hStyle}>Daftar brand</h2>
            <p style={pStyle}>Brand yang kamu layani — dipilih saat bikin project (bukan diketik ulang, biar tak jadi entitas kembar). <b>Bisa dilewati</b>; brand juga bisa ditambah saat bikin project.</p>

            {brands.length === 0 ? (
              <div style={emptyBox}>Belum ada brand. Tambah yang sudah pasti, sisanya nanti saat bikin project.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {brands.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: AG.bg, color: AG.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 14 }}>{b.slice(0, 1).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0, fontFamily: F.display, fontSize: 14.5, fontWeight: 600, color: C.ink }}>{b}</div>
                    <button onClick={() => setBrands(brands.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <DashAdd onClick={() => { setBrandName(""); setBrandSheet(true); }}>+ Tambah brand</DashAdd>
          </div>
        )}

        {/* STEP 2 — MODEL */}
        {step === 2 && (
          <div>
            <h2 style={hStyle}>Roster model</h2>
            <p style={pStyle}>Talent yang dikontrak agency. Tiap model butuh <b>nama + no. HP</b> — HP jadi kunci identitas & akses app. Assignment ke project dilakukan di kokpit. <b>Bisa dilewati</b>; model juga bisa ditambah (termasuk cabutan luar) saat assign.</p>

            {models.length === 0 ? (
              <div style={emptyBox}>Belum ada model. Tempel banyak nama sekaligus lewat "Tambah model".</div>
            ) : (
              <>
                <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.faint, marginBottom: 8 }}>{models.length} model terdaftar</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {models.map((m, i) => (
                    <div key={m.id} style={{ border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: AG.bg, color: AG.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 13 }}>{m.name.slice(0, 1).toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.display, fontSize: 13.5, fontWeight: 600, color: C.ink }}>{m.name}</div>
                          <div style={{ fontFamily: F.mono, fontSize: 10.5, color: C.faint }}>{m.phone}</div>
                        </div>
                        <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, color: m.status === "active" ? C.brandDk : C.amberInk, background: m.status === "active" ? C.okBg : C.amberBg }}>
                          {m.status === "active" ? "Aktif" : "Menunggu"}
                        </span>
                        <button onClick={() => setModels(models.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer" }}>×</button>
                      </div>
                      <button onClick={() => setInviteIdx(i)} style={{ width: "100%", borderTop: `1px solid ${C.line}`, padding: "9px", background: "transparent", fontFamily: F.display, fontSize: 12.5, fontWeight: 700, color: AG.ink, cursor: "pointer", border: "none" }}>
                        {m.status === "active" ? "Lihat undangan" : "Bagikan undangan"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <DashAdd onClick={() => { setMDraft({ name: "", phone: "" }); setBulkText(""); setModelSheet(true); }}>+ Tambah model</DashAdd>
          </div>
        )}

        {/* STEP 3 — TIM OPS */}
        {step === 3 && (
          <div>
            <h2 style={hStyle}>Tim ops</h2>
            <p style={pStyle}>Tim ops mengorkestrasi semua: bikin project, konfirmasi selisih ke brand, koreksi jam, tandai no-show. Default dipegang kamu otomatis.</p>

            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: AG.bg, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: AG.solid, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 15 }}>{(owner || "O").slice(0, 1).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: C.ink }}>{owner || "Pemilik"} · Pemilik</div>
                <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub }}>Orkestrator ops (otomatis)</div>
              </div>
              <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 6, color: AG.ink, background: "#fff" }}>Terkunci</span>
            </div>

            {delegates.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface, marginBottom: 9 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: AG.bg, color: AG.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 15 }}>{d.name.slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: C.ink }}>{d.name}</div>
                  <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub }}>Tim ops (didelegasikan)</div>
                </div>
                <button onClick={() => setDelegates(delegates.filter((_, j) => j !== i))} style={{ border: "none", background: "transparent", color: C.faint, fontSize: 18, cursor: "pointer" }}>×</button>
              </div>
            ))}

            <DashAdd onClick={() => { setOpsDraft({ name: "", phone: "" }); setOpsSheet(true); }}>+ Tambah anggota tim ops (opsional)</DashAdd>

            <div style={{ marginTop: 14, padding: "12px 14px", background: AG.bg, borderRadius: 12, fontFamily: F.body, fontSize: 12, color: AG.ink, lineHeight: 1.5 }}>
              Brand belum punya app — konfirmasi selisih dicatat tim ops atas nama brand. Otoritas tim ops dipegang pemilik otomatis, jadi tak ada kasus menggantung.
            </div>
          </div>
        )}

        {/* STEP 4 — AKTIFKAN (gerbang ringan) */}
        {step === 4 && (
          <div>
            <h2 style={hStyle}>Siap dijalankan?</h2>
            <p style={pStyle}>{agency || "Agency"} akan aktif. Yang wajib cuma agency-nya — brand & model boleh nyusul di kokpit.</p>
            {[
              { label: "Agency", val: agency || "—", ok: !!agency.trim(), req: true },
              { label: "Brand", val: brands.length ? `${brands.length} brand` : "Belum ada · bisa nyusul", ok: brands.length > 0, req: false },
              { label: "Model", val: models.length ? `${models.length} model` : "Belum ada · bisa nyusul", ok: models.length > 0, req: false },
              { label: "Tim ops", val: `${owner || "Pemilik"} (otomatis)${delegates.length ? " + " + delegates.length + " anggota" : ""}`, ok: true, req: true },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface, marginBottom: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: row.ok ? C.okBg : (row.req ? C.amberBg : C.slateBg), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: row.ok ? C.ok : (row.req ? C.amber : C.faint), fontWeight: 800, fontSize: 14 }}>{row.ok ? "✓" : (row.req ? "!" : "○")}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.display, fontSize: 14.5, fontWeight: 600, color: C.ink }}>{row.label}{!row.req && <span style={{ fontFamily: F.body, fontSize: 10.5, fontWeight: 600, color: C.faint }}> · opsional</span>}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: row.ok ? C.sub : (row.req ? C.amberInk : C.faint) }}>{row.val}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: "12px 14px", background: AG.bg, borderRadius: 12, fontFamily: F.body, fontSize: 12, color: AG.ink, lineHeight: 1.5 }}>
              Genesis agency itu per-project — jadi tak ada site/kuota yang wajib disiapkan. Kamu bisa aktif sekarang dengan roster kosong, lalu tambah brand & model saat bikin project pertama.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 18px 18px", borderTop: `1px solid ${C.line}`, background: C.surface }}>
        {step < 4 && (
          <button onClick={() => canNext && setStep(step + 1)} disabled={!canNext} style={{ width: "100%", height: 54, borderRadius: 14, border: "none", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#fff", background: canNext ? AG.solid : "#BFC9C4", cursor: canNext ? "pointer" : "not-allowed" }}>
            {step === 3 ? "Lanjut ke aktivasi" : (step >= 1 ? "Lanjut" : "Lanjut")}
          </button>
        )}
        {step === 4 && (
          <button onClick={() => { try { alert("Consteon Agency aktif — provisioning menepi, kokpit siap."); } catch (e) {} }} disabled={!gateReady} style={{ width: "100%", height: 54, borderRadius: 14, border: "none", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#fff", background: gateReady ? AG.solid : "#BFC9C4", cursor: gateReady ? "pointer" : "not-allowed" }}>
            Aktifkan agency
          </button>
        )}
        {step >= 1 && step < 4 && (
          <div style={{ textAlign: "center", marginTop: 10, fontFamily: F.body, fontSize: 12, color: C.faint }}>
            Langkah ini bisa dilewati — <span onClick={() => setStep(step + 1)} style={{ color: AG.ink, fontWeight: 700, cursor: "pointer" }}>lewati</span>
          </div>
        )}
      </div>

      {/* Sheets */}
      {brandSheet && (
        <Sheet title="Tambah brand" onClose={() => setBrandSheet(false)}>
          <Field label="Nama brand" value={brandName} onChange={setBrandName} placeholder="mis. Aveda Skincare" hint="Klien yang mengontrak project ke agency." />
          <Primary onClick={addBrand} disabled={!brandName.trim()}>Tambahkan brand</Primary>
        </Sheet>
      )}

      {modelSheet && (() => {
        const rows = parseBulkModels(bulkText);
        const valid = rows.filter((r) => r.phone);
        const missing = rows.filter((r) => !r.phone);
        return (
        <Sheet title="Tambah model" onClose={() => setModelSheet(false)}>
          <button onClick={() => { setContactTarget("models"); setPickedC([]); setCq(""); setContactSheet(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderRadius: 14, border: "none", background: AG.solid, cursor: "pointer", marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>📇</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: "#fff" }}>Pilih dari kontak</div>
              <div style={{ fontFamily: F.body, fontSize: 11.5, color: "#fff", opacity: 0.85 }}>Tercepat & bebas typo — nomor kebawa dari HP</div>
            </div>
            <span style={{ color: "#fff", fontSize: 18, opacity: 0.9 }}>›</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            <span style={{ fontFamily: F.body, fontSize: 11, color: C.faint }}>atau isi manual</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
          </div>

          <Field label="Nama" value={mDraft.name} onChange={(v) => setMDraft({ ...mDraft, name: v })} placeholder="mis. Kirana" />
          <Field label="No. HP" value={mDraft.phone} onChange={(v) => setMDraft({ ...mDraft, phone: v })} placeholder="08xx" type="tel" mono hint="Nomor unik — jadi kunci identitas & akses app model." />
          <Primary onClick={addModel} disabled={!mDraft.name.trim() || !mDraft.phone.trim()}>Tambahkan model</Primary>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 12px" }}>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            <span style={{ fontFamily: F.body, fontSize: 11, color: C.faint }}>atau tempel banyak sekaligus</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.sub, marginBottom: 6 }}>Satu baris per model, format <b>Nama, No. HP</b> — cocok tempel dari spreadsheet.</div>
          <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"Kirana, 0811xxxx\nDara, 0812xxxx\nSasha, 0813xxxx"} rows={4}
            style={{ width: "100%", boxSizing: "border-box", fontFamily: F.mono, fontSize: 13, color: C.ink, padding: "12px 13px", border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface, outline: "none", resize: "vertical", marginBottom: 8 }} />
          {missing.length > 0 && (
            <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.amberInk, background: C.amberBg, borderRadius: 10, padding: "8px 11px", marginBottom: 10, lineHeight: 1.45 }}>
              {missing.length} baris tanpa nomor akan dilewati — HP wajib karena jadi kunci identitas.
            </div>
          )}
          <button onClick={addBulk} disabled={valid.length === 0} style={{ width: "100%", height: 48, borderRadius: 14, border: `1px solid ${C.line}`, background: valid.length ? C.surface : "#F4F7F5", fontFamily: F.display, fontSize: 14, fontWeight: 700, color: valid.length ? AG.ink : C.faint, cursor: valid.length ? "pointer" : "not-allowed" }}>
            Tambah {valid.length || ""} model dari daftar
          </button>
        </Sheet>
        );
      })()}

      {contactSheet && (() => {
        const list = MOCK_CONTACTS.filter((c) => c.name.toLowerCase().includes(cq.toLowerCase()) || c.phone.includes(cq));
        const have = new Set((contactTarget === "ops" ? delegates : models).map((x) => x.phone));
        return (
        <Sheet title="Pilih dari kontak" onClose={() => setContactSheet(false)}>
          <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.faint, marginBottom: 12, lineHeight: 1.45 }}>
            Contoh — di app asli ini membuka kontak HP kamu. Kontak campur (ada non-model), jadi centang yang model saja.
          </div>
          <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder="Cari kontak…" style={{ width: "100%", boxSizing: "border-box", fontFamily: F.body, fontSize: 14, color: C.ink, padding: "11px 13px", border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface, outline: "none", marginBottom: 12 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14, maxHeight: 320, overflowY: "auto" }}>
            {list.map((c) => {
              const already = have.has(c.phone);
              const on = pickedC.includes(c.phone) || already;
              return (
                <button key={c.phone} disabled={already} onClick={() => setPickedC((p) => p.includes(c.phone) ? p.filter((x) => x !== c.phone) : [...p, c.phone])}
                  style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", padding: "11px 13px", borderRadius: 12, border: `1.5px solid ${on ? AG.solid : C.line}`, background: on ? AG.bg : C.surface, cursor: already ? "default" : "pointer", opacity: already ? 0.55 : 1 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: on ? AG.solid : C.slateBg, color: on ? "#fff" : C.sub, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{c.name.slice(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontSize: 13.5, fontWeight: 600, color: C.ink }}>{c.name}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 10.5, color: C.faint }}>{c.phone}{already ? " · sudah di roster" : ""}</div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${on ? AG.solid : C.line}`, background: on ? AG.solid : C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {on && <span style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={addContacts} disabled={pickedC.length === 0} style={{ width: "100%", height: 54, borderRadius: 14, border: "none", fontFamily: F.display, fontSize: 16, fontWeight: 700, color: "#fff", background: pickedC.length ? AG.solid : "#BFC9C4", cursor: pickedC.length ? "pointer" : "not-allowed" }}>
            Tambah {pickedC.length || ""} kontak ke roster
          </button>
        </Sheet>
        );
      })()}

      {inviteIdx !== null && models[inviteIdx] && (
        <Sheet title={"Undang " + models[inviteIdx].name} onClose={() => setInviteIdx(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.surface, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: AG.bg, color: AG.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontWeight: 800, fontSize: 17 }}>{models[inviteIdx].name.slice(0, 1).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: C.ink }}>{models[inviteIdx].name}</div>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: C.faint }}>{models[inviteIdx].phone}</div>
            </div>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", padding: "3px 8px", borderRadius: 6, color: models[inviteIdx].status === "active" ? C.brandDk : C.amberInk, background: models[inviteIdx].status === "active" ? C.okBg : C.amberBg }}>
              {models[inviteIdx].status === "active" ? "Aktif" : "Menunggu"}
            </span>
          </div>

          {models[inviteIdx].status === "invited" ? (
            <div>
              <div style={{ fontFamily: F.body, fontSize: 12, color: C.sub, lineHeight: 1.55, margin: "0 2px 14px" }}>
                Kirim link ke {models[inviteIdx].phone}. Model buka app model, masuk dengan Google/Apple sendiri (satu model satu HP), lalu otomatis aktif — tak perlu kartu, tak perlu scan.
              </div>
              <button onClick={() => { try { window.open("https://wa.me/?text=" + encodeURIComponent("Undangan gabung " + (agency || "Consteon Agency") + ": app.consteon.id/join/" + ("AG12CD" + inviteIdx).slice(0, 6)), "_blank"); } catch (e) {} }} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "#25D366", color: "#fff", fontFamily: F.display, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>
                Bagikan undangan via WhatsApp
              </button>
              <button onClick={() => { setModels(models.map((m, j) => j === inviteIdx ? { ...m, status: "active", claimer: "Google · " + m.name.toLowerCase().replace(/\s+/g, "") + "@gmail.com" } : m)); setInviteIdx(null); }} style={{ width: "100%", padding: "10px", borderRadius: 12, border: `1px dashed ${C.line}`, background: "transparent", fontFamily: F.body, fontSize: 11.5, color: C.faint, cursor: "pointer" }}>
                (demo) Simulasikan model gabung
              </button>
            </div>
          ) : (
            <div style={{ fontFamily: F.body, fontSize: 12, color: C.sub, textAlign: "center", lineHeight: 1.5, marginTop: 2 }}>
              Sudah gabung via {models[inviteIdx].claimer}. Model siap di-assign ke project.
            </div>
          )}
        </Sheet>
      )}

      {opsSheet && (
        <Sheet title="Tambah anggota tim ops" onClose={() => setOpsSheet(false)}>
          <div style={{ fontFamily: F.body, fontSize: 12, color: C.sub, marginBottom: 14, lineHeight: 1.45 }}>Anggota ini ikut memegang otoritas ops (bikin project, konfirmasi selisih, koreksi jam) di samping kamu.</div>
          <button onClick={() => { setContactTarget("ops"); setPickedC([]); setCq(""); setContactSheet(true); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderRadius: 14, border: "none", background: AG.solid, cursor: "pointer", marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>📇</span>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: "#fff" }}>Pilih dari kontak</div>
              <div style={{ fontFamily: F.body, fontSize: 11.5, color: "#fff", opacity: 0.85 }}>Nomor bebas typo — kunci identitas juga</div>
            </div>
            <span style={{ color: "#fff", fontSize: 18, opacity: 0.9 }}>›</span>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "14px 0 12px" }}>
            <div style={{ flex: 1, height: 1, background: C.line }} />
            <span style={{ fontFamily: F.body, fontSize: 11, color: C.faint }}>atau isi manual</span>
            <div style={{ flex: 1, height: 1, background: C.line }} />
          </div>
          <Field label="Nama" value={opsDraft.name} onChange={(v) => setOpsDraft({ ...opsDraft, name: v })} placeholder="mis. Dini" />
          <Field label="No. HP" value={opsDraft.phone} onChange={(v) => setOpsDraft({ ...opsDraft, phone: v })} placeholder="08xx" type="tel" mono />
          <Primary onClick={() => { if (opsDraft.name.trim()) { setDelegates([...delegates, opsDraft]); setOpsSheet(false); } }} disabled={!opsDraft.name.trim()}>Tambahkan ke tim ops</Primary>
        </Sheet>
      )}
    </Frame>
  );
}

export default Main;
