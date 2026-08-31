import React, { useState, useMemo } from "react";
import {
    Plus, MapPin, Clock, Wrench, ChevronRight, X, Check, Package,
    Phone, User, Calendar, AlertCircle, CircleDot, ArrowLeft, Snowflake,
} from "lucide-react";

/*
  ADMIN RUNTIME — Vertikal Service AC  (handoff mockup, Flutter target)
  Reuse substrat Consteon: shell zones, signal-card tier, chip/bottom-sheet,
  urgency hierarchy (amber = max, red hanya engineering).
  Doctrine delta vertikal ini:
   - 2 runtime: Admin + Teknisi. Admin assign teknisi LANGSUNG (no Gudang).
   - Two-party check pindah ke ujung: Teknisi <-> Customer (TTD sign-off).
   - Primitif = Work Order (state di-derive dari event), bukan Movement/Custody.
   - Discrepancy = scope divergence + parts kurang.
   - Intake -> emit SPK (tanpa harga ke teknisi) -> Invoice frozen setelah selesai.
*/

// ---- design tokens (dari Consteon Visual System) ----
const C = {
    admin: "#2563EB",
    brand: "#1D9E75",
    amber: "#EF9F27",
    amberTint: "#FEF6E7",
    amberBorder: "#F4B740",
    teal: "#0D9488",
    ink: "#0F172A",
    sub: "#64748B",
    line: "#E2E8F0",
    surface: "#FFFFFF",
    canvas: "#F1F5F9",
};
const FONT = "Inter, system-ui, -apple-system, sans-serif";

const JENIS = [
    { id: "cuci", label: "Cuci / Service" },
    { id: "perbaikan", label: "Perbaikan" },
    { id: "freon", label: "Isi Freon" },
    { id: "instalasi", label: "Instalasi" },
    { id: "bongkar", label: "Bongkar-Pasang" },
];
const KELUHAN = ["Nggak dingin", "Bunyi berisik", "Bocor air", "Bau", "Mati total"];
const SLOT = [
    { id: "pagi", label: "Pagi", jam: "08–11" },
    { id: "siang", label: "Siang", jam: "11–14" },
    { id: "sore", label: "Sore", jam: "14–17" },
];

// Harga jasa dasar — dimiliki Admin (teknisi tak pernah lihat). Per unit.
const HARGA_JASA = { cuci: 65000, perbaikan: 150000, freon: 120000, instalasi: 350000, bongkar: 250000 };

const seedTeknisi = [
    { id: "t1", nama: "Andi Prasetyo", beban: 2 },
    { id: "t2", nama: "Budi Santoso", beban: 1 },
    { id: "t3", nama: "Rian Hidayat", beban: 0 },
    { id: "t4", nama: "Deni Kurniawan", beban: 3 },
];

const seedCustomers = [
    { id: "c1", nama: "Ibu Sari", hp: "0812-3344-1200", alamat: "Perum Green Lake blok C2" },
    { id: "c2", nama: "Toko Berkah Jaya", hp: "0813-7788-4500", alamat: "Jl. Merdeka No. 45" },
    { id: "c3", nama: "Pak Hendra", hp: "0811-2233-9080", alamat: "Ruko Sentra Niaga 12" },
    { id: "c4", nama: "Ibu Maya", hp: "0857-6543-2211", alamat: "Apartemen Skyline 8F" },
];

