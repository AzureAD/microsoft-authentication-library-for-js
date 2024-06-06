import { AuthModule } from "./AuthModule";
import { FetchManager } from "./FetchManager";
import { UIManager } from "./UIManager";
import { GRAPH_CONFIG } from "./Constants";

// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
// If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const isIE = msie > 0 || msie11 > 0;

const authModule: AuthModule = new AuthModule();
const networkModule: FetchManager = new FetchManager();

// Load auth module when browser window loads. Only required for redirect flows.
window.addEventListener("load", async () => {
    authModule.loadAuthModule();
});

/**
 * Called when user clicks "Sign in with Redirect" or "Sign in with Popup"
 * @param method 
 */
export function signIn(method: string): void {
    const signInType = isIE ? "loginRedirect" : method;
    authModule.login(signInType);
}

/**
 * Called when user clicks "Sign Out"
 */
export function signOut(): void {
    authModule.logout();
}

/**
 * Called when user clicks "See Profile"
 */
export async function seeProfile(): Promise<void> {
    const token = isIE ? await authModule.getProfileTokenRedirect() : await authModule.getProfileTokenPopup();
    if (token && token.length > 0) {
        const graphResponse = await networkModule.callEndpointWithToken(GRAPH_CONFIG.GRAPH_ME_ENDPT, token);
        UIManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_ME_ENDPT);
    }
}

/**
 * Called when user clicks "Read Mail"
 */
export async function readMail(): Promise<void> {
    const token = isIE ? await authModule.getMailTokenRedirect() : await authModule.getMailTokenPopup();
    if (token && token.length > 0) {
        const graphResponse = await networkModule.callEndpointWithToken(GRAPH_CONFIG.GRAPH_MAIL_ENDPT, token);
        UIManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_MAIL_ENDPT);
    }
}

/**
 * Called when user clicks "Attempt SsoSilent"
 */
export function attemptSsoSilent(): void {
    authModule.attemptSsoSilent();
}
