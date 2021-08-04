import { AuthenticationScheme, CredentialType } from "../../src/utils/Constants";
import { AccountEntity } from "../../src/cache/entities/AccountEntity";
import { AccessTokenEntity } from "../../src/cache/entities/AccessTokenEntity";
import { CacheRecord } from "../../src/cache/entities/CacheRecord";
import { AccountFilter, CredentialFilter } from "../../src/cache/utils/CacheTypes";
import sinon from "sinon";
import { ScopeSet } from "../../src/request/ScopeSet";
import {
    TEST_CONFIG,
    TEST_TOKENS,
    CACHE_MOCKS
} from "../test_kit/StringConstants";
import { ClientAuthError, ClientAuthErrorMessage } from "../../src/error/ClientAuthError";
import { AccountInfo } from "../../src/account/AccountInfo";
import { MockCache } from "./MockCache";
import { mockCrypto } from "../client/ClientTestUtils";
import { TestError } from "../test_kit/TestErrors";
import { CacheManager } from "../../src/cache/CacheManager";
import { AuthorityMetadataEntity } from "../../src/cache/entities/AuthorityMetadataEntity";
import { AppMetadataEntity } from "../../src/cache/entities/AppMetadataEntity";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity";
import { IdTokenEntity } from "../../src/cache/entities/IdTokenEntity";

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

    afterEach(async () => {
        await mockCache.clearCache();
        sinon.restore();
    });

    it("save account", async () => {
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
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);
        const mockCacheAccount = mockCache.cacheManager.getAccount(accountKey) as AccountEntity;
        if (!mockCacheAccount) {
            throw TestError.createTestSetupError("mockCacheAccount does not have a value");
        }
        expect(mockCacheAccount.homeAccountId).toEqual("someUid.someUtid");
    });

    it("save accessToken", async () => {
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
            tokenType: "Bearer"
        });

        const atKey = at.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = at;
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);
        const mockCacheAT = mockCache.cacheManager.getAccessTokenCredential(atKey) as AccessTokenEntity;
        if (!mockCacheAT) {
            throw TestError.createTestSetupError("mockCacheAT does not have a value");
        }
        expect(mockCacheAT.homeAccountId).toEqual("someUid.someUtid");
        expect(mockCacheAT.credentialType).toEqual(CredentialType.ACCESS_TOKEN);
        expect(mockCacheAT.tokenType).toEqual(AuthenticationScheme.BEARER);
    });

    it("save accessToken with Auth Scheme (pop)", async () => {
        const at = new AccessTokenEntity();
        Object.assign(at, {
            homeAccountId: "someUid.someUtid",
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken_With_AuthScheme",
            clientId: "mock_client_id",
            secret: "an access token sample",
            realm: "microsoft",
            target: "scope6 scope7",
            cachedAt: "1000",
            expiresOn: "4600",
            extendedExpiresOn: "4600",
            keyId: "some_key",
            tokenType: "pop"
        });

        const atKey = at.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = at;
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);
        const mockCacheAT = mockCache.cacheManager.getAccessTokenCredential(atKey) as AccessTokenEntity;
        if (!mockCacheAT) {
            throw TestError.createTestSetupError("mockCacheAT does not have a value");
        }
        expect(mockCacheAT.homeAccountId).toEqual("someUid.someUtid");
        expect(mockCacheAT.credentialType).toEqual(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);
        expect(mockCacheAT.tokenType).toEqual(AuthenticationScheme.POP);
        expect(mockCacheAT.keyId).toBeDefined();
    });

    it("getAccount", async () => {
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
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        const cacheAccount = mockCache.cacheManager.getAccount(accountKey) as AccountEntity;
        expect(cacheAccount.homeAccountId).toEqual("someUid.someUtid");
        expect(mockCache.cacheManager.getAccount("")).toBeNull();
    });

    it("getAccessTokenCredential (Bearer)", async () => {
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
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        const cachedAccessToken = mockCache.cacheManager.getAccessTokenCredential(credKey) as AccessTokenEntity;
        expect(cachedAccessToken.homeAccountId).toEqual("someUid.someUtid");
        expect(cachedAccessToken.credentialType).toEqual(CredentialType.ACCESS_TOKEN);
    });

    it("getAccessTokenCredential (POP)", async () => {
        const accessTokenEntity = new AccessTokenEntity();
        accessTokenEntity.homeAccountId = "someUid.someUtid";
        accessTokenEntity.environment = "login.microsoftonline.com";
        accessTokenEntity.realm = "microsoft";
        accessTokenEntity.clientId = "mock_client_id";
        accessTokenEntity.credentialType = CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME;
        accessTokenEntity.target = "scope6 scope7";

        const credKey = accessTokenEntity.generateCredentialKey();
        const cacheRecord = new CacheRecord();
        cacheRecord.accessToken = accessTokenEntity;
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        const cachedAccessToken = mockCache.cacheManager.getAccessTokenCredential(credKey) as AccessTokenEntity;
        expect(cachedAccessToken.homeAccountId).toEqual("someUid.someUtid");
        expect(cachedAccessToken.credentialType).toEqual(CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME);

    });

    describe("getAccountsFilteredBy", () => {

        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: AccountFilter = { homeAccountId: "uid.utid" };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { homeAccountId: "Wrong Id" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("environment filter", () => {
            // filter by environment
            const successFilter: AccountFilter = { environment: "login.microsoftonline.com" };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).toEqual(1);
            sinon.restore();

            const wrongFilter: AccountFilter = { environment: "Wrong Env" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: AccountFilter = { realm: "microsoft" };
            let accounts = mockCache.cacheManager.getAccountsFilteredBy(successFilter);
            expect(Object.keys(accounts).length).toEqual(1);

            const wrongFilter: AccountFilter = { realm: "Wrong Realm" };
            accounts = mockCache.cacheManager.getAccountsFilteredBy(wrongFilter);
            expect(Object.keys(accounts).length).toEqual(0);
        });
    });

    describe("getCredentials", () => {

        it("homeAccountId filter", () => {
            // filter by homeAccountId
            const successFilter: CredentialFilter = { homeAccountId: "uid.utid" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(1);
            expect(Object.keys(credentials.accessTokens).length).toEqual(3);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(2);

            const wrongFilter: CredentialFilter = { homeAccountId: "someuid.someutid" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(0);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);
        });

        it("environment filter", () => {
            // filter by environment
            const successFilter: CredentialFilter = { environment: "login.microsoftonline.com" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(1);
            expect(Object.keys(credentials.accessTokens).length).toEqual(3);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(2);
            sinon.restore();

            const wrongFilter: CredentialFilter = { environment: "Wrong Env" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(0);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);
        });

        it("realm filter", () => {
            // filter by realm
            const successFilter: CredentialFilter = { realm: "microsoft" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(1);
            expect(Object.keys(credentials.accessTokens).length).toEqual(3);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);

            const wrongFilter: CredentialFilter = { realm: "Wrong Realm" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(0);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);
        });

        it("credentialType filter", () => {
            // filter by credentialType
            const successFilter: CredentialFilter = { credentialType: "IdToken" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(1);
            expect(Object.keys(credentials.accessTokens).length).toEqual(0);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);

            const wrongFilter: CredentialFilter = { credentialType: "Incorrect" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(0);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);
        });

        it("credentialType filter (Access Tokens with and without Auth Scheme)", () => {
            // filter by credentialType
            const successFilter: CredentialFilter = { credentialType: "AccessToken" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            // There are two Bearer tokens in the mock cache
            expect(Object.keys(credentials.accessTokens).length).toEqual(2);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);

            const wrongFilter: CredentialFilter = { credentialType: "AccessToken_With_AuthScheme" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            // There is one POP token in the mock cache
            expect(Object.keys(credentials.accessTokens).length).toEqual(1);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);
        });

        it("clientId filter", () => {
            // filter by clientId
            const successFilter: CredentialFilter = { clientId: "mock_client_id" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(1);
            expect(Object.keys(credentials.accessTokens).length).toEqual(3);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(1);

            const wrongFilter: CredentialFilter = { clientId: "Wrong Client ID" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(0);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);
        });

        it("target filter", () => {
            // filter by target
            const successFilter = { target: "scope1 scope2 scope3" };
            let credentials = mockCache.cacheManager.getCredentialsFilteredBy(successFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(2);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);

            const wrongFilter = { target: "wrong target" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(wrongFilter);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(0);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);

            const filterOidcscopes = { target: "scope1 scope2 scope3 offline_access openid profile" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(filterOidcscopes);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(2);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);

            const filterScopesCase = { target: "scope1 scope2 SCOPE3 offline_access openid profile" };
            credentials = mockCache.cacheManager.getCredentialsFilteredBy(filterScopesCase);
            expect(Object.keys(credentials.idTokens).length).toEqual(0);
            expect(Object.keys(credentials.accessTokens).length).toEqual(2);
            expect(Object.keys(credentials.refreshTokens).length).toEqual(0);
        });
    });

    it("getAppMetadata and readAppMetadataFromCache", () => {
        const appMetadataKey = "appmetadata-login.microsoftonline.com-mock_client_id_1";
        const appMetadata = mockCache.cacheManager.getAppMetadata(appMetadataKey) as AppMetadataEntity;
        if (!appMetadata) {
            throw TestError.createTestSetupError("appMetadata does not have a value");
        }

        expect(appMetadata.clientId).toEqual(CACHE_MOCKS.MOCK_CLIENT_ID_1);
        expect(appMetadata.environment).toEqual(CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment);

        const cachedAppMetadata = mockCache.cacheManager.readAppMetadataFromCache(CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment, CACHE_MOCKS.MOCK_CLIENT_ID_1) as AppMetadataEntity;
        if (!cachedAppMetadata) {
            throw TestError.createTestSetupError("appMetadata does not have a value");
        }
        expect(cachedAppMetadata.clientId).toEqual(CACHE_MOCKS.MOCK_CLIENT_ID_1);
        expect(cachedAppMetadata.environment).toEqual(CACHE_MOCKS.MOCK_ACCOUNT_INFO.environment);
    });

    it("removeAppMetadata", () => {
        mockCache.cacheManager.removeAppMetadata();
        expect(mockCache.cacheManager.getAppMetadata("appmetadata-login.microsoftonline.com-mock_client_id_1")).toBeUndefined();
    });

    it("removeAllAccounts", async () => {
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
        await mockCache.cacheManager.saveCacheRecord(cacheRecord);

        await mockCache.cacheManager.removeAllAccounts();

        // Only app metadata remaining
        expect(mockCache.cacheManager.getKeys().length === 1).toBe(true);
    });

    it("removeAccount", async () => {
        expect(mockCache.cacheManager.getAccount("uid.utid-login.microsoftonline.com-microsoft")).not.toBeNull();
        await mockCache.cacheManager.removeAccount("uid.utid-login.microsoftonline.com-microsoft");
        expect(mockCache.cacheManager.getAccount("uid.utid-login.microsoftonline.com-microsoft")).toBeNull();
    });

    it("removeCredential", async () => {
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

        await mockCache.cacheManager.removeCredential(at);
        const atKey = at.generateCredentialKey();
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
    });

    it("removes token binding key when removeCredential is called for an AccessToken_With_AuthScheme credential", async () =>{
        const atWithAuthScheme = new AccessTokenEntity();
        const atWithAuthSchemeData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken_With_AuthScheme",
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            keyId: "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y",
            tokenType: "pop"
        };

        const removeTokenBindingKeySpy = sinon.spy(mockCrypto, "removeTokenBindingKey");

        Object.assign(atWithAuthScheme, atWithAuthSchemeData);

        await mockCache.cacheManager.removeCredential(atWithAuthScheme);
        const atKey = atWithAuthScheme.generateCredentialKey();
        expect(mockCache.cacheManager.getAccount(atKey)).toBeNull();
        expect(removeTokenBindingKeySpy.getCall(0).args[0]).toEqual(atWithAuthSchemeData.keyId);
    });

    it("throws bindingKeyNotRemoved error when key isn't deleted from storage", async () =>{
        const atWithAuthScheme = new AccessTokenEntity();
        const atWithAuthSchemeData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken_With_AuthScheme",
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            keyId: "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y",
            tokenType: "pop"
        };
        
        Object.assign(atWithAuthScheme, atWithAuthSchemeData);

        jest.spyOn(mockCrypto, "removeTokenBindingKey").mockImplementation((keyId: string): Promise<boolean> => {
            return Promise.reject();
        });

        return await expect(mockCache.cacheManager.removeCredential(atWithAuthScheme)).rejects.toThrow(ClientAuthError.createBindingKeyNotRemovedError());
    });

    it("readAccessTokenFromCache matches multiple tokens, throws error", () => {
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", "an_access_token", CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, 500, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);

        const mockedAtEntity2: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", "an_access_token", CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, "User.Read test_scope", 4600, 4600, mockCrypto, 500, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);

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
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe"
        };
        if (!mockedAccountInfo) {
            throw TestError.createTestSetupError("mockedAccountInfo does not have a value");
        }
        expect(() => mockCache.cacheManager.readAccessTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, new ScopeSet(["user.read"]), AuthenticationScheme.BEARER)).toThrowError(`${ClientAuthErrorMessage.multipleMatchingTokens.desc}`);
    });

    it("readAccessTokenFromCache only matches a Bearer Token when Authentication Scheme is set to Bearer", () => {
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", "access_token", CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, 500, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);

        const mockedPopAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", TEST_TOKENS.POP_TOKEN, CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, "User.Read test_scope", 4600, 4600, mockCrypto, 500, AuthenticationScheme.POP, TEST_TOKENS.ACCESS_TOKEN);

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
        mockCache.cacheManager.setAccessTokenCredential(mockedPopAtEntity);
        mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe"
        };
        expect(mockCache.cacheManager.readAccessTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, new ScopeSet(["user.read"]), AuthenticationScheme.BEARER)).toEqual(mockedAtEntity);
        expect(() => mockCache.cacheManager.readAccessTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, new ScopeSet(["user.read"]), AuthenticationScheme.BEARER)).not.toThrowError(`${ClientAuthErrorMessage.multipleMatchingTokens.desc}`);
    });

    it("readAccessTokenFromCache only matches a POP Token when Authentication Scheme is set to pop", () => {
        const mockedAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", "access_token", CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, TEST_CONFIG.DEFAULT_GRAPH_SCOPE.toString(), 4600, 4600, mockCrypto, 500, AuthenticationScheme.BEARER, TEST_TOKENS.ACCESS_TOKEN);

        const mockedPopAtEntity: AccessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            "uid.utid", "login.microsoftonline.com", TEST_TOKENS.POP_TOKEN, CACHE_MOCKS.MOCK_CLIENT_ID, TEST_CONFIG.TENANT, "User.Read test_scope", 4600, 4600, mockCrypto, 500, AuthenticationScheme.POP, TEST_TOKENS.ACCESS_TOKEN);

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
        mockCache.cacheManager.setAccessTokenCredential(mockedPopAtEntity);
        mockCache.cacheManager.setAccount(mockedAccount);

        const mockedAccountInfo: AccountInfo = {
            homeAccountId: "uid.utid",
            localAccountId: "uid",
            environment: "login.microsoftonline.com",
            tenantId: TEST_CONFIG.TENANT,
            username: "John Doe"
        };
        expect(mockCache.cacheManager.readAccessTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, new ScopeSet(["user.read"]), AuthenticationScheme.POP)).toEqual(mockedPopAtEntity);
        expect(() => mockCache.cacheManager.readAccessTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, new ScopeSet(["user.read"]), AuthenticationScheme.POP)).not.toThrowError(`${ClientAuthErrorMessage.multipleMatchingTokens.desc}`);
    });

    it("readIdTokenFromCache", () => {
        const idToken = mockCache.cacheManager.readIdTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, CACHE_MOCKS.MOCK_ACCOUNT_INFO) as IdTokenEntity;
        if (!idToken) {
            throw TestError.createTestSetupError("idToken does not have a value");
        }
        expect(idToken.clientId).toBe(CACHE_MOCKS.MOCK_CLIENT_ID);
    });

    it("readRefreshTokenFromCache", () => {
        const refreshToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID_1, CACHE_MOCKS.MOCK_ACCOUNT_INFO, false) as RefreshTokenEntity;
        if (!refreshToken) {
            throw TestError.createTestSetupError("refreshToken does not have a value");
        }
        expect(refreshToken.clientId).toBe(CACHE_MOCKS.MOCK_CLIENT_ID_1);
    });

    it("readRefreshTokenFromCache Error", () => {
        const refreshToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, CACHE_MOCKS.MOCK_ACCOUNT_INFO, true);
        expect(refreshToken).toBe(null);
    });

    it("readRefreshTokenFromCache with familyId", () => {
        const refreshToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID_1, CACHE_MOCKS.MOCK_ACCOUNT_INFO, true) as RefreshTokenEntity;
        if (!refreshToken) {
            throw TestError.createTestSetupError("refreshToken does not have a value");
        }
        expect(refreshToken.clientId).toBe(CACHE_MOCKS.MOCK_CLIENT_ID_1);
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
            localAccountId: "uid",
            environment: "login.windows.net",
            tenantId: "mocked_tid",
            username: "mocked_username"
        };

        const cachedToken = mockCache.cacheManager.readRefreshTokenFromCache(CACHE_MOCKS.MOCK_CLIENT_ID, mockedAccountInfo, false) as RefreshTokenEntity;
        if (!cachedToken) {
            throw TestError.createTestSetupError("refreshToken does not have a value");
        }
        expect(cachedToken.homeAccountId).toBe("uid.utid");
        expect(cachedToken.environment).toBe("login.microsoftonline.com");
    });
});
