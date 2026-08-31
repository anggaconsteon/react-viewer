import React, { useState } from "react";

/**
 * Consteon — Reorder Radar (Admin Runtime)
 * Increment 1: AdminHome entry card + Radar screen + Follow-up bottom sheet
 * Increment 2: Cadence editor sheet (admin override → COORDINATION.reorder_cadence_set)
 *
 * Doctrine: Reorder Signal Doctrine
 *  - Admin-owned coordination signal (NOT analytics)
 *  - status: fresh | approaching | overdue | dormant | never_ordered
 *  - cadence resolution: admin_set → learned → default (14)  (graceful degradation)
 *  - override = EVENT (COORDINATION.reorder_cadence_set), never a projection edit
 *  - followup_state: none | task_open | recently_contacted  (anti-nag)
 *  - Amber = operational urgency; never red. Emerald = aman. Silence = success.
 */

// ── Design tokens ──────────────────────────────────────────────
const T = {
  adminBlue: "#2563EB",
  adminBlueDark: "#1E40AF",
  adminBlueSoft: "#EFF4FF",
  amber: "#EF9F27",
  amberDark: "#B4740F",
  amberSoft: "#FDF3E3",
  emerald: "#10B981",
  emeraldDark: "#047857",
  emeraldSoft: "#ECFDF5",
  ink: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  line: "#E2E8F0",
  card: "#FFFFFF",
  appBg: "#F1F5F9",
  white: "#FFFFFF",
};

const FONT =
  "'Inter','DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const MONO = "'JetBrains Mono','SF Mono',Menlo,Consolas,monospace";

const DEFAULT_CADENCE = 14; // DEFAULT_CADENCE_DAYS

// ── Seed data (derived-projection shape) ───────────────────────
const SEED = [
  { id: "c1", name: "Bu Sari", type: "Warung Makan", cadence_days: 7, cadence_source: "learned", days_since: 24, followup_state: "none", gaps: [7, 6, 8, 7] },
  { id: "c2", name: "Toko Sinar", type: "Toko Kelontong", cadence_days: 7, cadence_source: "learned", days_since: 30, followup_state: "none", gaps: [8, 7, 6, 7] },
  { id: "c3", name: "Depot Pak Budi", type: "Kios Air", cadence_days: 5, cadence_source: "admin_set", days_since: 12, followup_state: "none", gaps: [6, 5, 6, 7] },
  { id: "c4", name: "Warung Bu Tini", type: "Warung", cadence_days: 14, cadence_source: "default", days_since: 16, followup_state: "none", gaps: [13] },
  { id: "c5", name: "Katering Pak Hendra", type: "Katering", cadence_days: 4, cadence_source: "admin_set", days_since: 9, followup_state: "task_open", gaps: [4, 3, 4, 5] },
];

const FRESH_COUNT = 12;

// ── Derivation helpers (per doctrine) ──────────────────────────
function learnedCadence(gaps) {
  if (!gaps || gaps.length < 2) return null;
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return Math.round(avg);
}
function computeStatus(cadence, days) {
  if (days == null) return "never_ordered";
  if (days <= cadence * 0.8) return "fresh";
  if (days <= cadence) return "approaching";
  if (days <= cadence * 3) return "overdue";
  return "dormant";
}

// derive status for seed (keeps seed honest)
SEED.forEach((c) => { c.status = computeStatus(c.cadence_days, c.days_since); });

const STATUS_META = {
  dormant: { label: "Lama menghilang", chipBg: T.amber, chipText: T.white, accent: T.amber },
  overdue: { label: "Telat order", chipBg: T.amberSoft, chipText: T.amberDark, accent: T.amber },
  approaching: { label: "Mendekati", chipBg: T.adminBlueSoft, chipText: T.adminBlueDark, accent: T.adminBlue },
  fresh: { label: "Dalam ritme", chipBg: T.emeraldSoft, chipText: T.emeraldDark, accent: T.emerald },
};
const SOURCE_META = {
  admin_set: { label: "diatur admin", color: T.adminBlueDark, bg: T.adminBlueSoft },
  learned: { label: "dari histori", color: T.emeraldDark, bg: T.emeraldSoft },
  default: { label: "default 14 hr", color: T.muted, bg: "#F1F5F9" },
};
const FOLLOWUP_META = {
  task_open: { label: "Tugas follow-up dibuka", color: T.adminBlueDark, bg: T.adminBlueSoft },
  recently_contacted: { label: "Sudah dikontak", color: T.emeraldDark, bg: T.emeraldSoft },
};

