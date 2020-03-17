const { ConfidentialClientApplication } = require('./../dist/');

describe('ConfidentialClientApplication', () => {
    test('exports a class', () => {
        const authApp = new ConfidentialClientApplication();
        expect(authApp).toBeInstanceOf(ConfidentialClientApplication);
    });
});
