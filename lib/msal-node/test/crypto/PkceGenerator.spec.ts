import { PkceCodes } from '@azure/msal-common';
import { TESTS } from './../TestConstants';
const { PkceGenerator } = require('./../../src/crypto/PkceGenerator');

describe('PkceGenerator', () => {
    // tests generatePkceCodes
    test('generatePkceCodes() generates valid PKCE codes', async () => {
        const pkceRegExp = new RegExp('[A-Za-z0-9-_+/]{43}');
        let PkceGeneratorInstance = new PkceGenerator();

        for (let i = 0; i < TESTS; i++) {
            const pkceCodes: PkceCodes = await PkceGeneratorInstance.generatePkceCodes();
            expect(pkceRegExp.test(pkceCodes.challenge)).toBe(true);
            expect(pkceRegExp.test(pkceCodes.verifier)).toBe(true);
        }
    });
});
