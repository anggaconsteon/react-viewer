import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTEON — VEHICLE RUNTIME · MOBILE
// ═══════════════════════════════════════════════════════════════════════════
// Identity: Reconciliation & Custody Validation Layer
// Mental model: "Does what I can physically count match what the system expects?"
// Context: Checker standing next to vehicle, one-handed, industrial loading bay
// Doctrine: Validation != Resolution · Discrepancy != Lost
// Executor model: vehicle arrives WITHOUT a predetermined driver (admin anchors
//   to vehicle only). Checker designates/changes the executor (receiving custodian)
//   at opening check — within the Vehicle Runtime custody domain. Designation is
//   surfaced to Admin (visibility). Binding to the custody chain happens when the
//   executor confirms receipt (Driver Runtime, hard block before departure).
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

    // Amber = max operational urgency
    amber50: "#fffbeb",
    amber100: "#fef3c7",
    amber400: "#f59e0b",
    amber500: "#d97706",
    amber700: "#b45309",

    // Vehicle accent — teal (precise, verification-focused)
    vehicleAccent: "#0d9488",
    vehicleAccentBg: "#f0fdfa",
    vehicleAccentDark: "#0f766e",

    // Match = emerald
    emerald50: "#ecfdf5",
    emerald100: "#d1fae5",
    emerald400: "#34d399",
    emerald500: "#10b981",
    emerald700: "#047857",

    // Surplus = violet (also discrepancy)
    violet50: "#f5f3ff",
    violet400: "#a78bfa",
    violet700: "#6d28d9",

    // Info (replay)
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

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
// Items have `type`: "returnable" or "consumable"
// Returnable: tracked through pickup lifecycle (outstanding at customer)
// Consumable: pure delivery, no pickup, no outstanding — but still counted on vehicle
export const VEHICLES = [
    {
        id: "V-007",
        plate: "B 1234 XY",
        executor: "Budi Santoso",    // sudah ditentukan sebelumnya
        state: "returning",            // Tier 1: awaiting closing check
        arrivedAt: "14:42",
        expectedSummary: "3 returnable · 1 consumable",
        items: [
            { id: "gas_12", name: "Gas 12kg", type: "returnable", expected: 12 },
            { id: "gas_3", name: "Gas 3kg", type: "returnable", expected: 8 },
            { id: "aqua_galon", name: "Aqua Galon", type: "returnable", expected: 4 },
            { id: "aqua_600", name: "Aqua 600ml (Dus)", type: "consumable", expected: 5 },
        ],
        // Load origin metadata — diturunkan dari aggregate tasks
        // PER-CUSTOMER QUANTITIES SENGAJA TIDAK DI-EXPOSE — itu domain Driver Runtime
        loadOrigin: {
            taskCount: 4,
            routeStops: 6,
            tasks: [
                { id: "T-044", customer: "Honda Tebet" },
                { id: "T-045", customer: "BCA Sudirman" },
                { id: "T-046", customer: "Mandiri Pusat" },
                { id: "T-047", customer: "Honda Cipete" },
            ],
        },
    },
    {
        id: "V-005",
        plate: "B 5678 AB",
        executor: "Andi Wijaya",
        state: "custody_pending",      // Tier 1: driver awaiting receipt confirmation
        arrivedAt: "14:55",
        expectedSummary: "2 returnable",
        items: [
            { id: "aqua_galon", name: "Aqua Galon", type: "returnable", expected: 6 },
            { id: "pristine_galon", name: "Pristine Galon", type: "returnable", expected: 3 },
        ],
    },
    {
        id: "V-003",
        plate: "B 9012 CD",
        executor: null,              // loading: pengemudi BELUM ditentukan (checker tentuin di gudang)
        state: "loading",              // Tier 2: opening check needed
        expectedSummary: "Planned load: 3 returnable · 1 consumable",
        items: [
            { id: "gas_12", name: "Gas 12kg", type: "returnable", expected: 10 },
            { id: "gas_3", name: "Gas 3kg", type: "returnable", expected: 6 },
            { id: "aqua_galon", name: "Aqua Galon", type: "returnable", expected: 8 },
            { id: "aqua_600", name: "Aqua 600ml (Dus)", type: "consumable", expected: 4 },
        ],
        loadOrigin: {
            taskCount: 3,
            routeStops: 5,
            tasks: [
                { id: "T-050", customer: "Mandiri Tower" },
                { id: "T-051", customer: "Honda Bintaro" },
                { id: "T-052", customer: "BCA Cabang Bintaro" },
            ],
        },
    },
    {
        id: "V-008",
        plate: "B 3344 EF",
        executor: "Joko Pratama",
        state: "in_route",             // Tier 3
        routeStop: "3 / 6",
        expectedSummary: "Mid-route · Stop 3/6",
    },
    {
        id: "V-002",
        plate: "B 5566 GH",
        executor: "Sigit Mulyono",
        state: "completed",            // Tier 5
        completedAt: "13:20",
        expectedSummary: "Clean validation",
    },
];

export const CHECKER = { name: "Anton Pratama", station: "Loading Bay 1" };

// Pool kandidat pengemudi yang bisa dipilih checker di gudang.
// Bukan cuma driver tetap — termasuk opsi ad-hoc (admin/orang gudang) untuk
// realita hari-H (driver ga masuk, digantikan siapa pun yang available).
export const EXECUTORS = [
    { id: "DRV-001", name: "Budi Santoso", role: "Driver", detail: "Driver tetap" },
    { id: "DRV-002", name: "Andi Wijaya", role: "Driver", detail: "Driver tetap" },
    { id: "DRV-004", name: "Sigit Mulyono", role: "Driver", detail: "Driver tetap" },
    { id: "STF-010", name: "Rahmat (Gudang)", role: "Gudang", detail: "Staf gudang · ad-hoc" },
    { id: "ADM-001", name: "Dyah (Admin)", role: "Admin", detail: "Admin · ad-hoc" },
];

// ─── ATOMS ─────────────────────────────────────────────────────────────────
const Chip = ({ children, variant = "neutral" }) => {
    const variants = {
        neutral: { bg: C.slate100, fg: C.slate700 },
        amber: { bg: C.amber100, fg: C.amber700 },
        teal: { bg: C.vehicleAccentBg, fg: C.vehicleAccent },
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
        returning: { variant: "amber", label: "Closing Check" },
        custody_pending: { variant: "amber", label: "Custody Pending" },
        loading: { variant: "teal", label: "Opening Check" },
        in_route: { variant: "blue", label: "In Route" },
        completed: { variant: "emerald", label: "Selesai" },
    };
    const m = map[state];
    return <Chip variant={m.variant}>{m.label}</Chip>;
};

