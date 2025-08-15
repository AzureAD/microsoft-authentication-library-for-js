module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Enforce that all variables and expressions in logging template literals are wrapped with single quotes",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    loggerMethods: {
                        type: "array",
                        items: { type: "string" },
                        default: ["trace", "tracePii", "error", "errorPii", "verbose", "verbosePii", "warn", "warnPii", "info", "infoPii"]
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unquotedVariable: "Variables and expressions in logging template literals should be wrapped with single quotes for hash consistency.",
            suggestion: "Wrap variable with single quotes: '${{{variable}}}'"
        }
    },

    create(context) {
        const options = context.options[0] || {};
        const loggerMethods = options.loggerMethods || ["trace", "tracePii", "error", "errorPii", "verbose", "verbosePii", "warn", "warnPii", "info", "infoPii"];
        const sourceCode = context.getSourceCode();

        /**
         * Checks if a node is a logging method call
         * @param {Object} node - The CallExpression node
         * @returns {boolean} - True if it's a logging method call
         */
        function isLoggingMethodCall(node) {
            if (node.type !== "CallExpression") {
                return false;
            }

            // Check for this.logger.method() or logger.method()
            if (node.callee.type === "MemberExpression") {
                const methodName = node.callee.property.name;
                const objectName = node.callee.object.name;
                const isLoggerObject = objectName === "logger" ||
                    (node.callee.object.type === "MemberExpression" &&
                     node.callee.object.property.name === "logger");

                return loggerMethods.includes(methodName) && isLoggerObject;
            }

            return false;
        }

        /**
         * Checks if an expression in a template literal needs quotes
         * @param {Object} templateLiteral - The TemplateLiteral node
         * @param {number} expressionIndex - Index of the expression
         * @returns {boolean} - True if expression needs quotes
         */
        function needsQuotes(templateLiteral, expressionIndex) {
            const beforeQuasi = templateLiteral.quasis[expressionIndex];
            const afterQuasi = templateLiteral.quasis[expressionIndex + 1];
            
            if (!beforeQuasi || !afterQuasi) {
                return false;
            }
            
            const beforeText = beforeQuasi.value.raw;
            const afterText = afterQuasi.value.raw;
            
            // Check if already properly quoted
            return !(beforeText.endsWith("'") && afterText.startsWith("'"));
        }

        /**
         * Creates a fixer function to add quotes around an expression
         * @param {Object} templateLiteral - The TemplateLiteral node
         * @param {number} expressionIndex - Index of the expression to quote
         * @returns {Function} - Fixer function
         */
        function createFixer(templateLiteral, expressionIndex) {
            return function(fixer) {
                // Reconstruct the entire template literal with proper quotes
                let newTemplate = "`";
                
                for (let i = 0; i < templateLiteral.quasis.length; i++) {
                    const quasi = templateLiteral.quasis[i];
                    let quasiText = quasi.value.raw;
                    
                    // Add the quasi text
                    newTemplate += quasiText;
                    
                    // Add expression if not the last quasi
                    if (i < templateLiteral.expressions.length) {
                        const expr = templateLiteral.expressions[i];
                        const exprText = sourceCode.getText(expr);
                        
                        if (i === expressionIndex) {
                            // This is the expression we're fixing - add quotes
                            const beforeQuasi = templateLiteral.quasis[i];
                            const afterQuasi = templateLiteral.quasis[i + 1];
                            const needsBefore = !beforeQuasi.value.raw.endsWith("'");
                            const needsAfter = !afterQuasi.value.raw.startsWith("'");
                            
                            if (needsBefore) {
                                newTemplate += "'";
                            }
                            newTemplate += "${" + exprText + "}";
                            if (needsAfter) {
                                newTemplate += "'";
                            }
                        } else {
                            newTemplate += "${" + exprText + "}";
                        }
                    }
                }
                newTemplate += "`";
                
                return fixer.replaceText(templateLiteral, newTemplate);
            };
        }

        return {
            CallExpression(node) {
                if (!isLoggingMethodCall(node)) {
                    return;
                }

                // Check each argument for template literals
                for (const arg of node.arguments) {
                    if (arg.type === "TemplateLiteral") {
                        // Check each expression in the template literal
                        for (let i = 0; i < arg.expressions.length; i++) {
                            if (needsQuotes(arg, i)) {
                                const expression = arg.expressions[i];
                                const variableText = sourceCode.getText(expression);
                                
                                context.report({
                                    node: expression,
                                    messageId: "unquotedVariable",
                                    fix: createFixer(arg, i),
                                    suggest: [
                                        {
                                            messageId: "suggestion",
                                            data: { variable: variableText },
                                            fix: createFixer(arg, i)
                                        }
                                    ]
                                });
                            }
                        }
                    }
                }
            }
        };
    },
};
