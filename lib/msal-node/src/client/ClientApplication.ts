/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    ClientConfiguration,
    RefreshTokenClient,
    AuthenticationResult,
    Authority,
    AuthorityFactory,
    ClientAuthError,
    Constants,
    TrustedAuthority,
    BaseAuthRequest,
    SilentFlowClient,
    Logger,
    ServerTelemetryManager,
    ServerTelemetryRequest, CommonSilentFlowRequest, CommonRefreshTokenRequest, CommonAuthorizationCodeRequest, CommonAuthorizationUrlRequest, AuthenticationScheme, ResponseMode
} from "@azure/msal-common";
import { Configuration, buildAppConfiguration } from "../config/Configuration";
import { CryptoProvider } from "../crypto/CryptoProvider";
import { Storage } from "../cache/Storage";
import { Constants as NodeConstants, ApiId } from "../utils/Constants";
import { TokenCache } from "../cache/TokenCache";
import { ClientAssertion } from "./ClientAssertion";
import { version } from "../../package.json";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { ClientCredentialRequest } from "../request/ClientCredentialRequest";

export abstract class ClientApplication {
    private _authority: Authority;
    private readonly cryptoProvider: CryptoProvider;
    protected storage: Storage;
    private tokenCache: TokenCache;
    protected logger: Logger;
    protected config: Configuration;

    protected clientAssertion: ClientAssertion;
    protected clientSecret: string;

    /**
     * Constructor for the ClientApplication
     */
    protected constructor(configuration: Configuration) {
        this.config = buildAppConfiguration(configuration);
        this.logger = new Logger(this.config.system!.loggerOptions!);
        this.storage = new Storage(this.logger);
        this.tokenCache = new TokenCache(
            this.storage,
            this.logger,
            this.config.cache!.cachePlugin
        );
        this.cryptoProvider = new CryptoProvider();
        TrustedAuthority.setTrustedAuthoritiesFromConfig(this.config.auth.knownAuthorities!, this.config.auth.cloudDiscoveryMetadata!);
    }

    /**
     * Creates the URL of the authorization request, letting the user input credentials and consent to the
     * application. The URL targets the /authorize endpoint of the authority configured in the
     * application object.
     *
     * Once the user inputs their credentials and consents, the authority will send a response to the redirect URI
     * sent in the request and should contain an authorization code, which can then be used to acquire tokens via
     * `acquireTokenByCode(AuthorizationCodeRequest)`.
     */
    async getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string> {
        this.logger.info("getAuthCodeUrl called");
        const validRequest: CommonAuthorizationUrlRequest = {
            ...request,
            ...this.initializeBaseRequest(request),
            responseMode: request.responseMode || ResponseMode.FRAGMENT,
            authenticationScheme: AuthenticationScheme.BEARER 
        };
        const authClientConfig = await this.buildOauthClientConfiguration(
            validRequest.authority
        );
        this.logger.verbose("Auth client config generated");
        const authorizationCodeClient = new AuthorizationCodeClient(
            authClientConfig
        );
        return authorizationCodeClient.getAuthCodeUrl(validRequest);
    }

