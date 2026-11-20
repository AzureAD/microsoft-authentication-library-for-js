/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";

/**
 * postMessage envelope type used to relay an auth response from a popup-relay
 * page (see `runPopupRelay`) back to the embedded frame that opened it. See
 * {@link BrowserAuthOptions.popupRelayUri}.
 *
 * Shared by the relay-page entry and client helpers without importing either
 * implementation into the other bundle.
 *
 * @internal
 */
export const POPUP_RELAY_RESPONSE_TYPE = "msal:popup-relay-response:v1";

/** @internal Response bound to an authenticated v2 relay document. */
export const POPUP_RELAY_V2_RESPONSE_TYPE = "msal:popup-relay-response:v2";

/** @internal Ready signal for the authenticated popup-relay request handoff. */
export const POPUP_RELAY_READY_TYPE = "msal:popup-relay-ready:v2";

/** @internal Request delivered only to the same-origin relay window. */
export const POPUP_RELAY_REQUEST_TYPE = "msal:popup-relay-request:v2";

/** @internal Resolve the compatibility default without downgrading invalid versions. */
export function getPopupRelayProtocolVersion(
    version: unknown,
    correlationId: string = ""
): 1 | 2 {
    if (version === undefined) {
        return 1;
    }
    if (version !== 1 && version !== 2) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
            correlationId,
            "popup_relay_invalid_protocol"
        );
    }
    return version;
}
