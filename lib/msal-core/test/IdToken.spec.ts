import { expect } from "chai";
import { IdToken } from "../src/IdToken";
import { AuthError, ClientAuthError } from "../src";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";

describe("IdToken", function() {

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
            expect(authErr.stack).to.include("IdToken.spec.js");
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
            expect(authErr.stack).to.include("IdToken.spec.js");
        });

    });

});
