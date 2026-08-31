import React, { useEffect, useState } from "react";

/**
 * AUTSORZ — Pendataan Meter (putaran nol)
 * Dikerjakan SEKALI per meter, seumur hidup meter itu.
 *
 * Yang membedakan layar ini dari pembacaan bulanan: bukan angkanya yang penting,
 * tapi PEMETAAN — memastikan meter yang di depan mata benar milik unit ini.
 * Salah petakan = dua tenant salah tagih tiap bulan, angkanya tetap masuk akal,
 * dan tidak ada satu pun pemeriksaan lain yang bisa menangkapnya.
 *
 * Empat keputusan yang dikunci di sini:
 *
 * 1. SEED SPREADSHEET DIPAKAI SEBAGAI PEMERIKSA PEMETAAN.
 *    Paskal sudah punya angka terakhir tiap unit. Meter air tidak bisa mundur,
 *    dan pemakaian sebulan punya rentang wajar. Jadi begitu petugas mengetik
 *    angka di meter yang ia hadapi, sistem bisa bilang "angka ini tidak mungkin
 *    milik A-14" — tanpa menuduh, dan tanpa data baru apa pun.
 *
 * 2. TINGKAT KEYAKINAN PEMETAAN DICATAT, TIDAK DIPAKSA.
 *    Diuji aliran (kuat) · label fisik (sedang) · ikut daftar kantor (lemah).
 *    Yang lemah tetap boleh lewat — kalau dilarang, pendataan tidak akan pernah
 *    selesai. Tapi ia ditandai, dan tandanya ikut sampai ke sengketa tagihan.
 *
 * 3. URUTAN KELILING = TURUNAN, BUKAN INPUT.
 *    Urutan orang mendata ADALAH urutan jalan kaki yang benar. Rekam, jangan tanya.
 *
 * 4. PENDATAAN ADALAH PEMBACAAN.
 *    Angka yang tercatat di sini jadi pembanding untuk putaran berikutnya —
 *    jadi putaran pertama sudah punya jaring pengaman, bukan telanjang.
 *
 * Catatan kejujuran yang harus disampaikan ke pengelola: kalau angka awal
 * diimpor dari spreadsheet, tagihan bulan pertama = (bacaan terbukti) dikurangi
 * (angka spreadsheet tanpa bukti). Baru mulai bulan kedua dua-duanya terbukti.
 */

/* ------------------------------------------------------------------ data */

const SITE = { nama: "Paskal Hypersquare", total: 214, bulanSeed: "Juli" };

// TODO: seed dari spreadsheet Paskal (unit, angka terakhir, rata-rata pemakaian).
const UNITS = [
    { id: "A-14", blok: "Blok Utara", seed: 1234, rata: 37, aktual: 1268 },
    { id: "A-15", blok: "Blok Utara", seed: 512, rata: 27, aktual: 548 },
    { id: "A-16", blok: "Blok Timur", seed: 2003, rata: 29, aktual: 2041 },
    { id: "A-17", blok: "Blok Timur", seed: 1447, rata: 49, aktual: 1488 },
    { id: "A-18", blok: "Blok Barat", seed: 96, rata: 21, aktual: 121 },
];

const SUDAH = { total: 41, uji: 12, label: 25, daftar: 4 }; // yang sudah didata sebelum sesi ini

const KEYAKINAN = [
    { key: "uji", judul: "Diuji aliran air", ket: "Keran di ruko dibuka, meter ini yang berputar", w: "strong" },
    { key: "label", judul: "Ada label fisik di meter", ket: "Tertulis nomor unit di meter atau di panelnya", w: "info" },
    { key: "daftar", judul: "Ikut daftar kantor saja", ket: "Belum diverifikasi di lapangan — akan ditandai", w: "weak" },
];

/* ---------------------------------------------------------------- tokens */

