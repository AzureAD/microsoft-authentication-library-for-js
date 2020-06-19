import { expect } from "chai";
import sinon from "sinon";
import {
    Authority,
    ClientAuthErrorMessage,
    Constants,
    DeviceCodeClient,
    DeviceCodeRequest,
} from "../../src";
import {
    AUTHENTICATION_RESULT, AUTHORIZATION_PENDING_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEVICE_CODE_EXPIRED_RESPONSE,
    DEVICE_CODE_RESPONSE,
    TEST_CONFIG
} from "../utils/StringConstants";
import { BaseClient } from "../../src/client/BaseClient";
import { AADServerParamKeys, GrantType } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";

describe("DeviceCodeClient unit tests", async () => {

    before(() => {
        sinon.restore();
    });

    beforeEach(() => {
        ClientTestUtils.setInstanceMetadataStubs();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("creates a DeviceCodeClient", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new DeviceCodeClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof DeviceCodeClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Acquire a token", async () => {

        it("Acquires a token successfully", async () => {

            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            const queryStringSpy = sinon.spy(DeviceCodeClient.prototype, <any>"createQueryString");
            const createTokenRequestBodySpy = sinon.spy(DeviceCodeClient.prototype, <any>"createTokenRequestBody");

            let deviceCodeResponse = null;
            const request: DeviceCodeRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response
            };

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);

            // Check that device code url is correct
            expect(queryStringSpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(queryStringSpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).to.deep.eq(DEVICE_CODE_RESPONSE);

            expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(GrantType.DEVICE_CODE_GRANT));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(DEVICE_CODE_RESPONSE.deviceCode);

        }).timeout(6000);

        it("Acquires a token successfully after authorization_pending error", async () => {

            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const tokenRequestStub = sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint");

            tokenRequestStub.onFirstCall().resolves(AUTHORIZATION_PENDING_RESPONSE);
            tokenRequestStub.onSecondCall().resolves(AUTHENTICATION_RESULT);

            let deviceCodeResponse = null;
            const request: DeviceCodeRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response
            };

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);

            expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
        }).timeout(12000);
    });

    describe("Device code exceptions", () => {

        it("Throw device code flow cancelled exception if DeviceCodeRequest.cancel=true", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            let deviceCodeResponse = null;
            const request: DeviceCodeRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
            };

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new DeviceCodeClient(config);
            request.cancel = true;
            await expect(client.acquireToken(request)).to.be.rejectedWith(`${ClientAuthErrorMessage.DeviceCodePollingCancelled.desc}`);
        }).timeout(6000);

        it("Throw device code expired exception if device code is expired", async () => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            sinon.stub(DeviceCodeClient.prototype, <any>"executePostRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_EXPIRED_RESPONSE);

            let deviceCodeResponse = null;
            const request: DeviceCodeRequest = {
                scopes: [...TEST_CONFIG.DEFAULT_GRAPH_SCOPE, ...TEST_CONFIG.DEFAULT_SCOPES],
                deviceCodeCallback: (response) => deviceCodeResponse = response,
            };

            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).to.be.rejectedWith(`${ClientAuthErrorMessage.DeviceCodeExpired.desc}`);
        }).timeout(6000);
    });
});
