import { expect } from "chai";
import { MathUtils } from "../../src/utils/MathUtils";

describe("MathUtils.ts Class Unit Tests", () => {

    it("decimalToHex Unit Tests", () => {
        expect(MathUtils.decimalToHex(0)).to.be.eq("00");
        expect(MathUtils.decimalToHex(252)).to.be.eq("fc");
        expect(MathUtils.decimalToHex(512)).to.be.eq("200");
        expect(MathUtils.decimalToHex(1024)).to.be.eq("400");
        expect(MathUtils.decimalToHex(2048)).to.be.eq("800");
        expect(MathUtils.decimalToHex(4141)).to.be.eq("102d");
        expect(MathUtils.decimalToHex(8400)).to.be.eq("20d0");
        expect(MathUtils.decimalToHex(17000)).to.be.eq("4268");
    });
});