const seedJobs = [
    {
        id: "j1", kode: "JOB-1204", cust: seedCustomers[0], jenis: ["perbaikan"], unit: 2,
        keluhan: "AC kamar nggak dingin, kompresor bunyi", slot: "pagi", jam: "09:00",
        prioritas: "urgent", teknisi: "Andi Prasetyo", status: "in_progress",
        scope: { desc: "Kompresor unit 1 rusak total — perlu ganti", partsNeeded: ["Kompresor 1 PK", "Freon R32"] },
        parts: [], events: [
            { t: "08:12", label: "Order dibuat · SPK terbit", who: "Admin" },
            { t: "08:20", label: "Ditugaskan ke Andi Prasetyo", who: "Admin" },
            { t: "09:05", label: "Teknisi tiba di lokasi", who: "Andi" },
            { t: "09:40", label: "Scope tambahan diajukan", who: "Andi" },
        ],
    },
    {
        id: "j2", kode: "JOB-1198", cust: seedCustomers[1], jenis: ["freon"], unit: 3,
        keluhan: "Freon habis semua, ruangan panas", slot: "pagi", jam: "10:30",
        prioritas: "normal", teknisi: "Budi Santoso", status: "in_progress",
        partsBlock: { part: "Freon R32", note: "Stok habis di gudang" },
        parts: [], events: [
            { t: "09:50", label: "Order dibuat · SPK terbit", who: "Admin" },
            { t: "10:00", label: "Ditugaskan ke Budi Santoso", who: "Admin" },
            { t: "10:35", label: "Job ke-hold — parts kurang", who: "Budi" },
        ],
    },
    {
        id: "j3", kode: "JOB-1187", cust: seedCustomers[2], jenis: ["cuci"], unit: 4,
        keluhan: "Service berkala rutin", slot: "pagi", jam: "08:00",
        prioritas: "normal", teknisi: null, status: "requested", overdue: true,
        parts: [], events: [{ t: "Kemarin 16:20", label: "Order dibuat · SPK terbit", who: "Admin" }],
    },
    {
        id: "j4", kode: "JOB-1211", cust: seedCustomers[3], jenis: ["cuci"], unit: 1,
        keluhan: "Cuci rutin", slot: "siang", jam: "13:00",
        prioritas: "normal", teknisi: null, status: "requested",
        parts: [], events: [{ t: "07:40", label: "Order dibuat · SPK terbit", who: "Admin" }],
    },
    {
        id: "j5", kode: "JOB-1209", cust: { nama: "Kafe Kopi Kita", hp: "0812-9090-1122", alamat: "Jl. Anggrek 7" },
        jenis: ["instalasi"], unit: 2, keluhan: "Pasang 2 unit baru", slot: "siang", jam: "14:00",
        prioritas: "normal", teknisi: "Rian Hidayat", status: "in_progress",
        reassignReq: { reason: "Butuh senior — instalasi pipa panjang, unit lantai 3" },
        parts: [], events: [
            { t: "07:10", label: "Order dibuat · SPK terbit", who: "Admin" },
            { t: "07:30", label: "Ditugaskan ke Rian Hidayat", who: "Admin" },
            { t: "14:20", label: "Rian mulai kerja · tiba di lokasi", who: "Rian" },
            { t: "14:45", label: "Minta ganti teknisi · Butuh senior", who: "Rian" },
        ],
    },
    {
        id: "j6", kode: "JOB-1195", cust: { nama: "Pak Joko", hp: "0813-1212-3434", alamat: "Perum Indah blok A1" },
        jenis: ["cuci"], unit: 2, keluhan: "Cuci rutin", slot: "pagi", jam: "08:30",
        prioritas: "normal", teknisi: "Deni Kurniawan", status: "completed", ttd: true,
        parts: [{ nama: "Cairan pembersih coil", qty: 1 }], events: [
            { t: "08:30", label: "Order dibuat · SPK terbit", who: "Admin" },
            { t: "08:35", label: "Ditugaskan ke Deni Kurniawan", who: "Admin" },
            { t: "11:10", label: "Pekerjaan selesai", who: "Deni" },
            { t: "11:15", label: "TTD customer diterima", who: "Deni" },
        ],
    },
    {
        id: "j7", kode: "JOB-1190", cust: { nama: "Ibu Lina", hp: "-", alamat: "Perum Melati 3" },
        jenis: ["cuci"], unit: 1, keluhan: "Cuci rutin", slot: "pagi", jam: "08:00",
        prioritas: "normal", teknisi: "Deni Kurniawan", status: "invoiced", ttd: true,
        parts: [], events: [],
    },
];

const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");

const jenisLabel = (ids) => ids.map((i) => JENIS.find((j) => j.id === i)?.label || i).join(", ");

const statusChip = (job) => {
    if (job.status === "invoiced") return { t: "SELESAI", bg: "#E7F6EF", fg: C.brand };
    if (job.status === "completed") return { t: "BELUM INVOICE", bg: C.amberTint, fg: "#B4791A" };
    if (job.status === "in_progress") return { t: "DIKERJAKAN", bg: "#E8EFFD", fg: C.admin };
    if (job.status === "assigned") return { t: "DITUGASKAN", bg: "#E8EFFD", fg: C.admin };
    return { t: "BELUM DIASSIGN", bg: "#F1F5F9", fg: C.sub };
};

// ---- small UI atoms ----
const Chip = ({ children, active, onClick, tone }) => (
    <button
        onClick={onClick}
        style={{
            fontFamily: FONT, fontSize: 13, fontWeight: 500, padding: "8px 14px",
            borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
            border: `1.5px solid ${active ? (tone || C.admin) : C.line}`,
            background: active ? (tone ? tone + "14" : "#E8EFFD") : "#fff",
            color: active ? (tone || C.admin) : C.ink,
        }}
    >
        {children}
    </button>
);

const StateTag = ({ t, bg, fg }) => (
    <span style={{
        fontFamily: FONT, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em",
        textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, background: bg, color: fg,
    }}>{t}</span>
);

