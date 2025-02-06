import { Logger } from "@azure/msal-browser";
import { CustomAuthApiClient } from "../../../src/core/network_client/custom_auth_api/CustomAuthApiClient.js";
import { SingInApiClient } from "../../../src/core/network_client/SingInApiClient.js";
import { SignupApiClient } from "../../../src/core/network_client/SignupApiClient.js";
import { ResetPasswordApiClient } from "../../../src/core/network_client/ResetPasswordApiClient.js";

describe("CustomAuthApiClient", () => {
    let signInApiClient: SingInApiClient;
    let signUpApiClient: SignupApiClient;
    let resetPasswordApiClient: ResetPasswordApiClient;
    let customAuthApiClient: CustomAuthApiClient;

    beforeEach(() => {
        const mockLogger = {
            clone: jest.fn(),
            verbose: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        } as unknown as jest.Mocked<Logger>;
        signInApiClient = new SingInApiClient("clientId", "tenantSubdomain", mockLogger);
        signUpApiClient = new SignupApiClient("clientId", "tenantSubdomain", mockLogger);
        resetPasswordApiClient = new ResetPasswordApiClient("clientId", "tenantSubdomain", mockLogger);
        customAuthApiClient = new CustomAuthApiClient(signInApiClient, signUpApiClient, resetPasswordApiClient);
    });

    it("should initialize signInApiClient correctly", () => {
        expect(customAuthApiClient.signInApiClient).toBe(signInApiClient);
    });

    it("should initialize signUpApiClient correctly", () => {
        expect(customAuthApiClient.signUpApiClient).toBe(signUpApiClient);
    });

    it("should initialize resetPasswordApiClient correctly", () => {
        expect(customAuthApiClient.resetPasswordApiClient).toBe(resetPasswordApiClient);
    });
});
