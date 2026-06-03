import React, { useState, useMemo } from "react";
import {
    ChevronLeft, ChevronRight, MapPin, Camera, Satellite,
    ShieldCheck, ShieldAlert, X, Check, LogOut, LogIn, CircleDot,
    ChevronDown, Pencil, Info, History, Users, ClipboardCheck,
    Hourglass, Lock, QrCode, Type, Search,
    Inbox, Palmtree, Stethoscope, Clock3, Timer, CalendarOff, Repeat,
    AlertOctagon, Siren, Wrench, Sparkles, HeartPulse, HelpCircle,
    ArrowRight, Send, MessageSquare, FileText, ExternalLink,
    Briefcase, Shield, MessageCircle,
} from "lucide-react";

/* ============================================================
   AUTSORZ — App Supervisor (gabungan)
   Layar 1: daftar site, satu kartu/site dengan dua panel (kehadiran + patroli)
   Layar 2: detail kehadiran sepanjang hari + panel koreksi clock (bagian 14, 15)
   Layar 3: ringkasan patroli per titik (bagian 16)
   Layar 4: timeline per titik (bagian 16)
   Prinsip lintas layar:
   - Yang bermasalah di atas, yang beres terjangkau di bawah
   - Tingkat bukti konsisten: kuat (hijau) vs lemah (kuning) di setiap data
   - Sistem tidak mengklaim lebih dari yang ia tahu (catatan kaki transparansi)
   - Warna: hijau=beres/bukti kuat, kuning=perhatian/lemah/jeda, merah=perlu tindak
   ============================================================ */

const ALLOW_SHIFT_ASSUMPTION = true; // bagian 15: opsi tengah, konfigurasi per vendor
const STALE_HOURS = 12;              // bagian 16: default jeda signifikan, bisa diatur tim
const NOW_LABEL = "14:20";

// =================== PALET (konsisten antar layar) ===================
const C = {
    ink: "#1C1F26", mute: "#6B7280", soft: "#8A93A6",
    // status
    ok: "#0E7C66", okBg: "#E3F4EF",
    warn: "#B7791F", warnBg: "#FBF1DC",
    danger: "#C0392B", dangerBg: "#FBE9E7",
    // jenis
    superv: "#7A3FA0", supervBg: "#F3EAF9",   // ditetapkan supervisor
    blue: "#2C5FAA", blueBg: "#E6EEF9",
    // permukaan
    cardBd: "#ECEEF2", line: "#EEF0F4", chip: "#F1F4F9",
};

// =================== DUMMY DATA ===================
const SITES = [
    {
        id: "bp-legok", name: "BP Legok", client: "BP",
        presence: { present: 8, need: 10, issues: ["2 belum scan", "1 lupa clock-out"], status: "danger" },
        patrol: { totalPoints: 12, staleCount: 2, longestGapHours: 23, status: "warn" },
    },
    {
        id: "goto-tangerang", name: "GoTo Tangerang", client: "GoTo",
        presence: { present: 12, need: 12, issues: [], status: "ok" },
        patrol: { totalPoints: 8, staleCount: 1, longestGapHours: 14, status: "warn" },
    },
    {
        id: "bintaro", name: "Bintaro Xchange", client: "Bintaro Xchange",
        presence: { present: 5, need: 8, issues: ["3 belum scan"], status: "danger" },
        patrol: { totalPoints: 6, staleCount: 0, longestGapHours: 4, status: "ok" },
    },
    {
        id: "bp-bsd", name: "BP BSD", client: "BP",
        presence: { present: 9, need: 9, issues: ["1 bukti lemah"], status: "warn" },
        patrol: { totalPoints: 10, staleCount: 0, longestGapHours: 6, status: "ok" },
    },
    {
        id: "bp-gading", name: "BP Gading Serpong", client: "BP",
        presence: { present: 10, need: 10, issues: [], status: "ok" },
        patrol: { totalPoints: 9, staleCount: 0, longestGapHours: 5, status: "ok" },
    },
    {
        id: "goto-jakarta", name: "GoTo Jakarta Tower", client: "GoTo",
        presence: { present: 14, need: 16, issues: ["2 belum scan"], status: "danger" },
        patrol: { totalPoints: 11, staleCount: 0, longestGapHours: 8, status: "ok" },
    },
    {
        id: "mall-surabaya", name: "Mall Surabaya", client: "Mall Group",
        presence: { present: 7, need: 8, issues: ["1 lupa clock-out"], status: "warn" },
        patrol: { totalPoints: 14, staleCount: 1, longestGapHours: 15, status: "warn" },
    },
    {
        id: "pabrik-cikarang", name: "Pabrik Cikarang A", client: "BP",
        presence: { present: 6, need: 6, issues: [], status: "ok" },
        patrol: { totalPoints: 7, staleCount: 0, longestGapHours: 4, status: "ok" },
    },
    {
        id: "kantor-sudirman", name: "Kantor Sudirman", client: "GoTo",
        presence: { present: 4, need: 4, issues: [], status: "ok" },
        patrol: { totalPoints: 5, staleCount: 0, longestGapHours: 3, status: "ok" },
    },
];

const SHIFTS = [
    {
        id: "pagi", name: "Shift Pagi", time: "06:00–14:00", phase: "past", present: 9, need: 10,
        rows: [
            { id: 1, name: "Budi Santoso", in: "05:58", out: null, issue: "no_out", evidence: "strong" },
            { id: 2, name: "Sari Wulandari", in: "06:02", out: "14:01", issue: null, evidence: "strong" },
            { id: 3, name: "Joko Anwar", in: "06:00", out: "14:05", issue: null, evidence: "weak" },
        ],
    },
    {
        id: "siang", name: "Shift Siang", time: "14:00–22:00", phase: "live", present: 7, need: 10,
        rows: [
            { id: 4, name: "Dewi Lestari", in: "13:55", out: null, issue: null, evidence: "strong" },
            { id: 5, name: "Agus Pratama", in: "14:03", out: null, issue: null, evidence: "weak" },
            { id: 6, name: "Rian Hidayat", in: null, out: null, issue: "no_in", evidence: null },
            { id: 7, name: "Maya Putri", in: "14:00", out: null, issue: null, evidence: "strong" },
        ],
    },
    { id: "malam", name: "Shift Malam", time: "22:00–06:00", phase: "upcoming", present: 0, need: 8, rows: [] },
];

// patroli/cleaning per site
const POINTS_BY_SITE = {
    "bp-legok": [
        { id: "p1", name: "Pos Utama", type: "patroli", lastHoursAgo: 0.5, visits24h: 6, lastBy: "Budi", evidence: "strong" },
        { id: "p2", name: "Gudang Bahan", type: "patroli", lastHoursAgo: 23, visits24h: 1, lastBy: "Agus", evidence: "weak" },
        { id: "p3", name: "Toilet Lt 1", type: "cleaning", lastHoursAgo: 2, visits24h: 3, lastBy: "Citra", evidence: "strong" },
        { id: "p4", name: "Genset", type: "patroli", lastHoursAgo: 18, visits24h: 1, lastBy: "Andi", evidence: "weak" },
        { id: "p5", name: "Loading Dock", type: "patroli", lastHoursAgo: 1, visits24h: 5, lastBy: "Budi", evidence: "strong" },
        { id: "p6", name: "Mushola", type: "cleaning", lastHoursAgo: 8, visits24h: 2, lastBy: "Sari", evidence: "strong" },
    ],
};

// timeline kunjungan satu titik (contoh: Gudang Bahan)
const VISITS = {
    "p2": [
        { id: 1, when: "13:42 hari ini", by: "Agus", evidence: "weak", method: "type", note: "Patroli rutin" },
        { id: 2, when: "Kemarin 14:55", by: "Budi", evidence: "strong", method: "qr", note: "Cek pintu samping" },
        { id: 3, when: "Kemarin 09:10", by: "Sari", evidence: "strong", method: "qr", note: "" },
        { id: 4, when: "2 hari lalu", by: "Andi", evidence: "weak", method: "type", note: "QR scanner error" },
    ],
};

// ============================================================
//  KOMPONEN UMUM (dipakai lintas layar — KONSISTENSI)
// ============================================================
function EvidenceBadge({ level, small }) {
    if (level === "strong")
        return (
            <span style={badgeStyle(C.ok, C.okBg, small)}>
                <ShieldCheck size={small ? 11 : 13} /> Bukti kuat
            </span>
        );
    if (level === "weak")
        return (
            <span style={badgeStyle(C.warn, C.warnBg, small)}>
                <ShieldAlert size={small ? 11 : 13} /> GPS saja
            </span>
        );
    return null;
}
function badgeStyle(color, bg, small) {
    return {
        display: "inline-flex", alignItems: "center", gap: 4,
        fontSize: small ? 10.5 : 11.5, fontWeight: 700, color, background: bg,
        padding: small ? "2px 7px" : "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
    };
}
function SetBySupervisorTag() {
    return (
        <span style={{ ...badgeStyle(C.superv, C.supervBg, true), border: "1px dashed #C9A6E0" }}>
            <Pencil size={11} /> Ditetapkan supervisor
        </span>
    );
}
function AssumptionTag() {
    return (
        <span style={{ ...badgeStyle(C.warn, C.warnBg, true), border: "1px dashed #E3C77A" }}>
            <Info size={11} /> Asumsi, bukan bukti
        </span>
    );
}
function StatusPill({ tone, children }) {
    const map = {
        ok: [C.ok, C.okBg], warn: [C.warn, C.warnBg], danger: [C.danger, C.dangerBg],
    }[tone] || [C.mute, C.chip];
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11.5, fontWeight: 700, color: map[0], background: map[1],
            padding: "4px 9px", borderRadius: 20, whiteSpace: "nowrap",
        }}>{children}</span>
    );
}
function TransparencyNote({ icon: Icon = Info, children }) {
    return (
        <div style={{
            display: "flex", gap: 8, padding: "11px 13px", background: "#F6F7F9",
            borderRadius: 11, fontSize: 11.5, color: C.soft, lineHeight: 1.5,
            border: "1px dashed #DDE1E8",
        }}>
            <Icon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{children}</span>
        </div>
    );
}
function FormatHoursAgo(h) {
    if (h < 1) return `${Math.round(h * 60)} menit lalu`;
    if (h < 24) return `${Math.round(h)} jam lalu`;
    return `${Math.round(h / 24)} hari lalu`;
}

// ============================================================
//  LAYAR 1 — daftar site, dikelompokkan per tingkat keparahan
//  Pertanyaan pagi hari "mana yang penting?" dijawab group;
//  pertanyaan "bawa saya ke X" dijawab search di header.
// ============================================================
function worstStatus(s) {
    const sev = { ok: 0, warn: 1, danger: 2 };
    return Math.max(sev[s.presence.status] || 0, sev[s.patrol.status] || 0);
}
function ScreenSites({ onOpenPresence, onOpenPatrol }) {
    const [query, setQuery] = useState("");
    const [openGroups, setOpenGroups] = useState({ danger: true, warn: true, ok: true });

    // urutkan di dalam tiap group: kombinasi keparahan dua panel (sama seperti dulu)
    const score = (s) => {
        const sev = { ok: 0, warn: 1, danger: 2 };
        return (sev[s.presence.status] || 0) * 2 + (sev[s.patrol.status] || 0);
    };
    const matchesQuery = (s) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.client.toLowerCase().includes(q);
    };
    const grouped = useMemo(() => {
        const buckets = { danger: [], warn: [], ok: [] };
        SITES.filter(matchesQuery).forEach((s) => {
            const w = worstStatus(s);
            buckets[w === 2 ? "danger" : w === 1 ? "warn" : "ok"].push(s);
        });
        Object.values(buckets).forEach((arr) => arr.sort((a, b) => score(b) - score(a)));
        return buckets;
    }, [query]);

    const totalShown = grouped.danger.length + grouped.warn.length + grouped.ok.length;

    return (
        <div>
            {/* Search bar */}
            <div style={{
                display: "flex", alignItems: "center", gap: 9, background: "#fff",
                border: `1.5px solid ${C.cardBd}`, borderRadius: 12, padding: "10px 13px", marginBottom: 14,
            }}>
                <Search size={17} color={C.soft} />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari site atau klien…"
                    style={{
                        flex: 1, border: "none", outline: "none", fontSize: 14,
                        fontFamily: "inherit", color: C.ink, background: "transparent"
                    }} />
                {query && (
                    <button onClick={() => setQuery("")}
                        style={{ border: "none", background: "none", cursor: "pointer", color: C.soft, display: "flex", padding: 0 }}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Ringkasan agregat — pertanyaan pagi hari dijawab di satu baris */}
            {!query && (
                <p style={{ fontSize: 13, color: C.mute, margin: "0 0 14px", lineHeight: 1.5 }}>
                    <strong style={{ color: C.danger }}>{grouped.danger.length} perlu tindak</strong>
                    {" · "}
                    <strong style={{ color: C.warn }}>{grouped.warn.length} perhatian</strong>
                    {" · "}
                    <strong style={{ color: C.ok }}>{grouped.ok.length} aman</strong>
                </p>
            )}
            {query && (
                <p style={{ fontSize: 13, color: C.mute, margin: "0 0 14px" }}>
                    {totalShown} hasil untuk "{query}"
                </p>
            )}

            {totalShown === 0 && (
                <div style={{ textAlign: "center", padding: "30px 10px", color: C.soft, fontSize: 13.5 }}>
                    Tidak ada site yang cocok.
                </div>
            )}

            {/* Group: Perlu tindak */}
            <SiteGroup tone="danger" label="Perlu tindak" count={grouped.danger.length}
                open={openGroups.danger} onToggle={() => setOpenGroups((g) => ({ ...g, danger: !g.danger }))}>
                {grouped.danger.map((s) => (
                    <SiteCard key={s.id} site={s}
                        onPresence={() => onOpenPresence(s.id)} onPatrol={() => onOpenPatrol(s.id)} />
                ))}
            </SiteGroup>

            {/* Group: Perhatian */}
            <SiteGroup tone="warn" label="Perhatian" count={grouped.warn.length}
                open={openGroups.warn} onToggle={() => setOpenGroups((g) => ({ ...g, warn: !g.warn }))}>
                {grouped.warn.map((s) => (
                    <SiteCard key={s.id} site={s}
                        onPresence={() => onOpenPresence(s.id)} onPatrol={() => onOpenPatrol(s.id)} />
                ))}
            </SiteGroup>

            {/* Group: Aman */}
            <SiteGroup tone="ok" label="Aman" count={grouped.ok.length}
                open={openGroups.ok} onToggle={() => setOpenGroups((g) => ({ ...g, ok: !g.ok }))}>
                {grouped.ok.map((s) => (
                    <SiteCard key={s.id} site={s}
                        onPresence={() => onOpenPresence(s.id)} onPatrol={() => onOpenPatrol(s.id)} />
                ))}
            </SiteGroup>
        </div>
    );
}

function SiteGroup({ tone, label, count, open, onToggle, children }) {
    const color = { danger: C.danger, warn: C.warn, ok: C.ok }[tone];
    const bg = { danger: C.dangerBg, warn: C.warnBg, ok: C.okBg }[tone];
    if (count === 0) return null;
    return (
        <div style={{ marginBottom: 14 }}>
            <button onClick={onToggle}
                style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 13px", background: bg, border: `1px solid ${color}33`,
                    borderRadius: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 10
                }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color }}>{count}</span>
                <ChevronDown size={17} color={color}
                    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {open && <div>{children}</div>}
        </div>
    );
}

