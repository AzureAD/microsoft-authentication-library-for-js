const fs = require('fs');
const path = require('path');

// Define which logger methods to target for minification
const LOGGER_METHODS = [
    'info', 'infoPii', 'verbose', 'verbosePii', 'trace', 'tracePii',
    'warning', 'warningPii', 'error', 'errorPii'
];

// Optimized patterns to avoid quadratic backtracking
// Matches both direct logger calls and chained method calls that end with logger methods
// Examples: logger.verbose(, this.getLogger().info(, obj.getLogger().error(
const LOGGER_CALL_START = new RegExp(
    `((?:(?:commonLogger|logger|log)[?!]?|\\w+\\.getLogger\\(\\)[?!]?)\\.(${LOGGER_METHODS.join('|')})\\s*\\()`,
    'g'
);

/**
 * Efficiently find string literals within logger calls using linear parsing
 * instead of complex regex that can cause quadratic performance.
 *
 * Supports both direct logger calls and chained method calls:
 * - Direct: logger.verbose(...), commonLogger.info(...), log.error(...)
 * - Chained: this.getLogger().verbose(...), obj.getLogger().info(...)
 */
function findLoggerStrings(code) {
    const results = [];
    let match;

    // Reset regex state
    LOGGER_CALL_START.lastIndex = 0;

    while ((match = LOGGER_CALL_START.exec(code)) !== null) {
        const startPos = match.index;
        const prefixEnd = match.index + match[0].length;

        // Parse from the opening parenthesis to find the string literal
        const stringInfo = parseLoggerArguments(code, prefixEnd, startPos, match[0]);
        if (stringInfo) {
            results.push(stringInfo);
        }
    }

    return results;
}

/**
 * Linear parser to find string literals in logger arguments
 * Avoids regex backtracking by using state machine approach
 *
 * Logger calls follow the pattern: logger.method(message, correlationId, ...other args)
 * We need to find the FIRST non-empty string argument (the actual log message)
 */
function parseLoggerArguments(code, startPos, loggerStartPos, prefix) {
    let pos = startPos;
    let depth = 1; // We're already inside the first parenthesis
    let inString = false;
    let stringChar = '';
    const stringLiterals = []; // Store all string literals found

    // Extract the logger method from the prefix (e.g., "logger.info(" -> "info")
    const methodMatch = prefix.match(new RegExp(`\\.(${LOGGER_METHODS.join('|')})\\s*\\($`));
    const logLevel = methodMatch ? methodMatch[1] : 'unknown';

    while (pos < code.length && depth > 0) {
        const char = code[pos];
        const prevChar = pos > 0 ? code[pos - 1] : '';

        if (!inString) {
            if (char === '(' || char === '[' || char === '{') {
                depth++;
            } else if (char === ')' || char === ']' || char === '}') {
                depth--;
                if (depth === 0 && char === ')') {
                    // Find the first non-empty string literal (the actual log message)
                    for (const literal of stringLiterals) {
                        const content = literal.text.slice(1, -1); // Remove quotes
                        if (content.trim().length > 0) {
                            // This is the actual log message
                            // Calculate the middle part (between logger call start and the string)
                            const middle = code.slice(startPos, literal.start);
                            // The suffix includes everything from the end of this string to the closing paren
                            const suffix = code.slice(literal.end + 1, pos + 1);
                            return {
                                startPos: loggerStartPos,
                                endPos: pos + 1,
                                prefix, // The original prefix (logger.method()
                                middle, // Everything between opening paren and the string
                                quotedString: literal.text,
                                suffix,
                                logLevel
                            };
                        }
                    }
                    break;
                }
            } else if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                inString = true;
                stringChar = char;
                const stringStart = pos;

                // Find the end of this string
                let stringPos = pos + 1;
                let templateDepth = (char === '`') ? 1 : 0; // Track ${} nesting in template literals

                while (stringPos < code.length) {
                    const c = code[stringPos];
                    const p = stringPos > 0 ? code[stringPos - 1] : '';

                    // Handle template literal ${} expressions
                    if (stringChar === '`') {
                        if (c === '$' && stringPos + 1 < code.length && code[stringPos + 1] === '{') {
                            templateDepth++;
                            stringPos += 2; // Skip ${
                            continue;
                        } else if (c === '}' && templateDepth > 1) {
                            templateDepth--;
                            stringPos++;
                            continue;
                        }
                    }

                    // Check for end of string
                    if (c === stringChar && p !== '\\' && (stringChar !== '`' || templateDepth === 1)) {
                        // Found the end of the string
                        stringLiterals.push({
                            start: stringStart,
                            end: stringPos,
                            text: code.slice(stringStart, stringPos + 1)
                        });
                        pos = stringPos; // Skip to the end of the string
                        inString = false;
                        break;
                    }
                    stringPos++;
                }
            }
        }

        pos++;
    }

    return null;
}

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

