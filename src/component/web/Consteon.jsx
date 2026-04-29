import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Clock,
  ListChecks,
  FileText,
  Inbox,
  ChevronDown,
  ChevronRight,
  Search,
  Download,
  RefreshCw,
  Plus,
  Filter,
  X,
  Check,
  AlertTriangle,
  MapPin,
  Calendar,
  Building2,
  Globe2,
  ChevronsUpDown,
  MoreHorizontal,
  Paperclip,
  CircleDot,
  ImageIcon,
  ArrowUpRight,
  Bell,
  HelpCircle,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  Hash,
  UserPlus,
} from "lucide-react";

/* ---------------------------------------------------------------------------
   CONSTEON — Field Workforce Management
   Single-file React + Tailwind admin dashboard.
   Aesthetic: refined SaaS B2B (Stripe / Linear / Metabase lineage).
   --------------------------------------------------------------------------- */

/* ============================== MOCK DATA ============================== */

const ORGS = ["Consteon Indonesia", "Consteon Malaysia"];
const REGIONS = ["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"];
const SITES = ["All sites", "Plaza Senayan", "Grand Indonesia", "Pondok Indah Mall", "Kota Kasablanka"];

const ATTENDANCE_ROWS = [
  { id: 1, name: "Adi Pratama",        nik: "EMP-2041", site: "Plaza Senayan",     shift: "Pagi",   in: "07:58", out: "16:02", status: "On Time" },
  { id: 2, name: "Budi Santoso",       nik: "EMP-2103", site: "Grand Indonesia",   shift: "Pagi",   in: "08:14", out: "16:11", status: "Late" },
  { id: 3, name: "Citra Wulandari",    nik: "EMP-2218", site: "Pondok Indah Mall", shift: "Siang",  in: "13:00", out: "21:03", status: "On Time" },
  { id: 4, name: "Dimas Anggara",      nik: "EMP-2255", site: "Kota Kasablanka",   shift: "Pagi",   in: "—",     out: "—",     status: "Absent" },
  { id: 5, name: "Eka Safitri",        nik: "EMP-2287", site: "Plaza Senayan",     shift: "Malam",  in: "21:55", out: "06:04", status: "On Time" },
  { id: 6, name: "Fajar Nugroho",      nik: "EMP-2301", site: "Grand Indonesia",   shift: "Pagi",   in: "08:02", out: "—",     status: "On Duty" },
  { id: 7, name: "Gita Permata",       nik: "EMP-2344", site: "Plaza Senayan",     shift: "Siang",  in: "13:22", out: "21:01", status: "Late" },
  { id: 8, name: "Hadi Kurniawan",     nik: "EMP-2390", site: "Pondok Indah Mall", shift: "Pagi",   in: "07:51", out: "16:00", status: "On Time" },
  { id: 9, name: "Indra Maulana",      nik: "EMP-2412", site: "Kota Kasablanka",   shift: "Pagi",   in: "08:33", out: "15:48", status: "Late" },
  { id: 10, name: "Joko Widodo",       nik: "EMP-2455", site: "Grand Indonesia",   shift: "Malam",  in: "22:01", out: "06:00", status: "On Time" },
];

const TASK_ROWS = [
  { id: "T-1042", name: "Patroli Lantai 3 — Jam 14:00",     site: "Plaza Senayan",     worker: "Adi Pratama",     status: "In Progress", due: "14:00" },
  { id: "T-1043", name: "Cleaning Toilet Pria Lobby",        site: "Grand Indonesia",   worker: "Budi Santoso",    status: "Pending",     due: "15:00" },
  { id: "T-1044", name: "Maintenance AC Ruang Operasional",  site: "Pondok Indah Mall", worker: "Citra Wulandari", status: "Done",        due: "12:30" },
  { id: "T-1045", name: "Delivery Logistik Gudang B → A",    site: "Kota Kasablanka",   worker: "Dimas Anggara",   status: "Overdue",     due: "11:00" },
  { id: "T-1046", name: "Patroli Area Parkir P2",            site: "Plaza Senayan",     worker: "Eka Safitri",     status: "In Progress", due: "16:00" },
  { id: "T-1047", name: "Cleaning Pantry Lantai 5",          site: "Grand Indonesia",   worker: "Fajar Nugroho",   status: "Pending",     due: "17:30" },
  { id: "T-1048", name: "Inspeksi APAR Ring 2",              site: "Pondok Indah Mall", worker: "Gita Permata",    status: "In Progress", due: "16:45" },
];

const WORK_REPORT_ROWS = [
  { id: "R-9011", worker: "Adi Pratama",     activity: "Patrol",      site: "Plaza Senayan",     time: "Today, 14:08", status: "Submitted" },
  { id: "R-9012", worker: "Budi Santoso",    activity: "Cleaning",    site: "Grand Indonesia",   time: "Today, 13:55", status: "Submitted" },
  { id: "R-9013", worker: "Citra Wulandari", activity: "Maintenance", site: "Pondok Indah Mall", time: "Today, 12:34", status: "Reviewed" },
  { id: "R-9014", worker: "Dimas Anggara",   activity: "Delivery",    site: "Kota Kasablanka",   time: "Today, 11:10", status: "Flagged" },
  { id: "R-9015", worker: "Eka Safitri",     activity: "Patrol",      site: "Plaza Senayan",     time: "Today, 10:42", status: "Submitted" },
  { id: "R-9016", worker: "Hadi Kurniawan",  activity: "Cleaning",    site: "Pondok Indah Mall", time: "Today, 09:30", status: "Reviewed" },
];

const INCIDENT_ROWS = [
  { id: "INC-204", type: "Vandalism",          worker: "Adi Pratama",    site: "Plaza Senayan",     time: "Today, 15:22", severity: "High" },
  { id: "INC-205", type: "Slippery Floor",     worker: "Budi Santoso",   site: "Grand Indonesia",   time: "Today, 14:01", severity: "Medium" },
  { id: "INC-206", type: "Lost & Found",       worker: "Hadi Kurniawan", site: "Pondok Indah Mall", time: "Today, 11:45", severity: "Low" },
  { id: "INC-207", type: "Suspicious Person",  worker: "Eka Safitri",    site: "Plaza Senayan",     time: "Today, 02:12", severity: "High" },
  { id: "INC-208", type: "Equipment Damage",   worker: "Fajar Nugroho",  site: "Grand Indonesia",   time: "Yesterday",    severity: "Medium" },
];

