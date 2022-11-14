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
    Configuration,
    InteractionRequiredAuthError,
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
    private interactiveRequest: InteractiveRequest;
    private silentFlowRequest: SilentFlowRequest;

    constructor() {
        this.account = null;
        this.setRequestObjects();
    }

    static async build(authConfig: Configuration): Promise<AuthProvider> {
        try {
            const authProvider = new AuthProvider();
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
                        loggerCallback(
                            loglevel: LogLevel,
                            message: String,
                            containsPii: Boolean
                        ) {
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

    private async setRequestObjects(): Promise<void> {
        const openBrowser = async (url: any) => {
            await shell.openExternal(url);
        };

        this.silentFlowRequest = {
            scopes: [],
            account: null,
        };

        this.interactiveRequest = {
            ...this.silentFlowRequest,
            openBrowser,
            successTemplate:
                "<h1>Successfully signed in!</h1> <p>You can close this window now.</p>",
            errorTemplate:
                "<h1>Oops! Something went wrong</h1> <p>Check the console for more information.</p>",
        };
    }

    async login(): Promise<AccountInfo> {
        const authResponse = await this.getToken(this.silentFlowRequest);
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
                    this.interactiveRequest
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
            if (error instanceof InteractionRequiredAuthError) {
                console.log(
                    "Silent token acquisition failed, acquiring token interactive"
                );

                return await this.getTokenInteractive(this.interactiveRequest);
            } else {
                throw error;
            }
        }
    }

    async getTokenInteractive(
        tokenRequest: InteractiveRequest
    ): Promise<AuthenticationResult> {
        try {
            return await this.clientApplication.acquireTokenInteractive(
                tokenRequest
            );
        } catch (error) {
            throw error;
        }
    }

    private async getAccount(): Promise<AccountInfo> {
        const cache = this.clientApplication.getTokenCache();
        const currentAccounts = await cache.getAllAccounts();

        if (!currentAccounts.length) {
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
