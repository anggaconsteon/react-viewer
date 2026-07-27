// ═══════════════════════════════════════════════════════════════════════════
// FATE — OPS CONSOLE · PAGE GALLERY
// ═══════════════════════════════════════════════════════════════════════════
// Every screen of Fate_ops_app.jsx side by side in labeled phone frames.
// Frames are live — taps inside work; cross-page navigation is a no-op.
// ═══════════════════════════════════════════════════════════════════════════
import {
    SEED,
    ScreenKokpit,
    ScreenNew,
    ScreenDetail,
    ConfirmModal,
} from './Fate_ops_app.jsx';

const noop = () => { };
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const byId = (id) => SEED.find((p) => p.id === id);

// ─── FRAME CHROME ──────────────────────────────────────────────────────────
const SCALE = 0.8;
const FRAME_W = 390;
const FRAME_H = 760;

const BADGE = {
    HOME: { bg: '#E7F5EF', fg: '#17835F', label: 'HOME' },
    FORM: { bg: '#EAF1FB', fg: '#3B7DD8', label: 'FORM' },
    DETAIL: { bg: '#eef2ff', fg: '#4f46e5', label: 'DETAIL' },
    MODAL: { bg: '#FBF1E3', fg: '#C9822A', label: 'MODAL' },
};

const Frame = ({ id, title, badge = 'DETAIL', desc, children }) => {
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

// ─── GALLERY ───────────────────────────────────────────────────────────────
export default function FateOpsGallery() {
    return (
        <div style={{
            minHeight: '100vh', width: '100%', fontFamily: FONT,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '40px 36px 80px', boxSizing: 'border-box',
        }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');`}</style>

            <div style={{ marginBottom: 40 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Fate · Ops Console
                </div>
                <div style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                    Page Gallery — Kokpit s/d Konfirmasi Selisih
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6, maxWidth: 720, lineHeight: 1.6 }}>
                    Sisi agency: bikin project, monitor lewat anomali (bukan mid-check), konfirmasi selisih
                    atas nama brand. Frame interaktif — navigasi antar page sengaja dimatikan.
                </div>
            </div>

            <Section title="Kokpit & Buat" sub="Landing + entry project baru">
                <Frame id="K1" title="Kokpit" badge="HOME" desc="Perlu perhatian (anomali) + semua project">
                    <ScreenKokpit projects={SEED} onOpen={noop} onNew={noop} />
                </Frame>
                <Frame id="N1" title="Project baru" badge="FORM" desc="Isi brand/jadwal + assign model (identity-bound)">
                    <ScreenNew onBack={noop} onCreate={noop} />
                </Frame>
            </Section>

            <Section title="Detail Project — jejak tiap model" sub="Fakta terkunci (hadir/selesai), badge per phase">
                <Frame id="D1" title="Detail — selisih menunggu" badge="DETAIL" desc="j2 Bloom · model awaiting → tombol proses selisih">
                    <ScreenDetail project={byId('j2')} onBack={noop} onConfirmSelisih={noop} />
                </Frame>
                <Frame id="D2" title="Detail — berjalan" badge="DETAIL" desc="j1 Nara · present + closed">
                    <ScreenDetail project={byId('j1')} onBack={noop} onConfirmSelisih={noop} />
                </Frame>
                <Frame id="D3" title="Detail — akan datang" badge="DETAIL" desc="j3 Loka · assigned + scheduled (belum ack)">
                    <ScreenDetail project={byId('j3')} onBack={noop} onConfirmSelisih={noop} />
                </Frame>
            </Section>

            <Section title="Konfirmasi Selisih — jantung fitur" sub="Catat hasil kontak brand: konfirmasi / keberatan → kunci final">
                <Frame id="M1" title="ConfirmModal" badge="MODAL" desc="Fakta terkunci + catatan + dua hasil aktif">
                    <ScreenDetail project={byId('j2')} onBack={noop} onConfirmSelisih={noop} />
                    <ConfirmModal project={byId('j2')} modelName="Kirana" onResolve={noop} onCancel={noop} />
                </Frame>
            </Section>
        </div>
    );
}
