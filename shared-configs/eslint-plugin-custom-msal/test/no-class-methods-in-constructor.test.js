const {RuleTester} = require('eslint');
const noClassMethodsInConstructorRule = require("../rules/no-class-methods-in-constructor");

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2015}
});

ruleTester.run(
    "no-class-methods-in-constructor",
    noClassMethodsInConstructorRule,
    {
        valid: [
            {
                code: "class A { constructor() { this.a = 1; } }"
            },
            {
                code: "class A { constructor() { externalMethod(); } }; function externalMethod() {}"
            },
            {
                code: "class A { constructor() {} method() {} }; class B { constructor() { this.a = new A(); this.a.method(); } }"
            }
        ],
        invalid: [
            {
                code: "class A { constructor() { this.internalMethod(); } internalMethod() {} }",
                errors: 1
            },
            {
                code: "class A { constructor() { this.a = this.internalMethod(); } internalMethod() {} }",
                errors: 1
            },
            {
                code: "class A { constructor() { externalMethod(this.internalMethod()); } internalMethod() {} }; function externalMethod() {}",
                errors: 1
            }
        ]
    }
)