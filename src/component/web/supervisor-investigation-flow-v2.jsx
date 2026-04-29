import React, { useState, useEffect, useRef } from "react";
import {
  MapPin, Activity, Clock, Shield, RefreshCw, Map as MapIcon,
  AlertTriangle, CheckCircle2, Zap, MessageSquare, WifiOff,
  Bell, Phone, Flag, X, ChevronLeft, History, ListChecks,
  Send, PhoneCall, AlertOctagon, ArrowRight, Radio, LogIn,
  Footprints, ScanLine, HelpCircle, User, Cpu, CircleDot,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   ▼ REUSED — DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════ */
const TOKENS = {
  states: {
    active:  { key: "active",  label: "Active",  accent: "#16a34a", soft: "#dcfce7", ring: "rgba(22,163,74,0.18)",  pulse: "#22c55e" },
    idle:    { key: "idle",    label: "Idle",    accent: "#b45309", soft: "#fef3c7", ring: "rgba(180,83,9,0.18)",   pulse: "#f59e0b" },
    offline: { key: "offline", label: "Offline", accent: "#64748b", soft: "#f1f5f9", ring: "rgba(100,116,139,0.18)", pulse: "#94a3b8" },
    alert:   { key: "alert",   label: "Alert",   accent: "#dc2626", soft: "#fee2e2", ring: "rgba(220,38,38,0.18)",  pulse: "#ef4444" },
  },
};
const RULES = { IDLE_THRESHOLD_MIN: 10, OFFLINE_THRESHOLD_MIN: 5 };

/* ═══════════════════════════════════════════════════════════════
   ⭐ NEW — CONFIDENCE TOKENS
   ───────────────────────────────────────────────────────────────
   Each signal/insight carries a confidence level. This lets the UI
   hedge claims instead of presenting them as facts.
   ═══════════════════════════════════════════════════════════════ */
const CONFIDENCE = {
  high:   { label: "Confirmed",  hedge: "",            color: "#0f172a" },
  medium: { label: "Likely",     hedge: "Likely ",     color: "#475569" },
  low:    { label: "Possible",   hedge: "Possible ",   color: "#64748b" },
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ REWRITTEN — INSIGHT GENERATOR
   ───────────────────────────────────────────────────────────────
   Insights are now DERIVED from the event history, not static. The
   generator looks at the most recent events + action log to build
   a contextual sentence. Fallbacks exist for each state.
   ═══════════════════════════════════════════════════════════════ */
function generateInsight({ stateKey, baseInsight, actionLog, signals, hadPriorState }) {
  // Most recent supervisor action + most recent system response
  const lastAction = actionLog.find((e) => e.actor === "supervisor");
  const lastSystem = actionLog.find((e) => e.actor === "system");

  // ─── Situation resolved — but WHY did it resolve? ───
  if (stateKey === "active" && hadPriorState) {
    if (hadPriorState === "idle" && lastAction?.actionId === "nudge") {
      return {
        headline: "Worker resumed patrol after nudge",
        detail:   `Dewi picked up the next task ${signals.minsSinceActivity || "<1"} min after receiving the check-in nudge. Activity stream has resumed normal cadence.`,
        evidence: ["Nudge delivered and acknowledged", "New task confirmation received", "GPS movement resumed"],
        confidence: "high",
      };
    }
    if (hadPriorState === "offline" && lastAction?.actionId === "nudge") {
      return {
        headline: "Device reconnected after signal loss",
        detail:   "Reconnect ping succeeded. Heartbeat restored and task state synchronized. The low-coverage area did not require physical dispatch.",
        evidence: ["Reconnect ping acknowledged", "Heartbeat stream restored", "Task state re-synced"],
        confidence: "high",
      };
    }
    if (hadPriorState === "alert" && lastAction?.actionId === "call") {
      return {
        headline: "Worker returned to site after call",
        detail:   "Budi confirmed awareness during the call and has since re-entered the geofence. Reason pending in follow-up report.",
        evidence: ["Call connected at " + (lastAction.time || "—"), "Geofence re-entered", "Awaiting reason in report"],
        confidence: "medium",
      };
    }
    // Generic resolution fallback
    return {
      headline: "Situation resolved",
      detail:   "Worker state has normalized after supervisor intervention.",
      evidence: ["Signals nominal", "No anomalies detected"],
      confidence: "medium",
    };
  }

  // ─── Still in trouble — but did an action just fail? ───
  if (lastSystem && lastSystem.outcome === "no_change") {
    if (stateKey === "alert" && lastAction?.actionId === "nudge") {
      return {
        headline: "Worker still outside site after acknowledgement",
        detail:   "The nudge was acknowledged but the worker has not returned to the geofence. GPS trace still shows outbound direction. Consider escalating.",
        evidence: ["Nudge acknowledged at " + lastAction.time, "No return movement detected", "Distance from site increasing"],
        confidence: "high",
      };
    }
    if (stateKey === "offline" && lastAction?.actionId === "call") {
      return {
        headline: "Call failed — signal still lost",
        detail:   "In-app call could not connect. The device has been offline for 14+ minutes. Remote recovery options are likely exhausted.",
        evidence: ["Call attempt failed", "No heartbeat for 14+ min", "Recommend on-site dispatch"],
        confidence: "high",
      };
    }
    if (stateKey === "idle" && lastAction?.actionId === "nudge") {
      return {
        headline: "Nudge sent but no response yet",
        detail:   "The worker has not acknowledged the nudge. They may be on an unlogged break or have their device muted.",
        evidence: ["Nudge delivered at " + lastAction.time, "No acknowledgement received", "Device is online — not a signal issue"],
        confidence: "medium",
      };
    }
  }

  // ─── Default — return the base insight for this state ───
  return baseInsight;
}

/* ═══════════════════════════════════════════════════════════════
   ⭐ NEW — REAL ACTION CONSEQUENCE LAYER
   ───────────────────────────────────────────────────────────────
   Separates UI update from system action. In production you'd wire
   `triggerRealAction` to your backend. Here it logs + can be mocked.
   
   Returns a Promise so callers can await the system's response.
   ═══════════════════════════════════════════════════════════════ */
async function triggerRealAction(actionType, payload) {
  // ▶ PRODUCTION: replace this with real API calls, e.g.
  //   case "nudge": return fetch("/api/workers/nudge", { ... })
  //   case "call":  return twilioClient.startCall(...)
  //   case "mark":  return incidentService.create(...)

  const logEntry = {
    timestamp: new Date().toISOString(),
    actionType,
    payload,
    channel: {
      nudge: "push_notification",
      call:  "voip_bridge",
      mark:  "incident_service",
    }[actionType] || "unknown",
  };

  // In production this would be a backend call. For demo we just resolve.
  console.log("[triggerRealAction]", logEntry);
  return { dispatched: true, channel: logEntry.channel };
}

/* ═══════════════════════════════════════════════════════════════
   ⭐ NEW — PROBABILISTIC OUTCOME ENGINE
   ───────────────────────────────────────────────────────────────
   Actions don't always resolve issues. Each (action × state) pair
   has a probability distribution of outcomes. This matches reality:
   a nudge works great on idle workers, but rarely on a worker who
   has deliberately walked off-site.
   ═══════════════════════════════════════════════════════════════ */
const OUTCOME_MATRIX = {
  // nudge outcomes
  nudge: {
    idle: [
      { weight: 0.70, outcome: "resolved",   newState: "active", systemMsg: "Worker acknowledged and resumed activity", confidence: "high" },
      { weight: 0.20, outcome: "partial",    newState: null,     systemMsg: "Nudge delivered, awaiting acknowledgement", confidence: "medium" },
      { weight: 0.10, outcome: "no_change",  newState: null,     systemMsg: "Nudge delivered but no response",           confidence: "medium" },
    ],
    offline: [
      { weight: 0.45, outcome: "resolved",   newState: "active", systemMsg: "Device reconnected — heartbeat restored",    confidence: "high" },
      { weight: 0.35, outcome: "partial",    newState: null,     systemMsg: "Ping sent, device still offline",            confidence: "medium" },
      { weight: 0.20, outcome: "no_change",  newState: null,     systemMsg: "Reconnect failed — device unreachable",      confidence: "high" },
    ],
    alert: [
      { weight: 0.25, outcome: "resolved",   newState: "active", systemMsg: "Worker acknowledged and returned to site",   confidence: "medium" },
      { weight: 0.40, outcome: "partial",    newState: null,     systemMsg: "Worker acknowledged but still off-site",     confidence: "high" },
      { weight: 0.35, outcome: "no_change",  newState: null,     systemMsg: "No acknowledgement received",                confidence: "high" },
    ],
  },
  // call outcomes
  call: {
    idle: [
      { weight: 0.65, outcome: "resolved",   newState: "active", systemMsg: "Call connected — worker confirmed task resumption", confidence: "high" },
      { weight: 0.25, outcome: "partial",    newState: null,     systemMsg: "Call connected — reason documented",                confidence: "high" },
      { weight: 0.10, outcome: "no_change",  newState: null,     systemMsg: "Call declined by worker",                           confidence: "high" },
    ],
    offline: [
      { weight: 0.10, outcome: "resolved",   newState: "active", systemMsg: "Call connected unexpectedly — signal restored",    confidence: "medium" },
      { weight: 0.90, outcome: "no_change",  newState: null,     systemMsg: "Call failed — no signal to device",                 confidence: "high" },
    ],
    alert: [
      { weight: 0.50, outcome: "resolved",   newState: "active", systemMsg: "Call connected — worker returning to site",        confidence: "medium" },
      { weight: 0.30, outcome: "partial",    newState: null,     systemMsg: "Call connected — worker contesting boundary",      confidence: "high" },
      { weight: 0.20, outcome: "no_change",  newState: null,     systemMsg: "Call declined",                                     confidence: "high" },
    ],
  },
  // mark / escalate outcomes — these don't resolve, they route
  mark: {
    idle: [
      { weight: 1.0, outcome: "routed", newState: null, systemMsg: "Added to end-of-shift review queue", confidence: "high" },
    ],
    offline: [
      { weight: 1.0, outcome: "routed", newState: null, systemMsg: "On-site dispatch notified · ETA 4 min", confidence: "high" },
    ],
    alert: [
      { weight: 1.0, outcome: "routed", newState: null, systemMsg: "Incident created · site manager + ops lead alerted", confidence: "high" },
    ],
  },
};

function rollOutcome(actionId, stateKey) {
  const table = OUTCOME_MATRIX[actionId]?.[stateKey];
  if (!table) return null;
  const roll = Math.random();
  let cumulative = 0;
  for (const outcome of table) {
    cumulative += outcome.weight;
    if (roll <= cumulative) return outcome;
  }
  return table[table.length - 1];
}

/* ═══════════════════════════════════════════════════════════════
   ▼ PRIMITIVES (unchanged)
   ═══════════════════════════════════════════════════════════════ */
const WidgetShell = ({ children, className = "" }) => (
  <div className={`bg-white overflow-hidden ${className}`} style={{ borderRadius: 18, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)", border: "1px solid #eef2f6" }}>
    {children}
  </div>
);

const WidgetHeader = ({ icon: Icon, title, rightSlot }) => (
  <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: "#f1f5f9" }}>
        <Icon size={13} className="text-slate-500" strokeWidth={2.25} />
      </div>
      <span className="text-[10.5px] font-semibold tracking-[0.14em] text-slate-500 uppercase">{title}</span>
    </div>
    {rightSlot}
  </div>
);

const StatusPill = ({ state, size = "md" }) => (
  <div className={`flex items-center gap-1.5 rounded-full ${size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1"}`} style={{ backgroundColor: state.soft, color: state.accent }}>
    <span className="relative flex h-1.5 w-1.5">
      {state.key !== "offline" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: state.pulse }} />}
      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ backgroundColor: state.pulse }} />
    </span>
    <span className={`font-semibold tracking-wide ${size === "sm" ? "text-[10px]" : "text-[10.5px]"}`}>{state.label}</span>
  </div>
);

