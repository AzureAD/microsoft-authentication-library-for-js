import { expect } from "chai";
import { CredentialType } from "../../src/utils/Constants";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { CacheRecord } from "../../src/cache/entities/CacheRecord";
import { AccountFilter, CredentialFilter } from "../../src/cache/utils/CacheTypes";
import sinon, { mock } from "sinon";
import { ScopeSet } from "../../src/request/ScopeSet";
import {
    TEST_CONFIG,
    TEST_TOKENS,
    CACHE_MOCKS,
} from "../utils/StringConstants";
import { ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AccountInfo } from "../../src/account/AccountInfo";
import { MockCache } from "./MockCache";
import { AuthorityMetadataEntity, CacheManager } from "../../src";
import { mockCrypto } from "../client/ClientTestUtils";

describe("CacheManager.ts test cases", () => {
    let mockCache = new MockCache(CACHE_MOCKS.MOCK_CLIENT_ID_1, mockCrypto);
    let authorityMetadataStub: sinon.SinonStub;
    beforeEach(() => {
        mockCache.initializeCache();
        authorityMetadataStub = sinon.stub(CacheManager.prototype, "getAuthorityMetadataByAlias").callsFake((host) => {
            const authorityMetadata = new AuthorityMetadataEntity();
            authorityMetadata.updateCloudDiscoveryMetadata({
                aliases: [host],
                preferred_cache: host,
                preferred_network: host
            }, false);
            return authorityMetadata;
        })
    });

    afterEach(() => {
        mockCache.clearCache();
        sinon.restore();
    });

    it("save account", () => {
        const ac = new AccountEntity();
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
        mockCache.cacheManager.saveCacheRecord(cacheRecord);
        const mockCacheAccount = mockCache.cacheManager.getAccount(accountKey)
        expect(mockCacheAccount.homeAccountId).to.eql("someUid.someUtid");
    });

    it("save accessToken", () => {
        const at = new AccessTokenEntity();
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
        mockCache.cacheManager.saveCacheRecord(cacheRecord);
        const mockCacheAT = mockCache.cacheManager.getAccessTokenCredential(atKey)
        expect(mockCacheAT.homeAccountId).to.eql("someUid.someUtid");
    });

    it("getAccount", () => {
        const ac = new AccountEntity();
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
        mockCache.cacheManager.saveCacheRecord(cacheRecord);

        expect(mockCache.cacheManager.getAccount(accountKey).homeAccountId).to.eql("someUid.someUtid");
        expect(mockCache.cacheManager.getAccount("")).to.be.null;
    });

    it("getAccessTokenCredential", () => {
        const accessTokenEntity = new AccessTokenEntity();
        accessTokenEntity.homeAccountId = "someUid.someUtid";
        accessTokenEntity.environment = "login.microsoftonline.com";
        accessTokenEntity.realm = "microsoft";
        accessTokenEntity.clientId = "mock_client_id";
        accessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN;
        accessTokenEntity.target = "scope6 scope7";

        const credKey = accessTokenEntity.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = accessTokenEntity;
        mockCache.cacheManager.saveCacheRecord(cacheRecord);
        expect(mockCache.cacheManager.getAccessTokenCredential(credKey).homeAccountId).to.eql("someUid.someUtid");
    });

    describe("getAccountsFilteredBy", () => {

        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: AccountFilter = { homeAccountId: "uid.utid" };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).to.eql(1);

            const wrongFilter: AccountFilter = { homeAccountId: "Wrong Id" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).to.eql(0);
        });

        it("environment filter", () => {
            // filter by environment
            const successFilter: AccountFilter = { environment: "login.microsoftonline.com" };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).to.eql(1);
            sinon.restore();

            const wrongFilter: AccountFilter = { environment: "Wrong Env" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).to.eql(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: AccountFilter = { realm: "microsoft" };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).to.eql(1);

            const wrongFilter: AccountFilter = { realm: "Wrong Realm" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).to.eql(0);
        });
    });

    describe("getCredentials", () => {

        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: CredentialFilter = { homeAccountId: "uid.utid" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(2);

            const wrongFilter: CredentialFilter = { homeAccountId: "someuid.someutid" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("environment filter", () => {
            // filter by environment
            const successFilter: CredentialFilter = { environment: "login.microsoftonline.com" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(2);
            sinon.restore();

            const wrongFilter: CredentialFilter = { environment: "Wrong Env" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: CredentialFilter = { realm: "microsoft" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const wrongFilter: CredentialFilter = { realm: "Wrong Realm" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("credentialType filter", () => {
            // filter by realm
            const successFilter: CredentialFilter = { credentialType: "IdToken" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const wrongFilter: CredentialFilter = { credentialType: "Incorrect" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("clientId filter", () => {
            // filter by realm
            const successFilter: CredentialFilter = { clientId: "mock_client_id" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(1);
            expect(Object.keys(credentials.accessTokens).length).to.eql(2);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(1);

            const wrongFilter: CredentialFilter = { clientId: "Wrong Client ID" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });

        it("target filter", () => {
            // filter by target
            const successFilter = { target: "scope1 scope2 scope3" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(1);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const wrongFilter = { target: "wrong target" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(0);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const filterOidcscopes = { target: "scope1 scope2 scope3 offline_access openid profile" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(filterOidcscopes);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(1);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);

            const filterScopesCase = { target: "scope1 scope2 SCOPE3 offline_access openid profile" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(filterScopesCase);
            expect(Object.keys(credentials.idTokens).length).to.eql(0);
            expect(Object.keys(credentials.accessTokens).length).to.eql(1);
            expect(Object.keys(credentials.refreshTokens).length).to.eql(0);
        });
    });

    it("getAppMetadata and readAppMetadataFromCache", () => {
        const appMetadataKey = "appmetadata-login.microsoftonline.com-mock_client_id_1";
        const appMetadata = mockCache.cacheManager.getAppMetadata(appMetadataKey);

        expect(appMetadata.clientId).to.eql(CACHE_MOCKS.MOCK_CLIENT_ID_1);
        expect(appMetadata.environment).to.eql(CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment);

        const cachedAppMetadata = mockCache.cacheManager.readAppMetadataFromCache(CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment, CACHE_MOCKS.MOCK_CLIENT_ID_1);
        expect(cachedAppMetadata.clientId).to.eql(CACHE_MOCKS.MOCK_CLIENT_ID_1);
        expect(cachedAppMetadata.environment).to.eql(CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment);
    });

    it("removeAppMetadata", () => {
        mockCache.cacheManager.removeAppMetadata();
        expect(mockCache.cacheManager.getAppMetadata("appmetadata-login.microsoftonline.com-mock_client_id_1")).to.be.undefined;
    });

    it("removeAllAccounts", () => {
        const ac = new AccountEntity();
        ac.homeAccountId = "someUid.someUtid";
        ac.environment = "login.microsoftonline.com";
        ac.realm = "microsoft";
        ac.localAccountId = "object1234";
        ac.username = "Jane Goodman";
        ac.authorityType = "MSSTS";
        ac.clientInfo = "eyJ1aWQiOiJzb21lVWlkIiwgInV0aWQiOiJzb21lVXRpZCJ9";

        const cacheRecord = new CacheRecord();
        cacheRecord.account = ac;
        mockCache.cacheManager.saveCacheRecord(cacheRecord);

        mockCache.cacheManager.removeAllAccounts();

        // Only app metadata remaining
        expect(mockCache.cacheManager.getKeys().length === 1).to.be.true;
    });

    it("removeAccount", () => {
        expect(mockCache.cacheManager.getAccount("uid.utid-login.microsoftonline.com-microsoft")).to.not.be.null;
        mockCache.cacheManager.removeAccount("uid.utid-login.microsoftonline.com-microsoft");
        expect(mockCache.cacheManager.getAccount("uid.utid-login.microsoftonline.com-microsoft")).to.be.null;
    });

    it("removeCredential", () => {
        const at = new AccessTokenEntity();
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

        mockCache.cacheManager.removeCredential(at);
        const atKey = at.generateCredentialKey();
        expect(mockCache.cacheManager.getAccount(atKey)).to.be.null;
    });

    it("readAccessTokenFromCache matches multiple tokens, throws error", () => {
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", "an_access_token", CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, TEST_TOKENS.ACCESS_TOKEN);

        const mockedAtEntity2: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", "an_access_token", CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, "User.Read test_scope", 4600, 4600, TEST_TOKENS.ACCESS_TOKEN);

        const accountData = {
            "username": "John Doe",
            "localAccountId": "uid",
            "realm": "common",
            "environment": "login.microsoftonline.com",
            "homeAccountId": "uid.utid",
            "authorityType": "MSSTS",
            "clientInfo": "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ=="
        };
        const mockedAccount: AccountEntity = CacheManager.toObject(new AccountEntity(), accountData);

        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity);
        mockCache.cacheManager.setAccessTokenCredential(mockedAtEntity2);
        mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe"
        };

        expect(() => mockCache.cacheManager.readAccessTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, new ScopeSet(["user.read"]))).to.throw(`${ClientAuthErrorMessage.multipleMatchingTokens.desc}`);
    });

    it("readIdTokenFromCache", () => {
        const idToken = mockCache.cacheManager.readIdTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, CACHE_MOCKS.MOCK_ACCOUNT_INFO);
        expect(idToken.clientId).to.equal(CACHE_MOCKS.MOCK_CLIENT_ID);
    });

    it("readRefreshTokenFromCache", () => {
        const refreshToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID_1, CACHE_MOCKS.MOCK_ACCOUNT_INFO, false);
        expect(refreshToken.clientId).to.equal(CACHE_MOCKS.MOCK_CLIENT_ID_1);
    });

    it("readRefreshTokenFromCache Error", () => {
        const refreshToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, CACHE_MOCKS.MOCK_ACCOUNT_INFO, true);
        expect(refreshToken).to.equal(null);
    });

    it("readRefreshTokenFromCache with familyId", () => {
        const refreshToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID_1, CACHE_MOCKS.MOCK_ACCOUNT_INFO, true);
        expect(refreshToken.clientId).to.equal(CACHE_MOCKS.MOCK_CLIENT_ID_1);
    });

    it("readRefreshTokenFromCache with environment aliases", () => {
        authorityMetadataStub.callsFake((host) => {
            const authorityMetadata = new AuthorityMetadataEntity();
            authorityMetadata.updateCloudDiscoveryMetadata({
                aliases: ["login.microsoftonline.com", "login.windows.net"],
                preferred_network: host,
                preferred_cache: host
            }, false);

            return authorityMetadata;
        });
        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            environment: "login.windows.net",
            tenantId: "mocked_tid",
            username: "mocked_username"
        };

        const cachedToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, false);
        expect(cachedToken.homeAccountId).to.equal("uid.utid");
        expect(cachedToken.environment).to.equal("login.microsoftonline.com");
    });
});