function SiteCard({ site, onPresence, onPatrol }) {
    const worse = ["danger", "warn", "ok"].find((t) =>
        site.presence.status === t || site.patrol.status === t
    );
    const stripColor = { danger: C.danger, warn: C.warn, ok: C.ok }[worse];

    return (
        <div style={{
            display: "flex", background: "#fff", borderRadius: 16, marginBottom: 13,
            border: `1.5px solid ${C.cardBd}`, overflow: "hidden",
            boxShadow: "0 1px 3px rgba(20,30,55,0.05)",
        }}>
            <div style={{ width: 6, background: stripColor, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* header site */}
                <div style={{ padding: "12px 14px 8px" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{site.name}</div>
                    <div style={{ fontSize: 11.5, color: C.soft, marginTop: 1 }}>{site.client}</div>
                </div>
                {/* dua panel */}
                <SiteSubPanel
                    icon={Users} label="Kehadiran"
                    headline={`${site.presence.present}/${site.presence.need} hadir`}
                    subtone={site.presence.status}
                    details={site.presence.issues.length === 0 ? "Semua beres" : site.presence.issues.join(" · ")}
                    onClick={onPresence}
                />
                <div style={{ height: 1, background: C.line, margin: "0 14px" }} />
                <SiteSubPanel
                    icon={ClipboardCheck} label="Patroli & Cleaning"
                    headline={`${site.patrol.totalPoints} titik`}
                    subtone={site.patrol.status}
                    details={
                        site.patrol.staleCount > 0
                            ? `${site.patrol.staleCount} titik jeda lama · terlama ${site.patrol.longestGapHours} jam`
                            : "Tidak ada jeda signifikan"
                    }
                    onClick={onPatrol}
                />
            </div>
        </div>
    );
}

function SiteSubPanel({ icon: Icon, label, headline, subtone, details, onClick }) {
    return (
        <button onClick={onClick} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", background: "none", border: "none", cursor: "pointer",
            fontFamily: "inherit", textAlign: "left",
        }}>
            <span style={{
                width: 36, height: 36, borderRadius: 10, background: C.chip,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <Icon size={18} color={C.ink} strokeWidth={2.1} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
                    {subtone === "danger" && <StatusPill tone="danger">Perlu tindak</StatusPill>}
                    {subtone === "warn" && <StatusPill tone="warn">Perhatian</StatusPill>}
                    {subtone === "ok" && <StatusPill tone="ok">Beres</StatusPill>}
                </div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, marginTop: 3 }}>{headline}</div>
                <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2, lineHeight: 1.4 }}>{details}</div>
            </div>
            <ChevronRight size={18} color="#C4C8D0" />
        </button>
    );
}

// ============================================================
//  LAYAR 2 — detail kehadiran sepanjang hari + koreksi clock
// ============================================================
function ScreenPresence({ siteId, onOpenPatrolThisSite, onOpenWorkerHistory }) {
    const [shifts, setShifts] = useState(SHIFTS);
    const [correcting, setCorrecting] = useState(null);

    function saveCorrection(data) {
        setShifts((prev) => prev.map((sh) => ({
            ...sh,
            rows: sh.rows.map((r) => {
                if (r.id !== data.id) return r;
                const u = { ...r };
                if (data.correctedOut) {
                    u.correctedOut = data.correctedOut;
                    u.assumption = !!data.assumption;
                    u.issue = null;
                    u.trail = `Clock-out ${data.correctedOut} ditetapkan supervisor · ${NOW_LABEL} hari ini${data.reason ? ` · "${data.reason}"` : ""}`;
                }
                if (data.absentReason) {
                    u.issue = null;
                    u.trail = `Ditandai "${data.absentReason}" oleh supervisor · ${NOW_LABEL} hari ini`;
                    if (data.correctedIn) u.in = data.correctedIn;
                }
                return u;
            }),
        })));
        setCorrecting(null);
    }

    return (
        <>
            <div style={{ marginBottom: 14, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, color: C.soft }}>Sekarang {NOW_LABEL} · seluruh hari</div>
                <button onClick={onOpenPatrolThisSite}
                    style={{ ...crossLinkBtn, color: C.blue, background: C.blueBg }}>
                    Lihat patroli site ini <ChevronRight size={14} />
                </button>
            </div>
            {shifts.map((sh) => (
                <ShiftBlock key={sh.id} shift={sh}
                    onCorrect={(row) => setCorrecting({ row, shift: sh })}
                    onOpenWorkerHistory={onOpenWorkerHistory} />
            ))}
            <TransparencyNote>
                Shift berlangsung tampil penuh; shift lewat ringkas tapi tetap bisa dibuka & dikoreksi.
                Jam yang ditetapkan supervisor selalu ditandai beda dari scan.
            </TransparencyNote>

            {correcting && (
                <CorrectionSheet row={correcting.row} shift={correcting.shift}
                    onClose={() => setCorrecting(null)} onSave={saveCorrection} />
            )}
        </>
    );
}
const crossLinkBtn = {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11.5, fontWeight: 700, padding: "5px 10px", borderRadius: 9,
    border: "none", cursor: "pointer", fontFamily: "inherit",
};

function ShiftBlock({ shift, onCorrect, onOpenWorkerHistory }) {
    const [open, setOpen] = useState(shift.phase === "live");
    const isLive = shift.phase === "live";
    const tag = shift.phase === "past" ? "Selesai" : shift.phase === "live" ? "Berlangsung" : "Belum mulai";
    const tagColor = isLive ? C.ok : "#9CA3AF";

    return (
        <div style={{
            border: isLive ? `2px solid ${C.ok}` : `1.5px solid ${C.cardBd}`,
            borderRadius: 16, marginBottom: 13, overflow: "hidden",
            background: isLive ? "#fff" : "#FCFCFD",
            boxShadow: isLive ? "0 3px 12px rgba(14,124,102,0.12)" : "none",
        }}>
            <button onClick={() => setOpen((o) => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "13px 15px",
                    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left"
                }}>
                {isLive && <CircleDot size={16} color={C.ok} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15.5, fontWeight: 700, color: isLive ? C.ink : C.mute }}>{shift.name}</span>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: tagColor }}>· {tag}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: C.soft, marginTop: 2 }}>
                        {shift.time} · hadir {shift.present}/{shift.need}
                    </div>
                </div>
                {shift.rows.some((r) => r.issue) && (
                    <StatusPill tone="danger">{shift.rows.filter((r) => r.issue).length} perlu tindak</StatusPill>
                )}
                <ChevronDown size={18} color="#C4C8D0"
                    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {open && (
                <div style={{ padding: "0 13px 13px" }}>
                    {shift.rows.length === 0 ? (
                        <div style={{ fontSize: 13, color: C.soft, padding: "8px 4px", textAlign: "center" }}>
                            Belum ada data — shift belum mulai.
                        </div>
                    ) : (
                        [...shift.rows]
                            .sort((a, b) => (b.issue ? 1 : 0) - (a.issue ? 1 : 0))   // bermasalah di atas
                            .map((row) => <WorkerRow key={row.id} row={row} onCorrect={onCorrect} onOpenWorkerHistory={onOpenWorkerHistory} />)
                    )}
                </div>
            )}
        </div>
    );
}