const REQUEST_ROWS = [
  { id: "REQ-3301", type: "Sakit",      worker: "Adi Pratama",     dateRange: "21 Apr — 22 Apr", reason: "Demam, surat dokter terlampir.",            status: "Pending",  attach: true },
  { id: "REQ-3302", type: "Cuti",       worker: "Citra Wulandari", dateRange: "28 Apr — 02 Mei", reason: "Mudik keluarga.",                            status: "Pending",  attach: false },
  { id: "REQ-3303", type: "Lembur",     worker: "Budi Santoso",    dateRange: "20 Apr",          reason: "Cover shift malam, request supervisor.",     status: "Approved", attach: false },
  { id: "REQ-3304", type: "Tukar Shift", worker: "Eka Safitri",    dateRange: "23 Apr",          reason: "Tukar dengan Hadi Kurniawan.",               status: "Pending",  attach: false },
  { id: "REQ-3305", type: "Sakit",      worker: "Dimas Anggara",   dateRange: "18 Apr — 20 Apr", reason: "Tipes, opname 3 hari.",                      status: "Approved", attach: true },
  { id: "REQ-3306", type: "Ijin",       worker: "Joko Widodo",     dateRange: "25 Apr",          reason: "Urusan keluarga mendesak.",                  status: "Rejected", attach: false },
  { id: "REQ-3307", type: "Cuti",       worker: "Gita Permata",    dateRange: "05 Mei — 07 Mei", reason: "Cuti tahunan.",                              status: "Pending",  attach: false },
];

/* ============================== UTILITIES ============================== */

function classNames(...arr) {
  return arr.filter(Boolean).join(" ");
}

const STATUS_TONE = {
  // attendance
  "On Time":    "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  "Late":       "bg-amber-50 text-amber-800 ring-amber-600/20",
  "Absent":     "bg-rose-50 text-rose-700 ring-rose-600/15",
  "On Duty":    "bg-sky-50 text-sky-700 ring-sky-600/15",
  // tasks
  "Pending":     "bg-stone-100 text-stone-700 ring-stone-600/15",
  "In Progress": "bg-sky-50 text-sky-700 ring-sky-600/15",
  "Done":        "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  "Overdue":     "bg-rose-50 text-rose-700 ring-rose-600/15",
  // reports
  "Submitted":  "bg-stone-100 text-stone-700 ring-stone-600/15",
  "Reviewed":   "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  "Flagged":    "bg-amber-50 text-amber-800 ring-amber-600/20",
  // requests
  "Approved":   "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  "Rejected":   "bg-rose-50 text-rose-700 ring-rose-600/15",
  // severity
  "Low":        "bg-stone-100 text-stone-700 ring-stone-600/15",
  "Medium":     "bg-amber-50 text-amber-800 ring-amber-600/20",
  "High":       "bg-rose-50 text-rose-700 ring-rose-600/15",
};

function StatusBadge({ value }) {
  const tone = STATUS_TONE[value] || "bg-stone-100 text-stone-700 ring-stone-600/15";
  return (
    <span className={classNames(
      "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
      tone
    )}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {value}
    </span>
  );
}

/* ============================== PRIMITIVES ============================== */

function IconButton({ children, onClick, title, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={classNames(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition",
        className
      )}
    >
      {children}
    </button>
  );
}

function Button({ children, variant = "secondary", size = "md", onClick, icon: Icon, className, disabled }) {
  const base = "inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:pointer-events-none";
  const sizes = {
    sm: "h-8 px-2.5 text-[13px]",
    md: "h-9 px-3 text-sm",
  };
  const variants = {
    primary:   "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/10",
    secondary: "bg-white text-stone-800 ring-1 ring-inset ring-stone-300 hover:bg-stone-50",
    ghost:     "text-stone-700 hover:bg-stone-100",
    danger:    "bg-white text-rose-700 ring-1 ring-inset ring-rose-300 hover:bg-rose-50",
    success:   "bg-white text-emerald-700 ring-1 ring-inset ring-emerald-300 hover:bg-emerald-50",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={classNames(base, sizes[size], variants[variant], className)}>
      {Icon && <Icon className="h-4 w-4" strokeWidth={2} />}
      {children}
    </button>
  );
}

