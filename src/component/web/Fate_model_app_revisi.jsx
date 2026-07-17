import React, { useState } from 'react';

/* ============================================================
   Fate — sisi model (mobile)
   Produk saudara, spine sendiri.
   Home = list project · detail project = tempat lapor.
   Jejak presence per-model, identity-bound, selfie wajib.
   Overtime = turunan otomatis dari timestamp selesai vs jadwal
   (bukan klaim model). Fakta terkunci, tafsir di atasnya.
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
  blue: '#3B7DD8',
  blueSoft: '#EAF1FB',
};

const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/* ---------- phase model per jejak model ----------
   assigned      : baru di-assign, belum konfirmasi keikutsertaan
   scheduled     : sudah ack, belum waktunya lapor hadir
   ready         : sudah ack, jam mulai dekat -> boleh lapor hadir
   present       : sudah lapor hadir, sedang berjalan
   awaiting      : sudah lapor selesai, ADA selisih -> menunggu konfirmasi brand
   closed        : selesai tanpa selisih / sudah dikonfirmasi
*/

const SEED = [
  {
    id: 'p1',
    brand: 'Aveda Skincare',
    title: 'Campaign Shoot — Serum Line',
    venue: 'Studio Kolektif, Kemang',
    date: 'Hari ini',
    start: '09:00',
    end: '17:00',
    phase: 'present',
    arrival: '08:52',
    completion: null,
  },
  {
    id: 'p2',
    brand: 'Nara Coffee',
    title: 'Product Video — Cold Brew',
    venue: 'Rooftop Senayan',
    date: 'Hari ini',
    start: '14:00',
    end: '18:00',
    phase: 'ready',
    arrival: null,
    completion: null,
  },
  {
    id: 'p3',
    brand: 'Loka Fashion',
    title: 'Lookbook — Resort 26',
    venue: 'Villa Cipete',
    date: 'Besok',
    start: '10:00',
    end: '16:00',
    phase: 'assigned',
    arrival: null,
    completion: null,
  },
  {
    id: 'p4',
    brand: 'Metro Dept.',
    title: 'Runway Fitting',
    venue: 'Metro Pondok Indah',
    date: '3 Jul',
    start: '13:00',
    end: '15:00',
    phase: 'scheduled',
    arrival: null,
    completion: null,
  },
  {
    id: 'p5',
    brand: 'Bloom Jewelry',
    title: 'Editorial — Fine Line',
    venue: 'Studio Nine, SCBD',
    date: 'Kemarin',
    start: '11:00',
    end: '19:00',
    phase: 'awaiting',
    arrival: '10:48',
    completion: '20:35',
    demoCompletion: '20:35', // menghasilkan selisih 1j 35m
  },
  {
    id: 'p6',
    brand: 'Sana Beauty',
    title: 'Social Content Day',
    venue: 'Studio Kolektif, Kemang',
    date: '29 Jun',
    start: '09:00',
    end: '15:00',
    phase: 'closed',
    arrival: '08:55',
    completion: '15:04',
    closedLabel: 'Dikonfirmasi brand',
  },
];

