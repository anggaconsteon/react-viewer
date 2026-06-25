// ============================================================
// Driver Runtime — Seed Firestore dari ADMIN-ENTRY tabs
// ------------------------------------------------------------
// Bound script utk spreadsheet dictionary (1_XHmo5...).
//
// SUMBER BARU (2026-06-22): admin-entry 2-layer
//   MASTER  : Master_Item · Master_Mobil · Master_Customer · Master_Gudang · Master_Driver
//   HARIAN  : Setup (1 dispatch) · Tugas (stop) · Barang (item per stop)
//   (BUKAN lagi dummy-block dict tab / parseDummyBlock.)
//
// Bikin 5 collection (model it[]-array, schema dict-book):
//   item · stock_location · task(+it[]) · vehicle_check(OPEN) · movement(LOAD)
//   asset_cache = TIDAK di-seed lagi (CF live 2026-06-24) → di-DERIVE CF dari movement.
//   movement opening LOAD (gudang→mobil) di-seed → OnMovementCreated bangun asset_cache.
//
// Path: MobileTable/60936087747650/tables/84214220504259/{collection}
//
// DERIVE (bukan ketik admin):
//   task.it[]        = group Barang by tnm (plan-only; ad/ap/as/ab/ar = null)
//   stock_location   = union Master_Gudang(warehouse)+Mobil(vehicle,+dv)+Customer(client)
//   vehicle_check    = OPEN; ie[]=manifest Σ Keluar(full); ip[]=[]; cst=awaiting_custody
//   movement(LOAD)   = INTERNAL gudang→mobil per item manifest full → CF derive asset_cache
//
// Doc id = AUTO-ID (business key disimpan sbg field utk upsert), KECUALI
//   movement = deterministik `seedload-{vv}-{ii}-{cd}` (idempoten; CF marker pakai doc-id).
//
// SETUP (sekali): Apps Script > Project Settings > Script Properties:
//   FIRESTORE_SERVICE_ACCOUNT = <JSON service account> (project fir-app-dev1).
//   Reload sheet → menu "🔥 Driver Seed".
// ============================================================

// const CONFIG = {
//     FIRESTORE_PROJECT_ID: 'otq-01',
//     MOBILE_TABLE_DOC_ID: '20342033315492',
//     TABLE_VID: '84214220504259',
//     SERVICE_ACCOUNT_KEY: 'FIRESTORE_SERVICE_ACCOUNT',
//     BATCH_SIZE: 500,
//     // ⚠️ SAFETY: default false = TIDAK PERNAH menghapus apapun (upsert only).
//     // Orphan (doc di Firestore yg gak ada di sheet) cuma dilaporin.
//     // Set true HANYA kalau yakin mau full-sync — itupun masih minta confirm.
//     ENABLE_DELETE: false,
// };

const CONFIG = {
    FIRESTORE_PROJECT_ID: 'fir-app-dev1',
    MOBILE_TABLE_DOC_ID: '60936087747650',
    TABLE_VID: '84214220504259',
    SERVICE_ACCOUNT_KEY: 'FIRESTORE_SERVICE_ACCOUNT',
    BATCH_SIZE: 500,
    // ⚠️ SAFETY: default false = TIDAK PERNAH menghapus apapun (upsert only).
    // Orphan (doc di Firestore yg gak ada di sheet) cuma dilaporin.
    // Set true HANYA kalau yakin mau full-sync — itupun masih minta confirm.
    ENABLE_DELETE: false,
};

// Urutan = urutan push (master dulu, baru FK).
const COLLECTIONS = [
    { name: 'item', key: 'ii', build: buildItems },
    { name: 'stock_location', key: 'lv', build: buildStockLocations },
    { name: 'task', key: 'tnm', build: buildTasks },
    { name: 'vehicle_check', key: 'cnm', build: buildVehicleCheckOpen },
    // asset_cache TIDAK di-seed lagi — di-DERIVE CF dari movement LOAD ini (CF live 2026-06-24).
    { name: 'movement', key: 'mid', build: buildMovementsOpening, docIdFields: ['mid'] },
];

