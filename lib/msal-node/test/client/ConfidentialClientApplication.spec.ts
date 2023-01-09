import { ConfidentialClientApplication } from './../../src/client/ConfidentialClientApplication';
import { ClientConfiguration, AuthorizationCodeClient, RefreshTokenClient, AuthenticationResult, ClientCredentialClient, OnBehalfOfClient, UsernamePasswordClient } from '@azure/msal-common';
import { TEST_CONSTANTS } from '../utils/TestConstants';
import { Configuration } from "../../src/config/Configuration";
import { AuthorizationCodeRequest } from "../../src/request/AuthorizationCodeRequest";
import { UsernamePasswordRequest } from '../../src';
import { mocked } from 'ts-jest/utils';
import { RefreshTokenRequest } from "../../src/request/RefreshTokenRequest";
import { fakeAuthority, setupAuthorityFactory_createDiscoveredInstance_mock } from './test-fixtures';

import * as msalCommon from '@azure/msal-common';
import { ClientCredentialRequest } from '../../src/request/ClientCredentialRequest';
import { OnBehalfOfRequest } from '../../src';
import { getMsalCommonAutoMock } from '../utils/MockUtils';
import { AuthError, OIDC_DEFAULT_SCOPES } from "@azure/msal-common";

describe('ConfidentialClientApplication', () => {
    let appConfig: Configuration = {
        auth: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: TEST_CONSTANTS.AUTHORITY,
            clientSecret: TEST_CONSTANTS.CLIENT_SECRET
        },
    };

    const expectedConfig: ClientConfiguration = {
        authOptions: {
            clientId: TEST_CONSTANTS.CLIENT_ID,
            authority: fakeAuthority,
            clientCapabilities: []
        },
        clientCredentials: {
            clientSecret: TEST_CONSTANTS.CLIENT_SECRET
        }
    };

    test('exports a class', () => {
        const authApp = new ConfidentialClientApplication(appConfig);
        expect(authApp).toBeInstanceOf(ConfidentialClientApplication);
    });

    test('acquireTokenByAuthorizationCode', async () => {
        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };

        setupAuthorityFactory_createDiscoveredInstance_mock();
        const mockAuthCodeClientInstance = {
            includeRedirectUri: false,

            acquireToken: jest.fn()
        }
        jest.spyOn(msalCommon, 'AuthorizationCodeClient')
            .mockImplementation(() => mockAuthCodeClientInstance as unknown as AuthorizationCodeClient)

        const authApp = new ConfidentialClientApplication(appConfig);
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

        setupAuthorityFactory_createDiscoveredInstance_mock();


        const { RefreshTokenClient: mockRefreshTokenClient } = getMsalCommonAutoMock();


        jest.spyOn(msalCommon, 'RefreshTokenClient')
            .mockImplementation((conf) => new mockRefreshTokenClient(conf));

        const fakeAuthResult = {}
        mocked(mockRefreshTokenClient.prototype.acquireToken)
            .mockImplementation(() => Promise.resolve(fakeAuthResult as unknown as AuthenticationResult))

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByRefreshToken(request);
        expect(RefreshTokenClient).toHaveBeenCalledTimes(1);
        expect(RefreshTokenClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test('acquireTokenByClientCredential', async () => {

        const testProvider: msalCommon.IAppTokenProvider = () => {
            return new Promise<msalCommon.AppTokenProviderResult>(
                (resolve) => resolve({
                    accessToken: "accessToken",
                    expiresInSeconds: 3601,
                    refreshInSeconds: 1801,
                }))};      

        const configWithExtensibility: Configuration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,                                
                clientAssertion: "testAssertion"
            },
        }                  

        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false
        };
        setupAuthorityFactory_createDiscoveredInstance_mock();
        const MockClientCredentialClient = getMsalCommonAutoMock().ClientCredentialClient;

        jest.spyOn(msalCommon, 'ClientCredentialClient')
            .mockImplementation((conf) => new MockClientCredentialClient(conf));

        const authApp = new ConfidentialClientApplication(configWithExtensibility);
        authApp.SetAppTokenProvider(testProvider);

        await authApp.acquireTokenByClientCredential(request);
        expect(ClientCredentialClient).toHaveBeenCalledTimes(1);      
    });

    test('acquireTokenByClientCredential with client assertion', async () => {
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false,
            clientAssertion: "testAssertion"
        };
        setupAuthorityFactory_createDiscoveredInstance_mock();
        const MockClientCredentialClient = getMsalCommonAutoMock().ClientCredentialClient;

        jest.spyOn(msalCommon, 'ClientCredentialClient')
            .mockImplementation((conf) => new MockClientCredentialClient(conf));

        MockClientCredentialClient.prototype.acquireToken = jest.fn((request: msalCommon.CommonClientCredentialRequest) => {
            expect(request.clientAssertion).not.toBe(undefined);
            expect(request.clientAssertion?.assertion).toBe("testAssertion");
            expect(request.clientAssertion?.assertionType).toBe("urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
            return Promise.resolve(null);
        });

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByClientCredential(request);
    });



    test('acquireTokenOnBehalfOf', async () => {
        const request: OnBehalfOfRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            oboAssertion: TEST_CONSTANTS.ACCESS_TOKEN
        };

        setupAuthorityFactory_createDiscoveredInstance_mock();

        const { OnBehalfOfClient: MockOnBehalfOfClient } = getMsalCommonAutoMock();

        jest.spyOn(msalCommon, 'OnBehalfOfClient').mockImplementation((conf) => new MockOnBehalfOfClient(conf));

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenOnBehalfOf(request);
        expect(OnBehalfOfClient).toHaveBeenCalledTimes(1);
        expect(OnBehalfOfClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });



    test('acquireTokenByUsernamePassword', async () => {
        const request: UsernamePasswordRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            username: TEST_CONSTANTS.USERNAME,
            password: TEST_CONSTANTS.PASSWORD
        };

        setupAuthorityFactory_createDiscoveredInstance_mock();

        const { UsernamePasswordClient: MockUsernamePasswordClient } = getMsalCommonAutoMock();

        jest.spyOn(msalCommon, 'UsernamePasswordClient').mockImplementation((conf) => new MockUsernamePasswordClient(conf));

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByUsernamePassword(request);
        expect(UsernamePasswordClient).toHaveBeenCalledTimes(1);
        expect(UsernamePasswordClient).toHaveBeenCalledWith(
            expect.objectContaining(expectedConfig)
        );
    });

    test('acquireTokenByClientCredential handles AuthErrors as expected', async () => {
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false
        };

        setupAuthorityFactory_createDiscoveredInstance_mock();
        const MockClientCredentialClient = getMsalCommonAutoMock().ClientCredentialClient;

        jest.spyOn(msalCommon, 'ClientCredentialClient')
            .mockImplementation((conf) => new MockClientCredentialClient(conf));

        jest.spyOn(AuthError.prototype, 'setCorrelationId');

        mocked(MockClientCredentialClient.prototype.acquireToken)
            .mockImplementation(() => {
                throw new AuthError();
            });


        try {
            const authApp = new ConfidentialClientApplication(appConfig);
            await authApp.acquireTokenByClientCredential(request);
        } catch (e) {
            expect(e).toBeInstanceOf(AuthError);
            expect(AuthError.prototype.setCorrelationId).toHaveBeenCalledTimes(1);
        }
    });

    test('acquireTokenByClientCredential request does not contain OIDC scopes', async () => {
        const request: ClientCredentialRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            skipCache: false
        };

        setupAuthorityFactory_createDiscoveredInstance_mock();
        const MockClientCredentialClient = getMsalCommonAutoMock().ClientCredentialClient;

        jest.spyOn(msalCommon, 'ClientCredentialClient')
            .mockImplementation((conf) => new MockClientCredentialClient(conf));

        MockClientCredentialClient.prototype.acquireToken = jest.fn((request: msalCommon.CommonClientCredentialRequest) => {
            OIDC_DEFAULT_SCOPES.forEach((scope: string) => {
                expect(request.scopes).not.toContain(scope);
            });
            return Promise.resolve(null);
        });

        const authApp = new ConfidentialClientApplication(appConfig);
        await authApp.acquireTokenByClientCredential(request);
    });
});
