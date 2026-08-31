import React, { useEffect, useState } from "react";

/**
 * AUTSORZ — Pendataan Meter (putaran nol)
 * Revisi 2, 19 Agustus 2026 — DIRAMPINGKAN setelah masukan owner.
 *
 * Dikerjakan SEKALI per meter, seumur hidup meter itu.
 *
 * ================= ATURAN YANG MEMANDU PERAMPINGAN INI =================
 *
 *   "Jangan minta orang mengetik di lapangan sesuatu yang bisa dibaca dari
 *    fotonya nanti."
 *
 * Mengetik 400 nomor seri sambil berdiri di carport itu lambat dan rawan
 * salah. Membacanya dari foto sambil duduk di kantor jauh lebih cepat dan
 * lebih teliti. Lapangan cuma menangkap yang HARUS ditangkap di lapangan:
 * foto dan angka.
 *
 * ========================= YANG DIBUANG & KENAPA ========================
 *
 * 1. SEKSI "TINGKAT KEYAKINAN PEMETAAN" — DIBUANG.
 *    Dirancang waktu masih diduga meternya berderet di satu panel; di situ
 *    "meter ini punya siapa" memang tebakan. Ternyata tiap ruko punya carport
 *    sendiri, jadi pertanyaannya punya satu jawaban yang sama untuk 300 unit.
 *    Pertanyaan yang jawabannya selalu sama MELATIH ORANG MENEKAN TANPA
 *    MEMBACA — persis alasan yang dipakai untuk menolak OCR-mengisi-kolom.
 *    Keraguan pemetaan sekarang ditangkap HANYA saat penjaga seed bersuara,
 *    yaitu satu-satunya momen keraguan itu benar-benar ada.
 *
 * 2. PENGETIKAN NOMOR SERI — DIBUANG dari lapangan.
 *    Nomor seri tercetak di muka/badan meter, jadi ikut terekam di foto.
 *    Transkripsinya jadi kerja meja, batch, dari foto. Konsekuensi jujur:
 *    pendeteksi "meter diganti" baru hidup setelah kantor mentranskripsi —
 *    ditunda ke meja, bukan hilang.
 *
 * 3. SEKSI "JUMLAH DIGIT" — turun jadi satu baris kecil.
 *    Config site sudah benar untuk hampir semua meter; yang menyimpang itu
 *    pengecualian. Penanganan pengecualian tidak pantas memakan satu seksi
 *    penuh di layar yang dipakai 400 kali.
 *
 * ===================== YANG JUSTRU DITAMBAHKAN =========================
 *
 * Jalan keluar jujur dari blokir: "meter ini baru diganti". Meter pengganti
 * mulai dari nol, jadi angkanya WAJAR lebih kecil dari seed. Tanpa jalur ini,
 * blokirnya memaksa orang mengarang angka supaya bisa lanjut — dan blokir yang
 * memaksa orang berbohong lebih buruk daripada tidak ada blokir.
 *
 * ========================== DOKTRIN (tidak berubah) ====================
 * - SEED SPREADSHEET = PENJAGA PEMETAAN. Meter air tidak bisa mundur, dan
 *   pemakaian sebulan punya rentang wajar. Ini satu-satunya tempat di seluruh
 *   sistem yang MEMBLOKIR — karena salah petakan berulang tiap bulan dan tidak
 *   tertangkap pemeriksaan mana pun.
 * - URUTAN KELILING = TURUNAN dari urutan pendataan. Rekam, jangan tanya.
 * - PENDATAAN ADALAH PEMBACAAN → putaran pertama sudah punya pembanding.
 */

/* ------------------------------------------------------------------ config */

const SITES = {
    kawasan: { nama: "Kawasan Ruko", hitam: 5, merah: 0, stiker: false, letak: "di carport, terhalang teras" },
    lodge: { nama: "Paskal Lodge", hitam: 5, merah: 2, stiker: true, letak: "menempel di dinding" },
};

/**
 * seedRaw & rataRaw = bilangan bulat mentah dari spreadsheet Paskal.
 * seriOcr = hasil baca OCR atas nomor seri DARI FOTO. null = meter jadul,
 * memang tidak bernomor — dan kalau tidak ada di meternya, tidak ada juga di
 * database. Tidak ada yang perlu diketik.
 */
