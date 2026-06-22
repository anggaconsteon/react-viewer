// ============================================================
// Driver Runtime — Seed Firestore dari Dictionary Sheet
// ------------------------------------------------------------
// Bound script utk spreadsheet dictionary (1_XHmo5...).
// Baca blok "DUMMY DATA" tiap tab (item / stock_location / task / vehicle_check
// / movement / asset_cache) lalu push ke Firestore. Collection = nama tab.
//
// Path: MobileTable/60936087747650/tables/84214220504259/{tab}
//
// Pola (mirror workforce.js):
//   - Doc id = AUTO-ID (20 char). Business key (ii/lv/tnm) disimpan
//     sebagai field, dipakai utk dedupe (upsert).
//   - Full-sync: doc di Firestore yg keynya gak ada di sheet -> DELETE.
//
// SETUP (sekali):
//   1. Extensions > Apps Script, paste file ini.
//   2. Project Settings > Script Properties: tambah
//        FIRESTORE_SERVICE_ACCOUNT = <isi JSON service account>
//      (service account project fir-app-dev1, role datastore user)
//   3. Reload spreadsheet -> muncul menu "🔥 Driver Seed".
//
// Struktur tiap tab (auto-detect, gak hardcode nomor baris):
//   - Blok schema (atas): kolom A=Column#, D=Field Name, G=Data Type.
//     Dipakai bikin type-map utk coercion.
//   - Blok dummy (bawah): baris header kode-field di KOLOM B
//     (baris pertama yg colB === key field), lalu baris label,
//     lalu baris data. Kolom A kosong, data mulai kolom B.
// ============================================================

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

// Tab -> business key (kolom pertama blok dummy). Urutan = urutan push.
// item & stock_location = master (target FK), task ngikut.
const SHEETS = [
    { name: 'item', key: 'ii' },
    { name: 'stock_location', key: 'lv' },
    { name: 'task', key: 'tnm' },
    { name: 'vehicle_check', key: 'cnm' }, // FK: vv/gl→stock_location, it ii→item (push setelah master)
    { name: 'movement', key: 'mid' },      // ledger; mid = seed-only dedupe key (app PROD pakai auto-id). FK: fl/tl→stock_location, ii→item, mrf→task
    // ⚠️ asset_cache = CF-DERIVED (robot baca movement → saldo). App GAK PERNAH nulis.
    // Hand-seed di sini = SIMULASI hasil CF buat bootstrap test data. doc-id = composite {lv}__{ii}__{cd} (Q9, deterministik = idempoten).
    // JANGAN push ini kalau Cloud Function udah live — CF yg jadi SSOT, hand-seed bakal ketimpa / bentrok.
    { name: 'asset_cache', key: 'lv', docIdFields: ['lv', 'ii', 'cd'] },
];

