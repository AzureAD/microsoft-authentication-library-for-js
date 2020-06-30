/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    AuthorizationUrlRequest,
    AuthorizationCodeRequest,
    ClientConfiguration,
    RefreshTokenClient,
    RefreshTokenRequest,
    AuthenticationResult,
    Authority,
    AuthorityFactory,
    ClientAuthError,
    Constants,
    TrustedAuthority,
    BaseAuthRequest,
    SilentFlowRequest,
    SilentFlowClient,
} from '@azure/msal-common';
import { Configuration, buildAppConfiguration } from '../config/Configuration';
import { CryptoProvider } from '../crypto/CryptoProvider';
import { Storage } from '../cache/Storage';
import { version } from '../../package.json';
import { Constants as NodeConstants } from './../utils/Constants';
import { TokenCache } from '../cache/TokenCache';

export abstract class ClientApplication {
    private config: Configuration;
    private _authority: Authority;
    private readonly cryptoProvider: CryptoProvider;
    private storage: Storage;
    private tokenCache: TokenCache;

    /**
     * @constructor
     * Constructor for the ClientApplication
     */
    protected constructor(configuration: Configuration) {
        this.config = buildAppConfiguration(configuration);
        this.storage = new Storage();
        this.tokenCache = new TokenCache(
            this.storage,
            this.config.cache?.cachePlugin
        );
        this.cryptoProvider = new CryptoProvider();
        TrustedAuthority.setTrustedAuthoritiesFromConfig(this.config.auth.knownAuthorities!, this.config.auth.cloudDiscoveryMetadata!);
    }

    /**
     * Creates the URL of the authorization request letting the user input credentials and consent to the
     * application. The URL target the /authorize endpoint of the authority configured in the
     * application object.
     *
     * Once the user inputs their credentials and consents, the authority will send a response to the redirect URI
     * sent in the request and should contain an authorization code, which can then be used to acquire tokens via
     * acquireToken(AuthorizationCodeRequest)
     * @param request
     */
    async getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string> {
        const authClientConfig = await this.buildOauthClientConfiguration(
            request.authority
        );
        const authorizationCodeClient = new AuthorizationCodeClient(
            authClientConfig
        );
        return authorizationCodeClient.getAuthCodeUrl(this.initializeRequestScopes(request) as AuthorizationUrlRequest);
    }

    /**
     * Acquires a token by exchanging the Authorization Code received from the first step of OAuth2.0
     * Authorization Code flow.
     *
     * getAuthCodeUrl(AuthorizationCodeUrlRequest) can be used to create the URL for the first step of OAuth2.0
     * Authorization Code flow. Ensure that values for redirectUri and scopes in AuthorizationCodeUrlRequest and
     * AuthorizationCodeRequest are the same.
     *
     * @param request
     */
    async acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
        const authClientConfig = await this.buildOauthClientConfiguration(
            request.authority
        );
        const authorizationCodeClient = new AuthorizationCodeClient(
            authClientConfig
        );
        return authorizationCodeClient.acquireToken(this.initializeRequestScopes(request) as AuthorizationCodeRequest);
    }

    /**
     * Acquires a token by exchanging the refresh token provided for a new set of tokens.
     *
     * This API is provided only for scenarios where you would like to migrate from ADAL to MSAL. Instead, it is
     * recommended that you use acquireTokenSilent() for silent scenarios. When using acquireTokenSilent, MSAL will
     * handle the caching and refreshing of tokens automatically.
     * @param request
     */
    async acquireTokenByRefreshToken(request: RefreshTokenRequest): Promise<AuthenticationResult> {
        const refreshTokenClientConfig = await this.buildOauthClientConfiguration(
            request.authority
        );
        const refreshTokenClient = new RefreshTokenClient(
            refreshTokenClientConfig
        );
        return refreshTokenClient.acquireToken(this.initializeRequestScopes(request) as RefreshTokenRequest);
    }

    /**
     * Acquires a token silently when a user specifies the account the token is requested for.
     *
     * This API expects the user to provide an account object and looks into the cache to retrieve the token if present.
     * There is also an optional "forceRefresh" boolean the user can send, to bypass the cache for access_token and id_token
     * In case of an expired/unfound "refresh_token", an error is thrown
     * and the guidance is for the user to call any interactive token acquisition API (eg: acquireTokenByCode()
     * @param request
     */
    async acquireTokenSilent(request: SilentFlowRequest): Promise<AuthenticationResult> {
        const silentFlowClientConfig = await this.buildOauthClientConfiguration(
            request.authority
        );
        const silentFlowClient = new SilentFlowClient(
            silentFlowClientConfig
        );
        return silentFlowClient.acquireToken(this.initializeRequestScopes(request) as SilentFlowRequest);
    }

    getCacheManager(): TokenCache {
        return this.tokenCache;;
    }

    protected async buildOauthClientConfiguration(authority?: string): Promise<ClientConfiguration> {
        // using null assertion operator as we ensure that all config values have default values in buildConfiguration()
        return {
            authOptions: {
                clientId: this.config.auth.clientId,
                authority: await this.createAuthority(authority),
                knownAuthorities: this.config.auth.knownAuthorities,
                cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata
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
            libraryInfo: {
                sku: NodeConstants.MSAL_SKU,
                version: version,
                cpu: process.arch || '',
                os: process.platform || '',
            },
        };
    }

    /**
     * Generates a request with the default scopes.
     * @param authRequest
     */
    protected initializeRequestScopes(authRequest: BaseAuthRequest): BaseAuthRequest {
        return {
            ...authRequest,
            scopes: [...((authRequest && authRequest.scopes) || []), Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE]
        };
    }

    /**
     * Create authority instance. If authority not passed in request, default to authority set on the application
     * object. If no authority set in application object, then default to common authority.
     * @param authorityString
     */
    private async createAuthority(authorityString?: string): Promise<Authority> {
        const authority: Authority = authorityString ? AuthorityFactory.createInstance(authorityString, this.config.system!.networkClient!) : this.authority;

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
            this.config.auth.authority || Constants.DEFAULT_AUTHORITY,
            this.config.system!.networkClient!
        );

        return this._authority;
    }
}
