/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../../../src/cache/entities/AccessTokenEntity";
import { IdTokenEntity } from "../../../src/cache/entities/IdTokenEntity";
import { RefreshTokenEntity } from "../../../src/cache/entities/RefreshTokenEntity";
import { AccountEntity } from "../../../src/cache/entities/AccountEntity";
import { AppMetadataEntity } from "../../../src/cache/entities/AppMetadataEntity";
import { AuthenticationScheme } from "../../../src/utils/Constants";
import { CacheHelpers } from "../../../src";
import { TEST_CONFIG } from "../../test_kit/StringConstants";

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

export const mockAccessTokenWithAuthSchemeEntity: AccessTokenEntity = {
    homeAccountId: "uid.utid",
    environment: "login.microsoftonline.com",
    credentialType: "AccessToken_With_AuthScheme",
    clientId: "mock_client_id",
    secret: "a pop access token",
    realm: "microsoft",
    target: "scope1 scope2 scope3",
    cachedAt: "1000",
    expiresOn: "4600",
    extendedExpiresOn: "4600",
    tokenType: "pop",
    keyId: "someKeyId123",
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

    static createMockAdfsAt(): AccessTokenEntity {
        const at = { ...mockAccessTokenEntity_1 };

        // @ts-ignore
        at.tokenType = AuthenticationScheme.BEARER.toLowerCase(); // ADFS may return type as "bearer" (lowercase)

        return at;
    }

    static createMockPopAT(): AccessTokenEntity {
        return mockAccessTokenWithAuthSchemeEntity;
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
        const amdt = {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
            environment: TEST_CONFIG.validAuthorityHost,
            familyId: TEST_CONFIG.THE_FAMILY_ID,
        };

        return amdt;
    }
}

export const MockCache = {
    atOne: mockCache.createMockATOne(),
    atOneKey: CacheHelpers.generateCredentialKey(mockCache.createMockATOne()),
    atTwo: mockCache.createMockATTwo(),
    atTwoKey: CacheHelpers.generateCredentialKey(mockCache.createMockATTwo()),
    popAt: mockCache.createMockPopAT(),
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
