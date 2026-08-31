import React, { useState } from "react";

/**
 * PREVIEW SLIP GAJI — simulasi browser murni (react-dom, tanpa module native).
 * Untuk demo alur di panel preview Claude: list → local auth → detail →
 * revisi berversi → empty state → notifikasi.
 * Kode produksi yang asli ada di SlipGaji.jsx (React Native + Expo).
 */

const C = {
    ink: "#1b2430", muted: "#6b7684", line: "#e3e7ec", brand: "#155e9c",
    brandSoft: "#e8f1f9", ok: "#1d7a4f", okSoft: "#e4f4ec",
    warnSoft: "#fdf3dc", warnInk: "#6e4e00", newSoft: "#fdeceb",
    newInk: "#c0392b", bg: "#f7f8fa",
};

const SLIPS = [
    {
        id: 3, period: "Juli 2026", issued: "5 Agu 2026", isNew: true,
        isRevision: false, offline: false, vendor: "PT Mitra Karya Sejahtera",
        rows: {
            pendapatan: [["Gaji pokok", "2.800.000"], ["Tunjangan jabatan", "150.000"], ["Uang makan (22 hari)", "440.000"], ["Lembur (12 jam)", "262.000"]],
            potongan: [["BPJS Ketenagakerjaan", "56.000"], ["BPJS Kesehatan", "28.000"], ["Kasbon", "200.000"]],
            diterima: "3.368.000", periodeFull: "1–31 JULI 2026",
        },
    },
    {
        id: 2, period: "Juni 2026", issued: "12 Jul 2026", isNew: false,
        isRevision: true, revisionNote: "pembaruan perhitungan lembur",
        offline: true, vendor: "PT Mitra Karya Sejahtera",
        rows: {
            pendapatan: [["Gaji pokok", "2.800.000"], ["Uang makan (21 hari)", "420.000"], ["Lembur (18 jam)", "393.000"]],
            potongan: [["BPJS TK + Kesehatan", "84.000"]],
            diterima: "3.529.000", periodeFull: "1–30 JUNI 2026 · REVISI 1",
        },
        previous: {
            id: 21, period: "Juni 2026 (versi lama)", issued: "5 Jul 2026",
            isNew: false, isRevision: false, superseded: true, offline: true,
            vendor: "PT Mitra Karya Sejahtera",
            rows: {
                pendapatan: [["Gaji pokok", "2.800.000"], ["Uang makan (21 hari)", "420.000"], ["Lembur (12 jam)", "262.000"]],
                potongan: [["BPJS TK + Kesehatan", "84.000"]],
                diterima: "3.398.000", periodeFull: "1–30 JUNI 2026",
            },
        },
    },
    {
        id: 1, period: "Mei 2026", issued: "5 Jun 2026", isNew: false,
        isRevision: false, offline: true, vendor: "PT Mitra Karya Sejahtera",
        rows: {
            pendapatan: [["Gaji pokok", "2.800.000"], ["Uang makan (22 hari)", "440.000"]],
            potongan: [["BPJS TK + Kesehatan", "84.000"]],
            diterima: "3.156.000", periodeFull: "1–31 MEI 2026",
        },
    },
];

export default function PreviewSlipGaji() {
    const [screen, setScreen] = useState("notif"); // mulai dari notif biar alurnya terasa
    const [slip, setSlip] = useState(null);
    const [unlocked, setUnlocked] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const [afterAuth, setAfterAuth] = useState(null);
    const [toast, setToast] = useState(null);
    const [empty, setEmpty] = useState(false);

    // masuk fitur slip gaji → cek gerbang local auth dulu
    const enter = (target, s) => {
        const doGo = () => { setScreen(target); setSlip(s || null); };
        if (unlocked) return doGo();
        setAfterAuth(() => doGo);
        setAuthOpen(true);
    };

    const authSuccess = () => {
        setUnlocked(true);
        setAuthOpen(false);
        if (afterAuth) afterAuth();
        setAfterAuth(null);
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1800);
    };

    const relock = () => {
        setUnlocked(false);
        setScreen("notif");
        setSlip(null);
        showToast("Terkunci lagi (simulasi: app di background > 2 menit)");
    };

    return (
        <div style={st.page}>
            <div style={st.controls}>
                <Pill on={screen === "notif"} onClick={() => setScreen("notif")}>1 · Notifikasi</Pill>
                <Pill on={screen === "list"} onClick={() => enter("list")}>2 · Daftar slip</Pill>
                <Pill on={empty} onClick={() => { setEmpty(!empty); enter("list"); }}>
                    {empty ? "Isi lagi daftarnya" : "3 · Coba empty state"}
                </Pill>
                <Pill onClick={relock}>🔒 Kunci ulang</Pill>
                <span style={st.lockState}>{unlocked ? "🔓 sesi terbuka" : "🔒 terkunci"}</span>
            </div>

            <div style={st.phone}>
                <div style={st.screen}>
                    <div style={st.statusbar}>
                        <span>09.41</span>
                        <span style={{ letterSpacing: 1 }}>▂▄ ·· ▮ 62%</span>
                    </div>

                    {screen === "notif" && (
                        <NotifScreen onOpen={() => enter("detail", SLIPS[0])} />
                    )}

                    {screen === "list" && (
                        <ListScreen
                            slips={empty ? [] : SLIPS}
                            onOpen={(s) => enter("detail", s)}
                        />
                    )}

                    {screen === "detail" && slip && (
                        <DetailScreen
                            slip={slip}
                            onBack={() => (slip.superseded ? enter("detail", SLIPS[1]) : enter("list"))}
                            onOldVersion={() => enter("detail", slip.previous)}
                            onAction={(a) => showToast(a + " (simulasi share sheet)")}
                        />
                    )}

                    {authOpen && (
                        <AuthOverlay
                            onSuccess={authSuccess}
                            onCancel={() => { setAuthOpen(false); setAfterAuth(null); }}
                        />
                    )}

                    {toast && <div style={st.toast}>{toast}</div>}
                </div>
            </div>

            <p style={st.caption}>
                Simulasi preview — kode produksi (React Native + expo-local-authentication)
                ada di <b>SlipGaji.jsx</b>. Tombol "Kunci ulang" meniru app yang di-background
                lebih dari 2 menit.
            </p>
        </div>
    );
}

