import { PublicClientApplication, AuthorizationUrlRequest, SilentFlowRequest, AuthenticationResult, Configuration, LogLevel, AccountInfo } from "@azure/msal-browser";
import { UIManager } from "./UIManager";

const MSAL_CONFIG: Configuration = {
    auth: {
        clientId: "3fba556e-5d4a-48e3-8e1a-fd57c12cb82e",
        authority: "https://login.windows-ppe.net/common/"
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
    private loginRequest: AuthorizationUrlRequest;
    private tokenRequest: AuthorizationUrlRequest;
    private silentRequest: SilentFlowRequest;

    constructor() {
        this.myMSALObj = new PublicClientApplication(MSAL_CONFIG);
        this.setRequestObjects();
    }

    private setRequestObjects(): void {
        this.loginRequest = {
            scopes: ["User.Read"]
        };

        // Add here scopes for access token to be used at MS Graph API endpoints.
        this.tokenRequest = {
            scopes: ["Mail.Read"],
            redirectUri: "http://localhost:30662/",
        };

        this.silentRequest = {
            scopes: ["openid", "profile", "User.Read", "Mail.Read"],
            account: null,
            forceRefresh: false
        };
    }

    checkRedirectResponse(): Promise<AuthenticationResult> {
        return this.myMSALObj.handleRedirectPromise();
    }

    handleResponse(response: AuthenticationResult) {
        if (response !== null) {
            UIManager.showWelcomeMessage(response.account);
        } else {
            // need to call getAccount here?
            const currentAccount= this.getAccount()
            if (currentAccount) {
                UIManager.showWelcomeMessage(currentAccount);
            }
        }
    }

    getAccount(): AccountInfo {
        // need to call getAccount here?
        const currentAccounts = this.myMSALObj.getAllAccounts();
        if (currentAccounts === null) {
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

    login(signInType: string): void {
        if (signInType === "loginPopup") {
            this.myMSALObj.loginPopup(this.loginRequest).then(this.handleResponse).catch(console.error);
        } else if (signInType === "loginRedirect") {
            this.myMSALObj.loginRedirect(this.loginRequest);
        }
    }
}
