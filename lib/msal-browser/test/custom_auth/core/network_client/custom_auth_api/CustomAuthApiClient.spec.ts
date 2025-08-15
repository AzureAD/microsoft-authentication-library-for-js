import { CustomAuthApiClient } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js";
import { FetchHttpClient } from "../../../../../src/custom_auth/core/network_client/http_client/FetchHttpClient.js";
import { getDefaultLogger } from "../../../test_resources/TestModules.js";

describe("CustomAuthApiClient", () => {
    let customAuthApiClient: CustomAuthApiClient;

    beforeEach(() => {
        const logger = getDefaultLogger();
        customAuthApiClient = new CustomAuthApiClient(
            "https://test.com",
            "client_id",
            new FetchHttpClient(logger)
        );
    });

    it("should initialize signInApiClient correctly", () => {
        expect(customAuthApiClient.signInApi).toBeDefined();
    });

    it("should initialize signUpApiClient correctly", () => {
        expect(customAuthApiClient.signUpApi).toBeDefined();
    });

    it("should initialize resetPasswordApiClient correctly", () => {
        expect(customAuthApiClient.resetPasswordApi).toBeDefined();
    });

    it("should store capabilities when provided", () => {
        const logger = getDefaultLogger();
        const capabilities = ["custom_capability_1", "custom_capability_2"];
        const apiClient = new CustomAuthApiClient(
            "https://test.com",
            "client_id",
            new FetchHttpClient(logger),
            capabilities
        );

        expect(apiClient.capabilities).toEqual(capabilities);
    });

    it("should have undefined capabilities when not provided", () => {
        expect(customAuthApiClient.capabilities).toBeUndefined();
    });
});
