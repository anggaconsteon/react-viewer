import React, { useState, useMemo, useRef } from "react";
import {
  Search, Plus, Filter, MapPin, Clock, CheckCircle2,
  ArrowLeft, Camera, QrCode, ChevronDown, Send, Image as ImageIcon,
  Shield, Sparkles, Wrench, MoreHorizontal, User, UserCheck, HardHat,
  Inbox, Loader2, CheckCheck, Lock, Upload, X, Paperclip, Bell,
  LayoutGrid, FileText, Users, BarChart3, Settings, ChevronRight,
  AlertCircle, RotateCcw, Timer, ClipboardList, Calendar,
  PlayCircle, FileCheck2, History
} from "lucide-react";

/* =========================================================================
   MOCK DATA
   ========================================================================= */

const SITES = [
  { id: "s1", name: "Tower A — Lobby" },
  { id: "s2", name: "Tower A — Floor 3 Pantry" },
  { id: "s3", name: "Tower B — Parking B2" },
  { id: "s4", name: "Tower B — Rooftop" },
  { id: "s5", name: "Annex — Loading Dock" },
];

const CATEGORIES = [
  { id: "security",     label: "Security",    icon: Shield,    tone: "indigo" },
  { id: "cleaning",     label: "Cleaning",    icon: Sparkles,  tone: "teal"   },
  { id: "maintenance",  label: "Maintenance", icon: Wrench,    tone: "amber"  },
  { id: "others",       label: "Others",      icon: MoreHorizontal, tone: "slate" },
];

const SEVERITIES = [
  { id: "low",      label: "Low" },
  { id: "medium",   label: "Medium" },
  { id: "high",     label: "High" },
  { id: "critical", label: "Critical" },
];

const STATUS_FLOW_COMPLAINT = ["open", "acknowledged", "in_progress", "resolved", "closed"];
const STATUS_FLOW_REPORT    = ["logged", "reviewed", "closed"];

const getStatusFlow = (type) =>
  type === "report" ? STATUS_FLOW_REPORT : STATUS_FLOW_COMPLAINT;

const WORKERS = [
  { id: "w1", name: "Pak Joko",  speciality: "Maintenance" },
  { id: "w2", name: "Bu Tini",   speciality: "Cleaning"    },
  { id: "w3", name: "Pak Hadi",  speciality: "Maintenance" },
  { id: "w4", name: "Pak Anton", speciality: "Security"    },
  { id: "w5", name: "Bu Sri",    speciality: "Cleaning"    },
];

const TASK_TYPES = [
  "Inspection",
  "Repair",
  "Cleaning",
  "Replacement",
  "Investigation",
  "Other",
];

const TASK_STATUS_FLOW = ["assigned", "in_progress", "completed"];

