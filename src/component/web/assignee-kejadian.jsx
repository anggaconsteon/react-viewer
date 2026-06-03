import { useState, useRef } from "react";

const TASKS = [
  {
    id: "KJD-20250520-001",
    title: "Panel listrik mati di zona B",
    severity: "high",
    status: "assigned",
    assignedAt: "09:45",
    submittedBy: "Rendi Kurniawan",
    submittedAt: "08:14",
    location: "Gedung Utara — Lt. 3",
    notes: "Panel listrik zona B tiba-tiba mati sekitar pukul 07.50. Sudah coba reset breaker tapi tidak berhasil. Beberapa ruangan tidak ada daya.",
    originalPhotos: 3,
    activityLog: [
      { time: "08:14", actor: "Rendi Kurniawan", action: "Laporan disubmit", type: "submit" },
      { time: "09:45", actor: "Supervisor", action: "Diterima & di-assign ke Budi Santoso", type: "assign" },
    ],
  },
  {
    id: "KJD-20250519-007",
    title: "Kebocoran minor plafon koridor C",
    severity: "medium",
    status: "on_progress",
    assignedAt: "14:20",
    submittedBy: "Hendra Wijaya",
    submittedAt: "13:55",
    location: "Gedung Timur — Koridor C",
    notes: "Ada rembesan air dari plafon di koridor C sepanjang sekitar 3 meter. Terjadi setelah hujan deras kemarin. Lantai sudah licin.",
    originalPhotos: 2,
    activityLog: [
      { time: "13:55", actor: "Hendra Wijaya", action: "Laporan disubmit", type: "submit" },
      { time: "14:20", actor: "Supervisor", action: "Di-assign ke Budi Santoso", type: "assign" },
      { time: "15:10", actor: "Budi Santoso", action: "Mulai dikerjakan", type: "start" },
    ],
  },
  {
    id: "KJD-20250518-003",
    title: "CCTV offline area parkir B2",
    severity: "low",
    status: "pending_review",
    assignedAt: "08:30",
    submittedBy: "Sari Maulida",
    submittedAt: "07:55",
    location: "Area Parkir B2",
    notes: "CCTV di area parkir B2 sudah offline sejak kemarin malam. Perlu pengecekan kabel dan DVR.",
    originalPhotos: 1,
    activityLog: [
      { time: "07:55", actor: "Sari Maulida", action: "Laporan disubmit", type: "submit" },
      { time: "08:30", actor: "Supervisor", action: "Di-assign ke Budi Santoso", type: "assign" },
      { time: "10:40", actor: "Budi Santoso", action: "Laporan lapangan dikirim — hasil: Sudah diperbaiki", type: "field_submit" },
    ],
  },
];

const SEVERITY_CONFIG = {
  critical: { label: "KRITIS", color: "#FF2D55", bg: "#FF2D5518" },
  high:     { label: "TINGGI", color: "#FF6B00", bg: "#FF6B0018" },
  medium:   { label: "SEDANG", color: "#F5A623", bg: "#F5A62318" },
  low:      { label: "RENDAH", color: "#34C759", bg: "#34C75918" },
};

const STATUS_CONFIG = {
  assigned:       { label: "Belum Dimulai", color: "#FF9500", bg: "#FF950015" },
  on_progress:    { label: "Sedang Dikerjakan", color: "#007AFF", bg: "#007AFF15" },
  pending_review: { label: "Menunggu Review", color: "#AF52DE", bg: "#AF52DE15" },
  closed:         { label: "Selesai", color: "#34C759", bg: "#34C75915" },
};

const HASIL_OPTIONS = [
  "Sudah diperbaiki",
  "Perlu tindak lanjut",
  "Menunggu suku cadang",
  "Eskalasi ke pihak lain",
];

