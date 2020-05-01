/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    AuthorizationCodeUrlRequest,
    AuthorizationCodeRequest,
    AuthenticationResult,
    Configuration,
    RefreshTokenClient,
    RefreshTokenRequest
} from '@azure/msal-common';
import { ClientConfiguration, buildAppConfiguration } from '../config/ClientConfiguration';
import { CryptoProvider } from '../crypto/CryptoProvider';
import { Storage } from '../cache/Storage';
import { version } from '../../package.json';
import { Constants } from "./../utils/Constants";

export abstract class ClientApplication {

    protected config: ClientConfiguration;
    protected nodeStorage: Storage;
    protected nodeCacheManager: CacheManager;
    protected cachePath: string;

    /**
     * @constructor
     * Constructor for the ClientApplication to instantiate the PublicClientApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal
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
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/ls
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL PublicClientApplication instance
     */
    protected constructor(configuration: ClientConfiguration) {
        this.config = buildAppConfiguration(configuration);
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
    async getAuthCodeUrl(
        request: AuthorizationCodeUrlRequest
    ): Promise<string> {
        const authorizationCodeClient = new AuthorizationCodeClient(
            this.buildOauthClientConfiguration()
        );
        return authorizationCodeClient.getAuthCodeUrl(request);
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
    async acquireTokenByCode(
        request: AuthorizationCodeRequest
    ): Promise<AuthenticationResult> {
        const authorizationCodeClient = new AuthorizationCodeClient(
            this.buildOauthClientConfiguration()
        );
        return authorizationCodeClient.acquireToken(request);
    }

    /**
     * Acquires a token by exchanging the refresh token provided for a new set of tokens.
     *
     * This API is provided only for scenarios where you would like to migrate from ADAL to MSAL. Instead, it is
     * recommended that you use acquireTokenSilent() for silent scenarios. When using acquireTokenSilent, MSAL will
     * handle the caching and refreshing of tokens automatically.
     * @param request
     */
    async acquireTokenByRefreshToken(request: RefreshTokenRequest): Promise<string>{
        const refreshTokenClient = new RefreshTokenClient(this.buildOauthClientConfiguration());
        return refreshTokenClient.acquireToken(request);
    }

    protected buildOauthClientConfiguration(): Configuration {
        // using null assertion operator as we ensure that all config values have default values in buildConfiguration()
        return {
            authOptions: this.config.auth,
            loggerOptions: {
                loggerCallback: this.config.system!.loggerOptions!
                    .loggerCallback,
                piiLoggingEnabled: this.config.system!.loggerOptions!
                    .piiLoggingEnabled,
            },
            cryptoInterface: new CryptoProvider(),
            networkInterface: this.config.system!.networkClient,
            storageInterface: new Storage(this.config.cache!),
            libraryInfo: {
                sku: Constants.MSAL_SKU,
                version: version,
                cpu: process.arch || "",
                os: process.platform || ""
            },
        };
    }
}
