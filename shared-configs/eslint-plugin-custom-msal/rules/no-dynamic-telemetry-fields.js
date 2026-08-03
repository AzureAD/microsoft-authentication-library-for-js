/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @fileoverview ESLint rule to disallow dynamic (computed) telemetry field names
 * that are not defined in PerformanceEvent. Dynamic fields must use the "ext." prefix
 * so they are automatically routed to the PerformanceEvent.ext sub-object.
 * Additionally validates that static (non-computed) field names match known
 * PerformanceEvent properties to catch typos and invalid field names. This also
 * covers global telemetry fields (addGlobalFields), which are stamped onto every
 * emitted event and must likewise be defined in PerformanceEvent so downstream
 * (e.g. 1P Kusto) pipelines pick them up.
 */

const fs = require("fs");
const path = require("path");

/**
 * Default path to the 3P PerformanceEvent type definition,
 * resolved relative to this rule file's location in the repo.
 */
const DEFAULT_PERFORMANCE_EVENT_PATH = path.resolve(
    __dirname,
    "../../../lib/msal-common/src/telemetry/performance/PerformanceEvent.ts"
);

/** Cache for extracted field names keyed by resolved file path */
const fieldNameCache = new Map();

/**
 * Extract property names from `type PerformanceEvent = { ... }` blocks in a
 * TypeScript file. Handles both plain type definitions and intersection types
 * (e.g., `type PerformanceEvent = Event & { ... }`). Only fields inside
 * braces belonging to PerformanceEvent are collected.
 * @param {string} filePath - Absolute path to the TypeScript file
 * @returns {Set<string>} Set of extracted property names
 */
function extractFieldNames(filePath) {
    const resolved = path.resolve(filePath);
    if (fieldNameCache.has(resolved)) {
        return fieldNameCache.get(resolved);
    }

    const fieldNames = new Set();
    try {
        const content = fs.readFileSync(resolved, "utf8");
        // Match every `type PerformanceEvent = ...` block and extract fields
        // from all `{ ... }` bodies within it (handles intersection types).
        const typeBlockRegex =
            /\btype\s+PerformanceEvent\b[^=]*=\s*([\s\S]*?)\n\};/g;
        let blockMatch;
        while ((blockMatch = typeBlockRegex.exec(content)) !== null) {
            const body = blockMatch[1];
            const fieldRegex = /^\s+(\w+)\??\s*:/gm;
            let fieldMatch;
            while ((fieldMatch = fieldRegex.exec(body)) !== null) {
                fieldNames.add(fieldMatch[1]);
            }
        }
    } catch {
        // File not found or not readable — skip silently
    }

    fieldNameCache.set(resolved, fieldNames);
    return fieldNames;
}

