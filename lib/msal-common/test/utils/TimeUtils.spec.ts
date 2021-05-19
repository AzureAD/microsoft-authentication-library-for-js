import { TimeUtils } from "../../src/utils/TimeUtils";

describe("TimeUtils.ts Class Unit Tests", () => {

    it("nowSeconds() gets the current Unix time in seconds", () => {
        const currSeconds = TimeUtils.nowSeconds();
        expect(typeof currSeconds).toBe("number");
        expect(currSeconds).toBeLessThanOrEqual(TimeUtils.nowSeconds());
    });
});
