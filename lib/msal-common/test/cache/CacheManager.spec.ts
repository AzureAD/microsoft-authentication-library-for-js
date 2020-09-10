import { expect } from "chai";
import { CacheManager } from "../../src/cache/CacheManager";
import { CacheSchemaType, CredentialType, Constants } from "../../src/utils/Constants";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity";
import { CacheRecord } from "../../src/cache/entities/CacheRecord";
import { AccountFilter, CredentialFilter } from "../../src/cache/utils/CacheTypes";
import sinon from "sinon";
import { CredentialEntity } from "../../src/cache/entities/CredentialEntity";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { ClientTestUtils } from "../client/ClientTestUtils";
import { ScopeSet } from "../../src/request/ScopeSet";
import {
    TEST_CONFIG,
    TEST_TOKENS,
} from "../utils/StringConstants";
import { CredentialCache } from "../../src/cache/utils/CacheTypes";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AccountInfo } from "../../src/account/AccountInfo";

const cacheJson = require("./cache.json");

let store = {};
class TestStorageManager extends CacheManager {
    setItem(key: string, value: string | object, type?: string): void {
        // save the cacheItem
        switch (type) {
            case CacheSchemaType.ACCOUNT: {
                store[key] = value as AccountEntity;
                break;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CredentialEntity.getCredentialType(
                    key
                );
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        store[key] = value as IdTokenEntity;
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        store[key] = value as AccessTokenEntity;
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        store[key] = value as RefreshTokenEntity;
                        break;
                    }
                }
                break;
            }
            case CacheSchemaType.APP_METADATA: {
                store[key] = value as AppMetadataEntity;
                break;
            }
            default: {
                throw ClientAuthError.createInvalidCacheTypeError();
            }
        }
    }
    getItem(key: string, type?: string): string | object {
        // save the cacheItem
        switch (type) {
            case CacheSchemaType.ACCOUNT: {
                return CacheManager.toObject(new AccountEntity(), store[key]) as AccountEntity;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CredentialEntity.getCredentialType(key);
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        return CacheManager.toObject(new IdTokenEntity(), store[key]) as IdTokenEntity;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        return CacheManager.toObject(new AccessTokenEntity(), store[key]) as AccessTokenEntity;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        return CacheManager.toObject(new RefreshTokenEntity(), store[key]) as RefreshTokenEntity;
                    }
                }
                break;
            }
            case CacheSchemaType.APP_METADATA: {
                return CacheManager.toObject(new AppMetadataEntity(), store[key]) as AppMetadataEntity;
            }
            default: {
                throw ClientAuthError.createInvalidCacheTypeError();
            }
        }
    }
    removeItem(key: string, type?: string): boolean {
        let result: boolean = false;

        // save the cacheItem
        switch (type) {
            case CacheSchemaType.ACCOUNT: {
                if (!!store[key]) {
                    delete store[key];
                    result = true;
                }
                break;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CredentialEntity.getCredentialType(
                    key
                );
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        if (!!store[key]) {
                            delete store[key];
                            result = true;
                        }
                        break;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        if (!!store[key]) {
                            delete store[key];
                            result = true;
                        }
                        break;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        if (!!store[key]) {
                            delete store[key];
                            result = true;
                        }
                        break;
                    }
                }
                break;
            }
            case CacheSchemaType.APP_METADATA: {
                if (!!store[key]) {
                    delete store[key];
                    result = true;
                }
                break;
            }
            default: {
                throw ClientAuthError.createInvalidCacheTypeError();
            }
        }

        return result;
    }
    containsKey(key: string, type?: string): boolean {
        return !!store[key];
    }
    getKeys(): string[] {
        return Object.keys(store);
    }
    clear(): void {
        store = {};
    }
}

