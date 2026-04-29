import React from "react";
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
  AlertTriangle,
  CheckCircle2,
  Zap,
  MessageSquare,
  WifiOff,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════ */
const TOKENS = {
  states: {
    active:  { key: "active",  label: "Active",  accent: "#16a34a", soft: "#dcfce7", ring: "rgba(22,163,74,0.18)",  pulse: "#22c55e" },
    idle:    { key: "idle",    label: "Idle",    accent: "#b45309", soft: "#fef3c7", ring: "rgba(180,83,9,0.18)",   pulse: "#f59e0b" },
    offline: { key: "offline", label: "Offline", accent: "#64748b", soft: "#f1f5f9", ring: "rgba(100,116,139,0.18)", pulse: "#94a3b8" },
    alert:   { key: "alert",   label: "Alert",   accent: "#dc2626", soft: "#fee2e2", ring: "rgba(220,38,38,0.18)",  pulse: "#ef4444" },
  },
};

/* ═══════════════════════════════════════════════════════════════
   STATUS RESOLVER  (behavior-driven, not visual-driven)
   ───────────────────────────────────────────────────────────────
   The state is DERIVED from operational signals, not assigned by
   the UI. This is the single rules engine the whole system reads.
   
   Rules (in priority order — first match wins):
   ───────────────────────────────────────────────────────────────
   1. ALERT    → outside geofence OR explicit anomaly flag
   2. OFFLINE  → no GPS/heartbeat signal for > OFFLINE_THRESHOLD min
   3. IDLE     → no activity event for > IDLE_THRESHOLD min
   4. ACTIVE   → fallback (recent signal + recent activity + on-site)
   ═══════════════════════════════════════════════════════════════ */
const RULES = {
  IDLE_THRESHOLD_MIN: 10,    // No activity > 10 min  → Idle
  OFFLINE_THRESHOLD_MIN: 5,  // No GPS heartbeat > 5 min → Offline
};

function resolveStatus(signals) {
  // signals = { onSite, anomaly, minsSinceHeartbeat, minsSinceActivity }
  if (!signals.onSite || signals.anomaly) return "alert";
  if (signals.minsSinceHeartbeat > RULES.OFFLINE_THRESHOLD_MIN) return "offline";
  if (signals.minsSinceActivity > RULES.IDLE_THRESHOLD_MIN) return "idle";
  return "active";
}

/* ═══════════════════════════════════════════════════════════════
   SUMMARY GENERATOR  (behavior → human sentence)
   The single source of the prominent one-liner shown at the top.
   ═══════════════════════════════════════════════════════════════ */
function buildSummary(stateKey, signals) {
  switch (stateKey) {
    case "alert":
      return signals.anomaly
        ? `Anomaly detected · ${signals.anomalyDesc || "investigate"}`
        : `Outside site for ${signals.minsOutside || "?"} minutes`;
    case "offline":
      return `No signal for ${signals.minsSinceHeartbeat} minutes`;
    case "idle":
      return `Idle for ${signals.minsSinceActivity} minutes, no recent activity`;
    case "active":
    default:
      return `On-site, last activity ${signals.minsSinceActivity} min ago`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   MOCK SIGNAL DATA (per state)
   In production these come from the backend telemetry stream.
   ═══════════════════════════════════════════════════════════════ */
const SIGNALS = {
  active:  { onSite: true,  anomaly: false, minsSinceHeartbeat: 0, minsSinceActivity: 2 },
  idle:    { onSite: true,  anomaly: false, minsSinceHeartbeat: 1, minsSinceActivity: 12 },
  offline: { onSite: true,  anomaly: false, minsSinceHeartbeat: 14, minsSinceActivity: 14 },
  alert:   { onSite: false, anomaly: false, minsSinceHeartbeat: 0, minsSinceActivity: 7, minsOutside: 7 },
};

/* ═══════════════════════════════════════════════════════════════
   PRIMITIVES
   ═══════════════════════════════════════════════════════════════ */
const WidgetShell = ({ children, compact = false, className = "" }) => (
  <div
    className={`bg-white overflow-hidden ${className}`}
    style={{
      borderRadius: compact ? 14 : 18,
      boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)",
      border: "1px solid #eef2f6",
    }}
  >
    {children}
  </div>
);

const WidgetHeader = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-2 px-4 pt-3.5 pb-2.5">
    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f1f5f9" }}>
      <Icon size={13} className="text-slate-500" strokeWidth={2.25} />
    </div>
    <span className="text-[10.5px] font-semibold tracking-[0.14em] text-slate-500 uppercase">{title}</span>
  </div>
);

