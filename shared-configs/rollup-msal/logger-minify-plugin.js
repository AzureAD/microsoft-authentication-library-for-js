const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PLUGIN_NAME = "logger-minify-plugin";

// Define which logger methods to target for minification
const LOGGER_METHODS = [
    'info', 'infoPii', 'verbose', 'verbosePii', 'trace', 'tracePii',
    'warning', 'warningPii', 'error', 'errorPii'
];

// Enhanced pattern to match logger calls with string concatenations
const CONCAT_PATTERN = new RegExp(
    `((?:commonLogger|logger)\\.(${LOGGER_METHODS.join('|')})\\s*\\()` +
    `([^;]*?)` +  // Capture everything inside the parentheses (including concatenations)
    `(\\);)`,     // Match the closing );
    'gm'
);

// Pattern to match simple quoted strings within logger calls
const SIMPLE_STRING_PATTERN = new RegExp(
    `((?:commonLogger|logger)\\.(${LOGGER_METHODS.join('|')})\\s*\\([\\s\\S]*?)` +
    `((?:\\\`[\\s\\S]*?\\\`|"(?:\\\\.|[^"])*"|'(?:\\\\.|[^'])*'))` +
    `([\\s\\S]*?\\);)`,
    'gm'
);

/**
 * Creates a consistent hash for a given string
 */
function createStringHash(str) {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
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

    return cleaned;
    //return cleaned.trim();
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
            // Only process TypeScript/JavaScript files
            if (!(/\.(ts|js|mjs)$/.test(id))) {
                return null;
            }

            let transformedCode = code;
            let hasChanges = false;

            // FIRST PASS: Handle concatenated expressions by converting them to template literals
            // transformedCode = transformedCode.replace(CONCAT_PATTERN, (match, prefix, method, content, suffix) => {
            //     // Check if this is a concatenation with + operators
            //     if (content.includes('+')) {
            //         // Create a normalized template for hashing purposes
            //         // Parse the concatenation parts more carefully
            //         const parts = [];
            //         let currentPart = '';
            //         let insideString = false;
            //         let stringChar = '';
            //         let parenLevel = 0;
            //         let templateLevel = 0;

            //         for (let i = 0; i < content.length; i++) {
            //             const char = content[i];
            //             const prevChar = i > 0 ? content[i - 1] : '';

            //             if (char === '(' && !insideString) parenLevel++;
            //             if (char === ')' && !insideString) parenLevel--;
            //             if (char === '{' && !insideString) templateLevel++;
            //             if (char === '}' && !insideString) templateLevel--;

            //             if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\' && parenLevel === 0 && templateLevel === 0) {
            //                 if (!insideString) {
            //                     insideString = true;
            //                     stringChar = char;
            //                 } else if (char === stringChar) {
            //                     insideString = false;
            //                     stringChar = '';
            //                 }
            //             }

            //             if (char === '+' && !insideString && parenLevel === 0 && templateLevel === 0) {
            //                 parts.push(currentPart.trim());
            //                 currentPart = '';
            //             } else {
            //                 currentPart += char;
            //             }
            //         }

            //         if (currentPart.trim()) {
            //             parts.push(currentPart.trim());
            //         }

            //         // Build normalized template for hashing
            //         let normalizedTemplate = '';

            //         for (const part of parts) {
            //             // Check if this part is a quoted string
            //             if (/^["'`]/.test(part) && /["'`]$/.test(part)) {
            //                 // Extract the string content
            //                 const cleanedString = cleanMessage(part);
            //                 normalizedTemplate += cleanedString;
            //             } else {
            //                 // This is a variable or expression - use placeholder
            //                 normalizedTemplate += "${";
            //                 normalizedTemplate += part;
            //                 normalizedTemplate += "}";
            //             }
            //         }

            //         // Create a hash for the normalized template
            //         //const hash = createStringHash(normalizedTemplate);
            //         //stringMappings.set(hash, normalizedTemplate);
            //         const res = `${prefix}"${normalizedTemplate}"${suffix}`;

            //         if (verbose) {
            //             console.log(`${PLUGIN_NAME}: before concatenation: ${content}`);
            //             console.log(`${PLUGIN_NAME}: after concatenation: ${res}`);
            //         }

            //         return `${res}`;
            //     }

            //     return match;
            // });

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
