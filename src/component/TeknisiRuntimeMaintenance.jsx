import React, { useState, useRef, useMemo } from "react";
import {
    ArrowLeft, MapPin, Phone, Clock, Camera, Check, X, Package, Wrench,
    AlertTriangle, PenLine, WifiOff, Snowflake, ChevronRight, Play,
    Printer, Receipt, Wallet, Users, Plus,
} from "lucide-react";

/*
  TEKNISI RUNTIME — Vertikal Service AC  (handoff mockup, Flutter target)
  Execution runtime (padanan Driver di Consteon).
  Doctrine yang dijaga:
   - Teknisi TIDAK pernah lihat harga (job/parts/scope tanpa angka). Lapor FAKTA.
   - Offline-canonical: mode lapangan = normal, bukan degraded.
   - Foto = bukti (awal wajib, akhir wajib; scope wajib foto).
   - TTD customer = handshake dua-pihak (two-party check pindah ke ujung).
   - Silence = success: job selesai jadi diam, tanpa perayaan.
   - Discrepancy: (a) lapor temuan tambahan → scope, NON-BLOCKING, kerja dasar lanjut,
     Admin yang menetapkan harga.  (b) parts kurang → HOLD, Admin dikabari.
   - Append-only events; state di-derive, bukan di-set langsung (di Flutter).
*/

const C = {
    teknisi: "#0D9488",      // teal — runtime cluster, beda dari Admin biru
    brand: "#1D9E75",
    amber: "#EF9F27",
    amberTint: "#FEF6E7",
    amberBorder: "#F4B740",
    ink: "#0F172A",
    sub: "#64748B",
    line: "#E2E8F0",
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
// Katalog parts — tanpa harga (harga milik Admin).
const PARTS = ["Freon R32", "Freon R410", "Kapasitor", "Kompresor 1 PK", "Pipa AC (m)", "Bracket outdoor", "Cairan pembersih coil", "Karet dudukan", "Fitting kuningan"];

// Harga milik ADMIN, sudah di-freeze. Diakses HANYA saat printPolicy = "terbuka" untuk mencetak
// invoice (teknisi = print terminal: tampil di dokumen, tak bisa diedit). Di produksi = snapshot dari Admin.
const HARGA_JASA = { cuci: 65000, perbaikan: 150000, freon: 120000, instalasi: 350000, bongkar: 250000 };
const HARGA_PART = { "Freon R32": 90000, "Freon R410": 110000, "Kapasitor": 45000, "Kompresor 1 PK": 750000, "Pipa AC (m)": 35000, "Bracket outdoor": 60000, "Cairan pembersih coil": 25000, "Karet dudukan": 15000, "Fitting kuningan": 20000 };

const jenisLabel = (ids) => ids.map((i) => JENIS.find((j) => j.id === i)?.label || i).join(", ");

const seedJobs = [
    {
        id: "j1", kode: "JOB-1204", cust: { nama: "Ibu Sari", hp: "0812-3344-1200", alamat: "Perum Green Lake blok C2" },
        jenis: ["perbaikan"], unit: 2, keluhan: "AC kamar nggak dingin, kompresor bunyi", jam: "09:00", prioritas: "urgent",
        tstate: "belum_mulai", fotoBefore: false, fotoAfter: false, parts: [], scopeReported: false, ttd: false, preAssigned: ["IS-1"], linked: [], events: [],
    },
    {
        id: "j2", kode: "JOB-1220", cust: { nama: "Pak Rudi", hp: "0813-5566-7788", alamat: "Jl. Kenanga No. 8" },
        jenis: ["cuci"], unit: 3, keluhan: "Service rutin 3 bulanan", jam: "10:30", prioritas: "normal",
        tstate: "dikerjakan", fotoBefore: true, fotoAfter: false, parts: [{ nama: "Cairan pembersih coil", qty: 2 }], scopeReported: false, ttd: false, linked: ["PR-1", "PR-2", "PR-3"],
        events: [{ t: "10:35", label: "Mulai kerja · tiba di lokasi", who: "Andi" }, { t: "10:38", label: "Unit dikonfirmasi (3)", who: "Andi" }, { t: "10:40", label: "Foto kondisi awal diambil", who: "Andi" }],
    },
    {
        id: "j3", kode: "JOB-1225", cust: { nama: "Bu Wati", hp: "0857-1122-3344", alamat: "Ruko Damai No. 4" },
        jenis: ["freon"], unit: 1, keluhan: "Kurang dingin", jam: "13:00", prioritas: "normal",
        tstate: "belum_mulai", fotoBefore: false, fotoAfter: false, parts: [], scopeReported: false, ttd: false, events: [],
    },
    {
        id: "j4", kode: "JOB-1188", cust: { nama: "Kantor Maju Jaya", hp: "-", alamat: "Jl. Sudirman 21" },
        jenis: ["cuci"], unit: 2, keluhan: "Service rutin", jam: "08:00", prioritas: "normal",
        tstate: "selesai", fotoBefore: true, fotoAfter: true, parts: [{ nama: "Cairan pembersih coil", qty: 1 }], scopeReported: false, ttd: true, events: [],
    },
];

// Registry aset per-customer (unit punya identity + history sendiri).
// Work Order nge-link ke asset_id; saat selesai, kerjaan di-APPEND ke history unit.
const seedAssets = [
    {
        id: "IS-1", custNama: "Ibu Sari", label: "AC Kamar Utama", merk: "Panasonic", pk: "1 PK", cadence: 3, lastMonthsAgo: 1,
        history: [{ when: "Jul 2026", type: "perbaikan", by: "Andi Prasetyo", note: "Ganti kompresor — sempat mati total", wo: "JOB-1204" }, { when: "Apr 2026", type: "cuci", by: "Deni", note: "Cuci rutin", wo: "JOB-1102" }]
    },
    {
        id: "IS-2", custNama: "Ibu Sari", label: "AC Ruang Tamu", merk: "Panasonic", pk: "1 PK", cadence: 3, lastMonthsAgo: 2,
        history: [{ when: "Jun 2026", type: "cuci", by: "Deni", note: "Cuci rutin", wo: "JOB-1150" }]
    },
    {
        id: "PR-1", custNama: "Pak Rudi", label: "AC Toko Depan", merk: "LG", pk: "1 PK", cadence: 3, lastMonthsAgo: 4,
        history: [{ when: "Apr 2026", type: "cuci", by: "Budi", note: "Cuci rutin", wo: "JOB-1101" }]
    },
    {
        id: "PR-2", custNama: "Pak Rudi", label: "AC Toko Tengah", merk: "LG", pk: "1 PK", cadence: 3, lastMonthsAgo: 4,
        history: [{ when: "Apr 2026", type: "cuci", by: "Budi", note: "Cuci rutin", wo: "JOB-1101" }]
    },
    { id: "PR-3", custNama: "Pak Rudi", label: "AC Gudang", merk: "LG", pk: "1.5 PK", cadence: 3, lastMonthsAgo: 0, history: [] },
    {
        id: "BW-1", custNama: "Bu Wati", label: "AC Ruko", merk: "Sharp", pk: "1 PK", cadence: 3, lastMonthsAgo: 5,
        history: [{ when: "Mar 2026", type: "cuci", by: "Deni", note: "Cuci rutin", wo: "JOB-1016" }]
    },
];

const stateChip = (t) => ({
    belum_mulai: { label: "BELUM MULAI", bg: "#F1F5F9", fg: C.sub },
    dikerjakan: { label: "DIKERJAKAN", bg: "#E1F2F0", fg: C.teknisi },
    hold_parts: { label: "HOLD · PARTS", bg: C.amberTint, fg: "#B4791A" },
    selesai: { label: "SELESAI", bg: "#E7F6EF", fg: C.brand },
}[t]);

// ---------- atoms ----------
const StateTag = ({ label, bg, fg }) => (
    <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, background: bg, color: fg }}>{label}</span>
);
const FieldLabel = ({ children }) => (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.sub, margin: "2px 0 9px" }}>{children}</div>
);
const Chip = ({ children, active, onClick, tone }) => (
    <button onClick={onClick}
        style={{
            fontFamily: FONT, fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
            border: `1.5px solid ${active ? (tone || C.teknisi) : C.line}`, background: active ? (tone ? tone + "16" : "#E1F2F0") : "#fff", color: active ? (tone || C.teknisi) : C.ink
        }}>
        {children}
    </button>
);
const PrimaryAction = ({ onClick, label, tone, icon, disabled }) => (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
        style={{ marginTop: 16, width: "100%", height: 52, borderRadius: 13, border: "none", background: disabled ? "#CBD5E1" : tone, color: "#fff", fontSize: 15.5, fontWeight: 600, fontFamily: FONT, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {icon}{label}
    </button>
);

function Sheet({ open, onClose, children, title }) {
    if (!open) return null;
    return (
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.42)", display: "flex", alignItems: "flex-end", zIndex: 50 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxHeight: "90%", borderRadius: "22px 22px 0 0", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: FONT }}>
                <div style={{ display: "flex", alignItems: "center", padding: "16px 18px 12px", borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: C.ink }}>{title}</span>
                    <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.sub }}><X size={22} /></button>
                </div>
                <div style={{ overflowY: "auto", padding: "16px 18px 24px" }}>{children}</div>
            </div>
        </div>
    );
}

