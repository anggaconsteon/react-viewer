import React, { useEffect, useRef, useState } from "react";

/**
 * AUTSORZ — Pencatatan Meter Air (layar petugas)
 * Revisi setelah telepon dengan Paskal, 18 Agustus 2026.
 *
 * ============================ YANG BERUBAH ============================
 *
 * 1. DIGIT MERAH TERNYATA DIPAKAI DI SALAH SATU SITE.
 *    Kawasan Ruko  : 5 kotak hitam, merah TIDAK dicatat  → satuan m³
 *    Paskal Lodge  : 5 kotak hitam + 2 kotak merah       → nilai = angka ÷ 100
 *
 *    Config disimpan sebagai DUA angka (hitam, merah), BUKAN satu angka "7".
 *    Kalau disimpan sebagai "7 digit", letak koma hilang: 0013162 bisa berarti
 *    131,62 atau 13,162 — beda 10×, dan itu langsung jadi tagihan yang salah
 *    10 kali lipat.
 *
 *    Bahayanya sekarang DUA ARAH:
 *      - di Kawasan, merah ikut tersalin  → tagihan 1000× kebesaran
 *      - di Lodge, merah lupa disalin     → tagihan  100× kekecilan
 *    Karena itu bentuk & warna kotak isian mengikuti meternya per site.
 *    Ini bukan kosmetik — ini pengaman.
 *
 * 2. QR TIDAK DIPASANG DI KAWASAN (stiker di area umum bisa dicopot orang).
 *    Kawasan  : tanpa gerbang QR. Meter ada di carport ruko masing-masing,
 *               jadi "unit mana" sudah hampir tidak ambigu; petugas melanjutkan
 *               urutan keliling, tidak memilih.
 *    Lodge    : QR dipasang (meter menempel di dinding, lebih terlindung).
 *
 *    Penjaga salah-unit yang sebenarnya BUKAN QR, tapi banding riwayat dari
 *    seed spreadsheet — meter air tidak bisa mundur. Penjaga itu gratis,
 *    permanen, dan tidak bisa dicopot siapa pun.
 *
 * 3. TINGKAT BUKTI DIBACA RELATIF TERHADAP CONFIG SITE.
 *    Di Lodge, "dipilih manual" = penurunan bukti (ada QR tapi tidak dipakai).
 *    Di Kawasan, tidak ada QR sama sekali, jadi itu BUKAN penyimpangan dan
 *    tidak boleh ditandai. Kalau ditandai, semua bacaan Kawasan terlihat
 *    bermasalah → orang belajar mengabaikan tanda → semua penjaga lain mati.
 *
 * ===================== YANG TIDAK BERUBAH (doktrin) =====================
 * - Foto dulu, angka disalin dari foto. Foto WAJIB.
 * - OCR memeriksa, tidak pernah mengisi.
 * - Pemeriksaan jalan saat petugas MASIH di depan meter.
 * - Petugas selalu menang: "angkanya memang segitu" tersimpan apa adanya,
 *   cuma menambah tanda.
 * - Nomor meter ditampilkan untuk dicocokkan mata, tanpa tap konfirmasi.
 *   (Sebagian meter jadul TIDAK punya nomor seri — ditandai apa adanya.)
 * - Tidak ada layar kuitansi; konfirmasi = banner pola WhatsApp.
 */

/* ------------------------------------------------------------------ config */

const SITES = {
    kawasan: {
        nama: "Kawasan Ruko",
        hitam: 5, merah: 0,        // merah tidak dicatat
        gerbangQR: false,          // stiker tidak dipasang — bisa dicopot orang
        letak: "di carport, terhalang teras",
    },
    lodge: {
        nama: "Paskal Lodge",
        hitam: 5, merah: 2,        // nilai asli = angka ÷ 100
        gerbangQR: true,
        letak: "menempel di dinding",
    },
};

/**
 * Semua angka disimpan sebagai BILANGAN BULAT MENTAH (raw), apa adanya seperti
 * yang tertera di meter. Pembagian ke satuan m³ terjadi hanya saat ditampilkan.
 * Ini menghindari kesalahan pembulatan pecahan pada angka yang jadi tagihan.
 */
