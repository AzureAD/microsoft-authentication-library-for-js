import { InteractionType } from "./constants";
import { PopupRequest, RedirectRequest } from '@azure/msal-browser';

export type MsalGuardConfiguration = {
    interactionType: InteractionType.POPUP | InteractionType.REDIRECT;
    authRequest?: PopupRequest | RedirectRequest;
};
