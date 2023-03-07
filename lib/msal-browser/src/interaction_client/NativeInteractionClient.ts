/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult, Logger, ICrypto, PromptValue, AuthToken, Constants, AccountEntity, AuthorityType, ScopeSet, TimeUtils, AuthenticationScheme, UrlString, OIDC_DEFAULT_SCOPES, PopTokenGenerator, SignedHttpRequestParameters, IPerformanceClient, PerformanceEvents, IdTokenEntity, AccessTokenEntity, ClientAuthError, AuthError, CommonSilentFlowRequest, AccountInfo } from "@azure/msal-common";
import { BaseInteractionClient } from "./BaseInteractionClient";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { PopupRequest } from "../request/PopupRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { NativeExtensionMethod, ApiId, TemporaryCacheKeys, NativeConstants } from "../utils/BrowserConstants";
import { NativeExtensionRequestBody, NativeTokenRequest } from "../broker/nativeBroker/NativeRequest";
import { MATS, NativeResponse } from "../broker/nativeBroker/NativeResponse";
import { NativeAuthError } from "../error/NativeAuthError";
import { RedirectRequest } from "../request/RedirectRequest";
import { NavigationOptions } from "../navigation/NavigationOptions";
import { INavigationClient } from "../navigation/INavigationClient";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { SilentCacheClient } from "./SilentCacheClient";

export class NativeInteractionClient extends BaseInteractionClient {
    protected apiId: ApiId;
    protected accountId: string;
    protected nativeMessageHandler: NativeMessageHandler;
    protected silentCacheClient: SilentCacheClient;
    protected nativeStorageManager: BrowserCacheManager;

    constructor(config: BrowserConfiguration, browserStorage: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, navigationClient: INavigationClient, apiId: ApiId, performanceClient: IPerformanceClient, provider: NativeMessageHandler, accountId: string, nativeStorageImpl: BrowserCacheManager, correlationId?: string) {
        super(config, browserStorage, browserCrypto, logger, eventHandler, navigationClient, performanceClient, provider, correlationId);
        this.apiId = apiId;
        this.accountId = accountId;
        this.nativeMessageHandler = provider;
        this.nativeStorageManager = nativeStorageImpl;
        this.silentCacheClient = new SilentCacheClient(config, this.nativeStorageManager, browserCrypto, logger, eventHandler, navigationClient, performanceClient, provider, correlationId);
    }

    /**
     * Acquire token from native platform via browser extension
     * @param request
     */
    async acquireToken(request: PopupRequest|SilentRequest|SsoSilentRequest): Promise<AuthenticationResult> {
        this.logger.trace("NativeInteractionClient - acquireToken called.");

        // start the perf measurement
        const nativeATMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.NativeInteractionClientAcquireToken, request.correlationId);
        const reqTimestamp = TimeUtils.nowSeconds();

        // initialize native request
        const nativeRequest = await this.initializeNativeRequest(request);
        
        // check if the tokens can be retrieved from internal cache
        try {
            const result = await this.acquireTokensFromCache(this.accountId, nativeRequest);
            nativeATMeasurement.endMeasurement({
                success: true,
                isNativeBroker: false, // Should be true only when the result is coming directly from the broker
                fromCache: true
            });
            return result;
        } catch (e) {
            // continue with a native call for any and all errors
            this.logger.info("MSAL internal Cache does not contain tokens, proceed to make a native call");
        }

        // fall back to native calls
        const messageBody: NativeExtensionRequestBody = {
            method: NativeExtensionMethod.GetToken,
            request: nativeRequest
        };

        const response: object = await this.nativeMessageHandler.sendMessage(messageBody);
        const validatedResponse: NativeResponse = this.validateNativeResponse(response);

