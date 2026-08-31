import React, { useMemo, useState } from "react";

/**
 * AUTSORZ — Kokpit Putaran (layar pengelola / orang kantor Paskal)
 *
 * Gagasan penataan layar ini: SEMUANYA disusun sebagai "apa yang menghalangi
 * tagihan terbit", bukan sebagai tabel data. Orang kantor tidak perlu melihat
 * 135 baris yang beres — dia perlu melihat 79 yang menahan uang.
 *
 * Tiga tumpukan:
 *  1. BELUM TERBACA  — penghalang keras. Tanpa angka, tagihan unit itu tidak terbit.
 *  2. PERLU DITINJAU — ada angka tapi ditandai (mundur / lonjakan / beda-dengan-foto /
 *                      dipilih manual / nomor meter beda). Penghalang lunak:
 *                      bisa lewat begitu manusia memutuskan.
 *  3. SIAP           — tidak ada yang perlu dilihat.
 *
 * Doktrin yang dijaga di layar ini:
 * - FAKTA TERKUNCI, TAFSIR DI ATASNYA. Tidak ada aksi yang menimpa angka petugas.
 *   "Terima", "minta baca ulang", dan "taksiran" semuanya MENAMBAH catatan
 *   bertanggal + nama, angka aslinya tetap utuh dan tetap terlihat.
 * - TAKSIRAN TIDAK DILARANG, TAPI TIDAK BOLEH MENYAMAR JADI BACAAN. Kalau produk
 *   tidak menyediakannya, Paskal akan menaksir di spreadsheet tanpa jejak sama
 *   sekali. Lebih baik ditampung dengan label jujur + nama penaksir.
 * - SISTEM TIDAK MEMVONIS. Tanda = "perlu dilihat", bukan "salah".
 *
 * Catatan cakupan: layar ini berhenti di DATA SIAP. Tarif, perhitungan rupiah,
 * dan penerbitan invoice ada di fase berikutnya (dan sebagian di luar produk).
 */

/* ------------------------------------------------------------------ data */

const PUTARAN = { label: "Agustus 2026", site: "Paskal Hypersquare", total: 214, tenggat: "25 Agustus" };

// Ringkasan agregat untuk unit yang tidak ditampilkan satu per satu.
const TERSEMBUNYI = { siap: 135, belum: 68 }; // 135 + 68 + 11 unit di daftar = 214

const TANDA = {
    mundur: { label: "Angka mundur", warna: "bad", jelas: "Angka lebih kecil dari bulan lalu. Petugas menyatakan angkanya benar." },
    lonjakan: { label: "Lonjakan jauh", warna: "warn", jelas: "Pemakaian jauh di atas kebiasaan unit ini. Bisa kebocoran, bisa salah digit." },
    ocr: { label: "Beda dengan foto", warna: "info", jelas: "Bacaan petugas berbeda dari hasil baca foto. Petugas menyatakan bacaannya benar." },
    manual: { label: "Dipilih manual", warna: "warn", jelas: "Unit dipilih dari daftar tanpa memindai QR. Buktinya lebih lemah." },
    serial: { label: "Nomor meter beda", warna: "warn", jelas: "Nomor meter di lapangan tidak sama dengan yang terdaftar. Kemungkinan meter diganti atau QR salah tempel." },
};

