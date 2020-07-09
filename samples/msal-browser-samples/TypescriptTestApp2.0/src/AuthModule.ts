import { PublicClientApplication, AuthorizationUrlRequest, SilentFlowRequest, AuthenticationResult, Configuration, LogLevel, AccountInfo, InteractionRequiredAuthError } from "@azure/msal-browser";
import { UIManager } from "./UIManager";

const MSAL_CONFIG: Configuration = {
    auth: {
        clientId: "2eb9245f-612b-46cc-994a-f5e35ef37da0"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {	
                    return;	
                }	
                switch (level) {	
                    case LogLevel.Error:	
                        console.error(message);	
                        return;	
                    case LogLevel.Info:	
                        console.info(message);	
                        return;	
                    case LogLevel.Verbose:	
                        console.debug(message);	
                        return;	
                    case LogLevel.Warning:	
                        console.warn(message);	
                        return;	
                }
            }
        }
    }
};

export class AuthModule {

    private myMSALObj: PublicClientApplication;
    private account: AccountInfo;
    private loginRequest: AuthorizationUrlRequest;
    private profileRequest: AuthorizationUrlRequest;
    private mailRequest: AuthorizationUrlRequest;
    private silentProfileRequest: SilentFlowRequest;
    private silentMailRequest: SilentFlowRequest;

    constructor() {
        this.myMSALObj = new PublicClientApplication(MSAL_CONFIG);
        this.account = null;
        this.setRequestObjects();
    }

    private setRequestObjects(): void {
        this.loginRequest = {
            scopes: []
        };

        this.profileRequest = {
            scopes: ["User.Read"]
        };

        // Add here scopes for access token to be used at MS Graph API endpoints.
        this.mailRequest = {
            scopes: ["Mail.Read"]
        };

        this.silentProfileRequest = {
            scopes: ["openid", "profile", "User.Read"],
            account: null,
            forceRefresh: false
        };

        this.silentMailRequest = {
            scopes: ["openid", "profile", "Mail.Read"],
            account: null,
            forceRefresh: false
        };
    }

    private getAccount(): AccountInfo {
        // need to call getAccount here?
        const currentAccounts = this.myMSALObj.getAllAccounts();
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
        }
    }

    loadPage(): void {
        this.myMSALObj.handleRedirectPromise().then((resp: AuthenticationResult) => {
            this.handleResponse(resp);
        }).catch(console.error);
    }

    handleResponse(response: AuthenticationResult) {
        if (response !== null) {
            this.account = response.account;
        } else {
            this.account = this.getAccount();
        }

        if (this.account) {
            UIManager.showWelcomeMessage(this.account);
        }
    }

    login(signInType: string): void {
        if (signInType === "loginPopup") {
            this.myMSALObj.loginPopup(this.loginRequest).then((resp: AuthenticationResult) => {
                this.handleResponse(resp);
            }).catch(console.error);
        } else if (signInType === "loginRedirect") {
            this.myMSALObj.loginRedirect(this.loginRequest);
        }
    }

    async getProfileTokenRedirect(): Promise<string> {
        this.silentProfileRequest.account = this.account;
        return this.getTokenRedirect(this.silentProfileRequest, this.profileRequest);
    }

    async getProfileTokenPopup(): Promise<string> {
        this.silentProfileRequest.account = this.account;
        return this.getTokenPopup(this.silentProfileRequest, this.profileRequest);
    }

    async getMailTokenRedirect(): Promise<string> {
        this.silentMailRequest.account = this.account;
        return this.getTokenRedirect(this.silentMailRequest, this.mailRequest);
    }

    async getMailTokenPopup(): Promise<string> {
        this.silentMailRequest.account = this.account;
        return this.getTokenPopup(this.silentMailRequest, this.mailRequest);
    }

    private async getTokenPopup(silentRequest: SilentFlowRequest, interactiveRequest: AuthorizationUrlRequest): Promise<string> {
        try {
            const response: AuthenticationResult = await this.myMSALObj.acquireTokenSilent(silentRequest);
            return response.accessToken;
        } catch (e) {
            console.log("silent token acquisition fails.");
            if (e instanceof InteractionRequiredAuthError) {
                console.log("acquiring token using redirect");
                return this.myMSALObj.acquireTokenPopup(interactiveRequest).then((resp) => {
                    return resp.accessToken;
                }).catch((err) => {
                    console.error(err);
                    return null;
                });
            } else {
                console.error(e);
            }
        }
    }

    private async getTokenRedirect(silentRequest: SilentFlowRequest, interactiveRequest: AuthorizationUrlRequest): Promise<string> {
        try {
            const response = await this.myMSALObj.acquireTokenSilent(silentRequest);
            return response.accessToken;
        } catch (e) {
            console.log("silent token acquisition fails.");
            if (e instanceof InteractionRequiredAuthError) {
                console.log("acquiring token using redirect");
                this.myMSALObj.acquireTokenRedirect(interactiveRequest).catch(console.error);
            } else {
                console.error(e);
            }
        }
    }
}
