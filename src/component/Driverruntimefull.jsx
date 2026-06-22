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

export const FontLoader = () => (
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
    @keyframes pop { 0% { transform: scale(0.94); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .pop { animation: pop 0.2s ease-out forwards; }
    @keyframes scanline { 0% { top: 8%; } 50% { top: 88%; } 100% { top: 8%; } }
    .scanline { animation: scanline 2.2s ease-in-out infinite; }
    @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
    .shake { animation: shake 0.4s ease; }
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
export const INITIAL_TASKS = [
    {
        id: "T-050",
        customer: "Mandiri Tower",
        address: "Jl. Jend. Sudirman Kav. 54-55",
        distance: "0 km · current",
        stopNumber: 1,
        state: "assigned",
        items: [
            { id: "gas_12", name: "Gas 12kg", type: "returnable", planDrop: 4, actualDrop: 0, planPickup: 0, actualPickup: 0 },
            { id: "aqua_galon", name: "Aqua Galon", type: "returnable", planDrop: 2, actualDrop: 0, planPickup: 0, actualPickup: 0 },
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

export const DRIVER = { name: "Budi Santoso", id: "DRV-001", role: "Driver" };  // executor (resolved dari scan kartu)
const VEHICLE = { id: "V-007", plate: "B 1234 XY" };
const DEMO_PIN = "2468";
// Pemilik HP di skenario demo — HP ini punya Andi (lagi login). Budi mau minjam.
export const DEVICE_OWNER = { name: "Andi Wijaya", id: "DRV-002", role: "Driver" };

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
const RouteProgressHeader = ({ tasks, onBack }) => {
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
                <button onClick={onBack} title="Kembali ke Home" className="tap-feedback" style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: "transparent", border: "none", fontSize: 18, color: C.text, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>←</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                        Rute Hari Ini
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: C.textMid, lineHeight: 1.2 }}>
                        {DRIVER.name} · {VEHICLE.plate}
                    </div>
                </div>
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
export const TaskFeedScreen = ({ tasks, onSelectTask, recentlyCompletedId, onBack }) => {
    const assigned = tasks.filter(t => t.state === "assigned");
    const completed = tasks.filter(t => t.state === "completed");
    const failed = tasks.filter(t => t.state === "failed");
    const remaining = assigned.length + failed.filter(f => false).length;  // (failed handled separately)
    const allDone = assigned.length === 0;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <RouteProgressHeader tasks={tasks} onBack={onBack} />

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
export const DeliveryExecutionWorkspace = ({ task, onBack, onSubmit }) => {
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
// AUTH GATE — SCAN CARD (Portable Executor Session entry)
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// DEVICE FRONT — HP sudah ada sesi pemilik (harus logout dulu buat dipinjam)
// ═══════════════════════════════════════════════════════════════════════════
export const DeviceOwnerScreen = ({ owner, onHandover }) => {
    const [showOwnerNote, setShowOwnerNote] = useState(false);
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 7,
                        background: `linear-gradient(135deg, ${C.driverAccent}, ${C.driverAccentDark})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#fff", fontWeight: 700, fontSize: 14,
                    }}>C</div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Driver Runtime</div>
                        <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.2 }}>HP ini lagi ada yang login</div>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px 100px" }} className="scroll-thin">
                {/* Owner session card */}
                <div className="slide-up" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                    padding: "14px 16px", marginBottom: 16,
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12, background: C.slate200, color: C.slate700,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0,
                    }}>{owner.name.split(" ").map(n => n[0]).join("").substring(0, 2)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{owner.name}</span>
                            <Chip variant="emerald">Sesi aktif</Chip>
                        </div>
                        <div className="mono" style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>{owner.id} · {owner.role}</div>
                        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Ini HP punya {owner.name.split(" ")[0]}</div>
                    </div>
                </div>

                {/* Handover explanation */}
                <div style={{
                    background: C.amber50, border: `1px solid ${C.amber100}`, borderLeft: `3px solid ${C.amber400}`,
                    borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: C.amber700, lineHeight: 1.6,
                }}>
                    <strong>Mau dipinjam orang lain?</strong> {owner.name.split(" ")[0]} harus <strong>Keluar</strong> dulu — sesinya ditutup & datanya dibersihin. Ga bisa scan kartu orang lain numpang di atas sesi {owner.name.split(" ")[0]}. <em>Satu HP, satu sesi.</em>
                </div>

                {showOwnerNote && (
                    <div className="slide-up" style={{
                        background: C.infoBlueBg, border: `1px solid ${C.infoBlue}22`, borderLeft: `3px solid ${C.infoBlue}`,
                        borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: C.text, lineHeight: 1.5,
                    }}>
                        {owner.name.split(" ")[0]} ga ada trip aktif yang nyambung di HP ini sekarang. Kalau ini HP-nya sendiri, dia tetap login seperti biasa.
                    </div>
                )}
            </div>

            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "12px 14px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={onHandover} className="tap-feedback" style={{
                    width: "100%", background: C.amber400, color: "#fff", border: "none",
                    padding: "16px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                }}>Keluar — Siapkan buat Dipinjam</button>
                <button onClick={() => setShowOwnerNote(v => !v)} className="tap-feedback" style={{
                    width: "100%", background: C.surface, color: C.text, border: `1px solid ${C.border}`,
                    padding: "13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Tetap sebagai {owner.name.split(" ")[0]}</button>
            </div>
        </div>
    );
};

export const ScanScreen = ({ onScanned, resuming = false, executorName = "", remaining = 0 }) => (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 7,
                    background: `linear-gradient(135deg, ${C.driverAccent}, ${C.driverAccentDark})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: 14,
                }}>C</div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>Driver Runtime</div>
                    <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.2 }}>
                        {resuming ? "Trip di-pause · scan kartu buat lanjut" : "Belum ada sesi · scan untuk mulai"}
                    </div>
                </div>
            </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 18px 100px" }} className="scroll-thin">
            {resuming ? (
                <div style={{
                    background: C.driverAccentBg, border: `1px solid ${C.driverAccent}22`, borderLeft: `3px solid ${C.driverAccent}`,
                    borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: C.driverAccentDark, lineHeight: 1.5,
                }} className="slide-up">
                    <strong>Lanjutkan trip.</strong> Sesi {executorName} di-pause — {remaining} task belum kelar masih nunggu. Scan kartu + PIN buat lanjut dari titik terakhir, di device manapun.
                </div>
            ) : (
                <div style={{
                    background: C.amber50, border: `1px solid ${C.amber100}`, borderLeft: `3px solid ${C.amber400}`,
                    borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.amber700, lineHeight: 1.5,
                }} className="slide-up">
                    Device ini bisa jadi bukan punya lo (HP kantor / admin / temen). Identitas lo dibawa di <strong>kartu</strong>, bukan di HP ini.
                </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                <div style={{
                    position: "relative", width: 200, height: 200, borderRadius: 18,
                    background: "#0f172a", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    {[
                        { top: 12, left: 12, t: 1, l: 1 },
                        { top: 12, right: 12, t: 1, r: 1 },
                        { bottom: 12, left: 12, b: 1, l: 1 },
                        { bottom: 12, right: 12, b: 1, r: 1 },
                    ].map((c, i) => (
                        <div key={i} style={{
                            position: "absolute", width: 28, height: 28,
                            top: c.top, left: c.left, right: c.right, bottom: c.bottom,
                            borderTop: c.t ? `3px solid ${C.driverAccent}` : "none",
                            borderLeft: c.l ? `3px solid ${C.driverAccent}` : "none",
                            borderRight: c.r ? `3px solid ${C.driverAccent}` : "none",
                            borderBottom: c.b ? `3px solid ${C.driverAccent}` : "none",
                            borderRadius: 4,
                        }} />
                    ))}
                    <div className="scanline" style={{
                        position: "absolute", left: "8%", right: "8%", height: 2,
                        background: C.driverAccent, boxShadow: `0 0 10px ${C.driverAccent}`,
                    }} />
                    <span style={{ fontSize: 56, opacity: 0.25 }}>▦</span>
                </div>
            </div>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    {resuming ? "Scan buat lanjutkan trip" : "Scan kartu ID lo"}
                </div>
                <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                    Arahkan QR di kartu ke kamera buat {resuming ? "lanjut dari titik terakhir." : "buka sesi Driver Runtime."}
                </div>
            </div>
        </div>
        <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "12px 14px", flexShrink: 0 }}>
            <button onClick={onScanned} className="tap-feedback" style={{
                width: "100%", background: C.driverAccent, color: "#fff", border: "none",
                padding: "16px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: "0.04em",
            }}>{resuming ? "Simulasikan Scan · Lanjut" : "Simulasikan Scan Kartu"}</button>
            <div style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 8 }}>(mockup — tap untuk simulasi scan berhasil)</div>
        </div>
    </div>
);

// ─── AUTH GATE — PIN ────────────────────────────────────────────────────────
export const PinScreen = ({ executor, onBack, onSuccess, resuming = false }) => {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        if (pin.length === 4) {
            if (pin === DEMO_PIN) {
                const t = setTimeout(onSuccess, 220);
                return () => clearTimeout(t);
            } else {
                setError(true);
                const t = setTimeout(() => { setPin(""); setError(false); }, 480);
                return () => clearTimeout(t);
            }
        }
    }, [pin, onSuccess]);

    const press = (d) => { if (pin.length < 4 && !error) setPin(pin + d); };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={onBack} className="tap-feedback" style={{
                    width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none",
                    fontSize: 18, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>{resuming ? "Lanjutkan Sesi" : "Verifikasi Identitas"}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Masukkan PIN</div>
                </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 18px 14px" }}>
                <div className="pop" style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: C.driverAccentBg, border: `1px solid ${C.driverAccent}22`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 24,
                }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 10, background: C.driverAccent, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0,
                    }}>{executor.name.split(" ").map(n => n[0]).join("").substring(0, 2)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: C.driverAccentDark, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 2 }}>Kartu terbaca</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{executor.name}</div>
                        <div className="mono" style={{ fontSize: 11, color: C.textMid }}>{executor.id} · {executor.role}</div>
                    </div>
                </div>
                <div className={error ? "shake" : ""} style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 10 }}>
                    {[0, 1, 2, 3].map(i => {
                        const filled = i < pin.length;
                        return (
                            <div key={i} style={{
                                width: 16, height: 16, borderRadius: "50%",
                                background: error ? "#dc2626" : filled ? C.driverAccent : "transparent",
                                border: `2px solid ${error ? "#dc2626" : filled ? C.driverAccent : C.borderStrong}`,
                                transition: "all 0.12s ease",
                            }} />
                        );
                    })}
                </div>
                <div style={{ textAlign: "center", height: 18, marginBottom: 14 }}>
                    {error
                        ? <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>PIN salah · coba lagi</span>
                        : <span style={{ fontSize: 11, color: C.textDim }}>PIN demo: {DEMO_PIN}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: "auto" }}>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(d => (
                        <button key={d} onClick={() => press(d)} className="tap-feedback" style={{
                            padding: "16px 0", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`,
                            fontSize: 22, fontWeight: 600, color: C.text, cursor: "pointer",
                        }}>{d}</button>
                    ))}
                    <div />
                    <button onClick={() => press("0")} className="tap-feedback" style={{
                        padding: "16px 0", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`,
                        fontSize: 22, fontWeight: 600, color: C.text, cursor: "pointer",
                    }}>0</button>
                    <button onClick={() => setPin(pin.slice(0, -1))} className="tap-feedback" style={{
                        padding: "16px 0", borderRadius: 12, background: "transparent", border: "none",
                        fontSize: 20, color: C.textMid, cursor: "pointer",
                    }}>⌫</button>
                </div>
            </div>
        </div>
    );
};

