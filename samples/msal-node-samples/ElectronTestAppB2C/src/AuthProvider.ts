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
    SilentFlowRequest, 
    CryptoProvider} from "@azure/msal-node";
import { AuthCodeListener } from "./AuthCodeListener";
import { cachePlugin } from "./CachePlugin";
import { BrowserWindow } from "electron";
import { CustomFileProtocolListener } from "./CustomFileProtocol";
import { b2cPolicies } from "./Policies";

// Redirect URL registered in Azure PPE Lab App
const CUSTOM_FILE_PROTOCOL_NAME = "msale3b9ad76-9763-4827-b088-80c7a7888f79";

// Change this to load the desired MSAL Client Configuration
import * as CLIENT_CONFIG from "./config/customConfig.json";

const MSAL_CONFIG: Configuration = {
    auth: {
        clientId: "032e9c87-28a6-4c98-ac7b-e2b5edc024a5",
        authority: b2cPolicies.authorities.signUpSignIn.authority,
        knownAuthorities: [b2cPolicies.authorityDomain],  
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
            logLevel: LogLevel.Info,
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
    private editProfileRequest: AuthorizationCodeRequest;
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

        const baseSilentRequest = {
            account: null,
            forceRefresh: false
        };

        this.authCodeUrlParams = {
            scopes: ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"],
            redirectUri: "msale3b9ad76-9763-4827-b088-80c7a7888f79://auth",
        }

        this.authCodeRequest = {
            scopes: ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"],
            redirectUri: "msale3b9ad76-9763-4827-b088-80c7a7888f79://auth",
            code: null
        };

        this.silentProfileRequest = {
            ...baseSilentRequest,
            scopes: ["User.Read"],
        };

        this.silentMailRequest = {
            ...baseSilentRequest,
            scopes: ["Mail.Read"],
        };

        this.editProfileRequest
    }

    async getProfileToken(): Promise<string> {
        const profileRequest: SilentFlowRequest = {
            account: null,
            scopes: ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"]
        };
        const authResult = await this.getToken(profileRequest);
        return authResult.accessToken;
    }

    async getApiToken(): Promise<string> {
        const apiRequest: SilentFlowRequest = {
            account: null,
            authority: b2cPolicies.authorities.signUpSignIn.authority,
            scopes: ["https://fabrikamb2c.onmicrosoft.com/helloapi/demo.read"],
        }

        const authResult = await this.getToken(apiRequest);
        return authResult.accessToken;
    }

    async getMailToken(authWindow: BrowserWindow): Promise<string> {
        const authResult = await this.getToken(this.silentMailRequest);
        return authResult.accessToken;
    }

    async getToken(request: SilentFlowRequest): Promise<AuthenticationResult> {
        let authResponse: AuthenticationResult;
        const account = this.account || await this.getAccount();
        if (account) {
            request.account = account;
            authResponse = await this.getTokenSilent(request);
        } else {
            const authCodeRequest = {...this.authCodeUrlParams, ...request };
            authResponse = await this.getTokenInteractive(authCodeRequest);
        }

        return authResponse;
    }

    async getTokenSilent(tokenRequest: SilentFlowRequest): Promise<AuthenticationResult> {
        try {
            console.log(tokenRequest);
            return await this.clientApplication.acquireTokenSilent(tokenRequest);
        } catch (error) {
            console.log("Error: ", error);
            console.log("Silent token acquisition failed, acquiring token using pop up");
            const authCodeRequest = {...this.authCodeUrlParams, ...tokenRequest };
            return await this.getTokenInteractive(authCodeRequest);
        }
    }

    private createAuthWindow(): BrowserWindow {
        return new BrowserWindow({
            width: 400,
            height: 600
        });
    }

    async getTokenInteractive(tokenRequest: AuthorizationUrlRequest ): Promise<AuthenticationResult> {
        // Generate PKCE Challenge and Verifier before request
        const cryptoProvider = new CryptoProvider();
        const { challenge, verifier } = await cryptoProvider.generatePkceCodes();

        // Add PKCE params to Auth Code URL request
        const authCodeUrlParams = { 
            ...this.authCodeUrlParams,
            codeChallenge: challenge,
            codeChallengeMethod: "S256" 
        };

        // Open Auth Window
        const authWindow = this.createAuthWindow();

        // Get Auth Code URL
        const authCodeUrl = await this.clientApplication.getAuthCodeUrl(authCodeUrlParams);

        // Set up custom file protocol to listen for redirect response
        this.authCodeListener = new CustomFileProtocolListener(CUSTOM_FILE_PROTOCOL_NAME);
        this.authCodeListener.start();
        const authCode = await this.listenForAuthCode(authCodeUrl, authWindow);

        // Close auth window
        authWindow.close();

        // Use Authorization Code and PKCE Code verifier to make token request
        return await this.clientApplication.acquireTokenByCode({
            ...this.authCodeRequest,
            code: authCode,
            codeVerifier: verifier
        });
    }

    async login(): Promise<AccountInfo> {
        const loginRequest = {
            account: null,
            scopes: ["openid", "profile"]
        };
        const authResult = await this.getToken(loginRequest);
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
        console.log(navigateUrl);
        authWindow.loadURL(navigateUrl);
        return new Promise((resolve, reject) => {
            authWindow.webContents.on('will-redirect', (event, responseUrl) => {
                    const parsedUrl = new URL(responseUrl);
                    const authCode = parsedUrl.searchParams.get('code');

                    if (authCode) {
                        resolve(authCode);
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