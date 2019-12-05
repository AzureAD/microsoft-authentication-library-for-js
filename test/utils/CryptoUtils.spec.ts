import { expect } from "chai";
import { CryptoUtils } from "../../src/utils/CryptoUtils";

describe("CryptoUtils.ts Class Unit Tests", () => {

    it("decimalToHex Unit Tests", () => {
        expect(CryptoUtils.decimalToHex(0)).to.be.eq("00");
        expect(CryptoUtils.decimalToHex(252)).to.be.eq("fc");
        expect(CryptoUtils.decimalToHex(512)).to.be.eq("200");
        expect(CryptoUtils.decimalToHex(1024)).to.be.eq("400");
        expect(CryptoUtils.decimalToHex(2048)).to.be.eq("800");
        expect(CryptoUtils.decimalToHex(4141)).to.be.eq("102d");
        expect(CryptoUtils.decimalToHex(8400)).to.be.eq("20d0");
        expect(CryptoUtils.decimalToHex(17000)).to.be.eq("4268");
    });

    it("deserialize Unit Tests", () => {
        const serializedObj = "param1=value1&param2=value2&param3=value3";
        const deserializedObj = {
            "param1": "value1",
            "param2": "value2",
            "param3": "value3",
        };
        expect(CryptoUtils.deserialize(serializedObj)).to.be.deep.eq(deserializedObj);        
    });
});
