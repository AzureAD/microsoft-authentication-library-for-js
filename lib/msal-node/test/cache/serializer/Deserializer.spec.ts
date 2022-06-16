import { JsonCache, InMemoryCache } from '../../../src/cache/serializer/SerializerTypes';
import { Deserializer } from '../../../src/cache/serializer/Deserializer';
import { MockCache } from '../cacheConstants';

const cacheJson = require('./cache.json');

describe('Deserializer test cases', () => {
    const cache = JSON.stringify(cacheJson);
    const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);

    test('deserializeJSONBlob', () => {
        const mockAccount = {
            'uid.utid-login.microsoftonline.com-microsoft': {
                username: 'John Doe',
                local_account_id: 'object1234',
                realm: 'microsoft',
                environment: 'login.microsoftonline.com',
                home_account_id: 'uid.utid',
                authority_type: 'MSSTS',
                client_info: 'eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==',
            },
        };
        const acc = Deserializer.deserializeJSONBlob(cache);
        expect(acc.Account).toMatchObject(mockAccount);
    });

    test('deSerializeAccounts', () => {
        // serialize the mock Account and Test equivalency with the cache.json provided
        const accCache = Deserializer.deserializeAccounts(jsonCache.Account);
        expect(accCache[MockCache.accKey]).toEqual(MockCache.acc);
    });

    test('deSerializeIdTokens', () => {
        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const idTCache = Deserializer.deserializeIdTokens(jsonCache.IdToken);
        expect(idTCache[MockCache.idTKey]).toEqual(MockCache.idT);
    });

    test('deSerializeAccessTokens', () => {
        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const atCache = Deserializer.deserializeAccessTokens(jsonCache.AccessToken);
        expect(atCache[MockCache.atOneKey]).toEqual(MockCache.atOne);
    });

    test('deSerializeRefreshTokens', () => {
        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const rtCache = Deserializer.deserializeRefreshTokens(jsonCache.RefreshToken);
        expect(rtCache[MockCache.rtKey]).toEqual(MockCache.rt);
    });

    test('deserializeAppMetadata', () => {
        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const amdtCache = Deserializer.deserializeAppMetadata(jsonCache.AppMetadata);
        expect(amdtCache[MockCache.amdtKey]).toEqual(MockCache.amdt);
    });

    test('deserializeAll', () => {
        // deserialize the cache from memory and Test equivalency with the generated mock cache
        const inMemoryCache: InMemoryCache = Deserializer.deserializeAllCache(jsonCache);

        expect(inMemoryCache.accounts[MockCache.accKey]).toEqual(MockCache.acc);
        expect(inMemoryCache.idTokens[MockCache.idTKey]).toEqual(MockCache.idT);
        expect(inMemoryCache.accessTokens[MockCache.atOneKey]).toEqual(MockCache.atOne);
        expect(inMemoryCache.accessTokens[MockCache.atTwoKey]).toEqual(MockCache.atTwo);
        expect(inMemoryCache.refreshTokens[MockCache.rtKey]).toEqual(MockCache.rt);
        expect(inMemoryCache.refreshTokens[MockCache.rtFKey]).toEqual(MockCache.rtF);
        expect(inMemoryCache.appMetadata[MockCache.amdtKey]).toEqual(MockCache.amdt);
    });
});
