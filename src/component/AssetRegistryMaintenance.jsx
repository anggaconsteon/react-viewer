import React, { useState, useMemo } from "react";
import {
    ArrowLeft, ChevronRight, X, MapPin, Phone, Snowflake, CalendarClock,
    Wrench, Droplets, Package, ClipboardCheck, Thermometer, Zap, AlertTriangle,
} from "lucide-react";

/*
  ASSET REGISTRY + ASSET DETAIL — vertikal Service AC (surface Admin)
  Spine: Aset customer = entity kelas-satu dgn LEDGER APPEND-ONLY sendiri (di-key ke asset_id).
  Begitu Work Order refer ke asset_id → History + Lifecycle + PM-grounded jatuh otomatis.

  GUARD 1 — Aset customer ≠ aset returnable. "Lifecycle" di sini = KONDISI/SERVIS dari waktu ke waktu,
            BUKAN custody/lokasi/Isi-Kosong. Unit dimiliki customer; kita hanya maintain.
            Condition di-DERIVE dari history, bukan di-set.
  GUARD 2 — Inspection BUKAN runtime ke-5 — ia evidence terstruktur di DALAM Teknisi runtime;
            di sini ia muncul sebagai entry ber-pengukuran pada history aset.
  1C — identity via label manual (auto saat job pertama). QR per-unit menyusul utk klien komersial.
*/

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
    canvas: "#F1F5F9",
};
const FONT = "Inter, system-ui, -apple-system, sans-serif";

// history: MOST-RECENT-FIRST. Setiap entry = Work Order / inspeksi yang menempel ke aset ini.
const seed = [
    {
        id: "AST-001", label: "AC Area Kasir", merk: "Daikin", pk: "1 PK",
        cust: { nama: "Kafe Kopi Kita", hp: "0812-9090-1122", alamat: "Jl. Anggrek 7" },
        dipasang: "Mei 2026", cadence: 3, lastMonthsAgo: 3,
        history: [
            { when: "Mei 2026", monthsAgo: 3, type: "instalasi", by: "Rian Hidayat", note: "Pemasangan unit baru + uji dingin", wo: "JOB-1209" },
        ],
    },
    {
        id: "AST-002", label: "AC Ruang Duduk", merk: "Daikin", pk: "1.5 PK",
        cust: { nama: "Kafe Kopi Kita", hp: "0812-9090-1122", alamat: "Jl. Anggrek 7" },
        dipasang: "Mei 2026", cadence: 3, lastMonthsAgo: 3,
        history: [
            { when: "Mei 2026", monthsAgo: 3, type: "instalasi", by: "Rian Hidayat", note: "Pemasangan unit baru", wo: "JOB-1209" },
        ],
    },
    {
        id: "AST-003", label: "AC Kamar Utama", merk: "Panasonic", pk: "1 PK",
        cust: { nama: "Ibu Sari", hp: "0812-3344-1200", alamat: "Perum Green Lake C2" },
        dipasang: "2023", cadence: 3, lastMonthsAgo: 1,
        history: [
            { when: "Jul 2026", monthsAgo: 1, type: "perbaikan", by: "Andi Prasetyo", note: "Ganti kompresor — unit sempat mati total", wo: "JOB-1204", inspection: { suhu: "16°C", arus: "5.8 A", freon: "R32 terisi" }, warn: "Arus kompresor agak tinggi — pantau bulan depan" },
            { when: "Apr 2026", monthsAgo: 4, type: "cuci", by: "Deni Kurniawan", note: "Cuci rutin indoor + outdoor", wo: "JOB-1102" },
            { when: "Jan 2026", monthsAgo: 7, type: "cuci", by: "Deni Kurniawan", note: "Cuci rutin", wo: "JOB-0981" },
        ],
    },
    {
        id: "AST-005", label: "AC Kantor Lt.1", merk: "LG", pk: "2 PK",
        cust: { nama: "Toko Berkah Jaya", hp: "0813-7788-4500", alamat: "Jl. Merdeka 45" },
        dipasang: "2022", cadence: 3, lastMonthsAgo: 6,
        history: [
            { when: "Feb 2026", monthsAgo: 6, type: "cuci", by: "Budi Santoso", note: "Cuci rutin", wo: "JOB-1015" },
        ],
    },
    {
        id: "AST-004", label: "AC Ruang Tamu", merk: "Panasonic", pk: "1 PK",
        cust: { nama: "Ibu Sari", hp: "0812-3344-1200", alamat: "Perum Green Lake C2" },
        dipasang: "2023", cadence: 3, lastMonthsAgo: 2,
        history: [
            { when: "Jun 2026", monthsAgo: 2, type: "cuci", by: "Deni Kurniawan", note: "Cuci rutin", wo: "JOB-1150" },
        ],
    },
    {
        id: "AST-006", label: "AC Ruang Rapat", merk: "Sharp", pk: "1 PK",
        cust: { nama: "Pak Joko", hp: "0813-1212-3434", alamat: "Perum Indah A1" },
        dipasang: "2024", cadence: 3, lastMonthsAgo: 1,
        history: [
            { when: "Jul 2026", monthsAgo: 1, type: "cuci", by: "Deni Kurniawan", note: "Cuci rutin", wo: "JOB-1195" },
        ],
    },
];

