import { expect } from "chai";
import { BaseClient } from "../../src/client/BaseClient";
import { Authority, Constants, ServerTelemetryManager, ServerTelemetryRequest } from "../../src";
import { AADServerParamKeys, HeaderNames } from "../../src/utils/Constants";
import { ClientTestUtils, mockCrypto, MockStorageClass } from "./ClientTestUtils";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import sinon from "sinon";
import { DEFAULT_OPENID_CONFIG_RESPONSE, TEST_CONFIG } from "../utils/StringConstants";

class TestClient extends BaseClient {

    constructor(config: ClientConfiguration) {
        super(config);
    }

    getLogger(){
        return this.logger;
    }

    getConfig(){
        return this.config;
    }

    getCryptoUtils(){
        return this.cryptoUtils;
    }

    getNetworkClient(){
        return this.networkClient;
    }

    getDefaultAuthorityInstance(){
        return this.authority;
    }

    createDefaultLibraryHeaders(): Record<string, string> {
        return super.createDefaultLibraryHeaders();
    }

    createDefaultTokenRequestHeaders(): Record<string, string> {
        return super.createDefaultTokenRequestHeaders();
    }
}

describe("BaseClient.ts Class Unit Tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("Creates a valid BaseClient object", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof BaseClient).to.be.true;
        });

        it("Sets fields on BaseClient object", async () => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            expect(client.getConfig()).to.be.not.null;
            expect(client.getCryptoUtils()).to.be.not.null;
            expect(client.getDefaultAuthorityInstance()).to.be.not.null;
            expect(client.getNetworkClient()).to.be.not.null;
        });
    });

    describe("Header utils", () => {
        beforeEach(() => {
            sinon.stub(Authority.prototype, <any>"getEndpointMetadataFromNetwork").resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Creates default library headers", async () => {
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createDefaultLibraryHeaders();

            expect(headers[AADServerParamKeys.X_CLIENT_SKU]).to.eq(Constants.SKU);
            expect(headers[AADServerParamKeys.X_CLIENT_VER]).to.eq(TEST_CONFIG.TEST_VERSION);
            expect(headers[AADServerParamKeys.X_CLIENT_OS]).to.eq(TEST_CONFIG.TEST_OS);
            expect(headers[AADServerParamKeys.X_CLIENT_CPU]).to.eq(TEST_CONFIG.TEST_CPU);
        });

        it("Creates telemetry headers if serverTelemetryManager is available on BaseClient", async () => {
            const config = await ClientTestUtils.createTestClientConfiguration();
            const telemetryPayload: ServerTelemetryRequest = {
                clientId: config.authOptions.clientId,
                apiId: 9999,
                correlationId: "test-correlationId"
            };
            config.serverTelemetryManager = new ServerTelemetryManager(telemetryPayload, new MockStorageClass(TEST_CONFIG.MSAL_CLIENT_ID, mockCrypto));
            const client = new TestClient(config);
            const headers = client.createDefaultTokenRequestHeaders();

            expect(headers[AADServerParamKeys.X_CLIENT_SKU]).to.eq(Constants.SKU);
            expect(headers[AADServerParamKeys.X_CLIENT_VER]).to.eq(TEST_CONFIG.TEST_VERSION);
            expect(headers[AADServerParamKeys.X_CLIENT_OS]).to.eq(TEST_CONFIG.TEST_OS);
            expect(headers[AADServerParamKeys.X_CLIENT_CPU]).to.eq(TEST_CONFIG.TEST_CPU);
            expect(headers[HeaderNames.CONTENT_TYPE]).to.eq(Constants.URL_FORM_CONTENT_TYPE);

            // Care more here that headers are set at all. Value generation is tested in ServerTelemetryManager.spec.ts
            expect(headers[HeaderNames.X_CLIENT_CURR_TELEM]).to.be.eq(config.serverTelemetryManager.generateCurrentRequestHeaderValue());
            expect(headers[HeaderNames.X_CLIENT_LAST_TELEM]).to.be.eq(config.serverTelemetryManager.generateLastRequestHeaderValue());
        });

        it("Creates default token request headers", async () => {
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createDefaultTokenRequestHeaders();

            expect(headers[AADServerParamKeys.X_CLIENT_SKU]).to.eq(Constants.SKU);
            expect(headers[AADServerParamKeys.X_CLIENT_VER]).to.eq(TEST_CONFIG.TEST_VERSION);
            expect(headers[AADServerParamKeys.X_CLIENT_OS]).to.eq(TEST_CONFIG.TEST_OS);
            expect(headers[AADServerParamKeys.X_CLIENT_CPU]).to.eq(TEST_CONFIG.TEST_CPU);
            expect(headers[HeaderNames.CONTENT_TYPE]).to.eq(Constants.URL_FORM_CONTENT_TYPE);
        });
    });
});
