import React, { useEffect, useState } from "react";

/**
 * AUTSORZ — Pendataan Meter (putaran nol)
 * Revisi 18 Agustus 2026: DUA SITE, digit hitam/merah, nomor seri opsional.
 *
 * Dikerjakan SEKALI per meter, seumur hidup meter itu.
 * Yang penting di layar ini bukan angkanya, tapi PEMETAAN — memastikan meter
 * di depan mata benar milik unit ini. Salah petakan = dua tenant salah tagih
 * tiap bulan, angkanya tetap masuk akal, dan tidak ada pemeriksaan lain yang
 * bisa menangkapnya.
 *
 * ====================== YANG BERUBAH DI REVISI INI ======================
 *
 * 1. DUA SITE dengan perlakuan berbeda:
 *    Kawasan Ruko — TIDAK ada stiker QR (area umum, bisa dicopot orang).
 *                   Meter di carport tiap ruko, jadi unit-nya tidak ambigu;
 *                   petugas melanjutkan urutan, tidak memilih.
 *                   5 kotak hitam, merah tidak dicatat.
 *    Paskal Lodge — stiker QR dipasang (meter menempel di dinding, terlindung).
 *                   5 kotak hitam + 2 kotak merah → nilai = angka ÷ 100.
 *
 * 2. JUMLAH DIGIT DIISI SEBAGAI DUA ANGKA (hitam & merah), bukan satu angka.
 *    Config site jadi nilai awal, tapi tetap bisa dikoreksi per meter karena
 *    di lapangan bisa saja ada meter yang beda dari kebanyakan.
 *    Kalau disimpan sebagai satu angka "7", letak komanya hilang dan tagihan
 *    bisa meleset 10×.
 *
 * 3. NOMOR SERI OPSIONAL — sebagian meter jadul memang tidak bernomor.
 *    Butuh status EKSPLISIT "meter ini tidak bernomor", bukan kolom kosong:
 *    kolom kosong tidak bisa dibedakan dari "belum diisi".
 *    Untuk meter itu, pendeteksi "meter diganti" hilang, dan keyakinan
 *    pemetaannya ikut turun — ditampilkan apa adanya.
 *
 * ========================== DOKTRIN (tidak berubah) =====================
 * - SEED SPREADSHEET DIPAKAI SEBAGAI PENJAGA PEMETAAN. Meter air tidak bisa
 *   mundur dan pemakaian sebulan punya rentang wajar, jadi angka yang diketik
 *   di lapangan langsung menguji apakah meter itu mungkin milik unit tersebut.
 *   INI SATU-SATUNYA TEMPAT DI SELURUH SISTEM YANG MEMBLOKIR.
 * - TIGA TINGKAT KEYAKINAN dicatat, yang lemah tetap boleh lewat tapi ditandai.
 * - URUTAN KELILING = TURUNAN dari urutan pendataan. Rekam, jangan tanya.
 * - PENDATAAN ADALAH PEMBACAAN → putaran pertama sudah punya pembanding.
 */

/* ------------------------------------------------------------------ config */

const SITES = {
    kawasan: { nama: "Kawasan Ruko", hitam: 5, merah: 0, stiker: false, letak: "di carport, terhalang teras" },
    lodge: { nama: "Paskal Lodge", hitam: 5, merah: 2, stiker: true, letak: "menempel di dinding" },
};

/** seedRaw & rataRaw = bilangan bulat mentah dari spreadsheet Paskal. */
const UNITS = [
    { id: "A-14", site: "kawasan", blok: "Blok 3", seedRaw: 1234, rataRaw: 37, aktualRaw: 1268 },
    { id: "A-15", site: "kawasan", blok: "Blok 3", seedRaw: 512, rataRaw: 27, aktualRaw: 548 },
    { id: "A-16", site: "kawasan", blok: "Blok 3", seedRaw: 2003, rataRaw: 29, aktualRaw: 2041 },
    { id: "L-07", site: "lodge", blok: "Lantai 2", seedRaw: 12845, rataRaw: 320, aktualRaw: 13162 },
    { id: "L-08", site: "lodge", blok: "Lantai 2", seedRaw: 9310, rataRaw: 270, aktualRaw: 9585 },
];

const SUDAH = { kawasan: { total: 41, uji: 12, label: 25, daftar: 4 }, lodge: { total: 6, uji: 4, label: 2, daftar: 0 } };