function getPackageVersion(packageJsonPath) {
        // Try to read package.json for version
        let packageVersion;
        try {
            if (fs.existsSync(packageJsonPath)) {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                packageVersion = pkg.version;
            }
        } catch (error) {
            throw Error(`Could not read package version ${error.message}`);
        }

        if (!packageVersion) {
            throw Error(`Could not read package version from ${packageJsonPath}`);
        }

        return packageVersion;
    }

/**
 * Cleans a quoted string by removing quotes and normalizing whitespace
 */
function cleanMessage(quotedStr) {
    // Remove outer quotes and handle escaped quotes
    let cleaned = quotedStr.slice(1, -1);

    if (quotedStr.startsWith('`') && quotedStr.endsWith('`')) {
        // Template literal - preserve structure but normalize whitespace
        // Use simple string replacement instead of regex to avoid backtracking
        while (cleaned.includes('\\\n')) {
            cleaned = cleaned.replace('\\\n', '');
        }
        // Remove whitespace after line continuations
        cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    } else {
        // Regular string - unescape quotes manually to avoid regex
        cleaned = cleaned.split('\\"').join('"').split("\\'").join("'");
    }

    return cleaned.trim();
}

/**
 * Optimized function to replace quoted variables without regex backtracking
 */
function normalizeTemplateVariables(str) {
    let result = '';
    let i = 0;

    while (i < str.length) {
        if (str[i] === "'" && i + 1 < str.length && str.substring(i + 1, i + 3) === '${') {
            // Found start of quoted variable: '${
            const varStart = i;
            let j = i + 3; // Skip past '${
            let depth = 1;

            // Find the matching closing brace
            while (j < str.length && depth > 0) {
                if (str[j] === '{') depth++;
                else if (str[j] === '}') depth--;
                j++;
            }

            // Check if we have the closing quote after the brace
            if (j < str.length && str[j] === "'") {
                // Replace the entire quoted variable with {VAR}
                result += '{VAR}';
                i = j + 1; // Skip past the closing quote
            } else {
                // Not a properly quoted variable, just add the character
                result += str[i];
                i++;
            }
        } else {
            result += str[i];
            i++;
        }
    }

    return result;
}

/**
 * Extracts the interpolated expressions (the contents of each `${...}`) from a
 * template literal, in source order. Returns an array of the raw expression
 * strings, e.g. for `` `User ${id} did ${action.toUpperCase()}` `` it returns
 * ['id', 'action.toUpperCase()'].
 *
 * Uses a linear parser (no regex backtracking) and correctly handles nested
 * braces, string literals, and nested template literals inside expressions.
 */
function extractTemplateExpressions(templateText) {
    const expressions = [];
    // Skip the surrounding backticks
    const end = templateText.length - 1;
    let i = 1;

    while (i < end) {
        const char = templateText[i];

        if (char === '\\') {
            // Skip escaped character in the literal portion
            i += 2;
            continue;
        }

        if (char === '$' && templateText[i + 1] === '{') {
            // Start of an interpolation
            let j = i + 2;
            let depth = 1;

            while (j < templateText.length && depth > 0) {
                const c = templateText[j];

                if (c === '\\') {
                    j += 2;
                    continue;
                }

                if (c === '{') {
                    depth++;
                } else if (c === '}') {
                    depth--;
                    if (depth === 0) {
                        break;
                    }
                } else if (c === '"' || c === "'" || c === '`') {
                    // Skip over a nested string/template literal
                    const quote = c;
                    j++;
                    while (j < templateText.length) {
                        if (templateText[j] === '\\') {
                            j += 2;
                            continue;
                        }
                        if (templateText[j] === quote) {
                            break;
                        }
                        j++;
                    }
                }

                j++;
            }

            const expression = templateText.slice(i + 2, j).trim();
            if (expression.length > 0) {
                expressions.push(expression);
            }
            i = j + 1; // Skip past the closing brace
            continue;
        }

        i++;
    }

    return expressions;
}