// ── Atoms ──────────────────────────────────────────────────────
function Chip({ bg, color, children, bold }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, color, fontSize: 11, fontWeight: bold ? 700 : 600, padding: "3px 8px", borderRadius: 999, lineHeight: 1.2, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}
function StatusChip({ status }) {
  const m = STATUS_META[status] || STATUS_META.overdue;
  return <Chip bg={m.chipBg} color={m.chipText} bold>{status === "dormant" ? "● " : ""}{m.label}</Chip>;
}
function CadenceBadge({ source }) {
  const m = SOURCE_META[source] || SOURCE_META.default;
  return <Chip bg={m.bg} color={m.color}>{m.label}</Chip>;
}
function MiniTimeline({ gaps, daysSince, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap", marginTop: 2 }}>
      {gaps.map((g, i) => (
        <React.Fragment key={i}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: T.line, border: `1.5px solid ${T.faint}`, flexShrink: 0 }} />
          <span style={{ fontSize: 9.5, color: T.faint, padding: "0 4px", fontWeight: 600 }}>{g}h</span>
        </React.Fragment>
      ))}
      <span style={{ width: 9, height: 9, borderRadius: 999, background: T.body, flexShrink: 0 }} />
      <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 4, borderTop: `2px dashed ${accent}`, paddingTop: 1 }}>
        <span style={{ fontSize: 10, color: accent, fontWeight: 800, marginRight: 4 }}>{daysSince}h belum order</span>
        <span style={{ width: 9, height: 9, borderRadius: 999, border: `2px solid ${accent}`, background: T.white, flexShrink: 0 }} />
      </span>
    </div>
  );
}

