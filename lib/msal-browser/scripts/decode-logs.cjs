#!/usr/bin/env node

/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * MSAL Browser Log Decoder
 *
 * This script decodes hashed logging strings from browser console logs back to their original messages.
 * It processes log files where each MSAL log entry is on a separate line with module@version information.
 *
 * Log Format:
 *   [timestamp] : [correlation-id] : @azure/[module]@[version] : [LogLevel] - [hash]
 *
 * Usage:
 *   node scripts/decode-logs.cjs <path-to-log-file>
 *   node scripts/decode-logs.cjs --verbose <path-to-log-file>
 *   npm run decode-logs -- <path-to-log-file>
 *   npm run decode-logs -- --verbose /path/to/console.log
 *
 * Examples:
 *   node scripts/decode-logs.cjs ./console-logs.txt
 *   node scripts/decode-logs.cjs --verbose /Users/user/Downloads/browser-console.log
 *   npm run decode-logs -- ./logs/debug.log
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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
    errorpii: colors.red,
    warning: colors.yellow,
    info: colors.blue,
    infopii: colors.blue,
    verbose: colors.green,
    verbosepii: colors.green,
    trace: colors.magenta,
    tracepii: colors.magenta,
    unknown: colors.gray
};

// Global verbose mode flag
let isVerbose = false;

/**
 * Helper function to log messages only in verbose mode
 */
function verboseLog(message) {
    if (isVerbose) {
        console.log(message);
    }
}

/**
 * Downloads a file from a URL
 */
function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;

        const request = client.get(url, {
            headers: {
                'User-Agent': 'msal-browser-log-decoder/2.0'
            }
        }, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                if (response.headers.location) {
                    downloadFile(response.headers.location)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error('Redirect without location header'));
                }
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }

            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
        });

        request.on('error', (error) => {
            reject(error);
        });

        request.setTimeout(3000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Gets the cache directory path (relative to script location)
 */
function getCacheDir() {
    const scriptDir = __dirname;
    const cacheDir = path.join(scriptDir, '..', 'temp', 'log-mappings');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }
    return cacheDir;
}

/**
 * Gets cached mapping file path
 */
function getCachedMappingPath(libraryName, version) {
    const sanitizedName = libraryName.replace(/[@\/]/g, '-');
    const sanitizedVersion = version.replace(/[^a-zA-Z0-9.-]/g, '-');
    return path.join(getCacheDir(), `${sanitizedName}-${sanitizedVersion}-log-strings-mapping.json`);
}

/**
 * Checks if cached mapping is still valid (not older than 1 day)
 */
function isCacheValid(cachePath) {
    if (!fs.existsSync(cachePath)) {
        return false;
    }

    const stats = fs.statSync(cachePath);
    const oneDay = 24 * 60 * 60 * 1000;
    const age = Date.now() - stats.mtimeMs;

    return age < oneDay;
}

/**
 * Fetches remote mapping for a specific library version
 */