const AWAL = [
    { id: "A-03", blok: "Blok Utara", serial: "B21-4471891", digits: 5, lalu: 1180, nilai: 1058, jam: "08:41", petugas: "Yanto", tanda: ["mundur"], riwayat: [1042, 1071, 1104, 1141, 1180] },
    { id: "A-09", blok: "Blok Utara", serial: "B21-4471897", digits: 5, lalu: 743, nilai: 1190, jam: "09:02", petugas: "Yanto", tanda: ["lonjakan"], riwayat: [612, 646, 679, 710, 743] },
    { id: "B-02", blok: "Blok Timur", serial: "B21-4471921", digits: 5, lalu: 2003, nilai: 2030, jam: "10:14", petugas: "Rahmat", tanda: ["ocr"], riwayat: [1889, 1920, 1948, 1975, 2003] },
    { id: "B-07", blok: "Blok Timur", serial: "B21-4471926", digits: 5, lalu: 512, nilai: 549, jam: "10:33", petugas: "Rahmat", tanda: ["manual"], riwayat: [398, 425, 452, 481, 512] },
    { id: "C-11", blok: "Blok Barat", serial: "B21-4471955", digits: 5, lalu: 96, nilai: 121, jam: "11:07", petugas: "Yanto", tanda: ["serial", "manual"], riwayat: [8, 27, 49, 71, 96] },
    { id: "C-14", blok: "Blok Barat", serial: "B21-4471958", digits: 5, lalu: 1447, nilai: 1502, jam: "11:19", petugas: "Rahmat", tanda: ["ocr"], riwayat: [1251, 1300, 1349, 1398, 1447] },

    { id: "A-13", blok: "Blok Utara", serial: "B21-4471901", digits: 5, lalu: 1120, jam: "09:26", petugas: "Yanto", alasan: "Ruko tutup / tidak bisa masuk", riwayat: [982, 1017, 1051, 1086, 1120] },
    { id: "B-05", blok: "Blok Timur", serial: "B21-4471924", digits: 5, lalu: 655, jam: "10:28", petugas: "Rahmat", alasan: "Box meter terkunci", riwayat: [548, 575, 602, 628, 655] },
    { id: "C-02", blok: "Blok Barat", serial: "B21-4471946", digits: 5, lalu: 311, jam: "11:02", petugas: "Yanto", alasan: "Angka buram, tertutup embun / lumut", riwayat: [240, 258, 276, 294, 311] },
    { id: "C-08", blok: "Blok Barat", serial: "B21-4471952", digits: 5, lalu: 1890, jam: "11:11", petugas: "Yanto", alasan: "Meter tidak ditemukan", riwayat: [1702, 1749, 1796, 1843, 1890] },
    { id: "D-01", blok: "Blok Selatan", serial: "B21-4471970", digits: 5, lalu: 88, jam: "11:48", petugas: "Rahmat", alasan: "Terhalang barang / kendaraan", riwayat: [12, 31, 50, 69, 88] },
].map((u) => ({ ...u, catatan: [], status: u.nilai == null ? "belum" : "tinjau" }));

const BULAN = ["Mar", "Apr", "Mei", "Jun", "Jul"];

/* ---------------------------------------------------------------- tokens */

const C = {
    ink: "#12181f", ink2: "#4a5763", ink3: "#8593a1",
    line: "#e2e7ec", bg: "#f4f6f8", card: "#fff",
    accent: "#0f6e64", accentSoft: "#e6f2f0", accentLine: "#bfdcd7",
    warn: "#b25a06", warnSoft: "#fdf0e0", warnLine: "#f0cfa4",
    bad: "#b3261e", badSoft: "#fdeceb", badLine: "#f3c2be",
    ok: "#1c6b3f", okSoft: "#e7f4ec",
    meter: "#14181c",
};
const MONO = '"SF Mono", ui-monospace, Menlo, Consolas, monospace';
const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif';

const pad = (v, n) => String(v).padStart(n, "0");
const fmt = (v, n) => { const s = pad(v, n); return n > 3 ? `${s.slice(0, n - 3)} ${s.slice(n - 3)}` : s; };
const tone = (w) => ({
    bad: { bg: C.badSoft, fg: C.bad, bd: C.badLine },
    warn: { bg: C.warnSoft, fg: C.warn, bd: C.warnLine },
    info: { bg: "#eef1f4", fg: C.ink2, bd: C.line },
    ok: { bg: C.okSoft, fg: C.ok, bd: "#bfe0cc" },
}[w]);

/* ------------------------------------------------------------- potongan UI */

function Pill({ w = "info", children }) {
    const t = tone(w);
    return <span style={{
        display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700,
        padding: "3px 8px", borderRadius: 99, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
        whiteSpace: "nowrap",
    }}>{children}</span>;
}

function Btn({ variant = "solid", style, children, ...rest }) {
    const base = { border: 0, borderRadius: 10, padding: "11px 15px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em" };
    const v = {
        solid: { background: C.accent, color: "#fff" },
        outline: { background: "#fff", color: C.ink, border: `1.5px solid ${C.line}` },
        warn: { background: "#fff", color: C.warn, border: `1.5px solid ${C.warnLine}` },
    }[variant];
    const dis = rest.disabled ? { background: "#c6cfd6", color: "#8b98a3", cursor: "not-allowed", border: 0 } : null;
    return <button {...rest} style={{ ...base, ...v, ...dis, ...style }}>{children}</button>;
}