/* ⭐ NEW — CONFIDENCE BADGE
   Small inline indicator. High confidence = no badge (default = trusted).
   Medium = subtle gray pill. Low = amber pill. Tap = tooltip (future). */
const ConfidenceBadge = ({ level }) => {
  if (!level || level === "high") return null;
  const isLow = level === "low";
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider"
      style={{
        backgroundColor: isLow ? "#fef3c7" : "#f1f5f9",
        color: isLow ? "#b45309" : "#64748b",
      }}
      title={isLow ? "Low-confidence signal — verify before acting" : "Inferred from partial data"}
    >
      <HelpCircle size={9} strokeWidth={2.5} />
      {CONFIDENCE[level].label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ UPDATED — OPERATIONAL SUMMARY (with confidence hedge)
   ═══════════════════════════════════════════════════════════════ */
const OperationalSummary = ({ stateKey, signals, confidence = "high" }) => {
  const state = TOKENS.states[stateKey];
  const Icon = stateKey === "alert" ? AlertTriangle : stateKey === "offline" ? WifiOff : stateKey === "idle" ? Clock : CheckCircle2;

  // Confidence hedge prepended to summary when not high
  const hedge = confidence !== "high" ? CONFIDENCE[confidence].hedge.toLowerCase() : "";
  let summary;
  switch (stateKey) {
    case "alert":   summary = `${hedge ? hedge.charAt(0).toUpperCase() + hedge.slice(1) : ""}Outside site for ${signals.minsOutside || "?"} minutes`.trim(); break;
    case "offline": summary = `${hedge ? hedge.charAt(0).toUpperCase() + hedge.slice(1) : ""}No signal for ${signals.minsSinceHeartbeat} minutes`.trim(); break;
    case "idle":    summary = `${hedge ? hedge.charAt(0).toUpperCase() + hedge.slice(1) : ""}Idle for ${signals.minsSinceActivity} minutes, no recent activity`.trim(); break;
    default:        summary = `On-site, last activity ${signals.minsSinceActivity} min ago`;
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
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "white", boxShadow: `0 0 0 1px ${state.ring}` }}>
        <Icon size={17} style={{ color: state.accent }} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: state.accent, opacity: 0.75 }}>Operational Summary</div>
          <ConfidenceBadge level={confidence} />
        </div>
        <div className="text-[14.5px] font-semibold leading-snug" style={{ color: state.accent }}>{summary}</div>
      </div>
    </div>
  );
};

