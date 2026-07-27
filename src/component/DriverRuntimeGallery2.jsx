// ═══════════════════════════════════════════════════════════════════════════
// DRIVER RUNTIME — PAGE GALLERY v2 (Transaction Update)
// ═══════════════════════════════════════════════════════════════════════════
// Sama seperti DriverRuntimeGallery.jsx, tapi untuk Driverruntimefull2.jsx —
// versi dengan transaksi jual/beli/tukar (tx) di item + tombol Tolak (reject
// task / load rejection) di Home locked + RejectTaskSheet.
// Frame interaktif (stepper, reveal, sheet jalan); navigasi antar page no-op.
// ═══════════════════════════════════════════════════════════════════════════
import {
    FontLoader,
    INITIAL_TASKS,
    DRIVER,
    DEVICE_OWNER,
    PENDING_CUSTODY,
    DeviceOwnerScreen,
    ScanScreen,
    PinScreen,
    HomeView,
    CustodyNotificationScreen,
    IndependentCountWorkspace,
    ConfirmationSuccessScreen,
    MismatchReportScreen,
    MismatchSubmittedScreen,
    TaskFeedScreen,
    DeliveryExecutionWorkspace,
    ReturnScreen,
    PauseConfirmSheet,
    RejectTaskSheet,
} from "./Driverruntimefull2.jsx";

const noop = () => { };

// ─── DEMO DATA VARIANTS ────────────────────────────────────────────────────
// Feed mid-route: stop 1 done, stop 4 failed, sisanya assigned
const FEED_TASKS = INITIAL_TASKS.map((t, i) =>
    i === 0
        ? {
            ...t, state: "completed", completedAt: "09:12", customerConfirmed: true,
            items: t.items.map(it => ({ ...it, actualDrop: it.planDrop, actualPickup: it.planPickup })),
        }
        : i === 3
            ? { ...t, state: "failed", completedAt: "10:05" }
            : t
);

// Semua stop kelar — buat ReturnScreen
const DONE_TASKS = INITIAL_TASKS.map(t => ({
    ...t, state: "completed", completedAt: "11:30",
    items: t.items.map(it => ({ ...it, actualDrop: it.planDrop, actualPickup: it.planPickup })),
}));

// Custody counts: match vs selisih (gas_12 kurang 1, aqua_600 lebih 1)
const COUNTS_MATCH = { gas_12: 10, gas_3: 3, aqua_galon: 8, aqua_600: 4 };
const COUNTS_MISMATCH = { gas_12: 9, gas_3: 3, aqua_galon: 8, aqua_600: 5 };

// Task tx-rich buat nunjukin jual/beli/tukar di workspace
const TASK_SALE_REFILL = INITIAL_TASKS.find(t => t.items.some(i => i.transactionType === "REFILL")) || INITIAL_TASKS[2];
const TASK_BUY = INITIAL_TASKS.find(t => t.items.some(i => i.transactionType === "PURCHASE")) || INITIAL_TASKS[3];

// ─── FRAME CHROME ──────────────────────────────────────────────────────────
const SCALE = 0.8;
const FRAME_W = 390;
const FRAME_H = 760;

const BADGE = {
    BARU: { bg: "#eef2ff", fg: "#4f46e5", label: "BARU" },
    VARIAN: { bg: "#f1f5f9", fg: "#475569", label: "VARIAN" },
    SHEET: { bg: "#f5f3ff", fg: "#6d28d9", label: "SHEET" },
    DROP: { bg: "#fef2f2", fg: "#b91c1c", label: "DROP" },
    TX: { bg: "#f0fdfa", fg: "#0f766e", label: "TX — transaksi baru" },
    REJECT: { bg: "#fffbeb", fg: "#b45309", label: "REJECT — tolak task" },
};

