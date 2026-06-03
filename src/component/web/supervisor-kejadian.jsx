import { useState } from "react";

const REPORTS = [
  {
    id: "KJD-20250520-001",
    title: "Panel listrik mati di zona B",
    type: "Kejadian",
    severity: "high",
    status: "submitted",
    submittedBy: "Rendi Kurniawan",
    submittedAt: "08:14",
    location: "Gedung Utara — Lt. 3",
    notes: "Panel listrik zona B tiba-tiba mati sekitar pukul 07.50. Sudah coba reset breaker tapi tidak berhasil. Beberapa ruangan tidak ada daya.",
    photos: 3,
    assignedTo: null,
    activityLog: [
      { time: "08:14", actor: "Rendi Kurniawan", action: "Laporan disubmit", type: "submit" },
    ],
  },
  {
    id: "KJD-20250520-002",
    title: "Kebocoran pipa di lantai 1",
    type: "Kejadian",
    severity: "medium",
    status: "in_review",
    submittedBy: "Dian Pratama",
    submittedAt: "09:32",
    location: "Gedung Selatan — Lt. 1",
    notes: "Ada kebocoran pipa di dekat toilet pria. Air menggenang sekitar 2 meter persegi. Sudah pasang tanda peringatan sementara.",
    photos: 2,
    assignedTo: "Budi Santoso",
    activityLog: [
      { time: "09:32", actor: "Dian Pratama", action: "Laporan disubmit", type: "submit" },
      { time: "09:45", actor: "Supervisor", action: "Diterima & di-assign ke Budi Santoso", type: "assign" },
    ],
  },
  {
    id: "KJD-20250520-003",
    title: "CCTV offline area parkir",
    type: "Kejadian",
    severity: "low",
    status: "resolved",
    submittedBy: "Hendra Wijaya",
    submittedAt: "07:05",
    location: "Area Parkir B2",
    notes: "CCTV di area parkir B2 sudah offline sejak kemarin malam. Perlu pengecekan kabel dan DVR.",
    photos: 1,
    assignedTo: "Teguh Alamsyah",
    activityLog: [
      { time: "07:05", actor: "Hendra Wijaya", action: "Laporan disubmit", type: "submit" },
      { time: "07:20", actor: "Supervisor", action: "Diterima & di-assign ke Teguh Alamsyah", type: "assign" },
      { time: "10:15", actor: "Teguh Alamsyah", action: "Laporan selesai ditindaklanjuti", type: "resolve" },
    ],
  },
  {
    id: "KJD-20250520-004",
    title: "Lift tidak berfungsi",
    type: "Kejadian",
    severity: "critical",
    status: "submitted",
    submittedBy: "Sari Maulida",
    submittedAt: "10:02",
    location: "Tower A — Lift 2",
    notes: "Lift Tower A nomor 2 berhenti di lantai 7 dan pintu tidak mau terbuka. Tidak ada penumpang terjebak, sudah dipastikan kosong. Perlu teknisi lift segera.",
    photos: 4,
    assignedTo: null,
    activityLog: [
      { time: "10:02", actor: "Sari Maulida", action: "Laporan disubmit", type: "submit" },
    ],
  },
];

const TEAM = [
  "Budi Santoso",
  "Teguh Alamsyah",
  "Irwan Fauzi",
  "Rina Saptari",
  "Doni Hermawan",
];

const SEVERITY_CONFIG = {
  critical: { label: "KRITIS", color: "#FF2D55", bg: "#FF2D5518", dot: "#FF2D55" },
  high: { label: "TINGGI", color: "#FF6B00", bg: "#FF6B0018", dot: "#FF6B00" },
  medium: { label: "SEDANG", color: "#F5A623", bg: "#F5A62318", dot: "#F5A623" },
  low: { label: "RENDAH", color: "#34C759", bg: "#34C75918", dot: "#34C759" },
};

const STATUS_CONFIG = {
  submitted: { label: "Menunggu", color: "#FF9500", bg: "#FF950015" },
  in_review: { label: "Ditinjau", color: "#007AFF", bg: "#007AFF15" },
  resolved: { label: "Selesai", color: "#34C759", bg: "#34C75915" },
  closed: { label: "Ditutup", color: "#8E8E93", bg: "#8E8E9315" },
};

