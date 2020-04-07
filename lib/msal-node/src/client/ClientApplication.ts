/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    AuthorizationCodeUrlRequest,
    AuthorizationCodeRequest,
    Configuration,
} from '@azure/msal-common';
import { ClientConfiguration, buildConfiguration } from '../config/ClientConfiguration';
import { CryptoProvider } from '../crypto/CryptoProvider';
import { Storage } from '../cache/Storage';

export abstract class ClientApplication {

    // Input configuration by developer/user
    protected config: ClientConfiguration;

    // Crypto interface implementation
    protected crypto: CryptoProvider;

    // Storage interface implementation
    protected storage: Storage;


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
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL PublicClientApplication instance
     */
    protected constructor(configuration: ClientConfiguration) {
        // Set the configuration.
        this.config = buildConfiguration(configuration);

        // Initialize the crypto class.
        this.crypto = new CryptoProvider();
        // Initialize the network module class.

        // Initialize the browser storage class.
        this.storage = new Storage(
            this.config.auth.clientId,
            this.config.cache
        );
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
    async getAuthCodeUrl(request: AuthorizationCodeUrlRequest): Promise<string> {

        const authorizationCodeClient = new AuthorizationCodeClient(this.buildOauthClientConfiguration());
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
    async acquireTokenByCode(request: AuthorizationCodeRequest): Promise<string> {

        const authorizationCodeClient = new AuthorizationCodeClient(this.buildOauthClientConfiguration());
        return authorizationCodeClient.acquireToken(request);
    }

    protected buildOauthClientConfiguration(): Configuration {
        return {
            authOptions: this.config.auth,
            loggerOptions: {
                loggerCallback: this.config.system.loggerOptions.loggerCallback,
                piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
            },
            cryptoInterface: this.crypto,
            networkInterface: this.config.system.networkClient,
            storageInterface: this.storage,
        };
    }
}
