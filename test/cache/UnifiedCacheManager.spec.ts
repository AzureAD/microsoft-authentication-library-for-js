import { expect } from "chai";
import { UnifiedCacheManager } from "../../src/cache/UnifiedCacheManager";
import { mockCache } from "./entities/cacheConstants";
import { InMemoryCache, CredentialFilter, AccountFilter} from "../../src/cache/utils/CacheTypes";
import { ICacheStorage } from "../../src/cache/interface/ICacheStorage";
import { Deserializer } from "../../src/cache/serialize/Deserializer";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { CacheSchemaType, CacheHelper, CredentialType } from "../../src";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity";

const cacheJson = require("./serialize/cache.json");

describe("UnifiedCacheManager test cases", () => {
    let store = {};
    let storageInterface: ICacheStorage;
    const cache = JSON.stringify(cacheJson);
    const inMemCache: InMemoryCache = Deserializer.deserializeAllCache(
        Deserializer.deserializeJSONBlob(cache)
    );

    beforeEach(() => {
        storageInterface = {
            getCache(): InMemoryCache {
                return inMemCache;
            },
            setCache(inMemCache): void {
                this.inMemCache = inMemCache;
            },
            setItem(
                key: string,
                value: string | object,
                type?: string,
                inMemory?: boolean
            ): void {
                // read inMemoryCache
                const cache = this.getCache() as InMemoryCache;

                // save the cacheItem
                switch (type) {
                    case CacheSchemaType.ACCOUNT: {
                        cache.accounts[key] = value as AccountEntity;
                        break;
                    }
                    case CacheSchemaType.CREDENTIAL: {
                        const credentialType = CacheHelper.getCredentialType(
                            key
                        );
                        switch (credentialType) {
                            case CredentialType.ID_TOKEN: {
                                cache.idTokens[key] = value as IdTokenEntity;
                                break;
                            }
                            case CredentialType.ACCESS_TOKEN: {
                                cache.accessTokens[
                                    key
                                ] = value as AccessTokenEntity;
                                break;
                            }
                            case CredentialType.REFRESH_TOKEN: {
                                cache.refreshTokens[
                                    key
                                ] = value as RefreshTokenEntity;
                                break;
                            }
                        }
                        break;
                    }
                    case CacheSchemaType.APP_META_DATA: {
                        cache.appMetadata[key] = value as AppMetadataEntity;
                        break;
                    }
                    default: {
                        console.log("Invalid Cache Type");
                        return;
                    }
                }

                // update inMemoryCache
                this.setCache(cache);
            },
            getItem(
                key: string,
                type?: string,
                inMemory?: boolean
            ): string | object {

                // read inMemoryCache
                const cache = this.getCache() as InMemoryCache;

                // save the cacheItem
                switch (type!) {
                    case CacheSchemaType.ACCOUNT: {
                        return (cache.accounts[key] as AccountEntity) || null;
                    }
                    case CacheSchemaType.CREDENTIAL: {
                        const credentialType = CacheHelper.getCredentialType(
                            key
                        );
                        let credential = null;
                        switch (credentialType) {
                            case CredentialType.ID_TOKEN: {
                                credential =
                                    (cache.idTokens[key] as IdTokenEntity) ||
                                    null;
                                break;
                            }
                            case CredentialType.ACCESS_TOKEN: {
                                credential =
                                    (cache.accessTokens[
                                        key
                                    ] as AccessTokenEntity) || null;
                                break;
                            }
                            case CredentialType.REFRESH_TOKEN: {
                                credential =
                                    (cache.refreshTokens[
                                        key
                                    ] as RefreshTokenEntity) || null;
                                break;
                            }
                        }
                        return credential!;
                    }
                    case CacheSchemaType.APP_META_DATA: {
                        return (
                            (cache.appMetadata[key] as AppMetadataEntity) ||
                            null
                        );
                    }
                    default: {
                        console.log("Invalid Cache Type");
                        return {};
                    }
                }
            },
            removeItem(
                key: string,
                type?: string,
                inMemory?: boolean
            ): boolean {
                // read inMemoryCache
                const cache = this.getCache() as InMemoryCache;
                let result: boolean = false;

                // save the cacheItem
                switch (type) {
                    case CacheSchemaType.ACCOUNT: {
                        if (!!cache.accounts[key]) {
                            delete cache.accounts[key];
                            result = true;
                        }
                        break;
                    }
                    case CacheSchemaType.CREDENTIAL: {
                        const credentialType = CacheHelper.getCredentialType(
                            key
                        );
                        switch (credentialType) {
                            case CredentialType.ID_TOKEN: {
                                if (!!cache.idTokens[key]) {
                                    delete cache.idTokens[key];
                                    result = true;
                                }
                                break;
                            }
                            case CredentialType.ACCESS_TOKEN: {
                                if (!!cache.accessTokens[key]) {
                                    delete cache.accessTokens[key];
                                    result = true;
                                }
                                break;
                            }
                            case CredentialType.REFRESH_TOKEN: {
                                if (!!cache.refreshTokens[key]) {
                                    delete cache.refreshTokens[key];
                                    result = true;
                                }
                                break;
                            }
                        }
                        break;
                    }
                    case CacheSchemaType.APP_META_DATA: {
                        if (!!cache.appMetadata[key]) {
                            delete cache.appMetadata[key];
                            result = true;
                        }
                        break;
                    }
                    default: {
                        console.log("Invalid Cache Type");
                        break;
                    }
                }

                // write to the cache after removal
                if (result) {
                    this.setCache(cache);
                }
                return result;
            },
            containsKey(key: string): boolean {
                const cache = this.getCache() as InMemoryCache;
                return !!cache.accounts[key] || !!cache.idTokens[key] || !!cache.accessTokens[key] || !!cache.refreshTokens[key] || !!cache.appMetadata[key];
            },
            getKeys(): string[] {
                const cache = this.getCache() as InMemoryCache;
                return [...Object.keys(cache.accounts), ...Object.keys(cache.idTokens), ...Object.keys(cache.accessTokens), ...Object.keys(cache.refreshTokens), ...Object.keys(cache.appMetadata)];
            },
            clear(): void {
                const cache = this.getCache() as InMemoryCache;
                cache.accounts = {};
                cache.idTokens = {};
                cache.accessTokens = {};
                cache.refreshTokens = {};
                cache.appMetadata = {};
            }
        };
    });

    it("initCache", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateCredentialKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateCredentialKey();

        const cache = storageInterface.getCache() as InMemoryCache;
        expect(Object.keys(cache.accessTokens).length).to.equal(2);
        expect(cache.accessTokens[atOneKey]).to.eql(atOne);
        expect(cache.accessTokens[atTwoKey]).to.eql(atTwo);
    });

    it("save account", () => {
        let ac = new AccountEntity();
        Object.assign(ac, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            realm: "microsoft",
            localAccountId: "object1234",
            username: "Jane Goodman",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9",
        });

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        const accountKey = ac.generateAccountKey();
        const cache = storageInterface.getCache() as InMemoryCache;
        unifiedCacheManager.saveAccount(ac);
        expect(cache.accounts[accountKey].homeAccountId).to.eql("someUid.someUtid");
    });

    it("save credential", () => {
        let at = new AccessTokenEntity();
        Object.assign(at, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        });

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);
        const atKey = at.generateCredentialKey();
        unifiedCacheManager.saveCredential(at);
        const cache = storageInterface.getCache() as InMemoryCache;
        expect(cache.accessTokens[atKey].homeAccountId).to.eql("someUid.someUtid");
    });

    it("getAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        expect(unifiedCacheManager.getAccount("someuid.someutid-login.microsoftonline.com-microsoft").homeAccountId).to.eql("someUid.someUtid");
    });

    it("getCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        expect(unifiedCacheManager.getCredential("someuid.someutid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope6 scope7").homeAccountId).to.eql("someUid.someUtid");
    });

    it("getAccountsFilteredBy", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        const filterOne: AccountFilter = { homeAccountId: "uid.utid" };
        let accounts = unifiedCacheManager.getAccountsFilteredBy(filterOne);
        expect(Object.keys(accounts).length).to.eql(1);

        const filterTwo: AccountFilter = { homeAccountId: "Wrong Id" };
        accounts = unifiedCacheManager.getAccountsFilteredBy(filterTwo);
        expect(Object.keys(accounts).length).to.eql(0);
    });

    it("getCredentials", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        // filter by homeAccountId
        const filterOne: CredentialFilter = { homeAccountId: "uid.utid" };
        let credentials = unifiedCacheManager.getCredentialsFilteredBy(filterOne);
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

        // filter by homeAccountId
        const filterTwo: CredentialFilter = { homeAccountId: "someuid.someutid" };
        credentials = unifiedCacheManager.getCredentialsFilteredBy(filterTwo);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by target
        const filterThree = { target: "scope1 scope2 scope3" };
        credentials = unifiedCacheManager.getCredentialsFilteredBy(filterThree);
    });

    it("removeAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        let ac = new AccountEntity();
        Object.assign(ac, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            realm: "microsoft",
            localAccountId: "object1234",
            username: "Jane Goodman",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9",
        });

        unifiedCacheManager.removeAccount(ac.generateAccountKey());
        const accountKey = ac.generateAccountKey();
        const cache = storageInterface.getCache() as InMemoryCache;
        expect(cache.accounts[accountKey]).to.eql(undefined);
    });

    it("removeCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface, true);

        let at = new AccessTokenEntity();
        Object.assign(at, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
        });

        unifiedCacheManager.removeCredential(at);
        const atKey = at.generateCredentialKey();
        const cache = storageInterface.getCache() as InMemoryCache;
        expect(cache.accessTokens[atKey]).to.eql(undefined);
    });
});
