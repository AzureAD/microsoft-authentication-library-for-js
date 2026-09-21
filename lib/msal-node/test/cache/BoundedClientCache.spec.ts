/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientCredentialRequest,
    ConfidentialClientApplication,
    Configuration,
    OnBehalfOfRequest,
} from "../../src/index.js";
import { AccessTokenEntity } from "../../src/common/cache/entities/AccessTokenEntity.js";
import * as CacheHelpers from "../../src/common/cache/utils/CacheHelpers.js";
import { NodeStorage } from "../../src/cache/NodeStorage.js";
import { generateCredentialKey } from "../../src/cache/CacheHelpers.js";
import {
    CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { ClientTestUtils } from "../client/ClientTestUtils.js";

type CredentialCacheView = {
    size: number;
    clear(): void;
    rkeys(): Generator<string>;
    set(key: string, value: AccessTokenEntity): unknown;
};

async function createClient(
    maxTokenCacheEntries: number
): Promise<ConfidentialClientApplication> {
    const config: Configuration =
        await ClientTestUtils.createTestConfidentialClientConfiguration(
            undefined,
            mockNetworkClient(
                DEFAULT_OPENID_CONFIG_RESPONSE.body,
                CONFIDENTIAL_CLIENT_AUTHENTICATION_RESULT
            )
        );
    config.auth.clientSecret = TEST_CONFIG.MSAL_CLIENT_SECRET;
    config.auth.clientCertificate = undefined;
    config.cache = {
        ...config.cache,
        maxTokenCacheEntries,
        maxTokenCacheSizeInBytes: 20 * 1024 * 1024,
    };
    return new ConfidentialClientApplication(config);
}

function getStorage(client: ConfidentialClientApplication): NodeStorage {
    return (client as unknown as { storage: NodeStorage }).storage;
}

function getCredentialCache(storage: NodeStorage): CredentialCacheView {
    return (storage as unknown as { credentialCache: CredentialCacheView })
        .credentialCache;
}

function getClientAccessToken(storage: NodeStorage): AccessTokenEntity {
    const accessToken = Object.values(storage.getCache()).find(
        (value): value is AccessTokenEntity =>
            !!value &&
            typeof value === "object" &&
            CacheHelpers.isAccessTokenEntity(value) &&
            value.clientId === TEST_CONSTANTS.CLIENT_ID
    );
    if (!accessToken) {
        throw new Error("Expected a cached client access token");
    }
    return accessToken;
}

function createUnrelatedToken(
    selected: AccessTokenEntity,
    suffix: string
): AccessTokenEntity {
    return {
        ...selected,
        clientId: `unrelated-client-${suffix}`,
        secret: `unrelated-token-${suffix}`,
    };
}

describe("bounded confidential client cache", () => {
    it("promotes a CCA client-credential hit before eviction", async () => {
        const client = await createClient(2);
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
        };
        await client.acquireTokenByClientCredential(request);

        const storage = getStorage(client);
        const selected = getClientAccessToken(storage);
        const unrelated = createUnrelatedToken(selected, "first");
        await storage.setAccessTokenCredential(unrelated, "", false);

        const cachedResult = await client.acquireTokenByClientCredential(
            request
        );
        expect(cachedResult?.fromCache).toBe(true);

        const newest = createUnrelatedToken(selected, "newest");
        await storage.setAccessTokenCredential(newest, "", false);

        expect(storage.getItem(generateCredentialKey(selected))).toBeDefined();
        expect(
            storage.getItem(generateCredentialKey(unrelated))
        ).toBeUndefined();
        expect(storage.getItem(generateCredentialKey(newest))).toBeDefined();
    });

    it("promotes an OBO access-token hit before eviction", async () => {
        const client = await createClient(8);
        const request: OnBehalfOfRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            oboAssertion: "user_assertion_hash",
            skipCache: false,
        };
        await client.acquireTokenOnBehalfOf(request);

        const storage = getStorage(client);
        const credentialCache = getCredentialCache(storage);
        const selected = getClientAccessToken(storage);
        let fillerIndex = 0;
        while (credentialCache.size < 8) {
            await storage.setAccessTokenCredential(
                createUnrelatedToken(selected, `${fillerIndex}`),
                "",
                false
            );
            fillerIndex += 1;
        }
        const keysBeforeHit = Array.from(credentialCache.rkeys());

        const cachedResult = await client.acquireTokenOnBehalfOf(request);
        expect(cachedResult?.fromCache).toBe(true);

        const newest = createUnrelatedToken(selected, "newest-obo");
        await storage.setAccessTokenCredential(newest, "", false);

        expect(storage.getItem(generateCredentialKey(selected))).toBeDefined();
        expect(
            keysBeforeHit.some((key) => storage.getItem(key) === undefined)
        ).toBe(true);
        expect(storage.getItem(generateCredentialKey(newest))).toBeDefined();
    });

    it("does not rebuild indexes or the LRU during authority refresh with 5,000 unrelated credentials", async () => {
        const client = await createClient(6_000);
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
        };
        await client.acquireTokenByClientCredential(request);

        const storage = getStorage(client);
        const selected = getClientAccessToken(storage);
        const cache = { ...storage.getCache() };
        for (let i = 0; i < 5_001; i++) {
            const token = createUnrelatedToken(selected, `${i}`);
            cache[generateCredentialKey(token)] = token;
        }
        storage.setCache(cache);

        const credentialCache = getCredentialCache(storage);
        const rebuildSpy = jest.spyOn(
            storage as unknown as { rebuildIndexes(): void },
            "rebuildIndexes"
        );
        const clearSpy = jest.spyOn(credentialCache, "clear");
        const setSpy = jest.spyOn(credentialCache, "set");
        const authorityWriteSpy = jest.spyOn(storage, "setAuthorityMetadata");

        const result = await client.acquireTokenByClientCredential(request);

        expect(result?.fromCache).toBe(true);
        expect(authorityWriteSpy).toHaveBeenCalled();
        expect(rebuildSpy).not.toHaveBeenCalled();
        expect(clearSpy).not.toHaveBeenCalled();
        expect(setSpy).not.toHaveBeenCalled();
    });
});