const C = {
    ink: "#12181f", ink2: "#4a5763", ink3: "#8593a1",
    line: "#e2e7ec", bg: "#f4f6f8", card: "#fff",
    accent: "#0f6e64", accentSoft: "#e6f2f0", accentLine: "#bfdcd7",
    warn: "#b25a06", warnSoft: "#fdf0e0", warnLine: "#f0cfa4",
    bad: "#b3261e", badSoft: "#fdeceb", badLine: "#f3c2be",
    ok: "#1c6b3f", okSoft: "#e7f4ec", okLine: "#bfe0cc",
    dark: "#0d1114", meter: "#14181c",
};
const MONO = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif';

const pad = (v, n) => String(v).padStart(n, "0");
const fmt = (v, n) => { const s = pad(v, n); return n > 3 ? `${s.slice(0, n - 3)} ${s.slice(n - 3)}` : s; };
const tone = (w) => ({
    strong: { bg: C.okSoft, fg: C.ok, bd: C.okLine },
    weak: { bg: C.warnSoft, fg: C.warn, bd: C.warnLine },
    bad: { bg: C.badSoft, fg: C.bad, bd: C.badLine },
    info: { bg: "#eef1f4", fg: C.ink2, bd: C.line },
}[w]);

/* ------------------------------------------------------------ potongan UI */

function Pill({ w = "info", children }) {
    const t = tone(w);
    return <span style={{
        display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, padding: "3px 9px",
        borderRadius: 99, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
    }}>{children}</span>;
}

function Btn({ variant = "solid", style, children, ...rest }) {
    const base = { width: "100%", border: 0, borderRadius: 12, padding: "15px 14px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em", boxSizing: "border-box" };
    const v = {
        solid: { background: C.accent, color: "#fff" },
        outline: { background: "#fff", color: C.ink, border: `1.5px solid ${C.line}` },
        ghost: { background: "transparent", color: C.ink2, fontWeight: 650, fontSize: 14, padding: 12 },
    }[variant];
    const dis = rest.disabled ? { background: "#c6cfd6", color: "#8b98a3", cursor: "not-allowed", border: 0 } : null;
    return <button {...rest} style={{ ...base, ...v, ...dis, ...style }}>{children}</button>;
}

const Sec = ({ n, judul, anak, children }) => (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: anak ? 3 : 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: 99, background: C.accentSoft, color: C.accent, fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", flex: "0 0 20px" }}>{n}</span>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>{judul}</span>
        </div>
        {anak && <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5, margin: "0 0 10px 28px" }}>{anak}</div>}
        {children}
    </div>
);

function MukaMeter({ value, digits, caption, kecil }) {
    const s = pad(value, digits).split("");
    const w = kecil ? 20 : 26, h = kecil ? 28 : 36, f = kecil ? 17 : 22;
    return (
        <div style={{ background: "#f0ece2", borderRadius: 10, padding: kecil ? "9px 8px 7px" : "13px 12px 11px", border: `${kecil ? 4 : 5}px solid #6b6f73`, maxWidth: 300, margin: "0 auto" }}>
            <div style={{ fontSize: 9.5, color: "#5c5f63", fontWeight: 700, letterSpacing: ".06em", marginBottom: 7 }}>{caption}</div>
            <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                {s.map((d, i) => <div key={i} style={{ width: w, height: h, background: C.meter, color: "#fff", borderRadius: 3, display: "grid", placeItems: "center", fontSize: f, fontWeight: 700, fontFamily: MONO }}>{d}</div>)}
                <div style={{ width: 5 }} />
                {["3", "4", "5"].map((d, i) => <div key={i} style={{ width: w, height: h, background: C.bad, color: "#fff", borderRadius: 3, display: "grid", placeItems: "center", fontSize: f, fontWeight: 700, fontFamily: MONO }}>{d}</div>)}
            </div>
            <div style={{ fontSize: 9, color: "#5c5f63", marginTop: 5, fontFamily: MONO }}>B21-44719••</div>
        </div>
    );
}

function useNarrow(bp = 560) {
    const [n, setN] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
    useEffect(() => {
        const f = () => setN(window.innerWidth < bp);
        f(); window.addEventListener("resize", f); window.addEventListener("orientationchange", f);
        return () => { window.removeEventListener("resize", f); window.removeEventListener("orientationchange", f); };
    }, [bp]);
    return n;
}

