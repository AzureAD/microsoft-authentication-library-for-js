const { loadLogMapping, parseHashArray, decodeHashes } = require('./decode-logs.cjs');

/**
 * Simple test suite for the decode-logs script
 */
function runTests() {
    console.log('Running decode-logs tests...\n');
    
    // Test 1: parseHashArray with JSON array
    try {
        const result1 = parseHashArray('["hash1", "hash2", "hash3"]');
        console.assert(JSON.stringify(result1) === JSON.stringify(["hash1", "hash2", "hash3"]), 'Test 1 failed');
        console.log('✓ Test 1 passed: JSON array parsing');
    } catch (e) {
        console.log('✗ Test 1 failed:', e.message);
    }
    
    // Test 2: parseHashArray with single hash
    try {
        const result2 = parseHashArray('"single-hash"');
        console.assert(JSON.stringify(result2) === JSON.stringify(["single-hash"]), 'Test 2 failed');
        console.log('✓ Test 2 passed: Single hash parsing');
    } catch (e) {
        console.log('✗ Test 2 failed:', e.message);
    }
    
    // Test 3: loadLogMapping
    try {
        const mappings = loadLogMapping();
        console.assert(typeof mappings === 'object', 'Test 3 failed: mappings should be object');
        console.assert(Object.keys(mappings).length > 0, 'Test 3 failed: mappings should not be empty');
        console.log('✓ Test 3 passed: Log mapping loading');
    } catch (e) {
        console.log('✗ Test 3 failed:', e.message);
    }
    
    // Test 4: Decode known hash (if mapping exists)
    try {
        const mappings = loadLogMapping();
        const knownHashes = Object.keys(mappings);
        if (knownHashes.length > 0) {
            const testHash = knownHashes[0];
            const expectedMessage = mappings[testHash];
            
            // Mock console.log to capture output
            const originalLog = console.log;
            let capturedOutput = '';
            console.log = (...args) => {
                capturedOutput += args.join(' ') + '\n';
            };
            
            decodeHashes([testHash], mappings);
            console.log = originalLog;
            
            console.assert(capturedOutput.includes(expectedMessage), 'Test 4 failed: decoded message not found');
            console.log('✓ Test 4 passed: Hash decoding');
        } else {
            console.log('⚠ Test 4 skipped: No mappings available');
        }
    } catch (e) {
        console.log('✗ Test 4 failed:', e.message);
    }
    
    console.log('\nAll tests completed!');
}

// Run tests if called directly
if (require.main === module) {
    runTests();
}
