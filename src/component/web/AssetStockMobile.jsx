import React, { useState, useMemo } from "react";

// ════════════════════════════════════════════════════════════════════════════
// Consteon — Stok & Sebaran Aset (Mobile)
// Full picture: tiap jenis aset ada di mana (Gudang / Mobil / Customer),
// dan kondisinya (Isi / Kosong). Jawab: "galon Aqua kosong di gudang berapa".
// Projection read-only, dibaca dari stock_cache (derived, ditulis Cloud Functions).
// CATATAN: komposisi Isi/Kosong dari waktu ke waktu = derivasi yang masih deferred
// di Refill Doctrine — angka di sini ilustratif sampai derivasi dikunci.
// Bukan Bucket 3 (reorder / inbound supplier) — ini cuma foto stok saat ini.
// ════════════════════════════════════════════════════════════════════════════

const C = {
  bg: "#f1f5f9", surface: "#ffffff", surfaceAlt: "#f8fafc",
  border: "#e2e8f0", borderStrong: "#cbd5e1",
  text: "#0f172a", textMid: "#475569", textDim: "#94a3b8",
  slate100: "#f1f5f9", slate200: "#e2e8f0",
  gudang: "#475569", gudangBg: "#f1f5f9",       // slate — di gudang
  mobil: "#4f46e5",  mobilBg: "#eef2ff",         // indigo — di mobil (custody on-vehicle)
  customer: "#8b5cf6", customerBg: "#f5f3ff",    // violet — di customer (outstanding)
  isi: "#059669", isiBg: "#ecfdf5",              // emerald — isi
  kosong: "#d97706", kosongBg: "#fffbeb",        // amber — kosong (yang diperhatiin)
};

