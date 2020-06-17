/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "../account/AccountInfo";

/**
 * Request type sent to logout API.
 * - account: Account interface that will logout accounts matching the given params.
 * - postLogoutRedirectUri: optional parameter which is the location that the redirect will navigate to after the end_session endpoint.
 */
export type EndSessionRequest = {
    account: AccountInfo,
    authority?: string,
    postLogoutRedirectUri?: string
};
