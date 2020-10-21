import { LogLevel, Logger, AccountEntity, CacheManager, AccessTokenEntity } from '@azure/msal-common';
import { JsonCache, InMemoryCache } from './../../src/cache/serializer/SerializerTypes';
import { Deserializer } from './../../src/cache/serializer/Deserializer';
import { Storage } from './../../src/cache/Storage';
import debug from 'debug';

const cacheJson = require('./serializer/cache.json');

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
            loggerCallback: (
                level: LogLevel,
                message: string,
                containsPii: boolean
            ) => {
                debug(`msal:${LogLevel[level]}${containsPii ? '-Pii' : ''}`)(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
        logger = new Logger(loggerOptions!);
    });

    it("Constructor tests: ", () => {
        const nodeStorage = new Storage(logger);
        expect(nodeStorage).toBeInstanceOf(Storage);

        const cache = nodeStorage.getCache();
        expect(Object.keys(cache).length).toBe(0);

        const inMemoryCache = nodeStorage.getInMemoryCache();
        expect(Object.keys(inMemoryCache.accessTokens).length).toBe(0);
    });

    it('setInMemoryCache() and getInMemoryCache() tests - tests for an account', () => {
        const nodeStorage = new Storage(logger);
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
        const nodeStorage = new Storage(logger);
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
        const nodeStorage = new Storage(logger);
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
        nodeStorage.setAccount(mockAccountEntity.generateAccountKey(), mockAccountEntity);
        expect(nodeStorage.getAccount(mockAccountEntity.generateAccountKey())).toEqual(mockAccountEntity);
    });

    it('setCache() and getCache() tests - tests for an accessToken', () => {
        const nodeStorage = new Storage(logger);

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
        const nodeStorage = new Storage(logger);

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

        nodeStorage.setAccessTokenCredential(accessToken.generateCredentialKey(), accessToken);
        const fetchedAccessToken = nodeStorage.getAccessTokenCredential(accessTokenKey);
        expect(fetchedAccessToken).toEqual(accessToken);
    });

    it('containsKey() tests - tests for an accountKey', () => {
        const nodeStorage = new Storage(logger);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        expect(nodeStorage.containsKey(accountKey)).toBeTruthy;
    });

    it('getKeys() tests - tests for an accountKey', () => {
        const nodeStorage = new Storage(logger);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        expect(nodeStorage.getKeys().includes(accountKey)).toBeTruthy;
    });

    it('removeItem() tests - removes an account', () => {
        const nodeStorage = new Storage(logger);
        nodeStorage.setInMemoryCache(inMemoryCache);

        const accountKey = 'uid.utid-login.microsoftonline.com-microsoft';
        const newInMemoryCache = nodeStorage.getInMemoryCache();
        expect(newInMemoryCache.accounts[accountKey]).toBeInstanceOf(AccountEntity);

        nodeStorage.removeItem(accountKey);
        expect(newInMemoryCache.accounts[accountKey]).toBeUndefined;
    });
});

