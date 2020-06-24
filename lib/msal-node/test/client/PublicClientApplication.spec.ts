import { PublicClientApplication } from './../../src/client/PublicClientApplication';
import { AuthorizationCodeRequest, Configuration } from './../../src/index';
import { TEST_CONSTANTS } from '../utils/TestConstants';
import { mocked } from 'ts-jest/utils';
import {
    Authority,
    AuthorityFactory,
    AuthorizationCodeClient,
    AuthorizationUrlRequest,
    Constants,
    DeviceCodeClient,
    DeviceCodeRequest,
    RefreshTokenClient,
    RefreshTokenRequest,
    ClientConfiguration,
} from '@azure/msal-common';

jest.mock('@azure/msal-common');

describe('PublicClientApplication', () => {
    const authority: Authority = {
        resolveEndpointsAsync: () => {
            return new Promise<void>(resolve => {
                resolve();
            });
        },
        discoveryComplete: () => {
            return true;
        },
    } as Authority;

    let appConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.AUTHORITY,
        },
    };

    const expectedConfig: ClientConfiguration = {
        authOptions: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: authority,
            knownAuthorities: [],
            cloudDiscoveryMetadata: ""
        },
    };

    // const expectedOauthClientConfig: ClientConfiguration = {
    //     authOptions: appConfig.auth,
    // };

    beforeEach(() => {
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

        mocked(AuthorityFactory.createInstance).mockReturnValueOnce(authority);

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByDeviceCode(request);
        expect(DeviceCodeClient).toHaveBeenCalledTimes(1);
        expect(DeviceCodeClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test('acquireTokenByAuthorizationCode', async () => {
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };

        mocked(AuthorityFactory.createInstance).mockReturnValueOnce(authority);

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request);
        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        expect(AuthorizationCodeClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test('acquireTokenByRefreshToken', async () => {
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        mocked(AuthorityFactory.createInstance).mockReturnValueOnce(authority);

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test('create AuthorizationCode URL', async () => {
        const request: AuthorizationUrlRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
        };

        mocked(AuthorityFactory.createInstance).mockReturnValueOnce(authority);

        const authApp = new PublicClientApplication(appConfig);
        await authApp.getAuthCodeUrl(request);
        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        expect(AuthorizationCodeClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test('acquireToken default authority', async () => {
        // No authority set in app configuration or request, should default to common authority
        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
            },
        };

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        mocked(AuthorityFactory.createInstance).mockReturnValueOnce(authority);

        const authApp = new PublicClientApplication(config);
        await authApp.acquireTokenByRefreshToken(request);
        expect(AuthorityFactory.createInstance).toHaveBeenCalledWith(
            Constants.DEFAULT_AUTHORITY,
            {}
        );
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test('authority overridden by acquire token request parameters', async () => {
        // Authority set on client app, but should be overridden by authority passed in request
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
            authority: TEST_CONSTANTS.ALTERNATE_AUTHORITY,
        };

        mocked(AuthorityFactory.createInstance).mockReturnValueOnce(authority);

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(AuthorityFactory.createInstance).toHaveBeenCalledWith(
            TEST_CONSTANTS.ALTERNATE_AUTHORITY,
            {}
        );
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });
});
