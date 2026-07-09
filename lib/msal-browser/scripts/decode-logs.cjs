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
 * Usage:
 *   node scripts/decode-logs.cjs <path-to-log-file>
 *   node scripts/decode-logs.cjs --verbose <path-to-log-file>
 *   npm run decode-logs -- <path-to-log-file>
 *   npm run decode-logs -- --verbose /path/to/console.log
 *
 * Examples:
 *   node scripts/decode-logs.cjs ./console-logs.txt
 *   node scripts/decode-logs.cjs --verbose ./console-logs.txt
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
 * Sets verbose mode
 */
function setVerbose(verbose) {
    isVerbose = verbose;
}

/**
 * Downloads a file from URL
 */
function downloadFile(url, options = {}) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;

        const request = client.get(url, options, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }

            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
        });

        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Gets the cache directory path
 */
function getCacheDir() {
    const homeDir = require('os').homedir();
    const cacheDir = path.join(homeDir, '.msal-decoder-cache');

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    return cacheDir;
}

/**
 * Gets the cached mapping file path
 */
function getCachedMappingPath(libraryName, version) {
    const cacheDir = getCacheDir();
    const filename = `${libraryName.replace('@', '').replace('/', '-')}-${version}.json`;
    return path.join(cacheDir, filename);
}

/**
 * Checks if cached mapping is valid (exists and not older than 24 hours)
 */
function isCacheValid(cachePath) {
    if (!fs.existsSync(cachePath)) {
        return false;
    }

    const stats = fs.statSync(cachePath);
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const isRecent = (Date.now() - stats.mtime.getTime()) < oneDay;

    return isRecent;
}

/**
 * Gets the mapping file paths for a library
 */
function getMappingPaths(libraryName) {
    if (libraryName === '@azure/msal-browser') {
        return [
            'dist/log-strings-mapping.json',
            'lib/custom-auth-path/log-strings-mapping.json'
        ];
    } else if (libraryName === '@azure/msal-common') {
        return [
            'dist-browser/log-strings-mapping.json'
        ];
    }

    return ['dist/log-strings-mapping.json'];
}

/**
 * Gets local mapping file paths relative to script directory
 */
function getLocalMappingPaths(libraryName, scriptDir) {
    const paths = [];

    if (libraryName === '@azure/msal-browser') {
        paths.push(
            path.join(scriptDir, '..', 'dist', 'log-strings-mapping.json'),
            path.join(scriptDir, '..', 'lib', 'custom-auth-path', 'log-strings-mapping.json')
        );
    } else if (libraryName === '@azure/msal-common') {
        paths.push(
            path.join(scriptDir, '..', '..', 'msal-common', 'dist-browser', 'log-strings-mapping.json')
        );
    }

    return paths;
}

/**
 * Loads local mapping files as fallback
 */
function loadLocalMapping(libraryName, scriptDir) {
    const localPaths = getLocalMappingPaths(libraryName, scriptDir);

    for (const localPath of localPaths) {
        if (fs.existsSync(localPath)) {
            try {
                const content = fs.readFileSync(localPath, 'utf8');
                const data = JSON.parse(content);
                verboseLog(`${colors.green}✓ Using local mapping file: ${localPath}${colors.reset}`);
                return normalizeMapping(data);
            } catch (error) {
                verboseLog(`${colors.yellow}⚠ Failed to load local mapping ${localPath}: ${error.message}${colors.reset}`);
            }
        }
    }

    return null;
}

/**
 * Normalizes mapping data to consistent format
 */
function normalizeMapping(data) {
    if (data.logStrings) {
        return data;
    } else if (data.mappings) {
        const normalized = { logStrings: {} };
        for (const [hash, mapping] of Object.entries(data.mappings)) {
            normalized.logStrings[hash] = mapping.message || mapping;
        }
        return normalized;
    }
    return data;
}

/**
 * Resolves a dependency version spec to a concrete published version. MSAL pins
 * its internal @azure/msal-* dependencies to exact versions, so any range prefix
 * (^, ~, >=, etc.) is stripped to obtain the underlying version.
 */
function resolveDependencyVersion(spec) {
    if (typeof spec !== 'string') {
        return null;
    }
    const match = spec.match(/\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?/);
    return match ? match[0] : null;
}

/**
 * Fetches remote mapping from npm registry
 */
