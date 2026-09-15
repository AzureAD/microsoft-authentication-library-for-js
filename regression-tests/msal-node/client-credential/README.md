# MSAL Node client-credential regression benchmarks

This workspace contains network-free performance evidence for confidential
client flows. The original `index.js` benchmark measures cache-hit throughput.
The bounded-cache harness measures a deterministic, high-cardinality serialized
cache workload through the built, public `@azure/msal-node` APIs.

## Bounded-cache workload

The generated workload uses synthetic access tokens and fixed ordering. It
varies tenant, authority environment, resource scope, `claimsFromClient`,
`fmiPath`, and OBO assertion hashes. The high-cardinality capacity scenarios
use client-credential entries, while focused OBO tests hydrate a separate
durable blob per assertion. Focused tests compare generated keys with serialized
keys produced by public token acquisitions, including claims and FMI
additional-key hashing. An OBO assertion hash is a serialized lookup
discriminator, not a credential-key segment; the harness therefore uses it as
the durable partition key recommended for OBO cache plugins.

The harness covers:

- oversized cache hydration, which bulk-inserts serialized entities;
- selected client-credential and OBO cache hits without network access;
- a public client-credential insertion after selected hits, followed by exact
  retained/evicted-key assertions;
- expired-first/oldest-entry capacity enforcement already implemented by the
  package under test;
- serialization and rehydration;
- unbounded-to-bounded upgrade and bounded-to-unbounded rollback using the
  unchanged cache schema.

Build the packages in dependency order, then run the deterministic tests and
fast CI-sized smoke benchmark:

```bash
npm run build --workspace=@azure/msal-common --workspace=@azure/msal-node
npm test --workspace=regression-tests/msal-node/client-credential
```

The workspace uses a local `file:` dependency and CI asserts that
`@azure/msal-node/package.json` resolves under `lib/msal-node`, preventing a
published package from being benchmarked after repository version bumps.

Run the full evidence workload separately:

```bash
npm run benchmark:cache --workspace=regression-tests/msal-node/client-credential
```

The smoke mode uses capacities 100 and unbounded with 125 starting entities, one
warmup, and two measured repetitions. Full mode uses capacities 100, 500, 1000,
and unbounded with 1200 starting entities, two warmups, and five measured
repetitions. Each scenario performs selected hits before one public insertion;
bounded scenarios compare the complete hydrated, selected-hit, post-insertion,
serialized, and rehydrated key sets. The selected entries must survive and the
expected oldest unselected entry must be removed.

## Output and interpretation

The command prints JSON with four deliberately separate areas:

- `environment`: Node/runtime details and whether `global.gc` was exposed;
- `config`: capacities, cardinality, warmup, and repetition counts;
- `correctness`: deterministic input, retained, evicted, selected-hit, and
  inserted, rehydrated, and network counts plus exact survivor and
  compatibility checks; hashes summarize the complete retained/evicted key sets
  without expanding every key into the report;
- `timing` and `memory`: raw repeated samples and timing summaries, with heap
  deltas explicitly marked as evidence-only.

Entity counts and cache outcomes are the correctness evidence. No wall-clock or
memory threshold is used as a CI assertion. Timings vary with CPU load, JIT
state, Node version, and host power policy. Heap deltas are noisier still
because garbage collection is nondeterministic. The harness reports whether GC
was exposed but neither invokes nor requires it.

Bounded hydration prunes only the in-process representation. It does not mutate
the string read from a durable cache plugin. A later mutating plugin cycle may
serialize the pruned representation and write it back; plugin transaction
coordination remains outside this benchmark and the bounded-cache option.
`TokenCache.serialize()` merges the current known cache sections with its
deserialization snapshot: removed known token entries remain removed, while
unknown root fields and unknown properties on retained application metadata are
left untouched.

## Recorded local execution

On 2026-09-14, Windows x64 with Node `v24.14.1` and npm `11.11.0`:

- `npm install --no-audit --no-fund` failed once with private-feed `E401`;
- the targeted package build then failed because the partial install did not
  contain `shx`;
- `node --check` passed for the workload, benchmark CLI, and test files;
- the dependency-free workload construction tests passed 2/2.

The built-package tests and benchmark could not be executed locally, so this
artifact commits no numerical timing or memory results. CI or a manual run in
an authenticated environment must execute the public-API compatibility tests
and benchmark before using timing data for a rollout decision.

## CI coverage

The evidence PR should require:

```bash
npm run build --workspace=@azure/msal-common --workspace=@azure/msal-node
npm test --workspace=@azure/msal-node -- --runInBand
npm test --workspace=regression-tests/msal-node/client-credential
npx beachball check --branch origin/dev
```

The regression workspace's default `test` command runs deterministic tests and
the smoke benchmark. Full mode remains a separate manual/hosted evidence run.
CI should also apply the repository's existing formatting, documentation-link,
and changefile checks.

See the
[Hackathon rollout and Node migration recommendation](../../../lib/msal-node/docs/hackathon-bounded-cache-rollout.md)
for opt-in, rollback, and production-default guidance.
