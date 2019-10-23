import { expect } from "chai";
import { CryptoUtils } from "../../src/utils/CryptoUtils";

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
            expect(CryptoUtils.base64Encode(EN_PLAINTEXT)).to.be.equal(EN_B64_ENCODED);
            expect(CryptoUtils.base64Decode(EN_B64_ENCODED)).to.be.equal(EN_PLAINTEXT);
        });

        it('Icelandic', () => {
            expect(CryptoUtils.base64Encode(ISL_PLAINTEXT)).to.be.equal(ISL_B64_ENCODED);
            expect(CryptoUtils.base64Decode(ISL_B64_ENCODED)).to.be.equal(ISL_PLAINTEXT);
        });

        it('hebrew', () => {
            expect(CryptoUtils.base64Encode(HE_PLAINTEXT)).to.be.equal(HE_B64_ENCODED);
            expect(CryptoUtils.base64Decode(HE_B64_ENCODED)).to.be.equal(HE_PLAINTEXT);
        });

        it('spanish', () => {
            expect(CryptoUtils.base64Encode(ES_PLAINTEXT)).to.be.equal(ES_B64_ENCODED);
            expect(CryptoUtils.base64Decode(ES_B64_ENCODED)).to.be.equal(ES_PLAINTEXT);
        });

        it('japanese', () => {
            expect(CryptoUtils.base64Encode(JA_PLAINTEXT)).to.be.equal(JA_B64_ENCODED);
            expect(CryptoUtils.base64Decode(JA_B64_ENCODED)).to.be.equal(JA_PLAINTEXT);
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

            expect(CryptoUtils.base64Decode(ID_TOKEN_STRING)).to.be.equal(JSON.stringify(ID_TOKEN));
        });
    });
});