const FIRESTORE_BASE = () =>
    `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

const collectionPath = (sheetName) =>
    `MobileTable/${CONFIG.MOBILE_TABLE_DOC_ID}/tables/${CONFIG.TABLE_VID}/${sheetName}`;


// ============================================================
// MENU
// ============================================================
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('🔥 Driver Seed')
        .addItem('Push item → Firestore', 'pushItem')
        .addItem('Push stock_location → Firestore', 'pushStockLocation')
        .addItem('Push task → Firestore', 'pushTask')
        .addItem('Push vehicle_check → Firestore', 'pushVehicleCheck')
        .addItem('Push movement → Firestore', 'pushMovement')
        .addItem('Push asset_cache (⚠️ simulasi CF) → Firestore', 'pushAssetCache')
        .addSeparator()
        .addItem('Push SEMUA (item → … → movement → asset_cache)', 'pushAll')
        .addToUi();
}

function pushItem() { syncOne('item'); }
function pushStockLocation() { syncOne('stock_location'); }
function pushTask() { syncOne('task'); }
function pushVehicleCheck() { syncOne('vehicle_check'); }
function pushMovement() { syncOne('movement'); }
function pushAssetCache() { syncOne('asset_cache'); }

function pushAll() {
    const token = getAccessToken();
    if (!token) { SpreadsheetApp.getUi().alert('Gagal access token. Cek service account key.'); return; }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lines = [];
    for (const cfg of SHEETS) {
        const s = syncCollection(token, cfg, ss);
        lines.push(`${cfg.name}: +${s.added} ✏️${s.updated} 🗑️${s.deleted} ⏭️${s.skipped} ❌${s.errors}`);
    }
    ss.toast('Push semua selesai!', '✅ Selesai', 5);
    SpreadsheetApp.getUi().alert('✅ Push SEMUA selesai!\n\n' + lines.join('\n'));
}

function syncOne(sheetName) {
    const token = getAccessToken();
    if (!token) { SpreadsheetApp.getUi().alert('Gagal access token. Cek service account key.'); return; }

    const cfg = SHEETS.find(s => s.name === sheetName);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const s = syncCollection(token, cfg, ss);

    ss.toast('Sync selesai!', '✅ Selesai', 5);
    SpreadsheetApp.getUi().alert(
        `✅ Sync ${sheetName} selesai!\n\n` +
        `➕ Ditambahkan   : ${s.added}\n` +
        `✏️  Diupdate      : ${s.updated}\n` +
        `🗑️  Dihapus       : ${s.deleted}\n` +
        `⏭️  Orphan dilewati: ${s.skipped}${s.skipped ? '  (ENABLE_DELETE=false / dibatalkan)' : ''}\n` +
        `❌ Error         : ${s.errors}`
    );
}


// ============================================================
// CONFIRM sebelum hapus (cuma kepanggil kalau ENABLE_DELETE=true)
// ============================================================
function confirmDeletes(sheetName, deletes) {
    const ui = SpreadsheetApp.getUi();
    const keys = deletes.map(d => d.key);
    const preview = keys.slice(0, 30).join('\n  • ');
    const more = keys.length > 30 ? `\n  …dan ${keys.length - 30} lagi` : '';
    const resp = ui.alert(
        `⚠️ HAPUS ${keys.length} doc di "${sheetName}"?`,
        `Doc berikut ADA di Firestore tapi GAK ADA di sheet, dan akan DIHAPUS PERMANEN:\n\n  • ${preview}${more}\n\nLanjut hapus?`,
        ui.ButtonSet.YES_NO
    );
    return resp === ui.Button.YES;
}


// ============================================================
// CORE: 1 collection
// ============================================================
function syncCollection(token, cfg, ss) {
    const stats = { added: 0, updated: 0, deleted: 0, skipped: 0, errors: 0 };

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(cfg.name);
    if (!sheet) { Logger.log(`Sheet "${cfg.name}" tidak ada`); return stats; }

    ss.toast(`Membaca ${cfg.name}...`, '⏳', -1);
    const values = sheet.getDataRange().getValues();

    const typeMap = parseSchema(values);
    const { fieldCodes, dataRows } = parseDummyBlock(values, cfg.key);
    if (!fieldCodes.length) { Logger.log(`${cfg.name}: header dummy (${cfg.key}) tidak ketemu`); return stats; }

    // Build docs (skip baris tanpa key)
    const docs = [];
    for (const row of dataRows) {
        const doc = buildDoc(row, fieldCodes, typeMap);
        if (doc[cfg.key] !== undefined && String(doc[cfg.key]).length > 0) docs.push(doc);
    }
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
            // SAFE default: jangan hapus, cuma lapor.
            stats.skipped += ops.deletes.length;
            Logger.log(`${cfg.name}: ${ops.deletes.length} orphan DILEWATI (ENABLE_DELETE=false): ` +
                ops.deletes.map(d => d.key).join(', '));
        } else if (confirmDeletes(cfg.name, ops.deletes)) {
            ss.toast(`Hapus ${ops.deletes.length} orphan ${cfg.name}...`, '🗑️', -1);
            const d = sendBatchDeletes(token, ops.deletes, ss);
            stats.deleted += d.deleted; stats.errors += d.errors;
        } else {
            stats.skipped += ops.deletes.length; // user batal
            Logger.log(`${cfg.name}: delete dibatalkan user`);
        }
    }
    return stats;
}


// ============================================================
// PARSE: schema block -> { fieldCode: dataType }
// Baris schema = colA numerik & colD (field name) terisi.
// (Sub-field it[] ikut kebaca, gak masalah — cuma dipakai lookup.)
// ============================================================
function parseSchema(values) {
    const typeMap = {};
    for (const row of values) {
        const cnum = String(row[0] || '').trim();
        if (!/^\d+$/.test(cnum)) continue;
        const fname = String(row[3] || '').trim();
        if (fname) typeMap[fname] = String(row[6] || 'String').trim();
    }
    return typeMap;
}


// ============================================================
// PARSE: dummy block -> { fieldCodes:[{code,col}], dataRows }
// header = baris pertama yg colB === key. label = header+1. data = header+2..
// ============================================================
function parseDummyBlock(values, key) {
    let h = -1;
    for (let i = 0; i < values.length; i++) {
        if (String(values[i][1] || '').trim() === key) { h = i; break; }
    }
    if (h < 0) return { fieldCodes: [], dataRows: [] };

    const headerRow = values[h];
    const fieldCodes = [];
    for (let c = 1; c < headerRow.length; c++) {
        const code = String(headerRow[c] || '').trim();
        if (code) fieldCodes.push({ code: code, col: c });
    }

    const keyCol = fieldCodes[0].col; // kolom key (= col B)
    const dataRows = [];
    let started = false;
    for (let r = h + 2; r < values.length; r++) { // +2: skip baris label
        const row = values[r];
        const keyVal = String(row[keyCol] || '').trim();
        if (!keyVal) { if (started) break; else continue; }
        started = true;
        dataRows.push(row);
    }
    return { fieldCodes: fieldCodes, dataRows: dataRows };
}


// ============================================================
// BUILD DOC: coerce tiap cell sesuai Data Type
// ============================================================
function buildDoc(row, fieldCodes, typeMap) {
    const doc = {};
    for (const fc of fieldCodes) {
        const v = coerce(row[fc.col], typeMap[fc.code] || 'String');
        if (v !== undefined) doc[fc.code] = v; // omit kosong
    }
    return doc;
}

function coerce(value, dataType) {
    const s = (value === null || value === undefined) ? '' : String(value).trim();
    if (s === '') return undefined; // blank -> omit
    const t = String(dataType).toLowerCase();

    if (t.indexOf('array<object') === 0) {
        try { return JSON.parse(s); } catch (e) { return undefined; }
    }
    if (t.indexOf('array<string') === 0) {
        return parseStringArray(s);
    }
    if (t.indexOf('number') === 0) {
        const n = (s.indexOf('.') >= 0) ? parseFloat(s) : parseInt(s, 10);
        return isNaN(n) ? undefined : n;
    }
    // string, string (fk), string|null
    return s;
}

// "[full, empty]" -> ["full","empty"] ; toleran JSON valid juga
function parseStringArray(s) {
    try { const a = JSON.parse(s); if (Array.isArray(a)) return a; } catch (e) { }
    return s.replace(/^\s*\[|\]\s*$/g, '')
        .split(',')
        .map(x => x.trim().replace(/^["']|["']$/g, ''))
        .filter(x => x.length > 0);
}


// ============================================================
// FETCH EXISTING: { keyValue: docId }
// - default: key by field value (cfg.key), docId = auto-id di Firestore.
// - composite (cfg.docIdFields): doc-id ITU SENDIRI = key (deterministik {a}__{b}__{c}).
// ============================================================
function fetchExisting(token, path, cfg) {
    const result = {};
    const useDocId = Array.isArray(cfg.docIdFields) && cfg.docIdFields.length > 0;
    let pageToken = null;
    do {
        let url = `${FIRESTORE_BASE()}/${path}?pageSize=300`;
        if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;
        const res = UrlFetchApp.fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            muteHttpExceptions: true,
        });
        const json = JSON.parse(res.getContentText());
        if (json.documents) {
            for (const doc of json.documents) {
                const parts = doc.name.split('/');
                const docId = parts[parts.length - 1];
                if (useDocId) {
                    result[docId] = docId; // doc-id = composite key
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


// ============================================================
// BUILD OPS: upsert-by-key + delete orphan (full-sync)
// - default: key = field value; create pakai auto-id, update reuse existing id.
// - composite (cfg.docIdFields): doc-id = {f1}__{f2}__... → upsert (set) deterministik, idempoten.
// ============================================================
function buildOps(docs, existing, cfg, path) {
    const writes = [];
    const deletes = [];
    const sheetKeys = new Set();
    const useDocId = Array.isArray(cfg.docIdFields) && cfg.docIdFields.length > 0;

    for (const doc of docs) {
        const k = useDocId
            ? cfg.docIdFields.map(f => String(doc[f])).join('__')
            : String(doc[cfg.key]);
        sheetKeys.add(k);
        if (useDocId) {
            // doc-id deterministik = set/upsert (create-or-overwrite sama aja, idempoten)
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


// ============================================================
// BATCH WRITES / DELETES (mirror workforce.js)
// ============================================================
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


// ============================================================
// FIRESTORE VALUE HELPERS (mirror workforce.js)
// ============================================================
function toFirestoreValue(value) {
    if (value === null || value === undefined) return { nullValue: null };
    if (typeof value === 'boolean') return { booleanValue: value };
    if (typeof value === 'number') {
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
    for (const [k, v] of Object.entries(plainObj)) fields[k] = toFirestoreValue(v);
    return { fields };
}


// ============================================================
// UTIL
// ============================================================
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


// ============================================================
// JWT AUTH (mirror workforce.js)
// ============================================================
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
            iat: now,
            exp: now + 3600,
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