async function fetchRemoteMapping(libraryName, version, registryUrl = 'https://registry.npmjs.org', visited = new Set()) {
    verboseLog(`${colors.dim}Fetching mapping for ${libraryName}@${version} from npm registry${colors.reset}`);

    // Check cache first
    const cachePath = getCachedMappingPath(libraryName, version);
    if (isCacheValid(cachePath)) {
        verboseLog(`${colors.dim}Using cached mapping from ${cachePath}${colors.reset}`);
        const cachedContent = fs.readFileSync(cachePath, 'utf8');
        const cachedData = JSON.parse(cachedContent);
        return normalizeMapping(cachedData);
    }

    try {
        // Fetch package metadata
        const packageUrl = `${registryUrl}/${libraryName}`;
        const metadata = await downloadFile(packageUrl);
        const packageData = JSON.parse(metadata.toString());

        // Get the specific version or latest
        const versionData = version === 'latest'
            ? packageData.versions[packageData['dist-tags'].latest]
            : packageData.versions[version];

        if (!versionData) {
            throw new Error(`Version ${version} not found for ${libraryName}`);
        }

        const dependencies = versionData.dependencies || {};

        // Get tarball URL and download it
        const tarballUrl = versionData.dist.tarball;
        verboseLog(`${colors.dim}Downloading tarball from ${tarballUrl}${colors.reset}`);

        const tarballBuffer = await downloadFile(tarballUrl);
        const mappingPaths = getMappingPaths(libraryName);
        const allMappings = { logStrings: {} };

        // Extract mapping files from tarball
        for (const mappingPath of mappingPaths) {
            try {
                const mappingContent = await extractFileFromTarball(tarballBuffer, mappingPath);
                if (mappingContent) {
                    const mappingData = JSON.parse(mappingContent);
                    const normalized = normalizeMapping(mappingData);

                    if (normalized.logStrings) {
                        Object.assign(allMappings.logStrings, normalized.logStrings);
                        verboseLog(`${colors.green}  ✓ Found mapping file: ${mappingPath}${colors.reset}`);
                    }
                }
            } catch (error) {
                verboseLog(`${colors.dim}  - Not found: ${mappingPath}${colors.reset}`);
            }
        }

        // @azure/msal-common (and other @azure/msal-* dependencies) emit their log
        // strings through the Logger created by the wrapping package (e.g. msal-browser),
        // so those lines are labeled with the wrapper's package name rather than the
        // originating package. Merge the transitive @azure/msal-* dependency mappings so
        // those hashes resolve too. Own-package strings take precedence over dependency
        // strings on hash collisions.
        visited.add(`${libraryName}@${version}`);
        for (const [depName, depSpec] of Object.entries(dependencies)) {
            if (!depName.startsWith('@azure/msal-')) {
                continue;
            }
            const depVersion = resolveDependencyVersion(depSpec);
            if (!depVersion || visited.has(`${depName}@${depVersion}`)) {
                continue;
            }
            verboseLog(`${colors.dim}  Resolving dependency mapping ${depName}@${depVersion}${colors.reset}`);
            const depMapping = await fetchRemoteMapping(depName, depVersion, registryUrl, visited);
            if (depMapping && depMapping.logStrings) {
                let added = 0;
                for (const [hash, message] of Object.entries(depMapping.logStrings)) {
                    if (!(hash in allMappings.logStrings)) {
                        allMappings.logStrings[hash] = message;
                        added++;
                    }
                }
                verboseLog(`${colors.green}  ✓ Merged ${added} strings from ${depName}@${depVersion}${colors.reset}`);
            }
        }

        if (Object.keys(allMappings.logStrings).length > 0) {
            // Cache the mapping
            fs.writeFileSync(cachePath, JSON.stringify(allMappings, null, 2), 'utf8');
            verboseLog(`${colors.dim}Cached mapping to ${cachePath}${colors.reset}`);
            return allMappings;
        }

        throw new Error('No mapping files found in package');
    } catch (error) {
        verboseLog(`${colors.yellow}Failed to fetch remote mapping: ${error.message}${colors.reset}`);
        return null;
    }
}

/**
 * Extracts a specific file from a gzipped tarball buffer
 */
