/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICachePlugin,
    JsonCache,
    PublicClientApplication,
    TokenCacheContext,
} from "../../src/index.js";
import {
    AUTHENTICATION_RESULT,
    ID_TOKEN_CLAIMS,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { DEFAULT_OPENID_CONFIG_RESPONSE } from "../utils/TestConstants.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";

/** Simulates a shared persisted cache without accessing the filesystem. */
class MemoryCachePlugin implements ICachePlugin {
    persistedCache = "";
    writes = 0;

    /** Reloads persisted tokens before each cache operation. */
    async beforeCacheAccess(context: TokenCacheContext): Promise<void> {
        if (this.persistedCache) {
            context.tokenCache.deserialize(this.persistedCache);
        }
    }

    /** Writes only when MSAL marks the cache operation as a mutation. */
    async afterCacheAccess(context: TokenCacheContext): Promise<void> {
        if (context.cacheHasChanged) {
            this.persistedCache = context.tokenCache.serialize();
            this.writes++;
        }
    }
}

const badTokenResponse = {
    status: 400,
    headers: {},
    body: {
        error: "invalid_grant",
        suberror: "bad_token",
        error_description: "The refresh token has been revoked.",
    },
};

/** Seeds real MSAL caches through an authorization-code exchange. */
async function createPersistedClient() {
    const persistence = new MemoryCachePlugin();
    const networkClient = mockNetworkClient({}, AUTHENTICATION_RESULT);
    const postRequest = jest.spyOn(networkClient, "sendPostRequestAsync");
    const client = new PublicClientApplication({
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            authority: TEST_CONFIG.validAuthority,
            knownAuthorities: ["login.microsoftonline.com"],
            authorityMetadata: JSON.stringify(
                DEFAULT_OPENID_CONFIG_RESPONSE.body
            ),
        },
        cache: { cachePlugin: persistence },
        system: { networkClient },
    });

    await client.acquireTokenByCode({
        code: "authorization-code",
        redirectUri: TEST_CONFIG.REDIRECT_URI,
        scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
        nonce: ID_TOKEN_CLAIMS.nonce,
    });
    const accounts = await client.getTokenCache().getAllAccounts();
    expect(accounts).toHaveLength(1);
    expect(persistence.writes).toBe(1);
    expect(
        Object.keys(JSON.parse(persistence.persistedCache).RefreshToken)
    ).toHaveLength(1);
    postRequest.mockClear();

    return {
        client,
        persistence,
        postRequest,
        request: {
            account: accounts[0],
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            forceRefresh: true,
        },
    };
}

describe("Refresh token persistence", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("persists bad_token removal so the next silent request does not reuse the rejected token", async () => {
        const { client, persistence, postRequest, request } =
            await createPersistedClient();
        const seededCache: JsonCache = JSON.parse(persistence.persistedCache);
        postRequest.mockResolvedValue(badTokenResponse);

        await expect(client.acquireTokenSilent(request)).rejects.toMatchObject({
            errorCode: "invalid_grant",
            subError: "bad_token",
        });

        const expectedCache = { ...seededCache, RefreshToken: {} };
        expect(persistence.writes).toBe(2);
        expect(JSON.parse(persistence.persistedCache)).toEqual(expectedCache);
        expect(JSON.parse(client.getTokenCache().serialize())).toEqual(
            expectedCache
        );

        await expect(client.acquireTokenSilent(request)).rejects.toMatchObject({
            errorCode: "no_tokens_found",
        });
        expect(postRequest).toHaveBeenCalledTimes(1);
        expect(JSON.parse(persistence.persistedCache)).toEqual(expectedCache);
    });

    it("removes only the rejected family token and uses the application token on the next request", async () => {
        const { client, persistence, postRequest, request } =
            await createPersistedClient();
        const appRefreshTokens = JSON.parse(
            persistence.persistedCache
        ).RefreshToken;
        postRequest.mockResolvedValueOnce({
            ...AUTHENTICATION_RESULT,
            body: {
                ...AUTHENTICATION_RESULT.body,
                foci: "1",
                refresh_token: "family-refresh-token",
            },
        });
        await client.acquireTokenByCode({
            code: "family-authorization-code",
            redirectUri: TEST_CONFIG.REDIRECT_URI,
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            nonce: ID_TOKEN_CLAIMS.nonce,
        });
        const seededCache: JsonCache = JSON.parse(persistence.persistedCache);
        expect(Object.keys(seededCache.RefreshToken)).toHaveLength(2);
        postRequest.mockClear();
        postRequest
            .mockResolvedValueOnce(badTokenResponse)
            .mockResolvedValueOnce(AUTHENTICATION_RESULT);

        await expect(client.acquireTokenSilent(request)).rejects.toMatchObject({
            errorCode: "invalid_grant",
            subError: "bad_token",
        });
        expect(postRequest).toHaveBeenCalledTimes(1);
        const expectedCache = {
            ...seededCache,
            RefreshToken: appRefreshTokens,
        };
        expect(JSON.parse(persistence.persistedCache)).toEqual(expectedCache);
        expect(JSON.parse(client.getTokenCache().serialize())).toEqual(
            expectedCache
        );

        await expect(client.acquireTokenSilent(request)).resolves.toMatchObject(
            {
                accessToken: AUTHENTICATION_RESULT.body.access_token,
                fromCache: false,
            }
        );
        expect(postRequest).toHaveBeenCalledTimes(2);
        expect(
            postRequest.mock.calls.map(([, options]) =>
                new URLSearchParams(options?.body).get("refresh_token")
            )
        ).toEqual([
            "family-refresh-token",
            AUTHENTICATION_RESULT.body.refresh_token,
        ]);
    });

    it("preserves a replacement persisted while the rejected refresh request was in flight", async () => {
        const { client, persistence, postRequest, request } =
            await createPersistedClient();
        const replacementCache: JsonCache = JSON.parse(
            persistence.persistedCache
        );
        const refreshTokenKey = Object.keys(replacementCache.RefreshToken)[0];
        replacementCache.RefreshToken[refreshTokenKey].secret =
            "replacement-refresh-token";
        postRequest.mockImplementationOnce(async () => {
            // Another process refreshes the same cache entry before this request fails.
            persistence.persistedCache = JSON.stringify(replacementCache);
            return badTokenResponse;
        });

        await expect(client.acquireTokenSilent(request)).rejects.toMatchObject({
            errorCode: "invalid_grant",
            subError: "bad_token",
        });
        expect(JSON.parse(persistence.persistedCache)).toEqual(
            replacementCache
        );
        expect(JSON.parse(client.getTokenCache().serialize())).toEqual(
            replacementCache
        );
        expect(
            new URLSearchParams(postRequest.mock.calls[0][1]?.body).get(
                "refresh_token"
            )
        ).toBe(AUTHENTICATION_RESULT.body.refresh_token);

        postRequest.mockResolvedValue(AUTHENTICATION_RESULT);
        await expect(client.acquireTokenSilent(request)).resolves.toMatchObject(
            {
                accessToken: AUTHENTICATION_RESULT.body.access_token,
                fromCache: false,
            }
        );
        expect(postRequest).toHaveBeenCalledTimes(2);
        expect(
            new URLSearchParams(postRequest.mock.calls[1][1]?.body).get(
                "refresh_token"
            )
        ).toBe("replacement-refresh-token");
    });
});