async function fetchRemoteMapping(libraryName, version, registryUrl = 'https://registry.npmjs.org') {
    verboseLog(`${colors.dim}Fetching mapping for ${libraryName}@${version} from ${registryUrl}${colors.reset}`);

    // Check cache first
    const cachePath = getCachedMappingPath(libraryName, version);
    if (isCacheValid(cachePath)) {
        verboseLog(`${colors.dim}Using cached mapping from ${cachePath}${colors.reset}`);
        const cachedContent = fs.readFileSync(cachePath, 'utf8');
        const cachedData = JSON.parse(cachedContent);

        // Normalize format - handle both "logStrings" and "mappings" formats
        if (cachedData.logStrings) {
            return cachedData;
        } else if (cachedData.mappings) {
            const normalized = { logStrings: {} };
            for (const [hash, data] of Object.entries(cachedData.mappings)) {
                normalized.logStrings[hash] = data.message || data;
            }
            return normalized;
        }

        return cachedData;
    }

    try {
        // Fetch package metadata from registry
        const packageUrl = `${registryUrl}/${libraryName}`;
        verboseLog(`${colors.dim}Fetching package metadata from ${packageUrl}${colors.reset}`);

        const metadata = await downloadFile(packageUrl);
        const packageData = JSON.parse(metadata);

        // Get the specific version or latest
        const versionData = version === 'latest'
            ? packageData.versions[packageData['dist-tags'].latest]
            : packageData.versions[version];

        if (!versionData) {
            throw new Error(`Version ${version} not found for ${libraryName}`);
        }

        // Get tarball info
        const tarballUrl = versionData.dist.tarball;

        // Extract version from tarball URL for unpkg
        const versionMatch = tarballUrl.match(/\/([\w-]+)-([\d\.]+)\.tgz$/);
        const actualVersion = versionMatch ? versionMatch[2] : version;

        // Use unpkg to get mapping files
        const mappingPaths = getMappingPaths(libraryName);
        const baseUnpkgUrl = `https://unpkg.com/${libraryName}@${actualVersion}`;

        const allMappings = { logStrings: {} };

        verboseLog(`${colors.dim}Trying to find mapping files in ${libraryName}@${actualVersion}...${colors.reset}`);

        for (const mappingPath of mappingPaths) {
            const unpkgUrl = `${baseUnpkgUrl}/${mappingPath}`;

            try {
                verboseLog(`${colors.dim}  Trying: ${unpkgUrl}${colors.reset}`);
                const content = await downloadFile(unpkgUrl);
                const mappingData = JSON.parse(content);

                // Handle both "logStrings" and "mappings" formats
                const logStrings = mappingData.logStrings || mappingData.mappings;

                if (logStrings) {
                    // Convert mappings format {hash: {message, level}} to logStrings format {hash: message}
                    if (mappingData.mappings) {
                        for (const [hash, data] of Object.entries(logStrings)) {
                            allMappings.logStrings[hash] = data.message || data;
                        }
                    } else {
                        Object.assign(allMappings.logStrings, logStrings);
                    }
                    verboseLog(`${colors.green}  ✓ Found mapping file: ${mappingPath}${colors.reset}`);
                }
            } catch (error) {
                verboseLog(`${colors.dim}  - Not found: ${mappingPath}${colors.reset}`);
            }
        }

        if (Object.keys(allMappings.logStrings).length > 0) {
            // Cache the combined mapping
            fs.writeFileSync(cachePath, JSON.stringify(allMappings, null, 2), 'utf8');
            verboseLog(`${colors.dim}Cached mapping to ${cachePath}${colors.reset}`);
            return allMappings;
        }

        throw new Error('No mapping files found in package');
    } catch (error) {
        verboseLog(`${colors.yellow}Failed to fetch remote mapping for ${libraryName}@${version}: ${error.message}${colors.reset}`);

        // Fallback to local mapping files
        verboseLog(`${colors.cyan}Attempting to load local mapping files...${colors.reset}`);
        const localMapping = loadLocalMapping(libraryName);

        if (localMapping) {
            verboseLog(`${colors.green}✓ Using local mapping as fallback (not cached for active development)${colors.reset}`);
            // Don't cache local mappings to allow active development and debugging
            return localMapping;
        }

        return null;
    }
}

/**
 * Gets possible mapping file paths for a library
 */
function getMappingPaths(libraryName) {
    if (libraryName === '@azure/msal-browser') {
        return [
            'dist/log-strings-mapping.json',
            'dist/custom-auth-path/log-strings-mapping.json'
        ];
    } else if (libraryName === '@azure/msal-common') {
        return [
            'dist-browser/log-strings-mapping.json'
        ];
    }

    return ['dist/log-strings-mapping.json'];
}

/**
 * Gets local mapping file paths for a library relative to script location
 */