/* ---------- helpers ---------- */
function hm(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function fmtDiff(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}
// selisih terhadap jadwal, dihitung dari fakta (bukan klaim)
function overtimeMins(p) {
  if (!p.completion) return 0;
  const d = hm(p.completion) - hm(p.end);
  return d > 0 ? d : 0;
}

/* ---------- badge per phase (dari sudut jejak model ini) ---------- */
function badgeFor(p) {
  switch (p.phase) {
    case 'assigned':
      return { label: 'Perlu konfirmasi', bg: C.amberSoft, fg: C.amber, act: true };
    case 'scheduled':
      return { label: 'Terjadwal', bg: C.bg, fg: C.inkSoft, act: false };
    case 'ready':
      return { label: 'Waktunya lapor hadir', bg: C.brandSoft, fg: C.brandDark, act: true };
    case 'present':
      return { label: 'Sedang berjalan', bg: C.brandSoft, fg: C.brandDark, act: true, live: true };
    case 'awaiting':
      return { label: 'Menunggu konfirmasi brand', bg: C.amberSoft, fg: C.amber, act: false };
    case 'closed':
      return { label: 'Selesai', bg: C.bg, fg: C.muted, act: false };
    default:
      return { label: '—', bg: C.bg, fg: C.muted, act: false };
  }
}

// urutan tampil: butuh aksi & aktif di atas, selesai di bawah (redup)
const ORDER = { present: 0, ready: 1, assigned: 2, scheduled: 3, awaiting: 4, closed: 5 };

/* ============================================================
   HOME — list project
   ============================================================ */
function ScreenHome({ projects, onOpen }) {
  const sorted = [...projects].sort((a, b) => ORDER[a.phase] - ORDER[b.phase]);
  const needAck = projects.filter((p) => p.phase === 'assigned').length;

  return (
    <div>
      <div style={{ padding: '22px 20px 8px' }}>
        <div style={{ fontSize: 13, color: C.inkSoft, fontWeight: 600 }}>Halo, Kirana</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.5, marginTop: 2 }}>
          Project kamu
        </div>
        {needAck > 0 && (
          <div style={{ fontSize: 13, color: C.amber, fontWeight: 600, marginTop: 6 }}>
            {needAck} project baru menunggu konfirmasi
          </div>
        )}
      </div>

      <div style={{ padding: '8px 16px 28px' }}>
        {sorted.map((p) => {
          const b = badgeFor(p);
          const dim = p.phase === 'closed';
          const ot = overtimeMins(p);
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: C.card,
                border: `1px solid ${C.line}`,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                cursor: 'pointer',
                opacity: dim ? 0.7 : 1,
                boxShadow: b.act ? '0 2px 10px rgba(20,24,26,0.05)' : 'none',
                display: 'block',
                fontFamily: FONT,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {p.brand}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 3, lineHeight: 1.25 }}>
                    {p.title}
                  </div>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: b.fg,
                    background: b.bg,
                    padding: '5px 9px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {b.live && (
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: C.brand, display: 'inline-block' }} />
                  )}
                  {b.label}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12.5, color: C.inkSoft, fontWeight: 500 }}>
                <span>📍 {p.venue}</span>
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 5, fontSize: 12.5, color: C.inkSoft, fontWeight: 500 }}>
                <span>🗓 {p.date}</span>
                <span>🕘 {p.start}–{p.end}</span>
              </div>

              {p.phase === 'awaiting' && ot > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.amber, fontWeight: 600 }}>
                  Selesai {p.completion} · {fmtDiff(ot)} lewat jadwal
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   SELFIE CAPTURE (wajib tiap lapor)
   ============================================================ */
function SelfieModal({ title, sub, onDone, onCancel }) {
  const [shot, setShot] = useState(false);
  const [sending, setSending] = useState(false);

  const now = new Date();
  const stamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  function send() {
    setSending(true);
    setTimeout(() => onDone(), 850); // simulasi tangkap-di-perangkat lalu kunci
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(16,18,20,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 50,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: C.card,
          width: '100%',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: '22px 20px 26px',
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 999, background: C.line, margin: '0 auto 18px' }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{title}</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>

        <div
          style={{
            marginTop: 18,
            height: 220,
            borderRadius: 18,
            background: shot ? C.brandSoft : '#111315',
            border: `1px solid ${shot ? C.brand : '#111315'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            overflow: 'hidden',
          }}
        >
          {shot ? (
            <>
              <div
                style={{
                  width: 56, height: 56, borderRadius: 999, background: C.brand,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 26, fontWeight: 800,
                }}
              >
                ✓
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.brandDark }}>Selfie terekam · {stamp}</div>
              <div style={{ fontSize: 11.5, color: C.inkSoft }}>Waktu terkunci saat kamu tap · lokasi tercatat</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 40 }}>📷</div>
              <div style={{ fontSize: 13, color: '#C9CDD1', fontWeight: 500 }}>Arahkan kamera ke wajahmu</div>
            </>
          )}
        </div>

        {!shot ? (
          <button
            onClick={() => setShot(true)}
            style={{
              marginTop: 18, width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: C.ink, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Ambil selfie
          </button>
        ) : (
          <button
            onClick={send}
            disabled={sending}
            style={{
              marginTop: 18, width: '100%', padding: '15px', borderRadius: 14, border: 'none',
              background: sending ? C.brandDark : C.brand, color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: sending ? 'default' : 'pointer', fontFamily: FONT, opacity: sending ? 0.85 : 1,
            }}
          >
            {sending ? 'Mengunci laporan…' : 'Kirim laporan'}
          </button>
        )}

        {!sending && (
          <button
            onClick={onCancel}
            style={{
              marginTop: 10, width: '100%', padding: '12px', borderRadius: 14, border: 'none',
              background: 'transparent', color: C.inkSoft, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Batal
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL PROJECT — timeline jejak + tombol aksi
   ============================================================ */
function TimelineRow({ done, active, label, time, note }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 22, height: 22, borderRadius: 999, flexShrink: 0,
            background: done ? C.brand : active ? '#fff' : C.bg,
            border: `2px solid ${done ? C.brand : active ? C.brand : C.line}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 800,
          }}
        >
          {done ? '✓' : ''}
        </div>
        <div style={{ width: 2, flex: 1, background: done ? C.brand : C.line, minHeight: 18 }} />
      </div>
      <div style={{ paddingBottom: 18 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: done || active ? C.ink : C.muted }}>{label}</div>
        {time && <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2, fontWeight: 600 }}>{time}</div>}
        {note && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{note}</div>}
      </div>
    </div>
  );
}