function Select({ value, onChange, options, icon: Icon, className, placeholder }) {
  return (
    <div className={classNames("relative", className)}>
      {Icon && (
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={classNames(
          "h-9 w-full appearance-none rounded-md bg-white pr-8 text-sm text-stone-800 ring-1 ring-inset ring-stone-300 hover:ring-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/40",
          Icon ? "pl-8" : "pl-3"
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, className }) {
  return (
    <div className={classNames("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-md bg-white pl-8 pr-3 text-sm text-stone-800 ring-1 ring-inset ring-stone-300 placeholder:text-stone-400 hover:ring-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/40"
      />
    </div>
  );
}

function Checkbox({ checked, onChange, indeterminate }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-stone-300 text-blue-600 focus:ring-blue-600/40 cursor-pointer"
    />
  );
}

/* ============================== SIDEBAR ============================== */

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    key: "workforce", label: "Workforce", icon: Users,
    children: [
      { key: "wf-list", label: "Daftar Pegawai" },
      { key: "wf-reg",  label: "Pendaftaran Pegawai" },
      { key: "wf-chg",  label: "Perubahan Data" },
      { key: "wf-mut",  label: "Mutasi" },
      { key: "wf-phk",  label: "PHK" },
    ],
  },
  {
    key: "attendance", label: "Attendance", icon: Clock,
    children: [
      { key: "att-log",  label: "Log Absensi" },
      { key: "att-mon",  label: "Monitoring Kehadiran" },
    ],
  },
  {
    key: "operations", label: "Operations", icon: ListChecks,
    children: [
      { key: "ops-task", label: "Task & Assignment" },
      { key: "ops-mon",  label: "Monitoring (Live)" },
    ],
  },
  {
    key: "reports", label: "Reports", icon: FileText,
    children: [
      { key: "rep-work",   label: "Laporan Pekerjaan" },
      { key: "rep-inc",    label: "Laporan Insiden" },
      { key: "rep-att",    label: "Rekap Absensi" },
      { key: "rep-pay",    label: "Rekap Payroll" },
    ],
  },
  {
    key: "requests", label: "Requests & Approvals", icon: Inbox,
    children: [
      { key: "req-all",    label: "All Requests" },
      { key: "req-queue",  label: "Approval Queue" },
    ],
  },
];

function Sidebar({ active, onNavigate, clientName = "Vertika Tekno Lokacipta" }) {
  const [open, setOpen] = useState({
    workforce: true,
    attendance: true,
    operations: true,
    reports: true,
    requests: true,
  });

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-stone-200 px-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-stone-900 text-white">
          <span className="text-[13px] font-semibold tracking-tight">
            {clientName.trim().charAt(0).toUpperCase() || "C"}
          </span>
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[14px] font-semibold tracking-tight text-stone-900">
            {clientName}
          </span>
          <span className="truncate text-[11px] text-stone-500">
            Field Operations Platform
          </span>
        </div>
        <button className="ml-auto shrink-0 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-400">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const isOpen = open[item.key];
            const isActive = active === item.key || item.children?.some(c => c.key === active);
            const isLeafActive = active === item.key;

            if (!item.children) {
              return (
                <li key={item.key}>
                  <button
                    onClick={() => onNavigate(item.key)}
                    className={classNames(
                      "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium",
                      isLeafActive
                        ? "bg-stone-900 text-white"
                        : "text-stone-700 hover:bg-stone-100"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.key}>
                <button
                  onClick={() => setOpen((s) => ({ ...s, [item.key]: !s[item.key] }))}
                  className={classNames(
                    "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium",
                    isActive ? "text-stone-900" : "text-stone-700 hover:bg-stone-100"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span>{item.label}</span>
                  <ChevronRight className={classNames(
                    "ml-auto h-3.5 w-3.5 text-stone-400 transition",
                    isOpen && "rotate-90"
                  )} />
                </button>
                {isOpen && (
                  <ul className="mt-0.5 space-y-0.5 pl-7">
                    {item.children.map((c) => {
                      const childActive = active === c.key;
                      return (
                        <li key={c.key}>
                          <button
                            onClick={() => onNavigate(c.key)}
                            className={classNames(
                              "flex w-full items-center rounded-md px-2 py-1.5 text-[13px]",
                              childActive
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                            )}
                          >
                            <span className="relative">
                              {childActive && (
                                <span className="absolute -left-3 top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-full bg-blue-600" />
                              )}
                              {c.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-stone-200 p-2">
        <button className="flex w-full items-center gap-2.5 rounded-md p-2 text-left hover:bg-stone-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-stone-700 to-stone-900 text-[12px] font-semibold text-white">
            DC
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-stone-900">D. Consteon</p>
            <p className="truncate text-[11px] text-stone-500">Operations Admin</p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-stone-400" />
        </button>
      </div>

      {/* Powered by (white-label attribution) */}
      <div className="border-t border-stone-100 px-4 py-2">
        <p className="text-[10.5px] text-stone-400">
          Powered by <span className="font-medium text-stone-500">Consteon</span>
        </p>
      </div>
    </aside>
  );
}

/* ============================== TOPBAR (Global Filter) ============================== */

function Topbar() {
  const [org, setOrg] = useState(ORGS[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [site, setSite] = useState(SITES[0]);
  const [date, setDate] = useState("Today");
  const [syncing, setSyncing] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 900);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-stone-200 bg-white/80 px-5 backdrop-blur">
      {/* Context label */}
      <div className="flex items-center gap-1.5 text-[12px] text-stone-500">
        <span className="font-medium text-stone-600">Context</span>
        <span className="text-stone-300">·</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={org}    onChange={setOrg}    options={ORGS}    icon={Building2} className="w-[180px]" />
        <Select value={region} onChange={setRegion} options={REGIONS} icon={Globe2}    className="w-[150px]" />
        <Select value={site}   onChange={setSite}   options={SITES}   icon={MapPin}    className="w-[170px]" />
        <Select value={date}   onChange={setDate}   options={["Today", "Yesterday", "Last 7 days", "Last 30 days", "This month", "Custom range"]} icon={Calendar} className="w-[155px]" />
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-1.5">
        <div className="mr-2 hidden items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] text-stone-500 lg:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Live · synced 2 min ago
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleSync} className={syncing ? "[&>svg]:animate-spin" : ""}>
          Sync
        </Button>
        <IconButton title="Notifications"><Bell className="h-4 w-4" /></IconButton>
        <IconButton title="Help"><HelpCircle className="h-4 w-4" /></IconButton>
      </div>
    </header>
  );
}

/* ============================== PAGE HEADER ============================== */

function PageHeader({ title, subtitle, breadcrumb, left, right }) {
  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="px-6 pt-5 pb-4">
        {breadcrumb && (
          <p className="mb-1.5 text-[12px] text-stone-500">
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5 text-stone-300">/</span>}
                <span className={i === breadcrumb.length - 1 ? "text-stone-700" : ""}>{b}</span>
              </span>
            ))}
          </p>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-stone-900">{title}</h1>
            {subtitle && <p className="mt-0.5 text-[13px] text-stone-500">{subtitle}</p>}
          </div>
        </div>
      </div>
      {(left || right) && (
        <div className="flex flex-wrap items-center gap-2 px-6 pb-4">
          <div className="flex flex-wrap items-center gap-2">{left}</div>
          <div className="ml-auto flex items-center gap-2">{right}</div>
        </div>
      )}
    </div>
  );
}

/* ============================== TABLE PRIMITIVES ============================== */

function TableShell({ children }) {
  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function Th({ children, className }) {
  return (
    <th className={classNames(
      "border-b border-stone-200 bg-stone-50/60 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500",
      className
    )}>
      {children}
    </th>
  );
}

function Td({ children, className }) {
  return (
    <td className={classNames(
      "border-b border-stone-100 px-4 py-3 align-middle text-[13.5px] text-stone-700",
      className
    )}>
      {children}
    </td>
  );
}

function BulkBar({ count, onClear, children }) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-4 z-20 mx-auto mt-4 flex w-fit items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-lg shadow-stone-900/5">
      <span className="flex items-center gap-2 rounded-md bg-stone-900 px-2 py-1 text-[12px] font-medium text-white">
        <span className="tabular-nums">{count}</span> selected
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
      <button onClick={onClear} className="ml-1 rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function EmployeeCell({ name, sub }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("");
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[11px] font-semibold text-stone-600">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-stone-900">{name}</p>
        {sub && <p className="truncate text-[12px] text-stone-500">{sub}</p>}
      </div>
    </div>
  );
}

/* ============================== DRAWER ============================== */

function Drawer({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-stone-900/30 backdrop-blur-[2px] transition"
        onClick={onClose}
      />
      <aside className="flex w-full max-w-[480px] flex-col border-l border-stone-200 bg-white shadow-2xl">
        <div className="flex h-14 items-center gap-2 border-b border-stone-200 px-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-stone-900">{title}</h2>
          <button onClick={onClose} className="ml-auto rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center gap-2 border-t border-stone-200 bg-stone-50/50 px-5 py-3">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}

/* ============================== PAGE: LOG ABSENSI ============================== */

function PageLogAbsensi() {
  const [status, setStatus] = useState("All status");
  const [shift, setShift] = useState("All shift");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(new Set());

  const rows = useMemo(() => ATTENDANCE_ROWS.filter((r) => {
    if (status !== "All status" && r.status !== status) return false;
    if (shift !== "All shift" && r.shift !== shift) return false;
    if (q && !r.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [status, shift, q]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id)) && !allSelected;

  const toggleAll = (v) => {
    const next = new Set(selected);
    if (v) rows.forEach((r) => next.add(r.id));
    else rows.forEach((r) => next.delete(r.id));
    setSelected(next);
  };
  const toggleOne = (id, v) => {
    const next = new Set(selected);
    if (v) next.add(id); else next.delete(id);
    setSelected(next);
  };

  return (
    <>
      <PageHeader
        breadcrumb={["Attendance", "Log Absensi"]}
        title="Log Absensi"
        subtitle="Daily check-in and check-out records across all sites in scope."
        left={
          <>
            <Select value={status} onChange={setStatus} options={["All status", "On Time", "Late", "Absent", "On Duty"]} icon={Filter} className="w-[145px]" />
            <Select value={shift}  onChange={setShift}  options={["All shift", "Pagi", "Siang", "Malam"]}                icon={Clock}  className="w-[125px]" />
            <SearchInput value={q} onChange={setQ} placeholder="Search employee" className="w-[240px]" />
          </>
        }
        right={
          <Button variant="secondary" size="md" icon={Download}>Export</Button>
        }
      />

      <div className="px-6 py-5">
        {/* Summary chips */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Scheduled",  value: 248, hint: "across 4 sites" },
            { label: "On Time",    value: 196, hint: "79% of total" },
            { label: "Late",       value: 32,  hint: "+4 vs yesterday" },
            { label: "Absent",     value: 20,  hint: "8% of total" },
          ].map((c) => (
            <div key={c.label} className="rounded-lg border border-stone-200 bg-white p-3.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">{c.label}</p>
              <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-tight text-stone-900">{c.value}</p>
              <p className="mt-0.5 text-[11.5px] text-stone-500">{c.hint}</p>
            </div>
          ))}
        </div>

        <TableShell>
          <thead>
            <tr>
              <Th className="w-10"><Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} /></Th>
              <Th>Nama</Th>
              <Th>Site</Th>
              <Th>Shift</Th>
              <Th>Check In</Th>
              <Th>Check Out</Th>
              <Th>Status</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-stone-50/60">
                <Td><Checkbox checked={selected.has(r.id)} onChange={(v) => toggleOne(r.id, v)} /></Td>
                <Td><EmployeeCell name={r.name} sub={r.nik} /></Td>
                <Td>{r.site}</Td>
                <Td><span className="text-stone-600">{r.shift}</span></Td>
                <Td className="font-mono tabular-nums">{r.in}</Td>
                <Td className="font-mono tabular-nums">{r.out}</Td>
                <Td><StatusBadge value={r.status} /></Td>
                <Td><IconButton><MoreHorizontal className="h-4 w-4" /></IconButton></Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><Td className="py-8 text-center text-stone-400" colSpan={8}>No records match the current filters.</Td></tr>
            )}
          </tbody>
        </TableShell>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-stone-500">
          <span>Showing <span className="font-medium text-stone-700">{rows.length}</span> of {ATTENDANCE_ROWS.length} entries</span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm">Previous</Button>
            <Button variant="secondary" size="sm">Next</Button>
          </div>
        </div>
      </div>

      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" variant="success" icon={Check}>Approve</Button>
        <Button size="sm" variant="danger"  icon={X}>Reject</Button>
      </BulkBar>
    </>
  );
}

/* ============================== PAGE: TASK & ASSIGNMENT ============================== */

function PageTasks() {
  const [status, setStatus] = useState("All status");
  const [site, setSite] = useState("All sites");
  const [open, setOpen] = useState(null);

  const rows = TASK_ROWS.filter((r) => (status === "All status" || r.status === status) && (site === "All sites" || r.site === site));

  return (
    <>
      <PageHeader
        breadcrumb={["Operations", "Task & Assignment"]}
        title="Task & Assignment"
        subtitle="Plan, assign, and track field tasks across teams."
        left={
          <>
            <Select value={status} onChange={setStatus} options={["All status", "Pending", "In Progress", "Done", "Overdue"]} icon={Filter} className="w-[150px]" />
            <Select value={site}   onChange={setSite}   options={SITES} icon={MapPin} className="w-[170px]" />
            <Select value="Today"  onChange={()=>{}}    options={["Today", "Tomorrow", "This week"]} icon={Calendar} className="w-[140px]" />
          </>
        }
        right={
          <>
            <Button variant="secondary" icon={Download}>Export</Button>
            <Button variant="primary" icon={Plus}>Create Task</Button>
          </>
        }
      />

      <div className="px-6 py-5">
        <TableShell>
          <thead>
            <tr>
              <Th>Task</Th>
              <Th>Site</Th>
              <Th>Assigned</Th>
              <Th>Due</Th>
              <Th>Status</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-stone-50/60" onClick={() => setOpen(r)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10.5px] text-stone-500">{r.id}</span>
                    <span className="font-medium text-stone-900">{r.name}</span>
                  </div>
                </Td>
                <Td>{r.site}</Td>
                <Td><EmployeeCell name={r.worker} /></Td>
                <Td className="font-mono tabular-nums">{r.due}</Td>
                <Td><StatusBadge value={r.status} /></Td>
                <Td><IconButton><MoreHorizontal className="h-4 w-4" /></IconButton></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.id} · Task detail` : ""}
        footer={
          <>
            <Button variant="secondary" size="sm">Reassign</Button>
            <Button variant="primary" size="sm" className="ml-auto" icon={Check}>Mark as Done</Button>
          </>
        }
      >
        {open && (
          <div className="px-5 py-5">
            <h3 className="text-[16px] font-semibold tracking-tight text-stone-900">{open.name}</h3>
            <div className="mt-1 flex items-center gap-2 text-[12.5px] text-stone-500">
              <MapPin className="h-3.5 w-3.5" /> {open.site}
              <span className="text-stone-300">·</span>
              <Clock className="h-3.5 w-3.5" /> Due {open.due}
              <span className="text-stone-300">·</span>
              <StatusBadge value={open.status} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 rounded-lg border border-stone-200 bg-stone-50/50 p-3.5 text-[13px]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">Assigned to</p>
                <div className="mt-1.5"><EmployeeCell name={open.worker} sub="Team Lead Shift Pagi" /></div>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">Reporter</p>
                <div className="mt-1.5"><EmployeeCell name="D. Consteon" sub="Operations Admin" /></div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Description</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-700">
                Lakukan patroli rutin sesuai jalur yang ditetapkan. Pastikan semua titik
                check-point ter-scan dan kondisi area dilaporkan sebelum kembali ke pos.
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Checklist</p>
              <ul className="mt-2 space-y-1.5">
                {[
                  ["Scan check-point A1 (Lobby)", true],
                  ["Scan check-point A2 (Lift Lobby)", true],
                  ["Scan check-point B1 (Parkir P2)", false],
                  ["Foto kondisi area parkir", false],
                  ["Konfirmasi serah terima ke shift selanjutnya", false],
                ].map(([label, done], i) => (
                  <li key={i} className="flex items-center gap-2.5 rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px]">
                    <span className={classNames(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      done ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300"
                    )}>
                      {done && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className={done ? "text-stone-400 line-through" : "text-stone-700"}>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================== PAGE: LAPORAN PEKERJAAN ============================== */

function PageWorkReports() {
  const [type, setType] = useState("All types");
  const [site, setSite] = useState("All sites");
  const [open, setOpen] = useState(null);

  const rows = WORK_REPORT_ROWS.filter((r) => (type === "All types" || r.activity === type) && (site === "All sites" || r.site === site));

  return (
    <>
      <PageHeader
        breadcrumb={["Reports", "Laporan Pekerjaan"]}
        title="Laporan Pekerjaan"
        subtitle="Field activity reports submitted from the worker app."
        left={
          <>
            <Select value={type} onChange={setType} options={["All types", "Patrol", "Cleaning", "Maintenance", "Delivery"]} icon={Filter}   className="w-[155px]" />
            <Select value={site} onChange={setSite} options={SITES} icon={MapPin} className="w-[170px]" />
            <Select value="Today" onChange={()=>{}} options={["Today", "Yesterday", "This week"]} icon={Calendar} className="w-[140px]" />
          </>
        }
        right={<Button variant="secondary" icon={Download}>Export</Button>}
      />

      <div className="px-6 py-5">
        <TableShell>
          <thead>
            <tr>
              <Th>Worker</Th>
              <Th>Activity</Th>
              <Th>Site</Th>
              <Th>Time</Th>
              <Th>Status</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-stone-50/60" onClick={() => setOpen(r)}>
                <Td><EmployeeCell name={r.worker} sub={r.id} /></Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-700">{r.activity}</span>
                  </div>
                </Td>
                <Td>{r.site}</Td>
                <Td className="text-stone-500">{r.time}</Td>
                <Td><StatusBadge value={r.status} /></Td>
                <Td><IconButton><MoreHorizontal className="h-4 w-4" /></IconButton></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.id} · Work report` : ""}
        footer={
          <>
            <Button variant="secondary" size="sm" icon={ArrowUpRight}>Open full record</Button>
            <Button variant="primary" size="sm" className="ml-auto" icon={Check}>Mark as Reviewed</Button>
          </>
        }
      >
        {open && (
          <div className="px-5 py-5">
            <div className="flex items-center gap-3">
              <EmployeeCell name={open.worker} sub={`${open.activity} · ${open.site}`} />
              <span className="ml-auto"><StatusBadge value={open.status} /></span>
            </div>

            {/* Photo evidence */}
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Photo evidence</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-md border border-stone-200 bg-gradient-to-br from-stone-100 to-stone-200">
                  <div className="flex h-full items-center justify-center text-stone-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist results */}
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Checklist results</p>
            <ul className="mt-2 space-y-1.5">
              {[
                ["Area dibersihkan & disapu", true],
                ["Pengharum ruangan diisi ulang", true],
                ["Sampah dibuang ke TPS", true],
                ["Lapor kerusakan (jika ada)", false],
              ].map(([label, done], i) => (
                <li key={i} className="flex items-center gap-2.5 rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px]">
                  <span className={classNames(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    done ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300"
                  )}>
                    {done && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="text-stone-700">{label}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Notes</p>
            <p className="mt-1.5 rounded-md border border-stone-200 bg-stone-50/60 px-3 py-2.5 text-[13px] leading-relaxed text-stone-700">
              Semua titik sudah dibersihkan. Pengharum ruangan di toilet wanita lantai 3 hampir habis,
              perlu diisi ulang besok pagi.
            </p>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================== PAGE: LAPORAN INSIDEN ============================== */

function PageIncidents() {
  const [severity, setSeverity] = useState("All severity");
  const [site, setSite] = useState("All sites");
  const [open, setOpen] = useState(null);

  const rows = INCIDENT_ROWS.filter((r) => (severity === "All severity" || r.severity === severity) && (site === "All sites" || r.site === site));

  return (
    <>
      <PageHeader
        breadcrumb={["Reports", "Laporan Insiden"]}
        title="Laporan Insiden"
        subtitle="Unexpected events reported by field workers requiring follow-up."
        left={
          <>
            <Select value={severity} onChange={setSeverity} options={["All severity", "Low", "Medium", "High"]} icon={AlertTriangle} className="w-[160px]" />
            <Select value={site} onChange={setSite} options={SITES} icon={MapPin} className="w-[170px]" />
            <Select value="Today" onChange={()=>{}} options={["Today", "Yesterday", "Last 7 days"]} icon={Calendar} className="w-[145px]" />
          </>
        }
        right={<Button variant="secondary" icon={Download}>Export</Button>}
      />

      <div className="px-6 py-5">
        <TableShell>
          <thead>
            <tr>
              <Th>Incident</Th>
              <Th>Worker</Th>
              <Th>Site</Th>
              <Th>Time</Th>
              <Th>Severity</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-stone-50/60" onClick={() => setOpen(r)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10.5px] text-stone-500">{r.id}</span>
                    <span className="font-medium text-stone-900">{r.type}</span>
                  </div>
                </Td>
                <Td><EmployeeCell name={r.worker} /></Td>
                <Td>{r.site}</Td>
                <Td className="text-stone-500">{r.time}</Td>
                <Td><StatusBadge value={r.severity} /></Td>
                <Td><IconButton><MoreHorizontal className="h-4 w-4" /></IconButton></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.id} · Incident report` : ""}
        footer={
          <>
            <Button variant="secondary" size="sm">Assign to HSE</Button>
            <Button variant="primary" size="sm" className="ml-auto" icon={Check}>Mark resolved</Button>
          </>
        }
      >
        {open && (
          <div className="px-5 py-5">
            <div className="flex items-start gap-3">
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight text-stone-900">{open.type}</h3>
                <p className="mt-0.5 text-[12.5px] text-stone-500">Reported by {open.worker} · {open.time}</p>
              </div>
              <span className="ml-auto"><StatusBadge value={open.severity} /></span>
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Description</p>
            <p className="mt-1.5 rounded-md border border-stone-200 bg-stone-50/60 px-3 py-2.5 text-[13px] leading-relaxed text-stone-700">
              Ditemukan coretan vandalisme di dinding tangga darurat lantai 3. Tidak ada
              kerusakan struktural, namun perlu dibersihkan dan dilaporkan ke building
              management.
            </p>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Photo</p>
            <div className="mt-2 aspect-video overflow-hidden rounded-md border border-stone-200 bg-gradient-to-br from-stone-100 to-stone-200">
              <div className="flex h-full items-center justify-center text-stone-400">
                <ImageIcon className="h-6 w-6" />
              </div>
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Location</p>
            <div className="mt-1.5 flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-stone-700">
              <MapPin className="h-4 w-4 text-stone-400" />
              {open.site} · Tangga Darurat Lantai 3
              <button className="ml-auto text-[12px] font-medium text-blue-600 hover:underline">View on map</button>
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Resolution status</p>
            <div className="mt-1.5 flex items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[13px]">
              <CircleDot className="h-4 w-4 text-amber-500" />
              <span className="text-stone-700">Open · awaiting HSE assignment</span>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================== PAGE: REQUESTS & APPROVALS ============================== */

function PageRequests() {
  const [tab, setTab] = useState("All Requests");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("All status");
  const [site, setSite] = useState("All sites");
  const [open, setOpen] = useState(null);

  const rows = REQUEST_ROWS.filter((r) => {
    if (tab === "Approval Queue" && r.status !== "Pending") return false;
    if (type !== "All types" && r.type !== type) return false;
    if (status !== "All status" && r.status !== status) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        breadcrumb={["Requests & Approvals", tab]}
        title="Requests & Approvals"
        subtitle="Manage leave, sick, overtime, and shift swap requests from the field."
        left={
          <>
            <Select value={type}   onChange={setType}   options={["All types", "Cuti", "Ijin", "Sakit", "Lembur", "Tukar Shift"]} icon={Filter} className="w-[155px]" />
            <Select value={status} onChange={setStatus} options={["All status", "Pending", "Approved", "Rejected"]} icon={CircleDot} className="w-[150px]" />
            <Select value={site}   onChange={setSite}   options={SITES} icon={MapPin} className="w-[170px]" />
          </>
        }
        right={<Button variant="secondary" icon={Download}>Export</Button>}
      />

      {/* Tabs */}
      <div className="border-b border-stone-200 bg-white px-6">
        <div className="flex items-center gap-1">
          {["All Requests", "Approval Queue"].map((t) => {
            const active = tab === t;
            const count = t === "Approval Queue"
              ? REQUEST_ROWS.filter((r) => r.status === "Pending").length
              : REQUEST_ROWS.length;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={classNames(
                  "relative -mb-px flex items-center gap-2 px-3 py-2.5 text-[13px] font-medium",
                  active ? "text-stone-900" : "text-stone-500 hover:text-stone-800"
                )}
              >
                {t}
                <span className={classNames(
                  "rounded px-1.5 py-0.5 text-[11px] tabular-nums",
                  active ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600"
                )}>{count}</span>
                {active && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-stone-900" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-5">
        <TableShell>
          <thead>
            <tr>
              <Th>Request</Th>
              <Th>Worker</Th>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-stone-50/60" onClick={() => setOpen(r)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10.5px] text-stone-500">{r.id}</span>
                    <span className="font-medium text-stone-900">{r.reason}</span>
                    {r.attach && <Paperclip className="h-3.5 w-3.5 text-stone-400" />}
                  </div>
                </Td>
                <Td><EmployeeCell name={r.worker} /></Td>
                <Td className="font-mono tabular-nums text-stone-600">{r.dateRange}</Td>
                <Td><span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11.5px] font-medium text-stone-700">{r.type}</span></Td>
                <Td><StatusBadge value={r.status} /></Td>
                <Td><IconButton><MoreHorizontal className="h-4 w-4" /></IconButton></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </div>

      <Drawer
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `${open.id} · ${open.type} request` : ""}
        footer={
          open && open.status === "Pending" ? (
            <>
              <Button variant="danger"  size="sm" icon={X}>Reject</Button>
              <Button variant="primary" size="sm" className="ml-auto" icon={Check}>Approve</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" className="ml-auto">Close</Button>
          )
        }
      >
        {open && (
          <div className="px-5 py-5">
            <div className="flex items-start gap-3">
              <EmployeeCell name={open.worker} sub={`${open.type} request`} />
              <span className="ml-auto"><StatusBadge value={open.status} /></span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">Type</p>
                <p className="mt-1 text-[14px] font-semibold text-stone-900">{open.type}</p>
              </div>
              <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-stone-500">Date range</p>
                <p className="mt-1 font-mono text-[13.5px] tabular-nums font-semibold text-stone-900">{open.dateRange}</p>
              </div>
            </div>

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Reason</p>
            <p className="mt-1.5 rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-stone-700">
              {open.reason}
            </p>

            {open.attach && (
              <>
                <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Attachment</p>
                <div className="mt-1.5 flex items-center gap-3 rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[13px]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-stone-900">surat-dokter.pdf</p>
                    <p className="truncate text-[11.5px] text-stone-500">PDF · 248 KB</p>
                  </div>
                  <button className="ml-auto rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Approval flow</p>
            <ol className="mt-2 space-y-1.5">
              {[
                ["Submitted by worker", "Today, 09:14", true],
                ["Supervisor review", "Today, 09:48", open.status !== "Pending"],
                ["HR approval", "—", open.status === "Approved"],
              ].map(([label, time, done], i) => (
                <li key={i} className="flex items-center gap-2.5 rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px]">
                  <span className={classNames(
                    "flex h-4 w-4 items-center justify-center rounded-full",
                    done ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-400"
                  )}>
                    {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <span className="h-1 w-1 rounded-full bg-current" />}
                  </span>
                  <span className={done ? "text-stone-800" : "text-stone-500"}>{label}</span>
                  <span className="ml-auto font-mono text-[11.5px] tabular-nums text-stone-400">{time}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Drawer>
    </>
  );
}

/* ============================== PAGE: PENDAFTARAN PEGAWAI ============================== */
/* Spreadsheet-style bulk entry grid for registering new employees.
   Each row = one new employee. Rows can be added, duplicated, and removed.
   Inline validation per cell, sticky action bar, confirm-on-discard modal. */

const ROLE_OPTIONS = [
  "Cleaning Staff",
  "Security Officer",
  "Technician",
  "Driver",
  "Supervisor",
  "Team Lead",
];

const SITE_OPTIONS = ["Plaza Senayan", "Grand Indonesia", "Pondok Indah Mall", "Kota Kasablanka"];

function emptyRow() {
  return {
    id: Math.random().toString(36).slice(2, 10),
    nama: "",
    role: "",
    site: "",
    tanggalMasuk: "",
    status: "Draft",
  };
}

function isRowEmpty(r) {
  return !r.nama.trim() && !r.role && !r.site && !r.tanggalMasuk;
}
function isRowComplete(r) {
  return r.nama.trim() && r.role && r.site;
}

/* A cell input that looks like part of the grid, not a form field.
   Borderless by default; borders come from the surrounding grid. */
function GridCellInput({ value, onChange, placeholder, onKeyDown, invalid, type = "text", inputRef }) {
  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={classNames(
        "h-full w-full bg-transparent px-3 text-[13.5px] text-stone-800 placeholder:text-stone-400 focus:outline-none",
        "focus:bg-white focus:ring-2 focus:ring-inset",
        invalid ? "focus:ring-rose-500/60 bg-rose-50/40" : "focus:ring-blue-600/50"
      )}
    />
  );
}

function GridCellSelect({ value, onChange, options, placeholder, invalid, inputRef }) {
  return (
    <div className="relative h-full">
      <select
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={classNames(
          "h-full w-full appearance-none bg-transparent pl-3 pr-7 text-[13.5px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-inset",
          value ? "text-stone-800" : "text-stone-400",
          invalid ? "focus:ring-rose-500/60 bg-rose-50/40" : "focus:ring-blue-600/50"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
    </div>
  );
}

/* A tiny confirmation modal, only used on this page. Consistent with Drawer. */
function ConfirmModal({ open, onCancel, onConfirm, title, body, confirmLabel = "Discard", confirmVariant = "danger" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-2xl">
        <div className="px-5 pt-5 pb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-stone-900">{title}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{body}</p>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50/50 px-5 py-3">
          <Button size="sm" variant="secondary" onClick={onCancel}>Keep editing</Button>
          <Button size="sm" variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

/* A lightweight toast that self-dismisses. */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const Icon = toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? AlertTriangle : CheckCircle2;
  const tone = toast.variant === "error"
    ? "bg-rose-50 text-rose-700 ring-rose-600/15"
    : "bg-emerald-50 text-emerald-700 ring-emerald-600/15";

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[60] -translate-x-1/2">
      <div className={classNames(
        "pointer-events-auto flex items-center gap-2.5 rounded-lg bg-white px-3.5 py-2.5 text-[13px] font-medium shadow-lg shadow-stone-900/10 ring-1 ring-inset transition",
        tone
      )}>
        <Icon className="h-4 w-4" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

function PagePendaftaranPegawai() {
  const [rows, setRows] = useState(() => [emptyRow(), emptyRow(), emptyRow()]);
  const [errors, setErrors] = useState({}); // { rowId: { nama: true, role: true } }
  const [showValidation, setShowValidation] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // How many rows have real content
  const nonEmptyRows = useMemo(() => rows.filter((r) => !isRowEmpty(r)), [rows]);
  const validRows = useMemo(() => nonEmptyRows.filter(isRowComplete), [nonEmptyRows]);
  const hasAnyInput = nonEmptyRows.length > 0;
  const canSubmit = validRows.length > 0 && validRows.length === nonEmptyRows.length && !submitting;

  // Update a single field
  const updateCell = (rowId, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));
    // Clear the error for this cell as soon as user types
    if (errors[rowId]?.[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        if (next[rowId]) {
          const rowErr = { ...next[rowId] };
          delete rowErr[field];
          if (Object.keys(rowErr).length === 0) delete next[rowId];
          else next[rowId] = rowErr;
        }
        return next;
      });
    }
  };

  const addRow = () => setRows((p) => [...p, emptyRow()]);
  const duplicateRow = (id) => {
    setRows((p) => {
      const i = p.findIndex((r) => r.id === id);
      if (i === -1) return p;
      const copy = { ...p[i], id: Math.random().toString(36).slice(2, 10), status: "Draft" };
      return [...p.slice(0, i + 1), copy, ...p.slice(i + 1)];
    });
  };
  const removeRow = (id) => {
    setRows((p) => {
      const next = p.filter((r) => r.id !== id);
      return next.length === 0 ? [emptyRow()] : next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearForm = () => {
    setRows([emptyRow(), emptyRow(), emptyRow()]);
    setErrors({});
    setShowValidation(false);
  };

  // Cancel: if nothing entered, reset silently; else confirm
  const handleCancel = () => {
    if (!hasAnyInput) { clearForm(); return; }
    setConfirmCancel(true);
  };

  const confirmDiscard = () => {
    setConfirmCancel(false);
    clearForm();
  };

  // Save Draft: keeps rows intact, stamps status
  const handleSaveDraft = () => {
    setRows((p) => p.map((r) => (isRowEmpty(r) ? r : { ...r, status: "Draft" })));
    setLastSavedAt(new Date());
    setToast({ variant: "success", message: "Draft saved" });
  };

  // Submit: validate, mark submitted, clear
  const handleSubmit = () => {
    const nextErrors = {};
    rows.forEach((r) => {
      if (isRowEmpty(r)) return;
      const rowErr = {};
      if (!r.nama.trim()) rowErr.nama = true;
      if (!r.role)        rowErr.role = true;
      if (!r.site)        rowErr.site = true;
      if (Object.keys(rowErr).length) nextErrors[r.id] = rowErr;
    });

    setErrors(nextErrors);
    setShowValidation(true);

    if (Object.keys(nextErrors).length > 0) {
      setToast({ variant: "error", message: "Please fill required fields in highlighted rows" });
      return;
    }
    if (nonEmptyRows.length === 0) {
      setToast({ variant: "error", message: "Add at least one employee to submit" });
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const count = nonEmptyRows.length;
      setSubmitting(false);
      clearForm();
      setToast({
        variant: "success",
        message: count === 1
          ? "Employee registered successfully"
          : `${count} employees registered successfully`,
      });
    }, 900);
  };

  const savedLabel = lastSavedAt
    ? `Draft saved · ${lastSavedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
    : null;

  return (
    <>
      <PageHeader
        breadcrumb={["Workforce", "Pendaftaran Pegawai"]}
        title="Pendaftaran Pegawai"
        subtitle="Register new employees individually or in bulk. Each row is one new hire."
        left={
          <>
            <span className="text-[12.5px] text-stone-500">
              <span className="font-medium text-stone-700 tabular-nums">{nonEmptyRows.length}</span> of{" "}
              <span className="tabular-nums">{rows.length}</span> row{rows.length === 1 ? "" : "s"} filled
            </span>
            {savedLabel && (
              <span className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
                <CheckCircle2 className="h-3 w-3" />
                {savedLabel}
              </span>
            )}
          </>
        }
        right={
          <>
            <Button variant="secondary" icon={Download}>Import CSV</Button>
            <Button variant="secondary" icon={Plus} onClick={addRow}>Add row</Button>
          </>
        }
      />

      {/* pb-24 leaves room for the sticky action bar so it never covers content */}
      <div className="px-6 py-5 pb-24">
        {/* Help strip */}
        <div className="mb-3 flex items-center gap-2 rounded-md border border-blue-200/70 bg-blue-50/60 px-3 py-2 text-[12.5px] text-blue-900">
          <Hash className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <span>
            Tip — press <kbd className="rounded border border-blue-300 bg-white px-1 py-px font-mono text-[10.5px] text-blue-700">Tab</kbd> to move between cells,
            <kbd className="ml-1 rounded border border-blue-300 bg-white px-1 py-px font-mono text-[10.5px] text-blue-700">Enter</kbd> on the last row to add another.
            Required fields are marked with <span className="text-rose-600">*</span>.
          </span>
        </div>

        {/* Grid */}
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          {/* Column header */}
          <div className="grid grid-cols-[44px_minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(180px,1fr)_160px_120px_44px] border-b border-stone-200 bg-stone-50/60 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            <div className="flex items-center justify-center border-r border-stone-200 py-2.5">#</div>
            <div className="flex items-center border-r border-stone-200 px-3 py-2.5">
              Nama Pegawai <span className="ml-1 text-rose-500">*</span>
            </div>
            <div className="flex items-center border-r border-stone-200 px-3 py-2.5">
              Role <span className="ml-1 text-rose-500">*</span>
            </div>
            <div className="flex items-center border-r border-stone-200 px-3 py-2.5">
              Site <span className="ml-1 text-rose-500">*</span>
            </div>
            <div className="flex items-center border-r border-stone-200 px-3 py-2.5">Tanggal Masuk</div>
            <div className="flex items-center border-r border-stone-200 px-3 py-2.5">Status</div>
            <div />
          </div>

          {/* Rows */}
          {rows.map((row, idx) => {
            const rowErr = errors[row.id] || {};
            const rowComplete = isRowComplete(row);
            const rowEmpty = isRowEmpty(row);
            const showRowErrors = showValidation && Object.keys(rowErr).length > 0;

            return (
              <div
                key={row.id}
                className={classNames(
                  "group relative grid grid-cols-[44px_minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(180px,1fr)_160px_120px_44px] border-b border-stone-100 last:border-b-0 transition-colors",
                  showRowErrors ? "bg-rose-50/30" : "hover:bg-stone-50/50"
                )}
              >
                {/* Row number */}
                <div className="flex items-center justify-center border-r border-stone-100 text-[11.5px] font-medium tabular-nums text-stone-400">
                  {idx + 1}
                </div>

                {/* Nama */}
                <div className="h-11 border-r border-stone-100">
                  <GridCellInput
                    value={row.nama}
                    onChange={(v) => updateCell(row.id, "nama", v)}
                    placeholder="e.g. Budi Santoso"
                    invalid={rowErr.nama}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && idx === rows.length - 1) {
                        e.preventDefault();
                        addRow();
                      }
                    }}
                  />
                </div>

                {/* Role */}
                <div className="h-11 border-r border-stone-100">
                  <GridCellSelect
                    value={row.role}
                    onChange={(v) => updateCell(row.id, "role", v)}
                    options={ROLE_OPTIONS}
                    placeholder="Select role"
                    invalid={rowErr.role}
                  />
                </div>

                {/* Site */}
                <div className="h-11 border-r border-stone-100">
                  <GridCellSelect
                    value={row.site}
                    onChange={(v) => updateCell(row.id, "site", v)}
                    options={SITE_OPTIONS}
                    placeholder="Select site"
                    invalid={rowErr.site}
                  />
                </div>

                {/* Tanggal Masuk */}
                <div className="h-11 border-r border-stone-100">
                  <GridCellInput
                    type="date"
                    value={row.tanggalMasuk}
                    onChange={(v) => updateCell(row.id, "tanggalMasuk", v)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>

                {/* Status */}
                <div className="flex items-center justify-start border-r border-stone-100 px-3">
                  {rowEmpty ? (
                    <span className="text-[12px] text-stone-300">—</span>
                  ) : (
                    <StatusBadge value={rowComplete ? row.status : "Pending"} />
                  )}
                </div>

                {/* Row actions */}
                <div className="flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <RowMenu
                    onDuplicate={() => duplicateRow(row.id)}
                    onRemove={() => removeRow(row.id)}
                    canRemove={rows.length > 1 || !rowEmpty}
                  />
                </div>
              </div>
            );
          })}

          {/* Grid footer: add row affordance */}
          <button
            onClick={addRow}
            className="flex w-full items-center gap-2 border-t border-stone-200 bg-stone-50/40 px-3 py-2.5 text-left text-[12.5px] font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add new row
          </button>
        </div>

        {/* Validation summary */}
        {showValidation && Object.keys(errors).length > 0 && (
          <div className="mt-3 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-[12.5px] text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div>
              <p className="font-medium">
                {Object.keys(errors).length} row{Object.keys(errors).length === 1 ? " is" : "s are"} missing required fields.
              </p>
              <p className="mt-0.5 text-rose-700/90">
                Nama Pegawai, Role, and Site are required for each employee. Highlighted cells need your attention.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-white/95 backdrop-blur shadow-[0_-4px_16px_-4px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3 px-6 py-3">
          {/* Left: summary */}
          <div className="flex items-center gap-2.5 text-[12.5px] text-stone-600">
            <span className="inline-flex items-center gap-1.5">
              <UserPlus className="h-3.5 w-3.5 text-stone-400" />
              <span className="tabular-nums font-medium text-stone-800">{validRows.length}</span>
              <span>ready to submit</span>
            </span>
            {nonEmptyRows.length > validRows.length && (
              <>
                <span className="text-stone-300">·</span>
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="tabular-nums font-medium">{nonEmptyRows.length - validRows.length}</span>
                  <span>incomplete</span>
                </span>
              </>
            )}
          </div>

          {/* Right: actions */}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost"     onClick={handleCancel}>Cancel</Button>
            <Button variant="secondary" onClick={handleSaveDraft} disabled={!hasAnyInput}
                    className={!hasAnyInput ? "cursor-not-allowed opacity-60" : ""}>
              Save Draft
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
              icon={submitting ? Loader2 : Check}
              className={classNames(submitting && "[&>svg]:animate-spin", !canSubmit && "cursor-not-allowed opacity-60")}
            >
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmCancel}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={confirmDiscard}
        title="Discard unsaved changes?"
        body="You have unsaved changes in this form. Leaving now will permanently discard them."
        confirmLabel="Discard changes"
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

/* Row action menu — matches the inline "more" pattern used elsewhere. */
function RowMenu({ onDuplicate, onRemove, canRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <IconButton onClick={() => setOpen((v) => !v)} title="Row actions">
        <MoreHorizontal className="h-4 w-4" />
      </IconButton>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-40 overflow-hidden rounded-md border border-stone-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => { onDuplicate(); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-stone-700 hover:bg-stone-100"
          >
            <Copy className="h-3.5 w-3.5 text-stone-500" /> Duplicate
          </button>
          <button
            onClick={() => { onRemove(); setOpen(false); }}
            disabled={!canRemove}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================== ROUTER ============================== */

const PAGE_FOR = {
  "att-log":  PageLogAbsensi,
  "ops-task": PageTasks,
  "rep-work": PageWorkReports,
  "rep-inc":  PageIncidents,
  "req-all":  PageRequests,
  "req-queue": PageRequests,
  "wf-reg":   PagePendaftaranPegawai,
};

function PagePlaceholder({ title }) {
  return (
    <>
      <PageHeader title={title} subtitle="This module is part of the Consteon platform." />
      <div className="px-6 py-12">
        <div className="mx-auto max-w-md rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[14px] font-medium text-stone-900">Module preview</p>
          <p className="mt-1 text-[12.5px] text-stone-500">
            Open <span className="font-medium text-stone-700">Log Absensi</span>, <span className="font-medium text-stone-700">Task & Assignment</span>, <span className="font-medium text-stone-700">Laporan Pekerjaan</span>, <span className="font-medium text-stone-700">Laporan Insiden</span>, or <span className="font-medium text-stone-700">Requests & Approvals</span> from the sidebar to see fully designed pages.
          </p>
        </div>
      </div>
    </>
  );
}

/* ============================== APP SHELL ============================== */

// White-label branding — swap this to any client name; sidebar picks it up automatically.
const CLIENT_NAME = "Vertika Tekno Lokacipta";

export default function ConsteonApp() {
  const [active, setActive] = useState("wf-reg");

  const Page = PAGE_FOR[active];
  const labelFor = (k) => {
    for (const item of NAV) {
      if (item.key === k) return item.label;
      if (item.children) {
        const c = item.children.find((c) => c.key === k);
        if (c) return c.label;
      }
    }
    return "Page";
  };

  return (
    <div className="flex h-screen w-full bg-stone-50 font-sans text-stone-900 antialiased">
      <Sidebar active={active} onNavigate={setActive} clientName={CLIENT_NAME} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {Page ? <Page /> : <PagePlaceholder title={labelFor(active)} />}
        </main>
      </div>
    </div>
  );
}
