// asset_cache document id = {lv}__{ii}__{cd}  (dict SSOT)
// e.g. VEH-B1234XY__8886008101138__full
const cacheId = (lv, ii, cd) => `${lv}__${ii}__${cd}`;

module.exports = { cacheId };
