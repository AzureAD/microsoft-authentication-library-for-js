/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";

const CLIENT_ID = "bounded-cache-benchmark-client";
const AUTHORITY_HOST = "login.microsoftonline.com";
const AUTHORITY_TENANT = "tenant-00";
const AUTHORITY = `https://${AUTHORITY_HOST}/${AUTHORITY_TENANT}`;
const FIXED_EXPIRATION = "4102444800";
const ENVIRONMENTS = ["login.microsoftonline.com", "login.microsoftonline.us"];
const TOKEN_SECTIONS = ["AccessToken", "IdToken", "RefreshToken"];

export const BENCHMARK_MODES = {
    smoke: {
        capacities: [100, null],
        entryCount: 125,
        selectedHitCount: 4,
        warmup: 1,
        repetitions: 2,
    },
    full: {
        capacities: [100, 500, 1000, null],
        entryCount: 1200,
        selectedHitCount: 8,
        warmup: 2,
        repetitions: 5,
    },
};

function hash(value) {
    return createHash("sha256").update(value, "utf8").digest("base64url");
}

function additionalCacheKeyHash(components) {
    // Public acquisition writes pass this explicit hash to NodeStorage; the
    // length-prefixed fallback applies only when no precomputed hash is passed.
    return hash(JSON.stringify(components));
}

export function credentialKey(entity) {
    const components = [
        entity.home_account_id,
        entity.environment,
        entity.credential_type,
        entity.client_id,
        entity.realm || "",
        entity.target || "",
        "",
    ];
    if (
        entity.additionalCacheKeyComponents &&
        Object.keys(entity.additionalCacheKeyComponents).length > 0
    ) {
        components.push(
            additionalCacheKeyHash(entity.additionalCacheKeyComponents),
        );
    }
    return components.join("-").toLowerCase();
}

function createDimensions(index, selectedHit) {
    const variant = index % 4;
    const environment = selectedHit
        ? AUTHORITY_HOST
        : ENVIRONMENTS[index % ENVIRONMENTS.length];
    const tenant = selectedHit
        ? AUTHORITY_TENANT
        : `tenant-${String(index % 31).padStart(2, "0")}`;
    const scope = `api-${String(index).padStart(4, "0")}/.default`;
    const fmiPath =
        variant === 0 || variant === 2 ? `/agents/${index % 17}` : undefined;
    const claimsFromClient =
        variant === 1 || variant === 2
            ? JSON.stringify({
                  access_token: {
                      benchmark_claim: {
                          values: [`value-${index % 19}`],
                      },
                  },
              })
            : undefined;
    const additionalCacheKeyComponents = {
        ...(fmiPath ? { fmi_path: fmiPath } : {}),
        ...(claimsFromClient ? { client_claims: claimsFromClient } : {}),
    };

    return {
        environment,
        tenant,
        scope,
        fmiPath,
        claimsFromClient,
        additionalCacheKeyComponents:
            Object.keys(additionalCacheKeyComponents).length > 0
                ? additionalCacheKeyComponents
                : undefined,
    };
}

export function createWorkloadEntry(index, selectedHit = false) {
    const dimensions = createDimensions(index, selectedHit);
    const entity = {
        home_account_id: "",
        environment: dimensions.environment,
        credential_type: "AccessToken",
        client_id: CLIENT_ID,
        secret: `synthetic-access-token-${index}`,
        realm: dimensions.tenant,
        target: dimensions.scope,
        cached_at: "1700000000",
        expires_on: FIXED_EXPIRATION,
        extended_expires_on: FIXED_EXPIRATION,
        token_type: "Bearer",
        ...(dimensions.additionalCacheKeyComponents
            ? {
                  additionalCacheKeyComponents:
                      dimensions.additionalCacheKeyComponents,
              }
            : {}),
    };

    return {
        key: credentialKey(entity),
        entity,
        request: {
            authority: `https://${dimensions.environment}/${dimensions.tenant}`,
            scopes: [dimensions.scope],
            ...(dimensions.fmiPath ? { fmiPath: dimensions.fmiPath } : {}),
            ...(dimensions.claimsFromClient
                ? { claimsFromClient: dimensions.claimsFromClient }
                : {}),
        },
        dimensions,
    };
}

export function createOboPartitionEntry(assertion, index = 3) {
    const entry = createWorkloadEntry(index, true);
    const userAssertionHash = hash(assertion);
    const entity = {
        ...entry.entity,
        userAssertionHash,
    };
    return {
        ...entry,
        entity,
        key: credentialKey(entity),
        partitionKey: `obo:${userAssertionHash}`,
        effectiveCacheKey: `obo:${userAssertionHash}|${credentialKey(entity)}`,
        request: {
            ...entry.request,
            oboAssertion: assertion,
        },
    };
}