const KEYAKINAN = [
    { key: "uji", judul: "Diuji aliran air", ket: "Keran di unit dibuka, meter ini yang berputar", w: "strong" },
    { key: "label", judul: "Ada label fisik di meter", ket: "Tertulis nomor unit di meter atau di sekitarnya", w: "info" },
    { key: "daftar", judul: "Ikut daftar kantor saja", ket: "Belum diverifikasi di lapangan — akan ditandai", w: "weak" },
];

const BULAN_SEED = "Juli";

/* ---------------------------------------------------------------- tokens */

const C = {
    ink: "#12181f", ink2: "#4a5763", ink3: "#8593a1",
    line: "#e2e7ec", bg: "#f4f6f8", card: "#fff",
    accent: "#0f6e64", accentSoft: "#e6f2f0",
    warn: "#b25a06", warnSoft: "#fdf0e0", warnLine: "#f0cfa4",
    bad: "#b3261e", badSoft: "#fdeceb", badLine: "#f3c2be",
    ok: "#1c6b3f", okSoft: "#e7f4ec", okLine: "#bfe0cc",
    dark: "#0d1114", meter: "#14181c",
};
const MONO = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif';

const tone = (w) => ({
    strong: { bg: C.okSoft, fg: C.ok, bd: C.okLine },
    weak: { bg: C.warnSoft, fg: C.warn, bd: C.warnLine },
    bad: { bg: C.badSoft, fg: C.bad, bd: C.badLine },
    info: { bg: "#eef1f4", fg: C.ink2, bd: C.line },
}[w]);

const pad = (v, n) => String(v).padStart(n, "0");

function fmtRaw(raw, hitam, merah) {
    const t = pad(raw, hitam + merah);
    const hi = t.slice(0, hitam), lo = t.slice(hitam);
    const hiS = hitam > 3 ? `${hi.slice(0, hitam - 3)} ${hi.slice(hitam - 3)}` : hi;
    return merah ? `${hiS},${lo}` : hiS;
}
function m3(rawDelta, merah) {
    const v = rawDelta / Math.pow(10, merah);
    return merah ? v.toFixed(merah).replace(".", ",") : String(v);
}

/* ------------------------------------------------------------ potongan UI */

function Pill({ w = "info", children }) {
    const t = tone(w);
    return <span style={{
        display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, padding: "4px 9px",
        borderRadius: 99, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, whiteSpace: "nowrap",
    }}>{children}</span>;
}

