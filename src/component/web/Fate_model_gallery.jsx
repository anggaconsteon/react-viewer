// ═══════════════════════════════════════════════════════════════════════════
// FATE — MODEL APP · PAGE GALLERY
// ═══════════════════════════════════════════════════════════════════════════
// Every screen/phase of Fate_model_app.jsx side by side in labeled phone frames.
// Detail is rendered once per phase (assigned … closed). Frames are live —
// taps inside work; cross-page navigation is a no-op.
// ═══════════════════════════════════════════════════════════════════════════
import {
    SEED,
    ScreenHome,
    ScreenDetail,
    SelfieModal,
} from './Fate_model_app.jsx';

const noop = () => { };
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const byId = (id) => SEED.find((p) => p.id === id);

// ─── FRAME CHROME ──────────────────────────────────────────────────────────
const SCALE = 0.8;
const FRAME_W = 390;
const FRAME_H = 760;

const BADGE = {
    HOME: { bg: '#E7F5EF', fg: '#17835F', label: 'HOME' },
    PHASE: { bg: '#eef2ff', fg: '#4f46e5', label: 'PHASE' },
    MODAL: { bg: '#FBF1E3', fg: '#C9822A', label: 'MODAL' },
};

const Frame = ({ id, title, badge = 'PHASE', desc, children }) => {
    const b = BADGE[badge];
    return (
        <div style={{ width: FRAME_W * SCALE, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ background: '#fff', color: '#0f172a', fontWeight: 800, fontSize: 13, padding: '2px 10px', borderRadius: 6 }}>{id}</span>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: b.bg, color: b.fg, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 4 }}>{b.label}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{desc}</span>
                </div>
            </div>
            <div style={{ width: FRAME_W * SCALE, height: FRAME_H * SCALE, flexShrink: 0 }}>
                <div style={{
                    width: FRAME_W, height: FRAME_H, transform: `scale(${SCALE})`, transformOrigin: 'top left',
                    background: '#F5F6F6', borderRadius: 28, overflow: 'hidden', position: 'relative',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 0 0 6px #0a0a0a, 0 0 0 7px #2a2a2a',
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, sub, children }) => (
    <div style={{ marginBottom: 56 }}>
        <div style={{ marginBottom: 18, borderLeft: '3px solid #1D9E75', paddingLeft: 14 }}>
            <div style={{ color: '#fff', fontSize: 17, fontWeight: 800 }}>{title}</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
            {children}
        </div>
    </div>
);

const detailProps = { onBack: noop, onAck: noop, onReportArrival: noop, onReportDone: noop };

// ─── GALLERY ───────────────────────────────────────────────────────────────
export default function FateModelGallery() {
    return (
        <div style={{
            minHeight: '100vh', width: '100%', fontFamily: FONT,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '40px 36px 80px', boxSizing: 'border-box',
        }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            <div style={{ marginBottom: 40 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Fate · Model App
                </div>
                <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                    Page Gallery — Home + Detail per phase
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, maxWidth: 720, lineHeight: 1.6 }}>
                    Sisi model: konfirmasi keikutsertaan, lapor hadir & selesai (selfie = bukti + timestamp),
                    selisih jadwal jadi fakta terkunci. Satu frame Detail per phase. Frame interaktif.
                </div>
            </div>

            <Section title="Home" sub="Daftar project — butuh aksi di atas, selesai di bawah (redup)">
                <Frame id="H1" title="Home" badge="HOME" desc="Semua phase tercampur, urut prioritas">
                    <ScreenHome projects={SEED} onOpen={noop} />
                </Frame>
            </Section>

            <Section title="Detail Project — per phase" sub="Aksi berubah mengikuti phase: konfirmasi → lapor hadir → lapor selesai">
                <Frame id="D1" title="assigned" badge="PHASE" desc="p3 Loka · perlu konfirmasi keikutsertaan">
                    <ScreenDetail project={byId('p3')} {...detailProps} />
                </Frame>
                <Frame id="D2" title="ready" badge="PHASE" desc="p2 Nara · waktunya lapor hadir (selfie)">
                    <ScreenDetail project={byId('p2')} {...detailProps} />
                </Frame>
                <Frame id="D3" title="present" badge="PHASE" desc="p1 Aveda · sedang berjalan → lapor selesai">
                    <ScreenDetail project={byId('p1')} {...detailProps} />
                </Frame>
                <Frame id="D4" title="awaiting" badge="PHASE" desc="p5 Bloom · selisih 1j 35m menunggu konfirmasi brand">
                    <ScreenDetail project={byId('p5')} {...detailProps} />
                </Frame>
                <Frame id="D5" title="closed" badge="PHASE" desc="p6 Sana · selesai, dikonfirmasi brand">
                    <ScreenDetail project={byId('p6')} {...detailProps} />
                </Frame>
            </Section>

            <Section title="Selfie — bukti + timestamp" sub="Waktu tercatat saat tap, bukan saat terkirim">
                <Frame id="M1" title="SelfieModal — hadir" badge="MODAL" desc="Di atas Detail phase ready">
                    <ScreenDetail project={byId('p2')} {...detailProps} />
                    <SelfieModal
                        title="Selfie hadir di venue"
                        sub="Bukti kamu tiba di lokasi. Waktu tercatat saat kamu tap, bukan saat terkirim."
                        onDone={noop} onCancel={noop}
                    />
                </Frame>
            </Section>
        </div>
    );
}
