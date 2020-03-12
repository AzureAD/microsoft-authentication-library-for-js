import { Base64Decode } from './../../src/encode/Base64Decode';
import { Base64Encode } from './../../src/encode/Base64Encode';

describe('Base64Decode() tests', () => {
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

        expect(Base64Decode.decode(ID_TOKEN_STRING)).toBe(
            JSON.stringify(ID_TOKEN)
        );
    });

    // tests decodeUrl
    test('Base64DecodeUrl()', () => {
        const url =
            'https://www.google.com/search?client=firefox-b-1-d&ei=I6lqXoDcCsu60PEPlvKZyAQ&q=url+with+query+parameters&oq=url+with+query+params+&gs_l=psy-ab.3.1.0i22i30l10.9625.13641..15121...1.2..0.134.962.14j1......0....1..gws-wiz.......0i71j0j0i67j0i22i10i30.028jqS94ztI';
        const encodedUrl = Base64Encode.encodeUrl(url);
        expect(Base64Decode.decodeUrl(encodedUrl)).toBe(url);
    });
});
