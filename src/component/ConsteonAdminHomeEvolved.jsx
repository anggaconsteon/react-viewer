import React, { useState } from "react";

// ════════════════════════════════════════════════════════════════════════════
// CONSTEON — AdminHome (EVOLUSI dari original)
// Tulang original dipertahankan. 3 ubahan murah-tinggi-nilai:
//   1. "Perlu Tindakan" → DIKLUSTER + ringkasan ("Belum di-assign mobil · 2"),
//      tiap item kebaca: holder · ringkasan · UMUR · verb.
//   2. Tier "Selesai Hari Ini" (Done) DIBUANG — konvergen tak ngubah keputusan.
//   3. Urut by UMUR mandek (horizon, karena ga ada cutoff jam) — bukan severity.
// Wording: "belum di-assign MOBIL" (assign mobil = Admin; set sopir = Gudang).
// Sisanya (Berjalan, Akan Datang, Outstanding, QuickActions, sheets) = original.
// ════════════════════════════════════════════════════════════════════════════

const FontLoader = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');
    * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .tap-feedback { transition: transform 0.08s ease, opacity 0.08s ease; }
    .tap-feedback:active { transform: scale(0.97); opacity: 0.9; }
    .scroll-thin::-webkit-scrollbar { width: 0; }
    .pop { animation: pop 0.25s ease; }
    @keyframes pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .sheet-up { animation: sheet-up 0.25s ease-out forwards; }
    @keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
  `}</style>
);

const C = {
    bg: "#f1f5f9", surface: "#ffffff", surfaceAlt: "#f8fafc",
    border: "#e2e8f0", borderStrong: "#cbd5e1",
    text: "#0f172a", textMid: "#475569", textDim: "#94a3b8",
    slate50: "#f8fafc", slate100: "#f1f5f9", slate200: "#e2e8f0", slate600: "#475569",
    admin: "#2563eb", adminBg: "#eff6ff", admin100: "#dbeafe", adminDark: "#1e40af",
    gudang: "#0d9488", gudangBg: "#f0fdfa",
    amber700: "#b45309", amber500: "#d97706", amber400: "#f59e0b", amber100: "#fef3c7", amber50: "#fffbeb",
    violet700: "#6d28d9", violet100: "#ede9fe", violet50: "#f5f3ff",
    emerald700: "#047857", emerald100: "#d1fae5", emerald50: "#ecfdf5",
};

const EXECUTOR = { name: "Pak Anto", role: "Koordinasi", vehicle: "B 1234 XY" };

// ─── DATA ─────────────────────────────────────────────────────────────────────
// Sinyal = order/mobil yang MANDEK di tahap rantai. age/ageMin = umur mandek.
const SIGNALS = [
    { id: "S1", type: "unassigned_vehicle", urgency: "high", taskId: "T-0481", customer: "PT Maju Jaya", summary: "3 Gas 12kg · jadwal 09:00", alamat: "Jl. Merdeka No. 12, Ciputat", age: "2 jam", ageMin: 120 },
    { id: "S5", type: "unassigned_vehicle", urgency: "med", taskId: "T-0488", customer: "CV Sejahtera", summary: "6 galon · jadwal 11:00", alamat: "Jl. Melati No. 4, Pamulang", age: "40 mnt", ageMin: 40 },
    { id: "S4", type: "task_returned", urgency: "high", taskId: "T-0479", customer: "Warung Bu Sri", summary: "Dikembalikan driver · route misfit", alamat: "Jl. Anggrek No. 7, Ciputat", age: "1 jam", ageMin: 60 },
    { id: "S2", type: "no_executor", urgency: "high", plate: "B 5678 KL", summary: "3 task ter-assign · belum ada yang pegang", age: "50 mnt", ageMin: 50 },
    { id: "S3", type: "blocked_departure", urgency: "med", plate: "B 9012 MN", summary: "opening check belum kelar di gudang", age: "35 mnt", ageMin: 35 },
];

// Header cluster = KEADAAN (pola "N benda keadaan"). Verb hanya di tombol (action).
const SIGNAL_META = {
    unassigned_vehicle: { icon: "🚚", clusterTpl: "{n} order menunggu kendaraan", action: "Tugaskan" },
    no_executor: { icon: "👤", clusterTpl: "{n} mobil belum ada pengantar", action: "Tunjuk di Gudang", cross: true },
    blocked_departure: { icon: "⛔", clusterTpl: "{n} mobil belum bisa berangkat", action: "Lihat di Gudang", cross: true, soft: true },
    task_returned: { icon: "↩️", clusterTpl: "{n} task dikembalikan driver", action: "Assign Ulang" },
};

const GENESIS_NUDGE = { customer: "Toko Sumber Rejeki", count: 2 };

const ACTIVE = [
    { id: "V-01", plate: "B 1234 XY", executor: "Budi Santoso", progress: "Stop 2 dari 4", note: "Honda Bintaro selesai" },
];
const UPCOMING = [
    { id: "T-0485", customer: "Yamaha Ciputat", summary: "Pickup 5 Gas 3kg", sched: "13:00", plate: "B 1234 XY" },
    { id: "T-0486", customer: "Mandiri Tower", summary: "Drop 6 · Pickup 5 Gas 12kg", sched: "14:30", plate: null },
];
// DONE dibuang.

// Outstanding (panel) — urut tertua dulu (umur = horizon)
const OUTSTANDING = [
    { id: "o1", customer: "Honda Bintaro", item: "Gas 12kg", qty: 8, days: 18, aging: "critical" },
    { id: "o2", customer: "Mandiri Tower", item: "Gas 12kg", qty: 5, days: 9, aging: "warning" },
    { id: "o3", customer: "Toyota Serpong", item: "Galon", qty: 12, days: 4, aging: "normal" },
].sort((a, b) => b.days - a.days);

const AVAILABLE_VEHICLES = [
    { id: "V-04", plate: "B 3344 PQ", type: "Pickup L300", taskCount: 0 },
    { id: "V-05", plate: "B 7788 RS", type: "Box CDD", taskCount: 1 },
    { id: "V-ADHOC", plate: "Ad-hoc / Lainnya", type: "Kendaraan tidak tetap", adhoc: true },
];

// ─── ATOMS ──────────────────────────────────────────────────────────────────
function Chip({ children, variant = "slate" }) {
    const v = {
        slate: { bg: C.slate100, fg: C.slate600 },
        amber: { bg: C.amber50, fg: C.amber700 },
        violet: { bg: C.violet50, fg: C.violet700 },
        emerald: { bg: C.emerald50, fg: C.emerald700 },
        blue: { bg: C.adminBg, fg: C.admin },
        gudang: { bg: C.gudangBg, fg: C.gudang },
    }[variant] || { bg: C.slate100, fg: C.slate600 };
    return (
        <span style={{ background: v.bg, color: v.fg, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
            {children}
        </span>
    );
}

function SectionLabel({ children, right }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{children}</span>
            {right}
        </div>
    );
}

// ─── PERLU TINDAKAN — DIKLUSTER + ringkasan + urut umur (ubahan inti) ────────
function PerluTindakan({ onAction }) {
    const byType = {};
    SIGNALS.forEach((s) => { (byType[s.type] = byType[s.type] || []).push(s); });
    const clusters = Object.entries(byType).map(([type, items]) => ({
        type,
        meta: SIGNAL_META[type],
        items: items.slice().sort((a, b) => b.ageMin - a.ageMin),
        maxAge: Math.max(...items.map((i) => i.ageMin)),
    })).sort((a, b) => b.maxAge - a.maxAge); // cluster tertua (friction terlama) di atas

    return clusters.map((c) => (
        <div key={c.type} style={{ marginBottom: 16 }}>
            {/* ringkasan cluster — label grup (ikon ada di kartu) */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: C.textMid }}>{c.meta.clusterTpl.replace("{n}", c.items.length)}</span>
                {c.meta.cross && <Chip variant="gudang">Gudang</Chip>}
            </div>

            {/* item — gaya kartu original (ikon kotak + tombol full-width) + alamat */}
            {c.items.map((s) => {
                const head = s.customer || s.plate;
                const high = s.urgency === "high";
                return (
                    <div key={s.id} className="pop" style={{
                        background: high ? C.amber50 : C.surface,
                        border: `${high ? "1.5px" : "1px"} solid ${high ? C.amber400 : C.border}`,
                        borderRadius: 14, padding: 14, marginBottom: 10,
                    }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: c.meta.cross ? C.gudangBg : C.adminBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.meta.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                                    <span className="mono" style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{head}</span>
                                    <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: high ? C.amber700 : C.textDim, whiteSpace: "nowrap", flexShrink: 0 }}>{s.age}</span>
                                </div>
                                <div style={{ fontSize: 12.5, color: C.textMid, marginTop: 3 }}>{s.summary}</div>
                                {s.alamat && <div style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>📍 {s.alamat}</div>}
                            </div>
                        </div>
                        <button onClick={() => onAction(s, c.meta)} className="tap-feedback" style={{
                            width: "100%", marginTop: 12, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
                            background: c.meta.soft ? C.surface : (high ? C.amber400 : C.admin),
                            color: c.meta.soft ? C.admin : "#fff",
                            boxShadow: c.meta.soft ? `inset 0 0 0 1px ${C.admin100}` : "none",
                            fontSize: 13.5, fontWeight: 700,
                        }}>
                            {c.meta.action}{c.meta.cross ? "  ⇄" : ""}
                        </button>
                    </div>
                );
            })}
        </div>
    ));
}

// ─── QUICK ACTIONS (original) ────────────────────────────────────────────────
function QuickActions({ onAct }) {
    const items = [
        { id: "customer", icon: "👤", label: "Customer\nBaru" },
        { id: "task", icon: "➕", label: "Order\nMasuk" },
        { id: "walkin", icon: "🚶", label: "Walk-in\nCounter" },
    ];
    return (
        <div style={{ display: "flex", gap: 9, marginBottom: 20 }}>
            {items.map((it) => (
                <button key={it.id} onClick={() => onAct(it.id)} className="tap-feedback" style={{
                    flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13,
                    padding: "12px 6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: C.adminBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{it.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.text, textAlign: "center", lineHeight: 1.25, whiteSpace: "pre-line" }}>{it.label}</span>
                </button>
            ))}
        </div>
    );
}

// ─── FEED CARDS (original; DoneCard dibuang) ─────────────────────────────────
function ActiveCard({ v }) {
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span className="mono" style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{v.plate}</span>
                <Chip variant="emerald">Berjalan</Chip>
            </div>
            <div style={{ fontSize: 12.5, color: C.textMid }}>{v.executor} · {v.progress}</div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>{v.note}</div>
        </div>
    );
}

function UpcomingCard({ t, onAssign }) {
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 13, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{t.customer}</span>
                <Chip variant="slate">{t.sched}</Chip>
            </div>
            <div style={{ fontSize: 12.5, color: C.textMid }}>{t.summary}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {t.plate ? (
                    <span className="mono" style={{ fontSize: 12, color: C.textMid }}>🚚 {t.plate}</span>
                ) : (
                    <button onClick={() => onAssign(t)} className="tap-feedback" style={{ fontSize: 12, fontWeight: 700, color: C.admin, background: C.adminBg, border: "none", padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}>+ Tugaskan Kendaraan</button>
                )}
            </div>
        </div>
    );
}

// ─── OUTSTANDING PANEL (original) ────────────────────────────────────────────
function OutstandingPanel({ onSchedule }) {
    const [open, setOpen] = useState(true);
    const tone = { critical: "amber", warning: "violet", normal: "slate" };
    const label = { critical: "Kritis", warning: "Perhatian", normal: "Normal" };
    return (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginTop: 4 }}>
            <button onClick={() => setOpen((o) => !o)} className="tap-feedback" style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 15px", border: "none", background: "transparent", cursor: "pointer" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.textMid }}>Prioritas Pengambilan</span>
                <span style={{ color: C.textDim, fontSize: 13 }}>{open ? "▾" : "▸"}</span>
            </button>
            {open && OUTSTANDING.map((o) => (
                <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 15px", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <Chip variant={tone[o.aging]}>{label[o.aging]}</Chip>
                            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{o.customer}</span>
                        </div>
                        <div style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>{o.item} · {o.qty} pcs · {o.days} hari</div>
                    </div>
                    <button onClick={() => onSchedule(o)} className="tap-feedback" style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.admin100}`, background: C.adminBg, color: C.admin, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>Jadwalkan</button>
                </div>
            ))}
        </div>
    );
}

