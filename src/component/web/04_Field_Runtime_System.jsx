// ============================================================================
// Gaspink — Field Runtime System  (doc #4, runtime layer)  ·  v3
// ----------------------------------------------------------------------------
// Tenant: AGEN JAYA. Konsumer: DRIVER (Truck B-1208 · Pak Budi). Happy path.
//
// TOPOLOGI (dikoreksi lagi — lebih jujur):
//   Truck = NODE BERGERAK milik tenant. Counterparty BOLEH CAMPUR, asal DOWNSTREAM:
//     - Truck kecil sendiri → TRANSSHIPMENT (vehicle→vehicle, 2 driver konfirmasi)
//     - Pengecer            → serah terima (drop isi / pickup kosong)
//     - Customer            → deliver (drop isi / pickup kosong)
//   YANG BUKAN stop valid: node peer/upstream (agen besar lain). Itu invariannya.
//   Rute = ADVISORY penuh → driver yang atur urutan (jarak/macet dia lebih tau).
//   Baseline = MUAT di SPBE = custody intake (SPBE→truck) → perlu TANDA TERIMA.
//
// KONFIRMASI — dua mode di bawah satu konsep "explicit confirm" (doc 03 Grade 1):
//   - TTD di HP penerima  (default; dua device; paling kuat)
//   - PIN di HP pengirim  (fallback co-located; satu HP)
//   Tangga: TTD-2-device > PIN-1-HP > auto-approve-berbukti.
//
// ROADMAP (ditahan): surat jalan / tanda terima cetak = proyeksi movement (D18).
//   invoice+payment = commerce plane (D17). escalation+supervisor (D16/D19).
// ============================================================================

import React, { useState } from "react";
import {
  Nfc, Check, CheckCheck, Truck, Package, Camera, MapPin, ChevronRight,
  ChevronLeft, Clock, ArrowUpRight, ArrowDownLeft, Home, Repeat, Plus,
  Fuel, Delete, PenLine, KeyRound, FileText, History, Bell, User, QrCode, LocateFixed, Warehouse, AlertTriangle,
  Layers, TrendingUp, Activity, Wallet,
} from "lucide-react";

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const T = {
  primary: "#1D9E75", primaryDark: "#15795A", primarySoft: "#E7F5EF",
  ink: "#10211A", sub: "#5B6B63", faint: "#8A9B92", line: "#E4EAE7",
  bg: "#F4F7F5", surface: "#FFFFFF",
  isi: "#1D9E75", kosong: "#9AA8A1", pending: "#E2912C",
  font: "'DM Sans', system-ui, -apple-system, sans-serif", radius: 20,
};

const RUNTIME = {
  driver: { label: "Driver", accent: "#2563EB", icon: Truck },
  pengecer: { label: "Pengecer", accent: "#EA580C", icon: Package },
  customer: { label: "Customer", accent: "#0891B2", icon: Home },
  admin: { label: "Admin", accent: "#7C3AED", icon: Warehouse },
  investor: { label: "Investor", accent: "#4F46E5", icon: Layers },
  pertagas: { label: "Pertagas", accent: "#0F766E", icon: Fuel },
  commerce: { label: "Bayar", accent: "#059669", icon: Wallet },
};

// Tipe stop → tampilan
const STOP_META = {
  muat: { icon: Fuel, tag: "Muat", verb: "Muat Tabung Isi" },
  fill: { icon: Fuel, tag: "Mother Station", verb: "Isi CNG" },
  pengecer: { icon: Package, tag: "Pengecer", verb: "Serah Terima" },
  agen: { icon: Warehouse, tag: "Agen", verb: "Serah ke Agen" },
  transship: { icon: Repeat, tag: "Transship truck kecil", verb: "Transship ke Truck Kecil" },
  customer: { icon: Home, tag: "Customer", verb: "Antar ke Customer" },
  setor: { icon: Warehouse, tag: "Setor & tutup hari", verb: "Setor & Tutup Hari" },
};

