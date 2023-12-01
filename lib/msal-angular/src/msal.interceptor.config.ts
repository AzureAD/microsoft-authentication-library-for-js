/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable-next-line import/no-unresolved
import { HttpRequest } from "@angular/common/http";
import {
  PopupRequest,
  RedirectRequest,
  InteractionType,
  SilentRequest,
} from "@azure/msal-browser";
import { MsalService } from "./msal.service";

export declare type MsalInterceptorAuthRequest =
  | Omit<PopupRequest, "scopes">
  | Omit<RedirectRequest, "scopes">
  | Omit<SilentRequest, "scopes">;

export type MsalInterceptorConfiguration = {
  interactionType: InteractionType.Popup | InteractionType.Redirect;
  protectedResourceMap: Map<
    string,
    Array<string | ProtectedResourceScopes> | null
  >;
  authRequest?:
    | MsalInterceptorAuthRequest
    | ((
        msalService: MsalService,
        req: HttpRequest<unknown>,
        originalAuthRequest: MsalInterceptorAuthRequest
      ) => MsalInterceptorAuthRequest);
};

export type ProtectedResourceScopes = {
  httpMethod: string;
  scopes: Array<string> | null;
};

export type MatchingResources = {
  absoluteResources: Array<string>;
  relativeResources: Array<string>;
};
