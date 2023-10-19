import {
    AccessTokenEntity,
    IdTokenEntity,
    RefreshTokenEntity,
    AccountEntity,
    AppMetadataEntity,
    CacheHelpers,
} from "@azure/msal-common";

export const MOCK_PARTITION_KEY = "mock_partition_key";
export const MOCK_CACHE_STRING = "mock_cache_string";

// mock tokens
export const mockAccessTokenEntity_1: AccessTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "AccessToken",
    clientId: "mock_client_id",
    secret: "an access token",
    realm: "microsoft",
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
    realm: "microsoft",
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
    realm: "microsoft",
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
    realm: "microsoft",
    localAccountId: "object1234",
    username: "John Doe",
    authorityType: "MSSTS",
    clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
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
        const amdt = new AppMetadataEntity();
        Object.assign(amdt, mockAppMetaDataEntity);

        return amdt;
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
    amdtKey: mockCache.createMockAmdt().generateAppMetadataKey(),
};