function Btn({ variant = "solid", style, children, ...rest }) {
    const base = { width: "100%", border: 0, borderRadius: 12, padding: "15px 14px", fontSize: 15.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em", boxSizing: "border-box" };
    const v = {
        solid: { background: C.accent, color: "#fff" },
        outline: { background: "#fff", color: C.ink, border: `1.5px solid ${C.line}` },
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

function MukaMeter({ raw, hitam, merah, caption, kecil }) {
    const t = pad(raw, hitam + merah);
    const h = t.slice(0, hitam).split("");
    const r = merah ? t.slice(hitam).split("") : ["3", "4", "5"];
    const W = kecil ? 21 : 26, H = kecil ? 29 : 36, F = kecil ? 17 : 22;
    const box = (d, i, red) => (
        <div key={(red ? "r" : "h") + i} style={{
            width: W, height: H, background: red ? C.bad : C.meter, color: "#fff", borderRadius: 3,
            display: "grid", placeItems: "center", fontSize: F, fontWeight: 700, fontFamily: MONO,
        }}>{d}</div>
    );
    return (
        <div style={{ background: "#f0ece2", borderRadius: 10, padding: kecil ? "9px 6px 7px" : "13px 8px 11px", border: `${kecil ? 4 : 5}px solid #6b6f73`, maxWidth: 300, margin: "0 auto" }}>
            <div style={{ fontSize: 9.5, color: "#5c5f63", fontWeight: 700, letterSpacing: ".06em", marginBottom: 7 }}>{caption}</div>
            <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                {h.map((d, i) => box(d, i, false))}
                <div style={{ width: 5 }} />
                {r.map((d, i) => box(d, i, true))}
            </div>
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
    const [siteKey, setSiteKey] = useState("kawasan");
    const site = SITES[siteKey];
    const daftar = UNITS.filter((u) => u.site === siteKey);

    const [idx, setIdx] = useState(0);
    const [fase, setFase] = useState(site.stiker ? "scan" : "foto");
    const [angka, setAngka] = useState("");
    const [hitam, setHitam] = useState(site.hitam);
    const [merah, setMerah] = useState(site.merah);
    const [seri, setSeri] = useState("");
    const [tanpaSeri, setTanpaSeri] = useState(false);
    const [fotoBadan, setFotoBadan] = useState(false);
    const [yakin, setYakin] = useState(null);
    const [rekam, setRekam] = useState([]);

    const unit = daftar[idx];
    const panjang = hitam + merah;
    const terdata = SUDAH[siteKey].total + rekam.length;

    useEffect(() => {
        if (fase === "scan" && unit && site.stiker) {
            const t = setTimeout(() => setFase("foto"), 1400);
            return () => clearTimeout(t);
        }
    }, [fase, unit, site.stiker]);

    const resetUnit = (s = site) => {
        setAngka(""); setHitam(s.hitam); setMerah(s.merah); setSeri(""); setTanpaSeri(false);
        setFotoBadan(false); setYakin(null); setFase(s.stiker ? "scan" : "foto");
    };

    const gantiSite = (k) => { setSiteKey(k); setIdx(0); setRekam([]); resetUnit(SITES[k]); };

    /* --- penjaga pemetaan: seed spreadsheet dipakai sebagai pemeriksa --- */
    const v = angka.length === panjang ? parseInt(angka, 10) : null;
    let cek = null;
    if (v != null) {
        const d = v - unit.seedRaw;
        if (d < 0) cek = {
            w: "bad", judul: "Hampir pasti bukan meter unit ini",
            teks: `Catatan ${BULAN_SEED} untuk ${unit.id} adalah ${fmtRaw(unit.seedRaw, hitam, merah)}. Meter air tidak bisa berkurang. Kemungkinan besar kamu sedang berdiri di meter unit lain — atau meter ini pernah diganti.`,
        };
        else if (d > unit.rataRaw * 4) cek = {
            w: "weak", judul: "Angkanya jauh dari kebiasaan unit ini",
            teks: `Selisih ${m3(d, merah)} m³ dari catatan ${BULAN_SEED}, padahal ${unit.id} biasanya sekitar ${m3(unit.rataRaw, merah)} m³ per bulan. Bisa jadi ini meter unit lain, bisa juga memang ada kebocoran.`,
        };
        else cek = {
            w: "strong", judul: "Cocok dengan riwayat unit ini",
            teks: `Selisih ${m3(d, merah)} m³ dari catatan ${BULAN_SEED} (${fmtRaw(unit.seedRaw, hitam, merah)}) — masuk akal untuk sebulan. Pemetaannya konsisten.`,
        };
    }

    const seriBeres = tanpaSeri || seri.trim().length >= 4;
    const bisaSimpan = v != null && seriBeres && fotoBadan && yakin && cek?.w !== "bad";

    const simpan = () => {
        setRekam((r) => [...r, { id: unit.id, urutan: r.length + 1, raw: v, hitam, merah, seri: tanpaSeri ? null : seri.trim(), yakin }]);
        if (idx + 1 < daftar.length) { setIdx(idx + 1); resetUnit(); }
        else setFase("selesai");
    };

    /* ------------------------------------------------------------- selesai */
    if (fase === "selesai") {
        const mix = rekam.reduce((a, r) => ({ ...a, [r.yakin]: (a[r.yakin] || 0) + 1 }), {});
        return (
            <Shell preview={preview} siteKey={siteKey} onSite={gantiSite}>
                <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
                    <div style={{ fontSize: 40, textAlign: "center" }}>✓</div>
                    <h2 style={{ margin: "6px 0 4px", fontSize: 20, textAlign: "center", letterSpacing: "-0.02em" }}>{rekam.length} meter terdata</h2>
                    <p style={{ fontSize: 13.5, color: C.ink2, textAlign: "center", margin: "0 0 16px", lineHeight: 1.55 }}>{site.nama} · total {terdata} terdata</p>

                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Urutan keliling yang terekam</div>
                        <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 10 }}>
                            Urutanmu mendata dipakai sebagai urutan keliling bulan-bulan berikutnya. Tidak ada yang perlu disusun manual.
                        </div>
                        {rekam.map((r) => (
                            <div key={r.id} style={{ display: "flex", gap: 9, alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.line}` }}>
                                <span style={{ width: 22, height: 22, borderRadius: 99, background: "#eef1f4", color: C.ink2, fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", flex: "0 0 22px" }}>{r.urutan}</span>
                                <span style={{ fontWeight: 650, fontSize: 14 }}>{r.id}</span>
                                <span style={{ fontFamily: MONO, fontSize: 11.5, color: r.seri ? C.ink2 : C.warn, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {r.seri ?? "tanpa nomor"}
                                </span>
                                <span style={{ marginLeft: "auto", fontFamily: MONO, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>{fmtRaw(r.raw, r.hitam, r.merah)}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Seberapa kuat pemetaannya</div>
                        <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 11 }}>
                            Angka ini menentukan seberapa berani Paskal saat ada tenant protes. Yang lemah bisa dinaikkan kapan saja dengan uji aliran.
                        </div>
                        {KEYAKINAN.map((k) => (
                            <div key={k.key} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0" }}>
                                <Pill w={k.w}>{k.judul}</Pill>
                                <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 14 }}>{(mix[k.key] || 0) + SUDAH[siteKey][k.key]}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <Footer><Btn variant="outline" onClick={() => gantiSite(siteKey)}>Ulang simulasi</Btn></Footer>
            </Shell>
        );
    }

    /* -------------------------------------------------------------- kepala */
    const kepala = (
        <div style={{ flex: "0 0 auto", background: C.card, borderBottom: `1px solid ${C.line}`, padding: "10px 14px 11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, letterSpacing: ".07em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>
                        Pendataan awal · {site.nama}
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 1 }}>
                        {unit.id} <span style={{ fontSize: 13, fontWeight: 500, color: C.ink2 }}>· {unit.blok}</span>
                    </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right", flex: "0 0 auto" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700 }}>{terdata}</div>
                    <div style={{ fontSize: 11, color: C.ink3 }}>terdata</div>
                </div>
            </div>
        </div>
    );

    /* -------------------------------------------------------- scan & kamera */
    if (fase === "scan" || fase === "foto") {
        return (
            <Shell preview={preview} siteKey={siteKey} onSite={gantiSite}>
                {kepala}
                <div style={{ flex: 1, background: C.dark, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 0 }}>
                    <div style={{ color: "#e6ecf0", fontSize: 12.5, textAlign: "center", lineHeight: 1.55, marginBottom: 14, maxWidth: 292 }}>
                        {fase === "scan"
                            ? <>Tempel stiker <b>{unit.id}</b> di dekat meternya, lalu arahkan kamera ke stikernya.<br />
                                <span style={{ color: "#9fb0bb" }}>Scan memastikan stikernya terbaca dan tidak tertukar.</span></>
                            : <>Foto muka meternya. Angka harus terlihat jelas — foto ini yang dipakai kalau ada sengketa bertahun-tahun ke depan.<br />
                                <span style={{ color: "#9fb0bb" }}>
                                    Meter {site.letak}.{!site.stiker && " Site ini tanpa stiker QR — unit diambil dari urutan keliling."}
                                </span></>}
                    </div>
                    <div style={{ width: 262, height: 178, border: "2px solid rgba(255,255,255,.5)", borderRadius: 12, display: "grid", placeItems: "center" }}>
                        {fase === "scan"
                            ? <div style={{ width: 110, height: 110, background: "#fff", borderRadius: 10, display: "grid", placeItems: "center", padding: 8 }}><Qr /></div>
                            : <div style={{ transform: "scale(.76)" }}><MukaMeter raw={unit.aktualRaw} hitam={site.hitam} merah={site.merah} caption={`WATER METER · ${unit.id}`} /></div>}
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
        <Shell preview={preview} siteKey={siteKey} onSite={gantiSite}>
            {kepala}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px", minHeight: 0 }}>

                <Sec n="1" judul="Jumlah angka di meter ini"
                    anak={<>Isian nomor 2 mengikuti pilihan ini. <b>Salah pilih di sini = tagihan unit ini meleset 10× atau 100×</b>, jadi cocokkan benar-benar dengan meternya.</>}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.ink2, alignSelf: "center", width: 46 }}>Hitam</span>
                        {[4, 5, 6].map((d) => (
                            <button key={d} onClick={() => { setHitam(d); setAngka(""); }} style={{
                                flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                                border: `1.5px solid ${hitam === d ? C.meter : C.line}`,
                                background: hitam === d ? C.meter : "#fff", color: hitam === d ? "#fff" : C.ink2,
                                fontWeight: 700, fontSize: 14,
                            }}>{d}</button>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.bad, alignSelf: "center", width: 46 }}>Merah</span>
                        {[0, 2, 3].map((d) => (
                            <button key={d} onClick={() => { setMerah(d); setAngka(""); }} style={{
                                flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                                border: `1.5px solid ${merah === d ? C.bad : C.line}`,
                                background: merah === d ? C.bad : "#fff", color: merah === d ? "#fff" : C.ink2,
                                fontWeight: 700, fontSize: 14,
                            }}>{d === 0 ? "tidak dicatat" : d}</button>
                        ))}
                    </div>
                    <div style={{ fontSize: 12, color: C.ink2, marginTop: 9, lineHeight: 1.5 }}>
                        {merah
                            ? <>Angka disimpan mentah, dibaca sebagai <b>angka ÷ {Math.pow(10, merah)}</b> m³.</>
                            : <>Digit merah tidak ikut dicatat — satuannya m³ bulat.</>}
                    </div>
                </Sec>

                <Sec n="2" judul="Angka di meter sekarang" anak="Angka ini jadi pembanding untuk putaran bulan depan.">
                    <div style={{ background: "#1b2126", borderRadius: 12, padding: 11, marginBottom: 12 }}>
                        <MukaMeter raw={unit.aktualRaw} hitam={site.hitam} merah={site.merah} caption="FOTO KAMU · 09:41" kecil />
                        <div style={{ fontSize: 9.5, letterSpacing: ".07em", fontWeight: 800, marginTop: 9, textAlign: "center", color: merah ? "#ffb4ad" : "#9fb0bb" }}>
                            {merah ? `SALIN SEMUA — ${hitam} HITAM DAN ${merah} MERAH` : `SALIN ${hitam} KOTAK HITAM · MERAH TIDAK USAH`}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, justifyContent: "center", alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                        {Array.from({ length: panjang }).map((_, i) => {
                            const has = i < angka.length;
                            const isMerah = i >= hitam;
                            return (
                                <React.Fragment key={i}>
                                    {isMerah && i === hitam && <div style={{ width: 7, textAlign: "center", fontWeight: 800, color: C.ink3 }}>,</div>}
                                    <div style={{
                                        width: panjang > 5 ? 34 : 40, height: panjang > 5 ? 46 : 52, borderRadius: 7,
                                        background: has ? (isMerah ? C.bad : C.meter) : (isMerah ? "#3a2422" : "#232a30"),
                                        color: has ? "#fff" : "#4d5a64", display: "grid", placeItems: "center",
                                        fontSize: panjang > 5 ? 21 : 25, fontWeight: 700, fontFamily: MONO,
                                        border: `2px solid ${i === angka.length ? C.accent : "transparent"}`,
                                    }}>{has ? angka[i] : "·"}</div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
                            <Key key={k} aria-label={`angka ${k}`} onClick={() => setAngka((a) => a.length < panjang ? a + k : a)}>{k}</Key>
                        ))}
                        <div />
                        <Key aria-label="angka 0" onClick={() => setAngka((a) => a.length < panjang ? a + "0" : a)}>0</Key>
                        <Key util aria-label="hapus" onClick={() => setAngka((a) => a.slice(0, -1))}>⌫</Key>
                    </div>
                </Sec>

                {/* penjaga pemetaan — melekat, bukan modal: orangnya mungkin harus pindah meter */}
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

                <Sec n="3" judul="Nomor meter" anak="Diketik sekali seumur hidup meter ini. Nanti cuma ditampilkan untuk dicocokkan mata — kalau suatu bulan nomornya beda, berarti meternya diganti.">
                    <input value={seri} disabled={tanpaSeri}
                        onChange={(e) => setSeri(e.target.value.toUpperCase())}
                        placeholder={siteKey === "lodge" ? "mis. C24-9930118" : "mis. B21-4471902"}
                        style={{
                            width: "100%", padding: "12px 13px", borderRadius: 10, border: `1.5px solid ${C.line}`,
                            fontSize: 15, fontFamily: MONO, letterSpacing: ".04em", boxSizing: "border-box",
                            color: tanpaSeri ? C.ink3 : C.ink, background: tanpaSeri ? "#f2f4f6" : "#fff",
                        }} />
                    <button onClick={() => { setTanpaSeri((t) => !t); setSeri(""); }} style={{
                        width: "100%", marginTop: 8, padding: "12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${tanpaSeri ? C.warnLine : C.line}`, background: tanpaSeri ? C.warnSoft : "#fff",
                        color: tanpaSeri ? C.warn : C.ink2, fontWeight: 700, fontSize: 13.5, boxSizing: "border-box",
                    }}>{tanpaSeri ? "✓ Meter lama — tidak bernomor" : "Meter ini tidak punya nomor"}</button>
                    {tanpaSeri && (
                        <div style={{ fontSize: 12, color: C.ink2, marginTop: 9, lineHeight: 1.5 }}>
                            Dicatat apa adanya. Konsekuensinya: meter ini <b>tidak bisa dicek "apakah masih meter yang sama"</b> di bulan-bulan berikutnya. Kalau kelak diganti dengan meter bernomor, penggantiannya justru akan terdeteksi sendiri.
                        </div>
                    )}
                    <button onClick={() => setFotoBadan(true)} style={{
                        width: "100%", marginTop: 9, padding: "13px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                        border: `1.5px solid ${fotoBadan ? C.okLine : C.line}`, background: fotoBadan ? C.okSoft : "#fff",
                        color: fotoBadan ? C.ok : C.ink2, fontWeight: 700, fontSize: 13.5, boxSizing: "border-box",
                    }}>{fotoBadan ? "✓ Foto badan meter tersimpan" : "Foto badan meter"}</button>
                </Sec>

                <Sec n="4" judul="Dari mana kamu tahu ini meter unit ini?" anak="Ini pertanyaan terpenting di seluruh pendataan. Jawaban jujur lebih berguna daripada jawaban bagus.">
                    {KEYAKINAN.map((k) => (
                        <button key={k.key} onClick={() => setYakin(k.key)} style={{
                            display: "block", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                            border: `1.5px solid ${yakin === k.key ? C.accent : C.line}`, background: yakin === k.key ? C.accentSoft : "#fff",
                            borderRadius: 12, padding: "11px 13px", marginBottom: 7, boxSizing: "border-box",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                    {idx + 1 < daftar.length ? `Simpan & lanjut ke ${daftar[idx + 1].id}` : "Simpan & selesai"}
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

function Shell({ preview, siteKey, onSite, children }) {
    const narrow = useNarrow();
    const app = (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, color: C.ink, fontFamily: FONT, position: "relative", overflow: "hidden", WebkitTextSizeAdjust: "100%" }}>
            {onSite && (
                <div style={{ flex: "0 0 auto", display: "flex", gap: 6, padding: "7px 10px", background: "#eef1f4", borderBottom: "1px dashed #c8d1d9" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: C.ink3, alignSelf: "center", letterSpacing: ".05em" }}>PROTOTIPE</span>
                    {Object.entries(SITES).map(([k, s]) => (
                        <button key={k} onClick={() => onSite(k)} style={{
                            flex: 1, padding: "6px 4px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                            border: `1px solid ${siteKey === k ? C.accent : C.line}`,
                            background: siteKey === k ? "#fff" : "transparent",
                            color: siteKey === k ? C.accent : C.ink2, fontSize: 11.5, fontWeight: 700,
                        }}>{s.nama} · {s.hitam}{s.merah ? `+${s.merah}` : ""}</button>
                    ))}
                </div>
            )}
            {children}
        </div>
    );
    if (!preview || narrow) return <div style={{ height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }}>{app}</div>;
    return (
        <div style={{ display: "grid", placeItems: "center", padding: 24, background: "#e9edf1", minHeight: "100vh" }}>
            <div style={{ width: 390, height: 820, borderRadius: 38, border: "9px solid #10161c", overflow: "hidden", boxShadow: "0 18px 50px rgba(16,24,32,.22)", background: C.bg }}>{app}</div>
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