// ─── QUANTITY STEPPER (the central interaction) ────────────────────────────
const QuantityStepper = ({ value, onChange, expected, itemName, itemType }) => {
    const delta = value - expected;
    const hasValue = value > 0;
    const isMatch = hasValue && delta === 0;
    const isShortage = hasValue && delta < 0;
    const isSurplus = hasValue && delta > 0;
    const isConsumable = itemType === "consumable";

    const valueColor = !hasValue ? C.textDim
        : isMatch ? C.emerald700
            : isShortage ? C.amber700
                : C.violet700;

    return (
        <div style={{ marginBottom: 16 }}>
            {/* Item label + expected */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{itemName}</span>
                    {isConsumable && (
                        <span style={{
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: C.slate100,
                            color: C.slate600,
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                        }}>Consumable</span>
                    )}
                </div>
                <div style={{ fontSize: 12, color: C.textMid }}>
                    Ekspektasi: <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{expected}</span>
                </div>
            </div>

            {/* Stepper */}
            <div style={{
                display: "flex",
                alignItems: "stretch",
                background: C.surface,
                border: `2px solid ${isMatch ? C.emerald400 : isShortage ? C.amber400 : isSurplus ? C.violet400 : C.border}`,
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
                    background: isMatch ? C.emerald50 : isShortage ? C.amber50 : isSurplus ? C.violet50 : C.surface,
                    padding: "4px 0",
                }}>
                    <span className="mono" style={{
                        fontSize: 32, fontWeight: 700,
                        color: valueColor,
                        lineHeight: 1,
                    }}>{value}</span>
                    {hasValue && delta !== 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: valueColor,
                            marginTop: 2,
                            letterSpacing: "0.04em",
                        }}>
                            Selisih: {delta > 0 ? "+" : ""}{delta}
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

            {/* Variance bar (visual proportion) */}
            <div style={{
                marginTop: 8,
                height: 6,
                background: C.slate100,
                borderRadius: 3,
                overflow: "hidden",
                position: "relative",
            }}>
                <div style={{
                    height: "100%",
                    width: `${Math.min(100, (value / Math.max(expected, 1)) * 100)}%`,
                    background: isMatch ? C.emerald400 : isShortage ? C.amber400 : isSurplus ? C.violet400 : C.slate300,
                    transition: "width 0.2s ease, background 0.2s ease",
                }} />
                {/* Expected marker */}
                <div style={{
                    position: "absolute",
                    left: `${(expected / Math.max(value + 5, expected + 2)) * 100}%`,
                    top: -2,
                    width: 2,
                    height: 10,
                    background: C.slate600,
                }} />
            </div>
        </div>
    );
};

// ─── LOAD ORIGIN CARD (provenance of expected load) ────────────────────────
// Shows WHERE expected quantities came from — at aggregate level only.
// Per-customer quantities are NOT exposed — that's Driver Runtime domain.
const LoadOriginCard = ({ loadOrigin, executor }) => {
    const [expanded, setExpanded] = useState(false);

    if (!loadOrigin) return null;

    return (
        <div style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            marginBottom: 16,
            overflow: "hidden",
        }}>
            {/* Collapsed header — always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
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
                <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: C.vehicleAccentBg,
                    color: C.vehicleAccent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                }}>🚚</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 2 }}>
                        Load Origin
                    </div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                        Diturunkan dari {loadOrigin.taskCount} task hari ini
                    </div>
                    <div style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>
                        {loadOrigin.routeStops} stops · {executor || "Pengemudi belum ditentukan"}
                    </div>
                </div>

                <span style={{
                    color: C.textDim,
                    fontSize: 12,
                    transform: expanded ? "rotate(90deg)" : "none",
                    transition: "transform 0.15s ease",
                    flexShrink: 0,
                }}>›</span>
            </button>

            {/* Expanded — task list, no quantities */}
            {expanded && (
                <div className="slide-up" style={{
                    borderTop: `1px solid ${C.border}`,
                    padding: "10px 14px 12px",
                    background: C.surfaceAlt,
                }}>
                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
                        Task dalam load ini
                    </div>
                    {loadOrigin.tasks.map((task, i) => (
                        <div key={task.id} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 0",
                            borderBottom: i === loadOrigin.tasks.length - 1 ? "none" : `1px solid ${C.border}`,
                            fontSize: 13,
                        }}>
                            <span className="mono" style={{ fontSize: 11, color: C.textMid, fontWeight: 500, minWidth: 56 }}>
                                {task.id}
                            </span>
                            <span style={{ color: C.text, flex: 1 }}>{task.customer}</span>
                        </div>
                    ))}

                    <div style={{
                        marginTop: 10,
                        padding: "8px 10px",
                        background: C.slate50,
                        borderRadius: 6,
                        fontSize: 11,
                        color: C.textMid,
                        lineHeight: 1.5,
                        fontStyle: "italic",
                    }}>
                        Per-customer quantity dan stop detail tersedia di Driver Runtime — bukan domain pengecekan kendaraan.
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── EXECUTOR CARD (who takes custody of this load) ────────────────────────
// Checker designates/changes the receiving custodian here. Empty by default —
// admin only anchored the vehicle. Designation surfaces to Admin (visibility);
// binding to the custody chain happens at custody acceptance (Driver Runtime).
const ExecutorCard = ({ executor, onChange }) => {
    const isSet = !!executor;
    return (
        <div style={{
            background: isSet ? C.surface : C.amber50,
            border: `1px solid ${isSet ? C.border : C.amber100}`,
            borderLeft: `3px solid ${isSet ? C.vehicleAccent : C.amber400}`,
            borderRadius: 10,
            marginBottom: 16,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: isSet ? C.vehicleAccentBg : C.amber100,
                color: isSet ? C.vehicleAccent : C.amber700,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
            }}>{isSet ? "🧑‍✈️" : "?"}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 2 }}>
                    Pengemudi
                </div>
                {isSet ? (
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{executor}</div>
                ) : (
                    <div style={{ fontSize: 13, color: C.amber700, fontWeight: 500 }}>
                        Belum ditentukan — pilih sebelum berangkat
                    </div>
                )}
            </div>

            <button
                onClick={onChange}
                className="tap-feedback"
                style={{
                    background: isSet ? "transparent" : C.amber400,
                    color: isSet ? C.vehicleAccent : "#fff",
                    border: isSet ? `1px solid ${C.border}` : "none",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    flexShrink: 0,
                }}
            >{isSet ? "Ganti" : "Tentukan"}</button>
        </div>
    );
};

