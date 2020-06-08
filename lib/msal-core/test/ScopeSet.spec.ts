import { ScopeSet } from "../src/ScopeSet";
import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";

describe.only("ScopeSet.ts", () => {
    describe("validateInputScope", function() {
        it("should not throw any errors when", function () {
            const scopes = ["S1"];
            expect(() => ScopeSet.validateInputScope(scopes)).to.not.throw();
        });

        it("should throw createScopesRequiredError if scopes are empty or null", function() {
            const scopes = null;
            let clientConfigError;

            try {
                ScopeSet.validateInputScope(scopes);
            } catch (e) {
                clientConfigError = e;
            }

            expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
            expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.scopesRequired.code);
            expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.scopesRequired.desc);
            expect(clientConfigError.name).to.equal("ClientConfigurationError");
            expect(clientConfigError.stack).to.include("ScopeSet.spec.ts");
        });
        
        it("should throw createScopesNonArrayError if scopes is not an array object", function() {
            const scopes = {};
            let clientConfigError;

            try {
                ScopeSet.validateInputScope(scopes as any);
            } catch (e) {
                clientConfigError = e;
            }

            expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
            expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.nonArrayScopes.code);
            expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.nonArrayScopes.desc);
            expect(clientConfigError.name).to.equal("ClientConfigurationError");
            expect(clientConfigError.stack).to.include("ScopeSet.spec.ts");
        });

        it("should throw createEmptyScopesArrayError if scopes is an empty array", function() {
            const scopes = [];
            let clientConfigError;

            try {
                ScopeSet.validateInputScope(scopes);
            } catch (e) {
                clientConfigError = e;
            }

            expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
            expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
            expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.emptyScopes.desc);
            expect(clientConfigError.name).to.equal("ClientConfigurationError");
            expect(clientConfigError.stack).to.include("ScopeSet.spec.ts");
        });
    });
});