const StatusPill = ({ state, size = "md" }) => (
  <div
    className={`flex items-center gap-1.5 rounded-full ${size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1"}`}
    style={{ backgroundColor: state.soft, color: state.accent }}
  >
    <span className="relative flex h-1.5 w-1.5">
      {state.key !== "offline" && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: state.pulse }} />
      )}
      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: state.pulse }} />
    </span>
    <span className={`font-semibold tracking-wide ${size === "sm" ? "text-[10px]" : "text-[10.5px]"}`}>{state.label}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   ⭐ WIDGET 0 — OPERATIONAL SUMMARY (NEW)
   ───────────────────────────────────────────────────────────────
   The most prominent element. Single sentence, scannable in <3s.
   Sits directly above or fused with the Core Header.
   ═══════════════════════════════════════════════════════════════ */
const OperationalSummary = ({ stateKey, signals, compact = false }) => {
  const state = TOKENS.states[stateKey];
  const summary = buildSummary(stateKey, signals);
  const Icon =
    stateKey === "alert"   ? AlertTriangle :
    stateKey === "offline" ? WifiOff :
    stateKey === "idle"    ? Clock :
                             CheckCircle2;

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ backgroundColor: state.soft, border: `1px solid ${state.ring}` }}
      >
        <Icon size={12} style={{ color: state.accent }} strokeWidth={2.5} />
        <span className="text-[12px] font-semibold leading-tight" style={{ color: state.accent }}>
          {summary}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${state.soft} 0%, white 140%)`,
        border: `1px solid ${state.ring}`,
        boxShadow: `0 1px 2px rgba(15,23,42,0.04), 0 8px 20px ${state.ring}`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "white", boxShadow: `0 0 0 1px ${state.ring}` }}
      >
        <Icon size={17} style={{ color: state.accent }} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-0.5" style={{ color: state.accent, opacity: 0.75 }}>
          Operational Summary
        </div>
        <div className="text-[14.5px] font-semibold leading-snug" style={{ color: state.accent }}>
          {summary}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   WIDGET 1 — CORE HEADER  (refined, no longer carries summary)
   ═══════════════════════════════════════════════════════════════ */
const CoreHeaderWidget = ({ stateKey = "active", name = "Rangga Saputra", role = "Security Officer", site = "Menara BCA", shift = "08:00 – 16:00", initials = "RS", compact = false }) => {
  const state = TOKENS.states[stateKey];
  return (
    <WidgetShell compact={compact}>
      <div className="h-1" style={{ backgroundColor: state.accent }} />
      <div className={`px-4 ${compact ? "py-2.5" : "py-4"} flex items-center gap-3`}>
        <div className="relative flex-shrink-0">
          <div
            className={`${compact ? "w-9 h-9 text-[12px]" : "w-11 h-11 text-[13px]"} rounded-full flex items-center justify-center text-white font-semibold tracking-wide`}
            style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}
          >
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: state.pulse }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-slate-900 truncate ${compact ? "text-[13.5px]" : "text-[15px]"} leading-tight`}>
            {name}
          </div>
          <div className={`text-slate-500 truncate mt-0.5 ${compact ? "text-[11px]" : "text-[12px]"}`}>
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
  active:  { status: "Inside Site",     dot: "#16a34a", address: "Menara BCA, Jl. MH Thamrin No.1", accuracy: "High ±8m",   updated: "12s ago" },
  idle:    { status: "Near Boundary",   dot: "#d97706", address: "Menara BCA — East Perimeter",     accuracy: "Medium ±22m", updated: "6 min ago" },
  offline: { status: "Last Known",      dot: "#64748b", address: "Menara BCA — Lobby Level",        accuracy: "Stale ±15m",  updated: "14 min ago" },
  alert:   { status: "Outside Site",    dot: "#dc2626", address: "~340m NE of assigned site",       accuracy: "High ±11m",   updated: "just now" },
};

