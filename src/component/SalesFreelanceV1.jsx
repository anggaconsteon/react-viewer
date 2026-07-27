import React, { useState } from "react";
import {
    Camera,
    Link2,
    Clock,
    Check,
    X,
    Trophy,
    AlertTriangle,
    Image as ImageIcon,
    ChevronLeft,
    Gift,
    Users,
    Zap,
    Wallet,
} from "lucide-react";

// ---- Design tokens (Consteon family, new accent for Reward vertical) ----
const ink = "#1C1F26";
const paper = "#FAF8F5";
const cardBorder = "#E7E2DA";
const accent = "#C2601A"; // reward / posting — warm amber-clay, distinct from AUTSORZ green
const accentSoft = "#F6E9DC";
const ok = "#0E7C66";
const okSoft = "#E3F1EE";
const warn = "#B7791F";
const warnSoft = "#FBF0DE";
const danger = "#C0392B";
const dangerSoft = "#FBE7E4";
const muted = "#8B8478";

const fontDisplay = "'Plus Jakarta Sans', sans-serif";
const fontBody = "'DM Sans', 'Inter', sans-serif";

// ---- Mock data ----
const workerStats = {
    name: "Ratna",
    approved: 17,
    pendingReview: 3,
    batchesReady: 1,
    totalBatchesEver: 4,
};

const workerHistory = [
    { id: 1, time: "2 jam lalu", status: "pending" },
    { id: 2, time: "2 jam lalu", status: "pending" },
    { id: 3, time: "5 jam lalu", status: "approved" },
    { id: 4, time: "5 jam lalu", status: "approved" },
    { id: 5, time: "kemarin", status: "rejected", reason: "Screenshot buram" },
    { id: 6, time: "kemarin", status: "approved" },
];

const reviewQueue = [
    {
        id: 101,
        worker: "Dedi K.",
        registeredHandle: "@dedi.bawangjaya",
        waiting: "6 jam",
        link: "instagram.com/p/Cx9k...",
        linkHandle: "@dedi.bawangjaya",
        flag: "duplicate",
    },
    {
        id: 102,
        worker: "Ratna",
        registeredHandle: "@ratna_official22",
        waiting: "2 jam",
        link: "instagram.com/p/Cx7m...",
        linkHandle: "@ratna.storee",
        flag: "mismatch",
    },
    {
        id: 103,
        worker: "Bilal S.",
        registeredHandle: "@bilalsantoso_",
        waiting: "1 jam",
        link: null,
        linkHandle: null,
        flag: "burst",
    },
    {
        id: 104,
        worker: "Ratna",
        registeredHandle: "@ratna_official22",
        waiting: "2 jam",
        link: "instagram.com/p/Cx7n...",
        linkHandle: "@ratna_official22",
        flag: null,
    },
    {
        id: 105,
        worker: "Ayu P.",
        registeredHandle: "@ayu.pratiwi",
        waiting: "40 menit",
        link: "instagram.com/p/Cx8p...",
        linkHandle: "@ayu.pratiwi",
        flag: "sampled",
    },
];

const adminDashboard = {
    autoApprovedToday: 214,
    manualApprovedToday: 12,
    manualRejectedToday: 5,
    sampleRate: 5,
};

const recentAutoApproved = [
    { id: 201, worker: "Sinta W.", time: "3 menit lalu" },
    { id: 202, worker: "Farid A.", time: "8 menit lalu" },
    { id: 203, worker: "Wulan R.", time: "12 menit lalu" },
    { id: 204, worker: "Joko S.", time: "14 menit lalu" },
];

const flagMeta = {
    duplicate: { label: "Screenshot duplikat", color: warn, bg: warnSoft },
    burst: { label: "Submit terlalu cepat", color: warn, bg: warnSoft },
    sampled: { label: "Sampel acak 5%", color: accent, bg: accentSoft },
    mismatch: {
        label: "Handle tidak cocok — cek identitas",
        color: danger,
        bg: dangerSoft,
    },
};

// Tarif per batch — CONFIG per vendor, bukan hardcode (pola sama kamus label §9)
const tarifPerBatch = 1000;

