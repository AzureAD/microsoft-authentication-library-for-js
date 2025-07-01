const fs = require("fs");

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "Ensure all error codes are documented",
        },
        schema: [
            {
                type: "object",
                properties: {
                    errorDocPath: {
                        type: "string",
                    },
                    ignoreModules: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },

        ],
    },
    create(context) {
        const options = context.options[0] || {};
        const ignoreModules = options.ignoreModules;
        const fileName = context.getFilename();

        for (const ignoreModule of ignoreModules) {
            if (fileName.includes(ignoreModule)) {
                return {};
            }
        }

        if (!fileName.includes('ErrorCodes')) {
            return {};
        }

        const errorDocPath = options.errorDocPath;
        if (!errorDocPath) {
            return {};
        }

        const errorDocContent = fs.readFileSync(errorDocPath, "utf-8");

        return {
            VariableDeclaration(node) {
                for (const declaration of node.declarations) {
                    const errorCode = declaration.init.value;
                    if (errorCode && !errorDocContent.includes("### `" + errorCode + "`")) {
                        context.report({
                            node: declaration,
                            message: `Error code ${errorCode} must be documented in ${errorDocPath}`,
                        });
                    }
                }
            },
        };
    },
};