export default function App() {
  const [reports, setReports] = useState(REPORTS);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [assignModal, setAssignModal] = useState(false);
  const [assignTarget, setAssignTarget] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [view, setView] = useState("list"); // list | detail

  const filtered = filterStatus === "all"
    ? reports
    : reports.filter(r => r.status === filterStatus);

  const counts = {
    all: reports.length,
    submitted: reports.filter(r => r.status === "submitted").length,
    in_review: reports.filter(r => r.status === "in_review").length,
    resolved: reports.filter(r => r.status === "resolved").length,
    closed: reports.filter(r => r.status === "closed").length,
  };

  function openDetail(report) {
    setSelected(report);
    setView("detail");
  }

  function handleAssign() {
    if (!assignTarget) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setReports(prev => prev.map(r =>
      r.id === selected.id
        ? {
            ...r,
            status: "in_review",
            assignedTo: assignTarget,
            activityLog: [...r.activityLog, {
              time,
              actor: "Supervisor",
              action: `Diterima & di-assign ke ${assignTarget}`,
              type: "assign"
            }]
          }
        : r
    ));
    const updated = { ...selected, status: "in_review", assignedTo: assignTarget };
    setSelected(updated);
    setAssignModal(false);
    setAssignTarget("");
  }

  function handleAccept() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setReports(prev => prev.map(r =>
      r.id === selected.id
        ? {
            ...r,
            status: "in_review",
            activityLog: [...r.activityLog, {
              time,
              actor: "Supervisor",
              action: "Laporan diterima oleh supervisor",
              type: "accept"
            }]
          }
        : r
    ));
    setSelected({ ...selected, status: "in_review" });
  }

  function handleResolve() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setReports(prev => prev.map(r =>
      r.id === selected.id
        ? {
            ...r,
            status: "resolved",
            activityLog: [...r.activityLog, {
              time,
              actor: "Supervisor",
              action: "Ditandai selesai oleh supervisor",
              type: "resolve"
            }]
          }
        : r
    ));
    setSelected({ ...selected, status: "resolved" });
  }

  function handleClose() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setReports(prev => prev.map(r =>
      r.id === selected.id
        ? {
            ...r,
            status: "closed",
            activityLog: [...r.activityLog, {
              time,
              actor: "Supervisor",
              action: "Laporan ditutup — tidak dapat diubah lagi",
              type: "close"
            }]
          }
        : r
    ));
    setSelected({ ...selected, status: "closed" });
  }

  function handleReject() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setReports(prev => prev.map(r =>
      r.id === selected.id
        ? {
            ...r,
            status: "submitted",
            assignedTo: null,
            activityLog: [...r.activityLog, {
              time,
              actor: "Supervisor",
              action: `Dikembalikan — catatan: ${rejectNote || "perlu revisi"}`,
              type: "reject"
            }]
          }
        : r
    ));
    setSelected({ ...selected, status: "submitted", assignedTo: null });
    setRejectModal(false);
    setRejectNote("");
  }

  const s = {
    root: {
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0F0F13",
      minHeight: "100vh",
      color: "#F2F2F7",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
    },
    header: {
      background: "linear-gradient(180deg, #1A1A24 0%, #0F0F13 100%)",
      padding: "52px 20px 16px",
      borderBottom: "1px solid #1E1E2A",
    },
    headerTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    orgLabel: {
      fontSize: 11,
      color: "#8E8E9A",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      fontWeight: 600,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#34C759",
      boxShadow: "0 0 6px #34C759",
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: -0.5,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 12,
      color: "#636370",
    },
    statRow: {
      display: "flex",
      gap: 8,
      padding: "14px 20px",
      overflowX: "auto",
      scrollbarWidth: "none",
    },
    statCard: (active) => ({
      flex: "0 0 auto",
      padding: "10px 14px",
      borderRadius: 12,
      cursor: "pointer",
      border: active ? "1px solid #2A2A3A" : "1px solid transparent",
      background: active ? "#1E1E2A" : "transparent",
      transition: "all 0.15s",
      minWidth: 80,
    }),
    statNum: (color) => ({
      fontSize: 22,
      fontWeight: 700,
      color: color || "#F2F2F7",
      lineHeight: 1,
      marginBottom: 2,
    }),
    statLabel: {
      fontSize: 10,
      color: "#636370",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: 600,
    },
    list: {
      padding: "4px 16px 100px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    },
    card: (severity) => ({
      background: "#1A1A24",
      borderRadius: 16,
      padding: 16,
      border: `1px solid ${severity === "critical" ? "#FF2D5530" : severity === "high" ? "#FF6B0025" : "#2A2A3A"}`,
      cursor: "pointer",
      transition: "all 0.15s",
      position: "relative",
      overflow: "hidden",
    }),
    cardAccent: (severity) => ({
      position: "absolute",
      top: 0,
      left: 0,
      width: 3,
      height: "100%",
      background: SEVERITY_CONFIG[severity].color,
      borderRadius: "16px 0 0 16px",
    }),
    cardHead: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
      paddingLeft: 8,
    },
    cardId: {
      fontSize: 10,
      color: "#636370",
      fontWeight: 600,
      letterSpacing: 0.5,
      fontFamily: "monospace",
    },
    severityBadge: (severity) => ({
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: 1,
      color: SEVERITY_CONFIG[severity].color,
      background: SEVERITY_CONFIG[severity].bg,
      padding: "3px 8px",
      borderRadius: 6,
    }),
    cardTitle: {
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 6,
      paddingLeft: 8,
      lineHeight: 1.3,
    },
    cardMeta: {
      display: "flex",
      gap: 12,
      paddingLeft: 8,
      marginBottom: 10,
    },
    metaItem: {
      fontSize: 11,
      color: "#8E8E9A",
      display: "flex",
      alignItems: "center",
      gap: 4,
    },
    cardFooter: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: 8,
      paddingTop: 10,
      borderTop: "1px solid #2A2A3A",
    },
    statusBadge: (status) => ({
      fontSize: 11,
      fontWeight: 600,
      color: STATUS_CONFIG[status].color,
      background: STATUS_CONFIG[status].bg,
      padding: "4px 10px",
      borderRadius: 8,
    }),
    assignedChip: {
      fontSize: 11,
      color: "#636370",
      display: "flex",
      alignItems: "center",
      gap: 4,
    },
    unassignedChip: {
      fontSize: 11,
      color: "#FF9500",
      background: "#FF950015",
      padding: "3px 8px",
      borderRadius: 6,
      fontWeight: 600,
    },

    // DETAIL VIEW
    detailWrap: {
      position: "fixed",
      inset: 0,
      background: "#0F0F13",
      zIndex: 100,
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    },
    detailHeader: {
      background: "#1A1A24",
      padding: "52px 20px 20px",
      borderBottom: "1px solid #2A2A3A",
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    backBtn: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      color: "#007AFF",
      fontSize: 14,
      cursor: "pointer",
      marginBottom: 14,
      background: "none",
      border: "none",
      padding: 0,
      fontFamily: "inherit",
    },
    detailIdRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    detailId: {
      fontSize: 11,
      color: "#636370",
      fontFamily: "monospace",
      fontWeight: 600,
      letterSpacing: 0.5,
    },
    detailTitle: {
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: -0.3,
      marginBottom: 12,
      lineHeight: 1.2,
    },
    badgeRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    },
    detailBody: {
      padding: "20px 20px 120px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    },
    section: {
      background: "#1A1A24",
      borderRadius: 14,
      padding: 16,
      border: "1px solid #2A2A3A",
    },
    sectionLabel: {
      fontSize: 10,
      color: "#636370",
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: 700,
      marginBottom: 10,
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
      gap: 8,
    },
    infoKey: {
      fontSize: 12,
      color: "#8E8E9A",
      flex: "0 0 100px",
    },
    infoVal: {
      fontSize: 13,
      fontWeight: 500,
      textAlign: "right",
      flex: 1,
    },
    noteText: {
      fontSize: 13,
      color: "#C7C7CC",
      lineHeight: 1.6,
    },
    photoStrip: {
      display: "flex",
      gap: 8,
    },
    photoBox: {
      width: 72,
      height: 72,
      borderRadius: 10,
      background: "#2A2A3A",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 22,
    },
    logItem: {
      display: "flex",
      gap: 12,
      marginBottom: 14,
    },
    logDotWrap: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 0,
    },
    logDot: (type) => ({
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: type === "submit" ? "#007AFF"
        : type === "accept" ? "#AF52DE"
        : type === "assign" ? "#FF9500"
        : type === "resolve" ? "#34C759"
        : type === "reject" ? "#FF2D55"
        : type === "close" ? "#8E8E93"
        : "#636370",
      flexShrink: 0,
      marginTop: 3,
    }),
    logLine: {
      width: 1,
      flex: 1,
      background: "#2A2A3A",
      minHeight: 16,
      marginTop: 4,
    },
    logContent: { flex: 1 },
    logActor: { fontSize: 12, fontWeight: 600, marginBottom: 1 },
    logAction: { fontSize: 12, color: "#8E8E9A" },
    logTime: { fontSize: 10, color: "#636370", marginTop: 2 },

    // ACTION BAR
    actionBar: {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      background: "linear-gradient(180deg, transparent 0%, #0F0F13 30%)",
      padding: "20px 20px 36px",
      display: "flex",
      gap: 10,
    },
    btnPrimary: {
      flex: 1,
      padding: "14px 0",
      borderRadius: 14,
      background: "#007AFF",
      color: "#fff",
      border: "none",
      fontSize: 14,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnSecondary: {
      flex: 1,
      padding: "14px 0",
      borderRadius: 14,
      background: "#1E1E2A",
      color: "#F2F2F7",
      border: "1px solid #2A2A3A",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnDanger: {
      flex: 1,
      padding: "14px 0",
      borderRadius: 14,
      background: "#FF2D5520",
      color: "#FF2D55",
      border: "1px solid #FF2D5530",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    btnSuccess: {
      flex: 1,
      padding: "14px 0",
      borderRadius: 14,
      background: "#34C75920",
      color: "#34C759",
      border: "1px solid #34C75930",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
    },

    // MODAL
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "#00000080",
      zIndex: 200,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    modalSheet: {
      background: "#1A1A24",
      borderRadius: "20px 20px 0 0",
      padding: "24px 20px 48px",
      width: "100%",
      maxWidth: 430,
      border: "1px solid #2A2A3A",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 6,
    },
    modalSub: {
      fontSize: 13,
      color: "#8E8E9A",
      marginBottom: 20,
    },
    teamList: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      marginBottom: 20,
    },
    teamOption: (selected) => ({
      padding: "12px 14px",
      borderRadius: 12,
      cursor: "pointer",
      border: selected ? "1px solid #007AFF" : "1px solid #2A2A3A",
      background: selected ? "#007AFF15" : "#0F0F13",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "all 0.15s",
    }),
    teamName: { fontSize: 14, fontWeight: 500 },
    textarea: {
      width: "100%",
      background: "#0F0F13",
      border: "1px solid #2A2A3A",
      borderRadius: 12,
      padding: 14,
      color: "#F2F2F7",
      fontSize: 14,
      fontFamily: "inherit",
      resize: "none",
      outline: "none",
      marginBottom: 16,
      boxSizing: "border-box",
    },

    emptyState: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#636370",
    },
  };

  if (view === "detail" && selected) {
    const sev = SEVERITY_CONFIG[selected.severity];
    const sta = STATUS_CONFIG[selected.status];
    const liveSelected = reports.find(r => r.id === selected.id) || selected;

    return (
      <div style={s.root}>
        <div style={s.detailWrap}>
          <div style={s.detailHeader}>
            <button style={s.backBtn} onClick={() => setView("list")}>
              ← Kembali
            </button>
            <div style={s.detailIdRow}>
              <span style={s.detailId}>{liveSelected.id}</span>
              <span style={s.detailId}>📷 {liveSelected.photos} foto</span>
            </div>
            <div style={s.detailTitle}>{liveSelected.title}</div>
            <div style={s.badgeRow}>
              <span style={s.severityBadge(liveSelected.severity)}>⬤ {sev.label}</span>
              <span style={s.statusBadge(liveSelected.status)}>{sta.label}</span>
            </div>
          </div>

          <div style={s.detailBody}>
            {/* Info */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Informasi Laporan</div>
              {[
                ["Dilaporkan oleh", liveSelected.submittedBy],
                ["Waktu lapor", `Hari ini, ${liveSelected.submittedAt}`],
                ["Lokasi", liveSelected.location],
                ["Ditugaskan ke", liveSelected.assignedTo || "—"],
              ].map(([k, v]) => (
                <div key={k} style={s.infoRow}>
                  <span style={s.infoKey}>{k}</span>
                  <span style={{ ...s.infoVal, color: k === "Ditugaskan ke" && !liveSelected.assignedTo ? "#636370" : "#F2F2F7" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Keterangan */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Keterangan</div>
              <p style={s.noteText}>{liveSelected.notes}</p>
            </div>

            {/* Foto */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Dokumen Pendukung ({liveSelected.photos} foto)</div>
              <div style={s.photoStrip}>
                {Array.from({ length: liveSelected.photos }).map((_, i) => (
                  <div key={i} style={s.photoBox}>🖼</div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Riwayat Aktivitas</div>
              {liveSelected.activityLog.map((log, i) => (
                <div key={i} style={s.logItem}>
                  <div style={s.logDotWrap}>
                    <div style={s.logDot(log.type)} />
                    {i < liveSelected.activityLog.length - 1 && <div style={s.logLine} />}
                  </div>
                  <div style={s.logContent}>
                    <div style={s.logActor}>{log.actor}</div>
                    <div style={s.logAction}>{log.action}</div>
                    <div style={s.logTime}>{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Bar */}
          <div style={s.actionBar}>
            {liveSelected.status === "submitted" && (
              <>
                <button style={s.btnDanger} onClick={() => setRejectModal(true)}>Kembalikan</button>
                <button style={s.btnSecondary} onClick={handleAccept}>Terima</button>
                <button style={s.btnPrimary} onClick={() => setAssignModal(true)}>Assign →</button>
              </>
            )}
            {liveSelected.status === "in_review" && (
              <>
                <button style={s.btnSecondary} onClick={() => setAssignModal(true)}>Re-assign</button>
                <button style={s.btnSuccess} onClick={handleResolve}>✓ Selesai</button>
              </>
            )}
            {liveSelected.status === "resolved" && (
              <>
                <div style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#34C759", padding: "14px 0" }}>
                  ✓ Laporan telah diselesaikan
                </div>
                <button style={s.btnSecondary} onClick={handleClose}>Tutup Laporan</button>
              </>
            )}
            {liveSelected.status === "closed" && (
              <div style={{ flex: 1, textAlign: "center", fontSize: 13, color: "#8E8E93", padding: "14px 0" }}>
                🔒 Laporan ditutup — tidak dapat diubah
              </div>
            )}
          </div>
        </div>

        {/* Assign Modal */}
        {assignModal && (
          <div style={s.modalOverlay} onClick={() => setAssignModal(false)}>
            <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
              <div style={s.modalTitle}>Assign Laporan</div>
              <div style={s.modalSub}>Pilih anggota tim untuk menindaklanjuti laporan ini</div>
              <div style={s.teamList}>
                {TEAM.map(name => (
                  <div key={name} style={s.teamOption(assignTarget === name)} onClick={() => setAssignTarget(name)}>
                    <span style={s.teamName}>{name}</span>
                    {assignTarget === name && <span style={{ color: "#007AFF", fontSize: 16 }}>✓</span>}
                  </div>
                ))}
              </div>
              <button style={{ ...s.btnPrimary, opacity: assignTarget ? 1 : 0.4 }} onClick={handleAssign}>
                Konfirmasi Assign
              </button>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div style={s.modalOverlay} onClick={() => setRejectModal(false)}>
            <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
              <div style={s.modalTitle}>Kembalikan Laporan</div>
              <div style={s.modalSub}>Berikan catatan untuk pelapor agar dapat direvisi</div>
              <textarea
                style={s.textarea}
                rows={4}
                placeholder="Contoh: Data lokasi tidak lengkap, mohon perjelas area kejadian..."
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
              />
              <button style={s.btnDanger} onClick={handleReject}>Kembalikan ke Pelapor</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <div style={s.orgLabel}>Vertika Tekno Lokacipta</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#636370" }}>Supervisor</span>
            <div style={s.onlineDot} />
          </div>
        </div>
        <div style={s.pageTitle}>Laporan Kejadian</div>
        <div style={s.subtitle}>Hari ini, 20 Mei 2025 · {reports.filter(r => r.status === "submitted").length} menunggu tindakan</div>
      </div>

      {/* Filter Stats */}
      <div style={s.statRow}>
        {[
          { key: "all", label: "Semua", color: "#F2F2F7" },
          { key: "submitted", label: "Menunggu", color: "#FF9500" },
          { key: "in_review", label: "Ditinjau", color: "#007AFF" },
          { key: "resolved", label: "Selesai", color: "#34C759" },
          { key: "closed", label: "Ditutup", color: "#8E8E93" },
        ].map(f => (
          <div key={f.key} style={s.statCard(filterStatus === f.key)} onClick={() => setFilterStatus(f.key)}>
            <div style={s.statNum(filterStatus === f.key ? f.color : "#8E8E9A")}>{counts[f.key]}</div>
            <div style={s.statLabel}>{f.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={s.list}>
        {filtered.length === 0 && (
          <div style={s.emptyState}>Tidak ada laporan untuk kategori ini</div>
        )}
        {filtered.map(report => (
          <div key={report.id} style={s.card(report.severity)} onClick={() => openDetail(report)}>
            <div style={s.cardAccent(report.severity)} />
            <div style={s.cardHead}>
              <span style={s.cardId}>{report.id}</span>
              <span style={s.severityBadge(report.severity)}>
                {SEVERITY_CONFIG[report.severity].label}
              </span>
            </div>
            <div style={s.cardTitle}>{report.title}</div>
            <div style={s.cardMeta}>
              <span style={s.metaItem}>📍 {report.location}</span>
              <span style={s.metaItem}>🕐 {report.submittedAt}</span>
            </div>
            <div style={s.cardFooter}>
              <span style={s.statusBadge(report.status)}>{STATUS_CONFIG[report.status].label}</span>
              {report.assignedTo
                ? <span style={s.assignedChip}>👤 {report.assignedTo}</span>
                : <span style={s.unassignedChip}>Belum di-assign</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
