import { expect } from "chai";
import { UnifiedCacheManager } from "../../src/unifiedCache/UnifiedCacheManager";
import { mockCache } from "./entities/cacheConstants";
import { InMemoryCache} from "../../src/unifiedCache/utils/CacheTypes";
import { ICacheStorage } from "../../src/cache/ICacheStorage";
import { Deserializer } from "../../src/unifiedCache/serialize/Deserializer";
import { AccountEntity } from "../../src/unifiedCache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/unifiedCache/entities/AccessTokenEntity";

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
        };
    });

    it("initCache", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        // create mock AccessToken
        const atOne = mockCache.createMockATOne();
        const atOneKey = atOne.generateCredentialKey();
        const atTwo = mockCache.createMockATTwo();
        const atTwoKey = atTwo.generateCredentialKey();

        expect(
            Object.keys(unifiedCacheManager.getCacheInMemory().accessTokens)
                .length
        ).to.equal(2);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atOneKey]
        ).to.eql(atOne);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atTwoKey]
        ).to.eql(atTwo);
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

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        const accountKey = ac.generateAccountKey();
        unifiedCacheManager.saveAccount(ac);
        expect(
            unifiedCacheManager.getCacheInMemory().accounts[accountKey]
                .homeAccountId
        ).to.eql("someUid.someUtid");
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

        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        const atKey = at.generateCredentialKey();
        unifiedCacheManager.saveCredential(at);
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atKey]
                .homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("getAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        expect(
            unifiedCacheManager.getAccount(
                "someuid.someutid-login.microsoftonline.com-microsoft"
            ).homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("getCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        expect(
            unifiedCacheManager.getCredential(
                "someuid.someutid-login.microsoftonline.com-accesstoken-mock_client_id-microsoft-scope6 scope7"
            ).homeAccountId
        ).to.eql("someUid.someUtid");
    });

    it("getAccounts", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        let accounts = unifiedCacheManager.getAccountsFilteredBy("uid.utid");
        expect(Object.keys(accounts).length).to.eql(1);

        accounts = unifiedCacheManager.getAccountsFilteredBy(
            null,
            "login.microsoftonline.com"
        );
        expect(Object.keys(accounts).length).to.eql(2);
    });

    it("getCredentials", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

        let credentials = unifiedCacheManager.getCredentialsFilteredBy("uid.utid");
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

        credentials = unifiedCacheManager.getCredentialsFilteredBy("someuid.someutid");
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(1);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
    });

    it("removeAccount", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

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

        unifiedCacheManager.removeAccount(ac);
        const accountKey = ac.generateAccountKey();
        expect(
            unifiedCacheManager.getCacheInMemory().accounts[accountKey]
        ).to.eql(undefined);
    });

    it("removeCredential", () => {
        let unifiedCacheManager = new UnifiedCacheManager(storageInterface);

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
        expect(
            unifiedCacheManager.getCacheInMemory().accessTokens[atKey]
        ).to.eql(undefined);
    });
});
