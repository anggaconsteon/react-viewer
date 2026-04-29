import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Plus,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Paperclip,
  Camera,
  AlertTriangle,
  Users,
  Briefcase,
  Stethoscope,
  Clock3,
  Plane,
  Repeat,
  Timer,
  Edit3,
  Check,
  X,
  Shield,
  Building2,
  ListChecks,
  Smartphone,
  UserCheck,
} from "lucide-react";

/* ============================================================================
   CONSTEON · REQUEST & APPROVAL MODULE
   Phase 1 (Sick, Permission, Leave, Shift Swap, Overtime)
   Phase 2 (Attendance Correction, Time Correction)

   Follows the Worker Widget System design guide strictly:
   - WidgetShell / WidgetHeader structure
   - Four-state token system (active / idle / offline / alert)
   - Operational framing — staffing impact, conflict warnings, not HR forms
   - Dark-slate primaries, no decorative color
============================================================================ */

/* ─────────────────────────  DESIGN TOKENS  ───────────────────────── */

const TOKENS = {
  states: {
    active:  { accent: "#16a34a", soft: "#dcfce7", ring: "rgba(22,163,74,0.18)",  pulse: "#22c55e" },
    idle:    { accent: "#b45309", soft: "#fef3c7", ring: "rgba(180,83,9,0.18)",   pulse: "#f59e0b" },
    offline: { accent: "#64748b", soft: "#f1f5f9", ring: "rgba(100,116,139,0.18)", pulse: "#94a3b8" },
    alert:   { accent: "#dc2626", soft: "#fee2e2", ring: "rgba(220,38,38,0.18)",  pulse: "#ef4444" },
  },
  font:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

/* Map request lifecycle → state token */
const statusState = (s) =>
  s === "approved" ? "active" : s === "rejected" ? "alert" : "idle";

/* Map request type → icon + label */
const REQUEST_TYPES = {
  sick:        { label: "Sick Leave",            id_label: "Sakit",        icon: Stethoscope },
  permission:  { label: "Permission",            id_label: "Izin",         icon: Clock3 },
  leave:       { label: "Leave",                 id_label: "Cuti",         icon: Plane },
  swap:        { label: "Shift Swap",            id_label: "Ganti Shift",  icon: Repeat },
  overtime:    { label: "Overtime",              id_label: "Lembur",       icon: Timer },
  attendance:  { label: "Attendance Correction", id_label: "Koreksi Absensi", icon: Edit3 },
  time:        { label: "Time Correction",       id_label: "Koreksi Waktu",   icon: Clock },
};

/* Structured reason categories — replaces free-text-only reasoning.
   "Other" always forces the textarea to be required so the signal is never empty. */
const CORRECTION_CATEGORIES = [
  "Forgot Check-in",
  "Forgot Check-out",
  "GPS Issue",
  "App Issue",
  "Other",
];

const REASON_CATEGORIES = {
  sick:        ["Flu", "Medical Emergency", "Hospitalization", "Other"],
  permission:  ["Personal", "Urgent Matter", "Family", "Other"],
  leave:       ["Annual Leave", "Unpaid Leave", "Personal Leave", "Other"],
  swap:        ["Personal Conflict", "Schedule Issue", "Other"],
  overtime:    ["Task Not Completed", "High Workload", "Emergency", "Other"],
  attendance:  CORRECTION_CATEGORIES,
  time:        CORRECTION_CATEGORIES,
};

/* ─────────────────────────  PRIMITIVES  ───────────────────────── */

/** WidgetShell — universal 18px container. Compact=14px. */
function WidgetShell({ children, compact = false, accent, style, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        borderRadius: compact ? 14 : 18,
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)",
        border: "1px solid #eef2f6",
        backgroundColor: "white",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {accent && (
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: 1,
            backgroundColor: accent,
          }}
        />
      )}
      {children}
    </div>
  );
}

/** WidgetHeader — uppercase micro-label + icon tile + optional right slot */
function WidgetHeader({ icon: Icon, label, right }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "14px 16px 10px" }}
    >
      <div className="flex items-center" style={{ gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {Icon && <Icon size={13} strokeWidth={2.25} color="#64748b" />}
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#64748b",
          }}
        >
          {label}
        </span>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

/** StatusBadge — state-driven pill with pulse (except offline) */
function StatusBadge({ state = "idle", children }) {
  const t = TOKENS.states[state];
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        backgroundColor: t.soft,
        color: t.accent,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        border: `1px solid ${t.ring}`,
      }}
    >
      <span
        className="relative flex"
        style={{ width: 6, height: 6 }}
      >
        {state !== "offline" && (
          <span
            className="animate-ping absolute inline-flex rounded-full"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: t.pulse,
              opacity: 0.65,
            }}
          />
        )}
        <span
          className="relative inline-flex rounded-full"
          style={{ width: 6, height: 6, backgroundColor: t.pulse }}
        />
      </span>
      {children}
    </span>
  );
}

/** PrimaryButton — dark slate, full-width option, scale feedback */
function PrimaryButton({ children, onClick, disabled, disabledReason, icon: Icon, full = true, danger = false }) {
  return (
    <div style={{ width: full ? "100%" : "auto" }}>
      <button
        onClick={onClick}
        disabled={disabled}
        className="active:scale-[0.98] transition-transform"
        style={{
          width: full ? "100%" : "auto",
          padding: "12px 16px",
          borderRadius: 12,
          backgroundColor: danger ? "#dc2626" : "#0f172a",
          color: "white",
          fontSize: 13.5,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
          border: 0,
          boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
        }}
      >
        {Icon && <Icon size={15} strokeWidth={2.5} />}
        {children}
      </button>
      {disabled && disabledReason && (
        <p
          style={{
            fontSize: 11,
            color: "#94a3b8",
            marginTop: 6,
            textAlign: "center",
          }}
        >
          {disabledReason}
        </p>
      )}
    </div>
  );
}

