// ═══════════════════════════════════════════════════════════════════════════
// ADMIN RUNTIME — PAGE GALLERY v2 (Walk-in POS)
// ═══════════════════════════════════════════════════════════════════════════
// Sama seperti AdminRuntimeGallery, tapi import dari AdminCreateTaskIntegrated2.jsx —
// versi final dengan Walk-in Counter = POS: harga per-baris, bayar (tunai/transfer),
// Nota Penjualan thermal 80mm + cetak. Sisanya identik dgn v1.
// Frame interaktif; navigasi antar page no-op.
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import {
    FontLoader,
    CUSTOMERS,
    VEHICLES,
    CustomerPickerScreen,
    ItemBuilderScreen,
    VehicleAssignmentScreen,
    TaskSummaryScreen,
    SuccessScreen,
    WalkInIntakeScreen,
    WalkInCounterSuccess,
    ReassignSheet,
    NewCustomerScreen,
    NewCustomerReviewScreen,
    SeedQtyScreen,
    SeedBasisScreen,
    SeedReviewScreen,
    ProductPickerSheet,
    TransferKepemilikanSheet,
} from "./AdminCreateTaskIntegrated2.jsx";
import { AdminHomeView } from "./ConsteonAdminHomeEvolved.jsx";

const noop = () => { };

// ─── DEMO DATA ───────────────────────────────────────────────────────────────
const CUST_NORMAL = CUSTOMERS.find(c => c.id === "C-001");                 // Honda Bintaro — outstanding 3 Gas 12kg
const CUST_GENESIS = CUSTOMERS.find(c => c.genesisStatus === "pending");   // Toko Sumber Rejeki — belum di-seed
const VEH = VEHICLES[0];

const ITEMS_MODELB = [
    { itemId: "gas_12", name: "Gas 12kg", type: "returnable", icon: "🔥", transactionType: "LOAN", drop: 3, pickup: 6, pickupSuggested: 6, outstandingQty: 3, pickupManuallyAdjusted: false },
];

const ITEMS_TX = [
    { itemId: "gas_12", name: "Gas 12kg", type: "returnable", icon: "🔥", transactionType: "LOAN", drop: 3, pickup: 6, pickupSuggested: 6, outstandingQty: 3, pickupManuallyAdjusted: false },
    { itemId: "gas_3", name: "Gas 3kg", type: "returnable", icon: "🔥", transactionType: "SALE", drop: 2, pickup: 0, condition: "full" },
    { itemId: "aqua_galon", name: "Aqua Galon", type: "returnable", icon: "💧", category: "Water", transactionType: "REFILL", refillQty: 4, waterType: "ro", drop: 0, pickup: 0 },
];

// Walk-in counter sale — harga (v2 POS) buat render nota
const WALKIN_ITEMS = [
    { itemId: "aqua_600", name: "Aqua 600ml (Dus)", icon: "💧", type: "consumable", transactionType: "SALE", drop: 5, harga: 48000 },
    { itemId: "gas_3", name: "Gas 3kg", icon: "🔥", type: "consumable", transactionType: "SALE", drop: 2, harga: 22000 },
];

const NEW_DATA = { name: "Kopi Kenangan Bintaro", type: "horeca", address: "Jl. Bintaro Utama 9", pic: "Mas Eko · 081200001111" };

const RETURNED = [
    { id: "T-053", customer: "Toko Sumber Rejeki", fromVehicle: "B 1234 XY", driver: "Budi Santoso", reason: "Arah berlawanan dari rute, kejauhan dari titik lain" },
];

// ─── LIVE WRAPPERS (parent-controlled screens → local state) ──────────────────
function ItemBuilderLive({ customer, seed = [], genesisPending = false }) {
    const [items, setItems] = useState(seed);
    return (
        <ItemBuilderScreen
            customer={customer} taskItems={items} onUpdate={setItems}
            genesisPending={genesisPending} onSeedNow={noop} onBack={noop} onNext={noop}
        />
    );
}
function VehicleLive({ customer, taskItems }) {
    const [v, setV] = useState(null);
    return (
        <VehicleAssignmentScreen
            customer={customer} taskItems={taskItems} selectedVehicle={v}
            onSelectVehicle={setV} onBack={noop} onNext={noop}
        />
    );
}
function WalkInLive({ initialFulfillment = "counter_immediate" }) {
    const [items, setItems] = useState([]);
    const [fulfillment, setFulfillment] = useState(initialFulfillment);
    const [buyer, setBuyer] = useState({ name: "", address: "" });
    return (
        <WalkInIntakeScreen
            items={items} onUpdate={setItems}
            fulfillment={fulfillment} onFulfillment={setFulfillment}
            buyer={buyer} onBuyer={setBuyer} onBack={noop} onProceed={noop}
        />
    );
}
function NewCustomerLive() {
    const [data, setData] = useState({ name: "", type: "", address: "", pic: "" });
    return <NewCustomerScreen data={data} onChange={setData} onBack={noop} onNext={noop} />;
}
function SeedQtyLive({ customer }) {
    const [items, setItems] = useState((customer?.recordedHolding || []).map(r => ({ ...r })));
    return <SeedQtyScreen customer={customer} items={items} onUpdate={setItems} onBack={noop} onNext={noop} />;
}
function SeedBasisLive() {
    const [basis, setBasis] = useState("");
    return <SeedBasisScreen basis={basis} onBasis={setBasis} onBack={noop} onNext={noop} />;
}

