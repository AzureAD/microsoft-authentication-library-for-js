const noClassMethodsInConstructorRule = require("./rules/no-class-methods-in-constructor");
const errorDescriptionIsDefined = require("./rules/error-description-is-defined");

const plugin = {
    rules: {
        "no-class-methods-in-constructor": noClassMethodsInConstructorRule,
        "error-description-is-defined": errorDescriptionIsDefined
    }
}

module.exports = plugin;
