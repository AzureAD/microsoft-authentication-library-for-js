/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    acquireMtlsMsiToken as _acquireMtlsMsiToken,
    makeMtlsMsiRequest as _makeMtlsMsiRequest,
} from "@azure/msal-node-mtls-extensions";
import type {
    MtlsMsiTokenRequest,
    MtlsMsiRequestOptions,
    MtlsMsiResponse,
} from "@azure/msal-node-mtls-extensions";
import type { AuthenticationResult } from "@azure/msal-node";
import { getHelperPath } from "./KeyAttestationPaths.js";

/**
 * Acquires an mTLS PoP access token for a Windows Managed Identity.
 *
 * This is a convenience wrapper around the same function from
 * `@azure/msal-node-mtls-extensions` that automatically injects the path
 * to the `MsalMtlsMsiHelper.exe` binary bundled with this package.
 *
 * @see {@link https://www.npmjs.com/package/@azure/msal-node-mtls-extensions}
 * for full parameter documentation.
 */
export function acquireMtlsMsiToken(
    request: MtlsMsiTokenRequest
): Promise<AuthenticationResult> {
    return _acquireMtlsMsiToken({ ...request, helperPath: getHelperPath() });
}

/**
 * Makes a downstream HTTP call over mTLS using the KeyGuard-bound certificate.
 *
 * This is a convenience wrapper around the same function from
 * `@azure/msal-node-mtls-extensions` that automatically injects the path
 * to the `MsalMtlsMsiHelper.exe` binary bundled with this package.
 *
 * @see {@link https://www.npmjs.com/package/@azure/msal-node-mtls-extensions}
 * for full parameter documentation.
 */
export function makeMtlsMsiRequest(
    options: MtlsMsiRequestOptions
): Promise<MtlsMsiResponse> {
    return _makeMtlsMsiRequest({ ...options, helperPath: getHelperPath() });
}
