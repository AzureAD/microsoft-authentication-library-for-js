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

        if (!config.credentials.clientId || config.credentials.clientId === "Enter_the_Application_Id_Here") {
            throw new Error("No clientId provided!");
        }

        if (!config.credentials.tenantId || config.credentials.tenantId === "Enter_the_Tenant_Info_Here") {
            throw new Error("No tenantId provided!"); 
        }

        if (!config.credentials.clientSecret || config.credentials.clientSecret === "Enter_the_Client_Secret_Here") {
            throw new Error("No clientSecret provided!"); 
        }

        if (!config.settings.redirectUri || config.settings.redirectUri === "Enter_the_Redirect_Uri_Here") {
            throw new Error("No postLogoutRedirectUri provided!"); 
        }

        if (!config.settings.postLogoutRedirectUri || config.settings.postLogoutRedirectUri === "Enter_the_Post_Logout_Redirect_Uri_Here") {
            throw new Error("No postLogoutRedirectUri provided!"); 
        }

        if (!config.settings.homePageRoute) {
            throw new Error("No homePageRoute provided!"); 
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