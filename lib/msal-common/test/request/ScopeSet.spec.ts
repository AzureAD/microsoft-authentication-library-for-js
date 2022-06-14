import { ScopeSet } from "../../src/request/ScopeSet";
import sinon from "sinon";
import { OIDC_DEFAULT_SCOPES, OIDC_SCOPES, Constants } from "../../src/utils/Constants";
import { ClientConfigurationErrorMessage, ClientConfigurationError } from "../../src/error/ClientConfigurationError";
import { ClientAuthErrorMessage, ClientAuthError } from "../../src/error/ClientAuthError";

describe("ScopeSet.ts", () => {

    describe("Constructor and scope validation", () => {

        it("Throws error if scopes are null or empty and required", () => {
            // @ts-ignore
            expect(() => new ScopeSet(null)).toThrowError(ClientConfigurationErrorMessage.emptyScopesError.desc);
            // @ts-ignore
            expect(() => new ScopeSet(null)).toThrowError(ClientConfigurationError);

            expect(() => new ScopeSet([])).toThrowError(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet([])).toThrowError(ClientConfigurationError);
        });

        it("Trims array string values", () => {
            const testScope1 = "    TestScope1";
            const trimmedTestScope1 = "TestScope1";
            const testScope2 = "TeStScOpE2   ";
            const trimmedTestScope2 = "TeStScOpE2";
            const testScope3 = "   TESTSCOPE3   ";
            const trimmedTestScope3 = "TESTSCOPE3";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3]);
            expect(scopeSet.asArray()).toEqual([trimmedTestScope1, trimmedTestScope2, trimmedTestScope3]);
        });

        it("Removes case-sensitive duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE";
            const testScope3 = "TESTSCOPE";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3, testScope4, testScope5]);
            expect(scopeSet.asArray()).toEqual([testScope1, testScope2, testScope3, testScope4]);
        });
    });

    describe("fromString Constructor", () => {

        it("Throws error if scopeString is empty, null or undefined if scopes are required", () => {
            expect(() => ScopeSet.fromString("")).toThrowError(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString("")).toThrowError(ClientConfigurationError);

            // @ts-ignore
            expect(() => ScopeSet.fromString(null)).toThrowError(ClientConfigurationErrorMessage.emptyScopesError.desc);
            // @ts-ignore
            expect(() => ScopeSet.fromString(null)).toThrowError(ClientConfigurationError);

            // @ts-ignore
            expect(() => ScopeSet.fromString(undefined)).toThrowError(ClientConfigurationErrorMessage.emptyScopesError.desc);
            // @ts-ignore
            expect(() => ScopeSet.fromString(undefined)).toThrowError(ClientConfigurationError);
        });

        it("Trims array string values", () => {
            const testScope1 = "   TestScope1";
            const trimmedTestScope1 = "TestScope1";
            const testScope2 = "TeStScOpE2   ";
            const trimmedTestScope2 = "TeStScOpE2";
            const testScope3 = "   TESTSCOPE3  ";
            const trimmedTestScope3 = "TESTSCOPE3";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3}`);
            expect(scopeSet.asArray()).toEqual([trimmedTestScope1, trimmedTestScope2, trimmedTestScope3]);
        });

        it("Removes case-sensitive duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE";
            const testScope3 = "TESTSCOPE";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3} ${testScope4} ${testScope5}`);
            expect(scopeSet.asArray()).toEqual([testScope1, testScope2, testScope3, testScope4]);
        });
    });

    describe("Set functions", () => {

        let scopes: ScopeSet;
        let testScope: string;
        beforeEach(() => {
            testScope = "testscope";
            scopes = new ScopeSet([testScope]);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("containsScope() checks if a given scope is present in the set of scopes", () => {
            expect(scopes.containsScope(Constants.OPENID_SCOPE)).toBe(false);
            expect(scopes.containsScope("notinset")).toBe(false);
            expect(scopes.containsScope(testScope)).toBe(true);
        });

        it("containsScope() returns false if null or empty scope is passed to it", () => {
            expect(scopes.containsScope("")).toBe(false);
            // @ts-ignore
            expect(scopes.containsScope(null)).toBe(false);
            // @ts-ignore
            expect(scopes.containsScope(undefined)).toBe(false);
        });

        it("containsScopeSet() checks if a given ScopeSet is fully contained in another - returns false otherwise", () => {
            const biggerSet = new ScopeSet([testScope, "testScope2", "testScope3"]);
            expect(biggerSet.containsScopeSet(scopes)).toBe(true);

            const alternateSet = new ScopeSet(["testScope2"]);
            expect(scopes.containsScopeSet(alternateSet)).toBe(false);
        });

        it("containsScopeSet() returns false if given ScopeSet is null or undefined", () => {
            // @ts-ignore
            expect(scopes.containsScopeSet(null)).toBe(false);
            // @ts-ignore
            expect(scopes.containsScopeSet(undefined)).toBe(false);
        });

        it("appendScope() adds scope to set after trimming", () => {
            expect(scopes.asArray()).toEqual(expect.arrayContaining([testScope]));
            scopes.appendScope("   testScope2   ");
            expect(scopes.asArray()).toEqual(expect.arrayContaining(["testScope2"]));
        });

        it("appendScope() does not add duplicates to ScopeSet", () => {
            const scopeArr = scopes.asArray();
            scopes.appendScope(testScope);
            const newScopeArr = scopes.asArray();
            expect(newScopeArr).toEqual(scopeArr);
        });

        it("appendScope() does nothing if given scope is empty, null or undefined", () => {
            const testScopes = [testScope];
            const setAddSpy = sinon.spy(Set.prototype, "add");
            scopes.appendScope("");
            expect(setAddSpy.called).toBe(false);
            expect(scopes.asArray()).toEqual(testScopes);

            // @ts-ignore
            scopes.appendScope(null);
            expect(setAddSpy.called).toBe(false);
            expect(scopes.asArray()).toEqual(testScopes);

            // @ts-ignore
            scopes.appendScope(undefined);
            expect(setAddSpy.called).toBe(false);
            expect(scopes.asArray()).toEqual(testScopes);
        });

        it("appendScopes() throws error if given array is null or undefined", () => {
            // @ts-ignore
            expect(() => scopes.appendScopes(null)).toThrowError(ClientAuthError);
            // @ts-ignore
            expect(() => scopes.appendScopes(null)).toThrowError(ClientAuthErrorMessage.appendScopeSetError.desc);

            // @ts-ignore
            expect(() => scopes.appendScopes(undefined)).toThrowError(ClientAuthError);
            // @ts-ignore
            expect(() => scopes.appendScopes(undefined)).toThrowError(ClientAuthErrorMessage.appendScopeSetError.desc);
        });

        it("appendScopes() does not change ScopeSet if given array is empty", () => {
            const scopeArr = scopes.asArray();
            scopes.appendScopes([]);
            expect(scopes.asArray()).toEqual(scopeArr);
        });

        it("appendScopes() adds multiple scopes to ScopeSet", () => {
            const testScope2 = "testscope2";
            const testScope3 = "testscope3";
            scopes.appendScopes([testScope2, testScope3]);
            expect(scopes.asArray()).toEqual(expect.arrayContaining([testScope2]));
            expect(scopes.asArray()).toEqual(expect.arrayContaining([testScope3]));
        });

        it("appendScopes() trims scopes before adding", () => {
            const testScope2 = "   TestScope2";
            const expectedTestScope2 = "TestScope2";
            const testScope3 = "     testscope3   ";
            const expectedTestScope3 = "testscope3";
            scopes.appendScopes([testScope2, testScope3]);
            expect(scopes.asArray()).toEqual(expect.arrayContaining([expectedTestScope2]));
            expect(scopes.asArray()).toEqual(expect.arrayContaining([expectedTestScope3]));
        })

        it("appendScopes() does not add duplicate scopes", () => {
            const unchangedScopes = new ScopeSet([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
            const scopeArr = unchangedScopes.asArray();
            unchangedScopes.appendScopes([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
            expect(unchangedScopes.asArray()).toEqual(scopeArr);
        });

        it("removeScopes() throws error if scope is null, undefined or empty", () => {
            // @ts-ignore
            expect(() => scopes.removeScope(null)).toThrowError(ClientAuthErrorMessage.removeEmptyScopeError.desc);
            // @ts-ignore
            expect(() => scopes.removeScope(null)).toThrowError(ClientAuthError);

            // @ts-ignore
            expect(() => scopes.removeScope(undefined)).toThrowError(ClientAuthErrorMessage.removeEmptyScopeError.desc);
            // @ts-ignore
            expect(() => scopes.removeScope(undefined)).toThrowError(ClientAuthError);

            expect(() => scopes.removeScope("")).toThrowError(ClientAuthErrorMessage.removeEmptyScopeError.desc);
            expect(() => scopes.removeScope("")).toThrowError(ClientAuthError);
        });

        it("removeScopes() correctly removes scopes", () => {
            const scopeArr = scopes.asArray();
            scopes.removeScope("testScope2");
            expect(scopes.asArray()).toEqual(scopeArr);
            scopes.removeScope(testScope);
            expect(scopes.asArray()).toHaveLength(0);
        });

        it("unionScopeSets() throws error if input is null or undefined", () => {
            // @ts-ignore
            expect(() => scopes.unionScopeSets(null)).toThrowError(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            // @ts-ignore
            expect(() => scopes.unionScopeSets(null)).toThrowError(ClientAuthError);

            // @ts-ignore
            expect(() => scopes.unionScopeSets(undefined)).toThrowError(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            // @ts-ignore
            expect(() => scopes.unionScopeSets(undefined)).toThrowError(ClientAuthError);
        });

        it("unionScopeSets() combines multiple sets and returns new Set of scopes", () => {
            const testScope2 = "testScope2";
            const testScope3 = "testScope3";
            const newScopeSet = new ScopeSet([testScope2, testScope3]);
            newScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);

            const unionSet = newScopeSet.unionScopeSets(scopes);
            const unionArray = Array.from(unionSet);
            expect(unionSet instanceof Set).toBe(true);
            expect(unionSet.size).toBe(newScopeSet.getScopeCount() + scopes.getScopeCount());
            for(let i = 0; i < unionArray.length; i++) {
                expect(newScopeSet.containsScope(unionArray[i]) || scopes.containsScope(unionArray[i])).toBe(true);
            }
        });

        it("intersectingScopeSets() throws error if input is null or undefined", () => {
            // @ts-ignore
            expect(() => scopes.intersectingScopeSets(null)).toThrowError(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            // @ts-ignore
            expect(() => scopes.intersectingScopeSets(null)).toThrowError(ClientAuthError);

            // @ts-ignore
            expect(() => scopes.intersectingScopeSets(undefined)).toThrowError(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            // @ts-ignore
            expect(() => scopes.intersectingScopeSets(undefined)).toThrowError(ClientAuthError);
        });

        it("intersectingScopeSets() returns true if ScopeSets have one or more scopes in common", () => {
            const testScope2 = "testScope2";
            const newScopeSet = new ScopeSet([testScope, testScope2]);
            expect(newScopeSet.intersectingScopeSets(scopes)).toBe(true);
        });

        it("intersectingScopeSets() returns false if ScopeSets have no scopes in common", () => {
            const testScope2 = "testScope2";
            const testScope3 = "testScope3";
            const newScopeSet = new ScopeSet([testScope2, testScope3]);
            newScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);

            expect(newScopeSet.intersectingScopeSets(scopes)).toBe(false);
        });

        it("intersectingScopeSets() does not ignore OIDC scopes if they are only present", () => {
            const scopeset1 = new ScopeSet([...OIDC_SCOPES]);
            const scopeset2 = new ScopeSet([...OIDC_SCOPES]);
            expect(scopeset1.intersectingScopeSets(scopeset2)).toBe(true);
        });

        it("intersectingScopeSets() ignores OIDC scopes if other scopes are present", () => {
            const testScope = "testScope";
            const testScope2 = "testScope2";
            const scopeset1 = new ScopeSet([...OIDC_SCOPES, testScope]);
            const scopeset2 = new ScopeSet([...OIDC_SCOPES, testScope2]);
            expect(scopeset1.intersectingScopeSets(scopeset2)).toBe(false);

            const scopeset3 = new ScopeSet([Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.EMAIL_SCOPE, testScope]);
            const scopeset4 = new ScopeSet([...OIDC_DEFAULT_SCOPES, testScope]);
            expect(scopeset3.intersectingScopeSets(scopeset4)).toBe(true);
        });

        it("getScopeCount() correctly returns the size of the ScopeSet", () => {
            expect(scopes.getScopeCount()).toBe(1);

            const twoScopes = new ScopeSet(["1", "2"]);
            expect(twoScopes.getScopeCount()).toBe(2);

            const threeScopes = new ScopeSet(["1", "2", "3"])
            expect(threeScopes.getScopeCount()).toBe(3);
        });
    });

    describe("Getters and Setters", () => {

        let requiredScopeSet: ScopeSet;
        let nonRequiredScopeSet: ScopeSet;
        let uppercaseScopeSet: ScopeSet;
        let lowercaseScopeSet: ScopeSet;
        let testScope: string;
        let testScope2: string;
        beforeEach(() => {
            testScope = "testscope";
            testScope2 = "testScope";
            requiredScopeSet = new ScopeSet([testScope]);
            nonRequiredScopeSet = new ScopeSet([testScope]);
            uppercaseScopeSet = new ScopeSet([testScope2]);
            lowercaseScopeSet = new ScopeSet([testScope]);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("asArray() returns ScopeSet as an array", () => {
            const scopeArr = nonRequiredScopeSet.asArray();
            expect(Array.isArray(scopeArr)).toBe(true);
            expect(scopeArr.length).toBe(nonRequiredScopeSet.getScopeCount());
            for (let i = 0; i < scopeArr.length; i++) {
                expect(nonRequiredScopeSet.containsScope(scopeArr[i])).toBe(true);
            }
        });

        it("printScopes() prints space-delimited string of scopes", () => {
            const scopeArr = nonRequiredScopeSet.asArray();
            expect(nonRequiredScopeSet.printScopes()).toBe(scopeArr.join(" "));
        });

        it("printScopes() prints empty string if ScopeSet is empty", () => {
            requiredScopeSet.removeScope(testScope);
            requiredScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);
            expect(requiredScopeSet.printScopes()).toBe("");
        });

        it("printScopesLowerCase() prints space-delimited string of scopes in lowercase", () => {
            const scopeArr = lowercaseScopeSet.asArray();
            expect(uppercaseScopeSet.printScopesLowerCase()).toBe(scopeArr.join(" "));
        });
    });
});
