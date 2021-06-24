import { PublicClientApplication } from './../../src/client/PublicClientApplication';
import { AuthorizationCodeRequest, Configuration } from './../../src/index';
import { TEST_CONSTANTS } from '../utils/TestConstants';
import { version, name } from '../../package.json';
import { mocked } from 'ts-jest/utils';
import {
    Authority,
    AuthorityFactory,
    AuthorizationCodeClient,
    DeviceCodeClient,
    RefreshTokenClient,
    ClientConfiguration,
    ProtocolMode,
    Logger,
    LogLevel
} from '@azure/msal-common';

import { AuthorizationUrlRequest } from "../../src/request/AuthorizationUrlRequest";
import { DeviceCodeRequest } from "../../src/request/DeviceCodeRequest";
import { RefreshTokenRequest } from "../../src/request/RefreshTokenRequest";
import { NodeStorage } from "../../src/cache/NodeStorage";
import { HttpClient } from "../../src/network/HttpClient";

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
            clientCapabilities: []
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

        mocked(AuthorityFactory.createDiscoveredInstance).mockReturnValue(Promise.resolve(authority));

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

        mocked(AuthorityFactory.createDiscoveredInstance).mockReturnValue(Promise.resolve(authority));

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

        mocked(AuthorityFactory.createDiscoveredInstance).mockReturnValue(Promise.resolve(authority));

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

        mocked(AuthorityFactory.createDiscoveredInstance).mockReturnValue(Promise.resolve(authority));

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

        const authorityMock = mocked(AuthorityFactory.createDiscoveredInstance);
        authorityMock.mockResolvedValue(authority);

        const authApp = new PublicClientApplication(config);
        await authApp.acquireTokenByRefreshToken(request);
        expect(authorityMock.mock.calls[0][0]).toBe(TEST_CONSTANTS.DEFAULT_AUTHORITY);
        expect(authorityMock.mock.calls[0][1]).toBeInstanceOf(HttpClient);
        expect(authorityMock.mock.calls[0][2]).toBeInstanceOf(NodeStorage);
        expect(authorityMock.mock.calls[0][3]).toStrictEqual({
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [],
            azureRegionConfiguration: undefined,
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        });
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(expect.objectContaining(expectedConfig));
    });

    test('authority overridden by acquire token request parameters', async () => {
        // Authority set on client app, but should be overridden by authority passed in request
        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
            authority: TEST_CONSTANTS.ALTERNATE_AUTHORITY,
        };

        const authorityMock = mocked(AuthorityFactory.createDiscoveredInstance);
        authorityMock.mockResolvedValue(authority);

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(authorityMock.mock.calls[0][0]).toBe(TEST_CONSTANTS.ALTERNATE_AUTHORITY);
        expect(authorityMock.mock.calls[0][1]).toBeInstanceOf(HttpClient);
        expect(authorityMock.mock.calls[0][2]).toBeInstanceOf(NodeStorage);
        expect(authorityMock.mock.calls[0][3]).toStrictEqual({
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [],
            azureRegionConfiguration: undefined,
            cloudDiscoveryMetadata: "",
            authorityMetadata: ""
        });
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(expect.objectContaining(expectedConfig));
    });

    test("getLogger and setLogger", async () => {
        const authApp = new PublicClientApplication(appConfig);
        const logger = new Logger({
            loggerCallback: (level, message, containsPii) => {
                expect(message).toContain("Message");
                expect(message).toContain(LogLevel.Info);

                expect(level).toEqual(LogLevel.Info);
                expect(containsPii).toEqual(false);
            },
            piiLoggingEnabled: false
        }, name, version);

        authApp.setLogger(logger);

        expect(authApp.getLogger()).toEqual(logger);

        authApp.getLogger().info("Message");
    });
});
