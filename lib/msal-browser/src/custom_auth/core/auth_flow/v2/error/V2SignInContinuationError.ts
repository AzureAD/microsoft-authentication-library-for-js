/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised when redeeming a completed V2 flow's continuation for tokens.
 * It adds no action-specific detectors beyond the inherited
 * `isBrowserRequired()`; the app typically retries or starts sign-in explicitly.
 */
export class V2SignInContinuationError extends AuthFlowErrorV2Base {}
