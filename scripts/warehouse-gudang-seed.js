// ============================================================
// Warehouse (Gudang) Runtime — Seed tambahan utk fitur GUDANG O1
// ------------------------------------------------------------
// FILE TERPISAH. Taruh sebagai .gs KEDUA di project Apps Script yang
// SAMA (Extensions ▸ Apps Script) bareng `driver-runtime-seed.gs`.
// Apps Script = 1 global scope utk semua .gs → file ini MANGGIL helper
// punya driver-runtime-seed (readFlatTab, num, str, buildItLine,
// syncCollection, getAccessToken) TANPA redefine. Driver file 0 baris berubah.
//
// TUJUAN: seed 1 mobil "level admin" yang BELUM disentuh gudang →
//   - stock_location vehicle TANPA `dv`  → tier H1 = `loading`
//   - task (vv=mobil ini, tst=assigned, it[] plan)  → O1 task list + count
//   - GAK ADA vehicle_check / movement / dv  → gudang O1 yang bikin nanti
// Hasil: 1 dataset Firestore works 2 fitur —
//   mobil driver (existing seed, utuh) + mobil gudang (loading) ini.
//
// KENAPA AMAN KE DRIVER:
//   - Baca TAB BARU (Gudang_Mobil / Gudang_Tugas / Gudang_Barang), BUKAN
//     Master_Mobil/Tugas/Barang → driver seed gak pernah liat baris ini.
//   - GAK manggil computeManifestFull → 0 manifest bleed ke ie[] driver.
//   - syncCollection upsert by key (lv/tnm beda) → doc BARU, gak nimpa driver.
//   - ENABLE_DELETE=false (driver CONFIG) → doc driver yg "orphan" cuma
//     dilaporin, GAK dihapus.
//   - item TIDAK di-seed — `ii` di Gudang_Barang nunjuk Master_Item yg udah
//     ke-seed driver (join O1 task→item jalan).
//
// JALANIN (gak pake menu, hindari tabrakan onOpen driver):
//   editor Apps Script → dropdown fungsi → `previewGudang` (cek dulu, GAK nulis)
//   → kalau OK → `pushGudangAll` (nulis Firestore). Pertama kali minta Authorize.
// ============================================================


// stock_location vehicle GUDANG = SENGAJA tanpa `dv` (itu yg bikin tier loading).
// Tab Gudang_Mobil kolom: Vehicle VID (lv) · Plat (ln) · [Status (lst)]
function buildGudangStock(ss) {
    return readFlatTab(ss, 'Gudang_Mobil').map(r => ({
        lv: str(r.lv), lt: 'vehicle', ln: r.ln, lst: str(r.lst) || 'active',
        // NO dv → loading tier. NO vehicle_check (mobil ini gak masuk Setup driver).
    }));
}

// task GUDANG = mirror buildTasks driver, tapi baca tab Gudang_*, tst default 'assigned'.
// Reuse buildItLine (driver) utk it[]. Tab Gudang_Tugas kolom:
//   Nama Task (tnm) · Tipe (tty) · Status (tst) · Customer VID (kl) · Customer (kn)
//   · Alamat (al) · Gudang VID (gl) · Vehicle VID (vv) · [Checker VID (cv)] · [Checker (cn)] · Tanggal (tdt)
// Tab Gudang_Barang kolom: Task (tnm) · Item VID (ii) · Item (in) · Transaksi (tx) · Plan Antar (pd) · Plan Pinjam (pp) [· ps/pb/pr]
function buildGudangTasks(ss) {
    const tugas = readFlatTab(ss, 'Gudang_Tugas');
    const barang = readFlatTab(ss, 'Gudang_Barang');
    const byTnm = {};
    barang.forEach(b => { const k = str(b.tnm); if (!k) return; (byTnm[k] = byTnm[k] || []).push(b); });
    return tugas.map(t => {
        const tnm = str(t.tnm);
        return {
            tnm: tnm, tty: t.tty, tst: str(t.tst) || 'assigned',
            kl: str(t.kl), kn: t.kn, al: t.al,
            gl: str(t.gl), vv: str(t.vv),
            cv: str(t.cv), cn: t.cn,
            tdt: num(t.tdt),
            it: (byTnm[tnm] || []).map(buildItLine),
            search: str(t.search) || ('tnm★' + tnm),
        };
    });
}

// PRATINJAU — build + log JSON, GAK nulis Firestore. Plus sanity-check:
// mobil HARUS tanpa dv (loading), task HARUS punya vv. Jalanin ini DULU.
function previewGudang() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const stock = buildGudangStock(ss);
    const tasks = buildGudangTasks(ss);
    Logger.log('=== Gudang stock_location (' + stock.length + ') ===');
    stock.forEach(d => Logger.log(JSON.stringify(d)));
    Logger.log('=== Gudang task (' + tasks.length + ') ===');
    tasks.forEach(d => Logger.log(JSON.stringify(d)));

    const bad = [];
    stock.forEach(s => { if (s.dv) bad.push('mobil ' + s.lv + ' punya dv (harusnya KOSONG → loading tier)'); });
    tasks.forEach(t => {
        if (!t.vv) bad.push('task ' + t.tnm + ' gak ada vv');
        if (!t.it || !t.it.length) bad.push('task ' + t.tnm + ' it[] kosong (count list bakal blank)');
    });

    SpreadsheetApp.getUi().alert(
        '🔎 Pratinjau GUDANG (GAK nulis Firestore)\n\n' +
        'stock_location : ' + stock.length + '\n' +
        'task           : ' + tasks.length +
        (bad.length ? '\n\n⚠️ MASALAH:\n• ' + bad.join('\n• ')
            : '\n\n✅ mobil tanpa dv (loading), task ada vv + it[].') +
        '\n\nDetail JSON: Executions / Logs.'
    );
}

// PUSH — tulis stock_location(loading) + task ke Firestore. Reuse syncCollection driver
// (fetch existing → upsert by key → orphan SKIP krn ENABLE_DELETE=false).
function pushGudangAll() {
    const token = getAccessToken();
    if (!token) { SpreadsheetApp.getUi().alert('Gagal access token. Cek service account key.'); return; }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cfgs = [
        { name: 'stock_location', key: 'lv', build: buildGudangStock },
        { name: 'task', key: 'tnm', build: buildGudangTasks },
    ];
    const lines = [];
    for (const cfg of cfgs) {
        try {
            const s = syncCollection(token, cfg, ss);
            lines.push(`${cfg.name}: +${s.added} ✏️${s.updated} ⏭️orphan${s.skipped} ❌${s.errors}`);
        } catch (e) {
            lines.push(`${cfg.name}: ❌ ${e.message}`);
        }
    }
    ss.toast('Push GUDANG selesai!', '✅', 5);
    SpreadsheetApp.getUi().alert('✅ Push GUDANG selesai!\n\n' + lines.join('\n') +
        '\n\n(orphan = doc driver yg GAK kehapus, aman — ENABLE_DELETE=false.)');
}
