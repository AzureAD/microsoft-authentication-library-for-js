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
    UrlString,
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
import {
    ManagedIdentityErrorCodes,
    createManagedIdentityError,
} from "../error/ManagedIdentityError";

/**
 * Class to initialize a managed identity and identify the service
 */
export class ManagedIdentityApplication {
    private config: ManagedIdentityNodeConfiguration;

    private logger: Logger;
    private static nodeStorage?: NodeStorage;
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
            canonicalAuthority: Constants.DEFAULT_AUTHORITY,
        };

        if (!ManagedIdentityApplication.nodeStorage) {
            ManagedIdentityApplication.nodeStorage = new NodeStorage(
                this.logger,
                this.config.managedIdentityId.id,
                DEFAULT_CRYPTO_IMPLEMENTATION,
                fakeStatusAuthorityOptions
            );
        }

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
            ManagedIdentityApplication.nodeStorage as NodeStorage,
            fakeAuthorityOptions,
            this.logger,
            this.cryptoProvider.createNewGuid(), // correlationID
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
            ManagedIdentityApplication.nodeStorage as NodeStorage,
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
        const resourceUrlString = new UrlString(
            managedIdentityRequestParams.resource.replace("/.default", "")
        );
        try {
            resourceUrlString.validateAsUri();
        } catch (e) {
            throw createManagedIdentityError(
                ManagedIdentityErrorCodes.invalidResource
            );
        }

        const managedIdentityRequest: ManagedIdentityRequest = {
            forceRefresh: managedIdentityRequestParams.forceRefresh,
            resource: managedIdentityRequestParams.resource.replace(
                "/.default",
                ""
            ),
            scopes: [
                managedIdentityRequestParams.resource.replace("/.default", ""),
            ],
            authority: this.fakeAuthority.canonicalAuthority,
            correlationId: this.cryptoProvider.createNewGuid(),
        };

        if (managedIdentityRequest.forceRefresh) {
            // make a network call to the managed identity source
            return this.managedIdentityClient.sendManagedIdentityTokenRequest(
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
                ManagedIdentityApplication.nodeStorage as NodeStorage
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
            return this.managedIdentityClient.sendManagedIdentityTokenRequest(
                managedIdentityRequest,
                this.config.managedIdentityId,
                this.fakeAuthority
            );
        }
    }
}
