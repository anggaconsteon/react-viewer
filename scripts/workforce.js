// ============================================================
// KONFIGURASI
// ============================================================
const CONFIG = {
    SHEET_NAME: 'Location',
    FIRESTORE_PROJECT_ID: 'fir-app-dev1',
    MOBILE_TABLE_DOC_ID: '60936087747650',
    SERVICE_ACCOUNT_KEY: 'FIRESTORE_SERVICE_ACCOUNT',
    BATCH_SIZE: 500,
    DATA_START_ROW: 3,
};

// ============================================================
// KOLOM SPREADSHEET (0-indexed)
// # | Site VID | Site Name | Site flag | Account VID | Account Name |
// Account flag | Tenant VID | Tenant Name | Tenant Flag | Latitude | Longitude | ID / Nama Lokasi | LID | Radius (m)
// ============================================================
const COL = {
    SITE_VID: 1,
    SITE_NAME: 2,
    SITE_FLAG: 3,
    ACCOUNT_VID: 4,
    ACCOUNT_NAME: 5,
    ACCOUNT_FLAG: 6,
    TENANT_VID: 7,
    TENANT_NAME: 8,
    TENANT_FLAG: 9,
    LATITUDE: 10,
    LONGITUDE: 11,
    LOCATION_NAME: 12,
    LID: 13,
    RADIUS: 14,
};

