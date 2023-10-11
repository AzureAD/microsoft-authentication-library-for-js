/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    Authority,
    AuthorityOptions,
    CacheManager,
    CacheOutcome,
    Constants,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    DefaultStorageClass,
    INetworkModule,
    Logger,
    ProtocolMode,
} from "@azure/msal-common";
import {
    ManagedIdentityConfiguration,
    ManagedIdentityNodeConfiguration,
    buildManagedIdentityConfiguration,
} from "../config/Configuration";
import { version, name } from "../packageMetadata.js";
import { ManagedIdentityRequest } from "../request/ManagedIdentityRequest";
import { CryptoProvider } from "../crypto/CryptoProvider";
import { ClientCredentialClient } from "./ClientCredentialClient";
import { ManagedIdentityClient } from "./ManagedIdentityClient";

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
    private config: ManagedIdentityNodeConfiguration;

    private logger: Logger;
    private cacheManager: CacheManager;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;

    // authority needs to be faked to re-use existing functionality in msal-common: caching in responseHandler, etc.
    private fakeAuthority: Authority;

    constructor(configuration?: ManagedIdentityConfiguration) {
        // undefined config means the managed identity is system-assigned
        this.config = buildManagedIdentityConfiguration(configuration || {});

        this.logger = new Logger(
            this.config.system.loggerOptions,
            name,
            version
        );

        this.cacheManager = new DefaultStorageClass(
            this.config.managedIdentityId.getId,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            this.logger
        );

        this.networkClient = this.config.system.networkClient;

        this.cryptoProvider = new CryptoProvider();

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
     * @returns the access token
     */
    public async acquireToken(
        managedIdentityRequest: ManagedIdentityRequest
    ): Promise<AuthenticationResult | null> {
        const managedIdentityClient: ManagedIdentityClient =
            new ManagedIdentityClient(
                this.logger,
                this.cacheManager,
                this.networkClient,
                this.cryptoProvider
            );

        /*
         * the managedIdentityRequest's resource may be passed in as "{ResourceIdUri}" or {ResourceIdUri/.default}
         * if "/.default" is present, delete it
         */
        managedIdentityRequest.scopes = [
            managedIdentityRequest.resource.replace("/.default", ""),
        ];
        managedIdentityRequest.authority =
            this.fakeAuthority.canonicalAuthority;
        managedIdentityRequest.correlationId =
            this.config.managedIdentityId.getId;

        if (managedIdentityRequest.forceRefresh) {
            // make a network call to the managed identity source
            return await managedIdentityClient.sendMSITokenRequest(
                managedIdentityRequest,
                this.config.managedIdentityId,
                this.fakeAuthority
            );
        }

        const [cachedAuthenticationResult, lastCacheOutcome] =
            await ClientCredentialClient.getCachedAuthenticationResult(
                managedIdentityRequest,
                this.config,
                this.cryptoProvider,
                this.fakeAuthority,
                this.cacheManager
            );

        if (cachedAuthenticationResult) {
            // if the token is not expired but must be refreshed; get a new one in the background
            if (lastCacheOutcome === CacheOutcome.PROACTIVELY_REFRESHED) {
                this.logger.info(
                    "ClientCredentialClient:getCachedAuthenticationResult - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed."
                );

                // make a network call to the managed identity source; refresh the access token in the background
                const refreshAccessToken = true;
                await managedIdentityClient.sendMSITokenRequest(
                    managedIdentityRequest,
                    this.config.managedIdentityId,
                    this.fakeAuthority,
                    refreshAccessToken
                );
            }

            // return the cached token
            return cachedAuthenticationResult;
        } else {
            // make a network call to the managed identity source
            return await managedIdentityClient.sendMSITokenRequest(
                managedIdentityRequest,
                this.config.managedIdentityId,
                this.fakeAuthority
            );
        }
    }
}
