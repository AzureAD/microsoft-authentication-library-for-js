const noClassMethodsInConstructorRule = require("./rules/no-class-methods-in-constructor");
const errorDescriptionIsDefined = require("./rules/error-description-is-defined");
const noStringConcatenationInLogging = require("./rules/no-string-concatenation-in-logging");
const quoteLoggingVariables = require("./rules/quote-logging-variables");
const noDynamicTelemetryFields = require("./rules/no-dynamic-telemetry-fields");

const plugin = {
    rules: {
        "no-class-methods-in-constructor": noClassMethodsInConstructorRule,
        "error-description-is-defined": errorDescriptionIsDefined,
        "no-string-concatenation-in-logging": noStringConcatenationInLogging,
        "quote-logging-variables": quoteLoggingVariables,
        "no-dynamic-telemetry-fields": noDynamicTelemetryFields
    }
}

module.exports = plugin;
