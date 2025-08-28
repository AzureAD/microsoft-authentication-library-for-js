#!/usr/bin/env node

/**
 * MSAL Browser Log Decoder
 *
 * This script decodes hashed logging strings back to their original messages
 * using the log-strings-mapping.json file generated during the build process.
 * The output includes log levels with color coding for better readability.
 *
 * Usage:
 *   node scripts/decode-logs.js [millis1,hash1;millis2,hash2;etc]
 *   node scripts/decode-logs.js millis1,hash1;millis2,hash2;etc  (brackets optional)
 *   node scripts/decode-logs.js ["hash1", "hash2", "hash3"]  (legacy format)
 *   npm run decode-logs -- [millis1,hash1;millis2,hash2;etc]
 *   npm run decode-logs -- 'millis1,hash1;millis2,hash2;etc'  (brackets optional)
 *   echo '[0,hash1;5,hash2]' | node scripts/decode-logs.js
 *   node scripts/decode-logs.js --mappings path1.json,path2.json [0,hash1]
 *
 * Examples:
 *   node scripts/decode-logs.js [0,11757953;5,22757575;10,bfd4c713]
 *   node scripts/decode-logs.js 0,11757953;5,22757575;10,bfd4c713  (brackets optional)
 *   node scripts/decode-logs.js ["ac8ab727", "299ce8cb"]  (legacy format)
 *   npm run decode-logs -- [0,ac8ab727;2,299ce8cb]
 *   npm run decode-logs -- '0,ac8ab727;2,299ce8cb'  (brackets optional)
 *   node scripts/decode-logs.js --mappings ../lib1/mapping.json,../lib2/mapping.json [0,hash1]
 *
 * Features:
 *   - Color-coded output by log level (ERROR=red, WARN=yellow, INFO=blue, VERBOSE=green, TRACE=magenta)
 *   - Displays log method types with icons (❌ ERROR, ⚠️ WARN, ℹ️ INFO, 🔍 VERBOSE, 📍 TRACE)
 *   - Shows timing information (millis since first log) when available
 *   - Shows build metadata (timestamp, total strings)
 *   - Provides summary with breakdown by log level
 *   - Supports both new format [millis,hash;millis,hash] and legacy format [hash,hash]
 *   - Supports individual hashes and arrays
 *   - Supports multiple mapping files for combined decoding
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
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

// Log level color mapping
const logLevelColors = {
    error: colors.red,
    errorPii: colors.red,
    warning: colors.yellow,
    info: colors.blue,
    infoPii: colors.blue,
    verbose: colors.green,
    verbosePii: colors.green,
    trace: colors.magenta,
    tracePii: colors.magenta,
    unknown: colors.gray
};

// Log level display names with icons (padded for alignment)
const logLevelDisplay = {
    error: '❌ ERROR    ',
    errorPii: '❌ ERROR-PII',
    warning: '⚠️  WARN     ',
    info: 'ℹ️  INFO     ',
    infoPii: 'ℹ️  INFO-PII ',
    verbose: '🔍 VERBOSE  ',
    verbosePii: '🔍 VERBOSE-PII',
    trace: '📍 TRACE    ',
    tracePii: '📍 TRACE-PII',
    unknown: '❓ UNKNOWN  '
};

/**
 * Loads a single mapping file and normalizes its format
 * @param {string} mappingPath - Path to the mapping file
 * @returns {Object} The normalized mappings and metadata
 */
function loadSingleMapping(mappingPath) {
    if (!fs.existsSync(mappingPath)) {
        console.error(`${colors.red}Error: Log strings mapping file not found at ${mappingPath}${colors.reset}`);
        return null;
    }

    try {
        const mappingContent = fs.readFileSync(mappingPath, 'utf8');
        const mappingData = JSON.parse(mappingContent);

        // Support both old (string) and new (object) mapping formats
        const mappings = mappingData.mappings || {};
        const normalizedMappings = {};

        for (const [hash, value] of Object.entries(mappings)) {
            if (typeof value === 'string') {
                // Old format: hash -> message string
                normalizedMappings[hash] = {
                    message: value,
                    method: 'unknown'
                };
            } else if (value && typeof value === 'object' && value.message) {
                // New format: hash -> {message, method} or {message, level}
                normalizedMappings[hash] = {
                    message: value.message,
                    method: value.level || 'unknown'
                };
            }
        }

        return {
            mappings: normalizedMappings,
            metadata: {
                timestamp: mappingData.timestamp,
                totalStrings: mappingData.totalStrings,
                filePath: mappingPath
            }
        };
    } catch (error) {
        console.error(`${colors.red}Error reading mapping file ${mappingPath}: ${error.message}${colors.reset}`);
        return null;
    }
}

