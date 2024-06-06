import { RouteLocationNormalized, Router } from "vue-router";
import { msalInstance, loginRequest } from "../authConfig";
import { InteractionType, PopupRequest, PublicClientApplication, RedirectRequest } from "@azure/msal-browser";

export function registerGuard(router: Router) {
    router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized) => {
        if (to.meta.requiresAuth) {
            const request = {
                ...loginRequest,
                redirectStartPage: to.fullPath
            }
            const shouldProceed = await isAuthenticated(msalInstance, InteractionType.Redirect, request);
            return shouldProceed || '/failed';
        }
    
        return true;
    });
}

export async function isAuthenticated(instance: PublicClientApplication, interactionType: InteractionType, loginRequest: PopupRequest|RedirectRequest): Promise<boolean> {    
    // If your application uses redirects for interaction, handleRedirectPromise must be called and awaited on each page load before determining if a user is signed in or not  
    return instance.handleRedirectPromise().then(() => {
        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
            return true;
        }

        // User is not signed in and attempting to access protected route. Sign them in.
        if (interactionType === InteractionType.Popup) {
            return instance.loginPopup(loginRequest).then(() => {
                return true;
            }).catch(() => {
                return false;
            })
        } else if (interactionType === InteractionType.Redirect) {
            return instance.loginRedirect(loginRequest).then(() => {
                return true;
            }).catch(() => {
                return false;
            });
        }

        return false;
    }).catch(() => {
        return false;
    });
}