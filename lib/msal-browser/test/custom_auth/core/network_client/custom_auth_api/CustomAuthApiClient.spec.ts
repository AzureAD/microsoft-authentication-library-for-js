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

    it("should initialize registerApiClient correctly", () => {
        expect(customAuthApiClient.registerApi).toBeDefined();
    });

    describe("customAuthApiQueryParams", () => {
        it("should initialize with customAuthApiQueryParams containing dc", () => {
            const logger = getDefaultLogger();
            const customAuthApiQueryParams = { dc: "datacenter1" };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                undefined,
                customAuthApiQueryParams
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });

        it("should initialize with customAuthApiQueryParams containing slice", () => {
            const logger = getDefaultLogger();
            const customAuthApiQueryParams = { slice: "slice2" };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                undefined,
                customAuthApiQueryParams
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });

        it("should initialize with customAuthApiQueryParams containing both dc and slice", () => {
            const logger = getDefaultLogger();
            const customAuthApiQueryParams = {
                dc: "datacenter1",
                slice: "slice2",
            };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                undefined,
                customAuthApiQueryParams
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });

        it("should initialize with undefined customAuthApiQueryParams", () => {
            const logger = getDefaultLogger();

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                undefined,
                undefined
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });
    });

    describe("capabilities", () => {
        it("should pass capabilities to individual API clients when provided", () => {
            const logger = getDefaultLogger();
            const capabilities = "custom_capability_1 custom_capability_2";
            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                capabilities
            );

            // Verify that the individual API clients are created (capabilities are internal to them)
            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });

        it("should create API clients without capabilities when not provided", () => {
            // Verify that the individual API clients are created without capabilities
            expect(customAuthApiClient.signInApi).toBeDefined();
            expect(customAuthApiClient.signUpApi).toBeDefined();
            expect(customAuthApiClient.resetPasswordApi).toBeDefined();
        });

        it("should pass both capabilities and customAuthApiQueryParams when provided", () => {
            const logger = getDefaultLogger();
            const capabilities = "custom_capability_1 custom_capability_2";
            const customAuthApiQueryParams = {
                dc: "datacenter1",
                slice: "slice2",
            };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                capabilities,
                customAuthApiQueryParams
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
        });
    });

    describe("requestInterceptor", () => {
        it("should accept a requestInterceptor and logger when provided", () => {
            const logger = getDefaultLogger();
            const interceptor = {
                addAdditionalHeaderFields: jest.fn(() => null),
            };

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                undefined,
                undefined,
                interceptor,
                logger
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
            expect(apiClient.registerApi).toBeDefined();
        });

        it("should initialize without requestInterceptor", () => {
            const logger = getDefaultLogger();

            const apiClient = new CustomAuthApiClient(
                "https://test.com",
                "client_id",
                new FetchHttpClient(logger),
                undefined,
                undefined,
                undefined,
                logger
            );

            expect(apiClient.signInApi).toBeDefined();
            expect(apiClient.signUpApi).toBeDefined();
            expect(apiClient.resetPasswordApi).toBeDefined();
            expect(apiClient.registerApi).toBeDefined();
        });
    });
});