export function buildSerializedWorkload(
    entryCount,
    selectedHitCount = 4,
    capacities = [100, null],
) {
    if (!Number.isInteger(entryCount) || entryCount <= 0) {
        throw new Error("entryCount must be a positive integer");
    }
    if (
        !Number.isInteger(selectedHitCount) ||
        selectedHitCount < 0 ||
        selectedHitCount > entryCount
    ) {
        throw new Error(
            "selectedHitCount must be an integer between zero and entryCount",
        );
    }

    const selectedIndices = new Set();
    capacities.forEach((capacity) => {
        const retainedStart =
            capacity === null ? 0 : Math.max(0, entryCount - capacity);
        for (
            let offset = 0;
            offset < Math.min(selectedHitCount, entryCount);
            offset += 1
        ) {
            selectedIndices.add(retainedStart + offset);
        }
    });
    const entries = Array.from({ length: entryCount }, (_, index) =>
        createWorkloadEntry(index, selectedIndices.has(index)),
    );
    const accessTokens = Object.fromEntries(
        entries.map(({ key, entity }) => [key, entity]),
    );
    if (Object.keys(accessTokens).length !== entryCount) {
        throw new Error("workload generation produced duplicate cache keys");
    }

    const appMetadataKey =
        `appmetadata-${AUTHORITY_HOST}-${CLIENT_ID}`.toLowerCase();
    const cache = {
        Account: {},
        IdToken: {},
        AccessToken: accessTokens,
        RefreshToken: {},
        AppMetadata: {
            [appMetadataKey]: {
                client_id: CLIENT_ID,
                environment: AUTHORITY_HOST,
                future_metadata: "preserve-across-round-trip",
            },
        },
        UnknownRoot: {
            format: "future-compatible",
            preserve: true,
        },
    };

    return {
        blob: JSON.stringify(cache),
        cache,
        entries,
        selectedHitCount,
    };
}

export function countSerializedEntities(serializedCache) {
    const parsed =
        typeof serializedCache === "string"
            ? JSON.parse(serializedCache)
            : serializedCache;
    return TOKEN_SECTIONS.reduce(
        (total, section) => total + Object.keys(parsed[section] || {}).length,
        0,
    );
}

export function hasSchemaVersion(serializedCache) {
    const parsed =
        typeof serializedCache === "string"
            ? JSON.parse(serializedCache)
            : serializedCache;
    return Object.keys(parsed).some((key) =>
        key.toLowerCase().includes("schema"),
    );
}

export async function createClient(
    capacity,
    {
        authority = AUTHORITY,
        networkProbe = { get: 0, post: 0, allowPost: false },
        networkClient,
    } = {},
) {
    const { ConfidentialClientApplication } = await import("@azure/msal-node");
    const inMemoryCache =
        capacity === null
            ? undefined
            : {
                  evictionEnabled: true,
                  maxEntries: capacity,
              };
    const authorityMetadata = JSON.stringify({
        authorization_endpoint: `${authority}/oauth2/v2.0/authorize`,
        token_endpoint: `${authority}/oauth2/v2.0/token`,
        issuer: `${authority}/v2.0`,
        jwks_uri: `${authority}/discovery/v2.0/keys`,
    });
    const cacheOnlyNetworkClient = {
        sendGetRequestAsync: async () => {
            networkProbe.get += 1;
            throw new Error("benchmark cache hit attempted an HTTP GET");
        },
        sendPostRequestAsync: async () => {
            networkProbe.post += 1;
            if (!networkProbe.allowPost) {
                throw new Error("benchmark cache hit attempted an HTTP POST");
            }
            return {
                headers: {},
                status: 200,
                body: {
                    token_type: "Bearer",
                    expires_in: 3600,
                    ext_expires_in: 3600,
                    access_token: "synthetic-inserted-access-token",
                },
            };
        },
    };

    return new ConfidentialClientApplication({
        auth: {
            clientId: CLIENT_ID,
            authority,
            clientSecret: "synthetic-secret-not-used",
            authorityMetadata,
            knownAuthorities: ENVIRONMENTS,
        },
        cache: {
            ...(inMemoryCache ? { inMemoryCache } : {}),
        },
        system: {
            networkClient: networkClient || cacheOnlyNetworkClient,
        },
    });
}