// ---- Job cards per zone ----
function VonisCard({ job, onOpen }) {
    const reason = job.scope
        ? { icon: <Wrench size={15} />, text: "Scope tambahan — perlu ditetapkan harga", cta: "Tetapkan" }
        : job.partsBlock
            ? { icon: <Package size={15} />, text: `Ke-hold · ${job.partsBlock.part} habis`, cta: "Tinjau" }
            : job.reassignReq
                ? { icon: <User size={15} />, text: `${job.teknisi?.split(" ")[0]} minta ganti · ${job.reassignReq.reason.split("—")[0].trim()}`, cta: "Ganti" }
                : { icon: <Clock size={15} />, text: `Lewat jadwal ${job.jam} · belum diassign`, cta: "Assign" };
    return (
        <div
            onClick={() => onOpen(job)}
            style={{
                background: C.amberTint, border: `1px solid ${C.amberBorder}`, borderLeft: `4px solid ${C.amber}`,
                borderRadius: 14, padding: "14px 14px", marginBottom: 10, cursor: "pointer", fontFamily: FONT,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ color: C.amber }}>◉</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{job.cust.nama}</span>
                <span style={{ fontSize: 12, color: C.sub, marginLeft: "auto" }}>{job.kode}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#92610E", fontSize: 13, fontWeight: 500 }}>
                {reason.icon}<span>{reason.text}</span>
            </div>
            <button
                style={{
                    marginTop: 12, width: "100%", height: 40, borderRadius: 10, border: "none",
                    background: C.amber, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: "pointer",
                }}
            >{reason.cta}</button>
        </div>
    );
}

function JobCard({ job, onOpen }) {
    const sc = statusChip(job);
    return (
        <div
            onClick={() => onOpen(job)}
            style={{
                background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14,
                padding: "13px 14px", marginBottom: 9, cursor: "pointer", fontFamily: FONT,
                display: "flex", alignItems: "center", gap: 12,
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{job.cust.nama}</span>
                    <StateTag {...sc} />
                </div>
                <div style={{ fontSize: 13, color: C.ink, marginBottom: 2 }}>
                    {jenisLabel(job.jenis)} · {job.unit} unit
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.sub }}>
                    <Clock size={12} /> {job.jam}
                    {job.teknisi && <><span>·</span><User size={12} /> {job.teknisi.split(" ")[0]}</>}
                </div>
            </div>
            <ChevronRight size={18} color={C.sub} />
        </div>
    );
}

function ZoneHeader({ n, title, count, tone }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 2px 10px" }}>
            <span style={{
                fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", color: tone || C.sub,
            }}>{title}</span>
            {count != null && (
                <span style={{
                    fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#fff",
                    background: tone || C.sub, borderRadius: 999, padding: "1px 8px",
                }}>{count}</span>
            )}
        </div>
    );
}