// ─── PAUSE CONFIRM SHEET — keluar di tengah trip ───────────────────────────
export const PauseConfirmSheet = ({ remaining, onConfirm, onCancel }) => (
    <>
        <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
        <div className="sheet-up" style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: C.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 11,
            display: "flex", flexDirection: "column",
        }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
            </div>
            <div style={{ padding: "14px 18px 8px" }}>
                <div style={{ fontSize: 11, color: C.amber700, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, marginBottom: 4 }}>
                    Tugas belum kelar
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Pause sesi di device ini?</div>
            </div>
            <div style={{ padding: "4px 18px 16px" }}>
                <div style={{
                    background: C.amber50, border: `1px solid ${C.amber100}`, borderLeft: `3px solid ${C.amber400}`,
                    borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: C.amber700, lineHeight: 1.6,
                }}>
                    Masih ada <strong>{remaining} task</strong> belum kelar. Sesi di device ini bakal ditutup & datanya dibersihin — aman kalau HP-nya mau dibalikin.
                </div>
                <div style={{
                    background: C.infoBlueBg, border: `1px solid ${C.infoBlue}22`, borderLeft: `3px solid ${C.infoBlue}`,
                    borderRadius: 10, padding: "12px 14px", fontSize: 12, color: C.text, lineHeight: 1.6,
                }}>
                    Trip-nya <strong>nggak hilang</strong>. Lanjut kapan aja di device manapun — tinggal <strong>scan kartu + PIN</strong>, balik persis dari titik terakhir.
                </div>
            </div>
            <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={onConfirm} className="tap-feedback" style={{
                    width: "100%", background: C.amber400, color: "#fff", border: "none",
                    padding: "15px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                }}>Pause & Keluar</button>
                <button onClick={onCancel} className="tap-feedback" style={{
                    width: "100%", background: C.surface, color: C.text, border: `1px solid ${C.border}`,
                    padding: "13px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>Batal · Lanjut Kerja</button>
            </div>
        </div>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════
// CUSTODY CONFIRMATION LAYER — bilateral acknowledgement (ported)
// independent count + reveal gate + mismatch preservation
// ═══════════════════════════════════════════════════════════════════════════
export const PENDING_CUSTODY = {
    custodyEventId: "CEC-0284",
    vehicleId: "V-007",
    vehiclePlate: "B 1234 XY",
    loadedBy: "Anton Pratama",      // Checker who loaded
    loadedAt: "06:18",
    loadSessionId: "LS-2026-05-20-001",

    // What warehouse recorded — driver verifies against this
    // (warehouseRecorded = sum of drops across tasks below)
    items: [
        { id: "gas_12", name: "Gas 12kg", type: "returnable", warehouseRecorded: 10 },
        { id: "gas_3", name: "Gas 3kg", type: "returnable", warehouseRecorded: 3 },
        { id: "aqua_galon", name: "Aqua Galon", type: "returnable", warehouseRecorded: 8 },
        { id: "aqua_600", name: "Aqua 600ml (Dus)", type: "consumable", warehouseRecorded: 4 },
    ],

    // Task manifest — what driver actually needs to execute
    // Per task: drops + pickups, with breakdown per item
    tasks: [
        {
            id: "T-050",
            customer: "Mandiri Tower",
            address: "Jl. Jend. Sudirman Kav. 54-55, Jakarta",
            stopNumber: 1,
            items: [
                { id: "gas_12", name: "Gas 12kg", type: "returnable", drop: 4, pickup: 0 },
                { id: "aqua_galon", name: "Aqua Galon", type: "returnable", drop: 2, pickup: 0 },
            ],
        },
        {
            id: "T-051",
            customer: "Honda Bintaro",
            address: "Jl. Bintaro Utama 23, Tangerang",
            stopNumber: 2,
            items: [
                { id: "gas_12", name: "Gas 12kg", type: "returnable", drop: 3, pickup: 0 },
                { id: "gas_3", name: "Gas 3kg", type: "returnable", drop: 3, pickup: 3 },
                { id: "aqua_600", name: "Aqua 600ml (Dus)", type: "consumable", drop: 4, pickup: 0 },
            ],
        },
        {
            id: "T-052",
            customer: "BCA Cabang Bintaro",
            address: "Jl. Bintaro Sektor 7, Tangerang",
            stopNumber: 3,
            items: [
                { id: "gas_12", name: "Gas 12kg", type: "returnable", drop: 3, pickup: 0 },
                { id: "aqua_galon", name: "Aqua Galon", type: "returnable", drop: 6, pickup: 0 },
            ],
        },
        {
            id: "T-053",
            customer: "Toko Sumber Rejeki",
            address: "Jl. Bintaro Permai Blok C2",
            stopNumber: 4,
            items: [
                { id: "gas_3", name: "Gas 3kg", type: "returnable", drop: 0, pickup: 3 },
            ],
        },
    ],
};
const aggregateTaskTotals = (custody) => {
    const totals = {};
    custody.items.forEach(item => {
        totals[item.id] = { drop: 0, pickup: 0, name: item.name, type: item.type };
    });
    custody.tasks.forEach(task => {
        task.items.forEach(ti => {
            if (totals[ti.id]) {
                totals[ti.id].drop += ti.drop;
                totals[ti.id].pickup += ti.pickup;
            }
        });
    });
    return totals;
};
const IndependentCountStepper = ({ value, onChange, itemName, itemType, showWarehouseRef, warehouseValue }) => {
    const hasValue = value > 0;
    const isConsumable = itemType === "consumable";

    // Only AFTER driver has set a count, show comparison
    const showComparison = hasValue && showWarehouseRef;
    const delta = value - warehouseValue;
    const isMatch = showComparison && delta === 0;
    const isShortage = showComparison && delta < 0;
    const isSurplus = showComparison && delta > 0;

    const valueColor = !hasValue ? C.textDim
        : !showComparison ? C.text
            : isMatch ? C.emerald700
                : isShortage ? C.amber700
                    : C.violet700;

    return (
        <div style={{ marginBottom: 16 }}>
            {/* Item label */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{itemName}</span>
                    {isConsumable && (
                        <span style={{
                            padding: "2px 6px", borderRadius: 3,
                            background: C.slate100, color: C.slate600,
                            fontSize: 9, fontWeight: 600,
                            textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>Consumable</span>
                    )}
                </div>
                {/* Warehouse claim — ONLY shown if revealed */}
                {showWarehouseRef && (
                    <div style={{ fontSize: 11, color: C.textMid, fontStyle: "italic" }}>
                        Warehouse: <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{warehouseValue}</span>
                    </div>
                )}
            </div>

            {/* Stepper */}
            <div style={{
                display: "flex",
                alignItems: "stretch",
                background: C.surface,
                border: `2px solid ${!showComparison ? C.border :
                    isMatch ? C.emerald400 :
                        isShortage ? C.amber400 :
                            isSurplus ? C.violet400 : C.border
                    }`,
                borderRadius: 10,
                overflow: "hidden",
            }}>
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="tap-feedback"
                    style={{
                        width: 56, height: 56,
                        border: "none", background: C.surface,
                        fontSize: 24, fontWeight: 600,
                        color: value === 0 ? C.textDim : C.text,
                        cursor: "pointer",
                        transition: "transform 0.1s ease",
                    }}
                >−</button>

                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: !showComparison ? C.surface :
                        isMatch ? C.emerald50 :
                            isShortage ? C.amber50 :
                                isSurplus ? C.violet50 : C.surface,
                    padding: "4px 0",
                }}>
                    <span className="mono" style={{
                        fontSize: 32, fontWeight: 700,
                        color: valueColor,
                        lineHeight: 1,
                    }}>{value}</span>
                    {showComparison && delta !== 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: valueColor,
                            marginTop: 2,
                            letterSpacing: "0.04em",
                        }}>
                            Selisih: {delta > 0 ? "+" : ""}{delta}
                        </span>
                    )}
                    {showComparison && isMatch && (
                        <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: C.emerald700,
                            marginTop: 2,
                            letterSpacing: "0.04em",
                        }}>
                            ✓ Match
                        </span>
                    )}
                </div>

                <button
                    onClick={() => onChange(value + 1)}
                    className="tap-feedback"
                    style={{
                        width: 56, height: 56,
                        border: "none", background: C.surface,
                        fontSize: 24, fontWeight: 600,
                        color: C.text,
                        cursor: "pointer",
                        transition: "transform 0.1s ease",
                    }}
                >+</button>
            </div>
        </div>
    );
};

