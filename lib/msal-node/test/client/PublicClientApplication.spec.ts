import { PublicClientApplication } from './../../src/client/PublicClientApplication';
import { Configuration, InteractiveRequest } from './../../src/index';
import { ID_TOKEN_CLAIMS, mockAuthenticationResult, TEST_CONSTANTS } from '../utils/TestConstants';
import {
    ClientConfiguration, AuthenticationResult,
    AuthorizationCodeClient, RefreshTokenClient, UsernamePasswordClient, SilentFlowClient, ProtocolMode, Logger, LogLevel, ClientAuthError
} from '@azure/msal-common';
import { CryptoProvider } from '../../src/crypto/CryptoProvider';
import { DeviceCodeRequest } from '../../src/request/DeviceCodeRequest';
import { AuthorizationCodeRequest } from '../../src/request/AuthorizationCodeRequest';
import { RefreshTokenRequest } from '../../src/request/RefreshTokenRequest';
import { AuthorizationUrlRequest } from "../../src/request/AuthorizationUrlRequest";
import { UsernamePasswordRequest } from '../../src/request/UsernamePasswordRequest';
import { SilentFlowRequest } from '../../src/request/SilentFlowRequest';
import { HttpClient } from '../../src/network/HttpClient';
import { mocked } from 'ts-jest/utils';
import { AccountInfo } from '@azure/msal-common';
import http from "http";


import * as msalCommon from '@azure/msal-common';
import { fakeAuthority, setupAuthorityFactory_createDiscoveredInstance_mock, setupServerTelemetryManagerMock } from './test-fixtures';
import { getMsalCommonAutoMock } from '../utils/MockUtils';

import { NodeStorage } from '../../src/cache/NodeStorage'
import { version, name } from '../../package.json'

