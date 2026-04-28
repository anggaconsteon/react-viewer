import React, { useState, useEffect, useRef } from "react";
import {
    MapPin,
    Activity,
    Clock,
    Shield,
    RefreshCw,
    Map as MapIcon,
    AlertTriangle,
    CheckCircle2,
    Zap,
    MessageSquare,
    WifiOff,
    Bell,
    Phone,
    Flag,
    X,
    ChevronLeft,
    History,
    ListChecks,
    Send,
    PhoneCall,
    AlertOctagon,
    ArrowRight,
    Radio,
    LogIn,
    Footprints,
    ScanLine,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   ▼ REUSED FROM v1.1 — DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════ */
const TOKENS = {
    states: {
        active: { key: "active", label: "Active", accent: "#16a34a", soft: "#dcfce7", ring: "rgba(22,163,74,0.18)", pulse: "#22c55e" },
        idle: { key: "idle", label: "Idle", accent: "#b45309", soft: "#fef3c7", ring: "rgba(180,83,9,0.18)", pulse: "#f59e0b" },
        offline: { key: "offline", label: "Offline", accent: "#64748b", soft: "#f1f5f9", ring: "rgba(100,116,139,0.18)", pulse: "#94a3b8" },
        alert: { key: "alert", label: "Alert", accent: "#dc2626", soft: "#fee2e2", ring: "rgba(220,38,38,0.18)", pulse: "#ef4444" },
    },
};

/* ═══════════════════════════════════════════════════════════════
   ▼ REUSED FROM v1.1 — STATUS RESOLVER + SUMMARY BUILDER
   ═══════════════════════════════════════════════════════════════ */
const RULES = { IDLE_THRESHOLD_MIN: 10, OFFLINE_THRESHOLD_MIN: 5 };

function buildSummary(stateKey, signals) {
    switch (stateKey) {
        case "alert": return signals.anomaly ? `Anomaly detected · ${signals.anomalyDesc || "investigate"}` : `Outside site for ${signals.minsOutside || "?"} minutes`;
        case "offline": return `No signal for ${signals.minsSinceHeartbeat} minutes`;
        case "idle": return `Idle for ${signals.minsSinceActivity} minutes, no recent activity`;
        case "active":
        default: return `On-site, last activity ${signals.minsSinceActivity} min ago`;
    }
}

/* ═══════════════════════════════════════════════════════════════
   ▼ REUSED — PRIMITIVES
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
   ▼ REUSED — CORE WIDGETS  (from v1.1, unchanged)
   ═══════════════════════════════════════════════════════════════ */
const OperationalSummary = ({ stateKey, signals }) => {
    const state = TOKENS.states[stateKey];
    const summary = buildSummary(stateKey, signals);
    const Icon = stateKey === "alert" ? AlertTriangle : stateKey === "offline" ? WifiOff : stateKey === "idle" ? Clock : CheckCircle2;
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
                <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-0.5" style={{ color: state.accent, opacity: 0.75 }}>Operational Summary</div>
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
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-[13px] tracking-wide" style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}>
                        {initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ backgroundColor: state.pulse }} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate text-[15px] leading-tight">{name}</div>
                    <div className="text-slate-500 truncate mt-0.5 text-[12px]">{role} · {site}</div>
                    {shift && (
                        <div className="flex items-center gap-1 mt-1.5 text-[10.5px] text-slate-400">
                            <Clock size={10} strokeWidth={2.5} /><span className="font-medium">Shift {shift}</span>
                        </div>
                    )}
                </div>
                <StatusPill state={state} />
            </div>
        </WidgetShell>
    );
};

/* ═══════════════════════════════════════════════════════════════
   ▼ REUSED — SIGNAL SNAPSHOT TILE
   ───────────────────────────────────────────────────────────────
   New compact pattern that wraps existing signals (Location,
   Activity, Time, Trust) into a single 2x2 "snapshot" grid. This
   is a layout reuse of the same data, not a rewrite.
   ═══════════════════════════════════════════════════════════════ */