// ─── TASK MANIFEST CARD ────────────────────────────────────────────────────
// Shows full per-task breakdown — driver execution-critical information.
// Per doctrine: drivers SEE task list, customer, address, drop/pickup qty.
// They do NOT see customer outstanding balance or reconciliation data.
const TaskManifestCard = ({ custody }) => {
    const [expandedTaskId, setExpandedTaskId] = useState(custody.tasks[0]?.id);  // first expanded
    const totals = aggregateTaskTotals(custody);

    const totalDrop = Object.values(totals).reduce((s, t) => s + t.drop, 0);
    const totalPickup = Object.values(totals).reduce((s, t) => s + t.pickup, 0);

    return (
        <div style={{ marginBottom: 16 }}>
            {/* Section header */}
            <div style={{ marginBottom: 10, paddingLeft: 4 }}>
                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 2 }}>
                    Task Manifest
                </div>
                <div style={{ fontSize: 12, color: C.textMid }}>
                    {custody.tasks.length} task · {custody.tasks.reduce((s, t) => s + t.items.length, 0)} item line · tap untuk lihat detail
                </div>
            </div>

            {/* Per-task cards */}
            <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 12,
            }}>
                {custody.tasks.map((task, idx) => {
                    const isExpanded = expandedTaskId === task.id;
                    const isLast = idx === custody.tasks.length - 1;
                    const taskTotalDrop = task.items.reduce((s, i) => s + i.drop, 0);
                    const taskTotalPickup = task.items.reduce((s, i) => s + i.pickup, 0);

                    return (
                        <div key={task.id} style={{
                            borderBottom: isLast ? "none" : `1px solid ${C.border}`,
                        }}>
                            {/* Task header (collapsible) */}
                            <button
                                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                className="tap-feedback"
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    background: "transparent",
                                    border: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    cursor: "pointer",
                                    textAlign: "left",
                                }}
                            >
                                {/* Stop number */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: 6,
                                    background: isExpanded ? C.driverAccent : C.slate100,
                                    color: isExpanded ? "#fff" : C.textMid,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 12, fontWeight: 700,
                                    flexShrink: 0,
                                    transition: "all 0.15s ease",
                                }}>{task.stopNumber}</div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        <span className="mono" style={{ fontSize: 11, color: C.textDim, fontWeight: 500 }}>
                                            {task.id}
                                        </span>
                                        {taskTotalDrop > 0 && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600,
                                                color: C.driverAccent, padding: "1px 5px",
                                                background: C.driverAccentBg, borderRadius: 3,
                                            }}>↓ {taskTotalDrop}</span>
                                        )}
                                        {taskTotalPickup > 0 && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600,
                                                color: C.violet700, padding: "1px 5px",
                                                background: C.violet50, borderRadius: 3,
                                            }}>↑ {taskTotalPickup}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {task.customer}
                                    </div>
                                    <div style={{ fontSize: 11, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {task.address}
                                    </div>
                                </div>

                                <span style={{
                                    color: C.textDim,
                                    fontSize: 12,
                                    transform: isExpanded ? "rotate(90deg)" : "none",
                                    transition: "transform 0.15s ease",
                                    flexShrink: 0,
                                }}>›</span>
                            </button>

                            {/* Expanded — item breakdown */}
                            {isExpanded && (
                                <div className="slide-up" style={{
                                    background: C.surfaceAlt,
                                    borderTop: `1px solid ${C.border}`,
                                    padding: "10px 14px",
                                }}>
                                    {task.items.map((item, i) => (
                                        <div key={item.id} style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            padding: "8px 0",
                                            borderBottom: i === task.items.length - 1 ? "none" : `1px solid ${C.border}`,
                                        }}>
                                            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{item.name}</span>
                                                {item.type === "consumable" && (
                                                    <span style={{
                                                        padding: "1px 5px", borderRadius: 3,
                                                        background: C.slate100, color: C.slate600,
                                                        fontSize: 9, fontWeight: 600,
                                                        textTransform: "uppercase", letterSpacing: "0.04em",
                                                        flexShrink: 0,
                                                    }}>C</span>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                {item.drop > 0 && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                                        <span style={{ color: C.driverAccent, fontWeight: 600 }}>↓</span>
                                                        <span className="mono" style={{ color: C.text, fontWeight: 700 }}>{item.drop}</span>
                                                        <span style={{ color: C.textDim, fontSize: 10 }}>drop</span>
                                                    </div>
                                                )}
                                                {item.pickup > 0 && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                                        <span style={{ color: C.violet700, fontWeight: 600 }}>↑</span>
                                                        <span className="mono" style={{ color: C.text, fontWeight: 700 }}>{item.pickup}</span>
                                                        <span style={{ color: C.textDim, fontSize: 10 }}>pickup</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* TOTAL CIRCULATION — aggregate verification */}
            <div style={{
                background: C.driverAccentBg,
                border: `1px solid ${C.driverAccent}22`,
                borderLeft: `3px solid ${C.driverAccent}`,
                borderRadius: 10,
                padding: "12px 14px",
            }}>
                <div style={{ fontSize: 10, color: C.driverAccentDark, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 10 }}>
                    Total Circulation
                </div>

                {/* Per-item totals */}
                {Object.entries(totals).map(([itemId, t]) => {
                    const itemMeta = custody.items.find(i => i.id === itemId);
                    if (!itemMeta) return null;
                    const loaded = itemMeta.warehouseRecorded;
                    const expectedReturn = loaded - t.drop + t.pickup;
                    const drops = t.drop;
                    const pickups = t.pickup;

                    return (
                        <div key={itemId} style={{
                            padding: "8px 0",
                            borderBottom: `1px solid ${C.driverAccent}11`,
                            fontSize: 12,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <span style={{ color: C.text, fontWeight: 600 }}>{t.name}</span>
                                {t.type === "consumable" && (
                                    <span style={{
                                        padding: "1px 5px", borderRadius: 3,
                                        background: C.slate100, color: C.slate600,
                                        fontSize: 9, fontWeight: 600,
                                        textTransform: "uppercase", letterSpacing: "0.04em",
                                    }}>C</span>
                                )}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
                                <div>
                                    <span style={{ color: C.textMid, display: "block", marginBottom: 1 }}>Muat</span>
                                    <span className="mono" style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{loaded}</span>
                                </div>
                                <div>
                                    <span style={{ color: C.textMid, display: "block", marginBottom: 1 }}>↓ Drop</span>
                                    <span className="mono" style={{ color: C.driverAccent, fontWeight: 700, fontSize: 13 }}>{drops}</span>
                                </div>
                                <div>
                                    <span style={{ color: C.textMid, display: "block", marginBottom: 1 }}>↑ Pickup</span>
                                    <span className="mono" style={{ color: C.violet700, fontWeight: 700, fontSize: 13 }}>{pickups}</span>
                                </div>
                            </div>
                            {/* Validation check inline */}
                            {loaded !== drops && (
                                <div style={{ marginTop: 6, fontSize: 10, color: C.amber700, fontWeight: 500 }}>
                                    ⚠ Muat ({loaded}) ≠ total drop ({drops})
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Aggregate footer */}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.driverAccent}33`, display: "flex", gap: 14, fontSize: 11 }}>
                    <div>
                        <span style={{ color: C.textMid }}>Total ↓ drop: </span>
                        <span className="mono" style={{ color: C.driverAccent, fontWeight: 700 }}>{totalDrop}</span>
                    </div>
                    <div>
                        <span style={{ color: C.textMid }}>Total ↑ pickup: </span>
                        <span className="mono" style={{ color: C.violet700, fontWeight: 700 }}>{totalPickup}</span>
                    </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 10, color: C.textMid, lineHeight: 1.5, fontStyle: "italic" }}>
                    Muat awal = jumlah drop total. Pickup nambah ke vehicle selama rute.
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 1: CUSTODY NOTIFICATION (Driver Home Surface)
// ═══════════════════════════════════════════════════════════════════════════
// Driver sees a pending custody confirmation BEFORE they can do anything else.
// This is BLOCKING — they cannot proceed to task execution until handled.
export const CustodyNotificationScreen = ({ custody, onStartConfirmation, onBack }) => {
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>

            {/* Zone 1: Identity Header */}
            <div style={{
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                padding: "14px 16px",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={onBack} className="tap-feedback" style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: "transparent", border: "none", fontSize: 18, color: C.text, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>←</button>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>
                            Penerimaan Muatan
                        </div>
                        <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.2 }}>
                            {DRIVER.name} · Driver Runtime
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone 3: Main content */}
            <div style={{ flex: 1, padding: "20px 16px 100px", overflowY: "auto" }} className="scroll-thin">

                {/* Custody Pending Banner — operationally important */}
                <div style={{
                    background: C.amber50,
                    border: `1px solid ${C.amber100}`,
                    borderLeft: `3px solid ${C.amber400}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 20,
                }} className="slide-up">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: C.amber700, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            ⓘ Konfirmasi Diperlukan
                        </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>
                        Vehicle siap berangkat, butuh konfirmasi penerimaan
                    </div>
                    <div style={{ fontSize: 12, color: C.amber700, lineHeight: 1.5 }}>
                        Lo belum bisa mulai task hari ini sebelum konfirmasi load dari warehouse.
                    </div>
                </div>

                {/* Vehicle Card */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "16px",
                    marginBottom: 16,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 10,
                            background: C.driverAccentBg,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 24,
                            flexShrink: 0,
                        }}>🚚</div>
                        <div style={{ flex: 1 }}>
                            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                                {custody.vehiclePlate}
                            </div>
                        </div>
                    </div>

                    {/* Load info */}
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                        <div style={{ display: "grid", gap: 8, fontSize: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: C.textMid }}>Dimuat oleh</span>
                                <span style={{ color: C.text, fontWeight: 500 }}>{custody.loadedBy}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: C.textMid }}>Waktu loading</span>
                                <span className="mono" style={{ color: C.text, fontWeight: 500 }}>{custody.loadedAt}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: C.textMid }}>Custody event</span>
                                <span className="mono" style={{ color: C.text, fontWeight: 500 }}>{custody.custodyEventId}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TASK MANIFEST — full visibility per doctrine (driver execution-critical info) */}
                <TaskManifestCard custody={custody} />

                {/* Doctrine reminder */}
                <div style={{
                    background: C.infoBlueBg,
                    border: `1px solid ${C.infoBlue}22`,
                    borderLeft: `3px solid ${C.infoBlue}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: C.text,
                    lineHeight: 1.6,
                }}>
                    <strong>Cara konfirmasi:</strong> Lo akan diminta hitung fisik setiap item secara independen. Lo tidak akan lihat angka dari warehouse sebelum lo hitung — biar konfirmasi-nya genuine bilateral, bukan formality.
                </div>
            </div>

            {/* Zone 5: Sticky action bar */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "12px 14px",
                flexShrink: 0,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
            }}>
                <button
                    onClick={onStartConfirmation}
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
                    Mulai Konfirmasi Penerimaan
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 2: INDEPENDENT COUNT WORKSPACE
// ═══════════════════════════════════════════════════════════════════════════
// Driver counts physically BEFORE seeing warehouse-recorded values.
// "Reveal" happens after driver explicitly opts in (single press).
export const IndependentCountWorkspace = ({ custody, onBack, onContinue }) => {
    const [counts, setCounts] = useState(
        custody.items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
    );
    const [hasRevealed, setHasRevealed] = useState(false);

    const items = custody.items;
    const returnableItems = items.filter(i => i.type === "returnable");
    const consumableItems = items.filter(i => i.type === "consumable");

    const allCounted = items.every(item => counts[item.id] > 0);
    const hasAnyCount = Object.values(counts).some(v => v > 0);

    // Determine match state after reveal
    const hasMismatch = hasRevealed && items.some(item => counts[item.id] !== item.warehouseRecorded);
    const allMatch = hasRevealed && items.every(item => counts[item.id] === item.warehouseRecorded);

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>

            {/* Zone 1: Header */}
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
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                        Konfirmasi Penerimaan
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {custody.vehiclePlate}
                    </div>
                </div>
                {/* Step indicator */}
                <div style={{
                    background: C.driverAccentBg,
                    color: C.driverAccent,
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                }}>
                    {hasRevealed ? "Step 2/2" : "Step 1/2"}
                </div>
            </div>

            {/* Zone 4: Context rail */}
            <div style={{
                background: C.driverAccentBg,
                borderBottom: `1px solid ${C.border}`,
                padding: "10px 14px",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.driverAccentDark }}>
                    {!hasRevealed ? (
                        <>
                            <span style={{ fontWeight: 600 }}>Hitung independen</span>
                            <span style={{ color: C.textDim }}>·</span>
                            <span>angka warehouse belum diperlihatkan</span>
                        </>
                    ) : (
                        <>
                            <span style={{ fontWeight: 600 }}>Verifikasi vs catatan warehouse</span>
                            <span style={{ color: C.textDim }}>·</span>
                            <span>{allMatch ? "Match" : "Ada selisih"}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Zone 3: Workspace */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 100px" }} className="scroll-thin">

                {/* Instructions banner */}
                {!hasRevealed && (
                    <div style={{
                        background: C.infoBlueBg,
                        border: `1px solid ${C.infoBlue}22`,
                        borderLeft: `3px solid ${C.infoBlue}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        marginBottom: 16,
                        display: "flex",
                        gap: 10,
                    }} className="slide-up">
                        <span style={{ color: C.infoBlue, fontSize: 16, lineHeight: 1, marginTop: 2 }}>ⓘ</span>
                        <div style={{ flex: 1, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                            <strong>Hitung sendiri dulu.</strong> Angka warehouse akan terungkap setelah lo selesai hitung — biar konfirmasi-nya genuine, bukan auto-match.
                        </div>
                    </div>
                )}

                {/* Returnable Section */}
                {returnableItems.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 10,
                            paddingBottom: 6,
                            borderBottom: `1px solid ${C.border}`,
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.driverAccent }} />
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: C.driverAccentDark,
                                textTransform: "uppercase", letterSpacing: "0.08em",
                            }}>Returnable</span>
                        </div>
                        {returnableItems.map(item => (
                            <IndependentCountStepper
                                key={item.id}
                                itemName={item.name}
                                itemType={item.type}
                                value={counts[item.id]}
                                onChange={(v) => setCounts({ ...counts, [item.id]: v })}
                                showWarehouseRef={hasRevealed}
                                warehouseValue={item.warehouseRecorded}
                            />
                        ))}
                    </div>
                )}

                {/* Consumable Section */}
                {consumableItems.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 10,
                            paddingBottom: 6,
                            borderBottom: `1px solid ${C.border}`,
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.slate400 }} />
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: C.slate700,
                                textTransform: "uppercase", letterSpacing: "0.08em",
                            }}>Consumable</span>
                        </div>
                        {consumableItems.map(item => (
                            <IndependentCountStepper
                                key={item.id}
                                itemName={item.name}
                                itemType={item.type}
                                value={counts[item.id]}
                                onChange={(v) => setCounts({ ...counts, [item.id]: v })}
                                showWarehouseRef={hasRevealed}
                                warehouseValue={item.warehouseRecorded}
                            />
                        ))}
                    </div>
                )}

                {/* After reveal — outcome summary */}
                {hasRevealed && allMatch && (
                    <div style={{
                        marginTop: 16,
                        background: C.emerald50,
                        border: `1px solid ${C.emerald100}`,
                        borderLeft: `3px solid ${C.emerald400}`,
                        borderRadius: 10,
                        padding: "14px 16px",
                    }} className="slide-up">
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.emerald700, marginBottom: 4 }}>
                            ✓ Semua match
                        </div>
                        <div style={{ fontSize: 12, color: C.emerald700, lineHeight: 1.5 }}>
                            Hitungan lo sama dengan catatan warehouse. Lo bisa konfirmasi load dan berangkat.
                        </div>
                    </div>
                )}

                {hasRevealed && hasMismatch && (
                    <div style={{
                        marginTop: 16,
                        background: C.amber50,
                        border: `1px solid ${C.amber100}`,
                        borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 10,
                        padding: "14px 16px",
                    }} className="slide-up">
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.amber700, marginBottom: 4 }}>
                            ! Ada selisih dengan catatan warehouse
                        </div>
                        <div style={{ fontSize: 12, color: C.amber700, lineHeight: 1.5, marginBottom: 8 }}>
                            Hitungan lo berbeda dengan catatan warehouse. Lo punya 2 pilihan:
                        </div>
                        <ul style={{ fontSize: 12, color: C.amber700, lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                            <li><strong>Recount</strong> — kalau lo ragu dengan hitungan lo</li>
                            <li><strong>Report mismatch</strong> — kalau lo yakin dengan hitungan lo</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Zone 5: Action bar */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "12px 14px",
                flexShrink: 0,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}>
                {!hasRevealed ? (
                    <button
                        onClick={() => setHasRevealed(true)}
                        disabled={!allCounted}
                        className="tap-feedback"
                        style={{
                            width: "100%",
                            background: !allCounted ? C.slate200 : C.driverAccent,
                            color: !allCounted ? C.textDim : "#fff",
                            border: "none",
                            padding: "16px",
                            borderRadius: 10,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: allCounted ? "pointer" : "not-allowed",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                        }}
                    >
                        {!hasAnyCount ? "Mulai Hitung" :
                            !allCounted ? `Hitung Semua Item (${Object.values(counts).filter(v => v > 0).length}/${items.length})` :
                                "Lihat Catatan Warehouse →"}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => onContinue(counts, allMatch ? "confirm" : "mismatch")}
                            className="tap-feedback"
                            style={{
                                width: "100%",
                                background: allMatch ? C.emerald500 : C.amber400,
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
                            {allMatch ? "Konfirmasi Load · Siap Berangkat" : "Lanjut · Report Mismatch"}
                        </button>
                        {hasMismatch && (
                            <button
                                onClick={() => {
                                    // Recount: reset counts, hide warehouse reveal
                                    setCounts(custody.items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {}));
                                    setHasRevealed(false);
                                }}
                                className="tap-feedback"
                                style={{
                                    width: "100%",
                                    background: C.surface,
                                    color: C.text,
                                    border: `1px solid ${C.border}`,
                                    padding: "13px",
                                    borderRadius: 10,
                                    fontSize: 14,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                            >
                                Recount Dulu
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 3A: CONFIRMATION SUCCESS
// ═══════════════════════════════════════════════════════════════════════════
export const ConfirmationSuccessScreen = ({ custody, counts, onProceed }) => {
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                padding: "14px 16px",
                flexShrink: 0,
            }}>
                <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                    Custody Confirmed
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {custody.vehiclePlate}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 100px" }} className="scroll-thin">
                {/* Success banner */}
                <div style={{
                    background: C.emerald50,
                    border: `1px solid ${C.emerald100}`,
                    borderRadius: 12,
                    padding: "24px 20px",
                    marginBottom: 20,
                    textAlign: "center",
                }} className="slide-up">
                    <div style={{
                        width: 64, height: 64,
                        borderRadius: "50%",
                        background: C.emerald500,
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                        fontWeight: 700,
                        marginBottom: 14,
                    }}>✓</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.emerald700, marginBottom: 4 }}>
                        Konfirmasi Tercatat
                    </div>
                    <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                        Custody event <span className="mono" style={{ fontWeight: 600, color: C.text }}>{custody.custodyEventId}</span> sudah confirmed. Vehicle ditandai siap berangkat.
                    </div>
                </div>

                {/* Confirmed items summary */}
                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
                    Yang Dikonfirmasi
                </div>
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    overflow: "hidden",
                }}>
                    {custody.items.map((item, idx) => (
                        <div key={item.id} style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderBottom: idx === custody.items.length - 1 ? "none" : `1px solid ${C.border}`,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{item.name}</span>
                                {item.type === "consumable" && (
                                    <span style={{
                                        padding: "1px 5px", borderRadius: 3,
                                        background: C.slate100, color: C.slate600,
                                        fontSize: 9, fontWeight: 600,
                                        textTransform: "uppercase", letterSpacing: "0.04em",
                                    }}>C</span>
                                )}
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: C.emerald700 }}>
                                    {counts[item.id]}
                                </span>
                                <span style={{ fontSize: 11, color: C.textDim }}>✓</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Next step hint */}
                <div style={{
                    marginTop: 20,
                    padding: "12px 14px",
                    background: C.driverAccentBg,
                    border: `1px solid ${C.driverAccent}22`,
                    borderLeft: `3px solid ${C.driverAccent}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: C.text,
                    lineHeight: 1.6,
                }}>
                    <strong>Selanjutnya:</strong> Mulai eksekusi {custody.tasks.length} task hari ini, dimulai dari stop 1 ({custody.tasks[0]?.customer}).
                </div>
            </div>

            {/* Action bar */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "12px 14px",
                flexShrink: 0,
            }}>
                <button
                    onClick={onProceed}
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
                    Lapor Selesai · Kembali ke Home →
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 3B: MISMATCH REPORTING
// ═══════════════════════════════════════════════════════════════════════════
export const MismatchReportScreen = ({ custody, counts, onBack, onSubmit }) => {
    const [note, setNote] = useState("");
    const [hasPhoto, setHasPhoto] = useState(false);

    // Identify mismatches
    const mismatches = custody.items
        .map(item => ({
            ...item,
            driverCounted: counts[item.id],
            delta: counts[item.id] - item.warehouseRecorded,
        }))
        .filter(item => item.delta !== 0);

    const canSubmit = note.trim().length >= 10 && hasPhoto;  // alasan + foto wajib

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>

            {/* Header */}
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
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                        Report Mismatch
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {custody.vehiclePlate} · Custody Discrepancy
                    </div>
                </div>
            </div>

            {/* Workspace */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 100px" }} className="scroll-thin">

                {/* Important context */}
                <div style={{
                    background: C.amber50,
                    border: `1px solid ${C.amber100}`,
                    borderLeft: `3px solid ${C.amber400}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 20,
                    fontSize: 13,
                    color: C.amber700,
                    lineHeight: 1.6,
                }} className="slide-up">
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>Penting</div>
                    Lo akan submit disagreement dengan catatan warehouse. Ini bukan judgement siapa yang salah — supervisor akan investigasi setelahnya.
                </div>

                {/* Mismatch list */}
                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
                    Item dengan selisih ({mismatches.length})
                </div>

                {mismatches.map(item => {
                    const isShortage = item.delta < 0;
                    return (
                        <div key={item.id} style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderLeft: `3px solid ${isShortage ? C.amber400 : C.violet400}`,
                            borderRadius: 10,
                            padding: "14px 16px",
                            marginBottom: 10,
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.name}</span>
                                    {item.type === "consumable" && (
                                        <span style={{
                                            padding: "1px 5px", borderRadius: 3,
                                            background: C.slate100, color: C.slate600,
                                            fontSize: 9, fontWeight: 600,
                                            textTransform: "uppercase", letterSpacing: "0.04em",
                                        }}>C</span>
                                    )}
                                </div>
                                <Chip variant={isShortage ? "amber" : "violet"}>
                                    {isShortage ? "Kurang" : "Lebih"}
                                </Chip>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                                <div>
                                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 2 }}>
                                        Warehouse
                                    </div>
                                    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                                        {item.warehouseRecorded}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 2 }}>
                                        Lo Hitung
                                    </div>
                                    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                                        {item.driverCounted}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 2 }}>
                                        Selisih
                                    </div>
                                    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: isShortage ? C.amber700 : C.violet700 }}>
                                        {item.delta > 0 ? "+" : ""}{item.delta}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Mandatory note */}
                <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                        Penjelasan Driver
                        <span style={{ color: C.amber700, marginLeft: 6, fontWeight: 500 }}>(wajib · minimal 10 karakter)</span>
                    </div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Apa yang lo lihat saat hitung? Apakah ada kondisi yang tidak biasa di vehicle?"
                        style={{
                            width: "100%",
                            minHeight: 100,
                            padding: "12px",
                            border: `1px solid ${C.border}`,
                            borderRadius: 8,
                            fontSize: 14,
                            fontFamily: "inherit",
                            resize: "vertical",
                            background: C.surface,
                        }}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: note.length >= 10 ? C.emerald700 : C.textDim }}>
                        {note.length} / minimum 10 karakter
                    </div>
                </div>

                {/* Mandatory photo */}
                <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                        Foto Bukti
                        <span style={{ color: C.amber700, marginLeft: 6, fontWeight: 500 }}>(wajib)</span>
                    </div>
                    <button
                        onClick={() => setHasPhoto(!hasPhoto)}
                        className="tap-feedback"
                        style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "13px", borderRadius: 8, cursor: "pointer",
                            background: hasPhoto ? C.emerald50 : C.surface,
                            border: `1px solid ${hasPhoto ? C.emerald500 + "66" : C.borderStrong}`,
                            color: hasPhoto ? C.emerald700 : C.text, fontSize: 14, fontWeight: 600,
                        }}
                    >
                        <span style={{ fontSize: 16 }}>{hasPhoto ? "✓" : "📷"}</span>
                        <span>{hasPhoto ? "Foto bukti · 1 terlampir" : "Ambil / Lampirkan Foto"}</span>
                    </button>
                    <div style={{ marginTop: 6, fontSize: 11, color: C.textDim }}>
                        Foto kondisi muatan aktual — jadi bukti buat Supervisor.
                    </div>
                </div>

                {/* Doctrine reminder — boleh lanjut */}
                <div style={{
                    marginTop: 16,
                    background: C.infoBlueBg,
                    border: `1px solid ${C.infoBlue}22`,
                    borderLeft: `3px solid ${C.infoBlue}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    fontSize: 11,
                    color: C.text,
                    lineHeight: 1.6,
                }}>
                    Setelah lapor: selisih dikirim ke <strong>Supervisor</strong> buat di-resolve. <strong>Lo tetap bisa jalan</strong> — custody-nya pakai jumlah aktual yang lo hitung. <em>Discrepancy ≠ Lost.</em> Supervisor bisa kontak kalau perlu klarifikasi.
                </div>
            </div>

            {/* Action bar */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "12px 14px",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}>
                <button
                    onClick={() => canSubmit && onSubmit(mismatches, note)}
                    disabled={!canSubmit}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: !canSubmit ? C.slate200 : C.amber400,
                        color: !canSubmit ? C.textDim : "#fff",
                        border: "none",
                        padding: "16px",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    Lapor Selisih & Lanjut Kerja →
                </button>
                {!canSubmit && (
                    <div style={{ textAlign: "center", fontSize: 11, color: C.textDim }}>
                        Isi alasan (min 10 karakter) + lampirkan foto dulu
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 3B-after: MISMATCH SUBMITTED
// ═══════════════════════════════════════════════════════════════════════════
export const MismatchSubmittedScreen = ({ custody, onDone }) => {
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                padding: "14px 16px",
                flexShrink: 0,
            }}>
                <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                    Selisih Dilaporkan
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {custody.vehiclePlate}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 100px" }} className="scroll-thin">
                <div style={{
                    background: C.emerald50,
                    border: `1px solid ${C.emerald100}`,
                    borderRadius: 12,
                    padding: "24px 20px",
                    marginBottom: 20,
                    textAlign: "center",
                }} className="slide-up">
                    <div style={{
                        width: 64, height: 64,
                        borderRadius: "50%",
                        background: C.emerald500,
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 32,
                        fontWeight: 700,
                        marginBottom: 14,
                    }}>✓</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.emerald700, marginBottom: 4 }}>
                        Siap Berangkat — dengan Catatan Selisih
                    </div>
                    <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                        Custody dikonfirmasi pakai <strong>jumlah aktual yang lo hitung</strong>. Selisih + foto udah dikirim ke Supervisor.
                    </div>
                </div>

                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 16,
                }}>
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
                        Apa yang terjadi sekarang
                    </div>
                    <ol style={{ fontSize: 13, color: C.text, lineHeight: 1.7, paddingLeft: 18, margin: 0 }}>
                        <li><strong>Lo lanjut kerja</strong> — task kebuka, jalan dengan muatan aktual</li>
                        <li>Selisih masuk antrian <strong>Supervisor</strong> buat di-resolve (paralel)</li>
                        <li>Supervisor bisa kontak lo / nahan vehicle kalau perlu</li>
                    </ol>
                </div>

                <div style={{
                    background: C.infoBlueBg,
                    border: `1px solid ${C.infoBlue}22`,
                    borderLeft: `3px solid ${C.infoBlue}`,
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: C.text,
                    lineHeight: 1.6,
                }}>
                    <strong>Discrepancy ≠ Lost.</strong> Selisih itu flag, bukan kesimpulan. Lo gak perlu "fix" — itu domain Supervisor. Tugas lo cuma report akurat & jalan.
                </div>
            </div>

            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "12px 14px",
                flexShrink: 0,
            }}>
                <button
                    onClick={onDone}
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
                    Lanjut · Mulai Kerja →
                </button>
            </div>
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════════════════
// HOME LAYER — landing setelah login (custody-gate · cargo · rute · return)
// ═══════════════════════════════════════════════════════════════════════════
const isGas = (it) => it.name.toLowerCase().includes("gas");
const isGalon = (it) => it.name.toLowerCase().includes("galon");

const deriveLoaded = (tasks) => {
    let t = 0, g = 0;
    tasks.forEach(tk => tk.items.forEach(it => { if (isGas(it)) t += it.planDrop; else if (isGalon(it)) g += it.planDrop; }));
    return { tabung: t, galon: g };
};
// Baseline custody dari hitungan aktual driver (kalau ada selisih, ini yang dipakai — bukan manifest gudang)
const deriveLoadedFromCounts = (counts) => ({
    tabung: (counts.gas_12 || 0) + (counts.gas_3 || 0),
    galon: (counts.aqua_galon || 0),
});
const deriveCargo = (tasks, loadedOverride) => {
    let loadT = 0, loadG = 0, dropT = 0, dropG = 0, pickT = 0, pickG = 0;
    tasks.forEach(tk => tk.items.forEach(it => {
        if (isGas(it)) { loadT += it.planDrop; dropT += (it.actualDrop || 0); pickT += (it.actualPickup || 0); }
        else if (isGalon(it)) { loadG += it.planDrop; dropG += (it.actualDrop || 0); pickG += (it.actualPickup || 0); }
    }));
    // Pakai baseline aktual (hasil hitung custody) kalau dikasih — biar surplus/shortage keliatan
    if (loadedOverride) { loadT = loadedOverride.tabung; loadG = loadedOverride.galon; }
    return { tabungIsi: loadT - dropT, tabungKosong: pickT, galonIsi: loadG - dropG, galonKosong: pickG };
};
const taskItemsLabel = (t) => {
    const drop = t.items.reduce((s, i) => s + i.planDrop, 0);
    const pick = t.items.reduce((s, i) => s + i.planPickup, 0);
    const p = [];
    if (drop) p.push(`kirim ${drop}`);
    if (pick) p.push(`ambil ${pick}`);
    return p.join(" · ") || "—";
};

const HomeHeaderStrip = ({ driver, vehicle, onLogout }) => (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{
                width: 42, height: 42, borderRadius: 11, background: C.driverAccent, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0,
            }}>{driver.name.split(" ").map(n => n[0]).join("").substring(0, 2)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{driver.name}</div>
                {vehicle ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: C.driverAccentDark }}>{vehicle.plate}</span>
                        <span style={{ fontSize: 11, color: C.textDim }}>· kendaraan ditugaskan</span>
                    </div>
                ) : (
                    <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>Belum ditugaskan kendaraan</div>
                )}
            </div>
            <button onClick={onLogout} title="Keluar (handover)" className="tap-feedback" style={{
                display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 11px", borderRadius: 8,
                background: C.surface, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600,
                color: C.driverAccent, cursor: "pointer",
            }}>⏻ Keluar</button>
        </div>
    </div>
);

const HomeCustodyCard = ({ status, loaded, onConfirm }) => {
    if (status === "confirmed" || status === "confirmed_selisih") {
        const selisih = status === "confirmed_selisih";
        return (
            <div className="pop" style={{
                background: C.surface, border: `1px solid ${selisih ? C.amber400 : C.emerald100}`, borderRadius: 12,
                overflow: "hidden", marginBottom: 14,
            }}>
                <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: selisih ? C.surface : C.emerald50, padding: "12px 14px",
                }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: "50%", background: C.emerald500, color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0,
                    }}>✓</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.emerald700 }}>Muatan dikonfirmasi</div>
                        <div style={{ fontSize: 11, color: C.textMid }}>{loaded.tabung} tabung · {loaded.galon} galon · jumlah aktual</div>
                    </div>
                </div>
                {selisih && (
                    <div style={{ background: C.amber50, borderTop: `1px solid ${C.amber100}`, padding: "9px 14px", fontSize: 11, color: C.amber700, lineHeight: 1.5 }}>
                        <strong>! Ada selisih dari catatan gudang</strong> — udah dilaporkan, Supervisor lagi review. Kerjaan tetap jalan.
                    </div>
                )}
            </div>
        );
    }
    return (
        <div className="slide-up" style={{
            background: C.surface, border: `1px solid ${C.amber400}`, borderRadius: 14, overflow: "hidden", marginBottom: 14,
            boxShadow: "0 2px 8px rgba(245,158,11,0.12)",
        }}>
            <div style={{ background: C.amber50, borderBottom: `1px solid ${C.amber100}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <Chip variant="amber">⬤ Perlu Aksi</Chip>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.amber700 }}>Konfirmasi Penerimaan Muatan</span>
            </div>
            <div style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 12, color: C.textMid, marginBottom: 10 }}>
                    Muat dari <strong style={{ color: C.text }}>Gudang Pusat</strong>. Cek & konfirmasi sebelum berangkat.
                </div>
                <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                    {[["Tabung Gas", loaded.tabung], ["Galon Air", loaded.galon]].map(([name, qty], i) => (
                        <div key={name} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "5px 0", borderTop: i > 0 ? `1px solid ${C.border}` : "none",
                        }}>
                            <span style={{ fontSize: 13, color: C.text }}>{name}</span>
                            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{qty}</span>
                        </div>
                    ))}
                </div>
                <button onClick={onConfirm} className="tap-feedback" style={{
                    width: "100%", background: C.driverAccent, color: "#fff", border: "none",
                    padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>Konfirmasi Penerimaan →</button>
                <div style={{ textAlign: "center", fontSize: 10, color: C.textDim, marginTop: 7 }}>
                    membuka layar Konfirmasi Penerimaan (hitung mandiri)
                </div>
            </div>
        </div>
    );
};