// Condition DI-DERIVE (health/service, bukan custody).
function conditionOf(a) {
    const last = a.history[0];
    const warn = a.history.some((h) => h.warn);
    const recentRepair = last && last.type === "perbaikan";
    if (warn || recentRepair) return { key: "perhatian", label: "Perlu perhatian", bg: C.amberTint, fg: "#B4791A", dot: C.amber };
    if (a.lastMonthsAgo >= a.cadence) {
        const firstInstall = a.history.length === 1 && a.history[0].type === "instalasi";
        return { key: "jadwal", label: firstInstall ? "Jadwal cek pertama" : "Jadwal servis", bg: C.amberTint, fg: "#B4791A", dot: C.amber };
    }
    return { key: "normal", label: "Beroperasi normal", bg: "#E7F6EF", fg: C.brand, dot: C.brand };
}
const needsAttention = (a) => ["perhatian", "jadwal"].includes(conditionOf(a).key);
const nextDue = (a) => {
    const d = a.cadence - a.lastMonthsAgo;
    return d <= 0 ? "Sekarang" : `± ${Math.round(d)} bln lagi`;
};

const TYPE = {
    instalasi: { icon: Package, label: "Instalasi", color: C.teal },
    cuci: { icon: Droplets, label: "Cuci / Service", color: C.admin },
    freon: { icon: Droplets, label: "Isi Freon", color: C.admin },
    perbaikan: { icon: Wrench, label: "Perbaikan", color: C.amber },
    inspeksi: { icon: ClipboardCheck, label: "Inspeksi", color: C.teal },
};

// ---- atoms ----
const StateTag = ({ label, bg, fg }) => (
    <span style={{ fontFamily: FONT, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 6, background: bg, color: fg }}>{label}</span>
);
const ZoneHeader = ({ title, count, tone }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 2px 10px" }}>
        <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: tone || C.sub }}>{title}</span>
        {count != null && <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: "#fff", background: tone || C.sub, borderRadius: 999, padding: "1px 8px" }}>{count}</span>}
    </div>
);
const InspChip = ({ icon: Icon, val, warn }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 500, color: warn ? "#92610E" : C.ink, background: warn ? C.amberTint : C.canvas, border: `1px solid ${warn ? C.amberBorder : C.line}`, borderRadius: 8, padding: "4px 9px" }}>
        <Icon size={13} /> {val}
    </span>
);

// ---- registry card ----
function AssetCard({ a, onOpen }) {
    const cond = conditionOf(a);
    return (
        <div onClick={() => onOpen(a)} style={{ background: "#fff", border: `1px solid ${C.line}`, borderLeft: `4px solid ${cond.dot}`, borderRadius: 14, padding: "13px 14px", marginBottom: 9, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: C.canvas, display: "flex", alignItems: "center", justifyContent: "center", color: C.teal }}>
                <Snowflake size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>{a.label}</span>
                    <StateTag label={cond.label} bg={cond.bg} fg={cond.fg} />
                </div>
                <div style={{ fontSize: 12.5, color: C.sub }}>{a.cust.nama} · {a.merk} {a.pk}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Terakhir {a.history[0].when} · servis berikutnya {nextDue(a)}</div>
            </div>
            <ChevronRight size={18} color={C.sub} />
        </div>
    );
}

