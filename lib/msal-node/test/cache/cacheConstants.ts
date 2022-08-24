import { AccessTokenEntity, IdTokenEntity, RefreshTokenEntity, AccountEntity, AppMetadataEntity } from "@azure/msal-common";

export const MOCK_PARTITION_KEY = "mock_partition_key";
export const MOCK_CACHE_STRING = "mock_cache_string";

// mock tokens
export const mockAccessTokenEntity_1 = {
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
};

export const mockAccessTokenEntity_2 = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "AccessToken",
    clientId: "mock_client_id",
    secret: "an access token",
    realm: "microsoft",
    target: "scope4 scope5",
    cachedAt: "1000",
    expiresOn: "4600",
    extendedExpiresOn: "4600"
};

export const mockIdTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "IdToken",
    clientId: "mock_client_id",
    secret: "header.eyJvaWQiOiAib2JqZWN0MTIzNCIsICJwcmVmZXJyZWRfdXNlcm5hbWUiOiAiSm9obiBEb2UiLCAic3ViIjogInN1YiJ9.signature",
    realm: "microsoft"
};

export const mockRefreshTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "RefreshToken",
    clientId: "mock_client_id",
    secret: "a refresh token"
};

export const mockRefreshTokenEntityWithFamilyId = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "RefreshToken",
    clientId: "mock_client_id",
    secret: "a refresh token",
    familyId: "1"
};

export const mockAccountEntity = {
    homeAccountId: "uid.utid",
    environment:  "login.microsoftonline.com",
    realm: "microsoft",
    localAccountId: "object1234",
    username: "John Doe",
    authorityType: "MSSTS",
    clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
};

export const mockAppMetaDataEntity = {
    clientId: "mock_client_id",
    environment: "login.microsoftonline.com",
    familyId: "1"
};

// generate mockCache
export class mockCache {

    static createMockATOne(): AccessTokenEntity {
        const at = new AccessTokenEntity();
        Object.assign(at, mockAccessTokenEntity_1);

        return at;
    }

    static createMockATTwo(): AccessTokenEntity {
        const at = new AccessTokenEntity();
        Object.assign(at, mockAccessTokenEntity_2);

        return at;
    }

    static createMockIdT(): IdTokenEntity {
        const idt = new IdTokenEntity();
        Object.assign(idt, mockIdTokenEntity);

        return idt;
    }

    static createMockRT(): RefreshTokenEntity {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntity);

        return rt;
    }

    static createMockRTWithFamilyId(): RefreshTokenEntity {
        const rt = new RefreshTokenEntity();
        Object.assign(rt, mockRefreshTokenEntityWithFamilyId);

        return rt;
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
    atOneKey: mockCache.createMockATOne().generateCredentialKey(),
    atTwo: mockCache.createMockATTwo(),
    atTwoKey: mockCache.createMockATTwo().generateCredentialKey(),
    idT: mockCache.createMockIdT(),
    idTKey: mockCache.createMockIdT().generateCredentialKey(),
    rt: mockCache.createMockRT(),
    rtKey: mockCache.createMockRT().generateCredentialKey(),
    rtF: mockCache.createMockRTWithFamilyId(),
    rtFKey: mockCache.createMockRTWithFamilyId().generateCredentialKey(),
    acc: mockCache.createMockAcc(),
    accKey: mockCache.createMockAcc().generateAccountKey(),
    amdt: mockCache.createMockAmdt(),
    amdtKey: mockCache.createMockAmdt().generateAppMetadataKey()
};
