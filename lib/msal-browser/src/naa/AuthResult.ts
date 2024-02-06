/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "./AccountInfo";
import { TokenResponse } from "./TokenResponse";

export type AuthResult = {
    token: TokenResponse;
    account: AccountInfo;
};