// ============================================================================
// STANDARD LIBRARY
// ============================================================================
function RuntimeShell({ runtime, tenant, context, children, footer }) {
  const Icon = runtime.icon;
  return (
    <div style={{ background: T.bg, minHeight: "100%", fontFamily: T.font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>
      <div className="mx-auto flex flex-col" style={{ maxWidth: 384, minHeight: 720, background: T.bg, position: "relative" }}>
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.line}` }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 11, background: T.primary }}>
                <Nfc size={18} color="#fff" strokeWidth={2.4} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>{tenant}</div>
                <div style={{ fontSize: 11.5, color: T.faint, fontWeight: 500 }}>{context}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5" style={{ background: `${runtime.accent}14`, borderRadius: 999 }}>
              <Icon size={13} color={runtime.accent} strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 700, color: runtime.accent }}>{runtime.label}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 px-5 py-4" style={{ paddingBottom: footer ? 96 : 24 }}>{children}</div>
        {footer && (
          <div className="absolute bottom-0 left-0 right-0 px-5 py-4" style={{ background: T.surface, borderTop: `1px solid ${T.line}` }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

function ScreenTitle({ kicker, kickerColor, title, back, status }) {
  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <button onClick={back} className="flex items-center gap-1.5" style={{ background: "none", border: "none", cursor: back ? "pointer" : "default", padding: 0 }}>
          {back && <ChevronLeft size={17} color={kickerColor || T.sub} strokeWidth={2.6} />}
          {kicker && <span className="flex items-center gap-1.5"><MapPin size={15} color={kickerColor || T.sub} strokeWidth={2.4} /><span style={{ fontSize: 13, fontWeight: 700, color: kickerColor || T.sub }}>{kicker}</span></span>}
        </button>
        {status}
      </div>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>{title}</div>
    </>
  );
}

function SectionCard({ title, right, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
      {title && <div className="flex items-center justify-between" style={{ marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.2 }}>{title}</span>{right}</div>}
      {children}
    </div>
  );
}

function CountStrip({ isi, kosong }) {
  const Cell = ({ n, label, color }) => (
    <div className="flex-1 text-center py-3">
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{n}</div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: T.sub, marginTop: 4 }}>{label}</div>
    </div>
  );
  return (
    <div className="flex items-stretch" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, marginBottom: 14 }}>
      <Cell n={isi} label="Tabung Isi" color={T.isi} /><div style={{ width: 1, background: T.line, margin: "10px 0" }} /><Cell n={kosong} label="Tabung Kosong" color={T.kosong} />
    </div>
  );
}

function CylinderRow({ id, state, fresh }) {
  const color = state === "isi" ? T.isi : T.kosong;
  return (
    <div className="flex items-center justify-between" style={{ padding: "11px 12px", borderRadius: 13, background: fresh ? T.primarySoft : "transparent", transition: "background .4s" }}>
      <div className="flex items-center gap-2.5"><span style={{ width: 9, height: 9, borderRadius: 999, background: color }} /><span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{id}</span></div>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{state === "isi" ? "Isi" : "Kosong"}</span>
    </div>
  );
}

function ScanStrip({ label, color, onScan }) {
  return (
    <button onClick={onScan} className="w-full flex items-center justify-center gap-2" style={{ background: `${color}10`, border: `1px dashed ${color}66`, borderRadius: 12, padding: "11px", cursor: "pointer" }}>
      <Nfc size={16} color={color} strokeWidth={2.4} /><span style={{ fontSize: 13.5, fontWeight: 700, color: color === T.kosong ? T.sub : T.primaryDark }}>{label}</span>
    </button>
  );
}

function ScanTarget({ onScan, hint, accent = T.primary }) {
  return (
    <button onClick={onScan} className="w-full flex flex-col items-center justify-center" style={{ background: `${accent}0D`, border: `1.5px dashed ${accent}66`, borderRadius: T.radius, padding: "26px 16px", cursor: "pointer" }}>
      <div className="flex items-center justify-center" style={{ width: 52, height: 52, borderRadius: 999, background: accent, marginBottom: 10 }}><Nfc size={26} color="#fff" strokeWidth={2.3} /></div>
      <span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>Scan Tabung</span><span style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>{hint}</span>
    </button>
  );
}

function PrimaryAction({ label, onClick, disabled, accent = T.primary, icon: Icon }) {
  return (
    <button onClick={disabled ? undefined : onClick} className="w-full flex items-center justify-center gap-2" style={{ background: disabled ? "#CDD6D1" : accent, color: "#fff", fontSize: 15.5, fontWeight: 700, padding: 15, borderRadius: 15, border: "none", cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : `0 6px 16px ${accent}33` }}>
      {Icon && <Icon size={18} strokeWidth={2.5} />}{label}
    </button>
  );
}

function StatusPill({ status }) {
  const map = { pending: { c: T.pending, t: "Nunggu konfirmasi", I: Clock }, confirmed: { c: T.primary, t: "Terkonfirmasi", I: CheckCheck }, supervisor: { c: "#8A6FD6", t: "Lagi dicek supervisor", I: Clock } };
  const s = map[status] || map.pending; const I = s.I;
  return <div className="inline-flex items-center gap-1.5 px-2.5 py-1" style={{ background: `${s.c}16`, borderRadius: 999 }}><I size={13} color={s.c} strokeWidth={2.6} /><span style={{ fontSize: 12, fontWeight: 700, color: s.c }}>{s.t}</span></div>;
}

function EvidenceBlock({ foto, onFoto, note, onNote, accent = T.primary }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.2 }}>Bukti serah terima</span>
      <button onClick={onFoto} className="w-full flex items-center gap-3" style={{ marginTop: 12, background: foto ? T.primarySoft : "transparent", border: `1px solid ${foto ? T.primary + "55" : T.line}`, borderRadius: 14, padding: "12px 13px", cursor: "pointer" }}>
        <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: foto ? T.primary : `${accent}14` }}>{foto ? <Check size={18} color="#fff" strokeWidth={2.6} /> : <Camera size={18} color={accent} strokeWidth={2.2} />}</div>
        <div className="text-left flex-1"><div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{foto ? "Foto tersimpan" : "Foto serah terima"}</div><div style={{ fontSize: 11.5, color: T.sub }}>{foto ? "Bukti siap — auto-approve aktif" : "Buat jaga-jaga kalau gak dikonfirmasi"}</div></div>
      </button>
      <textarea value={note} onChange={(e) => onNote(e.target.value)} rows={2} placeholder="Keterangan (opsional) — mis. 1 tabung penyok, sisa kosong nyusul" style={{ width: "100%", marginTop: 10, resize: "none", border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontFamily: T.font, color: T.ink, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

// Ceremony konfirmasi — DUA MODE (doc 03). TTD-2-device (default) / PIN-1-HP.
function ConfirmCeremony({ status, onConfirm, counterparty, successSub = "Custody pindah ke penerima" }) {
  const [mode, setMode] = useState("ttd");
  const [pin, setPin] = useState("");

  if (status === "confirmed") {
    return (
      <div className="flex items-center gap-3" style={{ background: T.primarySoft, borderRadius: 14, padding: "14px 16px" }}>
        <CheckCheck size={22} color={T.primary} strokeWidth={2.5} />
        <div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.primaryDark }}>Terkonfirmasi</div><div style={{ fontSize: 12.5, color: T.sub }}>{successSub}</div></div>
      </div>
    );
  }

  const Tab = ({ k, label, Icon }) => {
    const on = mode === k;
    return (
      <button onClick={() => { setMode(k); setPin(""); }} className="flex-1 flex items-center justify-center gap-1.5 py-2" style={{ background: on ? T.surface : "transparent", borderRadius: 10, border: on ? `1px solid ${T.line}` : "1px solid transparent", boxShadow: on ? "0 1px 2px rgba(0,0,0,.05)" : "none", cursor: "pointer" }}>
        <Icon size={14} color={on ? T.ink : T.faint} strokeWidth={2.4} /><span style={{ fontSize: 12.5, fontWeight: 700, color: on ? T.ink : T.faint }}>{label}</span>
      </button>
    );
  };

  const Key = ({ d }) => (
    <button onClick={() => setPin((p) => (p.length < 4 ? p + d : p))} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 0", fontSize: 18, fontWeight: 700, color: T.ink, cursor: "pointer" }}>{d}</button>
  );

  return (
    <div style={{ background: `${T.pending}0D`, border: `1px solid ${T.pending}44`, borderRadius: T.radius, padding: 14 }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Konfirmasi {counterparty}</span><StatusPill status="pending" />
      </div>

      <div className="flex gap-1 mb-3" style={{ background: T.bg, borderRadius: 12, padding: 3 }}>
        <Tab k="ttd" label="TTD HP penerima" Icon={PenLine} />
        <Tab k="pin" label="PIN di HP ini" Icon={KeyRound} />
      </div>

      {mode === "ttd" ? (
        <>
          <button onClick={onConfirm} className="w-full flex flex-col items-center justify-center" style={{ background: T.surface, border: `1.5px dashed ${T.faint}`, borderRadius: 14, padding: "20px 12px", cursor: "pointer" }}>
            <PenLine size={22} color={T.faint} strokeWidth={2} /><span style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginTop: 6 }}>Minta penerima tanda tangan di sini</span>
          </button>
          <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center", marginTop: 9 }}>Penerima TTD di HP-nya sendiri — dua device, paling kuat</div>
        </>
      ) : (
        <>
          <div className="flex justify-center gap-2.5 mb-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-center" style={{ width: 38, height: 44, borderRadius: 11, background: T.surface, border: `1px solid ${pin.length === i ? T.pending : T.line}`, fontSize: 20, fontWeight: 700, color: T.ink }}>{pin[i] ? "•" : ""}</div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <Key key={d} d={d} />)}
            <button onClick={() => setPin("")} style={{ background: "transparent", border: "none", color: T.faint, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Hapus</button>
            <Key d="0" />
            <button onClick={() => setPin((p) => p.slice(0, -1))} className="flex items-center justify-center" style={{ background: "transparent", border: "none", cursor: "pointer" }}><Delete size={20} color={T.faint} /></button>
          </div>
          <div style={{ marginTop: 12 }}>
            <PrimaryAction label="Konfirmasi" icon={Check} accent={T.pending} disabled={pin.length < 4} onClick={onConfirm} />
          </div>
          <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center", marginTop: 9 }}>Penerima masukin PIN di HP lo — buat co-located satu HP</div>
        </>
      )}

      <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center", marginTop: 11, paddingTop: 11, borderTop: `1px solid ${T.pending}22` }}>Gak hadir? Kirim & nunggu — auto-approve 3 hari kalau ada bukti</div>
    </div>
  );
}

// Toggle 2-opsi reusable (pilih lawan transship, dll).
function Toggle2({ value, onChange, a, b }) {
  const Btn = ({ k, label }) => {
    const on = value === k;
    return <button onClick={() => onChange(k)} className="flex-1 py-2" style={{ background: on ? T.surface : "transparent", borderRadius: 10, border: on ? `1px solid ${T.line}` : "1px solid transparent", boxShadow: on ? "0 1px 2px rgba(0,0,0,.05)" : "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: on ? T.ink : T.faint }}>{label}</button>;
  };
  return <div className="flex gap-1" style={{ background: T.bg, borderRadius: 12, padding: 3 }}><Btn k={a.k} label={a.label} /><Btn k={b.k} label={b.label} /></div>;
}

function TextField({ value, onChange, placeholder }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", border: `1px solid ${T.line}`, borderRadius: 12, padding: "10px 12px", fontSize: 13.5, fontFamily: T.font, color: T.ink, outline: "none", boxSizing: "border-box" }} />;
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.3, marginBottom: 7 }}>{children}</div>;
}

// Tombol resolve (QR / GPS) reusable — captured state nampilin hasil.
function ResolveButton({ done, accent, idleIcon: Idle, idleTitle, idleSub, doneTitle, doneSub, onTap }) {
  return (
    <button onClick={onTap} className="w-full flex items-center gap-3" style={{ background: done ? T.primarySoft : "transparent", border: `1px solid ${done ? T.primary + "55" : T.line}`, borderRadius: 12, padding: "11px 13px", cursor: "pointer" }}>
      <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: done ? T.primary : `${accent}14` }}>{done ? <Check size={17} color="#fff" strokeWidth={2.6} /> : <Idle size={17} color={accent} strokeWidth={2.2} />}</div>
      <div className="text-left"><div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{done ? doneTitle : idleTitle}</div><div style={{ fontSize: 11.5, color: T.sub }}>{done ? doneSub : idleSub}</div></div>
    </button>
  );
}

// Lokasi ambient — pasif, gak ada tombol. GPS nempel ke event pas submit.
function LocationChip({ label = "Lokasi terkunci otomatis", sub = "GPS ikut sendiri pas submit · −6.302, 106.681" }) {
  return (
    <div className="flex items-center gap-2.5" style={{ background: T.bg, borderRadius: 12, padding: "10px 12px", marginBottom: 14 }}>
      <LocateFixed size={16} color={T.sub} strokeWidth={2.3} />
      <div><div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>{label}</div><div style={{ fontSize: 11, color: T.faint }}>{sub}</div></div>
    </div>
  );
}

// Stepper +/− — capture widget buat asset class BULK (count).
function Stepper({ value, color, onDelta }) {
  const Btn = ({ d, fill }) => (
    <button onClick={() => onDelta(d)} className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, border: `1px solid ${fill ? color : T.line}`, background: fill ? color : T.surface, color: fill ? "#fff" : T.sub, fontSize: 21, fontWeight: 700, lineHeight: 1, cursor: "pointer" }}>{d > 0 ? "+" : "−"}</button>
  );
  return (
    <div className="flex items-center gap-3">
      <Btn d={-1} /><span style={{ fontSize: 21, fontWeight: 700, color: T.ink, minWidth: 26, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{value}</span><Btn d={1} fill />
    </div>
  );
}

// ============================================================================
// DRIVER RUNTIME — Agen Jaya
// ============================================================================
const FULL = ["A-1042", "A-1043", "A-1051", "A-1067", "A-1088", "A-1092", "A-1103", "A-1119", "A-1124", "A-1130"];
const EMPTY = ["A-0820", "A-0834", "A-0901", "A-0915", "A-0922"];

// Transship = vehicle→vehicle, DUA ARAH, state intrinsik per tabung (campur isi/kosong).
// State ke-baca dari ID-nya (proyeksi), driver gak milih. Mock pool campur.
const TS_OUT = [{ id: "A-1042", state: "isi" }, { id: "A-1051", state: "isi" }, { id: "A-1067", state: "isi" }, { id: "A-0820", state: "kosong" }, { id: "A-1088", state: "isi" }, { id: "A-0834", state: "kosong" }];
const TS_IN = [{ id: "A-0901", state: "kosong" }, { id: "A-1130", state: "isi" }, { id: "A-0915", state: "kosong" }, { id: "A-0922", state: "kosong" }];
const bd = (arr) => { const isi = arr.filter((x) => x.state === "isi").length; return { isi, kosong: arr.length - isi }; };

// Gudang Agen Jaya = stok sendiri, campur. Kosong dari gudang → dibawa ke SPBE buat diisi.
// SPBE tetep isi doang (titik pengisian). State tiap tabung = dari registry, bukan dipilih.
const GUDANG = [{ id: "A-0820", state: "kosong" }, { id: "A-0834", state: "kosong" }, { id: "A-0901", state: "kosong" }, { id: "A-1042", state: "isi" }, { id: "A-0915", state: "kosong" }, { id: "A-1051", state: "isi" }];

// Rute campuran DOWNSTREAM. Muat = perintah admin (SPBE + gudang). Urutan = advisory.
// `plan` = sisi EXPECTED dari set-match (admin-driven). Field nyatet aktual; beda = selisih.
// Semua muat butuh perintah — bukan bebas. Bebas = gak ada baseline = tabung ilang gak ke-detect.
const STOPS = [
  { id: "m1", name: "SPBE Serpong", type: "muat", source: "SPBE", plan: 8, dist: "start" },
  { id: "m2", name: "Gudang Agen Jaya", type: "muat", source: "Gudang", plan: { isi: 2, kosong: 4 }, dist: "depot" },
  { id: "s1", name: "Toko Berkah", type: "pengecer", dist: "2,4 km", address: "Jl. Raya Serpong No. 45, Tangsel", lines: [{ cls: "cng", keluar: 5, masuk: 4 }, { cls: "galon", keluar: 10, masuk: 8 }, { cls: "dus", keluar: 5 }] },
  { id: "s2", name: "Truck B-1210 · Pak Andi", type: "transship", plan: { keluar: 5, masuk: 3 }, dist: "depot" },
  { id: "s3", name: "Bu Sari · RT 04", type: "customer", dist: "1,1 km", address: "Perum Griya Asri Blok C-12", lines: [{ cls: "cng", keluar: 2, masuk: 2 }] },
  { id: "s4", name: "Warung Jaya Gas", type: "pengecer", dist: "3,5 km", address: "Pasar Modern BSD, Kios 12A", lines: [{ cls: "cng", keluar: 4, masuk: 3 }] },
  { id: "setor", name: "Gudang Agen Jaya", type: "setor", dist: "depot" },
];

// BARANG MASUK — kiriman push dari distributor. BUKAN rute (Agen Jaya gak gerak;
// barang yang dateng). Dipisah dari STOPS biar gak rancu sama "rute hari ini".
const INBOX = [
  { id: "d1", name: "Distributor CNG Nusantara", type: "muat", source: "Distributor", plan: 12, dist: "kiriman" },
];

// Asset Class registry (doc 06) — tiga kelas konkret. Dial: mode (serialized/bulk), returnable.
const ASSET_CLASS = {
  cng: { id: "cng", label: "CNG Tabung", mode: "serialized", returnable: true, color: T.primary, badge: "scan per-ID" },
  galon: { id: "galon", label: "Galon Aqua", mode: "bulk", returnable: true, color: "#2563EB", badge: "hitung" },
  dus: { id: "dus", label: "Dus 600ml", mode: "bulk", returnable: false, color: "#EA580C", badge: "hitung · one-way" },
};

// init state per line: serialized = array (scan), bulk = number (count)
const initLines = (stop) => {
  const o = {};
  (stop.lines || []).forEach((L) => { o[L.cls] = ASSET_CLASS[L.cls].mode === "serialized" ? { out: [], in: [] } : { out: 0, in: 0 }; });
  return o;
};
const lineQty = (v) => (Array.isArray(v) ? v.length : v);
const serahReady = (cer) => Object.values(cer.lines || {}).some((l) => lineQty(l.out) > 0);

const stopInfo = (s) =>
  s.type === "muat" ? (s.source === "Gudang" ? `${s.plan.kosong} kosong · ${s.plan.isi} isi · ${s.source}` : s.source === "Distributor" ? `DO ${s.plan} isi · ${s.source}` : `perintah ${s.plan} · ${s.source}`)
    : s.type === "setor" ? "tutup hari · setor sisa"
      : s.type === "transship" ? `${s.plan.keluar} keluar · ${s.plan.masuk} masuk`
      : s.lines.length > 1 ? `campur · ${s.lines.length} jenis aset` : `${s.lines[0].keluar} turun · ${s.lines[0].masuk || 0} naik`;

function BerandaScreen({ truckIsi, truckKosong, accent, done, goStop }) {
  const sisa = STOPS.filter((s) => !done.includes(s.id)).length;
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Hari ini</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 18 }}>{sisa} titik tersisa</div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Muatan truck</div>
      <CountStrip isi={truckIsi} kosong={truckKosong} />

      <div className="flex items-center justify-between mb-2" style={{ marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase" }}>Rute hari ini</span>
        <button className="flex items-center gap-1" style={{ background: `${accent}12`, border: "none", borderRadius: 999, padding: "5px 9px", cursor: "pointer" }}><Plus size={13} color={accent} strokeWidth={2.8} /><span style={{ fontSize: 11.5, fontWeight: 700, color: accent }}>Titik</span></button>
      </div>
      <div className="flex items-center gap-1.5" style={{ marginBottom: 10 }}>
        <LocateFixed size={12} color={accent} strokeWidth={2.6} />
        <span style={{ fontSize: 12, color: T.faint }}>Jarak dari lokasi kamu · urutan lo yang atur</span>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {STOPS.map((s, i) => {
          const meta = STOP_META[s.type]; const Icon = meta.icon; const finished = done.includes(s.id);
          return (
            <button key={s.id} onClick={() => goStop(s)} className="w-full flex items-center gap-3" style={{ padding: "11px 10px", borderTop: i ? `1px solid ${T.line}` : "none", background: "none", border: "none", cursor: "pointer" }}>
              <div className="flex items-center justify-center" style={{ width: 22, textAlign: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: finished ? T.primary : T.faint }}>{finished ? "✓" : i + 1}</span>
              </div>
              <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: finished ? T.primarySoft : T.bg }}>
                <Icon size={17} color={finished ? T.primary : (s.type === "muat" ? accent : T.sub)} strokeWidth={2.3} />
              </div>
              <div className="flex-1 text-left">
                <div style={{ fontSize: 14.5, fontWeight: 700, color: finished ? T.faint : T.ink, textDecoration: finished ? "line-through" : "none" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: T.faint }}>{meta.tag} · {stopInfo(s)} · {s.dist}</div>
              </div>
              {!finished && <ChevronRight size={18} color={T.faint} />}
            </button>
          );
        })}
      </div>
    </>
  );
}

function MuatScreen({ stop, st, set, accent, back }) {
  const isGudang = stop.source === "Gudang";
  const isDist = stop.source === "Distributor";
  const pool = isGudang ? GUDANG : FULL.map((id) => ({ id, state: "isi" }));
  const onScan = () => set((s) => ({ ...s, loaded: s.loaded.length < pool.length ? [...s.loaded, pool[s.loaded.length]] : s.loaded }));
  const b = bd(st.loaded);
  const planText = isGudang ? `${stop.plan.kosong} kosong · ${stop.plan.isi} isi` : `${stop.plan} tabung`;
  const beda = isGudang ? (b.isi !== stop.plan.isi || b.kosong !== stop.plan.kosong) : (st.loaded.length !== stop.plan);
  const title = isDist ? "Terima dari Distributor" : `Muat dari ${stop.source}`;
  const baselineTitle = isDist ? "Kiriman push dari distributor" : "Perintah muat dari admin";
  const baselineSub = isDist ? `Surat jalan (DO) · ${stop.plan} tabung isi` : `${planText} · ${stop.source}`;
  const BIcon = isDist ? Truck : FileText;
  const scanHint = isGudang ? "Isi/kosong ke-baca dari tabungnya" : isDist ? "Tap tiap tabung isi yang diterima" : "Tap tiap tabung yang naik truck";
  const successSub = isDist ? "Tanda terima · custody pindah ke Agen Jaya" : "Tanda terima terbit · custody pindah ke truck";
  return (
    <>
      <ScreenTitle back={back} kicker={stop.name} kickerColor={accent} title={title} status={st.conf !== "idle" ? <StatusPill status={st.conf === "pending" ? "pending" : "confirmed"} /> : null} />
      <div style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <BIcon size={17} color={accent} strokeWidth={2.3} />
        <div><div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{baselineTitle}</div><div style={{ fontSize: 12, color: T.sub }}>{baselineSub}</div></div>
      </div>
      {st.conf === "idle" && isGudang && (
        <div style={{ marginBottom: 14 }}>
          <ResolveButton done={st.atNode} accent={accent} idleIcon={QrCode} idleTitle="Scan QR gudang" idleSub="Pastikan kamu di gudang (GPS lemah di dalam)" doneTitle="Di Gudang Agen Jaya" doneSub="Presensi terverifikasi via QR" onTap={() => set((s) => ({ ...s, atNode: true }))} />
        </div>
      )}
      {st.conf === "idle" && !isGudang && <LocationChip label={`Lokasi ${stop.source} otomatis (GPS)`} sub="Ikut sendiri pas submit" />}
      {st.conf === "idle" && <div style={{ marginBottom: 14 }}><ScanTarget onScan={onScan} accent={accent} hint={scanHint} /></div>}
      <SectionCard title={`Diterima dari ${stop.source}`} right={isGudang
        ? <span style={{ fontSize: 12.5, fontWeight: 700 }}><span style={{ color: T.kosong }}>{b.kosong}/{stop.plan.kosong} kosong</span> <span style={{ color: T.faint }}>·</span> <span style={{ color: T.isi }}>{b.isi}/{stop.plan.isi} isi</span></span>
        : <span style={{ fontSize: 13, fontWeight: 700, color: T.primary }}>{st.loaded.length} <span style={{ color: T.faint }}>/ {stop.plan}</span></span>}>
        {st.loaded.length === 0 ? <div style={{ fontSize: 13, color: T.faint, textAlign: "center", padding: "14px 0" }}>Belum ada tabung. Scan buat mulai.</div> : [...st.loaded].reverse().map((c, i) => <CylinderRow key={c.id} id={c.id} state={c.state} fresh={i === 0} />)}
      </SectionCard>
      {beda && st.loaded.length > 0 && st.conf === "idle" && (
        <div style={{ fontSize: 11.5, color: T.pending, textAlign: "center", marginBottom: 12, fontWeight: 600 }}>{isDist ? "Beda dari surat jalan (DO)" : "Beda dari perintah"} — selisih jadi catatan, gak ngeblok</div>
      )}
      {st.conf !== "idle" && (
        <ConfirmCeremony status={st.conf} counterparty={stop.source} successSub={successSub} onConfirm={() => set((s) => ({ ...s, conf: "confirmed" }))} />
      )}
      {st.conf === "confirmed" && (
        <div className="flex items-center gap-2.5" style={{ marginTop: 12, padding: "11px 13px", background: T.bg, borderRadius: 13 }}>
          <FileText size={17} color={T.sub} strokeWidth={2.2} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>Tanda terima — cetak nyusul (surat jalan)</span>
        </div>
      )}
      {st.conf === "idle" && <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center" }}>{isDist ? "Kiriman ini nambah ke muatan / stok Agen Jaya" : "Muatan ini jadi baseline terverifikasi truck"}</div>}
    </>
  );
}

// Serah terima (pengecer / customer) — drop isi + pickup kosong.
// LineItem — satu asset class dalam handoff. Widget capture nyesuain dial:
// serialized → scan list (per-ID) · bulk → stepper count. returnable → ada masuk.
function LineItem({ cls, plan, ls, upd }) {
  const serialized = cls.mode === "serialized";
  const Dir = ({ dirLabel, field, target, pool, isOut }) => {
    const stateColor = isOut ? T.isi : T.kosong;
    if (serialized) {
      const arr = ls[field];
      return (
        <div style={{ marginTop: 10 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>{dirLabel}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: stateColor }}>{arr.length} <span style={{ color: T.faint }}>/ {target}</span></span>
          </div>
          {arr.map((id, i) => <CylinderRow key={id} id={id} state={isOut ? "isi" : "kosong"} fresh={i === arr.length - 1} />)}
          <div style={{ marginTop: arr.length ? 8 : 0 }}><ScanStrip label={`Scan ${isOut ? "tabung isi" : "tabung kosong"}`} color={stateColor} onScan={() => upd((l) => ({ ...l, [field]: l[field].length < pool.length ? [...l[field], pool[l[field].length]] : l[field] }))} /></div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>{dirLabel} <span style={{ color: T.faint, fontWeight: 600 }}>· target {target}</span></span>
        <Stepper value={ls[field]} color={cls.color} onDelta={(d) => upd((l) => ({ ...l, [field]: Math.max(0, l[field] + d) }))} />
      </div>
    );
  };
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span style={{ width: 9, height: 9, borderRadius: 999, background: cls.color }} /><span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{cls.label}</span></div>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: cls.color, background: `${cls.color}14`, borderRadius: 999, padding: "3px 8px" }}>{cls.badge}</span>
      </div>
      <Dir dirLabel="Isi keluar" field="out" target={plan.keluar} pool={FULL} isOut />
      {cls.returnable
        ? <Dir dirLabel="Kosong masuk" field="in" target={plan.masuk} pool={EMPTY} />
        : <div style={{ fontSize: 11.5, color: T.faint, marginTop: 10 }}>One-way — gak ada yang balik</div>}
    </div>
  );
}

// Serah terima (pengecer / customer) — render dari LINE ITEMS (multi-asset).
function HandoffScreen({ stop, st, set, accent, back }) {
  const meta = STOP_META[stop.type];
  const Icon = meta.icon;
  const updLine = (clsId, fn) => set((s) => ({ ...s, lines: { ...s.lines, [clsId]: fn(s.lines[clsId]) } }));
  const multi = stop.lines.length > 1;
  return (
    <>
      <ScreenTitle back={back} kicker={`${stop.name} · ${meta.tag}`} kickerColor={accent} title={meta.verb} status={st.conf !== "idle" ? <StatusPill status={st.conf === "pending" ? "pending" : "confirmed"} /> : null} />
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}14`, flexShrink: 0 }}><Icon size={18} color={accent} strokeWidth={2.3} /></div>
          <div className="flex-1">
            <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{stop.name}</div>
            <div className="flex items-start gap-1.5" style={{ marginTop: 3 }}><MapPin size={13} color={T.faint} strokeWidth={2.2} style={{ marginTop: 2, flexShrink: 0 }} /><span style={{ fontSize: 12.5, color: T.sub }}>{stop.address}</span></div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <FieldLabel>Diterima oleh (opsional)</FieldLabel>
          <TextField value={st.penerima} onChange={(v) => set((s) => ({ ...s, penerima: v }))} placeholder="Nama penerima" />
        </div>
      </div>
      <LocationChip />
      {multi && <div style={{ fontSize: 11.5, color: T.faint, marginBottom: 10, marginTop: -4 }}>Muatan campur · {stop.lines.length} jenis aset · satu konfirmasi nutup semua</div>}
      {stop.lines.map((L) => <LineItem key={L.cls} cls={ASSET_CLASS[L.cls]} plan={L} ls={st.lines[L.cls]} upd={(fn) => updLine(L.cls, fn)} />)}
      <EvidenceBlock foto={st.foto} onFoto={() => set((s) => ({ ...s, foto: !s.foto }))} note={st.note} onNote={(v) => set((s) => ({ ...s, note: v }))} accent={accent} />
      {st.conf !== "idle" && <ConfirmCeremony status={st.conf} counterparty={meta.tag.toLowerCase()} onConfirm={() => set((s) => ({ ...s, conf: "confirmed" }))} />}
      {st.conf === "idle" && serahReady(st) && <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center", marginTop: 4 }}>Selisih per jenis aset → catatan ke supervisor</div>}
    </>
  );
}

