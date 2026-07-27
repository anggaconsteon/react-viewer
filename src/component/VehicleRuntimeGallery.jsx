// ═══════════════════════════════════════════════════════════════════════════
// VEHICLE RUNTIME — PAGE GALLERY
// ═══════════════════════════════════════════════════════════════════════════
// Renders every screen of Vehicleruntimemobile.jsx side by side in labeled phone
// frames. Mirror of DriverRuntimeGallery — same chrome, teal (vehicle) accent.
// Frames are live: steppers, executor picker, submit sheets all work inside the
// frame; cross-screen navigation callbacks are no-ops on purpose.
// ═══════════════════════════════════════════════════════════════════════════
import {
    FontLoader,
    VEHICLES,
    VehicleFeedScreen,
    OpeningCheckWorkspace,
    ClosingCheckWorkspace,
    ExecutorPickerSheet,
    PostSubmitScreen,
} from "./Vehicleruntimemobile.jsx";

const noop = () => { };

// ─── DEMO DATA VARIANTS ────────────────────────────────────────────────────
const V_OPENING = VEHICLES.find(v => v.state === "loading");     // V-003 · executor belum ditentukan
const V_CLOSING = VEHICLES.find(v => v.state === "returning");   // V-007 · returnable + consumable + loadOrigin

// Closing counts: clean (semua match) vs discrepancy (gas_12 kurang 2, aqua_600 lebih 1)
const COUNTS_CLEAN = { gas_12: 12, gas_3: 8, aqua_galon: 4, aqua_600: 5 };
const COUNTS_DISCREPANCY = { gas_12: 10, gas_3: 8, aqua_galon: 4, aqua_600: 6 };

// ─── FRAME CHROME ──────────────────────────────────────────────────────────
const SCALE = 0.8;
const FRAME_W = 390;
const FRAME_H = 760;
const ACCENT = "#0d9488";   // vehicle teal

const BADGE = {
    BARU: { bg: "#f0fdfa", fg: "#0d9488", label: "BARU" },
    VARIAN: { bg: "#f1f5f9", fg: "#475569", label: "VARIAN" },
    SHEET: { bg: "#f5f3ff", fg: "#6d28d9", label: "SHEET" },
    AKSI: { bg: "#fffbeb", fg: "#b45309", label: "AKSI — perlu tindakan" },
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
        <div style={{ marginBottom: 18, borderLeft: `3px solid ${ACCENT}`, paddingLeft: 14 }}>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 800 }}>{title}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "flex-start" }}>
            {children}
        </div>
    </div>
);

// ─── GALLERY ───────────────────────────────────────────────────────────────
export default function VehicleRuntimeGallery() {
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
                        Consteon · Vehicle Runtime
                    </div>
                    <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                        Page Gallery — Reconciliation & Custody Validation
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, maxWidth: 760, lineHeight: 1.6 }}>
                        Tiap screen <span style={{ color: "#cbd5e1" }}>Vehicleruntimemobile</span> ditampilkan berdampingan.
                        Checker berdiri di samping kendaraan: <strong style={{ color: "#fff" }}>opening check</strong> (verify muat vs plan,
                        tentukan pengemudi) dan <strong style={{ color: "#fff" }}>closing check</strong> (hitung sisa, deteksi selisih).
                        Frame interaktif — stepper, executor picker, submit sheet jalan; navigasi antar screen sengaja dimatikan.
                    </div>
                </div>

                <Section title="Beranda" sub="Feed kendaraan hari ini — dikelompokkan per tier: perlu tindakan / opening / in-route / selesai">
                    <Frame id="H1" title="VehicleFeed" badge="BARU"
                        desc="Snapshot harian + kartu kendaraan, tombol aksi sesuai state (closing / custody / opening)">
                        <VehicleFeedScreen vehicles={VEHICLES} onSelectVehicle={noop} onOpenMenu={noop} />
                    </Frame>
                </Section>

                <Section title="Opening Check — Pengecekan Pembukaan" sub="Sebelum berangkat: verify fisik vs plan, tentukan pengemudi (custodian)">
                    <Frame id="O1" title="OpeningCheckWorkspace" badge="AKSI"
                        desc="V-003 · executor belum ditentukan → ExecutorCard 'Tentukan', stepper returnable + consumable">
                        <OpeningCheckWorkspace vehicle={V_OPENING} onBack={noop} onSubmit={noop} />
                    </Frame>
                    <Frame id="O2" title="ExecutorPickerSheet" badge="SHEET"
                        desc="Pilih pengemudi/ad-hoc yang available — designation di-surface ke Admin">
                        <div style={{ height: "100%", background: "#e8eaed" }} />
                        <ExecutorPickerSheet current={null} onSelect={noop} onCancel={noop} />
                    </Frame>
                </Section>

                <Section title="Closing Check — Pengecekan Penutupan" sub="Kendaraan balik: hitung sisa muatan aktual, deteksi discrepancy (validation ≠ resolution)">
                    <Frame id="C1" title="ClosingCheckWorkspace" badge="AKSI"
                        desc="V-007 · ekspektasi dari server, hitung aktual returnable + consumable, catatan checker">
                        <ClosingCheckWorkspace vehicle={V_CLOSING} onBack={noop} onSubmit={noop} onEscalate={noop} />
                    </Frame>
                </Section>

                <Section title="Hasil — Post-Submit" sub="Outcome closing check: clean validation atau discrepancy yang dieskalasi ke supervisor">
                    <Frame id="R1" title="PostSubmit — Clean" badge="VARIAN"
                        desc="Semua kategori match → validated_clean, tombol Selesai">
                        <PostSubmitScreen vehicle={V_CLOSING} items={V_CLOSING.items} counts={COUNTS_CLEAN} onEscalate={noop} onDone={noop} />
                    </Frame>
                    <Frame id="R2" title="PostSubmit — Discrepancy" badge="VARIAN"
                        desc="Ada selisih (shortage/surplus per item) → tombol Eskalasi ke Supervisor">
                        <PostSubmitScreen vehicle={V_CLOSING} items={V_CLOSING.items} counts={COUNTS_DISCREPANCY} onEscalate={noop} onDone={noop} />
                    </Frame>
                </Section>
            </div>
        </>
    );
}
