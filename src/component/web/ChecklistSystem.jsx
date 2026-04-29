import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ════════════════════════════════════════════════════════════════════════════
   ChecklistItem (refactored) + ChecklistReport (new)

   Design system: Worker Widget System v1.0
   - ChecklistItem now ONLY handles task status. No photos, no notes, no forms.
   - Issue is still a selectable status — but selecting it does NOT open a panel.
   - All evidence (photos + notes) is centralized in ChecklistReport at the end
     of the checklist.
   ════════════════════════════════════════════════════════════════════════════ */


/* ─── Status constants (unchanged) ───────────────────────────────────────── */
const STATUS = {
  PENDING:       "pending",
  DONE:          "done",
  NOT_AVAILABLE: "not_available",
  SKIPPED:       "skipped",
  ISSUE:         "issue",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "#6B7280", bg: "transparent", border: "#D1D5DB",
    iconBg: "#F3F4F6", iconColor: "#9CA3AF",
  },
  done: {
    label: "Done",
    color: "#15803D", bg: "#F0FDF4", border: "#86EFAC",
    iconBg: "#16A34A", iconColor: "#ffffff",
  },
  not_available: {
    label: "Not Available",
    color: "#6B7280", bg: "#F9FAFB", border: "#E5E7EB",
    iconBg: "#E5E7EB", iconColor: "#9CA3AF",
  },
  skipped: {
    label: "Skipped",
    color: "#B45309", bg: "#FFFBEB", border: "#FCD34D",
    iconBg: "#FEF3C7", iconColor: "#B45309",
  },
  issue: {
    label: "Issue",
    color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA",
    iconBg: "#FEE2E2", iconColor: "#DC2626",
  },
};

const MENU_OPTIONS = [
  { status: STATUS.DONE,          label: "Done",          sub: "Mark as completed",       accent: "#16A34A", bgAccent: "#F0FDF4", IconComp: CheckIcon },
  { status: STATUS.NOT_AVAILABLE, label: "Not Available", sub: "Item absent from this area", accent: "#6B7280", bgAccent: "#F3F4F6", IconComp: NAIcon    },
  { status: STATUS.SKIPPED,       label: "Skipped",       sub: "Come back to this later", accent: "#B45309", bgAccent: "#FFFBEB", IconComp: SkipIcon  },
  { status: STATUS.ISSUE,         label: "Issue",         sub: "Flag a problem to report", accent: "#B91C1C", bgAccent: "#FEF2F2", IconComp: IssueIcon },
];


/* ─── SVG Icons (unchanged + a couple new for the report) ────────────────── */
function CheckIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12,3 5.5,10 2,6.5" />
    </svg>
  );
}
function NAIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="3" x2="11" y2="11" />
      <line x1="11" y1="3" x2="3" y2="11" />
    </svg>
  );
}
function SkipIcon({ size = 13, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,3 10,7 4,11" />
    </svg>
  );
}
function IssueIcon({ size = 14, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <line x1="8" y1="5" x2="8" y2="9" />
      <circle cx="8" cy="11.5" r="0.9" fill={color} stroke="none" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="3.5" cy="8" r="1.3" />
      <circle cx="8"   cy="8" r="1.3" />
      <circle cx="12.5" cy="8" r="1.3" />
    </svg>
  );
}
function CameraIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h2.5l1.2-2h6.6L14.5 7H17a1.5 1.5 0 011.5 1.5v7A1.5 1.5 0 0117 17H3a1.5 1.5 0 01-1.5-1.5v-7A1.5 1.5 0 013 7z" />
      <circle cx="10" cy="11.5" r="3" />
    </svg>
  );
}
function TrashIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9a1 1 0 001 1h3a1 1 0 001-1l.5-9" />
    </svg>
  );
}
function SendIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2L7 9" />
      <path d="M14 2l-4.5 12-2.5-5L2 6.5 14 2z" />
    </svg>
  );
}