const payoutList = [
    { id: 1, worker: "Ratna", handle: "@ratna_official22", batches: 3 },
    { id: 2, worker: "Dedi K.", handle: "@dedi.bawangjaya", batches: 5 },
    { id: 3, worker: "Bilal S.", handle: "@bilalsantoso_", batches: 1 },
    { id: 4, worker: "Ayu P.", handle: "@ayu.pratiwi", batches: 2 },
    { id: 5, worker: "Sinta W.", handle: "@sinta.w", batches: 4 },
];

function formatRupiah(n) {
    return "Rp " + n.toLocaleString("id-ID");
}

// ---- Shared bits ----
function StatusBadge({ status, reason }) {
    const map = {
        pending: { label: "Menunggu review", color: muted, bg: "#EFEBE4" },
        approved: { label: "Approved", color: ok, bg: okSoft },
        rejected: { label: reason || "Ditolak", color: danger, bg: dangerSoft },
    };
    const m = map[status];
    return (
        <span
            style={{
                fontSize: 11,
                fontWeight: 600,
                color: m.color,
                background: m.bg,
                padding: "4px 10px",
                borderRadius: 20,
                whiteSpace: "nowrap",
            }}
        >
            {m.label}
        </span>
    );
}

function PhoneFrame({ children }) {
    return (
        <div
            style={{
                width: 390,
                minHeight: 720,
                background: paper,
                borderRadius: 30,
                border: `1.5px solid ${cardBorder}`,
                overflow: "hidden",
                fontFamily: fontBody,
                color: ink,
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 50px rgba(28,31,38,0.10)",
            }}
        >
            {children}
        </div>
    );
}

