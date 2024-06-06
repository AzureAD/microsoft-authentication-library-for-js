import * as msalCommon from "@azure/msal-common";
export type MSALCommonModule = typeof msalCommon;

export const getMsalCommonAutoMock = (): MSALCommonModule =>
    jest.genMockFromModule("@azure/msal-common");
