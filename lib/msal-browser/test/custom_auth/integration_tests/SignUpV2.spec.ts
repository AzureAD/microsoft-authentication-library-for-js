/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { AttributesRequiredStateV2 } from "../../../src/custom_auth/sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { SignUpPasswordRequiredStateV2 } from "../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpPasswordRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type { SignUpInputsV2 } from "../../../src/custom_auth/CustomAuthActionInputs.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";

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
    error: "InsufficientAuthorization",
    error_description: "No authenticated credentials found in request.",
    continuation_token: "ct-entry",
    sign_up: "/tenant/api/v0.1/signup/start",
};

const START_RESPONSE = {
    continuationToken: "ct-start",
    state: "interactionRequired",
    action: "collectAttributes",
    attributes: [
        {
            attributeId: "email",
            inputType: "text",
            required: true,
            canChange: true,
            label: "Email Address",
            regex: "^.*",
        },
    ],
    _links: {
        submitAttributes: {
            href: "/tenant/api/v0.1/signup/submitattributes",
            name: "submitAttributes",
        },
    },
};

const SUBMIT_ATTRIBUTES_RESPONSE = {
    continuationToken: "ct-challenge",
    state: "interactionRequired",
    action: "verify",
    id: "email-1",
    codeLength: 8,
    hint: "u***@contoso.com",
    type: "email",
    _links: {
        verify: { href: "/tenant/api/v0.1/email/verify" },
        resend: { href: "/tenant/api/v0.1/email/resend" },
    },
};

