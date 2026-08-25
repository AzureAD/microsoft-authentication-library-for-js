/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * Terminal state indicating the operation failed.
 *
 * The error is carried by the result's `error` payload, not by this state.
 */
export class FailedStateV2 extends AuthFlowStateBase {
    readonly stateType = "failed";
}
