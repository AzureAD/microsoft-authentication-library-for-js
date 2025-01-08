/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StaticAuthorityOptions } from "../../src/authority/AuthorityOptions.js";
import { RefreshTokenEntity } from "../../src/cache/entities/RefreshTokenEntity.js";
import { ICrypto } from "../../src/crypto/ICrypto.js";
import { Logger } from "../../src/logger/Logger.js";
import {
    AuthenticationScheme,
    CredentialType,
} from "../../src/utils/Constants.js";
import { MockStorageClass } from "../client/ClientTestUtils.js";
import {
    TEST_TOKENS,
    TEST_CRYPTO_VALUES,
    ID_TOKEN_CLAIMS,
    ID_TOKEN_ALT_CLAIMS,
    GUEST_ID_TOKEN_CLAIMS,
} from "../test_kit/StringConstants.js";
import { buildAccountFromIdTokenClaims, buildIdToken } from "msal-test-utils";

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
    async initializeCache(): Promise<void> {
        await this.createAccountEntries();
        await this.createIdTokenEntries();
        await this.createAccessTokenEntries();
        await this.createRefreshTokenEntries();
        this.createAppMetadataEntries();
        this.createAuthorityMetadataEntries();
    }

    // clear the cache
    async clearCache(): Promise<void> {
        await this.cacheManager.clear();
    }

    // create account entries in the cache
    async createAccountEntries(): Promise<void> {
        const account = buildAccountFromIdTokenClaims(ID_TOKEN_CLAIMS, [
            GUEST_ID_TOKEN_CLAIMS,
        ]);
        await this.cacheManager.setAccount(account);

        const accountWithNativeAccountId =
            buildAccountFromIdTokenClaims(ID_TOKEN_ALT_CLAIMS);
        accountWithNativeAccountId.nativeAccountId = "mocked_native_account_id";

        await this.cacheManager.setAccount(accountWithNativeAccountId);
    }

    // create id token entries in the cache
    async createIdTokenEntries(): Promise<void> {
        const idToken = buildIdToken(ID_TOKEN_CLAIMS, TEST_TOKENS.IDTOKEN_V2);

        await this.cacheManager.setIdTokenCredential(idToken);

        const guestIdToken = buildIdToken(
            GUEST_ID_TOKEN_CLAIMS,
            TEST_TOKENS.ID_TOKEN_V2_GUEST,
            { homeAccountId: idToken.homeAccountId }
        );

        await this.cacheManager.setIdTokenCredential(guestIdToken);

        const altIdToken = buildIdToken(
            ID_TOKEN_ALT_CLAIMS,
            TEST_TOKENS.IDTOKEN_V2_ALT,
            { environment: "login.windows.net" }
        );
        await this.cacheManager.setIdTokenCredential(altIdToken);
    }

    // create access token entries in the cache
    async createAccessTokenEntries(): Promise<void> {
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
        await this.cacheManager.setAccessTokenCredential(atOne);

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
        await this.cacheManager.setAccessTokenCredential(atTwo);

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

        await this.cacheManager.setAccessTokenCredential(atThree);

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
        await this.cacheManager.setAccessTokenCredential(
            bearerAtWithAuthScheme
        );

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
        await this.cacheManager.setAccessTokenCredential(popAtWithAuthScheme);

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
        await this.cacheManager.setAccessTokenCredential(sshAtWithAuthScheme);

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
        await this.cacheManager.setAccessTokenCredential(
            atWithUserAssertionHash
        );
    }

    // create refresh token entries in the cache
    async createRefreshTokenEntries(): Promise<void> {
        const rt: RefreshTokenEntity = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.REFRESH_TOKEN,
            secret: "a refresh token",
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
        };
        await this.cacheManager.setRefreshTokenCredential(rt);

        const rtFoci = {
            environment: "login.microsoftonline.com",
            credentialType: CredentialType.REFRESH_TOKEN,
            secret: "a refresh token",
            clientId: "mock_client_id",
            homeAccountId: "uid.utid",
            familyId: "1",
        };
        await this.cacheManager.setRefreshTokenCredential(rtFoci);
    }

    // create appMetadata entries
    createAppMetadataEntries(): void {
        const appMetaData = {
            environment: "login.microsoftonline.com",
            familyId: "1",
            clientId: "mock_client_id",
        };
        this.cacheManager.setAppMetadata(appMetaData);
    }

    // create authorityMetadata entries
    createAuthorityMetadataEntries(): void {
        const authorityMetadata = {
            aliases: [
                "login.microsoftonline.com",
                "login.windows.net",
                "login.microsoft.com",
                "sts.windows.net",
            ],
            aliasesFromNetwork: false,
            authorization_endpoint:
                "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            canonical_authority: "https://login.microsoftonline.com/common",
            end_session_endpoint:
                "https://login.microsoftonline.com/common/oauth2/v2.0/logout",
            endpointsFromNetwork: false,
            expiresAt: 1607952000,
            issuer: "https://login.microsoftonline.com/{tenantId}/v2.0",
            jwks_uri:
                "https://login.microsoftonline.com/common/discovery/v2.0/keys",
            preferred_cache: "login.windows.net",
            preferred_network: "login.microsoftonline.com",
            token_endpoint:
                "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        };

        const cacheKey = this.cacheManager.generateAuthorityMetadataCacheKey(
            authorityMetadata.preferred_cache
        );

        this.cacheManager.setAuthorityMetadata(cacheKey, authorityMetadata);
    }
}
