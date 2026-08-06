# reorder_cache CF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the server side of the `reorder_cache` aging projection — event-driven, generic, config-driven — so every "days-since-last-X" case (reorder galon first) stays fresh without a cron.

**Architecture:** A new `internal/reorder` package keeps `reorder_cache/{customer}.last_at` up to date by reacting to activity docs (movement DROP / event). It is wired into the existing `onTenantWrite` wildcard router via two routes (`movement` + `event` creates). The volatile days-since + tier is computed by the SIGNAL_LIST renderer at read time (NOT here). Config lives in `reorder_config` docs (per vertical, per tenant), cached in-process.

**Tech Stack:** Go (Cloud Functions gen2, functions-framework), Firestore (`cloud.google.com/go/firestore`), existing helpers `internal/fsdoc` + `internal/paths`.

## Global Constraints

- **Commits are USER-GATED.** Do NOT run any `git commit` until the user explicitly says so. The commit steps below define the message to use *when* approved; until then, stop after the test step.
- **Best-effort, never block the router:** `reorder.OnActivity` returns `nil` on every internal error (log only). A reorder failure must never fail/retry `OnTenantWrite` (it shares the process with reward/approval/movement handlers).
- **No new field on existing docs.** Reads `mt`/`tl`/`t` off movement (already present). New collections only: `reorder_cache`, `reorder_config`.
- **LSP import diagnostics are bogus in this repo** — truth is `go build ./... && go vet ./... && go test ./...`. gofmt must be clean.
- **Type-tolerance:** ids are written as String (addEventRow) OR Number (table CRUD). Read activity fields with `fsdoc.Str`/`fsdoc.Int` (proto map) and config/customer fields with `fsdoc.AsString`/`fsdoc.AsInt64` (interface map). Customer key `in`-query uses both forms (`eqAny`).
- **Scope:** CF only. Widget SIGNAL_LIST aging-compute + filling `reorder_config` (sheet) are OTHER people's tasks (see Dependencies) — out of this plan.

---

## Dependencies (out of scope — for the feature to go live)

- **dev Flutter:** SIGNAL_LIST computes `ds`+`st` from `last_at`+`cd`+thresholds at render (gated by config); reads `reorder_cache`.
- **builder/sheet:** fill `reorder_config/galon` (see Task 2 field list) + widget config (aging fields + thresholds 0.8/3.0).

---

## Task 1: `internal/reorder` pure core (Config, parseFilter, matches, parseConfig)

**Files:**
- Create: `internal/reorder/reorder.go`
- Test: `internal/reorder/reorder_test.go`

**Interfaces:**
- Produces: `type Config struct{...}` (fields listed below); `parseFilter(string) []clause`; `matches([]clause, func(string) string) bool`; `parseConfig(id string, d map[string]interface{}) Config`.
- Consumes: `internal/fsdoc` (`AsString`, `AsInt64`).

- [ ] **Step 1: Write the failing test** — `internal/reorder/reorder_test.go`

```go
package reorder

import "testing"

func TestParseFilter(t *testing.T) {
	got := parseFilter("mt◼DROP⭘ty◼galon")
	if len(got) != 2 || got[0] != (clause{"mt", "DROP"}) || got[1] != (clause{"ty", "galon"}) {
		t.Fatalf("parseFilter = %+v", got)
	}
	if len(parseFilter("")) != 0 {
		t.Errorf("empty filter should yield 0 clauses")
	}
	if got := parseFilter("  mt ◼ DROP ⭘ "); len(got) != 1 || got[0] != (clause{"mt", "DROP"}) {
		t.Errorf("trim/skip-empty broken: %+v", got)
	}
	if len(parseFilter("garbage-no-sep")) != 0 {
		t.Errorf("clause without ◼ should be skipped")
	}
}

func TestMatches(t *testing.T) {
	doc := map[string]string{"mt": "DROP", "ty": "galon"}
	get := func(k string) string { return doc[k] }

	if !matches(parseFilter("mt◼DROP"), get) {
		t.Errorf("mt◼DROP should match")
	}
	if matches(parseFilter("mt◼PICKUP"), get) {
		t.Errorf("mt◼PICKUP should NOT match")
	}
	if !matches(parseFilter("mt◼DROP⭘ty◼galon"), get) {
		t.Errorf("both clauses match should be true")
	}
	if matches(parseFilter("mt◼DROP⭘ty◼lpg"), get) {
		t.Errorf("one clause off should be false")
	}
	if !matches(parseFilter(""), get) {
		t.Errorf("empty filter matches everything")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd cloud-function && go test ./internal/reorder/ -run 'TestParseFilter|TestMatches' -v`