// Transship = vehicle→vehicle, DUA ARAH. Tiap tabung bawa state-nya sendiri (campur).
function TransshipScreen({ stop, st, set, accent, back }) {
  const outB = bd(st.tsOut), inB = bd(st.tsIn);
  const scanOut = () => set((s) => ({ ...s, tsOut: s.tsOut.length < TS_OUT.length ? [...s.tsOut, TS_OUT[s.tsOut.length]] : s.tsOut }));
  const scanIn = () => set((s) => ({ ...s, tsIn: s.tsIn.length < TS_IN.length ? [...s.tsIn, TS_IN[s.tsIn.length]] : s.tsIn }));
  const Count = ({ n, b, color }) => (
    <span className="inline-flex items-center gap-1" style={{ fontSize: 12.5, fontWeight: 700, color }}>{n} <span style={{ color: T.faint, fontWeight: 600 }}>· {b.isi} isi {b.kosong} kosong</span></span>
  );
  return (
    <>
      <ScreenTitle back={back} kicker={stop.name} kickerColor={accent} title="Transship Truck Kecil" status={st.conf !== "idle" ? <StatusPill status={st.conf === "pending" ? "pending" : "confirmed"} /> : null} />
      <div style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <Repeat size={18} color={accent} strokeWidth={2.4} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>Custody pindah antar truck — dua arah. Isi/kosong ke-baca dari tabungnya.</span>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Lawan transship</FieldLabel>
        <Toggle2 value={st.tsMode} onChange={(v) => set((s) => ({ ...s, tsMode: v, tsResolved: false }))} a={{ k: "own", label: "Truck sendiri" }} b={{ k: "lain", label: "Truck lain" }} />
        <div style={{ marginTop: 10 }}>
          {st.tsMode === "own" ? (
            <ResolveButton done={st.tsResolved} accent={accent} idleIcon={QrCode} idleTitle="Scan QR truck" idleSub="Truck terdaftar di Agen Jaya" doneTitle="B-1210 · Pak Andi" doneSub="Terverifikasi dari QR" onTap={() => set((s) => ({ ...s, tsResolved: true }))} />
          ) : (
            <div className="flex flex-col gap-2">
              <TextField value={st.tsPlate} onChange={(v) => set((s) => ({ ...s, tsPlate: v }))} placeholder="No. mobil — mis. B 9123 XYZ" />
              <TextField value={st.tsDriver} onChange={(v) => set((s) => ({ ...s, tsDriver: v }))} placeholder="Nama driver" />
            </div>
          )}
        </div>
        <div style={{ height: 1, background: T.line, margin: "14px 0 4px" }} />
        <LocationChip />
      </div>

      <SectionCard title="Pindah ke truck kecil" right={<span className="inline-flex items-center gap-1"><ArrowUpRight size={14} color={accent} strokeWidth={2.6} /><Count n={st.tsOut.length} b={outB} color={accent} /></span>}>
        {st.tsOut.map((c, i) => <CylinderRow key={c.id} id={c.id} state={c.state} fresh={i === st.tsOut.length - 1} />)}
        <div style={{ marginTop: st.tsOut.length ? 10 : 0 }}><ScanStrip label="Scan tabung dipindah" color={accent} onScan={scanOut} /></div>
      </SectionCard>

      <SectionCard title="Terima dari truck kecil" right={<span className="inline-flex items-center gap-1"><ArrowDownLeft size={14} color={T.sub} strokeWidth={2.6} /><Count n={st.tsIn.length} b={inB} color={T.sub} /></span>}>
        {st.tsIn.map((c, i) => <CylinderRow key={c.id} id={c.id} state={c.state} fresh={i === st.tsIn.length - 1} />)}
        <div style={{ marginTop: st.tsIn.length ? 10 : 0 }}><ScanStrip label="Scan tabung diterima" color={T.sub} onScan={scanIn} /></div>
      </SectionCard>

      <EvidenceBlock foto={st.foto} onFoto={() => set((s) => ({ ...s, foto: !s.foto }))} note={st.note} onNote={(v) => set((s) => ({ ...s, note: v }))} accent={accent} />
      {st.conf !== "idle" && <ConfirmCeremony status={st.conf} counterparty="Driver B-1210" onConfirm={() => set((s) => ({ ...s, conf: "confirmed" }))} />}
      {(st.tsOut.length > 0 || st.tsIn.length > 0) && st.conf === "idle" && <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center", marginTop: 4 }}>Target {stop.plan.keluar} keluar · {stop.plan.masuk} masuk — selisih jadi catatan ke supervisor</div>}
    </>
  );
}

// Rekonsiliasi akhir hari — TIGA EMBER kepisah (Discrepancy≠Lost, Validation≠Resolution).
// Diseed buat demo: cocok & pending = count; selisih = per-ID (yang perlu di-drill).
const RECON = {
  cocok: 11,
  pending: 2,
  selisih: [{ id: "A-0915", state: "kosong", at: "Warung Jaya Gas" }],
};

function ReconBucket({ color, icon: Icon, count, label, sub, children }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 14, marginBottom: 12 }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, background: `${color}16`, flexShrink: 0 }}><Icon size={19} color={color} strokeWidth={2.4} /></div>
        <div className="flex-1"><div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{label}</div><div style={{ fontSize: 11.5, color: T.sub }}>{sub}</div></div>
        <div style={{ fontSize: 24, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{count}</div>
      </div>
      {children && <div style={{ marginTop: 10, borderTop: `1px solid ${T.line}`, paddingTop: 10 }}>{children}</div>}
    </div>
  );
}

