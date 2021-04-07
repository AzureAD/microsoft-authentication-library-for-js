/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RouterStateSnapshot } from "@angular/router";
import { PopupRequest, RedirectRequest,InteractionType } from "@azure/msal-browser";
import { MsalService } from "./msal.service";

export declare type MsalGuardAuthRequest = Partial<PopupRequest> | Partial<Omit<RedirectRequest, "redirectStartPage">>;

export type MsalGuardConfiguration = {
    interactionType: InteractionType.Popup | InteractionType.Redirect;
    authRequest?: MsalGuardAuthRequest | ((authService: MsalService, state: RouterStateSnapshot) => MsalGuardAuthRequest);
    loginFailedRoute?: string;
};
