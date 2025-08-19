const fs = require('fs');
const path = require('path');
const PLUGIN_NAME = "logger-minify-plugin";

// Define which logger methods to target for minification
const LOGGER_METHODS = [
    'info', 'infoPii', 'verbose', 'verbosePii', 'trace', 'tracePii',
    'warning', 'warningPii', 'error', 'errorPii'
];

// Pattern to match simple quoted strings within logger calls
const SIMPLE_STRING_PATTERN = new RegExp(
    `((?:commonLogger|logger|log)\\.(${LOGGER_METHODS.join('|')})\\s*\\([\\s\\S]*?)` +
    `((?:\\\`[\\s\\S]*?\\\`|"(?:\\\\.|[^"])*"|'(?:\\\\.|[^'])*'))` +
    `([\\s\\S]*?\\);)`,
    'gm'
);

/**
 * Creates a consistent 6-char hash for a given string
 */
function createStringHash(str) {
    const cyrb64 = (str, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed,
            h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return [h2 >>> 0, h1 >>> 0];
    }

    const cyrb64Hash = (str, seed = 0) => {
        const [h2, h1] = cyrb64(str, seed);
        return h2.toString(36).padStart(7, "0") + h1.toString(36).padStart(7, "0");
    }

    return cyrb64Hash(str).substring(0, 6);
}

/**
 * Cleans a quoted string by removing quotes and normalizing whitespace
 */
function cleanMessage(quotedStr) {
    // Remove outer quotes and handle escaped quotes
    let cleaned = quotedStr.slice(1, -1);

    if (quotedStr.startsWith('`') && quotedStr.endsWith('`')) {
        // Template literal - preserve structure but normalize whitespace
        cleaned = cleaned.replace(/\\\n\s*/g, ''); // Remove line continuations
    } else {
        // Regular string - unescape quotes and normalize
        cleaned = cleaned.replace(/\\"/g, '"').replace(/\\'/g, "'");
    }

    return cleaned.trim();
}

/**
 * Creates the rollup plugin for logger string minification
 */
function loggerMinifyPlugin(options = {}) {
    const { outputFile = 'log-strings-mapping.json', verbose = false } = options;

    // Simple local mappings for this build
    const stringMappings = new Map();

    return {
        name: 'logger-minify',

        transform(code, id) {
            if (!(/\.(ts|js|mjs|cjs)$/.test(id))) {
                return null;
            }

            let transformedCode = code;
            let hasChanges = false;

            // SECOND PASS: Handle all string hashing (both original strings and normalized concatenations)
            transformedCode = transformedCode.replace(SIMPLE_STRING_PATTERN, (match, prefix, method, quotedString, suffix) => {
                const originalString = cleanMessage(quotedString);

                // Skip if this looks like a hash (8 character hex string)
                if (/^[a-f0-9]{8}$/.test(originalString)) {
                    return match;
                }

                // Handle template literals with variable normalization
                let hashableString;
                const isTemplateLiteral = quotedString.startsWith('`') && quotedString.endsWith('`');

                if (isTemplateLiteral) {
                    // Normalize template variables for consistent hashing
                    hashableString = originalString
                        //.replace(/\$\{this\.([^}]*)\}/g, '${$1}') // Remove 'this.' prefix
                        .replace(/\$\{[^}]*\}/g, (match) => {
                            const content = match.slice(2, -1).trim();
                            // Simple variable vs complex expression
                            if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(content)) {
                                return '${VAR}';
                            } else {
                                return '${EXPR}';
                            }
                        });
                } else {
                    hashableString = originalString;
                }

                const hash = createStringHash(hashableString);
                stringMappings.set(hash, originalString); // Store original for debugging
                hasChanges = true;

                return `${prefix}"${hash}"${suffix}`;
            });

            return hasChanges ? { code: transformedCode, map: null } : null;
        },

        generateBundle() {
            // Write mappings to file if we have any
            if (stringMappings.size > 0) {
                const outputDir = path.dirname(outputFile);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const mappingData = {
                    timestamp: new Date().toISOString(),
                    totalStrings: stringMappings.size,
                    mappings: Object.fromEntries(stringMappings)
                };

                fs.writeFileSync(outputFile, JSON.stringify(mappingData, null, 2));
                verbose && console.log(`Logger string mappings written to ${outputFile} (${stringMappings.size} strings)`);
            }
        }
    };
}

module.exports = { loggerMinifyPlugin };