const CoreHeaderWidget = ({ stateKey, name, role, site, shift, initials }) => {
  const state = TOKENS.states[stateKey];
  return (
    <WidgetShell>
      <div className="h-1" style={{ backgroundColor: state.accent }} />
      <div className="px-4 py-4 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[13px] tracking-wide" style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}>{initials}</div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: state.pulse }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 truncate text-[15px] leading-tight">{name}</div>
          <div className="text-slate-500 truncate mt-0.5 text-[12px]">{role} · {site}</div>
          {shift && <div className="flex items-center gap-1 mt-1.5 text-[10.5px] text-slate-400"><Clock size={10} strokeWidth={2.5} /><span className="font-medium">Shift {shift}</span></div>}
        </div>
        <StatusPill state={state} />
      </div>
    </WidgetShell>
  );
};

const SnapshotTile = ({ icon: Icon, label, value, sub, valueColor = "#0f172a", confidence }) => (
  <div className="rounded-xl px-3 py-2.5 bg-white" style={{ border: "1px solid #eef2f6" }}>
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={11} className="text-slate-400" strokeWidth={2.25} />
      <span className="text-[9.5px] font-semibold tracking-[0.12em] text-slate-500 uppercase">{label}</span>
      {confidence && confidence !== "high" && <HelpCircle size={9} className="text-slate-300" strokeWidth={2.5} />}
    </div>
    <div className="text-[13px] font-semibold leading-tight truncate" style={{ color: valueColor }}>{value}</div>
    {sub && <div className="text-[10.5px] text-slate-400 mt-0.5 truncate">{sub}</div>}
  </div>
);

