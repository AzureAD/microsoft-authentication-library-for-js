# Hackathon bounded-cache rollout and Node migration recommendation

This document records the final evidence and migration recommendation for the
Hackathon bounded in-memory cache and confidential-client package direction. It
does not change cache defaults, eviction behavior, persistence-plugin
transactions, or managed identity integration.

## Reproducible evidence

The network-free harness lives in
[`regression-tests/msal-node/client-credential`](../../../regression-tests/msal-node/client-credential/README.md).
It uses built, public `@azure/msal-node` APIs and the existing serialized cache
contract. Full mode exercises capacities 100, 500, and 1000 plus an unbounded
control over 1200 deterministic entities. A smaller smoke mode is suitable for
CI.

Correctness gates are deterministic entity counts and cache outcomes:

- bounded hydration retains `min(maxEntries, input token entries)`;
- selected client-credential and OBO fixtures remain cache hits without
  network access, verified by zero-count throwing network probes;
- a public insertion after selected hits retains the selected entries and
  removes the expected oldest unselected entry when at capacity, with complete
  key-set equality checked through rehydration;
- serialization and rehydration preserve the enforced count;
- unknown root fields and unknown application-metadata properties survive;
- no cache schema-version field is introduced;
- the original durable blob is unchanged by process-memory pruning;
- bounded output hydrates under unbounded behavior without migration.

Focused tests also compare fixture keys against serialized keys emitted after
public client-credential and OBO acquisitions. Tenant, environment, resource,
client claims, and FMI dimensions produce distinct credential keys. OBO
assertion hashes remain entity lookup discriminators rather than credential-key
segments, so OBO durable caches must partition by assertion hash; tests verify
that effective partition-plus-credential identities remain distinct by
hydrating and querying separate public `TokenCache` instances.

Timing uses warmup and repeated samples. Process heap deltas are supporting,
noisy evidence only. Neither timing nor memory has a pass/fail threshold.
Commands, runtime versions, and measured results must be recorded with each
benchmark run; results from a different machine or Node version should not be
presented as directly comparable.

The Layer 5 local run on Windows x64, Node `v24.14.1`, and npm `11.11.0`
could not build the public packages after the one permitted root install
attempt failed with private-feed `E401`. Syntax checks and two dependency-free
workload tests passed, but no numerical benchmark result is claimed here.
Authenticated CI or a manual run must execute the public-API tests and smoke
benchmark; the regression harness README records the exact commands.

## Opt-in and rollback

Production applications may opt in per confidential client:

```typescript
cache: {
    inMemoryCache: {
        evictionEnabled: true,
        maxEntries: 500,
    },
},
```

Start with a capacity derived from each durable-cache partition's observed
working set, not from process-wide user count. Partition confidential caches by
application and user, tenant, or OBO assertion as appropriate. Monitor token
endpoint volume, cache hit rate, latency, and process memory during a staged
rollout. Capacity 500 is a useful benchmark point, not a universal production
value.

Rollback requires setting `evictionEnabled: false` or removing
`inMemoryCache`. Serialized blobs need no migration in either direction.
Credentials evicted and already persisted from a bounded process cannot be
recreated by rollback; they are reacquired normally. A read-only plugin cycle
can repeatedly load and prune the same oversized durable blob because this
layer intentionally does not add plugin write coordination.
During serialization, known token sections follow normal removal semantics;
unknown root fields and unknown properties on retained application metadata
are preserved from the deserialization snapshot.

## Default recommendation

**Keep the production default unbounded for this release.** The harness proves
the configured process-memory bound and unchanged-schema rollback, but it does
not establish a universal capacity or solve durable-cache coordination.
Default enablement should wait for representative service measurements across
partition sizes, token reacquisition rates, latency, and memory, followed by a
documented default and release plan. Until then, bounded caching should remain
an explicit confidential-client opt-in.

## Confidential-only Node migration sequence

1. Ship and document the `@azure/msal-node/confidential` entry point while the
   package root remains compatible. New CCA integrations should adopt the
   confidential entry point first.
2. Define the PCA transfer boundary around interactive/public-client classes,
   public-client requests, broker/loopback support, account UX helpers, and PCA
   persistence guidance. Move those surfaces to their destination package
   before removing root exports.
3. Keep `ConfidentialClientApplication`, confidential request types, token
   cache contracts, distributed-cache hooks, and confidential credential
   support owned by `@azure/msal-node`.
4. Keep `ManagedIdentityApplication` in its current owner until its static
   cache lifecycle is separated and tested. Do not fold MI into the
   confidential entry point merely because both are non-interactive.
5. Deprecate PCA/root compatibility exports only after the destination package
   is available. Maintain a documented compatibility window of at least one
   minor release, with warnings and migration examples before the next major
   removes or redirects legacy surfaces.
6. Treat additive entry points and deprecations as minor releases. Any root
   export removal, package ownership transfer that breaks imports, or default
   cache-policy change requires a major release and migration guide.

The transfer boundary should preserve serialized PCA cache compatibility and
avoid moving live cache instances between applications. Transfer persisted
PCA cache blobs through the existing serialization/plugin contract; do not
share a CCA's in-memory `TokenCache` object with the new PCA owner.

## Remaining production blockers

- **B — durable plugin coordination:** bounded hydration can prune process
  state without making a read-only cache transaction writable. A production
  default needs explicit concurrency/writeback semantics so an oversized blob
  is not repeatedly pruned or accidentally overwritten by racing workers.
- **D — managed identity static-cache lifecycle:** MI cache ownership and
  cleanup are process-static and do not yet follow the per-application bounded
  lifecycle. MI must remain outside the confidential split and default decision
  until that lifecycle is isolated, bounded, and covered for upgrade and
  rollback.