module.exports = {
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow dynamic (computed) telemetry field names not defined in PerformanceEvent. Dynamic fields must use the 'ext.' prefix. Also validates static field names against known PerformanceEvent properties.",
            category: "Best Practices",
            recommended: true,
        },
        schema: [
            {
                type: "object",
                properties: {
                    telemetryMethods: {
                        type: "array",
                        items: { type: "string" },
                        default: [
                            "addFields",
                            "addGlobalFields",
                            "incrementFields",
                            "add",
                            "increment",
                        ],
                    },
                    performanceEventVariablePattern: {
                        type: "string",
                        description:
                            "Regex pattern to match variable names that hold PerformanceEvent objects",
                        default: "[Ee]vent",
                    },
                    allowedFieldFiles: {
                        type: "array",
                        items: { type: "string" },
                        description:
                            "Additional TypeScript type definition files to extract allowed field names from. Paths are resolved relative to CWD.",
                        default: [],
                    },
                    additionalAllowedFields: {
                        type: "array",
                        items: { type: "string" },
                        description:
                            "Explicit field names to allow in addition to those extracted from type files.",
                        default: [],
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            noDynamicFields:
                "Dynamic telemetry field name '{{name}}' is not allowed in '{{method}}()'. Use the 'ext.' prefix for computed field names (e.g., `ext.${fieldName}`) or use a static field name defined in PerformanceEvent.",
            noDynamicAssignment:
                "Dynamic property assignment on performance event object '{{object}}' is not allowed. Use the 'ext' sub-object for computed field names (e.g., {{object}}.ext[fieldName]).",
            unknownStaticField:
                "Unknown telemetry field '{{name}}' in '{{method}}()'. Use a field defined in PerformanceEvent or the 'ext.' prefix for dynamic fields.",
        },
    },

    create(context) {
        const options = context.options[0] || {};
        const telemetryMethods = options.telemetryMethods || [
            "addFields",
            "addGlobalFields",
            "incrementFields",
            "add",
            "increment",
        ];
        const eventVarPattern = new RegExp(
            options.performanceEventVariablePattern || "[Ee]vent"
        );
        const additionalAllowedFields = options.additionalAllowedFields || [];
        const allowedFieldFiles = options.allowedFieldFiles || [];
        const sourceCode = context.getSourceCode();

        // Build the set of allowed static field names
        const allowedStaticFields = new Set(additionalAllowedFields);

        // Always try to load the default 3P PerformanceEvent type
        for (const name of extractFieldNames(DEFAULT_PERFORMANCE_EVENT_PATH)) {
            allowedStaticFields.add(name);
        }

        // Load additional type definition files (resolved from CWD)
        if (allowedFieldFiles.length > 0) {
            const cwd =
                typeof context.getCwd === "function"
                    ? context.getCwd()
                    : process.cwd();
            for (const filePath of allowedFieldFiles) {
                const resolved = path.isAbsolute(filePath)
                    ? filePath
                    : path.resolve(cwd, filePath);
                for (const name of extractFieldNames(resolved)) {
                    allowedStaticFields.add(name);
                }
            }
        }

        /**
         * Checks if a computed key expression starts with "ext."
         * Handles template literals, string concatenation, and plain string literals.
         */
        function isDynamicPrefix(node) {
            if (node.type === "TemplateLiteral") {
                // Template literal: check if first quasi starts with "ext."
                return (
                    node.quasis.length > 0 &&
                    node.quasis[0].value.raw.startsWith("ext.")
                );
            }
            if (node.type === "BinaryExpression" && node.operator === "+") {
                // String concatenation: check leftmost part recursively
                return isDynamicPrefix(node.left);
            }
            if (node.type === "Literal" && typeof node.value === "string") {
                return node.value.startsWith("ext.");
            }
            return false;
        }

        /**
         * Extract a readable name from the computed key for the error message
         */
        function getComputedKeyText(node) {
            return sourceCode.getText(node);
        }

        /**
         * Check if a node is a call to one of the telemetry methods
         */
        function isTelemetryMethodCall(node) {
            if (node.type !== "CallExpression") return false;
            if (node.callee.type === "MemberExpression") {
                const property = node.callee.property;
                const methodName = property.name || property.value;
                return telemetryMethods.includes(methodName);
            }
            return false;
        }

        /**
         * Get method name from a call expression
         */
        function getMethodName(node) {
            if (node.callee.type === "MemberExpression") {
                return node.callee.property.name || node.callee.property.value;
            }
            return "unknown";
        }

        /**
         * Check if a variable name looks like a PerformanceEvent object
         */
        function isPerformanceEventVariable(name) {
            return eventVarPattern.test(name);
        }

        /**
         * Extract the object name from a member expression for error reporting
         */
        function getObjectName(node) {
            if (node.type === "Identifier") {
                return node.name;
            }
            if (
                node.type === "MemberExpression" &&
                node.property.type === "Identifier"
            ) {
                return node.property.name;
            }
            return sourceCode.getText(node);
        }

        return {
            // Check telemetry method calls: addFields({ [computed]: val }), incrementFields, add, increment
            CallExpression(node) {
                if (!isTelemetryMethodCall(node)) return;

                const firstArg = node.arguments[0];
                if (!firstArg || firstArg.type !== "ObjectExpression") return;

                const methodName = getMethodName(node);

                for (const prop of firstArg.properties) {
                    if (prop.type === "SpreadElement") continue;
                    if (prop.computed) {
                        // Computed property key — only allow if starts with "ext."
                        if (!isDynamicPrefix(prop.key)) {
                            context.report({
                                node: prop.key,
                                messageId: "noDynamicFields",
                                data: {
                                    name: getComputedKeyText(prop.key),
                                    method: methodName,
                                },
                            });
                        }
                    } else {
                        // Non-computed key (Identifier or string Literal)
                        const keyName =
                            prop.key.type === "Identifier"
                                ? prop.key.name
                                : prop.key.value;
                        // String-literal keys starting with "ext." are valid
                        // dynamic prefixes (addFields routes them at runtime)
                        if (
                            typeof keyName === "string" &&
                            keyName.startsWith("ext.")
                        ) {
                            continue;
                        }
                        // Otherwise validate against known PerformanceEvent fields
                        if (
                            allowedStaticFields.size > 0 &&
                            keyName &&
                            !allowedStaticFields.has(keyName)
                        ) {
                            context.report({
                                node: prop.key,
                                messageId: "unknownStaticField",
                                data: {
                                    name: keyName,
                                    method: methodName,
                                },
                            });
                        }
                    }
                }
            },

            // Check direct indexed assignment on event objects: rootEvent[computedKey] = value
            // Only rootEvent.ext[key] = value is allowed; rootEvent[key] = value
            // is always reported because it bypasses the ext routing in addFields/incrementFields.
            AssignmentExpression(node) {
                if (node.left.type !== "MemberExpression") return;
                if (!node.left.computed) return;

                const object = node.left.object;

                // Allow: eventObj.ext[key] = value
                if (
                    object.type === "MemberExpression" &&
                    !object.computed &&
                    object.property.type === "Identifier" &&
                    object.property.name === "ext"
                ) {
                    return;
                }

                const objectName = getObjectName(object);

                if (
                    objectName &&
                    isPerformanceEventVariable(objectName)
                ) {
                    context.report({
                        node: node.left,
                        messageId: "noDynamicAssignment",
                        data: { object: objectName },
                    });
                }
            },
        };
    },
};
