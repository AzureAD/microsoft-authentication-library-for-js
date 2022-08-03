import sinon from "sinon";
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
    RANDOM_TEST_GUID,
    SERVER_UNEXPECTED_ERROR
} from "../test_kit/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType, ThrottlingConstants, Constants } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { Authority } from "../../src/authority/Authority";
import { AuthToken } from "../../src/account/AuthToken";
import { DeviceCodeClient } from "../../src/client/DeviceCodeClient";
import { CommonDeviceCodeRequest } from "../../src/request/CommonDeviceCodeRequest";
import { ClientAuthError } from "../../src/error/ClientAuthError";
import { AuthError } from "../../src";

describe("DeviceCodeClient unit tests", () => {
    let config: ClientConfiguration;

    beforeAll(() => {
        sinon.restore();
    });

    beforeEach(async () => {
        sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
        // Set up required objects and mocked return values
        const decodedLibState = `{ "id": "testid", "ts": 1592846482 }`;
        // @ts-ignore
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

        // @ts-ignore
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
            expect(client).not.toBeNull();
            expect(client instanceof DeviceCodeClient).toBe(true);
            expect(client instanceof BaseClient).toBe(true);
        });
    });

    describe("Acquire a token", () => {
        it("Does not add headers that do not qualify for a simple request", (done) => {
            jest.setTimeout(6000);
            // For more information about this test see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").callsFake((tokenEndpoint: string, queryString: string, headers: Record<string, string>) => {
                const headerNames = Object.keys(headers);
                headerNames.forEach((name) => {
                    expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(expect.arrayContaining([name.toLowerCase()]));
                });
    
                done();
                return AUTHENTICATION_RESULT;
            });

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: () => {}
            };

            const client = new DeviceCodeClient(config);
            client.acquireToken(request);
        });

        it("Acquires a token successfully", async () => {
            jest.setTimeout(6000);
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(DeviceCodeClient.prototype, <any>"createQueryString");
            const createTokenRequestBodySpy = sinon.spy(DeviceCodeClient.prototype, <any>"createTokenRequestBody");

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            // Check that device code url is correct
            const returnVal = await queryStringSpy.returnValues[0] as string;
            expect(returnVal.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
            expect(returnVal.includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            const tokenReturnVal = await createTokenRequestBodySpy.returnValues[0] as string;
            expect(tokenReturnVal.includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
            expect(tokenReturnVal.includes(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID))).toBe(true);
            expect(tokenReturnVal.includes(encodeURIComponent(GrantType.DEVICE_CODE_GRANT))).toBe(true);
            expect(tokenReturnVal.includes(DEVICE_CODE_RESPONSE.deviceCode)).toBe(true);
            expect(tokenReturnVal.includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
            expect(tokenReturnVal.includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
            expect(tokenReturnVal.includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
            expect(tokenReturnVal.includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
            expect(tokenReturnVal.includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
            expect(tokenReturnVal.includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
            expect(tokenReturnVal.includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);

        });

        it("Adds claims to request", async () => {
            jest.setTimeout(6000);
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
            await client.acquireToken(request);

            // Check that device code url is correct
            expect(queryStringSpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
            expect(queryStringSpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID))).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(encodeURIComponent(GrantType.DEVICE_CODE_GRANT))).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(DEVICE_CODE_RESPONSE.deviceCode)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        });

        it("Does not add claims to request if empty object passed", async () => {
            jest.setTimeout(6000);
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
            await client.acquireToken(request);

            // Check that device code url is correct
            expect(queryStringSpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
            expect(queryStringSpy.returnValues[0].includes(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`)).toBe(true);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID))).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(encodeURIComponent(GrantType.DEVICE_CODE_GRANT))).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(DEVICE_CODE_RESPONSE.deviceCode)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.CLAIMS}=${encodeURIComponent(TEST_CONFIG.CLAIMS)}`)).toBe(false);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`)).toBe(true);
            expect(createTokenRequestBodySpy.returnValues[0].includes(`${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`)).toBe(true);
        });

        it("Acquires a token successfully after authorization_pending error", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            const tokenRequestStub = sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint");

            tokenRequestStub.onFirstCall().resolves(AUTHORIZATION_PENDING_RESPONSE);
            tokenRequestStub.onSecondCall().resolves(AUTHENTICATION_RESULT);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: () => {}
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);
        }, 12000);
    });

    describe("Device code exceptions", () => {

        it("Throw device code flow cancelled exception if DeviceCodeRequest.cancel=true", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: () => {}
            };

            const client = new DeviceCodeClient(config);
            request.cancel = true;
            await expect(client.acquireToken(request)).rejects.toMatchObject(ClientAuthError.createDeviceCodeCancelledError());
        }, 6000);

        it("Throw device code expired exception if device code is expired", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_EXPIRED_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHORIZATION_PENDING_RESPONSE);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: () => {}
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(ClientAuthError.createDeviceCodeExpiredError());
        }, 6000);

        it("Throw device code expired exception if the timeout expires", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            const tokenRequestStub = sinon
            .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
            .onFirstCall().resolves(AUTHORIZATION_PENDING_RESPONSE)

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: () => {},
                timeout: DEVICE_CODE_RESPONSE.interval - 1, // Setting a timeout equal to the interval polling time minus one to allow for one call to the token endpoint 
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(ClientAuthError.createUserTimeoutReachedError());
            expect(tokenRequestStub.callCount).toBe(1);
        }, 15000);

        it("Throws if server throws an unexpected error", async () => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(SERVER_UNEXPECTED_ERROR);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: () => {}
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(AuthError.createPostRequestFailed("Service Unavailable"));
        }, 15000);
    });
});
