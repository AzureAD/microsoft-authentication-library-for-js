import * as msalCommon from "../../src/msal-common";
export type MSALCommonModule = typeof msalCommon;

export const getMsalCommonAutoMock = (): MSALCommonModule =>
    jest.genMockFromModule("../../src/msal-common");
