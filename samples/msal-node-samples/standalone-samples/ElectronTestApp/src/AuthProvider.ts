/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { 
    PublicClientApplication,
    Configuration,
    LogLevel,
    AccountInfo,
    AuthorizationCodeRequest,
    AuthorizationUrlRequest,
    AuthenticationResult,
    SilentFlowRequest } from "@azure/msal-node";
import { AuthCodeListener } from "./AuthCodeListener";
import { cachePlugin } from "./CachePlugin";
import { BrowserWindow } from "electron";
import { CustomFileProtocolListener } from "./CustomFileProtocol";

const CUSTOM_FILE_PROTOCOL_NAME = "msal";

const MSAL_CONFIG: Configuration = {
    auth: {
        clientId: "89e61572-2f96-47ba-b571-9d8c8f96b69d",
        authority: "https://login.microsoftonline.com/5d97b14d-c396-4aee-b524-c86d33e9b660",
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        }
    }
};

export default class AuthProvider {

    private clientApplication: PublicClientApplication;
    private account: AccountInfo;
    private authCodeUrlParams: AuthorizationUrlRequest;
    private authCodeRequest: AuthorizationCodeRequest;
    private silentProfileRequest: SilentFlowRequest;
    private silentMailRequest: SilentFlowRequest;
    private authCodeListener: AuthCodeListener;

    constructor() {
        this.clientApplication = new PublicClientApplication(MSAL_CONFIG);
        this.account = null;
        this.setRequestObjects();
    }

    public get currentAccount(): AccountInfo {
        return this.account;
    }

    /**
     * Initialize request objects used by this AuthModule.
     */
    private setRequestObjects(): void {
        const requestScopes =  ['openid', 'profile', 'User.Read'];
        const redirectUri = "msal://redirect";

        const baseSilentRequest = {
            account: null, 
            forceRefresh: false
        };

        this.authCodeUrlParams = {
            scopes: requestScopes,
            redirectUri: redirectUri
        };

        this.authCodeRequest = {
            scopes: requestScopes,
            redirectUri: redirectUri,
            code: null
        }

        this.silentProfileRequest = {
            ...baseSilentRequest,
            scopes: ["User.Read"],
        };

        this.silentMailRequest = {
            ...baseSilentRequest,
            scopes: ["Mail.Read"],
        };
    }

    async getProfileToken(authWindow: BrowserWindow): Promise<string> {
        return await this.getToken(authWindow, this.silentProfileRequest);
    }

    async getMailToken(authWindow: BrowserWindow): Promise<string> {
        return await this.getToken(authWindow, this.silentMailRequest);
    }

    async getToken(authWindow: BrowserWindow, request: SilentFlowRequest): Promise<string> {
        let authResponse: AuthenticationResult;
        const account = this.account || await this.getAccount();
        if (account) {
            request.account = account;
            authResponse = await this.getTokenSilent(authWindow, request);
        } else {
            authResponse = await this.getTokenInteractive(authWindow, request);
        }

        return authResponse.accessToken || null;
    }

    async getTokenSilent(authWindow: BrowserWindow, tokenRequest: SilentFlowRequest): Promise<AuthenticationResult> {
        try {
            return await this.clientApplication.acquireTokenSilent(tokenRequest);
        } catch (error) {
            console.log("Silent token acquisition failed, acquiring token using redirect");
            return await this.getTokenInteractive(authWindow, tokenRequest);
        }
    }

    async getTokenInteractive(authWindow: BrowserWindow, tokenRequest: AuthorizationUrlRequest ): Promise<AuthenticationResult> {
        const authCodeUrlParams = { ...this.authCodeUrlParams, scopes: tokenRequest.scopes };
        const authCodeUrl = await this.clientApplication.getAuthCodeUrl(authCodeUrlParams);
        this.authCodeListener = new CustomFileProtocolListener(CUSTOM_FILE_PROTOCOL_NAME);
        this.authCodeListener.start();
        const authCode = await this.listenForAuthCode(authCodeUrl, authWindow);
        const authResult = await this.clientApplication.acquireTokenByCode({ ...this.authCodeRequest, scopes: tokenRequest.scopes, code: authCode});
        return authResult;
    }

    async login(authWindow: BrowserWindow): Promise<AccountInfo> {
        const authResult = await this.getTokenInteractive(authWindow, this.authCodeUrlParams);
        return this.handleResponse(authResult);
    }

    async loginSilent(): Promise<AccountInfo> {
        if (!this.account) {
            this.account = await this.getAccount();
        }

        return this.account;
    }

    async logout(): Promise<void> {
        if (this.account) {
            await this.clientApplication.getTokenCache().removeAccount(this.account);
            this.account = null;
        }
    }

    private async listenForAuthCode(navigateUrl: string, authWindow: BrowserWindow): Promise<string> {
        authWindow.loadURL(navigateUrl);
        return new Promise((resolve, reject) => {
            authWindow.webContents.on('will-redirect', (event, responseUrl) => {
                try {
                    const parsedUrl = new URL(responseUrl);
                    const authCode = parsedUrl.searchParams.get('code');
                    resolve(authCode);
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

        /**
     * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
     * @param response 
     */
    private async handleResponse(response: AuthenticationResult) {
        if (response !== null) {
            this.account = response.account;
        } else {
            this.account = await this.getAccount();
        }

        return this.account;
    }

    /**
     * Calls getAllAccounts and determines the correct account to sign into, currently defaults to first account found in cache.
     * TODO: Add account chooser code
     * 
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    private async getAccount(): Promise<AccountInfo> {
        // need to call getAccount here?
        const cache = this.clientApplication.getTokenCache();
        const currentAccounts = await cache.getAllAccounts();

        if (currentAccounts === null) {
            console.log("No accounts detected");
            return null;
        }

        if (currentAccounts.length > 1) {
            // Add choose account code here
            console.log("Multiple accounts detected, need to add choose account code.");
            return currentAccounts[0];
        } else if (currentAccounts.length === 1) {
            return currentAccounts[0];
        } else {
            return null;
        }
    }
}