const SignalSnapshot = ({ stateKey, scenario }) => {
  const state = TOKENS.states[stateKey];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <span className="text-[10.5px] font-bold tracking-[0.18em] text-slate-500 uppercase">Signal Snapshot</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SnapshotTile icon={MapPin}   label="Location"    value={scenario.snapshot.location.value}   sub={scenario.snapshot.location.sub}   valueColor={state.accent} confidence={scenario.snapshot.location.confidence} />
        <SnapshotTile icon={Activity} label="Activity"    value={scenario.snapshot.activity.value}   sub={scenario.snapshot.activity.sub}   confidence={scenario.snapshot.activity.confidence} />
        <SnapshotTile icon={Clock}    label="Last Action" value={scenario.snapshot.lastAction.value} sub={scenario.snapshot.lastAction.sub} />
        <SnapshotTile icon={Shield}   label="Trust"       value={scenario.snapshot.trust.value}      sub={scenario.snapshot.trust.sub}      valueColor={state.accent} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TIMELINE (unchanged)
   ═══════════════════════════════════════════════════════════════ */
const TIMELINE_ICONS = { checkin: LogIn, movement: Footprints, activity: ScanLine, signal: Radio, anomaly: AlertTriangle, offlineEvt: WifiOff, idle: Clock };

const InvestigationTimeline = ({ events, stateKey }) => {
  const state = TOKENS.states[stateKey];
  return (
    <WidgetShell>
      <WidgetHeader icon={History} title="Investigation Timeline" rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">{events.length} events</span>} />
      <div className="px-4 pb-4">
        <div className="relative">
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-200" />
          {events.map((evt, i) => {
            const Icon = TIMELINE_ICONS[evt.type] || Radio;
            const isAnomaly = evt.severity === "alert";
            const isLast = i === events.length - 1;
            const dotColor = isAnomaly ? state.accent : "#cbd5e1";
            const dotBg = isAnomaly ? state.soft : "white";
            return (
              <div key={i} className={`relative flex gap-3 ${isLast ? "" : "pb-3.5"}`}>
                <div className="relative z-10 flex-shrink-0 w-[27px] h-[27px] rounded-full flex items-center justify-center" style={{ backgroundColor: dotBg, border: `1.5px solid ${dotColor}`, boxShadow: isAnomaly ? `0 0 0 3px ${state.ring}` : "0 0 0 3px white" }}>
                  <Icon size={11} style={{ color: isAnomaly ? state.accent : "#64748b" }} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className={`text-[12.5px] font-semibold leading-tight ${isAnomaly ? "" : "text-slate-900"}`} style={isAnomaly ? { color: state.accent } : undefined}>{evt.title}</span>
                    <span className="text-[10.5px] text-slate-400 font-mono tabular-nums flex-shrink-0">{evt.time}</span>
                  </div>
                  {evt.detail && <div className="text-[11px] text-slate-500 leading-snug">{evt.detail}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ UPDATED — INSIGHT WIDGET (with confidence badge)
   ═══════════════════════════════════════════════════════════════ */
const InsightWidget = ({ stateKey, insight }) => {
  const state = TOKENS.states[stateKey];
  return (
    <WidgetShell>
      <WidgetHeader
        icon={MessageSquare}
        title="Insight"
        rightSlot={<ConfidenceBadge level={insight.confidence} />}
      />
      <div className="px-4 pb-4">
        <div className="text-[13.5px] font-semibold text-slate-900 leading-snug mb-1.5">{insight.headline}</div>
        <p className="text-[12px] text-slate-500 leading-relaxed">{insight.detail}</p>
        {insight.evidence && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[9.5px] font-bold tracking-[0.14em] text-slate-400 uppercase mb-1.5">Supporting evidence</div>
            <ul className="space-y-1">
              {insight.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-[11.5px] text-slate-600 leading-snug">
                  <span className="w-1 h-1 rounded-full mt-[7px] flex-shrink-0" style={{ backgroundColor: state.accent }} />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SUGGESTED ACTIONS (unchanged)
   ═══════════════════════════════════════════════════════════════ */
const ACTION_ICONS = { nudge: Send, call: PhoneCall, mark: AlertOctagon, log: ListChecks };

const SuggestedActions = ({ stateKey, actions, onActionTap, disabledIds = [] }) => (
  <WidgetShell>
    <WidgetHeader icon={ListChecks} title="Suggested Actions" rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">Sorted by escalation</span>} />
    <div className="px-4 pb-4 space-y-2">
      {actions.map((action) => {
        const Icon = ACTION_ICONS[action.icon] || Send;
        const isDanger = action.weight === "danger";
        const isDone = disabledIds.includes(action.id);
        return (
          <button
            key={action.id}
            onClick={() => !isDone && onActionTap(action)}
            disabled={isDone}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all hover:bg-slate-50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: `1px solid ${isDanger ? "#fecaca" : "#e2e8f0"}`, backgroundColor: isDanger ? "#fef2f2" : "white" }}
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isDanger ? "#fee2e2" : "#f1f5f9", color: isDanger ? "#b91c1c" : "#0f172a" }}>
              <Icon size={15} strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-semibold ${isDanger ? "text-red-700" : "text-slate-900"}`}>{action.label}</span>
                {isDone && <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">Done</span>}
              </div>
              <div className={`text-[11px] leading-snug mt-0.5 ${isDanger ? "text-red-500" : "text-slate-500"}`}>{action.description}</div>
            </div>
            {!isDone && <ArrowRight size={14} className={isDanger ? "text-red-400" : "text-slate-400"} />}
          </button>
        );
      })}
    </div>
  </WidgetShell>
);

/* ═══════════════════════════════════════════════════════════════
   ACTION MODAL (unchanged)
   ═══════════════════════════════════════════════════════════════ */
const ActionModal = ({ action, worker, onCancel, onConfirm }) => {
  const overlayRef = useRef(null);
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  if (!action) return null;
  const Icon = ACTION_ICONS[action.icon] || Send;
  const isDanger = action.weight === "danger";

  return (
    <div ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onCancel()} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}>
      <div className="bg-white w-full max-w-sm overflow-hidden" style={{ borderRadius: 22, boxShadow: "0 25px 50px -12px rgba(15,23,42,0.35)", animation: "modalIn 0.18s ease-out" }}>
        <div className="h-1" style={{ backgroundColor: isDanger ? "#dc2626" : "#0f172a" }} />
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: isDanger ? "#fee2e2" : "#f1f5f9", color: isDanger ? "#b91c1c" : "#0f172a" }}>
            <Icon size={18} strokeWidth={2.25} />
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"><X size={16} strokeWidth={2.25} /></button>
        </div>
        <div className="px-5 pb-2">
          <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight mb-1.5">{action.confirmTitle || action.label}</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed">{action.confirmExplanation || action.description}</p>
        </div>
        <div className="mx-5 mt-4 mb-5 p-3 rounded-xl" style={{ backgroundColor: "#f8fafc", border: "1px solid #eef2f6" }}>
          <div className="text-[9.5px] font-bold tracking-[0.14em] text-slate-400 uppercase mb-1">Worker</div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-[10px]" style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}>{worker.initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-slate-900 truncate">{worker.name}</div>
              <div className="text-[10.5px] text-slate-500 truncate">{worker.role} · {worker.site}</div>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100" style={{ border: "1px solid #e2e8f0" }}>Cancel</button>
          <button onClick={() => onConfirm(action)} className="flex-[1.4] py-3 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98]" style={{ backgroundColor: isDanger ? "#dc2626" : "#0f172a", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}>
            {action.confirmCta || `Confirm ${action.label}`}
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ UPDATED — ACTION LOG (with actor attribution)
   ───────────────────────────────────────────────────────────────
   Each entry shows who did what: Supervisor, System, or Worker.
   Color-coded icons and an attribution line make audit trail clear.
   ═══════════════════════════════════════════════════════════════ */
const ACTOR_META = {
  supervisor: { icon: User,   label: "Supervisor", color: "#0f172a", bg: "white",     border: "1px solid #e2e8f0" },
  system:     { icon: Cpu,    label: "System",     color: "#16a34a", bg: "#f0fdf4",   border: "1px solid #dcfce7" },
  worker:     { icon: CircleDot, label: "Worker",  color: "#2563eb", bg: "#eff6ff",   border: "1px solid #dbeafe" },
};

const ActionLog = ({ entries, currentUser = "Supervisor" }) => {
  if (!entries || entries.length === 0) {
    return (
      <WidgetShell>
        <WidgetHeader icon={History} title="Action Log" rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">Empty</span>} />
        <div className="px-4 pb-4 pt-1">
          <div className="text-[12px] text-slate-400 leading-relaxed text-center py-3">No actions taken yet. Confirmed actions will appear here with full attribution.</div>
        </div>
      </WidgetShell>
    );
  }

  return (
    <WidgetShell>
      <WidgetHeader icon={History} title="Action Log" rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">{entries.length} {entries.length === 1 ? "entry" : "entries"} · audit trail</span>} />
      <div className="px-4 pb-4 space-y-2">
        {entries.map((entry, i) => {
          const actor = ACTOR_META[entry.actor] || ACTOR_META.system;
          const ActorIcon = actor.icon;
          const EntryIcon = entry.actor === "supervisor" ? (ACTION_ICONS[entry.icon] || Send) : entry.actor === "system" ? CheckCircle2 : CircleDot;
          return (
            <div key={i} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg" style={{ backgroundColor: actor.bg, border: actor.border }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: entry.actor === "supervisor" ? "white" : "transparent", color: actor.color, border: entry.actor === "supervisor" ? "1px solid #e2e8f0" : "none" }}>
                <EntryIcon size={11} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[12px] font-semibold text-slate-900 leading-tight">{entry.label}</span>
                  <span className="text-[10.5px] text-slate-400 font-mono tabular-nums flex-shrink-0">{entry.time}</span>
                </div>
                {entry.detail && <div className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">{entry.detail}</div>}
                {/* ⭐ Actor attribution line */}
                <div className="flex items-center gap-1 mt-1">
                  <ActorIcon size={9} style={{ color: actor.color }} strokeWidth={2.5} />
                  <span className="text-[9.5px] font-semibold uppercase tracking-wider" style={{ color: actor.color }}>
                    {entry.actor === "supervisor" ? currentUser : actor.label}
                  </span>
                  {entry.channel && <span className="text-[9.5px] text-slate-400">· via {entry.channel}</span>}
                  {entry.outcome && entry.outcome !== "resolved" && (
                    <span className="text-[9.5px] text-slate-400">· {entry.outcome.replace("_", " ")}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SCENARIO DATA (base insights now include confidence)
   ═══════════════════════════════════════════════════════════════ */
const SCENARIOS = {
  alert: {
    stateKey: "alert",
    worker: { name: "Budi Hartono", role: "Security Officer", site: "Gandaria City", shift: "08:00 – 16:00", initials: "BH" },
    signals: { onSite: false, anomaly: false, minsSinceHeartbeat: 0, minsSinceActivity: 7, minsOutside: 7 },
    summaryConfidence: "high",
    snapshot: {
      location:   { value: "Outside Site",        sub: "~340m NE of geofence",  confidence: "high"   },
      activity:   { value: "Unassigned movement", sub: "Last: CP-04 at 11:51",  confidence: "medium" },
      lastAction: { value: "11:51",               sub: "7 min ago" },
      trust:      { value: "41 / Risk",           sub: "Geofence breach" },
    },
    insight: {
      headline: "Worker has left the assigned site",
      detail:   "Budi crossed the south geofence boundary at 11:51 and has been moving away from the assigned patrol area. No prior approval logged.",
      evidence: ["GPS trace shows continuous outbound movement (~50m/min)", "No checkpoint scan since CP-04 at 11:51", "No leave/break request in queue"],
      confidence: "high",
    },
    timeline: [
      { type: "checkin",  title: "Checked in",              detail: "On-site at gate B",                 time: "08:02" },
      { type: "activity", title: "Patrol Area A completed", detail: "5/5 checkpoints scanned",           time: "10:14" },
      { type: "activity", title: "Patrol Area B started",   detail: "Assigned by supervisor",            time: "10:30" },
      { type: "activity", title: "Checkpoint CP-04 scanned",detail: "Last in-site activity",             time: "11:51" },
      { type: "anomaly",  title: "Geofence breach detected",detail: "Crossed south boundary heading NE", time: "11:52", severity: "alert" },
      { type: "movement", title: "Continued movement off-site", detail: "Now ~340m from site, still moving", time: "11:58", severity: "alert" },
    ],
    actions: [
      { id: "nudge", icon: "nudge", label: "Send check-in nudge",       weight: "soft",   description: "Push notification asking the worker to confirm status.",  confirmTitle: "Send a check-in nudge?", confirmExplanation: "A push notification will be sent to Budi asking them to confirm their status. They have 5 minutes to respond before this auto-escalates.", confirmCta: "Send nudge" },
      { id: "call",  icon: "call",  label: "Call worker",               weight: "normal", description: "Open the in-app voice call to Budi's device.",            confirmTitle: "Call Budi Hartono?",     confirmExplanation: "This will initiate an in-app voice call. The worker will hear a ringtone and can accept or decline.",                                    confirmCta: "Start call" },
      { id: "mark",  icon: "mark",  label: "Mark as security incident", weight: "danger", description: "Escalate to incident channel and notify site manager.",   confirmTitle: "Mark as security incident?", confirmExplanation: "This will escalate to the incident channel, notify the site manager, and create a formal report. Use only when worker safety or asset security is at risk.", confirmCta: "Escalate now" },
    ],
  },

  idle: {
    stateKey: "idle",
    worker: { name: "Dewi Anggraini", role: "Cleaning Staff", site: "Gedung Wisma 46", shift: "07:00 – 15:00", initials: "DA" },
    signals: { onSite: true, anomaly: false, minsSinceHeartbeat: 1, minsSinceActivity: 12 },
    summaryConfidence: "medium", // ⭐ Idle is inherently probabilistic — worker may be on a break
    snapshot: {
      location:   { value: "Near Boundary",      sub: "East perimeter",      confidence: "high"   },
      activity:   { value: "Awaiting next task", sub: "Last: floor 14 done", confidence: "medium" },
      lastAction: { value: "11:29",              sub: "12 min ago" },
      trust:      { value: "68 / Warn",          sub: "Activity stale" },
    },
    insight: {
      headline: "Likely idle — no activity detected for 12 minutes",
      detail:   "Dewi has been stationary near the east perimeter since completing floor 14. No new task pickup or movement signals received. She may be on an unlogged break.",
      evidence: ["GPS position unchanged for 12 minutes", "No task confirmation since 11:29", "Device battery at 42% — not a power issue"],
      confidence: "medium", // ⭐ Can't be sure worker is idle vs. on break
    },
    timeline: [
      { type: "checkin",  title: "Checked in",                   detail: "On-site at service entrance",     time: "07:03" },
      { type: "activity", title: "Floor 12 cleaning completed",  detail: "Confirmed via task app",          time: "09:48" },
      { type: "activity", title: "Floor 13 cleaning completed",  detail: "Confirmed via task app",          time: "10:42" },
      { type: "activity", title: "Floor 14 cleaning completed",  detail: "Last activity logged",            time: "11:29" },
      { type: "idle",     title: "Idle threshold reached",       detail: "10+ minutes since last activity", time: "11:39", severity: "alert" },
    ],
    actions: [
      { id: "nudge", icon: "nudge", label: "Send check-in nudge", weight: "soft",   description: "Polite push asking what they're working on.", confirmTitle: "Send a check-in nudge?",     confirmExplanation: "A push notification will ask Dewi to confirm her current task. Use this before escalating — she may be on an unlogged break.", confirmCta: "Send nudge" },
      { id: "call",  icon: "call",  label: "Call worker",         weight: "normal", description: "Open in-app voice call to verify status.",    confirmTitle: "Call Dewi Anggraini?",       confirmExplanation: "This will initiate an in-app voice call.",                                                                                       confirmCta: "Start call" },
      { id: "mark",  icon: "mark",  label: "Flag for follow-up",  weight: "normal", description: "Add to end-of-shift review list.",            confirmTitle: "Flag for end-of-shift review?", confirmExplanation: "This adds Dewi's idle period to the supervisor's end-of-shift review list. No notification is sent to the worker.", confirmCta: "Flag worker" },
    ],
  },

  offline: {
    stateKey: "offline",
    worker: { name: "Siti Nurhaliza", role: "Technician", site: "Plaza Senayan", shift: "09:00 – 17:00", initials: "SN" },
    signals: { onSite: true, anomaly: false, minsSinceHeartbeat: 14, minsSinceActivity: 14 },
    summaryConfidence: "medium", // ⭐ Location shown is last-known, not current
    snapshot: {
      location:   { value: "Last Known",     sub: "Lobby Level · 14m stale", confidence: "low" },
      activity:   { value: "AC unit repair", sub: "In progress (paused)",    confidence: "medium" },
      lastAction: { value: "11:30",          sub: "14 min ago" },
      trust:      { value: "55 / Warn",      sub: "Signal lost" },
    },
    insight: {
      headline: "Lost signal 14 minutes ago",
      detail:   "Siti's device stopped sending heartbeats at 11:30 while she was working in the lobby level. Possible low-coverage area (basement, server room, elevator shaft). Last known position may not reflect current location.",
      evidence: ["No GPS heartbeat since 11:30", "Last task: AC unit repair (active task, not closed)", "Site has known dead zones in B1 and the east elevator bank"],
      confidence: "medium",
    },
    timeline: [
      { type: "checkin",    title: "Checked in",              detail: "On-site at main lobby",       time: "09:01" },
      { type: "activity",   title: "Task assigned: AC repair",detail: "Lobby level — Unit 2",        time: "10:45" },
      { type: "movement",   title: "Moved to lobby level",    detail: "GPS confirmed",               time: "11:12" },
      { type: "activity",   title: "Task started",            detail: "AC repair in progress",       time: "11:28" },
      { type: "signal",     title: "Last GPS heartbeat",      detail: "Position: lobby level",       time: "11:30" },
      { type: "offlineEvt", title: "Signal lost",             detail: "No heartbeat for 5+ minutes", time: "11:35", severity: "alert" },
    ],
    actions: [
      { id: "nudge", icon: "nudge", label: "Send reconnect ping",    weight: "soft",   description: "Wakes the device and forces a reconnection attempt.", confirmTitle: "Send reconnect ping?",    confirmExplanation: "A silent push will wake Siti's device and force it to retry GPS + network handshake. Useful for low-coverage areas.", confirmCta: "Send ping" },
      { id: "call",  icon: "call",  label: "Call worker",            weight: "normal", description: "Try the in-app call. May fail if no signal.",         confirmTitle: "Call Siti Nurhaliza?",    confirmExplanation: "This will attempt an in-app voice call. If signal is fully lost, the call will fail and you may need a fallback channel.", confirmCta: "Start call" },
      { id: "mark",  icon: "mark",  label: "Dispatch on-site check", weight: "danger", description: "Notify nearest worker to physically locate Siti.",    confirmTitle: "Dispatch on-site check?", confirmExplanation: "This notifies the nearest available worker to physically check on Siti at her last known location. Use when remote contact has failed and worker safety may be at risk.", confirmCta: "Dispatch now" },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN — SUPERVISOR DETAIL SCREEN (refined)
   ═══════════════════════════════════════════════════════════════ */
function SupervisorDetailScreen({ scenarioKey, onBack, currentUser = "Rahmat S." }) {
  const baseScenario = SCENARIOS[scenarioKey];

  const [currentStateKey, setCurrentStateKey] = useState(baseScenario.stateKey);
  const [priorStateKey, setPriorStateKey]     = useState(null);
  const [signals, setSignals]                 = useState(baseScenario.signals);
  const [actionLog, setActionLog]             = useState([]);
  const [completedActions, setCompletedActions] = useState([]);
  const [activeModal, setActiveModal]         = useState(null);

  const fmtTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

  // ─── INTERACTION HANDLERS ─────────────────────────────
  const handleActionTap = (action) => setActiveModal(action);

  const handleActionConfirm = async (action) => {
    const time = fmtTime();
    setActiveModal(null);

    // ⭐ STEP 1 — UI UPDATE (immediate, optimistic)
    //   Log the supervisor action with attribution + channel.
    const channelMap = { nudge: "push", call: "voip", mark: "incident svc" };
    setActionLog((prev) => [
      {
        actor: "supervisor",
        actionId: action.id,
        icon: action.icon,
        label: action.label,
        detail: action.description,
        time,
        channel: channelMap[action.id],
      },
      ...prev,
    ]);
    setCompletedActions((prev) => [...prev, action.id]);

    // ⭐ STEP 2 — REAL SYSTEM ACTION (separated concern)
    //   In production this is where the backend is called.
    try {
      await triggerRealAction(action.id, { workerId: baseScenario.worker.name, stateKey: currentStateKey, timestamp: new Date().toISOString() });
    } catch (err) {
      setActionLog((prev) => [{ actor: "system", label: "Dispatch failed", detail: String(err), time: fmtTime(), outcome: "no_change" }, ...prev]);
      return;
    }

    // ⭐ STEP 3 — PROBABILISTIC OUTCOME
    //   Roll against the outcome matrix. Not all actions resolve.
    const outcome = rollOutcome(action.id, currentStateKey);
    if (!outcome) return;

    // System response arrives after a realistic delay (1.2–2.2s)
    const delay = 1200 + Math.random() * 1000;
    setTimeout(() => {
      const sysTime = fmtTime();
      setActionLog((prev) => [
        {
          actor: "system",
          label: outcome.systemMsg,
          detail: outcome.outcome === "resolved" ? "Worker state updated" : outcome.outcome === "partial" ? "Partial response received" : outcome.outcome === "no_change" ? "No state change — further action may be needed" : "Routed to downstream handler",
          time: sysTime,
          outcome: outcome.outcome,
          confidence: outcome.confidence,
        },
        ...prev,
      ]);

      // Only update state if outcome says so
      if (outcome.newState) {
        setPriorStateKey(currentStateKey);
        setCurrentStateKey(outcome.newState);
        if (outcome.newState === "active") {
          setSignals({ onSite: true, anomaly: false, minsSinceHeartbeat: 0, minsSinceActivity: 0 });
          // Add a follow-up status change entry for audit
          setTimeout(() => {
            setActionLog((prev) => [
              { actor: "system", label: `Status updated to Active`, detail: `Transitioned from ${currentStateKey} · trust score recovering`, time: fmtTime(), outcome: "resolved", confidence: "high" },
              ...prev,
            ]);
          }, 400);
        }
      }
    }, delay);
  };

  // ⭐ Build CONTEXTUAL insight from current state + action log
  const contextualInsight = generateInsight({
    stateKey: currentStateKey,
    baseInsight: baseScenario.insight,
    actionLog,
    signals,
    hadPriorState: priorStateKey,
  });

  // Build live scenario snapshot
  const liveScenario = {
    ...baseScenario,
    stateKey: currentStateKey,
    signals,
    snapshot: currentStateKey === "active"
      ? {
          location:   { value: "Inside Site",    sub: "Back on-site",         confidence: "high" },
          activity:   { value: "Resumed",        sub: "Just now",             confidence: "high" },
          lastAction: { value: fmtTime(),        sub: "just now" },
          trust:      { value: "78 / Warn",      sub: "Recovering"            },
        }
      : baseScenario.snapshot,
    summaryConfidence: currentStateKey === "active" ? "high" : baseScenario.summaryConfidence,
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(248,250,252,0.85)", borderBottom: "1px solid #eef2f6" }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors">
            <ChevronLeft size={16} strokeWidth={2.5} /><span>Roster</span>
          </button>
          <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase">Investigation</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <User size={11} strokeWidth={2.5} /><span className="font-semibold">{currentUser}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <OperationalSummary stateKey={liveScenario.stateKey} signals={liveScenario.signals} confidence={liveScenario.summaryConfidence} />
        <CoreHeaderWidget {...liveScenario.worker} stateKey={liveScenario.stateKey} />
        <SignalSnapshot stateKey={liveScenario.stateKey} scenario={liveScenario} />
        <InvestigationTimeline events={baseScenario.timeline} stateKey={liveScenario.stateKey} />
        <InsightWidget stateKey={liveScenario.stateKey} insight={contextualInsight} />

        {currentStateKey !== "active" && (
          <SuggestedActions stateKey={liveScenario.stateKey} actions={baseScenario.actions} onActionTap={handleActionTap} disabledIds={completedActions} />
        )}

        <ActionLog entries={actionLog} currentUser={currentUser} />

        <div className="text-[10.5px] text-slate-400 text-center pt-2 pb-6 leading-relaxed">
          All actions are logged with actor attribution for audit. <br />
          System outcomes are probabilistic — actions may not always resolve the issue.
        </div>
      </div>

      {activeModal && <ActionModal action={activeModal} worker={baseScenario.worker} onCancel={() => setActiveModal(null)} onConfirm={handleActionConfirm} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROSTER
   ═══════════════════════════════════════════════════════════════ */
const ROSTER = [
  { scenarioKey: "alert",   stateKey: "alert",   name: "Budi Hartono",   site: "Gandaria City",   initials: "BH", headline: "Worker has left the assigned site" },
  { scenarioKey: "offline", stateKey: "offline", name: "Siti Nurhaliza", site: "Plaza Senayan",   initials: "SN", headline: "Lost signal 14 minutes ago" },
  { scenarioKey: "idle",    stateKey: "idle",    name: "Dewi Anggraini", site: "Gedung Wisma 46", initials: "DA", headline: "Likely idle — no activity for 12 min" },
];

const RosterScreen = ({ onSelect }) => (
  <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-2">Supervisor Console · v1.2</div>
      <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">Active investigations</h1>
      <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">Production-grade: contextual insights, probabilistic outcomes, full audit attribution, and explicit confidence indicators.</p>

      <div className="space-y-2.5">
        {ROSTER.map((w) => {
          const state = TOKENS.states[w.stateKey];
          return (
            <button key={w.scenarioKey} onClick={() => onSelect(w.scenarioKey)} className="w-full flex items-center gap-3 bg-white px-3.5 py-3 transition-all hover:bg-slate-50 hover:shadow-md" style={{ borderRadius: 14, border: "1px solid #eef2f6", boxShadow: "0 1px 2px rgba(15,23,42,0.03)", borderLeft: `3px solid ${state.accent}` }}>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[12px]" style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}>{w.initials}</div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: state.pulse }} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2"><span className="text-[13px] font-semibold text-slate-900 truncate">{w.name}</span><span className="text-[10.5px] text-slate-400 truncate">· {w.site}</span></div>
                <div className="text-[11.5px] font-medium truncate mt-0.5" style={{ color: state.accent }}>{w.headline}</div>
              </div>
              <StatusPill state={state} size="sm" />
              <ArrowRight size={14} className="text-slate-300" />
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-white" style={{ border: "1px solid #eef2f6" }}>
        <div className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-2">What's new in v1.2</div>
        <ul className="space-y-1.5 text-[12px] text-slate-600 leading-relaxed">
          <li className="flex gap-2"><span className="text-slate-900 font-bold">·</span><span><strong className="text-slate-900">Contextual insights</strong> — "Worker resumed patrol after nudge" instead of "Situation resolved"</span></li>
          <li className="flex gap-2"><span className="text-slate-900 font-bold">·</span><span><strong className="text-slate-900">Probabilistic outcomes</strong> — nudge on alert worker often fails; call to offline device usually fails</span></li>
          <li className="flex gap-2"><span className="text-slate-900 font-bold">·</span><span><strong className="text-slate-900">Actor attribution</strong> — every log entry tagged Supervisor / System / Worker</span></li>
          <li className="flex gap-2"><span className="text-slate-900 font-bold">·</span><span><strong className="text-slate-900">Confidence hedging</strong> — "Likely idle", "Last known location", not bald claims</span></li>
          <li className="flex gap-2"><span className="text-slate-900 font-bold">·</span><span><strong className="text-slate-900">UI/system split</strong> — <code className="text-[10.5px] bg-slate-100 px-1 rounded">triggerRealAction()</code> isolates dispatch for backend wiring</span></li>
        </ul>
      </div>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState({ name: "roster", scenarioKey: null });
  if (view.name === "detail") return <SupervisorDetailScreen key={view.scenarioKey} scenarioKey={view.scenarioKey} onBack={() => setView({ name: "roster", scenarioKey: null })} />;
  return <RosterScreen onSelect={(scenarioKey) => setView({ name: "detail", scenarioKey })} />;
}
