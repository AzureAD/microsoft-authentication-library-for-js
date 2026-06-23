import {
    AuthenticationScheme,
    DPOP_TOKEN_TYPE,
    mapTokenTypeToAuthenticationScheme,
} from "../../src/utils/Constants.js";

describe("Constants", () => {
    it("exposes DPoP authentication scheme selector", () => {
        expect(AuthenticationScheme.DPOP).toBe("dpop");
    });

    it("maps RFC DPoP token type to DPoP authentication scheme", () => {
        expect(mapTokenTypeToAuthenticationScheme(DPOP_TOKEN_TYPE)).toBe(
            AuthenticationScheme.DPOP
        );
    });

    it("falls back to request authentication scheme when token type is missing", () => {
        expect(
            mapTokenTypeToAuthenticationScheme(
                undefined,
                AuthenticationScheme.SSH
            )
        ).toBe(AuthenticationScheme.SSH);
    });
});
