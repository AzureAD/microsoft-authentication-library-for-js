import { expect } from "chai";
import { Utils } from "../src/Utils";

describe("Utils.ts", () => {
    it("get getLibraryVersion()", () => {
        const version: string = Utils.getLibraryVersion();

        expect(version).to.be.string;
        expect(version.split(".").length).to.be.greaterThan(2);
    });
});