function WorkerRow({ row, onCorrect, onOpenWorkerHistory }) {
    const [open, setOpen] = useState(false);
    const needsAction = row.issue === "no_out" || row.issue === "no_in";
    const outDisplay = row.correctedOut || row.out || "—";
    // Pemetaan nama → workerId untuk Jalur B (dari konteks operasional ke riwayat)
    const workerId = WORKERS.find((w) => w.name === row.name)?.id;

    return (
        <div style={{
            border: `1.5px solid ${needsAction ? "#F0D9A8" : C.line}`,
            background: needsAction ? "#FFFCF5" : "#fff",
            borderRadius: 13, marginBottom: 9, overflow: "hidden",
        }}>
            <button onClick={() => setOpen((o) => !o)}
                style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "12px 13px",
                    background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left"
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{row.name}</span>
                        {row.evidence && <EvidenceBadge level={row.evidence} small />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, fontSize: 13, color: C.mute, flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <LogIn size={13} color={C.ok} /> {row.in || "—"}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <LogOut size={13} color={row.correctedOut ? C.superv : C.danger} /> {outDisplay}
                        </span>
                        {row.correctedOut && (row.assumption ? <AssumptionTag /> : <SetBySupervisorTag />)}
                    </div>
                </div>
                {row.issue === "no_out" && !row.correctedOut && <StatusPill tone="danger">Belum clock-out</StatusPill>}
                {row.issue === "no_in" && <StatusPill tone="warn">Belum scan</StatusPill>}
                <ChevronDown size={18} color="#C4C8D0"
                    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flexShrink: 0 }} />
            </button>
            {open && (
                <div style={{ padding: "0 13px 13px", borderTop: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", gap: 16, padding: "11px 0", fontSize: 12.5, color: C.soft }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Camera size={14} color={row.evidence === "strong" ? C.ok : "#C4C8D0"} /> Foto
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Satellite size={14} color={C.ok} /> GPS
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <MapPin size={14} color={C.ok} /> Dalam radius
                        </span>
                    </div>
                    {row.issue === "no_out" && (
                        <button onClick={() => onCorrect(row)} style={primaryBtn(C.superv)}>
                            <Pencil size={16} /> Tetapkan jam clock-out
                        </button>
                    )}
                    {row.issue === "no_in" && (
                        <button onClick={() => onCorrect(row)} style={primaryBtn(C.warn)}>
                            <Pencil size={16} /> Beri alasan / koreksi
                        </button>
                    )}
                    {!row.issue && (
                        <button onClick={() => onCorrect(row)}
                            style={{ ...primaryBtn(C.mute), background: "#fff", color: C.mute, border: "1.5px solid #D9DCE3" }}>
                            <Pencil size={16} /> Koreksi jam (opsional)
                        </button>
                    )}
                    {row.trail && (
                        <div style={{
                            marginTop: 10, fontSize: 11.5, color: C.superv, background: C.supervBg,
                            borderRadius: 9, padding: "8px 11px", display: "flex", gap: 7, lineHeight: 1.45,
                        }}>
                            <History size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>{row.trail}</span>
                        </div>
                    )}
                    {workerId && onOpenWorkerHistory && (
                        <button onClick={() => onOpenWorkerHistory(workerId)}
                            style={{
                                marginTop: 10, padding: "8px 12px", borderRadius: 9, border: "1.5px solid #D9DCE3",
                                background: "#fff", color: C.blue, fontSize: 12, fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 5
                            }}>
                            <History size={13} /> Lihat riwayat {row.name.split(" ")[0]}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
function primaryBtn(color) {
    return {
        width: "100%", marginTop: 4, padding: "11px", borderRadius: 11, border: "none",
        background: color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit",
    };
}

// ============================================================
//  PANEL KOREKSI (bottom sheet) — bagian 15
// ============================================================
function CorrectionSheet({ row, shift, onClose, onSave }) {
    const isNoOut = row.issue === "no_out";
    const isNoIn = row.issue === "no_in";
    const shiftEnd = shift.time.split("–")[1];
    const [mode, setMode] = useState("manual");
    const [time, setTime] = useState("");
    const [reason, setReason] = useState("");
    const [absentReason, setAbsentReason] = useState("");
    const headTitle = isNoOut ? "Tetapkan jam clock-out" : isNoIn ? "Worker belum scan" : "Koreksi jam";

    return (
        <div style={{ position: "absolute", inset: 0, zIndex: 30, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,25,40,0.45)" }} />
            <div style={{
                position: "relative", background: "#fff", borderRadius: "24px 24px 0 0",
                padding: "20px 18px 22px", maxHeight: "85%", overflowY: "auto",
                boxShadow: "0 -10px 40px rgba(0,0,0,0.2)"
            }}>
                <div style={{ width: 40, height: 4, background: "#E0E3EA", borderRadius: 4, margin: "0 auto 18px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>{headTitle}</h3>
                    <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.soft, display: "flex" }}>
                        <X size={22} />
                    </button>
                </div>
                <p style={{ fontSize: 13.5, color: C.mute, margin: "0 0 18px" }}>
                    {row.name} · {shift.name} ({shift.time})
                </p>
                <div style={{ background: "#F6F7F9", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                        Fakta terkunci (dari scan)
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: 14 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.ink, fontWeight: 600 }}>
                            <LogIn size={15} color={C.ok} /> Masuk {row.in || "tidak scan"}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.danger, fontWeight: 600 }}>
                            <LogOut size={15} /> Keluar {row.out || "hilang"}
                        </span>
                    </div>
                </div>

                {isNoOut && (
                    <>
                        <p style={{ fontSize: 12.5, color: C.superv, background: C.supervBg, borderRadius: 10, padding: "10px 12px", margin: "0 0 18px", lineHeight: 1.5 }}>
                            Jam keluar tidak terbukti scan. Yang Anda tetapkan akan ditandai
                            <strong> "ditetapkan supervisor"</strong> — bukan bukti scan, dan tampil beda ke klien.
                        </p>
                        {ALLOW_SHIFT_ASSUMPTION && (
                            <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
                                {[["manual", "Tetapkan manual", "Jam dari pengetahuan Anda"],
                                ["assumption", `Pakai jam shift (${shiftEnd})`, "Ditandai 'asumsi'"]].map(([v, lbl, desc]) => (
                                    <button key={v} onClick={() => { setMode(v); if (v === "assumption") setTime(shiftEnd); }}
                                        style={{
                                            flex: 1, padding: "12px 11px", borderRadius: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                                            border: mode === v ? `1.5px solid ${C.superv}` : "1.5px solid #D9DCE3",
                                            background: mode === v ? C.supervBg : "#fff"
                                        }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: mode === v ? C.superv : "#374151" }}>{lbl}</div>
                                        <div style={{ fontSize: 11, color: C.soft, marginTop: 3, lineHeight: 1.35 }}>{desc}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <label style={lblStyle}>Jam clock-out</label>
                        <input type="time" value={time} disabled={mode === "assumption"}
                            onChange={(e) => setTime(e.target.value)}
                            style={{ ...inpStyle, background: mode === "assumption" ? "#F6F7F9" : "#fff", marginBottom: 6 }} />
                        {mode === "assumption" && <div style={{ marginBottom: 14 }}><AssumptionTag /></div>}
                        {mode === "manual" && <div style={{ height: 8 }} />}
                        <label style={lblStyle}>Keterangan (untuk jejak)</label>
                        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                            placeholder="Mis. dikonfirmasi via telepon, lupa scan keluar…"
                            style={{ ...inpStyle, resize: "vertical", marginBottom: 18 }} />
                        <button disabled={!time}
                            onClick={() => onSave({ id: row.id, correctedOut: time, assumption: mode === "assumption", reason })}
                            style={{ ...primaryBtn(C.superv), background: time ? C.superv : "#C9A6E0", cursor: time ? "pointer" : "not-allowed" }}>
                            <Check size={17} /> Simpan & catat jejak
                        </button>
                    </>
                )}

                {isNoIn && (
                    <>
                        <p style={{ fontSize: 12.5, color: "#8A6D2F", background: C.warnBg, borderRadius: 10, padding: "10px 12px", margin: "0 0 18px", lineHeight: 1.5 }}>
                            Worker tidak scan masuk. Beri alasan ketidakhadiran, atau tetapkan clock-in bila hadir tapi lupa scan.
                        </p>
                        <label style={lblStyle}>Alasan</label>
                        <select value={absentReason} onChange={(e) => setAbsentReason(e.target.value)} style={{ ...inpStyle, marginBottom: 14 }}>
                            <option value="">Pilih…</option>
                            <option>Sakit</option><option>Izin</option><option>Off</option>
                            <option>Hadir tapi lupa scan masuk</option><option>Bolos</option>
                        </select>
                        {absentReason === "Hadir tapi lupa scan masuk" && (
                            <>
                                <label style={lblStyle}>Jam masuk (ditetapkan)</label>
                                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inpStyle, marginBottom: 6 }} />
                                <div style={{ marginBottom: 14 }}><SetBySupervisorTag /></div>
                            </>
                        )}
                        <label style={lblStyle}>Keterangan</label>
                        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                            style={{ ...inpStyle, resize: "vertical", marginBottom: 18 }} />
                        <button disabled={!absentReason}
                            onClick={() => onSave({ id: row.id, absentReason, correctedIn: time, reason })}
                            style={{ ...primaryBtn(C.warn), background: absentReason ? C.warn : "#E3C77A", cursor: absentReason ? "pointer" : "not-allowed" }}>
                            <Check size={17} /> Simpan & catat jejak
                        </button>
                    </>
                )}

                {!row.issue && (
                    <>
                        <label style={lblStyle}>Jam clock-out (koreksi)</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inpStyle, marginBottom: 6 }} />
                        <div style={{ marginBottom: 14 }}><SetBySupervisorTag /></div>
                        <label style={lblStyle}>Keterangan</label>
                        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                            style={{ ...inpStyle, resize: "vertical", marginBottom: 18 }} />
                        <button disabled={!time} onClick={() => onSave({ id: row.id, correctedOut: time, reason })}
                            style={{ ...primaryBtn(C.superv), background: time ? C.superv : "#C9A6E0", cursor: time ? "pointer" : "not-allowed" }}>
                            <Check size={17} /> Simpan & catat jejak
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
const lblStyle = { display: "block", fontSize: 12.5, fontWeight: 700, color: "#41506E", marginBottom: 7 };
const inpStyle = {
    width: "100%", boxSizing: "border-box", padding: "12px 13px", fontSize: 15,
    border: "1.5px solid #D9DCE3", borderRadius: 11, outline: "none", fontFamily: "inherit", color: C.ink,
};

// ============================================================
//  LAYAR 3 — ringkasan patroli per titik (bagian 16)
// ============================================================
const PERIODS = [
    { id: "today", label: "Hari ini" },
    { id: "24h", label: "24 jam" },
    { id: "week", label: "Minggu ini" },
];
function ScreenPatrol({ siteId, onOpenPoint }) {
    const [period, setPeriod] = useState("24h");
    const points = POINTS_BY_SITE[siteId] || POINTS_BY_SITE["bp-legok"]; // demo fallback

    // ringkasan (bagian 16: tiga angka di atas)
    const totalVisits = points.reduce((a, p) => a + p.visits24h, 0);
    const withoutVisit = points.filter((p) => p.visits24h === 0).length;
    const typedLocation = 0; // contoh; di produk hitung dari data kunjungan

    // urut: paling lama tidak disentuh DI ATAS (bagian 16 — BUKAN belum/sudah)
    const sorted = [...points].sort((a, b) => b.lastHoursAgo - a.lastHoursAgo);

    return (
        <>
            {/* pemilih periode */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.chip, borderRadius: 12, padding: 4 }}>
                {PERIODS.map((p) => (
                    <button key={p.id} onClick={() => setPeriod(p.id)}
                        style={{
                            flex: 1, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                            background: period === p.id ? "#fff" : "transparent",
                            color: period === p.id ? C.ink : C.mute,
                            boxShadow: period === p.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                        }}>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* tiga angka ringkasan */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                <SummaryNum value={totalVisits} label="Total kunjungan" />
                <SummaryNum value={withoutVisit} label="Titik tanpa kunjungan" tone={withoutVisit > 0 ? "warn" : "ok"} />
                <SummaryNum value={typedLocation} label="Lokasi diketik" tone={typedLocation > 0 ? "warn" : "ok"} />
            </div>

            {/* daftar titik */}
            {sorted.map((p) => (
                <PointRow key={p.id} point={p} onClick={() => onOpenPoint(p.id)} />
            ))}

            <TransparencyNote icon={Info}>
                Sistem menyajikan fakta. Cukup atau tidaknya dinilai dari perjanjian. Tidak ada klaim "belum dipatroli" atau "cukup/kurang".
            </TransparencyNote>
        </>
    );
}
function SummaryNum({ value, label, tone = "neutral" }) {
    const color = tone === "warn" ? C.warn : tone === "ok" ? C.ok : C.ink;
    const bg = tone === "warn" ? C.warnBg : tone === "ok" ? C.okBg : "#fff";
    return (
        <div style={{ background: bg, border: `1.5px solid ${C.cardBd}`, borderRadius: 12, padding: "10px 11px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 10.5, color: C.mute, marginTop: 3, lineHeight: 1.3 }}>{label}</div>
        </div>
    );
}
function PointRow({ point, onClick }) {
    const stale = point.lastHoursAgo >= STALE_HOURS;
    return (
        <button onClick={onClick}
            style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 13px", background: "#fff",
                border: `1.5px solid ${stale ? "#F0D9A8" : C.cardBd}`,
                borderLeft: stale ? `5px solid ${C.warn}` : `1.5px solid ${C.cardBd}`,
                borderRadius: 13, marginBottom: 9, cursor: "pointer", fontFamily: "inherit", textAlign: "left"
            }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{point.name}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        · {point.type}
                    </span>
                </div>
                <div style={{ fontSize: 12.5, color: stale ? C.warn : C.mute, marginTop: 3, fontWeight: stale ? 600 : 400 }}>
                    Terakhir {FormatHoursAgo(point.lastHoursAgo)} · {point.lastBy}
                </div>
                <div style={{ fontSize: 11.5, color: C.soft, marginTop: 2 }}>
                    {point.visits24h} kunjungan dalam 24 jam
                </div>
            </div>
            <EvidenceBadge level={point.evidence} small />
            <ChevronRight size={18} color="#C4C8D0" />
        </button>
    );
}

// ============================================================
//  LAYAR 4 — timeline per titik (bagian 16)
// ============================================================
const RANGES = [
    { id: "24h", label: "24 jam" },
    { id: "7d", label: "7 hari" },
    { id: "30d", label: "30 hari" },
];
function ScreenTimeline({ pointId }) {
    const [range, setRange] = useState("7d");
    const point = Object.values(POINTS_BY_SITE).flat().find((p) => p.id === pointId)
        || { name: "Gudang Bahan", type: "patroli" };
    const visits = VISITS[pointId] || VISITS["p2"];

    // Hitung jeda antar kunjungan utk ditampilkan eksplisit bila signifikan.
    // Tanpa jam absolut, kita pakai pseudo-gap dari urutan (demo).
    const withGaps = useMemo(() => {
        const out = [];
        const gapHours = [0, 23, 5, 30]; // demo: jeda antar item (item[0] tak ada jeda di atas)
        visits.forEach((v, i) => {
            if (i > 0 && gapHours[i] >= STALE_HOURS) {
                out.push({ kind: "gap", id: "g" + i, hours: gapHours[i] });
            }
            out.push({ kind: "visit", ...v });
        });
        return out;
    }, [visits]);

    return (
        <>
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>{point.name}</div>
                <div style={{ fontSize: 12.5, color: C.soft, marginTop: 2, textTransform: "capitalize" }}>
                    {point.type} · {visits.length} kunjungan periode ini
                </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 16, background: C.chip, borderRadius: 12, padding: 4 }}>
                {RANGES.map((r) => (
                    <button key={r.id} onClick={() => setRange(r.id)}
                        style={{
                            flex: 1, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                            background: range === r.id ? "#fff" : "transparent",
                            color: range === r.id ? C.ink : C.mute,
                            boxShadow: range === r.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                        }}>
                        {r.label}
                    </button>
                ))}
            </div>

            {/* timeline */}
            <div style={{ position: "relative", paddingLeft: 22, marginBottom: 16 }}>
                {/* garis vertikal */}
                <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: "#E6E8EE" }} />
                {withGaps.map((item) => {
                    if (item.kind === "gap") {
                        return (
                            <div key={item.id} style={{ position: "relative", margin: "6px 0 6px -22px", paddingLeft: 22 }}>
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    fontSize: 11.5, fontWeight: 700, color: C.warn, background: C.warnBg,
                                    padding: "5px 11px", borderRadius: 20, border: `1px dashed ${C.warn}`
                                }}>
                                    <Hourglass size={12} /> Jeda {item.hours} jam
                                </div>
                            </div>
                        );
                    }
                    const dotColor = item.evidence === "strong" ? C.ok : C.warn;
                    return (
                        <div key={item.id} style={{ position: "relative", marginBottom: 14 }}>
                            <div style={{
                                position: "absolute", left: -22, top: 6,
                                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                border: `3px solid ${dotColor}`, boxSizing: "border-box"
                            }} />
                            <div style={{ background: "#fff", border: `1.5px solid ${C.cardBd}`, borderRadius: 12, padding: "11px 13px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{item.when}</span>
                                    <EvidenceBadge level={item.evidence} small />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, fontSize: 12.5, color: C.mute, flexWrap: "wrap" }}>
                                    <span>oleh {item.by}</span>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        {item.method === "qr" ? <QrCode size={12} /> : <Type size={12} />}
                                        {item.method === "qr" ? "Scan QR + foto" : "Lokasi diketik + foto"}
                                    </span>
                                </div>
                                {item.note && (
                                    <div style={{ fontSize: 12.5, color: C.mute, marginTop: 6, fontStyle: "italic" }}>"{item.note}"</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <TransparencyNote icon={Lock}>
                Catatan tak bisa diubah. Setiap kunjungan terkunci sejak dibuat. Sistem tidak menyajikan
                "rata-rata" atau "frekuensi normal" — itu bisa dibaca sebagai standar.
            </TransparencyNote>
        </>
    );
}

// ============================================================
//  DATA DUMMY untuk approval (bagian 10–11)
// ============================================================
const REQ_TYPES = {
    cuti: { label: "Cuti", icon: Palmtree, color: C.ok, tint: C.okBg },
    sakit: { label: "Sakit", icon: Stethoscope, color: C.danger, tint: C.dangerBg },
    izin: { label: "Izin", icon: Clock3, color: C.warn, tint: C.warnBg },
    lembur: { label: "Lembur", icon: Timer, color: C.blue, tint: C.blueBg },
    off: { label: "Off/Libur", icon: CalendarOff, color: C.superv, tint: C.supervBg },
    tukar: { label: "Tukar Shift", icon: Repeat, color: "#0F766E", tint: "#DEF2EF" },
};
const VENDOR_RULES = {
    cuti: ["Supervisor Site", "Admin HR"], sakit: ["Supervisor Site"],
    izin: ["Supervisor Site"], lembur: ["Supervisor Site", "Admin HR"],
    off: ["Supervisor Site"], tukar: ["Supervisor Site"],
};
const INITIAL_REQUESTS = [
    { id: 1, applicant: "Budi Santoso", typeId: "cuti", summary: "12–14 Jun · Acara keluarga", currentLevel: 0 },
    { id: 2, applicant: "Sari Wulandari", typeId: "sakit", summary: "10 Jun · Demam (surat dokter)", currentLevel: 0 },
    { id: 3, applicant: "Dewi Lestari", typeId: "izin", summary: "11 Jun · Setengah hari", currentLevel: 0 },
    { id: 4, applicant: "Rian Hidayat", typeId: "tukar", summary: "13 Jun · Tukar timbal balik dengan Agus", currentLevel: 0, mate: "Agus Pratama", mateConfirmed: true },
];

// ============================================================
//  INCIDENT — DATA & KONFIGURASI (bagian 22)
//  Keparahan & kategori dirancang sebagai DAFTAR config-able
//  (bukan enum hardcoded), sejajar daftar level approval (bagian 11)
//  dan kamus label per vendor (bagian 9). Sekarang cuma warna+urutan;
//  nanti tiap level bisa digantungi trigger (notifikasi, dll).
// ============================================================
const SEVERITY_LEVELS = [
    { id: "critical", label: "Kritis", rank: 3, color: C.danger, bg: C.dangerBg },
    { id: "medium", label: "Sedang", rank: 2, color: C.warn, bg: C.warnBg },
    { id: "low", label: "Ringan", rank: 1, color: C.ok, bg: C.okBg },
];
const sevById = (id) => SEVERITY_LEVELS.find((s) => s.id === id);

const INCIDENT_CATEGORIES = [
    { id: "security", label: "Keamanan", icon: Siren },
    { id: "damage", label: "Kerusakan fasilitas", icon: Wrench },
    { id: "hygiene", label: "Kebersihan", icon: Sparkles },
    { id: "accident", label: "Kecelakaan", icon: HeartPulse },
    { id: "other", label: "Lainnya", icon: HelpCircle },
];
const catById = (id) => INCIDENT_CATEGORIES.find((c) => c.id === id);

// Lifecycle: dilaporkan → ditangani (rantai operan) → selesai-vendor → jendela klien → tertutup
// Penanda cara-tutup di state 'closed' dibedakan via closureKind, BUKAN state berbeda.
//   closureKind 'vendor_resolved' = vendor benar2 menyelesaikan
//   closureKind 'escalated_external' = dioper ke maintenance/pihak lain, vendor selesai dari mejanya
// Setelah selesai-vendor masuk jendela klien (windowDaysLeft); auto-close jujur sesuai apa yg terjadi.
//   autoCloseLabel: null | 'client_silent' | 'client_confirmed'
const VENDOR_AUTO_CLOSE_DAYS = 7;   // konfigurasi vendor (default 7)

const INITIAL_INCIDENTS = [
    {
        id: 1, reportedBy: "Sari Wulandari", site: "BP Legok", category: "security",
        severity: "critical", reportedAt: "Hari ini 10:45",
        summary: "Orang tidak dikenal masuk lewat pintu samping",
        state: "in_progress",
        chain: [
            { from: "Sari Wulandari", to: "Supervisor Site", at: "10:45", note: "Lapor + foto" },
            { from: "Supervisor Site", to: "Diri sendiri", at: "10:50", note: "Diperiksa, sedang dicari CCTV" },
        ],
    },
    {
        id: 2, reportedBy: "Agus Pratama", site: "BP Legok", category: "damage",
        severity: "medium", reportedAt: "Hari ini 09:12",
        summary: "Lampu lobby utama mati 2 titik",
        state: "in_progress",
        chain: [
            { from: "Agus Pratama", to: "Supervisor Site", at: "09:12", note: "Lapor + foto" },
        ],
    },
    {
        id: 3, reportedBy: "Dewi Lestari", site: "Bintaro Xchange", category: "hygiene",
        severity: "low", reportedAt: "Kemarin 14:20",
        summary: "Tumpahan minuman besar di lobby",
        state: "vendor_closed",
        closureKind: "vendor_resolved",
        closedAt: "Kemarin 14:55", closedBy: "Dewi Lestari",
        windowDaysLeft: 6,
        chain: [
            { from: "Dewi Lestari", to: "Supervisor Site", at: "Kemarin 14:20", note: "Lapor" },
            { from: "Supervisor Site", to: "Dewi Lestari", at: "Kemarin 14:25", note: "Tangani langsung" },
        ],
    },
    {
        id: 4, reportedBy: "Rian Hidayat", site: "GoTo Tangerang", category: "damage",
        severity: "medium", reportedAt: "2 hari lalu",
        summary: "AC ruang server mati",
        state: "in_progress",
        clientCommentPending: true,  // klien komentar balik setelah vendor menutup
        chain: [
            { from: "Rian Hidayat", to: "Supervisor Site", at: "2 hari lalu 14:00", note: "Lapor + foto" },
            { from: "Supervisor Site", to: "Maintenance gedung (WA)", at: "2 hari lalu 16:30", note: "Eskalasi" },
            {
                from: "Pak Hendro (PIC GoTo)", to: "Supervisor Site", at: "Hari ini 08:30",
                note: "Komentar/keberatan: \"AC masih mati pagi ini, server panas\" · foto terlampir"
            },
        ],
    },
    {
        id: 5, reportedBy: "Budi Santoso", site: "BP BSD", category: "hygiene",
        severity: "low", reportedAt: "1 minggu lalu",
        summary: "Toilet lantai 2 mampet",
        state: "closed",
        closureKind: "vendor_resolved",
        autoCloseLabel: "client_silent",
        closedAt: "6 hari lalu", windowDaysLeft: 0,
        chain: [
            { from: "Budi Santoso", to: "Supervisor Site", at: "1 minggu lalu", note: "Lapor" },
            { from: "Supervisor Site", to: "Budi Santoso", at: "1 minggu lalu", note: "Tangani" },
        ],
    },
];

// ============================================================
//  COMPLAINT — KONFIGURASI & DATA (bagian 23, sisi supervisor)
//  Cermin lifecycle incident, tapi DIANGKAT KLIEN (bukan worker).
//  Kategori dibagi per DIVISI VENDOR (cermin sisi klien) — tiap
//  complaint menyimpan `routedTo` (tujuan routing) supaya nanti
//  saat model role matang, list bisa difilter per divisi.
//  Untuk sekarang: supervisor generik melihat semua, tapi badge
//  divisi tujuan tampil jelas di tiap kartu.
//
//  inputSource: 'client_direct' (klien lapor via app)
//             | 'supervisor_recorded' (supervisor catat dari telepon)
// ============================================================
const COMPLAINT_CATEGORIES = [
    { id: "security", label: "Keamanan", icon: Shield, routedTo: "Supervisor Keamanan" },
    { id: "cleaning", label: "Cleaning", icon: Sparkles, routedTo: "Supervisor Cleaning" },
    { id: "maintenance", label: "Maintenance", icon: Wrench, routedTo: "Supervisor Maintenance" },
    { id: "management", label: "Manajemen", icon: Briefcase, routedTo: "Manajemen Jab" },
    { id: "other", label: "Lainnya", icon: HelpCircle, routedTo: "Manajemen Jab" },
];
const complaintCatById = (id) => COMPLAINT_CATEGORIES.find((c) => c.id === id);

const INITIAL_COMPLAINTS = [
    {
        id: "cmp-1", site: "BP Legok", category: "security", severity: "medium",
        routedTo: "Supervisor Keamanan", inputSource: "client_direct",
        raisedBy: "Pak Hendro (PIC BP)", raisedAt: "Hari ini 09:30",
        summary: "Security shift malam kemarin tidur di pos jaga",
        state: "in_progress",
        clientCommentPending: false,
        chain: [
            { from: "Pak Hendro (PIC BP)", to: "Supervisor Keamanan", at: "09:30", note: "Komplain + foto bukti" },
        ],
    },
    {
        id: "cmp-2", site: "BP BSD", category: "cleaning", severity: "low",
        routedTo: "Supervisor Cleaning", inputSource: "client_direct",
        raisedBy: "Pak Hendro (PIC BP)", raisedAt: "Kemarin 14:00",
        summary: "Area lobby tidak dibersihkan rutin pagi ini",
        state: "in_progress",
        clientCommentPending: true,   // klien sudah komentar balik, MENUNGGU respons
        chain: [
            { from: "Pak Hendro (PIC BP)", to: "Supervisor Cleaning", at: "Kemarin 14:00", note: "Komplain" },
            { from: "Supervisor Cleaning", to: "Dewi Lestari", at: "Kemarin 15:00", note: "Tolong cek & koreksi" },
            { from: "Dewi Lestari", to: "Selesai", at: "Kemarin 16:00", note: "Sudah dibersihkan ulang" },
            {
                from: "Pak Hendro (PIC BP)", to: "Supervisor Cleaning", at: "Hari ini 08:00",
                note: "Komentar/keberatan: \"Pagi ini masih sama, belum konsisten\" · foto terlampir"
            },
        ],
    },
    {
        id: "cmp-3", site: "BP Gading Serpong", category: "management", severity: "medium",
        routedTo: "Manajemen Jab", inputSource: "supervisor_recorded",
        raisedBy: "Pak Hendro (PIC BP)", raisedAt: "3 hari lalu",
        recordedNote: "Dicatat supervisor atas keluhan klien via telepon, 3 hari lalu jam 10:15",
        summary: "Laporan bulanan Mei belum diterima via email",
        state: "vendor_closed", closureKind: "vendor_resolved",
        closedAt: "2 hari lalu", windowDaysLeft: 5,
        clientCommentPending: false,
        chain: [
            { from: "Manajemen Jab", to: "Catatan", at: "3 hari lalu", note: "Dicatat dari telepon klien" },
            { from: "Manajemen Jab", to: "Selesai", at: "2 hari lalu", note: "Laporan dikirim ulang ke email klien" },
        ],
    },
    {
        id: "cmp-4", site: "BP Legok", category: "security", severity: "low",
        routedTo: "Supervisor Keamanan", inputSource: "client_direct",
        raisedBy: "Pak Hendro (PIC BP)", raisedAt: "1 minggu lalu",
        summary: "Patroli malam minggu kemarin terlewat 1 titik",
        state: "closed", closureKind: "vendor_resolved",
        autoCloseLabel: "client_confirmed", closedAt: "5 hari lalu",
        clientCommentPending: false,
        chain: [
            { from: "Pak Hendro (PIC BP)", to: "Supervisor Keamanan", at: "1 minggu lalu", note: "Komplain" },
            { from: "Supervisor Keamanan", to: "Selesai", at: "6 hari lalu", note: "Briefing ulang tim shift malam" },
        ],
    },
];


// ============================================================
//  DATA DUMMY untuk worker history (dimensi per-orang)
// ============================================================
const WORKERS = [
    {
        id: "w-budi", name: "Budi Santoso", primarySite: "BP Legok", role: "Security",
        anomalyCount: 3, presentDays: 22, totalDays: 26, status: "warn"
    },
    {
        id: "w-sari", name: "Sari Wulandari", primarySite: "BP Legok", role: "Security",
        anomalyCount: 0, presentDays: 24, totalDays: 26, status: "ok"
    },
    {
        id: "w-dewi", name: "Dewi Lestari", primarySite: "Bintaro Xchange", role: "Cleaning",
        anomalyCount: 1, presentDays: 23, totalDays: 26, status: "ok"
    },
    {
        id: "w-agus", name: "Agus Pratama", primarySite: "BP Legok", role: "Security",
        anomalyCount: 5, presentDays: 20, totalDays: 26, status: "danger"
    },
    {
        id: "w-rian", name: "Rian Hidayat", primarySite: "GoTo Tangerang", role: "Security",
        anomalyCount: 0, presentDays: 25, totalDays: 26, status: "ok"
    },
    {
        id: "w-maya", name: "Maya Putri", primarySite: "BP BSD", role: "Cleaning",
        anomalyCount: 1, presentDays: 24, totalDays: 26, status: "ok"
    },
    {
        id: "w-joko", name: "Joko Anwar", primarySite: "Mall Surabaya", role: "Security",
        anomalyCount: 2, presentDays: 23, totalDays: 26, status: "warn"
    },
    {
        id: "w-citra", name: "Citra Dewi", primarySite: "BP Legok", role: "Cleaning",
        anomalyCount: 0, presentDays: 26, totalDays: 26, status: "ok"
    },
];

// Histori 14 hari terakhir untuk satu worker contoh (Budi). Untuk worker lain
// di produk: data datang dari backend; di sini kita pakai pola yang sama.
const WORKER_HISTORY = {
    "w-budi": [
        { date: "10 Jun (Sen)", site: "BP Legok", shift: "Pagi 06–14", in: "05:58", out: null, status: "anomaly", anomaly: "lupa_out", correctedOut: null, evidence: "strong" },
        { date: "9 Jun (Min)", site: null, shift: null, in: null, out: null, status: "off", evidence: null },
        { date: "8 Jun (Sab)", site: "BP BSD", shift: "Pagi 06–14", in: "05:55", out: "14:02", status: "present", evidence: "strong" },
        { date: "7 Jun (Jum)", site: "BP Legok", shift: "Pagi 06–14", in: "06:01", out: "14:00", status: "present", evidence: "strong" },
        { date: "6 Jun (Kam)", site: "BP Legok", shift: "Pagi 06–14", in: "06:00", out: "14:03", status: "present", evidence: "weak" },
        { date: "5 Jun (Rab)", site: "BP Legok", shift: "Pagi 06–14", in: "05:58", out: "14:30", status: "corrected", correctedOut: "14:30", evidence: "strong", note: "lupa scan, dikonfirmasi via telp" },
        { date: "4 Jun (Sel)", site: "BP Legok", shift: null, in: null, out: null, status: "leave", leaveType: "Sakit" },
        { date: "3 Jun (Sen)", site: "BP Legok", shift: null, in: null, out: null, status: "leave", leaveType: "Sakit" },
        { date: "2 Jun (Min)", site: null, shift: null, in: null, out: null, status: "off", evidence: null },
        { date: "1 Jun (Sab)", site: "BP Legok", shift: "Pagi 06–14", in: "06:00", out: "14:01", status: "present", evidence: "strong" },
        { date: "31 Mei (Jum)", site: "BP Legok", shift: "Pagi 06–14", in: "06:02", out: null, status: "anomaly", anomaly: "lupa_out", correctedOut: "14:00", correctedAssumption: true, evidence: "strong" },
        { date: "30 Mei (Kam)", site: "BP Legok", shift: "Pagi 06–14", in: "06:00", out: "13:58", status: "present", evidence: "strong" },
    ],
};

// Aktivitas detail untuk satu hari (Layar timeline per-hari).
// Demo: 10 Jun untuk Budi — hari dengan anomali lupa clock-out.
const WORKER_DAY = {
    "w-budi__10 Jun (Sen)": {
        site: "BP Legok", shift: "Pagi 06:00–14:00",
        events: [
            { time: "05:58", kind: "clock_in", by: "scan", evidence: "strong", note: "Scan QR + foto + GPS dalam radius" },
            { time: "08:14", kind: "patrol", location: "Pos Utama", evidence: "strong", note: "Scan QR + foto" },
            { time: "10:42", kind: "patrol", location: "Loading Dock", evidence: "strong", note: "Scan QR + foto" },
            { time: "12:01", kind: "patrol", location: "Genset", evidence: "weak", note: "Lokasi diketik + foto" },
            { time: "14:00", kind: "clock_out_missing", note: "Tidak ada scan keluar. Anomali terdeteksi sistem." },
        ],
    },
};

// ============================================================
function ScreenHome({ approvals, incidents, complaints, onGo }) {
    // Hitung ringkasan dari data nyata di app
    const pendingApprovals = approvals.filter((r) => {
        if (r.typeId === "tukar" && r.mateConfirmed === false) return false; // belum bisa diputus
        return true;
    }).length;
    const pendingMateConfirm = approvals.filter((r) => r.typeId === "tukar" && r.mateConfirmed === false).length;

    const sitesNeedAction = SITES.filter((s) => s.presence.status === "danger").length;
    const sitesAttention = SITES.filter((s) => s.presence.status === "warn").length;
    const presenceIssues = SITES.reduce((a, s) => a + s.presence.issues.length, 0);

    const patrolStale = SITES.reduce((a, s) => a + s.patrol.staleCount, 0);
    const longestGap = Math.max(...SITES.map((s) => s.patrol.longestGapHours));
    const workersWithAnomaly = WORKERS.filter((w) => w.anomalyCount > 0).length;

    // Incident agregat — pisahkan yang masih perlu perhatian vendor vs yang
    // sudah lepas (di jendela klien atau closed). Itu dua kategori berbeda
    // di mata supervisor.
    const incidentsInProgress = incidents.filter((i) => i.state === "in_progress").length;
    const incidentsCritical = incidents.filter((i) =>
        i.state === "in_progress" && i.severity === "critical").length;
    const incidentsClientWindow = incidents.filter((i) => i.state === "vendor_closed").length;

    // Complaint agregat — komentar klien pending paling mendesak
    const complaintsPendingComment = complaints.filter((c) => c.clientCommentPending).length;
    const complaintsInProgress = complaints.filter((c) => c.state === "in_progress").length;
    const complaintsClientWindow = complaints.filter((c) => c.state === "vendor_closed").length;

    // Greeting sederhana — tidak menebak nama, cukup tunjukkan konteks
    return (
        <div>
            <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Selamat siang, Supervisor
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: "4px 0 0" }}>
                    Yang menunggu Anda
                </h2>
            </div>

            {/* Kartu Approval */}
            <HomeCard
                icon={Inbox}
                tone={pendingApprovals > 0 ? "danger" : "ok"}
                label="Approval Request"
                headline={pendingApprovals > 0 ? `${pendingApprovals} menunggu keputusan` : "Tidak ada yang menunggu"}
                details={
                    pendingApprovals > 0
                        ? `Cuti, sakit, lembur dari worker${pendingMateConfirm > 0 ? ` · ${pendingMateConfirm} tukar shift menunggu konfirmasi rekan` : ""}`
                        : "Semua sudah diputuskan"
                }
                onClick={() => onGo("approvals")}
            />

            {/* Kartu Incident — sejajar dengan modul utama lain */}
            <HomeCard
                icon={AlertOctagon}
                tone={incidentsCritical > 0 ? "danger" : incidentsInProgress > 0 ? "warn" : "ok"}
                label="Incident"
                headline={
                    incidentsCritical > 0
                        ? `${incidentsCritical} kritis menunggu tindak`
                        : incidentsInProgress > 0
                            ? `${incidentsInProgress} sedang ditangani`
                            : "Tidak ada incident aktif"
                }
                details={
                    incidentsClientWindow > 0
                        ? `${incidentsInProgress} aktif · ${incidentsClientWindow} di jendela klien`
                        : incidentsInProgress > 0
                            ? `${incidentsInProgress} aktif di vendor`
                            : "Klien tidak melihat masalah baru"
                }
                onClick={() => onGo("incidents")}
            />

            {/* Kartu Complaint — komplain dari klien */}
            <HomeCard
                icon={MessageCircle}
                tone={complaintsPendingComment > 0 ? "danger" : complaintsInProgress > 0 ? "warn" : "ok"}
                label="Komplain Klien"
                headline={
                    complaintsPendingComment > 0
                        ? `${complaintsPendingComment} komentar klien perlu respons`
                        : complaintsInProgress > 0
                            ? `${complaintsInProgress} sedang ditangani`
                            : "Tidak ada komplain aktif"
                }
                details={
                    complaintsPendingComment > 0
                        ? "Klien mengembalikan komplain — bola di Anda"
                        : complaintsClientWindow > 0
                            ? `${complaintsInProgress} aktif · ${complaintsClientWindow} di jendela klien`
                            : complaintsInProgress > 0
                                ? `${complaintsInProgress} aktif di vendor`
                                : "Tidak ada keberatan klien baru"
                }
                onClick={() => onGo("complaints")}
            />

            <HomeCard
                icon={Users}
                tone={sitesNeedAction > 0 ? "danger" : sitesAttention > 0 ? "warn" : "ok"}
                label="Kehadiran Tim"
                headline={
                    sitesNeedAction > 0 ? `${sitesNeedAction} site perlu tindak`
                        : sitesAttention > 0 ? `${sitesAttention} site perhatian`
                            : "Semua site beres"
                }
                details={
                    presenceIssues > 0
                        ? `${presenceIssues} hal perlu dibereskan: belum scan, lupa clock-out, bukti lemah`
                        : `${SITES.length} site dalam cakupan Anda`
                }
                onClick={() => onGo("sites")}
            />

            {/* Kartu Patroli & Cleaning */}
            <HomeCard
                icon={ClipboardCheck}
                tone={patrolStale > 0 ? "warn" : "ok"}
                label="Patroli & Cleaning"
                headline={
                    patrolStale > 0
                        ? `${patrolStale} titik jeda lama`
                        : "Tidak ada jeda signifikan"
                }
                details={
                    patrolStale > 0
                        ? `Terlama ${longestGap} jam tidak disentuh · cek per site`
                        : `Semua titik disentuh dalam ${STALE_HOURS} jam terakhir`
                }
                onClick={() => onGo("sites")}
            />

            {/* Kartu Worker Saya — jalur A ke history per orang */}
            <HomeCard
                icon={History}
                tone={workersWithAnomaly > 0 ? "warn" : "ok"}
                label="Riwayat Worker"
                headline={
                    workersWithAnomaly > 0
                        ? `${workersWithAnomaly} dari ${WORKERS.length} worker punya anomali`
                        : `${WORKERS.length} worker dalam cakupan`
                }
                details={
                    workersWithAnomaly > 0
                        ? "Lihat pola per orang: sering lupa scan, bukti lemah, dll"
                        : "Cari worker untuk lihat riwayat per orang"
                }
                onClick={() => onGo("workers")}
            />

            <TransparencyNote>
                Ringkasan ini dihitung dari data nyata di app — bukan estimasi. Tap satu kartu untuk masuk ke detailnya.
            </TransparencyNote>
        </div>
    );
}

function HomeCard({ icon: Icon, tone, label, headline, details, onClick }) {
    const toneColor = { danger: C.danger, warn: C.warn, ok: C.ok }[tone];
    const toneBg = { danger: C.dangerBg, warn: C.warnBg, ok: C.okBg }[tone];
    return (
        <button onClick={onClick}
            style={{
                width: "100%", display: "flex", alignItems: "stretch", gap: 0,
                padding: 0, background: "#fff",
                border: `1.5px solid ${C.cardBd}`, borderRadius: 16, marginBottom: 13,
                cursor: "pointer", fontFamily: "inherit", textAlign: "left", overflow: "hidden",
                boxShadow: "0 1px 3px rgba(20,30,55,0.05)"
            }}>
            <div style={{ width: 6, background: toneColor, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "14px 15px", display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{
                    width: 44, height: 44, borderRadius: 12, background: toneBg,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                    <Icon size={22} color={toneColor} strokeWidth={2.1} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: 0.6 }}>
                        {label}
                    </div>
                    <div style={{ fontSize: 15.5, fontWeight: 800, color: C.ink, marginTop: 3 }}>
                        {headline}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.mute, marginTop: 3, lineHeight: 1.4 }}>
                        {details}
                    </div>
                </div>
                <ChevronRight size={20} color="#C4C8D0" />
            </div>
        </button>
    );
}

// ============================================================
//  LAYAR APPROVAL — kotak masuk supervisor (versi ringkas
//  bagian 10–11; aksi setuju/tolak + level berikutnya)
// ============================================================
function ScreenApprovals({ requests, onApprove, onReject }) {
    if (requests.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.soft }}>
                <Inbox size={42} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: C.mute }}>Tidak ada yang menunggu</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>Semua request sudah diputuskan.</div>
            </div>
        );
    }
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontSize: 13.5, color: C.mute }}>
                <Inbox size={17} />
                <span><strong style={{ color: C.ink }}>{requests.length}</strong> menunggu keputusan</span>
            </div>
            {requests.map((req) => (
                <ApprovalCard key={req.id} req={req} onApprove={onApprove} onReject={onReject} />
            ))}
        </div>
    );
}

function ApprovalCard({ req, onApprove, onReject }) {
    const t = REQ_TYPES[req.typeId];
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState("");
    const levels = VENDOR_RULES[req.typeId] || [];
    const total = levels.length;
    const hasNext = req.currentLevel + 1 < total;
    const waitingMate = req.typeId === "tukar" && req.mateConfirmed === false;

    return (
        <div style={{
            background: "#fff", border: `1.5px solid ${C.cardBd}`, borderRadius: 16, padding: 14,
            marginBottom: 12, boxShadow: "0 1px 3px rgba(20,30,55,0.05)", opacity: waitingMate ? 0.92 : 1
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <span style={{
                    width: 40, height: 40, borderRadius: 11, background: t.tint, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                    <t.icon size={20} color={t.color} strokeWidth={2.2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>{req.applicant}</span>
                        <span style={{
                            fontSize: 10.5, fontWeight: 700, color: t.color, background: t.tint,
                            padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap"
                        }}>
                            {total === 1 ? "1 level" : `Level ${req.currentLevel + 1} dari ${total}`}
                        </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: t.color, fontWeight: 600, margin: "2px 0 3px" }}>{t.label}</div>
                    <div style={{ fontSize: 13, color: C.mute, lineHeight: 1.45 }}>{req.summary}</div>
                </div>
            </div>

            {!rejecting ? (
                <div style={{ display: "flex", gap: 9, marginTop: 13 }}>
                    <button onClick={() => setRejecting(true)}
                        style={{
                            flex: 1, padding: "10px", borderRadius: 11, border: `1.5px solid #F2C9C4`,
                            background: C.dangerBg, color: C.danger, fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit"
                        }}>
                        <X size={16} /> Tolak
                    </button>
                    <button onClick={() => onApprove(req.id)}
                        style={{
                            flex: 1, padding: "10px", borderRadius: 11, border: "none",
                            background: C.ok, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit"
                        }}>
                        <Check size={16} /> {hasNext ? "Setuju → lanjut" : "Setuju"}
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: 13 }}>
                    <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)}
                        placeholder="Alasan penolakan (wajib)…"
                        style={{ ...inpStyle, resize: "vertical" }} />
                    <div style={{ display: "flex", gap: 9, marginTop: 9 }}>
                        <button onClick={() => { setRejecting(false); setReason(""); }}
                            style={{
                                flex: 1, padding: "10px", borderRadius: 11, border: "1.5px solid #D9DCE3",
                                background: "#fff", color: C.mute, fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit"
                            }}>
                            Batal
                        </button>
                        <button disabled={!reason.trim()} onClick={() => onReject(req.id, reason)}
                            style={{
                                flex: 1, padding: "10px", borderRadius: 11, border: "none",
                                background: reason.trim() ? C.danger : "#E5B5AF", color: "#fff",
                                fontWeight: 700, fontSize: 13.5, cursor: reason.trim() ? "pointer" : "not-allowed", fontFamily: "inherit"
                            }}>
                            Kirim penolakan
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
//  LAYAR WORKERS — daftar worker dalam cakupan (Jalur A)
// ============================================================
function ScreenWorkers({ onOpenWorker }) {
    const [query, setQuery] = useState("");
    const [openGroups, setOpenGroups] = useState({ danger: true, warn: true, ok: true });

    const filtered = WORKERS.filter((w) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return w.name.toLowerCase().includes(q)
            || w.primarySite.toLowerCase().includes(q)
            || w.role.toLowerCase().includes(q);
    });
    const grouped = { danger: [], warn: [], ok: [] };
    filtered.forEach((w) => grouped[w.status].push(w));
    // dalam group, yang anomaly lebih banyak di atas
    Object.values(grouped).forEach((arr) => arr.sort((a, b) => b.anomalyCount - a.anomalyCount));

    return (
        <div>
            <div style={{
                display: "flex", alignItems: "center", gap: 9, background: "#fff",
                border: `1.5px solid ${C.cardBd}`, borderRadius: 12, padding: "10px 13px", marginBottom: 14,
            }}>
                <Search size={17} color={C.soft} />
                <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari worker, site, atau peran…"
                    style={{
                        flex: 1, border: "none", outline: "none", fontSize: 14,
                        fontFamily: "inherit", color: C.ink, background: "transparent"
                    }} />
                {query && (
                    <button onClick={() => setQuery("")}
                        style={{ border: "none", background: "none", cursor: "pointer", color: C.soft, display: "flex", padding: 0 }}>
                        <X size={16} />
                    </button>
                )}
            </div>

            {!query && (
                <p style={{ fontSize: 13, color: C.mute, margin: "0 0 14px", lineHeight: 1.5 }}>
                    <strong style={{ color: C.danger }}>{grouped.danger.length} bermasalah</strong>
                    {" · "}
                    <strong style={{ color: C.warn }}>{grouped.warn.length} perhatian</strong>
                    {" · "}
                    <strong style={{ color: C.ok }}>{grouped.ok.length} normal</strong>
                </p>
            )}

            <WorkerGroup tone="danger" label="Bermasalah" workers={grouped.danger}
                open={openGroups.danger} onToggle={() => setOpenGroups((g) => ({ ...g, danger: !g.danger }))}
                onOpen={onOpenWorker} />
            <WorkerGroup tone="warn" label="Perhatian" workers={grouped.warn}
                open={openGroups.warn} onToggle={() => setOpenGroups((g) => ({ ...g, warn: !g.warn }))}
                onOpen={onOpenWorker} />
            <WorkerGroup tone="ok" label="Normal" workers={grouped.ok}
                open={openGroups.ok} onToggle={() => setOpenGroups((g) => ({ ...g, ok: !g.ok }))}
                onOpen={onOpenWorker} />
        </div>
    );
}

function WorkerGroup({ tone, label, workers, open, onToggle, onOpen }) {
    if (workers.length === 0) return null;
    const color = { danger: C.danger, warn: C.warn, ok: C.ok }[tone];
    const bg = { danger: C.dangerBg, warn: C.warnBg, ok: C.okBg }[tone];
    return (
        <div style={{ marginBottom: 14 }}>
            <button onClick={onToggle}
                style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 13px", background: bg, border: `1px solid ${color}33`,
                    borderRadius: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 10
                }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ flex: 1, textAlign: "left", fontSize: 13, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    {label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color }}>{workers.length}</span>
                <ChevronDown size={17} color={color}
                    style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {open && workers.map((w) => <WorkerRowCard key={w.id} worker={w} onClick={() => onOpen(w.id)} />)}
        </div>
    );
}

function WorkerRowCard({ worker, onClick }) {
    const pct = Math.round((worker.presentDays / worker.totalDays) * 100);
    return (
        <button onClick={onClick}
            style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 13px", background: "#fff", border: `1.5px solid ${C.cardBd}`,
                borderRadius: 13, marginBottom: 9, cursor: "pointer", fontFamily: "inherit", textAlign: "left"
            }}>
            <span style={{
                width: 38, height: 38, borderRadius: "50%", background: C.chip,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                fontSize: 14, fontWeight: 800, color: C.mute
            }}>
                {worker.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{worker.name}</div>
                <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>
                    {worker.role} · {worker.primarySite}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5, fontSize: 11.5 }}>
                    <span style={{ color: C.soft }}>{worker.presentDays}/{worker.totalDays} hari · {pct}%</span>
                    {worker.anomalyCount > 0 && (
                        <StatusPill tone={worker.status}>{worker.anomalyCount} anomali</StatusPill>
                    )}
                </div>
            </div>
            <ChevronRight size={18} color="#C4C8D0" />
        </button>
    );
}