const FIRESTORE_BASE = () =>
    `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

const getSiteCollectionPath = (tenantVid) =>
    `MobileTable/${CONFIG.MOBILE_TABLE_DOC_ID}/tables/${tenantVid}/site`;

const getLocationCollectionPath = (tenantVid) =>
    `MobileTable/${CONFIG.MOBILE_TABLE_DOC_ID}/tables/${tenantVid}/location`;


// ============================================================
// ENTRY POINT
// ============================================================
function syncLocationToFirestore() {
    const token = getAccessToken();
    if (!token) {
        SpreadsheetApp.getUi().alert('Gagal mendapatkan access token. Cek service account key.');
        return;
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
        SpreadsheetApp.getUi().alert(`Sheet "${CONFIG.SHEET_NAME}" tidak ditemukan.`);
        return;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        SpreadsheetApp.getUi().alert('Tidak ada data di sheet.');
        return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Baca sheet
    ss.toast('Membaca data spreadsheet...', '⏳ Sync dimulai', -1);
    Logger.log('📥 Membaca data spreadsheet...');
    const totalCols = Object.values(COL).reduce((a, b) => Math.max(a, b), 0) + 1;
    const data = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, totalCols).getValues();

    // STEP 1: Group by tenant → site
    ss.toast('Mengelompokkan data per tenant & site...', '⏳ Grouping', -1);
    Logger.log('🗂️ Grouping data...');
    const groupedByTenant = groupData(data);
    const tenantVids = Object.keys(groupedByTenant);
    Logger.log(`Ditemukan ${tenantVids.length} tenant`);

    // STEP 2: Upsert tenant doc (cr, tf, tn, ts)
    ss.toast(`Mengupdate ${tenantVids.length} tenant doc...`, '📝 Updating Tenants', -1);
    Logger.log('📝 Upserting tenant docs...');
    upsertAllTenantDocs(token, groupedByTenant);

    let stats = { added: 0, updated: 0, deleted: 0, errors: 0 };

    // STEP 3: Sync collection SITE
    ss.toast(`Mengambil data existing site dari Firestore...`, '☁️ Fetching Site', -1);
    Logger.log('☁️ Fetching existing site docs...');
    const existingSiteByTenant = fetchAllTenantsExistingDocs(token, tenantVids);

    ss.toast('Menghitung operasi site...', '🔍 Comparing Site', -1);
    Logger.log('🔍 Menghitung operasi site...');
    const siteOps = buildSiteOperations(groupedByTenant, existingSiteByTenant);
    Logger.log(`Site ops: ${siteOps.writes.length} writes, ${siteOps.deletes.length} deletes`);

    if (siteOps.writes.length > 0) {
        const totalBatches = Math.ceil(siteOps.writes.length / CONFIG.BATCH_SIZE);
        ss.toast(`Mengirim ${siteOps.writes.length} site doc dalam ${totalBatches} batch...`, '✏️ Writing Site', -1);
        const ws = sendBatchWrites(token, siteOps.writes, ss);
        stats.added += ws.added;
        stats.updated += ws.updated;
        stats.errors += ws.errors;
    }

    if (siteOps.deletes.length > 0) {
        const totalBatches = Math.ceil(siteOps.deletes.length / CONFIG.BATCH_SIZE);
        ss.toast(`Menghapus ${siteOps.deletes.length} site doc dalam ${totalBatches} batch...`, '🗑️ Deleting Site', -1);
        const ds = sendBatchDeletes(token, siteOps.deletes, ss);
        stats.deleted += ds.deleted;
        stats.errors += ds.errors;
    }

    // STEP 4: Sync collection LOCATION (upsert proper: li+sv sebagai lookup key)
    ss.toast(`Mengambil data existing location dari Firestore...`, '☁️ Fetching Location', -1);
    Logger.log('☁️ Fetching existing location docs...');
    const existingLocationByTenant = fetchAllTenantsLocationDocs(token, tenantVids);

    ss.toast('Menghitung operasi location...', '🔍 Comparing Location', -1);
    Logger.log('🔍 Menghitung operasi location...');
    const locationOps = buildLocationOperations(groupedByTenant, existingLocationByTenant);
    Logger.log(`Location ops: ${locationOps.writes.length} writes, ${locationOps.deletes.length} deletes`);

    if (locationOps.writes.length > 0) {
        const totalBatches = Math.ceil(locationOps.writes.length / CONFIG.BATCH_SIZE);
        ss.toast(`Mengirim ${locationOps.writes.length} location doc dalam ${totalBatches} batch...`, '✏️ Writing Location', -1);
        const wl = sendBatchWrites(token, locationOps.writes, ss);
        stats.added += wl.added;
        stats.updated += wl.updated;
        stats.errors += wl.errors;
    }

    if (locationOps.deletes.length > 0) {
        const totalBatches = Math.ceil(locationOps.deletes.length / CONFIG.BATCH_SIZE);
        ss.toast(`Menghapus ${locationOps.deletes.length} location doc dalam ${totalBatches} batch...`, '🗑️ Deleting Location', -1);
        const dl = sendBatchDeletes(token, locationOps.deletes, ss);
        stats.deleted += dl.deleted;
        stats.errors += dl.errors;
    }

    ss.toast('Sync selesai!', '✅ Selesai', 5);
    const msg =
        `✅ Sync selesai!\n\n` +
        `➕ Ditambahkan : ${stats.added}\n` +
        `✏️  Diupdate    : ${stats.updated}\n` +
        `🗑️  Dihapus     : ${stats.deleted}\n` +
        `❌ Error       : ${stats.errors}`;

    SpreadsheetApp.getUi().alert(msg);
    Logger.log(msg);
}


// ============================================================
// UPSERT TENANT DOC: cr, tf, tn, ts di tables/{tenantVid}
// ============================================================
function upsertAllTenantDocs(token, groupedByTenant) {
    const now = Date.now();

    for (const [tenantVid, siteGroups] of Object.entries(groupedByTenant)) {
        const firstRow = Object.values(siteGroups)[0][0];

        const docData = {
            cr: now,
            tf: String(firstRow[COL.TENANT_FLAG] || '').trim(),
            tn: String(firstRow[COL.TENANT_NAME] || '').trim(),
            ts: 'A',
        };

        try {
            patchFirestoreDoc(token, `MobileTable/${CONFIG.MOBILE_TABLE_DOC_ID}/tables/${tenantVid}`, docData);
            Logger.log(`  Upserted tenant doc: ${tenantVid}`);
        } catch (e) {
            Logger.log(`  Error upsert tenant doc ${tenantVid}: ${e.message}`);
        }
    }
}

function patchFirestoreDoc(token, docPath, data) {
    const updateMask = Object.keys(data).map(f => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join('&');
    const url = `${FIRESTORE_BASE()}/${docPath}?${updateMask}`;

    const response = UrlFetchApp.fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        payload: JSON.stringify(toFirestoreDoc(data)),
        muteHttpExceptions: true,
    });

    const code = response.getResponseCode();
    if (code !== 200) throw new Error(`Patch failed [${code}]: ${response.getContentText()}`);
}


// ============================================================
// SITE: Fetch existing { tenantVid: { siteVid: autoId } }
// ============================================================
function fetchAllTenantsExistingDocs(token, tenantVids) {
    const result = {};
    for (const tenantVid of tenantVids) {
        result[tenantVid] = fetchExistingDocsForTenant(token, tenantVid);
        Logger.log(`  Fetched site tenant ${tenantVid}: ${Object.keys(result[tenantVid]).length} docs`);
    }
    return result;
}

function fetchExistingDocsForTenant(token, tenantVid) {
    const collectionPath = getSiteCollectionPath(tenantVid);
    const result = {};
    let pageToken = null;

    do {
        let url = `${FIRESTORE_BASE()}/${collectionPath}?pageSize=300`;
        if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            muteHttpExceptions: true,
        });

        const json = JSON.parse(response.getContentText());
        if (json.documents) {
            for (const doc of json.documents) {
                const parts = doc.name.split('/');
                const autoId = parts[parts.length - 1];
                const sv = doc.fields && doc.fields.sv ? (doc.fields.sv.stringValue || '') : '';
                if (sv) result[sv] = autoId;
            }
        }
        pageToken = json.nextPageToken || null;
    } while (pageToken);

    return result;
}


// ============================================================
// SITE: Build operations
// ============================================================
function buildSiteOperations(groupedByTenant, existingByTenant) {
    const writes = [];
    const deletes = [];

    for (const [tenantVid, siteGroups] of Object.entries(groupedByTenant)) {
        const collectionPath = getSiteCollectionPath(tenantVid);
        const existingSvToId = existingByTenant[tenantVid] || {};
        const sheetSiteVids = new Set(Object.keys(siteGroups));

        for (const [siteVid, rows] of Object.entries(siteGroups)) {
            const docData = buildSiteDoc(rows);
            if (existingSvToId[siteVid]) {
                writes.push({ type: 'update', fullPath: `${collectionPath}/${existingSvToId[siteVid]}`, data: docData });
            } else {
                writes.push({ type: 'create', fullPath: `${collectionPath}/${generateAutoId()}`, data: docData });
            }
        }

        for (const [sv, autoId] of Object.entries(existingSvToId)) {
            if (!sheetSiteVids.has(sv)) {
                deletes.push({ fullPath: `${collectionPath}/${autoId}` });
            }
        }
    }

    return { writes, deletes };
}


// ============================================================
// LOCATION: Fetch existing { tenantVid: { "li|sv": autoId } }
// Lookup key: kombinasi li + sv
// ============================================================
function fetchAllTenantsLocationDocs(token, tenantVids) {
    const result = {};
    for (const tenantVid of tenantVids) {
        result[tenantVid] = fetchExistingLocationDocsForTenant(token, tenantVid);
        Logger.log(`  Fetched location tenant ${tenantVid}: ${Object.keys(result[tenantVid]).length} docs`);
    }
    return result;
}

function fetchExistingLocationDocsForTenant(token, tenantVid) {
    const collectionPath = getLocationCollectionPath(tenantVid);
    const result = {};
    let pageToken = null;

    do {
        let url = `${FIRESTORE_BASE()}/${collectionPath}?pageSize=300`;
        if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            muteHttpExceptions: true,
        });

        const json = JSON.parse(response.getContentText());
        if (json.documents) {
            for (const doc of json.documents) {
                const parts = doc.name.split('/');
                const autoId = parts[parts.length - 1];
                const li = doc.fields && doc.fields.li ? (doc.fields.li.stringValue || '') : '';
                const sv = doc.fields && doc.fields.sv ? (doc.fields.sv.stringValue || '') : '';
                if (li && sv) result[`${li}|${sv}`] = autoId;
            }
        }
        pageToken = json.nextPageToken || null;
    } while (pageToken);

    return result;
}


// ============================================================
// LOCATION: Build operations (upsert by li+sv)
// ============================================================
function buildLocationOperations(groupedByTenant, existingLocationByTenant) {
    const writes = [];
    const deletes = [];

    for (const [tenantVid, siteGroups] of Object.entries(groupedByTenant)) {
        const collectionPath = getLocationCollectionPath(tenantVid);
        const existingLiSvToId = existingLocationByTenant[tenantVid] || {};
        const sheetLiSvKeys = new Set();

        // Flatten semua rows dari semua site dalam tenant ini
        for (const rows of Object.values(siteGroups)) {
            for (const row of rows) {
                const lat = row[COL.LATITUDE];
                if (lat === '' || lat === null || lat === undefined) continue;

                const li = String(row[COL.LID] || '').trim();
                const sv = String(row[COL.SITE_VID] || '').trim();
                const key = `${li}|${sv}`;

                sheetLiSvKeys.add(key);

                const docData = {
                    la: parseFloat(row[COL.LATITUDE]) || 0,
                    lo: parseFloat(row[COL.LONGITUDE]) || 0,
                    li: li,
                    ra: parseFloat(row[COL.RADIUS]) || 0,
                    ln: String(row[COL.LOCATION_NAME] || '').trim(),
                    sv: sv,
                };

                if (existingLiSvToId[key]) {
                    writes.push({ type: 'update', fullPath: `${collectionPath}/${existingLiSvToId[key]}`, data: docData });
                } else {
                    writes.push({ type: 'create', fullPath: `${collectionPath}/${generateAutoId()}`, data: docData });
                }
            }
        }

        // Delete: ada di Firestore tapi tidak di sheet
        for (const [key, autoId] of Object.entries(existingLiSvToId)) {
            if (!sheetLiSvKeys.has(key)) {
                deletes.push({ fullPath: `${collectionPath}/${autoId}` });
            }
        }
    }

    return { writes, deletes };
}


// ============================================================
// BUILD SITE DOCUMENT FIELDS (tanpa ll)
// ============================================================
function buildSiteDoc(rows) {
    const first = rows[0];
    return {
        af: String(first[COL.ACCOUNT_FLAG] || '').trim(),
        an: String(first[COL.ACCOUNT_NAME] || '').trim(),
        av: String(first[COL.ACCOUNT_VID] || '').trim(),
        nm: 0,
        sf: String(first[COL.SITE_FLAG] || '').trim(),
        sn: String(first[COL.SITE_NAME] || '').trim(),
        st: 'active',
        sv: String(first[COL.SITE_VID] || '').trim(),
    };
}


// ============================================================
// BATCH WRITES
// ============================================================
function sendBatchWrites(token, writes, ss) {
    const stats = { added: 0, updated: 0, errors: 0 };
    const chunks = chunkArray(writes, CONFIG.BATCH_SIZE);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        ss.toast(`Write batch ${i + 1} / ${chunks.length}...`, '✏️ Writing', -1);
        Logger.log(`  Write batch ${i + 1}/${chunks.length} (${chunk.length} ops)`);

        const batchWrites = chunk.map(op => {
            const docName = `projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${op.fullPath}`;
            if (op.type === 'create') {
                return { update: { ...toFirestoreDoc(op.data), name: docName }, currentDocument: { exists: false } };
            } else {
                return { update: { ...toFirestoreDoc(op.data), name: docName } };
            }
        });

        try {
            const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents:batchWrite`;
            const response = UrlFetchApp.fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                payload: JSON.stringify({ writes: batchWrites }),
                muteHttpExceptions: true,
            });

            const code = response.getResponseCode();
            if (code !== 200) {
                Logger.log(`  Batch write error [${code}]: ${response.getContentText()}`);
                stats.errors += chunk.length;
            } else {
                chunk.forEach(op => { if (op.type === 'create') stats.added++; else stats.updated++; });
            }
        } catch (e) {
            Logger.log(`  Batch write exception: ${e.message}`);
            stats.errors += chunk.length;
        }
    }

    return stats;
}


