/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
    buildSerializedWorkload,
    countSerializedEntities,
    createClient,
    createOboPartitionEntry,
    createWorkloadEntry,
    credentialKey,
    hasSchemaVersion,
    runBenchmark,
} from "./cache-workload.js";

test("workload dimensions produce production-equivalent cache identities", () => {
    const baseline = createWorkloadEntry(1);
    const changedEnvironment = structuredClone(baseline.entity);
    changedEnvironment.environment = "login.microsoftonline.com";
    const changedTenant = structuredClone(baseline.entity);
    changedTenant.realm = "another-tenant";
    const changedScope = structuredClone(baseline.entity);
    changedScope.target = "another-resource/.default";
    const changedFmi = structuredClone(baseline.entity);
    changedFmi.additionalCacheKeyComponents = {
        fmi_path: "/agents/changed",
    };
    const changedClaims = structuredClone(baseline.entity);
    changedClaims.additionalCacheKeyComponents = {
        client_claims:
            '{"access_token":{"benchmark_claim":{"values":["changed"]}}}',
    };

    const identities = new Set([
        baseline.key,
        credentialKey(changedEnvironment),
        credentialKey(changedTenant),
        credentialKey(changedScope),
        credentialKey(changedFmi),
        credentialKey(changedClaims),
    ]);
    assert.equal(identities.size, 6);

    const firstObo = createOboPartitionEntry("obo-assertion-one");
    const secondObo = createOboPartitionEntry("obo-assertion-two");
    assert.notEqual(
        firstObo.entity.userAssertionHash,
        secondObo.entity.userAssertionHash,
    );
    assert.notEqual(firstObo.effectiveCacheKey, secondObo.effectiveCacheKey);
});

test("generated keys match public acquisition serialization", async () => {
    const acquire = async ({
        authority = "https://login.microsoftonline.com/tenant-00",
        request,
        obo = false,
    }) => {
        const networkCalls = { get: 0, post: 0 };
        const networkClient = {
            sendGetRequestAsync: async () => {
                networkCalls.get += 1;
                throw new Error("static authority metadata should avoid GET");
            },
            sendPostRequestAsync: async () => {
                networkCalls.post += 1;
                return {
                    headers: {},
                    status: 200,
                    body: {
                        token_type: "Bearer",
                        expires_in: 3600,
                        ext_expires_in: 3600,
                        access_token: "production-key-fixture-token",
                    },
                };
            },
        };
        const client = await createClient(null, {
            authority,
            networkClient,
        });
        if (obo) {
            await client.acquireTokenOnBehalfOf({
                authority,
                ...request,
            });
        } else {
            await client.acquireTokenByClientCredential({
                authority,
                ...request,
            });
        }
        const parsed = JSON.parse(client.getTokenCache().serialize());
        const [key, entity] = Object.entries(parsed.AccessToken)[0];
        assert.equal(networkCalls.get, 0);
        assert.equal(networkCalls.post, 1);
        assert.equal(key, credentialKey(entity));
        return { key, entity };
    };

    const baseline = await acquire({
        request: { scopes: ["resource/.default"] },
    });
    const tenant = await acquire({
        authority: "https://login.microsoftonline.com/tenant-01",
        request: { scopes: ["resource/.default"] },
    });
    const environment = await acquire({
        authority: "https://login.microsoftonline.us/tenant-00",
        request: { scopes: ["resource/.default"] },
    });
    const resource = await acquire({
        request: { scopes: ["other-resource/.default"] },
    });
    const fmi = await acquire({
        request: {
            scopes: ["resource/.default"],
            fmiPath: "/agents/one",
        },
    });
    const claims = await acquire({
        request: {
            scopes: ["resource/.default"],
            claimsFromClient:
                '{"access_token":{"benchmark_claim":{"values":["one"]}}}',
        },
    });

    assert.equal(
        new Set([
            baseline.key,
            tenant.key,
            environment.key,
            resource.key,
            fmi.key,
            claims.key,
        ]).size,
        6,
    );

    const oboRequest = {
        scopes: ["obo-resource/.default"],
        oboAssertion: "obo-assertion-one",
    };
    const firstObo = await acquire({ request: oboRequest, obo: true });
    const secondObo = await acquire({
        request: {
            ...oboRequest,
            oboAssertion: "obo-assertion-two",
        },
        obo: true,
    });
    const oboClaims = await acquire({
        request: {
            ...oboRequest,
            claimsFromClient:
                '{"access_token":{"benchmark_claim":{"values":["obo"]}}}',
        },
        obo: true,
    });
    assert.equal(firstObo.key, secondObo.key);
    assert.notEqual(firstObo.key, oboClaims.key);
    assert.notEqual(
        firstObo.entity.userAssertionHash,
        secondObo.entity.userAssertionHash,
    );
    assert.equal(
        firstObo.entity.userAssertionHash,
        createHash("sha256")
            .update("obo-assertion-one", "utf8")
            .digest("base64url"),
    );
    assert.notEqual(
        `obo:${firstObo.entity.userAssertionHash}|${firstObo.key}`,
        `obo:${secondObo.entity.userAssertionHash}|${secondObo.key}`,
    );
});

