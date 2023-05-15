import { Logger } from "../src";

describe("Logger.ts", () => {

    it("exposes pii logging boolean", () => {
        const logger: Logger = new Logger(() => {}, {
            piiLoggingEnabled: true
        });
        expect(logger.isPiiLoggingEnabled()).toBe(true);
    });

    it("pii logging boolean defaults false", () => {
        const logger: Logger = new Logger(() => {});
        expect(logger.isPiiLoggingEnabled()).toBe(false);
    });

});
