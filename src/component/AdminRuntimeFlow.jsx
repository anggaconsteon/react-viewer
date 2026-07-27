// ═══════════════════════════════════════════════════════════════════════════
// ADMIN RUNTIME — INTERACTIVE FLOW PROTOTYPE
// ═══════════════════════════════════════════════════════════════════════════
// One navigable phone. Entry = Home (H1). Routing:
//   H1 "Customer Baru" / "Order Masuk" → P1 (CustomerPicker)
//   H1 "Walk-in Customer"              → W1 (WalkInIntake)
//   P1 "+ Customer Baru"               → N1 → N2 → P2 (ItemBuilder)
//   P1 pick existing                   → P2
//   P2 → P3 (vehicle) → P4 (review) → P5 (success) → Home
//   P2 "Seed Saldo Awal" (genesis)     → S1 → S2 → S3 → back to P2
//   W1 counter → walk-in success ; W1 dikirim → P3 → P4 → P5   (W1 fix pending)
//
// OriginScreen (old O1) removed — Home is the launcher now.
// Screens are imported live from the two mockup files; this file only wires nav.
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import {
    FontLoader,
    CUSTOMERS,
    CUSTOMER_TYPES,
    CustomerPickerScreen,
    ItemBuilderScreen,
    VehicleAssignmentScreen,
    TaskSummaryScreen,
    SuccessScreen,
    WalkInIntakeScreen,
    WalkInCounterSuccess,
    NewCustomerScreen,
    NewCustomerReviewScreen,
    SeedQtyScreen,
    SeedBasisScreen,
    SeedReviewScreen,
} from "./AdminCreateTaskIntegrated.jsx";
import { AdminHomeView } from "./ConsteonAdminHomeEvolved.jsx";

const rid = () => `T-${Math.floor(Math.random() * 900) + 100}`;

