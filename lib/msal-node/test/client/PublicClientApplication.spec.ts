import { PublicClientApplication } from './../../src/client/PublicClientApplication';
import { Configuration } from './../../src/index';
import { AuthorizationCodeUrlParameters } from './../../src/index';

describe('PublicClientApplication', () => {
    test('exports a class', () => {

        const msalConfig: Configuration = {
            auth: {
                clientId: 'b41a6fbb-c728-4e03-aa59-d25b0fd383b6',
                authority: 'https://login.microsoftonline.com/',
                redirectUri: 'http://localhost:3000',
            },
            cache: {
                cacheLocation: 'fileCache', // This configures where your cache will be stored
                storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
            },
        };

        const authApp = new PublicClientApplication(msalConfig);
        const request: AuthorizationCodeUrlParameters = {
            scopes: ['user.read'],
            authority:
                'https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47',
            redirectUri: 'http://localhost:3000',
            codeChallenge: '31943XseS-Ae9f0qGR0p1fruKNjZIcyVu6d-lGP3xf0',
            codeChallengeMethod: 'sha256',
            state: '2400cdfb-6a0b-4200-a368-8f2bf6d60500',
            correlationId: '43b735d3-07b5-400f-b0e0-eaeb7cae1bfe',
        };

        expect(authApp).toBeInstanceOf(PublicClientApplication);
    });
});
