/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger, StubbedNetworkModule } from "@azure/msal-common/browser";
import { FlowInteractionClientV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/FlowInteractionClientV2.js";
import {
    FLOW_METHOD_SELECTION_REQUIRED_V2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
    FLOW_MFA_REQUIRED_V2,
    FLOW_NEW_PASSWORD_REQUIRED_V2,
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2,
    FlowMethodSelectionRequiredResultV2,
    FlowCodeRequiredResultV2,
    FlowSignInCodeRequiredResultV2,
    FlowPasswordRequiredResultV2,
    FlowMFARequiredResultV2,
    FlowNewPasswordRequiredResultV2,
    FlowSignUpPasswordRequiredResultV2,
    FlowAttributesRequiredResultV2,
    FlowSignInContinuationRequiredResultV2,
    FlowCompletedResultV2,
    FlowAuthMethodRegistrationRequiredResultV2,
} from "../../../../../src/custom_auth/core/interaction_client/v2/result/FlowActionResultV2.js";
import { FlowContinuationStateV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/FlowContinuationStateV2.js";
import { FlowAuthMethodRegistrationRequiredParamsV2 } from "../../../../../src/custom_auth/core/interaction_client/v2/parameter/FlowParamsV2.js";
import { CustomAuthAuthority } from "../../../../../src/custom_auth/core/CustomAuthAuthority.js";
import { CustomAuthApiClientV2 } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/CustomAuthApiClientV2.js";
import { AuthenticationFactorV2 } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { CustomAuthApiError } from "../../../../../src/custom_auth/core/error/CustomAuthApiError.js";
import type { UserAccountAttributes } from "../../../../../src/custom_auth/UserAccountAttributes.js";
import type { ResetPasswordPollResultV2 } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/result/ResetPasswordResultsV2.js";
import { RESET_PASSWORD_TIMEOUT } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import {
    CONTINUATION_LINK_MISSING,
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    RESET_PASSWORD_UNSUPPORTED,
    SIGN_IN_UNSUPPORTED,
    UNSUPPORTED_FLOW_TRANSITION,
} from "../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { buildConfiguration } from "../../../../../src/config/Configuration.js";
import { customAuthConfig } from "../../../test_resources/CustomAuthConfig.js";
import {
    getDefaultBrowserCacheManager,
    getDefaultCrypto,
    getDefaultEventHandler,
    getDefaultLogger,
    getDefaultNavigationClient,
    getDefaultPerformanceClient,
} from "../../../test_resources/TestModules.js";
import {
    JIT_V2_ENROLL_AUTH_METHOD,
    JIT_V2_RESEND_CHALLENGE,
    JIT_V2_SUBMIT_CHALLENGE,
    MFA_V2_RESEND_CHALLENGE,
    MFA_V2_SELECT_AUTH_METHOD,
    MFA_V2_SUBMIT_CHALLENGE,
    SIGN_IN_V2_CHALLENGE,
    SIGN_IN_V2_SUBMIT_CODE,
    SIGN_IN_V2_SUBMIT_PASSWORD,
    SIGN_UP_V2_COMPLETE,
    SIGN_UP_V2_RESEND_CODE,
    SIGN_UP_V2_START,
    SIGN_UP_V2_SUBMIT_ATTRIBUTES,
    SIGN_UP_V2_SUBMIT_CODE,
    SIGN_UP_V2_SUBMIT_PASSWORD,
} from "../../../../../src/custom_auth/core/telemetry/PublicApiId.js";

describe("FlowInteractionClientV2", () => {
    let client: FlowInteractionClientV2;
    let logger: Logger;
    let apiClient: jest.Mocked<
        Pick<
            CustomAuthApiClientV2,
            | "authorizeChallengeStart"
            | "resetPasswordStart"
            | "signInStart"
            | "signUpStart"
            | "submitSignUpAttributes"
            | "requestChallenge"
            | "verifyRisk"
            | "verifyChallenge"
            | "submitNewPassword"
            | "poll"
            | "completeWithTokens"
            | "enrollAuthMethod"
            | "resendAuthMethodRegistrationChallenge"
            | "activateAuthMethod"
        >
    >;

    const correlationId = "corr-123";

    beforeEach(() => {
        const clientId = customAuthConfig.auth.clientId;
        const config = buildConfiguration(
            { auth: { clientId: clientId } },
            false
        );
        logger = getDefaultLogger();
        const performanceClient = getDefaultPerformanceClient(clientId);
        const eventHandler = getDefaultEventHandler();
        const crypto = getDefaultCrypto(clientId, logger, performanceClient);
        const cacheManager = getDefaultBrowserCacheManager(
            clientId,
            logger,
            performanceClient,
            eventHandler,
            undefined,
            config.cache
        );

        const authority = new CustomAuthAuthority(
            customAuthConfig.auth.authority ?? "",
            config,
            StubbedNetworkModule,
            cacheManager,
            logger,
            performanceClient,
            customAuthConfig.customAuth.authApiProxyUrl
        );

        apiClient = {
            authorizeChallengeStart: jest.fn(),
            resetPasswordStart: jest.fn(),
            signInStart: jest.fn(),
            signUpStart: jest.fn(),
            submitSignUpAttributes: jest.fn(),
            requestChallenge: jest.fn(),
            verifyRisk: jest.fn(),
            verifyChallenge: jest.fn(),
            submitNewPassword: jest.fn(),
            poll: jest.fn(),
            completeWithTokens: jest.fn(),
            enrollAuthMethod: jest.fn(),
            resendAuthMethodRegistrationChallenge: jest.fn(),
            activateAuthMethod: jest.fn(),
        } as unknown as jest.Mocked<
            Pick<
                CustomAuthApiClientV2,
                | "authorizeChallengeStart"
                | "resetPasswordStart"
                | "signInStart"
                | "signUpStart"
                | "submitSignUpAttributes"
                | "requestChallenge"
                | "verifyRisk"
                | "verifyChallenge"
                | "submitNewPassword"
                | "poll"
                | "completeWithTokens"
                | "enrollAuthMethod"
                | "resendAuthMethodRegistrationChallenge"
                | "activateAuthMethod"
            >
        >;

        client = new FlowInteractionClientV2(
            config,
            cacheManager,
            crypto,
            logger,
            eventHandler,
            getDefaultNavigationClient(),
            performanceClient,
            authority,
            apiClient as unknown as CustomAuthApiClientV2
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe("signUp", () => {
        it("returns the email challenge from start without submitting attributes", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signUpHref: "https://endpoint/signup/start",
            });
            apiClient.signUpStart.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-start",
                verifyHref: "https://endpoint/signup/verify",
                resendHref: "https://endpoint/signup/resend",
                type: "email",
                hint: "u***@contoso.com",
                codeLength: 8,
            });

            const result = await client.signUp({
                correlationId,
                username: "user@contoso.com",
            });
            expect(result).toMatchObject({
                type: FLOW_CODE_REQUIRED_V2,
                channel: "email",
                sentTo: "u***@contoso.com",
                codeLength: 8,
            });
            expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
        });

        it("propagates sign-up start validation errors unchanged", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signUpHref: "https://endpoint/signup/start",
            });
            const error = new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                "Invalid HAL response: sign-up start did not return a verification challenge",
                correlationId
            );
            apiClient.signUpStart.mockRejectedValue(error);

            await expect(
                client.signUp({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toBe(error);
            expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
        });

        it("ignores an extra runtime password and upfront attributes without retaining their values", async () => {
            const contextSpy = jest.spyOn(
                client as unknown as {
                    createRequestContext: (
                        apiId: number,
                        correlationId: string
                    ) => unknown;
                },
                "createRequestContext"
            );
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signUpHref: "https://endpoint/signup/start",
            });
            apiClient.signUpStart.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-start",
                verifyHref: "https://endpoint/signup/verify",
                resendHref: "https://endpoint/signup/resend",
                type: "email",
                hint: "u***@contoso.com",
                codeLength: 8,
            });

            const runtimeInputs = {
                correlationId,
                username: "user@contoso.com",
                password: "valid-password",
                attributes: {
                    Email: "wrong@contoso.com",
                    PASSWORD: "wrong-password",
                    displayName: "Test User",
                    username: "test-user",
                },
                scopes: ["User.Read"],
                claims: '{"id_token":{"auth_time":{"essential":true}}}',
            };
            const result = await client.signUp(runtimeInputs);

            expect(apiClient.authorizeChallengeStart).toHaveBeenCalledWith(
                expect.objectContaining({ correlationId }),
                ["User.Read", "openid", "profile", "offline_access"],
                '{"id_token":{"auth_time":{"essential":true}}}'
            );
            expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);
            expect(apiClient.signUpStart).toHaveBeenCalledWith(
                "https://endpoint/signup/start",
                {
                    continuationToken: "ct-entry",
                    username: "user@contoso.com",
                },
                expect.objectContaining({ correlationId })
            );
            expect(contextSpy).toHaveBeenCalledWith(
                SIGN_UP_V2_START,
                correlationId
            );
            expect(result.continuationState).toEqual({
                continuationToken: "ct-start",
                scenario: "signUp",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {
                    verify: "https://endpoint/signup/verify",
                    resend: "https://endpoint/signup/resend",
                },
                signUp: {
                    purpose: "newAccount",
                    submittedAttributeIds: [],
                },
            });
        });

        it("propagates start errors without submitting upfront values", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signUpHref: "https://endpoint/signup/start",
            });
            const error = new Error("Start failed.");
            apiClient.signUpStart.mockRejectedValue(error);

            await expect(
                client.signUp({
                    correlationId,
                    username: "user@contoso.com",
                    attributes: { displayName: "Test User" },
                })
            ).rejects.toBe(error);
            expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
        });

        it.each([undefined, "sms", "password"])(
            "rejects a new-account verify response with channel %p",
            async (type) => {
                apiClient.authorizeChallengeStart.mockResolvedValue({
                    continuationToken: "ct-entry",
                    signUpHref: "https://endpoint/signup/start",
                });
                apiClient.signUpStart.mockResolvedValue({
                    nextAction: "verify",
                    continuationToken: "ct-start",
                    verifyHref: "https://endpoint/signup/verify",
                    type,
                });

                await expect(
                    client.signUp({
                        correlationId,
                        username: "user@contoso.com",
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                    correlationId,
                });
                expect(apiClient.requestChallenge).not.toHaveBeenCalled();
            }
        );

        it.each([
            [
                "email",
                "FlowExistingAccountCodeRequiredResultV2",
                "https://endpoint/email/verify",
            ],
            [
                "password",
                "FlowExistingAccountPasswordRequiredResultV2",
                "https://endpoint/password/verify",
            ],
        ])(
            "dispatches an existing-account %s challenge without submitting sign-up attributes",
            async (methodType, expectedType, verifyHref) => {
                apiClient.authorizeChallengeStart.mockResolvedValue({
                    continuationToken: "ct-entry",
                    signUpHref: "https://endpoint/signup/start",
                });
                apiClient.signUpStart.mockResolvedValue({
                    nextAction: "challenge",
                    continuationToken: "ct-existing",
                    authenticationFactor: "singleFactor",
                    methods: [
                        {
                            id: `${methodType}-1`,
                            type: methodType,
                            challengeHref: `https://endpoint/${methodType}/challenge`,
                        },
                    ],
                } as never);
                apiClient.requestChallenge.mockResolvedValue({
                    nextAction: "verify",
                    continuationToken: "ct-challenge",
                    verifyHref,
                    resendHref:
                        methodType === "email"
                            ? "https://endpoint/email/resend"
                            : undefined,
                    type: methodType,
                    hint:
                        methodType === "email" ? "e***@contoso.com" : undefined,
                    codeLength: methodType === "email" ? 6 : undefined,
                });

                const result = await client.signUp({
                    correlationId,
                    username: "existing@contoso.com",
                });

                expect(result.type).toBe(expectedType);
                expect(result.continuationState).toMatchObject({
                    continuationToken: "ct-challenge",
                    scenario: "signUp",
                    links: {
                        verify: verifyHref,
                    },
                    signUp: {
                        purpose: "existingAccount",
                    },
                });
                expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
            }
        );

        it("offers multiple existing-account methods without requesting a challenge", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signUpHref: "https://endpoint/signup/start",
            });
            const methods = ["email", "password"].map((type) => ({
                id: `${type}-1`,
                type,
                challengeHref: `https://endpoint/${type}/challenge`,
            }));
            apiClient.signUpStart.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-existing",
                authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
                methods,
            });

            const result = await client.signUp({
                correlationId,
                username: "existing@contoso.com",
            });

            expect(result).toMatchObject({
                type: FLOW_METHOD_SELECTION_REQUIRED_V2,
                methods,
                continuationState: {
                    continuationToken: "ct-existing",
                    scenario: "signUp",
                    signUp: { purpose: "existingAccount" },
                },
            });
            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });

        it.each([{ methodTypes: [] }, { methodTypes: ["sms"] }])(
            "rejects invalid existing-account methods $methodTypes without requesting a challenge",
            async ({ methodTypes }) => {
                apiClient.authorizeChallengeStart.mockResolvedValue({
                    continuationToken: "ct-entry",
                    signUpHref: "https://endpoint/signup/start",
                });
                apiClient.signUpStart.mockResolvedValue({
                    nextAction: "challenge",
                    continuationToken: "ct-existing",
                    authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
                    methods: methodTypes.map((type) => ({
                        id: `${type}-1`,
                        type,
                        challengeHref: `https://endpoint/${type}/challenge`,
                    })),
                });

                await expect(
                    client.signUp({
                        correlationId,
                        username: "existing@contoso.com",
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                });
                expect(apiClient.requestChallenge).not.toHaveBeenCalled();
                expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
            }
        );

        it("rejects a multi-factor challenge before existing-account credential verification", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signUpHref: "https://endpoint/signup/start",
            });
            apiClient.signUpStart.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-existing",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-1",
                        type: "email",
                        challengeHref: "https://endpoint/email/challenge",
                    },
                ],
            } as never);

            await expect(
                client.signUp({
                    correlationId,
                    username: "existing@contoso.com",
                })
            ).rejects.toThrow(
                "Authentication factor 'multiFactor' is not supported for existing-account sign-up."
            );
            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
            expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
        });
    });

    describe("signIn", () => {
        it("automatically selects the sole supported password method", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                    {
                        id: "other-1",
                        type: "other",
                        challengeHref: "https://endpoint/other/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/password/verify",
                type: "password",
            });

            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
                scopes: ["User.Read"],
                claims: '{"access_token":{"acrs":{"value":"c4"}}}',
            });

            expect(apiClient.authorizeChallengeStart).toHaveBeenCalledWith(
                expect.objectContaining({ correlationId }),
                ["User.Read", "openid", "profile", "offline_access"],
                '{"access_token":{"acrs":{"value":"c4"}}}'
            );
            expect(apiClient.signInStart).toHaveBeenCalledWith(
                "https://endpoint/sign-in",
                {
                    continuationToken: "ct-entry",
                    username: "user@contoso.com",
                },
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/password/challenge",
                { continuationToken: "ct-sign-in" },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(FLOW_PASSWORD_REQUIRED_V2);

            const passwordRequired = result as FlowPasswordRequiredResultV2;
            expect(passwordRequired.continuationState).toEqual({
                continuationToken: "ct-challenge",
                scenario: "signIn",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {
                    challenge: "https://endpoint/password/challenge",
                    verify: "https://endpoint/password/verify",
                    resend: undefined,
                },
            });
        });

        it.each([{ scopes: undefined }, { scopes: [] }])(
            "uses only basic scopes when scopes is $scopes",
            async ({ scopes }) => {
                apiClient.authorizeChallengeStart.mockResolvedValue({
                    continuationToken: "ct-entry",
                    signInHref: "https://endpoint/sign-in",
                });
                apiClient.signInStart.mockResolvedValue({
                    continuationToken: "ct-sign-in",
                    authenticationFactor: "singleFactor",
                    methods: [
                        {
                            id: "password-1",
                            type: "password",
                            challengeHref:
                                "https://endpoint/password/challenge",
                        },
                    ],
                });
                apiClient.requestChallenge.mockResolvedValue({
                    nextAction: "verify",
                    continuationToken: "ct-challenge",
                    verifyHref: "https://endpoint/password/verify",
                    type: "password",
                });

                const result = await client.signIn({
                    correlationId,
                    username: "user@contoso.com",
                    scopes,
                });

                expect(apiClient.authorizeChallengeStart).toHaveBeenCalledWith(
                    expect.objectContaining({ correlationId }),
                    ["openid", "profile", "offline_access"],
                    undefined
                );
                expect(result.type).toBe(FLOW_PASSWORD_REQUIRED_V2);
            }
        );

        it("returns method selection when multiple supported methods are available", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                    {
                        id: "email-1",
                        type: "email",
                        hint: "u***@contoso.com",
                        challengeHref: "https://endpoint/email/challenge",
                    },
                ],
            });
            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
            });

            expect(result.type).toBe(FLOW_METHOD_SELECTION_REQUIRED_V2);
            expect(
                (result as FlowMethodSelectionRequiredResultV2).methods
            ).toEqual([
                {
                    id: "password-1",
                    type: "password",
                    hint: undefined,
                    challengeHref: "https://endpoint/password/challenge",
                },
                {
                    id: "email-1",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "https://endpoint/email/challenge",
                },
            ]);
            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("does not retain or submit an initial password when method selection is required", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                    {
                        id: "email-1",
                        type: "email",
                        challengeHref: "https://endpoint/email/challenge",
                    },
                ],
            });

            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
                password: "initial-password",
            });

            expect(result.type).toBe(FLOW_METHOD_SELECTION_REQUIRED_V2);
            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
            expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
            expect(
                (result as FlowMethodSelectionRequiredResultV2)
                    .continuationState
            ).toEqual({
                continuationToken: "ct-sign-in",
                scenario: "signIn",
                scopes: ["openid", "profile", "offline_access"],
                links: {},
            });
        });

        it("returns code-required when password is supplied for email OTP", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "email-1",
                        type: "email",
                        challengeHref: "https://endpoint/email/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-email",
                verifyHref: "https://endpoint/email/verify",
                resendHref: "https://endpoint/email/resend",
                type: "email",
            });

            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
                password: "valid-password",
            });

            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/email/challenge",
                { continuationToken: "ct-sign-in" },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);
            expect((result as FlowSignInCodeRequiredResultV2).method.id).toBe(
                "email-1"
            );
            expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
        });

        it("fails when sign-in start does not offer an email or password method", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "other-1",
                        type: "other",
                        challengeHref: "https://endpoint/other/challenge",
                    },
                ],
            });

            await expect(
                client.signIn({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });

            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("rejects a multi-factor sign-in start transition", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            await expect(
                client.signIn({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });

            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("returns MFA-required after automatically submitting a password", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-password",
                verifyHref: "https://endpoint/password/verify",
                type: "password",
            });
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-mfa",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        hint: "u***@contoso.com",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
                password: "valid-password",
                scopes: ["User.Read"],
            });

            expect(result.type).toBe(FLOW_MFA_REQUIRED_V2);
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();

            const mfaRequired = result as FlowMFARequiredResultV2;
            expect(mfaRequired.methods).toEqual([
                {
                    id: "email-mfa",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "https://endpoint/mfa/challenge",
                },
            ]);
            expect(mfaRequired.continuationState).toEqual({
                continuationToken: "ct-mfa",
                scenario: "signIn",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {},
            });
        });

        it("returns MFA selection based on the challenge action and methods", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                signInHref: "https://endpoint/sign-in",
            });
            apiClient.signInStart.mockResolvedValue({
                continuationToken: "ct-sign-in",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password-1",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-password",
                verifyHref: "https://endpoint/password/verify",
                type: "password",
            });
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-mfa",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            const result = await client.signIn({
                correlationId,
                username: "user@contoso.com",
                password: "valid-password",
            });

            expect(result.type).toBe(FLOW_MFA_REQUIRED_V2);
        });

        it.each([undefined, "", "   ", "\t\r\n"])(
            "rejects invalid sign-in link %p before calling sign-in start",
            async (signInHref) => {
                apiClient.authorizeChallengeStart.mockResolvedValue({
                    continuationToken: "ct-entry",
                    signInHref,
                });

                await expect(
                    client.signIn({
                        correlationId,
                        username: "user@contoso.com",
                    })
                ).rejects.toMatchObject({
                    error: SIGN_IN_UNSUPPORTED,
                    errorDescription:
                        "The authorize-challenge entry response did not include a sign-in link.",
                    correlationId,
                });

                expect(apiClient.signInStart).not.toHaveBeenCalled();
            }
        );
    });

    describe("resetPassword", () => {
        it("automatically challenges the only available method", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                resetPasswordHref: "https://endpoint/reset-password",
            });
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "email",
                        type: "email",
                        hint: "u***@contoso.com",
                        challengeHref: "https://endpoint/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                resendHref: "https://endpoint/resend",
                type: "email",
                hint: "u***@contoso.com",
                codeLength: 6,
            });

            const result = await client.resetPassword({
                correlationId,
                username: "user@contoso.com",
                scopes: ["User.Read"],
                claims: '{"id_token":{"auth_time":{"essential":true}}}',
            });

            expect(apiClient.authorizeChallengeStart).toHaveBeenCalledWith(
                expect.objectContaining({ correlationId }),
                ["User.Read", "openid", "profile", "offline_access"],
                '{"id_token":{"auth_time":{"essential":true}}}'
            );
            expect(apiClient.resetPasswordStart).toHaveBeenCalledWith(
                "https://endpoint/reset-password",
                {
                    username: "user@contoso.com",
                    continuationToken: "ct-entry",
                },
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/challenge",
                { continuationToken: "ct-start" },
                expect.objectContaining({ correlationId })
            );
            expect(result).toMatchObject({
                type: FLOW_CODE_REQUIRED_V2,
                channel: "email",
                sentTo: "u***@contoso.com",
                codeLength: 6,
                method: {
                    id: "email",
                    type: "email",
                    hint: "u***@contoso.com",
                    challengeHref: "https://endpoint/challenge",
                },
                continuationState: {
                    continuationToken: "ct-challenge",
                    scenario: "passwordReset",
                    links: {
                        challenge: "https://endpoint/challenge",
                        verify: "https://endpoint/verify",
                        resend: "https://endpoint/resend",
                    },
                },
            });
        });

        it("returns method selection when multiple methods are available", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                resetPasswordHref: "https://endpoint/reset-password",
            });
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "email",
                        type: "email",
                        challengeHref: "https://endpoint/email/challenge",
                    },
                    {
                        id: "password",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                ],
            });

            const result = await client.resetPassword({
                correlationId,
                username: "user@contoso.com",
            });

            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
            expect(result.type).toBe(FLOW_METHOD_SELECTION_REQUIRED_V2);
            expect(
                (result as FlowMethodSelectionRequiredResultV2).methods
            ).toHaveLength(2);
            expect(result.continuationState).toEqual({
                continuationToken: "ct-start",
                scenario: "passwordReset",
                scopes: ["openid", "profile", "offline_access"],
                links: {},
            });
        });

        it("rejects an empty method list", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                resetPasswordHref: "https://endpoint/reset-password",
            });
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                authenticationFactor: "singleFactor",
                methods: [],
            });

            await expect(
                client.resetPassword({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("rejects an unsupported challenge for the only available method", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                resetPasswordHref: "https://endpoint/reset-password",
            });
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "password",
                        type: "password",
                        challengeHref: "https://endpoint/password/challenge",
                    },
                ],
            });
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-password",
                verifyHref: "https://endpoint/password/verify",
                type: "password",
            });

            await expect(
                client.resetPassword({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
        });

        it("rejects a multi-factor password-reset start transition", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
                resetPasswordHref: "https://endpoint/reset-password",
            });
            apiClient.resetPasswordStart.mockResolvedValue({
                continuationToken: "ct-start",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            await expect(
                client.resetPassword({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
        });

        it("rejects a missing reset-password link before calling reset-password start", async () => {
            apiClient.authorizeChallengeStart.mockResolvedValue({
                continuationToken: "ct-entry",
            });

            await expect(
                client.resetPassword({
                    correlationId,
                    username: "user@contoso.com",
                })
            ).rejects.toMatchObject({
                error: RESET_PASSWORD_UNSUPPORTED,
            });

            expect(apiClient.resetPasswordStart).not.toHaveBeenCalled();
        });
    });

    describe("requestChallenge", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-start",
            scenario: "passwordReset",
            scopes: ["openid", "profile", "offline_access"],
            links: { challenge: "https://endpoint/challenge" },
        };

        it.each([
            {
                authenticationFactor: undefined,
                expectedApiId: SIGN_IN_V2_CHALLENGE,
            },
            {
                authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
                expectedApiId: SIGN_IN_V2_CHALLENGE,
            },
            {
                authenticationFactor: AuthenticationFactorV2.MULTI_FACTOR,
                expectedApiId: MFA_V2_SELECT_AUTH_METHOD,
            },
        ])(
            "uses selection API ID $expectedApiId for sign-in factor $authenticationFactor",
            async ({ authenticationFactor, expectedApiId }) => {
                apiClient.requestChallenge.mockResolvedValue({
                    nextAction: "verify",
                    continuationToken: "ct-challenge",
                    verifyHref: "https://endpoint/verify",
                    type: "email",
                });

                await client.requestChallenge({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        scenario: "signIn",
                    },
                    authenticationFactor,
                });

                const context = apiClient.requestChallenge.mock.calls[0][2];
                expect(
                    context.telemetryManager.generateCurrentRequestHeaderValue()
                ).toContain(`|${expectedApiId},`);
            }
        );

        it("posts the selected method's challenge href and returns a code-required result", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                resendHref: "https://endpoint/resend",
                codeLength: 6,
                hint: "u***@contoso.com",
                type: "email",
            });

            const result = await client.requestChallenge({
                correlationId,
                continuationState,
            });

            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/challenge",
                { continuationToken: "ct-start" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);

            const codeRequired = result as FlowCodeRequiredResultV2;
            expect(codeRequired.codeLength).toBe(6);
            expect(codeRequired.sentTo).toBe("u***@contoso.com");
            expect(codeRequired.channel).toBe("email");
            expect(codeRequired.continuationState).toEqual({
                continuationToken: "ct-challenge",
                scenario: "passwordReset",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    challenge: "https://endpoint/challenge",
                    verify: "https://endpoint/verify",
                    resend: "https://endpoint/resend",
                },
            });
        });

        it("returns a password-required result for a selected password challenge", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                type: "password",
            });

            const result = await client.requestChallenge({
                correlationId,
                continuationState: {
                    ...continuationState,
                },
            });

            expect(result.type).toBe(FLOW_PASSWORD_REQUIRED_V2);

            const passwordRequired = result as FlowPasswordRequiredResultV2;
            expect(passwordRequired.continuationState).toEqual({
                continuationToken: "ct-challenge",
                scenario: "passwordReset",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    challenge: "https://endpoint/challenge",
                    verify: "https://endpoint/verify",
                    resend: undefined,
                },
            });
        });

        it("returns code-required for an SMS challenge", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                type: "sms",
            });

            const result = await client.requestChallenge({
                correlationId,
                continuationState,
            });

            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);
            expect((result as FlowCodeRequiredResultV2).channel).toBe("sms");
        });

        it("rejects an unsupported challenge type", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
                type: "push",
            });

            await expect(
                client.requestChallenge({
                    correlationId,
                    continuationState,
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
                errorDescription: "Challenge type 'push' is not supported.",
            });
        });

        it("rejects a challenge response without a type", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge",
                verifyHref: "https://endpoint/verify",
            });

            await expect(
                client.requestChallenge({
                    correlationId,
                    continuationState,
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
                errorDescription: "Challenge type is missing.",
            });
        });

        it.each([undefined, "", "   ", "\t\r\n"])(
            "rejects invalid continuation challenge link %p before calling the API",
            async (challenge) => {
                await expect(
                    client.requestChallenge({
                        correlationId,
                        continuationState: {
                            ...continuationState,
                            links: { challenge },
                        },
                    })
                ).rejects.toMatchObject({
                    error: CONTINUATION_LINK_MISSING,
                    errorDescription:
                        "The continuation state is missing a link required to advance the flow.",
                    correlationId,
                });

                expect(apiClient.requestChallenge).not.toHaveBeenCalled();
            }
        );
    });

    describe("submitCode", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-challenge",
            scenario: "passwordReset",
            scopes: ["openid", "profile", "offline_access"],
            links: {
                challenge: "https://endpoint/challenge",
                verify: "https://endpoint/verify",
                resend: "https://endpoint/resend",
            },
        };

        it("verifies the code and returns a new-password-required result", async () => {
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "update",
                continuationToken: "ct-verify",
                updateHref: "https://endpoint/update",
            });

            const result = await client.submitCode({
                correlationId,
                continuationState,
                code: "123456",
            });

            expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
                "https://endpoint/verify",
                { continuationToken: "ct-challenge", otp: "123456" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(FLOW_NEW_PASSWORD_REQUIRED_V2);

            const newPasswordRequired =
                result as FlowNewPasswordRequiredResultV2;
            expect(newPasswordRequired.correlationId).toBe(correlationId);
            expect(newPasswordRequired.continuationState).toEqual({
                continuationToken: "ct-verify",
                scenario: "passwordReset",
                scopes: ["openid", "profile", "offline_access"],
                links: { update: "https://endpoint/update" },
            });
        });

        it("verifies an MFA code and completes sign-in", async () => {
            const signInContinuationState: FlowContinuationStateV2 = {
                continuationToken: "ct-mfa-challenge",
                scenario: "signIn",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {
                    verify: "https://endpoint/mfa/verify",
                },
            };
            const tokenResponse = {
                token_type: "Bearer",
                expires_in: 3600,
                access_token: "at",
                refresh_token: "rt",
                scope: "openid profile offline_access User.Read",
                id_token: "id",
                client_info: "ci",
            };
            const fakeAuthResult = {
                account: { homeAccountId: "uid.utid" },
            };
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "continue",
                continuationToken: "ct-mfa-verify",
            });
            apiClient.completeWithTokens.mockResolvedValue(tokenResponse);
            jest.spyOn(
                client as unknown as {
                    handleTokenResponse: (
                        ...args: unknown[]
                    ) => Promise<unknown>;
                },
                "handleTokenResponse"
            ).mockResolvedValue(fakeAuthResult);

            const result = await client.submitCode({
                correlationId,
                continuationState: signInContinuationState,
                authenticationFactor: "multiFactor",
                code: "123456",
            });

            const context = apiClient.verifyChallenge.mock.calls[0][2];
            expect(
                context.telemetryManager.generateCurrentRequestHeaderValue()
            ).toContain(`|${MFA_V2_SUBMIT_CHALLENGE},`);
            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                {
                    continuationToken: "ct-mfa-verify",
                },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(FLOW_COMPLETED_V2);
            expect((result as FlowCompletedResultV2).authenticationResult).toBe(
                fakeAuthResult
            );
        });

        it("returns MFA-required after verifying a first-factor code", async () => {
            const signInContinuationState: FlowContinuationStateV2 = {
                continuationToken: "ct-email",
                scenario: "signIn",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    verify: "https://endpoint/email/verify",
                },
            };
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-mfa",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            const result = await client.submitCode({
                correlationId,
                continuationState: signInContinuationState,
                code: "123456",
            });

            expect(result.type).toBe(FLOW_MFA_REQUIRED_V2);
            const context = apiClient.verifyChallenge.mock.calls[0][2];
            expect(
                context.telemetryManager.generateCurrentRequestHeaderValue()
            ).toContain(`|${SIGN_IN_V2_SUBMIT_CODE},`);
            expect((result as FlowMFARequiredResultV2).methods).toEqual([
                {
                    id: "email-mfa",
                    type: "email",
                    challengeHref: "https://endpoint/mfa/challenge",
                },
            ]);
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
        });

        it("returns registration-required after verifying a first-factor code", async () => {
            const signInContinuationState: FlowContinuationStateV2 = {
                continuationToken: "ct-email",
                scenario: "signIn",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    verify: "https://endpoint/email/verify",
                },
            };
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "phone",
                        channels: ["sms"],
                        enrollHref: "https://endpoint/enroll/phone",
                    },
                ],
            });

            const result = await client.submitCode({
                correlationId,
                continuationState: signInContinuationState,
                code: "123456",
            });

            expect(result).toMatchObject({
                type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
                continuationState: {
                    continuationToken: "ct-enroll",
                    scenario: "signIn",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {},
                },
                methods: [
                    {
                        type: "phone",
                        channels: ["sms"],
                        enrollHref: "https://endpoint/enroll/phone",
                    },
                ],
            });
        });

        it("returns registration-required after verifying a sign-up code", async () => {
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "email",
                        enrollHref: "https://endpoint/enroll/email",
                    },
                ],
            });

            const result = await client.submitCode({
                correlationId,
                continuationState: {
                    continuationToken: "ct-challenge",
                    scenario: "signUp",
                    scopes: ["openid", "profile", "offline_access"],
                    links: { verify: "https://endpoint/signup/verify" },
                },
                code: "12345678",
            });

            expect(result).toMatchObject({
                type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
                continuationState: {
                    continuationToken: "ct-enroll",
                    scenario: "signUp",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {},
                },
                methods: [{ type: "email" }],
            });
        });

        it("rejects an unsupported sign-up verification action", async () => {
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "update",
                continuationToken: "ct-update",
                updateHref: "https://endpoint/reset/update",
            });

            await expect(
                client.submitCode({
                    correlationId,
                    continuationState: {
                        continuationToken: "ct-challenge",
                        scenario: "signUp",
                        scopes: ["openid"],
                        links: { verify: "https://endpoint/signup/verify" },
                    },
                    code: "12345678",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
        });

        it("rejects registration-required after verifying a password-reset code", async () => {
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "email",
                        enrollHref: "https://endpoint/enroll/email",
                    },
                ],
            });

            await expect(
                client.submitCode({
                    correlationId,
                    continuationState,
                    code: "123456",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
        });

        it("returns password and profile metadata after sign-up email verification", async () => {
            const signUpContinuationState: FlowContinuationStateV2 = {
                continuationToken: "ct-sign-up-challenge",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    verify: "https://endpoint/signup/verify",
                    resend: "https://endpoint/signup/resend",
                },
            };
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "collectAttributes",
                continuationToken: "ct-sign-up-verify",
                attributes: [
                    {
                        attributeId: "password",
                        inputType: "password",
                        required: true,
                        confirmationInput: "retype",
                    },
                    {
                        attributeId: "jobTitle",
                        inputType: "text",
                    },
                ],
                submitAttributesHref:
                    "https://endpoint/signup/submitattributes",
            });

            const result = await client.submitCode({
                correlationId,
                continuationState: signUpContinuationState,
                code: "12345678",
            });

            if (result.type !== FLOW_SIGN_UP_PASSWORD_REQUIRED_V2) {
                throw new Error("Expected password collection.");
            }
            expect(result.continuationState).toEqual({
                continuationToken: "ct-sign-up-verify",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    submitAttributes:
                        "https://endpoint/signup/submitattributes",
                },
            });
            expect(result.attributes).toEqual([
                {
                    attributeId: "jobTitle",
                    inputType: "text",
                },
            ]);
            expect(result.requestedPasswordAttribute).toMatchObject({
                attributeId: "password",
                confirmationInput: "retype",
            });
        });

        it.each([true, false, undefined])(
            "returns a password state for server-requested password metadata with required=%s",
            async (required) => {
                const contextSpy = jest.spyOn(
                    client as unknown as {
                        createRequestContext: (
                            apiId: number,
                            correlationId: string
                        ) => unknown;
                    },
                    "createRequestContext"
                );
                const signUpContinuationState: FlowContinuationStateV2 = {
                    continuationToken: "ct-sign-up-challenge",
                    scenario: "signUp",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {
                        verify: "https://endpoint/signup/verify",
                    },
                };
                const requestedPasswordAttribute = {
                    attributeId: "PaSsWoRd",
                    inputType: "password",
                    required,
                    confirmationInput: "retype",
                };
                apiClient.verifyChallenge.mockResolvedValue({
                    nextAction: "collectAttributes",
                    continuationToken: "ct-sign-up-verify",
                    attributes: [requestedPasswordAttribute],
                    submitAttributesHref:
                        "https://endpoint/signup/submitattributes",
                });

                const result = await client.submitCode({
                    correlationId,
                    continuationState: signUpContinuationState,
                    code: "12345678",
                });

                expect(result.type).toBe(FLOW_SIGN_UP_PASSWORD_REQUIRED_V2);
                expect(contextSpy).toHaveBeenCalledWith(
                    SIGN_UP_V2_SUBMIT_CODE,
                    correlationId
                );
                expect(
                    (result as FlowSignUpPasswordRequiredResultV2)
                        .requestedPasswordAttribute
                ).toEqual(requestedPasswordAttribute);
                expect(
                    (result as FlowSignUpPasswordRequiredResultV2)
                        .continuationState
                ).toEqual({
                    continuationToken: "ct-sign-up-verify",
                    scenario: "signUp",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {
                        submitAttributes:
                            "https://endpoint/signup/submitattributes",
                    },
                });
            }
        );

        it("returns sign-in continuation after completed sign-up verification", async () => {
            const signUpContinuationState: FlowContinuationStateV2 = {
                continuationToken: "ct-sign-up-challenge",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    verify: "https://endpoint/signup/verify",
                },
            };
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "continue",
                continuationToken: "ct-sign-up-verify",
            });

            const result = await client.submitCode({
                correlationId,
                continuationState: signUpContinuationState,
                code: "12345678",
            });

            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);
            expect(
                (result as FlowSignInContinuationRequiredResultV2)
                    .continuationState
            ).toEqual({
                continuationToken: "ct-sign-up-verify",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {},
            });
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
        });

        it("throws when the continuation is missing the verify link", async () => {
            await expect(
                client.submitCode({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        links: {},
                    },
                    code: "123456",
                })
            ).rejects.toThrow();

            expect(apiClient.verifyChallenge).not.toHaveBeenCalled();
        });

        it("logs an error when verification returns an unexpected next action", async () => {
            const errorSpy = jest.spyOn(
                Reflect.get(client, "logger") as Logger,
                "error"
            );
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "continue",
                continuationToken: "ct-verify",
            });

            await expect(
                client.submitCode({
                    correlationId,
                    continuationState,
                    code: "123456",
                })
            ).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith(
                "Verification next action 'continue' is not supported for the 'passwordReset' flow.",
                correlationId
            );
        });
    });

    describe("submitSignInPassword", () => {
        it("uses the sign-in submit-password API ID", async () => {
            const contextSpy = jest.spyOn(
                client as unknown as {
                    createRequestContext: (
                        apiId: number,
                        correlationId: string
                    ) => unknown;
                },
                "createRequestContext"
            );
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-mfa",
                authenticationFactor: "multiFactor",
                methods: [
                    {
                        id: "email-mfa",
                        type: "email",
                        challengeHref: "https://endpoint/mfa/challenge",
                    },
                ],
            });

            await client.submitSignInPassword({
                correlationId,
                continuationState: {
                    continuationToken: "ct-password",
                    scenario: "signIn",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {
                        verify: "https://endpoint/password/verify",
                    },
                },
                password: "valid-password",
            });

            expect(contextSpy).toHaveBeenCalledWith(
                SIGN_IN_V2_SUBMIT_PASSWORD,
                correlationId
            );
        });

        describe("existing-account sign-up verification", () => {
            const existingAccountContinuationState: FlowContinuationStateV2 = {
                continuationToken: "ct-existing",
                scenario: "signUp",
                scopes: ["User.Read", "openid", "profile", "offline_access"],
                links: {
                    verify: "https://endpoint/existing/verify",
                    resend: "https://endpoint/existing/resend",
                },
                signUp: {
                    purpose: "existingAccount",
                },
            };

            it("verifies a password as a sign-in credential and returns MFA", async () => {
                const contextSpy = jest.spyOn(
                    client as unknown as {
                        createRequestContext: (
                            apiId: number,
                            correlationId: string
                        ) => unknown;
                    },
                    "createRequestContext"
                );
                apiClient.verifyChallenge.mockResolvedValue({
                    nextAction: "challenge",
                    continuationToken: "ct-mfa",
                    authenticationFactor: "multiFactor",
                    methods: [
                        {
                            id: "email-mfa",
                            type: "email",
                            challengeHref: "https://endpoint/mfa/challenge",
                        },
                    ],
                });

                const result = await client.submitSignInPassword({
                    correlationId,
                    continuationState: existingAccountContinuationState,
                    password: "valid-password",
                });

                expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
                    "https://endpoint/existing/verify",
                    {
                        continuationToken: "ct-existing",
                        password: "valid-password",
                    },
                    expect.objectContaining({ correlationId })
                );
                expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
                expect(contextSpy).toHaveBeenCalledWith(
                    SIGN_UP_V2_SUBMIT_PASSWORD,
                    correlationId
                );
                expect(result).toMatchObject({
                    type: FLOW_MFA_REQUIRED_V2,
                    continuationState: {
                        continuationToken: "ct-mfa",
                        scenario: "signUp",
                        signUp: {
                            purpose: "existingAccount",
                        },
                    },
                });
            });

            it("reuses sign-in continuation handling after code verification", async () => {
                const contextSpy = jest.spyOn(
                    client as unknown as {
                        createRequestContext: (
                            apiId: number,
                            correlationId: string
                        ) => unknown;
                        handleTokenResponse: (
                            ...args: unknown[]
                        ) => Promise<unknown>;
                    },
                    "createRequestContext"
                );
                apiClient.verifyChallenge.mockResolvedValue({
                    nextAction: "continue",
                    continuationToken: "ct-continue",
                });
                apiClient.completeWithTokens.mockResolvedValue({
                    token_type: "Bearer",
                    expires_in: 3600,
                    access_token: "at",
                    refresh_token: "rt",
                    scope: "openid profile offline_access User.Read",
                    id_token: "id",
                    client_info: "ci",
                });
                jest.spyOn(
                    client as unknown as {
                        handleTokenResponse: (
                            ...args: unknown[]
                        ) => Promise<unknown>;
                    },
                    "handleTokenResponse"
                ).mockResolvedValue({
                    account: { homeAccountId: "uid.utid" },
                });

                const result = await client.submitCode({
                    correlationId,
                    continuationState: existingAccountContinuationState,
                    code: "123456",
                });

                expect(contextSpy).toHaveBeenCalledWith(
                    SIGN_UP_V2_SUBMIT_CODE,
                    correlationId
                );
                expect(contextSpy).toHaveBeenCalledWith(
                    SIGN_UP_V2_COMPLETE,
                    correlationId
                );
                expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                    { continuationToken: "ct-continue" },
                    expect.objectContaining({ correlationId })
                );
                expect(result.type).toBe(FLOW_COMPLETED_V2);
            });

            it("preserves existing-account purpose and fresh metadata when resending", async () => {
                const contextSpy = jest.spyOn(
                    client as unknown as {
                        createRequestContext: (
                            apiId: number,
                            correlationId: string
                        ) => unknown;
                    },
                    "createRequestContext"
                );
                apiClient.requestChallenge.mockResolvedValue({
                    nextAction: "verify",
                    continuationToken: "ct-resend",
                    verifyHref: "https://endpoint/existing/verify-new",
                    resendHref: "https://endpoint/existing/resend-new",
                    type: "email",
                    hint: "e***@contoso.com",
                    codeLength: 8,
                });

                const result = await client.resendCode({
                    correlationId,
                    continuationState: existingAccountContinuationState,
                });

                expect(contextSpy).toHaveBeenCalledWith(
                    SIGN_UP_V2_RESEND_CODE,
                    correlationId
                );
                expect(result).toMatchObject({
                    continuationState: {
                        continuationToken: "ct-resend",
                        links: {
                            verify: "https://endpoint/existing/verify-new",
                            resend: "https://endpoint/existing/resend-new",
                        },
                        signUp: {
                            purpose: "existingAccount",
                        },
                    },
                    channel: "email",
                    sentTo: "e***@contoso.com",
                    codeLength: 8,
                });
            });
        });

        it("rejects a single-factor challenge after password verification", async () => {
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "challenge",
                continuationToken: "ct-single-factor",
                authenticationFactor: "singleFactor",
                methods: [
                    {
                        id: "email",
                        type: "email",
                        challengeHref: "https://endpoint/email/challenge",
                    },
                ],
            });

            await expect(
                client.submitSignInPassword({
                    correlationId,
                    continuationState: {
                        continuationToken: "ct-password",
                        scenario: "signIn",
                        scopes: ["openid", "profile", "offline_access"],
                        links: {
                            verify: "https://endpoint/password/verify",
                        },
                    },
                    password: "valid-password",
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
        });

        it("returns registration-required after password verification", async () => {
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "email",
                        enrollHref: "https://endpoint/enroll/email",
                    },
                    {
                        type: "phone",
                        channels: ["sms"],
                        enrollHref: "https://endpoint/enroll/phone",
                    },
                ],
            });

            const result = await client.submitSignInPassword({
                correlationId,
                continuationState: {
                    continuationToken: "ct-password",
                    scenario: "signIn",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {
                        verify: "https://endpoint/password/verify",
                    },
                },
                password: "valid-password",
            });

            expect(result).toMatchObject({
                type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
                continuationState: {
                    continuationToken: "ct-enroll",
                    scenario: "signIn",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {},
                },
                methods: [
                    {
                        type: "email",
                        enrollHref: "https://endpoint/enroll/email",
                    },
                    {
                        type: "phone",
                        channels: ["sms"],
                        enrollHref: "https://endpoint/enroll/phone",
                    },
                ],
            });
        });
    });

    describe("submitSignUpAttributes", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-attributes",
            scenario: "signUp",
            scopes: ["openid", "profile", "offline_access"],
            links: {
                submitAttributes: "https://endpoint/signup/submitattributes",
            },
        };

        it.each(["email", "EMAIL", "eMaIl"])(
            "rejects a submitted %s attribute before sending a request",
            async (attributeId) => {
                await expect(
                    client.submitSignUpAttributes({
                        correlationId,
                        continuationState,
                        attributes: { [attributeId]: "" },
                    })
                ).rejects.toMatchObject({
                    error: "invalid_argument",
                    correlationId,
                    errorDescription:
                        "The argument 'attributes.email' is invalid.",
                });
                expect(apiClient.submitSignUpAttributes).not.toHaveBeenCalled();
            }
        );

        it("allows custom username attributes without treating them as email", async () => {
            apiClient.submitSignUpAttributes.mockResolvedValue({
                nextAction: "continue",
                continuationToken: "ct-complete",
            });
            const attributes = {
                username: "test-user",
                alternateEmail: "alternate@example.com",
            };

            await client.submitSignUpAttributes({
                correlationId,
                continuationState,
                attributes,
            });

            expect(apiClient.submitSignUpAttributes).toHaveBeenCalledWith(
                "https://endpoint/signup/submitattributes",
                {
                    continuationToken: "ct-attributes",
                    attributes,
                },
                expect.objectContaining({ correlationId })
            );
        });

        it("does not track omitted optional fields or case-fold custom identifiers", async () => {
            const attributes: UserAccountAttributes = { customField: "value" };
            attributes.givenName = undefined;
            apiClient.submitSignUpAttributes.mockResolvedValue({
                nextAction: "collectAttributes",
                continuationToken: "ct-next",
                attributes: [
                    { attributeId: "givenName" },
                    { attributeId: "CustomField" },
                ],
                submitAttributesHref: "https://endpoint/signup/next",
            });

            const result = await client.submitSignUpAttributes({
                correlationId,
                continuationState,
                attributes,
            });

            expect(result).toMatchObject({
                type: FLOW_ATTRIBUTES_REQUIRED_V2,
                continuationState: {
                    signUp: {
                        purpose: "newAccount",
                        submittedAttributeIds: ["customField"],
                    },
                },
            });
        });

        it("snapshots submitted identifiers before awaiting the response", async () => {
            const attributes: Record<string, string> = { givenName: "User" };
            apiClient.submitSignUpAttributes.mockImplementationOnce(
                async () => {
                    delete attributes.givenName;
                    attributes.city = "Later";
                    return {
                        nextAction: "continue",
                        continuationToken: "ct-complete",
                    };
                }
            );

            const result = await client.submitSignUpAttributes({
                correlationId,
                continuationState,
                attributes,
            });

            expect(result).toMatchObject({
                continuationState: {
                    signUp: {
                        purpose: "newAccount",
                        submittedAttributeIds: ["givenName"],
                    },
                },
            });
            expect(continuationState).not.toHaveProperty("signUp");
        });

        it("preserves sign-up context when later attributes return enrollment", async () => {
            apiClient.submitSignUpAttributes.mockResolvedValue({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "email",
                        enrollHref: "https://endpoint/enroll/email",
                    },
                ],
            });

            const result = await client.submitSignUpAttributes({
                correlationId,
                continuationState,
                attributes: { password: "valid-password" },
            });

            expect(result).toMatchObject({
                type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
                continuationState: {
                    continuationToken: "ct-enroll",
                    scenario: "signUp",
                    scopes: ["openid", "profile", "offline_access"],
                    links: {},
                    signUp: {
                        purpose: "newAccount",
                        submittedAttributeIds: ["password"],
                    },
                },
                methods: [{ type: "email" }],
            });
        });

        it("rejects unsupported sign-up enrollment methods", async () => {
            apiClient.submitSignUpAttributes.mockResolvedValue({
                nextAction: "enroll",
                continuationToken: "ct-enroll",
                methods: [
                    {
                        type: "phone",
                        channels: ["voice"],
                        enrollHref: "https://endpoint/enroll/phone",
                    },
                ],
            });

            await expect(
                client.submitSignUpAttributes({
                    correlationId,
                    continuationState,
                    attributes: { password: "valid-password" },
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
            });
        });

        it("submits mixed password and profile attributes in one request", async () => {
            const contextSpy = jest.spyOn(
                client as unknown as {
                    createRequestContext: (
                        apiId: number,
                        correlationId: string
                    ) => unknown;
                },
                "createRequestContext"
            );
            apiClient.submitSignUpAttributes.mockResolvedValue({
                nextAction: "continue",
                continuationToken: "ct-complete",
            });

            const result = await client.submitSignUpAttributes({
                correlationId,
                continuationState,
                attributes: {
                    password: "valid-password",
                    jobTitle: "Engineer",
                },
            });

            expect(apiClient.submitSignUpAttributes).toHaveBeenCalledWith(
                "https://endpoint/signup/submitattributes",
                {
                    continuationToken: "ct-attributes",
                    attributes: {
                        password: "valid-password",
                        jobTitle: "Engineer",
                    },
                },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);
            expect(contextSpy).toHaveBeenCalledWith(
                SIGN_UP_V2_SUBMIT_ATTRIBUTES,
                correlationId
            );
            expect(
                (result as FlowSignInContinuationRequiredResultV2)
                    .continuationState
            ).toEqual({
                continuationToken: "ct-complete",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {},
                signUp: {
                    purpose: "newAccount",
                    submittedAttributeIds: ["password", "jobTitle"],
                },
            });
        });

        it("returns another attributes-required result without retaining submitted values", async () => {
            apiClient.submitSignUpAttributes.mockResolvedValue({
                nextAction: "collectAttributes",
                continuationToken: "ct-attributes-2",
                attributes: [
                    {
                        attributeId: "city",
                        inputType: "text",
                        required: true,
                    },
                ],
                submitAttributesHref:
                    "https://endpoint/signup/submitattributes-2",
            });

            const result = await client.submitSignUpAttributes({
                correlationId,
                continuationState,
                attributes: {
                    username: "test-user",
                },
            });

            expect(result.type).toBe(FLOW_ATTRIBUTES_REQUIRED_V2);
            expect(
                (result as FlowAttributesRequiredResultV2).continuationState
            ).toEqual({
                continuationToken: "ct-attributes-2",
                scenario: "signUp",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    submitAttributes:
                        "https://endpoint/signup/submitattributes-2",
                },
                signUp: {
                    purpose: "newAccount",
                    submittedAttributeIds: ["username"],
                },
            });
            expect(continuationState).not.toHaveProperty("signUp");
        });

        it.each([true, false, undefined])(
            "rejects a first password request after profile submission with required=%s",
            async (required) => {
                apiClient.submitSignUpAttributes.mockResolvedValue({
                    nextAction: "collectAttributes",
                    continuationToken: "ct-password-next",
                    attributes: [
                        { attributeId: "PaSsWoRd", required },
                        { attributeId: "surname", required: true },
                    ],
                    submitAttributesHref:
                        "https://endpoint/signup/password-next",
                });

                await expect(
                    client.submitSignUpAttributes({
                        correlationId,
                        continuationState,
                        attributes: { givenName: "Test" },
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                    errorDescription:
                        "The sign-up API requested a password after profile submission, but password collection is only supported immediately after email verification.",
                    correlationId,
                });
            }
        );

        it.each([true, false, undefined])(
            "rejects another password request after a successful submission with required=%s",
            async (required) => {
                const requestedPasswordAttribute = {
                    attributeId: "PaSsWoRd",
                    inputType: "password",
                    required,
                };
                const attributes = [{ attributeId: "surname", required: true }];
                apiClient.submitSignUpAttributes.mockResolvedValue({
                    nextAction: "collectAttributes",
                    continuationToken: "ct-password-next",
                    attributes: [requestedPasswordAttribute, ...attributes],
                    submitAttributesHref:
                        "https://endpoint/signup/password-next",
                });

                await expect(
                    client.submitSignUpAttributes({
                        correlationId,
                        continuationState,
                        attributes: { password: "previous-password" },
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                    errorDescription:
                        "The sign-up API requested the password again after it was successfully submitted.",
                    correlationId,
                });
            }
        );

        it.each(["password", "PaSsWoRd", "givenName", "surname"])(
            "rejects collection of %s accepted in the current or an earlier submission",
            async (attributeId) => {
                const trackedContinuationState: FlowContinuationStateV2 = {
                    ...continuationState,
                    signUp: {
                        purpose: "newAccount",
                        submittedAttributeIds: ["password", "givenName"],
                    },
                };
                apiClient.submitSignUpAttributes.mockResolvedValue({
                    nextAction: "collectAttributes",
                    continuationToken: "ct-next",
                    attributes: [{ attributeId }, { attributeId: "city" }],
                    submitAttributesHref: "https://endpoint/signup/next",
                });

                await expect(
                    client.submitSignUpAttributes({
                        correlationId,
                        continuationState: trackedContinuationState,
                        attributes: { surname: "User" },
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                    correlationId,
                });
                expect(trackedContinuationState.signUp).toEqual({
                    purpose: "newAccount",
                    submittedAttributeIds: ["password", "givenName"],
                });
            }
        );

        it("leaves rejected submissions retryable and duplicate input errors to the API", async () => {
            const trackedContinuationState: FlowContinuationStateV2 = {
                ...continuationState,
                signUp: {
                    purpose: "newAccount",
                    submittedAttributeIds: ["givenName"],
                },
            };
            const error = new CustomAuthApiError(
                "invalid_attributes",
                "The submitted attributes were rejected.",
                correlationId
            );
            apiClient.submitSignUpAttributes
                .mockRejectedValueOnce(error)
                .mockResolvedValueOnce({
                    nextAction: "collectAttributes",
                    continuationToken: "ct-retry",
                    attributes: [{ attributeId: "city" }],
                    submitAttributesHref: "https://endpoint/signup/retry",
                });
            const attributes = {
                givenName: "Repeated",
                password: "rejected-password",
            };

            await expect(
                client.submitSignUpAttributes({
                    correlationId,
                    continuationState: trackedContinuationState,
                    attributes,
                })
            ).rejects.toBe(error);
            expect(apiClient.submitSignUpAttributes).toHaveBeenCalledWith(
                continuationState.links.submitAttributes,
                { continuationToken: "ct-attributes", attributes },
                expect.objectContaining({ correlationId })
            );

            const result = await client.submitSignUpAttributes({
                correlationId,
                continuationState: trackedContinuationState,
                attributes: { surname: "User" },
            });

            expect(result).toMatchObject({
                type: FLOW_ATTRIBUTES_REQUIRED_V2,
                continuationState: {
                    signUp: {
                        purpose: "newAccount",
                        submittedAttributeIds: ["givenName", "surname"],
                    },
                },
            });
            expect(trackedContinuationState.signUp).toEqual({
                purpose: "newAccount",
                submittedAttributeIds: ["givenName"],
            });
        });

        it.each(["verify", "unsupported"])(
            "rejects an unsupported attribute-submission transition: %s",
            async (nextAction) => {
                apiClient.submitSignUpAttributes.mockResolvedValue({
                    nextAction: nextAction as "continue",
                    continuationToken: "ct-unsupported",
                });

                await expect(
                    client.submitSignUpAttributes({
                        correlationId,
                        continuationState,
                        attributes: {
                            jobTitle: "Engineer",
                        },
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                });
            }
        );
    });

    describe("resendCode", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-challenge",
            scenario: "passwordReset",
            scopes: ["openid", "profile", "offline_access"],
            links: {
                challenge: "https://endpoint/challenge",
                verify: "https://endpoint/verify",
                resend: "https://endpoint/resend",
            },
        };

        it("preserves submitted-field history through resend and verification", async () => {
            const trackedContinuationState: FlowContinuationStateV2 = {
                ...continuationState,
                scenario: "signUp",
                signUp: {
                    purpose: "newAccount",
                    submittedAttributeIds: ["password", "givenName"],
                },
            };
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-resend",
                verifyHref: "https://endpoint/signup/verify-new",
                resendHref: "https://endpoint/signup/resend-new",
                type: "email",
                codeLength: 8,
            });
            apiClient.verifyChallenge.mockResolvedValue({
                nextAction: "collectAttributes",
                continuationToken: "ct-verified",
                attributes: [{ attributeId: "city" }],
                submitAttributesHref: "https://endpoint/signup/attributes-new",
            });

            const resendResult = await client.resendCode({
                correlationId,
                continuationState: trackedContinuationState,
            });
            const result = await client.submitCode({
                correlationId,
                continuationState: resendResult.continuationState,
                code: "12345678",
            });

            expect(resendResult.continuationState).toMatchObject({
                continuationToken: "ct-resend",
                signUp: trackedContinuationState.signUp,
            });
            expect(apiClient.verifyChallenge).toHaveBeenCalledWith(
                "https://endpoint/signup/verify-new",
                { continuationToken: "ct-resend", otp: "12345678" },
                expect.objectContaining({ correlationId })
            );
            expect(result).toMatchObject({
                type: FLOW_ATTRIBUTES_REQUIRED_V2,
                continuationState: {
                    continuationToken: "ct-verified",
                    scopes: trackedContinuationState.scopes,
                    links: {
                        submitAttributes:
                            "https://endpoint/signup/attributes-new",
                    },
                    signUp: trackedContinuationState.signUp,
                },
            });
        });

        it.each([
            {
                authenticationFactor: undefined,
                expectedApiId: SIGN_IN_V2_CHALLENGE,
            },
            {
                authenticationFactor: AuthenticationFactorV2.SINGLE_FACTOR,
                expectedApiId: SIGN_IN_V2_CHALLENGE,
            },
            {
                authenticationFactor: AuthenticationFactorV2.MULTI_FACTOR,
                expectedApiId: MFA_V2_RESEND_CHALLENGE,
            },
        ])(
            "uses resend API ID $expectedApiId for sign-in factor $authenticationFactor",
            async ({ authenticationFactor, expectedApiId }) => {
                apiClient.requestChallenge.mockResolvedValue({
                    nextAction: "verify",
                    continuationToken: "ct-challenge-2",
                    verifyHref: "https://endpoint/verify-2",
                    type: "email",
                });

                await client.resendCode({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        scenario: "signIn",
                    },
                    authenticationFactor,
                });

                const context = apiClient.requestChallenge.mock.calls[0][2];
                expect(
                    context.telemetryManager.generateCurrentRequestHeaderValue()
                ).toContain(`|${expectedApiId},`);
            }
        );

        it("re-requests the challenge and returns a code-required result", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge-2",
                verifyHref: "https://endpoint/verify-2",
                resendHref: "https://endpoint/resend-2",
                codeLength: 8,
                hint: "u***@contoso.com",
                type: "email",
            });

            const result = await client.resendCode({
                correlationId,
                continuationState,
            });

            expect(apiClient.requestChallenge).toHaveBeenCalledWith(
                "https://endpoint/resend",
                { continuationToken: "ct-challenge" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);

            const codeRequired = result as FlowCodeRequiredResultV2;
            expect(codeRequired.correlationId).toBe(correlationId);
            expect(codeRequired.codeLength).toBe(8);
            expect(codeRequired.sentTo).toBe("u***@contoso.com");
            expect(codeRequired.channel).toBe("email");
            expect(codeRequired.continuationState).toEqual({
                continuationToken: "ct-challenge-2",
                scenario: "passwordReset",
                scopes: ["openid", "profile", "offline_access"],
                links: {
                    challenge: "https://endpoint/challenge",
                    verify: "https://endpoint/verify-2",
                    resend: "https://endpoint/resend-2",
                },
            });
        });

        it("completes SMS risk verification before returning a code-required result", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "riskverify",
                continuationToken: "ct-risk",
                riskVerifyHref: "https://endpoint/risk/verify",
            });
            apiClient.verifyRisk.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-sms",
                verifyHref: "https://endpoint/sms/verify",
                resendHref: "https://endpoint/sms/resend",
                codeLength: 6,
                hint: "***1234",
                type: "sms",
            });

            const result = await client.resendCode({
                correlationId,
                continuationState,
            });

            expect(apiClient.verifyRisk).toHaveBeenCalledWith(
                "https://endpoint/risk/verify",
                { continuationToken: "ct-risk" },
                expect.objectContaining({ correlationId })
            );
            expect(result).toMatchObject({
                type: FLOW_CODE_REQUIRED_V2,
                channel: "sms",
                sentTo: "***1234",
                codeLength: 6,
            });
        });

        it("rejects an unsupported challenge next action", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "unsupported" as "verify",
                continuationToken: "ct-unsupported",
                verifyHref: "https://endpoint/unsupported",
            });

            await expect(
                client.resendCode({
                    correlationId,
                    continuationState,
                })
            ).rejects.toMatchObject({
                error: UNSUPPORTED_FLOW_TRANSITION,
                errorDescription:
                    "Challenge next action 'unsupported' is not supported.",
            });

            expect(apiClient.verifyRisk).not.toHaveBeenCalled();
        });

        it.each([undefined, "password", "push"])(
            "rejects a replacement challenge with non-code type %p",
            async (type) => {
                apiClient.requestChallenge.mockResolvedValue({
                    nextAction: "verify",
                    continuationToken: "ct-resend",
                    verifyHref: "https://endpoint/verify-new",
                    type,
                });

                await expect(
                    client.resendCode({
                        correlationId,
                        continuationState,
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                    correlationId,
                });
            }
        );

        it("uses the sign-up resend API ID for a sign-up challenge", async () => {
            const contextSpy = jest.spyOn(
                client as unknown as {
                    createRequestContext: (
                        apiId: number,
                        correlationId: string
                    ) => unknown;
                },
                "createRequestContext"
            );
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-sign-up-challenge-2",
                verifyHref: "https://endpoint/verify-2",
                resendHref: "https://endpoint/resend-2",
                codeLength: 8,
                type: "email",
            });

            await client.resendCode({
                correlationId,
                continuationState: {
                    ...continuationState,
                    scenario: "signUp",
                },
            });

            expect(contextSpy).toHaveBeenCalledWith(
                SIGN_UP_V2_RESEND_CODE,
                correlationId
            );
        });

        it("throws when the continuation is missing the resend link", async () => {
            await expect(
                client.resendCode({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        links: {},
                    },
                })
            ).rejects.toThrow();

            expect(apiClient.requestChallenge).not.toHaveBeenCalled();
        });

        it("preserves a future OTP channel returned by resend", async () => {
            apiClient.requestChallenge.mockResolvedValue({
                nextAction: "verify",
                continuationToken: "ct-challenge-2",
                verifyHref: "https://endpoint/verify-2",
                type: "sms",
            });

            const result = await client.resendCode({
                correlationId,
                continuationState,
            });

            expect(result.type).toBe(FLOW_CODE_REQUIRED_V2);
            if (result.type === FLOW_CODE_REQUIRED_V2) {
                expect(result.channel).toBe("sms");
            }
        });
    });

    describe("submitNewPassword", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-verify",
            scenario: "passwordReset",
            scopes: ["openid", "profile", "offline_access"],
            links: { update: "https://endpoint/update" },
        };

        it("offers enrollment after the password update is polled", async () => {
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll.mockResolvedValue({
                continuationToken: "ct-enroll",
                nextAction: "enroll",
                enrollmentMethods: [
                    { type: "email", enrollHref: "/enroll/email" },
                ],
            });

            const result = await client.submitNewPassword({
                correlationId,
                continuationState,
                newPassword: "new-valid-password",
            });

            expect(result.type).toBe(FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2);
            if (result.type === FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2) {
                expect(result.methods).toEqual([
                    { type: "email", enrollHref: "/enroll/email" },
                ]);
                expect(result.continuationState).toEqual({
                    ...continuationState,
                    continuationToken: "ct-enroll",
                    links: {},
                });
            }
            expect(apiClient.poll).toHaveBeenCalledTimes(1);
        });

        it("stops polling and offers enrollment after an in-progress response", async () => {
            jest.useFakeTimers();
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll
                .mockResolvedValueOnce({
                    continuationToken: "ct-poll",
                    nextAction: "poll",
                    pollHref: "https://endpoint/poll-next",
                })
                .mockResolvedValueOnce({
                    continuationToken: "ct-enroll",
                    nextAction: "enroll",
                    enrollmentMethods: [
                        {
                            type: "phone",
                            channels: ["sms"],
                            enrollHref: "/enroll/phone",
                        },
                    ],
                });

            const promise = client.submitNewPassword({
                correlationId,
                continuationState,
                newPassword: "new-valid-password",
            });

            await jest.advanceTimersByTimeAsync(1500);
            const result = await promise;

            expect(apiClient.poll).toHaveBeenCalledTimes(2);
            expect(apiClient.poll).toHaveBeenLastCalledWith(
                "https://endpoint/poll-next",
                { continuationToken: "ct-poll" },
                expect.objectContaining({ correlationId })
            );
            expect(result).toMatchObject({
                type: FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
                methods: [
                    {
                        type: "phone",
                        channels: ["sms"],
                        enrollHref: "/enroll/phone",
                    },
                ],
                continuationState: {
                    ...continuationState,
                    continuationToken: "ct-enroll",
                    links: {},
                },
            });
            expect(apiClient.enrollAuthMethod).not.toHaveBeenCalled();
            expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
            expect(jest.getTimerCount()).toBe(0);
        });

        it.each<ResetPasswordPollResultV2>([
            { continuationToken: "ct-poll", nextAction: "future-action" },
            {
                continuationToken: "ct-poll",
                nextAction: "future-action",
                pollHref: "https://endpoint/poll",
            },
            { continuationToken: "ct-poll", nextAction: "interactionRequired" },
            { continuationToken: "ct-enroll", nextAction: "enroll" },
        ])(
            "rejects unsupported poll result %j without retrying",
            async (pollResult) => {
                const errorSpy = jest.spyOn(
                    Reflect.get(client, "logger") as Logger,
                    "error"
                );
                apiClient.submitNewPassword.mockResolvedValue({
                    continuationToken: "ct-update",
                    pollHref: "https://endpoint/poll",
                });
                apiClient.poll.mockResolvedValue(pollResult);

                await expect(
                    client.submitNewPassword({
                        correlationId,
                        continuationState,
                        newPassword: "new-valid-password",
                    })
                ).rejects.toMatchObject({
                    error: UNSUPPORTED_FLOW_TRANSITION,
                    correlationId,
                });

                expect(apiClient.poll).toHaveBeenCalledTimes(1);
                expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
                expect(errorSpy).toHaveBeenCalledWith(
                    `Password reset poll next action '${pollResult.nextAction}' is not supported.`,
                    correlationId
                );
            }
        );

        it.each(["ct-update", "ct-poll-1"])(
            "uses the token provided by the API client (%s)",
            async (continuationToken) => {
                jest.useFakeTimers();
                apiClient.submitNewPassword.mockResolvedValue({
                    continuationToken: "ct-update",
                    pollHref: "https://endpoint/poll",
                });
                apiClient.poll
                    .mockResolvedValueOnce({
                        continuationToken,
                        nextAction: "poll",
                        pollHref: "https://endpoint/poll-next",
                    })
                    .mockResolvedValueOnce({
                        continuationToken,
                        nextAction: "continue",
                    });

                const promise = client.submitNewPassword({
                    correlationId,
                    continuationState,
                    newPassword: "new-valid-password",
                });
                await jest.advanceTimersByTimeAsync(1500);
                const result = await promise;

                expect(apiClient.poll).toHaveBeenLastCalledWith(
                    "https://endpoint/poll-next",
                    { continuationToken },
                    expect.objectContaining({ correlationId })
                );
                expect(result).toMatchObject({
                    type: FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
                    continuationState: {
                        ...continuationState,
                        continuationToken,
                        links: {},
                    },
                });
            }
        );

        it("submits the password, polls once, and returns sign-in-after-reset", async () => {
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll.mockResolvedValue({
                continuationToken: "ct-complete",
                nextAction: "continue",
            });

            const result = await client.submitNewPassword({
                correlationId,
                continuationState,
                newPassword: "new-valid-password",
            });

            expect(apiClient.submitNewPassword).toHaveBeenCalledWith(
                "https://endpoint/update",
                {
                    continuationToken: "ct-verify",
                    newPassword: "new-valid-password",
                },
                expect.objectContaining({ correlationId })
            );
            expect(apiClient.poll).toHaveBeenCalledTimes(1);
            expect(apiClient.poll).toHaveBeenCalledWith(
                "https://endpoint/poll",
                { continuationToken: "ct-update" },
                expect.objectContaining({ correlationId })
            );

            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);

            const signInRequired =
                result as FlowSignInContinuationRequiredResultV2;
            expect(signInRequired.correlationId).toBe(correlationId);
            expect(signInRequired.continuationState).toEqual({
                continuationToken: "ct-complete",
                scenario: "passwordReset",
                scopes: ["openid", "profile", "offline_access"],
                links: {},
            });
        });

        it("re-polls with the refreshed token until the reset completes", async () => {
            jest.useFakeTimers();
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll
                .mockResolvedValueOnce({
                    continuationToken: "ct-poll-1",
                    nextAction: "poll",
                    pollHref: "https://endpoint/poll",
                })
                .mockResolvedValueOnce({
                    continuationToken: "ct-complete",
                    nextAction: "continue",
                });

            const promise = client.submitNewPassword({
                correlationId,
                continuationState,
                newPassword: "new-valid-password",
            });

            // Advance past the 1.5s inter-attempt delay so the second poll runs.
            await jest.advanceTimersByTimeAsync(1500);
            const result = await promise;

            expect(apiClient.poll).toHaveBeenCalledTimes(2);
            // The second poll presents the token returned by the first poll.
            expect(apiClient.poll).toHaveBeenLastCalledWith(
                "https://endpoint/poll",
                { continuationToken: "ct-poll-1" },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);
        });

        it("follows a relocated poll href returned by an in-progress response", async () => {
            jest.useFakeTimers();
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll
                .mockResolvedValueOnce({
                    continuationToken: "ct-poll-1",
                    nextAction: "poll",
                    pollHref: "https://endpoint/poll-relocated",
                })
                .mockResolvedValueOnce({
                    continuationToken: "ct-complete",
                    nextAction: "continue",
                });

            const promise = client.submitNewPassword({
                correlationId,
                continuationState,
                newPassword: "new-valid-password",
            });

            await jest.advanceTimersByTimeAsync(1500);
            const result = await promise;

            expect(apiClient.poll).toHaveBeenCalledTimes(2);
            // First poll targets the update-supplied href.
            expect(apiClient.poll).toHaveBeenNthCalledWith(
                1,
                "https://endpoint/poll",
                { continuationToken: "ct-update" },
                expect.objectContaining({ correlationId })
            );
            // Second poll targets the relocated href with the refreshed token.
            expect(apiClient.poll).toHaveBeenNthCalledWith(
                2,
                "https://endpoint/poll-relocated",
                { continuationToken: "ct-poll-1" },
                expect.objectContaining({ correlationId })
            );
            expect(result.type).toBe(FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2);
        });
        it.each([
            ["enroll", FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2],
            ["continue", FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2],
        ])(
            "handles %s on the last allowed poll attempt",
            async (nextAction, resultType) => {
                jest.useFakeTimers();
                apiClient.submitNewPassword.mockResolvedValue({
                    continuationToken: "ct-update",
                    pollHref: "https://endpoint/poll",
                });
                for (let attempt = 1; attempt < 5; attempt++) {
                    apiClient.poll.mockResolvedValueOnce({
                        continuationToken: `ct-poll-${attempt}`,
                        nextAction: "poll",
                        pollHref: "https://endpoint/poll",
                    });
                }
                apiClient.poll.mockResolvedValueOnce({
                    nextAction,
                    continuationToken: "ct-final",
                    enrollmentMethods:
                        nextAction === "enroll"
                            ? [{ type: "email", enrollHref: "/enroll/email" }]
                            : undefined,
                });

                const promise = client.submitNewPassword({
                    correlationId,
                    continuationState,
                    newPassword: "new-valid-password",
                });
                await jest.advanceTimersByTimeAsync(1500 * 4);

                await expect(promise).resolves.toMatchObject({
                    type: resultType,
                    continuationState: {
                        continuationToken: "ct-final",
                        scenario: continuationState.scenario,
                        scopes: continuationState.scopes,
                    },
                });
                expect(apiClient.poll).toHaveBeenCalledTimes(5);
                expect(jest.getTimerCount()).toBe(0);
                expect(apiClient.completeWithTokens).not.toHaveBeenCalled();
            }
        );

        it("throws a timeout error when polling never completes", async () => {
            jest.useFakeTimers();
            const errorSpy = jest.spyOn(
                Reflect.get(client, "logger") as Logger,
                "error"
            );
            apiClient.submitNewPassword.mockResolvedValue({
                continuationToken: "ct-update",
                pollHref: "https://endpoint/poll",
            });
            apiClient.poll.mockResolvedValue({
                continuationToken: "ct-poll",
                nextAction: "poll",
                pollHref: "https://endpoint/poll",
            });

            const promise = client.submitNewPassword({
                correlationId,
                continuationState,
                newPassword: "new-valid-password",
            });
            const assertion = expect(promise).rejects.toMatchObject({
                error: RESET_PASSWORD_TIMEOUT,
            });

            // Drive all inter-attempt delays (4 gaps across 5 attempts).
            await jest.advanceTimersByTimeAsync(1500 * 5);
            await assertion;

            expect(apiClient.poll).toHaveBeenCalledTimes(5);
            expect(errorSpy).toHaveBeenCalledWith(
                "The password reset did not complete within the allotted number of polling attempts.",
                correlationId
            );
        });

        it("throws when the continuation is missing the update link", async () => {
            await expect(
                client.submitNewPassword({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        links: {},
                    },
                    newPassword: "new-valid-password",
                })
            ).rejects.toThrow();

            expect(apiClient.submitNewPassword).not.toHaveBeenCalled();
        });
    });

    describe("signInWithContinuation", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-complete",
            scenario: "passwordReset",
            scopes: ["User.Read", "openid", "profile", "offline_access"],
            links: {},
        };

        const tokenResponse = {
            token_type: "Bearer",
            expires_in: 3600,
            access_token: "at",
            refresh_token: "rt",
            scope: "openid profile offline_access",
            id_token: "id",
            client_info: "ci",
        };

        // The account/cache building is msal-common's concern; stub the shared handler so the test
        // covers only this client's wiring (redeem -> handle -> completed envelope).
        const fakeAuthResult = { account: { homeAccountId: "uid.utid" } };

        it("redeems the continuation and returns a completed result with default scopes", async () => {
            apiClient.completeWithTokens.mockResolvedValue(tokenResponse);
            const handleSpy = jest
                .spyOn(
                    client as unknown as {
                        handleTokenResponse: (
                            ...args: unknown[]
                        ) => Promise<unknown>;
                    },
                    "handleTokenResponse"
                )
                .mockResolvedValue(fakeAuthResult);

            const result = await client.signInWithContinuation({
                correlationId,
                continuationState,
            });

            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                {
                    continuationToken: "ct-complete",
                },
                expect.objectContaining({ correlationId })
            );
            expect(handleSpy).toHaveBeenCalledWith(
                tokenResponse,
                continuationState.scopes,
                correlationId,
                expect.any(Number)
            );

            expect(result.type).toBe(FLOW_COMPLETED_V2);
            const completed = result as FlowCompletedResultV2;
            expect(completed.correlationId).toBe(correlationId);
            expect(completed.authenticationResult).toBe(fakeAuthResult);
        });

        it("uses the sign-in-after-sign-up API ID for sign-up continuation", async () => {
            apiClient.completeWithTokens.mockResolvedValue(tokenResponse);
            const handleSpy = jest
                .spyOn(
                    client as unknown as {
                        handleTokenResponse: (
                            ...args: unknown[]
                        ) => Promise<unknown>;
                    },
                    "handleTokenResponse"
                )
                .mockResolvedValue(fakeAuthResult);

            await client.signInWithContinuation({
                correlationId,
                continuationState: {
                    ...continuationState,
                    scenario: "signUp",
                },
            });

            expect(handleSpy).toHaveBeenCalledWith(
                tokenResponse,
                continuationState.scopes,
                correlationId,
                SIGN_UP_V2_COMPLETE
            );
        });

        it("uses the requested scopes when the token response omits scope", async () => {
            const tokenResponseWithoutScope = {
                token_type: "Bearer",
                expires_in: 3600,
                access_token: "at",
                refresh_token: "rt",
                id_token: "id",
                client_info: "ci",
            };
            apiClient.completeWithTokens.mockResolvedValue(
                tokenResponseWithoutScope
            );
            const handleServerTokenResponseSpy = jest
                .spyOn(
                    (
                        client as unknown as {
                            tokenResponseHandler: {
                                handleServerTokenResponse: (
                                    ...args: unknown[]
                                ) => Promise<unknown>;
                            };
                        }
                    ).tokenResponseHandler,
                    "handleServerTokenResponse"
                )
                .mockResolvedValue(fakeAuthResult);

            const result = await client.signInWithContinuation({
                correlationId,
                continuationState,
            });

            expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                {
                    continuationToken: "ct-complete",
                },
                expect.objectContaining({ correlationId })
            );
            expect(handleServerTokenResponseSpy).toHaveBeenCalledWith(
                tokenResponseWithoutScope,
                expect.anything(),
                expect.any(Number),
                expect.objectContaining({
                    scopes: continuationState.scopes,
                }),
                expect.any(Number)
            );
            expect(result.type).toBe(FLOW_COMPLETED_V2);
        });

        it("uses token response scopes when they are returned", async () => {
            apiClient.completeWithTokens.mockResolvedValue({
                ...tokenResponse,
                scope: "api.read api.write",
            });
            const handleServerTokenResponseSpy = jest
                .spyOn(
                    (
                        client as unknown as {
                            tokenResponseHandler: {
                                handleServerTokenResponse: (
                                    ...args: unknown[]
                                ) => Promise<unknown>;
                            };
                        }
                    ).tokenResponseHandler,
                    "handleServerTokenResponse"
                )
                .mockResolvedValue(fakeAuthResult);

            await client.signInWithContinuation({
                correlationId,
                continuationState,
            });

            expect(handleServerTokenResponseSpy).toHaveBeenCalledWith(
                expect.objectContaining({ scope: "api.read api.write" }),
                expect.anything(),
                expect.any(Number),
                expect.objectContaining({
                    scopes: ["api.read", "api.write"],
                }),
                expect.any(Number)
            );
        });
    });

    describe("JIT authentication-method registration", () => {
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: "ct-enroll",
            scenario: "signIn",
            scopes: ["User.Read", "openid", "profile", "offline_access"],
            links: {
                verify: "/signin/verify",
            },
        };
        const rawMethods = [
            {
                type: "email",
                enrollHref: "/enroll/email",
            },
            {
                type: "phone",
                channels: ["voice", "sms"],
                enrollHref: "/enroll/sms",
            },
        ];
        const createRegistrationRequiredResult = (
            parameters: FlowAuthMethodRegistrationRequiredParamsV2
        ): FlowAuthMethodRegistrationRequiredResultV2 =>
            (
                client as unknown as {
                    createAuthMethodRegistrationRequiredResult: (
                        parameters: FlowAuthMethodRegistrationRequiredParamsV2
                    ) => FlowAuthMethodRegistrationRequiredResultV2;
                }
            ).createAuthMethodRegistrationRequiredResult(parameters);

        const createRegistrationRequired = () =>
            createRegistrationRequiredResult({
                correlationId,
                continuationState,
                methods: rawMethods,
            });

        it("returns supported methods in server order", () => {
            const first = createRegistrationRequired();
            const second = createRegistrationRequired();

            expect(first.type).toBe(FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2);
            expect(first.methods).toEqual([
                {
                    type: "email",
                    enrollHref: "/enroll/email",
                },
                {
                    type: "phone",
                    channels: ["sms"],
                    enrollHref: "/enroll/sms",
                },
            ]);
            expect(second.methods).toEqual(first.methods);
            expect(first.continuationState).toBe(continuationState);
        });

        it("filters unsupported options while preserving supported methods in server order", () => {
            const result = createRegistrationRequiredResult({
                correlationId,
                continuationState,
                methods: [
                    rawMethods[1],
                    {
                        type: "phone",
                        channels: ["voice"],
                        enrollHref: "/enroll/voice",
                    },
                    {
                        type: "unknown",
                        enrollHref: "/enroll/unknown",
                    },
                    rawMethods[0],
                ],
            });

            expect(result.methods).toEqual([
                {
                    type: "phone",
                    channels: ["sms"],
                    enrollHref: "/enroll/sms",
                },
                {
                    type: "email",
                    enrollHref: "/enroll/email",
                },
            ]);
            expect(result.continuationState).toBe(continuationState);
        });

        it("fails when the only method type is unsupported", () => {
            expect(() =>
                createRegistrationRequiredResult({
                    correlationId,
                    continuationState,
                    methods: [
                        {
                            type: "unknown",
                            enrollHref: "/enroll/unknown",
                        },
                    ],
                })
            ).toThrow();
        });

        it.each([[[]], [["voice"]], [["SMS"]]] as [string[]][])(
            "fails when a phone method has unsupported channels %j",
            (channels) => {
                expect(() =>
                    createRegistrationRequiredResult({
                        correlationId,
                        continuationState,
                        methods: [
                            {
                                type: "phone",
                                channels,
                                enrollHref: "/enroll/phone",
                            },
                        ],
                    })
                ).toThrow();
            }
        );

        it("fails when no enrollment methods are provided", () => {
            expect(() =>
                createRegistrationRequiredResult({
                    correlationId,
                    continuationState,
                    methods: [],
                })
            ).toThrow();
        });

        it.each(["email", "phone"])(
            "rejects a malformed supported %s method alongside a valid method",
            (type) => {
                expect(() =>
                    createRegistrationRequiredResult({
                        correlationId,
                        continuationState,
                        methods: [
                            rawMethods[0],
                            {
                                type,
                                channels: ["sms"],
                                enrollHref: "",
                            },
                        ],
                    })
                ).toThrow();
            }
        );

        it("ignores channels on an email method", () => {
            const result = createRegistrationRequiredResult({
                correlationId,
                continuationState,
                methods: [
                    {
                        type: "email",
                        channels: ["sms"],
                        enrollHref: "/enroll/email",
                    },
                ],
            });

            expect(result.methods).toEqual([
                {
                    type: "email",
                    enrollHref: "/enroll/email",
                },
            ]);
        });

        it("fails when a phone method omits channels", () => {
            expect(() =>
                createRegistrationRequiredResult({
                    correlationId,
                    continuationState,
                    methods: [
                        {
                            type: "phone",
                            enrollHref: "/enroll/phone",
                        },
                    ],
                })
            ).toThrow();
        });

        it("rejects a selected method without an enrollment link", async () => {
            const required = createRegistrationRequired();

            await expect(
                client.registerAuthMethod({
                    correlationId,
                    continuationState: required.continuationState,
                    method: {
                        ...required.methods[0],
                        enrollHref: "",
                    },
                    verificationContact: "user@contoso.com",
                })
            ).rejects.toThrow();

            expect(apiClient.enrollAuthMethod).not.toHaveBeenCalled();
        });

        it("maps email registration and preserves continuation context", async () => {
            const required = createRegistrationRequired();
            const contextSpy = jest.spyOn(
                client as unknown as {
                    createRequestContext: (
                        apiId: number,
                        correlationId: string
                    ) => unknown;
                },
                "createRequestContext"
            );
            apiClient.enrollAuthMethod.mockResolvedValue({
                nextAction: "activate",
                continuationToken: "ct-activate",
                hint: "u***@contoso.com",
                codeLength: 6,
                activateHref: "/activate/email",
                resendHref: "/resend/email",
            });

            const result = await client.registerAuthMethod({
                correlationId,
                continuationState: required.continuationState,
                method: required.methods[0],
                verificationContact: "user@contoso.com",
            });

            expect(apiClient.enrollAuthMethod).toHaveBeenCalledWith(
                "/enroll/email",
                {
                    continuationToken: "ct-enroll",
                    email: "user@contoso.com",
                },
                expect.objectContaining({ correlationId })
            );
            expect(contextSpy).toHaveBeenCalledWith(
                JIT_V2_ENROLL_AUTH_METHOD,
                correlationId
            );
            expect(result.type).toBe(FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2);
            expect(result).toMatchObject({
                sentTo: "u***@contoso.com",
                codeLength: 6,
                continuationState: {
                    continuationToken: "ct-activate",
                    scenario: "signIn",
                    scopes: continuationState.scopes,
                    links: {
                        activate: "/activate/email",
                        resend: "/resend/email",
                    },
                },
            });
        });

        it("maps phone registration using the response SMS channel", async () => {
            const required = createRegistrationRequired();
            apiClient.enrollAuthMethod.mockResolvedValue({
                nextAction: "activate",
                continuationToken: "ct-activate",
                codeLength: 6,
                activateHref: "/activate/sms",
                resendHref: "/resend/sms",
            });

            await client.registerAuthMethod({
                correlationId,
                continuationState: required.continuationState,
                method: required.methods[1],
                verificationContact: "+15555550123",
            });

            expect(apiClient.enrollAuthMethod).toHaveBeenCalledWith(
                "/enroll/sms",
                {
                    continuationToken: "ct-enroll",
                    phoneNumber: "+15555550123",
                    channel: "sms",
                },
                expect.objectContaining({ correlationId })
            );
        });

        it.each([undefined, "/resend/email"])(
            "activates and completes through the token path with resend href %s",
            async (resendHref) => {
                const required = createRegistrationRequired();
                const contextSpy = jest.spyOn(
                    client as unknown as {
                        createRequestContext: (
                            apiId: number,
                            correlationId: string
                        ) => unknown;
                    },
                    "createRequestContext"
                );
                apiClient.enrollAuthMethod.mockResolvedValue({
                    nextAction: "activate",
                    continuationToken: "ct-activate",
                    codeLength: 6,
                    activateHref: "/activate/email",
                    resendHref,
                });
                const verification = await client.registerAuthMethod({
                    correlationId,
                    continuationState: required.continuationState,
                    method: required.methods[0],
                    verificationContact: "user@contoso.com",
                });
                apiClient.activateAuthMethod.mockResolvedValue({
                    nextAction: "continue",
                    continuationToken: "ct-complete",
                });
                apiClient.completeWithTokens.mockResolvedValue({
                    token_type: "Bearer",
                    expires_in: 3600,
                    access_token: "at",
                    refresh_token: "rt",
                    scope: "openid profile offline_access",
                    id_token: "id",
                    client_info: "ci",
                });
                jest.spyOn(
                    client as unknown as {
                        handleTokenResponse: (
                            ...args: unknown[]
                        ) => Promise<unknown>;
                    },
                    "handleTokenResponse"
                ).mockResolvedValue({
                    account: { homeAccountId: "uid.utid" },
                });

                const result = await client.verifyAuthMethodRegistration({
                    correlationId,
                    continuationState: verification.continuationState,
                    code: "123456",
                });

                expect(apiClient.activateAuthMethod).toHaveBeenCalledWith(
                    "/activate/email",
                    {
                        continuationToken: "ct-activate",
                        otp: "123456",
                    },
                    expect.objectContaining({ correlationId })
                );
                expect(contextSpy).toHaveBeenCalledWith(
                    JIT_V2_SUBMIT_CHALLENGE,
                    correlationId
                );
                expect(apiClient.completeWithTokens).toHaveBeenCalledWith(
                    {
                        continuationToken: "ct-complete",
                    },
                    expect.objectContaining({ correlationId })
                );
                expect(result.type).toBe(FLOW_COMPLETED_V2);
            }
        );

        it("rejects resend without a link before sending a request", async () => {
            await expect(
                client.resendAuthMethodRegistrationChallenge({
                    correlationId,
                    continuationState: {
                        ...continuationState,
                        links: { activate: "/activate/email" },
                    },
                })
            ).rejects.toMatchObject({
                error: CONTINUATION_LINK_MISSING,
            });

            expect(
                apiClient.resendAuthMethodRegistrationChallenge
            ).not.toHaveBeenCalled();
        });

        it("resends through the retained server href with only the continuation token", async () => {
            const required = createRegistrationRequired();
            const contextSpy = jest.spyOn(
                client as unknown as {
                    createRequestContext: (
                        apiId: number,
                        correlationId: string
                    ) => unknown;
                },
                "createRequestContext"
            );
            apiClient.enrollAuthMethod.mockResolvedValueOnce({
                nextAction: "activate",
                continuationToken: "ct-activate",
                hint: "u***@contoso.com",
                codeLength: 6,
                activateHref: "/activate/email",
                resendHref: "/resend/email",
            });
            const verification = await client.registerAuthMethod({
                correlationId,
                continuationState: required.continuationState,
                method: required.methods[0],
                verificationContact: "user@contoso.com",
            });
            apiClient.resendAuthMethodRegistrationChallenge.mockResolvedValue({
                nextAction: "activate",
                continuationToken: "ct-resend",
                hint: "u***@contoso.com",
                codeLength: 8,
                activateHref: "/activate/email/new",
                resendHref: "/resend/email/new",
            });

            const result = await client.resendAuthMethodRegistrationChallenge({
                correlationId,
                continuationState: verification.continuationState,
            });

            expect(
                apiClient.resendAuthMethodRegistrationChallenge
            ).toHaveBeenCalledWith(
                "/resend/email",
                {
                    continuationToken: "ct-activate",
                },
                expect.objectContaining({ correlationId })
            );
            expect(contextSpy).toHaveBeenCalledWith(
                JIT_V2_RESEND_CHALLENGE,
                correlationId
            );
            expect(result).toMatchObject({
                type: FLOW_AUTH_METHOD_VERIFICATION_REQUIRED_V2,
                codeLength: 8,
                continuationState: {
                    continuationToken: "ct-resend",
                    links: {
                        activate: "/activate/email/new",
                        resend: "/resend/email/new",
                    },
                },
            });
        });
    });
});
