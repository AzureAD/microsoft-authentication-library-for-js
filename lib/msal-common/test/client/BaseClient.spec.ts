import { BaseClient } from "../../src/client/BaseClient";
import { HeaderNames, Constants } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONFIG,
} from "../test_kit/StringConstants";
import { Authority } from "../../src/authority/Authority";
import sinon from "sinon";

class TestClient extends BaseClient {
    constructor(config: ClientConfiguration) {
        super(config);
    }

    getLogger() {
        return this.logger;
    }

    getConfig() {
        return this.config;
    }

    getCryptoUtils() {
        return this.cryptoUtils;
    }

    getNetworkClient() {
        return this.networkClient;
    }

    getDefaultAuthorityInstance() {
        return this.authority;
    }

    createTokenRequestHeaders(options?: any): Record<string, string> {
        return super.createTokenRequestHeaders(
            options?.ccsCred,
            options?.extraHeaders
        );
    }
}

describe("BaseClient.ts Class Unit Tests", () => {
    afterEach(() => {
        sinon.restore();
    });

    describe("Constructor", () => {
        it("Creates a valid BaseClient object", async () => {
            sinon
                .stub(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                )
                .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof BaseClient).toBe(true);
        });

        it("Sets fields on BaseClient object", async () => {
            sinon
                .stub(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                )
                .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);

            expect(client.getConfig()).not.toBeNull();
            expect(client.getCryptoUtils()).not.toBeNull();
            expect(client.getDefaultAuthorityInstance()).not.toBeNull();
            expect(client.getNetworkClient()).not.toBeNull();
        });
    });

    describe("Header utils", () => {
        beforeEach(() => {
            sinon
                .stub(
                    Authority.prototype,
                    <any>"getEndpointMetadataFromNetwork"
                )
                .resolves(DEFAULT_OPENID_CONFIG_RESPONSE.body);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("Creates default token request headers", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createTokenRequestHeaders();

            expect(headers[HeaderNames.CONTENT_TYPE]).toBe(
                Constants.URL_FORM_CONTENT_TYPE
            );
        });

        it("adds extra client app config-level token request headers when present", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            config.authOptions.extraTokenRequestHeaders =
                TEST_CONFIG.EXTRA_TOKEN_REQUEST_HEADERS;
            const client = new TestClient(config);
            const headers = client.createTokenRequestHeaders();

            expect(headers["Extra-Header"]).toBe("ExtraHeaderValue");
        });

        it("adds request-level extra token request headers when present, overriding client app config headers", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            config.authOptions.extraTokenRequestHeaders =
                TEST_CONFIG.EXTRA_TOKEN_REQUEST_HEADERS;
            const client = new TestClient(config);
            const headers = client.createTokenRequestHeaders({
                extraHeaders: { "Extra-Header": "NewExtraHeaderValue" },
            });

            expect(headers["Extra-Header"]).not.toBe("ExtraHeaderValue");
            expect(headers["Extra-Header"]).toBe("NewExtraHeaderValue");
        });
    });
});
