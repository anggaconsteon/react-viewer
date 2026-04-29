import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, Plus, Filter, MapPin, Clock, CheckCircle2,
  ArrowLeft, Camera, QrCode, ChevronDown, Send, Image as ImageIcon,
  Shield, Sparkles, Wrench, MoreHorizontal, User, UserCheck, HardHat,
  Inbox, Loader2, CheckCheck, Lock, Upload, X, Paperclip, Bell,
  LayoutGrid, FileText, Users, BarChart3, Settings, ChevronRight,
  AlertCircle, RotateCcw, Timer, ClipboardList, Calendar,
  PlayCircle, FileCheck2, History,
  CheckSquare, Square, ChevronUp, ListChecks, AlertTriangle, Circle,
  LogIn, LogOut, Power, MinusCircle, Navigation, ShieldCheck, ShieldAlert,
  Plane, Edit3, ThumbsUp, ThumbsDown, Hourglass
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

/* =========================================================================
   CHECKLIST TEMPLATES
   ========================================================================= */

const CHECKLIST_TEMPLATES = [
  {
    id: "tpl-clean-floor",
    name: "Floor Cleaning Round",
    category: "cleaning",
    icon: Sparkles,
    description: "Standard cleaning sweep for common areas",
    areas: [
      {
        id: "a-lobby", name: "Lobby", sequence: 1,
        checklistItems: [
          { id: "i-l1", label: "Floor clean & dry" },
          { id: "i-l2", label: "Trash bins emptied" },
          { id: "i-l3", label: "Glass doors wiped" },
        ],
      },
      {
        id: "a-pantry", name: "Pantry", sequence: 2,
        checklistItems: [
          { id: "i-p1", label: "Sink clean" },
          { id: "i-p2", label: "No leftover food" },
          { id: "i-p3", label: "Counter wiped" },
        ],
      },
      {
        id: "a-restroom", name: "Restroom", sequence: 3,
        checklistItems: [
          { id: "i-r1", label: "Floor dry" },
          { id: "i-r2", label: "Soap available" },
          { id: "i-r3", label: "Tissue stocked" },
          { id: "i-r4", label: "No odor" },
        ],
      },
    ],
  },
  {
    id: "tpl-sec-patrol",
    name: "Security Patrol",
    category: "security",
    icon: Shield,
    description: "Checkpoint-by-checkpoint patrol round",
    areas: [
      {
        id: "a-main-entry", name: "Main Entry", sequence: 1,
        checklistItems: [
          { id: "i-me1", label: "Doors secured" },
          { id: "i-me2", label: "CCTV operational" },
          { id: "i-me3", label: "No suspicious activity" },
        ],
      },
      {
        id: "a-parking-b1", name: "Parking B1", sequence: 2,
        checklistItems: [
          { id: "i-pb1", label: "Barrier gates working" },
          { id: "i-pb2", label: "All lights on" },
          { id: "i-pb3", label: "No unauthorized vehicles" },
        ],
      },
      {
        id: "a-rooftop", name: "Rooftop Access", sequence: 3,
        checklistItems: [
          { id: "i-rt1", label: "Access door locked" },
          { id: "i-rt2", label: "Equipment intact" },
        ],
      },
    ],
  },
  {
    id: "tpl-maint-daily",
    name: "Daily Maintenance Check",
    category: "maintenance",
    icon: Wrench,
    description: "Building systems quick check",
    areas: [
      {
        id: "a-electrical", name: "Electrical Room", sequence: 1,
        checklistItems: [
          { id: "i-e1", label: "Panel readings normal" },
          { id: "i-e2", label: "No abnormal sounds" },
          { id: "i-e3", label: "Temperature acceptable" },
        ],
      },
      {
        id: "a-water", name: "Water Tank Area", sequence: 2,
        checklistItems: [
          { id: "i-w1", label: "Tank level OK" },
          { id: "i-w2", label: "No leaks visible" },
        ],
      },
    ],
  },
];

/** Compute the status of a single area from its item results. */
function computeAreaStatus(itemResults) {
  if (!itemResults || itemResults.length === 0) return "not_started";
  const checked = itemResults.filter(i => i.checked).length;
  if (checked === 0) return "not_started";
  if (checked === itemResults.length) return "completed";
  return "in_progress";
}

/** Compute checklist-wide stats: progress, has issue (any unchecked at completed-area). */
function computeChecklistStats(record) {
  if (!record?.checklistResult) {
    return { totalItems: 0, doneItems: 0, percent: 0, areasDone: 0, totalAreas: 0, hasIssue: false };
  }
  let totalItems = 0, doneItems = 0, areasDone = 0;
  let hasIssue = false;
  for (const area of record.checklistResult) {
    totalItems += area.checklistItems.length;
    const done = area.checklistItems.filter(i => i.checked).length;
    doneItems += done;
    const status = computeAreaStatus(area.checklistItems);
    if (status === "completed") areasDone++;
    // "Issue" flag: an area marked completed but with notes left on items, OR area finalized with unchecked
    if (area.status === "issue" || area.checklistItems.some(i => !i.checked && i.note?.trim())) {
      hasIssue = true;
    }
  }
  return {
    totalItems, doneItems,
    percent: totalItems ? Math.round((doneItems / totalItems) * 100) : 0,
    areasDone, totalAreas: record.checklistResult.length,
    hasIssue,
  };
}

/** Build a fresh checklistResult from a template. */
function makeBlankChecklistResult(template) {
  return template.areas.map(area => ({
    areaId: area.id,
    status: "not_started",
    checklistItems: area.checklistItems.map(item => ({
      id: item.id,
      checked: false,
      note: "",
    })),
  }));
}

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
      messages: [
        { type: "system",  user: "System",  role: "System",     message: "Task created", timestamp: "2026-04-25T08:33:00" },
        { type: "comment", user: "Bu Rina", role: "Supervisor", message: "Pak Joko, please prioritize this. Foot traffic starts in 30 min.", timestamp: "2026-04-25T08:35:00" },
        { type: "comment", user: "Pak Joko", role: "Worker",    message: "Sudah on the way. Akan secure dulu pakai safety tape.", timestamp: "2026-04-25T08:42:00" },
        { type: "comment", user: "Pak Joko", role: "Worker",    message: "Replacement panel ETA 2 hours from supplier.", timestamp: "2026-04-25T09:30:00" },
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
      messages: [
        { type: "system",  user: "System",  role: "System",     message: "Task created", timestamp: "2026-04-25T07:10:00" },
        { type: "comment", user: "Bu Tini", role: "Worker",     message: "Selesai. Saya tambahkan checklist 2-jam-an supaya tidak terulang.", timestamp: "2026-04-25T08:46:00" },
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
      messages: [],
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
      messages: [
        { type: "system",  user: "System",  role: "System",     message: "Task created (optional follow-up)", timestamp: "2026-04-25T06:05:00" },
      ],
    },
    taskHistory: [],
    updates: [
      { type: "comment", user: "Pak Anton", role: "Worker",     message: "Noticed during overnight monitoring rotation.", timestamp: "2026-04-25T05:20:00" },
      { type: "system",  user: "System",    role: "System",     message: "Report reviewed by Bu Rina", timestamp: "2026-04-25T06:00:00" },
      { type: "status",  user: "Bu Rina",   role: "Supervisor", message: "Reviewed", timestamp: "2026-04-25T06:00:00" },
      { type: "system",  user: "System",    role: "System",     message: "Task TSK-1085 created and assigned to Pak Hadi (optional follow-up)", timestamp: "2026-04-25T06:05:00" },
    ],
  },
  {
    id: "RPT-0309",
    type: "report",
    source: "worker",
    reportFormat: "checklist",
    title: "Floor Cleaning Round — morning shift",
    description: "Morning cleaning round across Lobby, Pantry, and Restroom.",
    category: "cleaning",
    severity: "low",
    location: "Tower A — Floor 3 Pantry",
    status: "logged",
    createdAt: "2026-04-25T07:30:00",
    sla: { dueIn: 18, breached: false },
    photos: [],
    submittedBy: { name: "Bu Sri", role: "Worker" },
    assignedTo: null,
    linkedTask: null,
    taskHistory: [],
    checklistTemplate: CHECKLIST_TEMPLATES[0], // Floor Cleaning Round
    checklistResult: [
      {
        areaId: "a-lobby", status: "completed",
        checklistItems: [
          { id: "i-l1", checked: true,  note: "" },
          { id: "i-l2", checked: true,  note: "" },
          { id: "i-l3", checked: true,  note: "" },
        ],
      },
      {
        areaId: "a-pantry", status: "completed",
        checklistItems: [
          { id: "i-p1", checked: true, note: "" },
          { id: "i-p2", checked: true, note: "" },
          { id: "i-p3", checked: true, note: "" },
        ],
      },
      {
        areaId: "a-restroom", status: "completed",
        checklistItems: [
          { id: "i-r1", checked: true,  note: "" },
          { id: "i-r2", checked: false, note: "Soap dispenser empty — needs refill from store" },
          { id: "i-r3", checked: true,  note: "" },
          { id: "i-r4", checked: true,  note: "" },
        ],
      },
    ],
    updates: [
      { type: "system",  user: "System", role: "System", message: "Checklist report submitted",        timestamp: "2026-04-25T07:30:00" },
      { type: "comment", user: "Bu Sri", role: "Worker", message: "Soap ran out at restroom — flagged.", timestamp: "2026-04-25T07:31:00" },
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
      // Checklist reports: if not all items done, the worker still owns the task
      if (record.reportFormat === "checklist" && record.checklistResult) {
        const stats = computeChecklistStats(record);
        if (stats.percent < 100) {
          return { role: "Worker", label: `Worker completing checklist (${stats.percent}%)`, tone: "worker" };
        }
      }
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
          {c.reportFormat === "checklist" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 text-[10px] font-semibold uppercase tracking-wider">
              <ListChecks className="w-2.5 h-2.5" strokeWidth={2.6}/>
              Checklist
            </span>
          )}
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
          {c.reportFormat === "checklist" && (() => {
            const stats = computeChecklistStats(c);
            return (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                stats.hasIssue ? "text-red-700" : stats.percent === 100 ? "text-emerald-700" : "text-slate-600"
              }`}>
                {stats.hasIssue && <AlertTriangle className="w-3 h-3" strokeWidth={2.6}/>}
                {stats.percent}% · {stats.areasDone}/{stats.totalAreas} areas
              </span>
            );
          })()}
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

function ConversationThread({ updates, title = "Activity" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        {title} ({updates.length})
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
   CHECKLIST: TEMPLATE SELECTOR
   ========================================================================= */

function ChecklistTemplateSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {CHECKLIST_TEMPLATES.map(t => {
        const Icon = t.icon;
        const active = value === t.id;
        const itemCount = t.areas.reduce((sum, a) => sum + a.checklistItems.length, 0);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`text-left p-4 rounded-xl transition-all ${
              active
                ? "bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2 shadow-sm shadow-indigo-600/20"
                : "bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                active ? "bg-white/20" : "bg-indigo-50 text-indigo-600"
              }`}>
                <Icon className="w-5 h-5" strokeWidth={2.2}/>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm">{t.name}</div>
                <div className={`text-xs mt-0.5 ${active ? "text-white/80" : "text-slate-500"}`}>
                  {t.description}
                </div>
                <div className={`text-[11px] mt-2 font-medium ${active ? "text-white/90" : "text-slate-600"}`}>
                  {t.areas.length} areas · {itemCount} items
                </div>
              </div>
              {active && <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={2.4}/>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   CHECKLIST: AREA STATUS PILL
   ========================================================================= */

const AREA_STATUS_META = {
  not_started: { label: "Not Started", pill: "bg-slate-100 text-slate-600 ring-slate-200",      dot: "bg-slate-400",   icon: Circle      },
  in_progress: { label: "In Progress", pill: "bg-amber-50 text-amber-800 ring-amber-200",       dot: "bg-amber-500",   icon: Loader2     },
  completed:   { label: "Completed",   pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", icon: CheckCheck  },
  issue:       { label: "Issue",       pill: "bg-red-50 text-red-700 ring-red-200",             dot: "bg-red-500",     icon: AlertTriangle },
};

function AreaStatusPill({ status, size = "md" }) {
  const m = AREA_STATUS_META[status] || AREA_STATUS_META.not_started;
  const Icon = m.icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ring-1 font-medium ${m.pill} ${pad}`}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} strokeWidth={2.4}/>
      {m.label}
    </span>
  );
}

