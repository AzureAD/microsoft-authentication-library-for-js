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

        let deviceCodeClient: DeviceCodeClient = new DeviceCodeClient(deviceCodeClientConfiguration);
        return deviceCodeClient.acquireToken(requestParameters);
    }
}