function getLocalMappingPaths(libraryName) {
    const scriptDir = __dirname;
    const paths = [];

    if (libraryName === '@azure/msal-browser') {
        paths.push(
            path.join(scriptDir, '..', 'dist', 'log-strings-mapping.json'),
            path.join(scriptDir, '..', 'dist', 'custom-auth-path', 'log-strings-mapping.json')
        );
    } else if (libraryName === '@azure/msal-common') {
        paths.push(
            path.join(scriptDir, '..', '..', 'msal-common', 'dist-browser', 'log-strings-mapping.json')
        );
    }

    return paths;
}

/**
 * Loads local mapping file as fallback
 */
function loadLocalMapping(libraryName) {
    const localPaths = getLocalMappingPaths(libraryName);
    const allMappings = { logStrings: {} };

    for (const localPath of localPaths) {
        if (fs.existsSync(localPath)) {
            try {
                verboseLog(`${colors.dim}  Trying local: ${localPath}${colors.reset}`);
                const content = fs.readFileSync(localPath, 'utf8');
                const mappingData = JSON.parse(content);

                // Handle both "logStrings" and "mappings" formats
                const logStrings = mappingData.logStrings || mappingData.mappings;

                if (logStrings) {
                    if (mappingData.mappings) {
                        for (const [hash, data] of Object.entries(logStrings)) {
                            allMappings.logStrings[hash] = data.message || data;
                        }
                    } else {
                        Object.assign(allMappings.logStrings, logStrings);
                    }
                    verboseLog(`${colors.green}  ✓ Loaded local mapping: ${path.basename(localPath)}${colors.reset}`);
                }
            } catch (error) {
                verboseLog(`${colors.dim}  - Error reading local file: ${error.message}${colors.reset}`);
            }
        }
    }

    return Object.keys(allMappings.logStrings).length > 0 ? allMappings : null;
}

/**
 * Parses a single log line to extract MSAL module info and hash
 * Expected format: [timestamp] : [correlation-id] : @azure/[module]@[version] : [LogLevel] - [hash]
 * Returns null for non-MSAL lines
 */
function parseLogLine(line) {
    // Pattern: @azure/module-name@version : LogLevel - hash
    const pattern = /@azure\/(msal-(?:common|browser))\@([\d.]+)\s*:\s*(\w+)\s*-\s*([a-z0-9]{6})/i;
    const match = line.match(pattern);

    if (!match) {
        return null; // Not an MSAL log line or not a supported module
    }

    return {
        originalLine: line,
        moduleName: `@azure/${match[1]}`,
        version: match[2],
        logLevel: match[3].toLowerCase(),
        hash: match[4]
    };
}

/**
 * Reads log file and groups entries by module@version
 */
function parseLogFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Log file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const entries = [];
    const moduleVersions = new Set();

    for (const line of lines) {
        const parsed = parseLogLine(line);

        if (parsed) {
            const moduleVersion = `${parsed.moduleName}@${parsed.version}`;
            moduleVersions.add(moduleVersion);
            entries.push(parsed);
        } else if (line.trim()) {
            // Non-MSAL line, preserve as-is
            entries.push({
                originalLine: line,
                moduleName: null,
                version: null,
                logLevel: null,
                hash: null
            });
        }
    }

    return {
        entries,
        moduleVersions: Array.from(moduleVersions)
    };
}

/**
 * Loads mappings for all required module@version combinations
 * Downloads each unique module@version only once
 */
