/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    JsonCache,
    InMemoryCache,
} from "../../../src/cache/serializer/SerializerTypes.js";
import { Deserializer } from "../../../src/cache/serializer/Deserializer.js";
import { MockCache } from "../cacheConstants.js";

const cacheJson = require("./cache.json");

describe("Deserializer test cases", () => {
    const cache = JSON.stringify(cacheJson);
    const jsonCache: JsonCache = Deserializer.deserializeJSONBlob(cache);

    test("deserializeJSONBlob", () => {
        const mockAccount = {
            "uid.utid-login.microsoftonline.com-utid": {
                username: "johndoe@microsoft.com",
                local_account_id: "uid",
                realm: "utid",
                environment: "login.microsoftonline.com",
                home_account_id: "uid.utid",
                authority_type: "MSSTS",
                client_info: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
                tenantProfiles: [
                    JSON.stringify({
                        tenantId: "utid",
                        localAccountId: "uid",
                        name: "John Doe",
                        isHomeTenant: true,
                    }),
                ],
            },
        };
        const acc = Deserializer.deserializeJSONBlob(cache);
        expect(acc.Account).toMatchObject(mockAccount);
    });

    test("deSerializeAccounts", () => {
        // serialize the mock Account and Test equivalency with the cache.json provided
        const accCache = Deserializer.deserializeAccounts(jsonCache.Account);
        expect(accCache[MockCache.accKey]).toEqual(
            expect.objectContaining(MockCache.acc)
        );
    });

    test("deSerializeIdTokens", () => {
        // serialize the mock IdToken and Test equivalency with the cache.json provided
        const idTCache = Deserializer.deserializeIdTokens(jsonCache.IdToken);
        const actualIdT = idTCache[MockCache.idTKey];

        // Check all properties except lastUpdatedAt
        expect(actualIdT.homeAccountId).toEqual(MockCache.idT.homeAccountId);
        expect(actualIdT.environment).toEqual(MockCache.idT.environment);
        expect(actualIdT.credentialType).toEqual(MockCache.idT.credentialType);
        expect(actualIdT.clientId).toEqual(MockCache.idT.clientId);
        expect(actualIdT.secret).toEqual(MockCache.idT.secret);
        expect(actualIdT.realm).toEqual(MockCache.idT.realm);
        expect(actualIdT.lastUpdatedAt).toBeDefined();
    });

    test("deSerializeAccessTokens", () => {
        // serialize the mock AccessToken and Test equivalency with the cache.json provided
        const atCache = Deserializer.deserializeAccessTokens(
            jsonCache.AccessToken
        );
        const actualAT = atCache[MockCache.atOneKey];

        // Check all properties except lastUpdatedAt and optional undefined properties
        expect(actualAT.homeAccountId).toEqual(MockCache.atOne.homeAccountId);
        expect(actualAT.environment).toEqual(MockCache.atOne.environment);
        expect(actualAT.credentialType).toEqual(MockCache.atOne.credentialType);
        expect(actualAT.clientId).toEqual(MockCache.atOne.clientId);
        expect(actualAT.secret).toEqual(MockCache.atOne.secret);
        expect(actualAT.realm).toEqual(MockCache.atOne.realm);
        expect(actualAT.target).toEqual(MockCache.atOne.target);
        expect(actualAT.cachedAt).toEqual(MockCache.atOne.cachedAt);
        expect(actualAT.expiresOn).toEqual(MockCache.atOne.expiresOn);
        expect(actualAT.extendedExpiresOn).toEqual(
            MockCache.atOne.extendedExpiresOn
        );
        expect(actualAT.userAssertionHash).toEqual(
            MockCache.atOne.userAssertionHash
        );
        expect(actualAT.lastUpdatedAt).toBeDefined();
    });

    test("deSerializeRefreshTokens", () => {
        // serialize the mock RefreshToken and Test equivalency with the cache.json provided
        const rtCache = Deserializer.deserializeRefreshTokens(
            jsonCache.RefreshToken
        );
        const actualRT = rtCache[MockCache.rtKey];

        // Check all properties except lastUpdatedAt and optional undefined properties
        expect(actualRT.homeAccountId).toEqual(MockCache.rt.homeAccountId);
        expect(actualRT.environment).toEqual(MockCache.rt.environment);
        expect(actualRT.credentialType).toEqual(MockCache.rt.credentialType);
        expect(actualRT.clientId).toEqual(MockCache.rt.clientId);
        expect(actualRT.secret).toEqual(MockCache.rt.secret);
        expect(actualRT.lastUpdatedAt).toBeDefined();
    });

    test("deserializeAppMetadata", () => {
        // serialize the mock AppMetadata and Test equivalency with the cache.json provided
        const amdtCache = Deserializer.deserializeAppMetadata(
            jsonCache.AppMetadata
        );
        expect(amdtCache[MockCache.amdtKey]).toEqual(
            expect.objectContaining(MockCache.amdt)
        );
    });

    test("deserializeAll", () => {
        // deserialize the cache from memory and Test equivalency with the generated mock cache
        const inMemoryCache: InMemoryCache =
            Deserializer.deserializeAllCache(jsonCache);

        expect(inMemoryCache.accounts[MockCache.accKey]).toEqual(
            expect.objectContaining(MockCache.acc)
        );

        // Check IdToken properties individually except lastUpdatedAt
        const actualIdT = inMemoryCache.idTokens[MockCache.idTKey];
        expect(actualIdT.homeAccountId).toEqual(MockCache.idT.homeAccountId);
        expect(actualIdT.environment).toEqual(MockCache.idT.environment);
        expect(actualIdT.credentialType).toEqual(MockCache.idT.credentialType);
        expect(actualIdT.clientId).toEqual(MockCache.idT.clientId);
        expect(actualIdT.secret).toEqual(MockCache.idT.secret);
        expect(actualIdT.realm).toEqual(MockCache.idT.realm);
        expect(actualIdT.lastUpdatedAt).toBeDefined();

        // Check AccessToken properties individually except lastUpdatedAt and undefined properties
        const actualAT1 = inMemoryCache.accessTokens[MockCache.atOneKey];
        expect(actualAT1.homeAccountId).toEqual(MockCache.atOne.homeAccountId);
        expect(actualAT1.environment).toEqual(MockCache.atOne.environment);
        expect(actualAT1.credentialType).toEqual(
            MockCache.atOne.credentialType
        );
        expect(actualAT1.clientId).toEqual(MockCache.atOne.clientId);
        expect(actualAT1.secret).toEqual(MockCache.atOne.secret);
        expect(actualAT1.realm).toEqual(MockCache.atOne.realm);
        expect(actualAT1.target).toEqual(MockCache.atOne.target);
        expect(actualAT1.cachedAt).toEqual(MockCache.atOne.cachedAt);
        expect(actualAT1.expiresOn).toEqual(MockCache.atOne.expiresOn);
        expect(actualAT1.extendedExpiresOn).toEqual(
            MockCache.atOne.extendedExpiresOn
        );
        expect(actualAT1.userAssertionHash).toEqual(
            MockCache.atOne.userAssertionHash
        );
        expect(actualAT1.lastUpdatedAt).toBeDefined();

        const actualAT2 = inMemoryCache.accessTokens[MockCache.atTwoKey];
        expect(actualAT2.homeAccountId).toEqual(MockCache.atTwo.homeAccountId);
        expect(actualAT2.environment).toEqual(MockCache.atTwo.environment);
        expect(actualAT2.credentialType).toEqual(
            MockCache.atTwo.credentialType
        );
        expect(actualAT2.clientId).toEqual(MockCache.atTwo.clientId);
        expect(actualAT2.secret).toEqual(MockCache.atTwo.secret);
        expect(actualAT2.realm).toEqual(MockCache.atTwo.realm);
        expect(actualAT2.target).toEqual(MockCache.atTwo.target);
        expect(actualAT2.cachedAt).toEqual(MockCache.atTwo.cachedAt);
        expect(actualAT2.expiresOn).toEqual(MockCache.atTwo.expiresOn);
        expect(actualAT2.extendedExpiresOn).toEqual(
            MockCache.atTwo.extendedExpiresOn
        );
        expect(actualAT2.lastUpdatedAt).toBeDefined();

        // Check RefreshToken properties individually except lastUpdatedAt and undefined properties
        const actualRT = inMemoryCache.refreshTokens[MockCache.rtKey];
        expect(actualRT.homeAccountId).toEqual(MockCache.rt.homeAccountId);
        expect(actualRT.environment).toEqual(MockCache.rt.environment);
        expect(actualRT.credentialType).toEqual(MockCache.rt.credentialType);
        expect(actualRT.clientId).toEqual(MockCache.rt.clientId);
        expect(actualRT.secret).toEqual(MockCache.rt.secret);
        expect(actualRT.lastUpdatedAt).toBeDefined();

        const actualRTF = inMemoryCache.refreshTokens[MockCache.rtFKey];
        expect(actualRTF.homeAccountId).toEqual(MockCache.rtF.homeAccountId);
        expect(actualRTF.environment).toEqual(MockCache.rtF.environment);
        expect(actualRTF.credentialType).toEqual(MockCache.rtF.credentialType);
        expect(actualRTF.clientId).toEqual(MockCache.rtF.clientId);
        expect(actualRTF.secret).toEqual(MockCache.rtF.secret);
        expect(actualRTF.familyId).toEqual(MockCache.rtF.familyId);
        expect(actualRTF.lastUpdatedAt).toBeDefined();

        expect(inMemoryCache.appMetadata[MockCache.amdtKey]).toEqual(
            expect.objectContaining(MockCache.amdt)
        );
    });
});
