import { ClientAssertion } from "../../src/client/ClientAssertion";
import { TEST_CONSTANTS } from "../utils/TestConstants";
import { CryptoProvider } from "../../src/crypto/CryptoProvider";
import { sign } from "jsonwebtoken";
import { mocked } from "ts-jest/utils";
import { EncodingUtils } from "../../src/utils/EncodingUtils";
import { JwtConstants } from '../../src/utils/Constants';

jest.mock('jsonwebtoken');

describe('Client assertion test', () => {
    const cryptoProvider = new CryptoProvider();
    const issuer = "client_id";
    const audience = "audience";

    test('creates ClientAssertion From assertion', () => {
        const assertion = ClientAssertion.fromAssertion(TEST_CONSTANTS.CLIENT_ASSERTION);
        expect(assertion.getJwt(cryptoProvider, issuer, audience)).toEqual(TEST_CONSTANTS.CLIENT_ASSERTION);
    });

    test('creates ClientAssertion from certificate', () => {
        const expectedPayload = {
            [JwtConstants.AUDIENCE]: audience,
            [JwtConstants.ISSUER]: issuer,
            [JwtConstants.SUBJECT]: issuer,
        }

        const expectedOptions = {
            "header": {
                [JwtConstants.ALGORITHM]: JwtConstants.RSA_256,
                [JwtConstants.X5T]: EncodingUtils.base64EncodeUrl(TEST_CONSTANTS.THUMBPRINT, "hex")
            }
        }

        mocked(sign).mockImplementation((payload, privateKey, options) => {
            expect(privateKey).toEqual(TEST_CONSTANTS.PRIVATE_KEY);
            expect(payload).toEqual(
                expect.objectContaining(expectedPayload));
            expect(options).toEqual(expectedOptions);
        }
        );

        const assertion = ClientAssertion.fromCertificate(TEST_CONSTANTS.THUMBPRINT, TEST_CONSTANTS.PRIVATE_KEY);
        assertion.getJwt(cryptoProvider, issuer, audience);
    });
});