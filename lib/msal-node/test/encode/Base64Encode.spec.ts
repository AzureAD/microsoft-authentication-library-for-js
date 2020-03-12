import { Base64Encode } from './../../src/encode/Base64Encode';
import { Base64Decode } from './../../src/encode/Base64Decode';

describe('Base64Encode() tests', () => {
    describe('test Base64 encode decode', () => {
        test('english', () => {
            const EN_PLAINTEXT = 'msaljs';
            const EN_B64_ENCODED = 'bXNhbGpz';

            expect(Base64Encode.encode(EN_PLAINTEXT)).toBe(EN_B64_ENCODED);
            expect(Base64Decode.decode(EN_B64_ENCODED)).toBe(EN_PLAINTEXT);
        });

        test('Icelandic', () => {
            const ISL_PLAINTEXT = 'Björn Ironside';
            const ISL_B64_ENCODED = 'QmrDtnJuIElyb25zaWRl';

            expect(Base64Encode.encode(ISL_PLAINTEXT)).toBe(ISL_B64_ENCODED);
            expect(Base64Decode.decode(ISL_B64_ENCODED)).toBe(ISL_PLAINTEXT);
        });

        test('hebrew', () => {
            const HE_PLAINTEXT = 'בְּצַלְאֵל';
            const HE_B64_ENCODED = '15HWsNa816bWt9ec1rDXkNa115w=';

            expect(Base64Encode.encode(HE_PLAINTEXT)).toBe(HE_B64_ENCODED);
            expect(Base64Decode.decode(HE_B64_ENCODED)).toBe(HE_PLAINTEXT);
        });

        test('spanish', () => {
            const ES_PLAINTEXT = 'Avrán';
            const ES_B64_ENCODED = 'QXZyw6Fu';

            expect(Base64Encode.encode(ES_PLAINTEXT)).toBe(ES_B64_ENCODED);
            expect(Base64Decode.decode(ES_B64_ENCODED)).toBe(ES_PLAINTEXT);
        });

        test('japanese', () => {
            const JA_PLAINTEXT = '日本語憂鬱髙';
            const JA_B64_ENCODED = '5pel5pys6Kqe5oaC6ayx6auZ';

            expect(Base64Encode.encode(JA_PLAINTEXT)).toBe(JA_B64_ENCODED);
            expect(Base64Decode.decode(JA_B64_ENCODED)).toBe(JA_PLAINTEXT);
        });
    });
});