// ---- Bottom sheet shell ----
function Sheet({ open, onClose, children, title }) {
    if (!open) return null;
    return (
        <div
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)", display: "flex", alignItems: "flex-end", zIndex: 40 }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff", width: "100%", maxHeight: "88%", borderRadius: "22px 22px 0 0",
                    display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", padding: "16px 18px 12px", borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{title}</span>
                    <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.sub }}>
                        <X size={22} />
                    </button>
                </div>
                <div style={{ overflowY: "auto", padding: "16px 18px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

// ---- Assign sheet ----
function AssignSheet({ open, onClose, teknisi, current, onPick }) {
    const [reason, setReason] = useState(null);
    React.useEffect(() => { if (open) setReason(null); }, [open]);
    const isReassign = !!current;
    const alasan = ["Teknisi berhalangan", "Beban penuh", "Lebih dekat", "Reschedule"];
    return (
        <Sheet open={open} onClose={onClose} title={isReassign ? "Ganti Teknisi" : "Assign Teknisi"}>
            {isReassign && (
                <div style={{ background: C.canvas, borderRadius: 11, padding: "10px 13px", marginBottom: 14, fontSize: 13.5 }}>
                    <span style={{ color: C.sub }}>Saat ini: </span><b style={{ color: C.ink }}>{current}</b>
                </div>
            )}
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>{isReassign ? "Pilih teknisi pengganti. Riwayat penugasan tetap tersimpan." : "Pilih teknisi buat kerjakan job ini."}</div>
            {teknisi.map((t) => {
                const isCur = t.nama === current;
                return (
                    <div key={t.id} onClick={() => !isCur && onPick(t, reason)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 12px", marginBottom: 8, border: `1px solid ${C.line}`, borderRadius: 12, cursor: isCur ? "default" : "pointer", opacity: isCur ? 0.55 : 1 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 999, background: "#E8EFFD", color: C.admin, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>
                            {t.nama.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{t.nama}</div>
                            <div style={{ fontSize: 12.5, color: t.beban === 0 ? C.brand : C.sub }}>
                                {isCur ? "Sedang ditugaskan" : t.beban === 0 ? "Kosong · siap ambil job" : `${t.beban} job hari ini`}
                            </div>
                        </div>
                        {isCur ? <StateTag t="SAAT INI" bg="#E8EFFD" fg={C.admin} /> : <ChevronRight size={18} color={C.sub} />}
                    </div>
                );
            })}
            {isReassign && (
                <>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.sub, margin: "8px 0 9px" }}>Alasan (opsional)</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {alasan.map((a) => <Chip key={a} active={reason === a} onClick={() => setReason(reason === a ? null : a)}>{a}</Chip>)}
                    </div>
                </>
            )}
        </Sheet>
    );
}

// ---- Job detail sheet ----
function JobDetail({ open, onClose, job, onAssign, onApproveScope, onInvoice }) {
    if (!job) return null;
    const sc = statusChip(job);
    return (
        <Sheet open={open} onClose={onClose} title={job.kode}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: C.ink }}>{job.cust.nama}</span>
                <StateTag {...sc} />
                {job.prioritas === "urgent" && <StateTag t="URGENT" bg={C.amberTint} fg="#B4791A" />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: C.sub, marginBottom: 2 }}>
                <MapPin size={14} /> {job.cust.alamat}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: C.sub, marginBottom: 16 }}>
                <Phone size={14} /> {job.cust.hp}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                <Info label="Jenis" val={jenisLabel(job.jenis)} />
                <Info label="Unit" val={`${job.unit} unit`} />
                <Info label="Jadwal" val={`${job.jam} (${SLOT.find((s) => s.id === job.slot)?.label})`} />
                <Info label="Teknisi" val={job.teknisi || "— belum —"} />
            </div>
            <div style={{ background: C.canvas, borderRadius: 12, padding: "11px 13px", fontSize: 13.5, color: C.ink, marginBottom: 16 }}>
                <span style={{ color: C.sub, fontSize: 12 }}>Keluhan / scope</span><br />{job.keluhan}
            </div>

            {job.scope && (
                <Callout tone={C.amber} icon={<Wrench size={16} />} title="Scope tambahan — perlu ditetapkan harga">
                    <div style={{ fontSize: 13.5, color: C.ink }}>Temuan teknisi: {job.scope.desc}</div>
                    {job.scope.partsNeeded && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {job.scope.partsNeeded.map((p) => (
                                <span key={p} style={{ fontSize: 12, fontWeight: 500, color: "#92610E", background: "#fff", border: `1px solid ${C.amberBorder}`, borderRadius: 999, padding: "4px 10px" }}>{p}</span>
                            ))}
                        </div>
                    )}
                    <button onClick={() => onApproveScope(job)}
                        style={{ marginTop: 12, width: "100%", height: 42, borderRadius: 10, border: "none", background: C.amber, color: "#fff", fontSize: 14.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>
                        Tetapkan harga & setujui
                    </button>
                </Callout>
            )}
            {job.partsBlock && (
                <Callout tone={C.amber} icon={<Package size={16} />} title="Ke-hold — parts kurang">
                    <div style={{ fontSize: 13.5, color: C.ink }}>{job.partsBlock.part} — {job.partsBlock.note}</div>
                    <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>Job jalan lagi setelah part tersedia.</div>
                </Callout>
            )}
            {job.reassignReq && (
                <Callout tone={C.amber} icon={<User size={16} />} title={`${job.teknisi} minta ganti teknisi`}>
                    <div style={{ fontSize: 13.5, color: C.ink }}>{job.reassignReq.reason}</div>
                    <div style={{ fontSize: 12.5, color: C.sub, marginTop: 4 }}>Putuskan lewat "Ganti Teknisi" di bawah · riwayat & progres tetap tersimpan.</div>
                </Callout>
            )}

            {/* timeline */}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.sub, margin: "6px 0 10px" }}>Kronologi</div>
            <div style={{ position: "relative", paddingLeft: 16 }}>
                <div style={{ position: "absolute", left: 4, top: 4, bottom: 8, width: 2, background: C.line }} />
                {job.events.length === 0 && <div style={{ fontSize: 13, color: C.sub }}>Belum ada aktivitas.</div>}
                {job.events.map((e, i) => (
                    <div key={i} style={{ position: "relative", marginBottom: 12 }}>
                        <div style={{ position: "absolute", left: -15, top: 4, width: 8, height: 8, borderRadius: 999, background: C.admin }} />
                        <div style={{ fontSize: 13.5, color: C.ink }}>{e.label}</div>
                        <div style={{ fontSize: 12, color: C.sub }}>{e.t} · {e.who}</div>
                    </div>
                ))}
            </div>

            {/* contextual action */}
            {!job.teknisi && (
                <PrimaryAction onClick={() => onAssign(job)} label="Assign Teknisi" tone={C.admin} icon={<User size={17} />} />
            )}
            {job.teknisi && job.status !== "completed" && job.status !== "invoiced" && (
                <button onClick={() => onAssign(job)}
                    style={{ marginTop: 16, width: "100%", height: 46, borderRadius: 11, border: `1.5px solid ${C.admin}`, background: "#fff", color: C.admin, fontSize: 14.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <User size={16} /> Ganti Teknisi
                </button>
            )}
            {job.status === "completed" && (
                <PrimaryAction onClick={() => onInvoice(job)} label="Buat Invoice" tone={C.brand} icon={<Check size={17} />} />
            )}
        </Sheet>
    );
}

