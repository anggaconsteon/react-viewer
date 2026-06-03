import { useState, useEffect, useCallback } from "react";

const C = {
  pri: "#1a5fa4", priDk: "#0d3d6e", priDp: "#092c53",
  acc: "#5dcaa5", accLt: "rgba(93,202,165,0.15)", accBd: "rgba(93,202,165,0.35)", accTx: "#9fe1cb",
  w: "#fff", bg: "#f4f6f9", card: "#fff", bgS: "#f0f2f6",
  tx: "#1a1d23", txS: "#6b7280", txT: "#9ca3af", bd: "#e5e7eb",
  b50: "#e6f1fb", b6: "#185fa5", b8: "#0c447c",
  t50: "#e1f5ee", t6: "#0f6e56", t8: "#085041",
  p50: "#eeedfe", p6: "#534ab7", p8: "#3c3489",
  c50: "#faece7", c6: "#993c1d", c8: "#712b13",
  a50: "#faeeda", a6: "#854f0b", a8: "#633806",
  r50: "#fcebeb", r6: "#a32d2d", r8: "#791f1f",
  gr50: "#f1efe8", gr4: "#888780", gr6: "#5f5e5a",
};

const I = ({ d, size = 16, color = "currentColor", sw = 1.8 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p, i) =>
      typeof p === "string" ? <path key={i} d={p} /> :
      p.t === "c" ? <circle key={i} cx={p.cx} cy={p.cy} r={p.r} /> :
      p.t === "r" ? <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx || 0} /> : null
    )}
  </svg>
);

const ic = {
  back: "M15 18l-6-6 6-6", chevR: "M9 18l6-6-6-6", chevD: "M6 9l6 6 6-6",
  refresh: ["M23 4v6h-6","M1 20v-6h6","M3.51 9a9 9 0 0114.85-3.36L23 10","M1 14l4.64 4.36A9 9 0 0020.49 15"],
  clock: [{t:"c",cx:12,cy:12,r:10},"M12 6v6l4 2"],
  pin: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z",{t:"c",cx:12,cy:10,r:3}],
  qr: [{t:"r",x:3,y:3,w:7,h:7},{t:"r",x:14,y:3,w:7,h:7},{t:"r",x:3,y:14,w:7,h:7},{t:"r",x:14,y:14,w:7,h:7}],
  selfie: [{t:"r",x:5,y:2,w:14,h:20,rx:2},{t:"c",cx:12,cy:14,r:3}],
  clip: ["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",{t:"r",x:9,y:3,w:6,h:4,rx:1},"M9 12h6","M9 16h4"],
  clipP: ["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2",{t:"r",x:9,y:3,w:6,h:4,rx:1},"M12 11v4","M10 13h4"],
  users: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2",{t:"c",cx:9,cy:7,r:4},"M23 21v-2a4 4 0 00-3-3.87","M16 3.13a4 4 0 010 7.75"],
  monitor: [{t:"r",x:2,y:3,w:20,h:14,rx:2},"M8 21h8","M12 17v4","M7 8h4","M7 11h8"],
  check: ["M22 11.08V12a10 10 0 11-5.93-9.14","M22 4L12 14.01l-3-3"],
  home: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"],
  chat: ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"],
  user: ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2",{t:"c",cx:12,cy:7,r:4}],
  alert: [{t:"c",cx:12,cy:12,r:10},"M12 8v4","M12 16h.01"],
  search: [{t:"c",cx:11,cy:11,r:8},"M21 21l-4.35-4.35"],
  login: ["M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4","M10 17l5-5-5-5","M13.8 12H3"],
  logout: ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M19.8 12H9"],
  cal: [{t:"r",x:3,y:4,w:18,h:18,rx:2},"M16 2v4","M8 2v4","M3 10h18"],
  send: ["M22 2L11 13","M22 2l-7 20-4-9-9-4 20-7z"],
  reply: ["M3 10h10a8 8 0 018 8v2","M3 10l6 6","M3 10l6-6"],
  tick: "M20 6L9 17l-5-5",
  img: [{t:"r",x:3,y:3,w:18,h:18,rx:2},{t:"c",cx:8.5,cy:8.5,r:1.5},"M21 15l-5-5L5 21"],
  plus: ["M12 5v14","M5 12h14"],
  minus: "M5 12h14",
  upload: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4","M17 8l-5-5-5 5","M12 3v12"],
  grid: [{t:"r",x:3,y:3,w:7,h:7},{t:"r",x:14,y:3,w:7,h:7},{t:"r",x:14,y:14,w:7,h:7},{t:"r",x:3,y:14,w:7,h:7}],
  briefcase: [{t:"r",x:2,y:7,w:20,h:14,rx:2},"M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"],
  info: [{t:"c",cx:12,cy:12,r:10},"M12 16v-4","M12 8h.01"],
  extLink: ["M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6","M15 3h6v6","M10 14L21 3"],
};