function SecondaryButton({ children, onClick, icon: Icon, full = false }) {
  return (
    <button
      onClick={onClick}
      className="active:scale-[0.98] transition-transform hover:bg-slate-50"
      style={{
        width: full ? "100%" : "auto",
        padding: "10px 14px",
        borderRadius: 12,
        backgroundColor: "white",
        color: "#334155",
        fontSize: 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        border: "1px solid #e2e8f0",
        cursor: "pointer",
      }}
    >
      {Icon && <Icon size={14} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

function DestructiveAdjacentButton({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="active:scale-[0.98] transition-transform"
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        backgroundColor: "#fef2f2",
        color: "#b91c1c",
        fontSize: 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        border: 0,
        cursor: "pointer",
      }}
    >
      {Icon && <Icon size={14} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

/** MetaRow — label + value, 11px meta */
function MetaRow({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "6px 0" }}>
      <span style={{ fontSize: 11, color: "#94a3b8" }}>{label}</span>
      <span
        style={{
          fontSize: 12,
          color: "#334155",
          fontWeight: 500,
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
          fontVariantNumeric: mono ? "tabular-nums" : "normal",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Tabs — pill segmented tabs */
function Tabs({ tabs, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: 4,
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
      }}
    >
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="active:scale-[0.98] transition-all"
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 9,
              backgroundColor: active ? "white" : "transparent",
              color: active ? "#0f172a" : "#64748b",
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              border: 0,
              cursor: "pointer",
              boxShadow: active ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span
                style={{
                  fontSize: 10.5,
                  fontVariantNumeric: "tabular-nums",
                  color: active ? "#64748b" : "#94a3b8",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Field — labeled input wrapper */
function Field({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#64748b",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span style={{ color: "#dc2626", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>{hint}</p>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
  fontFamily: TOKENS.font,
};

/* ─────────────────────────  MOCK DATA  ───────────────────────── */

const CURRENT_WORKER = {
  id: "w_001",
  name: "Budi Santoso",
  role: "Security Officer",
  site: "Menara BCA · Jakarta",
  shift: "Shift A · 06:00–14:00",
};

const MOCK_REQUESTS = [
  {
    id: "req_001",
    type: "sick",
    status: "pending",
    submittedAt: "2026-04-24 07:42",
    dateFrom: "2026-04-25",
    dateTo: "2026-04-25",
    reason: "Demam tinggi sejak semalam, perlu istirahat dan cek dokter.",
    attachments: 1,
    worker: CURRENT_WORKER,
    shiftAffected: "Shift A · 06:00–14:00",
    siteStaffing: { before: 5, after: 4 },
    conflict: false,
  },
  {
    id: "req_002",
    type: "overtime",
    status: "approved",
    submittedAt: "2026-04-22 16:10",
    date: "2026-04-23",
    startTime: "22:00",
    endTime: "02:00",
    reason: "Cover event close-down, acara gala dinner lantai 40.",
    relatedTask: "Patrol Event Support",
    worker: CURRENT_WORKER,
    shiftAffected: "Shift B extension",
    approvedBy: "Rina (Supervisor)",
  },
  {
    id: "req_003",
    type: "swap",
    status: "pending",
    submittedAt: "2026-04-23 11:20",
    yourShift: "Shift A · 06:00–14:00 (Sat 26 Apr)",
    replacementWorker: "Agus Priyanto",
    replacementShift: "Shift B · 14:00–22:00 (Sat 26 Apr)",
    reason: "Acara keluarga pagi hari, tukar dengan shift sore.",
    worker: CURRENT_WORKER,
    shiftAffected: "Shift A (Sat 26 Apr)",
    siteStaffing: { before: 5, after: 5 },
    conflict: false,
  },
  {
    id: "req_004",
    type: "leave",
    status: "rejected",
    submittedAt: "2026-04-18 09:05",
    startDate: "2026-05-01",
    endDate: "2026-05-05",
    leaveType: "Cuti Tahunan",
    reason: "Liburan keluarga ke Bali.",
    worker: CURRENT_WORKER,
    rejectedReason:
      "Site understaffed during long weekend. Please resubmit for week of May 12.",
  },
  {
    id: "req_005",
    type: "attendance",
    status: "pending",
    submittedAt: "2026-04-24 08:11",
    date: "2026-04-23",
    issueType: "No Check-out",
    correctTime: "14:05",
    reasonCategory: "Forgot Check-out",
    reason: "Ponsel low-battery saat akhir shift, lupa check-out.",
    worker: CURRENT_WORKER,
    shiftAffected: "Shift A · 2026-04-23",
    siteStaffing: { before: 5, after: 5 },
    conflict: false,
    verification: {
      device: "Samsung Galaxy S21 · Android 13",
      location: "-6.2088, 106.8456 · ±12m",
      capturedAt: "2026-04-24 08:11",
    },
  },
];

/* Supervisor sees requests from multiple workers */
const OTHER_WORKERS = [
  { id: "w_002", name: "Siti Aminah",  role: "Cleaner",       site: "Menara BCA · Jakarta" },
  { id: "w_003", name: "Agus Priyanto", role: "Security Officer", site: "Menara BCA · Jakarta" },
  { id: "w_004", name: "Dewi Lestari",  role: "Technician",   site: "Pacific Place · Jakarta" },
];

const SUPERVISOR_QUEUE = [
  ...MOCK_REQUESTS,
  {
    id: "req_101",
    type: "permission",
    status: "pending",
    submittedAt: "2026-04-24 06:50",
    date: "2026-04-24",
    startTime: "10:00",
    endTime: "12:00",
    reason: "Urus dokumen BPJS di kantor cabang.",
    location: "Kantor BPJS Sudirman",
    worker: OTHER_WORKERS[0],
    shiftAffected: "Shift A · 06:00–14:00",
    siteStaffing: { before: 3, after: 2 },
    conflict: true,
    conflictReason: "Below minimum staffing (3) for morning cleaning shift.",
  },
  {
    id: "req_102",
    type: "time",
    status: "pending",
    submittedAt: "2026-04-24 09:02",
    date: "2026-04-24",
    currentTime: "06:42",
    correctTime: "06:00",
    reasonCategory: "GPS Issue",
    reason: "GPS lag, absen tercatat 42 menit terlambat padahal sudah di lokasi.",
    worker: OTHER_WORKERS[2],
    shiftAffected: "Shift A · 2026-04-24",
    siteStaffing: { before: 4, after: 4 },
    conflict: false,
    verification: {
      device: "Xiaomi Redmi Note 12 · Android 13",
      location: "-6.2294, 106.8094 · ±42m",
      capturedAt: "2026-04-24 09:02",
    },
  },
];

/* ─────────────────────────  SHARED PIECES  ───────────────────────── */

/** RequestCard — compact list item for worker & supervisor lists */
function RequestCard({ request, onClick, showWorker = false }) {
  const t = REQUEST_TYPES[request.type];
  const state = statusState(request.status);
  const stateToken = TOKENS.states[state];
  const Icon = t.icon;

  /* Build the operational headline */
  const primaryLine = showWorker ? request.worker.name : t.label;
  const secondaryLine = showWorker
    ? `${t.label} · ${request.shiftAffected || "—"}`
    : request.shiftAffected || request.date || request.dateFrom || "—";

  return (
    <div
      onClick={onClick}
      className="active:scale-[0.99] transition-transform cursor-pointer"
      style={{
        borderRadius: 14,
        backgroundColor: "white",
        border: "1px solid #eef2f6",
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 14px rgba(15,23,42,0.04)",
        borderLeft: `3px solid ${stateToken.accent}`,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          backgroundColor: "#f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={15} strokeWidth={2.25} color="#475569" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center" style={{ gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {primaryLine}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {secondaryLine}
        </div>
        <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
          <StatusBadge state={state}>
            {request.status === "pending" ? "Pending" : request.status === "approved" ? "Approved" : "Rejected"}
          </StatusBadge>
          {request.conflict && (
            <span
              className="inline-flex items-center"
              style={{
                gap: 4,
                fontSize: 10.5,
                color: "#b45309",
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={11} strokeWidth={2.5} />
              Conflict
            </span>
          )}
          {request.status === "approved" && request.replacementRequired && (
            <span
              className="inline-flex items-center"
              style={{
                gap: 4,
                fontSize: 10.5,
                color: TOKENS.states.alert.accent,
                fontWeight: 600,
              }}
            >
              <UserCheck size={11} strokeWidth={2.5} />
              Replacement
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} color="#cbd5e1" strokeWidth={2} />
    </div>
  );
}

/** TopBar — page header with back button and title */
function TopBar({ title, onBack, right }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: "rgba(248,250,252,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid #eef2f6",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div className="flex items-center" style={{ gap: 10, minWidth: 0 }}>
        {onBack && (
          <button
            onClick={onBack}
            className="active:scale-[0.95] transition-transform"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} color="#334155" strokeWidth={2.25} />
          </button>
        )}
        <h1
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#0f172a",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </h1>
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

/* ─────────────────────────  PAGE 1 · WORKER REQUEST LIST  ───────────────────────── */

function RequestListPage({ requests, onOpenRequest, onCreateNew }) {
  const [tab, setTab] = useState("all");

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  );

  const filtered = tab === "all" ? requests : requests.filter((r) => r.status === tab);

  return (
    <div>
      <TopBar
        title="My Requests"
        right={
          <button
            onClick={onCreateNew}
            className="active:scale-[0.96] transition-transform"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              backgroundColor: "#0f172a",
              color: "white",
              fontSize: 12.5,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              border: 0,
              cursor: "pointer",
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            New
          </button>
        }
      />

      <div style={{ padding: 16 }}>
        {/* Operational summary widget */}
        <WidgetShell style={{ marginBottom: 14 }}>
          <WidgetHeader
            icon={ListChecks}
            label="Operational Summary"
            right={
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {counts.pending} pending
              </span>
            }
          />
          <div style={{ padding: "0 16px 14px" }}>
            <p style={{ fontSize: 13.5, color: "#0f172a", fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              {counts.pending > 0
                ? `${counts.pending} request${counts.pending > 1 ? "s" : ""} awaiting supervisor approval.`
                : "No open requests. Shift schedule reflects current assignments."}
            </p>
            <p style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
              {CURRENT_WORKER.site} · {CURRENT_WORKER.shift}
            </p>
          </div>
        </WidgetShell>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "all",      label: "All",      count: counts.all },
              { key: "pending",  label: "Pending",  count: counts.pending },
              { key: "approved", label: "Approved", count: counts.approved },
              { key: "rejected", label: "Rejected", count: counts.rejected },
            ]}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <WidgetShell>
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: "#f1f5f9",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <FileText size={18} color="#94a3b8" strokeWidth={2} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: 0 }}>
                  No {tab === "all" ? "" : tab} requests
                </p>
                <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>
                  Tap "New" to submit one.
                </p>
              </div>
            </WidgetShell>
          ) : (
            filtered.map((r) => (
              <RequestCard key={r.id} request={r} onClick={() => onOpenRequest(r.id)} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  PAGE 2 · WORKER CREATE REQUEST  ───────────────────────── */

function RequestFormPage({ onCancel, onSubmit }) {
  const [type, setType] = useState(null);
  const [form, setForm] = useState({});
  const [attachments, setAttachments] = useState(0);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /* Validation — each type has its own required fields.
     reasonCategory is required for every type.
     Free-text reason is required only when category = "Other" (otherwise optional). */
  const isValid = useMemo(() => {
    if (!type) return false;
    const cat = form.reasonCategory;
    if (!cat) return false;
    const reasonOk = cat === "Other" ? !!(form.reason && form.reason.trim()) : true;
    if (!reasonOk) return false;
    switch (type) {
      case "sick":       return !!form.dateFrom;
      case "permission": return !!(form.date && form.startTime && form.endTime);
      case "leave":      return !!(form.startDate && form.endDate && form.leaveType);
      case "swap":       return !!form.replacementWorker;
      case "overtime":   return !!(form.date && form.startTime && form.endTime);
      case "attendance": return !!(form.date && form.issueType && form.correctTime);
      case "time":       return !!(form.date && form.correctTime);
      default:           return false;
    }
  }, [type, form]);

  if (!type) {
    /* Step 1 — pick request type */
    return (
      <div>
        <TopBar title="New Request" onBack={onCancel} />
        <div style={{ padding: 16 }}>
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#64748b",
              marginBottom: 10,
            }}
          >
            Request Type
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(REQUEST_TYPES).map(([key, t]) => {
              const Icon = t.icon;
              return (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className="active:scale-[0.99] transition-transform"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 14px",
                    borderRadius: 14,
                    backgroundColor: "white",
                    border: "1px solid #eef2f6",
                    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} strokeWidth={2.25} color="#475569" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>
                      {t.label}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>{t.id_label}</div>
                  </div>
                  <ChevronRight size={16} color="#cbd5e1" strokeWidth={2} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const typeMeta = REQUEST_TYPES[type];

  /* Step 2 — dynamic form */
  return (
    <div>
      <TopBar title={typeMeta.label} onBack={() => setType(null)} />
      <div style={{ padding: 16, paddingBottom: 120 }}>
        {/* Context banner: what shift will this affect? */}
        <div
          style={{
            borderRadius: 12,
            backgroundColor: TOKENS.states.idle.soft,
            border: `1px solid ${TOKENS.states.idle.ring}`,
            padding: "10px 12px",
            marginBottom: 14,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <AlertTriangle size={14} color={TOKENS.states.idle.accent} strokeWidth={2.25} style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.states.idle.accent, margin: 0 }}>
              This affects {CURRENT_WORKER.shift}
            </p>
            <p style={{ fontSize: 11.5, color: "#78350f", marginTop: 2 }}>
              Supervisor will review against site staffing before approval.
            </p>
          </div>
        </div>

        <WidgetShell>
          <WidgetHeader icon={typeMeta.icon} label={typeMeta.id_label} />
          <div style={{ padding: "0 16px 16px" }}>
            {/* Dynamic fields per type */}
            {type === "sick" && (
              <>
                <Field label="Date (From)" required>
                  <input type="date" style={inputStyle} value={form.dateFrom || ""} onChange={(e) => update("dateFrom", e.target.value)} />
                </Field>
                <Field label="Date (To)" hint="Leave blank for single day">
                  <input type="date" style={inputStyle} value={form.dateTo || ""} onChange={(e) => update("dateTo", e.target.value)} />
                </Field>
                <ReasonBlock type={type} form={form} update={update} />
                <AttachmentField count={attachments} onAdd={() => setAttachments((a) => a + 1)} label="Medical certificate / photo" />
              </>
            )}

            {type === "permission" && (
              <>
                <Field label="Date" required>
                  <input type="date" style={inputStyle} value={form.date || ""} onChange={(e) => update("date", e.target.value)} />
                </Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Start Time" required>
                      <input type="time" style={inputStyle} value={form.startTime || ""} onChange={(e) => update("startTime", e.target.value)} />
                    </Field>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Field label="End Time" required>
                      <input type="time" style={inputStyle} value={form.endTime || ""} onChange={(e) => update("endTime", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <ReasonBlock type={type} form={form} update={update} />
                <Field label="Location (optional)">
                  <input type="text" style={inputStyle} placeholder="e.g. Kantor BPJS" value={form.location || ""} onChange={(e) => update("location", e.target.value)} />
                </Field>
              </>
            )}

            {type === "leave" && (
              <>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Start Date" required>
                      <input type="date" style={inputStyle} value={form.startDate || ""} onChange={(e) => update("startDate", e.target.value)} />
                    </Field>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Field label="End Date" required>
                      <input type="date" style={inputStyle} value={form.endDate || ""} onChange={(e) => update("endDate", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <Field label="Leave Type" required>
                  <select style={inputStyle} value={form.leaveType || ""} onChange={(e) => update("leaveType", e.target.value)}>
                    <option value="">Select...</option>
                    <option>Cuti Tahunan</option>
                    <option>Cuti Besar</option>
                    <option>Cuti Melahirkan</option>
                    <option>Cuti Menikah</option>
                    <option>Cuti Tidak Dibayar</option>
                  </select>
                </Field>
                <ReasonBlock type={type} form={form} update={update} />
              </>
            )}

            {type === "swap" && (
              <>
                <Field label="Your Shift">
                  <div
                    style={{
                      ...inputStyle,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#475569",
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <Clock size={13} color="#64748b" />
                    {CURRENT_WORKER.shift}
                  </div>
                </Field>
                <Field label="Replacement Worker" required>
                  <select style={inputStyle} value={form.replacementWorker || ""} onChange={(e) => update("replacementWorker", e.target.value)}>
                    <option value="">Select worker...</option>
                    <option>Agus Priyanto · Shift B</option>
                    <option>Dewi Lestari · Shift B</option>
                    <option>Rudi Hartono · Shift C</option>
                  </select>
                </Field>
                {form.replacementWorker && (
                  <div
                    style={{
                      borderRadius: 10,
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: 12,
                      marginBottom: 14,
                    }}
                  >
                    <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>
                      Replacement Shift
                    </p>
                    <p style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 600 }}>
                      {form.replacementWorker.split(" · ")[1] || "Shift B · 14:00–22:00"}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      Net staffing impact: <span style={{ color: TOKENS.states.active.accent, fontWeight: 600 }}>No change</span>
                    </p>
                  </div>
                )}
                <ReasonBlock type={type} form={form} update={update} />
              </>
            )}

            {type === "overtime" && (
              <>
                <Field label="Date" required>
                  <input type="date" style={inputStyle} value={form.date || ""} onChange={(e) => update("date", e.target.value)} />
                </Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Field label="Start Time" required>
                      <input type="time" style={inputStyle} value={form.startTime || ""} onChange={(e) => update("startTime", e.target.value)} />
                    </Field>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Field label="End Time" required>
                      <input type="time" style={inputStyle} value={form.endTime || ""} onChange={(e) => update("endTime", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <ReasonBlock type={type} form={form} update={update} />
                <Field label="Related Task (optional)">
                  <input type="text" style={inputStyle} placeholder="e.g. Event support patrol" value={form.relatedTask || ""} onChange={(e) => update("relatedTask", e.target.value)} />
                </Field>
              </>
            )}

            {type === "attendance" && (
              <>
                <Field label="Date" required>
                  <input type="date" style={inputStyle} value={form.date || ""} onChange={(e) => update("date", e.target.value)} />
                </Field>
                <Field label="Issue Type" required>
                  <select style={inputStyle} value={form.issueType || ""} onChange={(e) => update("issueType", e.target.value)}>
                    <option value="">Select...</option>
                    <option>No Check-in</option>
                    <option>No Check-out</option>
                  </select>
                </Field>
                <Field label="Correct Time" required>
                  <input type="time" style={inputStyle} value={form.correctTime || ""} onChange={(e) => update("correctTime", e.target.value)} />
                </Field>
                <ReasonBlock type={type} form={form} update={update} />
                <AttachmentField count={attachments} onAdd={() => setAttachments((a) => a + 1)} label="Evidence (optional)" />
              </>
            )}

            {type === "time" && (
              <>
                <Field label="Date" required>
                  <input type="date" style={inputStyle} value={form.date || ""} onChange={(e) => update("date", e.target.value)} />
                </Field>
                <Field label="Current Recorded Time">
                  <div
                    style={{
                      ...inputStyle,
                      backgroundColor: "#f8fafc",
                      color: "#475569",
                      fontFamily: "ui-monospace, monospace",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {form.date ? "06:42 (auto-detected)" : "Pick a date first"}
                  </div>
                </Field>
                <Field label="Correct Time" required>
                  <input type="time" style={inputStyle} value={form.correctTime || ""} onChange={(e) => update("correctTime", e.target.value)} />
                </Field>
                <ReasonBlock type={type} form={form} update={update} />
              </>
            )}
          </div>
        </WidgetShell>

        {/* Verification Context — shown only for correction types.
            Read-only evidence auto-captured at submission. */}
        {(type === "attendance" || type === "time") && (
          <VerificationContextWidget
            device="Samsung Galaxy S21 · Android 13"
            location="-6.201, 106.816 · ±8m"
            capturedAt={new Date().toISOString().replace("T", " ").slice(0, 16)}
          />
        )}
      </div>

      {/* Sticky footer */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
          backgroundColor: "rgba(248,250,252,0.92)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid #eef2f6",
        }}
      >
        <PrimaryButton
          onClick={() => {
            onSubmit({ type, ...form, attachments });
          }}
          disabled={!isValid}
          disabledReason={!isValid ? "Fill all required fields to submit" : null}
          icon={Check}
        >
          Submit Request
        </PrimaryButton>
      </div>
    </div>
  );
}

/** AttachmentField — photo/doc upload placeholder */
function AttachmentField({ count, onAdd, label }) {
  return (
    <Field label={label}>
      <button
        onClick={onAdd}
        className="active:scale-[0.99] transition-transform hover:bg-slate-50"
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 10,
          backgroundColor: "#f8fafc",
          border: "1px dashed #cbd5e1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          color: "#475569",
          fontSize: 12.5,
          fontWeight: 500,
        }}
      >
        <Camera size={14} strokeWidth={2.25} />
        {count > 0 ? `${count} attached · Add another` : "Take photo or upload"}
      </button>
    </Field>
  );
}

/** ReasonBlock — structured reason category (required) + conditional free-text.
    Free text only becomes required when category = "Other".
    Shared across all 7 request types. */
function ReasonBlock({ type, form, update }) {
  const categories = REASON_CATEGORIES[type] || [];
  const isOther = form.reasonCategory === "Other";
  return (
    <>
      <Field label="Reason Category" required>
        <select
          style={inputStyle}
          value={form.reasonCategory || ""}
          onChange={(e) => update("reasonCategory", e.target.value)}
        >
          <option value="">Select...</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label={isOther ? "Reason" : "Notes"}
        required={isOther}
        hint={isOther ? null : "Optional — add detail if it helps the supervisor decide"}
      >
        <textarea
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: TOKENS.font }}
          placeholder={
            isOther
              ? "Explain the situation"
              : "e.g. Demam tinggi sejak semalam"
          }
          value={form.reason || ""}
          onChange={(e) => update("reason", e.target.value)}
        />
      </Field>
    </>
  );
}

/** VerificationContextWidget — read-only evidence block for correction requests.
    Intentionally feels like evidence, not a form: smaller type, muted, mono for GPS. */
function VerificationContextWidget({ device, location, capturedAt }) {
  return (
    <WidgetShell style={{ marginTop: 12 }}>
      <WidgetHeader
        icon={Shield}
        label="Verification Context"
        right={
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            Auto-captured
          </span>
        }
      />
      <div style={{ padding: "0 16px 14px" }}>
        <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
          System-captured signals attached at submission. Supervisor uses these
          to judge correction validity.
        </p>

        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 10,
            backgroundColor: "#f8fafc",
            border: "1px solid #eef2f6",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
            <Smartphone size={12} color="#94a3b8" strokeWidth={2.25} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
                Device
              </p>
              <p style={{ fontSize: 11.5, color: "#475569", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {device}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
            <MapPin size={12} color="#94a3b8" strokeWidth={2.25} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
                Location
              </p>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#475569",
                  marginTop: 1,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {location}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8 }}>
            <Clock size={12} color="#94a3b8" strokeWidth={2.25} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
                Captured at
              </p>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#475569",
                  marginTop: 1,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {capturedAt}
              </p>
            </div>
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}

/** ReplacementBadge — small flag shown on approved requests that need a replacement worker */
function ReplacementBadge() {
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 5,
        padding: "3px 9px",
        borderRadius: 999,
        backgroundColor: TOKENS.states.alert.soft,
        color: TOKENS.states.alert.accent,
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.04em",
        border: `1px solid ${TOKENS.states.alert.ring}`,
      }}
    >
      <UserCheck size={11} strokeWidth={2.5} />
      Replacement Required
    </span>
  );
}

/* ─────────────────────────  PAGE 3 · WORKER REQUEST DETAIL  ───────────────────────── */

function RequestDetailPage({ request, onBack }) {
  const [gpsExpanded, setGpsExpanded] = useState(false);
  const t = REQUEST_TYPES[request.type];
  const state = statusState(request.status);
  const Icon = t.icon;

  const timeline = [
    { actor: "Worker", text: "Request submitted", time: request.submittedAt },
    ...(request.status === "approved"
      ? [{ actor: "Supervisor", text: `Approved by ${request.approvedBy || "Supervisor"}`, time: "2026-04-23 08:15" }]
      : request.status === "rejected"
      ? [{ actor: "Supervisor", text: "Rejected", time: "2026-04-19 10:30", note: request.rejectedReason }]
      : []),
  ];

  return (
    <div>
      <TopBar title={t.label} onBack={onBack} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Status widget */}
        <WidgetShell accent={TOKENS.states[state].accent}>
          <WidgetHeader
            icon={Icon}
            label={t.id_label}
            right={
              <StatusBadge state={state}>
                {request.status === "pending" ? "Pending" : request.status === "approved" ? "Approved" : "Rejected"}
              </StatusBadge>
            }
          />
          <div style={{ padding: "0 16px 14px" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.45, margin: 0 }}>
              {buildHeadline(request)}
            </p>
            <p style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
              Submitted <span style={{ fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>{request.submittedAt}</span>
            </p>
            {request.status === "approved" && request.replacementRequired && (
              <div style={{ marginTop: 10 }}>
                <ReplacementBadge />
              </div>
            )}
          </div>
        </WidgetShell>

        {/* Request details */}
        <WidgetShell>
          <WidgetHeader icon={FileText} label="Request Detail" />
          <div style={{ padding: "0 16px 14px" }}>
            <DetailFields request={request} />
            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 10, paddingTop: 10 }}>
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                Reason
              </p>
              <p style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>
                {request.reason}
              </p>
            </div>
            {request.attachments > 0 && (
              <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 10, paddingTop: 10 }}>
                <div className="flex items-center" style={{ gap: 6, fontSize: 11.5, color: "#475569" }}>
                  <Paperclip size={12} strokeWidth={2.25} />
                  {request.attachments} attachment{request.attachments > 1 ? "s" : ""}
                </div>
              </div>
            )}
          </div>
        </WidgetShell>

        {/* Operational impact (if pending or has staffing data) */}
        {request.siteStaffing && (
          <OperationalImpactCard request={request} />
        )}

        {/* Verification Context — surfaced on detail for correction requests */}
        {(request.type === "attendance" || request.type === "time") && request.verification && (
          <VerificationContextWidget
            device={request.verification.device}
            location={request.verification.location}
            capturedAt={request.verification.capturedAt}
          />
        )}

        {/* Rejected reason callout */}
        {request.status === "rejected" && request.rejectedReason && (
          <WidgetShell accent={TOKENS.states.alert.accent}>
            <WidgetHeader icon={X} label="Rejection Reason" />
            <div style={{ padding: "0 16px 14px" }}>
              <div
                style={{
                  backgroundColor: TOKENS.states.alert.soft,
                  border: `1px solid ${TOKENS.states.alert.ring}`,
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <p style={{ fontSize: 12.5, color: "#7f1d1d", lineHeight: 1.5 }}>
                  {request.rejectedReason}
                </p>
              </div>
            </div>
          </WidgetShell>
        )}

        {/* Audit trail */}
        <WidgetShell>
          <WidgetHeader icon={Clock} label="Timeline" />
          <div style={{ padding: "0 16px 14px" }}>
            {timeline.map((e, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  paddingBottom: i < timeline.length - 1 ? 10 : 0,
                  borderBottom: i < timeline.length - 1 ? "1px solid #f1f5f9" : 0,
                  marginBottom: i < timeline.length - 1 ? 10 : 0,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: e.actor === "Supervisor"
                      ? (e.text === "Rejected" ? TOKENS.states.alert.pulse : TOKENS.states.active.pulse)
                      : TOKENS.states.offline.pulse,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 600 }}>
                    {e.text}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                    {e.actor} · {e.time}
                  </div>
                  {e.note && (
                    <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4, fontStyle: "italic" }}>
                      {e.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </WidgetShell>
      </div>
    </div>
  );
}

/** buildHeadline — operational sentence per request type */
function buildHeadline(r) {
  switch (r.type) {
    case "sick":
      return `Sick leave · ${r.dateFrom}${r.dateTo && r.dateTo !== r.dateFrom ? ` to ${r.dateTo}` : ""}`;
    case "permission":
      return `Permission · ${r.date} · ${r.startTime}–${r.endTime}`;
    case "leave":
      return `${r.leaveType || "Leave"} · ${r.startDate} to ${r.endDate}`;
    case "swap":
      return `Swap with ${r.replacementWorker}`;
    case "overtime":
      return `Overtime · ${r.date} · ${r.startTime}–${r.endTime}`;
    case "attendance":
      return `${r.issueType} · ${r.date}`;
    case "time":
      return `Time correction · ${r.date} → ${r.correctTime}`;
    default:
      return "Request";
  }
}

/** DetailFields — per-type field rendering */
function DetailFields({ request: r }) {
  const rows = [];
  if (r.dateFrom)       rows.push(["Date from",       r.dateFrom]);
  if (r.dateTo)         rows.push(["Date to",         r.dateTo]);
  if (r.date)           rows.push(["Date",            r.date]);
  if (r.startDate)      rows.push(["Start date",      r.startDate]);
  if (r.endDate)        rows.push(["End date",        r.endDate]);
  if (r.startTime)      rows.push(["Start time",      r.startTime, true]);
  if (r.endTime)        rows.push(["End time",        r.endTime, true]);
  if (r.leaveType)      rows.push(["Leave type",      r.leaveType]);
  if (r.yourShift)      rows.push(["Your shift",      r.yourShift]);
  if (r.replacementWorker) rows.push(["Replacement",  r.replacementWorker]);
  if (r.replacementShift)  rows.push(["Swap shift",   r.replacementShift]);
  if (r.issueType)      rows.push(["Issue type",      r.issueType]);
  if (r.correctTime)    rows.push(["Correct time",    r.correctTime, true]);
  if (r.currentTime)    rows.push(["Current time",    r.currentTime, true]);
  if (r.location)       rows.push(["Location",        r.location]);
  if (r.relatedTask)    rows.push(["Related task",    r.relatedTask]);
  if (r.shiftAffected)  rows.push(["Shift affected",  r.shiftAffected]);

  return (
    <div>
      {rows.map(([label, value, mono]) => (
        <MetaRow key={label} label={label} value={value} mono={mono} />
      ))}
    </div>
  );
}

/** OperationalImpactCard — the key differentiator from HR */
function OperationalImpactCard({ request }) {
  const { before, after } = request.siteStaffing;
  const delta = after - before;
  const stateKey = request.conflict ? "alert" : delta < 0 ? "idle" : "active";
  const token = TOKENS.states[stateKey];

  return (
    <WidgetShell accent={token.accent}>
      <WidgetHeader
        icon={Users}
        label="Operational Impact"
        right={
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#94a3b8",
            }}
          >
            Staffing
          </span>
        }
      />
      <div style={{ padding: "0 16px 14px" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", margin: 0, lineHeight: 1.45 }}>
          {request.conflict
            ? "Below minimum staffing threshold."
            : delta < 0
            ? `Site will operate at reduced capacity.`
            : `No net staffing change.`}
        </p>

        {/* Staffing visualization */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 12,
            padding: "12px",
            borderRadius: 10,
            backgroundColor: token.soft,
            border: `1px solid ${token.ring}`,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
              Current
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
              {before}
              <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginLeft: 4 }}>workers</span>
            </p>
          </div>
          <ChevronRight size={16} color="#94a3b8" />
          <div style={{ flex: 1, textAlign: "right" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
              After approval
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: token.accent, fontVariantNumeric: "tabular-nums", marginTop: 2 }}>
              {after}
              <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginLeft: 4 }}>workers</span>
            </p>
          </div>
        </div>

        {request.conflict && request.conflictReason && (
          <div
            style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 10,
              backgroundColor: TOKENS.states.alert.soft,
              border: `1px solid ${TOKENS.states.alert.ring}`,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle size={13} color={TOKENS.states.alert.accent} strokeWidth={2.25} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: TOKENS.states.alert.accent, margin: 0 }}>
                Conflict detected
              </p>
              <p style={{ fontSize: 11.5, color: "#7f1d1d", marginTop: 2, lineHeight: 1.45 }}>
                {request.conflictReason}
              </p>
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 12, paddingTop: 10 }}>
          <MetaRow label="Shift affected" value={request.shiftAffected || "—"} />
          <MetaRow label="Site" value={request.worker.site} />
        </div>
      </div>
    </WidgetShell>
  );
}

/* ─────────────────────────  PAGE 4 · SUPERVISOR APPROVAL LIST  ───────────────────────── */

function ApprovalListPage({ requests, onOpenRequest, onSwitchRole }) {
  const [tab, setTab] = useState("pending");

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  );

  const filtered = requests
    .filter((r) => r.status === tab)
    .sort((a, b) => {
      // Alert (conflict) first
      const aConflict = a.conflict ? 1 : 0;
      const bConflict = b.conflict ? 1 : 0;
      if (aConflict !== bConflict) return bConflict - aConflict;
      return a.submittedAt < b.submittedAt ? 1 : -1;
    });

  const conflictCount = filtered.filter((r) => r.conflict).length;

  return (
    <div>
      <TopBar
        title="Approvals"
        right={
          <button
            onClick={onSwitchRole}
            className="active:scale-[0.96] transition-transform"
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              backgroundColor: "white",
              color: "#334155",
              border: "1px solid #e2e8f0",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Shield size={11} strokeWidth={2.5} color="#64748b" />
            Supervisor
          </button>
        }
      />

      <div style={{ padding: 16 }}>
        {/* Triage summary */}
        <WidgetShell style={{ marginBottom: 14 }} accent={conflictCount > 0 ? TOKENS.states.alert.accent : counts.pending > 0 ? TOKENS.states.idle.accent : TOKENS.states.active.accent}>
          <WidgetHeader
            icon={ListChecks}
            label="Queue Summary"
            right={
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                Updated 2 min ago
              </span>
            }
          />
          <div style={{ padding: "0 16px 14px" }}>
            <p style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: 1.4 }}>
              {conflictCount > 0
                ? `${conflictCount} request${conflictCount > 1 ? "s" : ""} with staffing conflict.`
                : counts.pending > 0
                ? `${counts.pending} request${counts.pending > 1 ? "s" : ""} awaiting review.`
                : "Queue clear. All sites fully staffed."}
            </p>
            <div className="flex items-center" style={{ gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Building2 size={11} strokeWidth={2.25} />
                2 sites
              </span>
              <span style={{ color: "#e2e8f0" }}>·</span>
              <span style={{ fontSize: 11, color: "#64748b", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Users size={11} strokeWidth={2.25} />
                {new Set(requests.map((r) => r.worker.id)).size} workers
              </span>
            </div>
          </div>
        </WidgetShell>

        <div style={{ marginBottom: 12 }}>
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: "pending",  label: "Pending",  count: counts.pending },
              { key: "approved", label: "Approved", count: counts.approved },
              { key: "rejected", label: "Rejected", count: counts.rejected },
            ]}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 ? (
            <WidgetShell>
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#334155", margin: 0 }}>
                  No {tab} requests
                </p>
              </div>
            </WidgetShell>
          ) : (
            filtered.map((r) => (
              <RequestCard key={r.id} request={r} onClick={() => onOpenRequest(r.id)} showWorker />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  PAGE 5 · SUPERVISOR DETAIL + APPROVE/REJECT  ───────────────────────── */

function ApprovalDetailPage({ request, onBack, onDecision }) {
  const [showReject, setShowReject] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmed, setConfirmed] = useState(null); // { kind: "approved"|"rejected", replacementRequired? }

  const t = REQUEST_TYPES[request.type];
  const Icon = t.icon;
  const state = statusState(request.status);

  if (confirmed?.kind === "approved") {
    return (
      <SuccessState
        kind="approved"
        request={request}
        replacementRequired={confirmed.replacementRequired}
        onBack={onBack}
      />
    );
  }
  if (confirmed?.kind === "rejected") {
    return <SuccessState kind="rejected" request={request} onBack={onBack} />;
  }

  return (
    <div>
      <TopBar title="Review Request" onBack={onBack} />
      <div style={{ padding: 16, paddingBottom: 120, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Worker info */}
        <WidgetShell>
          <WidgetHeader icon={Shield} label="Worker" />
          <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                backgroundColor: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "#334155",
                flexShrink: 0,
              }}
            >
              {request.worker.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>
                {request.worker.name}
              </p>
              <p style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                {request.worker.role} · {request.worker.site}
              </p>
            </div>
          </div>
        </WidgetShell>

        {/* Request detail */}
        <WidgetShell accent={TOKENS.states[state].accent}>
          <WidgetHeader
            icon={Icon}
            label={t.id_label}
            right={
              <StatusBadge state={state}>
                {request.status === "pending" ? "Pending" : request.status === "approved" ? "Approved" : "Rejected"}
              </StatusBadge>
            }
          />
          <div style={{ padding: "0 16px 14px" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.45, margin: 0 }}>
              {buildHeadline(request)}
            </p>
            <p style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
              Submitted <span style={{ fontFamily: "ui-monospace, monospace", fontVariantNumeric: "tabular-nums" }}>{request.submittedAt}</span>
            </p>
            {request.status === "approved" && request.replacementRequired && (
              <div style={{ marginTop: 10 }}>
                <ReplacementBadge />
              </div>
            )}

            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 12, paddingTop: 10 }}>
              <DetailFields request={request} />
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 10, paddingTop: 10 }}>
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                Reason
              </p>
              <p style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>
                {request.reason}
              </p>
            </div>

            {request.attachments > 0 && (
              <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 10, paddingTop: 10 }}>
                <p
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: 8,
                  }}
                >
                  Attachments
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Array.from({ length: request.attachments }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 10,
                        backgroundColor: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Paperclip size={16} color="#94a3b8" strokeWidth={2.25} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </WidgetShell>

        {/* Operational impact — the whole point */}
        {request.siteStaffing && <OperationalImpactCard request={request} />}

        {/* Verification Context — evidence the supervisor uses to judge correction validity */}
        {(request.type === "attendance" || request.type === "time") && request.verification && (
          <VerificationContextWidget
            device={request.verification.device}
            location={request.verification.location}
            capturedAt={request.verification.capturedAt}
          />
        )}
      </div>

      {/* Sticky action bar */}
      {request.status === "pending" && (
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
            backgroundColor: "rgba(248,250,252,0.94)",
            backdropFilter: "blur(8px)",
            borderTop: "1px solid #eef2f6",
            display: "flex",
            gap: 10,
          }}
        >
          <button
            onClick={() => setShowReject(true)}
            className="active:scale-[0.98] transition-transform"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              fontSize: 13.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              border: 0,
              cursor: "pointer",
            }}
          >
            <X size={15} strokeWidth={2.5} />
            Reject
          </button>
          <button
            onClick={() => setShowApprove(true)}
            className="active:scale-[0.98] transition-transform"
            style={{
              flex: 1.4,
              padding: "12px 16px",
              borderRadius: 12,
              backgroundColor: "#0f172a",
              color: "white",
              fontSize: 13.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              border: 0,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
            }}
          >
            <Check size={15} strokeWidth={2.5} />
            Approve
          </button>
        </div>
      )}

      {showApprove && (
        <ConfirmModal
          kind="approve"
          request={request}
          onCancel={() => setShowApprove(false)}
          onConfirm={({ replacementRequired }) => {
            setShowApprove(false);
            onDecision(request.id, "approved", { replacementRequired });
            setConfirmed({ kind: "approved", replacementRequired });
          }}
        />
      )}
      {showReject && (
        <ConfirmModal
          kind="reject"
          request={request}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onCancel={() => setShowReject(false)}
          onConfirm={({ rejectedReason }) => {
            if (!rejectedReason || !rejectedReason.trim()) return;
            setShowReject(false);
            onDecision(request.id, "rejected", { rejectedReason });
            setConfirmed({ kind: "rejected" });
          }}
        />
      )}
    </div>
  );
}

/** ConfirmModal — approve or reject confirmation */
function ConfirmModal({ kind, request, reason, onReasonChange, onCancel, onConfirm }) {
  const isReject = kind === "reject";
  const accent = isReject ? TOKENS.states.alert.accent : "#0f172a";

  /* Approve flow: supervisor must explicitly pick a replacement decision.
     null = unselected (button disabled — forces a conscious choice). */
  const [replacementRequired, setReplacementRequired] = useState(null);

  const disabled = isReject
    ? !reason?.trim()
    : replacementRequired === null;

  const handleConfirm = () => {
    if (disabled) return;
    if (isReject) {
      onConfirm({ rejectedReason: reason });
    } else {
      onConfirm({ replacementRequired });
    }
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          maxHeight: "92vh",
          overflowY: "auto",
          backgroundColor: "white",
          borderRadius: 22,
          position: "relative",
          boxShadow: "0 25px 50px -12px rgba(15,23,42,0.35)",
        }}
      >
        <div style={{ position: "absolute", inset: "0 0 auto 0", height: 1, backgroundColor: accent }} />
        <div style={{ padding: "18px 18px 14px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                backgroundColor: isReject ? TOKENS.states.alert.soft : "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isReject ? (
                <X size={15} color={TOKENS.states.alert.accent} strokeWidth={2.5} />
              ) : (
                <Check size={15} color="#0f172a" strokeWidth={2.5} />
              )}
            </div>
            <button
              onClick={onCancel}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "transparent",
                border: 0,
                color: "#94a3b8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {isReject ? "Reject request?" : "Confirm Approval"}
          </h3>
          <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
            {isReject
              ? "The worker will be notified with your reason. Their shift assignment will remain unchanged."
              : `Shift assignment will update and site staffing will adjust to ${request.siteStaffing?.after ?? "—"} workers.`}
          </p>

          {/* Summary card — always shown (Approve & Reject) */}
          <div
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: 10,
              padding: 12,
              marginTop: 12,
              border: "1px solid #eef2f6",
            }}
          >
            <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 6 }}>
              Summary
            </p>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", margin: 0 }}>
              {request.worker.name} · {REQUEST_TYPES[request.type].label}
            </p>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              {request.shiftAffected || "—"}
            </p>
            {request.siteStaffing && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px solid #eef2f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Site staffing</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#334155",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {request.siteStaffing.before} → {request.siteStaffing.after}
                  {request.conflict && (
                    <span style={{ color: TOKENS.states.alert.accent, marginLeft: 6 }}>⚠</span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Approve flow — Operational Decision radio group */}
          {!isReject && (
            <div style={{ marginTop: 14 }}>
              <p
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                Operational Decision <span style={{ color: "#dc2626" }}>*</span>
              </p>

              <RadioOption
                selected={replacementRequired === false}
                onSelect={() => setReplacementRequired(false)}
                title="Proceed without replacement"
                helper="Shift will operate at reduced capacity for this period."
                tone="neutral"
              />

              <RadioOption
                selected={replacementRequired === true}
                onSelect={() => setReplacementRequired(true)}
                title="Require replacement"
                helper="This will mark the shift as needing replacement."
                tone="alert"
                icon={AlertTriangle}
              />
            </div>
          )}

          {/* Reject flow — reason textarea */}
          {isReject && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#64748b", display: "block", marginBottom: 6 }}>
                Reason <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                rows={3}
                autoFocus
                value={reason || ""}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Explain why this can't be approved…"
                style={{ ...inputStyle, resize: "vertical", fontFamily: TOKENS.font }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            padding: "10px 16px 16px",
            display: "flex",
            gap: 10,
            position: "sticky",
            bottom: 0,
            backgroundColor: "white",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <button
            onClick={onCancel}
            className="active:scale-[0.98] transition-transform"
            style={{
              flex: 1,
              padding: "11px 14px",
              borderRadius: 12,
              backgroundColor: "white",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid #e2e8f0",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className="active:scale-[0.98] transition-transform"
            style={{
              flex: 1.4,
              padding: "11px 14px",
              borderRadius: 12,
              backgroundColor: isReject ? "#dc2626" : "#0f172a",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              border: 0,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.4 : 1,
            }}
          >
            {isReject ? "Confirm Rejection" : "Confirm Approval"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** RadioOption — operational decision picker. Tone="alert" shades the row red when selected. */
function RadioOption({ selected, onSelect, title, helper, tone = "neutral", icon: Icon }) {
  const isAlert = tone === "alert";
  const token = TOKENS.states.alert;
  const borderColor = selected
    ? isAlert
      ? token.accent
      : "#0f172a"
    : "#e2e8f0";
  const bgColor = selected && isAlert ? token.soft : "white";

  return (
    <button
      onClick={onSelect}
      className="active:scale-[0.99] transition-transform"
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 12px",
        borderRadius: 12,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: selected ? `0 0 0 3px ${isAlert ? token.ring : "rgba(15,23,42,0.08)"}` : "none",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        marginBottom: 8,
        cursor: "pointer",
      }}
    >
      {/* Radio dot */}
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 999,
          border: `1.5px solid ${selected ? (isAlert ? token.accent : "#0f172a") : "#cbd5e1"}`,
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {selected && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: isAlert ? token.accent : "#0f172a",
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isAlert && selected ? token.accent : "#0f172a",
            }}
          >
            {title}
          </span>
          {Icon && (
            <Icon
              size={12}
              strokeWidth={2.5}
              color={isAlert ? token.accent : "#94a3b8"}
            />
          )}
        </div>
        <p
          style={{
            fontSize: 11.5,
            color: isAlert && selected ? "#7f1d1d" : "#64748b",
            marginTop: 2,
            lineHeight: 1.4,
          }}
        >
          {helper}
        </p>
      </div>
    </button>
  );
}

/** SuccessState — post-decision */
function SuccessState({ kind, request, onBack, replacementRequired = false }) {
  const isApproved = kind === "approved";
  const token = TOKENS.states[isApproved ? "active" : "alert"];
  return (
    <div>
      <TopBar title="Decision recorded" onBack={onBack} />
      <div style={{ padding: 16 }}>
        <WidgetShell accent={token.accent}>
          <div style={{ padding: "24px 18px 20px", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                backgroundColor: token.soft,
                border: `1px solid ${token.ring}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              {isApproved ? (
                <Check size={22} color={token.accent} strokeWidth={2.5} />
              ) : (
                <X size={22} color={token.accent} strokeWidth={2.5} />
              )}
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {isApproved ? "Request approved" : "Request rejected"}
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>
              {isApproved
                ? replacementRequired
                  ? "Schedule updated and shift flagged for replacement. Worker notified via push."
                  : "Schedule updated. Worker notified via push."
                : "Worker notified with your reason."}
            </p>

            {/* Replacement Required badge — surfaced front-and-center on success */}
            {isApproved && replacementRequired && (
              <div style={{ marginTop: 12 }}>
                <ReplacementBadge />
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: "#f8fafc",
                border: "1px solid #eef2f6",
                textAlign: "left",
              }}
            >
              <MetaRow label="Worker" value={request.worker.name} />
              <MetaRow label="Type" value={REQUEST_TYPES[request.type].label} />
              <MetaRow label="Shift" value={request.shiftAffected || "—"} />
              {isApproved && request.siteStaffing && (
                <MetaRow
                  label="New staffing"
                  value={`${request.siteStaffing.after} workers`}
                  mono
                />
              )}
              {isApproved && (
                <MetaRow
                  label="Replacement"
                  value={replacementRequired ? "Required" : "Not required"}
                />
              )}
              <MetaRow
                label="Recorded"
                value={new Date().toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                mono
              />
            </div>
          </div>
          <div style={{ padding: "0 16px 16px" }}>
            <PrimaryButton onClick={onBack}>Back to queue</PrimaryButton>
          </div>
        </WidgetShell>
      </div>
    </div>
  );
}

/* ─────────────────────────  ROOT · DEMO NAVIGATION  ───────────────────────── */

export default function RequestApprovalModule() {
  const [role, setRole] = useState("worker"); // "worker" | "supervisor"
  const [route, setRoute] = useState({ page: "list" });
  const [requests, setRequests] = useState(() => [...MOCK_REQUESTS]);
  const [supervisorQueue, setSupervisorQueue] = useState(() => [...SUPERVISOR_QUEUE]);

  const allRequests = role === "worker" ? requests : supervisorQueue;
  const current = allRequests.find((r) => r.id === route.id);

  const submitRequest = (data) => {
    const isCorrection = data.type === "attendance" || data.type === "time";
    const nowStamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const newReq = {
      id: `req_${Date.now()}`,
      status: "pending",
      submittedAt: nowStamp,
      worker: CURRENT_WORKER,
      shiftAffected: CURRENT_WORKER.shift,
      siteStaffing: { before: 5, after: 4 },
      conflict: false,
      ...data,
      ...(isCorrection && {
        verification: {
          device: "Samsung Galaxy S21 · Android 13",
          location: "-6.201, 106.816 · ±8m",
          capturedAt: nowStamp,
        },
      }),
    };
    setRequests((r) => [newReq, ...r]);
    setSupervisorQueue((q) => [newReq, ...q]);
    setRoute({ page: "list" });
  };

  const decide = (id, status, { rejectedReason, replacementRequired } = {}) => {
    const patch = {
      status,
      rejectedReason: rejectedReason || undefined,
      approvedBy: status === "approved" ? "Rina (Supervisor)" : undefined,
      replacementRequired:
        status === "approved" ? !!replacementRequired : undefined,
    };
    setSupervisorQueue((q) =>
      q.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
    setRequests((q) =>
      q.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  /* Role switcher — not part of the final app, just for demo */
  const RoleSwitcher = () => (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        padding: "8px 12px",
        backgroundColor: "#0f172a",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
    >
      <span style={{ color: "#94a3b8" }}>Demo · Viewing as</span>
      <div style={{ display: "flex", gap: 4, padding: 3, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 8 }}>
        <button
          onClick={() => { setRole("worker"); setRoute({ page: "list" }); }}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            backgroundColor: role === "worker" ? "white" : "transparent",
            color: role === "worker" ? "#0f172a" : "#cbd5e1",
            border: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Worker
        </button>
        <button
          onClick={() => { setRole("supervisor"); setRoute({ page: "list" }); }}
          style={{
            padding: "4px 10px",
            borderRadius: 6,
            backgroundColor: role === "supervisor" ? "white" : "transparent",
            color: role === "supervisor" ? "#0f172a" : "#cbd5e1",
            border: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Supervisor
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        fontFamily: TOKENS.font,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
        color: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 430, margin: "0 auto", backgroundColor: "transparent" }}>
        <RoleSwitcher />

        {role === "worker" && route.page === "list" && (
          <RequestListPage
            requests={requests}
            onOpenRequest={(id) => setRoute({ page: "detail", id })}
            onCreateNew={() => setRoute({ page: "form" })}
          />
        )}

        {role === "worker" && route.page === "form" && (
          <RequestFormPage onCancel={() => setRoute({ page: "list" })} onSubmit={submitRequest} />
        )}

        {role === "worker" && route.page === "detail" && current && (
          <RequestDetailPage request={current} onBack={() => setRoute({ page: "list" })} />
        )}

        {role === "supervisor" && route.page === "list" && (
          <ApprovalListPage
            requests={supervisorQueue}
            onOpenRequest={(id) => setRoute({ page: "detail", id })}
            onSwitchRole={() => setRole("worker")}
          />
        )}

        {role === "supervisor" && route.page === "detail" && current && (
          <ApprovalDetailPage
            request={current}
            onBack={() => setRoute({ page: "list" })}
            onDecision={decide}
          />
        )}
      </div>
    </div>
  );
}
