/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * Terminal state indicating the operation completed successfully.
 *
 * Completion data (for example the signed-in account) is carried by the
 * result's `data` payload, not by this state.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export class CompletedStateV2 extends AuthFlowStateBase {
    readonly stateType = "completed";
}
