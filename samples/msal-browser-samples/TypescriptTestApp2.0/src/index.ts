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

window.addEventListener("load", async () => {
    authModule.loadPage();
});

export function signIn(method: string): void {
    const signInType = isIE ? "loginRedirect" : method;
    authModule.login(signInType);
}

export function signOut(): void {
    authModule.logout();
}

export async function seeProfile(): Promise<void> {
    const token = isIE ? await authModule.getProfileTokenRedirect() : await authModule.getProfileTokenPopup();
    if (token && token.length > 0) {
        const graphResponse = await networkModule.callEndpointWithToken(GRAPH_CONFIG.GRAPH_ME_ENDPT, token);
        UIManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_ME_ENDPT);
    }
}

export async function readMail(): Promise<void> {
    const token = isIE ? await authModule.getMailTokenRedirect() : await authModule.getMailTokenPopup();
    if (token && token.length > 0) {
        const graphResponse = await networkModule.callEndpointWithToken(GRAPH_CONFIG.GRAPH_MAIL_ENDPT, token);
        UIManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_MAIL_ENDPT);
    }
}