/** Foto meter — bukti yang sama yang dilihat petugas, dan yang nanti dilihat tenant. */
function FotoMeter({ value, digits, serial, jam }) {
    return (
        <div style={{ background: "#1b2126", borderRadius: 12, padding: 14, textAlign: "center" }}>
            <div style={{ background: "#f0ece2", borderRadius: 10, padding: "12px 10px 9px", border: "5px solid #6b6f73", maxWidth: 268, margin: "0 auto" }}>
                <div style={{ fontSize: 9, color: "#5c5f63", fontWeight: 700, letterSpacing: ".06em", marginBottom: 7 }}>FOTO PETUGAS · {jam}</div>
                <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
                    {pad(value, digits).split("").map((d, i) => (
                        <div key={i} style={{ width: 24, height: 33, background: C.meter, color: "#fff", borderRadius: 3, display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, fontFamily: MONO }}>{d}</div>
                    ))}
                    <div style={{ width: 5 }} />
                    {["3", "4", "5"].map((d, i) => (
                        <div key={i} style={{ width: 24, height: 33, background: C.bad, color: "#fff", borderRadius: 3, display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, fontFamily: MONO }}>{d}</div>
                    ))}
                </div>
                <div style={{ fontSize: 9, color: "#5c5f63", marginTop: 5, fontFamily: MONO }}>{serial}</div>
            </div>
            <div style={{ color: "#9fb0bb", fontSize: 11, marginTop: 9 }}>Terkunci lokasi · 18 Agu {jam}</div>
        </div>
    );
}

const Label = ({ children }) => (
    <div style={{ fontSize: 10.5, letterSpacing: ".07em", textTransform: "uppercase", color: C.ink3, fontWeight: 700, margin: "18px 0 8px" }}>{children}</div>
);

/* ------------------------------------------------------------ layar utama */

/** Lebar wadah — layar ini sering dibuka di panel sempit, bukan cuma jendela penuh. */
function useLebar() {
    const [w, setW] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));
    React.useEffect(() => {
        const f = () => setW(window.innerWidth);
        f();
        window.addEventListener("resize", f);
        return () => window.removeEventListener("resize", f);
    }, []);
    return w;
}

