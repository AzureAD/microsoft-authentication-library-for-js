/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";

/**
 * Error raised when redeeming a completed V2 flow's continuation for tokens.
 * It adds no action-specific detectors beyond the inherited
 * `isBrowserRequired()`; the app typically retries or starts sign-in explicitly.
 */
export class SignInContinuationErrorV2 extends AuthFlowErrorBaseV2 {}