const pill = (bg, c) => ({ fontSize: 11, padding: "3px 10px", borderRadius: 10, fontWeight: 600, background: bg, color: c, whiteSpace: "nowrap" });
const iBox = (bg, s = 32) => ({ width: s, height: s, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 });
const sH = { fontSize: 13, fontWeight: 700, color: C.txS, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 };
const crd = { background: C.card, border: `1px solid ${C.bd}`, borderRadius: 16, marginBottom: 12, overflow: "hidden" };
const sBar = { display: "flex", alignItems: "center", gap: 8, background: C.bgS, borderRadius: 8, padding: "10px 12px", marginBottom: 12 };
const fChip = (on) => ({ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: on ? "none" : `1px solid ${C.bd}`, background: on ? C.pri : C.card, color: on ? C.w : C.txS, fontFamily: "inherit", whiteSpace: "nowrap" });
const fLabel = { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 };
const fIcon = (bg) => ({ ...iBox(bg, 28) });
const fName = { fontSize: 13, fontWeight: 500, color: C.tx };
const inputS = { width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.bd}`, background: C.card, fontSize: 13, color: C.tx, fontFamily: "inherit", outline: "none" };
const textareaS = { ...inputS, resize: "none", height: 90, lineHeight: 1.6 };
const locField = { ...inputS, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "12px 14px" };
const locBtn = (bg) => ({ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 });
const btnSubmit = { flex: 2, padding: 14, borderRadius: 8, border: "none", background: C.pri, fontSize: 14, fontWeight: 600, color: C.w, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 };

// ─── App Switcher ───
const AppSwitcher = ({ activeApp, onSwitch }) => {
  const apps = [
    { id: "autsorz", icon: ic.users, bg: C.c50, c: C.c6, acBg: "rgba(153,60,29,0.12)", label: "Autsorz", desc: "Kelola tenaga kerja" },
    { id: "vtl", icon: ic.monitor, bg: C.b50, c: C.b6, acBg: "rgba(24,95,165,0.12)", label: "VTL", desc: "Dashboard & monitoring" },
    { id: "info", icon: ic.info, bg: C.a50, c: C.a6, acBg: "rgba(133,79,11,0.12)", label: "Info", desc: "Pengumuman & kontak" },
  ];
  return (
    <div style={{ padding: "0 16px 6px", background: `linear-gradient(180deg, ${C.priDk} 0%, ${C.priDp} 100%)` }}>
      <div style={{ display: "flex", gap: 6 }}>
        {apps.map(a => {
          const on = activeApp === a.id;
          return (
            <div key={a.id} onClick={() => onSwitch(a.id)} style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              padding: "10px 10px", borderRadius: 12, cursor: "pointer",
              background: on ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.04)",
              border: on ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.2s ease",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: on ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                transition: "all 0.2s ease",
              }}>
                <I d={a.icon} size={15} color={on ? C.w : "rgba(255,255,255,0.5)"} sw={on ? 2 : 1.5} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: on ? 700 : 500,
                  color: on ? C.w : "rgba(255,255,255,0.55)",
                  transition: "all 0.2s ease",
                }}>{a.label}</div>
                <div style={{
                  fontSize: 10,
                  color: on ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)",
                  marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{a.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Progress Bar Component ───
const ProgBar = ({ filled, total }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < filled ? C.pri : i === filled ? C.acc : C.bd }} />
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: C.tx }}>Lengkapi data</span>
      <span style={{ fontSize: 12, color: C.txT }}>{filled} / {total} terisi</span>
    </div>
  </div>
);

// ─── Location Field Component ───
const LocField = () => (
  <div style={{ marginBottom: 16 }}>
    <div style={fLabel}>
      <div style={fIcon(C.b50)}><I d={ic.pin} size={14} color={C.b6} /></div>
      <span style={fName}>Lokasi<span style={{ color: C.r6, fontSize: 11 }}>*</span></span>
      <span style={{ fontSize: 11, color: C.txT, marginLeft: "auto" }}>Scan atau ketik</span>
    </div>
    <div style={locField}>
      <span style={{ flex: 1, fontSize: 13, color: C.txT }}>Cari atau scan lokasi...</span>
      <div style={locBtn(C.b50)}><I d={ic.qr} size={14} color={C.b6} sw={1.5} /></div>
      <div style={locBtn(C.t50)}><I d={ic.pin} size={14} color={C.t6} sw={1.5} /></div>
    </div>
  </div>
);

// ─── Photo Grid Component ───
const PhotoGrid = ({ max = 5 }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ ...fLabel, marginBottom: 10 }}>
      <div style={fIcon(C.c50)}><I d={ic.img} size={14} color={C.c6} /></div>
      <span style={fName}>Dokumentasi</span>
      <span style={{ fontSize: 12, color: C.txT, marginLeft: "auto" }}>0 / {max}</span>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      {[{ icon: ic.img, label: "Kamera", c: C.b6 }, { icon: ic.upload, label: "Upload", c: C.txT }].map((p, i) => (
        <div key={i} style={{ width: 74, height: 74, borderRadius: 8, border: `1.5px dashed ${C.bd}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", background: C.card }}>
          <I d={p.icon} size={18} color={p.c} sw={1.5} />
          <span style={{ fontSize: 10, color: C.txT }}>{p.label}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Chip Selector Component ───
