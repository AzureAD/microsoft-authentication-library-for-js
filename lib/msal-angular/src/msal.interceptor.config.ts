/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PopupRequest, RedirectRequest, InteractionType, SilentRequest } from "@azure/msal-browser";

export type MsalInterceptorConfiguration = {
    interactionType: InteractionType.Popup | InteractionType.Redirect;
    protectedResourceMap: Map<string, Array<string>>;
    authRequest?: Omit<PopupRequest, "scopes"> | Omit<RedirectRequest, "scopes"> | Omit<SilentRequest, "scopes">;
};