/**
 * Creates the rollup plugin for logger string minification
 */
function loggerMinifyPlugin(options = {}) {
    const { outputFile = '', verbose = false, packageJsonPath = '' } = options;

    // Simple local mappings for this build
    const stringMappings = new Map();

    return {
        name: 'logger-minify',

        transform(code, id) {
            if (!(/\.(ts|js|mjs|cjs)$/.test(id))) {
                return null;
            }

            // Use optimized linear parsing instead of regex
            const loggerCalls = findLoggerStrings(code);
            if (loggerCalls.length === 0) {
                return null;
            }

            let transformedCode = code;
            let hasChanges = false;

            // Process from end to start to maintain string positions
            for (let i = loggerCalls.length - 1; i >= 0; i--) {
                const { startPos, endPos, prefix, middle, quotedString, suffix, logLevel } = loggerCalls[i];

                const originalString = cleanMessage(quotedString);

                // Skip strings that are already minified to avoid creating a
                // "hash of a hash". This happens when an already-minified bundle
                // is processed again (e.g. msal-browser re-bundles the minified
                // msal-common output). An already-minified message is either:
                //   - a bare 6-char hash: "0nxk52", or
                //   - a 6-char hash followed by appended ${...} variables:
                //     "0nxk52 ${subMeasurement.name} ${event.name}"
                // The hash alphabet is lowercase base36 (see createStringHash).
                if (
                    /^[a-z0-9]{6}$/.test(originalString) ||
                    /^[a-z0-9]{6} \$\{/.test(originalString)
                ) {
                    continue;
                }

                // Handle template literals with variable normalization
                let hashableString;
                const isTemplateLiteral = quotedString.startsWith('`') && quotedString.endsWith('`');

                if (isTemplateLiteral) {
                    // Use optimized function instead of regex
                    hashableString = normalizeTemplateVariables(originalString);
                } else {
                    hashableString = originalString;
                }

                const hash = createStringHash(hashableString);

                // Store both original message and logger method for debugging
                stringMappings.set(hash, {
                    message: originalString,
                    level: logLevel,
                    //hashableString: hashableString !== originalString ? hashableString : undefined
                });
                hasChanges = true;

                // Replace the message with the hash. For template literals that
                // contain interpolated variables, preserve those variables by
                // appending them after the hash so they remain visible in local
                // (console) logs. The static text - which dominates bundle size -
                // is still dropped in favor of the hash. The leading hash is what
                // telemetry captures, so the appended variables never reach telemetry.
                let minifiedMessage = `"${hash}"`;
                if (isTemplateLiteral) {
                    const expressions = extractTemplateExpressions(quotedString);
                    if (expressions.length > 0) {
                        const interpolations = expressions
                            .map((expression) => `\${${expression}}`)
                            .join(' ');
                        minifiedMessage = `\`${hash} ${interpolations}\``;
                    }
                }

                const replacement = `${prefix}${middle}${minifiedMessage}${suffix}`;
                transformedCode = transformedCode.slice(0, startPos) + replacement + transformedCode.slice(endPos);
            }

            return hasChanges ? { code: transformedCode, map: null } : null;
        },

        generateBundle() {
            // Write mappings to file if we have any
            if (outputFile && stringMappings.size > 0) {
                const outputDir = path.dirname(outputFile);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                // Convert Map to object with enhanced structure
                const mappingsObject = {};
                for (const [hash, data] of stringMappings.entries()) {
                    mappingsObject[hash] = data;
                }

                const mappingData = {
                    timestamp: new Date().toISOString(),
                    packageVersion: getPackageVersion(packageJsonPath),
                    totalStrings: stringMappings.size,
                    mappings: mappingsObject,
                };

                fs.writeFileSync(outputFile, JSON.stringify(mappingData, null, 2));
                verbose && console.log(`Logger string mappings written to ${outputFile} (${stringMappings.size} strings)`);
            }
        }
    };
}

module.exports = { loggerMinifyPlugin };
