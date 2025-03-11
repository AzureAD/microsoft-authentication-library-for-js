/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "../../response/AuthenticationResult.js";

export class PlatformDOMHandler {
    async executeGetTokenRequest(request): AuthenticationResult {
        const response =
            await window.navigator.platformAuthentication.executeGetToken(
                request
            );
        return response;
    }
}
