/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * Terminal state indicating the operation completed successfully.
 */
export class CompletedStateV2 extends AuthFlowStateBase {
    readonly stateType = "completed";
}
