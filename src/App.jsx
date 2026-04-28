import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  QrCode,
  Home,
  Phone,
  User,
  Camera,
  BarChart3,
  Search,
  X,
  Check,
  ChevronRight,
  MessageSquare,
  Users,
  UserCircle,
  Home as HomeIcon,
  Plus,
  Trash2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Static data — kept identical to the original screen                        */
/* -------------------------------------------------------------------------- */

const PROPERTY_TYPES = [
  { id: "rumah", label: "Rumah" },
  { id: "ruko", label: "Ruko" },
  { id: "apartemen", label: "Apt" },
  { id: "tanah", label: "Tanah" },
];

const LEAD_SOURCES = [
  { id: "walk_in", label: "Walk-in", hint: "Datang langsung ke kantor" },
  { id: "referral", label: "Referral", hint: "Rekomendasi klien lama" },
  { id: "instagram", label: "Instagram", hint: "DM / komentar IG" },
  { id: "facebook", label: "Facebook", hint: "Iklan / Marketplace" },
  { id: "tiktok", label: "TikTok", hint: "Konten / iklan TikTok" },
  { id: "whatsapp", label: "WhatsApp", hint: "Broadcast / chat" },
  { id: "google_ads", label: "Google Ads", hint: "Iklan pencarian" },
  { id: "olx", label: "OLX", hint: "Listing OLX" },
  { id: "rumah123", label: "Rumah123", hint: "Listing Rumah123" },
  { id: "lainnya", label: "Lainnya", hint: "Sumber lain" },
];

const OUTCOMES = [
  {
    id: "follow_up",
    title: "Follow-up",
    description: "Lakukan tindak lanjut ke prospek",
  },
  {
    id: "deal",
    title: "Deal",
    description: "Prospek menjadi deal",
  },
  {
    id: "lost",
    title: "Lost",
    description: "Prospek tidak lanjut / lost",
  },
];

/* -------------------------------------------------------------------------- */
/*  Shared widget primitives — mirrors WidgetShell / WidgetHeader              */
/* -------------------------------------------------------------------------- */

function WidgetShell({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-[#eef2f6] rounded-2xl ${className}`}
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.05)",
      }}
    >
      {children}
    </div>
  );
}

