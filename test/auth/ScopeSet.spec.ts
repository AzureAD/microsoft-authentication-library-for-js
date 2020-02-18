import { expect } from "chai";
import { ScopeSet } from "../../src/auth/ScopeSet";
import { TEST_CONFIG } from "../utils/StringConstants";
import { ClientConfigurationError, ClientConfigurationErrorMessage, Constants } from "../../src";

describe("ScopeSet.ts", () => {
    
    describe("Constructor and scope validation", () => {

        it("Throws error if scopes are null or empty and required", () => {
            expect(() => new ScopeSet(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);

            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);
        });

        it("Throws error if scopes are not array object", () => {
            expect(() => new ScopeSet(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.throw(ClientConfigurationErrorMessage.nonArrayScopesError.desc);
            expect(() => new ScopeSet(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.throw(ClientConfigurationError);
        });

        it("Does not throw error if scopes are empty but not required", () => {
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
        });

        it("Appends client id to scopes and replaces it by default if scopes are not required", () => {
            const scopeSet = new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Replaces client id if scopes are required and client id is provided", () => {
            const scopeSet = new ScopeSet([TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Does not append client id when scopes are required", () => {
            const testScope = "testscope";
            const scopeSet = new ScopeSet([testScope], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([testScope]);
            expect(scopeSet.asArray()).to.deep.eq([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Converts array string values to lower case", () => {
            const testScope1 = "TestScope1";
            const lowerCaseScope1 = "testscope1";
            const testScope2 = "TeStScOpE2";
            const lowerCaseScope2 = "testscope2";
            const testScope3 = "TESTSCOPE3";
            const lowerCaseScope3 = "testscope3";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Removes duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE";
            const testScope3 = "TESTSCOPE";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const lowerCaseScope = "testscope";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3, testScope4, testScope5], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });
    });

    describe("fromString Constructor", () => {

        it("Throws error if scopeString is empty, null or undefined if scopes are required", () => {
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);

            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);

            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);
        });

        it("Creates a default ScopeSet to send to the service if scopes are not required and empty, null or undefined", () => {
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
            const scopeSet1 = ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet1.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet1.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);

            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
            const scopeSet2 = ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet2.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet2.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);

            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
            const scopeSet3 = ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet3.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet3.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Replaces client id if scopes are required and client id is provided", () => {
            const scopeSet = ScopeSet.fromString(TEST_CONFIG.MSAL_CLIENT_ID, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Does not append client id when scopes are required", () => {
            const testScope = "testscope";
            const scopeSet = ScopeSet.fromString(testScope, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([testScope]);
            expect(scopeSet.asArray()).to.deep.eq([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Converts array string values to lower case", () => {
            const testScope1 = "TestScope1";
            const lowerCaseScope1 = "testscope1";
            const testScope2 = "TeStScOpE2";
            const lowerCaseScope2 = "testscope2";
            const testScope3 = "TESTSCOPE3";
            const lowerCaseScope3 = "testscope3";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3}`, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Removes duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE";
            const testScope3 = "TESTSCOPE";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const lowerCaseScope = "testscope";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3} ${testScope4} ${testScope5}`, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });
    });

    describe("Getters and Setters", () => {

    });
});
