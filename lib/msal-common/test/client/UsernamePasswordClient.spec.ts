/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { expect } from "chai";
import sinon from "sinon";
import {
    AUTHENTICATION_RESULT_DEFAULT_SCOPES,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
    TEST_TOKENS,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS
} from "../utils/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, Constants, PasswordGrantConstants } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { Authority } from "../../src/authority/Authority";
import { UsernamePasswordClient } from "../../src/client/UsernamePasswordClient";
import { UsernamePasswordRequest } from "../../src/request/UsernamePasswordRequest";
import { AuthToken } from "../../src/account/AuthToken";
import { ClientConfiguration } from "../../src";

describe("Username Password unit tests", () => {
    let config: ClientConfiguration;

    beforeEach(async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
        // Set up required objects and mocked return values
        const decodedLibState = `{ "id": "testid", "ts": 1592846482 }`;
        config.cryptoInterface.base64Decode = (input: string): string => {
            switch (input) {
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                case `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9`:
                    return decodedLibState;
                default:
                    return input;
            }
        };

        config.cryptoInterface.base64Encode = (input: string): string => {
            switch (input) {
                case "123-test-uid":
                    return "MTIzLXRlc3QtdWlk";
                case "456-test-utid":
                    return "NDU2LXRlc3QtdXRpZA==";
                case TEST_DATA_CLIENT_INFO.TEST_RAW_CLIENT_INFO:
                    return TEST_DATA_CLIENT_INFO.TEST_DECODED_CLIENT_INFO;
                default:
                    return input;
            }
        };

        // Set up stubs
        const idTokenClaims = {
            ver: "2.0",
            iss: `${TEST_URIS.DEFAULT_INSTANCE}9188040d-6c67-4c5b-b112-36a304b66dad/v2.0`,
            sub: "AAAAAAAAAAAAAAAAAAAAAIkzqFVrSaSaFHy782bbtaQ",
            exp: 1536361411,
            name: "Abe Lincoln",
            preferred_username: "AbeLi@microsoft.com",
            oid: "00000000-0000-0000-66f3-3332eca7ea81",
            tid: "3338040d-6c67-4c5b-b112-36a304b66dad",
            nonce: "123523",
        };
        sinon.stub(AuthToken, "extractTokenClaims").returns(idTokenClaims);
    });


    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", async () => {

        it("creates a UsernamePasswordClient", async () => {
            const client = new UsernamePasswordClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof UsernamePasswordClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    it("acquires a token", async () => {
        sinon.stub(UsernamePasswordClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT_DEFAULT_SCOPES);

        const createTokenRequestBodySpy = sinon.spy(UsernamePasswordClient.prototype, <any>"createTokenRequestBody");

        const client = new UsernamePasswordClient(config);
        const usernamePasswordRequest: UsernamePasswordRequest = {
            scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            username: "mock_name",
            password: "mock_password"
        };

        const authResult = await client.acquireToken(usernamePasswordRequest);
        const expectedScopes = [Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.OFFLINE_ACCESS_SCOPE, TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]];
        expect(authResult.scopes).to.deep.eq(expectedScopes);
        expect(authResult.idToken).to.deep.eq(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.id_token);
        expect(authResult.accessToken).to.deep.eq(AUTHENTICATION_RESULT_DEFAULT_SCOPES.body.access_token);
        expect(authResult.state).to.be.empty;

        expect(createTokenRequestBodySpy.calledWith(usernamePasswordRequest)).to.be.true;

        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE[0]}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.GRANT_TYPE}=${encodeURIComponent(GrantType.RESOURCE_OWNER_PASSWORD_GRANT)}`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${PasswordGrantConstants.username}=mock_name`);
        expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${PasswordGrantConstants.password}=mock_password`);
    });
});