/**
 * Loads the log strings mapping from the generated JSON file(s)
 * @param {string[]} mappingPaths - Array of paths to mapping files
 * @returns {Object} The combined mappings object
 */
function loadLogMapping(mappingPaths = null) {
    // Default to the standard mapping file if no paths provided
    if (!mappingPaths || mappingPaths.length === 0) {
        const defaultPath = path.join(__dirname, '../lib/log-strings-mapping.json');
        mappingPaths = [defaultPath];
    }

    const combinedMappings = {};
    const metadataList = [];
    let totalLoadedStrings = 0;

    for (const mappingPath of mappingPaths) {
        const result = loadSingleMapping(mappingPath);
        if (result) {
            // Merge mappings, with later files overriding earlier ones for duplicate hashes
            Object.assign(combinedMappings, result.mappings);
            metadataList.push(result.metadata);
            totalLoadedStrings += Object.keys(result.mappings).length;
        }
    }

    if (Object.keys(combinedMappings).length === 0) {
        console.error(`${colors.red}Error: No valid mapping files found${colors.reset}`);
        console.error(`${colors.yellow}Please run 'npm run build' first to generate the mapping file(s).${colors.reset}`);
        process.exit(1);
    }

    return {
        mappings: combinedMappings,
        metadata: {
            sources: metadataList,
            totalCombinedStrings: Object.keys(combinedMappings).length,
            totalLoadedStrings: totalLoadedStrings
        }
    };
}

/**
 * Parses command line arguments to extract mapping paths and hashes
 * @returns {Object} Object containing mappingPaths array and remaining args
 */
function parseArguments() {
    const args = process.argv.slice(2);
    let mappingPaths = null;
    let remainingArgs = args;

    // Look for --mappings flag
    const mappingsIndex = args.findIndex(arg => arg === '--mappings' || arg === '-m');
    if (mappingsIndex !== -1 && mappingsIndex + 1 < args.length) {
        const mappingsArg = args[mappingsIndex + 1];
        mappingPaths = mappingsArg.split(',').map(path => path.trim());

        // Remove the --mappings flag and its value from remaining args
        remainingArgs = [
            ...args.slice(0, mappingsIndex),
            ...args.slice(mappingsIndex + 2)
        ];
    }

    return { mappingPaths, remainingArgs };
}

/**
 * Parses input arguments or stdin to get the array of log entries (hashes with optional timing)
 * @param {string[]} args - Command line arguments (excluding mapping paths)
 * @returns {Promise<Array>} Array of log entry objects with hash and optional millis
 */
