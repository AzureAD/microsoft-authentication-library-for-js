/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Buffer } from "node:buffer";
import { NodeStorage } from "../../src/cache/NodeStorage.js";
import { Serializer } from "../../src/cache/serializer/Serializer.js";
import { AccessTokenEntity } from "../../src/common/cache/entities/AccessTokenEntity.js";
import { AccountEntity } from "../../src/common/cache/entities/AccountEntity.js";
import { IdTokenEntity } from "../../src/common/cache/entities/IdTokenEntity.js";
import { RefreshTokenEntity } from "../../src/common/cache/entities/RefreshTokenEntity.js";
import { LogLevel, Logger } from "../../src/common/logger/Logger.js";
import * as Constants from "../../src/common/utils/Constants.js";
import { TokenCache } from "../../src/cache/TokenCache.js";
import { ICachePlugin } from "../../src/common/cache/interface/ICachePlugin.js";
import { TokenCacheContext } from "../../src/common/cache/persistence/TokenCacheContext.js";
import { BaseAuthRequest } from "../../src/common/request/BaseAuthRequest.js";
import { ScopeSet } from "../../src/common/request/ScopeSet.js";
import {
    DEFAULT_TOKEN_BINDING_KEY_MANAGER,
    ITokenBindingKeyManager,
} from "../../src/common/crypto/ITokenBindingKeyManager.js";
import {
    DEFAULT_CRYPTO_IMPLEMENTATION,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";
import { generateCredentialKey } from "../../src/cache/CacheHelpers.js";
import { CryptoProvider } from "../../src/crypto/CryptoProvider.js";
import { name, version } from "../../package.json";

const clientId = TEST_CONSTANTS.CLIENT_ID;

function createAccessToken(
    target: string,
    secret: string = target
): AccessTokenEntity {
    return {
        homeAccountId: "uid.utid",
        environment: "login.microsoftonline.com",
        credentialType: Constants.CredentialType.ACCESS_TOKEN,
        clientId,
        secret,
        realm: "tenant-id",
        target,
        cachedAt: "1000",
        expiresOn: "1001",
        tokenType: Constants.AuthenticationScheme.BEARER,
        lastUpdatedAt: "1000",
    };
}

describe("bounded Node token cache", () => {
    let logger: Logger;

    beforeEach(() => {
        logger = new Logger(
            {
                loggerCallback: () => undefined,
                piiLoggingEnabled: false,
                logLevel: LogLevel.Info,
            },
            name,
            version
        );
    });

    function createStorage(
        maxTokenCacheEntries: number,
        maxTokenCacheSizeInBytes: number = 1024 * 1024,
        withAuthorityAliases: boolean = false,
        tokenBindingKeyManager: Pick<
            ITokenBindingKeyManager,
            "removeTokenBindingKey"
        > = DEFAULT_TOKEN_BINDING_KEY_MANAGER
    ): NodeStorage {
        return new NodeStorage(
            logger,
            clientId,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            withAuthorityAliases
                ? {
                      canonicalAuthority:
                          "https://login.microsoftonline.com/tenant-id",
                  }
                : undefined,
            {
                maxTokenCacheEntries,
                maxTokenCacheSizeInBytes,
            },
            tokenBindingKeyManager
        );
    }

    it("evicts credentials by count without evicting accounts or unknown records", async () => {
        const storage = createStorage(2, 1024 * 1024, true);
        const account: AccountEntity = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            realm: "tenant-id",
            localAccountId: "uid",
            username: "user@example.com",
            authorityType: "MSSTS",
            lastUpdatedAt: "1000",
        };
        storage.setItem("account-key", account);
        storage.setItem("unknown-key", "unknown-value");

        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        const third = createAccessToken("scope.third");
        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);
        await storage.setAccessTokenCredential(third, "", false);

        expect(storage.getItem(generateCredentialKey(first))).toBeUndefined();
        expect(storage.getItem(generateCredentialKey(second))).toBe(second);
        expect(storage.getItem(generateCredentialKey(third))).toBe(third);
        expect(storage.getItem("account-key")).toBe(account);
        expect(storage.getItem("unknown-key")).toBe("unknown-value");
        const credentialRead = jest.spyOn(storage, "getAccessTokenCredential");
        expect(
            storage.getAccessToken(
                {
                    homeAccountId: first.homeAccountId,
                    environment: first.environment,
                    tenantId: first.realm,
                    localAccountId: "uid",
                    username: "",
                },
                {
                    scopes: ["scope.first"],
                    correlationId: "",
                } as BaseAuthRequest
            )
        ).toBeNull();
        expect(credentialRead).not.toHaveBeenCalled();
    });

    it("promotes a selected structural cache hit even when the token is expired", async () => {
        const storage = createStorage(2, 1024 * 1024, true);
        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        const third = createAccessToken("scope.third");
        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);

        const selected = storage.getAccessToken(
            {
                homeAccountId: first.homeAccountId,
                environment: first.environment,
                tenantId: first.realm,
                localAccountId: "uid",
                username: "",
            },
            {
                scopes: ["scope.first"],
                correlationId: "",
                authenticationScheme: Constants.AuthenticationScheme.BEARER,
            } as BaseAuthRequest
        );
        expect(selected).toBe(first);

        await storage.setAccessTokenCredential(third, "", false);
        expect(storage.getItem(generateCredentialKey(first))).toBe(first);
        expect(storage.getItem(generateCredentialKey(second))).toBeUndefined();
    });

    it("does not promote a cache miss", async () => {
        const storage = createStorage(2);
        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        const third = createAccessToken("scope.third");
        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);

        expect(
            storage.getAccessToken(
                {
                    homeAccountId: first.homeAccountId,
                    environment: first.environment,
                    tenantId: first.realm,
                    localAccountId: "uid",
                    username: "",
                },
                {
                    scopes: ["scope.missing"],
                    correlationId: "",
                } as BaseAuthRequest
            )
        ).toBeNull();
        await storage.setAccessTokenCredential(third, "", false);

        expect(storage.getItem(generateCredentialKey(first))).toBeUndefined();
        expect(storage.getItem(generateCredentialKey(second))).toBe(second);
    });

    it("does not promote an ambiguous filtered selection", async () => {
        const storage = createStorage(2);
        const first = createAccessToken("scope.read");
        const second = createAccessToken("scope.read scope.extra");
        const third = createAccessToken("scope.third");
        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);

        expect(
            storage.getAccessTokensByFilter(
                {
                    credentialType: first.credentialType,
                    clientId,
                    target: ScopeSet.fromString("scope.read", ""),
                    userAssertionHash: first.userAssertionHash,
                },
                ""
            )
        ).toHaveLength(2);
        await storage.setAccessTokenCredential(third, "", false);

        expect(storage.getItem(generateCredentialKey(first))).toBeUndefined();
        expect(storage.getItem(generateCredentialKey(second))).toBe(second);
    });

    it("promotes the exact access-token key with precomputed additional components", async () => {
        const storage = createStorage(2, 1024 * 1024, true);
        const selected = {
            ...createAccessToken("scope.first"),
            additionalCacheKeyComponents: {
                attribute_tokens: "attribute-token",
            },
        };
        const selectedKey = storage.generateCredentialKey(
            selected,
            "precomputed-hash"
        );
        const unrelated = createAccessToken("scope.unrelated");
        const newest = createAccessToken("scope.newest");
        await storage.setAccessTokenCredential(
            selected,
            "",
            false,
            "precomputed-hash"
        );
        await storage.setAccessTokenCredential(unrelated, "", false);

        expect(storage.getItem(selectedKey)).toBe(selected);
        expect(
            storage.getAccessToken(
                {
                    homeAccountId: selected.homeAccountId,
                    environment: selected.environment,
                    tenantId: selected.realm,
                    localAccountId: "uid",
                    username: "",
                },
                {
                    scopes: ["scope.first"],
                    correlationId: "",
                    attributeTokens: ["attribute-token"],
                } as BaseAuthRequest
            )
        ).toBe(selected);
        await storage.setAccessTokenCredential(newest, "", false);

        expect(storage.getItem(selectedKey)).toBe(selected);
        expect(
            storage.getItem(generateCredentialKey(unrelated))
        ).toBeUndefined();
    });

    it("promotes the refresh token selected from multiple matches", async () => {
        const storage = createStorage(2, 1024 * 1024, true);
        const first: RefreshTokenEntity = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            credentialType: Constants.CredentialType.REFRESH_TOKEN,
            clientId,
            secret: "refresh-token-first",
            realm: "tenant-first",
            lastUpdatedAt: "1000",
        };
        const second: RefreshTokenEntity = {
            ...first,
            secret: "refresh-token-second",
            environment: "login.windows.net",
        };
        const newest = createAccessToken("scope.newest");
        await storage.setRefreshTokenCredential(first);
        await storage.setRefreshTokenCredential(second);

        expect(
            storage.getRefreshToken(
                {
                    homeAccountId: first.homeAccountId,
                    environment: first.environment,
                    tenantId: first.realm || "",
                    localAccountId: "uid",
                    username: "",
                },
                false,
                ""
            )
        ).toBe(first);
        await storage.setAccessTokenCredential(newest, "", false);

        expect(storage.getItem(generateCredentialKey(first))).toBe(first);
        expect(storage.getItem(generateCredentialKey(second))).toBeUndefined();
    });

    it("applies one shared entry limit to access, refresh, and ID tokens", async () => {
        const storage = createStorage(2);
        const idToken: IdTokenEntity = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            credentialType: Constants.CredentialType.ID_TOKEN,
            clientId,
            secret: "id-token",
            realm: "tenant-id",
            lastUpdatedAt: "1000",
        };
        const refreshToken: RefreshTokenEntity = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            credentialType: Constants.CredentialType.REFRESH_TOKEN,
            clientId,
            secret: "refresh-token",
            lastUpdatedAt: "1000",
        };
        const accessToken = createAccessToken("scope.first");

        await storage.setIdTokenCredential(idToken);
        await storage.setRefreshTokenCredential(refreshToken);
        await storage.setAccessTokenCredential(accessToken, "", false);

        expect(storage.getItem(generateCredentialKey(idToken))).toBeUndefined();
        expect(storage.getItem(generateCredentialKey(refreshToken))).toBe(
            refreshToken
        );
        expect(storage.getItem(generateCredentialKey(accessToken))).toBe(
            accessToken
        );
    });

    it("retains credential-shaped records with an unknown credential type", async () => {
        const storage = createStorage(1);
        const unknown = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            credentialType: "FutureCredential",
            clientId,
            secret: "unknown-secret",
        };
        storage.setItem("future-credential", unknown);
        await storage.setAccessTokenCredential(
            createAccessToken("scope.first"),
            "",
            false
        );
        await storage.setAccessTokenCredential(
            createAccessToken("scope.second"),
            "",
            false
        );

        expect(storage.getItem("future-credential")).toBe(unknown);
    });

    it("evicts by logical bytes before the entry limit is reached", async () => {
        const sizingStorage = createStorage(10, 1024 * 1024, true);
        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        const third = createAccessToken("scope.third");
        const sizing = sizingStorage as unknown as {
            getCredentialLogicalWeight(
                cacheKey: string,
                token: AccessTokenEntity
            ): number;
        };
        const capacity =
            sizing.getCredentialLogicalWeight(
                generateCredentialKey(first),
                first
            ) +
            sizing.getCredentialLogicalWeight(
                generateCredentialKey(second),
                second
            );
        const storage = createStorage(10, capacity, true);

        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);
        expect(
            storage.getAccessToken(
                {
                    homeAccountId: first.homeAccountId,
                    environment: first.environment,
                    tenantId: first.realm,
                    localAccountId: "uid",
                    username: "",
                },
                {
                    scopes: ["scope.first"],
                    correlationId: "",
                } as BaseAuthRequest
            )
        ).toBe(first);
        await storage.setAccessTokenCredential(third, "", false);

        expect(storage.getItem(generateCredentialKey(first))).toBe(first);
        expect(storage.getItem(generateCredentialKey(second))).toBeUndefined();
        expect(storage.getItem(generateCredentialKey(third))).toBe(third);
    });

    it("uses persisted UTF-8 bytes, generated index strings, and posting counts as logical weight", () => {
        const storage = createStorage(10);
        const internals = storage as unknown as {
            getCredentialLogicalWeight(
                cacheKey: string,
                token: AccessTokenEntity | IdTokenEntity | RefreshTokenEntity
            ): number;
            accessTokenStandardIndexKey(
                token: AccessTokenEntity,
                environment: string
            ): string;
            accessTokenOboIndexKey(token: AccessTokenEntity): string;
            idTokenIndexKey(
                token: IdTokenEntity,
                environment?: string,
                includeRealm?: boolean
            ): string;
            refreshTokenIndexKey(token: RefreshTokenEntity): string;
        };
        const accessToken = createAccessToken("scope.read scope.write");
        const accessTokenKey = generateCredentialKey(accessToken);
        const serializedAccessToken = Serializer.serializeAccessTokens({
            [accessTokenKey]: accessToken,
        })[accessTokenKey];
        const standardTuple = internals.accessTokenStandardIndexKey(
            accessToken,
            accessToken.environment
        );
        const oboTuple = internals.accessTokenOboIndexKey(accessToken);
        const expectedAccessTokenWeight =
            Buffer.byteLength(
                JSON.stringify({
                    [accessTokenKey]: serializedAccessToken,
                }),
                "utf8"
            ) +
            Buffer.byteLength(standardTuple, "utf8") +
            Buffer.byteLength(oboTuple, "utf8") +
            2 *
                (Buffer.byteLength("scope.read", "utf8") +
                    Buffer.byteLength("scope.write", "utf8")) +
            8;

        expect(
            internals.getCredentialLogicalWeight(accessTokenKey, accessToken)
        ).toBe(expectedAccessTokenWeight);

        const idToken: IdTokenEntity = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            credentialType: Constants.CredentialType.ID_TOKEN,
            clientId,
            secret: "id-token",
            realm: "tenant-id",
            lastUpdatedAt: "1000",
        };
        const idTokenKey = generateCredentialKey(idToken);
        const serializedIdToken = Serializer.serializeIdTokens({
            [idTokenKey]: idToken,
        })[idTokenKey];
        expect(internals.getCredentialLogicalWeight(idTokenKey, idToken)).toBe(
            Buffer.byteLength(
                JSON.stringify({ [idTokenKey]: serializedIdToken }),
                "utf8"
            ) +
                Buffer.byteLength(internals.idTokenIndexKey(idToken), "utf8") +
                Buffer.byteLength(
                    internals.idTokenIndexKey(
                        idToken,
                        idToken.environment,
                        false
                    ),
                    "utf8"
                ) +
                4
        );

        const refreshToken: RefreshTokenEntity = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            credentialType: Constants.CredentialType.REFRESH_TOKEN,
            clientId,
            secret: "refresh-token",
            lastUpdatedAt: "1000",
        };
        const refreshTokenKey = generateCredentialKey(refreshToken);
        const serializedRefreshToken = Serializer.serializeRefreshTokens({
            [refreshTokenKey]: refreshToken,
        })[refreshTokenKey];
        expect(
            internals.getCredentialLogicalWeight(refreshTokenKey, refreshToken)
        ).toBe(
            Buffer.byteLength(
                JSON.stringify({
                    [refreshTokenKey]: serializedRefreshToken,
                }),
                "utf8"
            ) +
                Buffer.byteLength(
                    internals.refreshTokenIndexKey(refreshToken),
                    "utf8"
                ) +
                3
        );
    });

    it("rejects an oversized replacement without evicting unrelated credentials", async () => {
        const sizingStorage = createStorage(10);
        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        const sizing = sizingStorage as unknown as {
            getCredentialLogicalWeight(
                cacheKey: string,
                token: AccessTokenEntity
            ): number;
        };
        const firstKey = generateCredentialKey(first);
        const secondKey = generateCredentialKey(second);
        const capacity =
            sizing.getCredentialLogicalWeight(firstKey, first) +
            sizing.getCredentialLogicalWeight(secondKey, second) +
            10;
        const storage = createStorage(10, capacity);
        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);

        const oversized = createAccessToken(
            "scope.first",
            "x".repeat(capacity + 1)
        );
        await storage.setAccessTokenCredential(oversized, "", false);

        expect(storage.getItem(firstKey)).toBeUndefined();
        expect(storage.getItem(secondKey)).toBe(second);
    });

    it("rolls back an invalid replacement before eviction can change the cache", async () => {
        const storage = createStorage(2);
        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        const invalidReplacement = {
            ...first,
            additionalCacheKeyComponents: circular as Record<string, string>,
        };

        expect(() =>
            storage.setItem(generateCredentialKey(first), invalidReplacement)
        ).toThrow();

        expect(storage.getItem(generateCredentialKey(first))).toBe(first);
        expect(storage.getItem(generateCredentialKey(second))).toBe(second);

        const third = createAccessToken("scope.third");
        await storage.setAccessTokenCredential(third, "", false);
        expect(storage.getItem(generateCredentialKey(first))).toBeUndefined();
        expect(storage.getItem(generateCredentialKey(second))).toBe(second);
        expect(storage.getItem(generateCredentialKey(third))).toBe(third);
    });

    it("cleans up a token-binding key exactly once on automatic eviction", async () => {
        const removeTokenBindingKey = jest.fn(async () => undefined);
        const storage = createStorage(1, 1024 * 1024, false, {
            ...DEFAULT_TOKEN_BINDING_KEY_MANAGER,
            removeTokenBindingKey,
        });
        const boundToken = {
            ...createAccessToken("scope.bound"),
            credentialType:
                Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
            tokenType: Constants.AuthenticationScheme.POP,
            keyId: "binding-key",
        };
        await storage.setAccessTokenCredential(boundToken, "", false);
        await storage.setAccessTokenCredential(
            createAccessToken("scope.next"),
            "",
            false
        );

        expect(removeTokenBindingKey).toHaveBeenCalledTimes(1);
        expect(removeTokenBindingKey).toHaveBeenCalledWith("binding-key", "");
    });

    it("does not propagate a synchronous token-binding cleanup failure", async () => {
        const storage = createStorage(
            1,
            1024 * 1024,
            false,
            new CryptoProvider()
        );
        const boundToken = {
            ...createAccessToken("scope.bound"),
            credentialType:
                Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
            tokenType: Constants.AuthenticationScheme.POP,
            keyId: "binding-key",
        };
        await storage.setAccessTokenCredential(boundToken, "", false);

        await expect(
            storage.setAccessTokenCredential(
                createAccessToken("scope.next"),
                "",
                false
            )
        ).resolves.toBeUndefined();
        await Promise.resolve();

        expect(
            storage.getItem(
                generateCredentialKey(createAccessToken("scope.next"))
            )
        ).toBeDefined();
    });

    it("persists plugin-loaded eviction so trimmed entries cannot resurrect", async () => {
        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        const third = createAccessToken("scope.third");
        let persisted = JSON.stringify({
            Account: {},
            IdToken: {},
            AccessToken: Serializer.serializeAccessTokens({
                [generateCredentialKey(first)]: first,
                [generateCredentialKey(second)]: second,
                [generateCredentialKey(third)]: third,
            }),
            RefreshToken: {},
            AppMetadata: {},
            FutureCredential: {
                future: {
                    homeAccountId: "uid.utid",
                    environment: "login.microsoftonline.com",
                    credentialType: "FutureCredential",
                    clientId,
                    secret: "unknown-secret",
                },
            },
        });
        const saves: string[] = [];
        const plugin: ICachePlugin = {
            beforeCacheAccess: async (context: TokenCacheContext) => {
                context.tokenCache.deserialize(persisted);
            },
            afterCacheAccess: async (context: TokenCacheContext) => {
                if (context.cacheHasChanged) {
                    persisted = context.tokenCache.serialize();
                    saves.push(persisted);
                }
            },
        };
        const tokenCache = new TokenCache(createStorage(2), logger, plugin);

        await tokenCache.getAllAccounts();
        expect(saves).toHaveLength(1);
        expect(Object.keys(JSON.parse(persisted).AccessToken)).toHaveLength(2);
        expect(JSON.parse(persisted).FutureCredential).toEqual({
            future: {
                homeAccountId: "uid.utid",
                environment: "login.microsoftonline.com",
                credentialType: "FutureCredential",
                clientId,
                secret: "unknown-secret",
            },
        });

        await tokenCache.getAllAccounts();
        expect(saves).toHaveLength(1);
        expect(Object.keys(JSON.parse(persisted).AccessToken)).toHaveLength(2);
    });

    it("preserves trimming notification across overlapping plugin loads", async () => {
        const first = createAccessToken("scope.first");
        const second = createAccessToken("scope.second");
        const third = createAccessToken("scope.third");
        const serializeSpy = jest.spyOn(TokenCache.prototype, "serialize");
        const snapshots = [
            JSON.stringify({
                Account: {},
                IdToken: {},
                AccessToken: Serializer.serializeAccessTokens({
                    [generateCredentialKey(first)]: first,
                    [generateCredentialKey(second)]: second,
                    [generateCredentialKey(third)]: third,
                }),
                RefreshToken: {},
                AppMetadata: {},
            }),
            JSON.stringify({
                Account: {},
                IdToken: {},
                AccessToken: Serializer.serializeAccessTokens({
                    [generateCredentialKey(first)]: first,
                    [generateCredentialKey(second)]: second,
                }),
                RefreshToken: {},
                AppMetadata: {},
            }),
        ];
        let releaseFirstLoad: () => void;
        const secondLoadFinished = new Promise<void>((resolve) => {
            releaseFirstLoad = resolve;
        });
        let firstLoadFinished: () => void;
        const firstLoadStarted = new Promise<void>((resolve) => {
            firstLoadFinished = resolve;
        });
        const contextIds = new WeakMap<TokenCacheContext, number>();
        const changes: boolean[] = [];
        let load = 0;
        const plugin: ICachePlugin = {
            beforeCacheAccess: async (context: TokenCacheContext) => {
                const id = load++;
                contextIds.set(context, id);
                context.tokenCache.deserialize(snapshots[id]);
                if (id === 0) {
                    firstLoadFinished();
                    await secondLoadFinished;
                } else {
                    releaseFirstLoad();
                }
            },
            afterCacheAccess: async (context: TokenCacheContext) => {
                const id = contextIds.get(context);
                changes[id as number] = context.cacheHasChanged;
                if (id === 0 && context.cacheHasChanged) {
                    context.tokenCache.serialize();
                }
            },
        };
        const tokenCache = new TokenCache(createStorage(2), logger, plugin);

        const firstAccess = tokenCache.getAllAccounts();
        await firstLoadStarted;
        const secondAccess = tokenCache.getAllAccounts();
        await Promise.all([firstAccess, secondAccess]);

        expect(changes[0]).toBe(true);
        expect(serializeSpy).toHaveBeenCalledTimes(1);
    });
});