const UNITS = [
    { id: "A-14", site: "kawasan", blok: "Blok 3", seri: "B21-4471902", seriOcr: "B21-4471902", laluRaw: 1234, aktualRaw: 1268, ocrRaw: 1268, rataRaw: 37 },
    { id: "A-15", site: "kawasan", blok: "Blok 3", seri: null, seriOcr: null, laluRaw: 512, aktualRaw: 548, ocrRaw: 548, rataRaw: 27 },
    { id: "A-16", site: "kawasan", blok: "Blok 3", seri: "B21-4471904", seriOcr: "B21-4471931", laluRaw: 2003, aktualRaw: 2041, ocrRaw: 2041, rataRaw: 29 },
    { id: "L-07", site: "lodge", blok: "Lantai 2", seri: "C24-9930118", seriOcr: "C24-9930118", laluRaw: 12845, aktualRaw: 13162, ocrRaw: 13162, rataRaw: 320 },
    { id: "L-08", site: "lodge", blok: "Lantai 2", seri: null, seriOcr: null, laluRaw: 9310, aktualRaw: 9585, ocrRaw: 9585, rataRaw: 270 },
];

const ALASAN = [
    "Ruko tutup / tidak bisa masuk",
    "Terhalang kendaraan di carport",
    "Angka buram, tertutup embun / lumut",
    "Meter rusak",
    "Meter tidak ditemukan",
];

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

/* ------------------------------------------------------------- utilities */

const pad = (v, n) => String(v).padStart(n, "0");

/** Tampilkan angka mentah sesuai config site — koma muncul hanya kalau ada digit merah. */
function fmtRaw(raw, s) {
    const t = pad(raw, s.hitam + s.merah);
    const hi = t.slice(0, s.hitam);
    const lo = t.slice(s.hitam);
    const hiS = s.hitam > 3 ? `${hi.slice(0, s.hitam - 3)} ${hi.slice(s.hitam - 3)}` : hi;
    return s.merah ? `${hiS},${lo}` : hiS;
}

/** Selisih dalam m³, dibaca dari angka mentah. */
function m3(rawDelta, s) {
    const v = rawDelta / Math.pow(10, s.merah);
    return s.merah ? v.toFixed(s.merah).replace(".", ",") : String(v);
}

/* ------------------------------------------------------------ potongan UI */

