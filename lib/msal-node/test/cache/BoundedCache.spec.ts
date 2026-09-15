/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AccountEntity,
    AccountEntityUtils,
    CacheManager,
    ClientConfiguration,
    CommonSilentFlowRequest,
    IdTokenEntity,
    Logger,
    LogLevel,
    RefreshTokenEntity,
    SilentFlowClient,
    StubPerformanceClient,
} from "@azure/msal-common";
import { NodeStorage } from "../../src/cache/NodeStorage.js";
import { TokenCache } from "../../src/cache/TokenCache.js";
import { InMemoryCacheOptions } from "../../src/config/Configuration.js";
import { Serializer } from "../../src/cache/serializer/Serializer.js";
import {
    CacheKVStore,
    InMemoryCache,
} from "../../src/cache/serializer/SerializerTypes.js";
import {
    DEFAULT_CRYPTO_IMPLEMENTATION,
    TEST_CONSTANTS,
} from "../utils/TestConstants.js";
import { name, version } from "../../package.json";
import { ConfidentialClientApplication } from "../../src/index.js";
import { ClientCredentialClient } from "../../src/client/ClientCredentialClient.js";
import { OnBehalfOfClient } from "../../src/client/OnBehalfOfClient.js";
import { ClientTestUtils } from "../client/ClientTestUtils.js";
import {
    AUTHENTICATION_RESULT,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants.js";
import { mockNetworkClient } from "../utils/MockNetworkClient.js";
import { CommonClientCredentialRequest } from "../../src/request/CommonClientCredentialRequest.js";
import { CommonOnBehalfOfRequest } from "../../src/request/CommonOnBehalfOfRequest.js";

const NOW_SECONDS = 2_000_000_000;

describe("Bounded NodeStorage", () => {
    let logger: Logger;

    beforeEach(() => {
        jest.spyOn(Date, "now").mockReturnValue(NOW_SECONDS * 1000);
        logger = new Logger(
            {
                loggerCallback: jest.fn(),
                piiLoggingEnabled: false,
                logLevel: LogLevel.Verbose,
            },
            name,
            version
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function createStorage(
        options?: InMemoryCacheOptions,
        configuredLogger: Logger = logger
    ): NodeStorage {
        return new NodeStorage(
            configuredLogger,
            TEST_CONSTANTS.CLIENT_ID,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            undefined,
            options
        );
    }

    function createBoundedStorage(
        maxEntries: number,
        configuredLogger: Logger = logger
    ): NodeStorage {
        return createStorage(
            { evictionEnabled: true, maxEntries },
            configuredLogger
        );
    }

    function createAccessToken(
        id: string,
        overrides: Partial<AccessTokenEntity> = {}
    ): AccessTokenEntity {
        return {
            homeAccountId: `home-${id}`,
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            clientId: TEST_CONSTANTS.CLIENT_ID,
            secret: `access-token-${id}`,
            realm: "tenant",
            target: `scope-${id}`,
            cachedAt: (NOW_SECONDS - 60).toString(),
            expiresOn: (NOW_SECONDS + 3600).toString(),
            extendedExpiresOn: (NOW_SECONDS + 7200).toString(),
            lastUpdatedAt: Date.now().toString(),
            ...overrides,
        };
    }

    function createIdToken(
        id: string,
        overrides: Partial<IdTokenEntity> = {}
    ): IdTokenEntity {
        return {
            homeAccountId: `home-${id}`,
            environment: "login.microsoftonline.com",
            credentialType: "IdToken",
            clientId: TEST_CONSTANTS.CLIENT_ID,
            secret: `id-token-${id}`,
            realm: "tenant",
            lastUpdatedAt: Date.now().toString(),
            ...overrides,
        };
    }

    function createRefreshToken(
        id: string,
        overrides: Partial<RefreshTokenEntity> = {}
    ): RefreshTokenEntity {
        return {
            homeAccountId: `home-${id}`,
            environment: "login.microsoftonline.com",
            credentialType: "RefreshToken",
            clientId: TEST_CONSTANTS.CLIENT_ID,
            secret: `refresh-token-${id}`,
            lastUpdatedAt: Date.now().toString(),
            ...overrides,
        };
    }

    function createAccount(
        id: string,
        overrides: Partial<AccountEntity> = {}
    ): AccountEntity {
        return CacheManager.toObject({} as AccountEntity, {
            homeAccountId: `home-${id}`,
            environment: "login.microsoftonline.com",
            realm: "tenant",
            localAccountId: `local-${id}`,
            username: `${id}@contoso.com`,
            authorityType: "MSSTS",
            clientInfo: "client-info",
            ...overrides,
        });
    }

    function tokenCount(storage: NodeStorage): number {
        const keys = storage.getTokenKeys();
        return (
            keys.accessToken.length +
            keys.idToken.length +
            keys.refreshToken.length
        );
    }

    function accountKey(storage: NodeStorage, account: AccountEntity): string {
        return storage.generateAccountKey(
            AccountEntityUtils.getAccountInfo(account)
        );
    }

    function serializeCache(
        storage: NodeStorage,
        {
            accounts = [],
            idTokens = [],
            accessTokens = [],
            refreshTokens = [],
            appMetadata = {},
        }: {
            accounts?: AccountEntity[];
            idTokens?: IdTokenEntity[];
            accessTokens?: AccessTokenEntity[];
            refreshTokens?: RefreshTokenEntity[];
            appMetadata?: InMemoryCache["appMetadata"];
        }
    ): string {
        return JSON.stringify(
            Serializer.serializeAllCache({
                accounts: Object.fromEntries(
                    accounts.map((account) => [
                        accountKey(storage, account),
                        account,
                    ])
                ),
                idTokens: Object.fromEntries(
                    idTokens.map((token) => [
                        storage.generateCredentialKey(token),
                        token,
                    ])
                ),
                accessTokens: Object.fromEntries(
                    accessTokens.map((token) => [
                        storage.generateCredentialKey(token),
                        token,
                    ])
                ),
                refreshTokens: Object.fromEntries(
                    refreshTokens.map((token) => [
                        storage.generateCredentialKey(token),
                        token,
                    ])
                ),
                appMetadata,
            })
        );
    }

    it.each([
        ["omitted", undefined],
        ["disabled without maxEntries", { evictionEnabled: false }],
        ["disabled with maxEntries", { evictionEnabled: false, maxEntries: 1 }],
        ["maxEntries without enablement", { maxEntries: 1 }],
    ] satisfies Array<[string, InMemoryCacheOptions | undefined]>)(
        "preserves unbounded behavior when configuration is %s",
        async (_name, options) => {
            const storage = createStorage(options);

            await storage.setAccessTokenCredential(
                createAccessToken("one"),
                "",
                false
            );
            await storage.setAccessTokenCredential(
                createAccessToken("two"),
                "",
                false
            );

            expect(tokenCount(storage)).toBe(2);
        }
    );

    it("preserves the legacy single change notification for unbounded writes", async () => {
        const storage = createStorage();
        const changeEmitter = jest.fn();
        storage.registerChangeEmitter(changeEmitter);

        await storage.setAccessTokenCredential(
            createAccessToken("unbounded"),
            "",
            false
        );

        expect(changeEmitter).toHaveBeenCalledTimes(1);
    });

    it("prunes expired and clock-invalid tokens before valid oldest entries", () => {
        const storage = createBoundedStorage(2);
        const oldestValid = createAccessToken("oldest-valid");
        const valid = createAccessToken("valid", {
            refreshOn: (NOW_SECONDS - 1).toString(),
        });
        const newestValid = createIdToken("newest-valid");
        const expired = createAccessToken("expired", {
            expiresOn: (NOW_SECONDS - 1).toString(),
            extendedExpiresOn: (NOW_SECONDS + 3600).toString(),
        });
        const clockInvalid = createAccessToken("clock-invalid", {
            cachedAt: (NOW_SECONDS + 1).toString(),
        });
        const expiredRefresh = createRefreshToken("expired-refresh", {
            expiresOn: (NOW_SECONDS - 1).toString(),
        });

        storage.setCache({
            [storage.generateCredentialKey(oldestValid)]: oldestValid,
            [storage.generateCredentialKey(expired)]: expired,
            [storage.generateCredentialKey(valid)]: valid,
            [storage.generateCredentialKey(clockInvalid)]: clockInvalid,
            [storage.generateCredentialKey(expiredRefresh)]: expiredRefresh,
            [storage.generateCredentialKey(newestValid)]: newestValid,
        });

        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(valid)
            )
        ).toEqual(valid);
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(expired)
            )
        ).toBeNull();
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(clockInvalid)
            )
        ).toBeNull();
        expect(
            storage.getRefreshTokenCredential(
                storage.generateCredentialKey(expiredRefresh)
            )
        ).toBeNull();
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(oldestValid)
            )
        ).toBeNull();
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(valid)
            )
        ).toEqual(valid);
        expect(
            storage.getIdTokenCredential(
                storage.generateCredentialKey(newestValid)
            )
        ).toEqual(newestValid);
        expect(tokenCount(storage)).toBe(2);
    });

    it("does not change oldest-write order for typed hits, misses, or non-token reads", async () => {
        const storage = createBoundedStorage(2);
        const oldest = createRefreshToken("oldest");
        const newer = createAccessToken("newer");
        const account = createAccount("account");

        await storage.setRefreshTokenCredential(oldest);
        await storage.setAccessTokenCredential(newer, "", false);
        await storage.setAccount(account);

        expect(
            storage.getRefreshTokenCredential(
                storage.generateCredentialKey(oldest)
            )
        ).toEqual(oldest);
        expect(storage.getAccessTokenCredential("missing")).toBeNull();
        expect(storage.getIdTokenCredential("missing")).toBeNull();
        expect(storage.getRefreshTokenCredential("missing")).toBeNull();
        expect(storage.getAccount(accountKey(storage, account))).toEqual(
            account
        );
        storage.getTokenKeys();

        await storage.setAccessTokenCredential(
            createAccessToken("replacement"),
            "",
            false
        );

        expect(
            storage.getRefreshTokenCredential(
                storage.generateCredentialKey(oldest)
            )
        ).toBeNull();
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(newer)
            )
        ).toEqual(newer);
    });

    it.each([
        ["disabled", undefined],
        ["enabled", { evictionEnabled: true, maxEntries: 2 }],
    ] satisfies Array<[string, InMemoryCacheOptions | undefined]>)(
        "does not dirty serializable state, emit changes, or invoke plugins when selected-hit tracking is %s",
        async (_name, options) => {
            const storage = createStorage(options);
            const cachePlugin = {
                beforeCacheAccess: jest.fn(),
                afterCacheAccess: jest.fn(),
            };
            const tokenCache = new TokenCache(storage, logger, cachePlugin);
            const changeEmitter = jest.fn();
            const accessToken = createAccessToken("selected");

            storage.registerChangeEmitter(changeEmitter);
            await storage.setAccessTokenCredential(accessToken, "", false);
            tokenCache.serialize();
            changeEmitter.mockClear();
            const cacheBeforeHit = { ...storage.getCache() };
            const writeSequenceBeforeHit = (
                storage as unknown as { writeSequence: number }
            ).writeSequence;

            storage.updateAccessTokenLastAccessed(accessToken);

            expect(storage.getCache()).toEqual(cacheBeforeHit);
            expect(changeEmitter).not.toHaveBeenCalled();
            expect(tokenCache.hasChanged()).toBe(false);
            expect(cachePlugin.beforeCacheAccess).not.toHaveBeenCalled();
            expect(cachePlugin.afterCacheAccess).not.toHaveBeenCalled();
            expect(
                (storage as unknown as { writeSequence: number }).writeSequence
            ).toBe(
                options?.evictionEnabled
                    ? writeSequenceBeforeHit + 1
                    : writeSequenceBeforeHit
            );
        }
    );

    describe("selected access-token hit recency", () => {
        async function createClientConfiguration(
            storage: NodeStorage
        ): Promise<ClientConfiguration> {
            const clientConfiguration =
                await ClientTestUtils.createTestClientConfiguration(
                    undefined,
                    mockNetworkClient(
                        DEFAULT_OPENID_CONFIG_RESPONSE.body,
                        AUTHENTICATION_RESULT
                    )
                );
            clientConfiguration.storageInterface = storage;
            return clientConfiguration;
        }

        function createClientStorage(clientId: string): NodeStorage {
            return new NodeStorage(
                logger,
                clientId,
                DEFAULT_CRYPTO_IMPLEMENTATION,
                undefined,
                {
                    evictionEnabled: true,
                    maxEntries: 2,
                }
            );
        }

        async function expectSelectedTokenToSurviveNextEviction(
            storage: NodeStorage,
            selectedToken: AccessTokenEntity,
            unselectedToken: AccessTokenEntity,
            acquireFromCache: () => Promise<unknown>,
            selectedTokenHash?: string
        ): Promise<void> {
            await storage.setAccessTokenCredential(
                selectedToken,
                "",
                false,
                selectedTokenHash
            );
            await storage.setAccessTokenCredential(unselectedToken, "", false);

            await acquireFromCache();
            await storage.setAccessTokenCredential(
                createAccessToken("replacement", {
                    homeAccountId: "",
                    clientId: selectedToken.clientId,
                    environment: selectedToken.environment,
                    realm: selectedToken.realm,
                    target: "api://replacement/.default",
                }),
                "",
                false
            );

            expect(
                storage.getAccessTokenCredential(
                    storage.generateCredentialKey(
                        selectedToken,
                        selectedTokenHash
                    )
                )
            ).toEqual(selectedToken);
            expect(
                storage.getAccessTokenCredential(
                    storage.generateCredentialKey(unselectedToken)
                )
            ).toBeNull();
        }

        it("refreshes eviction order after a successful silent cache response", async () => {
            const storage = createClientStorage(TEST_CONFIG.MSAL_CLIENT_ID);
            const clientConfiguration = await createClientConfiguration(
                storage
            );
            const account = createAccount("silent", {
                environment:
                    clientConfiguration.authOptions.authority
                        .canonicalAuthorityUrlComponents.HostNameAndPort,
                realm: clientConfiguration.authOptions.authority.tenant,
            });
            const accountInfo = AccountEntityUtils.getAccountInfo(account);
            const selectedToken = createAccessToken("silent-selected", {
                homeAccountId: account.homeAccountId,
                environment: account.environment,
                clientId: clientConfiguration.authOptions.clientId,
                realm: account.realm,
                target: TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
            });
            const unselectedToken = createAccessToken("silent-unselected", {
                homeAccountId: account.homeAccountId,
                environment: account.environment,
                clientId: clientConfiguration.authOptions.clientId,
                realm: account.realm,
                target: "api://unselected/.default",
            });
            const request: CommonSilentFlowRequest = {
                account: accountInfo,
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                forceRefresh: false,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };
            const client = new SilentFlowClient(
                clientConfiguration,
                new StubPerformanceClient()
            );

            await storage.setAccount(account);
            await expectSelectedTokenToSurviveNextEviction(
                storage,
                selectedToken,
                unselectedToken,
                async () => client.acquireCachedToken(request)
            );
        });

        it("refreshes eviction order after a successful client-credential cache response", async () => {
            const storage = createClientStorage(TEST_CONFIG.MSAL_CLIENT_ID);
            const clientConfiguration = await createClientConfiguration(
                storage
            );
            const additionalCacheKeyComponents = {
                fmi_path: "agent-a",
            };
            const selectedTokenHash =
                await clientConfiguration.cryptoInterface.hashString(
                    JSON.stringify(additionalCacheKeyComponents)
                );
            const selectedToken = createAccessToken(
                "client-credential-selected",
                {
                    homeAccountId: "",
                    environment:
                        clientConfiguration.authOptions.authority
                            .canonicalAuthorityUrlComponents.HostNameAndPort,
                    clientId: clientConfiguration.authOptions.clientId,
                    realm: clientConfiguration.authOptions.authority.tenant,
                    target: TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
                    additionalCacheKeyComponents,
                }
            );
            const unselectedToken = createAccessToken(
                "client-credential-unselected",
                {
                    homeAccountId: "",
                    environment: selectedToken.environment,
                    clientId: selectedToken.clientId,
                    realm: selectedToken.realm,
                    target: "api://unselected/.default",
                }
            );
            const request: CommonClientCredentialRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                fmiPath: additionalCacheKeyComponents.fmi_path,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            };
            const client = new ClientCredentialClient(clientConfiguration);

            await expectSelectedTokenToSurviveNextEviction(
                storage,
                selectedToken,
                unselectedToken,
                async () => client.acquireToken(request),
                selectedTokenHash
            );
        });

        it("refreshes eviction order after a successful OBO cache response", async () => {
            const storage = createClientStorage(TEST_CONFIG.MSAL_CLIENT_ID);
            const clientConfiguration = await createClientConfiguration(
                storage
            );
            const oboAssertion = "obo-assertion";
            const userAssertionHash =
                await clientConfiguration.cryptoInterface.hashString(
                    oboAssertion
                );
            const selectedToken = createAccessToken("obo-selected", {
                clientId: clientConfiguration.authOptions.clientId,
                target: TEST_CONFIG.DEFAULT_GRAPH_SCOPE.join(" "),
                userAssertionHash,
            });
            const unselectedToken = createAccessToken("obo-unselected", {
                clientId: selectedToken.clientId,
                target: "api://unselected/.default",
                userAssertionHash,
            });
            const request: CommonOnBehalfOfRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: TEST_CONFIG.CORRELATION_ID,
                oboAssertion,
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                skipCache: false,
            };
            const client = new OnBehalfOfClient(clientConfiguration);

            await expectSelectedTokenToSurviveNextEviction(
                storage,
                selectedToken,
                unselectedToken,
                async () => client.acquireToken(request)
            );
        });
    });

    it("compacts write order before the monotonic sequence exceeds safe integers", async () => {
        const storage = createBoundedStorage(2);
        const first = createAccessToken("first");
        const second = createAccessToken("second");
        const internalStorage = storage as unknown as {
            writeSequence: number;
        };

        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);
        internalStorage.writeSequence = Number.MAX_SAFE_INTEGER;

        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(
            createAccessToken("replacement"),
            "",
            false
        );

        expect(internalStorage.writeSequence).toBeLessThan(
            Number.MAX_SAFE_INTEGER
        );
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(second)
            )
        ).toBeNull();
    });

    it("cleans removed-key write order before a token is reinserted", async () => {
        const storage = createBoundedStorage(2);
        const first = createAccessToken("first");
        const second = createAccessToken("second");
        const third = createAccessToken("third");
        const firstKey = storage.generateCredentialKey(first);

        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);
        expect(storage.removeItem(firstKey)).toBe(true);
        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(third, "", false);

        expect(storage.getAccessTokenCredential(firstKey)).toEqual(first);
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(second)
            )
        ).toBeNull();
    });

    it("does not expose a mutable cache map that can bypass the bound", () => {
        const storage = createBoundedStorage(1);
        const suppliedCache: CacheKVStore = {};
        storage.setCache(suppliedCache);

        suppliedCache.external = createAccessToken("external");
        storage.getCache()["another-external"] =
            createAccessToken("another-external");

        expect(tokenCount(storage)).toBe(0);
    });

    it("bounds bulk hydration and preserves eviction in serialization", () => {
        const storage = createBoundedStorage(2);
        const tokenCache = new TokenCache(storage, logger);
        const accessTokens = ["one", "two", "three"].map((id) =>
            createAccessToken(id)
        );

        tokenCache.deserialize(serializeCache(storage, { accessTokens }));

        expect(tokenCount(storage)).toBe(2);
        const serialized = JSON.parse(tokenCache.serialize());
        expect(Object.keys(serialized.AccessToken)).toHaveLength(2);
        expect(
            serialized.AccessToken[
                storage.generateCredentialKey(accessTokens[0])
            ]
        ).toBeUndefined();

        const rehydratedStorage = createBoundedStorage(2);
        new TokenCache(rehydratedStorage, logger).deserialize(
            JSON.stringify(serialized)
        );
        expect(tokenCount(rehydratedStorage)).toBe(2);
    });

    it("does not treat nonserialized refresh-token expiry as persisted state", () => {
        const sourceStorage = createStorage();
        const expiredRefreshToken = createRefreshToken("expired", {
            expiresOn: (NOW_SECONDS - 1).toString(),
        });
        const serialized = serializeCache(sourceStorage, {
            refreshTokens: [expiredRefreshToken],
        });
        const storage = createBoundedStorage(1);

        new TokenCache(storage, logger).deserialize(serialized);

        expect(
            storage.getRefreshTokenCredential(
                storage.generateCredentialKey(expiredRefreshToken)
            )
        ).not.toBeNull();
    });

    it("replaces a previously hydrated cache partition", () => {
        const storage = createBoundedStorage(2);
        const tokenCache = new TokenCache(storage, logger);
        const firstPartitionToken = createAccessToken("first-partition");
        const secondPartitionToken = createAccessToken("second-partition");
        const serializeToken = (token: AccessTokenEntity) =>
            serializeCache(storage, { accessTokens: [token] });

        tokenCache.deserialize(serializeToken(firstPartitionToken));
        tokenCache.deserialize(serializeToken(secondPartitionToken));

        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(firstPartitionToken)
            )
        ).toBeNull();
        expect(
            storage.getAccessTokenCredential(
                storage.generateCredentialKey(secondPartitionToken)
            )
        ).toEqual(secondPartitionToken);
        expect(
            Object.keys(JSON.parse(tokenCache.serialize()).AccessToken)
        ).toEqual([storage.generateCredentialKey(secondPartitionToken)]);
    });

    it("clears serializable state when a bounded persistent partition is empty", () => {
        const storage = createBoundedStorage(2);
        const tokenCache = new TokenCache(storage, logger);
        const token = createAccessToken("populated-partition");

        tokenCache.deserialize(
            serializeCache(storage, { accessTokens: [token] })
        );
        tokenCache.deserialize("");

        expect(tokenCount(storage)).toBe(0);
        expect(JSON.parse(tokenCache.serialize()).AccessToken).toEqual({});
    });

    it("preserves legacy deserialize merging when bounding is disabled", () => {
        const storage = createStorage();
        const tokenCache = new TokenCache(storage, logger);
        const first = createAccessToken("first");
        const second = createAccessToken("second");
        const serializeToken = (token: AccessTokenEntity) =>
            serializeCache(storage, { accessTokens: [token] });

        tokenCache.deserialize(serializeToken(first));
        tokenCache.deserialize(serializeToken(second));
        tokenCache.deserialize("");

        expect(tokenCount(storage)).toBe(2);
    });

    it("wires bounded cache options through ConfidentialClientApplication", () => {
        const client = new ConfidentialClientApplication({
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                clientSecret: TEST_CONSTANTS.CLIENT_SECRET,
            },
            cache: {
                inMemoryCache: {
                    evictionEnabled: true,
                    maxEntries: 1,
                },
            },
        });
        const tokenCache = client.getTokenCache();
        const storage = createStorage();
        const tokens = ["one", "two"].map((id) => createAccessToken(id));
        tokenCache.deserialize(
            serializeCache(storage, { accessTokens: tokens })
        );

        expect(
            Object.keys(JSON.parse(tokenCache.serialize()).AccessToken)
        ).toHaveLength(1);
    });

    it.each([1, 2])(
        "keeps each sequential token-family write within maxEntries %i",
        async (maxEntries) => {
            const storage = createBoundedStorage(maxEntries);
            const tokenCache = new TokenCache(storage, logger);
            const account = createAccount("family");
            const idToken = createIdToken("family");
            const accessToken = createAccessToken("family");
            const refreshToken = createRefreshToken("family", {
                familyId: "1",
            });

            await storage.setAccount(account);
            await storage.setIdTokenCredential(idToken);
            expect(tokenCount(storage)).toBeLessThanOrEqual(maxEntries);
            expect(storage.getAccount(accountKey(storage, account))).toEqual(
                account
            );

            await storage.setAccessTokenCredential(accessToken, "", false);
            expect(tokenCount(storage)).toBeLessThanOrEqual(maxEntries);
            expect(storage.getAccount(accountKey(storage, account))).toEqual(
                account
            );

            await storage.setRefreshTokenCredential(refreshToken);
            expect(tokenCount(storage)).toBeLessThanOrEqual(maxEntries);
            expect(storage.getAccount(accountKey(storage, account))).toEqual(
                account
            );

            const retainedKeys = storage.getTokenKeys();
            [
                ...retainedKeys.idToken,
                ...retainedKeys.accessToken,
                ...retainedKeys.refreshToken,
            ].forEach((key) => {
                expect(storage.getItem(key)).toBeDefined();
            });
            expect(JSON.parse(tokenCache.serialize())).toEqual(
                Serializer.serializeAllCache(storage.getInMemoryCache())
            );
        }
    );

    it("resets write order on overwrite and stays bounded across repeated deserialization", async () => {
        const storage = createBoundedStorage(2);
        const first = createAccessToken("first");
        const second = createAccessToken("second");
        const replacement = createAccessToken("replacement");
        const newest = createAccessToken("newest");
        const firstKey = storage.generateCredentialKey(first);

        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);
        storage.setCache({
            [firstKey]: first,
            [storage.generateCredentialKey(replacement)]: replacement,
        });
        await storage.setAccessTokenCredential(newest, "", false);

        expect(storage.getAccessTokenCredential(firstKey)).toBeNull();
        expect(tokenCount(storage)).toBe(2);

        const tokenCache = new TokenCache(storage, logger);
        const serialized = tokenCache.serialize();
        tokenCache.deserialize(serialized);
        tokenCache.deserialize(serialized);

        expect(tokenCount(storage)).toBe(2);
    });

    it("enforces the bound after persistent-cache overwrite", async () => {
        const storage = createBoundedStorage(2);
        const accessTokens = ["one", "two", "three"].map((id) =>
            createAccessToken(id)
        );
        const persistedCache = serializeCache(storage, { accessTokens });
        let persistedAfterOverwrite = "";
        const tokenCache = new TokenCache(storage, logger, {
            beforeCacheAccess: async (context) => {
                context.tokenCache.deserialize(persistedCache);
            },
            afterCacheAccess: async (context) => {
                persistedAfterOverwrite = context.tokenCache.serialize();
            },
        });

        await tokenCache.overwriteCache();

        expect(tokenCount(storage)).toBe(2);
        expect(
            Object.keys(JSON.parse(persistedAfterOverwrite).AccessToken)
        ).toHaveLength(2);
    });

    it("retains an account while any resource token remains and removes it after the final related token is evicted", async () => {
        const storage = createBoundedStorage(2);
        const account = createAccount("user");
        const firstResource = createAccessToken("resource-one", {
            homeAccountId: account.homeAccountId,
        });
        const secondResource = createAccessToken("resource-two", {
            homeAccountId: account.homeAccountId,
        });

        await storage.setAccount(account);
        await storage.setAccessTokenCredential(firstResource, "", false);
        await storage.setAccessTokenCredential(secondResource, "", false);
        await storage.setAccessTokenCredential(
            createAccessToken("app-one", { homeAccountId: "" }),
            "",
            false
        );

        expect(storage.getAccount(accountKey(storage, account))).toEqual(
            account
        );

        await storage.setAccessTokenCredential(
            createAccessToken("app-two", { homeAccountId: "" }),
            "",
            false
        );

        expect(storage.getAccount(accountKey(storage, account))).toBeNull();
    });

    it("only removes the account whose final token was evicted", async () => {
        const storage = createBoundedStorage(2);
        const firstAccount = createAccount("first");
        const secondAccount = createAccount("second");

        await storage.setAccount(firstAccount);
        await storage.setAccount(secondAccount);
        await storage.setIdTokenCredential(
            createIdToken("first", {
                homeAccountId: firstAccount.homeAccountId,
            })
        );
        await storage.setIdTokenCredential(
            createIdToken("second", {
                homeAccountId: secondAccount.homeAccountId,
            })
        );
        await storage.setAccessTokenCredential(
            createAccessToken("app", { homeAccountId: "" }),
            "",
            false
        );

        expect(
            storage.getAccount(accountKey(storage, firstAccount))
        ).toBeNull();
        expect(storage.getAccount(accountKey(storage, secondAccount))).toEqual(
            secondAccount
        );
    });

    it("retains unrelated accounts and app metadata for OBO and app-token eviction", async () => {
        const storage = createBoundedStorage(1);
        const unrelatedAccount = createAccount("unrelated");
        const oboAccount = createAccount("obo");
        const refreshToken = createRefreshToken("obo", {
            homeAccountId: oboAccount.homeAccountId,
            userAssertionHash: "obo-assertion-hash",
        });

        await storage.setAccount(unrelatedAccount);
        await storage.setAccount(oboAccount);
        storage.setAppMetadata({
            clientId: TEST_CONSTANTS.CLIENT_ID,
            environment: "login.microsoftonline.com",
            familyId: "1",
        });
        await storage.setRefreshTokenCredential(refreshToken);
        await storage.setAccessTokenCredential(
            createAccessToken("app", { homeAccountId: "" }),
            "",
            false
        );

        expect(
            storage.getAccount(accountKey(storage, unrelatedAccount))
        ).toEqual(unrelatedAccount);
        expect(storage.getAccount(accountKey(storage, oboAccount))).toBeNull();
        expect(storage.getInMemoryCache().appMetadata).not.toEqual({});
        expect(
            storage.getRefreshTokenCredential(
                storage.generateCredentialKey(refreshToken)
            )
        ).toBeNull();
    });

    it("isolates account cleanup by environment and conservatively retains tenant and client profiles", async () => {
        const storage = createBoundedStorage(1);
        const sharedHomeAccountId = "shared-home";
        const firstEnvironmentAccount = createAccount("first-environment", {
            homeAccountId: sharedHomeAccountId,
            environment: "login.microsoftonline.com",
            realm: "tenant-one",
        });
        const secondEnvironmentAccount = createAccount("second-environment", {
            homeAccountId: sharedHomeAccountId,
            environment: "login.partner.microsoftonline.cn",
            realm: "tenant-two",
        });

        await storage.setAccount(firstEnvironmentAccount);
        await storage.setAccount(secondEnvironmentAccount);
        await storage.setAccessTokenCredential(
            createAccessToken("first-environment", {
                homeAccountId: sharedHomeAccountId,
                environment: firstEnvironmentAccount.environment,
                realm: firstEnvironmentAccount.realm,
            }),
            "",
            false
        );
        await storage.setAccessTokenCredential(
            createAccessToken("second-environment", {
                homeAccountId: sharedHomeAccountId,
                environment: secondEnvironmentAccount.environment,
                realm: secondEnvironmentAccount.realm,
            }),
            "",
            false
        );

        expect(
            storage.getAccount(accountKey(storage, firstEnvironmentAccount))
        ).toBeNull();
        expect(
            storage.getAccount(accountKey(storage, secondEnvironmentAccount))
        ).toEqual(secondEnvironmentAccount);

        const firstRealmAccount = createAccount("first-realm", {
            homeAccountId: sharedHomeAccountId,
            environment: secondEnvironmentAccount.environment,
            realm: "tenant-one",
        });
        await storage.setAccount(firstRealmAccount);
        await storage.setAccessTokenCredential(
            createAccessToken("other-client-and-realm", {
                homeAccountId: sharedHomeAccountId,
                environment: secondEnvironmentAccount.environment,
                realm: "tenant-three",
                clientId: "other-client",
            }),
            "",
            false
        );

        expect(
            storage.getAccount(accountKey(storage, firstRealmAccount))
        ).toEqual(firstRealmAccount);
        expect(
            storage.getAccount(accountKey(storage, secondEnvironmentAccount))
        ).toEqual(secondEnvironmentAccount);

        await storage.setAccessTokenCredential(
            createAccessToken("app", { homeAccountId: "" }),
            "",
            false
        );

        expect(
            storage.getAccount(accountKey(storage, firstRealmAccount))
        ).toBeNull();
        expect(
            storage.getAccount(accountKey(storage, secondEnvironmentAccount))
        ).toBeNull();
    });

    it("never exceeds capacity after concurrently scheduled writes", async () => {
        const storage = createBoundedStorage(5);

        await Promise.all(
            Array.from({ length: 20 }, (_, index) =>
                storage.setAccessTokenCredential(
                    createAccessToken(index.toString(), {
                        homeAccountId: "",
                    }),
                    "",
                    false
                )
            )
        );

        expect(tokenCount(storage)).toBe(5);
    });

    it("logs eviction counts without cache keys or token contents", async () => {
        const loggerCallback = jest.fn();
        const configuredLogger = new Logger(
            {
                loggerCallback,
                piiLoggingEnabled: false,
                logLevel: LogLevel.Verbose,
            },
            name,
            version
        );
        const storage = createBoundedStorage(1, configuredLogger);
        const first = createAccessToken("sensitive-first");
        const second = createAccessToken("sensitive-second");
        const expiredAccount = createAccount("expired");
        const expired = createAccessToken("expired", {
            homeAccountId: expiredAccount.homeAccountId,
            expiresOn: (NOW_SECONDS - 1).toString(),
        });

        await storage.setAccessTokenCredential(first, "", false);
        await storage.setAccessTokenCredential(second, "", false);
        storage.setCache({
            [accountKey(storage, expiredAccount)]: expiredAccount,
            [storage.generateCredentialKey(expired)]: expired,
        });

        const logMessages = loggerCallback.mock.calls
            .map((call) => call[1] as string)
            .join("\n");
        expect(logMessages).toContain("evicted 1 oldest token cache entries");
        expect(logMessages).toContain("pruned 1 expired token cache entries");
        expect(logMessages).toContain(
            "removed 1 orphaned account cache entries"
        );
        expect(logMessages).not.toContain(first.secret);
        expect(logMessages).not.toContain(storage.generateCredentialKey(first));
    });
});
