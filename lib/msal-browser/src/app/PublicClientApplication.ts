/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult, RequestThumbprint } from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { DEFAULT_REQUEST, InteractionType } from "../utils/BrowserConstants";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { ClientApplication } from "./ClientApplication";
import { SilentRequest } from "../request/SilentRequest";
import { EventType } from "../event/EventType";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { SilentCacheClient } from "../interaction_client/SilentCacheClient";

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication extends ClientApplication implements IPublicClientApplication {

    // Active requests
    private activeSilentTokenRequests: Map<string, Promise<AuthenticationResult>>;

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

        this.activeSilentTokenRequests = new Map();
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
        this.logger.verbose("loginRedirect called");
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
        this.logger.verbose("loginPopup called");
        return this.acquireTokenPopup(request || DEFAULT_REQUEST);
    }

    /**
     * Silently acquire an access token for a given set of scopes. Returns currently processing promise if parallel requests are made.
     *
     * @param {@link (SilentRequest:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async acquireTokenSilent(request: SilentRequest): Promise<AuthenticationResult> {
        this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
        this.logger.verbose("acquireTokenSilent called", request.correlationId);
        const account = request.account || this.getActiveAccount();
        if (!account) {
            throw BrowserAuthError.createNoAccountError();
        }
        const thumbprint: RequestThumbprint = {
            clientId: this.config.auth.clientId,
            authority: request.authority || "",
            scopes: request.scopes,
            homeAccountIdentifier: account.homeAccountId
        };
        const silentRequestKey = JSON.stringify(thumbprint);
        const cachedResponse = this.activeSilentTokenRequests.get(silentRequestKey);
        if (typeof cachedResponse === "undefined") {
            this.logger.verbose("acquireTokenSilent called for the first time, storing active request", request.correlationId);
            const response = this.acquireTokenSilentAsync(request, account)
                .then((result) => {
                    this.activeSilentTokenRequests.delete(silentRequestKey);
                    return result;
                })
                .catch((error) => {
                    this.activeSilentTokenRequests.delete(silentRequestKey);
                    throw error;
                });
            this.activeSilentTokenRequests.set(silentRequestKey, response);
            return response;
        } else {
            this.logger.verbose("acquireTokenSilent has been called previously, returning the result from the first call", request.correlationId);
            return cachedResponse;
        }
    }

    /**
     * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
     * @param {@link (SilentRequest:type)}
     * @param {@link (AccountInfo:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} 
     */
    private async acquireTokenSilentAsync(request: SilentRequest, account: AccountInfo): Promise<AuthenticationResult>{
        const silentCacheClient = new SilentCacheClient(this.config, this.browserStorage, this.browserCrypto, this.logger, this.eventHandler, this.navigationClient);
        const silentRequest = silentCacheClient.initializeSilentRequest(request, account);
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);

        return silentCacheClient.acquireToken(silentRequest).catch(async () => {
            try {
                const tokenRenewalResult = await this.acquireTokenByRefreshToken(silentRequest);
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, tokenRenewalResult);
                return tokenRenewalResult;
            } catch (tokenRenewalError) {
                this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError);
                throw tokenRenewalError;
            }
        });
    }
}
