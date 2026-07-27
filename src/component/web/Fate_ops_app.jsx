import React, { useState } from 'react';

/* ============================================================
   Fate — sisi ops (mobile console)
   Otak produk: bikin project, assign model (identity-bound),
   monitor via anomali (bukan mid-check), dan KONFIRMASI SELISIH
   atas nama brand — aktif, bukan auto-close (brand belum di app).
   Konfirmasi mengunci status selisih jadi final (bahan baku
   bersih), BUKAN menghitung rupiah (batas §8).
   ============================================================ */

const C = {
  brand: '#1D9E75',
  brandDark: '#17835F',
  brandSoft: '#E7F5EF',
  ink: '#16181A',
  inkSoft: '#5B6166',
  muted: '#9AA0A6',
  line: '#E8EAEC',
  bg: '#F5F6F6',
  card: '#FFFFFF',
  amber: '#C9822A',
  amberSoft: '#FBF1E3',
  red: '#C0492F',
  redSoft: '#FBECE8',
  blue: '#3B7DD8',
  blueSoft: '#EAF1FB',
};
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const MODEL_POOL = ['Kirana', 'Dara', 'Sasha', 'Nadia', 'Ayu', 'Rani', 'Tari', 'Vina'];

/* ---------- seed: project dari sudut Fate, tiap project punya models[] ----------
   model phase: assigned | scheduled | present | awaiting | closed
   flags project: soon (jadwal dekat), endedPast (jadwal sudah lewat)  -> untuk deteksi anomali demo
*/
export const SEED = [
  {
    id: 'j1',
    brand: 'Nara Coffee',
    title: 'Product Video — Cold Brew',
    venue: 'Rooftop Senayan',
    date: 'Hari ini',
    start: '08:00',
    end: '12:00',
    endedPast: true,
    models: [
      { name: 'Sasha', phase: 'present', arrival: '07:55', completion: null },
      { name: 'Dara', phase: 'closed', arrival: '07:58', completion: '12:02', selisihStatus: null },
    ],
  },
  {
    id: 'j2',
    brand: 'Bloom Jewelry',
    title: 'Editorial — Fine Line',
    venue: 'Studio Nine, SCBD',
    date: 'Kemarin',
    start: '11:00',
    end: '19:00',
    models: [
      { name: 'Kirana', phase: 'awaiting', arrival: '10:48', completion: '20:35', selisihStatus: null },
      { name: 'Rani', phase: 'closed', arrival: '10:52', completion: '19:03', selisihStatus: null },
    ],
  },
  {
    id: 'j3',
    brand: 'Loka Fashion',
    title: 'Lookbook — Resort 26',
    venue: 'Villa Cipete',
    date: 'Besok',
    start: '10:00',
    end: '16:00',
    soon: true,
    models: [
      { name: 'Nadia', phase: 'assigned', arrival: null, completion: null },
      { name: 'Ayu', phase: 'scheduled', arrival: null, completion: null },
    ],
  },
  {
    id: 'j4',
    brand: 'Aveda Skincare',
    title: 'Campaign Shoot — Serum Line',
    venue: 'Studio Kolektif, Kemang',
    date: 'Hari ini',
    start: '09:00',
    end: '17:00',
    models: [
      { name: 'Tari', phase: 'present', arrival: '08:50', completion: null },
      { name: 'Vina', phase: 'present', arrival: '08:52', completion: null },
    ],
  },
  {
    id: 'j5',
    brand: 'Sana Beauty',
    title: 'Social Content Day',
    venue: 'Studio Kolektif, Kemang',
    date: '29 Jun',
    start: '09:00',
    end: '15:00',
    models: [
      { name: 'Kirana', phase: 'closed', arrival: '08:55', completion: '15:04', selisihStatus: null },
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
function selisih(model, proj) {
  if (!model.completion) return 0;
  const d = hm(model.completion) - hm(proj.end);
  return d > 0 ? d : 0;
}

/* ---------- kumpulkan anomali lintas project (anti-ngabur tanpa mid-check) ---------- */
function collectAttention(projects) {
  const items = [];
  projects.forEach((p) => {
    p.models.forEach((m) => {
      if (m.phase === 'awaiting') {
        items.push({ kind: 'selisih', p, m, mins: selisih(m, p),
          weight: 0, text: `Selisih ${fmtDiff(selisih(m, p))} menunggu konfirmasi brand` });
      } else if (m.phase === 'present' && p.endedPast) {
        items.push({ kind: 'nolapor', p, m, weight: 1,
          text: `Hadir tapi belum lapor selesai · jadwal lewat ${p.end}` });
      } else if (m.phase === 'assigned' && p.soon) {
        items.push({ kind: 'belumack', p, m, weight: 2,
          text: `Belum konfirmasi keikutsertaan · jadwal ${p.date}` });
      }
    });
  });
  return items.sort((a, b) => a.weight - b.weight);
}

function ATTN_STYLE(kind) {
  if (kind === 'selisih') return { bg: C.amberSoft, fg: C.amber, icon: '⏱' };
  if (kind === 'nolapor') return { bg: C.redSoft, fg: C.red, icon: '⚠' };
  return { bg: C.blueSoft, fg: C.blue, icon: '◷' };
}

/* ============================================================
   KOKPIT (home Fate)
   ============================================================ */
export function ScreenKokpit({ projects, onOpen, onNew }) {
  const attn = collectAttention(projects);
  const activeCount = projects.filter((p) => p.models.some((m) => ['present', 'ready', 'scheduled', 'assigned', 'awaiting'].includes(m.phase))).length;

  return (
    <div>
      <div style={{ padding: '22px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>Fate Agency</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5, marginTop: 2 }}>Kokpit</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3, fontWeight: 500 }}>{activeCount} project aktif</div>
        </div>
        <button
          onClick={onNew}
          style={{
            background: C.ink, color: '#fff', border: 'none', borderRadius: 12,
            padding: '11px 15px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
          }}
        >
          + Project
        </button>
      </div>

      {/* perlu perhatian */}
      {attn.length > 0 && (
        <div style={{ padding: '16px 16px 4px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 4px 10px' }}>
            Perlu perhatian
          </div>
          {attn.map((a, i) => {
            const s = ATTN_STYLE(a.kind);
            return (
              <button
                key={i}
                onClick={() => onOpen(a.p.id)}
                style={{
                  width: '100%', textAlign: 'left', background: C.card, border: `1px solid ${C.line}`,
                  borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer', display: 'flex', gap: 12,
                  alignItems: 'flex-start', fontFamily: FONT,
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: s.bg, color: s.fg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{s.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink }}>
                    {a.m.name} · <span style={{ color: C.inkSoft, fontWeight: 600 }}>{a.p.brand}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: s.fg, fontWeight: 600, marginTop: 3 }}>{a.text}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* semua project */}
      <div style={{ padding: '16px 16px 30px' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 4px 10px' }}>
          Semua project
        </div>
        {projects.map((p) => {
          const done = p.models.every((m) => m.phase === 'closed');
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              style={{
                width: '100%', textAlign: 'left', background: C.card, border: `1px solid ${C.line}`,
                borderRadius: 14, padding: 14, marginBottom: 10, cursor: 'pointer', opacity: done ? 0.65 : 1,
                display: 'block', fontFamily: FONT,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: 0.3 }}>{p.brand}</div>
                <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>{p.date}</div>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, marginTop: 3 }}>{p.title}</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 8, fontWeight: 500, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span>{p.models.length} model</span>
                <span style={{ color: C.line }}>·</span>
                <span>{p.venue}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   BIKIN PROJECT
   ============================================================ */
export function ScreenNew({ onBack, onCreate }) {
  const [brand, setBrand] = useState('');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [picked, setPicked] = useState([]);

  const valid = brand && title && venue && date && start && end && picked.length > 0;

  const field = (label, val, set, ph, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, marginBottom: 6 }}>{label}</div>
      <input
        value={val}
        onChange={(e) => set(e.target.value)}
        placeholder={ph}
        style={{
          width: '100%', padding: '13px 14px', borderRadius: 12, border: `1px solid ${C.line}`,
          fontSize: 15, color: C.ink, fontFamily: FONT, background: C.card, outline: 'none',
        }}
      />
    </div>
  );

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 4px' }}>
        <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.line}`, background: C.card, fontSize: 18, cursor: 'pointer', color: C.ink, fontFamily: FONT }}>‹</button>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Project baru</div>
      </div>

      <div style={{ padding: '14px 20px 20px', flex: 1 }}>
        {field('Brand', brand, setBrand, 'mis. Aveda Skincare')}
        {field('Judul project', title, setTitle, 'mis. Campaign Shoot')}
        {field('Venue', venue, setVenue, 'mis. Studio Kolektif, Kemang')}
        {field('Tanggal', date, setDate, 'mis. 5 Jul')}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>{field('Mulai', start, setStart, '09:00')}</div>
          <div style={{ flex: 1 }}>{field('Selesai', end, setEnd, '17:00')}</div>
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.inkSoft, margin: '4px 0 8px' }}>
          Assign model <span style={{ color: C.muted, fontWeight: 500 }}>· yang dipilih harus dia yang kerja</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MODEL_POOL.map((n) => {
            const on = picked.includes(n);
            return (
              <button
                key={n}
                onClick={() => setPicked((prev) => on ? prev.filter((x) => x !== n) : [...prev, n])}
                style={{
                  padding: '9px 14px', borderRadius: 999, fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${on ? C.brand : C.line}`,
                  background: on ? C.brandSoft : C.card, color: on ? C.brandDark : C.inkSoft,
                }}
              >
                {on ? '✓ ' : ''}{n}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.line}`, background: C.card }}>
        <button
          onClick={() => valid && onCreate({ brand, title, venue, date, start, end, models: picked })}
          disabled={!valid}
          style={{
            width: '100%', padding: 16, borderRadius: 14, border: 'none', fontFamily: FONT,
            background: valid ? C.brand : C.bg, color: valid ? '#fff' : C.muted,
            fontSize: 16, fontWeight: 800, cursor: valid ? 'pointer' : 'default',
          }}
        >
          Buat & kirim ke model
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL PROJECT (sisi Fate) — jejak tiap model
   ============================================================ */
function modelBadge(m) {
  switch (m.phase) {
    case 'assigned': return { t: 'Belum konfirmasi', bg: C.blueSoft, fg: C.blue };
    case 'scheduled': return { t: 'Terjadwal', bg: C.bg, fg: C.inkSoft };
    case 'present': return { t: 'Sedang berjalan', bg: C.brandSoft, fg: C.brandDark };
    case 'awaiting': return { t: 'Selisih menunggu', bg: C.amberSoft, fg: C.amber };
    case 'closed': return { t: 'Selesai', bg: C.bg, fg: C.muted };
    default: return { t: '—', bg: C.bg, fg: C.muted };
  }
}

export function ScreenDetail({ project, onBack, onConfirmSelisih }) {
  const p = project;
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
          <KV k="Venue" v={p.venue} />
          <KV k="Tanggal" v={p.date} />
          <KV k="Jadwal" v={`${p.start} – ${p.end}`} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: '22px 0 12px' }}>
          Model ({p.models.length})
        </div>

        {p.models.map((m, i) => {
          const b = modelBadge(m);
          const sMins = selisih(m, p);
          const showConfirm = m.phase === 'awaiting';
          return (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 15, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>{m.name}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: b.fg, background: b.bg, padding: '5px 9px', borderRadius: 999 }}>{b.t}</span>
              </div>

              {/* fakta terkunci */}
              <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
                <Fact k="Hadir" v={m.arrival || '—'} />
                <Fact k="Selesai" v={m.completion || '—'} />
              </div>

              {/* selisih sebagai fakta */}
              {sMins > 0 && (
                <div style={{ marginTop: 12, background: C.amberSoft, borderRadius: 12, padding: '11px 13px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: C.amber }}>Selesai {fmtDiff(sMins)} lewat jadwal</div>
                  <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3 }}>
                    Jadwal selesai {p.end}, lapor selesai {m.completion}. Fakta terkunci — belum dihitung lembur.
                  </div>
                </div>
              )}

              {/* status selisih yang sudah diproses */}
              {m.selisihStatus === 'confirmed' && (
                <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.brandDark }}>
                  ✓ Dikonfirmasi brand · via Fate {m.confirmedAt}
                </div>
              )}
              {m.selisihStatus === 'disputed' && (
                <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: C.red }}>
                  Brand keberatan atas selisih · via Fate {m.confirmedAt}
                </div>
              )}

              {showConfirm && (
                <button
                  onClick={() => onConfirmSelisih(m.name)}
                  style={{
                    marginTop: 13, width: '100%', padding: 13, borderRadius: 12, border: 'none',
                    background: C.ink, color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                  }}
                >
                  Proses selisih atas nama brand
                </button>
              )}
            </div>
          );
        })}
      </div>
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
function Fact({ k, v }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</div>
      <div style={{ fontSize: 15, color: C.ink, fontWeight: 700, marginTop: 2 }}>{v}</div>
    </div>
  );
}

/* ============================================================
   KONFIRMASI SELISIH ATAS NAMA BRAND — jantung fitur
   ============================================================ */
export function ConfirmModal({ project, modelName, onResolve, onCancel }) {
  const m = project.models.find((x) => x.name === modelName);
  const sMins = selisih(m, project);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  function resolve(outcome) {
    setBusy(true);
    const now = new Date();
    const stamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setTimeout(() => onResolve(outcome, stamp), 600);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,18,20,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 50, fontFamily: FONT }}>
      <div style={{ background: C.card, width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '22px 20px 26px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>Konfirmasi selisih</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4, lineHeight: 1.45 }}>
          Catat hasil kontak brand. Sistem tidak menebak — kamu yang mencatat apa kata brand.
        </div>

        {/* fakta terkunci */}
        <div style={{ marginTop: 16, background: C.bg, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{m.name}</div>
          <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2 }}>{project.brand} · {project.title}</div>
          <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
            <Fact k="Hadir" v={m.arrival} />
            <Fact k="Selesai" v={m.completion} />
            <Fact k="Jadwal" v={project.end} />
          </div>
          <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 800, color: C.amber }}>
            Selisih {fmtDiff(sMins)} lewat jadwal
          </div>
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (mis. brand: OK tambah 1,5 jam / via WA 14:20)"
          style={{
            width: '100%', marginTop: 14, padding: '13px 14px', borderRadius: 12, border: `1px solid ${C.line}`,
            fontSize: 14, color: C.ink, fontFamily: FONT, outline: 'none',
          }}
        />

        {/* dua hasil aktif */}
        <button
          onClick={() => resolve('confirmed')}
          disabled={busy}
          style={{
            marginTop: 16, width: '100%', padding: 15, borderRadius: 14, border: 'none',
            background: busy ? C.brandDark : C.brand, color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: busy ? 'default' : 'pointer', fontFamily: FONT,
          }}
        >
          Brand konfirmasi selisih
        </button>
        <button
          onClick={() => resolve('disputed')}
          disabled={busy}
          style={{
            marginTop: 10, width: '100%', padding: 15, borderRadius: 14, border: `1px solid ${C.red}`,
            background: C.card, color: C.red, fontSize: 15, fontWeight: 700,
            cursor: busy ? 'default' : 'pointer', fontFamily: FONT,
          }}
        >
          Brand keberatan
        </button>

        <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          Konfirmasi mengunci status selisih jadi final. Perhitungan tagihan & bayaran tetap di luar sistem.
        </div>

        {!busy && (
          <button onClick={onCancel} style={{ marginTop: 8, width: '100%', padding: 12, borderRadius: 14, border: 'none', background: 'transparent', color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
export default function App() {
  const [projects, setProjects] = useState(SEED);
  const [route, setRoute] = useState({ s: 'kokpit' }); // s: kokpit | new | detail
  const [confirmFor, setConfirmFor] = useState(null); // model name

  const open = route.s === 'detail' ? projects.find((p) => p.id === route.id) : null;

  function createProject(data) {
    const id = 'j' + (projects.length + 1) + Date.now();
    const models = data.models.map((n) => ({ name: n, phase: 'assigned', arrival: null, completion: null }));
    setProjects((prev) => [{ id, ...data, models }, ...prev]);
    setRoute({ s: 'kokpit' });
  }

  function resolveSelisih(outcome, stamp) {
    setProjects((prev) => prev.map((p) => {
      if (p.id !== open.id) return p;
      return {
        ...p,
        models: p.models.map((m) =>
          m.name === confirmFor
            ? { ...m, phase: 'closed', selisihStatus: outcome, confirmedAt: stamp }
            : m
        ),
      };
    }));
    setConfirmFor(null);
  }

  return (
    <div style={{ fontFamily: FONT, maxWidth: 390, margin: '0 auto', minHeight: '100vh', background: C.bg, position: 'relative', color: C.ink, overflow: 'hidden' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input::placeholder { color: ${C.muted}; }
        button:focus-visible, input:focus-visible { outline: 2px solid ${C.brand}; outline-offset: 2px; }`}</style>

      {route.s === 'kokpit' && (
        <ScreenKokpit projects={projects} onOpen={(id) => setRoute({ s: 'detail', id })} onNew={() => setRoute({ s: 'new' })} />
      )}
      {route.s === 'new' && (
        <ScreenNew onBack={() => setRoute({ s: 'kokpit' })} onCreate={createProject} />
      )}
      {route.s === 'detail' && open && (
        <ScreenDetail project={open} onBack={() => setRoute({ s: 'kokpit' })} onConfirmSelisih={(name) => setConfirmFor(name)} />
      )}

      {confirmFor && open && (
        <ConfirmModal
          project={open}
          modelName={confirmFor}
          onResolve={resolveSelisih}
          onCancel={() => setConfirmFor(null)}
        />
      )}
    </div>
  );
}
