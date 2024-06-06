import { ClientAssertion } from "../../src/client/ClientAssertion";
import {
    DEFAULT_OPENID_CONFIG_RESPONSE,
    TEST_CONSTANTS,
} from "../utils/TestConstants";
import { CryptoProvider } from "../../src/crypto/CryptoProvider";
import { EncodingUtils } from "../../src/utils/EncodingUtils";
import { JwtConstants } from "../../src/utils/Constants";
import { getClientAssertionCallback } from "./ClientTestUtils";
import { getClientAssertion } from "@azure/msal-common";

const jsonwebtoken = require("jsonwebtoken");

jest.mock("jsonwebtoken");

describe("Client assertion test", () => {
    const cryptoProvider = new CryptoProvider();
    const issuer = "client_id";
    const audience = "audience";

    test("creates ClientAssertion from assertion string", () => {
        const assertion = ClientAssertion.fromAssertion(
            TEST_CONSTANTS.CLIENT_ASSERTION
        );
        expect(assertion.getJwt(cryptoProvider, issuer, audience)).toEqual(
            TEST_CONSTANTS.CLIENT_ASSERTION
        );
    });

    test("creates ClientAssertion from assertion callback (which returns a string)", async () => {
        const clientAssertionCallback = getClientAssertionCallback(
            TEST_CONSTANTS.CLIENT_ASSERTION
        );

        const assertionFromCallback: string = await getClientAssertion(
            clientAssertionCallback,
            TEST_CONSTANTS.CLIENT_ID, // value doesn't matter, will be ignored in mock callback
            DEFAULT_OPENID_CONFIG_RESPONSE.body.token_endpoint // value doesn't matter, will be ignored in mock callback
        );

        const assertion = ClientAssertion.fromAssertion(assertionFromCallback);
        expect(assertion.getJwt(cryptoProvider, issuer, audience)).toEqual(
            TEST_CONSTANTS.CLIENT_ASSERTION
        );
    });

    test("creates ClientAssertion from certificate", () => {
        const expectedPayload = {
            [JwtConstants.AUDIENCE]: audience,
            [JwtConstants.ISSUER]: issuer,
            [JwtConstants.SUBJECT]: issuer,
        };

        const expectedOptions = {
            header: {
                [JwtConstants.ALGORITHM]: JwtConstants.RSA_256,
                [JwtConstants.X5T]: EncodingUtils.base64EncodeUrl(
                    TEST_CONSTANTS.THUMBPRINT,
                    "hex"
                ),
            },
        };

        const spySign = jest.spyOn(jsonwebtoken, "sign");
        const assertion = ClientAssertion.fromCertificate(
            TEST_CONSTANTS.THUMBPRINT,
            TEST_CONSTANTS.PRIVATE_KEY
        );
        assertion.getJwt(cryptoProvider, issuer, audience);

        expect(spySign.mock.calls[0][0]).toEqual(
            expect.objectContaining(expectedPayload)
        );
        expect(spySign.mock.calls[0][1]).toEqual(TEST_CONSTANTS.PRIVATE_KEY);
        expect(spySign.mock.calls[0][2]).toEqual(expectedOptions);
    });

    test("creates ClientAssertion from public certificate for SNI", () => {
        const expectedPayload = {
            [JwtConstants.AUDIENCE]: audience,
            [JwtConstants.ISSUER]: issuer,
            [JwtConstants.SUBJECT]: issuer,
        };

        const expectedOptions = {
            header: {
                [JwtConstants.ALGORITHM]: JwtConstants.RSA_256,
                [JwtConstants.X5T]: EncodingUtils.base64EncodeUrl(
                    TEST_CONSTANTS.THUMBPRINT,
                    "hex"
                ),
            },
        };

        const spySign = jest.spyOn(jsonwebtoken, "sign");
        const assertion = ClientAssertion.fromCertificate(
            TEST_CONSTANTS.THUMBPRINT,
            TEST_CONSTANTS.PRIVATE_KEY,
            TEST_CONSTANTS.PUBLIC_CERTIFICATE
        );
        assertion.getJwt(cryptoProvider, issuer, audience);

        expect(spySign.mock.calls[0][0]).toEqual(
            expect.objectContaining(expectedPayload)
        );
        expect(spySign.mock.calls[0][1]).toEqual(TEST_CONSTANTS.PRIVATE_KEY);
        expect(spySign.mock.calls[0][2]).toEqual(expectedOptions);
    });

    test("parseCertificate finds all valid certs in a chain", () => {
        const parsedCert = ["line1line2", "line3line4"];
        expect(
            ClientAssertion.parseCertificate(TEST_CONSTANTS.PUBLIC_CERTIFICATE)
        ).toEqual(parsedCert);
    });

    test("parseCertificate returns an empty array if given an empty cert", () => {
        const testCert = "";
        expect(ClientAssertion.parseCertificate(testCert)).toEqual([]);
    });

    test("parseCertificate finds all valid certs for SNI certificate", () => {
        const parsedCert = [
            "line1line2line3line4line5",
            "line1line2line3line4line5",
            "line1line2line3line4line5",
        ];
        expect(
            ClientAssertion.parseCertificate(TEST_CONSTANTS.SNI_CERTIFICATE)
        ).toEqual(parsedCert);
    });
});