const ChipSelect = ({ items, multi = true }) => {
  const [sel, setSel] = useState(new Set());
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((it, i) => {
        const on = sel.has(i);
        return (
          <button key={i} onClick={() => {
            const n = new Set(sel);
            if (multi) { on ? n.delete(i) : n.add(i); } else { n.clear(); n.add(i); }
            setSel(n);
          }} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, border: on ? `1px solid ${it.bc || C.p6}` : `1px solid ${C.bd}`, background: on ? (it.bg || C.p50) : C.card, color: on ? (it.c || C.p8) : C.txS, cursor: "pointer", fontFamily: "inherit" }}>
            {it.label || it}
          </button>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════
// HOME
// ═══════════════════════════════════════
function HomePage({ nav }) {
  const [method, setMethod] = useState("qr");
  const [elapsed, setElapsed] = useState(24120);
  useEffect(() => { const id = setInterval(() => setElapsed(s => s + 1), 1000); return () => clearInterval(id); }, []);
  const fmt = s => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;

  const menus = [
    { icon: ic.clip, bg: C.b50, c: C.b6, label: "Harian", page: "laporan" },
    { icon: ic.users, bg: C.t50, c: C.t6, label: "Patroli", page: "patroli" },
    { icon: ic.monitor, bg: C.p50, c: C.p6, label: "Pengarahan", page: "pengarahan" },
    { icon: ic.clipP, bg: C.c50, c: C.c6, label: "Pekerjaan", page: "pekerjaan" },
  ];

  const feed = [
    { icon: ic.monitor, bg: C.p50, c: C.p6, type: "Pengarahan", time: "15:52", desc: "Laporan pengarahan disubmit" },
    { icon: ic.clip, bg: C.b50, c: C.b6, type: "Laporan harian", time: "11:45", desc: "Perawatan — BSD Tech Center #26" },
    { icon: ic.login, bg: C.t50, c: C.t6, type: "Absen masuk", time: "08:24", desc: "Check-in via GPS" },
  ];

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.tx }}>Selamat pagi</div>
        <div style={{ fontSize: 13, color: C.txS, marginTop: 3 }}>Selasa, 29 April 2026</div>
      </div>

      <div style={{ background: `linear-gradient(145deg, ${C.pri} 0%, ${C.priDp} 100%)`, borderRadius: 20, padding: 20, marginBottom: 18, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Kehadiran hari ini</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, background: C.accLt, border: `1px solid ${C.accBd}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, color: C.accTx, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.acc }} /> Hadir
          </span>
        </div>
        <div style={{ display: "flex", marginBottom: 16, position: "relative", zIndex: 1 }}>
          {[{ l: "Masuk", v: "08:24", s: { fontSize: 24, fontWeight: 700, color: C.w } }, { l: "Durasi", v: fmt(elapsed), s: { fontSize: 24, fontWeight: 700, color: C.acc } }, { l: "Pulang", v: "--:--", s: { fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.18)" } }].map((t, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", position: "relative" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5, fontWeight: 600 }}>{t.l}</div>
              <div style={{ ...t.s, fontVariantNumeric: "tabular-nums" }}>{t.v}</div>
              {i < 2 && <div style={{ position: "absolute", right: 0, top: 4, bottom: 4, width: 1, background: "rgba(255,255,255,0.08)" }} />}
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 11, marginBottom: 14, position: "relative", zIndex: 1, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.accLt, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ic.pin} size={15} color={C.acc} /></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.accTx }}>Inside site</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>BSD Tech Center #18</div></div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "right", lineHeight: 1.5 }}><div>±44m</div><div>Baru saja</div></div>
        </div>
        <div onClick={() => nav("presensi")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 14, position: "relative", zIndex: 1, cursor: "pointer" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Lihat riwayat presensi</span>
          <I d={ic.chevR} size={12} color="rgba(255,255,255,0.35)" sw={2} />
        </div>
        <button style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: C.w, color: C.pri, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", position: "relative", zIndex: 1, boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
          <I d={ic.clock} size={18} color={C.pri} sw={2.2} /> Absen pulang
        </button>
        <div style={{ display: "flex", gap: 8, marginTop: 12, position: "relative", zIndex: 1 }}>
          {[{ id: "qr", icon: ic.qr, l: "QR" }, { id: "selfie", icon: ic.selfie, l: "Selfie" }, { id: "gps", icon: ic.pin, l: "GPS" }].map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 10, background: method === m.id ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)", color: method === m.id ? C.w : "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer", border: method === m.id ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent", fontWeight: method === m.id ? 600 : 400, fontFamily: "inherit" }}>
              <I d={m.icon} size={13} color="currentColor" sw={1.5} /> {m.l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={sH}>Laporan & riwayat</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          {menus.map((m, i) => (
            <div key={i} onClick={() => nav(m.page)} style={{ ...crd, marginBottom: 0, padding: "14px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={iBox(m.bg, 38)}><I d={m.icon} size={16} color={m.c} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{m.label}</div><div style={{ fontSize: 11, color: C.txT, marginTop: 1 }}>Buat & lihat</div></div>
              <I d={ic.chevR} size={14} color={C.txT} sw={2} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ ...sH, marginBottom: 0 }}>Aktivitas terbaru</div>
          <span onClick={() => nav("kegiatan")} style={{ fontSize: 12, color: C.pri, cursor: "pointer", fontWeight: 600 }}>Lihat semua →</span>
        </div>
        {feed.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: 12, ...crd, alignItems: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: f.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I d={f.icon} size={15} color={f.c} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{f.type}</span><span style={{ fontSize: 11, color: C.txT }}>{f.time}</span></div>
              <div style={{ fontSize: 12, color: C.txS }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ═══ PRESENSI ═══
function PresensiPage() {
  const [viewMode, setViewMode] = useState("list");
  const [selectedDay, setSelectedDay] = useState(null);
  const [filterMode, setFilterMode] = useState("Semua");

  // Full month data based on real screenshot
  const allDays = [
    { day: 30, dn: "Kam", masuk: "07:59", pulang: null, status: "active" },
    { day: 29, dn: "Rab", masuk: "08:24", pulang: "17:08", status: "complete" },
    { day: 28, dn: "Sel", masuk: "08:12", pulang: "17:09", status: "complete" },
    { day: 27, dn: "Sen", masuk: "07:53", pulang: "17:08", status: "complete" },
    { day: 26, dn: "Min", masuk: null, pulang: null, status: "off" },
    { day: 25, dn: "Sab", masuk: "23:58", pulang: null, status: "warn" },
    { day: 24, dn: "Jum", masuk: "14:34", pulang: null, status: "warn" },
    { day: 23, dn: "Kam", masuk: null, pulang: null, status: "empty" },
    { day: 22, dn: "Rab", masuk: null, pulang: null, status: "empty" },
    { day: 21, dn: "Sel", masuk: null, pulang: null, status: "empty" },
    { day: 20, dn: "Sen", masuk: null, pulang: null, status: "empty" },
    { day: 19, dn: "Min", masuk: null, pulang: null, status: "off" },
    { day: 18, dn: "Sab", masuk: null, pulang: null, status: "empty" },
    { day: 17, dn: "Jum", masuk: null, pulang: null, status: "empty" },
    { day: 16, dn: "Kam", masuk: null, pulang: null, status: "empty" },
    { day: 15, dn: "Rab", masuk: null, pulang: null, status: "empty" },
    { day: 14, dn: "Sel", masuk: null, pulang: null, status: "empty" },
    { day: 13, dn: "Sen", masuk: null, pulang: null, status: "empty" },
    { day: 12, dn: "Min", masuk: null, pulang: null, status: "off" },
    { day: 11, dn: "Sab", masuk: null, pulang: null, status: "empty" },
    { day: 10, dn: "Jum", masuk: null, pulang: null, status: "empty" },
    { day: 9, dn: "Kam", masuk: null, pulang: null, status: "empty" },
    { day: 8, dn: "Rab", masuk: null, pulang: null, status: "empty" },
    { day: 7, dn: "Sel", masuk: null, pulang: null, status: "empty" },
    { day: 6, dn: "Sen", masuk: null, pulang: null, status: "empty" },
    { day: 5, dn: "Min", masuk: null, pulang: null, status: "off" },
    { day: 4, dn: "Sab", masuk: null, pulang: null, status: "empty" },
    { day: 3, dn: "Jum", masuk: null, pulang: null, status: "empty" },
    { day: 2, dn: "Kam", masuk: null, pulang: null, status: "empty" },
    { day: 1, dn: "Rab", masuk: null, pulang: null, status: "empty" },
  ];

  const getDuration = (m, p) => {
    if (!m || !p) return null;
    const [mh, mm] = m.split(":").map(Number);
    const [ph, pm] = p.split(":").map(Number);
    const diff = (ph * 60 + pm) - (mh * 60 + mm);
    if (diff <= 0) return null;
    return `${Math.floor(diff / 60)}j ${diff % 60}m`;
  };

  const statusConfig = {
    active: { dot: C.b6, bg: C.b50, c: C.b8, label: "Aktif" },
    complete: { dot: C.t6, bg: C.t50, c: C.t8, label: null },
    warn: { dot: C.a6, bg: C.a50, c: C.a8, label: "Belum pulang" },
    off: { dot: C.gr4, bg: C.gr50, c: C.gr6, label: "Libur" },
    empty: { dot: C.bd, bg: C.bgS, c: C.txT, label: "Tidak ada data" },
  };

  const hadirCount = allDays.filter(d => d.masuk).length;
  const completeCount = allDays.filter(d => d.masuk && d.pulang).length;
  const warnCount = allDays.filter(d => d.status === "warn").length;
  const durations = allDays.filter(d => d.masuk && d.pulang).map(d => {
    const [mh, mm] = d.masuk.split(":").map(Number);
    const [ph, pm] = d.pulang.split(":").map(Number);
    return (ph * 60 + pm) - (mh * 60 + mm);
  });
  const avgMin = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const avgStr = avgMin > 0 ? `${Math.floor(avgMin / 60)}j ${avgMin % 60}m` : "--";

  const filtered = filterMode === "Semua" ? allDays
    : filterMode === "Hadir" ? allDays.filter(d => d.masuk)
    : filterMode === "Kosong" ? allDays.filter(d => !d.masuk && d.status !== "off")
    : allDays.filter(d => d.status === "warn");

  // Calendar grid: April 2026 starts on Wednesday (index 3)
  const startDow = 3; // 0=Mon
  const calDays = [];
  for (let i = 0; i < startDow; i++) calDays.push(null);
  for (let d = 1; d <= 30; d++) calDays.push(allDays.find(x => x.day === d));

  const calDotColor = (d) => {
    if (!d) return "transparent";
    return statusConfig[d.status]?.dot || C.bd;
  };

  const detail = selectedDay ? allDays.find(d => d.day === selectedDay) : null;

  return (
    <>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
        {[
          { l: "Total hadir", v: String(hadirCount), s: "/ 30 hari", ic: ic.login, bg: C.b50, c: C.b6 },
          { l: "Rata-rata kerja", v: avgStr, ic: ic.clock, bg: C.t50, c: C.t6 },
          { l: "Lengkap", v: String(completeCount), s: "hari", ic: ic.check, bg: C.t50, c: C.t6 },
          { l: "Belum pulang", v: String(warnCount), s: "tindak lanjut", ic: ic.alert, bg: C.a50, c: C.a6 },
        ].map((m, i) => (
          <div key={i} style={{ ...crd, marginBottom: 0, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <I d={m.ic} size={12} color={m.c} sw={2} />
              </div>
              <span style={{ fontSize: 11, color: C.txS }}>{m.l}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.c || C.tx, lineHeight: 1 }}>
              {m.v}
              {m.s && <span style={{ fontSize: 11, fontWeight: 400, color: C.txT, marginLeft: 4 }}>{m.s}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", background: C.bgS, borderRadius: 10, padding: 3, marginBottom: 14 }}>
        {[{ id: "list", label: "Daftar" }, { id: "calendar", label: "Kalender" }].map(v => (
          <button key={v.id} onClick={() => { setViewMode(v.id); setSelectedDay(null); }} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: viewMode === v.id ? C.card : "transparent",
            color: viewMode === v.id ? C.tx : C.txS,
            border: "none", cursor: "pointer", fontFamily: "inherit",
            boxShadow: viewMode === v.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>{v.label}</button>
        ))}
      </div>

      {viewMode === "calendar" ? (
        <>
          {/* Month header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.bd}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><I d={ic.back} size={14} color={C.txS} sw={2} /></div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.tx }}>April 2026</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.bd}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><I d={ic.chevR} size={14} color={C.txS} sw={2} /></div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
            {["Sen","Sel","Rab","Kam","Jum","Sab","Min"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: C.txT, padding: "4px 0", textTransform: "uppercase" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 16 }}>
            {calDays.map((d, i) => {
              if (!d) return <div key={i} />;
              const sel = selectedDay === d.day;
              const hasData = d.masuk;
              const sc = statusConfig[d.status];
              return (
                <div key={i} onClick={() => setSelectedDay(sel ? null : d.day)} style={{
                  aspectRatio: "1", borderRadius: 10, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 3,
                  background: sel ? C.pri : hasData ? sc.bg : "transparent",
                  border: sel ? "none" : d.status === "off" ? `1px dashed ${C.bd}` : hasData ? `1px solid ${sc.bg}` : `1px solid transparent`,
                  transition: "all 0.15s ease",
                }}>
                  <span style={{ fontSize: 14, fontWeight: sel || hasData ? 700 : 400, color: sel ? C.w : hasData ? sc.c : C.txT }}>{d.day}</span>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: sel ? "rgba(255,255,255,0.7)" : calDotColor(d), transition: "all 0.15s ease" }} />
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, padding: "10px 0" }}>
            {[
              { c: C.t6, l: "Lengkap" }, { c: C.b6, l: "Aktif" },
              { c: C.a6, l: "Belum pulang" }, { c: C.gr4, l: "Libur" }, { c: C.bd, l: "Kosong" },
            ].map((lg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: lg.c }} />
                <span style={{ fontSize: 11, color: C.txS }}>{lg.l}</span>
              </div>
            ))}
          </div>

          {/* Selected day detail */}
          {detail && (
            <div style={{ ...crd, overflow: "visible" }}>
              <div style={{ padding: "14px 14px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.tx }}>{detail.dn}, {detail.day} April</div>
                    <div style={{ fontSize: 12, color: C.txS, marginTop: 2 }}>
                      {detail.status === "off" ? "Hari libur" : detail.masuk ? `Durasi: ${getDuration(detail.masuk, detail.pulang) || "Berlangsung"}` : "Tidak ada presensi"}
                    </div>
                  </div>
                  <span style={pill(statusConfig[detail.status].bg, statusConfig[detail.status].c)}>
                    {statusConfig[detail.status].label || getDuration(detail.masuk, detail.pulang) || "--"}
                  </span>
                </div>
              </div>
              {detail.masuk && (
                <div style={{ padding: "0 14px 14px", display: "flex", gap: 10 }}>
                  {[{ l: "Masuk", v: detail.masuk, bg: C.t50, c: C.t6, icon: ic.login },
                    { l: "Pulang", v: detail.pulang, bg: detail.pulang ? C.b50 : C.gr50, c: detail.pulang ? C.b6 : C.gr6, icon: ic.logout }
                  ].map((t, j) => (
                    <div key={j} style={{ flex: 1, background: C.bgS, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={iBox(t.bg, 30)}><I d={t.icon} size={13} color={t.c} sw={2} /></div>
                      <div>
                        <div style={{ fontSize: 10, color: C.txT, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.l}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: t.v ? C.tx : C.txT, fontVariantNumeric: "tabular-nums" }}>{t.v || "--:--"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {detail.status === "warn" && (
                <div style={{ margin: "0 14px 14px", padding: "8px 10px", borderRadius: 8, fontSize: 11, display: "flex", alignItems: "center", gap: 6, background: C.a50, color: C.a8, fontWeight: 500, border: "1px solid #fac775" }}>
                  <I d={ic.alert} size={12} color={C.a8} /> Absen pulang tidak tercatat
                </div>
              )}
              {!detail.masuk && detail.status !== "off" && (
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ padding: "16px", borderRadius: 10, background: C.bgS, textAlign: "center" }}>
                    <I d={ic.clock} size={20} color={C.txT} sw={1.5} />
                    <div style={{ fontSize: 12, color: C.txT, marginTop: 6 }}>Tidak ada data presensi</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Filter chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["Semua", "Hadir", "Kosong", "Peringatan"].map(f => (
              <button key={f} onClick={() => setFilterMode(f)} style={fChip(filterMode === f)}>{f}</button>
            ))}
          </div>

          {/* Month header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.bd}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><I d={ic.back} size={14} color={C.txS} sw={2} /></div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.tx }}>April 2026</span>
            <div style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.bd}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><I d={ic.chevR} size={14} color={C.txS} sw={2} /></div>
          </div>

          {/* List items */}
          {filtered.map((d, i) => {
            const sc = statusConfig[d.status];
            const dur = getDuration(d.masuk, d.pulang);
            const isEmpty = !d.masuk && d.status !== "off";

            return (
              <div key={i} style={{
                ...crd,
                opacity: isEmpty ? 0.5 : 1,
                borderStyle: isEmpty ? "dashed" : "solid",
              }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", padding: isEmpty ? "10px 14px" : "12px 14px", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    background: d.status === "active" ? C.pri : d.masuk ? sc.bg : C.bgS,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1, color: d.status === "active" ? C.w : d.masuk ? sc.c : C.txT }}>{d.day}</span>
                    <span style={{ fontSize: 9, fontWeight: 500, color: d.status === "active" ? "rgba(255,255,255,0.7)" : d.masuk ? sc.c : C.txT, marginTop: 1 }}>{d.dn}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEmpty ? (
                      <span style={{ fontSize: 12, color: C.txT }}>Tidak ada data</span>
                    ) : d.status === "off" ? (
                      <span style={{ fontSize: 12, color: C.txT }}>Hari libur</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <I d={ic.login} size={11} color={C.t6} sw={2} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.tx, fontVariantNumeric: "tabular-nums" }}>{d.masuk}</span>
                        </div>
                        <span style={{ fontSize: 11, color: C.txT }}>—</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <I d={ic.logout} size={11} color={d.pulang ? C.b6 : C.txT} sw={2} />
                          <span style={{ fontSize: 13, fontWeight: d.pulang ? 600 : 400, color: d.pulang ? C.tx : C.txT, fontVariantNumeric: "tabular-nums" }}>{d.pulang || "--:--"}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {d.status === "active" && <span style={pill(sc.bg, sc.c)}>{sc.label}</span>}
                  {d.status === "complete" && dur && <span style={pill(sc.bg, sc.c)}>{dur}</span>}
                  {d.status === "warn" && <span style={pill(sc.bg, sc.c)}>{sc.label}</span>}
                  {d.status === "off" && <span style={pill(sc.bg, sc.c)}>{sc.label}</span>}
                </div>

                {/* Warning banner */}
                {d.status === "warn" && (
                  <div style={{ margin: "0 14px 10px", padding: "6px 10px", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 5, background: C.a50, color: C.a8, fontWeight: 500 }}>
                    <I d={ic.alert} size={11} color={C.a8} /> Absen pulang tidak tercatat
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <I d={ic.search} size={32} color={C.txT} sw={1.2} />
              <div style={{ fontSize: 13, color: C.txT, marginTop: 10 }}>Tidak ada data untuk filter ini</div>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ═══ LAPORAN HARIAN ═══
function LaporanPage({ nav }) {
  const [view, setView] = useState("list");
  const [fil, setFil] = useState("Semua");
  if (view === "form") return <FormLaporanKerja back={() => setView("list")} />;
  const reports = [
    { date: "29 Apr, 11:45", name: "Agenia Demo-7", type: "Perawatan", tbg: C.b50, tc: C.b8, loc: "BSD Tech Center #26", note: "testing", photos: 1 },
    { date: "28 Apr, 14:20", name: "Inspeksi panel lt.2", type: "Inspeksi", tbg: C.t50, tc: C.t8, loc: "BSD Tech Center #26", note: "Panel B2 kabel longgar", photos: 3 },
  ];
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={sBar}><I d={ic.search} size={16} color={C.txT} /><span style={{ fontSize: 13, color: C.txT }}>Cari laporan...</span></div>
        <button onClick={() => setView("form")} style={{ ...btnSubmit, flex: "none", padding: "10px 14px", borderRadius: 10, fontSize: 12, gap: 4 }}><I d={ic.plus} size={14} color={C.w} sw={2} /> Buat</button>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["Semua","Perawatan","Inspeksi"].map(f => <button key={f} onClick={() => setFil(f)} style={fChip(fil === f)}>{f}</button>)}
      </div>
      {reports.map((r, i) => (
        <div key={i} style={crd}>
          <div style={{ width: "100%", height: 120, background: C.bgS, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I d={ic.img} size={28} color={C.txT} sw={1.5} />
            <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.55)", color: C.w, fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 500 }}>{r.date}</div>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>{r.name}</div><span style={pill(r.tbg, r.tc)}>{r.type}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}><I d={ic.pin} size={13} color={C.txT} /><span style={{ fontSize: 12, color: C.txS }}>{r.loc}</span></div>
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.bd}`, fontSize: 13, color: C.tx }}>{r.note}</div>
          </div>
        </div>
      ))}
    </>
  );
}