async function extractFileFromTarball(tarballBuffer, targetPath) {
    const zlib = require('zlib');

    return new Promise((resolve, reject) => {
        try {
            zlib.gunzip(tarballBuffer, (err, decompressed) => {
                if (err) {
                    reject(new Error(`Failed to decompress tarball: ${err.message}`));
                    return;
                }

                let offset = 0;
                const buffer = decompressed;

                while (offset < buffer.length) {
                    if (offset + 512 > buffer.length) break;

                    const header = buffer.slice(offset, offset + 512);
                    const filename = header.toString('utf8', 0, 100).replace(/\0.*$/, '');
                    const fileSizeOctal = header.toString('utf8', 124, 136).replace(/\0.*$/, '').trim();

                    if (!fileSizeOctal) {
                        offset += 512;
                        continue;
                    }

                    const fileSize = parseInt(fileSizeOctal, 8) || 0;
                    const paddedSize = Math.ceil(fileSize / 512) * 512;

                    if (filename.endsWith(targetPath) || filename === `package/${targetPath}`) {
                        const fileData = buffer.slice(offset + 512, offset + 512 + fileSize);
                        resolve(fileData.toString('utf8'));
                        return;
                    }

                    offset += 512 + paddedSize;
                }

                resolve(null);
            });
        } catch (error) {
            reject(new Error(`Tar extraction failed: ${error.message}`));
        }
    });
}

/**
 * Parses a log line and extracts module@version and hash information
 */
function parseLogLine(line) {
    const msalRegex = /(@azure\/msal-[a-z-]+|msal(?:\.[a-z]+)+)@([^:\s]+)\s*:\s*\w+\s*-\s*([a-zA-Z0-9]{6})(?=\s|$)([^\r\n]*)/;
    const match = line.match(msalRegex);

    if (!match) {
        return null;
    }

    const [, rawPackage, version, hash, rawArgs] = match;
    const module = normalizeModuleName(rawPackage);

    // Only msal-browser and msal-common strings are decodable by this script.
    // Other libraries (msal-react, msal-angular, msal-node, ...) are skipped.
    if (!module) {
        return null;
    }

    return {
        fullLine: line,
        moduleVersion: `@azure/${module}@${version}`,
        hash: hash,
        // Trailing variable values appended after the hash (may be empty)
        rawArgs: rawArgs || ''
    };
}

/**
 * Normalizes any MSAL package name or SKU to a canonical module family used as
 * the mapping pool key. Returns "msal-browser", "msal-common", or null when the
 * package is not one this script can decode.
 *
 * Examples:
 *   "@azure/msal-browser" -> "msal-browser"
 *   "msal.js.browser"     -> "msal-browser"  (browser SKU)
 *   "msal.js"             -> "msal-browser"  (generic browser SKU fallback)
 *   "@azure/msal-common"  -> "msal-common"
 *   "@azure/msal-react"   -> null            (not decoded here)
 */
function normalizeModuleName(rawPackage) {
    if (rawPackage === '@azure/msal-common') {
        return 'msal-common';
    }

    // Everything in the browser family: the scoped package, the browser SKU, or
    // the generic "msal.js" SKU.
    if (
        rawPackage === '@azure/msal-browser' ||
        rawPackage.startsWith('msal.js')
    ) {
        return 'msal-browser';
    }

    return null;
}/**
 * Parses log file and extracts all MSAL entries while preserving all original lines
 */
function parseLogFile(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Log file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const entries = [];
    const moduleVersionsSet = new Set();
    const allLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parsed = parseLogLine(line);

        if (parsed) {
            entries.push({ ...parsed, lineIndex: i });
            moduleVersionsSet.add(parsed.moduleVersion);
        }

        allLines.push(line);
    }

    return {
        entries,
        moduleVersions: Array.from(moduleVersionsSet),
        allLines
    };
}

/**
 * Loads mappings for all required module@version combinations
 */
async function loadMappings(moduleVersions) {
    const mappings = {};
    const uniqueVersions = [...new Set(moduleVersions)];

    verboseLog(`${colors.cyan}Downloading mappings for ${uniqueVersions.length} unique module@version combination(s)${colors.reset}\n`);

    for (const moduleVersion of uniqueVersions) {
        const [moduleName, version] = moduleVersion.split('@').filter(Boolean);
        const fullModuleName = `@${moduleName}`;

        verboseLog(`${colors.cyan}Loading mapping for ${fullModuleName}@${version}${colors.reset}`);

        const mapping = await fetchRemoteMapping(fullModuleName, version);

        if (mapping) {
            mappings[moduleVersion] = mapping;
            verboseLog(`${colors.green}✓ Loaded ${Object.keys(mapping.logStrings || {}).length} strings for ${moduleVersion}${colors.reset}`);
        } else {
            const localMapping = loadLocalMapping(fullModuleName, __dirname);
            if (localMapping) {
                mappings[moduleVersion] = localMapping;
                verboseLog(`${colors.green}✓ Using local mapping as fallback for ${moduleVersion}${colors.reset}`);
            } else {
                console.error(`${colors.yellow}⚠ Warning: Could not load mapping for ${moduleVersion}${colors.reset}`);
                mappings[moduleVersion] = { logStrings: {} };
            }
        }
    }

    verboseLog('');
    return mappings;
}

