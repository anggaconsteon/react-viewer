import React, { useState, useRef } from 'react';

/* ============================================================
   Fate — sisi ops (mobile console)
   Bikin project, assign model (identity-bound), monitor via
   anomali, konfirmasi selisih atas nama brand, dan KOREKSI JAM.

   Koreksi jam (peran supervisor-override §15, di tangan Fate):
   - Fakta mentah (dilaporkan model + selfie) TERKUNCI, tak dihapus.
   - Koreksi Fate = LAPISAN di atasnya, berjejak. Bila beda, dua-
     duanya ditampilkan. Selisih dihitung dari jam EFEKTIF.
   - Label jujur: tanpa geofence, selfie = "dilaporkan model",
     bukan "terbukti hadir di venue".
   ============================================================ */

const C = {
  brand: '#1D9E75', brandDark: '#17835F', brandSoft: '#E7F5EF',
  ink: '#16181A', inkSoft: '#5B6166', muted: '#9AA0A6',
  line: '#E8EAEC', bg: '#F5F6F6', card: '#FFFFFF',
  amber: '#C9822A', amberSoft: '#FBF1E3', red: '#C0492F', redSoft: '#FBECE8',
  blue: '#3B7DD8', blueSoft: '#EAF1FB', violet: '#7A5AF0', violetSoft: '#EFEBFD',
};
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const BRANDS = ['Aveda Skincare', 'Nara Coffee', 'Bloom Jewelry', 'Loka Fashion', 'Sana Beauty', 'Lume Studio', 'Kopi Kina'];
const MODEL_ROSTER = [
  'Kirana', 'Dara', 'Sasha', 'Nadia', 'Ayu', 'Rani', 'Tari', 'Vina', 'Alya', 'Bella',
  'Citra', 'Dinda', 'Elsa', 'Fira', 'Gita', 'Hana', 'Indah', 'Jihan', 'Kayla', 'Lina',
  'Maya', 'Nabila', 'Olivia', 'Puti', 'Qori', 'Rara', 'Salsa', 'Tiara', 'Uli', 'Vera',
  'Wulan', 'Xena', 'Yuni', 'Zahra', 'Anggun', 'Bunga', 'Chelsea', 'Della', 'Erika', 'Farah', 'Gina',
]; // 41 model kontrak Fate

/* ---------- seed ----------
   model: phase | arrival | completion (raw, dilaporkan model)
          arrivalCorr | completionCorr = { time, reason, at }  (lapisan Fate)
          selisihStatus = null | 'confirmed' | 'disputed'
*/
const SEED = [
  {
    id: 'j1', brand: 'Nara Coffee', title: 'Product Video — Cold Brew',
    venue: 'Rooftop Senayan', date: 'Hari ini', start: '08:00', end: '12:00', endedPast: true,
    models: [
      { name: 'Sasha', phase: 'present', arrival: '07:55', completion: null }, // lupa lapor pulang
      { name: 'Dara', phase: 'closed', arrival: '07:58', completion: '12:02' },
    ],
  },
  {
    id: 'j6', brand: 'Lume Studio', title: 'Beauty Reel — Glow Series',
    venue: 'Studio Lume, Cilandak', date: 'Hari ini', start: '10:00', end: '17:00', endedPast: true,
    models: [
      // lapor selesai 22:10 dari rumah -> selisih palsu 5j10m, perlu koreksi
      { name: 'Ayu', phase: 'awaiting', arrival: '09:52', completion: '22:10' },
    ],
  },
  {
    id: 'j7', brand: 'Kopi Kina', title: 'Menu Shoot — Signature',
    venue: 'Kina Roastery, Fatmawati', date: 'Hari ini', start: '09:00', end: '13:00', endedPast: true,
    models: [
      { name: 'Rani', phase: 'scheduled', arrival: null, completion: null }, // no-show: tak hadir sampai jadwal lewat
    ],
  },
  {
    id: 'j2', brand: 'Bloom Jewelry', title: 'Editorial — Fine Line',
    venue: 'Studio Nine, SCBD', date: 'Kemarin', start: '11:00', end: '19:00',
    models: [
      { name: 'Kirana', phase: 'awaiting', arrival: '10:48', completion: '20:35' }, // overtime asli
      { name: 'Rani', phase: 'closed', arrival: '10:52', completion: '19:03' },
    ],
  },
  {
    id: 'j3', brand: 'Loka Fashion', title: 'Lookbook — Resort 26',
    venue: 'Villa Cipete', date: 'Besok', start: '10:00', end: '16:00', soon: true,
    models: [
      { name: 'Nadia', phase: 'assigned', arrival: null, completion: null },
      { name: 'Ayu', phase: 'scheduled', arrival: null, completion: null },
    ],
  },
  {
    id: 'j4', brand: 'Aveda Skincare', title: 'Campaign Shoot — Serum Line',
    venue: 'Studio Kolektif, Kemang', date: 'Hari ini', start: '09:00', end: '17:00',
    models: [
      { name: 'Tari', phase: 'present', arrival: '08:50', completion: null },
      { name: 'Vina', phase: 'present', arrival: '08:52', completion: null },
    ],
  },
  {
    id: 'j5', brand: 'Sana Beauty', title: 'Social Content Day',
    venue: 'Studio Kolektif, Kemang', date: '29 Jun', start: '09:00', end: '15:00',
    models: [
      { name: 'Kirana', phase: 'closed', arrival: '08:55', completion: '15:04', selisihStatus: 'confirmed', confirmedAt: '16:20' },
    ],
  },
];