// ── Signal card ────────────────────────────────────────────────
function SignalCard({ c, onFollowUp, onEditCadence }) {
  const meta = STATUS_META[c.status] || STATUS_META.overdue;
  const handled = c.followup_state !== "none";
  const fu = FOLLOWUP_META[c.followup_state];
  return (
    <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${handled ? T.line : meta.accent}`, borderLeft: `4px solid ${handled ? T.faint : meta.accent}`, padding: "13px 14px", opacity: handled ? 0.72 : 1, boxShadow: handled ? "none" : "0 1px 2px rgba(15,23,42,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.25 }}>{c.name}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>{c.type}</div>
        </div>
        {handled ? <Chip bg={fu.bg} color={fu.color}>{fu.label}</Chip> : <StatusChip status={c.status} />}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: T.body }}>Biasa order tiap <b style={{ color: T.ink }}>{c.cadence_days} hari</b></span>
        <CadenceBadge source={c.cadence_source} />
        <button onClick={() => onEditCadence(c)} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "transparent", border: "none", color: T.adminBlue, fontSize: 11.5, fontWeight: 700, cursor: "pointer", padding: "2px 4px", fontFamily: FONT }}>
          <PencilIcon /> atur
        </button>
      </div>

      <MiniTimeline gaps={c.gaps} daysSince={c.days_since} accent={handled ? T.faint : meta.accent} />

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 12, paddingTop: 11, borderTop: `1px solid ${T.line}` }}>
        {handled ? (
          <span style={{ fontSize: 12.5, color: T.faint, fontWeight: 600 }}>Sedang ditangani</span>
        ) : (
          <button onClick={() => onFollowUp(c)} style={{ background: T.adminBlue, color: T.white, border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 700, fontFamily: FONT, cursor: "pointer", boxShadow: "0 1px 2px rgba(37,99,235,0.25)" }}>
            Follow up
          </button>
        )}
      </div>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4l10-10-4-4L4 16v4z" stroke={T.adminBlue} strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 6l4 4" stroke={T.adminBlue} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── AdminHome entry card ───────────────────────────────────────
function AdminHomeRadarCard({ actionCount, dormant, overdue, peek, onOpen }) {
  const calm = actionCount === 0;
  return (
    <button onClick={onOpen} style={{ width: "100%", textAlign: "left", background: T.card, borderRadius: 18, border: `1px solid ${calm ? T.line : T.amber}`, padding: 0, overflow: "hidden", cursor: "pointer", fontFamily: FONT, boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
      <div style={{ height: 4, background: calm ? T.emerald : T.amber }} />
      <div style={{ padding: "14px 15px 15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <RadarGlyph color={calm ? T.emerald : T.amber} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Radar Reorder</span>
          </div>
          <span style={{ fontSize: 12, color: T.adminBlue, fontWeight: 700 }}>Buka ›</span>
        </div>
        {calm ? (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.emeraldDark }}>Semua pelanggan dalam ritme.</div>
            <div style={{ fontSize: 12.5, color: T.muted, marginTop: 2 }}>Tidak ada yang perlu di-follow-up. Aman.</div>
          </div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 30, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{actionCount}</span>
              <span style={{ fontSize: 13.5, color: T.body, fontWeight: 600 }}>pelanggan mulai menghilang</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
              <Chip bg={T.amber} color={T.white} bold>{dormant} lama menghilang</Chip>
              <Chip bg={T.amberSoft} color={T.amberDark} bold>{overdue} telat order</Chip>
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 10, lineHeight: 1.4 }}>{peek.join(" · ")} <span style={{ color: T.faint }}>dan lainnya</span></div>
          </div>
        )}
      </div>
    </button>
  );
}
function RadarGlyph({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" opacity="0.35" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" opacity="0.6" />
      <circle cx="12" cy="12" r="1.6" fill={color} />
      <path d="M12 12 L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Follow-up bottom sheet ─────────────────────────────────────
function FollowUpSheet({ customer, onClose, onAction }) {
  if (!customer) return null;
  const actions = [
    { key: "wa", title: "Hubungi via WhatsApp", sub: "Sapa pelanggan sekarang", icon: "wa", primary: true },
    { key: "contacted", title: "Tandai sudah dikontak", sub: "Redam sinyal sementara (7 hari)", icon: "check" },
    { key: "task", title: "Jadikan tugas", sub: "Untuk didelegasikan atau ditunda", icon: "task" },
  ];
  return (
    <SheetShell onClose={onClose}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Follow-up</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{customer.name}</span>
        <StatusChip status={customer.status} />
      </div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>
        {customer.days_since} hari belum order · biasa tiap {customer.cadence_days} hari
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {actions.map((a) => (
          <button key={a.key} onClick={() => onAction(customer, a.key)} style={{ display: "flex", alignItems: "center", gap: 13, textAlign: "left", background: a.primary ? T.adminBlue : T.white, border: `1.5px solid ${a.primary ? T.adminBlue : T.line}`, borderRadius: 14, padding: "13px 14px", cursor: "pointer", fontFamily: FONT }}>
            <SheetIcon kind={a.icon} primary={a.primary} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 700, color: a.primary ? T.white : T.ink }}>{a.title}</span>
              <span style={{ display: "block", fontSize: 12, color: a.primary ? "rgba(255,255,255,0.85)" : T.muted, marginTop: 1 }}>{a.sub}</span>
            </span>
          </button>
        ))}
      </div>
      <CancelRow onClose={onClose} />
    </SheetShell>
  );
}

// ── Task-created confirmation sheet (what "Buat tugas" produces) ─
function TaskCreatedSheet({ payload, onClose }) {
  if (!payload) return null;
  const { customer, ref } = payload;
  const steps = [
    { icon: "wa", text: "Telepon atau WA pelanggan" },
    { icon: "task", text: "Tawarkan jadwal kirim berikutnya" },
  ];
  return (
    <SheetShell onClose={onClose}>
      {/* success header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 38, height: 38, borderRadius: 999, background: T.emeraldSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 6" stroke={T.emeraldDark} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <div style={{ fontSize: 12, color: T.emeraldDark, fontWeight: 700 }}>TUGAS DIBUAT</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, lineHeight: 1.15 }}>Follow-up: {customer.name}</div>
        </div>
      </div>

      {/* the produced task card */}
      <div style={{ marginTop: 14, border: `1px solid ${T.line}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", background: "#FBFCFE", borderBottom: `1px solid ${T.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Chip bg={T.adminBlueSoft} color={T.adminBlueDark} bold>Follow-up</Chip>
            <Chip bg={T.amberSoft} color={T.amberDark}>Terbuka</Chip>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, color: T.muted }}>#{ref}</span>
        </div>

        {/* context — kenapa tugas ini ada */}
        <div style={{ padding: "12px 13px" }}>
          <div style={{ fontSize: 11, color: T.faint, fontWeight: 700, letterSpacing: 0.4, marginBottom: 6 }}>KONTEKS</div>
          <div style={{ fontSize: 13, color: T.body, lineHeight: 1.5 }}>
            <b style={{ color: T.ink }}>{customer.days_since} hari</b> belum order — biasa tiap {customer.cadence_days} hari. Perlu disapa sebelum benar-benar berhenti.
          </div>

          <div style={{ fontSize: 11, color: T.faint, fontWeight: 700, letterSpacing: 0.4, margin: "14px 0 8px" }}>LANGKAH SARAN</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <SheetIcon kind={s.icon} primary={false} />
                <span style={{ fontSize: 13, color: T.body }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* where it went */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 13px", background: T.adminBlueSoft, borderTop: `1px solid ${T.line}` }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h10" stroke={T.adminBlueDark} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12, color: T.adminBlueDark, fontWeight: 600 }}>Masuk antrian koordinasi Admin</span>
        </div>
      </div>

      {/* event hint */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "center" }}>
        <span style={{ fontSize: 10.5, color: T.faint }}>mencatat event</span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: T.adminBlueDark, background: T.adminBlueSoft, padding: "2px 7px", borderRadius: 6 }}>COORDINATION.task_created</span>
      </div>

      <button onClick={onClose} style={{ width: "100%", marginTop: 14, background: T.adminBlue, color: T.white, border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: FONT }}>
        Selesai
      </button>
    </SheetShell>
  );
}