const HomeCargoCard = ({ cargo }) => {
    const Cell = ({ label, isi, kosong }) => (
        <div style={{ flex: 1, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, marginBottom: 6 }}>{label}</div>
            <div style={{ display: "flex", gap: 14 }}>
                <div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1 }}>{isi}</div>
                    <div style={{ fontSize: 10, color: C.emerald700, marginTop: 3 }}>isi</div>
                </div>
                <div>
                    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: kosong > 0 ? C.amber700 : C.textDim, lineHeight: 1 }}>{kosong}</div>
                    <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>kosong</div>
                </div>
            </div>
        </div>
    );
    return (
        <div className="slide-up" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
            <div style={{ padding: "10px 14px 0", display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}>📦</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Isi Kendaraan Sekarang</span>
            </div>
            <div style={{ display: "flex", padding: "4px 2px 8px" }}>
                <Cell label="Tabung" isi={cargo.tabungIsi} kosong={cargo.tabungKosong} />
                <div style={{ width: 1, background: C.border, margin: "8px 0" }} />
                <Cell label="Galon" isi={cargo.galonIsi} kosong={cargo.galonKosong} />
            </div>
            <div style={{ padding: "0 14px 10px", fontSize: 10, color: C.textDim }}>
                Update otomatis tiap serah-terima (kirim isi, ambil kosong).
            </div>
        </div>
    );
};

