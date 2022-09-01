/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult, Constants, RequestThumbprint, AuthError, PerformanceEvents , ClientAuthError , ServerError , CommonSilentFlowRequest } from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { BrowserConstants, DEFAULT_REQUEST, InteractionType, ApiId, SilentTokenRetrievalStrategy } from "../utils/BrowserConstants";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { ClientApplication } from "./ClientApplication";
import { SilentRequest } from "../request/SilentRequest";
import { EventType } from "../event/EventType";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { NativeAuthError } from "../error/NativeAuthError";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";

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
        const correlationId: string = this.getRequestCorrelationId(request);
        this.logger.verbose("loginRedirect called", correlationId);
        return this.acquireTokenRedirect({
            correlationId,
            ...(request || DEFAULT_REQUEST)
        });
    }

    /**
     * Use when initiating the login process via opening a popup window in the user's browser
     *
     * @param request
     *
     * @returns A promise that is fulfilled when this function has completed, or rejected if an error was raised.
     */
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
        const correlationId: string = this.getRequestCorrelationId(request);
        this.logger.verbose("loginPopup called", correlationId);
        return this.acquireTokenPopup({
            correlationId,
            ...(request || DEFAULT_REQUEST)
        });
    }

    /**
     * Silently acquire an access token for a given set of scopes. Returns currently processing promise if parallel requests are made.
     *
     * @param {@link (SilentRequest:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} object
     */
    async acquireTokenSilent(request: SilentRequest): Promise<AuthenticationResult> {
        const correlationId = this.getRequestCorrelationId(request);
        const atsMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenSilent, correlationId);
        
        this.preflightBrowserEnvironmentCheck(InteractionType.Silent);
        this.logger.verbose("acquireTokenSilent called", correlationId);

        const account = request.account || this.getActiveAccount();
        if (!account) {
            throw BrowserAuthError.createNoAccountError();
        }

        const thumbprint: RequestThumbprint = {
            clientId: this.config.auth.clientId,
            authority: request.authority || Constants.EMPTY_STRING,
            scopes: request.scopes,
            homeAccountIdentifier: account.homeAccountId,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid
        };
        const silentRequestKey = JSON.stringify(thumbprint);

        const cachedResponse = this.activeSilentTokenRequests.get(silentRequestKey);
        if (typeof cachedResponse === "undefined") {
            this.logger.verbose("acquireTokenSilent called for the first time, storing active request", correlationId);

            const response = this.acquireTokenSilentAsync({
                ...request,
                correlationId
            }, account)
                .then((result) => {
                    this.activeSilentTokenRequests.delete(silentRequestKey);
                    atsMeasurement.endMeasurement({
                        success: true,
                        fromCache: result.fromCache,
                        accessTokenSize: result.accessToken.length,
                        idTokenSize: result.idToken.length,
                        isNativeBroker: result.fromNativeBroker,
                        silentTokenRetrievalStrategy: request.silentTokenRetrievalStrategy,
                    });
                    atsMeasurement.flushMeasurement();
                    return result;
                })
                .catch((error: AuthError) => {
                    this.activeSilentTokenRequests.delete(silentRequestKey);
                    atsMeasurement.endMeasurement({
                        success: false
                    });
                    atsMeasurement.flushMeasurement();
                    throw error;
                });
            this.activeSilentTokenRequests.set(silentRequestKey, response);
            return response;
        } else {
            this.logger.verbose("acquireTokenSilent has been called previously, returning the result from the first call", correlationId);
            atsMeasurement.endMeasurement({
                success: true
            });
            // Discard measurements for memoized calls, as they are usually only a couple of ms and will artificially deflate metrics
            atsMeasurement.discardMeasurement();
            return cachedResponse;
        }
    }

    /**
     * Silently acquire an access token for a given set of scopes. Will use cached token if available, otherwise will attempt to acquire a new token from the network via refresh token.
     * @param {@link (SilentRequest:type)}
     * @param {@link (AccountInfo:type)}
     * @returns {Promise.<AuthenticationResult>} - a promise that is fulfilled when this function has completed, or rejected if an error was raised. Returns the {@link AuthResponse} 
     */
    protected async acquireTokenSilentAsync(request: SilentRequest, account: AccountInfo): Promise<AuthenticationResult>{
        this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, request);
        const astsAsyncMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenSilentAsync, request.correlationId);

        let result: Promise<AuthenticationResult>;
        if (NativeMessageHandler.isNativeAvailable(this.config, this.logger, this.nativeExtensionProvider, request.authenticationScheme) && account.nativeAccountId) {
            this.logger.verbose("acquireTokenSilent - attempting to acquire token from native platform");
            const silentRequest: SilentRequest = {
                ...request,
                account
            };
            result = this.acquireTokenNative(silentRequest, ApiId.acquireTokenSilent_silentFlow).catch(async (e: AuthError) => {
                // If native token acquisition fails for availability reasons fallback to web flow
                if (e instanceof NativeAuthError && e.isFatal()) {
                    this.logger.verbose("acquireTokenSilent - native platform unavailable, falling back to web flow");
                    this.nativeExtensionProvider = undefined; // Prevent future requests from continuing to attempt 

                    // Cache will not contain tokens, given that previous WAM requests succeeded. Skip cache and RT renewal and go straight to iframe renewal
                    const silentIframeClient = this.createSilentIframeClient(request.correlationId);
                    return silentIframeClient.acquireToken(request);
                }
                throw e;
            });     
        } else {
            this.logger.verbose("acquireTokenSilent - attempting to acquire token from web flow");
            const silentCacheClient = this.createSilentCacheClient(request.correlationId);
            const silentRequest = await silentCacheClient.initializeSilentRequest(request, account);

            const acquireTokenByRefreshToken = (silentRequest: CommonSilentFlowRequest, silentTokenRetrievalStrategy: SilentTokenRetrievalStrategy | undefined): Promise<AuthenticationResult> => {
                const atbrtMeasurement = this.performanceClient.startMeasurement(PerformanceEvents.AcquireTokenByRefreshToken, request.correlationId);

                /*
                 * do not attempt to get the access token via the refresh token (just go to the iframe) if the
                 * silentTokenRetrievalStrategy is set to NetworkOnly
                 */
                if (silentTokenRetrievalStrategy === SilentTokenRetrievalStrategy.NetworkOnly) {
                    const networkOnly = true;
                    return this.acquireTokenBySilentIframe(undefined, silentRequest, atbrtMeasurement, networkOnly);
                }

                // otherwise, attempt to get the access token via the refresh token before going to the iframe
                return this.acquireTokenByRefreshToken(silentRequest, atbrtMeasurement).catch(async (error) => {
                    /*
                     * only attempt to get the access token via the iframe (network) if the
                     * silentTokenRetrievalStrategy is not set to RefreshTokenOnly or CacheOrRefreshToken
                     */
                    if ((silentTokenRetrievalStrategy !== SilentTokenRetrievalStrategy.RefreshTokenOnly)
                        && (silentTokenRetrievalStrategy !== SilentTokenRetrievalStrategy.CacheOrRefreshToken)) {
                        const networkOnly = false;
                        return this.acquireTokenBySilentIframe(error, silentRequest, atbrtMeasurement, networkOnly);
                    } else {
                        this.logger.info("SilentTokenRetrievalStrategy set to not renew expired refresh token.");
                        atbrtMeasurement.endMeasurement({
                            success: false
                        });
                        throw error;
                    }
                });
            };

            /*
             * do not look in the cache (just go to the network) if the silentTokenRetrievalStrategy
             * is set to one of the network-only options
             */
            if ((request.silentTokenRetrievalStrategy === SilentTokenRetrievalStrategy.RefreshTokenOnly)
                || (request.silentTokenRetrievalStrategy === SilentTokenRetrievalStrategy.NetworkWithRefreshToken)
                || (request.silentTokenRetrievalStrategy === SilentTokenRetrievalStrategy.NetworkOnly)) {
                this.logger.info("SilentCacheClient:acquireToken - Skipping cache because SilentTokenRetrievalStrategy is set to one of the network-only options.");
                
                result = acquireTokenByRefreshToken(silentRequest, request.silentTokenRetrievalStrategy);
            // otherwise, attempt to go to the cache before going to the network
            } else {
                result = silentCacheClient.acquireToken(silentRequest).catch(async (error) => {
                    /*
                     * do not attempt to get the access token via the refresh token or the network if the
                     * silentTokenRetrievalStrategy is set to cacheOnly
                     */
                    if (request.silentTokenRetrievalStrategy === SilentTokenRetrievalStrategy.CacheOnly) {
                        this.logger.error("SilentTokenRetrievalStrategy is set to CacheOnly, not attempting to renew token silently.");
                        throw error;
                    }

                    return acquireTokenByRefreshToken(silentRequest, request.silentTokenRetrievalStrategy);
                });
            }
        }

        return result.then((response) => {
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, response);
            astsAsyncMeasurement.endMeasurement({
                success: true,
                fromCache: response.fromCache,
                accessTokenSize: response.accessToken.length,
                idTokenSize: response.idToken.length,
                isNativeBroker: response.fromNativeBroker
            });
            return response;
        }).catch((tokenRenewalError: AuthError) => {
            this.eventHandler.emitEvent(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, tokenRenewalError);
            astsAsyncMeasurement.endMeasurement({
                errorCode: tokenRenewalError.errorCode,
                subErrorCode: tokenRenewalError.subError,
                success: false
            });
            throw tokenRenewalError;
        });
    }
}