function percentileSummary(samples) {
    const sorted = [...samples].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    const median =
        sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
    return {
        minMs: Number(sorted[0].toFixed(3)),
        medianMs: Number(median.toFixed(3)),
        maxMs: Number(sorted[sorted.length - 1].toFixed(3)),
    };
}

function sortedAccessTokenKeys(serializedCache) {
    const parsed =
        typeof serializedCache === "string"
            ? JSON.parse(serializedCache)
            : serializedCache;
    return Object.keys(parsed.AccessToken || {}).sort();
}

function assertExactKeys(actualKeys, expectedKeys, phase) {
    if (
        actualKeys.length !== expectedKeys.length ||
        actualKeys.some((key, index) => key !== expectedKeys[index])
    ) {
        throw new Error(`${phase} access-token key set did not match`);
    }
}

async function exerciseSelectedHits(client, selectedEntries) {
    for (const entry of selectedEntries) {
        const result = await client.acquireTokenByClientCredential(
            entry.request,
        );
        if (result?.accessToken !== entry.entity.secret) {
            throw new Error(
                "client-credential selected-hit lookup missed the fixture",
            );
        }
    }
}

async function measureScenario(workload, capacity) {
    const memoryBefore = process.memoryUsage().heapUsed;
    const networkProbe = { get: 0, post: 0, allowPost: false };
    const client = await createClient(capacity, { networkProbe });
    const tokenCache = client.getTokenCache();
    const retainedStart =
        capacity === null ? 0 : Math.max(0, workload.entries.length - capacity);
    const selectedEntries = workload.entries.slice(
        retainedStart,
        retainedStart + workload.selectedHitCount,
    );
    const expectedEvictionCandidate =
        workload.entries[retainedStart + workload.selectedHitCount];

    const hydrateStart = performance.now();
    tokenCache.deserialize(workload.blob);
    const hydrateMs = performance.now() - hydrateStart;
    const expectedHydratedKeys = workload.entries
        .slice(retainedStart)
        .map(({ key }) => key)
        .sort();
    const hydratedKeys = sortedAccessTokenKeys(tokenCache.serialize());
    assertExactKeys(hydratedKeys, expectedHydratedKeys, "hydrated");

    const hitStart = performance.now();
    await exerciseSelectedHits(client, selectedEntries);
    const selectedHitMs = performance.now() - hitStart;

    if (networkProbe.get !== 0 || networkProbe.post !== 0) {
        throw new Error("selected-hit fixture attempted a network request");
    }
    assertExactKeys(
        sortedAccessTokenKeys(tokenCache.serialize()),
        expectedHydratedKeys,
        "selected-hit",
    );

    networkProbe.allowPost = true;
    const insertionStart = performance.now();
    const insertedResult = await client.acquireTokenByClientCredential({
        authority: AUTHORITY,
        scopes: ["inserted-resource/.default"],
        claimsFromClient:
            '{"access_token":{"benchmark_insert":{"values":["one"]}}}',
    });
    const insertionMs = performance.now() - insertionStart;
    if (insertedResult?.accessToken !== "synthetic-inserted-access-token") {
        throw new Error("public insertion did not return the fixture token");
    }

    const serializeStart = performance.now();
    const serialized = tokenCache.serialize();
    const serializeMs = performance.now() - serializeStart;

    const rehydratedClient = await createClient(capacity);
    const rehydrateStart = performance.now();
    rehydratedClient.getTokenCache().deserialize(serialized);
    const rehydrateMs = performance.now() - rehydrateStart;
    const memoryAfter = process.memoryUsage().heapUsed;

    const parsed = JSON.parse(serialized);
    const retainedKeys = sortedAccessTokenKeys(parsed);
    const retainedCount = countSerializedEntities(parsed);
    const expectedCount =
        capacity === null
            ? workload.entries.length + 1
            : Math.min(capacity, workload.entries.length + 1);
    const selectedKeysRetained = selectedEntries.every(
        ({ key }) => parsed.AccessToken[key],
    );
    const insertedKeys = retainedKeys.filter(
        (key) => !expectedHydratedKeys.includes(key),
    );
    if (insertedKeys.length !== 1) {
        throw new Error("public insertion did not add exactly one cache key");
    }
    const expectedRetainedKeys =
        capacity === null || workload.entries.length + 1 <= capacity
            ? [...expectedHydratedKeys, insertedKeys[0]].sort()
            : [
                  ...expectedHydratedKeys.filter(
                      (key) => key !== expectedEvictionCandidate?.key,
                  ),
                  insertedKeys[0],
              ].sort();
    assertExactKeys(retainedKeys, expectedRetainedKeys, "post-insertion");
    const expectedOldestEntryEvicted =
        capacity === null ||
        workload.entries.length + 1 <= capacity ||
        !expectedEvictionCandidate ||
        !parsed.AccessToken[expectedEvictionCandidate.key];

    if (retainedCount !== expectedCount) {
        throw new Error(
            `retained ${retainedCount} entries; expected ${expectedCount}`,
        );
    }
    if (!selectedKeysRetained) {
        throw new Error("selected-hit fixtures were unexpectedly evicted");
    }
    if (!expectedOldestEntryEvicted) {
        throw new Error("selected hits did not protect the expected entries");
    }
    if (networkProbe.get !== 0 || networkProbe.post !== 1) {
        throw new Error("insertion did not make exactly one POST request");
    }
    if (
        parsed.UnknownRoot?.preserve !== true ||
        Object.values(parsed.AppMetadata)[0]?.future_metadata !==
            "preserve-across-round-trip" ||
        hasSchemaVersion(parsed)
    ) {
        throw new Error("serialized cache compatibility metadata changed");
    }
    const rehydratedSerialized = rehydratedClient.getTokenCache().serialize();
    const rehydratedKeys = sortedAccessTokenKeys(rehydratedSerialized);
    assertExactKeys(rehydratedKeys, expectedRetainedKeys, "rehydrated");

    return {
        correctness: {
            inputEntityCount: workload.entries.length,
            insertedEntityCount: 1,
            retainedEntityCount: retainedCount,
            evictedEntityCount: workload.entries.length + 1 - retainedCount,
            expectedEntityCount: expectedCount,
            selectedHitCount: selectedEntries.length,
            selectedKeysRetained,
            expectedOldestEntryEvicted,
            exactKeySetsMatched: true,
            retainedKeySetHash: hash(expectedRetainedKeys.join("\n")),
            evictedKeySetHash: hash(
                workload.entries
                    .map(({ key }) => key)
                    .filter((key) => !expectedRetainedKeys.includes(key))
                    .sort()
                    .join("\n"),
            ),
            selectedHitNetworkRequestCount: 0,
            insertionNetworkRequestCount: 1,
            rehydratedEntityCount: expectedCount,
            unknownRootPreserved: parsed.UnknownRoot?.preserve === true,
            unknownMetadataPreserved:
                Object.values(parsed.AppMetadata)[0]?.future_metadata ===
                "preserve-across-round-trip",
            schemaVersionPresent: hasSchemaVersion(parsed),
        },
        timing: {
            hydrateMs,
            selectedHitMs,
            insertionMs,
            serializeMs,
            rehydrateMs,
        },
        memory: {
            heapUsedDeltaBytes: memoryAfter - memoryBefore,
        },
    };
}