const FIRESTORE_BASE = () =>
    `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents`;
const collectionPath = (name) =>
    `MobileTable/${CONFIG.MOBILE_TABLE_DOC_ID}/tables/${CONFIG.TABLE_VID}/${name}`;


// ============================================================ MENU
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('🔥 Driver Seed')
        .addItem('Push item → Firestore', 'pushItem')
        .addItem('Push stock_location → Firestore', 'pushStockLocation')
        .addItem('Push task → Firestore', 'pushTask')
        .addItem('Push vehicle_check (OPEN) → Firestore', 'pushVehicleCheck')
        .addItem('Push movement LOAD (CF derive asset_cache) → Firestore', 'pushMovement')
        .addSeparator()
        .addItem('Push SEMUA (item → … → movement)', 'pushAll')
        .addItem('🔎 Pratinjau (log doang, GAK nulis Firestore)', 'previewAll')
        .addSeparator()
        .addItem('🎛️ Pasang dropdown + lock kolom auto', 'setupAdminUI')
        .addToUi();
}

function pushItem() { syncOne('item'); }
function pushStockLocation() { syncOne('stock_location'); }
function pushTask() { syncOne('task'); }
function pushVehicleCheck() { syncOne('vehicle_check'); }
function pushMovement() { syncOne('movement'); }

function pushAll() {
    const token = getAccessToken();
    if (!token) { SpreadsheetApp.getUi().alert('Gagal access token. Cek service account key.'); return; }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lines = [];
    for (const cfg of COLLECTIONS) {
        try {
            const s = syncCollection(token, cfg, ss);
            lines.push(`${cfg.name}: +${s.added} ✏️${s.updated} 🗑️${s.deleted} ⏭️${s.skipped} ❌${s.errors}`);
        } catch (e) {
            lines.push(`${cfg.name}: ❌ ${e.message}`);
        }
    }
    ss.toast('Push semua selesai!', '✅ Selesai', 5);
    SpreadsheetApp.getUi().alert('✅ Push SEMUA selesai!\n\n' + lines.join('\n'));
}

function syncOne(name) {
    const token = getAccessToken();
    if (!token) { SpreadsheetApp.getUi().alert('Gagal access token. Cek service account key.'); return; }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const cfg = COLLECTIONS.find(c => c.name === name);
    try {
        const s = syncCollection(token, cfg, ss);
        ss.toast('Sync selesai!', '✅', 5);
        SpreadsheetApp.getUi().alert(
            `✅ ${name} selesai!\n\n` +
            `➕ Ditambah : ${s.added}\n✏️  Diupdate : ${s.updated}\n` +
            `🗑️  Dihapus  : ${s.deleted}\n⏭️  Orphan   : ${s.skipped}\n❌ Error    : ${s.errors}`
        );
    } catch (e) {
        SpreadsheetApp.getUi().alert(`❌ ${name}: ${e.message}`);
    }
}

// Pratinjau: build semua doc, log JSON, GAK nulis Firestore. Cek dulu sebelum push.
function previewAll() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const counts = [];
    for (const cfg of COLLECTIONS) {
        try {
            const docs = cfg.build(ss);
            Logger.log(`=== ${cfg.name} (${docs.length}) ===`);
            docs.forEach(d => Logger.log(JSON.stringify(d)));
            counts.push(`${cfg.name}: ${docs.length}`);
        } catch (e) {
            counts.push(`${cfg.name}: ❌ ${e.message}`);
        }
    }
    SpreadsheetApp.getUi().alert('🔎 Pratinjau (GAK nulis Firestore):\n\n' + counts.join('\n') +
        '\n\nDetail JSON di Apps Script > Executions / Logs.');
}