// ── Cadence editor bottom sheet (Increment 2) ──────────────────
function CadenceEditorSheet({ customer, onClose, onSave, onReset }) {
  if (!customer) return null;
  const learned = learnedCadence(customer.gaps);
  const [days, setDays] = useState(customer.cadence_days);
  const [reason, setReason] = useState(null);
  const presets = [3, 5, 7, 14, 30];
  const reasons = ["Pelanggan besar", "Musiman", "Info dari driver", "Tutup sementara"];
  const previewStatus = computeStatus(days, customer.days_since);
  const leaving = previewStatus === "fresh" || previewStatus === "approaching";
  const changed = days !== customer.cadence_days || customer.cadence_source !== "admin_set";
  const clamp = (v) => Math.max(1, Math.min(60, v));

  return (
    <SheetShell onClose={onClose}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Atur ritme order</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{customer.name}</span>
        <CadenceBadge source={customer.cadence_source} />
      </div>
      <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>Saat ini {customer.cadence_days} hari · {customer.days_since} hari belum order</div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 18, marginBottom: 6 }}>
        <StepBtn label="−" onClick={() => setDays((d) => clamp(d - 1))} />
        <div style={{ textAlign: "center", minWidth: 96 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{days}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2, fontWeight: 600 }}>hari sekali</div>
        </div>
        <StepBtn label="+" onClick={() => setDays((d) => clamp(d + 1))} />
      </div>

      <div style={{ display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
        {presets.map((p) => {
          const active = days === p;
          return (
            <button key={p} onClick={() => setDays(p)} style={{ background: active ? T.adminBlue : T.white, color: active ? T.white : T.body, border: `1.5px solid ${active ? T.adminBlue : T.line}`, borderRadius: 999, padding: "6px 13px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>{p} hr</button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 14, padding: "9px 12px", borderRadius: 12, background: leaving ? T.emeraldSoft : T.amberSoft }}>
        <span style={{ fontSize: 12, color: T.muted }}>Hasil sinyal:</span>
        <StatusChip status={previewStatus} />
        {leaving && <span style={{ fontSize: 11.5, color: T.emeraldDark, fontWeight: 600 }}>keluar dari radar</span>}
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        {learned != null && <RefRow label="Dari histori" value={`rata-rata ${learned} hari`} color={T.emeraldDark} onUse={() => setDays(learned)} />}
        <RefRow label="Default sistem" value={`${DEFAULT_CADENCE} hari`} color={T.muted} onUse={() => setDays(DEFAULT_CADENCE)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, marginBottom: 7 }}>Alasan (opsional)</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {reasons.map((r) => {
            const active = reason === r;
            return (
              <button key={r} onClick={() => setReason(active ? null : r)} style={{ background: active ? T.adminBlueSoft : T.white, color: active ? T.adminBlueDark : T.body, border: `1.5px solid ${active ? T.adminBlue : T.line}`, borderRadius: 999, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>{r}</button>
            );
          })}
        </div>
      </div>

      <button onClick={() => onSave(customer, days, reason)} disabled={!changed} style={{ width: "100%", marginTop: 18, background: changed ? T.adminBlue : "#CBD5E1", color: T.white, border: "none", borderRadius: 14, padding: "14px", fontSize: 15, fontWeight: 800, cursor: changed ? "pointer" : "default", fontFamily: FONT }}>
        Simpan ritme {days} hari
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, justifyContent: "center" }}>
        <span style={{ fontSize: 10.5, color: T.faint }}>mencatat event</span>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: T.adminBlueDark, background: T.adminBlueSoft, padding: "2px 7px", borderRadius: 6 }}>COORDINATION.reorder_cadence_set</span>
      </div>

      {customer.cadence_source === "admin_set" && (
        <button onClick={() => onReset(customer)} style={{ width: "100%", marginTop: 10, background: "transparent", border: "none", color: T.adminBlue, fontSize: 13, fontWeight: 700, padding: 6, cursor: "pointer", fontFamily: FONT }}>
          Kembalikan ke otomatis {learned != null ? `(histori: ${learned} hari)` : `(default: ${DEFAULT_CADENCE} hari)`}
        </button>
      )}

      <CancelRow onClose={onClose} />
    </SheetShell>
  );
}

function StepBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 46, height: 46, borderRadius: 14, border: `1.5px solid ${T.line}`, background: T.white, color: T.adminBlue, fontSize: 24, fontWeight: 700, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center" }}>{label}</button>
  );
}
function RefRow({ label, value, color, onUse }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 12, border: `1px solid ${T.line}`, background: "#FBFCFE" }}>
      <div style={{ fontSize: 12.5 }}>
        <span style={{ color: T.muted }}>{label}: </span>
        <span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <button onClick={onUse} style={{ background: "transparent", border: "none", color: T.adminBlue, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Pakai</button>
    </div>
  );
}

