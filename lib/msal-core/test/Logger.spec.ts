import { Logger } from "../src";
import { expect } from "chai";

describe("Logger.ts", () => {

    it("exposes pii logging boolean", () => {
        const logger: Logger = new Logger(() => {}, {
            piiLoggingEnabled: true
        });
        expect(logger.piiLoggingIsEnabled()).to.be.true;
    });

    it("pii logging boolean defaults false", () => {
        const logger: Logger = new Logger(() => {});
        expect(logger.piiLoggingIsEnabled()).to.be.false;
    });

});