// ============================================================ READERS
// Tab flat: header row 1. Kolom dgn "Label (kode)" → field `kode`.
// Kolom tanpa (kode) = input/visual → diabaikan reader.
function readFlatTab(ss, sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet "${sheetName}" tidak ada`);
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    const header = values[0];
    const code = header.map(h => {
        const m = String(h || '').match(/\(([^)]+)\)/);
        return m ? m[1].trim() : null;
    });
    const out = [];
    for (let r = 1; r < values.length; r++) {
        const row = values[r];
        const obj = {};
        let has = false;
        for (let c = 0; c < code.length; c++) {
            if (!code[c]) continue;
            const v = row[c];
            if (v === '' || v === null || v === undefined) continue;
            obj[code[c]] = v;
            has = true;
        }
        if (has) out.push(obj);
    }
    return out;
}

// Setup = 1 baris dispatch (posisi tetap A..J).
function readSetup(ss) {
    const sheet = ss.getSheetByName('Setup');
    if (!sheet) throw new Error('Sheet "Setup" tidak ada');
    const r = sheet.getRange(2, 1, 1, 10);
    const v = r.getValues()[0];
    const d = r.getDisplayValues()[0]; // VID kolom (E/I) bisa ke-format DATE → getValues()=Invalid Date; pakai display string buat ID numerik.
    return {
        mobilPlat: v[0], tanggal: v[1], adminName: v[2],
        driverName: v[3], driverVid: d[4], vv: v[5],
        gudangName: v[6], gl: v[7], adminVid: d[8], tdt: v[9],
    };
}


// ============================================================ HELPERS
function num(x) { const n = Number(x); return isNaN(n) ? 0 : n; }
function str(x) { return (x === null || x === undefined) ? '' : String(x).trim(); }

function parseArr(s) {
    s = str(s);
    if (!s) return [];
    try { const a = JSON.parse(s); if (Array.isArray(a)) return a; } catch (e) { }
    return s.replace(/^\s*\[|\]\s*$/g, '').split(',')
        .map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

// epoch (WIB-midnight ms) → "yyyymmdd" (tanggal WIB)
function ymdWIB(epochMs) {
    const d = new Date(num(epochMs) + 25200000); // geser +7 jam ke WIB
    const m = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    const dd = ('0' + d.getUTCDate()).slice(-2);
    return '' + d.getUTCFullYear() + m + dd;
}


// ============================================================ BUILDERS
function buildItems(ss) {
    return readFlatTab(ss, 'Master_Item').map(r => {
        const doc = { ii: str(r.ii), in: r.in, ic: r.ic, tc: parseArr(r.tc), un: r.un, ist: r.ist };
        if (str(r.wt)) doc.wt = str(r.wt);
        return doc;
    });
}

function buildStockLocations(ss) {
    const out = [];
    readFlatTab(ss, 'Master_Gudang').forEach(r =>
        out.push({ lv: str(r.gl), lt: 'warehouse', ln: r.ln, al: r.al, lst: str(r.lst) || 'active' }));
    readFlatTab(ss, 'Master_Mobil').forEach(r => {
        const doc = { lv: str(r.lv), lt: 'vehicle', ln: r.ln, lst: str(r.lst) || 'active' };
        if (str(r.dv)) doc.dv = str(r.dv); // binding mobil↔driver
        out.push(doc);
    });
    readFlatTab(ss, 'Master_Customer').forEach(r =>
        out.push({ lv: str(r.kl), lt: 'client', ln: r.kn, al: r.al, lst: str(r.lst) || 'active' }));
    return out;
}

// 1 baris it[] (sparse per tx; plan-only, aktual = null)
function buildItLine(b) {
    const tx = str(b.tx) || 'deliver';
    const line = { ii: str(b.ii), in: b.in, tx: tx };
    if (str(b.cdo)) line.cdo = str(b.cdo);
    if (str(b.cdi)) line.cdi = str(b.cdi);
    if (tx === 'deliver') { line.pd = num(b.pd); line.pp = num(b.pp); line.ad = null; line.ap = null; }
    else if (tx === 'sale') { line.ps = num(b.ps); line.as = null; }
    else if (tx === 'purchase') { line.pb = num(b.pb); line.ab = null; }
    else if (tx === 'refill') { line.pr = num(b.pr); line.ar = null; }
    return line;
}

function buildTasks(ss) {
    const tugas = readFlatTab(ss, 'Tugas');
    const barang = readFlatTab(ss, 'Barang');
    const byTnm = {};
    barang.forEach(b => { const k = str(b.tnm); if (!k) return; (byTnm[k] = byTnm[k] || []).push(b); });
    return tugas.map(t => {
        const tnm = str(t.tnm);
        return {
            tnm: tnm, tty: t.tty, tst: t.tst,
            kl: str(t.kl), kn: t.kn, al: t.al,
            gl: str(t.gl), vv: str(t.vv),
            cv: str(t.cv), cn: t.cn,
            tdt: num(t.tdt),
            it: (byTnm[tnm] || []).map(buildItLine),
            search: str(t.search) || ('tnm★' + tnm),
        };
    });
}

// manifest = barang DIMUAT dari gudang = Σ Keluar(full): deliver pd + sale ps + refill pr.
// purchase (pb) TIDAK dimuat (datang dari customer). → [{ii,cd:'full',qt}]
function computeManifestFull(ss) {
    const agg = {};
    readFlatTab(ss, 'Barang').forEach(b => {
        const ii = str(b.ii); if (!ii) return;
        const tx = str(b.tx);
        let q = 0;
        if (tx === 'deliver') q = num(b.pd);
        else if (tx === 'sale') q = num(b.ps);
        else if (tx === 'refill') q = num(b.pr);
        if (q > 0) agg[ii] = (agg[ii] || 0) + q;
    });
    return Object.keys(agg).map(ii => ({ ii: ii, cd: 'full', qt: agg[ii] }));
}

// vehicle_check OPEN (custody belum dihitung): manifest di ie[], ip[] kosong, cst=awaiting_custody.
function buildVehicleCheckOpen(ss) {
    const s = readSetup(ss);
    const loader = readFlatTab(ss, 'Master_Driver').filter(d => str(d.role) === 'loader')[0] || {};
    const plate = str(s.mobilPlat).replace(/\s+/g, '');
    const cnm = `CHK-VEH-${plate}-${ymdWIB(s.tdt)}-OPEN`;
    return [{
        cnm: cnm, cty: 'opening',
        vv: str(s.vv), gl: str(s.gl),
        cv: str(s.driverVid), cn: s.driverName,
        cdt: num(s.tdt),
        ie: computeManifestFull(ss),
        cst: 'awaiting_custody',
        rt: 'pending', // return status: pending → returned (driver "Serahkan ke Gudang"). Gate navActionCard hide pas returned.
        gv: str(loader.wv), gn: str(loader.wn),
        ldt: Date.now(), // waktu seed dijalankan = waktu selesai muat (realistis utk dummy)
    }];
}

// [DEAD sejak CF live 2026-06-24] asset_cache opening mobil = manifest full (HAND-SEED).
// Disimpen buat revert kalau CF mati; TIDAK lagi di COLLECTIONS — asset_cache di-derive CF.
function buildAssetCacheOpening(ss) {
    const s = readSetup(ss);
    return computeManifestFull(ss).map(m => ({
        lv: str(s.vv), lt: 'vehicle', ii: m.ii, cd: m.cd, qt: m.qt,
    }));
}

// opening movements (real-case flow) = 2 fase, CF (OnMovementCreated) yang DERIVE asset_cache:
//   1. STOK-AWAL GUDANG: ADJUSTMENT null→gudang per item (qty dari Master_Item `ga`). Biar gudang
//      POSITIF — real case gudang ada stok dari supplier DULU sebelum muat. Tanpa ini gudang minus.
//   2. LOAD: INTERNAL gudang→mobil per item manifest (computeManifestFull = pd+ps+pr).
// asset_cache TIDAK di-hand-seed lagi. Arah dari fl/tl (CF abaikan mt). Idempoten: doc-id deterministik;
// re-seed = overwrite (CF onCreate TIDAK re-fire di overwrite → rebuild via HTTP ReconcileAssetCache kalau ubah qty).
function buildMovementsOpening(ss) {
    const s = readSetup(ss);
    const loader = readFlatTab(ss, 'Master_Driver').filter(d => str(d.role) === 'loader')[0] || {};
    const nowMs = Date.now();
    const ts = fmtTS(nowMs);
    const gstok = gudangStockMap(ss);
    const manifest = computeManifestFull(ss); // [{ii, cd:'full', qt}]
    const out = [];

    // 1. Stok-awal gudang (supplier→gudang). fl kosong = stok masuk (CF: tl→+qt).
    manifest.forEach(m => {
        const qt = num(gstok[m.ii]);
        if (qt <= 0) return; // gak ada stok-awal → skip (item ini bakal minus di gudang)
        out.push({
            mid: `seedstock-${str(s.gl)}-${m.ii}-${m.cd}`,
            mt: 'ADJUSTMENT',
            tl: str(s.gl), // ke gudang (fl di-omit)
            ii: m.ii, cd: m.cd, qt: qt,
            er: 'GUDANG',
            d: 'stok awal gudang (seed)',
            t: nowMs, ts: ts,
        });
    });

    // 2. Load gudang→mobil.
    manifest.forEach(m => out.push({
        mid: `seedload-${str(s.vv)}-${m.ii}-${m.cd}`,
        mt: 'INTERNAL',
        fl: str(s.gl),   // gudang asal
        tl: str(s.vv),   // mobil tujuan
        ii: m.ii, cd: m.cd, qt: m.qt,
        er: 'GUDANG',
        dv: str(loader.wv), dn: str(loader.wn),
        d: 'opening load (seed)',
        t: nowMs, ts: ts,
    }));

    return out;
}

// stok awal gudang per item dari Master_Item kolom `ga` (Stok Gudang) → {ii: qty}.
function gudangStockMap(ss) {
    const map = {};
    readFlatTab(ss, 'Master_Item').forEach(r => {
        const ii = str(r.ii); if (!ii) return;
        map[ii] = num(r.ga);
    });
    return map;
}

// epoch ms → "DD Mon YYYY HH:MM" WIB. Format yg dibaca CF `internal/period.FromTS` buat
// bucket asset_cache_monthly (bulan EN 3-huruf). Pakai getUTC* setelah geser +7 jam.
function fmtTS(epochMs) {
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(num(epochMs) + 25200000); // +7h → WIB
    const p2 = n => ('0' + n).slice(-2);
    return `${p2(d.getUTCDate())} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}