test("OBO assertions occupy distinct durable blobs and hit without network", async () => {
    const first = createOboPartitionEntry("obo-assertion-one");
    const second = createOboPartitionEntry("obo-assertion-two");
    assert.equal(first.key, second.key);
    assert.notEqual(first.partitionKey, second.partitionKey);

    for (const entry of [first, second]) {
        const networkProbe = { get: 0, post: 0, allowPost: false };
        const client = await createClient(10, { networkProbe });
        const partitionBlob = JSON.stringify({
            Account: {},
            IdToken: {},
            AccessToken: {
                [entry.key]: entry.entity,
            },
            RefreshToken: {},
            AppMetadata: {},
        });
        client.getTokenCache().deserialize(partitionBlob);

        const result = await client.acquireTokenOnBehalfOf(entry.request);
        assert.equal(result.accessToken, entry.entity.secret);
        assert.deepEqual(networkProbe, {
            get: 0,
            post: 0,
            allowPost: false,
        });
        assert.equal(
            Object.keys(
                JSON.parse(client.getTokenCache().serialize()).AccessToken,
            )[0],
            entry.key,
        );
    }
});

test("workload construction is deterministic and collision free", () => {
    const first = buildSerializedWorkload(125, 4);
    const second = buildSerializedWorkload(125, 4);

    assert.equal(first.blob, second.blob);
    assert.equal(countSerializedEntities(first.blob), 125);
    assert.equal(new Set(first.entries.map(({ key }) => key)).size, 125);
    assert.equal(first.selectedHitCount, 4);
    assert.ok(first.entries.some(({ dimensions }) => dimensions.fmiPath));
    assert.ok(
        first.entries.some(({ dimensions }) => dimensions.claimsFromClient),
    );
});

test("unchanged cache schema supports bounded upgrade and unbounded rollback", async () => {
    const workload = buildSerializedWorkload(12, 2);
    const durableBlobBeforeBoundedHydration = workload.blob;

    const legacyClient = await createClient(null);
    legacyClient.getTokenCache().deserialize(durableBlobBeforeBoundedHydration);
    const legacySerialized = legacyClient.getTokenCache().serialize();
    assert.equal(countSerializedEntities(legacySerialized), 12);

    const boundedClient = await createClient(5);
    boundedClient.getTokenCache().deserialize(legacySerialized);
    const boundedSerialized = boundedClient.getTokenCache().serialize();
    const boundedParsed = JSON.parse(boundedSerialized);
    assert.equal(countSerializedEntities(boundedSerialized), 5);
    assert.equal(boundedParsed.UnknownRoot.preserve, true);
    assert.equal(
        Object.values(boundedParsed.AppMetadata)[0].future_metadata,
        "preserve-across-round-trip",
    );
    assert.equal(hasSchemaVersion(boundedSerialized), false);

    assert.equal(
        countSerializedEntities(durableBlobBeforeBoundedHydration),
        12,
        "bounded process hydration must not mutate the durable source blob",
    );

    const rollbackClient = await createClient(null);
    rollbackClient.getTokenCache().deserialize(boundedSerialized);
    const rollbackSerialized = rollbackClient.getTokenCache().serialize();
    assert.equal(countSerializedEntities(rollbackSerialized), 5);
    assert.equal(JSON.parse(rollbackSerialized).UnknownRoot.preserve, true);
    assert.equal(hasSchemaVersion(rollbackSerialized), false);
});

test("benchmark smoke output separates correctness, timing, and memory", async () => {
    const output = await runBenchmark({
        capacities: [5, null],
        entryCount: 8,
        selectedHitCount: 2,
        warmup: 0,
        repetitions: 1,
    });

    assert.deepEqual(output.config.capacities, [5, "unbounded"]);
    assert.equal(output.scenarios[0].correctness.retainedEntityCount, 5);
    assert.equal(output.scenarios[0].correctness.evictedEntityCount, 4);
    assert.equal(output.scenarios[1].correctness.retainedEntityCount, 9);
    for (const scenario of output.scenarios) {
        assert.equal(scenario.correctness.selectedKeysRetained, true);
        assert.equal(scenario.correctness.expectedOldestEntryEvicted, true);
        assert.equal(scenario.correctness.exactKeySetsMatched, true);
        assert.equal(scenario.correctness.selectedHitNetworkRequestCount, 0);
        assert.equal(scenario.correctness.insertionNetworkRequestCount, 1);
        assert.equal(scenario.correctness.schemaVersionPresent, false);
        assert.equal(scenario.memory.evidenceOnly, true);
        assert.equal(scenario.timing.samples.hydrateMs.length, 1);
    }
});
