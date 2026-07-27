import React, { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════════════════════
// Consteon — Cek Outstanding Customer (Mobile)
// Projection read-only: saldo pinjaman per customer, di-breakdown per jenis aset.
// "Di Toko Ahmad berapa outstanding-nya" → pasti, per item.
// Doktrin: Outstanding = dipinjam belum kembali (custody balance), BUKAN hilang.
// Surface mandiri — dipasang di runtime yang berhak (Admin / Supervisor / Owner).
// Driver: kalau butuh, versinya di-scope ke customer yang lagi didatengi (beda surface).
// ════════════════════════════════════════════════════════════════════════════

const C = {
  bg: "#f1f5f9", surface: "#ffffff", surfaceAlt: "#f8fafc",
  border: "#e2e8f0", borderStrong: "#cbd5e1",
  text: "#0f172a", textMid: "#475569", textDim: "#94a3b8",
  slate100: "#f1f5f9", slate200: "#e2e8f0",
  atCustomer: "#8b5cf6", atCustomerBg: "#f5f3ff", atCustomer100: "#ede9fe",  // violet — outstanding
  amber700: "#b45309", amber50: "#fffbeb", amber400: "#fbbf24",
  red600: "#dc2626", red50: "#fef2f2",
};

// Identitas visual per jenis aset (bukan warna semantik runtime — cuma buat scan cepat)
const ITEM_META = {
  "Aqua Galon": { short: "Galon", icon: "💧", color: "#2563eb", bg: "#eff6ff" },
  "Gas 5.5kg":  { short: "5.5kg", icon: "🛢️", color: "#d97706", bg: "#fffbeb" },
  "Gas 12kg":   { short: "12kg",  icon: "🛢️", color: "#dc2626", bg: "#fef2f2" },
  "Gas 3kg":    { short: "3kg",   icon: "🛢️", color: "#059669", bg: "#ecfdf5" },
};
const ITEM_ORDER = ["Aqua Galon", "Gas 5.5kg", "Gas 12kg", "Gas 3kg"];

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
    * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .tap-feedback { transition: transform 0.08s ease, opacity 0.08s ease; }
    .tap-feedback:active { transform: scale(0.98); opacity: 0.92; }
    .scroll-thin::-webkit-scrollbar { width: 0; }
    .sheet-up { animation: sheetUp 0.26s cubic-bezier(0.16,1,0.3,1); }
    @keyframes sheetUp { from { transform: translateY(100%); } to { transform: none; } }
    .pop { animation: pop 0.2s ease; }
    @keyframes pop { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
  `}</style>
);

// ─── DATA (projection) ──────────────────────────────────────────────────────
const CUSTOMER_OUTSTANDING = [
  { name: "Honda Tebet", type: "Bengkel", byItem: [
      { item: "Aqua Galon", qty: 30, oldestDays: 12 },
      { item: "Gas 12kg",   qty: 12, oldestDays: 47 },
    ], discrepancyCount: 3 },
  { name: "Toko Ahmad", type: "Toko kelontong", byItem: [
      { item: "Aqua Galon", qty: 12, oldestDays: 34 },
      { item: "Gas 5.5kg",  qty: 6,  oldestDays: 20 },
      { item: "Gas 12kg",   qty: 8,  oldestDays: 87 },
    ], discrepancyCount: 1 },
  { name: "BCA Sudirman", type: "Kantor", byItem: [
      { item: "Aqua Galon", qty: 24, oldestDays: 32 },
      { item: "Gas 5.5kg",  qty: 4,  oldestDays: 9 },
    ], discrepancyCount: 1 },
  { name: "Warung Pak Slamet", type: "Warung", byItem: [
      { item: "Aqua Galon", qty: 4,  oldestDays: 72 },
      { item: "Gas 5.5kg",  qty: 10, oldestDays: 18 },
    ], discrepancyCount: 0 },
  { name: "Restoran Bintang", type: "Restoran", byItem: [
      { item: "Gas 12kg",   qty: 5,  oldestDays: 22 },
      { item: "Gas 3kg",    qty: 6,  oldestDays: 41 },
    ], discrepancyCount: 0 },
  { name: "Honda Cipete", type: "Bengkel", byItem: [
      { item: "Aqua Galon", qty: 18, oldestDays: 15 },
      { item: "Gas 12kg",   qty: 6,  oldestDays: 21 },
    ], discrepancyCount: 2 },
  { name: "Mandiri Pusat", type: "Kantor", byItem: [
      { item: "Aqua Galon", qty: 20, oldestDays: 28 },
    ], discrepancyCount: 0 },
];

const totalOf  = (c) => c.byItem.reduce((s, i) => s + i.qty, 0);
const oldestOf = (c) => Math.max(...c.byItem.map(i => i.oldestDays));
const sortItems = (byItem) => [...byItem].sort((a, b) => ITEM_ORDER.indexOf(a.item) - ITEM_ORDER.indexOf(b.item));

// ─── MINI ITEM CHIP (di kartu) ──────────────────────────────────────────────
const ItemMiniChip = ({ item, qty }) => {
  const m = ITEM_META[item] || { short: item, icon: "•", color: C.textMid, bg: C.slate100 };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4, background: m.bg,
      borderRadius: 7, padding: "3px 8px", fontSize: 11.5, fontWeight: 600, color: m.color,
    }}>
      <span style={{ fontSize: 11 }}>{m.icon}</span>
      <span>{m.short}</span>
      <span className="mono" style={{ fontWeight: 700 }}>{qty}</span>
    </div>
  );
};

// ─── CUSTOMER CARD ──────────────────────────────────────────────────────────
const CustomerCard = ({ customer, onOpen }) => {
  const total = totalOf(customer);
  const oldest = oldestOf(customer);
  const isLong = oldest > 30;
  return (
    <button onClick={() => onOpen(customer)} className="tap-feedback pop" style={{
      width: "100%", background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "13px 14px", cursor: "pointer", textAlign: "left", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{customer.name}</div>
          <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 1 }}>{customer.type}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: 19, fontWeight: 700, color: C.atCustomer, lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 9.5, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>pcs pinjam</div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 11 }}>
        {sortItems(customer.byItem).map(i => <ItemMiniChip key={i.item} item={i.item} qty={i.qty} />)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: isLong ? C.amber700 : C.textMid }}>
          {isLong ? "⚠ " : ""}tertua {oldest} hari
        </span>
        {customer.discrepancyCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: C.red600, background: C.red50, borderRadius: 6, padding: "2px 7px" }}>
            {customer.discrepancyCount} selisih
          </span>
        )}
        <span style={{ marginLeft: "auto", color: C.textDim, fontSize: 13 }}>›</span>
      </div>
    </button>
  );
};

// ─── DETAIL SHEET ───────────────────────────────────────────────────────────
const DetailSheet = ({ customer, onClose }) => {
  const total = totalOf(customer);
  const oldest = oldestOf(customer);
  return (
    <>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 20 }} />
      <div className="sheet-up" style={{
        position: "absolute", bottom: 0, left: 0, right: 0, background: C.surface,
        borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 21, maxHeight: "88%",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
          <div style={{ width: 40, height: 4, background: C.slate200, borderRadius: 2 }} />
        </div>

        {/* header */}
        <div style={{ padding: "12px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{customer.name}</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>{customer.type}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono" style={{ fontSize: 26, fontWeight: 700, color: C.atCustomer, lineHeight: 1 }}>{total}</div>
              <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>total pinjam</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 6px" }} className="scroll-thin">
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 10 }}>
            Rincian per jenis
          </div>

          {sortItems(customer.byItem).map(i => {
            const m = ITEM_META[i.item] || { short: i.item, icon: "•", color: C.textMid, bg: C.slate100 };
            const long = i.oldestDays > 30;
            return (
              <div key={i.item} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 9,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text }}>{i.item}</div>
                  <div style={{ fontSize: 11.5, color: long ? C.amber700 : C.textMid, marginTop: 2, fontWeight: long ? 600 : 400 }}>
                    {long ? "⚠ " : ""}tertua {i.oldestDays} hari nyangkut
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: m.color, lineHeight: 1 }}>{i.qty}</div>
                  <div style={{ fontSize: 9.5, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>pcs</div>
                </div>
              </div>
            );
          })}

          {customer.discrepancyCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.red50, border: `1px solid ${C.red600}22`, borderRadius: 10, padding: "10px 12px", marginTop: 4, marginBottom: 10 }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <span style={{ fontSize: 12, color: C.red600, fontWeight: 600, flex: 1 }}>
                {customer.discrepancyCount} selisih belum tuntas di customer ini
              </span>
            </div>
          )}

          {/* doktrin note */}
          <div style={{ background: C.atCustomerBg, border: `1px solid ${C.atCustomer100}`, borderRadius: 10, padding: "11px 13px", fontSize: 11, color: C.atCustomer, lineHeight: 1.5, marginBottom: 12 }}>
            <strong>Outstanding</strong> = aset yang <strong>dipinjam & belum kembali</strong> (saldo custody). Ini <strong>bukan</strong> "hilang" — status hilang cuma lewat investigasi & keputusan Supervisor.
          </div>
        </div>

        <div style={{ padding: "8px 16px 16px", borderTop: `1px solid ${C.border}` }}>
          <button onClick={onClose} className="tap-feedback" style={{
            width: "100%", background: C.text, color: "#fff", border: "none",
            padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>Tutup</button>
        </div>
      </div>
    </>
  );
};

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function CustomerOutstandingMobile() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? CUSTOMER_OUTSTANDING.filter(c => c.name.toLowerCase().includes(q)) : CUSTOMER_OUTSTANDING;
    return [...filtered].sort((a, b) => totalOf(b) - totalOf(a));
  }, [query]);

  const grandTotal = CUSTOMER_OUTSTANDING.reduce((s, c) => s + totalOf(c), 0);

  return (
    <>
      <FontLoader />
      <div style={{ minHeight: "100vh", width: "100vw", background: "linear-gradient(135deg,#1e293b,#0f172a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 20px", gap: 16 }}>
        <div style={{ color: "#cbd5e1", textAlign: "center" }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, opacity: 0.7 }}>Consteon</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 4 }}>Cek Outstanding Customer</div>
        </div>

        <div style={{ width: 390, height: 780, maxHeight: "calc(100vh - 130px)", background: C.bg, borderRadius: 36, overflow: "hidden", position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ height: 36, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", fontSize: 13, fontWeight: 600, color: C.text }}>
            <span>08:24</span><span style={{ fontSize: 11 }}>●●●●● 🔋</span>
          </div>

          <div style={{ height: "calc(100% - 36px)", position: "relative", display: "flex", flexDirection: "column" }}>
            {/* header + search */}
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px 14px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Outstanding Customer</div>
                  <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 1 }}>Saldo pinjaman per customer</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: C.atCustomer, lineHeight: 1 }}>{grandTotal}</div>
                  <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em" }}>total di luar</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.slate100, borderRadius: 11, padding: "10px 12px" }}>
                <span style={{ fontSize: 15, color: C.textDim }}>🔍</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari customer — mis. Toko Ahmad"
                  style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 13.5, color: C.text }}
                />
                {query && (
                  <button onClick={() => setQuery("")} style={{ border: "none", background: "transparent", color: C.textDim, fontSize: 15, cursor: "pointer" }}>✕</button>
                )}
              </div>
            </div>

            {/* list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 20px" }} className="scroll-thin">
              <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, marginBottom: 10 }}>
                {query ? `${list.length} ketemu` : `${list.length} customer punya outstanding`}
              </div>
              {list.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: C.textDim, fontSize: 13 }}>
                  Nggak ada customer "{query}"
                </div>
              ) : (
                list.map(c => <CustomerCard key={c.name} customer={c} onOpen={setSelected} />)
              )}
            </div>

            {selected && <DetailSheet customer={selected} onClose={() => setSelected(null)} />}
          </div>
        </div>

        <div style={{ color: "#64748b", fontSize: 11, textAlign: "center", maxWidth: 360, lineHeight: 1.5 }}>
          Surface read-only (projection). Cocok buat Admin / Supervisor / Owner. Tap customer → breakdown per jenis + umur tertua.
        </div>
      </div>
    </>
  );
}
