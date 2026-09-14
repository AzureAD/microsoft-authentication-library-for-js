/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import { CodeRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { NewPasswordRequiredStateV2 } from "../../../src/custom_auth/reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { CompletedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { RequestChallengeErrorV2 } from "../../../src/custom_auth/core/auth_flow/v2/error/RequestChallengeErrorV2.js";
import { VerifyChallengeErrorV2 } from "../../../src/custom_auth/core/auth_flow/v2/error/VerifyChallengeErrorV2.js";
import { SubmitNewPasswordErrorV2 } from "../../../src/custom_auth/reset_password/auth_flow/v2/error_type/SubmitNewPasswordErrorV2.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";

/*
 * End-to-end Native Auth V2 SSPR integration test. It drives the public
 * `resetPasswordV2` surface exactly as an app would (start -> method selection ->
 * challenge/code -> new password -> sign-in after reset -> completed) while
 * mocking `global.fetch`, so the whole real stack runs: FetchHttpClient ->
 * CustomAuthApiClientV2 -> FlowInteractionClientV2 -> the public states. This
 * mirrors the V1 `ResetPassword.spec.ts` integration test.
 */

// A fetch-style Response the V2 response handler can consume (status + headers.get + json).
const buildResponse = (
    body: unknown,
    status = 200,
    headers: Record<string, string> = { "x-ms-request-id": "corr-1" }
): Response =>
    ({
        status,
        headers: {
            get: (name: string) => headers[name] ?? null,
        },
        json: async () => body,
    } as unknown as Response);

// Happy-path wire responses in call order.
const ENTRY_RESPONSE = {
    continuation_token: "ct-entry",
    reset_password: "/tenant/api/v0.1/auth/resetpassword?dc=X",
};

const START_RESPONSE = {
    continuationToken: "ct-start",
    challengeContext: {
        authenticationFactor: "singleFactor",
    },
    scenario: "recovery",
    _embedded: {
        methods: [
            {
                id: "email",
                type: "email",
                hint: "u***@contoso.com",
                _links: {
                    challenge: {
                        href: "/tenant/api/v0.1/methods/email/challenge",
                    },
                },
            },
            {
                id: "password",
                type: "password",
                _links: {
                    challenge: {
                        href: "/tenant/api/v0.1/methods/password/challenge",
                    },
                },
            },
        ],
    },
    _links: {},
};

const CHALLENGE_RESPONSE = {
    continuationToken: "ct-challenge",
    action: "verify",
    codeLength: 6,
    hint: "u***@contoso.com",
    type: "email",
    _links: {
        verify: { href: "/tenant/api/v0.1/verify" },
    },
};

const SMS_METHOD = {
    id: "sms",
    type: "sms",
    hint: "+*** *******11",
    _links: {
        challenge: {
            href: "/tenant/api/v0.1/methods/sms/challenge",
        },
    },
};

const SMS_CHALLENGE_RESPONSE = {
    continuationToken: "ct-risk",
    state: "interactionRequired",
    action: "riskverify",
    _links: {
        riskverify: {
            href: "/tenant/api/v1.0-internal/risk/phone/verify",
        },
    },
};

const SMS_RISK_VERIFY_RESPONSE = {
    continuationToken: "ct-sms-verify",
    state: "interactionRequired",
    action: "verify",
    scenario: "recovery",
    id: "sms",
    type: "sms",
    hint: "+*** *******11",
    payload: { codeLength: 6 },
    _links: {
        verify: { href: "/tenant/api/v1.0-internal/sms/verify" },
        resend: { href: "/tenant/api/v1.0-internal/sms/challenge" },
    },
};

const VERIFY_RESPONSE = {
    continuationToken: "ct-verify",
    action: "update",
    _links: { update: { href: "/tenant/api/v0.1/update" } },
};

const UPDATE_RESPONSE = {
    continuationToken: "ct-update",
    _links: { poll: { href: "/tenant/api/v0.1/poll" } },
};

const POLL_COMPLETED_RESPONSE = {
    state: "continue",
    continuationToken: "ct-poll",
    _links: { continue: { href: "/tenant/api/v0.1/continue" } },
};

const CONTINUE_RESPONSE = { code: "auth-code-1" };

describe("Reset password V2 (SSPR)", () => {
    let app: CustomAuthPublicClientApplication;

    beforeEach(async () => {
        app = (await CustomAuthPublicClientApplication.create(
            customAuthConfig
        )) as CustomAuthPublicClientApplication;

        global.fetch = jest.fn(); // Mock the fetch API
    });

    afterEach(() => {
        const activeUser = app.getAllAccounts();
        if (activeUser.length > 0) {
            app.clearCache();
        }

        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        if (
            controller &&
            controller["eventHandler"] &&
            controller["eventHandler"]["broadcastChannel"]
        ) {
            controller["eventHandler"]["broadcastChannel"].close();
        }

        jest.clearAllMocks();
    });

    // Drive start -> method selection and return the method-selection state.
    const startToMethodSelection =
        async (): Promise<AuthMethodSelectionRequiredStateV2> => {
            const startResult = await app.resetPasswordV2({
                username: "user@contoso.com",
            });

            expect(startResult.isFailed()).toBe(false);
            expect(startResult.isState("authMethodSelectionRequired")).toBe(
                true
            );
            expect(startResult.state).toBeInstanceOf(
                AuthMethodSelectionRequiredStateV2
            );

            return startResult.state as AuthMethodSelectionRequiredStateV2;
        };

    it("automatically challenges the only available method", async () => {
        const singleMethodStartResponse = {
            ...START_RESPONSE,
            _embedded: {
                methods: [START_RESPONSE._embedded.methods[0]],
            },
        };
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(singleMethodStartResponse))
            .mockResolvedValueOnce(buildResponse(CHALLENGE_RESPONSE));

        const result = await app.resetPasswordV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(false);
        expect(result.isState("codeRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(CodeRequiredStateV2);

        const codeState = result.state as CodeRequiredStateV2;
        expect(codeState.method?.id).toBe("email");
        expect(codeState.channel).toBe("email");
        expect(fetch as jest.Mock).toHaveBeenCalledTimes(3);
    });

    it("resets the password with SMS as the first factor", async () => {
        const smsStartResponse = {
            ...START_RESPONSE,
            _embedded: {
                methods: [START_RESPONSE._embedded.methods[0], SMS_METHOD],
            },
        };
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(smsStartResponse))
            .mockResolvedValueOnce(buildResponse(SMS_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SMS_RISK_VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(POLL_COMPLETED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const methodState = await startToMethodSelection();
        const smsMethod = methodState.methods.find(
            (method) => method.type === "sms"
        );
        if (!smsMethod) {
            throw new Error("Expected an SMS password-reset method.");
        }

        const challengeResult = await methodState.requestChallenge(smsMethod);
        expect(challengeResult.isState("codeRequired")).toBe(true);

        const codeState =
            challengeResult.state as CodeRequiredStateV2;
        expect(codeState.channel).toBe("sms");
        expect(codeState.sentTo).toBe("+*** *******11");
        expect(codeState.codeLength).toBe(6);

        const verifyResult = await codeState.submitCode("123456");
        const passwordState = verifyResult.state as NewPasswordRequiredStateV2;
        const submitResult = await passwordState.submitNewPassword(
            "N3wP@ssw0rd!"
        );
        const signInState = submitResult.state as SignInContinuationStateV2;
        const signInResult = await signInState.signIn();

        expect(signInResult.isState("completed")).toBe(true);
        expect(fetch as jest.Mock).toHaveBeenCalledTimes(9);
        expect(String((fetch as jest.Mock).mock.calls[3][0])).toContain(
            "/risk/phone/verify"
        );
        expect(String((fetch as jest.Mock).mock.calls[4][0])).toContain(
            "/sms/verify"
        );
    });

    it("appends OIDC scopes and caches the ID token when the app requests only an API scope", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE)) // 1. authorize-challenge entry
            .mockResolvedValueOnce(buildResponse(START_RESPONSE)) // 2. resetpassword start
            .mockResolvedValueOnce(buildResponse(CHALLENGE_RESPONSE)) // 3. challenge (send code)
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE)) // 4. verify code
            .mockResolvedValueOnce(buildResponse(UPDATE_RESPONSE)) // 5. submit new password (PUT)
            .mockResolvedValueOnce(buildResponse(POLL_COMPLETED_RESPONSE)) // 6. poll -> completed
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE)) // 7. authorize-challenge continue
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse)); // 8. token

        const methodState = await startToMethodSelection();

        expect(methodState.methods).toHaveLength(2);
        expect(methodState.methods[0].type).toBe("email");

        const challengeResult = await methodState.requestChallenge(
            methodState.methods[0]
        );
        expect(challengeResult.isFailed()).toBe(false);
        expect(challengeResult.state).toBeInstanceOf(
            CodeRequiredStateV2
        );

        const codeState =
            challengeResult.state as CodeRequiredStateV2;
        const verifyResult = await codeState.submitCode("123456");
        expect(verifyResult.isFailed()).toBe(false);
        expect(verifyResult.state).toBeInstanceOf(NewPasswordRequiredStateV2);

        const passwordState = verifyResult.state as NewPasswordRequiredStateV2;
        const submitResult = await passwordState.submitNewPassword(
            "N3wP@ssw0rd!"
        );
        expect(submitResult.isFailed()).toBe(false);
        expect(submitResult.state).toBeInstanceOf(SignInContinuationStateV2);

        const signInState = submitResult.state as SignInContinuationStateV2;
        const signInResult = await signInState.signIn({
            scopes: ["User.Read"],
            claims: '{"id_token":{}}',
        });
        expect(signInResult.isFailed()).toBe(false);
        expect(signInResult.isState("completed")).toBe(true);
        expect(signInResult.state).toBeInstanceOf(CompletedStateV2);
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual(
            TestServerTokenResponse.id_token
        );

        // Entry + start + challenge + verify + update + poll + continue + token.
        expect(fetch as jest.Mock).toHaveBeenCalledTimes(8);
        const tokenRequest = (fetch as jest.Mock).mock.calls[7][1];
        expect(tokenRequest.body).toBeInstanceOf(URLSearchParams);
        expect((tokenRequest.body as URLSearchParams).get("scope")).toBe(
            "User.Read openid profile offline_access"
        );
        expect((tokenRequest.body as URLSearchParams).has("claims")).toBe(
            false
        );
    });

    it("surfaces an invalid-code failure while awaiting a valid code", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidGrant",
                            message: "AADSTS50181: Unable to validate the otp.",
                            innerError: { code: "invalidOneTimeCode" },
                        },
                    },
                    400
                )
            );

        const methodState = await startToMethodSelection();
        const challengeResult = await methodState.requestChallenge(
            methodState.methods[0]
        );
        const codeState =
            challengeResult.state as CodeRequiredStateV2;

        const verifyResult = await codeState.submitCode("000000");

        expect(verifyResult.isFailed()).toBe(true);
        expect(verifyResult.error).toBeInstanceOf(VerifyChallengeErrorV2);
        expect(verifyResult.error?.isInvalidCode()).toBe(true);
    });

    it("surfaces an invalid-password failure while awaiting a valid password", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(VERIFY_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS120002: New password doesn't meet complexity requirements.",
                            innerError: { code: "passwordTooWeak" },
                        },
                    },
                    400
                )
            );

        const methodState = await startToMethodSelection();
        const challengeResult = await methodState.requestChallenge(
            methodState.methods[0]
        );
        const codeState =
            challengeResult.state as CodeRequiredStateV2;
        const verifyResult = await codeState.submitCode("123456");
        const passwordState = verifyResult.state as NewPasswordRequiredStateV2;

        const submitResult = await passwordState.submitNewPassword("weak");

        expect(submitResult.isFailed()).toBe(true);
        expect(submitResult.error).toBeInstanceOf(SubmitNewPasswordErrorV2);
        expect(submitResult.error?.isInvalidPassword()).toBe(true);
    });

    it("surfaces a browser-required failure when the server asks for web fallback", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({ state: "webFallbackRequired" })
            );

        const methodState = await startToMethodSelection();

        const challengeResult = await methodState.requestChallenge(
            methodState.methods[0]
        );

        expect(challengeResult.isFailed()).toBe(true);
        expect(challengeResult.error).toBeInstanceOf(RequestChallengeErrorV2);
        expect(challengeResult.error?.isBrowserRequired()).toBe(true);
    });

    it("rejects a password challenge for password reset", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    ...CHALLENGE_RESPONSE,
                    type: "password",
                })
            );

        const methodState = await startToMethodSelection();
        const challengeResult = await methodState.requestChallenge(
            methodState.methods[0]
        );

        expect(challengeResult.isFailed()).toBe(true);
        expect(challengeResult.error?.errorData.error).toBe(
            UNSUPPORTED_FLOW_TRANSITION
        );
    });
});