// ── Shared sheet chrome ────────────────────────────────────────
function SheetShell({ children, onClose }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, fontFamily: FONT }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.45)" }} />
      <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: T.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: "10px 16px 18px", boxShadow: "0 -8px 30px rgba(15,23,42,0.18)", maxHeight: "92%", overflowY: "auto" }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: T.line, margin: "0 auto 14px" }} />
        {children}
      </div>
    </div>
  );
}
function CancelRow({ onClose }) {
  return (
    <button onClick={onClose} style={{ width: "100%", marginTop: 12, background: "transparent", border: "none", color: T.muted, fontSize: 13.5, fontWeight: 600, padding: 8, cursor: "pointer", fontFamily: FONT }}>Tutup</button>
  );
}
function SheetIcon({ kind, primary }) {
  const col = primary ? T.white : T.adminBlue;
  const box = { width: 34, height: 34, borderRadius: 10, background: primary ? "rgba(255,255,255,0.18)" : T.adminBlueSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
  return (
    <span style={box}>
      {kind === "task" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 11l3 3 5-6" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="4" width="16" height="16" rx="4" stroke={col} strokeWidth="2" opacity="0.5" />
        </svg>
      )}
      {kind === "wa" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3z" stroke={col} strokeWidth="2" strokeLinejoin="round" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.4-.8-.9.8c-1.2-.5-2.1-1.4-2.6-2.6l.8-.9-.8-1.4c-.5 0-1 .4-1 1z" fill={col} />
        </svg>
      )}
      {kind === "check" && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l5 5L20 6" stroke={col} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

// ── Screens ────────────────────────────────────────────────────
function TopBar({ title, onBack, subtitle }) {
  return (
    <div style={{ background: T.white, borderBottom: `1px solid ${T.line}`, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", fontFamily: FONT }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke={T.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, lineHeight: 1.1 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
function RuntimeTag() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: T.adminBlue }} />
      <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: T.adminBlue }}>ADMIN RUNTIME</span>
    </div>
  );
}

