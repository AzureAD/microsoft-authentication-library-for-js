import { TimeUtils } from "../../src/utils/TimeUtils";

describe("TimeUtils.ts Class Unit Tests", () => {

    it("nowSeconds() gets the current Unix time in seconds", () => {
        const currSeconds = TimeUtils.nowSeconds();
        expect(typeof currSeconds).toBe("number");
        expect(currSeconds).toBeLessThanOrEqual(TimeUtils.nowSeconds());
    });

    it("isTokenExpired() returns whether or not a token is expired", () => {
        expect(TimeUtils.isTokenExpired(TimeUtils.nowSeconds().toString(), 60000)).toBe(true);
        expect(TimeUtils.isTokenExpired((TimeUtils.nowSeconds() + 60000).toString(), 0)).toBe(false);
    });

    it("wasClockTurnedBack() returns whether or not the clock was turned back", () => {
        expect(TimeUtils.wasClockTurnedBack((TimeUtils.nowSeconds() + 6000).toString())).toBe(true);
        expect(TimeUtils.wasClockTurnedBack((TimeUtils.nowSeconds() - 60000).toString())).toBe(false);
    });
});
