/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { 
    Configuration,
    ICachePlugin,
    LogLevel,
} from '@azure/msal-node';

import { 
    AppSettings 
} from './Types';

import { AuthorityStrings } from './Constants';

export class ConfigurationUtils {

    /**
     * Validates the fields in the custom JSON configuration file
     * @param {JSON} config: configuration file
     */
    static validateAppSettings = (config: AppSettings) => {

        if (!config.credentials.clientId) {
            throw new Error("error: no clientId provided");
        }

        if (!config.credentials.tenantId) {
            throw new Error("error: no tenantId provided"); 
        }

        if (!config.credentials.clientSecret) {
            throw new Error("error: no clientSecret provided"); 
        }

        if (!config.settings.homePageRoute) {
            throw new Error("error: no homePageRoute provided"); 
        }

        if (!config.settings.postLogoutRedirectUri) {
            throw new Error("error: no postLogoutRedirectUri provided"); 
        }
    };

    /**
     * Maps the custom JSON configuration file to configuration
     * object expected by MSAL Node ConfidentialClientApplication
     * @param {JSON} config: configuration file
     * @param {Object} cachePlugin: passed at initialization
     */
    static getMsalConfiguration = (config: AppSettings, cachePlugin: ICachePlugin = null) => {
        return {
            auth: {
                clientId: config.credentials.clientId,
                authority: config.policies ? config.policies.signUpSignIn.authority : AuthorityStrings.AAD + config.credentials.tenantId, // single tenant
                clientSecret: config.credentials.clientSecret,
                redirectUri: config.settings ? config.settings.redirectUri : "", // defaults to calling page
                knownAuthorities: config.policies ? [config.policies.authorityDomain] : [], // in B2C scenarios
            },
            cache: {
                cachePlugin,
            },
            system: {
                loggerOptions: {
                    loggerCallback(loglevel, message, containsPii) {
                        console.log(message);
                    },
                    piiLoggingEnabled: false, 
                    logLevel: LogLevel.Verbose,
                }
            }
        } as Configuration
    };
}