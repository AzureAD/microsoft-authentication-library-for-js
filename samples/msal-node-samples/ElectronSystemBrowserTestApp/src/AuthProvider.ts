import { shell } from "electron";
import {
    PublicClientApplication,
    LogLevel,
    AccountInfo,
    AuthenticationResult,
    InteractiveRequest,
    SilentFlowRequest,
} from "@azure/msal-node";
import { CustomLoopbackClient } from "./CustomLoopbackClient";
import { cachePlugin } from "./CachePlugin";
import * as fs from "fs";

import { IpcMessages } from "./Constants";

export default class AuthProvider {
    private clientApplication: PublicClientApplication;
    private account: AccountInfo;
    private authConfig: any;

    // publishForTest is used only in the testing environment
    public publishForTest: any;

    constructor(authConfig: any) {
        this.authConfig = authConfig;

        this.clientApplication = new PublicClientApplication({
            auth: this.authConfig.authOptions,
            cache: {
                cachePlugin: cachePlugin(this.authConfig.cache.cacheLocation),
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
    }

    async login(): Promise<AccountInfo> {
        const tokenRequest: SilentFlowRequest = {
            scopes: this.authConfig.resourceApi.scopes,
            account: null,
        };
        const authResult = await this.getToken(tokenRequest);
        return this.handleResponse(authResult);
    }

    async logout(): Promise<void> {
        try {
            if (!this.account) {
                return;
            }
            await this.clientApplication
                .getTokenCache()
                .removeAccount(this.account);
            this.account = null;
        } catch (error) {
            console.error(error);
        }
    }

    async loginSilent(tokenRequest: SilentFlowRequest): Promise<AccountInfo> {
        let response;
        if (!this.account) {
            const account = await this.getAccount();
            if (account) {
                tokenRequest.account = account;
                response = await this.getTokenSilent(tokenRequest);
                this.account = response.account;
            }
        }

        return this.account;
    }

    async getToken(
        tokenRequest: SilentFlowRequest
    ): Promise<AuthenticationResult> {
        try {
            let authResponse: AuthenticationResult;
            const account = this.account || (await this.getAccount());
            if (account) {
                tokenRequest.account = account;
                authResponse = await this.getTokenSilent(tokenRequest);
            } else {
                authResponse = await this.getTokenInteractive(tokenRequest);
            }
            this.account = authResponse.account;
            return authResponse;
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
            /**
             * A loopback server of your own implementation, which can have custom logic
             * such as attempting to listen on a given port if it is available.
             */
            const customLoopbackClient = await CustomLoopbackClient.initialize(
                3874
            );

            // opens a browser instance via Electron shell API
            const openBrowser = async (url: any) => {
                if (process.env.automation >= "1") {
                    // publishForTest is used only in the testing environment to listen to the AuthCodeURL
                    this.publishForTest(IpcMessages.GET_AUTH_CODE_URL, url);
                } else {
                    await shell.openExternal(url);
                }
            };
            const interactiveRequest: InteractiveRequest = {
                ...tokenRequest,
                openBrowser,
                successTemplate: fs
                    .readFileSync("./public/successTemplate.html", "utf8")
                    .toString(),
                errorTemplate: fs
                    .readFileSync("./public/errorTemplate.html", "utf8")
                    .toString(),
                loopbackClient: customLoopbackClient, // overrides default loopback client
            };

            const authResponse =
                await this.clientApplication.acquireTokenInteractive(
                    interactiveRequest
                );
            return authResponse;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
     * @param response
     */
    private async handleResponse(response: AuthenticationResult) {
        this.account = response?.account || (await this.getAccount());
        return this.account;
    }

    public currentAccount(): AccountInfo {
        return this.account;
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
}
