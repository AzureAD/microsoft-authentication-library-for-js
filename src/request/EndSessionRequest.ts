/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../account/AccountInfo";

export type EndSessionRequest = {
    account: AccountInfo,
    postLogoutRedirectUri?: string,
    authority?: string
};
