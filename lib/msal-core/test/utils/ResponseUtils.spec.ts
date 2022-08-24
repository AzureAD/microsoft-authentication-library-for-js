import { ResponseUtils } from "../../src/utils/ResponseUtils"
import { AuthResponse } from "../../src/AuthResponse";
import { IdToken } from "../../src/IdToken";
import { TEST_TOKENS } from "../TestConstants";


describe("ResponseUtils.ts class", () => {

    const EMPTY_RESPONSE : AuthResponse = {
        uniqueId: "",
        tenantId: "",
        tokenType: "",
        idToken: null,
        idTokenClaims: null,
        accessToken: null,
        scopes: [],
        expiresOn: null,
        account: null,
        accountState: "",
        fromCache: false
    };

    let idTokenObj: IdToken;
    beforeEach(() => {
        idTokenObj = new IdToken(TEST_TOKENS.IDTOKEN_V2);
    });

    it("setResponseIdToken sets authResponse idToken value", () => {
        let newAuthResponse = ResponseUtils.setResponseIdToken(EMPTY_RESPONSE, idTokenObj);
        expect(newAuthResponse.idToken).toBe(idTokenObj);
        expect(newAuthResponse.idTokenClaims).toBe(idTokenObj.claims);
        expect(newAuthResponse.uniqueId).toBe(idTokenObj.objectId || idTokenObj.subject);
        expect(newAuthResponse.tenantId).toBe(idTokenObj.tenantId);
    });

    it("setResponseIdToken returns null if given a null original request.", () => {
        let newAuthResponse = ResponseUtils.setResponseIdToken(null, idTokenObj);
        expect(newAuthResponse).toBeNull();
    });

    it("setResponseIdToken returns original response if given a null idTokenObj", () => {
        let newAuthResponse = ResponseUtils.setResponseIdToken(EMPTY_RESPONSE, null);
        expect(newAuthResponse).toBe(EMPTY_RESPONSE);
    })
});
