/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthPublicClientApplication } from "../../../src/custom_auth/CustomAuthPublicClientApplication.js";
import { CustomAuthStandardController } from "../../../src/custom_auth/controller/CustomAuthStandardController.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../src/custom_auth/core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
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
                    claims: '{"id_token":{}}',
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
});
