/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { MfaSelectionRequiredStateParameters } from "./CustomAuthV2StateParameters.js";

/**
 * State returned when the user must select a multi-factor authentication method
 * before a challenge can be issued.
 *
 * Reserved for the native auth V2 sign-in flow; exposed in the public surface
 * for forward compatibility. Its data and actions are added when sign-in
 * multi-factor authentication lands.
 */
export class MfaSelectionRequiredState extends AuthFlowActionRequiredStateBase<MfaSelectionRequiredStateParameters> {
    readonly stateType = "mfaSelectionRequired";
}
