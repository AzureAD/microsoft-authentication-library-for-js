import { TokenValidationParameters, buildTokenValidationParameters, BaseValidationParameters } from "../../src/config/TokenValidationParameters";
import { TEST_CONSTANTS } from "../utils/TestConstants";

describe("TokenValidationParameters", () => {
    it("builds ValidationParameters and assigns defaults", () => {
        const inputParameters: TokenValidationParameters = {
            validIssuers: [TEST_CONSTANTS.AUTHORITY],
            validAudiences: [TEST_CONSTANTS.AUTHORITY]
        };

        const validationParameters: BaseValidationParameters = buildTokenValidationParameters(inputParameters);

        expect(validationParameters.validAlgorithms).toStrictEqual([TEST_CONSTANTS.DEFAULT_ALGORITHM]);
        expect(validationParameters.validIssuers).toStrictEqual([TEST_CONSTANTS.AUTHORITY]);
    });
});