// ─── FRAME CHROME ──────────────────────────────────────────────────────────
const SCALE = 0.8;
const FRAME_W = 390;
const FRAME_H = 760;
const ACCENT = "#2563eb";

const BADGE = {
    HOME: { bg: "#eff6ff", fg: "#2563eb", label: "HOME" },
    BARU: { bg: "#eff6ff", fg: "#2563eb", label: "BARU" },
    VARIAN: { bg: "#f1f5f9", fg: "#475569", label: "VARIAN" },
    SHEET: { bg: "#f5f3ff", fg: "#6d28d9", label: "SHEET" },
    DETOUR: { bg: "#fffbeb", fg: "#b45309", label: "DETOUR" },
    POS: { bg: "#f0fdfa", fg: "#0f766e", label: "POS — harga/nota" },
};

const Frame = ({ id, title, badge = "BARU", desc, children }) => {
    const b = BADGE[badge];
    return (
        <div style={{ width: FRAME_W * SCALE, display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ background: "#fff", color: "#0f172a", fontWeight: 800, fontSize: 13, padding: "2px 10px", borderRadius: 6 }}>{id}</span>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{title}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ background: b.bg, color: b.fg, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 4 }}>{b.label}</span>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{desc}</span>
                </div>
            </div>
            <div style={{ width: FRAME_W * SCALE, height: FRAME_H * SCALE, flexShrink: 0 }}>
                <div style={{
                    width: FRAME_W, height: FRAME_H,
                    transform: `scale(${SCALE})`, transformOrigin: "top left",
                    background: "#f5f6f8", borderRadius: 28, overflow: "hidden", position: "relative",
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

const SheetBg = () => <div style={{ height: "100%", background: "#e8eaed" }} />;

// ─── GALLERY ───────────────────────────────────────────────────────────────
export default function AdminRuntimeGallery2() {
    return (
        <>
            <FontLoader />
            <div style={{
                minHeight: "100vh", width: "100%",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                padding: "40px 36px 80px", boxSizing: "border-box",
            }}>
                <div style={{ marginBottom: 40 }}>
                    <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
                        Consteon · Admin Runtime
                    </div>
                    <div style={{ color: "#fff", fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                        Page Gallery v2 — Walk-in POS
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, maxWidth: 820, lineHeight: 1.6 }}>
                        Versi final (<span style={{ color: "#cbd5e1" }}>AdminCreateTaskIntegrated2</span>): Walk-in Counter jadi
                        <strong style={{ color: "#fff" }}> POS</strong> — harga per-baris (default katalog, bisa di-override),
                        bayar <strong style={{ color: "#fff" }}>tunai/transfer (LUNAS)</strong>, dan
                        <strong style={{ color: "#fff" }}> Nota Penjualan</strong> thermal 80mm yang bisa dicetak.
                        Sisanya identik dgn v1. Frame interaktif; navigasi antar page sengaja dimatikan.
                    </div>
                </div>

                <Section title="Beranda · Koordinasi" sub="Triage: sinyal mandek diklaster & diurut umur, quick actions, berjalan / akan datang, outstanding. Tombol = pintu masuk ke Create Task.">
                    <Frame id="H1" title="AdminHome" badge="HOME"
                        desc="Perlu Tindakan (cluster) + nudge seed + quick actions + outstanding panel · sheet live">
                        <AdminHomeView />
                    </Frame>
                </Section>

                <Section title="Task Terencana — 4 Langkah" sub="Customer → Item (Model B) → Kendaraan → Review → Sukses">
                    <Frame id="P1" title="CustomerPicker" badge="BARU"
                        desc="Step 1/4 · search + badge outstanding / belum-di-seed · + Customer Baru">
                        <CustomerPickerScreen customers={CUSTOMERS} onSelect={noop} onAddNew={noop} onCancel={noop} />
                    </Frame>
                    <Frame id="P2" title="ItemBuilder — kosong" badge="BARU"
                        desc="Step 2/4 · empty state → tambah item / transfer kepemilikan / refill">
                        <ItemBuilderLive customer={CUST_NORMAL} />
                    </Frame>
                    <Frame id="P2b" title="ItemBuilder — Model B" badge="VARIAN"
                        desc="Returnable: pickup = drop + outstanding (auto), banner outstanding customer">
                        <ItemBuilderLive customer={CUST_NORMAL} seed={ITEMS_MODELB} />
                    </Frame>
                    <Frame id="P2c" title="ItemBuilder — belum di-seed" badge="DETOUR"
                        desc="Genesis pending → saran pickup off + tombol Seed Saldo Awal">
                        <ItemBuilderLive customer={CUST_GENESIS} genesisPending />
                    </Frame>
                    <Frame id="P3" title="VehicleAssignment" badge="BARU"
                        desc="Step 3/4 · anchor ke KENDARAAN (recon container), bukan orang. Ad-hoc tersedia">
                        <VehicleLive customer={CUST_NORMAL} taskItems={ITEMS_MODELB} />
                    </Frame>
                    <Frame id="P4" title="TaskSummary" badge="VARIAN"
                        desc="Step 4/4 · antar+jual+tukar, pickup breakdown = exchange + clearing">
                        <TaskSummaryScreen customer={CUST_NORMAL} taskItems={ITEMS_TX} vehicle={VEH} onBack={noop} onSubmit={noop} />
                    </Frame>
                    <Frame id="P5" title="SuccessScreen" badge="BARU"
                        desc="Task assigned → Nunggu Loading · langkah berikutnya dijelasin">
                        <SuccessScreen customer={CUST_NORMAL} taskItems={ITEMS_MODELB} vehicle={VEH} taskId="T-0481" onCreateAnother={noop} onBackToFeed={noop} />
                    </Frame>
                </Section>

                <Section title="Walk-in · Counter (POS)" sub="Consumable sale + refill, BERHARGA. Dibawa langsung (nota + bayar di counter) atau dikirim (jadi delivery task).">
                    <Frame id="W1" title="WalkInIntake — counter" badge="POS"
                        desc="Harga per-baris (default katalog, override-able) · total Rp · pembeli opsional">
                        <WalkInLive initialFulfillment="counter_immediate" />
                    </Frame>
                    <Frame id="W2" title="WalkInIntake — dikirim" badge="VARIAN"
                        desc="Dikirim → field alamat muncul, lanjut ke pilih kendaraan">
                        <WalkInLive initialFulfillment="delivery" />
                    </Frame>
                    <Frame id="W3" title="WalkInCounterSuccess — Nota" badge="POS"
                        desc="Nota Penjualan 80mm · tunai/transfer · LUNAS · Cetak Nota (printBluetooth)">
                        <WalkInCounterSuccess items={WALKIN_ITEMS} buyer={{ name: "Umum", address: "" }} taskId="T-0322" onDone={noop} />
                    </Frame>
                </Section>

                <Section title="Detour · Customer Baru" sub="Onboard cepat dari Customer Picker → genesis qty 0 (verified) → balik ke Item Builder.">
                    <Frame id="N1" title="NewCustomer — data" badge="DETOUR"
                        desc="Nama + tipe (korporat/horeca/retail/rumah) + alamat + PIC">
                        <NewCustomerLive />
                    </Frame>
                    <Frame id="N2" title="NewCustomer — review" badge="DETOUR"
                        desc="Konfirmasi → create dengan outstanding kosong (qty 0)">
                        <NewCustomerReviewScreen data={NEW_DATA} onBack={noop} onSubmit={noop} />
                    </Frame>
                </Section>

                <Section title="Detour · Seed Saldo Awal" sub="Customer migrasi (belum di-seed) → catat opening balance. pending → provisional, Model B nyala.">
                    <Frame id="S1" title="SeedQty — saldo" badge="DETOUR"
                        desc="Per kategori returnable · prefill dari catatan lama (recordedHolding)">
                        <SeedQtyLive customer={CUST_GENESIS} />
                    </Frame>
                    <Frame id="S2" title="SeedBasis — catatan" badge="DETOUR"
                        desc="Basis + occurred_at anchor (kapan saldo ini berlaku)">
                        <SeedBasisLive />
                    </Frame>
                    <Frame id="S3" title="SeedReview — emit" badge="DETOUR"
                        desc="Review → emit GENESIS movement → balik ke Item Builder">
                        <SeedReviewScreen customer={CUST_GENESIS} items={(CUST_GENESIS.recordedHolding || []).map(r => ({ ...r }))} onBack={noop} onSubmit={noop} />
                    </Frame>
                </Section>

                <Section title="Sheets" sub="Overlay picker yang muncul di atas layar.">
                    <Frame id="X1" title="ReassignSheet" badge="SHEET"
                        desc="Task dikembalikan → pilih kendaraan lain (exclude fromVehicle)">
                        <SheetBg />
                        <ReassignSheet task={RETURNED[0]} onConfirm={noop} onCancel={noop} />
                    </Frame>
                    <Frame id="X2" title="ProductPickerSheet" badge="SHEET"
                        desc="Tambah item ke task · tandai produk yang punya outstanding">
                        <SheetBg />
                        <ProductPickerSheet itemsInTask={[]} customerOutstanding={CUST_NORMAL.outstanding} onSelect={noop} onCancel={noop} />
                    </Frame>
                    <Frame id="X3" title="TransferKepemilikanSheet" badge="SHEET"
                        desc="Jual / Beli → pilih kategori returnable (transfer kepemilikan)">
                        <SheetBg />
                        <TransferKepemilikanSheet inTask={[]} onSelect={noop} onCancel={noop} />
                    </Frame>
                </Section>
            </div>
        </>
    );
}