function AdminHome({ data, onOpenRadar }) {
  const actionable = data.filter((c) => c.followup_state === "none" && (c.status === "dormant" || c.status === "overdue"));
  const dormant = actionable.filter((c) => c.status === "dormant").length;
  const overdue = actionable.filter((c) => c.status === "overdue").length;
  const peek = actionable.slice(0, 2).map((c) => c.name);
  return (
    <div style={{ padding: "16px 15px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <RuntimeTag />
        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Loka Air · BSD</span>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, lineHeight: 1.15 }}>Beranda Admin</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Ada yang bakal pecah sebelum aku balik?</div>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.5, color: T.faint, marginTop: 2 }}>PERLU PERHATIAN</div>
      <AdminHomeRadarCard actionCount={actionable.length} dormant={dormant} overdue={overdue} peek={peek} onOpen={onOpenRadar} />
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>Pickup tertunda</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>3 customer · outstanding aging</div>
        </div>
        <span style={{ fontSize: 12, color: T.adminBlue, fontWeight: 700 }}>Buka ›</span>
      </div>
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>Selisih kendaraan</div>
          <div style={{ fontSize: 12, color: T.emeraldDark, marginTop: 1 }}>Tidak ada selisih hari ini</div>
        </div>
        <span style={{ fontSize: 12, color: T.adminBlue, fontWeight: 700 }}>Buka ›</span>
      </div>
    </div>
  );
}