const Frame = ({ id, title, badge = "BARU", desc, children }) => {
    const b = BADGE[badge];
    return (
        <div style={{ width: FRAME_W * SCALE, display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                        background: "#fff", color: "#0f172a", fontWeight: 800, fontSize: 13,
                        padding: "2px 10px", borderRadius: 6,
                    }}>{id}</span>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                        background: b.bg, color: b.fg, fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.05em",
                        padding: "2px 7px", borderRadius: 4,
                    }}>{b.label}</span>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{desc}</span>
                </div>
            </div>
            <div style={{ width: FRAME_W * SCALE, height: FRAME_H * SCALE, flexShrink: 0 }}>
                <div style={{
                    width: FRAME_W, height: FRAME_H,
                    transform: `scale(${SCALE})`, transformOrigin: "top left",
                    background: "#f5f6f8", borderRadius: 28, overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.35), 0 0 0 6px #0a0a0a, 0 0 0 7px #2a2a2a",
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, sub, children }) => (
    <div style={{ marginBottom: 56 }}>
        <div style={{ marginBottom: 18, borderLeft: "3px solid #4f46e5", paddingLeft: 14 }}>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 800 }}>{title}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
            {children}
        </div>
    </div>
);

// ─── GALLERY ───────────────────────────────────────────────────────────────
export default function DriverRuntimeGallery2() {
    return (
        <>
            <FontLoader />
            <div style={{
                minHeight: "100vh", width: "100%",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                padding: "40px 36px 80px",
                boxSizing: "border-box",
            }}>
                <div style={{ marginBottom: 40 }}>
                    <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                        Consteon · Driver Runtime
                    </div>
                    <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                        Page Gallery v2 — Transaction Update
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, maxWidth: 760, lineHeight: 1.6 }}>
                        Versi <span style={{ color: "#cbd5e1" }}>Driverruntimefull2</span>: tiap item punya jenis transaksi
                        (<strong style={{ color: "#fff" }}>antar / jual / beli / tukar</strong>), plus tombol
                        <strong style={{ color: "#fff" }}> Tolak</strong> (reject task) di Home saat masih terkunci.
                        Frame interaktif; navigasi antar page sengaja dimatikan.
                    </div>
                </div>

                <Section title="Gerbang Auth" sub="Identitas dibawa kartu — scan langsung buka sesi (tanpa PIN)">
                    <Frame id="P1" title="DeviceOwnerGate" badge="BARU"
                        desc="HP masih ada sesi pemilik → wajib keluar dulu sebelum dipinjam">
                        <DeviceOwnerScreen owner={DEVICE_OWNER} onHandover={noop} />
                    </Frame>
                    <Frame id="P2" title="ScanLogin" badge="BARU"
                        desc="Scan QR kartu ID → sesi langsung kebuka (tanpa PIN)">
                        <ScanScreen onScanned={noop} />
                    </Frame>
                    <Frame id="P2b" title="ScanLogin — resume" badge="VARIAN"
                        desc="Trip di-pause → scan buat lanjut dari titik terakhir">
                        <ScanScreen onScanned={noop} resuming executorName={DRIVER.name} remaining={3} />
                    </Frame>
                    <Frame id="P3" title="PinVerify" badge="DROP"
                        desc="DI-DROP — scan tanpa PIN. Ditampilkan biar kebayang">
                        <PinScreen executor={DRIVER} onBack={noop} onSuccess={noop} />
                    </Frame>
                </Section>

                <Section title="Home" sub="Custody jadi gate. Saat terkunci, tiap stop bisa di-Tolak (load rejection)">
                    <Frame id="P4" title="DriverHome — locked + Tolak" badge="REJECT"
                        desc="custody pending → rute 🔒, tiap stop ada tombol Tolak (balik ke Admin)">
                        <HomeView
                            tasks={INITIAL_TASKS} custodyStatus="pending" custodyCounts={null}
                            onConfirmCustody={noop} onOpenFeed={noop} onLogout={noop} onReturn={noop}
                            onRejectTask={noop}
                        />
                    </Frame>
                    <Frame id="P4b" title="DriverHome — confirmed" badge="VARIAN"
                        desc="Custody beres → cargo muncul, rute kebuka, Tolak hilang">
                        <HomeView
                            tasks={FEED_TASKS} custodyStatus="confirmed" custodyCounts={COUNTS_MATCH}
                            onConfirmCustody={noop} onOpenFeed={noop} onLogout={noop} onReturn={noop}
                            onRejectTask={noop}
                        />
                    </Frame>
                </Section>

                <Section title="Custody — Konfirmasi Penerimaan Muatan" sub="Gate: hitung buta → reveal → match / lapor selisih">
                    <Frame id="P5" title="CustodyNotification" badge="BARU"
                        desc="Vehicle card + task manifest per stop + total circulation">
                        <CustodyNotificationScreen custody={PENDING_CUSTODY} onStartConfirmation={noop} onBack={noop} />
                    </Frame>
                    <Frame id="P6" title="CustodyCount" badge="BARU"
                        desc="Hitung independen (angka gudang disembunyiin) — isi semua lalu reveal">
                        <IndependentCountWorkspace custody={PENDING_CUSTODY} onBack={noop} onContinue={noop} />
                    </Frame>
                    <Frame id="P7" title="CustodySuccess" badge="BARU"
                        desc="Semua match → custody confirmed, vehicle siap berangkat">
                        <ConfirmationSuccessScreen custody={PENDING_CUSTODY} counts={COUNTS_MATCH} onProceed={noop} />
                    </Frame>
                    <Frame id="P8" title="MismatchReport" badge="BARU"
                        desc="Ada selisih → delta per item + note (min 10) + foto wajib">
                        <MismatchReportScreen custody={PENDING_CUSTODY} counts={COUNTS_MISMATCH} onBack={noop} onSubmit={noop} />
                    </Frame>
                    <Frame id="P9" title="MismatchSubmitted" badge="BARU"
                        desc="Selisih dilaporkan ke Supervisor — driver tetap jalan">
                        <MismatchSubmittedScreen custody={PENDING_CUSTODY} onDone={noop} />
                    </Frame>
                </Section>

                <Section title="Eksekusi + Transaksi" sub="Item sekarang punya jenis: antar (stepper) / jual / beli / tukar (read-only)">
                    <Frame id="P10" title="TaskFeed" badge="BARU"
                        desc="Header progress + kartu stop, grouped: berikutnya / gagal / selesai">
                        <TaskFeedScreen tasks={FEED_TASKS} onSelectTask={noop} recentlyCompletedId={null} onBack={noop} />
                    </Frame>
                    <Frame id="P11" title="DeliveryWorkspace — Jual + Tukar" badge="TX"
                        desc="Item sale (Jual) & refill (Tukar) tampil read-only, deliver tetap stepper">
                        <DeliveryExecutionWorkspace task={TASK_SALE_REFILL} onBack={noop} onSubmit={noop} />
                    </Frame>
                    <Frame id="P11b" title="DeliveryWorkspace — Beli + Jual" badge="TX"
                        desc="Item purchase (Beli, naik ke mobil) + pickup — coba submit buat lihat ringkasan">
                        <DeliveryExecutionWorkspace task={TASK_BUY} onBack={noop} onSubmit={noop} />
                    </Frame>
                </Section>

                <Section title="Reject Task (load rejection)" sub="Tolak stop yang nggak searah — sebelum berangkat, dikembalikan ke Admin">
                    <Frame id="S2" title="RejectTaskSheet" badge="SHEET"
                        desc="Alasan wajib (min 10 char) → Kembalikan ke Admin (vv dipertahankan, status load_rejected)">
                        <div style={{ height: "100%", background: "#e8eaed" }} />
                        <RejectTaskSheet task={INITIAL_TASKS[3]} onConfirm={noop} onCancel={noop} />
                    </Frame>
                </Section>

                <Section title="Closing" sub="Semua stop kelar → balik gudang, serah kendaraan + sisa muatan, sesi tutup">
                    <Frame id="P12" title="ReturnVehicle" badge="BARU"
                        desc="Sisa di kendaraan (per item isi/kosong) → Serahkan ke Gudang → logout">
                        <ReturnScreen tasks={DONE_TASKS} onBack={noop} onConfirm={noop} />
                    </Frame>
                    <Frame id="S1" title="PauseConfirmSheet" badge="SHEET"
                        desc="Keluar di tengah trip → pause sesi, lanjut via scan di device manapun">
                        <div style={{ height: "100%", background: "#e8eaed" }} />
                        <PauseConfirmSheet remaining={3} onConfirm={noop} onCancel={noop} />
                    </Frame>
                </Section>
            </div>
        </>
    );
}
