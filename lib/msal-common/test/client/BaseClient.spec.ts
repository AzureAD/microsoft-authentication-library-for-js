import { expect } from "chai";
import { BaseClient } from "../../src/client/BaseClient";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import {Constants} from "../../src";
import {AADServerParamKeys, HeaderNames} from "../../src/utils/Constants";
import {ClientTestUtils} from "./ClientTestUtils";
import sinon from "sinon";
import {TEST_CONFIG} from "../utils/StringConstants";

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

    getCacheStorage(){
        return this.cacheManager;
    }

    getNetworkClient(){
        return this.networkClient;
    }

    getCacheManger(){
        return this.cacheManager;
    }

    getAccount(){
        return this.account;
    }

    getDefaultAuthorityInstance(){
        return this.defaultAuthorityInstance;
    }

    createDefaultLibraryHeaders(): Map<string, string> {
        return super.createDefaultLibraryHeaders();
    }

    createDefaultTokenRequestHeaders(): Map<string, string> {
        return super.createDefaultTokenRequestHeaders();
    }
}

describe("BaseClient.ts Class Unit Tests", () => {

    let config: ClientConfiguration;
    beforeEach(() => {
        config = ClientTestUtils.createTestClientConfiguration();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {

        it("Creates a valid BaseClient object", () => {

            const client = new TestClient(config);
            expect(client).to.be.not.null;
            expect(client instanceof BaseClient).to.be.true;
        });

        it("Sets fields on BaseClient object", () => {

            const client = new TestClient(config);
            expect(client.getAccount()).to.be.not.null;
            expect(client.getCacheManger()).to.be.not.null;
            expect(client.getCacheStorage()).to.be.not.null;
            expect(client.getConfig()).to.be.not.null;
            expect(client.getCryptoUtils()).to.be.not.null;
            expect(client.getDefaultAuthorityInstance()).to.be.not.null;
            expect(client.getNetworkClient()).to.be.not.null;
        });
    });

    describe("Header utils", () => {

        it("Creates default library headers", () => {

            const client = new TestClient(config);
            const headers = client.createDefaultLibraryHeaders();

            expect(headers.get(AADServerParamKeys.X_CLIENT_SKU)).to.eq(Constants.SKU);
            expect(headers.get(AADServerParamKeys.X_CLIENT_VER)).to.eq(TEST_CONFIG.TEST_VERSION);
            expect(headers.get(AADServerParamKeys.X_CLIENT_OS)).to.eq(TEST_CONFIG.TEST_OS);
            expect(headers.get(AADServerParamKeys.X_CLIENT_CPU)).to.eq(TEST_CONFIG.TEST_CPU);
        });

        it("Creates default token request headers", () => {

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
