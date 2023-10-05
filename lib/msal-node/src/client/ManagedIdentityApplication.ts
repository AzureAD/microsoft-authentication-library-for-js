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
    Constants,
    CredentialFilter,
    CredentialType,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    DefaultStorageClass,
    INetworkModule,
    Logger,
    NetworkManager,
    ProtocolMode,
    ResponseHandler,
    ScopeSet,
    TimeUtils,
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

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
    private managedIdentityRequest: ManagedIdentityRequest;
    private managedIdentityId: ManagedIdentityId;

    private config: ManagedIdentityNodeConfiguration;

    private logger: Logger;
    private cacheManager: CacheManager;
    private networkClient: INetworkModule;
    private networkManager: NetworkManager;
    private cryptoProvider: CryptoProvider;

    private identitySource:
        | ServiceFabric
        | AppService
        | CloudShell
        | AzureArc
        | Imds;

    private fakeAuthority: Authority;

    constructor(
        managedIdentityId: ManagedIdentityId,
        configuration?: ManagedIdentityConfiguration
    ) {
        this.config = buildManagedIdentityConfiguration(configuration || {});
        this.managedIdentityId = managedIdentityId;

        this.logger = new Logger(
            this.config.system.loggerOptions,
            name,
            version
        );

        this.cacheManager = new DefaultStorageClass(
            this.managedIdentityId.id,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            this.logger
        );

        this.networkClient = this.config.system.networkClient;
        this.networkManager = new NetworkManager(
            this.networkClient,
            this.cacheManager
        );

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

    // TODO: implement this method
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

    private async getCachedToken(
        managedIdentityRequest: ManagedIdentityRequest,
        managedIdentityId: ManagedIdentityId
    ): Promise<AuthenticationResult | null> {
        if (managedIdentityRequest.forceRefresh) {
            return null;
        }

        // TODO: persistencePlugin ??? beforeCacheAccess(cacheContext) ???

        const cachedAccessToken = this.readAccessTokenFromCache(
            managedIdentityRequest.resourceRequestUri,
            managedIdentityId.id
        );

        // TODO: persistencePlugin ??? afterCacheAccess(cacheContext) ???

        // must refresh due to non-existent access_token
        if (!cachedAccessToken) {
            /*
             * TODO: implement telemetry ???
             * this.serverTelemetryManager?.setCacheOutcome(
             *     CacheOutcome.NO_CACHED_ACCESS_TOKEN
             * );
             */
            return null;
        }

        // must refresh due to the expires_in value
        if (
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                5000 // implement this --> this.config.systemOptions.tokenRenewalOffsetSeconds
            )
        ) {
            /*
             * TODO: implement telemetry ???
             * this.serverTelemetryManager?.setCacheOutcome(
             *  CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED
             * );
             */
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
            true, // fromTokenCache
            {
                ...managedIdentityRequest,
                authority: this.fakeAuthority.canonicalAuthority,
                correlationId: managedIdentityId.id,
                scopes: [managedIdentityRequest.resourceRequestUri],
            }
        );
    }

    /**
     * Reads access token from the cache
     */
    private readAccessTokenFromCache(
        resourceUri: string,
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
            target: ScopeSet.createSearchScopes([resourceUri]),
        };

        const accessTokens =
            this.cacheManager.getAccessTokensByFilter(accessTokenFilter);
        if (accessTokens.length < 1) {
            return null;
        } else if (accessTokens.length > 1) {
            // TODO: implement error message
            /*
             * throw createClientAuthError(
             *     ClientAuthErrorCodes.multipleMatchingTokens
             * );
             */
        }
        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * Tries to create a managed identity source for all sources
     * @param request the managed identity request
     * @returns the managed identity Source
     */
    // TODO: update return type
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
                this.networkManager,
                this.cryptoProvider
            );

            /*
             * ||
             *  ServiceFabric.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  // *** AppService goes here ***
             *  CloudShell.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  AzureArc.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  Imds.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkClient,
             *      this.networkManager,
             *      this.cryptoProvider
             *  )
             */

            if (!source) {
                // TODO: implement better error
                throw "Unable to create a source";
            }
            return source;
        } catch (error) {
            // TODO: throw exception
            throw error;
        }
    }
}
