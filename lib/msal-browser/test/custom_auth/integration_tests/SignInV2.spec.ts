/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { AuthenticationMethodSelectionRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/AuthenticationMethodSelectionRequiredStateV2.js";
import {
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    SIGN_IN_UNSUPPORTED,
} from "../../../src/custom_auth/core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
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

describe("Sign-in V2 entry", () => {
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

    it("returns first-factor method selection from signInV2", async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce(buildResponse(ENTRY_RESPONSE))
            .mockResolvedValueOnce(buildResponse(START_RESPONSE));

        const result = await app.signInV2({
            username: "user@contoso.com",
            scopes: ["User.Read"],
            claims: '{"id_token":{}}',
        });

        expect(result.isFailed()).toBe(false);
        expect(
            result.isState("authenticationMethodSelectionRequired")
        ).toBe(true);
        expect(result.state).toBeInstanceOf(
            AuthenticationMethodSelectionRequiredStateV2
        );
        expect(result.scenario).toBe("signIn");
        if (result.isState("authenticationMethodSelectionRequired")) {
            expect(result.state.methods).toEqual([
                expect.objectContaining({
                    id: "password-1",
                    type: "password",
                }),
            ]);
        }
        expect(fetch).toHaveBeenCalledTimes(2);
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
        expect(result.error?.errorData.error).toBe(
            NO_AUTHENTICATION_METHODS
        );
    });

    it.each([undefined, "unknownFactor"])(
        "fails when the authentication factor is %s",
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
                );

            const result = await app.signInV2({
                username: "user@contoso.com",
            });

            expect(result.isFailed()).toBe(true);
            expect(result.error?.errorData.error).toBe(
                INVALID_HAL_RESPONSE
            );
        }
    );
});