// ═══ FORM: LAPORAN KERJA ═══
function FormLaporanKerja({ back }) {
  const [jenis, setJenis] = useState("");
  return (
    <>
      <ProgBar filled={jenis ? 1 : 0} total={5} />
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.p50)}><I d={ic.clip} size={14} color={C.p6} /></div><span style={fName}>Jenis laporan<span style={{ color: C.r6, fontSize: 11 }}>*</span></span></div>
        <select value={jenis} onChange={e => setJenis(e.target.value)} style={{ ...inputS, color: jenis ? C.tx : C.txT, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", ...(jenis && { borderColor: C.b6, background: C.b50 }) }}>
          <option value="">Pilih jenis laporan</option>
          <option>Perawatan</option><option>Inspeksi</option><option>Insiden</option>
        </select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.t50)}><I d={ic.cal} size={14} color={C.t6} /></div><span style={fName}>Periode<span style={{ color: C.r6, fontSize: 11 }}>*</span></span></div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Mulai","Sampai"].map((l, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ ...inputS, display: "flex", alignItems: "center", gap: 8, color: C.txT }}><I d={ic.cal} size={14} color={C.txT} /><span>Pilih tanggal</span></div>
              <div style={{ fontSize: 11, color: C.txT, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <LocField />
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.gr50)}><I d={ic.chat} size={14} color={C.gr6} /></div><span style={fName}>Keterangan</span></div>
        <textarea placeholder="Detail pekerjaan, kondisi, atau catatan..." style={textareaS} />
        <div style={{ fontSize: 11, color: C.txT, textAlign: "right", marginTop: 4 }}>0 / 500</div>
      </div>
      <PhotoGrid />
    </>
  );
}

