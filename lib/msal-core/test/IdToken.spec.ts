import { expect } from "chai";
import { IdToken } from "../src/IdToken";
import { AuthError, ClientAuthError } from "../src";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { TEST_TOKENS } from "./TestConstants";

describe("IdToken.ts Class", function() {

    it("verifies IdToken is constructed properly given a IDTOKEN for V1", function () {

        const idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V1);
        const iss: string = "https://sts.windows.net/fa15d692-e9c7-4460-a743-29f2956fd429/";
        const tid: string = "fa15d692-e9c7-4460-a743-29f2956fd429";

        expect(idToken instanceof IdToken).to.be.true;
        expect(idToken.issuer).to.equal(iss);
        expect(idToken.tenantId).to.equal(tid);
   });


    it("verifies IdToken is constructed properly given a RAW IDTOKEN for V2", function () {

         const idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2);
         const iss: string = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0";
         const exp: number = 1536361411;

         expect(idToken instanceof IdToken).to.be.true;
         expect(idToken.issuer).to.equal(iss);
         expect(idToken.expiration).to.equal(exp);
    });

    it("verfies the rawIdToken is saved correctly", function () {

        const idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2);
        expect(idToken.rawIdToken).to.equal(TEST_TOKENS.IDTOKEN_V2);
    });

    it("verifies claims are generated properly in the idToken class", function () {

        const idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2);
        const idTokenClaims = idToken.claims;
        const iss: string = "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0";
        const claimIss = "iss";

        expect(idTokenClaims[claimIss]).to.equal(iss);
    });

    it("verifies if new claim is added, it reflects in the idTokena", function () {

        const idToken: IdToken = new IdToken(TEST_TOKENS.IDTOKEN_V2_NEWCLAIM);
        const idTokenClaims = idToken.claims;
        const claimEmail = "email";

        expect(idTokenClaims[claimEmail]).to.equal("AbeLi@microsoft.com");
    });

    describe("constructor parsing the raw id token string", function () {

        let idTokenObj : IdToken;

        afterEach(function () {
            idTokenObj = null;
        });

        it("throws an error if an null string is passed", function () {
            let authErr : AuthError;
            let nullString : string = null;
            try {
                idTokenObj = new IdToken(nullString);
            } catch (e) {
                authErr = e;
            }

            expect(authErr instanceof ClientAuthError).to.be.true;
            expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.nullOrEmptyIdToken.code);
            expect(authErr.errorMessage).to.contain(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(authErr.message).to.contain(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(authErr.name).to.equal("ClientAuthError");
            expect(authErr.stack).to.include("IdToken.spec.ts");
        });

        it("throws an error if an empty string is passed", function () {
            let authErr : AuthError;
            let emptyString = "";
            try {
                idTokenObj = new IdToken(emptyString);
            } catch (e) {
                authErr = e;
            }

            expect(authErr instanceof ClientAuthError).to.be.true;
            expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.nullOrEmptyIdToken.code);
            expect(authErr.errorMessage).to.contain(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(authErr.message).to.contain(ClientAuthErrorMessage.nullOrEmptyIdToken.desc);
            expect(authErr.name).to.equal("ClientAuthError");
            expect(authErr.stack).to.include("IdToken.spec.ts");
        });

    });

});