const SnapshotTile = ({ icon: Icon, label, value, sub, valueColor = "#0f172a" }) => (
    <div className="rounded-xl px-3 py-2.5 bg-white" style={{ border: "1px solid #eef2f6" }}>
        <div className="flex items-center gap-1.5 mb-1">
            <Icon size={11} className="text-slate-400" strokeWidth={2.25} />
            <span className="text-[9.5px] font-semibold tracking-[0.12em] text-slate-500 uppercase">{label}</span>
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
                <SnapshotTile icon={MapPin} label="Location" value={scenario.snapshot.location.value} sub={scenario.snapshot.location.sub} valueColor={state.accent} />
                <SnapshotTile icon={Activity} label="Activity" value={scenario.snapshot.activity.value} sub={scenario.snapshot.activity.sub} />
                <SnapshotTile icon={Clock} label="Last Action" value={scenario.snapshot.lastAction.value} sub={scenario.snapshot.lastAction.sub} />
                <SnapshotTile icon={Shield} label="Trust" value={scenario.snapshot.trust.value} sub={scenario.snapshot.trust.sub} valueColor={state.accent} />
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ NEW COMPONENT A — INVESTIGATION TIMELINE
   ───────────────────────────────────────────────────────────────
   Vertical timeline of operational signals. Reads top-to-bottom
   in chronological order. The most recent event sits at bottom
   and gets a colored accent matching the current state — that's
   where the "story" lands.
   ═══════════════════════════════════════════════════════════════ */
const TIMELINE_ICONS = {
    checkin: LogIn,
    movement: Footprints,
    activity: ScanLine,
    signal: Radio,
    anomaly: AlertTriangle,
    offlineEvt: WifiOff,
    idle: Clock,
};

const InvestigationTimeline = ({ events, stateKey }) => {
    const state = TOKENS.states[stateKey];
    return (
        <WidgetShell>
            <WidgetHeader
                icon={History}
                title="Investigation Timeline"
                rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">{events.length} events</span>}
            />
            <div className="px-4 pb-4">
                <div className="relative">
                    {/* Vertical rail */}
                    <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-200" />

                    {events.map((evt, i) => {
                        const Icon = TIMELINE_ICONS[evt.type] || Radio;
                        const isAnomaly = evt.severity === "alert";
                        const isLast = i === events.length - 1;
                        const dotColor = isAnomaly ? state.accent : "#cbd5e1";
                        const dotBg = isAnomaly ? state.soft : "white";

                        return (
                            <div key={i} className={`relative flex gap-3 ${isLast ? "" : "pb-3.5"}`}>
                                {/* Dot */}
                                <div
                                    className="relative z-10 flex-shrink-0 w-[27px] h-[27px] rounded-full flex items-center justify-center"
                                    style={{
                                        backgroundColor: dotBg,
                                        border: `1.5px solid ${dotColor}`,
                                        boxShadow: isAnomaly ? `0 0 0 3px ${state.ring}` : "0 0 0 3px white",
                                    }}
                                >
                                    <Icon size={11} style={{ color: isAnomaly ? state.accent : "#64748b" }} strokeWidth={2.5} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                        <span className={`text-[12.5px] font-semibold leading-tight ${isAnomaly ? "" : "text-slate-900"}`} style={isAnomaly ? { color: state.accent } : undefined}>
                                            {evt.title}
                                        </span>
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
   ▼ REUSED — INSIGHT WIDGET (from v1.1, with passed-in data)
   ═══════════════════════════════════════════════════════════════ */
const InsightWidget = ({ stateKey, insight }) => {
    const state = TOKENS.states[stateKey];
    return (
        <WidgetShell>
            <WidgetHeader icon={MessageSquare} title="Insight" />
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
   ⭐ NEW COMPONENT B — SUGGESTED ACTIONS
   ───────────────────────────────────────────────────────────────
   2–3 contextual actions. Sorted by escalation level: gentle nudge
   first, escalation last. Each action has a "weight" that determines
   its visual treatment in the modal.
   ═══════════════════════════════════════════════════════════════ */
const ACTION_ICONS = { nudge: Send, call: PhoneCall, mark: AlertOctagon, log: ListChecks };

const SuggestedActions = ({ stateKey, actions, onActionTap, disabledIds = [] }) => {
    const state = TOKENS.states[stateKey];

    return (
        <WidgetShell>
            <WidgetHeader
                icon={ListChecks}
                title="Suggested Actions"
                rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">Sorted by escalation</span>}
            />
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
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{
                                    backgroundColor: isDanger ? "#fee2e2" : "#f1f5f9",
                                    color: isDanger ? "#b91c1c" : "#0f172a",
                                }}
                            >
                                <Icon size={15} strokeWidth={2.25} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[13px] font-semibold ${isDanger ? "text-red-700" : "text-slate-900"}`}>{action.label}</span>
                                    {isDone && (
                                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">Done</span>
                                    )}
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
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ NEW COMPONENT C — ACTION MODAL
   ───────────────────────────────────────────────────────────────
   Confirmation step. Shows the action title, what will happen, and
   gives the supervisor an explicit confirm. Background blurs.
   ═══════════════════════════════════════════════════════════════ */
const ActionModal = ({ action, worker, onCancel, onConfirm }) => {
    const overlayRef = useRef(null);

    // Close on ESC
    useEffect(() => {
        const handler = (e) => e.key === "Escape" && onCancel();
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onCancel]);

    if (!action) return null;
    const Icon = ACTION_ICONS[action.icon] || Send;
    const isDanger = action.weight === "danger";

    return (
        <div
            ref={overlayRef}
            onClick={(e) => e.target === overlayRef.current && onCancel()}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
        >
            <div
                className="bg-white w-full max-w-sm overflow-hidden animate-in"
                style={{
                    borderRadius: 22,
                    boxShadow: "0 25px 50px -12px rgba(15,23,42,0.35)",
                    animation: "modalIn 0.18s ease-out",
                }}
            >
                {/* Top accent */}
                <div className="h-1" style={{ backgroundColor: isDanger ? "#dc2626" : "#0f172a" }} />

                {/* Header with close */}
                <div className="flex items-start justify-between px-5 pt-5 pb-3">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: isDanger ? "#fee2e2" : "#f1f5f9", color: isDanger ? "#b91c1c" : "#0f172a" }}
                    >
                        <Icon size={18} strokeWidth={2.25} />
                    </div>
                    <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                        <X size={16} strokeWidth={2.25} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 pb-2">
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight mb-1.5">{action.confirmTitle || action.label}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{action.confirmExplanation || action.description}</p>
                </div>

                {/* Worker context */}
                <div className="mx-5 mt-4 mb-5 p-3 rounded-xl" style={{ backgroundColor: "#f8fafc", border: "1px solid #eef2f6" }}>
                    <div className="text-[9.5px] font-bold tracking-[0.14em] text-slate-400 uppercase mb-1">Worker</div>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-[10px]" style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}>
                            {worker.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[12.5px] font-semibold text-slate-900 truncate">{worker.name}</div>
                            <div className="text-[10.5px] text-slate-500 truncate">{worker.role} · {worker.site}</div>
                        </div>
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="px-5 pb-5 flex gap-2">
                    <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-100" style={{ border: "1px solid #e2e8f0" }}>
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(action)}
                        className="flex-[1.4] py-3 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
                        style={{ backgroundColor: isDanger ? "#dc2626" : "#0f172a", boxShadow: "0 1px 2px rgba(15,23,42,0.08)" }}
                    >
                        {action.confirmCta || `Confirm ${action.label}`}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════
   ⭐ NEW COMPONENT D — ACTION LOG
   ───────────────────────────────────────────────────────────────
   History of supervisor actions + system responses. Inverted
   timeline (newest first), distinguishes "supervisor action" from
   "system event" via icon style.
   ═══════════════════════════════════════════════════════════════ */
const ActionLog = ({ entries }) => {
    if (!entries || entries.length === 0) {
        return (
            <WidgetShell>
                <WidgetHeader icon={History} title="Action Log" rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">Empty</span>} />
                <div className="px-4 pb-4 pt-1">
                    <div className="text-[12px] text-slate-400 leading-relaxed text-center py-3">
                        No actions taken yet. Confirmed actions will appear here.
                    </div>
                </div>
            </WidgetShell>
        );
    }

    return (
        <WidgetShell>
            <WidgetHeader icon={History} title="Action Log" rightSlot={<span className="text-[10.5px] text-slate-400 font-medium">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>} />
            <div className="px-4 pb-4 space-y-2">
                {entries.map((entry, i) => {
                    const isSystem = entry.kind === "system";
                    const Icon = isSystem ? CheckCircle2 : (ACTION_ICONS[entry.icon] || Send);
                    return (
                        <div
                            key={i}
                            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
                            style={{ backgroundColor: isSystem ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isSystem ? "#dcfce7" : "#eef2f6"}` }}
                        >
                            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: isSystem ? "#dcfce7" : "white", color: isSystem ? "#16a34a" : "#0f172a", border: isSystem ? "none" : "1px solid #e2e8f0" }}>
                                <Icon size={11} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className="text-[12px] font-semibold text-slate-900 leading-tight">{entry.label}</span>
                                    <span className="text-[10.5px] text-slate-400 font-mono tabular-nums flex-shrink-0">{entry.time}</span>
                                </div>
                                {entry.detail && <div className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">{entry.detail}</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </WidgetShell>
    );
};

/* ═══════════════════════════════════════════════════════════════
   SCENARIO DATA
   ───────────────────────────────────────────────────────────────
   Three preconfigured investigation scenarios (alert / idle / offline).
   Each provides everything the screen needs: worker, signals,
   snapshot, timeline events, insight, and suggested actions.
   ═══════════════════════════════════════════════════════════════ */
const SCENARIOS = {
    alert: {
        stateKey: "alert",
        worker: { name: "Budi Hartono", role: "Security Officer", site: "Gandaria City", shift: "08:00 – 16:00", initials: "BH" },
        signals: { onSite: false, anomaly: false, minsSinceHeartbeat: 0, minsSinceActivity: 7, minsOutside: 7 },
        snapshot: {
            location: { value: "Outside Site", sub: "~340m NE of geofence" },
            activity: { value: "Unassigned movement", sub: "Last: CP-04 at 11:51" },
            lastAction: { value: "11:51", sub: "7 min ago" },
            trust: { value: "41 / Risk", sub: "Geofence breach" },
        },
        insight: {
            headline: "Worker has left the assigned site",
            detail: "Budi crossed the south geofence boundary at 11:51 and has been moving away from the assigned patrol area. No prior approval logged.",
            evidence: [
                "GPS trace shows continuous outbound movement (~50m/min)",
                "No checkpoint scan since CP-04 at 11:51",
                "No leave/break request in queue",
            ],
        },
        timeline: [
            { type: "checkin", title: "Checked in", detail: "On-site at gate B", time: "08:02" },
            { type: "activity", title: "Patrol Area A completed", detail: "5/5 checkpoints scanned", time: "10:14" },
            { type: "activity", title: "Patrol Area B started", detail: "Assigned by supervisor", time: "10:30" },
            { type: "activity", title: "Checkpoint CP-04 scanned", detail: "Last in-site activity", time: "11:51" },
            { type: "anomaly", title: "Geofence breach detected", detail: "Crossed south boundary heading NE", time: "11:52", severity: "alert" },
            { type: "movement", title: "Continued movement off-site", detail: "Now ~340m from site, still moving", time: "11:58", severity: "alert" },
        ],
        actions: [
            { id: "nudge", icon: "nudge", label: "Send check-in nudge", weight: "soft", description: "Push notification asking the worker to confirm status.", confirmTitle: "Send a check-in nudge?", confirmExplanation: "A push notification will be sent to Budi asking them to confirm their status. They have 5 minutes to respond before this auto-escalates.", confirmCta: "Send nudge" },
            { id: "call", icon: "call", label: "Call worker", weight: "normal", description: "Open the in-app voice call to Budi's device.", confirmTitle: "Call Budi Hartono?", confirmExplanation: "This will initiate an in-app voice call. The worker will hear a ringtone and can accept or decline.", confirmCta: "Start call" },
            { id: "mark", icon: "mark", label: "Mark as security incident", weight: "danger", description: "Escalate to incident channel and notify site manager.", confirmTitle: "Mark as security incident?", confirmExplanation: "This will escalate to the incident channel, notify the site manager, and create a formal report. Use only when worker safety or asset security is at risk.", confirmCta: "Escalate now" },
        ],
    },

    idle: {
        stateKey: "idle",
        worker: { name: "Dewi Anggraini", role: "Cleaning Staff", site: "Gedung Wisma 46", shift: "07:00 – 15:00", initials: "DA" },
        signals: { onSite: true, anomaly: false, minsSinceHeartbeat: 1, minsSinceActivity: 12 },
        snapshot: {
            location: { value: "Near Boundary", sub: "East perimeter" },
            activity: { value: "Awaiting next task", sub: "Last: floor 14 done" },
            lastAction: { value: "11:29", sub: "12 min ago" },
            trust: { value: "68 / Warn", sub: "Activity stale" },
        },
        insight: {
            headline: "No activity detected for 12 minutes",
            detail: "Dewi has been stationary near the east perimeter since completing floor 14. No new task pickup or movement signals received.",
            evidence: [
                "GPS position unchanged for 12 minutes",
                "No task confirmation since 11:29",
                "Device battery at 42% — not a power issue",
            ],
        },
        timeline: [
            { type: "checkin", title: "Checked in", detail: "On-site at service entrance", time: "07:03" },
            { type: "activity", title: "Floor 12 cleaning completed", detail: "Confirmed via task app", time: "09:48" },
            { type: "activity", title: "Floor 13 cleaning completed", detail: "Confirmed via task app", time: "10:42" },
            { type: "activity", title: "Floor 14 cleaning completed", detail: "Last activity logged", time: "11:29" },
            { type: "idle", title: "Idle threshold reached", detail: "10+ minutes since last activity", time: "11:39", severity: "alert" },
        ],
        actions: [
            { id: "nudge", icon: "nudge", label: "Send check-in nudge", weight: "soft", description: "Polite push asking what they're working on.", confirmTitle: "Send a check-in nudge?", confirmExplanation: "A push notification will ask Dewi to confirm her current task. Use this before escalating — she may be on an unlogged break.", confirmCta: "Send nudge" },
            { id: "call", icon: "call", label: "Call worker", weight: "normal", description: "Open in-app voice call to verify status.", confirmTitle: "Call Dewi Anggraini?", confirmExplanation: "This will initiate an in-app voice call.", confirmCta: "Start call" },
            { id: "mark", icon: "mark", label: "Flag for follow-up", weight: "normal", description: "Add to end-of-shift review list.", confirmTitle: "Flag for end-of-shift review?", confirmExplanation: "This adds Dewi's idle period to the supervisor's end-of-shift review list. No notification is sent to the worker.", confirmCta: "Flag worker" },
        ],
    },

    offline: {
        stateKey: "offline",
        worker: { name: "Siti Nurhaliza", role: "Technician", site: "Plaza Senayan", shift: "09:00 – 17:00", initials: "SN" },
        signals: { onSite: true, anomaly: false, minsSinceHeartbeat: 14, minsSinceActivity: 14 },
        snapshot: {
            location: { value: "Last Known", sub: "Lobby Level (stale)" },
            activity: { value: "AC unit repair", sub: "In progress" },
            lastAction: { value: "11:30", sub: "14 min ago" },
            trust: { value: "55 / Warn", sub: "Signal lost" },
        },
        insight: {
            headline: "Lost signal 14 minutes ago",
            detail: "Siti's device stopped sending heartbeats at 11:30 while she was working in the lobby level. Possible low-coverage area (basement, server room, elevator shaft).",
            evidence: [
                "No GPS heartbeat since 11:30",
                "Last task: AC unit repair (active task, not closed)",
                "Site has known dead zones in B1 and the east elevator bank",
            ],
        },
        timeline: [
            { type: "checkin", title: "Checked in", detail: "On-site at main lobby", time: "09:01" },
            { type: "activity", title: "Task assigned: AC repair", detail: "Lobby level — Unit 2", time: "10:45" },
            { type: "movement", title: "Moved to lobby level", detail: "GPS confirmed", time: "11:12" },
            { type: "activity", title: "Task started", detail: "AC repair in progress", time: "11:28" },
            { type: "signal", title: "Last GPS heartbeat", detail: "Position: lobby level", time: "11:30" },
            { type: "offlineEvt", title: "Signal lost", detail: "No heartbeat for 5+ minutes", time: "11:35", severity: "alert" },
        ],
        actions: [
            { id: "nudge", icon: "nudge", label: "Send reconnect ping", weight: "soft", description: "Wakes the device and forces a reconnection attempt.", confirmTitle: "Send reconnect ping?", confirmExplanation: "A silent push will wake Siti's device and force it to retry GPS + network handshake. Useful for low-coverage areas.", confirmCta: "Send ping" },
            { id: "call", icon: "call", label: "Call worker", weight: "normal", description: "Try the in-app call. May fail if no signal.", confirmTitle: "Call Siti Nurhaliza?", confirmExplanation: "This will attempt an in-app voice call. If signal is fully lost, the call will fail and you may need a fallback channel.", confirmCta: "Start call" },
            { id: "mark", icon: "mark", label: "Dispatch on-site check", weight: "danger", description: "Notify nearest worker to physically locate Siti.", confirmTitle: "Dispatch on-site check?", confirmExplanation: "This notifies the nearest available worker to physically check on Siti at her last known location. Use when remote contact has failed and worker safety may be at risk.", confirmCta: "Dispatch now" },
        ],
    },
};

/* ═══════════════════════════════════════════════════════════════
   ▼ INTERACTION FLOW — outcomes when actions are confirmed
   ───────────────────────────────────────────────────────────────
   Each action defines what the system does after confirmation:
   what gets logged, what the next system event is, and whether
   the worker's status changes.
   ═══════════════════════════════════════════════════════════════ */
const ACTION_OUTCOMES = {
    nudge: {
        log: { kind: "supervisor", icon: "nudge", label: "Nudge sent", detail: "Push notification delivered to device" },
        systemFollowUp: {
            delay: 1800,
            idle: { kind: "system", label: "Worker resumed activity", detail: "Task picked up · status updated to Active", newState: "active" },
            offline: { kind: "system", label: "Device reconnected", detail: "GPS heartbeat received · status updated to Active", newState: "active" },
            alert: { kind: "system", label: "Worker acknowledged", detail: "Confirmed: heading back to site", newState: null }, // still alert until back on-site
        },
    },
    call: {
        log: { kind: "supervisor", icon: "call", label: "Call initiated", detail: "In-app voice call started" },
        systemFollowUp: { delay: 1800, idle: { kind: "system", label: "Call connected", detail: "Worker answered · 0:42 duration", newState: null }, offline: { kind: "system", label: "Call failed", detail: "No signal — could not connect", newState: null }, alert: { kind: "system", label: "Call connected", detail: "Worker answered · investigating", newState: null } },
    },
    mark: {
        log: { kind: "supervisor", icon: "mark", label: "Action escalated", detail: "Logged to incident channel" },
        systemFollowUp: { delay: 1500, idle: { kind: "system", label: "Added to review queue", detail: "Will appear in end-of-shift report", newState: null }, offline: { kind: "system", label: "On-site dispatch sent", detail: "Nearest worker notified (ETA 4 min)", newState: null }, alert: { kind: "system", label: "Incident channel notified", detail: "Site manager + ops lead alerted", newState: null } },
    },
};

/* ═══════════════════════════════════════════════════════════════
   MAIN — SUPERVISOR DETAIL SCREEN
   ═══════════════════════════════════════════════════════════════ */
function SupervisorDetailScreen({ scenarioKey, onBack }) {
    const baseScenario = SCENARIOS[scenarioKey];

    // Local state — the screen owns the live state, log, and active modal
    const [currentStateKey, setCurrentStateKey] = useState(baseScenario.stateKey);
    const [signals, setSignals] = useState(baseScenario.signals);
    const [actionLog, setActionLog] = useState([]);
    const [completedActions, setCompletedActions] = useState([]);
    const [activeModal, setActiveModal] = useState(null);

    // Derived: live event timeline (base events + supervisor-injected)
    const timelineEvents = baseScenario.timeline;

    const fmtTime = () => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    // ─── INTERACTION HANDLERS ─────────────────────────────
    const handleActionTap = (action) => setActiveModal(action);

    const handleActionConfirm = (action) => {
        const outcome = ACTION_OUTCOMES[action.id];
        if (!outcome) { setActiveModal(null); return; }

        const time = fmtTime();

        // 1. Log the supervisor action immediately
        setActionLog((prev) => [
            { ...outcome.log, time, label: `${outcome.log.label}: ${action.label}` },
            ...prev,
        ]);
        setCompletedActions((prev) => [...prev, action.id]);
        setActiveModal(null);

        // 2. Schedule the system follow-up event
        const followUp = outcome.systemFollowUp[currentStateKey];
        if (followUp) {
            setTimeout(() => {
                const followUpTime = fmtTime();
                setActionLog((prev) => [{ ...followUp, time: followUpTime }, ...prev]);

                // 3. Optionally update worker status
                if (followUp.newState) {
                    setCurrentStateKey(followUp.newState);
                    // Refresh signals to reflect new state
                    if (followUp.newState === "active") {
                        setSignals({ onSite: true, anomaly: false, minsSinceHeartbeat: 0, minsSinceActivity: 0 });
                    }
                }
            }, outcome.systemFollowUp.delay);
        }
    };

    // Build a "live" scenario so summary/snapshot reflect current state
    const liveScenario = {
        ...baseScenario,
        stateKey: currentStateKey,
        signals,
        snapshot: currentStateKey === "active"
            ? {
                location: { value: "Inside Site", sub: "Back on-site" },
                activity: { value: "Resumed", sub: "Just now" },
                lastAction: { value: fmtTime(), sub: "just now" },
                trust: { value: "78 / Warn", sub: "Recovering" },
            }
            : baseScenario.snapshot,
        insight: currentStateKey === "active"
            ? {
                headline: "Situation resolved",
                detail: "Worker is back on-site and active. Status normalized after supervisor intervention.",
                evidence: ["Heartbeat restored", "Activity resumed", "Geofence: ok"],
            }
            : baseScenario.insight,
    };

    return (
        <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
            {/* ── Sticky top bar ──────────────────── */}
            <div className="sticky top-0 z-40 backdrop-blur-md" style={{ background: "rgba(248,250,252,0.85)", borderBottom: "1px solid #eef2f6" }}>
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={16} strokeWidth={2.5} />
                        <span>Roster</span>
                    </button>
                    <div className="text-[10.5px] font-bold tracking-[0.18em] text-slate-400 uppercase">Investigation</div>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                        <RefreshCw size={14} strokeWidth={2.25} />
                    </button>
                </div>
            </div>

            {/* ── Body ──────────────────────────── */}
            <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
                {/* 1. Operational Summary (reused) */}
                <OperationalSummary stateKey={liveScenario.stateKey} signals={liveScenario.signals} />

                {/* 2. Core Header (reused) */}
                <CoreHeaderWidget {...liveScenario.worker} stateKey={liveScenario.stateKey} />

                {/* 3. Signal Snapshot (compact reuse of widgets as 2x2 tiles) */}
                <SignalSnapshot stateKey={liveScenario.stateKey} scenario={liveScenario} />

                {/* 4. Investigation Timeline (NEW) */}
                <InvestigationTimeline events={timelineEvents} stateKey={liveScenario.stateKey} />

                {/* 5. Insight (reused with evidence list) */}
                <InsightWidget stateKey={liveScenario.stateKey} insight={liveScenario.insight} />

                {/* 6. Suggested Actions (NEW) — hidden when situation resolved */}
                {currentStateKey !== "active" && (
                    <SuggestedActions
                        stateKey={liveScenario.stateKey}
                        actions={baseScenario.actions}
                        onActionTap={handleActionTap}
                        disabledIds={completedActions}
                    />
                )}

                {/* 7. Action Log (NEW) */}
                <ActionLog entries={actionLog} />

                <div className="text-[10.5px] text-slate-400 text-center pt-2 pb-6 leading-relaxed">
                    Confirmed actions are logged and time-stamped. <br />
                    System responses appear automatically within 2 seconds (simulated).
                </div>
            </div>

            {/* Modal */}
            {activeModal && (
                <ActionModal
                    action={activeModal}
                    worker={baseScenario.worker}
                    onCancel={() => setActiveModal(null)}
                    onConfirm={handleActionConfirm}
                />
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   ROSTER — entry point that links to the detail screen
   (reuses the SupervisorRow pattern from v1.1)
   ═══════════════════════════════════════════════════════════════ */
const ROSTER = [
    { scenarioKey: "alert", stateKey: "alert", name: "Budi Hartono", site: "Gandaria City", initials: "BH", headline: "Worker has left the assigned site" },
    { scenarioKey: "offline", stateKey: "offline", name: "Siti Nurhaliza", site: "Plaza Senayan", initials: "SN", headline: "Lost signal 14 minutes ago" },
    { scenarioKey: "idle", stateKey: "idle", name: "Dewi Anggraini", site: "Gedung Wisma 46", initials: "DA", headline: "No activity detected for 12 minutes" },
];

const RosterScreen = ({ onSelect }) => (
    <div className="min-h-screen w-full" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)", fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-2">Supervisor Console · Demo</div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight leading-none mb-1.5">Active investigations</h1>
            <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">Tap a worker to open the investigation flow. Each scenario lets you take suggested actions and see the system respond in real time.</p>

            <div className="space-y-2.5">
                {ROSTER.map((w) => {
                    const state = TOKENS.states[w.stateKey];
                    return (
                        <button
                            key={w.scenarioKey}
                            onClick={() => onSelect(w.scenarioKey)}
                            className="w-full flex items-center gap-3 bg-white px-3.5 py-3 transition-all hover:bg-slate-50 hover:shadow-md"
                            style={{ borderRadius: 14, border: "1px solid #eef2f6", boxShadow: "0 1px 2px rgba(15,23,42,0.03)", borderLeft: `3px solid ${state.accent}` }}
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-[12px]" style={{ background: "linear-gradient(135deg, #334155 0%, #0f172a 100%)" }}>{w.initials}</div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: state.pulse }} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-semibold text-slate-900 truncate">{w.name}</span>
                                    <span className="text-[10.5px] text-slate-400 truncate">· {w.site}</span>
                                </div>
                                <div className="text-[11.5px] font-medium truncate mt-0.5" style={{ color: state.accent }}>{w.headline}</div>
                            </div>
                            <StatusPill state={state} size="sm" />
                            <ArrowRight size={14} className="text-slate-300" />
                        </button>
                    );
                })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-white" style={{ border: "1px solid #eef2f6" }}>
                <div className="text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase mb-2">How to demo</div>
                <ol className="space-y-1.5 text-[12px] text-slate-600 leading-relaxed">
                    <li><span className="font-semibold text-slate-900">1.</span> Tap any worker above to open their investigation screen</li>
                    <li><span className="font-semibold text-slate-900">2.</span> Review the timeline, insight, and suggested actions</li>
                    <li><span className="font-semibold text-slate-900">3.</span> Tap an action → confirm in the modal → watch the log update</li>
                    <li><span className="font-semibold text-slate-900">4.</span> Some actions trigger system follow-ups (e.g. "Worker resumed activity") within ~2s</li>
                </ol>
            </div>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════
   APP — view router
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
    const [view, setView] = useState({ name: "roster", scenarioKey: null });

    if (view.name === "detail") {
        return (
            <SupervisorDetailScreen
                key={view.scenarioKey}  // remount to reset state when scenario changes
                scenarioKey={view.scenarioKey}
                onBack={() => setView({ name: "roster", scenarioKey: null })}
            />
        );
    }
    return <RosterScreen onSelect={(scenarioKey) => setView({ name: "detail", scenarioKey })} />;
}
