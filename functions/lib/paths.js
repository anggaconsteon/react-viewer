// Firestore path builders. Tenant boundary = path (no tenant_id field).
//   MobileTable/{db}/tables/{tableVID}/{collection}

const base = (db, tableVID) => `MobileTable/${db}/tables/${tableVID}`;

module.exports = {
    base,
    movementCol: (db, t) => `${base(db, t)}/movement`,
    assetCacheCol: (db, t) => `${base(db, t)}/asset_cache`,
    appliedCol: (db, t) => `${base(db, t)}/asset_cache_applied`,
    stockLocationCol: (db, t) => `${base(db, t)}/stock_location`,
};