// ============================================================
// BATCH DELETES
// ============================================================
function sendBatchDeletes(token, deletes, ss) {
    const stats = { deleted: 0, errors: 0 };
    const chunks = chunkArray(deletes, CONFIG.BATCH_SIZE);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        ss.toast(`Delete batch ${i + 1} / ${chunks.length}...`, '🗑️ Deleting', -1);
        Logger.log(`  Delete batch ${i + 1}/${chunks.length} (${chunk.length} ops)`);

        const batchWrites = chunk.map(op => ({
            delete: `projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents/${op.fullPath}`,
        }));

        try {
            const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIRESTORE_PROJECT_ID}/databases/(default)/documents:batchWrite`;
            const response = UrlFetchApp.fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                payload: JSON.stringify({ writes: batchWrites }),
                muteHttpExceptions: true,
            });

            const code = response.getResponseCode();
            if (code !== 200) {
                Logger.log(`  Batch delete error [${code}]: ${response.getContentText()}`);
                stats.errors += chunk.length;
            } else {
                stats.deleted += chunk.length;
            }
        } catch (e) {
            Logger.log(`  Batch delete exception: ${e.message}`);
            stats.errors += chunk.length;
        }
    }

    return stats;
}


// ============================================================
// GROUPING: { tenantVid: { siteVid: [rows] } }
// ============================================================
function groupData(rows) {
    const grouped = {};

    for (const row of rows) {
        const tenantVid = String(row[COL.TENANT_VID] || '').trim();
        const siteVid = String(row[COL.SITE_VID] || '').trim();
        if (!tenantVid || !siteVid) continue;

        if (!grouped[tenantVid]) grouped[tenantVid] = {};
        if (!grouped[tenantVid][siteVid]) grouped[tenantVid][siteVid] = [];
        grouped[tenantVid][siteVid].push(row);
    }

    return grouped;
}


// ============================================================
// FIRESTORE VALUE HELPERS
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
// UTILITIES
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
// JWT AUTH
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


// ============================================================
// MENU
// ============================================================
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('🔥 Consteon Sync')
        .addItem('Sync Location → Firestore', 'syncLocationToFirestore')
        .addItem('Sync Workforce → Firestore', 'syncWorkforceToFirestore')
        .addToUi();
}


// ============================================================
// WORKFORCE CONFIG
// ============================================================
const WORKFORCE_CONFIG = {
    SHEET_NAME: 'AuzUser',
    DATA_START_ROW: 2,
};

const WCOL = {
    VID: 1,
    NAME: 2,
    SITE_VID: 3,
    // SITE_FLAG:  4 - tidak dipakai
    // SITE_NAME:  5 - tidak dipakai
    ACCOUNT_VID: 6,
    // COST_CENTER: 7 - tidak dipakai
    // ACCOUNT_NAME: 8 - tidak dipakai
    TENANT_VID: 9,
    // TENANT_FLAG: 10 - tidak dipakai
    // TENANT_NAME: 11 - tidak dipakai
};

const getWorkforceCollectionPath = (tenantVid) =>
    `MobileTable/${CONFIG.MOBILE_TABLE_DOC_ID}/tables/${tenantVid}/workforce`;


// ============================================================
// ENTRY POINT WORKFORCE
// ============================================================
function syncWorkforceToFirestore() {
    const token = getAccessToken();
    if (!token) {
        SpreadsheetApp.getUi().alert('Gagal mendapatkan access token. Cek service account key.');
        return;
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WORKFORCE_CONFIG.SHEET_NAME);
    if (!sheet) {
        SpreadsheetApp.getUi().alert(`Sheet "${WORKFORCE_CONFIG.SHEET_NAME}" tidak ditemukan.`);
        return;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
        SpreadsheetApp.getUi().alert('Tidak ada data di sheet.');
        return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const totalCols = Object.values(WCOL).reduce((a, b) => Math.max(a, b), 0) + 1;

    ss.toast('Membaca data workforce...', '⏳ Sync dimulai', -1);
    Logger.log('Membaca data AuzUser...');
    const data = sheet.getRange(WORKFORCE_CONFIG.DATA_START_ROW, 1, lastRow - WORKFORCE_CONFIG.DATA_START_ROW + 1, totalCols).getValues();

    ss.toast('Mengelompokkan data per tenant...', '⏳ Grouping', -1);
    Logger.log('Grouping workforce data...');
    const groupedByTenant = groupWorkforceData(data);
    const tenantVids = Object.keys(groupedByTenant);
    Logger.log(`Ditemukan ${tenantVids.length} tenant`);

    ss.toast(`Mengambil data existing dari Firestore (${tenantVids.length} tenant)...`, '☁️ Fetching Firestore', -1);
    Logger.log('Fetching existing workforce docs...');
    const existingByTenant = fetchAllTenantsWorkforceDocs(token, tenantVids);

    ss.toast('Menghitung operasi yang diperlukan...', '🔍 Comparing', -1);
    Logger.log('Menghitung operasi...');
    const operations = buildWorkforceOperations(groupedByTenant, existingByTenant);
    Logger.log(`Total operasi: ${operations.writes.length} writes, ${operations.deletes.length} deletes`);

    let stats = { added: 0, updated: 0, deleted: 0, errors: 0 };

    if (operations.writes.length > 0) {
        const totalBatches = Math.ceil(operations.writes.length / CONFIG.BATCH_SIZE);
        ss.toast(`Mengirim ${operations.writes.length} dokumen dalam ${totalBatches} batch...`, '✏️ Writing', -1);
        const ws = sendBatchWrites(token, operations.writes, ss);
        stats.added += ws.added;
        stats.updated += ws.updated;
        stats.errors += ws.errors;
    }

    if (operations.deletes.length > 0) {
        const totalBatches = Math.ceil(operations.deletes.length / CONFIG.BATCH_SIZE);
        ss.toast(`Menghapus ${operations.deletes.length} dokumen dalam ${totalBatches} batch...`, '🗑️ Deleting', -1);
        const ds = sendBatchDeletes(token, operations.deletes, ss);
        stats.deleted += ds.deleted;
        stats.errors += ds.errors;
    }

    ss.toast('Sync workforce selesai!', '✅ Selesai', 5);
    const msg =
        '✅ Sync Workforce selesai!\n\n' +
        `➕ Ditambahkan : ${stats.added}\n` +
        `✏️  Diupdate    : ${stats.updated}\n` +
        `🗑️  Dihapus     : ${stats.deleted}\n` +
        `❌ Error       : ${stats.errors}`;

    SpreadsheetApp.getUi().alert(msg);
    Logger.log(msg);
}


// ============================================================
// GROUPING WORKFORCE: { tenantVid: { vid: row } }
// ============================================================
function groupWorkforceData(rows) {
    const grouped = {};
    for (const row of rows) {
        const tenantVid = String(row[WCOL.TENANT_VID] || '').trim();
        const vid = String(row[WCOL.VID] || '').trim();
        if (!tenantVid || !vid) continue;
        if (!grouped[tenantVid]) grouped[tenantVid] = {};
        grouped[tenantVid][vid] = row;
    }
    return grouped;
}


// ============================================================
// FETCH EXISTING WORKFORCE DOCS
// ============================================================
function fetchAllTenantsWorkforceDocs(token, tenantVids) {
    const result = {};
    for (const tenantVid of tenantVids) {
        result[tenantVid] = fetchExistingWorkforceForTenant(token, tenantVid);
        Logger.log(`  Fetched workforce tenant ${tenantVid}: ${Object.keys(result[tenantVid]).length} docs`);
    }
    return result;
}

function fetchExistingWorkforceForTenant(token, tenantVid) {
    const collectionPath = getWorkforceCollectionPath(tenantVid);
    const result = {};
    let pageToken = null;

    do {
        let url = `${FIRESTORE_BASE()}/${collectionPath}?pageSize=300`;
        if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

        const response = UrlFetchApp.fetch(url, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            muteHttpExceptions: true,
        });

        const json = JSON.parse(response.getContentText());
        if (json.documents) {
            for (const doc of json.documents) {
                const parts = doc.name.split('/');
                const autoId = parts[parts.length - 1];
                const vid = doc.fields && doc.fields.vid ? (doc.fields.vid.stringValue || '') : '';
                if (vid) result[vid] = autoId;
            }
        }
        pageToken = json.nextPageToken || null;
    } while (pageToken);

    return result;
}


// ============================================================
// BUILD WORKFORCE OPERATIONS
// ============================================================
function buildWorkforceOperations(groupedByTenant, existingByTenant) {
    const writes = [];
    const deletes = [];

    for (const [tenantVid, vidMap] of Object.entries(groupedByTenant)) {
        const collectionPath = getWorkforceCollectionPath(tenantVid);
        const existingVidToId = existingByTenant[tenantVid] || {};
        const sheetVids = new Set(Object.keys(vidMap));

        for (const [vid, row] of Object.entries(vidMap)) {
            const docData = buildWorkforceDoc(row);
            if (existingVidToId[vid]) {
                writes.push({ type: 'update', fullPath: `${collectionPath}/${existingVidToId[vid]}`, data: docData });
            } else {
                writes.push({ type: 'create', fullPath: `${collectionPath}/${generateAutoId()}`, data: docData });
            }
        }

        for (const [vid, autoId] of Object.entries(existingVidToId)) {
            if (!sheetVids.has(vid)) deletes.push({ fullPath: `${collectionPath}/${autoId}` });
        }
    }

    return { writes, deletes };
}


// ============================================================
// BUILD WORKFORCE DOCUMENT FIELDS
// ============================================================
function buildWorkforceDoc(row) {
    return {
        ci: -1,
        co: -1,
        n: String(row[WCOL.NAME] || '').trim(),
        is: '',
        os: '',
        st: 'off',
        sv: String(row[WCOL.SITE_VID] || '').trim(),
        vid: String(row[WCOL.VID] || '').trim(),
    };
}