const ITEM_META = {
  "Aqua Galon": { icon: "💧" },
  "Gas 12kg":   { icon: "🛢️" },
  "Gas 5.5kg":  { icon: "🛢️" },
  "Gas 3kg":    { icon: "🛢️" },
};

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
    * { font-family: 'Inter', -apple-system, sans-serif; box-sizing: border-box; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .tap-feedback { transition: transform 0.08s ease, opacity 0.08s ease; }
    .tap-feedback:active { transform: scale(0.98); opacity: 0.92; }
    .scroll-thin::-webkit-scrollbar { width: 0; }
    .pop { animation: pop 0.22s ease; }
    @keyframes pop { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
  `}</style>
);

// ─── DATA (projection · stock_cache) ────────────────────────────────────────
const ASSET_STOCK = [
  { item: "Aqua Galon", warehouse: { full: 160, empty: 85 }, vehicle: { full: 30, empty: 15 }, customer: 190 },
  { item: "Gas 12kg",   warehouse: { full: 60,  empty: 40 }, vehicle: { full: 12, empty: 6 },  customer: 80 },
  { item: "Gas 5.5kg",  warehouse: { full: 45,  empty: 30 }, vehicle: { full: 8,  empty: 4 },  customer: 40 },
  { item: "Gas 3kg",    warehouse: { full: 35,  empty: 20 }, vehicle: { full: 6,  empty: 2 },  customer: 24 },
];

const whTotal  = (a) => a.warehouse.full + a.warehouse.empty;
const vhTotal  = (a) => a.vehicle.full + a.vehicle.empty;
const allTotal = (a) => whTotal(a) + vhTotal(a) + a.customer;

const LOC = {
  all:      { label: "Semua",    icon: "▦" },
  warehouse:{ label: "Gudang",   icon: "🏠", color: C.gudang,   bg: C.gudangBg },
  vehicle:  { label: "Mobil",    icon: "🚚", color: C.mobil,    bg: C.mobilBg },
  customer: { label: "Customer", icon: "👤", color: C.customer, bg: C.customerBg },
};

// ─── STAT (kondisi isi/kosong) ──────────────────────────────────────────────
const CondStat = ({ label, value, color }) => (
  <div style={{ flex: 1 }}>
    <div className="mono" style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3 }}>{label}</div>
  </div>
);

// ─── ASSET CARD ─────────────────────────────────────────────────────────────
const AssetCard = ({ asset, filter }) => {
  const m = ITEM_META[asset.item] || { icon: "•" };
  const total = allTotal(asset);
  const segs = [
    { key: "warehouse", val: whTotal(asset), color: C.gudang },
    { key: "vehicle",   val: vhTotal(asset), color: C.mobil },
    { key: "customer",  val: asset.customer, color: C.customer },
  ];

  return (
    <div className="pop" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px", marginBottom: 12 }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: C.slate100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 }}>{m.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{asset.item}</div>
          <div style={{ fontSize: 11, color: C.textDim }}>total sirkulasi</div>
        </div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{total}</div>
      </div>

      {filter === "all" ? (
        <>
          {/* stacked location bar */}
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
            {segs.map(s => (
              <div key={s.key} style={{ width: `${(s.val / total) * 100}%`, background: s.color }} />
            ))}
          </div>

          {/* 3-col location grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {/* Gudang */}
            <div style={{ background: C.gudangBg, borderRadius: 10, padding: "10px 11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 12 }}>🏠</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.gudang }}>Gudang</span>
                <span className="mono" style={{ fontSize: 11, color: C.textDim, marginLeft: "auto" }}>{whTotal(asset)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span style={{ color: C.textMid }}>Isi</span>
                <span className="mono" style={{ fontWeight: 700, color: C.isi }}>{asset.warehouse.full}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginTop: 3 }}>
                <span style={{ color: C.textMid }}>Kosong</span>
                <span className="mono" style={{ fontWeight: 700, color: C.kosong }}>{asset.warehouse.empty}</span>
              </div>
            </div>
            {/* Mobil */}
            <div style={{ background: C.mobilBg, borderRadius: 10, padding: "10px 11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 12 }}>🚚</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.mobil }}>Mobil</span>
                <span className="mono" style={{ fontSize: 11, color: C.textDim, marginLeft: "auto" }}>{vhTotal(asset)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span style={{ color: C.textMid }}>Isi</span>
                <span className="mono" style={{ fontWeight: 700, color: C.isi }}>{asset.vehicle.full}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginTop: 3 }}>
                <span style={{ color: C.textMid }}>Kosong</span>
                <span className="mono" style={{ fontWeight: 700, color: C.kosong }}>{asset.vehicle.empty}</span>
              </div>
            </div>
            {/* Customer */}
            <div style={{ background: C.customerBg, borderRadius: 10, padding: "10px 11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 12 }}>👤</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.customer }}>Customer</span>
              </div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: C.customer, lineHeight: 1 }}>{asset.customer}</div>
              <div style={{ fontSize: 10, color: C.textDim, marginTop: 3, lineHeight: 1.3 }}>dipinjam<br/>(lagi dipakai)</div>
            </div>
          </div>
        </>
      ) : filter === "customer" ? (
        <div style={{ background: LOC[filter].bg, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>👤</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.customer }}>Dipinjam customer</div>
            <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 1 }}>outstanding · lagi dipakai</div>
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: C.customer }}>{asset.customer}</div>
        </div>
      ) : (
        <div style={{ background: LOC[filter].bg, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>{LOC[filter].icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: LOC[filter].color }}>di {LOC[filter].label}</span>
            <span className="mono" style={{ fontSize: 12, color: C.textDim, marginLeft: "auto" }}>{asset[filter].full + asset[filter].empty} pcs</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <CondStat label="Isi" value={asset[filter].full} color={C.isi} />
            <div style={{ width: 1, background: C.border }} />
            <CondStat label="Kosong" value={asset[filter].empty} color={C.kosong} />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN ───────────────────────────────────────────────────────────────────
export default function AssetStockMobile() {
  const [filter, setFilter] = useState("all"); // all | warehouse | vehicle | customer

  const totals = useMemo(() => {
    let circ = 0, whEmpty = 0, wh = 0;
    ASSET_STOCK.forEach(a => {
      circ += allTotal(a);
      whEmpty += a.warehouse.empty;
      wh += whTotal(a);
    });
    return { circ, whEmpty, wh };
  }, []);

  return (
    <>
      <FontLoader />
      <div style={{ minHeight: "100vh", width: "100vw", background: "linear-gradient(135deg,#1e293b,#0f172a)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "26px 20px", gap: 16 }}>
        <div style={{ color: "#cbd5e1", textAlign: "center" }}>
          <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, opacity: 0.7 }}>Consteon</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 4 }}>Stok & Sebaran Aset</div>
        </div>

        <div style={{ width: 390, height: 780, maxHeight: "calc(100vh - 130px)", background: C.bg, borderRadius: 36, overflow: "hidden", position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ height: 36, background: C.surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", fontSize: 13, fontWeight: 600, color: C.text }}>
            <span>08:24</span><span style={{ fontSize: 11 }}>●●●●● 🔋</span>
          </div>

          <div style={{ height: "calc(100% - 36px)", display: "flex", flexDirection: "column" }}>
            {/* header */}
            <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 16px 12px", flexShrink: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>Stok & Sebaran Aset</div>
              <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 1 }}>Semua aset · per lokasi & kondisi</div>

              {/* summary strip */}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <div style={{ flex: 1, background: C.slate100, borderRadius: 10, padding: "9px 12px" }}>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: C.text, lineHeight: 1 }}>{totals.circ}</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>total sirkulasi</div>
                </div>
                <div style={{ flex: 1, background: C.gudangBg, borderRadius: 10, padding: "9px 12px" }}>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: C.gudang, lineHeight: 1 }}>{totals.wh}</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>di gudang</div>
                </div>
                <div style={{ flex: 1, background: C.kosongBg, borderRadius: 10, padding: "9px 12px" }}>
                  <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: C.kosong, lineHeight: 1 }}>{totals.whEmpty}</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 3 }}>kosong di gudang</div>
                </div>
              </div>
            </div>

            {/* filter segmented */}
            <div style={{ display: "flex", gap: 6, padding: "12px 16px 6px", flexShrink: 0 }}>
              {Object.entries(LOC).map(([key, l]) => {
                const active = filter === key;
                return (
                  <button key={key} onClick={() => setFilter(key)} className="tap-feedback" style={{
                    flex: 1, background: active ? C.text : C.surface, color: active ? "#fff" : C.textMid,
                    border: `1px solid ${active ? C.text : C.border}`, borderRadius: 9,
                    padding: "8px 4px", fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 12 }}>{l.icon}</span>{l.label}
                  </button>
                );
              })}
            </div>

            {/* list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 20px" }} className="scroll-thin">
              {ASSET_STOCK.map(a => <AssetCard key={a.item} asset={a} filter={filter} />)}

              <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px", fontSize: 10.5, color: C.textMid, lineHeight: 1.5, marginTop: 2 }}>
                Foto stok saat ini (projection dari ledger). <strong>Bukan</strong> reorder/inbound supplier — itu di luar scope. Angka Isi/Kosong bergantung derivasi komposisi kondisi yang masih disempurnakan.
              </div>
            </div>
          </div>
        </div>

        <div style={{ color: "#64748b", fontSize: 11, textAlign: "center", maxWidth: 360, lineHeight: 1.5 }}>
          Tap <strong>🏠 Gudang</strong> → tiap aset tampil Isi vs Kosong-nya. "Semua" → sebaran penuh Gudang / Mobil / Customer.
        </div>
      </div>
    </>
  );
}
