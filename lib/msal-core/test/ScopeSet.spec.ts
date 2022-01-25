import sinon from "sinon";
import { ScopeSet } from "../src/ScopeSet";

describe("ScopeSet.ts Unit Tests", () => {

    it("tests trimAndConvertArrayToLowerCase", () => {
        const scopeSet = ["S1", " S2", " S3 "];
        expect(ScopeSet.trimAndConvertArrayToLowerCase(scopeSet)).toEqual(["s1", "s2", "s3"]);         
    });

    it("tests trimAndConvertToLowerCase", () => {
        const scope = " S1 ";
        expect(ScopeSet.trimAndConvertToLowerCase(scope)).toBe("s1");
    });

    it("tests trimScopes", () => {
        const scopeSet = ["S1", " S2  ", " S3 "];
        expect(ScopeSet.trimScopes(scopeSet)).toEqual(["S1", "S2", "S3"]);         
    });
});