function ScreenDetail({ project, onBack, onAck, onReportArrival, onReportDone }) {
  const p = project;
  const ot = overtimeMins(p);
  const has = { ack: p.phase !== 'assigned', present: !!p.arrival, done: !!p.completion };

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 4px' }}>
        <button
          onClick={onBack}
          style={{
            width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.line}`,
            background: C.card, fontSize: 18, cursor: 'pointer', color: C.ink, fontFamily: FONT,
          }}
        >
          ‹
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.inkSoft }}>Detail project</div>
      </div>

      <div style={{ padding: '10px 20px 20px', flex: 1 }}>
        {/* header project */}
        <div style={{ fontSize: 12, fontWeight: 700, color: C.brand, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {p.brand}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginTop: 4, letterSpacing: -0.4, lineHeight: 1.2 }}>
          {p.title}
        </div>

        <div
          style={{
            marginTop: 16, background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14,
            display: 'flex', flexDirection: 'column', gap: 9,
          }}
        >
          <Row k="Venue" v={p.venue} />
          <Row k="Tanggal" v={p.date} />
          <Row k="Jadwal" v={`${p.start} – ${p.end}`} />
        </div>

        {/* jejak presence kamu */}
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, margin: '22px 0 14px' }}>Jejak kamu</div>
        <div>
          <TimelineRow
            done={has.ack}
            active={p.phase === 'assigned'}
            label="Konfirmasi keikutsertaan"
            time={has.ack ? 'Dikonfirmasi' : null}
            note={p.phase === 'assigned' ? 'Belum kamu konfirmasi' : null}
          />
          <TimelineRow
            done={has.present}
            active={p.phase === 'ready'}
            label="Hadir di venue"
            time={p.arrival ? `Lapor hadir ${p.arrival}` : null}
            note={!has.present ? (p.phase === 'ready' ? 'Siap dilaporkan' : 'Menunggu') : 'Selfie + waktu terkunci'}
          />
          <LastRow
            done={has.done}
            active={p.phase === 'present'}
            label="Selesai"
            time={p.completion ? `Lapor selesai ${p.completion}` : null}
            note={!has.done ? (p.phase === 'present' ? 'Laporkan saat kerjaan kelar' : 'Menunggu') : 'Selfie + waktu terkunci'}
          />
        </div>

        {/* blok selisih jadwal — fakta, bukan vonis */}
        {has.done && ot > 0 && (
          <div
            style={{
              marginTop: 6, background: C.amberSoft, borderRadius: 14, padding: 14,
              border: `1px solid ${C.amber}22`,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: C.amber }}>
              Selesai {fmtDiff(ot)} lewat jadwal
            </div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 5, lineHeight: 1.5 }}>
              Jadwal selesai {p.end}, kamu lapor selesai {p.completion}. Selisih ini tercatat sebagai
              fakta dan menunggu konfirmasi brand — belum dihitung sebagai lembur.
            </div>
          </div>
        )}
        {has.done && ot === 0 && (
          <div style={{ marginTop: 6, fontSize: 12.5, color: C.inkSoft }}>
            Selesai sesuai jadwal. Tidak ada selisih.
          </div>
        )}
      </div>

      {/* tombol aksi menempel bawah */}
      <ActionBar
        project={p}
        onAck={onAck}
        onReportArrival={onReportArrival}
        onReportDone={onReportDone}
      />
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, color: C.inkSoft, fontWeight: 500 }}>{k}</span>
      <span style={{ fontSize: 13.5, color: C.ink, fontWeight: 700, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

// baris terakhir timeline tanpa garis penyambung ke bawah
function LastRow({ done, active, label, time, note }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div
        style={{
          width: 22, height: 22, borderRadius: 999, flexShrink: 0,
          background: done ? C.brand : active ? '#fff' : C.bg,
          border: `2px solid ${done ? C.brand : active ? C.brand : C.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 12, fontWeight: 800,
        }}
      >
        {done ? '✓' : ''}
      </div>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: done || active ? C.ink : C.muted }}>{label}</div>
        {time && <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 2, fontWeight: 600 }}>{time}</div>}
        {note && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{note}</div>}
      </div>
    </div>
  );
}