// ═══ PATROLI ═══
function PatroliPage() {
  const [view, setView] = useState("list");
  if (view === "form") return <FormPatroli back={() => setView("list")} />;
  const reports = [
    { date: "27 Apr, 11:24", loc: "Banten 15336", note: "Area aman", st: "Aman" },
    { date: "26 Apr, 22:11", loc: "Jl. Cisauk Sinyal", note: "Patroli malam, area terkunci", st: "Aman" },
  ];
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ ...sBar, flex: 1, marginBottom: 0 }}><I d={ic.search} size={16} color={C.txT} /><span style={{ fontSize: 13, color: C.txT }}>Cari...</span></div>
        <button onClick={() => setView("form")} style={{ ...btnSubmit, flex: "none", padding: "10px 14px", borderRadius: 10, fontSize: 12, gap: 4 }}><I d={ic.plus} size={14} color={C.w} sw={2} /> Buat</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 16 }}>
        <div style={{ background: C.bgS, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, color: C.txS }}>Total patroli</div><div style={{ fontSize: 18, fontWeight: 600, color: C.tx }}>8</div></div>
        <div style={{ background: C.bgS, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, color: C.txS }}>Status</div><div style={{ fontSize: 18, fontWeight: 600, color: C.t6 }}>100% <span style={{ fontSize: 12, fontWeight: 400, color: C.txT }}>Aman</span></div></div>
      </div>
      {reports.map((r, i) => (
        <div key={i} style={{ ...crd, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 600, color: C.txS }}>{r.date}</span><span style={pill(C.t50, C.t8)}>{r.st}</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><I d={ic.pin} size={13} color={C.txT} /><span style={{ fontSize: 12, color: C.txS }}>{r.loc}</span></div>
          <div style={{ padding: "8px 12px", background: C.bgS, borderRadius: 8, fontSize: 13, color: C.tx }}>{r.note}</div>
        </div>
      ))}
    </>
  );
}