Expected: FAIL — `undefined: parseFilter` / `clause` / `matches`.

- [ ] **Step 3: Write minimal implementation** — `internal/reorder/reorder.go`

```go
// Package reorder derives the reorder_cache aging projection: per customer, the
// timestamp of their last "order" activity (last_at). The volatile part
// (days-since, tier/colour) is computed by the SIGNAL_LIST renderer at read
// time — this package only keeps last_at fresh, event-driven off the activity
// stream. Generic + config-driven: a reorder_config doc per vertical names the
// activity source/filter + the customer denorm fields, so a new aging case is a
// config doc, not code. Event-driven ⇒ only customers WITH activity get a doc
// (never_ordered is out of v1 — see the design doc).
// See widget-claude/docs/superpowers/specs/2026-08-06-reorder-cache-aging-projection-design.md.
package reorder

import (
	"strings"

	"consteon.com/cloud-function/internal/fsdoc"
)

// Config is one vertical's mapping, loaded from a reorder_config doc. customerFilter
// is intentionally absent: v1 looks a customer up by key for denorm, it does not
// enumerate customers (that is the future never_ordered path).
type Config struct {
	Vertical              string // doc-id
	ActivityColl          string // e.g. "movement"
	ActivityFilter        string // DSL "mt◼DROP" (⭘-AND, ◼-eq)
	ActivityCustomerField string // e.g. "tl"
	ActivityTimeField     string // e.g. "t"
	CustomerColl          string // e.g. "stock_location" (denorm lookup)
	CustomerKeyField      string // e.g. "lv"
	CustomerNameField     string // e.g. "ln" -> cn
	CustomerPhoneField    string // e.g. "hpic" -> cp
	DefaultCadenceDays    int64  // e.g. 14
	OutputColl            string // e.g. "reorder_cache"
}

// clause is one "key◼value" equality of an activity filter.
type clause struct{ key, val string }

// parseFilter splits "key◼value⭘key◼value" into clauses. Blank/malformed parts
// are skipped; "" yields zero clauses (which matches every doc — see matches).
func parseFilter(s string) []clause {
	var cs []clause
	for _, part := range strings.Split(s, "⭘") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		kv := strings.SplitN(part, "◼", 2)
		if len(kv) != 2 {
			continue
		}
		cs = append(cs, clause{strings.TrimSpace(kv[0]), strings.TrimSpace(kv[1])})
	}
	return cs
}

// matches reports whether every clause equals the doc's value for that key.
// get returns a field's tolerant-string value. Zero clauses -> true.
func matches(cs []clause, get func(string) string) bool {
	for _, c := range cs {
		if get(c.key) != c.val {
			return false
		}
	}
	return true
}

// parseConfig builds a Config from a reorder_config doc's fields (interface map).
func parseConfig(id string, d map[string]interface{}) Config {
	return Config{
		Vertical:              id,
		ActivityColl:          fsdoc.AsString(d["activityColl"]),
		ActivityFilter:        fsdoc.AsString(d["activityFilter"]),
		ActivityCustomerField: fsdoc.AsString(d["activityCustomerField"]),
		ActivityTimeField:     fsdoc.AsString(d["activityTimeField"]),
		CustomerColl:          fsdoc.AsString(d["customerColl"]),
		CustomerKeyField:      fsdoc.AsString(d["customerKeyField"]),
		CustomerNameField:     fsdoc.AsString(d["customerNameField"]),
		CustomerPhoneField:    fsdoc.AsString(d["customerPhoneField"]),
		DefaultCadenceDays:    fsdoc.AsInt64(d["defaultCadenceDays"]),
		OutputColl:            fsdoc.AsString(d["outputColl"]),
	}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd cloud-function && go test ./internal/reorder/ -v && gofmt -l internal/reorder/`
