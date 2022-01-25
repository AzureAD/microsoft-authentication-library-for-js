/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, INetworkModule, Logger, AuthenticationResult, AccountInfo, AccountEntity, BaseAuthRequest, AuthenticationScheme, UrlString, ServerTelemetryManager, ServerTelemetryRequest, ClientConfigurationError, StringUtils } from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { version } from "../packageMetadata";
import { BrowserConstants } from "../utils/BrowserConstants";
import { BrowserUtils } from "../utils/BrowserUtils";

export abstract class BaseInteractionClient {

    protected config: BrowserConfiguration;
    protected browserStorage: BrowserCacheManager;
    protected browserCrypto: ICrypto;
    protected networkClient: INetworkModule;
    protected logger: Logger;
    protected eventHandler: EventHandler;
    protected correlationId: string;

    constructor(config: BrowserConfiguration, storageImpl: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, correlationId?: string) {
        this.config = config;
        this.browserStorage = storageImpl;
        this.browserCrypto = browserCrypto;
        this.networkClient = this.config.system.networkClient;
        this.eventHandler = eventHandler;
        this.correlationId = correlationId || this.browserCrypto.createNewGuid();
        this.logger = logger.clone(BrowserConstants.MSAL_SKU, version, this.correlationId);
    }

    abstract acquireToken(request: RedirectRequest|PopupRequest|SsoSilentRequest): Promise<AuthenticationResult|void>;

    abstract logout(request: EndSessionRequest): Promise<void>;

    protected async clearCacheOnLogout(account?: AccountInfo| null): Promise<void> {
        if (account) {
            if (AccountEntity.accountInfoIsEqual(account, this.browserStorage.getActiveAccount(), false)) {
                this.logger.verbose("Setting active account to null");
                this.browserStorage.setActiveAccount(null);
            }
            // Clear given account.
            try {
                await this.browserStorage.removeAccount(AccountEntity.generateAccountCacheKey(account));
                this.logger.verbose("Cleared cache items belonging to the account provided in the logout request.");
            } catch (error) {
                this.logger.error("Account provided in logout request was not found. Local cache unchanged.");
            }
        } else {
            try {
                // Clear all accounts and tokens
                await this.browserStorage.clear();
                // Clear any stray keys from IndexedDB
                await this.browserCrypto.clearKeystore();
                this.logger.verbose("No account provided in logout request, clearing all cache items.");
            } catch(e) {
                this.logger.error("Attempted to clear all MSAL cache items and failed. Local cache unchanged.");
            }
        }
    }

    /**
     * Initializer function for all request APIs
     * @param request
     */
    protected async initializeBaseRequest(request: Partial<BaseAuthRequest>): Promise<BaseAuthRequest> {
        this.logger.verbose("Initializing BaseAuthRequest");
        const authority = request.authority || this.config.auth.authority;

        const scopes = [...((request && request.scopes) || [])];

        // Set authenticationScheme to BEARER if not explicitly set in the request
        if (!request.authenticationScheme) {
            request.authenticationScheme = AuthenticationScheme.BEARER;
            this.logger.verbose("Authentication Scheme wasn't explicitly set in request, defaulting to \"Bearer\" request");
        } else {
            if (request.authenticationScheme === AuthenticationScheme.SSH) {
                if (!request.sshJwk) {
                    throw ClientConfigurationError.createMissingSshJwkError();
                }
                if(!request.sshKid) {
                    throw ClientConfigurationError.createMissingSshKidError();
                }
            }
            this.logger.verbose(`Authentication Scheme set to "${request.authenticationScheme}" as configured in Auth request`);
        }

        // Set requested claims hash if claims were requested
        if (request.claims && !StringUtils.isEmpty(request.claims)) {
            request.requestedClaimsHash = await this.browserCrypto.hashString(request.claims);
        } 

        const validatedRequest: BaseAuthRequest = {
            ...request,
            correlationId: this.correlationId,
            authority,
            scopes
        };

        return validatedRequest;
    }

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * @param requestRedirectUri
     * @returns Redirect URL
     *
     */
    protected getRedirectUri(requestRedirectUri?: string): string {
        this.logger.verbose("getRedirectUri called");
        const redirectUri = requestRedirectUri || this.config.auth.redirectUri || BrowserUtils.getCurrentUri();
        return UrlString.getAbsoluteUrl(redirectUri, BrowserUtils.getCurrentUri());
    }

    /**
     *
     * @param apiId
     * @param correlationId
     * @param forceRefresh
     */
    protected initializeServerTelemetryManager(apiId: number, forceRefresh?: boolean): ServerTelemetryManager {
        this.logger.verbose("initializeServerTelemetryManager called");
        const telemetryPayload: ServerTelemetryRequest = {
            clientId: this.config.auth.clientId,
            correlationId: this.correlationId,
            apiId: apiId,
            forceRefresh: forceRefresh || false,
            wrapperSKU: this.browserStorage.getWrapperMetadata()[0],
            wrapperVer: this.browserStorage.getWrapperMetadata()[1]
        };

        return new ServerTelemetryManager(telemetryPayload, this.browserStorage);
    }
}
