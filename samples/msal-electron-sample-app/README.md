
MSAL Electron PoC Sample App
==============================================================

This directory contains a sample Electron desktop application for the msal-electron-poc library. This sample is provided to demonstrate how developers can use the msal-electron-poc library in an Electron application and recommended best practices for doing so.

## Instructions
1. Build the [msal-electron-proof-of-concept](../../lib/msal-electron-proof-of-concept) project (using `npm install`) in its own directory.
2. Run `npm install` in this directory.

3. Windows and macOS:

    Run `npm start` to launch this project.

4. Linux:

    In some cases, `npm start` will not work on Linux based systems. If that is your case, manually compile and execute the application with `tsc && electron dist/app.js`.