/**
 * Finds all `${...}` placeholder spans in a decoded template message, in source
 * order. Brace depth is tracked so nested braces (e.g. `${JSON.stringify({a:1})}`)
 * are handled correctly. Returns an array of { start, end } where `start` is the
 * index of the `$` and `end` is the index of the matching closing `}`.
 */
function findPlaceholders(template) {
    const spans = [];
    let i = 0;

    while (i < template.length) {
        if (template[i] === '$' && template[i + 1] === '{') {
            const start = i;
            let j = i + 2;
            let depth = 1;

            while (j < template.length && depth > 0) {
                if (template[j] === '{') {
                    depth++;
                } else if (template[j] === '}') {
                    depth--;
                    if (depth === 0) {
                        break;
                    }
                }
                j++;
            }

            spans.push({ start, end: j });
            i = j + 1;
        } else {
            i++;
        }
    }

    return spans;
}

/**
 * Injects the runtime variable values captured after a hash into the decoded
 * template's `${...}` placeholders.
 *
 * Values are appended by the logger-minify plugin in the same source order as
 * the placeholders, separated by single spaces. They are mapped one-to-one onto
 * the placeholders; if more tokens than placeholders are present (e.g. a trailing
 * value contained spaces), the final placeholder absorbs the remaining tokens.
 * Placeholders without a corresponding value are left intact so it is obvious the
 * value was not captured.
 *
 * @param {string} template Decoded message, e.g. "'${a}' from '${b}'"
 * @param {string} rawArgs  Trailing values from the log line, e.g. " oob ext-id"
 * @returns {string} The template with placeholders substituted by their values
 */
function injectVariables(template, rawArgs) {
    const spans = findPlaceholders(template);
    if (spans.length === 0) {
        return template;
    }

    const argsString = (rawArgs || '').trim();
    if (!argsString) {
        // No values captured (e.g. legacy logs or telemetry-style bare hash)
        return template;
    }

    const tokens = argsString.split(/\s+/);

    // Map tokens onto placeholders in order
    const values = [];
    if (tokens.length <= spans.length) {
        for (let k = 0; k < spans.length; k++) {
            values.push(k < tokens.length ? tokens[k] : null);
        }
    } else {
        for (let k = 0; k < spans.length - 1; k++) {
            values.push(tokens[k]);
        }
        // Last placeholder absorbs any remaining tokens
        values.push(tokens.slice(spans.length - 1).join(' '));
    }

    // Replace from end to start to keep earlier indices valid
    let result = template;
    for (let k = spans.length - 1; k >= 0; k--) {
        const value = values[k];
        if (value === null || value === undefined) {
            continue;
        }
        result =
            result.slice(0, spans[k].start) +
            value +
            result.slice(spans[k].end + 1);
    }

    return result;
}

/**
 * Decodes log entries using the provided mappings while preserving all original lines
 */
