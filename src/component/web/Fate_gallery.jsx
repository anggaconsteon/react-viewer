// ═══════════════════════════════════════════════════════════════════════════
// FATE — GALLERY LAUNCHER
// ═══════════════════════════════════════════════════════════════════════════
// Both Fate galleries (Ops console + Model app) behind one top-bar switcher.
// No import editing to swap — click a tab.
// ═══════════════════════════════════════════════════════════════════════════
import { useState } from 'react';
import FateOpsGallery from './Fate_ops_gallery.jsx';
import FateModelGallery from './Fate_model_gallery.jsx';
import FateOpsTerbaru from './Fate_ops_app_terbaru.jsx';
import AutsorzOnboarding from './AUTSORZ_onboarding (1).jsx';

const TABS = [
    { key: 'autsorz', label: 'Autsorz Onboarding', Comp: AutsorzOnboarding },
    { key: 'ops2', label: 'Ops (terbaru)', Comp: FateOpsTerbaru },
    { key: 'ops', label: 'Ops Console', Comp: FateOpsGallery },
    { key: 'model', label: 'Model App', Comp: FateModelGallery },
];
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

export default function FateGallery() {
    const [tab, setTab] = useState('autsorz');
    const Active = TABS.find((t) => t.key === tab).Comp;

    return (
        <div style={{ fontFamily: FONT, background: '#0f172a', minHeight: '100vh' }}>
            <div style={{
                position: 'sticky', top: 0, zIndex: 100, display: 'flex', gap: 8, alignItems: 'center',
                padding: '12px 20px', background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(8px)',
                borderBottom: '1px solid #1e293b',
            }}>
                <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 6 }}>
                    Fate
                </span>
                {TABS.map((t) => {
                    const on = t.key === tab;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                padding: '7px 16px', borderRadius: 999, fontFamily: FONT, fontSize: 13.5, fontWeight: 700,
                                cursor: 'pointer', border: `1px solid ${on ? '#1D9E75' : '#334155'}`,
                                background: on ? '#1D9E75' : 'transparent', color: on ? '#fff' : '#94a3b8',
                            }}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
            <Active />
        </div>
    );
}