export async function runBenchmark(config) {
    const workload = buildSerializedWorkload(
        config.entryCount,
        config.selectedHitCount,
        config.capacities,
    );
    const scenarios = [];

    for (const capacity of config.capacities) {
        const measurements = [];
        for (
            let iteration = 0;
            iteration < config.warmup + config.repetitions;
            iteration += 1
        ) {
            const measurement = await measureScenario(workload, capacity);
            if (iteration >= config.warmup) {
                measurements.push(measurement);
            }
        }

        const timingNames = [
            "hydrateMs",
            "selectedHitMs",
            "insertionMs",
            "serializeMs",
            "rehydrateMs",
        ];
        const samples = Object.fromEntries(
            timingNames.map((name) => [
                name,
                measurements.map((measurement) =>
                    Number(measurement.timing[name].toFixed(3)),
                ),
            ]),
        );
        const summaries = Object.fromEntries(
            timingNames.map((name) => [
                name,
                percentileSummary(
                    measurements.map((measurement) => measurement.timing[name]),
                ),
            ]),
        );

        scenarios.push({
            capacity: capacity === null ? "unbounded" : capacity,
            correctness: measurements[0].correctness,
            timing: {
                samples,
                summaries,
            },
            memory: {
                evidenceOnly: true,
                heapUsedDeltaBytes: measurements.map(
                    (measurement) => measurement.memory.heapUsedDeltaBytes,
                ),
            },
        });
    }

    return {
        environment: {
            node: process.version,
            platform: process.platform,
            arch: process.arch,
            gcExposed: typeof global.gc === "function",
        },
        config: {
            capacities: config.capacities.map((capacity) =>
                capacity === null ? "unbounded" : capacity,
            ),
            entryCount: config.entryCount,
            selectedHitCount: config.selectedHitCount,
            warmup: config.warmup,
            repetitions: config.repetitions,
        },
        scenarios,
    };
}
