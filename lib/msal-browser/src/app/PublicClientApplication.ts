/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, ClientAuthErrorMessage, SilentFlowRequest } from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { DEFAULT_REQUEST, ApiId, InteractionType } from "../utils/BrowserConstants";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { ClientApplication } from "./ClientApplication";
import { SilentRequest } from "../request/SilentRequest";
import { EventType } from "../event/EventType";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { SsoSilentRequest } from "../request/SsoSilentRequest";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication extends ClientApplication implements IPublicClientApplication {

    /**
     * @constructor
     * Constructor for the PublicClientApplication used to instantiate the PublicClientApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     * - redirect_uri: the uri of your application registered in the portal.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param configuration object for the MSAL PublicClientApplication instance
     */
    constructor(configuration: Configuration) {
        super(configuration);
    }

    /**
     * Use when initiating the login process by redirecting the user's browser to the authorization endpoint. This function redirects the page, so
     * any code that follows this function will not execute.
     *
     * IMPORTANT: It is NOT recommended to have code that is dependent on the resolution of the Promise. This function will navigate away from the current
     * browser window. It currently returns a Promise in order to reflect the asynchronous nature of the code running in this function.
     *
     * @param request
     */
    async loginRedirect(request?: RedirectRequest): Promise<void> {
        return this.acquireTokenRedirect(request || DEFAULT_REQUEST);
    }

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
        return this.acquireTokenPopup(request || DEFAULT_REQUEST);
    }

    /**
     * This function uses a hidden iframe to fetch an authorization code from the eSTS. There are cases where this may not work:
     * - Any browser using a form of Intelligent Tracking Prevention
     * - If there is not an established session with the service
     *
     * In these cases, the request must be done inside a popup or full frame redirect.
     *
     * For the cases where interaction is required, you cannot send a request with prompt=none.
     *
     * If your refresh token has expired, you can use this function to fetch a new set of tokens silently as long as
     * you session on the server still exists.
     * @param request {@link SsoSilentRequest}
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    async ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
        this.emitEvent(EventType.SSO_SILENT_START, InteractionType.Silent, request);

        try {
            // Default skipCache to true, if not passed. 
            const {
                skipCache = true
            } = request;

            // Build cached account by loginHint, sid, or the request itself
            const accountByLoginHint = request.loginHint && this.getAccountByUsername(request.loginHint);
            
            const accountBySid = request.sid && this.getAccountBySessionId(request.sid);
            if (request.sid && !accountBySid && !skipCache) {
                this.logger.warning("ssoSilent - sid provided to ssoSilent, but no cached account found. If this is unexpected, confirm sid is enabled as an optional id token claim for your application");
            }

            const account = request.account || accountBySid || accountByLoginHint;

            // Only checked for cached credentials if forceRefresh is off and there is an account for the request
            if (!skipCache && account) {
                const silentRequest: SilentRequest = {
                    ...request,
                    account,
                    scopes: request.scopes || DEFAULT_REQUEST.scopes
                };

                this.logger.verbose("ssoSilent - checking for cached tokens.");

                const silentResponse = await this.acquireTokenSilent(silentRequest)
                    .catch(error => {
                        /*
                         * This error is returned when there is an empty cache. 
                         * In this scenario, fall through to iframed request.
                         */
                        if (error.errorCode === ClientAuthErrorMessage.noTokensFoundError.code) {
                            return null;
                        }

                        throw error;
                    });

                if (silentResponse) {
                    this.logger.verbose("ssoSilent - tokens returned from acquireTokenSilent");
                    return silentResponse;
                }
            }

            if (request.skipCache) {
                this.logger.verbose("ssoSilent - skipCache enabled");
            }

            if (!account) {
                this.logger.verbose("ssoSilent - no cached account found");
            }

            this.logger.verbose("ssoSilent - initiating iframed request");
            
            const silentTokenResult = await this.acquireTokenByIframe(request);
            this.emitEvent(EventType.SSO_SILENT_SUCCESS, InteractionType.Silent, silentTokenResult);
            return silentTokenResult;
        } catch (e) {
            this.logger.error("ssoSilent - iframed request failed. This may be due to third-party cookie blocking. Invoke interaction to resolve");
            this.emitEvent(EventType.SSO_SILENT_FAILURE, InteractionType.Silent, null, e);
            throw e;
        }
    }

    /**
     * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
     * 
     * @param request
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    async acquireTokenSilent(request: SilentRequest): Promise<AuthenticationResult> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
        const account = request.account || this.getActiveAccount();
        if (!account) {
            throw BrowserAuthError.createNoAccountError();
        }
        const silentRequest: SilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request),
            account: account,
            forceRefresh: request.forceRefresh || false
        };
        this.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);
        try {
            // Telemetry manager only used to increment cacheHits here
            const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent_silentFlow, silentRequest.correlationId);
            const silentAuthClient = await this.createSilentFlowClient(serverTelemetryManager, silentRequest.authority);
            const cachedToken = await silentAuthClient.acquireCachedToken(silentRequest);
            this.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, cachedToken);
            return cachedToken;
        } catch (e) {
            try {
                const tokenRenewalResult = await this.acquireTokenByRefreshToken(silentRequest);
                this.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, tokenRenewalResult);
                return tokenRenewalResult;
            } catch (tokenRenewalError) {
                this.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError);
                throw tokenRenewalError;
            }
        }
    }
}