const Info = ({ label, val }) => (
    <div>
        <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{val}</div>
    </div>
);
const Callout = ({ tone, icon, title, children }) => (
    <div style={{ background: C.amberTint, border: `1px solid ${C.amberBorder}`, borderRadius: 12, padding: "12px 13px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#92610E", fontWeight: 600, fontSize: 13.5, marginBottom: 6 }}>{icon}{title}</div>
        {children}
    </div>
);
const PrimaryAction = ({ onClick, label, tone, icon }) => (
    <button onClick={onClick}
        style={{ marginTop: 18, width: "100%", height: 50, borderRadius: 12, border: "none", background: tone, color: "#fff", fontSize: 15.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {icon}{label}
    </button>
);

// ---- Create order sheet ----
function CreateSheet({ open, onClose, customers, onCreate }) {
    const [step, setStep] = useState(1);
    const [custMode, setCustMode] = useState("pick");
    const [cust, setCust] = useState(null);
    const [nc, setNc] = useState({ nama: "", hp: "", alamat: "" });
    const [jenis, setJenis] = useState([]);
    const [unit, setUnit] = useState(1);
    const [keluhan, setKeluhan] = useState([]);
    const [note, setNote] = useState("");
    const [hari, setHari] = useState("hari");
    const [slot, setSlot] = useState(null);
    const [prio, setPrio] = useState("normal");

    const reset = () => { setStep(1); setCust(null); setNc({ nama: "", hp: "", alamat: "" }); setJenis([]); setUnit(1); setKeluhan([]); setNote(""); setSlot(null); setPrio("normal"); setCustMode("pick"); };
    const close = () => { onClose(); setTimeout(reset, 200); };

    const custOk = custMode === "pick" ? !!cust : nc.nama && nc.alamat;
    const canNext = step === 1 ? custOk : step === 2 ? jenis.length > 0 : !!slot;

    const submit = () => {
        const finalCust = custMode === "pick" ? cust : { ...nc, id: "new" };
        const keluhanText = [...keluhan, note].filter(Boolean).join(", ");
        onCreate({ cust: finalCust, jenis, unit, keluhan: keluhanText || "—", slot, hari, prio });
        close();
    };

    const toggle = (arr, set, v, single) => {
        if (single) return set([v]);
        set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    };

    return (
        <Sheet open={open} onClose={close} title="Buat Order">
            {/* stepper dots */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[1, 2, 3].map((s) => (
                    <div key={s} style={{ flex: 1, height: 4, borderRadius: 999, background: s <= step ? C.admin : C.line }} />
                ))}
            </div>

            {step === 1 && (
                <>
                    <FieldLabel>Customer</FieldLabel>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                        <Chip active={custMode === "pick"} onClick={() => setCustMode("pick")}>Pilih existing</Chip>
                        <Chip active={custMode === "new"} onClick={() => setCustMode("new")}>+ Customer baru</Chip>
                    </div>
                    {custMode === "pick" ? (
                        customers.map((c) => (
                            <div key={c.id} onClick={() => setCust(c)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", marginBottom: 7, borderRadius: 11, cursor: "pointer",
                                    border: `1.5px solid ${cust?.id === c.id ? C.admin : C.line}`, background: cust?.id === c.id ? "#E8EFFD" : "#fff"
                                }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{c.nama}</div>
                                    <div style={{ fontSize: 12.5, color: C.sub }}>{c.alamat}</div>
                                </div>
                                {cust?.id === c.id && <Check size={18} color={C.admin} />}
                            </div>
                        ))
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <TextField ph="Nama customer" val={nc.nama} onChange={(v) => setNc({ ...nc, nama: v })} />
                            <TextField ph="No. HP" val={nc.hp} onChange={(v) => setNc({ ...nc, hp: v })} />
                            <TextField ph="Alamat / lokasi" val={nc.alamat} onChange={(v) => setNc({ ...nc, alamat: v })} />
                        </div>
                    )}
                </>
            )}

            {step === 2 && (
                <>
                    <FieldLabel>Jenis pekerjaan</FieldLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                        {JENIS.map((j) => (
                            <Chip key={j.id} active={jenis.includes(j.id)} onClick={() => toggle(jenis, setJenis, j.id)}>{j.label}</Chip>
                        ))}
                    </div>
                    <FieldLabel>Jumlah unit AC</FieldLabel>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                        <Stepper onClick={() => setUnit(Math.max(1, unit - 1))}>−</Stepper>
                        <span style={{ fontSize: 22, fontWeight: 700, color: C.ink, minWidth: 30, textAlign: "center" }}>{unit}</span>
                        <Stepper onClick={() => setUnit(unit + 1)}>+</Stepper>
                        <Snowflake size={18} color={C.teal} style={{ marginLeft: 4 }} />
                    </div>
                    <FieldLabel>Keluhan (opsional)</FieldLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                        {KELUHAN.map((k) => (
                            <Chip key={k} tone={C.amber} active={keluhan.includes(k)} onClick={() => toggle(keluhan, setKeluhan, k)}>{k}</Chip>
                        ))}
                    </div>
                    <TextField ph="Catatan tambahan…" val={note} onChange={setNote} />
                </>
            )}

            {step === 3 && (
                <>
                    <FieldLabel>Kapan</FieldLabel>
                    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                        <Chip active={hari === "hari"} onClick={() => setHari("hari")}>Hari ini</Chip>
                        <Chip active={hari === "besok"} onClick={() => setHari("besok")}>Besok</Chip>
                    </div>
                    <FieldLabel>Slot waktu</FieldLabel>
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        {SLOT.map((s) => (
                            <Chip key={s.id} active={slot === s.id} onClick={() => setSlot(s.id)}>{s.label} · {s.jam}</Chip>
                        ))}
                    </div>
                    <FieldLabel>Prioritas</FieldLabel>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <Chip active={prio === "normal"} onClick={() => setPrio("normal")}>Normal</Chip>
                        <Chip tone={C.amber} active={prio === "urgent"} onClick={() => setPrio("urgent")}>Urgent</Chip>
                    </div>
                </>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                {step > 1 && (
                    <button onClick={() => setStep(step - 1)}
                        style={{ width: 52, height: 50, borderRadius: 12, border: `1.5px solid ${C.line}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ArrowLeft size={18} color={C.sub} />
                    </button>
                )}
                <button disabled={!canNext} onClick={() => (step < 3 ? setStep(step + 1) : submit())}
                    style={{
                        flex: 1, height: 50, borderRadius: 12, border: "none", cursor: canNext ? "pointer" : "not-allowed",
                        background: canNext ? C.admin : "#CBD5E1", color: "#fff", fontSize: 15.5, fontWeight: 600, fontFamily: FONT
                    }}>
                    {step < 3 ? "Lanjut" : "Buat Order · Terbitkan SPK"}
                </button>
            </div>
            {step === 3 && (
                <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 12 }}>
                    SPK terbit tanpa harga · Invoice dibuat setelah teknisi selesai
                </div>
            )}
        </Sheet>
    );
}

const FieldLabel = ({ children }) => (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.sub, marginBottom: 9 }}>{children}</div>
);
const TextField = ({ ph, val, onChange }) => (
    <input value={val} placeholder={ph} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", height: 46, borderRadius: 11, border: `1.5px solid ${C.line}`, padding: "0 14px", fontSize: 14.5, fontFamily: FONT, color: C.ink, boxSizing: "border-box", outline: "none" }} />
);
const Stepper = ({ children, onClick }) => (
    <button onClick={onClick}
        style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 22, color: C.admin, cursor: "pointer", fontWeight: 600 }}>
        {children}
    </button>
);

const NumField = ({ val, onChange }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1.5px solid ${C.line}`, borderRadius: 9, padding: "0 10px", height: 40, minWidth: 128 }}>
        <span style={{ fontSize: 13, color: C.sub }}>Rp</span>
        <input inputMode="numeric" value={val} placeholder="0"
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
            style={{ border: "none", outline: "none", fontSize: 14.5, fontFamily: FONT, color: C.ink, width: "100%", textAlign: "right", background: "transparent" }} />
    </div>
);

const Toggle = ({ on, onToggle, label }) => (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <span style={{ width: 44, height: 26, borderRadius: 999, background: on ? C.brand : C.line, position: "relative", flexShrink: 0, transition: "0.15s" }}>
            <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: "#fff", transition: "0.15s" }} />
        </span>
        <span style={{ fontSize: 14, color: C.ink }}>{label}</span>
    </div>
);

// Admin menetapkan harga (teknisi TIDAK lihat harga). Tap = emit scope_revised + unblock teknisi + WA opsional.
function RequoteSheet({ open, onClose, job, onConfirm }) {
    const [lines, setLines] = useState([]);
    const [wa, setWa] = useState(true);
    React.useEffect(() => {
        if (job && job.scope) {
            const seed = (job.scope.partsNeeded || []).map((p) => ({ label: p, harga: "" }));
            seed.push({ label: "Jasa " + (job.scope.desc.split("—")[0].trim().toLowerCase()), harga: "" });
            setLines(seed); setWa(true);
        }
    }, [job]);
    if (!job) return null;
    const total = lines.reduce((s, l) => s + (parseInt(l.harga || 0) || 0), 0);
    const ready = total > 0;
    const setHarga = (i, v) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, harga: v } : l)));
    return (
        <Sheet open={open} onClose={onClose} title="Tetapkan Harga Tambahan">
            <div style={{ background: C.canvas, borderRadius: 11, padding: "11px 13px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 3 }}>Temuan teknisi (tanpa harga)</div>
                <div style={{ fontSize: 14, color: C.ink }}>{job.scope.desc}</div>
            </div>
            <FieldLabel>Rincian harga — kamu yang tetapkan</FieldLabel>
            {lines.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                    <span style={{ flex: 1, fontSize: 14, color: C.ink, textTransform: "capitalize" }}>{l.label}</span>
                    <NumField val={l.harga} onChange={(v) => setHarga(i, v)} />
                </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.line}`, marginTop: 8, paddingTop: 12 }}>
                <span style={{ fontSize: 14, color: C.sub }}>Tambahan total</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{rupiah(total)}</span>
            </div>
            <div style={{ marginTop: 16 }}>
                {/* REUSE: WA courtesy notification (komponen existing dari DriverRuntime) */}
                <Toggle on={wa} onToggle={() => setWa(!wa)} label="Kabari customer via WhatsApp" />
            </div>
            <PrimaryAction onClick={() => ready && onConfirm(job, lines, wa)} label={ready ? "Setujui & kunci harga" : "Isi harga dulu"} tone={ready ? C.amber : "#CBD5E1"} icon={<Check size={17} />} />
            <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 10 }}>Teknisi lanjut kerja begitu disetujui · consent final tetap lewat TTD di ujung</div>
        </Sheet>
    );
}

// REUSE: DocumentEngine (existing). origination(order) + fulfillment(selesai) ⇒ Invoice.
// Harga di-freeze saat terbit (snapshot, bukan saldo). Print 80mm + kirim WA = komponen existing.
function InvoiceSheet({ open, onClose, job, onConfirm }) {
    const [lines, setLines] = useState([]);
    const [wa, setWa] = useState(true);
    React.useEffect(() => {
        if (job) {
            const L = [];
            job.jenis.forEach((jn) => {
                const label = JENIS.find((x) => x.id === jn)?.label || jn;
                L.push({ label: `${label} (${job.unit} unit)`, harga: String((HARGA_JASA[jn] || 0) * job.unit), fixed: true });
            });
            (job.parts || []).forEach((p) => L.push({ label: `Part: ${p.nama}${p.qty > 1 ? " ×" + p.qty : ""}`, harga: "" }));
            (job.revisiLines || []).forEach((r) => L.push({ label: r.label + " (tambahan)", harga: String(r.harga || 0), fixed: true }));
            setLines(L); setWa(true);
        }
    }, [job]);
    if (!job) return null;
    const total = lines.reduce((s, l) => s + (parseInt(l.harga || 0) || 0), 0);
    const setHarga = (i, v) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, harga: v } : l)));
    return (
        <Sheet open={open} onClose={onClose} title={"Invoice · " + job.kode}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: C.ink }}>{job.cust.nama}</span>
                <StateTag t="DRAFT" bg="#F1F5F9" fg={C.sub} />
            </div>
            {lines.map((l, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                    <span style={{ flex: 1, fontSize: 14, color: C.ink }}>{l.label}</span>
                    {l.fixed
                        ? <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{rupiah(parseInt(l.harga || 0) || 0)}</span>
                        : <NumField val={l.harga} onChange={(v) => setHarga(i, v)} />}
                </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `2px solid ${C.line}`, marginTop: 8, paddingTop: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: C.brand }}>{rupiah(total)}</span>
            </div>
            <div style={{ marginTop: 16 }}>
                <Toggle on={wa} onToggle={() => setWa(!wa)} label="Kirim invoice ke customer via WhatsApp" />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button onClick={() => onConfirm(job, lines, wa)}
                    style={{ flex: 1, height: 50, borderRadius: 12, border: `1.5px solid ${C.admin}`, background: "#fff", color: C.admin, fontSize: 14.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>
                    Print 80mm
                </button>
                <button onClick={() => onConfirm(job, lines, wa)}
                    style={{ flex: 1.4, height: 50, borderRadius: 12, border: "none", background: C.brand, color: "#fff", fontSize: 14.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer" }}>
                    Terbitkan & Kunci
                </button>
            </div>
            <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 10 }}>Harga dikunci saat terbit — jadi fakta transaksi, bukan saldo</div>
        </Sheet>
    );
}

// ================= MAIN =================
export default function AdminServiceRuntime() {
    const [jobs, setJobs] = useState(seedJobs);
    const [teknisi] = useState(seedTeknisi);
    const [openJob, setOpenJob] = useState(null);
    const [assignFor, setAssignFor] = useState(null);
    const [creating, setCreating] = useState(false);
    const [requoteFor, setRequoteFor] = useState(null);
    const [invoiceFor, setInvoiceFor] = useState(null);

    const zones = useMemo(() => {
        const vonis = jobs.filter((j) => j.scope || j.partsBlock || j.reassignReq || (j.overdue && !j.teknisi));
        const butuh = jobs.filter((j) => !vonis.includes(j) && ((!j.teknisi && j.status === "requested") || j.status === "completed"));
        const inflow = jobs.filter((j) => !vonis.includes(j) && !butuh.includes(j) && (j.status === "assigned" || j.status === "in_progress"));
        const beres = jobs.filter((j) => j.status === "invoiced");
        return { vonis, butuh, inflow, beres };
    }, [jobs]);

    const patch = (id, upd) => setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...upd } : j)));

    const doAssign = (t, reason) => {
        const j = assignFor;
        const isReassign = j.teknisi && j.teknisi !== t.nama;
        const base = isReassign ? `Dipindah dari ${j.teknisi} ke ${t.nama}` : `Ditugaskan ke ${t.nama}`;
        patch(j.id, {
            teknisi: t.nama,
            status: j.status === "requested" ? "assigned" : j.status, // fresh assign → assigned; handover → status tetap
            overdue: false,
            reassignReq: null,
            events: [...j.events, { t: "Baru saja", label: reason ? `${base} · ${reason}` : base, who: "Admin" }],
        });
        setAssignFor(null); setOpenJob(null);
    };
    const approveScope = (j) => { setOpenJob(null); setRequoteFor(j); };
    const invoice = (j) => { setOpenJob(null); setInvoiceFor(j); };

    const commitRequote = (job, lines, wa) => {
        const total = lines.reduce((s, l) => s + (parseInt(l.harga || 0) || 0), 0);
        const ev = [...job.events, { t: "Baru saja", label: `Harga tambahan ditetapkan · ${rupiah(total)}`, who: "Admin" }];
        if (wa) ev.push({ t: "Baru saja", label: "WA estimasi terkirim ke customer", who: "Sistem" });
        patch(job.id, { scope: null, revisi: total, revisiLines: lines.filter((l) => parseInt(l.harga || 0)), events: ev });
        setRequoteFor(null);
    };
    const commitInvoice = (job, lines, wa) => {
        const ev = [...job.events, { t: "Baru saja", label: "Invoice diterbitkan · harga dikunci", who: "Admin" }];
        if (wa) ev.push({ t: "Baru saja", label: "WA invoice terkirim ke customer", who: "Sistem" });
        patch(job.id, { status: "invoiced", events: ev });
        setInvoiceFor(null);
    };
    const createOrder = ({ cust, jenis, unit, keluhan, slot, hari, prio }) => {
        const n = jobs.length + 1200;
        const kode = "JOB-" + (n + 15);
        const jam = slot === "pagi" ? "09:00" : slot === "siang" ? "13:00" : "15:00";
        setJobs((js) => [{
            id: "n" + Date.now(), kode, cust, jenis, unit, keluhan, slot, jam,
            prioritas: prio, teknisi: null, status: "requested", parts: [],
            events: [{ t: "Baru saja", label: "Order dibuat · SPK terbit", who: "Admin" }],
        }, ...js]);
    };

    return (
        <div style={{ background: C.canvas, minHeight: "100vh", display: "flex", justifyContent: "center", fontFamily: FONT }}>
            <div style={{ width: "100%", maxWidth: 430, background: C.canvas, position: "relative", minHeight: "100vh", paddingBottom: 90 }}>

                {/* Zone 1: identity */}
                <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "18px 18px 14px", position: "sticky", top: 0, zIndex: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: C.admin, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>SA</div>
                        <div>
                            <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>Sejuk Abadi Service</div>
                            <div style={{ fontSize: 12.5, color: C.sub }}>Admin · Koordinasi · Sabtu, 1 Agu</div>
                        </div>
                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: C.admin, lineHeight: 1 }}>{zones.inflow.length + zones.butuh.length + zones.vonis.length}</div>
                            <div style={{ fontSize: 11, color: C.sub }}>job aktif</div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: "4px 16px 0" }}>
                    {/* Zone 0 — Vonis */}
                    {zones.vonis.length > 0 && (
                        <>
                            <ZoneHeader title="Butuh keputusan sekarang" count={zones.vonis.length} tone={C.amber} />
                            {zones.vonis.map((j) => <VonisCard key={j.id} job={j} onOpen={setOpenJob} />)}
                        </>
                    )}

                    {/* Zone 1 — Butuh aku */}
                    {zones.butuh.length > 0 && (
                        <>
                            <ZoneHeader title="Butuh aku" count={zones.butuh.length} tone={C.admin} />
                            {zones.butuh.map((j) => <JobCard key={j.id} job={j} onOpen={setOpenJob} />)}
                        </>
                    )}

                    {/* Zone 2 — Inflow */}
                    {zones.inflow.length > 0 && (
                        <>
                            <ZoneHeader title="Lagi jalan" count={zones.inflow.length} tone={C.teal} />
                            {zones.inflow.map((j) => <JobCard key={j.id} job={j} onOpen={setOpenJob} />)}
                        </>
                    )}

                    {/* Zone 3 — Silence */}
                    <div style={{ textAlign: "center", padding: "24px 0 8px", color: C.sub, fontSize: 13 }}>
                        {zones.beres.length > 0 ? `✓ ${zones.beres.length} job beres hari ini` : "Semua beres."}
                    </div>
                </div>

                {/* Zone 5: action bar */}
                <div style={{ position: "sticky", bottom: 0, padding: "12px 16px 16px", background: "linear-gradient(to top, " + C.canvas + " 70%, transparent)" }}>
                    <button onClick={() => setCreating(true)}
                        style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: C.admin, color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: FONT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 16px rgba(37,99,235,0.28)" }}>
                        <Plus size={20} /> Buat Order
                    </button>
                </div>

                {/* overlays */}
                <JobDetail open={!!openJob} onClose={() => setOpenJob(null)} job={openJob}
                    onAssign={(j) => setAssignFor(j)} onApproveScope={approveScope} onInvoice={invoice} />
                <AssignSheet open={!!assignFor} onClose={() => setAssignFor(null)} teknisi={teknisi} current={assignFor?.teknisi} onPick={doAssign} />
                <CreateSheet open={creating} onClose={() => setCreating(false)} customers={seedCustomers} onCreate={createOrder} />
                <RequoteSheet open={!!requoteFor} onClose={() => setRequoteFor(null)} job={requoteFor} onConfirm={commitRequote} />
                <InvoiceSheet open={!!invoiceFor} onClose={() => setInvoiceFor(null)} job={invoiceFor} onConfirm={commitInvoice} />
            </div>
        </div>
    );
}