// ---- asset detail (full screen) ----
function AssetDetail({ a, onBack }) {
    const cond = conditionOf(a);
    const lastInsp = a.history.find((h) => h.inspection);
    return (
        <div style={{ minHeight: "100vh", background: C.canvas, paddingBottom: 30 }}>
            <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "16px 16px 14px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
                <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}><ArrowLeft size={22} /></button>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>{a.id}</span>
                <span style={{ marginLeft: "auto" }}><StateTag label={cond.label} bg={cond.bg} fg={cond.fg} /></span>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
                {/* identity */}
                <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${C.line}`, padding: "15px 15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: C.canvas, display: "flex", alignItems: "center", justifyContent: "center", color: C.teal }}><Snowflake size={22} /></div>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{a.label}</div>
                            <div style={{ fontSize: 13, color: C.sub }}>{a.merk} · {a.pk} · dipasang {a.dipasang}</div>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.sub, marginBottom: 3 }}><MapPin size={14} /> {a.cust.nama} — {a.cust.alamat}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.sub }}><Phone size={14} /> {a.cust.hp}</div>
                </div>

                {/* condition + next due */}
                <div style={{ display: "flex", gap: 10, margin: "12px 0" }}>
                    <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: `1px solid ${C.line}`, padding: "11px 13px" }}>
                        <div style={{ fontSize: 11.5, color: C.sub }}>Kondisi (turunan)</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: cond.fg }}>{cond.label}</div>
                    </div>
                    <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: `1px solid ${C.line}`, padding: "11px 13px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.sub }}><CalendarClock size={12} /> Servis berikutnya</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{nextDue(a)}</div>
                    </div>
                </div>

                {/* last inspection evidence */}
                {lastInsp && (
                    <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${C.line}`, padding: "12px 13px", marginBottom: 6 }}>
                        <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 8 }}>Pengukuran terakhir · {lastInsp.when}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                            {lastInsp.inspection.suhu && <InspChip icon={Thermometer} val={lastInsp.inspection.suhu} />}
                            {lastInsp.inspection.arus && <InspChip icon={Zap} val={lastInsp.inspection.arus} warn={!!lastInsp.warn} />}
                            {lastInsp.inspection.freon && <InspChip icon={Droplets} val={lastInsp.inspection.freon} />}
                        </div>
                        {lastInsp.warn && <div style={{ fontSize: 12.5, color: "#92610E", marginTop: 9, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> {lastInsp.warn}</div>}
                    </div>
                )}

                {/* history timeline (append-only, per aset) */}
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: C.sub, margin: "18px 2px 12px" }}>Riwayat perawatan</div>
                <div style={{ position: "relative", paddingLeft: 20 }}>
                    <div style={{ position: "absolute", left: 7, top: 6, bottom: 10, width: 2, background: C.line }} />
                    {a.history.map((h, i) => {
                        const t = TYPE[h.type] || TYPE.cuci;
                        const Icon = t.icon;
                        return (
                            <div key={i} style={{ position: "relative", marginBottom: 16 }}>
                                <div style={{ position: "absolute", left: -20, top: 2, width: 16, height: 16, borderRadius: 999, background: "#fff", border: `2px solid ${t.color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Icon size={9} color={t.color} />
                                </div>
                                <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 13px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{t.label}</span>
                                        <span style={{ marginLeft: "auto", fontSize: 12, color: C.sub }}>{h.when}</span>
                                    </div>
                                    <div style={{ fontSize: 13, color: C.ink, marginTop: 3 }}>{h.note}</div>
                                    <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{h.by} · {h.wo}</div>
                                    {h.inspection && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                            {h.inspection.suhu && <InspChip icon={Thermometer} val={h.inspection.suhu} />}
                                            {h.inspection.arus && <InspChip icon={Zap} val={h.inspection.arus} warn={!!h.warn} />}
                                            {h.inspection.freon && <InspChip icon={Droplets} val={h.inspection.freon} />}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ textAlign: "center", padding: "12px 0 4px", color: C.sub, fontSize: 12 }}>Histori permanen aset · dasar untuk PM & keputusan servis berikutnya</div>
            </div>
        </div>
    );
}

// ================= MAIN =================
export default function AssetRegistry() {
    const [assets] = useState(seed);
    const [activeId, setActiveId] = useState(null);
    const active = assets.find((a) => a.id === activeId) || null;

    const groups = useMemo(() => {
        const perhatian = assets.filter(needsAttention);
        const normal = assets.filter((a) => !needsAttention(a));
        return { perhatian, normal };
    }, [assets]);

    if (active) {
        return (
            <div style={{ background: C.canvas, minHeight: "100vh", display: "flex", justifyContent: "center", fontFamily: FONT }}>
                <div style={{ width: "100%", maxWidth: 430 }}>
                    <AssetDetail a={active} onBack={() => setActiveId(null)} />
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: C.canvas, minHeight: "100vh", display: "flex", justifyContent: "center", fontFamily: FONT }}>
            <div style={{ width: "100%", maxWidth: 430, background: C.canvas, position: "relative", minHeight: "100vh", paddingBottom: 24 }}>
                <div style={{ background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "18px 18px 14px", position: "sticky", top: 0, zIndex: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button style={{ background: "none", border: "none", cursor: "pointer", color: C.ink }}><ArrowLeft size={22} /></button>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Aset Customer</div>
                            <div style={{ fontSize: 12.5, color: C.sub }}>Registry & riwayat perawatan · Sejuk Abadi</div>
                        </div>
                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, lineHeight: 1 }}>{assets.length}</div>
                            <div style={{ fontSize: 11, color: C.sub }}>unit terdata</div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: "4px 16px 0" }}>
                    {groups.perhatian.length > 0 && (
                        <>
                            <ZoneHeader title="Perlu perhatian" count={groups.perhatian.length} tone={C.amber} />
                            {groups.perhatian.map((a) => <AssetCard key={a.id} a={a} onOpen={(x) => setActiveId(x.id)} />)}
                        </>
                    )}
                    {groups.normal.length > 0 && (
                        <>
                            <ZoneHeader title="Beroperasi normal" count={groups.normal.length} tone={C.brand} />
                            {groups.normal.map((a) => <AssetCard key={a.id} a={a} onOpen={(x) => setActiveId(x.id)} />)}
                        </>
                    )}
                    <div style={{ textAlign: "center", padding: "20px 0 8px", color: C.sub, fontSize: 12.5 }}>
                        Kondisi & jadwal di-hitung dari riwayat tiap aset · identity via label (QR menyusul)
                    </div>
                </div>
            </div>
        </div>
    );
}