import { expect } from "chai";
import { CacheManager } from "../../../src/cache/CacheManager";
import { CacheSchemaType, CredentialType } from "../../../src/utils/Constants";
import { IdTokenEntity } from "../../../src/cache/entities/IdTokenEntity";
import { AccountEntity } from "../../../src/cache/entities/AccountEntity";
import { CacheHelper } from "../../../src/cache/utils/CacheHelper";
import { AccessTokenEntity } from "../../../src/cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../../../src/cache/entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../../../src/cache/entities/AppMetadataEntity";
import { mockCache } from "../entities/cacheConstants";
import { CacheRecord } from "../../../src/cache/entities/CacheRecord";
import { ScopeSet } from "../../../src/request/ScopeSet";
import { AccountFilter, CredentialFilter } from "../../../src/cache/utils/CacheTypes";

const cacheJson = require("../cache.json");

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
                const credentialType = CacheHelper.getCredentialType(
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
                console.log("Invalid Cache Type");
                return;
            }
        }
    }
    getItem(key: string, type?: string): string | object {
        // save the cacheItem
        switch (type) {
            case CacheSchemaType.ACCOUNT: {
                return CacheHelper.toObject(new AccountEntity(), store[key]) as AccountEntity;
            }
            case CacheSchemaType.CREDENTIAL: {
                const credentialType = CacheHelper.getCredentialType(key);
                switch (credentialType) {
                    case CredentialType.ID_TOKEN: {
                        return CacheHelper.toObject(new IdTokenEntity(), store[key]) as IdTokenEntity;
                    }
                    case CredentialType.ACCESS_TOKEN: {
                        return CacheHelper.toObject(new AccessTokenEntity(), store[key]) as AccessTokenEntity;
                    }
                    case CredentialType.REFRESH_TOKEN: {
                        return CacheHelper.toObject(new RefreshTokenEntity(), store[key]) as RefreshTokenEntity;
                    }
                }
                break;
            }
            case CacheSchemaType.APP_META_DATA: {
                return CacheHelper.toObject(new AppMetadataEntity(), store[key]) as AppMetadataEntity;
            }
            default: {
                console.log("Invalid Cache Type");
                return;
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
                const credentialType = CacheHelper.getCredentialType(
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
                console.log("Invalid Cache Type");
                break;
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
        cacheManager.saveCacheRecord(cacheRecord, new ScopeSet(["scope6", "scope7"]));
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

        // filter by target
        const filterThree = { target: "scope1 scope2 scope3" };
        credentials = cacheManager.getCredentialsFilteredBy(filterThree);
    });

    it.skip("removeAccount", () => {
        const account: AccountEntity = cacheManager.getAccount("uid.utid-login.microsoftonline.com-microsoft");
        console.log(account.generateAccountKey);
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
