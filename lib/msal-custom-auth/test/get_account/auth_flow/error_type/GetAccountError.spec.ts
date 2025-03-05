import { NoCachedAccountFoundError } from "../../../../src/core/error/NoCachedAccountFoundError.js";
import { GetAccountError, SignOutError } from "../../../../src/get_account/auth_flow/error_type/GetAccountError.js";
import { UnexpectedError } from "../../../../src/index.js";

describe("GetAccountError", () => {
    it("should return true for isCurrentAccountNotFound when error is NoSignedInAccountFound", () => {
        const error = new GetAccountError(new NoCachedAccountFoundError());
        expect(error.isCurrentAccountNotFound()).toBe(true);
    });

    it("should return false for isCurrentAccountNotFound when error is not NoSignedInAccountFound", () => {
        const error = new GetAccountError(new UnexpectedError("unknown_error", "Unknown error"));
        expect(error.isCurrentAccountNotFound()).toBe(false);
    });
});

describe("SignOutError", () => {
    it("should return true for isUserNotSignedIn when error is NoCachedAccountFoundError", () => {
        const error = new SignOutError(new NoCachedAccountFoundError());
        expect(error.isUserNotSignedIn()).toBe(true);
    });

    it("should return false for isUserNotSignedIn when error is not NoCachedAccountFoundError", () => {
        const error = new SignOutError(new UnexpectedError("unknown_error", "Unknown error"));
        expect(error.isUserNotSignedIn()).toBe(false);
    });
});
