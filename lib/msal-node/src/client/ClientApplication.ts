/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthorizationCodeClient,
    AuthorizationCodeParameters,
    AuthorizationCodeUrlParameters,
    Configuration,
    INetworkModule,
} from '@azure/msal-common';
import { ClientConfiguration, buildConfiguration } from '../config/ClientConfiguration';
import { CryptoOps } from '../crypto/CryptoOps';
import { Storage } from '../cache/Storage';
import { NetworkUtils } from './../utils/NetworkUtils';

export abstract class ClientApplication {

    // Input configuration by developer/user
    protected config: ClientConfiguration;

    // Crypto interface implementation
    protected crypto: CryptoOps;

    // Storage interface implementation
    protected storage: Storage;

    // Network interface implementation
    protected networkClient: INetworkModule;

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
     * @param {@link (Configuration:type)} configuration object for the MSAL PublicClientApplication instance
     */
    constructor(configuration: ClientConfiguration) {
        // Set the configuration.
        this.config = buildConfiguration(configuration);

        // Initialize the crypto class.
        this.crypto = new CryptoOps();

        // Initialize the network module class.
        this.networkClient = NetworkUtils.getNetworkClient();

        // Initialize the browser storage class.
        this.storage = new Storage(
            this.config.auth.clientId,
            this.config.cache
        );
    }

        /**
     * Creates a url for logging in a user. This will by default add scopes: openid, profile and offline_access. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request
     */
    async getAuthCodeUrl(
        request: AuthorizationCodeUrlParameters
    ): Promise<string> {
        
        // Create auth module.
        const authorizationCodeParameters: Configuration = {
            
            authOptions: this.config.auth,
            systemOptions: {
                tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
                telemetry: this.config.system.telemetry,
            },
            loggerOptions: {
                loggerCallback: this.config.system.loggerOptions.loggerCallback,
                piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
            },
            cryptoInterface: this.crypto,
            networkInterface: this.networkClient,
            storageInterface: this.storage,
        };
        
        const authorizationCodeClient = new AuthorizationCodeClient(authorizationCodeParameters);

        return authorizationCodeClient.getAuthCodeUrl(request);
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the authorization_code_grant
     * @param request
     */
    async acquireTokenByCode(
        requestParameters: AuthorizationCodeParameters
    ): Promise<string> {

        const authorizationClientConfiguration: Configuration = {
            authOptions: this.config.auth,
            systemOptions: {
                tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
                telemetry: this.config.system.telemetry,
            },
            loggerOptions: {
                loggerCallback: this.config.system.loggerOptions.loggerCallback,
                piiLoggingEnabled: this.config.system.loggerOptions.piiLoggingEnabled,
            },
            cryptoInterface: this.crypto,
            networkInterface: this.networkClient,
            storageInterface: this.storage,
        };

        const authorizationCodeClient = new AuthorizationCodeClient(authorizationClientConfiguration);
        
        return authorizationCodeClient.acquireToken(requestParameters);
    }

    protected getNodeDefaultHeaders(): Map<string, string>{
        const msalSkuHeaderKey: string = "x-client-SKU";
        const msalVersionHeaderKey: string = "x-client-VER";
        const cpuHeaderKey: string = "x-client-CPU";
        const osHeaderKey: string = "x-client-OS";
        // const correlationId: string = "client-request_id";
        // TODO will also add appName and appVersion


        return new Map<string, string>([
            [msalSkuHeaderKey, "MSAL.node"],
            [msalVersionHeaderKey, "0.1.0"],
            [cpuHeaderKey, ""],
            [osHeaderKey, process.platform]
        ]);
    }
}
