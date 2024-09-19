import { BaseClient } from "../../src/client/BaseClient";
import { HeaderNames, Constants } from "../../src/utils/Constants";
import { ClientTestUtils } from "./ClientTestUtils";
import { ClientConfiguration } from "../../src/config/ClientConfiguration";
import { DEFAULT_OPENID_CONFIG_RESPONSE } from "../test_kit/StringConstants";
import { Authority } from "../../src/authority/Authority";

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

    createTokenRequestHeaders(): Record<string, string> {
        return super.createTokenRequestHeaders();
    }
}

describe("BaseClient.ts Class Unit Tests", () => {
    let getEndpointMetadataFromNetworkSpy: jest.SpyInstance;
    beforeAll(() => {
        getEndpointMetadataFromNetworkSpy = jest
            .spyOn(Authority.prototype, <any>"getEndpointMetadataFromNetwork")
            .mockReturnValue(DEFAULT_OPENID_CONFIG_RESPONSE.body);
    });

    afterAll(() => {
        getEndpointMetadataFromNetworkSpy.mockRestore();
    });

    describe("Constructor", () => {
        it("Creates a valid BaseClient object", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            expect(client).not.toBeNull();
            expect(client instanceof BaseClient).toBe(true);
        });

        it("Sets fields on BaseClient object", async () => {
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
        it("Creates default token request headers", async () => {
            const config =
                await ClientTestUtils.createTestClientConfiguration();
            const client = new TestClient(config);
            const headers = client.createTokenRequestHeaders();

            expect(headers[HeaderNames.CONTENT_TYPE]).toBe(
                Constants.URL_FORM_CONTENT_TYPE
            );
        });
    });
});