// Setor = stop terakhir, balik gudang. Rekonsiliasi tiga ember + setor sisa + tanda terima.
function SetorScreen({ st, set, accent, back }) {
  return (
    <>
      <ScreenTitle back={back} kicker="Gudang Agen Jaya" kickerColor={accent} title="Setor & Tutup Hari" status={st.conf !== "idle" ? <StatusPill status={st.conf === "pending" ? "pending" : "confirmed"} /> : null} />

      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Rekonsiliasi hari ini</div>
      <ReconBucket color={T.primary} icon={CheckCheck} count={RECON.cocok} label="Cocok" sub="Terkonfirmasi & dikembalikan" />
      <ReconBucket color={T.pending} icon={Clock} count={RECON.pending} label="Nunggu konfirmasi" sub="Sah — custody masih di kamu, auto-approve jalan" />
      <ReconBucket color="#8A6FD6" icon={AlertTriangle} count={RECON.selisih.length} label="Selisih" sub="Gak keitung — diteruskan ke supervisor">
        {RECON.selisih.map((c) => (
          <div key={c.id} className="flex items-center justify-between" style={{ padding: "6px 2px" }}>
            <div className="flex items-center gap-2.5"><span style={{ width: 9, height: 9, borderRadius: 999, background: c.state === "isi" ? T.isi : T.kosong }} /><span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{c.id}</span></div>
            <span style={{ fontSize: 12, color: T.faint }}>terakhir di {c.at}</span>
          </div>
        ))}
      </ReconBucket>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", margin: "4px 0 8px" }}>Dikembalikan ke gudang</div>
      <CountStrip isi={st.sisaIsi} kosong={st.sisaKosong} />

      {st.conf === "idle" && (
        <div style={{ marginBottom: 14 }}>
          <ResolveButton done={st.atNode} accent={accent} idleIcon={QrCode} idleTitle="Scan QR gudang" idleSub="Pastikan kamu di gudang" doneTitle="Di Gudang Agen Jaya" doneSub="Presensi terverifikasi via QR" onTap={() => set((s) => ({ ...s, atNode: true }))} />
        </div>
      )}
      <LocationChip label="Lokasi gudang" sub="GPS ikut pas tutup hari" />

      {st.conf !== "idle" && <ConfirmCeremony status={st.conf} counterparty="Gudang Agen Jaya" successSub="Setor beres · sisa balik ke gudang" onConfirm={() => set((s) => ({ ...s, conf: "confirmed" }))} />}
      {st.conf === "confirmed" && (
        <div className="flex items-center gap-2.5" style={{ marginTop: 12, padding: "11px 13px", background: T.bg, borderRadius: 13 }}>
          <FileText size={17} color={T.sub} strokeWidth={2.2} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>Tanda terima setor + rekap selisih ke supervisor</span>
        </div>
      )}
      {st.conf === "idle" && RECON.selisih.length > 0 && <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center" }}>Selisih gak ngeblok setor — keangkat ke supervisor</div>}
    </>
  );
}

// Bottom nav reusable lintas actor — items bisa di-override per runtime.
const DRIVER_NAV = [
  { key: "beranda", label: "Beranda", I: Home },
  { key: "riwayat", label: "Riwayat", I: History },
  { key: "notifikasi", label: "Notifikasi", I: Bell, badge: 2 },
  { key: "profil", label: "Profil", I: User },
];
const ADMIN_NAV = [
  { key: "beranda", label: "Beranda", I: Home },
  { key: "tugas", label: "Tugas", I: FileText },
  { key: "profil", label: "Profil", I: User },
];
function BottomNav({ active, onChange, accent, items = DRIVER_NAV }) {
  return (
    <div className="flex" style={{ background: T.surface, borderTop: `1px solid ${T.line}` }}>
      {items.map(({ key, label, I, badge }) => {
        const on = active === key;
        return (
          <button key={key} onClick={() => onChange(key)} className="flex-1 flex flex-col items-center gap-1 py-3" style={{ background: "none", border: "none", cursor: "pointer" }}>
            <div style={{ position: "relative" }}>
              <I size={20} color={on ? accent : T.faint} strokeWidth={on ? 2.6 : 2} />
              {badge ? <span style={{ position: "absolute", top: -4, right: -7, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 999, background: T.pending, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</span> : null}
            </div>
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 600, color: on ? accent : T.faint }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Riwayat — serah terima beres hari ini + tanda terima (proyeksi, surat jalan D18).
function RiwayatScreen({ done }) {
  const finished = STOPS.filter((s) => done.includes(s.id));
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Riwayat Hari Ini</div>
      <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Serah terima yang udah beres · tanda terima</div>
      {finished.length === 0 ? (
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "30px 16px", textAlign: "center" }}>
          <FileText size={26} color={T.faint} strokeWidth={1.8} />
          <div style={{ fontSize: 13.5, color: T.sub, fontWeight: 600, marginTop: 8 }}>Belum ada serah terima beres</div>
          <div style={{ fontSize: 12, color: T.faint, marginTop: 2 }}>Selesaiin titik di rute, muncul di sini</div>
        </div>
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
          {finished.map((s, i) => {
            const meta = STOP_META[s.type]; const Icon = meta.icon;
            return (
              <div key={s.id} className="flex items-center gap-3" style={{ padding: "12px 10px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
                <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: T.primarySoft }}><Icon size={16} color={T.primary} strokeWidth={2.4} /></div>
                <div className="flex-1"><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{s.name}</div><div style={{ fontSize: 12, color: T.faint }}>{meta.tag} · terkonfirmasi</div></div>
                <button style={{ display: "flex", alignItems: "center", gap: 4, background: T.bg, border: "none", borderRadius: 999, padding: "6px 10px", cursor: "pointer" }}><FileText size={13} color={T.sub} /><span style={{ fontSize: 11.5, fontWeight: 700, color: T.sub }}>Tanda terima</span></button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// Notifikasi — tempat outcome auto-approve / order baru / eskalasi nongol.
function NotifikasiScreen() {
  const items = [
    { I: CheckCheck, c: T.primary, t: "Auto-approve berhasil", s: "Toko Berkah · ada bukti foto · 2 jam lalu" },
    { I: Plus, c: "#2563EB", t: "Order baru masuk rute", s: "Bu Sari nambah 1 tabung · 3 jam lalu" },
    { I: Clock, c: "#8A6FD6", t: "Selisih dicek supervisor", s: "Warung Jaya · kurang 1 kosong · kemarin" },
  ];
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Notifikasi</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {items.map((n, i) => {
          const I = n.I;
          return (
            <div key={i} className="flex items-start gap-3" style={{ padding: "13px 10px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
              <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: `${n.c}14`, flexShrink: 0 }}><I size={16} color={n.c} strokeWidth={2.4} /></div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{n.t}</div><div style={{ fontSize: 12, color: T.faint, marginTop: 1 }}>{n.s}</div></div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Profil — info driver/operator. White-label per tenant.
function ProfilScreen() {
  const rows = [
    { k: "Operator", v: "Agen Jaya" },
    { k: "Driver", v: "Pak Budi" },
    { k: "Truck", v: "B-1208" },
    { k: "Shift", v: "Pagi · 06.00–14.00" },
  ];
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Profil</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div className="mx-auto flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, background: T.primarySoft, marginBottom: 10 }}><User size={30} color={T.primary} strokeWidth={2.2} /></div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Pak Budi</div>
        <div style={{ fontSize: 12.5, color: T.faint }}>Driver · Agen Jaya</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {rows.map((r, i) => (
          <div key={r.k} className="flex items-center justify-between" style={{ padding: "13px 12px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
            <span style={{ fontSize: 13.5, color: T.sub }}>{r.k}</span><span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{r.v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ============================================================================
// ROOT
// ============================================================================
// ============================================================================
// DRIVER APP (Agen Jaya driver)
// ============================================================================
function DriverApp() {
  const runtime = RUNTIME.driver;
  const accent = runtime.accent;
  const [screen, setScreen] = useState("beranda"); // beranda | muat | serah | transship
  const [activeStop, setActiveStop] = useState(null);
  const [done, setDone] = useState([]);
  const [truckIsi, setTruckIsi] = useState(0);
  const [truckKosong, setTruckKosong] = useState(0);

  const blankMuat = { loaded: [], conf: "idle", atNode: false };
  const blankCer = { lines: {}, tsOut: [], tsIn: [], foto: false, note: "", conf: "idle", penerima: "", tsMode: "own", tsResolved: false, tsPlate: "", tsDriver: "" };
  const [muat, setMuat] = useState(blankMuat);
  const [cer, setCer] = useState(blankCer);
  const [setor, setSetor] = useState({ atNode: false, conf: "idle", sisaIsi: 0, sisaKosong: 0 });

  const goStop = (s) => {
    setActiveStop(s);
    if (s.type === "muat") { setMuat(blankMuat); setScreen("muat"); }
    else if (s.type === "setor") { setSetor({ atNode: false, conf: "idle", sisaIsi: truckIsi, sisaKosong: truckKosong }); setScreen("setor"); }
    else { setCer({ ...blankCer, lines: initLines(s) }); setScreen(s.type === "transship" ? "transship" : "serah"); }
  };
  const backHome = () => setScreen("beranda");

  const commitMuat = () => { const o = bd(muat.loaded); setTruckIsi((n) => n + o.isi); setTruckKosong((n) => n + o.kosong); setDone((d) => [...d, activeStop.id]); setScreen("beranda"); };
  const commitSetor = () => { setTruckIsi(0); setTruckKosong(0); setDone((d) => [...d, "setor"]); setScreen("beranda"); };
  const commitStop = () => {
    if (activeStop?.type === "transship") {
      const o = bd(cer.tsOut), i = bd(cer.tsIn);
      setTruckIsi((n) => Math.max(0, n - o.isi + i.isi));
      setTruckKosong((n) => Math.max(0, n - o.kosong + i.kosong));
    } else { const cng = cer.lines.cng; if (cng) { setTruckIsi((n) => Math.max(0, n - cng.out.length)); setTruckKosong((n) => n + cng.in.length); } }
    setDone((d) => [...d, activeStop.id]); setScreen("beranda");
  };

  const footer = (() => {
    if (screen === "muat") {
      if (muat.conf === "idle") return <PrimaryAction label={`Selesai Muat — ${muat.loaded.length} tabung`} icon={CheckCheck} accent={accent} disabled={muat.loaded.length === 0} onClick={() => setMuat((s) => ({ ...s, conf: "pending" }))} />;
      if (muat.conf === "confirmed") return <PrimaryAction label="Tanda Terima Siap — Mulai Rute" icon={ChevronRight} accent={accent} onClick={commitMuat} />;
      return null;
    }
    if (screen === "setor") {
      if (setor.conf === "idle") return <PrimaryAction label="Setor & Tutup Hari" icon={CheckCheck} accent={accent} onClick={() => setSetor((s) => ({ ...s, conf: "pending" }))} />;
      if (setor.conf === "confirmed") return <PrimaryAction label="Selesai — Tutup Hari" icon={CheckCheck} accent={accent} onClick={commitSetor} />;
      return null;
    }
    if (screen === "serah" || screen === "transship") {
      if (cer.conf === "confirmed") return <PrimaryAction label="Selesai — Kembali ke Rute" icon={CheckCheck} accent={accent} onClick={commitStop} />;
      if (cer.conf === "idle") {
        const ready = screen === "transship"
          ? ((cer.tsOut.length > 0 || cer.tsIn.length > 0) && (cer.tsMode === "own" ? cer.tsResolved : (cer.tsPlate.trim() && cer.tsDriver.trim())))
          : serahReady(cer);
        return <PrimaryAction label="Minta Konfirmasi" icon={Check} accent={accent} disabled={!ready} onClick={() => setCer((s) => ({ ...s, conf: "pending" }))} />;
      }
    }
    return null;
  })();

  const mainTabs = ["beranda", "riwayat", "notifikasi", "profil"];
  const showNav = mainTabs.includes(screen);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "16px 0" }}>
      <RuntimeShell runtime={runtime} tenant="Agen Jaya" context="Truck B-1208 · Pak Budi" footer={footer}>
        {screen === "beranda" && <BerandaScreen truckIsi={truckIsi} truckKosong={truckKosong} accent={accent} done={done} goStop={goStop} />}
        {screen === "riwayat" && <RiwayatScreen done={done} />}
        {screen === "notifikasi" && <NotifikasiScreen />}
        {screen === "profil" && <ProfilScreen />}
        {screen === "muat" && activeStop && <MuatScreen stop={activeStop} st={muat} set={setMuat} accent={accent} back={backHome} />}
        {screen === "serah" && activeStop && <HandoffScreen stop={activeStop} st={cer} set={setCer} accent={accent} back={backHome} />}
        {screen === "transship" && activeStop && <TransshipScreen stop={activeStop} st={cer} set={setCer} accent={accent} back={backHome} />}
        {screen === "setor" && <SetorScreen st={setor} set={setSetor} accent={accent} back={backHome} />}
      </RuntimeShell>
      {showNav && (
        <div className="mx-auto" style={{ maxWidth: 384, marginTop: -1 }}>
          <BottomNav active={screen} onChange={setScreen} accent={accent} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CUSTOMER APP — node hilir, lightweight. Inti: APPROVE drop + riwayat.
// Reuse standard library yang sama; cuma accent + nav yang beda.
// Customer = penerima (approve count-level, ID bisa di-drill), BUKAN scanner.
// ============================================================================
const CUSTOMER_NAV = [
  { key: "beranda", label: "Beranda", I: Home },
  { key: "riwayat", label: "Riwayat", I: History },
  { key: "profil", label: "Profil", I: User },
];

// Drop yang nunggu di-approve (dari sisi customer). Count-level, ID bisa diintip.
const CUST_DROP = {
  from: "Agen Jaya · Pak Budi",
  time: "Hari ini · 14:20",
  terima: [{ id: "A-1042", state: "isi" }, { id: "A-1051", state: "isi" }],
  balikin: [{ id: "A-0820", state: "kosong" }, { id: "A-0834", state: "kosong" }],
};
const CUST_RIWAYAT = [
  { date: "2 Jun", isi: 2, kosong: 2, by: "Pak Budi" },
  { date: "25 Mei", isi: 2, kosong: 1, by: "Pak Andi" },
  { date: "18 Mei", isi: 1, kosong: 2, by: "Pak Budi" },
];

// Baris ringkas terima/balikin + drill ID opsional.
function DropLine({ label, items, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 12 }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{items.length} tabung</span>
      </div>
      <button onClick={() => setOpen((v) => !v)} style={{ background: "none", border: "none", padding: 0, marginTop: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.faint }}>
        {open ? "Sembunyikan ID ▴" : "Lihat ID tabung ▾"}
      </button>
      {open && <div style={{ marginTop: 6 }}>{items.map((c) => <CylinderRow key={c.id} id={c.id} state={c.state} />)}</div>}
    </div>
  );
}

function CustBeranda({ saldo, approved, accent, goApprove }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Tabung di rumah</div>
      <CountStrip isi={saldo.isi} kosong={saldo.kosong} />

      {!approved ? (
        <button onClick={goApprove} className="w-full text-left" style={{ background: `${T.pending}0D`, border: `1px solid ${T.pending}55`, borderRadius: T.radius, padding: 16, marginBottom: 14, cursor: "pointer" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 13, fontWeight: 700, color: T.pending }}>Ada antaran nunggu</span>
            <StatusPill status="pending" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink }}>{CUST_DROP.from}</div>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>Terima 2 isi · balikin 2 kosong · ketuk buat approve</div>
        </button>
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14, textAlign: "center" }}>
          <CheckCheck size={24} color={T.primary} strokeWidth={2.4} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginTop: 6 }}>Gak ada antaran aktif</div>
          <div style={{ fontSize: 12, color: T.faint, marginTop: 1 }}>Tabung isi udah aman di rumah</div>
        </div>
      )}

      <button className="w-full flex items-center justify-center gap-2" style={{ background: "transparent", border: `1px solid ${accent}55`, color: accent, fontSize: 14.5, fontWeight: 700, padding: 13, borderRadius: 14, cursor: "pointer" }}>
        <Repeat size={17} strokeWidth={2.4} /> Minta Tukar Tabung
      </button>
      <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 8 }}>Minta antaran ke agen — harga & bayar nyusul</div>
    </>
  );
}

function CustApprove({ st, set, accent, back }) {
  return (
    <>
      <ScreenTitle back={back} kicker={CUST_DROP.from} kickerColor={accent} title="Approve Antaran" status={st.approved ? <StatusPill status="confirmed" /> : <StatusPill status="pending" />} />
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: T.faint }}>{CUST_DROP.time}</div>
        <DropLine label="Terima (isi)" items={CUST_DROP.terima} color={T.isi} />
        <DropLine label="Balikin (kosong)" items={CUST_DROP.balikin} color={T.kosong} />
      </div>
      {st.approved ? (
        <div className="flex items-center gap-3" style={{ background: T.primarySoft, borderRadius: 14, padding: "14px 16px" }}>
          <CheckCheck size={22} color={T.primary} strokeWidth={2.5} />
          <div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.primaryDark }}>Antaran diterima</div><div style={{ fontSize: 12.5, color: T.sub }}>Konfirmasi terkirim ke Pak Budi</div></div>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center" }}>Kalau gak di-approve, otomatis beres 3 hari (ada bukti antar dari driver)</div>
      )}
    </>
  );
}

function CustRiwayat() {
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Riwayat Tukar</div>
      <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Antaran tabung ke rumah lo</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {CUST_RIWAYAT.map((r, i) => (
          <div key={i} className="flex items-center gap-3" style={{ padding: "12px 10px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
            <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 10, background: T.primarySoft }}><CheckCheck size={16} color={T.primary} strokeWidth={2.4} /></div>
            <div className="flex-1"><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{r.isi} isi diterima · {r.kosong} kosong dibalikin</div><div style={{ fontSize: 12, color: T.faint }}>{r.date} · {r.by}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}

function CustProfil() {
  const rows = [{ k: "Nama", v: "Bu Sari" }, { k: "Alamat", v: "Perum Griya Asri C-12" }, { k: "Agen langganan", v: "Agen Jaya" }];
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Profil</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div className="mx-auto flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, background: T.primarySoft, marginBottom: 10 }}><Home size={28} color={T.primary} strokeWidth={2.2} /></div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Bu Sari</div>
        <div style={{ fontSize: 12.5, color: T.faint }}>Customer · Griya Asri</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {rows.map((r, i) => (
          <div key={r.k} className="flex items-center justify-between" style={{ padding: "13px 12px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
            <span style={{ fontSize: 13.5, color: T.sub }}>{r.k}</span><span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{r.v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function CustomerApp() {
  const runtime = RUNTIME.customer;
  const accent = runtime.accent;
  const [screen, setScreen] = useState("beranda");
  const [appr, setAppr] = useState({ approved: false });
  // saldo: sebelum approve 0 isi / 2 kosong (nunggu tukar) → sesudah 2 isi / 0 kosong
  const saldo = appr.approved ? { isi: 2, kosong: 0 } : { isi: 0, kosong: 2 };

  const footer = screen === "approve" && !appr.approved
    ? <PrimaryAction label="Setuju & Terima" icon={Check} accent={accent} onClick={() => setAppr({ approved: true })} />
    : screen === "approve" && appr.approved
      ? <PrimaryAction label="Selesai" icon={CheckCheck} accent={accent} onClick={() => setScreen("beranda")} />
      : null;

  const showNav = ["beranda", "riwayat", "profil"].includes(screen);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "16px 0" }}>
      <RuntimeShell runtime={runtime} tenant="Bu Sari" context="Griya Asri C-12" footer={footer}>
        {screen === "beranda" && <CustBeranda saldo={saldo} approved={appr.approved} accent={accent} goApprove={() => setScreen("approve")} />}
        {screen === "approve" && <CustApprove st={appr} set={setAppr} accent={accent} back={() => setScreen("beranda")} />}
        {screen === "riwayat" && <CustRiwayat />}
        {screen === "profil" && <CustProfil />}
      </RuntimeShell>
      {showNav && (
        <div className="mx-auto" style={{ maxWidth: 384, marginTop: -1 }}>
          <BottomNav items={CUSTOMER_NAV} active={screen} onChange={setScreen} accent={accent} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN APP — back-office Agen Jaya. Dua inti:
//   (a) TERIMA dari distributor (intake push → nambah stok). Reuse MuatScreen.
//   (b) BIKIN PERINTAH ke driver (muatan + tujuan → tugas Truck B-1208).
// Reuse standard library; accent RUNTIME.admin (violet).
// ============================================================================
// Tujuan downstream yang bisa dimasukin ke perintah (dari STOPS yang bukan muat/setor).
// order = patokan permintaan tiap tujuan (CNG anchor; transship pake plan.keluar).
const DEST = STOPS.filter((s) => !["muat", "setor"].includes(s.type)).map((s) => ({
  id: s.id,
  name: s.name,
  order: s.type === "transship" ? s.plan.keluar : ((s.lines || []).find((l) => l.cls === "cng")?.keluar ?? 0),
}));
const SEED_TUGAS = [
  { id: "t0", truck: "B-1208 · Pak Budi", isi: 8, tujuan: 3, status: "jalan" },
];

function AdminBeranda({ stok, received, accent, goTerima, tugas, goBikin, goTugas }) {
  const inboxPending = !received;
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Agen Jaya · operasional</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 18 }}>Kantor</div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Stok gudang</div>
      <CountStrip isi={stok.isi} kosong={stok.kosong} />

      <div className="flex items-center gap-1.5" style={{ marginTop: 4, marginBottom: 8 }}>
        <Truck size={13} color={inboxPending ? T.pending : T.primary} strokeWidth={2.6} />
        <span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase" }}>Barang masuk · kiriman</span>
      </div>
      {inboxPending ? (
        <div style={{ background: T.surface, border: `1px solid ${T.pending}44`, borderRadius: T.radius, padding: 6, marginBottom: 16 }}>
          {INBOX.map((d) => (
            <button key={d.id} onClick={goTerima} className="w-full flex items-center gap-3" style={{ padding: "11px 10px", background: "none", border: "none", cursor: "pointer" }}>
              <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: `${T.pending}16` }}><Truck size={17} color={T.pending} strokeWidth={2.3} /></div>
              <div className="flex-1 text-left">
                <div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{d.name}</div>
                <div style={{ fontSize: 12, color: T.faint }}>Kiriman push · {stopInfo(d)} · terima &amp; konfirmasi</div>
              </div>
              <StatusPill status="pending" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3" style={{ background: T.primarySoft, borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
          <CheckCheck size={18} color={T.primary} strokeWidth={2.5} /><span style={{ fontSize: 12.5, color: T.primaryDark, fontWeight: 600 }}>Kiriman distributor diterima · masuk stok</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase" }}>Tugas aktif</span>
        <button onClick={goTugas} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: accent }}>Semua</button>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6, marginBottom: 14 }}>
        {tugas.length === 0 ? <div style={{ fontSize: 13, color: T.faint, textAlign: "center", padding: "14px 0" }}>Belum ada tugas hari ini.</div>
          : tugas.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3" style={{ padding: "11px 10px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
              <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: `${accent}14` }}><Truck size={17} color={accent} strokeWidth={2.3} /></div>
              <div className="flex-1"><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{t.truck}</div><div style={{ fontSize: 12, color: T.faint }}>{t.isi} tabung isi · {t.tujuan} tujuan</div></div>
              <StatusPill status={t.status === "jalan" ? "pending" : "confirmed"} />
            </div>
          ))}
      </div>

      <button onClick={goBikin} className="w-full flex items-center justify-center gap-2" style={{ background: accent, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, cursor: "pointer" }}>
        <Plus size={18} strokeWidth={2.8} /> Bikin Perintah Driver
      </button>
    </>
  );
}

function AdminBikin({ st, set, accent, back }) {
  const inMap = (id) => Object.prototype.hasOwnProperty.call(st.tujuan, id);
  const toggleDest = (d) => set((s) => {
    const t = { ...s.tujuan };
    if (inMap(d.id)) delete t[d.id]; else t[d.id] = d.order;
    return { ...s, tujuan: t };
  });
  const setQty = (id, delta) => set((s) => ({ ...s, tujuan: { ...s.tujuan, [id]: Math.max(0, (s.tujuan[id] || 0) + delta) } }));
  const total = Object.values(st.tujuan).reduce((a, b) => a + b, 0);
  const count = Object.keys(st.tujuan).length;
  return (
    <>
      <ScreenTitle back={back} kicker="Perintah baru" kickerColor={accent} title="Bikin Perintah Driver" />
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Driver &amp; truck</FieldLabel>
        <div className="flex items-center gap-3" style={{ padding: "10px 0 4px" }}>
          <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}14` }}><Truck size={18} color={accent} strokeWidth={2.3} /></div>
          <div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>Truck B-1208</div><div style={{ fontSize: 12.5, color: T.faint }}>Pak Budi</div></div>
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Tujuan &amp; patokan kirim ({count})</FieldLabel>
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          {DEST.map((d) => {
            const on = inMap(d.id);
            return (
              <div key={d.id} style={{ border: `1px solid ${on ? accent + "55" : T.line}`, background: on ? `${accent}0D` : "transparent", borderRadius: 12, padding: on ? "10px 12px 12px" : "10px 12px" }}>
                <button onClick={() => toggleDest(d)} className="w-full flex items-center gap-3" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                  <div className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: 7, background: on ? accent : "transparent", border: on ? "none" : `1px solid ${T.line}` }}>{on && <Check size={14} color="#fff" strokeWidth={3} />}</div>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: T.ink, textAlign: "left" }}>{d.name}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: T.faint }}>order {d.order}</span>
                </button>
                {on && (
                  <div className="flex items-center justify-between" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${accent}22` }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>Kirim {st.tujuan[d.id] !== d.order && <span style={{ color: T.pending, fontWeight: 600 }}>· beda dari order</span>}</span>
                    <Stepper value={st.tujuan[d.id]} color={accent} onDelta={(dl) => setQty(d.id, dl)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between" style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: 14, padding: "13px 15px", marginBottom: 14 }}>
        <div><div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.3, textTransform: "uppercase" }}>Total muatan isi</div><div style={{ fontSize: 11.5, color: T.sub }}>jumlah patokan {count} tujuan</div></div>
        <span style={{ fontSize: 24, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>{total}</span>
      </div>

      {st.terbit ? (
        <div className="flex items-center gap-3" style={{ background: T.primarySoft, borderRadius: 14, padding: "14px 16px" }}>
          <CheckCheck size={22} color={T.primary} strokeWidth={2.5} />
          <div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.primaryDark }}>Perintah terbit</div><div style={{ fontSize: 12.5, color: T.sub }}>Masuk ke app Pak Budi · {total} isi · {count} tujuan</div></div>
        </div>
      ) : (
        <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center" }}>Patokan kirim tiap tujuan jadi baseline serah di app driver</div>
      )}
    </>
  );
}

function AdminTugas({ tugas, accent }) {
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Tugas</div>
      <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Perintah yang diterbitin ke driver</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {tugas.map((t, i) => (
          <div key={t.id} className="flex items-center gap-3" style={{ padding: "12px 10px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
            <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: `${accent}14` }}><Truck size={16} color={accent} strokeWidth={2.4} /></div>
            <div className="flex-1"><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{t.truck}</div><div style={{ fontSize: 12, color: T.faint }}>{t.isi} tabung isi · {t.tujuan} tujuan</div></div>
            <StatusPill status={t.status === "jalan" ? "pending" : "confirmed"} />
          </div>
        ))}
      </div>
    </>
  );
}

function AdminProfil() {
  const rows = [{ k: "Nama", v: "Rina" }, { k: "Peran", v: "Admin operasional" }, { k: "Tenant", v: "Agen Jaya" }];
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Profil</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div className="mx-auto flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, background: "#7C3AED14", marginBottom: 10 }}><Warehouse size={26} color="#7C3AED" strokeWidth={2.2} /></div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Rina</div>
        <div style={{ fontSize: 12.5, color: T.faint }}>Admin · Agen Jaya</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {rows.map((r, i) => (
          <div key={r.k} className="flex items-center justify-between" style={{ padding: "13px 12px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
            <span style={{ fontSize: 13.5, color: T.sub }}>{r.k}</span><span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{r.v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function AdminApp() {
  const runtime = RUNTIME.admin;
  const accent = runtime.accent;
  const [screen, setScreen] = useState("beranda");
  const [received, setReceived] = useState(false);
  const [muat, setMuat] = useState({ loaded: [], conf: "idle", atNode: false });
  const [bikin, setBikin] = useState({ tujuan: {}, terbit: false });
  const [tugas, setTugas] = useState(SEED_TUGAS);

  const stok = { isi: 6 + (received ? bd(muat.loaded).isi : 0), kosong: 8 };
  const bikinTotal = Object.values(bikin.tujuan).reduce((a, b) => a + b, 0);
  const bikinCount = Object.keys(bikin.tujuan).length;

  const goTerima = () => { setMuat({ loaded: [], conf: "idle", atNode: false }); setScreen("terima"); };
  const commitTerima = () => { setReceived(true); setScreen("beranda"); };
  const goBikin = () => { setBikin({ tujuan: {}, terbit: false }); setScreen("bikin"); };
  const terbitkan = () => {
    setTugas((ts) => [{ id: "t" + ts.length, truck: "B-1208 · Pak Budi", isi: bikinTotal, tujuan: bikinCount, status: "jalan" }, ...ts]);
    setBikin((s) => ({ ...s, terbit: true }));
  };

  const footer = (() => {
    if (screen === "terima") {
      if (muat.conf === "idle") return <PrimaryAction label={`Selesai Terima — ${muat.loaded.length} tabung`} icon={CheckCheck} accent={accent} disabled={muat.loaded.length === 0} onClick={() => setMuat((s) => ({ ...s, conf: "pending" }))} />;
      if (muat.conf === "confirmed") return <PrimaryAction label="Masuk Stok — Selesai" icon={ChevronRight} accent={accent} onClick={commitTerima} />;
      return null;
    }
    if (screen === "bikin") {
      if (bikin.terbit) return <PrimaryAction label="Selesai" icon={CheckCheck} accent={accent} onClick={() => setScreen("beranda")} />;
      return <PrimaryAction label={`Terbitkan Perintah${bikinTotal ? ` — ${bikinTotal} isi` : ""}`} icon={Truck} accent={accent} disabled={!(bikinTotal > 0 && bikinCount > 0)} onClick={terbitkan} />;
    }
    return null;
  })();

  const showNav = ["beranda", "tugas", "profil"].includes(screen);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "16px 0" }}>
      <RuntimeShell runtime={runtime} tenant="Agen Jaya" context="Admin · Rina" footer={footer}>
        {screen === "beranda" && <AdminBeranda stok={stok} received={received} accent={accent} goTerima={goTerima} tugas={tugas} goBikin={goBikin} goTugas={() => setScreen("tugas")} />}
        {screen === "terima" && <MuatScreen stop={INBOX[0]} st={muat} set={setMuat} accent={accent} back={() => setScreen("beranda")} />}
        {screen === "bikin" && <AdminBikin st={bikin} set={setBikin} accent={accent} back={() => setScreen("beranda")} onTerbit={terbitkan} />}
        {screen === "tugas" && <AdminTugas tugas={tugas} accent={accent} />}
        {screen === "profil" && <AdminProfil />}
      </RuntimeShell>
      {showNav && (
        <div className="mx-auto" style={{ maxWidth: 384, marginTop: -1 }}>
          <BottomNav items={ADMIN_NAV} active={screen} onChange={setScreen} accent={accent} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DISTRIBUTOR TENANT (CNG Nusantara) — mirror Agen Jaya, satu tingkat di atas.
// Hilir = para agen. Beda inti: leg MOTHER STATION (isi/tukar + Nm³ harvest).
// Reuse standard library penuh; "Agen Jaya" cuma node tujuan di sini.
// ============================================================================
// PASOKAN (isi pool) — rute ke sumber. KIRIM (kuras pool) — rute ke hilir. Beda truck (doc 09).
const DIST_PASOKAN = [
  { id: "ms", name: "Mother Station Bekasi", type: "fill", dist: "hulu" },
];
const DIST_KIRIM = [
  { id: "ag1", name: "Agen Jaya", type: "agen", dist: "12 km", address: "Jl. Raya Serpong, Tangsel", lines: [{ cls: "cng", keluar: 12, masuk: 10 }] },
  { id: "ag2", name: "Agen Makmur", type: "agen", dist: "8 km", address: "Ciputat Timur", lines: [{ cls: "cng", keluar: 8, masuk: 6 }] },
];
const DIST_DEST = DIST_KIRIM.filter((s) => s.type === "agen").map((s) => ({ id: s.id, name: s.name, order: (s.lines.find((l) => l.cls === "cng") || {}).keluar || 0 }));
const DIST_SEED_TUGAS = [
  { id: "dt0", jenis: "kirim", truck: "B-9502 · Pak Heri", detail: "20 isi · 2 agen", status: "jalan" },
  { id: "dt1", jenis: "pasokan", truck: "B-9501 · Pak Joko", detail: "isi 20 di mother station", status: "selesai" },
];

// Leg mother station — KHUSUS distributor. Dua mode (doc 08 §2).
function MotherStationScreen({ st, set, accent, back }) {
  const isISI = st.mode === "isi";
  const locked = st.conf !== "idle";
  const scanFill = () => set((s) => ({ ...s, loaded: s.loaded.length < FULL.length ? [...s.loaded, FULL[s.loaded.length]] : s.loaded }));
  const scanOut = () => set((s) => ({ ...s, out: s.out.length < EMPTY.length ? [...s.out, EMPTY[s.out.length]] : s.out }));
  const scanIn = () => set((s) => ({ ...s, in: s.in.length < FULL.length ? [...s.in, FULL[s.in.length]] : s.in }));
  const cnt = isISI ? st.loaded.length : st.in.length;
  const suggest = cnt * 20;
  return (
    <>
      <ScreenTitle back={back} kicker="Mother Station Bekasi" kickerColor={accent} title="Isi CNG di Mother Station" status={locked ? <StatusPill status={st.conf === "pending" ? "pending" : "confirmed"} /> : null} />
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Mode</FieldLabel>
        <Toggle2 value={st.mode} onChange={(v) => { if (!locked) set((s) => ({ ...s, mode: v })); }} a={{ k: "isi", label: "Isi (refill)" }} b={{ k: "tukar", label: "Tukar tabung" }} />
        <div style={{ fontSize: 11.5, color: T.sub, marginTop: 8 }}>{isISI ? "Tabung sendiri di-refill — identitas tetap, scan sendiri buat catat fill-count + Nm³." : "Tukar tabung — identitas pindah, mother station ikut konfirmasi (bilateral)."}</div>
      </div>

      {!locked && isISI && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ marginBottom: 12 }}><ScanTarget onScan={scanFill} accent={accent} hint="Tap tiap tabung yang diisi (kosong → isi)" /></div>
          <SectionCard title="Tabung terisi · fill +1" right={<span style={{ fontSize: 13, fontWeight: 700, color: T.isi }}>{st.loaded.length}</span>}>
            {st.loaded.length === 0 ? <div style={{ fontSize: 13, color: T.faint, textAlign: "center", padding: "14px 0" }}>Belum ada. Scan buat mulai.</div> : [...st.loaded].reverse().map((id, i) => <CylinderRow key={id} id={id} state="isi" fresh={i === 0} />)}
          </SectionCard>
        </div>
      )}
      {!locked && !isISI && (
        <div style={{ marginBottom: 14 }}>
          <SectionCard title="Kosong keluar" right={<span style={{ fontSize: 12.5, fontWeight: 700, color: T.kosong }}>{st.out.length}</span>}>
            {st.out.map((id, i) => <CylinderRow key={id} id={id} state="kosong" fresh={i === st.out.length - 1} />)}
            <div style={{ marginTop: st.out.length ? 8 : 0 }}><ScanStrip label="Scan tabung kosong (keluar)" color={T.kosong} onScan={scanOut} /></div>
          </SectionCard>
          <div style={{ height: 10 }} />
          <SectionCard title="Isi masuk" right={<span style={{ fontSize: 12.5, fontWeight: 700, color: T.isi }}>{st.in.length}</span>}>
            {st.in.map((id, i) => <CylinderRow key={id} id={id} state="isi" fresh={i === st.in.length - 1} />)}
            <div style={{ marginTop: st.in.length ? 8 : 0 }}><ScanStrip label="Scan tabung isi (masuk)" color={T.isi} onScan={scanIn} /></div>
          </SectionCard>
        </div>
      )}

      {!locked && (
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
          <FieldLabel>Nm³ masuk (harvest)</FieldLabel>
          <TextField value={st.nm3} onChange={(v) => set((s) => ({ ...s, nm3: v.replace(/[^0-9.]/g, "") }))} placeholder="Total Nm³ dari dispenser" />
          {cnt > 0 && <button onClick={() => set((s) => ({ ...s, nm3: String(suggest) }))} style={{ background: "none", border: "none", padding: "7px 0 0", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: accent }}>≈ pakai {suggest} Nm³ ({cnt} × 20)</button>}
          <div style={{ fontSize: 11, color: T.faint, marginTop: 5 }}>Dicatat apa adanya — konversi energi/harga ditahan (commerce plane)</div>
        </div>
      )}

      {!isISI && locked && <ConfirmCeremony status={st.conf} counterparty="mother station" successSub="Tukar tercatat · Nm³ ke-harvest" onConfirm={() => set((s) => ({ ...s, conf: "confirmed" }))} />}
      {isISI && st.conf === "confirmed" && (
        <div className="flex items-center gap-3" style={{ background: T.primarySoft, borderRadius: 14, padding: "14px 16px" }}>
          <CheckCheck size={22} color={T.primary} strokeWidth={2.5} /><div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.primaryDark }}>Pengisian tercatat</div><div style={{ fontSize: 12.5, color: T.sub }}>{st.loaded.length} tabung · {st.nm3} Nm³ · fill-count +1</div></div>
        </div>
      )}
    </>
  );
}

function DistDriverBeranda({ routeType, setRouteType, route, truck, truckIsi, truckKosong, accent, done, goStop }) {
  const isPasokan = routeType === "pasokan";
  const sisa = route.filter((s) => !done.includes(s.id)).length;
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Jenis rute</div>
      <Toggle2 value={routeType} onChange={setRouteType} a={{ k: "pasokan", label: "Pasokan (isi)" }} b={{ k: "kirim", label: "Kirim (distribusi)" }} />
      <div className="flex items-center gap-2" style={{ margin: "10px 0 16px" }}>
        <Truck size={13} color={accent} strokeWidth={2.5} />
        <span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{truck} · {isPasokan ? "ke mother station, pulang isi" : "dari pool, turun ke agen"}</span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Muatan truck</div>
      <CountStrip isi={truckIsi} kosong={truckKosong} />

      <div className="flex items-center justify-between" style={{ margin: "4px 0 10px" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase" }}>{isPasokan ? "Rute pasokan" : "Rute kirim"}</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: T.faint }}>{sisa} tersisa</span>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {route.map((s, i) => {
          const meta = STOP_META[s.type]; const Icon = meta.icon; const fin = done.includes(s.id); const isFill = s.type === "fill";
          return (
            <button key={s.id} onClick={() => goStop(s)} className="w-full flex items-center gap-3" style={{ padding: "11px 10px", borderTop: i ? `1px solid ${T.line}` : "none", background: "none", border: "none", cursor: "pointer" }}>
              <div className="flex items-center justify-center" style={{ width: 22 }}><span style={{ fontSize: 12, fontWeight: 700, color: fin ? T.primary : T.faint }}>{fin ? "✓" : i + 1}</span></div>
              <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: fin ? T.primarySoft : (isFill ? `${accent}14` : T.bg) }}><Icon size={17} color={fin ? T.primary : (isFill ? accent : T.sub)} strokeWidth={2.3} /></div>
              <div className="flex-1 text-left">
                <div style={{ fontSize: 14.5, fontWeight: 700, color: fin ? T.faint : T.ink, textDecoration: fin ? "line-through" : "none" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: T.faint }}>{isFill ? "Isi / tukar CNG · harvest Nm³" : `${meta.tag} · ${s.lines[0].keluar} turun · ${s.lines[0].masuk} naik · ${s.dist}`}</div>
              </div>
              {!fin && <ChevronRight size={18} color={T.faint} />}
            </button>
          );
        })}
      </div>
    </>
  );
}

function DistDriverApp() {
  const runtime = RUNTIME.driver;
  const accent = runtime.accent;
  const [routeType, setRouteType] = useState("pasokan");
  const [screen, setScreen] = useState("beranda");
  const [done, setDone] = useState([]);
  // pasokan: berangkat bawa kosong (isi pool). kirim: berangkat bawa isi (kuras pool).
  const [truckIsi, setTruckIsi] = useState(0);
  const [truckKosong, setTruckKosong] = useState(20);
  const [activeStop, setActiveStop] = useState(null);
  const blankMs = { mode: "isi", loaded: [], out: [], in: [], nm3: "", conf: "idle" };
  const blankCer = { lines: {}, tsOut: [], tsIn: [], foto: false, note: "", conf: "idle", penerima: "", tsMode: "own", tsResolved: false, tsPlate: "", tsDriver: "" };
  const [ms, setMs] = useState(blankMs);
  const [cer, setCer] = useState(blankCer);

  const isPasokan = routeType === "pasokan";
  const route = isPasokan ? DIST_PASOKAN : DIST_KIRIM;
  const truck = isPasokan ? "Truck B-9501 · Pak Joko" : "Truck B-9502 · Pak Heri";

  const switchRoute = (t) => {
    setRouteType(t); setScreen("beranda"); setDone([]);
    if (t === "pasokan") { setTruckIsi(0); setTruckKosong(20); } else { setTruckIsi(20); setTruckKosong(0); }
  };
  const goStop = (s) => { setActiveStop(s); if (s.type === "fill") { setMs(blankMs); setScreen("fill"); } else { setCer({ ...blankCer, lines: initLines(s) }); setScreen("serah"); } };
  const backHome = () => setScreen("beranda");
  const commitFill = () => {
    const add = ms.mode === "isi" ? ms.loaded.length : ms.in.length;
    const outK = ms.mode === "tukar" ? ms.out.length : 0;
    setTruckIsi((n) => n + add); setTruckKosong((n) => Math.max(0, n - outK));
    setDone((d) => [...d, activeStop.id]); setScreen("beranda");
  };
  const commitSerah = () => { const cng = cer.lines.cng; if (cng) { setTruckIsi((n) => Math.max(0, n - cng.out.length)); setTruckKosong((n) => n + cng.in.length); } setDone((d) => [...d, activeStop.id]); setScreen("beranda"); };

  const footer = (() => {
    if (screen === "fill") {
      const cnt = ms.mode === "isi" ? ms.loaded.length : ms.in.length;
      const ready = cnt > 0 && ms.nm3.trim() && (ms.mode === "isi" || ms.out.length > 0);
      if (ms.conf === "confirmed") return <PrimaryAction label="Selesai — Masuk Truck" icon={ChevronRight} accent={accent} onClick={commitFill} />;
      if (ms.mode === "isi") return <PrimaryAction label={`Catat Pengisian — ${cnt} tabung`} icon={CheckCheck} accent={accent} disabled={!ready} onClick={() => setMs((s) => ({ ...s, conf: "confirmed" }))} />;
      return <PrimaryAction label="Minta Konfirmasi" icon={Check} accent={accent} disabled={!ready || ms.conf !== "idle"} onClick={() => setMs((s) => ({ ...s, conf: "pending" }))} />;
    }
    if (screen === "serah") {
      if (cer.conf === "confirmed") return <PrimaryAction label="Selesai — Lanjut Rute" icon={CheckCheck} accent={accent} onClick={commitSerah} />;
      if (cer.conf === "idle") return <PrimaryAction label="Minta Konfirmasi" icon={Check} accent={accent} disabled={!serahReady(cer)} onClick={() => setCer((s) => ({ ...s, conf: "pending" }))} />;
    }
    return null;
  })();

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "16px 0" }}>
      <RuntimeShell runtime={runtime} tenant="Distributor CNG Nusantara" context={truck} footer={footer}>
        {screen === "beranda" && <DistDriverBeranda routeType={routeType} setRouteType={switchRoute} route={route} truck={truck} truckIsi={truckIsi} truckKosong={truckKosong} accent={accent} done={done} goStop={goStop} />}
        {screen === "fill" && <MotherStationScreen st={ms} set={setMs} accent={accent} back={backHome} />}
        {screen === "serah" && activeStop && <HandoffScreen stop={activeStop} st={cer} set={setCer} accent={accent} back={backHome} />}
      </RuntimeShell>
    </div>
  );
}

function DistAdminBikin({ st, set, accent, back }) {
  const inMap = (id) => Object.prototype.hasOwnProperty.call(st.tujuan, id);
  const toggleDest = (d) => set((s) => { const t = { ...s.tujuan }; if (inMap(d.id)) delete t[d.id]; else t[d.id] = d.order; return { ...s, tujuan: t }; });
  const setQty = (id, dl) => set((s) => ({ ...s, tujuan: { ...s.tujuan, [id]: Math.max(0, (s.tujuan[id] || 0) + dl) } }));
  const total = Object.values(st.tujuan).reduce((a, b) => a + b, 0);
  const count = Object.keys(st.tujuan).length;
  return (
    <>
      <ScreenTitle back={back} kicker="Perintah baru" kickerColor={accent} title="Bikin Perintah Driver" />
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Driver &amp; truck</FieldLabel>
        <div className="flex items-center gap-3" style={{ padding: "10px 0 4px" }}>
          <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}14` }}><Truck size={18} color={accent} strokeWidth={2.3} /></div>
          <div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>Truck B-9501</div><div style={{ fontSize: 12.5, color: T.faint }}>Pak Joko · isi dulu di mother station</div></div>
        </div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Tujuan agen &amp; patokan kirim ({count})</FieldLabel>
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          {DIST_DEST.map((d) => {
            const on = inMap(d.id);
            return (
              <div key={d.id} style={{ border: `1px solid ${on ? accent + "55" : T.line}`, background: on ? `${accent}0D` : "transparent", borderRadius: 12, padding: on ? "10px 12px 12px" : "10px 12px" }}>
                <button onClick={() => toggleDest(d)} className="w-full flex items-center gap-3" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                  <div className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: 7, background: on ? accent : "transparent", border: on ? "none" : `1px solid ${T.line}` }}>{on && <Check size={14} color="#fff" strokeWidth={3} />}</div>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: T.ink, textAlign: "left" }}>{d.name}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: T.faint }}>order {d.order}</span>
                </button>
                {on && (
                  <div className="flex items-center justify-between" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${accent}22` }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: T.sub }}>Kirim {st.tujuan[d.id] !== d.order && <span style={{ color: T.pending, fontWeight: 600 }}>· beda dari order</span>}</span>
                    <Stepper value={st.tujuan[d.id]} color={accent} onDelta={(dl) => setQty(d.id, dl)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between" style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: 14, padding: "13px 15px", marginBottom: 14 }}>
        <div><div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.3, textTransform: "uppercase" }}>Target isi di mother station</div><div style={{ fontSize: 11.5, color: T.sub }}>jumlah patokan {count} agen</div></div>
        <span style={{ fontSize: 24, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>{total}</span>
      </div>
      {st.terbit ? (
        <div className="flex items-center gap-3" style={{ background: T.primarySoft, borderRadius: 14, padding: "14px 16px" }}>
          <CheckCheck size={22} color={T.primary} strokeWidth={2.5} /><div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.primaryDark }}>Perintah terbit</div><div style={{ fontSize: 12.5, color: T.sub }}>Ke Pak Joko · isi {total} di mother station · {count} agen</div></div>
        </div>
      ) : <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center" }}>Driver isi dulu di mother station, terus kirim ke agen sesuai patokan</div>}
    </>
  );
}

function DistAdminPasokan({ st, set, accent, back }) {
  const isISI = st.mode === "isi";
  return (
    <>
      <ScreenTitle back={back} kicker="Perintah pasokan" kickerColor={accent} title="Bikin Perintah Pasokan" />
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Sumber &amp; truck</FieldLabel>
        <div className="flex items-center gap-3" style={{ padding: "10px 0 4px" }}>
          <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 11, background: `${accent}14` }}><Fuel size={18} color={accent} strokeWidth={2.3} /></div>
          <div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>Mother Station Bekasi</div><div style={{ fontSize: 12.5, color: T.faint }}>Truck B-9501 · Pak Joko</div></div>
        </div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <FieldLabel>Mode</FieldLabel>
        <Toggle2 value={st.mode} onChange={(v) => set((s) => ({ ...s, mode: v }))} a={{ k: "isi", label: "Isi (refill)" }} b={{ k: "tukar", label: "Tukar tabung" }} />
        <div style={{ fontSize: 11.5, color: T.sub, marginTop: 8 }}>{isISI ? "Refill tabung sendiri — identitas tetap." : "Tukar tabung — identitas pindah, bilateral."}</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
        <div className="flex items-center justify-between">
          <div><FieldLabel>Target isi</FieldLabel><span style={{ fontSize: 12, color: T.faint }}>Berapa tabung di-refill/tukar</span></div>
          <Stepper value={st.target} color={accent} onDelta={(d) => set((s) => ({ ...s, target: Math.max(0, s.target + d) }))} />
        </div>
      </div>
      {st.terbit ? (
        <div className="flex items-center gap-3" style={{ background: T.primarySoft, borderRadius: 14, padding: "14px 16px" }}>
          <CheckCheck size={22} color={T.primary} strokeWidth={2.5} /><div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.primaryDark }}>Perintah pasokan terbit</div><div style={{ fontSize: 12.5, color: T.sub }}>Ke Pak Joko · {st.mode} {st.target} di mother station</div></div>
        </div>
      ) : <div style={{ fontSize: 11.5, color: T.faint, textAlign: "center" }}>Truck pasokan berangkat bawa kosong, pulang isi → masuk pool</div>}
    </>
  );
}

