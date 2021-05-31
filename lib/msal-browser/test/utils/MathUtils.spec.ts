import { MathUtils } from "../../src/utils/MathUtils";

describe("MathUtils.ts Class Unit Tests", () => {

    it("decimalToHex Unit Tests", () => {
        expect(MathUtils.decimalToHex(0)).toBe("00");
        expect(MathUtils.decimalToHex(252)).toBe("fc");
        expect(MathUtils.decimalToHex(512)).toBe("200");
        expect(MathUtils.decimalToHex(1024)).toBe("400");
        expect(MathUtils.decimalToHex(2048)).toBe("800");
        expect(MathUtils.decimalToHex(4141)).toBe("102d");
        expect(MathUtils.decimalToHex(8400)).toBe("20d0");
        expect(MathUtils.decimalToHex(17000)).toBe("4268");
    });
});
