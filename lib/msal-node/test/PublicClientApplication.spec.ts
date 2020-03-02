const { PublicClientApplication } = require('./../dist/');

describe('PublicClientApplication', () => {
    test('exports a class', () => {
        const authApp = new PublicClientApplication();
        expect(authApp).toBeInstanceOf(PublicClientApplication);
    });
});
