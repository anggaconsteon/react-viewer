// ═══════════════════════════════════════════════════════════════════════════
// DRIVER RUNTIME — PAGE GALLERY (P1 … S1)
// ═══════════════════════════════════════════════════════════════════════════
// Renders every screen of Driverruntimefull.jsx side by side in labeled phone
// frames, mapped to the page list in .claude/tasks/driver-runtime-full-pages.md.
// Frames are live components — taps inside a frame work (steppers, reveal,
// sheets); cross-page navigation callbacks are no-ops on purpose.
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
} from "./Driverruntimefull.jsx";

const noop = () => { };

// ─── DEMO DATA VARIANTS ────────────────────────────────────────────────────
// Feed mid-route: stop 1 done, stop 4 failed, 2 & 3 still assigned
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

// All stops closed — for ReturnScreen
const DONE_TASKS = INITIAL_TASKS.map(t => ({
    ...t, state: "completed", completedAt: "11:30",
    items: t.items.map(it => ({ ...it, actualDrop: it.planDrop, actualPickup: it.planPickup })),
}));

// Custody counts: matching vs mismatch (gas_12 short 1, aqua_600 extra 1)
const COUNTS_MATCH = { gas_12: 10, gas_3: 3, aqua_galon: 8, aqua_600: 4 };
const COUNTS_MISMATCH = { gas_12: 9, gas_3: 3, aqua_galon: 8, aqua_600: 5 };

// ─── FRAME CHROME ──────────────────────────────────────────────────────────
const SCALE = 0.8;
const FRAME_W = 390;
const FRAME_H = 760;

