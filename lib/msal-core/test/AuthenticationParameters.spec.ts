import { expect } from "chai";
import sinon from "sinon";
import { AuthenticationParameters, validateClaimsRequest } from "../src/AuthenticationParameters"
import { TEST_CLAIMS_REQ } from "./TestConstants";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";

describe("Authentication Parameters (A.K.A. Request Object)", function () {

    it("doesn't throw error if claims string can be parsed into JSON", () => {
        let req: AuthenticationParameters = {
            claimsRequest: JSON.stringify(TEST_CLAIMS_REQ)
        }
        let authErr;
        try {
            validateClaimsRequest(req);
        } catch(error) {
            authErr = error;
        }

        expect(authErr).to.be.undefined;
    });

    it("throws error if claims string is not an object", () => {
        let stringClaims = JSON.stringify(TEST_CLAIMS_REQ);
        let req: AuthenticationParameters = {
            claimsRequest: stringClaims.substring(stringClaims.length / 2)
        }
        let authErr;
        try {
            validateClaimsRequest(req);
        } catch(error) {
            authErr = error;
        }

        expect(authErr instanceof ClientConfigurationError).to.be.true;
        expect(authErr instanceof Error).to.be.true;
        expect(authErr.errorMessage).to.contain(ClientConfigurationErrorMessage.claimsRequestParsingError.desc);
        expect(authErr.message).to.contain(ClientConfigurationErrorMessage.claimsRequestParsingError.desc);
        expect(authErr.name).to.equal("ClientConfigurationError");
        expect(authErr.stack).to.include("AuthenticationParameters.spec.js");
    });

});