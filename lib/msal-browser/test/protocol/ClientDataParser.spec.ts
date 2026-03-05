import { parseClientData } from "../../src/protocol/Authorize.js";

describe("parseAuxClientData", () => {
    describe("parseAuxClientData", () => {
        it("returns null for undefined input", () => {
            expect(parseClientData(undefined)).toBeNull();
        });

        it("returns null for empty string", () => {
            expect(parseClientData("")).toBeNull();
        });

        it("returns null when fewer than 5 pipe-delimited parts", () => {
            // Only 3 parts
            expect(parseClientData("m%7C0x8004345C%7C0x80043588")).toBeNull();
        });

        it("returns null when only 4 pipe-delimited parts", () => {
            expect(
                parseClientData("m%7C0x8004345C%7C0x80043588%7Cnone")
            ).toBeNull();
        });

        it("parses a valid URL-encoded MSA clientdata payload", () => {
            const encoded =
                "m%7C0x8004345C%7C0x80047857%7Cnone%7Clogin.microsoftonline.com";
            const result = parseClientData(encoded);

            expect(result).not.toBeNull();
            expect(result!.accountType).toBe("MSA");
            expect(result!.error).toBe("0x8004345C");
            expect(result!.subError).toBe("0x80047857");
            expect(result!.cloudInstance).toBe("none");
            expect(result!.callerDataBoundary).toBe(
                "login.microsoftonline.com"
            );
        });

        it("parses a valid URL-encoded Entra (AAD) clientdata payload", () => {
            const encoded =
                "e%7CAADSTS50076%7Cbasic_action%7Clogin.microsoftonline.com%7Cnone";
            const result = parseClientData(encoded);

            expect(result).not.toBeNull();
            expect(result!.accountType).toBe("AAD");
            expect(result!.error).toBe("AADSTS50076");
            expect(result!.subError).toBe("basic_action");
            expect(result!.cloudInstance).toBe("login.microsoftonline.com");
            expect(result!.callerDataBoundary).toBe("none");
        });

        it("parses a payload with no errors (empty error and suberror)", () => {
            const encoded = "m%7C%7C%7Clogin.microsoftonline.com%7Cnone";
            const result = parseClientData(encoded);

            expect(result).not.toBeNull();
            expect(result!.accountType).toBe("MSA");
            expect(result!.error).toBe("");
            expect(result!.subError).toBe("");
            expect(result!.cloudInstance).toBe("login.microsoftonline.com");
            expect(result!.callerDataBoundary).toBe("none");
        });

        it("parses a non-encoded (plain) pipe-delimited string", () => {
            const plain =
                "m|0x8004345C|0x80047857|none|login.microsoftonline.com";
            const result = parseClientData(plain);

            expect(result).not.toBeNull();
            expect(result!.accountType).toBe("MSA");
            expect(result!.error).toBe("0x8004345C");
            expect(result!.subError).toBe("0x80047857");
        });

        it("handles whitespace in pipe-delimited fields by trimming", () => {
            const encoded =
                "m%7C%200x8004345C%20%7C%200x80047857%20%7C%20none%20%7C%20login.microsoftonline.com%20";
            const result = parseClientData(encoded);

            expect(result).not.toBeNull();
            expect(result!.accountType).toBe("MSA");
            expect(result!.error).toBe("0x8004345C");
            expect(result!.subError).toBe("0x80047857");
            expect(result!.cloudInstance).toBe("none");
            expect(result!.callerDataBoundary).toBe(
                "login.microsoftonline.com"
            );
        });

        it("returns empty accountType for unknown account type code", () => {
            const encoded =
                "x%7C0x8004345C%7C0x80047857%7Cnone%7Clogin.microsoftonline.com";
            const result = parseClientData(encoded);

            expect(result).not.toBeNull();
            expect(result!.accountType).toBe("");
        });

        it("returns null for invalid URL encoding", () => {
            const invalid = "%ZZ%7Cfoo%7Cbar%7Cbaz%7Cqux";
            expect(parseClientData(invalid)).toBeNull();
        });

        it("handles more than 5 pipe-delimited parts (ignores extras)", () => {
            const encoded =
                "m%7C0x8004345C%7C0x80047857%7Cnone%7Clogin.microsoftonline.com%7Cextra_field";
            const result = parseClientData(encoded);

            expect(result).not.toBeNull();
            expect(result!.accountType).toBe("MSA");
            expect(result!.error).toBe("0x8004345C");
            expect(result!.subError).toBe("0x80047857");
            expect(result!.cloudInstance).toBe("none");
            expect(result!.callerDataBoundary).toBe(
                "login.microsoftonline.com"
            );
        });

        it("handles trailing whitespace from URL encoding (e.g., %20 at end)", () => {
            const encoded =
                "m%7C0x8004345C%7C0x80047857%7Cnone%7Clogin.microsoftonline.com%20";
            const result = parseClientData(encoded);

            expect(result).not.toBeNull();
            expect(result!.callerDataBoundary).toBe(
                "login.microsoftonline.com"
            );
        });
    });
});
