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
            const ID_TOKEN_STRING = "eyJhdWQiOiI3MzE1YmE0MS1lZDYwLTQwYjUtOTY3Zi1hOTBlNTUzZmM3MTgiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY2QxOWNlNjQtMDI4Mi00YTJkLTgxMjktNDdhYTBiMjdmYjdiL3YyLjAiLCJpYXQiOjE1NzA0ODM3NTIsIm5iZiI6MTU3MDQ4Mzc1MiwiZXhwIjoxNTcwNDg3NjUyLCJhaW8iOiJBVFFBeS84TkFBQUFEYW0weDZWdTQ3TU9FTGU0TGlJVDNzWFFULzNNcmFFbGFDS0t2dUt4a0NNSjl4ckt0ekxOaG5jNVlCZllpSVI0IiwibmFtZSI6Iua-geeUsCDlj6Hnn6UiLCJub25jZSI6IjcwNmFiM2QwLThmYmItNGVkYS1hYmU5LTc1Y2JmNzc2NmM3NiIsIm9pZCI6IjhjYzEwZjM5LTE4MTYtNDJiNS05M2ZmLWUwZjkyZGU2ZTIxOCIsInByZWZlcnJlZF91c2VybmFtZSI6ImpwLXRlc3RAamFudXR0ZXJ0ZXN0Lm9ubWljcm9zb2Z0LmNvbSIsInN1YiI6IkdkWkE4R255UEE4RmRvM3ZINDMwdTNYVHJzaFIzeHZNZ29KeVFDOUcwS0kiLCJ0aWQiOiJjZDE5Y2U2NC0wMjgyLTRhMmQtODEyOS00N2FhMGIyN2ZiN2IiLCJ1dGkiOiJMcnpsU2wzX0hFYUFWd2l3aDM5WUFBIiwidmVyIjoiMi4wIn0";

            const ID_TOKEN = {
                "aud": "7315ba41-ed60-40b5-967f-a90e553fc718",
                "iss": "https://login.microsoftonline.com/cd19ce64-0282-4a2d-8129-47aa0b27fb7b/v2.0",
                "iat": 1570483752,
                "nbf": 1570483752,
                "exp": 1570487652,
                "aio": "ATQAy/8NAAAADam0x6Vu47MOELe4LiIT3sXQT/3MraElaCKKvuKxkCMJ9xrKtzLNhnc5YBfYiIR4",
                "name": "澁田 叡知",
                "nonce": "706ab3d0-8fbb-4eda-abe9-75cbf7766c76",
                "oid": "8cc10f39-1816-42b5-93ff-e0f92de6e218",
                "preferred_username": "jp-test@januttertest.onmicrosoft.com",
                "sub": "GdZA8GnyPA8Fdo3vH430u3XTrshR3xvMgoJyQC9G0KI",
                "tid": "cd19ce64-0282-4a2d-8129-47aa0b27fb7b",
                "uti": "LrzlSl3_HEaAVwiwh39YAA",
                "ver": "2.0"
            };

            expect(CryptoUtils.base64Decode(ID_TOKEN_STRING)).to.be.equal(JSON.stringify(ID_TOKEN));
        });
    });
});