// ============================================================
//  LAYAR WORKER HISTORY — riwayat absensi per orang
//  Daftar tanggal kronologis (terbaru di atas). Selalu tampilkan
//  site di tiap baris (jujur tanpa syarat).
// ============================================================
const HISTORY_RANGES = [
    { id: "7d", label: "7 hari" },
    { id: "30d", label: "30 hari" },
    { id: "month", label: "Bulan ini" },
];
function ScreenWorkerHistory({ workerId, onOpenDay }) {
    const worker = WORKERS.find((w) => w.id === workerId);
    const history = WORKER_HISTORY[workerId] || WORKER_HISTORY["w-budi"]; // demo fallback
    const [range, setRange] = useState("30d");

    // Hitung agregat dari data
    const totalDays = history.length;
    const presentDays = history.filter((d) => d.status === "present" || d.status === "corrected" || d.status === "anomaly").length;
    const anomalyDays = history.filter((d) => d.status === "anomaly" || d.status === "corrected").length;
    const leaveDays = history.filter((d) => d.status === "leave").length;

    return (
        <div>
            {/* Header worker */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{
                    width: 44, height: 44, borderRadius: "50%", background: C.chip,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    fontSize: 16, fontWeight: 800, color: C.mute
                }}>
                    {worker?.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>{worker?.name}</div>
                    <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>
                        {worker?.role} · biasanya di {worker?.primarySite}
                    </div>
                </div>
            </div>

            {/* Pemilih rentang */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, background: C.chip, borderRadius: 12, padding: 4 }}>
                {HISTORY_RANGES.map((r) => (
                    <button key={r.id} onClick={() => setRange(r.id)}
                        style={{
                            flex: 1, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                            background: range === r.id ? "#fff" : "transparent",
                            color: range === r.id ? C.ink : C.mute,
                            boxShadow: range === r.id ? "0 1px 2px rgba(0,0,0,0.06)" : "none"
                        }}>
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Ringkasan agregat */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                <SummaryNum value={presentDays} label="Hari hadir" />
                <SummaryNum value={anomalyDays} label="Anomali" tone={anomalyDays > 0 ? "warn" : "ok"} />
                <SummaryNum value={leaveDays} label="Cuti/sakit" />
                <SummaryNum value={totalDays - presentDays - leaveDays} label="Off/libur" />
            </div>

            {/* Daftar tanggal kronologis */}
            {history.map((d, i) => (
                <DayRow key={i} day={d}
                    onClick={() => d.status !== "off" && onOpenDay(workerId, d.date)} />
            ))}

            <TransparencyNote>
                Jam yang ditetapkan supervisor tampil beda dari scan. Ringkasan ini fakta, bukan vonis kinerja —
                konteks (mis. alasan anomali) ada di detail tiap hari.
            </TransparencyNote>
        </div>
    );
}

function DayRow({ day, onClick }) {
    // Off/libur — entry tipis, tidak diklik
    if (day.status === "off") {
        return (
            <div style={{
                padding: "9px 13px", background: "#FAFBFC", border: `1px dashed #E0E3EA`,
                borderRadius: 11, marginBottom: 8, fontSize: 12.5, color: C.soft, textAlign: "center"
            }}>
                {day.date} · Off / Libur
            </div>
        );
    }
    // Cuti/sakit/izin
    if (day.status === "leave") {
        return (
            <div style={{
                padding: "11px 13px", background: "#fff", border: `1.5px solid ${C.cardBd}`,
                borderRadius: 12, marginBottom: 9, display: "flex", alignItems: "center", gap: 11
            }}>
                <span style={{ width: 8, height: 30, borderRadius: 4, background: C.blue }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{day.date}</div>
                    <div style={{ fontSize: 12.5, color: C.mute, marginTop: 2 }}>
                        {day.leaveType} · disetujui {day.site && `· ${day.site}`}
                    </div>
                </div>
            </div>
        );
    }

    // Hari kerja: present / anomaly / corrected
    const isAnomaly = day.status === "anomaly";
    const isCorrected = day.status === "corrected";
    const stripColor = isAnomaly ? C.danger : isCorrected ? C.superv : C.ok;

    const outDisplay = (() => {
        if (day.correctedOut) return day.correctedOut;
        if (day.out) return day.out;
        return "—";
    })();

    return (
        <button onClick={onClick}
            style={{
                width: "100%", display: "flex", alignItems: "stretch", gap: 0, padding: 0,
                background: isAnomaly ? "#FFFCF5" : "#fff",
                border: `1.5px solid ${isAnomaly ? "#F0D9A8" : C.cardBd}`,
                borderRadius: 13, marginBottom: 9, cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", overflow: "hidden"
            }}>
            <div style={{ width: 5, background: stripColor, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "11px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{day.date}</span>
                    {isAnomaly && <StatusPill tone="danger">Belum clock-out</StatusPill>}
                    {isCorrected && <SetBySupervisorTag />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 5, fontSize: 12.5, color: C.mute, flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <LogIn size={12} color={C.ok} /> {day.in || "—"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <LogOut size={12} color={day.correctedOut ? C.superv : isAnomaly ? C.danger : C.mute} /> {outDisplay}
                    </span>
                    {day.correctedAssumption && <AssumptionTag />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontSize: 11.5, color: C.soft, flexWrap: "wrap" }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: C.chip, padding: "2px 7px", borderRadius: 6, fontWeight: 600, color: C.mute
                    }}>
                        <MapPin size={10} /> {day.site}
                    </span>
                    {day.shift && <span>{day.shift}</span>}
                    {day.evidence && <EvidenceBadge level={day.evidence} small />}
                </div>
                {day.note && (
                    <div style={{ fontSize: 11.5, color: C.superv, marginTop: 6, fontStyle: "italic" }}>
                        "{day.note}"
                    </div>
                )}
            </div>
        </button>
    );
}

// ============================================================
//  LAYAR WORKER DAY — timeline satu hari penuh utk satu worker
// ============================================================
function ScreenWorkerDay({ workerId, date }) {
    const worker = WORKERS.find((w) => w.id === workerId);
    const key = `${workerId}__${date}`;
    const data = WORKER_DAY[key] || WORKER_DAY["w-budi__10 Jun (Sen)"]; // demo fallback

    return (
        <div>
            <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.soft, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {worker?.name}
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: C.ink, margin: "4px 0 2px" }}>{date}</h3>
                <div style={{ fontSize: 12.5, color: C.mute }}>
                    {data.site} · {data.shift}
                </div>
            </div>

            {/* Timeline kronologis */}
            <div style={{ position: "relative", paddingLeft: 22, marginBottom: 16 }}>
                <div style={{ position: "absolute", left: 8, top: 8, bottom: 8, width: 2, background: "#E6E8EE" }} />
                {data.events.map((e, i) => {
                    const dotColor = e.kind === "clock_out_missing" ? C.danger
                        : e.evidence === "weak" ? C.warn
                            : e.evidence === "strong" ? C.ok
                                : C.mute;
                    const labelByKind = {
                        clock_in: "Clock-in",
                        clock_out: "Clock-out",
                        clock_out_missing: "Clock-out tidak ada",
                        patrol: "Patroli",
                        cleaning: "Cleaning",
                    };
                    return (
                        <div key={i} style={{ position: "relative", marginBottom: 14 }}>
                            <div style={{
                                position: "absolute", left: -22, top: 6,
                                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                border: `3px solid ${dotColor}`, boxSizing: "border-box"
                            }} />
                            <div style={{
                                background: e.kind === "clock_out_missing" ? "#FFFCF5" : "#fff",
                                border: `1.5px solid ${e.kind === "clock_out_missing" ? "#F0D9A8" : C.cardBd}`,
                                borderRadius: 12, padding: "11px 13px"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{e.time || "—"}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: dotColor }}>· {labelByKind[e.kind]}</span>
                                    {e.evidence && <EvidenceBadge level={e.evidence} small />}
                                </div>
                                {e.location && (
                                    <div style={{
                                        fontSize: 12.5, color: C.mute, marginTop: 4,
                                        display: "inline-flex", alignItems: "center", gap: 4
                                    }}>
                                        <MapPin size={12} /> {e.location}
                                    </div>
                                )}
                                {e.note && (
                                    <div style={{ fontSize: 12, color: C.mute, marginTop: 5, lineHeight: 1.45 }}>
                                        {e.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <TransparencyNote icon={Lock}>
                Catatan tak bisa diubah. Satu hari worker, kronologis: clock-in, kunjungan titik, clock-out.
                Anomali tampil sebagai kejadian, bukan disembunyikan.
            </TransparencyNote>
        </div>
    );
}

// ============================================================
//  INCIDENT — list utama (bagian 22)
//  List lintas site, urut keparahan + waktu. Pola "yang bermasalah
//  di atas" yang sudah konsisten di app. Site disebut sebagai chip
//  di tiap kartu — bukan di-group, supaya kritis dari site mana pun
//  tetap menyembul ke atas.
// ============================================================
function ScreenIncidents({ incidents, onOpen }) {
    // Sort: state aktif dulu (in_progress > vendor_closed > closed),
    // dalam aktif urut keparahan desc, lalu waktu desc (terbaru dulu).
    const stateRank = { in_progress: 0, vendor_closed: 1, closed: 2 };
    const sorted = [...incidents].sort((a, b) => {
        // Komentar klien pending naik paling atas, lintas state
        if (a.clientCommentPending && !b.clientCommentPending) return -1;
        if (!a.clientCommentPending && b.clientCommentPending) return 1;
        const ds = stateRank[a.state] - stateRank[b.state];
        if (ds !== 0) return ds;
        const dr = sevById(b.severity).rank - sevById(a.severity).rank;
        if (dr !== 0) return dr;
        return 0; // urutan asli (terbaru di atas, sesuai data dummy)
    });

    const activeCount = incidents.filter((i) => i.state === "in_progress").length;
    const inWindow = incidents.filter((i) => i.state === "vendor_closed").length;
    const totalClosed = incidents.filter((i) => i.state === "closed").length;

    return (
        <div>
            <p style={{ fontSize: 13.5, color: C.mute, margin: "0 0 14px", lineHeight: 1.5 }}>
                Lintas site. Yang kritis menyembul ke atas. Tap untuk lihat rantai
                penanganan & ambil aksi.
            </p>

            {/* Ringkasan agregat ramping */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 7, marginBottom: 16
            }}>
                <MiniNum value={activeCount} label="Sedang ditangani"
                    tone={activeCount > 0 ? "warn" : "neutral"} />
                <MiniNum value={inWindow} label="Jendela klien"
                    tone={inWindow > 0 ? "blue" : "neutral"} />
                <MiniNum value={totalClosed} label="Tertutup" />
            </div>

            {sorted.map((inc) => (
                <IncidentCard key={inc.id} incident={inc} onClick={() => onOpen(inc.id)} />
            ))}
        </div>
    );
}

function MiniNum({ value, label, tone = "neutral" }) {
    const map = {
        warn: [C.warn, C.warnBg],
        danger: [C.danger, C.dangerBg],
        blue: [C.blue, C.blueBg],
        ok: [C.ok, C.okBg],
        neutral: [C.ink, "#fff"],
    }[tone];
    return (
        <div style={{
            background: map[1], border: `1.5px solid ${C.cardBd}`,
            borderRadius: 10, padding: "7px 9px"
        }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: map[0], lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: 10, color: C.mute, marginTop: 2, lineHeight: 1.3 }}>{label}</div>
        </div>
    );
}

function IncidentCard({ incident, onClick }) {
    const sev = sevById(incident.severity);
    const cat = catById(incident.category);
    const Icon = cat.icon;
    const pending = incident.clientCommentPending;

    return (
        <button onClick={onClick}
            style={{
                width: "100%", display: "flex", alignItems: "stretch", gap: 0, padding: 0,
                background: "#fff",
                border: pending ? `1.5px solid ${C.warn}` : `1.5px solid ${C.cardBd}`,
                borderRadius: 14,
                marginBottom: 10, cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", overflow: "hidden",
                boxShadow: pending ? `0 1px 6px ${C.warn}22` : "none"
            }}>
            {/* Strip keparahan kiri */}
            <div style={{ width: 6, background: sev.color, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "13px 14px", minWidth: 0 }}>
                {/* Baris 1 — ikon kategori + badge keparahan + state */}
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                    <span style={{
                        width: 32, height: 32, borderRadius: 9, background: sev.bg,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                        <Icon size={16} color={sev.color} strokeWidth={2.2} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <span style={{
                                fontSize: 11, fontWeight: 800, color: sev.color,
                                textTransform: "uppercase", letterSpacing: 0.5
                            }}>
                                {sev.label}
                            </span>
                            <span style={{ fontSize: 11, color: C.soft }}>· {cat.label}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 3, lineHeight: 1.4 }}>
                            {incident.summary}
                        </div>
                    </div>
                </div>

                {/* Baris 2 — metadata: pelapor, site, waktu */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
                    marginTop: 4
                }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: C.chip, padding: "2px 7px", borderRadius: 6,
                        fontSize: 11, fontWeight: 600, color: C.mute
                    }}>
                        <MapPin size={10} /> {incident.site}
                    </span>
                    <span style={{ fontSize: 11.5, color: C.mute }}>
                        {incident.reportedBy} · {incident.reportedAt}
                    </span>
                </div>

                {/* Baris 3 — state pill + komentar klien pending */}
                <div style={{ marginTop: 8, display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <StateBadge incident={incident} />
                    {pending && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 11, fontWeight: 700, color: C.warn, background: C.warnBg,
                            padding: "3px 9px", borderRadius: 20
                        }}>
                            <MessageCircle size={11} /> Komentar klien · belum direspons
                        </span>
                    )}
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingRight: 10 }}>
                <ChevronRight size={18} color="#C4C8D0" />
            </div>
        </button>
    );
}

function StateBadge({ incident }) {
    if (incident.state === "in_progress") {
        return (
            <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700, color: C.warn, background: C.warnBg,
                padding: "3px 9px", borderRadius: 20
            }}>
                <CircleDot size={11} /> Sedang ditangani · {incident.chain.length} operan
            </span>
        );
    }
    if (incident.state === "vendor_closed") {
        const escalated = incident.closureKind === "escalated_external";
        return (
            <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueBg,
                padding: "3px 9px", borderRadius: 20
            }}>
                <Hourglass size={11} />
                {escalated ? "Selesai vendor · diteruskan" : "Selesai vendor"} · jendela klien {incident.windowDaysLeft}h
            </span>
        );
    }
    // closed
    const silent = incident.autoCloseLabel === "client_silent";
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, color: C.ok, background: C.okBg,
            padding: "3px 9px", borderRadius: 20
        }}>
            <Check size={11} />
            {silent ? "Tertutup · klien tidak menanggapi" : "Tertutup · dikonfirmasi klien"}
        </span>
    );
}