const TASK_STATUS_META = {
  assigned:    { label: "Assigned",    pill: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500", icon: ClipboardList },
  in_progress: { label: "In Progress", pill: "bg-blue-50 text-blue-700 ring-blue-200",       dot: "bg-blue-500",   icon: PlayCircle    },
  completed:   { label: "Completed",   pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", icon: FileCheck2 },
};

const initialComplaints = [
  {
    id: "CMP-2041",
    type: "complaint",
    source: "client",
    title: "Broken glass near main entrance",
    description: "Glass panel by the main lobby door is cracked. Sharp edges visible — risk of injury for visitors entering during morning rush.",
    category: "maintenance",
    severity: "high",
    location: "Tower A — Lobby",
    status: "in_progress",
    createdAt: "2026-04-25T08:14:00",
    sla: { dueIn: -2, breached: true },
    photos: [
      "https://images.unsplash.com/photo-1597004897768-cf01ed5b8b25?w=600&q=70",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=70",
    ],
    submittedBy: { name: "Adi Nugroho", role: "Client" },
    assignedTo: { name: "Pak Joko", role: "Worker" },
    linkedTask: {
      id: "TSK-1087",
      assignedTo: { id: "w1", name: "Pak Joko" },
      taskType: "Repair",
      status: "in_progress",
      deadline: "2026-04-25T14:00:00",
      notes: "Cordon area first. Order replacement panel from supplier.",
      createdAt: "2026-04-25T08:33:00",
      startedAt: "2026-04-25T09:01:00",
      completedAt: null,
      evidence: [
        {
          photos: ["https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=70"],
          notes: "Area secured with safety tape. Awaiting replacement panel.",
          timestamp: "2026-04-25T09:12:00",
          phase: "before",
        },
      ],
    },
    taskHistory: [],
    updates: [
      { type: "comment", user: "Adi Nugroho", role: "Client",     message: "Submitted via QR scan at lobby station.", timestamp: "2026-04-25T08:14:00" },
      { type: "system",  user: "System",      role: "System",     message: "Task TSK-1087 created and assigned to Pak Joko", timestamp: "2026-04-25T08:33:00" },
      { type: "status",  user: "Bu Rina",     role: "Supervisor", message: "Acknowledged",   timestamp: "2026-04-25T08:33:00" },
      { type: "system",  user: "System",      role: "System",     message: "Task started by Pak Joko", timestamp: "2026-04-25T09:01:00" },
      { type: "status",  user: "Pak Joko",    role: "Worker",     message: "In Progress",    timestamp: "2026-04-25T09:01:00" },
    ],
  },
  {
    id: "CMP-2040",
    type: "complaint",
    source: "client",
    title: "Restroom not cleaned since morning",
    description: "Floor 3 ladies' restroom — bins overflowing, no tissue, water on floor.",
    category: "cleaning",
    severity: "medium",
    location: "Tower A — Floor 3 Pantry",
    status: "resolved",
    createdAt: "2026-04-25T07:02:00",
    sla: { dueIn: 1, breached: false },
    photos: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=70"],
    submittedBy: { name: "Sari Putri",  role: "Client" },
    assignedTo:  { name: "Bu Tini",     role: "Worker" },
    linkedTask: {
      id: "TSK-1086",
      assignedTo: { id: "w2", name: "Bu Tini" },
      taskType: "Cleaning",
      status: "completed",
      deadline: "2026-04-25T09:00:00",
      notes: "Deep clean + restock. Add to 2-hourly checklist going forward.",
      createdAt: "2026-04-25T07:10:00",
      startedAt: "2026-04-25T07:25:00",
      completedAt: "2026-04-25T08:45:00",
      evidence: [
        {
          photos: ["https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=70"],
          notes: "Deep cleaned, restocked tissue & soap, dried floor. Added to 2-hourly checklist.",
          timestamp: "2026-04-25T08:45:00",
          phase: "after",
        },
      ],
    },
    taskHistory: [],
    resolution: {
      notes: "Deep cleaned, restocked tissue & soap, dried floor. Added to 2-hourly checklist.",
      resolvedBy: "Bu Tini",
      resolvedAt: "2026-04-25T08:45:00",
      photos: ["https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=70"],
    },
    updates: [
      { type: "comment", user: "Sari Putri", role: "Client",     message: "Urgent please — guests arriving at 9.", timestamp: "2026-04-25T07:02:00" },
      { type: "system",  user: "System",     role: "System",     message: "Task TSK-1086 created and assigned to Bu Tini", timestamp: "2026-04-25T07:10:00" },
      { type: "status",  user: "Bu Rina",    role: "Supervisor", message: "Acknowledged",  timestamp: "2026-04-25T07:10:00" },
      { type: "system",  user: "System",     role: "System",     message: "Task started by Bu Tini", timestamp: "2026-04-25T07:25:00" },
      { type: "status",  user: "Bu Tini",    role: "Worker",     message: "In Progress",   timestamp: "2026-04-25T07:25:00" },
      { type: "system",  user: "System",     role: "System",     message: "Task completed — complaint marked Resolved", timestamp: "2026-04-25T08:45:00" },
      { type: "status",  user: "Bu Tini",    role: "Worker",     message: "Resolved",      timestamp: "2026-04-25T08:45:00" },
    ],
  },
  {
    id: "CMP-2039",
    type: "complaint",
    source: "client",
    title: "Unauthorized vehicle in reserved bay",
    description: "Black SUV parked in bay B2-14 (reserved for tenant). Plate B 1234 XYZ. Has been there since 6am.",
    category: "security",
    severity: "low",
    location: "Tower B — Parking B2",
    status: "open",
    createdAt: "2026-04-25T06:18:00",
    sla: { dueIn: 6, breached: false },
    photos: [],
    submittedBy: { name: "Reza Pratama", role: "Client" },
    assignedTo: null,
    linkedTask: null,
    taskHistory: [],
    updates: [
      { type: "comment", user: "Reza Pratama", role: "Client", message: "Submitted from parking entry kiosk.", timestamp: "2026-04-25T06:18:00" },
    ],
  },
  {
    id: "CMP-2038",
    type: "complaint",
    source: "client",
    title: "AC leaking onto carpet",
    description: "Conference room AC unit dripping. Carpet patch is wet ~50cm radius. Smells musty.",
    category: "maintenance",
    severity: "critical",
    location: "Tower B — Rooftop",
    status: "closed",
    createdAt: "2026-04-24T14:30:00",
    sla: { dueIn: 0, breached: false },
    photos: [],
    submittedBy: { name: "Lina W.",  role: "Client" },
    assignedTo:  { name: "Pak Hadi", role: "Worker" },
    linkedTask: {
      id: "TSK-1082",
      assignedTo: { id: "w3", name: "Pak Hadi" },
      taskType: "Repair",
      status: "completed",
      deadline: "2026-04-24T18:00:00",
      notes: "Replace drain hose, dry carpet, schedule quarterly check.",
      createdAt: "2026-04-24T14:38:00",
      startedAt: "2026-04-24T15:02:00",
      completedAt: "2026-04-24T18:10:00",
      evidence: [
        {
          photos: [],
          notes: "Drain hose replaced. Carpet dried with dehumidifier (2hr cycle). Quarterly inspection scheduled.",
          timestamp: "2026-04-24T18:10:00",
          phase: "after",
        },
      ],
    },
    taskHistory: [],
    resolution: {
      notes: "Replaced drain hose, dried carpet with dehumidifier. Scheduled quarterly check.",
      resolvedBy: "Pak Hadi",
      resolvedAt: "2026-04-24T18:10:00",
      photos: [],
    },
    updates: [
      { type: "comment", user: "Lina W.",  role: "Client",     message: "Meeting at 4pm — please prioritize.", timestamp: "2026-04-24T14:30:00" },
      { type: "system",  user: "System",   role: "System",     message: "Task TSK-1082 created and assigned to Pak Hadi", timestamp: "2026-04-24T14:38:00" },
      { type: "status",  user: "Bu Rina",  role: "Supervisor", message: "Acknowledged", timestamp: "2026-04-24T14:38:00" },
      { type: "system",  user: "System",   role: "System",     message: "Task started by Pak Hadi", timestamp: "2026-04-24T15:02:00" },
      { type: "status",  user: "Pak Hadi", role: "Worker",     message: "In Progress",  timestamp: "2026-04-24T15:02:00" },
      { type: "system",  user: "System",   role: "System",     message: "Task completed — complaint marked Resolved", timestamp: "2026-04-24T18:10:00" },
      { type: "status",  user: "Pak Hadi", role: "Worker",     message: "Resolved",     timestamp: "2026-04-24T18:10:00" },
      { type: "status",  user: "Lina W.",  role: "Client",     message: "Closed",       timestamp: "2026-04-24T19:00:00" },
    ],
  },
  {
    id: "CMP-2037",
    type: "complaint",
    source: "client",
    title: "Loading dock light flickering",
    description: "Sodium lamp at dock 2 has been flickering for 3 nights. Drivers complain of poor visibility.",
    category: "maintenance",
    severity: "low",
    location: "Annex — Loading Dock",
    status: "open",
    createdAt: "2026-04-25T05:45:00",
    sla: { dueIn: 22, breached: false },
    photos: [],
    submittedBy: { name: "Pak Bambang", role: "Client" },
    assignedTo: null,
    linkedTask: null,
    taskHistory: [],
    updates: [
      { type: "comment", user: "Pak Bambang", role: "Client", message: "Will need ladder access.", timestamp: "2026-04-25T05:45:00" },
    ],
  },
  {
    id: "RPT-0312",
    type: "report",
    source: "worker",
    title: "Suspicious package at parcel locker",
    description: "Unattended brown box at locker 14, no return address. Cordoned area as precaution. Awaiting supervisor review before opening.",
    category: "security",
    severity: "high",
    location: "Tower A — Lobby",
    status: "logged",
    createdAt: "2026-04-25T07:48:00",
    sla: { dueIn: 4, breached: false },
    photos: ["https://images.unsplash.com/photo-1607435097405-db48f377bff6?w=600&q=70"],
    submittedBy: { name: "Pak Anton", role: "Worker" },
    assignedTo: null,
    linkedTask: null,
    taskHistory: [],
    updates: [
      { type: "comment", user: "Pak Anton", role: "Worker", message: "Logged during 7:30am rounds. Area cordoned.", timestamp: "2026-04-25T07:48:00" },
    ],
  },
  {
    id: "RPT-0311",
    type: "report",
    source: "worker",
    title: "Spill cleaned up at lift lobby — for awareness",
    description: "Coffee spill near lift bank. Cleaned and dried. Reporting for log only — no further action needed.",
    category: "cleaning",
    severity: "low",
    location: "Tower A — Floor 3 Pantry",
    status: "reviewed",
    createdAt: "2026-04-25T06:55:00",
    sla: { dueIn: 24, breached: false },
    photos: [],
    submittedBy: { name: "Bu Sri", role: "Worker" },
    assignedTo: null,
    linkedTask: null,
    taskHistory: [],
    updates: [
      { type: "comment", user: "Bu Sri",  role: "Worker",     message: "Already cleaned. Logging for shift handover.", timestamp: "2026-04-25T06:55:00" },
      { type: "system",  user: "System",  role: "System",     message: "Report reviewed by Bu Rina", timestamp: "2026-04-25T07:10:00" },
      { type: "status",  user: "Bu Rina", role: "Supervisor", message: "Reviewed", timestamp: "2026-04-25T07:10:00" },
    ],
  },
  {
    id: "RPT-0310",
    type: "report",
    source: "worker",
    title: "CCTV camera B2-03 offline",
    description: "Parking B2 camera 03 not transmitting since 5am. Lens looks intact, suspect cabling. Recommend maintenance follow-up.",
    category: "security",
    severity: "medium",
    location: "Tower B — Parking B2",
    status: "reviewed",
    createdAt: "2026-04-25T05:20:00",
    sla: { dueIn: 18, breached: false },
    photos: [],
    submittedBy: { name: "Pak Anton", role: "Worker" },
    assignedTo: { name: "Pak Hadi", role: "Worker" },
    linkedTask: {
      id: "TSK-1085",
      assignedTo: { id: "w3", name: "Pak Hadi" },
      taskType: "Inspection",
      status: "assigned",
      deadline: "2026-04-25T16:00:00",
      notes: "Check cabling at junction box first. Replace if needed.",
      createdAt: "2026-04-25T06:05:00",
      startedAt: null,
      completedAt: null,
      evidence: [],
    },
    taskHistory: [],
    updates: [
      { type: "comment", user: "Pak Anton", role: "Worker",     message: "Noticed during overnight monitoring rotation.", timestamp: "2026-04-25T05:20:00" },
      { type: "system",  user: "System",    role: "System",     message: "Report reviewed by Bu Rina", timestamp: "2026-04-25T06:00:00" },
      { type: "status",  user: "Bu Rina",   role: "Supervisor", message: "Reviewed", timestamp: "2026-04-25T06:00:00" },
      { type: "system",  user: "System",    role: "System",     message: "Task TSK-1085 created and assigned to Pak Hadi (optional follow-up)", timestamp: "2026-04-25T06:05:00" },
    ],
  },
];

/* =========================================================================
   DESIGN TOKENS / HELPERS
   ========================================================================= */

const STATUS_META = {
  open:         { label: "Open",         dot: "bg-slate-400",  pill: "bg-slate-100 text-slate-700 ring-slate-200",      icon: Inbox      },
  acknowledged: { label: "Acknowledged", dot: "bg-violet-500", pill: "bg-violet-50 text-violet-700 ring-violet-200",    icon: CheckCircle2 },
  in_progress:  { label: "In Progress",  dot: "bg-blue-500",   pill: "bg-blue-50 text-blue-700 ring-blue-200",          icon: Loader2    },
  resolved:     { label: "Resolved",     dot: "bg-emerald-500",pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCheck },
  closed:       { label: "Closed",       dot: "bg-slate-700",  pill: "bg-slate-800 text-white ring-slate-800",          icon: Lock       },
  logged:       { label: "Logged",       dot: "bg-sky-500",    pill: "bg-sky-50 text-sky-700 ring-sky-200",             icon: FileText   },
  reviewed:     { label: "Reviewed",     dot: "bg-emerald-500",pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCheck },
};

const SEVERITY_META = {
  low:      { label: "Low",      pill: "bg-slate-100 text-slate-700 ring-slate-200" },
  medium:   { label: "Medium",   pill: "bg-amber-50 text-amber-800 ring-amber-200" },
  high:     { label: "High",     pill: "bg-orange-50 text-orange-800 ring-orange-200" },
  critical: { label: "Critical", pill: "bg-red-50 text-red-700 ring-red-200" },
};

const ROLE_META = {
  Client:     { icon: User,      tint: "bg-slate-100 text-slate-600" },
  Supervisor: { icon: UserCheck, tint: "bg-violet-100 text-violet-700" },
  Worker:     { icon: HardHat,   tint: "bg-blue-100 text-blue-700" },
  System:     { icon: Sparkles,  tint: "bg-indigo-100 text-indigo-700" },
};

const CAT_META = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

/** Determines who is currently expected to act on a complaint or report. */
function computeNextAction(record) {
  const t = record.linkedTask;

  // ---- REPORT FLOW ----
  if (record.type === "report") {
    if (record.status === "closed") {
      return { role: "None", label: "Report closed", tone: "done" };
    }
    if (record.status === "logged") {
      return { role: "Supervisor", label: "Waiting for Supervisor to review", tone: "supervisor" };
    }
    if (record.status === "reviewed") {
      // Reviewed = effectively complete unless an optional task is still running
      if (t && t.status !== "completed") {
        return { role: "Worker", label: `Optional follow-up: ${t.assignedTo.name}`, tone: "worker" };
      }
      return { role: "None", label: "Report reviewed — no action needed", tone: "done" };
    }
  }

  // ---- COMPLAINT FLOW ----
  if (record.status === "closed") {
    return { role: "None", label: "Complaint closed", tone: "done" };
  }
  if (record.status === "resolved") {
    return { role: "Client", label: "Waiting for Client confirmation", tone: "client" };
  }
  if (!t) {
    return { role: "Supervisor", label: "Waiting for Supervisor to create task", tone: "supervisor" };
  }
  if (t.status === "assigned") {
    return { role: "Worker", label: `Waiting for ${t.assignedTo.name} to start task`, tone: "worker" };
  }
  if (t.status === "in_progress") {
    return { role: "Worker", label: `Waiting for ${t.assignedTo.name} to complete task`, tone: "worker" };
  }
  if (t.status === "completed") {
    return { role: "Client", label: "Waiting for Client confirmation", tone: "client" };
  }
  return { role: "Supervisor", label: "Waiting for Supervisor", tone: "supervisor" };
}

const fmtTime = (iso) => {
  const d = new Date(iso);
  const now = new Date("2026-04-25T10:00:00");
  const diffMs = now - d;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const fmtFull = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

/* =========================================================================
   ATOM: BADGES
   ========================================================================= */

function StatusBadge({ status, size = "md" }) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 font-medium ${m.pill} ${pad}`}>
      <Icon className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} ${status === "in_progress" ? "animate-spin" : ""}`} strokeWidth={2.4}/>
      {m.label}
    </span>
  );
}

