# eslint-config-msal

ESLint configuration for MSAL.js libraries. Private package that is only available in the MSAL.js monorepo.

## Usage

### Install eslint:

```sh
npm install eslint@5 tslint @typescript-eslint/eslint-plugin-tslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Install config (via lerna):

```sh
npx lerna add eslint-config-msal --scope=<library-name>
```

### Configure:

`eslintrc.json`
```json
{
    "extends": "eslint-config-msal"
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