/* ─── Status Circle Icon ─────────────────────────────────────────────────── */
function StatusCircleIcon({ status }) {
  const cfg = STATUS_CONFIG[status];
  let icon = null;
  switch (status) {
    case STATUS.DONE:          icon = <CheckIcon  size={14} color={cfg.iconColor} />; break;
    case STATUS.NOT_AVAILABLE: icon = <NAIcon     size={14} color={cfg.iconColor} />; break;
    case STATUS.SKIPPED:       icon = <SkipIcon   size={14} color={cfg.iconColor} />; break;
    case STATUS.ISSUE:         icon = <IssueIcon  size={14} color={cfg.iconColor} />; break;
    default:                   icon = null;
  }
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%",
      background: cfg.iconBg,
      border: status === STATUS.PENDING ? `1.5px solid ${cfg.border}` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, transition: "all 0.2s ease",
    }}>
      {icon}
    </div>
  );
}


/* ─── Status Menu (popover) ──────────────────────────────────────────────── */
function StatusMenu({ isOpen, anchorRef, onSelect, onClose, currentStatus }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} style={{
      position: "absolute", bottom: "calc(100% + 8px)", right: 0,
      background: "#fff", borderRadius: 14,
      border: "0.5px solid #E5E7EB",
      boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      zIndex: 100, minWidth: 220, overflow: "hidden",
      animation: "menuIn 0.18s ease",
    }}>
      <div style={{
        padding: "8px 14px 6px", fontSize: 11, fontWeight: 500,
        color: "#9CA3AF", borderBottom: "0.5px solid #F3F4F6",
      }}>
        Change status
      </div>
      {MENU_OPTIONS.map((opt) => (
        <div key={opt.status}
          onClick={() => { onSelect(opt.status); onClose(); }}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", cursor: "pointer",
            background: currentStatus === opt.status ? opt.bgAccent : "transparent",
            borderBottom: "0.5px solid #F9FAFB",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = opt.bgAccent; }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              currentStatus === opt.status ? opt.bgAccent : "transparent";
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: opt.bgAccent,
            border: `0.5px solid ${opt.accent}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <opt.IconComp size={13} color={opt.accent} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{opt.label}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{opt.sub}</div>
          </div>
          {currentStatus === opt.status && (
            <div style={{ marginLeft: "auto" }}>
              <CheckIcon size={12} color={opt.accent} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


/* ─── Status Pill (inline) ───────────────────────────────────────────────── */
function StatusPill({ status }) {
  if (status === STATUS.PENDING || status === STATUS.DONE) return null;
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: "2px 7px",
      borderRadius: 99, background: cfg.bg,
      color: cfg.color, border: `0.5px solid ${cfg.border}`,
      whiteSpace: "nowrap", flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}


/* ════════════════════════════════════════════════════════════════════════════
   CHECKLIST ITEM — refactored
   ────────────────────────────────────────────────────────────────────────────
   - Tap row     → marks DONE (fast path)
   - Tap ⋯       → opens status menu (Done / Not Available / Skipped / Issue)
   - "Issue"     → just a status. No inline panel. No photo. No note.
   - Evidence    → captured globally in <ChecklistReport />
   ════════════════════════════════════════════════════════════════════════════ */
export function ChecklistItem({
  id,
  title,
  subLabel: subLabelOverride = null,
  status: initialStatus = STATUS.PENDING,
  timestamp: initialTimestamp = null,
  category = null,
  disabled = false,
  onStatusChange,
  className = "",
}) {
  const [status,    setStatus]    = useState(initialStatus);
  const [timestamp, setTimestamp] = useState(initialTimestamp);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [pressed,   setPressed]   = useState(false);

  const dotsRef = useRef(null);
  const cfg = STATUS_CONFIG[status];

  const now = () => {
    const d = new Date();
    return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
  };

  const applyStatus = useCallback((next) => {
    const ts = next === STATUS.DONE ? now() : null;
    setStatus(next);
    setTimestamp(ts);
    onStatusChange?.(id, next, { timestamp: ts });
  }, [id, onStatusChange]);

  const onTap = () => {
    if (disabled) return;
    if (status === STATUS.PENDING) {
      applyStatus(STATUS.DONE);
    } else {
      setMenuOpen((o) => !o);
    }
  };

  const onOpenMenu = (e) => {
    e.stopPropagation();
    if (disabled) return;
    setMenuOpen((o) => !o);
  };

  // Default sub-labels per state — overridable via prop
  const defaultSub = {
    done:          timestamp ? `Completed at ${timestamp}` : "Completed",
    not_available: "Not available in this area",
    skipped:       "Skipped — revisit later",
    issue:         "Issue flagged — describe in report",
    pending:       null,
  }[status];
  const subLabel = subLabelOverride ?? defaultSub;

  return (
    <>
      <style>{`
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes doneFlash {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .ci-more-btn:hover  { background: #F3F4F6 !important; }
        .ci-more-btn:active { background: #E5E7EB !important; }
      `}</style>

      <div
        className={`checklist-item-root ${className}`}
        style={{
          background: cfg.bg || "#fff",
          border: `0.5px solid ${cfg.border}`,
          borderRadius: 14,
          overflow: "visible",
          position: "relative",
          transition: "border-color 0.2s ease, background 0.2s ease",
          opacity: disabled ? 0.55 : 1,
          userSelect: "none",
        }}
      >
        {/* Main row */}
        <div
          onClick={onTap}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 12px",
            cursor: disabled ? "not-allowed" : "pointer",
            transform: pressed ? "scale(0.99)" : "scale(1)",
            transition: "transform 0.1s ease",
          }}
        >
          {/* Status circle */}
          <div
            className="ci-check-circle"
            style={{
              transition: "transform 0.2s ease",
              animation: status === STATUS.DONE && !initialTimestamp
                ? "doneFlash 0.35s ease" : "none",
            }}
            onClick={(e) => { e.stopPropagation(); onTap(); }}
          >
            <StatusCircleIcon status={status} />
          </div>

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {category && (
              <div style={{
                display: "inline-block", fontSize: 10, fontWeight: 500,
                color: "#6366F1", background: "#EEF2FF", borderRadius: 4,
                padding: "1px 6px", marginBottom: 3,
              }}>
                {category}
              </div>
            )}
            <div style={{
              fontSize: 14, fontWeight: 400,
              color: status === STATUS.NOT_AVAILABLE ? "#9CA3AF" :
                     status === STATUS.DONE          ? "#6B7280" : "#111827",
              textDecoration: status === STATUS.DONE ? "line-through" : "none",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {title}
            </div>

            {subLabel && (
              <div style={{
                fontSize: 11, marginTop: 2, color: cfg.color,
                transition: "all 0.2s ease",
              }}>
                {subLabel}
              </div>
            )}
          </div>

          <StatusPill status={status} />

          {/* ··· menu trigger */}
          <div
            ref={dotsRef}
            className="ci-more-btn"
            onClick={onOpenMenu}
            role="button"
            aria-label="Change status"
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: menuOpen ? "#F3F4F6" : "transparent",
              border: "0.5px solid #E5E7EB", cursor: "pointer",
              color: "#6B7280", transition: "background 0.12s",
            }}
          >
            <DotsIcon />
          </div>
        </div>

        <StatusMenu
          isOpen={menuOpen}
          anchorRef={dotsRef}
          onSelect={(next) => applyStatus(next)}
          onClose={() => setMenuOpen(false)}
          currentStatus={status}
        />
      </div>
    </>
  );
}


/* ════════════════════════════════════════════════════════════════════════════
   CHECKLIST REPORT — new
   ────────────────────────────────────────────────────────────────────────────
   Single, shared evidence surface for the whole checklist.

   Built on the WidgetShell / WidgetHeader pattern from the design system:
     · 18px radius, two-layer shadow, #eef2f6 hairline border, white surface
     · 24×24 icon tile, 10.5px / 600 / 0.14em uppercase micro-label
     · Three-tier hierarchy (primary headline · supporting hint · meta)
     · Single dark-slate primary button, full-width, with active:scale feedback
     · Disabled state shows a visible reason ("Add at least one photo…")
     · Honest about uncertainty: counts of done / total are always visible
   ════════════════════════════════════════════════════════════════════════════ */
export function ChecklistReport({
  stats = { done: 0, total: 0, issues: 0 },
  minPhotos = 1,
  requireNote = false,
  disabled = false,
  onSubmit,
  className = "",
}) {
  const [photos, setPhotos] = useState([]);   // [{ id, url, name }]
  const [note,   setNote]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  // Cleanup object URLs
  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = files.map((f) => ({
      id: `${Date.now()}-${f.name}`,
      url: URL.createObjectURL(f),
      name: f.name,
    }));
    setPhotos((prev) => [...prev, ...next]);
    e.target.value = ""; // allow re-select of same file
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  // ── Validation: derive a single, honest reason the submit is blocked ──
  const blockReason = useMemo(() => {
    if (stats.done === 0)         return "Complete at least one task to submit";
    if (photos.length < minPhotos) return `Add at least ${minPhotos} photo${minPhotos > 1 ? "s" : ""} of the work area`;
    if (requireNote && !note.trim()) return "Add a short note describing the visit";
    return null;
  }, [stats.done, photos.length, minPhotos, requireNote, note]);

  const canSubmit = !disabled && !submitting && !blockReason;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit?.({
        photos, note: note.trim(),
        stats,
        submittedAt: new Date().toISOString(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={className}
      style={{
        // WidgetShell
        borderRadius: 18,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)",
        border: "1px solid #eef2f6",
        backgroundColor: "white",
        overflow: "hidden",
      }}
    >
      {/* ─── WidgetHeader ─────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* 24×24 icon tile */}
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "#f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748b",
          }}>
            <SendIcon size={13} />
          </div>
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#64748b",
          }}>
            Submit Report
          </div>
        </div>

        {/* Right slot: tabular task count */}
        <div style={{
          fontVariantNumeric: "tabular-nums",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 11, color: "#94a3b8",
        }}>
          {stats.done} / {stats.total} done
          {stats.issues > 0 && (
            <span style={{ color: "#b91c1c", marginLeft: 6 }}>
              · {stats.issues} issue{stats.issues > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ─── Body ──────────────────────────────────────────────────── */}
      <div style={{ padding: "0 16px 16px" }}>

        {/* PHOTO SECTION */}
        <SectionLabel>Photo Evidence</SectionLabel>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 6,
        }}>
          {photos.map((p) => (
            <div key={p.id} style={{
              position: "relative", aspectRatio: "1 / 1",
              borderRadius: 10, overflow: "hidden",
              border: "1px solid #eef2f6", background: "#f8fafc",
            }}>
              <img src={p.url} alt={p.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => removePhoto(p.id)}
                aria-label="Remove photo"
                style={{
                  position: "absolute", top: 4, right: 4,
                  width: 22, height: 22, borderRadius: 999,
                  background: "rgba(15,23,42,0.78)", color: "#fff",
                  border: "none", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <TrashIcon size={11} />
              </button>
            </div>
          ))}

          {/* Add-photo tile — always present, sized like the others */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            style={{
              aspectRatio: "1 / 1", borderRadius: 10,
              border: "1px dashed #cbd5e1", background: "#f8fafc",
              color: "#64748b", cursor: disabled ? "not-allowed" : "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
              fontSize: 11, fontWeight: 500,
              transition: "background 0.12s, border-color 0.12s",
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
          >
            <CameraIcon size={18} />
            Add photo
          </button>

          <input
            ref={fileRef} type="file" accept="image/*"
            multiple capture="environment"
            style={{ display: "none" }} onChange={handleFiles}
          />
        </div>

        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>
          {photos.length === 0
            ? `Add at least ${minPhotos} photo${minPhotos > 1 ? "s" : ""} of the work area`
            : `${photos.length} photo${photos.length > 1 ? "s" : ""} attached`}
        </div>

        {/* NOTE SECTION */}
        <SectionLabel>Visit Notes {requireNote && <span style={{ color: "#dc2626", letterSpacing: 0 }}>*</span>}</SectionLabel>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Anything the supervisor should know about this visit?"
          disabled={disabled}
          style={{
            width: "100%", padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            fontSize: 13, color: "#0f172a",
            fontFamily: "inherit", lineHeight: 1.5,
            resize: "none", outline: "none",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.borderColor = "#cbd5e1";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = "#f8fafc";
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: 10.5, color: "#94a3b8", marginTop: 4,
        }}>
          <span>Optional unless flagged</span>
          <span style={{
            fontVariantNumeric: "tabular-nums",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}>
            {note.length} / 500
          </span>
        </div>

        {/* DISABLED REASON (always visible above the button) */}
        {blockReason && (
          <div style={{
            marginTop: 14,
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11.5, color: "#b45309",
          }}>
            <IssueIcon size={11} color="#b45309" />
            {blockReason}
          </div>
        )}

        {/* PRIMARY SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: blockReason ? 8 : 16,
            width: "100%",
            padding: "13px 16px",
            borderRadius: 12,
            border: "none",
            background: "#0f172a",
            color: "#fff",
            fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.45,
            transition: "transform 0.1s ease, opacity 0.15s",
            fontFamily: "inherit",
          }}
          onMouseDown={(e) => { if (canSubmit) e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <SendIcon size={15} />
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em",
      textTransform: "uppercase", color: "#64748b",
      marginTop: 8, marginBottom: 8,
    }}>
      {children}
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════════════════
   EXAMPLE USAGE — combines ChecklistItem + ChecklistReport
   ════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [items, setItems] = useState([
    { id: "t1", title: "Clean table surfaces",   status: "done",          category: "Cleaning",   timestamp: "10:07" },
    { id: "t2", title: "Sweep floor",            status: "done",          category: "Cleaning",   timestamp: "10:14" },
    { id: "t3", title: "Dispose trash bags",     status: "issue",         category: "Waste",      timestamp: null    },
    { id: "t4", title: "Clean sink",             status: "not_available", category: "Sanitation", timestamp: null    },
    { id: "t5", title: "Refill hand soap",       status: "pending",       category: "Sanitation", timestamp: null    },
    { id: "t6", title: "Check paper dispenser",  status: "skipped",       category: "Sanitation", timestamp: null    },
  ]);
  const [submitted, setSubmitted] = useState(null);

  const handleStatusChange = (id, status, meta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, timestamp: meta.timestamp } : item
      )
    );
  };

  // Stats — done counts both DONE and NOT_AVAILABLE (both are "handled")
  const handled = items.filter((i) => i.status === "done" || i.status === "not_available").length;
  const issues  = items.filter((i) => i.status === "issue").length;
  const total   = items.length;
  const pct     = Math.round((handled / total) * 100);

  const handleSubmit = (payload) => {
    console.log("Report submitted:", payload);
    setSubmitted({
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      photos: payload.photos.length,
      hasNote: payload.note.length > 0,
    });
  };

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", padding: "0 0 32px",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      background: "#F8FAFC", minHeight: "100vh",
    }}>
      {/* Page header */}
      <div style={{
        background: "#fff", padding: "14px 18px 12px",
        borderBottom: "0.5px solid #E5E7EB",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#0f172a" }}>Pantry</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 1 }}>
              Mall Alam Sutera · Floor 10
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "#F0FDF4", borderRadius: 20, padding: "3px 8px",
            fontSize: 11, fontWeight: 500, color: "#15803D",
          }}>
            <CheckIcon size={11} color="#15803D" /> Verified
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 12 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "#64748b", marginBottom: 6,
          }}>
            <span style={{
              fontWeight: 600, color: "#0f172a",
              fontVariantNumeric: "tabular-nums",
            }}>
              {handled} / {total} tasks
            </span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
          </div>
          <div style={{
            height: 6, background: "#E5E7EB",
            borderRadius: 99, overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "#16A34A",
              width: pct + "%", transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            {...item}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>

      {/* Centralized report */}
      <div style={{ padding: "4px 14px 24px" }}>
        <ChecklistReport
          stats={{ done: handled, total, issues }}
          minPhotos={1}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Submitted confirmation */}
      {submitted && (
        <div style={{
          margin: "0 14px",
          padding: "10px 12px",
          borderRadius: 12,
          background: "#dcfce7",
          border: "1px solid rgba(22,163,74,0.18)",
          fontSize: 12, color: "#15803d",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <CheckIcon size={12} color="#15803d" />
          Report submitted at {submitted.at} · {submitted.photos} photo
          {submitted.photos === 1 ? "" : "s"}{submitted.hasNote ? " · note attached" : ""}
        </div>
      )}
    </div>
  );
}
