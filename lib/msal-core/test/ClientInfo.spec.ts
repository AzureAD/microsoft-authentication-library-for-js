import { expect } from "chai";
import sinon from "sinon";
import { ClientInfo } from "../src/ClientInfo";
import { ClientAuthError, AuthError } from "../src";
import { ClientAuthErrorMessage } from "../src/error/ClientAuthError";
import { Utils } from "../src/Utils";

describe("Client Info", function () {
    let TEST_UID = "123-test-uid";
    let TEST_UTID = "456-test-utid";
    let TEST_DECODED_CLIENT_INFO = `{"uid":"123-test-uid","utid":"456-test-utid"}`;
    let TEST_INVALID_JSON_CLIENT_INFO = `{"uid":"${TEST_UID}""utid":"${TEST_UTID}"`;
    let TEST_RAW_CLIENT_INFO = "eyJ1aWQiOiIxMjMtdGVzdC11aWQiLCJ1dGlkIjoiNDU2LXRlc3QtdXRpZCJ9";
    
    describe("getters and setters", function () {

        let clientInfoObj : ClientInfo;
        beforeEach(function () {
            clientInfoObj = new ClientInfo("");
        });

        afterEach(function () {
            clientInfoObj = null;
        });

        it("for uid", function () {
            expect(clientInfoObj.uid).to.be.empty;
            clientInfoObj.uid = TEST_UID;
            expect(clientInfoObj.uid).to.be.eq(TEST_UID);
        });

        it("for utid", function () {
            expect(clientInfoObj.utid).to.be.empty;
            clientInfoObj.utid = TEST_UTID;
            expect(clientInfoObj.utid).to.be.eq(TEST_UTID);
        });

    });

    describe("Parsing raw client info string", function () {

        let clientInfoObj : ClientInfo;
        afterEach(function () {
            clientInfoObj = null;
            sinon.restore();
        });

        it("sets uid and utid to empty if null or empty string is passed", function () {
            let nullString : string = null;
            clientInfoObj = new ClientInfo(nullString);
            expect(clientInfoObj.uid).to.be.empty;
            expect(clientInfoObj.utid).to.be.empty;
            let emptyString = "";
            clientInfoObj = new ClientInfo(emptyString);
            expect(clientInfoObj.uid).to.be.empty;
            expect(clientInfoObj.utid).to.be.empty;
        });

        it("throws an error if invalid raw string is given", function () {
            let invalidRawString = "youCan'tParseThis";
            let authErr : AuthError;
            try {
                clientInfoObj = new ClientInfo(invalidRawString);
            } catch (e) {
                authErr = e;
            }

            expect(authErr instanceof ClientAuthError).to.be.true;
            expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.clientInfoDecodingError.code);
            expect(authErr.errorMessage).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.message).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.name).to.equal("ClientAuthError");
            expect(authErr.stack).to.include("ClientInfo.spec.js");
        });

        it("throws an error if the decoded string is not a valid JSON object.", function () {
            sinon.stub(Utils, "base64DecodeStringUrlSafe").returns(TEST_INVALID_JSON_CLIENT_INFO);
            let authErr : AuthError;
            try {
                // What we pass in here doesn't matter since we are stubbing
                clientInfoObj = new ClientInfo(TEST_RAW_CLIENT_INFO);
            } catch (e) {
                authErr = e;
            }

            expect(authErr instanceof ClientAuthError).to.be.true;
            expect(authErr.errorCode).to.equal(ClientAuthErrorMessage.clientInfoDecodingError.code);
            expect(authErr.errorMessage).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.message).to.contain(ClientAuthErrorMessage.clientInfoDecodingError.desc);
            expect(authErr.name).to.equal("ClientAuthError");
            expect(authErr.stack).to.include("ClientInfo.spec.js");
        });

        it("correct sets uid and utid if parsing is done correctly", function () {
            sinon.stub(Utils, "base64DecodeStringUrlSafe").returns(TEST_DECODED_CLIENT_INFO);
            // What we pass in here doesn't matter since we are stubbing
            clientInfoObj = new ClientInfo(TEST_RAW_CLIENT_INFO);
            expect(clientInfoObj).to.not.be.null;
            expect(clientInfoObj.uid).to.be.eq(TEST_UID);
            expect(clientInfoObj.utid).to.be.eq(TEST_UTID);
        });

    });

});