const HomeRouteCard = ({ tasks, locked, onOpenFeed }) => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.state === "completed").length;
    const failed = tasks.filter(t => t.state === "failed").length;
    const closed = completed + failed;
    const pct = total ? Math.round((closed / total) * 100) : 0;
    const next = tasks.find(t => t.state === "assigned");

    if (locked) {
        return (
            <div style={{ background: C.surface, border: `1px solid ${C.borderStrong}`, borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9, background: C.slate100, color: C.textDim,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                    }}>🔒</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.textMid }}>Rute Hari Ini</div>
                        <div style={{ fontSize: 12, color: C.textDim }}>{total} tujuan</div>
                    </div>
                </div>
                <div style={{ background: C.amber50, padding: "8px 14px", fontSize: 11, color: C.amber700, fontWeight: 600 }}>
                    Konfirmasi muatan dulu buat mulai — ini tujuan lo hari ini:
                </div>
                <div style={{ padding: "6px 8px 8px" }}>
                    {tasks.map((t) => (
                        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 8px", opacity: 0.85 }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: C.slate100, color: C.textMid,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                            }}>{t.stopNumber}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{t.customer}</div>
                                <div style={{ fontSize: 11, color: C.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.address} · {taskItemsLabel(t)}</div>
                            </div>
                            {t.state === "completed" && <Chip variant="emerald">Selesai</Chip>}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="pop" style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 14, overflow: "hidden",
        }}>
            {/* header + progress */}
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 9, background: C.driverAccentBg, color: C.driverAccent,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                    }}>🚚</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Rute Hari Ini</div>
                        <div style={{ fontSize: 12, color: C.textMid }}>
                            {closed} dari {total} stop · {next ? `lanjut: ${next.customer}` : "semua kelar 🎉"}
                        </div>
                    </div>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: closed === total ? C.emerald700 : C.driverAccent }}>{pct}%</span>
                </div>
                <div style={{ height: 7, background: C.slate100, borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: closed === total ? C.emerald500 : C.driverAccent, transition: "width 0.3s ease" }} />
                </div>
            </div>

            {/* detail list — tappable buka tasklist */}
            <div style={{ padding: "6px 8px 4px" }}>
                {tasks.map((t) => {
                    const isNext = next && t.id === next.id;
                    const dotBg = t.state === "completed" ? C.emerald500 : t.state === "failed" ? C.amber400 : isNext ? C.driverAccent : C.slate100;
                    const dotFg = t.state === "completed" || t.state === "failed" || isNext ? "#fff" : C.textMid;
                    return (
                        <button key={t.id} onClick={onOpenFeed} className="tap-feedback" style={{
                            width: "100%", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 8px", borderRadius: 10, background: isNext ? C.driverAccentBg : "transparent", border: "none",
                        }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: dotBg, color: dotFg,
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                            }}>{t.state === "completed" ? "✓" : t.stopNumber}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: t.state === "completed" ? C.textDim : C.text, textDecoration: t.state === "completed" ? "line-through" : "none" }}>{t.customer}</div>
                                <div style={{ fontSize: 11, color: C.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.address} · {taskItemsLabel(t)}</div>
                            </div>
                            {t.state === "completed" && <Chip variant="emerald">Selesai</Chip>}
                            {t.state === "failed" && <Chip variant="amber">Gagal</Chip>}
                            {t.state === "assigned" && <Chip variant={isNext ? "indigo" : "neutral"}>{isNext ? "Lanjut" : "Kirim"}</Chip>}
                        </button>
                    );
                })}
            </div>

            <button onClick={onOpenFeed} className="tap-feedback" style={{
                width: "100%", background: C.surfaceAlt, border: "none", borderTop: `1px solid ${C.border}`,
                padding: "11px", fontSize: 12, fontWeight: 700, color: C.driverAccent, cursor: "pointer",
            }}>Buka Tasklist (eksekusi) →</button>
        </div>
    );
};