// ============================================================
//  INCIDENT DETAIL — rantai operan + aksi tutup
// ============================================================
function ScreenIncidentDetail({ incidentId, incidents, onAction }) {
    const inc = incidents.find((i) => i.id === incidentId);
    const [actionMode, setActionMode] = useState(null);
    // actionMode: null | 'handover' | 'back_to_worker' | 'resolve' | 'escalate'

    if (!inc) return <div style={{ padding: 20, color: C.mute }}>Incident tidak ditemukan.</div>;
    const sev = sevById(inc.severity);
    const cat = catById(inc.category);

    return (
        <div>
            {/* Header — fakta terkunci */}
            <div style={{
                background: "#fff", border: `1.5px solid ${C.cardBd}`,
                borderRadius: 14, padding: "14px 15px", marginBottom: 14
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                    <span style={{
                        width: 38, height: 38, borderRadius: 11, background: sev.bg,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <cat.icon size={19} color={sev.color} strokeWidth={2.2} />
                    </span>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <span style={{
                                fontSize: 11, fontWeight: 800, color: sev.color,
                                textTransform: "uppercase", letterSpacing: 0.5
                            }}>{sev.label}</span>
                            <span style={{ fontSize: 11, color: C.soft }}>· {cat.label}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 3, lineHeight: 1.4 }}>
                            {inc.summary}
                        </div>
                    </div>
                </div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
                    fontSize: 12, color: C.mute
                }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: C.chip, padding: "2px 7px", borderRadius: 6, fontWeight: 600
                    }}>
                        <MapPin size={11} /> {inc.site}
                    </span>
                    <span>Dilapor {inc.reportedBy} · {inc.reportedAt}</span>
                </div>
                {/* Bukti placeholder */}
                <div style={{
                    marginTop: 10, padding: "9px 11px", background: C.chip,
                    borderRadius: 9, fontSize: 11.5, color: C.mute,
                    display: "flex", alignItems: "center", gap: 9
                }}>
                    <Camera size={14} /> Foto · GPS · Waktu (bukti terkunci sejak dibuat)
                </div>
            </div>

            {/* Banner komentar klien pending — paling menonjol */}
            {inc.clientCommentPending && (
                <div style={{
                    background: C.warnBg, border: `1.5px solid ${C.warn}`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 14
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <MessageCircle size={16} color={C.warn} strokeWidth={2.3} />
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: C.warn }}>
                            Klien berkomentar — bola kembali ke Anda
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
                        Klien belum puas dan mengembalikan kasus. Tindak lanjuti, lalu tutup ulang.
                    </div>
                </div>
            )}

            {/* Rantai operan */}
            <SectionLabel>Rantai penanganan ({inc.chain.length})</SectionLabel>
            <div style={{ position: "relative", paddingLeft: 22, marginBottom: 16 }}>
                <div style={{
                    position: "absolute", left: 8, top: 4, bottom: 4,
                    width: 2, background: "#E6E8EE"
                }} />
                {inc.chain.map((step, i) => (
                    <div key={i} style={{ position: "relative", marginBottom: 11 }}>
                        <div style={{
                            position: "absolute", left: -22, top: 3,
                            width: 18, height: 18, borderRadius: "50%", background: "#fff",
                            border: `3px solid ${C.blue}`, boxSizing: "border-box"
                        }} />
                        <div style={{
                            background: "#fff", border: `1.5px solid ${C.cardBd}`,
                            borderRadius: 11, padding: "9px 12px"
                        }}>
                            <div style={{
                                fontSize: 12.5, fontWeight: 700, color: C.ink,
                                display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap"
                            }}>
                                <span>{step.from}</span>
                                <ArrowRight size={12} color={C.soft} />
                                <span>{step.to}</span>
                                <span style={{ color: C.soft, fontWeight: 500 }}>· {step.at}</span>
                            </div>
                            {step.note && (
                                <div style={{ fontSize: 11.5, color: C.mute, marginTop: 3, fontStyle: "italic" }}>
                                    "{step.note}"
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bagian status berbeda per state */}
            {inc.state === "in_progress" && (
                <ActionPanel inc={inc} mode={actionMode} setMode={setActionMode}
                    onAction={onAction} />
            )}

            {inc.state === "vendor_closed" && (
                <ClosurePanel inc={inc} />
            )}

            {inc.state === "closed" && (
                <FinalClosurePanel inc={inc} />
            )}
        </div>
    );
}

function SectionLabel({ children }) {
    return (
        <div style={{
            fontSize: 11.5, fontWeight: 800, color: C.soft,
            textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10
        }}>
            {children}
        </div>
    );
}

// Panel aksi saat incident masih 'in_progress'
function ActionPanel({ inc, mode, setMode, onAction }) {
    const [target, setTarget] = useState("");
    const [note, setNote] = useState("");

    if (!mode) {
        return (
            <>
                <SectionLabel>Aksi</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
                    <ActionTile icon={Repeat} label="Oper ke" sub="rekan / supervisor"
                        onClick={() => setMode("handover")} />
                    <ActionTile icon={ExternalLink} label="Eskalasi" sub="ke pihak luar"
                        onClick={() => setMode("escalate")} />
                    <ActionTile icon={Check} label="Tandai selesai" sub="vendor menyelesaikan"
                        color={C.ok} bg={C.okBg} onClick={() => setMode("resolve")} />
                    <ActionTile icon={MessageSquare} label="Tambah catatan" sub="tanpa pindah"
                        onClick={() => setMode("note")} />
                </div>
            </>
        );
    }

    // Sub-modes — tampilkan form sesuai aksi
    const cancelBtn = (
        <button onClick={() => { setMode(null); setTarget(""); setNote(""); }}
            style={{
                flex: 1, padding: "11px", borderRadius: 11, border: `1.5px solid ${C.cardBd}`,
                background: "#fff", color: C.mute, fontWeight: 600, fontSize: 13.5,
                cursor: "pointer", fontFamily: "inherit"
            }}>
            Batal
        </button>
    );

    if (mode === "handover") {
        return (
            <>
                <SectionLabel>Oper ke siapa</SectionLabel>
                <select value={target} onChange={(e) => setTarget(e.target.value)}
                    style={{ ...inpStyle2, marginBottom: 12 }}>
                    <option value="">Pilih penerima…</option>
                    <option>Sari Wulandari (worker)</option>
                    <option>Agus Pratama (worker)</option>
                    <option>Supervisor lain (Rian)</option>
                    <option>Atasan Area</option>
                </select>
                <label style={lblStyle2}>Catatan operan</label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Konteks utk penerima…"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!target} onClick={() => { onAction(inc.id, "handover", { target, note }); setMode(null); setTarget(""); setNote(""); }}
                        style={actionBtn(target ? C.blue : "#A8C5E8")}>
                        <Send size={16} /> Oper
                    </button>
                </div>
            </>
        );
    }

    if (mode === "escalate") {
        return (
            <>
                <SectionLabel>Eskalasi ke pihak luar</SectionLabel>
                <div style={{
                    background: C.warnBg, border: `1.5px solid ${C.warn}33`,
                    borderRadius: 11, padding: "10px 12px", marginBottom: 12, fontSize: 11.5,
                    color: C.warn, lineHeight: 1.5
                }}>
                    Pihak luar belum pakai app. Tutup di sisi vendor + lampirkan bukti WA.
                    Sistem mencatat "diteruskan" — bukan "sudah diperbaiki".
                </div>
                <label style={lblStyle2}>Diteruskan ke</label>
                <input value={target} onChange={(e) => setTarget(e.target.value)}
                    placeholder="Mis. Maintenance gedung BP Legok"
                    style={{ ...inpStyle2, marginBottom: 12 }} />
                <label style={lblStyle2}>Keterangan / bukti WA</label>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Mis. WA via grup maintenance jam 14:00, screenshot terlampir"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!target || !note}
                        onClick={() => { onAction(inc.id, "escalate", { target, note }); setMode(null); setTarget(""); setNote(""); }}
                        style={actionBtn(target && note ? C.warn : "#E3C77A")}>
                        <Check size={16} /> Tutup vendor · diteruskan
                    </button>
                </div>
            </>
        );
    }

    if (mode === "resolve") {
        return (
            <>
                <SectionLabel>Tandai selesai (vendor menyelesaikan)</SectionLabel>
                <div style={{
                    background: C.okBg, border: `1.5px solid ${C.ok}33`,
                    borderRadius: 11, padding: "10px 12px", marginBottom: 12, fontSize: 11.5,
                    color: C.ok, lineHeight: 1.5
                }}>
                    Pilih ini kalau vendor benar-benar menyelesaikan kasus. Akan masuk
                    jendela klien {VENDOR_AUTO_CLOSE_DAYS} hari sebelum auto-close.
                </div>
                <label style={lblStyle2}>Bagaimana diselesaikan</label>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Mis. CCTV diperiksa, orang dikenali sebagai tamu sah"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!note}
                        onClick={() => { onAction(inc.id, "resolve", { note }); setMode(null); setNote(""); }}
                        style={actionBtn(note ? C.ok : "#A9DDCB")}>
                        <Check size={16} /> Tandai selesai
                    </button>
                </div>
            </>
        );
    }

    if (mode === "note") {
        return (
            <>
                <SectionLabel>Tambah catatan</SectionLabel>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Catatan utk jejak kasus…"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!note} onClick={() => { onAction(inc.id, "note", { note }); setMode(null); setNote(""); }}
                        style={actionBtn(note ? C.ink : "#999")}>
                        <FileText size={16} /> Tambah
                    </button>
                </div>
            </>
        );
    }
    return null;
}

function ActionTile({ icon: Icon, label, sub, color, bg, onClick }) {
    return (
        <button onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: 11, padding: "12px 13px",
                background: bg || "#fff", border: `1.5px solid ${color ? color + "33" : C.cardBd}`,
                borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left"
            }}>
            <span style={{
                width: 32, height: 32, borderRadius: 9,
                background: color ? "#fff" : C.chip,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
            }}>
                <Icon size={16} color={color || C.ink} strokeWidth={2.2} />
            </span>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: color || C.ink }}>{label}</div>
                <div style={{ fontSize: 11, color: C.soft, marginTop: 1 }}>{sub}</div>
            </div>
        </button>
    );
}

