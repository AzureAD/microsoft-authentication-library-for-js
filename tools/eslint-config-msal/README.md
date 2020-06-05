# @azuread/eslint-config-msal

ESLint configuration for MSAL.js libraries.

## Configuration

In order to use packages published to the Github Registry, you must [configure npm to authenticate with the Github Registry](https://help.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages).

## Usage

Complete the following steps to set up eslint in VSCode.
1. Run the command `npm install -g eslint@5`
2. Install the eslint VSCode extension

### Install eslint

```sh
npm install eslint@5 tslint @typescript-eslint/eslint-plugin-tslint @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev
```

### Install config (via lerna)

```sh
npx lerna add @azuread/eslint-config-msal --scope=<library-name> --dev
```

### Configure

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
