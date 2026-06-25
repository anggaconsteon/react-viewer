import { useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTEON — ADMIN RUNTIME · MOBILE · CREATE TASK FLOW
// ═══════════════════════════════════════════════════════════════════════════
// Identity: Coordination & Orchestration Layer (mobile surface)
// Mental model: "Customer pesan via WA, gue input sekarang juga"
// Context: Admin di kantor / on-the-go, terima order via phone/WA
// Doctrine:
//   - Admin sees customer outstanding (Admin domain — for coordination)
//   - System suggests pickup qty = outstanding (admin can adjust)
//   - Loaded = total drops (tight planning)
//   - Mobile-first for fast input scenarios
//   - Multi-step wizard with bottom sheets pattern
//   - Operational language, no enterprise jargon
//   - ASSIGNMENT = VEHICLE-ANCHORED. Admin anchors the order to a VEHICLE
//     (reconciliation container), NOT to a person. Who actually drives
//     (driver / admin / warehouse staff) is decided LATER at warehouse
//     loading / opening check — that is a separate stage, not Admin's job.
//     Doctrine basis: Users domain (actor) ⊥ Vehicles domain (recon unit);
//     event schema separates actor_id from operational_ref.vehicle_id.
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
    @keyframes pop {
      0% { transform: scale(0.94); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .pop { animation: pop 0.2s ease-out forwards; }
    .phone-shadow { box-shadow: 0 20px 60px rgba(0,0,0,0.25), 0 0 0 8px #0a0a0a, 0 0 0 9px #2a2a2a; }
    .tap-feedback:active { transform: scale(0.97); }
    .scroll-thin::-webkit-scrollbar { display: none; }
  `}</style>
);

// ─── DESIGN TOKENS — Admin uses blue accent (coordination) ─────────────────
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

    // Admin accent — blue (coordination)
    adminAccent: "#2563eb",
    adminAccentBg: "#eff6ff",
    adminAccentDark: "#1e40af",

    // Drop indigo
    drop: "#4f46e5",
    dropBg: "#eef2ff",
    dropDark: "#3730a3",

    // Pickup violet
    violet50: "#f5f3ff",
    violet100: "#ede9fe",
    violet400: "#a78bfa",
    violet700: "#6d28d9",

    emerald50: "#ecfdf5",
    emerald100: "#d1fae5",
    emerald400: "#34d399",
    emerald500: "#10b981",
    emerald700: "#047857",

    // SALE (ownership transfer) — teal, distinct from drop/outstanding/urgency
    sale50: "#f0fdfa",
    sale100: "#ccfbf1",
    sale400: "#2dd4bf",
    sale600: "#0d9488",
    sale700: "#0f766e",

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
export const CUSTOMERS = [
    {
        id: "C-001",
        name: "Honda Bintaro",
        type: "corporate",
        address: "Jl. Bintaro Utama 23, Tangerang",
        contact: "021-7456789",
        pic: "Pak Budi · 081234567890",
        avatar: "🏢",
        outstanding: [
            { itemId: "gas_12", name: "Gas 12kg", qty: 3, lastDate: "12 hari lalu", aging: "warning" },
        ],
    },
    {
        id: "C-002",
        name: "Mandiri Tower",
        type: "corporate",
        address: "Jl. Jend. Sudirman Kav. 54-55",
        contact: "021-5234567",
        pic: "Bu Sari · 081298765432",
        avatar: "🏦",
        outstanding: [
            { itemId: "gas_12", name: "Gas 12kg", qty: 5, lastDate: "5 hari lalu", aging: "normal" },
            { itemId: "aqua_galon", name: "Aqua Galon", qty: 2, lastDate: "3 hari lalu", aging: "normal" },
        ],
    },
    {
        id: "C-003",
        name: "BCA Cabang Bintaro",
        type: "corporate",
        address: "Jl. Bintaro Sektor 7, Tangerang",
        contact: "021-7378900",
        pic: "Pak Joko · 081312345678",
        avatar: "🏦",
        outstanding: [],
    },
    {
        id: "C-004",
        name: "Toko Sumber Rejeki",
        type: "retail",
        address: "Jl. Bintaro Permai Blok C2",
        contact: "021-7389012",
        pic: "Pak Andi · 081887654321",
        avatar: "🏪",
        genesisStatus: "pending",          // migration cohort — belum di-seed
        transactedPreSeed: false,
        recordedHolding: [
            { itemId: "gas_3", name: "Gas 3kg", qty: 3 },
        ],
        outstanding: [],                    // pre-seed: derived outstanding belum lengkap
    },
    {
        id: "C-005",
        name: "Resto Bintaro Sky",
        type: "horeca",
        address: "Plaza Bintaro Lt. 3",
        contact: "021-7390100",
        pic: "Bu Lina · 081345678901",
        avatar: "🍽️",
        genesisStatus: "pending",          // migration cohort — sudah transaksi sebelum di-seed
        transactedPreSeed: true,
        recordedHolding: [
            { itemId: "gas_12", name: "Gas 12kg", qty: 8 },
        ],
        outstanding: [],                    // pre-seed: understated, jangan dipakai Model B
    },
];

export const PRODUCT_CATALOG = [
    { id: "gas_12", name: "Gas 12kg", type: "returnable", category: "Gas", icon: "🔥" },
    { id: "gas_3", name: "Gas 3kg", type: "returnable", category: "Gas", icon: "🔥" },
    { id: "aqua_galon", name: "Aqua Galon", type: "returnable", category: "Water", icon: "💧" },
    { id: "pristine_galon", name: "Pristine Galon", type: "returnable", category: "Water", icon: "💧" },
    { id: "aqua_600", name: "Aqua 600ml (Dus)", type: "consumable", category: "Water", icon: "💧" },
    { id: "aqua_1500", name: "Aqua 1500ml (Dus)", type: "consumable", category: "Water", icon: "💧" },
    { id: "leminerale_600", name: "Le Minerale 600ml (Dus)", type: "consumable", category: "Water", icon: "💧" },
];

// Vehicle pool — admin anchors order to a vehicle (reconciliation container).
// The person who drives is decided later at warehouse loading, not here.
export const VEHICLES = [
    { id: "V-007", plate: "B 1234 XY", type: "Pickup Box", status: "available", taskCount: 0 },
    { id: "V-005", plate: "B 5678 AB", type: "Pickup Box", status: "available", taskCount: 0 },
    { id: "V-003", plate: "B 9012 CD", type: "Engkel", status: "on_route", taskCount: 4 },
    { id: "V-002", plate: "B 5566 GH", type: "Motor Roda 3", status: "available", taskCount: 2 },
    { id: "V-ADHOC", plate: "Ad-hoc / Lainnya", type: "Kendaraan tidak tetap", status: "available", taskCount: 0, adhoc: true },
];

// ─── ATOMS ─────────────────────────────────────────────────────────────────
const Chip = ({ children, variant = "neutral" }) => {
    const variants = {
        neutral: { bg: C.slate100, fg: C.slate700 },
        amber: { bg: C.amber100, fg: C.amber700 },
        blue: { bg: C.adminAccentBg, fg: C.adminAccent },
        indigo: { bg: C.dropBg, fg: C.drop },
        emerald: { bg: C.emerald100, fg: C.emerald700 },
        violet: { bg: C.violet50, fg: C.violet700 },
        slate: { bg: C.slate100, fg: C.slate600 },
        info: { bg: C.infoBlueBg, fg: C.infoBlue },
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

// ─── CUSTOMER TYPES (new-customer onboarding) ──────────────────────────────
export const CUSTOMER_TYPES = [
    { id: "corporate", label: "Korporat", icon: "🏢" },
    { id: "horeca", label: "HoReCa", icon: "🍽️" },
    { id: "retail", label: "Retail", icon: "🏪" },
    { id: "residential", label: "Rumah", icon: "🏠" },
];

// ─── DOCTRINE NOTE (compact contextual note) ───────────────────────────────
const DoctrineNote = ({ icon = "ℹ", tone = "violet", title, children }) => {
    const tones = {
        violet: { bg: C.violet50, border: C.violet100, fg: C.violet700 },
        amber: { bg: C.amber50, border: C.amber100, fg: C.amber700, bar: C.amber400 },
        emerald: { bg: C.emerald50, border: C.emerald100, fg: C.emerald700 },
        info: { bg: C.infoBlueBg, border: "#dbeafe", fg: C.adminAccentDark },
    };
    const t = tones[tone];
    return (
        <div style={{
            background: t.bg, border: `1px solid ${t.border}`,
            borderLeft: t.bar ? `3px solid ${t.bar}` : `1px solid ${t.border}`,
            borderRadius: 8, padding: "10px 12px", fontSize: 11.5, color: t.fg, lineHeight: 1.5,
        }}>
            {title && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontWeight: 700 }}>
                    <span>{icon}</span><span>{title}</span>
                </div>
            )}
            <div>{children}</div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: CUSTOMER PICKER
// ═══════════════════════════════════════════════════════════════════════════
export const CustomerPickerScreen = ({ customers, onSelect, onAddNew, onCancel }) => {
    const [search, setSearch] = useState("");

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase())
    );

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
                    onClick={onCancel}
                    className="tap-feedback"
                    style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: "transparent", border: "none",
                        fontSize: 18, color: C.text, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >✕</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                        Buat Task · Step 1/4
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                        Pilih Customer
                    </div>
                </div>
            </div>

            {/* Search */}
            <div style={{
                background: C.surface,
                padding: "10px 14px 14px",
                borderBottom: `1px solid ${C.border}`,
                flexShrink: 0,
            }}>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                }}>
                    <span style={{ color: C.textDim, fontSize: 14 }}>🔍</span>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari customer atau alamat..."
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            outline: "none",
                            fontSize: 14,
                            color: C.text,
                        }}
                    />
                </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 100px" }} className="scroll-thin">
                <div style={{
                    fontSize: 11, color: C.textDim,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    fontWeight: 700, marginBottom: 8, paddingLeft: 4,
                }}>
                    {filtered.length} Customer
                </div>

                {filtered.map(c => {
                    const outstandingTotal = c.outstanding.reduce((s, o) => s + o.qty, 0);
                    const hasCritical = c.outstanding.some(o => o.aging === "critical");

                    return (
                        <button
                            key={c.id}
                            onClick={() => onSelect(c)}
                            className="tap-feedback slide-up"
                            style={{
                                width: "100%",
                                background: C.surface,
                                border: `1px solid ${C.border}`,
                                borderRadius: 12,
                                padding: "12px 14px",
                                marginBottom: 8,
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: C.slate100,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 20,
                                    flexShrink: 0,
                                }}>{c.avatar}</div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {c.name}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 11, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {c.address}
                                    </div>
                                    {outstandingTotal > 0 && (
                                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                            <Chip variant={hasCritical ? "amber" : "violet"}>
                                                ↑ {outstandingTotal} outstanding
                                            </Chip>
                                            {hasCritical && (
                                                <span style={{ fontSize: 10, color: C.amber700, fontWeight: 600 }}>
                                                    ⚠ Ada aging tinggi
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {c.genesisStatus === "pending" && (
                                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                            <Chip variant="amber">⏳ Belum di-seed</Chip>
                                            {c.transactedPreSeed && <Chip variant="slate">Outstanding belum lengkap</Chip>}
                                        </div>
                                    )}
                                </div>

                                <span style={{ color: C.textDim, fontSize: 16, flexShrink: 0 }}>›</span>
                            </div>
                        </button>
                    );
                })}

                {filtered.length === 0 && (
                    <div style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        color: C.textMid,
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                            Tidak ada customer
                        </div>
                        <div style={{ fontSize: 12, color: C.textDim }}>
                            Coba kata kunci lain atau tambah customer baru
                        </div>
                    </div>
                )}
            </div>

            {/* Action: Add new customer */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "10px 14px 12px",
                flexShrink: 0,
            }}>
                <button
                    onClick={onAddNew}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: "transparent",
                        border: `1px dashed ${C.borderStrong}`,
                        borderRadius: 10,
                        padding: "12px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.adminAccent,
                        cursor: "pointer",
                    }}
                >
                    + Customer Baru
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: ITEM BUILDER (Order + Outstanding Awareness)
// ═══════════════════════════════════════════════════════════════════════════
export const ItemBuilderScreen = ({ customer, taskItems, onUpdate, onBack, onNext, genesisPending, onSeedNow }) => {
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showRefill, setShowRefill] = useState(false);

    // Get outstanding for items not yet in task
    const itemsInTask = taskItems.map(i => i.itemId);
    const availableOutstanding = customer.outstanding.filter(o => !itemsInTask.includes(o.itemId));

    // Model B — Repeat customer mental model:
    //   pickup_planned = drop_qty + outstanding_qty
    // 
    // Where:
    //   - drop_qty = isi baru yang dipesan (akan jadi tabung yang dibawa pulang isi)
    //   - outstanding_qty = tabung lama yang belum dibalikin
    //
    // Exchange happens at delivery:
    //   - Customer terima isi baru (drop)
    //   - Customer kasih kosong sebanyak drop (exchange) + outstanding lama (clearing)
    const getOutstandingQty = (itemId) => {
        const outstanding = customer.outstanding.find(o => o.itemId === itemId);
        return outstanding ? outstanding.qty : 0;
    };

    const computeSuggestedPickup = (itemId, dropQty, itemType) => {
        if (itemType === "consumable") return 0;
        return dropQty + getOutstandingQty(itemId);
    };

    const addItem = (product) => {
        // New item — drop starts at 0, pickup = outstanding only (drop+0=outstanding)
        // genesis_pending: outstanding belum lengkap → jangan pakai untuk suggestion (= 0)
        const outstandingQty = (product.type === "returnable" && !genesisPending) ? getOutstandingQty(product.id) : 0;
        onUpdate([...taskItems, {
            itemId: product.id,
            name: product.name,
            type: product.type,
            icon: product.icon,
            transactionType: "LOAN",           // LOAN (pinjam, default) | SALE (jual)
            drop: 0,
            pickup: outstandingQty,
            pickupSuggested: outstandingQty,  // initial suggestion (drop=0 case)
            outstandingQty: outstandingQty,    // store outstanding for recompute
            pickupManuallyAdjusted: false,
        }]);
        setShowProductPicker(false);
    };

    const removeItem = (itemId) => {
        onUpdate(taskItems.filter(i => i.itemId !== itemId));
    };

    // Ownership transfer lines — Jual (SALE, keluar) / Beli (PURCHASE, masuk).
    // Kembar: kategori + qty + kondisi. transaction_type per baris.
    const addOwnershipItem = (product, direction) => {
        const base = {
            itemId: product.id,
            name: product.name,
            type: "returnable",
            icon: product.icon,
            transactionType: direction,        // "SALE" | "PURCHASE"
            drop: 0,
            pickup: 0,
        };
        const line = direction === "SALE"
            ? { ...base, drop: 1, condition: "full" }    // jual: qty pakai drop, default penuh
            : { ...base, buyQty: 1, condition: "empty" }; // beli: qty pakai buyQty, default kosong
        onUpdate([...taskItems, line]);
        setShowTransfer(false);
    };

    const setCondition = (itemId, cond) => {
        onUpdate(taskItems.map(i => i.itemId === itemId ? { ...i, condition: cond } : i));
    };

    // Refill line — content/service. Galon milik customer ditukar 1-lawan-1.
    // Bukan custody, bukan ownership: count operator tetap, outstanding +0.
    const addRefillItem = (product) => {
        onUpdate([...taskItems, {
            itemId: product.id, name: product.name, type: "returnable", icon: product.icon,
            category: product.category, transactionType: "REFILL",
            refillQty: 1,
            waterType: product.category === "Water" ? "ro" : null,
            drop: 0, pickup: 0,
        }]);
        setShowRefill(false);
    };

    const setWaterType = (itemId, w) => {
        onUpdate(taskItems.map(i => i.itemId === itemId ? { ...i, waterType: w } : i));
    };

    // Smart update: when drop changes, auto-recompute pickup suggestion
    // unless admin manually adjusted pickup (preserve user intent)
    const updateItem = (itemId, field, value) => {
        onUpdate(taskItems.map(i => {
            if (i.itemId !== itemId) return i;

            const newValue = Math.max(0, value);
            const updated = { ...i, [field]: newValue };

            // If drop changes AND user hasn't manually adjusted pickup, recompute pickup
            // (LOAN only — SALE keeps pickup at 0)
            if (field === "drop" && !i.pickupManuallyAdjusted && i.type === "returnable" && i.transactionType !== "SALE") {
                const newSuggestedPickup = newValue + i.outstandingQty;
                updated.pickup = newSuggestedPickup;
                updated.pickupSuggested = newSuggestedPickup;
            }

            // If pickup changes manually, mark as manually adjusted
            if (field === "pickup") {
                const expectedPickup = i.drop + i.outstandingQty;
                if (newValue !== expectedPickup) {
                    updated.pickupManuallyAdjusted = true;
                } else {
                    // Back to suggested value — unmark
                    updated.pickupManuallyAdjusted = false;
                }
                updated.pickupSuggested = expectedPickup;
            }

            return updated;
        }));
    };

    const canProceed = taskItems.some(i => i.drop > 0 || i.pickup > 0 || (i.transactionType === "PURCHASE" && i.buyQty > 0) || (i.transactionType === "REFILL" && i.refillQty > 0));
    const totalDrop = taskItems.reduce((s, i) => s + i.drop, 0);
    const totalPickup = taskItems.reduce((s, i) => s + i.pickup, 0);
    const totalBuy = taskItems.reduce((s, i) => s + (i.transactionType === "PURCHASE" ? (i.buyQty || 0) : 0), 0);
    const totalRefill = taskItems.reduce((s, i) => s + (i.transactionType === "REFILL" ? (i.refillQty || 0) : 0), 0);

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
                        Buat Task · Step 2/4
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                        Item & Quantity
                    </div>
                </div>
            </div>

            {/* Customer context strip */}
            <div style={{
                background: C.adminAccentBg,
                borderBottom: `1px solid ${C.border}`,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 16 }}>{customer.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {customer.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {customer.pic}
                    </div>
                </div>
            </div>

            {/* Genesis-pending guard banner (pre-seed) */}
            {genesisPending && (
                <div style={{
                    background: C.amber50, borderBottom: `1px solid ${C.amber100}`,
                    borderLeft: `3px solid ${C.amber400}`, padding: "10px 14px", flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: C.amber700, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            ⏳ Customer belum di-seed
                        </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.amber700, lineHeight: 1.4 }}>
                        Outstanding belum lengkap (saldo awal belum dicatat). Saran pickup dimatikan — set manual.
                        Tetap boleh lanjut; otomatis benar setelah di-seed.
                    </div>
                    {(customer.recordedHolding && customer.recordedHolding.length > 0) && (
                        <div style={{ fontSize: 10.5, color: C.amber700, marginTop: 6 }}>
                            Catatan lama: {customer.recordedHolding.map(r => `${r.qty} ${r.name}`).join(" · ")}
                        </div>
                    )}
                    <button onClick={onSeedNow} className="tap-feedback" style={{
                        marginTop: 8, width: "100%", background: C.violet700, color: "#fff", border: "none",
                        padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>↑ Seed Saldo Awal Sekarang</button>
                </div>
            )}

            {/* Outstanding awareness banner */}
            {!genesisPending && customer.outstanding.length > 0 && (
                <div style={{
                    background: C.violet50,
                    borderBottom: `1px solid ${C.violet100}`,
                    padding: "10px 14px",
                    flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: C.violet700, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            ↑ Outstanding Customer
                        </span>
                        {customer.genesisStatus === "provisional" && <Chip variant="violet">◐ Provisional · baru di-seed</Chip>}
                    </div>
                    <div style={{ fontSize: 11, color: C.violet700, lineHeight: 1.4 }}>
                        Customer ada {customer.outstanding.reduce((s, o) => s + o.qty, 0)} tabung belum dibalikin.
                        Pickup quantity = <strong>drop (exchange) + outstanding (clearing)</strong>.
                    </div>
                </div>
            )}

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 120px" }} className="scroll-thin">

                {taskItems.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "30px 20px",
                        background: C.surface,
                        border: `1px dashed ${C.borderStrong}`,
                        borderRadius: 12,
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: C.text }}>
                            Belum ada item
                        </div>
                        <div style={{ fontSize: 12, color: C.textMid, marginBottom: 16 }}>
                            Tambah item yang customer mau pesan
                        </div>
                        <button
                            onClick={() => setShowProductPicker(true)}
                            className="tap-feedback"
                            style={{
                                background: C.adminAccent,
                                color: "#fff",
                                border: "none",
                                padding: "10px 18px",
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                            }}
                        >
                            + Tambah Item
                        </button>
                        <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center" }}>
                            <button
                                onClick={() => setShowTransfer(true)}
                                className="tap-feedback"
                                style={{
                                    background: "transparent",
                                    color: C.sale700,
                                    border: `1px dashed ${C.sale400}`,
                                    padding: "8px 16px",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                + Transfer Kepemilikan
                            </button>
                            <button
                                onClick={() => setShowRefill(true)}
                                className="tap-feedback"
                                style={{
                                    background: "transparent",
                                    color: C.emerald700,
                                    border: `1px dashed ${C.emerald400}`,
                                    padding: "8px 16px",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                + Refill
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8, paddingLeft: 4 }}>
                            Item Task · {taskItems.length}
                        </div>

                        {taskItems.map(item => (
                            <TaskItemCard
                                key={item.itemId}
                                item={item}
                                genesisPending={genesisPending}
                                customerOutstanding={customer.outstanding.find(o => o.itemId === item.itemId)}
                                onUpdateDrop={(v) => updateItem(item.itemId, "drop", v)}
                                onUpdatePickup={(v) => updateItem(item.itemId, "pickup", v)}
                                onUpdateBuyQty={(v) => updateItem(item.itemId, "buyQty", v)}
                                onUpdateRefillQty={(v) => updateItem(item.itemId, "refillQty", v)}
                                onSetCondition={(c) => setCondition(item.itemId, c)}
                                onSetWaterType={(w) => setWaterType(item.itemId, w)}
                                onRemove={() => removeItem(item.itemId)}
                            />
                        ))}

                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button
                                onClick={() => setShowProductPicker(true)}
                                className="tap-feedback"
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: `1px dashed ${C.borderStrong}`,
                                    borderRadius: 10,
                                    padding: "12px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: C.adminAccent,
                                    cursor: "pointer",
                                }}
                            >
                                + Tambah Item Lain
                            </button>
                            <button
                                onClick={() => setShowTransfer(true)}
                                className="tap-feedback"
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: `1px dashed ${C.sale400}`,
                                    borderRadius: 10,
                                    padding: "12px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: C.sale700,
                                    cursor: "pointer",
                                }}
                            >
                                + Transfer Kepemilikan
                            </button>
                        </div>
                        <button
                            onClick={() => setShowRefill(true)}
                            className="tap-feedback"
                            style={{
                                width: "100%", marginTop: 8,
                                background: "transparent",
                                border: `1px dashed ${C.emerald400}`,
                                borderRadius: 10,
                                padding: "12px",
                                fontSize: 13,
                                fontWeight: 600,
                                color: C.emerald700,
                                cursor: "pointer",
                            }}
                        >
                            + Refill (tukar galon customer)
                        </button>
                    </>
                )}

                {/* Outstanding belum di-clear hint */}
                {!genesisPending && taskItems.length > 0 && availableOutstanding.length > 0 && (
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
                        <strong>Outstanding lain belum di-clear:</strong>
                        <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                            {availableOutstanding.map(o => (
                                <li key={o.itemId}>{o.qty} {o.name} ({o.lastDate})</li>
                            ))}
                        </ul>
                        <div style={{ marginTop: 6, fontSize: 11 }}>
                            Mau pickup juga sekalian? Tambah item untuk include.
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom action bar */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "10px 14px 12px",
                flexShrink: 0,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
            }}>
                {/* Mini summary */}
                {taskItems.length > 0 && (
                    <div style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 10,
                        padding: "8px 12px",
                        background: C.surfaceAlt,
                        borderRadius: 8,
                        fontSize: 11,
                    }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ color: C.textMid }}>Drop: </span>
                            <span className="mono" style={{ color: C.drop, fontWeight: 700 }}>{totalDrop}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={{ color: C.textMid }}>Pickup: </span>
                            <span className="mono" style={{ color: C.violet700, fontWeight: 700 }}>{totalPickup}</span>
                        </div>
                        {totalBuy > 0 && (
                            <div style={{ flex: 1 }}>
                                <span style={{ color: C.textMid }}>Beli: </span>
                                <span className="mono" style={{ color: C.sale600, fontWeight: 700 }}>{totalBuy}</span>
                            </div>
                        )}
                        {totalRefill > 0 && (
                            <div style={{ flex: 1 }}>
                                <span style={{ color: C.textMid }}>Refill: </span>
                                <span className="mono" style={{ color: C.emerald700, fontWeight: 700 }}>{totalRefill}</span>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={() => canProceed && onNext()}
                    disabled={!canProceed}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: !canProceed ? C.slate200 : C.adminAccent,
                        color: !canProceed ? C.textDim : "#fff",
                        border: "none",
                        padding: "14px",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: canProceed ? "pointer" : "not-allowed",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {!canProceed ? "Tambah Quantity Dulu" : "Lanjut · Pilih Kendaraan →"}
                </button>
            </div>

            {/* Product picker sheet */}
            {showProductPicker && (
                <ProductPickerSheet
                    itemsInTask={itemsInTask}
                    customerOutstanding={customer.outstanding}
                    onSelect={addItem}
                    onCancel={() => setShowProductPicker(false)}
                />
            )}

            {/* Transfer kepemilikan — pilih Jual/Beli → kategori (returnable only) */}
            {showTransfer && (
                <TransferKepemilikanSheet
                    inTask={itemsInTask}
                    onSelect={addOwnershipItem}
                    onCancel={() => setShowTransfer(false)}
                />
            )}

            {/* Refill — pilih kategori galon (content/service) */}
            {showRefill && (
                <RefillCategorySheet
                    inTask={itemsInTask}
                    onSelect={addRefillItem}
                    onCancel={() => setShowRefill(false)}
                />
            )}
        </div>
    );
};

// ─── TASK ITEM CARD with stepper ───────────────────────────────────────────
const TaskItemCard = ({ item, genesisPending, customerOutstanding, onUpdateDrop, onUpdatePickup, onUpdateBuyQty, onUpdateRefillQty, onSetCondition, onSetWaterType, onRemove }) => {
    const isConsumable = item.type === "consumable";
    const isReturnable = item.type === "returnable";
    const isSale = isReturnable && item.transactionType === "SALE";
    const isPurchase = isReturnable && item.transactionType === "PURCHASE";
    const isRefill = isReturnable && item.transactionType === "REFILL";
    const hasOutstanding = !!customerOutstanding;
    const matchesSuggestion = isReturnable && !isSale && !isPurchase && !isRefill && item.pickup === item.pickupSuggested && item.pickupSuggested > 0;

    // REFILL — content/service line. Galon milik customer ditukar 1-lawan-1 (empty
    // in / filled out). Yang dijual air. Bukan custody, bukan ownership.
    if (isRefill) {
        const isWater = item.category === "Water";
        return (
            <div style={{
                background: C.surface,
                border: `1px solid ${C.emerald100}`,
                borderLeft: `3px solid ${C.emerald400}`,
                borderRadius: 12,
                padding: "12px 12px 14px",
                marginBottom: 10,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</span>
                        <span style={{
                            padding: "1px 6px", borderRadius: 3, background: C.emerald100, color: C.emerald700,
                            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>Refill</span>
                    </div>
                    <button onClick={onRemove} className="tap-feedback" style={{
                        width: 28, height: 28, borderRadius: 6, background: "transparent", border: "none",
                        color: C.textDim, fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>🗑</button>
                </div>

                {/* Jenis air — content label (opsional, hanya untuk galon air) */}
                {isWater && (
                    <>
                        <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>
                            Jenis air <span style={{ textTransform: "none", fontWeight: 500 }}>· label konten, bukan kategori aset</span>
                        </div>
                        <div style={{
                            display: "flex", gap: 0, marginBottom: 12,
                            background: C.surfaceAlt, border: `1px solid ${C.border}`,
                            borderRadius: 8, padding: 3,
                        }}>
                            {[
                                { id: "ro", label: "Air RO" },
                                { id: "isiulang", label: "Isi Ulang" },
                            ].map(opt => {
                                const active = (item.waterType || "ro") === opt.id;
                                return (
                                    <button key={opt.id} onClick={() => onSetWaterType(opt.id)} className="tap-feedback" style={{
                                        flex: 1, padding: "7px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                                        background: active ? C.surface : "transparent",
                                        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                        fontSize: 12.5, fontWeight: 700, color: active ? C.emerald700 : C.textMid,
                                    }}>{opt.label}</button>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Refill qty stepper (jumlah galon ditukar) */}
                <div style={{ display: "flex", gap: 10 }}>
                    <QtyStepper kind="refill" value={item.refillQty} onChange={onUpdateRefillQty} />
                </div>

                {/* Explanation */}
                <div style={{
                    marginTop: 8, padding: "8px 10px", background: C.emerald50, borderRadius: 6,
                    fontSize: 11, color: C.emerald700, lineHeight: 1.4,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span>⇄</span><strong>Refill — galon milik customer, tukar 1-lawan-1</strong>
                    </div>
                    <div style={{ paddingLeft: 18 }}>
                        Kosong masuk · isi keluar. Yang dijual air. Count operator tetap, outstanding tidak tersentuh. Bukan pickup, bukan jual.
                    </div>
                </div>
            </div>
        );
    }

    // SALE / PURCHASE — ownership transfer lines. Kembar secara struktur (kategori
    // + qty + kondisi), beda cuma arah. Tanpa toggle, tanpa drop/pickup.
    if (isSale || isPurchase) {
        const dir = isSale
            ? {
                label: "Jual", arrow: "→", qty: item.drop, onQty: onUpdateDrop, kind: "sale",
                title: "Jual — kepemilikan pindah ke customer",
                note: "Tanpa pickup. Outstanding tidak tersentuh. Unit keluar permanen dari pool."
            }
            : {
                label: "Beli", arrow: "←", qty: item.buyQty, onQty: onUpdateBuyQty, kind: "purchase",
                title: "Beli — kepemilikan pindah ke operator",
                note: "Unit masuk ke pool & naik ke kendaraan. Outstanding tidak tersentuh. Bukan pickup."
            };
        return (
            <div style={{
                background: C.surface,
                border: `1px solid ${C.sale100}`,
                borderLeft: `3px solid ${C.sale400}`,
                borderRadius: 12,
                padding: "12px 12px 14px",
                marginBottom: 10,
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</span>
                        <span style={{
                            padding: "1px 6px", borderRadius: 3, background: C.sale100, color: C.sale700,
                            fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>{dir.label}</span>
                    </div>
                    <button onClick={onRemove} className="tap-feedback" style={{
                        width: 28, height: 28, borderRadius: 6, background: "transparent", border: "none",
                        color: C.textDim, fontSize: 14, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>🗑</button>
                </div>

                {/* Condition toggle — kosong / penuh (berlaku untuk Jual & Beli) */}
                <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>
                    Kondisi unit
                </div>
                <div style={{
                    display: "flex", gap: 0, marginBottom: 12,
                    background: C.surfaceAlt, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: 3,
                }}>
                    {[
                        { id: "empty", label: "Kosong" },
                        { id: "full", label: "Penuh" },
                    ].map(opt => {
                        const active = (item.condition || "empty") === opt.id;
                        return (
                            <button key={opt.id} onClick={() => onSetCondition(opt.id)} className="tap-feedback" style={{
                                flex: 1, padding: "7px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                                background: active ? C.surface : "transparent",
                                boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                fontSize: 12.5, fontWeight: 700, color: active ? C.sale700 : C.textMid,
                            }}>{opt.label}</button>
                        );
                    })}
                </div>

                {/* Qty stepper (editable — Admin sets the plan) */}
                <div style={{ display: "flex", gap: 10 }}>
                    <QtyStepper kind={dir.kind} value={dir.qty} onChange={dir.onQty} />
                </div>

                {/* Explanation */}
                <div style={{
                    marginTop: 8, padding: "8px 10px", background: C.sale50, borderRadius: 6,
                    fontSize: 11, color: C.sale700, lineHeight: 1.4,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span>{dir.arrow}</span><strong>{dir.title}</strong>
                    </div>
                    <div style={{ paddingLeft: 18 }}>{dir.note}</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: C.surface,
            border: `1px solid ${isSale ? C.sale100 : C.border}`,
            borderRadius: 12,
            padding: "12px 12px 14px",
            marginBottom: 10,
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</span>
                        {isConsumable && (
                            <span style={{
                                padding: "1px 5px", borderRadius: 3,
                                background: C.slate100, color: C.slate600,
                                fontSize: 9, fontWeight: 600,
                                textTransform: "uppercase", letterSpacing: "0.04em",
                            }}>Consumable</span>
                        )}
                    </div>
                    {hasOutstanding && !isSale && (
                        <div style={{ fontSize: 10, color: C.violet700, marginTop: 2 }}>
                            Outstanding: {customerOutstanding.qty} · {customerOutstanding.lastDate}
                        </div>
                    )}
                </div>
                <button
                    onClick={onRemove}
                    className="tap-feedback"
                    style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        color: C.textDim,
                        fontSize: 14,
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                >🗑</button>
            </div>

            {/* Steppers — custody (Pinjam): drop + pickup */}
            <div style={{ display: "flex", gap: 10 }}>
                <QtyStepper
                    kind="drop"
                    value={item.drop}
                    onChange={onUpdateDrop}
                />
                {isReturnable && (
                    <QtyStepper
                        kind="pickup"
                        value={item.pickup}
                        onChange={onUpdatePickup}
                        suggested={item.pickupSuggested}
                        matchesSuggestion={matchesSuggestion}
                    />
                )}
            </div>

            {/* Pre-seed note — outstanding belum lengkap, suggestion dimatikan (LOAN only) */}
            {!isSale && genesisPending && isReturnable && (
                <div style={{
                    marginTop: 8, padding: "6px 10px", background: C.amber50, borderRadius: 6,
                    fontSize: 11, color: C.amber700, display: "flex", alignItems: "center", gap: 6,
                }}>
                    <span>⏳</span><span>Outstanding belum lengkap — pickup di-set manual (belum di-seed)</span>
                </div>
            )}

            {/* Pickup breakdown hint — Model B explanation */}
            {!isSale && !genesisPending && isReturnable && matchesSuggestion && item.pickup > 0 && (
                <div style={{
                    marginTop: 8,
                    padding: "8px 10px",
                    background: C.violet50,
                    borderRadius: 6,
                    fontSize: 11,
                    color: C.violet700,
                    lineHeight: 1.4,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span>↑</span>
                        <strong>Pickup breakdown:</strong>
                    </div>
                    <div style={{ paddingLeft: 18, fontSize: 11 }}>
                        {item.drop > 0 && (
                            <div>• {item.drop} <span style={{ color: C.textMid }}>exchange (kosong dari order)</span></div>
                        )}
                        {item.outstandingQty > 0 && (
                            <div>• {item.outstandingQty} <span style={{ color: C.textMid }}>clear outstanding lama</span></div>
                        )}
                        <div style={{ marginTop: 2, fontWeight: 600 }}>= {item.pickup} total pickup</div>
                    </div>
                </div>
            )}

            {/* Manually adjusted hint */}
            {!isSale && isReturnable && item.pickupManuallyAdjusted && (
                <div style={{
                    marginTop: 8,
                    padding: "6px 10px",
                    background: C.amber50,
                    borderRadius: 6,
                    fontSize: 11,
                    color: C.amber700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                }}>
                    <span>⚙</span>
                    <span>Pickup di-adjust manual · suggested = {item.pickupSuggested} (drop {item.drop} + outstanding {item.outstandingQty})</span>
                </div>
            )}
        </div>
    );
};

// ─── QTY STEPPER (admin variant) ───────────────────────────────────────────
const QtyStepper = ({ value, onChange, kind, suggested, matchesSuggestion }) => {
    const isDrop = kind === "drop";
    const isSale = kind === "sale";
    const isPurchase = kind === "purchase";
    const isRefill = kind === "refill";
    const accent = isRefill ? C.emerald700 : isSale || isPurchase ? C.sale600 : isDrop ? C.drop : C.violet700;
    const accentBg = isRefill ? C.emerald50 : isSale || isPurchase ? C.sale50 : isDrop ? C.dropBg : C.violet50;
    const accentBorder = isRefill ? C.emerald100 : isSale || isPurchase ? C.sale100 : isDrop ? C.drop + "22" : C.violet100;
    const directionSymbol = isRefill ? "⇄" : isPurchase ? "←" : isSale ? "→" : isDrop ? "↓" : "↑";
    const directionLabel = isRefill ? "Refill" : isPurchase ? "Beli" : isSale ? "Jual" : isDrop ? "Drop" : "Pickup";

    return (
        <div style={{
            flex: 1,
            background: matchesSuggestion ? C.violet50 : accentBg,
            border: `1.5px solid ${matchesSuggestion ? C.violet400 + "66" : accentBorder}`,
            borderRadius: 10,
            padding: "10px 10px 8px",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: accent, fontSize: 14, fontWeight: 700 }}>{directionSymbol}</span>
                    <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                        {directionLabel}
                    </span>
                </div>
                {suggested > 0 && (
                    <span style={{ fontSize: 10, color: C.violet700, fontWeight: 600 }}>
                        suggested <span className="mono">{suggested}</span>
                    </span>
                )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="tap-feedback"
                    style={{
                        width: 36, height: 36, borderRadius: 7,
                        background: C.surface, border: `1px solid ${C.border}`,
                        fontSize: 18, fontWeight: 600,
                        color: value === 0 ? C.textDim : C.text,
                        cursor: value === 0 ? "not-allowed" : "pointer",
                        flexShrink: 0,
                    }}
                >−</button>

                <div className="mono" style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.text,
                }}>
                    {value}
                </div>

                <button
                    onClick={() => onChange(value + 1)}
                    className="tap-feedback"
                    style={{
                        width: 36, height: 36, borderRadius: 7,
                        background: C.surface, border: `1px solid ${C.border}`,
                        fontSize: 18, fontWeight: 600,
                        color: C.text,
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                >+</button>
            </div>
        </div>
    );
};

// ─── PRODUCT PICKER SHEET ──────────────────────────────────────────────────
export const ProductPickerSheet = ({ itemsInTask, customerOutstanding, onSelect, onCancel }) => {
    const availableProducts = PRODUCT_CATALOG.filter(p => !itemsInTask.includes(p.id));

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
                maxHeight: "75%",
                display: "flex",
                flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>
                <div style={{ padding: "12px 18px 8px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Pilih Item</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>
                        Tap untuk tambah ke task
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }} className="scroll-thin">
                    {availableProducts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 20px", color: C.textMid }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                            <div style={{ fontSize: 13 }}>Semua item sudah ditambahkan</div>
                        </div>
                    ) : (
                        availableProducts.map(p => {
                            const outstanding = customerOutstanding.find(o => o.itemId === p.id);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className="tap-feedback"
                                    style={{
                                        width: "100%",
                                        background: outstanding ? C.violet50 : C.surface,
                                        border: `1px solid ${outstanding ? C.violet100 : C.border}`,
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
                                    <span style={{ fontSize: 20 }}>{p.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</span>
                                            {p.type === "consumable" && (
                                                <span style={{
                                                    padding: "1px 5px", borderRadius: 3,
                                                    background: C.slate100, color: C.slate600,
                                                    fontSize: 9, fontWeight: 600,
                                                    textTransform: "uppercase", letterSpacing: "0.04em",
                                                }}>Consumable</span>
                                            )}
                                        </div>
                                        {outstanding && (
                                            <div style={{ fontSize: 11, color: C.violet700, marginTop: 2 }}>
                                                ↑ Customer outstanding {outstanding.qty} · {outstanding.lastDate}
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ color: C.textDim, fontSize: 16 }}>›</span>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: VEHICLE ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════════════
// Admin anchors the order to a VEHICLE (reconciliation container), not a person.
// Who actually drives is decided later at warehouse loading / opening check.
export const VehicleAssignmentScreen = ({ customer, taskItems, selectedVehicle, onSelectVehicle, onBack, onNext }) => {
    const totalDrop = taskItems.reduce((s, i) => s + i.drop, 0);
    const totalPickup = taskItems.reduce((s, i) => s + i.pickup, 0);

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
                        Buat Task · Step 3/4
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                        Pilih Kendaraan
                    </div>
                </div>
            </div>

            {/* Context strip */}
            <div style={{
                background: C.adminAccentBg,
                borderBottom: `1px solid ${C.border}`,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: C.adminAccentDark,
                flexShrink: 0,
            }}>
                <span style={{ fontWeight: 600 }}>{customer.name}</span>
                <span style={{ color: C.textDim }}>·</span>
                <span>↓ {totalDrop}</span>
                <span>↑ {totalPickup}</span>
            </div>

            {/* Vehicle list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 100px" }} className="scroll-thin">
                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8, paddingLeft: 4 }}>
                    Kendaraan Tersedia
                </div>

                {VEHICLES.map(v => {
                    const isSelected = selectedVehicle?.id === v.id;
                    const isAvailable = v.status === "available";
                    const isAdhoc = !!v.adhoc;

                    return (
                        <button
                            key={v.id}
                            onClick={() => onSelectVehicle(v)}
                            className="tap-feedback slide-up"
                            style={{
                                width: "100%",
                                background: isSelected ? C.adminAccentBg : C.surface,
                                border: isAdhoc && !isSelected
                                    ? `1.5px dashed ${C.borderStrong}`
                                    : `1.5px solid ${isSelected ? C.adminAccent : C.border}`,
                                borderRadius: 12,
                                padding: "12px 14px",
                                marginBottom: 8,
                                cursor: "pointer",
                                textAlign: "left",
                                opacity: isAvailable ? 1 : 0.6,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: isSelected ? C.adminAccent : C.slate100,
                                    color: isSelected ? "#fff" : C.textMid,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 18, fontWeight: 700,
                                    flexShrink: 0,
                                    transition: "all 0.15s ease",
                                }}>
                                    {isAdhoc ? "＋" : "🚚"}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
                                        {v.plate}
                                    </div>
                                    <div style={{ fontSize: 11, color: C.textMid }}>
                                        {isAdhoc ? "Tentukan saat loading di gudang" : `${v.id} · ${v.type}`}
                                    </div>
                                    {!isAdhoc && (
                                        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                            {isAvailable ? (
                                                <Chip variant="emerald">Available</Chip>
                                            ) : (
                                                <Chip variant="amber">On Route</Chip>
                                            )}
                                            <span style={{ fontSize: 10, color: C.textDim }}>
                                                {v.taskCount} task hari ini
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isSelected && (
                                    <span style={{ color: C.adminAccent, fontSize: 20, flexShrink: 0 }}>✓</span>
                                )}
                            </div>
                        </button>
                    );
                })}

                {/* Relocated/softened note — who drives is a warehouse-stage decision */}
                <div style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    background: C.infoBlueBg,
                    border: `1px solid ${C.infoBlue}22`,
                    borderLeft: `3px solid ${C.infoBlue}`,
                    borderRadius: 8,
                    fontSize: 11,
                    color: C.text,
                    lineHeight: 1.5,
                }}>
                    <strong>Catatan:</strong> Admin nge-assign <strong>kendaraan</strong>, bukan orang. Siapa yang ngantar (driver / admin / orang gudang) ditentukan nanti saat loading di gudang.
                </div>
            </div>

            {/* Bottom action */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "10px 14px 12px",
                flexShrink: 0,
            }}>
                <button
                    onClick={() => selectedVehicle && onNext()}
                    disabled={!selectedVehicle}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: !selectedVehicle ? C.slate200 : C.adminAccent,
                        color: !selectedVehicle ? C.textDim : "#fff",
                        border: "none",
                        padding: "14px",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: selectedVehicle ? "pointer" : "not-allowed",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {!selectedVehicle ? "Pilih Kendaraan Dulu" : "Lanjut · Review Task →"}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: TASK SUMMARY & SUBMIT
// ═══════════════════════════════════════════════════════════════════════════
export const TaskSummaryScreen = ({ customer, taskItems, vehicle, onBack, onSubmit }) => {
    const totalDrop = taskItems.reduce((s, i) => s + i.drop, 0);
    const totalPickup = taskItems.reduce((s, i) => s + i.pickup, 0);

    // Model B breakdown:
    //   exchange = drops (kosong dari order yang akan dikumpulkan saat delivery)
    //   clearing = outstanding cleared (tabung lama yang dibalikin)
    const totalExchange = taskItems.reduce((s, i) => {
        if (i.type === "returnable") return s + Math.min(i.drop, i.pickup);
        return s;
    }, 0);
    const totalClearing = taskItems.reduce((s, i) => {
        if (i.type === "returnable" && i.pickup > i.drop) {
            return s + Math.min(i.pickup - i.drop, i.outstandingQty || 0);
        }
        return s;
    }, 0);
    const clearsOutstanding = totalClearing > 0;

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
                        Buat Task · Step 4/4
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                        Review & Submit
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px 100px" }} className="scroll-thin">

                {/* Customer card */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 12,
                }}>
                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 6 }}>
                        Customer
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{customer.avatar}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{customer.name}</div>
                            <div style={{ fontSize: 11, color: C.textMid }}>{customer.address}</div>
                            <div style={{ fontSize: 11, color: C.textMid, marginTop: 2 }}>{customer.pic}</div>
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 12,
                }}>
                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>
                        Item Task · {taskItems.length}
                    </div>
                    {taskItems.map((item, idx) => (
                        <div key={item.itemId} style={{
                            padding: "8px 0",
                            borderBottom: idx === taskItems.length - 1 ? "none" : `1px solid ${C.border}`,
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                        }}>
                            <span style={{ fontSize: 16 }}>{item.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.name}</span>
                                    {item.type === "consumable" && (
                                        <span style={{
                                            padding: "1px 5px", borderRadius: 3,
                                            background: C.slate100, color: C.slate600,
                                            fontSize: 9, fontWeight: 600,
                                            textTransform: "uppercase", letterSpacing: "0.04em",
                                        }}>C</span>
                                    )}
                                    {item.transactionType === "SALE" && (
                                        <>
                                            <span style={{
                                                padding: "1px 5px", borderRadius: 3,
                                                background: C.sale100, color: C.sale700,
                                                fontSize: 9, fontWeight: 700,
                                                textTransform: "uppercase", letterSpacing: "0.04em",
                                            }}>Jual</span>
                                            {item.condition && (
                                                <span style={{
                                                    padding: "1px 5px", borderRadius: 3,
                                                    background: C.slate100, color: C.slate600,
                                                    fontSize: 9, fontWeight: 600,
                                                    textTransform: "uppercase", letterSpacing: "0.04em",
                                                }}>{item.condition === "empty" ? "Kosong" : "Penuh"}</span>
                                            )}
                                        </>
                                    )}
                                    {item.transactionType === "PURCHASE" && (
                                        <>
                                            <span style={{
                                                padding: "1px 5px", borderRadius: 3,
                                                background: C.sale100, color: C.sale700,
                                                fontSize: 9, fontWeight: 700,
                                                textTransform: "uppercase", letterSpacing: "0.04em",
                                            }}>Beli</span>
                                            <span style={{
                                                padding: "1px 5px", borderRadius: 3,
                                                background: C.slate100, color: C.slate600,
                                                fontSize: 9, fontWeight: 600,
                                                textTransform: "uppercase", letterSpacing: "0.04em",
                                            }}>{item.condition === "empty" ? "Kosong" : "Penuh"}</span>
                                        </>
                                    )}
                                    {item.transactionType === "REFILL" && (
                                        <>
                                            <span style={{
                                                padding: "1px 5px", borderRadius: 3,
                                                background: C.emerald100, color: C.emerald700,
                                                fontSize: 9, fontWeight: 700,
                                                textTransform: "uppercase", letterSpacing: "0.04em",
                                            }}>Refill</span>
                                            {item.waterType && (
                                                <span style={{
                                                    padding: "1px 5px", borderRadius: 3,
                                                    background: C.slate100, color: C.slate600,
                                                    fontSize: 9, fontWeight: 600,
                                                    textTransform: "uppercase", letterSpacing: "0.04em",
                                                }}>{item.waterType === "ro" ? "RO" : "Isi Ulang"}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                                {item.transactionType === "SALE" ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                        <span style={{ color: C.sale600, fontWeight: 700 }}>→</span>
                                        <span className="mono" style={{ color: C.text, fontWeight: 700 }}>{item.drop}</span>
                                    </div>
                                ) : item.transactionType === "PURCHASE" ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                        <span style={{ color: C.sale600, fontWeight: 700 }}>←</span>
                                        <span className="mono" style={{ color: C.text, fontWeight: 700 }}>{item.buyQty}</span>
                                    </div>
                                ) : item.transactionType === "REFILL" ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                        <span style={{ color: C.emerald700, fontWeight: 700 }}>⇄</span>
                                        <span className="mono" style={{ color: C.text, fontWeight: 700 }}>{item.refillQty}</span>
                                    </div>
                                ) : (
                                    <>
                                        {item.drop > 0 && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                                <span style={{ color: C.drop, fontWeight: 700 }}>↓</span>
                                                <span className="mono" style={{ color: C.text, fontWeight: 700 }}>{item.drop}</span>
                                            </div>
                                        )}
                                        {item.pickup > 0 && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                                <span style={{ color: C.violet700, fontWeight: 700 }}>↑</span>
                                                <span className="mono" style={{ color: C.text, fontWeight: 700 }}>{item.pickup}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Totals */}
                    <div style={{
                        marginTop: 10, paddingTop: 10,
                        borderTop: `1px solid ${C.border}`,
                        display: "flex", gap: 14, fontSize: 12,
                    }}>
                        <div>
                            <span style={{ color: C.textMid }}>Total drop: </span>
                            <span className="mono" style={{ color: C.drop, fontWeight: 700 }}>{totalDrop}</span>
                        </div>
                        <div>
                            <span style={{ color: C.textMid }}>Total pickup: </span>
                            <span className="mono" style={{ color: C.violet700, fontWeight: 700 }}>{totalPickup}</span>
                        </div>
                    </div>
                </div>

                {/* Vehicle */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 12,
                }}>
                    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 6 }}>
                        Kendaraan Ditugaskan
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: C.adminAccent, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            {vehicle.adhoc ? "＋" : "🚚"}
                        </div>
                        <div>
                            <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{vehicle.plate}</div>
                            <div style={{ fontSize: 11, color: C.textMid }}>
                                {vehicle.adhoc ? "Ditentukan saat loading di gudang" : `${vehicle.id} · ${vehicle.type}`}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 10, color: C.textDim, lineHeight: 1.4 }}>
                        Siapa yang ngantar ditentukan saat loading di gudang.
                    </div>
                </div>

                {/* Pickup breakdown — Model B */}
                {totalPickup > 0 && (
                    <div style={{
                        background: C.violet50,
                        border: `1px solid ${C.violet100}`,
                        borderLeft: `3px solid ${C.violet400}`,
                        borderRadius: 10,
                        padding: "12px 14px",
                        marginBottom: 12,
                        fontSize: 12,
                        color: C.violet700,
                        lineHeight: 1.6,
                    }}>
                        <strong>Pickup Breakdown:</strong>
                        <div style={{ marginTop: 6, paddingLeft: 4 }}>
                            {totalExchange > 0 && (
                                <div>• <strong>{totalExchange}</strong> exchange <span style={{ color: C.textMid }}>(kosong dari delivery hari ini)</span></div>
                            )}
                            {totalClearing > 0 && (
                                <div>• <strong>{totalClearing}</strong> clearing <span style={{ color: C.textMid }}>(outstanding lama)</span></div>
                            )}
                            <div style={{ marginTop: 4, fontWeight: 700 }}>
                                = {totalPickup} total expected pickup
                            </div>
                        </div>
                        {clearsOutstanding && (
                            <div style={{ marginTop: 8, fontSize: 11, fontStyle: "italic" }}>
                                Outstanding customer akan berkurang sebanyak {totalClearing} kalau pickup berhasil sesuai plan.
                            </div>
                        )}
                    </div>
                )}

                {/* What happens next */}
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
                    <strong>Setelah submit:</strong>
                    <ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                        <li>Task ke-assign ke <strong className="mono">{vehicle.plate}</strong> <Chip variant="slate">Nunggu Loading</Chip></li>
                        <li>Pas loading di gudang, ditentuin siapa yang ngantar</li>
                        <li>Executor confirm custody muatan → mulai jalan</li>
                        <li>Customer dapat notif via WA (opsional)</li>
                    </ol>
                </div>
            </div>

            {/* Submit */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "10px 14px 12px",
                flexShrink: 0,
            }}>
                <button
                    onClick={onSubmit}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: C.adminAccent,
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
                    ✓ Buat Task & Assign Kendaraan
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS SCREEN
// ═══════════════════════════════════════════════════════════════════════════
export const SuccessScreen = ({ customer, taskItems, vehicle, taskId, onCreateAnother, onBackToFeed }) => {
    const totalDrop = taskItems.reduce((s, i) => s + i.drop, 0);
    const totalPickup = taskItems.reduce((s, i) => s + i.pickup, 0);

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{
                background: C.surface,
                borderBottom: `1px solid ${C.border}`,
                padding: "14px 16px",
                flexShrink: 0,
            }}>
                <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                    Task Created
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                    {taskId}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 100px" }} className="scroll-thin">
                {/* Success banner */}
                <div style={{
                    background: C.emerald50,
                    border: `1px solid ${C.emerald100}`,
                    borderRadius: 12,
                    padding: "24px 20px",
                    marginBottom: 16,
                    textAlign: "center",
                }} className="pop">
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
                        Task Berhasil Dibuat
                    </div>
                    <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>
                        <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{taskId}</span> untuk {customer.name} sudah ke-assign ke <span className="mono" style={{ color: C.text, fontWeight: 600 }}>{vehicle.plate}</span>.
                    </div>
                </div>

                {/* Summary card */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 16,
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                            <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                                Customer
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{customer.name}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                                Kendaraan
                            </div>
                            <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{vehicle.plate}</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        <div style={{ flex: 1, padding: "8px 10px", background: C.dropBg, borderRadius: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                <span style={{ color: C.drop, fontSize: 12, fontWeight: 700 }}>↓</span>
                                <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Drop</span>
                            </div>
                            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{totalDrop}</div>
                        </div>
                        <div style={{ flex: 1, padding: "8px 10px", background: C.violet50, borderRadius: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                                <span style={{ color: C.violet700, fontSize: 12, fontWeight: 700 }}>↑</span>
                                <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Pickup</span>
                            </div>
                            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{totalPickup}</div>
                        </div>
                    </div>
                </div>

                {/* Next step hint */}
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
                    Task sudah ke-anchor ke kendaraan dan nunggu loading di gudang. Siapa yang ngantar ditentukan saat loading.
                </div>
            </div>

            {/* Bottom actions */}
            <div style={{
                background: C.surface,
                borderTop: `1px solid ${C.border}`,
                padding: "10px 14px 12px",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}>
                <button
                    onClick={onCreateAnother}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: C.adminAccent,
                        color: "#fff",
                        border: "none",
                        padding: "14px",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    + Buat Task Lagi
                </button>
                <button
                    onClick={onBackToFeed}
                    className="tap-feedback"
                    style={{
                        width: "100%",
                        background: C.surface,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                        padding: "12px",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                    }}
                >
                    Kembali ke Admin Feed
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// NEW CUSTOMER (inline onboarding) · STEP 1 — Data
// ═══════════════════════════════════════════════════════════════════════════
// Genesis doctrine: new customer = opening balance 0 → verified immediately.
// On commit we emit ONE MOVEMENT.opening_balance_recorded (qty 0, source=new_customer)
// and drop straight into Item Builder with zero outstanding — Model B then suggests
// pickup = drop (no clearing), which is correct for a fresh customer.
export const NewCustomerScreen = ({ data, onChange, onBack, onNext }) => {
    const set = (k, v) => onChange({ ...data, [k]: v });
    const valid = data.name.trim().length >= 2 && data.type;

    // function form (not a nested component) so the input keeps focus on each keystroke
    const field = (label, key, placeholder, required) => (
        <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>
                {label} {required && <span style={{ color: C.amber700 }}>*</span>}
            </div>
            <input
                value={data[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                style={{
                    width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: "11px 12px", fontSize: 14, color: C.text,
                    outline: "none", background: C.surfaceAlt,
                }}
            />
        </div>
    );

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            {/* Header */}
            <div style={{
                background: C.surface, borderBottom: `1px solid ${C.border}`,
                padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}>
                <button onClick={onBack} className="tap-feedback" style={{
                    width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none",
                    fontSize: 18, color: C.text, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                        Customer Baru · Step 1/2
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Data Customer</div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 120px" }} className="scroll-thin">
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px" }}>
                    {field("Nama Customer", "name", "Mis. Kopi Kenangan Bintaro", true)}

                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 6 }}>
                            Tipe <span style={{ color: C.amber700 }}>*</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {CUSTOMER_TYPES.map(t => (
                                <button key={t.id} onClick={() => set("type", t.id)} className="tap-feedback" style={{
                                    display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8,
                                    border: `1.5px solid ${data.type === t.id ? C.adminAccent : C.border}`,
                                    background: data.type === t.id ? C.adminAccentBg : C.surface,
                                    color: data.type === t.id ? C.adminAccent : C.textMid,
                                    fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                                }}>
                                    <span>{t.icon}</span>{t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {field("Alamat", "address", "Alamat pengiriman", false)}
                    {field("PIC / Kontak", "pic", "Nama · No. HP", false)}
                </div>

                <div style={{ height: 14 }} />
                <DoctrineNote tone="emerald" icon="✓" title="Customer baru = saldo awal 0">
                    Customer baru belum pegang apa-apa, jadi saldo awalnya 0 dan langsung <strong>verified</strong> —
                    tidak ada outstanding lama untuk di-clear. Outstanding mulai terbentuk dari transaksi pertama.
                </DoctrineNote>
            </div>

            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", flexShrink: 0 }}>
                <button onClick={() => valid && onNext()} disabled={!valid} className="tap-feedback" style={{
                    width: "100%", background: !valid ? C.slate200 : C.adminAccent, color: !valid ? C.textDim : "#fff",
                    border: "none", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                    cursor: valid ? "pointer" : "not-allowed", textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                    {valid ? "Lanjut · Review →" : "Isi Nama & Tipe"}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// NEW CUSTOMER (inline onboarding) · STEP 2 — Review + create (genesis qty 0)
// ═══════════════════════════════════════════════════════════════════════════
export const NewCustomerReviewScreen = ({ data, onBack, onSubmit }) => {
    const typeMeta = CUSTOMER_TYPES.find(t => t.id === data.type) || { label: "—", icon: "🏢" };

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            {/* Header */}
            <div style={{
                background: C.surface, borderBottom: `1px solid ${C.border}`,
                padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}>
                <button onClick={onBack} className="tap-feedback" style={{
                    width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none",
                    fontSize: 18, color: C.text, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                        Customer Baru · Step 2/2
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Review & Daftar</div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 130px" }} className="scroll-thin">
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 10, background: C.slate100,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                        }}>{typeMeta.icon}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{data.name}</div>
                            <div style={{ fontSize: 11, color: C.textMid }}>
                                {typeMeta.label}{data.address ? ` · ${data.address}` : ""}
                            </div>
                        </div>
                    </div>
                    {data.pic && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textMid }}>
                            PIC: {data.pic}
                        </div>
                    )}
                </div>

                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8, paddingLeft: 4 }}>
                    Akan dicatat sebagai
                </div>
                <div className="mono" style={{
                    background: "#0f172a", color: "#cbd5e1", borderRadius: 10, padding: "12px 14px",
                    fontSize: 11, lineHeight: 1.6, marginBottom: 12, overflowX: "auto",
                }}>
                    <div><span style={{ color: "#7dd3fc" }}>MOVEMENT.opening_balance_recorded</span></div>
                    <div style={{ color: "#64748b" }}>movement_type: <span style={{ color: "#a5b4fc" }}>GENESIS</span></div>
                    <div style={{ color: "#64748b" }}>opening_qty: <span style={{ color: "#86efac" }}>0</span></div>
                    <div style={{ color: "#64748b" }}>source: <span style={{ color: "#86efac" }}>new_customer</span></div>
                    <div style={{ color: "#64748b" }}>seed_confidence: <span style={{ color: "#86efac" }}>verified</span></div>
                </div>

                <DoctrineNote tone="emerald" icon="✓" title="Langsung verified">
                    Anchor genesis qty 0. Tidak ada window pre-seed, tidak ada provisional. Setelah daftar,
                    customer ini langsung lanjut ke item task dengan outstanding 0.
                </DoctrineNote>
            </div>

            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", flexShrink: 0 }}>
                <button onClick={onSubmit} className="tap-feedback" style={{
                    width: "100%", background: C.emerald700, color: "#fff", border: "none",
                    padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                    Daftarkan & Lanjut ke Item →
                </button>
            </div>
        </div>
    );
};

// ─── GENESIS STEPPER (single value · violet = custody/outstanding) ─────────
const GenesisStepper = ({ value, onChange }) => (
    <div style={{ background: C.violet50, border: `1.5px solid ${C.violet100}`, borderRadius: 10, padding: "10px 10px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <span style={{ color: C.violet700, fontSize: 14, fontWeight: 700 }}>↑</span>
            <span style={{ fontSize: 10, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>
                Saldo awal (di customer)
            </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => onChange(Math.max(0, value - 1))} className="tap-feedback" style={{
                width: 36, height: 36, borderRadius: 7, background: C.surface, border: `1px solid ${C.border}`,
                fontSize: 18, fontWeight: 600, color: value === 0 ? C.textDim : C.text,
                cursor: value === 0 ? "not-allowed" : "pointer", flexShrink: 0,
            }}>−</button>
            <div className="mono" style={{ flex: 1, textAlign: "center", fontSize: 22, fontWeight: 700, color: C.text }}>{value}</div>
            <button onClick={() => onChange(value + 1)} className="tap-feedback" style={{
                width: 36, height: 36, borderRadius: 7, background: C.surface, border: `1px solid ${C.border}`,
                fontSize: 18, fontWeight: 600, color: C.text, cursor: "pointer", flexShrink: 0,
            }}>+</button>
        </div>
    </div>
);

// ─── REFILL CATEGORY SHEET (galon air — content/service) ───────────────────
export const RefillCategorySheet = ({ inTask, onSelect, onCancel }) => {
    // Refill = galon milik customer (air). Scope: galon Water. Gas = custody (DROP/PICKUP).
    const available = PRODUCT_CATALOG.filter(p => p.type === "returnable" && p.category === "Water" && !inTask.includes(p.id));
    return (
        <>
            <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
            <div className="sheet-up" style={{
                position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface,
                borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 11, maxHeight: "70%",
                display: "flex", flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>
                <div style={{ padding: "12px 18px 8px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Refill — Pilih Galon</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Galon milik customer · tukar 1-lawan-1 · jual air</div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }} className="scroll-thin">
                    {available.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 20px", color: C.textMid, fontSize: 13 }}>Semua galon sudah ditambahkan</div>
                    ) : available.map(p => (
                        <button key={p.id} onClick={() => onSelect(p)} className="tap-feedback" style={{
                            width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                            padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left",
                            display: "flex", alignItems: "center", gap: 12,
                        }}>
                            <span style={{ fontSize: 20 }}>{p.icon}</span>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</span>
                            <span style={{ color: C.textDim, fontSize: 16 }}>›</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

// ─── TRANSFER KEPEMILIKAN SHEET (Jual / Beli → kategori) ───────────────────
// Satu pintu untuk ownership transfer. Step 1: arah (Jual/Beli). Step 2: kategori.
export const TransferKepemilikanSheet = ({ inTask, onSelect, onCancel }) => {
    const [dir, setDir] = useState(null); // null | "SALE" | "PURCHASE"
    const available = PRODUCT_CATALOG.filter(p => p.type === "returnable" && !inTask.includes(p.id));
    return (
        <>
            <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
            <div className="sheet-up" style={{
                position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface,
                borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 11, maxHeight: "75%",
                display: "flex", flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>

                {!dir ? (
                    <>
                        <div style={{ padding: "12px 18px 8px" }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Transfer Kepemilikan</div>
                            <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Kepemilikan pindah — pilih arah</div>
                        </div>
                        <div style={{ padding: "8px 14px 18px" }}>
                            {[
                                { id: "SALE", arrow: "→", label: "Jual ke customer", sub: "Kepemilikan keluar ke customer" },
                                { id: "PURCHASE", arrow: "←", label: "Beli dari customer", sub: "Kepemilikan masuk ke operator" },
                            ].map(o => (
                                <button key={o.id} onClick={() => setDir(o.id)} className="tap-feedback" style={{
                                    width: "100%", background: C.sale50, border: `1px solid ${C.sale100}`,
                                    borderLeft: `3px solid ${C.sale400}`, borderRadius: 10,
                                    padding: "14px", marginBottom: 10, cursor: "pointer", textAlign: "left",
                                    display: "flex", alignItems: "center", gap: 12,
                                }}>
                                    <span style={{ fontSize: 22, fontWeight: 700, color: C.sale600 }}>{o.arrow}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: C.sale700 }}>{o.label}</div>
                                        <div style={{ fontSize: 11, color: C.textMid, marginTop: 1 }}>{o.sub}</div>
                                    </div>
                                    <span style={{ color: C.textDim, fontSize: 16 }}>›</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ padding: "12px 18px 8px", display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => setDir(null)} className="tap-feedback" style={{
                                background: "transparent", border: "none", fontSize: 16, color: C.textMid, cursor: "pointer", padding: 0,
                            }}>←</button>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                                    {dir === "SALE" ? "Jual — pilih kategori" : "Beli — pilih kategori"}
                                </div>
                                <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Returnable only · qty & kondisi di-set setelah ini</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }} className="scroll-thin">
                            {available.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "30px 20px", color: C.textMid }}>
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                                    <div style={{ fontSize: 13 }}>Semua kategori sudah ditambahkan</div>
                                </div>
                            ) : available.map(p => (
                                <button key={p.id} onClick={() => onSelect(p, dir)} className="tap-feedback" style={{
                                    width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                                    padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left",
                                    display: "flex", alignItems: "center", gap: 12,
                                }}>
                                    <span style={{ fontSize: 20 }}>{p.icon}</span>
                                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</span>
                                    <span style={{ color: C.textDim, fontSize: 16 }}>›</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

// ─── SEED CATEGORY SHEET (returnable only) ─────────────────────────────────
const SeedCategorySheet = ({ inTask, recorded, onSelect, onCancel }) => {
    const available = PRODUCT_CATALOG.filter(p => p.type === "returnable" && !inTask.includes(p.id));
    return (
        <>
            <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
            <div className="sheet-up" style={{
                position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface,
                borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 11, maxHeight: "75%",
                display: "flex", flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>
                <div style={{ padding: "12px 18px 8px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Pilih Kategori Returnable</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Consumable tidak punya outstanding</div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }} className="scroll-thin">
                    {available.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 20px", color: C.textMid }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                            <div style={{ fontSize: 13 }}>Semua kategori sudah ditambahkan</div>
                        </div>
                    ) : available.map(p => {
                        const rec = (recorded || []).find(r => r.itemId === p.id);
                        return (
                            <button key={p.id} onClick={() => onSelect(p)} className="tap-feedback" style={{
                                width: "100%", background: rec ? C.violet50 : C.surface,
                                border: `1px solid ${rec ? C.violet100 : C.border}`, borderRadius: 10,
                                padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left",
                                display: "flex", alignItems: "center", gap: 12,
                            }}>
                                <span style={{ fontSize: 20 }}>{p.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</span>
                                    {rec && <div style={{ fontSize: 11, color: C.violet700, marginTop: 2 }}>Catatan lama: {rec.qty}</div>}
                                </div>
                                <span style={{ color: C.textDim, fontSize: 16 }}>›</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SEED DETOUR · STEP 1 — Opening balance per returnable category
// ═══════════════════════════════════════════════════════════════════════════
export const SeedQtyScreen = ({ customer, items, onUpdate, onBack, onNext }) => {
    const [showPicker, setShowPicker] = useState(false);
    const inTask = items.map(i => i.itemId);

    const addCategory = (cat) => {
        const rec = (customer.recordedHolding || []).find(r => r.itemId === cat.id);
        onUpdate([...items, { itemId: cat.id, name: cat.name, icon: cat.icon, qty: rec ? rec.qty : 0 }]);
        setShowPicker(false);
    };
    const updateQty = (id, v) => onUpdate(items.map(i => i.itemId === id ? { ...i, qty: Math.max(0, v) } : i));
    const removeCategory = (id) => onUpdate(items.filter(i => i.itemId !== id));
    const total = items.reduce((s, i) => s + i.qty, 0);
    const canProceed = items.length > 0;

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={onBack} className="tap-feedback" style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none", fontSize: 18, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Seed Saldo Awal · Step 1/3</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Saldo di Customer</div>
                </div>
            </div>

            <div style={{ background: C.adminAccentBg, borderBottom: `1px solid ${C.border}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 16 }}>{customer.avatar}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{customer.name}</div>
                    <div style={{ fontSize: 11, color: C.textMid }}>{customer.pic}</div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 130px" }} className="scroll-thin">
                <DoctrineNote tone="violet" icon="↑" title="Saldo awal = custody di customer">
                    Masukkan jumlah tabung/galon <strong>returnable</strong> yang customer ini sudah pegang sekarang
                    (dari catatan/buku besar lama). Hanya item returnable — consumable tidak punya outstanding.
                </DoctrineNote>
                <div style={{ height: 14 }} />

                {items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 20px", background: C.surface, border: `1px dashed ${C.borderStrong}`, borderRadius: 12 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📒</div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: C.text }}>Belum ada kategori</div>
                        <div style={{ fontSize: 12, color: C.textMid, marginBottom: 16 }}>Tambah kategori yang customer pegang</div>
                        <button onClick={() => setShowPicker(true)} className="tap-feedback" style={{ background: C.adminAccent, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em" }}>+ Tambah Kategori</button>
                    </div>
                ) : (
                    <>
                        <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8, paddingLeft: 4 }}>Kategori · {items.length}</div>
                        {items.map(item => {
                            const rec = (customer.recordedHolding || []).find(r => r.itemId === item.itemId);
                            return (
                                <div key={item.itemId} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 12px 14px", marginBottom: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</span>
                                            {rec && <div style={{ fontSize: 10, color: C.textMid, marginTop: 2 }}>Catatan lama: {rec.qty} · bisa di-adjust</div>}
                                        </div>
                                        <button onClick={() => removeCategory(item.itemId)} className="tap-feedback" style={{ width: 28, height: 28, borderRadius: 6, background: "transparent", border: "none", color: C.textDim, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>🗑</button>
                                    </div>
                                    <GenesisStepper value={item.qty} onChange={(v) => updateQty(item.itemId, v)} />
                                </div>
                            );
                        })}
                        <button onClick={() => setShowPicker(true)} className="tap-feedback" style={{ width: "100%", background: "transparent", border: `1px dashed ${C.borderStrong}`, borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 600, color: C.adminAccent, cursor: "pointer", marginTop: 4 }}>+ Tambah Kategori Lain</button>
                    </>
                )}
            </div>

            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", flexShrink: 0, boxShadow: "0 -4px 12px rgba(0,0,0,0.04)" }}>
                {items.length > 0 && (
                    <div style={{ display: "flex", gap: 10, marginBottom: 10, padding: "8px 12px", background: C.surfaceAlt, borderRadius: 8, fontSize: 11 }}>
                        <div style={{ flex: 1 }}><span style={{ color: C.textMid }}>Total saldo awal: </span><span className="mono" style={{ color: C.violet700, fontWeight: 700 }}>{total}</span></div>
                        <div style={{ color: C.textDim }}>{items.length} kategori</div>
                    </div>
                )}
                <button onClick={() => canProceed && onNext()} disabled={!canProceed} className="tap-feedback" style={{ width: "100%", background: !canProceed ? C.slate200 : C.adminAccent, color: !canProceed ? C.textDim : "#fff", border: "none", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: canProceed ? "pointer" : "not-allowed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {!canProceed ? "Tambah Kategori Dulu" : "Lanjut · Catatan →"}
                </button>
            </div>

            {showPicker && (
                <SeedCategorySheet inTask={inTask} recorded={customer.recordedHolding} onSelect={addCategory} onCancel={() => setShowPicker(false)} />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SEED DETOUR · STEP 2 — Basis + occurred_at anchor
// ═══════════════════════════════════════════════════════════════════════════
export const SeedBasisScreen = ({ basis, onBasis, onBack, onNext }) => {
    const valid = basis.trim().length >= 10;
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={onBack} className="tap-feedback" style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none", fontSize: 18, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Seed Saldo Awal · Step 2/3</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Dasar Pencatatan</div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 120px" }} className="scroll-thin">
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px" }}>
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8 }}>Anchor Chronology</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: C.adminAccentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📌</div>
                        <div style={{ flex: 1 }}>
                            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: C.text }}>01 Jan 2026</div>
                            <div style={{ fontSize: 11, color: C.textMid }}>Go-Live · occurred_at</div>
                        </div>
                        <Chip variant="slate">Tetap</Chip>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <DoctrineNote tone="info" icon="🕓" title="Dicatat sekarang, berlaku surut">
                            Saldo di-anchor ke tanggal go-live, bukan hari ini. Transaksi yang sudah jalan otomatis
                            tersusun <strong>di atas</strong> saldo ini saat sistem menghitung ulang — outstanding langsung benar.
                        </DoctrineNote>
                    </div>
                </div>
                <div style={{ height: 14 }} />
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Dari mana angka ini? <span style={{ color: C.amber700 }}>*</span></div>
                    <div style={{ fontSize: 11, color: C.textMid, marginBottom: 10, lineHeight: 1.4 }}>Sumber catatan saldo awal (buku besar, kartu stok). Disimpan sebagai basis audit.</div>
                    <textarea value={basis} onChange={(e) => onBasis(e.target.value)} placeholder="Contoh: Carryover dari buku besar manual per 31 Des 2025." rows={3}
                        style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.text, outline: "none", resize: "none", background: C.surfaceAlt, lineHeight: 1.5 }} />
                    <div style={{ fontSize: 10.5, color: valid ? C.emerald700 : C.textDim, marginTop: 6 }}>
                        {valid ? "✓ Cukup" : `Minimal 10 karakter · ${basis.trim().length}/10`}
                    </div>
                </div>
            </div>

            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", flexShrink: 0 }}>
                <button onClick={() => valid && onNext()} disabled={!valid} className="tap-feedback" style={{ width: "100%", background: !valid ? C.slate200 : C.adminAccent, color: !valid ? C.textDim : "#fff", border: "none", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {valid ? "Lanjut · Review →" : "Isi Dasar Pencatatan"}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// SEED DETOUR · STEP 3 — Review + emit (returns to Item Builder)
// ═══════════════════════════════════════════════════════════════════════════
export const SeedReviewScreen = ({ customer, items, onBack, onSubmit }) => {
    const total = items.reduce((s, i) => s + i.qty, 0);
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={onBack} className="tap-feedback" style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none", fontSize: 18, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Seed Saldo Awal · Step 3/3</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Review & Catat</div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 130px" }} className="scroll-thin">
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{customer.avatar}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{customer.name}</div>
                            <div style={{ fontSize: 11, color: C.textMid }}>{customer.address}</div>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8, paddingLeft: 4 }}>Saldo Awal · {items.length} kategori</div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                    {items.map((i, idx) => (
                        <div key={i.itemId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: idx < items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                            <span style={{ fontSize: 18 }}>{i.icon}</span>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{i.name}</span>
                            <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: C.violet700 }}>↑ {i.qty}</span>
                        </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.violet50 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.violet700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total outstanding awal</span>
                        <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: C.violet700 }}>{total}</span>
                    </div>
                </div>

                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 8, paddingLeft: 4 }}>Akan dicatat sebagai</div>
                <div className="mono" style={{ background: "#0f172a", color: "#cbd5e1", borderRadius: 10, padding: "12px 14px", fontSize: 11, lineHeight: 1.6, marginBottom: 12, overflowX: "auto" }}>
                    <div><span style={{ color: "#7dd3fc" }}>{items.length}× MOVEMENT.opening_balance_recorded</span></div>
                    <div style={{ color: "#64748b" }}>movement_type: <span style={{ color: "#a5b4fc" }}>GENESIS</span></div>
                    <div style={{ color: "#64748b" }}>source: <span style={{ color: "#fcd34d" }}>admin_seed</span></div>
                    <div style={{ color: "#64748b" }}>seed_confidence: <span style={{ color: "#fcd34d" }}>provisional</span></div>
                    <div style={{ color: "#64748b" }}>occurred_at: <span style={{ color: "#86efac" }}>01 Jan 2026</span></div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <DoctrineNote tone="violet" icon="◐" title="Status awal: Provisional">
                        Saldo dari catatan, belum dikonfirmasi operasi. Otomatis <strong>verified</strong> setelah satu siklus
                        reconciliation bersih. Selama provisional, alarm dini dilembutkan.
                    </DoctrineNote>
                    <DoctrineNote tone="amber" icon="🔒" title="Cuma sekali — tidak bisa di-seed ulang">
                        Kalau angka ini salah, koreksinya lewat <strong>penyesuaian (Supervisor)</strong>, bukan seed ulang.
                    </DoctrineNote>
                </div>
            </div>

            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", flexShrink: 0 }}>
                <button onClick={onSubmit} className="tap-feedback" style={{ width: "100%", background: C.violet700, color: "#fff", border: "none", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Catat & Kembali ke Item →
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
// ─── ORIGIN SCREEN (planned vs walk-in) ────────────────────────────────────
export const OriginScreen = ({ onPlanned, onWalkIn, returnedTasks = [], onReassign }) => (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Buat Task</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Order ini dari mana?</div>
        </div>
        <div style={{ flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }} className="scroll-thin">
            {returnedTasks.length > 0 && (
                <div style={{ background: C.amber50, border: `1px solid ${C.amber400}44`, borderLeft: `3px solid ${C.amber400}`, borderRadius: 12, padding: "12px 14px", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 16 }}>↩️</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.amber700 }}>Task Dikembalikan Driver · {returnedTasks.length}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.textMid, marginBottom: 10, lineHeight: 1.4 }}>Ditolak karena tidak searah — assign ulang ke kendaraan lain.</div>
                    {returnedTasks.map(t => (
                        <div key={t.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.customer}</div>
                                    <div style={{ fontSize: 11, color: C.textMid, marginTop: 1 }}>dari {t.fromVehicle} · {t.driver}</div>
                                </div>
                                <button onClick={() => onReassign(t)} className="tap-feedback" style={{
                                    flexShrink: 0, background: C.adminAccent, color: "#fff", border: "none",
                                    fontSize: 11.5, fontWeight: 700, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                                }}>Assign Ulang</button>
                            </div>
                            {t.reason && (
                                <div style={{ marginTop: 8, padding: "6px 9px", background: C.surfaceAlt, borderRadius: 6, fontSize: 11, color: C.textMid, fontStyle: "italic" }}>
                                    "{t.reason}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <button onClick={onPlanned} className="tap-feedback" style={{
                background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.adminAccent}`,
                borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 14,
            }}>
                <span style={{ fontSize: 26 }}>🗺️</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Task Terencana</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Admin rencanakan → assign ke route → driver kirim</div>
                </div>
                <span style={{ color: C.textDim, fontSize: 18 }}>›</span>
            </button>
            <button onClick={onWalkIn} className="tap-feedback" style={{
                background: C.sale50, border: `1px solid ${C.sale100}`, borderLeft: `3px solid ${C.sale400}`,
                borderRadius: 12, padding: "16px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 14,
            }}>
                <span style={{ fontSize: 26 }}>🚶</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.sale700 }}>Walk-in · Counter</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Customer datang ke depo — dibawa langsung / dikirim</div>
                </div>
                <span style={{ color: C.sale600, fontSize: 18 }}>›</span>
            </button>
        </div>
    </div>
);

// ─── REASSIGN SHEET (task dikembalikan → kendaraan lain) ───────────────────
export const ReassignSheet = ({ task, onConfirm, onCancel }) => {
    const [vehicle, setVehicle] = useState(null);
    const options = VEHICLES.filter(v => v.plate !== task.fromVehicle);
    return (
        <>
            <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.55)", zIndex: 20 }} />
            <div className="sheet-up" style={{
                position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface,
                borderTopLeftRadius: 18, borderTopRightRadius: 18, zIndex: 21, maxHeight: "78%",
                display: "flex", flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>
                <div style={{ padding: "10px 18px 6px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Assign Ulang Task</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>{task.customer} · ditolak dari {task.fromVehicle}</div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 4px" }} className="scroll-thin">
                    <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: 8, paddingLeft: 2 }}>Pilih kendaraan lain</div>
                    {options.map(v => {
                        const active = vehicle?.id === v.id;
                        return (
                            <button key={v.id} onClick={() => setVehicle(v)} className="tap-feedback" style={{
                                width: "100%", background: active ? C.adminAccentBg : C.surface,
                                border: `1px solid ${active ? C.adminAccent : C.border}`, borderRadius: 10,
                                padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left",
                                display: "flex", alignItems: "center", gap: 10,
                            }}>
                                <span style={{ fontSize: 18 }}>🚚</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{v.plate}</div>
                                    <div style={{ fontSize: 11, color: C.textMid }}>{v.type} · {v.status === "available" ? "tersedia" : v.status === "on_route" ? "di rute" : v.status}</div>
                                </div>
                                {active && <span style={{ color: C.adminAccent, fontSize: 16 }}>✓</span>}
                            </button>
                        );
                    })}
                </div>
                <div style={{ padding: "8px 14px 16px", borderTop: `1px solid ${C.border}` }}>
                    <button onClick={() => vehicle && onConfirm(vehicle)} disabled={!vehicle} className="tap-feedback" style={{
                        width: "100%", background: vehicle ? C.adminAccent : C.slate200, color: vehicle ? "#fff" : C.textDim,
                        border: "none", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                        cursor: vehicle ? "pointer" : "not-allowed", textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{vehicle ? `Assign ke ${vehicle.plate}` : "Pilih Kendaraan Dulu"}</button>
                </div>
            </div>
        </>
    );
};

// ─── CONSUMABLE PICKER (walk-in) ───────────────────────────────────────────
const ConsumablePickerSheet = ({ inList, onSelect, onCancel }) => {
    const available = PRODUCT_CATALOG.filter(p => p.type === "consumable" && !inList.includes(p.id));
    return (
        <>
            <div onClick={onCancel} style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.5)", zIndex: 10 }} />
            <div className="sheet-up" style={{
                position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface,
                borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 11, maxHeight: "70%",
                display: "flex", flexDirection: "column",
            }}>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                    <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
                </div>
                <div style={{ padding: "12px 18px 8px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Pilih Produk</div>
                    <div style={{ fontSize: 12, color: C.textMid, marginTop: 2 }}>Consumable — jual lepas, tanpa galon balik</div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px 14px" }} className="scroll-thin">
                    {available.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "30px 20px", color: C.textMid, fontSize: 13 }}>Semua produk sudah ditambahkan</div>
                    ) : available.map(p => (
                        <button key={p.id} onClick={() => onSelect(p)} className="tap-feedback" style={{
                            width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                            padding: "12px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left",
                            display: "flex", alignItems: "center", gap: 12,
                        }}>
                            <span style={{ fontSize: 20 }}>{p.icon}</span>
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{p.name}</span>
                            <span style={{ color: C.textDim, fontSize: 16 }}>›</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

// ─── WALK-IN INTAKE SCREEN ─────────────────────────────────────────────────
// Bucket 1: consumable sale. Fulfillment counter-langsung / dikirim.
// Customer opsional (consumable boleh anonim — tanpa custody, tanpa genesis).
export const WalkInIntakeScreen = ({ items, onUpdate, fulfillment, onFulfillment, buyer, onBuyer, onBack, onProceed }) => {
    const [showConsumable, setShowConsumable] = useState(false);
    const [showRefill, setShowRefill] = useState(false);
    const inList = items.map(i => i.itemId);

    const addConsumable = (p) => {
        onUpdate([...items, { itemId: p.id, name: p.name, icon: p.icon, type: "consumable", transactionType: "SALE", drop: 1 }]);
        setShowConsumable(false);
    };
    const addRefill = (p) => {
        onUpdate([...items, {
            itemId: p.id, name: p.name, icon: p.icon, type: "returnable", category: p.category,
            transactionType: "REFILL", refillQty: 1, waterType: p.category === "Water" ? "ro" : null,
        }]);
        setShowRefill(false);
    };
    const setQty = (id, v) => onUpdate(items.map(i => i.itemId === id ? { ...i, drop: Math.max(0, v) } : i));
    const setRefillQty = (id, v) => onUpdate(items.map(i => i.itemId === id ? { ...i, refillQty: Math.max(0, v) } : i));
    const setWaterType = (id, w) => onUpdate(items.map(i => i.itemId === id ? { ...i, waterType: w } : i));
    const removeItem = (id) => onUpdate(items.filter(i => i.itemId !== id));

    const isCounter = fulfillment === "counter_immediate";
    const qtyOf = (i) => i.transactionType === "REFILL" ? (i.refillQty || 0) : (i.drop || 0);
    const hasRefill = items.some(i => i.transactionType === "REFILL");
    const refillBlocked = hasRefill && !isCounter; // refill walk-in = counter-langsung saja
    const canProceed = items.some(i => qtyOf(i) > 0) && !refillBlocked;
    const totalQty = items.reduce((s, i) => s + qtyOf(i), 0);

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg }}>
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button onClick={onBack} className="tap-feedback" style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "none", fontSize: 18, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.sale700, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>🚶 Walk-in · Counter</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Intake Pembelian</div>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 120px" }} className="scroll-thin">
                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>Penyelesaian</div>
                <div style={{ display: "flex", gap: 0, marginBottom: hasRefill && !isCounter ? 6 : 16, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
                    {[
                        { id: "counter_immediate", label: "Dibawa Langsung", sub: "selesai di counter" },
                        { id: "delivery", label: "Dikirim", sub: "jadi task antar" },
                    ].map(opt => {
                        const active = fulfillment === opt.id;
                        return (
                            <button key={opt.id} onClick={() => onFulfillment(opt.id)} className="tap-feedback" style={{
                                flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer",
                                background: active ? C.surface : "transparent",
                                boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                            }}>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: active ? C.adminAccent : C.textMid }}>{opt.label}</span>
                                <span style={{ fontSize: 9, color: active ? C.adminAccent : C.textDim }}>{opt.sub}</span>
                            </button>
                        );
                    })}
                </div>
                {refillBlocked && (
                    <div style={{ marginBottom: 16, padding: "8px 10px", background: C.emerald50, border: `1px solid ${C.emerald100}`, borderRadius: 6, fontSize: 11, color: C.emerald700, lineHeight: 1.4 }}>
                        Refill walk-in hanya untuk <strong>dibawa langsung</strong> (tukar 1-lawan-1 di counter). Untuk diantar, pakai task Refill via route.
                    </div>
                )}

                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 6, paddingLeft: 2 }}>
                    Pembeli {isCounter ? "(opsional · boleh umum)" : "(disarankan · buat alamat kirim)"}
                </div>
                <input
                    value={buyer.name}
                    onChange={(e) => onBuyer({ ...buyer, name: e.target.value })}
                    placeholder={isCounter ? "Nama pembeli — kosongkan untuk Umum" : "Nama pembeli"}
                    style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, marginBottom: 8, outline: "none" }}
                />
                {!isCounter && (
                    <input
                        value={buyer.address}
                        onChange={(e) => onBuyer({ ...buyer, address: e.target.value })}
                        placeholder="Alamat kirim"
                        style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, marginBottom: 8, outline: "none" }}
                    />
                )}

                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, margin: "14px 0 8px", paddingLeft: 2 }}>Item · {items.length}</div>
                {items.map(item => {
                    if (item.transactionType === "REFILL") {
                        const isWater = item.category === "Water";
                        return (
                            <div key={item.itemId} style={{ background: C.surface, border: `1px solid ${C.emerald100}`, borderLeft: `3px solid ${C.emerald400}`, borderRadius: 12, padding: "12px", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                                    <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</span>
                                    <span style={{ padding: "1px 6px", borderRadius: 3, background: C.emerald100, color: C.emerald700, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Refill</span>
                                    <button onClick={() => removeItem(item.itemId)} className="tap-feedback" style={{ width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", color: C.textDim, fontSize: 13, cursor: "pointer" }}>🗑</button>
                                </div>
                                {isWater && (
                                    <div style={{ display: "flex", gap: 0, marginBottom: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
                                        {[{ id: "ro", label: "Air RO" }, { id: "isiulang", label: "Isi Ulang" }].map(opt => {
                                            const active = (item.waterType || "ro") === opt.id;
                                            return (
                                                <button key={opt.id} onClick={() => setWaterType(item.itemId, opt.id)} className="tap-feedback" style={{
                                                    flex: 1, padding: "6px 8px", borderRadius: 6, border: "none", cursor: "pointer",
                                                    background: active ? C.surface : "transparent", boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                                    fontSize: 12, fontWeight: 700, color: active ? C.emerald700 : C.textMid,
                                                }}>{opt.label}</button>
                                            );
                                        })}
                                    </div>
                                )}
                                <QtyStepper kind="refill" value={item.refillQty} onChange={(v) => setRefillQty(item.itemId, v)} />
                                <div style={{ marginTop: 6, fontSize: 10.5, color: C.emerald700, paddingLeft: 2 }}>⇄ Kosong masuk · isi keluar · galon milik customer</div>
                            </div>
                        );
                    }
                    return (
                        <div key={item.itemId} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                <span style={{ fontSize: 18 }}>{item.icon}</span>
                                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.text }}>{item.name}</span>
                                <span style={{ padding: "1px 5px", borderRadius: 3, background: C.slate100, color: C.slate600, fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Consumable</span>
                                <button onClick={() => removeItem(item.itemId)} className="tap-feedback" style={{ width: 26, height: 26, borderRadius: 6, background: "transparent", border: "none", color: C.textDim, fontSize: 13, cursor: "pointer" }}>🗑</button>
                            </div>
                            <QtyStepper kind="sale" value={item.drop} onChange={(v) => setQty(item.itemId, v)} />
                        </div>
                    );
                })}
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => setShowConsumable(true)} className="tap-feedback" style={{
                        flex: 1, background: "transparent", border: `1px dashed ${C.borderStrong}`, borderRadius: 10,
                        padding: "12px", fontSize: 13, fontWeight: 600, color: C.adminAccent, cursor: "pointer",
                    }}>+ Produk</button>
                    <button onClick={() => setShowRefill(true)} className="tap-feedback" style={{
                        flex: 1, background: "transparent", border: `1px dashed ${C.emerald400}`, borderRadius: 10,
                        padding: "12px", fontSize: 13, fontWeight: 600, color: C.emerald700, cursor: "pointer",
                    }}>+ Refill Galon</button>
                </div>
            </div>

            <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: "10px 14px 12px", flexShrink: 0, boxShadow: "0 -4px 12px rgba(0,0,0,0.04)" }}>
                {items.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, padding: "8px 12px", background: C.surfaceAlt, borderRadius: 8, fontSize: 11 }}>
                        <span style={{ color: C.textMid }}>Total: </span>
                        <span className="mono" style={{ color: C.sale600, fontWeight: 700 }}>{totalQty}</span>
                        <span style={{ color: C.textDim }}>· {isCounter ? "selesai di counter" : "akan dikirim"}</span>
                    </div>
                )}
                <button onClick={() => canProceed && onProceed()} disabled={!canProceed} className="tap-feedback" style={{
                    width: "100%", background: !canProceed ? C.slate200 : (isCounter ? C.sale600 : C.adminAccent), color: !canProceed ? C.textDim : "#fff",
                    border: "none", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                    cursor: canProceed ? "pointer" : "not-allowed", textTransform: "uppercase", letterSpacing: "0.04em",
                }}>
                    {refillBlocked ? "Refill: Pilih Dibawa Langsung" : !canProceed ? "Tambah Item Dulu" : isCounter ? "Selesai di Counter ✓" : "Lanjut · Pilih Kendaraan →"}
                </button>
            </div>

            {showConsumable && <ConsumablePickerSheet inList={inList} onSelect={addConsumable} onCancel={() => setShowConsumable(false)} />}
            {showRefill && <RefillCategorySheet inTask={inList} onSelect={addRefill} onCancel={() => setShowRefill(false)} />}
        </div>
    );
};

// ─── WALK-IN COUNTER SUCCESS ───────────────────────────────────────────────
export const WalkInCounterSuccess = ({ items, buyer, taskId, onDone }) => {
    const qtyOf = (i) => i.transactionType === "REFILL" ? (i.refillQty || 0) : (i.drop || 0);
    const totalQty = items.reduce((s, i) => s + qtyOf(i), 0);
    const hasRefill = items.some(i => i.transactionType === "REFILL");
    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: C.bg, alignItems: "center", justifyContent: "center", padding: "24px" }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, background: C.sale50, border: `2px solid ${C.sale400}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Transaksi Counter Selesai</div>
            <div style={{ fontSize: 13, color: C.textMid, textAlign: "center", marginBottom: 4 }}>Walk-in · dibawa langsung</div>
            <div className="mono" style={{ fontSize: 12, color: C.textDim, marginBottom: 18 }}>{taskId}</div>
            <div style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, marginBottom: 8 }}>
                    {buyer.name ? `Pembeli: ${buyer.name}` : "Pembeli: Umum"}
                </div>
                {items.map(i => {
                    const refill = i.transactionType === "REFILL";
                    return (
                        <div key={i.itemId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13 }}>
                            <span>{i.icon}</span>
                            <span style={{ flex: 1, color: C.text }}>{i.name}</span>
                            {refill && (
                                <span style={{ padding: "1px 5px", borderRadius: 3, background: C.emerald100, color: C.emerald700, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Refill</span>
                            )}
                            <span className="mono" style={{ color: refill ? C.emerald700 : C.sale700, fontWeight: 700 }}>{refill ? "⇄ " : ""}{qtyOf(i)}</span>
                        </div>
                    );
                })}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, fontSize: 12, color: C.textMid }}>
                    Total <span className="mono" style={{ color: C.sale600, fontWeight: 700 }}>{totalQty}</span>{hasRefill ? " · refill: count operator tetap, jual air" : " · stok gudang berkurang · tanpa custody"}
                </div>
            </div>
            <button onClick={onDone} className="tap-feedback" style={{ width: "100%", background: C.adminAccent, color: "#fff", border: "none", padding: "14px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em" }}>Transaksi Baru</button>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function AdminCreateTaskIntegrated() {
    const [step, setStep] = useState("origin");  // origin | customer | items | vehicle | summary | success | walkin | walkin_success
    const [customers, setCustomers] = useState(CUSTOMERS);
    const [customer, setCustomer] = useState(null);
    const [taskItems, setTaskItems] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [newData, setNewData] = useState({ name: "", type: "", address: "", pic: "" });
    const [returnedTasks, setReturnedTasks] = useState([
        { id: "T-053", customer: "Toko Sumber Rejeki", fromVehicle: "B 1234 XY", driver: "Budi Santoso", reason: "Arah berlawanan dari rute, kejauhan dari titik lain" },
    ]);
    const [reassigning, setReassigning] = useState(null);   // task yang lagi di-assign ulang
    const [reassignToast, setReassignToast] = useState(null);

    const handleReassign = (newVehicle) => {
        const t = reassigning;
        if (!t) return;
        setReturnedTasks(prev => prev.filter(x => x.id !== t.id));
        setReassigning(null);
        setReassignToast(`${t.customer} di-assign ulang ke ${newVehicle.plate}`);
        setTimeout(() => setReassignToast(null), 2800);
    };
    const [seedItems, setSeedItems] = useState([]);
    const [basis, setBasis] = useState("");
    const [origination, setOrigination] = useState("planned");      // planned | walk_in
    const [fulfillment, setFulfillment] = useState("counter_immediate"); // counter_immediate | delivery
    const [buyer, setBuyer] = useState({ name: "", address: "" });

    const genesisPending = customer?.genesisStatus === "pending";

    const startWalkIn = () => {
        setOrigination("walk_in");
        setTaskItems([]);
        setBuyer({ name: "", address: "" });
        setFulfillment("counter_immediate");
        setCustomer(null);
        setVehicle(null);
        setStep("walkin");
    };

    const handleWalkInProceed = () => {
        if (fulfillment === "counter_immediate") {
            // Counter-langsung: selesai di counter, tanpa route/kendaraan.
            setTaskId(`T-${Math.floor(Math.random() * 900) + 100}`);
            setStep("walkin_success");
        } else {
            // Dikirim: jadi delivery task biasa. Synthesize customer (boleh umum) lalu
            // masuk flow vehicle → summary → success yang sudah ada.
            setCustomer({
                id: "WALKIN", name: buyer.name.trim() || "Walk-in (Umum)", type: "walkin",
                address: buyer.address.trim() || "—", contact: "—", pic: "—", avatar: "🚶",
                outstanding: [], genesisStatus: "verified", source: "walk_in",
            });
            setStep("vehicle");
        }
    };

    const handleSelectCustomer = (c) => {
        setCustomer(c);
        setStep("items");
    };

    const handleAddNew = () => {
        setNewData({ name: "", type: "", address: "", pic: "" });
        setStep("new_form");
    };

    // Commit a new customer: emit genesis qty 0 (verified) and go straight to Item Builder.
    // Empty outstanding[] is the integration point — Model B then suggests pickup = drop.
    const commitNewCustomer = () => {
        const id = `C-${Math.floor(Math.random() * 900 + 100)}`;
        const typeMeta = CUSTOMER_TYPES.find((t) => t.id === newData.type) || { icon: "🏢" };
        const created = {
            id,
            name: newData.name.trim(),
            type: newData.type,
            address: newData.address || "—",
            contact: "—",
            pic: newData.pic || "—",
            avatar: typeMeta.icon,
            outstanding: [],            // genesis qty 0 → no opening outstanding
            genesisStatus: "verified",
            source: "new_customer",
        };
        setCustomers((prev) => [created, ...prev]);
        setCustomer(created);
        setStep("items");
    };

    // ── Seed detour (genesis_pending → provisional), launched from Item Builder ──
    const handleSeedNow = () => {
        // prefill from the customer's recorded holding (catatan lama)
        setSeedItems((customer?.recordedHolding || []).map((r) => ({ ...r })));
        setBasis("");
        setStep("seed_qty");
    };

    const commitSeed = () => {
        const seededOutstanding = seedItems.map((i) => ({
            itemId: i.itemId, name: i.name, qty: i.qty, lastDate: "baru di-seed", aging: "normal",
        }));
        const seededMap = Object.fromEntries(seedItems.map((i) => [i.itemId, i.qty]));

        // 1) customer: pending → provisional, outstanding sekarang lengkap
        const updated = {
            ...customer,
            genesisStatus: "provisional",
            source: "admin_seed",
            transactedPreSeed: false,
            outstanding: seededOutstanding,
        };
        setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
        setCustomer(updated);

        // 2) refresh item yang sudah terlanjur ditambah: outstanding kini diketahui →
        //    re-suggest pickup (kecuali yang sudah di-adjust manual)
        setTaskItems((prev) => prev.map((it) => {
            if (it.type !== "returnable") return it;
            const out = seededMap[it.itemId] || 0;
            const next = { ...it, outstandingQty: out, pickupSuggested: it.drop + out };
            if (!it.pickupManuallyAdjusted) next.pickup = it.drop + out;
            return next;
        }));

        setStep("items"); // kembali ke Item Builder, Model B aktif
    };

    const handleSubmit = () => {
        const newTaskId = `T-${Math.floor(Math.random() * 900) + 100}`;
        setTaskId(newTaskId);
        setStep("success");
    };

    const handleReset = () => {
        setCustomer(null);
        setTaskItems([]);
        setVehicle(null);
        setTaskId(null);
        setOrigination("planned");
        setBuyer({ name: "", address: "" });
        setFulfillment("counter_immediate");
        setStep("origin");
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
                        Admin Runtime · Create Task
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                        Mobile flow · Combined Delivery + Pickup
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
                        <span>14:32</span>
                        <span style={{ display: "flex", gap: 4, alignItems: "center", fontSize: 11 }}>
                            <span>●●●●●</span>
                            <span style={{ marginLeft: 4 }}>🔋</span>
                        </span>
                    </div>

                    <div style={{ height: "calc(100% - 36px)", position: "relative" }}>
                        {step === "origin" && (
                            <OriginScreen
                                onPlanned={() => setStep("customer")}
                                onWalkIn={startWalkIn}
                                returnedTasks={returnedTasks}
                                onReassign={(t) => setReassigning(t)}
                            />
                        )}
                        {step === "walkin" && (
                            <WalkInIntakeScreen
                                items={taskItems}
                                onUpdate={setTaskItems}
                                fulfillment={fulfillment}
                                onFulfillment={setFulfillment}
                                buyer={buyer}
                                onBuyer={setBuyer}
                                onBack={() => setStep("origin")}
                                onProceed={handleWalkInProceed}
                            />
                        )}
                        {step === "walkin_success" && taskId && (
                            <WalkInCounterSuccess
                                items={taskItems}
                                buyer={buyer}
                                taskId={taskId}
                                onDone={handleReset}
                            />
                        )}
                        {step === "customer" && (
                            <CustomerPickerScreen
                                customers={customers}
                                onSelect={handleSelectCustomer}
                                onAddNew={handleAddNew}
                                onCancel={handleReset}
                            />
                        )}
                        {step === "new_form" && (
                            <NewCustomerScreen
                                data={newData}
                                onChange={setNewData}
                                onBack={() => setStep("customer")}
                                onNext={() => setStep("new_review")}
                            />
                        )}
                        {step === "new_review" && (
                            <NewCustomerReviewScreen
                                data={newData}
                                onBack={() => setStep("new_form")}
                                onSubmit={commitNewCustomer}
                            />
                        )}
                        {step === "items" && customer && (
                            <ItemBuilderScreen
                                customer={customer}
                                taskItems={taskItems}
                                genesisPending={genesisPending}
                                onSeedNow={handleSeedNow}
                                onUpdate={setTaskItems}
                                onBack={() => setStep("customer")}
                                onNext={() => setStep("vehicle")}
                            />
                        )}
                        {step === "seed_qty" && customer && (
                            <SeedQtyScreen
                                customer={customer}
                                items={seedItems}
                                onUpdate={setSeedItems}
                                onBack={() => setStep("items")}
                                onNext={() => setStep("seed_basis")}
                            />
                        )}
                        {step === "seed_basis" && customer && (
                            <SeedBasisScreen
                                basis={basis}
                                onBasis={setBasis}
                                onBack={() => setStep("seed_qty")}
                                onNext={() => setStep("seed_review")}
                            />
                        )}
                        {step === "seed_review" && customer && (
                            <SeedReviewScreen
                                customer={customer}
                                items={seedItems}
                                onBack={() => setStep("seed_basis")}
                                onSubmit={commitSeed}
                            />
                        )}
                        {step === "vehicle" && customer && (
                            <VehicleAssignmentScreen
                                customer={customer}
                                taskItems={taskItems}
                                selectedVehicle={vehicle}
                                onSelectVehicle={setVehicle}
                                onBack={() => setStep("items")}
                                onNext={() => setStep("summary")}
                            />
                        )}
                        {step === "summary" && customer && vehicle && (
                            <TaskSummaryScreen
                                customer={customer}
                                taskItems={taskItems}
                                vehicle={vehicle}
                                onBack={() => setStep("vehicle")}
                                onSubmit={handleSubmit}
                            />
                        )}
                        {step === "success" && customer && vehicle && taskId && (
                            <SuccessScreen
                                customer={customer}
                                taskItems={taskItems}
                                vehicle={vehicle}
                                taskId={taskId}
                                onCreateAnother={handleReset}
                                onBackToFeed={handleReset}
                            />
                        )}

                        {/* LOAD REJECTION — reassign task yang dikembalikan driver */}
                        {reassigning && (
                            <ReassignSheet
                                task={reassigning}
                                onConfirm={handleReassign}
                                onCancel={() => setReassigning(null)}
                            />
                        )}
                        {reassignToast && (
                            <div style={{
                                position: "absolute", bottom: 22, left: 16, right: 16, zIndex: 30,
                                background: C.text, color: "#fff", borderRadius: 12, padding: "12px 14px",
                                fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                                display: "flex", alignItems: "center", gap: 8,
                            }}>
                                <span style={{ fontSize: 15 }}>🚚</span>
                                <span style={{ flex: 1 }}>{reassignToast}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* New-customer detour breadcrumb */}
                {(step === "new_form" || step === "new_review") && (
                    <div style={{
                        display: "flex", gap: 6, padding: "8px 14px",
                        background: "rgba(255,255,255,0.08)", borderRadius: 100, backdropFilter: "blur(10px)",
                    }}>
                        {[{ id: "new_form", label: "Customer Baru · 1. Data" }, { id: "new_review", label: "2. Review" }].map(s => (
                            <div key={s.id} style={{
                                background: step === s.id ? "#fff" : "transparent",
                                color: step === s.id ? "#0f172a" : "#cbd5e1",
                                padding: "5px 11px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                            }}>{s.label}</div>
                        ))}
                    </div>
                )}

                {/* Seed detour breadcrumb */}
                {(step === "seed_qty" || step === "seed_basis" || step === "seed_review") && (
                    <div style={{
                        display: "flex", gap: 6, padding: "8px 14px",
                        background: "rgba(255,255,255,0.08)", borderRadius: 100, backdropFilter: "blur(10px)",
                    }}>
                        {[{ id: "seed_qty", label: "Seed · 1. Saldo" }, { id: "seed_basis", label: "2. Catatan" }, { id: "seed_review", label: "3. Review" }].map(s => (
                            <div key={s.id} style={{
                                background: step === s.id ? "#fff" : "transparent",
                                color: step === s.id ? "#0f172a" : "#cbd5e1",
                                padding: "5px 11px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                            }}>{s.label}</div>
                        ))}
                    </div>
                )}

                {/* Step indicator */}
                {!["new_form", "new_review", "seed_qty", "seed_basis", "seed_review"].includes(step) && (
                    <div style={{
                        display: "flex",
                        gap: 6,
                        padding: "8px 14px",
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 100,
                        backdropFilter: "blur(10px)",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        maxWidth: 480,
                    }}>
                        {[
                            { id: "origin", label: "Mulai" },
                            { id: "customer", label: "1. Customer" },
                            { id: "items", label: "2. Items" },
                            { id: "vehicle", label: "3. Kendaraan" },
                            { id: "summary", label: "4. Review" },
                            { id: "success", label: "✓ Done" },
                            { id: "walkin", label: "🚶 Walk-in" },
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => {
                                    if (s.id === "origin") handleReset();
                                    else if (s.id === "walkin") startWalkIn();
                                    else if (s.id === "customer") setStep("customer");
                                    else if (s.id === "items" && !customer) {
                                        setCustomer(CUSTOMERS[0]);
                                        setStep("items");
                                    }
                                    else if (s.id === "vehicle" && customer && taskItems.length === 0) {
                                        // Auto-populate items for demo: Honda Bintaro punya outstanding 3 Gas 12kg
                                        // Model B: drop 3 + outstanding 3 = pickup 6
                                        const c = customer || CUSTOMERS[0];
                                        if (!customer) setCustomer(c);
                                        setTaskItems([
                                            {
                                                itemId: "gas_12", name: "Gas 12kg", type: "returnable", icon: "🔥",
                                                drop: 3, pickup: 6, pickupSuggested: 6, outstandingQty: 3,
                                                pickupManuallyAdjusted: false,
                                            },
                                        ]);
                                        setStep("vehicle");
                                    }
                                    else if (s.id === "summary" && (!vehicle || taskItems.length === 0)) {
                                        if (!customer) setCustomer(CUSTOMERS[0]);
                                        if (taskItems.length === 0) {
                                            setTaskItems([
                                                {
                                                    itemId: "gas_12", name: "Gas 12kg", type: "returnable", icon: "🔥",
                                                    drop: 3, pickup: 6, pickupSuggested: 6, outstandingQty: 3,
                                                    pickupManuallyAdjusted: false
                                                },
                                            ]);
                                        }
                                        if (!vehicle) setVehicle(VEHICLES[0]);
                                        setStep("summary");
                                    }
                                    else if (s.id === "success") {
                                        if (!customer) setCustomer(CUSTOMERS[0]);
                                        if (taskItems.length === 0) {
                                            setTaskItems([
                                                {
                                                    itemId: "gas_12", name: "Gas 12kg", type: "returnable", icon: "🔥",
                                                    drop: 3, pickup: 6, pickupSuggested: 6, outstandingQty: 3,
                                                    pickupManuallyAdjusted: false
                                                },
                                            ]);
                                        }
                                        if (!vehicle) setVehicle(VEHICLES[0]);
                                        setTaskId("T-" + Math.floor(Math.random() * 900 + 100));
                                        setStep("success");
                                    }
                                    else setStep(s.id);
                                }}
                                style={{
                                    background: step === s.id ? "#fff" : "transparent",
                                    color: step === s.id ? "#0f172a" : "#cbd5e1",
                                    border: "none",
                                    padding: "5px 11px",
                                    borderRadius: 100,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}