// ─── SHEETS (original) ────────────────────────────────────────────────────────
function Sheet({ title, sub, onClose, children }) {
    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", alignItems: "flex-end" }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.4)" }} />
            <div className="sheet-up" style={{ position: "relative", width: "100%", background: C.surface, borderRadius: "20px 20px 0 0", padding: "18px 16px 22px", maxHeight: "82%", overflowY: "auto" }}>
                <div style={{ width: 38, height: 4, borderRadius: 4, background: C.slate200, margin: "0 auto 14px" }} />
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{title}</div>
                {sub && <div style={{ fontSize: 12.5, color: C.textMid, marginTop: 3, marginBottom: 6 }}>{sub}</div>}
                <div style={{ marginTop: 12 }}>{children}</div>
            </div>
        </div>
    );
}

function VehiclePicker({ onPick }) {
    return AVAILABLE_VEHICLES.map((v) => (
        <button key={v.id} onClick={() => onPick(v)} className="tap-feedback" style={{
            width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 14px", marginBottom: 10, cursor: "pointer",
        }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: v.adhoc ? C.slate100 : C.adminBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{v.adhoc ? "＋" : "🚚"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{v.plate}</div>
                <div style={{ fontSize: 12, color: C.textMid }}>{v.type}{!v.adhoc && v.taskCount ? ` · ${v.taskCount} task aktif` : ""}</div>
            </div>
            <span style={{ color: C.textDim, fontSize: 18 }}>›</span>
        </button>
    ));
}

// ─── IDENTITY ZONE (original) ─────────────────────────────────────────────────
function IdentityZone({ onSwitch }) {
    const signalCount = SIGNALS.length;
    const activeCount = ACTIVE.length;
    return (
        <div style={{ background: C.admin, padding: "12px 14px 14px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🗺️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Koordinasi</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.82)" }}>{EXECUTOR.name} · {EXECUTOR.vehicle}</div>
                </div>
                <button onClick={onSwitch} className="tap-feedback" style={{ background: "rgba(255,255,255,0.18)", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, padding: "7px 12px", borderRadius: 9, cursor: "pointer" }}>⇄ Ganti</button>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 7 }}>
                <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.15)", borderRadius: 7, fontSize: 11, color: "#fff", fontWeight: 700 }}>{activeCount} berjalan</span>
                <span style={{ padding: "4px 10px", background: "rgba(255,255,255,0.15)", borderRadius: 7, fontSize: 11, color: "#fff", fontWeight: 700 }}>{signalCount} sinyal</span>
            </div>
        </div>
    );
}

