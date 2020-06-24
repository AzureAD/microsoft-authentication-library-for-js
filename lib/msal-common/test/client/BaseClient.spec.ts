import { expect } from "chai";
import { BaseClient } from "../../src/client/BaseClient";
import { Authority, Constants } from "../../src";
import { AADServerParamKeys, HeaderNames } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
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
        return this.defaultAuthority;
    }

    createDefaultLibraryHeaders(): Map<string, string> {
        return super.createDefaultLibraryHeaders();
    }

    createDefaultTokenRequestHeaders(): Map<string, string> {
        return super.createDefaultTokenRequestHeaders();
    }
}

describe("BaseClient.ts Class Unit Tests", () => {

    beforeEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("Creates a valid BaseClient object", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof BaseClient).to.be.true;
        });

        it("Sets fields on BaseClient object", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            expect(client.getConfig()).to.be.not.null;
            expect(client.getCryptoUtils()).to.be.not.null;
            expect(client.getDefaultAuthorityInstance()).to.be.not.null;
            expect(client.getNetworkClient()).to.be.not.null;
        });
    });

    describe("Header utils", () => {

        sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
        it("Creates default library headers", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createDefaultLibraryHeaders();

            expect(headers.get(AADServerParamKeys.X_CLIENT_SKU)).to.eq(Constants.SKU);
            expect(headers.get(AADServerParamKeys.X_CLIENT_VER)).to.eq(TEST_CONFIG.TEST_VERSION);
            expect(headers.get(AADServerParamKeys.X_CLIENT_OS)).to.eq(TEST_CONFIG.TEST_OS);
            expect(headers.get(AADServerParamKeys.X_CLIENT_CPU)).to.eq(TEST_CONFIG.TEST_CPU);
        });

        it("Creates default token request headers", async () => {

            sinon.stub(Authority.prototype, <any>"discoverEndpoints").resolves(DEFAULT_OPENID_CONFIG_RESPONSE);
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createDefaultTokenRequestHeaders();

            expect(headers.get(AADServerParamKeys.X_CLIENT_SKU)).to.eq(Constants.SKU);
            expect(headers.get(AADServerParamKeys.X_CLIENT_VER)).to.eq(TEST_CONFIG.TEST_VERSION);
            expect(headers.get(AADServerParamKeys.X_CLIENT_OS)).to.eq(TEST_CONFIG.TEST_OS);
            expect(headers.get(AADServerParamKeys.X_CLIENT_CPU)).to.eq(TEST_CONFIG.TEST_CPU);
            expect(headers.get(HeaderNames.CONTENT_TYPE)).to.eq(Constants.URL_FORM_CONTENT_TYPE);
        });
    });
});
