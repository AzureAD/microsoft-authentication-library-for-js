/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * Terminal state indicating the operation failed.
 */
export class FailedStateV2 extends AuthFlowStateBase {
    readonly stateType = "failed";
}
