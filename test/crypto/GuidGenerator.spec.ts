import { RANDOM_TEST_GUID } from "../utils/StringConstants";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";

describe("GuidGenerator Unit Tests", () => {

    let browserCrypto: BrowserCrypto;
    beforeEach(() => {
        browserCrypto = new BrowserCrypto();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("test if a string is GUID", () => {

        it("Regular text", () => {
            expect(GuidGenerator.isGuid("Hello")).toBe(false);
        });

        it("GUID", () => {
            expect(GuidGenerator.isGuid(RANDOM_TEST_GUID)).toBe(true);
        });
    });

    describe("createNewGuid() works correctly", () => {

        it("Creates a new valid guid with browser crypto", () => {
            const guidGen = new GuidGenerator(browserCrypto);
            expect(GuidGenerator.isGuid(guidGen.generateGuid())).toBe(true);
        });

        it("Creates a new valid guid when browser crypto throws error", () => {
            jest.spyOn(BrowserCrypto.prototype, "getRandomValues").mockImplementation(() => {
                throw "No crypto object available.";
            });
            const guidGen = new GuidGenerator(browserCrypto);
            expect(GuidGenerator.isGuid(guidGen.generateGuid())).toBe(true);
        });
    });
});
