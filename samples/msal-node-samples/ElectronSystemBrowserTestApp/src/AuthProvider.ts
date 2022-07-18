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
import * as urlparse from "url-parse";

const Opener = require("opener");

export default class AuthProvider {
    private clientApplication: PublicClientApplication;
    private account: AccountInfo;
    private authCodeUrlParams: AuthorizationUrlRequest;
    private authCodeRequest: AuthorizationCodeRequest;
    private silentProfileRequest: SilentFlowRequest;
    private silentMailRequest: SilentFlowRequest;
    private authConfig: any;
    private challenge: string;
    private verifier: string;

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
            await this.login();
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
            console.log(
                "Silent token acquisition failed, acquiring token using pop up"
            );

            await this.login();
            return null;
        }
    }

    async getAuthCode(tokenRequest: AuthorizationUrlRequest): Promise<string> {
        // Generate PKCE Challenge and Verifier before request
        const cryptoProvider = new CryptoProvider();
        const { challenge, verifier } =
            await cryptoProvider.generatePkceCodes();

        this.challenge = challenge;
        this.verifier = verifier;

        // Add PKCE params to Auth Code URL request
        const authCodeUrlParams = {
            ...this.authCodeUrlParams,
            scopes: tokenRequest.scopes,
            codeChallenge: this.challenge,
            codeChallengeMethod: "S256",
        };
        try {
            const authCodeUrl = await this.clientApplication.getAuthCodeUrl(
                authCodeUrlParams
            );
            return authCodeUrl;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async login(): Promise<void> {
        const getAuthURL = await this.getAuthCode(this.authCodeUrlParams);
        Opener(getAuthURL);
    }

    async getTokenByCode(url: string): Promise<AccountInfo> {
        try {
            const parsedUtl = urlparse(url, true);
            let code = parsedUtl.query.code;
            const authResult = await this.clientApplication.acquireTokenByCode({
                ...this.authCodeRequest,
                code: code,
                codeVerifier: this.verifier,
            });
            return this.handleResponse(authResult);
        } catch (error) {
            throw error;
        }
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

    /**
     * Handles the response from a popup or redirect. If response is null, will check if we have any accounts and attempt to sign in.
     * @param response
     */
    private async handleResponse(response: AuthenticationResult) {
        this.account = response?.account || (await this.getAccount());

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
