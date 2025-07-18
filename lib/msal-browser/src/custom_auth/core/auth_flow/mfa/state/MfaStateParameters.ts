/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateParameters } from "../../AuthFlowState.js";
import { MfaClient } from "../../../interaction_client/mfa/MfaClient.js";
import { AuthenticationMethod } from "../../../network_client/custom_auth_api/types/ApiResponseTypes.js";
import { CustomAuthSilentCacheClient } from "../../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

/**
 * Parameters required for MFA states.
 */
export interface MfaStateParameters
    extends AuthFlowActionRequiredStateParameters {
    /**
     * The MFA client for handling MFA operations.
     */
    mfaClient: MfaClient;

    /**
     * The cache client for handling account data.
     */
    cacheClient: CustomAuthSilentCacheClient;

    /**
     * The scopes.
     */
    scopes?: string[];
}

/**
 * Extended parameters for MFA verification required state.
 */
export interface MfaVerificationRequiredStateParameters
    extends MfaStateParameters {
    /**
     * The channel through which the challenge was sent (e.g., "email").
     */
    challengeChannel: string;

    /**
     * The target label indicating where the challenge was sent (e.g., masked email).
     */
    challengeTargetLabel: string;

    /**
     * The length of the expected code.
     */
    codeLength: number;

    /**
     * The ID of the selected authentication method.
     */
    selectedAuthMethodId?: string;
}

/**
 * Extended parameters for MFA method selection required state.
 */
export interface MfaMethodSelectionRequiredStateParameters
    extends MfaStateParameters {
    /**
     * Available authentication methods for the user to choose from.
     */
    authMethods: AuthenticationMethod[];
}