/* ------------------------------------------------------------ layar utama */

export default function PendataanMeter({ preview = true }) {
    const [idx, setIdx] = useState(0);
    const [fase, setFase] = useState("scan");     // scan | foto | form | selesai
    const [angka, setAngka] = useState("");
    const [digits, setDigits] = useState(5);
    const [seri, setSeri] = useState("");
    const [fotoBadan, setFotoBadan] = useState(false);
    const [yakin, setYakin] = useState(null);
    const [rekam, setRekam] = useState([]);       // hasil pendataan sesi ini — urutannya = urutan keliling

    const unit = UNITS[idx];
    const terdata = SUDAH.total + rekam.length;

    useEffect(() => {
        if (fase === "scan" && unit) {
            const t = setTimeout(() => setFase("foto"), 1400);
            return () => clearTimeout(t);
        }
    }, [fase, unit]);

    const reset = () => { setAngka(""); setDigits(5); setSeri(""); setFotoBadan(false); setYakin(null); setFase("scan"); };

    /* --- pemeriksaan pemetaan: seed spreadsheet dipakai sebagai penjaga --- */
    const v = angka.length === digits ? parseInt(angka, 10) : null;
    let cek = null;
    if (v != null) {
        const selisih = v - unit.seed;
        if (selisih < 0) cek = {
            w: "bad", judul: "Hampir pasti bukan meter unit ini",
            teks: `Catatan ${SITE.bulanSeed} untuk ${unit.id} adalah ${fmt(unit.seed, digits)}. Meter air tidak bisa berkurang. Kemungkinan besar kamu sedang berdiri di meter unit lain — atau meter ini pernah diganti.`,
        };
        else if (selisih > unit.rata * 4) cek = {
            w: "weak", judul: "Angkanya jauh dari kebiasaan unit ini",
            teks: `Selisih ${selisih} m³ dari catatan ${SITE.bulanSeed}, padahal ${unit.id} biasanya sekitar ${unit.rata} m³ per bulan. Bisa jadi ini meter unit lain, bisa juga memang ada kebocoran.`,
        };
        else cek = {
            w: "strong", judul: "Cocok dengan riwayat unit ini",
            teks: `Selisih ${selisih} m³ dari catatan ${SITE.bulanSeed} (${fmt(unit.seed, digits)}) — masuk akal untuk sebulan. Pemetaannya konsisten.`,
        };
    }

    const bisaSimpan = v != null && seri.trim().length >= 4 && fotoBadan && yakin && cek?.w !== "bad";

    const simpan = () => {
        setRekam((r) => [...r, { id: unit.id, urutan: r.length + 1, nilai: v, digits, seri: seri.trim(), yakin }]);
        if (idx + 1 < UNITS.length) { setIdx(idx + 1); reset(); }
        else setFase("selesai");
    };

    /* ------------------------------------------------------------- selesai */
    if (fase === "selesai") {
        const mix = rekam.reduce((a, r) => ({ ...a, [r.yakin]: (a[r.yakin] || 0) + 1 }), {});
        return (
            <Shell preview={preview}>
                <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
                    <div style={{ fontSize: 40, textAlign: "center" }}>✓</div>
                    <h2 style={{ margin: "6px 0 4px", fontSize: 20, textAlign: "center", letterSpacing: "-0.02em" }}>{rekam.length} meter terdata sesi ini</h2>
                    <p style={{ fontSize: 13.5, color: C.ink2, textAlign: "center", margin: "0 0 16px", lineHeight: 1.55 }}>
                        Total {terdata} dari {SITE.total} unit.
                    </p>

                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 9 }}>Urutan keliling yang terekam</div>
                        <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 10 }}>
                            Urutanmu mendata dipakai sebagai urutan keliling bulan-bulan berikutnya. Tidak ada yang perlu disusun manual.
                        </div>
                        {rekam.map((r) => (
                            <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.line}` }}>
                                <span style={{ width: 22, height: 22, borderRadius: 99, background: "#eef1f4", color: C.ink2, fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center" }}>{r.urutan}</span>
                                <span style={{ fontWeight: 650, fontSize: 14 }}>{r.id}</span>
                                <span style={{ fontFamily: MONO, fontSize: 12.5, color: C.ink2 }}>{r.seri}</span>
                                <span style={{ marginLeft: "auto", fontFamily: MONO, fontWeight: 700, fontSize: 13 }}>{fmt(r.nilai, r.digits)}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Seberapa kuat pemetaannya</div>
                        <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 11 }}>
                            Angka ini yang menentukan seberapa berani Paskal saat ada tenant protes. Yang lemah bisa dinaikkan kapan saja dengan uji aliran.
                        </div>
                        {KEYAKINAN.map((k) => (
                            <div key={k.key} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0" }}>
                                <Pill w={k.w}>{k.judul}</Pill>
                                <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 14 }}>
                                    {(mix[k.key] || 0) + (k.key === "uji" ? SUDAH.uji : k.key === "label" ? SUDAH.label : SUDAH.daftar)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <Footer><Btn variant="outline" onClick={() => { setIdx(0); setRekam([]); reset(); }}>Ulang simulasi</Btn></Footer>
            </Shell>
        );
    }

    /* -------------------------------------------------------------- kepala */
    const kepala = (
        <div style={{ flex: "0 0 auto", background: C.card, borderBottom: `1px solid ${C.line}`, padding: "10px 14px 11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: ".07em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>
                        Pendataan awal · titik ke-{terdata + 1}
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 1 }}>
                        {unit.id} <span style={{ fontSize: 13, fontWeight: 500, color: C.ink2 }}>· {unit.blok}</span>
                    </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right", flex: "0 0 auto" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{terdata}/{SITE.total}</div>
                    <div style={{ fontSize: 11, color: C.ink3 }}>terdata</div>
                </div>
            </div>
        </div>
    );

    /* ------------------------------------------------------- scan & kamera */
    if (fase === "scan" || fase === "foto") {
        return (
            <Shell preview={preview}>
                {kepala}
                <div style={{ flex: 1, background: C.dark, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 0 }}>
                    <div style={{ color: "#e6ecf0", fontSize: 12.5, textAlign: "center", lineHeight: 1.55, marginBottom: 14, maxWidth: 290 }}>
                        {fase === "scan"
                            ? <>Tempel stiker <b>{unit.id}</b> di dekat meternya, lalu arahkan kamera ke stikernya.<br />
                                <span style={{ color: "#9fb0bb" }}>Scan memastikan stikernya terbaca dan tidak tertukar.</span></>
                            : "Foto muka meternya. Angka harus terlihat jelas — foto ini yang dipakai kalau ada sengketa bertahun-tahun ke depan."}
                    </div>
                    <div style={{ width: 262, height: 178, border: "2px solid rgba(255,255,255,.5)", borderRadius: 12, display: "grid", placeItems: "center" }}>
                        {fase === "scan"
                            ? <div style={{ width: 110, height: 110, background: "#fff", borderRadius: 10, display: "grid", placeItems: "center", padding: 8 }}><Qr /></div>
                            : <div style={{ transform: "scale(.78)" }}><MukaMeter value={unit.aktual} digits={5} caption={`WATER METER · ${unit.id}`} /></div>}
                    </div>
                    {fase === "foto" && (
                        <button aria-label="Ambil foto" onClick={() => setFase("form")} style={{ position: "absolute", bottom: 20, width: 64, height: 64, borderRadius: 99, background: "#fff", border: "5px solid rgba(255,255,255,.35)", cursor: "pointer" }} />
                    )}
                </div>
            </Shell>
        );
    }

    /* ---------------------------------------------------------------- form */
    return (
        <Shell preview={preview}>
            {kepala}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px", minHeight: 0 }}>

                <Sec n="1" judul="Angka di meter sekarang" anak="Salin kotak hitam saja. Angka ini jadi pembanding untuk putaran bulan depan.">
                    <div style={{ background: "#1b2126", borderRadius: 12, padding: 11, marginBottom: 12 }}>
                        <MukaMeter value={unit.aktual} digits={5} caption="FOTO KAMU · 09:41" kecil />
                    </div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                        {Array.from({ length: digits }).map((_, i) => {
                            const has = i < angka.length;
                            return <div key={i} style={{
                                width: 40, height: 52, borderRadius: 7, background: has ? C.meter : "#232a30",
                                color: has ? "#fff" : "#4d5a64", display: "grid", placeItems: "center", fontSize: 25,
                                fontWeight: 700, fontFamily: MONO,
                                border: `2px solid ${i === angka.length ? C.accent : "transparent"}`,
                            }}>{has ? angka[i] : "·"}</div>;
                        })}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => <Key key={k} onClick={() => setAngka((a) => a.length < digits ? a + k : a)}>{k}</Key>)}
                        <div />
                        <Key onClick={() => setAngka((a) => a.length < digits ? a + "0" : a)}>0</Key>
                        <Key util onClick={() => setAngka((a) => a.slice(0, -1))}>⌫</Key>
                    </div>
                </Sec>

                {/* pemeriksaan pemetaan — melekat, bukan modal: orangnya mungkin harus pindah meter */}
                {cek && (
                    <div style={{ background: tone(cek.w).bg, border: `1.5px solid ${tone(cek.w).bd}`, borderRadius: 14, padding: 13, marginBottom: 10 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: tone(cek.w).fg, marginBottom: 4 }}>{cek.judul}</div>
                        <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink2 }}>{cek.teks}</div>
                        {cek.w === "bad" && (
                            <div style={{ fontSize: 12, color: C.bad, marginTop: 8, fontWeight: 650 }}>
                                Pendataan tidak bisa disimpan sampai angkanya diperbaiki atau kamu pindah ke meter yang benar.
                            </div>
                        )}
                    </div>
                )}

                <Sec n="2" judul="Jumlah angka di meter ini">
                    <div style={{ display: "flex", gap: 8 }}>
                        {[4, 5, 6].map((d) => (
                            <button key={d} onClick={() => { setDigits(d); setAngka((a) => a.slice(0, d)); }} style={{
                                flex: 1, padding: "11px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                                border: `1.5px solid ${digits === d ? C.accent : C.line}`,
                                background: digits === d ? C.accentSoft : "#fff",
                                fontWeight: 700, fontSize: 14, color: digits === d ? C.accent : C.ink2,
                            }}>{d} angka</button>
                        ))}
                    </div>
                </Sec>

                <Sec n="3" judul="Nomor meter" anak="Diketik sekali seumur hidup meter ini. Nanti cuma ditampilkan untuk dicocokkan mata — kalau suatu bulan nomornya beda, berarti meternya diganti.">
                    <input value={seri} onChange={(e) => setSeri(e.target.value.toUpperCase())} placeholder="mis. B21-4471902"
                        style={{ width: "100%", padding: "12px 13px", borderRadius: 10, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: MONO, letterSpacing: ".04em", boxSizing: "border-box", color: C.ink }} />
                    <button onClick={() => setFotoBadan(true)} style={{
                        width: "100%", marginTop: 9, padding: "13px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${fotoBadan ? C.okLine : C.line}`, background: fotoBadan ? C.okSoft : "#fff",
                        color: fotoBadan ? C.ok : C.ink2, fontWeight: 700, fontSize: 13.5,
                    }}>{fotoBadan ? "✓ Foto badan meter tersimpan" : "Foto badan meter (nomornya)"}</button>
                </Sec>

                <Sec n="4" judul="Dari mana kamu tahu ini meter unit ini?" anak="Ini pertanyaan terpenting di seluruh pendataan. Jawaban jujur lebih berguna daripada jawaban bagus.">
                    {KEYAKINAN.map((k) => (
                        <button key={k.key} onClick={() => setYakin(k.key)} style={{
                            display: "block", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                            border: `1.5px solid ${yakin === k.key ? C.accent : C.line}`, background: yakin === k.key ? C.accentSoft : "#fff",
                            borderRadius: 12, padding: "11px 13px", marginBottom: 7, boxSizing: "border-box",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{k.judul}</span>
                                <span style={{ marginLeft: "auto" }}><Pill w={k.w}>{k.w === "strong" ? "bukti kuat" : k.w === "weak" ? "bukti lemah" : "bukti sedang"}</Pill></span>
                            </div>
                            <div style={{ fontSize: 12, color: C.ink2, marginTop: 3, lineHeight: 1.45 }}>{k.ket}</div>
                        </button>
                    ))}
                </Sec>
            </div>

            <Footer>
                <Btn disabled={!bisaSimpan} onClick={simpan}>
                    {idx + 1 < UNITS.length ? `Simpan & lanjut ke ${UNITS[idx + 1].id}` : "Simpan & selesai"}
                </Btn>
                {!bisaSimpan && (
                    <div style={{ fontSize: 11.5, color: C.ink3, textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
                        {cek?.w === "bad" ? "Pemetaannya belum masuk akal — perbaiki dulu." : "Lengkapi angka, nomor meter, fotonya, dan asal keyakinanmu."}
                    </div>
                )}
            </Footer>
        </Shell>
    );
}

/* ------------------------------------------------------------ pembungkus */

function Key({ util, children, ...rest }) {
    return <button {...rest} style={{
        padding: "13px 0", fontSize: util ? 15 : 21, fontWeight: util ? 700 : 650, borderRadius: 10,
        border: `1px solid ${C.line}`, background: util ? "#eef1f4" : "#fff", color: util ? C.ink2 : C.ink,
        cursor: "pointer", fontFamily: "inherit",
    }}>{children}</button>;
}

const Footer = ({ children }) => (
    <div style={{ flex: "0 0 auto", padding: "12px 14px 16px", background: C.card, borderTop: `1px solid ${C.line}` }}>{children}</div>
);

function Shell({ preview, children }) {
    const narrow = useNarrow();
    const app = (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, color: C.ink, fontFamily: FONT, position: "relative", overflow: "hidden", WebkitTextSizeAdjust: "100%" }}>
            {children}
        </div>
    );
    if (!preview || narrow) return <div style={{ height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }}>{app}</div>;
    return (
        <div style={{ display: "grid", placeItems: "center", padding: 24, background: "#e9edf1", minHeight: "100vh" }}>
            <div style={{ width: 390, height: 800, borderRadius: 38, border: "9px solid #10161c", overflow: "hidden", boxShadow: "0 18px 50px rgba(16,24,32,.22)", background: C.bg }}>{app}</div>
        </div>
    );
}

