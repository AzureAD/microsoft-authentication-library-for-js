import { expect } from "chai";
import { CacheManager } from "../../src/cache/CacheManager";
import { CacheSchemaType, CredentialType, Constants } from "../../src/utils/Constants";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity";
import { mockCache } from "./entities/cacheConstants";
import { CacheRecord } from "../../src/cache/entities/CacheRecord";
import { AccountFilter, CredentialFilter } from "../../src/cache/utils/CacheTypes";
import sinon from "sinon";
import { CredentialEntity } from "../../src/cache/entities/CredentialEntity";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { TrustedAuthority } from "../../src/authority/TrustedAuthority";

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
            case CacheSchemaType.APP_META_DATA: {
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
            case CacheSchemaType.APP_META_DATA: {
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
            case CacheSchemaType.APP_META_DATA: {
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

    it("getAccountsFilteredBy", () => {
        const filterOne: AccountFilter = { homeAccountId: "uid.utid" };
        let accounts = cacheManager.getAccountsFilteredBy(filterOne);
        expect(Object.keys(accounts).length).to.eql(1);

        const filterTwo: AccountFilter = { homeAccountId: "Wrong Id" };
        accounts = cacheManager.getAccountsFilteredBy(filterTwo);
        expect(Object.keys(accounts).length).to.eql(0);

        sinon.stub(TrustedAuthority, "getCloudDiscoveryMetadata").callsFake(() => {
            return {
                preferred_cache: Constants.DEFAULT_AUTHORITY_HOST, 
                preferred_network: Constants.DEFAULT_AUTHORITY_HOST, 
                aliases: [Constants.DEFAULT_AUTHORITY_HOST]}
        });
        const filterThree: AccountFilter = { environment: "login.microsoftonline.com" };
        accounts = cacheManager.getAccountsFilteredBy(filterThree);
        expect(Object.keys(accounts).length).to.eql(1);
        sinon.restore();

        const filterFour: AccountFilter = { environment: "Wrong Env" };
        accounts = cacheManager.getAccountsFilteredBy(filterFour);
        expect(Object.keys(accounts).length).to.eql(0);

        const filterFive: AccountFilter = { realm: "microsoft" };
        accounts = cacheManager.getAccountsFilteredBy(filterFive);
        expect(Object.keys(accounts).length).to.eql(1);

        const filterSix: AccountFilter = { realm: "Wrong Realm" };
        accounts = cacheManager.getAccountsFilteredBy(filterSix);
        expect(Object.keys(accounts).length).to.eql(0);
    });

    it("getCredentials", () => {
        // filter by homeAccountId
        const filterOne: CredentialFilter = { homeAccountId: "uid.utid" };
        let credentials = cacheManager.getCredentialsFilteredBy(filterOne);
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

        // filter by homeAccountId
        const filterTwo: CredentialFilter = { homeAccountId: "someuid.someutid" };
        credentials = cacheManager.getCredentialsFilteredBy(filterTwo);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by environment
        sinon.stub(TrustedAuthority, "getCloudDiscoveryMetadata").callsFake(() => {
            return {
                preferred_cache: Constants.DEFAULT_AUTHORITY_HOST, 
                preferred_network: Constants.DEFAULT_AUTHORITY_HOST, 
                aliases: [Constants.DEFAULT_AUTHORITY_HOST]}
        });
        const filterThree: CredentialFilter = { environment: "login.microsoftonline.com" };
        credentials = cacheManager.getCredentialsFilteredBy(filterThree);
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(2);
        sinon.restore();

        // filter by environment
        const filterFour: CredentialFilter = { environment: "Wrong Env" };
        credentials = cacheManager.getCredentialsFilteredBy(filterFour);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by realm
        const filterFive: CredentialFilter = { realm: "microsoft" };
        credentials = cacheManager.getCredentialsFilteredBy(filterFive);
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by realm
        const filterSix: CredentialFilter = { realm: "Wrong Realm" };
        credentials = cacheManager.getCredentialsFilteredBy(filterSix);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by realm
        const filterSeven: CredentialFilter = { credentialType: "IdToken" };
        credentials = cacheManager.getCredentialsFilteredBy(filterSeven);
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by realm
        const filterEight: CredentialFilter = { credentialType: "Incorrect" };
        credentials = cacheManager.getCredentialsFilteredBy(filterEight);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by realm
        const filterNine: CredentialFilter = { clientId: "mock_client_id" };
        credentials = cacheManager.getCredentialsFilteredBy(filterNine);
        expect(Object.keys(credentials.idTokens).length).to.eql(1);
        expect(Object.keys(credentials.accessTokens).length).to.eql(2);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

        // filter by realm
        const filterTen: CredentialFilter = { clientId: "Wrong Client ID" };
        credentials = cacheManager.getCredentialsFilteredBy(filterTen);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by target
        const filterEleven = { target: "scope1 scope2 scope3" };
        credentials = cacheManager.getCredentialsFilteredBy(filterEleven);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(1);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

        // filter by target
        const filterTwelve = { target: "wrong target" };
        credentials = cacheManager.getCredentialsFilteredBy(filterTwelve);
        expect(Object.keys(credentials.idTokens).length).to.eql(0);
        expect(Object.keys(credentials.accessTokens).length).to.eql(0);
        expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
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
});
