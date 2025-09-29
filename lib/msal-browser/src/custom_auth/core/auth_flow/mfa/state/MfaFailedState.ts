/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../AuthFlowState.js";

/**
 * State indicating that the MFA flow has failed.
 */
export class MfaFailedState extends AuthFlowStateBase {}