const Stepper = ({ v, set }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => set(Math.max(0, v - 1))} style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 18, color: C.teknisi, cursor: "pointer", fontWeight: 600 }}>−</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.ink, minWidth: 22, textAlign: "center" }}>{v}</span>
        <button onClick={() => set(v + 1)} style={{ width: 34, height: 34, borderRadius: 9, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 18, color: C.teknisi, cursor: "pointer", fontWeight: 600 }}>+</button>
    </div>
);

// Photo capture (mock — kamera asli di Flutter). Menandai bukti terekam.
const PhotoTile = ({ captured, onCapture, label }) => (
    <div onClick={captured ? undefined : onCapture}
        style={{
            display: "flex", alignItems: "center", gap: 12, padding: "16px 14px", borderRadius: 13, marginBottom: 6, cursor: captured ? "default" : "pointer",
            border: `1.5px ${captured ? "solid" : "dashed"} ${captured ? C.brand : C.line}`, background: captured ? "#F0FBF6" : "#fff"
        }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: captured ? "#DBF3E8" : C.canvas, display: "flex", alignItems: "center", justifyContent: "center", color: captured ? C.brand : C.sub }}>
            {captured ? <Check size={22} /> : <Camera size={22} />}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: captured ? C.brand : C.ink }}>{captured ? "Foto terekam" : label}</div>
            <div style={{ fontSize: 12.5, color: C.sub }}>{captured ? "Ketuk selesai untuk lanjut" : "Ketuk untuk ambil foto"}</div>
        </div>
    </div>
);