function Pill({ w = "info", children }) {
    const t = {
        strong: { bg: C.okSoft, fg: C.ok, bd: C.okLine },
        weak: { bg: C.warnSoft, fg: C.warn, bd: C.warnLine },
        info: { bg: "#eef1f4", fg: C.ink2, bd: C.line },
    }[w];
    return <span style={{
        display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700,
        padding: "4px 9px", borderRadius: 99, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
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

/** Muka meter — kotak merah SELALU digambar (memang ada di fisiknya),
 *  tapi apakah ia disalin atau tidak ditentukan config site. */
function MukaMeter({ raw, s, caption, kecil }) {
    const t = pad(raw, s.hitam + s.merah);
    const hitam = t.slice(0, s.hitam).split("");
    // Kalau site tidak mencatat merah, meternya tetap punya 3 roda merah di fisiknya.
    const merah = s.merah ? t.slice(s.hitam).split("") : ["3", "4", "5"];
    const w = kecil ? 21 : 26, h = kecil ? 29 : 36, f = kecil ? 17 : 22;
    const box = (d, i, red) => (
        <div key={(red ? "r" : "h") + i} style={{
            width: w, height: h, background: red ? C.bad : C.meter, color: "#fff", borderRadius: 3,
            display: "grid", placeItems: "center", fontSize: f, fontWeight: 700, fontFamily: MONO,
        }}>{d}</div>
    );
    return (
        <div style={{ background: "#f0ece2", borderRadius: 10, padding: kecil ? "9px 8px 7px" : "13px 10px 11px", border: `${kecil ? 4 : 5}px solid #6b6f73`, maxWidth: 300, margin: "0 auto" }}>
            <div style={{ fontSize: 9.5, color: "#5c5f63", fontWeight: 700, letterSpacing: ".06em", marginBottom: 7 }}>{caption}</div>
            <div style={{ display: "flex", gap: 3, justifyContent: "center", alignItems: "center" }}>
                {hitam.map((d, i) => box(d, i, false))}
                <div style={{ width: 5 }} />
                {merah.map((d, i) => box(d, i, true))}
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

export default function PencatatanMeter({ preview = true }) {
    const [siteKey, setSiteKey] = useState("kawasan");
    const site = SITES[siteKey];
    const daftar = UNITS.filter((u) => u.site === siteKey);

    const [idx, setIdx] = useState(0);
    const [fase, setFase] = useState(site.gerbangQR ? "scan" : "foto");
    const [angka, setAngka] = useState("");
    const [evScan, setEvScan] = useState(true);
    const [banner, setBanner] = useState(null);
    const [sheet, setSheet] = useState(null);
    const [alasan, setAlasan] = useState(null);
    const [selesai, setSelesai] = useState([]);

    const unit = daftar[idx];
    const panjang = site.hitam + site.merah;

    /* Pencocokan nomor seri = TURUNAN dari OCR atas foto, bukan tombol yang ditekan orang.
       OCR boleh mengisi IDENTITAS, tidak boleh mengisi angka yang ditagihkan:
       salah baca nomor seri cuma memicu tinjauan, salah baca angka jadi tagihan salah. */
    const seriStatus =
        !unit ? "tidakAda"                                        // putaran habis — unit sudah tidak ada
            : unit.seri == null && unit.seriOcr == null ? "tidakAda"
                : unit.seriOcr == null ? "takTerbaca"
                    : unit.seriOcr === unit.seri ? "cocok"
                        : "beda";
    const timer = useRef(null);

    // QR terdeteksi sendiri — nol tap. Hanya di site yang memang memasang QR.
    useEffect(() => {
        if (fase === "scan" && unit && site.gerbangQR) {
            timer.current = setTimeout(() => { setEvScan(true); setFase("foto"); }, 1400);
            return () => clearTimeout(timer.current);
        }
    }, [fase, unit, site.gerbangQR]);

    const gantiSite = (k) => {
        setSiteKey(k); setIdx(0); setAngka(""); setEvScan(true); setAlasan(null);
        setBanner(null); setSheet(null); setSelesai([]);
        setFase(SITES[k].gerbangQR ? "scan" : "foto");
    };

    const lanjut = () => {
        setAngka(""); setEvScan(true); setAlasan(null);
        setFase(site.gerbangQR ? "scan" : "foto");
        setIdx((i) => i + 1);
    };

    const simpan = (tanda) => {
        const v = parseInt(angka, 10);
        const ditandai = Boolean(tanda) || (site.gerbangQR && !evScan) || seriStatus === "beda";
        setBanner({ id: unit.id, raw: v, delta: v - unit.laluRaw, ditandai });
        setSelesai((s) => [...s, unit.id]);
        lanjut();
    };

    /* --- pemeriksaan: banding riwayat, lalu OCR sebagai jaring ketiga --- */
    const periksa = () => {
        const v = parseInt(angka, 10);
        if (v < unit.laluRaw) {
            setSheet({
                ic: "↓", bg: C.badSoft, fg: C.bad, judul: "Angkanya mundur",
                teks: "Meter air tidak bisa berkurang. Biasanya ini meter yang baru diganti, atau salah baca. Coba lihat lagi ya.",
                kiri: v, kanan: unit.laluRaw, kananLb: "Bulan lalu", tegas: "Angkanya memang segitu",
                tanda: "Angka lebih kecil dari bulan lalu — petugas menyatakan angkanya benar.",
            });
        } else if (v - unit.laluRaw > unit.rataRaw * 5) {
            setSheet({
                ic: "↑", bg: C.warnSoft, fg: C.warn, judul: "Lonjakannya jauh",
                teks: `Pemakaian ${m3(v - unit.laluRaw, site)} m³ — jauh di atas kebiasaan unit ini. Bisa kebocoran, bisa ada angka yang kelewat.`,
                kiri: v, kanan: unit.laluRaw, kananLb: "Bulan lalu", tegas: "Angkanya memang segitu",
                tanda: "Lonjakan jauh di atas kebiasaan — petugas menyatakan angkanya benar.",
            });
        } else if (v !== unit.ocrRaw) {
            setSheet({
                ic: "◎", bg: "#eef1f4", fg: C.ink2, judul: "Beda dengan yang di foto",
                teks: "Dari foto tadi terbaca angka yang berbeda. Mesin bisa salah baca (embun, angka lagi berputar) — kamu yang lihat langsung.",
                kiri: v, kanan: unit.ocrRaw, kananLb: "Terbaca di foto", tegas: "Bacaanku yang benar",
                tanda: "Bacaan petugas berbeda dari hasil baca foto.",
            });
        } else simpan(null);
    };

    /* --------------------------------------------------------- putaran habis */
    if (!unit) {
        return (
            <Shell preview={preview} siteKey={siteKey} onSite={gantiSite}>
                <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
                    <div>
                        <div style={{ fontSize: 42 }}>✓</div>
                        <h2 style={{ margin: "8px 0 6px", fontSize: 20, letterSpacing: "-0.02em" }}>{site.nama} selesai</h2>
                        <p style={{ color: C.ink2, fontSize: 14, lineHeight: 1.6, margin: "0 0 18px" }}>
                            {selesai.length} unit terbaca di putaran ini.<br />Penutupan putaran dilakukan orang kantor.
                        </p>
                        <Btn variant="outline" onClick={() => gantiSite(siteKey)}>Ulang simulasi</Btn>
                    </div>
                </div>
            </Shell>
        );
    }

    const berikut = daftar[idx + 1]?.id;

    return (
        <Shell preview={preview} siteKey={siteKey} onSite={gantiSite}>
            {/* konteks + banner unit sebelumnya */}
            <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, flex: "0 0 auto" }}>
                {banner && (
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
                        background: banner.ditandai ? C.warnSoft : C.okSoft,
                        color: banner.ditandai ? C.warn : C.ok, fontSize: 12.5, fontWeight: 600,
                    }}>
                        <span>{banner.ditandai ? "!" : "✓✓"}</span>
                        <span style={{ minWidth: 0 }}>
                            {banner.id} tersimpan · {fmtRaw(banner.raw, site)} · {m3(banner.delta, site)} m³{banner.ditandai ? " · ditandai" : ""}
                        </span>
                    </div>
                )}
                <div style={{ display: "flex", alignItems: "center", padding: "10px 14px 11px", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10.5, letterSpacing: ".07em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>
                            {fase === "entry" ? "Salin angka" : "Unit berikutnya"} · {site.nama}
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 1 }}>
                            {unit.id} <span style={{ fontSize: 13, fontWeight: 500, color: C.ink2 }}>· {unit.blok}</span>
                        </div>
                    </div>
                    <div style={{ marginLeft: "auto", background: "#eef1f4", borderRadius: 99, padding: "7px 12px", fontSize: 12.5, fontWeight: 700, color: C.ink2, flex: "0 0 auto" }}>
                        Sisa {daftar.length - idx}
                    </div>
                </div>
            </div>

            {/* kamera: scan (kalau site punya QR) lalu foto meter */}
            {fase !== "entry" && (
                <div style={{ flex: 1, background: C.dark, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, minHeight: 0 }}>
                    <div style={{ color: "#e6ecf0", fontSize: 12.5, textAlign: "center", lineHeight: 1.55, marginBottom: 14, maxWidth: 290 }}>
                        {fase === "scan"
                            ? "Arahkan ke stiker QR di dinding — terbaca sendiri, tidak perlu ditekan"
                            : <>Foto meternya. Angka harus terlihat jelas.<br />
                                <span style={{ color: "#9fb0bb" }}>Meter {site.letak}.</span></>}
                    </div>

                    <div style={{ width: 268, height: 186, border: "2px solid rgba(255,255,255,.5)", borderRadius: 12, display: "grid", placeItems: "center" }}>
                        {fase === "scan"
                            ? <div style={{ width: 118, height: 118, background: "#fff", borderRadius: 10, display: "grid", placeItems: "center", padding: 9 }}><Qr /></div>
                            : <div style={{ transform: "scale(.78)" }}><MukaMeter raw={unit.aktualRaw} s={site} caption={`WATER METER · ${unit.id}`} /></div>}
                    </div>

                    {fase === "scan" && (
                        <button onClick={() => { clearTimeout(timer.current); setEvScan(false); setFase("foto"); }} style={{ position: "absolute", bottom: 16, background: "transparent", border: 0, color: "#cfd9e0", fontSize: 13, textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", padding: 8 }}>
                            QR rusak atau hilang → pilih unit manual
                        </button>
                    )}
                    {fase === "foto" && (
                        <button aria-label="Ambil foto" onClick={() => setFase("entry")} style={{ position: "absolute", bottom: 20, width: 64, height: 64, borderRadius: 99, background: "#fff", border: "5px solid rgba(255,255,255,.35)", cursor: "pointer" }} />
                    )}
                </div>
            )}

            {/* isi angka */}
            {fase === "entry" && (
                <>
                    <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px", minHeight: 0 }}>
                        <div style={{ background: "#1b2126", borderRadius: 14, padding: 12, textAlign: "center" }}>
                            <MukaMeter raw={unit.aktualRaw} s={site} caption="FOTO KAMU · 09:41" />
                            <div style={{
                                fontSize: 10, letterSpacing: ".07em", fontWeight: 800, marginTop: 10,
                                color: site.merah ? "#ffb4ad" : "#9fb0bb",
                            }}>
                                {site.merah
                                    ? `↑ SALIN SEMUA — ${site.hitam} HITAM DAN ${site.merah} MERAH`
                                    : `↑ SALIN ${site.hitam} KOTAK HITAM · YANG MERAH TIDAK USAH`}
                            </div>
                            <div style={{ color: "#7d8f9b", fontSize: 11, marginTop: 6 }}>Terkunci lokasi · 18 Agu 09:41</div>
                        </div>

                        {/* Nomor seri dicocokkan otomatis dari foto — tidak ada yang perlu ditekan. */}
                        {(() => {
                            const m = {
                                cocok: { ic: "✓", bg: C.okSoft, bd: C.okLine, fg: C.ok, lb: "Nomor seri cocok", isi: unit.seri },
                                beda: { ic: "!", bg: C.warnSoft, bd: C.warnLine, fg: C.warn, lb: "Nomor seri beda", isi: `terdaftar ${unit.seri} · terbaca ${unit.seriOcr}` },
                                tidakAda: { ic: "—", bg: "#eef1f4", bd: C.line, fg: C.ink3, lb: "Tidak ada nomor seri", isi: "Meter lama — di database juga tidak ada" },
                                takTerbaca: { ic: "?", bg: "#eef1f4", bd: C.line, fg: C.ink3, lb: "Nomor seri tak terbaca", isi: `terdaftar ${unit.seri} — fotonya kurang jelas` },
                            }[seriStatus];
                            return (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 9, marginTop: 10, padding: "10px 12px",
                                    borderRadius: 12, background: m.bg, border: `1px solid ${m.bd}`, boxSizing: "border-box",
                                }}>
                                    <span style={{ fontSize: 14, fontWeight: 800, color: m.fg }}>{m.ic}</span>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: m.fg, fontWeight: 700 }}>{m.lb}</div>
                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink2, marginTop: 1, fontFamily: seriStatus === "cocok" ? MONO : FONT }}>{m.isi}</div>
                                    </div>
                                </div>
                            );
                        })()}

                        <div style={{ display: "flex", gap: 5, justifyContent: "center", alignItems: "center", margin: "16px 0 4px" }}>
                            {Array.from({ length: panjang }).map((_, i) => {
                                const has = i < angka.length;
                                const isMerah = i >= site.hitam;
                                return (
                                    <React.Fragment key={i}>
                                        {isMerah && i === site.hitam && <div style={{ width: 8, textAlign: "center", fontWeight: 800, color: C.ink3 }}>,</div>}
                                        <div style={{
                                            width: panjang > 5 ? 36 : 44, height: panjang > 5 ? 50 : 58, borderRadius: 7,
                                            background: has ? (isMerah ? C.bad : C.meter) : (isMerah ? "#3a2422" : "#232a30"),
                                            color: has ? "#fff" : "#4d5a64", display: "grid", placeItems: "center",
                                            fontSize: panjang > 5 ? 23 : 28, fontWeight: 700, fontFamily: MONO,
                                            border: `2px solid ${i === angka.length ? C.accent : "transparent"}`,
                                        }}>{has ? angka[i] : "·"}</div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <div style={{ textAlign: "center", fontSize: 12, color: C.ink2, marginTop: 6 }}>
                            Bulan lalu <b>{fmtRaw(unit.laluRaw, site)}</b> · meter ini {site.hitam} hitam{site.merah ? ` + ${site.merah} merah` : ", merah diabaikan"}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7, marginTop: 12 }}>
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => <Key key={k} onClick={() => setAngka((a) => a.length < panjang ? a + k : a)}>{k}</Key>)}
                            <Key util onClick={() => setFase("cant")}>Tidak bisa</Key>
                            <Key onClick={() => setAngka((a) => a.length < panjang ? a + "0" : a)}>0</Key>
                            <Key util onClick={() => setAngka((a) => a.slice(0, -1))}>⌫</Key>
                        </div>
                    </div>
                    <Footer>
                        <Btn disabled={angka.length !== panjang} onClick={periksa}>
                            Simpan &amp; lanjut{berikut ? ` ke ${berikut}` : ""}
                        </Btn>
                    </Footer>
                </>
            )}

            {/* tidak bisa dibaca */}
            {fase === "cant" && (
                <>
                    <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 16px", minHeight: 0 }}>
                        <p style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.55, margin: "0 0 13px" }}>
                            Ini <b>bukan kesalahan kamu</b>. Alasannya dicatat supaya orang kantor tahu unit ini kenapa.
                        </p>
                        {ALASAN.map((a) => (
                            <button key={a} onClick={() => setAlasan(a)} style={{
                                display: "block", width: "100%", textAlign: "left", background: alasan === a ? C.accentSoft : "#fff",
                                border: `1.5px solid ${alasan === a ? C.accent : C.line}`, borderRadius: 12, padding: 14,
                                fontSize: 14.5, marginBottom: 8, cursor: "pointer", fontFamily: "inherit", color: C.ink,
                                fontWeight: alasan === a ? 650 : 400, boxSizing: "border-box",
                            }}>{a}</button>
                        ))}
                    </div>
                    <Footer>
                        <Btn disabled={!alasan} onClick={() => {
                            setBanner({ id: unit.id, cant: true, alasan, ditandai: true });
                            setSelesai((s) => [...s, unit.id]); lanjut();
                        }}>Simpan &amp; lanjut</Btn>
                        <Btn variant="ghost" onClick={() => setFase("entry")}>Kembali</Btn>
                    </Footer>
                </>
            )}

            {/* prompt pemeriksaan */}
            {sheet && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(12,18,24,.55)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
                    <div style={{ background: "#fff", width: "100%", borderRadius: "20px 20px 0 0", padding: "20px 18px 18px" }}>
                        <div style={{ width: 42, height: 42, borderRadius: 99, display: "grid", placeItems: "center", fontSize: 21, marginBottom: 11, background: sheet.bg, color: sheet.fg }}>{sheet.ic}</div>
                        <h3 style={{ margin: "0 0 8px", fontSize: 18, letterSpacing: "-0.015em" }}>{sheet.judul}</h3>
                        <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.55, color: C.ink2 }}>{sheet.teks}</p>
                        <div style={{ display: "flex", gap: 9, margin: "12px 0 14px" }}>
                            {[["Kamu isi", sheet.kiri], [sheet.kananLb, sheet.kanan]].map(([lb, val]) => (
                                <div key={lb} style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 11, padding: "9px 8px", textAlign: "center", minWidth: 0 }}>
                                    <div style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>{lb}</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: MONO, marginTop: 3 }}>{fmtRaw(val, site)}</div>
                                </div>
                            ))}
                        </div>
                        <Btn onClick={() => setSheet(null)}>Perbaiki angkanya</Btn>
                        <Btn variant="outline" style={{ marginTop: 8 }} onClick={() => { const t = sheet.tanda; setSheet(null); simpan(t); }}>{sheet.tegas}</Btn>
                        <p style={{ fontSize: 11.5, margin: "11px 0 0", color: C.ink3, lineHeight: 1.5 }}>
                            Kalau kamu yakin, angkanya <b>disimpan apa adanya</b> dan cuma ditandai untuk ditinjau orang kantor.
                        </p>
                    </div>
                </div>
            )}
        </Shell>
    );
}

/* ------------------------------------------------------------ pembungkus */

function Key({ util, children, ...rest }) {
    return <button {...rest} style={{
        padding: "14px 0", fontSize: util ? 15 : 21, fontWeight: util ? 700 : 650, borderRadius: 11,
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
            {/* Pengendali prototipe — di produksi, site ditentukan penugasan petugas. */}
            {onSite && (
                <div style={{ flex: "0 0 auto", display: "flex", gap: 6, padding: "7px 10px", background: "#eef1f4", borderBottom: `1px dashed #c8d1d9` }}>
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