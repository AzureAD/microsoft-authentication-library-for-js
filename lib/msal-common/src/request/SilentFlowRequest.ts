/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../account/AccountInfo";
import { BaseAuthRequest } from "./BaseAuthRequest";

/**
 * SilentFlow parameters passed by the user to retrieve credentials silently
 * - scopes: Scopes the application is requesting access to
 * - authority: Url of the authority which the application acquires tokens from
 * - account: Account entity to lookup the credentials
 * - forceRefresh: Forces silent requests to make network calls if true
 * - correlationId: GUID set by the user to trace the request
 */
export type SilentFlowRequest = BaseAuthRequest & {
    account: AccountInfo;
    forceRefresh?: boolean;
};
