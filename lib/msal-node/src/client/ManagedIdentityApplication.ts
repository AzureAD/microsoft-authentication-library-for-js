/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthOptions,
    Authority,
    AuthorityOptions,
    CacheOutcome,
    ClientConfiguration,
    Constants,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    INetworkModule,
    Logger,
    ProtocolMode,
    StaticAuthorityOptions,
    AuthenticationResult,
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
import { ManagedIdentityRequestParams } from "../request/ManagedIdentityRequestParams";
import { NodeStorage } from "../cache/NodeStorage";
import { DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY } from "../utils/Constants";

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
    private config: ManagedIdentityNodeConfiguration;
    // needed for unit test
    public get getConfig(): ManagedIdentityNodeConfiguration {
        return this.config;
    }

    private logger: Logger;
    private nodeStorage: NodeStorage;
    private networkClient: INetworkModule;
    private cryptoProvider: CryptoProvider;

    // authority needs to be faked to re-use existing functionality in msal-common: caching in responseHandler, etc.
    private fakeAuthority: Authority;

    // the ClientCredentialClient class needs to be faked to call it's getCachedAuthenticationResult method
    private fakeClientCredentialClient: ClientCredentialClient;

    private managedIdentityClient: ManagedIdentityClient;

    constructor(configuration?: ManagedIdentityConfiguration) {
        // undefined config means the managed identity is system-assigned
        this.config = buildManagedIdentityConfiguration(configuration || {});

        this.logger = new Logger(
            this.config.system.loggerOptions,
            name,
            version
        );

        const fakeStatusAuthorityOptions: StaticAuthorityOptions = {
            knownAuthorities: [Constants.DEFAULT_AUTHORITY],
        };

        this.nodeStorage = new NodeStorage(
            this.logger,
            this.config.managedIdentityId.id,
            DEFAULT_CRYPTO_IMPLEMENTATION,
            fakeStatusAuthorityOptions
        );

        this.networkClient = this.config.system.networkClient;

        this.cryptoProvider = new CryptoProvider();

        const fakeAuthorityOptions: AuthorityOptions = {
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY],
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
        };
        this.fakeAuthority = new Authority(
            DEFAULT_AUTHORITY_FOR_MANAGED_IDENTITY,
            this.networkClient,
            this.nodeStorage,
            fakeAuthorityOptions,
            this.logger,
            undefined,
            undefined,
            true
        );

        this.fakeClientCredentialClient = new ClientCredentialClient({
            authOptions: {
                clientId: this.config.managedIdentityId.id,
                authority: this.fakeAuthority,
            } as AuthOptions,
        } as ClientConfiguration);

        this.managedIdentityClient = new ManagedIdentityClient(
            this.logger,
            this.nodeStorage,
            this.networkClient,
            this.cryptoProvider
        );
    }

    /**
     * Acquire an access token from the cache or the managed identity
     * @param managedIdentityRequest
     * @returns the access token
     */
    public async acquireToken(
        managedIdentityRequestParams: ManagedIdentityRequestParams
    ): Promise<AuthenticationResult> {
        const managedIdentityRequest: ManagedIdentityRequest = {
            ...managedIdentityRequestParams,
            /*
             * the managedIdentityRequest's resource may be passed in as "{ResourceIdUri}" or {ResourceIdUri/.default}
             * if "/.default" is present, delete it
             */
            scopes: [
                managedIdentityRequestParams.resource.replace("/.default", ""),
            ],
            authority: this.fakeAuthority.canonicalAuthority,
            correlationId: this.config.managedIdentityId.id,
        };

        if (managedIdentityRequest.forceRefresh) {
            // make a network call to the managed identity source
            return await this.managedIdentityClient.sendManagedIdentityTokenRequest(
                managedIdentityRequest,
                this.config.managedIdentityId,
                this.fakeAuthority
            );
        }

        const [cachedAuthenticationResult, lastCacheOutcome] =
            await this.fakeClientCredentialClient.getCachedAuthenticationResult(
                managedIdentityRequest,
                this.config,
                this.cryptoProvider,
                this.fakeAuthority,
                this.nodeStorage
            );

        if (cachedAuthenticationResult) {
            // if the token is not expired but must be refreshed; get a new one in the background
            if (lastCacheOutcome === CacheOutcome.PROACTIVELY_REFRESHED) {
                this.logger.info(
                    "ClientCredentialClient:getCachedAuthenticationResult - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed."
                );

                // make a network call to the managed identity source; refresh the access token in the background
                const refreshAccessToken = true;
                await this.managedIdentityClient.sendManagedIdentityTokenRequest(
                    managedIdentityRequest,
                    this.config.managedIdentityId,
                    this.fakeAuthority,
                    refreshAccessToken
                );
            }

            return cachedAuthenticationResult;
        } else {
            // make a network call to the managed identity source
            return await this.managedIdentityClient.sendManagedIdentityTokenRequest(
                managedIdentityRequest,
                this.config.managedIdentityId,
                this.fakeAuthority
            );
        }
    }
}
