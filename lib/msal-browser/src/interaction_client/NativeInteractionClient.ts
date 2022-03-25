/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger, ICrypto, PromptValue, AuthToken, Constants, AccountEntity, AuthorityType, ScopeSet, TimeUtils, AuthenticationScheme, UrlString, OIDC_DEFAULT_SCOPES } from "@azure/msal-common";
import { BaseInteractionClient } from "./BaseInteractionClient";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { NativeExtensionMethod, ApiId, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { NativeExtensionRequestBody, NativeTokenRequest } from "../broker/nativeBroker/NativeRequest";
import { NativeResponse } from "../broker/nativeBroker/NativeResponse";
import { NativeAuthError } from "../error/NativeAuthError";
import { RedirectRequest } from "../request/RedirectRequest";
import { NavigationOptions } from "../navigation/NavigationOptions";
import { INavigationClient } from "../navigation/INavigationClient";

export class NativeInteractionClient extends BaseInteractionClient {
    protected apiId: ApiId;
    protected wamMessageHandler: NativeMessageHandler;

    constructor(config: BrowserConfiguration, browserStorage: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, navigationClient: INavigationClient, apiId: ApiId, provider: NativeMessageHandler, correlationId?: string) {
        super(config, browserStorage, browserCrypto, logger, eventHandler, navigationClient, provider, correlationId);
        this.apiId = apiId;
        this.wamMessageHandler = provider;
    }

    /**
     * Acquire token from WAM via browser extension
     * @param request 
     */
    async acquireToken(request: PopupRequest|SilentRequest|SsoSilentRequest, accountId?: string): Promise<AuthenticationResult> {
        this.logger.trace("WamInteractionClient - acquireToken called.");
        const wamRequest = this.initializeWamRequest(request, accountId);

        const messageBody: NativeExtensionRequestBody = {
            method: NativeExtensionMethod.GetToken,
            request: wamRequest
        };

        const reqTimestamp = TimeUtils.nowSeconds();
        const response: object = await this.wamMessageHandler.sendMessage(messageBody);
        this.validateWamResponse(response);
        return this.handleWamResponse(response as NativeResponse, wamRequest, reqTimestamp);
    }

    /**
     * Acquires a token from WAM then redirects to the redirectUri instead of returning the response                                
     * @param request 
     */
    async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        this.logger.trace("WamInteractionClient - acquireTokenRedirect called.");
        const wamRequest = this.initializeWamRequest(request);

        const messageBody: NativeExtensionRequestBody = {
            method: NativeExtensionMethod.GetToken,
            request: wamRequest
        };

        try {
            const response: object = await this.wamMessageHandler.sendMessage(messageBody);
            this.validateWamResponse(response);
        } catch (e) {
            // Only throw fatal errors here to allow application to fallback to regular redirect. Otherwise proceed and the error will be thrown in handleRedirectPromise
            if (e instanceof NativeAuthError && e.isFatal()) {
                throw e;
            }
        }
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
        this.logger.trace("WamInteractionClient - handleRedirectPromise called.");
        if (!this.browserStorage.isInteractionInProgress(true)) {
            this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
            return null;
        }

        const cachedRequest = this.browserStorage.getCachedNativeRequest();
        if (!cachedRequest) {
            this.logger.verbose("WamInteractionClient - handleRedirectPromise called but there is no cached request, returning null.");
            return null;
        }
        
        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST));

        const request = {
            ...cachedRequest,
            prompt: PromptValue.NONE // If prompt was specified on the request, it was already shown before the "redirect". This prevents double prompts.
        };

        const messageBody: NativeExtensionRequestBody = {
            method: NativeExtensionMethod.GetToken,
            request: request
        };

        const reqTimestamp = TimeUtils.nowSeconds();

        try {
            this.logger.verbose("WamInteractionClient - handleRedirectPromise sending message to native broker.");
            const response: object = await this.wamMessageHandler.sendMessage(messageBody);
            this.validateWamResponse(response);
            const result = this.handleWamResponse(response as NativeResponse, request, reqTimestamp);
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
    logout(): Promise<void> {
        this.logger.trace("WamInteractionClient - logout called.");
        return Promise.reject("Logout not implemented yet");
    }

    /**
     * Transform response from WAM into AuthenticationResult object which will be returned to the end user
     * @param response 
     * @param request 
     * @param reqTimestamp 
     */
    protected async handleWamResponse(response: NativeResponse, request: NativeTokenRequest, reqTimestamp: number): Promise<AuthenticationResult> {
        this.logger.trace("WamInteractionClient - handleWamResponse called.");
        // create an idToken object (not entity)
        const idTokenObj = new AuthToken(response.id_token || Constants.EMPTY_STRING, this.browserCrypto);

        // Get the preferred_cache domain for the given authority
        const authority = await this.getDiscoveredAuthority(request.authority);
        const authorityPreferredCache = authority.getPreferredCache();

        // Save account in browser storage
        const homeAccountIdentifier = AccountEntity.generateHomeAccountId(response.client_info || Constants.EMPTY_STRING, AuthorityType.Default, this.logger, this.browserCrypto, idTokenObj);
        const accountEntity = AccountEntity.createAccount(response.client_info, homeAccountIdentifier, idTokenObj, undefined, undefined, undefined, undefined, authorityPreferredCache, response.account.id);
        this.browserStorage.setAccount(accountEntity);

        // If scopes not returned in server response, use request scopes
        const responseScopes = response.scopes ? ScopeSet.fromString(response.scopes) : ScopeSet.fromString(request.scopes);
        
        const accountProperties = response.account.properties || {};
        const uid = accountProperties["UID"] || idTokenObj.claims.oid || idTokenObj.claims.sub || Constants.EMPTY_STRING;
        const tid = accountProperties["TenantId"] || idTokenObj.claims.tid || Constants.EMPTY_STRING;

        const result: AuthenticationResult = {
            authority: authority.canonicalAuthority,
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

        // Remove any existing cached tokens for this account
        this.browserStorage.removeAccountContext(accountEntity).catch((e) => {
            this.logger.error(`Error occurred while removing account context from browser storage. ${e}`);
        });

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
            throw NativeAuthError.createUnexpectedError("Response missing expected properties.");
        }
    }

    /**
     * Translates developer provided request object into WamRequest object
     * @param request 
     */
    protected initializeWamRequest(request: PopupRequest|SsoSilentRequest, accountId?: string): NativeTokenRequest {
        this.logger.trace("WamInteractionClient - initializeWamRequest called");

        const authority = request.authority || this.config.auth.authority;
        const canonicalAuthority = new UrlString(authority);
        canonicalAuthority.validateAsUri();
        
        const scopes = request && request.scopes || [];
        const scopeSet = new ScopeSet(scopes);
        scopeSet.appendScopes(OIDC_DEFAULT_SCOPES);

        const instanceAware: boolean = !!(request.extraQueryParameters && request.extraQueryParameters.instance_aware);

        const validatedRequest: NativeTokenRequest = {
            ...request,
            clientId: this.config.auth.clientId,
            authority: canonicalAuthority.urlString,
            scopes: scopeSet.printScopes(),
            redirectUri: this.getRedirectUri(request.redirectUri),
            correlationId: this.correlationId,
            instanceAware: instanceAware,
            extraParameters: JSON.stringify({
                ...request.extraQueryParameters,
                ...request.tokenQueryParameters
            }),
            extendedExpiryToken: false // Make this configurable?
        };

        if (this.apiId === ApiId.ssoSilent || this.apiId === ApiId.acquireTokenSilent_silentFlow) {
            validatedRequest.prompt = PromptValue.NONE;
        }

        if (accountId) {
            validatedRequest.accountId = accountId;
        } else {
            const account = request.account || this.browserStorage.getAccountInfoByHints(validatedRequest.loginHint, validatedRequest.sid) || this.browserStorage.getActiveAccount();
    
            if (account) {
                validatedRequest.accountId = account.nativeAccountId;
                if (!validatedRequest.accountId) {
                    validatedRequest.sid = account.idTokenClaims && account.idTokenClaims["sid"];
                    validatedRequest.loginHint = account.idTokenClaims && (account.idTokenClaims["login_hint"] || account.idTokenClaims["preferred_username"]);
                }
            } else {
                // Check for ADAL/MSAL v1 SSO
                const loginHint = this.browserStorage.getLegacyLoginHint();
                if (loginHint) {
                    validatedRequest.loginHint = loginHint;
                }
            }
        }

        return validatedRequest;
    }
}
