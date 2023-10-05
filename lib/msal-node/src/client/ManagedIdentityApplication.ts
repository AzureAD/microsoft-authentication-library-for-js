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
    DefaultStorageClass,
    INetworkModule,
    Logger,
    NetworkManager,
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

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
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
                this.fakeAuthority,
                this.config.system.cancellationToken
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
            managedIdentityRequest.resourceRequestUri,
            managedIdentityId.id
        );

        if (!cachedAccessToken) {
            return null;
        }

        // check if token is expired
        if (
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                this.config.system.tokenRenewalOffsetSeconds
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
            {
                ...managedIdentityRequest,
                authority: this.fakeAuthority.canonicalAuthority,
                correlationId: managedIdentityId.id,
                scopes: [managedIdentityRequest.resourceRequestUri],
            }
        );
    }

    /**
     * Attempts to read the access token from the cache
     * @param resourceUri
     * @param id
     * @returns the cached token if it exists, otherwise null
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
                this.networkManager,
                this.cryptoProvider
            );

            /*
             *  ServiceFabric.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  // *** AppService goes here ***
             *  CloudShell.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  AzureArc.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkManager,
             *      this.cryptoProvider
             *  ) ||
             *  Imds.tryCreate(
             *      this.logger,
             *      this.cacheManager,
             *      this.networkManager,
             *      this.cryptoProvider
             *  )
             */

            if (!source) {
                // TODO: implement better error
                throw new Error("Unable to create a source");
            }
            return source;
        } catch (error) {
            // TODO: throw exception
            throw error;
        }
    }
}
