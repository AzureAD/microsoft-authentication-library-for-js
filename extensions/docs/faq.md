# General

## Electron

### What to do when the library asks for a specific version of node?
If you are using this extension for Electron, you might face an error similar to this:
```
Uncaught Exception:
Error: The module 
"<path-to-project>\node_modules\...\dpapi.node" was compiled against a different Node.js version using NODE_MODULE_VERSION 85. This version of Node.js requires NODE_MODULE_VERSION 80. Please try re-compiling or re-installing the module...."
```
This error is probably due to Node.js version differences between the Electron project and the extension. This can be handled by re-building the package with the following steps:
- Install ```electron-rebuild``` with the command ```npm i -D electron-rebuild``` if you don't already have it installed.
- Remove ```packages-lock.json``` from your project if it exists
- Run ```./node_modules/.bin/electron-rebuild```

## Webpack

### How do I fix the `Uncaught ReferenceError: require is not defined` error when using webpack to bundle msal-node-extensions?

In main.ts, where the new instance of BrowserWindow is created, make sure that you set `nodeIntegration` to `true` and `contextIsolation` to `false` under webPreferences. If you skip this step, you might run into a `Uncaught ReferenceError: require is not defined` error. To keep this simple, remove any preloading scripts.

```ts
const mainWindow = new BrowserWindow({
  height: 600,
  webPreferences: {
    contextIsolation: false,
    nodeIntegration: true
  },
  width: 800
});
```

### How do I bundle the *.node binaries that ship with msal-node-extensions with webpack?

You need to add a node-loader to your webpack config, to load the *.node files.

First, run

```
npm install node-loader --save-dev
```

Then, add another rule in the rules array in the module object in your webpack.config.js (similar to what you have already for ts-loader):
```json
{
   test: /\.node$/,
   loader: 'node-loader',
}
```
This indicates webpack to use the node-loader when it encounters a .node file extension.