/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICrypto, INetworkModule, Logger, AuthenticationResult, AccountInfo, AccountEntity, UrlString, AuthenticationScheme, BaseAuthRequest, PersistentCacheKeys, IdToken } from "@azure/msal-common";
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
    protected initializeBaseRequest(request: Partial<BaseAuthRequest>): BaseAuthRequest {
        this.logger.verbose("Initializing BaseAuthRequest");
        const authority = request.authority || this.config.auth.authority;

        const scopes = [...((request && request.scopes) || [])];

        // Set authenticationScheme to BEARER if not explicitly set in the request
        if (!request.authenticationScheme) {
            request.authenticationScheme = AuthenticationScheme.BEARER;
            this.logger.verbose("Authentication Scheme wasn't explicitly set in request, defaulting to \"Bearer\" request");
        } else {
            this.logger.verbose(`Authentication Scheme set to "${request.authenticationScheme}" as configured in Auth request`);
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

    protected getLegacyLoginHint(): string|null {
        // Only check for adal/msal token if no SSO params are being used
        const adalIdTokenString = this.browserStorage.getTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN);
        if (adalIdTokenString) {
            this.browserStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
            this.logger.verbose("Cached ADAL id token retrieved.");
        }

        // Check for cached MSAL v1 id token
        const msalIdTokenString = this.browserStorage.getTemporaryCache(PersistentCacheKeys.ID_TOKEN, true);
        if (msalIdTokenString) {
            this.browserStorage.removeItem(this.browserStorage.generateCacheKey(PersistentCacheKeys.ID_TOKEN));
            this.logger.verbose("Cached MSAL.js v1 id token retrieved");
        }

        const cachedIdTokenString = msalIdTokenString || adalIdTokenString;
        if (cachedIdTokenString) {
            const cachedIdToken = new IdToken(cachedIdTokenString, this.browserCrypto);
            if (cachedIdToken.claims && cachedIdToken.claims.preferred_username) {
                this.logger.verbose("No SSO params used and ADAL/MSAL v1 token retrieved, setting ADAL/MSAL v1 preferred_username as loginHint");
                return cachedIdToken.claims.preferred_username;
            }
            else if (cachedIdToken.claims && cachedIdToken.claims.upn) {
                this.logger.verbose("No SSO params used and ADAL/MSAL v1 token retrieved, setting ADAL/MSAL v1 upn as loginHint");
                return cachedIdToken.claims.upn;
            }
            else {
                this.logger.verbose("No SSO params used and ADAL/MSAL v1 token retrieved, however, no account hint claim found. Enable preferred_username or upn id token claim to get SSO.");
            }
        }

        return null;
    }
}