// ─── HOME VIEW (frame-ready inner; no outer phone chrome) ────────────────────
export function AdminHomeView({ onNavigate } = {}) {
    const [toast, setToast] = useState(null);
    const [sheet, setSheet] = useState(null);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

    const onSignalAction = (sig, meta) => {
        if (sig.type === "unassigned_vehicle") setSheet({ mode: "assign", payload: sig });
        else if (sig.type === "task_returned") setSheet({ mode: "reassign", payload: sig });
        else if (sig.type === "no_executor") showToast(`Pindah ke Gudang · tunjuk pengantar ${sig.plate}`);
        else if (sig.type === "blocked_departure") showToast(`Pindah ke Gudang · opening check ${sig.plate}`);
    };

    const onQuick = (id) => {
        if (onNavigate) { onNavigate(id); return; }   // id: customer | task | walkin
        const map = { customer: "Buka Onboarding Customer (provisioning)", task: "Buka Buat Order", walkin: "Buka Walk-in · Counter" };
        showToast(map[id]);
    };

    return (
        <div style={{ width: "100%", height: "100%", background: C.bg, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
            <div style={{ height: 36, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", fontSize: 13, fontWeight: 600, color: C.text, flexShrink: 0 }}>
                <span>08:24</span>
                <span style={{ fontSize: 11 }}>●●●●● 🔋</span>
            </div>

                    <IdentityZone onSwitch={() => showToast("Pindah lingkungan kerja → Launcher")} />

                    <div className="scroll-thin" style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px", position: "relative" }}>
                        {/* PERLU TINDAKAN — diklaster + ringkasan + urut umur */}
                        <SectionLabel>Perlu Tindakan</SectionLabel>
                        <PerluTindakan onAction={onSignalAction} />

                        {/* nudge genesis (original) */}
                        <div style={{ display: "flex", alignItems: "center", gap: 11, background: C.violet50, border: `1px solid ${C.violet100}`, borderRadius: 12, padding: "11px 13px", marginBottom: 22, marginTop: 4 }}>
                            <span style={{ fontSize: 17 }}>🧾</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Saldo awal belum tercatat</div>
                                <div style={{ fontSize: 12, color: C.textMid }}>{GENESIS_NUDGE.count} customer migrasi perlu di-seed</div>
                            </div>
                            <button onClick={() => showToast("Buka Onboarding · catat saldo awal")} className="tap-feedback" style={{ fontSize: 12, fontWeight: 700, color: C.violet700, background: "#fff", border: `1px solid ${C.violet100}`, padding: "6px 11px", borderRadius: 8, cursor: "pointer" }}>Catat</button>
                        </div>

                        <QuickActions onAct={onQuick} />

                        {/* Berjalan (original) */}
                        <SectionLabel>Berjalan</SectionLabel>
                        {ACTIVE.map((v) => <ActiveCard key={v.id} v={v} />)}

                        {/* Akan Datang (original) */}
                        <div style={{ marginTop: 14 }}>
                            <SectionLabel>Akan Datang</SectionLabel>
                            {UPCOMING.map((t) => <UpcomingCard key={t.id} t={t} onAssign={(tt) => setSheet({ mode: "assign", payload: { customer: tt.customer, taskId: tt.id } })} />)}
                        </div>

                        {/* "Selesai Hari Ini" DIBUANG — konvergen tak ngubah keputusan */}

                        {/* OUTSTANDING (original, urut tertua) */}
                        <div style={{ marginTop: 18 }}>
                            <OutstandingPanel onSchedule={(o) => setSheet({ mode: "schedule", payload: o })} />
                        </div>

                        {toast && (
                            <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 60, width: 358, maxWidth: "90%", background: C.text, color: "#fff", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
                                {toast}
                            </div>
                        )}
                    </div>

                    {/* SHEETS (original) */}
                    {sheet?.mode === "assign" && (
                        <Sheet title="Tugaskan Kendaraan" sub={`${sheet.payload.taskId || ""} · ${sheet.payload.customer}`} onClose={() => setSheet(null)}>
                            <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: 10, lineHeight: 1.5 }}>Admin nge-assign <strong>kendaraan</strong>. Siapa yang ngantar ditentukan di Gudang saat loading.</div>
                            <VehiclePicker onPick={(v) => { setSheet(null); showToast(`${sheet.payload.customer} → ${v.plate}`); }} />
                        </Sheet>
                    )}
                    {sheet?.mode === "reassign" && (
                        <Sheet title="Assign Ulang Task" sub={`${sheet.payload.taskId} · ${sheet.payload.customer} — dikembalikan driver`} onClose={() => setSheet(null)}>
                            <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: 10, lineHeight: 1.5 }}>Task balik ke draft, barang tetap di gudang. Pilih kendaraan lain.</div>
                            <VehiclePicker onPick={(v) => { setSheet(null); showToast(`${sheet.payload.taskId} di-assign ulang → ${v.plate}`); }} />
                        </Sheet>
                    )}
                    {sheet?.mode === "schedule" && (
                        <Sheet title="Jadwalkan Pengambilan" sub={`${sheet.payload.customer} · ${sheet.payload.item} ${sheet.payload.qty} pcs · ${sheet.payload.days} hari`} onClose={() => setSheet(null)}>
                            <div style={{ fontSize: 11.5, color: C.textDim, marginBottom: 10, lineHeight: 1.5 }}>Buat pickup task → assign kendaraan.</div>
                            <VehiclePicker onPick={(v) => { setSheet(null); showToast(`Pickup ${sheet.payload.customer} dijadwalkan → ${v.plate}`); }} />
                        </Sheet>
                    )}
        </div>
    );
}

// ─── MAIN (standalone demo wrapper) ──────────────────────────────────────────
export default function AdminHomeEvolved() {
    return (
        <>
            <FontLoader />
            <div style={{ minHeight: "100vh", width: "100vw", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 20px", gap: 16 }}>
                <div style={{ textAlign: "center", color: "#cbd5e1" }}>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, opacity: 0.7 }}>Consteon</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 }}>Admin Home · Koordinasi (evolusi)</div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Cluster + ringkasan · urut umur · tanpa "Selesai"</div>
                </div>

                <div style={{ width: 390, height: 800, maxHeight: "calc(100vh - 130px)", background: C.bg, borderRadius: 36, overflow: "hidden", position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
                    <AdminHomeView />
                </div>

                <div style={{ color: "#64748b", fontSize: 11, textAlign: "center", maxWidth: 360, lineHeight: 1.5 }}>
                    Evolusi konservatif — tulang original utuh. Cluster + ringkasan, urut umur, "Selesai" dibuang. Aksi cross-runtime & launch masih toast.
                </div>
            </div>
        </>
    );
}