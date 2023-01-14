/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ServerAuthorizationCodeResponse } from "@azure/msal-common";

export interface ILoopbackClient {
    listenForAuthCode(successTemplate?: string, errorTemplate?: string): Promise<ServerAuthorizationCodeResponse>;
    getRedirectUri(): string;
    closeServer(): void;
}
