/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    INetworkModule,
    Logger,
    AccountInfo,
    AccountEntity,
    BaseAuthRequest,
    AuthenticationScheme,
    UrlString,
    ServerTelemetryManager,
    ServerTelemetryRequest,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
    Authority,
    AuthorityOptions,
    AuthorityFactory,
    IPerformanceClient,
    PerformanceEvents,
    StringUtils,
} from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { version } from "../packageMetadata";
import { BrowserConstants } from "../utils/BrowserConstants";
import * as BrowserUtils from "../utils/BrowserUtils";
import { INavigationClient } from "../navigation/INavigationClient";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ClearCacheRequest } from "../request/ClearCacheRequest";
import { createNewGuid } from "../crypto/BrowserCrypto";

export abstract class BaseInteractionClient {
    protected config: BrowserConfiguration;
    protected browserStorage: BrowserCacheManager;
    protected browserCrypto: ICrypto;
    protected networkClient: INetworkModule;
    protected logger: Logger;
    protected eventHandler: EventHandler;
    protected navigationClient: INavigationClient;
    protected nativeMessageHandler: NativeMessageHandler | undefined;
    protected correlationId: string;
    protected performanceClient: IPerformanceClient;

    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        nativeMessageHandler?: NativeMessageHandler,
        correlationId?: string
    ) {
        this.config = config;
        this.browserStorage = storageImpl;
        this.browserCrypto = browserCrypto;
        this.networkClient = this.config.system.networkClient;
        this.eventHandler = eventHandler;
        this.navigationClient = navigationClient;
        this.nativeMessageHandler = nativeMessageHandler;
        this.correlationId = correlationId || createNewGuid();
        this.logger = logger.clone(
            BrowserConstants.MSAL_SKU,
            version,
            this.correlationId
        );
        this.performanceClient = performanceClient;
    }

    abstract acquireToken(
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): Promise<AuthenticationResult | void>;

    abstract logout(
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void>;

    protected async clearCacheOnLogout(
        account?: AccountInfo | null
    ): Promise<void> {
        if (account) {
            if (
                AccountEntity.accountInfoIsEqual(
                    account,
                    this.browserStorage.getActiveAccount(),
                    false
                )
            ) {
                this.logger.verbose("Setting active account to null");
                this.browserStorage.setActiveAccount(null);
            }
            // Clear given account.
            try {
                await this.browserStorage.removeAccount(
                    AccountEntity.generateAccountCacheKey(account)
                );
                this.logger.verbose(
                    "Cleared cache items belonging to the account provided in the logout request."
                );
            } catch (error) {
                this.logger.error(
                    "Account provided in logout request was not found. Local cache unchanged."
                );
            }
        } else {
            try {
                this.logger.verbose(
                    "No account provided in logout request, clearing all cache items.",
                    this.correlationId
                );
                // Clear all accounts and tokens
                await this.browserStorage.clear();
                // Clear any stray keys from IndexedDB
                await this.browserCrypto.clearKeystore();
            } catch (e) {
                this.logger.error(
                    "Attempted to clear all MSAL cache items and failed. Local cache unchanged."
                );
            }
        }
    }

    /**
     * Initializer function for all request APIs
     * @param request
     */
    protected async initializeBaseRequest(
        request: Partial<BaseAuthRequest>,
        account?: AccountInfo
    ): Promise<BaseAuthRequest> {
        this.performanceClient.addQueueMeasurement(
            PerformanceEvents.InitializeBaseRequest,
            this.correlationId
        );
        const authority = request.authority || this.config.auth.authority;

        if (account) {
            await this.validateRequestAuthority(authority, account);
        }

        const scopes = [...((request && request.scopes) || [])];

        const validatedRequest: BaseAuthRequest = {
            ...request,
            correlationId: this.correlationId,
            authority,
            scopes,
        };

        // Set authenticationScheme to BEARER if not explicitly set in the request
        if (!validatedRequest.authenticationScheme) {
            validatedRequest.authenticationScheme = AuthenticationScheme.BEARER;
            this.logger.verbose(
                'Authentication Scheme wasn\'t explicitly set in request, defaulting to "Bearer" request'
            );
        } else {
            if (
                validatedRequest.authenticationScheme ===
                AuthenticationScheme.SSH
            ) {
                if (!request.sshJwk) {
                    throw createClientConfigurationError(
                        ClientConfigurationErrorCodes.missingSshJwk
                    );
                }
                if (!request.sshKid) {
                    throw createClientConfigurationError(
                        ClientConfigurationErrorCodes.missingSshKid
                    );
                }
            }
            this.logger.verbose(
                `Authentication Scheme set to "${validatedRequest.authenticationScheme}" as configured in Auth request`
            );
        }

        // Set requested claims hash if claims-based caching is enabled and claims were requested
        if (
            this.config.cache.claimsBasedCachingEnabled &&
            request.claims &&
            // Checks for empty stringified object "{}" which doesn't qualify as requested claims
            !StringUtils.isEmptyObj(request.claims)
        ) {
            validatedRequest.requestedClaimsHash =
                await this.browserCrypto.hashString(request.claims);
        }

        return validatedRequest;
    }

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * @param requestRedirectUri
     * @returns Redirect URL
     *
     */
    getRedirectUri(requestRedirectUri?: string): string {
        this.logger.verbose("getRedirectUri called");
        const redirectUri =
            requestRedirectUri ||
            this.config.auth.redirectUri ||
            BrowserUtils.getCurrentUri();
        return UrlString.getAbsoluteUrl(
            redirectUri,
            BrowserUtils.getCurrentUri()
        );
    }

    /*
     * If authority provided in the request does not match environment/authority specified
     * in the account or MSAL config, we throw an error.
     */
    async validateRequestAuthority(
        authority: string,
        account: AccountInfo
    ): Promise<void> {
        const discoveredAuthority = await this.getDiscoveredAuthority(
            authority
        );

        if (!discoveredAuthority.isAlias(account.environment)) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.authorityMismatch
            );
        }
    }

    /**
     *
     * @param apiId
     * @param correlationId
     * @param forceRefresh
     */
    protected initializeServerTelemetryManager(
        apiId: number,
        forceRefresh?: boolean
    ): ServerTelemetryManager {
        this.logger.verbose("initializeServerTelemetryManager called");
        const telemetryPayload: ServerTelemetryRequest = {
            clientId: this.config.auth.clientId,
            correlationId: this.correlationId,
            apiId: apiId,
            forceRefresh: forceRefresh || false,
            wrapperSKU: this.browserStorage.getWrapperMetadata()[0],
            wrapperVer: this.browserStorage.getWrapperMetadata()[1],
        };

        return new ServerTelemetryManager(
            telemetryPayload,
            this.browserStorage
        );
    }

    /**
     * Used to get a discovered version of the default authority.
     * @param requestAuthority
     */
    protected async getDiscoveredAuthority(
        requestAuthority?: string
    ): Promise<Authority> {
        this.logger.verbose("getDiscoveredAuthority called");
        const authorityOptions: AuthorityOptions = {
            protocolMode: this.config.auth.protocolMode,
            OIDCOptions: this.config.auth.OIDCOptions,
            knownAuthorities: this.config.auth.knownAuthorities,
            cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
            authorityMetadata: this.config.auth.authorityMetadata,
        };

        const authority = requestAuthority || this.config.auth.authority;
        this.logger.verbose(`Creating discovered authority with ${authority}`);
        return AuthorityFactory.createDiscoveredInstance(
            authority,
            this.config.system.networkClient,
            this.browserStorage,
            authorityOptions,
            this.logger,
            this.correlationId,
            this.performanceClient
        );
    }
}