Expected: PASS; gofmt prints nothing.

- [ ] **Step 5: Commit** (HOLD — user-gated; run only when the user says)

```bash
git add cloud-function/internal/reorder/reorder.go cloud-function/internal/reorder/reorder_test.go
git commit -m "feat(reorder): pure core (Config, parseFilter, matches, parseConfig)"
```

---

## Task 2: `internal/reorder` engine (config cache + OnActivity + upsert + lookup)

**Files:**
- Modify: `internal/reorder/reorder.go` (append)

**Interfaces:**
- Consumes (Task 1): `Config`, `parseFilter`, `matches`, `parseConfig`.
- Consumes: `cloud.google.com/go/firestore`, `internal/paths` (`Base`), `internal/fsdoc` (`Str`, `Int`, `AsInt64`, `AsString`), grpc `codes`/`status`.
- Produces: `func OnActivity(ctx context.Context, client *firestore.Client, db, tid, coll string, after map[string]*firestoredata.Value) error` — called by the router (Task 3).

- [ ] **Step 1: Add imports** — extend the import block in `internal/reorder/reorder.go`

```go
import (
	"context"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/googleapis/google-cloudevents-go/cloud/firestoredata"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"consteon.com/cloud-function/internal/fsdoc"
	"consteon.com/cloud-function/internal/paths"
)
```

- [ ] **Step 2: Append the engine** — to `internal/reorder/reorder.go`

