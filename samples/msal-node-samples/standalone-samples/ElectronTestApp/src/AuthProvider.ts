import { PublicClientApplication, Configuration, LogLevel, AccountInfo, AuthorizationCodeRequest, AuthorizationUrlRequest, AuthenticationResult, SilentFlowRequest, InteractionRequiredAuthError } from "@azure/msal-node";
import { AuthCodeListener } from "./AuthCodeListener";
import { cachePlugin } from "./CachePlugin";
import { BrowserWindow } from "electron";
import { CustomFileProtocolListener } from "./CustomFileProtocol";

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
    private profileRedirectRequest: RequestRedirect;
    private silentProfileRequest: SilentFlowRequest;
    private authCodeListener: AuthCodeListener;

    constructor() {
        this.clientApplication = new PublicClientApplication(MSAL_CONFIG);
        this.account = null;
        this.setRequestObjects();
    }

    /**
     * Initialize request objects used by this AuthModule.
     */
    private setRequestObjects(): void {
        const requestScopes =  ['openid', 'profile', 'User.Read'];
        const redirectUri = "msal://redirect";

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
            scopes: ["openid", "profile", "User.Read"],
            account: null,
            forceRefresh: false
        };
    }

    // async getToken(authWindow: BrowserWindow): string {
    //     const account = this.account || this.getAccount();

    //     if (account) {
    //         this.silentProfileRequest.account = this.account;
    //         try {
    //             const response = this.clientApplication.acquireTokenSilent(this.silentProfileRequest);
    //             return (await response).accessToken;
    //         } catch (error) {
    //             if (error instanceof InteractionRequiredAuthError) {
    //                 console.log("Silent token acquisition failed, acquiring token using redirect");
    //                 return this.getTokenInteractive(authWindow);
    //             } else {
    //                 console.error(error);
    //             }
    //         }
    //     }
    // }

    async getTokenInteractive(authWindow: BrowserWindow): Promise<AuthenticationResult> {
        const authCodeUrl = await this.clientApplication.getAuthCodeUrl(this.authCodeUrlParams);
        this.authCodeListener = new CustomFileProtocolListener("msal");
        this.authCodeListener.start();
        const authCode = await this.listenForAuthCode(authCodeUrl, authWindow);
        const authResult = await this.clientApplication.acquireTokenByCode({ ...this.authCodeRequest, code: authCode});
        return authResult;
    }

    async login(authWindow: BrowserWindow): Promise<AccountInfo> {
        const authResult = await this.getTokenInteractive(authWindow);
        return this.handleResponse(authResult);
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