const BADGE = {
    BARU: { bg: "#eef2ff", fg: "#4f46e5", label: "BARU — page baru" },
    REUSE: { bg: "#ecfdf5", fg: "#047857", label: "REUSE — widget rows 198-203" },
    DROP: { bg: "#fef2f2", fg: "#b91c1c", label: "DROP — keluar dari scope" },
    SHEET: { bg: "#f5f3ff", fg: "#6d28d9", label: "SHEET — bottom sheet, bukan page" },
    VARIAN: { bg: "#f1f5f9", fg: "#475569", label: "VARIAN — state lain dari page yang sama" },
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
                    }}>{badge}</span>
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
export default function DriverRuntimeGallery() {
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
                        Page Gallery — P1 s/d S1
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, maxWidth: 720, lineHeight: 1.6 }}>
                        Mapping page list di task <span style={{ color: "#cbd5e1" }}>driver-runtime-full-pages</span> ke
                        screen aslinya. Frame interaktif (stepper, reveal, sheet jalan) — navigasi antar page sengaja dimatikan.
                        Keputusan 2026-06-11: flow mulai dari scanner, <strong style={{ color: "#fff" }}>tanpa PIN</strong>.
                    </div>
                </div>

                <Section title="Gerbang Auth" sub="Identitas dibawa kartu, bukan HP — scan langsung buka sesi (PIN di-drop)">
                    <Frame id="P1" title="DeviceOwnerGate" badge="BARU"
                        desc="HP masih ada sesi pemilik → wajib keluar dulu sebelum dipinjam">
                        <DeviceOwnerScreen owner={DEVICE_OWNER} onHandover={noop} />
                    </Frame>
                    <Frame id="P2" title="ScanLogin" badge="BARU"
                        desc="Scan QR kartu ID → sesi langsung kebuka (tanpa PIN)">
                        <ScanScreen onScanned={noop} />
                    </Frame>
                    <Frame id="P2b" title="ScanLogin — varian resume" badge="VARIAN"
                        desc="Trip di-pause → scan buat lanjut dari titik terakhir, device manapun">
                        <ScanScreen onScanned={noop} resuming executorName={DRIVER.name} remaining={3} />
                    </Frame>
                    <Frame id="P3" title="PinVerify" badge="DROP"
                        desc="DI-DROP per keputusan 2026-06-11 — scan tanpa PIN. Ditampilkan biar kebayang aja">
                        <PinScreen executor={DRIVER} onBack={noop} onSuccess={noop} />
                    </Frame>
                </Section>

                <Section title="Home" sub="Landing setelah login — custody jadi gate, rute kekunci sebelum konfirmasi muatan">
                    <Frame id="P4" title="DriverHome — locked" badge="BARU"
                        desc="custodyStatus=pending → card kuning Perlu Aksi, rute 🔒">
                        <HomeView
                            tasks={INITIAL_TASKS} custodyStatus="pending" custodyCounts={null}
                            onConfirmCustody={noop} onOpenFeed={noop} onLogout={noop} onReturn={noop}
                        />
                    </Frame>
                    <Frame id="P4b" title="DriverHome — confirmed" badge="VARIAN"
                        desc="Custody beres → cargo card muncul, rute kebuka, return card aktif">
                        <HomeView
                            tasks={FEED_TASKS} custodyStatus="confirmed" custodyCounts={COUNTS_MATCH}
                            onConfirmCustody={noop} onOpenFeed={noop} onLogout={noop} onReturn={noop}
                        />
                    </Frame>
                </Section>

                <Section title="Custody — Konfirmasi Penerimaan Muatan" sub="Blocking gate: hitung buta → reveal → match / lapor selisih">
                    <Frame id="P5" title="CustodyNotification" badge="BARU"
                        desc="Vehicle card + task manifest per stop + total circulation">
                        <CustodyNotificationScreen custody={PENDING_CUSTODY} onStartConfirmation={noop} onBack={noop} />
                    </Frame>
                    <Frame id="P6" title="CustodyCount" badge="BARU"
                        desc="Hitung independen (angka gudang disembunyiin) — coba isi semua lalu tap reveal">
                        <IndependentCountWorkspace custody={PENDING_CUSTODY} onBack={noop} onContinue={noop} />
                    </Frame>
                    <Frame id="P7" title="CustodySuccess" badge="BARU"
                        desc="Semua match → custody confirmed, vehicle siap berangkat">
                        <ConfirmationSuccessScreen custody={PENDING_CUSTODY} counts={COUNTS_MATCH} onProceed={noop} />
                    </Frame>
                    <Frame id="P8" title="MismatchReport" badge="BARU"
                        desc="Ada selisih → delta per item + note (min 10 char) + foto WAJIB">
                        <MismatchReportScreen custody={PENDING_CUSTODY} counts={COUNTS_MISMATCH} onBack={noop} onSubmit={noop} />
                    </Frame>
                    <Frame id="P9" title="MismatchSubmitted" badge="BARU"
                        desc="Selisih dilaporkan ke Supervisor — driver tetap jalan pakai angka aktual">
                        <MismatchSubmittedScreen custody={PENDING_CUSTODY} onDone={noop} />
                    </Frame>
                </Section>

                <Section title="Eksekusi Pengantaran" sub="REUSE — widget udah di-spec round kemarin (Widget rows 198-203)">
                    <Frame id="P10" title="TaskFeed" badge="REUSE"
                        desc="routeProgressHeader(198) + driverStopCard(199), grouped: berikutnya / gagal / selesai">
                        <TaskFeedScreen tasks={FEED_TASKS} onSelectTask={noop} recentlyCompletedId={null} onBack={noop} />
                    </Frame>
                    <Frame id="P11" title="DeliveryWorkspace" badge="REUSE"
                        desc="executionStepper(200) + itemExecutionRow(201) + submitConfirmSheet(202) + failedDeliverySheet(203) — coba submit">
                        <DeliveryExecutionWorkspace task={INITIAL_TASKS[1]} onBack={noop} onSubmit={noop} />
                    </Frame>
                </Section>

                <Section title="Closing" sub="Semua stop kelar → balik gudang, serah kendaraan + sisa muatan, sesi tutup">
                    <Frame id="P12" title="ReturnVehicle" badge="BARU"
                        desc="Sisa di kendaraan (per item isi/kosong) → Serahkan ke Gudang → logout terminal">
                        <ReturnScreen tasks={DONE_TASKS} onBack={noop} onConfirm={noop} />
                    </Frame>
                    <Frame id="S1" title="PauseConfirmSheet" badge="SHEET"
                        desc="Keluar di tengah trip → pause sesi, trip tetap idup, lanjut via scan di device manapun">
                        <div style={{ height: "100%", background: "#e8eaed" }} />
                        <PauseConfirmSheet remaining={3} onConfirm={noop} onCancel={noop} />
                    </Frame>
                </Section>
            </div>
        </>
    );
}