function DistTugasRow({ t, accent, top }) {
  const isPasok = t.jenis === "pasokan";
  return (
    <div className="flex items-center gap-3" style={{ padding: "11px 10px", borderTop: top ? `1px solid ${T.line}` : "none" }}>
      <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: isPasok ? `${accent}14` : `${T.isi}14` }}>{isPasok ? <Fuel size={17} color={accent} strokeWidth={2.3} /> : <Truck size={17} color={T.isi} strokeWidth={2.3} />}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2"><span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{t.truck}</span><span style={{ fontSize: 9.5, fontWeight: 700, color: isPasok ? accent : T.isi, background: isPasok ? `${accent}14` : `${T.isi}14`, borderRadius: 999, padding: "2px 7px", textTransform: "uppercase", letterSpacing: 0.3 }}>{isPasok ? "Pasokan" : "Kirim"}</span></div>
        <div style={{ fontSize: 12, color: T.faint }}>{t.detail}</div>
      </div>
      <StatusPill status={t.status === "jalan" ? "pending" : "confirmed"} />
    </div>
  );
}

function DistAdminTugas({ tugas, accent }) {
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Tugas</div>
      <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Perintah pasokan &amp; kirim ke driver</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {tugas.map((t, i) => <DistTugasRow key={t.id} t={t} accent={accent} top={i > 0} />)}
      </div>
    </>
  );
}

