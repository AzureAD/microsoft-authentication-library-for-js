import { PublicClientApplication } from './../../src/client/PublicClientApplication';
import { Configuration } from './../../src/index';
import { TEST_CONSTANTS } from '../utils/TestConstants';
import {
    ClientConfiguration, AuthenticationResult,
    AuthorizationCodeClient, RefreshTokenClient, UsernamePasswordClient, ProtocolMode, Logger, LogLevel
} from '@azure/msal-common';
import { DeviceCodeRequest } from '../../src/request/DeviceCodeRequest';
import { AuthorizationCodeRequest } from '../../src/request/AuthorizationCodeRequest';
import { RefreshTokenRequest } from '../../src/request/RefreshTokenRequest';
import { AuthorizationUrlRequest } from "../../src/request/AuthorizationUrlRequest";
import { UsernamePasswordRequest } from '../../src/request/UsernamePasswordRequest';
import { HttpClient } from '../../src/network/HttpClient';
import { mocked } from 'ts-jest/utils';


import * as msalCommon from '@azure/msal-common';
import { fakeAuthority, setupAuthorityFactory_createDiscoveredInstance_mock, setupServerTelemetryManagerMock } from './test-fixtures';
import { getMsalCommonAutoMock } from '../utils/MockUtils';

import { NodeStorage } from '../../src/cache/NodeStorage'
import { version, name } from '../../package.json'

describe('PublicClientApplication', () => {

    let appConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.AUTHORITY,
        },
    };

    const expectedConfig: ClientConfiguration = {
        authOptions: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: fakeAuthority,
            clientCapabilities: []
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();

        setupServerTelemetryManagerMock();
        setupAuthorityFactory_createDiscoveredInstance_mock();
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


        const MockDeviceCodeClient2 = getMsalCommonAutoMock().DeviceCodeClient;


        jest.spyOn(msalCommon, 'DeviceCodeClient')
            .mockImplementation((conf) => new MockDeviceCodeClient2(conf));

        const fakeAuthResult = { "foo": "bar" }
        mocked(MockDeviceCodeClient2.prototype.acquireToken)
            .mockImplementation(() => Promise.resolve(fakeAuthResult as unknown as AuthenticationResult))

        const authApp = new PublicClientApplication(appConfig);
        const result = await authApp.acquireTokenByDeviceCode(request);
        expect(MockDeviceCodeClient2).toHaveBeenCalledTimes(1);
        expect(MockDeviceCodeClient2).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
        expect(result).toEqual(fakeAuthResult);
    });

    test('acquireTokenByAuthorizationCode', async () => {


        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };



        const MockAuthorizationCodeClient = getMsalCommonAutoMock().AuthorizationCodeClient;

        jest.spyOn(msalCommon, 'AuthorizationCodeClient')
            .mockImplementation((config) => new MockAuthorizationCodeClient(config));

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

        const mockRefreshTokenClient = getMsalCommonAutoMock().RefreshTokenClient;
        jest.spyOn(msalCommon, 'RefreshTokenClient')
            .mockImplementation((config) => new mockRefreshTokenClient(config));


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


        const authApp = new PublicClientApplication(appConfig);
        await authApp.getAuthCodeUrl(request);
        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        expect(AuthorizationCodeClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });



    test('acquireTokenByUsernamePassword', async () => {
        const request: UsernamePasswordRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            username: TEST_CONSTANTS.USERNAME,
            password: TEST_CONSTANTS.PASSWORD
        };

        const mockUsernamePasswordClient = getMsalCommonAutoMock().UsernamePasswordClient;
        jest.spyOn(msalCommon, 'UsernamePasswordClient')
            .mockImplementation((config) => new mockUsernamePasswordClient(config));

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByUsernamePassword(request);
        expect(UsernamePasswordClient).toHaveBeenCalledTimes(1);
        expect(UsernamePasswordClient).toHaveBeenCalledWith(
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


        const authorityMock = setupAuthorityFactory_createDiscoveredInstance_mock(fakeAuthority);

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


        const authorityMock = setupAuthorityFactory_createDiscoveredInstance_mock()

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
