/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonOnBehalfOfRequest } from "@azure/msal-common";

export type OnBehalfOfRequest = Partial<Omit<CommonOnBehalfOfRequest, "oboAssertion"|"scopes"|"resourceRequestMethod"|"resourceRequestUri">> & {
    oboAssertion: string;
    scopes: Array<string>;
};
