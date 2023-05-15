import { CryptoUtils } from "../../src/utils/CryptoUtils";
import { TEST_RESPONSE_TYPE } from "./../TestConstants";

describe("CryptoUtils.ts class", () => {

    const EN_PLAINTEXT = "msaljs";
    const EN_B64_ENCODED = "bXNhbGpz";

    const ISL_PLAINTEXT = "Björn Ironside";
    const ISL_B64_ENCODED = "QmrDtnJuIElyb25zaWRl";

    const HE_PLAINTEXT = "בְּצַלְאֵל";
    const HE_B64_ENCODED = "15HWvNaw16bWt9ec1rDXkNa115w=";

    const ES_PLAINTEXT = "Avrán";
    const ES_B64_ENCODED = "QXZyw6Fu";

    const JA_PLAINTEXT = "日本語憂鬱髙";
    const JA_B64_ENCODED = "5pel5pys6Kqe5oaC6ayx6auZ";

    describe("test Base64 encode decode", () => {
        it('english', () => {
            expect(CryptoUtils.base64Encode(EN_PLAINTEXT)).toBe(EN_B64_ENCODED);
            expect(CryptoUtils.base64Decode(EN_B64_ENCODED)).toBe(EN_PLAINTEXT);
        });

        it('Icelandic', () => {
            expect(CryptoUtils.base64Encode(ISL_PLAINTEXT)).toBe(ISL_B64_ENCODED);
            expect(CryptoUtils.base64Decode(ISL_B64_ENCODED)).toBe(ISL_PLAINTEXT);
        });

        it('hebrew', () => {
            expect(CryptoUtils.base64Encode(HE_PLAINTEXT)).toBe(HE_B64_ENCODED);
            expect(CryptoUtils.base64Decode(HE_B64_ENCODED)).toBe(HE_PLAINTEXT);
        });

        it('spanish', () => {
            expect(CryptoUtils.base64Encode(ES_PLAINTEXT)).toBe(ES_B64_ENCODED);
            expect(CryptoUtils.base64Decode(ES_B64_ENCODED)).toBe(ES_PLAINTEXT);
        });

        it('japanese', () => {
            expect(CryptoUtils.base64Encode(JA_PLAINTEXT)).toBe(JA_B64_ENCODED);
            expect(CryptoUtils.base64Decode(JA_B64_ENCODED)).toBe(JA_PLAINTEXT);
        });

        it('id token', () => {
            const ID_TOKEN_STRING = "eyJhdWQiOiI3MzE1YmE0MS1lZDYwLTQwYjUtOTY3Zi1hOTBlNTUzZmM3MTgiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY2QxOWNlNjQtMDI4Mi00YTJkLTgxMjktNDdhYTBiMjdmYjdiL3YyLjAiLCJpYXQiOjE1NzEyNzUzNDIsIm5iZiI6MTU3MTI3NTM0MiwiZXhwIjoxNTcxMjc5MjQyLCJhaW8iOiJBVFFBeS84TkFBQUFYck5scUhmVWY4blNTcUR2Nis5OGlEZU1tZmZuOVNieHhDbTNQNXI1ZkpHSDBJenA4ZmNHNVdzL1V6bE1RL3F2IiwibmFtZSI6Iui-u_OghIAg5aSq6YOOIiwibm9uY2UiOiI0YjIyMDAxNi1mZThkLTRiMWEtYjQ0MS0wNTJjY2ZjZjg1YTgiLCJvaWQiOiI3YTg4NjEwOS1kNmQzLTRlNjMtYTA5MS05YWMyOGE0NjA0Y2YiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqcC10ZXN0QGphbnV0dGVydGVzdC5vbm1pY3Jvc29mdC5jb20iLCJzdWIiOiJ3VGJ1WkZxY0IyN3UtOXFhMVktbFVrS2EzQVR1TjllZGdsRDhmSFZLUEs4IiwidGlkIjoiY2QxOWNlNjQtMDI4Mi00YTJkLTgxMjktNDdhYTBiMjdmYjdiIiwidXRpIjoiak5kXy1zMHEyMC0xdzE5NGVfWUtBQSIsInZlciI6IjIuMCJ9";

            const ID_TOKEN = {
                "aud": "7315ba41-ed60-40b5-967f-a90e553fc718",
                "iss": "https://login.microsoftonline.com/cd19ce64-0282-4a2d-8129-47aa0b27fb7b/v2.0",
                "iat": 1571275342,
                "nbf": 1571275342,
                "exp": 1571279242,
                "aio": "ATQAy/8NAAAAXrNlqHfUf8nSSqDv6+98iDeMmffn9SbxxCm3P5r5fJGH0Izp8fcG5Ws/UzlMQ/qv",
                "name": "辻󠄀 太郎",
                "nonce": "4b220016-fe8d-4b1a-b441-052ccfcf85a8",
                "oid": "7a886109-d6d3-4e63-a091-9ac28a4604cf",
                "preferred_username": "jp-test@januttertest.onmicrosoft.com",
                "sub": "wTbuZFqcB27u-9qa1Y-lUkKa3ATuN9edglD8fHVKPK8",
                "tid": "cd19ce64-0282-4a2d-8129-47aa0b27fb7b",
                "uti": "jNd_-s0q20-1w194e_YKAA",
                "ver": "2.0"
            };

            expect(CryptoUtils.base64Decode(ID_TOKEN_STRING)).toBe(JSON.stringify(ID_TOKEN));
        });
    });

    describe("test if a string is GUID", () => {
        it('Regular text', () => {
            expect(CryptoUtils.isGuid("Hello")).toBe(false);
        });

        it('GUID', () => {
            expect(CryptoUtils.isGuid("a3cd2952-64dd-43b4-9720-f48c093394a3")).toBe(true);
        });
    });

    describe("test createNewGuid() generates a GUID", () => {
        it('Generate and validate a GUID', () => {
            expect(CryptoUtils.isGuid(CryptoUtils.createNewGuid())).toBe(true);
        });
    });

    describe("test decimal to hex conversion utility", () => {
        it('test  if we are  generating a hex number', () => {
            const h: string = CryptoUtils.decimalToHex(1234);
            const d = parseInt(h,16);

            expect(d.toString(16)).toBe(h);
        });
    });

    describe("test the deserializing utility function", () => {
        it('validate the deserializing utility function', () => {
            const query = CryptoUtils.deserialize("id_token=MSAL_TEST_IDTOKEN&access_token=MSAL_TEST_ACCESS_TOKEN");
            expect(query.hasOwnProperty("id_token"));
            expect(query.hasOwnProperty("access_token"));
        });

        it('properly decodes query string', () => {
            const queryString = "access_token=EwBAA8mJBAAUXpgJ5Mc4zm0CiDQiuz7KgzheYxoAAW0EcsQ7kjwYXwNjblrfuVIADaWZyqYqZSwkJtLGqNYx6OYGtZr3Aw8xXTzuJRB%2bt%2bTvcJUzYJ5egaCnhKMLhLc3qUEiP8NlEgzKeta4D71yHuW9Z5LUp7X9NN/hdrnVVbiRfnCXoI70H88kxT4L7G9085D7aBIGDG3cOpaXJLbYwzGnoScxPwaG92nFzIMGrIlQAOt4p0cbu6rrcoWyINHNS14DrniVqD23P7u0yBEbgF9jZQamM/NPZeb2XhdKUjUvKOvEsg55QKsNgzsE2k1l9ot8U5Ox7S79Bpdf0RhH/odRKDBeFfPjmPzsM/fQEqMfd%2bdpSW0obR9GGm6qSdEDZgAACD%2brWZm4XNIHEAJ9WZZ9dfDSHpUZOQ914Z8eMh7ax2OucDCsajQgDUqWbf1lha71%2b/UsXmNDFqct8AdzY%2bzVV0VxdUgKhljwqAbd8sEsQIPU6rJjPBlfoiYXUrcYUhSq0VDzoq%2bmc1Br%2bh/svT7q/kvYNM6XVM4UQIA2pPfRBF4mXGJoQXGdBeGNZgznkJ5Pb9pBa3i3VzHneYF67AeS7gn1zuLx5C3ILXwXNXiFdGRJ4bW3GdvrwQbcowY5P4evoxvthsw7Zew0UqxMYxtAGroqNRX7QgTQeEGSo6Dr3vyeuUWl17AU9UaKuwnnMKTXZzgLY7f16mQEcJVasT/bZ922%2bF4upLoX79X%2bh3zUXMQYAfXQPSbUSBI5gvWJz52SuJky3wbQFpV/MQ3GcMQPyrMk3XRXsINTYxt8UMRm6MTovZsQU0wHPEnTuwaguUrCFbKH5akkh56LPYWGx1I6nGUU5mbZarau7KEqetBhiSbmnsnpjYZej/beIOr4En%2bw4L2okXfmo2O5leWX81UfZx1CcAMexcWwjJ6I2siPn1NauPlOAgG5OJTMeXgZf2FIL6dcRggiLFvf5PjWWDRr6wWkH1Kikusq9nxkQQXWUYEsXQ30OJoHTzvCp8lN2V7PVQEr3fjAVk/2/4QooN%2bSNHyOUfOHsb/suA14o8nVmSLuPLZhEWmFNR%2bLypXJdGpkgg%2bqqW5t2FwvL4c7Ag%3d%3d";

            const parsedQueryString = CryptoUtils.deserialize(queryString);

            expect(parsedQueryString["access_token"]).toBe(
                "EwBAA8mJBAAUXpgJ5Mc4zm0CiDQiuz7KgzheYxoAAW0EcsQ7kjwYXwNjblrfuVIADaWZyqYqZSwkJtLGqNYx6OYGtZr3Aw8xXTzuJRB+t+TvcJUzYJ5egaCnhKMLhLc3qUEiP8NlEgzKeta4D71yHuW9Z5LUp7X9NN/hdrnVVbiRfnCXoI70H88kxT4L7G9085D7aBIGDG3cOpaXJLbYwzGnoScxPwaG92nFzIMGrIlQAOt4p0cbu6rrcoWyINHNS14DrniVqD23P7u0yBEbgF9jZQamM/NPZeb2XhdKUjUvKOvEsg55QKsNgzsE2k1l9ot8U5Ox7S79Bpdf0RhH/odRKDBeFfPjmPzsM/fQEqMfd+dpSW0obR9GGm6qSdEDZgAACD+rWZm4XNIHEAJ9WZZ9dfDSHpUZOQ914Z8eMh7ax2OucDCsajQgDUqWbf1lha71+/UsXmNDFqct8AdzY+zVV0VxdUgKhljwqAbd8sEsQIPU6rJjPBlfoiYXUrcYUhSq0VDzoq+mc1Br+h/svT7q/kvYNM6XVM4UQIA2pPfRBF4mXGJoQXGdBeGNZgznkJ5Pb9pBa3i3VzHneYF67AeS7gn1zuLx5C3ILXwXNXiFdGRJ4bW3GdvrwQbcowY5P4evoxvthsw7Zew0UqxMYxtAGroqNRX7QgTQeEGSo6Dr3vyeuUWl17AU9UaKuwnnMKTXZzgLY7f16mQEcJVasT/bZ922+F4upLoX79X+h3zUXMQYAfXQPSbUSBI5gvWJz52SuJky3wbQFpV/MQ3GcMQPyrMk3XRXsINTYxt8UMRm6MTovZsQU0wHPEnTuwaguUrCFbKH5akkh56LPYWGx1I6nGUU5mbZarau7KEqetBhiSbmnsnpjYZej/beIOr4En+w4L2okXfmo2O5leWX81UfZx1CcAMexcWwjJ6I2siPn1NauPlOAgG5OJTMeXgZf2FIL6dcRggiLFvf5PjWWDRr6wWkH1Kikusq9nxkQQXWUYEsXQ30OJoHTzvCp8lN2V7PVQEr3fjAVk/2/4QooN+SNHyOUfOHsb/suA14o8nVmSLuPLZhEWmFNR+LypXJdGpkgg+qqW5t2FwvL4c7Ag=="
            );
        })
    });
});