// ═══ FORM: PATROLI ═══
function FormPatroli() {
  const [kondisi, setKondisi] = useState("aman");
  return (
    <>
      <ProgBar filled={1} total={4} />
      <LocField />
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.p50)}><I d={ic.check} size={14} color={C.p6} /></div><span style={fName}>Kondisi lapangan<span style={{ color: C.r6, fontSize: 11 }}>*</span></span></div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "aman", icon: ic.check, bg: C.t50, c: C.t6, bc: C.t6, label: "Aman kondusif", desc: "Tidak ada temuan" },
            { id: "tindak", icon: ic.alert, bg: C.r50, c: C.r6, bc: C.r6, label: "Perlu tindak lanjut", desc: "Ada temuan" }
          ].map(k => (
            <div key={k.id} onClick={() => setKondisi(k.id)} style={{ flex: 1, padding: "14px 10px", borderRadius: 12, border: kondisi === k.id ? `2px solid ${k.bc}` : `1px solid ${C.bd}`, background: kondisi === k.id ? k.bg : C.card, cursor: "pointer", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={k.icon} size={18} color={k.c} /></div>
              <span style={{ fontSize: 12, fontWeight: 500, color: kondisi === k.id ? k.bc : C.tx }}>{k.label}</span>
              <span style={{ fontSize: 10, color: kondisi === k.id ? k.c : C.txT }}>{k.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.gr50)}><I d={ic.chat} size={14} color={C.gr6} /></div><span style={fName}>Keterangan</span></div>
        <textarea placeholder="Catatan hasil patroli..." style={textareaS} />
        <div style={{ fontSize: 12, color: C.txS, marginTop: 8, marginBottom: 6 }}>Catatan cepat:</div>
        <ChipSelect items={["Area aman", "Pintu terkunci", "CCTV normal", "Lampu menyala", "Ada kerusakan", "Perlu perbaikan"]} />
      </div>
      <PhotoGrid />
    </>
  );
}

// ═══ PENGARAHAN ═══
function PengarahanPage() {
  const [view, setView] = useState("list");
  if (view === "form") return <FormPengarahan />;
  const briefs = [
    { name: "Agenia Demo-7", time: "29 Apr, 15:52", loc: "BSD Tech Center #26", note: "test lagi", hadir: 2 },
    { name: "Agenia Demo-7", time: "28 Apr, 08:30", loc: "BSD Tech Center #26", note: "Briefing pagi, patroli shift siang", hadir: 5 },
  ];
  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ ...sBar, flex: 1, marginBottom: 0 }}><I d={ic.search} size={16} color={C.txT} /><span style={{ fontSize: 13, color: C.txT }}>Cari...</span></div>
        <button onClick={() => setView("form")} style={{ ...btnSubmit, flex: "none", padding: "10px 14px", borderRadius: 10, fontSize: 12, gap: 4 }}><I d={ic.plus} size={14} color={C.w} sw={2} /> Buat</button>
      </div>
      {briefs.map((b, i) => (
        <div key={i} style={crd}>
          <div style={{ padding: 14, display: "flex", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: i ? C.b50 : C.p50, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ic.user} size={16} color={i ? C.b6 : C.p6} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.tx }}>{b.name}</div><div style={{ fontSize: 12, color: C.txT, marginTop: 2 }}>{b.time}</div></div>
            <span style={pill(C.p50, C.p8)}>Brief</span>
          </div>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}><I d={ic.pin} size={13} color={C.txT} /><span style={{ fontSize: 12, color: C.txS }}>{b.loc}</span></div>
          <div style={{ margin: "0 14px 14px", padding: "10px 12px", background: C.bgS, borderRadius: 8, fontSize: 13, color: C.tx }}>{b.note}</div>
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.bd}`, display: "flex", alignItems: "center", gap: 6 }}>
            <I d={ic.users} size={14} color={C.txS} /><span style={{ fontSize: 12, color: C.txS, flex: 1 }}>Kehadiran</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.t6 }}>{b.hadir} orang</span>
          </div>
        </div>
      ))}
    </>
  );
}

// ═══ FORM: PENGARAHAN ═══
function FormPengarahan() {
  const [count, setCount] = useState(0);
  return (
    <>
      <ProgBar filled={0} total={4} />
      <LocField />
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.t50)}><I d={ic.users} size={14} color={C.t6} /></div><span style={fName}>Jumlah personil<span style={{ color: C.r6, fontSize: 11 }}>*</span></span></div>
        <div style={{ ...crd, marginBottom: 0, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: C.txT }}>Personil hadir</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setCount(Math.max(0, count - 1))} style={{ width: 40, height: 40, borderRadius: "50%", background: C.bgS, border: `1px solid ${C.bd}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><I d={ic.minus} size={18} color={C.txS} sw={2} /></button>
              <span style={{ fontSize: 32, fontWeight: 500, color: C.tx, minWidth: 40, textAlign: "center" }}>{count}</span>
              <button onClick={() => setCount(Math.min(99, count + 1))} style={{ width: 40, height: 40, borderRadius: "50%", background: C.pri, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><I d={ic.plus} size={18} color={C.w} sw={2} /></button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[2, 3, 5, 8, 10].map(n => (
              <button key={n} onClick={() => setCount(n)} style={{ ...fChip(count === n), padding: "6px 12px" }}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.p50)}><I d={ic.monitor} size={14} color={C.p6} /></div><span style={fName}>Topik pengarahan</span></div>
        <ChipSelect items={[{ label: "Pembagian area", bg: C.p50, c: C.p8, bc: C.p6 }, { label: "Patroli shift", bg: C.p50, c: C.p8, bc: C.p6 }, { label: "Cek CCTV", bg: C.p50, c: C.p8, bc: C.p6 }, { label: "SOP darurat", bg: C.p50, c: C.p8, bc: C.p6 }, { label: "Evaluasi", bg: C.p50, c: C.p8, bc: C.p6 }, { label: "Lainnya", bg: C.p50, c: C.p8, bc: C.p6 }]} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={fLabel}><div style={fIcon(C.gr50)}><I d={ic.chat} size={14} color={C.gr6} /></div><span style={fName}>Keterangan</span></div>
        <textarea placeholder="Detail pengarahan, instruksi khusus..." style={textareaS} />
      </div>
      <PhotoGrid />
    </>
  );
}

