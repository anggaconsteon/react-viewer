import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTEON — OWNER RUNTIME · DESKTOP OPERATIONAL VISIBILITY
// ═══════════════════════════════════════════════════════════════════════════
// Identity: Operational Visibility Layer — read-only, no actions.
// Mental model: "What is the operational condition of my business?"
// Doctrine: operational visualization (proportions, distributions, aging)
//           — NOT analytics, NOT charts, NOT financial reporting.
// Bucket scope: A (Operational Health) + B (Asset Lifecycle) +
//               C (Customer Visibility) + D (Maintenance & Disposal)
// ═══════════════════════════════════════════════════════════════════════════

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    * { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    @keyframes pulse-soft { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
    .pulse-soft { animation: pulse-soft 2.4s ease-in-out infinite; }
    @keyframes slide-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .slide-up { animation: slide-up 0.25s ease-out forwards; }
    .scroll-thin::-webkit-scrollbar { width: 6px; }
    .scroll-thin::-webkit-scrollbar-track { background: transparent; }
    .scroll-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
    .scroll-thin::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    .clickable:hover { background: #fafbfc; }
  `}</style>
);

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
const C = {
  bg:        "#f5f6f8",
  surface:   "#ffffff",
  surfaceAlt:"#fafbfc",
  border:    "#e8eaed",
  borderStrong: "#d4d7dc",
  
  text:      "#0f172a",
  textMid:   "#475569",
  textDim:   "#94a3b8",
  
  // Amber = max operational urgency
  amber50:   "#fffbeb",
  amber100:  "#fef3c7",
  amber400:  "#f59e0b",
  amber500:  "#d97706",
  amber700:  "#b45309",
  
  // Owner accent — slate (neutral, executive, observational)
  ownerAccent:   "#475569",
  ownerAccentBg: "#f1f5f9",
  
  // State-specific colors (proportional, not alarming)
  inWarehouse:   "#10b981",  // emerald — stable, available
  onVehicle:     "#3b82f6",  // blue — active circulation
  atCustomer:    "#8b5cf6",  // violet — outstanding (operational)
  investigating: "#f59e0b",  // amber — needs attention
  damaged:       "#f97316",  // orange — operational concern
  maintenance:   "#0891b2",  // cyan — temporarily out
  lost:          "#64748b",  // slate — confirmed
  retired:       "#94a3b8",  // gray — lifecycle end
  
  emerald50:  "#ecfdf5",
  emerald500: "#10b981",
  emerald700: "#047857",
  
  red50:     "#fef2f2",
  red500:    "#ef4444",
  
  slate50:   "#f8fafc",
  slate100:  "#f1f5f9",
  slate200:  "#e2e8f0",
  slate400:  "#94a3b8",
  slate600:  "#475569",
  slate700:  "#334155",
};

// ─── MOCK DATA ─────────────────────────────────────────────────────────────

// Bucket A — Operational Health (real-time snapshot)
const HEALTH = {
  activeVehicles: 8,
  totalVehicles:  12,
  executingDrivers: 6,
  idleDrivers: 3,
  openDiscrepancies: 4,
  stalledTasks: 2,
  pendingEscalations: 1,
};

// Bucket B — Asset Lifecycle Distribution (per item type)
const ASSET_DISTRIBUTION = {
  "Gas 12kg": {
    total: 2400,
    states: {
      in_warehouse:  840,
      on_vehicle:    280,
      at_customer:   1180,
      investigating: 12,
      damaged:       45,
      maintenance:   28,
      lost:          11,
      retired:       4,
    },
  },
  "Gas 3kg": {
    total: 1800,
    states: {
      in_warehouse:  620,
      on_vehicle:    190,
      at_customer:   920,
      investigating: 8,
      damaged:       32,
      maintenance:   18,
      lost:          7,
      retired:       5,
    },
  },
  "Aqua Galon": {
    total: 3200,
    states: {
      in_warehouse:  1100,
      on_vehicle:    340,
      at_customer:   1680,
      investigating: 5,
      damaged:       38,
      maintenance:   22,
      lost:          12,
      retired:       3,
    },
  },
  "Pristine Galon": {
    total: 1100,
    states: {
      in_warehouse:  380,
      on_vehicle:    120,
      at_customer:   570,
      investigating: 3,
      damaged:       18,
      maintenance:   6,
      lost:          2,
      retired:       1,
    },
  },
};

// Outstanding aging — kombinasi semua item
const OUTSTANDING_AGING = {
  "0-7 hari":   2840,
  "8-30 hari":  1180,
  "31-60 hari": 240,
  "> 60 hari":  90,
};

// Investigating aging (operational pressure)
const INVESTIGATING_AGING = [
  { label: "< 24 jam",  count: 6,  variant: "neutral" },
  { label: "1-3 hari",  count: 12, variant: "neutral" },
  { label: "4-7 hari",  count: 7,  variant: "warning" },
  { label: "> 7 hari",  count: 3,  variant: "critical" },
];

// Bucket C — Customer Visibility
const TOP_CUSTOMERS_OUTSTANDING = [
  { name: "Honda Tebet",      outstanding: 142, oldestDays: 47, discrepancyCount: 3 },
  { name: "BCA Sudirman",     outstanding: 118, oldestDays: 32, discrepancyCount: 1 },
  { name: "Mandiri Pusat",    outstanding: 96,  oldestDays: 28, discrepancyCount: 0 },
  { name: "Honda Cipete",     outstanding: 84,  oldestDays: 21, discrepancyCount: 2 },
  { name: "Honda Tangerang",  outstanding: 76,  oldestDays: 14, discrepancyCount: 0 },
  { name: "BCA Cabang Bintaro",outstanding: 62, oldestDays: 11, discrepancyCount: 1 },
  { name: "Mandiri Tower",    outstanding: 54,  oldestDays: 9,  discrepancyCount: 0 },
];

const CUSTOMERS_LONGEST_OUTSTANDING = [
  { name: "Toko Ahmad",       asset: "Gas 12kg",   qty: 8,  days: 87 },
  { name: "Warung Pak Slamet", asset: "Aqua Galon", qty: 4,  days: 72 },
  { name: "Honda Tebet",      asset: "Gas 12kg",   qty: 12, days: 47 },
  { name: "Restoran Bintang", asset: "Gas 3kg",    qty: 6,  days: 41 },
];

// Bucket D — Maintenance & Disposal (read-only)
const MAINTENANCE_SUMMARY = {
  inMaintenance: 74,  // total semua item
  retiredThisYear: 13,
  damagedAwaitingDisposition: 133,
};

// ─── ATOMS ─────────────────────────────────────────────────────────────────
const Chip = ({ children, variant = "neutral", size = "sm" }) => {
  const variants = {
    neutral: { bg: C.slate100,   fg: C.slate700 },
    amber:   { bg: C.amber100,   fg: C.amber700 },
    emerald: { bg: C.emerald50,  fg: C.emerald700 },
    slate:   { bg: C.slate100,   fg: C.slate600 },
    warning: { bg: C.amber50,    fg: C.amber700 },
    critical:{ bg: "#fee2e2",    fg: "#b91c1c" },
  };
  const v = variants[variant];
  const pad = size === "sm" ? "2px 8px" : "4px 10px";
  const fs = size === "sm" ? 11 : 12;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: pad, borderRadius: 4,
      background: v.bg, color: v.fg,
      fontSize: fs, fontWeight: 500,
      textTransform: "uppercase", letterSpacing: "0.04em",
      whiteSpace: "nowrap",
    }}>{children}</span>
  );
};

// State color label
const STATE_META = {
  in_warehouse:  { color: C.inWarehouse,   label: "In Warehouse" },
  on_vehicle:    { color: C.onVehicle,     label: "On Vehicle" },
  at_customer:   { color: C.atCustomer,    label: "At Customer" },
  investigating: { color: C.investigating, label: "Investigating" },
  damaged:       { color: C.damaged,       label: "Damaged" },
  maintenance:   { color: C.maintenance,   label: "Maintenance" },
  lost:          { color: C.lost,          label: "Lost" },
  retired:       { color: C.retired,       label: "Retired" },
};

// ─── SECTION HEADER ────────────────────────────────────────────────────────
const SectionHeader = ({ title, subtitle, action }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
    <div>
      <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>
        {subtitle}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>
        {title}
      </div>
    </div>
    {action}
  </div>
);

// ─── OPERATIONAL HEALTH SUMMARY CHIP ───────────────────────────────────────
const HealthChip = ({ label, value, total, variant = "neutral", icon }) => {
  const variants = {
    neutral: { fg: C.text,      accent: C.slate400 },
    amber:   { fg: C.amber700,  accent: C.amber400 },
    emerald: { fg: C.emerald700,accent: C.emerald500 },
  };
  const v = variants[variant];
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${v.accent}`,
      borderRadius: 6,
      padding: "14px 16px",
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 600, color: v.fg, lineHeight: 1 }}>
          {value}
        </span>
        {total !== undefined && (
          <span style={{ fontSize: 13, color: C.textDim, fontWeight: 400 }}>
            / {total}
          </span>
        )}
      </div>
    </div>
  );
};

