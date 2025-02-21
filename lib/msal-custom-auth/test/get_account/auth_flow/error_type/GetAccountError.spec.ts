import { GetCurrentAccountError, NoSignedInAccountFound } from "../../../../src/core/error/GetCurrentAccountError.js";
import { GetAccountError } from "../../../../src/get_account/auth_flow/error_type/GetAccountError.js";

describe("GetAccountError", () => {
    it("should return true for isCurrentAccountNotFound when error is NoSignedInAccountFound", () => {
        const error = new GetAccountError(
            new GetCurrentAccountError(NoSignedInAccountFound, "No signed in account found"),
        );
        expect(error.isCurrentAccountNotFound()).toBe(true);
    });

    it("should return false for isCurrentAccountNotFound when error is not NoSignedInAccountFound", () => {
        const error = new GetAccountError(new GetCurrentAccountError("unknown_error", "No signed in account found"));
        expect(error.isCurrentAccountNotFound()).toBe(false);
    });
});