export default function KokpitPutaran() {
    const [units, setUnits] = useState(AWAL);
    const [pile, setPile] = useState("tinjau");
    const [selId, setSelId] = useState("A-03");
    const [modal, setModal] = useState(null);   // { unit } untuk taksiran
    const [terkunci, setTerkunci] = useState(false);
    const [view, setView] = useState("detail");   // dipakai hanya saat bertumpuk
    const lebar = useLebar();
    const bertumpuk = lebar < 1040;               // satu kolom: daftar ATAU panel, bergantian

    const n = useMemo(() => ({
        belum: units.filter((u) => u.status === "belum").length + TERSEMBUNYI.belum,
        tinjau: units.filter((u) => u.status === "tinjau").length,
        siap: units.filter((u) => u.status === "siap").length + TERSEMBUNYI.siap,
    }), [units]);

    const daftar = units.filter((u) => u.status === pile);
    const sel = units.find((u) => u.id === selId) || daftar[0];

    const catat = (id, patch, catatan) =>
        setUnits((prev) => prev.map((u) => (u.id === id
            ? { ...u, ...patch, catatan: [...u.catatan, { ...catatan, waktu: "18 Agu 2026 · 14:12" }] }
            : u)));

    const pilihBerikut = (id) => {
        const sisa = units.filter((u) => u.status === pile && u.id !== id);
        setSelId(sisa[0]?.id ?? null);
        if (!sisa[0]) setView("list");
    };

    return (
        <div style={{ fontFamily: FONT, color: C.ink, background: C.bg, minHeight: "100vh", overflowX: "hidden" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto", padding: bertumpuk ? "18px 14px 170px" : "22px 22px 130px" }}>

                {/* ---------------- kepala ---------------- */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 11, letterSpacing: ".07em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>Kokpit putaran</div>
                        <h1 style={{ margin: "3px 0 3px", fontSize: 25, letterSpacing: "-0.025em" }}>{PUTARAN.label}</h1>
                        <div style={{ fontSize: 13.5, color: C.ink2 }}>{PUTARAN.site} · {PUTARAN.total} unit · tenggat terbit {PUTARAN.tenggat}</div>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: C.ink3, fontWeight: 600 }}>MENAHAN TAGIHAN</div>
                        <div style={{ fontSize: 25, fontWeight: 700, letterSpacing: "-0.02em", color: n.belum + n.tinjau ? C.warn : C.ok }}>
                            {n.belum + n.tinjau} unit
                        </div>
                    </div>
                </div>

                {/* ---------------- tiga tumpukan ---------------- */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                        ["belum", "Belum terbaca", n.belum, "Tanpa angka, tagihan unit ini tidak bisa terbit", C.bad],
                        ["tinjau", "Perlu ditinjau", n.tinjau, "Ada angka, tapi ditandai — butuh keputusan orang", C.warn],
                        ["siap", "Siap", n.siap, "Tidak ada yang perlu dilihat", C.ok],
                    ].map(([key, judul, jml, ket, warna]) => {
                        const aktif = pile === key;
                        return (
                            <button key={key} onClick={() => { setPile(key); setSelId(units.find((u) => u.status === key)?.id ?? null); }}
                                style={{
                                    flex: "1 1 240px", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                                    background: aktif ? "#fff" : "rgba(255,255,255,.55)",
                                    border: `1.5px solid ${aktif ? warna : C.line}`, borderRadius: 14, padding: "13px 15px",
                                    boxShadow: aktif ? "0 1px 3px rgba(16,24,32,.07)" : "none",
                                }}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                                    <span style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.03em", color: warna }}>{jml}</span>
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>{judul}</span>
                                </div>
                                <div style={{ fontSize: 12, color: C.ink2, marginTop: 3, lineHeight: 1.45 }}>{ket}</div>
                            </button>
                        );
                    })}
                </div>

                {/* ---------------- isi ---------------- */}
                {pile === "siap" ? (
                    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 26, marginTop: 14, textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{n.siap} unit siap, tidak ada yang perlu kamu lihat</div>
                        <p style={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.6, margin: "8px auto 0", maxWidth: 460 }}>
                            Layar ini sengaja tidak menampilkan daftarnya. Yang beres tidak butuh mata kamu —
                            carilah lewat pencarian kalau ada tenant yang menanyakan unit tertentu.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: bertumpuk ? "minmax(0, 1fr)" : "minmax(0, 1fr) 420px",
                        gap: 14, marginTop: 14, alignItems: "start",
                    }}>

                        {/* daftar */}
                        {(!bertumpuk || view === "list") && (
                            <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden", minWidth: 0 }}>
                                {daftar.length === 0 && (
                                    <div style={{ padding: 26, textAlign: "center", color: C.ink2, fontSize: 13.5 }}>
                                        {pile === "tinjau" ? "Semua tandanya sudah ditinjau." : "Tidak ada lagi unit yang belum terbaca di daftar ini."}
                                    </div>
                                )}
                                {daftar.map((u) => {
                                    const aktif = sel?.id === u.id;
                                    return (
                                        <button key={u.id} onClick={() => { setSelId(u.id); setView("detail"); }} style={{
                                            display: "grid", gridTemplateColumns: "84px minmax(0, 1fr) auto",
                                            width: "100%", alignItems: "center", gap: 10, padding: "13px 14px",
                                            borderBottom: `1px solid ${C.line}`, background: aktif ? C.accentSoft : "#fff",
                                            border: "0", borderLeft: `3px solid ${aktif ? C.accent : "transparent"}`,
                                            cursor: "pointer", textAlign: "left", fontFamily: "inherit", boxSizing: "border-box",
                                        }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: "-0.01em" }}>{u.id}</div>
                                                <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 1 }}>{u.blok}</div>
                                            </div>
                                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", minWidth: 0 }}>
                                                {u.status === "belum"
                                                    ? <Pill w="warn">{u.alasan}</Pill>
                                                    : u.tanda.map((t) => <Pill key={t} w={TANDA[t].warna}>{TANDA[t].label}</Pill>)}
                                            </div>
                                            <div style={{ textAlign: "right", minWidth: 0, whiteSpace: "nowrap" }}>
                                                {u.nilai != null ? (
                                                    <>
                                                        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14 }}>{fmt(u.nilai, u.digits)}</div>
                                                        <div style={{ fontSize: 11.5, color: u.nilai - u.lalu < 0 ? C.bad : C.ink3 }}>
                                                            {u.nilai - u.lalu >= 0 ? "+" : ""}{u.nilai - u.lalu} m³
                                                        </div>
                                                    </>
                                                ) : <div style={{ fontSize: 12, color: C.ink3 }}>tidak terbaca</div>}
                                            </div>
                                        </button>
                                    );
                                })}
                                {pile === "belum" && TERSEMBUNYI.belum > 0 && (
                                    <div style={{ padding: "12px 14px", fontSize: 12.5, color: C.ink2, background: "#fafbfc" }}>
                                        + {TERSEMBUNYI.belum} unit lain belum disambangi petugas — masih dalam putaran, belum perlu keputusan.
                                    </div>
                                )}
                            </div>)}

                        {/* panel bukti */}
                        {(!bertumpuk || view === "detail") && (
                            <div style={{
                                background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16,
                                minWidth: 0,
                                // Panel bisa lebih tinggi dari layar. Tanpa batas + gulir sendiri,
                                // ujung bawahnya (tombol aksi) tertutup bilah kunci yang fixed.
                                ...(bertumpuk ? null : {
                                    position: "sticky", top: 16,
                                    maxHeight: "calc(100vh - 130px)", overflowY: "auto",
                                }),
                            }}>
                                {bertumpuk && (
                                    <button onClick={() => setView("list")} style={{
                                        border: 0, background: "#eef1f4", borderRadius: 9, padding: "7px 12px",
                                        fontSize: 12.5, fontWeight: 700, color: C.ink2, cursor: "pointer",
                                        fontFamily: "inherit", marginBottom: 12,
                                    }}>‹ Kembali ke daftar ({daftar.length})</button>
                                )}
                                {!sel ? (
                                    <div style={{ padding: 20, textAlign: "center", color: C.ink2, fontSize: 13.5 }}>Pilih unit di sebelah kiri.</div>
                                ) : (
                                    <>
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                            <div>
                                                <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>{sel.id}</div>
                                                <div style={{ fontSize: 12.5, color: C.ink2 }}>{sel.blok} · dibaca {sel.petugas} · {sel.jam}</div>
                                            </div>
                                        </div>

                                        {sel.nilai != null ? (
                                            <>
                                                <div style={{ marginTop: 12 }}>
                                                    <FotoMeter value={sel.nilai} digits={sel.digits} serial={sel.serial} jam={sel.jam} />
                                                </div>
                                                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                                                    {[["Bulan lalu", fmt(sel.lalu, sel.digits)], ["Bulan ini", fmt(sel.nilai, sel.digits)], ["Selisih", `${sel.nilai - sel.lalu} m³`]].map(([l, v]) => (
                                                        <div key={l} style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 9px", textAlign: "center" }}>
                                                            <div style={{ fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase", color: C.ink3, fontWeight: 700 }}>{l}</div>
                                                            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 15, marginTop: 2 }}>{v}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ marginTop: 12, background: C.warnSoft, border: `1px solid ${C.warnLine}`, borderRadius: 12, padding: 14 }}>
                                                <div style={{ fontWeight: 700, fontSize: 14, color: C.warn }}>Tidak bisa dibaca</div>
                                                <div style={{ fontSize: 13.5, color: "#6b4207", marginTop: 4, lineHeight: 1.5 }}>{sel.alasan}</div>
                                                <div style={{ fontSize: 12, color: "#7d5a2a", marginTop: 8 }}>
                                                    Petugas {sel.petugas} datang jam {sel.jam} dan memotret kondisinya. Kedatangannya tercatat — yang tidak ada cuma angkanya.
                                                </div>
                                            </div>
                                        )}

                                        {/* tanda */}
                                        {sel.tanda?.length > 0 && (
                                            <>
                                                <Label>Kenapa ditandai</Label>
                                                {sel.tanda.map((t) => (
                                                    <div key={t} style={{ display: "flex", gap: 9, marginBottom: 8 }}>
                                                        <div style={{ flex: "0 0 auto", marginTop: 1 }}><Pill w={TANDA[t].warna}>{TANDA[t].label}</Pill></div>
                                                        <div style={{ fontSize: 12.5, color: C.ink2, lineHeight: 1.5 }}>{TANDA[t].jelas}</div>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* riwayat */}
                                        <Label>Riwayat pembacaan</Label>
                                        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
                                            {sel.riwayat.map((v, i) => {
                                                const prev = i === 0 ? null : sel.riwayat[i - 1];
                                                return (
                                                    <div key={i} style={{ display: "flex", padding: "7px 11px", fontSize: 12.5, borderBottom: `1px solid ${C.line}`, background: "#fff" }}>
                                                        <span style={{ color: C.ink2, width: 46 }}>{BULAN[i]}</span>
                                                        <span style={{ fontFamily: MONO, fontWeight: 600 }}>{fmt(v, sel.digits)}</span>
                                                        <span style={{ marginLeft: "auto", color: C.ink3 }}>{prev == null ? "—" : `+${v - prev} m³`}</span>
                                                    </div>
                                                );
                                            })}
                                            <div style={{ display: "flex", padding: "7px 11px", fontSize: 12.5, background: C.accentSoft, fontWeight: 700 }}>
                                                <span style={{ width: 46 }}>Agu</span>
                                                <span style={{ fontFamily: MONO }}>{sel.nilai != null ? fmt(sel.nilai, sel.digits) : "—"}</span>
                                                <span style={{ marginLeft: "auto", color: sel.nilai != null && sel.nilai - sel.lalu < 0 ? C.bad : C.ink2 }}>
                                                    {sel.nilai != null ? `${sel.nilai - sel.lalu >= 0 ? "+" : ""}${sel.nilai - sel.lalu} m³` : "belum ada"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* catatan yang sudah menempel */}
                                        {sel.catatan.length > 0 && (
                                            <>
                                                <Label>Catatan</Label>
                                                {sel.catatan.map((c, i) => (
                                                    <div key={i} style={{ borderLeft: `3px solid ${C.accentLine}`, paddingLeft: 10, marginBottom: 9 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 650 }}>{c.judul}</div>
                                                        {c.isi && <div style={{ fontSize: 12.5, color: C.ink2, marginTop: 2, lineHeight: 1.5 }}>{c.isi}</div>}
                                                        <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 3 }}>{c.oleh} · {c.waktu}</div>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* aksi */}
                                        <Label>Keputusan kamu</Label>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            {sel.nilai != null && (
                                                <Btn onClick={() => {
                                                    catat(sel.id, { status: "siap" }, { judul: "Angka diterima apa adanya", isi: "Bukti sudah dilihat; angka petugas dipakai untuk tagihan bulan ini.", oleh: "Dewi (kantor)" });
                                                    pilihBerikut(sel.id);
                                                }}>Terima angkanya</Btn>
                                            )}
                                            <Btn variant="outline" onClick={() => {
                                                catat(sel.id, { status: "belum", nilai: undefined, tanda: [], alasan: "Diminta baca ulang oleh kantor" },
                                                    { judul: "Diminta baca ulang", isi: "Unit dikembalikan ke antrean petugas. Angka sebelumnya tetap tersimpan sebagai fakta.", oleh: "Dewi (kantor)" });
                                                pilihBerikut(sel.id);
                                            }}>Minta petugas baca ulang</Btn>
                                            <Btn variant="warn" onClick={() => setModal({ id: sel.id })}>Catat sebagai taksiran</Btn>
                                        </div>
                                        <p style={{ fontSize: 11.5, color: C.ink3, lineHeight: 1.55, marginTop: 10, marginBottom: 0 }}>
                                            Tidak satu pun aksi di atas mengubah angka petugas. Semuanya menambah catatan bertanggal beserta namamu.
                                        </p>
                                    </>
                                )}
                            </div>)}
                    </div>
                )}
            </div>

            {/* ---------------- bilah kunci ---------------- */}
            <div style={{
                position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff",
                borderTop: `1px solid ${C.line}`, padding: "12px 22px", display: "flex",
                alignItems: "center", gap: 16, flexWrap: "wrap",
                boxShadow: "0 -2px 14px rgba(16,24,32,.06)",
            }}>
                <div style={{ fontSize: 12.5, color: C.ink2, lineHeight: 1.5, flex: "1 1 320px" }}>
                    {terkunci
                        ? <><b style={{ color: C.ok }}>Putaran terkunci.</b> Angkanya tidak bisa diubah lagi — koreksi hanya menambah catatan di atasnya.</>
                        : <>Setelah dikunci, angkanya <b>tidak bisa diubah</b> — koreksi hanya menambah catatan di atasnya.
                            {n.belum + n.tinjau > 0 && <> {n.belum + n.tinjau} unit masih tertahan dan tidak ikut terkunci.</>}</>}
                </div>
                <Btn disabled={terkunci} onClick={() => setTerkunci(true)} style={{ padding: "13px 22px", fontSize: 15 }}>
                    {terkunci ? "Sudah terkunci" : `Kunci ${n.siap} bacaan`}
                </Btn>
            </div>

            {/* ---------------- modal taksiran ---------------- */}
            {modal && <ModalTaksiran
                unit={units.find((u) => u.id === modal.id)}
                onBatal={() => setModal(null)}
                onSimpan={({ nilai, alasan, oleh }) => {
                    catat(modal.id, { status: "siap", taksiran: nilai },
                        { judul: `Taksiran ${fmt(nilai, 5)} dicatat`, isi: `${alasan} — angka ini TAKSIRAN MANUSIA, bukan hasil pembacaan. Ditampilkan berbeda ke tenant.`, oleh });
                    setModal(null);
                    pilihBerikut(modal.id);
                }} />}
        </div>
    );
}

/* ------------------------------------------------------------ modal taksiran */

function ModalTaksiran({ unit, onBatal, onSimpan }) {
    const [nilai, setNilai] = useState("");
    const [alasan, setAlasan] = useState("");
    const [oleh, setOleh] = useState("");
    const valid = nilai.length === unit.digits && alasan.trim().length > 3 && oleh.trim().length > 1;

    const inp = {
        width: "100%", padding: "11px 12px", borderRadius: 10, border: `1.5px solid ${C.line}`,
        fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", color: C.ink,
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12,18,24,.5)", display: "grid", placeItems: "center", padding: 20, zIndex: 40 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 22, width: "min(520px, 100%)", maxHeight: "88vh", overflowY: "auto" }}>
                <h3 style={{ margin: "0 0 8px", fontSize: 19, letterSpacing: "-0.02em" }}>Catat taksiran untuk {unit.id}</h3>

                <div style={{ background: C.warnSoft, border: `1px solid ${C.warnLine}`, borderRadius: 12, padding: 13, margin: "0 0 16px" }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#6b4207" }}>
                        Taksiran <b>tidak akan pernah ditampilkan sebagai hasil pembacaan</b>. Di tagihan dan di
                        tautan yang dibuka tenant, angka ini muncul dengan label <b>“taksiran kantor”</b> beserta
                        namamu — bukan sebagai angka meter.
                        <br /><br />
                        Ini disediakan karena kalau produk tidak menyediakannya, taksiran tetap terjadi di
                        spreadsheet tanpa jejak sama sekali. Yang dijaga di sini bukan mencegahnya, tapi
                        memastikan ia tidak menyamar.
                    </div>
                </div>

                <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 14 }}>
                    Bulan lalu <b style={{ fontFamily: MONO }}>{fmt(unit.lalu, unit.digits)}</b> · rata-rata pemakaian{" "}
                    <b>{Math.round((unit.riwayat[unit.riwayat.length - 1] - unit.riwayat[0]) / (unit.riwayat.length - 1))} m³</b>/bulan
                </div>

                <label style={{ display: "block", fontSize: 12.5, fontWeight: 650, marginBottom: 5 }}>Angka taksiran ({unit.digits} digit)</label>
                <input inputMode="numeric" value={nilai} placeholder={pad(unit.lalu, unit.digits)}
                    onChange={(e) => setNilai(e.target.value.replace(/\D/g, "").slice(0, unit.digits))}
                    style={{ ...inp, fontFamily: MONO, fontSize: 18, letterSpacing: ".08em" }} />

                <label style={{ display: "block", fontSize: 12.5, fontWeight: 650, margin: "14px 0 5px" }}>Dasar taksiran (wajib)</label>
                <textarea value={alasan} rows={2} placeholder="mis. rata-rata 3 bulan terakhir, ruko tutup sejak Juli"
                    onChange={(e) => setAlasan(e.target.value)} style={{ ...inp, resize: "vertical" }} />

                <label style={{ display: "block", fontSize: 12.5, fontWeight: 650, margin: "14px 0 5px" }}>Nama penaksir (wajib)</label>
                <input value={oleh} placeholder="nama kamu" onChange={(e) => setOleh(e.target.value)} style={inp} />

                <div style={{ display: "flex", gap: 9, marginTop: 18, justifyContent: "flex-end" }}>
                    <Btn variant="outline" onClick={onBatal}>Batal</Btn>
                    <Btn disabled={!valid} variant="warn" onClick={() => onSimpan({ nilai: parseInt(nilai, 10), alasan: alasan.trim(), oleh: oleh.trim() })}>
                        Simpan sebagai taksiran
                    </Btn>
                </div>
            </div>
        </div>
    );
}