// ---- Worker screen ----
function WorkerScreen() {
    const [link, setLink] = useState("");
    const [attached, setAttached] = useState(false);

    return (
        <PhoneFrame>
            {/* Header */}
            <div style={{ padding: "22px 20px 16px" }}>
                <div style={{ fontSize: 13, color: muted, fontWeight: 600 }}>
                    Halo, {workerStats.name}
                </div>
                <div
                    style={{
                        fontFamily: fontDisplay,
                        fontSize: 22,
                        fontWeight: 700,
                        marginTop: 2,
                    }}
                >
                    Reward Posting
                </div>
            </div>

            {/* Stats row */}
            <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                <StatCard label="Approved" value={workerStats.approved} accentColor={ok} />
                <StatCard
                    label="Batch siap"
                    value={workerStats.batchesReady}
                    accentColor={accent}
                    highlight
                />
                <StatCard
                    label="Menunggu"
                    value={workerStats.pendingReview}
                    accentColor={muted}
                />
            </div>

            {/* Batch ready callout */}
            {workerStats.batchesReady > 0 && (
                <div
                    style={{
                        margin: "16px 20px 0",
                        background: accentSoft,
                        border: `1.5px solid ${accent}33`,
                        borderRadius: 20,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Gift size={17} color="#fff" />
                    </div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                        <b>1 batch reward siap</b> — dari 10 post approved. Dicairkan admin
                        sesuai jadwal.
                    </div>
                </div>
            )}

            {/* Submit form */}
            <div style={{ margin: "18px 20px 0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    Submit post baru
                </div>

                <button
                    onClick={() => setAttached(true)}
                    style={{
                        width: "100%",
                        border: attached ? `1.5px solid ${ok}` : `1.5px dashed ${cardBorder}`,
                        background: attached ? okSoft : "#fff",
                        borderRadius: 20,
                        padding: "18px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        textAlign: "left",
                    }}
                >
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: attached ? ok : "#F1EDE6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        {attached ? (
                            <Check size={18} color="#fff" />
                        ) : (
                            <ImageIcon size={18} color={muted} />
                        )}
                    </div>
                    <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                            {attached ? "Screenshot terlampir" : "Pilih screenshot dari galeri"}
                        </div>
                        <div style={{ fontSize: 11.5, color: muted, marginTop: 2 }}>
                            {attached
                                ? "Ketuk untuk ganti"
                                : "Wajib — bukti postingan Instagram-mu"}
                        </div>
                    </div>
                </button>

                <div
                    style={{
                        marginTop: 10,
                        border: `1.5px solid ${cardBorder}`,
                        borderRadius: 20,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#fff",
                    }}
                >
                    <Link2 size={16} color={muted} />
                    <input
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="Link post (opsional, disarankan)"
                        style={{
                            border: "none",
                            outline: "none",
                            fontSize: 13,
                            flex: 1,
                            fontFamily: fontBody,
                            background: "transparent",
                        }}
                    />
                </div>

                <button
                    disabled={!attached}
                    style={{
                        width: "100%",
                        marginTop: 12,
                        padding: "13px 0",
                        borderRadius: 20,
                        border: "none",
                        background: attached ? ink : "#E7E2DA",
                        color: attached ? "#fff" : "#A8A196",
                        fontWeight: 700,
                        fontSize: 13.5,
                        fontFamily: fontDisplay,
                        cursor: attached ? "pointer" : "default",
                    }}
                >
                    Submit
                </button>
                <div
                    style={{
                        fontSize: 11,
                        color: muted,
                        marginTop: 8,
                        textAlign: "center",
                        lineHeight: 1.5,
                    }}
                >
                    Status awal: <b>diklaim, menunggu review</b> — bukan otomatis approved.
                </div>
            </div>

            {/* History */}
            <div style={{ margin: "20px 20px 24px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                    Riwayat submission
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {workerHistory.map((h) => (
                        <div
                            key={h.id}
                            style={{
                                border: `1.5px solid ${cardBorder}`,
                                borderRadius: 16,
                                padding: "10px 12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "#fff",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Clock size={13} color={muted} />
                                <span style={{ fontSize: 12.5, color: muted }}>{h.time}</span>
                            </div>
                            <StatusBadge status={h.status} reason={h.reason} />
                        </div>
                    ))}
                </div>
            </div>
        </PhoneFrame>
    );
}

function StatCard({ label, value, accentColor, highlight }) {
    return (
        <div
            style={{
                flex: 1,
                background: highlight ? `${accentColor}14` : "#fff",
                border: `1.5px solid ${highlight ? accentColor + "55" : cardBorder}`,
                borderRadius: 20,
                padding: "12px 10px",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    fontFamily: fontDisplay,
                    fontSize: 20,
                    fontWeight: 800,
                    color: highlight ? accentColor : ink,
                }}
            >
                {value}
            </div>
            <div style={{ fontSize: 10.5, color: muted, marginTop: 2, fontWeight: 600 }}>
                {label}
            </div>
        </div>
    );
}

// ---- Admin review queue ----
function AdminScreen() {
    const [items, setItems] = useState(reviewQueue);

    const resolve = (id) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    return (
        <PhoneFrame>
            <div style={{ padding: "22px 20px 14px" }}>
                <div style={{ fontSize: 13, color: muted, fontWeight: 600 }}>
                    Bawang Juara · Admin
                </div>
                <div
                    style={{
                        fontFamily: fontDisplay,
                        fontSize: 22,
                        fontWeight: 700,
                        marginTop: 2,
                    }}
                >
                    Review Queue
                </div>
                <div style={{ fontSize: 12, color: muted, marginTop: 4 }}>
                    Urut dari yang paling lama menunggu
                </div>
            </div>

            {/* Auto-approve dashboard */}
            <div style={{ padding: "0 20px", marginBottom: 6 }}>
                <div
                    style={{
                        border: `1.5px solid ${ok}33`,
                        background: okSoft,
                        borderRadius: 20,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: ok,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Zap size={16} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 18,
                                fontWeight: 800,
                                fontFamily: fontDisplay,
                                color: ok,
                                lineHeight: 1.1,
                            }}
                        >
                            {adminDashboard.autoApprovedToday}
                        </div>
                        <div style={{ fontSize: 10.5, color: muted, fontWeight: 600 }}>
                            Auto-approved hari ini · {adminDashboard.sampleRate}% tetap disampel manual
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ padding: "10px 20px 0", display: "flex", gap: 10, marginBottom: 6 }}>
                <div
                    style={{
                        flex: 1,
                        border: `1.5px solid ${cardBorder}`,
                        borderRadius: 20,
                        padding: "10px 12px",
                        background: "#fff",
                    }}
                >
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: fontDisplay }}>
                        {items.length}
                    </div>
                    <div style={{ fontSize: 10.5, color: muted, fontWeight: 600 }}>
                        Menunggu review
                    </div>
                </div>
                <div
                    style={{
                        flex: 1,
                        border: `1.5px solid ${warn}44`,
                        background: warnSoft,
                        borderRadius: 20,
                        padding: "10px 12px",
                    }}
                >
                    <div
                        style={{
                            fontSize: 18,
                            fontWeight: 800,
                            fontFamily: fontDisplay,
                            color: warn,
                        }}
                    >
                        {items.filter((i) => i.flag && i.flag !== "sampled").length}
                    </div>
                    <div style={{ fontSize: 10.5, color: warn, fontWeight: 600 }}>
                        Ada flag anomali
                    </div>
                </div>
            </div>

            {/* Why these items are here — flag or random sample */}
            <div style={{ padding: "0 20px", marginTop: 4 }}>
                <div style={{ fontSize: 11, color: muted, lineHeight: 1.5 }}>
                    Antrian di bawah ini cuma yang kena flag atau kena sampel acak{" "}
                    {adminDashboard.sampleRate}%. Sisanya sudah auto-approved di atas.
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    padding: "14px 20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                {items.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            color: muted,
                            fontSize: 13,
                            padding: "40px 0",
                        }}
                    >
                        Semua submission sudah diproses.
                    </div>
                )}
                {items.map((item) => (
                    <div
                        key={item.id}
                        style={{
                            border: `1.5px solid ${item.flag === "mismatch"
                                    ? danger + "77"
                                    : item.flag && item.flag !== "sampled"
                                        ? warn + "55"
                                        : cardBorder
                                }`,
                            background: "#fff",
                            borderRadius: 20,
                            padding: 12,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                                marginBottom: 10,
                            }}
                        >
                            <div
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 12,
                                    background: "#F1EDE6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <ImageIcon size={20} color={muted} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 13.5, fontWeight: 700 }}>
                                        {item.worker}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 11,
                                            color: muted,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 3,
                                        }}
                                    >
                                        <Clock size={11} /> {item.waiting}
                                    </span>
                                </div>
                                {item.link ? (
                                    <div
                                        style={{
                                            fontSize: 11.5,
                                            color: accent,
                                            marginTop: 3,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 4,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        <Link2 size={11} /> {item.link}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: 11.5, color: muted, marginTop: 3 }}>
                                        Tanpa link
                                    </div>
                                )}
                                {item.flag === "mismatch" && (
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: 11,
                                            lineHeight: 1.6,
                                            color: ink,
                                            background: "#F7F5F1",
                                            borderRadius: 10,
                                            padding: "6px 8px",
                                        }}
                                    >
                                        Terdaftar: <b>{item.registeredHandle}</b>
                                        <br />
                                        Di link: <b style={{ color: danger }}>{item.linkHandle}</b>
                                    </div>
                                )}
                                {item.flag && (
                                    <div
                                        style={{
                                            marginTop: 6,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 4,
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            color: flagMeta[item.flag].color,
                                            background: flagMeta[item.flag].bg,
                                            padding: "3px 8px",
                                            borderRadius: 20,
                                        }}
                                    >
                                        <AlertTriangle size={11} /> {flagMeta[item.flag].label}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => resolve(item.id)}
                                style={{
                                    flex: 1,
                                    padding: "9px 0",
                                    borderRadius: 14,
                                    border: "none",
                                    background: ok,
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                    cursor: "pointer",
                                }}
                            >
                                <Check size={14} /> Approve
                            </button>
                            <button
                                onClick={() => resolve(item.id)}
                                style={{
                                    flex: 1,
                                    padding: "9px 0",
                                    borderRadius: 14,
                                    border: `1.5px solid ${danger}55`,
                                    background: dangerSoft,
                                    color: danger,
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 5,
                                    cursor: "pointer",
                                }}
                            >
                                <X size={14} /> Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </PhoneFrame>
    );
}

