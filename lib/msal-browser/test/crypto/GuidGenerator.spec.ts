import { expect } from "chai";
import sinon from "sinon";
import { RANDOM_TEST_GUID } from "../utils/StringConstants";
import { BrowserCrypto } from "../../src/crypto/BrowserCrypto";
import { GuidGenerator } from "../../src/crypto/GuidGenerator";

describe("GuidGenerator Unit Tests", () => {

    let browserCrypto: BrowserCrypto;
    beforeEach(() => {
        browserCrypto = new BrowserCrypto();
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("test if a string is GUID", () => {

        it("Regular text", () => {
            expect(GuidGenerator.isGuid("Hello")).to.be.eq(false);
        });

        it("GUID", () => {
            expect(GuidGenerator.isGuid(RANDOM_TEST_GUID)).to.be.eq(true);
        });
    });

    describe("createNewGuid() works correctly", () => {

        it("Creates a new valid guid with browser crypto", () => {
            const guidGen = new GuidGenerator(browserCrypto);
            expect(GuidGenerator.isGuid(guidGen.generateGuid())).to.be.eq(true);
        });

        it("Creates a new valid guid when browser crypto throws error", () => {
            sinon.stub(BrowserCrypto.prototype, "getRandomValues").throws("No crypto object available.");
            const guidGen = new GuidGenerator(browserCrypto);
            expect(GuidGenerator.isGuid(guidGen.generateGuid())).to.be.eq(true);
        });
    });
});
