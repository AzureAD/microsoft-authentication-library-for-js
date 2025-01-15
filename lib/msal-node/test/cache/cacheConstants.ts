/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    IdTokenEntity,
    RefreshTokenEntity,
    AccountEntity,
    AppMetadataEntity,
    CacheHelpers,
} from "@azure/msal-common";

// mock tokens
export const mockAccessTokenEntity_1: AccessTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "AccessToken",
    clientId: "mock_client_id",
    secret: "an access token",
    realm: "utid",
    target: "scope1 scope2 scope3",
    cachedAt: "1000",
    expiresOn: "4600",
    extendedExpiresOn: "4600",
    userAssertionHash: "mock_hash_string",
};

export const mockAccessTokenEntity_2: AccessTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "AccessToken",
    clientId: "mock_client_id",
    secret: "an access token",
    realm: "utid",
    target: "scope4 scope5",
    cachedAt: "1000",
    expiresOn: "4600",
    extendedExpiresOn: "4600",
};

export const mockIdTokenEntity: IdTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "IdToken",
    clientId: "mock_client_id",
    secret: "header.eyJvaWQiOiAib2JqZWN0MTIzNCIsICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAiSm9obiBEb2UiLCAic3ViIjogInN1YiJ9.signature",
    realm: "utid",
};

export const mockRefreshTokenEntity: RefreshTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "RefreshToken",
    clientId: "mock_client_id",
    secret: "a refresh token",
};

export const mockRefreshTokenEntityWithFamilyId: RefreshTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "RefreshToken",
    clientId: "mock_client_id",
    secret: "a refresh token",
    familyId: "1",
};

export const mockAccountEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    realm: "utid",
    localAccountId: "uid",
    username: "johndoe@microsoft.com",
    authorityType: "MSSTS",
    clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
    tenantProfiles: [
        {
            tenantId: "utid",
            localAccountId: "uid",
            name: "John Doe",
            isHomeTenant: true,
        },
    ],
};

export const mockAppMetaDataEntity = {
    clientId: "mock_client_id",
    environment: "login.microsoftonline.com",
    familyId: "1",
};

// generate mockCache
export class mockCache {
    static createMockATOne(): AccessTokenEntity {
        return mockAccessTokenEntity_1;
    }

    static createMockATTwo(): AccessTokenEntity {
        return mockAccessTokenEntity_2;
    }

    static createMockIdT(): IdTokenEntity {
        return mockIdTokenEntity;
    }

    static createMockRT(): RefreshTokenEntity {
        return mockRefreshTokenEntity;
    }

    static createMockRTWithFamilyId(): RefreshTokenEntity {
        return mockRefreshTokenEntityWithFamilyId;
    }

    static createMockAcc(): AccountEntity {
        const acc = new AccountEntity();
        Object.assign(acc, mockAccountEntity);

        return acc;
    }

    static createMockAmdt(): AppMetadataEntity {
        return mockAppMetaDataEntity;
    }
}

export const MockCache = {
    atOne: mockCache.createMockATOne(),
    atOneKey: CacheHelpers.generateCredentialKey(mockCache.createMockATOne()),
    atTwo: mockCache.createMockATTwo(),
    atTwoKey: CacheHelpers.generateCredentialKey(mockCache.createMockATTwo()),
    idT: mockCache.createMockIdT(),
    idTKey: CacheHelpers.generateCredentialKey(mockCache.createMockIdT()),
    rt: mockCache.createMockRT(),
    rtKey: CacheHelpers.generateCredentialKey(mockCache.createMockRT()),
    rtF: mockCache.createMockRTWithFamilyId(),
    rtFKey: CacheHelpers.generateCredentialKey(
        mockCache.createMockRTWithFamilyId()
    ),
    acc: mockCache.createMockAcc(),
    accKey: mockCache.createMockAcc().generateAccountKey(),
    amdt: mockCache.createMockAmdt(),
    amdtKey: CacheHelpers.generateAppMetadataKey(mockCache.createMockAmdt()),
};

// mock cache storage
export const MOCK_PARTITION_KEY = MockCache.acc.homeAccountId;
export const MOCK_CACHE_STORAGE = {
    [MOCK_PARTITION_KEY]: {
        Account: {
            [`${MOCK_PARTITION_KEY}-login.windows.net`]: mockAccountEntity,
        },
        IdToken: {
            [`${MOCK_PARTITION_KEY}-login.windows.net-idtoken`]:
                mockIdTokenEntity,
        },
        AccessToken: {
            [`${MOCK_PARTITION_KEY}-login.windows.net-accesstoken`]:
                mockAccessTokenEntity_1,
        },
        RefreshToken: {
            [`${MOCK_PARTITION_KEY}-login.windows.net-refreshtoken`]:
                mockRefreshTokenEntity,
        },
        AppMetadata: {
            [`${MOCK_PARTITION_KEY}-login.windows.net-appmetadata`]:
                mockAppMetaDataEntity,
        },
    },
};
export const MOCK_CACHE_STRING = () => JSON.stringify(MOCK_CACHE_STORAGE);
