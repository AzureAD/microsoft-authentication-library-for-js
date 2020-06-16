import { expect } from "chai";
import { RequestUtils } from "../../src/utils/RequestUtils";
import { CryptoUtils } from "../../src/utils/CryptoUtils";
import { AuthenticationParameters } from "../../src/AuthenticationParameters";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../../src/error/ClientConfigurationError";
import { TEST_CONFIG, TEST_TOKEN_LIFETIMES, TEST_URIS } from "../TestConstants";
import { ScopeSet } from "../../src/ScopeSet";
import { StringDict } from "../../src/MsalTypes";
import { TimeUtils } from "../../src/utils/TimeUtils";
import sinon from "sinon";
import { Constants, InteractionType } from "../../src/utils/Constants";

const clientId = TEST_CONFIG.MSAL_CLIENT_ID;

describe("RequestUtils.ts class", () => {
    const scopelessRequest: AuthenticationParameters = {
        authority: TEST_CONFIG.validAuthority,
        forceRefresh: false,
        redirectUri: TEST_URIS.TEST_REDIR_URI,
    };

    describe("validateRequest", () => {
        it("should throw emptyRequestError when the request passed in is null", () => {
            let emptyRequestError: ClientConfigurationError;

            try {
                const userRequest: AuthenticationParameters = null;
                const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, TEST_CONFIG.MSAL_CLIENT_ID, Constants.interactionTypeSilent);
            } catch (e) {
                emptyRequestError = e;
            }

            expect(emptyRequestError instanceof ClientConfigurationError).to.be.true;
            expect(emptyRequestError.errorCode).to.equal(ClientConfigurationErrorMessage.emptyRequestError.code);
            expect(emptyRequestError.name).to.equal("ClientConfigurationError");
            expect(emptyRequestError.stack).to.include("RequestUtils.spec.ts");
        });

        it("should throw scopesRequiredError if scopes are empty or null", () => {
            let scopesRequiredError: ClientConfigurationError;

            try {
                const request: AuthenticationParameters = RequestUtils.validateRequest(scopelessRequest, clientId, Constants.interactionTypeSilent);
            } catch (e) {
                scopesRequiredError = e;
            }

            expect(scopesRequiredError instanceof ClientConfigurationError).to.eq(true);
            expect(scopesRequiredError.errorCode).to.equal(ClientConfigurationErrorMessage.scopesRequired.code);
            expect(scopesRequiredError.message).to.contain(ClientConfigurationErrorMessage.scopesRequired.desc);
        });

        it("should throw scopesNonArrayError if scopes is not an array object", () => {
            let scopesNonArrayError: ClientConfigurationError;

            try {
                // @ts-ignore
                const userRequest: AuthenticationParameters = { ...scopelessRequest, scopes: {} };
                const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, clientId, Constants.interactionTypeSilent);
            } catch (e) {
                scopesNonArrayError = e;
            }

            expect(scopesNonArrayError instanceof ClientConfigurationError).to.eq(true);
            expect(scopesNonArrayError.errorCode).to.equal(ClientConfigurationErrorMessage.nonArrayScopes.code);
            expect(scopesNonArrayError.message).to.contain(ClientConfigurationErrorMessage.nonArrayScopes.desc);
        });

        it("should throw emptyScopesArrayError if scopes is an empty array", () => {
            let emptyScopesArrayError: ClientConfigurationError;

            try {
                const userRequest: AuthenticationParameters = { ...scopelessRequest, scopes: [] };
                const request: AuthenticationParameters = RequestUtils.validateRequest(userRequest, clientId, Constants.interactionTypeSilent);
            } catch (e) {
                emptyScopesArrayError = e;
            }

            expect(emptyScopesArrayError instanceof ClientConfigurationError).to.eq(true);
            expect(emptyScopesArrayError.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
            expect(emptyScopesArrayError.message).to.contain(ClientConfigurationErrorMessage.emptyScopes.desc);
        });

    });

    describe("validateLoginRequest", () => {
        afterEach(() => {
            sinon.restore();
        });

        it("should append openid and profile to request scopes if they are not included before calling validateRequest", () => {
            const loginRequest: AuthenticationParameters = { ...scopelessRequest, scopes: ["s1"] };

            sinon.stub(RequestUtils, "validateRequest").callsFake((loginRequest: AuthenticationParameters, clientId: string, interactionType: InteractionType) : AuthenticationParameters => {
                expect(loginRequest.scopes).to.include(Constants.openidScope);
                expect(loginRequest.scopes).to.include(Constants.profileScope);
                return loginRequest;
            });

            const validatedLoginRequest: AuthenticationParameters = RequestUtils.validateLoginRequest(loginRequest, clientId, Constants.interactionTypeSilent);
        });

        it("should append extra scopes to consent to request scopes after calling validateRequest", () => {
            const extraScope = "s1";
            const loginRequest: AuthenticationParameters = { ...scopelessRequest, extraScopesToConsent: [ extraScope ] };
            const validatedLoginRequest: AuthenticationParameters = RequestUtils.validateLoginRequest(loginRequest, clientId, Constants.interactionTypeSilent);
            // At this point, scopes should include openid, profile and S1, the extra scope to consent
            expect(validatedLoginRequest.scopes.length).to.eql(3);
            expect(validatedLoginRequest.scopes).to.include(extraScope);
        });

        it("should only append login scopes once when openid and profile are passed in as extraScopesToAppend", () => {
            const extraScopes = ["openid", "profile"];
            const loginRequest: AuthenticationParameters = { ...scopelessRequest, extraScopesToConsent: extraScopes };
            const validatedLoginRequest: AuthenticationParameters = RequestUtils.validateLoginRequest(loginRequest, clientId, Constants.interactionTypeSilent);
            expect(validatedLoginRequest.scopes).to.deep.eq(extraScopes);
        });
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

    it("generate request signature", () => {
        const userRequest: AuthenticationParameters = { scopes: ["s1", "s2", "s3"], authority: TEST_CONFIG.validAuthority};
        const requestSignature = RequestUtils.createRequestSignature(userRequest);

        expect(requestSignature).to.be.equal("s1 s2 s3|https://login.microsoftonline.com/common");
    });

});