// ============================================================ CORE: 1 collection
function syncCollection(token, cfg, ss) {
    const stats = { added: 0, updated: 0, deleted: 0, skipped: 0, errors: 0 };

    const docs = cfg.build(ss).filter(d => d[cfg.key] !== undefined && String(d[cfg.key]).length > 0);
    Logger.log(`${cfg.name}: ${docs.length} doc dari sheet`);

    const path = collectionPath(cfg.name);
    ss.toast(`Fetch existing ${cfg.name}...`, '☁️', -1);
    const existing = fetchExisting(token, path, cfg);

    const ops = buildOps(docs, existing, cfg, path);
    Logger.log(`${cfg.name}: ${ops.writes.length} writes, ${ops.deletes.length} deletes`);

    if (ops.writes.length) {
        ss.toast(`Tulis ${ops.writes.length} ${cfg.name}...`, '✏️', -1);
        const w = sendBatchWrites(token, ops.writes, ss);
        stats.added += w.added; stats.updated += w.updated; stats.errors += w.errors;
    }
    if (ops.deletes.length) {
        if (!CONFIG.ENABLE_DELETE) {
            stats.skipped += ops.deletes.length;
            Logger.log(`${cfg.name}: ${ops.deletes.length} orphan DILEWATI (ENABLE_DELETE=false): ` +
                ops.deletes.map(d => d.key).join(', '));
        } else if (confirmDeletes(cfg.name, ops.deletes)) {
            ss.toast(`Hapus ${ops.deletes.length} orphan ${cfg.name}...`, '🗑️', -1);
            const d = sendBatchDeletes(token, ops.deletes, ss);
            stats.deleted += d.deleted; stats.errors += d.errors;
        } else {
            stats.skipped += ops.deletes.length;
        }
    }
    return stats;
}