export default function AdminRuntimeFlow() {
    const [step, setStep] = useState("home");
    const [customers, setCustomers] = useState(CUSTOMERS);
    const [customer, setCustomer] = useState(null);
    const [taskItems, setTaskItems] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [newData, setNewData] = useState({ name: "", type: "", address: "", pic: "" });
    const [seedItems, setSeedItems] = useState([]);
    const [basis, setBasis] = useState("");
    const [fulfillment, setFulfillment] = useState("counter_immediate");
    const [buyer, setBuyer] = useState({ name: "", address: "" });

    const genesisPending = customer?.genesisStatus === "pending";

    const reset = () => {
        setCustomer(null); setTaskItems([]); setVehicle(null); setTaskId(null);
        setNewData({ name: "", type: "", address: "", pic: "" });
        setSeedItems([]); setBasis(""); setFulfillment("counter_immediate");
        setBuyer({ name: "", address: "" });
        setStep("home");
    };

    // ── Home launcher ──────────────────────────────────────────────────────
    const navFromHome = (id) => {
        if (id === "walkin") {
            setTaskItems([]); setBuyer({ name: "", address: "" });
            setFulfillment("counter_immediate"); setCustomer(null); setVehicle(null);
            setStep("w1");
        } else {
            // "customer" (Customer Baru) & "task" (Order Masuk) → same picker
            setStep("p1");
        }
    };

    // ── Customer ───────────────────────────────────────────────────────────
    const selectCustomer = (c) => { setCustomer(c); setStep("p2"); };
    const addNew = () => { setNewData({ name: "", type: "", address: "", pic: "" }); setStep("n1"); };
    const commitNewCustomer = () => {
        const typeMeta = CUSTOMER_TYPES.find((t) => t.id === newData.type) || { icon: "🏢" };
        const created = {
            id: `C-${Math.floor(Math.random() * 900 + 100)}`,
            name: newData.name.trim(), type: newData.type,
            address: newData.address || "—", contact: "—", pic: newData.pic || "—",
            avatar: typeMeta.icon, outstanding: [], genesisStatus: "verified", source: "new_customer",
        };
        setCustomers((prev) => [created, ...prev]);
        setCustomer(created);
        setStep("p2");
    };

    // ── Seed detour (genesis pending → provisional) ──────────────────────────
    const seedNow = () => {
        setSeedItems((customer?.recordedHolding || []).map((r) => ({ ...r })));
        setBasis("");
        setStep("s1");
    };
    const commitSeed = () => {
        const seededOutstanding = seedItems.map((i) => ({ itemId: i.itemId, name: i.name, qty: i.qty, lastDate: "baru di-seed", aging: "normal" }));
        const seededMap = Object.fromEntries(seedItems.map((i) => [i.itemId, i.qty]));
        const updated = { ...customer, genesisStatus: "provisional", source: "admin_seed", transactedPreSeed: false, outstanding: seededOutstanding };
        setCustomers((prev) => prev.map((c) => (c.id === customer.id ? updated : c)));
        setCustomer(updated);
        setTaskItems((prev) => prev.map((it) => {
            if (it.type !== "returnable") return it;
            const out = seededMap[it.itemId] || 0;
            const next = { ...it, outstandingQty: out, pickupSuggested: it.drop + out };
            if (!it.pickupManuallyAdjusted) next.pickup = it.drop + out;
            return next;
        }));
        setStep("p2");
    };

    // ── Walk-in ──────────────────────────────────────────────────────────────
    const walkInProceed = () => {
        if (fulfillment === "counter_immediate") {
            setTaskId(rid());
            setStep("wsuccess");
        } else {
            setCustomer({
                id: "WALKIN", name: buyer.name.trim() || "Walk-in (Umum)", type: "walkin",
                address: buyer.address.trim() || "—", contact: "—", pic: "—", avatar: "🚶",
                outstanding: [], genesisStatus: "verified", source: "walk_in",
            });
            setStep("p3");
        }
    };

    const submit = () => { setTaskId(rid()); setStep("p5"); };

    // ── Render ───────────────────────────────────────────────────────────────
    const screen = (() => {
        switch (step) {
            case "home":
                return <AdminHomeView onNavigate={navFromHome} />;
            case "p1":
                return <CustomerPickerScreen customers={customers} onSelect={selectCustomer} onAddNew={addNew} onCancel={reset} />;
            case "n1":
                return <NewCustomerScreen data={newData} onChange={setNewData} onBack={() => setStep("p1")} onNext={() => setStep("n2")} />;
            case "n2":
                return <NewCustomerReviewScreen data={newData} onBack={() => setStep("n1")} onSubmit={commitNewCustomer} />;
            case "p2":
                return <ItemBuilderScreen customer={customer} taskItems={taskItems} onUpdate={setTaskItems} genesisPending={genesisPending} onSeedNow={seedNow} onBack={() => setStep("p1")} onNext={() => setStep("p3")} />;
            case "s1":
                return <SeedQtyScreen customer={customer} items={seedItems} onUpdate={setSeedItems} onBack={() => setStep("p2")} onNext={() => setStep("s2")} />;
            case "s2":
                return <SeedBasisScreen basis={basis} onBasis={setBasis} onBack={() => setStep("s1")} onNext={() => setStep("s3")} />;
            case "s3":
                return <SeedReviewScreen customer={customer} items={seedItems} onBack={() => setStep("s2")} onSubmit={commitSeed} />;
            case "p3":
                return <VehicleAssignmentScreen customer={customer} taskItems={taskItems} selectedVehicle={vehicle} onSelectVehicle={setVehicle} onBack={() => setStep("p2")} onNext={() => setStep("p4")} />;
            case "p4":
                return <TaskSummaryScreen customer={customer} taskItems={taskItems} vehicle={vehicle} onBack={() => setStep("p3")} onSubmit={submit} />;
            case "p5":
                return <SuccessScreen customer={customer} taskItems={taskItems} vehicle={vehicle} taskId={taskId} onCreateAnother={reset} onBackToFeed={reset} />;
            case "w1":
                return <WalkInIntakeScreen items={taskItems} onUpdate={setTaskItems} fulfillment={fulfillment} onFulfillment={setFulfillment} buyer={buyer} onBuyer={setBuyer} onBack={reset} onProceed={walkInProceed} />;
            case "wsuccess":
                return <WalkInCounterSuccess items={taskItems} buyer={buyer} taskId={taskId} onDone={reset} />;
            default:
                return <AdminHomeView onNavigate={navFromHome} />;
        }
    })();

    return (
        <>
            <FontLoader />
            <div style={{
                minHeight: "100vh", width: "100vw",
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "26px 20px", gap: 14,
            }}>
                <div style={{ textAlign: "center", color: "#cbd5e1" }}>
                    <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, opacity: 0.7 }}>Consteon · Admin Runtime</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 }}>Flow Prototype — Koordinasi</div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Home → Order / Customer Baru / Walk-in · klik buat jalanin</div>
                </div>

                <div style={{
                    width: 390, height: 800, maxHeight: "calc(100vh - 150px)",
                    background: "#f5f6f8", borderRadius: 36, overflow: "hidden", position: "relative",
                    boxShadow: "0 30px 60px rgba(0,0,0,0.4)",
                }}>
                    {screen}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "#64748b", fontSize: 11, fontFamily: "monospace" }}>step: {step}</span>
                    <button onClick={reset} style={{
                        background: "rgba(255,255,255,0.12)", color: "#cbd5e1", border: "none",
                        padding: "6px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    }}>⟲ Reset ke Home</button>
                </div>
            </div>
        </>
    );
}
