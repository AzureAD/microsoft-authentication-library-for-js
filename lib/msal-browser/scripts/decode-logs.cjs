#!/usr/bin/env node

/**
 * MSAL Browser Log Decoder
 * 
 * This script decodes hashed logging strings back to their original messages
 * using the log-strings-mapping.json file generated during the build process.
 * 
 * Usage:
 *   node scripts/decode-logs.js ["hash1", "hash2", "hash3"]
 *   npm run decode-logs -- ["hash1", "hash2", "hash3"]
 *   echo '["hash1", "hash2"]' | node scripts/decode-logs.js
 * 
 * Examples:
 *   node scripts/decode-logs.js ["11757953", "22757575", "bfd4c713"]
 *   npm run decode-logs -- ["ac8ab727", "299ce8cb"]
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

/**
 * Loads the log strings mapping from the generated JSON file
 * @returns {Object} The mappings object
 */
function loadLogMapping() {
    const mappingPath = path.join(__dirname, '../lib/log-strings-mapping.json');
    
    if (!fs.existsSync(mappingPath)) {
        console.error(`${colors.red}Error: Log strings mapping file not found at ${mappingPath}${colors.reset}`);
        console.error(`${colors.yellow}Please run 'npm run build' first to generate the mapping file.${colors.reset}`);
        process.exit(1);
    }
    
    try {
        const mappingContent = fs.readFileSync(mappingPath, 'utf8');
        const mappingData = JSON.parse(mappingContent);
        return mappingData.mappings || {};
    } catch (error) {
        console.error(`${colors.red}Error reading mapping file: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

/**
 * Parses input arguments or stdin to get the array of hashes
 * @returns {Promise<string[]>} Array of hash strings
 */
async function parseInput() {
    let input = '';
    
    // Check if we have command line arguments
    if (process.argv.length > 2) {
        const args = process.argv.slice(2);
        
        // Handle different input formats:
        
        // 1. Multiple separate arguments: hash1 hash2 hash3
        if (args.length > 1 && !args[0].startsWith('[')) {
            return args.map(arg => arg.replace(/^["']|["']$/g, ''));
        }
        
        // 2. Single argument that might be an array or single hash
        if (args.length === 1) {
            const arg = args[0];
            
            // If it looks like a JSON array (starts with [)
            if (arg.startsWith('[')) {
                return parseHashArray(arg);
            }
            
            // Single hash without quotes
            return [arg.replace(/^["']|["']$/g, '')];
        }
        
        // 3. Multiple arguments that might be a broken JSON array
        input = args.join(' ');
        
        // Try to fix common npm argument parsing issues where array gets split
        if (args.some(arg => arg.includes('[') || arg.includes(']'))) {
            // Reconstruct the array from split arguments
            const fullInput = input.replace(/,/g, ', ');
            
            // If we have [ at start of first arg and ] at end of last arg
            if (args[0].startsWith('[') || args[args.length - 1].endsWith(']')) {
                // Try to parse as JSON array
                try {
                    return parseHashArray(fullInput);
                } catch (e) {
                    // If parsing fails, treat as separate arguments
                    return args.map(arg => arg.replace(/[\[\],"']/g, '').trim()).filter(Boolean);
                }
            }
        }
        
        return parseHashArray(input);
    } else {
        // Read from stdin
        return new Promise((resolve, reject) => {
            const chunks = [];
            
            process.stdin.on('data', chunk => {
                chunks.push(chunk);
            });
            
            process.stdin.on('end', () => {
                const input = Buffer.concat(chunks).toString().trim();
                if (!input) {
                    console.error(`${colors.red}Error: No input provided${colors.reset}`);
                    console.error(`${colors.yellow}Usage: node decode-logs.cjs [hash1,hash2] or hash1 hash2 or echo '[hash1,hash2]' | node decode-logs.cjs${colors.reset}`);
                    process.exit(1);
                }
                resolve(parseHashArray(input));
            });
            
            process.stdin.on('error', reject);
        });
    }
}

/**
 * Parses a string representation of an array into actual array
 * @param {string} input - String representation of array
 * @returns {string[]} Array of hash strings
 */
function parseHashArray(input) {
    try {
        // Remove any extra whitespace
        input = input.trim();
        
        // If input doesn't start with [, assume it's a single hash
        if (!input.startsWith('[')) {
            // Remove quotes if present
            input = input.replace(/^["']|["']$/g, '');
            return [input];
        }
        
        // Handle various array formats:
        // [hash1,hash2,hash3] or [hash1, hash2, hash3] or ["hash1","hash2","hash3"]
        
        // First try to parse as valid JSON
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                return parsed.map(hash => String(hash).trim());
            }
        } catch (jsonError) {
            // If JSON parsing fails, try manual parsing
        }
        
        // Manual parsing for formats like [hash1,hash2,hash3] without quotes
        if (input.startsWith('[') && input.endsWith(']')) {
            const content = input.slice(1, -1).trim();
            if (content) {
                // Split by comma and clean up each hash
                return content.split(',').map(hash => 
                    hash.trim().replace(/^["']|["']$/g, '')
                ).filter(Boolean);
            }
        }
        
        throw new Error('Unable to parse input as array');
    } catch (error) {
        console.error(`${colors.red}Error parsing input: ${error.message}${colors.reset}`);
        console.error(`${colors.yellow}Input should be in one of these formats:${colors.reset}`);
        console.error(`${colors.dim}  - JSON array: ["hash1", "hash2", "hash3"]${colors.reset}`);
        console.error(`${colors.dim}  - Simple array: [hash1, hash2, hash3]${colors.reset}`);
        console.error(`${colors.dim}  - Space separated: hash1 hash2 hash3${colors.reset}`);
        console.error(`${colors.dim}  - Single hash: hash1${colors.reset}`);
        process.exit(1);
    }
}

/**
 * Decodes an array of hashes to their original log messages
 * @param {string[]} hashes - Array of hash strings
 * @param {Object} mappings - Hash to string mappings
 */
function decodeHashes(hashes, mappings) {
    console.log(`${colors.bright}${colors.blue}MSAL Browser Log Decoder${colors.reset}`);
    console.log(`${colors.dim}Decoding ${hashes.length} log entries...${colors.reset}\n`);
    
    const results = [];
    const notFound = [];
    
    hashes.forEach((hash, index) => {
        const originalMessage = mappings[hash];
        
        if (originalMessage) {
            results.push({
                index: index + 1,
                hash,
                message: originalMessage,
                found: true
            });
        } else {
            results.push({
                index: index + 1,
                hash,
                message: null,
                found: false
            });
            notFound.push(hash);
        }
    });
    
    // Output decoded messages
    results.forEach(result => {
        const prefix = `${colors.dim}[${result.index}]${colors.reset}`;
        
        if (result.found) {
            console.log(`${prefix} ${colors.green}${result.message}${colors.reset}`);
        } else {
            console.log(`${prefix} ${colors.red}Unknown hash: ${result.hash}${colors.reset}`);
        }
    });
    
    // Summary
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`${colors.green}✓ Decoded: ${results.filter(r => r.found).length}${colors.reset}`);
    
    if (notFound.length > 0) {
        console.log(`${colors.red}✗ Not found: ${notFound.length}${colors.reset}`);
        console.log(`${colors.yellow}Unknown hashes: ${notFound.join(', ')}${colors.reset}`);
        console.log(`${colors.dim}Note: Unknown hashes might be from a different build or version.${colors.reset}`);
    }
}

/**
 * Displays usage information
 */
function showUsage() {
    console.log(`${colors.bright}MSAL Browser Log Decoder${colors.reset}`);
    console.log('Decodes hashed logging strings back to their original messages.\n');
    
    console.log(`${colors.bright}Usage:${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs [hash1,hash2,hash3]`);
    console.log(`  node scripts/decode-logs.cjs hash1 hash2 hash3`);
    console.log(`  node scripts/decode-logs.cjs ["hash1", "hash2", "hash3"]`);
    console.log(`  npm run decode-logs -- [hash1,hash2,hash3]`);
    console.log(`  npm run decode-logs -- hash1 hash2 hash3`);
    console.log(`  echo '[hash1,hash2]' | node scripts/decode-logs.cjs\n`);
    
    console.log(`${colors.bright}Examples:${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs [11757953,22757575,bfd4c713]`);
    console.log(`  node scripts/decode-logs.cjs 11757953 22757575 bfd4c713`);
    console.log(`  npm run decode-logs -- [ac8ab727,299ce8cb]`);
    console.log(`  npm run decode-logs -- ac8ab727 299ce8cb`);
    console.log(`  echo '[11757953,bfd4c713]' | npm run decode-logs\n`);
    
    console.log(`${colors.bright}Single hash:${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs 11757953`);
    console.log(`  npm run decode-logs -- bfd4c713`);
}

/**
 * Main function
 */
async function main() {
    // Check for help flag
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        showUsage();
        return;
    }
    
    try {
        const mappings = loadLogMapping();
        const hashes = await parseInput();
        
        if (hashes.length === 0) {
            console.error(`${colors.red}Error: No hashes provided${colors.reset}`);
            showUsage();
            process.exit(1);
        }
        
        decodeHashes(hashes, mappings);
    } catch (error) {
        console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    loadLogMapping,
    parseHashArray,
    decodeHashes
};
