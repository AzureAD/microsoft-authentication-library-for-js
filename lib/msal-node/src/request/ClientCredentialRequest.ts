/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonClientCredentialRequest } from "@azure/msal-common";

export type ClientCredentialRequest = Partial<Omit<CommonClientCredentialRequest, "scopes"|"resourceRequestMethod"|"resourceRequestUri">> & {
    scopes: Array<string>;
};
