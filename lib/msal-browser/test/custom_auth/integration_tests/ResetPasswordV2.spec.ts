/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { AuthenticationMethodSelectionRequiredState } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredState.js";
import { ChallengeVerificationRequiredState } from "../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredState.js";
import { NewPasswordRequiredState } from "../../../src/custom_auth/core/auth_flow/v2/state/NewPasswordRequiredState.js";
import { V2SignInContinuationState } from "../../../src/custom_auth/core/auth_flow/v2/state/V2SignInContinuationState.js";
import { CompletedState } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedState.js";
import { RequestChallengeError } from "../../../src/custom_auth/core/auth_flow/v2/error/RequestChallengeError.js";
import { VerifyChallengeError } from "../../../src/custom_auth/core/auth_flow/v2/error/VerifyChallengeError.js";
import { SubmitNewPasswordError } from "../../../src/custom_auth/core/auth_flow/v2/error/SubmitNewPasswordError.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";

/*
 * End-to-end Native Auth V2 SSPR integration test. It drives the public
 * `resetPasswordV2` surface exactly as an app would (start -> method selection ->
 * challenge/code -> new password -> sign-in after reset -> completed) while
 * mocking `global.fetch`, so the whole real stack runs: FetchHttpClient ->
 * CustomAuthV2ApiClient -> V2FlowInteractionClient -> the public states. This
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
        ],
    },
    _links: {},
};

const CHALLENGE_RESPONSE = {
    continuationToken: "ct-challenge",
    codeLength: 6,
    hint: "u***@contoso.com",
    type: "email",
    _links: {
        verify: { href: "/tenant/api/v0.1/verify" },
        resend: { href: "/tenant/api/v0.1/resend" },
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
        async (): Promise<AuthenticationMethodSelectionRequiredState> => {
            const startResult = await app.resetPasswordV2({
                username: "user@contoso.com",
            });

            expect(startResult.isFailed()).toBe(false);
            expect(
                startResult.isState("authenticationMethodSelectionRequired")
            ).toBe(true);
            expect(startResult.state).toBeInstanceOf(
                AuthenticationMethodSelectionRequiredState
            );

            return startResult.state as AuthenticationMethodSelectionRequiredState;
        };

    it("resets the password and signs the user in on the happy path", async () => {
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

        // The start response advertised exactly one (email) method to select.
        expect(methodState.methods).toHaveLength(1);
        expect(methodState.methods[0].type).toBe("email");

        const challengeResult = await methodState.requestChallenge(
            methodState.methods[0]
        );
        expect(challengeResult.isFailed()).toBe(false);
        expect(challengeResult.state).toBeInstanceOf(
            ChallengeVerificationRequiredState
        );

        const codeState =
            challengeResult.state as ChallengeVerificationRequiredState;
        const verifyResult = await codeState.verifyChallenge("123456");
        expect(verifyResult.isFailed()).toBe(false);
        expect(verifyResult.state).toBeInstanceOf(NewPasswordRequiredState);

        const passwordState = verifyResult.state as NewPasswordRequiredState;
        const submitResult = await passwordState.submitNewPassword(
            "N3wP@ssw0rd!"
        );
        expect(submitResult.isFailed()).toBe(false);
        expect(submitResult.state).toBeInstanceOf(V2SignInContinuationState);

        const signInState = submitResult.state as V2SignInContinuationState;
        const signInResult = await signInState.signIn();
        expect(signInResult.isFailed()).toBe(false);
        expect(signInResult.isState("completed")).toBe(true);
        expect(signInResult.state).toBeInstanceOf(CompletedState);
        expect(signInResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(signInResult.data?.getAccount()?.idToken).toStrictEqual(
            TestServerTokenResponse.id_token
        );

        // Entry + start + challenge + verify + update + poll + continue + token.
        expect(fetch as jest.Mock).toHaveBeenCalledTimes(8);
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
            challengeResult.state as ChallengeVerificationRequiredState;

        const verifyResult = await codeState.verifyChallenge("000000");

        expect(verifyResult.isFailed()).toBe(true);
        expect(verifyResult.error).toBeInstanceOf(VerifyChallengeError);
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
            challengeResult.state as ChallengeVerificationRequiredState;
        const verifyResult = await codeState.verifyChallenge("123456");
        const passwordState = verifyResult.state as NewPasswordRequiredState;

        const submitResult = await passwordState.submitNewPassword("weak");

        expect(submitResult.isFailed()).toBe(true);
        expect(submitResult.error).toBeInstanceOf(SubmitNewPasswordError);
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
        expect(challengeResult.error).toBeInstanceOf(RequestChallengeError);
        expect(challengeResult.error?.isBrowserRequired()).toBe(true);
    });
});
