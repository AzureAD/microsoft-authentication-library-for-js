import { CustomAuthBrowserConfiguration } from "../../../../src/configuration/CustomAuthConfiguration.js";
import { SignUpSubmitAttributesError } from "../../../../src/sign_up/auth_flow/error_type/SignUpError.js";
import { SignUpSubmitAttributesResult } from "../../../../src/sign_up/auth_flow/result/SignUpSubmitAttributesResult.js";
import { SignUpAttributesRequiredState } from "../../../../src/sign_up/auth_flow/state/SignUpAttributesRequiredState.js";
import { SignUpCompletedResult } from "../../../../src/sign_up/interaction_client/result/SignUpActionResult.js";
import { SignUpClient } from "../../../../src/sign_up/interaction_client/SignUpClient.js";
import { Logger } from "@azure/msal-browser";
import { SignInClient } from "../../../../src/sign_in/interaction_client/SignInClient.js";
import { UserAccountAttributes } from "../../../../src/UserAccountAttributes.js";
import { CustomAuthSilentCacheClient } from "../../../../src/get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { AuthFlowStateType } from "../../../../src/core/auth_flow/AuthFlowStateType.js";

describe("SignUpAttributesRequiredState", () => {
    const mockConfig = {
        auth: { clientId: "test-client-id" },
        customAuth: { challengeTypes: ["attributes"] },
    } as unknown as jest.Mocked<CustomAuthBrowserConfiguration>;

    const mockSignUpClient = {
        submitAttributes: jest.fn(),
    } as unknown as jest.Mocked<SignUpClient>;

    const mockSignInClient = {} as unknown as jest.Mocked<SignInClient>;

    const mockLogger = {
        info: jest.fn(),
        verbose: jest.fn(),
        error: jest.fn(),
        errorPii: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const username = "testuser";
    const correlationId = "test-correlation-id";
    const continuationToken = "test-continuation-token";
    const requiredAttributes = new UserAccountAttributes();
    requiredAttributes.setDisplayName("test-value");

    let state: SignUpAttributesRequiredState;

    beforeEach(() => {
        state = new SignUpAttributesRequiredState({
            username: username,
            signUpClient: mockSignUpClient,
            signInClient: mockSignInClient,
            cacheClient: {} as unknown as jest.Mocked<CustomAuthSilentCacheClient>,
            correlationId: correlationId,
            logger: mockLogger,
            continuationToken: continuationToken,
            config: mockConfig,
            requiredAttributes: [
                {
                    name: "name",
                    type: "string",
                },
            ],
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("submitAttributes", () => {
        it("should return an error result if attributes is empty", async () => {
            const result1 = await state.submitAttributes(null as unknown as UserAccountAttributes);

            expect(result1.state?.type).toBe(AuthFlowStateType.Failed);
            expect(result1.error).toBeInstanceOf(SignUpSubmitAttributesError);
            expect(result1.error?.isAttributesValidationFailed()).toBe(true);

            const result2 = await state.submitAttributes(new UserAccountAttributes());

            expect(result2.state?.type).toBe(AuthFlowStateType.Failed);
            expect(result2.error).toBeInstanceOf(SignUpSubmitAttributesError);
            expect(result2.error?.isAttributesValidationFailed()).toBe(true);
        });

        it("should successfully submit a attributes and return completed state if no credentail required", async () => {
            mockSignUpClient.submitAttributes.mockResolvedValue(
                new SignUpCompletedResult(correlationId, "continuation-token"),
            );

            const result = await state.submitAttributes(requiredAttributes);

            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(SignUpSubmitAttributesResult);
            expect(result.state?.type).toBe(AuthFlowStateType.Completed);
            expect(mockSignUpClient.submitAttributes).toHaveBeenCalledWith({
                clientId: "test-client-id",
                correlationId: correlationId,
                challengeType: ["attributes"],
                continuationToken: continuationToken,
                attributes: requiredAttributes.toRecord(),
                username: username,
            });
        });
    });
});