const HomeReturnCard = ({ ready, onReturn }) => (
    <button onClick={onReturn} className="tap-feedback slide-up" style={{
        width: "100%", textAlign: "left", cursor: "pointer",
        background: ready ? C.amber50 : C.surface, border: `1px solid ${ready ? C.amber400 : C.border}`,
        borderRadius: 14, padding: "14px", marginBottom: 14,
    }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
                width: 36, height: 36, borderRadius: 9, background: ready ? C.amber100 : C.slate100, color: ready ? C.amber700 : C.textMid,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            }}>🏭</div>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: ready ? C.amber700 : C.text }}>Return Kendaraan</div>
                <div style={{ fontSize: 12, color: ready ? C.amber700 : C.textDim }}>
                    {ready ? "Semua kelar — balik & serahkan ke gudang" : "Balik & serahkan kendaraan + sisa muatan ke gudang"}
                </div>
            </div>
            <span style={{ fontSize: 20, color: ready ? C.amber700 : C.textDim }}>›</span>
        </div>
    </button>
);

const HomeBottomBar = () => (
    <div style={{ display: "flex", background: C.surface, borderTop: `1px solid ${C.border}`, paddingBottom: 4, flexShrink: 0 }}>
        <button className="tap-feedback" style={{
            flex: 1, background: "transparent", border: "none", cursor: "pointer",
            padding: "9px 0 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        }}>
            <span style={{ fontSize: 19 }}>🏠</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: C.driverAccent }}>Home</span>
        </button>
        <button style={{
            flex: 1, background: "transparent", border: "none", cursor: "default",
            padding: "9px 0 7px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            position: "relative", opacity: 0.45,
        }}>
            <span style={{ fontSize: 19, filter: "grayscale(1)", opacity: 0.55 }}>🔔</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: C.textDim }}>Notifikasi</span>
            <span style={{
                position: "absolute", top: 5, right: "calc(50% - 20px)", fontSize: 8, fontWeight: 700,
                color: C.textDim, background: C.slate100, padding: "1px 5px", borderRadius: 100,
            }}>segera</span>
        </button>
    </div>
);

