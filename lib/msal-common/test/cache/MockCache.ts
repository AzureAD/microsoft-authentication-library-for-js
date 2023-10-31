/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountEntity,
    AppMetadataEntity,
    AuthorityMetadataEntity,
    CacheManager,
    ICrypto,
    RefreshTokenEntity,
    Logger,
    StaticAuthorityOptions,
    CredentialType,
    AuthenticationScheme,
} from "../../src";
import { MockStorageClass } from "../client/ClientTestUtils";
import {
    TEST_TOKENS,
    TEST_CRYPTO_VALUES,
    ID_TOKEN_CLAIMS,
    ID_TOKEN_ALT_CLAIMS,
} from "../test_kit/StringConstants";

export class MockCache {
    cacheManager: MockStorageClass;

    constructor(
        clientId: string,
        cryptoImpl: ICrypto,
        staticAuthorityOptions?: StaticAuthorityOptions
    ) {
        this.cacheManager = new MockStorageClass(
            clientId,
            cryptoImpl,
            new Logger({}),
            staticAuthorityOptions
        );
    }

    // initialize the cache
    initializeCache(): void {
        this.createAccountEntries();
        this.createIdTokenEntries();
        this.createAccessTokenEntries();
        this.createRefreshTokenEntries();
        this.createAppMetadataEntries();
        this.createAuthorityMetadataEntries();
    }

    // clear the cache
    async clearCache(): Promise<void> {
        await this.cacheManager.clear();
    }

    // create account entries in the cache
    createAccountEntries(): void {
        const accountData = {
            username: "John Doe",
            localAccountId: "object1234",
            realm: ID_TOKEN_CLAIMS.tid,
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
        };
        const account = CacheManager.toObject(new AccountEntity(), accountData);
        this.cacheManager.setAccount(account);

        const accountDataWithNativeAccountId = {
            username: "Jane Doe",
            localAccountId: "object1234",
            realm: ID_TOKEN_ALT_CLAIMS.tid,
            environment: "login.windows.net",
            homeAccountId: "uid.utid2",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
            nativeAccountId: "mocked_native_account_id",
        };
        const accountWithNativeAccountId = CacheManager.toObject(
            new AccountEntity(),
            accountDataWithNativeAccountId
        );
        this.cacheManager.setAccount(accountWithNativeAccountId);
    }

    // create id token entries in the cache
    createIdTokenEntries(): void {
        const idToken = {
            realm: ID_TOKEN_CLAIMS.tid,
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ID_TOKEN,
            secret: TEST_TOKENS.IDTOKEN_V2,
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
        };

        this.cacheManager.setIdTokenCredential(idToken);

        const guestIdToken = {
            realm: ID_TOKEN_ALT_CLAIMS.tid,
            environment: "login.windows.net",
            credentialType: CredentialType.ID_TOKEN,
            secret: TEST_TOKENS.IDTOKEN_V2_ALT,
            clientId: "mock_client_id",
            homeAccountId: "uid.utid2",
        };

        this.cacheManager.setIdTokenCredential(guestIdToken);
    }

    // create access token entries in the cache
    createAccessTokenEntries(): void {
        const atOne = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN,
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: AuthenticationScheme.BEARER,
        };
        this.cacheManager.setAccessTokenCredential(atOne);

        const atTwo = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN,
            secret: "an access token",
            realm: "microsoft",
            target: "scope4 scope5",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: AuthenticationScheme.BEARER,
        };
        this.cacheManager.setAccessTokenCredential(atTwo);

        // With requested claims
        const atThree = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN,
            secret: "an access token",
            realm: "microsoft",
            target: "scope4 scope5",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: AuthenticationScheme.BEARER,
            requestedClaims: JSON.stringify({ claim: "claim" }),
            requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
        };

        this.cacheManager.setAccessTokenCredential(atThree);

        // BEARER with AuthScheme Token
        const bearerAtWithAuthScheme = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: AuthenticationScheme.BEARER,
        };
        this.cacheManager.setAccessTokenCredential(bearerAtWithAuthScheme);

        // POP Token
        const popAtWithAuthScheme = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: AuthenticationScheme.POP,
            keyId: "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y",
        };
        this.cacheManager.setAccessTokenCredential(popAtWithAuthScheme);

        // SSH Certificate
        const sshAtWithAuthScheme = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME,
            secret: "an SSH Cert",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: AuthenticationScheme.SSH,
            keyId: "some_key_id",
        };
        this.cacheManager.setAccessTokenCredential(sshAtWithAuthScheme);

        // userAssertionHash
        const atWithUserAssertionHash = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.ACCESS_TOKEN,
            secret: "an SSH Cert",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: AuthenticationScheme.SSH,
            userAssertionHash: "nFDCbX7CudvdluSPGh34Y-VKZIXRG1rquljNBbn7xuE",
        };
        this.cacheManager.setAccessTokenCredential(atWithUserAssertionHash);
    }

    // create refresh token entries in the cache
    createRefreshTokenEntries(): void {
        const rt: RefreshTokenEntity = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.REFRESH_TOKEN,
            secret: "a refresh token",
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
        };
        this.cacheManager.setRefreshTokenCredential(rt);

        const rtFoci = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.REFRESH_TOKEN,
            secret: "a refresh token",
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
            familyId: "1",
        };
        this.cacheManager.setRefreshTokenCredential(rtFoci);
    }

    // create appMetadata entries
    createAppMetadataEntries(): void {
        const appMetaData_data = {
            environment: "login.microsoftonline.com",
            familyId: "1",
            clientId: "mock_client_id",
        };
        const appMetaData = CacheManager.toObject(
            new AppMetadataEntity(),
            appMetaData_data
        );
        this.cacheManager.setAppMetadata(appMetaData);
    }

    // create authorityMetadata entries
    createAuthorityMetadataEntries(): void {
        const authorityMetadata_data = {
            aliases: [
                "login.microsoftonline.com",
                "login.windows.net",
                "login.microsoft.com",
                "sts.windows.net",
            ],
            aliasesFromNetwork: false,
            authorization_endpoint:
                "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            canonicalAuthority: "https://login.microsoftonline.com/common",
            end_session_endpoint:
                "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
            endpointsFromNetwork: false,
            expiresAt: 1607952000,
            issuer: "https://login.microsoftonline.com/{tenantId}/v2.0",
            jwks_uri:
                "https://login.microsoftonline.com/common/discovery/v2.0/keys",
            preferred_cache: "login.windows.net",
            token_endpoint:
                "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        };

        const authorityMetadata = CacheManager.toObject(
            new AuthorityMetadataEntity(),
            authorityMetadata_data
        );
        const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(
            authorityMetadata.preferred_cache
        );

        this.cacheManager.setAuthorityMetadata(cacheKey, authorityMetadata);
    }
}
