/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AuthenticationResult,
    Authority,
    AuthorityOptions,
    CacheManager,
    ClientAuthErrorCodes,
    Constants,
    CredentialFilter,
    CredentialType,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    DEFAULT_TOKEN_RENEWAL_OFFSET_SEC,
    DefaultStorageClass,
    INetworkModule,
    Logger,
    ProtocolMode,
    ResponseHandler,
    ScopeSet,
    TimeUtils,
    createClientAuthError,
} from "@azure/msal-common";
import { ServiceFabric } from "./ManagedIdentitySources/ServiceFabric";
import { AppService } from "./ManagedIdentitySources/AppService";
import { CloudShell } from "./ManagedIdentitySources/CloudShell";
import { AzureArc } from "./ManagedIdentitySources/AzureArc";
import { Imds } from "./ManagedIdentitySources/Imds";
import {
    ManagedIdentityConfiguration,
    ManagedIdentityNodeConfiguration,
    buildManagedIdentityConfiguration,
} from "../config/Configuration";
import { version, name } from "../packageMetadata.js";
import { ManagedIdentityRequest } from "../request/ManagedIdentityRequest";
import { ManagedIdentityId } from "../config/ManagedIdentityId";
import { CryptoProvider } from "../crypto/CryptoProvider";
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../error/ManagedIdentityError";

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
    private managedIdentityId: ManagedIdentityId;

    private config: ManagedIdentityNodeConfiguration;

    private logger: Logger;
    private cacheManager: CacheManager;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;

    private identitySource:
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds;

    // authority needs to be faked to re-use existing functionality in msal-common: caching in responseHandler, etc.
    private fakeAuthority: Authority;

    constructor(configuration: ManagedIdentityConfiguration) {
        this.config = buildManagedIdentityConfiguration(configuration);
        this.managedIdentityId = this.config.managedIdentityId;

        this.logger = new Logger(
            this.config.system.loggerOptions,
            name,
            version
        );

        this.cacheManager = new DefaultStorageClass(
            this.managedIdentityId.getId,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            this.logger
        );

        this.networkClient = this.config.system.networkClient;

        this.cryptoProvider = new CryptoProvider();

        this.identitySource = this.selectManagedIdentitySource();

        const fakeAuthorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [Constants.DEFAULT_AUTHORITY],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
        this.fakeAuthority = new Authority(
            Constants.DEFAULT_AUTHORITY,
            this.networkClient,
            this.cacheManager,
            fakeAuthorityOptions,
            this.logger
        );
    }

    /**
     * Acquire an access token from the cache or the managed identity
     * @param managedIdentityRequest
     * @param managedIdentityId
     * @returns the access token
     */
    public async acquireToken(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId
    ): Promise<AuthenticationResult | null> {
        return (
            (await this.getCachedToken(
                managedIdentityRequest,
                managedIdentityId
            )) ||
            (await this.identitySource.authenticateWithMSI(
                managedIdentityRequest,
                managedIdentityId,
                this.fakeAuthority
            ))
        );
    }

    /**
     * Attempts to get the access token from the cache, then validate it
     * @param managedIdentityRequest
     * @param managedIdentityId
     * @returns the cached token if it exists, otherwise null
     */
    private async getCachedToken(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId
    ): Promise<AuthenticationResult | null> {
        if (managedIdentityRequest.forceRefresh) {
            return null;
        }

        const cachedAccessToken = this.readAccessTokenFromCache(
            managedIdentityRequest.resource,
            managedIdentityId.getId
        );

        if (!cachedAccessToken) {
            return null;
        }

        // check if token is expired
        if (
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                DEFAULT_TOKEN_RENEWAL_OFFSET_SEC
            )
        ) {
            return null;
        }

        return await ResponseHandler.generateAuthenticationResult(
            this.cryptoProvider,
            this.fakeAuthority,
            {
                account: null,
                idToken: null,
                accessToken: cachedAccessToken,
                refreshToken: null,
                appMetadata: null,
            },
            true, // from cache
            // BaseAuthRequest
            {
                ...managedIdentityRequest,
                authority: this.fakeAuthority.canonicalAuthority,
                correlationId: managedIdentityId.getId,
                scopes: [managedIdentityRequest.resource],
            }
        );
    }

    /**
     * Attempts to read the access token from the cache
     * @param resource
     * @param id
     * @returns the cached token if it exists, otherwise null
     */
    private readAccessTokenFromCache(
        resource: string,
        id: string
    ): AccessTokenEntity | null {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId: Constants.EMPTY_STRING,
            environment:
                this.fakeAuthority.canonicalAuthorityUrlComponents
                    .HostNameAndPort,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: id || "",
            realm: this.fakeAuthority.tenant,
            target: ScopeSet.createSearchScopes([resource]),
        };

        const accessTokens =
            this.cacheManager.getAccessTokensByFilter(accessTokenFilter);
        if (accessTokens.length < 1) {
            return null;
        } else if (accessTokens.length > 1) {
            throw createClientAuthError(
                ClientAuthErrorCodes.multipleMatchingTokens
            );
        }
        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * Tries to create a managed identity source for all sources
     * @returns the managed identity Source
     */
    private selectManagedIdentitySource():
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds {
        try {
            const source = AppService.tryCreate(
                this.logger,
                this.cacheManager,
                this.networkClient,
                this.cryptoProvider
            );

            /*
             *  ServiceFabric.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.cryptoProvider
             *  ) ||
             *  // *** AppService goes here ***
             *  CloudShell.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.cryptoProvider
             *  ) ||
             *  AzureArc.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.cryptoProvider
             *  ) ||
             *  Imds.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.cryptoProvider
             *  )
             */

            if (!source) {
                throw createManagedIdentityError(
                    ManagedIdentityErrorCodes.unableToCreateSource
                );
            }
            return source;
        } catch (error) {
            // throw error that was bubbled up
            throw error;
        }
    }
}