function RadarScreen({ data, onBack, onFollowUp, onEditCadence }) {
  const actionable = data.filter((c) => c.followup_state === "none" && (c.status === "dormant" || c.status === "overdue"));
  const handled = data.filter((c) => c.followup_state !== "none");
  const dormant = actionable.filter((c) => c.status === "dormant");
  const overdue = actionable.filter((c) => c.status === "overdue");
  const ordered = [...dormant.sort((a, b) => b.days_since - a.days_since), ...overdue.sort((a, b) => b.days_since - a.days_since)];
  return (
    <div>
      <TopBar title="Radar Reorder" subtitle="Pelanggan yang mulai menghilang" onBack={onBack} />
      <div style={{ background: T.white, padding: "12px 15px", borderBottom: `1px solid ${T.line}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Chip bg={T.amber} color={T.white} bold>{dormant.length} lama menghilang</Chip>
        <Chip bg={T.amberSoft} color={T.amberDark} bold>{overdue.length} telat order</Chip>
        {handled.length > 0 && <Chip bg={T.adminBlueSoft} color={T.adminBlueDark}>{handled.length} ditangani</Chip>}
      </div>
      <div style={{ padding: "14px 15px 30px", display: "flex", flexDirection: "column", gap: 11 }}>
        {ordered.map((c) => <SignalCard key={c.id} c={c} onFollowUp={onFollowUp} onEditCadence={onEditCadence} />)}
        {handled.map((c) => <SignalCard key={c.id} c={c} onFollowUp={onFollowUp} onEditCadence={onEditCadence} />)}
        <div style={{ display: "flex", alignItems: "center", gap: 9, background: T.emeraldSoft, border: `1px solid #A7F3D0`, borderRadius: 14, padding: "13px 14px", marginTop: 3 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 6" stroke={T.emeraldDark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.emeraldDark }}>{FRESH_COUNT} pelanggan dalam ritme normal</div>
            <div style={{ fontSize: 12, color: T.emeraldDark, opacity: 0.85 }}>Yang masih rutin order tidak muncul di sini. Sepi = aman.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────
export default function ReorderRadarMockup() {
  const [view, setView] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [data, setData] = useState(SEED);
  const [toast, setToast] = useState(null);

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 1700);
  }

  function handleFollowAction(customer, key) {
    if (key === "task") {
      // "Buat tugas follow-up" produces a real follow-up task → show what came out
      setData((prev) => prev.map((c) => (c.id === customer.id ? { ...c, followup_state: "task_open" } : c)));
      const ref = "FU-" + String(1000 + Math.floor(Math.random() * 9000));
      setSheet({ kind: "task_created", payload: { customer, ref } });
      return;
    }
    // WA / mark-contacted → mute signal + toast
    setData((prev) => prev.map((c) => (c.id === customer.id ? { ...c, followup_state: "recently_contacted" } : c)));
    setSheet(null);
    flash(key === "wa" ? `Membuka WhatsApp ${customer.name}… ditandai sudah dikontak` : `${customer.name} ditandai sudah dikontak`);
  }

  function handleSaveCadence(customer, days, reason) {
    setData((prev) => prev.map((c) => (c.id === customer.id ? { ...c, cadence_days: days, cadence_source: "admin_set", status: computeStatus(days, c.days_since) } : c)));
    const newStatus = computeStatus(days, customer.days_since);
    const left = newStatus === "fresh" || newStatus === "approaching";
    setSheet(null);
    flash(left ? `Ritme ${customer.name} → ${days} hari. Sekarang dalam ritme, keluar dari radar.` : `Ritme ${customer.name} diatur ke ${days} hari${reason ? ` (${reason})` : ""}`);
  }

  function handleResetCadence(customer) {
    const learned = learnedCadence(customer.gaps);
    const src = learned != null ? "learned" : "default";
    const val = learned != null ? learned : DEFAULT_CADENCE;
    setData((prev) => prev.map((c) => (c.id === customer.id ? { ...c, cadence_days: val, cadence_source: src, status: computeStatus(val, c.days_since) } : c)));
    setSheet(null);
    flash(`Ritme ${customer.name} dikembalikan ke otomatis (${val} hari)`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B1220", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "24px 12px", fontFamily: FONT }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 390, minHeight: 780, background: T.appBg, borderRadius: 30, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {view === "home" && <AdminHome data={data} onOpenRadar={() => setView("radar")} />}
        {view === "radar" && (
          <RadarScreen data={data} onBack={() => setView("home")} onFollowUp={(c) => setSheet({ kind: "followup", customer: c })} onEditCadence={(c) => setSheet({ kind: "cadence", customer: c })} />
        )}
        {sheet && sheet.kind === "followup" && <FollowUpSheet customer={sheet.customer} onClose={() => setSheet(null)} onAction={handleFollowAction} />}
        {sheet && sheet.kind === "task_created" && <TaskCreatedSheet payload={sheet.payload} onClose={() => setSheet(null)} />}
        {sheet && sheet.kind === "cadence" && <CadenceEditorSheet key={sheet.customer.id} customer={sheet.customer} onClose={() => setSheet(null)} onSave={handleSaveCadence} onReset={handleResetCadence} />}
        {toast && (
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 20, background: T.ink, color: T.white, borderRadius: 12, padding: "12px 14px", fontSize: 12.5, fontWeight: 600, textAlign: "center", zIndex: 60, lineHeight: 1.4 }}>{toast}</div>
        )}
      </div>
    </div>
  );
}