function confirmDeletes(sheetName, deletes) {
    const ui = SpreadsheetApp.getUi();
    const keys = deletes.map(d => d.key);
    const preview = keys.slice(0, 30).join('\n  • ');
    const more = keys.length > 30 ? `\n  …dan ${keys.length - 30} lagi` : '';
    const resp = ui.alert(
        `⚠️ HAPUS ${keys.length} doc di "${sheetName}"?`,
        `Doc ini ADA di Firestore tapi GAK ADA di sheet, akan DIHAPUS PERMANEN:\n\n  • ${preview}${more}\n\nLanjut hapus?`,
        ui.ButtonSet.YES_NO
    );
    return resp === ui.Button.YES;
}


// ============================================================ FETCH EXISTING
function fetchExisting(token, path, cfg) {
    const result = {};
    const useDocId = Array.isArray(cfg.docIdFields) && cfg.docIdFields.length > 0;
    let pageToken = null;
    do {
        let url = `${FIRESTORE_BASE()}/${path}?pageSize=300`;
        if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
        const res = UrlFetchApp.fetch(url, {
            method: 'GET', headers: { Authorization: `Bearer ${token}` }, muteHttpExceptions: true,
        });
        const json = JSON.parse(res.getContentText());
        if (json.documents) {
            for (const doc of json.documents) {
                const parts = doc.name.split('/');
                const docId = parts[parts.length - 1];
                if (useDocId) {
                    result[docId] = docId;
                } else {
                    const f = doc.fields && doc.fields[cfg.key];
                    const keyVal = f ? (f.stringValue || '') : '';
                    if (keyVal) result[keyVal] = docId;
                }
            }
        }
        pageToken = json.nextPageToken || null;
    } while (pageToken);
    return result;
}


