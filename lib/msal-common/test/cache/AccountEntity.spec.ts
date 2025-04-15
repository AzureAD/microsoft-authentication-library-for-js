import * as AccountEntityUtils from "../../src/cache/utils/AccountEntityUtils.js";
import { mockAccountEntity, mockAccessTokenEntity_1 } from "./entities/cacheConstants.js";

describe("AccountEntity unit tests", () => {
    it("verify if an object is an AccountEntity", () => {
        expect(
            AccountEntityUtils.isAccountEntity(mockAccountEntity)
        ).toEqual(true);
    });

    it("verify if an object is not an AccountEntity", () => {
        expect(
            AccountEntityUtils.isAccountEntity(mockAccessTokenEntity_1)
        ).toEqual(false);
    });
});