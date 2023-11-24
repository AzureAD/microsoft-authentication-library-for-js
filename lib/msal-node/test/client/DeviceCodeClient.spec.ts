import sinon from "sinon";
import {
    AADServerParamKeys,
    AuthErrorCodes,
    Authority,
    BaseClient,
    ClientAuthErrorCodes,
    ClientConfiguration,
    CommonDeviceCodeRequest,
    Constants,
    GrantType,
    ThrottlingConstants,
    createAuthError,
    createClientAuthError,
} from "@azure/msal-common";
import {
    AUTHENTICATION_RESULT,
    AUTHORIZATION_PENDING_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEVICE_CODE_EXPIRED_RESPONSE,
    DEVICE_CODE_RESPONSE,
    TEST_CONFIG,
    CORS_SIMPLE_REQUEST_HEADERS,
    RANDOM_TEST_GUID,
    SERVER_UNEXPECTED_ERROR,
} from "../test_kit/StringConstants";
import { ClientTestUtils } from "./ClientTestUtils";
import { DeviceCodeClient } from "../../src";

describe("DeviceCodeClient unit tests", () => {
    let config: ClientConfiguration;

    beforeAll(() => {
        sinon.restore();
    });

    beforeEach(async () => {
        sinon
            .stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        config = await ClientTestUtils.createTestClientConfiguration();
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
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            // @ts-ignore
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .callsFake(
                    // @ts-ignore
                    (
                        // @ts-ignore
                        tokenEndpoint: string,
                        // @ts-ignore
                        queryString: string,
                        headers: Record<string, string>
                    ) => {
                        const headerNames = Object.keys(headers);
                        headerNames.forEach((name) => {
                            expect(CORS_SIMPLE_REQUEST_HEADERS).toEqual(
                                expect.arrayContaining([name.toLowerCase()])
                            );
                        });

                        done();
                        return AUTHENTICATION_RESULT;
                    }
                );

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            client.acquireToken(request);
        });

        it("Acquires a token successfully", async () => {
            jest.setTimeout(6000);
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(
                DeviceCodeClient.prototype,
                <any>"createQueryString"
            );
            const createTokenRequestBodySpy = sinon.spy(
                DeviceCodeClient.prototype,
                <any>"createTokenRequestBody"
            );

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: (response) =>
                    (deviceCodeResponse = response),
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            // Check that device code url is correct
            const returnVal = (await queryStringSpy.returnValues[0]) as string;
            expect(
                returnVal.includes(
                    `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                returnVal.includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            const tokenReturnVal = (await createTokenRequestBodySpy
                .returnValues[0]) as string;
            expect(
                tokenReturnVal.includes(
                    `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    encodeURIComponent(GrantType.DEVICE_CODE_GRANT)
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(DEVICE_CODE_RESPONSE.deviceCode)
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                tokenReturnVal.includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("Adds extraQueryParameters to request", (done) => {
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .callsFake((url: string) => {
                    try {
                        expect(
                            url.includes(
                                "/devicecode?testParam1=testValue1&testParam3=testValue3"
                            )
                        ).toBeTruthy();
                        expect(
                            !url.includes("/devicecode?testParam2=")
                        ).toBeTruthy();
                        done();
                    } catch (error) {
                        done(error);
                    }
                });
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .callsFake((url: string) => {
                    try {
                        expect(
                            url.includes(
                                "/token?testParam1=testValue1&testParam3=testValue3"
                            )
                        ).toBeTruthy();
                        expect(
                            !url.includes("/token?testParam2=")
                        ).toBeTruthy();
                        done();
                    } catch (error) {
                        done(error);
                    }
                });

            // let deviceCodeResponse = null;
            const deviceCodeRequest: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                extraQueryParameters: {
                    testParam1: "testValue1",
                    testParam2: "",
                    testParam3: "testValue3",
                },
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            client.acquireToken(deviceCodeRequest).catch(() => {
                // Catch errors thrown after the function call this test is testing
            });
        });

        it("Adds claims to request", async () => {
            jest.setTimeout(6000);
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(
                DeviceCodeClient.prototype,
                <any>"createQueryString"
            );
            const createTokenRequestBodySpy = sinon.spy(
                DeviceCodeClient.prototype,
                <any>"createTokenRequestBody"
            );

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                claims: TEST_CONFIG.CLAIMS,
                deviceCodeCallback: (response) =>
                    (deviceCodeResponse = response),
                correlationId: RANDOM_TEST_GUID,
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            // Check that device code url is correct
            expect(
                queryStringSpy.returnValues[0].includes(
                    `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                queryStringSpy.returnValues[0].includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    encodeURIComponent(GrantType.DEVICE_CODE_GRANT)
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    DEVICE_CODE_RESPONSE.deviceCode
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("Does not add claims to request if empty object passed", async () => {
            jest.setTimeout(6000);
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(
                DeviceCodeClient.prototype,
                <any>"createQueryString"
            );
            const createTokenRequestBodySpy = sinon.spy(
                DeviceCodeClient.prototype,
                <any>"createTokenRequestBody"
            );

            let deviceCodeResponse = null;
            const request: CommonDeviceCodeRequest = {
                authority: Constants.DEFAULT_AUTHORITY,
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                claims: "{ }",
                deviceCodeCallback: (response) =>
                    (deviceCodeResponse = response),
                correlationId: RANDOM_TEST_GUID,
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);

            // Check that device code url is correct
            expect(
                queryStringSpy.returnValues[0].includes(
                    `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                queryStringSpy.returnValues[0].includes(
                    `${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`
                )
            ).toBe(true);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).toEqual(DEVICE_CODE_RESPONSE);

            // expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID)
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    encodeURIComponent(GrantType.DEVICE_CODE_GRANT)
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    DEVICE_CODE_RESPONSE.deviceCode
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.CLAIMS}=${encodeURIComponent(
                        TEST_CONFIG.CLAIMS
                    )}`
                )
            ).toBe(false);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_SKU}=${Constants.SKU}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_VER}=${TEST_CONFIG.TEST_VERSION}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_OS}=${TEST_CONFIG.TEST_OS}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_CLIENT_CPU}=${TEST_CONFIG.TEST_CPU}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_APP_NAME}=${TEST_CONFIG.applicationName}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_APP_VER}=${TEST_CONFIG.applicationVersion}`
                )
            ).toBe(true);
            expect(
                createTokenRequestBodySpy.returnValues[0].includes(
                    `${AADServerParamKeys.X_MS_LIB_CAPABILITY}=${ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE}`
                )
            ).toBe(true);
        });

        it("Acquires a token successfully after authorization_pending error", async () => {
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            const tokenRequestStub = sinon.stub(
                BaseClient.prototype,
                <any>"executePostToTokenEndpoint"
            );

            tokenRequestStub
                .onFirstCall()
                .resolves(AUTHORIZATION_PENDING_RESPONSE);
            tokenRequestStub.onSecondCall().resolves(AUTHENTICATION_RESULT);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await client.acquireToken(request);
        }, 12000);
    });

    describe("Device code exceptions", () => {
        it("Throw device code flow cancelled exception if DeviceCodeRequest.cancel=true", async () => {
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .resolves(AUTHENTICATION_RESULT);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            request.cancel = true;
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(
                    ClientAuthErrorCodes.deviceCodePollingCancelled
                )
            );
        }, 6000);

        it("Throw device code expired exception if device code is expired", async () => {
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_EXPIRED_RESPONSE);
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .resolves(AUTHORIZATION_PENDING_RESPONSE);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.deviceCodeExpired)
            );
        }, 6000);

        it("Throw device code expired exception if the timeout expires", async () => {
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            const tokenRequestStub = sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .onFirstCall()
                .resolves(AUTHORIZATION_PENDING_RESPONSE);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
                timeout: DEVICE_CODE_RESPONSE.interval - 1, // Setting a timeout equal to the interval polling time minus one to allow for one call to the token endpoint
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createClientAuthError(ClientAuthErrorCodes.userTimeoutReached)
            );
            expect(tokenRequestStub.callCount).toBe(1);
        }, 15000);

        it("Throws if server throws an unexpected error", async () => {
            sinon
                .stub(
                    DeviceCodeClient.prototype,
                    <any>"executePostRequestToDeviceCodeEndpoint"
                )
                .resolves(DEVICE_CODE_RESPONSE);
            sinon
                .stub(BaseClient.prototype, <any>"executePostToTokenEndpoint")
                .resolves(SERVER_UNEXPECTED_ERROR);

            const request: CommonDeviceCodeRequest = {
                authority: TEST_CONFIG.validAuthority,
                correlationId: "test-correlationId",
                scopes: [
                    ...TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                    ...TEST_CONFIG.DEFAULT_SCOPES,
                ],
                deviceCodeCallback: () => {},
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).rejects.toMatchObject(
                createAuthError(
                    AuthErrorCodes.postRequestFailed,
                    "Service Unavailable"
                )
            );
        }, 15000);
    });
});