const UNITS = [
    { id: "A-14", site: "kawasan", blok: "Blok 3", seedRaw: 1234, rataRaw: 37, aktualRaw: 1268, seriOcr: "B21-4471902" },
    { id: "A-15", site: "kawasan", blok: "Blok 3", seedRaw: 512, rataRaw: 27, aktualRaw: 548, seriOcr: null },
    { id: "A-16", site: "kawasan", blok: "Blok 3", seedRaw: 2003, rataRaw: 29, aktualRaw: 2041, seriOcr: "B21-4471904" },
    { id: "L-07", site: "lodge", blok: "Lantai 2", seedRaw: 12845, rataRaw: 320, aktualRaw: 13162, seriOcr: "C24-9930118" },
    { id: "L-08", site: "lodge", blok: "Lantai 2", seedRaw: 9310, rataRaw: 270, aktualRaw: 9585, seriOcr: null },
];

const SUDAH = { kawasan: 41, lodge: 6 };
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
const fmtRaw = (raw, h, m) => {
    const t = pad(raw, h + m), hi = t.slice(0, h), lo = t.slice(h);
    const hiS = h > 3 ? `${hi.slice(0, h - 3)} ${hi.slice(h - 3)}` : hi;
    return m ? `${hiS},${lo}` : hiS;
};
const m3 = (d, m) => (m ? (d / Math.pow(10, m)).toFixed(m).replace(".", ",") : String(d));

