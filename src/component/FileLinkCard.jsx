import React, { useState } from "react";

/**
 * Consteon — FileLinkCard (viewer)
 * Kasih URL file → render ISI-nya inline.
 *  - gambar (png/jpg/…) → <img>
 *  - pdf                → <iframe> (viewer PDF bawaan browser, no dep)
 *  - lainnya            → fallback: buka di tab baru
 * Semua sumber = link (URL). Paste link atau pilih sample.
 * Dual-export: FileView (widget) + App (demo).
 */

const T = {
  ink: "#0F172A", body: "#334155", muted: "#64748B", faint: "#94A3B8",
  line: "#E2E8F0", card: "#FFFFFF", appBg: "#F1F5F9", link: "#2563EB",
};
const FONT = "'Inter','DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

const IMG_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];

function extOf(url) {
  const m = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(url || "");
  return m ? m[1].toLowerCase() : "";
}
function kindOf(url) {
  const e = extOf(url);
  if (IMG_EXT.includes(e)) return "image";
  if (e === "pdf") return "pdf";
  return "other";
}

// ── Widget: kasih url, render isi ──────────────────────────────
export function FileView({ url, height = 520 }) {
  const kind = kindOf(url);
  if (!url) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: T.faint, fontFamily: FONT, fontSize: 13 }}>
        Belum ada file
      </div>
    );
  }
  if (kind === "image") {
    return (
      <img
        src={url}
        alt="preview"
        style={{ display: "block", width: "100%", height, objectFit: "contain",
          background: "#0F172A", borderRadius: 12, border: `1px solid ${T.line}` }}
      />
    );
  }
  if (kind === "pdf") {
    return (
      <iframe
        src={url}
        title="pdf"
        style={{ display: "block", width: "100%", height, border: `1px solid ${T.line}`, borderRadius: 12 }}
      />
    );
  }
  return (
    <div style={{ padding: 24, textAlign: "center", background: T.card, borderRadius: 12, border: `1px solid ${T.line}`, fontFamily: FONT }}>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 10 }}>
        Tipe <b>.{extOf(url) || "?"}</b> gak bisa di-preview inline.
      </div>
      <a href={url} target="_blank" rel="noreferrer" style={{ color: T.link, fontWeight: 600, fontSize: 14 }}>
        Buka di tab baru ↗
      </a>
    </div>
  );
}

// ── Demo ───────────────────────────────────────────────────────
const SAMPLES = [
  { label: "PDF", url: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" },
  { label: "Gambar", url: "https://picsum.photos/id/1015/900/600" },
  { label: "Gambar 2", url: "https://picsum.photos/id/1025/900/600.jpg" },
];

export default function App() {
  const [url, setUrl] = useState(SAMPLES[0].url);

  return (
    <div style={{ minHeight: "100vh", background: T.appBg, padding: 20, fontFamily: FONT }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: T.ink, margin: "4px 0 12px" }}>
          File Viewer
        </h1>

        {/* Input link */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Tempel URL file (pdf / gambar)…"
            style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.line}`,
              fontSize: 13, fontFamily: FONT, color: T.ink, outline: "none" }}
          />
        </div>

        {/* Sample quick-pick */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {SAMPLES.map((s) => {
            const on = s.url === url;
            return (
              <button
                key={s.label}
                onClick={() => setUrl(s.url)}
                style={{ cursor: "pointer", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${on ? T.link : T.line}`, background: on ? T.link : T.card,
                  color: on ? "#fff" : T.body }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Isi file */}
        <FileView url={url} />
      </div>
    </div>
  );
}
