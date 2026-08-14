/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorV2Base } from "./AuthFlowErrorV2Base.js";

/**
 * Error raised when requesting (or resending) a challenge for a selected
 * authentication method.
 *
 * Shared **action** error, not flow-specific: the request-challenge endpoint is
 * shared across every V2 flow (sign-in, sign-up, reset-password), so this single
 * error type is bound to the shared `RequestChallengeResult` and returned
 * regardless of which entry flow reached it.
 *
 * SSPR scope exposes no action-specific detectors here — only the inherited
 * `isBrowserRequired()` / `isGeneralError()`. The request-challenge typed errors
 * in the V2 error vocabulary (`authMethodBlocked`, `verificationContactBlocked`,
 * `invalidInput`) are all strong-auth / MFA concerns that pair with the deferred
 * MFA / StrongAuth states, so their detectors are added when MFA lands.
 */
export class RequestChallengeError extends AuthFlowErrorV2Base {}
