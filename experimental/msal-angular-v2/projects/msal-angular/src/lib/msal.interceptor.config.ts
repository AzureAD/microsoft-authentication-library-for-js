import { InteractionType } from "./constants";
import { PopupRequest, RedirectRequest } from '@azure/msal-browser';

export type MsalInterceptorConfig = {
    interactionType: InteractionType.POPUP | InteractionType.REDIRECT;
    protectedResourceMap: Map<string, Array<string>>;
    authRequest?: PopupRequest | RedirectRequest;
};
