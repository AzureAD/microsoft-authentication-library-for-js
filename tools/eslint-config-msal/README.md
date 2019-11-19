# @azuread/eslint-config-msal

ESLint configuration for MSAL.js libraries.

## Usage

### Install eslint:

```sh
npm install eslint@5 tslint @typescript-eslint/eslint-plugin-tslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Install config (via lerna):

```sh
npx lerna add @azuread/eslint-config-msal --scope=<library-name>
```

### Configure:

`eslintrc.json`
```json
{
    "extends": "@azuread/eslint-config-msal"
}
```

`package.json`
```json
{
    "scripts": {
        "lint": "eslint src test --ext .ts"
    }
}
```

## Publishing

To publish an update of this package, [follow this steps](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages#publishing-a-package) to generate an access token for Github.
