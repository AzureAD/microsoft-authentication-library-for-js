const { RuleTester } = require('eslint');
const quoteLoggingVariables = require("../rules/quote-logging-variables");

const ruleTester = new RuleTester({
    parserOptions: { 
        ecmaVersion: 2020,
        sourceType: 'module'
    }
});

ruleTester.run(
    "quote-logging-variables",
    quoteLoggingVariables,
    {
        valid: [
            // Variables already properly quoted with single quotes
            {
                code: `this.logger.trace(\`Message with '\${variable}'\`);`
            },
            {
                code: `logger.error(\`Error: '\${error.message}'\`);`
            },
            {
                code: `this.logger.verbose(\`'\${this.platformAuthType}' - Sending request\`);`
            },
            // Multiple quoted variables
            {
                code: `this.logger.error(\`Error with '\${errorCode}' and '\${userId}'\`);`
            },
            // Complex expressions properly quoted
            {
                code: `this.logger.trace(\`Navigate to: '\${requestUrl}'\`);`
            },
            {
                code: `this.logger.info(\`Token refresh required due to cache outcome: '\${cacheOutcome}'\`);`
            },
            // Static strings without variables
            {
                code: `this.logger.trace("Simple message without variables");`
            },
            {
                code: `this.logger.error("Static error message");`
            },
            // Template literals without variables
            {
                code: `this.logger.verbose(\`Static message\`);`
            },
            // Non-logging method calls (should be ignored)
            {
                code: `console.log(\`Message with \${variable}\`);`
            },
            {
                code: `someOtherMethod(\`String \${variable}\`);`
            },
            // Conditional expressions properly quoted
            {
                code: `this.logger.trace(\`access token '\${index === -1 ? "added to" : "updated in"}' map\`);`
            },
            // JSON.stringify properly quoted
            {
                code: `this.logger.tracePii(\`Received response: '\${JSON.stringify(response)}'\`);`
            },
            // String concatenation (handled by other rule)
            {
                code: `this.logger.trace("Message " + variable);`
            }
        ],
        invalid: [
            // Basic unquoted variable
            {
                code: `this.logger.trace(\`Message with \${variable}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.trace(\`Message with '\${variable}'\`);`
            },
            // Error logging with unquoted variable
            {
                code: `this.logger.error(\`Error occurred: \${error}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.error(\`Error occurred: '\${error}'\`);`
            },
            // Member expression unquoted
            {
                code: `this.logger.verbose(\`Could not parse: \${e.message}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "MemberExpression"
                }],
                output: `this.logger.verbose(\`Could not parse: '\${e.message}'\`);`
            },
            // Complex member expression
            {
                code: `this.logger.trace(\`\${this.platformAuthType} - Sending request\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "MemberExpression"
                }],
                output: `this.logger.trace(\`'\${this.platformAuthType}' - Sending request\`);`
            },
            // Multiple unquoted variables - first fix only
            {
                code: `this.logger.error(\`Error: \${error.errorCode} with message: \${error.errorMessage}\`);`,
                errors: [
                    {
                        messageId: "unquotedVariable",
                        type: "MemberExpression"
                    },
                    {
                        messageId: "unquotedVariable", 
                        type: "MemberExpression"
                    }
                ],
                output: `this.logger.error(\`Error: '\${error.errorCode}' with message: \${error.errorMessage}\`);`
            },

            // After first fix, second variable can be fixed
            {
                code: `this.logger.error(\`Error: '\${error.errorCode}' with message: \${error.errorMessage}\`);`,
                errors: [
                    {
                        messageId: "unquotedVariable", 
                        type: "MemberExpression"
                    }
                ],
                output: `this.logger.error(\`Error: '\${error.errorCode}' with message: '\${error.errorMessage}'\`);`
            },
            // TracePii logging
            {
                code: `this.logger.tracePii(\`User info: \${userInfo}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.tracePii(\`User info: '\${userInfo}'\`);`
            },
            // Warn logging
            {
                code: `this.logger.warn(\`Warning: \${message}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.warn(\`Warning: '\${message}'\`);`
            },
            // Logger without 'this'
            {
                code: `logger.info(\`Info: \${details}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `logger.info(\`Info: '\${details}'\`);`
            },
            // Complex conditional expression
            {
                code: `this.logger.trace(\`access token \${index === -1 ? "added to" : "updated in"} map\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "ConditionalExpression"
                }],
                output: `this.logger.trace(\`access token '\${index === -1 ? "added to" : "updated in"}' map\`);`
            },
            // Function call expression
            {
                code: `this.logger.tracePii(\`Response: \${JSON.stringify(response)}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "CallExpression"
                }],
                output: `this.logger.tracePii(\`Response: '\${JSON.stringify(response)}'\`);`
            },
            // Multi-line template literal
            {
                code: `this.logger.verbose(
                    \`Could not parse home account ID for CCS Header: \${e}\`
                );`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.verbose(
                    \`Could not parse home account ID for CCS Header: '\${e}'\`
                );`
            },
            // Mixed quoted and unquoted (partially quoted)
            {
                code: `this.logger.error(\`Error with '\${errorCode}' and \${userId}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.error(\`Error with '\${errorCode}' and '\${userId}'\`);`
            },
            // VerbosePii logging
            {
                code: `this.logger.verbosePii(\`Redirect start page: \${redirectStartPage}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.verbosePii(\`Redirect start page: '\${redirectStartPage}'\`);`
            },
            // InfoPii logging
            {
                code: `this.logger.infoPii(\`Navigate to: \${requestUrl}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.infoPii(\`Navigate to: '\${requestUrl}'\`);`
            },
            // ErrorPii logging
            {
                code: `this.logger.errorPii(\`Attempted to parse: \${encodedTokenRequest}\`);`,
                errors: [{
                    messageId: "unquotedVariable",
                    type: "Identifier"
                }],
                output: `this.logger.errorPii(\`Attempted to parse: '\${encodedTokenRequest}'\`);`
            }
        ]
    }
);

console.log("All tests for quote-logging-variables rule passed!");