// Signature pad — TTD customer (handshake dua-pihak).
function SignaturePad({ onChange }) {
    const ref = useRef(null);
    const drawing = useRef(false);
    const has = useRef(false);
    const pos = (e) => {
        const c = ref.current; const r = c.getBoundingClientRect();
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: cx - r.left, y: cy - r.top };
    };
    const start = (e) => { drawing.current = true; const ctx = ref.current.getContext("2d"); const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e) => {
        if (!drawing.current) return;
        e.preventDefault();
        const ctx = ref.current.getContext("2d"); const p = pos(e);
        ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = C.ink;
        ctx.lineTo(p.x, p.y); ctx.stroke();
        if (!has.current) { has.current = true; onChange(true); }
    };
    const end = () => { drawing.current = false; };
    const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); has.current = false; onChange(false); };
    return (
        <div>
            <canvas ref={ref} width={352} height={150}
                onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
                onTouchStart={start} onTouchMove={move} onTouchEnd={end}
                style={{ width: "100%", height: 150, border: `1.5px solid ${C.line}`, borderRadius: 12, touchAction: "none", background: "#fff", display: "block" }} />
            <button onClick={clear} style={{ marginTop: 8, background: "none", border: "none", color: C.sub, fontSize: 13, fontFamily: FONT, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <PenLine size={14} /> Ulangi tanda tangan
            </button>
        </div>
    );
}

// ---------- action sheets ----------
function PartsSheet({ open, onClose, job, onSave }) {
    const [qty, setQty] = useState({});
    React.useEffect(() => { if (job) { const q = {}; (job.parts || []).forEach((p) => (q[p.nama] = p.qty)); setQty(q); } }, [job]);
    if (!job) return null;
    const set = (name, v) => setQty((s) => ({ ...s, [name]: v }));
    const save = () => onSave(job, PARTS.filter((p) => qty[p] > 0).map((p) => ({ nama: p, qty: qty[p] })));
    return (
        <Sheet open={open} onClose={onClose} title="Catat Parts Terpakai">
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Pilih parts yang kamu pakai. Kamu cukup catat jenis + jumlah — harga ditentukan Admin, nggak muncul di sini.</div>
            {PARTS.map((p) => (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 4px", borderBottom: `1px solid ${C.line}` }}>
                    <span style={{ flex: 1, fontSize: 14, color: C.ink }}>{p}</span>
                    <Stepper v={qty[p] || 0} set={(v) => set(p, v)} />
                </div>
            ))}
            <PrimaryAction onClick={save} label="Simpan catatan parts" tone={C.teknisi} icon={<Package size={17} />} />
        </Sheet>
    );
}

function ScopeSheet({ open, onClose, job, onSubmit }) {
    const [desc, setDesc] = useState("");
    const [needed, setNeeded] = useState([]);
    const [foto, setFoto] = useState(false);
    React.useEffect(() => { if (job) { setDesc(""); setNeeded([]); setFoto(false); } }, [job]);
    if (!job) return null;
    const ready = desc.trim().length >= 10 && foto;
    const toggle = (p) => setNeeded((n) => (n.includes(p) ? n.filter((x) => x !== p) : [...n, p]));
    return (
        <Sheet open={open} onClose={onClose} title="Lapor Temuan Tambahan">
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Ada kerjaan di luar order? Lapor apa adanya (tanpa harga). Admin yang tetapkan harga; kerja dasar boleh lanjut.</div>
            <FieldLabel>Apa yang kamu temukan</FieldLabel>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Contoh: kompresor unit 1 rusak total, perlu ganti…"
                style={{ width: "100%", minHeight: 82, borderRadius: 12, border: `1.5px solid ${C.line}`, padding: "12px 14px", fontSize: 14.5, fontFamily: FONT, color: C.ink, boxSizing: "border-box", outline: "none", resize: "none" }} />
            <div style={{ fontSize: 11.5, color: desc.trim().length >= 10 ? C.brand : C.sub, marginTop: 4, marginBottom: 16 }}>{desc.trim().length}/10 karakter minimum</div>
            <FieldLabel>Parts yang dibutuhkan (opsional)</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {PARTS.map((p) => <Chip key={p} active={needed.includes(p)} onClick={() => toggle(p)}>{p}</Chip>)}
            </div>
            <FieldLabel>Foto bukti temuan (wajib)</FieldLabel>
            <PhotoTile captured={foto} onCapture={() => setFoto(true)} label="Foto bagian yang bermasalah" />
            <PrimaryAction disabled={!ready} onClick={() => onSubmit(job, { desc, needed, foto: true })} label={ready ? "Kirim ke Admin" : "Lengkapi deskripsi & foto"} tone={C.amber} icon={<Wrench size={17} />} />
        </Sheet>
    );
}

function PartsKurangSheet({ open, onClose, job, onSubmit }) {
    const [part, setPart] = useState(null);
    React.useEffect(() => { if (job) setPart(null); }, [job]);
    if (!job) return null;
    return (
        <Sheet open={open} onClose={onClose} title="Parts Kurang — Hold Job">
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Part yang dibutuhkan nggak tersedia? Pilih partnya. Job ke-hold & Admin langsung dikabari — kamu bisa lanjut ke job berikutnya.</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                {PARTS.map((p) => <Chip key={p} tone={C.amber} active={part === p} onClick={() => setPart(p)}>{p}</Chip>)}
            </div>
            <PrimaryAction disabled={!part} onClick={() => onSubmit(job, part)} label={part ? `Hold job — ${part} kurang` : "Pilih part dulu"} tone={C.amber} icon={<AlertTriangle size={17} />} />
        </Sheet>
    );
}

function CompletionSheet({ open, onClose, job, onDone }) {
    const [foto, setFoto] = useState(false);
    const [signed, setSigned] = useState(false);
    const [bayar, setBayar] = useState(null);
    React.useEffect(() => { if (job) { setFoto(!!job.fotoAfter); setSigned(false); setBayar(null); } }, [job]);
    if (!job) return null;
    const canFinish = foto && signed && bayar;
    const opsi = [{ id: "tunai", label: "Tunai" }, { id: "transfer", label: "Transfer" }, { id: "belum", label: "Belum bayar" }];
    return (
        <Sheet open={open} onClose={onClose} title="Selesaikan Pekerjaan">
            <FieldLabel>1 · Foto kondisi akhir (wajib)</FieldLabel>
            <PhotoTile captured={foto} onCapture={() => setFoto(true)} label="Foto hasil kerja" />
            <div style={{ height: 14 }} />
            <FieldLabel>2 · Tanda tangan customer (wajib)</FieldLabel>
            <div style={{ fontSize: 13.5, color: C.ink, marginBottom: 10 }}>Minta <b>{job.cust.nama}</b> tanda tangan di kotak ini:</div>
            <SignaturePad onChange={setSigned} />
            <div style={{ height: 18 }} />
            <FieldLabel>3 · Pembayaran (observasi — tanpa nominal)</FieldLabel>
            <div style={{ display: "flex", gap: 8 }}>
                {opsi.map((o) => <Chip key={o.id} active={bayar === o.id} onClick={() => setBayar(o.id)}>{o.label}</Chip>)}
            </div>
            <PrimaryAction disabled={!canFinish} onClick={() => onDone(job, bayar)} label={canFinish ? "Selesai · kabari customer" : "Lengkapi foto, TTD & pembayaran"} tone={C.brand} icon={<Check size={17} />} />
            <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 10 }}>TTD = konfirmasi dua-pihak · kamu cukup catat cara bayar, nominal diurus Admin</div>
        </Sheet>
    );
}

