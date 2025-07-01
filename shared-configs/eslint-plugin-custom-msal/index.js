const noClassMethodsInConstructorRule = require("./rules/no-class-methods-in-constructor");

const plugin = {
    rules: {
        "no-class-methods-in-constructor": noClassMethodsInConstructorRule
    }
}

module.exports = plugin;