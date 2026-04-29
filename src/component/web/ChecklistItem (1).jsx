import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
//
// Status: "pending" | "done" | "not_available" | "skipped" | "issue"
//
// Props:
//   id            string          – unique identifier
//   title         string          – task label
//   status        Status          – initial status
//   timestamp     string?         – completion time (ISO or display string)
//   note          string?         – pre-filled note
//   photo         string?         – pre-filled photo URL (data: or https:)
//   category      string?         – optional tag shown as a pill
//   disabled      boolean?        – locks all interaction
//   onStatusChange (id, status, meta) => void   – fires on every status change
//   onPhotoAdd    (id, file) => void             – fires when user selects a photo
//   onNoteChange  (id, note) => void             – fires on note input change
//   className     string?         – extra class on root element

// ─── Constants ──────────────────────────────────────────────────────────────
const STATUS = {
  PENDING:       "pending",
  DONE:          "done",
  NOT_AVAILABLE: "not_available",
  SKIPPED:       "skipped",
  ISSUE:         "issue",
};

const STATUS_CONFIG = {
  pending: {
    label:      "Pending",
    color:      "#6B7280",
    bg:         "transparent",
    border:     "#D1D5DB",
    iconBg:     "#F3F4F6",
    iconColor:  "#9CA3AF",
  },
  done: {
    label:      "Done",
    color:      "#15803D",
    bg:         "#F0FDF4",
    border:     "#86EFAC",
    iconBg:     "#16A34A",
    iconColor:  "#ffffff",
  },
  not_available: {
    label:      "Not Available",
    color:      "#6B7280",
    bg:         "#F9FAFB",
    border:     "#E5E7EB",
    iconBg:     "#E5E7EB",
    iconColor:  "#9CA3AF",
  },
  skipped: {
    label:      "Skipped",
    color:      "#B45309",
    bg:         "#FFFBEB",
    border:     "#FCD34D",
    iconBg:     "#FEF3C7",
    iconColor:  "#B45309",
  },
  issue: {
    label:      "Issue",
    color:      "#B91C1C",
    bg:         "#FEF2F2",
    border:     "#FECACA",
    iconBg:     "#FEE2E2",
    iconColor:  "#DC2626",
  },
};

const MENU_OPTIONS = [
  {
    status: STATUS.DONE,
    icon:   <CheckIcon />,
    label:  "Done",
    sub:    "Mark as completed",
    accent: "#16A34A",
    bgAccent: "#F0FDF4",
  },
  {
    status: STATUS.NOT_AVAILABLE,
    icon:   <NAIcon />,
    label:  "Not Available",
    sub:    "Item absent from this area",
    accent: "#6B7280",
    bgAccent: "#F3F4F6",
  },
  {
    status: STATUS.SKIPPED,
    icon:   <SkipIcon />,
    label:  "Skipped",
    sub:    "Come back to this later",
    accent: "#B45309",
    bgAccent: "#FFFBEB",
  },
  {
    status: STATUS.ISSUE,
    icon:   <IssueIcon />,
    label:  "Issue",
    sub:    "Report a problem",
    accent: "#B91C1C",
    bgAccent: "#FEF2F2",
  },
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────
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

function PhotoIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="16" height="12" rx="2.5" />
      <path d="M7 5V4a3 3 0 016 0v1" />
      <circle cx="10" cy="11" r="2.3" />
    </svg>
  );
}

function NoteIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h14M3 10h10M3 15h7" />
    </svg>
  );
}