const LocationWidget = ({ stateKey = "active", compact = false }) => {
  const state = TOKENS.states[stateKey];
  const data = LOCATION_DATA[stateKey] || LOCATION_DATA.active;

  // Compact mode: status only — drop accuracy + timestamps
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.dot }} />
        <span className="text-[11px] font-semibold truncate" style={{ color: data.dot }}>
          {data.status}
        </span>
      </div>
    );
  }

  return (
    <WidgetShell>
      <WidgetHeader icon={MapPin} title="Location" />
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.dot }} />
          <span className="text-[13px] font-semibold" style={{ color: data.dot }}>{data.status}</span>
        </div>
        <div className="text-[12.5px] text-slate-700 truncate">{data.address}</div>
        <div className="flex items-center gap-2.5 mt-1.5 mb-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><Zap size={10} strokeWidth={2.5} />{data.accuracy}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
          <span>Updated {data.updated}</span>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-slate-50" style={{ borderColor: "#e2e8f0", color: "#0f172a" }}>
            <MapIcon size={13} strokeWidth={2.25} /> View Map
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            <RefreshCw size={13} strokeWidth={2.25} /> Refresh
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
  active:  { current: "Patrol Area B",        last: "Checkpoint CP-04 scanned", progress: { done: 3, total: 5 } },
  idle:    { current: "Awaiting next patrol", last: "Checkpoint CP-02 scanned", progress: { done: 2, total: 5 } },
  offline: { current: "Patrol Area B (paused)", last: "Checkpoint CP-03 scanned", progress: { done: 3, total: 5 } },
  alert:   { current: "Unassigned movement",  last: "Left geofence at 11:51",   progress: { done: 3, total: 5 } },
};

const ActivityWidget = ({ stateKey = "active", compact = false }) => {
  const state = TOKENS.states[stateKey];
  const data = ACTIVITY_DATA[stateKey] || ACTIVITY_DATA.active;

  // Compact mode: just the current task — drop "last action"
  if (compact) {
    return (
      <div className="text-[11px] text-slate-600 truncate">
        <span className="font-medium text-slate-700">{data.current}</span>
        <span className="text-slate-400"> · {data.progress.done}/{data.progress.total}</span>
      </div>
    );
  }

  return (
    <WidgetShell>
      <WidgetHeader icon={Activity} title="Activity" />
      <div className="px-4 pb-4">
        <div className="text-[14px] font-semibold text-slate-900 mb-0.5">{data.current}</div>
        <div className="text-[12px] text-slate-500 mb-3">{data.last}</div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-500 font-medium">Checkpoint progress</span>
          <span className="text-[11px] text-slate-700 font-semibold tabular-nums">{data.progress.done} / {data.progress.total}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: data.progress.total }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-colors" style={{ backgroundColor: i < data.progress.done ? state.accent : "#e2e8f0" }} />
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
  active:  { checkIn: "08:02", lastMove: "11:44", lastActivity: "11:42" },
  idle:    { checkIn: "08:02", lastMove: "11:38", lastActivity: "11:29" },
  offline: { checkIn: "08:02", lastMove: "11:30", lastActivity: "11:30" },
  alert:   { checkIn: "08:02", lastMove: "11:58", lastActivity: "11:51" },
};

