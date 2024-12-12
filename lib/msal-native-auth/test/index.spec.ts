import { say } from '../src/index.js';

describe('say function', () => {
    it('should return "Hello"', () => {
        expect(say()).toBe('Hello');
    });
});
