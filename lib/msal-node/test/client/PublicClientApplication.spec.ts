import { PublicClientApplication } from './../../src/client/PublicClientApplication';

describe('PublicClientApplication', () => {
    test('exports a class', () => {
        const authApp = new PublicClientApplication();
        expect(authApp).toBeInstanceOf(PublicClientApplication);
    });
});
