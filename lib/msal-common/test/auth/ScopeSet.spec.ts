import { expect } from "chai";
import { ScopeSet } from "../../src/auth/ScopeSet";
import { TEST_CONFIG } from "../utils/StringConstants";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src";

describe.only("ScopeSet.ts", () => {
    
    describe("Constructor and scope validation", () => {

        it("Throws error if scopes are null and required", () => {
            expect(() => new ScopeSet(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.scopesRequiredError.desc);
            expect(() => new ScopeSet(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);
        });

        it("Throws error if scopes are empty and required", () => {
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);
        });


    });
});