function SeverityBadge({ severity, size = "md" }) {
  const m = SEVERITY_META[severity];
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ring-1 font-medium ${m.pill} ${pad}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        severity === "critical" ? "bg-red-500" :
        severity === "high"     ? "bg-orange-500" :
        severity === "medium"   ? "bg-amber-500" : "bg-slate-400"
      }`}/>
      {m.label}
    </span>
  );
}

function SLABadge({ sla, status }) {
  if (status === "resolved" || status === "closed") return null;
  if (sla.breached) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 text-[11px] font-semibold">
        <AlertCircle className="w-3 h-3" strokeWidth={2.4}/>
        Overdue {Math.abs(sla.dueIn)}h
      </span>
    );
  }
  if (sla.dueIn <= 4) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 ring-1 ring-amber-200 text-[11px] font-semibold">
        <Timer className="w-3 h-3" strokeWidth={2.4}/>
        Due in {sla.dueIn}h
      </span>
    );
  }
  return null;
}

function CategoryChip({ category }) {
  const c = CAT_META[category];
  const Icon = c.icon;
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    teal:   "bg-teal-50 text-teal-700 ring-teal-100",
    amber:  "bg-amber-50 text-amber-800 ring-amber-100",
    slate:  "bg-slate-100 text-slate-700 ring-slate-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ring-1 ${tones[c.tone]}`}>
      <Icon className="w-3 h-3" strokeWidth={2.4}/>
      {c.label}
    </span>
  );
}

function TypeBadge({ type, size = "md" }) {
  const isReport = type === "report";
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  const Icon = isReport ? FileText : AlertCircle;
  const cls = isReport
    ? "bg-sky-50 text-sky-700 ring-sky-200"
    : "bg-rose-50 text-rose-700 ring-rose-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md ring-1 font-semibold uppercase tracking-wider ${cls} ${pad}`}>
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} strokeWidth={2.6}/>
      {isReport ? "Report" : "Complaint"}
    </span>
  );
}

/* =========================================================================
   COMPLAINT CARD
   ========================================================================= */

function ComplaintCard({ complaint, onClick }) {
  const c = complaint;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md shadow-sm transition-all p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeBadge type={c.type} size="sm" />
          <CategoryChip category={c.category} />
          <span className="text-[11px] text-slate-400 font-mono">{c.id}</span>
        </div>
        <SLABadge sla={c.sla} status={c.status} />
      </div>

      <h3 className="text-[15px] font-semibold text-slate-900 leading-snug mb-1 line-clamp-2 group-hover:text-indigo-700 transition-colors">
        {c.title}
      </h3>
      <p className="text-sm text-slate-500 line-clamp-1 mb-3">{c.description}</p>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
        <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3.5 h-3.5"/>{c.location}</span>
        <span className="text-slate-300">·</span>
        <span className="inline-flex items-center gap-1 shrink-0"><Clock className="w-3.5 h-3.5"/>{fmtTime(c.createdAt)}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} size="sm" />
          <SeverityBadge severity={c.severity} size="sm" />
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"/>
      </div>
    </button>
  );
}

