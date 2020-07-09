import { AuthenticationResult } from "@azure/msal-browser";
import { AuthModule } from "./AuthModule";
import { UIManager } from "./UIManager";

// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
// If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const isIE = msie > 0 || msie11 > 0;

const authModule: AuthModule = new AuthModule();

window.addEventListener("load", async () => {
    authModule.checkRedirectResponse().then((resp) => {
        if (resp !== null) {
            UIManager.showWelcomeMessage(resp.account);
        } else {
            // need to call getAccount here?
            const currentAccount = authModule.getAccount();
            if (currentAccount) {
                UIManager.showWelcomeMessage(currentAccount);
            }
        }
    }).catch(console.error);
});

export function signIn(method: string): void {
    const signInType = isIE ? "loginRedirect" : method;
    authModule.login(signInType);
}
