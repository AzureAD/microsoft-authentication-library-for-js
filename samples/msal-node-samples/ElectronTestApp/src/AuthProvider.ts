/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    PublicClientApplication,
    LogLevel,
    AccountInfo,
    AuthorizationCodeRequest,
    AuthorizationUrlRequest,
    AuthenticationResult,
    SilentFlowRequest,
    CryptoProvider,
} from "@azure/msal-node";
import { cachePlugin } from "./CachePlugin";
import { BrowserWindow } from "electron";
import { CustomProtocolListener } from "./CustomProtocolListener";

export default class AuthProvider {
    private clientApplication: PublicClientApplication;
    private account: AccountInfo;
    private authCodeUrlParams: AuthorizationUrlRequest;
    private authCodeRequest: AuthorizationCodeRequest;
    private silentProfileRequest: SilentFlowRequest;
    private silentMailRequest: SilentFlowRequest;
    private authConfig: any;

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

        this.account = null;
        this.setRequestObjects();
    }

    public get currentAccount(): AccountInfo {
        return this.account;
    }

    // Creates a "popup" window for interactive authentication
    private static async createAuthWindow(): Promise<BrowserWindow> {
        const popupWindow = new BrowserWindow({
            width: 400,
            height: 600,
        });

        // if the app is run by test automation, clear the cache
        if (process.env.automation === "1") {
            await popupWindow.webContents.session.clearStorageData();
        }

        return popupWindow;
    }

    /**
     * Initialize request objects used by this AuthModule.
     */
    private setRequestObjects(): void {
        const baseSilentRequest = {
            account: null,
            forceRefresh: false,
        };

        this.authCodeUrlParams = this.authConfig.request.authCodeUrlParameters;

        this.authCodeRequest = {
            ...this.authConfig.request.authCodeRequest,
            code: null,
        };

        this.silentProfileRequest = {
            ...baseSilentRequest,
            scopes: ["User.Read"],
        };

        this.silentMailRequest = {
            ...baseSilentRequest,
            scopes: ["Mail.Read"],
        };
    }

    async getProfileToken(): Promise<string> {
        return await this.getToken(this.silentProfileRequest);
    }

    async getMailToken(): Promise<string> {
        return await this.getToken(this.silentMailRequest);
    }

    async getToken(request: SilentFlowRequest): Promise<string> {
        let authResponse: AuthenticationResult;
        const account = this.account || (await this.getAccount());
        if (account) {
            request.account = account;
            authResponse = await this.getTokenSilent(request);
        } else {
            const authCodeRequest = { ...this.authCodeUrlParams, ...request };
            authResponse = await this.getTokenInteractive(authCodeRequest);
        }

        return authResponse.accessToken || null;
    }

    async getTokenSilent(
        tokenRequest: SilentFlowRequest
    ): Promise<AuthenticationResult> {
        try {
            return await this.clientApplication.acquireTokenSilent(
                tokenRequest
            );
        } catch (error) {
            console.error(
                "Silent token acquisition failed, acquiring token interactively"
            );
            const authCodeRequest = {
                ...this.authCodeUrlParams,
                ...tokenRequest,
            };
            return await this.getTokenInteractive(authCodeRequest);
        }
    }

    async getTokenInteractive(
        tokenRequest: AuthorizationUrlRequest
    ): Promise<AuthenticationResult> {
        // Generate PKCE Challenge and Verifier before request
        const cryptoProvider = new CryptoProvider();
        const { challenge, verifier } =
            await cryptoProvider.generatePkceCodes();
        const authWindow = await AuthProvider.createAuthWindow();

        // Add PKCE params to Auth Code URL request
        const authCodeUrlParams = {
            ...this.authCodeUrlParams,
            scopes: tokenRequest.scopes,
            codeChallenge: challenge,
            codeChallengeMethod: "S256",
        };

        try {
            // Get Auth Code URL
            const authCodeUrl = await this.clientApplication.getAuthCodeUrl(
                authCodeUrlParams
            );

            const authCode = await this.listenForAuthCode(
                authCodeUrl,
                authWindow
            );

            // Use Authorization Code and PKCE Code verifier to make token request
            const authResult: AuthenticationResult =
                await this.clientApplication.acquireTokenByCode({
                    ...this.authCodeRequest,
                    code: authCode,
                    codeVerifier: verifier,
                });

            authWindow.close();
            return authResult;
        } catch (error) {
            authWindow.close();
            throw error;
        }
    }

    async login(): Promise<AccountInfo> {
        const authResult = await this.getTokenInteractive(
            this.authCodeUrlParams
        );
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
            await this.clientApplication
                .getTokenCache()
                .removeAccount(this.account);
            this.account = null;
        }
    }

    private async listenForAuthCode(
        navigateUrl: string,
        authWindow: BrowserWindow
    ): Promise<string> {
        // Set up custom file protocol to listen for redirect response
        const authCodeListener = new CustomProtocolListener(
            this.authConfig.customProtocol.name
        );
        const codePromise = authCodeListener.start();
        authWindow.loadURL(navigateUrl);
        const code = await codePromise;
        authCodeListener.close();
        return code;
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
