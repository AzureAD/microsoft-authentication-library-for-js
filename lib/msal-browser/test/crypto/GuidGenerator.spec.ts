import { RANDOM_TEST_GUID } from "../utils/StringConstants";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";
import { Logger } from "@azure/msal-common";

describe("GuidGenerator Unit Tests", () => {

    let browserCrypto: BrowserCrypto;
    beforeEach(() => {
        browserCrypto = new BrowserCrypto(new Logger({}));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("test if a string is GUID", () => {

        it("Regular text", () => {
            expect(new GuidGenerator(browserCrypto).isGuid("Hello")).toBe(false);
        });

        it("GUID", () => {
            expect(new GuidGenerator(browserCrypto).isGuid(RANDOM_TEST_GUID)).toBe(true);
        });
    });

    describe("createNewGuid() works correctly", () => {

        it("Creates a new valid guid with browser crypto", () => {
            const guidGen = new GuidGenerator(browserCrypto);
            expect(guidGen.isGuid(guidGen.generateGuid())).toBe(true);
        });

        it("Creates a new valid guid when browser crypto throws error", () => {
            jest.spyOn(BrowserCrypto.prototype, "getRandomValues").mockImplementation(() => {
                throw "No crypto object available.";
            });
            const guidGen = new GuidGenerator(browserCrypto);
            expect(guidGen.isGuid(guidGen.generateGuid())).toBe(true);
        });
    });
});
