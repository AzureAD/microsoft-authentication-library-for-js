import { expect } from "chai";
import { TimeUtils } from "../../src/utils/TimeUtils";

describe("TimeUtils.ts Class Unit Tests", () => {

    it("nowSeconds() gets the current Unix time in seconds", () => {
        const currSeconds = TimeUtils.nowSeconds();
        expect(typeof currSeconds).to.be.eq("number");
        expect(currSeconds).to.be.at.most(TimeUtils.nowSeconds());
    });
});