async function loadMappings(moduleVersions) {
    const mappings = {};
    const uniqueVersions = [...new Set(moduleVersions)]; // Deduplicate

    verboseLog(`${colors.cyan}Downloading mappings for ${uniqueVersions.length} unique module@version combination(s)${colors.reset}\n`);

    for (const moduleVersion of uniqueVersions) {
        const [moduleName, version] = moduleVersion.split('@').filter(Boolean);
        const fullModuleName = `@${moduleName}`;

        verboseLog(`${colors.cyan}Loading mapping for ${fullModuleName}@${version}${colors.reset}`);

        // For msal-browser, also load msal-common since msal-browser uses it internally
        if (fullModuleName === '@azure/msal-browser') {
            const browserMapping = await fetchRemoteMapping(fullModuleName, version);
            const commonMapping = await fetchRemoteMapping('@azure/msal-common', version);
            
            // Combine both mappings
            const combinedMapping = { logStrings: {} };
            
            if (browserMapping && browserMapping.logStrings) {
                Object.assign(combinedMapping.logStrings, browserMapping.logStrings);
            }
            
            if (commonMapping && commonMapping.logStrings) {
                Object.assign(combinedMapping.logStrings, commonMapping.logStrings);
            }
            
            if (Object.keys(combinedMapping.logStrings).length > 0) {
                mappings[moduleVersion] = combinedMapping;
                verboseLog(`${colors.green}✓ Loaded ${Object.keys(combinedMapping.logStrings).length} strings for ${moduleVersion} (combined msal-browser + msal-common)${colors.reset}`);
            } else {
                console.error(`${colors.yellow}⚠ Warning: Could not load mapping for ${moduleVersion}${colors.reset}`);
                mappings[moduleVersion] = { logStrings: {} };
            }
        } else {
            const mapping = await fetchRemoteMapping(fullModuleName, version);

            if (mapping) {
                mappings[moduleVersion] = mapping;
                verboseLog(`${colors.green}✓ Loaded ${Object.keys(mapping.logStrings || {}).length} strings for ${moduleVersion}${colors.reset}`);
            } else {
                console.error(`${colors.yellow}⚠ Warning: Could not load mapping for ${moduleVersion}${colors.reset}`);
                mappings[moduleVersion] = { logStrings: {} };
            }
        }
    }

    verboseLog(''); // Empty line after loading
    return mappings;
}

/**
 * Decodes all log entries using appropriate mappings
 * Returns decoded lines without color codes for file output
 */
function decodeLogEntries(entries, mappings, colorize = true) {
    const decodedLines = [];
    const stats = {
        total: 0,
        decoded: 0,
        notFound: 0,
        nonMsal: 0
    };

    for (const entry of entries) {
        if (!entry.moduleName) {
            // Non-MSAL line, output as-is
            decodedLines.push(entry.originalLine);
            stats.nonMsal++;
            continue;
        }

        stats.total++;
        const moduleVersion = `${entry.moduleName}@${entry.version}`;
        const mapping = mappings[moduleVersion];

        if (!mapping || !mapping.logStrings) {
            // No mapping available, output original
            decodedLines.push(entry.originalLine);
            stats.notFound++;
            continue;
        }

        const decodedMessage = mapping.logStrings[entry.hash];

        if (decodedMessage) {
            // Extract message text (handle both string and object formats)
            const messageText = typeof decodedMessage === 'string' 
                ? decodedMessage 
                : decodedMessage.message || decodedMessage;
            
            // Replace hash with decoded message
            if (colorize) {
                const color = logLevelColors[entry.logLevel] || colors.reset;
                const decodedLine = entry.originalLine.replace(entry.hash, `${color}${messageText}${colors.reset}`);
                decodedLines.push(decodedLine);
            } else {
                // No color codes for file output
                const decodedLine = entry.originalLine.replace(entry.hash, messageText);
                decodedLines.push(decodedLine);
            }
            stats.decoded++;
        } else {
            // Hash not found in mapping
            decodedLines.push(entry.originalLine);
            stats.notFound++;
        }
    }

    return { decodedLines, stats };
}

/**
 * Shows usage information
 */
