/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PopupRequest, RedirectRequest,InteractionType } from "@azure/msal-browser";

export type MsalGuardConfiguration = {
    interactionType: InteractionType.Popup | InteractionType.Redirect;
    authRequest?: Omit<PopupRequest, "scopes"> | Omit<RedirectRequest, "redirectStartPage"|"scopes">;
};
