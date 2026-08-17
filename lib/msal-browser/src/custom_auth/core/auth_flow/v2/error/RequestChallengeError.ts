/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised when requesting (or resending) a challenge for a selected
 * authentication method. It is a shared action error bound to the shared
 * `RequestChallengeResult` and returned regardless of which entry flow reached
 * it. It currently exposes no action-specific detectors — only the inherited
 * `isBrowserRequired()`.
 */
export class RequestChallengeError extends AuthFlowErrorV2Base {}
