import { expect } from "chai";
import { BaseClient } from "../../src/client/BaseClient";
import { Authority, Constants } from "../../src";
import { HeaderNames } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import sinon from "sinon";
import { DEFAULT_OPENID_CONFIG_RESPONSE } from "../test_kit/StringConstants";

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

        it("Creates default token request headers", async () => {
            const config = await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createDefaultTokenRequestHeaders();

            expect(headers[HeaderNames.CONTENT_TYPE]).to.eq(Constants.URL_FORM_CONTENT_TYPE);
        });
    });
});
