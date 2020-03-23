import {ClientApplication} from "client/ClientApplication";
import {ClientConfiguration} from "config/ClientConfiguration";
import {PublicClientApplication} from "client/PublicClientApplication";
import {AuthorizationCodeUrlRequest} from "@azure/msal-common";



describe('ClientApplication', () => {
    test('exports a class', () => {
        const msalConfig: ClientConfiguration= {
            auth: {
                clientId: 'b41a6fbb-c728-4e03-aa59-d25b0fd383b6',
                authority: 'https://login.microsoftonline.com/TenantId',
            },
            cache: {
                cacheLocation: 'fileCache', // This configures where your cache will be stored
                storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
            },
        };

        const authApp = new PublicClientApplication(msalConfig);
        expect(authApp).toBeInstanceOf(PublicClientApplication);
    });

    test('authorization code url', () => {
        const authCodeUrlRequest: AuthorizationCodeUrlRequest


    })




});