// ─── ASSET DISTRIBUTION BAR (proportional, no axes) ────────────────────────
const AssetDistributionBar = ({ itemName, data }) => {
  const states = Object.entries(data.states);
  const total = data.total;
  
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      padding: "16px 18px",
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{itemName}</span>
          <span className="mono" style={{ fontSize: 12, color: C.textMid }}>
            {total.toLocaleString("id-ID")} pcs total
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.textMid }}>
          <span>At Customer: <strong style={{ color: STATE_META.at_customer.color }}>{data.states.at_customer}</strong></span>
          <span>Investigating: <strong style={{ color: STATE_META.investigating.color }}>{data.states.investigating}</strong></span>
          <span>Lost: <strong style={{ color: STATE_META.lost.color }}>{data.states.lost}</strong></span>
        </div>
      </div>
      
      {/* Proportional bar */}
      <div style={{ 
        display: "flex", 
        height: 18, 
        borderRadius: 4, 
        overflow: "hidden",
        background: C.slate100,
        marginBottom: 10,
      }}>
        {states.map(([key, count]) => {
          const pct = (count / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={key}
              title={`${STATE_META[key].label}: ${count} (${pct.toFixed(1)}%)`}
              style={{
                width: `${pct}%`,
                background: STATE_META[key].color,
                transition: "all 0.15s ease",
              }}
            />
          );
        })}
      </div>
      
      {/* State breakdown row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12 }}>
        {states.map(([key, count]) => {
          const meta = STATE_META[key];
          return (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: meta.color }} />
              <span style={{ color: C.textMid }}>{meta.label}</span>
              <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── AGING BAND ────────────────────────────────────────────────────────────
const AgingBand = ({ label, count, variant }) => {
  const colors = {
    neutral:  { bg: C.surface,   border: C.border,    fg: C.text,        accent: C.slate400 },
    warning:  { bg: C.amber50,   border: C.amber100,  fg: C.amber700,    accent: C.amber400 },
    critical: { bg: "#fef2f2",   border: "#fecaca",   fg: "#b91c1c",     accent: "#dc2626" },
  };
  const c = colors[variant];
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderLeft: `3px solid ${c.accent}`,
      borderRadius: 5,
      padding: "10px 14px",
      flex: 1,
    }}>
      <div style={{ fontSize: 11, color: C.textMid, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: c.fg, lineHeight: 1 }}>
        {count.toLocaleString("id-ID")}
      </div>
    </div>
  );
};

// ─── CUSTOMER ROW ──────────────────────────────────────────────────────────
const CustomerOutstandingRow = ({ customer, rank }) => {
  const isLong = customer.oldestDays > 30;
  return (
    <div className="clickable" style={{
      display: "grid",
      gridTemplateColumns: "32px 1fr auto auto auto",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderBottom: `1px solid ${C.border}`,
      cursor: "pointer",
    }}>
      <div className="mono" style={{ fontSize: 12, color: C.textDim, fontWeight: 500 }}>
        {String(rank).padStart(2, "0")}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>
          {customer.name}
        </div>
        {customer.discrepancyCount > 0 && (
          <div style={{ fontSize: 11, color: C.amber700, marginTop: 2 }}>
            {customer.discrepancyCount} discrepancy
          </div>
        )}
      </div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right" }}>
        {customer.outstanding} pcs
      </div>
      <div style={{ fontSize: 12, color: isLong ? C.amber700 : C.textMid, fontWeight: isLong ? 600 : 400, minWidth: 70, textAlign: "right" }}>
        {customer.oldestDays} hari
      </div>
      <span style={{ color: C.textDim, fontSize: 12 }}>›</span>
    </div>
  );
};

// ─── LONGEST OUTSTANDING ROW ───────────────────────────────────────────────
const LongestOutstandingRow = ({ entry }) => (
  <div className="clickable" style={{
    padding: "12px 14px",
    borderBottom: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
  }}>
    <div style={{
      width: 4,
      height: 36,
      background: C.amber400,
      borderRadius: 2,
    }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>
        {entry.name}
      </div>
      <div style={{ fontSize: 12, color: C.textMid }}>
        {entry.asset} · {entry.qty} pcs
      </div>
    </div>
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.amber700, lineHeight: 1.1 }}>
        {entry.days}
      </div>
      <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        hari
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function OwnerRuntimeDesktop() {
  const [activeSection, setActiveSection] = useState("overview");
  
  // Aggregated totals across all items
  const aggregated = Object.values(ASSET_DISTRIBUTION).reduce((acc, item) => {
    acc.total += item.total;
    Object.entries(item.states).forEach(([key, val]) => {
      acc.states[key] = (acc.states[key] || 0) + val;
    });
    return acc;
  }, { total: 0, states: {} });
  
  return (
    <>
      <FontLoader />
      <div style={{
        height: "100vh",
        width: "100vw",
        background: C.bg,
        color: C.text,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* ─── TOP BAR ───────────────────────────────────────────────── */}
        <header style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: `linear-gradient(135deg, ${C.ownerAccent}, ${C.slate700})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 13,
              }}>C</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>
                  Consteon
                </div>
                <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.2 }}>
                  Owner Runtime · Operational Visibility
                </div>
              </div>
            </div>
            <div style={{ height: 24, width: 1, background: C.border }} />
            <div style={{ fontSize: 12, color: C.textMid }}>
              <span style={{ color: C.text, fontWeight: 500 }}>Rabu, 20 Mei 2026</span>
              <span style={{ margin: "0 8px", color: C.textDim }}>·</span>
              <span className="pulse-soft" style={{ color: C.emerald500, fontSize: 10 }}>●</span>
              <span style={{ marginLeft: 5 }}>Real-time</span>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: C.textMid, fontStyle: "italic" }}>
              Read-only operational view
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: C.ownerAccentBg, color: C.ownerAccent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 600,
            }}>OW</div>
          </div>
        </header>

        {/* ─── MAIN LAYOUT ───────────────────────────────────────────── */}
        <main style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 0,
          overflow: "hidden",
        }}>
          {/* ═════════════ LEFT: Navigation ═════════════ */}
          <aside style={{
            background: C.surface,
            borderRight: `1px solid ${C.border}`,
            padding: "20px 14px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }} className="scroll-thin">
            <div>
              <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8, paddingLeft: 8 }}>
                Visibility
              </div>
              {[
                { id: "overview",    label: "Overview",            icon: "◫" },
                { id: "health",      label: "Operational Health",  icon: "◉" },
                { id: "assets",      label: "Asset Lifecycle",     icon: "◈" },
                { id: "customers",   label: "Customer Outstanding",icon: "◆" },
                { id: "maintenance", label: "Maintenance & Lost",  icon: "◇" },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 10px",
                    background: activeSection === item.id ? C.ownerAccentBg : "transparent",
                    color: activeSection === item.id ? C.ownerAccent : C.text,
                    border: "none",
                    borderRadius: 5,
                    fontSize: 13,
                    fontWeight: activeSection === item.id ? 600 : 400,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 2,
                  }}
                >
                  <span style={{ color: activeSection === item.id ? C.ownerAccent : C.textDim, width: 14 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>
            
            {/* Mandate reminder */}
            <div style={{ marginTop: "auto", padding: "12px 10px", background: C.slate50, borderRadius: 5, fontSize: 11, color: C.textMid, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 500, color: C.text, marginBottom: 4 }}>Owner Mandate</div>
              Observe operational health and asset condition. Actions live in operational runtimes — admin, supervisor, vehicle, driver.
            </div>
          </aside>

          {/* ═════════════ RIGHT: Content ═════════════ */}
          <section style={{
            overflowY: "auto",
            padding: "24px 32px 40px",
          }} className="scroll-thin">
            
            {/* ──────── OVERVIEW (default landing) ──────── */}
            {activeSection === "overview" && (
              <div className="slide-up">
                <SectionHeader
                  subtitle="Bucket A · Operational Health"
                  title="Kondisi Operasional Hari Ini"
                />
                
                {/* Health summary chips */}
                <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                  <HealthChip label="Active Vehicles" value={HEALTH.activeVehicles} total={HEALTH.totalVehicles} />
                  <HealthChip label="Drivers Executing" value={HEALTH.executingDrivers} total={HEALTH.executingDrivers + HEALTH.idleDrivers} />
                  <HealthChip label="Open Discrepancies" value={HEALTH.openDiscrepancies} variant="amber" />
                  <HealthChip label="Stalled Tasks" value={HEALTH.stalledTasks} variant="amber" />
                  <HealthChip label="Pending Escalations" value={HEALTH.pendingEscalations} variant="amber" />
                </div>
                
                {/* Investigating aging — operational pressure */}
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader
                    subtitle="Bucket A · Investigation Pressure"
                    title="Aging Investigasi Terbuka"
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    {INVESTIGATING_AGING.map(band => (
                      <AgingBand key={band.label} label={band.label} count={band.count} variant={band.variant} />
                    ))}
                  </div>
                </div>
                
                {/* Asset distribution summary */}
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader
                    subtitle="Bucket B · Asset Lifecycle"
                    title="Distribusi Asset · Semua Item"
                    action={
                      <button
                        onClick={() => setActiveSection("assets")}
                        style={{ background: "none", border: "none", color: C.ownerAccent, fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                      >
                        Detail per item →
                      </button>
                    }
                  />
                  <AssetDistributionBar itemName="Total · Semua Item" data={aggregated} />
                </div>
                
                {/* Outstanding aging */}
                <div style={{ marginBottom: 28 }}>
                  <SectionHeader
                    subtitle="Bucket B · Outstanding Aging"
                    title="Asset di Customer · Berdasarkan Lama"
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    {Object.entries(OUTSTANDING_AGING).map(([label, count], i) => {
                      const variant = i === 0 ? "neutral" : i === 1 ? "neutral" : i === 2 ? "warning" : "critical";
                      return <AgingBand key={label} label={label} count={count} variant={variant} />;
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* ──────── ASSETS (Bucket B detail) ──────── */}
            {activeSection === "assets" && (
              <div className="slide-up">
                <SectionHeader
                  subtitle="Bucket B · Asset Lifecycle"
                  title="Distribusi Asset Per Item"
                />
                
                {Object.entries(ASSET_DISTRIBUTION).map(([name, data]) => (
                  <AssetDistributionBar key={name} itemName={name} data={data} />
                ))}
                
                <div style={{ marginTop: 28 }}>
                  <SectionHeader
                    subtitle="Bucket B · Outstanding Aging"
                    title="Distribusi Outstanding · Berdasarkan Lama"
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    {Object.entries(OUTSTANDING_AGING).map(([label, count], i) => {
                      const variant = i === 0 ? "neutral" : i === 1 ? "neutral" : i === 2 ? "warning" : "critical";
                      return <AgingBand key={label} label={label} count={count} variant={variant} />;
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* ──────── HEALTH (Bucket A detail) ──────── */}
            {activeSection === "health" && (
              <div className="slide-up">
                <SectionHeader
                  subtitle="Bucket A · Operational Health"
                  title="Kondisi Operasional Real-Time"
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
                  <HealthChip label="Active Vehicles" value={HEALTH.activeVehicles} total={HEALTH.totalVehicles} />
                  <HealthChip label="Drivers Executing" value={HEALTH.executingDrivers} total={HEALTH.executingDrivers + HEALTH.idleDrivers} />
                  <HealthChip label="Idle Drivers" value={HEALTH.idleDrivers} />
                  <HealthChip label="Open Discrepancies" value={HEALTH.openDiscrepancies} variant="amber" />
                  <HealthChip label="Stalled Tasks" value={HEALTH.stalledTasks} variant="amber" />
                  <HealthChip label="Pending Escalations" value={HEALTH.pendingEscalations} variant="amber" />
                </div>
                
                <SectionHeader
                  subtitle="Bucket A · Investigation Pressure"
                  title="Aging Investigasi Terbuka"
                />
                <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                  {INVESTIGATING_AGING.map(band => (
                    <AgingBand key={band.label} label={band.label} count={band.count} variant={band.variant} />
                  ))}
                </div>
                
                <div style={{
                  background: C.amber50,
                  border: `1px solid ${C.amber100}`,
                  borderLeft: `3px solid ${C.amber400}`,
                  borderRadius: 6,
                  padding: "14px 18px",
                  fontSize: 13,
                  color: C.amber700,
                  lineHeight: 1.6,
                }}>
                  <strong>3 investigasi</strong> sudah terbuka lebih dari 7 hari. Supervisor workload mungkin perlu diperhatikan. Detail investigasi tersedia di Supervisor Runtime.
                </div>
              </div>
            )}
            
            {/* ──────── CUSTOMERS (Bucket C) ──────── */}
            {activeSection === "customers" && (
              <div className="slide-up">
                <SectionHeader
                  subtitle="Bucket C · Customer Visibility"
                  title="Top Customer berdasarkan Outstanding"
                />
                
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  marginBottom: 28,
                  overflow: "hidden",
                }}>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr auto auto auto",
                    gap: 12,
                    padding: "10px 14px",
                    background: C.surfaceAlt,
                    borderBottom: `1px solid ${C.border}`,
                    fontSize: 11,
                    color: C.textDim,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}>
                    <div>#</div>
                    <div>Customer</div>
                    <div style={{ textAlign: "right" }}>Outstanding</div>
                    <div style={{ textAlign: "right", minWidth: 70 }}>Tertua</div>
                    <div />
                  </div>
                  {TOP_CUSTOMERS_OUTSTANDING.map((c, i) => (
                    <CustomerOutstandingRow key={c.name} customer={c} rank={i + 1} />
                  ))}
                </div>
                
                <SectionHeader
                  subtitle="Bucket C · Operational Risk"
                  title="Asset Paling Lama Outstanding"
                />
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  overflow: "hidden",
                }}>
                  {CUSTOMERS_LONGEST_OUTSTANDING.map((entry, i) => (
                    <LongestOutstandingRow key={i} entry={entry} />
                  ))}
                </div>
              </div>
            )}
            
            {/* ──────── MAINTENANCE & LOST (Bucket D) ──────── */}
            {activeSection === "maintenance" && (
              <div className="slide-up">
                <SectionHeader
                  subtitle="Bucket D · Maintenance & Disposal"
                  title="Asset di Luar Sirkulasi"
                />
                
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr 1fr", 
                  gap: 10, 
                  marginBottom: 28 
                }}>
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${C.maintenance}`,
                    borderRadius: 6,
                    padding: "16px 18px",
                  }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 8 }}>
                      In Maintenance
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: C.text, lineHeight: 1 }}>
                      {MAINTENANCE_SUMMARY.inMaintenance}
                    </div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, fontStyle: "italic" }}>
                      Tidak di-handle di platform · external lifecycle
                    </div>
                  </div>
                  
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${C.damaged}`,
                    borderRadius: 6,
                    padding: "16px 18px",
                  }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 8 }}>
                      Damaged · Awaiting
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: C.text, lineHeight: 1 }}>
                      {MAINTENANCE_SUMMARY.damagedAwaitingDisposition}
                    </div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>
                      Menunggu keputusan supervisor
                    </div>
                  </div>
                  
                  <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${C.retired}`,
                    borderRadius: 6,
                    padding: "16px 18px",
                  }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500, marginBottom: 8 }}>
                      Retired YTD
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 600, color: C.text, lineHeight: 1 }}>
                      {MAINTENANCE_SUMMARY.retiredThisYear}
                    </div>
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>
                      Sepanjang 2026
                    </div>
                  </div>
                </div>
                
                {/* Lost summary */}
                <SectionHeader
                  subtitle="Bucket D · Lost Confirmed"
                  title="Asset Hilang per Item"
                />
                <div style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  overflow: "hidden",
                }}>
                  {Object.entries(ASSET_DISTRIBUTION).map(([name, data]) => (
                    <div key={name} className="clickable" style={{
                      padding: "12px 16px",
                      borderBottom: `1px solid ${C.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.lost }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span className="mono" style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                          {data.states.lost}
                        </span>
                        <span style={{ fontSize: 12, color: C.textDim }}>
                          / {data.total.toLocaleString("id-ID")}
                        </span>
                        <span style={{ fontSize: 11, color: C.textDim, marginLeft: 6 }}>
                          ({((data.states.lost / data.total) * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  marginTop: 18,
                  fontSize: 12,
                  color: C.textDim,
                  fontStyle: "italic",
                  lineHeight: 1.6,
                }}>
                  Lost asset adalah hasil resolusi investigasi oleh supervisor. Untuk detail per kasus, buka Supervisor Runtime.
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
