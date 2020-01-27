import { expect } from "chai";
import { RequestUtils } from "../../src/utils/RequestUtils";
import { CryptoUtils } from "../../src/utils/CryptoUtils";
import { AuthenticationParameters } from "../../src/AuthenticationParameters";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { TEST_CONFIG } from "../TestConstants";
import { StringDict } from "../../src/MsalTypes";


describe("RequestUtils.ts class", () => {

    it("Scopes cannot be null", () => {

        let undefinedScopesError : ClientConfigurationError;

        try {
            const userRequest: AuthenticationParameters = {scopes: null};
            const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, false, TEST_CONFIG.MSAL_CLIENT_ID);
        } catch (e) {
            undefinedScopesError = e;
        };

        expect(undefinedScopesError instanceof ClientConfigurationError).to.be.true;
        expect(undefinedScopesError.errorCode).to.equal(ClientConfigurationErrorMessage.scopesRequired.code);
        expect(undefinedScopesError.name).to.equal("ClientConfigurationError");
        expect(undefinedScopesError.stack).to.include("RequestUtils.spec.ts");
    });

    it("Scopes cannot be empty", () => {

        let emptyScopesError : ClientConfigurationError;

        try {
            const userRequest: AuthenticationParameters = {scopes: []};
            const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, false, TEST_CONFIG.MSAL_CLIENT_ID);
        } catch (e) {
            emptyScopesError = e;
        };

        expect(emptyScopesError instanceof ClientConfigurationError).to.be.true;
        expect(emptyScopesError.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
        expect(emptyScopesError.name).to.equal("ClientConfigurationError");
        expect(emptyScopesError.stack).to.include("RequestUtils.spec.ts");
    });

    it("ClientId can be sent only as a single scope", () => {

        let improperScopes : ClientConfigurationError;

        try {
            const userRequest: AuthenticationParameters = {scopes: [TEST_CONFIG.MSAL_CLIENT_ID, "newScope`"]};
            const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, false, TEST_CONFIG.MSAL_CLIENT_ID);
        } catch (e) {
            improperScopes = e;
        };

        expect(improperScopes instanceof ClientConfigurationError).to.be.true;
        expect(improperScopes.errorCode).to.equal(ClientConfigurationErrorMessage.clientScope.code);
        expect(improperScopes.name).to.equal("ClientConfigurationError");
        expect(improperScopes.stack).to.include("RequestUtils.spec.ts");
    });

    it("validate prompt", () => {

        let promptError: ClientConfigurationError;

        try {
            RequestUtils.validatePromptParameter("random");
        } catch (e) {
            promptError = e;
        };

        expect(promptError instanceof ClientConfigurationError).to.be.true;
        expect(promptError.errorCode).to.equal(ClientConfigurationErrorMessage.invalidPrompt.code);
        expect(promptError.name).to.equal("ClientConfigurationError");
        expect(promptError.stack).to.include("RequestUtils.spec.ts");
    });

    it("remove duplicated extraQueryParameters", () => {

        const extraQueryParameters: StringDict = {param1: "param1", param2: "param2", login_hint: "random", sid: "someSID"};
        const eqParams = RequestUtils.validateEQParameters(extraQueryParameters, null);

        expect(extraQueryParameters.login_hint).to.be.equal("random");
        expect(extraQueryParameters.sid).to.be.equal("someSID");
        expect(eqParams.param1).to.be.eq("param1");
        expect(eqParams.login_hint).to.be.eq(undefined);
        expect(eqParams.sid).to.be.eq(undefined);
    });

    it("validate and generate state", () => {
        const userState: string = "abcd";
        const state: string = RequestUtils.validateAndGenerateState(userState);
        const splitKey: Array<string> = state.split("|");

        expect(state).to.contain("|");
        expect(state).to.contain("abcd");
        expect(CryptoUtils.isGuid(splitKey[0])).to.be.equal(true);
    });

    it("validate and generate correlationId", () => {
        const userCorrelationId: string = null;
        const correlationId: string = RequestUtils.validateAndGenerateCorrelationId(userCorrelationId);

        expect(CryptoUtils.isGuid(correlationId)).to.be.equal(true);
    });

    it("validate empty request", () => {
        const userRequest: AuthenticationParameters = null;
        const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, true, TEST_CONFIG.MSAL_CLIENT_ID);

        expect(request.scopes).to.be.equal(undefined);
        expect(request.prompt).to.be.equal(undefined);
        expect(request.extraQueryParameters).to.be.equal(undefined);
        expect(CryptoUtils.isGuid(request.state)).to.be.equal(true);
        expect(CryptoUtils.isGuid(request.correlationId)).to.be.equal(true);
    });

});
