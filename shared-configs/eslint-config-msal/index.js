module.exports = {
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "sourceType": "module",
        "ecmaFeatures": {
            "modules": true
        },
        "project": "./tsconfig.json"
    },
    "plugins": [
        "security",
        "import",
        "header",
        "react"
    ],
    "extends": [
        "plugin:@angular-eslint/base",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:security/recommended",
        "plugin:import/typescript",
        "prettier"
    ],
    "ignorePatterns": [
        "*.d.ts",
        "*.spec.ts",
        "**/*/dist",
        "samples"
    ],
    "rules": {
        "@angular-eslint/component-class-suffix": 2,
        "@angular-eslint/contextual-lifecycle": 2,
        "@angular-eslint/directive-class-suffix": 2,
        "@angular-eslint/no-attribute-decorator": 1,
        "@angular-eslint/no-conflicting-lifecycle": 2,
        "@angular-eslint/no-empty-lifecycle-method": 2,
        "@angular-eslint/no-host-metadata-property": 2,
        "@angular-eslint/no-input-rename": 2,
        "@angular-eslint/no-inputs-metadata-property": 2,
        "@angular-eslint/no-output-native": 2,
        "@angular-eslint/no-output-on-prefix": 2,
        "@angular-eslint/no-output-rename": 2,
        "@angular-eslint/no-outputs-metadata-property": 2,
        "@angular-eslint/no-pipe-impure": 1,
        "@angular-eslint/use-lifecycle-interface": 1,
        "@angular-eslint/use-pipe-transform-interface": 2,
        "@typescript-eslint/array-type": 0,
        "@typescript-eslint/ban-ts-comment": 0,
        "@typescript-eslint/ban-types": 0,
        "@typescript-eslint/camelcase": 0,
        "@typescript-eslint/explicit-member-accessibility": 0,
        "@typescript-eslint/explicit-module-boundary-types": 2,
        "@typescript-eslint/interface-name-prefix": 0,
        "@typescript-eslint/member-delimiter-style": 0,
        "@typescript-eslint/no-angle-bracket-type-assertion": 0,
        "@typescript-eslint/no-empty-function": 1,
        "@typescript-eslint/no-explicit-any": 2,
        "@typescript-eslint/no-inferrable-types": 0,
        "@typescript-eslint/no-non-null-assertion": 2,
        "@typescript-eslint/no-object-literal-type-assertion": 0,
        "@typescript-eslint/no-unused-vars": 2,
        "@typescript-eslint/prefer-interface": 0,
        "@typescript-eslint/no-floating-promises": 2,
        "@typescript-eslint/return-await": 2,
        "eol-last": 2,
        "eqeqeq": 2,
        "header/header": [
            2,
            "block",
            [
                "",
                " * Copyright (c) Microsoft Corporation. All rights reserved.",
                " * Licensed under the MIT License.",
                " "
            ],
            2
        ],
        "import/first": 2,
        "import/no-commonjs": 2,
        "import/no-duplicates": 2,
        "import/no-extraneous-dependencies": 2,
        "import/no-unresolved": 2,
        "import/no-unused-modules": 2,
        "import/no-useless-path-segments": 2,
        "max-len": [
            0,
            {
                "code": 130,
                "ignoreComments": false,
                "ignoreRegExpLiterals": true,
                "ignoreTrailingComments": false,
                "ignoreUrls": true
            }
        ],
        "multiline-comment-style": [
            2,
            "starred-block"
        ],
        "no-console": 2,
        "no-multiple-empty-lines": [
            2,
            {
                "max": 1
            }
        ],
        "no-param-reassign": 2,
        "no-restricted-syntax": [
            1,
            {
                "selector": "TSEnumDeclaration",
                "message": "Use object literals instead of enums whenever possible"
            }
        ],
        "no-var": 2,
        "prefer-const": 2,
        "react/jsx-closing-bracket-location": 2,
        "react/jsx-closing-tag-location": 2,
        "react/jsx-curly-spacing": [
            2,
            {
                "when": "never",
                "attributes": {
                    "allowMultiline": false
                },
                "children": true
            }
        ],
        "react/jsx-filename-extension": [
            2,
            {
                "extensions": [
                    ".jsx",
                    ".tsx"
                ],
                "allow": "as-needed"
            }
        ],
        "react/jsx-pascal-case": 2,
        "react/jsx-tag-spacing": 2,
        "react/jsx-wrap-multilines": 2,
        "react/no-array-index-key": 2,
        "react/no-multi-comp": 2,
        "react/no-string-refs": 2,
        "react/prefer-stateless-function": 2,
        "react/self-closing-comp": 2,
        "react/sort-comp": 2,
        "security/detect-non-literal-fs-filename": 0,
        "security/detect-object-injection": 0,
        "spaced-comment": 2
    },
    "settings": {
        "react": {
            "version": "18.3.1"
        },
        "import/resolver": {
            "typescript": {} // this loads <rootdir>/tsconfig.json to eslint
        }
    }
};