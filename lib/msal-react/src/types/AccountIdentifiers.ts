/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "@azure/msal-browser";

export type AccountIdentifiers = Partial<Pick<AccountInfo, "homeAccountId"|"localAccountId"|"username">>;
