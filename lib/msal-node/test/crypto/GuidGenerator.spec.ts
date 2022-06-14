import { GuidGenerator } from './../../src/crypto/GuidGenerator';

describe('GuidGenerator', () => {
    // tests correctness of isGuid()
    test('Regular text', () => {
        expect(new GuidGenerator().isGuid('Hello')).toBe(false);
    });

    // tests correctness of isGuid()
    test('GUID', () => {
        expect(
            new GuidGenerator().isGuid('a3cd2952-64dd-43b4-9720-f48c093394a3')
        ).toBe(true);
    });

    // tests 'uuid' return type
    test('test UUID return type', () => {
        const uuid = new GuidGenerator().generateGuid();
        expect(typeof uuid).toBe('string');
    });

    // tests correctness of generateGuid()
    test('test UUID generation', () => {
        const generator = new GuidGenerator();
        const uuid = generator.generateGuid();
        expect(generator.isGuid(uuid)).toBe(true);
    });
});
