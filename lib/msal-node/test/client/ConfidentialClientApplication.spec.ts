import { ConfidentialClientApplication } from './../../src/client/ConfidentialClientApplication';

describe('ConfidentialClientApplication', () => {
    test('exports a class', () => {
        const authApp = new ConfidentialClientApplication();
        expect(authApp).toBeInstanceOf(ConfidentialClientApplication);
    });
});
