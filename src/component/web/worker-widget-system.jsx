import React, { useState, useEffect } from "react";
import {
  MapPin,
  Activity,
  Clock,
  Shield,
  RefreshCw,
  Map as MapIcon,
  QrCode,
  FileText,
  LogOut,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ChevronRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
   Single source of truth for the entire widget system.
   ═══════════════════════════════════════════════════════════════ */
const TOKENS = {
  states: {
    active: {
      key: "active",
      label: "Active",
      accent: "#16a34a",
      soft: "#dcfce7",
      ring: "rgba(22,163,74,0.18)",
      pulse: "#22c55e",
    },
    idle: {
      key: "idle",
      label: "Idle",
      accent: "#b45309",
      soft: "#fef3c7",
      ring: "rgba(180,83,9,0.18)",
      pulse: "#f59e0b",
    },
    offline: {
      key: "offline",
      label: "Offline",
      accent: "#64748b",
      soft: "#f1f5f9",
      ring: "rgba(100,116,139,0.18)",
      pulse: "#94a3b8",
    },
    alert: {
      key: "alert",
      label: "Alert",
      accent: "#dc2626",
      soft: "#fee2e2",
      ring: "rgba(220,38,38,0.18)",
      pulse: "#ef4444",
    },
  },
};

/* ═══════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
   ═══════════════════════════════════════════════════════════════ */
const WidgetShell = ({ children, compact = false, className = "" }) => (
  <div
    className={`bg-white overflow-hidden ${className}`}
    style={{
      borderRadius: compact ? 14 : 18,
      boxShadow:
        "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)",
      border: "1px solid #eef2f6",
    }}
  >
    {children}
  </div>
);

const WidgetHeader = ({ icon: Icon, title, accent, rightSlot }) => (
  <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center"
        style={{ backgroundColor: "#f1f5f9" }}
      >
        <Icon size={13} className="text-slate-500" strokeWidth={2.25} />
      </div>
      <span className="text-[10.5px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
        {title}
      </span>
    </div>
    {rightSlot}
  </div>
);

const StatusPill = ({ state }) => (
  <div
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
    style={{ backgroundColor: state.soft, color: state.accent }}
  >
    <span className="relative flex h-1.5 w-1.5">
      {state.key !== "offline" && (
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
          style={{ backgroundColor: state.pulse }}
        />
      )}
      <span
        className="relative inline-flex rounded-full h-1.5 w-1.5"
        style={{ backgroundColor: state.pulse }}
      />
    </span>
    <span className="text-[10.5px] font-semibold tracking-wide">
      {state.label}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   WIDGET 1 — CORE HEADER
   ═══════════════════════════════════════════════════════════════ */
const CoreHeaderWidget = ({
  stateKey = "active",
  name = "Rangga Saputra",
  role = "Security Officer",
  site = "Menara BCA",
  shift = "08:00 – 16:00",
  initials = "RS",
  compact = false,
}) => {
  const state = TOKENS.states[stateKey];
  return (
    <WidgetShell compact={compact}>
      {/* Accent strip */}
      <div className="h-1" style={{ backgroundColor: state.accent }} />
      <div className={`px-4 ${compact ? "py-3" : "py-4"} flex items-center gap-3`}>
        <div className="relative flex-shrink-0">
          <div
            className={`${
              compact ? "w-9 h-9 text-[12px]" : "w-11 h-11 text-[13px]"
            } rounded-full flex items-center justify-center text-white font-semibold tracking-wide`}
            style={{
              background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
            }}
          >
            {initials}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
            style={{ backgroundColor: state.pulse }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold text-slate-900 truncate ${
              compact ? "text-[13.5px]" : "text-[15px]"
            } leading-tight`}
          >
            {name}
          </div>
          <div
            className={`text-slate-500 truncate mt-0.5 ${
              compact ? "text-[11px]" : "text-[12px]"
            }`}
          >
            {role} · {site}
          </div>
          {!compact && shift && (
            <div className="flex items-center gap-1 mt-1.5 text-[10.5px] text-slate-400">
              <Clock size={10} strokeWidth={2.5} />
              <span className="font-medium">Shift {shift}</span>
            </div>
          )}
        </div>
        <StatusPill state={state} />
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WIDGET 2 — LOCATION
   ═══════════════════════════════════════════════════════════════ */
const LOCATION_DATA = {
  active: {
    status: "Inside Site",
    dot: "#16a34a",
    address: "Menara BCA, Jl. MH Thamrin No.1",
    accuracy: "High ±8m",
    updated: "12s ago",
  },
  idle: {
    status: "Near Boundary",
    dot: "#d97706",
    address: "Menara BCA — East Perimeter",
    accuracy: "Medium ±22m",
    updated: "6 min ago",
  },
  alert: {
    status: "Outside Site",
    dot: "#dc2626",
    address: "~340m NE of assigned site",
    accuracy: "High ±11m",
    updated: "just now",
  },
};

const LocationWidget = ({ stateKey = "active", compact = false }) => {
  const state = TOKENS.states[stateKey];
  const data = LOCATION_DATA[stateKey] || LOCATION_DATA.active;

  if (compact) {
    return (
      <WidgetShell compact>
        <div className="px-3.5 py-3 flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: state.soft }}
          >
            <MapPin size={13} style={{ color: state.accent }} strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[12px] font-semibold truncate"
              style={{ color: data.dot }}
            >
              {data.status}
            </div>
            <div className="text-[10.5px] text-slate-500 truncate">
              {data.accuracy} · {data.updated}
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-300" />
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell>
      <WidgetHeader icon={MapPin} title="Location" />
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: data.dot }}
          />
          <span
            className="text-[13px] font-semibold"
            style={{ color: data.dot }}
          >
            {data.status}
          </span>
        </div>
        <div className="text-[12.5px] text-slate-700 truncate">
          {data.address}
        </div>
        <div className="flex items-center gap-2.5 mt-1.5 mb-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Zap size={10} strokeWidth={2.5} />
            {data.accuracy}
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
          <span>Updated {data.updated}</span>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-slate-50"
            style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
          >
            <MapIcon size={13} strokeWidth={2.25} />
            View Map
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} strokeWidth={2.25} />
            Refresh
          </button>
        </div>
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WIDGET 3 — ACTIVITY
   ═══════════════════════════════════════════════════════════════ */
const ACTIVITY_DATA = {
  active: {
    current: "Patrol Area B",
    last: "Checkpoint CP-04 scanned",
    progress: { done: 3, total: 5 },
  },
  idle: {
    current: "Awaiting next patrol",
    last: "Checkpoint CP-02 scanned",
    progress: { done: 2, total: 5 },
  },
  alert: {
    current: "Unassigned movement",
    last: "Left geofence at 11:51",
    progress: { done: 3, total: 5 },
  },
};

const ActivityWidget = ({ stateKey = "active", compact = false }) => {
  const state = TOKENS.states[stateKey];
  const data = ACTIVITY_DATA[stateKey] || ACTIVITY_DATA.active;

  if (compact) {
    return (
      <WidgetShell compact>
        <div className="px-3.5 py-3 flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#f1f5f9" }}
          >
            <Activity size={13} className="text-slate-500" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-slate-900 truncate">
              {data.current}
            </div>
            <div className="text-[10.5px] text-slate-500 truncate">
              {data.progress.done}/{data.progress.total} checkpoints
            </div>
          </div>
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell>
      <WidgetHeader icon={Activity} title="Activity" />
      <div className="px-4 pb-4">
        <div className="text-[14px] font-semibold text-slate-900 mb-0.5">
          {data.current}
        </div>
        <div className="text-[12px] text-slate-500 mb-3">{data.last}</div>

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-500 font-medium">
            Checkpoint progress
          </span>
          <span className="text-[11px] text-slate-700 font-semibold tabular-nums">
            {data.progress.done} / {data.progress.total}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: data.progress.total }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1.5 rounded-full transition-colors"
              style={{
                backgroundColor:
                  i < data.progress.done ? state.accent : "#e2e8f0",
              }}
            />
          ))}
        </div>
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WIDGET 4 — TIME / PRESENCE
   ═══════════════════════════════════════════════════════════════ */
const TIME_DATA = {
  active: { checkIn: "08:02", lastMove: "11:44", lastActivity: "11:42" },
  idle: { checkIn: "08:02", lastMove: "11:38", lastActivity: "11:29" },
  alert: { checkIn: "08:02", lastMove: "11:58", lastActivity: "11:51" },
};

const TimeWidget = ({ stateKey = "active", compact = false }) => {
  const data = TIME_DATA[stateKey] || TIME_DATA.active;

  if (compact) {
    return (
      <WidgetShell compact>
        <div className="px-3.5 py-3 flex items-center gap-3 text-[11px]">
          <Clock size={13} className="text-slate-400" strokeWidth={2.25} />
          <div className="flex items-center gap-3 flex-1">
            <div>
              <span className="text-slate-400">In </span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                {data.checkIn}
              </span>
            </div>
            <div className="w-0.5 h-0.5 rounded-full bg-slate-300" />
            <div>
              <span className="text-slate-400">Last </span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums">
                {data.lastActivity}
              </span>
            </div>
          </div>
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell>
      <WidgetHeader icon={Clock} title="Time & Presence" />
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Check-in", value: data.checkIn },
            { label: "Last move", value: data.lastMove },
            { label: "Last action", value: data.lastActivity },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-lg py-2.5 px-2.5"
              style={{ backgroundColor: "#f8fafc" }}
            >
              <div className="text-[9.5px] text-slate-500 font-medium uppercase tracking-wider mb-1">
                {t.label}
              </div>
              <div className="text-[14px] font-semibold text-slate-900 font-mono tabular-nums">
                {t.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WIDGET 5 — TRUST / STATUS
   ═══════════════════════════════════════════════════════════════ */
const TRUST_DATA = {
  active: {
    value: 92,
    label: "Good",
    insight: "Active inside site, last patrol 2 minutes ago.",
  },
  idle: {
    value: 68,
    label: "Warning",
    insight: "No movement for 12 minutes near east perimeter.",
  },
  alert: {
    value: 41,
    label: "Risk",
    insight: "Worker outside assigned site for 7 minutes.",
  },
};

const TrustWidget = ({ stateKey = "active", compact = false }) => {
  const state = TOKENS.states[stateKey];
  const data = TRUST_DATA[stateKey] || TRUST_DATA.active;
  const InsightIcon =
    stateKey === "alert"
      ? AlertTriangle
      : stateKey === "idle"
      ? Clock
      : CheckCircle2;

  if (compact) {
    return (
      <WidgetShell compact>
        <div className="px-3.5 py-3 flex items-center gap-3">
          <Shield size={13} className="text-slate-400" strokeWidth={2.25} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium text-slate-500">
                Trust
              </span>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: state.accent }}
              >
                {data.value}
              </span>
            </div>
            <div
              className="w-full h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "#f1f5f9" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${data.value}%`,
                  backgroundColor: state.accent,
                }}
              />
            </div>
          </div>
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell>
      <WidgetHeader icon={Shield} title="Trust & Status" />
      <div className="px-4 pb-4">
        {/* Insight sentence */}
        <div
          className="rounded-lg px-3 py-2.5 flex items-start gap-2 mb-3.5"
          style={{
            backgroundColor: state.soft,
            border: `1px solid ${state.ring}`,
          }}
        >
          <InsightIcon
            size={13}
            style={{ color: state.accent, marginTop: 1 }}
            strokeWidth={2.5}
          />
          <p
            className="text-[12px] font-medium leading-snug"
            style={{ color: state.accent }}
          >
            {data.insight}
          </p>
        </div>

        {/* Score */}
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-[26px] font-bold tabular-nums leading-none"
              style={{ color: state.accent }}
            >
              {data.value}
            </span>
            <span className="text-[13px] text-slate-400 font-medium">/100</span>
          </div>
          <span
            className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: state.soft, color: state.accent }}
          >
            {data.label}
          </span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "#f1f5f9" }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${data.value}%`,
              backgroundColor: state.accent,
            }}
          />
        </div>
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WIDGET 6 — ACTION
   ═══════════════════════════════════════════════════════════════ */
const ActionWidget = () => (
  <WidgetShell>
    <WidgetHeader icon={Zap} title="Actions" />
    <div className="px-4 pb-4">
      <button
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[13.5px] text-white mb-2 transition-all active:scale-[0.98]"
        style={{
          backgroundColor: "#0f172a",
          boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
        }}
      >
        <QrCode size={15} strokeWidth={2.25} />
        Scan Patrol Checkpoint
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-[12.5px] border transition-colors hover:bg-slate-50"
          style={{ borderColor: "#e2e8f0", color: "#334155" }}
        >
          <FileText size={13} strokeWidth={2.25} />
          Submit Report
        </button>
        <button
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-[12.5px] transition-colors"
          style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}
        >
          <LogOut size={13} strokeWidth={2.25} />
          Check-out
        </button>
      </div>
    </div>
  </WidgetShell>
);

/* ═══════════════════════════════════════════════════════════════
   LAYOUT HELPERS
   ═══════════════════════════════════════════════════════════════ */
const SectionLabel = ({ number, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-4 max-w-xl">
    <div
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
      style={{
        background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
      }}
    >
      {number}
    </div>
    <div>
      <h2 className="text-[15px] font-bold text-slate-900 tracking-tight leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>
      )}
    </div>
  </div>
);

const StateLabel = ({ stateKey }) => {
  const s = TOKENS.states[stateKey];
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-[0.1em] uppercase mb-2"
      style={{ backgroundColor: s.soft, color: s.accent }}
    >
      <span
        className="w-1 h-1 rounded-full"
        style={{ backgroundColor: s.pulse }}
      />
      {s.label}
    </div>
  );
};

const StateColumn = ({ stateKey, children }) => (
  <div>
    <StateLabel stateKey={stateKey} />
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN SHOWCASE
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const states = ["active", "idle", "alert"];

  return (
    <div
      className="min-h-screen w-full py-10 px-6"
      style={{
        background:
          "radial-gradient(1400px 700px at 50% -10%, #e2e8f0 0%, #f8fafc 45%, #f1f5f9 100%)",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Top Header ──────────────────────────── */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-2">
          Design System · v1.0
        </div>
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">
          Worker Operational UI System
        </h1>
        <p className="text-[14px] text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Six modular widgets that compose into a real-time operational view of
          a field worker. Each widget is visually independent and can be used
          standalone, in compact mode, or combined into a full detail view.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* ═══════════════════════════════════════
            WIDGET 1 — CORE HEADER
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="1"
          title="Core Header"
          subtitle="Identity + high-level status. Always visible; acts as the anchor."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {states.map((s) => (
            <StateColumn key={s} stateKey={s}>
              <CoreHeaderWidget stateKey={s} />
            </StateColumn>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            WIDGET 2 — LOCATION
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="2"
          title="Location"
          subtitle="Validates physical presence. Geofence status, accuracy, and freshness."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {states.map((s) => (
            <StateColumn key={s} stateKey={s}>
              <LocationWidget stateKey={s} />
            </StateColumn>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            WIDGET 3 — ACTIVITY
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="3"
          title="Activity"
          subtitle="Current task, last action, and progress signals."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {states.map((s) => (
            <StateColumn key={s} stateKey={s}>
              <ActivityWidget stateKey={s} />
            </StateColumn>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            WIDGET 4 — TIME / PRESENCE
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="4"
          title="Time & Presence"
          subtitle="Detects whether the worker is actually active vs. just online."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {states.map((s) => (
            <StateColumn key={s} stateKey={s}>
              <TimeWidget stateKey={s} />
            </StateColumn>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            WIDGET 5 — TRUST / STATUS
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="5"
          title="Trust & Status"
          subtitle="Summarizes reliability. The supervisor's at-a-glance verdict."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {states.map((s) => (
            <StateColumn key={s} stateKey={s}>
              <TrustWidget stateKey={s} />
            </StateColumn>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            WIDGET 6 — ACTION
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="6"
          title="Action"
          subtitle="Worker-only widget. Primary task triggers + destructive actions."
        />
        <div className="max-w-md mb-16">
          <ActionWidget />
        </div>

        {/* ═══════════════════════════════════════
            RESPONSIVE BEHAVIOR
            ═══════════════════════════════════════ */}
        <div className="border-t border-slate-200 pt-10 mb-10">
          <div className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-2">
            Responsive behavior
          </div>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Three viewing contexts
          </h2>
          <p className="text-[13px] text-slate-500 mt-1.5 max-w-2xl">
            The same widgets adapt to context: stacked on mobile, condensed in
            list/map popups, and fully expanded on the worker detail screen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── MOBILE STACKED ──────────────────── */}
          <div>
            <div className="mb-4">
              <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-1">
                A — Mobile (Worker App)
              </div>
              <div className="text-[12px] text-slate-500">
                Full stack, all widgets visible
              </div>
            </div>
            <div
              className="p-3 rounded-2xl"
              style={{
                background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                boxShadow: "0 20px 40px -20px rgba(15,23,42,0.3)",
              }}
            >
              <div
                className="p-3 space-y-3 rounded-xl"
                style={{ background: "#f8fafc" }}
              >
                <CoreHeaderWidget stateKey="active" />
                <LocationWidget stateKey="active" />
                <ActivityWidget stateKey="active" />
                <TimeWidget stateKey="active" />
                <TrustWidget stateKey="active" />
                <ActionWidget />
              </div>
            </div>
          </div>

          {/* ── COMPACT MODE ────────────────────── */}
          <div>
            <div className="mb-4">
              <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-1">
                B — Compact (List / Map Popup)
              </div>
              <div className="text-[12px] text-slate-500">
                Dense, scannable rows for supervisor lists
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  s: "active",
                  name: "Rangga Saputra",
                  role: "Security",
                  site: "Menara BCA",
                  initials: "RS",
                },
                {
                  s: "idle",
                  name: "Dewi Anggraini",
                  role: "Cleaning",
                  site: "Gedung Wisma 46",
                  initials: "DA",
                },
                {
                  s: "alert",
                  name: "Budi Hartono",
                  role: "Technician",
                  site: "Gandaria City",
                  initials: "BH",
                },
              ].map((w) => (
                <div key={w.name}>
                  <CoreHeaderWidget
                    stateKey={w.s}
                    name={w.name}
                    role={w.role}
                    site={w.site}
                    initials={w.initials}
                    compact
                  />
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <LocationWidget stateKey={w.s} compact />
                    <div className="grid grid-cols-2 gap-2">
                      <ActivityWidget stateKey={w.s} compact />
                      <TrustWidget stateKey={w.s} compact />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SUPERVISOR DETAIL VIEW ──────────── */}
          <div>
            <div className="mb-4">
              <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-1">
                C — Supervisor Detail (Alert)
              </div>
              <div className="text-[12px] text-slate-500">
                Full view, Action widget omitted
              </div>
            </div>
            <div className="space-y-3">
              <CoreHeaderWidget stateKey="alert" />
              <TrustWidget stateKey="alert" />
              <LocationWidget stateKey="alert" />
              <ActivityWidget stateKey="alert" />
              <TimeWidget stateKey="alert" />
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="border-t border-slate-200 mt-16 pt-8 pb-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { k: "Widgets", v: "6" },
            { k: "State variants", v: "4" },
            { k: "Layout modes", v: "3" },
            { k: "Design tokens", v: "1 source" },
          ].map((stat) => (
            <div key={stat.k}>
              <div className="text-[22px] font-bold text-slate-900 tabular-nums">
                {stat.v}
              </div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                {stat.k}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