/* ---------- helpers ---------- */
function hm(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fmtDiff(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}
function stampNow() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
}
// jam efektif = koreksi Fate bila ada, else raw dilaporkan model
const effArr = (m) => (m.arrivalCorr ? m.arrivalCorr.time : m.arrival);
const effComp = (m) => (m.completionCorr ? m.completionCorr.time : m.completion);
function selisih(m, proj) {
  const c = effComp(m);
  if (!c) return 0;
  const d = hm(c) - hm(proj.end);
  return d > 0 ? d : 0;
}
const compIsFateSet = (m) => !!m.completionCorr;

function collectAttention(projects) {
  const items = [];
  projects.forEach((p) => {
    p.models.forEach((m) => {
      if (m.phase === 'awaiting') {
        items.push({ kind: 'selisih', p, m, weight: 0, text: `Selisih ${fmtDiff(selisih(m, p))} menunggu konfirmasi brand` });
      } else if (['assigned', 'scheduled'].includes(m.phase) && p.endedPast && !m.arrival) {
        items.push({ kind: 'noshow', p, m, weight: 1, text: `Tak hadir sampai jadwal lewat ${p.end}` });
      } else if (m.phase === 'present' && p.endedPast) {
        items.push({ kind: 'nolapor', p, m, weight: 1, text: `Hadir tapi belum lapor selesai · jadwal lewat ${p.end}` });
      } else if (m.phase === 'assigned' && p.soon) {
        items.push({ kind: 'belumack', p, m, weight: 2, text: `Belum konfirmasi keikutsertaan · jadwal ${p.date}` });
      }
    });
  });
  return items.sort((a, b) => a.weight - b.weight);
}
function ATTN_STYLE(kind) {
  if (kind === 'selisih') return { bg: C.amberSoft, fg: C.amber, icon: '\u23F1' };
  if (kind === 'nolapor') return { bg: C.redSoft, fg: C.red, icon: '\u26A0' };
  if (kind === 'noshow') return { bg: C.redSoft, fg: C.red, icon: '\u2205' };
  return { bg: C.blueSoft, fg: C.blue, icon: '\u25F7' };
}