function ActionBar({ project, onAck, onReportArrival, onReportDone }) {
  const p = project;
  const [busy, setBusy] = useState(false);

  const wrap = { padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${C.line}`, background: C.card };
  const big = (bg, txt, on, disabled) => (
    <button
      onClick={() => { if (disabled) return; on(); }}
      disabled={disabled}
      style={{
        width: '100%', padding: '16px', borderRadius: 14, border: 'none',
        background: disabled ? C.bg : bg, color: disabled ? C.muted : '#fff',
        fontSize: 16, fontWeight: 800, cursor: disabled ? 'default' : 'pointer', fontFamily: FONT,
      }}
    >
      {txt}
    </button>
  );

  if (p.phase === 'assigned') {
    return (
      <div style={wrap}>
        {big(C.ink, busy ? 'Menyimpan…' : 'Konfirmasi keikutsertaan', () => { setBusy(true); setTimeout(onAck, 500); }, busy)}
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: 'center', marginTop: 9 }}>
          Project ini ditugaskan ke kamu secara langsung
        </div>
      </div>
    );
  }
  if (p.phase === 'scheduled') {
    return (
      <div style={wrap}>
        {big(C.bg, 'Lapor hadir', () => {}, true)}
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: 'center', marginTop: 9 }}>
          Aktif saat mendekati jam mulai ({p.start})
        </div>
      </div>
    );
  }
  if (p.phase === 'ready') {
    return <div style={wrap}>{big(C.brand, 'Lapor hadir di venue', onReportArrival, false)}</div>;
  }
  if (p.phase === 'present') {
    return (
      <div style={wrap}>
        {big(C.brand, 'Lapor selesai', onReportDone, false)}
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: 'center', marginTop: 9 }}>
          Lapor tepat saat kerjaan kelar — waktunya yang jadi patokan
        </div>
      </div>
    );
  }
  if (p.phase === 'awaiting') {
    return (
      <div style={wrap}>
        <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: C.amber }}>
          Menunggu konfirmasi brand
        </div>
        <div style={{ fontSize: 11.5, color: C.muted, textAlign: 'center', marginTop: 6 }}>
          Fate akan mengonfirmasi selisih waktu ke brand
        </div>
      </div>
    );
  }
  // closed
  return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: C.brandDark }}>
        {p.closedLabel || 'Selesai'} ✓
      </div>
    </div>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
export default function App() {
  const [projects, setProjects] = useState(SEED);
  const [openId, setOpenId] = useState(null);
  const [selfie, setSelfie] = useState(null); // { kind: 'arrival'|'done' }

  const open = projects.find((p) => p.id === openId) || null;

  function patch(id, fields) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...fields } : p)));
  }

  function nowHM() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  }

  function doAck() {
    patch(open.id, { phase: 'ready' });
  }
  function afterArrival() {
    patch(open.id, { phase: 'present', arrival: nowHM() });
    setSelfie(null);
  }
  function afterDone() {
    // completion pakai demo bila ada (biar cerita overtime konsisten), else jam sekarang
    const comp = open.demoCompletion || nowHM();
    const late = hm(comp) - hm(open.end) > 0;
    patch(open.id, { phase: late ? 'awaiting' : 'closed', completion: comp, closedLabel: late ? undefined : 'Selesai' });
    setSelfie(null);
  }

  return (
    <div
      style={{
        fontFamily: FONT,
        maxWidth: 390,
        margin: '0 auto',
        minHeight: '100vh',
        background: C.bg,
        position: 'relative',
        color: C.ink,
        overflow: 'hidden',
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        button:focus-visible { outline: 2px solid ${C.brand}; outline-offset: 2px; }`}</style>

      {open ? (
        <ScreenDetail
          project={open}
          onBack={() => setOpenId(null)}
          onAck={doAck}
          onReportArrival={() => setSelfie({ kind: 'arrival' })}
          onReportDone={() => setSelfie({ kind: 'done' })}
        />
      ) : (
        <ScreenHome projects={projects} onOpen={setOpenId} />
      )}

      {selfie && (
        <SelfieModal
          title={selfie.kind === 'arrival' ? 'Selfie hadir di venue' : 'Selfie selesai'}
          sub={
            selfie.kind === 'arrival'
              ? 'Selfie & waktu terekam saat kamu tap, bukan saat terkirim. Lokasi ikut tercatat.'
              : 'Waktu selesai jadi patokan selisih jadwal. Pastikan kamu benar-benar sudah kelar.'
          }
          onDone={selfie.kind === 'arrival' ? afterArrival : afterDone}
          onCancel={() => setSelfie(null)}
        />
      )}
    </div>
  );
}
