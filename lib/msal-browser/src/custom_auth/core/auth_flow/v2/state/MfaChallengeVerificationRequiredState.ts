/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { MfaChallengeVerificationRequiredStateParameters } from "./CustomAuthV2StateParameters.js";

/**
 * State returned when the user must verify a multi-factor authentication
 * challenge, for example by submitting a one-time code.
 *
 * Reserved for the native auth V2 sign-in flow; exposed in the public surface
 * for forward compatibility. Its data and actions are added when sign-in
 * multi-factor authentication lands.
 */
export class MfaChallengeVerificationRequiredState extends AuthFlowActionRequiredStateBase<MfaChallengeVerificationRequiredStateParameters> {
    readonly stateType = "mfaVerificationRequired";
}