// Panel saat vendor_closed — di jendela klien
function ClosurePanel({ inc }) {
    const escalated = inc.closureKind === "escalated_external";
    return (
        <>
            <SectionLabel>Status</SectionLabel>
            <div style={{
                background: escalated ? C.warnBg : C.okBg,
                border: `1.5px solid ${(escalated ? C.warn : C.ok) + "33"}`,
                borderRadius: 12, padding: "13px 14px", marginBottom: 12
            }}>
                <div style={{
                    fontSize: 13, fontWeight: 800,
                    color: escalated ? C.warn : C.ok
                }}>
                    {escalated
                        ? "Selesai vendor · diteruskan ke pihak luar"
                        : "Selesai vendor · ditangani sendiri"}
                </div>
                <div style={{ fontSize: 12, color: C.ink, marginTop: 5, lineHeight: 1.45 }}>
                    Ditutup {inc.closedAt} oleh {inc.closedBy}.
                </div>
                {inc.escalationNote && (
                    <div style={{
                        fontSize: 11.5, color: C.mute, marginTop: 6, fontStyle: "italic",
                        paddingTop: 7, borderTop: `1px dashed ${C.warn}33`
                    }}>
                        "{inc.escalationNote}"
                    </div>
                )}
                {escalated && (
                    <div style={{ fontSize: 11, color: C.warn, marginTop: 7, fontWeight: 600 }}>
                        Sistem tidak tahu apakah pihak luar sudah memperbaiki.
                    </div>
                )}
            </div>
            <div style={{
                background: C.blueBg, border: `1.5px solid ${C.blue}33`,
                borderRadius: 11, padding: "10px 12px", fontSize: 12, color: C.blue,
                lineHeight: 1.5, display: "flex", gap: 9
            }}>
                <Hourglass size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                    Jendela klien: {inc.windowDaysLeft} hari tersisa. Auto-close jujur:
                    kalau klien diam, label "klien tidak menanggapi"; kalau klien menanggapi,
                    label "dikonfirmasi klien".
                </span>
            </div>
        </>
    );
}