function DistAdminProfil() {
  const rows = [{ k: "Nama", v: "Sinta" }, { k: "Peran", v: "Admin operasional" }, { k: "Tenant", v: "Distributor CNG Nusantara" }];
  return (
    <>
      <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Profil</div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div className="mx-auto flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, background: "#7C3AED14", marginBottom: 10 }}><Warehouse size={26} color="#7C3AED" strokeWidth={2.2} /></div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Sinta</div>
        <div style={{ fontSize: 12.5, color: T.faint }}>Admin · Distributor CNG Nusantara</div>
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {rows.map((r, i) => (
          <div key={r.k} className="flex items-center justify-between" style={{ padding: "13px 12px", borderTop: i ? `1px solid ${T.line}` : "none" }}>
            <span style={{ fontSize: 13.5, color: T.sub }}>{r.k}</span><span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{r.v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function DistAdminApp() {
  const runtime = RUNTIME.admin;
  const accent = runtime.accent;
  const [screen, setScreen] = useState("beranda");
  const [kirim, setKirim] = useState({ tujuan: {}, terbit: false });
  const [pasok, setPasok] = useState({ mode: "isi", target: 0, terbit: false });
  const [tugas, setTugas] = useState(DIST_SEED_TUGAS);
  const kTotal = Object.values(kirim.tujuan).reduce((a, b) => a + b, 0);
  const kCount = Object.keys(kirim.tujuan).length;

  const goKirim = () => { setKirim({ tujuan: {}, terbit: false }); setScreen("kirim"); };
  const goPasok = () => { setPasok({ mode: "isi", target: 12, terbit: false }); setScreen("pasokan"); };
  const terbitKirim = () => { setTugas((ts) => [{ id: "dt" + ts.length, jenis: "kirim", truck: "B-9502 · Pak Heri", detail: `${kTotal} isi · ${kCount} agen`, status: "jalan" }, ...ts]); setKirim((s) => ({ ...s, terbit: true })); };
  const terbitPasok = () => { setTugas((ts) => [{ id: "dt" + ts.length, jenis: "pasokan", truck: "B-9501 · Pak Joko", detail: `${pasok.mode} ${pasok.target} di mother station`, status: "jalan" }, ...ts]); setPasok((s) => ({ ...s, terbit: true })); };

  const footer = (() => {
    if (screen === "kirim") {
      if (kirim.terbit) return <PrimaryAction label="Selesai" icon={CheckCheck} accent={accent} onClick={() => setScreen("beranda")} />;
      return <PrimaryAction label={`Terbitkan Kirim${kTotal ? ` — ${kTotal} isi` : ""}`} icon={Truck} accent={accent} disabled={!(kTotal > 0 && kCount > 0)} onClick={terbitKirim} />;
    }
    if (screen === "pasokan") {
      if (pasok.terbit) return <PrimaryAction label="Selesai" icon={CheckCheck} accent={accent} onClick={() => setScreen("beranda")} />;
      return <PrimaryAction label={`Terbitkan Pasokan${pasok.target ? ` — ${pasok.target} tabung` : ""}`} icon={Fuel} accent={accent} disabled={!(pasok.target > 0)} onClick={terbitPasok} />;
    }
    return null;
  })();

  const showNav = ["beranda", "tugas", "profil"].includes(screen);
  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "16px 0" }}>
      <RuntimeShell runtime={runtime} tenant="Distributor CNG Nusantara" context="Admin · Sinta" footer={footer}>
        {screen === "beranda" && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Distributor CNG Nusantara · operasional</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 18 }}>Kantor</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Stok pool</div>
            <CountStrip isi={18} kosong={26} />
            <div className="flex items-center gap-3" style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: 14, padding: "12px 14px", margin: "4px 0 16px" }}>
              <Repeat size={17} color={accent} strokeWidth={2.3} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>Pasokan ngisi pool · kirim ngurasin ke agen</span>
            </div>
            <div className="flex items-center justify-between mb-2"><span style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase" }}>Tugas aktif</span><button onClick={() => setScreen("tugas")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: accent }}>Semua</button></div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6, marginBottom: 16 }}>
              {tugas.map((t, i) => <DistTugasRow key={t.id} t={t} accent={accent} top={i > 0} />)}
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={goPasok} className="w-full flex items-center justify-center gap-2" style={{ background: "transparent", border: `1px solid ${accent}66`, color: accent, fontSize: 14.5, fontWeight: 700, padding: 13, borderRadius: 14, cursor: "pointer" }}><Fuel size={17} strokeWidth={2.5} /> Perintah Pasokan (isi)</button>
              <button onClick={goKirim} className="w-full flex items-center justify-center gap-2" style={{ background: accent, border: "none", color: "#fff", fontSize: 15, fontWeight: 700, padding: 14, borderRadius: 14, cursor: "pointer" }}><Truck size={18} strokeWidth={2.6} /> Perintah Kirim (distribusi)</button>
            </div>
          </>
        )}
        {screen === "pasokan" && <DistAdminPasokan st={pasok} set={setPasok} accent={accent} back={() => setScreen("beranda")} />}
        {screen === "kirim" && <DistAdminBikin st={kirim} set={setKirim} accent={accent} back={() => setScreen("beranda")} />}
        {screen === "tugas" && <DistAdminTugas tugas={tugas} accent={accent} />}
        {screen === "profil" && <DistAdminProfil />}
      </RuntimeShell>
      {showNav && <div className="mx-auto" style={{ maxWidth: 384, marginTop: -1 }}><BottomNav items={ADMIN_NAV} active={screen} onChange={setScreen} accent={accent} /></div>}
    </div>
  );
}

