/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { DeviceCodeClient, DeviceCodeParameters, AuthenticationResult, Configuration } from "@azure/msal-common";
import { ClientConfiguration} from '../config/ClientConfiguration';
import { ClientApplication } from './ClientApplication';

/**
 * The PublicClientApplication class is the object exposed by the library to perform authentication and authorization functions in Single Page Applications
 * to obtain JWT tokens as described in the OAuth 2.0 Authorization Code Flow with PKCE specification.
 */
export class PublicClientApplication extends ClientApplication {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    public async acquireTokenByDeviceCode(requestParameters: DeviceCodeParameters): Promise<AuthenticationResult>{

        const deviceCodeClientConfiguration: Configuration = {
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

<<<<<<< HEAD
        let deviceCodeClient: DeviceCodeClient = new DeviceCodeClient(deviceCodeClientConfiguration);
        return deviceCodeClient.acquireToken(requestParameters);
=======
        this.authModule = new AuthorizationCodeFlow(authModule);
    }

    /**
     * Creates a url for logging in a user. This will by default add scopes: openid, profile and offline_access. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request
     */
    async getAuthCodeUrl(
        request: AuthorizationCodeUrlParameters
    ): Promise<string> {
        const url = this.authModule.getAuthCodeUrl(request);
        console.log('url: ', url);
        return url;
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the authorization_code_grant
     * @param request
     */
    async acquireTokenByCode(
        request: AuthorizationCodeParameters
    ): Promise<string> {
        const tokenResponse = this.authModule.acquireTokenByCode(request);
        return tokenResponse;
>>>>>>> msal-node-generate-request
    }
}
