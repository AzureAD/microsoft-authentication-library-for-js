/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { AttributesRequiredStateParameters } from "./CustomAuthV2StateParameters.js";

/**
 * State returned when additional user attributes are required.
 *
 * Reserved for the native auth V2 sign-up flow; referenced by shared action
 * result unions. Its actions are added when sign-up V2 lands.
 */
export class AttributesRequiredState extends AuthFlowActionRequiredStateBase<AttributesRequiredStateParameters> {
    readonly stateType = "attributesRequired";
}
