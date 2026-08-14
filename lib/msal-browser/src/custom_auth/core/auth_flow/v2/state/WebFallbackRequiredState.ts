/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * Terminal state signaling that the flow cannot continue natively and the
 * application should leave the native flow and start its normal browser-based
 * authentication path.
 *
 * This is only a signal: Native Auth does not own or drive the browser
 * navigation, and no server-provided fallback URL is exposed on this state or
 * on the result (mirroring iOS, which surfaces only an `isBrowserRequired`
 * indication). The application initiates its existing web sign-in itself.
 */
export class WebFallbackRequiredState extends AuthFlowStateBase {
    readonly stateType = "webFallbackRequired";
}
