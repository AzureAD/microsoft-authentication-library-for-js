const { RuleTester } = require('eslint');
const noStringConcatenationInLogging = require("../rules/no-string-concatenation-in-logging");

const ruleTester = new RuleTester({
    parserOptions: { 
        ecmaVersion: 2020,
        sourceType: 'module'
    }
});

ruleTester.run(
    "no-string-concatenation-in-logging",
    noStringConcatenationInLogging,
    {
        valid: [
            // Template literals are allowed
            {
                code: `this.logger.trace(\`Message with \${variable}\`);`
            },
            {
                code: `logger.error(\`Error: \${error.message}\`);`
            },
            {
                code: `this.logger.verbose(\`\${this.platformAuthType} - Sending request\`);`
            },
            // Single string literals are allowed
            {
                code: `this.logger.trace("Simple message");`
            },
            {
                code: `logger.error("Static error message");`
            },
            // Non-logging method calls with concatenation are allowed
            {
                code: `console.log("Message " + variable);`
            },
            {
                code: `someOtherMethod("String " + variable);`
            },
            // Multiple arguments without concatenation
            {
                code: `this.logger.trace("Message", variable, "more text");`
            },
            // Concatenation in non-logging contexts
            {
                code: `const message = "Hello " + name; this.logger.trace(message);`
            }
        ],
        invalid: [
            // Basic string concatenation
            {
                code: `this.logger.trace("Message " + variable);`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.trace(\`Message \${variable}\`);`
            },
            // Error logging with concatenation
            {
                code: `this.logger.error("Error occurred: " + error);`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.error(\`Error occurred: \${error}\`);`
            },
            // Verbose logging with concatenation
            {
                code: `this.logger.verbose("Could not parse: " + e);`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.verbose(\`Could not parse: \${e}\`);`
            },
            // Complex concatenation with member expression
            {
                code: `this.logger.trace(this.platformAuthType + " - Sending request");`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.trace(\`\${this.platformAuthType} - Sending request\`);`
            },
            // Multiple concatenations
            {
                code: `this.logger.error("Error: " + error.message + " in " + context);`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.error(\`Error: \${error.message} in \${context}\`);`
            },
            // TracePii logging
            {
                code: `this.logger.tracePii("User info: " + userInfo);`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.tracePii(\`User info: \${userInfo}\`);`
            },
            // Warn logging
            {
                code: `this.logger.warn("Warning: " + message);`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.warn(\`Warning: \${message}\`);`
            },
            // Logger without 'this'
            {
                code: `logger.info("Info: " + details);`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `logger.info(\`Info: \${details}\`);`
            },
            // Multi-line concatenation
            {
                code: `this.logger.verbose(
                    "Could not parse home account ID for CCS Header: " +
                        e
                );`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.verbose(
                    \`Could not parse home account ID for CCS Header: \${e}\`
                );`
            },
            // Variable + string concatenation
            {
                code: `this.logger.trace(prefix + ": Processing request");`,
                errors: [{
                    messageId: "noConcatenation",
                    type: "BinaryExpression"
                }],
                output: `this.logger.trace(\`\${prefix}: Processing request\`);`
            }
        ]
    }
);

console.log("All tests for no-string-concatenation-in-logging rule passed!");
