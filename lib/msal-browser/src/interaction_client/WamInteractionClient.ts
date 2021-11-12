/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger, ICrypto, PromptValue, AuthToken, Constants, AccountEntity, AuthorityType, ScopeSet, TimeUtils, AuthenticationScheme, UrlString, OIDC_DEFAULT_SCOPES } from "@azure/msal-common";
import { BaseInteractionClient } from "./BaseInteractionClient";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { WamMessageHandler } from "../broker/wam/WamMessageHandler";
import { WamExtensionMethod, ApiId, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { WamExtensionRequestBody, WamTokenRequest } from "../broker/wam/WamRequest";
import { WamResponse } from "../broker/wam/WamResponse";
import { WamAuthError } from "../error/WamAuthError";
import { RedirectRequest } from "../request/RedirectRequest";
import { NavigationOptions } from "../navigation/NavigationOptions";
import { INavigationClient } from "../navigation/INavigationClient";

export class WamInteractionClient extends BaseInteractionClient {
    protected provider: WamMessageHandler;
    protected apiId: ApiId;

    constructor(config: BrowserConfiguration, browserStorage: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, navigationClient: INavigationClient, apiId: ApiId, provider: WamMessageHandler, correlationId?: string) {
        super(config, browserStorage, browserCrypto, logger, eventHandler, navigationClient, correlationId);
        this.provider = provider;
        this.apiId = apiId;
    }

    /**
     * Acquire token from WAM via browser extension
     * @param request 
     */
    async acquireToken(request: PopupRequest|SilentRequest|SsoSilentRequest): Promise<AuthenticationResult> {
        this.logger.trace("WamInteractionClient - acquireToken called.");
        const wamRequest = this.initializeWamRequest(request);

        const messageBody: WamExtensionRequestBody = {
            method: WamExtensionMethod.GetToken,
            request: wamRequest
        };

        const reqTimestamp = TimeUtils.nowSeconds();
        const response: object = await this.provider.sendMessage(messageBody);
        this.validateWamResponse(response);
        return this.handleWamResponse(response as WamResponse, wamRequest, reqTimestamp);
    }

    /**
     * Acquires a token from WAM then redirects to the redirectUri instead of returning the response                                
     * @param request 
     */
    async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        this.logger.trace("WamInteractionClient - acquireTokenRedirect called.");
        const wamRequest = this.initializeWamRequest(request);

        const messageBody: WamExtensionRequestBody = {
            method: WamExtensionMethod.GetToken,
            request: wamRequest
        };

        try {
            const response: object = await this.provider.sendMessage(messageBody);
            this.validateWamResponse(response);
        } catch (e) {
            // Only throw fatal errors here to allow application to fallback to regular redirect. Otherwise proceed and the error will be thrown in handleRedirectPromise
            if (e instanceof WamAuthError && e.isFatal()) {
                throw e;
            }
        }

        this.browserStorage.setInteractionInProgress(true);
        this.browserStorage.setTemporaryCache(TemporaryCacheKeys.CORRELATION_ID, this.correlationId, true);
        this.browserStorage.setTemporaryCache(TemporaryCacheKeys.NATIVE_REQUEST, JSON.stringify(wamRequest), true);

        const navigationOptions: NavigationOptions = {
            apiId: ApiId.acquireTokenRedirect,
            timeout: this.config.system.redirectNavigationTimeout,
            noHistory: false
        };
        const redirectUri = this.config.auth.navigateToLoginRequestUrl ? window.location.href : this.getRedirectUri(request.redirectUri);
        await this.navigationClient.navigateExternal(redirectUri, navigationOptions); // Need to treat this as external to ensure handleRedirectPromise is run again
    }

    /**
     * If the previous page called WAM for a token using redirect APIs, send the same request again and return the response
     */
    async handleRedirectPromise(): Promise<AuthenticationResult | null> {
        if (!this.browserStorage.isInteractionInProgress(true)) {
            this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
            return null;
        }

        const cachedRequest = this.browserStorage.getCachedNativeRequest();
        if (!cachedRequest) {
            return null;
        }

        const request = {
            ...cachedRequest,
            prompt: PromptValue.NONE // If prompt was specified on the request, it was already shown before the "redirect". This prevents double prompts.
        };

        const messageBody: WamExtensionRequestBody = {
            method: WamExtensionMethod.GetToken,
            request: request
        };

        const reqTimestamp = TimeUtils.nowSeconds();

        try {
            const response: object = await this.provider.sendMessage(messageBody);
            this.validateWamResponse(response);
            const result = this.handleWamResponse(response as WamResponse, request, reqTimestamp);
            this.browserStorage.setInteractionInProgress(false);
            return result;
        } catch (e) {
            this.browserStorage.setInteractionInProgress(false);
            throw e;
        }
    }

    /**
     * Logout from WAM via browser extension
     * @param request 
     */
    logout(request?: EndSessionRequest): Promise<void> {
        this.logger.trace("WamInteractionClient - logout called.");
        return Promise.reject("Logout not implemented yet");
    }

    /**
     * Transform response from WAM into AuthenticationResult object which will be returned to the end user
     * @param response 
     * @param request 
     * @param reqTimestamp 
     */
    protected handleWamResponse(response: WamResponse, request: WamTokenRequest, reqTimestamp: number): AuthenticationResult {
        this.logger.trace("WamInteractionClient - handleWamResponse called.");
        // create an idToken object (not entity)
        const idTokenObj = new AuthToken(response.id_token || Constants.EMPTY_STRING, this.browserCrypto);

        // Save account in browser storage
        const homeAccountIdentifier = AccountEntity.generateHomeAccountId(response.client_info || Constants.EMPTY_STRING, AuthorityType.Default, this.logger, this.browserCrypto, idTokenObj);
        const accountEntity = AccountEntity.createAccount(response.client_info, homeAccountIdentifier, idTokenObj, undefined, undefined, undefined, undefined, request.authority, response.account.id);
        this.browserStorage.setAccount(accountEntity);

        // If scopes not returned in server response, use request scopes
        const responseScopes = response.scopes ? ScopeSet.fromString(response.scopes) : ScopeSet.fromString(request.scopes);

        const uid = response.account.properties["UID"] || idTokenObj.claims.oid || idTokenObj.claims.sub || Constants.EMPTY_STRING;
        const tid = response.account.properties["TenantId"] || idTokenObj.claims.tid || Constants.EMPTY_STRING;

        const result: AuthenticationResult = {
            authority: request.authority,
            uniqueId: uid,
            tenantId: tid,
            scopes: responseScopes.asArray(),
            account: accountEntity.getAccountInfo(),
            idToken: response.id_token,
            idTokenClaims: idTokenObj.claims,
            accessToken: response.access_token,
            fromCache: false,
            expiresOn: new Date(Number(reqTimestamp + response.expires_in) * 1000),
            tokenType: AuthenticationScheme.BEARER,
            correlationId: this.correlationId,
            state: response.state
        };

        return result;
    }

    /**
     * Validates WAM response before processing
     * @param response 
     */
    private validateWamResponse(response: object): void {
        if (
            response.hasOwnProperty("access_token") &&
            response.hasOwnProperty("id_token") &&
            response.hasOwnProperty("client_info") &&
            response.hasOwnProperty("account") &&
            response.hasOwnProperty("scopes") &&
            response.hasOwnProperty("expires_in")
        ) {
            return;
        } else {
            throw WamAuthError.createUnexpectedError("Response missing expected properties.");
        }
    }

    /**
     * Translates developer provided request object into WamRequest object
     * @param request 
     */
    protected initializeWamRequest(request: PopupRequest|SsoSilentRequest): WamTokenRequest {
        this.logger.trace("WamInteractionClient - initializeWamRequest called");

        if (request.authenticationScheme && request.authenticationScheme !== AuthenticationScheme.BEARER) {
            // Only Bearer flows are supported right now
            throw WamAuthError.createWamAtPopNotSupportedError();
        }

        const authority = request.authority || this.config.auth.authority;
        const canonicalAuthority = new UrlString(authority);
        canonicalAuthority.validateAsUri();
        
        const scopes = request && request.scopes || [];
        const scopeSet = new ScopeSet(scopes);
        scopeSet.appendScopes(OIDC_DEFAULT_SCOPES);

        const validatedRequest: WamTokenRequest = {
            ...request,
            clientId: this.config.auth.clientId,
            authority: canonicalAuthority.urlString,
            scopes: scopeSet.printScopes(),
            redirectUri: this.getRedirectUri(request.redirectUri),
            correlationId: this.correlationId,
            instanceAware: false,
            extraParameters: {
                ...request.extraQueryParameters,
                ...request.tokenQueryParameters
            },
            extendedExpiryToken: false // Make this configurable?
        };

        if (this.apiId === ApiId.ssoSilent || this.apiId === ApiId.acquireTokenSilent_silentFlow) {
            validatedRequest.prompt = PromptValue.NONE;
        }

        let account = request.account || this.browserStorage.getActiveAccount();
        if (!account && (request.loginHint || request.sid)) {
            account = this.browserStorage.getAccountInfoByHints(request.loginHint, request.sid);
        }

        if (account) {
            validatedRequest.accountId = account.nativeAccountId;
            if (!validatedRequest.accountId) {
                validatedRequest.sid = account.idTokenClaims && account.idTokenClaims["sid"];
                validatedRequest.loginHint = account.username;
            }
        } else {
            // Check for ADAL/MSAL v1 SSO
            const loginHint = this.browserStorage.getLegacyLoginHint();
            if (loginHint) {
                validatedRequest.loginHint = loginHint;
            }
        }

        return validatedRequest;
    }
}
