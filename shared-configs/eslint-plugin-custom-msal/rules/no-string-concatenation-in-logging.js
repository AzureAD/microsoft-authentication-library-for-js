module.exports = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Prohibit string concatenation in logging calls and suggest template literals instead",
            category: "Best Practices",
            recommended: true,
        },
        hasSuggestions: true,
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
                    ignoreModules: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            noConcatenation: "Avoid string concatenation in logging calls. Use template literals instead.",
            suggestion: "Replace with template literal: `{{suggestion}}`"
        }
    },

    create(context) {
        const options = context.options[0] || {};
        const ignoreModules = options.ignoreModules;
        const fileName = context.getFilename();
        
        for (const ignoreModule of ignoreModules) {
            if (fileName.includes(ignoreModule)) {
        if (ignoreModules) {
            for (const ignoreModule of ignoreModules) {
                if (fileName.includes(ignoreModule)) {
                    return {};
                }
            }
        }

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

            if (node.callee.type === "MemberExpression") {
                const methodName = node.callee.property.name;
                const objectName = node.callee.object.name;
                const loggerObjectNames = ["logger", "commonLogger", "log"];
                const isLoggerObject = loggerObjectNames.includes(objectName) ||
                    (node.callee.object.type === "MemberExpression" &&
                     loggerObjectNames.includes(node.callee.object.property.name));
                return loggerMethods.includes(methodName) && isLoggerObject;
            }

            return false;
        }

        /**
         * Checks if an expression contains string concatenation
         * @param {Object} node - The expression node
         * @returns {boolean} - True if contains concatenation
         */
        function hasConcatenation(node) {
            if (node.type === "BinaryExpression" && node.operator === "+") {
                // Check if at least one side is a string literal
                const leftIsString = node.left.type === "Literal" && typeof node.left.value === "string";
                const rightIsString = node.right.type === "Literal" && typeof node.right.value === "string";

                // Don't flag if it's just numeric addition
                if (!leftIsString && !rightIsString) {
                    const leftIsNumber = node.left.type === "Literal" && typeof node.left.value === "number";
                    const rightIsNumber = node.right.type === "Literal" && typeof node.right.value === "number";
                    if (leftIsNumber || rightIsNumber) {
                        return false;
                    }
                }

                // If we have string concatenation, check further
                if (leftIsString || rightIsString ||
                    node.left.type === "Identifier" ||
                    node.left.type === "MemberExpression" ||
                    node.right.type === "Identifier" ||
                    node.right.type === "MemberExpression") {
                    return true;
                }

                // Recursively check nested expressions
                return hasConcatenation(node.left) || hasConcatenation(node.right);
            }

            return false;
        }

        /**
         * Converts a concatenation expression to template literal
         * @param {Object} node - The expression node
         * @returns {string} - Template literal equivalent
         */
        function convertToTemplateLiteral(node) {
            if (node.type === "Literal" && typeof node.value === "string") {
                // Escape any backticks and ${ in the string literal
                return node.value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
            }

            if (node.type === "Identifier") {
                return "${" + node.name + "}";
            }

            if (node.type === "MemberExpression") {
                return "${" + sourceCode.getText(node) + "}";
            }

            if (node.type === "BinaryExpression" && node.operator === "+") {
                const left = convertToTemplateLiteral(node.left);
                const right = convertToTemplateLiteral(node.right);
                return left + right;
            }

            if (node.type === "CallExpression" || node.type === "ConditionalExpression") {
                return "${" + sourceCode.getText(node) + "}";
            }

            // For other expressions, use the original text
            return "${" + sourceCode.getText(node) + "}";
        }

        return {
            CallExpression(node) {
                if (!isLoggingMethodCall(node)) {
                    return;
                }

                // Check each argument for concatenation
                for (const arg of node.arguments) {
                    if (hasConcatenation(arg)) {
                        const suggestion = convertToTemplateLiteral(arg);

                        context.report({
                            node: arg,
                            messageId: "noConcatenation",
                            fix(fixer) {
                                return fixer.replaceText(arg, "`" + suggestion + "`");
                            },
                            suggest: [
                                {
                                    messageId: "suggestion",
                                    data: { suggestion: "`" + suggestion + "`" },
                                    fix(fixer) {
                                        return fixer.replaceText(arg, "`" + suggestion + "`");
                                    }
                                }
                            ]
                        });
                    }
                }
            }
        };
    },
};