/* ---------------- layar-layar ---------------- */

function NotifScreen({ onOpen }) {
    return (
        <div style={{ flex: 1, position: "relative" }}>
            <div style={st.notif} onClick={onOpen}>
                <div style={st.notifIc}>▤</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Slip gaji Juli 2026 sudah tersedia</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>Ketuk untuk melihat slip Anda</div>
                </div>
                <div style={{ fontSize: 10.5, color: "#a6afba" }}>sekarang</div>
            </div>
            <div style={{ ...st.emptyWrap, opacity: 0.35 }}>
                <p style={st.emptyText}>(layar apa pun yang sedang terbuka —<br />ketuk notifikasinya)</p>
            </div>
        </div>
    );
}

function ListScreen({ slips, onOpen }) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={st.appbar}>
                <h2 style={st.appbarTitle}>Slip Gaji</h2>
                <span style={st.apptag}>AUTSORZ</span>
            </div>
            {slips.length === 0 ? (
                <div style={st.emptyWrap}>
                    <div style={{ fontSize: 44, color: C.muted, marginBottom: 14 }}>▤</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 7 }}>Belum ada slip gaji</div>
                    <p style={st.emptyText}>
                        Slip gaji akan muncul di sini setelah diterbitkan oleh perusahaan Anda.
                        Anda akan menerima notifikasi saat slip tersedia.
                    </p>
                </div>
            ) : (
                <div style={st.body}>
                    <div style={st.yearLabel}>2026</div>
                    {slips.map((s) => (
                        <div key={s.id} style={st.row} onClick={() => onOpen(s)}>
                            <div style={st.docIc}>▤</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 650, display: "flex", alignItems: "center", gap: 7 }}>
                                    {s.period}
                                    {s.isNew && <Badge bg={C.newSoft} fg={C.newInk}>BARU</Badge>}
                                    {s.isRevision && <Badge bg={C.warnSoft} fg={C.warnInk}>REVISI</Badge>}
                                </div>
                                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                                    Terbit {s.issued}
                                    {s.offline && <span style={{ color: C.ok }}> · ✓ offline</span>}
                                </div>
                            </div>
                            <span style={{ fontSize: 18, color: "#b6bec8" }}>›</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function DetailScreen({ slip, onBack, onOldVersion, onAction }) {
    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={st.appbar}>
                <div style={st.back} onClick={onBack}>←</div>
                <h2 style={st.appbarTitle}>Slip Gaji · {slip.period}</h2>
            </div>
            <div style={st.body}>
                {slip.isRevision && (
                    <div style={st.revBanner}>
                        ⚠ Slip ini <b>direvisi {slip.issued}</b> oleh vendor ({slip.revisionNote}).
                        Yang berlaku adalah versi ini.{" "}
                        <span style={st.revLink} onClick={onOldVersion}>
                            Lihat versi sebelumnya
                        </span>
                    </div>
                )}
                {slip.superseded && (
                    <div style={st.revBanner}>
                        ⚠ Ini <b>versi lama</b> (terbit {slip.issued}) yang sudah digantikan revisi.
                        Disimpan sebagai jejak — bukan slip yang berlaku.
                    </div>
                )}

                <div style={st.provCard}>
                    <div style={{ fontSize: 16.5, fontWeight: 700 }}>{slip.period}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                        Diterbitkan {slip.issued} oleh {slip.vendor}
                    </div>
                    <div style={st.provNote}>
                        Dokumen ini diterbitkan oleh vendor Anda. AUTSORZ menyampaikan dokumen
                        apa adanya tanpa mengubah isinya.
                    </div>
                </div>

                <FakePdf slip={slip} />
            </div>

            <div style={{ textAlign: "center", fontSize: 11.5, color: C.ok, padding: "8px 0 2px" }}>
                ✓ Tersimpan di perangkat — bisa dibuka tanpa sinyal
            </div>
            <div style={st.actions}>
                <button style={st.btnPrimary} onClick={() => onAction("Unduh PDF")}>⬇ Unduh PDF</button>
                <button style={st.btnOutline} onClick={() => onAction("Bagikan file PDF")}>⇪ Bagikan</button>
            </div>
        </div>
    );
}

function FakePdf({ slip }) {
    const r = slip.rows;
    const sum = (rows) =>
        rows.reduce((a, [, v]) => a + parseInt(v.replace(/\./g, ""), 10), 0)
            .toLocaleString("id-ID").replace(/,/g, ".");
    return (
        <div style={st.pdf}>
            <div style={st.kop}>
                <div style={{ fontWeight: 800, fontSize: 13.5, letterSpacing: ".03em" }}>
                    {slip.vendor.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    SLIP GAJI KARYAWAN — PERIODE {r.periodeFull}
                </div>
            </div>
            <IdRow k="Nama" v="Budi Santoso" bold />
            <IdRow k="VID" v="VID-08127" />
            <IdRow k="Penempatan" v="Pabrik SGrS — Cikarang" />
            <IdRow k="Jabatan" v="Security" />

            <Sect>PENDAPATAN</Sect>
            {r.pendapatan.map(([k, v]) => <Ln key={k} k={k} v={"Rp " + v} />)}
            <Ln k="Total pendapatan" v={"Rp " + sum(r.pendapatan)} total />

            <Sect>POTONGAN</Sect>
            {r.potongan.map(([k, v]) => <Ln key={k} k={k} v={"Rp " + v} />)}
            <Ln k="Total potongan" v={"Rp " + sum(r.potongan)} total />

            <div style={st.grand}>
                <span>DITERIMA</span>
                <span>Rp {r.diterima}</span>
            </div>
            <div style={st.pdfFoot}>
                Diterbitkan oleh {slip.vendor} melalui AUTSORZ · {slip.issued}
                <br />Dokumen sah tanpa tanda tangan basah.
            </div>
        </div>
    );
}

function AuthOverlay({ onSuccess, onCancel }) {
    return (
        <div style={st.overlay}>
            <div style={st.authCard}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>☝</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 5 }}>Buka Slip Gaji</div>
                <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>
                    Gunakan sidik jari, wajah, atau PIN HP Anda.
                    <br />
                    <span style={{ fontSize: 11 }}>
                        (HP tanpa kunci layar → gerbang ini otomatis dilewati)
                    </span>
                </div>
                <button style={{ ...st.btnPrimary, width: "100%" }} onClick={onSuccess}>
                    Sentuh sensor — simulasi berhasil
                </button>
                <button style={{ ...st.btnGhost, width: "100%", marginTop: 8 }} onClick={onCancel}>
                    Batal
                </button>
            </div>
        </div>
    );
}