```go
const (
	configColl = "reorder_config"
	cfgTTLms   = 60_000 // in-process config cache TTL

	fRc        = "rc"
	fLastAt    = "last_at"
	fCd        = "cd"
	fCn        = "cn"
	fCp        = "cp"
	fDerivedAt = "derived_at"
)

var (
	cacheMu sync.Mutex
	cache   = map[string]cacheEntry{} // key = db+"/"+tid
)

type cacheEntry struct {
	at   int64
	cfgs []Config
}

// loadConfigs returns the tenant's reorder configs, cached for cfgTTLms. The
// router fires OnActivity on every movement/event create, so a Firestore read
// per write would be wasteful. A tenant with no config docs caches an empty
// slice (still cheap). ponytail: global map, fine for a per-process cache.
func loadConfigs(ctx context.Context, client *firestore.Client, db, tid string) ([]Config, error) {
	k := db + "/" + tid
	now := time.Now().UnixMilli()

	cacheMu.Lock()
	if e, ok := cache[k]; ok && now-e.at < cfgTTLms {
		cfgs := e.cfgs
		cacheMu.Unlock()
		return cfgs, nil
	}
	cacheMu.Unlock()

	snaps, err := client.Collection(paths.Base(db, tid) + "/" + configColl).Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	cfgs := make([]Config, 0, len(snaps))
	for _, s := range snaps {
		cfgs = append(cfgs, parseConfig(s.Ref.ID, s.Data()))
	}
	cacheMu.Lock()
	cache[k] = cacheEntry{at: now, cfgs: cfgs}
	cacheMu.Unlock()
	return cfgs, nil
}

// OnActivity refreshes reorder_cache.last_at for the customer named by a new
// activity doc, for every configured vertical whose activityColl == coll and
// whose filter matches. BEST-EFFORT: every error is logged and swallowed
// (returns nil) — reorder is a soft projection and must never fail the router.
func OnActivity(ctx context.Context, client *firestore.Client, db, tid, coll string, after map[string]*firestoredata.Value) error {
	cfgs, err := loadConfigs(ctx, client, db, tid)
	if err != nil {
		log.Printf("WARN [reorder] load configs %s/%s: %v", db, tid, err)
		return nil
	}
	get := func(k string) string { return fsdoc.Str(after, k) }
	for _, c := range cfgs {
		if c.ActivityColl != coll || !matches(parseFilter(c.ActivityFilter), get) {
			continue
		}
		key := fsdoc.Str(after, c.ActivityCustomerField)
		t := fsdoc.Int(after, c.ActivityTimeField)
		if key == "" || t == 0 {
			continue
		}
		if err := upsertLastAt(ctx, client, db, tid, c, key, t); err != nil {
			log.Printf("WARN [reorder] %s upsert %s: %v", c.Vertical, key, err)
		}
	}
	return nil
}

// upsertLastAt writes last_at (+ denormed cn/cp + default cd) only when t is
// newer than the stored value, so a replayed/out-of-order activity never rewinds
// the date. MergeAll => idempotent.
func upsertLastAt(ctx context.Context, client *firestore.Client, db, tid string, c Config, key string, t int64) error {
	ref := client.Doc(paths.Base(db, tid) + "/" + c.OutputColl + "/" + key)
	snap, err := ref.Get(ctx)
	if err != nil && status.Code(err) != codes.NotFound {
		return err
	}
	if err == nil && fsdoc.AsInt64(snap.Data()[fLastAt]) >= t {
		return nil // stored date is same/newer -> nothing to do
	}
	doc := map[string]interface{}{
		fRc:        key,
		fLastAt:    t,
		fCd:        c.DefaultCadenceDays,
		fDerivedAt: time.Now().UnixMilli(),
	}
	if cn, cp := lookupCustomer(ctx, client, db, tid, c, key); cn != "" {
		doc[fCn] = cn
		if cp != "" {
			doc[fCp] = cp
		}
	} else if cp != "" {
		doc[fCp] = cp
	}
	_, err = ref.Set(ctx, doc, firestore.MergeAll)
	return err
}

// lookupCustomer resolves the customer's denorm name/phone from customerColl by
// customerKeyField == key (type-tolerant). Missing/unconfigured -> empty (the
// renderer then shows the id).
func lookupCustomer(ctx context.Context, client *firestore.Client, db, tid string, c Config, key string) (cn, cp string) {
	if c.CustomerColl == "" || c.CustomerKeyField == "" {
		return "", ""
	}
	snaps, err := client.Collection(paths.Base(db, tid) + "/" + c.CustomerColl).
		Where(c.CustomerKeyField, "in", eqAny(key)).Limit(1).Documents(ctx).GetAll()
	if err != nil || len(snaps) == 0 {
		return "", ""
	}
	d := snaps[0].Data()
	return fsdoc.AsString(d[c.CustomerNameField]), fsdoc.AsString(d[c.CustomerPhoneField])
}

// eqAny builds the value set for a type-tolerant `in`: the string plus, when
// numeric, the int64 form (ids are String via addEventRow, Number via table CRUD).
func eqAny(v string) []interface{} {
	vals := []interface{}{v}
	if n, err := strconv.ParseInt(v, 10, 64); err == nil {
		vals = append(vals, n)
	}
	return vals
}
```

- [ ] **Step 3: Verify build + vet + existing tests**

Run: `cd cloud-function && go build ./... && go vet ./internal/reorder/ && go test ./internal/reorder/ && gofmt -l internal/reorder/`
Expected: build OK, vet clean, Task 1 tests still PASS, gofmt prints nothing.
(No new unit test: `OnActivity`/`upsert`/`lookup` are Firestore I/O — the repo does not unit-test I/O, only the pure core, which Task 1 covers.)

- [ ] **Step 4: Commit** (HOLD — user-gated)

```bash
git add cloud-function/internal/reorder/reorder.go
git commit -m "feat(reorder): event-driven engine (config cache, OnActivity, upsert, denorm)"
```