    /**
     * Acquires a token by exchanging the Authorization Code received from the first step of OAuth2.0
     * Authorization Code flow.
     *
     * `getAuthCodeUrl(AuthorizationCodeUrlRequest)` can be used to create the URL for the first step of OAuth2.0
     * Authorization Code flow. Ensure that values for redirectUri and scopes in AuthorizationCodeUrlRequest and
     * AuthorizationCodeRequest are the same.
     */
    async acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
        this.logger.info("acquireTokenByCode called");
        const validRequest: CommonAuthorizationCodeRequest = {
            ...request,
            ...this.initializeBaseRequest(request),
            authenticationScheme: AuthenticationScheme.BEARER
        };
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByCode, validRequest.correlationId!);
        try {
            const authClientConfig = await this.buildOauthClientConfiguration(
                validRequest.authority,
                serverTelemetryManager
            );
            this.logger.verbose("Auth client config generated");
            const authorizationCodeClient = new AuthorizationCodeClient(
                authClientConfig
            );
            return authorizationCodeClient.acquireToken(validRequest);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }
    }

    /**
     * Acquires a token by exchanging the refresh token provided for a new set of tokens.
     *
     * This API is provided only for scenarios where you would like to migrate from ADAL to MSAL. Otherwise, it is
     * recommended that you use `acquireTokenSilent()` for silent scenarios. When using `acquireTokenSilent()`, MSAL will
     * handle the caching and refreshing of tokens automatically.
     */
    async acquireTokenByRefreshToken(request: RefreshTokenRequest): Promise<AuthenticationResult> {
        this.logger.info("acquireTokenByRefreshToken called");
        const validRequest: CommonRefreshTokenRequest = {
            ...request,
            ...this.initializeBaseRequest(request),
            authenticationScheme: AuthenticationScheme.BEARER
        };

        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByRefreshToken, validRequest.correlationId);
        try {
            const refreshTokenClientConfig = await this.buildOauthClientConfiguration(
                validRequest.authority,
                serverTelemetryManager
            );
            this.logger.verbose("Auth client config generated");
            const refreshTokenClient = new RefreshTokenClient(
                refreshTokenClientConfig
            );
            return refreshTokenClient.acquireToken(validRequest);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }
    }

    /**
     * Acquires a token silently when a user specifies the account the token is requested for.
     *
     * This API expects the user to provide an account object and looks into the cache to retrieve the token if present.
     * There is also an optional "forceRefresh" boolean the user can send to bypass the cache for access_token and id_token.
     * In case the refresh_token is expired or not found, an error is thrown
     * and the guidance is for the user to call any interactive token acquisition API (eg: `acquireTokenByCode()`).
     */
    async acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult> {
        const validRequest: CommonSilentFlowRequest = {
            ...request,
            ...this.initializeBaseRequest(request),
            forceRefresh: request.forceRefresh || false
        };

        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenSilent, validRequest.correlationId, validRequest.forceRefresh);
        try {
            const silentFlowClientConfig = await this.buildOauthClientConfiguration(
                validRequest.authority,
                serverTelemetryManager
            );
            const silentFlowClient = new SilentFlowClient(
                silentFlowClientConfig
            );
            return silentFlowClient.acquireToken(validRequest);
        } catch (e) {
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }
    }

    /**
     * Gets the token cache for the application.
     */
    getTokenCache(): TokenCache {
        this.logger.info("getTokenCache called");
        return this.tokenCache;
    }

    protected async buildOauthClientConfiguration(authority: string, serverTelemetryManager?: ServerTelemetryManager): Promise<ClientConfiguration> {
        this.logger.verbose("buildOauthClientConfiguration called");
        // using null assertion operator as we ensure that all config values have default values in buildConfiguration()

        return {
            authOptions: {
                clientId: this.config.auth.clientId,
                authority: await this.createAuthority(authority),
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
                clientCapabilities: this.config.auth.clientCapabilities,
                protocolMode: this.config.auth.protocolMode
            },
            loggerOptions: {
                loggerCallback: this.config.system!.loggerOptions!
                    .loggerCallback,
                piiLoggingEnabled: this.config.system!.loggerOptions!
                    .piiLoggingEnabled,
            },
            cryptoInterface: this.cryptoProvider,
            networkInterface: this.config.system!.networkClient,
            storageInterface: this.storage,
            serverTelemetryManager: serverTelemetryManager,
            clientCredentials: {
                clientSecret: this.clientSecret,
                clientAssertion: this.clientAssertion ? this.getClientAssertion() : undefined,
            },
            libraryInfo: {
                sku: NodeConstants.MSAL_SKU,
                version: version,
                cpu: process.arch || "",
                os: process.platform || "",
            },
            persistencePlugin: this.config.cache!.cachePlugin,
            serializableCache: this.tokenCache,
        };
    }

    private getClientAssertion(): { assertion: string, assertionType: string } {
        return {
            assertion: this.clientAssertion.getJwt(this.cryptoProvider, this.config.auth.clientId, this._authority.tokenEndpoint),
            assertionType: NodeConstants.JWT_BEARER_ASSERTION_TYPE
        };
    }

    /**
     * Generates a request with the default scopes & generates a correlationId.
     * @param authRequest
     */
    protected initializeBaseRequest(authRequest: AuthorizationCodeRequest|AuthorizationUrlRequest|RefreshTokenRequest|SilentFlowRequest|ClientCredentialRequest): BaseAuthRequest {
        this.logger.verbose("initializeRequestScopes called");

        return {
            ...authRequest,
            scopes: [...((authRequest && authRequest.scopes) || []), Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE],
            correlationId: authRequest && authRequest.correlationId || this.cryptoProvider.createNewGuid(),
            authority: authRequest.authority || this.config.auth.authority!
        };
    }

    protected initializeServerTelemetryManager(apiId: number, correlationId: string, forceRefresh?: boolean): ServerTelemetryManager {
        const telemetryPayload: ServerTelemetryRequest = {
            clientId: this.config.auth.clientId,
            correlationId: correlationId,
            apiId: apiId,
            forceRefresh: forceRefresh || false
        };

        return new ServerTelemetryManager(telemetryPayload, this.storage);
    }

    /**
     * Create authority instance. If authority not passed in request, default to authority set on the application
     * object. If no authority set in application object, then default to common authority.
     * @param authorityString
     */
    private async createAuthority(authorityString: string): Promise<Authority> {
        this.logger.verbose("createAuthority called");

        let authority: Authority;
        if (this.authority.canonicalAuthority !== authorityString) {
            this.logger.verbose("Authority passed in, creating authority instance");
            authority = AuthorityFactory.createInstance(authorityString, this.config.system!.networkClient!, this.config.auth.protocolMode!);
        } else {
            this.logger.verbose("Authority on request is the same as on application object, defaulting to authority set on application object");
            authority = this.authority;
        }

        if (authority.discoveryComplete()) {
            return authority;
        }

        try {
            await authority.resolveEndpointsAsync();
            return authority;
        } catch (error) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(error);
        }
    }

    private get authority() {
        if (this._authority) {
            return this._authority;
        }

        this._authority = AuthorityFactory.createInstance(
            this.config.auth.authority!,
            this.config.system!.networkClient!,
            this.config.auth.protocolMode!
        );

        return this._authority;
    }
}
