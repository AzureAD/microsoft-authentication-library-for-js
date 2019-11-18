import { expect } from "chai";
import { AuthResponse, buildResponseStateOnly } from "../../src/response/AuthResponse";
import { TEST_CONFIG } from "../utils/StringConstants";

describe("AuthResponse.ts Unit Tests", () => {

    it("buildResponseState creates a new response with only state parameter", () => {
        let stateOnlyResponse: AuthResponse = buildResponseStateOnly(TEST_CONFIG.STATE);
        expect(stateOnlyResponse).to.be.not.null;
        expect(stateOnlyResponse.scopes).to.be.null;
        expect(stateOnlyResponse.state).to.be.eq(TEST_CONFIG.STATE);
    });
});
