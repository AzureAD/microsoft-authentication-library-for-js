const {RuleTester} = require('eslint');
const errorDescriptionIsDefinedTest = require("../rules/error-description-is-defined");
const path = require("path");
const errorDocPath = path.resolve(__dirname, "errors.md");
const options = [{ "errorDocPath": errorDocPath, "ignoreModules": [] }];
const filename = "testErrorCodes.ts";

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2020 }
});

ruleTester.run(
    "error-description-is-defined",
    errorDescriptionIsDefinedTest,
    {
        valid: [
            {
                code: `const testErrorCode1 = "test_error_code1";`,
                filename,
                options
            },
            {
                code: `const testErrorCode1 = "test_error_code1"; const testErrorCode2 = "test_error_code2";`,
                filename,
                options
            },
            {
                code: `const testErrorCode1 = "test_error_code1"; const testErrorCode2 = "test_error_code2"; const testErrorCode3 = "test_error_code3";`,
                filename,
                options
            },
            {
                code: `const testErrorCode1 = "some_random_code"; const testErrorCode2 = "another_random_code";`,
                filename: "ClientApplication.ts",
                options
            }
        ],
        invalid: [
            {
                code: `const testErrorCode1 = "test_error_code";`,
                filename,
                options,
                errors: 1
            },
            {
                code: `const testErrorCode1 = "test_error_code123";`,
                filename,
                options,
                errors: 1
            },
            {
                code: `const testErrorCode1 = "test_error_code1"; const testErrorCode2 = "dummy_error_code";`,
                filename,
                options,
                errors: 1
            },
        ]
    }
)
