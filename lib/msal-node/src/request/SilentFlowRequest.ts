/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, CommonSilentFlowRequest } from "@azure/msal-common";

export type SilentFlowRequest = Partial<Omit<CommonSilentFlowRequest, "account"|"scopes"|"resourceRequestMethod"|"resourceRequestUri">> & {
    account: AccountInfo;
    scopes: Array<string>;
};