// ============================================================ BUILD OPS (upsert + orphan)
function buildOps(docs, existing, cfg, path) {
    const writes = [];
    const deletes = [];
    const sheetKeys = new Set();
    const useDocId = Array.isArray(cfg.docIdFields) && cfg.docIdFields.length > 0;

    for (const doc of docs) {
        const k = useDocId ? cfg.docIdFields.map(f => String(doc[f])).join('__') : String(doc[cfg.key]);
        sheetKeys.add(k);
        if (useDocId) {
            writes.push({ type: 'update', fullPath: `${path}/${k}`, data: doc });
        } else if (existing[k]) {
            writes.push({ type: 'update', fullPath: `${path}/${existing[k]}`, data: doc });
        } else {
            writes.push({ type: 'create', fullPath: `${path}/${generateAutoId()}`, data: doc });
        }
    }
    for (const [k, docId] of Object.entries(existing)) {
        if (!sheetKeys.has(k)) deletes.push({ fullPath: `${path}/${docId}`, key: k });
    }
    return { writes: writes, deletes: deletes };
}


// ============================================================ BATCH WRITE / DELETE
function sendBatchWrites(token, writes, ss) {
    const stats = { added: 0, updated: 0, errors: 0 };
    const chunks = chunkArray(writes, CONFIG.BATCH_SIZE);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        ss.toast(`Write batch ${i + 1}/${chunks.length}...`, '✏️', -1);
        const batchWrites = chunk.map(op => {
            const docName = `projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${op.fullPath}`;
            if (op.type === 'create') {
                return { update: { ...toFirestoreDoc(op.data), name: docName }, currentDocument: { exists: false } };
            }
            return { update: { ...toFirestoreDoc(op.data), name: docName } };
        });
        try {
            const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents:batchWrite`;
            const res = UrlFetchApp.fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                payload: JSON.stringify({ writes: batchWrites }),
                muteHttpExceptions: true,
            });
            if (res.getResponseCode() !== 200) {
                Logger.log(`Batch write error [${res.getResponseCode()}]: ${res.getContentText()}`);
                stats.errors += chunk.length;
            } else {
                chunk.forEach(op => { if (op.type === 'create') stats.added++; else stats.updated++; });
            }
        } catch (e) {
            Logger.log(`Batch write exception: ${e.message}`);
            stats.errors += chunk.length;
        }
    }
    return stats;
}

function sendBatchDeletes(token, deletes, ss) {
    const stats = { deleted: 0, errors: 0 };
    const chunks = chunkArray(deletes, CONFIG.BATCH_SIZE);
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        ss.toast(`Delete batch ${i + 1}/${chunks.length}...`, '🗑️', -1);
        const batchWrites = chunk.map(op => ({
            delete: `projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${op.fullPath}`,
        }));
        try {
            const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents:batchWrite`;
            const res = UrlFetchApp.fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                payload: JSON.stringify({ writes: batchWrites }),
                muteHttpExceptions: true,
            });
            if (res.getResponseCode() !== 200) {
                Logger.log(`Batch delete error [${res.getResponseCode()}]: ${res.getContentText()}`);
                stats.errors += chunk.length;
            } else {
                stats.deleted += chunk.length;
            }
        } catch (e) {
            Logger.log(`Batch delete exception: ${e.message}`);
            stats.errors += chunk.length;
        }
    }
    return stats;
}


