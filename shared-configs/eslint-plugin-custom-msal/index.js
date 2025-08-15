const noClassMethodsInConstructorRule = require("./rules/no-class-methods-in-constructor");
const errorDescriptionIsDefined = require("./rules/error-description-is-defined");
const noStringConcatenationInLogging = require("./rules/no-string-concatenation-in-logging");

const plugin = {
    rules: {
        "no-class-methods-in-constructor": noClassMethodsInConstructorRule,
        "error-description-is-defined": errorDescriptionIsDefined,
        "no-string-concatenation-in-logging": noStringConcatenationInLogging
    }
}

module.exports = plugin;
