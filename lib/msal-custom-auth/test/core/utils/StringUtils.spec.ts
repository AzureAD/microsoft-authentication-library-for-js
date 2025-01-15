import { StringUtils } from "../../../src/core/utils/StringUtils.js";

describe("StringUtils", () => {
    describe("trim", () => {
        it("should trim whitespace from both ends of the string when no characters are specified", () => {
            const input = "  Hello World  ";
            const result = StringUtils.trim(input);
            expect(result).toBe("Hello World");
        });

        it("should return the same string if there are no leading or trailing whitespaces", () => {
            const input = "Hello World";
            const result = StringUtils.trim(input);
            expect(result).toBe("Hello World");
        });

        it("should return an empty string if the input is empty", () => {
            const input = "";
            const result = StringUtils.trim(input);
            expect(result).toBe("");
        });

        it("should trim specified characters from both ends of the string", () => {
            const input = "***Hello World***";
            const charsToTrim = "*";
            const result = StringUtils.trim(input, charsToTrim);
            expect(result).toBe("Hello World");
        });

        it("should trim multiple specified characters from both ends of the string", () => {
            const input = "***Hello World###";
            const charsToTrim = "*#";
            const result = StringUtils.trim(input, charsToTrim);
            expect(result).toBe("Hello World");
        });

        it("should not trim characters from the middle of the string", () => {
            const input = "***Hello*World***";
            const charsToTrim = "*";
            const result = StringUtils.trim(input, charsToTrim);
            expect(result).toBe("Hello*World");
        });

        it("should return the same string if no characters match for trimming", () => {
            const input = "Hello World";
            const charsToTrim = "$";
            const result = StringUtils.trim(input, charsToTrim);
            expect(result).toBe("Hello World");
        });

        it("should handle trimming with special characters correctly", () => {
            const input = "---$Hello$World$---";
            const charsToTrim = "-$";
            const result = StringUtils.trim(input, charsToTrim);
            expect(result).toBe("Hello$World");
        });
    });
});
