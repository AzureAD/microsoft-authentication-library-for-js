/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AccountEntity,
    AppMetadataEntity,
    AuthorityMetadataEntity,
    CacheManager,
    ICrypto,
    IdTokenEntity,
    RefreshTokenEntity,
    Logger,
} from "../../src";
import { MockStorageClass } from "../client/ClientTestUtils";
import { TEST_TOKENS, TEST_CRYPTO_VALUES } from "../test_kit/StringConstants";

export class MockCache {
    cacheManager: MockStorageClass;

    constructor(clientId: string, cryptoImpl: ICrypto) {
        this.cacheManager = new MockStorageClass(
            clientId,
            cryptoImpl,
            new Logger({})
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
            realm: "microsoft",
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
            authorityType: "MSSTS",
            clientInfo: "eyJ1aWQiOiJ1aWQiLCAidXRpZCI6InV0aWQifQ==",
        };
        const account = CacheManager.toObject(new AccountEntity(), accountData);
        this.cacheManager.setAccount(account);

        const accountDataWithNativeAccountId = {
            username: "John Doe",
            localAccountId: "object1234",
            realm: "microsoft",
            environment: "login.microsoftonline.com",
            homeAccountId: "uid.utid",
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
        const idTokenData = {
            realm: "microsoft",
            environment: "login.microsoftonline.com",
            credentialType: "IdToken",
            secret: TEST_TOKENS.IDTOKEN_V2,
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
        };
        const idToken = CacheManager.toObject(new IdTokenEntity(), idTokenData);
        this.cacheManager.setIdTokenCredential(idToken);
    }

    // create access token entries in the cache
    createAccessTokenEntries(): void {
        const atOneData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            secret: "an access token",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: "Bearer",
        };
        const atOne = CacheManager.toObject(new AccessTokenEntity(), atOneData);
        this.cacheManager.setAccessTokenCredential(atOne);

        const atTwoData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            secret: "an access token",
            realm: "microsoft",
            target: "scope4 scope5",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: "Bearer",
        };
        const atTwo = CacheManager.toObject(new AccessTokenEntity(), atTwoData);
        this.cacheManager.setAccessTokenCredential(atTwo);

        // With requested claims
        const atThreeData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            secret: "an access token",
            realm: "microsoft",
            target: "scope4 scope5",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: "Bearer",
            requestedClaims: JSON.stringify({ claim: "claim" }),
            requestedClaimsHash: TEST_CRYPTO_VALUES.TEST_SHA256_HASH,
        };

        const atThree = CacheManager.toObject(
            new AccessTokenEntity(),
            atThreeData
        );
        this.cacheManager.setAccessTokenCredential(atThree);

        // BEARER with AuthScheme Token
        const bearerAtWithAuthSchemeData = {
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
            tokenType: "Bearer",
        };
        const bearerAtWithAuthScheme = CacheManager.toObject(
            new AccessTokenEntity(),
            bearerAtWithAuthSchemeData
        );
        this.cacheManager.setAccessTokenCredential(bearerAtWithAuthScheme);

        // POP Token
        const popAtWithAuthSchemeData = {
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
            tokenType: "pop",
            keyId: "V6N_HMPagNpYS_wxM14X73q3eWzbTr9Z31RyHkIcN0Y",
        };
        const popAtWithAuthScheme = CacheManager.toObject(
            new AccessTokenEntity(),
            popAtWithAuthSchemeData
        );
        this.cacheManager.setAccessTokenCredential(popAtWithAuthScheme);

        // SSH Certificate
        const sshAtWithAuthSchemeData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken_With_AuthScheme",
            secret: "an SSH Cert",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: "ssh-cert",
            keyId: "some_key_id",
        };
        const sshAtWithAuthScheme = CacheManager.toObject(
            new AccessTokenEntity(),
            sshAtWithAuthSchemeData
        );
        this.cacheManager.setAccessTokenCredential(sshAtWithAuthScheme);

        // userAssertionHash
        const atWithUserAssertionHashData = {
            environment: "login.microsoftonline.com",
            credentialType: "AccessToken",
            secret: "an SSH Cert",
            realm: "microsoft",
            target: "scope1 scope2 scope3",
            clientId: "mock_client_id",
            cachedAt: "1000",
            homeAccountId: "uid.utid",
            extendedExpiresOn: "4600",
            expiresOn: "4600",
            tokenType: "ssh-cert",
            userAssertionHash: "nFDCbX7CudvdluSPGh34Y-VKZIXRG1rquljNBbn7xuE",
        };
        const atWithUserAssertionHash = CacheManager.toObject(
            new AccessTokenEntity(),
            atWithUserAssertionHashData
        );
        this.cacheManager.setAccessTokenCredential(atWithUserAssertionHash);
    }

    // create refresh token entries in the cache
    createRefreshTokenEntries(): void {
        const rtData = {
            environment: "login.microsoftonline.com",
            credentialType: "RefreshToken",
            secret: "a refresh token",
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
        };
        const rt = CacheManager.toObject(new RefreshTokenEntity(), rtData);
        this.cacheManager.setRefreshTokenCredential(rt);

        const rtFociData = {
            environment: "login.microsoftonline.com",
            credentialType: "RefreshToken",
            secret: "a refresh token",
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
            familyId: "1",
        };
        const rtFoci = CacheManager.toObject(
            new RefreshTokenEntity(),
            rtFociData
        );
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
