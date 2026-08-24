/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { PasswordRequiredStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/PasswordRequiredStateV2.js";
import { CompletedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { MFARequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/MFARequiredStateV2.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import {
    NO_AUTHENTICATION_METHODS,
    SIGN_IN_UNSUPPORTED,
} from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";

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

const ENTRY_RESPONSE = {
    continuation_token: "ct-entry",
    sign_in: "/tenant/api/v0.1/signin/start",
};

const START_RESPONSE = {
    continuationToken: "ct-start",
    challengeContext: {
        authenticationFactor: "singleFactor",
    },
    _embedded: {
        methods: [
            {
                id: "password-1",
                type: "password",
                _links: {
                    challenge: {
                        href: "/tenant/api/v0.1/password/challenge",
                    },
                },
            },
        ],
    },
};

const MULTI_METHOD_START_RESPONSE = {
    ...START_RESPONSE,
    _embedded: {
        methods: [
            ...START_RESPONSE._embedded.methods,
            {
                id: "other-1",
                type: "other",
                _links: {
                    challenge: {
                        href: "/tenant/api/v0.1/other/challenge",
                    },
                },
            },
        ],
    },
};

const PASSWORD_CHALLENGE_RESPONSE = {
    continuationToken: "ct-challenge",
    id: "password-1",
    type: "password",
    _links: {
        verify: { href: "/tenant/api/v0.1/password/verify" },
    },
};

const PASSWORD_VERIFY_RESPONSE = {
    continuationToken: "ct-verify",
    state: "continue",
    _links: {
        continue: { href: "/tenant/oauth2/v2.0/authorize-challenge" },
    },
};

const MFA_REQUIRED_RESPONSE = {
    continuationToken: "ct-mfa",
    state: "interactionRequired",
    action: "challenge",
    challengeContext: {
        authenticationFactor: "multiFactor",
    },
    _embedded: {
        methods: [
            {
                id: "email-mfa",
                type: "email",
                hint: "u***@contoso.com",
                _links: {
                    challenge: {
                        href: "/tenant/api/v0.1/mfa/challenge",
                    },
                },
            },
        ],
    },
};

const MFA_CHALLENGE_RESPONSE = {
    continuationToken: "ct-mfa-challenge",
    codeLength: 6,
    hint: "u***@contoso.com",
    type: "email",
    _links: {
        verify: { href: "/tenant/api/v0.1/mfa/verify" },
        resend: { href: "/tenant/api/v0.1/mfa/resend" },
    },
};

const MFA_RESEND_RESPONSE = {
    ...MFA_CHALLENGE_RESPONSE,
    continuationToken: "ct-mfa-resend",
};

const MFA_VERIFY_RESPONSE = {
    continuationToken: "ct-mfa-verify",
    state: "continue",
    _links: {
        continue: { href: "/tenant/oauth2/v2.0/authorize-challenge" },
    },
};

const CONTINUE_RESPONSE = { code: "auth-code-1" };

describe("Sign-in V2 entry", () => {
    let app: CustomAuthPublicClientApplication;

    beforeEach(async () => {
        app = (await CustomAuthPublicClientApplication.create(
            customAuthConfig
        )) as CustomAuthPublicClientApplication;
        global.fetch = jest.fn();
    });

    afterEach(() => {
        if (app.getAllAccounts().length > 0) {
            app.clearCache();
        }
        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        controller["eventHandler"]["broadcastChannel"]?.close();
        jest.clearAllMocks();
    });

    it("selects the password method and returns password-required", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MULTI_METHOD_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE));

        const result = await app.signInV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
            claims: '{"id_token":{}}',
        });

        expect(result.isFailed()).toBe(false);
        expect(result.isState("passwordRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(PasswordRequiredStateV2);
        expect(result.scenario).toBe("signIn");
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("submits a password from PasswordRequiredStateV2 and completes sign-in", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MULTI_METHOD_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signInV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
        });
        expect(startResult.isState("passwordRequired")).toBe(true);
        expect(startResult.state).toBeInstanceOf(PasswordRequiredStateV2);

        const submitResult = await (
            startResult.state as PasswordRequiredStateV2
        ).submitPassword("P@ssword1!");

        expect(submitResult.isState("completed")).toBe(true);
        expect(submitResult.state).toBeInstanceOf(CompletedStateV2);
        expect(submitResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(fetch).toHaveBeenCalledTimes(6);
    });

    it("returns MFA-required after submitting a password from PasswordRequiredStateV2", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MFA_REQUIRED_RESPONSE));

        const startResult = await app.signInV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
            claims: '{"access_token":{}}',
        });
        expect(startResult.isState("passwordRequired")).toBe(true);

        const submitResult = await (
            startResult.state as PasswordRequiredStateV2
        ).submitPassword("P@ssword1!");

        expect(submitResult.isFailed()).toBe(false);
        expect(submitResult.isState("mfaRequired")).toBe(true);
        expect(submitResult.state).toBeInstanceOf(MFARequiredStateV2);

        if (submitResult.isState("mfaRequired")) {
            expect(submitResult.state.methods).toEqual([
                {
                    id: "email-mfa",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "/tenant/api/v0.1/mfa/challenge",
                },
            ]);
        }

        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it("resends and verifies an MFA code to complete sign-in", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MFA_REQUIRED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MFA_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MFA_RESEND_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MFA_VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signInV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
            claims: '{"access_token":{}}',
        });
        const passwordResult = await (
            startResult.state as PasswordRequiredStateV2
        ).submitPassword("P@ssword1!");
        const mfaState = passwordResult.state as MFARequiredStateV2;

        const challengeResult = await mfaState.requestChallenge(
            mfaState.methods[0]
        );

        expect(challengeResult.isState("challengeVerificationRequired")).toBe(
            true
        );
        expect(challengeResult.state).toBeInstanceOf(
            ChallengeVerificationRequiredStateV2
        );

        const resendResult = await (
            challengeResult.state as ChallengeVerificationRequiredStateV2
        ).requestNewChallenge();

        expect(resendResult.isState("challengeVerificationRequired")).toBe(
            true
        );

        const completedResult = await (
            resendResult.state as ChallengeVerificationRequiredStateV2
        ).verifyChallenge("123456");

        expect(completedResult.isState("completed")).toBe(true);
        expect(completedResult.state).toBeInstanceOf(CompletedStateV2);
        expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(fetch).toHaveBeenCalledTimes(9);
    });

    it("automatically selects and submits password when multiple methods are returned", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MULTI_METHOD_START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const result = await app.signInV2({
            username: "user@contoso.com",
            password: "P@ssword1!",
        });

        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(fetch).toHaveBeenCalledTimes(6);
    });

    it("automatically submits a supplied password", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_VERIFY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const result = await app.signInV2({
            username: "user@contoso.com",
            password: "P@ssword1!",
            scopes: ["User.Read"],
        });

        expect(result.isState("completed")).toBe(true);
        expect(result.state).toBeInstanceOf(CompletedStateV2);
        expect(result.data).toBeInstanceOf(CustomAuthAccountData);
        expect(fetch).toHaveBeenCalledTimes(6);
    });

    it("returns MFA-required after automatically submitting a supplied password", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(MFA_REQUIRED_RESPONSE));

        const result = await app.signInV2({
            username: "user@contoso.com",
            password: "P@ssword1!",
            scopes: ["User.Read"],
            claims: '{"access_token":{}}',
        });

        expect(result.isFailed()).toBe(false);
        expect(result.isState("mfaRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(MFARequiredStateV2);

        if (result.isState("mfaRequired")) {
            expect(result.state.methods).toEqual([
                {
                    id: "email-mfa",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "/tenant/api/v0.1/mfa/challenge",
                },
            ]);
        }

        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it("returns an invalid-password error from automatic submission", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidGrant",
                            message:
                                "AADSTS50126: Invalid username or password.",
                            innerError: {
                                code: "invalidUserNameOrPassword",
                            },
                        },
                    },
                    400
                )
            );

        const result = await app.signInV2({
            username: "user@contoso.com",
            password: "incorrect",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidPassword()).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it("returns an invalid-password error from PasswordRequiredStateV2", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidGrant",
                            message:
                                "AADSTS50126: Invalid username or password.",
                            innerError: {
                                code: "invalidUserNameOrPassword",
                            },
                        },
                    },
                    400
                )
            );

        const startResult = await app.signInV2({
            username: "user@contoso.com",
        });
        const result = await (
            startResult.state as PasswordRequiredStateV2
        ).submitPassword("incorrect");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidPassword()).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it("rejects an empty password without verification", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(PASSWORD_CHALLENGE_RESPONSE));

        const startResult = await app.signInV2({
            username: "user@contoso.com",
        });
        const result = await (
            startResult.state as PasswordRequiredStateV2
        ).submitPassword("");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("returns invalid input without sending a request", async () => {
        const result = await app.signInV2({ username: "" });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(result.error?.isInvalidUsername()).toBe(false);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("returns invalid username when the service rejects the username", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS90100: username parameter is empty or not valid.",
                            timestamp: "2026-08-22 19:25:11Z",
                            traceId: "trace-invalid-username",
                            correlationId: "corr-invalid-username",
                        },
                    },
                    400
                )
            );

        const result = await app.signInV2({
            username: "not-an-email",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(false);
        expect(result.error?.isInvalidUsername()).toBe(true);
        expect(result.error?.isUserNotFound()).toBe(false);
    });

    it("preserves diagnostics for an invalid continuation token", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS90100: continuationToken parameter is empty or not valid.",
                            timestamp: "2026-08-22 19:25:49Z",
                            traceId: "trace-invalid-continuation",
                            correlationId: "corr-invalid-continuation",
                        },
                    },
                    400
                )
            );

        const result = await app.signInV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidUsername()).toBe(false);
        expect(result.error?.isUserNotFound()).toBe(false);
        expect(result.error?.errorData).toMatchObject({
            error: "invalidRequest",
            errorDescription:
                "AADSTS90100: continuationToken parameter is empty or not valid.",
            correlationId: "corr-invalid-continuation",
            traceId: "trace-invalid-continuation",
            timestamp: "2026-08-22 19:25:49Z",
        });
    });

    it("returns user not found when the account does not exist", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS50034: The user account does not exist in the directory.",
                            timestamp: "2026-08-22 19:26:35Z",
                            traceId: "trace-user-not-found",
                            correlationId: "corr-user-not-found",
                        },
                    },
                    400
                )
            );

        const result = await app.signInV2({
            username: "missing@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidUsername()).toBe(false);
        expect(result.error?.isUserNotFound()).toBe(true);
    });

    it("fails when the authorize-challenge response has no sign-in link", async () => {
        (fetch as jest.Mock).mockResolvedValueOnce(
            buildResponse({ continuation_token: "ct-entry" })
        );

        const result = await app.signInV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorData.error).toBe(SIGN_IN_UNSUPPORTED);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("fails when sign-in start returns no methods", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-start",
                    challengeContext: {
                        authenticationFactor: "singleFactor",
                    },
                })
            );

        const result = await app.signInV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorData.error).toBe(NO_AUTHENTICATION_METHODS);
    });

    it.each([undefined, "unknownFactor", "multiFactor"])(
        "ignores the authentication factor %s and follows the returned methods",
        async (authenticationFactor) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-start",
                        challengeContext: authenticationFactor
                            ? { authenticationFactor }
                            : undefined,
                        _embedded: START_RESPONSE._embedded,
                    })
                )
                .mockResolvedValueOnce(
                    buildResponse(PASSWORD_CHALLENGE_RESPONSE)
                );

            const result = await app.signInV2({
                username: "user@contoso.com",
            });

            expect(result.isState("passwordRequired")).toBe(true);
        }
    );
});