const TimeWidget = ({ stateKey = "active" }) => {
  const data = TIME_DATA[stateKey] || TIME_DATA.active;
  return (
    <WidgetShell>
      <WidgetHeader icon={Clock} title="Time & Presence" />
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Check-in",    value: data.checkIn },
            { label: "Last move",   value: data.lastMove },
            { label: "Last action", value: data.lastActivity },
          ].map((t) => (
            <div key={t.label} className="rounded-lg py-2.5 px-2.5" style={{ backgroundColor: "#f8fafc" }}>
              <div className="text-[9.5px] text-slate-500 font-medium uppercase tracking-wider mb-1">{t.label}</div>
              <div className="text-[14px] font-semibold text-slate-900 font-mono tabular-nums">{t.value}</div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ WIDGET 5a — TRUST  (system evaluation, NUMERIC ONLY)
   ───────────────────────────────────────────────────────────────
   Pure signal-based score. No human sentences here.
   ═══════════════════════════════════════════════════════════════ */
const TRUST_DATA = {
  active:  { value: 92, label: "Good" },
  idle:    { value: 68, label: "Warning" },
  offline: { value: 55, label: "Warning" },
  alert:   { value: 41, label: "Risk" },
};

const TrustWidget = ({ stateKey = "active" }) => {
  const state = TOKENS.states[stateKey];
  const data = TRUST_DATA[stateKey] || TRUST_DATA.active;
  return (
    <WidgetShell>
      <WidgetHeader icon={Shield} title="Trust Score" />
      <div className="px-4 pb-4">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[28px] font-bold tabular-nums leading-none" style={{ color: state.accent }}>
              {data.value}
            </span>
            <span className="text-[13px] text-slate-400 font-medium">/100</span>
          </div>
          <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: state.soft, color: state.accent }}>
            {data.label}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${data.value}%`, backgroundColor: state.accent }} />
        </div>
        {/* Signal contributors — what fed the score */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
          {[
            { k: "GPS",      v: stateKey === "offline" ? "stale" : stateKey === "alert" ? "off-site" : "ok" },
            { k: "Activity", v: stateKey === "idle" ? "stale"   : stateKey === "active" ? "fresh"    : stateKey === "offline" ? "none" : "stale" },
            { k: "Geofence", v: stateKey === "alert" ? "breach" : "ok" },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-[9.5px] text-slate-400 font-medium uppercase tracking-wider">{s.k}</div>
              <div className="text-[11px] font-semibold text-slate-700 capitalize mt-0.5">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ WIDGET 5b — INSIGHT  (human-readable explanation, NEW)
   ───────────────────────────────────────────────────────────────
   Separated from Trust. Explains the "why" in plain language and
   suggests next action when relevant.
   ═══════════════════════════════════════════════════════════════ */
const INSIGHT_DATA = {
  active: {
    headline: "All signals nominal",
    detail: "Worker is on-site and moving through checkpoints on schedule.",
    suggestion: null,
  },
  idle: {
    headline: "No activity detected for 12 minutes",
    detail: "Worker has been stationary near the east perimeter since 11:29.",
    suggestion: "Send check-in nudge",
  },
  offline: {
    headline: "Lost signal 14 minutes ago",
    detail: "Last known position was inside the lobby. Device may be in low-coverage area.",
    suggestion: "Try contacting worker",
  },
  alert: {
    headline: "Worker has left assigned site",
    detail: "Crossed geofence boundary at 11:51 and is now ~340m NE of the site.",
    suggestion: "Investigate immediately",
  },
};

const InsightWidget = ({ stateKey = "active" }) => {
  const state = TOKENS.states[stateKey];
  const data = INSIGHT_DATA[stateKey] || INSIGHT_DATA.active;
  return (
    <WidgetShell>
      <WidgetHeader icon={MessageSquare} title="Insight" />
      <div className="px-4 pb-4">
        <div className="text-[13.5px] font-semibold text-slate-900 leading-snug mb-1.5">
          {data.headline}
        </div>
        <p className="text-[12px] text-slate-500 leading-relaxed">{data.detail}</p>
        {data.suggestion && (
          <button
            className="mt-3 w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: state.soft, color: state.accent }}
          >
            <span>{data.suggestion}</span>
            <span className="text-[14px] leading-none">→</span>
          </button>
        )}
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
      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[13.5px] text-white mb-2 transition-all active:scale-[0.98]" style={{ backgroundColor: "#0f172a", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}>
        <QrCode size={15} strokeWidth={2.25} /> Scan Patrol Checkpoint
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-[12.5px] border transition-colors hover:bg-slate-50" style={{ borderColor: "#e2e8f0", color: "#334155" }}>
          <FileText size={13} strokeWidth={2.25} /> Submit Report
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-[12.5px] transition-colors" style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}>
          <LogOut size={13} strokeWidth={2.25} /> Check-out
        </button>
      </div>
    </div>
  </WidgetShell>
);

/* ═══════════════════════════════════════════════════════════════
   ⭐ COMPACT SUPERVISOR ROW  (refined for vertical scan)
   ───────────────────────────────────────────────────────────────
   Hierarchy:  identity → insight headline → minimal context.
   No accuracy, no timestamps, no scores. Just "is this fine?".
   ═══════════════════════════════════════════════════════════════ */
const SupervisorRow = ({ worker }) => {
  const state = TOKENS.states[worker.stateKey];
  const insight = INSIGHT_DATA[worker.stateKey];

  return (
    <div
      className="flex items-center gap-3 bg-white px-3.5 py-3 transition-colors hover:bg-slate-50 cursor-pointer"
      style={{
        borderRadius: 14,
        border: "1px solid #eef2f6",
        boxShadow: "0 1px 2px rgba(15,23,42,0.03)",
        // Left edge color carries the state — fastest scan signal
        borderLeft: `3px solid ${state.accent}`,
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[12px]"
          style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}
        >
          {worker.initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: state.pulse }} />
      </div>

      {/* Identity + insight headline (the only sentence that matters here) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900 truncate">{worker.name}</span>
          <span className="text-[10.5px] text-slate-400 truncate">· {worker.site}</span>
        </div>
        <div className="text-[11.5px] font-medium truncate mt-0.5" style={{ color: state.accent }}>
          {insight.headline}
        </div>
      </div>

      {/* Status pill — terminal signal */}
      <StatusPill state={state} size="sm" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   LAYOUT HELPERS
   ═══════════════════════════════════════════════════════════════ */
const SectionLabel = ({ number, title, subtitle, badge }) => (
  <div className="flex items-start gap-3 mb-4 max-w-2xl">
    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}>
      {number}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h2 className="text-[15px] font-bold text-slate-900 tracking-tight leading-tight">{title}</h2>
        {badge && (
          <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[12px] text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const StateLabel = ({ stateKey, note }) => {
  const s = TOKENS.states[stateKey];
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-[0.1em] uppercase" style={{ backgroundColor: s.soft, color: s.accent }}>
        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: s.pulse }} />
        {s.label}
      </div>
      {note && <span className="text-[10px] text-slate-400 font-mono truncate">{note}</span>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN SHOWCASE
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const states = ["active", "idle", "offline", "alert"];

  // Behavior rules shown next to each state — proves it's not just visual
  const ruleNotes = {
    active:  "activity ≤ 10 min",
    idle:    "activity > 10 min",
    offline: "heartbeat > 5 min",
    alert:   "geofence breach",
  };

  return (
    <div
      className="min-h-screen w-full py-10 px-6"
      style={{
        background: "radial-gradient(1400px 700px at 50% -10%, #e2e8f0 0%, #f8fafc 45%, #f1f5f9 100%)",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Top Header ─────────────────────────── */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-2">
          Design System · v1.1 · Refined
        </div>
        <h1 className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">
          Worker Operational UI System
        </h1>
        <p className="text-[14px] text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Refined hierarchy: a prominent <strong className="text-slate-700">Operational Summary</strong> sits above the header,
          <strong className="text-slate-700"> Trust</strong> and <strong className="text-slate-700">Insight</strong> are now distinct, and
          status is <strong className="text-slate-700">derived from behavior</strong> via a single rules engine — not assigned by the UI.
        </p>

        {/* Rules engine summary */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl">
          {[
            { state: "active",  rule: "on-site + activity ≤ 10 min" },
            { state: "idle",    rule: "no activity for > 10 min" },
            { state: "offline", rule: "no heartbeat for > 5 min" },
            { state: "alert",   rule: "outside geofence OR anomaly" },
          ].map((r) => {
            const s = TOKENS.states[r.state];
            return (
              <div key={r.state} className="bg-white px-3 py-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.pulse }} />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: s.accent }}>{s.label}</span>
                </div>
                <div className="text-[10.5px] text-slate-500 font-mono leading-snug">{r.rule}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* ═══════════════════════════════════════
            ⭐ NEW — OPERATIONAL SUMMARY
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="0"
          title="Operational Summary"
          subtitle="The most prominent element. One sentence, scannable in under 3 seconds. Generated from behavior signals via buildSummary()."
          badge="New"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {states.map((s) => (
            <div key={s}>
              <StateLabel stateKey={s} note={ruleNotes[s]} />
              <OperationalSummary stateKey={s} signals={SIGNALS[s]} />
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            CORE HEADER
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="1"
          title="Core Header"
          subtitle="Identity anchor. No longer carries summary text — that role moved to widget 0."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {states.map((s) => (
            <div key={s}>
              <StateLabel stateKey={s} />
              <CoreHeaderWidget stateKey={s} />
            </div>
          ))}
        </div>

        {/* LOCATION */}
        <SectionLabel number="2" title="Location" subtitle="Geofence verdict, address, GPS quality, freshness." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {states.map((s) => (
            <div key={s}>
              <StateLabel stateKey={s} />
              <LocationWidget stateKey={s} />
            </div>
          ))}
        </div>

        {/* ACTIVITY */}
        <SectionLabel number="3" title="Activity" subtitle="What they're doing. Discrete progress shown as segmented bar." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {states.map((s) => (
            <div key={s}>
              <StateLabel stateKey={s} />
              <ActivityWidget stateKey={s} />
            </div>
          ))}
        </div>

        {/* TIME */}
        <SectionLabel number="4" title="Time & Presence" subtitle="Detects real activity vs. just being online." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {states.map((s) => (
            <div key={s}>
              <StateLabel stateKey={s} />
              <TimeWidget stateKey={s} />
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════
            ⭐ TRUST + INSIGHT (now separated)
            ═══════════════════════════════════════ */}
        <SectionLabel
          number="5"
          title="Trust & Insight"
          subtitle="Now two distinct widgets. Trust = numeric system evaluation with signal contributors. Insight = human-readable explanation + suggested next action."
          badge="Split"
        />

        <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-3">5a · Trust (numeric)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {states.map((s) => (
            <div key={s}>
              <StateLabel stateKey={s} />
              <TrustWidget stateKey={s} />
            </div>
          ))}
        </div>

        <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-3">5b · Insight (human-readable)</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {states.map((s) => (
            <div key={s}>
              <StateLabel stateKey={s} />
              <InsightWidget stateKey={s} />
            </div>
          ))}
        </div>

        {/* ACTION */}
        <SectionLabel number="6" title="Action" subtitle="Worker-only. Primary task triggers + check-out." />
        <div className="max-w-md mb-16">
          <ActionWidget />
        </div>

        {/* ═══════════════════════════════════════
            RESPONSIVE CONTEXTS
            ═══════════════════════════════════════ */}
        <div className="border-t border-slate-200 pt-10 mb-10">
          <div className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-2">
            Composition
          </div>
          <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">
            Three viewing contexts
          </h2>
          <p className="text-[13px] text-slate-500 mt-1.5 max-w-2xl">
            Same widgets, different hierarchy. Mobile shows everything. Supervisor list shows only what's needed to triage. Detail view stacks all signals for a deep look.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── A: Mobile (Worker App) ──────────── */}
          <div>
            <div className="mb-4">
              <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-1">A — Mobile (Worker App)</div>
              <div className="text-[12px] text-slate-500">Summary + header on top. Full stack below.</div>
            </div>
            <div className="p-3 rounded-2xl" style={{ background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)", boxShadow: "0 20px 40px -20px rgba(15,23,42,0.3)" }}>
              <div className="p-3 space-y-3 rounded-xl" style={{ background: "#f8fafc" }}>
                <OperationalSummary stateKey="idle" signals={SIGNALS.idle} />
                <CoreHeaderWidget stateKey="idle" />
                <LocationWidget stateKey="idle" />
                <ActivityWidget stateKey="idle" />
                <TimeWidget stateKey="idle" />
                <TrustWidget stateKey="idle" />
                <InsightWidget stateKey="idle" />
                <ActionWidget />
              </div>
            </div>
          </div>

          {/* ── B: Supervisor Compact List (REFINED) ────── */}
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase">B — Supervisor Roster</span>
                <span className="text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>Refined</span>
              </div>
              <div className="text-[12px] text-slate-500">Insight headline + status only. Full vertical scan.</div>
            </div>

            {/* Sort: alerts first — supervisors should see problems at top */}
            <div className="space-y-2">
              {[
                { stateKey: "alert",   name: "Budi Hartono",     site: "Gandaria City",    initials: "BH" },
                { stateKey: "offline", name: "Siti Nurhaliza",   site: "Plaza Senayan",    initials: "SN" },
                { stateKey: "idle",    name: "Dewi Anggraini",   site: "Gedung Wisma 46",  initials: "DA" },
                { stateKey: "active",  name: "Rangga Saputra",   site: "Menara BCA",       initials: "RS" },
                { stateKey: "active",  name: "Ahmad Fauzi",      site: "Pacific Place",    initials: "AF" },
                { stateKey: "active",  name: "Lina Marliana",    site: "Sudirman 7.8",     initials: "LM" },
              ].map((w) => (
                <SupervisorRow key={w.name} worker={w} />
              ))}
            </div>

            <div className="mt-3 text-[10.5px] text-slate-400 leading-relaxed px-1">
              Sorted by severity. Left edge color = state. One sentence per worker = scan in seconds.
            </div>
          </div>

          {/* ── C: Supervisor Detail (Alert) ────── */}
          <div>
            <div className="mb-4">
              <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-1">C — Supervisor Detail</div>
              <div className="text-[12px] text-slate-500">Tap a row → full signal stack. No worker actions.</div>
            </div>
            <div className="space-y-3">
              <OperationalSummary stateKey="alert" signals={SIGNALS.alert} />
              <CoreHeaderWidget stateKey="alert" />
              <InsightWidget stateKey="alert" />
              <LocationWidget stateKey="alert" />
              <ActivityWidget stateKey="alert" />
              <TrustWidget stateKey="alert" />
              <TimeWidget stateKey="alert" />
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────── */}
        <div className="border-t border-slate-200 mt-16 pt-8 pb-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { k: "Widgets",          v: "8" },
            { k: "State variants",   v: "4" },
            { k: "Layout modes",     v: "3" },
            { k: "Rules engine",     v: "1 source" },
          ].map((stat) => (
            <div key={stat.k}>
              <div className="text-[22px] font-bold text-slate-900 tabular-nums">{stat.v}</div>
              <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{stat.k}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