export const HomeView = ({ tasks, custodyStatus, custodyCounts, onConfirmCustody, onOpenFeed, onLogout, onReturn }) => {
    const total = tasks.length;
    const closed = tasks.filter(t => t.state === "completed" || t.state === "failed").length;
    const confirmed = custodyStatus === "confirmed" || custodyStatus === "confirmed_selisih";
    // Baseline = jumlah aktual yang dikonfirmasi driver (kalau ada); kalau belum, manifest gudang
    const loaded = (confirmed && custodyCounts) ? deriveLoadedFromCounts(custodyCounts) : deriveLoaded(tasks);
    const cargo = deriveCargo(tasks, (confirmed && custodyCounts) ? loaded : null);
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <HomeHeaderStrip driver={DRIVER} vehicle={VEHICLE} onLogout={onLogout} />
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px" }} className="scroll-thin">
                <div style={{ fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 10 }}>
                    {confirmed ? "Hari Ini" : "Sebelum Berangkat"}
                </div>
                <HomeCustodyCard status={custodyStatus} loaded={loaded} onConfirm={onConfirmCustody} />
                {confirmed && <HomeCargoCard cargo={cargo} />}
                <HomeRouteCard tasks={tasks} locked={!confirmed} onOpenFeed={onOpenFeed} />
                {confirmed && <HomeReturnCard ready={closed >= total} onReturn={onReturn} />}
            </div>
            <HomeBottomBar />
        </div>
    );
};

