/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised when signing the user in after a password reset completes. The
 * reset itself has already succeeded at this point, so this failure concerns the
 * follow-up token acquisition only. It adds no action-specific detectors beyond
 * the inherited `isBrowserRequired()` and `isGeneralError()`; the app typically
 * retries the sign-in or restarts sign-in explicitly.
 */
export class SignInAfterResetPasswordError extends AuthFlowErrorV2Base {}