// ─── Status Icon inside circle ────────────────────────────────────────────────
function StatusCircleIcon({ status }) {
  const cfg = STATUS_CONFIG[status];
  const iconProps = { size: 14, color: cfg.iconColor };
  let icon = null;

  switch (status) {
    case STATUS.DONE:          icon = <CheckIcon {...iconProps} />; break;
    case STATUS.NOT_AVAILABLE: icon = <NAIcon   {...iconProps} />; break;
    case STATUS.SKIPPED:       icon = <SkipIcon  {...iconProps} />; break;
    case STATUS.ISSUE:         icon = <IssueIcon {...iconProps} />; break;
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

// ─── Bottom Sheet / Menu ──────────────────────────────────────────────────────
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
      <div style={{ padding: "8px 14px 6px", fontSize: 11, fontWeight: 500,
        color: "#9CA3AF", borderBottom: "0.5px solid #F3F4F6" }}>
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
            {opt.icon && <opt.icon.type {...opt.icon.props} color={opt.accent} size={13} />}
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

// ─── Issue Panel ──────────────────────────────────────────────────────────────
function IssuePanel({ note, photo, onNoteChange, onPhotoAdd, taskId }) {
  const fileRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(photo || null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onPhotoAdd?.(taskId, file);
  };

  return (
    <div style={{
      borderTop: "0.5px solid #FECACA",
      background: "#FEF2F2",
      padding: "10px 12px 12px",
      animation: "issueIn 0.2s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontSize: 11, fontWeight: 500, color: "#7F1D1D", marginBottom: 8,
      }}>
        <IssueIcon size={11} color="#7F1D1D" />
        Report issue details
      </div>

      {previewUrl && (
        <div style={{ marginBottom: 8 }}>
          <img src={previewUrl} alt="Issue photo"
            style={{ width: "100%", maxHeight: 120, objectFit: "cover",
              borderRadius: 8, border: "0.5px solid #FECACA" }} />
        </div>
      )}

      <div style={{ display: "flex", gap: 7, marginBottom: 8 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1, padding: "8px 6px", borderRadius: 10,
            border: "0.5px solid #FECACA", background: "#fff",
            fontSize: 12, color: "#B91C1C", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <PhotoIcon size={13} /> {previewUrl ? "Change Photo" : "Add Photo"}
        </button>
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      <textarea
        rows={2}
        defaultValue={note || ""}
        placeholder="Describe the issue found..."
        onChange={(e) => onNoteChange?.(taskId, e.target.value)}
        style={{
          width: "100%", padding: "8px 10px", borderRadius: 10,
          border: "0.5px solid #FECACA", background: "#fff",
          fontSize: 12, color: "#111827", fontFamily: "inherit",
          resize: "none", outline: "none", lineHeight: 1.5,
        }}
      />
    </div>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
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

// ─── Main Component ───────────────────────────────────────────────────────────
export function ChecklistItem({
  id,
  title,
  status: initialStatus = STATUS.PENDING,
  timestamp: initialTimestamp = null,
  note: initialNote = null,
  photo: initialPhoto = null,
  category = null,
  disabled = false,
  onStatusChange,
  onPhotoAdd,
  onNoteChange,
  className = "",
}) {
  // ── Local state ──
  const [status,    setStatus]    = useState(initialStatus);
  const [timestamp, setTimestamp] = useState(initialTimestamp);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [pressed,   setPressed]   = useState(false);

  const dotsRef = useRef(null);
  const cfg = STATUS_CONFIG[status];

  // ── Helpers ──
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

  // ── Interaction handlers ──
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

  const onSelectStatus = (next) => {
    applyStatus(next);
    setMenuOpen(false);
  };

  const onCloseMenu = () => setMenuOpen(false);

  const handlePhotoAdd = (taskId, file) => onPhotoAdd?.(taskId, file);
  const handleNoteChange = (taskId, text) => onNoteChange?.(taskId, text);

  // ── Sub-labels ──
  const subLabel = {
    done:          timestamp ? `Completed at ${timestamp}` : "Completed",
    not_available: "Not available in this area",
    skipped:       "Skipped — revisit later",
    issue:         "Issue reported — add details below",
    pending:       null,
  }[status];

  return (
    <>
      <style>{`
        @keyframes menuIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes issueIn {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 300px; }
        }
        @keyframes doneFlash {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .checklist-item-root:active .ci-check-circle {
          transform: scale(0.94);
        }
        .ci-more-btn:hover { background: #F3F4F6 !important; }
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
            style={{ transition: "transform 0.2s ease",
              animation: status === STATUS.DONE && !initialTimestamp ? "doneFlash 0.35s ease" : "none" }}
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

          {/* Status pill (skipped / issue) */}
          <StatusPill status={status} />

          {/* ··· button */}
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

        {/* Issue expansion panel */}
        {status === STATUS.ISSUE && (
          <IssuePanel
            note={initialNote}
            photo={initialPhoto}
            onPhotoAdd={handlePhotoAdd}
            onNoteChange={handleNoteChange}
            taskId={id}
          />
        )}

        {/* Status menu (popover) */}
        <StatusMenu
          isOpen={menuOpen}
          anchorRef={dotsRef}
          onSelect={onSelectStatus}
          onClose={onCloseMenu}
          currentStatus={status}
        />
      </div>
    </>
  );
}

// ─── Usage example ────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems] = useState([
    { id: "t1", title: "Clean table surfaces",   status: "done",          category: "Cleaning",    timestamp: "10:07" },
    { id: "t2", title: "Sweep floor",            status: "done",          category: "Cleaning",    timestamp: "10:14" },
    { id: "t3", title: "Dispose trash bags",     status: "issue",         category: "Waste",       timestamp: null    },
    { id: "t4", title: "Clean sink",             status: "not_available", category: "Sanitation",  timestamp: null    },
    { id: "t5", title: "Refill hand soap",       status: "pending",       category: "Sanitation",  timestamp: null    },
    { id: "t6", title: "Check paper dispenser",  status: "skipped",       category: "Sanitation",  timestamp: null    },
  ]);

  const handleStatusChange = (id, status, meta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status, timestamp: meta.timestamp } : item
      )
    );
  };

  const done  = items.filter((i) => i.status === "done" || i.status === "not_available").length;
  const total = items.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", padding: "0 0 32px",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "#F9FAFB", minHeight: "100vh",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#fff", padding: "14px 18px 12px",
        borderBottom: "0.5px solid #E5E7EB",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>Pantry</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 1 }}>Mall Alam Sutera · Floor 10</div>
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
          <div style={{ display: "flex", justifyContent: "space-between",
            fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
            <span style={{ fontWeight: 500, color: "#111827" }}>{done} / {total} tasks</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 6, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 99, background: "#16A34A",
              width: pct + "%", transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <ChecklistItem
            key={item.id}
            {...item}
            onStatusChange={handleStatusChange}
            onPhotoAdd={(id, file) => console.log("Photo added for", id, file.name)}
            onNoteChange={(id, note) => console.log("Note for", id, ":", note)}
          />
        ))}
      </div>
    </div>
  );
}