/* =========================================================================
   CHECKLIST: AREA LIST VIEW (execution mode — worker)
   ========================================================================= */

function AreaListView({ template, result, onOpenArea }) {
  if (!template || !result) return null;

  const areaProgress = (areaId) => {
    const ar = result.find(r => r.areaId === areaId);
    if (!ar) return { done: 0, total: 0, status: "not_started", hasIssueNote: false };
    const done = ar.checklistItems.filter(i => i.checked).length;
    const total = ar.checklistItems.length;
    const status = computeAreaStatus(ar.checklistItems);
    const hasIssueNote = ar.checklistItems.some(i => !i.checked && i.note?.trim());
    return { done, total, status, hasIssueNote };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ListChecks className="w-4 h-4" strokeWidth={2.4}/>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Today's Checklist</h3>
            <p className="text-[11px] text-slate-500">{template.name}</p>
          </div>
        </div>
      </div>

      <ul>
        {template.areas.map((area, idx) => {
          const p = areaProgress(area.id);
          const displayStatus = p.hasIssueNote ? "issue" : p.status;
          const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;

          return (
            <li key={area.id}>
              <button
                onClick={() => onOpenArea(area.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-semibold text-slate-900 text-[15px]">{area.name}</span>
                    <AreaStatusPill status={displayStatus} size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[160px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          displayStatus === "issue"     ? "bg-red-500" :
                          displayStatus === "completed" ? "bg-emerald-500" :
                          displayStatus === "in_progress" ? "bg-amber-500" :
                                                          "bg-slate-300"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{p.done}/{p.total}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0"/>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================================================
   CHECKLIST: AREA DETAIL — checkable items (execution / view mode)
   ========================================================================= */

function AreaChecklistDetail({ area, areaResult, readOnly, onToggle, onNote, onBack }) {
  if (!area || !areaResult) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4"/>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-900">{area.name}</h3>
          <p className="text-[11px] text-slate-500">
            {areaResult.checklistItems.filter(i => i.checked).length} of {areaResult.checklistItems.length} done
          </p>
        </div>
        <AreaStatusPill status={computeAreaStatus(areaResult.checklistItems)} size="sm" />
      </div>

      <ul className="p-2">
        {area.checklistItems.map(item => {
          const r = areaResult.checklistItems.find(i => i.id === item.id);
          const checked = r?.checked ?? false;

          return (
            <li key={item.id} className="rounded-xl">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onToggle?.(item.id)}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                  readOnly ? "" : "hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <span className={`shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  checked
                    ? "bg-emerald-500 text-white"
                    : "bg-white border-2 border-slate-300"
                }`}>
                  {checked && <CheckSquare className="w-4 h-4" strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-[15px] leading-snug ${
                  checked ? "text-slate-500 line-through" : "text-slate-900 font-medium"
                }`}>
                  {item.label}
                </span>
              </button>

              {/* Note input — only show in execution mode if there's content or item is unchecked */}
              {!readOnly && !checked && (
                <div className="px-3 pb-3 -mt-1">
                  <input
                    type="text"
                    value={r?.note || ""}
                    onChange={(e) => onNote?.(item.id, e.target.value)}
                    placeholder="Note (optional) — flag issue if can't complete"
                    className="w-full pl-9 pr-3 py-2 bg-amber-50/40 border border-amber-200/50 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
              )}
              {readOnly && r?.note && (
                <div className="px-3 pb-3 -mt-1 ml-9">
                  <div className="inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 ring-1 ring-amber-200 text-xs text-amber-900 max-w-full">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.4}/>
                    <span className="break-words">{r.note}</span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================================================
   CHECKLIST: SUMMARY VIEW (detail page — view mode)
   ========================================================================= */

function ChecklistSummaryView({ record, onCreateTaskFromIssues, role }) {
  const [expanded, setExpanded] = useState(null); // areaId

  if (!record?.checklistTemplate || !record?.checklistResult) return null;

  const stats = computeChecklistStats(record);
  const tpl = record.checklistTemplate;
  const failedItems = [];
  for (const ar of record.checklistResult) {
    const tplArea = tpl.areas.find(a => a.id === ar.areaId);
    if (!tplArea) continue;
    for (const it of ar.checklistItems) {
      if (!it.checked) {
        const tplItem = tplArea.checklistItems.find(i => i.id === it.id);
        failedItems.push({ areaName: tplArea.name, label: tplItem?.label, note: it.note });
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header with overall progress */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ListChecks className="w-4 h-4" strokeWidth={2.4}/>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Checklist Summary</h3>
              <p className="text-[11px] text-slate-500">{tpl.name}</p>
            </div>
          </div>
          {stats.hasIssue && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 text-[11px] font-semibold">
              <AlertTriangle className="w-3 h-3" strokeWidth={2.4}/>
              Needs Attention
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                stats.hasIssue ? "bg-red-500" : stats.percent === 100 ? "bg-emerald-500" : "bg-indigo-500"
              }`}
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-slate-900 tabular-nums">{stats.percent}%</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          {stats.doneItems} of {stats.totalItems} items · {stats.areasDone}/{stats.totalAreas} areas completed
        </p>
      </div>

      {/* Areas list */}
      <ul className="divide-y divide-slate-100">
        {tpl.areas.map(area => {
          const ar = record.checklistResult.find(r => r.areaId === area.id);
          if (!ar) return null;
          const status = computeAreaStatus(ar.checklistItems);
          const hasIssueNote = ar.checklistItems.some(i => !i.checked && i.note?.trim());
          const displayStatus = hasIssueNote ? "issue" : status;
          const isOpen = expanded === area.id;
          const done = ar.checklistItems.filter(i => i.checked).length;

          return (
            <li key={area.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : area.id)}
                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 text-sm">{area.name}</span>
                    <AreaStatusPill status={displayStatus} size="sm" />
                    <span className="text-[11px] text-slate-500 font-medium">{done}/{ar.checklistItems.length}</span>
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0"/>
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0"/>}
              </button>

              {isOpen && (
                <div className="px-5 pb-4 -mt-1 bg-slate-50/40">
                  <ul className="space-y-1.5">
                    {area.checklistItems.map(item => {
                      const r = ar.checklistItems.find(i => i.id === item.id);
                      const checked = r?.checked ?? false;
                      return (
                        <li key={item.id} className="flex items-start gap-2.5 py-1.5">
                          <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center ${
                            checked ? "bg-emerald-500 text-white" : "bg-white border-2 border-slate-300"
                          }`}>
                            {checked && <CheckSquare className="w-3.5 h-3.5" strokeWidth={3}/>}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${checked ? "text-slate-500 line-through" : "text-slate-800"}`}>
                              {item.label}
                            </div>
                            {r?.note && (
                              <div className="mt-1 inline-flex items-start gap-1.5 px-2 py-1 rounded-md bg-amber-50 ring-1 ring-amber-200 text-[11px] text-amber-900">
                                <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={2.4}/>
                                <span className="break-words">{r.note}</span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Issue summary + create task CTA (Supervisor only) */}
      {stats.hasIssue && failedItems.length > 0 && role === "Supervisor" && !record.linkedTask && (
        <div className="px-5 py-4 bg-red-50/40 border-t border-red-100">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" strokeWidth={2.4}/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900">{failedItems.length} item{failedItems.length > 1 ? "s" : ""} flagged</p>
              <p className="text-xs text-red-800/80 mt-0.5">Create a task to follow up.</p>
            </div>
          </div>
          <button
            onClick={onCreateTaskFromIssues}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm shadow-red-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.4}/>
            Create Task from Issues
          </button>
        </div>
      )}
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

function ComplaintListPage({ complaints, onOpen, onCreate, initialTypeFilter }) {
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState(initialTypeFilter || "all"); // all | complaint | report
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
  const [reportFormat, setReportFormat] = useState("narrative"); // "narrative" | "checklist"
  const [checklistTemplateId, setChecklistTemplateId] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);

  const isReport = type === "report";
  const isChecklist = isReport && reportFormat === "checklist";
  const selectedTpl = CHECKLIST_TEMPLATES.find(t => t.id === checklistTemplateId);

  // Validation differs by mode
  const valid = isChecklist
    ? !!(location && checklistTemplateId)
    : !!(location && category && severity && description.trim().length > 5);

  const submit = () => {
    if (!valid) return;
    if (isChecklist) {
      onSubmit({
        type: "report",
        reportFormat: "checklist",
        location,
        category: selectedTpl.category,
        severity: "low",
        description: `${selectedTpl.name} — ${location}`,
        photos: [],
        checklistTemplate: selectedTpl,
        checklistResult: makeBlankChecklistResult(selectedTpl),
      });
    } else {
      onSubmit({
        type,
        reportFormat: "narrative",
        location,
        category,
        severity,
        description,
        photos,
      });
    }
  };

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

        {/* Format toggle (Reports only) */}
        {isReport && (
          <Section title="Format" required>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "narrative", label: "Narrative",  hint: "Free-form description", icon: FileText },
                { id: "checklist", label: "Checklist",  hint: "Area-based checklist",  icon: ListChecks },
              ].map(f => {
                const Icon = f.icon;
                const active = reportFormat === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setReportFormat(f.id)}
                    className={`flex flex-col items-start text-left gap-1 p-4 rounded-xl transition-all ${
                      active
                        ? "bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" strokeWidth={2.4}/>
                      <span className="text-sm font-bold">{f.label}</span>
                    </div>
                    <span className={`text-xs ${active ? "opacity-90" : "text-slate-500"}`}>{f.hint}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* Checklist template selector */}
        {isChecklist && (
          <Section title="Checklist Template" required>
            <ChecklistTemplateSelector
              value={checklistTemplateId}
              onChange={setChecklistTemplateId}
            />
          </Section>
        )}

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
        {!isChecklist && (
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
        )}

        {/* Severity */}
        {!isChecklist && (
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
        )}

        {/* Description + Photos (narrative only) */}
        {!isChecklist && (
          <>
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

        <Section title="Photos" hint="Up to 5 photos">
          <PhotoUploader photos={photos} setPhotos={setPhotos} max={5} />
        </Section>
          </>
        )}
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

function ComplaintDetailPage({ complaint, role, onBack, onAction, onComment, onChecklistToggle, onChecklistNote, onCreateTaskFromIssues, onChecklistSubmit, onSendTaskMessage }) {
  const c = complaint;
  const cat = CAT_META[c.category];
  const [openAreaId, setOpenAreaId] = useState(null);

  // Worker can still edit checklist while it's "logged" but not yet "reviewed"/"closed"
  const checklistEditable =
    c.reportFormat === "checklist" &&
    role === "Worker" &&
    c.status !== "reviewed" &&
    c.status !== "closed";

  const openArea =
    checklistEditable && openAreaId
      ? c.checklistTemplate.areas.find(a => a.id === openAreaId)
      : null;
  const openAreaResult =
    openArea
      ? c.checklistResult.find(r => r.areaId === openArea.id)
      : null;

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

          {/* Checklist UI (replaces description block for checklist reports) */}
          {c.reportFormat === "checklist" && c.checklistTemplate && c.checklistResult ? (
            checklistEditable ? (
              openArea ? (
                <AreaChecklistDetail
                  area={openArea}
                  areaResult={openAreaResult}
                  readOnly={false}
                  onToggle={(itemId) => onChecklistToggle?.(openArea.id, itemId)}
                  onNote={(itemId, text) => onChecklistNote?.(openArea.id, itemId, text)}
                  onBack={() => setOpenAreaId(null)}
                />
              ) : (
                <>
                  <AreaListView
                    template={c.checklistTemplate}
                    result={c.checklistResult}
                    onOpenArea={setOpenAreaId}
                  />
                  {(() => {
                    const stats = computeChecklistStats(c);
                    const hasAnyProgress = stats.doneItems > 0;
                    return hasAnyProgress && (
                      <button
                        onClick={onChecklistSubmit}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-all"
                      >
                        <FileCheck2 className="w-4 h-4" strokeWidth={2.4}/>
                        {stats.percent === 100 ? "Submit Checklist" : `Submit Partial (${stats.percent}%)`}
                      </button>
                    );
                  })()}
                </>
              )
            ) : (
              <ChecklistSummaryView
                record={c}
                role={role}
                onCreateTaskFromIssues={onCreateTaskFromIssues}
              />
            )
          ) : (
            /* Description (narrative reports & complaints) */
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
          )}

          {(c.status === "resolved" || c.status === "closed") && c.resolution && (
            <ResolutionCard resolution={c.resolution} />
          )}

          {(c.linkedTask || (c.taskHistory && c.taskHistory.length > 0)) && (
            <LinkedTaskCard task={c.linkedTask} history={c.taskHistory} />
          )}

          {c.linkedTask && c.linkedTask.evidence && (
            <TaskEvidenceSection evidence={c.linkedTask.evidence} />
          )}

          {/* Task discussion — embedded conversation tied to the linked task */}
          {c.linkedTask && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5" strokeWidth={2.4}/>
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Task Discussion · <span className="font-mono text-slate-700">{c.linkedTask.id}</span>
                </h3>
              </div>
              {(c.linkedTask.messages && c.linkedTask.messages.length > 0) ? (
                <ConversationThread updates={c.linkedTask.messages} title="Conversation" />
              ) : (
                <p className="text-sm text-slate-400 italic mb-4">No task discussion yet — coordinate with the assigned worker here.</p>
              )}
              {(role === "Worker" || role === "Supervisor") && (
                <div className="mt-4">
                  <CommentInput onSubmit={(text) => onSendTaskMessage?.(c.linkedTask.id, text)} />
                </div>
              )}
            </div>
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
   ATTENDANCE / PRESENCE LAYER
   ========================================================================= */

/** Format an HH:MM clock-in time from an ISO timestamp. */
function fmtClockTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Format a duration in seconds as "HH:MM:SS" (live timer) or "Xh Ym" (compact). */
function fmtDurationHMS(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtDurationShort(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/* ---------- LiveTimer ---------- */

function LiveTimer({ startTime, className = "" }) {
  // Tick every second while mounted. Cleans up automatically.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startTime) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  if (!startTime) return null;
  const elapsedSec = Math.floor((now - new Date(startTime).getTime()) / 1000);
  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {fmtDurationHMS(elapsedSec)}
    </span>
  );
}

/* ---------- AttendanceCard ---------- */

const ATTENDANCE_METHOD_META = {
  qr:     { label: "QR",     fullLabel: "QR Scan",        icon: QrCode,       tone: "emerald", trust: "high",   indicator: "✅", description: "Verified via QR" },
  gps:    { label: "GPS",    fullLabel: "Location",       icon: Navigation,   tone: "amber",   trust: "medium", indicator: "⚠",  description: "Verified via location" },
  selfie: { label: "Selfie", fullLabel: "Selfie Verify",  icon: Camera,       tone: "blue",    trust: "medium", indicator: "📸", description: "Identity captured"  },
  manual: { label: "Manual", fullLabel: "Manual",         icon: ShieldAlert,  tone: "red",     trust: "low",    indicator: "❗", description: "No verification"   },
};

const METHOD_TONES = {
  emerald: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  amber:   { pill: "bg-amber-50 text-amber-800 ring-amber-200",       dot: "bg-amber-500"   },
  blue:    { pill: "bg-blue-50 text-blue-700 ring-blue-200",          dot: "bg-blue-500"    },
  red:     { pill: "bg-red-50 text-red-700 ring-red-200",             dot: "bg-red-500"     },
};

function MethodBadge({ method, size = "md", showLabel = true }) {
  const m = ATTENDANCE_METHOD_META[method];
  if (!m) return null;
  const t = METHOD_TONES[m.tone];
  const Icon = m.icon;
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md ring-1 font-semibold ${t.pill} ${pad}`}>
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} strokeWidth={2.6}/>
      {showLabel && m.label}
    </span>
  );
}

/* =========================================================================
   CHECK-IN MODAL — progressive flow: qr → gps → fallback → selfie/manual
   ========================================================================= */

function CheckInModal({ open, onClose, onCheckIn, defaultLocation }) {
  // Internal step state. Reset whenever the modal opens.
  // 'qr'      = scanning QR
  // 'gps'     = attempting GPS
  // 'fallback'= chooser after a failure
  // 'selfie'  = camera capture
  const [step, setStep] = useState("qr");
  const [errorMsg, setErrorMsg] = useState("");
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("qr");
      setErrorMsg("");
      setPhoto(null);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const finish = (payload) => {
    onCheckIn(payload);
    onClose();
  };

  // ---- QR step actions ----
  const simulateQrScan = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      finish({
        method: "qr",
        location: defaultLocation,
        locationVerified: true,
      });
    }, 900);
  };

  // ---- GPS step actions ----
  const tryGps = () => {
    setStep("gps");
    setBusy(true);
    setErrorMsg("");

    if (!navigator.geolocation) {
      setBusy(false);
      setErrorMsg("Location services unavailable on this device.");
      setStep("fallback");
      return;
    }

    // Soft validation: succeed even on low accuracy.
    const handleSuccess = (pos) => {
      setBusy(false);
      const accuracy = pos?.coords?.accuracy ?? 999;
      // High accuracy → fully verified. Low accuracy → soft success.
      finish({
        method: "gps",
        location: defaultLocation,
        locationVerified: accuracy <= 100,
      });
    };
    const handleError = (err) => {
      setBusy(false);
      setErrorMsg(err?.message || "Couldn't get your location.");
      setStep("fallback");
    };

    // 6-second timeout — don't block the worker forever.
    try {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
        timeout: 6000, maximumAge: 60000, enableHighAccuracy: false,
      });
    } catch {
      setBusy(false);
      setErrorMsg("Location request failed.");
      setStep("fallback");
    }
  };

  // For demo environments where geolocation doesn't fire (e.g. headless),
  // also expose a "simulate GPS success" link so the demo never gets stuck.
  const simulateGpsSuccess = () => {
    setBusy(false);
    finish({
      method: "gps",
      location: defaultLocation,
      locationVerified: true,
    });
  };

  // ---- Selfie step actions ----
  const captureSelfie = () => {
    setBusy(true);
    // Mock: generate a placeholder data URL.
    setTimeout(() => {
      setBusy(false);
      const fakePhoto =
        "data:image/svg+xml;utf8," +
        encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect fill='%23E0E7FF' width='200' height='200'/><circle cx='100' cy='80' r='32' fill='%236366F1'/><path d='M40 180 Q100 130 160 180 Z' fill='%236366F1'/></svg>`
        );
      setPhoto(fakePhoto);
      finish({
        method: "selfie",
        location: defaultLocation,
        locationVerified: false, // selfie verifies identity, not location
        photo: fakePhoto,
      });
    }, 1100);
  };

  // ---- Manual step actions ----
  const checkInManual = () => {
    finish({
      method: "manual",
      location: defaultLocation,
      locationVerified: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Check In</h2>
            <p className="text-xs text-slate-500 mt-0.5">{defaultLocation}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* === STEP: QR === */}
        {step === "qr" && (
          <div className="p-5">
            {/* Scanner viewfinder */}
            <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
              {/* Animated scan line */}
              <div className="absolute inset-x-8 inset-y-8 border-2 border-emerald-400/60 rounded-xl">
                <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"/>
                <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"/>
                <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"/>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"/>
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-[scanline_2s_ease-in-out_infinite]" style={{top: "50%"}}/>
              </div>
              <QrCode className="w-12 h-12 text-white/40" strokeWidth={1.5}/>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs font-medium">
                Point camera at site QR code
              </p>
            </div>

            <button
              onClick={simulateQrScan}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" strokeWidth={2.4}/>}
              {busy ? "Scanning…" : "Simulate QR Scan"}
            </button>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex-1 h-px bg-slate-200"/>
              <span>or</span>
              <span className="flex-1 h-px bg-slate-200"/>
            </div>

            <button
              onClick={tryGps}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold ring-1 ring-slate-200 transition-colors"
            >
              <Navigation className="w-4 h-4" strokeWidth={2.4}/>
              Use location instead
            </button>
          </div>
        )}

        {/* === STEP: GPS === */}
        {step === "gps" && (
          <div className="p-5">
            <div className="aspect-square bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl flex flex-col items-center justify-center mb-4 px-6 text-center">
              <div className="relative w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-3">
                <Navigation className="w-8 h-8 text-amber-600" strokeWidth={2}/>
                {busy && <span className="absolute inset-0 rounded-full border-4 border-amber-300 border-t-amber-600 animate-spin"/>}
              </div>
              <p className="text-base font-bold text-amber-900">{busy ? "Detecting location…" : "Location detected"}</p>
              <p className="text-xs text-amber-800/80 mt-1">
                {busy ? "Make sure GPS is enabled" : "Soft verification — site context inferred"}
              </p>
            </div>

            <button
              onClick={simulateGpsSuccess}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold shadow-sm shadow-amber-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.4}/>
              Use this location
            </button>

            <button
              onClick={() => setStep("qr")}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5"/>
              Back to QR
            </button>
          </div>
        )}

        {/* === STEP: FALLBACK CHOOSER === */}
        {step === "fallback" && (
          <div className="p-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" strokeWidth={2.4}/>
              <div>
                <p className="text-sm font-bold text-amber-900">Unable to verify location</p>
                <p className="text-xs text-amber-800/80 mt-0.5">{errorMsg || "Choose another way to check in."}</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setStep("qr")}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <QrCode className="w-5 h-5" strokeWidth={2.2}/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Scan QR Code</p>
                  <p className="text-xs text-slate-500">Best — fully verified</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300"/>
              </button>

              <button
                onClick={() => setStep("selfie")}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Camera className="w-5 h-5" strokeWidth={2.2}/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Take Selfie</p>
                  <p className="text-xs text-slate-500">Identity verification</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300"/>
              </button>

              <button
                onClick={checkInManual}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" strokeWidth={2.2}/>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Continue Anyway</p>
                  <p className="text-xs text-slate-500">Manual — flagged for supervisor</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300"/>
              </button>
            </div>
          </div>
        )}

        {/* === STEP: SELFIE === */}
        {step === "selfie" && (
          <div className="p-5">
            <div className="relative aspect-[4/5] bg-slate-900 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
              {/* Face guide circle */}
              <div className="absolute w-[60%] aspect-square border-2 border-blue-400/60 rounded-full"/>
              <div className="absolute w-[60%] aspect-square">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-400 rounded-full"/>
              </div>
              <Camera className="w-12 h-12 text-white/40" strokeWidth={1.5}/>
              {photo && (
                <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90"/>
              )}
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs font-medium">
                {photo ? "Captured" : "Center your face in the circle"}
              </p>
            </div>

            <button
              onClick={captureSelfie}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm shadow-blue-600/20 transition-all disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4" strokeWidth={2.4}/>}
              {busy ? "Capturing…" : "Capture Selfie"}
            </button>

            <button
              onClick={() => setStep("fallback")}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5"/>
              Back
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-60px); opacity: 0.4; }
          50%      { transform: translateY(60px);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ---------- AttendanceCard ---------- */

function AttendanceCard({ attendance, onOpenCheckIn, onCheckOut, pendingApproval = false }) {
  const checkedIn = attendance.isCheckedIn;

  if (!checkedIn) {
    // STATE 1: NOT CHECKED IN
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                <Power className="w-4 h-4" strokeWidth={2.4}/>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
                <p className="text-base font-bold text-slate-900">Not Checked In</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"/>
              Off Duty
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
            <MapPin className="w-4 h-4 text-slate-400"/>
            <span className="font-medium">{attendance.location || "Unknown Location"}</span>
          </div>

          <button
            onClick={onOpenCheckIn}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-base font-bold shadow-sm shadow-emerald-600/20 transition-all"
          >
            <LogIn className="w-5 h-5" strokeWidth={2.4}/>
            Check In
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-2 font-medium">
            Use QR if available for faster check-in
          </p>
        </div>
      </div>
    );
  }

  // STATE 2: CHECKED IN
  const methodMeta = ATTENDANCE_METHOD_META[attendance.method];
  const showUnverifiedWarning = attendance.locationVerified === false;

  return (
    <div className="bg-white rounded-2xl border-2 border-emerald-300 shadow-md shadow-emerald-100 overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-br from-emerald-50 to-emerald-50/30">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Power className="w-4 h-4" strokeWidth={2.4}/>
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40"/>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Status</p>
              <p className="text-base font-bold text-emerald-900">On Duty</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {methodMeta && <MethodBadge method={attendance.method} />}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
              Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-emerald-900 mb-3">
          <MapPin className="w-4 h-4 text-emerald-700"/>
          <span className="font-medium">{attendance.location}</span>
          {attendance.locationVerified === true && (
            <ShieldCheck className="w-4 h-4 text-emerald-600" strokeWidth={2.4}/>
          )}
        </div>

        {showUnverifiedWarning && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 ring-1 ring-amber-200 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" strokeWidth={2.4}/>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-amber-900 font-semibold leading-snug">
                Location not fully verified
              </p>
              {pendingApproval && (
                <p className="text-[11px] text-amber-800/80 leading-snug mt-0.5 inline-flex items-center gap-1">
                  <Hourglass className="w-3 h-3"/>
                  Pending Approval — supervisor reviewing
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white rounded-xl px-3 py-2.5 ring-1 ring-emerald-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Clock In</p>
            <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
              {fmtClockTime(attendance.clockInTime)}
            </p>
          </div>
          <div className="bg-white rounded-xl px-3 py-2.5 ring-1 ring-emerald-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Working Time</p>
            <p className="text-base font-bold text-emerald-700 mt-0.5">
              <LiveTimer startTime={attendance.clockInTime} />
            </p>
          </div>
        </div>

        {/* Method strip */}
        {methodMeta && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-white/70 ring-1 ring-emerald-100">
            <methodMeta.icon className={`w-4 h-4 shrink-0 ${
              methodMeta.tone === "emerald" ? "text-emerald-600" :
              methodMeta.tone === "amber"   ? "text-amber-600"   :
              methodMeta.tone === "blue"    ? "text-blue-600"    :
                                              "text-red-600"
            }`} strokeWidth={2.4}/>
            <span className="text-xs text-slate-700">
              <span className="font-semibold">{methodMeta.fullLabel}</span>
              <span className="text-slate-500"> · {methodMeta.description}</span>
            </span>
            {attendance.photo && (
              <img src={attendance.photo} alt="" className="ml-auto w-7 h-7 rounded-md object-cover ring-1 ring-emerald-200"/>
            )}
          </div>
        )}

        <button
          onClick={onCheckOut}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-sm font-bold ring-1 ring-slate-200 transition-all"
        >
          <LogOut className="w-4 h-4" strokeWidth={2.4}/>
          Check Out
          {pendingApproval && (
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              <Hourglass className="w-3 h-3" strokeWidth={2.6}/>
              Pending
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- WorkforceSummaryCard ---------- */

function WorkforceSummaryCard({ counts }) {
  const tiles = [
    { label: "On Duty",        value: counts.onDuty,       icon: CheckCheck,   tone: "emerald" },
    { label: "Not Checked In", value: counts.notCheckedIn, icon: MinusCircle,  tone: "slate"   },
    { label: "Late",           value: counts.late,         icon: AlertTriangle, tone: "red"    },
  ];
  const tones = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-900", iconBg: "bg-emerald-100 text-emerald-700" },
    slate:   { bg: "bg-slate-50",   text: "text-slate-900",   iconBg: "bg-slate-200 text-slate-700"   },
    red:     { bg: "bg-red-50",     text: "text-red-900",     iconBg: "bg-red-100 text-red-700"       },
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t, i) => {
        const Icon = t.icon;
        const tn = tones[t.tone];
        return (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">{t.label}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tn.iconBg}`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2.4}/>
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${tn.text}`}>{t.value}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- WorkforceList ---------- */

const WORKER_STATUS_META = {
  on_duty:        { label: "On Duty",        dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", indicator: "🟢" },
  not_checked_in: { label: "Not Checked In", dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-600 ring-slate-200",      indicator: "🟡" },
  late:           { label: "Late",           dot: "bg-red-500",     pill: "bg-red-50 text-red-700 ring-red-200",             indicator: "🔴" },
};

function WorkforceList({ workers }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Users className="w-4 h-4 text-slate-500"/>
        <h3 className="text-sm font-bold text-slate-900">Workers</h3>
        <span className="ml-auto text-[11px] text-slate-500 font-medium">{workers.length} total</span>
      </div>
      <ul>
        {workers.map((w, i) => {
          const meta = WORKER_STATUS_META[w.status] || WORKER_STATUS_META.not_checked_in;
          return (
            <li key={i} className="px-5 py-3.5 flex items-center gap-3 border-b border-slate-100 last:border-b-0">
              <div className="relative w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                {w.name.charAt(0)}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${meta.dot}`}/>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900">{w.name}</p>
                  {w.role && <span className="text-[11px] text-slate-500">· {w.role}</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ring-1 text-[11px] font-semibold ${meta.pill}`}>
                    {meta.label}
                  </span>
                  {w.status === "on_duty" && w.duration && (
                    <span className="text-[11px] text-slate-500 font-medium">{w.duration}</span>
                  )}
                  {w.status === "late" && w.lateBy && (
                    <span className="text-[11px] text-red-600 font-semibold">by {w.lateBy}</span>
                  )}
                  {w.status === "on_duty" && w.method && (
                    <MethodBadge method={w.method} size="sm" />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================================================
   REQUEST & APPROVAL — Decision Layer
   ========================================================================= */

const REQUEST_TYPE_META = {
  leave: {
    label: "Leave",
    icon: Plane,
    tone: "indigo",
    description: "Time off",
  },
  overtime: {
    label: "Overtime",
    icon: Clock,
    tone: "amber",
    description: "Extra hours",
  },
  manual_checkin: {
    label: "Manual Check-In",
    icon: Edit3,
    tone: "red",
    description: "Attendance verification",
  },
};

const REQUEST_STATUS_META = {
  pending:  { label: "Pending",  pill: "bg-amber-50 text-amber-800 ring-amber-200",     icon: Hourglass },
  approved: { label: "Approved", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCheck },
  rejected: { label: "Rejected", pill: "bg-red-50 text-red-700 ring-red-200",            icon: XCircleNoOp },
};

// Tiny shim — we don't want to add another lucide icon import for X+circle.
function XCircleNoOp(props) {
  return <X {...props}/>;
}

function RequestStatusBadge({ status, size = "md" }) {
  const m = REQUEST_STATUS_META[status];
  if (!m) return null;
  const Icon = m.icon;
  const pad = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ring-1 font-semibold ${m.pill} ${pad}`}>
      <Icon className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} strokeWidth={2.6}/>
      {m.label}
    </span>
  );
}

const initialRequests = [
  {
    id: "REQ-0142",
    type: "leave",
    requester: { id: "w_budi", name: "Budi", role: "Cleaning" },
    status: "pending",
    relatedEntity: null,
    notes: "Family event in Bandung — May 2 to May 4.",
    timestamp: "2026-04-25T07:55:00",
    submittedBy: "Budi",
    approvedBy: null,
    rejectedReason: null,
    detail: { dateFrom: "2026-05-02", dateTo: "2026-05-04" },
    messages: [
      { type: "system",  user: "System", role: "System", message: "Leave request submitted", timestamp: "2026-04-25T07:55:00" },
      { type: "comment", user: "Budi",   role: "Worker", message: "Saudara saya menikah di Bandung. Saya sudah cek roster, Sari bisa cover shift saya.", timestamp: "2026-04-25T07:56:00" },
    ],
  },
  {
    id: "REQ-0141",
    type: "overtime",
    requester: { id: "w_andi", name: "Andi", role: "Security" },
    status: "pending",
    relatedEntity: null,
    notes: "Cover lobby reception until replacement arrives.",
    timestamp: "2026-04-25T06:40:00",
    submittedBy: "Andi",
    approvedBy: null,
    detail: { date: "2026-04-25", startTime: "22:00", endTime: "02:00" },
    messages: [
      { type: "system",  user: "System", role: "System", message: "Overtime request submitted", timestamp: "2026-04-25T06:40:00" },
    ],
  },
  {
    id: "REQ-0140",
    type: "manual_checkin",
    requester: { id: "w_rudi", name: "Rudi", role: "Maintenance" },
    status: "pending",
    relatedEntity: { type: "attendance", id: "att-rudi-2026-04-25" },
    notes: "GPS unavailable at site, used manual check-in.",
    timestamp: "2026-04-25T05:20:00",
    submittedBy: "Rudi",
    approvedBy: null,
    detail: { method: "manual", location: "Annex — Loading Dock" },
    messages: [
      { type: "system",  user: "System", role: "System", message: "Manual check-in flagged for review", timestamp: "2026-04-25T05:20:00" },
      { type: "comment", user: "Rudi",   role: "Worker", message: "GPS error di basement, sinyal hilang sampai naik ke ground floor.", timestamp: "2026-04-25T05:22:00" },
    ],
  },
  {
    id: "REQ-0139",
    type: "overtime",
    requester: { id: "w_budi", name: "Budi", role: "Cleaning" },
    status: "approved",
    relatedEntity: null,
    notes: "Deep clean after gala dinner.",
    timestamp: "2026-04-24T16:10:00",
    submittedBy: "Budi",
    approvedBy: "Bu Rina",
    detail: { date: "2026-04-23", startTime: "22:00", endTime: "02:00" },
    messages: [
      { type: "system",  user: "System",  role: "System",     message: "Overtime request submitted", timestamp: "2026-04-24T16:10:00" },
      { type: "comment", user: "Bu Rina", role: "Supervisor", message: "Approved. Take care, jangan lupa istirahat besok pagi.", timestamp: "2026-04-24T16:18:00" },
      { type: "system",  user: "System",  role: "System",     message: "Request approved by Bu Rina", timestamp: "2026-04-24T16:18:00" },
    ],
  },
  {
    id: "REQ-0138",
    type: "manual_checkin",
    requester: { id: "w_budi", name: "Budi", role: "Cleaning" },
    status: "rejected",
    relatedEntity: null,
    notes: "Used manual check-in — no verification.",
    timestamp: "2026-04-23T08:30:00",
    submittedBy: "Budi",
    approvedBy: "Bu Rina",
    rejectedReason: "QR scanner was working — please use it next time.",
    detail: { method: "manual", location: "Tower A — Lobby" },
    messages: [
      { type: "system",  user: "System",  role: "System",     message: "Manual check-in flagged for review", timestamp: "2026-04-23T08:30:00" },
      { type: "comment", user: "Bu Rina", role: "Supervisor", message: "QR scanner di lobby kondisinya normal hari ini. Tolong gunakan QR untuk check-in berikutnya.", timestamp: "2026-04-23T08:50:00" },
      { type: "system",  user: "System",  role: "System",     message: "Request rejected by Bu Rina", timestamp: "2026-04-23T08:50:00" },
    ],
  },
];

/* ---------- RequestCard (My Requests entry) ---------- */

function RequestCard({ request, onClick, showRequester = false }) {
  const tm = REQUEST_TYPE_META[request.type];
  if (!tm) return null;
  const Icon = tm.icon;
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    amber:  "bg-amber-50 text-amber-700",
    red:    "bg-red-50 text-red-700",
  };
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm shadow-sm p-3.5 transition-all group flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tm.tone]}`}>
        <Icon className="w-4 h-4" strokeWidth={2.4}/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-sm font-semibold text-slate-900">
            {showRequester ? `${request.requester.name} · ${tm.label}` : tm.label}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">{request.id}</span>
        </div>
        <p className="text-xs text-slate-500 truncate">{request.notes}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{fmtTime(request.timestamp)}</p>
      </div>
      <RequestStatusBadge status={request.status} size="sm" />
    </button>
  );
}

/* ---------- RequestFormModal — minimal Tailwind form for Leave/Overtime/Manual ---------- */

function RequestFormModal({ open, onClose, onSubmit, defaultType, presetEntity }) {
  const [type, setType] = useState(defaultType || "leave");
  const [notes, setNotes] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (open) {
      setType(defaultType || "leave");
      setNotes(""); setDateFrom(""); setDateTo(""); setStartTime(""); setEndTime("");
    }
  }, [open, defaultType]);

  if (!open) return null;

  const valid =
    notes.trim().length > 5 &&
    (type === "leave"     ? !!(dateFrom && dateTo) :
     type === "overtime"  ? !!(dateFrom && startTime && endTime) :
     type === "manual_checkin" ? true :
     true);

  const submit = () => {
    if (!valid) return;
    let detail = {};
    if (type === "leave")    detail = { dateFrom, dateTo };
    if (type === "overtime") detail = { date: dateFrom, startTime, endTime };
    if (type === "manual_checkin") detail = presetEntity?.detail || {};
    onSubmit({ type, notes: notes.trim(), detail, relatedEntity: presetEntity?.relatedEntity || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">New Request</h2>
            <p className="text-xs text-slate-500 mt-0.5">Submit for supervisor approval</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type selector */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(REQUEST_TYPE_META).map(([id, m]) => {
                const Icon = m.icon;
                const active = type === id;
                const isDisabled = id === "manual_checkin" && !presetEntity;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setType(id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? "bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2"
                        : isDisabled
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                          : "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.4}/>
                    {m.label}
                  </button>
                );
              })}
            </div>
            {type === "manual_checkin" && presetEntity && (
              <p className="text-[11px] text-slate-500 mt-1.5 inline-flex items-center gap-1">
                <ShieldAlert className="w-3 h-3"/>Auto-attached to your manual check-in
              </p>
            )}
          </div>

          {/* Type-specific date/time fields */}
          {type === "leave" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-800 mb-2 block">From <span className="text-red-500">*</span></label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800 mb-2 block">To <span className="text-red-500">*</span></label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"/>
              </div>
            </div>
          )}

          {type === "overtime" && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-800 mb-2 block">Date <span className="text-red-500">*</span></label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800 mb-2 block">Start <span className="text-red-500">*</span></label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"/>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-800 mb-2 block">End <span className="text-red-500">*</span></label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"/>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-sm font-semibold text-slate-800 mb-2 block">Reason <span className="text-red-500">*</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Brief explanation for your supervisor…"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- RequestDetailModal — view request + conversation thread ---------- */

function RequestDetailModal({ open, onClose, request, role, onComment, onApprove, onReject }) {
  if (!open || !request) return null;
  const tm = REQUEST_TYPE_META[request.type];
  const Icon = tm?.icon;
  const tones = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700" },
    amber:  { bg: "bg-amber-50",  text: "text-amber-700"  },
    red:    { bg: "bg-red-50",    text: "text-red-700"    },
  };
  const tn = tones[tm?.tone] || { bg: "bg-slate-50", text: "text-slate-700" };

  const canComment = role === "Worker" || role === "Supervisor";
  const canApprove = role === "Supervisor" && request.status === "pending";

  // Render type-specific detail rows
  const detailRows = [];
  if (request.type === "leave" && request.detail) {
    detailRows.push(["From", request.detail.dateFrom]);
    detailRows.push(["To",   request.detail.dateTo]);
  }
  if (request.type === "overtime" && request.detail) {
    detailRows.push(["Date",  request.detail.date]);
    detailRows.push(["Start", request.detail.startTime]);
    detailRows.push(["End",   request.detail.endTime]);
  }
  if (request.type === "manual_checkin" && request.detail) {
    detailRows.push(["Method",   "Manual"]);
    detailRows.push(["Location", request.detail.location]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">

        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3 z-10">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tn.bg} ${tn.text}`}>
                <Icon className="w-5 h-5" strokeWidth={2.4}/>
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">{tm?.label}</h2>
                <span className="text-[11px] text-slate-400 font-mono">{request.id}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{request.requester.name} · {fmtFull(request.timestamp)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RequestStatusBadge status={request.status} size="sm" />
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Detail card */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{request.notes}</p>
            {detailRows.length > 0 && (
              <dl className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-slate-200">
                {detailRows.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{k}</dt>
                    <dd className="text-slate-900 font-medium mt-0.5">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            )}
            {request.relatedEntity && (
              <div className="mt-3 pt-3 border-t border-slate-200 inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <ShieldAlert className="w-3 h-3"/>
                Linked to {request.relatedEntity.type}
                <span className="font-mono text-slate-700">{request.relatedEntity.id}</span>
              </div>
            )}
            {request.rejectedReason && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-start gap-2">
                <X className="w-4 h-4 text-red-600 mt-0.5 shrink-0" strokeWidth={2.4}/>
                <p className="text-xs text-red-800"><span className="font-semibold">Rejected:</span> {request.rejectedReason}</p>
              </div>
            )}
            {request.approvedBy && request.status === "approved" && (
              <div className="mt-3 pt-3 border-t border-slate-200 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <CheckCheck className="w-3.5 h-3.5"/>
                Approved by {request.approvedBy}
              </div>
            )}
          </div>

          {/* Conversation thread (reused) */}
          <ConversationThread updates={request.messages || []} title="Conversation" />

          {/* Comment input (reused) — only for participants */}
          {canComment && (
            <CommentInput onSubmit={(text) => onComment(request.id, text)} />
          )}
        </div>

        {/* Sticky action bar — Supervisor approve/reject for pending requests */}
        {canApprove && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex gap-2 justify-end">
            <button
              onClick={() => { onReject(request.id); onClose(); }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50 inline-flex items-center gap-1.5 transition-colors"
            >
              <ThumbsDown className="w-4 h-4" strokeWidth={2.4}/>
              Reject
            </button>
            <button
              onClick={() => { onApprove(request.id); onClose(); }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm shadow-emerald-600/20 inline-flex items-center gap-1.5 transition-all"
            >
              <ThumbsUp className="w-4 h-4" strokeWidth={2.4}/>
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Worker: My Requests inline section ---------- */

function MyRequestsSection({ requests, onCreate, onOpen, locked }) {
  const visible = requests.slice(0, 4);
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider inline-flex items-center gap-1.5">
          <FileText className="w-3 h-3"/>My Requests
        </h2>
        <button
          onClick={onCreate}
          disabled={locked}
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            locked ? "text-slate-400 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-700"
          }`}
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.6}/>
          Create Request
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
          <p className="text-sm text-slate-500">No requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(r => (
            <RequestCard key={r.id} request={r} onClick={() => onOpen?.(r.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Supervisor: Pending Approvals queue ---------- */

function PendingApprovalsSection({ requests, onApprove, onReject, onOpen }) {
  const pending = requests.filter(r => r.status === "pending");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Hourglass className="w-4 h-4 text-amber-600"/>
        <h3 className="text-sm font-bold text-slate-900">Pending Approvals</h3>
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold">
          {pending.length}
        </span>
      </div>

      {pending.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 mx-auto flex items-center justify-center mb-3">
            <CheckCheck className="w-6 h-6 text-emerald-600" strokeWidth={2.2}/>
          </div>
          <p className="text-sm font-semibold text-slate-900">Nothing to approve</p>
          <p className="text-xs text-slate-500 mt-1">All requests handled.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pending.map(r => {
            const tm = REQUEST_TYPE_META[r.type];
            const Icon = tm?.icon;
            const tones = {
              indigo: "bg-indigo-50 text-indigo-700",
              amber:  "bg-amber-50 text-amber-700",
              red:    "bg-red-50 text-red-700",
            };
            return (
              <li key={r.id} className="px-5 py-3.5">
                <div className="flex items-start gap-3 mb-3">
                  <button
                    onClick={() => onOpen?.(r.id)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tones[tm?.tone] || "bg-slate-50 text-slate-700"}`}
                  >
                    {Icon && <Icon className="w-4 h-4" strokeWidth={2.4}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{r.requester.name}</span>
                      <span className="text-xs text-slate-500">· {tm?.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{r.notes}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{fmtTime(r.timestamp)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onReject(r.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50 transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" strokeWidth={2.4}/>
                    Reject
                  </button>
                  <button
                    onClick={() => onApprove(r.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" strokeWidth={2.4}/>
                    Approve
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* =========================================================================
   WORKER: WorkCardChecklist
   ========================================================================= */

function WorkCardChecklist({ record, onOpen, locked = false }) {
  const stats = computeChecklistStats(record);
  const tplName = record.checklistTemplate?.name || "Checklist";

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 text-[10px] font-semibold uppercase tracking-wider">
              <ListChecks className="w-2.5 h-2.5" strokeWidth={2.6}/>
              Checklist
            </span>
            {stats.hasIssue && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 ring-1 ring-red-200 text-[10px] font-semibold uppercase tracking-wider">
                <AlertTriangle className="w-2.5 h-2.5" strokeWidth={2.6}/>
                Issue
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-900 leading-snug">{tplName}</h3>
          <p className="text-xs text-slate-500 inline-flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3"/>{record.location}
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono shrink-0">{record.id}</span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              stats.hasIssue ? "bg-red-500" : stats.percent === 100 ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${stats.percent}%` }}
          />
        </div>
        <span className="text-sm font-bold text-slate-900 tabular-nums">{stats.percent}%</span>
      </div>
      <p className="text-xs text-slate-500 mb-4 font-medium">
        {stats.areasDone}/{stats.totalAreas} areas completed · {stats.doneItems}/{stats.totalItems} items
      </p>

      <button
        onClick={locked ? undefined : onOpen}
        disabled={locked}
        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
          locked
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-600/20"
        }`}
      >
        {locked ? (
          <>
            <Lock className="w-4 h-4" strokeWidth={2.4}/>
            Check in to start
          </>
        ) : (
          <>
            <PlayCircle className="w-4 h-4" strokeWidth={2.4}/>
            {stats.percent === 0 ? "Start" : stats.percent === 100 ? "Review" : "Continue"}
          </>
        )}
      </button>
    </div>
  );
}

/* =========================================================================
   WORKER: WorkCardTask
   ========================================================================= */

function WorkCardTask({ record, onOpen, locked = false }) {
  const t = record.linkedTask;
  if (!t) return null;
  const overdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed";

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 ${locked ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <TaskStatusBadge status={t.status} size="sm" />
          {overdue && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 ring-1 ring-red-200 text-[10px] font-semibold uppercase tracking-wider">
              <AlertCircle className="w-2.5 h-2.5" strokeWidth={2.6}/>
              Overdue
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-mono">{t.id}</span>
        </div>
      </div>

      <h3 className="text-[15px] font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">{record.title}</h3>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{t.notes || record.description}</p>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 mb-3">
        <span className="inline-flex items-center gap-1 truncate"><MapPin className="w-3 h-3"/>{record.location}</span>
        {t.deadline && (
          <span className={`inline-flex items-center gap-1 shrink-0 ${overdue ? "text-red-600 font-semibold" : ""}`}>
            <Clock className="w-3 h-3"/>{fmtFull(t.deadline)}
          </span>
        )}
      </div>

      <button
        onClick={locked ? undefined : onOpen}
        disabled={locked}
        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          locked
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-slate-50 hover:bg-slate-100 text-slate-800 ring-1 ring-slate-200"
        }`}
      >
        {locked ? (
          <>
            <Lock className="w-4 h-4" strokeWidth={2.4}/>
            Locked
          </>
        ) : (
          <>
            View
            <ChevronRight className="w-4 h-4" strokeWidth={2.4}/>
          </>
        )}
      </button>
    </div>
  );
}

/* =========================================================================
   WORKER: NeedsAttentionCard
   ========================================================================= */

function NeedsAttentionCard({ items, onOpen }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
      <div className="bg-red-50 px-4 py-3 flex items-center gap-2 border-b border-red-100">
        <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2.4}/>
        <h3 className="text-sm font-bold text-red-900">Needs Attention</h3>
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">
          {items.length}
        </span>
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            <button
              onClick={() => onOpen(it.recordId)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50/50 transition-colors text-left border-b border-slate-100 last:border-b-0"
            >
              <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                {it.kind === "overdue" ? <Timer className="w-4 h-4" strokeWidth={2.4}/> : <AlertTriangle className="w-4 h-4" strokeWidth={2.4}/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{it.title}</p>
                <p className="text-xs text-red-700 font-medium">{it.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0"/>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================================
   WORKER: TODAY'S WORK PAGE
   ========================================================================= */

function TodayWorkPage({ records, onOpen, onCreate, workerName = "Budi", attendance, onCheckIn, onCheckOut, requests = [], onCreateRequest, onOpenRequest, pendingAttendanceApproval = false }) {
  // A real app would scope by current user. For mock, surface:
  // - Checklist reports submitted by anyone but still in-progress (% < 100)
  //   OR the most recent checklist regardless of status (so the screen isn't empty)
  // - Tasks where assignedTo is a worker (we treat all open worker tasks as "yours")

  const today = new Date("2026-04-25T10:00:00").toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric",
  });

  const locked = !attendance?.isCheckedIn;

  const checklistRecords = useMemo(() => {
    const checklists = records.filter(r => r.reportFormat === "checklist");
    const inProgress = checklists.filter(r => {
      const stats = computeChecklistStats(r);
      return stats.percent < 100;
    });
    if (inProgress.length > 0) return inProgress;
    // fall back to most recent
    return checklists.slice(0, 1);
  }, [records]);

  const taskRecords = useMemo(() => {
    return records.filter(r =>
      r.linkedTask &&
      r.linkedTask.status !== "completed" &&
      r.status !== "closed"
    );
  }, [records]);

  // Build "Needs Attention" list
  const attentionItems = useMemo(() => {
    const out = [];
    // Issue: checklist areas with notes on unchecked items
    for (const r of records) {
      if (r.reportFormat !== "checklist" || !r.checklistResult) continue;
      for (const ar of r.checklistResult) {
        const tplArea = r.checklistTemplate?.areas?.find(a => a.id === ar.areaId);
        const issueItems = ar.checklistItems.filter(i => !i.checked && i.note?.trim());
        if (issueItems.length > 0) {
          out.push({
            recordId: r.id,
            kind: "issue",
            title: `${tplArea?.name || "Area"} — ${r.location}`,
            label: `${issueItems.length} flagged item${issueItems.length > 1 ? "s" : ""}`,
          });
        }
      }
    }
    // Overdue: tasks past deadline
    for (const r of records) {
      const t = r.linkedTask;
      if (!t || !t.deadline || t.status === "completed") continue;
      if (new Date(t.deadline) < new Date()) {
        out.push({
          recordId: r.id,
          kind: "overdue",
          title: r.title,
          label: "Task overdue",
        });
      }
    }
    return out;
  }, [records]);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Hi, {workerName}</h1>
        <p className="text-sm text-slate-500 mt-1 inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4"/>Today · {today}
        </p>
      </div>

      {/* Attendance — top priority, sticky on mobile */}
      {attendance && (
        <section className="mb-5 sm:static sticky top-14 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 sm:top-auto bg-slate-50 sm:bg-transparent pt-2 pb-1 sm:py-0">
          <AttendanceCard
            attendance={attendance}
            onOpenCheckIn={onCheckIn}
            onCheckOut={onCheckOut}
            pendingApproval={pendingAttendanceApproval}
          />
        </section>
      )}

      {/* Lock notice */}
      {locked && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 ring-1 ring-amber-200">
          <Lock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" strokeWidth={2.4}/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Please check in to start working</p>
            <p className="text-xs text-amber-800/80 mt-0.5">Your tasks and checklists will unlock once you're on duty.</p>
          </div>
        </div>
      )}

      {/* My Requests — Decision Layer entry */}
      <div className="mb-6">
        <MyRequestsSection
          requests={requests}
          onCreate={onCreateRequest}
          onOpen={onOpenRequest}
          locked={locked}
        />
      </div>

      {/* Section 1: Today's Work */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Work</h2>
          <button
            onClick={onCreate}
            disabled={locked}
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              locked ? "text-slate-400 cursor-not-allowed" : "text-indigo-600 hover:text-indigo-700"
            }`}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.6}/>
            New Report
          </button>
        </div>

        {/* Checklists subsection */}
        {checklistRecords.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3"/>Checklist
            </h3>
            <div className="space-y-3">
              {checklistRecords.map(r => (
                <WorkCardChecklist key={r.id} record={r} onOpen={() => onOpen(r.id)} locked={locked} />
              ))}
            </div>
          </div>
        )}

        {/* Tasks subsection */}
        {taskRecords.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 inline-flex items-center gap-1.5">
              <Wrench className="w-3 h-3"/>Tasks
            </h3>
            <div className="space-y-2.5">
              {taskRecords.map(r => (
                <WorkCardTask key={r.id} record={r} onOpen={() => onOpen(r.id)} locked={locked} />
              ))}
            </div>
          </div>
        )}

        {checklistRecords.length === 0 && taskRecords.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 mx-auto flex items-center justify-center mb-3">
              <CheckCheck className="w-6 h-6 text-emerald-600" strokeWidth={2.2}/>
            </div>
            <p className="text-sm font-semibold text-slate-900">All caught up</p>
            <p className="text-xs text-slate-500 mt-1">No work assigned for today.</p>
          </div>
        )}
      </section>

      {/* Section 2: Needs Attention */}
      {attentionItems.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Flagged</h2>
          <NeedsAttentionCard items={attentionItems} onOpen={onOpen} />
        </section>
      )}
    </div>
  );
}

/* =========================================================================
   SUPERVISOR: MetricCard
   ========================================================================= */

function MetricCard({ label, value, icon: Icon, tone = "slate", hint }) {
  const tones = {
    slate:   { bg: "bg-slate-50",   text: "text-slate-900",   iconBg: "bg-slate-200 text-slate-700"   },
    indigo:  { bg: "bg-indigo-50",  text: "text-indigo-900",  iconBg: "bg-indigo-100 text-indigo-700" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-900", iconBg: "bg-emerald-100 text-emerald-700" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-900",   iconBg: "bg-amber-100 text-amber-700"   },
    red:     { bg: "bg-red-50",     text: "text-red-900",     iconBg: "bg-red-100 text-red-700"       },
    blue:    { bg: "bg-blue-50",    text: "text-blue-900",    iconBg: "bg-blue-100 text-blue-700"     },
  };
  const t = tones[tone];
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.iconBg}`}>
          <Icon className="w-4 h-4" strokeWidth={2.4}/>
        </div>
      </div>
      <div className={`text-3xl sm:text-4xl font-bold tabular-nums ${t.text}`}>{value}</div>
      {hint && <div className="text-[11px] text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

/* =========================================================================
   SUPERVISOR: SiteStatusList
   ========================================================================= */

function SiteStatusList({ sites, onOpenSite }) {
  if (!sites || sites.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-slate-500"/>
        <h3 className="text-sm font-bold text-slate-900">Site Status</h3>
      </div>
      <ul>
        {sites.map((s, i) => {
          const ok = s.issues === 0;
          return (
            <li key={i}>
              <button
                onClick={() => onOpenSite?.(s)}
                className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${ok ? "bg-emerald-500" : "bg-red-500"}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {s.checklists} checklist{s.checklists !== 1 ? "s" : ""} · {s.tasks} task{s.tasks !== 1 ? "s" : ""}
                  </p>
                </div>
                {ok ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[11px] font-semibold">
                    <CheckCheck className="w-3 h-3" strokeWidth={2.4}/>
                    OK
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 text-[11px] font-semibold">
                    <AlertTriangle className="w-3 h-3" strokeWidth={2.4}/>
                    {s.issues} issue{s.issues > 1 ? "s" : ""}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* =========================================================================
   SUPERVISOR: AlertList (critical alerts)
   ========================================================================= */

function AlertList({ alerts, onOpen }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 mx-auto flex items-center justify-center mb-3">
          <CheckCheck className="w-6 h-6 text-emerald-600" strokeWidth={2.2}/>
        </div>
        <p className="text-sm font-semibold text-slate-900">No critical alerts</p>
        <p className="text-xs text-slate-500 mt-1">All systems running smoothly.</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600"/>
        <h3 className="text-sm font-bold text-slate-900">Critical Alerts</h3>
        <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold">
          {alerts.length}
        </span>
      </div>
      <ul>
        {alerts.map((a, i) => (
          <li key={i}>
            <button
              onClick={() => onOpen(a.id)}
              className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                a.kind === "overdue" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
              }`}>
                {a.kind === "overdue" ? <Timer className="w-4 h-4" strokeWidth={2.4}/> : <AlertTriangle className="w-4 h-4" strokeWidth={2.4}/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{a.title}</p>
                <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3"/>{a.location}
                </p>
              </div>
              {a.kind === "overdue" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 ring-1 ring-red-200 text-[11px] font-semibold shrink-0">
                  Overdue
                </span>
              ) : (
                <StatusBadge status={a.status} size="sm" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================================================
   SUPERVISOR DASHBOARD PAGE
   ========================================================================= */

function SupervisorDashboardPage({ records, onOpen, onGoList, workforce, requests = [], onApproveRequest, onRejectRequest, onOpenRequest }) {
  const today = new Date("2026-04-25T10:00:00").toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const metrics = useMemo(() => {
    const checklists = records.filter(r => r.reportFormat === "checklist");
    let completed = 0, inProgress = 0, issues = 0;
    for (const r of checklists) {
      const stats = computeChecklistStats(r);
      if (stats.hasIssue) issues++;
      if (stats.percent === 100) completed++;
      else if (stats.percent > 0) inProgress++;
    }
    return {
      total: checklists.length,
      completed,
      inProgress,
      issues,
    };
  }, [records]);

  // Roll up site-level stats from records
  const sites = useMemo(() => {
    const byLoc = {};
    for (const r of records) {
      if (!byLoc[r.location]) byLoc[r.location] = { name: r.location, checklists: 0, tasks: 0, issues: 0 };
      const bucket = byLoc[r.location];
      if (r.reportFormat === "checklist") {
        bucket.checklists++;
        const stats = computeChecklistStats(r);
        if (stats.hasIssue) bucket.issues++;
      }
      if (r.linkedTask && r.linkedTask.status !== "completed") {
        bucket.tasks++;
        if (r.linkedTask.deadline && new Date(r.linkedTask.deadline) < new Date()) {
          bucket.issues++;
        }
      }
      // Open complaints with critical severity also count
      if (r.type === "complaint" && r.severity === "critical" && r.status !== "closed" && r.status !== "resolved") {
        bucket.issues++;
      }
    }
    return Object.values(byLoc);
  }, [records]);

  const alerts = useMemo(() => {
    const out = [];
    // Overdue tasks
    for (const r of records) {
      const t = r.linkedTask;
      if (!t || !t.deadline || t.status === "completed") continue;
      if (new Date(t.deadline) < new Date()) {
        out.push({
          id: r.id,
          kind: "overdue",
          title: r.title,
          location: r.location,
        });
      }
    }
    // Unresolved complaints with high/critical severity
    for (const r of records) {
      if (r.type !== "complaint") continue;
      if (r.status === "closed" || r.status === "resolved") continue;
      if (r.severity !== "high" && r.severity !== "critical") continue;
      out.push({
        id: r.id,
        kind: "unresolved",
        title: r.title,
        location: r.location,
        status: r.status,
      });
    }
    return out;
  }, [records]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Supervisor Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1 inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4"/>{today}
        </p>
      </div>

      {/* Section 1: Metrics */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Today Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Total Checklists" value={metrics.total}      icon={ListChecks} tone="indigo" />
          <MetricCard label="Completed"        value={metrics.completed}  icon={CheckCheck} tone="emerald" />
          <MetricCard label="In Progress"      value={metrics.inProgress} icon={Loader2}    tone="amber" />
          <MetricCard label="Issues"           value={metrics.issues}     icon={AlertTriangle} tone={metrics.issues > 0 ? "red" : "slate"} />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Section 2: Site Status */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sites</h2>
          <SiteStatusList sites={sites} onOpenSite={() => onGoList("complaint")} />
        </section>

        {/* Section 3: Alerts */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Alerts</h2>
          <AlertList alerts={alerts} onOpen={onOpen} />
        </section>
      </div>

      {/* Section 4: Workforce Status */}
      {workforce && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 inline-flex items-center gap-1.5">
            <Users className="w-3 h-3"/>Workforce Status
          </h2>
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
            <WorkforceSummaryCard counts={workforce.counts} />
            <WorkforceList workers={workforce.workers} />
          </div>
        </section>
      )}

      {/* Section 5: Pending Approvals */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 inline-flex items-center gap-1.5">
          <Hourglass className="w-3 h-3"/>Approvals
        </h2>
        <PendingApprovalsSection
          requests={requests}
          onApprove={onApproveRequest}
          onReject={onRejectRequest}
          onOpen={onOpenRequest}
        />
      </section>

      {/* Section 6: Quick Actions */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onGoList("report")}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-100 transition-colors">
              <FileText className="w-5 h-5" strokeWidth={2.2}/>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900">View Reports</p>
              <p className="text-xs text-slate-500">Browse all internal reports</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors"/>
          </button>

          <button
            onClick={() => onGoList("complaint")}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <AlertCircle className="w-5 h-5" strokeWidth={2.2}/>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900">View Complaints</p>
              <p className="text-xs text-slate-500">Browse client complaints</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors"/>
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================================
   APP SHELL
   ========================================================================= */

function Sidebar({ currentView, onNavigate }) {
  const items = [
    { icon: LayoutGrid, label: "Dashboard", target: "home" },
    { icon: FileText,   label: "Reports",   target: "list" },
    { icon: Users,      label: "Workforce", target: null   },
    { icon: BarChart3,  label: "Analytics", target: null   },
    { icon: Settings,   label: "Settings",  target: null   },
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
          const active = it.target === currentView;
          return (
            <button
              key={i}
              onClick={() => it.target && onNavigate?.(it.target)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${
                active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
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
  const [view, setView] = useState({ name: "home" });
  const [role, setRole] = useState("Supervisor");

  // Modals
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);

  // Task ID counter (so newly-created tasks have unique sequential IDs)
  const taskIdRef = useRef(1090);
  const nextTaskId = () => `TSK-${taskIdRef.current++}`;

  // Attendance state — represents the current logged-in worker (Budi)
  const [attendance, setAttendance] = useState({
    isCheckedIn: false,
    clockInTime: null,
    clockOutTime: null,
    duration: 0,
    method: null,            // "qr" | "gps" | "selfie" | "manual"
    location: "Mall Alam Sutera",
    locationVerified: null,  // true | false | null (not applicable)
    photo: null,
  });

  const [checkInModalOpen, setCheckInModalOpen] = useState(false);

  // ----- Requests / Decision Layer -----
  const [requests, setRequests] = useState(initialRequests);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestModalPreset, setRequestModalPreset] = useState(null); // {defaultType, presetEntity}
  const requestIdRef = useRef(143);
  const nextRequestId = () => `REQ-${String(requestIdRef.current++).padStart(4, "0")}`;

  // Helper: is there a pending request related to the current attendance session?
  const pendingAttendanceApproval = useMemo(() => {
    if (!attendance.isCheckedIn || attendance.method !== "manual") return false;
    return requests.some(r =>
      r.status === "pending" &&
      r.type === "manual_checkin" &&
      r.requester.name === "Budi" &&
      r.relatedEntity?.type === "attendance"
    );
  }, [attendance, requests]);

  const openCheckInModal = () => setCheckInModalOpen(true);

  const openRequestModal = (preset) => {
    setRequestModalPreset(preset || null);
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = ({ type, notes, detail, relatedEntity }) => {
    const now = new Date().toISOString();
    const labels = { leave: "Leave", overtime: "Overtime", manual_checkin: "Manual check-in" };
    const newReq = {
      id: nextRequestId(),
      type,
      requester: { id: "w_budi", name: "Budi", role: "Cleaning" },
      status: "pending",
      relatedEntity: relatedEntity || null,
      notes,
      timestamp: now,
      submittedBy: "Budi",
      approvedBy: null,
      detail,
      messages: [
        { type: "system", user: "System", role: "System", message: `${labels[type] || "Request"} submitted`, timestamp: now },
      ],
    };
    setRequests(prev => [newReq, ...prev]);
    setRequestModalOpen(false);
  };

  const handleApproveRequest = (id) => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const messages = [...(r.messages || []),
        { type: "system", user: "System", role: "System", message: "Request approved by You (Supervisor)", timestamp: now },
      ];
      return { ...r, status: "approved", approvedBy: "You (Supervisor)", messages };
    }));
  };

  const handleRejectRequest = (id) => {
    const now = new Date().toISOString();
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const messages = [...(r.messages || []),
        { type: "system", user: "System", role: "System", message: "Request rejected by You (Supervisor)", timestamp: now },
      ];
      return { ...r, status: "rejected", approvedBy: "You (Supervisor)", rejectedReason: "Reviewed by supervisor.", messages };
    }));
  };

  // ---- Communication Layer: open/send for requests ----
  const [requestDetailModalOpen, setRequestDetailModalOpen] = useState(false);
  const [requestDetailId, setRequestDetailId] = useState(null);

  const handleOpenRequest = (id) => {
    setRequestDetailId(id);
    setRequestDetailModalOpen(true);
  };

  const handleSendRequestMessage = (id, text) => {
    const now = new Date().toISOString();
    const userMap = { Client: "You (Client)", Supervisor: "You (Supervisor)", Worker: "You (Worker)" };
    const senderName = userMap[role] || "You";
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r;
      const messages = [...(r.messages || []),
        { type: "comment", user: senderName, role, message: text, timestamp: now },
      ];
      return { ...r, messages };
    }));
  };

  // ---- Communication Layer: send messages on tasks (embedded in complaints) ----
  const handleSendTaskMessage = (taskId, text) => {
    const now = new Date().toISOString();
    const userMap = { Client: "You (Client)", Supervisor: "You (Supervisor)", Worker: "You (Worker)" };
    const senderName = userMap[role] || "You";
    setComplaints(prev => prev.map(c => {
      if (!c.linkedTask || c.linkedTask.id !== taskId) return c;
      const messages = [...(c.linkedTask.messages || []),
        { type: "comment", user: senderName, role, message: text, timestamp: now },
      ];
      return { ...c, linkedTask: { ...c.linkedTask, messages } };
    }));
  };

  // Resolve current detail target for the request modal
  const detailRequest = requestDetailId ? requests.find(r => r.id === requestDetailId) : null;

  const handleCheckInComplete = (payload) => {
    const now = new Date().toISOString();
    setAttendance({
      isCheckedIn: true,
      clockInTime: now,
      clockOutTime: null,
      duration: 0,
      method: payload.method,
      location: payload.location || attendance.location,
      locationVerified: payload.locationVerified ?? null,
      photo: payload.photo || null,
    });

    // Decision Layer: manual check-in auto-creates a pending request
    if (payload.method === "manual") {
      const attendanceRefId = `att-budi-${now.slice(0, 10)}`;
      const newReq = {
        id: nextRequestId(),
        type: "manual_checkin",
        requester: { id: "w_budi", name: "Budi", role: "Cleaning" },
        status: "pending",
        relatedEntity: { type: "attendance", id: attendanceRefId },
        notes: `Manual check-in at ${payload.location} — no automated verification available.`,
        timestamp: now,
        submittedBy: "Budi",
        approvedBy: null,
        detail: { method: "manual", location: payload.location },
        messages: [
          { type: "system", user: "System", role: "System", message: "Manual check-in flagged for review", timestamp: now },
        ],
      };
      setRequests(prev => [newReq, ...prev]);
    }
  };

  const handleCheckOut = () => {
    const duration = attendance.clockInTime
      ? Math.floor((Date.now() - new Date(attendance.clockInTime).getTime()) / 1000)
      : 0;
    setAttendance({
      isCheckedIn: false,
      clockInTime: null,
      clockOutTime: new Date().toISOString(),
      duration,
      method: null,
      location: attendance.location,
      locationVerified: null,
      photo: null,
    });
  };

  // Workforce roster (mock) — Budi's status mirrors the live attendance state
  const workforce = useMemo(() => {
    const budiStatus = attendance.isCheckedIn ? "on_duty" : "not_checked_in";
    const budiDuration = attendance.isCheckedIn && attendance.clockInTime
      ? fmtDurationShort(Math.floor((Date.now() - new Date(attendance.clockInTime).getTime()) / 1000))
      : null;

    const workers = [
      {
        name: "Budi", role: "Cleaning",
        status: budiStatus,
        duration: budiDuration,
        method: attendance.isCheckedIn ? attendance.method : null,
      },
      // Other workforce mock — fixed for demo, illustrates each method type
      { name: "Sari",  role: "Cleaning",    status: "on_duty",        duration: "3h 22m", method: "qr" },
      { name: "Joko",  role: "Maintenance", status: "on_duty",        duration: "1h 47m", method: "gps" },
      { name: "Lina",  role: "Security",    status: "on_duty",        duration: "0h 38m", method: "selfie" },
      { name: "Hadi",  role: "Maintenance", status: "on_duty",        duration: "2h 05m", method: "manual" },
      { name: "Andi",  role: "Security",    status: "not_checked_in" },
      { name: "Rudi",  role: "Maintenance", status: "late",           lateBy: "15m" },
    ];

    // Headline numbers per the spec (8 / 2 / 1)
    // Live-adjust if Budi flips status so the demo feels real.
    const counts = {
      onDuty:       budiStatus === "on_duty" ? 8 : 7,
      notCheckedIn: budiStatus === "not_checked_in" ? 2 : 3,
      late:         1,
    };

    return { workers, counts };
  }, [attendance]);

  const openComplaint = (id) => setView({ name: "detail", id });
  const goList = (typePreset) => setView({ name: "list", typePreset });
  const goCreate = () => setView({ name: "create" });
  const goHome = () => setView({ name: "home" });

  // Sidebar navigation
  const handleSidebarNav = (target) => {
    if (target === "home") goHome();
    else if (target === "list") goList();
  };

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
      reportFormat: data.reportFormat || "narrative",
      title: data.description.split(/[.\n]/)[0].slice(0, 60) || (isReport ? "New report" : "New complaint"),
      description: data.description,
      category: data.category,
      severity: data.severity,
      location: data.location,
      // Checklist reports start in "draft-logged": worker needs to fill items first.
      // For mock, we use "logged" as the initial visible state for both narrative & checklist.
      status: isReport ? "logged" : "open",
      createdAt: now,
      sla: { dueIn: 24, breached: false },
      photos: data.photos,
      submittedBy: { name: "You", role: submitterRole },
      assignedTo: null,
      linkedTask: null,
      taskHistory: [],
      ...(data.checklistTemplate ? {
        checklistTemplate: data.checklistTemplate,
        checklistResult: data.checklistResult,
      } : {}),
      updates: [
        {
          type: "comment",
          user: "You",
          role: submitterRole,
          message: data.reportFormat === "checklist"
            ? `Checklist started — ${data.checklistTemplate.name}`
            : isReport ? "Report submitted." : "Complaint submitted.",
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

  /* ---------- Checklist execution ---------- */

  const handleChecklistToggle = (areaId, itemId) => {
    if (!detailComplaint) return;
    setComplaints(prev => prev.map(c => {
      if (c.id !== detailComplaint.id || !c.checklistResult) return c;
      const checklistResult = c.checklistResult.map(ar => {
        if (ar.areaId !== areaId) return ar;
        const checklistItems = ar.checklistItems.map(it =>
          it.id === itemId ? { ...it, checked: !it.checked } : it
        );
        return { ...ar, checklistItems, status: computeAreaStatus(checklistItems) };
      });
      return { ...c, checklistResult };
    }));
  };

  const handleChecklistNote = (areaId, itemId, text) => {
    if (!detailComplaint) return;
    setComplaints(prev => prev.map(c => {
      if (c.id !== detailComplaint.id || !c.checklistResult) return c;
      const checklistResult = c.checklistResult.map(ar => {
        if (ar.areaId !== areaId) return ar;
        const checklistItems = ar.checklistItems.map(it =>
          it.id === itemId ? { ...it, note: text } : it
        );
        return { ...ar, checklistItems };
      });
      return { ...c, checklistResult };
    }));
  };

  const handleChecklistSubmit = () => {
    if (!detailComplaint) return;
    const userName = userMap[role];
    const now = new Date().toISOString();
    setComplaints(prev => prev.map(c => {
      if (c.id !== detailComplaint.id) return c;
      const stats = computeChecklistStats(c);
      const partial = stats.percent < 100;
      const updates = [...c.updates,
        { type: "system", user: "System", role: "System",
          message: partial
            ? `Checklist report submitted (partial — ${stats.percent}%)`
            : "Checklist report submitted",
          timestamp: now },
      ];
      return { ...c, status: "logged", updates };
    }));
    // Bonus: jump back to area list view by clearing any open area in local state isn't directly possible from here,
    // but the next render will show the correct read-only summary because checklistEditable becomes false.
  };

  const handleCreateTaskFromIssues = () => {
    // Open the existing CreateTaskModal — it will appear with default fields.
    // The checklist context is preserved in the complaint, so the supervisor
    // can reference the issue notes when filling task notes.
    setTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentView={view.name} onNavigate={handleSidebarNav}/>
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar role={role} setRole={setRole}/>
        <main className="flex-1 pb-16 lg:pb-0">
          {view.name === "home" && (
            role === "Supervisor" ? (
              <SupervisorDashboardPage
                records={complaints}
                onOpen={openComplaint}
                onGoList={goList}
                workforce={workforce}
                requests={requests}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                onOpenRequest={handleOpenRequest}
              />
            ) : (
              <TodayWorkPage
                records={complaints}
                onOpen={openComplaint}
                onCreate={goCreate}
                workerName={role === "Client" ? "there" : "Budi"}
                attendance={attendance}
                onCheckIn={openCheckInModal}
                onCheckOut={handleCheckOut}
                requests={requests.filter(r => r.requester.name === "Budi")}
                onCreateRequest={() => openRequestModal()}
                onOpenRequest={handleOpenRequest}
                pendingAttendanceApproval={pendingAttendanceApproval}
              />
            )
          )}
          {view.name === "list" && (
            <ComplaintListPage
              complaints={complaints}
              onOpen={openComplaint}
              onCreate={goCreate}
              initialTypeFilter={view.typePreset}
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
              onChecklistToggle={handleChecklistToggle}
              onChecklistNote={handleChecklistNote}
              onChecklistSubmit={handleChecklistSubmit}
              onCreateTaskFromIssues={handleCreateTaskFromIssues}
              onSendTaskMessage={handleSendTaskMessage}
            />
          )}
        </main>

        {/* Mobile bottom nav (hidden on lg) */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200">
          <div className="grid grid-cols-3">
            {[
              { id: "home",  label: "Home",    icon: LayoutGrid, onClick: goHome,    active: view.name === "home" },
              { id: "list",  label: "Reports", icon: FileText,   onClick: () => goList(), active: view.name === "list" },
              { id: "user",  label: "Profile", icon: User,       onClick: null,      active: false },
            ].map(it => {
              const Icon = it.icon;
              return (
                <button
                  key={it.id}
                  onClick={it.onClick || undefined}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                    it.active ? "text-indigo-600" : "text-slate-500"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={2.2}/>
                  <span className="text-[10px] font-semibold">{it.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
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

      <CheckInModal
        open={checkInModalOpen}
        onClose={() => setCheckInModalOpen(false)}
        onCheckIn={handleCheckInComplete}
        defaultLocation={attendance.location}
      />

      <RequestFormModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleSubmitRequest}
        defaultType={requestModalPreset?.defaultType}
        presetEntity={requestModalPreset?.presetEntity}
      />

      <RequestDetailModal
        open={requestDetailModalOpen}
        onClose={() => setRequestDetailModalOpen(false)}
        request={detailRequest}
        role={role}
        onComment={handleSendRequestMessage}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
