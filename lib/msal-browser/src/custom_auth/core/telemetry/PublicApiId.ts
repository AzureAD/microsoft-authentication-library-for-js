/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2FlowScenario } from "../auth_flow/v2/CustomAuthV2FlowScenario.js";

/*
 * The public API ids should be claim in the MSAL telemtry tracker.
 * All the following ids are hardcoded; so we need to find a way to claim them in the future and update them here.
 */

// Sign in
export const SIGN_IN_WITH_CODE_START = 100001;
export const SIGN_IN_WITH_PASSWORD_START = 100002;
export const SIGN_IN_SUBMIT_CODE = 100003;
export const SIGN_IN_SUBMIT_PASSWORD = 100004;
export const SIGN_IN_RESEND_CODE = 100005;
export const SIGN_IN_AFTER_SIGN_UP = 100006;
export const SIGN_IN_AFTER_PASSWORD_RESET = 100007;

// Sign up
export const SIGN_UP_WITH_PASSWORD_START = 100021;
export const SIGN_UP_START = 100022;
export const SIGN_UP_SUBMIT_CODE = 100023;
export const SIGN_UP_SUBMIT_PASSWORD = 100024;
export const SIGN_UP_SUBMIT_ATTRIBUTES = 100025;
export const SIGN_UP_RESEND_CODE = 100026;

// Password reset
export const PASSWORD_RESET_START = 100041;
export const PASSWORD_RESET_SUBMIT_CODE = 100042;
export const PASSWORD_RESET_SUBMIT_PASSWORD = 100043;
export const PASSWORD_RESET_RESEND_CODE = 100044;

// Get account
export const ACCOUNT_GET_ACCOUNT = 100061;
export const ACCOUNT_SIGN_OUT = 100062;
export const ACCOUNT_GET_ACCESS_TOKEN = 100063;

// JIT (Just-In-Time) Auth Method Registration
export const JIT_CHALLENGE_AUTH_METHOD = 100081;
export const JIT_SUBMIT_CHALLENGE = 100082;

// MFA
export const MFA_REQUEST_CHALLENGE = 100101;
export const MFA_SUBMIT_CHALLENGE = 100102;

/*
 * Native Auth V2 (server-driven HAL flows). Dedicated ids so V2 telemetry is distinguishable from
 * the V1 flows above. Values are placeholders in the JS 100xxx space pending central
 * telemetry claiming (INV-apiid). Sign-in-after-reset intentionally has no dedicated id - it
 * reuses SIGN_IN_AFTER_PASSWORD_RESET above.
 */
export const RESET_PASSWORD_V2_START = 100201;
export const RESET_PASSWORD_V2_SUBMIT_CODE = 100202;
export const RESET_PASSWORD_V2_RESEND_CODE = 100203;
export const RESET_PASSWORD_V2_SUBMIT = 100204;
export const RESET_PASSWORD_V2_CHALLENGE = 100205;

/*
 * The generic (flow-agnostic) V2 interaction-client steps. Every server-driven flow reuses the same
 * step methods, so the telemetry api id for a step cannot be hardcoded in the step itself - it
 * varies by the originating flow. `V2_FLOW_STEP_API_IDS` maps the flow scenario (carried on the
 * continuation) plus the step to the public api id to report, letting one shared step serve every
 * flow. New flows (sign-in, sign-up) register their own row here when they are wired up. Colocated
 * with the ids above so the mapping and its targets stay in one place.
 */
export type V2FlowStep =
    | "requestChallenge"
    | "submitCode"
    | "resendCode"
    | "submitPassword"
    | "signInAfterReset";

export const V2_FLOW_STEP_API_IDS: Partial<
    Record<CustomAuthV2FlowScenario, Record<V2FlowStep, number>>
> = {
    [CustomAuthV2FlowScenario.PasswordReset]: {
        requestChallenge: RESET_PASSWORD_V2_CHALLENGE,
        submitCode: RESET_PASSWORD_V2_SUBMIT_CODE,
        resendCode: RESET_PASSWORD_V2_RESEND_CODE,
        submitPassword: RESET_PASSWORD_V2_SUBMIT,
        // Sign-in-after-reset has no dedicated V2 id; it reuses the V1 id.
        signInAfterReset: SIGN_IN_AFTER_PASSWORD_RESET,
    },
};
