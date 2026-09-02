/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthActionRequiredStateParametersV2 } from "../../../../core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import type { SignUpAttributeV2 } from "../../../../core/network_client/custom_auth_api/v2/result/SignUpResultsV2.js";

export interface AttributesRequiredStateParametersV2
    extends CustomAuthActionRequiredStateParametersV2 {
    attributes: SignUpAttributeV2[];
}

export interface SignUpPasswordRequiredStateParametersV2
    extends CustomAuthActionRequiredStateParametersV2 {
    attributes: SignUpAttributeV2[];
    requiredPasswordAttribute: SignUpAttributeV2;
}