        return this.handleNativeResponse(validatedResponse, nativeRequest, reqTimestamp)
            .then((result: AuthenticationResult) => {
                nativeATMeasurement.endMeasurement({
                    success: true,
                    isNativeBroker: true,
                    requestId: result.requestId
                });
                return result;
            })
            .catch((error: AuthError) => {
                nativeATMeasurement.endMeasurement({
                    success: false,
                    errorCode: error.errorCode,
                    subErrorCode: error.subError,
                    isNativeBroker: true
                });
                throw error;
            });
    }

    /**
     * Creates silent flow request
     * @param request
     * @param cachedAccount
     * @returns CommonSilentFlowRequest
     */
    private createSilentCacheRequest(request: NativeTokenRequest, cachedAccount: AccountInfo): CommonSilentFlowRequest {
        return {
            authority: request.authority,
            correlationId: this.correlationId,
            scopes: ScopeSet.fromString(request.scope).asArray(),
            account: cachedAccount,
            forceRefresh: false,
        };
    }

    /**
     * Fetches the tokens from the cache if un-expired
     * @param nativeAccountId
     * @param request
     * @returns authenticationResult
     */
    protected async acquireTokensFromCache(nativeAccountId: string, request: NativeTokenRequest): Promise<AuthenticationResult> {

        // fetch the account from in-memory cache
        const accountEntity = this.browserStorage.readAccountFromCacheWithNativeAccountId(nativeAccountId);
        if (!accountEntity) {
            throw ClientAuthError.createNoAccountFoundError();
        }
        const account = accountEntity.getAccountInfo();

        // leverage silent flow for cached tokens retrieval
        try {
            const silentRequest = this.createSilentCacheRequest(request, account);
            const result = await this.silentCacheClient.acquireToken(silentRequest);
            return result;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Acquires a token from native platform then redirects to the redirectUri instead of returning the response
     * @param request
     */
    async acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        this.logger.trace("NativeInteractionClient - acquireTokenRedirect called.");
        const nativeRequest = await this.initializeNativeRequest(request);

        const messageBody: NativeExtensionRequestBody = {
            method: NativeExtensionMethod.GetToken,
            request: nativeRequest
        };

        try {
            const response: object = await this.nativeMessageHandler.sendMessage(messageBody);
            this.validateNativeResponse(response);
        } catch (e) {
            // Only throw fatal errors here to allow application to fallback to regular redirect. Otherwise proceed and the error will be thrown in handleRedirectPromise
            if (e instanceof NativeAuthError && e.isFatal()) {
                throw e;
            }
        }
        this.browserStorage.setTemporaryCache(TemporaryCacheKeys.NATIVE_REQUEST, JSON.stringify(nativeRequest), true);

        const navigationOptions: NavigationOptions = {
            apiId: ApiId.acquireTokenRedirect,
            timeout: this.config.system.redirectNavigationTimeout,
            noHistory: false
        };
        const redirectUri = this.config.auth.navigateToLoginRequestUrl ? window.location.href : this.getRedirectUri(request.redirectUri);
        await this.navigationClient.navigateExternal(redirectUri, navigationOptions); // Need to treat this as external to ensure handleRedirectPromise is run again
    }

    /**
     * If the previous page called native platform for a token using redirect APIs, send the same request again and return the response
     */
    async handleRedirectPromise(): Promise<AuthenticationResult | null> {
        this.logger.trace("NativeInteractionClient - handleRedirectPromise called.");
        if (!this.browserStorage.isInteractionInProgress(true)) {
            this.logger.info("handleRedirectPromise called but there is no interaction in progress, returning null.");
            return null;
        }

        // remove prompt from the request to prevent WAM from prompting twice
        const cachedRequest = this.browserStorage.getCachedNativeRequest();
        if (!cachedRequest) {
            this.logger.verbose("NativeInteractionClient - handleRedirectPromise called but there is no cached request, returning null.");
            return null;
        }

        const { prompt, ...request} = cachedRequest;
        if (prompt) {
            this.logger.verbose("NativeInteractionClient - handleRedirectPromise called and prompt was included in the original request, removing prompt from cached request to prevent second interaction with native broker window.");
        }

        this.browserStorage.removeItem(this.browserStorage.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST));

        const messageBody: NativeExtensionRequestBody = {
            method: NativeExtensionMethod.GetToken,
            request: request
        };

        const reqTimestamp = TimeUtils.nowSeconds();

        try {
            this.logger.verbose("NativeInteractionClient - handleRedirectPromise sending message to native broker.");
            const response: object = await this.nativeMessageHandler.sendMessage(messageBody);
            this.validateNativeResponse(response);
            const result = this.handleNativeResponse(response as NativeResponse, request, reqTimestamp);
            this.browserStorage.setInteractionInProgress(false);
            return result;
        } catch (e) {
            this.browserStorage.setInteractionInProgress(false);
            throw e;
        }
    }

    /**
     * Logout from native platform via browser extension
     * @param request
     */
    logout(): Promise<void> {
        this.logger.trace("NativeInteractionClient - logout called.");
        return Promise.reject("Logout not implemented yet");
    }

    /**
     * Transform response from native platform into AuthenticationResult object which will be returned to the end user
     * @param response
     * @param request
     * @param reqTimestamp
     */
    protected async handleNativeResponse(response: NativeResponse, request: NativeTokenRequest, reqTimestamp: number): Promise<AuthenticationResult> {
        this.logger.trace("NativeInteractionClient - handleNativeResponse called.");

        if (response.account.id !== request.accountId) {
            // User switch in native broker prompt is not supported. All users must first sign in through web flow to ensure server state is in sync
            throw NativeAuthError.createUserSwitchError();
        }

        // Get the preferred_cache domain for the given authority
        const authority = await this.getDiscoveredAuthority(request.authority);
        const authorityPreferredCache = authority.getPreferredCache();

        // generate identifiers
        const idTokenObj = this.createIdTokenObj(response);
        const homeAccountIdentifier = this.createHomeAccountIdentifier(response, idTokenObj);
        const accountEntity = this.createAccountEntity(response, homeAccountIdentifier, idTokenObj, authorityPreferredCache);

        // generate authenticationResult
        const result = await this.generateAuthenticationResult(response, request, idTokenObj, accountEntity, authority.canonicalAuthority, reqTimestamp);

        // cache accounts and tokens in the appropriate storage
        this.cacheAccount(accountEntity);
        this.cacheNativeTokens(response, request, homeAccountIdentifier, idTokenObj, result.accessToken, result.tenantId, reqTimestamp);
        
        return result;
    }

    /**
     * Create an idToken Object (not entity)
     * @param response 
     * @returns 
     */
    protected createIdTokenObj(response: NativeResponse): AuthToken {
        return new AuthToken(response.id_token || Constants.EMPTY_STRING, this.browserCrypto);
    }

    /**
     * creates an homeAccountIdentifier for the account
     * @param response 
     * @param idTokenObj 
     * @returns 
     */
    protected createHomeAccountIdentifier(response: NativeResponse, idTokenObj: AuthToken): string {
        // Save account in browser storage
        const homeAccountIdentifier = AccountEntity.generateHomeAccountId(response.client_info || Constants.EMPTY_STRING, AuthorityType.Default, this.logger, this.browserCrypto, idTokenObj);

        return homeAccountIdentifier;
    }

    /**
     * Creates account entity
     * @param response 
     * @param homeAccountIdentifier 
     * @param idTokenObj 
     * @param authority 
     * @returns 
     */
    protected createAccountEntity(response: NativeResponse, homeAccountIdentifier: string, idTokenObj: AuthToken, authority: string): AccountEntity {

        return AccountEntity.createAccount(response.client_info, homeAccountIdentifier, idTokenObj, undefined, undefined, undefined, authority, response.account.id);
    }

    /**
     * Helper to generate scopes
     * @param response 
     * @param request 
     * @returns 
     */
    generateScopes(response: NativeResponse, request: NativeTokenRequest): ScopeSet {
        return response.scope ? ScopeSet.fromString(response.scope) : ScopeSet.fromString(request.scope);
    }

    /**
     * If PoP token is requesred, records the PoP token if returned from the WAM, else generates one in the browser
     * @param request 
     * @param response 
     */
    async generatePopAccessToken(response: NativeResponse, request: NativeTokenRequest): Promise<string> {
        
        if(request.tokenType === AuthenticationScheme.POP) {
            /** 
             * This code prioritizes SHR returned from the native layer. In case of error/SHR not calculated from WAM and the AT 
             * is still received, SHR is calculated locally
             */
        
            // Check if native layer returned an SHR token
            if (response.shr) {
                this.logger.trace("handleNativeServerResponse: SHR is enabled in native layer");
                return response.shr;
            }

            // Generate SHR in msal js if WAM does not compute it when POP is enabled
            const popTokenGenerator: PopTokenGenerator = new PopTokenGenerator(this.browserCrypto);
            const shrParameters: SignedHttpRequestParameters = {
                resourceRequestMethod: request.resourceRequestMethod,
                resourceRequestUri: request.resourceRequestUri,
                shrClaims: request.shrClaims,
                shrNonce: request.shrNonce
            };

            /**
             * KeyID must be present in the native request from when the PoP key was generated in order for
             * PopTokenGenerator to query the full key for signing
             */
            if (!request.keyId) {
                throw ClientAuthError.createKeyIdMissingError();
            }
            return await popTokenGenerator.signPopToken(response.access_token, request.keyId, shrParameters);
        } else {
            return response.access_token;
        }
    }

    /**
     * Generates authentication result
     * @param response 
     * @param request 
     * @param idTokenObj 
     * @param accountEntity 
     * @param authority 
     * @param reqTimestamp 
     * @returns 
     */
    protected async generateAuthenticationResult(response: NativeResponse, request: NativeTokenRequest, idTokenObj: AuthToken, accountEntity: AccountEntity, authority: string, reqTimestamp: number): Promise<AuthenticationResult> {

        // Add Native Broker fields to Telemetry
        const mats = this.addTelemetryFromNativeResponse(response);

        // If scopes not returned in server response, use request scopes
        const responseScopes = response.scope ? ScopeSet.fromString(response.scope) : ScopeSet.fromString(request.scope);

        const accountProperties = response.account.properties || {};
        const uid = accountProperties["UID"] || idTokenObj.claims.oid || idTokenObj.claims.sub || Constants.EMPTY_STRING;
        const tid = accountProperties["TenantId"] || idTokenObj.claims.tid || Constants.EMPTY_STRING;

        // generate PoP token as needed
        const responseAccessToken = await this.generatePopAccessToken(response, request);
        const tokenType = (request.tokenType === AuthenticationScheme.POP) ? AuthenticationScheme.POP : AuthenticationScheme.BEARER;

        const result: AuthenticationResult = {
            authority: authority,
            uniqueId: uid,
            tenantId: tid,
            scopes: responseScopes.asArray(),
            account: accountEntity.getAccountInfo(),
            idToken: response.id_token,
            idTokenClaims: idTokenObj.claims,
            accessToken: responseAccessToken,
            fromCache: mats ? this.isResponseFromCache(mats) : false,
            expiresOn: new Date(Number(reqTimestamp + response.expires_in) * 1000),
            tokenType: tokenType,
            correlationId: this.correlationId,
            state: response.state,
            fromNativeBroker: true
        };

        return result;
    }

    /**
     * cache the account entity in browser storage
     * @param accountEntity 
     */
    cacheAccount(accountEntity: AccountEntity): void{
        // Store the account info and hence `nativeAccountId` in browser cache
        this.browserStorage.setAccount(accountEntity);

        // Remove any existing cached tokens for this account in browser storage
        this.browserStorage.removeAccountContext(accountEntity).catch((e) => {
            this.logger.error(`Error occurred while removing account context from browser storage. ${e}`);
        });
    }

    /**
     * Stores the access_token and id_token in inmemory storage
     * @param response 
     * @param request 
     * @param homeAccountIdentifier 
     * @param idTokenObj 
     * @param responseAccessToken 
     * @param tenantId 
     * @param reqTimestamp 
     */
    cacheNativeTokens(response: NativeResponse, request: NativeTokenRequest, homeAccountIdentifier: string, idTokenObj: AuthToken, responseAccessToken: string, tenantId: string, reqTimestamp: number): void {

        // cache idToken in inmemory storage
        const idTokenEntity = IdTokenEntity.createIdTokenEntity(
            homeAccountIdentifier,
            request.authority,
            response.id_token || Constants.EMPTY_STRING,
            request.clientId,
            idTokenObj.claims.tid || Constants.EMPTY_STRING,
        );
        this.nativeStorageManager.setIdTokenCredential(idTokenEntity);

        // cache accessToken in inmemory storage
        const expiresIn: number = (request.tokenType === AuthenticationScheme.POP)
            ? Constants.SHR_NONCE_VALIDITY
            : (
                typeof response.expires_in === "string"
                    ? parseInt(response.expires_in, 10)
                    : response.expires_in
            ) || 0;
        const tokenExpirationSeconds = reqTimestamp + expiresIn;
        const responseScopes = this.generateScopes(response, request);
        const accessTokenEntity = AccessTokenEntity.createAccessTokenEntity(
            homeAccountIdentifier,
            request.authority,
            responseAccessToken,
            request.clientId,
            tenantId,
            responseScopes.printScopes(),
            tokenExpirationSeconds,
            0,
            this.browserCrypto
        );
        this.nativeStorageManager.setAccessTokenCredential(accessTokenEntity);
    }

    protected addTelemetryFromNativeResponse(response: NativeResponse): MATS | null {

        const mats = this.getMATSFromResponse(response);

        if (!mats){
            return null;
        }
        
        this.performanceClient.addStaticFields({
            extensionId: this.nativeMessageHandler.getExtensionId(),
            extensionVersion: this.nativeMessageHandler.getExtensionVersion(),
            matsBrokerVersion: mats.broker_version,
            matsAccountJoinOnStart: mats.account_join_on_start,
            matsAccountJoinOnEnd: mats.account_join_on_end,
            matsDeviceJoin: mats.device_join,
            matsPromptBehavior: mats.prompt_behavior,
            matsApiErrorCode: mats.api_error_code,
            matsUiVisible: mats.ui_visible,
            matsSilentCode: mats.silent_code,
            matsSilentBiSubCode: mats.silent_bi_sub_code,
            matsSilentMessage: mats.silent_message,
            matsSilentStatus: mats.silent_status,
            matsHttpStatus: mats.http_status,
            matsHttpEventCount: mats.http_event_count
        }, this.correlationId);

        return mats;
    }

    /**
     * Validates native platform response before processing
     * @param response
     */
    private validateNativeResponse(response: object): NativeResponse {
        if (
            response.hasOwnProperty("access_token") &&
            response.hasOwnProperty("id_token") &&
            response.hasOwnProperty("client_info") &&
            response.hasOwnProperty("account") &&
            response.hasOwnProperty("scope") &&
            response.hasOwnProperty("expires_in")
        ) {
            return response as NativeResponse;
        } else {
            throw NativeAuthError.createUnexpectedError("Response missing expected properties.");
        }
    }

    /**
     * Gets MATS telemetry from native response
     * @param response
     * @returns
     */
    private getMATSFromResponse(response: NativeResponse): MATS|null {
        if (response.properties.MATS) {
            try {
                return JSON.parse(response.properties.MATS);
            } catch (e) {
                this.logger.error("NativeInteractionClient - Error parsing MATS telemetry, returning null instead");
            }
        }

        return null;
    }

    /**
     * Returns whether or not response came from native cache
     * @param response
     * @returns
     */
    protected isResponseFromCache(mats: MATS): boolean {
        if (typeof mats.is_cached === "undefined") {
            this.logger.verbose("NativeInteractionClient - MATS telemetry does not contain field indicating if response was served from cache. Returning false.");
            return false;
        }

        return !!mats.is_cached;
    }

    /**
     * Translates developer provided request object into NativeRequest object
     * @param request
     */
    protected async initializeNativeRequest(request: PopupRequest|SsoSilentRequest): Promise<NativeTokenRequest> {
        this.logger.trace("NativeInteractionClient - initializeNativeRequest called");

        const authority = request.authority || this.config.auth.authority;
        const canonicalAuthority = new UrlString(authority);
        canonicalAuthority.validateAsUri();

        // scopes are expected to be received by the native broker as "scope" and will be added to the request below. Other properties that should be dropped from the request to the native broker can be included in the object destructuring here.
        const { scopes, ...remainingProperties } = request; 
        const scopeSet = new ScopeSet(scopes || []);
        scopeSet.appendScopes(OIDC_DEFAULT_SCOPES);

        const getPrompt = () => {
            // If request is silent, prompt is always none
            switch (this.apiId) {
                case ApiId.ssoSilent:
                case ApiId.acquireTokenSilent_silentFlow:
                    this.logger.trace("initializeNativeRequest: silent request sets prompt to none");
                    return PromptValue.NONE;
                default:
                    break;
            }

            // Prompt not provided, request may proceed and native broker decides if it needs to prompt
            if (!request.prompt) {
                this.logger.trace("initializeNativeRequest: prompt was not provided");
                return undefined;
            }

            // If request is interactive, check if prompt provided is allowed to go directly to native broker
            switch (request.prompt) {
                case PromptValue.NONE:
                case PromptValue.CONSENT:
                case PromptValue.LOGIN:
                    this.logger.trace("initializeNativeRequest: prompt is compatible with native flow");
                    return request.prompt;
                default:
                    this.logger.trace(`initializeNativeRequest: prompt = ${request.prompt} is not compatible with native flow`);
                    throw BrowserAuthError.createNativePromptParameterNotSupportedError();
            }
        };
        
        const validatedRequest: NativeTokenRequest = {
            ...remainingProperties,
            accountId: this.accountId,
            clientId: this.config.auth.clientId,
            authority: canonicalAuthority.urlString,
            scope: scopeSet.printScopes(),
            redirectUri: this.getRedirectUri(request.redirectUri),
            prompt: getPrompt(),
            correlationId: this.correlationId,
            tokenType: request.authenticationScheme,
            windowTitleSubstring: document.title,
            extraParameters: {
                ...request.extraQueryParameters,
                ...request.tokenQueryParameters,
                telemetry: NativeConstants.MATS_TELEMETRY
            },
            extendedExpiryToken: false // Make this configurable?
        };

        if (request.authenticationScheme === AuthenticationScheme.POP) {

            // add POP request type
            const shrParameters: SignedHttpRequestParameters = {
                resourceRequestUri: request.resourceRequestUri,
                resourceRequestMethod: request.resourceRequestMethod,
                shrClaims: request.shrClaims,
                shrNonce: request.shrNonce
            };

            const popTokenGenerator = new PopTokenGenerator(this.browserCrypto);
            const reqCnfData = await popTokenGenerator.generateCnf(shrParameters);

            // to reduce the URL length, it is recommended to send the hash of the req_cnf instead of the whole string
            validatedRequest.reqCnf = reqCnfData.reqCnfHash;
            validatedRequest.keyId = reqCnfData.kid;
        }

        return validatedRequest;
    }
}
