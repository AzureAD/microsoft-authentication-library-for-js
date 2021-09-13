/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodePayload } from "@azure/msal-common";
import { SsoSilentRequest } from "./SsoSilentRequest";

export type HybridSsoSilentRequest = SsoSilentRequest & {
    authCodePayload: AuthorizationCodePayload;
};
