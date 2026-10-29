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
import type {
    ResetPasswordInputsV2,
    SignInInputsV2,
    SignUpInputsV2,
} from "../../../src/custom_auth/index.js";
import type { FlowSignUpStartParamsV2 } from "../../../src/custom_auth/core/interaction_client/v2/parameter/FlowParamsV2.js";
import { CustomAuthAccountData } from "../../../src/custom_auth/get_account/auth_flow/CustomAuthAccountData.js";
import { AuthFlowErrorV2 } from "../../../src/custom_auth/core/auth_flow/v2/error/AuthFlowErrorV2.js";
import { UnexpectedError } from "../../../src/custom_auth/core/error/UnexpectedError.js";
import { CustomAuthApiError } from "../../../src/custom_auth/core/error/CustomAuthApiError.js";
import { customAuthConfig } from "../test_resources/CustomAuthConfig.js";
import { TestServerTokenResponse } from "../test_resources/TestConstants.js";
import {
    ACTIVATED_CONTINUE_RESPONSE,
    CONTINUE_RESPONSE,
    ENROLL_ACTIVATION_RESPONSE,
    ENROLL_REQUIRED_RESPONSE,
    ENTRY_RESPONSE,
    FLAT_USERNAME_REQUIRED_RESPONSE,
    PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
    PASSWORD_POLICY_ERROR_RESPONSE,
    START_RESPONSE,
    USERNAME_START_REQUEST,
    WEAK_PASSWORD_ERROR_RESPONSE,
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

describe("Sign-up V2 agreed contract", () => {
    it("does not accept null scopes on any public V2 entry input", () => {
        const nullableScopesAllowed: [
            null extends SignInInputsV2["scopes"] ? true : false,
            null extends ResetPasswordInputsV2["scopes"] ? true : false,
            null extends SignUpInputsV2["scopes"] ? true : false,
            null extends FlowSignUpStartParamsV2["scopes"] ? true : false
        ] = [false, false, false, false];

        expect(nullableScopesAllowed).toEqual([false, false, false, false]);
    });

    it("does not expose an upfront password on public or internal start inputs", () => {
        const publicInputHasPassword: "password" extends keyof SignUpInputsV2
            ? true
            : false = false;
        const flowInputHasPassword: "password" extends keyof FlowSignUpStartParamsV2
            ? true
            : false = false;

        expect([publicInputHasPassword, flowInputHasPassword]).toEqual([
            false,
            false,
        ]);
    });

    it.todo(
        "IT-SU-15: surfaces unknown service errors and malformed or transport failures"
    );
    it.todo(
        "IT-SU-16: preserves JIT enrollment, activation, resend, and completion"
    );
});

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

    it.each<{ label: string; password: unknown }>([
        { label: "undefined", password: undefined },
        { label: "null", password: null },
        { label: "empty", password: "" },
        { label: "nonempty", password: "ignored-password" },
        { label: "numeric", password: 42 },
        { label: "object", password: {} },
    ])(
        "ignores an unsupported $label upfront password from a runtime caller",
        async ({ password }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE));
            const inputs = {
                username: "user@contoso.com",
                password,
            };
            const result = await app.signUpV2(inputs);

            expect(result.isState("codeRequired")).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
            expect(inputs.password).toBe(password);
            if (result.isState("codeRequired")) {
                expect(
                    result.state["stateParameters"].continuationState
                ).not.toHaveProperty("password");
            }
        }
    );

    it.each([
        {
            label: "password collection",
            response: PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
            passwordRequired: true,
        },
        {
            label: "profile-only collection",
            response: FLAT_USERNAME_REQUIRED_RESPONSE,
            passwordRequired: false,
        },
    ])(
        "follows server-directed $label despite an extra runtime password",
        async ({ response, passwordRequired }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(buildResponse(response));
            const runtimeInputs = {
                username: "user@contoso.com",
                password: "ignored-password",
            };

            const startResult = await app.signUpV2(runtimeInputs);
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }
            const result = await startResult.state.submitCode("12345678");

            expect(result.isFailed()).toBe(false);
            expect(result.isState("passwordRequired")).toBe(passwordRequired);
            expect(result.isState("attributesRequired")).toBe(
                !passwordRequired
            );
            expect(fetch).toHaveBeenCalledTimes(3);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[2][1].body)
            ).toEqual({
                continuationToken: "ct-start",
                otp: "12345678",
            });
        }
    );

    it("surfaces server-requested email collection as an API failure", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    ...FLAT_USERNAME_REQUIRED_RESPONSE,
                    attributes: [{ attributeId: "Email", required: true }],
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected email verification first.");
        }

        const result = await startResult.state.submitCode("12345678");

        expect(result.isFailed()).toBe(true);
        expect(result.error?.isInvalidInput()).toBe(false);
        expect(result.error?.errorData).toBeInstanceOf(CustomAuthApiError);
        expect(result.error?.errorData.error).toBe("invalid_hal_response");
        expect(result.error?.correlationId).toBe("corr-1");
    });

    it.each(["profile", "password"])(
        "rejects email in a %s submission as invalid input without another request",
        async (collection) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
                .mockResolvedValueOnce(
                    buildResponse(
                        collection === "password"
                            ? PASSWORD_AND_PROFILE_REQUIRED_RESPONSE
                            : FLAT_USERNAME_REQUIRED_RESPONSE
                    )
                );
            const startResult = await app.signUpV2({
                username: "user@contoso.com",
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected email verification first.");
            }
            const verifyResult = await startResult.state.submitCode("12345678");
            const attributes = { eMaIl: "other@example.com" };
            const result = verifyResult.isState("passwordRequired")
                ? await verifyResult.state.submitPassword(
                      "valid-password",
                      attributes
                  )
                : verifyResult.isState("attributesRequired")
                ? await verifyResult.state.submitAttributes(attributes)
                : undefined;

            expect(result).toBeDefined();
            expect(result?.isFailed()).toBe(true);
            expect(result?.error?.isInvalidInput()).toBe(true);
            expect(result?.error?.scenario).toBe("signUp");
            expect(attributes).toEqual({ eMaIl: "other@example.com" });
            expect(fetch).toHaveBeenCalledTimes(3);
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

    it.each([
        "FlowAttributesRequiredResultV2",
        "FlowSignUpPasswordRequiredResultV2",
        "unsupported",
    ])(
        "fails when sign-up start returns an unexpected %s result",
        async (type) => {
            const correlationId = "unsupported-result-correlation";
            const controller = app[
                "customAuthController"
            ] as CustomAuthStandardController;
            jest.spyOn(controller["flowClientV2"], "signUp").mockResolvedValue({
                // @ts-expect-error Exercise an unsupported runtime result outside the start contract.
                type,
                correlationId,
                continuationState: {
                    continuationToken: "ct-unsupported",
                    scenario: "signUp",
                    scopes: [],
                    links: {},
                },
            });

            const result = await app.signUpV2({
                username: "user@contoso.com",
                correlationId,
            });

            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData).toBeInstanceOf(UnexpectedError);
            expect(result.error?.errorData).toMatchObject({
                error: "unexpected_error",
                errorDescription:
                    "Unsupported native auth V2 sign-up result type.",
                correlationId,
            });
            expect(fetch).not.toHaveBeenCalled();
        }
    );

    it("IT-SU-01: sends the email identifier as username on signup/start", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE));
        const controller = app[
            "customAuthController"
        ] as CustomAuthStandardController;
        const startSpy = jest.spyOn(controller["flowClientV2"], "signUp");

        const result = await app.signUpV2({
            username: "user@contoso.com",
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
            expect(result.state["stateParameters"].continuationState).toEqual({
                continuationToken: "ct-start",
                scenario: "signUp",
                scopes: ["openid", "User.Read", "profile", "offline_access"],
                links: {
                    verify: "/tenant/api/v0.1/email/verify",
                    resend: "/tenant/api/v0.1/email/resend",
                },
            });
        }

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(startSpy).toHaveBeenCalledWith({
            correlationId: expect.any(String),
            username: "user@contoso.com",
            scopes: ["openid", "User.Read"],
            claims: '{"id_token":{}}',
        });

        const [, entryOptions] = (fetch as jest.Mock).mock.calls[0];
        const entryBody = new URLSearchParams(entryOptions.body);
        expect(entryBody.get("client_id")).toBe(customAuthConfig.auth.clientId);
        expect(entryBody.get("scope")).toBe(
            "openid User.Read profile offline_access"
        );
        expect(entryBody.get("claims")).toBe('{"id_token":{}}');

        const [, startOptions] = (fetch as jest.Mock).mock.calls[1];
        expect(JSON.parse(startOptions.body)).toEqual(USERNAME_START_REQUEST);
        expect(startOptions.body).not.toContain("claims");

        startSpy.mockRestore();
    });

    it.each<{
        name: string;
        inputs: Omit<SignUpInputsV2, "username">;
    }>([
        {
            name: "email and full profile",
            inputs: {
                attributes: {
                    givenName: "Test",
                    surname: "User",
                },
            },
        },
        {
            name: "email and partial profile",
            inputs: {
                attributes: {
                    city: "Redmond",
                },
            },
        },
        {
            name: "email and username alias",
            inputs: {
                attributes: {
                    username: "test-user",
                },
            },
        },
    ])(
        "returns code-required without submitting upfront $name values",
        async ({ inputs }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE));

            const result = await app.signUpV2({
                username: "user@contoso.com",
                ...inputs,
            });

            expect(result.isState("codeRequired")).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
        }
    );

    it.each<SignUpInputsV2["attributes"]>([
        undefined,
        {},
        { Email: "ignored@contoso.com", PASSWORD: "ignored-password" },
    ])(
        "IT-SU-02: returns code-required without synthesizing email or submitting initial attributes (%j)",
        async (attributes) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE));

            const result = await app.signUpV2({
                username: "user@contoso.com",
                attributes,
                scopes: ["User.Read"],
                correlationId: "corr-start",
            });

            expect(result.isState("codeRequired")).toBe(true);
            expect(fetch).toHaveBeenCalledTimes(2);
            expect(
                JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)
            ).toEqual(USERNAME_START_REQUEST);
            if (!result.isState("codeRequired")) {
                throw new Error(
                    "Expected the verification challenge from start."
                );
            }
            expect(result.state["stateParameters"].continuationState).toEqual({
                continuationToken: "ct-start",
                scenario: "signUp",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {
                    verify: START_RESPONSE._links.verify.href,
                    resend: START_RESPONSE._links.resend.href,
                },
            });
        }
    );

    it("IT-SU-03: ignores upfront flat username without changing the identifier or caller attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE));
        const attributes = { username: "test-user", givenName: "Test" };

        const result = await app.signUpV2({
            username: "user@contoso.com",
            attributes,
        });

        expect(result.isState("codeRequired")).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[1][1].body)).toEqual(
            USERNAME_START_REQUEST
        );
        expect(attributes).toEqual({
            username: "test-user",
            givenName: "Test",
        });
    });

    it("IT-SU-04: verifies email before collecting the requested password and profile", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse(PASSWORD_AND_PROFILE_REQUIRED_RESPONSE)
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            attributes: { username: "ignored-profile" },
        });

        expect(fetch).toHaveBeenCalledTimes(2);
        if (!startResult.isState("codeRequired")) {
            throw new Error(
                "Expected email verification before password collection."
            );
        }
        const result = await startResult.state.submitCode("12345678");
        expect(result.isState("passwordRequired")).toBe(true);
        if (!result.isState("passwordRequired")) {
            throw new Error(
                "Expected the password requested after verification."
            );
        }
        expect(result.state.requiredPasswordAttribute).toEqual(
            PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.attributes[0]
        );
        expect(result.state.attributes).toEqual(
            PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.attributes.slice(1)
        );
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(JSON.parse((fetch as jest.Mock).mock.calls[2][1].body)).toEqual({
            continuationToken: "ct-start",
            otp: "12345678",
        });
    });

    it("rejects an unexpected enrollment response from start", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
        });

        expect(startResult.isFailed()).toBe(true);
        expect(startResult.error?.errorData).toMatchObject({
            error: "invalid_hal_response",
        });
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("registers after email verification and additional attributes", async () => {
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
            attributes: { givenName: "Test" },
        });
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected email verification first.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("attributesRequired")) {
            throw new Error(
                "Expected additional attributes after verification."
            );
        }
        const registrationResult = await verifyResult.state.submitAttributes({
            jobTitle: "Engineer",
        });
        if (!registrationResult.isState("authMethodRegistrationRequired")) {
            throw new Error(
                "Expected registration after additional attributes."
            );
        }

        const activationResult =
            await registrationResult.state.selectAuthMethod(
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
        expect(JSON.parse(requests[2][1].body)).toEqual({
            continuationToken: "ct-start",
            otp: "12345678",
        });
        expect(JSON.parse(requests[3][1].body)).toEqual({
            continuationToken: "ct-attributes",
            attributes: { jobTitle: "Engineer" },
        });
        expect(
            requests.some(([url]: [string]) =>
                String(url).includes("/email/verify")
            )
        ).toBe(true);
    });

    it("registers after sign-up code verification without repeating that code", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_REQUIRED_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ENROLL_ACTIVATION_RESPONSE))
            .mockResolvedValueOnce(buildResponse(ACTIVATED_CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(CONTINUE_RESPONSE))
            .mockResolvedValueOnce(buildResponse(TestServerTokenResponse));

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
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
            await registrationResult.state.selectAuthMethod(
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
        expect(fetch).toHaveBeenCalledTimes(7);
        expect(
            ((fetch as jest.Mock).mock.calls[5][1].body as URLSearchParams).get(
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
                attributes: { displayName: "Test User" },
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
                await registrationResult.state.selectAuthMethod(
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
            expect(requests).toHaveLength(8);
            expect(JSON.parse(requests[3][1].body)).toMatchObject({
                continuationToken: "ct-attributes",
                attributes: {
                    jobTitle: "Engineer",
                    ...(submission === "password"
                        ? { password: "valid-password" }
                        : {}),
                },
            });
            expect(
                (requests[6][1].body as URLSearchParams).get(
                    "continuation_token"
                )
            ).toBe("ct-activated");
        }
    );

    it("surfaces an existing-email error from signup/start", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
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

    it("surfaces a signup/start server error as a general sign-up error", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
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

    it("validates a freshly submitted password even when an upfront password was supplied", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
            .mockResolvedValueOnce(
                buildResponse({
                    ...PASSWORD_AND_PROFILE_REQUIRED_RESPONSE,
                    attributes: [
                        PASSWORD_AND_PROFILE_REQUIRED_RESPONSE.attributes[0],
                    ],
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

        const runtimeInputs = {
            username: "user@contoso.com",
            password: "ignored-password",
        };
        const startResult = await app.signUpV2(runtimeInputs);

        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected email verification first.");
        }
        const verifyResult = await startResult.state.submitCode("12345678");
        if (!verifyResult.isState("passwordRequired")) {
            throw new Error("Expected password collection after verification.");
        }
        const result = await verifyResult.state.submitPassword("weak");
        expect(result.isFailed()).toBe(true);
        expect(result.error).toBeInstanceOf(AuthFlowErrorV2);
        expect(result.error?.isInvalidPassword()).toBe(true);
        expect(result.error?.correlationId).toBe("corr-password-policy");
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-password-profile",
            attributes: { password: "weak" },
        });
    });

    it("IT-SU-05, IT-SU-09: collects a password after verification and submits it with profile attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
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
            attributes: { displayName: "Test User" },
        });

        expect(startResult.isState("codeRequired")).toBe(true);
        if (!startResult.isState("codeRequired")) {
            throw new Error("Expected challenge verification state.");
        }

        const verifyResult = await startResult.state.submitCode("12345678");

        expect(verifyResult.isState("passwordRequired")).toBe(true);
        expect(verifyResult.isFailed()).toBe(false);
        expect(verifyResult.error).toBeUndefined();
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

        const [, verifyOptions] = (fetch as jest.Mock).mock.calls[2];
        expect(JSON.parse(verifyOptions.body)).toEqual({
            continuationToken: "ct-start",
            otp: "12345678",
        });

        const [, attributesOptions] = (fetch as jest.Mock).mock.calls[3];
        expect(JSON.parse(attributesOptions.body)).toEqual({
            continuationToken: "ct-verify",
            attributes: {
                jobTitle: "Engineer",
                password: "valid-password",
            },
        });
    });

    it("IT-SU-13: preserves required and invalid attribute details after partial submission", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
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
        expect(submitResult.error?.correlationId).toBe("corr-attributes");
        expect(submitResult.error?.errorData).toMatchObject({
            attributeValidationDetails: [
                { attributeIds: ["jobTitle"], code: "attributeRequired" },
                { attributeIds: ["city"], code: "attributeValidationFailed" },
            ],
        });

        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
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
            .mockResolvedValueOnce(
                buildResponse({
                    continuationToken: "ct-verify",
                    state: "continue",
                })
            );

        const startResult = await app.signUpV2({
            username: "user@contoso.com",
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

    it("completes sign-up after verification and required attributes while ignoring upfront password", async () => {
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

        const runtimeInputs = {
            username: "user@contoso.com",
            password: "valid-password",
            scopes: ["User.Read"],
        };
        const startResult = await app.signUpV2(runtimeInputs);
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
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-attributes",
            attributes: {
                givenName: "Test",
                username: "test-user",
            },
        });
        expect(fetch).toHaveBeenCalledTimes(6);
    });

    it("completes sign-up after deferred password and required attributes", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE))
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
            attributes: { displayName: "Test User" },
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
        expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body)).toEqual({
            continuationToken: "ct-password",
            attributes: {
                givenName: "Test",
                username: "test-user",
                password: "valid-password",
            },
        });
        expect(fetch).toHaveBeenCalledTimes(6);
    });

    it.each([
        {
            name: "a password policy violation",
            response: PASSWORD_POLICY_ERROR_RESPONSE,
            invalidPassword: true,
        },
        {
            name: "a weak password",
            response: WEAK_PASSWORD_ERROR_RESPONSE,
            invalidPassword: true,
        },
        {
            name: "an invalid continuation token",
            response: {
                error: {
                    code: "invalidRequest",
                    message:
                        "AADSTS90100: continuationToken parameter is empty or not valid.",
                    correlationId: "corr-invalid-continuation",
                },
            },
            invalidPassword: false,
        },
    ])(
        "IT-SU-14: distinguishes password collection from $name",
        async ({ response, invalidPassword }) => {
            (fetch as jest.Mock)
                .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE, 401))
                .mockResolvedValueOnce(buildResponse(START_RESPONSE))
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
                .mockResolvedValueOnce(buildResponse(response, 400));

            const startResult = await app.signUpV2({
                username: "user@contoso.com",
                attributes: { displayName: "Test User" },
            });
            if (!startResult.isState("codeRequired")) {
                throw new Error("Expected challenge verification state.");
            }

            const verifyResult = await startResult.state.submitCode("12345678");
            expect(verifyResult.isState("passwordRequired")).toBe(true);
            expect(verifyResult.error).toBeUndefined();
            if (!verifyResult.isState("passwordRequired")) {
                throw new Error("Expected password required state.");
            }

            const passwordResult = await verifyResult.state.submitPassword(
                "weak"
            );

            expect(passwordResult.isFailed()).toBe(true);
            expect(passwordResult.error?.isInvalidPassword()).toBe(
                invalidPassword
            );
            expect(passwordResult.error?.isInvalidCredentials()).toBe(false);
            expect(passwordResult.error?.correlationId).toBe(
                response.error.correlationId
            );
        }
    );
});