// ---------- job execution screen ----------
function StepDot({ done, active, label }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
            <div style={{
                width: 22, height: 22, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? C.brand : active ? C.teknisi : "#fff", border: `2px solid ${done ? C.brand : active ? C.teknisi : C.line}`, color: "#fff"
            }}>
                {done && <Check size={13} />}
            </div>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: done ? C.brand : active ? C.teknisi : C.sub, textAlign: "center", lineHeight: 1.2 }}>{label}</span>
        </div>
    );
}

function JobExecution({ job, onBack, onMulai, onCaptureBefore, openParts, openScope, openKurang, openComplete, onResume, openRequest, custAssets, openUnit, printPolicy, onPrint }) {
    const sc = stateChip(job.tstate);
    const linkedIds = job.linked || [];
    const linkedAssets = custAssets.filter((a) => linkedIds.includes(a.id));
    const steps = [
        { label: "Mulai", done: job.tstate !== "belum_mulai" },
        { label: "Unit", done: (job.linked || []).length > 0 },
        { label: "Foto awal", done: job.fotoBefore },
        { label: "Kerja", done: job.tstate === "selesai" || job.parts.length > 0 || job.fotoAfter },
        { label: "Foto akhir", done: job.fotoAfter },
        { label: "TTD", done: job.ttd },
    ];
    const activeIdx = steps.findIndex((s) => !s.done);
    return (
        <div style={{ minHeight: "100vh", background: C.canvas, paddingBottom: 24 }}>
            {/* bar */}
            <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "16px 16px 14px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
                <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}><ArrowLeft size={22} /></button>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{job.kode}</span>
                <span style={{ marginLeft: "auto" }}><StateTag {...sc} /></span>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
                {/* customer */}
                <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.line}`, padding: "15px 15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 19, fontWeight: 700, color: C.ink }}>{job.cust.nama}</span>
                        {job.prioritas === "urgent" && <StateTag label="URGENT" bg={C.amberTint} fg="#B4791A" />}
                    </div>
                    <a href="#" onClick={(e) => e.preventDefault()} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: C.teknisi, textDecoration: "none", marginBottom: 6, fontWeight: 500 }}>
                        <MapPin size={15} /> {job.cust.alamat} <ChevronRight size={14} />
                    </a>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: C.sub }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={13} /> {job.jam}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={13} /> {job.cust.hp}</span>
                    </div>
                </div>

                {/* spec */}
                <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
                    <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: `1px solid ${C.line}`, padding: "11px 13px" }}>
                        <div style={{ fontSize: 11.5, color: C.sub }}>Jenis</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{jenisLabel(job.jenis)}</div>
                    </div>
                    <div style={{ width: 90, background: "#fff", borderRadius: 12, border: `1px solid ${C.line}`, padding: "11px 13px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ fontSize: 11.5, color: C.sub }}>Unit</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Snowflake size={14} color={C.teknisi} /><span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{job.unit}</span></div>
                    </div>
                </div>
                <div style={{ background: C.canvas, borderRadius: 12, padding: "11px 13px", marginBottom: 14 }}>
                    <span style={{ fontSize: 11.5, color: C.sub }}>Keluhan</span>
                    <div style={{ fontSize: 14, color: C.ink }}>{job.keluhan}</div>
                </div>

                {/* linked unit(s) — Work Order ↔ asset_id */}
                {linkedAssets.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 7 }}>Unit dikerjakan</div>
                        {linkedAssets.map((u) => (
                            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 11, padding: "10px 12px", marginBottom: 7 }}>
                                <Snowflake size={17} color={C.teknisi} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{u.label} <span style={{ color: C.sub, fontWeight: 400 }}>· {u.merk} {u.pk}</span></div>
                                    <div style={{ fontSize: 12, color: C.sub }}>{u.history[0] ? `Terakhir: ${u.history[0].type} ${u.history[0].when}` : "Unit baru — belum ada riwayat"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* progress */}
                {job.tstate !== "selesai" && (
                    <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.line}`, padding: "16px 14px", marginBottom: 14, display: "flex", position: "relative" }}>
                        {steps.map((s, i) => <StepDot key={i} done={s.done} active={i === activeIdx} label={s.label} />)}
                    </div>
                )}

                {/* evidence + notes */}
                {(job.parts.length > 0 || job.scopeReported || job.tstate === "hold_parts" || job.reassignReq) && (
                    <div style={{ marginBottom: 14 }}>
                        {job.parts.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.ink, marginBottom: 8 }}>
                                <Package size={15} color={C.teknisi} /> {job.parts.map((p) => `${p.nama}${p.qty > 1 ? " ×" + p.qty : ""}`).join(", ")}
                            </div>
                        )}
                        {job.scopeReported && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92610E", background: C.amberTint, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "9px 12px", marginBottom: 8 }}>
                                <Wrench size={15} /> Temuan tambahan terkirim ke Admin · nunggu harga
                            </div>
                        )}
                        {job.reassignReq && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92610E", background: C.amberTint, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "9px 12px", marginBottom: 8 }}>
                                <Users size={15} /> Permintaan ganti terkirim ke Admin · nunggu keputusan
                            </div>
                        )}
                        {job.tstate === "hold_parts" && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#92610E", background: C.amberTint, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "9px 12px" }}>
                                <AlertTriangle size={15} /> Job ke-hold — {job.holdPart} kurang · Admin dikabari
                            </div>
                        )}
                    </div>
                )}

                {job.tstate === "selesai" && (
                    <div style={{ padding: "20px 0 8px" }}>
                        <div style={{ textAlign: "center", color: C.brand, marginBottom: 18 }}>
                            <Check size={40} style={{ background: "#DBF3E8", borderRadius: 999, padding: 8 }} />
                            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>Pekerjaan selesai</div>
                            <div style={{ fontSize: 13, color: C.sub }}>
                                TTD terekam{job.bayar ? ` · ${{ tunai: "Tunai", transfer: "Transfer", belum: "Belum bayar" }[job.bayar]}` : ""}
                            </div>
                        </div>
                        <button onClick={() => onPrint(job, "slip")} style={printBtn(false)}>
                            <Printer size={17} /> Cetak Surat Selesai
                        </button>
                        {printPolicy === "terbuka" && (
                            <button onClick={() => onPrint(job, "invoice")} style={{ ...printBtn(true), marginTop: 10 }}>
                                <Receipt size={17} /> Cetak Invoice
                            </button>
                        )}
                        <div style={{ fontSize: 12, color: C.sub, textAlign: "center", marginTop: 12 }}>
                            {printPolicy === "ketat"
                                ? "Surat selesai tanpa harga · invoice resmi dari Admin (WA)"
                                : "Toko ini izinkan cetak invoice on-site · harga dikunci Admin"}
                        </div>
                    </div>
                )}
            </div>

            {/* action zone (in-flow) */}
            {job.tstate !== "selesai" && (
                <div style={{ padding: "8px 16px 28px" }}>
                    <div>
                        {job.tstate === "belum_mulai" && (
                            <PrimaryAction onClick={() => onMulai(job)} label="Mulai kerja" tone={C.teknisi} icon={<Play size={17} />} />
                        )}
                        {job.tstate === "dikerjakan" && linkedAssets.length === 0 && (
                            <PrimaryAction onClick={() => openUnit(job)} label="Konfirmasi unit" tone={C.teknisi} icon={<Snowflake size={17} />} />
                        )}
                        {job.tstate === "dikerjakan" && linkedAssets.length > 0 && !job.fotoBefore && (
                            <PrimaryAction onClick={() => onCaptureBefore(job)} label="Foto kondisi awal (wajib)" tone={C.teknisi} icon={<Camera size={17} />} />
                        )}
                        {job.tstate === "dikerjakan" && linkedAssets.length > 0 && job.fotoBefore && (
                            <>
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                    <SecBtn onClick={() => openParts(job)} icon={<Package size={16} />} label="Parts" />
                                    <SecBtn onClick={() => openScope(job)} icon={<Wrench size={16} />} label="Temuan" />
                                    <SecBtn onClick={() => openKurang(job)} icon={<AlertTriangle size={16} />} label="Parts kurang" />
                                </div>
                                {!job.reassignReq && (
                                    <button onClick={() => openRequest(job)}
                                        style={{ width: "100%", height: 42, borderRadius: 11, border: `1.5px dashed ${C.line}`, background: "#fff", color: C.sub, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 8 }}>
                                        <Users size={15} /> Minta ganti teknisi
                                    </button>
                                )}
                                <PrimaryAction onClick={() => openComplete(job)} label="Selesaikan pekerjaan" tone={C.brand} icon={<Check size={17} />} />
                            </>
                        )}
                        {job.tstate === "hold_parts" && (
                            <PrimaryAction onClick={() => onResume(job)} label="Part sudah tersedia · lanjut" tone={C.teknisi} icon={<Play size={17} />} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const SecBtn = ({ onClick, icon, label }) => (
    <button onClick={onClick} style={{ flex: 1, height: 46, borderRadius: 11, border: `1.5px solid ${C.line}`, background: "#fff", color: C.ink, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <span style={{ color: C.teknisi }}>{icon}</span>{label}
    </button>
);

// ---------- job row (home) ----------
function JobRow({ job, isNext, onOpen }) {
    const sc = stateChip(job.tstate);
    return (
        <div onClick={() => onOpen(job)} style={{ background: "#fff", border: `1px solid ${isNext ? C.teknisi : C.line}`, borderRadius: 14, padding: "13px 14px", marginBottom: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: isNext ? "0 2px 10px rgba(13,148,136,0.12)" : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 44 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: isNext ? C.teknisi : C.ink }}>{job.jam}</span>
            </div>
            <div style={{ width: 1, height: 34, background: C.line }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{job.cust.nama}</span>
                    {isNext && <StateTag label="BERIKUTNYA" bg="#E1F2F0" fg={C.teknisi} />}
                </div>
                <div style={{ fontSize: 13, color: C.ink }}>{jenisLabel(job.jenis)} · {job.unit} unit</div>
                <div style={{ fontSize: 12.5, color: C.sub, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><MapPin size={12} /> {job.cust.alamat}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <StateTag {...sc} /><ChevronRight size={16} color={C.sub} />
            </div>
        </div>
    );
}

const printBtn = (filled) => ({ width: "100%", height: 48, borderRadius: 12, cursor: "pointer", fontFamily: FONT, fontSize: 14.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: filled ? "none" : `1.5px solid ${C.teknisi}`, background: filled ? C.teknisi : "#fff", color: filled ? "#fff" : C.teknisi });

const rupiahP = (n) => "Rp" + n.toLocaleString("id-ID");
const Line = ({ l, r, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: bold ? 700 : 400, marginBottom: 2 }}>
        <span style={{ flex: 1 }}>{l}</span><span>{r}</span>
    </div>
);

// Cetak: "slip" = Surat Selesai (tanpa harga, selalu boleh). "invoice" = frozen (hanya policy terbuka).
function PrintPreview({ open, onClose, data }) {
    if (!data) return null;
    const { job, kind } = data;
    const isInvoice = kind === "invoice";
    const jasa = job.jenis.map((jn) => ({ label: `${JENIS.find((x) => x.id === jn)?.label || jn} (${job.unit} unit)`, harga: (HARGA_JASA[jn] || 0) * job.unit }));
    const parts = (job.parts || []).map((p) => ({ label: `${p.nama}${p.qty > 1 ? " ×" + p.qty : ""}`, harga: (HARGA_PART[p.nama] || 0) * p.qty }));
    const total = [...jasa, ...parts].reduce((s, l) => s + l.harga, 0);
    return (
        <Sheet open={open} onClose={onClose} title={isInvoice ? "Invoice" : "Surat Selesai Kerja"}>
            <div style={{ background: "#fff", border: `1px dashed ${C.line}`, borderRadius: 8, padding: "18px 16px", fontFamily: "ui-monospace, monospace", fontSize: 12.5, color: C.ink, maxWidth: 300, margin: "0 auto 16px" }}>
                <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13 }}>SEJUK ABADI SERVICE</div>
                <div style={{ textAlign: "center", color: C.sub, marginBottom: 8 }}>{isInvoice ? "INVOICE" : "SURAT SELESAI KERJA"}</div>
                <Line l="No" r={job.kode} />
                <Line l="Tgl" r="1 Agu 2026" />
                <Line l="Pelanggan" r={job.cust.nama} />
                <div style={{ borderTop: `1px dashed ${C.line}`, margin: "8px 0" }} />
                {jasa.map((x, i) => <Line key={i} l={x.label} r={isInvoice ? rupiahP(x.harga) : "✓"} />)}
                {parts.map((x, i) => <Line key={"p" + i} l={x.label} r={isInvoice ? rupiahP(x.harga) : "✓"} />)}
                <div style={{ borderTop: `1px dashed ${C.line}`, margin: "8px 0" }} />
                {isInvoice
                    ? <Line l="TOTAL" r={rupiahP(total)} bold />
                    : <div style={{ color: C.sub, fontSize: 11.5 }}>Nota tanpa harga. Invoice resmi menyusul dari kantor.</div>}
                <div style={{ marginTop: 12, textAlign: "center", color: C.sub, fontSize: 11 }}>TTD customer: ✓ terekam</div>
                <div style={{ textAlign: "center", color: C.sub, fontSize: 11 }}>Teknisi: Andi Prasetyo</div>
            </div>
            {isInvoice && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#92610E", background: C.amberTint, border: `1px solid ${C.amberBorder}`, borderRadius: 10, padding: "9px 12px", marginBottom: 4 }}>
                    <Wallet size={15} /> Harga dikunci Admin · kamu cuma cetak, nggak bisa ubah
                </div>
            )}
            {/* REUSE: printer 80mm Bluetooth (komponen existing) */}
            <PrimaryAction onClick={onClose} label="Cetak ke printer 80mm" tone={C.teknisi} icon={<Printer size={17} />} />
        </Sheet>
    );
}

// ================= MAIN =================
// Teknisi minta ganti → request ke Admin (Admin yang decide). Non-blocking.
function RequestSheet({ open, onClose, job, onSubmit }) {
    const [reason, setReason] = useState(null);
    const [note, setNote] = useState("");
    React.useEffect(() => { if (job) { setReason(null); setNote(""); } }, [job]);
    if (!job) return null;
    const alasan = ["Butuh senior", "Kondisi berat", "Butuh 2 orang", "Berhalangan lanjut"];
    const ready = !!reason;
    return (
        <Sheet open={open} onClose={onClose} title="Minta Ganti Teknisi">
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>Kerjaan di luar kapasitas/kemampuan? Kirim permintaan ke Admin — Admin yang mutusin & mindahin. Kamu bisa lanjut sambil nunggu.</div>
            <FieldLabel>Alasan</FieldLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {alasan.map((a) => <Chip key={a} tone={C.amber} active={reason === a} onClick={() => setReason(a)}>{a}</Chip>)}
            </div>
            <FieldLabel>Catatan (opsional)</FieldLabel>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: kompresor perlu ganti, butuh yang lebih senior…"
                style={{ width: "100%", minHeight: 70, borderRadius: 12, border: `1.5px solid ${C.line}`, padding: "12px 14px", fontSize: 14.5, fontFamily: FONT, color: C.ink, boxSizing: "border-box", outline: "none", resize: "none" }} />
            <PrimaryAction disabled={!ready} onClick={() => onSubmit(job, note ? `${reason} — ${note}` : reason)} label={ready ? "Kirim permintaan ke Admin" : "Pilih alasan dulu"} tone={C.amber} icon={<Users size={17} />} />
        </Sheet>
    );
}

// Konfirmasi unit (rekonsiliasi: konfirmasi yang diusulkan Admin / identify / label baru).
// Nge-link Work Order ke asset_id sebelum evidence diambil.
function UnitSheet({ open, onClose, custAssets, linked, preAssigned, onConfirm, onCreate }) {
    const [sel, setSel] = useState([]);
    const [adding, setAdding] = useState(false);
    const [label, setLabel] = useState("");
    const [merk, setMerk] = useState("");
    React.useEffect(() => { if (open) { setSel(linked && linked.length ? linked : (preAssigned || [])); setAdding(false); setLabel(""); setMerk(""); } }, [open]);
    const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    const addUnit = () => { const id = onCreate(label.trim(), merk.trim()); setSel((s) => [...s, id]); setAdding(false); setLabel(""); setMerk(""); };
    const adaUsulan = (preAssigned || []).length > 0;
    return (
        <Sheet open={open} onClose={onClose} title="Konfirmasi Unit">
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>
                {adaUsulan ? "Admin mengusulkan unit di bawah — cek & sesuaikan kalau beda di lapangan." : "Konfirmasi unit yang kamu kerjakan. Riwayat & bukti bakal nempel ke unit ini."}
            </div>
            {custAssets.map((a) => {
                const on = sel.includes(a.id);
                const usul = (preAssigned || []).includes(a.id);
                return (
                    <div key={a.id} onClick={() => toggle(a.id)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", marginBottom: 8, border: `1.5px solid ${on ? C.teknisi : C.line}`, background: on ? "#E1F2F0" : "#fff", borderRadius: 12, cursor: "pointer" }}>
                        <Snowflake size={18} color={C.teknisi} />
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{ fontSize: 14.5, fontWeight: 600, color: C.ink }}>{a.label} <span style={{ color: C.sub, fontWeight: 400 }}>· {a.merk} {a.pk}</span></span>
                                {usul && <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "2px 6px", borderRadius: 5, background: "#E1F2F0", color: C.teknisi }}>Diusulkan</span>}
                            </div>
                            <div style={{ fontSize: 12, color: C.sub }}>{a.history[0] ? `Terakhir: ${a.history[0].type} ${a.history[0].when}` : "Unit baru — belum ada riwayat"}</div>
                        </div>
                        {on ? <Check size={18} color={C.teknisi} /> : <span style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${C.line}` }} />}
                    </div>
                );
            })}
            {adding ? (
                <div style={{ border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "12px", marginBottom: 8 }}>
                    <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nama unit (mis. AC Kamar)"
                        style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${C.line}`, padding: "0 12px", fontSize: 14.5, fontFamily: FONT, color: C.ink, boxSizing: "border-box", outline: "none", marginBottom: 8 }} />
                    <input value={merk} onChange={(e) => setMerk(e.target.value)} placeholder="Merk / PK (opsional)"
                        style={{ width: "100%", height: 44, borderRadius: 10, border: `1.5px solid ${C.line}`, padding: "0 12px", fontSize: 14.5, fontFamily: FONT, color: C.ink, boxSizing: "border-box", outline: "none", marginBottom: 10 }} />
                    <button onClick={addUnit} disabled={!label.trim()}
                        style={{ width: "100%", height: 44, borderRadius: 10, border: "none", background: label.trim() ? C.teknisi : "#CBD5E1", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: FONT, cursor: label.trim() ? "pointer" : "not-allowed" }}>Tambah unit</button>
                </div>
            ) : (
                <button onClick={() => setAdding(true)}
                    style={{ width: "100%", height: 44, borderRadius: 11, border: `1.5px dashed ${C.line}`, background: "#fff", color: C.teknisi, fontSize: 13.5, fontWeight: 600, fontFamily: FONT, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 8 }}>
                    <Plus size={16} /> Unit belum terdaftar
                </button>
            )}
            <PrimaryAction disabled={sel.length === 0} onClick={() => onConfirm(sel)} label={sel.length ? `Konfirmasi ${sel.length} unit` : "Pilih unit dulu"} tone={C.teknisi} icon={<Check size={17} />} />
        </Sheet>
    );
}

export default function TeknisiRuntime() {
    const [jobs, setJobs] = useState(seedJobs);
    const [activeId, setActiveId] = useState(null);
    const [partsFor, setPartsFor] = useState(null);
    const [scopeFor, setScopeFor] = useState(null);
    const [kurangFor, setKurangFor] = useState(null);
    const [completeFor, setCompleteFor] = useState(null);
    const [reqFor, setReqFor] = useState(null);
    const [assets, setAssets] = useState(seedAssets);
    const [unitOpen, setUnitOpen] = useState(false);
    const [printFor, setPrintFor] = useState(null);          // { job, kind }
    const [printPolicy, setPrintPolicy] = useState("ketat"); // demo; di produksi = config tenant

    const active = jobs.find((j) => j.id === activeId) || null;
    const patch = (id, upd) => setJobs((js) => js.map((j) => (j.id === id ? (typeof upd === "function" ? upd(j) : { ...j, ...upd }) : j)));

    const ordered = useMemo(() => [...jobs].sort((a, b) => a.jam.localeCompare(b.jam)), [jobs]);
    const nextId = ordered.find((j) => j.tstate === "belum_mulai" || j.tstate === "dikerjakan")?.id;
    const sisa = jobs.filter((j) => j.tstate !== "selesai").length;

    const ev = (j, label) => [...j.events, { t: "Baru saja", label, who: "Andi" }];

    const onMulai = (j) => patch(j.id, (x) => ({ ...x, tstate: "dikerjakan", events: ev(x, "Mulai kerja · tiba di lokasi") }));
    const onCaptureBefore = (j) => patch(j.id, (x) => ({ ...x, fotoBefore: true, events: ev(x, "Foto kondisi awal diambil") }));
    const saveParts = (j, parts) => { patch(j.id, (x) => ({ ...x, parts, events: ev(x, "Parts terpakai dicatat") })); setPartsFor(null); };
    const reportScope = (j, data) => { patch(j.id, (x) => ({ ...x, scopeReported: true, events: ev(x, "Temuan tambahan dilaporkan ke Admin") })); setScopeFor(null); };
    const partsKurang = (j, part) => { patch(j.id, (x) => ({ ...x, tstate: "hold_parts", holdPart: part, events: ev(x, `Hold — ${part} kurang · Admin dikabari`) })); setKurangFor(null); };
    const onResume = (j) => patch(j.id, (x) => ({ ...x, tstate: "dikerjakan", holdPart: null, events: ev(x, "Part tersedia · kerja dilanjut") }));
    const requestReassign = (j, reason) => { patch(j.id, (x) => ({ ...x, reassignReq: reason, events: ev(x, `Minta ganti teknisi · ${reason}`) })); setReqFor(null); };

    const linkUnits = (ids) => { if (active) patch(active.id, (x) => ({ ...x, linked: ids, events: ev(x, `Unit dikonfirmasi (${ids.length})`) })); setUnitOpen(false); };
    const createUnit = (label, merk) => {
        const id = "U" + Date.now();
        setAssets((as) => [...as, { id, custNama: active?.cust.nama, label, merk: merk || "-", pk: "", cadence: 3, lastMonthsAgo: 0, history: [] }]);
        return id;
    };

    const bayarLabel = { tunai: "Tunai", transfer: "Transfer", belum: "Belum bayar" };
    const completeJob = (j, bayar) => {
        // REUSE: WA courtesy notification (komponen existing dari DriverRuntime)
        // WIRING: append pekerjaan ini ke history tiap unit yang di-link (asset_id ← Work Order)
        const entry = { when: "Hari ini", type: j.jenis[0], by: "Andi Prasetyo", note: j.keluhan || "Pekerjaan selesai", wo: j.kode };
        setAssets((as) => as.map((a) => ((j.linked || []).includes(a.id) ? { ...a, lastMonthsAgo: 0, history: [entry, ...a.history] } : a)));
        patch(j.id, (x) => ({
            ...x, tstate: "selesai", fotoAfter: true, ttd: true, bayar,
            events: [...ev(x, "Pekerjaan selesai · foto akhir"), { t: "Baru saja", label: "TTD customer diterima", who: "Andi" }, { t: "Baru saja", label: `Pembayaran diobservasi: ${bayarLabel[bayar]}`, who: "Andi" }, { t: "Baru saja", label: `Riwayat ${(j.linked || []).length} unit ter-update`, who: "Sistem" }, { t: "Baru saja", label: "WA courtesy terkirim ke customer", who: "Sistem" }]
        }));
        setCompleteFor(null);
    };

    return (
        <div style={{ background: C.canvas, minHeight: "100vh", display: "flex", justifyContent: "center", fontFamily: FONT }}>
            <div style={{ width: "100%", maxWidth: 430, background: C.canvas, position: "relative", minHeight: "100vh", overflow: "hidden" }}>

                {active ? (
                    <JobExecution job={active} onBack={() => setActiveId(null)}
                        onMulai={onMulai} onCaptureBefore={onCaptureBefore}
                        openParts={setPartsFor} openScope={setScopeFor} openKurang={setKurangFor} openComplete={setCompleteFor} onResume={onResume} openRequest={setReqFor}
                        custAssets={assets.filter((a) => a.custNama === active.cust.nama)} openUnit={() => setUnitOpen(true)}
                        printPolicy={printPolicy} onPrint={(job, kind) => setPrintFor({ job, kind })} />
                ) : (
                    <div style={{ paddingBottom: 30 }}>
                        {/* identity zone */}
                        <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "18px 18px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 999, background: "#E1F2F0", color: C.teknisi, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>AP</div>
                                <div>
                                    <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink }}>Andi Prasetyo</div>
                                    <div style={{ fontSize: 12.5, color: C.sub }}>Teknisi · Sabtu, 1 Agu</div>
                                </div>
                                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: C.teknisi, lineHeight: 1 }}>{sisa}</div>
                                    <div style={{ fontSize: 11, color: C.sub }}>job tersisa</div>
                                </div>
                            </div>
                            {/* offline-canonical band (silence = tersimpan) */}
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 12, color: C.sub, background: C.canvas, borderRadius: 9, padding: "8px 12px" }}>
                                <WifiOff size={14} /> Mode lapangan · semua tersimpan lokal, sinkron otomatis saat ada sinyal
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                                <span style={{ fontSize: 11, color: C.sub }}>Demo · policy toko:</span>
                                <Chip active={printPolicy === "ketat"} onClick={() => setPrintPolicy("ketat")}>Ketat</Chip>
                                <Chip active={printPolicy === "terbuka"} onClick={() => setPrintPolicy("terbuka")}>Terbuka</Chip>
                            </div>
                        </div>

                        <div style={{ padding: "16px 16px 0" }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.sub, margin: "2px 2px 12px" }}>Jadwal hari ini</div>
                            {ordered.map((j) => <JobRow key={j.id} job={j} isNext={j.id === nextId} onOpen={(x) => setActiveId(x.id)} />)}
                            <div style={{ textAlign: "center", padding: "18px 0 8px", color: C.sub, fontSize: 13 }}>
                                {sisa === 0 ? "✓ Semua job hari ini beres" : `${jobs.filter((j) => j.tstate === "selesai").length} selesai · ${sisa} jalan`}
                            </div>
                        </div>
                    </div>
                )}

                {/* overlays */}
                <PartsSheet open={!!partsFor} onClose={() => setPartsFor(null)} job={partsFor} onSave={saveParts} />
                <ScopeSheet open={!!scopeFor} onClose={() => setScopeFor(null)} job={scopeFor} onSubmit={reportScope} />
                <PartsKurangSheet open={!!kurangFor} onClose={() => setKurangFor(null)} job={kurangFor} onSubmit={partsKurang} />
                <CompletionSheet open={!!completeFor} onClose={() => setCompleteFor(null)} job={completeFor} onDone={completeJob} />
                <PrintPreview open={!!printFor} onClose={() => setPrintFor(null)} data={printFor} />
                <RequestSheet open={!!reqFor} onClose={() => setReqFor(null)} job={reqFor} onSubmit={requestReassign} />
                <UnitSheet open={unitOpen} onClose={() => setUnitOpen(false)} custAssets={active ? assets.filter((a) => a.custNama === active.cust.nama) : []} linked={active?.linked || []} preAssigned={active?.preAssigned || []} onConfirm={linkUnits} onCreate={createUnit} />
            </div>
        </div>
    );
}