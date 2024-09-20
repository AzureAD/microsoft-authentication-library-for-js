/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "@azure/msal-common/node";

export type SignOutRequest = {
    account: AccountInfo;
    correlationId?: string;
};
