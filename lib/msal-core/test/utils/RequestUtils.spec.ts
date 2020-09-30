import { expect } from "chai";
import { RequestUtils } from "../../src/utils/RequestUtils";
import { CryptoUtils } from "../../src/utils/CryptoUtils";
import { AuthenticationParameters } from "../../src/AuthenticationParameters";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { TEST_CONFIG, TEST_TOKEN_LIFETIMES } from "../TestConstants";
import { StringDict } from "../../src/MsalTypes";
import { TimeUtils } from "../../src/utils/TimeUtils";
import sinon from "sinon";
import { Constants } from "../../src/utils/Constants";


describe("RequestUtils.ts class", () => {

    it("Scopes cannot be null", () => {

        let undefinedScopesError : ClientConfigurationError;

        try {
            const userRequest: AuthenticationParameters = {scopes: null};
            const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, false, TEST_CONFIG.MSAL_CLIENT_ID, Constants.interactionTypeSilent);
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
            const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, false, TEST_CONFIG.MSAL_CLIENT_ID, Constants.interactionTypeSilent);
        } catch (e) {
            emptyScopesError = e;
        };

        expect(emptyScopesError instanceof ClientConfigurationError).to.be.true;
        expect(emptyScopesError.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
        expect(emptyScopesError.name).to.equal("ClientConfigurationError");
        expect(emptyScopesError.stack).to.include("RequestUtils.spec.ts");
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
        const nowStub = sinon.stub(TimeUtils, "now").returns(TEST_TOKEN_LIFETIMES.BASELINE_DATE_CHECK);
        const userState: string = "abcd";
        const state: string = RequestUtils.validateAndGenerateState(userState, Constants.interactionTypeSilent);
        const now = TimeUtils.now();
        const splitKey: Array<string> = state.split("|");
        expect(splitKey[1]).to.contain("abcd");

        const parsedState = RequestUtils.parseLibraryState(state);
        expect(CryptoUtils.isGuid(parsedState.id)).to.be.equal(true);
        expect(parsedState.ts).to.be.equal(now);
        nowStub.restore();
    });

    it("properly handles encoded state", () => {
        const state = "eyJpZCI6IjJkZWQwNGU5LWYzZGYtNGU0Ny04YzRlLWY0MDMyMTU3YmJlOCIsInRzIjoxNTg1OTMyNzg5LCJtZXRob2QiOiJzaWxlbnRJbnRlcmFjdGlvbiJ9%7Chello";

        const parsedState = RequestUtils.parseLibraryState(state);
        expect(CryptoUtils.isGuid(parsedState.id)).to.be.equal(true);
    });

    it("parses old guid state format", () => {
        const now = TimeUtils.now();
        const nowStub = sinon.stub(TimeUtils, "now").returns(now);

        const stateGuid = CryptoUtils.createNewGuid();

        const parsedState = RequestUtils.parseLibraryState(`${stateGuid}|user-state`);

        expect(parsedState.id).to.be.equal(stateGuid);
        expect(parsedState.method).to.be.equal(Constants.interactionTypeRedirect);
        expect(parsedState.ts).to.be.equal(now);

        nowStub.restore();
    })

    it("generates expected state if there is a delay between generating and parsing", function(done) {
        this.timeout(5000);

        sinon.restore();
        const now = TimeUtils.now();
        const nowStub = sinon.stub(TimeUtils, "now").returns(now);

        const userState: string = "abcd";
        const state: string = RequestUtils.validateAndGenerateState(userState, Constants.interactionTypeSilent);
        nowStub.restore();

        // Mimicks tab suspending
        setTimeout(() => {
            const parsedState = RequestUtils.parseLibraryState(state);
            expect(parsedState.ts).to.be.equal(now);
            done();
        }, 4000);
    });

    it("validate and generate correlationId", () => {
        const userCorrelationId: string = null;
        const correlationId: string = RequestUtils.validateAndGenerateCorrelationId(userCorrelationId);

        expect(CryptoUtils.isGuid(correlationId)).to.be.equal(true);
    });

    it("validate empty request", () => {
        const userRequest: AuthenticationParameters = null;
        const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, true, TEST_CONFIG.MSAL_CLIENT_ID, Constants.interactionTypeSilent);

        expect(request.scopes).to.be.equal(undefined);
        expect(request.prompt).to.be.equal(undefined);
        expect(request.extraQueryParameters).to.be.equal(undefined);
        expect(typeof request.state).to.be.equal("string");
        expect(CryptoUtils.isGuid(request.correlationId)).to.be.equal(true);
    });

    it("generate request signature", () => {
        const userRequest: AuthenticationParameters = { scopes: ["s1", "s2", "s3"], authority: TEST_CONFIG.validAuthority};
        const requestSignature = RequestUtils.createRequestSignature(userRequest);

        expect(requestSignature).to.be.equal("s1 s2 s3|https://login.microsoftonline.com/common/");
    });

});