// ─── EXECUTOR PICKER SHEET ─────────────────────────────────────────────────
export const ExecutorPickerSheet = ({ current, onSelect, onCancel }) => (
    <>
        <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
        <div className="sheet-up" style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            background: C.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            zIndex: 11,
            maxHeight: "80%",
            display: "flex",
            flexDirection: "column",
        }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
            </div>
            <div style={{ padding: "12px 18px 8px" }}>
                <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 4 }}>
                    Tentukan Pengemudi
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Siapa yang ngantar?</div>
                <div style={{ fontSize: 12, color: C.textMid, marginTop: 4, lineHeight: 1.5 }}>
                    Pilih siapa pun yang available hari ini. Admin akan diberi tahu kalau berubah.
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 16px" }} className="scroll-thin">
                {EXECUTORS.map(p => {
                    const isCurrent = current === p.name;
                    const isAdhoc = p.role !== "Driver";
                    return (
                        <button
                            key={p.id}
                            onClick={() => onSelect(p.name)}
                            className="tap-feedback"
                            style={{
                                width: "100%",
                                background: isCurrent ? C.vehicleAccentBg : C.surface,
                                border: `1.5px solid ${isCurrent ? C.vehicleAccent : C.border}`,
                                borderRadius: 10,
                                padding: "12px 14px",
                                marginBottom: 8,
                                cursor: "pointer",
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: isCurrent ? C.vehicleAccent : C.slate100,
                                color: isCurrent ? "#fff" : C.textMid,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, fontWeight: 700, flexShrink: 0,
                            }}>
                                {p.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: C.textMid }}>{p.detail}</div>
                            </div>
                            {isAdhoc && <Chip variant="amber">Ad-hoc</Chip>}
                            {isCurrent && <span style={{ color: C.vehicleAccent, fontSize: 18, flexShrink: 0 }}>✓</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    </>
);

// ─── VEHICLE CARD ──────────────────────────────────────────────────────────
const VehicleCard = ({ vehicle, onTap }) => {
    const isTier1 = vehicle.state === "returning" || vehicle.state === "custody_pending";
    const isTier2 = vehicle.state === "loading";
    const isCompleted = vehicle.state === "completed";

    const borderLeft = isTier1 ? `3px solid ${C.amber400}`
        : isTier2 ? `3px solid ${C.vehicleAccent}`
            : "3px solid transparent";
    const bg = isTier1 ? C.amber50 : C.surface;
    const opacity = isCompleted ? 0.65 : 1;

    const stateAction = {
        returning: "Pengecekan Penutupan",
        custody_pending: "Konfirmasi Penerimaan",
        loading: "Pengecekan Pembukaan",
    }[vehicle.state];

    return (
        <div
            onClick={() => onTap && onTap(vehicle)}
            className="tap-feedback slide-up"
            style={{
                background: bg,
                opacity,
                border: `1px solid ${C.border}`,
                borderLeft,
                borderLeftWidth: 3,
                borderRadius: 10,
                padding: "14px 14px",
                marginBottom: 10,
                cursor: "pointer",
                transition: "transform 0.1s ease",
            }}
        >
            {/* Identity Layer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{vehicle.plate}</span>
                </div>
                <StateChip state={vehicle.state} />
            </div>

            {/* Summary Layer */}
            <div style={{ fontSize: 13, color: C.textMid, marginBottom: 8 }}>
                {vehicle.executor || "Pengemudi belum ditentukan"}
                {vehicle.arrivedAt && ` · tiba ${vehicle.arrivedAt}`}
                {vehicle.completedAt && ` · selesai ${vehicle.completedAt}`}
                {vehicle.routeStop && ` · stop ${vehicle.routeStop}`}
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginBottom: isTier1 || isTier2 ? 12 : 0 }}>
                {vehicle.expectedSummary}
            </div>

            {/* Action Layer */}
            {stateAction && (
                <button
                    onClick={(e) => { e.stopPropagation(); onTap && onTap(vehicle); }}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: isTier1 ? C.amber400 : C.vehicleAccent,
                        color: "#fff",
                        border: "none",
                        padding: "12px",
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "transform 0.1s ease",
                    }}
                >{stateAction}</button>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 1: VEHICLE FEED (HOME)
// ═══════════════════════════════════════════════════════════════════════════
export const VehicleFeedScreen = ({ vehicles, onSelectVehicle, onOpenMenu }) => {
    const tier1Count = vehicles.filter(v => v.state === "returning" || v.state === "custody_pending").length;
    const tier2Count = vehicles.filter(v => v.state === "loading").length;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>

            {/* Zone 1: Identity Header */}
            <div style={{
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                padding: "14px 16px 12px",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 7,
                            background: `linear-gradient(135deg, ${C.vehicleAccent}, ${C.vehicleAccentDark})`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontWeight: 700, fontSize: 14,
                        }}>C</div>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>
                                {CHECKER.name}
                            </div>
                            <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.2 }}>
                                {CHECKER.station} · Vehicle Runtime
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onOpenMenu}
                        style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: C.surface, border: `1px solid ${C.border}`,
                            fontSize: 16, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >☰</button>
                </div>

                {/* Daily snapshot */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <div style={{
                        flex: 1, padding: "8px 10px",
                        background: tier1Count > 0 ? C.amber50 : C.slate50,
                        border: `1px solid ${tier1Count > 0 ? C.amber100 : C.border}`,
                        borderRadius: 6,
                    }}>
                        <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                            Perlu Tindakan
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: tier1Count > 0 ? C.amber700 : C.text }}>
                            {tier1Count}
                        </div>
                    </div>
                    <div style={{
                        flex: 1, padding: "8px 10px",
                        background: C.slate50, border: `1px solid ${C.border}`,
                        borderRadius: 6,
                    }}>
                        <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                            Opening Check
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                            {tier2Count}
                        </div>
                    </div>
                    <div style={{
                        flex: 1, padding: "8px 10px",
                        background: C.slate50, border: `1px solid ${C.border}`,
                        borderRadius: 6,
                    }}>
                        <div style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                            Hari Ini
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                            {vehicles.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Zone 3: Feed */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 100px" }} className="scroll-thin">
                {/* Tier label */}
                {tier1Count > 0 && (
                    <div style={{ fontSize: 11, color: C.amber700, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8, paddingLeft: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.amber400 }} />
                        Perlu Tindakan
                    </div>
                )}
                {vehicles.filter(v => v.state === "returning" || v.state === "custody_pending").map(v => (
                    <VehicleCard key={v.id} vehicle={v} onTap={onSelectVehicle} />
                ))}

                {tier2Count > 0 && (
                    <div style={{ fontSize: 11, color: C.vehicleAccent, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginTop: 16, marginBottom: 8, paddingLeft: 4 }}>
                        Pengecekan Pembukaan
                    </div>
                )}
                {vehicles.filter(v => v.state === "loading").map(v => (
                    <VehicleCard key={v.id} vehicle={v} onTap={onSelectVehicle} />
                ))}

                {vehicles.some(v => v.state === "in_route") && (
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginTop: 16, marginBottom: 8, paddingLeft: 4 }}>
                        Dalam Perjalanan
                    </div>
                )}
                {vehicles.filter(v => v.state === "in_route").map(v => (
                    <VehicleCard key={v.id} vehicle={v} onTap={onSelectVehicle} />
                ))}

                {vehicles.some(v => v.state === "completed") && (
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginTop: 16, marginBottom: 8, paddingLeft: 4 }}>
                        Selesai Hari Ini
                    </div>
                )}
                {vehicles.filter(v => v.state === "completed").map(v => (
                    <VehicleCard key={v.id} vehicle={v} onTap={onSelectVehicle} />
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 2A: OPENING CHECK WORKSPACE (Planned Loading — Model B)
// ═══════════════════════════════════════════════════════════════════════════
// Expected quantities derived from admin tasks (aggregated server-side).
// Checker verifies physical count matches plan BEFORE vehicle departs.
// Discrepancy at opening = critical signal — vehicle is blocked until resolved.
export const OpeningCheckWorkspace = ({ vehicle, onBack, onSubmit }) => {
    const [counts, setCounts] = useState(
        vehicle.items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
    );
    const [note, setNote] = useState("");
    const [showSubmitSheet, setShowSubmitSheet] = useState(false);
    const [executor, setExecutor] = useState(vehicle.executor || null);
    const [showExecutorSheet, setShowExecutorSheet] = useState(false);

    const items = vehicle.items;
    const returnableItems = items.filter(i => i.type === "returnable");
    const consumableItems = items.filter(i => i.type === "consumable");

    const hasAnyCount = Object.values(counts).some(v => v > 0);
    const allMatchPlan = items.every(item => counts[item.id] === item.expected);
    const hasMismatch = items.some(item => counts[item.id] !== item.expected && counts[item.id] > 0);

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
                        Pengecekan Pembukaan
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {vehicle.plate}
                    </div>
                </div>
            </div>

            {/* Zone 4: Context Rail */}
            <div style={{
                background: C.vehicleAccentBg,
                borderBottom: `1px solid ${C.border}`,
                padding: "10px 14px",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.vehicleAccentDark }}>
                    <span style={{ fontWeight: 600 }}>{CHECKER.station}</span>
                    <span style={{ color: C.textDim }}>·</span>
                    <span>Sebelum berangkat · verify physical vs plan</span>
                </div>
            </div>

            {/* Zone 3: Workspace content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 100px" }} className="scroll-thin">

                {/* Executor designation — who takes custody of this load */}
                <ExecutorCard
                    executor={executor}
                    onChange={() => setShowExecutorSheet(true)}
                />

                {/* Load Origin — show provenance of the plan */}
                <LoadOriginCard loadOrigin={vehicle.loadOrigin} executor={executor} />

                {/* Explicit "planned loading" indicator */}
                <div style={{
                    background: C.infoBlueBg,
                    border: `1px solid ${C.infoBlue}22`,
                    borderLeft: `3px solid ${C.infoBlue}`,
                    borderRadius: 8,
                    padding: "10px 14px",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                }}>
                    <span style={{ color: C.infoBlue, fontSize: 16, lineHeight: 1, marginTop: 2 }}>ⓘ</span>
                    <div style={{ flex: 1, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                        <strong>Planned Loading.</strong> Jumlah ekspektasi diturunkan dari aggregate task hari ini. Lo verify physical match plan — kalau ada selisih, lapor sebelum vehicle berangkat.
                    </div>
                </div>

                <div style={{ marginBottom: 12, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Hitung fisik untuk verify plan:
                </div>

                {/* ─── RETURNABLE SECTION ─── */}
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
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.vehicleAccent }} />
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: C.vehicleAccentDark,
                                textTransform: "uppercase", letterSpacing: "0.08em",
                            }}>Returnable</span>
                            <span style={{ fontSize: 11, color: C.textDim }}>
                                · pickup lifecycle · outstanding tracked
                            </span>
                        </div>
                        {returnableItems.map(item => (
                            <QuantityStepper
                                key={item.id}
                                itemName={item.name}
                                itemType={item.type}
                                expected={item.expected}
                                value={counts[item.id]}
                                onChange={(v) => setCounts({ ...counts, [item.id]: v })}
                            />
                        ))}
                    </div>
                )}

                {/* ─── CONSUMABLE SECTION ─── */}
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
                            <span style={{ fontSize: 11, color: C.textDim }}>
                                · delivery only · tidak ada pickup
                            </span>
                        </div>
                        {consumableItems.map(item => (
                            <QuantityStepper
                                key={item.id}
                                itemName={item.name}
                                itemType={item.type}
                                expected={item.expected}
                                value={counts[item.id]}
                                onChange={(v) => setCounts({ ...counts, [item.id]: v })}
                            />
                        ))}
                    </div>
                )}

                {/* Notes */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                        Catatan Checker
                        {hasMismatch && <span style={{ color: C.amber700, marginLeft: 6, fontWeight: 500 }}>(wajib bila tidak match plan)</span>}
                    </div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Catatan kondisi loading, ketersediaan stok, atau hambatan operasional..."
                        style={{
                            width: "100%",
                            minHeight: 80,
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

                {/* Mismatch hint — opening mismatch is operationally important */}
                {hasMismatch && (
                    <div style={{
                        marginTop: 16,
                        background: C.amber50,
                        border: `1px solid ${C.amber100}`,
                        borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 12,
                        color: C.amber700,
                        lineHeight: 1.5,
                    }}>
                        <strong>Load tidak match plan.</strong> Vehicle ini akan ditandai sebagai <em>opening discrepancy</em>. Admin akan diberi tahu untuk adjustment task atau resupply sebelum keberangkatan.
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
            }}>
                <button
                    onClick={() => setShowSubmitSheet(true)}
                    disabled={!hasAnyCount}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: !hasAnyCount ? C.slate200 : hasMismatch ? C.amber400 : C.vehicleAccent,
                        color: !hasAnyCount ? C.textDim : "#fff",
                        border: "none",
                        padding: "16px",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: hasAnyCount ? "pointer" : "not-allowed",
                        transition: "transform 0.1s ease, background 0.2s ease",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {!hasAnyCount ? "Hitung Dulu" : hasMismatch ? "Submit · Load Tidak Match" : "Submit · Catat Muatan"}
                </button>
            </div>

            {/* Confirmation Sheet */}
            {showSubmitSheet && (
                <OpeningSubmitConfirmSheet
                    vehicle={vehicle}
                    items={items}
                    counts={counts}
                    hasMismatch={hasMismatch}
                    executor={executor}
                    note={note}
                    onConfirm={() => { setShowSubmitSheet(false); onSubmit(counts, note); }}
                    onCancel={() => setShowSubmitSheet(false)}
                />
            )}

            {/* Executor Picker Sheet */}
            {showExecutorSheet && (
                <ExecutorPickerSheet
                    current={executor}
                    onSelect={(name) => { setExecutor(name); setShowExecutorSheet(false); }}
                    onCancel={() => setShowExecutorSheet(false)}
                />
            )}
        </div>
    );
};

// ─── OPENING SUBMIT CONFIRMATION SHEET ─────────────────────────────────────
const OpeningSubmitConfirmSheet = ({ vehicle, items, counts, hasMismatch, executor, note, onConfirm, onCancel }) => (
    <>
        <div
            onClick={onCancel}
            style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.5)",
                zIndex: 10,
            }}
        />
        <div className="sheet-up" style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
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
                    Konfirmasi Opening Check
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
                    {vehicle.plate} · Submit Load
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 16px" }} className="scroll-thin">
                <div style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    marginBottom: 14,
                }}>
                    {items.map((item, idx) => {
                        const actual = counts[item.id];
                        const delta = actual - item.expected;
                        const isMatch = delta === 0;
                        const color = isMatch ? C.emerald700 : delta < 0 ? C.amber700 : C.violet700;

                        return (
                            <div key={item.id} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto auto auto",
                                gap: 12,
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom: idx === items.length - 1 ? "none" : `1px solid ${C.border}`,
                                fontSize: 13,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                    <span style={{ color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
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
                                <span className="mono" style={{ color: C.textDim, fontSize: 12 }}>plan {item.expected}</span>
                                <span className="mono" style={{ color: C.text, fontWeight: 600 }}>load {actual}</span>
                                <span className="mono" style={{ color, fontWeight: 700, minWidth: 36, textAlign: "right" }}>
                                    {isMatch ? "✓" : `${delta > 0 ? "+" : ""}${delta}`}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Executor row */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 14px", marginBottom: 14,
                    background: executor ? C.surfaceAlt : C.amber50,
                    border: `1px solid ${executor ? C.border : C.amber100}`,
                    borderRadius: 8, fontSize: 13,
                }}>
                    <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Pengemudi</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ color: executor ? C.text : C.amber700, fontWeight: 600 }}>
                        {executor || "Belum ditentukan"}
                    </span>
                </div>

                {hasMismatch ? (
                    <div style={{
                        background: C.amber50,
                        border: `1px solid ${C.amber100}`,
                        borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 13,
                        color: C.amber700,
                        lineHeight: 1.5,
                        marginBottom: 14,
                    }}>
                        <strong>Opening discrepancy akan dicatat.</strong> Vehicle akan menunggu admin acknowledgement atau task adjustment sebelum berangkat. Custody chain belum dimulai.
                    </div>
                ) : (
                    <div style={{
                        background: C.emerald50,
                        border: `1px solid ${C.emerald100}`,
                        borderLeft: `3px solid ${C.emerald400}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 13,
                        color: C.emerald700,
                        lineHeight: 1.5,
                        marginBottom: 14,
                    }}>
                        <strong>Muatan tercatat.</strong> {executor ? <>{executor} akan diminta konfirmasi penerimaan (custody acceptance) sebelum berangkat.</> : <>Pengemudi yang ditentukan akan diminta konfirmasi penerimaan sebelum berangkat.</>}
                    </div>
                )}

                {executor && (
                    <div style={{
                        background: C.infoBlueBg,
                        border: `1px solid ${C.infoBlue}22`,
                        borderLeft: `3px solid ${C.infoBlue}`,
                        borderRadius: 8,
                        padding: "10px 14px",
                        fontSize: 12,
                        color: C.text,
                        lineHeight: 1.5,
                        marginBottom: 14,
                    }}>
                        Penentuan pengemudi (<strong>{executor}</strong>) akan diberitahukan ke Admin untuk visibility.
                    </div>
                )}

                {note && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 6 }}>
                            Catatan
                        </div>
                        <div style={{ fontSize: 13, color: C.text, padding: "10px 12px", background: C.surfaceAlt, borderRadius: 6, border: `1px solid ${C.border}` }}>
                            {note}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                    onClick={onConfirm}
                    className="tap-feedback"
                    style={{
                        background: hasMismatch ? C.amber400 : C.vehicleAccent,
                        color: "#fff", border: "none",
                        padding: "16px", borderRadius: 10,
                        fontSize: 15, fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    Konfirmasi Submit
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
                    Recount Dulu
                </button>
            </div>
        </div>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 2: CLOSING CHECK WORKSPACE
// ═══════════════════════════════════════════════════════════════════════════
export const ClosingCheckWorkspace = ({ vehicle, onBack, onSubmit, onEscalate }) => {
    // Initialize counts dynamically from vehicle.items
    const [counts, setCounts] = useState(
        vehicle.items.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {})
    );
    const [note, setNote] = useState("");
    const [showSubmitSheet, setShowSubmitSheet] = useState(false);

    const items = vehicle.items;
    const returnableItems = items.filter(i => i.type === "returnable");
    const consumableItems = items.filter(i => i.type === "consumable");

    const hasAnyCount = Object.values(counts).some(v => v > 0);
    const hasDiscrepancy = items.some(item => counts[item.id] !== item.expected && (counts[item.id] > 0));
    const hasReturnableDiscrepancy = returnableItems.some(item => counts[item.id] !== item.expected && (counts[item.id] > 0));

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>

            {/* Zone 1: Header with Back */}
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
                        Pengecekan Penutupan
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {vehicle.plate}
                    </div>
                </div>
            </div>

            {/* Zone 4: Context Rail (sticky) */}
            <div style={{
                background: C.vehicleAccentBg,
                borderBottom: `1px solid ${C.border}`,
                padding: "10px 14px",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.vehicleAccentDark }}>
                    <span style={{ fontWeight: 600 }}>{vehicle.executor || "Pengemudi belum ditentukan"}</span>
                    <span style={{ color: C.textDim }}>·</span>
                    <span>tiba {vehicle.arrivedAt}</span>
                    <span style={{ color: C.textDim }}>·</span>
                    <span>{returnableItems.length} returnable · {consumableItems.length} consumable</span>
                </div>
            </div>

            {/* Zone 3: Workspace content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 100px" }} className="scroll-thin">

                {/* Load Origin Card — provenance of expected load (aggregate only) */}
                <LoadOriginCard loadOrigin={vehicle.loadOrigin} executor={vehicle.executor} />

                <div style={{ marginBottom: 12, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    Ekspektasi diturunkan dari server · Hitung aktual:
                </div>

                {/* ─── RETURNABLE SECTION ─── */}
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
                            <span style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: C.vehicleAccent,
                            }} />
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: C.vehicleAccentDark,
                                textTransform: "uppercase", letterSpacing: "0.08em",
                            }}>Returnable</span>
                            <span style={{ fontSize: 11, color: C.textDim }}>
                                · pickup lifecycle · outstanding tracked
                            </span>
                        </div>
                        {returnableItems.map(item => (
                            <QuantityStepper
                                key={item.id}
                                itemName={item.name}
                                itemType={item.type}
                                expected={item.expected}
                                value={counts[item.id]}
                                onChange={(v) => setCounts({ ...counts, [item.id]: v })}
                            />
                        ))}
                    </div>
                )}

                {/* ─── CONSUMABLE SECTION ─── */}
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
                            <span style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: C.slate400,
                            }} />
                            <span style={{
                                fontSize: 12, fontWeight: 700, color: C.slate700,
                                textTransform: "uppercase", letterSpacing: "0.08em",
                            }}>Consumable</span>
                            <span style={{ fontSize: 11, color: C.textDim }}>
                                · delivery only · tidak ada pickup
                            </span>
                        </div>
                        {consumableItems.map(item => (
                            <QuantityStepper
                                key={item.id}
                                itemName={item.name}
                                itemType={item.type}
                                expected={item.expected}
                                value={counts[item.id]}
                                onChange={(v) => setCounts({ ...counts, [item.id]: v })}
                            />
                        ))}
                    </div>
                )}

                {/* Notes section */}
                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>
                        Catatan Checker
                        {hasDiscrepancy && <span style={{ color: C.amber700, marginLeft: 6, fontWeight: 500 }}>(wajib bila ada selisih)</span>}
                    </div>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Catat apa yang lo lihat secara fisik..."
                        style={{
                            width: "100%",
                            minHeight: 80,
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

                {/* Discrepancy hint */}
                {hasDiscrepancy && (
                    <div style={{
                        marginTop: 16,
                        background: C.amber50,
                        border: `1px solid ${C.amber100}`,
                        borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 12,
                        color: C.amber700,
                        lineHeight: 1.5,
                    }}>
                        <strong>Discrepancy terdeteksi.</strong> Submit untuk mencatat operational observation — supervisor akan investigasi penyebabnya. Validation ≠ Resolution.
                        {hasReturnableDiscrepancy && !hasDiscrepancy && (
                            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.85 }}>
                                Returnable discrepancy → asset tracking implication.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Zone 5: Action bar (sticky) */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "12px 14px",
                flexShrink: 0,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
            }}>
                <button
                    onClick={() => setShowSubmitSheet(true)}
                    disabled={!hasAnyCount}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: !hasAnyCount ? C.slate200 : hasDiscrepancy ? C.amber400 : C.vehicleAccent,
                        color: !hasAnyCount ? C.textDim : "#fff",
                        border: "none",
                        padding: "16px",
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: hasAnyCount ? "pointer" : "not-allowed",
                        transition: "transform 0.1s ease, background 0.2s ease",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {!hasAnyCount ? "Hitung Dulu" : hasDiscrepancy ? "Submit Closing Check" : "Submit · Sesuai Ekspektasi"}
                </button>
            </div>

            {/* Confirmation Sheet (Zone 6 overlay) */}
            {showSubmitSheet && (
                <SubmitConfirmSheet
                    vehicle={vehicle}
                    items={items}
                    counts={counts}
                    hasDiscrepancy={hasDiscrepancy}
                    note={note}
                    onConfirm={() => { setShowSubmitSheet(false); onSubmit(counts, note); }}
                    onCancel={() => setShowSubmitSheet(false)}
                    onEscalate={() => { setShowSubmitSheet(false); onEscalate && onEscalate(); }}
                />
            )}
        </div>
    );
};

// ─── SUBMIT CONFIRMATION SHEET ─────────────────────────────────────────────
const SubmitConfirmSheet = ({ vehicle, items, counts, hasDiscrepancy, note, onConfirm, onCancel, onEscalate }) => (
    <>
        {/* Backdrop */}
        <div
            onClick={onCancel}
            style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.5)",
                zIndex: 10,
            }}
        />
        {/* Sheet */}
        <div className="sheet-up" style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: C.surface,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            zIndex: 11,
            maxHeight: "85%",
            display: "flex",
            flexDirection: "column",
        }}>
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
            </div>

            {/* Header */}
            <div style={{ padding: "12px 18px 8px" }}>
                <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 4 }}>
                    Konfirmasi Submit
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>
                    {vehicle.plate} · Closing Check
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px 16px" }} className="scroll-thin">
                {/* Summary rows */}
                <div style={{
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    marginBottom: 14,
                }}>
                    {items.map(item => {
                        const actual = counts[item.id];
                        const delta = actual - item.expected;
                        const isMatch = delta === 0;
                        const isShortage = delta < 0;
                        const color = isMatch ? C.emerald700 : isShortage ? C.amber700 : C.violet700;

                        return (
                            <div key={item.id} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto auto auto",
                                gap: 12,
                                alignItems: "center",
                                padding: "8px 0",
                                borderBottom: item.id === items[items.length - 1].id ? "none" : `1px solid ${C.border}`,
                                fontSize: 13,
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                    <span style={{ color: C.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
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
                                <span className="mono" style={{ color: C.textDim, fontSize: 12 }}>exp {item.expected}</span>
                                <span className="mono" style={{ color: C.text, fontWeight: 600 }}>act {actual}</span>
                                <span className="mono" style={{ color, fontWeight: 700, minWidth: 36, textAlign: "right" }}>
                                    {isMatch ? "✓" : `${delta > 0 ? "+" : ""}${delta}`}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Outcome banner */}
                {hasDiscrepancy ? (
                    <div style={{
                        background: C.amber50,
                        border: `1px solid ${C.amber100}`,
                        borderLeft: `3px solid ${C.amber400}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 13,
                        color: C.amber700,
                        lineHeight: 1.5,
                        marginBottom: 14,
                    }}>
                        <strong>Discrepancy akan dicatat.</strong> Submit ini akan otomatis membuka investigasi untuk supervisor. Lo masih bisa <em>recount</em> sebelum submit jika ada ragu.
                    </div>
                ) : (
                    <div style={{
                        background: C.emerald50,
                        border: `1px solid ${C.emerald100}`,
                        borderLeft: `3px solid ${C.emerald400}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        fontSize: 13,
                        color: C.emerald700,
                        lineHeight: 1.5,
                        marginBottom: 14,
                    }}>
                        <strong>Clean validation.</strong> Semua kategori sesuai ekspektasi. Vehicle akan ditandai validated_clean.
                    </div>
                )}

                {note && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: 6 }}>
                            Catatan
                        </div>
                        <div style={{ fontSize: 13, color: C.text, padding: "10px 12px", background: C.surfaceAlt, borderRadius: 6, border: `1px solid ${C.border}` }}>
                            {note}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky actions */}
            <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                    onClick={onConfirm}
                    className="tap-feedback"
                    style={{
                        background: hasDiscrepancy ? C.amber400 : C.vehicleAccent,
                        color: "#fff", border: "none",
                        padding: "16px", borderRadius: 10,
                        fontSize: 15, fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    Konfirmasi Submit
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
                    Recount Dulu
                </button>
            </div>
        </div>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN 3: POST-SUBMIT (Discrepancy Result + Escalate)
// ═══════════════════════════════════════════════════════════════════════════
export const PostSubmitScreen = ({ vehicle, counts, items, onEscalate, onDone }) => {
    const discrepancies = items.filter(item => counts[item.id] !== item.expected);
    const isClean = discrepancies.length === 0;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                padding: "14px 16px",
                flexShrink: 0,
            }}>
                <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                    Hasil Closing Check
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {vehicle.plate}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 100px" }} className="scroll-thin">
                {/* Result banner */}
                <div style={{
                    background: isClean ? C.emerald50 : C.amber50,
                    border: `1px solid ${isClean ? C.emerald100 : C.amber100}`,
                    borderRadius: 12,
                    padding: "20px",
                    marginBottom: 20,
                    textAlign: "center",
                }} className="slide-up">
                    <div style={{
                        width: 56, height: 56,
                        borderRadius: "50%",
                        background: isClean ? C.emerald400 : C.amber400,
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 28,
                        fontWeight: 700,
                        marginBottom: 12,
                    }}>
                        {isClean ? "✓" : "!"}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: isClean ? C.emerald700 : C.amber700, marginBottom: 4 }}>
                        {isClean ? "Validation Clean" : "Discrepancy Tercatat"}
                    </div>
                    <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                        {isClean
                            ? "Semua kategori sesuai ekspektasi. Vehicle ditandai validated_clean."
                            : `${discrepancies.length} kategori dengan selisih. Investigasi akan dibuka untuk supervisor.`}
                    </div>
                </div>

                {/* Discrepancy list */}
                {!isClean && (
                    <>
                        <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
                            Discrepancy
                        </div>
                        {discrepancies.map(item => {
                            const actual = counts[item.id];
                            const delta = actual - item.expected;
                            const isShortage = delta < 0;
                            const isConsumable = item.type === "consumable";
                            return (
                                <div key={item.id} style={{
                                    background: C.surface,
                                    border: `1px solid ${C.border}`,
                                    borderLeft: `3px solid ${isShortage ? C.amber400 : C.violet400}`,
                                    borderRadius: 8,
                                    padding: "12px 14px",
                                    marginBottom: 8,
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.name}</span>
                                            {isConsumable && (
                                                <span style={{
                                                    padding: "1px 5px", borderRadius: 3,
                                                    background: C.slate100, color: C.slate600,
                                                    fontSize: 9, fontWeight: 600,
                                                    textTransform: "uppercase", letterSpacing: "0.04em",
                                                }}>Consumable</span>
                                            )}
                                        </div>
                                        <Chip variant={isShortage ? "amber" : "violet"}>
                                            {isShortage ? "Shortage" : "Surplus"}
                                        </Chip>
                                    </div>
                                    <div style={{ fontSize: 12, color: C.textMid, display: "flex", gap: 14, flexWrap: "wrap" }}>
                                        <span>Ekspektasi <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{item.expected}</span></span>
                                        <span>Aktual <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{actual}</span></span>
                                        <span style={{ color: isShortage ? C.amber700 : C.violet700, fontWeight: 600, marginLeft: "auto" }}>
                                            Selisih {delta > 0 ? "+" : ""}{delta}
                                        </span>
                                    </div>
                                    {isConsumable && isShortage && (
                                        <div style={{ fontSize: 11, color: C.textDim, marginTop: 6, fontStyle: "italic" }}>
                                            Consumable shortage → kemungkinan delivery error / damaged box, bukan asset hilang.
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div style={{
                            marginTop: 16,
                            padding: "12px 14px",
                            background: C.infoBlueBg,
                            border: `1px solid ${C.infoBlue}33`,
                            borderLeft: `3px solid ${C.infoBlue}`,
                            borderRadius: 8,
                            fontSize: 12,
                            color: C.text,
                            lineHeight: 1.6,
                        }}>
                            <strong>Penting:</strong> Lo cuma mendeteksi discrepancy — lo TIDAK menentukan apakah asset hilang, rusak, atau ada misinput. Supervisor yang akan investigasi.
                        </div>
                    </>
                )}
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
                {!isClean && (
                    <button
                        onClick={onEscalate}
                        className="tap-feedback"
                        style={{
                            width: "100%",
                            background: C.amber400, color: "#fff",
                            border: "none", padding: "16px",
                            borderRadius: 10, fontSize: 15, fontWeight: 700,
                            cursor: "pointer", textTransform: "uppercase",
                            letterSpacing: "0.04em",
                        }}
                    >
                        Eskalasi ke Supervisor
                    </button>
                )}
                <button
                    onClick={onDone}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: isClean ? C.vehicleAccent : C.surface,
                        color: isClean ? "#fff" : C.text,
                        border: isClean ? "none" : `1px solid ${C.border}`,
                        padding: "14px",
                        borderRadius: 10,
                        fontSize: 14, fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    {isClean ? "Selesai · Kembali ke Daftar" : "Kembali ke Daftar"}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — Phone Frame + Navigation
// ═══════════════════════════════════════════════════════════════════════════
export default function VehicleRuntimeMobile() {
    const [screen, setScreen] = useState("feed");           // feed | opening | closing | result
    const [activeVehicle, setActiveVehicle] = useState(null);
    const [submittedCounts, setSubmittedCounts] = useState(null);

    const handleSelectVehicle = (v) => {
        if (v.state === "returning") {
            setActiveVehicle(v);
            setScreen("closing");
        } else if (v.state === "loading") {
            setActiveVehicle(v);
            setScreen("opening");
        }
        // Other states (custody_pending, in_route, completed) would route elsewhere
    };

    const handleSubmit = (counts, note) => {
        setSubmittedCounts(counts);
        setScreen("result");
    };

    const handleOpeningSubmit = (counts, note) => {
        // For demo: route back to feed after opening submit
        // In real app: would show success state then return to feed
        setActiveVehicle(null);
        setSubmittedCounts(null);
        setScreen("feed");
    };

    const handleDone = () => {
        setActiveVehicle(null);
        setSubmittedCounts(null);
        setScreen("feed");
    };

    const items = activeVehicle ? activeVehicle.items : [];

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
                {/* Label */}
                <div style={{ color: "#cbd5e1", textAlign: "center", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, opacity: 0.7 }}>
                        Consteon
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 }}>
                        Vehicle Runtime · Mobile
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                        Reconciliation & Custody Validation
                    </div>
                </div>

                {/* Phone Frame */}
                <div className="phone-shadow" style={{
                    width: 390,
                    height: 780,
                    maxHeight: "calc(100vh - 140px)",
                    background: C.bg,
                    borderRadius: 36,
                    overflow: "hidden",
                    position: "relative",
                }}>
                    {/* Status bar */}
                    <div style={{
                        height: 36,
                        background: screen === "closing" ? C.surface : C.surface,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 24px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.text,
                        borderBottom: screen === "feed" ? "none" : "none",
                        position: "relative",
                        zIndex: 5,
                    }}>
                        <span>14:55</span>
                        <span style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 11 }}>
                            <span>●●●●●</span>
                            <span style={{ marginLeft: 4 }}>🔋</span>
                        </span>
                    </div>

                    {/* Screen content */}
                    <div style={{ height: "calc(100% - 36px)", position: "relative" }}>
                        {screen === "feed" && (
                            <VehicleFeedScreen
                                vehicles={VEHICLES}
                                onSelectVehicle={handleSelectVehicle}
                                onOpenMenu={() => { }}
                            />
                        )}
                        {screen === "opening" && activeVehicle && (
                            <OpeningCheckWorkspace
                                vehicle={activeVehicle}
                                onBack={() => setScreen("feed")}
                                onSubmit={handleOpeningSubmit}
                            />
                        )}
                        {screen === "closing" && activeVehicle && (
                            <ClosingCheckWorkspace
                                vehicle={activeVehicle}
                                onBack={() => setScreen("feed")}
                                onSubmit={handleSubmit}
                            />
                        )}
                        {screen === "result" && activeVehicle && submittedCounts && (
                            <PostSubmitScreen
                                vehicle={activeVehicle}
                                counts={submittedCounts}
                                items={items}
                                onEscalate={handleDone}
                                onDone={handleDone}
                            />
                        )}
                    </div>
                </div>

                {/* Screen indicator */}
                <div style={{
                    display: "flex",
                    gap: 8,
                    padding: "8px 16px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 100,
                    backdropFilter: "blur(10px)",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    maxWidth: 450,
                }}>
                    {[
                        { id: "feed", label: "Feed" },
                        { id: "opening", label: "Opening" },
                        { id: "closing", label: "Closing" },
                        { id: "result", label: "Hasil" },
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => {
                                if (s.id === "feed") handleDone();
                                else if (s.id === "opening") {
                                    const v = VEHICLES.find(v => v.state === "loading");
                                    if (v) {
                                        setActiveVehicle(v);
                                        setScreen("opening");
                                    }
                                }
                                else if (s.id === "closing") {
                                    // Always use V-007 for closing demo (has loadOrigin & full items)
                                    const v = VEHICLES.find(vv => vv.id === "V-007");
                                    setActiveVehicle(v);
                                    setScreen("closing");
                                }
                                else if (s.id === "result") {
                                    // Demo: prefill with mix of clean + shortage for V-007
                                    const v = activeVehicle || VEHICLES[0];
                                    if (!activeVehicle) setActiveVehicle(v);
                                    // Simulate: gas_12 short by 2, gas_3 ok, aqua_galon ok, aqua_600 short by 1
                                    const demoCounts = v.items.reduce((acc, item) => {
                                        if (item.id === "gas_12") acc[item.id] = item.expected - 2;
                                        else if (item.id === "aqua_600") acc[item.id] = item.expected - 1;
                                        else acc[item.id] = item.expected;
                                        return acc;
                                    }, {});
                                    setSubmittedCounts(demoCounts);
                                    setScreen("result");
                                }
                                else setScreen(s.id);
                            }}
                            style={{
                                background: screen === s.id ? "#fff" : "transparent",
                                color: screen === s.id ? "#0f172a" : "#cbd5e1",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: 100,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}