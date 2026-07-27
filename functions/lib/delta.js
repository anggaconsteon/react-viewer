// Pure function — the core of the asset_cache Cloud Function.
// Maps one `movement` doc to the list of cache mutations it implies.
//
// Rule (type-agnostic): direction comes from from/to, NOT from `mt`.
//   - `fl` (from) present  -> that location LOSES qt   (delta = -qt)
//   - `tl` (to)   present  -> that location GAINS qt   (delta = +qt)
// So:
//   GENESIS   (fl null)            -> only +tl
//   DROP/PICKUP/INTERNAL           -> -fl and +tl
//   SALE/DAMAGE/LOST (tl null)     -> only -fl
//   ADJUSTMENT (either side)       -> handled generically
//
// One movement = one item line (flat), so exactly one (ii, cd).
//
// movement fields (dict SSOT): mt, fl, tl, ii, cd, qt, ...
// cache doc keyed by (lv, ii, cd).

function movementToMutations(m) {
    const qt = Number(m && m.qt);
    if (!qt || qt <= 0) return [];        // qty must be a positive number
    if (!m.ii || !m.cd) return [];        // item + condition required

    const out = [];
    if (m.fl) out.push({ lv: String(m.fl), ii: String(m.ii), cd: String(m.cd), delta: -qt });
    if (m.tl) out.push({ lv: String(m.tl), ii: String(m.ii), cd: String(m.cd), delta: +qt });
    return out;
}

module.exports = { movementToMutations };
