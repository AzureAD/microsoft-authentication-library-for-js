/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationResult } from "@azure/msal-common";
import { ManagedIdentityResult } from "../response/ManagedIdentityResult";

export class ManagedIdentityUtils {
    static convertAuthResultToManagedIdentityResult = (
        authResult: AuthenticationResult
    ): ManagedIdentityResult => {
        return {
            accessToken: authResult.accessToken,
            expiresOn: (authResult.expiresOn as Date).getTime() / 1000,
            resource: authResult.managedIdentityResource as string,
            tokenType: authResult.tokenType,
            clientId: authResult.managedIdentityClientId as string,
            fromCache: authResult.fromCache,
        };
    };
}