async function parseInput(args = null) {
    let input = '';

    // Use provided args or get from command line
    const inputArgs = args || process.argv.slice(2);

    // Check if we have command line arguments
    if (inputArgs.length > 0) {

        // Handle different input formats:

        // 1. Multiple separate arguments: hash1 hash2 hash3 (legacy format)
        if (inputArgs.length > 1 && !inputArgs[0].startsWith('[')) {
            return inputArgs.map(arg => ({
                hash: arg.replace(/^["']|["']$/g, ''),
                millis: null
            }));
        }

        // 2. Single argument that might be an array or single hash
        if (inputArgs.length === 1) {
            const arg = inputArgs[0];

            // If it looks like a JSON array (starts with [)
            if (arg.startsWith('[')) {
                return parseLogArray(arg);
            }

            // Check if it contains semicolons - indicates new format without brackets
            if (arg.includes(';')) {
                return parseLogArray(arg);
            }

            // Single hash without quotes (legacy format)
            return [{
                hash: arg.replace(/^["']|["']$/g, ''),
                millis: null
            }];
        }

        // 3. Multiple arguments that might be a broken JSON array
        input = inputArgs.join(' ');

        // Try to fix common npm argument parsing issues where array gets split
        if (inputArgs.some(arg => arg.includes('[') || arg.includes(']'))) {
            // Reconstruct the array from split arguments
            const fullInput = input.replace(/,/g, ', ');

            // If we have [ at start of first arg and ] at end of last arg
            if (inputArgs[0].startsWith('[') || inputArgs[inputArgs.length - 1].endsWith(']')) {
                // Try to parse as JSON array
                try {
                    return parseLogArray(fullInput);
                } catch (e) {
                    // If parsing fails, treat as separate arguments (legacy format)
                    return inputArgs.map(arg => ({
                        hash: arg.replace(/[\[\],"']/g, '').trim(),
                        millis: null
                    })).filter(entry => entry.hash);
                }
            }
        }

        return parseLogArray(input);
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
                    console.error(`${colors.yellow}Usage: node decode-logs.cjs [millis1,hash1;millis2,hash2;etc] or hash1 hash2 or echo '[0,hash1;5,hash2]' | node decode-logs.cjs${colors.reset}`);
                    process.exit(1);
                }
                resolve(parseLogArray(input));
            });

            process.stdin.on('error', reject);
        });
    }
}

/**
 * Parses a string representation of an array into log entries with timing info
 * Supports both new format [millis1,hash1,millis2,hash2] and legacy format [hash1,hash2]
 * @param {string} input - String representation of array
 * @returns {Array} Array of log entry objects with hash and optional millis
 */
function parseLogArray(input) {
    try {
        // Remove any extra whitespace
        input = input.trim();

        // If input doesn't start with [, check if it contains semicolons (new format without brackets)
        if (!input.startsWith('[')) {
            // Remove quotes if present
            input = input.replace(/^["']|["']$/g, '');

            // Check if it contains semicolons - indicates new format without brackets
            if (input.includes(';')) {
                // Parse as new format: millis1,hash1;millis2,hash2
                const pairs = input.split(';').map(pair => pair.trim());
                const elements = [];

                for (const pair of pairs) {
                    const pairElements = pair.split(',').map(item =>
                        item.trim().replace(/^["']|["']$/g, '')
                    ).filter(Boolean);
                    elements.push(...pairElements);
                }

                return parseArrayElements(elements);
            }

            // Single hash (legacy format)
            return [{
                hash: input,
                millis: null
            }];
        }

        // Handle various array formats:
        // New format: [millis1,hash1;millis2,hash2] or [0,hash1; 5,hash2]
        // Legacy format: [hash1,hash2,hash3] or [hash1, hash2, hash3] or ["hash1","hash2","hash3"]

        // First try to parse as valid JSON (handles quoted strings)
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                return parseArrayElements(parsed);
            }
        } catch (jsonError) {
            // If JSON parsing fails, try manual parsing
        }

        // Manual parsing for formats like [item1,item2,item3] without quotes
        if (input.startsWith('[') && input.endsWith(']')) {
            const content = input.slice(1, -1).trim();
            if (content) {
                // Check if it contains ";" delimiter (new format)
                if (content.includes(';')) {
                    // New format: split by ";" first, then each pair by ","
                    const pairs = content.split(';').map(pair => pair.trim());
                    const elements = [];

                    for (const pair of pairs) {
                        const pairElements = pair.split(',').map(item =>
                            item.trim().replace(/^["']|["']$/g, '')
                        ).filter(Boolean);
                        elements.push(...pairElements);
                    }

                    return parseArrayElements(elements);
                } else {
                    // Legacy format: split by comma only
                    const elements = content.split(',').map(item =>
                        item.trim().replace(/^["']|["']$/g, '')
                    ).filter(Boolean);

                    return parseArrayElements(elements);
                }
            }
        }

        throw new Error('Unable to parse input as array');
    } catch (error) {
        console.error(`${colors.red}Error parsing input: ${error.message}${colors.reset}`);
        console.error(`${colors.yellow}Input should be in one of these formats:${colors.reset}`);
        console.error(`${colors.dim}  - New format: [millis1,hash1;millis2,hash2;etc]${colors.reset}`);
        console.error(`${colors.dim}  - New format JSON: [0,"hash1",5,"hash2"]${colors.reset}`);
        console.error(`${colors.dim}  - Legacy JSON array: ["hash1", "hash2", "hash3"]${colors.reset}`);
        console.error(`${colors.dim}  - Legacy simple array: [hash1, hash2, hash3]${colors.reset}`);
        console.error(`${colors.dim}  - Space separated: hash1 hash2 hash3${colors.reset}`);
        console.error(`${colors.dim}  - Single hash: hash1${colors.reset}`);
        process.exit(1);
    }
}

/**
 * Parses array elements to determine if it's new format (millis,hash pairs) or legacy format (hashes only)
 * @param {Array} elements - Array of string/number elements
 * @returns {Array} Array of log entry objects
 */
function parseArrayElements(elements) {
    // Convert all elements to strings for consistency
    const stringElements = elements.map(el => String(el).trim());

    // If we have an even number of elements, check if it might be the new format
    if (stringElements.length % 2 === 0 && stringElements.length > 0) {
        // Check if every even index (0, 2, 4...) looks like a number (millis)
        // and every odd index (1, 3, 5...) looks like a hash
        let isNewFormat = true;
        const logEntries = [];

        for (let i = 0; i < stringElements.length; i += 2) {
            const millis = stringElements[i];
            const hash = stringElements[i + 1];

            // Check if first element looks like a number (millis)
            const millisNum = parseFloat(millis);
            const isValidMillis = !isNaN(millisNum) && isFinite(millisNum) && millisNum >= 0;

            // Check if millis element looks like a hash (alphanumeric, reasonable length)
            const isValidHash = hash &&
                               typeof hash === 'string' &&
                               hash.length >= 4 &&
                               hash.length <= 12 &&
                               /^[a-zA-Z0-9]+$/.test(hash);

            if (isValidMillis && isValidHash) {
                logEntries.push({
                    hash: hash,
                    millis: millisNum
                });
            } else {
                isNewFormat = false;
                break;
            }
        }

        // If all pairs look valid, use new format
        if (isNewFormat && logEntries.length > 0) {
            return logEntries;
        }
    }

    // Fall back to legacy format - all elements are hashes
    return stringElements.map(hash => ({
        hash: hash,
        millis: null
    }));
}

/**
 * Decodes an array of log entries to their original log messages
 * @param {Array} logEntries - Array of log entry objects with hash and optional millis
 * @param {Object} mappingData - Object containing mappings and metadata
 */
function decodeHashes(logEntries, mappingData) {
    const { mappings, metadata } = mappingData;

    console.log(`${colors.bright}${colors.blue}MSAL Browser Log Decoder${colors.reset}`);
    console.log(`${colors.dim}Decoding ${logEntries.length} log entries...${colors.reset}`);

    // Check if we have timing information
    const hasTimingInfo = logEntries.some(entry => entry.millis !== null);
    if (hasTimingInfo) {
        console.log(`${colors.dim}Format: New format with timing information${colors.reset}`);
    } else {
        console.log(`${colors.dim}Format: Legacy format (hashes only)${colors.reset}`);
    }

    // Display information about loaded mapping files
    if (metadata?.sources && metadata.sources.length > 0) {
        if (metadata.sources.length === 1) {
            const source = metadata.sources[0];
            if (source.timestamp) {
                const buildTime = new Date(source.timestamp).toLocaleString();
                console.log(`${colors.dim}Mapping from build: ${buildTime} (${source.totalStrings || 'unknown'} strings from ${path.basename(source.filePath)})${colors.reset}`);
            } else {
                console.log(`${colors.dim}Mapping from: ${path.basename(source.filePath)}${colors.reset}`);
            }
        } else {
            console.log(`${colors.dim}Combined mappings from ${metadata.sources.length} files:${colors.reset}`);
            metadata.sources.forEach(source => {
                const fileName = path.basename(source.filePath);
                const stringCount = source.totalStrings || 'unknown';
                if (source.timestamp) {
                    const buildTime = new Date(source.timestamp).toLocaleString();
                    console.log(`${colors.dim}  - ${fileName}: ${stringCount} strings (${buildTime})${colors.reset}`);
                } else {
                    console.log(`${colors.dim}  - ${fileName}: ${stringCount} strings${colors.reset}`);
                }
            });
            console.log(`${colors.dim}Total combined: ${metadata.totalCombinedStrings} unique strings${colors.reset}`);
        }
    }

    console.log(); // Empty line

    const results = [];
    const notFound = [];
    const levelCounts = {};

    logEntries.forEach((entry, index) => {
        const logEntry = mappings[entry.hash];

        if (logEntry) {
            const method = logEntry.method || 'unknown';
            levelCounts[method] = (levelCounts[method] || 0) + 1;

            results.push({
                index: index + 1,
                hash: entry.hash,
                millis: entry.millis,
                message: logEntry.message,
                method: method,
                found: true
            });
        } else {
            results.push({
                index: index + 1,
                hash: entry.hash,
                millis: entry.millis,
                message: null,
                method: null,
                found: false
            });
            notFound.push(entry.hash);
        }
    });

    // Output decoded messages with log levels, colors, and timing
    results.forEach(result => {
        const prefix = `${colors.dim}[${result.index}]${colors.reset}`;

        // Add timing information if available
        let timingInfo = '';
        if (result.millis !== null) {
            timingInfo = `${colors.cyan}+${result.millis}ms${colors.reset} `;
        }

        if (result.found) {
            const levelColor = logLevelColors[result.method] || logLevelColors.unknown;
            const levelName = logLevelDisplay[result.method] || logLevelDisplay.unknown;

            console.log(`${prefix} ${timingInfo}${levelColor}${levelName}${colors.reset}: ${levelColor}${result.message}${colors.reset}`);
        } else {
            console.log(`${prefix} ${timingInfo}${colors.red}Unknown hash: ${result.hash}${colors.reset}`);
        }
    });

    // Summary with level breakdown
    console.log(`\n${colors.bright}Summary:${colors.reset}`);
    console.log(`${colors.green}✓ Decoded: ${results.filter(r => r.found).length}${colors.reset}`);

    // Show breakdown by log level
    if (Object.keys(levelCounts).length > 0) {
        console.log(`${colors.dim}  Log levels:${colors.reset}`);
        Object.entries(levelCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([level, count]) => {
                const levelColor = logLevelColors[level] || logLevelColors.unknown;
                const levelName = logLevelDisplay[level] || logLevelDisplay.unknown;
                console.log(`${colors.dim}    ${levelColor}${levelName}${colors.reset}${colors.dim}: ${count}${colors.reset}`);
            });
    }

    if (notFound.length > 0) {
        console.log(`${colors.red}✗ Not found: ${notFound.length}${colors.reset}`);
        console.log(`${colors.yellow}Unknown hashes: ${notFound.join(', ')}${colors.reset}`);
        console.log(`${colors.dim}Note: Unknown hashes might be from a different build or version.${colors.reset}`);
    }

    // Show timing summary if available
    if (hasTimingInfo) {
        const timingResults = results.filter(r => r.found && r.millis !== null);
        if (timingResults.length > 0) {
            const minMillis = Math.min(...timingResults.map(r => r.millis));
            const maxMillis = Math.max(...timingResults.map(r => r.millis));
            console.log(`${colors.dim}Timing: ${minMillis}ms to ${maxMillis}ms (${maxMillis - minMillis}ms duration)${colors.reset}`);
        }
    }
}

/**
 * Displays usage information
 */
function showUsage() {
    console.log(`${colors.bright}MSAL Browser Log Decoder${colors.reset}`);
    console.log('Decodes hashed logging strings back to their original messages with color-coded log levels.\n');

    console.log(`${colors.bright}Features:${colors.reset}`);
    console.log(`  ${colors.red}❌ ERROR${colors.reset} / ${colors.yellow}⚠️  WARN${colors.reset} / ${colors.blue}ℹ️  INFO${colors.reset} / ${colors.green}🔍 VERBOSE${colors.reset} / ${colors.magenta}📍 TRACE${colors.reset}`);
    console.log(`  • Color-coded output by log level`);
    console.log(`  • Timing information display (${colors.cyan}+Nms${colors.reset} format)`);
    console.log(`  • Build metadata and log level breakdown`);
    console.log(`  • Supports PII variants (INFO-PII, VERBOSE-PII, etc.)`);
    console.log(`  • Multiple mapping files support for combined decoding`);
    console.log(`  • Supports both new format [millis,hash;millis,hash] and legacy [hash,hash]`);
    console.log(`  • Flexible input formats (arrays, space-separated, stdin)\n`);

    console.log(`${colors.bright}Usage:${colors.reset}`);
    console.log(`  ${colors.cyan}New format (with timing):${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs [millis1,hash1;millis2,hash2;etc]`);
    console.log(`  node scripts/decode-logs.cjs millis1,hash1;millis2,hash2;etc  ${colors.dim}(brackets optional)${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs [0,hash1;5,hash2;10,hash3]`);
    console.log(`  npm run decode-logs -- [0,hash1;2,hash2]`);
    console.log(`  npm run decode-logs -- 'millis1,hash1;millis2,hash2;etc'  ${colors.dim}(brackets optional)${colors.reset}`);
    console.log(`  echo '[0,hash1;5,hash2]' | node scripts/decode-logs.cjs`);
    console.log(`  node scripts/decode-logs.cjs --mappings path1.json,path2.json [0,hash1]`);
    console.log(`  `);
    console.log(`  ${colors.yellow}Legacy format (hashes only):${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs [hash1,hash2,hash3]`);
    console.log(`  node scripts/decode-logs.cjs hash1 hash2 hash3`);
    console.log(`  node scripts/decode-logs.cjs ["hash1", "hash2", "hash3"]`);
    console.log(`  npm run decode-logs -- [hash1,hash2,hash3]`);
    console.log(`  npm run decode-logs -- hash1 hash2 hash3\n`);

    console.log(`${colors.bright}Examples:${colors.reset}`);
    console.log(`  ${colors.cyan}New format:${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs [0,17y14q;5,1bd4p8;10,04rtdy]`);
    console.log(`  node scripts/decode-logs.cjs 0,17y14q;5,1bd4p8;10,04rtdy  ${colors.dim}(brackets optional)${colors.reset}`);
    console.log(`  npm run decode-logs -- [0,ac8ab727;2,299ce8cb]`);
    console.log(`  npm run decode-logs -- '0,ac8ab727;2,299ce8cb'  ${colors.dim}(brackets optional)${colors.reset}`);
    console.log(`  `);
    console.log(`  ${colors.yellow}Legacy format:${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs [17y14q,1bd4p8,04rtdy]`);
    console.log(`  node scripts/decode-logs.cjs 17y14q 1bd4p8 04rtdy`);
    console.log(`  npm run decode-logs -- [ac8ab727,299ce8cb]`);
    console.log(`  npm run decode-logs -- ac8ab727 299ce8cb\n`);

    console.log(`${colors.bright}Multiple mapping files:${colors.reset}`);
    console.log(`  Use --mappings or -m flag with comma-separated file paths:`);
    console.log(`  • Combines mappings from multiple sources into a single lookup`);
    console.log(`  • Later files override earlier ones for duplicate hashes`);
    console.log(`  • Supports relative and absolute paths`);
    console.log(`  node scripts/decode-logs.cjs --mappings mapping1.json,mapping2.json [0,hash1]`);
    console.log(`  npm run decode-logs -- --mappings ../lib1/mapping.json,../lib2/mapping.json [0,hash1;5,hash2]\n`);

    console.log(`${colors.bright}Single hash:${colors.reset}`);
    console.log(`  node scripts/decode-logs.cjs 17y14q`);
    console.log(`  npm run decode-logs -- 1bd4p8`);
    console.log(`  `);
    console.log(`${colors.bright}Output format:${colors.reset}`);
    console.log(`  ${colors.dim}[1]${colors.reset} ${colors.cyan}+0ms${colors.reset} ${colors.blue}ℹ️  INFO     ${colors.reset}: ${colors.blue}Starting authentication flow${colors.reset}`);
    console.log(`  ${colors.dim}[2]${colors.reset} ${colors.cyan}+5ms${colors.reset} ${colors.red}❌ ERROR    ${colors.reset}: ${colors.red}Authentication failed${colors.reset}`);
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
        // Parse command line arguments to extract mapping paths and hash arguments
        const { mappingPaths, remainingArgs } = parseArguments();

        // Load mappings from specified files or default
        const mappingData = loadLogMapping(mappingPaths);

        // Parse hash input from remaining arguments or stdin
        const logEntries = await parseInput(remainingArgs);

        if (logEntries.length === 0) {
            console.error(`${colors.red}Error: No log entries provided${colors.reset}`);
            showUsage();
            process.exit(1);
        }

        decodeHashes(logEntries, mappingData);
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
    loadSingleMapping,
    parseArguments,
    parseLogArray,
    parseArrayElements,
    decodeHashes,
    colors,
    logLevelColors,
    logLevelDisplay
};
