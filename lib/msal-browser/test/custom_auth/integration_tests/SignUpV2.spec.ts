/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { CodeRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { CompletedStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/CompletedStateV2.js";
import { AttributesRequiredStateV2 } from "../../../src/custom_auth/sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { SignUpPasswordRequiredStateV2 } from "../../../src/custom_auth/sign_up/auth_flow/v2/state/SignUpPasswordRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../src/custom_auth/sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type { SignUpInputsV2 } from "../../../src/custom_auth/CustomAuthActionInputs.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { AuthFlowErrorV2 } from "../../../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import {
    ACTIVATED_CONTINUE_RESPONSE,
    CONTINUE_RESPONSE,
    ENROLL_ACTIVATION_RESPONSE,
    ENROLL_REQUIRED_RESPONSE,
    ENTRY_RESPONSE,
    START_RESPONSE,
    SUBMIT_ATTRIBUTES_RESPONSE,
} from "./SignUpV2Constants.js";

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

describe("Sign-up V2 entry", () => {
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

    it.each([
        ["undefined", undefined],
        ["null", null],
        ["empty", ""],
    ])(
        "rejects an explicitly supplied %s password before networking",
        async (_, password) => {
            const result = await app.signUpV2({
                username: "user@contoso.com",
                password: password as unknown as string,
            });

            expect(result.isFailed()).toBe(true);
            expect(result.error?.isInvalidInput()).toBe(true);
            expect(fetch).not.toHaveBeenCalled();
        }
    );

    it("rejects malformed claims without sending a request", async () => {
        const result = await app.signUpV2({
            username: "user@contoso.com",
            claims: "not-json",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects malformed scopes without sending a request", async () => {
        const result = await app.signUpV2({
            username: "user@contoso.com",
            scopes: "User.Read" as unknown as string[],
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(true);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("starts sign-up, submits initial data, and returns email code required", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE));

        const result = await app.signUpV2({
            username: "user@contoso.com",
            password: "valid-password",
            attributes: {
                displayName: "Test User",
                Email: "wrong@contoso.com",
                PASSWORD: "wrong-password",
            },
            scopes: ["openid", "User.Read"],
            claims: '{"id_token":{}}',
        });

        expect(result.isFailed()).toBe(false);
        expect(result.isState("codeRequired")).toBe(true);
        expect(result.state).toBeInstanceOf(CodeRequiredStateV2);
        expect(result.scenario).toBe("signUp");

        if (result.isState("codeRequired")) {
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
                signUp: {
                    passwordWasSupplied: true,
                },
            });
        }

        expect(fetch).toHaveBeenCalledTimes(3);

        const [, entryOptions] = (fetch as jest.Mock).mock.calls[0];
        const entryBody = new URLSearchParams(entryOptions.body);
        expect(entryBody.get("client_id")).toBe(customAuthConfig.auth.clientId);
        expect(entryBody.get("scope")).toBe(
            "openid User.Read profile offline_access"
        );
        expect(entryBody.get("claims")).toBe('{"id_token":{}}');

        const [, startOptions] = (fetch as jest.Mock).mock.calls[1];
        expect(JSON.parse(startOptions.body)).toEqual({
            continuationToken: "ct-entry",
        });
        expect(startOptions.body).not.toContain("claims");

        const [, submitOptions] = (fetch as jest.Mock).mock.calls[2];
        expect(JSON.parse(submitOptions.body)).toEqual({
            continuationToken: "ct-start",
            attributes: {
                displayName: "Test User",
                email: "user@contoso.com",
                password: "valid-password",
            },
        });
        expect(submitOptions.body).not.toContain("claims");
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
                password: "valid-password",
            },
            expectedAttributes: {
                email: "user@contoso.com",
                password: "valid-password",
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

    it("rejects enrollment before verification or additional attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            password: "valid-password",
            scopes: ["User.Read"],
        });

        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error?.errorData).toMatchObject({
            error: "unsupported_flow_transition",
        });
        expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("registers after additional attributes without code verification", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-attributes",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "jobTitle",
                            inputType: "text",
                            required: true,
                        },
                    ],
                    _links: {
                        submitAttributes: {
                            href: "/tenant/api/v0.1/signup/submitattributes",
                        },
                    },
                })
            )
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_ACTIVATION_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            password: "valid-password",
            attributes: { givenName: "Test" },
        });
        if (!startResult.isState("attributesRequired")) {
            throw new Error("Expected more attributes before verification.");
        }

        const registrationResult = await startResult.state.submitAttributes({
            jobTitle: "Engineer",
        });
        if (!registrationResult.isState("authMethodRegistrationRequired")) {
            throw new Error(
                "Expected registration after additional attributes."
            );
        }

        const activationResult =
            await registrationResult.state.enrollAuthMethod(
                registrationResult.state.methods[1],
                "user@contoso.com"
            );
        if (!activationResult.isState("authMethodVerificationRequired")) {
            throw new Error("Expected activation challenge.");
        }
        const completedResult = await activationResult.state.submitChallenge(
            "123456"
        );

        expect(completedResult.isState("completed")).toBe(true);
        const requests = (fetch as jest.Mock).mock.calls;
        expect(requests).toHaveLength(8);
        expect(JSON.parse(requests[2][1].body)).toMatchObject({
            attributes: {
                email: "user@contoso.com",
                password: "valid-password",
                givenName: "Test",
            },
        });
        expect(JSON.parse(requests[3][1].body)).toEqual({
            continuationToken: "ct-attributes",
            attributes: { jobTitle: "Engineer" },
        });
        expect(
            requests.some(([url]: [string]) =>
                String(url).includes("/email/verify")
            )
        ).toBe(false);
    });

    it("registers after sign-up code verification without repeating that code", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_ACTIVATION_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            password: "valid-password",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected sign-up email-code challenge.");
        }

        const registrationResult = await startResult.state.submitCode(
            "12345678"
        );
        if (!registrationResult.isState("authMethodRegistrationRequired")) {
            throw new Error("Expected registration after code verification.");
        }
        const activationResult =
            await registrationResult.state.enrollAuthMethod(
                registrationResult.state.methods[1],
                "user@contoso.com"
            );
        if (!activationResult.isState("authMethodVerificationRequired")) {
            throw new Error("Expected activation challenge.");
        }

        const completedResult = await activationResult.state.submitChallenge(
            "123456"
        );
        expect(completedResult.isState("completed")).toBe(true);
        expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(fetch).toHaveBeenCalledTimes(8);
        expect(
            ((fetch as jest.Mock).mock.calls[6][1].body as URLSearchParams).get(
                "continuation_token"
            )
        ).toBe("ct-activated");
    });

    it.each(["attributes", "password"] as const)(
        "registers after deferred %s submission and completes sign-up",
        async (submission) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(SUBMIT_ATTRIBUTES_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse({
                        continuationToken: "ct-attributes",
                        state: "interactionRequired",
                        action: "collectAttributes",
                        attributes: [
                            ...(submission === "password"
                                ? [
                                      {
                                          attributeId: "password",
                                          inputType: "password",
                                          required: true,
                                      },
                                  ]
                                : []),
                            {
                                attributeId: "jobTitle",
                                inputType: "text",
                                required: true,
                            },
                        ],
                        _links: {
                            submitAttributes: {
                                href: "/tenant/api/v0.1/signup/submitattributes",
                            },
                        },
                    })
                )
                .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(ENROLL_ACTIVATION_RESPONSE)
                )
                .mockResolvedValueOnce(
                    buildResponse(ACTIVATED_CONTINUE_RESPONSE)
                )
                .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
                .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                ...(submission === "attributes"
                    ? { password: "valid-password" }
                    : {}),
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected sign-up email-code challenge.");
            }

            const verifyResult = await startResult.state.submitCode("12345678");
            const registrationResult =
                submission === "attributes" &&
                verifyResult.isState("attributesRequired")
                    ? await verifyResult.state.submitAttributes({
                          jobTitle: "Engineer",
                      })
                    : submission === "password" &&
                      verifyResult.isState("passwordRequired")
                    ? await verifyResult.state.submitPassword(
                          "valid-password",
                          { jobTitle: "Engineer" }
                      )
                    : undefined;
            if (
                !registrationResult?.isState("authMethodRegistrationRequired")
            ) {
                throw new Error(
                    "Expected registration after deferred attributes."
                );
            }

            const activationResult =
                await registrationResult.state.enrollAuthMethod(
                    registrationResult.state.methods[1],
                    "user@contoso.com"
                );
            if (!activationResult.isState("authMethodVerificationRequired")) {
                throw new Error("Expected activation challenge.");
            }
            const completedResult =
                await activationResult.state.submitChallenge("123456");

            expect(completedResult.isState("completed")).toBe(true);
            expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
            const requests = (fetch as jest.Mock).mock.calls;
            expect(requests).toHaveLength(9);
            expect(JSON.parse(requests[4][1].body)).toMatchObject({
                continuationToken: "ct-attributes",
                attributes: {
                    jobTitle: "Engineer",
                    ...(submission === "password"
                        ? { password: "valid-password" }
                        : {}),
                },
            });
            expect(
                (requests[7][1].body as URLSearchParams).get(
                    "continuation_token"
                )
            ).toBe("ct-activated");
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
        expect(result.error?.isUserAlreadyExists()).toBe(true);
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

    it("maps an upfront password policy violation to invalid password", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(
                    {
                        error: {
                            code: "invalidRequest",
                            message:
                                "AADSTS1002027: Some of the collected attributes were invalid.",
                            correlationId: "corr-password-policy",
                            innerError: {
                                code: "attributeValidationError",
                                details: [
                                    {
                                        attributeIds: ["password"],
                                        code: "passwordPolicyViolation",
                                        message:
                                            "The password does not meet the requirements.",
                                    },
                                ],
                            },
                        },
                    },
                    400
                )
            );

        const result = await app.signUpV2({
            username: "user@contoso.com",
            password: "weak",
        });

        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isInvalidPassword()).toBe(true);
        expect(result.error?.correlationId).toBe("corr-password-policy");
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

        expect(startResult.isState("codeRequired")).toBe(true);
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");

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
                "valid-password",
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
                password: "valid-password",
            },
        });
    });

    it("returns required and invalid attribute ids after partial submission", async () => {
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
                                    {
                                        attributeIds: ["city"],
                                        code: "attributeValidationFailed",
                                        message: "Enter a valid value.",
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
            password: "valid-password",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
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
        expect(submitResult.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(submitResult.error?.isMissingRequiredAttributes()).toBe(true);
        expect(submitResult.error?.requiredAttributes).toEqual(["jobTitle"]);
        expect(submitResult.error?.invalidAttributes).toEqual(["city"]);

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
            password: "valid-password",
        });

        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");

        expect(verifyResult.isState("signInContinuation")).toBe(true);
        expect(verifyResult.state).toBeInstanceOf(SignInContinuationStateV2);
        expect(verifyResult.scenario).toBe("signUp");
        if (verifyResult.isState("signInContinuation")) {
            expect(
                verifyResult.state["stateParameters"].continuationState
            ).toEqual({
                continuationToken: "ct-verify",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {},
            });
        }
    });

    it("completes sign-up after initial password and deferred required attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-attributes",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "givenName",
                            inputType: "text",
                            required: true,
                        },
                        {
                            attributeId: "username",
                            inputType: "text",
                            required: true,
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
            )
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            password: "valid-password",
            scopes: ["User.Read"],
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("attributesRequired")) {
            throw new Error("Expected attributes required state.");
        }

        const attributesResult = await verifyResult.state.submitAttributes({
            givenName: "Test",
            username: "test-user",
        });
        if (!attributesResult.isState("signInContinuation")) {
            throw new Error("Expected sign-in continuation state.");
        }

        const completedResult = await attributesResult.state.signIn();

        expect(completedResult.isState("completed")).toBe(true);
        expect(completedResult.state).toBeInstanceOf(CompletedStateV2);
        expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[4][1].body)).toEqual({
            continuationToken: "ct-attributes",
            attributes: {
                givenName: "Test",
                username: "test-user",
            },
        });
        expect(fetch).toHaveBeenCalledTimes(7);
    });

    it("completes sign-up after deferred password and required attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-password",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
                        },
                        {
                            attributeId: "givenName",
                            inputType: "text",
                            required: true,
                        },
                        {
                            attributeId: "username",
                            inputType: "text",
                            required: true,
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
            )
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("passwordRequired")) {
            throw new Error("Expected password required state.");
        }

        const passwordResult = await verifyResult.state.submitPassword(
            "valid-password",
            {
                givenName: "Test",
                username: "test-user",
            }
        );
        if (!passwordResult.isState("signInContinuation")) {
            throw new Error("Expected sign-in continuation state.");
        }

        const completedResult = await passwordResult.state.signIn();

        expect(completedResult.isState("completed")).toBe(true);
        expect(completedResult.state).toBeInstanceOf(CompletedStateV2);
        expect(completedResult.data).toBeInstanceOf(CustomAuthAccountData);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[4][1].body)).toEqual({
            continuationToken: "ct-password",
            attributes: {
                givenName: "Test",
                username: "test-user",
                password: "valid-password",
            },
        });
        expect(fetch).toHaveBeenCalledTimes(7);
    });

    it("maps a deferred password policy violation to invalid password", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(SUBMIT_ATTRIBUTES_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-password",
                    state: "interactionRequired",
                    action: "collectAttributes",
                    attributes: [
                        {
                            attributeId: "password",
                            inputType: "password",
                            required: true,
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
                            message:
                                "AADSTS1002027: Some of the collected attributes were invalid.",
                            correlationId: "corr-password-policy",
                            innerError: {
                                code: "attributeValidationError",
                                details: [
                                    {
                                        attributeIds: ["password"],
                                        code: "passwordPolicyViolation",
                                        message:
                                            "The password does not meet the requirements.",
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
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("passwordRequired")) {
            throw new Error("Expected password required state.");
        }

        const passwordResult = await verifyResult.state.submitPassword("weak");

        expect(passwordResult.isFailed()).toBe(true);
        expect(passwordResult.error?.isInvalidPassword()).toBe(true);
        expect(passwordResult.error?.correlationId).toBe(
            "corr-password-policy"
        );
    });
});
