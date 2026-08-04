/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * Terminal state indicating the flow cannot continue natively and the
 * application must hand off to the web-based experience.
 *
 * The web-fallback URL is carried by the result payload, not by this state.
 */
export class WebFallbackRequiredState extends AuthFlowStateBase {
    readonly stateType = "webFallbackRequired";
}
