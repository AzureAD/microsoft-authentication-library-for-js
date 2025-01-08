/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignupApiClient } from "../../src/sign_up/SignupApiClient.js";
import { AuthFlowType } from "../../src/common/AuthFlowTypes.js";
import {
    SignUpStartRequest,
    SignUpChallengeRequest,
    SignUpContinueRequest,
    GrantType,
} from "../../src/sign_up/types/SignUpRequestTypes.js";
import {
    SignUpStartResponse,
    ChallengeResponse,
    SignUpContinueResponse,
    ChallengeType,
    BindingMethod,
    ChallengeChannel,
} from "../../src/sign_up/types/SignUpResponseTypes.js";
import { TenantConfig } from "../../src/common/TenantConfig.js";

jest.mock("../../src/common/BaseAuthClient.js");

describe("SignUpClient", () => {
    let signUpClient: SignupApiClient;

    beforeEach(() => {
        const teantConf: TenantConfig = {
            clientId: "test-client-id",
            tenantSubdomain: "test-tenant",
        };
        signUpClient = new SignupApiClient(teantConf);
    });

    it("should start the sign-up flow", async () => {
        const params: SignUpStartRequest = {
            username: "testuser",
            password: "password123",
            attributes: { age: "25" },
            challenge_type: "otp",
            client_id: "test-client-id",
        };
        const response: SignUpStartResponse = {
            continuation_token: "continuation_token",
        };
        (signUpClient.makeRequest as jest.Mock).mockResolvedValue(response);

        const result = await signUpClient.start(params);

        expect(signUpClient.makeRequest).toHaveBeenCalledWith(
            `${AuthFlowType.SIGN_UP}/${signUpClient.version}/start`,
            {
                username: params.username,
                password: params.password,
                attributes: JSON.stringify(params.attributes),
                challenge_type: params.challenge_type,
            },
        );
        expect(result).toEqual(response);
    });

    it("should request challenge", async () => {
        const params: SignUpChallengeRequest = {
            continuation_token: "token123",
            challenge_type: "otp",
            client_id: "test-client-id",
        };
        const response: ChallengeResponse = {
            interval: 1,
            continuation_token: "continuation_token",
            challenge_type: ChallengeType.OOB,
            binding_method: BindingMethod.PROMPT,
            challenge_channel: ChallengeChannel.EMAIL,
            challenge_target_label: "challenge_target_label",
            code_length: 6,
        };
        (signUpClient.makeRequest as jest.Mock).mockResolvedValue(response);

        const result = await signUpClient.requestChallenge(params);

        expect(signUpClient.makeRequest).toHaveBeenCalledWith(
            `${AuthFlowType.SIGN_UP}/${signUpClient.version}/challenge`,
            {
                continuation_token: params.continuation_token,
                challenge_type: params.challenge_type,
            },
        );
        expect(result).toEqual(response);
    });

    it("should continue the sign-up flow", async () => {
        const params: SignUpContinueRequest = {
            continuation_token: "token123",
            grant_type: "password",
            client_id: "client_id",
            oob: GrantType.OOB,
        };
        const response: SignUpContinueResponse = {
            continuation_token: "continuation_token",
            challenge_type: ChallengeType.OOB,
        };
        (signUpClient.makeRequest as jest.Mock).mockResolvedValue(response);

        const result = await signUpClient.continue(params);

        expect(signUpClient.makeRequest).toHaveBeenCalledWith(
            `${AuthFlowType.SIGN_UP}/${signUpClient.version}/continue`,
            {
                continuation_token: params.continuation_token,
                grant_type: params.grant_type,
                oob: params.oob,
            },
        );
        expect(result).toEqual(response);
    });
});