// ─── SCREEN: LIST ────────────────────────────────────────────────
function ListScreen({ tasks, onSelect }) {
  const active = tasks.filter(t => t.status !== "closed" && t.status !== "pending_review");
  const done   = tasks.filter(t => t.status === "pending_review" || t.status === "closed");

  const s = {
    root: { fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#0F0F13", minHeight: "100vh", color: "#F2F2F7", maxWidth: 430, margin: "0 auto" },
    header: { background: "#1A1A24", padding: "52px 20px 20px", borderBottom: "1px solid #2A2A3A" },
    headerTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    label: { fontSize: 11, color: "#636370", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 },
    name: { fontSize: 24, fontWeight: 700, letterSpacing: -0.3 },
    avatar: { width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#007AFF,#5856D6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" },
    summaryRow: { display: "flex", gap: 10, marginTop: 16 },
    summaryCard: (color) => ({ flex: 1, background: "#0F0F13", border: "1px solid #2A2A3A", borderRadius: 12, padding: "10px 12px" }),
    summaryNum: (color) => ({ fontSize: 22, fontWeight: 700, color }),
    summaryLabel: { fontSize: 10, color: "#636370", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 1 },
    body: { padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 20 },
    sectionTitle: { fontSize: 11, color: "#636370", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 },
    taskList: { display: "flex", flexDirection: "column", gap: 10 },
    card: (sev) => ({
      background: "#1A1A24",
      borderRadius: 14,
      padding: "14px 14px 14px 18px",
      border: `1px solid ${sev === "critical" ? "#FF2D5530" : sev === "high" ? "#FF6B0025" : "#2A2A3A"}`,
      cursor: "pointer",
      position: "relative",
      overflow: "hidden",
    }),
    accent: (sev) => ({
      position: "absolute", top: 0, left: 0, width: 3, height: "100%",
      background: SEVERITY_CONFIG[sev].color,
      borderRadius: "14px 0 0 14px",
    }),
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
    cardId: { fontSize: 10, color: "#636370", fontFamily: "monospace", fontWeight: 600, letterSpacing: 0.4 },
    sevBadge: (sev) => ({ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: SEVERITY_CONFIG[sev].color, background: SEVERITY_CONFIG[sev].bg, padding: "3px 8px", borderRadius: 6 }),
    cardTitle: { fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 8 },
    cardMeta: { display: "flex", gap: 12, marginBottom: 10 },
    metaItem: { fontSize: 11, color: "#8E8E9A", display: "flex", alignItems: "center", gap: 3 },
    cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #2A2A3A" },
    statusBadge: (st) => ({ fontSize: 11, fontWeight: 600, color: STATUS_CONFIG[st].color, background: STATUS_CONFIG[st].bg, padding: "4px 10px", borderRadius: 8 }),
    chevron: { fontSize: 14, color: "#3A3A4A" },
  };

  const TaskCard = ({ task }) => (
    <div style={s.card(task.severity)} onClick={() => onSelect(task)}>
      <div style={s.accent(task.severity)} />
      <div style={s.cardTop}>
        <span style={s.cardId}>{task.id}</span>
        <span style={s.sevBadge(task.severity)}>⬤ {SEVERITY_CONFIG[task.severity].label}</span>
      </div>
      <div style={s.cardTitle}>{task.title}</div>
      <div style={s.cardMeta}>
        <span style={s.metaItem}>📍 {task.location}</span>
        <span style={s.metaItem}>🕐 {task.assignedAt}</span>
      </div>
      <div style={s.cardFooter}>
        <span style={s.statusBadge(task.status)}>{STATUS_CONFIG[task.status].label}</span>
        <span style={s.chevron}>›</span>
      </div>
    </div>
  );

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.headerTop}>
          <div>
            <div style={s.label}>Tugas Lapangan</div>
            <div style={s.name}>Budi Santoso</div>
          </div>
          <div style={s.avatar}>BS</div>
        </div>
        <div style={s.summaryRow}>
          {[
            { num: tasks.filter(t => t.status === "assigned").length,       label: "Belum Dimulai", color: "#FF9500" },
            { num: tasks.filter(t => t.status === "on_progress").length,    label: "Dikerjakan",    color: "#007AFF" },
            { num: tasks.filter(t => t.status === "pending_review").length, label: "Menunggu Review", color: "#AF52DE" },
          ].map(item => (
            <div key={item.label} style={s.summaryCard(item.color)}>
              <div style={s.summaryNum(item.color)}>{item.num}</div>
              <div style={s.summaryLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={s.body}>
        {active.length > 0 && (
          <div>
            <div style={s.sectionTitle}>Aktif · {active.length}</div>
            <div style={s.taskList}>{active.map(t => <TaskCard key={t.id} task={t} />)}</div>
          </div>
        )}
        {done.length > 0 && (
          <div>
            <div style={s.sectionTitle}>Selesai / Review · {done.length}</div>
            <div style={s.taskList}>{done.map(t => <TaskCard key={t.id} task={t} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: DETAIL ──────────────────────────────────────────────
function DetailScreen({ task, onBack, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [fieldNotes, setFieldNotes] = useState("");
  const [hasil, setHasil] = useState("");
  const [photos, setPhotos] = useState([]);
  const [confirmModal, setConfirmModal] = useState(false);
  const fileRef = useRef();
  const sev = SEVERITY_CONFIG[task.severity];
  const canSubmit = fieldNotes.trim().length > 0 && hasil !== "";

  function handleStart() {
    const time = nowTime();
    onUpdate(task.id, {
      status: "on_progress",
      activityLog: [...task.activityLog, { time, actor: "Budi Santoso", action: "Mulai dikerjakan", type: "start" }],
    });
  }

  function handleSubmit() {
    const time = nowTime();
    onUpdate(task.id, {
      status: "pending_review",
      fieldReport: { notes: fieldNotes, hasil, photoCount: photos.length },
      activityLog: [...task.activityLog, { time, actor: "Budi Santoso", action: `Laporan lapangan dikirim — hasil: ${hasil}`, type: "field_submit" }],
    });
    setConfirmModal(false);
    setShowForm(false);
  }

  function handleAddPhoto(e) {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(f => ({ id: Date.now() + Math.random(), name: f.name, preview: URL.createObjectURL(f) }));
    setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
  }

  function nowTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  }

  const s = {
    root: { fontFamily: "'DM Sans','Helvetica Neue',sans-serif", background: "#0F0F13", minHeight: "100vh", color: "#F2F2F7", maxWidth: 430, margin: "0 auto" },
    header: { background: "#1A1A24", padding: "52px 20px 20px", borderBottom: "1px solid #2A2A3A", position: "sticky", top: 0, zIndex: 10 },
    back: { display: "flex", alignItems: "center", gap: 4, color: "#007AFF", fontSize: 14, cursor: "pointer", marginBottom: 14, background: "none", border: "none", padding: 0, fontFamily: "inherit" },
    idRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
    id: { fontSize: 11, color: "#636370", fontFamily: "monospace", fontWeight: 600 },
    title: { fontSize: 22, fontWeight: 700, letterSpacing: -0.3, marginBottom: 12, lineHeight: 1.2 },
    badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    sevBadge: { fontSize: 9, fontWeight: 700, letterSpacing: 1, color: sev.color, background: sev.bg, padding: "3px 8px", borderRadius: 6 },
    statusBadge: (st) => ({ fontSize: 11, fontWeight: 600, color: STATUS_CONFIG[st].color, background: STATUS_CONFIG[st].bg, padding: "4px 10px", borderRadius: 8 }),
    body: { padding: "18px 16px 160px", display: "flex", flexDirection: "column", gap: 14 },
    card: { background: "#1A1A24", borderRadius: 14, padding: 16, border: "1px solid #2A2A3A" },
    sLabel: { fontSize: 10, color: "#636370", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, marginBottom: 10 },
    infoRow: { display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 },
    infoKey: { fontSize: 12, color: "#8E8E9A", flex: "0 0 110px" },
    infoVal: { fontSize: 13, fontWeight: 500, textAlign: "right", flex: 1 },
    noteText: { fontSize: 13, color: "#C7C7CC", lineHeight: 1.6 },
    photoStrip: { display: "flex", gap: 8 },
    origPhoto: { width: 76, height: 76, borderRadius: 10, background: "#2A2A3A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 },
    logItem: { display: "flex", gap: 12, marginBottom: 14 },
    logDotWrap: { display: "flex", flexDirection: "column", alignItems: "center" },
    logDot: (type) => ({
      width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 3,
      background: type === "submit" ? "#007AFF" : type === "assign" ? "#FF9500" : type === "start" ? "#5856D6" : type === "field_submit" ? "#34C759" : "#636370",
    }),
    logLine: { width: 1, flex: 1, background: "#2A2A3A", minHeight: 16, marginTop: 4 },
    logActor: { fontSize: 12, fontWeight: 600, marginBottom: 1 },
    logAction: { fontSize: 12, color: "#8E8E9A" },
    logTime: { fontSize: 10, color: "#636370", marginTop: 2 },
    divider: { height: 1, background: "#2A2A3A", margin: "4px 0 16px" },
    formLabel: { fontSize: 11, color: "#8E8E9A", letterSpacing: 0.5, fontWeight: 600, textTransform: "uppercase", marginBottom: 8, display: "block" },
    textarea: { width: "100%", background: "#0F0F13", border: "1px solid #2A2A3A", borderRadius: 12, padding: 14, color: "#F2F2F7", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box", lineHeight: 1.6 },
    hasilOpt: (active) => ({ padding: "11px 14px", borderRadius: 10, cursor: "pointer", border: active ? "1px solid #007AFF" : "1px solid #2A2A3A", background: active ? "#007AFF15" : "#0F0F13", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#007AFF" : "#C7C7CC", transition: "all 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }),
    photoGrid: { display: "flex", gap: 8, flexWrap: "wrap" },
    photoThumbWrap: { position: "relative", width: 80, height: 80 },
    photoThumb: { width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "1px solid #2A2A3A" },
    photoRemove: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#FF2D55", border: "2px solid #0F0F13", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer", color: "#fff", fontWeight: 700 },
    addPhotoBtn: { width: 80, height: 80, borderRadius: 10, border: "1.5px dashed #2A2A3A", background: "#1A1A24", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 4 },
    photoHint: { fontSize: 11, color: "#636370", marginTop: 8 },
    actionBar: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "linear-gradient(180deg,transparent 0%,#0F0F13 28%)", padding: "20px 16px 36px" },
    btnPrimary: { width: "100%", padding: "16px 0", borderRadius: 14, background: "#007AFF", color: "#fff", border: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    btnDisabled: { width: "100%", padding: "16px 0", borderRadius: 14, background: "#1E1E2A", color: "#3A3A4A", border: "none", fontSize: 15, fontWeight: 700, cursor: "not-allowed", fontFamily: "inherit" },
    btnSuccess: { width: "100%", padding: "16px 0", borderRadius: 14, background: "#34C75920", color: "#34C759", border: "1px solid #34C75930", fontSize: 15, fontWeight: 700, cursor: "default", fontFamily: "inherit" },
    btnHint: { textAlign: "center", fontSize: 11, color: "#636370", marginTop: 8 },
    modalOverlay: { position: "fixed", inset: 0, background: "#00000085", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" },
    modalSheet: { background: "#1A1A24", borderRadius: "20px 20px 0 0", padding: "24px 20px 48px", width: "100%", maxWidth: 430, border: "1px solid #2A2A3A" },
    modalTitle: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
    modalSub: { fontSize: 13, color: "#8E8E9A", marginBottom: 20 },
    modalRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #2A2A3A", fontSize: 13 },
    btnGhost: { width: "100%", padding: "12px 0", borderRadius: 14, background: "transparent", color: "#636370", border: "none", fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 6 },
  };

  return (
    <div style={s.root}>
      <div style={s.header}>
        <button style={s.back} onClick={onBack}>← Semua Tugas</button>
        <div style={s.idRow}>
          <span style={s.id}>{task.id}</span>
          <span style={s.id}>📷 {task.originalPhotos} foto</span>
        </div>
        <div style={s.title}>{task.title}</div>
        <div style={s.badgeRow}>
          <span style={s.sevBadge}>⬤ {sev.label}</span>
          <span style={s.statusBadge(task.status)}>{STATUS_CONFIG[task.status].label}</span>
        </div>
      </div>

      <div style={s.body}>
        {/* Info */}
        <div style={s.card}>
          <div style={s.sLabel}>Informasi</div>
          {[["Dilaporkan oleh", task.submittedBy], ["Waktu lapor", `Hari ini, ${task.submittedAt}`], ["Di-assign", task.assignedAt], ["Lokasi", task.location]].map(([k, v]) => (
            <div key={k} style={s.infoRow}>
              <span style={s.infoKey}>{k}</span>
              <span style={s.infoVal}>{v}</span>
            </div>
          ))}
        </div>

        {/* Keterangan */}
        <div style={s.card}>
          <div style={s.sLabel}>Keterangan Asal</div>
          <p style={s.noteText}>{task.notes}</p>
        </div>

        {/* Foto asal */}
        <div style={s.card}>
          <div style={s.sLabel}>Foto dari Pelapor ({task.originalPhotos})</div>
          <div style={s.photoStrip}>
            {Array.from({ length: task.originalPhotos }).map((_, i) => (
              <div key={i} style={s.origPhoto}>🖼</div>
            ))}
          </div>
        </div>

        {/* Form Lapangan — muncul setelah on_progress */}
        {(showForm || task.status === "on_progress") && task.status !== "pending_review" && (
          <div style={s.card}>
            <div style={s.sLabel}>Laporan Lapangan</div>
            <div style={s.divider} />
            <label style={s.formLabel}>Keterangan Tindakan *</label>
            <textarea style={s.textarea} rows={5} placeholder="Jelaskan kondisi yang ditemukan dan tindakan yang sudah dilakukan..." value={fieldNotes} onChange={e => setFieldNotes(e.target.value)} />
            <div style={{ height: 16 }} />
            <label style={s.formLabel}>Hasil Tindakan *</label>
            {HASIL_OPTIONS.map(opt => (
              <div key={opt} style={s.hasilOpt(hasil === opt)} onClick={() => setHasil(opt)}>
                <span>{opt}</span>
                {hasil === opt && <span>✓</span>}
              </div>
            ))}
            <div style={{ height: 8 }} />
            <label style={s.formLabel}>Foto Lapangan ({photos.length}/5)</label>
            <div style={s.photoGrid}>
              {photos.map(p => (
                <div key={p.id} style={s.photoThumbWrap}>
                  <img src={p.preview} style={s.photoThumb} alt={p.name} />
                  <div style={s.photoRemove} onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))}>✕</div>
                </div>
              ))}
              {photos.length < 5 && (
                <div style={s.addPhotoBtn} onClick={() => fileRef.current?.click()}>
                  <span style={{ fontSize: 22, color: "#636370" }}>+</span>
                  <span style={{ fontSize: 9, color: "#636370", fontWeight: 600 }}>FOTO</span>
                </div>
              )}
            </div>
            {photos.length === 0 && <div style={s.photoHint}>Opsional — disarankan sertakan bukti foto</div>}
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleAddPhoto} />
          </div>
        )}

        {/* Laporan sudah dikirim */}
        {task.status === "pending_review" && task.fieldReport && (
          <div style={{ ...s.card, borderColor: "#AF52DE30" }}>
            <div style={s.sLabel}>Laporan Lapangan Terkirim</div>
            {[["Hasil", task.fieldReport.hasil], ["Foto dikirim", `${task.fieldReport.photoCount} foto`]].map(([k, v]) => (
              <div key={k} style={s.infoRow}>
                <span style={s.infoKey}>{k}</span>
                <span style={s.infoVal}>{v}</span>
              </div>
            ))}
            <div style={{ ...s.noteText, marginTop: 8 }}>{task.fieldReport.notes}</div>
          </div>
        )}

        {/* Activity log */}
        <div style={s.card}>
          <div style={s.sLabel}>Riwayat Aktivitas</div>
          {task.activityLog.map((log, i) => (
            <div key={i} style={s.logItem}>
              <div style={s.logDotWrap}>
                <div style={s.logDot(log.type)} />
                {i < task.activityLog.length - 1 && <div style={s.logLine} />}
              </div>
              <div>
                <div style={s.logActor}>{log.actor}</div>
                <div style={s.logAction}>{log.action}</div>
                <div style={s.logTime}>{log.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTION BAR */}
      <div style={s.actionBar}>
        {task.status === "assigned" && (
          <>
            <button style={s.btnPrimary} onClick={handleStart}>Mulai Kerjakan</button>
            <div style={s.btnHint}>Tap untuk mengkonfirmasi Anda sudah di lokasi</div>
          </>
        )}
        {task.status === "on_progress" && (
          <>
            <button style={canSubmit ? s.btnPrimary : s.btnDisabled} onClick={() => canSubmit && setConfirmModal(true)}>
              Kirim Laporan Lapangan
            </button>
            {!canSubmit && <div style={s.btnHint}>{!fieldNotes.trim() ? "Isi keterangan tindakan terlebih dahulu" : "Pilih hasil tindakan"}</div>}
          </>
        )}
        {task.status === "pending_review" && (
          <button style={s.btnSuccess}>✓ Laporan Terkirim — Menunggu Review</button>
        )}
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div style={s.modalOverlay} onClick={() => setConfirmModal(false)}>
          <div style={s.modalSheet} onClick={e => e.stopPropagation()}>
            <div style={s.modalTitle}>Kirim Laporan?</div>
            <div style={s.modalSub}>Pastikan semua informasi sudah benar sebelum dikirim ke supervisor.</div>
            {[["ID Tugas", task.id], ["Hasil tindakan", hasil], ["Foto lapangan", `${photos.length} foto`], ["Keterangan", fieldNotes.length > 50 ? fieldNotes.slice(0,50)+"..." : fieldNotes]].map(([k, v]) => (
              <div key={k} style={s.modalRow}>
                <span style={{ color: "#8E8E9A" }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <button style={{ ...s.btnPrimary, marginTop: 20 }} onClick={handleSubmit}>Ya, Kirim Sekarang</button>
            <button style={s.btnGhost} onClick={() => setConfirmModal(false)}>Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState(TASKS);
  const [selected, setSelected] = useState(null);

  function handleUpdate(id, changes) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    setSelected(prev => prev?.id === id ? { ...prev, ...changes } : prev);
  }

  if (selected) {
    const live = tasks.find(t => t.id === selected.id);
    return <DetailScreen task={live} onBack={() => setSelected(null)} onUpdate={handleUpdate} />;
  }
  return <ListScreen tasks={tasks} onSelect={setSelected} />;
}