describe("Sign-up V2 entry", () => {
    let app: CustomAuthPublicClientApplication;

    beforeEach(async () => {
        app = (await CustomAuthPublicClientApplication.create(
            customAuthConfig
        )) as CustomAuthPublicClientApplication;
        global.fetch = jest.fn();
    });

    afterEach(() => {
        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        controller["eventHandler"]["broadcastChannel"]?.close();
        jest.clearAllMocks();
    });

    it("starts sign-up, submits initial data, and returns email code required", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE));

        const result = await app.signUpV2({
            username: "user@contoso.com",
            password: "P@ssword1!",
            attributes: {
                displayName: "Test User",
                email: "wrong@contoso.com",
                password: "wrong-password",
            },
            scopes: ["openid", "User.Read"],
            claims: '{"id_token":{}}',
        });

        expect(result.isFailed()).toBe(false);
        expect(result.isState("challengeVerificationRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(
            ChallengeVerificationRequiredStateV2
        );
        expect(result.scenario).toBe("signUp");

        if (result.isState("challengeVerificationRequired")) {
            expect(result.state.method).toBeUndefined();
            expect(result.state.sentTo).toBe("u***@contoso.com");
            expect(result.state.codeLength).toBe(8);
            expect(
                result.state["stateParameters"].continuationState
            ).toMatchObject({
                continuationToken: "ct-challenge",
                links: {
                    verify: "/tenant/api/v0.1/email/verify",
                    resend: "/tenant/api/v0.1/email/resend",
                },
                tokenRequest: {
                    scopes: ["openid", "User.Read"],
                },
                signUp: {
                    passwordWasSupplied: true,
                },
            });
        }

        expect(fetch).toHaveBeenCalledTimes(3);

        const [, entryOptions] = (fetch as jest.Mock).mock.calls[0];
        const entryBody = new URLSearchParams(entryOptions.body);
        expect(entryBody.get("client_id")).toBe(customAuthConfig.auth.clientId);
        expect(entryBody.get("scope")).toBe("openid User.Read");

        const [, startOptions] = (fetch as jest.Mock).mock.calls[1];
        expect(JSON.parse(startOptions.body)).toEqual({
            continuationToken: "ct-entry",
        });

        const [, submitOptions] = (fetch as jest.Mock).mock.calls[2];
        expect(JSON.parse(submitOptions.body)).toEqual({
            continuationToken: "ct-start",
            attributes: {
                displayName: "Test User",
                email: "user@contoso.com",
                password: "P@ssword1!",
            },
        });
    });

    it.each([
        {
            name: "email only",
            inputs: {},
            expectedAttributes: {
                email: "user@contoso.com",
            },
        },
        {
            name: "email and password",
            inputs: {
                password: "P@ssword1!",
            },
            expectedAttributes: {
                email: "user@contoso.com",
                password: "P@ssword1!",
            },
        },
        {
            name: "email and full profile",
            inputs: {
                attributes: {
                    givenName: "Test",
                    surname: "User",
                },
            },
            expectedAttributes: {
                email: "user@contoso.com",
                givenName: "Test",
                surname: "User",
            },
        },
        {
            name: "email and partial profile",
            inputs: {
                attributes: {
                    city: "Redmond",
                },
            },
            expectedAttributes: {
                email: "user@contoso.com",
                city: "Redmond",
            },
        },
        {
            name: "email and username alias",
            inputs: {
                attributes: {
                    username: "test-user",
                },
            },
            expectedAttributes: {
                email: "user@contoso.com",
                username: "test-user",
            },
        },
    ])(
        "submits the initial $name combination once",
        async ({ inputs, expectedAttributes }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(SUBMIT_ATTRIBUTES_RESPONSE)
                );

            await app.signUpV2({
                username: "user@contoso.com",
                ...(inputs as Omit<SignUpInputsV2, "username">),
            });

            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[2][1].body)
            ).toEqual({
                continuationToken: "ct-start",
                attributes: expectedAttributes,
            });
        }
    );

    it("surfaces an existing-email error from initial attribute submission", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS1003037: An account with this email address may already exist.",
                            correlationId: "corr-existing",
                            innerError: {
                                details: [
                                    {
                                        attributeIds: ["email"],
                                        code: "userAlreadyExists",
                                        message:
                                            "An account with this identifier already exists.",
                                    },
                                ],
                            },
                        },
                    },
                    400
                )
            );

        const result = await app.signUpV2({
            username: "existing@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.correlationId).toBe("corr-existing");
        expect(result.error?.errorData).toMatchObject({
            error: "invalidRequest",
            attributeValidationDetails: [
                {
                    attributeIds: ["email"],
                    code: "userAlreadyExists",
                    message: "An account with this identifier already exists.",
                },
            ],
        });
    });

    it("surfaces an initial attribute-submission server error as a general sign-up error", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "serverError",
                            message:
                                "AADSTS50000: There was an error issuing a token or an issue with our sign-in service.",
                            traceId: "trace-server",
                            correlationId: "corr-server",
                        },
                    },
                    500
                )
            );

        const result = await app.signUpV2({
            username: "user@contoso.com",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.errorData).toMatchObject({
            error: "serverError",
            errorDescription:
                "AADSTS50000: There was an error issuing a token or an issue with our sign-in service.",
            correlationId: "corr-server",
            traceId: "trace-server",
        });
    });

    it("returns password required when password is missing after code verification", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                            canChange: true,
                            label: "Password",
                            confirmationInput: "retype",
                        },
                        {
                            attributeId: "jobTitle",
                            inputType: "text",
                            required: true,
                            canChange: true,
                            label: "Job Title",
                        },
                        {
                            attributeId: "city",
                            inputType: "text",
                            required: false,
                            canChange: true,
                            label: "City",
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-complete",
                    state: "continue",
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
        });

        expect(startResult.isState("challengeVerificationRequired")).toBe(true);
        if (!startResult.isState("challengeVerificationRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.verifyChallenge(
            "12345678"
        );

        expect(verifyResult.isState("passwordRequired")).toBe(true);
        expect(verifyResult.state).toBeInstanceOf(
            SignUpPasswordRequiredStateV2
        );
        if (verifyResult.isState("passwordRequired")) {
            expect(verifyResult.state.requiredPasswordAttribute).toEqual({
                attributeId: "password",
                inputType: "password",
                required: true,
                canChange: true,
                label: "Password",
                confirmationInput: "retype",
            });
            expect(verifyResult.state.attributes).toEqual([
                {
                    attributeId: "jobTitle",
                    inputType: "text",
                    required: true,
                    canChange: true,
                    label: "Job Title",
                },
                {
                    attributeId: "city",
                    inputType: "text",
                    required: false,
                    canChange: true,
                    label: "City",
                },
            ]);

            const submitResult = await verifyResult.state.submitPassword(
                "P@ssword1!",
                {
                    jobTitle: "Engineer",
                }
            );
            expect(submitResult.isState("signInContinuation")).toBe(true);
        }

        const [, verifyOptions] = (fetch as jest.Mock).mock.calls[3];
        expect(JSON.parse(verifyOptions.body)).toEqual({
            continuationToken: "ct-challenge",
            otp: "12345678",
        });

        const [, attributesOptions] = (fetch as jest.Mock).mock.calls[4];
        expect(JSON.parse(attributesOptions.body)).toEqual({
            continuationToken: "ct-verify",
            attributes: {
                jobTitle: "Engineer",
                password: "P@ssword1!",
            },
        });
    });

    it("submits partial attributes and returns the server missing-attribute error", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-profile",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "jobTitle",
                            inputType: "text",
                            required: true,
                        },
                        {
                            attributeId: "city",
                            inputType: "text",
                            required: false,
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message: "Attribute validation failed.",
                            correlationId: "corr-attributes",
                            innerError: {
                                code: "attributeValidationError",
                                details: [
                                    {
                                        attributeIds: ["jobTitle"],
                                        code: "attributeRequired",
                                        message:
                                            "Attribute 'jobTitle' is required.",
                                    },
                                ],
                            },
                        },
                    },
                    400
                )
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            password: "P@ssword1!",
        });
        if (!startResult.isState("challengeVerificationRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.verifyChallenge(
            "12345678"
        );
        expect(verifyResult.state).toBeInstanceOf(AttributesRequiredStateV2);
        if (!verifyResult.isState("attributesRequired")) {
            throw new Error("Expected attributes required state.");
        }
        expect(verifyResult.state.attributes).toEqual([
            {
                attributeId: "jobTitle",
                inputType: "text",
                required: true,
            },
            {
                attributeId: "city",
                inputType: "text",
                required: false,
            },
        ]);

        const submitResult = await verifyResult.state.submitAttributes({
            city: "Redmond",
        });
        expect(submitResult.isFailed()).toBe(true);
        expect(submitResult.error?.isMissingRequiredAttributes()).toBe(true);

        expect(JSON.parse((fetch as jest.Mock).mock.calls[4][1].body)).toEqual({
            continuationToken: "ct-profile",
            attributes: {
                city: "Redmond",
            },
        });
    });

    it("returns sign-in continuation when code verification completes sign-up", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    state: "continue",
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            password: "P@ssword1!",
        });

        if (!startResult.isState("challengeVerificationRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.verifyChallenge(
            "12345678"
        );

        expect(verifyResult.isState("signInContinuation")).toBe(true);
        expect(verifyResult.state).toBeInstanceOf(SignInContinuationStateV2);
        expect(verifyResult.scenario).toBe("signUp");
        if (verifyResult.isState("signInContinuation")) {
            expect(
                verifyResult.state["stateParameters"].continuationState
            ).toEqual({
                continuationToken: "ct-verify",
                scenario: "signUp",
                links: {},
                tokenRequest: {
                    scopes: undefined,
                    claims: undefined,
                },
            });
        }
    });
});
