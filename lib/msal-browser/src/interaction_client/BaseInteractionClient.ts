/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    INetworkModule,
    Logger,
    AccountInfo,
    UrlString,
    ServerTelemetryManager,
    ServerTelemetryRequest,
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
    Authority,
    AuthorityOptions,
    AuthorityFactory,
    IPerformanceClient,
    AzureCloudOptions,
    invokeAsync,
    StringDict,
    AccountEntityUtils,
} from "@azure/msal-common/browser";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { BrowserCacheManager } from "../cache/BrowserCacheManager.js";
import { EventHandler } from "../event/EventHandler.js";
import { EndSessionRequest } from "../request/EndSessionRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { version } from "../packageMetadata.js";
import { BrowserConstants } from "../utils/BrowserConstants.js";
import * as BrowserUtils from "../utils/BrowserUtils.js";
import { INavigationClient } from "../navigation/INavigationClient.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { ClearCacheRequest } from "../request/ClearCacheRequest.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";
import { IPlatformAuthHandler } from "../broker/nativeBroker/IPlatformAuthHandler.js";

export abstract class BaseInteractionClient {
    protected config: BrowserConfiguration;
    protected browserStorage: BrowserCacheManager;
    protected browserCrypto: ICrypto;
    protected networkClient: INetworkModule;
    protected logger: Logger;
    protected eventHandler: EventHandler;
    protected navigationClient: INavigationClient;
    protected platformAuthProvider: IPlatformAuthHandler | undefined;
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
        platformAuthProvider?: IPlatformAuthHandler,
        correlationId?: string
    ) {
        this.config = config;
        this.browserStorage = storageImpl;
        this.browserCrypto = browserCrypto;
        this.networkClient = this.config.system.networkClient;
        this.eventHandler = eventHandler;
        this.navigationClient = navigationClient;
        this.platformAuthProvider = platformAuthProvider;
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
}

/**
 *
 * Use to get the redirect uri configured in MSAL or null.
 * @param requestRedirectUri
 * @returns Redirect URL
 *
 */
export function getRedirectUri(
    requestRedirectUri?: string,
    clientConfig?: BrowserConfiguration,
    logger?: Logger
): string {
    logger?.verbose("getRedirectUri called");
    const redirectUri =
        requestRedirectUri || clientConfig?.auth.redirectUri || "";
    return UrlString.getAbsoluteUrl(redirectUri, BrowserUtils.getCurrentUri());
}

/**
 *
 * @param apiId
 * @param correlationId
 * @param forceRefresh
 */
export function initializeServerTelemetryManager(
    apiId: number,
    config: BrowserConfiguration,
    correlationId: string,
    browserStorage: BrowserCacheManager,
    logger?: Logger,
    forceRefresh?: boolean
): ServerTelemetryManager {
    logger?.verbose("initializeServerTelemetryManager called");
    const telemetryPayload: ServerTelemetryRequest = {
        clientId: config.auth.clientId,
        correlationId: correlationId,
        apiId: apiId,
        forceRefresh: forceRefresh || false,
        wrapperSKU: browserStorage.getWrapperMetadata()[0],
        wrapperVer: browserStorage.getWrapperMetadata()[1],
    };

    return new ServerTelemetryManager(telemetryPayload, browserStorage);
}

/**
 * Used to get a discovered version of the default authority.
 * @param params {
 *         requestAuthority?: string;
 *         requestAzureCloudOptions?: AzureCloudOptions;
 *         requestExtraQueryParameters?: StringDict;
 *         account?: AccountInfo;
 *        }
 */
export async function getDiscoveredAuthority(
    params: {
        requestAuthority?: string;
        requestAzureCloudOptions?: AzureCloudOptions;
        requestExtraQueryParameters?: StringDict;
        account?: AccountInfo;
    },
    config: BrowserConfiguration,
    correlationId: string,
    performanceClient: IPerformanceClient,
    browserStorage: BrowserCacheManager,
    logger: Logger
): Promise<Authority> {
    const { account } = params;
    const instanceAwareEQ =
        params.requestExtraQueryParameters &&
        params.requestExtraQueryParameters.hasOwnProperty("instance_aware")
            ? params.requestExtraQueryParameters["instance_aware"]
            : undefined;

    const authorityOptions: AuthorityOptions = {
        protocolMode: config.system.protocolMode,
        OIDCOptions: config.auth.OIDCOptions,
        knownAuthorities: config.auth.knownAuthorities,
        cloudDiscoveryMetadata: config.auth.cloudDiscoveryMetadata,
        authorityMetadata: config.auth.authorityMetadata,
    };

    // build authority string based on auth params, precedence - azureCloudInstance + tenant >> authority
    const resolvedAuthority = params.requestAuthority || config.auth.authority;
    const resolvedInstanceAware = instanceAwareEQ?.length
        ? instanceAwareEQ === "true"
        : config.auth.instanceAware;

    const userAuthority =
        account && resolvedInstanceAware
            ? config.auth.authority.replace(
                  UrlString.getDomainFromUrl(resolvedAuthority),
                  account.environment
              )
            : resolvedAuthority;

    // fall back to the authority from config
    const builtAuthority = Authority.generateAuthority(
        userAuthority,
        params.requestAzureCloudOptions || config.auth.azureCloudOptions
    );
    const discoveredAuthority = await invokeAsync(
        AuthorityFactory.createDiscoveredInstance,
        BrowserPerformanceEvents.AuthorityFactoryCreateDiscoveredInstance,
        logger,
        performanceClient,
        correlationId
    )(
        builtAuthority,
        config.system.networkClient,
        browserStorage,
        authorityOptions,
        logger,
        correlationId,
        performanceClient
    );

    if (account && !discoveredAuthority.isAlias(account.environment)) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.authorityMismatch
        );
    }

    return discoveredAuthority;
}

export async function clearCacheOnLogout(
    browserStorage: BrowserCacheManager,
    browserCrypto: ICrypto,
    logger: Logger,
    correlationId: string,
    account?: AccountInfo | null
): Promise<void> {
    if (account) {
        if (
            AccountEntityUtils.accountInfoIsEqual(
                account,
                browserStorage.getActiveAccount(),
                false
            )
        ) {
            logger.verbose("Setting active account to null");
            browserStorage.setActiveAccount(null);
        }
        // Clear given account.
        try {
            browserStorage.removeAccount(
                AccountEntityUtils.generateAccountCacheKey(account),
                correlationId
            );
            logger.verbose(
                "Cleared cache items belonging to the account provided in the logout request."
            );
        } catch (error) {
            logger.error(
                "Account provided in logout request was not found. Local cache unchanged."
            );
        }
    } else {
        try {
            logger.verbose(
                "No account provided in logout request, clearing all cache items.",
                correlationId
            );
            // Clear all accounts and tokens
            await browserStorage.clear(correlationId);
            // Clear any stray keys from IndexedDB
            await browserCrypto.clearKeystore();
        } catch (e) {
            logger.error(
                "Attempted to clear all MSAL cache items and failed. Local cache unchanged."
            );
        }
    }
}
