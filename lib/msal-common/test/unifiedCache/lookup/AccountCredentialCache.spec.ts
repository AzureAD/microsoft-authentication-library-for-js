import { expect } from "chai";
import { InMemoryCache } from "../../../src/unifiedCache/utils/CacheTypes";
import { ICacheStorage } from ".../../../src/cache/ICacheStorage";
import { Deserializer } from "../../../src/unifiedCache/serialize/Deserializer";
import { AccountEntity } from "../../../src/unifiedCache/entities/AccountEntity";
import { AccessTokenEntity } from "../../../src/unifiedCache/entities/AccessTokenEntity";
import { AccountCredentialCache } from "../../../src/unifiedCache/lookup/AccountCredentialCache";
import { UnifiedCacheManager } from "../../../src/unifiedCache/UnifiedCacheManager";

const cacheJson = require("./../serialize/cache.json");

describe("AccountCredentialCache test cases", () => {
    let store = {};
    let storageInterface: ICacheStorage;
    const cache = JSON.stringify(cacheJson);
    const inMemCache: InMemoryCache = Deserializer.deserializeAllCache(Deserializer.deserializeJSONBlob(cache));

    beforeEach(() => {
        storageInterface = {
            getCache(): InMemoryCache {
                return inMemCache;
            },
            setCache(inMemCache): void {
                this.inMemCache = inMemCache;
            },
            setItem(key: string, value: string): void {
                store[key] = value;
            },
            getItem(key: string): string {
                return store[key];
            },
            removeItem(key: string): void {
                delete store[key];
            },
            containsKey(key: string): boolean {
                return !!store[key];
            },
            getKeys(): string[] {
                return Object.keys(store);
            },
            clear(): void {
                store = {};
            },
        }
    });

    it("save account", () => {
        let ac = new AccountEntity();
        Object.assign(
            ac,
            {
                homeAccountId: "someUid.someUtid",
                environment: "login.microsoftonline.com",
                realm: "microsoft",
                localAccountId: "object1234",
                username: "Jane Goodman",
                authorityType: "MSSTS",
                clientInfo: "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9",
            }
        );

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

        const accountKey = ac.generateAccountKey();
        accCredCache.saveAccount(ac);
        expect(unifiedCacheManager.getCacheInMemory().accounts[accountKey].homeAccountId).to.eql("someUid.someUtid");
    });

    it("save credential", () => {
        let at = new AccessTokenEntity();
        Object.assign(
            at,
            {
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
            }
        );

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

        const atKey = at.generateCredentialKey();
        accCredCache.saveCredential(at);
        expect(unifiedCacheManager.getCacheInMemory().accessTokens[atKey].homeAccountId).to.eql("someUid.someUtid");
    });

    it("getAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

        expect(accCredCache.getAccount("someuid.someutid-login.microsoftonline.com-microsoft").homeAccountId).to.eql("someUid.someUtid");
    });

    it("getCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

        expect(
            accCredCache.getCredential(
                "someuid.someutid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope6 scope7"
            ).homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("getAccounts", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

        let accounts = accCredCache.getAccounts("uid.utid");
        expect(Object.keys(accounts).length).to.eql(1);

        accounts = accCredCache.getAccounts(null, "login.microsoftonline.com");
        expect(Object.keys(accounts).length).to.eql(2);
    });

    it("getCredentials", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

        let credentials = accCredCache.getCredentials("uid.utid");
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

        credentials = accCredCache.getCredentials("someuid.someutid");
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(1);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
    });

    it("removeAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

        let ac = new AccountEntity();
        Object.assign(
            ac,
            {
                homeAccountId: "someUid.someUtid",
                environment: "login.microsoftonline.com",
                realm: "microsoft",
                localAccountId: "object1234",
                username: "Jane Goodman",
                authorityType: "MSSTS",
                clientInfo: "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9",
            }
        );

        accCredCache.removeAccount(ac);
        const accountKey = ac.generateAccountKey();
        expect(unifiedCacheManager.getCacheInMemory().accounts[accountKey]).to.eql(undefined);
    });

    it("removeCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);
        let accCredCache = new AccountCredentialCache(unifiedCacheManager);

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

        accCredCache.removeCredential(at);
        const atKey = at.generateCredentialKey();
        expect(unifiedCacheManager.getCacheInMemory().accessTokens[atKey]).to.eql(undefined);
    });
});