// ============================================================ FIRESTORE VALUE HELPERS
function toFirestoreValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
        if (!isFinite(value)) return { nullValue: null }; // NaN/Infinity → null; cegah JSON.stringify bikin {doubleValue:null} → Firestore "type unset"
        return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    }
    if (typeof value === 'string') return { stringValue: value };
    if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
    if (typeof value === 'object') {
        const fields = {};
        for (const [k, v] of Object.entries(value)) fields[k] = toFirestoreValue(v);
        return { mapValue: { fields } };
    }
    return { stringValue: String(value) };
}

function toFirestoreDoc(plainObj) {
    const fields = {};
    for (const [k, v] of Object.entries(plainObj)) {
        if (Array.isArray(v) && v.length === 0) continue; // empty array → omit; Firestore REST nolak empty arrayValue ("type unset")
        fields[k] = toFirestoreValue(v);
    }
    return { fields };
}


// ============================================================ UTIL
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

function generateAutoId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 20; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
}


// ============================================================ JWT AUTH
function getAccessToken() {
    try {
        const sa = JSON.parse(
            PropertiesService.getScriptProperties().getProperty(CONFIG.SERVICE_ACCOUNT_KEY)
        );
        if (!sa) return null;
        const now = Math.floor(Date.now() / 1000);
        const header = { alg: 'RS256', typ: 'JWT' };
        const claim = {
            iss: sa.client_email,
            scope: 'https://www.googleapis.com/auth/datastore',
            aud: 'https://oauth2.googleapis.com/token',
            iat: now, exp: now + 3600,
        };
        const b64Header = Utilities.base64EncodeWebSafe(JSON.stringify(header)).replace(/=+$/, '');
        const b64Claim = Utilities.base64EncodeWebSafe(JSON.stringify(claim)).replace(/=+$/, '');
        const toSign = `${b64Header}.${b64Claim}`;
        const sig = Utilities.computeRsaSha256Signature(toSign, sa.private_key.replace(/\\n/g, '\n'));
        const jwt = `${toSign}.${Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '')}`;
        const tokenRes = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            payload: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
            muteHttpExceptions: true,
        });
        return JSON.parse(tokenRes.getContentText()).access_token || null;
    } catch (e) {
        Logger.log(`getAccessToken error: ${e.message}`);
        return null;
    }
}


