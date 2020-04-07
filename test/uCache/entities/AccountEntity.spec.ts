import { expect } from "chai";
import { AccountEntity } from "../../../src/uCache/entities/AccountEntity";
import { mockAccountEntity } from "./cacheConstants";

describe("AccountEntity.ts Unit Tests", () => {
    it("Verify an AccountEntity", () => {
        const ac = new AccountEntity();
        expect(ac instanceof AccountEntity);
    });

    it("Create an AccountEntity", () => {
        let ac = new AccountEntity();
        Object.assign(ac, mockAccountEntity);
        expect(ac.generateAccountEntityKey()).to.eql(
            "uid.utid-login.microsoftonline.com-microsoft"
        );
    });
});
