import { PublicClientApplication } from './../../src/client/PublicClientApplication';
import { AuthorizationCodeRequest, Configuration } from './../../src/index';
import { TEST_CONSTANTS } from "../utils/TestConstants";
import {
    AuthorizationCodeClient,
    AuthorizationCodeUrlRequest,
    DeviceCodeClient,
    RefreshTokenClient,
    DeviceCodeRequest,
    RefreshTokenRequest,
    // ClientConfiguration,
    // ClientConfigurationError,
}
from "@azure/msal-common";

jest.mock("@azure/msal-common");

describe('PublicClientApplication', () => {

    let appConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.AUTHORITY,
        },

    };

    // const expectedOauthClientConfig: ClientConfiguration = {
    //     authOptions: appConfig.auth,
    // };

    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        jest.clearAllMocks();
    });

    test('exports a class', () => {

        const authApp = new PublicClientApplication(appConfig);
        expect(authApp).toBeInstanceOf(PublicClientApplication);
    });

    test('acquireTokenByDeviceCode', async () => {

        const request: DeviceCodeRequest = {
            deviceCodeCallback: response => {
                console.log(response);
            },
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
        };

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByDeviceCode(request);
        expect(DeviceCodeClient).toHaveBeenCalledTimes(1);
        // expect(DeviceCodeClient).toHaveBeenCalledWith(expect.objectContaining(expectedOauthClientConfig));
    });

    test('acquireTokenByAuthorizationCode', async () => {

        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request);
        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        // expect(AuthorizationCodeClient).toHaveBeenCalledWith(expect.objectContaining(expectedOauthClientConfig));

    });

    test('acquireTokenByRefreshToken', async () => {

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN
        };

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        // expect(RefreshTokenClient).toHaveBeenCalledWith(expect.objectContaining(expectedOauthClientConfig));
    });

    test('create AuthorizationCode URL', async () => {

        const request: AuthorizationCodeUrlRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
        };

        const authApp = new PublicClientApplication(appConfig);
        await authApp.getAuthCodeUrl(request);
        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        // expect(AuthorizationCodeClient).toHaveBeenCalledWith(expect.objectContaining(expectedOauthClientConfig));
    });
});
