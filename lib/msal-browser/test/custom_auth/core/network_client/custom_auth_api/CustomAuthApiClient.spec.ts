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

    describe("extraQueryParameters", () => {
        it("should initialize with extraQueryParameters containing dc", () => {
            const logger = getDefaultLogger();
            const extraQueryParameters = { dc: "datacenter1" };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                extraQueryParameters
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });

        it("should initialize with extraQueryParameters containing slice", () => {
            const logger = getDefaultLogger();
            const extraQueryParameters = { slice: "slice2" };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                extraQueryParameters
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });

        it("should initialize with extraQueryParameters containing both dc and slice", () => {
            const logger = getDefaultLogger();
            const extraQueryParameters = { dc: "datacenter1", slice: "slice2" };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                extraQueryParameters
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });

        it("should initialize with undefined extraQueryParameters", () => {
            const logger = getDefaultLogger();

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                undefined
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });
    });
});