function WidgetHeader({ icon: Icon, label, right }) {
  return (
    <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
          <Icon size={13} className="text-slate-500" strokeWidth={2.25} />
        </div>
        <span
          className="text-slate-500 font-semibold uppercase"
          style={{ fontSize: 10.5, letterSpacing: "0.14em" }}
        >
          {label}
        </span>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SegmentedSelect — replaces the Tipe Properti dropdown                      */
/* -------------------------------------------------------------------------- */

function SegmentedSelect({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`h-10 rounded-lg text-[12.5px] font-medium transition-colors active:scale-[0.98] ${
              active
                ? "bg-slate-900 text-white border border-slate-900"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  BottomSheetSelect — replaces the Lead Source dropdown                      */
/* -------------------------------------------------------------------------- */

function BottomSheetSelect({ open, onClose, options, value, onChange, title }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      // small delay so the sheet has appeared before focus
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
      style={{
        backgroundColor: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-[22px] flex flex-col"
        style={{
          maxHeight: "78vh",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <span className="text-[15px] font-semibold text-slate-900">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-[0.98]"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari sumber lead..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-slate-300"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto px-2 pb-3" style={{ maxHeight: "55vh" }}>
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[12.5px] text-slate-500">
              Tidak ada hasil untuk "{query}"
            </div>
          ) : (
            filtered.map((opt) => {
              const selected = value === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-50 active:scale-[0.99] text-left"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13.5px] font-semibold text-slate-900 truncate">
                      {opt.label}
                    </span>
                    <span className="text-[11.5px] text-slate-500 truncate">
                      {opt.hint}
                    </span>
                  </div>
                  {selected && (
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0 ml-3">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  OutcomeSelector — replaces the Hasil Aktivitas radio group                 */
/* -------------------------------------------------------------------------- */

function OutcomeSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      {OUTCOMES.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors active:scale-[0.99] ${
              selected
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 border ${
                  selected
                    ? "bg-slate-900 border-slate-900"
                    : "bg-white border-slate-300"
                }`}
              >
                {selected && (
                  <Check size={10} className="text-white" strokeWidth={3} />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold text-slate-900">
                  {opt.title}
                </div>
                <div className="text-[12px] text-slate-500 mt-0.5">
                  {opt.description}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field rows (label + control) — used inside Property / Client cards         */
/* -------------------------------------------------------------------------- */

function FieldRow({ label, children }) {
  return (
    <div>
      <label
        className="block text-slate-500 font-semibold uppercase mb-2"
        style={{ fontSize: 10.5, letterSpacing: "0.14em" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectorTrigger({ value, placeholder, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-left hover:bg-slate-50 active:scale-[0.99]"
    >
      <span
        className={`text-[13px] truncate ${
          value ? "text-slate-900 font-medium" : "text-slate-400"
        }`}
      >
        {value || placeholder}
      </span>
      <ChevronRight size={14} className="text-slate-400 flex-shrink-0 ml-2" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main screen                                                                */
/* -------------------------------------------------------------------------- */

export default function ProspectOwnerScreen() {
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [clientName, setClientName] = useState("");
  const [photos, setPhotos] = useState([]); // up to 5
  const [outcome, setOutcome] = useState("");

  const [leadSheetOpen, setLeadSheetOpen] = useState(false);

  const MAX_PHOTOS = 5;
  const fileInputRef = useRef(null);

  const leadSourceLabel =
    LEAD_SOURCES.find((s) => s.id === leadSource)?.label || "";

  // Required-field gating for the submit button
  const canSubmit =
    propertyName.trim().length > 0 &&
    propertyType.length > 0 &&
    leadSource.length > 0 &&
    clientName.trim().length > 0 &&
    outcome.length > 0;

  // --- Property scan & photo handlers (preserve existing logic surface) ---
  const handleScanProperty = () => {
    // Existing scan handler — in production this opens the QR scanner
    // and resolves to a property name / id. Kept as a stub so the
    // wiring point is obvious.
    const scanned = "Vertika Tekno Lokacipta";
    setPropertyName(scanned);
  };

  const openPhotoCapture = () => {
    if (photos.length >= MAX_PHOTOS) return;
    fileInputRef.current?.click();
  };

  const handlePhotoFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const remaining = MAX_PHOTOS - photos.length;
    const incoming = Array.from(fileList).slice(0, remaining);
    const next = incoming.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: URL.createObjectURL(file),
      capturedAt: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
    setPhotos((prev) => [...prev, ...next]);
  };

  const removePhoto = (id) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      {/* ---------------------------------------------------------------- */}
      {/*  Top app bar                                                       */}
      {/* ---------------------------------------------------------------- */}
      <header
        className="sticky top-0 z-30 px-4 pt-3 pb-3.5 flex items-center gap-3"
        style={{ backgroundColor: "#0f172a" }}
      >
        <button
          type="button"
          className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-[0.98]"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-white truncate">
            Vertika Tekno Lokacipta
          </div>
          <div className="text-[10.5px] uppercase text-slate-300" style={{ letterSpacing: "0.14em" }}>
            Sales view · Prospect entry
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live status dot */}
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "#22c55e" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ backgroundColor: "#22c55e" }}
            />
          </span>
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-[0.98]"
          >
            <RefreshCw size={16} className="text-white" />
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/*  Body                                                              */}
      {/* ---------------------------------------------------------------- */}
      <main className="flex-1 px-4 pt-4 pb-40 space-y-4">
        {/* --- Prospect Owner identity card (hybrid scan + manual input) --- */}
        <WidgetShell>
          <WidgetHeader icon={MapPin} label="Prospect Owner" />
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-3 bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-slate-300">
              <input
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="Scan QR atau ketik nama properti"
                className="text-[13px] text-slate-900 placeholder:text-slate-400 outline-none w-full bg-transparent"
              />
              <button
                type="button"
                onClick={handleScanProperty}
                aria-label="Scan QR properti"
                className="text-slate-500 hover:text-slate-900 active:scale-[0.98] flex-shrink-0"
              >
                <QrCode size={16} strokeWidth={2.25} />
              </button>
            </div>
            {propertyName.trim().length > 0 && (
              <div className="text-[11px] text-slate-500 mt-2">
                Inside Site · Menara BCA · Lt. 21
              </div>
            )}
          </div>
        </WidgetShell>

        {/* --- Property Info section --- */}
        <WidgetShell>
          <WidgetHeader icon={Home} label="Property Info" />
          <div className="px-4 pb-4 space-y-3.5">
            <FieldRow label="Tipe Properti">
              <SegmentedSelect
                options={PROPERTY_TYPES}
                value={propertyType}
                onChange={setPropertyType}
              />
            </FieldRow>

            <FieldRow label="Lead Source">
              <SelectorTrigger
                value={leadSourceLabel}
                placeholder="Pilih sumber lead"
                onClick={() => setLeadSheetOpen(true)}
              />
            </FieldRow>
          </div>
        </WidgetShell>

        {/* --- Client Info section --- */}
        <WidgetShell>
          <WidgetHeader icon={User} label="Client Info" />
          <div className="px-4 pb-4">
            <FieldRow label="Nama Klien">
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Masukkan nama klien"
                className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-slate-300"
              />
            </FieldRow>
          </div>
        </WidgetShell>

        {/* --- Property Photo section (multi-photo evidence, max 5) --- */}
        <WidgetShell>
          <WidgetHeader
            icon={Camera}
            label="Property Photo"
            right={
              <span
                className="text-[11px] text-slate-500 font-mono"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {photos.length} / {MAX_PHOTOS} foto
              </span>
            }
          />
          <div className="px-4 pb-4">
            {/* Hidden file input — reused by every "add photo" surface */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) => {
                handlePhotoFiles(e.target.files);
                e.target.value = ""; // allow re-selecting the same file
              }}
              className="hidden"
            />

            {/* A. EMPTY STATE */}
            {photos.length === 0 && (
              <button
                type="button"
                onClick={openPhotoCapture}
                className="w-full rounded-xl bg-slate-50 px-4 py-6 flex flex-col items-center justify-center text-center active:scale-[0.99] hover:bg-slate-100"
                style={{ border: "1.5px dashed #cbd5e1" }}
              >
                <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center mb-2">
                  <Camera size={16} className="text-slate-500" />
                </div>
                <div className="text-[13px] font-semibold text-slate-700">
                  Belum ada foto
                </div>
                <div className="text-[11.5px] text-slate-400 mt-0.5">
                  Ambil foto properti untuk melengkapi data
                </div>
              </button>
            )}

            {/* B. SINGLE PHOTO — large preview */}
            {photos.length === 1 && (
              <div className="space-y-2">
                <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img
                    src={photos[0].url}
                    alt="Property"
                    className="w-full object-cover"
                    style={{ aspectRatio: "4 / 3" }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photos[0].id)}
                    aria-label="Hapus foto"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-[0.95]"
                    style={{ backgroundColor: "rgba(15,23,42,0.65)" }}
                  >
                    <Trash2 size={14} className="text-white" strokeWidth={2.25} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={openPhotoCapture}
                  className="w-full h-10 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[12.5px] font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:bg-slate-100 active:scale-[0.99]"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Tambah foto
                </button>
              </div>
            )}

            {/* C. MULTIPLE PHOTOS — grid */}
            {photos.length >= 2 && (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <img
                      src={p.url}
                      alt="Property"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(p.id)}
                      aria-label="Hapus foto"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center active:scale-[0.95]"
                      style={{ backgroundColor: "rgba(15,23,42,0.65)" }}
                    >
                      <Trash2 size={11} className="text-white" strokeWidth={2.5} />
                    </button>
                  </div>
                ))}

                {/* Add tile — only if under cap */}
                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    onClick={openPhotoCapture}
                    className="rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 active:scale-[0.98]"
                    style={{ aspectRatio: "1 / 1" }}
                  >
                    <Plus size={18} strokeWidth={2.25} />
                    <span className="text-[10.5px] font-semibold mt-0.5">
                      Tambah
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </WidgetShell>

        {/* --- Hasil Aktivitas section --- */}
        <WidgetShell>
          <WidgetHeader icon={BarChart3} label="Hasil Aktivitas" />
          <div className="px-4 pb-4">
            <OutcomeSelector value={outcome} onChange={setOutcome} />
          </div>
        </WidgetShell>

        {/* Disabled-reason hint, shown only when submit is blocked */}
        {!canSubmit && (
          <div className="text-[11.5px] text-slate-500 text-center px-4">
            {!propertyName.trim()
              ? "Scan atau isi nama properti untuk melanjutkan"
              : !propertyType
              ? "Pilih tipe properti untuk melanjutkan"
              : !leadSource
              ? "Pilih sumber lead untuk melanjutkan"
              : !clientName.trim()
              ? "Masukkan nama klien untuk melanjutkan"
              : "Pilih hasil aktivitas untuk melanjutkan"}
          </div>
        )}
      </main>

      {/* ---------------------------------------------------------------- */}
      {/*  Sticky submit footer                                              */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="fixed bottom-[64px] left-0 right-0 z-20 px-4 pt-3 pb-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(241,245,249,0) 0%, rgba(241,245,249,0.9) 35%, rgba(241,245,249,1) 100%)",
        }}
      >
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit) return;
            // emitActivitySignal('report.submitted', { ... }) in production
            alert("Prospek tersimpan");
          }}
          className={`w-full h-12 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors ${
            canSubmit
              ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]"
              : "bg-slate-900 text-white opacity-40 cursor-not-allowed"
          }`}
          style={{
            boxShadow: canSubmit
              ? "0 1px 2px rgba(15,23,42,0.08)"
              : "none",
          }}
        >
          <Check size={15} strokeWidth={2.5} />
          Simpan Prospek
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/*  Bottom navigation                                                 */}
      {/* ---------------------------------------------------------------- */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-slate-200"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          {[
            { icon: HomeIcon, label: "Home", active: true },
            { icon: MessageSquare, label: "Activity", active: false },
            { icon: Users, label: "Team", active: false },
            { icon: UserCircle, label: "Profile", active: false },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              className="flex flex-col items-center justify-center py-2.5 active:scale-[0.98]"
            >
              <tab.icon
                size={18}
                className={tab.active ? "text-slate-900" : "text-slate-400"}
                strokeWidth={tab.active ? 2.4 : 2}
              />
              <span
                className={`mt-1 text-[10.5px] font-semibold ${
                  tab.active ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/*  Bottom sheet                                                      */}
      {/* ---------------------------------------------------------------- */}
      <BottomSheetSelect
        open={leadSheetOpen}
        onClose={() => setLeadSheetOpen(false)}
        options={LEAD_SOURCES}
        value={leadSource}
        onChange={setLeadSource}
        title="Pilih Lead Source"
      />
    </div>
  );
}
