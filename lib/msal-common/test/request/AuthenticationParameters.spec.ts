import { expect } from "chai";
import { AuthenticationParameters, validateClaimsRequest } from "../../src/request/AuthenticationParameters";
import { ClientConfigurationError } from "../../src/error/ClientConfigurationError";

describe("AuthenticationParameters.ts Unit Tests", () => {

    it("validateClaimsRequest throws error if claims are not a valid JSON object", () => {
        const invalidClaimsObj = "Thisisn'taJSON";
        const request: AuthenticationParameters = {
            claimsRequest: invalidClaimsObj
        };
        expect(() => validateClaimsRequest(request)).to.throw(ClientConfigurationError);
    });

    it("validateClaimsRequest does not throw error if claims are empty", () => {
        const request: AuthenticationParameters = {};
        expect(() => validateClaimsRequest(request)).to.not.throw(ClientConfigurationError);
    });

    it("validateClaimsRequest does not throw error if claims are valid", () => {
        const exampleClaims = {
            "testClaim": "claims1"
        };
        const request: AuthenticationParameters = {
            claimsRequest: JSON.stringify(exampleClaims)
        };
        expect(() => validateClaimsRequest(request)).to.not.throw(ClientConfigurationError);
    });
});
