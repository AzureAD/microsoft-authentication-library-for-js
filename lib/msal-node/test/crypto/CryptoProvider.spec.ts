import { PkceCodes } from '@azure/msal-common';
import { CryptoProvider } from './../../src/index';
import { GuidGenerator } from './../../src/crypto/GuidGenerator';

describe('CryptoOps', () => {
    const cryptoOps = new CryptoProvider();

    // tests instantiating CryptoOps class
    test('CryptoOps() generates a valid instance', () => {
        expect(cryptoOps).toBeInstanceOf(CryptoProvider);
    });

    // tests createNewGuid() generates a GUID
    test('createNewGuid() generates a valid Guid', () => {
        const guid = cryptoOps.createNewGuid();
        expect(GuidGenerator.isGuid(guid)).toBe(true);
    });

    // tests base64Encode() works as expected
    test('base64Encode() encodes correctly', () => {
        expect(cryptoOps.base64Encode('')).toBe('');
        expect(cryptoOps.base64Encode('f')).toBe('Zg==');
        expect(cryptoOps.base64Encode('fo')).toBe('Zm8=');
        expect(cryptoOps.base64Encode('foo')).toBe('Zm9v');
        expect(cryptoOps.base64Encode('foob')).toBe('Zm9vYg==');
        expect(cryptoOps.base64Encode('fooba')).toBe('Zm9vYmE=');
        expect(cryptoOps.base64Encode('foobar')).toBe('Zm9vYmFy');
    });

    // tests base64Decode() works as expected
    test('base64Decode() works as expected', () => {
        expect(cryptoOps.base64Decode('')).toBe('');
        expect(cryptoOps.base64Decode('Zg==')).toBe('f');
        expect(cryptoOps.base64Decode('Zm8=')).toBe('fo');
        expect(cryptoOps.base64Decode('Zm9v')).toBe('foo');
        expect(cryptoOps.base64Decode('Zm9vYg==')).toBe('foob');
        expect(cryptoOps.base64Decode('Zm9vYmE=')).toBe('fooba');
        expect(cryptoOps.base64Decode('Zm9vYmFy')).toBe('foobar');
    });

    // tests generatePkceCodes() generates PkceCodes as expected
    test('generatePkceCodes() generates PkceCodes', async () => {
        const pkceCodes: PkceCodes = await cryptoOps.generatePkceCodes();
        const pkceRegExp = new RegExp('[A-Za-z0-9-_+/]{43}');
        expect(pkceRegExp.test(pkceCodes.challenge)).toBe(true);
        expect(pkceRegExp.test(pkceCodes.verifier)).toBe(true);
    });
});
