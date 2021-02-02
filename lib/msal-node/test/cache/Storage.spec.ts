import { LogLevel, Logger, AccountEntity, CacheManager, AccessTokenEntity, AuthorityMetadataEntity } from '@azure/msal-common';
import { JsonCache, InMemoryCache } from './../../src/cache/serializer/SerializerTypes';
import { Deserializer } from './../../src/cache/serializer/Deserializer';
import { Storage } from './../../src/cache/Storage';
import { version, name } from '../../package.json';
import { DEFAULT_CRYPTO_IMPLEMENTATION, DEFAULT_OPENID_CONFIG_RESPONSE, TEST_CONSTANTS } from '../utils/TestConstants';

const cacheJson = require('./serializer/cache.json');
const clientId = TEST_CONSTANTS.CLIENT_ID;

describe("Storage tests for msal-node: ", () => {
    let inMemoryCache: InMemoryCache = {
        accounts: {},
        idTokens: {},
        accessTokens: {},
        refreshTokens: {},
        appMetadata: {},
    };

    let logger: Logger;


    beforeEach(() => {
        const cache = JSON.stringify(cacheJson);
        const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);
        inMemoryCache = Deserializer.deserializeAllCache(jsonCache);

        const loggerOptions = {
            loggerCallback: () => {
               // allow user to not set a loggerCallback
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
        logger = new Logger(loggerOptions!, name, version);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Constructor tests: ", () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
        expect(nodeStorage).toBeInstanceOf(Storage);

        const cache = nodeStorage.getCache();
        expect(Object.keys(cache).length).toBe(0);

        const inMemoryCache = nodeStorage.getInMemoryCache();
        expect(Object.keys(inMemoryCache.accessTokens).length).toBe(0);
    });

    it('setInMemoryCache() and getInMemoryCache() tests - tests for an account', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const cache = nodeStorage.getCache();
        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        const account: AccountEntity = cache[accountKey] as AccountEntity;
        expect(account).toBeInstanceOf(AccountEntity);
        expect(account.clientInfo).toBe(
            'eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ=='
        );

        const newInMemoryCache = nodeStorage.getInMemoryCache();
        expect(newInMemoryCache.accounts[accountKey]).toEqual(cache[accountKey]);
    });

    it('setItem() and getItem() tests - tests for an account', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = 'uid1.utid1-login.windows.net-samplerealm';
        const newMockAccount = {
            'uid1.utid1-login.windows.net-samplerealm': {
                username: 'Jane Doe',
                localAccountId: 'object5678',
                realm: 'samplerealm',
                environment: 'login.windows.net',
                homeAccountId: 'uid1.utid1',
                authorityType: 'MSSTS',
                clientInfo: 'eyJ1aWQiOiJ1aWQxIiwgInV0aWQiOiJ1dGlkMSJ9',
            },
        };
        let account = new AccountEntity();
        account = CacheManager.toObject(account, newMockAccount);

        nodeStorage.setItem(accountKey, account);
        const fetchedAccount = nodeStorage.getItem(accountKey);

        expect(fetchedAccount).toBeInstanceOf(AccountEntity);
        expect(account).toEqual(fetchedAccount);
    });

    it('setAccount() and getAccount() tests', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
        nodeStorage.setInMemoryCache(inMemoryCache);
        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        const fetchedAccount = nodeStorage.getAccount(accountKey);

        expect(fetchedAccount).toBeInstanceOf(AccountEntity);
        expect(fetchedAccount).toEqual(inMemoryCache.accounts[accountKey]);

        const mockAccountData = {
            username: 'Jane Doe',
            localAccountId: 'object5678',
            realm: 'samplerealm',
            environment: 'login.windows.net',
            homeAccountId: 'uid1.utid1',
            authorityType: 'MSSTS',
            clientInfo: 'eyJ1aWQiOiJ1aWQxIiwgInV0aWQiOiJ1dGlkMSJ9',
        };

        let mockAccountEntity = CacheManager.toObject(new AccountEntity(), mockAccountData);
        expect(mockAccountEntity).toBeInstanceOf(AccountEntity);
        nodeStorage.setAccount(mockAccountEntity);
        expect(nodeStorage.getAccount(mockAccountEntity.generateAccountKey())).toEqual(mockAccountEntity);
    });

    it('setCache() and getCache() tests - tests for an accessToken', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);

        const accessTokenKey = 'uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite';
        const newMockAT = {
            'uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite': {
                homeAccountId: 'uid1.utid1',
                environment: 'login.windows.net',
                credentialType: 'AccessToken',
                clientId: 'mock_client_id',
                secret: 'an access token',
                realm: 'samplerealm',
                target: 'scoperead scopewrite',
                cachedAt: '1000',
                expiresOn: '4600',
                extendedExpiresOn: '4600',
            }
        };

        let accessToken = new AccessTokenEntity();
        accessToken = CacheManager.toObject(accessToken, newMockAT);

        const cache = {
            'uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite': accessToken,
        };
        nodeStorage.setCache(cache);
        const readCache = nodeStorage.getCache();
        expect(readCache[accessTokenKey]).toEqual(accessToken);
    });

    it('setAccessTokenCredential() and getAccessTokenCredential() tests', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);

        const accessTokenKey = 'uid1.utid1-login.windows.net-accesstoken-mock_client_id-samplerealm-scoperead scopewrite';
        const newMockATData = {
            homeAccountId: 'uid1.utid1',
            environment: 'login.windows.net',
            credentialType: 'AccessToken',
            clientId: 'mock_client_id',
            secret: 'an access token',
            realm: 'samplerealm',
            target: 'scoperead scopewrite',
            cachedAt: '1000',
            expiresOn: '4600',
            extendedExpiresOn: '4600',
        };

        let accessToken = new AccessTokenEntity();
        accessToken = CacheManager.toObject(accessToken, newMockATData);

        nodeStorage.setAccessTokenCredential(accessToken);
        const fetchedAccessToken = nodeStorage.getAccessTokenCredential(accessTokenKey);
        expect(fetchedAccessToken).toEqual(accessToken);
    });

    it('containsKey() tests - tests for an accountKey', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        expect(nodeStorage.containsKey(accountKey)).toBeTruthy;
    });

    it('getKeys() tests - tests for an accountKey', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        expect(nodeStorage.getKeys().includes(accountKey)).toBeTruthy;
    });

    it('removeItem() tests - removes an account', () => {
        const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        const newInMemoryCache = nodeStorage.getInMemoryCache();
        expect(newInMemoryCache.accounts[accountKey]).toBeInstanceOf(AccountEntity);

        nodeStorage.removeItem(accountKey);
        expect(newInMemoryCache.accounts[accountKey]).toBeUndefined;
    });

    describe("Getters and Setters", () => {
        describe("AuthorityMetadata", () =>{
            const host = "login.microsoftonline.com";
            const key = `authority-metadata-${clientId}-${host}`;
            const testObj: AuthorityMetadataEntity = new AuthorityMetadataEntity();
            testObj.aliases = [host];
            testObj.preferred_cache = host;
            testObj.preferred_network = host;
            testObj.canonical_authority = TEST_CONSTANTS.DEFAULT_AUTHORITY;
            testObj.authorization_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.authorization_endpoint;
            testObj.token_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint;
            testObj.end_session_endpoint = DEFAULT_OPENID_CONFIG_RESPONSE.body.end_session_endpoint;
            testObj.issuer = DEFAULT_OPENID_CONFIG_RESPONSE.body.issuer;
            testObj.aliasesFromNetwork = false;
            testObj.endpointsFromNetwork = false;

            it("getAuthorityMetadata() returns null if key is not in cache", () => {
                const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
                expect(nodeStorage.containsKey(key)).toBe(false);
                expect(nodeStorage.getAuthorityMetadataKeys()).not.toContain(key);
                expect(nodeStorage.getAuthorityMetadata(key)).toBeNull;
            });

            it("getAuthorityMetadata() returns null if isAuthorityMetadataEntity returns false", () => {
                const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
                // @ts-ignore
                nodeStorage.setAuthorityMetadata(key, {});

                expect(nodeStorage.getAuthorityMetadata(key)).toBeNull;
                expect(nodeStorage.containsKey(key)).toBe(true);
                expect(nodeStorage.getAuthorityMetadataKeys()).toContain(key);
            });

            it("setAuthorityMetadata() and getAuthorityMetadata() sets and returns AuthorityMetadataEntity in-memory", () => {
                const nodeStorage = new Storage(logger, clientId, DEFAULT_CRYPTO_IMPLEMENTATION);
                nodeStorage.setAuthorityMetadata(key, testObj);

                expect(nodeStorage.getAuthorityMetadata(key)).toStrictEqual(testObj);
                expect(nodeStorage.containsKey(key)).toBe(true);
                expect(nodeStorage.getAuthorityMetadataKeys()).toContain(key);
            });
        });
    });
});