// Panel saat sudah fully closed
function FinalClosurePanel({ inc }) {
    const silent = inc.autoCloseLabel === "client_silent";
    return (
        <>
            <SectionLabel>Status final</SectionLabel>
            <div style={{
                background: C.okBg, border: `1.5px solid ${C.ok}33`,
                borderRadius: 12, padding: "13px 14px", marginBottom: 12
            }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.ok }}>
                    {silent
                        ? "Tertutup · klien tidak menanggapi"
                        : "Tertutup · dikonfirmasi klien"}
                </div>
                <div style={{ fontSize: 12, color: C.ink, marginTop: 5, lineHeight: 1.45 }}>
                    {silent
                        ? `Jendela ${VENDOR_AUTO_CLOSE_DAYS} hari lewat tanpa keberatan dari klien. Sistem tidak menebak setuju — hanya mencatat diam.`
                        : "Klien menanggapi & menutup secara aktif."}
                </div>
            </div>
        </>
    );
}

const lblStyle2 = {
    display: "block", fontSize: 12.5, fontWeight: 700,
    color: "#41506E", marginBottom: 7
};
const inpStyle2 = {
    width: "100%", boxSizing: "border-box",
    padding: "11px 13px", fontSize: 14, border: "1.5px solid #D9DCE3",
    borderRadius: 11, outline: "none", fontFamily: "inherit", color: C.ink
};
function actionBtn(color) {
    return {
        flex: 2, padding: "11px", borderRadius: 11, border: "none",
        background: color, color: "#fff", fontWeight: 700, fontSize: 14,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7
    };
}

// ============================================================
//  COMPLAINT — LAYAR SUPERVISOR (bagian 23)
//  Cermin incident, dgn perbedaan:
//   - diangkat klien (raisedBy), bukan worker
//   - badge divisi tujuan (routedTo) — fondasi 1c
//   - penanda komentar klien menunggu respons ("bola balik")
//   - ActionPanel punya "Oper ke worker" (opsional, situasional)
// ============================================================
function ScreenComplaints({ complaints, onOpen }) {
    // Sort: komentar klien pending DULU (paling mendesak — bola di vendor),
    // lalu in_progress, lalu vendor_closed, lalu closed. Dalam grup urut
    // keparahan desc. Pola "yang bermasalah di atas".
    const stateRank = { in_progress: 0, vendor_closed: 1, closed: 2 };
    const sorted = [...complaints].sort((a, b) => {
        // Komentar klien pending naik paling atas, lintas state
        if (a.clientCommentPending && !b.clientCommentPending) return -1;
        if (!a.clientCommentPending && b.clientCommentPending) return 1;
        const ds = stateRank[a.state] - stateRank[b.state];
        if (ds !== 0) return ds;
        return sevById(b.severity).rank - sevById(a.severity).rank;
    });

    const pendingComment = complaints.filter((c) => c.clientCommentPending).length;
    const active = complaints.filter((c) => c.state === "in_progress").length;
    const inWindow = complaints.filter((c) => c.state === "vendor_closed").length;
    const closed = complaints.filter((c) => c.state === "closed").length;

    return (
        <div>
            <p style={{ fontSize: 13.5, color: C.mute, margin: "0 0 14px", lineHeight: 1.5 }}>
                Komplain dari klien, lintas site. Yang butuh respons Anda menyembul ke atas.
                Tap untuk lihat rantai & ambil aksi.
            </p>

            {/* Banner komentar klien pending — kalau ada */}
            {pendingComment > 0 && (
                <div style={{
                    background: C.warnBg, border: `1.5px solid ${C.warn}`,
                    borderRadius: 12, padding: "11px 13px", marginBottom: 14,
                    display: "flex", alignItems: "center", gap: 10
                }}>
                    <MessageCircle size={18} color={C.warn} strokeWidth={2.2} />
                    <div style={{ flex: 1, fontSize: 12.5, color: C.warn, fontWeight: 600, lineHeight: 1.4 }}>
                        {pendingComment} komplain dengan komentar klien menunggu respons Anda
                    </div>
                </div>
            )}

            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 7, marginBottom: 16
            }}>
                <MiniNum value={active} label="Sedang ditangani"
                    tone={active > 0 ? "warn" : "neutral"} />
                <MiniNum value={inWindow} label="Jendela klien"
                    tone={inWindow > 0 ? "blue" : "neutral"} />
                <MiniNum value={closed} label="Tertutup" />
            </div>

            {sorted.map((cmp) => (
                <ComplaintCard key={cmp.id} complaint={cmp} onClick={() => onOpen(cmp.id)} />
            ))}
        </div>
    );
}

function ComplaintCard({ complaint, onClick }) {
    const sev = sevById(complaint.severity);
    const cat = complaintCatById(complaint.category);
    const Icon = cat.icon;
    const pending = complaint.clientCommentPending;

    return (
        <button onClick={onClick}
            style={{
                width: "100%", display: "flex", alignItems: "stretch", gap: 0, padding: 0,
                background: "#fff",
                border: pending ? `1.5px solid ${C.warn}` : `1.5px solid ${C.cardBd}`,
                borderRadius: 14, marginBottom: 10, cursor: "pointer", fontFamily: "inherit",
                textAlign: "left", overflow: "hidden",
                boxShadow: pending ? `0 1px 6px ${C.warn}22` : "none"
            }}>
            <div style={{ width: 6, background: sev.color, flexShrink: 0 }} />
            <div style={{ flex: 1, padding: "13px 14px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                    <span style={{
                        width: 32, height: 32, borderRadius: 9, background: sev.bg,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                        <Icon size={16} color={sev.color} strokeWidth={2.2} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <span style={{
                                fontSize: 11, fontWeight: 800, color: sev.color,
                                textTransform: "uppercase", letterSpacing: 0.5
                            }}>
                                {sev.label}
                            </span>
                            <span style={{ fontSize: 11, color: C.soft }}>· {cat.label}</span>
                            {/* Badge divisi tujuan (fondasi 1c) */}
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: C.blue,
                                background: C.blueBg, padding: "1px 7px", borderRadius: 20
                            }}>
                                {complaint.routedTo}
                            </span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 3, lineHeight: 1.4 }}>
                            {complaint.summary}
                        </div>
                    </div>
                </div>

                <div style={{
                    display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
                    marginTop: 4
                }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: C.chip, padding: "2px 7px", borderRadius: 6,
                        fontSize: 11, fontWeight: 600, color: C.mute
                    }}>
                        <MapPin size={10} /> {complaint.site}
                    </span>
                    <span style={{ fontSize: 11.5, color: C.mute }}>
                        {complaint.raisedBy} · {complaint.raisedAt}
                    </span>
                    {complaint.inputSource === "supervisor_recorded" && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, color: C.superv,
                            background: C.supervBg, padding: "1px 6px", borderRadius: 20
                        }}>
                            dicatat dari telepon
                        </span>
                    )}
                </div>

                <div style={{ marginTop: 8, display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <ComplaintStateBadge complaint={complaint} />
                    {pending && (
                        <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 11, fontWeight: 700, color: C.warn, background: C.warnBg,
                            padding: "3px 9px", borderRadius: 20
                        }}>
                            <MessageCircle size={11} /> Komentar klien · belum direspons
                        </span>
                    )}
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingRight: 10 }}>
                <ChevronRight size={18} color="#C4C8D0" />
            </div>
        </button>
    );
}

function ComplaintStateBadge({ complaint }) {
    if (complaint.state === "in_progress") {
        return (
            <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700, color: C.warn, background: C.warnBg,
                padding: "3px 9px", borderRadius: 20
            }}>
                <CircleDot size={11} /> Sedang ditangani · {complaint.chain.length} langkah
            </span>
        );
    }
    if (complaint.state === "vendor_closed") {
        return (
            <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, fontWeight: 700, color: C.blue, background: C.blueBg,
                padding: "3px 9px", borderRadius: 20
            }}>
                <Hourglass size={11} /> Selesai vendor · jendela klien {complaint.windowDaysLeft}h
            </span>
        );
    }
    const silent = complaint.autoCloseLabel === "client_silent";
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, color: C.ok, background: C.okBg,
            padding: "3px 9px", borderRadius: 20
        }}>
            <Check size={11} />
            {silent ? "Tertutup · klien tidak menanggapi" : "Tertutup · dikonfirmasi klien"}
        </span>
    );
}