// ============================================================================
// INVESTOR APP — observer murni, owner tabung, read-only, projection-only.
// Lintas tenant, scoped ke aset sendiri. Headline = FILL-COUNT (basis bagi-hasil).
// SATU-SATUNYA runtime yang boleh agregat/chart (visibility plane, doc 10/11).
// ============================================================================
const INVESTOR_NAV = [
  { key: "portfolio", label: "Portfolio", I: Layers },
  { key: "sebaran", label: "Sebaran", I: MapPin },
  { key: "tabung", label: "Tabung", I: Package },
  { key: "profil", label: "Profil", I: User },
];
const INV = { name: "H. Rahmat", aktif: 372, perluCek: 6, pensiun: 2, idle: 5, totalFill: 4210 };
const INV_WILAYAH = [{ k: "Tangsel", v: 180 }, { k: "Bekasi", v: 120 }, { k: "Bogor", v: 74 }]; // kab/kota — aman
const INV_HOLDER = [{ k: "Agen Jaya", v: 150 }, { k: "Distributor CNG Nusantara", v: 84 }, { k: "Beredar di pelanggan", v: 100, anon: true }, { k: "Gudang transit", v: 40 }];
const INV_TABUNG = [
  { id: "A-1130", fill: 489, status: "cek", holder: "Distributor CNG Nusantara", umur: "5 th", note: "mepet inspeksi", trail: "beli dari Investor Andi · 2023" },
  { id: "A-1042", fill: 312, status: "aktif", holder: "Agen Jaya", umur: "3 th" },
  { id: "A-0820", fill: 298, status: "aktif", holder: "Beredar di pelanggan", umur: "3 th" },
  { id: "A-0901", fill: 18, status: "aktif", holder: "Gudang transit", umur: "4 bln" },
  { id: "A-0700", fill: 512, status: "pensiun", holder: "Gudang transit", umur: "7 th", note: "lewat batas isi-ulang" },
];
const INV_STATUS = { aktif: { c: "#1D9E75", l: "Aktif" }, cek: { c: "#E2912C", l: "Perlu cek" }, pensiun: { c: "#9AA8A1", l: "Pensiun" } };

function StatTile({ label, value, sub, accent, Icon, full }) {
  return (
    <div style={{ flex: full ? "1 1 100%" : "1 1 0", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 14 }}>
      <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>{Icon && <Icon size={14} color={accent} strokeWidth={2.5} />}<span style={{ fontSize: 11, fontWeight: 700, color: T.faint, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</span></div>
      <div style={{ fontSize: 26, fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: T.sub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Bar({ label, value, max, color, anon }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{label}{anon && <span style={{ fontSize: 10.5, fontWeight: 700, color: T.faint, marginLeft: 6, background: T.bg, borderRadius: 999, padding: "1px 7px" }}>anonim</span>}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      <div style={{ height: 8, background: T.bg, borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999 }} /></div>
    </div>
  );
}

function InvTabungRow({ t, accent, onTap, top }) {
  const st = INV_STATUS[t.status];
  return (
    <button onClick={onTap} className="w-full flex items-center gap-3" style={{ padding: "12px 10px", borderTop: top ? `1px solid ${T.line}` : "none", background: "none", border: "none", cursor: "pointer" }}>
      <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: `${accent}10` }}><Activity size={16} color={accent} strokeWidth={2.4} /></div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2"><span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink, fontVariantNumeric: "tabular-nums" }}>{t.id}</span><span style={{ width: 7, height: 7, borderRadius: 999, background: st.c }} /><span style={{ fontSize: 11.5, fontWeight: 600, color: st.c }}>{st.l}</span></div>
        <div style={{ fontSize: 12, color: T.faint }}>{t.holder} · {t.umur}</div>
      </div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 15, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>{t.fill}</div><div style={{ fontSize: 10, color: T.faint }}>isi-ulang</div></div>
    </button>
  );
}

function InvTabungDetail({ t, accent, back }) {
  const st = INV_STATUS[t.status];
  const rows = [["Status", st.l], ["Holder sekarang", t.holder], ["Umur", t.umur], ["Trail pemodal", t.trail || "asli (belum pernah dijual)"]];
  return (
    <>
      <ScreenTitle back={back} kicker="Detail tabung" kickerColor={accent} title={t.id} />
      <div style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: T.radius, padding: 18, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, letterSpacing: 0.4, textTransform: "uppercase" }}>Total isi-ulang (basis bagi-hasil)</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{t.fill}</div>
        <div style={{ fontSize: 12, color: T.sub }}>kali tabung ini produktif</div>
      </div>
      {t.note && <div className="flex items-center gap-2.5" style={{ background: `${T.pending}0D`, border: `1px solid ${T.pending}44`, borderRadius: 13, padding: "11px 13px", marginBottom: 14 }}><AlertTriangle size={16} color={T.pending} strokeWidth={2.4} /><span style={{ fontSize: 12.5, color: T.pending, fontWeight: 600 }}>{t.note}</span></div>}
      <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
        {rows.map(([k, v], i) => <div key={k} className="flex items-center justify-between" style={{ padding: "13px 12px", borderTop: i ? `1px solid ${T.line}` : "none" }}><span style={{ fontSize: 13, color: T.sub }}>{k}</span><span style={{ fontSize: 13, fontWeight: 700, color: T.ink, textAlign: "right", maxWidth: "60%" }}>{v}</span></div>)}
      </div>
      <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 12 }}>Read-only · operasi internal tenant gak ditampilkan</div>
    </>
  );
}

function InvestorApp() {
  const runtime = RUNTIME.investor;
  const accent = runtime.accent;
  const [screen, setScreen] = useState("portfolio");
  const [pick, setPick] = useState(null);
  const total = INV.aktif + INV.pensiun;
  const wMax = Math.max(...INV_WILAYAH.map((x) => x.v));
  const hMax = Math.max(...INV_HOLDER.map((x) => x.v));
  const showNav = ["portfolio", "sebaran", "tabung", "profil"].includes(screen) && !pick;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "16px 0" }}>
      <RuntimeShell runtime={runtime} tenant="H. Rahmat" context="Investor · read-only" footer={null}>
        {screen === "portfolio" && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Armada saya</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.ink, marginBottom: 16 }}>{total} tabung</div>
            <div style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: T.radius, padding: 18, marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, letterSpacing: 0.4, textTransform: "uppercase" }}>Total isi-ulang · basis bagi-hasil</div>
              <div style={{ fontSize: 42, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{INV.totalFill.toLocaleString("id-ID")}</div>
              <div style={{ fontSize: 12, color: T.sub }}>kali armada produktif</div>
            </div>
            <div className="flex gap-2" style={{ marginBottom: 12 }}>
              <StatTile label="Aktif" value={INV.aktif} accent={T.primary} Icon={TrendingUp} />
              <StatTile label="Perlu cek" value={INV.perluCek} accent={T.pending} Icon={AlertTriangle} />
              <StatTile label="Pensiun" value={INV.pensiun} accent={T.kosong} Icon={Clock} />
            </div>
            <div className="flex items-center gap-2.5" style={{ background: `${T.pending}0D`, border: `1px solid ${T.pending}44`, borderRadius: 13, padding: "12px 14px", marginBottom: 16 }}>
              <AlertTriangle size={17} color={T.pending} strokeWidth={2.4} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>{INV.perluCek} mepet inspeksi · {INV.idle} idle &gt;30 hari</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Sebaran wilayah</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "14px 16px 4px" }}>
              {INV_WILAYAH.map((w) => <Bar key={w.k} label={w.k} value={w.v} max={wMax} color={accent} />)}
            </div>
            <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 10 }}>20 tabung pernah dijual ke Agen Jaya (2024) — keluar portfolio</div>
          </>
        )}

        {screen === "sebaran" && (
          <>
            <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Sebaran</div>
            <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Di wilayah mana &amp; di tangan siapa</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Per wilayah (kab/kota)</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "14px 16px 4px", marginBottom: 18 }}>
              {INV_WILAYAH.map((w) => <Bar key={w.k} label={w.k} value={w.v} max={wMax} color={accent} />)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Per holder (akuntabilitas)</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "14px 16px 4px" }}>
              {INV_HOLDER.map((h) => <Bar key={h.k} label={h.k} value={h.v} max={hMax} color={h.anon ? T.kosong : T.primaryDark} anon={h.anon} />)}
            </div>
            <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 10 }}>Holder sampai level tenant · pelanggan akhir dianonimkan · operasi internal gak ditampilkan</div>
          </>
        )}

        {screen === "tabung" && (
          <>
            <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Tabung</div>
            <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Diurut dari paling produktif · ketuk buat detail</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
              {INV_TABUNG.map((t, i) => <InvTabungRow key={t.id} t={t} accent={accent} top={i > 0} onTap={() => { setPick(t); setScreen("detail"); }} />)}
            </div>
          </>
        )}

        {screen === "detail" && pick && <InvTabungDetail t={pick} accent={accent} back={() => { setPick(null); setScreen("tabung"); }} />}

        {screen === "profil" && (
          <>
            <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Profil</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 18, marginBottom: 14, textAlign: "center" }}>
              <div className="mx-auto flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, background: `${accent}14`, marginBottom: 10 }}><Wallet size={26} color={accent} strokeWidth={2.2} /></div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>{INV.name}</div>
              <div style={{ fontSize: 12.5, color: T.faint }}>Investor tabung · pemodal aset</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
              {[["Peran", "Pemodal aset (owner tabung)"], ["Akses", "Read-only · lintas tenant"], ["Scope", "Aset milik sendiri"]].map(([k, v], i) => <div key={k} className="flex items-center justify-between" style={{ padding: "13px 12px", borderTop: i ? `1px solid ${T.line}` : "none" }}><span style={{ fontSize: 13, color: T.sub }}>{k}</span><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{v}</span></div>)}
            </div>
          </>
        )}
      </RuntimeShell>
      {showNav && <div className="mx-auto" style={{ maxWidth: 384, marginTop: -1 }}><BottomNav items={INVESTOR_NAV} active={screen} onChange={(k) => { setPick(null); setScreen(k); }} accent={accent} /></div>}
    </div>
  );
}

// ============================================================================
// PERTAGAS APP — observer murni, owner GAS, read-only, projection-only.
// "Investor view-nya gas": dimensi Nm³. Sebaran lapisan/wilayah + tren adopsi.
// Volume doang — commerce (MMBTU/harga) ditahan (doc 12).
// ============================================================================
const PERTAGAS_NAV = [
  { key: "ringkasan", label: "Ringkasan", I: Fuel },
  { key: "tren", label: "Tren", I: TrendingUp },
  { key: "sebaran", label: "Sebaran", I: MapPin },
  { key: "profil", label: "Profil", I: User },
];
const PTG = { beredar: 48200, masyarakat: 19400, agen: 16800, distributor: 12000, delta: 12, konsumsiBulan: 43100 };
const PTG_TREN = [{ m: "Jan", v: 31000 }, { m: "Feb", v: 34500 }, { m: "Mar", v: 37800 }, { m: "Apr", v: 41200 }, { m: "Mei", v: 44900 }, { m: "Jun", v: 48200 }];
const PTG_LAPISAN = [{ k: "Di masyarakat", v: 19400, anon: true }, { k: "Di agen", v: 16800 }, { k: "Di distributor", v: 12000 }];
const PTG_WILAYAH = [{ k: "Tangsel", v: 18200 }, { k: "Bekasi", v: 15400 }, { k: "Bogor", v: 14600 }];
const PTG_STATION = [{ k: "Mother Station Bekasi", v: 28800 }, { k: "Mother Station Serpong", v: 19400 }];
const nm3 = (n) => n.toLocaleString("id-ID");

function TrendBars({ data, accent, unit }) {
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div>
      <div className="flex items-end justify-between" style={{ height: 130, gap: 6 }}>
        {data.map((d, i) => {
          const h = Math.round((d.v / max) * 100);
          const last = i === data.length - 1;
          return (
            <div key={d.m} className="flex flex-col items-center justify-end" style={{ flex: 1, height: "100%" }}>
              {last && <span style={{ fontSize: 10, fontWeight: 700, color: accent, marginBottom: 4 }}>{nm3(d.v)}</span>}
              <div style={{ width: "100%", height: `${h}%`, background: last ? accent : `${accent}55`, borderRadius: "6px 6px 0 0", transition: "height .3s" }} />
              <span style={{ fontSize: 10, color: T.faint, marginTop: 5 }}>{d.m}</span>
            </div>
          );
        })}
      </div>
      {unit && <div style={{ fontSize: 10.5, color: T.faint, textAlign: "right", marginTop: 6 }}>{unit}</div>}
    </div>
  );
}