// ---- Root: tab switcher between the two roles for demo purposes ----
// ---- Payout screen (end-of-month, per-worker batch payout) ----
function PayoutScreen() {
    const [list, setList] = useState(payoutList);
    const [paidLog, setPaidLog] = useState([]);
    const [selected, setSelected] = useState(() =>
        new Set(payoutList.map((i) => i.id))
    );
    const [confirming, setConfirming] = useState(false);

    const toggleOne = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const allSelected = list.length > 0 && selected.size === list.length;
    const toggleAll = () => {
        setSelected(allSelected ? new Set() : new Set(list.map((i) => i.id)));
    };

    const selectedItems = list.filter((i) => selected.has(i.id));
    const selectedNominal = selectedItems.reduce(
        (sum, i) => sum + i.batches * tarifPerBatch,
        0
    );

    const confirmPay = () => {
        setList((prev) => prev.filter((i) => !selected.has(i.id)));
        setPaidLog((prev) => [
            ...selectedItems.map((i) => ({ ...i, paidAt: "Baru saja" })),
            ...prev,
        ]);
        setSelected(new Set());
        setConfirming(false);
    };

    const totalNominal = list.reduce(
        (sum, i) => sum + i.batches * tarifPerBatch,
        0
    );
    const totalBatches = list.reduce((sum, i) => sum + i.batches, 0);

    return (
        <PhoneFrame>
            <div style={{ padding: "22px 20px 14px" }}>
                <div style={{ fontSize: 13, color: muted, fontWeight: 600 }}>
                    Bawang Juara · Admin
                </div>
                <div
                    style={{
                        fontFamily: fontDisplay,
                        fontSize: 22,
                        fontWeight: 700,
                        marginTop: 2,
                    }}
                >
                    Payout Batch
                </div>
                <div style={{ fontSize: 12, color: muted, marginTop: 4, lineHeight: 1.5 }}>
                    Ditransfer manual per worker, digabung sama komisi. Pilih worker,
                    lalu tandai lunas sekaligus.
                </div>
            </div>

            {/* Summary callout */}
            <div style={{ padding: "0 20px", marginBottom: 6 }}>
                <div
                    style={{
                        border: `1.5px solid ${accent}33`,
                        background: accentSoft,
                        borderRadius: 20,
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 12,
                            background: accent,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Wallet size={16} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: 17,
                                fontWeight: 800,
                                fontFamily: fontDisplay,
                                color: accent,
                                lineHeight: 1.2,
                            }}
                        >
                            {formatRupiah(totalNominal)}
                        </div>
                        <div style={{ fontSize: 10.5, color: muted, fontWeight: 600 }}>
                            Total belum ditransfer · {totalBatches} batch · {list.length}{" "}
                            worker · tarif {formatRupiah(tarifPerBatch)}/batch
                        </div>
                    </div>
                </div>
            </div>

            {/* Select all row */}
            {list.length > 0 && !confirming && (
                <div
                    style={{
                        padding: "8px 20px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <button
                        onClick={toggleAll}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                        }}
                    >
                        <Checkbox checked={allSelected} />
                        <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                            Pilih semua ({list.length})
                        </span>
                    </button>
                    <span style={{ fontSize: 11.5, color: muted }}>
                        {selected.size} dipilih
                    </span>
                </div>
            )}

            {/* Worker list */}
            <div
                style={{
                    padding: "10px 20px 0",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                {list.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            color: muted,
                            fontSize: 13,
                            padding: "24px 0",
                        }}
                    >
                        Semua worker sudah ditransfer bulan ini.
                    </div>
                )}
                {!confirming &&
                    list.map((item) => {
                        const isSelected = selected.has(item.id);
                        return (
                            <button
                                key={item.id}
                                onClick={() => toggleOne(item.id)}
                                style={{
                                    border: `1.5px solid ${isSelected ? accent + "55" : cardBorder}`,
                                    background: isSelected ? accentSoft : "#fff",
                                    borderRadius: 20,
                                    padding: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    width: "100%",
                                }}
                            >
                                <Checkbox checked={isSelected} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                                        {item.worker}
                                    </div>
                                    <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>
                                        {item.handle}
                                    </div>
                                    <div style={{ fontSize: 11.5, marginTop: 4 }}>
                                        {item.batches} batch siap ·{" "}
                                        <b style={{ color: accent }}>
                                            {formatRupiah(item.batches * tarifPerBatch)}
                                        </b>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
            </div>

            {/* Confirmation panel */}
            {confirming && (
                <div style={{ padding: "10px 20px 0" }}>
                    <div
                        style={{
                            border: `1.5px solid ${danger}44`,
                            background: dangerSoft,
                            borderRadius: 20,
                            padding: 16,
                        }}
                    >
                        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 6 }}>
                            Tandai {selectedItems.length} worker lunas?
                        </div>
                        <div style={{ fontSize: 12, lineHeight: 1.6, color: ink }}>
                            Total <b>{formatRupiah(selectedNominal)}</b> akan ditandai
                            dibayar untuk {selectedItems.length} worker. Aksi ini{" "}
                            <b>tidak bisa dibatalkan</b> — pastikan transfer sudah benar-benar
                            dilakukan.
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                            <button
                                onClick={() => setConfirming(false)}
                                style={{
                                    flex: 1,
                                    padding: "10px 0",
                                    borderRadius: 14,
                                    border: `1.5px solid ${cardBorder}`,
                                    background: "#fff",
                                    color: ink,
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    cursor: "pointer",
                                }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmPay}
                                style={{
                                    flex: 1,
                                    padding: "10px 0",
                                    borderRadius: 14,
                                    border: "none",
                                    background: danger,
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: 12.5,
                                    cursor: "pointer",
                                }}
                            >
                                Ya, Sudah Ditransfer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk action bar */}
            {list.length > 0 && !confirming && (
                <div style={{ padding: "14px 20px 0" }}>
                    <button
                        onClick={() => selected.size > 0 && setConfirming(true)}
                        disabled={selected.size === 0}
                        style={{
                            width: "100%",
                            padding: "13px 0",
                            borderRadius: 20,
                            border: "none",
                            background: selected.size > 0 ? ink : "#E7E2DA",
                            color: selected.size > 0 ? "#fff" : "#A8A196",
                            fontWeight: 700,
                            fontSize: 13,
                            fontFamily: fontDisplay,
                            cursor: selected.size > 0 ? "pointer" : "default",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                        }}
                    >
                        <Check size={15} />
                        Tandai Lunas ({selected.size} worker · {formatRupiah(selectedNominal)})
                    </button>
                </div>
            )}

            {/* Recently paid log */}
            {paidLog.length > 0 && (
                <div style={{ margin: "18px 20px 24px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: muted }}>
                        Baru ditandai lunas
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {paidLog.map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    border: `1.5px solid ${ok}33`,
                                    background: okSoft,
                                    borderRadius: 16,
                                    padding: "10px 12px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ fontSize: 12.5, fontWeight: 700 }}>
                                    {item.worker}
                                </div>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: ok,
                                    }}
                                >
                                    Dibayar · {item.paidAt}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </PhoneFrame>
    );
}

function Checkbox({ checked }) {
    return (
        <div
            style={{
                width: 20,
                height: 20,
                borderRadius: 7,
                border: `1.5px solid ${checked ? accent : cardBorder}`,
                background: checked ? accent : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
            }}
        >
            {checked && <Check size={13} color="#fff" strokeWidth={3} />}
        </div>
    );
}

export default function App() {
    const [tab, setTab] = useState("worker");

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#EFEAE2",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "32px 16px",
                fontFamily: fontBody,
            }}
        >
            <div
                style={{
                    display: "flex",
                    gap: 6,
                    background: "#fff",
                    border: `1.5px solid ${cardBorder}`,
                    borderRadius: 20,
                    padding: 4,
                    marginBottom: 20,
                }}
            >
                {[
                    { key: "worker", label: "Worker", icon: Trophy },
                    { key: "admin", label: "Admin Review", icon: Users },
                    { key: "payout", label: "Payout", icon: Wallet },
                ].map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: 16,
                                border: "none",
                                background: active ? ink : "transparent",
                                color: active ? "#fff" : muted,
                                fontWeight: 700,
                                fontSize: 12.5,
                                fontFamily: fontDisplay,
                                cursor: "pointer",
                            }}
                        >
                            <Icon size={14} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {tab === "worker" ? (
                <WorkerScreen />
            ) : tab === "admin" ? (
                <AdminScreen />
            ) : (
                <PayoutScreen />
            )}
        </div>
    );
}