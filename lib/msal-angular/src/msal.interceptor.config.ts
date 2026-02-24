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
  /**
   * When `true` (the default in v5), enables stricter, more correct URL component pattern matching for
   * `protectedResourceMap` entries. Strict matching uses anchored regex patterns and
   * treats metacharacters (including `.`) as literals, so patterns match only their
   * intended strings. Wildcards still apply, but host-component wildcards
   * are constrained to a single DNS label.
   * 
   * Set to `false` to use the legacy matching behaviour from v4 for
   * backwards compatibility.
   *
   * @default true
   */
  strictMatching?: boolean;
};

export type ProtectedResourceScopes = {
  httpMethod: string;
  scopes: Array<string> | null;
};
