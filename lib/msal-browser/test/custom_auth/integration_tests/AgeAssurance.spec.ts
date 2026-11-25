/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthToken } from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../../src/cache/BrowserCacheManager.js";
import { base64Decode } from "../../../src/encode/Base64Decode.js";
import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { SignInResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInResult.js";
import { ResetPasswordCodeRequiredState } from "../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordCodeRequiredState.js";
import { ResetPasswordPasswordRequiredState } from "../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordPasswordRequiredState.js";
import { ResetPasswordCompletedState } from "../../../src/custom_auth/reset_password/auth_flow/state/ResetPasswordCompletedState.js";
import { SubmitNewPasswordResultV2 } from "../../../src/custom_auth/reset_password/auth_flow/v2/result/SubmitNewPasswordResultV2.js";
import { VerifyChallengeResultV2 } from "../../../src/custom_auth/core/auth_flow/v2/result/VerifyChallengeResultV2.js";
import { SignInContinuationStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { SignInPasswordRequiredState } from "../../../src/custom_auth/sign_in/auth_flow/state/SignInPasswordRequiredState.js";
import { SignInCodeRequiredState } from "../../../src/custom_auth/sign_in/auth_flow/state/SignInCodeRequiredState.js";
import { SignInSubmitCodeResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitCodeResult.js";
import { SignInSubmitPasswordResult } from "../../../src/custom_auth/sign_in/auth_flow/result/SignInSubmitPasswordResult.js";
import {
    MfaAwaitingState,
    MfaVerificationRequiredState,
} from "../../../src/custom_auth/core/auth_flow/mfa/state/MfaState.js";
import {
    AuthMethodRegistrationRequiredState,
    AuthMethodVerificationRequiredState,
} from "../../../src/custom_auth/core/auth_flow/jit/state/AuthMethodRegistrationState.js";
import { PasswordRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/PasswordRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { MFAVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/MFAVerificationRequiredStateV2.js";
import {
    AuthMethodRegistrationRequiredStateV2,
    AuthMethodVerificationRequiredStateV2,
} from "../../../src/custom_auth/index.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import {
    ENTRY_RESPONSE,
    START_RESPONSE,
    PASSWORD_CHALLENGE_RESPONSE,
    EMAIL_START_RESPONSE,
    EMAIL_CHALLENGE_RESPONSE,
    SIGN_IN_CONTINUE_RESPONSE,
    CONTINUE_RESPONSE,
    EMAIL_MFA_REQUIRED_RESPONSE,
    EMAIL_MFA_CHALLENGE_RESPONSE,
    MFA_VERIFY_RESPONSE,
    EMAIL_REGISTRATION_REQUIRED_RESPONSE,
    EMAIL_REGISTRATION_ACTIVATION_RESPONSE,
} from "./SignInV2Constants.js";
import * as resetV2 from "./ResetPasswordV2Constants.js";
import * as signUpV2 from "./SignUpV2Constants.js";

const claims = JSON.stringify({
    id_token: { xms_agvs: { additionalProperties: ["target-mc"] } },
});
const receipts = ["+MC", "-mc", undefined, "+all", "+other"];
const response = (body: unknown, status = 200): Response =>
    ({
        status,
        ok: status === 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => body,
    } as Response);

function tokenResponse(receipt: string | undefined) {
    const tokenClaims = {
        ...AuthToken.extractTokenClaims(
            TestServerTokenResponse.id_token,
            base64Decode,
            ""
        ),
        xms_agvt: receipt,
    };
    return {
        ...TestServerTokenResponse,
        id_token: `header.${btoa(JSON.stringify(tokenClaims))}.signature`,
    };
}

describe("Native Auth age-assurance binding", () => {
    let app: CustomAuthPublicClientApplication;
    let saveCache: jest.SpyInstance;

    beforeEach(async () => {
        app = (await CustomAuthPublicClientApplication.create(
            customAuthConfig
        )) as CustomAuthPublicClientApplication;
        global.fetch = jest.fn();
        saveCache = jest.spyOn(
            BrowserCacheManager.prototype,
            "saveCacheRecord"
        );
    });

    afterEach(async () => {
        await app.clearCache();
        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        controller["eventHandler"]["broadcastChannel"]?.close();
        jest.restoreAllMocks();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    function expectCompletion(
        result: { data?: unknown; error?: { errorData: { error: string } } },
        receipt: string | undefined,
        callCount: number
    ) {
        if (receipt === "+MC" || receipt === "-mc") {
            expect(result.error).toBeUndefined();
            expect(result.data).toBeDefined();
            expect(saveCache).toHaveBeenCalledTimes(1);
            expect(app.getAllAccounts()).toHaveLength(1);
        } else {
            expect(result.error?.errorData.error).toBe(
                "age_assurance_target_mismatch"
            );
            expect(result.data).toBeUndefined();
            expect(saveCache).not.toHaveBeenCalled();
            expect(app.getAllAccounts()).toHaveLength(0);
        }
        expect(fetch).toHaveBeenCalledTimes(callCount);
    }

    async function completeV1Challenge(
        result:
            | SignInResult
            | SignInSubmitCodeResult
            | SignInSubmitPasswordResult,
        flow: string
    ) {
        if (flow.startsWith("mfa")) {
            expect(result.isMfaRequired()).toBe(true);
            const challenge = await (
                result.state as MfaAwaitingState
            ).requestChallenge("email");
            expect(challenge.isVerificationRequired()).toBe(true);
            return (
                challenge.state as MfaVerificationRequiredState
            ).submitChallenge("123456");
        }
        if (flow.startsWith("jit")) {
            expect(result.isAuthMethodRegistrationRequired()).toBe(true);
            const state = result.state as AuthMethodRegistrationRequiredState;
            const challenge = await state.challengeAuthMethod({
                authMethodType: state.getAuthMethods()[0],
                verificationContact: "user@contoso.com",
            });
            if (flow === "jitFastPass") {
                return challenge;
            }
            expect(challenge.isVerificationRequired()).toBe(true);
            return (
                challenge.state as AuthMethodVerificationRequiredState
            ).submitChallenge("123456");
        }
        return result;
    }

    describe.each([
        "password",
        "passwordLater",
        "oob",
        "mfa",
        "mfaOob",
        "jit",
        "jitFastPass",
    ])("V1 %s", (flow) => {
        it.each(receipts)(
            "binds receipt %p to the original claims across continuations",
            async (receipt) => {
                const oob = flow === "oob" || flow === "mfaOob";
                const mfa = flow.startsWith("mfa");
                const jit = flow.startsWith("jit");
                const inputs = {
                    username: "user@contoso.com",
                    password:
                        oob || flow === "passwordLater"
                            ? undefined
                            : "password",
                    correlationId: "test-correlation-id",
                    claims,
                };
                let release!: () => void;
                let entered!: () => void;
                const outstanding = new Promise<void>((resolve) => {
                    release = resolve;
                });
                const started = new Promise<void>((resolve) => {
                    entered = resolve;
                });
                (fetch as jest.Mock)
                    .mockImplementationOnce(async () => {
                        entered();
                        await outstanding;
                        return response({ continuation_token: "ct-start" });
                    })
                    .mockResolvedValueOnce(
                        response({
                            continuation_token: "ct-challenge",
                            challenge_type: oob ? "oob" : "password",
                            code_length: 6,
                        })
                    );
                if (mfa || jit) {
                    (fetch as jest.Mock)
                        .mockResolvedValueOnce(
                            response(
                                {
                                    error: "invalid_grant",
                                    suberror: mfa
                                        ? "mfa_required"
                                        : "registration_required",
                                    continuation_token: "ct-extra",
                                },
                                400
                            )
                        )
                        .mockResolvedValueOnce(
                            response({
                                continuation_token: "ct-method",
                                methods: [
                                    {
                                        id: "email",
                                        challenge_type: "oob",
                                        challenge_channel: "email",
                                    },
                                ],
                            })
                        )
                        .mockResolvedValueOnce(
                            response({
                                continuation_token: "ct-extra-challenge",
                                challenge_type:
                                    flow === "jitFastPass"
                                        ? "preverified"
                                        : "oob",
                                challenge_channel: "email",
                                code_length: 6,
                            })
                        );
                    if (jit) {
                        (fetch as jest.Mock).mockResolvedValueOnce(
                            response({ continuation_token: "ct-registered" })
                        );
                    }
                }
                (fetch as jest.Mock).mockResolvedValueOnce(
                    response(tokenResponse(receipt))
                );

                const pending = app.signIn(inputs);
                await started;
                inputs.claims = "{}";
                release();
                const start = await pending;
                let result:
                    | typeof start
                    | SignInSubmitCodeResult
                    | SignInSubmitPasswordResult = start;
                if (oob) {
                    expect(result.isCodeRequired()).toBe(true);
                    result = await (
                        result.state as SignInCodeRequiredState
                    ).submitCode("123456");
                } else if (flow === "passwordLater") {
                    expect(result.isPasswordRequired()).toBe(true);
                    result = await (
                        result.state as SignInPasswordRequiredState
                    ).submitPassword("password");
                }
                const completed = await completeV1Challenge(result, flow);
                expectCompletion(completed, receipt, mfa ? 6 : jit ? 7 : 3);
                const tokenRequests = (fetch as jest.Mock).mock.calls.filter(
                    ([url]) => url.toString().endsWith("/token")
                );
                expect(tokenRequests.length).toBeGreaterThan(0);
                for (const [, request] of tokenRequests) {
                    expect(
                        new URLSearchParams(request.body).get("claims")
                    ).toBe(claims);
                }
            }
        );
    });

    describe.each(["direct", "mfa", "jit"])("V1 continuation %s", (flow) => {
        it.each(["-mc", "+all"])(
            "binds receipt %p after reset and optional challenges",
            async (receipt) => {
                const bodies: unknown[] = [
                    { continuation_token: "ct-start" },
                    {
                        continuation_token: "ct-challenge",
                        challenge_type: "oob",
                        code_length: 6,
                    },
                    { continuation_token: "ct-verify", expires_in: 600 },
                    { continuation_token: "ct-submit", poll_interval: 1 },
                    { continuation_token: "ct-completed", status: "succeeded" },
                ];
                for (const body of bodies) {
                    (fetch as jest.Mock).mockResolvedValueOnce(response(body));
                }
                const start = await app.resetPassword({
                    username: "user@contoso.com",
                });
                const verified = await (
                    start.state as ResetPasswordCodeRequiredState
                ).submitCode("123456");
                const reset = await (
                    verified.state as ResetPasswordPasswordRequiredState
                ).submitNewPassword("password");
                if (flow !== "direct") {
                    (fetch as jest.Mock)
                        .mockResolvedValueOnce(
                            response(
                                {
                                    error: "invalid_grant",
                                    suberror:
                                        flow === "mfa"
                                            ? "mfa_required"
                                            : "registration_required",
                                    continuation_token: "ct-extra",
                                },
                                400
                            )
                        )
                        .mockResolvedValueOnce(
                            response({
                                continuation_token: "ct-method",
                                methods: [
                                    {
                                        id: "email",
                                        challenge_type: "oob",
                                        challenge_channel: "email",
                                    },
                                ],
                            })
                        )
                        .mockResolvedValueOnce(
                            response({
                                continuation_token: "ct-extra-challenge",
                                challenge_type: "oob",
                                challenge_channel: "email",
                                code_length: 6,
                            })
                        );
                    if (flow === "jit") {
                        (fetch as jest.Mock).mockResolvedValueOnce(
                            response({ continuation_token: "ct-registered" })
                        );
                    }
                }
                (fetch as jest.Mock).mockResolvedValueOnce(
                    response(tokenResponse(receipt))
                );
                const inputs = { claims };
                const pending = (
                    reset.state as ResetPasswordCompletedState
                ).signIn(inputs);
                inputs.claims = "{}";
                const completed = await completeV1Challenge(
                    await pending,
                    flow
                );
                expectCompletion(
                    completed,
                    receipt,
                    flow === "direct" ? 6 : flow === "mfa" ? 9 : 10
                );
            }
        );
    });

    describe.each(["password", "oob", "mfa", "jit"])("V2 %s", (flow) => {
        it.each(receipts)(
            "binds receipt %p through server-directed continuation",
            async (receipt) => {
                const inputs = { username: "user@contoso.com", claims };
                const bodies: unknown[] = [
                    ENTRY_RESPONSE,
                    flow === "oob" ? EMAIL_START_RESPONSE : START_RESPONSE,
                    flow === "oob"
                        ? EMAIL_CHALLENGE_RESPONSE
                        : PASSWORD_CHALLENGE_RESPONSE,
                ];
                if (flow === "mfa") {
                    bodies.push(
                        EMAIL_MFA_REQUIRED_RESPONSE,
                        EMAIL_MFA_CHALLENGE_RESPONSE,
                        MFA_VERIFY_RESPONSE
                    );
                } else if (flow === "jit") {
                    bodies.push(
                        EMAIL_REGISTRATION_REQUIRED_RESPONSE,
                        EMAIL_REGISTRATION_ACTIVATION_RESPONSE,
                        SIGN_IN_CONTINUE_RESPONSE
                    );
                } else {
                    bodies.push(SIGN_IN_CONTINUE_RESPONSE);
                }
                bodies.push(CONTINUE_RESPONSE, tokenResponse(receipt));
                for (const body of bodies) {
                    (fetch as jest.Mock).mockResolvedValueOnce(response(body));
                }
                const pending = app.signInV2(inputs);
                inputs.claims = "{}";
                const start = await pending;
                const verified =
                    flow === "oob"
                        ? await (start.state as CodeRequiredStateV2).submitCode(
                              "123456"
                          )
                        : await (
                              start.state as PasswordRequiredStateV2
                          ).submitPassword("password");
                if (flow === "mfa") {
                    const selection =
                        verified.state as AuthMethodSelectionRequiredStateV2;
                    const challenge = await selection.selectAuthMethod(
                        selection.methods[0]
                    );
                    const completed = await (
                        challenge.state as MFAVerificationRequiredStateV2
                    ).submitChallenge("123456");
                    expectCompletion(completed, receipt, bodies.length);
                } else if (flow === "jit") {
                    const selection =
                        verified.state as AuthMethodRegistrationRequiredStateV2;
                    const challenge = await selection.selectAuthMethod(
                        selection.methods[0],
                        "user@contoso.com"
                    );
                    const completed = await (
                        challenge.state as AuthMethodVerificationRequiredStateV2
                    ).submitChallenge("123456");
                    expectCompletion(completed, receipt, bodies.length);
                } else {
                    expectCompletion(verified, receipt, bodies.length);
                }
            }
        );
    });

    describe.each(["signUp", "existingAccount", "reset", "resetMfa"])(
        "V2 %s continuation",
        (flow) => {
            it.each(["-mc", "+all"])(
                "preserves targets until receipt %p is validated",
                async (receipt) => {
                    const reset = flow.startsWith("reset");
                    const bodies: unknown[] = reset
                        ? [
                              resetV2.ENTRY_RESPONSE,
                              resetV2.EMAIL_ONLY_START_RESPONSE,
                              resetV2.EMAIL_CHALLENGE_RESPONSE,
                              resetV2.VERIFY_RESPONSE,
                              resetV2.UPDATE_RESPONSE,
                              flow === "resetMfa"
                                  ? resetV2.POLL_MFA_REQUIRED_RESPONSE
                                  : resetV2.POLL_COMPLETED_RESPONSE,
                          ]
                        : [
                              signUpV2.ENTRY_RESPONSE,
                              flow === "existingAccount"
                                  ? signUpV2.SYNTHETIC_EXISTING_ACCOUNT_EMAIL_START_RESPONSE
                                  : signUpV2.START_RESPONSE,
                          ];
                    if (flow === "resetMfa") {
                        bodies.push(
                            resetV2.MFA_EMAIL_CHALLENGE_RESPONSE,
                            resetV2.MFA_VERIFY_RESPONSE
                        );
                    } else if (!reset) {
                        if (flow === "existingAccount") {
                            bodies.push(
                                signUpV2.SYNTHETIC_EXISTING_ACCOUNT_EMAIL_CHALLENGE_RESPONSE
                            );
                        }
                        bodies.push(signUpV2.ACTIVATED_CONTINUE_RESPONSE);
                    }
                    bodies.push(CONTINUE_RESPONSE, tokenResponse(receipt));
                    bodies.forEach((body) =>
                        (fetch as jest.Mock).mockResolvedValueOnce(
                            response(body)
                        )
                    );

                    const inputs = { username: "user@contoso.com", claims };
                    const pending = reset
                        ? app.resetPasswordV2(inputs)
                        : app.signUpV2(inputs);
                    inputs.claims = "{}";
                    const start = await pending;
                    if (flow === "existingAccount") {
                        if (!start.isState("existingAccountCodeRequired")) {
                            throw new Error(
                                "Expected existing account verification"
                            );
                        }
                        expectCompletion(
                            await start.state.submitCode("123456"),
                            receipt,
                            bodies.length
                        );
                        return;
                    }
                    if (!start.isState("codeRequired")) {
                        throw new Error("Expected code verification");
                    }
                    let continuation:
                        | VerifyChallengeResultV2
                        | SubmitNewPasswordResultV2 =
                        await start.state.submitCode("123456");
                    if (reset) {
                        if (!continuation.isState("newPasswordRequired")) {
                            throw new Error("Expected password reset");
                        }
                        continuation =
                            await continuation.state.submitNewPassword(
                                "password"
                            );
                        if (flow === "resetMfa") {
                            if (
                                !continuation.isState(
                                    "authMethodSelectionRequired"
                                )
                            ) {
                                throw new Error("Expected MFA selection");
                            }
                            const challenge =
                                await continuation.state.selectAuthMethod(
                                    continuation.state.methods[0]
                                );
                            if (!challenge.isState("mfaVerificationRequired")) {
                                throw new Error("Expected MFA verification");
                            }
                            continuation =
                                await challenge.state.submitChallenge("123456");
                        }
                    }
                    if (
                        !(
                            continuation.state instanceof
                            SignInContinuationStateV2
                        )
                    ) {
                        throw new Error(
                            "Expected explicit sign-in continuation"
                        );
                    }
                    expectCompletion(
                        await continuation.state.signIn(),
                        receipt,
                        bodies.length
                    );
                }
            );
        }
    );
});