describe("CacheManager.ts test cases", () => {

    let cacheManager: TestStorageManager;
    beforeEach(() => {
        store = {
            ...cacheJson
        };
        cacheManager = new TestStorageManager();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("save account", () => {
        let ac = new AccountEntity();
        ac.homeAccountId = "someUid.someUtid";
        ac.environment = "login.microsoftonline.com";
        ac.realm = "microsoft";
        ac.localAccountId = "object1234";
        ac.username = "Jane Goodman";
        ac.authorityType = "MSSTS";
        ac.clientInfo = "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9";

        const accountKey = ac.generateAccountKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.account = ac;
        cacheManager.saveCacheRecord(cacheRecord);
        expect(store[accountKey].homeAccountId).to.eql("someUid.someUtid");
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

        const atKey = at.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = at;
        cacheManager.saveCacheRecord(cacheRecord);
        const accountObj = store[atKey] as AccessTokenEntity;
        expect(store[atKey].homeAccountId).to.eql("someUid.someUtid");
    });

    it("getAccount", () => {
        let ac = new AccountEntity();
        ac.homeAccountId = "someUid.someUtid";
        ac.environment = "login.microsoftonline.com";
        ac.realm = "microsoft";
        ac.localAccountId = "object1234";
        ac.username = "Jane Goodman";
        ac.authorityType = "MSSTS";
        ac.clientInfo = "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9";

        const accountKey = ac.generateAccountKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.account = ac;
        cacheManager.saveCacheRecord(cacheRecord);

        expect(cacheManager.getAccount(accountKey).homeAccountId).to.eql("someUid.someUtid");
    });

    it("getCredential", () => {
        let accessTokenEntity = new AccessTokenEntity();
        accessTokenEntity.homeAccountId = "someUid.someUtid";
        accessTokenEntity.environment = "login.microsoftonline.com";
        accessTokenEntity.realm = "microsoft";
        accessTokenEntity.clientId = "mock_client_id";
        accessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
        accessTokenEntity.target = "scope6 scope7";

        const credKey = accessTokenEntity.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = accessTokenEntity;
        cacheManager.saveCacheRecord(cacheRecord);
        expect(cacheManager.getCredential(credKey).homeAccountId).to.eql("someUid.someUtid");
    });

    describe("getAccountsFilteredBy", () => {

        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: AccountFilter = { homeAccountId: "uid.utid" };
            let accounts = cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).to.eql(1);

            const wrongFilter: AccountFilter = { homeAccountId: "Wrong Id" };
            accounts = cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).to.eql(0);
        });

        it("environment filter", () => {
            // filter by environment
            ClientTestUtils.setCloudDiscoveryMetadataStubs();
            const successFilter: AccountFilter = { environment: "login.microsoftonline.com" };
            let accounts = cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).to.eql(1);
            sinon.restore();

            const wrongFilter: AccountFilter = { environment: "Wrong Env" };
            accounts = cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).to.eql(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: AccountFilter = { realm: "microsoft" };
            let accounts = cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).to.eql(1);

            const wrongFilter: AccountFilter = { realm: "Wrong Realm" };
            accounts = cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).to.eql(0);
        });
    });

    describe("getCredentials", () => {

        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: CredentialFilter = { homeAccountId: "uid.utid" };
            let credentials = cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

            const wrongFilter: CredentialFilter = { homeAccountId: "someuid.someutid" };
            credentials = cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("environment filter", () => {
            // filter by environment
            ClientTestUtils.setCloudDiscoveryMetadataStubs();
            const successFilter: CredentialFilter = { environment: "login.microsoftonline.com" };
            let credentials = cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(2);
            sinon.restore();

            const wrongFilter: CredentialFilter = { environment: "Wrong Env" };
            credentials = cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: CredentialFilter = { realm: "microsoft" };
            let credentials = cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const wrongFilter: CredentialFilter = { realm: "Wrong Realm" };
            credentials = cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("credentialType filter", () => {
            // filter by realm
            const successFilter: CredentialFilter = { credentialType: "IdToken" };
            let credentials = cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const wrongFilter: CredentialFilter = { credentialType: "Incorrect" };
            credentials = cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("clientId filter", () => {
            // filter by realm
            const successFilter: CredentialFilter = { clientId: "mock_client_id" };
            let credentials = cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

            const wrongFilter: CredentialFilter = { clientId: "Wrong Client ID" };
            credentials = cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("target filter", () => {
            // filter by target
            const successFilter = { target: "scope1 scope2 scope3" };
            let credentials = cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(1);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const wrongFilter = { target: "wrong target" };
            credentials = cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const filterOidcscopes = { target: "scope1 scope2 scope3 offline_access" };
            let filteredCredentials = cacheManager.getCredentialsFilteredBy(filterOidcscopes);
            expect(Object.keys(filteredCredentials.idTokens).length).to.eql(0);
            expect(Object.keys(filteredCredentials.accessTokens).length).to.eql(1);
            expect(Object.keys(filteredCredentials.refreshTokens).length).to.eql(0);

        });
    });

    it("removeAppMetadata", () => {
        cacheManager.removeAppMetadata();

        expect(store["appmetadata-login.microsoftonline.com-mock_client_id"]).to.be.undefined;
    });

    it("removeAllAccounts", () => {
        let ac = new AccountEntity();
        ac.homeAccountId = "someUid.someUtid";
        ac.environment = "login.microsoftonline.com";
        ac.realm = "microsoft";
        ac.localAccountId = "object1234";
        ac.username = "Jane Goodman";
        ac.authorityType = "MSSTS";
        ac.clientInfo = "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9";

        const cacheRecord = new CacheRecord();
        cacheRecord.account = ac;
        cacheManager.saveCacheRecord(cacheRecord);

        cacheManager.removeAllAccounts();

        // Only app metadata remaining
        expect(cacheManager.getKeys().length === 1).to.be.true;
    });

    it("removeAccount", () => {
        const account: AccountEntity = cacheManager.getAccount("uid.utid-login.microsoftonline.com-microsoft");
        cacheManager.removeAccount("uid.utid-login.microsoftonline.com-microsoft");
        expect(store["uid.utid-login.microsoftonline.com-microsoft"]).to.eql(undefined);
    });

    it("removeCredential", () => {
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

        cacheManager.removeCredential(at);
        const atKey = at.generateCredentialKey();
        expect(store[atKey]).to.eql(undefined);
    });
    
    it("getAccessTokenEntity matches multiple tokens, throws error", () => {
        
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "mocked_homeaccountid", "login.microsoftonline.com", "an_access_token", "client_id", TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, TEST_TOKENS.ACCESS_TOKEN);
            
        const mockedAtEntity2: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "mocked_homeaccountid", "login.microsoftonline.com", "an_access_token", "client_id", TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, TEST_TOKENS.ACCESS_TOKEN);
            
        const mockedCredentialCache: CredentialCache = {
            accessTokens: { 
                "key1": mockedAtEntity,
                "key2": mockedAtEntity2
            },
            refreshTokens: null,
            idTokens: null
        }

        sinon.stub(CacheManager.prototype, <any>"getCredentialsFilteredBy").returns(mockedCredentialCache);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "mocked_homeaccountid",
            environment: "mocked_env",
            tenantId: "mocked_tid",
            username: "mocked_username"
        };

        expect(() => cacheManager.getAccessTokenEntity("client_id", mockedAccountInfo, new ScopeSet(["openid"]))).to.throw(`${ClientAuthErrorMessage.multipleMatchingTokens.desc}`);
    });
});