function Qr() {
    return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" shapeRendering="crispEdges">
            <rect width="100" height="100" fill="#fff" />
            <g fill="#111"><path d="M6 6h26v26H6z" /><path d="M68 6h26v26H68z" /><path d="M6 68h26v26H6z" /></g>
            <g fill="#fff"><path d="M12 12h14v14H12z" /><path d="M74 12h14v14H74z" /><path d="M12 74h14v14H12z" /></g>
            <g fill="#111">
                <path d="M16 16h6v6h-6z" /><path d="M78 16h6v6h-6z" /><path d="M16 78h6v6h-6z" />
                <path d="M40 8h6v6h-6zM52 8h6v6h-6zM40 20h6v6h-6zM58 20h6v6h-6zM46 26h6v6h-6z" />
                <path d="M8 40h6v6H8zM20 40h6v6h-6zM32 46h6v6h-6zM8 52h6v6H8zM26 52h6v6h-6zM14 58h6v6h-6z" />
                <path d="M40 40h6v6h-6zM52 40h6v6h-6zM46 46h6v6h-6zM40 52h6v6h-6zM58 52h6v6h-6zM64 40h6v6h-6zM70 46h6v6h-6zM82 40h6v6h-6zM88 52h6v6h-6zM70 58h6v6h-6z" />
                <path d="M40 64h6v6h-6zM52 70h6v6h-6zM40 82h6v6h-6zM58 88h6v6h-6zM46 76h6v6h-6z" />
                <path d="M64 70h6v6h-6zM76 70h6v6h-6zM88 76h6v6h-6zM70 82h6v6h-6zM82 88h6v6h-6zM64 88h6v6h-6z" />
            </g>
        </svg>
    );
}