/* ---------------- atom kecil ---------------- */

const Pill = ({ on, onClick, children }) => (
    <button style={{ ...st.pill, ...(on ? st.pillOn : {}) }} onClick={onClick}>{children}</button>
);
const Badge = ({ bg, fg, children }) => (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2.5px 8px", borderRadius: 999, background: bg, color: fg }}>{children}</span>
);
const IdRow = ({ k, v, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 3 }}>
        <span style={{ color: C.muted }}>{k}</span>
        <span style={{ fontWeight: bold ? 700 : 400 }}>{v}</span>
    </div>
);
const Sect = ({ children }) => (
    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".07em", color: C.muted, margin: "11px 0 5px" }}>{children}</div>
);
const Ln = ({ k, v, total }) => (
    <div style={{
        display: "flex", justifyContent: "space-between", padding: "3.5px 0", fontSize: 12,
        ...(total ? { borderTop: `1px solid ${C.line}`, marginTop: 5, paddingTop: 6, fontWeight: 700 } : {}),
    }}>
        <span>{k}</span><span>{v}</span>
    </div>
);

/* ---------------- styles ---------------- */

const st = {
    page: { fontFamily: "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", background: "#f1f3f6", minHeight: "100vh", padding: "24px 12px 40px", display: "flex", flexDirection: "column", alignItems: "center", color: C.ink },
    controls: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginBottom: 18, maxWidth: 420 },
    pill: { border: `1px solid ${C.line}`, background: "#fff", borderRadius: 999, padding: "7px 13px", fontSize: 12.5, cursor: "pointer", color: C.muted },
    pillOn: { background: C.brand, borderColor: C.brand, color: "#fff" },
    lockState: { fontSize: 12, color: C.muted },
    phone: { width: 375, background: "#0d1117", borderRadius: 38, padding: 10, boxShadow: "0 18px 45px rgba(15,25,40,.22)" },
    screen: { background: C.bg, borderRadius: 30, overflow: "hidden", height: 700, display: "flex", flexDirection: "column", position: "relative" },
    statusbar: { height: 34, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", fontSize: 12, color: "#3c4652", flex: "none" },
    appbar: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px 12px", flex: "none" },
    appbarTitle: { fontSize: 17, fontWeight: 700, margin: 0 },
    apptag: { marginLeft: "auto", fontSize: 10.5, color: C.muted, background: "#fff", border: `1px solid ${C.line}`, padding: "3px 8px", borderRadius: 6 },
    back: { width: 34, height: 34, borderRadius: "50%", background: "#fff", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, cursor: "pointer" },
    body: { flex: 1, overflowY: "auto", padding: "4px 14px 20px" },
    yearLabel: { fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: ".06em", margin: "10px 4px 8px" },
    row: { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 12, marginBottom: 10, cursor: "pointer" },
    docIc: { width: 42, height: 42, borderRadius: 11, background: C.brandSoft, color: C.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flex: "none" },
    revBanner: { background: C.warnSoft, border: "1px solid #eeddb0", color: C.warnInk, fontSize: 12.5, borderRadius: 12, padding: "10px 12px", marginBottom: 10, lineHeight: 1.5 },
    revLink: { fontWeight: 700, textDecoration: "underline", cursor: "pointer" },
    provCard: { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "13px 14px", marginBottom: 10 },
    provNote: { fontSize: 11.5, color: C.muted, background: "#f2f5f8", borderRadius: 8, padding: "7px 10px", marginTop: 9, lineHeight: 1.45 },
    pdf: { background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 15px", fontSize: 12.5, boxShadow: "0 2px 8px rgba(20,30,45,.05)" },
    kop: { textAlign: "center", borderBottom: `2px solid ${C.ink}`, paddingBottom: 9, marginBottom: 11 },
    grand: { display: "flex", justifyContent: "space-between", background: C.brandSoft, borderRadius: 9, padding: "9px 11px", marginTop: 12, fontWeight: 800, fontSize: 13.5, color: C.brand },
    pdfFoot: { fontSize: 9.5, color: "#9aa4af", marginTop: 12, textAlign: "center", lineHeight: 1.5 },
    actions: { display: "flex", gap: 10, padding: "12px 14px 18px", borderTop: `1px solid ${C.line}`, flex: "none" },
    btnPrimary: { flex: 1, border: "none", borderRadius: 13, padding: "13px 0", fontSize: 14.5, fontWeight: 700, cursor: "pointer", background: C.brand, color: "#fff" },
    btnOutline: { flex: 1, borderRadius: 13, padding: "13px 0", fontSize: 14.5, fontWeight: 700, cursor: "pointer", background: "#fff", color: C.brand, border: `1.5px solid ${C.brand}` },
    btnGhost: { border: "none", background: "transparent", color: C.muted, fontSize: 13.5, cursor: "pointer", padding: "10px 0" },
    overlay: { position: "absolute", inset: 0, background: "rgba(13,17,23,.45)", display: "flex", alignItems: "flex-end", zIndex: 10 },
    authCard: { background: "#fff", borderRadius: "22px 22px 30px 30px", margin: 8, marginTop: "auto", padding: "22px 20px", textAlign: "center", width: "calc(100% - 16px)", boxSizing: "border-box" },
    notif: { position: "absolute", top: 44, left: 12, right: 12, background: "rgba(255,255,255,.97)", borderRadius: 16, padding: "12px 14px", boxShadow: "0 10px 28px rgba(15,25,40,.25)", display: "flex", gap: 11, alignItems: "flex-start", cursor: "pointer", zIndex: 5 },
    notifIc: { width: 34, height: 34, borderRadius: 9, background: C.brand, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flex: "none" },
    emptyWrap: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 34px", height: "100%" },
    emptyText: { fontSize: 13, color: C.muted, lineHeight: 1.6 },
    toast: { position: "absolute", bottom: 92, left: "50%", transform: "translateX(-50%)", background: "rgba(13,17,23,.88)", color: "#fff", fontSize: 12, padding: "9px 14px", borderRadius: 999, whiteSpace: "nowrap", zIndex: 20 },
    caption: { fontSize: 12.5, color: C.muted, maxWidth: 400, textAlign: "center", lineHeight: 1.55, marginTop: 16 },
};