// ─── RETURN SCREEN (ringkas) ────────────────────────────────────────────────
export const ReturnScreen = ({ tasks, onBack, onConfirm }) => {
    const cargo = deriveCargo(tasks);
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={onBack} className="tap-feedback" style={{
                    width: 34, height: 34, borderRadius: 8, background: "transparent", border: "none",
                    fontSize: 18, color: C.text, cursor: "pointer",
                }}>←</button>
                <div>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Akhir Hari</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Return Kendaraan</div>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }} className="scroll-thin">
                <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5, marginBottom: 14 }}>
                    Serahkan kendaraan <strong style={{ color: C.text }}>{VEHICLE.plate}</strong> + sisa muatan ke gudang. Gudang yang hitung & validasi (reconciliation = domain Vehicle Runtime).
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.text }}>Sisa di Kendaraan</div>
                    {[["Tabung isi", cargo.tabungIsi], ["Tabung kosong", cargo.tabungKosong], ["Galon isi", cargo.galonIsi], ["Galon kosong", cargo.galonKosong]].map(([k, v], i) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", borderTop: i > 0 ? `1px solid ${C.border}` : "none" }}>
                            <span style={{ fontSize: 13, color: C.textMid }}>{k}</span>
                            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{v}</span>
                        </div>
                    ))}
                </div>
                <div style={{
                    background: C.infoBlueBg, border: `1px solid ${C.infoBlue}22`, borderLeft: `3px solid ${C.infoBlue}`,
                    borderRadius: 10, padding: "11px 14px", fontSize: 12, color: C.text, lineHeight: 1.5,
                }}>
                    Setelah gudang konfirmasi return, sesi lo otomatis ketutup (logout terminal).
                </div>
            </div>
            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "12px 14px", flexShrink: 0 }}>
                <button onClick={onConfirm} className="tap-feedback" style={{
                    width: "100%", background: C.driverAccent, color: "#fff", border: "none",
                    padding: "16px", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer",
                }}>Serahkan ke Gudang →</button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Full Driver Runtime (login → home → tasklist → return)
// ═══════════════════════════════════════════════════════════════════════════
export default function DriverRuntimeFull() {
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [screen, setScreen] = useState("home");      // home | feed | workspace | return
    const [session, setSession] = useState(null);     // executor aktif (null = belum login)
    const [authStep, setAuthStep] = useState("scan");  // scan | pin (saat belum ada sesi)
    const [custodyStatus, setCustodyStatus] = useState("pending");  // pending | confirmed | mismatch — gate tasklist
    const [custodyCounts, setCustodyCounts] = useState(null);       // hasil hitung independen
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [recentlyCompletedId, setRecentlyCompletedId] = useState(null);
    const [paused, setPaused] = useState(false);              // trip di-pause (executor keluar di tengah)
    const [showPauseConfirm, setShowPauseConfirm] = useState(false);
    const [deviceOwner, setDeviceOwner] = useState(DEVICE_OWNER);  // pemilik sesi di HP ini (null = device kosong)

    const pendingCount = tasks.filter(t => t.state === "assigned").length;
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

    // Keluar sesi. Kalau masih ada task pending = PAUSE (perlu konfirmasi, trip tetap idup).
    // Kalau semua kelar = END bersih.
    const requestExit = () => {
        if (pendingCount > 0) setShowPauseConfirm(true);
        else endSession();
    };

    const confirmPause = () => {
        // PAUSE: tutup sesi + wipe lokal (di-simulasi), TAPI tasks dipertahankan (state di server).
        setShowPauseConfirm(false);
        setPaused(true);
        setSession(null);
        setAuthStep("scan");
        setActiveTaskId(null);
        setScreen("home");
    };

    const endSession = () => {
        // END: sesi tutup, balik ke gate bersih (bukan paused).
        setPaused(false);
        setSession(null);
        setAuthStep("scan");
        setActiveTaskId(null);
        setScreen("home");
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
                        Driver Runtime · Full Flow
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                        Scan → Home → Custody → Tasklist → Return
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
                        {/* DEVICE FRONT — HP udah ada sesi pemilik: handover dulu */}
                        {!session && deviceOwner && (
                            <DeviceOwnerScreen
                                owner={deviceOwner}
                                onHandover={() => { setDeviceOwner(null); setAuthStep("scan"); setPaused(false); }}
                            />
                        )}

                        {/* AUTH GATE — device kosong: scan + PIN (runtime hard-block sampai sesi kebuka) */}
                        {!session && !deviceOwner && authStep === "scan" && (
                            <ScanScreen
                                onScanned={() => setAuthStep("pin")}
                                resuming={paused}
                                executorName={DRIVER.name}
                                remaining={pendingCount}
                            />
                        )}
                        {!session && !deviceOwner && authStep === "pin" && (
                            <PinScreen
                                executor={DRIVER}
                                resuming={paused}
                                onBack={() => setAuthStep("scan")}
                                onSuccess={() => { setSession(DRIVER); setPaused(false); }}
                            />
                        )}

                        {/* RUNTIME — hanya setelah sesi kebuka */}
                        {session && screen === "home" && (
                            <HomeView
                                tasks={tasks}
                                custodyStatus={custodyStatus}
                                custodyCounts={custodyCounts}
                                onConfirmCustody={() => setScreen("custody_notif")}
                                onOpenFeed={() => setScreen("feed")}
                                onLogout={requestExit}
                                onReturn={() => setScreen("return")}
                            />
                        )}

                        {/* CUSTODY CONFIRMATION sub-flow */}
                        {session && screen === "custody_notif" && (
                            <CustodyNotificationScreen
                                custody={PENDING_CUSTODY}
                                onStartConfirmation={() => setScreen("custody_count")}
                                onBack={() => setScreen("home")}
                            />
                        )}
                        {session && screen === "custody_count" && (
                            <IndependentCountWorkspace
                                custody={PENDING_CUSTODY}
                                onBack={() => setScreen("custody_notif")}
                                onContinue={(counts, outcome) => {
                                    setCustodyCounts(counts);
                                    setScreen(outcome === "confirm" ? "custody_success" : "custody_mismatch_report");
                                }}
                            />
                        )}
                        {session && screen === "custody_success" && custodyCounts && (
                            <ConfirmationSuccessScreen
                                custody={PENDING_CUSTODY}
                                counts={custodyCounts}
                                onProceed={() => { setCustodyStatus("confirmed"); setScreen("home"); }}
                            />
                        )}
                        {session && screen === "custody_mismatch_report" && custodyCounts && (
                            <MismatchReportScreen
                                custody={PENDING_CUSTODY}
                                counts={custodyCounts}
                                onBack={() => setScreen("custody_count")}
                                onSubmit={() => setScreen("custody_mismatch_submitted")}
                            />
                        )}
                        {session && screen === "custody_mismatch_submitted" && (
                            <MismatchSubmittedScreen
                                custody={PENDING_CUSTODY}
                                onDone={() => { setCustodyStatus("confirmed_selisih"); setScreen("home"); }}
                            />
                        )}

                        {session && screen === "feed" && (
                            <TaskFeedScreen
                                tasks={tasks}
                                onSelectTask={handleSelectTask}
                                recentlyCompletedId={recentlyCompletedId}
                                onBack={() => setScreen("home")}
                            />
                        )}
                        {session && screen === "workspace" && activeTask && (
                            <DeliveryExecutionWorkspace
                                task={activeTask}
                                onBack={handleBack}
                                onSubmit={handleSubmitTask}
                            />
                        )}
                        {session && screen === "return" && (
                            <ReturnScreen
                                tasks={tasks}
                                onBack={() => setScreen("home")}
                                onConfirm={endSession}
                            />
                        )}

                        {/* PAUSE confirmation — keluar di tengah trip */}
                        {showPauseConfirm && (
                            <PauseConfirmSheet
                                remaining={pendingCount}
                                onConfirm={confirmPause}
                                onCancel={() => setShowPauseConfirm(false)}
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
                            setScreen("home");
                            setRecentlyCompletedId(null);
                            setSession(null);
                            setAuthStep("scan");
                            setCustodyStatus("pending");
                            setCustodyCounts(null);
                            setPaused(false);
                            setShowPauseConfirm(false);
                            setDeviceOwner(DEVICE_OWNER);
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