import { Logger } from "@azure/msal-browser";
import { CustomAuthApiClient } from "../../../../../src/custom_auth/core/network_client/custom_auth_api/CustomAuthApiClient.js";
import { FetchHttpClient } from "../../../../../src/custom_auth/core/network_client/http_client/FetchHttpClient.js";

describe("CustomAuthApiClient", () => {
    let customAuthApiClient: CustomAuthApiClient;

    beforeEach(() => {
        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
            errorPii: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
        customAuthApiClient = new CustomAuthApiClient(
            "https://test.com",
            "client_id",
            new FetchHttpClient(mockLogger)
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
});