function decodeLogEntries(entries, mappings, allLines, useColors = true) {
    const decodedLines = [...allLines]; // Start with all original lines
    const stats = { total: 0, decoded: 0, notFound: 0, nonMsal: allLines.length - entries.length };

    // Create a map of MSAL entries by line index for efficient lookup
    const msalEntriesByLine = new Map();
    for (const entry of entries) {
        msalEntriesByLine.set(entry.lineIndex, entry);
    }

    // Process each MSAL entry and replace the corresponding line if we can decode it
    for (const entry of entries) {
        stats.total++;

        let decodedMessage = null;

        // First try the module-specific mapping
        const moduleMapping = mappings[entry.moduleVersion];
        if (moduleMapping && moduleMapping.logStrings && moduleMapping.logStrings[entry.hash]) {
            decodedMessage = moduleMapping.logStrings[entry.hash];
        } else {
            // If not found in module-specific mapping, search across all mappings
            for (const [mappingKey, mapping] of Object.entries(mappings)) {
                if (mapping && mapping.logStrings && mapping.logStrings[entry.hash]) {
                    decodedMessage = mapping.logStrings[entry.hash];
                    verboseLog(`${colors.dim}Hash ${entry.hash} found in ${mappingKey} instead of ${entry.moduleVersion}${colors.reset}`);
                    break;
                }
            }
        }

        if (decodedMessage) {
            // Extract log level from original line if possible
            const logLevelMatch = entry.fullLine.match(/\b(Error|ErrorPii|Warning|Info|InfoPii|Verbose|VerbosePii|Trace|TracePii)\b/i);
            const logLevel = logLevelMatch ? logLevelMatch[1].toLowerCase() : 'unknown';

            // Inject any runtime variable values captured after the hash into the
            // decoded template's ${...} placeholders
            const injectedMessage = injectVariables(decodedMessage, entry.rawArgs);

            // The encoded span in the original line is the hash plus its trailing
            // variable values; replace the whole span so the raw values are not
            // left duplicated after the decoded message.
            const encoded = `${entry.hash}${entry.rawArgs || ''}`;
            const replacementText = useColors
                ? `${logLevelColors[logLevel] || colors.gray}${injectedMessage}${colors.reset}`
                : injectedMessage;

            // Use a function replacement so '$' sequences in values/messages are
            // treated literally (not as String.replace special patterns).
            const decodedLine = entry.fullLine.replace(encoded, () => replacementText);

            // Replace the line at the correct index
            decodedLines[entry.lineIndex] = decodedLine;
            stats.decoded++;
        } else {
            stats.notFound++;
            // Keep the original line (already in decodedLines from the copy)
        }
    }

    return { decodedLines, stats };
}

/**
 * Parses command line arguments
 */
function parseArguments() {
    const args = process.argv.slice(2);
    let filePath = null;
    let help = false;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--verbose' || arg === '-V') {
            setVerbose(true);
        } else if (arg === '--help' || arg === '-h') {
            help = true;
        } else if (!arg.startsWith('-')) {
            filePath = arg;
        }
    }

    return { filePath, help };
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
  [timestamp] : [correlation-id] : @azure/[module]@[version] : [LogLevel] - [hash][ values...]

  The [hash] is a 6-character code, optionally followed by space-separated
  runtime values that are injected into the message's placeholders. Keep those
  trailing tokens intact - stripping them prevents variable injection.

  Example:
  [Tue, 07 Oct 2025 16:50:29 GMT] : [] : @azure/msal-browser@4.13.1 : Verbose - 0hoqeo
  [Thu, 11 Jun 2026 21:02:51 GMT] : [019eb87e] : @azure/msal-common@16.6.1 : Verbose - 1q3g2x 72f988bf {tenantid}
`);
}

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
        const { entries, moduleVersions, allLines } = parseLogFile(filePath);
        verboseLog(`${colors.green}✓ Found ${entries.length} log entries${colors.reset}`);
        verboseLog(`${colors.green}✓ Detected ${moduleVersions.length} unique module@version combination(s): ${moduleVersions.join(', ')}${colors.reset}\n`);

        // Step 2: Download all required mappings (only once per unique module@version)
        verboseLog(`${colors.cyan}Step 2: Downloading mappings...${colors.reset}`);
        const mappings = await loadMappings(moduleVersions);

        // Step 3: Decode log entries
        verboseLog(`${colors.cyan}Step 3: Decoding log entries...${colors.reset}`);
        const { decodedLines, stats } = decodeLogEntries(entries, mappings, allLines, false); // No color for file output

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

        if (moduleVersions.length > 1) {
            verboseLog(`\n${colors.dim}Note: Multiple module versions detected in the same file${colors.reset}`);
        }
    } catch (error) {
        console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
        verboseLog(error.stack);
        process.exit(1);
    }
}

// Export common functions for reuse in other scripts
module.exports = {
    colors,
    verboseLog,
    setVerbose,
    downloadFile,
    getCacheDir,
    getCachedMappingPath,
    isCacheValid,
    getMappingPaths,
    getLocalMappingPaths,
    loadLocalMapping,
    normalizeMapping,
    fetchRemoteMapping,
    extractFileFromTarball,
    parseLogLine,
    parseLogFile,
    normalizeModuleName,
    loadMappings,
    decodeLogEntries,
    findPlaceholders,
    injectVariables,
    parseArguments,
    showUsage,
    main
};

// Run if called directly
if (require.main === module) {
    main();
}
