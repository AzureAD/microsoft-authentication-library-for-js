import { PublicClientApplication } from './../../src/client/PublicClientApplication';
import {AuthorizationCodeRequest, ClientConfiguration} from './../../src/index';
import { DeviceCodeRequest } from "@azure/msal-common/dist/src/request/DeviceCodeRequest";
import {AuthorizationCodeUrlRequest, DeviceCodeClient} from "@azure/msal-common";
import {AUTHENTICATION_RESULT, TEST_CONSTANTS} from "../utils/TestConstants";

describe('PublicClientApplication', () => {

    jest.mock("@azure/msal-common");
    DeviceCodeClient.prototype.acquireToken = jest.fn(() => new Promise<string>((resolve) => resolve(JSON.stringify(AUTHENTICATION_RESULT))));

    test('exports a class', () => {
        const msalConfig: ClientConfiguration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
            }
        };

        const authApp = new PublicClientApplication(msalConfig);
        expect(authApp).toBeInstanceOf(PublicClientApplication);
    });

    test('acquireTokenByDeviceCode', () => {
        const msalConfig: ClientConfiguration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
            }
        };

        jest.mock("@azure/msal-common");
        DeviceCodeClient.prototype.acquireToken = jest.fn(() => new Promise<string>((resolve) => resolve(JSON.stringify(AUTHENTICATION_RESULT))));

        const request: DeviceCodeRequest = {
            deviceCodeCallback: response => {console.log(response)},
            scopes: ["user.read"]
        };


        const authApp = new PublicClientApplication(msalConfig);
        authApp.acquireTokenByDeviceCode(request)
            .then((response) => {

                // expect(result).toBeInstanceOf(""); // TODO add check when response type is decided on
                expect(response).toEqual(JSON.stringify(AUTHENTICATION_RESULT));
            });
    });

    test('acquireTokenByAuthorizationCode', () => {
        const msalConfig: ClientConfiguration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
            }
        };

        const request: AuthorizationCodeRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
            code: TEST_CONSTANTS.AUTHORIZATION_CODE,
        };

        const authApp = new PublicClientApplication(msalConfig);
        authApp.acquireTokenByCode(request)
            .then((response) => {
                // expect(result).toBeInstanceOf(""); // TODO add check when response type is decided on
                expect(response).toEqual(JSON.stringify(AUTHENTICATION_RESULT));
            });
    });

    test('create AuthorizationCode URL', () => {
        const msalConfig: ClientConfiguration = {
            auth: {
                clientId: TEST_CONSTANTS.CLIENT_ID,
                authority: TEST_CONSTANTS.AUTHORITY,
            }
        };

        const request: AuthorizationCodeUrlRequest = {
            scopes: TEST_CONSTANTS.DEFAULT_GRAPH_SCOPE,
            redirectUri: TEST_CONSTANTS.REDIRECT_URI,
        };

        const authApp = new PublicClientApplication(msalConfig);
        authApp.getAuthCodeUrl(request)
            .then((response) => {
                // expect(result).toBeInstanceOf(""); // TODO add check when response type is decided on
                expect(response).toEqual(JSON.stringify(AUTHENTICATION_RESULT));
            });
    });


});
