import { EncodingUtils } from '../../src/utils/EncodingUtils';

describe('Base64Decode() tests', () => {
    describe('test Base64 encode decode', () => {
        test('english', () => {
            const EN_PLAINTEXT = 'msaljs';
            const EN_B64_ENCODED = 'bXNhbGpz';

            expect(EncodingUtils.base64Encode(EN_PLAINTEXT)).toBe(
                EN_B64_ENCODED
            );
            expect(EncodingUtils.base64Decode(EN_B64_ENCODED)).toBe(
                EN_PLAINTEXT
            );
        });

        test('Icelandic', () => {
            const ISL_PLAINTEXT = 'Björn Ironside';
            const ISL_B64_ENCODED = 'QmrDtnJuIElyb25zaWRl';

            expect(EncodingUtils.base64Encode(ISL_PLAINTEXT)).toBe(
                ISL_B64_ENCODED
            );
            expect(EncodingUtils.base64Decode(ISL_B64_ENCODED)).toBe(
                ISL_PLAINTEXT
            );
        });

        test('hebrew', () => {
            const HE_PLAINTEXT = 'בְּצַלְאֵל';
            const HE_B64_ENCODED = '15HWsNa816bWt9ec1rDXkNa115w=';

            expect(EncodingUtils.base64Encode(HE_PLAINTEXT)).toBe(
                HE_B64_ENCODED
            );
            expect(EncodingUtils.base64Decode(HE_B64_ENCODED)).toBe(
                HE_PLAINTEXT
            );
        });

        test('spanish', () => {
            const ES_PLAINTEXT = 'Avrán';
            const ES_B64_ENCODED = 'QXZyw6Fu';

            expect(EncodingUtils.base64Encode(ES_PLAINTEXT)).toBe(
                ES_B64_ENCODED
            );
            expect(EncodingUtils.base64Decode(ES_B64_ENCODED)).toBe(
                ES_PLAINTEXT
            );
        });

        test('japanese', () => {
            const JA_PLAINTEXT = '日本語憂鬱髙';
            const JA_B64_ENCODED = '5pel5pys6Kqe5oaC6ayx6auZ';

            expect(EncodingUtils.base64Encode(JA_PLAINTEXT)).toBe(
                JA_B64_ENCODED
            );
            expect(EncodingUtils.base64Decode(JA_B64_ENCODED)).toBe(
                JA_PLAINTEXT
            );
        });
    });

    // tests a sample idToken to be decoded correctly
    test('id token', () => {
        const ID_TOKEN_STRING =
            'eyJhdWQiOiI3MzE1YmE0MS1lZDYwLTQwYjUtOTY3Zi1hOTBlNTUzZmM3MTgiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vY2QxOWNlNjQtMDI4Mi00YTJkLTgxMjktNDdhYTBiMjdmYjdiL3YyLjAiLCJpYXQiOjE1NzEyNzUzNDIsIm5iZiI6MTU3MTI3NTM0MiwiZXhwIjoxNTcxMjc5MjQyLCJhaW8iOiJBVFFBeS84TkFBQUFYck5scUhmVWY4blNTcUR2Nis5OGlEZU1tZmZuOVNieHhDbTNQNXI1ZkpHSDBJenA4ZmNHNVdzL1V6bE1RL3F2IiwibmFtZSI6Iui-u_OghIAg5aSq6YOOIiwibm9uY2UiOiI0YjIyMDAxNi1mZThkLTRiMWEtYjQ0MS0wNTJjY2ZjZjg1YTgiLCJvaWQiOiI3YTg4NjEwOS1kNmQzLTRlNjMtYTA5MS05YWMyOGE0NjA0Y2YiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqcC10ZXN0QGphbnV0dGVydGVzdC5vbm1pY3Jvc29mdC5jb20iLCJzdWIiOiJ3VGJ1WkZxY0IyN3UtOXFhMVktbFVrS2EzQVR1TjllZGdsRDhmSFZLUEs4IiwidGlkIjoiY2QxOWNlNjQtMDI4Mi00YTJkLTgxMjktNDdhYTBiMjdmYjdiIiwidXRpIjoiak5kXy1zMHEyMC0xdzE5NGVfWUtBQSIsInZlciI6IjIuMCJ9';

        const ID_TOKEN = {
            aud: '7315ba41-ed60-40b5-967f-a90e553fc718',
            iss:
                'https://login.microsoftonline.com/cd19ce64-0282-4a2d-8129-47aa0b27fb7b/v2.0',
            iat: 1571275342,
            nbf: 1571275342,
            exp: 1571279242,
            aio:
                'ATQAy/8NAAAAXrNlqHfUf8nSSqDv6+98iDeMmffn9SbxxCm3P5r5fJGH0Izp8fcG5Ws/UzlMQ/qv',
            name: '辻󠄀 太郎',
            nonce: '4b220016-fe8d-4b1a-b441-052ccfcf85a8',
            oid: '7a886109-d6d3-4e63-a091-9ac28a4604cf',
            preferred_username: 'jp-test@januttertest.onmicrosoft.com',
            sub: 'wTbuZFqcB27u-9qa1Y-lUkKa3ATuN9edglD8fHVKPK8',
            tid: 'cd19ce64-0282-4a2d-8129-47aa0b27fb7b',
            uti: 'jNd_-s0q20-1w194e_YKAA',
            ver: '2.0',
        };

        expect(EncodingUtils.base64Decode(ID_TOKEN_STRING)).toBe(
            JSON.stringify(ID_TOKEN)
        );
    });

    // tests decodeUrl
    test('Base64DecodeUrl()', () => {
        const url =
            'https://www.google.com/search?client=firefox-b-1-d&ei=I6lqXoDcCsu60PEPlvKZyAQ&q=url+with+query+parameters&oq=url+with+query+params+&gs_l=psy-ab.3.1.0i22i30l10.9625.13641..15121...1.2..0.134.962.14j1......0....1..gws-wiz.......0i71j0j0i67j0i22i10i30.028jqS94ztI';
        const encodedUrl = EncodingUtils.base64EncodeUrl(url);
        expect(EncodingUtils.base64DecodeUrl(encodedUrl)).toBe(url);
    });
});