/* ------------------------------------------------------------ potongan UI */

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
    const [siteKey, setSiteKey] = useState("kawasan");
    const site = SITES[siteKey];
    const daftar = UNITS.filter((u) => u.site === siteKey);

    const [idx, setIdx] = useState(0);
    const [fase, setFase] = useState(site.stiker ? "scan" : "foto");
    const [angka, setAngka] = useState("");
    const [hitam, setHitam] = useState(site.hitam);
    const [merah, setMerah] = useState(site.merah);
    const [ubahDigit, setUbahDigit] = useState(false);
    const [diganti, setDiganti] = useState(false);      // "meter baru diganti" — jalan keluar dari blokir
    const [sheet, setSheet] = useState(false);          // bottom sheet penjaga pemetaan
    const [rekam, setRekam] = useState([]);

    const unit = daftar[idx];
    const panjang = hitam + merah;
    const terdata = SUDAH[siteKey] + rekam.length;

    useEffect(() => {
        if (fase === "scan" && unit && site.stiker) {
            const t = setTimeout(() => setFase("foto"), 1400);
            return () => clearTimeout(t);
        }
    }, [fase, unit, site.stiker]);

    const resetUnit = (s = site) => {
        setAngka(""); setHitam(s.hitam); setMerah(s.merah); setUbahDigit(false);
        setDiganti(false); setSheet(false); setFase(s.stiker ? "scan" : "foto");
    };
    const gantiSite = (k) => { setSiteKey(k); setIdx(0); setRekam([]); resetUnit(SITES[k]); };

    /* Sheet naik sendiri begitu angkanya lengkap DAN bermasalah.
       Kalau cocok, dia tidak pernah muncul — nol gangguan di jalur normal. */
    useEffect(() => {
        if (angka.length !== panjang || diganti) return;
        const d = parseInt(angka, 10) - unit.seedRaw;
        if (d < 0 || d > unit.rataRaw * 4) setSheet(true);
    }, [angka, panjang, diganti, unit]);

    /* --- penjaga pemetaan: seed spreadsheet dipakai sebagai pemeriksa --- */
    const v = angka.length === panjang ? parseInt(angka, 10) : null;
    let cek = null;
    if (v != null && !diganti) {
        const d = v - unit.seedRaw;
        if (d < 0) cek = {
            w: "bad", judul: "Hampir pasti bukan meter unit ini",
            teks: `Catatan ${BULAN_SEED} untuk ${unit.id} adalah ${fmtRaw(unit.seedRaw, hitam, merah)}. Meter air tidak bisa berkurang.`,
        };
        else if (d > unit.rataRaw * 4) cek = {
            w: "weak", judul: "Angkanya jauh dari kebiasaan unit ini",
            teks: `Selisih ${m3(d, merah)} m³, padahal ${unit.id} biasanya sekitar ${m3(unit.rataRaw, merah)} m³ per bulan. Bisa meter unit lain, bisa juga memang bocor.`,
        };
        else cek = {
            w: "strong", judul: "Cocok dengan riwayat unit ini",
            teks: `Selisih ${m3(d, merah)} m³ dari catatan ${BULAN_SEED} (${fmtRaw(unit.seedRaw, hitam, merah)}) — masuk akal untuk sebulan.`,
        };
    } else if (v != null && diganti) {
        cek = { w: "info", judul: "Meter baru — riwayat lama tidak dipakai", teks: `Dicatat sebagai penggantian meter. Angka ${fmtRaw(v, hitam, merah)} jadi titik awal baru; catatan ${BULAN_SEED} tidak lagi jadi pembanding untuk unit ini.` };
    }

    const bisaSimpan = v != null && (diganti || cek?.w !== "bad");

    const simpan = () => {
        setRekam((r) => [...r, { id: unit.id, urutan: r.length + 1, raw: v, hitam, merah, seri: unit.seriOcr, diganti }]);
        if (idx + 1 < daftar.length) { setIdx(idx + 1); resetUnit(); } else setFase("selesai");
    };

    /* ------------------------------------------------------------- selesai */
    if (fase === "selesai") {
        return (
            <Shell preview={preview} siteKey={siteKey} onSite={gantiSite}>
                <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
                    <div style={{ fontSize: 40, textAlign: "center" }}>✓</div>
                    <h2 style={{ margin: "6px 0 4px", fontSize: 20, textAlign: "center", letterSpacing: "-0.02em" }}>{rekam.length} meter terdata</h2>
                    <p style={{ fontSize: 13.5, color: C.ink2, textAlign: "center", margin: "0 0 16px", lineHeight: 1.55 }}>{site.nama} · total {terdata} terdata</p>

                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Urutan keliling yang terekam</div>
                        <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.55, marginBottom: 10 }}>
                            Urutanmu mendata jadi urutan keliling bulan-bulan berikutnya. Tidak ada yang perlu disusun manual.
                        </div>
                        {rekam.map((r) => (
                            <div key={r.id} style={{ display: "flex", gap: 9, alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.line}` }}>
                                <span style={{ width: 22, height: 22, borderRadius: 99, background: "#eef1f4", color: C.ink2, fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", flex: "0 0 22px" }}>{r.urutan}</span>
                                <span style={{ fontWeight: 650, fontSize: 14 }}>{r.id}</span>
                                <span style={{ fontSize: 11, fontFamily: r.seri ? MONO : FONT, color: r.seri ? C.ink3 : C.warn, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {r.seri ?? "tanpa nomor"}
                                </span>
                                {r.diganti && <span style={{ fontSize: 11, color: C.warn, fontWeight: 700 }}>diganti</span>}
                                <span style={{ marginLeft: "auto", fontFamily: MONO, fontWeight: 700, fontSize: 13 }}>{fmtRaw(r.raw, r.hitam, r.merah)}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ background: "#fff", border: `1px dashed #cdd6dd`, borderRadius: 12, padding: 13, fontSize: 12.5, color: C.ink2, lineHeight: 1.6 }}>
                        <b style={{ color: C.ink }}>Nomor seri dibaca OCR dari foto</b>, tidak diketik dan tidak perlu ditranskripsi manual.
                        Meter yang memang tidak bernomor tercatat apa adanya — kalau tidak ada di meternya, tidak ada juga di database.
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
                    <div style={{ color: "#e6ecf0", fontSize: 12.5, textAlign: "center", lineHeight: 1.55, marginBottom: 14, maxWidth: 296 }}>
                        {fase === "scan"
                            ? <>Tempel stiker <b>{unit.id}</b> di dekat meternya, lalu arahkan kamera ke stikernya.</>
                            : <>Foto meternya — usahakan <b>angka dan nomor serinya masuk satu frame</b>.<br />
                                <span style={{ color: "#9fb0bb" }}>Nomor seri tidak perlu diketik; orang kantor yang membacanya dari foto ini.</span></>}
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

                <div style={{ background: "#1b2126", borderRadius: 14, padding: 12, textAlign: "center" }}>
                    <MukaMeter raw={unit.aktualRaw} hitam={site.hitam} merah={site.merah} caption="FOTO KAMU · 09:41" kecil />
                    <div style={{ fontSize: 9.5, letterSpacing: ".07em", fontWeight: 800, marginTop: 9, color: merah ? "#ffb4ad" : "#9fb0bb" }}>
                        {merah ? `SALIN SEMUA — ${hitam} HITAM DAN ${merah} MERAH` : `SALIN ${hitam} KOTAK HITAM · MERAH TIDAK USAH`}
                    </div>
                </div>

                {/* Nomor seri dibaca OCR dari foto yang sama. Tidak diketik.
            OCR boleh mengisi IDENTITAS, tidak boleh mengisi angka yang ditagihkan —
            salah baca nomor seri cuma memicu tinjauan, salah baca angka jadi tagihan salah. */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 9, marginTop: 10, padding: "10px 12px",
                    borderRadius: 12, boxSizing: "border-box",
                    background: unit.seriOcr ? C.okSoft : "#eef1f4",
                    border: `1px solid ${unit.seriOcr ? C.okLine : C.line}`,
                }}>
                    <span style={{ fontSize: 14, color: unit.seriOcr ? C.ok : C.ink3 }}>{unit.seriOcr ? "✓" : "—"}</span>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>
                            Nomor seri {unit.seriOcr ? "terbaca dari foto" : "tidak ada"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: unit.seriOcr ? MONO : FONT, color: unit.seriOcr ? C.ink : C.ink2, marginTop: 1 }}>
                            {unit.seriOcr ?? "Meter lama, tidak bernomor"}
                        </div>
                    </div>
                    <button onClick={() => setFase("foto")} style={{
                        marginLeft: "auto", flex: "0 0 auto", background: "transparent", border: `1px solid ${C.line}`,
                        color: C.ink2, borderRadius: 9, padding: "7px 10px", fontSize: 11.5, fontWeight: 700,
                        cursor: "pointer", fontFamily: "inherit",
                    }}>{unit.seriOcr ? "salah?" : "ada nomornya?"}</button>
                </div>

                {/* kotak digit */}
                <div style={{ display: "flex", gap: 5, justifyContent: "center", alignItems: "center", margin: "16px 0 6px", flexWrap: "wrap" }}>
                    {Array.from({ length: panjang }).map((_, i) => {
                        const has = i < angka.length;
                        const isMerah = i >= hitam;
                        return (
                            <React.Fragment key={i}>
                                {isMerah && i === hitam && <div style={{ width: 7, textAlign: "center", fontWeight: 800, color: C.ink3 }}>,</div>}
                                <div style={{
                                    width: panjang > 5 ? 36 : 42, height: panjang > 5 ? 48 : 54, borderRadius: 7,
                                    background: has ? (isMerah ? C.bad : C.meter) : (isMerah ? "#3a2422" : "#232a30"),
                                    color: has ? "#fff" : "#4d5a64", display: "grid", placeItems: "center",
                                    fontSize: panjang > 5 ? 22 : 26, fontWeight: 700, fontFamily: MONO,
                                    border: `2px solid ${i === angka.length ? C.accent : "transparent"}`,
                                }}>{has ? angka[i] : "·"}</div>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* jumlah digit = baris kecil, bukan seksi. Pengecualian jangan makan layar. */}
                <div style={{ textAlign: "center", fontSize: 12, color: C.ink2, marginBottom: 10 }}>
                    Bulan lalu <b>{fmtRaw(unit.seedRaw, hitam, merah)}</b> · meter {hitam} hitam{merah ? ` + ${merah} merah` : ""}{" "}
                    <button onClick={() => setUbahDigit((x) => !x)} style={{
                        background: "transparent", border: 0, color: C.accent, fontWeight: 700, fontSize: 12,
                        textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", padding: "2px 4px",
                    }}>{ubahDigit ? "tutup" : "beda?"}</button>
                </div>

                {ubahDigit && (
                    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 12, color: C.ink2, lineHeight: 1.5, marginBottom: 9 }}>
                            Cocokkan dengan meternya. <b>Salah di sini = tagihan unit ini meleset 10× atau 100×.</b>
                        </div>
                        {[["Hitam", [4, 5, 6], hitam, setHitam, C.meter], ["Merah", [0, 2, 3], merah, setMerah, C.bad]].map(([lb, opts, val, set, warna]) => (
                            <div key={lb} style={{ display: "flex", gap: 7, marginBottom: lb === "Hitam" ? 7 : 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: lb === "Merah" ? C.bad : C.ink2, alignSelf: "center", width: 44 }}>{lb}</span>
                                {opts.map((d) => (
                                    <button key={d} onClick={() => { set(d); setAngka(""); }} style={{
                                        flex: 1, padding: "9px 0", borderRadius: 9, cursor: "pointer", fontFamily: "inherit",
                                        border: `1.5px solid ${val === d ? warna : C.line}`,
                                        background: val === d ? warna : "#fff", color: val === d ? "#fff" : C.ink2,
                                        fontWeight: 700, fontSize: 13.5,
                                    }}>{d === 0 && lb === "Merah" ? "tidak" : d}</button>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* keypad */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
                    {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
                        <Key key={k} aria-label={`angka ${k}`} onClick={() => setAngka((a) => a.length < panjang ? a + k : a)}>{k}</Key>
                    ))}
                    <div />
                    <Key aria-label="angka 0" onClick={() => setAngka((a) => a.length < panjang ? a + "0" : a)}>0</Key>
                    <Key util aria-label="hapus" onClick={() => setAngka((a) => a.slice(0, -1))}>⌫</Key>
                </div>

                {/* Ringkasan hasil pemeriksaan. Sheet-nya sudah naik sendiri kalau bermasalah;
            baris ini yang tersisa setelah sheet ditutup, supaya statusnya tidak hilang. */}
                {cek && !sheet && (
                    <button onClick={() => cek.w === "strong" || cek.w === "info" ? null : setSheet(true)} style={{
                        width: "100%", marginTop: 12, textAlign: "left", cursor: cek.w === "strong" || cek.w === "info" ? "default" : "pointer",
                        background: tone(cek.w).bg, border: `1.5px solid ${tone(cek.w).bd}`, borderRadius: 12,
                        padding: "11px 13px", fontFamily: "inherit", boxSizing: "border-box",
                    }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: tone(cek.w).fg }}>{cek.judul}</div>
                        <div style={{ fontSize: 12, lineHeight: 1.5, color: C.ink2, marginTop: 2 }}>{cek.teks}</div>
                    </button>
                )}
            </div>

            <Footer>
                <Btn disabled={!bisaSimpan} onClick={simpan}>
                    {idx + 1 < daftar.length ? `Simpan & lanjut ke ${daftar[idx + 1].id}` : "Simpan & selesai"}
                </Btn>
            </Footer>

            {/* ------------------------------ bottom sheet penjaga pemetaan ------------------------------ */}
            {sheet && cek && cek.w !== "strong" && cek.w !== "info" && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(12,18,24,.55)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
                    <div style={{ background: "#fff", width: "100%", borderRadius: "20px 20px 0 0", padding: "20px 18px 18px" }}>
                        <div style={{ width: 42, height: 42, borderRadius: 99, display: "grid", placeItems: "center", fontSize: 21, marginBottom: 11, background: tone(cek.w).bg, color: tone(cek.w).fg }}>
                            {cek.w === "bad" ? "↓" : "↑"}
                        </div>
                        <h3 style={{ margin: "0 0 8px", fontSize: 18, letterSpacing: "-0.015em" }}>{cek.judul}</h3>
                        <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.55, color: C.ink2 }}>{cek.teks}</p>

                        <div style={{ display: "flex", gap: 9, margin: "0 0 16px" }}>
                            {[["Kamu isi", v], [`Catatan ${BULAN_SEED}`, unit.seedRaw]].map(([lb, val]) => (
                                <div key={lb} style={{ flex: 1, minWidth: 0, border: `1px solid ${C.line}`, borderRadius: 11, padding: "9px 8px", textAlign: "center" }}>
                                    <div style={{ fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>{lb}</div>
                                    <div style={{ fontSize: 19, fontWeight: 700, fontFamily: MONO, marginTop: 3 }}>{fmtRaw(val, hitam, merah)}</div>
                                </div>
                            ))}
                        </div>

                        <Btn onClick={() => { setAngka(""); setSheet(false); }}>
                            {cek.w === "bad" ? "Aku salah meter — cek lagi" : "Cek lagi"}
                        </Btn>

                        {cek.w === "bad" ? (
                            <Btn variant="outline" style={{ marginTop: 8 }} onClick={() => { setDiganti(true); setSheet(false); }}>
                                Meter ini baru diganti
                                <span style={{ display: "block", fontSize: 11.5, fontWeight: 500, color: C.ink2, marginTop: 3 }}>
                                    Meter pengganti mulai dari nol, jadi wajar lebih kecil
                                </span>
                            </Btn>
                        ) : (
                            <Btn variant="outline" style={{ marginTop: 8 }} onClick={() => setSheet(false)}>
                                Angkanya memang segitu
                            </Btn>
                        )}
                    </div>
                </div>
            )}
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