/* ============================================================ KOKPIT */
function ScreenKokpit({ projects, onOpen, onNew }) {
  const attn = collectAttention(projects);
  const activeCount = projects.filter((p) => p.models.some((m) => m.phase !== 'closed' && m.phase !== 'noshow')).length;
  return (
    <div>
      <div style={{ padding: '22px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>Fate Agency</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5, marginTop: 2 }}>Kokpit</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3, fontWeight: 500 }}>{activeCount} project aktif</div>
        </div>
        <button onClick={onNew} style={{ background: C.ink, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 15px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Project</button>
      </div>

      {attn.length > 0 && (
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 4px 10px' }}>Perlu perhatian</div>
          {attn.map((a, i) => {
            const s = ATTN_STYLE(a.kind);
            return (
              <button key={i} onClick={() => onOpen(a.p.id)} style={{ width: '100%', textAlign: 'left', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start', fontFamily: FONT }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: s.bg, color: s.fg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{s.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>{a.m.name} · <span style={{ color: C.inkSoft, fontWeight: 600 }}>{a.p.brand}</span></div>
                  <div style={{ fontSize: 12.5, color: s.fg, fontWeight: 600, marginTop: 3 }}>{a.text}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ padding: '16px 16px 30px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 4px 10px' }}>Semua project</div>
        {projects.map((p) => {
          const done = p.models.every((m) => m.phase === 'closed');
          return (
            <button key={p.id} onClick={() => onOpen(p.id)} style={{ width: '100%', textAlign: 'left', background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer', opacity: done ? 0.65 : 1, display: 'block', fontFamily: FONT }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: 0.3 }}>{p.brand}</div>
                <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>{p.date}</div>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, marginTop: 3 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 8, fontWeight: 500 }}>{p.models.length} model · {p.venue}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================ MAP PICKER
   Mockup: peta distilir, tapi interaksi nyata — geser peta di bawah
   pin tetap (ala ride-hailing), koordinat update live. Di produksi
   background diganti peta asli (Google/Mapbox). Nyimpen lat/lng =
   cikal bakal geofence.
   ============================================================ */
function MapPicker({ initialName, initialGeo, onConfirm, onCancel }) {
  const [name, setName] = useState(initialName || '');
  const BASE = initialGeo || { lat: -6.2615, lng: 106.8106 }; // Jakarta default
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const last = useRef(null);
  const [dragging, setDragging] = useState(false);

  // koordinat efektif dari geseran (mock: 1px ≈ 0.00001°)
  const lat = (BASE.lat - pan.y * 0.00001).toFixed(5);
  const lng = (BASE.lng + pan.x * 0.00001).toFixed(5);

  function down(e) { last.current = { x: e.clientX, y: e.clientY }; setDragging(true); if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId); }
  function move(e) { if (!last.current) return; const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y; last.current = { x: e.clientX, y: e.clientY }; setPan((p) => ({ x: p.x + dx, y: p.y + dy })); }
  function up() { last.current = null; setDragging(false); }

  const canSave = name.trim().length > 0;

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.card, zIndex: 60, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* header + search */}
      <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${C.line}`, background: C.card, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onCancel} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, fontSize: 18, cursor: 'pointer', color: C.ink, fontFamily: FONT, flexShrink: 0 }}>‹</button>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Cari / nama venue (mis. Studio Kolektif)"
            style={{ flex: 1, padding: '11px 13px', borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none' }} />
        </div>
      </div>

      {/* map area */}
      <div
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        style={{ position: 'relative', flex: 1, overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab', background: '#EAECEA', touchAction: 'none' }}
      >
        {/* mock map canvas, digeser oleh pan */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          width: 1400, height: 1400, marginLeft: -700, marginTop: -700,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          backgroundColor: '#E4E7E3',
          backgroundImage:
            'linear-gradient(#D3D8D2 1px, transparent 1px), linear-gradient(90deg, #D3D8D2 1px, transparent 1px),' +
            'linear-gradient(#C7CEC6 2px, transparent 2px), linear-gradient(90deg, #C7CEC6 2px, transparent 2px)',
          backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px',
        }}>
          {/* beberapa blok "taman" & "jalan" biar terasa peta */}
          <div style={{ position: 'absolute', left: 560, top: 500, width: 180, height: 120, background: '#CFE3D2', borderRadius: 6 }} />
          <div style={{ position: 'absolute', left: 760, top: 640, width: 120, height: 200, background: '#CFE3D2', borderRadius: 6 }} />
          <div style={{ position: 'absolute', left: 300, top: 700, width: 260, height: 90, background: '#DBE0F0', borderRadius: 6 }} />
          <div style={{ position: 'absolute', left: 0, top: 690, width: 1400, height: 16, background: '#F2F0E8' }} />
          <div style={{ position: 'absolute', left: 690, top: 0, width: 16, height: 1400, background: '#F2F0E8' }} />
        </div>

        {/* pin tetap di tengah */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50% 50% 50% 0', background: C.brand, transform: 'rotate(-45deg)', boxShadow: '0 3px 8px rgba(0,0,0,0.3)', border: '2px solid #fff' }} />
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 4, marginLeft: -4, marginTop: 2, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />

        {/* hint */}
        <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(22,24,26,0.82)', color: '#fff', fontSize: 11.5, fontWeight: 600, padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          Geser peta untuk tempatkan pin
        </div>
      </div>

      {/* koordinat + confirm */}
      <div style={{ padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.line}`, background: C.card }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: C.brand, fontWeight: 800 }}>📍</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>
            {name.trim() || 'Venue belum dinamai'} · <span style={{ color: C.muted, fontWeight: 500 }}>{lat}, {lng}</span>
          </div>
        </div>
        <button onClick={() => canSave && onConfirm({ name: name.trim(), lat: Number(lat), lng: Number(lng) })} disabled={!canSave}
          style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', fontFamily: FONT, background: canSave ? C.brand : C.bg, color: canSave ? '#fff' : C.muted, fontSize: 16, fontWeight: 800, cursor: canSave ? 'pointer' : 'default' }}>
          Gunakan lokasi ini
        </button>
      </div>
    </div>
  );
}


/* ============================================================ BRAND PICKER */
function BrandPicker({ brands, selected, onPick, onAddBrand, onClose }) {
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const filtered = brands.filter((b) => b.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,18,20,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 60, fontFamily: FONT }}>
      <div style={{ background: C.card, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 18px 22px', maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 16px' }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, marginBottom: 12 }}>Pilih brand</div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari brand…"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none', marginBottom: 12 }} />
        <div style={{ overflowY: 'auto', flex: 1, marginBottom: 8 }}>
          {filtered.map((b) => (
            <button key={b} onClick={() => onPick(b)} style={{ width: '100%', textAlign: 'left', padding: '13px 14px', borderRadius: 12, marginBottom: 6, cursor: 'pointer', fontFamily: FONT, fontSize: 15, fontWeight: 700, border: `1px solid ${selected === b ? C.brand : C.line}`, background: selected === b ? C.brandSoft : C.card, color: selected === b ? C.brandDark : C.ink }}>
              {selected === b ? '✓ ' : ''}{b}
            </button>
          ))}
          {filtered.length === 0 && <div style={{ fontSize: 13, color: C.muted, padding: '8px 4px' }}>Tak ada brand cocok. Tambah baru di bawah.</div>}
        </div>
        {adding ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama brand baru" autoFocus
              style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.brand}`, fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none' }} />
            <button onClick={() => newName.trim() && onAddBrand(newName.trim())} style={{ padding: '0 16px', borderRadius: 12, border: 'none', background: C.brand, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Simpan</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ width: '100%', padding: 13, borderRadius: 12, border: `1px dashed ${C.line}`, background: C.card, color: C.brand, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            + Tambah brand baru
          </button>
        )}
        <button onClick={onClose} style={{ marginTop: 10, width: '100%', padding: 11, borderRadius: 12, border: 'none', background: 'transparent', color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Tutup</button>
      </div>
    </div>
  );
}

/* ============================================================ MODEL PICKER (searchable multi-select) */
function ModelPicker({ roster, externals, selected, onToggle, onAddExternal, onDone }) {
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const all = [...roster, ...externals];
  const filtered = all.filter((n) => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,18,20,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 60, fontFamily: FONT }}>
      <div style={{ background: C.card, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 18px 20px', height: '86%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Assign model</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>{selected.length} dipilih</div>
        </div>

        {selected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '12px 0 4px' }}>
            {selected.map((n) => {
              const luar = externals.includes(n);
              return (
                <button key={n} onClick={() => onToggle(n)} style={{ padding: '6px 10px', borderRadius: 999, border: 'none', background: C.brandSoft, color: C.brandDark, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  {n}{luar ? ' · luar' : ''} ✕
                </button>
              );
            })}
          </div>
        )}

        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari model…"
          style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none', margin: '10px 0 10px' }} />

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.map((n) => {
            const on = selected.includes(n);
            const luar = externals.includes(n);
            return (
              <button key={n} onClick={() => onToggle(n)} style={{ width: '100%', textAlign: 'left', padding: '11px 13px', borderRadius: 10, marginBottom: 5, cursor: 'pointer', fontFamily: FONT, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${on ? C.brand : C.line}`, background: on ? C.brandSoft : C.card }}>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: on ? C.brandDark : C.ink }}>{n}{luar ? <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}> · dari luar</span> : ''}</span>
                <span style={{ fontSize: 14, color: on ? C.brand : C.muted, fontWeight: 800 }}>{on ? '✓' : '+'}</span>
              </button>
            );
          })}
          {filtered.length === 0 && <div style={{ fontSize: 13, color: C.muted, padding: '8px 4px' }}>Tak ada di roster. Tambah model dari luar di bawah.</div>}
        </div>

        {adding ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nama model dari luar" autoFocus
              style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: `1px solid ${C.brand}`, fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none' }} />
            <button onClick={() => { if (newName.trim()) { onAddExternal(newName.trim()); setNewName(''); setAdding(false); } }} style={{ padding: '0 16px', borderRadius: 12, border: 'none', background: C.brand, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Tambah</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ marginTop: 8, width: '100%', padding: 12, borderRadius: 12, border: `1px dashed ${C.line}`, background: C.card, color: C.brand, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            + Model dari luar <span style={{ color: C.muted, fontWeight: 500 }}>· cabutan atas request brand</span>
          </button>
        )}
        <button onClick={onDone} style={{ marginTop: 10, width: '100%', padding: 15, borderRadius: 14, border: 'none', background: C.ink, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>Selesai</button>
      </div>
    </div>
  );
}

function ScreenNew({ onBack, onCreate }) {
  const [brand, setBrand] = useState(''); const [brandList, setBrandList] = useState(BRANDS); const [showBrand, setShowBrand] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState(''); const [venueGeo, setVenueGeo] = useState(null); const [showMap, setShowMap] = useState(false);
  const [date, setDate] = useState(''); const [start, setStart] = useState(''); const [end, setEnd] = useState('');
  const [picked, setPicked] = useState([]); const [externals, setExternals] = useState([]); const [showModels, setShowModels] = useState(false);
  const valid = brand && title && venue && date && start && end && picked.length > 0;
  const field = (label, val, set, ph) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>{label}</div>
      <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 15, color: C.ink, fontFamily: FONT, background: C.card, outline: 'none' }} />
    </div>
  );
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 4px' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, fontSize: 18, cursor: 'pointer', color: C.ink, fontFamily: FONT }}>‹</button>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Project baru</div>
      </div>
      <div style={{ padding: '14px 20px 20px', flex: 1 }}>
        {/* brand: pilih dari data, bukan ketik bebas */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>Brand</div>
          <button onClick={() => setShowBrand(true)} style={{ width: '100%', textAlign: 'left', padding: '13px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT, border: `1px solid ${brand ? C.line : C.line}`, background: C.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: brand ? 700 : 500, color: brand ? C.ink : C.muted }}>{brand || 'Pilih brand'}</span>
            <span style={{ fontSize: 13, color: C.inkSoft }}>▾</span>
          </button>
        </div>
        {field('Judul project', title, setTitle, 'mis. Campaign Shoot')}

        {/* venue: nama wajib, titik peta opsional (bisa nyusul) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>Venue</div>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="mis. Studio Kolektif, Kemang"
            style={{ width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 15, color: C.ink, fontFamily: FONT, background: C.card, outline: 'none' }} />
          {venueGeo ? (
            <button onClick={() => setShowMap(true)} style={{ marginTop: 8, width: '100%', textAlign: 'left', padding: '11px 13px', borderRadius: 12, border: `1px solid ${C.brand}`, background: C.brandSoft, cursor: 'pointer', fontFamily: FONT }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 12.5, color: C.brandDark, fontWeight: 700 }}>📍 Titik diset · {venueGeo.lat}, {venueGeo.lng}</div>
                <span style={{ fontSize: 12, color: C.brandDark, fontWeight: 700, flexShrink: 0 }}>Ubah</span>
              </div>
            </button>
          ) : (
            <button onClick={() => setShowMap(true)} style={{ marginTop: 8, width: '100%', padding: '11px 13px', borderRadius: 12, border: `1px dashed ${C.line}`, background: C.card, cursor: 'pointer', fontFamily: FONT, color: C.inkSoft, fontSize: 13.5, fontWeight: 700, textAlign: 'left' }}>
              📍 Set titik di peta <span style={{ color: C.muted, fontWeight: 500 }}>· opsional, bisa nyusul</span>
            </button>
          )}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>
            Belum tahu titik persisnya? Isi nama saja. Titik bisa diset nanti — lebih baik kosong daripada koordinat ngawur.
          </div>
        </div>

        {field('Tanggal', date, setDate, 'mis. 5 Jul')}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>{field('Mulai', start, setStart, '09:00')}</div>
          <div style={{ flex: 1 }}>{field('Selesai', end, setEnd, '17:00')}</div>
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, margin: '4px 0 8px' }}>
          Assign model <span style={{ color: C.muted, fontWeight: 500 }}>· yang dipilih harus dia yang kerja</span>
        </div>
        <button onClick={() => setShowModels(true)} style={{ width: '100%', textAlign: 'left', padding: '13px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT, border: `1px solid ${C.line}`, background: C.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: picked.length ? 700 : 500, color: picked.length ? C.ink : C.muted }}>
            {picked.length ? `${picked.length} model dipilih` : 'Cari & pilih model'}
          </span>
          <span style={{ fontSize: 13, color: C.inkSoft }}>▾</span>
        </button>
        {picked.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {picked.map((n) => (
              <span key={n} style={{ padding: '5px 10px', borderRadius: 999, background: C.brandSoft, color: C.brandDark, fontSize: 12, fontWeight: 700 }}>
                {n}{externals.includes(n) ? ' · luar' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.line}`, background: C.card }}>
        <button onClick={() => valid && onCreate({ brand, title, venue, venueGeo, date, start, end, models: picked })} disabled={!valid} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', fontFamily: FONT, background: valid ? C.brand : C.bg, color: valid ? '#fff' : C.muted, fontSize: 16, fontWeight: 800, cursor: valid ? 'pointer' : 'default' }}>
          Buat & kirim ke model
        </button>
      </div>

      {showMap && (
        <MapPicker initialName={venue} initialGeo={venueGeo}
          onConfirm={(v) => { setVenue(v.name); setVenueGeo({ lat: v.lat, lng: v.lng }); setShowMap(false); }}
          onCancel={() => setShowMap(false)} />
      )}
      {showBrand && (
        <BrandPicker brands={brandList} selected={brand}
          onPick={(b) => { setBrand(b); setShowBrand(false); }}
          onAddBrand={(b) => { setBrandList((prev) => prev.includes(b) ? prev : [b, ...prev]); setBrand(b); setShowBrand(false); }}
          onClose={() => setShowBrand(false)} />
      )}
      {showModels && (
        <ModelPicker roster={MODEL_ROSTER} externals={externals} selected={picked}
          onToggle={(n) => setPicked((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n])}
          onAddExternal={(n) => { setExternals((prev) => prev.includes(n) ? prev : [...prev, n]); setPicked((prev) => prev.includes(n) ? prev : [...prev, n]); }}
          onDone={() => setShowModels(false)} />
      )}
    </div>
  );
}

/* ---------- presence line (jujur: raw + koreksi berlapis) ---------- */
function PresenceLine({ label, raw, corr, scheduleNote }) {
  const eff = corr ? corr.time : raw;
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      {!raw && !corr && (
        <div style={{ fontSize: 14, color: C.muted, fontWeight: 600, marginTop: 3 }}>Belum dilaporkan</div>
      )}
      {raw && (
        <div style={{ fontSize: 13, marginTop: 3, color: corr ? C.muted : C.ink, fontWeight: corr ? 500 : 700, textDecoration: corr ? 'line-through' : 'none' }}>
          Dilaporkan model {raw} · selfie
        </div>
      )}
      {corr && (
        <div style={{ marginTop: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: C.violet }}>Efektif {corr.time}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.violet, background: C.violetSoft, padding: '2px 7px', borderRadius: 999, marginLeft: 7 }}>ditetapkan Fate</span>
        </div>
      )}
      {corr && corr.reason && (
        <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{corr.reason} · {corr.at}</div>
      )}
      {scheduleNote && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{scheduleNote}</div>}
    </div>
  );
}

/* ============================================================ DETAIL */
function modelBadge(m) {
  switch (m.phase) {
    case 'assigned': return { t: 'Belum konfirmasi', bg: C.blueSoft, fg: C.blue };
    case 'scheduled': return { t: 'Terjadwal', bg: C.bg, fg: C.inkSoft };
    case 'present': return { t: 'Sedang berjalan', bg: C.brandSoft, fg: C.brandDark };
    case 'awaiting': return { t: 'Selisih menunggu', bg: C.amberSoft, fg: C.amber };
    case 'closed': return { t: 'Selesai', bg: C.bg, fg: C.muted };
    case 'noshow': return { t: m.noshowStatus === 'batal' ? 'Batal' : 'Tidak hadir', bg: C.redSoft, fg: C.red };
    default: return { t: '—', bg: C.bg, fg: C.muted };
  }
}
function ScreenDetail({ project, onBack, onConfirmSelisih, onKoreksi, onNoShow, onSetVenueGeo }) {
  const p = project;
  const [showMap, setShowMap] = useState(false);
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 4px' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, fontSize: 18, cursor: 'pointer', color: C.ink, fontFamily: FONT }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.inkSoft }}>Detail project</div>
      </div>
      <div style={{ padding: '10px 20px 24px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: 0.4 }}>{p.brand}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginTop: 4, letterSpacing: -0.4, lineHeight: 1.2 }}>{p.title}</div>
        <div style={{ marginTop: 14, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <KV k="Venue" v={p.venue} /><KV k="Tanggal" v={p.date} /><KV k="Jadwal" v={`${p.start} – ${p.end}`} />
          <div style={{ height: 1, background: C.line, margin: '2px 0' }} />
          {p.venueGeo ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: C.brandDark, fontWeight: 700 }}>📍 Titik diset · {p.venueGeo.lat}, {p.venueGeo.lng}</span>
              <button onClick={() => setShowMap(true)} style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>Ubah</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>Titik peta belum diset</span>
              <button onClick={() => setShowMap(true)} style={{ fontSize: 12.5, color: C.brand, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT }}>Set titik</button>
            </div>
          )}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: '22px 0 12px' }}>Model ({p.models.length})</div>

        {p.models.map((m, i) => {
          const b = modelBadge(m);
          const sMins = selisih(m, p);
          const hasHadir = ['present', 'awaiting', 'closed'].includes(m.phase);
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 15, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{m.name}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: b.fg, background: b.bg, padding: '5px 9px', borderRadius: 999 }}>{b.t}</span>
              </div>

              <div style={{ marginTop: 13, display: 'flex', gap: 24 }}>
                <div style={{ flex: 1 }}><PresenceLine label="Hadir" raw={m.arrival} corr={m.arrivalCorr} /></div>
                <div style={{ flex: 1 }}><PresenceLine label="Selesai" raw={m.completion} corr={m.completionCorr} /></div>
              </div>

              {sMins > 0 && (
                <div style={{ marginTop: 13, background: C.amberSoft, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.amber }}>Selesai {fmtDiff(sMins)} lewat jadwal</div>
                  <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>
                    Jadwal {p.end}, efektif {effComp(m)}. {compIsFateSet(m) ? 'Jam dasar ditetapkan Fate.' : 'Fakta terkunci — belum dihitung lembur.'}
                  </div>
                </div>
              )}

              {m.selisihStatus === 'confirmed' && (
                <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.brandDark }}>✓ Dikonfirmasi brand · via Fate {m.confirmedAt}</div>
              )}
              {m.selisihStatus === 'disputed' && (
                <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.red }}>Brand keberatan atas selisih · via Fate {m.confirmedAt}</div>
              )}
              {m.phase === 'noshow' && (
                <div style={{ marginTop: 12, background: C.redSoft, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.red }}>
                    {m.noshowStatus === 'batal' ? 'Project dibatalkan' : 'Ditandai tidak hadir'} · dicatat Fate {m.noshowAt}
                  </div>
                  {m.noshowNote && <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>{m.noshowNote}</div>}
                </div>
              )}

              {/* aksi */}
              {m.phase === 'awaiting' && (
                <button onClick={() => onConfirmSelisih(m.name)} style={{ marginTop: 13, width: '100%', padding: 13, borderRadius: 12, border: 'none', background: C.ink, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  Proses selisih atas nama brand
                </button>
              )}
              {hasHadir && (
                <button onClick={() => onKoreksi(m.name)} style={{ marginTop: 9, width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                  Koreksi jam
                </button>
              )}
              {['assigned', 'scheduled'].includes(m.phase) && (
                <div style={{ marginTop: 11 }}>
                  <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>
                    Tak ada jejak hadir. Kamu yang tahu situasinya:
                  </div>
                  <button onClick={() => onKoreksi(m.name)} style={{ width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${C.violet}`, background: C.violetSoft, color: C.violet, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, marginBottom: 8 }}>
                    Sebenarnya hadir — koreksi jam
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => onNoShow(m.name, 'tidak_hadir')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.red, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                      Tidak hadir
                    </button>
                    <button onClick={() => onNoShow(m.name, 'batal')} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showMap && (
        <MapPicker initialName={p.venue} initialGeo={p.venueGeo}
          onConfirm={(v) => { onSetVenueGeo({ lat: v.lat, lng: v.lng }); setShowMap(false); }}
          onCancel={() => setShowMap(false)} />
      )}
    </div>
  );
}
function KV({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{k}</span>
      <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

/* ============================================================ KOREKSI JAM */
function KoreksiSection({ label, raw, corr, time, setTime, reason, setReason, changed }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>

      {/* fakta mentah terkunci */}
      <div style={{ marginTop: 8, background: C.bg, borderRadius: 10, padding: '9px 11px' }}>
        {raw ? (
          <div style={{ fontSize: 12.5, color: C.inkSoft }}>
            <span style={{ fontWeight: 700, color: C.ink }}>Dilaporkan model {raw}</span> · selfie
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>Belum ada laporan model</div>
        )}
        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3 }}>
          Terkunci · tak bisa dihapus. Tanpa geofence, selfie ≠ bukti hadir di venue.
        </div>
      </div>

      {/* input jam efektif */}
      <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: C.inkSoft, marginBottom: 5 }}>Jam efektif</div>
      <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="mis. 17:00"
        style={{ width: '100%', padding: '12px 13px', borderRadius: 10, border: `1px solid ${changed ? C.violet : C.line}`, fontSize: 15, fontWeight: 700, color: C.ink, fontFamily: FONT, outline: 'none' }} />

      {changed && (
        <>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: C.inkSoft, marginBottom: 5 }}>Alasan <span style={{ color: C.red }}>*</span></div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="mis. lapor dari rumah; brand konfirmasi kelar 17:00"
            style={{ width: '100%', padding: '12px 13px', borderRadius: 10, border: `1px solid ${reason ? C.line : C.red}`, fontSize: 13.5, color: C.ink, fontFamily: FONT, outline: 'none' }} />
          <div style={{ marginTop: 7, fontSize: 11, color: C.violet, fontWeight: 600 }}>
            Akan tercatat "ditetapkan Fate" di atas fakta mentah — dua-duanya tetap terlihat.
          </div>
        </>
      )}
    </div>
  );
}

function ScreenKoreksi({ project, modelName, onBack, onApply }) {
  const m = project.models.find((x) => x.name === modelName);
  const [arrTime, setArrTime] = useState(effArr(m) || '');
  const [arrReason, setArrReason] = useState('');
  const [compTime, setCompTime] = useState(effComp(m) || '');
  const [compReason, setCompReason] = useState('');
  const [busy, setBusy] = useState(false);

  const arrChanged = arrTime.trim() !== '' && arrTime.trim() !== (m.arrival || '');
  const compChanged = compTime.trim() !== '' && compTime.trim() !== (m.completion || '');
  const anyChange = arrChanged || compChanged;
  const reasonsOk = (!arrChanged || arrReason.trim()) && (!compChanged || compReason.trim());
  const canSave = anyChange && reasonsOk;

  // preview selisih dari jam efektif baru
  const previewSel = compTime.trim() ? Math.max(0, hm(compTime.trim()) - hm(project.end)) : 0;

  function save() {
    setBusy(true);
    const now = stampNow();
    setTimeout(() => onApply({
      arr: arrChanged ? { time: arrTime.trim(), reason: arrReason.trim(), at: now } : undefined,
      comp: compChanged ? { time: compTime.trim(), reason: compReason.trim(), at: now } : undefined,
    }), 500);
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 4px' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, fontSize: 18, cursor: 'pointer', color: C.ink, fontFamily: FONT }}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.inkSoft }}>Koreksi jam</div>
      </div>

      <div style={{ padding: '10px 20px 20px', flex: 1 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{m.name}</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{project.brand} · {project.title}</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 6, background: C.bg, borderRadius: 10, padding: '9px 12px', lineHeight: 1.4 }}>
          Fakta mentah tetap terkunci. Koreksi hanya menambah lapisan "ditetapkan Fate" di atasnya — berjejak, dan bisa diubah lagi nanti setelah cek ke brand/lapangan.
        </div>

        <div style={{ marginTop: 16 }}>
          <KoreksiSection label="Hadir" raw={m.arrival} corr={m.arrivalCorr}
            time={arrTime} setTime={setArrTime} reason={arrReason} setReason={setArrReason} changed={arrChanged} />
          <KoreksiSection label="Selesai" raw={m.completion} corr={m.completionCorr}
            time={compTime} setTime={setCompTime} reason={compReason} setReason={setCompReason} changed={compChanged} />
        </div>

        {compTime.trim() && (
          <div style={{ background: previewSel > 0 ? C.amberSoft : C.brandSoft, borderRadius: 12, padding: '11px 13px' }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: previewSel > 0 ? C.amber : C.brandDark }}>
              {previewSel > 0 ? `Selisih baru: ${fmtDiff(previewSel)} lewat jadwal` : 'Tidak ada selisih terhadap jadwal'}
            </div>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>
              Dihitung dari jam efektif {compTime.trim()} vs jadwal {project.end}.
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.line}`, background: C.card }}>
        <button onClick={() => canSave && save()} disabled={!canSave || busy}
          style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', fontFamily: FONT, background: canSave && !busy ? C.violet : C.bg, color: canSave && !busy ? '#fff' : C.muted, fontSize: 16, fontWeight: 800, cursor: canSave && !busy ? 'pointer' : 'default' }}>
          {busy ? 'Menyimpan koreksi…' : 'Simpan koreksi berjejak'}
        </button>
        {anyChange && !reasonsOk && (
          <div style={{ fontSize: 11.5, color: C.red, textAlign: 'center', marginTop: 8, fontWeight: 600 }}>Alasan wajib diisi untuk setiap jam yang dikoreksi</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================ KONFIRMASI SELISIH */
function ConfirmModal({ project, modelName, onResolve, onCancel }) {
  const m = project.models.find((x) => x.name === modelName);
  const sMins = selisih(m, project);
  const fateSet = compIsFateSet(m);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  function resolve(outcome) { setBusy(true); const st = stampNow(); setTimeout(() => onResolve(outcome, st), 600); }
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,18,20,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 50, fontFamily: FONT }}>
      <div style={{ background: C.card, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '22px 20px 26px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>Konfirmasi selisih</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4, lineHeight: 1.45 }}>Catat hasil kontak brand. Sistem tidak menebak — kamu yang mencatat apa kata brand.</div>
        <div style={{ marginTop: 16, background: C.bg, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{m.name}</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{project.brand} · {project.title}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
            <div><div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase' }}>Hadir</div><div style={{ fontSize: 15, color: C.ink, fontWeight: 700, marginTop: 2 }}>{effArr(m) || '—'}</div></div>
            <div><div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase' }}>Selesai</div><div style={{ fontSize: 15, color: C.ink, fontWeight: 700, marginTop: 2 }}>{effComp(m) || '—'}</div></div>
            <div><div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase' }}>Jadwal</div><div style={{ fontSize: 15, color: C.ink, fontWeight: 700, marginTop: 2 }}>{project.end}</div></div>
          </div>
          <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 800, color: C.amber }}>Selisih {fmtDiff(sMins)} lewat jadwal</div>
          {fateSet && (
            <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 700, color: C.violet, background: C.violetSoft, borderRadius: 8, padding: '6px 9px' }}>
              Jam dasar ditetapkan Fate — bukan dilaporkan model. Sampaikan ke brand apa adanya.
            </div>
          )}
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (mis. brand: OK tambah 1,5 jam / via WA 14:20)"
          style={{ width: '100%', marginTop: 14, padding: '13px 14px', borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none' }} />
        <button onClick={() => resolve('confirmed')} disabled={busy} style={{ marginTop: 16, width: '100%', padding: 15, borderRadius: 14, border: 'none', background: busy ? C.brandDark : C.brand, color: '#fff', fontSize: 15, fontWeight: 800, cursor: busy ? 'default' : 'pointer', fontFamily: FONT }}>Brand konfirmasi selisih</button>
        <button onClick={() => resolve('disputed')} disabled={busy} style={{ marginTop: 10, width: '100%', padding: 15, borderRadius: 14, border: `1px solid ${C.red}`, background: C.card, color: C.red, fontSize: 15, fontWeight: 700, cursor: busy ? 'default' : 'pointer', fontFamily: FONT }}>Brand keberatan</button>
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Konfirmasi mengunci status selisih jadi final. Perhitungan tagihan & bayaran tetap di luar sistem.</div>
        {!busy && <button onClick={onCancel} style={{ marginTop: 8, width: '100%', padding: 12, borderRadius: 14, border: 'none', background: 'transparent', color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Batal</button>}
      </div>
    </div>
  );
}

/* ============================================================ TANDAI NO-SHOW (konfirmasi) */
function NoShowModal({ project, modelName, status, onResolve, onCancel }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const isBatal = status === 'batal';
  function save() { setBusy(true); const st = stampNow(); setTimeout(() => onResolve(note.trim(), st), 500); }
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,18,20,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 50, fontFamily: FONT }}>
      <div style={{ background: C.card, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '22px 20px 26px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>{isBatal ? 'Tandai project batal' : 'Tandai tidak hadir'}</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4, lineHeight: 1.45 }}>
          {modelName} · {project.brand}. {isBatal ? 'Assignment dibatalkan sebelum berjalan.' : 'Model tak muncul & tak lapor sampai jadwal lewat.'} Pencatatan status oleh Fate.
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (mis. sudah dibereskan via telepon)"
          style={{ width: '100%', marginTop: 16, padding: '13px 14px', borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none' }} />
        <button onClick={save} disabled={busy}
          style={{ marginTop: 16, width: '100%', padding: 15, borderRadius: 14, border: 'none', background: busy ? C.red : C.red, color: '#fff', fontSize: 15, fontWeight: 800, cursor: busy ? 'default' : 'pointer', fontFamily: FONT, opacity: busy ? 0.85 : 1 }}>
          {busy ? 'Menyimpan…' : 'Simpan status berjejak'}
        </button>
        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
          Tercatat siapa & kapan. Saat brand punya app nanti, status ini bisa disambung ke konfirmasi.
        </div>
        {!busy && <button onClick={onCancel} style={{ marginTop: 8, width: '100%', padding: 12, borderRadius: 14, border: 'none', background: 'transparent', color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Batal</button>}
      </div>
    </div>
  );
}

/* ============================================================ APP ROOT */
export default function App() {
  const [projects, setProjects] = useState(SEED);
  const [route, setRoute] = useState({ s: 'kokpit' });
  const [confirmFor, setConfirmFor] = useState(null);
  const [noShowFor, setNoShowFor] = useState(null);

  const open = (route.s === 'detail' || route.s === 'koreksi') ? projects.find((p) => p.id === route.id) : null;

  function createProject(data) {
    const id = 'j' + Date.now();
    const models = data.models.map((n) => ({ name: n, phase: 'assigned', arrival: null, completion: null }));
    setProjects((prev) => [{ id, ...data, models }, ...prev]);
    setRoute({ s: 'kokpit' });
  }
  function resolveSelisih(outcome, stamp) {
    setProjects((prev) => prev.map((p) => p.id !== open.id ? p : {
      ...p, models: p.models.map((m) => m.name === confirmFor ? { ...m, phase: 'closed', selisihStatus: outcome, confirmedAt: stamp } : m),
    }));
    setConfirmFor(null);
  }
  function resolveNoShow(note, stamp) {
    setProjects((prev) => prev.map((p) => p.id !== open.id ? p : {
      ...p, models: p.models.map((m) => m.name === noShowFor.name ? { ...m, phase: 'noshow', noshowStatus: noShowFor.status, noshowNote: note, noshowAt: stamp } : m),
    }));
    setNoShowFor(null);
  }
  function setVenueGeo(geo) {
    setProjects((prev) => prev.map((p) => p.id === open.id ? { ...p, venueGeo: geo } : p));
  }
  function applyKoreksi(payload) {
    const name = route.model;
    setProjects((prev) => prev.map((p) => {
      if (p.id !== open.id) return p;
      return {
        ...p, models: p.models.map((m) => {
          if (m.name !== name) return m;
          const nm = { ...m };
          if (payload.arr) nm.arrivalCorr = payload.arr;
          if (payload.comp) nm.completionCorr = payload.comp;
          const ec = nm.completionCorr ? nm.completionCorr.time : nm.completion;
          if (ec) {
            const sel = hm(ec) - hm(p.end);
            nm.phase = sel > 0 ? 'awaiting' : 'closed';
            if (sel <= 0) nm.selisihStatus = null;
          }
          return nm;
        }),
      };
    }));
    setRoute({ s: 'detail', id: open.id });
  }

  return (
    <div style={{ fontFamily: FONT, maxWidth: 390, margin: '0 auto', minHeight: '100vh', background: C.bg, position: 'relative', color: C.ink, overflow: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: ${C.muted}; }
        button:focus-visible, input:focus-visible { outline: 2px solid ${C.brand}; outline-offset: 2px; }`}</style>

      {route.s === 'kokpit' && <ScreenKokpit projects={projects} onOpen={(id) => setRoute({ s: 'detail', id })} onNew={() => setRoute({ s: 'new' })} />}
      {route.s === 'new' && <ScreenNew onBack={() => setRoute({ s: 'kokpit' })} onCreate={createProject} />}
      {route.s === 'detail' && open && (
        <ScreenDetail project={open} onBack={() => setRoute({ s: 'kokpit' })}
          onConfirmSelisih={(name) => setConfirmFor(name)}
          onKoreksi={(name) => setRoute({ s: 'koreksi', id: open.id, model: name })}
          onNoShow={(name, status) => setNoShowFor({ name, status })}
          onSetVenueGeo={setVenueGeo} />
      )}
      {route.s === 'koreksi' && open && (
        <ScreenKoreksi project={open} modelName={route.model}
          onBack={() => setRoute({ s: 'detail', id: open.id })} onApply={applyKoreksi} />
      )}

      {confirmFor && open && (
        <ConfirmModal project={open} modelName={confirmFor} onResolve={resolveSelisih} onCancel={() => setConfirmFor(null)} />
      )}
      {noShowFor && open && (
        <NoShowModal project={open} modelName={noShowFor.name} status={noShowFor.status} onResolve={resolveNoShow} onCancel={() => setNoShowFor(null)} />
      )}
    </div>
  );
}