describe('PublicClientApplication', () => {

    const mockTelemetryManager: msalCommon.ServerTelemetryManager = setupServerTelemetryManagerMock();

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

        mockTelemetryManager
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


    test("acquireTokenByAuthorizationCode with nonce", async () => {
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE
        };

        const cryptoProvider = new CryptoProvider();
        const authCodePayLoad = {
            nonce: cryptoProvider.createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE
        }

        const MockAuthorizationCodeClient = getMsalCommonAutoMock()
            .AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            config => new MockAuthorizationCodeClient(config)
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request, authCodePayLoad);

        expect(AuthorizationCodeClient).toHaveBeenCalledTimes(1);
        expect(AuthorizationCodeClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test("acquireTokenByAuthorizationCode with state validation", async () => {
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE
        };

        const cryptoProvider = new CryptoProvider();
        const authCodePayLoad = {
            nonce: cryptoProvider.createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            state: cryptoProvider.createNewGuid()
        };

        const MockAuthorizationCodeClient = getMsalCommonAutoMock()
            .AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            config => new MockAuthorizationCodeClient(config)
        );

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request, authCodePayLoad);

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

    test('acquireTokenSilent', async () => {  
        const account: AccountInfo = {
            homeAccountId: "",
            environment: "",
            tenantId: "",
            username: "",
            localAccountId: "",
            name: "",
            idTokenClaims: ID_TOKEN_CLAIMS

        };
        const request: SilentFlowRequest = {
            account: account,
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE
        };

        const silentFlowClient = getMsalCommonAutoMock().SilentFlowClient;
        jest.spyOn(msalCommon, 'SilentFlowClient')
            .mockImplementation((config) => new silentFlowClient(config));


        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenSilent(request);
        expect(SilentFlowClient).toHaveBeenCalledTimes(1);
        expect(SilentFlowClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test("acquireTokenInteractive", async () => {
        const authApp = new PublicClientApplication(appConfig);

        let redirectUri: string;
        
        const openBrowser = (url: string) => {
            expect(url.startsWith("https://login.microsoftonline.com")).toBe(true);
            http.get(`${redirectUri}?code=${TEST_CONSTANTS.AUTHORIZATION_CODE}`);
            return Promise.resolve();
        }
        const request: InteractiveRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            openBrowser: openBrowser
        };

        const MockAuthorizationCodeClient = getMsalCommonAutoMock().AuthorizationCodeClient;
        jest.spyOn(msalCommon, 'AuthorizationCodeClient').mockImplementation((config) => new MockAuthorizationCodeClient(config));

        jest.spyOn(MockAuthorizationCodeClient.prototype, "getAuthCodeUrl").mockImplementation((req) => {
            redirectUri = req.redirectUri;
            return Promise.resolve(TEST_CONSTANTS.AUTH_CODE_URL);
        });

        jest.spyOn(MockAuthorizationCodeClient.prototype, "acquireToken").mockImplementation(() => {
            return Promise.resolve(mockAuthenticationResult);
        });

        const response = await authApp.acquireTokenInteractive(request);
        expect(response.idToken).toEqual(mockAuthenticationResult.idToken);
        expect(response.accessToken).toEqual(mockAuthenticationResult.accessToken);
        expect(response.account).toEqual(mockAuthenticationResult.account);
    });

    test('initializeBaseRequest passes a claims hash to acquireToken', async () => {
        const account: AccountInfo = {
            homeAccountId: "",
            environment: "",
            tenantId: "",
            username: "",
            localAccountId: "",
            name: "",
            idTokenClaims: ID_TOKEN_CLAIMS

        };
        const request: SilentFlowRequest = {
            account: account,
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            claims: TEST_CONSTANTS.CLAIMS,
        };

        const silentFlowClient = getMsalCommonAutoMock().SilentFlowClient;
        jest.spyOn(msalCommon, 'SilentFlowClient')
            .mockImplementation((config) => new silentFlowClient(config));


        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenSilent(request);
        expect(silentFlowClient.prototype.acquireToken)
            .toHaveBeenCalledWith(expect.objectContaining({ requestedClaimsHash: expect.any(String) }))

        const submittedRequest = mocked(silentFlowClient.prototype.acquireToken).mock.calls[0][0];
        expect((submittedRequest as any)?.requestedClaimsHash?.length)
            .toBeGreaterThan(0);
    })


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
            authorityMetadata: "",
            skipAuthorityMetadataCache: false
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
            authorityMetadata: "",
            skipAuthorityMetadataCache: false
        });
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(expect.objectContaining(expectedConfig));
    });

    test('acquireToken when azureCloudOptions are set', async () => {
        // No authority set in app configuration or request, should default to common authority
        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                azureCloudOptions: {
                    azureCloudInstance: msalCommon.AzureCloudInstance.AzureUsGovernment,
                    tenant: ""
                }
            },
        };

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const authorityMock = setupAuthorityFactory_createDiscoveredInstance_mock(fakeAuthority);

        const authApp = new PublicClientApplication(config);
        await authApp.acquireTokenByRefreshToken(request);
        expect(authorityMock.mock.calls[0][0]).toBe(TEST_CONSTANTS.USGOV_AUTHORITY);
        expect(authorityMock.mock.calls[0][1]).toBeInstanceOf(HttpClient);
        expect(authorityMock.mock.calls[0][2]).toBeInstanceOf(NodeStorage);
        expect(authorityMock.mock.calls[0][3]).toStrictEqual({
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [],
            azureRegionConfiguration: undefined,
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
            skipAuthorityMetadataCache: false
        });
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(expect.objectContaining(expectedConfig));
    });

    test('acquireToken when azureCloudOptions and authority are set', async () => {
        // No authority set in app configuration or request, should default to common authority
        const config: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.ALTERNATE_AUTHORITY,
                azureCloudOptions: {
                    azureCloudInstance: msalCommon.AzureCloudInstance.AzureUsGovernment,
                    tenant: ""
                }
            },
        };

        const request: RefreshTokenRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            refreshToken: TEST_CONSTANTS.REFRESH_TOKEN,
        };

        const authorityMock = setupAuthorityFactory_createDiscoveredInstance_mock(fakeAuthority);

        const authApp = new PublicClientApplication(config);
        await authApp.acquireTokenByRefreshToken(request);
        expect(authorityMock.mock.calls[0][0]).toBe(TEST_CONSTANTS.USGOV_AUTHORITY);
        expect(authorityMock.mock.calls[0][1]).toBeInstanceOf(HttpClient);
        expect(authorityMock.mock.calls[0][2]).toBeInstanceOf(NodeStorage);
        expect(authorityMock.mock.calls[0][3]).toStrictEqual({
            protocolMode: ProtocolMode.AAD,
            knownAuthorities: [],
            azureRegionConfiguration: undefined,
            cloudDiscoveryMetadata: "",
            authorityMetadata: "",
            skipAuthorityMetadataCache: false
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

    test("should throw an error if state is not provided", async () => {
        const cryptoProvider = new CryptoProvider();
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            correlationId: "test-correlationId",
            state: ""
        };

        const authCodePayLoad = {
            nonce: cryptoProvider.createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            state: cryptoProvider.createNewGuid()
        };

        const MockAuthorizationCodeClient = getMsalCommonAutoMock()
            .AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            config => new MockAuthorizationCodeClient(config)
        );

        const mockInfo = jest.fn();
        jest.mock("@azure/msal-common", () => {
            return {
                getLogger: () => ({
                    info: mockInfo
                })
            };
        });

        const authApp = new PublicClientApplication(appConfig);
        await authApp.acquireTokenByCode(request, authCodePayLoad);

        try {
            await authApp.acquireTokenByCode(request, authCodePayLoad);
        } catch (e) {   
            expect(mockInfo).toBeCalledWith("acquireTokenByCode called");
            expect(mockInfo).toHaveBeenCalledWith(
                "acquireTokenByCode - validating state"
            );
            expect(authApp.acquireTokenByCode).toThrow(
                "State not found. Please verify that the request originated from msal."
            );
        }
    });

    test("should throw error when state and cachedSate don't match", async () => {
        const cryptoProvider = new CryptoProvider();
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            correlationId: "test-correlationId",
            state: cryptoProvider.createNewGuid()
        };

        const authCodePayLoad = {
            nonce: cryptoProvider.createNewGuid(),
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
            state: "ed09b151-1b68-4c2c-8e95-y8dcfffffggh"
        };

        const MockAuthorizationCodeClient = getMsalCommonAutoMock()
            .AuthorizationCodeClient;

        jest.spyOn(msalCommon, "AuthorizationCodeClient").mockImplementation(
            config => new MockAuthorizationCodeClient(config)
        );

        const mockInfo = jest.fn();
        jest.mock("@azure/msal-common", () => {
            return {
                getLogger: () => ({
                    info: mockInfo
                })
            };
        });

        const authApp = new PublicClientApplication(appConfig);

        await expect(authApp.acquireTokenByCode(request, authCodePayLoad))
            .rejects.toMatchObject(ClientAuthError.createStateMismatchError());
    });

});