import * as TimeUtils from "../../src/utils/TimeUtils.js";

describe("TimeUtils.ts Class Unit Tests", () => {
    it("nowSeconds() gets the current Unix time in seconds", () => {
        const currSeconds = TimeUtils.nowSeconds();
        expect(typeof currSeconds).toBe("number");
        expect(currSeconds).toBeLessThanOrEqual(TimeUtils.nowSeconds());
    });

    it("toSecondsFromDate() converts a date to seconds", () => {
        const date = new Date();
        const seconds = TimeUtils.toSecondsFromDate(date);
        expect(typeof seconds).toBe("number");
        expect(seconds).toEqual(date.getTime() / 1000);
    });

    it("toDateFromSeconds() converts seconds to a date when seconds in number format", () => {
        const seconds = 1234567890;
        const dateFromSeconds = TimeUtils.toDateFromSeconds(seconds);
        expect(dateFromSeconds).toBeInstanceOf(Date);
        expect(dateFromSeconds).toEqual(new Date(seconds * 1000));
    });

    it("toDateFromSeconds() converts seconds to a date when seconds in string format", () => {
        const seconds = "1234567890";
        const dateFromSeconds = TimeUtils.toDateFromSeconds(seconds);
        expect(dateFromSeconds).toBeInstanceOf(Date);
        expect(dateFromSeconds).toEqual(new Date(Number(seconds) * 1000));
    });

    it("toDateFromSeconds() returns current Date when seconds is undefined", () => {
        const seconds = undefined;
        const dateFromSeconds = TimeUtils.toDateFromSeconds(seconds);
        expect(dateFromSeconds).toBeInstanceOf(Date);
        expect(dateFromSeconds).toEqual(new Date());
    });

    it("isTokenExpired() returns whether or not a token is expired", () => {
        expect(
            TimeUtils.isTokenExpired(TimeUtils.nowSeconds().toString(), 60000)
        ).toBe(true);
        expect(
            TimeUtils.isTokenExpired(
                (TimeUtils.nowSeconds() + 60000).toString(),
                0
            )
        ).toBe(false);
    });

    it("wasClockTurnedBack() returns whether or not the clock was turned back", () => {
        expect(
            TimeUtils.wasClockTurnedBack(
                (TimeUtils.nowSeconds() + 6000).toString()
            )
        ).toBe(true);
        expect(
            TimeUtils.wasClockTurnedBack(
                (TimeUtils.nowSeconds() - 60000).toString()
            )
        ).toBe(false);
    });
});
