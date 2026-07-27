import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTEON — DRIVER RUNTIME · INTEGRATED END-TO-END FLOW
// ═══════════════════════════════════════════════════════════════════════════
// Identity: Complete execution loop — feed → detail → workspace → submit → feed
// Mental model: "What stops are left, which one do I tackle next?"
//
// Doctrine:
//   - Feed = route, each card = stop
//   - Driver-driven sequencing (NO auto-promote on submit, driver chooses)
//   - Feed return guarantee — submit returns to feed with updated state
//   - Max 2 levels: feed → detail → workspace (workspace = sheet over detail)
//   - Customer signature replaces text-only ack checkbox
//   - Submit creates DROP + PICKUP movement events
//   - Partial / opportunistic / extra all valid outcomes
// ═══════════════════════════════════════════════════════════════════════════

const FontLoader = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
    * { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    @keyframes pulse-soft { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
    .pulse-soft { animation: pulse-soft 2.4s ease-in-out infinite; }
    @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .slide-up { animation: slide-up 0.3s ease-out forwards; }
    @keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .sheet-up { animation: sheet-up 0.25s ease-out forwards; }
    @keyframes flash-success {
      0% { background: #ecfdf5; }
      100% { background: #ffffff; }
    }
    .flash-success { animation: flash-success 1.5s ease-out forwards; }
    .phone-shadow { box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 8px #0a0a0a, 0 0 0 9px #2a2a2a; }
    .tap-feedback:active { transform: scale(0.97); }
    .scroll-thin::-webkit-scrollbar { display: none; }
  `}</style>
);

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
const C = {
    bg: "#f5f6f8",
    surface: "#ffffff",
    surfaceAlt: "#fafbfc",
    border: "#e8eaed",
    borderStrong: "#d4d7dc",

    text: "#0f172a",
    textMid: "#475569",
    textDim: "#94a3b8",

    amber50: "#fffbeb",
    amber100: "#fef3c7",
    amber400: "#f59e0b",
    amber500: "#d97706",
    amber700: "#b45309",

    driverAccent: "#4f46e5",
    driverAccentBg: "#eef2ff",
    driverAccentDark: "#3730a3",

    violet50: "#f5f3ff",
    violet100: "#ede9fe",
    violet400: "#a78bfa",
    violet700: "#6d28d9",

    emerald50: "#ecfdf5",
    emerald100: "#d1fae5",
    emerald400: "#34d399",
    emerald500: "#10b981",
    emerald700: "#047857",

    infoBlue: "#3b82f6",
    infoBlueBg: "#eff6ff",

    slate50: "#f8fafc",
    slate100: "#f1f5f9",
    slate200: "#e2e8f0",
    slate300: "#cbd5e1",
    slate400: "#94a3b8",
    slate600: "#475569",
    slate700: "#334155",
};

// ─── INITIAL MOCK DATA ─────────────────────────────────────────────────────
// Driver state: 1 completed + 3 to do
const INITIAL_TASKS = [
    {
        id: "T-050",
        customer: "Mandiri Tower",
        address: "Jl. Jend. Sudirman Kav. 54-55",
        distance: "0 km · current",
        stopNumber: 1,
        state: "completed",
        completedAt: "07:42",
        customerConfirmed: true,
        items: [
            { id: "gas_12", name: "Gas 12kg", type: "returnable", planDrop: 4, actualDrop: 4, planPickup: 0, actualPickup: 0 },
            { id: "aqua_galon", name: "Aqua Galon", type: "returnable", planDrop: 2, actualDrop: 2, planPickup: 0, actualPickup: 0 },
        ],
    },
    {
        id: "T-051",
        customer: "Honda Bintaro",
        address: "Jl. Bintaro Utama 23, Tangerang",
        distance: "8.4 km",
        stopNumber: 2,
        state: "assigned",
        items: [
            { id: "gas_12", name: "Gas 12kg", type: "returnable", planDrop: 3, actualDrop: 0, planPickup: 3, actualPickup: 0 },
            { id: "gas_3", name: "Gas 3kg", type: "returnable", planDrop: 3, actualDrop: 0, planPickup: 3, actualPickup: 0 },
            { id: "aqua_600", name: "Aqua 600ml (Dus)", type: "consumable", planDrop: 4, actualDrop: 0, planPickup: 0, actualPickup: 0 },
        ],
    },
    {
        id: "T-052",
        customer: "BCA Cabang Bintaro",
        address: "Jl. Bintaro Sektor 7, Tangerang",
        distance: "1.2 km",
        stopNumber: 3,
        state: "assigned",
        items: [
            { id: "gas_12", name: "Gas 12kg", type: "returnable", planDrop: 3, actualDrop: 0, planPickup: 0, actualPickup: 0 },
            { id: "aqua_galon", name: "Aqua Galon", type: "returnable", planDrop: 6, actualDrop: 0, planPickup: 0, actualPickup: 0 },
        ],
    },
    {
        id: "T-053",
        customer: "Toko Sumber Rejeki",
        address: "Jl. Bintaro Permai Blok C2",
        distance: "3.8 km",
        stopNumber: 4,
        state: "assigned",
        taskType: "pickup_return",
        items: [
            { id: "gas_3", name: "Gas 3kg", type: "returnable", planDrop: 0, actualDrop: 0, planPickup: 3, actualPickup: 0 },
        ],
    },
];

const DRIVER = { name: "Rudi Hartono", id: "DRV-003" };
const VEHICLE = { id: "V-007", plate: "B 1234 XY" };

// ─── ATOMS ─────────────────────────────────────────────────────────────────
const Chip = ({ children, variant = "neutral" }) => {
    const variants = {
        neutral: { bg: C.slate100, fg: C.slate700 },
        amber: { bg: C.amber100, fg: C.amber700 },
        indigo: { bg: C.driverAccentBg, fg: C.driverAccent },
        emerald: { bg: C.emerald100, fg: C.emerald700 },
        violet: { bg: C.violet50, fg: C.violet700 },
        slate: { bg: C.slate100, fg: C.slate600 },
        blue: { bg: C.infoBlueBg, fg: C.infoBlue },
    };
    const v = variants[variant];
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "2px 8px", borderRadius: 4,
            background: v.bg, color: v.fg,
            fontSize: 10, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.04em",
            whiteSpace: "nowrap",
        }}>{children}</span>
    );
};

const StateChip = ({ state }) => {
    const map = {
        assigned: { variant: "slate", label: "Menunggu" },
        in_execution: { variant: "indigo", label: "Berjalan" },
        completed: { variant: "emerald", label: "Selesai" },
        failed: { variant: "amber", label: "Gagal" },
        blocked: { variant: "amber", label: "Blocked" },
    };
    const m = map[state];
    return <Chip variant={m.variant}>{m.label}</Chip>;
};

// ═══════════════════════════════════════════════════════════════════════════
// SIGNATURE PAD
// ═══════════════════════════════════════════════════════════════════════════
const SignaturePad = ({ value, onChange }) => {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(!!value);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = C.text;
        ctx.lineWidth = 2.5;
    }, []);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const evt = e.touches ? e.touches[0] : e;
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top,
        };
    };

    const start = (e) => {
        e.preventDefault();
        setDrawing(true);
        const ctx = canvasRef.current.getContext("2d");
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        if (!drawing) return;
        e.preventDefault();
        const ctx = canvasRef.current.getContext("2d");
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        if (!hasSignature) {
            setHasSignature(true);
            onChange(true);
        }
    };

    const end = () => setDrawing(false);

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        onChange(false);
    };

    return (
        <div>
            <div style={{
                position: "relative",
                background: C.surfaceAlt,
                border: `1.5px ${hasSignature ? "solid" : "dashed"} ${hasSignature ? C.emerald400 : C.borderStrong}`,
                borderRadius: 10,
                overflow: "hidden",
                transition: "border 0.15s ease",
            }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={start}
                    onMouseMove={draw}
                    onMouseUp={end}
                    onMouseLeave={end}
                    onTouchStart={start}
                    onTouchMove={draw}
                    onTouchEnd={end}
                    style={{
                        display: "block",
                        width: "100%",
                        height: 140,
                        cursor: "crosshair",
                        touchAction: "none",
                    }}
                />
                {!hasSignature && (
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        color: C.textDim,
                        fontSize: 13,
                    }}>
                        ✍️ Tap & tarik untuk tanda tangan customer
                    </div>
                )}
                {hasSignature && (
                    <button
                        onClick={clear}
                        className="tap-feedback"
                        style={{
                            position: "absolute",
                            top: 8, right: 8,
                            padding: "4px 10px",
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 5,
                            fontSize: 11,
                            fontWeight: 600,
                            color: C.textMid,
                            cursor: "pointer",
                        }}
                    >
                        Hapus
                    </button>
                )}
            </div>
            <div style={{
                marginTop: 6, fontSize: 11,
                color: hasSignature ? C.emerald700 : C.textMid,
                display: "flex", alignItems: "center", gap: 4,
            }}>
                {hasSignature ? "✓ Tanda tangan tersimpan · customer confirmed" : "Opsional · jika customer berkenan tanda tangan"}
            </div>
        </div>
    );
};

// ─── EXECUTION STEPPER ─────────────────────────────────────────────────────
const ExecutionStepper = ({ value, onChange, planned, kind }) => {
    const isDrop = kind === "drop";
    const accent = isDrop ? C.driverAccent : C.violet700;
    const accentBg = isDrop ? C.driverAccentBg : C.violet50;
    const accentBorder = isDrop ? C.driverAccent + "22" : C.violet100;
    const directionSymbol = isDrop ? "↓" : "↑";
    const directionLabel = isDrop ? "Drop" : "Pickup";

    const isComplete = value === planned;
    const isPartial = value > 0 && value < planned;
    const isZero = value === 0;
    const isSurplus = value > planned;
    const isOpportunistic = planned === 0 && value > 0;

    const valueColor = isZero ? C.textDim
        : isComplete ? C.emerald700
            : isPartial ? C.amber700
                : isSurplus || isOpportunistic ? C.infoBlue : C.text;

    return (
        <div style={{
            flex: 1,
            background: isComplete ? C.emerald50
                : isPartial ? C.amber50
                    : isSurplus || isOpportunistic ? C.infoBlueBg
                        : accentBg,
            border: `1.5px solid ${isComplete ? C.emerald400
                    : isPartial ? C.amber400
                        : isSurplus || isOpportunistic ? C.infoBlue + "44"
                            : accentBorder
                }`,
            borderRadius: 10,
            padding: "10px 10px 8px",
            transition: "all 0.15s ease",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: accent, fontSize: 14, fontWeight: 700 }}>{directionSymbol}</span>
                    <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                        {directionLabel}
                    </span>
                </div>
                <span style={{ fontSize: 11, color: C.textDim }}>
                    plan <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{planned}</span>
                </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    disabled={value === 0}
                    className="tap-feedback"
                    style={{
                        width: 44, height: 44, borderRadius: 8,
                        background: C.surface, border: `1px solid ${C.border}`,
                        fontSize: 20, fontWeight: 600,
                        color: value === 0 ? C.textDim : C.text,
                        cursor: value === 0 ? "not-allowed" : "pointer",
                        flexShrink: 0,
                    }}
                >−</button>

                <div style={{ flex: 1, textAlign: "center", padding: "4px 0" }}>
                    <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: valueColor, lineHeight: 1 }}>
                        {value}
                    </div>
                    {isPartial && (
                        <div style={{ fontSize: 10, color: C.amber700, fontWeight: 600, marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            Partial · {planned - value} kurang
                        </div>
                    )}
                    {isComplete && value > 0 && (
                        <div style={{ fontSize: 10, color: C.emerald700, fontWeight: 600, marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            ✓ Sesuai
                        </div>
                    )}
                    {isOpportunistic && (
                        <div style={{ fontSize: 10, color: C.infoBlue, fontWeight: 600, marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            Opportunistic · {value}
                        </div>
                    )}
                    {isSurplus && !isOpportunistic && (
                        <div style={{ fontSize: 10, color: C.infoBlue, fontWeight: 600, marginTop: 2, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                            +{value - planned} extra
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onChange(value + 1)}
                    className="tap-feedback"
                    style={{
                        width: 44, height: 44, borderRadius: 8,
                        background: C.surface, border: `1px solid ${C.border}`,
                        fontSize: 20, fontWeight: 600,
                        color: C.text,
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                >+</button>
            </div>
        </div>
    );
};

// ─── ITEM EXECUTION ROW ────────────────────────────────────────────────────
const ItemExecutionRow = ({ item, dropValue, pickupValue, onChangeDrop, onChangePickup }) => {
    const isConsumable = item.type === "consumable";
    const isReturnable = item.type === "returnable";
    const hasDrop = item.planDrop > 0;
    const showPickupStepper = isReturnable;

    return (
        <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "12px 12px 14px",
            marginBottom: 10,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</span>
                {isConsumable && (
                    <span style={{
                        padding: "1px 5px", borderRadius: 3,
                        background: C.slate100, color: C.slate600,
                        fontSize: 9, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>Consumable</span>
                )}
                {isReturnable && (
                    <span style={{
                        padding: "1px 5px", borderRadius: 3,
                        background: C.driverAccentBg, color: C.driverAccent,
                        fontSize: 9, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>Returnable</span>
                )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
                {hasDrop && (
                    <ExecutionStepper
                        kind="drop"
                        value={dropValue}
                        planned={item.planDrop}
                        onChange={onChangeDrop}
                    />
                )}
                {showPickupStepper && (
                    <ExecutionStepper
                        kind="pickup"
                        value={pickupValue}
                        planned={item.planPickup}
                        onChange={onChangePickup}
                    />
                )}
            </div>

            {isReturnable && item.planPickup === 0 && pickupValue === 0 && (
                <div style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    background: C.infoBlueBg,
                    borderRadius: 6,
                    fontSize: 10,
                    color: C.infoBlue,
                    fontStyle: "italic",
                }}>
                    💡 Customer juga punya tabung lama buat dibalikin? Tap [+] di pickup.
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// TASK CARD (for Feed)
// ═══════════════════════════════════════════════════════════════════════════
const TaskCard = ({ task, onTap, highlight }) => {
    const isCompleted = task.state === "completed";
    const isFailed = task.state === "failed";
    const isAssigned = task.state === "assigned";
    const isPickupOnly = task.taskType === "pickup_return";

    const totalDrop = task.items.reduce((s, i) => s + i.planDrop, 0);
    const totalPickup = task.items.reduce((s, i) => s + i.planPickup, 0);
    const actualDrop = task.items.reduce((s, i) => s + (i.actualDrop || 0), 0);
    const actualPickup = task.items.reduce((s, i) => s + (i.actualPickup || 0), 0);

    const borderLeft = highlight ? `3px solid ${C.driverAccent}` : "3px solid transparent";
    const bg = isCompleted ? C.surface : isFailed ? C.amber50 : C.surface;
    const opacity = isCompleted || isFailed ? 0.75 : 1;

    return (
        <div
            onClick={() => onTap(task)}
            className={`tap-feedback slide-up ${highlight ? "flash-success" : ""}`}
            style={{
                background: bg,
                opacity,
                border: `1px solid ${C.border}`,
                borderLeft,
                borderLeftWidth: 3,
                borderRadius: 12,
                padding: "14px 14px",
                marginBottom: 10,
                cursor: "pointer",
                transition: "transform 0.1s ease",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: isCompleted ? C.emerald100 : isFailed ? C.amber100 : C.slate100,
                    color: isCompleted ? C.emerald700 : isFailed ? C.amber700 : C.textMid,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700,
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                }}>
                    {isCompleted ? "✓" : isFailed ? "!" : task.stopNumber}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                        <span className="mono" style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>
                            {task.id}
                        </span>
                        {isPickupOnly && <Chip variant="violet">Pickup Only</Chip>}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.customer}
                    </div>
                </div>

                <StateChip state={task.state} />
            </div>

            <div style={{ paddingLeft: 42, marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {task.address}
                </div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                    📍 {task.distance}
                </div>
            </div>

            <div style={{
                display: "flex", flexWrap: "wrap", gap: 6,
                paddingLeft: 42,
                marginBottom: isAssigned ? 12 : 0,
            }}>
                {totalDrop > 0 && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 6,
                        background: isCompleted ? C.emerald50 : C.driverAccentBg,
                        border: `1px solid ${isCompleted ? C.emerald100 : C.driverAccent + "22"}`,
                    }}>
                        <span style={{ color: isCompleted ? C.emerald700 : C.driverAccent, fontSize: 13, fontWeight: 700 }}>↓</span>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                            {isCompleted ? actualDrop : totalDrop}
                        </span>
                        <span style={{ fontSize: 11, color: C.textMid }}>drop</span>
                    </div>
                )}
                {totalPickup > 0 && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 6,
                        background: isCompleted ? C.emerald50 : C.violet50,
                        border: `1px solid ${isCompleted ? C.emerald100 : C.violet100}`,
                    }}>
                        <span style={{ color: isCompleted ? C.emerald700 : C.violet700, fontSize: 13, fontWeight: 700 }}>↑</span>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                            {isCompleted ? actualPickup : totalPickup}
                        </span>
                        <span style={{ fontSize: 11, color: C.textMid }}>pickup</span>
                    </div>
                )}
                <div style={{ flex: 1 }} />
            </div>

            {isAssigned && (
                <div style={{
                    marginLeft: 42,
                    background: C.driverAccent,
                    color: "#fff",
                    padding: "10px 14px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                }}>
                    Mulai Eksekusi
                </div>
            )}

            {isCompleted && task.completedAt && (
                <div style={{
                    marginLeft: 42,
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 11, color: C.emerald700,
                }}>
                    <span>✓ Selesai {task.completedAt}</span>
                    {task.customerConfirmed && (
                        <>
                            <span style={{ color: C.textDim }}>·</span>
                            <span>Customer confirmed</span>
                        </>
                    )}
                </div>
            )}

            {isFailed && (
                <div style={{
                    marginLeft: 42,
                    fontSize: 11, color: C.amber700, fontWeight: 500,
                }}>
                    ! Dilaporkan gagal — menunggu admin reschedule
                </div>
            )}
        </div>
    );
};

// ─── ROUTE PROGRESS HEADER ─────────────────────────────────────────────────
const RouteProgressHeader = ({ tasks }) => {
    const completed = tasks.filter(t => t.state === "completed").length;
    const failed = tasks.filter(t => t.state === "failed").length;
    const total = tasks.length;
    const progress = ((completed + failed) / total) * 100;

    const totalDrop = tasks.reduce((s, t) => s + t.items.reduce((si, i) => si + i.planDrop, 0), 0);
    const totalPickup = tasks.reduce((s, t) => s + t.items.reduce((si, i) => si + i.planPickup, 0), 0);
    const actualDrop = tasks.reduce((s, t) => s + t.items.reduce((si, i) => si + (i.actualDrop || 0), 0), 0);
    const actualPickup = tasks.reduce((s, t) => s + t.items.reduce((si, i) => si + (i.actualPickup || 0), 0), 0);

    return (
        <div style={{
            background: C.surface,
            padding: "14px 16px 16px",
            borderBottom: `1px solid ${C.border}`,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 7,
                    background: `linear-gradient(135deg, ${C.driverAccent}, ${C.driverAccentDark})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 14,
                }}>C</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                        {DRIVER.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.2 }}>
                        {VEHICLE.id} · <span className="mono">{VEHICLE.plate}</span>
                    </div>
                </div>
                <button style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: C.surface, border: `1px solid ${C.border}`,
                    fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>☰</button>
            </div>

            <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                        Rute Hari Ini
                    </div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        {completed} / {total} stop
                        {failed > 0 && <span style={{ color: C.amber700, marginLeft: 6 }}>· {failed} gagal</span>}
                    </div>
                </div>
                <div style={{
                    height: 6, background: C.slate100, borderRadius: 3, overflow: "hidden", position: "relative",
                }}>
                    <div style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${C.driverAccent}, ${C.driverAccentDark})`,
                        transition: "width 0.4s ease",
                    }} />
                </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                    flex: 1, padding: "8px 10px",
                    background: C.driverAccentBg,
                    border: `1px solid ${C.driverAccent}22`,
                    borderRadius: 7,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <span style={{ color: C.driverAccent, fontSize: 12, fontWeight: 700 }}>↓</span>
                        <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                            Drop
                        </span>
                    </div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {actualDrop} <span style={{ color: C.textDim, fontWeight: 500, fontSize: 12 }}>/ {totalDrop}</span>
                    </div>
                </div>
                <div style={{
                    flex: 1, padding: "8px 10px",
                    background: C.violet50,
                    border: `1px solid ${C.violet100}`,
                    borderRadius: 7,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <span style={{ color: C.violet700, fontSize: 12, fontWeight: 700 }}>↑</span>
                        <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                            Pickup
                        </span>
                    </div>
                    <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {actualPickup} <span style={{ color: C.textDim, fontWeight: 500, fontSize: 12 }}>/ {totalPickup}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN: TASK FEED
// ═══════════════════════════════════════════════════════════════════════════
const TaskFeedScreen = ({ tasks, onSelectTask, recentlyCompletedId }) => {
    const assigned = tasks.filter(t => t.state === "assigned");
    const completed = tasks.filter(t => t.state === "completed");
    const failed = tasks.filter(t => t.state === "failed");
    const remaining = assigned.length + failed.filter(f => false).length;  // (failed handled separately)
    const allDone = assigned.length === 0;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <RouteProgressHeader tasks={tasks} />

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 100px" }} className="scroll-thin">

                {assigned.length > 0 && (
                    <>
                        <div style={{
                            fontSize: 11, color: C.textMid,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            fontWeight: 700, marginBottom: 4, paddingLeft: 4,
                        }}>
                            Stop Berikutnya · {assigned.length}
                        </div>
                        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10, paddingLeft: 4, fontStyle: "italic" }}>
                            Pilih sesuai kondisi lapangan
                        </div>
                        {assigned.map(t => (
                            <TaskCard key={t.id} task={t} onTap={onSelectTask} />
                        ))}
                    </>
                )}

                {failed.length > 0 && (
                    <>
                        <div style={{
                            fontSize: 11, color: C.amber700,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            fontWeight: 700, marginTop: 16, marginBottom: 8, paddingLeft: 4,
                        }}>
                            Dilaporkan Gagal · {failed.length}
                        </div>
                        {failed.map(t => (
                            <TaskCard key={t.id} task={t} onTap={onSelectTask} />
                        ))}
                    </>
                )}

                {completed.length > 0 && (
                    <>
                        <div style={{
                            fontSize: 11, color: C.textDim,
                            textTransform: "uppercase", letterSpacing: "0.06em",
                            fontWeight: 700, marginTop: 16, marginBottom: 8, paddingLeft: 4,
                        }}>
                            Sudah Selesai · {completed.length}
                        </div>
                        {completed.map(t => (
                            <TaskCard
                                key={t.id}
                                task={t}
                                onTap={onSelectTask}
                                highlight={t.id === recentlyCompletedId}
                            />
                        ))}
                    </>
                )}

                {allDone && (
                    <div style={{
                        marginTop: 20,
                        background: C.emerald50,
                        border: `1px solid ${C.emerald100}`,
                        borderRadius: 12,
                        padding: "20px",
                        textAlign: "center",
                    }} className="slide-up">
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.emerald700, marginBottom: 4 }}>
                            Semua Stop Selesai
                        </div>
                        <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>
                            Lo bisa kembali ke gudang untuk closing check.
                        </div>
                    </div>
                )}
            </div>

            {allDone && (
                <div style={{
                    background: C.surface,
                    borderTop: `1px solid ${C.border}`,
                    padding: "12px 14px",
                    flexShrink: 0,
                    boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
                }}>
                    <button
                        className="tap-feedback"
                        style={{
                            width: "100%",
                            background: C.driverAccent,
                            color: "#fff",
                            border: "none",
                            padding: "16px",
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: "pointer",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Kembali ke Gudang
                    </button>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN: DELIVERY EXECUTION WORKSPACE
// ═══════════════════════════════════════════════════════════════════════════
const DeliveryExecutionWorkspace = ({ task, onBack, onSubmit }) => {
    const [actuals, setActuals] = useState(
        task.items.reduce((acc, item) => ({
            ...acc,
            [item.id]: { drop: item.planDrop, pickup: item.planPickup },
        }), {})
    );
    const [hasSignature, setHasSignature] = useState(false);
    const [showSubmitSheet, setShowSubmitSheet] = useState(false);
    const [showEvidenceSheet, setShowEvidenceSheet] = useState(false);
    const [showFailedSheet, setShowFailedSheet] = useState(false);
    const [hasNote, setHasNote] = useState(false);
    const [hasPhoto, setHasPhoto] = useState(false);

    const totalDrop = Object.values(actuals).reduce((s, a) => s + a.drop, 0);
    const totalPickup = Object.values(actuals).reduce((s, a) => s + a.pickup, 0);
    const plannedDrop = task.items.reduce((s, i) => s + i.planDrop, 0);
    const plannedPickup = task.items.reduce((s, i) => s + i.planPickup, 0);

    const hasPartial = task.items.some(i =>
        (actuals[i.id].drop < i.planDrop && actuals[i.id].drop > 0) ||
        (actuals[i.id].pickup < i.planPickup && actuals[i.id].pickup > 0)
    );
    const hasZero = task.items.some(i =>
        (i.planDrop > 0 && actuals[i.id].drop === 0) ||
        (i.planPickup > 0 && actuals[i.id].pickup === 0)
    );
    const hasOpportunistic = task.items.some(i =>
        i.planPickup === 0 && actuals[i.id].pickup > 0
    );
    const hasExtra = task.items.some(i =>
        i.planPickup > 0 && actuals[i.id].pickup > i.planPickup
    );

    const canConfirm = totalDrop > 0 || totalPickup > 0;

    const updateActual = (itemId, kind, value) => {
        setActuals(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [kind]: value },
        }));
    };

    const handleConfirmSubmit = () => {
        setShowSubmitSheet(false);
        onSubmit({
            actuals,
            hasSignature,
            hasNote,
            hasPhoto,
            outcome: hasPartial ? "partial" : "success",
        });
    };

    const handleFailedSubmit = () => {
        setShowFailedSheet(false);
        onSubmit({ actuals: null, outcome: "failed" });
    };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>

            <div style={{
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
            }}>
                <button
                    onClick={onBack}
                    className="tap-feedback"
                    style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "transparent", border: "none",
                        fontSize: 18, color: C.text, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >←</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="mono" style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>
                            {task.id}
                        </span>
                        <span style={{ fontSize: 11, color: C.textDim }}>·</span>
                        <span style={{ fontSize: 11, color: C.textDim }}>Stop {task.stopNumber}</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.customer}
                    </div>
                </div>
                <Chip variant="indigo">Berjalan</Chip>
            </div>

            <div style={{
                background: C.driverAccentBg,
                borderBottom: `1px solid ${C.border}`,
                padding: "10px 14px",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.driverAccentDark }}>
                    <span>📍</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {task.address}
                    </span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 100px" }} className="scroll-thin">

                <div style={{ marginBottom: 12, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                    Catat aktual · default = rencana, sesuaikan kalau beda
                </div>

                {task.items.map(item => (
                    <ItemExecutionRow
                        key={item.id}
                        item={item}
                        dropValue={actuals[item.id].drop}
                        pickupValue={actuals[item.id].pickup}
                        onChangeDrop={(v) => updateActual(item.id, "drop", v)}
                        onChangePickup={(v) => updateActual(item.id, "pickup", v)}
                    />
                ))}

                {/* SIGNATURE PAD */}
                <div style={{ marginTop: 18, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                        Tanda Tangan Customer
                        <span style={{ color: C.textDim, marginLeft: 6, fontWeight: 500 }}>(opsional)</span>
                    </div>
                    <SignaturePad value={hasSignature} onChange={setHasSignature} />
                </div>

                {/* Evidence row */}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button
                        onClick={() => setShowEvidenceSheet(true)}
                        className="tap-feedback"
                        style={{
                            flex: 1,
                            background: hasNote ? C.driverAccentBg : C.surface,
                            border: `1px solid ${hasNote ? C.driverAccent + "44" : C.border}`,
                            borderRadius: 10,
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontSize: 13, fontWeight: 600,
                            color: hasNote ? C.driverAccent : C.text,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                    >
                        <span>📝</span>
                        <span>{hasNote ? "Catatan ditambah" : "Tambah Catatan"}</span>
                    </button>
                    <button
                        onClick={() => setHasPhoto(!hasPhoto)}
                        className="tap-feedback"
                        style={{
                            flex: 1,
                            background: hasPhoto ? C.driverAccentBg : C.surface,
                            border: `1px solid ${hasPhoto ? C.driverAccent + "44" : C.border}`,
                            borderRadius: 10,
                            padding: "10px 12px",
                            cursor: "pointer",
                            fontSize: 13, fontWeight: 600,
                            color: hasPhoto ? C.driverAccent : C.text,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                    >
                        <span>📷</span>
                        <span>{hasPhoto ? "Foto · 1" : "Ambil Foto"}</span>
                    </button>
                </div>

                {hasPartial && (
                    <div style={{
                        marginTop: 14,
                        background: C.amber50,
                        border: `1px solid ${C.amber100}`,
                        borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 12,
                        color: C.amber700,
                        lineHeight: 1.5,
                    }}>
                        <strong>Partial execution.</strong> Beberapa item kurang dari rencana. Submit valid — sisanya akan jadi follow-up untuk admin.
                    </div>
                )}

                {(hasOpportunistic || hasExtra) && (
                    <div style={{
                        marginTop: 14,
                        background: C.infoBlueBg,
                        border: `1px solid ${C.infoBlue}22`,
                        borderLeft: `3px solid ${C.infoBlue}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 12,
                        color: C.text,
                        lineHeight: 1.5,
                    }}>
                        <strong style={{ color: C.infoBlue }}>
                            {hasOpportunistic && hasExtra ? "Opportunistic + extra pickup" :
                                hasOpportunistic ? "Opportunistic pickup" : "Extra pickup"}
                        </strong>{" "}
                        tercatat. Customer balikin tabung lebih banyak. Outstanding berkurang lebih banyak — informational signal untuk admin.
                    </div>
                )}

                {hasZero && !hasPartial && (
                    <div style={{
                        marginTop: 14,
                        background: C.amber50,
                        border: `1px solid ${C.amber100}`,
                        borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 12,
                        color: C.amber700,
                        lineHeight: 1.5,
                    }}>
                        <strong>Ada item yang 0.</strong> Yakin tidak ada yang dikirim/diambil untuk item itu?
                    </div>
                )}

                <button
                    onClick={() => setShowFailedSheet(true)}
                    className="tap-feedback"
                    style={{
                        marginTop: 14,
                        width: "100%",
                        background: "transparent",
                        border: `1px dashed ${C.borderStrong}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        fontSize: 12,
                        color: C.textMid,
                        cursor: "pointer",
                        fontWeight: 500,
                    }}
                >
                    Tidak bisa dieksekusi · Lapor sebagai gagal
                </button>
            </div>

            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "12px 14px",
                flexShrink: 0,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
            }}>
                <button
                    onClick={() => canConfirm && setShowSubmitSheet(true)}
                    disabled={!canConfirm}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: !canConfirm ? C.slate200
                            : hasPartial ? C.amber400
                                : C.driverAccent,
                        color: !canConfirm ? C.textDim : "#fff",
                        border: "none",
                        padding: "16px",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: canConfirm ? "pointer" : "not-allowed",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {!canConfirm ? "Catat Minimal 1 Item Dulu"
                        : hasPartial ? "Konfirmasi · Partial Execution"
                            : "Konfirmasi Pengiriman"}
                </button>
            </div>

            {showSubmitSheet && (
                <SubmitConfirmSheet
                    task={task}
                    actuals={actuals}
                    hasSignature={hasSignature}
                    hasPartial={hasPartial}
                    hasOpportunistic={hasOpportunistic}
                    hasExtra={hasExtra}
                    hasNote={hasNote}
                    hasPhoto={hasPhoto}
                    totalDrop={totalDrop}
                    totalPickup={totalPickup}
                    plannedDrop={plannedDrop}
                    plannedPickup={plannedPickup}
                    onConfirm={handleConfirmSubmit}
                    onCancel={() => setShowSubmitSheet(false)}
                />
            )}

            {showEvidenceSheet && (
                <EvidenceNoteSheet
                    onCancel={() => setShowEvidenceSheet(false)}
                    onSave={() => { setHasNote(true); setShowEvidenceSheet(false); }}
                />
            )}

            {showFailedSheet && (
                <FailedDeliverySheet
                    task={task}
                    onCancel={() => setShowFailedSheet(false)}
                    onSubmit={handleFailedSubmit}
                />
            )}
        </div>
    );
};

// ─── SUBMIT CONFIRMATION SHEET ─────────────────────────────────────────────
const SubmitConfirmSheet = ({ task, actuals, hasSignature, hasPartial, hasOpportunistic, hasExtra, hasNote, hasPhoto, totalDrop, totalPickup, plannedDrop, plannedPickup, onConfirm, onCancel }) => (
    <>
        <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
        <div className="sheet-up" style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            background: C.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            zIndex: 11,
            maxHeight: "85%",
            display: "flex",
            flexDirection: "column",
        }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
            </div>

            <div style={{ padding: "12px 18px 8px" }}>
                <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 4 }}>
                    Konfirmasi Pengiriman
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
                    {task.customer}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 16px" }} className="scroll-thin">
                <div style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 12,
                }}>
                    {task.items.map((item, idx) => {
                        const actDrop = actuals[item.id].drop;
                        const actPickup = actuals[item.id].pickup;
                        const dropPartial = actDrop < item.planDrop && actDrop > 0;
                        const pickupPartial = actPickup < item.planPickup && actPickup > 0;
                        const pickupOpportunistic = item.planPickup === 0 && actPickup > 0;
                        const pickupExtra = item.planPickup > 0 && actPickup > item.planPickup;
                        const isReturnable = item.type === "returnable";
                        const showPickupRow = isReturnable && (item.planPickup > 0 || actPickup > 0);

                        return (
                            <div key={item.id} style={{
                                padding: "8px 0",
                                borderBottom: idx === task.items.length - 1 ? "none" : `1px solid ${C.border}`,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{item.name}</span>
                                    {item.type === "consumable" && (
                                        <span style={{
                                            padding: "1px 5px", borderRadius: 3,
                                            background: C.slate100, color: C.slate600,
                                            fontSize: 9, fontWeight: 600,
                                            textTransform: "uppercase", letterSpacing: "0.04em",
                                        }}>C</span>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 12, fontSize: 12, flexWrap: "wrap" }}>
                                    {item.planDrop > 0 && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <span style={{ color: C.driverAccent, fontWeight: 700 }}>↓</span>
                                            <span className="mono" style={{
                                                color: dropPartial ? C.amber700 : actDrop === 0 ? C.amber700 : C.text,
                                                fontWeight: 700
                                            }}>{actDrop}</span>
                                            <span style={{ color: C.textDim, fontSize: 11 }}>/ {item.planDrop}</span>
                                            {dropPartial && <Chip variant="amber">Partial</Chip>}
                                            {actDrop === 0 && item.planDrop > 0 && <Chip variant="amber">0</Chip>}
                                        </div>
                                    )}
                                    {showPickupRow && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                            <span style={{ color: C.violet700, fontWeight: 700 }}>↑</span>
                                            <span className="mono" style={{
                                                color: pickupPartial ? C.amber700
                                                    : actPickup === 0 && item.planPickup > 0 ? C.amber700
                                                        : pickupOpportunistic || pickupExtra ? C.infoBlue
                                                            : C.text,
                                                fontWeight: 700
                                            }}>{actPickup}</span>
                                            <span style={{ color: C.textDim, fontSize: 11 }}>/ {item.planPickup}</span>
                                            {pickupPartial && <Chip variant="amber">Partial</Chip>}
                                            {actPickup === 0 && item.planPickup > 0 && <Chip variant="amber">0</Chip>}
                                            {pickupOpportunistic && <Chip variant="blue">Opportunistic</Chip>}
                                            {pickupExtra && <Chip variant="blue">+{actPickup - item.planPickup} extra</Chip>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Totals */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 12,
                    display: "flex",
                    gap: 14,
                    fontSize: 12,
                }}>
                    {plannedDrop > 0 && (
                        <div>
                            <div style={{ color: C.textMid, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 2 }}>
                                Total Drop
                            </div>
                            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: C.driverAccent }}>
                                {totalDrop} <span style={{ color: C.textDim, fontWeight: 500, fontSize: 12 }}>/ {plannedDrop}</span>
                            </div>
                        </div>
                    )}
                    {(plannedPickup > 0 || totalPickup > 0) && (
                        <div>
                            <div style={{ color: C.textMid, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 2 }}>
                                Total Pickup
                            </div>
                            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: C.violet700 }}>
                                {totalPickup} <span style={{ color: C.textDim, fontWeight: 500, fontSize: 12 }}>/ {plannedPickup}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Outcome */}
                {hasPartial ? (
                    <div style={{
                        background: C.amber50, border: `1px solid ${C.amber100}`, borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 8, padding: "12px 14px", fontSize: 13, color: C.amber700, lineHeight: 1.5, marginBottom: 12,
                    }}>
                        <strong>Partial execution akan dicatat.</strong> Sisa item yang kurang akan trigger follow-up coordination dengan admin.
                    </div>
                ) : (hasOpportunistic || hasExtra) ? (
                    <div style={{
                        background: C.infoBlueBg, border: `1px solid ${C.infoBlue}22`, borderLeft: `3px solid ${C.infoBlue}`,
                        borderRadius: 8, padding: "12px 14px", fontSize: 13, color: C.text, lineHeight: 1.5, marginBottom: 12,
                    }}>
                        <strong style={{ color: C.infoBlue }}>Clean + opportunistic pickup.</strong> Drop sesuai plan. Customer balikin lebih banyak — outstanding berkurang lebih banyak.
                    </div>
                ) : (
                    <div style={{
                        background: C.emerald50, border: `1px solid ${C.emerald100}`, borderLeft: `3px solid ${C.emerald400}`,
                        borderRadius: 8, padding: "12px 14px", fontSize: 13, color: C.emerald700, lineHeight: 1.5, marginBottom: 12,
                    }}>
                        <strong>Clean execution.</strong> Semua item sesuai rencana. Movement DROP/PICKUP akan dicatat.
                    </div>
                )}

                {/* Evidence summary */}
                <div style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 12,
                    display: "flex",
                    gap: 16,
                    color: C.textMid,
                    flexWrap: "wrap",
                }}>
                    <span style={{ color: hasSignature ? C.emerald700 : C.textDim }}>
                        {hasSignature ? "✓" : "○"} Tanda tangan
                    </span>
                    <span style={{ color: hasNote ? C.emerald700 : C.textDim }}>
                        {hasNote ? "✓" : "○"} Catatan
                    </span>
                    <span style={{ color: hasPhoto ? C.emerald700 : C.textDim }}>
                        {hasPhoto ? "✓" : "○"} Foto
                    </span>
                </div>
            </div>

            <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                    onClick={onConfirm}
                    className="tap-feedback"
                    style={{
                        background: hasPartial ? C.amber400 : C.driverAccent,
                        color: "#fff", border: "none",
                        padding: "16px", borderRadius: 10,
                        fontSize: 15, fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    Konfirmasi & Catat Movement
                </button>
                <button
                    onClick={onCancel}
                    className="tap-feedback"
                    style={{
                        background: C.surface, color: C.text,
                        border: `1px solid ${C.border}`,
                        padding: "13px", borderRadius: 10,
                        fontSize: 14, fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    Cek Lagi
                </button>
            </div>
        </div>
    </>
);

// ─── EVIDENCE NOTE SHEET ───────────────────────────────────────────────────
const EvidenceNoteSheet = ({ onCancel, onSave }) => {
    const [note, setNote] = useState("");
    return (
        <>
            <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
            <div className="sheet-up" style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                background: C.surface,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                zIndex: 11,
                maxHeight: "70%",
                display: "flex",
                flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>
                <div style={{ padding: "12px 18px 8px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Catatan Lapangan</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>
                        Apa yang lo lihat atau alami di stop ini?
                    </div>
                </div>
                <div style={{ padding: "8px 18px 14px" }}>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Misal: Customer minta drop di pintu samping..."
                        autoFocus
                        style={{
                            width: "100%",
                            minHeight: 120,
                            padding: "12px",
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            fontSize: 14,
                            fontFamily: "inherit",
                            resize: "vertical",
                            background: C.surface,
                        }}
                    />
                </div>
                <div style={{ padding: "8px 18px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                    <button onClick={onCancel} className="tap-feedback" style={{
                        flex: 1, background: C.surface, color: C.text, border: `1px solid ${C.border}`,
                        padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}>Batal</button>
                    <button onClick={onSave} disabled={note.trim().length === 0} className="tap-feedback" style={{
                        flex: 1,
                        background: note.trim().length === 0 ? C.slate200 : C.driverAccent,
                        color: note.trim().length === 0 ? C.textDim : "#fff",
                        border: "none",
                        padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                        cursor: note.trim().length === 0 ? "not-allowed" : "pointer",
                    }}>Simpan</button>
                </div>
            </div>
        </>
    );
};

// ─── FAILED DELIVERY SHEET ─────────────────────────────────────────────────
const FailedDeliverySheet = ({ task, onCancel, onSubmit }) => {
    const [reason, setReason] = useState(null);
    const [note, setNote] = useState("");

    const reasons = [
        { id: "customer_closed", label: "Customer Tutup", desc: "Lokasi tutup / tidak ada orang" },
        { id: "access_denied", label: "Akses Ditolak", desc: "Tidak diizinkan masuk lokasi" },
        { id: "customer_refused", label: "Customer Tolak", desc: "Customer menolak menerima" },
        { id: "capacity_full", label: "Kapasitas Penuh", desc: "Customer tidak punya tempat" },
    ];

    return (
        <>
            <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
            <div className="sheet-up" style={{
                position: "absolute",
                bottom: 0, left: 0, right: 0,
                background: C.surface,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                zIndex: 11,
                maxHeight: "85%",
                display: "flex",
                flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>
                <div style={{ padding: "12px 18px 8px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Lapor Delivery Gagal</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>
                        {task.customer} · Stop {task.stopNumber}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 14px" }} className="scroll-thin">
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
                        Pilih Alasan
                    </div>
                    {reasons.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setReason(r.id)}
                            className="tap-feedback"
                            style={{
                                width: "100%",
                                background: reason === r.id ? C.amber50 : C.surface,
                                border: `1.5px solid ${reason === r.id ? C.amber400 : C.border}`,
                                borderRadius: 10,
                                padding: "12px 14px",
                                cursor: "pointer",
                                marginBottom: 8,
                                textAlign: "left",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.label}</span>
                                {reason === r.id && <span style={{ color: C.amber700, fontSize: 14, fontWeight: 700 }}>✓</span>}
                            </div>
                            <div style={{ fontSize: 11, color: C.textMid }}>{r.desc}</div>
                        </button>
                    ))}

                    {reason && (
                        <div style={{ marginTop: 12 }} className="slide-up">
                            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                                Catatan Tambahan <span style={{ color: C.textDim, fontWeight: 500 }}>(opsional)</span>
                            </div>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Detail tambahan untuk admin..."
                                style={{
                                    width: "100%",
                                    minHeight: 70,
                                    padding: "10px 12px",
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontFamily: "inherit",
                                    resize: "vertical",
                                    background: C.surface,
                                }}
                            />
                            <div style={{
                                marginTop: 12,
                                background: C.infoBlueBg, border: `1px solid ${C.infoBlue}22`, borderLeft: `3px solid ${C.infoBlue}`,
                                borderRadius: 8, padding: "10px 12px", fontSize: 11, color: C.text, lineHeight: 1.5,
                            }}>
                                Setelah submit, admin akan dapat signal untuk reschedule atau create task lanjutan.
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                    <button onClick={onCancel} className="tap-feedback" style={{
                        flex: 1, background: C.surface, color: C.text, border: `1px solid ${C.border}`,
                        padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer",
                    }}>Batal</button>
                    <button onClick={onSubmit} disabled={!reason} className="tap-feedback" style={{
                        flex: 1,
                        background: !reason ? C.slate200 : C.amber400,
                        color: !reason ? C.textDim : "#fff",
                        border: "none",
                        padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                        cursor: !reason ? "not-allowed" : "pointer",
                    }}>Lapor Gagal</button>
                </div>
            </div>
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Integrated Flow
// ═══════════════════════════════════════════════════════════════════════════
export default function DriverRuntimeIntegrated() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [screen, setScreen] = useState("feed");
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [recentlyCompletedId, setRecentlyCompletedId] = useState(null);

    const activeTask = tasks.find(t => t.id === activeTaskId);

    const handleSelectTask = (task) => {
        if (task.state === "assigned") {
            setActiveTaskId(task.id);
            setScreen("workspace");
        }
        // Completed / failed tasks — could open read-only detail (not implemented here)
    };

    const handleSubmitTask = ({ actuals, outcome, hasSignature }) => {
        const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

        setTasks(prev => prev.map(t => {
            if (t.id !== activeTaskId) return t;

            if (outcome === "failed") {
                return { ...t, state: "failed", completedAt: now };
            }

            // Update item actuals
            const updatedItems = t.items.map(item => ({
                ...item,
                actualDrop: actuals[item.id].drop,
                actualPickup: actuals[item.id].pickup,
            }));

            return {
                ...t,
                state: "completed",
                completedAt: now,
                customerConfirmed: !!hasSignature,
                items: updatedItems,
            };
        }));

        setRecentlyCompletedId(activeTaskId);
        setTimeout(() => setRecentlyCompletedId(null), 2000);

        setActiveTaskId(null);
        setScreen("feed");
    };

    const handleBack = () => {
        setActiveTaskId(null);
        setScreen("feed");
    };

    return (
        <>
            <FontLoader />
            <div style={{
                minHeight: "100vh",
                width: "100vw",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 20px",
                gap: 20,
            }}>
                <div style={{ color: "#cbd5e1", textAlign: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, opacity: 0.7 }}>
                        Consteon
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 }}>
                        Driver Runtime · Integrated Flow
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                        Feed → Execution → Feed (driver-driven sequencing)
                    </div>
                </div>

                <div className="phone-shadow" style={{
                    width: 390,
                    height: 780,
                    maxHeight: "calc(100vh - 140px)",
                    background: C.bg,
                    borderRadius: 36,
                    overflow: "hidden",
                    position: "relative",
                }}>
                    <div style={{
                        height: 36,
                        background: C.surface,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 24px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        position: "relative",
                        zIndex: 5,
                    }}>
                        <span>08:24</span>
                        <span style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 11 }}>
                            <span>●●●●●</span>
                            <span style={{ marginLeft: 4 }}>🔋</span>
                        </span>
                    </div>

                    <div style={{ height: "calc(100% - 36px)", position: "relative" }}>
                        {screen === "feed" && (
                            <TaskFeedScreen
                                tasks={tasks}
                                onSelectTask={handleSelectTask}
                                recentlyCompletedId={recentlyCompletedId}
                            />
                        )}
                        {screen === "workspace" && activeTask && (
                            <DeliveryExecutionWorkspace
                                task={activeTask}
                                onBack={handleBack}
                                onSubmit={handleSubmitTask}
                            />
                        )}
                    </div>
                </div>

                {/* Quick reset for demo */}
                <div style={{
                    display: "flex",
                    gap: 8,
                    padding: "8px 16px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 100,
                    backdropFilter: "blur(10px)",
                }}>
                    <button
                        onClick={() => {
                            setTasks(INITIAL_TASKS);
                            setActiveTaskId(null);
                            setScreen("feed");
                            setRecentlyCompletedId(null);
                        }}
                        style={{
                            background: "transparent",
                            color: "#cbd5e1",
                            border: "none",
                            padding: "5px 14px",
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        ↻ Reset Demo
                    </button>
                </div>
            </div>
        </>
    );
}