function PertagasApp() {
  const runtime = RUNTIME.pertagas;
  const accent = runtime.accent;
  const [screen, setScreen] = useState("ringkasan");
  const wMax = Math.max(...PTG_WILAYAH.map((x) => x.v));
  const lMax = Math.max(...PTG_LAPISAN.map((x) => x.v));
  const sMax = Math.max(...PTG_STATION.map((x) => x.v));
  const showNav = ["ringkasan", "tren", "sebaran", "profil"].includes(screen);
  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "16px 0" }}>
      <RuntimeShell runtime={runtime} tenant="Pertagas" context="Owner gas · read-only" footer={null}>
        {screen === "ringkasan" && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 3 }}>Gas beredar</div>
            <div style={{ background: `${accent}0D`, border: `1px solid ${accent}33`, borderRadius: T.radius, padding: 18, margin: "8px 0 12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.faint, letterSpacing: 0.4, textTransform: "uppercase" }}>Total Nm³ beredar</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{nm3(PTG.beredar)}</div>
              <div className="flex items-center justify-center gap-1" style={{ fontSize: 12.5, color: T.primary, fontWeight: 700 }}><TrendingUp size={14} strokeWidth={2.6} /> naik {PTG.delta}% vs bulan lalu</div>
            </div>
            <div className="flex gap-2" style={{ marginBottom: 14 }}>
              <StatTile label="Di masyarakat" value={nm3(PTG.masyarakat)} accent={accent} Icon={Home} />
              <StatTile label="Di agen" value={nm3(PTG.agen)} accent={accent} Icon={Package} />
              <StatTile label="Di distributor" value={nm3(PTG.distributor)} accent={accent} Icon={Truck} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Tren penggunaan (Nm³ ter-fill)</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "16px 16px 10px" }}>
              <TrendBars data={PTG_TREN} accent={accent} unit="Nm³ / bulan" />
            </div>
            <div className="flex items-center gap-2.5" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 13, padding: "12px 14px", marginTop: 14 }}>
              <Activity size={17} color={accent} strokeWidth={2.4} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>Laju konsumsi ~{nm3(PTG.konsumsiBulan)} Nm³/bulan</span>
            </div>
          </>
        )}
        {screen === "tren" && (
          <>
            <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Tren Penggunaan</div>
            <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Kurva adopsi CNG dari waktu ke waktu</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "18px 16px 12px", marginBottom: 14 }}>
              <TrendBars data={PTG_TREN} accent={accent} unit="Nm³ ter-fill / bulan" />
            </div>
            <div className="flex items-center gap-2.5" style={{ background: `${T.primary}0D`, border: `1px solid ${T.primary}33`, borderRadius: 13, padding: "12px 14px" }}>
              <TrendingUp size={17} color={T.primary} strokeWidth={2.5} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>+{PTG.delta}% MoM · adopsi naik konsisten 6 bulan</span>
            </div>
            <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 12 }}>Volume murni · konversi energi/harga ditahan (commerce plane)</div>
          </>
        )}
        {screen === "sebaran" && (
          <>
            <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Sebaran</div>
            <div style={{ fontSize: 12.5, color: T.faint, marginBottom: 16 }}>Nm³ ada di lapisan & wilayah mana</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Per lapisan rantai</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "14px 16px 4px", marginBottom: 18 }}>
              {PTG_LAPISAN.map((l) => <Bar key={l.k} label={l.k} value={l.v} max={lMax} color={l.anon ? T.kosong : accent} anon={l.anon} />)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Per wilayah (kab/kota)</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "14px 16px 4px", marginBottom: 18 }}>
              {PTG_WILAYAH.map((w) => <Bar key={w.k} label={w.k} value={w.v} max={wMax} color={accent} />)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>Throughput mother station</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "14px 16px 4px" }}>
              {PTG_STATION.map((s) => <Bar key={s.k} label={s.k} value={s.v} max={sMax} color={T.primaryDark} />)}
            </div>
            <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 10 }}>Lapisan agregat · masyarakat dianonimkan · operasi internal gak ditampilkan</div>
          </>
        )}
        {screen === "profil" && (
          <>
            <div style={{ fontSize: 21, fontWeight: 700, color: T.ink, marginBottom: 16 }}>Profil</div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 18, marginBottom: 14, textAlign: "center" }}>
              <div className="mx-auto flex items-center justify-center" style={{ width: 64, height: 64, borderRadius: 999, background: `${accent}14`, marginBottom: 10 }}><Fuel size={26} color={accent} strokeWidth={2.2} /></div>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.ink }}>Pertagas</div>
              <div style={{ fontSize: 12.5, color: T.faint }}>Owner gas · observer volume</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
              {[["Peran", "Pemilik gas (owner content)"], ["Akses", "Read-only · lintas tenant"], ["Dimensi", "Nm³ (volume)"], ["Commerce", "Ditahan (MMBTU/harga nyusul)"]].map(([k, v], i) => <div key={k} className="flex items-center justify-between" style={{ padding: "13px 12px", borderTop: i ? `1px solid ${T.line}` : "none" }}><span style={{ fontSize: 13, color: T.sub }}>{k}</span><span style={{ fontSize: 13, fontWeight: 700, color: T.ink, textAlign: "right", maxWidth: "58%" }}>{v}</span></div>)}
            </div>
          </>
        )}
      </RuntimeShell>
      {showNav && <div className="mx-auto" style={{ maxWidth: 384, marginTop: -1 }}><BottomNav items={PERTAGAS_NAV} active={screen} onChange={setScreen} accent={accent} /></div>}
    </div>
  );
}

// ============================================================================
// COMMERCE PLANE (mock) — hop customer→agen. BACA serah confirmed (doc 13).
// Yang ditagih = GAS (isi), bukan tabung. Rail bank di-MOCK. Decoupled dari custody.
// Gaspink tau kapan/berapa/siapa → lempar ke rail. BUKAN bank.
// ============================================================================
const TARIF_ISI = 18000; // mock tarif per tabung isi (D44 ditunda)
const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");
const COM_PAYMENTS = [
  { id: "p1", who: "Bu Sari", isi: 2, status: "pending", when: "14:20" },
  { id: "p2", who: "Toko Berkah", isi: 5, status: "lunas", when: "11:05" },
  { id: "p3", who: "Warung Jaya", isi: 4, status: "pending", when: "13:40" },
  { id: "p4", who: "Pak Andi", isi: 3, status: "lunas", when: "09:15" },
];

function QRMock({ size = 168 }) {
  const n = 13, cell = size / n, dark = "#0F172A";
  const on = (r, c) => {
    const finder = (R, C) => R < 3 && C < 3;
    if (finder(r, c) || finder(r, n - 1 - c) || finder(n - 1 - r, c)) {
      const rr = r % (n), cc = c; const fr = r < 3 ? r : n - 1 - r; const fc = (c < 3) ? c : (n - 1 - c);
      const inFinderCol = (c < 3 || c >= n - 3);
      if (inFinderCol && (r < 3 || r >= n - 3)) { const a = r < 3 ? r : n - 1 - r; const b = c < 3 ? c : n - 1 - c; return a === 0 || a === 2 || b === 0 || b === 2 || (a === 1 && b === 1) ? false : true ? !(a === 1 || b === 1) : true; }
    }
    return ((r * 7 + c * 13 + (r ^ c) * 5) % 3) === 0;
  };
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push(<div key={r + "-" + c} style={{ width: cell, height: cell, background: on(r, c) ? dark : "transparent" }} />);
  return <div style={{ width: size, height: size, display: "grid", gridTemplateColumns: `repeat(${n}, ${cell}px)`, background: "#fff", padding: 8, borderRadius: 14, border: `1px solid ${T.line}` }}>{cells}</div>;
}

function CommerceCustomer({ accent }) {
  const [paid, setPaid] = useState(false);
  const isi = 2, total = isi * TARIF_ISI;
  const runtime = RUNTIME.commerce;
  const footer = paid
    ? <PrimaryAction label="Selesai" icon={CheckCheck} accent={accent} onClick={() => setPaid(false)} />
    : <PrimaryAction label={`Sudah Bayar (simulasi) — ${rupiah(total)}`} icon={Check} accent={accent} onClick={() => setPaid(true)} />;
  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "8px 0 16px" }}>
      <RuntimeShell runtime={runtime} tenant="Bu Sari" context="Pembayaran ke Agen Jaya" footer={footer}>
        <div className="flex items-center gap-2.5" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 13, padding: "11px 13px", marginBottom: 14 }}>
          <CheckCheck size={16} color={T.primary} strokeWidth={2.4} /><span style={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>Serah terima · hari ini 14:20 · sudah diterima</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Tagihan</div>
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 16, marginBottom: 14 }}>
          <div className="flex items-center justify-between" style={{ paddingBottom: 10, borderBottom: `1px solid ${T.line}` }}>
            <div><div style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>2 tabung CNG isi</div><div style={{ fontSize: 12, color: T.faint }}>@ {rupiah(TARIF_ISI)}</div></div>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{rupiah(total)}</span>
          </div>
          <div className="flex items-center justify-between" style={{ padding: "10px 0", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontSize: 13.5, color: T.sub }}>2 tabung kosong dibalikin</span><span style={{ fontSize: 13, fontWeight: 600, color: T.kosong }}>—</span>
          </div>
          <div className="flex items-center justify-between" style={{ paddingTop: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Total</span><span style={{ fontSize: 20, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>{rupiah(total)}</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginBottom: 14 }}>Tabung gak ditagih — cuma gas-nya (tabung ditukar)</div>
        {paid ? (
          <div className="flex flex-col items-center" style={{ background: T.primarySoft, borderRadius: T.radius, padding: "22px 16px" }}>
            <CheckCheck size={34} color={T.primary} strokeWidth={2.4} />
            <div style={{ fontSize: 16, fontWeight: 700, color: T.primaryDark, marginTop: 8 }}>Lunas</div>
            <div style={{ fontSize: 12.5, color: T.sub }}>{rupiah(total)} · terkirim ke Agen Jaya</div>
          </div>
        ) : (
          <div className="flex flex-col items-center" style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: "18px 16px" }}>
            <QRMock />
            <div className="flex items-center gap-1.5" style={{ marginTop: 12 }}><QrCode size={15} color={accent} strokeWidth={2.5} /><span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Scan QRIS buat bayar</span></div>
            <div style={{ fontSize: 11.5, color: T.faint, marginTop: 2 }}>Bayar lewat bank / e-wallet apa aja</div>
          </div>
        )}
        <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 12 }}>Barang udah diterima — pembayaran ini terpisah (gak ngeblok serah)</div>
      </RuntimeShell>
    </div>
  );
}

function PayRow({ p, accent, top }) {
  const lunas = p.status === "lunas";
  const total = p.isi * TARIF_ISI;
  return (
    <div className="flex items-center gap-3" style={{ padding: "12px 10px", borderTop: top ? `1px solid ${T.line}` : "none" }}>
      <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 11, background: lunas ? T.primarySoft : `${T.pending}16` }}>{lunas ? <CheckCheck size={16} color={T.primary} strokeWidth={2.4} /> : <Clock size={16} color={T.pending} strokeWidth={2.4} />}</div>
      <div className="flex-1"><div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{p.who}</div><div style={{ fontSize: 12, color: T.faint }}>{p.isi} isi · {p.when}</div></div>
      <div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700, color: lunas ? T.primary : T.ink, fontVariantNumeric: "tabular-nums" }}>{rupiah(total)}</div><div style={{ fontSize: 10.5, fontWeight: 700, color: lunas ? T.primary : T.pending }}>{lunas ? "Lunas" : "Belum bayar"}</div></div>
    </div>
  );
}

function CommerceAgen({ accent }) {
  const runtime = RUNTIME.commerce;
  const tot = COM_PAYMENTS.reduce((a, p) => a + p.isi * TARIF_ISI, 0);
  const lunas = COM_PAYMENTS.filter((p) => p.status === "lunas").reduce((a, p) => a + p.isi * TARIF_ISI, 0);
  const pending = tot - lunas;
  const nPending = COM_PAYMENTS.filter((p) => p.status === "pending").length;
  return (
    <div style={{ background: T.bg, minHeight: "100vh", padding: "8px 0 16px" }}>
      <RuntimeShell runtime={runtime} tenant="Agen Jaya" context="Pembayaran masuk" footer={null}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 }}>Hari ini</div>
        <div className="flex gap-2" style={{ marginBottom: 14 }}>
          <StatTile label="Tertagih" value={rupiah(tot)} accent={accent} Icon={Wallet} />
          <StatTile label="Lunas" value={rupiah(lunas)} accent={T.primary} Icon={CheckCheck} />
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2.5" style={{ background: `${T.pending}0D`, border: `1px solid ${T.pending}44`, borderRadius: 13, padding: "12px 14px", marginBottom: 16 }}>
            <Clock size={17} color={T.pending} strokeWidth={2.4} /><span style={{ fontSize: 12.5, color: T.sub, fontWeight: 600 }}>{nPending} terkirim belum bayar · {rupiah(pending)}</span>
          </div>
        )}
        <div style={{ fontSize: 12, fontWeight: 700, color: T.faint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Per serah terima</div>
        <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.radius, padding: 6 }}>
          {COM_PAYMENTS.map((p, i) => <PayRow key={p.id} p={p} accent={accent} top={i > 0} />)}
        </div>
        <div style={{ fontSize: 11, color: T.faint, textAlign: "center", marginTop: 12 }}>Tagihan otomatis dari serah yang confirmed · Gaspink lempar ke rail bank, bukan nahan dana</div>
      </RuntimeShell>
    </div>
  );
}

function CommerceApp() {
  const accent = RUNTIME.commerce.accent;
  const [side, setSide] = useState("customer");
  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <div className="mx-auto flex gap-1" style={{ maxWidth: 384, padding: "12px 16px 0" }}>
        {[{ k: "customer", l: "Customer (bayar)" }, { k: "agen", l: "Agen (status)" }].map(({ k, l }) => { const on = side === k; return <button key={k} onClick={() => setSide(k)} className="flex-1 py-2" style={{ background: on ? T.surface : "transparent", border: `1px solid ${on ? T.line : "transparent"}`, borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: on ? T.ink : T.faint, cursor: "pointer" }}>{l}</button>; })}
      </div>
      {side === "customer" ? <CommerceCustomer accent={accent} /> : <CommerceAgen accent={accent} />}
    </div>
  );
}

// ============================================================================
// ROOT — switcher: PIHAK (tenant + observer) → ACTOR. Multi-tenant + investor.
// ============================================================================
const TENANTS = {
  aj: { label: "Agen Jaya", actors: [{ k: "admin", l: "Admin" }, { k: "driver", l: "Driver" }, { k: "customer", l: "Customer" }] },
  dist: { label: "Distributor CNG Nusantara", actors: [{ k: "admin", l: "Admin" }, { k: "driver", l: "Driver" }] },
  investor: { label: "Investor", actors: [{ k: "app", l: "Portfolio" }], observer: true },
  pertagas: { label: "Pertagas", actors: [{ k: "app", l: "Gas" }], observer: true },
  commerce: { label: "Bayar", actors: [{ k: "app", l: "Commerce" }], observer: true },
};
export default function App() {
  const [tenant, setTenant] = useState("aj");
  const [actor, setActor] = useState("admin");
  const pickTenant = (t) => { setTenant(t); setActor(TENANTS[t].actors[0].k); };
  const Seg = ({ on, label, onTap, grow }) => (
    <button onClick={onTap} className={grow ? "flex-1 py-2" : "py-2 px-3"} style={{ background: on ? T.surface : "transparent", border: `1px solid ${on ? T.line : "transparent"}`, borderRadius: 10, fontSize: 11.5, fontWeight: 700, color: on ? T.ink : T.faint, cursor: "pointer", boxShadow: on ? "0 1px 2px rgba(0,0,0,.05)" : "none", whiteSpace: "nowrap" }}>{label}</button>
  );
  const view = tenant === "aj"
    ? (actor === "admin" ? <AdminApp /> : actor === "driver" ? <DriverApp /> : <CustomerApp />)
    : tenant === "dist"
      ? (actor === "admin" ? <DistAdminApp /> : <DistDriverApp />)
      : tenant === "investor"
        ? <InvestorApp />
        : tenant === "pertagas"
          ? <PertagasApp />
          : <CommerceApp />;
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>
      <div className="mx-auto" style={{ maxWidth: 384, padding: "12px 16px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 5 }}>Pihak</div>
        <div className="flex gap-1" style={{ marginBottom: 8 }}>
          {Object.entries(TENANTS).map(([k, t]) => <Seg key={k} on={tenant === k} label={t.label} onTap={() => pickTenant(k)} grow />)}
        </div>
        {!TENANTS[tenant].observer && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.faint, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 5 }}>Aktor</div>
            <div className="flex gap-1">
              {TENANTS[tenant].actors.map((a) => <Seg key={a.k} on={actor === a.k} label={a.l} onTap={() => setActor(a.k)} grow />)}
            </div>
          </>
        )}
      </div>
      {view}
    </div>
  );
}