// ============================================================ ADMIN UI — dropdown + lock kolom auto
// Sumber dropdown = master sheet. Lock = warning di kolom ⟵auto (formula) biar gaptek gak nimpa.
function setupAdminUI() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- dropdown (pilih by NAMA) ---
    dvFromRange(ss, 'Setup', 'A2:A2', 'Master_Mobil', 'B2:B100');     // Mobil (plat)
    dvFromRange(ss, 'Setup', 'C2:C2', 'Master_Driver', 'B2:B100');    // Admin (nama)
    dvFromRange(ss, 'Tugas', 'A2:A200', 'Master_Customer', 'B2:B100'); // Customer
    dvFromList(ss, 'Tugas', 'B2:B200', ['Antar', 'Ambil']);           // Jenis
    dvFromRange(ss, 'Barang', 'A2:A200', 'Tugas', 'A2:A200');         // Tugas (pilih customer hari ini)
    dvFromRange(ss, 'Barang', 'B2:B200', 'Master_Item', 'B2:B100');   // Item
    dvFromList(ss, 'Barang', 'C2:C200', ['Antar', 'Jual', 'Beli', 'Tukar']); // Transaksi
    dvFromRange(ss, 'Master_Mobil', 'C2:C200', 'Master_Driver', 'B2:B100');  // Driver tetap
    dvFromRange(ss, 'Master_Mobil', 'E2:E200', 'Master_Gudang', 'B2:B100');  // Gudang home

    // --- abu + lock kolom auto (formula) ---
    greyLock(ss, 'Setup', 'D1:J100');
    greyLock(ss, 'Tugas', 'C1:M200');
    greyLock(ss, 'Barang', 'F1:O200');
    greyLock(ss, 'Master_Mobil', 'D1:D200');
    greyLock(ss, 'Master_Mobil', 'F1:F200');

    SpreadsheetApp.getUi().alert('✅ Dropdown + lock kolom auto terpasang.\n\nKolom abu = otomatis (jangan diisi). Kolom putih = input admin.');
}

function dvFromRange(ss, dstSheet, dstA1, srcSheet, srcA1) {
    const dst = ss.getSheetByName(dstSheet);
    const src = ss.getSheetByName(srcSheet);
    if (!dst || !src) return;
    const rule = SpreadsheetApp.newDataValidation()
        .requireValueInRange(src.getRange(srcA1), true).setAllowInvalid(false).build();
    dst.getRange(dstA1).setDataValidation(rule);
}

function dvFromList(ss, dstSheet, dstA1, list) {
    const dst = ss.getSheetByName(dstSheet);
    if (!dst) return;
    const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(list, true).setAllowInvalid(false).build();
    dst.getRange(dstA1).setDataValidation(rule);
}

const GREYLOCK_DESC = 'kolom auto (formula) — jangan edit';
function greyLock(ss, sheetName, a1) {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) return;
    const rng = sh.getRange(a1);
    rng.setBackground('#efefef');
    // idempoten: buang proteksi lama dgn desc sama di sheet ini
    sh.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(p => {
        if (p.getDescription() === GREYLOCK_DESC && p.getRange().getA1Notation() === rng.getA1Notation()) p.remove();
    });
    rng.protect().setDescription(GREYLOCK_DESC).setWarningOnly(true); // warning, bukan lock keras
}
