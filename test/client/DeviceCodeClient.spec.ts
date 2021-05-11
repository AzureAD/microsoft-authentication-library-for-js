import { expect } from "chai";
import sinon from "sinon";
import {
    Authority,
    ClientAuthErrorMessage,
    Constants,
    DeviceCodeClient,
    CommonDeviceCodeRequest,
    ClientConfiguration,
    AuthToken,
} from "../../src";
import {
    AUTHENTICATION_RESULT, AUTHORIZATION_PENDING_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEVICE_CODE_EXPIRED_RESPONSE,
    DEVICE_CODE_RESPONSE,
    TEST_CONFIG,
    TEST_DATA_CLIENT_INFO,
    TEST_URIS,
    TEST_POP_VALUES,
    CORS_SIMPLE_REQUEST_HEADERS,
    RANDOM_TEST_GUID
} from "../test_kit/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, ThrottlingConstants } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";

describe("DeviceCodeClient unit tests", async () => {
    let config: ClientConfiguration;

    before(() => {
        sinon.restore();
    });

    beforeEach(async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
        // Set up required objects and mocked return values
        const testState = `eyAiaWQiOiAidGVzdGlkIiwgInRzIjogMTU5Mjg0NjQ4MiB9${Constants.RESOURCE_DELIM}userState`;
        const decodedLibState = `{ "id": "testid", "ts": 1592846482 }`;
        config.cryptoInterface.base64Decode = (input: string): string => {
            switch (input) {
                case TEST_POP_VALUES.ENCODED_REQ_CNF:
                        return TEST_POP_VALUES.DECODED_REQ_CNF;
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
                case TEST_POP_VALUES.DECODED_REQ_CNF:
                    return TEST_POP_VALUES.ENCODED_REQ_CNF;
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

    describe("Constructor", () => {

        it("creates a DeviceCodeClient", async () => {
            const client = new DeviceCodeClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof DeviceCodeClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Acquire a token", async () => {
        it("Does not add headers that do not qualify for a simple request", (done) => {
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").callsFake((tokenEndpoint: string, queryString: string, headers: Record<string, string>) => {
                const headerNames = Object.keys(headers);
                headerNames.forEach((name) => {
                    expect(CORS_SIMPLE_REQUEST_HEADERS).contains(name.toLowerCase());
                });
    
                done();
                return AUTHENTICATION_RESULT;
            });

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY, 
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID
            };

            const client = new DeviceCodeClient(config);
            client.acquireToken(request);
        }).timeout(6000);

        it("Acquires a token successfully", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(DeviceCodeClient.prototype, <any>"createQueryString");
            const createTokenRequestBodySpy = sinon.spy(DeviceCodeClient.prototype, <any>"createTokenRequestBody");

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID
            };

            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);

            // Check that device code url is correct
            expect(queryStringSpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(queryStringSpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).to.deep.eq(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(GrantType.DEVICE_CODE_GRANT));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(DEVICE_CODE_RESPONSE.deviceCode);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);

        }).timeout(6000);

        it("Adds claims to request", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(DeviceCodeClient.prototype, <any>"createQueryString");
            const createTokenRequestBodySpy = sinon.spy(DeviceCodeClient.prototype, <any>"createTokenRequestBody");

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                claims: TEST_CONFIG.CLAIMS,
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID
            };

            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);

            // Check that device code url is correct
            expect(queryStringSpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(queryStringSpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).to.deep.eq(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(GrantType.DEVICE_CODE_GRANT));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(DEVICE_CODE_RESPONSE.deviceCode);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);
        }).timeout(6000);

        it("Does not add claims to request if empty object passed", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(DeviceCodeClient.prototype, <any>"createQueryString");
            const createTokenRequestBodySpy = sinon.spy(DeviceCodeClient.prototype, <any>"createTokenRequestBody");

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                claims: "{ }",
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID
            };

            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);

            // Check that device code url is correct
            expect(queryStringSpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(queryStringSpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).to.deep.eq(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(GrantType.DEVICE_CODE_GRANT));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(DEVICE_CODE_RESPONSE.deviceCode);
            expect(createTokenRequestBodySpy.returnValues[0]).to.not.contain(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`);
        }).timeout(6000);

        it("Acquires a token successfully after authorization_pending error", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            const tokenRequestStub = sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint");

            tokenRequestStub.onFirstCall().resolves(AUTHORIZATION_PENDING_RESPONSE);
            tokenRequestStub.onSecondCall().resolves(AUTHENTICATION_RESULT);

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID
            };

            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);
        }).timeout(12000);
    });

    describe("Device code exceptions", () => {

        it("Throw device code flow cancelled exception if DeviceCodeRequest.cancel=true", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID
            };

            const client = new DeviceCodeClient(config);
            request.cancel = true;
            await expect(client.acquireToken(request)).to.be.rejectedWith(`${ClientAuthErrorMessage.DeviceCodePollingCancelled.desc}`);
        }).timeout(6000);

        it("Throw device code expired exception if device code is expired", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_EXPIRED_RESPONSE);

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).to.be.rejectedWith(`${ClientAuthErrorMessage.DeviceCodeExpired.desc}`);
        }).timeout(6000);

        it("Throw device code expired exception if the timeout expires", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            const tokenRequestStub = sinon
            .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
            .onFirstCall().resolves(AUTHORIZATION_PENDING_RESPONSE)

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
                correlationId: RANDOM_TEST_GUID,
                timeout: DEVICE_CODE_RESPONSE.interval, // Setting a timeout equal to the interval polling time to allow for one call to the token endpoint 
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).to.be.rejectedWith(`${ClientAuthErrorMessage.userTimeoutReached.desc}`);
            await expect(tokenRequestStub.callCount).to.equal(1);
        }).timeout(15000);
    });
});