/* =========================================================================
   TIMELINE STATUS
   ========================================================================= */

function TimelineStatus({ current, type = "complaint" }) {
  const flow = getStatusFlow(type);
  const idx = flow.indexOf(current);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Status</h3>

      {/* Desktop horizontal */}
      <div className="hidden md:flex items-center">
        {flow.map((s, i) => {
          const m = STATUS_META[s];
          const Icon = m.icon;
          const done   = i < idx;
          const active = i === idx;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  active ? "bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110" :
                  done   ? "bg-emerald-500 text-white" :
                           "bg-slate-100 text-slate-400"
                }`}>
                  <Icon className={`w-4 h-4 ${active && s === "in_progress" ? "animate-spin" : ""}`} strokeWidth={2.5}/>
                  {active && (
                    <span className="absolute -inset-1 rounded-full border-2 border-indigo-400 animate-ping opacity-40"/>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${active ? "text-indigo-700" : done ? "text-slate-700" : "text-slate-400"}`}>
                  {m.label}
                </span>
              </div>
              {i < flow.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 transition-all ${i < idx ? "bg-emerald-500" : "bg-slate-200"}`}/>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile vertical */}
      <div className="md:hidden flex flex-col">
        {flow.map((s, i) => {
          const m = STATUS_META[s];
          const Icon = m.icon;
          const done   = i < idx;
          const active = i === idx;
          return (
            <div key={s} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  active ? "bg-indigo-600 text-white ring-4 ring-indigo-100" :
                  done   ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.5}/>
                </div>
                {i < flow.length - 1 && (
                  <div className={`w-0.5 h-6 my-1 ${i < idx ? "bg-emerald-500" : "bg-slate-200"}`}/>
                )}
              </div>
              <div className="pt-1.5 pb-3">
                <div className={`text-sm font-medium ${active ? "text-indigo-700" : done ? "text-slate-700" : "text-slate-400"}`}>
                  {m.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   PHOTO UPLOADER
   ========================================================================= */

function PhotoUploader({ photos, setPhotos, max = 5 }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const remaining = max - photos.length;
    const arr = Array.from(files).slice(0, remaining);
    const reads = arr.map(f => new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    }));
    Promise.all(reads).then(urls => setPhotos([...photos, ...urls]));
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
        {photos.map((src, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200 group">
            <img src={src} alt="" className="w-full h-full object-cover"/>
            <button
              type="button"
              onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5"/>
            </button>
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <Camera className="w-5 h-5" strokeWidth={2}/>
            <span className="text-[11px] font-medium">Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-slate-400 mt-2">{photos.length}/{max} photos</p>
    </div>
  );
}

/* =========================================================================
   CONVERSATION THREAD
   ========================================================================= */

function ConversationThread({ updates }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Activity ({updates.length})
      </h3>
      <ol className="space-y-4">
        {updates.map((u, i) => {
          const role = ROLE_META[u.role] ?? ROLE_META.Client;
          const RoleIcon = role.icon;

          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${role.tint}`}>
                  <RoleIcon className="w-4 h-4" strokeWidth={2.2}/>
                </div>
                {i < updates.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1"/>}
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-slate-900">{u.user}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{u.role}</span>
                  <span className="text-xs text-slate-400">{fmtFull(u.timestamp)}</span>
                </div>

                {u.type === "status" ? (
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <span className="text-slate-400">marked as</span>
                    <StatusBadge status={u.message.toLowerCase().replace(" ", "_")} size="sm" />
                  </div>
                ) : u.type === "system" ? (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-50/60 text-indigo-800 text-xs font-medium ring-1 ring-indigo-100">
                    <Sparkles className="w-3 h-3" strokeWidth={2.4}/>
                    {u.message}
                  </div>
                ) : u.type === "photo" ? (
                  <div>
                    <p className="text-sm text-slate-700 mb-2">{u.message}</p>
                    <img src={u.photo} alt="" className="rounded-lg max-w-xs ring-1 ring-slate-200"/>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed">{u.message}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* =========================================================================
   COMMENT INPUT
   ========================================================================= */

function CommentInput({ onSubmit }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };
  return (
    <div className="flex items-end gap-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-2.5">
      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg shrink-0">
        <Paperclip className="w-4 h-4"/>
      </button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment…"
        rows={1}
        className="flex-1 resize-none bg-transparent text-sm placeholder:text-slate-400 focus:outline-none px-1 py-2 max-h-32"
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
      />
      <button
        onClick={submit}
        disabled={!text.trim()}
        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-200 disabled:text-slate-400 text-sm font-medium inline-flex items-center gap-1.5 transition-colors shrink-0"
      >
        <Send className="w-3.5 h-3.5"/>
        Send
      </button>
    </div>
  );
}

/* =========================================================================
   NEXT ACTION INDICATOR
   ========================================================================= */

function NextActionIndicator({ complaint }) {
  const next = computeNextAction(complaint);
  const tones = {
    supervisor: { bg: "bg-violet-50",   text: "text-violet-800",   ring: "ring-violet-200",   dot: "bg-violet-500",   icon: UserCheck },
    worker:     { bg: "bg-blue-50",     text: "text-blue-800",     ring: "ring-blue-200",     dot: "bg-blue-500",     icon: HardHat   },
    client:     { bg: "bg-amber-50",    text: "text-amber-900",    ring: "ring-amber-200",    dot: "bg-amber-500",    icon: User      },
    done:       { bg: "bg-slate-100",   text: "text-slate-700",    ring: "ring-slate-200",    dot: "bg-slate-500",    icon: CheckCheck },
  };
  const t = tones[next.tone];
  const Icon = t.icon;

  return (
    <div className={`inline-flex items-center gap-2.5 ${t.bg} ${t.text} ring-1 ${t.ring} rounded-xl pl-2 pr-3.5 py-1.5`}>
      <span className="relative flex w-6 h-6 items-center justify-center">
        <span className={`absolute inset-0 rounded-full ${t.dot} opacity-20 ${next.tone !== "done" ? "animate-ping" : ""}`}/>
        <span className={`relative w-6 h-6 rounded-full ${t.dot} text-white flex items-center justify-center`}>
          <Icon className="w-3 h-3" strokeWidth={2.6}/>
        </span>
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[11px] uppercase tracking-wider font-semibold opacity-70">Next</span>
        <span className="text-sm font-semibold">{next.label}</span>
      </div>
    </div>
  );
}

/* =========================================================================
   LINKED TASK CARD
   ========================================================================= */

function TaskStatusBadge({ status, size = "md" }) {
  const m = TASK_STATUS_META[status];
  const Icon = m.icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 font-medium ${m.pill} ${pad}`}>
      <Icon className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"}`} strokeWidth={2.4}/>
      {m.label}
    </span>
  );
}

function LinkedTaskCard({ task, history }) {
  if (!task && (!history || history.length === 0)) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wrench className="w-4 h-4" strokeWidth={2.4}/>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Linked Task</h3>
        </div>
        {task && <TaskStatusBadge status={task.status} />}
      </div>

      {task ? (
        <div className="px-5 pb-5">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-sm font-semibold text-slate-900">{task.id}</span>
            {task.taskType && (
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {task.taskType}
              </span>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2">
              <HardHat className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2}/>
              <div className="min-w-0">
                <dt className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Worker</dt>
                <dd className="text-slate-900 font-medium truncate">{task.assignedTo.name}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2.5 bg-slate-50 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2.2}/>
              <div className="min-w-0">
                <dt className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Deadline</dt>
                <dd className="text-slate-900 font-medium truncate">
                  {task.deadline ? fmtFull(task.deadline) : <span className="text-slate-400 italic font-normal">—</span>}
                </dd>
              </div>
            </div>
          </dl>

          {task.notes && (
            <p className="text-sm text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-100">
              {task.notes}
            </p>
          )}

          {/* Mini task progression */}
          <div className="flex items-center gap-1.5 mt-4">
            {TASK_STATUS_FLOW.map((s, i) => {
              const idx = TASK_STATUS_FLOW.indexOf(task.status);
              const done   = i < idx;
              const active = i === idx;
              return (
                <React.Fragment key={s}>
                  <div className={`flex-1 h-1.5 rounded-full ${
                    done ? "bg-emerald-500" :
                    active ? (s === "completed" ? "bg-emerald-500" : "bg-blue-500") :
                    "bg-slate-200"
                  }`}/>
                </React.Fragment>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
            {TASK_STATUS_FLOW.map(s => (
              <span key={s} className={task.status === s ? "text-slate-900" : ""}>{TASK_STATUS_META[s].label}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5 text-sm text-slate-500 italic">No active task. Previous task(s) below.</div>
      )}

      {/* Historical tasks (after reopen) */}
      {history && history.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
            <History className="w-3 h-3"/> Previous tasks
          </div>
          <ul className="space-y-1.5">
            {history.map(h => (
              <li key={h.id} className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-700">{h.id}</span>
                <span className="text-slate-500">{h.assignedTo.name}</span>
                <TaskStatusBadge status={h.status} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   TASK EVIDENCE SECTION
   ========================================================================= */

function TaskEvidenceSection({ evidence }) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4 text-slate-400"/>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Evidence</h3>
        </div>
        <p className="text-sm text-slate-400 italic">No evidence uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-4 h-4 text-slate-400"/>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Task Evidence ({evidence.length})
        </h3>
      </div>

      <div className="space-y-4">
        {evidence.map((ev, i) => (
          <div key={i} className="relative pl-4 border-l-2 border-slate-100">
            <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500"/>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {ev.phase && (
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  ev.phase === "before"
                    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                }`}>
                  {ev.phase}
                </span>
              )}
              <span className="text-xs text-slate-500">{fmtFull(ev.timestamp)}</span>
            </div>
            {ev.notes && <p className="text-sm text-slate-700 leading-relaxed mb-2">{ev.notes}</p>}
            {ev.photos && ev.photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ev.photos.map((p, j) => (
                  <img key={j} src={p} alt="" className="aspect-square rounded-lg object-cover ring-1 ring-slate-200"/>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   CREATE TASK MODAL
   ========================================================================= */

function CreateTaskModal({ open, onClose, onCreate, complaint }) {
  const [workerId, setWorkerId] = useState("");
  const [taskType, setTaskType] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const valid = workerId.length > 0;

  const submit = () => {
    if (!valid) return;
    const worker = WORKERS.find(w => w.id === workerId);
    onCreate({
      assignedTo: { id: worker.id, name: worker.name },
      taskType: taskType || null,
      deadline: deadline || null,
      notes: notes.trim(),
    });
    // reset
    setWorkerId(""); setTaskType(""); setDeadline(""); setNotes("");
  };

  // Suggest worker by category
  const suggestedSpeciality = {
    cleaning: "Cleaning",
    security: "Security",
    maintenance: "Maintenance",
  }[complaint?.category];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Create Task</h2>
            <p className="text-xs text-slate-500 mt-0.5">Linked to <span className="font-mono font-semibold text-slate-700">{complaint?.id}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Worker */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              Assign Worker <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
              >
                <option value="">Select worker…</option>
                {WORKERS.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} — {w.speciality}
                    {suggestedSpeciality === w.speciality ? "  ✓ suggested" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
            </div>
          </div>

          {/* Task type */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              Task Type <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TASK_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaskType(taskType === t ? "" : t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    taskType === t
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              Deadline <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              Notes <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specific instructions for the worker…"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   UPLOAD EVIDENCE MODAL (worker-side)
   ========================================================================= */

function UploadEvidenceModal({ open, onClose, onUpload }) {
  const [phase, setPhase] = useState("after");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);

  if (!open) return null;

  const valid = photos.length > 0 || notes.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onUpload({ phase, notes: notes.trim(), photos });
    setPhase("after"); setNotes(""); setPhotos([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upload Work Evidence</h2>
            <p className="text-xs text-slate-500 mt-0.5">Attached to the linked task</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">Phase</label>
            <div className="grid grid-cols-2 gap-2">
              {["before", "after"].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhase(p)}
                  className={`py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                    phase === p
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">Photos</label>
            <PhotoUploader photos={photos} setPhotos={setPhotos} max={5}/>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe what was done…"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
          >
            Upload Evidence
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ACTION PANEL
   ========================================================================= */

function ActionPanel({ role, complaint, onAction }) {
  const status = complaint.status;
  const task = complaint.linkedTask;
  const isReport = complaint.type === "report";
  const actions = [];

  if (isReport) {
    /* ---------- REPORT FLOW ---------- */
    if (role === "Supervisor") {
      if (status === "logged") {
        actions.push({ id: "review_report", label: "Mark as Reviewed", primary: true, icon: CheckCheck });
      }
      if (status !== "closed" && !task) {
        actions.push({ id: "create_task", label: "Create Task (optional)", icon: Plus });
      }
      if (task && task.status !== "completed") {
        actions.push({ id: "reassign", label: "Reassign Worker", icon: UserCheck });
      }
      if (status !== "closed") {
        actions.push({ id: "close_report", label: "Close Report", icon: Lock });
      }
    } else if (role === "Worker") {
      // Worker who submitted the report can comment, or act on optional task
      if (task && task.assignedTo) {
        if (task.status === "assigned") {
          actions.push({ id: "start_task", label: "Start Task", primary: true, icon: PlayCircle });
        }
        if (task.status === "in_progress") {
          actions.push({ id: "upload_evidence", label: "Upload Work Evidence", icon: Upload });
          actions.push({ id: "complete_task", label: "Mark Task Completed", primary: true, icon: FileCheck2 });
        }
      }
      // Always allow comment for workers on reports
      if (actions.length === 0) {
        actions.push({ id: "comment", label: "Add Comment", icon: Send });
      }
    } else if (role === "Client") {
      // Client can only comment on reports — no resolution actions
      // (action panel will fall through to "Nothing to do" empty state)
    }
  } else {
    /* ---------- COMPLAINT FLOW (existing) ---------- */
    if (role === "Supervisor") {
      if (status !== "closed" && status !== "resolved") {
        if (!task) {
          actions.push({ id: "create_task", label: "Create Task", primary: true, icon: Plus });
        } else if (task.status === "completed") {
          // task done, awaiting client
        } else {
          actions.push({ id: "reassign", label: "Reassign Worker", icon: UserCheck });
        }
      }
      if (status !== "closed") {
        actions.push({ id: "comment", label: "Add Comment", icon: Send });
      }
    } else if (role === "Worker") {
      if (task && task.assignedTo) {
        if (task.status === "assigned") {
          actions.push({ id: "start_task", label: "Start Task", primary: true, icon: PlayCircle });
        }
        if (task.status === "in_progress") {
          actions.push({ id: "upload_evidence", label: "Upload Work Evidence", icon: Upload });
          actions.push({ id: "complete_task", label: "Mark Task Completed", primary: true, icon: FileCheck2 });
        }
      }
    } else if (role === "Client") {
      if (status === "resolved") {
        actions.push({ id: "confirm", label: "Confirm Resolution", primary: true, icon: CheckCheck });
        actions.push({ id: "reopen", label: "Reopen", icon: RotateCcw });
      }
      if (status === "closed") {
        actions.push({ id: "reopen", label: "Reopen Complaint", icon: RotateCcw });
      }
    }
  }

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">as {role}</span>
        </div>
        <p className="text-sm text-slate-400 italic">Nothing to do right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Actions
        </h3>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
          as {role}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {actions.map(a => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => onAction(a.id)}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                a.primary
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2.4}/>
              {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   RESOLUTION CARD
   ========================================================================= */

function ResolutionCard({ resolution }) {
  if (!resolution) return null;
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/30 rounded-2xl border border-emerald-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
          <CheckCheck className="w-4 h-4" strokeWidth={2.5}/>
        </div>
        <h3 className="text-sm font-semibold text-emerald-900">Resolution</h3>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed mb-3">{resolution.notes}</p>

      {resolution.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {resolution.photos.map((p, i) => (
            <img key={i} src={p} alt="" className="aspect-square rounded-lg object-cover ring-1 ring-emerald-200"/>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-emerald-800/80 pt-3 border-t border-emerald-200">
        <span className="inline-flex items-center gap-1"><HardHat className="w-3.5 h-3.5"/>{resolution.resolvedBy}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{fmtFull(resolution.resolvedAt)}</span>
      </div>
    </div>
  );
}

/* =========================================================================
   PAGE: COMPLAINT LIST
   ========================================================================= */

function ComplaintListPage({ complaints, onOpen, onCreate }) {
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // all | complaint | report
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterSev, setFilterSev] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Records visible after type filter (used to drive status-tab counts so they make sense)
  const typeScoped = useMemo(() => {
    if (typeFilter === "all") return complaints;
    return complaints.filter(c => c.type === typeFilter);
  }, [complaints, typeFilter]);

  const counts = useMemo(() => {
    const out = {
      all: typeScoped.length,
      open: 0, in_progress: 0, resolved: 0, closed: 0,
      logged: 0, reviewed: 0,
    };
    typeScoped.forEach(c => { if (out[c.status] !== undefined) out[c.status]++; });
    return out;
  }, [typeScoped]);

  const typeCounts = useMemo(() => ({
    all:       complaints.length,
    complaint: complaints.filter(c => c.type === "complaint").length,
    report:    complaints.filter(c => c.type === "report").length,
  }), [complaints]);

  const filtered = useMemo(() => {
    return typeScoped.filter(c => {
      if (tab !== "all" && c.status !== tab) return false;
      if (filterSite && c.location !== filterSite) return false;
      if (filterCat && c.category !== filterCat) return false;
      if (filterSev && c.severity !== filterSev) return false;
      if (search && !(`${c.title} ${c.description} ${c.id}`.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [typeScoped, tab, search, filterSite, filterCat, filterSev]);

  // Tabs adapt to which type is selected
  const tabs = useMemo(() => {
    if (typeFilter === "report") {
      return [
        { id: "all",      label: "All",      count: counts.all },
        { id: "logged",   label: "Logged",   count: counts.logged },
        { id: "reviewed", label: "Reviewed", count: counts.reviewed },
        { id: "closed",   label: "Closed",   count: counts.closed },
      ];
    }
    if (typeFilter === "complaint") {
      return [
        { id: "all",          label: "All",          count: counts.all },
        { id: "open",         label: "Open",         count: counts.open },
        { id: "in_progress",  label: "In Progress",  count: counts.in_progress },
        { id: "resolved",     label: "Resolved",     count: counts.resolved },
        { id: "closed",       label: "Closed",       count: counts.closed },
      ];
    }
    // 'all' types — collapse to common buckets
    return [
      { id: "all",         label: "All",         count: counts.all },
      { id: "open",        label: "Open",        count: counts.open },
      { id: "logged",      label: "Logged",      count: counts.logged },
      { id: "in_progress", label: "In Progress", count: counts.in_progress },
      { id: "resolved",    label: "Resolved",    count: counts.resolved },
      { id: "closed",      label: "Closed",      count: counts.closed },
    ];
  }, [typeFilter, counts]);

  const hasActiveFilters = filterSite || filterCat || filterSev;

  // Reset status tab if it becomes invalid for the current type
  React.useEffect(() => {
    if (!tabs.some(t => t.id === tab)) setTab("all");
  }, [tabs, tab]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Reports & Complaints</h1>
          <p className="text-sm text-slate-500 mt-1">Unified log of internal reports and client complaints</p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5}/>
          <span className="hidden sm:inline">New Entry</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Type filter (segmented) */}
      <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-4">
        {[
          { id: "all",       label: "All",        icon: LayoutGrid },
          { id: "complaint", label: "Complaints", icon: AlertCircle },
          { id: "report",    label: "Reports",    icon: FileText },
        ].map(t => {
          const Icon = t.icon;
          const active = typeFilter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2.4}/>
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                active ? "bg-slate-100 text-slate-700" : "bg-slate-200 text-slate-600"
              }`}>
                {typeCounts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + filter trigger */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports & complaints…"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            filtersOpen || hasActiveFilters
              ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
              : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
          <Filter className="w-4 h-4"/>
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"/>
          )}
        </button>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FilterSelect label="Site"     value={filterSite} onChange={setFilterSite}
            options={[{ value: "", label: "All sites" }, ...SITES.map(s => ({ value: s.name, label: s.name }))]}/>
          <FilterSelect label="Category" value={filterCat}  onChange={setFilterCat}
            options={[{ value: "", label: "All categories" }, ...CATEGORIES.map(c => ({ value: c.id, label: c.label }))]}/>
          <FilterSelect label="Severity" value={filterSev}  onChange={setFilterSev}
            options={[{ value: "", label: "All severities" }, ...SEVERITIES.map(s => ({ value: s.id, label: s.label }))]}/>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState onCreate={onCreate} />
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => onOpen(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="relative mt-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
      </div>
    </label>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-slate-400" strokeWidth={1.8}/>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">Nothing matches</h3>
      <p className="text-sm text-slate-500 mb-5">Try clearing filters or create a new entry.</p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        <Plus className="w-4 h-4"/> New Entry
      </button>
    </div>
  );
}

/* =========================================================================
   PAGE: CREATE COMPLAINT
   ========================================================================= */

function CreateComplaintPage({ onCancel, onSubmit, role = "Client" }) {
  // Default: Worker → report, otherwise → complaint
  const defaultType = role === "Worker" ? "report" : "complaint";
  const [type, setType] = useState(defaultType);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);

  const valid = location && category && severity && description.trim().length > 5;

  const submit = () => {
    if (!valid) return;
    onSubmit({ type, location, category, severity, description, photos });
  };

  const isReport = type === "report";

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 pb-32 sm:pb-8">
      <button onClick={onCancel} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 -ml-1">
        <ArrowLeft className="w-4 h-4"/> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {isReport ? "New Report" : "New Complaint"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isReport
            ? "Log an internal observation from your shift"
            : "Report an issue you've spotted on-site"}
        </p>
      </div>

      <div className="space-y-5">
        {/* Type selector */}
        <Section title="Type" required>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "complaint", label: "Complaint", hint: "External — from a client", icon: AlertCircle, ring: "ring-rose-500", bg: "bg-rose-600" },
              { id: "report",    label: "Report",    hint: "Internal — from worker",   icon: FileText,    ring: "ring-sky-500",  bg: "bg-sky-600"  },
            ].map(t => {
              const Icon = t.icon;
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`relative flex flex-col items-start text-left gap-1 p-4 rounded-xl transition-all ${
                    active
                      ? `${t.bg} text-white ring-2 ${t.ring} ring-offset-2`
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" strokeWidth={2.4}/>
                    <span className="text-sm font-bold">{t.label}</span>
                  </div>
                  <span className={`text-xs ${active ? "opacity-90" : "text-slate-500"}`}>{t.hint}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Location */}
        <Section title="Location" required>
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2.5">
            <button
              type="button"
              onClick={() => setLocation(SITES[0].name)}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
            >
              <QrCode className="w-4 h-4"/> Scan QR
            </button>
            <div className="relative">
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
              >
                <option value="">Select location manually…</option>
                {SITES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
            </div>
          </div>
        </Section>

        {/* Category */}
        <Section title="Category" required>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const active = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? "bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2}/>
                  {c.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Severity */}
        <Section title="Severity" required>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SEVERITIES.map(s => {
              const active = severity === s.id;
              const tones = {
                low:      "bg-slate-700 ring-slate-700",
                medium:   "bg-amber-500 ring-amber-500",
                high:     "bg-orange-500 ring-orange-500",
                critical: "bg-red-600 ring-red-600",
              };
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeverity(s.id)}
                  className={`relative py-4 rounded-xl text-sm font-semibold transition-all overflow-hidden ${
                    active
                      ? `${tones[s.id]} text-white ring-2 ring-offset-2`
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${active ? "bg-white" : (
                      s.id === "critical" ? "bg-red-500" :
                      s.id === "high" ? "bg-orange-500" :
                      s.id === "medium" ? "bg-amber-500" : "bg-slate-400"
                    )}`}/>
                    {s.label}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Description */}
        <Section title="Description" required>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what happened, when, and any details that will help the team resolve it…"
            rows={5}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
          />
          <p className="text-xs text-slate-400 mt-1.5">{description.length} characters</p>
        </Section>

        {/* Photos */}
        <Section title="Photos" hint="Up to 5 photos">
          <PhotoUploader photos={photos} setPhotos={setPhotos} max={5} />
        </Section>
      </div>

      {/* Sticky submit on mobile, inline on desktop */}
      <div className="hidden sm:flex justify-end gap-2 mt-8">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!valid}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
        >
          {isReport ? "Submit Report" : "Submit Complaint"}
        </button>
      </div>

      <div className="sm:hidden fixed bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur border-t border-slate-200 z-30">
        <button
          onClick={submit}
          disabled={!valid}
          className="w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
        >
          {isReport ? "Submit Report" : "Submit Complaint"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, hint, required, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-semibold text-slate-800">
          {title} {required && <span className="text-red-500">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* =========================================================================
   PAGE: COMPLAINT DETAIL
   ========================================================================= */

function ComplaintDetailPage({ complaint, role, onBack, onAction, onComment }) {
  const c = complaint;
  const cat = CAT_META[c.category];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-32 lg:pb-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 -ml-1">
        <ArrowLeft className="w-4 h-4"/> All complaints
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge type={c.type} />
            <CategoryChip category={c.category} />
            <span className="text-xs text-slate-400 font-mono">{c.id}</span>
          </div>
          <SLABadge sla={c.sla} status={c.status} />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug mb-3">
          {c.title}
        </h1>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <StatusBadge status={c.status} />
          <SeverityBadge severity={c.severity} />
        </div>

        <NextActionIndicator complaint={c} />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600 pt-4 mt-4 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400"/>{c.location}</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400"/>{fmtFull(c.createdAt)}</span>
          <span className="inline-flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400"/>{c.submittedBy.name}</span>
          {c.assignedTo && (
            <span className="inline-flex items-center gap-1.5"><HardHat className="w-4 h-4 text-slate-400"/>{c.assignedTo.name}</span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Main column */}
        <div className="space-y-5">
          <TimelineStatus current={c.status} type={c.type} />

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{c.description}</p>

            {c.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {c.photos.map((p, i) => (
                  <img key={i} src={p} alt="" className="aspect-square rounded-lg object-cover ring-1 ring-slate-200"/>
                ))}
              </div>
            )}
          </div>

          {(c.status === "resolved" || c.status === "closed") && c.resolution && (
            <ResolutionCard resolution={c.resolution} />
          )}

          {(c.linkedTask || (c.taskHistory && c.taskHistory.length > 0)) && (
            <LinkedTaskCard task={c.linkedTask} history={c.taskHistory} />
          )}

          {c.linkedTask && c.linkedTask.evidence && (
            <TaskEvidenceSection evidence={c.linkedTask.evidence} />
          )}

          <ConversationThread updates={c.updates} />

          <CommentInput onSubmit={onComment} />
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <ActionPanel role={role} complaint={c} onAction={onAction} />

          {/* Meta */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Category</dt>
                <dd className="text-slate-900 font-medium">{cat.label}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Severity</dt>
                <dd><SeverityBadge severity={c.severity} size="sm"/></dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Reporter</dt>
                <dd className="text-slate-900 font-medium">{c.submittedBy.name}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Assignee</dt>
                <dd className="text-slate-900 font-medium">{c.assignedTo?.name ?? <span className="text-slate-400 italic font-normal">Unassigned</span>}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Linked Task</dt>
                <dd className="text-slate-900 font-mono text-xs">{c.linkedTask?.id ?? <span className="text-slate-400 italic font-normal">—</span>}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Updates</dt>
                <dd className="text-slate-900 font-medium">{c.updates.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   APP SHELL
   ========================================================================= */

function Sidebar() {
  const items = [
    { icon: LayoutGrid, label: "Dashboard" },
    { icon: FileText,   label: "Reports", active: true },
    { icon: Users,      label: "Workforce" },
    { icon: BarChart3,  label: "Reports" },
    { icon: Settings,   label: "Settings" },
  ];
  return (
    <aside className="hidden lg:flex w-60 flex-col bg-white border-r border-slate-200 shrink-0">
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Consteon</span>
        </div>
      </div>
      <nav className="p-3 flex-1">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <button
              key={i}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                it.active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2.2}/>
              {it.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar({ role, setRole }) {
  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 h-14">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-slate-900 text-sm">Consteon</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Role switcher (demo aid) */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {["Client", "Supervisor", "Worker"].map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  role === r ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
            <Bell className="w-4 h-4"/>
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500"/>
          </button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
            DC
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================================
   MAIN
   ========================================================================= */

export default function App() {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [view, setView] = useState({ name: "list" });
  const [role, setRole] = useState("Supervisor");

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);

  // Task ID counter (so newly-created tasks have unique sequential IDs)
  const taskIdRef = useRef(1090);
  const nextTaskId = () => `TSK-${taskIdRef.current++}`;

  const openComplaint = (id) => setView({ name: "detail", id });
  const goList = () => setView({ name: "list" });
  const goCreate = () => setView({ name: "create" });

  const submitComplaint = (data) => {
    const isReport = data.type === "report";
    const now = new Date().toISOString();

    // ID prefix + numbering by type
    const prefix = isReport ? "RPT" : "CMP";
    const sameTypeCount = complaints.filter(c =>
      isReport ? c.id.startsWith("RPT-") : c.id.startsWith("CMP-")
    ).length;
    const baseN = isReport ? 313 : 2042;
    const id = `${prefix}-${String(baseN + sameTypeCount).padStart(isReport ? 4 : 4, "0")}`;

    const submitterRole = role === "Worker" ? "Worker" : "Client";
    const source = isReport ? "worker" : "client";

    const newC = {
      id,
      type: isReport ? "report" : "complaint",
      source,
      title: data.description.split(/[.\n]/)[0].slice(0, 60) || (isReport ? "New report" : "New complaint"),
      description: data.description,
      category: data.category,
      severity: data.severity,
      location: data.location,
      status: isReport ? "logged" : "open",
      createdAt: now,
      sla: { dueIn: 24, breached: false },
      photos: data.photos,
      submittedBy: { name: "You", role: submitterRole },
      assignedTo: null,
      linkedTask: null,
      taskHistory: [],
      updates: [
        {
          type: "comment",
          user: "You",
          role: submitterRole,
          message: isReport ? "Report submitted." : "Complaint submitted.",
          timestamp: now,
        },
      ],
    };
    setComplaints([newC, ...complaints]);
    setView({ name: "detail", id });
  };

  const detailComplaint = view.name === "detail" ? complaints.find(c => c.id === view.id) : null;

  const userMap = { Client: "You (Client)", Supervisor: "You (Supervisor)", Worker: "You (Worker)" };

  /* ---------- Action handlers ---------- */

  const handleAction = (actionId) => {
    if (!detailComplaint) return;
    const userName = userMap[role];
    const now = new Date().toISOString();

    if (actionId === "create_task") {
      setTaskModalOpen(true);
      return;
    }

    if (actionId === "reassign") {
      setTaskModalOpen(true);
      return;
    }

    if (actionId === "upload_evidence") {
      setEvidenceModalOpen(true);
      return;
    }

    if (actionId === "comment") {
      // CommentInput handles its own send
      return;
    }

    setComplaints(prev => prev.map(c => {
      if (c.id !== detailComplaint.id) return c;

      let { status, linkedTask, taskHistory, resolution, assignedTo, updates } = c;
      updates = [...updates];
      taskHistory = taskHistory ? [...taskHistory] : [];

      if (actionId === "start_task" && linkedTask) {
        linkedTask = { ...linkedTask, status: "in_progress", startedAt: now };
        // Only sync complaint status; reports don't move on task start
        if (c.type !== "report") status = "in_progress";
        updates.push({ type: "system", user: "System", role: "System", message: `Task started by ${linkedTask.assignedTo.name}`, timestamp: now });
        if (c.type !== "report") {
          updates.push({ type: "status", user: userName, role, message: "In Progress", timestamp: now });
        }
      }

      else if (actionId === "complete_task" && linkedTask) {
        linkedTask = { ...linkedTask, status: "completed", completedAt: now };
        const afterEv = [...(linkedTask.evidence || [])].reverse().find(e => e.phase === "after") || (linkedTask.evidence || []).slice(-1)[0];
        if (c.type === "report") {
          // Report: task completion is informational, doesn't change report status
          updates.push({ type: "system", user: "System", role: "System", message: `Optional task completed by ${linkedTask.assignedTo.name}`, timestamp: now });
        } else {
          status = "resolved";
          resolution = {
            notes: afterEv?.notes || "Task completed. Awaiting client confirmation.",
            resolvedBy: linkedTask.assignedTo.name,
            resolvedAt: now,
            photos: afterEv?.photos || [],
          };
          updates.push({ type: "system", user: "System", role: "System", message: "Task completed — complaint marked Resolved", timestamp: now });
          updates.push({ type: "status", user: userName, role, message: "Resolved", timestamp: now });
        }
      }

      else if (actionId === "review_report") {
        status = "reviewed";
        updates.push({ type: "system", user: "System", role: "System", message: `Report reviewed by ${userName}`, timestamp: now });
        updates.push({ type: "status", user: userName, role, message: "Reviewed", timestamp: now });
      }

      else if (actionId === "close_report") {
        status = "closed";
        updates.push({ type: "system", user: "System", role: "System", message: `Report closed by ${userName}`, timestamp: now });
        updates.push({ type: "status", user: userName, role, message: "Closed", timestamp: now });
      }

      else if (actionId === "confirm") {
        status = "closed";
        updates.push({ type: "status", user: userName, role, message: "Closed", timestamp: now });
        updates.push({ type: "system", user: "System", role: "System", message: "Complaint closed by client", timestamp: now });
      }

      else if (actionId === "reopen") {
        // Move current task into history, reset to initial status
        if (linkedTask) {
          taskHistory.push(linkedTask);
        }
        linkedTask = null;
        assignedTo = null;
        status = c.type === "report" ? "logged" : "open";
        resolution = undefined;
        const what = c.type === "report" ? "Report" : "Complaint";
        updates.push({ type: "system", user: "System", role: "System", message: `${what} reopened by client`, timestamp: now });
        updates.push({ type: "comment", user: userName, role, message: "Reopened — issue not fully resolved.", timestamp: now });
      }

      return { ...c, status, linkedTask, taskHistory, resolution, assignedTo, updates };
    }));
  };

  /* ---------- Modal: Create Task ---------- */

  const handleCreateTask = (data) => {
    if (!detailComplaint) return;
    const userName = userMap[role];
    const now = new Date().toISOString();
    const tid = nextTaskId();

    setComplaints(prev => prev.map(c => {
      if (c.id !== detailComplaint.id) return c;

      const isReassign = !!c.linkedTask;
      const taskHistory = isReassign ? [...(c.taskHistory || []), c.linkedTask] : (c.taskHistory || []);

      const newTask = {
        id: tid,
        assignedTo: data.assignedTo,
        taskType: data.taskType,
        deadline: data.deadline,
        notes: data.notes,
        status: "assigned",
        createdAt: now,
        startedAt: null,
        completedAt: null,
        evidence: [],
      };

      const updates = [...c.updates,
        { type: "system", user: "System", role: "System",
          message: isReassign
            ? `Task ${tid} reassigned to ${data.assignedTo.name} (previous task moved to history)`
            : `Task ${tid} created and assigned to ${data.assignedTo.name}`,
          timestamp: now },
      ];

      // Sync complaint status: any new task → at least Acknowledged
      let status = c.status;
      if (status === "open") {
        status = "acknowledged";
        updates.push({ type: "status", user: userName, role, message: "Acknowledged", timestamp: now });
      }

      return {
        ...c,
        linkedTask: newTask,
        taskHistory,
        status,
        assignedTo: { name: data.assignedTo.name, role: "Worker" },
        updates,
      };
    }));

    setTaskModalOpen(false);
  };

  /* ---------- Modal: Upload Evidence ---------- */

  const handleUploadEvidence = (ev) => {
    if (!detailComplaint) return;
    const userName = userMap[role];
    const now = new Date().toISOString();

    setComplaints(prev => prev.map(c => {
      if (c.id !== detailComplaint.id || !c.linkedTask) return c;
      const newEvidence = { ...ev, timestamp: now };
      const linkedTask = {
        ...c.linkedTask,
        evidence: [...(c.linkedTask.evidence || []), newEvidence],
      };
      const updates = [...c.updates,
        { type: "system", user: "System", role: "System",
          message: `Evidence uploaded by ${linkedTask.assignedTo.name} (${ev.phase})`,
          timestamp: now },
      ];
      return { ...c, linkedTask, updates };
    }));

    setEvidenceModalOpen(false);
  };

  /* ---------- Comment ---------- */

  const handleComment = (text) => {
    if (!detailComplaint) return;
    const now = new Date().toISOString();
    setComplaints(prev => prev.map(c =>
      c.id === detailComplaint.id
        ? { ...c, updates: [...c.updates, { type: "comment", user: userMap[role], role, message: text, timestamp: now }] }
        : c
    ));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar/>
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar role={role} setRole={setRole}/>
        <main className="flex-1">
          {view.name === "list" && (
            <ComplaintListPage
              complaints={complaints}
              onOpen={openComplaint}
              onCreate={goCreate}
            />
          )}
          {view.name === "create" && (
            <CreateComplaintPage
              onCancel={goList}
              onSubmit={submitComplaint}
              role={role}
            />
          )}
          {view.name === "detail" && detailComplaint && (
            <ComplaintDetailPage
              complaint={detailComplaint}
              role={role}
              onBack={goList}
              onAction={handleAction}
              onComment={handleComment}
            />
          )}
        </main>
      </div>

      <CreateTaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onCreate={handleCreateTask}
        complaint={detailComplaint}
      />

      <UploadEvidenceModal
        open={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        onUpload={handleUploadEvidence}
      />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