function showUsage() {
    console.log(`
${colors.bright}MSAL Browser Log Decoder${colors.reset}

${colors.bright}Usage:${colors.reset}
  node scripts/decode-logs.cjs [options] <path-to-log-file>

${colors.bright}Options:${colors.reset}
  --verbose, -V    Enable verbose output for debugging
  --help, -h       Show this help message

${colors.bright}Examples:${colors.reset}
  node scripts/decode-logs.cjs ./console-logs.txt
  node scripts/decode-logs.cjs --verbose /Users/user/Downloads/browser-console.log
  npm run decode-logs -- ./logs/debug.log

${colors.bright}Log Format:${colors.reset}
  Expected format per line:
  [timestamp] : [correlation-id] : @azure/[module]@[version] : [LogLevel] - [hash]

  Example:
  [Tue, 07 Oct 2025 16:50:29 GMT] : [] : @azure/msal-browser@4.13.1 : Verbose - 0hoqeo
`);
}

/**
 * Parses command line arguments
 */
function parseArguments() {
    const args = process.argv.slice(2);
    let filePath = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--verbose' || arg === '-V') {
            isVerbose = true;
        } else if (arg === '--help' || arg === '-h') {
            return { help: true };
        } else if (!arg.startsWith('--') && !arg.startsWith('-')) {
            filePath = arg;
        }
    }

    return { filePath, help: false };
}

/**
 * Main function
 */
async function main() {
    // Parse command line arguments
    const { filePath, help } = parseArguments();

    if (help) {
        showUsage();
        return;
    }

    if (!filePath) {
        console.error(`${colors.red}Error: No log file path provided${colors.reset}`);
        showUsage();
        process.exit(1);
    }

    try {
        console.log(`${colors.bright}${colors.blue}MSAL Browser Log Decoder${colors.reset}\n`);

        // Step 1: Parse log file and identify all unique module@version combinations
        verboseLog(`${colors.cyan}Step 1: Scanning log file...${colors.reset}`);
        const { entries, moduleVersions } = parseLogFile(filePath);
        verboseLog(`${colors.green}✓ Found ${entries.length} log entries${colors.reset}`);
        verboseLog(`${colors.green}✓ Detected ${moduleVersions.length} unique module@version combination(s): ${moduleVersions.join(', ')}${colors.reset}\n`);

        // Step 2: Download all required mappings (only once per unique module@version)
        verboseLog(`${colors.cyan}Step 2: Downloading mappings...${colors.reset}`);
        const mappings = await loadMappings(moduleVersions);

        // Step 3: Decode log entries
        verboseLog(`${colors.cyan}Step 3: Decoding log entries...${colors.reset}`);
        const { decodedLines, stats } = decodeLogEntries(entries, mappings, false); // No color for file output

        // Step 4: Generate output file path
        const parsedPath = path.parse(filePath);
        const outputFilePath = path.join(
            parsedPath.dir,
            `${parsedPath.name}-decoded${parsedPath.ext}`
        );

        // Step 5: Write decoded logs to file
        fs.writeFileSync(outputFilePath, decodedLines.join('\n'), 'utf8');

        console.log(`${colors.green}✓ Successfully decoded logs${colors.reset}`);
        console.log(`${colors.cyan}Output saved to: ${colors.bright}${outputFilePath}${colors.reset}\n`);

        // Show stats
        console.log(`${colors.bright}${colors.cyan}Decoding Statistics:${colors.reset}`);
        console.log(`${colors.dim}Total MSAL entries: ${stats.total}${colors.reset}`);
        console.log(`${colors.green}Successfully decoded: ${stats.decoded}${colors.reset}`);
        if (stats.notFound > 0) {
            console.log(`${colors.yellow}Hashes not found: ${stats.notFound}${colors.reset}`);
        }
        if (stats.nonMsal > 0) {
            console.log(`${colors.dim}Non-MSAL lines: ${stats.nonMsal}${colors.reset}`);
        }

        if (isVerbose && moduleVersions.length > 1) {
            console.log(`\n${colors.dim}Note: Multiple module versions detected in the same file${colors.reset}`);
        }
    } catch (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        if (isVerbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