// ═══ KEGIATAN ═══
function KegiatanPage() {
  const [fil, setFil] = useState("Semua");
  const groups = [
    { label: "Hari ini — 29 April", items: [
      { icon: ic.monitor, bg: C.p50, c: C.p6, type: "Pengarahan", time: "15:52", desc: "Laporan disubmit", ok: true },
      { icon: ic.clip, bg: C.b50, c: C.b6, type: "Laporan harian", time: "11:45", desc: "Perawatan", ok: true },
      { icon: ic.login, bg: C.t50, c: C.t6, type: "Absen masuk", time: "08:24", desc: "Check-in GPS", ok: true },
    ]},
    { label: "Selasa — 28 April", items: [
      { icon: ic.logout, bg: C.b50, c: C.b6, type: "Absen pulang", time: "17:09", desc: "8j 57m", ok: true },
      { icon: ic.login, bg: C.t50, c: C.t6, type: "Absen masuk", time: "08:12", desc: "Check-in QR", ok: true },
    ]},
  ];
  return (
    <>
      <div style={sBar}><I d={ic.search} size={16} color={C.txT} /><span style={{ fontSize: 13, color: C.txT }}>Cari kegiatan...</span></div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["Semua","Absensi","Laporan","Briefing"].map(f => <button key={f} onClick={() => setFil(f)} style={fChip(fil === f)}>{f}</button>)}
      </div>
      {groups.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.txS, marginBottom: 8 }}>{g.label}</div>
          <div style={{ position: "relative", paddingLeft: 24 }}>
            <div style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 1.5, background: C.bd }} />
            {g.items.map((it, ii) => (
              <div key={ii} style={{ position: "relative", marginBottom: 10 }}>
                <div style={{ position: "absolute", left: -24, top: 12, width: 16, height: 16, borderRadius: "50%", background: it.bg, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}><I d={it.icon} size={9} color={it.c} sw={2.5} /></div>
                <div style={{ ...crd, marginBottom: 0, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{it.type}</span><span style={{ fontSize: 11, color: C.txT }}>{it.time}</span></div>
                  <div style={{ fontSize: 12, color: C.txS }}>{it.desc}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: it.ok ? C.t50 : C.a50, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={it.ok ? ic.tick : ic.alert} size={9} color={it.ok ? C.t6 : C.a6} sw={3} /></div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: it.ok ? C.t6 : C.a6 }}>{it.ok ? "Tersinkronisasi" : "Perlu review"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ═══ PEKERJAAN ═══
function PekerjaanPage() {
  const [fil, setFil] = useState("Semua");
  const [openCmt, setOpenCmt] = useState(0);
  const reports = [
    { name: "Agenia Demo-7", time: "27 Apr, 11:24", st: "Direview", sbg: C.t50, sc: C.t8,
      fields: [{ l: "Lokasi", v: null }, { l: "Site", v: "Product Group" }, { l: "Kondisi", v: null }, { l: "Keterangan", v: null }],
      comments: [
        { av: "BP", name: "Budi Pratama", role: "Supervisor", boss: true, time: "14:30", text: "Laporan belum lengkap, isi kondisi & keterangan." },
        { av: "AD", name: "Agenia Demo-7", role: "Staff", boss: false, time: "15:10", text: "Siap pak, perlu foto sebelum sesudah?", indent: true },
        { av: "BP", name: "Budi Pratama", role: "Supervisor", boss: true, time: "15:25", text: "Ya, dengan timestamp.", indent: true },
      ]
    },
    { name: "Agenia Demo-7", time: "26 Apr, 22:11", st: "Pending", sbg: C.a50, sc: C.a8,
      fields: [{ l: "Lokasi", v: null }, { l: "Site", v: "Product Group" }, { l: "Kondisi", v: null }, { l: "Keterangan", v: null }],
      comments: []
    },
  ];
  const fIcons = [{ d: ic.pin, bg: C.t50, c: C.t6 }, { d: ic.users, bg: C.a50, c: C.a6 }, { d: ic.check, bg: C.p50, c: C.p6 }, { d: ic.chat, bg: C.gr50, c: C.gr6 }];
  return (
    <>
      <div style={sBar}><I d={ic.search} size={16} color={C.txT} /><span style={{ fontSize: 13, color: C.txT }}>Cari laporan...</span></div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {["Semua","Dikomentari","Pending"].map(f => <button key={f} onClick={() => setFil(f)} style={fChip(fil === f)}>{f}</button>)}
      </div>
      {reports.map((r, i) => (
        <div key={i} style={crd}>
          <div style={{ padding: 14, display: "flex", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.t50, display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ic.user} size={16} color={C.t6} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{r.name}</div><div style={{ fontSize: 11, color: C.txT, marginTop: 1 }}>{r.time}</div></div>
            <span style={pill(r.sbg, r.sc)}>{r.st}</span>
          </div>
          <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {r.fields.map((f, j) => (
              <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={iBox(fIcons[j].bg, 28)}><I d={fIcons[j].d} size={13} color={fIcons[j].c} /></div>
                <div><div style={{ fontSize: 11, color: C.txT }}>{f.l}</div><div style={{ fontSize: 13, color: f.v ? C.tx : C.txT, fontStyle: f.v ? "normal" : "italic", marginTop: 1 }}>{f.v || "Belum diisi"}</div></div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${C.bd}` }}>
            <div onClick={() => setOpenCmt(openCmt === i ? -1 : i)} style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <I d={ic.chat} size={14} color={C.txS} /><span style={{ fontSize: 12, color: C.txS, fontWeight: 600, flex: 1 }}>Komentar</span>
              <span style={pill(C.b50, C.b8)}>{r.comments.length}</span>
              <I d={ic.chevD} size={14} color={C.txT} sw={2} />
            </div>
            {openCmt === i && (
              <div style={{ padding: "0 14px 12px" }}>
                {r.comments.map((c, ci) => (
                  <div key={ci} style={{ marginBottom: 10, marginLeft: c.indent ? 20 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: c.boss ? C.c50 : C.b50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: c.boss ? C.c6 : C.b6 }}>{c.av}</div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.tx }}>{c.name}</span>
                      <span style={{ ...pill(c.boss ? C.c50 : C.b50, c.boss ? C.c8 : C.b8), fontSize: 10, padding: "1px 6px" }}>{c.role}</span>
                      <span style={{ fontSize: 10, color: C.txT, marginLeft: "auto" }}>{c.time}</span>
                    </div>
                    <div style={{ marginLeft: 30, padding: "8px 12px", borderRadius: "0 10px 10px 10px", fontSize: 13, color: C.tx, lineHeight: 1.5, background: c.boss ? C.c50 : C.b50 }}>{c.text}</div>
                    <div style={{ marginLeft: 30, marginTop: 4 }}><span style={{ fontSize: 11, color: C.txT, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}><I d={ic.reply} size={11} color={C.txT} /> Balas</span></div>
                  </div>
                ))}
                {r.comments.length === 0 && <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: C.txT }}>Belum ada komentar</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <input placeholder="Tulis komentar..." style={{ ...inputS, fontSize: 12, padding: "9px 12px" }} />
                  <button style={{ width: 34, height: 34, borderRadius: "50%", background: C.pri, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", flexShrink: 0 }}><I d={ic.send} size={14} color={C.w} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ═══ VTL DASHBOARD PAGE ═══
function VtlPage() {
  const stats = [
    { l: "Total personil", v: "24", bg: C.b50, c: C.b6 },
    { l: "Hadir hari ini", v: "21", bg: C.t50, c: C.t6 },
    { l: "Laporan masuk", v: "18", bg: C.p50, c: C.p6 },
    { l: "Insiden", v: "0", bg: C.t50, c: C.t6 },
  ];
  const sites = [
    { name: "BSD Tech Center #18", status: "Aktif", count: 8, bg: C.t50, c: C.t8 },
    { name: "BSD Tech Center #26", status: "Aktif", count: 6, bg: C.t50, c: C.t8 },
    { name: "Cisauk Office Park", status: "Shift malam", count: 4, bg: C.a50, c: C.a8 },
    { name: "Serpong Garden", status: "Standby", count: 3, bg: C.b50, c: C.b8 },
  ];
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.tx }}>Dashboard VTL</div>
        <div style={{ fontSize: 13, color: C.txS, marginTop: 3 }}>Ringkasan operasional hari ini</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginBottom: 18 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ ...crd, marginBottom: 0, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={iBox(s.bg, 38)}><span style={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</span></div>
            <div style={{ fontSize: 12, color: C.txS, lineHeight: 1.4 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={sH}>Site aktif</div>
      {sites.map((s, i) => (
        <div key={i} style={{ ...crd, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={iBox(C.b50, 36)}><I d={ic.pin} size={15} color={C.b6} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{s.name}</div>
            <div style={{ fontSize: 11, color: C.txT, marginTop: 2 }}>{s.count} personil</div>
          </div>
          <span style={pill(s.bg, s.c)}>{s.status}</span>
        </div>
      ))}
    </>
  );
}

// ═══ INFO PAGE ═══
function InfoPage() {
  const announcements = [
    { title: "Jadwal shift Mei 2026", date: "28 Apr", urgent: true, desc: "Jadwal shift bulan Mei sudah tersedia. Segera cek dan konfirmasi." },
    { title: "Update SOP kebakaran", date: "25 Apr", urgent: false, desc: "SOP penanganan kebakaran telah diperbarui. Wajib dibaca semua personil." },
    { title: "Libur nasional 1 Mei", date: "22 Apr", urgent: false, desc: "Operasional tetap berjalan dengan shift minimal." },
  ];
  const contacts = [
    { name: "Budi Pratama", role: "Supervisor", phone: "0812-xxxx-xxxx" },
    { name: "HQ Operations", role: "Kantor pusat", phone: "021-xxxx-xxxx" },
  ];
  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.tx }}>Info & Pengumuman</div>
        <div style={{ fontSize: 13, color: C.txS, marginTop: 3 }}>PT Vertika Tekno Lokacipta</div>
      </div>
      <div style={sH}>Pengumuman</div>
      {announcements.map((a, i) => (
        <div key={i} style={crd}>
          <div style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.tx, flex: 1, marginRight: 8 }}>{a.title}</div>
              {a.urgent && <span style={pill(C.r50, C.r8)}>Penting</span>}
            </div>
            <div style={{ fontSize: 12, color: C.txS, marginBottom: 6 }}>{a.date}</div>
            <div style={{ fontSize: 13, color: C.tx, lineHeight: 1.5 }}>{a.desc}</div>
          </div>
        </div>
      ))}
      <div style={{ ...sH, marginTop: 8 }}>Kontak darurat</div>
      {contacts.map((c, i) => (
        <div key={i} style={{ ...crd, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.b50, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: C.b6 }}>{c.name.split(" ").map(w => w[0]).join("")}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{c.name}</div>
            <div style={{ fontSize: 11, color: C.txT }}>{c.role}</div>
          </div>
          <div style={{ fontSize: 12, color: C.pri, fontWeight: 500 }}>{c.phone}</div>
        </div>
      ))}
    </>
  );
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [activeApp, setActiveApp] = useState("autsorz");
  const [navId, setNavId] = useState("beranda");
  const nav = useCallback((p) => setPage(p), []);
  const goHome = useCallback(() => { setPage("home"); setNavId("beranda"); }, []);

  const handleAppSwitch = useCallback((appId) => {
    setActiveApp(appId);
    if (appId === "autsorz") { setPage("home"); setNavId("beranda"); }
    else if (appId === "vtl") { setPage("vtl"); setNavId(""); }
    else if (appId === "info") { setPage("info"); setNavId(""); }
  }, []);

  const titles = {
    home: null, presensi: "Log presensi", laporan: "Laporan harian",
    pengarahan: "Pengarahan", kegiatan: "Riwayat kegiatan",
    patroli: "Laporan patroli", pekerjaan: "Laporan pekerjaan",
    vtl: "VTL Dashboard", info: "Info",
  };

  const isSubPage = !["home", "vtl", "info"].includes(page);

  const navItems = [
    { id: "beranda", icon: ic.home, label: "Beranda" },
    { id: "pesan", icon: ic.chat, label: "Pesan" },
    { id: "tim", icon: ic.users, label: "Tim" },
    { id: "profil", icon: ic.user, label: "Profil" },
  ];

  return (
    <div style={{ width: 390, margin: "0 auto", background: C.bg, borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", height: 844, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", boxShadow: "0 25px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08)" }}>
      {/* Status bar */}
      <div style={{ background: C.pri, padding: "10px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontWeight: 600, color: C.w, flexShrink: 0 }}>
        <span>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white"><rect x="0" y="7" width="3" height="5" rx=".5" opacity=".4"/><rect x="4.5" y="5" width="3" height="7" rx=".5" opacity=".6"/><rect x="9" y="2" width="3" height="10" rx=".5" opacity=".8"/><rect x="13" y="0" width="3" height="12" rx=".5"/></svg>
          <svg width="20" height="12" viewBox="0 0 20 12" fill="none" stroke="white" strokeWidth="1.2"><rect x=".5" y="1" width="17" height="10" rx="2"/><rect x="18.5" y="4" width="1.5" height="4" rx=".5" fill="white"/><rect x="2" y="3" width="10" height="6" rx="1" fill="#5dcaa5"/></svg>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.pri} 0%, ${C.priDk} 100%)`, padding: "12px 18px 14px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {isSubPage && <div onClick={goHome} style={{ cursor: "pointer" }}><I d={ic.back} size={18} color="white" sw={2.2} /></div>}
        <span style={{ color: C.w, fontSize: 16, fontWeight: 600, flex: 1 }}>{titles[page] || "Vertika Tekno Lokacipta"}</span>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.acc, boxShadow: `0 0 8px ${C.acc}` }} />
        <I d={ic.refresh} size={16} color="rgba(255,255,255,0.7)" sw={2} />
      </div>

      {/* App Switcher — only on main pages */}
      {!isSubPage && <AppSwitcher activeApp={activeApp} onSwitch={handleAppSwitch} />}

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", WebkitOverflowScrolling: "touch" }}>
        {page === "home" && <HomePage nav={nav} />}
        {page === "presensi" && <PresensiPage />}
        {page === "laporan" && <LaporanPage nav={nav} />}
        {page === "pengarahan" && <PengarahanPage />}
        {page === "kegiatan" && <KegiatanPage />}
        {page === "patroli" && <PatroliPage />}
        {page === "pekerjaan" && <PekerjaanPage />}
        {page === "vtl" && <VtlPage />}
        {page === "info" && <InfoPage />}
      </div>

      {/* Bottom nav */}
      <nav style={{ flexShrink: 0, background: C.card, borderTop: `1px solid ${C.bd}`, display: "flex", padding: "6px 0 14px" }}>
        {navItems.map(n => {
          const on = (n.id === "beranda" && page === "home") || navId === n.id;
          return (
            <div key={n.id} onClick={() => { setNavId(n.id); if (n.id === "beranda") { setActiveApp("autsorz"); goHome(); } }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", padding: "8px 0 0", position: "relative" }}>
              {on && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 24, height: 3, borderRadius: "0 0 3px 3px", background: C.pri }} />}
              <I d={n.icon} size={21} color={on ? C.pri : C.txT} sw={on ? 2.2 : 1.8} />
              <span style={{ fontSize: 11, color: on ? C.pri : C.txT, fontWeight: on ? 600 : 500 }}>{n.label}</span>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
