import { PopupRequest, RedirectRequest,InteractionType } from '@azure/msal-browser';

export type MsalGuardConfiguration = {
    interactionType: InteractionType.Popup | InteractionType.Redirect;
    authRequest?: PopupRequest | RedirectRequest;
};
