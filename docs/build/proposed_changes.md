# Introduction

This document contains proposed changes to the msal.js build and packaging system.  

## References

- [npm workspaces overview](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [run command support for workspaces](https://docs.npmjs.com/cli/v7/commands/npm-run-script#workspaces-support)
- [exec command support for workspaces](https://docs.npmjs.com/cli/v7/commands/npm-exec#workspaces-support)

## Current Depedencies

The following are a list of tools used to build, test and publish msal.js packages:

- lerna
- beachball
- jest
- karma (angular only?)
- tsc (typescript compiler/transpiler)

## Immediate Updates

### Lerna

- Remove lerna
  - We're not using lerna to manage versions (we're using beachball)
  - We don't need lerna to issue commands any longer to all of our packages


### npm workspaces

npm workspaces allow all projects in a mono-repo to share the same node_modules foler for improved install and build performance.  In addition npm workspaces will create 

```bash

# Update package.json to create workspaces section and add the existing lib folder
npm init -w ./lib/*
# etc....

```

### inter repo package depedencies

With npm workspaces you can add a dependency to a specific package rather than the root of the project by using the workspace parameter with npm install.  You can do this public packages as well as with other packages in the same repo.

```bash

# Add msal-common as a package depency of msal-browser (specifying the package )
npm i lib/msal-common -w lib/msal-browser

```

### specifying a specific package

If you want to refer to a specific package when using an npm command from the route, you can refer to the package using:

- workspace name
- workspace directory/path

The following shortcuts were added to the root package json

```json
{
"msal-common": "npm -workspace=@azure/msal-common run",
    "msal-browser": "npm -workspace=@azure/msal-browser run",
    "msal": "npm -workspace=msal run",
    "msal-node": "npm -workspace=@azure/msal-node run",
    "msal-react": "npm -workspace=@azure/msal-react run",
    "msal-angular": "npm -workspace=@azure/msal-angular run",
    "node-token-validation": "npm -workspace=@azure/node-token-validation run",
    "token-validation": "npm run node-token-validation",
    }
```

Here's an example of how to use the short cuts to run a script (task):

```bash

npm run msal-react build

```

### specifying all packages 

You can execute an npm command for all packages by specifying:

- "--workspaces" or "-ws"
- directory/path containing all workspaces

### running tasks from the root project

npm workspaces only support the following commands from the root of the project:

### issues

1. Typescript configuration issue

- [tslib error](https://github.com/microsoft/TypeScript/issues/37991)
  - Resolved using the change to tsconfig in the the msal workpace (msal-core)

```json
{
    "compilerOptions": {
        "baseUrl": "../../",
        "paths": {
            "tslib" : ["./node_modules/tslib/tslib.d.ts"]
        }
    }
}

```
