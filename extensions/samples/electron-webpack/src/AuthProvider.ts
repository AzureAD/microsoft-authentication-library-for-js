/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { shell } from "electron";
import {
    PublicClientApplication,
    LogLevel,
    AccountInfo,
    SilentFlowRequest,
    AuthenticationResult,
    InteractiveRequest,
} from "@azure/msal-node";
import {
    DataProtectionScope,
    Environment,
    PersistenceCreator,
    PersistenceCachePlugin,
} from "@azure/msal-node-extensions";
import path from "path";

export default class AuthProvider {
    private clientApplication: PublicClientApplication;
    private account: AccountInfo;

    constructor() {}

    static async build(authConfig: any): Promise<any> {
        try {
            const authProvider = new AuthProvider();
            authProvider.account = null;
            const cachePath = path.join(
                Environment.getUserRootDirectory(),
                "./cache.json"
            );

            const persistenceConfiguration = {
                cachePath,
                dataProtectionScope: DataProtectionScope.CurrentUser,
                serviceName: "test-msal-electron-service",
                accountName: "test-msal-electron-account",
                usePlaintextFileOnLinux: false,
            };

            const persistence = await PersistenceCreator.createPersistence(
                persistenceConfiguration
            );
            authProvider.clientApplication = new PublicClientApplication({
                auth: authConfig.auth,
                // This hooks up the cross-platform cache into MSAL
                cache: {
                    cachePlugin: new PersistenceCachePlugin(persistence),
                },
                system: {
                    loggerOptions: {
                        loggerCallback(loglevel, message, containsPii) {
                            console.log(message);
                        },
                        piiLoggingEnabled: false,
                        logLevel: LogLevel.Info,
                    },
                },
            });
            return authProvider;
        } catch (error) {
            throw error;
        }
    }

    async login(): Promise<AccountInfo> {
        const tokenRequest: SilentFlowRequest = {
            scopes: [],
            account: null,
        };
        const authResponse = await this.getToken(tokenRequest);
        return this.handleResponse(authResponse);
    }

    async getToken(
        tokenRequest: SilentFlowRequest
    ): Promise<AuthenticationResult> {
        try {
            let authResponse: AuthenticationResult;
            const account = this.account || (await this.getAccount());
            if (account) {
                tokenRequest.account = account;
                return (authResponse = await this.getTokenSilent(tokenRequest));
            } else {
                return (authResponse = await this.getTokenInteractive(
                    tokenRequest
                ));
            }
        } catch (error) {
            throw error;
        }
    }

    async getTokenSilent(
        tokenRequest: SilentFlowRequest
    ): Promise<AuthenticationResult> {
        try {
            return await this.clientApplication.acquireTokenSilent(
                tokenRequest
            );
        } catch (error) {
            console.log(
                "Silent token acquisition failed, acquiring token using pop up"
            );
            return await this.getTokenInteractive(tokenRequest);
        }
    }

    async getTokenInteractive(
        tokenRequest: SilentFlowRequest
    ): Promise<AuthenticationResult> {
        try {
            const openBrowser = async (url: any) => {
                await shell.openExternal(url);
            };

            const interactiveRequest: InteractiveRequest = {
                ...tokenRequest,
                openBrowser,
                successTemplate:
                    "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
                errorTemplate:
                    "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
            };
            return this.clientApplication.acquireTokenInteractive(
                interactiveRequest
            );
        } catch (error) {
            throw error;
        }
    }

    private async getAccount(): Promise<AccountInfo> {
        const cache = this.clientApplication.getTokenCache();
        const currentAccounts = await cache.getAllAccounts();

        if (currentAccounts === null) {
            console.log("No accounts detected");
            return null;
        }

        if (currentAccounts.length > 1) {
            console.log(
                "Multiple accounts detected, need to add choose account code."
            );
            return currentAccounts[0];
        } else if (currentAccounts.length === 1) {
            return currentAccounts[0];
        } else {
            return null;
        }
    }

    private async handleResponse(response: AuthenticationResult) {
        this.account = response?.account || (await this.getAccount());
        return this.account;
    }
}