---

## Task 3: Wire the movement route into `OnTenantWrite`

**Files:**
- Modify: `tenant_write_trigger.go` (import + append 1 entry to `tenantRoutes`)

**Interfaces:**
- Consumes (Task 2): `reorder.OnActivity`.
- Consumes: existing `tenantRoute` struct, `onCreate` const, `docFields` alias — all in `tenant_write_trigger.go`.

> **Why only movement (not event):** the `(event, create)` slot is already owned by the reward-payout route, and the `OnTenantWrite` loop is first-(coll,kind)-match with `return nil` on gate-fail (no fall-through) — a second `event`/create route would be shadowed. Galon sources from `movement`, so v1 needs only the movement route. The `event` route (AC etc.) is deferred; when needed, either change the loop's gate-fail `return nil`→`continue` (safe: no coll/kind has two routes today) with the reorder route ordered AFTER payout, or merge `reorder.OnActivity` into the event handler. See design §4b.

- [ ] **Step 1: Add the import** — in `tenant_write_trigger.go` import block

```go
	"consteon.com/cloud-function/internal/reorder"
```

- [ ] **Step 2: Append the movement route** — to the `tenantRoutes = []tenantRoute{...}` slice (after the last existing entry, before the closing `}`)

```go
	{
		// Reorder aging projection: a fresh movement (galon DROP, etc.) refreshes
		// the customer's last_at. gate nil ON PURPOSE — the filter (mt◼DROP …)
		// lives in reorder_config, not hardcoded here, so a new vertical is a
		// config doc. OnActivity is best-effort (returns nil) so it never blocks
		// the router. "movement" is the coll segment (paths.Movement's leaf).
		coll: "movement", on: onCreate,
		handle: func(ctx context.Context, client *firestore.Client, db, tid, _ string, _, after docFields) error {
			return reorder.OnActivity(ctx, client, db, tid, "movement", after)
		},
	},
```

- [ ] **Step 3: Build, vet, full test suite**

Run: `cd cloud-function && go build ./... && go vet ./... && go test ./... && gofmt -l .`
Expected: build OK; vet clean; ALL packages PASS (existing router tests `TestApprovalGates` etc. unaffected — routes are additive, movement/event creates matched no route before); gofmt prints nothing (ignore any pre-existing dirty file you did not touch, e.g. `walkin_nota_trigger.go`).

- [ ] **Step 4: Commit** (HOLD — user-gated)

```bash
git add cloud-function/tenant_write_trigger.go
git commit -m "feat(reorder): route movement+event creates to reorder.OnActivity"
```

---

## Deploy (devops — NOT in this plan, and NOT by this session)

`reorder.OnActivity` runs inside `OnTenantWrite`. Deploy = redeploy the existing function: `bash deploy.sh onTenantWrite`. No new function, no Scheduler. Feature is live for a vertical once (a) this CF is deployed, (b) `reorder_config/{vertical}` exists, (c) SIGNAL_LIST renders `reorder_cache` with aging-compute.

---

## Self-Review (done by planner)

- **Spec coverage:** renderer-aging (store last_at only) ✓ Task 2 upsert writes last_at/cd/cn/cp, no ds/st. Generic config-driven ✓ Task 1 Config + Task 2 loadConfigs. onTenantWrite +2 routes ✓ Task 3. Best-effort/idempotent/max-time ✓ Task 2. Backward-compat ✓ (new colls, additive routes). never_ordered / customerFilter / ty / gaps / fs / AC / cron = explicitly cut in design §10 — no task, correct.
- **Placeholder scan:** none — all steps have real code + real commands.
- **Type consistency:** `Config` fields identical across Task 1 (definition) ↔ Task 2 (loadConfigs/parseConfig/OnActivity use). `OnActivity` signature identical Task 2 (def) ↔ Task 3 (call). `fLastAt`/`fCd`/… consts defined once (Task 2). `eqAny` defined Task 2, used Task 2.
