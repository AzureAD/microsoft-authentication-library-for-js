import { StringUtils } from "../../../../src/custom_auth/core/utils/StringUtils.js";

describe("StringUtils", () => {
    describe("trim", () => {
        it("should trim whitespace from both ends of the string", () => {
            const input = "//Hello World//";
            const result = StringUtils.trimSlashes(input);
            expect(result).toBe("Hello World");
        });

        it("should trim whitespace from start of the string", () => {
            const input = "//Hello World";
            const result = StringUtils.trimSlashes(input);
            expect(result).toBe("Hello World");
        });

        it("should trim whitespace from end of the string", () => {
            const input = "Hello World//";
            const result = StringUtils.trimSlashes(input);
            expect(result).toBe("Hello World");
        });

        it("should return the same string if there are no leading or trailing whitespaces", () => {
            const input = "Hello World";
            const result = StringUtils.trimSlashes(input);
            expect(result).toBe("Hello World");
        });

        it("should return an empty string if the input is empty", () => {
            const input = "";
            const result = StringUtils.trimSlashes(input);
            expect(result).toBe("");
        });
    });
});
