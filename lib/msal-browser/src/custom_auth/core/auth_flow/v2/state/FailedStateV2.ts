/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * Terminal state indicating the operation failed.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export class FailedStateV2 extends AuthFlowStateBase {
    readonly stateType = "failed";
}
