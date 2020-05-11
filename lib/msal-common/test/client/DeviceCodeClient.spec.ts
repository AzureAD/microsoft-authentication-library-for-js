import { expect } from "chai";
import sinon from "sinon";
import {
    Authority, ClientAuthErrorMessage,
    ClientConfiguration, Constants,
    DeviceCodeClient, DeviceCodeRequest,
} from "../../src";
import {
    AUTHENTICATION_RESULT, AUTHORIZATION_PENDING_RESPONSE,
    DEFAULT_OPENID_CONFIG_RESPONSE,
    DEVICE_CODE_EXPIRED_RESPONSE,
    DEVICE_CODE_RESPONSE,
    TEST_CONFIG
} from "../utils/StringConstants";
import {BaseClient} from "../../src/client/BaseClient";
import {AADServerParamKeys, GrantType} from "../../src/utils/Constants";
import {ClientTestUtils} from "./ClientTestUtils";

describe.skip("DeviceCodeClient unit tests", () => {

    let config: ClientConfiguration;

    beforeEach(() => {
        config = ClientTestUtils.createTestClientConfiguration();
    });

    describe("Constructor", () => {

        it("creates a DeviceCodeClient", () => {
            const client = new DeviceCodeClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof DeviceCodeClient).to.be.true;
            expect(client instanceof BaseClient).to.be.true;
        });
    });

    describe("Acquire a token", () => {

        let client: DeviceCodeClient;
        let createDeviceCodeUrlSpy;
        let createTokenRequestBodySpy;
        let tokenRequestStub;
        beforeEach(() => {
            sinon.stub(DeviceCodeClient.prototype, <any>"executeGetRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            tokenRequestStub = sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint");

            createDeviceCodeUrlSpy = sinon.spy(DeviceCodeClient.prototype, <any>"createDeviceCodeUrl");
            createTokenRequestBodySpy = sinon.spy(DeviceCodeClient.prototype, <any>"createTokenRequestBody");
            client = new DeviceCodeClient(config);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Acquires a token successfully", async () => {

            tokenRequestStub.resolves(AUTHENTICATION_RESULT)

            let deviceCodeResponse = null;
            const request: DeviceCodeRequest = {

                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                deviceCodeCallback:(response) => deviceCodeResponse = response
            };

            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);

            // Check that device code url is correct
            expect(createDeviceCodeUrlSpy.returnValues[0]).to.contain(Constants.DEFAULT_AUTHORITY);
            expect(createDeviceCodeUrlSpy.returnValues[0]).to.contain("oauth2/v2.0/devicecode");
            expect(createDeviceCodeUrlSpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createDeviceCodeUrlSpy.returnValues[0]).to.contain(`${AADServerParamKeys.CLIENT_ID}=${TEST_CONFIG.MSAL_CLIENT_ID}`);

            // Check that deviceCodeCallback was called with the right arguments
            expect(deviceCodeResponse).to.deep.eq(DEVICE_CODE_RESPONSE.body);


            expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(`${TEST_CONFIG.DEFAULT_GRAPH_SCOPE}%20${Constants.OPENID_SCOPE}%20${Constants.PROFILE_SCOPE}%20${Constants.OFFLINE_ACCESS_SCOPE}`);
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(TEST_CONFIG.MSAL_CLIENT_ID));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(encodeURIComponent(GrantType.DEVICE_CODE_GRANT));
            expect(createTokenRequestBodySpy.returnValues[0]).to.contain(DEVICE_CODE_RESPONSE.body.device_code);

        }).timeout(6000);

        it("Acquires a token successfully after authorization_pending error", async () => {

            tokenRequestStub.onFirstCall().resolves(AUTHORIZATION_PENDING_RESPONSE);
            tokenRequestStub.onSecondCall().resolves(AUTHENTICATION_RESULT);

            let deviceCodeResponse = null;
            const request: DeviceCodeRequest = {

                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                deviceCodeCallback:(response) => deviceCodeResponse = response
            };

            const client = new DeviceCodeClient(config);
            const authenticationResult = await client.acquireToken(request);

            expect(JSON.parse(authenticationResult)).to.deep.eq(AUTHENTICATION_RESULT.body);
        }).timeout(12000);
    });

    describe("Device code exceptions", () => {

        beforeEach(() => {
            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        });

        afterEach(() => {
            sinon.restore();
        });

        it.skip("Throw device code flow cancelled exception if cancellationToken.cancel=true", async () => {

            // sinon.stub(DeviceCodeClient.prototype, <any>"executeGetRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_RESPONSE);
            // sinon.stub(BaseClient.prototype, <any>"executePostToTokenEndpoint").resolves(AUTHENTICATION_RESULT);

            // let deviceCodeResponse = null;
            // const request: DeviceCodeRequest = {
            //     scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
            //     deviceCodeCallback:(response) => deviceCodeResponse = response,
            //     cancellationToken: cancellationToken
            // };

            // const client = new DeviceCodeClient(config);
            // cancellationToken.cancel = true;
            // await expect(client.acquireToken(request)).to.be.rejectedWith(`${ClientAuthErrorMessage.DeviceCodePollingCancelled.desc}`);
        }).timeout(6000);

        it("Throw device code expired exception if device code is expired", async () => {

            sinon.stub(DeviceCodeClient.prototype, <any>"executeGetRequestToDeviceCodeEndpoint").resolves(DEVICE_CODE_EXPIRED_RESPONSE);

            let deviceCodeResponse = null;
            const request: DeviceCodeRequest = {
                scopes: TEST_CONFIG.DEFAULT_GRAPH_SCOPE,
                deviceCodeCallback:(response) => deviceCodeResponse = response,
            };

            const client = new DeviceCodeClient(config);
            await expect(client.acquireToken(request)).to.be.rejectedWith(`${ClientAuthErrorMessage.DeviceCodeExpired.desc}`);
        }).timeout(6000);
    });
});