// ============================================================
//  COMPLAINT DETAIL — rantai respons + aksi
// ============================================================
function ScreenComplaintDetail({ complaintId, complaints, onAction }) {
    const cmp = complaints.find((c) => c.id === complaintId);
    const [mode, setMode] = useState(null);
    // mode: null | 'worker' | 'supervisor' | 'resolve' | 'note' | 'respond_client'

    if (!cmp) return <div style={{ padding: 20, color: C.mute }}>Komplain tidak ditemukan.</div>;
    const sev = sevById(cmp.severity);
    const cat = complaintCatById(cmp.category);

    return (
        <div>
            {/* Header — fakta komplain */}
            <div style={{
                background: "#fff", border: `1.5px solid ${C.cardBd}`,
                borderRadius: 14, padding: "14px 15px", marginBottom: 14
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                    <span style={{
                        width: 38, height: 38, borderRadius: 11, background: sev.bg,
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <cat.icon size={19} color={sev.color} strokeWidth={2.2} />
                    </span>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                            <span style={{
                                fontSize: 11, fontWeight: 800, color: sev.color,
                                textTransform: "uppercase", letterSpacing: 0.5
                            }}>{sev.label}</span>
                            <span style={{ fontSize: 11, color: C.soft }}>· {cat.label}</span>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: C.blue,
                                background: C.blueBg, padding: "1px 7px", borderRadius: 20
                            }}>
                                {cmp.routedTo}
                            </span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 3, lineHeight: 1.4 }}>
                            {cmp.summary}
                        </div>
                    </div>
                </div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap",
                    fontSize: 12, color: C.mute
                }}>
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: C.chip, padding: "2px 7px", borderRadius: 6, fontWeight: 600
                    }}>
                        <MapPin size={11} /> {cmp.site}
                    </span>
                    <span>Diajukan {cmp.raisedBy} · {cmp.raisedAt}</span>
                </div>
                {/* Catatan kalau dicatat dari telepon (Cara masuk 2) */}
                {cmp.inputSource === "supervisor_recorded" && cmp.recordedNote && (
                    <div style={{
                        marginTop: 10, padding: "9px 11px", background: C.supervBg,
                        borderRadius: 9, fontSize: 11.5, color: C.superv, lineHeight: 1.5,
                        display: "flex", alignItems: "flex-start", gap: 8
                    }}>
                        <FileText size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>{cmp.recordedNote}</span>
                    </div>
                )}
            </div>

            {/* Banner komentar klien pending — paling menonjol */}
            {cmp.clientCommentPending && (
                <div style={{
                    background: C.warnBg, border: `1.5px solid ${C.warn}`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 14
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <MessageCircle size={16} color={C.warn} strokeWidth={2.3} />
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: C.warn }}>
                            Klien berkomentar — bola kembali ke Anda
                        </span>
                    </div>
                    <div style={{ fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
                        Klien tidak puas dan mengembalikan komplain. Respons di bawah, lalu
                        tutup ulang kalau sudah dibereskan.
                    </div>
                </div>
            )}

            {/* Rantai respons */}
            <SectionLabel>Rantai respons ({cmp.chain.length})</SectionLabel>
            <div style={{ position: "relative", paddingLeft: 22, marginBottom: 16 }}>
                <div style={{
                    position: "absolute", left: 8, top: 4, bottom: 4,
                    width: 2, background: "#E6E8EE"
                }} />
                {cmp.chain.map((step, i) => {
                    // Langkah dari klien ditandai warna ungu (data dari luar vendor)
                    const fromClient = step.from === cmp.raisedBy;
                    return (
                        <div key={i} style={{ position: "relative", marginBottom: 11 }}>
                            <div style={{
                                position: "absolute", left: -22, top: 3,
                                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                                border: `3px solid ${fromClient ? C.superv : C.blue}`, boxSizing: "border-box"
                            }} />
                            <div style={{
                                background: "#fff", border: `1.5px solid ${C.cardBd}`,
                                borderRadius: 11, padding: "9px 12px"
                            }}>
                                <div style={{
                                    fontSize: 12.5, fontWeight: 700, color: C.ink,
                                    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap"
                                }}>
                                    <span>{step.from}</span>
                                    <ArrowRight size={12} color={C.soft} />
                                    <span>{step.to}</span>
                                    <span style={{ color: C.soft, fontWeight: 500 }}>· {step.at}</span>
                                </div>
                                {step.note && (
                                    <div style={{ fontSize: 11.5, color: C.mute, marginTop: 3, fontStyle: "italic" }}>
                                        "{step.note}"
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Panel aksi per state */}
            {cmp.state === "in_progress" && (
                <ComplaintActionPanel cmp={cmp} mode={mode} setMode={setMode} onAction={onAction} />
            )}
            {cmp.state === "vendor_closed" && <ClosurePanel inc={cmp} />}
            {cmp.state === "closed" && <FinalClosurePanel inc={cmp} />}
        </div>
    );
}

function ComplaintActionPanel({ cmp, mode, setMode, onAction }) {
    const [target, setTarget] = useState("");
    const [note, setNote] = useState("");

    const reset = () => { setMode(null); setTarget(""); setNote(""); };
    const cancelBtn = (
        <button onClick={reset}
            style={{
                flex: 1, padding: "11px", borderRadius: 11, border: `1.5px solid ${C.cardBd}`,
                background: "#fff", color: C.mute, fontWeight: 600, fontSize: 13.5,
                cursor: "pointer", fontFamily: "inherit"
            }}>
            Batal
        </button>
    );

    if (!mode) {
        return (
            <>
                <SectionLabel>Aksi</SectionLabel>
                {cmp.clientCommentPending && (
                    <div style={{ fontSize: 11.5, color: C.warn, marginBottom: 10, lineHeight: 1.5 }}>
                        Klien menunggu respons. Tindak lanjuti, lalu tutup ulang.
                    </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
                    <ActionTile icon={Users} label="Oper ke worker" sub="minta worker tindak lanjut"
                        onClick={() => setMode("worker")} />
                    <ActionTile icon={Repeat} label="Oper ke supervisor" sub="rekan / atasan"
                        onClick={() => setMode("supervisor")} />
                    <ActionTile icon={Check} label="Tandai selesai" sub="vendor merespons"
                        color={C.ok} bg={C.okBg} onClick={() => setMode("resolve")} />
                    <ActionTile icon={MessageSquare} label="Tambah catatan" sub="tanpa pindah"
                        onClick={() => setMode("note")} />
                </div>
            </>
        );
    }

    if (mode === "worker") {
        return (
            <>
                <SectionLabel>Oper ke worker</SectionLabel>
                <div style={{
                    background: C.blueBg, border: `1.5px solid ${C.blue}33`,
                    borderRadius: 11, padding: "10px 12px", marginBottom: 12, fontSize: 11.5,
                    color: C.blue, lineHeight: 1.5
                }}>
                    Operan masuk ke inbox worker. Pakai ini kalau complaint butuh tindak
                    lapangan (mis. bersihkan ulang, periksa titik). Worker lapor balik saat selesai.
                </div>
                <label style={lblStyle2}>Worker penerima</label>
                <select value={target} onChange={(e) => setTarget(e.target.value)}
                    style={{ ...inpStyle2, marginBottom: 12 }}>
                    <option value="">Pilih worker…</option>
                    <option>Dewi Lestari (Cleaning)</option>
                    <option>Sari Wulandari (Security)</option>
                    <option>Agus Pratama (Security)</option>
                    <option>Citra Dewi (Cleaning)</option>
                </select>
                <label style={lblStyle2}>Instruksi untuk worker</label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Mis. Tolong bersihkan ulang lobby & lapor balik dgn foto"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!target || !note}
                        onClick={() => { onAction(cmp.id, "handover_worker", { target, note }); reset(); }}
                        style={actionBtn(target && note ? C.blue : "#A8C5E8")}>
                        <Send size={16} /> Oper ke worker
                    </button>
                </div>
            </>
        );
    }

    if (mode === "supervisor") {
        return (
            <>
                <SectionLabel>Oper ke supervisor lain</SectionLabel>
                <label style={lblStyle2}>Penerima</label>
                <select value={target} onChange={(e) => setTarget(e.target.value)}
                    style={{ ...inpStyle2, marginBottom: 12 }}>
                    <option value="">Pilih penerima…</option>
                    <option>Supervisor Keamanan</option>
                    <option>Supervisor Cleaning</option>
                    <option>Manajemen Jab</option>
                    <option>Atasan Area</option>
                </select>
                <label style={lblStyle2}>Catatan operan</label>
                <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Konteks utk penerima…"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!target}
                        onClick={() => { onAction(cmp.id, "handover_supervisor", { target, note }); reset(); }}
                        style={actionBtn(target ? C.blue : "#A8C5E8")}>
                        <Send size={16} /> Oper
                    </button>
                </div>
            </>
        );
    }

    if (mode === "resolve") {
        const respondingToComment = cmp.clientCommentPending;
        return (
            <>
                <SectionLabel>Tandai selesai (vendor merespons)</SectionLabel>
                <div style={{
                    background: C.okBg, border: `1.5px solid ${C.ok}33`,
                    borderRadius: 11, padding: "10px 12px", marginBottom: 12, fontSize: 11.5,
                    color: C.ok, lineHeight: 1.5
                }}>
                    {respondingToComment
                        ? `Anda merespons komentar klien. Akan masuk jendela klien ${VENDOR_AUTO_CLOSE_DAYS} hari lagi — klien bisa puas, komentar lagi, atau diam.`
                        : `Vendor merespons komplain. Masuk jendela klien ${VENDOR_AUTO_CLOSE_DAYS} hari sebelum auto-close.`}
                </div>
                <label style={lblStyle2}>Bagaimana ditangani</label>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Mis. Briefing ulang tim, jadwal cleaning sore ditambah"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!note}
                        onClick={() => { onAction(cmp.id, "resolve", { note }); reset(); }}
                        style={actionBtn(note ? C.ok : "#A9DDCB")}>
                        <Check size={16} /> Tandai selesai
                    </button>
                </div>
            </>
        );
    }

    if (mode === "note") {
        return (
            <>
                <SectionLabel>Tambah catatan</SectionLabel>
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)}
                    placeholder="Catatan utk jejak komplain…"
                    style={{ ...inpStyle2, resize: "vertical", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 10 }}>
                    {cancelBtn}
                    <button disabled={!note}
                        onClick={() => { onAction(cmp.id, "note", { note }); reset(); }}
                        style={actionBtn(note ? C.ink : "#999")}>
                        <FileText size={16} /> Tambah
                    </button>
                </div>
            </>
        );
    }
    return null;
}

// ============================================================
//  SHELL / NAVIGASI
// ============================================================
export default function App() {
    const [stack, setStack] = useState([{ view: "home" }]);
    const [requests, setRequests] = useState(INITIAL_REQUESTS);
    const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
    const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
    const top = stack[stack.length - 1];
    const push = (v) => setStack((s) => [...s, v]);
    const pop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

    function approveRequest(id) {
        setRequests((q) => {
            const req = q.find((r) => r.id === id);
            const total = (VENDOR_RULES[req.typeId] || []).length;
            const hasNext = req.currentLevel + 1 < total;
            if (hasNext) return q.map((r) => (r.id === id ? { ...r, currentLevel: r.currentLevel + 1 } : r));
            return q.filter((r) => r.id !== id);
        });
    }
    function rejectRequest(id) {
        setRequests((q) => q.filter((r) => r.id !== id));
    }

    // Aksi incident: tambah ke chain dan/atau ubah state
    function handleIncidentAction(incidentId, kind, payload) {
        setIncidents((all) => all.map((inc) => {
            if (inc.id !== incidentId) return inc;
            const now = "Sekarang";
            if (kind === "handover") {
                return {
                    ...inc, chain: [...inc.chain,
                    { from: "Supervisor Site", to: payload.target, at: now, note: payload.note }]
                };
            }
            if (kind === "note") {
                return {
                    ...inc, chain: [...inc.chain,
                    { from: "Supervisor Site", to: "Catatan", at: now, note: payload.note }]
                };
            }
            if (kind === "resolve") {
                return {
                    ...inc, state: "vendor_closed", closureKind: "vendor_resolved",
                    closedAt: now, closedBy: "Supervisor Site", windowDaysLeft: VENDOR_AUTO_CLOSE_DAYS,
                    clientCommentPending: false,
                    chain: [...inc.chain, {
                        from: "Supervisor Site", to: "Selesai",
                        at: now, note: payload.note
                    }]
                };
            }
            if (kind === "escalate") {
                return {
                    ...inc, state: "vendor_closed", closureKind: "escalated_external",
                    closedAt: now, closedBy: "Supervisor Site", windowDaysLeft: VENDOR_AUTO_CLOSE_DAYS,
                    escalationNote: payload.note, clientCommentPending: false,
                    chain: [...inc.chain, {
                        from: "Supervisor Site", to: payload.target,
                        at: now, note: payload.note
                    }]
                };
            }
            return inc;
        }));
    }

    // Aksi complaint — cermin incident, plus operan ke worker & respons komentar klien.
    // Saat ada clientCommentPending dan supervisor merespons (resolve), pending
    // dibersihkan — bola berpindah lagi ke klien (jendela baru).
    function handleComplaintAction(complaintId, kind, payload) {
        setComplaints((all) => all.map((cmp) => {
            if (cmp.id !== complaintId) return cmp;
            const now = "Sekarang";
            const self = cmp.routedTo; // supervisor yg menangani (sesuai routing)
            if (kind === "handover_worker") {
                return {
                    ...cmp, chain: [...cmp.chain,
                    { from: self, to: payload.target, at: now, note: payload.note }]
                };
            }
            if (kind === "handover_supervisor") {
                return {
                    ...cmp, chain: [...cmp.chain,
                    { from: self, to: payload.target, at: now, note: payload.note }]
                };
            }
            if (kind === "note") {
                return {
                    ...cmp, chain: [...cmp.chain,
                    { from: self, to: "Catatan", at: now, note: payload.note }]
                };
            }
            if (kind === "resolve") {
                // Tutup ke jendela klien; bersihkan pending komentar klien (kalau ada)
                return {
                    ...cmp, state: "vendor_closed", closureKind: "vendor_resolved",
                    closedAt: now, windowDaysLeft: VENDOR_AUTO_CLOSE_DAYS,
                    clientCommentPending: false,
                    chain: [...cmp.chain, { from: self, to: "Selesai", at: now, note: payload.note }]
                };
            }
            return cmp;
        }));
    }

    const title = (() => {
        if (top.view === "home") return "Beranda";
        if (top.view === "approvals") return "Kotak Approval";
        if (top.view === "sites") return "Site Saya";
        if (top.view === "presence") return SITES.find((s) => s.id === top.siteId)?.name || "Kehadiran";
        if (top.view === "patrol") return SITES.find((s) => s.id === top.siteId)?.name || "Patroli";
        if (top.view === "timeline") return "Detail Titik";
        if (top.view === "workers") return "Worker Saya";
        if (top.view === "worker_history") return WORKERS.find((w) => w.id === top.workerId)?.name || "Riwayat Worker";
        if (top.view === "worker_day") return "Detail Hari";
        if (top.view === "incidents") return "Incident";
        if (top.view === "incident_detail") return "Detail Incident";
        if (top.view === "complaints") return "Komplain Klien";
        if (top.view === "complaint_detail") return "Detail Komplain";
        return "";
    })();

    return (
        <div style={{
            minHeight: "100vh", background: "#EDEFF3", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            padding: "28px 16px 48px", display: "flex", flexDirection: "column", alignItems: "center",
        }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *::-webkit-scrollbar{width:0}`}</style>

            <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: C.ok }}>AUTSORZ</div>
                <div style={{ fontSize: 14, color: C.mute, marginTop: 2 }}>Supervisor — Approval, Kehadiran, Patroli</div>
            </div>

            <div style={{
                position: "relative", width: 390, maxWidth: "100%", background: "#F6F7F9",
                borderRadius: 30, border: "1px solid #E6E8EE", boxShadow: "0 24px 60px -20px rgba(20,30,55,0.25)",
                overflow: "hidden", display: "flex", flexDirection: "column", height: 800
            }}>
                <div style={{ height: 32, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 110, height: 22, background: C.ink, borderRadius: 14 }} />
                </div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
                    background: "#fff", borderBottom: `1px solid ${C.line}`
                }}>
                    {stack.length > 1 ? (
                        <button onClick={pop} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: C.ink, display: "flex" }}>
                            <ChevronLeft size={24} />
                        </button>
                    ) : <span style={{ width: 24 }} />}
                    <span style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>{title}</span>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: 18, position: "relative" }}>
                    {top.view === "home" && (
                        <ScreenHome approvals={requests} incidents={incidents} complaints={complaints}
                            onGo={(target) => push({ view: target })} />
                    )}
                    {top.view === "approvals" && (
                        <ScreenApprovals requests={requests}
                            onApprove={approveRequest} onReject={rejectRequest} />
                    )}
                    {top.view === "sites" && (
                        <ScreenSites
                            onOpenPresence={(siteId) => push({ view: "presence", siteId })}
                            onOpenPatrol={(siteId) => push({ view: "patrol", siteId })}
                        />
                    )}
                    {top.view === "presence" && (
                        <ScreenPresence siteId={top.siteId}
                            onOpenPatrolThisSite={() => push({ view: "patrol", siteId: top.siteId })}
                            onOpenWorkerHistory={(wid) => push({ view: "worker_history", workerId: wid })} />
                    )}
                    {top.view === "patrol" && (
                        <ScreenPatrol siteId={top.siteId} onOpenPoint={(pid) => push({ view: "timeline", pointId: pid })} />
                    )}
                    {top.view === "timeline" && <ScreenTimeline pointId={top.pointId} />}
                    {top.view === "workers" && (
                        <ScreenWorkers onOpenWorker={(wid) => push({ view: "worker_history", workerId: wid })} />
                    )}
                    {top.view === "worker_history" && (
                        <ScreenWorkerHistory workerId={top.workerId}
                            onOpenDay={(wid, date) => push({ view: "worker_day", workerId: wid, date })} />
                    )}
                    {top.view === "worker_day" && (
                        <ScreenWorkerDay workerId={top.workerId} date={top.date} />
                    )}
                    {top.view === "incidents" && (
                        <ScreenIncidents incidents={incidents}
                            onOpen={(id) => push({ view: "incident_detail", incidentId: id })} />
                    )}
                    {top.view === "incident_detail" && (
                        <ScreenIncidentDetail incidentId={top.incidentId} incidents={incidents}
                            onAction={handleIncidentAction} />
                    )}
                    {top.view === "complaints" && (
                        <ScreenComplaints complaints={complaints}
                            onOpen={(id) => push({ view: "complaint_detail", complaintId: id })} />
                    )}
                    {top.view === "complaint_detail" && (
                        <ScreenComplaintDetail complaintId={top.complaintId} complaints={complaints}
                            onAction={handleComplaintAction} />
                    )}
                </div>
            </div>
        </div>
    );
}